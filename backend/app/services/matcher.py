from __future__ import annotations

from typing import Any

from pydantic import BaseModel

from backend.app.schemas.campaign import (
    AgeDistributionItem,
    AudienceProfileOutput,
    BudgetAllocationItem,
    CollaborationSuggestion,
    ContentCalendarItem,
    DimensionScore,
    EstimatedPerformance,
    ExecutionPlan,
    GenderRatio,
    KOLMatch,
    MatchReasoning,
    OutreachDraft,
    PriceRange,
    ProductData,
)
from backend.app.schemas.questionnaire import QuestionnaireInput
from backend.app.services.ai import LLMClient
from backend.app.services.kol_store import KOLStore


MATCH_WEIGHTS = {
    "pet_type": 0.24,
    "topic_fit": 0.22,
    "audience_fit": 0.18,
    "budget_fit": 0.16,
    "engagement": 0.10,
    "platform_fit": 0.10,
}

CLAIM_KEYWORDS = {
    "high_protein": ["protein", "premium", "nutrition", "scientific", "feeding", "golden", "large-breed"],
    "grain_free": ["premium", "nutrition", "formula", "science", "selection"],
    "limited_ingredient": ["nutrition", "novice", "selection", "science", "health"],
    "fresh_ingredients": ["premium", "lifestyle", "refined", "feeding"],
    "digestive_health": ["health", "nutrition", "science", "care"],
    "skin_coat": ["healing", "premium", "health", "care"],
    "joint_support": ["training", "large-breed", "health", "care"],
    "vet_backed": ["nutrition", "certified", "science", "professional", "vet-backed"],
    "premium_imported": ["premium", "import", "high-value", "refined", "lifestyle"],
}

CLAIM_LABELS = {
    "high_protein": "high protein",
    "grain_free": "grain-free formula",
    "limited_ingredient": "limited ingredients",
    "fresh_ingredients": "fresh ingredients",
    "digestive_health": "digestive support",
    "skin_coat": "skin and coat support",
    "joint_support": "joint support",
    "vet_backed": "expert-backed credibility",
    "premium_imported": "premium imported positioning",
}

POSITIONING_LABELS = {
    "scientific": "science-led feeding",
    "natural": "natural ingredients",
    "premium_import": "premium import",
    "functional": "functional nutrition",
    "palatability": "palatability upgrade",
}

BUDGET_RANGES = {
    "lt10k": (0, 10_000),
    "10k_30k": (10_000, 30_000),
    "30k_80k": (30_000, 80_000),
    "gt80k": (80_000, 1_000_000_000),
}


class KOLTextEnhancement(BaseModel):
    kol_id: str
    headline: str
    specific_fit: str
    past_brand_relevance: str
    content_angle: str
    sample_title: str
    sample_hook: str
    key_message: str


class KOLTextEnhancementBatch(BaseModel):
    items: list[KOLTextEnhancement]


class KOLMatcher:
    def __init__(self) -> None:
        self.store = KOLStore()
        self.client = LLMClient()

    def match(self, questionnaire: QuestionnaireInput, product: ProductData) -> list[KOLMatch]:
        return self.rank(questionnaire, product, limit=3, enrich=True)

    def rank(
        self,
        questionnaire: QuestionnaireInput,
        product: ProductData,
        *,
        limit: int | None = 3,
        enrich: bool = True,
    ) -> list[KOLMatch]:
        profiles = self.store.list_profiles()
        scored: list[tuple[int, dict[str, Any], dict[str, DimensionScore]]] = []

        for profile in profiles:
            breakdown = self._score_breakdown(questionnaire, product, profile)
            total = round(
                breakdown["pet_type_match"].score * MATCH_WEIGHTS["pet_type"]
                + breakdown["topic_fit"].score * MATCH_WEIGHTS["topic_fit"]
                + breakdown["audience_fit"].score * MATCH_WEIGHTS["audience_fit"]
                + breakdown["budget_fit"].score * MATCH_WEIGHTS["budget_fit"]
                + breakdown["engagement_rate"].score * MATCH_WEIGHTS["engagement"]
                + breakdown["platform_fit"].score * MATCH_WEIGHTS["platform_fit"]
            )
            if profile["has_expert_background"]:
                total = min(100, total + 5)
            scored.append((total, profile, breakdown))

        scored.sort(key=lambda item: item[0], reverse=True)
        selected = scored if limit is None else scored[:limit]
        matches = [
            self._to_match(index, score, profile, breakdown, questionnaire, product)
            for index, (score, profile, breakdown) in enumerate(selected)
        ]
        if not enrich:
            return matches
        return self._enrich_matches(matches, questionnaire, product)

    def build_execution_plan(self, matches: list[KOLMatch], questionnaire: QuestionnaireInput) -> ExecutionPlan:
        selected = matches[:3]
        total = 0
        budget_items: list[BudgetAllocationItem] = []
        calendar: list[ContentCalendarItem] = []

        for week, match in enumerate(selected, start=1):
            midpoint = round((match.price_range.min + match.price_range.max) / 2)
            total += midpoint
            budget_items.append(
                BudgetAllocationItem(
                    kol_name=match.name,
                    amount=f"¥{midpoint:,}",
                    percentage=0,
                    purpose=match.role,
                )
            )
            calendar.append(
                ContentCalendarItem(
                    week=week,
                    kol_name=match.name,
                    action=match.collaboration_suggestion.content_format,
                    platform="Xiaohongshu" if match.platform == "xiaohongshu" else "Douyin",
                )
            )

        for item in budget_items:
            amount = int(item.amount.replace("¥", "").replace(",", ""))
            item.percentage = max(1, round(amount / total * 100)) if total else 0

        reach_min = sum(match.collaboration_suggestion.estimated_performance.views_range[0] for match in selected)
        reach_max = sum(match.collaboration_suggestion.estimated_performance.views_range[1] for match in selected)
        platform_mix = " / ".join(dict.fromkeys("Xiaohongshu" if match.platform == "xiaohongshu" else "Douyin" for match in selected))

        next_steps = [
            "Lock the sampling order and first brief version for the three selected KOLs.",
            "Align all external messaging around ingredients, pricing, and target dog profile.",
            "Launch one credibility-led creator post first, then follow with more lifestyle-driven seeding content.",
            "Use first-round engagement and comment quality to decide whether to scale or run a second wave.",
        ]
        if questionnaire.budget_band == "lt10k":
            next_steps[3] = "Use the first round only to validate content direction and comment quality; do not scale too early."

        return ExecutionPlan(
            budget_allocation=budget_items,
            total_budget=f"¥{total:,}",
            expected_total_reach=f"Estimated total reach {reach_min:,} - {reach_max:,}",
            content_calendar=calendar,
            next_steps=next_steps,
        )

    def build_outreach_drafts(self, matches: list[KOLMatch], product: ProductData) -> list[OutreachDraft]:
        drafts: list[OutreachDraft] = []
        for match in matches[:3]:
            email = match.email or f"{match.kol_id}@dragonway-mock.local"
            drafts.append(
                OutreachDraft(
                    kol_name=match.name,
                    email=email,
                    subject=f"{product.product_name} China launch collaboration invitation",
                    body=(
                        f"Hi {match.name},\n\n"
                        f"We are preparing the China launch plan for {product.product_name}. "
                        f"We shortlisted your account because {match.match_reasoning.headline.lower()}。\n\n"
                        f"Our current preferred angle is {match.collaboration_suggestion.content_angle}。\n"
                        f"If you're open to collaborating, we can send a sample, key product facts, and a first brief for review.\n\n"
                        "Best regards,\n"
                        "DragonWay Lab"
                    ),
                )
            )
        return drafts

    def _score_breakdown(
        self,
        questionnaire: QuestionnaireInput,
        product: ProductData,
        profile: dict[str, Any],
    ) -> dict[str, DimensionScore]:
        pet_type_score = 100 if questionnaire.pet_type in profile["pet_type"] else 35
        topic_score = self._topic_score(questionnaire, product, profile)
        audience_score = self._audience_score(questionnaire, profile)
        budget_score = self._budget_score(questionnaire.budget_band, profile["price_from"], profile["price_to"])
        engagement_score = self._engagement_score(profile["engagement_rate"])
        platform_score = self._platform_score(questionnaire.preferred_platforms, profile["platform"])

        return {
            "pet_type_match": DimensionScore(
                score=pet_type_score,
                reason=f"{profile['name']} overlaps strongly with the {questionnaire.pet_type} vertical, so pet-type alignment is {'high' if pet_type_score >= 90 else 'moderate'}.",
            ),
            "topic_fit": DimensionScore(
                score=topic_score,
                reason=self._topic_reason(questionnaire, profile),
            ),
            "audience_fit": DimensionScore(
                score=audience_score,
                reason=self._audience_reason(questionnaire, profile),
            ),
            "budget_fit": DimensionScore(
                score=budget_score,
                reason=f"The estimated rate range is about ¥{profile['price_from']:,} - ¥{profile['price_to']:,}, which gives this creator a budget-fit score of {budget_score}.",
            ),
            "engagement_rate": DimensionScore(
                score=engagement_score,
                reason=f"The historical engagement rate is about {profile['engagement_rate']:.1f}%, which places this creator in the {'upper' if engagement_score >= 85 else 'mid'} range of the current pool.",
            ),
            "platform_fit": DimensionScore(
                score=platform_score,
                reason=self._platform_reason(questionnaire.preferred_platforms, profile["platform"]),
            ),
        }

    def _topic_score(self, questionnaire: QuestionnaireInput, product: ProductData, profile: dict[str, Any]) -> int:
        corpus = " ".join(
            [
                profile["category"],
                profile["content_style"],
                profile["best_for"],
                profile["match_reason_template"],
                " ".join(profile["tags"]),
                product.product_name,
                product.description,
            ]
        ).lower()

        score = 48
        for claim in questionnaire.core_claims:
            score += 10 if any(keyword in corpus for keyword in CLAIM_KEYWORDS.get(claim, [])) else 0
        if questionnaire.brand_positioning == "premium_import" and any(tag in corpus for tag in ["premium", "import", "high-value", "refined"]):
            score += 12
        if questionnaire.preferred_kol_type == "expert" and profile["has_expert_background"]:
            score += 10
        return min(score, 100)

    def _audience_score(self, questionnaire: QuestionnaireInput, profile: dict[str, Any]) -> int:
        audience = profile["audience"]
        score = 52
        city = str(audience.get("city_tier", "")).lower()
        spending = str(audience.get("spending_power", "")).lower()
        gender = str(audience.get("gender", "")).lower()

        if questionnaire.target_owner_profile.owner_city == "tier1" and ("tier 1" in city or "shanghai" in city):
            score += 18
        elif questionnaire.target_owner_profile.owner_city == "new_tier1" and ("tier 1" in city or "tier 2" in city or "national" in city):
            score += 14
        elif questionnaire.target_owner_profile.owner_city == "tier2" and ("tier 2" in city or "national" in city):
            score += 12
        elif questionnaire.target_owner_profile.owner_city == "any":
            score += 10

        if questionnaire.target_owner_profile.owner_price == "high" and "high" in spending:
            score += 16
        elif questionnaire.target_owner_profile.owner_price == "mid_high" and spending in {"medium-high", "high"}:
            score += 14
        elif questionnaire.target_owner_profile.owner_price == "mid":
            score += 10

        if questionnaire.pet_type == "dog" and "female" in gender:
            score += 4
        return min(score, 100)

    def _budget_score(self, budget_band: str, price_from: int, price_to: int) -> int:
        min_budget, max_budget = BUDGET_RANGES[budget_band]
        if price_to <= max_budget and price_from >= min_budget:
            return 96
        if price_from <= max_budget and price_to >= min_budget:
            return 78
        if budget_band == "gt80k" and price_from < min_budget:
            return 72
        if price_from < min_budget:
            return 60
        return 36

    def _engagement_score(self, engagement_rate: float) -> int:
        score = 50 + round(min(max(engagement_rate, 0), 12) / 12 * 50)
        return min(score, 100)

    def _platform_score(self, preferred_platforms: list[str], platform: str) -> int:
        if not preferred_platforms:
            return 80
        return 100 if platform in preferred_platforms else 55

    def _platform_reason(self, preferred_platforms: list[str], platform: str) -> str:
        platform_label = "Xiaohongshu" if platform == "xiaohongshu" else "Douyin"
        if not preferred_platforms:
            return f"No platform was locked in yet, so {platform_label} can be considered directly in the first shortlist."
        if platform in preferred_platforms:
            return f"{platform_label} is inside the current channel scope, so it works as one of the primary launch platforms."
        return f"{platform_label} is outside the preferred platform mix, so the platform-fit score is intentionally more conservative."

    def _topic_reason(self, questionnaire: QuestionnaireInput, profile: dict[str, Any]) -> str:
        claims = self._claim_phrase(questionnaire.core_claims, limit=2)
        return f"{profile['name']}'s content themes can carry selling points like {claims} without making the product explanation feel forced."

    def _audience_reason(self, questionnaire: QuestionnaireInput, profile: dict[str, Any]) -> str:
        audience = profile["audience"]
        return (
            f"This creator mainly reaches {audience.get('city_tier', 'Tier 1-2')} consumers with {audience.get('spending_power', 'medium-high')} spending power, "
            f"which overlaps well with the target profile of {questionnaire.target_owner_profile.owner_city} / {questionnaire.target_owner_profile.owner_price}."
        )

    def _to_match(
        self,
        index: int,
        score: int,
        profile: dict[str, Any],
        breakdown: dict[str, DimensionScore],
        questionnaire: QuestionnaireInput,
        product: ProductData,
    ) -> KOLMatch:
        views_range = self._views_range(profile["followers"], profile["tier"])
        engagement_range = [
            round(views_range[0] * profile["engagement_rate"] / 100),
            round(views_range[1] * profile["engagement_rate"] / 100),
        ]
        midpoint = round((profile["price_from"] + profile["price_to"]) / 2)
        cpr = round(midpoint / max(engagement_range[0], 1))
        role = self._role_label(index, profile)
        top_interests = [self._prettify_tag(tag) for tag in profile["tags"][:4]]

        return KOLMatch(
            kol_id=profile["kol_id"],
            name=profile["name"],
            platform=profile["platform"],
            tier=profile["tier"],
            followers=profile["followers"],
            avg_engagement=profile["engagement_rate"] / 100,
            avg_content_views=round(sum(views_range) / 2),
            has_expert_background=profile["has_expert_background"],
            match_score=score,
            role=role,
            email=profile.get("email"),
            profile_url=profile.get("profile_url"),
            avatar_url=profile.get("avatar_url"),
            match_reasoning=MatchReasoning(
                headline=self._headline(questionnaire, profile, index),
                dimension_breakdown=breakdown,
                specific_fit=self._specific_fit(questionnaire, product, profile),
                past_brand_relevance=self._past_brand_relevance(profile),
            ),
            audience_profile=AudienceProfileOutput(
                age_distribution=self._age_distribution(str(profile["audience"].get("age", "20-35"))),
                gender_ratio=self._gender_ratio(str(profile["audience"].get("gender", "mixed"))),
                city_tier=str(profile["audience"].get("city_tier", "Tier 1-2")),
                top_interests=top_interests,
            ),
            collaboration_suggestion=CollaborationSuggestion(
                content_format=self._content_format(profile["platform"], questionnaire),
                content_angle=self._content_angle(questionnaire, product, profile),
                sample_title=self._sample_title(questionnaire, product, profile),
                sample_hook=self._sample_hook(questionnaire, product, profile),
                key_message=self._key_message(questionnaire, product),
                estimated_performance=EstimatedPerformance(
                    views_range=views_range,
                    engagement_range=engagement_range,
                    estimated_cpr=cpr,
                ),
            ),
            price_range=PriceRange(
                min=profile["price_from"],
                max=profile["price_to"],
                unit="CNY / post",
            ),
        )

    def _role_label(self, index: int, profile: dict[str, Any]) -> str:
        if index == 0:
            return "Best Match"
        if index == 1 and profile["has_expert_background"]:
            return "Expert Trust"
        if index == 1:
            return "Reach Driver"
        if profile["has_expert_background"]:
            return "Authority Backup"
        return "Conversion Support"

    def _headline(self, questionnaire: QuestionnaireInput, profile: dict[str, Any], index: int) -> str:
        claims = self._claim_phrase(questionnaire.core_claims, limit=2)
        positioning = POSITIONING_LABELS.get(questionnaire.brand_positioning, "brand upgrade")
        if index == 0:
            return f"{profile['name']} is the strongest first-priority partner because they can make {claims} and {positioning} feel both specific and credible."
        if profile["has_expert_background"]:
            return f"{profile['name']} is a strong expert-trust slot who can turn {claims} into a purchase reason the audience will actually believe."
        if profile["followers"] >= 500_000:
            return f"{profile['name']} is better suited for scaled awareness and can push {positioning} into a much broader pet-owner audience."
        return f"{profile['name']} works well as a stable support creator who can translate {claims} into more everyday, conversion-friendly language."

    def _specific_fit(self, questionnaire: QuestionnaireInput, product: ProductData, profile: dict[str, Any]) -> str:
        claims = self._claim_phrase(questionnaire.core_claims, limit=2)
        return (
            f"{product.product_name} first needs to turn {claims} into a buying reason that the target audience can understand quickly. "
            f"{profile['name']} consistently publishes {profile['content_style']} content, which makes this creator a good fit for explaining the formula without making the post feel like a hard ad."
        )

    def _past_brand_relevance(self, profile: dict[str, Any]) -> str:
        if profile["has_expert_background"]:
            return f"{profile['best_for']} is already close to this creator's existing content territory, and their expert identity lowers audience skepticism immediately."
        return f"{profile['best_for']} fits the creator's current audience expectation, so the collaboration does not need to spend extra effort explaining why this content belongs on the account."

    def _age_distribution(self, age_range: str) -> list[AgeDistributionItem]:
        start, end = self._parse_age_range(age_range)
        buckets = {
            "18-24": 0,
            "25-30": 0,
            "31-35": 0,
            "36+": 0,
        }
        values = list(range(start, end + 1)) or [25]
        for value in values:
            if value <= 24:
                buckets["18-24"] += 1
            elif value <= 30:
                buckets["25-30"] += 1
            elif value <= 35:
                buckets["31-35"] += 1
            else:
                buckets["36+"] += 1
        total = max(len(values), 1)
        return [
            AgeDistributionItem(label=label, percentage=round(count / total * 100))
            for label, count in buckets.items()
            if count > 0
        ]

    def _parse_age_range(self, age_range: str) -> tuple[int, int]:
        cleaned = age_range.replace("–", "-").replace("—", "-")
        parts = cleaned.split("-")
        try:
            start = int(parts[0])
            end = int(parts[1]) if len(parts) > 1 else start + 8
        except (TypeError, ValueError):
            return 25, 35
        return min(start, end), max(start, end)

    def _gender_ratio(self, gender: str) -> GenderRatio:
        lowered = gender.lower()
        if "female" in lowered:
            return GenderRatio(female=0.72, male=0.28)
        if "male" in lowered:
            return GenderRatio(female=0.4, male=0.6)
        return GenderRatio(female=0.58, male=0.42)

    def _content_format(self, platform: str, questionnaire: QuestionnaireInput) -> str:
        if platform == "douyin":
            return "Douyin short-form seeding video"
        if "educational" in questionnaire.content_preference or "ingredient_review" in questionnaire.content_preference:
            return "Xiaohongshu in-depth post or review video"
        return "Xiaohongshu lifestyle seeding post"

    def _content_angle(self, questionnaire: QuestionnaireInput, product: ProductData, profile: dict[str, Any]) -> str:
        claims = self._claim_phrase(questionnaire.core_claims, limit=2)
        if profile["has_expert_background"]:
            return f"Lead with feeding logic and ingredient explanation, and break down why {product.product_name} can credibly support a {claims} narrative."
        if profile["followers"] >= 500_000:
            return f"Use real pet-owner routines to turn {product.product_name} and its {claims} story into content that is easier to share and save."
        return f"Approach it through daily feeding switches, palatability, and more refined feeding habits so {product.product_name} feels like a realistic next product to try."

    def _sample_title(self, questionnaire: QuestionnaireInput, product: ProductData, profile: dict[str, Any]) -> str:
        claim = self._claim_phrase(questionnaire.core_claims, limit=1)
        if profile["has_expert_background"]:
            return f"Is {product.product_name} actually worth recommending? Here's the feeding logic behind its {claim} positioning."
        return f"Thinking about {product.product_name}? I did the homework first on this {claim}-led dog food."

    def _sample_hook(self, questionnaire: QuestionnaireInput, product: ProductData, profile: dict[str, Any]) -> str:
        _ = profile
        if "ingredient_review" in questionnaire.content_preference:
            return f"What most people miss about {product.product_name} is not the brand name, but the purchase logic hidden behind the ingredient panel."
        return f"If you're also looking for a more reliable daily formula for your dog, this is the {product.product_name} breakdown to watch first."

    def _key_message(self, questionnaire: QuestionnaireInput, product: ProductData) -> str:
        claim = self._claim_phrase(questionnaire.core_claims, limit=1)
        return f"The most defensible story around {product.product_name} is not just that it is imported, but the tangible {claim} value the buyer can understand immediately."

    def _views_range(self, followers: int, tier: str) -> list[int]:
        multipliers = {
            "micro": (0.18, 0.32),
            "mid": (0.12, 0.22),
            "top": (0.06, 0.14),
        }
        low_ratio, high_ratio = multipliers.get(tier, (0.1, 0.2))
        return [max(5_000, round(followers * low_ratio)), max(10_000, round(followers * high_ratio))]

    def _claim_phrase(self, claims: list[str], *, limit: int = 2) -> str:
        labels = [CLAIM_LABELS.get(claim, claim.replace("_", " ")) for claim in claims[:limit]]
        if not labels:
            return "core positioning"
        if len(labels) == 1:
            return labels[0]
        return " and ".join(labels)

    def _prettify_tag(self, tag: str) -> str:
        return tag.replace("-", " ").title()

    def _enrich_matches(
        self,
        matches: list[KOLMatch],
        questionnaire: QuestionnaireInput,
        product: ProductData,
    ) -> list[KOLMatch]:
        if not matches:
            return matches

        improved = self.client.generate_model(
            task_name="agent_c_kol_enrichment",
            system_prompt=self._enrichment_system_prompt(),
            user_payload={
                "task_goal": (
                    "Improve the reasoning and collaboration copy for already-selected KOLs. "
                    "Do not change the KOL list, scores, roles, or numerical fields."
                ),
                "source_facts": {
                    "product_name": product.product_name,
                    "brand_name": product.brand_name,
                    "description_excerpt": product.description[:400],
                    "questionnaire_claims": questionnaire.core_claims,
                    "brand_positioning": questionnaire.brand_positioning,
                    "preferred_platforms": questionnaire.preferred_platforms,
                    "content_preference": questionnaire.content_preference,
                    "budget_band": questionnaire.budget_band,
                },
                "selected_matches": [
                    {
                        "kol_id": match.kol_id,
                        "name": match.name,
                        "role": match.role,
                        "platform": match.platform,
                        "tier": match.tier,
                        "match_score": match.match_score,
                        "audience_top_interests": match.audience_profile.top_interests,
                        "fallback_reasoning": {
                            "headline": match.match_reasoning.headline,
                            "specific_fit": match.match_reasoning.specific_fit,
                            "past_brand_relevance": match.match_reasoning.past_brand_relevance,
                        },
                        "fallback_collaboration": {
                            "content_angle": match.collaboration_suggestion.content_angle,
                            "sample_title": match.collaboration_suggestion.sample_title,
                            "sample_hook": match.collaboration_suggestion.sample_hook,
                            "key_message": match.collaboration_suggestion.key_message,
                        },
                    }
                    for match in matches
                ],
                "writing_rules": [
                    "Preserve all kol_id values exactly and return one item per selected KOL.",
                    "Do not change scores, platforms, tiers, or pricing.",
                    "Write all user-facing copy in concise English.",
                    "Headlines should feel specific, not generic.",
                    "specific_fit should explain why this exact creator fits this product, not pet food in general.",
                    "past_brand_relevance should stay grounded in the existing fallback and not invent new case studies.",
                    "sample_title and sample_hook should feel publishable on the creator's platform.",
                ],
            },
            schema_model=KOLTextEnhancementBatch,
        )
        if not improved:
            return matches

        mapped = {item.kol_id: item for item in improved.items}
        enriched: list[KOLMatch] = []
        for match in matches:
            item = mapped.get(match.kol_id)
            if not item:
                enriched.append(match)
                continue
            enriched.append(
                match.model_copy(
                    update={
                        "match_reasoning": match.match_reasoning.model_copy(
                            update={
                                "headline": item.headline,
                                "specific_fit": item.specific_fit,
                                "past_brand_relevance": item.past_brand_relevance,
                            }
                        ),
                        "collaboration_suggestion": match.collaboration_suggestion.model_copy(
                            update={
                                "content_angle": item.content_angle,
                                "sample_title": item.sample_title,
                                "sample_hook": item.sample_hook,
                                "key_message": item.key_message,
                            }
                        ),
                    }
                )
            )
        return enriched

    def _enrichment_system_prompt(self) -> str:
        return (
            "You are Agent C in DragonWay. "
            "A deterministic matcher already selected the final three KOLs and scored them. "
            "Your job is only to improve the user-facing reasoning and collaboration copy so it feels sharper and more credible. "
            "Write user-facing strings in concise English. "
            "Do not invent campaign history, case studies, or performance claims that are not already supported by the fallback draft. "
            "Do not change the selected KOL list or any numeric data."
        )

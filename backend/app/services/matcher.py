from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from pydantic import BaseModel

from backend.app.config import KOL_DATA_PATH
from backend.app.schemas.campaign import (
    AgeDistributionItem,
    AudienceProfileOutput,
    CollaborationSuggestion,
    DimensionScore,
    EstimatedPerformance,
    ExecutionPlan,
    BudgetAllocationItem,
    ContentCalendarItem,
    KOLMatch,
    MatchReasoning,
    OutreachDraft,
    PriceRange,
    GenderRatio,
    ProductData,
)
from backend.app.schemas.questionnaire import QuestionnaireInput
from backend.app.services.ai import LLMClient


CLAIM_KEYWORDS = {
    "high_protein": ["高蛋白", "protein", "动物蛋白", "运动", "训练"],
    "grain_free": ["无谷", "grain", "天然", "原粮"],
    "limited_ingredient": ["有限成分", "敏感", "简单配方"],
    "fresh_ingredients": ["新鲜", "食材", "来源", "透明"],
    "digestive_health": ["肠胃", "消化", "便便", "换粮"],
    "skin_coat": ["毛发", "皮肤", "光泽"],
    "joint_support": ["关节", "大型犬", "老年犬", "运动"],
    "vet_backed": ["兽医", "营养师", "科学", "健康"],
    "premium_imported": ["进口", "海外", "高端", "premium"],
}

CLAIM_LABELS = {
    "high_protein": "高动物蛋白",
    "grain_free": "无谷配方",
    "limited_ingredient": "有限成分",
    "fresh_ingredients": "原料新鲜度",
    "digestive_health": "肠胃友好",
    "skin_coat": "毛发与皮肤状态",
    "joint_support": "关节支持",
    "vet_backed": "科学喂养背书",
    "premium_imported": "进口高端定位",
}

POSITIONING_LABELS = {
    "scientific": "科学喂养",
    "natural": "天然原料",
    "premium_import": "进口高端",
    "functional": "功能型主粮",
    "palatability": "适口性升级",
}

BUDGET_RANGES = {
    "lt10k": (0, 10000),
    "10k_30k": (10000, 30000),
    "30k_80k": (30000, 80000),
    "gt80k": (80000, 10**9),
}

ROLE_LABELS = {
    "best_match": "Best Match",
    "breakout_choice": "Breakout Choice",
    "precision_conversion": "Precision Conversion",
    "reserve_option": "Reserve Option",
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
    def __init__(self, data_path: Path = KOL_DATA_PATH) -> None:
        with open(data_path, "r", encoding="utf-8") as fh:
            self.data = json.load(fh)
        self.client = LLMClient()

    def match(self, questionnaire: QuestionnaireInput, product: ProductData) -> list[KOLMatch]:
        weights = self.data["matching_weights"]
        audience_weight = weights.get("audience_match", weights.get("audience_profile_match", 0.20))
        benchmark = self.data["platform_benchmarks"]
        scored: list[tuple[float, dict[str, Any], dict[str, DimensionScore]]] = []
        for kol in self.data["kol_pool"]:
            pet_type_score = 100 if questionnaire.pet_type in kol["pet_type"] else 15
            category_score = self._category_score(questionnaire, kol, product)
            audience_score = self._audience_score(questionnaire, kol)
            budget_score = self._budget_score(questionnaire.budget_band, kol["price_range"])
            engagement_score = self._engagement_score(kol, benchmark)
            expert_bonus_score = 100 if kol["has_expert_background"] else 0

            total = (
                pet_type_score * weights["pet_type_match"]
                + category_score * weights["category_match"]
                + audience_score * audience_weight
                + budget_score * weights["budget_fit"]
                + engagement_score * weights["engagement_rate"]
            )
            if kol["has_expert_background"]:
                total += 5
            total = min(100, round(total))

            breakdown = {
                "pet_type_match": DimensionScore(score=pet_type_score, reason=self._pet_type_reason(questionnaire.pet_type, kol)),
                "category_match": DimensionScore(score=category_score, reason=self._category_reason(questionnaire, kol)),
                "audience_match": DimensionScore(score=audience_score, reason=self._audience_reason(questionnaire, kol)),
                "budget_fit": DimensionScore(score=budget_score, reason=self._budget_reason(questionnaire.budget_band, kol["price_range"])),
                "engagement_rate": DimensionScore(score=engagement_score, reason=self._engagement_reason(kol, benchmark)),
            }
            if kol["has_expert_background"]:
                breakdown["expert_bonus"] = DimensionScore(
                    score=expert_bonus_score,
                    reason="Expert background helps establish trust faster for health, nutrition, or ingredient-led campaigns.",
                )
            scored.append((total, kol, breakdown))

        scored.sort(key=lambda item: item[0], reverse=True)
        selected = self._pick_roles(scored)
        matches = [self._to_match(role, score, kol, breakdown, questionnaire, product) for role, score, kol, breakdown in selected]
        return self._enrich_matches(matches, questionnaire, product)

    def build_execution_plan(self, matches: list[KOLMatch], questionnaire: QuestionnaireInput) -> ExecutionPlan:
        total = 0
        budget_items: list[BudgetAllocationItem] = []
        calendar: list[ContentCalendarItem] = []
        for week, match in enumerate(matches, start=1):
            amount = round((match.price_range.min + match.price_range.max) / 2)
            total += amount
            budget_items.append(
                BudgetAllocationItem(
                    kol_name=match.name,
                    amount=f"¥{amount:,}",
                    percentage=0,
                    purpose=match.role.replace("_", " "),
                )
            )
            calendar.append(
                ContentCalendarItem(
                    week=week,
                    kol_name=match.name,
                    action=match.collaboration_suggestion.content_format,
                    platform=match.platform,
                )
            )

        for item in budget_items:
            amount = int(item.amount.replace("¥", "").replace(",", ""))
            item.percentage = max(1, round(amount / total * 100)) if total else 0

        reach_min = sum(match.collaboration_suggestion.estimated_performance.views_range[0] for match in matches)
        reach_max = sum(match.collaboration_suggestion.estimated_performance.views_range[1] for match in matches)
        return ExecutionPlan(
            budget_allocation=budget_items,
            total_budget=f"¥{total:,}",
            expected_total_reach=f"预计总曝光 {reach_min:,} - {reach_max:,}",
            content_calendar=calendar,
            next_steps=[
                "Confirm target KOL shortlist",
                "Prepare product sample and brief",
                "Align content draft and compliance wording",
                "Schedule publishing window",
            ],
        )

    def build_outreach_drafts(self, matches: list[KOLMatch], product: ProductData) -> list[OutreachDraft]:
        drafts: list[OutreachDraft] = []
        for match in matches:
            email = match.email or f"{match.kol_id}@example.com"
            drafts.append(
                OutreachDraft(
                    kol_name=match.name,
                    email=email,
                    subject=f"Collaboration with {product.product_name} for China launch",
                    body=(
                        f"Hi {match.name},\n\n"
                        f"We're preparing the China rollout for {product.product_name}. "
                        f"We think your profile is a strong fit because {match.match_reasoning.headline.lower()}.\n\n"
                        f"We'd like to discuss a {match.collaboration_suggestion.content_format.lower()} around "
                        f"{match.collaboration_suggestion.content_angle.lower()}.\n\n"
                        "If you're interested, we can send product details, samples, and a proposed collaboration scope.\n\n"
                        "Best,\nDragonWay Lab"
                    ),
                )
            )
        return drafts

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
                    "Write all user-facing copy in concise Simplified Chinese.",
                    "Headlines should feel specific, not generic.",
                    "specific_fit should explain why this exact creator fits this product, not pet food in general.",
                    "past_brand_relevance should stay grounded in the existing fallback and not invent new case studies.",
                    "sample_title and sample_hook should feel publishable on the creator's platform.",
                    "The copy should sound like a strategist preparing a real creator shortlist, not a generic AI summary.",
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
            "A deterministic matcher already selected the KOLs and scored them. "
            "Your job is only to improve the user-facing reasoning and collaboration copy so it feels sharper, more specific, and more credible. "
            "Write user-facing strings in concise Simplified Chinese. "
            "Do not invent campaign history, case studies, or performance claims that are not already supported by the fallback draft. "
            "Do not change the selected KOL list or any numeric data."
        )

    def _pick_roles(self, scored: list[tuple[float, dict[str, Any], dict[str, DimensionScore]]]) -> list[tuple[str, float, dict[str, Any], dict[str, DimensionScore]]]:
        if not scored:
            return []

        used_ids: set[str] = set()
        picked: list[tuple[str, float, dict[str, Any], dict[str, DimensionScore]]] = []

        best = scored[0]
        picked.append(("best_match", *best))
        used_ids.add(best[1]["id"])

        breakout = next(
            (item for item in scored if item[1]["id"] not in used_ids and item[1]["tier"] == "top"),
            next((item for item in scored if item[1]["id"] not in used_ids and item[1]["platform"] != best[1]["platform"]), None),
        )
        if breakout:
            picked.append(("breakout_choice", *breakout))
            used_ids.add(breakout[1]["id"])

        precision = next(
            (
                item
                for item in scored
                if item[1]["id"] not in used_ids
                and item[1]["estimated_conversion_rate"] == max(
                    k[1]["estimated_conversion_rate"] for k in scored if k[1]["id"] not in used_ids
                )
            ),
            None,
        )
        if precision:
            picked.append(("precision_conversion", *precision))
            used_ids.add(precision[1]["id"])

        reserve = next((item for item in scored if item[1]["id"] not in used_ids), None)
        if reserve:
            picked.append(("reserve_option", *reserve))

        return picked[:4]

    def _to_match(
        self,
        role: str,
        score: float,
        kol: dict[str, Any],
        breakdown: dict[str, DimensionScore],
        questionnaire: QuestionnaireInput,
        product: ProductData,
    ) -> KOLMatch:
        audience = kol["audience_profile"]
        title = self._sample_title(questionnaire, product, kol)
        hook = self._sample_hook(questionnaire, product, kol)
        key_message = self._key_message(questionnaire, product)
        views_base = kol["avg_content_views"]
        views_range = [round(views_base * 0.85), round(views_base * 1.25)]
        engagement_range = [round(views_range[0] * kol["avg_engagement"]), round(views_range[1] * kol["avg_engagement"])]
        avg_price = (kol["price_range"]["min"] + kol["price_range"]["max"]) / 2
        cpr = round(avg_price / max(engagement_range[0], 1))
        price = PriceRange(**kol["price_range"])
        role_label = ROLE_LABELS[role]

        return KOLMatch(
            kol_id=kol["id"],
            name=kol["name"],
            platform=kol["platform"],
            tier=kol["tier"],
            followers=kol["followers"],
            avg_engagement=kol["avg_engagement"],
            avg_content_views=kol["avg_content_views"],
            has_expert_background=kol["has_expert_background"],
            match_score=int(score),
            role=role_label,
            match_reasoning=MatchReasoning(
                headline=self._headline(questionnaire, kol),
                dimension_breakdown=breakdown,
                specific_fit=self._specific_fit(questionnaire, product, kol),
                past_brand_relevance=self._past_brand_relevance(kol),
            ),
            audience_profile=AudienceProfileOutput(
                age_distribution=self._age_distribution(audience["age_range"]),
                gender_ratio=GenderRatio(**audience["gender_ratio"]),
                city_tier=audience["city_tier"],
                top_interests=audience["interests"][:6],
            ),
            collaboration_suggestion=CollaborationSuggestion(
                content_format=self._content_format(questionnaire, kol),
                content_angle=self._content_angle(questionnaire, product, kol),
                sample_title=title,
                sample_hook=hook,
                key_message=key_message,
                estimated_performance=EstimatedPerformance(
                    views_range=views_range,
                    engagement_range=engagement_range,
                    estimated_cpr=cpr,
                ),
            ),
            price_range=price,
            email=kol.get("email") or f"{kol['id']}@dragonway-mock.local",
        )

    def _category_score(self, questionnaire: QuestionnaireInput, kol: dict[str, Any], product: ProductData) -> int:
        corpus = " ".join(kol["category"] + kol["audience_profile"]["interests"] + [kol["content_style"]] + kol["past_brands"]).lower()
        score = 40
        for claim in questionnaire.core_claims:
            keywords = CLAIM_KEYWORDS.get(claim, [])
            if any(keyword.lower() in corpus for keyword in keywords):
                score += 18
        if product.brand_name and product.brand_name.lower() in corpus:
            score += 10
        return min(score, 100)

    def _audience_score(self, questionnaire: QuestionnaireInput, kol: dict[str, Any]) -> int:
        audience = kol["audience_profile"]
        score = 45
        owner = questionnaire.target_owner_profile
        if owner.owner_pet in audience["audience_pet_type"]:
            score += 25
        if owner.owner_city == "tier1" and "一线" in audience["city_tier"]:
            score += 15
        elif owner.owner_city == "new_tier1" and ("一二线" in audience["city_tier"] or "全国" in audience["city_tier"]):
            score += 12
        elif owner.owner_city == "tier2":
            score += 10
        purchase_power = audience["purchase_power"]
        if owner.owner_price == "high" and purchase_power == "高":
            score += 15
        elif owner.owner_price == "mid_high" and purchase_power in {"高", "中高"}:
            score += 12
        elif owner.owner_price == "mid":
            score += 10
        return min(score, 100)

    def _budget_score(self, budget_band: str, price_range: dict[str, Any]) -> int:
        min_budget, max_budget = BUDGET_RANGES[budget_band]
        price_min = price_range["min"]
        price_max = price_range["max"]
        if price_max <= max_budget and price_min >= min_budget:
            return 95
        if price_min <= max_budget and price_max >= min_budget:
            return 78
        if budget_band == "gt80k" and price_min < min_budget:
            return 70
        return 35

    def _engagement_score(self, kol: dict[str, Any], benchmark: dict[str, Any]) -> int:
        base = benchmark[kol["platform"]]["avg_engagement_rate"]
        ratio = kol["avg_engagement"] / max(base, 0.0001)
        return min(100, round(55 + ratio * 25))

    def _pet_type_reason(self, pet_type: str, kol: dict[str, Any]) -> str:
        if pet_type in kol["pet_type"]:
            return f"{kol['name']} already serves {pet_type} owners directly."
        return "Pet type overlap is weak, which reduces core-fit confidence."

    def _category_reason(self, questionnaire: QuestionnaireInput, kol: dict[str, Any]) -> str:
        claims = ", ".join(questionnaire.core_claims).replace("_", " ")
        return f"Content themes and audience interests align with {claims}."

    def _audience_reason(self, questionnaire: QuestionnaireInput, kol: dict[str, Any]) -> str:
        owner = questionnaire.target_owner_profile
        return (
            f"Audience skews toward {owner.owner_pet.replace('_', ' ')}, {owner.owner_city}, "
            f"and {owner.owner_price.replace('_', ' ')} purchasing power."
        )

    def _budget_reason(self, budget_band: str, price_range: dict[str, Any]) -> str:
        return f"Quoted range ¥{price_range['min']:,} - ¥{price_range['max']:,} compared against budget band {budget_band}."

    def _engagement_reason(self, kol: dict[str, Any], benchmark: dict[str, Any]) -> str:
        avg = benchmark[kol["platform"]]["avg_engagement_rate"]
        return f"{kol['avg_engagement']:.1%} engagement versus platform benchmark {avg:.1%}."

    def _headline(self, questionnaire: QuestionnaireInput, kol: dict[str, Any]) -> str:
        claims = self._claim_phrase(questionnaire.core_claims, limit=2)
        positioning = POSITIONING_LABELS.get(questionnaire.brand_positioning, "品牌升级")
        if kol["has_expert_background"]:
            return f"{kol['name']}适合承担{positioning}里的信任建立位，能把{claims}讲得更让用户信服。"
        if kol["tier"] == "top":
            return f"{kol['name']}更适合把{claims}做成破圈种草内容，先拉高品牌声量。"
        if kol["estimated_conversion_rate"] >= 0.05:
            return f"{kol['name']}适合做小预算转化测试，内容教育成本低，离下单更近。"
        return f"{kol['name']}的人群和内容结构都贴近目标养宠用户，适合作为稳定匹配位。"

    def _specific_fit(self, questionnaire: QuestionnaireInput, product: ProductData, kol: dict[str, Any]) -> str:
        claims = self._claim_phrase(questionnaire.core_claims, limit=2)
        platform_label = "小红书" if kol["platform"] == "xiaohongshu" else "抖音"
        style = kol["content_style"][:28]
        return (
            f"{product.product_name}这类主打{claims}的产品，需要先把购买理由解释清楚。"
            f"{kol['name']}在{platform_label}长期使用“{style}”这类表达方式，"
            "更容易把进口高端粮的价值点讲成人群能接受的购买语言。"
        )

    def _past_brand_relevance(self, kol: dict[str, Any]) -> str:
        brands = "、".join(kol["past_brands"][:3])
        if kol["has_expert_background"]:
            return f"过往内容里已经出现过{brands}等品牌语境，用户对其专业测评和喂养建议接受度更高。"
        return f"账号过去与{brands}这类宠物食品品牌语境相邻，合作时不需要从零教育受众。"

    def _age_distribution(self, age_range: str) -> list[AgeDistributionItem]:
        start, end = [int(x) for x in age_range.split("-")]
        buckets = [
            ("18-22", 0),
            ("23-27", 0),
            ("28-32", 0),
            ("33+", 0),
        ]
        values = list(range(start, min(end, 40) + 1))
        total = len(values) or 1
        for value in values:
            if value <= 22:
                buckets[0] = (buckets[0][0], buckets[0][1] + 1)
            elif value <= 27:
                buckets[1] = (buckets[1][0], buckets[1][1] + 1)
            elif value <= 32:
                buckets[2] = (buckets[2][0], buckets[2][1] + 1)
            else:
                buckets[3] = (buckets[3][0], buckets[3][1] + 1)
        return [AgeDistributionItem(label=label, percentage=round(count / total * 100)) for label, count in buckets if count > 0]

    def _content_format(self, questionnaire: QuestionnaireInput, kol: dict[str, Any]) -> str:
        if kol["platform"] == "xiaohongshu":
            return "小红书深度图文/短视频测评"
        if "dog_reaction" in questionnaire.content_preference:
            return "抖音试吃反应短视频"
        return "抖音种草短视频"

    def _content_angle(self, questionnaire: QuestionnaireInput, product: ProductData, kol: dict[str, Any]) -> str:
        claims = self._claim_phrase(questionnaire.core_claims, limit=2)
        if kol["platform"] == "xiaohongshu":
            return f"围绕{product.product_name}的{claims}做成分拆解与喂养决策内容，重点回答“为什么值得换粮”。"
        return f"围绕{product.product_name}的{claims}做试吃反应和日常喂养场景，重点放大适口性与升级感。"

    def _sample_title(self, questionnaire: QuestionnaireInput, product: ProductData, kol: dict[str, Any]) -> str:
        first_claim = self._claim_phrase(questionnaire.core_claims, limit=1)
        if kol["platform"] == "xiaohongshu":
            return f"{product.product_name}值不值得买？从{first_claim}把这款狗粮拆明白"
        return f"狗狗愿不愿意持续吃这款{product.product_name}？我做了次真实喂养测试"

    def _sample_hook(self, questionnaire: QuestionnaireInput, product: ProductData, kol: dict[str, Any]) -> str:
        _ = kol
        if "ingredient_review" in questionnaire.content_preference:
            return f"很多人买{product.product_name}这类进口粮时，真正看不懂的其实是成分表和配方逻辑。"
        return f"如果你正打算给狗狗升级主粮，这条关于{product.product_name}的实测先别跳过。"

    def _key_message(self, questionnaire: QuestionnaireInput, product: ProductData) -> str:
        claim = self._claim_phrase(questionnaire.core_claims, limit=1)
        return f"{product.product_name}真正的购买理由不是“进口”两个字，而是用户能被解释清楚的{claim}价值。"

    def _claim_phrase(self, claims: list[str], *, limit: int = 2) -> str:
        labels = [CLAIM_LABELS.get(claim, claim.replace("_", " ")) for claim in claims[:limit]]
        if not labels:
            return "核心卖点"
        if len(labels) == 1:
            return labels[0]
        return "、".join(labels)

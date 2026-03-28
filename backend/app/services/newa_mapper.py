from __future__ import annotations

from collections import defaultdict
from typing import Iterable

from backend.app.schemas.campaign import KOLMatch, ProductData
from backend.app.schemas.questionnaire import QuestionnaireInput, TargetOwnerProfile
from backend.app.schemas_newa import (
    AgeDistributionItem,
    AudienceData,
    CampaignContent,
    CityTierItem,
    FormData,
    KolProfile,
    OpportunityCard,
    SpendingPowerItem,
)


ICON_SEQUENCE = ["TrendingUp", "Zap", "Target", "Shield"]

CITY_LABELS = {
    "tier1": "Tier 1",
    "new_tier1": "New Tier 1",
    "tier2": "Tier 2",
    "any": "Any / Mixed",
}

SPENDING_LABELS = {
    "high": "Premium (¥500+/mo)",
    "mid_high": "Mid-High (¥300–500/mo)",
    "mid": "Mid (¥150–300/mo)",
}


def form_to_questionnaire(form: FormData) -> QuestionnaireInput:
    return QuestionnaireInput(
        product_url=form.product_url,
        food_format=form.food_format,  # type: ignore[arg-type]
        pet_type=form.pet_type,  # type: ignore[arg-type]
        life_stage=form.life_stage,  # type: ignore[arg-type]
        core_claims=form.core_claims,  # type: ignore[arg-type]
        primary_goal=form.primary_goal,  # type: ignore[arg-type]
        target_owner_profile=TargetOwnerProfile(
            owner_pet=form.owner_pet,  # type: ignore[arg-type]
            owner_city=form.owner_city,  # type: ignore[arg-type]
            owner_price=form.owner_price,  # type: ignore[arg-type]
        ),
        brand_positioning=form.brand_positioning,  # type: ignore[arg-type]
        preferred_platforms=form.preferred_platforms or ["xiaohongshu"],
        content_preference=form.content_preference[:3] or ["ingredient_review", "dog_reaction"],
        preferred_kol_type=form.preferred_kol_type,  # type: ignore[arg-type]
        budget_band=form.budget_band or "10k_30k",  # type: ignore[arg-type]
        timeline=form.timeline or "1_month",  # type: ignore[arg-type]
        special_constraints=form.special_constraints or "",
    )


def match_to_kol_profile(match: KOLMatch) -> KolProfile:
    return KolProfile(
        id=match.kol_id,
        name=match.name,
        avatar=match.avatar_url or "",
        platform="Xiaohongshu" if match.platform == "xiaohongshu" else "Douyin",
        profileUrl=match.profile_url,
        followers=_format_followers(match.followers),
        engagement=f"{match.avg_engagement * 100:.1f}%",
        matchReason=match.match_reasoning.specific_fit,
        priceRange=f"¥{match.price_range.min:,} – ¥{match.price_range.max:,}",
        contentTags=match.audience_profile.top_interests[:4],
        badge=match.match_reasoning.headline,
    )


def aggregate_audience(kols: Iterable[KolProfile], form: FormData) -> AudienceData:
    age_scores = defaultdict(float)
    age_scores["18–24"] = 18
    age_scores["25–30"] = 35
    age_scores["31–35"] = 24
    age_scores["36–40"] = 14
    age_scores["40+"] = 9

    city_scores = defaultdict(float)
    owner_city = form.owner_city or "any"
    city_scores[CITY_LABELS.get(owner_city, "Any / Mixed")] += 44
    city_scores["Tier 1"] += 22
    city_scores["New Tier 1"] += 20
    city_scores["Tier 2"] += 14

    spending_scores = defaultdict(float)
    spending_scores[SPENDING_LABELS.get(form.owner_price or "mid_high", "Mid-High (¥300–500/mo)")] += 42
    spending_scores["Premium (¥500+/mo)"] += 28
    spending_scores["Mid-High (¥300–500/mo)"] += 22
    spending_scores["Mid (¥150–300/mo)"] += 8

    tags: list[str] = []
    for kol in kols:
        tags.extend(kol.contentTags[:3])

    return AudienceData(
        ageDistribution=_normalize_distribution(age_scores, AgeDistributionItem, key_name="age"),
        cityTier=_normalize_distribution(city_scores, CityTierItem, key_name="tier"),
        spendingPower=_normalize_distribution(spending_scores, SpendingPowerItem, key_name="segment"),
        interestTags=_dedupe(tags)[:8],
    )


def build_opportunities(form: FormData, product: ProductData) -> list[OpportunityCard]:
    claim_titles = {
        "high_protein": "High-Protein Positioning",
        "grain_free": "Grain-Free Differentiation",
        "limited_ingredient": "Sensitive-Stomach Storyline",
        "fresh_ingredients": "Fresh Ingredient Trust Angle",
        "digestive_health": "Digestive Health Education Angle",
        "skin_coat": "Visible Skin & Coat Benefit",
        "joint_support": "Mobility & Activity Support",
        "vet_backed": "Science-Backed Trust Build",
        "premium_imported": "Imported Premium Upgrade",
    }
    claim_descriptions = {
        "high_protein": "Protein-led messaging is easy to translate into an energetic, performance-oriented feeding narrative for urban Chinese dog owners.",
        "grain_free": "Grain-free still reads as a premium formula signal and helps the product stand apart from more generic staple food competitors.",
        "limited_ingredient": "A simpler ingredient story helps the brand win trust with cautious owners comparing formulas for sensitive pets.",
        "fresh_ingredients": "Freshness and ingredient transparency create a stronger perceived quality upgrade in social content.",
        "digestive_health": "Digestive comfort is one of the easiest benefit stories for owners to understand and monitor in real life.",
        "skin_coat": "Coat and skin condition create highly visual proof points for creator content and repeat exposure.",
        "joint_support": "Mobility support gives creators a natural way to connect the product to daily movement and breed-specific needs.",
        "vet_backed": "Science-backed language builds authority when paired with expert creators and ingredient explanation content.",
        "premium_imported": "Imported premium positioning works best when combined with ingredient standards, sourcing, and feeding quality cues.",
    }

    opportunities: list[OpportunityCard] = []
    selected_claims = form.core_claims[:3] or ["premium_imported", "grain_free", "high_protein"]
    for index, claim in enumerate(selected_claims):
        opportunities.append(
            OpportunityCard(
                title=claim_titles.get(claim, "China Market Opportunity"),
                description=claim_descriptions.get(claim, f"{product.product_name} has a clear narrative angle that can be translated into China-facing creator content."),
                icon=ICON_SEQUENCE[index % len(ICON_SEQUENCE)],
            )
        )

    if len(opportunities) < 4:
        opportunities.append(
            OpportunityCard(
                title="Trust Through KOL Education",
                description="Combining product facts with creator explanation is the fastest way to convert unfamiliar imported formulas into a believable China-market offer.",
                icon=ICON_SEQUENCE[len(opportunities) % len(ICON_SEQUENCE)],
            )
        )
    return opportunities[:4]


def build_campaign_content(form: FormData, product: ProductData, kols: list[KolProfile]) -> CampaignContent:
    claim_text = ", ".join(form.core_claims[:2]).replace("_", " ") if form.core_claims else "premium feeding"
    kol_names = " / ".join(kol.name for kol in kols[:2])
    xhs = (
        f"🐾 Imported pet food check-in | Is {product.product_name} worth trying?\n\n"
        f"If you're comparing formulas around {claim_text}, this is the angle I would focus on first: what problem does it solve for Chinese pet owners, and what part of the formula actually justifies the premium?\n\n"
        f"Suggested creator lineup: {kol_names}\n"
        f"Target city tier: {CITY_LABELS.get(form.owner_city, 'Tier 1-2')}\n"
        "#petfood #xiaohongshu #chinaentry"
    )
    douyin = (
        f"[Hook]\n"
        f"\"This imported formula is being talked about for one reason: {claim_text}.\"\n\n"
        f"[Middle]\n"
        f"\"Show kibble close-up, highlight ingredient logic, then connect it to daily feeding scenes for {form.pet_type} owners.\"\n\n"
        f"[CTA]\n"
        "\"Save this if you're comparing premium formulas for your next feed upgrade.\""
    )
    outreach = (
        f"Hi! We're building a China launch plan for {product.product_name} and shortlisted your profile because your content style fits our {claim_text} positioning. "
        "Would you be open to a sample + first brief for review?"
    )
    return CampaignContent(
        xiaohongshuPost=xhs,
        douyinScript=douyin,
        kolOutreach=outreach,
    )


def _format_followers(value: int) -> str:
    if value >= 1_000_000:
        number = f"{value / 1_000_000:.1f}".rstrip("0").rstrip(".")
        return f"{number}M"
    if value >= 1_000:
        number = value / 1_000
        if number >= 100:
            return f"{round(number):.0f}K"
        compact = f"{number:.1f}".rstrip("0").rstrip(".")
        return f"{compact}K"
    return str(value)


def _normalize_distribution(source: dict[str, float], cls, *, key_name: str):
    total = sum(max(value, 0) for value in source.values()) or 1
    items = []
    for key, value in source.items():
        percentage = round(value / total * 100, 1)
        items.append(cls(**{key_name: key, "percentage": percentage}))
    return items


def _dedupe(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        if not item or item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result

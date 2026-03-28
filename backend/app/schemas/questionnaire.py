from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


FoodFormat = Literal["dry", "wet", "freeze_dried", "air_dried", "fresh", "other"]
PetType = Literal["dog", "cat"]
LifeStage = Literal["puppy", "adult", "senior", "all_life"]
CoreClaim = Literal[
    "high_protein",
    "grain_free",
    "limited_ingredient",
    "fresh_ingredients",
    "digestive_health",
    "skin_coat",
    "joint_support",
    "vet_backed",
    "premium_imported",
]
PrimaryGoal = Literal[
    "brand_awareness",
    "find_kol",
    "test_feedback",
    "find_distributor",
    "direct_sales",
]
BrandPositioning = Literal["scientific", "natural", "premium_import", "functional", "palatability"]
Platform = Literal["xiaohongshu", "douyin"]
ContentPreference = Literal[
    "ingredient_review",
    "unboxing",
    "dog_reaction",
    "educational",
    "vet_endorsement",
    "lifestyle",
]
KOLType = Literal["expert", "reviewer", "lifestyle", "micro_engaged", "mid_volume", "no_preference"]
BudgetBand = Literal["lt10k", "10k_30k", "30k_80k", "gt80k"]
Timeline = Literal["2_weeks", "1_month", "1_3_months", "after_review"]


class TargetOwnerProfile(BaseModel):
    owner_pet: Literal["dog_owner", "cat_owner", "multi_pet"]
    owner_city: Literal["tier1", "new_tier1", "tier2", "any"]
    owner_price: Literal["high", "mid_high", "mid"]


class ProductUrlInput(BaseModel):
    product_url: str = Field(..., min_length=1)


class QuestionnaireInput(BaseModel):
    product_url: str = Field(..., min_length=1)
    food_format: FoodFormat
    pet_type: PetType
    life_stage: List[LifeStage]
    core_claims: List[CoreClaim] = Field(..., max_length=3)
    primary_goal: PrimaryGoal
    target_owner_profile: TargetOwnerProfile
    brand_positioning: BrandPositioning
    preferred_platforms: List[Platform] = Field(..., min_length=1)
    content_preference: List[ContentPreference] = Field(..., max_length=3)
    preferred_kol_type: KOLType
    budget_band: BudgetBand
    timeline: Timeline
    special_constraints: Optional[str] = ""

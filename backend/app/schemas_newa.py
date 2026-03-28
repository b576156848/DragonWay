from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class FormData(BaseModel):
    product_url: str = ""
    food_format: str
    pet_type: str
    life_stage: list[str]
    core_claims: list[str] = Field(default_factory=list, max_length=3)
    primary_goal: str
    owner_pet: str
    owner_city: str
    owner_price: str
    brand_positioning: str
    preferred_platforms: list[str] = Field(default_factory=list, max_length=2)
    content_preference: list[str] = Field(default_factory=list)
    preferred_kol_type: str
    budget_band: str
    timeline: str
    special_constraints: str = ""


class KolProfile(BaseModel):
    id: str
    name: str
    avatar: str = ""
    platform: Literal["Xiaohongshu", "Douyin"]
    profileUrl: Optional[str] = None
    followers: str
    engagement: str
    matchReason: str
    priceRange: str
    contentTags: list[str] = Field(default_factory=list)
    badge: str


class OpportunityCard(BaseModel):
    title: str
    description: str
    icon: str


class AgeDistributionItem(BaseModel):
    age: str
    percentage: float


class CityTierItem(BaseModel):
    tier: str
    percentage: float


class SpendingPowerItem(BaseModel):
    segment: str
    percentage: float


class AudienceData(BaseModel):
    ageDistribution: list[AgeDistributionItem]
    cityTier: list[CityTierItem]
    spendingPower: list[SpendingPowerItem]
    interestTags: list[str]


class CampaignContent(BaseModel):
    xiaohongshuPost: str
    douyinScript: str
    kolOutreach: str


class AnalysisResult(BaseModel):
    opportunities: list[OpportunityCard]
    kols: list[KolProfile]
    audience: AudienceData
    campaign: CampaignContent


class SchemaMetaResponse(BaseModel):
    schema_version: str
    frontend_id: Literal["dragonway_NewA"]
    flows: list[Literal["quick_chat", "detailed_form", "results", "lead_capture"]]


class ChatOption(BaseModel):
    value: str
    label: str


class QuickChatStep(BaseModel):
    step_id: str
    input_type: Literal["url", "select", "multi-select", "kol-cards", "refine", "final"]
    field: Optional[str] = None
    options: list[ChatOption] = Field(default_factory=list)
    maxSelections: Optional[int] = None
    placeholder: Optional[str] = None
    kols: list[KolProfile] = Field(default_factory=list)


class QuickChatStartResponse(BaseModel):
    session_id: str
    agent_messages: list[str]
    step: QuickChatStep
    form_data: FormData


class QuickChatTurnRequest(BaseModel):
    session_id: str
    step_id: str
    value: Optional[str] = None
    values: list[str] = Field(default_factory=list)
    selected_kol_id: Optional[str] = None
    preference: Optional[Literal["reach", "conversion"]] = None


class QuickChatTurnResponse(BaseModel):
    session_id: str
    agent_messages: list[str]
    step: QuickChatStep
    form_data: FormData


class QuickChatAgentDecision(BaseModel):
    next_step_id: Literal[
        "welcome",
        "food_format",
        "pet_type",
        "core_claims",
        "owner_city",
        "owner_price",
        "budget_band",
        "preferred_platforms",
        "kol_results",
        "refine",
        "final",
    ]
    agent_messages: list[str] = Field(default_factory=list, min_length=1, max_length=2)


class QuickParseUrlRequest(BaseModel):
    product_url: str = Field(..., min_length=1)


class QuickParseUrlResponse(BaseModel):
    session_id: str
    product_url: str
    summary: str
    inferred_fields: dict[str, str | list[str]]
    source_confidence: float


class QuickMatchRequest(BaseModel):
    session_id: Optional[str] = None
    form_data: FormData
    source: Literal["quick_chat"] = "quick_chat"


class QuickMatchResponse(BaseModel):
    session_id: str
    top_kols: list[KolProfile]
    audience: AudienceData
    summary: str


class QuickRefineRequest(BaseModel):
    session_id: Optional[str] = None
    form_data: FormData
    initial_kols: list[KolProfile]
    kept_kol_ids: list[str]
    dropped_kol_id: Optional[str] = None
    preference: Optional[Literal["reach", "conversion"]] = None
    answers: Optional[dict[str, str]] = None


class QuickRefineResponse(BaseModel):
    session_id: str
    refined_kols: list[KolProfile]
    refined_audience: AudienceData
    summary: str


class AnalysisSubmitRequest(BaseModel):
    session_id: Optional[str] = None
    form_data: FormData
    source: Literal["detailed_form", "quick_chat"]


class AnalysisSubmitResponse(BaseModel):
    result: AnalysisResult
    source: Literal["detailed_form", "quick_chat"]


class LeadCaptureContext(BaseModel):
    source_mode: Optional[Literal["quick", "detailed"]] = None
    form_data: Optional[dict] = None


class LeadCaptureRequest(BaseModel):
    email: str
    company: Optional[str] = None
    context: Optional[LeadCaptureContext] = None


class LeadCaptureResponse(BaseModel):
    success: bool
    message: str

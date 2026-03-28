from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel

from .questionnaire import (
    BrandPositioning,
    ContentPreference,
    CoreClaim,
    FoodFormat,
    LifeStage,
    PetType,
    QuestionnaireInput,
)


CampaignStatus = Literal["draft", "analyzing", "ready", "pushed", "closed", "error"]


class PriceRange(BaseModel):
    min: int
    max: int
    unit: str


class SellingPoint(BaseModel):
    point: str
    evidence: str
    china_relevance: Literal["high", "medium", "low"]


class TargetDemographicUS(BaseModel):
    description: str
    age_range: str
    income_level: str


class AgentAOutput(BaseModel):
    product_name: str
    product_summary: str
    us_market_position: str
    core_selling_points: List[SellingPoint]
    target_demographic_us: TargetDemographicUS
    competitive_landscape: str


class LocalizedSellingPoint(BaseModel):
    original: str
    localized: str
    platform_angle: str


class TargetAudienceCN(BaseModel):
    primary: str
    secondary: str


class RecommendedStrategy(BaseModel):
    platform_split: str
    content_direction: str
    differentiation: str


class RiskFactor(BaseModel):
    risk: str
    mitigation: str


class AgentBOutput(BaseModel):
    china_market_summary: str
    localized_selling_points: List[LocalizedSellingPoint]
    target_audience_cn: TargetAudienceCN
    recommended_strategy: RecommendedStrategy
    risk_factors: List[RiskFactor]


class DimensionScore(BaseModel):
    score: int
    reason: str


class MatchReasoning(BaseModel):
    headline: str
    dimension_breakdown: dict[str, DimensionScore]
    specific_fit: str
    past_brand_relevance: str


class AgeDistributionItem(BaseModel):
    label: str
    percentage: int


class GenderRatio(BaseModel):
    female: float
    male: float


class AudienceProfileOutput(BaseModel):
    age_distribution: List[AgeDistributionItem]
    gender_ratio: GenderRatio
    city_tier: str
    top_interests: List[str]


class EstimatedPerformance(BaseModel):
    views_range: List[int]
    engagement_range: List[int]
    estimated_cpr: int


class CollaborationSuggestion(BaseModel):
    content_format: str
    content_angle: str
    sample_title: str
    sample_hook: str
    key_message: str
    estimated_performance: EstimatedPerformance


class KOLMatch(BaseModel):
    kol_id: str
    name: str
    platform: Literal["xiaohongshu", "douyin"]
    tier: Literal["top", "mid", "micro"]
    followers: int
    avg_engagement: float
    avg_content_views: int
    has_expert_background: bool
    match_score: int
    role: str
    match_reasoning: MatchReasoning
    audience_profile: AudienceProfileOutput
    collaboration_suggestion: CollaborationSuggestion
    price_range: PriceRange
    email: Optional[str] = None
    profile_url: Optional[str] = None
    avatar_url: Optional[str] = None


class BudgetAllocationItem(BaseModel):
    kol_name: str
    amount: str
    percentage: int
    purpose: str


class ContentCalendarItem(BaseModel):
    week: int
    kol_name: str
    action: str
    platform: str


class ExecutionPlan(BaseModel):
    budget_allocation: List[BudgetAllocationItem]
    total_budget: str
    expected_total_reach: str
    content_calendar: List[ContentCalendarItem]
    next_steps: List[str]


class OutreachDraft(BaseModel):
    kol_name: str
    email: str
    subject: str
    body: str


class OutreachPreviewResponse(BaseModel):
    campaign_id: str
    drafts: List[OutreachDraft]


class OutreachSendRequest(BaseModel):
    mode: Literal["mock", "env_smtp", "custom_smtp", "gmail_oauth"] = "mock"
    draft_indices: List[int] = []
    sender_name: Optional[str] = None
    sender_email: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: Optional[bool] = True


class OutreachSendItemResult(BaseModel):
    kol_name: str
    email: str
    status: Literal["sent", "mocked", "failed"]
    detail: str


class OutreachSendResponse(BaseModel):
    campaign_id: str
    mode: Literal["mock", "env_smtp", "custom_smtp", "gmail_oauth"]
    results: List[OutreachSendItemResult]


class GmailConnectionStatusResponse(BaseModel):
    connected: bool
    email: Optional[str] = None
    expires_at: Optional[str] = None
    scopes: List[str] = []


class ProductData(BaseModel):
    source_type: Literal["url", "text"]
    source_url: Optional[str] = None
    provider: Literal["shopify", "generic", "manual", "blocked"]
    scrape_status: Literal["success", "partial", "blocked"]
    product_name: str
    brand_name: str
    price: Optional[str] = None
    currency: Optional[str] = None
    description: str
    ingredients: List[str] = []
    guaranteed_analysis: List[str] = []
    images: List[str] = []
    raw_excerpt: str
    warnings: List[str] = []


class IntakeSignal(BaseModel):
    key: str
    label: str
    value: str
    confidence: float
    evidence: str


class QuestionnairePrefill(BaseModel):
    food_format: Optional[FoodFormat] = None
    pet_type: Optional[PetType] = None
    life_stage: List[LifeStage] = []
    core_claims: List[CoreClaim] = []
    brand_positioning: Optional[BrandPositioning] = None
    content_preference: List[ContentPreference] = []


class IntakeAnalysisResponse(BaseModel):
    product_data: ProductData
    signals: List[IntakeSignal]
    praise: str
    suggested_content_angles: List[str] = []
    prefill: QuestionnairePrefill


class CampaignResult(BaseModel):
    campaign_id: str
    status: CampaignStatus
    created_at: str
    current_step: str
    questionnaire: QuestionnaireInput
    product_data: ProductData
    agent_a_output: AgentAOutput
    agent_b_output: AgentBOutput
    kol_matches: List[KOLMatch]
    execution_plan: ExecutionPlan
    outreach_drafts: List[OutreachDraft]


class CampaignStatusResponse(BaseModel):
    campaign_id: str
    status: CampaignStatus
    current_step: str
    error_message: Optional[str] = None


class CampaignCreateResponse(BaseModel):
    campaign_id: str
    status: CampaignStatus

export interface FormData {
  product_url: string;
  food_format: string;
  pet_type: string;
  life_stage: string[];
  core_claims: string[];
  primary_goal: string;
  owner_pet: string;
  owner_city: string;
  owner_price: string;
  brand_positioning: string;
  preferred_platforms: string[];
  content_preference: string[];
  preferred_kol_type: string;
  budget_band: string;
  timeline: string;
  special_constraints: string;
}

export interface QuestionnaireInput {
  product_url: string;
  food_format: string;
  pet_type: string;
  life_stage: string[];
  core_claims: string[];
  primary_goal: string;
  target_owner_profile: {
    owner_pet: string;
    owner_city: string;
    owner_price: string;
  };
  brand_positioning: string;
  preferred_platforms: string[];
  content_preference: string[];
  preferred_kol_type: string;
  budget_band: string;
  timeline: string;
  special_constraints?: string;
}

export interface IntakeSignal {
  key: string;
  label: string;
  value: string;
  confidence: number;
  evidence: string;
}

export interface QuestionnairePrefill {
  food_format?: string | null;
  pet_type?: string | null;
  life_stage: string[];
  core_claims: string[];
  brand_positioning?: string | null;
  content_preference: string[];
}

export interface ProductIntakeAnalysis {
  product_data: {
    source_type: 'url' | 'text';
    source_url?: string | null;
    provider: 'shopify' | 'generic' | 'manual' | 'blocked';
    scrape_status: 'success' | 'partial' | 'blocked';
    product_name: string;
    brand_name: string;
    price?: string | null;
    currency?: string | null;
    description: string;
    ingredients: string[];
    guaranteed_analysis: string[];
    images: string[];
    raw_excerpt: string;
    warnings: string[];
  };
  signals: IntakeSignal[];
  praise: string;
  suggested_content_angles: string[];
  prefill: QuestionnairePrefill;
}

export interface OpportunityCard {
  title: string;
  description: string;
  icon: string;
}

export interface KolProfile {
  id: string;
  name: string;
  avatar: string;
  platform: 'Xiaohongshu' | 'Douyin';
  followers: string;
  engagement: string;
  matchReason: string;
  priceRange: string;
  contentTags: string[];
  badge: string;
}

export interface AudienceData {
  ageDistribution: { age: string; percentage: number }[];
  cityTier: { tier: string; percentage: number }[];
  spendingPower: { segment: string; percentage: number }[];
  interestTags: string[];
}

export interface CampaignContent {
  xiaohongshuPost: string;
  douyinScript: string;
  kolOutreach: string;
}

export interface AnalysisResult {
  opportunities: OpportunityCard[];
  kols: KolProfile[];
  audience: AudienceData;
  campaign: CampaignContent;
}

export interface CampaignStatusResponse {
  campaign_id: string;
  status: 'draft' | 'analyzing' | 'ready' | 'pushed' | 'closed' | 'error';
  current_step: string;
  error_message?: string | null;
}

export interface CampaignResult {
  campaign_id: string;
  status: 'draft' | 'analyzing' | 'ready' | 'pushed' | 'closed' | 'error';
  created_at: string;
  current_step: string;
  questionnaire: QuestionnaireInput;
  product_data: {
    source_type: 'url' | 'text';
    source_url?: string | null;
    provider: 'shopify' | 'generic' | 'manual' | 'blocked';
    scrape_status: 'success' | 'partial' | 'blocked';
    product_name: string;
    brand_name: string;
    price?: string | null;
    currency?: string | null;
    description: string;
    ingredients: string[];
    guaranteed_analysis: string[];
    images: string[];
    raw_excerpt: string;
    warnings: string[];
  };
  agent_a_output: {
    product_name: string;
    product_summary: string;
    us_market_position: string;
    core_selling_points: Array<{
      point: string;
      evidence: string;
      china_relevance: 'high' | 'medium' | 'low';
    }>;
    target_demographic_us: {
      description: string;
      age_range: string;
      income_level: string;
    };
    competitive_landscape: string;
  };
  agent_b_output: {
    china_market_summary: string;
    localized_selling_points: Array<{
      original: string;
      localized: string;
      platform_angle: string;
    }>;
    target_audience_cn: {
      primary: string;
      secondary: string;
    };
    recommended_strategy: {
      platform_split: string;
      content_direction: string;
      differentiation: string;
    };
    risk_factors: Array<{
      risk: string;
      mitigation: string;
    }>;
  };
  kol_matches: Array<{
    kol_id: string;
    name: string;
    platform: 'xiaohongshu' | 'douyin';
    tier: 'top' | 'mid' | 'micro';
    followers: number;
    avg_engagement: number;
    avg_content_views: number;
    has_expert_background: boolean;
    match_score: number;
    role: string;
    email?: string | null;
    match_reasoning: {
      headline: string;
      dimension_breakdown: Record<string, { score: number; reason: string }>;
      specific_fit: string;
      past_brand_relevance: string;
    };
    audience_profile: {
      age_distribution: Array<{ label: string; percentage: number }>;
      gender_ratio: { female: number; male: number };
      city_tier: string;
      top_interests: string[];
    };
    collaboration_suggestion: {
      content_format: string;
      content_angle: string;
      sample_title: string;
      sample_hook: string;
      key_message: string;
      estimated_performance: {
        views_range: [number, number];
        engagement_range: [number, number];
        estimated_cpr: number;
      };
    };
    price_range: {
      min: number;
      max: number;
      unit: string;
    };
  }>;
  execution_plan: {
    budget_allocation: Array<{
      kol_name: string;
      amount: string;
      percentage: number;
      purpose: string;
    }>;
    total_budget: string;
    expected_total_reach: string;
    content_calendar: Array<{
      week: number;
      kol_name: string;
      action: string;
      platform: string;
    }>;
    next_steps: string[];
  };
  outreach_drafts: Array<{
    kol_name: string;
    email: string;
    subject: string;
    body: string;
  }>;
}

export interface OutreachPreviewResponse {
  campaign_id: string;
  drafts: Array<{
    kol_name: string;
    email: string;
    subject: string;
    body: string;
  }>;
}

export interface OutreachSendRequest {
  mode: 'mock' | 'env_smtp' | 'custom_smtp' | 'gmail_oauth';
  draft_indices?: number[];
  sender_name?: string;
  sender_email?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_use_tls?: boolean;
}

export interface OutreachSendResponse {
  campaign_id: string;
  mode: 'mock' | 'env_smtp' | 'custom_smtp' | 'gmail_oauth';
  results: Array<{
    kol_name: string;
    email: string;
    status: 'sent' | 'mocked' | 'failed';
    detail: string;
  }>;
}

export interface GmailConnectionStatusResponse {
  connected: boolean;
  email?: string | null;
  expires_at?: string | null;
  scopes: string[];
}

export const AGENT_STEPS = [
  { id: 'extract', label: 'Extracting product content', duration: 2000 },
  { id: 'audience', label: 'Building product and audience analysis', duration: 1800 },
  { id: 'matching', label: 'Matching against the China KOL pool', duration: 2500 },
  { id: 'content', label: 'Generating outreach and campaign suggestions', duration: 2200 },
  { id: 'push', label: 'Packaging the final recommendation', duration: 1500 },
] as const;

export function toQuestionnaireInput(formData: FormData): QuestionnaireInput {
  return {
    product_url: formData.product_url,
    food_format: formData.food_format,
    pet_type: formData.pet_type,
    life_stage: formData.life_stage,
    core_claims: formData.core_claims,
    primary_goal: formData.primary_goal,
    target_owner_profile: {
      owner_pet: formData.owner_pet,
      owner_city: formData.owner_city,
      owner_price: formData.owner_price,
    },
    brand_positioning: formData.brand_positioning,
    preferred_platforms: formData.preferred_platforms,
    content_preference: formData.content_preference,
    preferred_kol_type: formData.preferred_kol_type,
    budget_band: formData.budget_band,
    timeline: formData.timeline,
    special_constraints: formData.special_constraints || '',
  };
}

export function mergeIntakePrefill(formData: FormData, analysis: ProductIntakeAnalysis): FormData {
  const { prefill, product_data } = analysis;
  return {
    ...formData,
    product_url: product_data.source_url || formData.product_url,
    food_format: prefill.food_format || formData.food_format,
    pet_type: prefill.pet_type || formData.pet_type,
    life_stage: prefill.life_stage.length ? prefill.life_stage : formData.life_stage,
    core_claims: prefill.core_claims.length ? prefill.core_claims : formData.core_claims,
    brand_positioning: prefill.brand_positioning || formData.brand_positioning,
    content_preference: prefill.content_preference.length ? prefill.content_preference : formData.content_preference,
  };
}

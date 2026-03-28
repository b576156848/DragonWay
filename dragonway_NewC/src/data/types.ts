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

export interface KolProfile {
  id: string;
  name: string;
  avatar: string;
  platform: 'Xiaohongshu' | 'Douyin';
  profileUrl?: string;
  followers: string;
  engagement: string;
  matchReason: string;
  priceRange: string;
  contentTags: string[];
  badge: string;
}

export interface OpportunityCard {
  title: string;
  description: string;
  icon: string;
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

export const AGENT_STEPS = [
  { id: 'extract', label: 'Extracting product selling points', duration: 2000 },
  { id: 'audience', label: 'Inferring target audience profile', duration: 1800 },
  { id: 'matching', label: 'Matching China KOL pool', duration: 2500 },
  { id: 'content', label: 'Generating campaign content', duration: 2200 },
  { id: 'push', label: 'Preparing push package', duration: 1500 },
] as const;

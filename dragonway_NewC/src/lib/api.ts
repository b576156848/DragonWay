import type {
  AnalysisResult,
  AudienceData,
  FormData,
  KolProfile,
} from '@/data/types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
export const SCHEMA_VERSION = 'dragonway-newa.v1';

type CachedUrlProfile = {
  agent_messages: string[];
  preview: {
    title: string;
    subtitle: string;
    image: string;
    bullets: string[];
  };
  inferred_fields: Pick<FormData, 'food_format' | 'pet_type'> & {
    core_claims: FormData['core_claims'];
  };
};

const KNOWN_FAST_URLS: Record<string, CachedUrlProfile> = {
  'https://tomlinsonsdev.myshopify.com/products/zignature-catfish-dog-food': {
    agent_messages: [
      'I pulled a cached product brief for Zignature Catfish Dry Dog Food to keep this walkthrough fast.',
      'The positioning is clear: limited-ingredient, grain-free, premium dry dog food with a clean ingredient-led story for sensitive-digestion and quality-focused buyers.',
    ],
    preview: {
      title: 'Zignature Catfish Dry Dog Food',
      subtitle: 'Dry dog food | limited-ingredient | grain-free',
      image: 'https://tomlinsonsdev.myshopify.com/cdn/shop/files/Zignature_Dry_Packaging_CATFISH.jpg?v=1727421508',
      bullets: [
        'Single-protein catfish and limited-ingredient framing are visible immediately.',
        'The product page emphasizes premium dry-food positioning rather than discount-led value.',
        'This is a strong fit for ingredient-review, digestion, and premium-import storytelling.',
      ],
    },
    inferred_fields: {
      food_format: 'dry',
      pet_type: 'dog',
      core_claims: ['limited_ingredient', 'grain_free', 'high_protein'],
    },
  },
  'https://sweetypaw.myshopify.com': {
    agent_messages: [
      'I recognized SweetyPaw as a storefront-level URL, so I loaded a cached site brief instead of waiting on a full crawl.',
      'This site reads more like a pet lifestyle storefront than a single hero SKU page, so the next steps should help narrow down the product angle before matching creators.',
    ],
    preview: {
      title: 'SweetyPaw Storefront',
      subtitle: 'Brand homepage | pet lifestyle storefront | cat & dog audience',
      image: 'https://cdn.shopify.com/s/files/1/0360/7474/9996/files/sweetypawlogoBLUE.png?height=628&pad_color=fff&v=1613719816&width=1200',
      bullets: [
        'Homepage messaging leans toward pet lifestyle and comfort rather than one flagship formula.',
        'The site speaks to both cat and dog owners, which means audience narrowing matters early.',
        'For China GTM, this kind of storefront usually needs one lead SKU or one clear category angle before KOL matching.',
      ],
    },
    inferred_fields: {
      food_format: 'other',
      pet_type: 'dog',
      core_claims: ['high_protein', 'fresh_ingredients', 'premium_imported'],
    },
  },
  'https://puphug.myshopify.com/collections/dog-food/products/natural-roll-dog-food-chicken-2-lb': {
    agent_messages: [
      'I pulled a cached brief for PupHug Natural Roll Dog Food (Chicken, 2 lb) so we can skip the crawl delay.',
      'This page reads like a chicken-led dog-food SKU with ingredient transparency and a more niche, specialty-feeding profile than mass-market kibble.',
    ],
    preview: {
      title: 'Natural Roll Dog Food (Chicken 2 lb)',
      subtitle: 'Dog food product page | chicken-led formula | specialty format',
      image: 'https://puphug.myshopify.com/cdn/shop/products/017035-500x500_1200x1200.jpg?v=1532870576',
      bullets: [
        'The page clearly names chicken and lists ingredients directly in the product description.',
        'The roll format makes it feel more specialty and usage-driven than standard dry kibble.',
        'This is a good candidate for education-led content around ingredients, feeding use cases, and premium quality cues.',
      ],
    },
    inferred_fields: {
      food_format: 'dry',
      pet_type: 'dog',
      core_claims: ['high_protein', 'digestive_health', 'premium_imported'],
    },
  },
  'https://pretty-litter-dev.myshopify.com': {
    agent_messages: [
      'I recognized Pretty Litter as a cached cat-care storefront and loaded a prebuilt summary to speed this up.',
      'Important note: this is a cat-litter and cat-health positioning page, not a dog-food product page, so the later recommendations should be interpreted as pet-category guidance rather than food-specific matching.',
    ],
    preview: {
      title: 'Pretty Litter Storefront',
      subtitle: 'Cat litter subscription | cat-health positioning | monthly delivery',
      image: 'https://pretty-litter-dev.myshopify.com/cdn/shop/t/3/assets/prettylitter-opengraph.jpg?v=168601340156469295771515804996',
      bullets: [
        'The homepage leads with color-changing litter and health-monitoring claims.',
        'Subscription delivery and odor-control convenience are central value props.',
        'Category-wise, this is a cat-care brand, so it sits outside the core dog-food workflow.',
      ],
    },
    inferred_fields: {
      food_format: 'other',
      pet_type: 'cat',
      core_claims: ['digestive_health', 'fresh_ingredients', 'premium_imported'],
    },
  },
  'https://petrelish.myshopify.com': {
    agent_messages: [
      'I recognized Pet Relish and loaded a cached site summary so we can move faster.',
      'The brand is positioned more like a dog-food topper or meal-enhancement product than a complete staple diet, which gives it a strong flavor-led and mealtime-upgrade angle.',
    ],
    preview: {
      title: 'Pet Relish Storefront',
      subtitle: 'Dog food topper brand | flavor-led mealtime upgrade',
      image: 'https://petrelish.myshopify.com/cdn/shop/files/PetRelish-DogFoodTopper-Social.png?v=1771268559',
      bullets: [
        'Homepage language focuses on globally inspired, dog-safe flavors and easy pour-over use.',
        'The clearest value proposition is making everyday kibble more appealing without switching foods.',
        'This kind of SKU is well suited to taste, routine-upgrade, and picky-eater narratives.',
      ],
    },
    inferred_fields: {
      food_format: 'dry',
      pet_type: 'dog',
      core_claims: ['high_protein', 'limited_ingredient', 'premium_imported'],
    },
  },
};

function normalizeKnownUrl(url: string): string {
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    const path = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/, '');
    return `${parsed.origin}${path}`;
  } catch {
    return trimmed.replace(/\/+$/, '');
  }
}

function createDefaultFormData(productUrl: string): FormData {
  return {
    product_url: productUrl,
    food_format: '',
    pet_type: '',
    life_stage: ['all_life'],
    core_claims: [],
    primary_goal: 'find_kol',
    owner_pet: 'dog_owner',
    owner_city: 'any',
    owner_price: 'mid_high',
    brand_positioning: 'premium_import',
    preferred_platforms: [],
    content_preference: ['ingredient_review', 'dog_reaction'],
    preferred_kol_type: 'no_preference',
    budget_band: '',
    timeline: '1_month',
    special_constraints: '',
  };
}

function getKnownFastUrlProfile(url: string): CachedUrlProfile | null {
  return KNOWN_FAST_URLS[normalizeKnownUrl(url)] ?? null;
}

export function isKnownFastUrl(url: string): boolean {
  return getKnownFastUrlProfile(url) !== null;
}

function delayedResolve<T>(value: T, ms: number): Promise<T> {
  return new Promise(resolve => {
    window.setTimeout(() => resolve(value), ms);
  });
}

export function normalizeFormDataForApi(formData: FormData): FormData {
  return {
    ...formData,
    product_url: formData.product_url.trim(),
    life_stage: formData.life_stage.length > 0 ? formData.life_stage : ['all_life'],
    primary_goal: formData.primary_goal || 'find_kol',
    owner_pet: formData.owner_pet || 'dog_owner',
    owner_city: formData.owner_city || 'any',
    owner_price: formData.owner_price || 'mid_high',
    brand_positioning: formData.brand_positioning || 'premium_import',
    preferred_platforms: formData.preferred_platforms.length > 0 ? formData.preferred_platforms : ['xiaohongshu'],
    content_preference:
      formData.content_preference.length > 0
        ? formData.content_preference.slice(0, 3)
        : ['ingredient_review', 'dog_reaction'],
    preferred_kol_type:
      formData.preferred_kol_type === 'lifestyle_creator'
        ? 'lifestyle'
        : formData.preferred_kol_type || 'no_preference',
    budget_band: formData.budget_band || '10k_30k',
    timeline: formData.timeline || '1_month',
    special_constraints: formData.special_constraints || '',
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Frontend-Schema': SCHEMA_VERSION,
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export interface QuickParseUrlRequest {
  product_url: string;
}

export interface QuickParseUrlResponse {
  session_id: string;
  product_url: string;
  summary: string;
  inferred_fields: Pick<FormData, 'food_format' | 'pet_type'> & {
    core_claims: FormData['core_claims'];
  };
  source_confidence: number;
}

export interface QuickMatchRequest {
  session_id?: string;
  form_data: FormData;
  source: 'quick_chat';
}

export interface QuickMatchResponse {
  session_id: string;
  top_kols: KolProfile[];
  audience: AudienceData;
  summary: string;
}

export interface QuickRefineRequest {
  session_id?: string;
  form_data: FormData;
  initial_kols: KolProfile[];
  kept_kol_ids: string[];
  dropped_kol_id?: string | null;
  preference?: 'reach' | 'conversion';
  answers?: {
    priority?: 'viral' | 'conversion' | 'endorsement';
    budget?: 'keep' | 'increase';
    style?: 'educational' | 'lifestyle' | 'comedy';
  };
}

export interface QuickRefineResponse {
  session_id: string;
  refined_kols: KolProfile[];
  refined_audience: AudienceData;
  summary: string;
}

export interface AnalysisSubmitRequest {
  session_id?: string;
  form_data: FormData;
  source: 'detailed_form' | 'quick_chat';
}

export interface AnalysisSubmitResponse {
  result: AnalysisResult;
  source: 'detailed_form' | 'quick_chat';
}

export interface LeadCaptureRequest {
  email: string;
  company?: string;
  context?: {
    source_mode?: 'quick' | 'detailed';
    form_data?: Partial<FormData>;
  };
}

export interface LeadCaptureResponse {
  success: boolean;
  message: string;
}

export interface FrontendSchemaMeta {
  schema_version: string;
  frontend_id: 'dragonway_NewA';
  flows: Array<'quick_chat' | 'detailed_form' | 'results' | 'lead_capture'>;
}

export interface ChatOption {
  value: string;
  label: string;
}

export interface QuickChatStep {
  step_id: string;
  input_type: 'url' | 'select' | 'multi-select' | 'kol-cards' | 'refine' | 'final';
  field?: keyof FormData;
  options?: ChatOption[];
  maxSelections?: number;
  placeholder?: string;
  kols?: KolProfile[];
}

export interface QuickChatStartResponse {
  session_id: string;
  agent_messages: string[];
  step: QuickChatStep;
  form_data: FormData;
}

export interface QuickChatTurnRequest {
  session_id: string;
  step_id: string;
  value?: string;
  values?: string[];
  selected_kol_id?: string;
  preference?: 'reach' | 'conversion';
}

export interface QuickChatTurnResponse {
  session_id: string;
  agent_messages: string[];
  step: QuickChatStep;
  form_data: FormData;
  product_preview?: {
    title: string;
    subtitle: string;
    image: string;
    bullets: string[];
  };
}

export function getSchemaMeta() {
  return request<FrontendSchemaMeta>('/api/v1/schema-meta');
}

export function quickParseUrl(payload: QuickParseUrlRequest) {
  return request<QuickParseUrlResponse>('/api/v1/quick/parse-url', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function quickChatStart() {
  return request<QuickChatStartResponse>('/api/v1/quick/session/start', {
    method: 'POST',
  });
}

export function quickChatTurn(payload: QuickChatTurnRequest) {
  if (payload.step_id === 'welcome' && payload.value) {
    const cachedProfile = getKnownFastUrlProfile(payload.value);
    if (cachedProfile) {
      const normalizedUrl = normalizeKnownUrl(payload.value);
      return delayedResolve<QuickChatTurnResponse>({
        session_id: payload.session_id,
        agent_messages: cachedProfile.agent_messages,
        step: {
          step_id: 'food_format',
          input_type: 'select',
          field: 'food_format',
        },
        product_preview: cachedProfile.preview,
        form_data: {
          ...createDefaultFormData(normalizedUrl),
          ...cachedProfile.inferred_fields,
        },
      }, 1200);
    }
  }

  return request<QuickChatTurnResponse>('/api/v1/quick/session/turn', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function quickMatchPreview(payload: QuickMatchRequest) {
  return request<QuickMatchResponse>('/api/v1/quick/match-preview', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function quickRefineMatches(payload: QuickRefineRequest) {
  return request<QuickRefineResponse>('/api/v1/quick/refine', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function submitAnalysis(payload: AnalysisSubmitRequest) {
  return request<AnalysisSubmitResponse>('/api/v1/analysis/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function captureLead(payload: LeadCaptureRequest) {
  return request<LeadCaptureResponse>('/api/v1/leads/capture', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

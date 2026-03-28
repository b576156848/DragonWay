import type {
  AnalysisResult,
  AudienceData,
  FormData,
  KolProfile,
} from '@/data/types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
export const SCHEMA_VERSION = 'dragonway-newa.v1';

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

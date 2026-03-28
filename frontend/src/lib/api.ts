import {
  CampaignResult,
  CampaignStatusResponse,
  GmailConnectionStatusResponse,
  OutreachPreviewResponse,
  OutreachSendRequest,
  OutreachSendResponse,
  ProductIntakeAnalysis,
  QuestionnaireInput,
} from '@/data/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
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

export function createCampaign(payload: QuestionnaireInput) {
  return request<{ campaign_id: string; status: string }>('/api/campaigns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function analyzeProductUrl(productUrl: string) {
  return request<ProductIntakeAnalysis>('/api/intake/analyze-url', {
    method: 'POST',
    body: JSON.stringify({ product_url: productUrl }),
  });
}

export function getCampaignStatus(campaignId: string) {
  return request<CampaignStatusResponse>(`/api/campaigns/${campaignId}/status`);
}

export function getCampaign(campaignId: string) {
  return request<CampaignResult>(`/api/campaigns/${campaignId}`);
}

export function getOutreachPreview(campaignId: string) {
  return request<OutreachPreviewResponse>(`/api/campaigns/${campaignId}/outreach/preview`);
}

export function sendOutreach(campaignId: string, payload: OutreachSendRequest) {
  return request<OutreachSendResponse>(`/api/campaigns/${campaignId}/outreach/send`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getGmailStatus() {
  return request<GmailConnectionStatusResponse>('/api/auth/gmail/status');
}

export async function disconnectGmail() {
  return request<{ ok: boolean }>('/api/auth/gmail/status', {
    method: 'DELETE',
  });
}

export function getGmailConnectUrl(redirectTo?: string) {
  const base = API_BASE_URL || window.location.origin;
  const url = new URL('/api/auth/gmail/start', base);
  if (redirectTo) {
    url.searchParams.set('redirect_to', redirectTo);
  }
  return url.toString();
}

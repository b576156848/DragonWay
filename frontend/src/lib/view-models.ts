import { AnalysisResult, CampaignResult } from '@/data/types';

const CITY_DISTRIBUTIONS: Record<string, { tier: string; percentage: number }[]> = {
  '一线城市为主': [
    { tier: 'Tier 1', percentage: 52 },
    { tier: 'New Tier 1', percentage: 28 },
    { tier: 'Tier 2', percentage: 15 },
    { tier: 'Tier 3+', percentage: 5 },
  ],
  '一二线': [
    { tier: 'Tier 1', percentage: 38 },
    { tier: 'New Tier 1', percentage: 32 },
    { tier: 'Tier 2', percentage: 22 },
    { tier: 'Tier 3+', percentage: 8 },
  ],
  '全国覆盖，二三线占比55%': [
    { tier: 'Tier 1', percentage: 18 },
    { tier: 'New Tier 1', percentage: 27 },
    { tier: 'Tier 2', percentage: 28 },
    { tier: 'Tier 3+', percentage: 27 },
  ],
};

function fallbackCityDistribution(cityTier: string) {
  if (cityTier.includes('一线')) return CITY_DISTRIBUTIONS['一线城市为主'];
  if (cityTier.includes('全国')) return CITY_DISTRIBUTIONS['全国覆盖，二三线占比55%'];
  return CITY_DISTRIBUTIONS['一二线'];
}

function aggregateAgeDistribution(result: CampaignResult) {
  const buckets = new Map<string, number>();
  result.kol_matches.slice(0, 3).forEach((kol) => {
    kol.audience_profile.age_distribution.forEach((item) => {
      buckets.set(item.label, (buckets.get(item.label) ?? 0) + item.percentage);
    });
  });

  const divisor = Math.max(Math.min(result.kol_matches.length, 3), 1);
  return Array.from(buckets.entries()).map(([age, percentage]) => ({
    age,
    percentage: Math.round(percentage / divisor),
  }));
}

function aggregateCityTier(result: CampaignResult) {
  const totals = new Map<string, number>();
  result.kol_matches.slice(0, 3).forEach((kol) => {
    fallbackCityDistribution(kol.audience_profile.city_tier).forEach((item) => {
      totals.set(item.tier, (totals.get(item.tier) ?? 0) + item.percentage);
    });
  });
  const divisor = Math.max(Math.min(result.kol_matches.length, 3), 1);
  return Array.from(totals.entries()).map(([tier, percentage]) => ({
    tier,
    percentage: Math.round(percentage / divisor),
  }));
}

function spendingPowerFromQuestionnaire(result: CampaignResult) {
  const price = result.questionnaire.target_owner_profile.owner_price;
  if (price === 'high') {
    return [
      { segment: 'Premium (¥500+/mo)', percentage: 46 },
      { segment: 'Mid-High (¥300–500)', percentage: 32 },
      { segment: 'Mid (¥150–300)', percentage: 16 },
      { segment: 'Budget (<¥150)', percentage: 6 },
    ];
  }
  if (price === 'mid_high') {
    return [
      { segment: 'Premium (¥500+/mo)', percentage: 26 },
      { segment: 'Mid-High (¥300–500)', percentage: 41 },
      { segment: 'Mid (¥150–300)', percentage: 24 },
      { segment: 'Budget (<¥150)', percentage: 9 },
    ];
  }
  return [
    { segment: 'Premium (¥500+/mo)', percentage: 14 },
    { segment: 'Mid-High (¥300–500)', percentage: 26 },
    { segment: 'Mid (¥150–300)', percentage: 38 },
    { segment: 'Budget (<¥150)', percentage: 22 },
  ];
}

function buildXiaohongshuDraft(result: CampaignResult) {
  const xhs = result.kol_matches.find((kol) => kol.platform === 'xiaohongshu') ?? result.kol_matches[0];
  if (!xhs) return 'No Xiaohongshu draft available yet.';
  return [
    `标题：${xhs.collaboration_suggestion.sample_title}`,
    '',
    `开头钩子：${xhs.collaboration_suggestion.sample_hook}`,
    '',
    `内容角度：${xhs.collaboration_suggestion.content_angle}`,
    '',
    `核心信息：${xhs.collaboration_suggestion.key_message}`,
    '',
    `预估表现：曝光 ${xhs.collaboration_suggestion.estimated_performance.views_range[0]}-${xhs.collaboration_suggestion.estimated_performance.views_range[1]}，互动 ${xhs.collaboration_suggestion.estimated_performance.engagement_range[0]}-${xhs.collaboration_suggestion.estimated_performance.engagement_range[1]}`,
  ].join('\n');
}

function buildDouyinDraft(result: CampaignResult) {
  const douyin = result.kol_matches.find((kol) => kol.platform === 'douyin') ?? result.kol_matches[0];
  if (!douyin) return 'No Douyin draft available yet.';
  return [
    `开场：${douyin.collaboration_suggestion.sample_hook}`,
    '',
    `内容形式：${douyin.collaboration_suggestion.content_format}`,
    '',
    `表达角度：${douyin.collaboration_suggestion.content_angle}`,
    '',
    `标题方向：${douyin.collaboration_suggestion.sample_title}`,
    '',
    `重点信息：${douyin.collaboration_suggestion.key_message}`,
  ].join('\n');
}

export function toAnalysisResult(result: CampaignResult): AnalysisResult {
  const opportunities = result.agent_a_output.core_selling_points.slice(0, 4).map((point, index) => ({
    title: point.point,
    description: `${point.evidence} China relevance: ${point.china_relevance}.`,
    icon: ['TrendingUp', 'Zap', 'Target', 'Shield'][index] ?? 'TrendingUp',
  }));

  const kols = result.kol_matches.slice(0, 4).map((kol) => ({
    id: kol.kol_id,
    name: kol.name,
    avatar: '',
    platform: kol.platform === 'xiaohongshu' ? 'Xiaohongshu' : 'Douyin',
    followers: `${(kol.followers / 10000).toFixed(1)}W`,
    engagement: `${(kol.avg_engagement * 100).toFixed(1)}%`,
    matchReason: kol.match_reasoning.headline,
    priceRange: `¥${kol.price_range.min.toLocaleString()} – ¥${kol.price_range.max.toLocaleString()}`,
    contentTags: kol.audience_profile.top_interests.slice(0, 3),
    badge: `${kol.role} · Match ${kol.match_score}`,
  }));

  const interestTags = Array.from(
    new Set(result.kol_matches.flatMap((kol) => kol.audience_profile.top_interests)),
  ).slice(0, 8);

  return {
    opportunities,
    kols,
    audience: {
      ageDistribution: aggregateAgeDistribution(result),
      cityTier: aggregateCityTier(result),
      spendingPower: spendingPowerFromQuestionnaire(result),
      interestTags,
    },
    campaign: {
      xiaohongshuPost: buildXiaohongshuDraft(result),
      douyinScript: buildDouyinDraft(result),
      kolOutreach: result.outreach_drafts[0]?.body ?? 'No outreach draft available yet.',
    },
  };
}

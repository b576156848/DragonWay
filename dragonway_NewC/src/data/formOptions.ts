import type { Locale } from '@/lib/i18n';

type Option = { value: string; label: string };
type OptionMap = Record<string, string>;

const optionLabels: Record<Locale, OptionMap> = {
  en: {
    dry: 'Dry Kibble', wet: 'Wet / Canned', freeze_dried: 'Freeze-Dried',
    air_dried: 'Air-Dried', fresh: 'Fresh / Refrigerated', other: 'Other',
    dog: 'Dog', cat: 'Cat',
    puppy: 'Puppy / Kitten', adult: 'Adult', senior: 'Senior', all_life: 'All Life Stages',
    high_protein: 'High Protein', grain_free: 'Grain Free', limited_ingredient: 'Limited Ingredient',
    fresh_ingredients: 'Fresh Ingredients', digestive_health: 'Digestive Health',
    skin_coat: 'Skin & Coat', joint_support: 'Joint Support', vet_backed: 'Vet-Backed',
    premium_imported: 'Premium Imported',
    brand_awareness: 'Brand Awareness', find_kol: 'Find KOLs', test_feedback: 'Test & Get Feedback',
    find_distributor: 'Find Distributor', direct_sales: 'Direct Sales',
    dog_owner: 'Dog Owner', cat_owner: 'Cat Owner', multi_pet: 'Multi-Pet',
    tier1: 'Tier 1 (Beijing, Shanghai, etc.)', new_tier1: 'New Tier 1 (Chengdu, Hangzhou, etc.)',
    tier2: 'Tier 2', any: 'Any / Not Sure',
    high: 'High (¥500+/mo)', mid_high: 'Mid-High (¥300–500/mo)', mid: 'Mid (¥150–300/mo)',
    scientific: 'Scientific / Evidence-Based', natural: 'Natural / Wholesome',
    premium_import: 'Premium Import', functional: 'Functional / Health-Focused',
    palatability: 'Taste / Palatability',
    xiaohongshu: 'Xiaohongshu (小红书)', douyin: 'Douyin (抖音)',
    ingredient_review: 'Ingredient Review', unboxing: 'Unboxing', dog_reaction: 'Dog Reaction',
    educational: 'Educational', vet_endorsement: 'Vet Endorsement', lifestyle: 'Lifestyle',
    expert: 'Expert / Authority', reviewer: 'Reviewer', lifestyle_creator: 'Lifestyle Creator',
    micro_engaged: 'Micro (High Engagement)', mid_volume: 'Mid-Tier (Volume Reach)',
    no_preference: 'No Preference',
    lt10k: 'Under $10K', '10k_30k': '$10K – $30K', '30k_80k': '$30K – $80K', gt80k: '$80K+',
    '2_weeks': '2 Weeks', '1_month': '1 Month', '1_3_months': '1–3 Months', after_review: 'After Review',
  },
  zh: {
    dry: '干粮', wet: '湿粮 / 罐头', freeze_dried: '冻干',
    air_dried: '风干', fresh: '鲜粮 / 冷藏', other: '其他',
    dog: '狗', cat: '猫',
    puppy: '幼犬 / 幼猫', adult: '成年', senior: '老年', all_life: '全阶段',
    high_protein: '高蛋白', grain_free: '无谷', limited_ingredient: '有限配方',
    fresh_ingredients: '新鲜食材', digestive_health: '消化健康',
    skin_coat: '皮肤毛发', joint_support: '关节养护', vet_backed: '兽医推荐',
    premium_imported: '进口高端',
    brand_awareness: '品牌知名度', find_kol: '寻找 KOL', test_feedback: '测试与反馈',
    find_distributor: '寻找经销商', direct_sales: '直接销售',
    dog_owner: '养狗人群', cat_owner: '养猫人群', multi_pet: '多宠物家庭',
    tier1: '一线城市（北京、上海等）', new_tier1: '新一线（成都、杭州等）',
    tier2: '二线城市', any: '不限 / 不确定',
    high: '高端（¥500+/月）', mid_high: '中高端（¥300–500/月）', mid: '中端（¥150–300/月）',
    scientific: '科学 / 循证', natural: '天然 / 健康',
    premium_import: '高端进口', functional: '功能性 / 健康导向',
    palatability: '口味 / 适口性',
    xiaohongshu: '小红书', douyin: '抖音',
    ingredient_review: '成分测评', unboxing: '开箱体验', dog_reaction: '宠物反应',
    educational: '科普教育', vet_endorsement: '兽医背书', lifestyle: '生活方式',
    expert: '专家 / 权威', reviewer: '测评博主', lifestyle_creator: '生活方式博主',
    micro_engaged: '小微 KOL（高互动）', mid_volume: '中腰部（覆盖量）',
    no_preference: '无偏好',
    lt10k: '1 万美元以下', '10k_30k': '1–3 万美元', '30k_80k': '3–8 万美元', gt80k: '8 万美元以上',
    '2_weeks': '2 周', '1_month': '1 个月', '1_3_months': '1–3 个月', after_review: '评估后确定',
  },
};

const makeOptions = (values: string[], locale: Locale): Option[] =>
  values.map(v => ({ value: v, label: optionLabels[locale][v] || v }));

export const getFoodFormats = (locale: Locale) => makeOptions(['dry', 'wet', 'freeze_dried', 'air_dried', 'fresh', 'other'], locale);
export const getPetTypes = (locale: Locale) => makeOptions(['dog', 'cat'], locale);
export const getLifeStages = (locale: Locale) => makeOptions(['puppy', 'adult', 'senior', 'all_life'], locale);
export const getCoreClaims = (locale: Locale) => makeOptions(['high_protein', 'grain_free', 'limited_ingredient', 'fresh_ingredients', 'digestive_health', 'skin_coat', 'joint_support', 'vet_backed', 'premium_imported'], locale);
export const getPrimaryGoals = (locale: Locale) => makeOptions(['brand_awareness', 'find_kol', 'test_feedback', 'find_distributor', 'direct_sales'], locale);
export const getOwnerPetOptions = (locale: Locale) => makeOptions(['dog_owner', 'cat_owner', 'multi_pet'], locale);
export const getOwnerCityOptions = (locale: Locale) => makeOptions(['tier1', 'new_tier1', 'tier2', 'any'], locale);
export const getOwnerPriceOptions = (locale: Locale) => makeOptions(['high', 'mid_high', 'mid'], locale);
export const getBrandPositions = (locale: Locale) => makeOptions(['scientific', 'natural', 'premium_import', 'functional', 'palatability'], locale);
export const getPlatforms = (locale: Locale) => makeOptions(['xiaohongshu', 'douyin'], locale);
export const getContentPrefs = (locale: Locale) => makeOptions(['ingredient_review', 'unboxing', 'dog_reaction', 'educational', 'vet_endorsement', 'lifestyle'], locale);
export const getKolTypes = (locale: Locale) => makeOptions(['expert', 'reviewer', 'lifestyle_creator', 'micro_engaged', 'mid_volume', 'no_preference'], locale);
export const getBudgetBands = (locale: Locale) => makeOptions(['lt10k', '10k_30k', '30k_80k', 'gt80k'], locale);
export const getTimelines = (locale: Locale) => makeOptions(['2_weeks', '1_month', '1_3_months', 'after_review'], locale);

// Keep static exports for backward compatibility
export const FOOD_FORMATS = makeOptions(['dry', 'wet', 'freeze_dried', 'air_dried', 'fresh', 'other'], 'en');
export const PET_TYPES = makeOptions(['dog', 'cat'], 'en');
export const LIFE_STAGES = makeOptions(['puppy', 'adult', 'senior', 'all_life'], 'en');
export const CORE_CLAIMS = makeOptions(['high_protein', 'grain_free', 'limited_ingredient', 'fresh_ingredients', 'digestive_health', 'skin_coat', 'joint_support', 'vet_backed', 'premium_imported'], 'en');
export const PRIMARY_GOALS = makeOptions(['brand_awareness', 'find_kol', 'test_feedback', 'find_distributor', 'direct_sales'], 'en');
export const OWNER_PET_OPTIONS = makeOptions(['dog_owner', 'cat_owner', 'multi_pet'], 'en');
export const OWNER_CITY_OPTIONS = makeOptions(['tier1', 'new_tier1', 'tier2', 'any'], 'en');
export const OWNER_PRICE_OPTIONS = makeOptions(['high', 'mid_high', 'mid'], 'en');
export const BRAND_POSITIONS = makeOptions(['scientific', 'natural', 'premium_import', 'functional', 'palatability'], 'en');
export const PLATFORMS = makeOptions(['xiaohongshu', 'douyin'], 'en');
export const CONTENT_PREFS = makeOptions(['ingredient_review', 'unboxing', 'dog_reaction', 'educational', 'vet_endorsement', 'lifestyle'], 'en');
export const KOL_TYPES = makeOptions(['expert', 'reviewer', 'lifestyle_creator', 'micro_engaged', 'mid_volume', 'no_preference'], 'en');
export const BUDGET_BANDS = makeOptions(['lt10k', '10k_30k', '30k_80k', 'gt80k'], 'en');
export const TIMELINES = makeOptions(['2_weeks', '1_month', '1_3_months', 'after_review'], 'en');

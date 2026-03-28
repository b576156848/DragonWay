import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Locale = 'en' | 'zh';

const translations = {
  en: {
    // Header
    headerSubtitle: '/ 入华引擎',
    newAnalysis: 'New Analysis',

    // Hero
    heroBadge: 'AI-Powered KOL Matching',
    heroTitle: 'Help US brands launch in China with an AI go-to-market agent',
    heroSubtitle: 'From product analysis to KOL matching and campaign draft — in 5 minutes',
    tryDemo: 'Try the Demo',
    seeHow: 'See How It Works',

    // Workflow
    workflowTitle: 'Your AI agent runs the full pipeline',
    workflowSubtitle: 'Not a chatbot. A full execution pipeline.',
    stepPasteLink: 'Paste link',
    stepAnalyze: 'Analyze',
    stepMatchKols: 'Match KOLs',
    stepGenContent: 'Generate content',
    stepSubmit: 'Submit',

    // Trust
    trustFounder: 'Built by a team with cross-border market understanding\nand hands-on knowledge of China\'s KOL ecosystem.',
    trustTitle: 'Why this works',
    trustCard1Title: 'Structured KOL Matching',
    trustCard1Desc: 'AI-driven filtering by niche, engagement, and audience fit.',
    trustCard2Title: 'Localized Content Generation',
    trustCard2Desc: 'Platform-native drafts for Xiaohongshu and Douyin.',
    trustCard3Title: 'Workflow-based Handoff',
    trustCard3Desc: 'From brief to deliverable, not just a recommendation.',
    trustCard4Title: 'Real China Go-to-Market',
    trustCard4Desc: 'Built for actual campaign execution, not theoretical advice.',
    trustTagline: 'Not just insights — a launch-ready China campaign draft.',

    // CTA
    ctaTitle: 'Ready to see it in action?',

    // Mode Selector
    modeQuickTitle: 'Quick Match',
    modeQuickSubtitle: 'Chat with our Agent — 2 min, 6 questions',
    modeQuickDesc: 'Paste your product link, answer a few quick questions, get KOL recommendations instantly.',
    modeQuickBadge: 'Recommended',
    modeDetailedTitle: 'Detailed Brief',
    modeDetailedSubtitle: 'Full questionnaire — 3 min, 13 questions',
    modeDetailedDesc: 'Provide a complete brand brief for more precise matching and strategy.',

    // Results
    resultsTitle: 'Your China Market Plan',
    resultsSubtitle: 'AI-generated analysis and KOL matching results',

    // Footer
    footerText: 'DragonWay Lab — AI-Powered China Market Entry for Pet Brands',

    // Chat Agent
    chatWelcome: "Hi! I'm your DragonWay AI agent. I'll help you find the perfect Chinese KOLs for your pet food brand. Let's start — paste your product URL below.",
    chatUrlPlaceholder: 'Paste your Shopify or brand link...',
    chatAnalyzing: 'Analyzing your product page...',
    chatFoodFormat: "Got it! I can see this is a premium product. What's the food format?",
    chatPetType: 'And is this for dogs or cats?',
    chatCoreClaims: 'What are the top selling points? Pick up to 3.',
    chatOwnerCity: 'Which city tier are you targeting in China?',
    chatOwnerPrice: 'What spending level does your target audience fall into?',
    chatBudgetBand: "What's your marketing budget range for this campaign?",
    chatPlatforms: 'Which platforms do you want to focus on?',
    chatMatching: 'Great! Let me match you with the best KOLs from our China creator pool...',
    chatKolResults: "Here are your top 3 KOL matches. Review them and tell me — which one would you like to swap out?",
    chatRefine: 'One more question — do you prefer reach or conversion for this campaign?',
    chatFinal: "Your optimized KOL combination is ready! I've expanded your plan to 4 creators based on your preferences.",
    chatConfirmSwap: 'Confirm swap',
    chatSwapOut: 'Swap out',
    chatTapToSwap: 'Tap to swap',
    chatSwapThis: 'Swap this one',
    chatReachLabel: 'Reach — maximum exposure',
    chatConversionLabel: 'Conversion — targeted results',
    chatReachAnswer: 'Reach — I want maximum exposure',
    chatConversionAnswer: 'Conversion — I want targeted results',
    chatOptimize: 'Optimize my KOL mix',
    chatViewReport: 'View Full Report',
    chatNew: 'New',
    chatConfirm: 'Confirm',

    // Questionnaire Form
    formProductUrl: 'Product URL',
    formUrlPlaceholder: 'https://shopify.com/products/your-product',
    formFoodFormat: 'Food Format',
    formPetType: 'Pet Type',
    formLifeStage: 'Life Stage',
    formCoreClaims: 'Core Claims (max 3)',
    formPrimaryGoal: 'Primary Goal',
    formBrandPositioning: 'Brand Positioning',
    formTargetOwner: 'Target Owner',
    formCityTier: 'City Tier',
    formPriceTier: 'Price Tier',
    formPreferredPlatforms: 'Preferred Platforms',
    formContentPref: 'Content Preference (max 3)',
    formKolType: 'Preferred KOL Type',
    formBudgetRange: 'Budget Range',
    formTimeline: 'Timeline',
    formConstraints: 'Special Constraints (optional)',
    formConstraintsPlaceholder: 'Any specific requirements, restrictions, or notes...',
    formSelect: 'Select',
    formBack: 'Back',
    formNext: 'Next',
    formStartMatching: 'Start Matching',
    formStepProduct: 'Product Info',
    formStepStrategy: 'Strategy',
    formStepContent: 'Content & Budget',

    // Form Options
    optDryKibble: 'Dry Kibble',
    optWetCanned: 'Wet / Canned',
    optFreezeDried: 'Freeze-Dried',
    optAirDried: 'Air-Dried',
    optFreshRefrigerated: 'Fresh / Refrigerated',
    optOther: 'Other',
    optDog: 'Dog',
    optCat: 'Cat',
    optPuppyKitten: 'Puppy / Kitten',
    optAdult: 'Adult',
    optSenior: 'Senior',
    optAllLifeStages: 'All Life Stages',
    optHighProtein: 'High Protein',
    optGrainFree: 'Grain Free',
    optLimitedIngredient: 'Limited Ingredient',
    optFreshIngredients: 'Fresh Ingredients',
    optDigestiveHealth: 'Digestive Health',
    optSkinCoat: 'Skin & Coat',
    optJointSupport: 'Joint Support',
    optVetBacked: 'Vet-Backed',
    optPremiumImported: 'Premium Imported',
    optBrandAwareness: 'Brand Awareness',
    optFindKols: 'Find KOLs',
    optTestFeedback: 'Test & Get Feedback',
    optFindDistributor: 'Find Distributor',
    optDirectSales: 'Direct Sales',
    optDogOwner: 'Dog Owner',
    optCatOwner: 'Cat Owner',
    optMultiPet: 'Multi-Pet',
    optTier1: 'Tier 1 (Beijing, Shanghai, etc.)',
    optNewTier1: 'New Tier 1 (Chengdu, Hangzhou, etc.)',
    optTier2: 'Tier 2',
    optAnyNotSure: 'Any / Not Sure',
    optHigh: 'High (¥500+/mo)',
    optMidHigh: 'Mid-High (¥300–500/mo)',
    optMid: 'Mid (¥150–300/mo)',
    optScientific: 'Scientific / Evidence-Based',
    optNatural: 'Natural / Wholesome',
    optPremiumImport: 'Premium Import',
    optFunctional: 'Functional / Health-Focused',
    optPalatability: 'Taste / Palatability',
    optXiaohongshu: 'Xiaohongshu (小红书)',
    optDouyin: 'Douyin (抖音)',
    optIngredientReview: 'Ingredient Review',
    optUnboxing: 'Unboxing',
    optDogReaction: 'Dog Reaction',
    optEducational: 'Educational',
    optVetEndorsement: 'Vet Endorsement',
    optLifestyle: 'Lifestyle',
    optExpert: 'Expert / Authority',
    optReviewer: 'Reviewer',
    optLifestyleCreator: 'Lifestyle Creator',
    optMicroEngaged: 'Micro (High Engagement)',
    optMidVolume: 'Mid-Tier (Volume Reach)',
    optNoPreference: 'No Preference',
    optUnder10k: 'Under $10K',
    opt10k30k: '$10K – $30K',
    opt30k80k: '$30K – $80K',
    opt80kPlus: '$80K+',
    opt2Weeks: '2 Weeks',
    opt1Month: '1 Month',
    opt1to3Months: '1–3 Months',
    optAfterReview: 'After Review',
  },
  zh: {
    // Header
    headerSubtitle: '/ 入华引擎',
    newAnalysis: '新建分析',

    // Hero
    heroBadge: 'AI 驱动的 KOL 匹配',
    heroTitle: '用 AI 市场代理帮助美国品牌进入中国市场',
    heroSubtitle: '从产品分析到 KOL 匹配和营销方案 — 仅需 5 分钟',
    tryDemo: '体验演示',
    seeHow: '了解工作流程',

    // Workflow
    workflowTitle: '你的 AI 代理运行完整流程',
    workflowSubtitle: '不是聊天机器人，而是完整的执行管线。',
    stepPasteLink: '粘贴链接',
    stepAnalyze: '分析产品',
    stepMatchKols: '匹配 KOL',
    stepGenContent: '生成内容',
    stepSubmit: '提交方案',

    // Trust
    trustFounder: '由具备跨境市场洞察力和中国 KOL 生态\n实操经验的团队打造。',
    trustTitle: '为什么有效',
    trustCard1Title: '结构化 KOL 匹配',
    trustCard1Desc: '基于细分领域、互动率和受众契合度的 AI 筛选。',
    trustCard2Title: '本地化内容生成',
    trustCard2Desc: '为小红书和抖音定制的平台原生内容草稿。',
    trustCard3Title: '工作流式交付',
    trustCard3Desc: '从简报到交付物，不只是推荐。',
    trustCard4Title: '真正的中国 GTM',
    trustCard4Desc: '为实际营销执行而生，非纸上谈兵。',
    trustTagline: '不只是洞察 — 而是一套可执行的中国营销方案。',

    // CTA
    ctaTitle: '准备好看看效果了吗？',

    // Mode Selector
    modeQuickTitle: '快速匹配',
    modeQuickSubtitle: '与 AI 代理对话 — 2 分钟，6 个问题',
    modeQuickDesc: '粘贴产品链接，回答几个问题，即刻获取 KOL 推荐。',
    modeQuickBadge: '推荐',
    modeDetailedTitle: '详细简报',
    modeDetailedSubtitle: '完整问卷 — 3 分钟，13 个问题',
    modeDetailedDesc: '提供完整的品牌简报，获得更精准的匹配和策略。',

    // Results
    resultsTitle: '你的中国市场方案',
    resultsSubtitle: 'AI 生成的分析和 KOL 匹配结果',

    // Footer
    footerText: 'DragonWay Lab — AI 驱动的宠物品牌入华引擎',

    // Chat Agent
    chatWelcome: '你好！我是 DragonWay AI 代理。我来帮你为宠物食品品牌找到最合适的中国 KOL。首先，请粘贴你的产品链接。',
    chatUrlPlaceholder: '粘贴你的 Shopify 或品牌链接...',
    chatAnalyzing: '正在分析你的产品页面...',
    chatFoodFormat: '收到！看起来这是一款高端产品。食品形态是什么？',
    chatPetType: '这是给狗还是猫的？',
    chatCoreClaims: '主要卖点是什么？最多选 3 个。',
    chatOwnerCity: '你想在中国的哪个城市层级推广？',
    chatOwnerPrice: '你的目标受众消费水平是？',
    chatBudgetBand: '这次营销活动的预算范围是多少？',
    chatPlatforms: '你想重点在哪些平台推广？',
    chatMatching: '很好！让我从中国创作者池中为你匹配最佳 KOL...',
    chatKolResults: '以下是你的前 3 名 KOL 匹配。看一下，告诉我你想替换哪一个？',
    chatRefine: '最后一个问题 — 这次活动你更看重曝光量还是转化率？',
    chatFinal: '你的优化 KOL 组合已准备好！根据你的偏好，我已将方案扩展为 4 位创作者。',
    chatConfirmSwap: '确认替换',
    chatSwapOut: '替换',
    chatTapToSwap: '点击替换',
    chatSwapThis: '替换此人',
    chatReachLabel: '曝光 — 最大化覆盖',
    chatConversionLabel: '转化 — 精准投放',
    chatReachAnswer: '曝光 — 我要最大覆盖范围',
    chatConversionAnswer: '转化 — 我要精准的结果',
    chatOptimize: '优化我的 KOL 组合',
    chatViewReport: '查看完整报告',
    chatNew: '新增',
    chatConfirm: '确认',

    // Questionnaire Form
    formProductUrl: '产品链接',
    formUrlPlaceholder: 'https://shopify.com/products/your-product',
    formFoodFormat: '食品形态',
    formPetType: '宠物类型',
    formLifeStage: '生命阶段',
    formCoreClaims: '核心卖点（最多 3 个）',
    formPrimaryGoal: '主要目标',
    formBrandPositioning: '品牌定位',
    formTargetOwner: '目标用户',
    formCityTier: '城市层级',
    formPriceTier: '消费水平',
    formPreferredPlatforms: '首选平台',
    formContentPref: '内容偏好（最多 3 个）',
    formKolType: '首选 KOL 类型',
    formBudgetRange: '预算范围',
    formTimeline: '时间安排',
    formConstraints: '特殊要求（选填）',
    formConstraintsPlaceholder: '任何特定要求、限制或备注...',
    formSelect: '请选择',
    formBack: '返回',
    formNext: '下一步',
    formStartMatching: '开始匹配',
    formStepProduct: '产品信息',
    formStepStrategy: '策略',
    formStepContent: '内容与预算',

    // Form Options
    optDryKibble: '干粮',
    optWetCanned: '湿粮 / 罐头',
    optFreezeDried: '冻干',
    optAirDried: '风干',
    optFreshRefrigerated: '鲜粮 / 冷藏',
    optOther: '其他',
    optDog: '狗',
    optCat: '猫',
    optPuppyKitten: '幼犬 / 幼猫',
    optAdult: '成年',
    optSenior: '老年',
    optAllLifeStages: '全阶段',
    optHighProtein: '高蛋白',
    optGrainFree: '无谷',
    optLimitedIngredient: '有限配方',
    optFreshIngredients: '新鲜食材',
    optDigestiveHealth: '消化健康',
    optSkinCoat: '皮肤毛发',
    optJointSupport: '关节养护',
    optVetBacked: '兽医推荐',
    optPremiumImported: '进口高端',
    optBrandAwareness: '品牌知名度',
    optFindKols: '寻找 KOL',
    optTestFeedback: '测试与反馈',
    optFindDistributor: '寻找经销商',
    optDirectSales: '直接销售',
    optDogOwner: '养狗人群',
    optCatOwner: '养猫人群',
    optMultiPet: '多宠物家庭',
    optTier1: '一线城市（北京、上海等）',
    optNewTier1: '新一线（成都、杭州等）',
    optTier2: '二线城市',
    optAnyNotSure: '不限 / 不确定',
    optHigh: '高端（¥500+/月）',
    optMidHigh: '中高端（¥300–500/月）',
    optMid: '中端（¥150–300/月）',
    optScientific: '科学 / 循证',
    optNatural: '天然 / 健康',
    optPremiumImport: '高端进口',
    optFunctional: '功能性 / 健康导向',
    optPalatability: '口味 / 适口性',
    optXiaohongshu: '小红书',
    optDouyin: '抖音',
    optIngredientReview: '成分测评',
    optUnboxing: '开箱体验',
    optDogReaction: '宠物反应',
    optEducational: '科普教育',
    optVetEndorsement: '兽医背书',
    optLifestyle: '生活方式',
    optExpert: '专家 / 权威',
    optReviewer: '测评博主',
    optLifestyleCreator: '生活方式博主',
    optMicroEngaged: '小微 KOL（高互动）',
    optMidVolume: '中腰部（覆盖量）',
    optNoPreference: '无偏好',
    optUnder10k: '1 万美元以下',
    opt10k30k: '1–3 万美元',
    opt30k80k: '3–8 万美元',
    opt80kPlus: '8 万美元以上',
    opt2Weeks: '2 周',
    opt1Month: '1 个月',
    opt1to3Months: '1–3 个月',
    optAfterReview: '评估后确定',
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface I18nContextValue {
  locale: Locale;
  t: (key: TranslationKey) => string;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('locale') as Locale) || 'en';
    }
    return 'en';
  });

  const t = useCallback((key: TranslationKey): string => {
    return translations[locale][key] || translations.en[key] || key;
  }, [locale]);

  const toggleLocale = useCallback(() => {
    setLocale(prev => {
      const next = prev === 'en' ? 'zh' : 'en';
      localStorage.setItem('locale', next);
      return next;
    });
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t, toggleLocale }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};

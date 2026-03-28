import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Locale = 'en' | 'zh';

const translations = {
  en: {
    // Header
    headerSubtitle: '/ 入华引擎',
    newAnalysis: 'New Analysis',

    // Hero
    heroBadge: 'AI-Powered KOL Matching',
    heroTitle: 'AI-Powered China Market Entry',
    heroSubtitle: 'From product analysis to KOL matching and outreach — all in one workflow',
    tryDemo: 'Get Your China GTM Plan',
    seeHow: 'Why It Works',
    trySample: 'or try with a sample product →',

    // Workflow
    workflowTitle: 'Your AI agent runs the full pipeline',
    workflowSubtitle: 'Not a chatbot. A full execution pipeline.',
    stepPasteLink: 'Understand Your Product',
    stepAnalyze: 'Translate To China Market',
    stepMatchKols: 'Find The Right KOLs',
    stepGenContent: 'Generate Campaign Content',
    stepSubmit: 'Launch Outreach Instantly',
    stepPasteLinkDesc: 'Drop your product URL and our agent extracts key attributes — ingredients, claims, positioning — automatically.',
    stepAnalyzeDesc: "The agent maps your product to China's competitive landscape, identifying whitespace opportunities and audience fit.",
    stepMatchKolsDesc: 'Structured KOL matching filters by niche, engagement rate, audience demographics, and platform — not just follower count.',
    stepGenContentDesc: 'Localized, platform-native content drafts for Xiaohongshu and Douyin, ready for KOL review and posting.',
    stepSubmitDesc: 'A complete workflow-based handoff — not just insights, but a launch-ready China campaign draft.',
    trustFounder: "Built by a team with cross-border market understanding\nand hands-on knowledge of China's KOL ecosystem.",

    // CTA
    ctaTitle: 'Ready to see it in action?',
    ctaHelper: 'Start simple. Refine later.',

    // Mode Selector
    modeQuickTitle: 'Quick Match',
    modeQuickSubtitle: 'Get results in 2 minutes',
    modeQuickDesc: 'Paste your product link, answer a few quick questions, get KOL recommendations instantly.',
    modeQuickBadge: 'Recommended',
    modeDetailedTitle: 'Detailed Brief',
    modeDetailedSubtitle: 'More precise strategy',
    modeDetailedDesc: 'Provide a complete brand brief for more precise matching and strategy.',

    // Results
    resultsTitle: 'Your China Market Plan',
    resultsSubtitle: 'AI-generated analysis and KOL matching results',

    // Opportunity Cards
    opportunityTitle: 'Product Opportunity Analysis',
    opportunitySubtitle: 'Why this product has strong potential in China\'s pet food market',

    // KOL Cards
    kolTitleRound1: 'Top 3 KOL Recommendations',
    kolTitleRound2: 'Optimized KOL Combination',
    kolSubRound1: 'AI-matched creators for your product and audience — select which to keep',
    kolSubRound2: 'creators optimized based on your preferences',
    kolRound2Badge: 'Round 2',
    kolFollowers: 'Followers',
    kolEngagement: 'Engagement',
    kolFrom: 'From',
    kolKeep: 'Keep',
    kolDrop: 'Drop',
    kolConfirmed: 'Confirmed',
    kolNewRec: 'New',
    kolRefineTitle: 'Optimize Recommendations',
    kolRefineSubtitle: 'Answer these questions to optimize your KOL mix',
    kolRefinePriority: 'What matters most to you?',
    kolRefineViral: 'Viral reach',
    kolRefineConversion: 'Precise conversion',
    kolRefineEndorsement: 'Professional endorsement',
    kolRefineBudget: 'Can you adjust your budget?',
    kolRefineBudgetKeep: 'Keep current budget',
    kolRefineBudgetIncrease: 'Can increase',
    kolRefineStyle: 'Content style preference?',
    kolRefineEducational: 'Educational',
    kolRefineLifestyle: 'Lifestyle',
    kolRefineComedy: 'Comedy / Creative',
    kolRefineButton: '🐾 Optimize my KOL mix',
    kolOptimizing: 'Optimizing KOL Combination...',
    kolOptimizingSub: 'Re-matching based on your preferences',
    kolOptimizingMsg: 'AI is optimizing your KOL mix…',

    // Audience Charts
    audienceTitle: 'Audience Visualization',
    audienceSubtitle: 'Combined audience profile of recommended KOLs',
    audienceAge: 'Age Distribution',
    audienceCity: 'City Tier Distribution',
    audienceSpending: 'Spending Power',
    audienceInterest: 'Interest Tags',

    // Campaign Content
    campaignTitle: 'Generated Campaign Content',
    campaignSubtitle: 'Ready-to-use drafts for each platform',
    campaignXhs: 'Xiaohongshu Post',
    campaignDouyin: 'Douyin Script',
    campaignDm: 'KOL Outreach DM',

    // Push Status
    pushTitle: 'Plan Generated & Forwarded',
    pushSubtitle: 'Your China KOL marketing plan has been pushed to our partner network',
    pushAnalysis: 'Analysis complete',
    pushAnalysisDesc: 'Product opportunity & audience mapped',
    pushKolsMatched: 'KOLs matched',
    pushKolsMatchedDesc: '3 creators selected from 2,400+ pool',
    pushContentGen: 'Content generated',
    pushContentGenDesc: 'Campaign drafts ready for review',
    pushForwarded: 'Plan forwarded',
    pushForwardedDesc: 'Sent to China-side partner network',

    // Email Capture
    emailTitle: 'Get the Full Plan',
    emailSubtitle: 'We\'ll send you the complete analysis with actionable next steps.',
    emailSentTitle: 'Plan sent!',
    emailSentSubtitle: 'We\'ll follow up with your detailed KOL marketing plan and next steps.',
    emailWorkLabel: 'Work Email',
    emailWorkPlaceholder: 'you@company.com',
    emailCompanyLabel: 'Company (optional)',
    emailCompanyPlaceholder: 'Your brand or company name',
    emailSubmitButton: 'Send Me the Plan',

    // Agent Progress
    agentRunning: 'Agent Running',
    agentAnalyzing: 'Analyzing your product',
    agentBuildingPlan: 'Our AI agent is building your China market plan',
    agentProcessing: 'processing...',
    agentDone: 'done ✓',
    agentStepExtract: 'Extracting product selling points',
    agentStepAudience: 'Inferring target audience profile',
    agentStepMatching: 'Matching China KOL pool',
    agentStepContent: 'Generating campaign content',
    agentStepPush: 'Preparing push package',

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
    heroTitle: 'AI 驱动的中国市场进入方案',
    heroSubtitle: '从产品分析到 KOL 匹配与触达，全部串在一条工作流里',
    tryDemo: '获取你的中国 GTM 方案',
    seeHow: '为什么有效',
    trySample: '或使用示例产品体验 →',

    // Workflow
    workflowTitle: '你的 AI 代理运行完整流程',
    workflowSubtitle: '不是聊天机器人，而是完整的执行管线。',
    stepPasteLink: '理解你的产品',
    stepAnalyze: '转化为中国市场策略',
    stepMatchKols: '找到合适的 KOL',
    stepGenContent: '生成营销内容',
    stepSubmit: '即刻启动推广',
    stepPasteLinkDesc: '粘贴产品链接，AI 代理自动提取关键属性 — 成分、卖点、定位。',
    stepAnalyzeDesc: 'AI 代理将你的产品映射到中国竞争格局，识别市场空白和受众契合度。',
    stepMatchKolsDesc: '结构化 KOL 匹配，按细分领域、互动率、受众画像和平台筛选 — 不只看粉丝数。',
    stepGenContentDesc: '为小红书和抖音生成本地化、平台原生的内容草稿，可直接供 KOL 审阅和发布。',
    stepSubmitDesc: '完整的工作流式交付 — 不只是洞察，而是一套可执行的中国营销方案。',
    trustFounder: '由具备跨境市场洞察力和中国 KOL 生态\n实操经验的团队打造。',

    // CTA
    ctaTitle: '准备好看看效果了吗？',
    ctaHelper: '先快速体验，再逐步优化。',

    // Mode Selector
    modeQuickTitle: '快速匹配',
    modeQuickSubtitle: '2 分钟获取结果',
    modeQuickDesc: '粘贴产品链接，回答几个问题，即刻获取 KOL 推荐。',
    modeQuickBadge: '推荐',
    modeDetailedTitle: '详细简报',
    modeDetailedSubtitle: '更精准的策略',
    modeDetailedDesc: '提供完整的品牌简报，获得更精准的匹配和策略。',

    // Results
    resultsTitle: '你的中国市场方案',
    resultsSubtitle: 'AI 生成的分析和 KOL 匹配结果',

    // Opportunity Cards
    opportunityTitle: '产品机会分析',
    opportunitySubtitle: '为什么该产品在中国宠物食品市场有巨大潜力',

    // KOL Cards
    kolTitleRound1: '前 3 名 KOL 推荐',
    kolTitleRound2: '优化后的 KOL 组合',
    kolSubRound1: 'AI 为你的产品和受众匹配的创作者 — 选择要保留的',
    kolSubRound2: '位创作者已根据你的偏好优化',
    kolRound2Badge: '第二轮',
    kolFollowers: '粉丝数',
    kolEngagement: '互动率',
    kolFrom: '起步价',
    kolKeep: '保留',
    kolDrop: '换掉',
    kolConfirmed: '已确认',
    kolNewRec: '新推荐',
    kolRefineTitle: '优化推荐',
    kolRefineSubtitle: '回答以下问题，我们将为你优化 KOL 组合',
    kolRefinePriority: '你更看重什么？',
    kolRefineViral: '声量破圈',
    kolRefineConversion: '精准转化',
    kolRefineEndorsement: '专业背书',
    kolRefineBudget: '预算可以调整吗？',
    kolRefineBudgetKeep: '维持原预算',
    kolRefineBudgetIncrease: '可以往上调',
    kolRefineStyle: '内容风格偏好？',
    kolRefineEducational: '专业科普',
    kolRefineLifestyle: '生活日常',
    kolRefineComedy: '搞笑创意',
    kolRefineButton: '🐾 优化我的 KOL 组合',
    kolOptimizing: '正在优化 KOL 组合...',
    kolOptimizingSub: '正在根据你的偏好重新匹配',
    kolOptimizingMsg: 'AI 正在优化你的 KOL 组合…',

    // Audience Charts
    audienceTitle: '受众画像可视化',
    audienceSubtitle: '推荐 KOL 的综合受众画像',
    audienceAge: '年龄分布',
    audienceCity: '城市层级分布',
    audienceSpending: '消费能力',
    audienceInterest: '兴趣标签',

    // Campaign Content
    campaignTitle: '生成的营销内容',
    campaignSubtitle: '各平台即用型草稿',
    campaignXhs: '小红书帖子',
    campaignDouyin: '抖音脚本',
    campaignDm: 'KOL 沟通私信',

    // Push Status
    pushTitle: '方案已生成并转发',
    pushSubtitle: '你的中国 KOL 营销方案已推送至合作伙伴网络',
    pushAnalysis: '分析完成',
    pushAnalysisDesc: '产品机会和受众已映射',
    pushKolsMatched: 'KOL 已匹配',
    pushKolsMatchedDesc: '从 2,400+ 创作者池中选出 3 位',
    pushContentGen: '内容已生成',
    pushContentGenDesc: '营销草稿已准备好审阅',
    pushForwarded: '方案已转发',
    pushForwardedDesc: '已发送至中国端合作伙伴网络',

    // Email Capture
    emailTitle: '获取完整方案',
    emailSubtitle: '我们将发送完整的分析报告和可执行的下一步。',
    emailSentTitle: '方案已发送！',
    emailSentSubtitle: '我们将跟进你的详细 KOL 营销方案和后续步骤。',
    emailWorkLabel: '工作邮箱',
    emailWorkPlaceholder: 'you@company.com',
    emailCompanyLabel: '公司名称（选填）',
    emailCompanyPlaceholder: '你的品牌或公司名称',
    emailSubmitButton: '发送给我',

    // Agent Progress
    agentRunning: '代理运行中',
    agentAnalyzing: '正在分析你的产品',
    agentBuildingPlan: 'AI 代理正在构建你的中国市场方案',
    agentProcessing: '处理中...',
    agentDone: '完成 ✓',
    agentStepExtract: '正在提取产品卖点',
    agentStepAudience: '正在推断目标受众画像',
    agentStepMatching: '正在匹配中国 KOL 池',
    agentStepContent: '正在生成营销内容',
    agentStepPush: '正在准备推送包',

    // Footer
    footerText: 'DragonWay Lab — AI 驱动的宠物品牌入华引擎',

    // Chat Agent
    chatWelcome: '你好！我是 DragonWay AI 代理。我来帮你为宠物食品品牌找到最合适的中国 KOL。首先，请粘贴你的产品链接。',
    chatUrlPlaceholder: '粘贴你的 Shopify 或品牌链接...',
    chatAnalyzing: '正在分析你的产品页面...',
    chatFoodFormat: '收到！看起来这是一款高端产品。食品形态是什么？',
    chatPetType: '这是给狗还是猫的？',
    chatCoreClaims: '主要卖点是什么？最多选 3 个。',
    chatOwnerCity: '你现在最想优先打哪个中国市场圈层？',
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
    optTier1: '核心都市圈（北京 / 上海 / 深圳）',
    optNewTier1: '增长型城市（成都 / 杭州 / 南京）',
    optTier2: '更广的二线市场',
    optAnyNotSure: '还在判断 / 暂不确定',
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

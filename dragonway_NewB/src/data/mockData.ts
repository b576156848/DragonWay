import { AnalysisResult, FormData, KolProfile, AudienceData } from './types';

export const DEMO_FORM_DATA: FormData = {
  product_url: 'https://www.orijen.com/dogs/dry-dog-food/original',
  food_format: 'dry',
  pet_type: 'dog',
  life_stage: ['adult', 'all_life'],
  core_claims: ['high_protein', 'grain_free', 'premium_imported'],
  primary_goal: 'brand_awareness',
  owner_pet: 'dog_owner',
  owner_city: 'tier1',
  owner_price: 'high',
  brand_positioning: 'natural',
  preferred_platforms: ['xiaohongshu', 'douyin'],
  content_preference: ['ingredient_review', 'dog_reaction', 'educational'],
  preferred_kol_type: 'expert',
  budget_band: '30k_80k',
  timeline: '1_month',
  special_constraints: '',
};

// Round 2 replacement KOL pool — these are added when user refines
export const ROUND2_KOL_POOL: KolProfile[] = [
  {
    id: 'kol-r2-1',
    name: '某甜小姐有一只小马',
    avatar: '',
    platform: 'Xiaohongshu',
    profileUrl: 'https://xhslink.com/m/7mRGdQ5aqHM',
    followers: '40K',
    engagement: '8.0%',
    matchReason: 'She is a certified pet nutritionist with a pharmaceutical research background and ongoing veterinary medicine study, specializing in science-backed homemade pet food recipes, dog food formula analysis and scientific feeding guidance. Her strong professional authority earns high trust from refined pet owners, especially small-breed dog keepers.',
    priceRange: '¥3,200 – ¥7,000',
    contentTags: ['Pet Nutrition Science', 'Homemade Pet Food Guidance', 'Vet-backed Professional Authority'],
    badge: 'Best for professional pet nutrition education & premium pet food brand endorsement',
  },
  {
    id: 'kol-r2-2',
    name: '边牧停停的日常',
    avatar: '',
    platform: 'Xiaohongshu',
    profileUrl: 'https://xhslink.com/m/8WZDGUsyxZV',
    followers: '774K',
    engagement: '4.5%',
    matchReason: 'She is a popular pet lifestyle creator focusing on heartwarming daily stories and anthropomorphic content of her Border Collie, with consistently high-performing viral videos that build deep emotional resonance with dog owners. Her content is ideal for pet daily necessities and lifestyle product marketing with wide audience reach.',
    priceRange: '¥18,000 – ¥35,000',
    contentTags: ['Heartwarming Daily Content', 'Viral Pet Skits', 'Medium & Large Breed Dog Audience'],
    badge: 'Best for viral emotional pet content & high-resonance daily product marketing',
  },
  {
    id: 'kol-r2-3',
    name: 'Uu-小可爱',
    avatar: '',
    platform: 'Xiaohongshu',
    profileUrl: 'https://xhslink.com/m/9ajk5IsPosx',
    followers: '229K',
    engagement: '6.2%',
    matchReason: 'She is a warm healing pet lifestyle creator focusing on the daily life, fashion dressing and refined feeding of her Golden Retriever. Her soft, sweet content deeply resonates with young female pet owners with strong purchasing power, perfect for premium pet apparel, daily necessities and food planting.',
    priceRange: '¥6,800 – ¥14,000',
    contentTags: ['Premium Pet Lifestyle', 'Pet Fashion & Dressing', 'Healing Emotional Content'],
    badge: 'Best for premium pet lifestyle branding & emotional appeal to young female pet owners',
  },
  {
    id: 'kol-r2-4',
    name: 'SAITOTIAS',
    avatar: '',
    platform: 'Xiaohongshu',
    profileUrl: 'https://xhslink.com/m/2zQ3xG5c8Y7',
    followers: '12K',
    engagement: '10.5%',
    matchReason: 'She is a niche pet creator and brand founder focusing on Chinese Rural Dogs, with professional dog training experience and official off-leash dog certification in Hong Kong. Her unique content fills the market gap, attracting loyal fans of Chinese Rural Dogs and dog training enthusiasts.',
    priceRange: '¥1,800 – ¥4,000',
    contentTags: ['Chinese Rural Dog Content', 'Professional Dog Training Guidance', 'Niche Pet Audience'],
    badge: 'Best for niche Chinese Rural Dog content & professional dog training product endorsement',
  },
  {
    id: 'kol-r2-5',
    name: '周禾（宠物营养师）',
    avatar: '',
    platform: 'Xiaohongshu',
    profileUrl: 'https://xhslink.com/m/8J4LiKqrlXN',
    followers: '31K',
    engagement: '7.5%',
    matchReason: 'She is a certified pet nutritionist graduated from China Agricultural University, specializing in practical novice dog-raising tips, dog food selection guides and scientific pet health care content. Her professional academic background builds strong credibility, making her ideal for professional endorsement of pet food and health products.',
    priceRange: '¥2,500 – ¥5,500',
    contentTags: ['Pet Nutrition Science', 'CAU-backed Professional Authority', 'Novice Dog Raising Guidance'],
    badge: 'Best for science-backed pet nutrition education & high-trust pet product endorsement',
  },
  {
    id: 'kol-r2-6',
    name: '窝里相宠物日托班',
    avatar: '',
    platform: 'Xiaohongshu',
    profileUrl: 'https://xhslink.com/m/DZNHpg4aAt',
    followers: '17K',
    engagement: '5.2%',
    matchReason: 'She is the official account of a high-end pet daycare & kindergarten brand in Shanghai, focusing on pet socialization training, daily daycare content and premium pet service popularization. Her account precisely reaches high-end local pet owners in Shanghai, perfect for regional pet service and high-end pet product marketing.',
    priceRange: '¥1,500 – ¥3,500',
    contentTags: ['Shanghai Local Pet Service', 'Pet Socialization Training', 'High-end Pet Lifestyle'],
    badge: 'Best for local premium pet service marketing & high-end pet brand exposure in Shanghai',
  },
  {
    id: 'kol-r2-7',
    name: '柯铭',
    avatar: '',
    platform: 'Xiaohongshu',
    profileUrl: 'https://xhslink.com/m/2j99AgKAttW',
    followers: '4.1M',
    engagement: '3.2%',
    matchReason: 'He is a top-tier national pet influencer in Xiaohongshu, famous for his original multi-species pet family skits and hilarious anthropomorphic content. His massive fan base and consistently viral videos deliver unparalleled brand exposure and break-through marketing effects for pet brands.',
    priceRange: '¥45,000 – ¥80,000',
    contentTags: ['Viral Comedy Pet Skits', 'National-level Mass Audience', 'Multi-pet Family Content'],
    badge: 'Best for mass viral brand exposure & national-level pet marketing campaign',
  },
];

// Updated audience data for the refined 4-KOL combination
export const REFINED_AUDIENCE: AudienceData = {
  ageDistribution: [
    { age: '18–24', percentage: 22 },
    { age: '25–30', percentage: 38 },
    { age: '31–35', percentage: 25 },
    { age: '36–40', percentage: 10 },
    { age: '40+', percentage: 5 },
  ],
  cityTier: [
    { tier: 'Tier 1', percentage: 48 },
    { tier: 'New Tier 1', percentage: 28 },
    { tier: 'Tier 2', percentage: 16 },
    { tier: 'Tier 3+', percentage: 8 },
  ],
  spendingPower: [
    { segment: 'Premium (¥500+/mo)', percentage: 42 },
    { segment: 'Mid-High (¥300–500)', percentage: 32 },
    { segment: 'Mid (¥150–300)', percentage: 20 },
    { segment: 'Budget (<¥150)', percentage: 6 },
  ],
  interestTags: [
    'Scientific Pet Care', 'Imported Brands', 'Grain-Free Diet',
    'Natural Ingredients', 'Dog Health', 'Premium Lifestyle',
    'Pet Nutrition Education', 'Breed Communities', 'Emotional Bonding',
  ],
};

export const MOCK_RESULT: AnalysisResult = {
  opportunities: [
    {
      title: 'Premium Import Positioning',
      description: 'Chinese urban pet owners increasingly prefer imported, high-quality dog food. "进口天然粮" is a top search keyword on Xiaohongshu with 340% YoY growth.',
      icon: 'TrendingUp',
    },
    {
      title: 'High-Protein Demand Surge',
      description: 'High-protein, biologically appropriate formulas align with the "科学养宠" (scientific pet care) trend among Tier 1 city dog owners aged 25–35.',
      icon: 'Zap',
    },
    {
      title: 'Grain-Free Market Gap',
      description: 'Only 12% of premium dog food brands on Tmall effectively communicate grain-free benefits. Clear differentiation opportunity exists.',
      icon: 'Target',
    },
    {
      title: 'Trust Through Transparency',
      description: 'Chinese consumers value ingredient transparency. Brands that show sourcing origin and nutritional breakdown see 2.3× higher conversion.',
      icon: 'Shield',
    },
  ],
  kols: [
    {
      id: 'kol-1',
      name: '哈哈皮没有耳朵',
      avatar: '',
      platform: 'Xiaohongshu',
      profileUrl: 'https://xhslink.com/m/3VRpdaWwHIb',
      followers: '145K',
      engagement: '7.6%',
      matchReason: 'She is a creative comedy pet blogger specializing in anthropomorphic husky and cat skits, with distinctive costume designs and humorous storylines that generate highly shareable content. Her unique cross-species content deeply attracts young pet lovers, perfect for fun, creative brand marketing campaigns.',
      priceRange: '¥4,500 – ¥10,000',
      contentTags: ['Viral Comedy Skits', 'Anthropomorphic Pet Content', 'Cross-species Creative Marketing'],
      badge: 'Best for viral comedy pet content & creative cross-species brand marketing',
    },
    {
      id: 'kol-2',
      name: '我是宝子呀',
      avatar: '',
      platform: 'Xiaohongshu',
      profileUrl: 'https://xhslink.com/m/6YJB7EmTSGu',
      followers: '856K',
      engagement: '5.3%',
      matchReason: 'She is a warm healing pet lifestyle blogger focusing on recording the daily growth and high-quality care of her Bichon Frise. Her soft, aesthetic and intimate content style builds deep trust with young female pet owners, making her ideal for premium pet product branding and daily necessities promotion.',
      priceRange: '¥12,000 – ¥25,000',
      contentTags: ['Premium Pet Lifestyle', 'Healing Daily Content', 'High-purchasing-power Female Audience'],
      badge: 'Best for premium pet lifestyle branding & emotional resonance with high-value female audience',
    },
    {
      id: 'kol-3',
      name: '小花花的每一天',
      avatar: '',
      platform: 'Xiaohongshu',
      profileUrl: 'https://xhslink.com/m/K6pOLhr8zH',
      followers: '1.9M',
      engagement: '6.4%',
      matchReason: 'She is a top-tier pet content creator famous for her humorous, story-driven skits of her Bichon Frise, with consistently viral content that gains massive likes and shares across the platform. Her relatable storytelling style attracts a wide, highly engaged pet-loving audience, delivering excellent brand exposure and conversion for pet products.',
      priceRange: '¥20,000 – ¥45,000',
      contentTags: ['Viral Story-driven Skits', 'Mass Audience Reach', 'High-conversion Product Planting'],
      badge: 'Best for viral story-driven marketing & mass brand exposure with high conversion potential',
    },
  ],
  audience: {
    ageDistribution: [
      { age: '18–24', percentage: 18 },
      { age: '25–30', percentage: 35 },
      { age: '31–35', percentage: 28 },
      { age: '36–40', percentage: 12 },
      { age: '40+', percentage: 7 },
    ],
    cityTier: [
      { tier: 'Tier 1', percentage: 42 },
      { tier: 'New Tier 1', percentage: 31 },
      { tier: 'Tier 2', percentage: 18 },
      { tier: 'Tier 3+', percentage: 9 },
    ],
    spendingPower: [
      { segment: 'Premium (¥500+/mo)', percentage: 38 },
      { segment: 'Mid-High (¥300–500)', percentage: 34 },
      { segment: 'Mid (¥150–300)', percentage: 22 },
      { segment: 'Budget (<¥150)', percentage: 6 },
    ],
    interestTags: [
      'Scientific Pet Care', 'Imported Brands', 'Grain-Free Diet',
      'Natural Ingredients', 'Dog Health', 'Premium Lifestyle',
      'Pet Photography', 'Breed Communities',
    ],
  },
  campaign: {
    xiaohongshuPost: `🐕 实测30天 | 这款北美天然粮到底值不值得入？

作为一个研究狗粮配方5年的宠物营养师，我终于拿到了这款在北美销量TOP3的天然粮。

📋 配方亮点：
• 85%动物源性成分，新鲜或生鲜肉类为主
• 无谷配方，不含玉米、小麦、大豆
• WholePrey比例，模拟自然饮食
• 添加冻干涂层，适口性极佳

🔬 我的30天实测观察：
✅ 毛发光泽度明显提升
✅ 便便成型好，消化吸收率高
✅ 挑食的金毛第一次主动吃完整碗
✅ 体重维持稳定，肌肉线条更明显

💰 价格带：属于进口高端线，但按每日喂食成本算，其实和很多中端粮差不多。

适合人群：追求科学喂养、注重配方成分的宠物主人。

#进口狗粮 #天然粮测评 #科学养宠 #狗粮推荐 #宠物营养`,

    douyinScript: `【开场 0-3秒】
画面：精致摆盘的狗粮特写，慢动作倒入碗中
旁白："这款来自北美的天然粮，凭什么卖到TOP3？"

【卖点展示 3-15秒】
画面：配方成分动画展示 + 原料实拍
旁白："85%动物成分，新鲜肉类为第一原料，无谷物填充，WholePrey配方模拟狼的自然饮食。"

【实测环节 15-35秒】
画面：狗狗进食反应 + 前后对比照片
旁白："我家金毛试吃30天：毛发亮了，便便好了，最惊喜的是——第一次主动吃完整碗。"

【收尾 35-45秒】
画面：产品包装展示 + 价格信息
旁白："想要给毛孩子升级口粮的，评论区扣1，我发你优惠链接。"

【字幕标签】#进口天然粮 #狗粮测评 #科学养宠`,

    kolOutreach: `Hi [KOL Name],

I'm reaching out from [Brand Name], a premium natural dog food brand from North America. We've been following your content and love your approach to [ingredient analysis / pet nutrition / lifestyle content].

We're entering the China market and looking for trusted voices to introduce our flagship product to Chinese pet owners who care about quality and transparency.

Here's what we'd love to explore:
• A product trial + honest review collaboration
• Format: [Xiaohongshu post / Douyin video] — we're flexible on creative direction
• Compensation: Competitive rate + product supply + potential long-term partnership

Our product highlights:
- 85% animal-origin ingredients
- Grain-free, WholePrey formula
- Top 3 seller in North America
- Focus on biologically appropriate nutrition

Would you be open to a quick chat? We can send product samples first if you'd like to try before committing.

Looking forward to hearing from you!

Best,
[Your Name]
[Brand Name] China Market Team`,
  },
};

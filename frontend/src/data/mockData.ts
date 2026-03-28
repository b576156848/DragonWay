import { AnalysisResult, FormData } from './types';

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
      name: '柴犬博士Dr.Shiba',
      avatar: '',
      platform: 'Xiaohongshu',
      followers: '1.2M',
      engagement: '8.7%',
      matchReason: 'Veterinary background with deep ingredient analysis content. Audience trusts scientific pet food recommendations.',
      priceRange: '¥18,000 – ¥35,000',
      contentTags: ['Ingredient Deep-dive', 'Vet-backed', 'Comparison Reviews'],
      badge: 'Best for ingredient-focused awareness',
    },
    {
      id: 'kol-2',
      name: '金毛一家亲',
      avatar: '',
      platform: 'Douyin',
      followers: '3.8M',
      engagement: '6.2%',
      matchReason: 'Lifestyle content featuring Golden Retrievers with high shareability. Excels at unboxing and reaction-style videos.',
      priceRange: '¥25,000 – ¥55,000',
      contentTags: ['Dog Reactions', 'Unboxing', 'Lifestyle'],
      badge: 'Best for viral reach and emotional appeal',
    },
    {
      id: 'kol-3',
      name: '宠物营养师小鱼',
      avatar: '',
      platform: 'Xiaohongshu',
      followers: '680K',
      engagement: '11.3%',
      matchReason: 'Certified pet nutritionist. Content focuses on food comparison, feeding guides, and health outcomes. Highest trust score in niche.',
      priceRange: '¥8,000 – ¥18,000',
      contentTags: ['Nutrition Science', 'Feeding Guides', 'Health Focus'],
      badge: 'Best for high-trust conversion',
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

# 入华引擎 · 问卷设计规范

> 版本 v0.2 · 2026-03-26
> 负责人：Eddie
> 状态：定稿

---

## 定位

品牌 Brief 采集器，不是市场调研问卷。
每题都映射到一个 Agent 输出字段，没有"nice to have"的题。

## 设计原则

1. **先定输出，再写问题** — 服务 agent_a_output / agent_b_output / kol_criteria / execution_plan
2. **只问绝对必要的问题** — 13 题以内，3 分钟填完
3. **一题只问一件事，少用开放题** — 70% 单选/多选、20% 半结构化、10% 开放题
4. **上线前先试填** — 用 AI 模拟测试（见 `questionnaire_simulation.md`）

---

## 完整字段规范

### 一、产品基本盘（喂给 Agent A）

#### Q1 · product_url
```
类型：text / url
标签：产品链接 / 品牌官网 / Amazon 链接
Placeholder："粘贴产品链接，或用一句话描述你的产品"
必填：是
逻辑：输入 URL → Firecrawl 抓取；输入文字 → 直接给 Agent A
映射：Agent A 的主要输入源
```

#### Q2 · food_format
```
类型：单选
标签：产品类型
选项：
  - dry         干粮
  - wet         湿粮
  - freeze_dried 冻干
  - air_dried   风干
  - fresh       鲜粮
  - other       其他
必填：是
映射：影响 KOL 内容场景（干粮适合成分测评，湿粮/鲜粮适合开箱试吃）
```

#### Q3 · pet_type + life_stage
```
类型：单选 + 多选
标签：适用宠物与阶段

pet_type（单选）：
  - dog         狗
  - cat         猫

life_stage（多选）：
  - puppy       幼犬/幼猫
  - adult       成犬/成猫
  - senior      老年犬/老年猫
  - all_life    全犬龄/全猫龄

必填：是
映射：pet_type → KOL 初筛（最高权重 35%）；life_stage → 影响 KOL 细分匹配
```

#### Q4 · core_claims
```
类型：多选，最多 3 个
标签：核心卖点（选择最重要的 3 个）
选项：
  - high_protein        高蛋白
  - grain_free          无谷物 / 低碳水
  - limited_ingredient  有限成分
  - fresh_ingredients   新鲜食材
  - digestive_health    消化/肠道健康
  - skin_coat           皮肤/毛发
  - joint_support       关节保健
  - vet_backed          兽医/科学背书
  - premium_imported    进口高端
必填：是
映射：Agent A 卖点分析 + category_match 25%
```

### 二、入华目标（喂给 Agent B）

#### Q5 · primary_goal
```
类型：单选
标签：进入中国市场最想实现什么？
选项：
  - brand_awareness     建立品牌认知
  - find_kol            找第一批种草 KOL
  - test_feedback       测试消费者反馈
  - find_distributor    找经销/代理线索
  - direct_sales        直接带货转化
必填：是
映射：Agent B 方案叙事方向 + KOL 组合策略（认知→推 top，转化→推 micro）
```

#### Q6 · target_owner_profile
```
类型：组合字段（3 个子选项）
标签：理想中的中国目标用户

owner_pet（单选）：
  - dog_owner       犬主
  - cat_owner       猫主
  - multi_pet       多宠家庭

owner_city（单选）：
  - tier1           一线城市
  - new_tier1       新一线
  - tier2           二线
  - any             不限

owner_price（单选）：
  - high            高消费力
  - mid_high        中高消费力
  - mid             中等消费力

必填：是
映射：audience_match 20%
```

#### Q7 · brand_positioning
```
类型：单选
标签：最希望被强调的品牌形象
选项：
  - scientific          科学营养
  - natural             天然成分
  - premium_import      高端进口
  - functional          功能改善
  - palatability        宠物真实爱吃
必填：是
映射：Agent B 中国市场重构话术 + 内容调性
```

### 三、平台与 KOL 偏好（喂给匹配逻辑）

#### Q8 · preferred_platforms
```
类型：多选
标签：优先测试的平台
选项：
  - xiaohongshu     小红书（测评/种草）
  - douyin          抖音（萌宠/声量）
必填：是（至少选 1 个）
映射：硬过滤 — 不符合直接排除
```

#### Q9 · content_preference
```
类型：多选，最多 3 个
标签：更想要哪类内容？
选项：
  - ingredient_review   成分测评
  - unboxing            开箱试吃
  - dog_reaction        狗狗/猫咪反应记录
  - educational         科普型内容
  - vet_endorsement     兽医/营养师背书
  - lifestyle           日常陪伴型内容
必填：是
映射：影响 match_score + 内容建议生成
```

#### Q10 · preferred_kol_type
```
类型：单选
标签：更偏好哪类 KOL？
选项：
  - expert              专业型（兽医/宠物营养方向）
  - reviewer            测评型
  - lifestyle           日常养宠型
  - micro_engaged       高互动小号
  - mid_volume          中腰部带量型
  - no_preference       先不限定
必填：是
映射：叠加匹配权重
```

### 四、执行约束（喂给方案生成）

#### Q11 · budget_band
```
类型：单选
标签：本次测试预算
选项：
  - lt10k       < ¥10,000
  - 10k_30k     ¥10,000 – 30,000
  - 30k_80k     ¥30,000 – 80,000
  - gt80k       > ¥80,000
必填：是
映射：budget_fit 12% + KOL 量级过滤
```

#### Q12 · timeline
```
类型：单选
标签：希望什么时候启动？
选项：
  - 2_weeks         2 周内
  - 1_month         1 个月内
  - 1_3_months      1-3 个月
  - after_review    先看方案再决定
必填：是
映射：执行方案排期建议
```

#### Q13 · special_constraints
```
类型：textarea（可选）
标签：还有什么必须注意的限制或要求？
Placeholder："例：不能强调疗效、必须突出进口、已有中文包装、想避开某类达人"
必填：否
映射：Agent A/B 风险提醒
```

---

## TypeScript 接口定义（给 River）

```typescript
interface QuestionnaireInput {
  // 一、产品基本盘
  product_url: string                    // Q1: URL 或文字描述
  food_format: FoodFormat                // Q2
  pet_type: 'dog' | 'cat'               // Q3
  life_stage: LifeStage[]               // Q3
  core_claims: CoreClaim[]              // Q4: 最多 3 个

  // 二、入华目标
  primary_goal: PrimaryGoal             // Q5
  target_owner_profile: {               // Q6
    owner_pet: 'dog_owner' | 'cat_owner' | 'multi_pet'
    owner_city: 'tier1' | 'new_tier1' | 'tier2' | 'any'
    owner_price: 'high' | 'mid_high' | 'mid'
  }
  brand_positioning: BrandPositioning   // Q7

  // 三、平台与 KOL 偏好
  preferred_platforms: Platform[]       // Q8: 至少 1 个
  content_preference: ContentPref[]     // Q9: 最多 3 个
  preferred_kol_type: KOLType           // Q10

  // 四、执行约束
  budget_band: BudgetBand               // Q11
  timeline: Timeline                    // Q12
  special_constraints?: string          // Q13: 可选
}

type FoodFormat =
  | 'dry' | 'wet' | 'freeze_dried'
  | 'air_dried' | 'fresh' | 'other'

type LifeStage = 'puppy' | 'adult' | 'senior' | 'all_life'

type CoreClaim =
  | 'high_protein' | 'grain_free' | 'limited_ingredient'
  | 'fresh_ingredients' | 'digestive_health' | 'skin_coat'
  | 'joint_support' | 'vet_backed' | 'premium_imported'

type PrimaryGoal =
  | 'brand_awareness' | 'find_kol' | 'test_feedback'
  | 'find_distributor' | 'direct_sales'

type BrandPositioning =
  | 'scientific' | 'natural' | 'premium_import'
  | 'functional' | 'palatability'

type Platform = 'xiaohongshu' | 'douyin'

type ContentPref =
  | 'ingredient_review' | 'unboxing' | 'dog_reaction'
  | 'educational' | 'vet_endorsement' | 'lifestyle'

type KOLType =
  | 'expert' | 'reviewer' | 'lifestyle'
  | 'micro_engaged' | 'mid_volume' | 'no_preference'

type BudgetBand = 'lt10k' | '10k_30k' | '30k_80k' | 'gt80k'

type Timeline = '2_weeks' | '1_month' | '1_3_months' | 'after_review'
```

---

## Happy Path 预填值（Orijen Demo）

River 做前端预填逻辑时直接用这个：

```json
{
  "product_url": "https://www.orijenpetfoods.com/dogs/dry-dog-food/original-dog",
  "food_format": "dry",
  "pet_type": "dog",
  "life_stage": ["adult", "senior"],
  "core_claims": ["high_protein", "grain_free", "premium_imported"],
  "primary_goal": "find_kol",
  "target_owner_profile": {
    "owner_pet": "dog_owner",
    "owner_city": "tier1",
    "owner_price": "high"
  },
  "brand_positioning": "natural",
  "preferred_platforms": ["xiaohongshu", "douyin"],
  "content_preference": ["ingredient_review", "dog_reaction", "educational"],
  "preferred_kol_type": "reviewer",
  "budget_band": "30k_80k",
  "timeline": "1_month",
  "special_constraints": "不能使用'处方''治疗'等合规敏感词；需突出加拿大原产地"
}
```

---

## 字段 → Agent 匹配映射总表

| 字段 | 喂给 | 匹配维度 | 权重 |
|------|------|---------|------|
| Q1 product_url | Agent A（Firecrawl） | — | — |
| Q2 food_format | Agent A + 内容场景 | 间接 | — |
| Q3 pet_type | KOL 初筛 | `pet_type_match` | **35%** |
| Q3 life_stage | KOL 细分 | 叠加 pet_type | — |
| Q4 core_claims | Agent A + 匹配 | `category_match` | **25%** |
| Q5 primary_goal | Agent B 方案叙事 | 不计分 | — |
| Q6 target_owner_profile | Agent B + 匹配 | `audience_match` | **20%** |
| Q7 brand_positioning | Agent B 话术重构 | 不计分 | — |
| Q8 preferred_platforms | 匹配 | 硬过滤 | — |
| Q9 content_preference | 匹配 + 方案 | 叠加 match_score | — |
| Q10 preferred_kol_type | 匹配 | 叠加权重 | — |
| Q11 budget_band | 匹配 + 方案 | `budget_fit` | **12%** |
| Q12 timeline | 方案排期 | 不计分 | — |
| Q13 special_constraints | Agent A/B 风险 | 不计分 | — |
| — | KOL 自身数据 | `engagement_rate` | **8%** |
| — | KOL 背景 | `expert_bonus` | **+5% 加分** |

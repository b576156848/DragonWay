# 入华引擎 · Agent 输出结构规范

> 版本 v0.1 · 2026-03-26
> 负责人：Eddie（结构定义）→ River（前端实现）
> 状态：定稿

---

## 设计原则

1. **输出价值 = 输出丰富度 − 输入简单度**。品牌方只输入了一个链接，输出必须远远超过输入信息量，这个差距就是 Agent 的价值。
2. **三层信任递进**：数据（谁都能查到）→ 推理（为什么推这个人）→ 行动（怎么合作、发什么内容）。Demo 的「哇」时刻在推理层和行动层之间。
3. **可执行度检验**：品牌方看完结果，能不能不打任何电话就做出「要不要投」的决策？如果能，输出结构就对了。

---

## 结果页整体结构

```
┌─────────────────────────────────────────────────────────────┐
│  Section 1 · 产品分析摘要（Agent A 输出）                      │
│  "我们是这样理解你的产品的"                                     │
├─────────────────────────────────────────────────────────────┤
│  Section 2 · 中国市场策略（Agent B 输出）                      │
│  "你的产品在中国应该这样讲"                                     │
├─────────────────────────────────────────────────────────────┤
│  Section 3 · KOL 推荐（匹配结果，核心）                        │
│  Top 3 KOL 卡片 + 匹配理由 + 粉丝画像                         │
├─────────────────────────────────────────────────────────────┤
│  Section 4 · 执行方案（可选，加分项）                           │
│  预算分配 + 内容建议 + 时间线                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Section 1 · 产品分析摘要（Agent A 输出）

> 目的：让品牌方确认"AI 理解对了我的产品"，建立信任起点。

### 数据结构

```typescript
interface AgentAOutput {
  product_name: string
  product_summary: string           // 1-2 句话概括产品
  us_market_position: string        // 在美国市场的定位（如 "高端天然粮第一梯队"）
  core_selling_points: {
    point: string                   // 卖点
    evidence: string                // 依据（从产品页提取）
    china_relevance: 'high' | 'medium' | 'low'  // 在中国的吸引力
  }[]
  target_demographic_us: {
    description: string             // "美国中产养犬家庭，注重宠物饮食质量"
    age_range: string
    income_level: string
  }
  competitive_landscape: string     // "主要竞品为 Acana / Blue Buffalo，价格带 ¥xxx-xxx"
}
```

### 前端展示

```
┌─ 产品分析 ──────────────────────────────────────────┐
│                                                      │
│  Orijen Original Dry Dog Food                        │
│  高端天然粮第一梯队 · 已在中国市场有一定认知度           │
│                                                      │
│  核心卖点                        中国吸引力           │
│  ● 85% 动物蛋白                  ██████████ 高       │
│  ● 无谷物配方                    ████████░░ 高       │
│  ● 原产地新鲜食材                ██████░░░░ 中       │
│                                                      │
│  美国市场定位：中产养犬家庭首选天然粮                   │
│  主要竞品：Acana / Blue Buffalo / Taste of the Wild  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**关键设计**：每个卖点旁边有一个"中国吸引力"指标。这个指标是 Agent A 的判断——不是所有美国卖点在中国都成立。比如"原产地新鲜食材"在中国吸引力没那么高（中国消费者更在意成分表数据），这个差异化判断本身就是产品的价值。

---

## Section 2 · 中国市场策略（Agent B 输出）

> 目的：展示 AI 的"翻译"能力——不是翻译语言，是翻译市场逻辑。

### 数据结构

```typescript
interface AgentBOutput {
  china_market_summary: string      // "天然进口狗粮在中国处于快速增长期，25-35岁一线城市养犬人群是核心消费群体"
  localized_selling_points: {
    original: string                // 美国卖点
    localized: string               // 中国化表达
    platform_angle: string          // 在哪个平台怎么讲
  }[]
  target_audience_cn: {
    primary: string                 // "25-35岁、一线城市、月入1.5万+、养中大型犬、关注宠物健康"
    secondary: string               // "22-28岁、新一线、养小型犬、成分党、愿意为进口粮付溢价"
  }
  recommended_strategy: {
    platform_split: string          // "小红书 60%（深度种草）+ 抖音 40%（声量破圈）"
    content_direction: string       // "以成分测评为主线，辅以狗狗试吃反应"
    differentiation: string         // "与国产天然粮的核心区分点：动物蛋白占比和原料透明度"
  }
  risk_factors: {
    risk: string
    mitigation: string
  }[]
}
```

### 前端展示

```
┌─ 中国市场策略 ──────────────────────────────────────┐
│                                                      │
│  卖点重构                                             │
│                                                      │
│  美国说法           →    中国消费者听得懂的说法         │
│  ─────────────────────────────────────────            │
│  "85% Animal          "动物蛋白含量碾压同价位           │
│   Protein"             所有竞品"                       │
│                        📌 小红书：成分表横向对比图文     │
│                                                      │
│  "Grain-Free           "真正无谷物，不是用豆类替代"      │
│   Formula"             📌 小红书：成分党深度拆解        │
│                        📌 抖音：开袋实拍+配料表特写     │
│                                                      │
│  目标人群                                             │
│  主力：25-35 · 一线 · 月入1.5万+ · 中大型犬 · 成分关注 │
│  补充：22-28 · 新一线 · 小型犬 · 愿意付溢价的成分党     │
│                                                      │
│  ⚠️ 风险提示                                          │
│  • 进口粮审核周期长，建议提前备案                       │
│  • 避免在内容中使用"处方""治疗"等合规敏感词              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**关键设计**：「美国说法 → 中国说法」这个对照是整个产品最有记忆点的视觉。评委一看就明白——AI 不只是搜了一下数据库，而是做了市场逻辑的"翻译"。

---

## Section 3 · KOL 推荐卡片（匹配结果，核心）

> 这是整个结果页的重心。评委在这里停留最久。

### 数据结构

```typescript
interface KOLMatch {
  // 基础信息（从 mock 数据直接取）
  kol_id: string
  name: string
  platform: 'xiaohongshu' | 'douyin'
  tier: 'top' | 'mid' | 'micro'
  followers: number
  avg_engagement: number
  avg_content_views: number
  has_expert_background: boolean

  // Agent 运行时填入（这是核心价值）
  match_score: number               // 0-100
  match_reasoning: {
    headline: string                // 一句话总结为什么推这个人（最重要）
    dimension_breakdown: {
      pet_type_match:     { score: number, reason: string }   // 权重 35%
      category_match:     { score: number, reason: string }   // 权重 25%
      audience_match:     { score: number, reason: string }   // 权重 20%
      budget_fit:         { score: number, reason: string }   // 权重 12%
      engagement_rate:    { score: number, reason: string }   // 权重 8%
      expert_bonus?:      { score: number, reason: string }   // +5% 加分，仅 has_expert_background=true 时存在
    }
    specific_fit: string            // 这个产品和这个 KOL 之间的具体契合点
    past_brand_relevance: string    // 过往合作品牌中与本产品最相关的案例
  }

  // 粉丝画像（用于可视化）
  // 注意：mock_kol_data.json 中 age 存的是 age_range 字符串（如 "23-35"），
  // Agent 运行时需要将其转换为 age_distribution 数组，供前端柱状图使用。
  audience_profile: {
    age_distribution: { label: string, percentage: number }[]     // 柱状图，由 Agent 从 age_range 生成
    gender_ratio: { female: number, male: number }                // 环形图，mock 数据可直接用
    city_tier: string
    top_interests: string[]                                       // 标签云，取 mock 的 interests 字段
  }

  // 合作建议（行动层，让结果可执行）
  collaboration_suggestion: {
    content_format: string          // "小红书深度图文测评" / "抖音30秒开箱视频"
    content_angle: string           // "用成分表数据做横向对比，突出动物蛋白占比优势"
    sample_title: string            // "85%动物蛋白到底意味着什么？Orijen深度测评"
    sample_hook: string             // "你家狗粮的蛋白质来源是什么？大部分人答不上来"
    key_message: string             // "Orijen 用真正的肉，不是肉粉"
    estimated_performance: {
      views_range: [number, number]         // [60000, 90000]
      engagement_range: [number, number]    // [3000, 5500]
      estimated_cpr: number                 // 每次互动成本（元）
    }
  }

  // 报价
  price_range: { min: number, max: number, unit: string }
}
```

### 单张 KOL 卡片的前端展示

```
┌─ #1 匹配度 92 ──────────────────────────────────────┐
│                                                      │
│  狗粮成分研究所                                       │
│  小红书 · 48万粉丝 · 互动率 5.8% · 中腰部             │
│                                                      │
│  ┌ 为什么推荐 ─────────────────────────────────────┐ │
│  │ 她的粉丝中 72% 是狗主人，过往带过 Orijen 和       │ │
│  │ Acana，粉丝对进口天然粮有认知基础，不需要从零     │ │
│  │ 教育。内容风格是成分深度拆解，正好匹配你的        │ │
│  │ "85%动物蛋白"核心卖点。                           │ │
│  └──────────────────────────────────────────────────┘ │
│                                                      │
│  匹配维度                          得分               │
│  宠物类型    犬类 KOL ✓            █████████░ 95     │
│  品类吻合    成分测评 × 天然粮     ████████░░ 88     │
│  受众匹配    一二线 · 高消费力     ████████░░ 85     │
│  预算适配    ¥1.2-2.8万/篇        █████████░ 92     │
│  互动质量    5.8% > 平台均值 3.5%  █████████░ 90     │
│                                                      │
│  ┌ 粉丝画像 ───────────┐  ┌ 合作建议 ────────────┐  │
│  │  年龄     性别       │  │ 形式：深度图文测评    │  │
│  │ 23-27 ██  女 72%    │  │                      │  │
│  │ 28-32 ████ 男 28%   │  │ 参考标题：            │  │
│  │ 33+   █             │  │ "85%动物蛋白到底      │  │
│  │                     │  │  意味着什么？"         │  │
│  │ 兴趣标签            │  │                      │  │
│  │ [成分党] [无谷物]   │  │ 预计表现：            │  │
│  │ [天然粮] [进口]     │  │ 曝光 6-9万           │  │
│  │                     │  │ 互动 3000-5500       │  │
│  │ 城市：一二线为主     │  │ 报价 ¥1.2-2.8万     │  │
│  └─────────────────────┘  └──────────────────────┘  │
│                                                      │
│  过往相关案例：曾为 Orijen 和 Acana 做过成分测评，     │
│  单篇互动 4200+                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 三张卡片的排列逻辑

```
不是按匹配分从高到低排，而是按「用途」排：

卡片 1 → 最佳匹配（综合评分最高）
          "如果只投一个人，投她"

卡片 2 → 破圈选择（声量最大 / 不同平台）
          "如果想扩大认知，加上这个人"

卡片 3 → 精准转化（转化率最高 / 性价比最高）
          "如果预算有限，只投这个人"
```

每张卡片顶部有一个角色标签，让品牌方一看就知道三个人的组合逻辑，而不只是三个排名。

---

## Section 4 · 执行方案（加分项）

> 如果时间够，做这一层。如果时间不够，Section 1-3 已经足够拿到好评价。

### 数据结构

```typescript
interface ExecutionPlan {
  budget_allocation: {
    kol_name: string
    amount: string                  // "¥15,000"
    percentage: number              // 45
    purpose: string                 // "深度种草，建立产品认知"
  }[]
  total_budget: string              // "¥33,000"
  expected_total_reach: string      // "预计总曝光 25-38 万"

  content_calendar: {
    week: number
    kol_name: string
    action: string                  // "发布成分测评笔记"
    platform: string
  }[]

  next_steps: string[]              // ["确认 KOL 合作意向", "提供产品样品", ...]
}
```

### 前端展示

```
┌─ 执行方案 ──────────────────────────────────────────┐
│                                                      │
│  预算分配                                             │
│                                                      │
│  狗粮成分研究所      ████████░░  ¥15,000 (45%)       │
│  深度种草，建立认知                                    │
│                                                      │
│  原粮喂养研究所      █████░░░░░  ¥8,000  (24%)       │
│  精准转化，触达成分党                                  │
│                                                      │
│  海外宠物品牌测评官  ██████░░░░  ¥10,000 (31%)       │
│  进口粮叙事，强化品牌定位                              │
│                                                      │
│  总预算 ¥33,000 · 预计总曝光 25-38 万                 │
│                                                      │
│  内容排期                                             │
│  Week 1  狗粮成分研究所     成分测评笔记    小红书     │
│  Week 2  原粮喂养研究所     试吃反馈笔记    小红书     │
│  Week 3  海外宠物品牌测评官  品牌横评       小红书     │
│                                                      │
│  下一步                                               │
│  □ 确认 KOL 合作意向                                  │
│  □ 寄送产品样品                                       │
│  □ 审核内容初稿                                       │
│  □ 安排发布排期                                       │
│                                                      │
│  [推送给资源方 →]                   状态：方案已就绪   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 完整 API 响应结构（给 River）

```typescript
// GET /campaigns/{id} 的响应
interface CampaignResult {
  campaign_id: string
  status: 'draft' | 'analyzing' | 'ready' | 'pushed' | 'closed'
  created_at: string

  // 输入（问卷原始数据，类型定义见 questionnaire_design.md）
  questionnaire: QuestionnaireInput

  // Section 1
  agent_a_output: AgentAOutput

  // Section 2
  agent_b_output: AgentBOutput

  // Section 3
  kol_matches: KOLMatch[]           // 排序后的 Top 3

  // Section 4（可选）
  execution_plan?: ExecutionPlan
}
```

---

## Demo 时的展示节奏

```
Agent 思考动画结束（10-15s）
        ↓
Section 1 淡入（2s）
  评委确认："哦，AI 理解了这个产品"
        ↓
Section 2 淡入（2s）
  评委注意到："美国说法 → 中国说法"的翻译
  这是第一个"哇"
        ↓
Section 3 依次展开三张 KOL 卡片（每张 1.5s）
  评委看到：匹配理由 + 内容建议 + 粉丝画像
  这是核心"哇"
        ↓
Section 4 展开（1s）
  评委看到：预算分配 + 排期 + 下一步
  "这个真的能直接用"
```

---

## 优先级

黑客松时间有限，按这个顺序砍：

| 优先级 | 内容 | 说明 |
|--------|------|------|
| P0 必做 | KOL 卡片 + 匹配理由 | 没有这个，产品不成立 |
| P0 必做 | 粉丝画像可视化 | 评委印象分的主要来源 |
| P1 应做 | Section 2 卖点翻译 | 体现 Agent 的差异化价值 |
| P1 应做 | 匹配维度得分条 | 让匹配逻辑可见 |
| P2 加分 | Section 1 产品分析 | 有了更完整，没有不影响核心 |
| P2 加分 | Section 4 执行方案 | 时间够再做 |
| P3 锦上添花 | 内容建议（标题/Hook） | 有了很惊艳，但依赖 Agent prompt 质量 |

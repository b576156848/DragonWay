# River 技术交接简报

> 来自：Eddie
> 日期：2026-03-27
> 目的：你需要的所有上下文都在这里，读完直接开工

---

## 一、你需要读的文件（按顺序）

| 顺序 | 文件 | 读什么 | 花多久 |
|------|------|--------|--------|
| 1 | `PLAN.md` | 整体架构、技术栈、DB schema、Phase 分期 | 10 min |
| 2 | `questionnaire_design.md` | 问卷 13 题的完整字段定义 + **TypeScript 接口** + **Happy Path 预填值** | 5 min |
| 3 | `agent_output_spec.md` | 结果页 4 个 Section 的数据结构 + **完整 API 响应接口** + KOL 卡片 wireframe | 10 min |
| 4 | `mock/mock_kol_data.json` | 8 个 KOL 的完整 mock 数据 + 匹配权重 + 平台基准 | 5 min |

**不需要读的**：`questionnaire_simulation.md`（问卷优化用，不影响开发）、`alignment_review.md`（内部审查记录）

---

## 二、已经替你定好的（不需要你决策）

### 输入端：QuestionnaireInput

```typescript
// 完整定义在 questionnaire_design.md，这里是摘要
interface QuestionnaireInput {
  product_url: string
  food_format: 'dry' | 'wet' | 'freeze_dried' | 'air_dried' | 'fresh' | 'other'
  pet_type: 'dog' | 'cat'
  life_stage: ('puppy' | 'adult' | 'senior' | 'all_life')[]
  core_claims: string[]              // 最多 3 个
  primary_goal: string
  target_owner_profile: {
    owner_pet: string
    owner_city: string
    owner_price: string
  }
  brand_positioning: string
  preferred_platforms: ('xiaohongshu' | 'douyin')[]
  content_preference: string[]       // 最多 3 个
  preferred_kol_type: string
  budget_band: 'lt10k' | '10k_30k' | '30k_80k' | 'gt80k'
  timeline: string
  special_constraints?: string
}
```

### 输出端：CampaignResult

```typescript
// 完整定义在 agent_output_spec.md
interface CampaignResult {
  campaign_id: string
  status: 'draft' | 'analyzing' | 'ready' | 'pushed' | 'closed'
  questionnaire: QuestionnaireInput
  agent_a_output: AgentAOutput       // 产品分析
  agent_b_output: AgentBOutput       // 中国市场策略
  kol_matches: KOLMatch[]            // Top 3 KOL 卡片
  execution_plan?: ExecutionPlan     // 可选
}
```

### KOL Mock 数据

8 个 KOL，6 个小红书 + 2 个抖音，覆盖 top/mid/micro 三个层级。
数据在 `mock/mock_kol_data.json`，直接导入即可。

### 匹配权重

```
pet_type_match      35%    ← 最高
category_match      25%
audience_match      20%
budget_fit          12%
engagement_rate      8%
expert_bonus        +5%    （仅 has_expert_background=true）
```

### Happy Path（Demo 预填）

在 `mock/mock_kol_data.json` 的 `happy_path_questionnaire` 字段。
前端做 Demo 模式时，直接用这个 JSON 预填所有字段。

预期 Demo 结果（Orijen → 小红书+抖音）：
- 卡片 1 最佳匹配：狗粮成分研究所（kol_001，小红书，mid）
- 卡片 2 破圈选择：金毛阿福日记（kol_003，抖音，top）或 边牧训练日记（kol_006，抖音，mid）
- 卡片 3 精准转化：原粮喂养研究所（kol_004，小红书，micro，转化率最高）

---

## 三、需要你决策的

以下是你的决策空间，Eddie 和 Will 不会干涉这些：

### 1. Agent 编排方式

PLAN.md 里写的是 Claude API + FastAPI。但具体怎么串 Agent A → Agent B → 匹配逻辑，由你定：

```
选项 A：顺序调用
  POST /campaigns → Firecrawl → Agent A → Agent B → KOL Match → 返回结果
  简单直接，适合黑客松

选项 B：异步 + 轮询
  POST /campaigns → 返回 campaign_id（status: analyzing）
  后台跑 pipeline
  前端轮询 GET /campaigns/{id} 直到 status: ready
  更符合真实产品，但多一层复杂度

选项 C：SSE / WebSocket
  实时推送每个 Agent 步骤的进度
  前端能做"Agent 思考动画"
  最酷，但开发量最大
```

**建议**：先用 A 跑通，时间够再升级到 B（前端假装有动画）。

### 2. Firecrawl 是否真接

```
方案 1：真接 Firecrawl API（需要 key）
方案 2：先 Mock，product_url 直接用 product_example.description 代替
```

**建议**：先 Mock，最后 2 小时再换真实 Firecrawl。

### 3. 前端框架细节

PLAN.md 定的是 Next.js 14 App Router + Tailwind。具体用什么 UI 组件库（shadcn? headless?）、图表库（Recharts? Chart.js?）由你选。

粉丝画像可视化需要：
- 年龄柱状图（`age_distribution[]`）
- 性别环形图（`gender_ratio`）
- 兴趣标签云（`top_interests[]`）

### 4. 是否用 Supabase

PLAN.md 写了 Supabase，但黑客松阶段可能直接用内存 / JSON 文件更快。由你判断。

---

## 四、核心 API 路由（建议）

```
POST /api/campaigns
  Body: QuestionnaireInput
  Response: { campaign_id, status: 'analyzing' }

GET  /api/campaigns/{id}
  Response: CampaignResult

GET  /api/campaigns/{id}/status
  Response: { status, current_step }
  （如果做异步模式才需要）
```

---

## 五、前端页面结构

```
/                      → 首页，问卷表单
/campaign/{id}         → 结果页（4 个 Section）
```

结果页的 wireframe 在 `agent_output_spec.md` 里画了 ASCII 版本，包括：
- 每个 Section 的布局
- KOL 卡片的完整信息层次
- Demo 展示节奏（哪个先出、哪个后出）

---

## 六、一个注意事项

Mock 数据里 KOL 的 `age_range` 是字符串（如 `"23-35"`），但前端图表需要的是 `age_distribution` 数组。
**这个转换由 Agent 运行时完成**，不需要你在前端手动拆。Agent 的输出会直接给你数组格式。

如果你先 Mock 整个 pipeline（不跑 Agent），可以临时硬编码：
```json
"age_distribution": [
  { "label": "18-22", "percentage": 15 },
  { "label": "23-27", "percentage": 35 },
  { "label": "28-32", "percentage": 30 },
  { "label": "33+",   "percentage": 20 }
]
```

---

## 七、你的优先级

```
P0  Agent pipeline 跑通（输入 → 输出，哪怕全 mock）
P0  KOL 卡片 + 匹配理由能展示
P0  粉丝画像可视化
P1  Section 2 卖点翻译（美国说法 → 中国说法）
P1  匹配维度得分条
P2  Section 1 产品分析
P2  Section 4 执行方案
P2  Agent 思考动画
```

---

## 八、有问题找谁

| 问题类型 | 找谁 |
|---------|------|
| 问卷字段含义、枚举值调整 | Eddie |
| KOL 数据要加字段/加人 | Eddie |
| 匹配逻辑/权重调整 | Eddie |
| Demo 故事线、路演节奏 | Will |
| 产品定位、商业逻辑 | Will |
| 技术选型、架构、部署 | 你自己定 |

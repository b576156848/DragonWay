# 入华引擎 · MVP 开发计划

> 版本 v0.6 · 2026-03-26
> 状态：进行中

---

## 变更记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v0.1 | 2026-03-26 | 初始计划，技术栈确认，Phase 0-5 框架 |
| v0.2 | 2026-03-26 | 补充团队分工、Demo 场景定为宠物品类、数据结构分析 |
| v0.3 | 2026-03-26 | 细化 Demo 场景为进口天然/功能性狗粮，确定问卷 6 字段，更新 Phase 0 状态 |
| v0.4 | 2026-03-26 | 问卷重构：从 6 字段升级为 13 题 4 段式品牌 Brief 采集器 |
| v0.5 | 2026-03-26 | 新增 Agent 输出结构规范（`agent_output_spec.md`），定义结果页 4 个 Section + KOL 卡片 + API 响应 |
| v0.6 | 2026-03-26 | 全文件对齐审查，修复 10 处不一致（见 `alignment_review.md`），创建 `questionnaire_design.md` |

---

## 团队分工

> 原则：按"决策链路"切，而非按角色切。各链路并行，接口提前对齐。

| 人 | 链路 | 核心职责 | 主要产出 |
|----|------|---------|---------|
| **Will** | 产品/商业逻辑 | 定义做什么和为什么，把控整体叙事 | 用户旅程、Demo脚本、路演稿、资源方对接 |
| **River** | 技术架构 | 技术方案设计，工作流串联，前后端实现 | 框架、workflow分层、数据结构、页面实现 |
| **Eddie** | 数据/匹配逻辑 | 问卷字段设计，KOL匹配维度，信任建立 | 问卷问题、KOL画像字段、匹配权重、Mock数据 |

**协作节奏**
- Hour 0：三人对齐数据结构（Eddie 产出，River 确认能接住）
- Hour 1-8：各自并行
- Hour 8：第一次合体跑通
- Hour 8-16：打磨，UI/动画/Demo稳定性
- Hour 16：冻结，只排练 Demo

---

## Demo 场景决策

**当前确认**：Demo 场景定为**海外进口天然/功能性狗粮品牌进中国市场**（2026-03-26 定稿）

**选这个细分的原因**
- 用户画像最统一：25-35岁、一线城市、中产、关注宠物健康、有溢价支付意愿
- 内容天然成立："开箱测评 + 狗狗反应"，KOL 素材自带故事性
- 抖音/小红书互动率在宠物品类中最高，Demo 演示最直观
- 有真实对标品牌（Orijen / Acana / Hills）说服力强，显得懂行
- 和普通狗粮区隔清晰，评委一听就明白差异化在哪

**Demo 一句话叙事**
> 一个美国天然狗粮品牌想进中国，不知道找谁、怎么打——
> 输入产品链接，Agent 匹配专注天然粮/宠物健康的中国 KOL，输出粉丝画像 + 投放方案。

**Happy Path 产品**（2026-03-26 确认）
- 品牌：Orijen（加拿大，已是中国消费者认知度较高的进口粮）
- 卖点：85% 动物蛋白、无谷物、原产地新鲜食材
- 目标平台：小红书（成分党/测评）+ 抖音（萌宠日常/声量）

---

## Mock 数据结构分析（Eddie 负责）

> 文件：`mock_kol_data.json`（已更新为狗粮版本，8 个 KOL，含 `pet_type` / `has_expert_background` / 双平台）

### 现有结构评估

```
kol_pool[] 每个对象包含：
  基础信息         id / name / platform / tier / followers
  内容信息         category / content_style / avg_engagement / avg_note_views
  受众画像         audience_profile { age_range / gender_ratio / city_tier / interests / purchase_power }
  商业信息         price_range / past_brands / estimated_conversion_rate
  Agent运行时字段  match_score / match_reason（null，运行时填入）
  备注             notes
```

### 换成宠物品类需要的改动

| 改动 | 类型 | 优先级 | 说明 |
|------|------|------|------|
| KOL 层加 `pet_type` | 新增字段 | **必须** | `["cat","dog","both","exotic"]`，猫狗受众几乎不重叠 |
| `audience_profile` 加 `audience_pet_type` | 新增字段 | **必须** | `["cat_owner","dog_owner","multi_pet"]` |
| `matching_weights` 加 `pet_type_match`，重新分配权重 | 修改 | **必须** | pet_type_match 应为最高权重 |
| 补充抖音 KOL，`avg_note_views` 改为更通用字段名 | 修改 | 建议 | 抖音叫播放量，语义不同 |
| 加 `has_expert_background` | 新增字段 | 可选 | 兽医/宠物营养师背书，对食品/健康品类信任度差异大 |
| `platform_benchmarks` 补充抖音基准数据 | 新增 | 建议 | 抖音和小红书互动率基准不同 |

### 匹配权重调整方向

```
护肤品版本：                宠物版本（建议）：
  category_match   30%       pet_type_match      35%   ← 新增，最高优先
  audience_match   25%       category_match      25%
  budget_fit       20%       audience_match      20%
  engagement_rate  15%       budget_fit          12%
  brand_tone       10%       engagement_rate     8%
                             has_expert_bg bonus  加分项
```

### 下一步（Eddie）
- [x] 确认宠物子品类 → **狗粮**（2026-03-26）
- [x] 更新 `mock_kol_data.json` 为狗粮版本（含 `pet_type` 字段）（2026-03-26）
- [x] 补充 8 个狗狗 KOL 完整数据，覆盖小红书+抖音（2026-03-26）

---

## 问卷设计（Eddie 负责）

> 详细规范见独立文件：`questionnaire_design.md`（v0.2）

### 定位

品牌 Brief 采集器，不是市场调研问卷。每题都对应一个 Agent 输出字段。

### 结构：4 段 13 题，约 3 分钟填完

| 段 | 题号 | field_key | 喂给谁 | 匹配逻辑 |
|----|------|-----------|--------|----------|
| **一、产品基本盘** | | | Agent A | |
| | Q1 | `product_url` | Firecrawl → Agent A | — |
| | Q2 | `food_format` | Agent A + 匹配 | 影响测评场景 |
| | Q3 | `pet_type` + `life_stage` | KOL 初筛 | **`pet_type_match` 35%** |
| | Q4 | `core_claims`（最多3） | Agent A + 匹配 | `category_match` 25% |
| **二、入华目标** | | | Agent B | |
| | Q5 | `primary_goal` | Agent B | 方案叙事方向 |
| | Q6 | `target_owner_profile` | Agent B + 匹配 | `audience_match` 20% |
| | Q7 | `brand_positioning` | Agent B | 中国市场重构话术 |
| **三、平台与 KOL** | | | 匹配逻辑 | |
| | Q8 | `preferred_platforms` | 匹配 | 硬过滤 |
| | Q9 | `content_preference`（最多3） | 匹配 + 方案 | 影响 match score |
| | Q10 | `preferred_kol_type` | 匹配 | 叠加权重 |
| **四、执行约束** | | | 方案 | |
| | Q11 | `budget_band` | 匹配 + 方案 | `budget_fit` 12% |
| | Q12 | `timeline` | 方案 | 排期建议 |
| | Q13 | `special_constraints`（可选） | Agent A/B | 风险提醒 |

### Demo 模式

预填 Orijen happy path，评委只看到 Q1（粘贴链接）→ 其余自动填充 → 点击「开始匹配」

---

## Agent 输出结构（Eddie 定义 → River 实现）

> 详细规范见独立文件：`agent_output_spec.md`（v0.1）

### 结果页 4 个 Section

| Section | 内容 | 数据来源 | 优先级 |
|---------|------|---------|--------|
| 1 · 产品分析摘要 | 卖点提取 + 中国吸引力指标 | Agent A | P2 |
| 2 · 中国市场策略 | 美国说法 → 中国说法翻译 | Agent B | P1 |
| **3 · KOL 推荐卡片** | **匹配理由 + 粉丝画像 + 合作建议** | **匹配逻辑** | **P0 必做** |
| 4 · 执行方案 | 预算分配 + 内容排期 + 下一步 | 综合 | P2 |

### KOL 卡片核心要素

每张卡片包含三层信任递进：
- **数据层**：粉丝数 / 互动率 / 平台（谁都能查到，不值钱）
- **推理层**：为什么推这个人（Agent 的核心价值，一句话 headline + 维度得分条）
- **行动层**：怎么合作、发什么内容（参考标题 / 预计表现 / 报价）

### 三张卡片按「用途」排，不是按分数排

```
卡片 1 → 最佳匹配       "如果只投一个人，投她"
卡片 2 → 破圈选择       "想扩大认知，加上这个人"
卡片 3 → 精准转化       "预算有限，只投这个人"
```

---

## 产品核心定义

**一句话**：海外品牌输入产品信息，AI 双 Agent 分析后生成可执行的中国 KOL 营销方案，KOL 资源方在平台上直接响应报价，完成商业闭环。

**双边市场**：
- A 侧（品牌方）：海外卖家 / 品牌方
- B 侧（资源方）：中国 KOL / MCN 机构

**核心价值**：信息不对称 → AI 做桥，降低双边匹配成本

---

## 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | Next.js 14 (App Router) | 已有静态 demo 作为参考 |
| 后端 | Python FastAPI | Agent 编排更顺手 |
| 数据库 | Supabase (Postgres) | Auth + DB + Realtime 一体 |
| AI | Claude API (Anthropic SDK) | 双 Agent 编排 |
| 网页抓取 | Firecrawl | 产品 URL → 干净 Markdown |
| 部署 | Vercel (前端) + Railway (后端) | |

---

## 项目结构

```
入华引擎/
├── frontend/               # Next.js
│   ├── app/
│   │   ├── (brand)/        # 品牌方页面
│   │   │   ├── page.tsx        # 首页 / 输入
│   │   │   ├── campaign/[id]/  # 方案结果页
│   │   │   └── dashboard/      # 历史 campaigns
│   │   ├── (kol)/          # KOL 方页面
│   │   │   ├── page.tsx        # Brief 列表
│   │   │   └── brief/[id]/     # Brief 详情 + 报价
│   │   └── api/            # Next.js API routes (轻量)
│   └── components/
│
├── backend/                # FastAPI
│   ├── main.py
│   ├── agents/
│   │   ├── us_agent.py     # Agent A：美国市场分析
│   │   └── cn_agent.py     # Agent B：中国市场重构
│   ├── services/
│   │   ├── scraper.py      # Firecrawl 封装
│   │   ├── kol_matcher.py  # KOL 检索匹配
│   │   └── campaign.py     # Campaign CRUD
│   └── db/
│       └── schema.sql
│
├── PLAN.md                      # 本文件
├── questionnaire_design.md      # 问卷设计规范（Eddie）
├── agent_output_spec.md         # Agent 输出结构规范（Eddie → River）
├── questionnaire_simulation.md  # AI 模拟测试方案（后续优化用）
├── alignment_review.md          # 文件对齐审查记录
├── mock/
│   └── mock_kol_data.json       # KOL Mock 数据（8个，狗粮场景）
└── index.html                   # 原始 demo（参考）
```

---

## 数据库 Schema（核心表）

```sql
-- 品牌用户
brands (id, email, company_name, country, created_at)

-- Campaign（一次投放需求）
campaigns (
  id, brand_id,
  product_url, questionnaire JSONB,
  agent_a_output JSONB,   -- US 分析结果
  agent_b_output JSONB,   -- CN 重构结果
  status,                 -- draft | analyzing | ready | pushed | closed
  created_at
)

-- KOL 资源池
kols (
  id, name, platform,     -- xiaohongshu | douyin
  followers, category,
  price_min, price_max,
  engagement_rate,
  tags TEXT[],
  verified BOOLEAN
)

-- KOL 对 Campaign 的响应
kol_responses (
  id, campaign_id, kol_id,
  status,                 -- viewed | interested | quoted | declined
  quote_amount,
  message,
  created_at
)

-- 转化记录（留存 + 转化率来源）
conversions (
  id, campaign_id, kol_response_id,
  deal_amount,
  created_at
)
```

---

## 开发阶段

### Phase 0 · 需求确认
> 黑客松阶段，优先跑通 Demo 路径，次要问题后续迭代

- [x] **P0-1** KOL 数据从哪来？ → **Mock 数据**（`mock_kol_data.json`，8个KOL，已完成）
- [x] **P0-2** 问卷包含哪些字段？ → **13 题 4 段**（见 `questionnaire_design.md` v0.2，已定稿）
- [x] **P0-3** KOL 侧的交互模式？ → **先 Mock**，Demo 展示"已推送"状态即可
- [ ] **P0-4** 品牌侧需要注册登录吗？ → 建议 MVP 无账号版（输入邮箱保存结果）
- [ ] **P0-5** Agent 分析结果需要人工审核？ → 建议黑客松阶段全自动

---

### Phase 1 · 基础工程搭建
> 依赖 Phase 0 确认结果

- [ ] **1-1** 初始化 Next.js 项目 + FastAPI 项目
- [ ] **1-2** Supabase 建表（按 schema.sql）
- [ ] **1-3** 配置环境变量（Claude API Key, Firecrawl Key, Supabase URL）
- [ ] **1-4** FastAPI 基础路由搭通（健康检查 + CORS）
- [ ] **1-5** 录入种子 KOL 数据（依赖 P0-1）

---

### Phase 2 · Agent Pipeline
> 核心，优先级最高

- [ ] **2-1** Firecrawl 集成：输入 URL → 返回干净文本
- [ ] **2-2** Agent A 实现：产品文本 → 结构化美国市场分析
- [ ] **2-3** Agent B 实现：Agent A 输出 → 中国市场重构 + KOL 标准
- [ ] **2-4** KOL 匹配逻辑：Agent B 的 `kol_criteria` → 查询数据库 Top 3
- [ ] **2-5** Campaign 创建 API：`POST /campaigns` 触发整条 pipeline
- [ ] **2-6** 结果查询 API：`GET /campaigns/{id}` 返回完整分析

**验收标准**：输入一个真实的亚马逊/Shopify 产品链接，5 分钟内能拿到结构化的 KOL 匹配方案。

---

### Phase 3 · 品牌侧前端
> 把现有 demo 接真实 API

- [ ] **3-1** 将 `index.html` demo 迁移为 Next.js 组件
- [ ] **3-2** 问卷表单组件（依赖 P0-2 确认字段）
- [ ] **3-3** Agent 思考过程：轮询 campaign 状态，实时更新进度
- [ ] **3-4** 结果展示页：KOL 卡片 + 粉丝画像图表 + 营销方案
- [ ] **3-5** 邮箱保存（或账号注册，依赖 P0-4）

---

### Phase 4 · KOL 侧
> 依赖 P0-3 确认交互模式

- [ ] **4-1** KOL Brief 列表页（收到的推送）
- [ ] **4-2** Brief 详情页（查看品牌需求 + 产品分析）
- [ ] **4-3** 报价 / 接单功能
- [ ] **4-4** 通知机制（邮件 or 页面内）

---

### Phase 5 · 数据资产 & 分析
> 后期，但数据埋点要从 Phase 1 就开始

- [ ] **5-1** 埋点：品牌侧每次提交、查看、推送行为
- [ ] **5-2** 留存追踪：同一品牌第 N 次 campaign
- [ ] **5-3** 转化追踪：campaign → kol_response → conversion
- [ ] **5-4** 简单 Admin 看板（可用 Supabase Studio 代替）

---

## 关键里程碑

| 里程碑 | 描述 | 目标 |
|---|---|---|
| M1 | Agent pipeline 跑通 | 真实 URL 进，结构化方案出 |
| M2 | 前后端联调 | Demo 替换为真实数据 |
| M3 | KOL 侧基础功能 | 完整商业闭环可演示 |
| M4 | 数据埋点完整 | 能看到留存 / 转化数据 |

---

## 待确认问题

| # | 问题 | 状态 |
|---|------|------|
| 1 | KOL 数据来源 | ✅ Mock 数据，已完成 |
| 2 | 问卷字段 | ✅ 13 题 4 段，已定稿（`questionnaire_design.md` v0.2） |
| 3 | KOL 侧交互模式 | ✅ 先 Mock |
| 4 | 品牌侧账号体系 | ⏳ 建议无账号版，待确认 |
| 5 | Agent 结果是否人工审核 | ⏳ 建议全自动，待确认 |

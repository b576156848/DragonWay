# DragonWay V2 Architecture

> Date: 2026-03-27
> Status: Proposed
> Goal: Keep the existing `frontend/` as the product UI, and redesign the system around a real backend pipeline for product analysis, KOL matching, and outreach generation.

## 1. Decision Summary

### Keep

- Keep `frontend/` as the official frontend.
- Keep the existing visual direction and most of the current component tree.
- Keep `mock_kol_data.json` as the initial KOL source of truth.
- Keep the 3-step form UX already implemented in `frontend`.

### Change

- Stop treating frontend mock data as the runtime data source.
- Replace frontend-only stage switching with backend-driven campaign lifecycle.
- Redesign the data model around `QuestionnaireInput -> CampaignResult`.
- Separate product scraping, AI analysis, matching, and outreach into independent backend services.

### Current hard constraints confirmed on 2026-03-27

- GMI Cloud endpoint works at `https://api.gmi-serving.com/v1`.
- `anthropic/claude-sonnet-4.5` works.
- `anthropic/claude-sonnet-4.6` appears in `/v1/models` but is not callable in `chat/completions` at the moment.
- Amazon product URLs are not reliable with plain server-side fetch because they can return CAPTCHA pages.
- Shopify product pages are the best MVP input path.

## 2. Current Frontend Assessment

The current `frontend/` is already a usable MVP shell:

- `src/pages/Index.tsx`
  - single-page flow with 3 stages: `input -> processing -> results`
- `src/components/dragonway/QuestionnaireForm.tsx`
  - already maps closely to the 13-question spec
- `src/components/dragonway/AgentProgress.tsx`
  - good for polling/progress display
- `src/components/dragonway/KolCards.tsx`
  - usable as the base for Section 3
- `src/components/dragonway/AudienceCharts.tsx`
  - usable for audience visualization
- `src/components/dragonway/CampaignContent.tsx`
  - can be repurposed for outreach copy and content suggestions

Main gap:

- The page currently renders `src/data/mockData.ts` directly.
- `FormData` does not match the backend contract exactly.
- There is no result route, campaign id, or API integration.

## 3. Recommended Product Architecture

### 3.1 High-level flow

```text
Frontend Form
  -> POST /api/campaigns
  -> Backend creates campaign
  -> Scraper extracts product data
  -> Product Analyzer generates Agent A output
  -> CN Strategy Analyzer generates Agent B output
  -> Matcher scores KOLs from mock_kol_data.json
  -> Outreach Generator creates email + pitch suggestions
  -> Frontend polls GET /api/campaigns/{id}
  -> Result page renders campaign result
```

### 3.2 Why this design

- It preserves the existing frontend instead of rebuilding it.
- It avoids putting model logic in the browser.
- It isolates scraping risk from analysis risk.
- It lets us support Shopify first and add Amazon/Taobao later without changing the UI contract.

## 4. System Components

### 4.1 Frontend

Keep Vite + React + shadcn as-is for now.

Recommended route structure:

```text
frontend/src/pages/
  Index.tsx            # questionnaire
  Campaign.tsx         # result page
```

Recommended frontend responsibilities:

- collect questionnaire input
- create campaign
- show analysis progress
- render final result
- preview outreach email
- optionally trigger email sending

Frontend should not:

- call model APIs directly
- scrape product pages directly
- own matching logic

### 4.2 Backend

Use FastAPI.

Recommended modules:

```text
backend/
  main.py
  api/
    campaigns.py
    kols.py
    outreach.py
  schemas/
    questionnaire.py
    campaign.py
    kol.py
  services/
    scraper/
      base.py
      shopify.py
      generic.py
      marketplace.py
    ai/
      gmi_client.py
      product_analyzer.py
      cn_strategy.py
      outreach_generator.py
    matcher/
      score.py
      enrich.py
    repository/
      campaigns.py
      kols.py
  data/
    mock_kol_data.json
```

### 4.3 Data Storage

For MVP:

- campaign storage: SQLite
- KOL source: local JSON file
- email send log: SQLite

Reason:

- much faster than introducing Supabase now
- enough for local demo and staging
- easy to replace later behind a repository layer

Phase 2:

- move campaign and outreach logs to Postgres
- keep seed KOL import from JSON

## 5. Input Strategy

### 5.1 Official questionnaire contract

Backend should use the `agent_info` contract as the source of truth, not the current frontend type.

Current frontend shape:

```ts
owner_pet
owner_city
owner_price
```

Backend shape:

```ts
target_owner_profile: {
  owner_pet
  owner_city
  owner_price
}
```

Frontend should submit the backend shape directly.

### 5.2 Product input modes

Support three modes from day one:

- `product_url`
- `product_text`
- `product_name_only`

Reason:

- Shopify often works
- Amazon can fail
- users still need a fallback path

## 6. Scraping Strategy

### 6.1 Scraper adapter chain

Use provider-based scraping:

1. `ShopifyScraper`
2. `GenericProductScraper`
3. `MarketplaceScraper`
4. `ManualFallback`

### 6.2 ShopifyScraper

Primary MVP path.

Extract:

- product name
- price
- description
- ingredient list
- guaranteed analysis / nutrition facts
- brand
- images

Preferred signals:

- JSON-LD
- product form JSON
- Open Graph fields
- HTML sections

### 6.3 MarketplaceScraper

For Amazon/Taobao, do not promise stable direct scraping in MVP.

Behavior:

- attempt fetch
- detect CAPTCHA or anti-bot page
- mark scrape status as `partial` or `blocked`
- ask the analysis pipeline to continue with reduced confidence or manual text fallback

## 7. AI Pipeline

### 7.1 Model decision

Default model for now:

- `anthropic/claude-sonnet-4.5`

Do not use `anthropic/claude-sonnet-4.6` until the provider actually routes requests successfully.

### 7.2 Analysis stages

#### Stage A: Product Analyzer

Input:

- scraped product content
- questionnaire

Output:

- normalized product data
- `agent_a_output`

#### Stage B: China Strategy Analyzer

Input:

- normalized product data
- `agent_a_output`
- questionnaire

Output:

- `agent_b_output`
- matching hints

#### Stage C: KOL Matcher

Input:

- questionnaire
- normalized product data
- `agent_b_output`
- mock KOL pool

Output:

- scored KOL list
- top 3 or top 4

Important rule:

- scoring stays deterministic
- LLM only explains and enriches the results

#### Stage D: Outreach Generator

Input:

- product summary
- selected KOL
- matching rationale

Output:

- outreach subject
- outreach email body
- one-paragraph collaboration pitch
- channel-specific brief

## 8. Matching Design

### 8.1 Base scoring

Use the existing weights:

```text
pet_type_match      35%
category_match      25%
audience_match      20%
budget_fit          12%
engagement_rate      8%
expert_bonus        +5%
```

### 8.2 Output shape

The matcher should return:

- best match
- breakout option
- precision conversion option
- optional fourth reserve option

This matches the current product storytelling better than a raw top-3 rank list.

### 8.3 KOL data fields to add

The current JSON is missing outreach fields. Add:

```json
{
  "email": "creator@example.com",
  "contact_name": "Lisa",
  "language": ["zh", "en"],
  "response_status": "not_contacted"
}
```

## 9. API Design

### 9.1 Campaign APIs

```text
POST /api/campaigns
GET  /api/campaigns/{campaign_id}
GET  /api/campaigns/{campaign_id}/status
```

`POST /api/campaigns`

- accepts questionnaire input
- returns `{ campaign_id, status }`

`GET /api/campaigns/{campaign_id}`

- returns full `CampaignResult`

`GET /api/campaigns/{campaign_id}/status`

- returns progress stage for polling

### 9.2 KOL APIs

```text
GET /api/kols/mock
GET /api/campaigns/{campaign_id}/kols
```

### 9.3 Outreach APIs

```text
POST /api/campaigns/{campaign_id}/outreach/preview
POST /api/campaigns/{campaign_id}/outreach/send
```

MVP can implement `preview` first and leave `send` as mock.

## 10. Frontend Integration Plan

### 10.1 Reuse without redesigning UI

Keep:

- `HeroSection`
- `QuestionnaireForm`
- `AgentProgress`
- `KolCards`
- `AudienceCharts`

Refactor:

- `Index.tsx`
  - submit real form payload
  - create campaign
  - transition to polling mode
- `mockData.ts`
  - remove from runtime path
  - keep only for storybook/demo fallback if needed
- `types.ts`
  - replace with real API-aligned types
- `CampaignContent.tsx`
  - use real generated content and outreach text
- `PushStatus.tsx`
  - only render after actual preview/send state exists
- `EmailCapture.tsx`
  - convert to brand contact capture or outreach action panel

### 10.2 Routing change

Recommended:

- `/` -> questionnaire
- `/campaign/:id` -> result page

Reason:

- shareable result links
- cleaner refresh behavior
- easier polling and re-entry

## 11. Result Page Redesign

Use the current component inventory, but align it to `agent_output_spec.md`.

### Section 1

- product summary
- selling points
- China relevance

### Section 2

- localized selling points
- audience summary
- recommended platform split
- risk factors

### Section 3

- top 3 or 4 KOL cards
- dimension score bars
- fit rationale
- pricing
- collaboration suggestions

### Section 4

- execution plan
- budget allocation
- content calendar
- outreach preview

## 12. Delivery Phases

### Phase 1

- freeze frontend information architecture
- align form payload to questionnaire spec
- define real frontend types

### Phase 2

- create FastAPI backend
- implement Shopify scraper
- implement GMI client with `claude-sonnet-4.5`
- implement campaign creation and status polling

### Phase 3

- implement rule-based KOL matcher using local JSON
- map backend result to current KOL cards and charts
- render real campaign results in frontend

### Phase 4

- add outreach preview
- add KOL email fields
- optionally add send-email integration

### Phase 5

- improve Amazon/Taobao support with browser-based scraping
- move persistence from SQLite to Postgres if needed

## 13. Final Recommendation

Do not rebuild the frontend.

The best path is:

- treat `frontend/` as the product UI
- build a clean FastAPI backend behind it
- ship Shopify-first
- use `claude-sonnet-4.5` for now
- keep KOL matching deterministic and auditable
- add outreach generation as the first actionable business output

That gives the fastest path from the current demo to a believable working MVP.

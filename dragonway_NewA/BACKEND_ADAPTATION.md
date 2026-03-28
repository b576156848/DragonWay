# DragonWay NewA Backend Adaptation

## Goal

This document defines how the backend should adapt to `dragonway_NewA` without changing any frontend visuals, stage flow, or component structure.

`dragonway_NewA` is the source of truth.

The backend must adapt to:

- single-page flow: `input -> processing -> results`
- quick chat flow with:
  - URL parse
  - top 3 KOL preview
  - refinement
  - round 2 expanded to 4 KOLs
- detailed form flow
- result sections:
  - opportunities
  - kols
  - audience
  - campaign content
  - push status
  - email capture

The contract is defined by:

- [schema.json](/Users/jianghao/workspace/dragon_way/dragonway_NewA/schema.json)
- [api.ts](/Users/jianghao/workspace/dragon_way/dragonway_NewA/src/lib/api.ts)

## Design Rule

Do not force the frontend into the current backend model.

Instead, add a new adapter layer under `/api/v1/...` that:

1. accepts `dragonway_NewA` request payloads as-is
2. reuses existing backend services where useful
3. transforms backend outputs into `dragonway_NewA` response shapes
4. does not leak current `CampaignResult` / polling / route-based assumptions into this frontend

## Endpoint Set

## 1. `GET /api/v1/schema-meta`

Purpose:
- health-check for frontend/backend contract alignment

Response:
- `schema_version`
- `frontend_id`
- supported flows

Implementation:
- static response from adapter layer

## 2. `POST /api/v1/quick/parse-url`

Purpose:
- support the quick chat step `welcome -> analyzing_url`
- infer only the fields the chat needs early

Frontend request:
- `product_url`

Frontend response:
- `product_url`
- `summary`
- `inferred_fields`
  - `food_format`
  - `pet_type`
  - `core_claims`
- `source_confidence`

Backend reuse:
- reuse `ProductScraper`
- reuse `ProductIntakeAnalyzer`

Adapter mapping:
- `summary` from intake praise + detected product summary
- `food_format` from intake prefill
- `pet_type` from intake prefill
- `core_claims` from intake prefill
- `source_confidence`
  - `0.9+` for successful Shopify parse
  - `0.5-0.7` for partial generic parse
  - `<=0.3` for blocked/manual fallback

Notes:
- no KOL matching yet
- no persistence required

## 3. `POST /api/v1/quick/match-preview`

Purpose:
- support quick chat step `matching -> kol_results`
- return exactly 3 KOLs for round 1

Frontend request:
- full `form_data`
- `source=quick_chat`

Frontend response:
- `top_kols` exactly length 3
- `audience`
- `summary`

Backend reuse:
- reuse real KOL store
- reuse matcher scoring logic

Required adapter work:
- add a `FormData -> QuestionnaireInput` translator
- run scoring with current product URL and form fields
- convert internal KOL result to frontend `KolProfile`
- aggregate audience into frontend `AudienceData`

Important:
- this endpoint must return `KolProfile`, not internal `KOLMatch`
- this is a preview response, not full campaign output

## 4. `POST /api/v1/quick/refine`

Purpose:
- support the existing round 2 refinement block in `dragonway_NewA`
- expand from 3 KOLs to 4 KOLs

Frontend request:
- `form_data`
- `initial_kols`
- `kept_kol_ids`
- optional `dropped_kol_id`
- `answers`
  - `priority`
  - `budget`
  - `style`

Frontend response:
- `refined_kols` exactly length 4
- `refined_audience`
- `summary`

Backend strategy:
- keep the frontend semantics exactly:
  - user keeps some of the initial 3
  - backend fills the rest from a refinement pool
  - final output length is 4

Recommended implementation:
- round 1:
  - keep the selected KOLs exactly as-is when possible
- round 2 candidate selection:
  - rerank remaining KOLs using refinement preferences

Additional ranking adjustments:
- `priority=viral`
  - boost high follower + strong reach creators
- `priority=conversion`
  - boost micro/mid creators with higher engagement and lower price
- `priority=endorsement`
  - boost expert-background creators
- `style=educational`
  - boost nutrition / science / certified tags
- `style=lifestyle`
  - boost premium / daily-life / healing / lifestyle tags
- `style=comedy`
  - boost viral / comedy / story-driven tags
- `budget=increase`
  - allow top-tier creators to surface more aggressively

Output semantics:
- frontend already distinguishes:
  - kept
  - new
- backend only needs to provide the final 4 profiles

## 5. `POST /api/v1/analysis/submit`

Purpose:
- support detailed form submit
- optionally support quick chat final report hydration

Frontend request:
- `form_data`
- `source`
  - `detailed_form`
  - `quick_chat`

Frontend response:
- `result: AnalysisResult`
- `source`

Important design choice:
- for `dragonway_NewA`, keep this endpoint synchronous at the contract layer

Reason:
- the frontend is not built around backend polling
- it already owns a local `processing` stage animation
- preserving the UI means the frontend should be able to request one final `AnalysisResult` payload, not a campaign/job object

Backend implementation options:

### Option A: synchronous adapter

- call internal services inline
- return final `AnalysisResult`

Pros:
- simplest fit for current frontend
- no stage redesign

Cons:
- request may be slow

### Option B: hidden async behind adapter

- create background job internally
- adapter waits for completion and returns final `AnalysisResult`

Pros:
- can reuse current pipeline internally

Cons:
- more moving pieces
- still behaves synchronously from frontend perspective

Recommendation:
- use Option A first

Backend reuse:
- `scraper`
- `intake`
- `matcher`
- optionally parts of `pipeline` logic

Adapter mapping to `AnalysisResult`:
- `opportunities`
  - derived from top product selling points or current strategy summary
- `kols`
  - round 1 or final shortlist, depending on submit source
- `audience`
  - aggregated from returned KOL set
- `campaign`
  - generated xiaohongshu post
  - douyin script
  - outreach draft

## 6. `POST /api/v1/leads/capture`

Purpose:
- support `EmailCapture`
- this is a frontend CTA capture, not outreach sending

Frontend request:
- `email`
- optional `company`
- optional context:
  - `source_mode`
  - partial `form_data`

Frontend response:
- `success`
- `message`

Implementation:
- persist lead capture in a dedicated table
- do not couple this endpoint to outreach sending
- keep it fast and side-effect light

## Runtime Semantics

`dragonway_NewA` only presents 3 visible stages:

- `input`
- `processing`
- `results`

This has direct backend implications:

1. the frontend owns the progress animation locally
2. the backend must not require polling to complete the main report flow
3. the backend should offer small fast endpoints for quick chat steps
4. the final report endpoint should behave synchronously from the frontend perspective

Recommended latency targets:

- `quick/parse-url`: under 3s for Shopify happy path
- `quick/match-preview`: under 2s once form fields are complete
- `quick/refine`: under 1.5s
- `analysis/submit`: under 12s in phase 1

If latency is too high later, the adapter can hide internal async work, but the response contract should still remain synchronous.

## Target Backend Shape

Add a parallel adapter layer instead of rewriting current `/api` routes.

Recommended new modules:

- `backend/app/api_newa.py`
- `backend/app/schemas_newa.py`
- `backend/app/services/newa_adapter.py`
- `backend/app/services/newa_mapper.py`
- `backend/app/services/newa_refinement.py`
- `backend/app/services/lead_store.py`

Recommended responsibility split:

- `api_newa.py`
  - FastAPI routes under `/api/v1`
  - request validation
  - schema version guard
- `schemas_newa.py`
  - Pydantic models matching `dragonway_NewA/schema.json`
- `newa_adapter.py`
  - orchestration for each endpoint
  - reuse existing scraper, intake, matcher, KOL store, and AI helpers
- `newa_mapper.py`
  - mapping internal backend models into frontend-facing shapes
  - no business logic beyond formatting and shape conversion
- `newa_refinement.py`
  - refinement-specific ranking adjustments for round 2
- `lead_store.py`
  - SQLite persistence for `EmailCapture`

## Reuse vs New Work

### Reuse Directly

- `backend/app/services/scraper.py`
- `backend/app/services/intake.py`
- `backend/app/services/kol_store.py`
- selected scoring logic from `backend/app/services/matcher.py`

### Reuse With Wrapping

- `LLMClient`
  - use only behind adapter services
  - never expose raw LLM output shapes to the frontend
- execution/content generation helpers
  - only if mapped into `CampaignContent`

### Do Not Reuse As Public Contract

- `CampaignResult`
- `CampaignCreateResponse`
- polling routes
- Gmail / outreach send routes

Those belong to the old frontend flow and should not leak into `dragonway_NewA`.

## Data Translation Rules

## 1. Form Translation

The adapter needs a strict translator:

- `dragonway_NewA FormData`
- into internal `QuestionnaireInput` or a `NewAQuestionnaireContext`

Recommended rule:

- keep a dedicated translator instead of forcing `FormData` directly into old questionnaire models

Reason:

- `dragonway_NewA` uses UX-friendly string enums
- old backend enums are narrower and opinionated
- direct reuse will create accidental validation failures

Recommended translator outputs:

- normalized product URL
- normalized platform list
- normalized claims
- normalized budget band
- fallback defaults for fields the old backend expects but NewA does not deeply use

## 2. KOL Translation

Internal KOL rows or `KOLMatch` objects must be mapped to frontend `KolProfile`.

Mapping rules:

- `id` -> stable KOL id from SQLite source
- `name` -> display name from real KOL data
- `avatar` -> `/assets/kols/...`
- `platform`
  - internal `xiaohongshu` -> `Xiaohongshu`
  - internal `douyin` -> `Douyin`
- `followers`
  - format as compact string such as `31K`, `1.9M`
- `engagement`
  - format as `7.5%`
- `matchReason`
  - concise, frontend-readable, 1 to 2 sentences
- `priceRange`
  - format as `¥2,500 – ¥5,500`
- `contentTags`
  - max 3 to 4 tags for card layout stability
- `badge`
  - short summary line, not a paragraph

## 3. Audience Translation

Frontend expects:

- `ageDistribution`
- `cityTier`
- `spendingPower`
- `interestTags`

Backend source options:

- aggregate from selected KOL rows if source data exists
- fall back to deterministic audience heuristics from form inputs

Recommended order:

1. aggregate real KOL audience metadata
2. blend with form intent
3. normalize percentages to 100

## 4. Opportunities Translation

`OpportunityCard[]` should stay short and visual, not report-like.

Generation rule:

- return exactly 3 to 4 cards
- each card:
  - one concise title
  - one concise description
  - one frontend icon token

Card sources:

- product selling points
- China pet-owner demand angle
- platform-fit angle
- trust / conversion angle

## 5. Campaign Content Translation

Frontend only needs:

- `xiaohongshuPost`
- `douyinScript`
- `kolOutreach`

So the backend should not return the full old execution-plan object here.

Recommended content generation strategy:

- deterministic template first
- optional LLM enhancement behind the adapter
- return a single best version for each field

## Endpoint-by-Endpoint Execution Design

## `GET /api/v1/schema-meta`

Static response:

- `schema_version = dragonway-newa.v1`
- `frontend_id = dragonway_NewA`
- flows:
  - `quick_chat`
  - `detailed_form`
  - `results`
  - `lead_capture`

Validation rule:

- if request header `X-Frontend-Schema` exists and mismatches, return `409`

## `POST /api/v1/quick/parse-url`

Execution flow:

1. validate URL string
2. scrape product page
3. run intake analysis
4. map into `QuickParseUrlResponse`

No persistence required.

Failure strategy:

- if scraping partially fails, still return:
  - original `product_url`
  - conservative summary
  - low `source_confidence`
  - inferred fields with safe defaults

## `POST /api/v1/quick/match-preview`

Execution flow:

1. translate `FormData`
2. scrape product if needed
3. run KOL scoring
4. select top 3 only
5. aggregate audience from selected 3
6. return summary string for the chat

Persistence:

- not required in phase 1

Important:

- this endpoint must be deterministic enough that the same input does not produce visually unstable KOL cards

## `POST /api/v1/quick/refine`

Execution flow:

1. validate `initial_kols`
2. preserve kept KOLs by id where possible
3. compute refinement boosts based on:
  - `priority`
  - `budget`
  - `style`
4. rerank remaining pool
5. fill result to exactly 4 KOLs
6. aggregate refined audience
7. return one summary sentence for the agent

Determinism rule:

- if a kept KOL id is still valid, do not replace it
- only replace the explicitly dropped or unselected slots

## `POST /api/v1/analysis/submit`

Execution flow for `source=detailed_form`:

1. translate `form_data`
2. scrape product
3. run opportunity derivation
4. run base KOL ranking
5. choose final KOL set for report
6. aggregate audience
7. generate campaign content
8. return `AnalysisResult`

Execution flow for `source=quick_chat`:

1. same as above
2. if refinement context is available in a later phase, prefer refined 4-KOL set
3. otherwise generate final report from the same scoring pass and return report-compatible KOL set

Phase 1 recommendation:

- keep this endpoint independent from prior quick-chat calls
- let it derive the final result directly from submitted `form_data`
- do not require server-side session state

This keeps the API stateless and much simpler to debug.

## `POST /api/v1/leads/capture`

Execution flow:

1. validate email
2. store lead row
3. optionally store current form snapshot as JSON
4. return success message

No dependency on Gmail, SMTP, or outreach sending.

## Database Design

Use the existing SQLite database, but isolate NewA-specific data into dedicated tables.

Recommended tables:

### `kol_profiles`

Already exists and should continue to be the source of truth for:

- real KOL metadata
- price ranges
- audience hints
- avatar mapping

Source files:

- [real_kol_data.json](/Users/jianghao/workspace/dragon_way/real_kol_data.json)
- [real_kol_portrait](/Users/jianghao/workspace/dragon_way/real_kol_portrait)

### `newa_leads`

Suggested columns:

- `lead_id`
- `email`
- `company`
- `source_mode`
- `form_data_json`
- `created_at`

### Optional `newa_request_logs`

Only if debug visibility is needed later.

Suggested columns:

- `request_id`
- `endpoint`
- `payload_json`
- `response_summary_json`
- `created_at`

This is optional and should not block phase 1.

## Error Handling Rules

Frontend-preserving error behavior matters more than backend purity here.

Recommended rules:

- malformed request -> `422`
- schema header mismatch -> `409`
- unsupported URL / scraper degraded -> `200` with low-confidence fallback where possible
- hard adapter failure -> `500` with concise `detail`

Do not return old backend error shapes.

## Phase Plan

## Phase 1: Contract Adapter

Goal:

- make `dragonway_NewA` talk to real backend data without changing UI

Scope:

- `schema-meta`
- `quick/parse-url`
- `quick/match-preview`
- `quick/refine`
- `analysis/submit`
- `leads/capture`
- static KOL avatars

## Phase 2: Better Content Quality

Scope:

- improve `matchReason`
- improve opportunity cards
- improve campaign content with optional LLM calls

## Phase 3: Observability

Scope:

- request logging
- adapter debug toggles
- latency measurement

## Confirmed Decisions

1. For `analysis/submit` with `source=quick_chat`, if the user has already completed refinement, the final report should reflect the refined 4-KOL set.

2. `PushStatus` stays frontend-demo in phase 1. The backend does not need to expose a dedicated status source for this component yet.

Frontend response:
- `success`
- `message`

Recommended implementation:
- store to SQLite first
- optional forward later via CRM / webhook / email

This should not depend on campaign generation finishing.

## Adapter Layer Structure

Recommended new files:

- `backend/app/api_newa.py`
- `backend/app/schemas_newa.py`
- `backend/app/services/newa_adapter.py`
- `backend/app/services/newa_mapper.py`
- `backend/app/services/lead_store.py`

Responsibilities:

### `api_newa.py`
- expose `/api/v1/...`
- only schema-first routes for `dragonway_NewA`

### `schemas_newa.py`
- Pydantic models mirroring `dragonway_NewA/schema.json`

### `newa_adapter.py`
- orchestration logic per endpoint
- owns quick parse / quick preview / refine / submit

### `newa_mapper.py`
- convert:
  - `FormData -> QuestionnaireInput`
  - internal KOL result -> `KolProfile`
  - internal audience -> `AudienceData`
  - internal analysis -> `AnalysisResult`

### `lead_store.py`
- persist captured leads

## Reuse Strategy

What can be reused immediately:

- `ProductScraper`
- `ProductIntakeAnalyzer`
- real KOL store
- core matcher scoring logic

What should not be exposed directly:

- current `/api/campaigns`
- current `/api/campaigns/{id}/status`
- current `/api/campaigns/{id}`
- current `CampaignResult`

Why:
- those are shaped for a different frontend
- exposing them to `dragonway_NewA` would pull the frontend toward old backend semantics

## Data Persistence

Recommended tables:

### `kol_profiles`
- already exists in current SQLite path and can be reused

### `lead_captures`
- `lead_id`
- `email`
- `company`
- `source_mode`
- `context_json`
- `created_at`

### optional `newa_requests`
- request snapshots for debugging and replay

Not required for phase 1:
- campaign jobs
- frontend session state

## Mapping Rules

## `KOLMatch -> KolProfile`

Internal values must be flattened to:

- `id`
- `name`
- `avatar`
- `platform`
- `profileUrl`
- `followers`
- `engagement`
- `matchReason`
- `priceRange`
- `contentTags`
- `badge`

Formatting rules:

- followers:
  - `40000 -> 40K`
  - `1900000 -> 1.9M`
- engagement:
  - keep percent string
- priceRange:
  - display friendly range string
- badge:
  - human-facing sentence, not internal role code

## `Audience aggregation`

For frontend compatibility, aggregate using returned KOLs only.

- round 1 uses top 3
- round 2 uses refined 4

This ensures the charts match what the user sees.

## `AnalysisResult`

The result payload must remain compact and presentation-ready.

No nested backend-only objects should leak into the response.

## Risks

1. The current backend matcher is optimized for a more report-like output, not the exact `KolProfile` strings the frontend expects.
2. `dragonway_NewA` expects a refinement experience that is product-level, not raw score-level. The adapter must keep the UX language coherent.
3. Synchronous `analysis_submit` may become slow if scraping or LLM generation blocks.
4. The frontend currently treats processing as a local timer, so backend latency spikes can produce mismatch unless the eventual frontend integration uses promise-based transition timing carefully.

## Recommended Implementation Order

1. Add `schemas_newa.py`
2. Add `api_newa.py` with static `/schema-meta`
3. Implement `quick/parse-url`
4. Implement `quick/match-preview`
5. Implement `quick/refine`
6. Implement `analysis/submit`
7. Implement `leads/capture`
8. Only after this, wire `dragonway_NewA` from mock data to `api.ts`

## Open Questions

1. For `analysis_submit`, do you want the final result to always use:
   - round 1 top 3 KOLs
   - or the refined 4 KOL combination when coming from quick chat?

2. For `PushStatus`, should the backend eventually reflect a real downstream delivery state, or should it remain a frontend-only presentation block in phase 1?

# DragonWay NewB Backend Adaptation

## Goal

Adapt `dragonway_NewB` to the existing `NewA` backend contract without changing `NewA` or backend code.

Principle:

- keep `NewB` visual design and page structure
- keep `NewB` chat rhythm and interaction feel
- replace mock data paths with real API calls
- reuse the existing `/api/v1/*` adapter already built for `NewA`
- preserve the `NewB` page layout while moving quick chat control to the backend agent

## Scope

Only `dragonway_NewB` was changed.

No changes were made to:

- `dragonway_NewA`
- `backend/app/api_newa.py`
- `backend/app/services/newa_*`

## Backend Contract Reused

`NewB` now consumes the same backend endpoints used by `NewA`:

- `GET /api/v1/schema-meta`
- `POST /api/v1/quick/session/start`
- `POST /api/v1/quick/session/turn`
- `POST /api/v1/quick/parse-url`
- `POST /api/v1/quick/match-preview`
- `POST /api/v1/quick/refine`
- `POST /api/v1/analysis/submit`
- `POST /api/v1/leads/capture`

Schema header:

- `X-Frontend-Schema: dragonway-newa.v1`

## Files Changed

- `src/lib/api.ts`
- `src/pages/Index.tsx`
- `src/components/dragonway/ChatAgent.tsx`
- `src/components/dragonway/KolCards.tsx`
- `src/components/dragonway/EmailCapture.tsx`
- `src/data/formOptions.ts`
- `src/index.css`

## Integration Strategy

### 1. Results Flow

`NewB` no longer renders result sections from local mock data.

It now follows:

- input
- processing animation
- real backend response
- results render

Detailed form submit calls:

- `submitAnalysis({ form_data, source: 'detailed_form' })`

Quick chat final submit calls:

- `submitAnalysis({ session_id, form_data, source: 'quick_chat' })`

Implemented in:

- `src/pages/Index.tsx`

### 2. Quick Chat Flow

`NewB` keeps its own visual shell, but the conversation state is now backend-driven.

It no longer relies on the old local `CHAT_STEP_DEFS` state machine as the source of truth.

Instead, `NewB` now uses:

- `quick/session/start`
- `quick/session/turn`

Behavior:

- the first two welcome lines are fixed client-side so the first screen appears instantly
- those two lines animate in one by one
- the backend session boots in parallel
- after the welcome screen, every next step comes from the backend agent
- invalid URLs are rejected by the backend welcome step
- preview KOLs and refined KOLs come from the live backend session
- the final quick-chat report uses that same session state

Implemented in:

- `src/components/dragonway/ChatAgent.tsx`

### 3. KOL Refinement On Results Page

`NewB` results-page KOL optimization no longer uses local `ROUND2_KOL_POOL`.

It now calls:

- `quickRefineMatches`

Inputs passed:

- `session_id`
- `form_data`
- `initial_kols`
- `kept_kol_ids`
- `dropped_kol_id`
- `answers`

Return data updates:

- refined `kols`
- refined `audience`
- real avatar URLs from `/assets/kols/...`

Implemented in:

- `src/components/dragonway/KolCards.tsx`

### 4. Lead Capture

`EmailCapture` submits real lead data:

- `email`
- optional `company`
- optional context:
  - `source_mode`
  - `form_data`

Implemented in:

- `src/components/dragonway/EmailCapture.tsx`

### 5. Form Value Compatibility

There is one known enum mismatch between `NewB` UI values and backend schema:

- `NewB` UI uses `preferred_kol_type = lifestyle_creator`
- backend expects `preferred_kol_type = lifestyle`

To avoid changing the visible `NewB` form options, normalization is done before API submission.

Implemented in:

- `src/lib/api.ts`

Function:

- `normalizeFormDataForApi(formData)`

### 6. Build Fix

`src/index.css` had a Vite CSS ordering issue:

- `@import` must come before `@tailwind`

This was fixed so `NewB` can build successfully.

## Verification

Build verified with:

```bash
npm run build
```

Dev server can be started on any local port, for example:

```text
http://127.0.0.1:8082/
```

## Notes

- `NewB` still preserves its landing page sections:
  - Hero
  - Workflow
  - Trust Moat
  - CTA
- `NewB` still preserves its bilingual copy system for static UI
- live agent messages are rendered from the backend session
- KOL cards now use real creator avatars when available

## Summary

This adaptation makes `dragonway_NewB` compatible with the already-iterated `NewA` backend adapter while preserving the `NewB` frontend experience. The main difference from the previous adaptation is that quick chat is no longer controlled by a local mock step machine.

No backend migration was required.

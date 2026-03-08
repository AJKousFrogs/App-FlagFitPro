# Training / ACWR / Today / Video Audit

Date: March 7, 2026

## Scope
- player-facing exact training
- ACWR truth and display
- Today route resolution
- exercise video / YouTube embed path
- upgrade and refactor recommendations

## Current architecture

### Authoritative exact-training source
- Canonical source of truth for the player’s exact prescribed session is:
  - [daily-protocol.js](/Users/aljosaursakous/Desktop/Flag football HTML - APP/netlify/functions/daily-protocol.js)
- Player-facing consumers:
  - [today.component.ts](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/features/today/today.component.ts)
  - [protocol-api-mapper.ts](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/features/today/utils/protocol-api-mapper.ts)
  - [protocol-block.component.ts](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/features/training/daily-protocol/components/protocol-block.component.ts)
  - [exercise-card.component.ts](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/features/training/daily-protocol/components/exercise-card.component.ts)

### Overlapping systems found
- `daily-protocol`:
  - exact daily prescription
  - coach/weather/team-activity overrides
  - persisted readiness/ACWR context at generation time
- `UnifiedTrainingService`:
  - dashboard aggregation
  - readiness/ACWR facade
  - weekly schedule, stats, today overview support
- `AcwrService`:
  - client-side EWMA calculation from workout logs
- `training-plan` and the former training-video library module:
  - planning / recommendation / curation logic

## Findings

### 1. Exact training was already mostly in `daily-protocol`, but Today still had contract drift
- Today was rendering protocol blocks from `daily-protocol`, but some core metrics and summary behavior were still split across separate services.
- Risk:
  - player sees one prescribed session but different live metrics beside it
  - future features can accidentally use `training-plan` or client-side video data instead of the actual prescribed protocol

### 2. ACWR had a source-of-truth split
- Backend protocol generation persists `acwr_value` as the value used for that day’s prescription.
- Frontend `AcwrService` computes a live EWMA from workout logs.
- That is useful, but it means:
  - `daily-protocol` is the correct truth for “why today’s session looks like this”
  - `AcwrService` is better treated as live analytics / fallback, not the authoritative prescription driver on Today

### 3. Video metadata drift was real
- Some exercises already had `video_url`, `video_id`, and `thumbnail_url`.
- Some fallback protocol exercises only had `video_url`.
- One backend transform path explicitly set `videoId: null` for fallback exercises even when a YouTube URL existed.
- Result:
  - player could get a protocol with a valid YouTube URL
  - but the in-app embed would fail because the UI only embedded when `videoId` was present

### 4. Today had a UX gap: the player still had to infer the exact session
- The page showed blocks and banners, but not a single concise “This is today’s exact session” summary.
- That is a comprehension problem, not just a design problem.

### 5. Local date handling was still fragile
- Today was still using `toISOString().split("T")[0]` in several places.
- That can request the wrong day around midnight/time-zone edges.

## Changes made in this pass

### Backend
- Added canonical backend YouTube metadata helper:
  - [youtube.js](/Users/aljosaursakous/Desktop/Flag football HTML - APP/netlify/functions/utils/youtube.js)
- Reused it in:
  - [daily-protocol.js](/Users/aljosaursakous/Desktop/Flag football HTML - APP/netlify/functions/daily-protocol.js)
  - [exercises.js](/Users/aljosaursakous/Desktop/Flag football HTML - APP/netlify/functions/exercises.js)
- Fixed fallback protocol exercise transformation so `videoId` and `thumbnailUrl` are derived from `video_url` when possible.
- Exported the real `handler` from `daily-protocol.js` so existing tests hit the actual function instead of silently relying on a missing export.

### Frontend
- Added canonical frontend YouTube metadata helper:
  - [youtube-video.utils.ts](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/shared/utils/youtube-video.utils.ts)
- Hardened Today protocol mapping:
  - [protocol-api-mapper.ts](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/features/today/utils/protocol-api-mapper.ts)
- Fixes included:
  - accept both snake_case and camelCase protocol fields
  - derive `videoId` and `thumbnailUrl` from `videoUrl`
  - keep protocol `protocolDate`, `readinessScore`, and `acwrValue` intact when backend returns snake_case
- Hardened player-facing exercise embed behavior:
  - [exercise-card.component.ts](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/features/training/daily-protocol/components/exercise-card.component.ts)
- Today route improvements:
  - [today.component.ts](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/features/today/today.component.ts)
  - [today.component.html](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/features/today/today.component.html)
  - [today.component.scss](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/features/today/today.component.scss)
- Fixes included:
  - local date handling now uses shared date utilities instead of raw ISO slicing
  - readiness display prefers protocol truth first, live service second
  - added a modern exact-session summary card
  - added direct CTA to jump into the prescribed protocol blocks

### Shared date fix
- Updated [date.utils.ts](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/shared/utils/date.utils.ts) so `getTodayISO()` returns a local calendar date key rather than UTC-shifted ISO slicing.

## What is authoritative now

### Exact player training
- authoritative:
  - `daily-protocol` API response
- not authoritative:
  - `training-plan`
  - curated video library types or client-side curation logic
  - any client-side inference on Today

### ACWR for “today’s prescribed session”
- authoritative:
  - `daily-protocol.acwr_value`
- secondary / live analytics:
  - `AcwrService`

### Video for today’s prescribed exercises
- authoritative:
  - `exercise.video_url`, `exercise.video_id`, `exercise.thumbnail_url`
  - fallback protocol exercise video fields normalized by backend transform
- not authoritative:
  - curated video library types or client-side curation logic

## Recommended refactor path

### P0
- Keep `daily-protocol` as the only exact prescription contract for players.
- Do not let Today, dashboard cards, or future widgets rebuild session logic independently.

### P1
- Move all player-facing “today” metrics to a small `TodayProtocolFacade` or similar adapter that reads:
  - protocol truth
  - fallback live metrics only when protocol truth is absent
- That prevents direct template/service drift from returning.

### P2
- Keep curated video types and discovery logic out of runtime exact-session prescription.
- The old runtime service was removed because it was only serving as a type bucket.
- Active video types now live in [training-video.models.ts](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/core/models/training-video.models.ts).
- If the curated video library should drive prescriptions, formalize it server-side with an explicit database mapping:
  - `exercise_videos`
  - or `protocol_exercise.video_id`
- Do not do client-side matching by name/slug for the player prescription path.

### P3
- Long-term ACWR refactor:
  - expose a dedicated backend ACWR summary endpoint or embed the exact risk label in `daily-protocol`
  - use frontend `AcwrService` for drill-down and live monitoring, not as competing truth on the Today page

## Success criteria after this pass
- player can see a single exact-session summary on Today
- in-app YouTube embed works whenever the protocol has a valid YouTube URL
- Today no longer drops core protocol metrics because of snake_case / camelCase drift
- date requests for “today” are local-calendar safe

## Verification run
- root Vitest:
  - `tests/integration/daily-protocol-video-transform.test.js`
  - `tests/integration/daily-protocol-mutations.test.js`
- Angular Vitest:
  - [protocol-api-mapper.spec.ts](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/features/today/utils/protocol-api-mapper.spec.ts)
  - [today-state.resolver.spec.ts](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/features/today/resolution/today-state.resolver.spec.ts)
- Angular quality gates:
  - `npm run lint`
  - `npm run lint:css`
  - `npm run build`
  - `npm run e2e:smoke`

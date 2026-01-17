# Contract Map: FE ↔ BE ↔ DB Alignment

> **Generated**: 2026-01-17  
> **Auditor**: Staff Engineer Contract Audit  
> **Scope**: Angular 21 (FE), Node/Express + Netlify Functions (BE), Supabase/Postgres (DB)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Findings Summary](#findings-summary)
3. [Flow 1: Trainings List + Details](#flow-1-trainings-list--details)
4. [Flow 2: Schedule View + Edits](#flow-2-schedule-view--edits)
5. [Flow 3: Saving Training Logs](#flow-3-saving-training-logs)
6. [Flow 4: Exercise Library](#flow-4-exercise-library)
7. [Flow 5: Video Playback](#flow-5-video-playback)
8. [Calculation Integrity Audit](#calculation-integrity-audit)
9. [Canonical Sources of Truth](#canonical-sources-of-truth)
10. [Contract Tests](#contract-tests)

---

## Executive Summary

This audit mapped the top product flows across FE/BE/DB and found 8 contract issues:

- **3 P0 issues fixed** (offline training log routing, delete endpoint mismatch, schedule field mismatches)
- **3 P1 issues fixed** (ACWR formula alignment, training stats window alignment, workload formula alignment)
- **2 P2 issues open** (legacy model fields still in use, video playback not wired to DB)

The system is now aligned on **training log routing**, **delete semantics**, **schedule table usage**, and **calculation consistency**. Remaining issues are legacy model cleanup and video/DB wiring.

---

## Findings Summary

### P0 - Critical (Fixed)

| ID | Issue | Impact | Fix | Files |
|----|-------|--------|-----|-------|
| P0-1 | Offline training logs routed to `/daily-protocol` instead of training sessions | Offline logs failed to sync | Redirected to `/training-sessions` + log-mode support | `angular/src/app/core/services/offline-queue.service.ts`, `netlify/functions/training-sessions.cjs` |
| P0-2 | Delete endpoint mismatch (`/training-session/:id` vs `/api/training/sessions/:id`) | Deletes failed in production | Standardized delete path + added DELETE handler | `angular/src/app/core/services/training-data.service.ts`, `netlify/functions/training-sessions.cjs` |
| P0-3 | Schedule queries/inserts used non-canonical fields (`training_type`, `duration`, `athlete_id`, `start_time`, `template_id`) | Schedule view failed if columns missing | Canonicalized to `session_type`, `duration_minutes`, `user_id` | `angular/src/app/features/training/training-schedule/training-schedule.component.ts` |

### P1 - High (Fixed)

| ID | Issue | Impact | Files |
|----|-------|--------|-------|
| P1-1 | ACWR formula mismatch: FE uses EWMA, BE daily-training used simple averages | Different risk guidance across surfaces | `angular/src/app/core/services/acwr.service.ts`, `netlify/functions/daily-training.cjs` |
| P1-2 | Training stats window mismatch (FE 90-day vs UnifiedTraining 30-day vs BE 30-day) | Inconsistent totals between cards and endpoints | `angular/src/app/core/services/training-data.service.ts`, `angular/src/app/core/services/unified-training.service.ts`, `routes/training.routes.js` |
| P1-3 | Workload formula mismatch (RPE×duration vs duration×intensity/10) | Load metrics differ by flow | `angular/src/app/features/training/training-log/training-log.component.ts`, `netlify/functions/training-complete.cjs` |

### P2 - Medium (Open)

| ID | Issue | Impact | Files |
|----|-------|--------|-------|
| P2-1 | Legacy fields still in FE models (`date`, `duration`, `intensity`, `athlete_id`) | Extra mapping/branching in FE | `angular/src/app/core/models/api.models.ts` |
| P2-2 | Video playback is FE-only (static curated data); DB tables unused in FE flow | BE/DB contracts not enforced | `angular/src/app/core/services/training-video-database.service.ts`, `angular/src/app/core/services/instagram-video.service.ts` |

---

## Flow 1: Trainings List + Details

### FE Components → FE Services
- `AthleteDashboardComponent` → `TrainingDataService.getTrainingSessions()`
- `TrainingDataService.getTrainingSession(id)`

### Access Path
- **Direct Supabase (primary)**: `training_sessions` via `supabase-js`
- **Optional API**: `GET /api/training/sessions` (Netlify) for external clients or builders

### FE Model
- `TrainingSession` in `angular/src/app/core/services/training-data.service.ts`

### DB Tables
- `training_sessions`

### Query / Filters
- Default order: `session_date DESC`
- Default limit: 100 (capped at 500)
- Default date filter: `session_date <= today` unless `includeUpcoming = true`

### Date/Time Format
- `session_date`: `YYYY-MM-DD`
- `created_at`/`updated_at`: ISO 8601 datetime

### Notes
- FE uses **direct Supabase** for list/detail; BE route is not used in this flow.

---

## Flow 2: Schedule View + Edits

### FE Component → FE Service
- `TrainingScheduleComponent` → direct `SupabaseService.client`

### DB Tables
- `training_sessions` (actual sessions)
- `training_session_templates` + `training_weeks` (scheduled templates)

### Queries
- **Actual sessions**: `training_sessions` filtered by `user_id` and `session_date` range
- **Templates**: `training_session_templates` joined to `training_weeks`

### Mutations
- **Mark complete**: update `training_sessions.status = "completed"`, `completed_at = now`
- **Start template session**: insert into `training_sessions` using `user_id`, `session_date`, `session_type`, `duration_minutes`, `status`

### Ordering
- Actual sessions: `session_date ASC`
- Templates: `day_of_week ASC`, `session_order ASC`

---

## Flow 3: Saving Training Logs

### FE Component → FE Service
- `TrainingLogComponent` → `TrainingDataService.createTrainingSession()`
- Offline: `OfflineQueueService` → `/.netlify/functions/training-sessions` (log-mode)

### Request Shape (Training Log Mode)
```
{
  session_date: "YYYY-MM-DD",
  session_type: "string",
  duration_minutes: number,
  rpe: number | null,
  notes?: string | null,
  status?: "completed"
}
```

### Response Shape (Netlify)
```
{
  success: true,
  data: {
    session: { ...training_sessions row },
    workoutLogSynced: boolean,
    note?: string
  },
  message?: string
}
```

### DB Tables
- `training_sessions`
- `workout_logs`
- `load_monitoring` (read for ACWR, not written here)

### Notes
- FE calculates `training_load = rpe × duration` and updates ACWR in `AcwrService`.
- BE log-mode creates a `workout_logs` entry for ACWR persistence.

---

## Flow 4: Exercise Library

### FE Component → FE Service
- `ExerciseLibraryComponent` → `ExerciseDBService`

### BE Endpoints (Netlify)
- `GET /api/exercisedb` → curated list
- `GET /api/exercisedb/filters` → filter options
- `GET /api/exercisedb/search` → external ExerciseDB search (auth required)
- `POST /api/exercisedb/import` → import (coach/admin)
- `POST /api/exercisedb/approve/:id` → approve (coach/admin)

### Response Shape (Curated)
```
{
  success: true,
  exercises: ExerciseDBExercise[],
  count: number
}
```

### DB Tables
- `exercisedb_exercises`
- `exercisedb_import_logs`
- `ff_exercise_mappings`

### Defaults
- `limit`: 50
- `offset`: 0
- Ordering: `flag_football_relevance DESC`

---

## Flow 5: Video Playback

### FE Components → FE Services
- `VideoFeedComponent`, `VideoSuggestionComponent`, `YouTubePlayerComponent`
- `TrainingVideoDatabaseService`, `InstagramVideoService`

### Access Path
- **FE-only** curated datasets + embed URLs
- No active BE endpoint found for playback data in FE flows

### DB Tables (Present but not wired)
- `training_videos`
- `video_clips`

---

## Calculation Integrity Audit

### Calculation Inventory

| Calculation | FE Location | BE Location | Notes |
|------------|-------------|-------------|-------|
| ACWR (EWMA) | `acwr.service.ts` | `daily-training.cjs` | **Aligned** |
| Training Load | `training-log.component.ts` | `training-complete.cjs` | **Aligned** |
| Training Stats | `training-data.service.ts` (90-day) | `training.routes.js` (90-day) | **Aligned** |
| Readiness Score | `unified-training.service.ts` | `readiness.routes.js` (indirect) | FE-only formula |

### FE ACWR Definition (Canonical)
- EWMA with λ = 2/(N+1) for acute (7d) and chronic (28d)
- Minimum chronic load floor: 100
- Data quality checks for sparse data
- Risk zones: `<0.8`, `0.8-1.3`, `1.3-1.5`, `>1.5`

### BE Daily-Training ACWR (Aligned)
- EWMA formula matches FE (acute 7d, chronic 28d)
- Uses `workout_logs` (RPE × duration) as source data
- Applies FE thresholds and minimum data requirements

### Rounding/Precision
- FE uses shared precision utils (`precision.utils.ts`) with configured rounding
- BE uses integer load values when RPE is integer; otherwise minimal rounding only

---

## Canonical Sources of Truth

| Area | Canonical Source | Rationale |
|------|------------------|-----------|
| Training logs | FE + DB | FE writes to DB; DB is system of record |
| Training sessions list | DB | RLS + direct Supabase reads |
| ACWR | FE `AcwrService` | Only full EWMA + data-quality implementation |
| Schedule templates | DB | `training_session_templates` via Supabase |
| Exercise library | BE + DB | Netlify function enforces auth + filters |
| Video playback | FE | Currently FE-only curated sources |

---

## Contract Tests

Contract tests live in `tests/contracts/`:

- `api-response-shapes.contract.test.js`
  - Training sessions columns + enums
  - Workout logs columns + date formats
  - Training session templates columns (schedule view)
  - Exercise library columns + enums
- `acwr-calculation.contract.test.js`
  - ACWR EWMA formulas and risk zones

Run:
```
export SUPABASE_URL="..."
export SUPABASE_SERVICE_KEY="..."
npm run test:contracts
```

---

*Document generated by Contract Audit Tool v2.0*

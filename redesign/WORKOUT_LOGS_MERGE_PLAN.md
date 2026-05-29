# Execution Plan — `workout_logs` → `training_sessions` merge (consent-security-sensitive)

**Status:** ready to execute deliberately (NOT yet done). The audit proved it's safe in principle — `workout_logs` is a redundant shadow of `training_sessions` completions; the canonical ACWR (`calc-readiness`) reads load **only** from `training_sessions`, so there is **no double-count risk**. The sensitivity is the **consent boundary**: `v_workout_logs_consent` is the only approved coach path to player performance.

## Why it's gated
A new `v_training_sessions_consent` view must gate the same performance columns by `can_view_player_performance(auth.uid(), user_id)`. A mistake here leaks `rpe`/`load_au`/`duration` to coaches **without consent**. Mirror the existing audited view exactly — don't invent gating.

## Step order (single coordinated change; drops last)
1. **Create `v_training_sessions_consent`** — exact mirror of `v_workout_logs_consent`, over `training_sessions`, gating by `user_id` (training_sessions' key) instead of `player_id`. Gate the same columns: `completed_at`/`rpe`/`duration_minutes`/`intensity_level`/`load_au`/`notes`. Reuse `can_view_player_performance` unchanged. SQL sketch:
   ```sql
   create view public.v_training_sessions_consent with (security_invoker = true) as
   select id, user_id,
     session_type, source, session_date,
     case when can_view_player_performance((select auth.uid()), user_id) then rpe else null end as rpe,
     case when can_view_player_performance((select auth.uid()), user_id) then duration_minutes else null end as duration_minutes,
     case when can_view_player_performance((select auth.uid()), user_id) then intensity_level else null end as intensity_level,
     case when can_view_player_performance((select auth.uid()), user_id) then load_au else null end as load_au,
     case when can_view_player_performance((select auth.uid()), user_id) then notes else null end as notes,
     created_at, updated_at,
     not can_view_player_performance((select auth.uid()), user_id) as consent_blocked,
     case when user_id = (select auth.uid()) then 'own_data'
          when can_view_player_performance((select auth.uid()), user_id) then 'team_consent'
          else 'no_consent' end as access_reason
   from public.training_sessions;
   ```
   Verify column-level gating with an automated check (coach without consent → NULLs) before proceeding.
2. **Backfill** any `workout_logs` rows not represented in `training_sessions` (match on `source_session_id` = `training_sessions.id`, else insert a completed row). Pre-launch this is ~0 rows — confirm count first.
3. **Repoint consent reader** — `consent-data-reader.js`: `readWorkoutLogs` → query `v_training_sessions_consent`; update the resource→view map (`workout_logs: "v_workout_logs_consent"` → training_sessions equivalent); `privacy-settings.service.ts:839` → new view. Keep the "FORBIDDEN: direct queries" policy intact.
4. **Repoint readers** — `daily-training.js:190`, `training-complete.js:204` (dedupe → check `training_sessions` by `source_session_id`/date), `workout-data.service.ts:31`, `training-safety-data.service.ts:60/86` → `training_sessions` (player_id→user_id, completed_at→session_date/completion ts, columns map 1:1).
5. **Repoint realtime** — `acwr.service.ts:1103`, `load-monitoring.service.ts:277` subscriptions `workout_logs` → `training_sessions`.
6. **Stop write shadows** — `training-sessions.js:431`, `training-complete.js:227`, `workout-data.service.ts:61`, `training-data.service.ts:437`: remove the `workout_logs` insert (the `training_sessions` row is already written/updated in the same flow). For `workout-data.service.createWorkoutLog` (direct insert with no session), write `training_sessions` (status completed) instead.
7. **Drop** `v_workout_logs_consent`, then `workout_logs` (verify 0 remaining refs + no other view/FK deps).

## Verification
- Consent check: coach **with** consent sees rpe/load; coach **without** consent sees NULLs + `consent_blocked=true`; athlete sees own data. (Mirror the v_workout_logs_consent test.)
- ACWR unchanged: `calc-readiness` already reads `training_sessions` — confirm a logged session still produces identical ACWR.
- `node --check` + `tsc` clean; per-function validation tests pass.

## Reference (existing audited view to mirror)
`v_workout_logs_consent` gates: completed_at, rpe, duration_minutes, intensity_level, load_au, notes — by `can_view_player_performance(auth.uid(), player_id)`; exposes `consent_blocked` + `access_reason` ('own_data'/'team_consent'/'no_consent').

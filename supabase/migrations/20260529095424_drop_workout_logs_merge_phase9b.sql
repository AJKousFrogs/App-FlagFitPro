-- Backend de-drift Phase 9b: complete the workout_logs → training_sessions merge.
-- workout_logs was a redundant shadow of training_sessions completions (0 rows, no FK deps).
-- All LIVE netlify code repointed to training_sessions / v_training_sessions_consent:
--   - consent-data-reader: both readWorkoutLogs paths query training_sessions (player_id:user_id
--     alias preserves shape; completed-only filter); CONSENT_VIEWS/PROTECTED lists cleaned.
--   - daily-training: ACWR history read → training_sessions.
--   - training-complete syncWorkoutLog + training-sessions create: shadow writes removed
--     (completion already persisted to training_sessions, the canonical ACWR source).
-- Dormant Angular readers/writers (UI deleted) repoint with the supabase-types regen task.
DROP VIEW IF EXISTS public.v_workout_logs_consent;
DROP TABLE IF EXISTS public.workout_logs;

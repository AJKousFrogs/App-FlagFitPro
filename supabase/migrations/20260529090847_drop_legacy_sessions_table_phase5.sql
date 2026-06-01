-- Backend de-drift Phase 5 (partial): drop the legacy `sessions` table.
-- Never written (GPS/open-data import that was never wired); read only by the two
-- legacy analytics paths training-metrics.js (fetchLegacyMetrics — already returns
-- {data:[], error}) and trends.js (both reads now guarded to treat 42P01 as empty).
-- Canonical session table is training_sessions. No FK or view dependents.
-- DEFERRED: merging workout_logs into training_sessions and re-homing the training-load
-- write currently in wellness_logs (live write paths — own focused phase).
DROP TABLE IF EXISTS public.sessions;

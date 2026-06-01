-- Backend de-drift Phase 7: drop legacy wellness_logs.
-- It was dual-purpose drift: daily-protocol wrote training_load/duration/rpe to it
-- (DEAD — the same completion is already logged to training_sessions, the canonical
-- ACWR load source), and sleep-data/smart-training read wellness fields from it
-- (now repointed to the canonical daily_wellness_checkin). No remaining .from() refs,
-- no FK or view dependents.
DROP TABLE IF EXISTS public.wellness_logs;

-- Backend de-drift Phase 3: finish wellness consolidation.
-- daily_wellness_checkin is canonical (all writers/readers repointed earlier).
-- wellness_entries (2 test rows) + wellness_data (empty, varchar key, legacy column names)
-- have no remaining .from() queries and no FK dependents.
-- wellness_logs is intentionally KEPT — still dual-purpose (daily-protocol writes
-- training-load to it); it is re-homed + dropped in the sessions/load phase.
DROP TABLE IF EXISTS public.wellness_entries;
DROP TABLE IF EXISTS public.wellness_data;

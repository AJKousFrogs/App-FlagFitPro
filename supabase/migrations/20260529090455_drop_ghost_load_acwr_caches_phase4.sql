-- Backend de-drift Phase 4: drop never-written derived ACWR/load cache tables.
-- ACWR/load is computed on-read from training_sessions via netlify/functions/utils/acwr.js.
-- All live readers handle a missing table gracefully; dormant Angular readers repoint to
-- /api/compute-acwr at screen rebuild. No FK or view dependents on these six.
-- NOTE: load_monitoring is deferred — a consent view (v_load_monitoring_consent) + the
-- consent resource→view map depend on it; handled in a focused consent-view step.
DROP TABLE IF EXISTS public.load_daily;
DROP TABLE IF EXISTS public.training_load_metrics;
DROP TABLE IF EXISTS public.acwr_calculations;
DROP TABLE IF EXISTS public.acwr_history;
DROP TABLE IF EXISTS public.acwr_reports;
DROP TABLE IF EXISTS public.load_caps;

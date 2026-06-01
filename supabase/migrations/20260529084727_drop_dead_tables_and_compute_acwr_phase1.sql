-- Backend de-drift Phase 1: drop verified-dead tables (0 code refs, no FK dependents)
-- + the superseded compute_acwr stored procedure (no callers; replaced by utils/acwr.js EWMA).
-- Reversible: definitions preserved in git history (database/migrations).
DROP TABLE IF EXISTS public.session_rpe_data;
DROP TABLE IF EXISTS public.training_stress_balance;
DROP TABLE IF EXISTS public.load_metrics;
DROP TABLE IF EXISTS public.exercise_logs;
DROP TABLE IF EXISTS public.exercise_library;
DROP TABLE IF EXISTS public.supplements_data;
DROP FUNCTION IF EXISTS public.compute_acwr(uuid);

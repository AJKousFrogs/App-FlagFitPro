-- Backend de-drift — Phase 1: drop verified-dead tables + superseded ACWR proc.
--
-- All six tables had ZERO code references (verified by grep across netlify/functions
-- + angular/src) and NO foreign-key dependents. The compute_acwr() stored procedure
-- had no callers and used a coupled rolling average — superseded by the canonical
-- EWMA + uncoupled implementation in netlify/functions/utils/acwr.js.
--
-- Applied via Supabase MCP on 2026-05-29 (project grfjmnjpzvknmsxrwesx). Recorded here
-- for repo/git parity. Governance: docs/DATA_MODEL.md.
--
-- NOTE: tables flagged "dead" by an automated audit but found to STILL have references
-- were NOT dropped: user_preferences (3 refs), exercisedb_exercises (1 ref).

DROP TABLE IF EXISTS public.session_rpe_data;        -- orphaned 35-col RPE detail, 0 refs
DROP TABLE IF EXISTS public.training_stress_balance; -- CTL/ATL/TSB cache, never written/read
DROP TABLE IF EXISTS public.load_metrics;            -- dead ACWR cache, 0 refs
DROP TABLE IF EXISTS public.exercise_logs;           -- orphaned per-exercise log, 0 refs
DROP TABLE IF EXISTS public.exercise_library;        -- dead versioned exercise table, 0 refs
DROP TABLE IF EXISTS public.supplements_data;        -- duplicate of supplement_logs, 0 refs
DROP FUNCTION IF EXISTS public.compute_acwr(uuid);   -- superseded by utils/acwr.js (EWMA)

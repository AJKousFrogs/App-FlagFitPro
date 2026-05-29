-- Backend de-drift — Phase 11: fix stored functions broken by the table drops + harden.
--
-- The earlier table drops (Phases 1–10) left several PL/pgSQL functions referencing
-- now-dropped tables in their BODIES (not caught by code/FK/view/trigger checks). The
-- ones called by live code were broken until fixed here. Full corrected function bodies
-- were applied via Supabase MCP (migrations fix_upsert_wellness_checkin_*,
-- fix_complete_training_session_*, fix_log_training_session_*_phase11); summary:
--   - upsert_wellness_checkin: removed the dual-write to dropped wellness_entries
--     (kept daily_wellness_checkin; legacy_entry_id now NULL). [was breaking wellness check-in]
--   - complete_training_session: removed the workout_logs shadow block (training_sessions
--     update kept; workout_log_id now NULL). [was breaking session completion]
--   - log_training_session: removed the workout_logs insert (training_sessions insert kept;
--     workout_log_id now NULL). [was breaking the data-import endpoints]
-- Verified: process_hard_deletion guards its wellness_logs delete with to_regclass(...) IS
-- NOT NULL → safe. No other functions reference dropped tables (string/comment matches only).
--
-- Drop the superseded old SQL ACWR pipeline (referenced dropped tables; replaced by
-- netlify/functions/utils/acwr.js EWMA; only caller was dormant Angular wellness.service):
DROP FUNCTION IF EXISTS public.calculate_acwr(uuid);
DROP FUNCTION IF EXISTS public.calculate_acwr_safe(uuid, date);
DROP FUNCTION IF EXISTS public.calculate_acute_load(uuid, date);
DROP FUNCTION IF EXISTS public.calculate_chronic_load(uuid, date);
DROP FUNCTION IF EXISTS public.calculate_daily_load(uuid, date);
DROP FUNCTION IF EXISTS public.update_load_monitoring();

-- Security advisor: pin search_path on the remaining mutable-search_path functions.
ALTER FUNCTION public.calculate_workout_load_au() SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_injury_risk_level(numeric) SET search_path = pg_catalog, public;
ALTER FUNCTION public.normalize_exercisedb_contract_fields() SET search_path = pg_catalog, public;
ALTER FUNCTION public.sync_daily_wellness_motivation() SET search_path = pg_catalog, public;

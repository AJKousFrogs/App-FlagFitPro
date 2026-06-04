-- User explicitly approved (AskUserQuestion: "Yes, drop all 4").
-- DB dead-object audit finding: these 4 are RETURNS-trigger functions attached to ZERO
-- triggers (verified pg_trigger), referenced by no other function/view and no application
-- code (grep across netlify/functions, angular/src, tests). A trigger function with no
-- trigger can never execute -- dead code. Notes:
--   audit_team_activity_changes / update_team_activity_updated_at -> target tables
--     (team_activity_audit, team_activities) that DO NOT EXIST.
--   prevent_timestamp_modification -> overlaps the wired prevent_coach_locked_modification.
--   calculate_workout_load_au -> uses superseded session_id/source_session_id compat fields.
-- Applied via Supabase MCP (schema_migrations version 20260604113312); mirrored here.
DROP FUNCTION IF EXISTS public.audit_team_activity_changes();
DROP FUNCTION IF EXISTS public.calculate_workout_load_au();
DROP FUNCTION IF EXISTS public.prevent_timestamp_modification();
DROP FUNCTION IF EXISTS public.update_team_activity_updated_at();

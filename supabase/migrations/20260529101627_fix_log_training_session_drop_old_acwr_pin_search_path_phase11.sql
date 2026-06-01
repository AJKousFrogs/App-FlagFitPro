-- Phase 11: regression fixes + security hardening for stored functions.

-- (a) log_training_session inserted training_sessions (canonical) AND the dropped
-- workout_logs, breaking the import endpoints. Remove the workout_logs insert.
CREATE OR REPLACE FUNCTION public.log_training_session(p_user_id uuid, p_session_date date, p_session_type text, p_duration_minutes integer, p_intensity_level integer DEFAULT NULL::integer, p_rpe numeric DEFAULT NULL::numeric, p_workload numeric DEFAULT NULL::numeric, p_notes text DEFAULT NULL::text, p_team_id uuid DEFAULT NULL::uuid, p_status text DEFAULT 'completed'::text)
 RETURNS TABLE(session_id uuid, workout_log_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_session_id uuid;
  v_completed_at timestamptz := now();
  v_workload numeric := COALESCE(
    p_workload,
    CASE
      WHEN p_rpe IS NOT NULL THEN round(p_rpe * p_duration_minutes)
      WHEN p_intensity_level IS NOT NULL THEN round((p_intensity_level::numeric * p_duration_minutes) / 10.0)
      ELSE NULL
    END
  );
  v_status text := COALESCE(NULLIF(btrim(p_status), ''), 'completed');
BEGIN
  IF auth.role() NOT IN ('authenticated', 'service_role') THEN
    RAISE EXCEPTION 'Not authorized to log training sessions';
  END IF;
  IF auth.role() = 'authenticated' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Authenticated users may only log their own training sessions';
  END IF;

  PERFORM public.ensure_public_user_profile(p_user_id);

  INSERT INTO public.training_sessions (
    user_id, athlete_id, team_id, session_date, session_type, duration_minutes,
    intensity_level, rpe, workload, notes, status, session_state, completed_at, updated_at
  )
  VALUES (
    p_user_id, p_user_id, p_team_id, COALESCE(p_session_date, CURRENT_DATE), p_session_type,
    p_duration_minutes, p_intensity_level, p_rpe, v_workload, p_notes, v_status,
    CASE WHEN lower(v_status) = 'completed' THEN 'COMPLETED' ELSE 'VISIBLE' END,
    CASE WHEN lower(v_status) = 'completed' THEN v_completed_at ELSE NULL END,
    now()
  )
  RETURNING id INTO v_session_id;

  -- workout_logs merged into training_sessions; no shadow write.
  RETURN QUERY SELECT v_session_id, NULL::uuid;
END;
$function$;

-- (b) Drop the superseded old SQL ACWR pipeline (references dropped tables; replaced by
-- netlify/functions/utils/acwr.js EWMA; only caller was dormant Angular wellness.service).
DROP FUNCTION IF EXISTS public.calculate_acwr(uuid);
DROP FUNCTION IF EXISTS public.calculate_acwr_safe(uuid, date);
DROP FUNCTION IF EXISTS public.calculate_acute_load(uuid, date);
DROP FUNCTION IF EXISTS public.calculate_chronic_load(uuid, date);
DROP FUNCTION IF EXISTS public.calculate_daily_load(uuid, date);
DROP FUNCTION IF EXISTS public.update_load_monitoring();

-- (c) Pin search_path on the remaining active functions (advisor: mutable search_path).
ALTER FUNCTION public.calculate_workout_load_au() SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_injury_risk_level(numeric) SET search_path = pg_catalog, public;
ALTER FUNCTION public.normalize_exercisedb_contract_fields() SET search_path = pg_catalog, public;
ALTER FUNCTION public.sync_daily_wellness_motivation() SET search_path = pg_catalog, public;

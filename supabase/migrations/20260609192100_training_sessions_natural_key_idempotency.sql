-- Enforce §5b idempotency at the DB layer: one training_sessions row per
-- (user_id, session_date, session_type). The API's select-then-insert was
-- racy and the log_training_session RPC plain-INSERTed — duplicates inflate
-- ACWR because workload is summed per day. Verified 0 duplicates before
-- adding the constraint.
-- Applied live via Supabase MCP 2026-06-09 (version 20260609192100).

ALTER TABLE public.training_sessions
  ADD CONSTRAINT training_sessions_user_date_type_key
  UNIQUE (user_id, session_date, session_type);

-- Make the RPC idempotent on the natural key. Non-destructive on resubmit:
-- a NULL parameter never overwrites a previously saved value (COALESCE).
CREATE OR REPLACE FUNCTION public.log_training_session(
  p_user_id uuid,
  p_session_date date,
  p_session_type text,
  p_duration_minutes integer,
  p_intensity_level integer DEFAULT NULL::integer,
  p_rpe numeric DEFAULT NULL::numeric,
  p_workload numeric DEFAULT NULL::numeric,
  p_notes text DEFAULT NULL::text,
  p_team_id uuid DEFAULT NULL::uuid,
  p_status text DEFAULT 'completed'::text
)
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
    user_id, team_id, session_date, session_type, duration_minutes,
    intensity_level, rpe, workload, notes, status, session_state, completed_at, updated_at
  )
  VALUES (
    p_user_id, p_team_id, COALESCE(p_session_date, CURRENT_DATE), p_session_type,
    p_duration_minutes, p_intensity_level, p_rpe, v_workload, p_notes, v_status,
    CASE WHEN lower(v_status) = 'completed' THEN 'COMPLETED' ELSE 'VISIBLE' END,
    CASE WHEN lower(v_status) = 'completed' THEN v_completed_at ELSE NULL END,
    now()
  )
  ON CONFLICT (user_id, session_date, session_type)
  DO UPDATE SET
    duration_minutes = COALESCE(EXCLUDED.duration_minutes, training_sessions.duration_minutes),
    intensity_level = COALESCE(EXCLUDED.intensity_level, training_sessions.intensity_level),
    rpe = COALESCE(EXCLUDED.rpe, training_sessions.rpe),
    workload = COALESCE(EXCLUDED.workload, training_sessions.workload),
    notes = COALESCE(EXCLUDED.notes, training_sessions.notes),
    status = EXCLUDED.status,
    session_state = EXCLUDED.session_state,
    completed_at = COALESCE(EXCLUDED.completed_at, training_sessions.completed_at),
    team_id = COALESCE(EXCLUDED.team_id, training_sessions.team_id),
    updated_at = now()
  RETURNING id INTO v_session_id;

  -- workout_logs merged into training_sessions; no shadow write.
  RETURN QUERY SELECT v_session_id, NULL::uuid;
END;
$function$;

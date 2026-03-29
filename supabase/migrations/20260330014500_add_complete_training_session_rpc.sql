-- ============================================================================
-- Canonical RPC for completing an existing training session
-- ============================================================================

CREATE OR REPLACE FUNCTION public.complete_training_session(
  p_user_id uuid,
  p_session_id uuid,
  p_duration_minutes integer DEFAULT NULL,
  p_intensity_level integer DEFAULT NULL,
  p_rpe integer DEFAULT NULL,
  p_workload numeric DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS TABLE (
  session_id uuid,
  workout_log_id uuid,
  workload numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_session public.training_sessions%ROWTYPE;
  v_workout_log_id uuid;
  v_duration integer;
  v_intensity integer;
  v_rpe integer;
  v_workload numeric;
  v_completed_at timestamptz := now();
BEGIN
  IF auth.role() NOT IN ('authenticated', 'service_role') THEN
    RAISE EXCEPTION 'Not authorized to complete training sessions';
  END IF;

  SELECT *
  INTO v_session
  FROM public.training_sessions ts
  WHERE ts.id = p_session_id
    AND ts.user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Training session not found or access denied';
  END IF;

  IF auth.role() = 'authenticated' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Authenticated users may only complete their own training sessions';
  END IF;

  v_duration := COALESCE(p_duration_minutes, v_session.duration_minutes);
  v_intensity := COALESCE(p_intensity_level, v_session.intensity_level);
  v_rpe := COALESCE(p_rpe, v_session.rpe);
  v_workload := COALESCE(
    p_workload,
    CASE
      WHEN v_rpe IS NOT NULL AND v_duration IS NOT NULL THEN round(v_rpe::numeric * v_duration)
      WHEN v_intensity IS NOT NULL AND v_duration IS NOT NULL THEN round((v_intensity::numeric * v_duration) / 10.0)
      ELSE NULL
    END
  );

  IF v_workload IS NULL THEN
    RAISE EXCEPTION 'Unable to compute workload. Provide workload, or provide duration with rpe/intensity.';
  END IF;

  UPDATE public.training_sessions
  SET
    status = 'completed',
    session_state = 'COMPLETED',
    completed_at = v_completed_at,
    updated_at = now(),
    duration_minutes = v_duration,
    intensity_level = v_intensity,
    rpe = v_rpe,
    workload = v_workload,
    notes = CASE
      WHEN p_notes IS NULL OR btrim(p_notes) = '' THEN v_session.notes
      WHEN COALESCE(v_session.notes, '') = '' THEN p_notes
      ELSE v_session.notes || E'\n\nCompleted: ' || p_notes
    END
  WHERE id = p_session_id;

  SELECT wl.id
  INTO v_workout_log_id
  FROM public.workout_logs wl
  WHERE wl.player_id = p_user_id
    AND wl.source_session_id = p_session_id
  LIMIT 1;

  IF v_workout_log_id IS NULL THEN
    INSERT INTO public.workout_logs (
      player_id,
      source_session_id,
      workout_type,
      planned_date,
      completed_at,
      rpe,
      duration_minutes,
      intensity_level,
      created_at,
      updated_at
    )
    VALUES (
      p_user_id,
      p_session_id,
      COALESCE(v_session.session_type, 'scheduled'),
      COALESCE(v_session.session_date, CURRENT_DATE),
      v_completed_at,
      v_rpe,
      v_duration,
      v_intensity,
      now(),
      now()
    )
    RETURNING id INTO v_workout_log_id;
  ELSE
    UPDATE public.workout_logs
    SET
      completed_at = COALESCE(public.workout_logs.completed_at, v_completed_at),
      rpe = COALESCE(v_rpe, public.workout_logs.rpe),
      duration_minutes = COALESCE(v_duration, public.workout_logs.duration_minutes),
      intensity_level = COALESCE(v_intensity, public.workout_logs.intensity_level),
      updated_at = now()
    WHERE id = v_workout_log_id;
  END IF;

  RETURN QUERY
  SELECT p_session_id, v_workout_log_id, v_workload;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_training_session(uuid, uuid, integer, integer, integer, numeric, text) TO authenticated, service_role;

COMMENT ON FUNCTION public.complete_training_session(uuid, uuid, integer, integer, integer, numeric, text)
IS 'Canonical training completion RPC. Completes an existing training_sessions row and syncs workout_logs transactionally.';

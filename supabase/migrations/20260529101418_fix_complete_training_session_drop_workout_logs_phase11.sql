-- Phase 11 regression fix: complete_training_session shadowed the dropped workout_logs
-- table after updating training_sessions (the canonical record), breaking completion.
-- Remove the workout_logs block; keep the training_sessions update. Return signature
-- preserved (workout_log_id now always NULL).
CREATE OR REPLACE FUNCTION public.complete_training_session(p_user_id uuid, p_session_id uuid, p_duration_minutes integer DEFAULT NULL::integer, p_intensity_level integer DEFAULT NULL::integer, p_rpe integer DEFAULT NULL::integer, p_workload numeric DEFAULT NULL::numeric, p_notes text DEFAULT NULL::text)
 RETURNS TABLE(session_id uuid, workout_log_id uuid, workload numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_session public.training_sessions%ROWTYPE;
  v_duration integer;
  v_intensity integer;
  v_rpe integer;
  v_workload numeric;
  v_completed_at timestamptz := now();
BEGIN
  IF auth.role() NOT IN ('authenticated', 'service_role') THEN
    RAISE EXCEPTION 'Not authorized to complete training sessions';
  END IF;

  SELECT * INTO v_session
  FROM public.training_sessions ts
  WHERE ts.id = p_session_id AND ts.user_id = p_user_id
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

  -- workout_logs merged into training_sessions; no shadow write.
  RETURN QUERY SELECT p_session_id, NULL::uuid, v_workload;
END;
$function$;

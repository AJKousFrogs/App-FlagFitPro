-- ============================================================================
-- Add canonical RPCs for wellness and training write paths
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ensure_public_user_profile(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    full_name,
    name,
    email_verified,
    is_active,
    onboarding_completed,
    last_login,
    updated_at
  )
  SELECT
    au.id,
    au.email,
    NULL,
    COALESCE(NULLIF(split_part(COALESCE(au.raw_user_meta_data ->> 'full_name', au.email, 'User Account'), ' ', 1), ''), 'User'),
    NULLIF(
      btrim(
        substring(COALESCE(au.raw_user_meta_data ->> 'full_name', au.email, 'User Account')
        FROM length(split_part(COALESCE(au.raw_user_meta_data ->> 'full_name', au.email, 'User Account'), ' ', 1)) + 1)
      ),
      ''
    ),
    COALESCE(au.raw_user_meta_data ->> 'full_name', au.email, 'User Account'),
    COALESCE(au.raw_user_meta_data ->> 'full_name', au.email, 'User Account'),
    au.email_confirmed_at IS NOT NULL,
    true,
    false,
    au.last_sign_in_at,
    now()
  FROM auth.users au
  WHERE au.id = p_user_id
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_wellness_checkin(
  p_user_id uuid,
  p_checkin_date date,
  p_sleep_quality integer DEFAULT NULL,
  p_sleep_hours numeric DEFAULT NULL,
  p_energy_level integer DEFAULT NULL,
  p_muscle_soreness integer DEFAULT NULL,
  p_stress_level integer DEFAULT NULL,
  p_soreness_areas text[] DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_calculated_readiness numeric DEFAULT NULL,
  p_motivation_level integer DEFAULT NULL,
  p_mood integer DEFAULT NULL,
  p_hydration_level integer DEFAULT NULL
)
RETURNS TABLE (
  checkin_id uuid,
  legacy_entry_id uuid,
  checkin_date date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_checkin_id uuid;
  v_legacy_entry_id uuid;
  v_checkin_date date := COALESCE(p_checkin_date, CURRENT_DATE);
BEGIN
  IF auth.role() NOT IN ('authenticated', 'service_role') THEN
    RAISE EXCEPTION 'Not authorized to write wellness checkins';
  END IF;

  IF auth.role() = 'authenticated' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Authenticated users may only write their own wellness checkins';
  END IF;

  PERFORM public.ensure_public_user_profile(p_user_id);

  INSERT INTO public.daily_wellness_checkin (
    user_id,
    checkin_date,
    sleep_quality,
    sleep_hours,
    energy_level,
    muscle_soreness,
    stress_level,
    soreness_areas,
    notes,
    calculated_readiness,
    motivation_level,
    mood,
    hydration_level,
    updated_at
  )
  VALUES (
    p_user_id,
    v_checkin_date,
    p_sleep_quality,
    p_sleep_hours,
    p_energy_level,
    p_muscle_soreness,
    p_stress_level,
    COALESCE(p_soreness_areas, ARRAY[]::text[]),
    p_notes,
    p_calculated_readiness,
    p_motivation_level,
    p_mood,
    p_hydration_level,
    now()
  )
  ON CONFLICT (user_id, checkin_date)
  DO UPDATE SET
    sleep_quality = COALESCE(EXCLUDED.sleep_quality, public.daily_wellness_checkin.sleep_quality),
    sleep_hours = COALESCE(EXCLUDED.sleep_hours, public.daily_wellness_checkin.sleep_hours),
    energy_level = COALESCE(EXCLUDED.energy_level, public.daily_wellness_checkin.energy_level),
    muscle_soreness = COALESCE(EXCLUDED.muscle_soreness, public.daily_wellness_checkin.muscle_soreness),
    stress_level = COALESCE(EXCLUDED.stress_level, public.daily_wellness_checkin.stress_level),
    soreness_areas = COALESCE(EXCLUDED.soreness_areas, public.daily_wellness_checkin.soreness_areas),
    notes = COALESCE(EXCLUDED.notes, public.daily_wellness_checkin.notes),
    calculated_readiness = COALESCE(EXCLUDED.calculated_readiness, public.daily_wellness_checkin.calculated_readiness),
    motivation_level = COALESCE(EXCLUDED.motivation_level, public.daily_wellness_checkin.motivation_level),
    mood = COALESCE(EXCLUDED.mood, public.daily_wellness_checkin.mood),
    hydration_level = COALESCE(EXCLUDED.hydration_level, public.daily_wellness_checkin.hydration_level),
    updated_at = now()
  RETURNING id INTO v_checkin_id;

  INSERT INTO public.wellness_entries (
    athlete_id,
    date,
    sleep_quality,
    energy_level,
    stress_level,
    muscle_soreness,
    motivation_level,
    mood,
    hydration_level,
    notes,
    updated_at
  )
  VALUES (
    p_user_id,
    v_checkin_date,
    p_sleep_quality,
    p_energy_level,
    p_stress_level,
    p_muscle_soreness,
    p_motivation_level,
    p_mood,
    p_hydration_level,
    p_notes,
    now()
  )
  ON CONFLICT (athlete_id, date)
  DO UPDATE SET
    sleep_quality = COALESCE(EXCLUDED.sleep_quality, public.wellness_entries.sleep_quality),
    energy_level = COALESCE(EXCLUDED.energy_level, public.wellness_entries.energy_level),
    stress_level = COALESCE(EXCLUDED.stress_level, public.wellness_entries.stress_level),
    muscle_soreness = COALESCE(EXCLUDED.muscle_soreness, public.wellness_entries.muscle_soreness),
    motivation_level = COALESCE(EXCLUDED.motivation_level, public.wellness_entries.motivation_level),
    mood = COALESCE(EXCLUDED.mood, public.wellness_entries.mood),
    hydration_level = COALESCE(EXCLUDED.hydration_level, public.wellness_entries.hydration_level),
    notes = COALESCE(EXCLUDED.notes, public.wellness_entries.notes),
    updated_at = now()
  RETURNING id INTO v_legacy_entry_id;

  RETURN QUERY
  SELECT v_checkin_id, v_legacy_entry_id, v_checkin_date;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_training_session(
  p_user_id uuid,
  p_session_date date,
  p_session_type text,
  p_duration_minutes integer,
  p_intensity_level integer DEFAULT NULL,
  p_rpe numeric DEFAULT NULL,
  p_workload numeric DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_team_id uuid DEFAULT NULL,
  p_status text DEFAULT 'completed'
)
RETURNS TABLE (
  session_id uuid,
  workout_log_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_session_id uuid;
  v_workout_log_id uuid;
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
    user_id,
    athlete_id,
    team_id,
    session_date,
    session_type,
    duration_minutes,
    intensity_level,
    rpe,
    workload,
    notes,
    status,
    session_state,
    completed_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_user_id,
    p_team_id,
    COALESCE(p_session_date, CURRENT_DATE),
    p_session_type,
    p_duration_minutes,
    p_intensity_level,
    p_rpe,
    v_workload,
    p_notes,
    v_status,
    CASE WHEN lower(v_status) = 'completed' THEN 'COMPLETED' ELSE 'VISIBLE' END,
    CASE WHEN lower(v_status) = 'completed' THEN v_completed_at ELSE NULL END,
    now()
  )
  RETURNING id INTO v_session_id;

  INSERT INTO public.workout_logs (
    player_id,
    workout_type,
    duration_minutes,
    intensity_level,
    completed_at,
    source_session_id,
    planned_date,
    rpe,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_session_type,
    p_duration_minutes,
    p_intensity_level,
    CASE WHEN lower(v_status) = 'completed' THEN v_completed_at ELSE NULL END,
    v_session_id,
    COALESCE(p_session_date, CURRENT_DATE),
    p_rpe,
    now(),
    now()
  )
  RETURNING id INTO v_workout_log_id;

  RETURN QUERY
  SELECT v_session_id, v_workout_log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_public_user_profile(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_wellness_checkin(uuid, date, integer, numeric, integer, integer, integer, text[], text, numeric, integer, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_training_session(uuid, date, text, integer, integer, numeric, numeric, text, uuid, text) TO authenticated, service_role;

COMMENT ON FUNCTION public.upsert_wellness_checkin(uuid, date, integer, numeric, integer, integer, integer, text[], text, numeric, integer, integer, integer)
IS 'Canonical wellness write RPC. Upserts daily_wellness_checkin and wellness_entries in one transaction.';

COMMENT ON FUNCTION public.log_training_session(uuid, date, text, integer, integer, numeric, numeric, text, uuid, text)
IS 'Canonical training write RPC. Inserts training_sessions and workout_logs in one transaction.';

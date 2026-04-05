-- ============================================================================
-- Fix ambiguous "checkin_date" in upsert_wellness_checkin
-- ============================================================================
-- RETURNS TABLE output names become PL/pgSQL variables and collide with
-- daily_wellness_checkin.checkin_date in INSERT/ON CONFLICT (PostgreSQL 42702).
-- Rename the output column only; RPC positional args unchanged.
--
-- PostgreSQL cannot change OUT/RETURNS TABLE shape with CREATE OR REPLACE alone;
-- drop the exact signature first.
-- ============================================================================

DROP FUNCTION IF EXISTS public.upsert_wellness_checkin(
  uuid,
  date,
  integer,
  numeric,
  integer,
  integer,
  integer,
  text[],
  text,
  numeric,
  integer,
  integer,
  integer
);

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
  saved_checkin_date date
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

COMMENT ON FUNCTION public.upsert_wellness_checkin(uuid, date, integer, numeric, integer, integer, integer, text[], text, numeric, integer, integer, integer)
  IS 'Atomic wellness check-in (daily_wellness_checkin + wellness_entries). Returns saved_checkin_date to avoid PL/pgSQL name collision with table columns.';

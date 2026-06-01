-- Phase 11 regression fix: upsert_wellness_checkin dual-wrote the dropped wellness_entries
-- table, breaking every wellness check-in. Remove the legacy write; keep daily_wellness_checkin
-- (canonical). Return signature preserved (legacy_entry_id now always NULL).
CREATE OR REPLACE FUNCTION public.upsert_wellness_checkin(p_user_id uuid, p_checkin_date date, p_sleep_quality integer DEFAULT NULL::integer, p_sleep_hours numeric DEFAULT NULL::numeric, p_energy_level integer DEFAULT NULL::integer, p_muscle_soreness integer DEFAULT NULL::integer, p_stress_level integer DEFAULT NULL::integer, p_soreness_areas text[] DEFAULT NULL::text[], p_notes text DEFAULT NULL::text, p_calculated_readiness numeric DEFAULT NULL::numeric, p_motivation_level integer DEFAULT NULL::integer, p_mood integer DEFAULT NULL::integer, p_hydration_level integer DEFAULT NULL::integer)
 RETURNS TABLE(checkin_id uuid, legacy_entry_id uuid, saved_checkin_date date)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_checkin_id uuid;
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
    user_id, checkin_date, sleep_quality, sleep_hours, energy_level, muscle_soreness,
    stress_level, soreness_areas, notes, calculated_readiness, motivation_level, mood,
    hydration_level, updated_at
  )
  VALUES (
    p_user_id, v_checkin_date, p_sleep_quality, p_sleep_hours, p_energy_level, p_muscle_soreness,
    p_stress_level, COALESCE(p_soreness_areas, ARRAY[]::text[]), p_notes, p_calculated_readiness,
    p_motivation_level, p_mood, p_hydration_level, now()
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

  RETURN QUERY SELECT v_checkin_id, NULL::uuid, v_checkin_date;
END;
$function$;

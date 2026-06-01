-- Cluster 3: collapse readiness_scores' triple-drift to canonical user_id / day / score.

-- 1) backfill canonical cols from legacy (idempotent)
UPDATE public.readiness_scores
SET user_id = COALESCE(user_id, athlete_id),
    day     = COALESCE(day, date),
    score   = COALESCE(score, readiness_score);

-- 2) drop the compat trigger + function (the drift machine)
DROP TRIGGER IF EXISTS sync_readiness_scores_compat ON public.readiness_scores;
DROP FUNCTION IF EXISTS public.sync_readiness_scores_compat();

-- 3) recreate the SELECT policy on user_id (it depends on athlete_id; DROP COLUMN needs it gone first)
DROP POLICY IF EXISTS merged_select_readiness_scores_public ON public.readiness_scores;
CREATE POLICY merged_select_readiness_scores_public ON public.readiness_scores
  FOR SELECT TO public
  USING (
    (user_id = auth.uid())
    OR (EXISTS (SELECT 1 FROM public.coach_athlete_assignments caa
                WHERE caa.coach_id = auth.uid() AND caa.user_id = readiness_scores.user_id))
    OR (EXISTS (SELECT 1 FROM public.team_members tm
                WHERE tm.user_id = auth.uid() AND (tm.status)::text = 'active'
                  AND (tm.role)::text = ANY (ARRAY['physiotherapist','medical_staff','admin','owner']::text[])))
  );

-- 4) drop legacy duplicate + dead columns
ALTER TABLE public.readiness_scores
  DROP COLUMN athlete_id,
  DROP COLUMN date,
  DROP COLUMN readiness_score,
  DROP COLUMN fatigue_score,
  DROP COLUMN stress_score,
  DROP COLUMN overall_readiness;

-- 5) enforce canonical identity + FULL unique(user_id, day) for upsert onConflict
ALTER TABLE public.readiness_scores ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.readiness_scores ALTER COLUMN day SET NOT NULL;
DROP INDEX IF EXISTS public.idx_readiness_scores_user_day;
ALTER TABLE public.readiness_scores ADD CONSTRAINT readiness_scores_user_day_key UNIQUE (user_id, day);

-- 6) rewrite get_athlete_readiness to canonical columns
CREATE OR REPLACE FUNCTION public.get_athlete_readiness(p_user_id uuid, p_date date)
 RETURNS TABLE(has_checkin boolean, readiness_score numeric, sleep_quality integer, energy_level integer, muscle_soreness integer, stress_level integer, soreness_areas text[])
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_checkin public.daily_wellness_checkin%ROWTYPE;
  v_readiness public.readiness_scores%ROWTYPE;
BEGIN
  SELECT * INTO v_checkin FROM public.daily_wellness_checkin
  WHERE user_id = p_user_id AND checkin_date = p_date
  ORDER BY created_at DESC LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT true, coalesce(v_checkin.calculated_readiness, NULL),
      v_checkin.sleep_quality, v_checkin.energy_level, v_checkin.muscle_soreness,
      v_checkin.stress_level, coalesce(v_checkin.soreness_areas, ARRAY[]::text[]);
    RETURN;
  END IF;

  SELECT * INTO v_readiness FROM public.readiness_scores
  WHERE user_id = p_user_id AND day = p_date
  ORDER BY created_at DESC NULLS LAST LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT true, v_readiness.score,
      NULL::integer, NULL::integer, NULL::integer, NULL::integer, ARRAY[]::text[];
    RETURN;
  END IF;

  RETURN QUERY SELECT false, NULL::numeric,
    NULL::integer, NULL::integer, NULL::integer, NULL::integer, ARRAY[]::text[];
END;
$function$;

-- Audit fix: safety-override.js called detect_pain_trigger / detect_acwr_trigger, which
-- never existed → pain/ACWR safety-override logging silently no-op'd. Create them: when a
-- threshold is crossed, log a safety_override_log row disclosing the flagged data to the
-- athlete's team medical/coaching staff, with a 24h dedup guard. Return the override id (NULL
-- if no trigger). Called via service role (safety-override.js) → anon EXECUTE revoked.

CREATE OR REPLACE FUNCTION public.detect_pain_trigger(
  p_athlete_id uuid, p_pain_score numeric, p_pain_location text DEFAULT NULL, p_pain_trend text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_override_id uuid;
  v_trigger_type text;
  v_roles text[] := ARRAY['physiotherapist','medical_staff','head_coach'];
  v_user_ids uuid[];
BEGIN
  IF p_pain_score IS NULL OR p_pain_score <= 3 THEN RETURN NULL; END IF;
  IF EXISTS (SELECT 1 FROM public.safety_override_log
             WHERE user_id = p_athlete_id AND trigger_type LIKE '%pain%'
               AND override_timestamp > now() - interval '24 hours') THEN
    RETURN NULL;  -- already flagged recently
  END IF;
  v_trigger_type := CASE WHEN p_pain_trend = 'worsening' THEN 'worsening_pain'
                         WHEN p_pain_trend = 'new' THEN 'new_pain_area'
                         ELSE 'pain_above_3' END;
  SELECT COALESCE(array_agg(DISTINCT tm.user_id), ARRAY[]::uuid[]) INTO v_user_ids
  FROM public.team_members tm
  WHERE tm.team_id IN (SELECT team_id FROM public.team_members WHERE user_id = p_athlete_id AND status::text = 'active')
    AND tm.status::text = 'active' AND tm.role::text = ANY(v_roles);
  INSERT INTO public.safety_override_log
    (user_id, trigger_type, trigger_value, data_disclosed, disclosed_to_roles, disclosed_to_user_ids, override_timestamp, athlete_notified)
  VALUES (p_athlete_id, v_trigger_type,
          jsonb_build_object('pain_score', p_pain_score, 'location', p_pain_location, 'trend', p_pain_trend),
          jsonb_build_object('reason', 'recent_pain_report', 'pain_score', p_pain_score),
          v_roles, v_user_ids, now(), false)
  RETURNING override_id INTO v_override_id;
  RETURN v_override_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.detect_acwr_trigger(p_athlete_id uuid)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_acwr numeric;
  v_override_id uuid;
  v_roles text[] := ARRAY['head_coach','coach','physiotherapist'];
  v_user_ids uuid[];
BEGIN
  SELECT acwr INTO v_acwr FROM public.readiness_scores
  WHERE user_id = p_athlete_id AND acwr IS NOT NULL
  ORDER BY day DESC LIMIT 1;
  IF v_acwr IS NULL OR (v_acwr >= 0.8 AND v_acwr <= 1.5) THEN RETURN NULL; END IF;
  IF EXISTS (SELECT 1 FROM public.safety_override_log
             WHERE user_id = p_athlete_id AND trigger_type = 'acwr_danger_zone'
               AND override_timestamp > now() - interval '24 hours') THEN
    RETURN NULL;
  END IF;
  SELECT COALESCE(array_agg(DISTINCT tm.user_id), ARRAY[]::uuid[]) INTO v_user_ids
  FROM public.team_members tm
  WHERE tm.team_id IN (SELECT team_id FROM public.team_members WHERE user_id = p_athlete_id AND status::text = 'active')
    AND tm.status::text = 'active' AND tm.role::text = ANY(v_roles);
  INSERT INTO public.safety_override_log
    (user_id, trigger_type, trigger_value, data_disclosed, disclosed_to_roles, disclosed_to_user_ids, override_timestamp, athlete_notified)
  VALUES (p_athlete_id, 'acwr_danger_zone',
          jsonb_build_object('acwr', v_acwr),
          jsonb_build_object('reason', 'acwr_danger_zone', 'acwr', v_acwr),
          v_roles, v_user_ids, now(), false)
  RETURNING override_id INTO v_override_id;
  RETURN v_override_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.detect_pain_trigger(uuid,numeric,text,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.detect_acwr_trigger(uuid) FROM anon;

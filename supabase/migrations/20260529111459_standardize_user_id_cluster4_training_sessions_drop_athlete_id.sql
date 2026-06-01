-- Cluster 4: drop the training_sessions.athlete_id duplicate (user_id is canonical).

-- 1) defensive backfill (log_training_session wrote both; ensure user_id always set)
UPDATE public.training_sessions SET user_id = COALESCE(user_id, athlete_id) WHERE user_id IS NULL;

-- 2) the consent view passed athlete_id through; recreate it without that column
--    (CREATE OR REPLACE can't drop a column → DROP + CREATE; re-grant SELECT; keep security_invoker)
DROP VIEW IF EXISTS public.v_training_sessions_consent;
CREATE VIEW public.v_training_sessions_consent
WITH (security_invoker = true) AS
SELECT id,
    user_id,
    team_id,
    session_date,
    session_type,
    drill_type,
    status,
    session_state,
    title,
    location,
    CASE WHEN can_view_player_performance((SELECT auth.uid()), user_id) THEN completed_at ELSE NULL::timestamptz END AS completed_at,
    CASE WHEN can_view_player_performance((SELECT auth.uid()), user_id) THEN rpe ELSE NULL::integer END AS rpe,
    CASE WHEN can_view_player_performance((SELECT auth.uid()), user_id) THEN duration_minutes ELSE NULL::integer END AS duration_minutes,
    CASE WHEN can_view_player_performance((SELECT auth.uid()), user_id) THEN intensity_level ELSE NULL::integer END AS intensity_level,
    CASE WHEN can_view_player_performance((SELECT auth.uid()), user_id) THEN workload ELSE NULL::numeric END AS workload,
    CASE WHEN can_view_player_performance((SELECT auth.uid()), user_id) THEN performance_score ELSE NULL::numeric END AS performance_score,
    CASE WHEN can_view_player_performance((SELECT auth.uid()), user_id) THEN completion_rate ELSE NULL::numeric END AS completion_rate,
    CASE WHEN can_view_player_performance((SELECT auth.uid()), user_id) THEN notes ELSE NULL::text END AS notes,
    created_at,
    updated_at,
    NOT can_view_player_performance((SELECT auth.uid()), user_id) AS consent_blocked,
    CASE
        WHEN user_id = (SELECT auth.uid()) THEN 'own_data'::text
        WHEN can_view_player_performance((SELECT auth.uid()), user_id) THEN 'team_consent'::text
        ELSE 'no_consent'::text
    END AS access_reason
FROM public.training_sessions;

GRANT SELECT ON public.v_training_sessions_consent TO anon, authenticated, service_role;

-- 3) drop the duplicate column
ALTER TABLE public.training_sessions DROP COLUMN athlete_id;

-- 4) log_training_session wrote both user_id + athlete_id; drop the athlete_id write
CREATE OR REPLACE FUNCTION public.log_training_session(p_user_id uuid, p_session_date date, p_session_type text, p_duration_minutes integer, p_intensity_level integer DEFAULT NULL::integer, p_rpe numeric DEFAULT NULL::numeric, p_workload numeric DEFAULT NULL::numeric, p_notes text DEFAULT NULL::text, p_team_id uuid DEFAULT NULL::uuid, p_status text DEFAULT 'completed'::text)
 RETURNS TABLE(session_id uuid, workout_log_id uuid)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'auth'
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
  RETURNING id INTO v_session_id;

  -- workout_logs merged into training_sessions; no shadow write.
  RETURN QUERY SELECT v_session_id, NULL::uuid;
END;
$function$;

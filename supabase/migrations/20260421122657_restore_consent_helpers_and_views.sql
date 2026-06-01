-- Restore consent helper functions and consent-aware views.
-- This replaces simplified compatibility views with privacy-first logic while
-- retaining the canonical/legacy columns needed by the frontend contract.

CREATE OR REPLACE FUNCTION public.check_performance_sharing(
  p_player_id uuid,
  p_team_id uuid
) RETURNS boolean AS $$
DECLARE
  v_sharing_enabled boolean;
  v_default_sharing boolean;
BEGIN
  SELECT performance_sharing_enabled
  INTO v_sharing_enabled
  FROM public.team_sharing_settings
  WHERE user_id = p_player_id
    AND team_id = p_team_id;

  IF FOUND THEN
    RETURN COALESCE(v_sharing_enabled, false);
  END IF;

  SELECT performance_sharing_default
  INTO v_default_sharing
  FROM public.privacy_settings
  WHERE user_id = p_player_id;

  RETURN COALESCE(v_default_sharing, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_health_sharing(
  p_player_id uuid,
  p_team_id uuid
) RETURNS boolean AS $$
DECLARE
  v_sharing_enabled boolean;
  v_default_sharing boolean;
BEGIN
  SELECT health_sharing_enabled
  INTO v_sharing_enabled
  FROM public.team_sharing_settings
  WHERE user_id = p_player_id
    AND team_id = p_team_id;

  IF FOUND THEN
    RETURN COALESCE(v_sharing_enabled, false);
  END IF;

  SELECT health_sharing_default
  INTO v_default_sharing
  FROM public.privacy_settings
  WHERE user_id = p_player_id;

  RETURN COALESCE(v_default_sharing, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_ai_processing_enabled(
  p_user_id uuid
) RETURNS boolean AS $$
DECLARE
  v_ai_enabled boolean;
BEGIN
  SELECT ai_processing_enabled
  INTO v_ai_enabled
  FROM public.privacy_settings
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_ai_enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_metric_category_allowed(
  p_player_id uuid,
  p_team_id uuid,
  p_category text
) RETURNS boolean AS $$
DECLARE
  v_allowed_categories text[];
BEGIN
  SELECT allowed_metric_categories
  INTO v_allowed_categories
  FROM public.team_sharing_settings
  WHERE user_id = p_player_id
    AND team_id = p_team_id;

  IF v_allowed_categories IS NULL OR array_length(v_allowed_categories, 1) IS NULL THEN
    RETURN false;
  END IF;

  RETURN p_category = ANY(v_allowed_categories);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_coached_teams()
RETURNS SETOF uuid AS $$
BEGIN
  RETURN QUERY
  SELECT tm.team_id
  FROM public.team_members tm
  WHERE tm.user_id = (SELECT auth.uid())
    AND tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
    AND tm.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

CREATE OR REPLACE FUNCTION public.require_ai_consent(
  p_user_id uuid
) RETURNS boolean AS $$
BEGIN
  IF NOT public.check_ai_processing_enabled(p_user_id) THEN
    RAISE EXCEPTION 'AI_CONSENT_REQUIRED: User % has not enabled AI processing.', p_user_id
      USING ERRCODE = 'P0001';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_ai_consent_status(
  p_user_id uuid
) RETURNS TABLE(
  ai_enabled boolean,
  consent_date timestamptz,
  can_process boolean,
  reason text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(ps.ai_processing_enabled, false) AS ai_enabled,
    ps.ai_processing_consent_date AS consent_date,
    COALESCE(ps.ai_processing_enabled, false) AS can_process,
    CASE
      WHEN ps.ai_processing_enabled = true THEN 'AI processing enabled by user consent'
      WHEN ps.ai_processing_enabled = false THEN 'AI processing disabled by user preference'
      WHEN ps.user_id IS NULL THEN 'No privacy settings configured - AI processing disabled by default'
      ELSE 'AI processing status unknown'
    END AS reason
  FROM (SELECT p_user_id AS uid) seed
  LEFT JOIN public.privacy_settings ps ON ps.user_id = seed.uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_view_player_performance(
  p_viewer_id uuid,
  p_player_id uuid
) RETURNS boolean AS $$
BEGIN
  IF p_viewer_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_viewer_id = p_player_id THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.team_members coach_tm
    JOIN public.team_members player_tm ON player_tm.team_id = coach_tm.team_id
    WHERE coach_tm.user_id = p_viewer_id
      AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
      AND coach_tm.status = 'active'
      AND player_tm.user_id = p_player_id
      AND player_tm.status = 'active'
      AND public.check_performance_sharing(p_player_id, coach_tm.team_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_view_player_health(
  p_viewer_id uuid,
  p_player_id uuid
) RETURNS boolean AS $$
BEGIN
  IF p_viewer_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_viewer_id = p_player_id THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.team_members coach_tm
    JOIN public.team_members player_tm ON player_tm.team_id = coach_tm.team_id
    WHERE coach_tm.user_id = p_viewer_id
      AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
      AND coach_tm.status = 'active'
      AND player_tm.user_id = p_player_id
      AND player_tm.status = 'active'
      AND public.check_health_sharing(p_player_id, coach_tm.team_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

DROP POLICY IF EXISTS "Users can view own load monitoring" ON public.load_monitoring;
DROP POLICY IF EXISTS "Coaches can view team load monitoring with consent" ON public.load_monitoring;
CREATE POLICY "Users can view own load monitoring"
  ON public.load_monitoring
  FOR SELECT
  TO authenticated
  USING (player_id = (SELECT auth.uid()));

CREATE POLICY "Coaches can view team load monitoring with consent"
  ON public.load_monitoring
  FOR SELECT
  TO authenticated
  USING (public.can_view_player_performance((SELECT auth.uid()), player_id));

DROP POLICY IF EXISTS "Users can view own workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Coaches can view team workout logs with consent" ON public.workout_logs;
CREATE POLICY "Users can view own workout logs"
  ON public.workout_logs
  FOR SELECT
  TO authenticated
  USING (player_id = (SELECT auth.uid()));

CREATE POLICY "Coaches can view team workout logs with consent"
  ON public.workout_logs
  FOR SELECT
  TO authenticated
  USING (public.can_view_player_performance((SELECT auth.uid()), player_id));

DROP VIEW IF EXISTS public.v_load_monitoring_consent;
CREATE VIEW public.v_load_monitoring_consent
WITH (security_invoker = true)
AS
SELECT
  lm.id,
  lm.workout_log_id,
  lm.player_id,
  COALESCE(lm.date, lm.monitoring_date) AS date,
  COALESCE(lm.monitoring_date, lm.date) AS monitoring_date,
  CASE
    WHEN public.can_view_player_performance((SELECT auth.uid()), lm.player_id) THEN lm.daily_load
    ELSE NULL
  END AS daily_load,
  CASE
    WHEN public.can_view_player_performance((SELECT auth.uid()), lm.player_id) THEN lm.acute_load
    ELSE NULL
  END AS acute_load,
  CASE
    WHEN public.can_view_player_performance((SELECT auth.uid()), lm.player_id) THEN lm.chronic_load
    ELSE NULL
  END AS chronic_load,
  CASE
    WHEN public.can_view_player_performance((SELECT auth.uid()), lm.player_id) THEN lm.acwr
    ELSE NULL
  END AS acwr,
  CASE
    WHEN public.can_view_player_health((SELECT auth.uid()), lm.player_id) THEN COALESCE(lm.risk_level, lm.injury_risk_level)
    ELSE NULL
  END AS risk_level,
  CASE
    WHEN public.can_view_player_health((SELECT auth.uid()), lm.player_id) THEN COALESCE(lm.injury_risk_level, lm.risk_level)
    ELSE NULL
  END AS injury_risk_level,
  CASE
    WHEN public.can_view_player_performance((SELECT auth.uid()), lm.player_id) THEN lm.baseline_days
    ELSE NULL
  END AS baseline_days,
  lm.calculated_at,
  lm.created_at,
  lm.updated_at,
  NOT public.can_view_player_performance((SELECT auth.uid()), lm.player_id) AS consent_blocked,
  CASE
    WHEN lm.player_id = (SELECT auth.uid()) THEN 'own_data'
    WHEN public.can_view_player_performance((SELECT auth.uid()), lm.player_id) THEN 'team_consent'
    ELSE 'no_consent'
  END AS access_reason
FROM public.load_monitoring lm;

DROP VIEW IF EXISTS public.v_workout_logs_consent;
CREATE VIEW public.v_workout_logs_consent
WITH (security_invoker = true)
AS
SELECT
  wl.id,
  wl.player_id,
  wl.session_id,
  wl.source_session_id,
  wl.workout_type,
  wl.session_type,
  CASE
    WHEN public.can_view_player_performance((SELECT auth.uid()), wl.player_id) THEN wl.completed_at
    ELSE NULL
  END AS completed_at,
  wl.planned_date,
  CASE
    WHEN public.can_view_player_performance((SELECT auth.uid()), wl.player_id) THEN wl.rpe
    ELSE NULL
  END AS rpe,
  CASE
    WHEN public.can_view_player_performance((SELECT auth.uid()), wl.player_id) THEN wl.duration_minutes
    ELSE NULL
  END AS duration_minutes,
  CASE
    WHEN public.can_view_player_performance((SELECT auth.uid()), wl.player_id) THEN wl.intensity_level
    ELSE NULL
  END AS intensity_level,
  CASE
    WHEN public.can_view_player_performance((SELECT auth.uid()), wl.player_id) THEN wl.load_au
    ELSE NULL
  END AS load_au,
  CASE
    WHEN public.can_view_player_performance((SELECT auth.uid()), wl.player_id) THEN wl.notes
    ELSE NULL
  END AS notes,
  wl.created_at,
  wl.updated_at,
  NOT public.can_view_player_performance((SELECT auth.uid()), wl.player_id) AS consent_blocked,
  CASE
    WHEN wl.player_id = (SELECT auth.uid()) THEN 'own_data'
    WHEN public.can_view_player_performance((SELECT auth.uid()), wl.player_id) THEN 'team_consent'
    ELSE 'no_consent'
  END AS access_reason
FROM public.workout_logs wl;

GRANT SELECT ON public.v_load_monitoring_consent TO authenticated;
GRANT SELECT ON public.v_workout_logs_consent TO authenticated;

GRANT EXECUTE ON FUNCTION public.check_performance_sharing(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_health_sharing(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_ai_processing_enabled(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_metric_category_allowed(uuid, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_coached_teams() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.require_ai_consent(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_ai_consent_status(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_view_player_performance(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_view_player_health(uuid, uuid) TO authenticated, service_role;

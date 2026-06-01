-- Netlify / Supabase compatibility hardening follow-up
-- Purpose: close remaining security advisor findings introduced by the
-- compatibility bridge while preserving the current application behavior.

-- ============================================================================
-- ENABLE RLS ON COMPATIBILITY TABLES
-- ============================================================================

ALTER TABLE IF EXISTS public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.community_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.community_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.player_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.player_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.player_training_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.learned_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qb_throwing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.account_pause_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.season_archives ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- MINIMAL POLICIES FOR DIRECT CLIENT READS
-- ============================================================================

DROP POLICY IF EXISTS achievement_definitions_authenticated_select
  ON public.achievement_definitions;
CREATE POLICY achievement_definitions_authenticated_select
  ON public.achievement_definitions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS player_achievements_own_select
  ON public.player_achievements;
CREATE POLICY player_achievements_own_select
  ON public.player_achievements
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS athlete_achievements_own_select
  ON public.athlete_achievements;
CREATE POLICY athlete_achievements_own_select
  ON public.athlete_achievements
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = athlete_id);

DROP POLICY IF EXISTS player_streaks_own_select
  ON public.player_streaks;
CREATE POLICY player_streaks_own_select
  ON public.player_streaks
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS player_training_stats_own_select
  ON public.player_training_stats;
CREATE POLICY player_training_stats_own_select
  ON public.player_training_stats
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS learned_user_preferences_own_select
  ON public.learned_user_preferences;
CREATE POLICY learned_user_preferences_own_select
  ON public.learned_user_preferences
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS qb_throwing_sessions_own_select
  ON public.qb_throwing_sessions;
CREATE POLICY qb_throwing_sessions_own_select
  ON public.qb_throwing_sessions
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS account_pause_requests_own_select
  ON public.account_pause_requests;
CREATE POLICY account_pause_requests_own_select
  ON public.account_pause_requests
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS trending_topics_authenticated_select
  ON public.trending_topics;
CREATE POLICY trending_topics_authenticated_select
  ON public.trending_topics
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================================
-- VIEW / FUNCTION HARDENING
-- ============================================================================

ALTER VIEW IF EXISTS public.user_achievements
  SET (security_invoker = true);

CREATE OR REPLACE FUNCTION public.update_tournament_day_plans_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

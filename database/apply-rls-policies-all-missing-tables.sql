-- ============================================================================
-- Apply RLS Policies for All Missing Tables
-- Run this script in your Supabase SQL Editor to fix linter errors
-- ============================================================================
--
-- This script addresses RLS disabled errors for 62+ tables:
--   - Game stats tables (passing_stats, receiving_stats, flag_pull_stats, etc.)
--   - Search/index tables (article_search_index, knowledge_search_index)
--   - User-specific tables (user_settings, user_security, etc.)
--   - Training tables (training_programs, exercises, training_videos, etc.)
--   - Load management tables (load_daily, load_metrics, load_monitoring)
--   - Audit/log tables (knowledge_base_governance_log, roster_audit_log, etc.)
--   - Financial tables (player_payments, sponsor_contributions, etc.)
--   - And many more...
--
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable Row Level Security on all tables
-- ============================================================================

-- Game stats tables
ALTER TABLE IF EXISTS public.receiving_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.passing_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.flag_pull_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.situational_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.opponent_analysis ENABLE ROW LEVEL SECURITY;

-- Search/index tables
ALTER TABLE IF EXISTS public.article_search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.knowledge_search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.knowledge_base_governance_log ENABLE ROW LEVEL SECURITY;

-- Fixtures and games
ALTER TABLE IF EXISTS public.fixtures ENABLE ROW LEVEL SECURITY;

-- Program and training tables
ALTER TABLE IF EXISTS public.program_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.training_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.training_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.training_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exercise_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exercise_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plyometrics_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.isometrics_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exercisedb_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ff_exercise_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exercisedb_import_logs ENABLE ROW LEVEL SECURITY;

-- Load management tables
ALTER TABLE IF EXISTS public.load_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.load_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.load_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.load_caps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recovery_blocks ENABLE ROW LEVEL SECURITY;

-- Analytics and metrics
ALTER TABLE IF EXISTS public.analytics_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.position_specific_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.metric_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.metric_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coach_analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ml_training_data ENABLE ROW LEVEL SECURITY;

-- Player and program tables
ALTER TABLE IF EXISTS public.player_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.player_tournament_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.player_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.athlete_daily_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.athlete_achievements ENABLE ROW LEVEL SECURITY;

-- Staff and roles
ALTER TABLE IF EXISTS public.staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.superadmins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.positions ENABLE ROW LEVEL SECURITY;

-- Financial tables
ALTER TABLE IF EXISTS public.tournament_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sponsor_contributions ENABLE ROW LEVEL SECURITY;

-- Audit and log tables
ALTER TABLE IF EXISTS public.roster_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.decision_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.decision_review_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.consent_access_log ENABLE ROW LEVEL SECURITY;

-- User settings and preferences
ALTER TABLE IF EXISTS public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- AI and feedback tables
ALTER TABLE IF EXISTS public.ai_response_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.approval_requests ENABLE ROW LEVEL SECURITY;

-- Wellness and health
ALTER TABLE IF EXISTS public.daily_wellness_checkin ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.injuries ENABLE ROW LEVEL SECURITY;

-- Coach and team management
ALTER TABLE IF EXISTS public.coach_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ownership_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shared_insights ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create Helper Functions (if they don't exist)
-- ============================================================================

-- Helper function for UUID user_id columns
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    auth.uid(),
    (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid
  );
$$ LANGUAGE SQL STABLE;

-- Helper function for VARCHAR user_id columns
CREATE OR REPLACE FUNCTION auth.user_id_text()
RETURNS TEXT AS $$
  SELECT COALESCE(
    auth.uid()::text,
    current_setting('request.jwt.claims', true)::jsonb->>'sub'
  );
$$ LANGUAGE SQL STABLE;

-- Helper function to check if user is team member
CREATE OR REPLACE FUNCTION auth.is_team_member(team_id_param UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team_id_param
    AND user_id = auth.user_id()
    AND status = 'active'
    AND deleted_at IS NULL
  );
$$ LANGUAGE SQL STABLE;

-- Helper function to check if user is team coach/admin
CREATE OR REPLACE FUNCTION auth.is_team_coach(team_id_param UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team_id_param
    AND user_id = auth.user_id()
    AND role_team IN ('coach', 'admin')
    AND status = 'active'
    AND deleted_at IS NULL
  );
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- STEP 3: Create RLS Policies for Game Stats Tables
-- ============================================================================
-- These tables are team-scoped: team members can view, coaches can manage

-- receiving_stats
DROP POLICY IF EXISTS "Team members can view receiving stats" ON public.receiving_stats;
DROP POLICY IF EXISTS "Coaches can manage receiving stats" ON public.receiving_stats;

CREATE POLICY "Team members can view receiving stats"
ON public.receiving_stats FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    JOIN public.team_members tm ON (
      g.team_id = tm.team_id OR
      g.home_team_id = tm.team_id OR
      g.away_team_id = tm.team_id
    )
    WHERE g.game_id = receiving_stats.game_id::text
    AND tm.user_id = auth.user_id()
    AND tm.status = 'active'
  )
);

CREATE POLICY "Coaches can manage receiving stats"
ON public.receiving_stats FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    JOIN public.team_members tm ON (
      g.team_id = tm.team_id OR
      g.home_team_id = tm.team_id OR
      g.away_team_id = tm.team_id
    )
    WHERE g.game_id = receiving_stats.game_id::text
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.games g
    JOIN public.team_members tm ON (
      g.team_id = tm.team_id OR
      g.home_team_id = tm.team_id OR
      g.away_team_id = tm.team_id
    )
    WHERE g.game_id = receiving_stats.game_id::text
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
);

-- passing_stats
DROP POLICY IF EXISTS "Team members can view passing stats" ON public.passing_stats;
DROP POLICY IF EXISTS "Coaches can manage passing stats" ON public.passing_stats;

CREATE POLICY "Team members can view passing stats"
ON public.passing_stats FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    JOIN public.team_members tm ON (
      g.team_id = tm.team_id OR
      g.home_team_id = tm.team_id OR
      g.away_team_id = tm.team_id
    )
    WHERE g.game_id = passing_stats.game_id::text
    AND tm.user_id = auth.user_id()
    AND tm.status = 'active'
  )
);

CREATE POLICY "Coaches can manage passing stats"
ON public.passing_stats FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    JOIN public.team_members tm ON (
      g.team_id = tm.team_id OR
      g.home_team_id = tm.team_id OR
      g.away_team_id = tm.team_id
    )
    WHERE g.game_id = passing_stats.game_id::text
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.games g
    JOIN public.team_members tm ON (
      g.team_id = tm.team_id OR
      g.home_team_id = tm.team_id OR
      g.away_team_id = tm.team_id
    )
    WHERE g.game_id = passing_stats.game_id::text
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
);

-- flag_pull_stats
DROP POLICY IF EXISTS "Team members can view flag pull stats" ON public.flag_pull_stats;
DROP POLICY IF EXISTS "Coaches can manage flag pull stats" ON public.flag_pull_stats;

CREATE POLICY "Team members can view flag pull stats"
ON public.flag_pull_stats FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    JOIN public.team_members tm ON (
      g.team_id = tm.team_id OR
      g.home_team_id = tm.team_id OR
      g.away_team_id = tm.team_id
    )
    WHERE g.game_id = flag_pull_stats.game_id::text
    AND tm.user_id = auth.user_id()
    AND tm.status = 'active'
  )
);

CREATE POLICY "Coaches can manage flag pull stats"
ON public.flag_pull_stats FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    JOIN public.team_members tm ON (
      g.team_id = tm.team_id OR
      g.home_team_id = tm.team_id OR
      g.away_team_id = tm.team_id
    )
    WHERE g.game_id = flag_pull_stats.game_id::text
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.games g
    JOIN public.team_members tm ON (
      g.team_id = tm.team_id OR
      g.home_team_id = tm.team_id OR
      g.away_team_id = tm.team_id
    )
    WHERE g.game_id = flag_pull_stats.game_id::text
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
);

-- situational_stats
DROP POLICY IF EXISTS "Team members can view situational stats" ON public.situational_stats;
DROP POLICY IF EXISTS "Coaches can manage situational stats" ON public.situational_stats;

CREATE POLICY "Team members can view situational stats"
ON public.situational_stats FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    JOIN public.team_members tm ON (
      g.team_id = tm.team_id OR
      g.home_team_id = tm.team_id OR
      g.away_team_id = tm.team_id
    )
    WHERE g.game_id = situational_stats.game_id::text
    AND tm.user_id = auth.user_id()
    AND tm.status = 'active'
  )
);

CREATE POLICY "Coaches can manage situational stats"
ON public.situational_stats FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    JOIN public.team_members tm ON (
      g.team_id = tm.team_id OR
      g.home_team_id = tm.team_id OR
      g.away_team_id = tm.team_id
    )
    WHERE g.game_id = situational_stats.game_id::text
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.games g
    JOIN public.team_members tm ON (
      g.team_id = tm.team_id OR
      g.home_team_id = tm.team_id OR
      g.away_team_id = tm.team_id
    )
    WHERE g.game_id = situational_stats.game_id::text
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
);

-- opponent_analysis
DROP POLICY IF EXISTS "Team members can view opponent analysis" ON public.opponent_analysis;
DROP POLICY IF EXISTS "Coaches can manage opponent analysis" ON public.opponent_analysis;

CREATE POLICY "Team members can view opponent analysis"
ON public.opponent_analysis FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = opponent_analysis.team_id
    AND tm.user_id = auth.user_id()
    AND tm.status = 'active'
  )
);

CREATE POLICY "Coaches can manage opponent analysis"
ON public.opponent_analysis FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = opponent_analysis.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = opponent_analysis.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
);

-- ============================================================================
-- STEP 4: Create RLS Policies for Search/Index Tables
-- ============================================================================
-- These are typically read-only for authenticated users, write for system

-- article_search_index
DROP POLICY IF EXISTS "Authenticated users can read article search index" ON public.article_search_index;
DROP POLICY IF EXISTS "System can manage article search index" ON public.article_search_index;

CREATE POLICY "Authenticated users can read article search index"
ON public.article_search_index FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can manage article search index"
ON public.article_search_index FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- knowledge_search_index
DROP POLICY IF EXISTS "Authenticated users can read knowledge search index" ON public.knowledge_search_index;
DROP POLICY IF EXISTS "System can manage knowledge search index" ON public.knowledge_search_index;

CREATE POLICY "Authenticated users can read knowledge search index"
ON public.knowledge_search_index FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can manage knowledge search index"
ON public.knowledge_search_index FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- knowledge_base_governance_log
DROP POLICY IF EXISTS "Admins can view governance log" ON public.knowledge_base_governance_log;
DROP POLICY IF EXISTS "System can manage governance log" ON public.knowledge_base_governance_log;

CREATE POLICY "Admins can view governance log"
ON public.knowledge_base_governance_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team IN ('admin', 'coach')
    AND tm.status = 'active'
  )
);

CREATE POLICY "System can manage governance log"
ON public.knowledge_base_governance_log FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STEP 5: Create RLS Policies for Fixtures
-- ============================================================================

DROP POLICY IF EXISTS "Team members can view fixtures" ON public.fixtures;
DROP POLICY IF EXISTS "Coaches can manage fixtures" ON public.fixtures;

CREATE POLICY "Team members can view fixtures"
ON public.fixtures FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE (
      tm.team_id = fixtures.home_team_id OR
      tm.team_id = fixtures.away_team_id
    )
    AND tm.user_id = auth.user_id()
    AND tm.status = 'active'
  )
);

CREATE POLICY "Coaches can manage fixtures"
ON public.fixtures FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE (
      tm.team_id = fixtures.home_team_id OR
      tm.team_id = fixtures.away_team_id
    )
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE (
      tm.team_id = fixtures.home_team_id OR
      tm.team_id = fixtures.away_team_id
    )
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
);

-- ============================================================================
-- STEP 6: Create RLS Policies for Training Tables
-- ============================================================================

-- training_programs
DROP POLICY IF EXISTS "Team members can view training programs" ON public.training_programs;
DROP POLICY IF EXISTS "Coaches can manage training programs" ON public.training_programs;

CREATE POLICY "Team members can view training programs"
ON public.training_programs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = training_programs.team_id
    AND tm.user_id = auth.user_id()
    AND tm.status = 'active'
  )
);

CREATE POLICY "Coaches can manage training programs"
ON public.training_programs FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = training_programs.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = training_programs.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
);

-- training_phases
DROP POLICY IF EXISTS "Team members can view training phases" ON public.training_phases;
DROP POLICY IF EXISTS "Coaches can manage training phases" ON public.training_phases;

CREATE POLICY "Team members can view training phases"
ON public.training_phases FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.training_programs tp
    JOIN public.team_members tm ON tp.team_id = tm.team_id
    WHERE tp.id = training_phases.program_id
    AND tm.user_id = auth.user_id()
    AND tm.status = 'active'
  )
);

CREATE POLICY "Coaches can manage training phases"
ON public.training_phases FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.training_programs tp
    JOIN public.team_members tm ON tp.team_id = tm.team_id
    WHERE tp.id = training_phases.program_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.training_programs tp
    JOIN public.team_members tm ON tp.team_id = tm.team_id
    WHERE tp.id = training_phases.program_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
);

-- training_weeks
DROP POLICY IF EXISTS "Team members can view training weeks" ON public.training_weeks;
DROP POLICY IF EXISTS "Coaches can manage training weeks" ON public.training_weeks;

CREATE POLICY "Team members can view training weeks"
ON public.training_weeks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.training_phases tph
    JOIN public.training_programs tp ON tph.program_id = tp.id
    JOIN public.team_members tm ON tp.team_id = tm.team_id
    WHERE tph.id = training_weeks.phase_id
    AND tm.user_id = auth.user_id()
    AND tm.status = 'active'
  )
);

CREATE POLICY "Coaches can manage training weeks"
ON public.training_weeks FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.training_phases tph
    JOIN public.training_programs tp ON tph.program_id = tp.id
    JOIN public.team_members tm ON tp.team_id = tm.team_id
    WHERE tph.id = training_weeks.phase_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.training_phases tph
    JOIN public.training_programs tp ON tph.program_id = tp.id
    JOIN public.team_members tm ON tp.team_id = tm.team_id
    WHERE tph.id = training_weeks.phase_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
);

-- training_videos (public read, team-based write)
DROP POLICY IF EXISTS "Authenticated users can view training videos" ON public.training_videos;
DROP POLICY IF EXISTS "Coaches can manage training videos" ON public.training_videos;

CREATE POLICY "Authenticated users can view training videos"
ON public.training_videos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Coaches can manage training videos"
ON public.training_videos FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = training_videos.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = training_videos.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
);

-- exercises (public read, team-based write)
DROP POLICY IF EXISTS "Authenticated users can view exercises" ON public.exercises;
DROP POLICY IF EXISTS "Coaches can manage exercises" ON public.exercises;

CREATE POLICY "Authenticated users can view exercises"
ON public.exercises FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Coaches can manage exercises"
ON public.exercises FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = exercises.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = exercises.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
);

-- exercise_library (public read, admin write)
DROP POLICY IF EXISTS "Authenticated users can view exercise library" ON public.exercise_library;
DROP POLICY IF EXISTS "Admins can manage exercise library" ON public.exercise_library;

CREATE POLICY "Authenticated users can view exercise library"
ON public.exercise_library FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage exercise library"
ON public.exercise_library FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

-- session_exercises (user-specific or team-based)
DROP POLICY IF EXISTS "Users can view own session exercises" ON public.session_exercises;
DROP POLICY IF EXISTS "Users can manage own session exercises" ON public.session_exercises;
DROP POLICY IF EXISTS "Coaches can view team session exercises" ON public.session_exercises;

CREATE POLICY "Users can view own session exercises"
ON public.session_exercises FOR SELECT
TO authenticated
USING (
  session_id IN (
    SELECT id FROM public.training_sessions
    WHERE user_id = auth.user_id()::text
  )
);

CREATE POLICY "Users can manage own session exercises"
ON public.session_exercises FOR ALL
TO authenticated
USING (
  session_id IN (
    SELECT id FROM public.training_sessions
    WHERE user_id = auth.user_id()::text
  )
)
WITH CHECK (
  session_id IN (
    SELECT id FROM public.training_sessions
    WHERE user_id = auth.user_id()::text
  )
);

CREATE POLICY "Coaches can view team session exercises"
ON public.session_exercises FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.training_sessions ts
    JOIN public.team_members tm ON ts.team_id = tm.team_id
    WHERE ts.id = session_exercises.session_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
);

-- exercise_logs (user-specific)
DROP POLICY IF EXISTS "Users can view own exercise logs" ON public.exercise_logs;
DROP POLICY IF EXISTS "Users can manage own exercise logs" ON public.exercise_logs;
DROP POLICY IF EXISTS "Coaches can view team exercise logs" ON public.exercise_logs;

CREATE POLICY "Users can view own exercise logs"
ON public.exercise_logs FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Users can manage own exercise logs"
ON public.exercise_logs FOR ALL
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
)
WITH CHECK (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Coaches can view team exercise logs"
ON public.exercise_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = tm.team_id
      AND tm2.user_id::text = exercise_logs.user_id
      AND tm2.status = 'active'
    )
  )
);

-- exercise_registry (public read, admin write)
DROP POLICY IF EXISTS "Authenticated users can view exercise registry" ON public.exercise_registry;
DROP POLICY IF EXISTS "Admins can manage exercise registry" ON public.exercise_registry;

CREATE POLICY "Authenticated users can view exercise registry"
ON public.exercise_registry FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage exercise registry"
ON public.exercise_registry FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

-- plyometrics_exercises (public read, admin write)
DROP POLICY IF EXISTS "Authenticated users can view plyometrics exercises" ON public.plyometrics_exercises;
DROP POLICY IF EXISTS "Admins can manage plyometrics exercises" ON public.plyometrics_exercises;

CREATE POLICY "Authenticated users can view plyometrics exercises"
ON public.plyometrics_exercises FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage plyometrics exercises"
ON public.plyometrics_exercises FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

-- isometrics_exercises (public read, admin write)
DROP POLICY IF EXISTS "Authenticated users can view isometrics exercises" ON public.isometrics_exercises;
DROP POLICY IF EXISTS "Admins can manage isometrics exercises" ON public.isometrics_exercises;

CREATE POLICY "Authenticated users can view isometrics exercises"
ON public.isometrics_exercises FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage isometrics exercises"
ON public.isometrics_exercises FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

-- exercisedb_exercises (public read, admin write)
DROP POLICY IF EXISTS "Authenticated users can view exercisedb exercises" ON public.exercisedb_exercises;
DROP POLICY IF EXISTS "Admins can manage exercisedb exercises" ON public.exercisedb_exercises;

CREATE POLICY "Authenticated users can view exercisedb exercises"
ON public.exercisedb_exercises FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage exercisedb exercises"
ON public.exercisedb_exercises FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

-- ff_exercise_mappings (public read, admin write)
DROP POLICY IF EXISTS "Authenticated users can view ff exercise mappings" ON public.ff_exercise_mappings;
DROP POLICY IF EXISTS "Admins can manage ff exercise mappings" ON public.ff_exercise_mappings;

CREATE POLICY "Authenticated users can view ff exercise mappings"
ON public.ff_exercise_mappings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage ff exercise mappings"
ON public.ff_exercise_mappings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

-- exercisedb_import_logs (admin only)
DROP POLICY IF EXISTS "Admins can view exercisedb import logs" ON public.exercisedb_import_logs;
DROP POLICY IF EXISTS "System can manage exercisedb import logs" ON public.exercisedb_import_logs;

CREATE POLICY "Admins can view exercisedb import logs"
ON public.exercisedb_import_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

CREATE POLICY "System can manage exercisedb import logs"
ON public.exercisedb_import_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STEP 7: Create RLS Policies for Load Management Tables
-- ============================================================================

-- load_daily (user-specific or team-based)
DROP POLICY IF EXISTS "Users can view own load daily" ON public.load_daily;
DROP POLICY IF EXISTS "Users can manage own load daily" ON public.load_daily;
DROP POLICY IF EXISTS "Coaches can view team load daily" ON public.load_daily;

CREATE POLICY "Users can view own load daily"
ON public.load_daily FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Users can manage own load daily"
ON public.load_daily FOR ALL
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
)
WITH CHECK (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Coaches can view team load daily"
ON public.load_daily FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = tm.team_id
      AND tm2.user_id::text = load_daily.user_id
      AND tm2.status = 'active'
    )
  )
);

-- load_metrics (user-specific or team-based)
DROP POLICY IF EXISTS "Users can view own load metrics" ON public.load_metrics;
DROP POLICY IF EXISTS "Users can manage own load metrics" ON public.load_metrics;
DROP POLICY IF EXISTS "Coaches can view team load metrics" ON public.load_metrics;

CREATE POLICY "Users can view own load metrics"
ON public.load_metrics FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Users can manage own load metrics"
ON public.load_metrics FOR ALL
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
)
WITH CHECK (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Coaches can view team load metrics"
ON public.load_metrics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = tm.team_id
      AND tm2.user_id::text = load_metrics.user_id
      AND tm2.status = 'active'
    )
  )
);

-- load_monitoring (user-specific or team-based)
DROP POLICY IF EXISTS "Users can view own load monitoring" ON public.load_monitoring;
DROP POLICY IF EXISTS "Users can manage own load monitoring" ON public.load_monitoring;
DROP POLICY IF EXISTS "Coaches can view team load monitoring" ON public.load_monitoring;

CREATE POLICY "Users can view own load monitoring"
ON public.load_monitoring FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Users can manage own load monitoring"
ON public.load_monitoring FOR ALL
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
)
WITH CHECK (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Coaches can view team load monitoring"
ON public.load_monitoring FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = tm.team_id
      AND tm2.user_id::text = load_monitoring.user_id
      AND tm2.status = 'active'
    )
  )
);

-- load_caps (user-specific or team-based)
DROP POLICY IF EXISTS "Users can view own load caps" ON public.load_caps;
DROP POLICY IF EXISTS "Users can manage own load caps" ON public.load_caps;
DROP POLICY IF EXISTS "Coaches can view team load caps" ON public.load_caps;

CREATE POLICY "Users can view own load caps"
ON public.load_caps FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Users can manage own load caps"
ON public.load_caps FOR ALL
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
)
WITH CHECK (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Coaches can view team load caps"
ON public.load_caps FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = tm.team_id
      AND tm2.user_id::text = load_caps.user_id
      AND tm2.status = 'active'
    )
  )
);

-- workout_logs (user-specific or team-based)
DROP POLICY IF EXISTS "Users can view own workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Users can manage own workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Coaches can view team workout logs" ON public.workout_logs;

CREATE POLICY "Users can view own workout logs"
ON public.workout_logs FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Users can manage own workout logs"
ON public.workout_logs FOR ALL
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
)
WITH CHECK (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Coaches can view team workout logs"
ON public.workout_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = tm.team_id
      AND tm2.user_id::text = workout_logs.user_id
      AND tm2.status = 'active'
    )
  )
);

-- recovery_blocks (user-specific or team-based)
DROP POLICY IF EXISTS "Users can view own recovery blocks" ON public.recovery_blocks;
DROP POLICY IF EXISTS "Users can manage own recovery blocks" ON public.recovery_blocks;
DROP POLICY IF EXISTS "Coaches can view team recovery blocks" ON public.recovery_blocks;

CREATE POLICY "Users can view own recovery blocks"
ON public.recovery_blocks FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Users can manage own recovery blocks"
ON public.recovery_blocks FOR ALL
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
)
WITH CHECK (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Coaches can view team recovery blocks"
ON public.recovery_blocks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = tm.team_id
      AND tm2.user_id::text = recovery_blocks.user_id
      AND tm2.status = 'active'
    )
  )
);

-- ============================================================================
-- STEP 8: Create RLS Policies for Analytics and Metrics Tables
-- ============================================================================

-- analytics_aggregates (team-based)
DROP POLICY IF EXISTS "Team members can view analytics aggregates" ON public.analytics_aggregates;
DROP POLICY IF EXISTS "Coaches can manage analytics aggregates" ON public.analytics_aggregates;

CREATE POLICY "Team members can view analytics aggregates"
ON public.analytics_aggregates FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = analytics_aggregates.team_id
    AND tm.user_id = auth.user_id()
    AND tm.status = 'active'
  )
);

CREATE POLICY "Coaches can manage analytics aggregates"
ON public.analytics_aggregates FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = analytics_aggregates.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = analytics_aggregates.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
);

-- position_specific_metrics (user-specific or team-based)
DROP POLICY IF EXISTS "Users can view own position metrics" ON public.position_specific_metrics;
DROP POLICY IF EXISTS "Users can manage own position metrics" ON public.position_specific_metrics;
DROP POLICY IF EXISTS "Coaches can view team position metrics" ON public.position_specific_metrics;

CREATE POLICY "Users can view own position metrics"
ON public.position_specific_metrics FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Users can manage own position metrics"
ON public.position_specific_metrics FOR ALL
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
)
WITH CHECK (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Coaches can view team position metrics"
ON public.position_specific_metrics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = tm.team_id
      AND tm2.user_id::text = position_specific_metrics.user_id
      AND tm2.status = 'active'
    )
  )
);

-- metric_definitions (public read, admin write)
DROP POLICY IF EXISTS "Authenticated users can view metric definitions" ON public.metric_definitions;
DROP POLICY IF EXISTS "Admins can manage metric definitions" ON public.metric_definitions;

CREATE POLICY "Authenticated users can view metric definitions"
ON public.metric_definitions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage metric definitions"
ON public.metric_definitions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

-- metric_entries (user-specific, sensitive column: session_id)
DROP POLICY IF EXISTS "Users can view own metric entries" ON public.metric_entries;
DROP POLICY IF EXISTS "Users can manage own metric entries" ON public.metric_entries;
DROP POLICY IF EXISTS "Coaches can view team metric entries" ON public.metric_entries;

CREATE POLICY "Users can view own metric entries"
ON public.metric_entries FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Users can manage own metric entries"
ON public.metric_entries FOR ALL
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
)
WITH CHECK (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Coaches can view team metric entries"
ON public.metric_entries FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = tm.team_id
      AND tm2.user_id::text = metric_entries.user_id
      AND tm2.status = 'active'
    )
  )
);

-- coach_analytics_cache (coach-specific)
DROP POLICY IF EXISTS "Coaches can view own analytics cache" ON public.coach_analytics_cache;
DROP POLICY IF EXISTS "Coaches can manage own analytics cache" ON public.coach_analytics_cache;

CREATE POLICY "Coaches can view own analytics cache"
ON public.coach_analytics_cache FOR SELECT
TO authenticated
USING (
  coach_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Coaches can manage own analytics cache"
ON public.coach_analytics_cache FOR ALL
TO authenticated
USING (
  coach_id = (SELECT auth.user_id())::text
)
WITH CHECK (
  coach_id = (SELECT auth.user_id())::text
);

-- team_insights (team-based)
DROP POLICY IF EXISTS "Team members can view team insights" ON public.team_insights;
DROP POLICY IF EXISTS "Coaches can manage team insights" ON public.team_insights;

CREATE POLICY "Team members can view team insights"
ON public.team_insights FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_insights.team_id
    AND tm.user_id = auth.user_id()
    AND tm.status = 'active'
  )
);

CREATE POLICY "Coaches can manage team insights"
ON public.team_insights FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_insights.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_insights.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
);

-- ml_training_data (admin only)
DROP POLICY IF EXISTS "Admins can view ml training data" ON public.ml_training_data;
DROP POLICY IF EXISTS "System can manage ml training data" ON public.ml_training_data;

CREATE POLICY "Admins can view ml training data"
ON public.ml_training_data FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

CREATE POLICY "System can manage ml training data"
ON public.ml_training_data FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STEP 9: Create RLS Policies for Player and Program Tables
-- ============================================================================

-- player_programs (user-specific or team-based)
DROP POLICY IF EXISTS "Users can view own player programs" ON public.player_programs;
DROP POLICY IF EXISTS "Users can manage own player programs" ON public.player_programs;
DROP POLICY IF EXISTS "Coaches can view team player programs" ON public.player_programs;

CREATE POLICY "Users can view own player programs"
ON public.player_programs FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Users can manage own player programs"
ON public.player_programs FOR ALL
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
)
WITH CHECK (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Coaches can view team player programs"
ON public.player_programs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = tm.team_id
      AND tm2.user_id::text = player_programs.user_id
      AND tm2.status = 'active'
    )
  )
);

-- program_assignments (team-based)
DROP POLICY IF EXISTS "Team members can view program assignments" ON public.program_assignments;
DROP POLICY IF EXISTS "Coaches can manage program assignments" ON public.program_assignments;

CREATE POLICY "Team members can view program assignments"
ON public.program_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = program_assignments.team_id
    AND tm.user_id = auth.user_id()
    AND tm.status = 'active'
  )
);

CREATE POLICY "Coaches can manage program assignments"
ON public.program_assignments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = program_assignments.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = program_assignments.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
);

-- player_tournament_availability (team-based)
DROP POLICY IF EXISTS "Team members can view player tournament availability" ON public.player_tournament_availability;
DROP POLICY IF EXISTS "Coaches can manage player tournament availability" ON public.player_tournament_availability;

CREATE POLICY "Team members can view player tournament availability"
ON public.player_tournament_availability FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = player_tournament_availability.team_id
    AND tm.user_id = auth.user_id()
    AND tm.status = 'active'
  )
);

CREATE POLICY "Coaches can manage player tournament availability"
ON public.player_tournament_availability FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = player_tournament_availability.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = player_tournament_availability.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
);

-- athlete_daily_state (user-specific or team-based)
DROP POLICY IF EXISTS "Users can view own athlete daily state" ON public.athlete_daily_state;
DROP POLICY IF EXISTS "Users can manage own athlete daily state" ON public.athlete_daily_state;
DROP POLICY IF EXISTS "Coaches can view team athlete daily state" ON public.athlete_daily_state;

CREATE POLICY "Users can view own athlete daily state"
ON public.athlete_daily_state FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Users can manage own athlete daily state"
ON public.athlete_daily_state FOR ALL
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
)
WITH CHECK (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Coaches can view team athlete daily state"
ON public.athlete_daily_state FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = tm.team_id
      AND tm2.user_id::text = athlete_daily_state.user_id
      AND tm2.status = 'active'
    )
  )
);

-- athlete_achievements (user-specific or team-based)
DROP POLICY IF EXISTS "Users can view own athlete achievements" ON public.athlete_achievements;
DROP POLICY IF EXISTS "Users can manage own athlete achievements" ON public.athlete_achievements;
DROP POLICY IF EXISTS "Coaches can view team athlete achievements" ON public.athlete_achievements;

CREATE POLICY "Users can view own athlete achievements"
ON public.athlete_achievements FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Users can manage own athlete achievements"
ON public.athlete_achievements FOR ALL
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
)
WITH CHECK (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Coaches can view team athlete achievements"
ON public.athlete_achievements FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = tm.team_id
      AND tm2.user_id::text = athlete_achievements.user_id
      AND tm2.status = 'active'
    )
  )
);

-- ============================================================================
-- STEP 10: Create RLS Policies for Staff and Roles Tables
-- ============================================================================

-- staff_roles (team-based)
DROP POLICY IF EXISTS "Team members can view staff roles" ON public.staff_roles;
DROP POLICY IF EXISTS "Team admins can manage staff roles" ON public.staff_roles;

CREATE POLICY "Team members can view staff roles"
ON public.staff_roles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = staff_roles.team_id
    AND tm.user_id = auth.user_id()
    AND tm.status = 'active'
  )
);

CREATE POLICY "Team admins can manage staff roles"
ON public.staff_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = staff_roles.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = staff_roles.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

-- superadmins (admin only)
DROP POLICY IF EXISTS "Admins can view superadmins" ON public.superadmins;
DROP POLICY IF EXISTS "Superadmins can manage superadmins" ON public.superadmins;

CREATE POLICY "Admins can view superadmins"
ON public.superadmins FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.superadmins sa
    WHERE sa.user_id = auth.user_id()
  )
);

CREATE POLICY "Superadmins can manage superadmins"
ON public.superadmins FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.superadmins sa
    WHERE sa.user_id = auth.user_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.superadmins sa
    WHERE sa.user_id = auth.user_id()
  )
);

-- positions (public read, admin write)
DROP POLICY IF EXISTS "Authenticated users can view positions" ON public.positions;
DROP POLICY IF EXISTS "Admins can manage positions" ON public.positions;

CREATE POLICY "Authenticated users can view positions"
ON public.positions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage positions"
ON public.positions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

-- ============================================================================
-- STEP 11: Create RLS Policies for Financial Tables
-- ============================================================================

-- tournament_budgets (team admin only)
DROP POLICY IF EXISTS "Team admins can view tournament budgets" ON public.tournament_budgets;
DROP POLICY IF EXISTS "Team admins can manage tournament budgets" ON public.tournament_budgets;

CREATE POLICY "Team admins can view tournament budgets"
ON public.tournament_budgets FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = tournament_budgets.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

CREATE POLICY "Team admins can manage tournament budgets"
ON public.tournament_budgets FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = tournament_budgets.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = tournament_budgets.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

-- player_payments (team admin only)
DROP POLICY IF EXISTS "Team admins can view player payments" ON public.player_payments;
DROP POLICY IF EXISTS "Team admins can manage player payments" ON public.player_payments;

CREATE POLICY "Team admins can view player payments"
ON public.player_payments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = player_payments.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

CREATE POLICY "Team admins can manage player payments"
ON public.player_payments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = player_payments.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = player_payments.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

-- sponsor_contributions (team admin only)
DROP POLICY IF EXISTS "Team admins can view sponsor contributions" ON public.sponsor_contributions;
DROP POLICY IF EXISTS "Team admins can manage sponsor contributions" ON public.sponsor_contributions;

CREATE POLICY "Team admins can view sponsor contributions"
ON public.sponsor_contributions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = sponsor_contributions.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

CREATE POLICY "Team admins can manage sponsor contributions"
ON public.sponsor_contributions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = sponsor_contributions.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = sponsor_contributions.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

-- ============================================================================
-- STEP 12: Create RLS Policies for Audit and Log Tables
-- ============================================================================

-- roster_audit_log (team admin only)
DROP POLICY IF EXISTS "Team admins can view roster audit log" ON public.roster_audit_log;
DROP POLICY IF EXISTS "System can manage roster audit log" ON public.roster_audit_log;

CREATE POLICY "Team admins can view roster audit log"
ON public.roster_audit_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = roster_audit_log.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

CREATE POLICY "System can manage roster audit log"
ON public.roster_audit_log FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- decision_ledger (team admin only)
DROP POLICY IF EXISTS "Team admins can view decision ledger" ON public.decision_ledger;
DROP POLICY IF EXISTS "System can manage decision ledger" ON public.decision_ledger;

CREATE POLICY "Team admins can view decision ledger"
ON public.decision_ledger FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = decision_ledger.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

CREATE POLICY "System can manage decision ledger"
ON public.decision_ledger FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- decision_review_reminders (team admin only)
DROP POLICY IF EXISTS "Team admins can view decision review reminders" ON public.decision_review_reminders;
DROP POLICY IF EXISTS "System can manage decision review reminders" ON public.decision_review_reminders;

CREATE POLICY "Team admins can view decision review reminders"
ON public.decision_review_reminders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = decision_review_reminders.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

CREATE POLICY "System can manage decision review reminders"
ON public.decision_review_reminders FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- consent_access_log (admin only)
DROP POLICY IF EXISTS "Admins can view consent access log" ON public.consent_access_log;
DROP POLICY IF EXISTS "System can manage consent access log" ON public.consent_access_log;

CREATE POLICY "Admins can view consent access log"
ON public.consent_access_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

CREATE POLICY "System can manage consent access log"
ON public.consent_access_log FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STEP 13: Create RLS Policies for User Settings and Preferences
-- ============================================================================

-- user_settings (user-specific)
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_settings;

CREATE POLICY "Users can view own settings"
ON public.user_settings FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.user_id())
);

CREATE POLICY "Users can manage own settings"
ON public.user_settings FOR ALL
TO authenticated
USING (
  user_id = (SELECT auth.user_id())
)
WITH CHECK (
  user_id = (SELECT auth.user_id())
);

-- user_security (user-specific)
DROP POLICY IF EXISTS "Users can view own security settings" ON public.user_security;
DROP POLICY IF EXISTS "Users can manage own security settings" ON public.user_security;

CREATE POLICY "Users can view own security settings"
ON public.user_security FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.user_id())
);

CREATE POLICY "Users can manage own security settings"
ON public.user_security FOR ALL
TO authenticated
USING (
  user_id = (SELECT auth.user_id())
)
WITH CHECK (
  user_id = (SELECT auth.user_id())
);

-- notification_preferences (user-specific)
DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.notification_preferences;

CREATE POLICY "Users can view own notification preferences"
ON public.notification_preferences FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.user_id())
);

CREATE POLICY "Users can manage own notification preferences"
ON public.notification_preferences FOR ALL
TO authenticated
USING (
  user_id = (SELECT auth.user_id())
)
WITH CHECK (
  user_id = (SELECT auth.user_id())
);

-- push_subscriptions (user-specific, sensitive column: auth_key)
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON public.push_subscriptions;

CREATE POLICY "Users can view own push subscriptions"
ON public.push_subscriptions FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.user_id())
);

CREATE POLICY "Users can manage own push subscriptions"
ON public.push_subscriptions FOR ALL
TO authenticated
USING (
  user_id = (SELECT auth.user_id())
)
WITH CHECK (
  user_id = (SELECT auth.user_id())
);

-- ============================================================================
-- STEP 14: Create RLS Policies for AI and Feedback Tables
-- ============================================================================

-- ai_response_feedback (user-specific, sensitive column: session_id)
DROP POLICY IF EXISTS "Users can view own ai feedback" ON public.ai_response_feedback;
DROP POLICY IF EXISTS "Users can manage own ai feedback" ON public.ai_response_feedback;

CREATE POLICY "Users can view own ai feedback"
ON public.ai_response_feedback FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.user_id())
);

CREATE POLICY "Users can manage own ai feedback"
ON public.ai_response_feedback FOR ALL
TO authenticated
USING (
  user_id = (SELECT auth.user_id())
)
WITH CHECK (
  user_id = (SELECT auth.user_id())
);

-- approval_requests (team-based)
DROP POLICY IF EXISTS "Team members can view approval requests" ON public.approval_requests;
DROP POLICY IF EXISTS "Coaches can manage approval requests" ON public.approval_requests;

CREATE POLICY "Team members can view approval requests"
ON public.approval_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = approval_requests.team_id
    AND tm.user_id = auth.user_id()
    AND tm.status = 'active'
  )
);

CREATE POLICY "Coaches can manage approval requests"
ON public.approval_requests FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = approval_requests.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = approval_requests.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
);

-- ============================================================================
-- STEP 15: Create RLS Policies for Wellness and Health Tables
-- ============================================================================

-- daily_wellness_checkin (user-specific or team-based)
DROP POLICY IF EXISTS "Users can view own wellness checkins" ON public.daily_wellness_checkin;
DROP POLICY IF EXISTS "Users can manage own wellness checkins" ON public.daily_wellness_checkin;
DROP POLICY IF EXISTS "Coaches can view team wellness checkins" ON public.daily_wellness_checkin;

CREATE POLICY "Users can view own wellness checkins"
ON public.daily_wellness_checkin FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Users can manage own wellness checkins"
ON public.daily_wellness_checkin FOR ALL
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
)
WITH CHECK (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Coaches can view team wellness checkins"
ON public.daily_wellness_checkin FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = tm.team_id
      AND tm2.user_id::text = daily_wellness_checkin.user_id
      AND tm2.status = 'active'
    )
  )
);

-- injuries (user-specific or team-based)
DROP POLICY IF EXISTS "Users can view own injuries" ON public.injuries;
DROP POLICY IF EXISTS "Users can manage own injuries" ON public.injuries;
DROP POLICY IF EXISTS "Coaches can view team injuries" ON public.injuries;

CREATE POLICY "Users can view own injuries"
ON public.injuries FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Users can manage own injuries"
ON public.injuries FOR ALL
TO authenticated
USING (
  user_id = (SELECT auth.user_id())::text
)
WITH CHECK (
  user_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Coaches can view team injuries"
ON public.injuries FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = tm.team_id
      AND tm2.user_id::text = injuries.user_id
      AND tm2.status = 'active'
    )
  )
);

-- ============================================================================
-- STEP 16: Create RLS Policies for Coach and Team Management Tables
-- ============================================================================

-- coach_overrides (coach-specific or team-based)
DROP POLICY IF EXISTS "Coaches can view own overrides" ON public.coach_overrides;
DROP POLICY IF EXISTS "Coaches can manage own overrides" ON public.coach_overrides;

CREATE POLICY "Coaches can view own overrides"
ON public.coach_overrides FOR SELECT
TO authenticated
USING (
  coach_id = (SELECT auth.user_id())::text
);

CREATE POLICY "Coaches can manage own overrides"
ON public.coach_overrides FOR ALL
TO authenticated
USING (
  coach_id = (SELECT auth.user_id())::text
)
WITH CHECK (
  coach_id = (SELECT auth.user_id())::text
);

-- ownership_transitions (team admin only)
DROP POLICY IF EXISTS "Team admins can view ownership transitions" ON public.ownership_transitions;
DROP POLICY IF EXISTS "Team admins can manage ownership transitions" ON public.ownership_transitions;

CREATE POLICY "Team admins can view ownership transitions"
ON public.ownership_transitions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = ownership_transitions.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

CREATE POLICY "Team admins can manage ownership transitions"
ON public.ownership_transitions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = ownership_transitions.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = ownership_transitions.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team = 'admin'
    AND tm.status = 'active'
  )
);

-- shared_insights (team-based)
DROP POLICY IF EXISTS "Team members can view shared insights" ON public.shared_insights;
DROP POLICY IF EXISTS "Coaches can manage shared insights" ON public.shared_insights;

CREATE POLICY "Team members can view shared insights"
ON public.shared_insights FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = shared_insights.team_id
    AND tm.user_id = auth.user_id()
    AND tm.status = 'active'
  )
);

CREATE POLICY "Coaches can manage shared insights"
ON public.shared_insights FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = shared_insights.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = shared_insights.team_id
    AND tm.user_id = auth.user_id()
    AND tm.role_team IN ('coach', 'admin')
    AND tm.status = 'active'
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check RLS is enabled on all tables
SELECT 
    tablename, 
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN (
    'receiving_stats',
    'passing_stats',
    'flag_pull_stats',
    'situational_stats',
    'opponent_analysis',
    'article_search_index',
    'knowledge_search_index',
    'knowledge_base_governance_log',
    'fixtures',
    'program_assignments',
    'load_daily',
    'exercise_library',
    'analytics_aggregates',
    'load_metrics',
    'load_monitoring',
    'workout_logs',
    'training_videos',
    'staff_roles',
    'player_tournament_availability',
    'tournament_budgets',
    'player_payments',
    'sponsor_contributions',
    'roster_audit_log',
    'decision_ledger',
    'decision_review_reminders',
    'plyometrics_exercises',
    'isometrics_exercises',
    'player_programs',
    'position_specific_metrics',
    'exercise_logs',
    'exercise_registry',
    'metric_definitions',
    'metric_entries',
    'consent_access_log',
    'exercisedb_exercises',
    'ff_exercise_mappings',
    'exercisedb_import_logs',
    'ml_training_data',
    'athlete_daily_state',
    'coach_overrides',
    'recovery_blocks',
    'load_caps',
    'ownership_transitions',
    'shared_insights',
    'approval_requests',
    'ai_response_feedback',
    'coach_analytics_cache',
    'notification_preferences',
    'team_insights',
    'athlete_achievements',
    'push_subscriptions',
    'user_security',
    'user_settings',
    'injuries',
    'superadmins',
    'training_programs',
    'positions',
    'training_phases',
    'training_weeks',
    'session_exercises',
    'exercises',
    'daily_wellness_checkin'
  )
ORDER BY tablename;

-- View all policies created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN (
    'receiving_stats',
    'passing_stats',
    'flag_pull_stats',
    'situational_stats',
    'opponent_analysis',
    'article_search_index',
    'knowledge_search_index',
    'knowledge_base_governance_log',
    'fixtures',
    'program_assignments',
    'load_daily',
    'exercise_library',
    'analytics_aggregates',
    'load_metrics',
    'load_monitoring',
    'workout_logs',
    'training_videos',
    'staff_roles',
    'player_tournament_availability',
    'tournament_budgets',
    'player_payments',
    'sponsor_contributions',
    'roster_audit_log',
    'decision_ledger',
    'decision_review_reminders',
    'plyometrics_exercises',
    'isometrics_exercises',
    'player_programs',
    'position_specific_metrics',
    'exercise_logs',
    'exercise_registry',
    'metric_definitions',
    'metric_entries',
    'consent_access_log',
    'exercisedb_exercises',
    'ff_exercise_mappings',
    'exercisedb_import_logs',
    'ml_training_data',
    'athlete_daily_state',
    'coach_overrides',
    'recovery_blocks',
    'load_caps',
    'ownership_transitions',
    'shared_insights',
    'approval_requests',
    'ai_response_feedback',
    'coach_analytics_cache',
    'notification_preferences',
    'team_insights',
    'athlete_achievements',
    'push_subscriptions',
    'user_security',
    'user_settings',
    'injuries',
    'superadmins',
    'training_programs',
    'positions',
    'training_phases',
    'training_weeks',
    'session_exercises',
    'exercises',
    'daily_wellness_checkin'
  )
ORDER BY tablename, policyname;

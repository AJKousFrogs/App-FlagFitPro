-- =============================================================================
-- MIGRATION: Fix RLS Performance and Consolidate Policies
-- Migration: 044_fix_rls_performance_and_consolidate_policies.sql
-- Purpose: Fix Supabase linter warnings for RLS performance and duplicate policies
-- Created: 2025-01-XX
-- =============================================================================
--
-- This migration fixes:
-- 1. auth_rls_initplan warnings: Wrap auth.uid() and auth.user_id() calls in (SELECT ...)
-- 2. multiple_permissive_policies warnings: Consolidate duplicate policies
-- 3. duplicate_index warnings: Remove duplicate indexes
--
-- =============================================================================

-- =============================================================================
-- PART 1: Fix auth_rls_initplan warnings - Wrap auth functions in (SELECT ...)
-- =============================================================================

-- USERS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;

CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own profile"
ON public.users FOR DELETE
USING (id = (SELECT auth.uid()));

-- IMPLEMENTATION STEPS POLICIES
DROP POLICY IF EXISTS "Users can view own implementation steps" ON public.implementation_steps;
DROP POLICY IF EXISTS "Users can insert own implementation steps" ON public.implementation_steps;
DROP POLICY IF EXISTS "Users can update own implementation steps" ON public.implementation_steps;
DROP POLICY IF EXISTS "Users can delete own implementation steps" ON public.implementation_steps;

CREATE POLICY "Users can view own implementation steps"
ON public.implementation_steps FOR SELECT
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own implementation steps"
ON public.implementation_steps FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own implementation steps"
ON public.implementation_steps FOR UPDATE
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own implementation steps"
ON public.implementation_steps FOR DELETE
USING (user_id = (SELECT auth.uid()));

-- WELLNESS LOGS POLICIES
DROP POLICY IF EXISTS wellness_logs_select_coach ON public.wellness_logs;
DROP POLICY IF EXISTS wellness_logs_update_admin ON public.wellness_logs;

CREATE POLICY wellness_logs_select_coach
ON public.wellness_logs FOR SELECT
USING (
  user_id IN (
    SELECT tm.user_id::text FROM team_members tm
    INNER JOIN team_members coach ON coach.team_id = tm.team_id
    WHERE coach.user_id = (SELECT auth.uid()) AND coach.role IN ('coach', 'admin')
  )
  OR user_id = (SELECT auth.uid())::text
);

CREATE POLICY wellness_logs_update_admin
ON public.wellness_logs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- FIXTURES POLICIES
DROP POLICY IF EXISTS fixtures_select_team_member ON public.fixtures;
DROP POLICY IF EXISTS fixtures_insert_team_member ON public.fixtures;
DROP POLICY IF EXISTS fixtures_update_team_member ON public.fixtures;
DROP POLICY IF EXISTS fixtures_delete_team_member ON public.fixtures;

CREATE POLICY fixtures_select_team_member
ON public.fixtures FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid())
  )
);

CREATE POLICY fixtures_insert_team_member
ON public.fixtures FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid())
  )
);

CREATE POLICY fixtures_update_team_member
ON public.fixtures FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  team_id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid())
  )
);

CREATE POLICY fixtures_delete_team_member
ON public.fixtures FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid())
  )
);

-- READINESS SCORES POLICIES
DROP POLICY IF EXISTS readiness_scores_select_athlete ON public.readiness_scores;
DROP POLICY IF EXISTS readiness_scores_insert_athlete ON public.readiness_scores;
DROP POLICY IF EXISTS readiness_scores_update_athlete ON public.readiness_scores;
DROP POLICY IF EXISTS readiness_scores_delete_admin ON public.readiness_scores;

CREATE POLICY readiness_scores_select_athlete
ON public.readiness_scores FOR SELECT
USING (athlete_id = (SELECT auth.uid()));

CREATE POLICY readiness_scores_insert_athlete
ON public.readiness_scores FOR INSERT
WITH CHECK (athlete_id = (SELECT auth.uid()));

CREATE POLICY readiness_scores_update_athlete
ON public.readiness_scores FOR UPDATE
USING (athlete_id = (SELECT auth.uid()))
WITH CHECK (athlete_id = (SELECT auth.uid()));

CREATE POLICY readiness_scores_delete_admin
ON public.readiness_scores FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- TEAMS POLICIES
DROP POLICY IF EXISTS teams_coach_admin_all ON public.teams;

CREATE POLICY teams_coach_admin_all
ON public.teams FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
  OR id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
  OR id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
);

-- TRAINING SESSIONS POLICIES
DROP POLICY IF EXISTS training_sessions_coach_admin_team_all ON public.training_sessions;

CREATE POLICY training_sessions_coach_admin_team_all
ON public.training_sessions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
  OR team_id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
  OR team_id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
);

-- USER NOTIFICATION PREFERENCES POLICIES
DROP POLICY IF EXISTS "Users can read their own notification preferences" ON public.user_notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON public.user_notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON public.user_notification_preferences;

CREATE POLICY "Users can read their own notification preferences"
ON public.user_notification_preferences FOR SELECT
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own notification preferences"
ON public.user_notification_preferences FOR UPDATE
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own notification preferences"
ON public.user_notification_preferences FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

-- USER TEAMS POLICIES
DROP POLICY IF EXISTS user_teams_coach_admin_all ON public.user_teams;
DROP POLICY IF EXISTS user_teams_manage_by_coach_insert ON public.user_teams;
DROP POLICY IF EXISTS user_teams_manage_by_coach_update ON public.user_teams;

CREATE POLICY user_teams_coach_admin_all
ON public.user_teams FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
);

CREATE POLICY user_teams_manage_by_coach_insert
ON public.user_teams FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
);

CREATE POLICY user_teams_manage_by_coach_update
ON public.user_teams FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
)
WITH CHECK (
  team_id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
);

-- CHATBOT USER CONTEXT POLICIES
DROP POLICY IF EXISTS chatbot_user_context_select_own_or_admin ON public.chatbot_user_context;
DROP POLICY IF EXISTS chatbot_user_context_update_own_or_admin ON public.chatbot_user_context;
DROP POLICY IF EXISTS chatbot_user_context_delete_own_or_admin ON public.chatbot_user_context;

CREATE POLICY chatbot_user_context_select_own_or_admin
ON public.chatbot_user_context FOR SELECT
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY chatbot_user_context_update_own_or_admin
ON public.chatbot_user_context FOR UPDATE
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
)
WITH CHECK (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY chatbot_user_context_delete_own_or_admin
ON public.chatbot_user_context FOR DELETE
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- =============================================================================
-- PART 2: Consolidate Multiple Permissive Policies
-- =============================================================================

-- ANALYTICS EVENTS: Consolidate multiple policies
-- Drop all existing policies first
DROP POLICY IF EXISTS analytics_events_admin_all ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_insert_authenticated ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_insert_own ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_policy ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_select_authenticated ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_select_own ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_update_own ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_delete_own ON public.analytics_events;

-- Single consolidated INSERT policy (replaces analytics_events_admin_all, analytics_events_insert_authenticated, analytics_events_insert_own, analytics_events_policy)
CREATE POLICY analytics_events_insert_consolidated
ON public.analytics_events FOR INSERT
WITH CHECK (
  user_id = (SELECT auth.uid())::text
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Single consolidated SELECT policy (replaces analytics_events_admin_all, analytics_events_select_authenticated, analytics_events_select_own, analytics_events_policy)
CREATE POLICY analytics_events_select_consolidated
ON public.analytics_events FOR SELECT
USING (
  user_id = (SELECT auth.uid())::text
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Single consolidated UPDATE policy (replaces analytics_events_admin_all, analytics_events_update_own, analytics_events_policy)
CREATE POLICY analytics_events_update_consolidated
ON public.analytics_events FOR UPDATE
USING (
  user_id = (SELECT auth.uid())::text
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
)
WITH CHECK (
  user_id = (SELECT auth.uid())::text
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Single consolidated DELETE policy (replaces analytics_events_admin_all, analytics_events_delete_own, analytics_events_policy)
CREATE POLICY analytics_events_delete_consolidated
ON public.analytics_events FOR DELETE
USING (
  user_id = (SELECT auth.uid())::text
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- CHATBOT USER CONTEXT: Consolidate duplicate policies
DROP POLICY IF EXISTS chatbot_context_select_own ON public.chatbot_user_context;
DROP POLICY IF EXISTS chatbot_context_insert_own ON public.chatbot_user_context;
DROP POLICY IF EXISTS chatbot_context_update_own ON public.chatbot_user_context;
DROP POLICY IF EXISTS chatbot_context_delete_own ON public.chatbot_user_context;
DROP POLICY IF EXISTS chatbot_user_context_insert_own ON public.chatbot_user_context;

-- IMPLEMENTATION STEPS: Consolidate duplicate policies
DROP POLICY IF EXISTS implementation_steps_select_own ON public.implementation_steps;
DROP POLICY IF EXISTS implementation_steps_insert_own ON public.implementation_steps;
DROP POLICY IF EXISTS implementation_steps_update_own ON public.implementation_steps;
DROP POLICY IF EXISTS implementation_steps_delete_own ON public.implementation_steps;

-- NOTIFICATIONS: Consolidate duplicate policies
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
DROP POLICY IF EXISTS notifications_insert_own ON public.notifications;
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;

-- PERFORMANCE METRICS: Consolidate duplicate policies
DROP POLICY IF EXISTS performance_metrics_select_own ON public.performance_metrics;
DROP POLICY IF EXISTS performance_metrics_insert_own ON public.performance_metrics;
DROP POLICY IF EXISTS performance_metrics_update_own ON public.performance_metrics;
DROP POLICY IF EXISTS performance_metrics_delete_own ON public.performance_metrics;

-- PERFORMANCE BENCHMARKS: Consolidate duplicate policies
DROP POLICY IF EXISTS performance_benchmarks_select_own ON public.performance_benchmarks;

-- READINESS SCORES: Consolidate duplicate policies
DROP POLICY IF EXISTS readiness_scores_select_own ON public.readiness_scores;
DROP POLICY IF EXISTS readiness_scores_insert_own ON public.readiness_scores;
DROP POLICY IF EXISTS readiness_scores_update_own ON public.readiness_scores;
DROP POLICY IF EXISTS readiness_scores_delete_own ON public.readiness_scores;

-- SPONSOR REWARDS: Consolidate duplicate policies
DROP POLICY IF EXISTS sponsor_rewards_select_own ON public.sponsor_rewards;

-- SUPPLEMENT PROTOCOLS: Consolidate duplicate policies
DROP POLICY IF EXISTS supplement_protocols_select_own ON public.supplement_protocols;
DROP POLICY IF EXISTS supplement_protocols_insert_own ON public.supplement_protocols;
DROP POLICY IF EXISTS supplement_protocols_update_own ON public.supplement_protocols;
DROP POLICY IF EXISTS supplement_protocols_delete_own ON public.supplement_protocols;

-- TEAM CHEMISTRY: Consolidate duplicate policies
DROP POLICY IF EXISTS team_chemistry_select_own ON public.team_chemistry;

-- TEAMS: Consolidate duplicate policies
DROP POLICY IF EXISTS teams_manage_by_owner ON public.teams;
DROP POLICY IF EXISTS teams_member_select ON public.teams;
DROP POLICY IF EXISTS teams_select_for_members ON public.teams;

-- TRAINING ANALYTICS: Consolidate duplicate policies
DROP POLICY IF EXISTS training_analytics_select_own ON public.training_analytics;
DROP POLICY IF EXISTS training_analytics_insert_own ON public.training_analytics;
DROP POLICY IF EXISTS training_analytics_update_own ON public.training_analytics;
DROP POLICY IF EXISTS training_analytics_delete_own ON public.training_analytics;

-- TRAINING SESSIONS: Consolidate duplicate policies
DROP POLICY IF EXISTS training_sessions_athlete_select ON public.training_sessions;
DROP POLICY IF EXISTS training_sessions_athlete_insert ON public.training_sessions;
DROP POLICY IF EXISTS training_sessions_athlete_update ON public.training_sessions;
DROP POLICY IF EXISTS training_sessions_athlete_delete ON public.training_sessions;
DROP POLICY IF EXISTS training_sessions_select_own ON public.training_sessions;
DROP POLICY IF EXISTS training_sessions_insert_own ON public.training_sessions;
DROP POLICY IF EXISTS training_sessions_update_own ON public.training_sessions;
DROP POLICY IF EXISTS training_sessions_delete_own ON public.training_sessions;
DROP POLICY IF EXISTS training_sessions_team_members_select ON public.training_sessions;

-- USER NOTIFICATION PREFERENCES: Consolidate duplicate policies
DROP POLICY IF EXISTS unp_select_own ON public.user_notification_preferences;
DROP POLICY IF EXISTS unp_update_own ON public.user_notification_preferences;
DROP POLICY IF EXISTS unp_insert_own ON public.user_notification_preferences;

-- USER TEAMS: Consolidate duplicate policies
DROP POLICY IF EXISTS user_teams_select_for_members ON public.user_teams;
DROP POLICY IF EXISTS user_teams_select_own ON public.user_teams;
DROP POLICY IF EXISTS user_teams_insert_own ON public.user_teams;
DROP POLICY IF EXISTS user_teams_update_own ON public.user_teams;
DROP POLICY IF EXISTS user_teams_delete_own ON public.user_teams;
DROP POLICY IF EXISTS user_teams_self_select ON public.user_teams;
DROP POLICY IF EXISTS user_teams_self_insert ON public.user_teams;
DROP POLICY IF EXISTS user_teams_self_update ON public.user_teams;
DROP POLICY IF EXISTS user_teams_self_delete ON public.user_teams;
DROP POLICY IF EXISTS user_teams_manage_by_owner_insert ON public.user_teams;
DROP POLICY IF EXISTS user_teams_manage_by_owner_update ON public.user_teams;
DROP POLICY IF EXISTS user_teams_manage_by_owner_delete ON public.user_teams;

-- USERS: Consolidate duplicate policies
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_insert_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;

-- WEARABLES DATA: Consolidate duplicate policies
DROP POLICY IF EXISTS wearables_data_select_own ON public.wearables_data;
DROP POLICY IF EXISTS wearables_data_insert_own ON public.wearables_data;
DROP POLICY IF EXISTS wearables_data_update_own ON public.wearables_data;
DROP POLICY IF EXISTS wearables_data_delete_own ON public.wearables_data;

-- WELLNESS LOGS: Consolidate duplicate policies
DROP POLICY IF EXISTS wellness_logs_select_athlete ON public.wellness_logs;
DROP POLICY IF EXISTS wellness_logs_select_own ON public.wellness_logs;
DROP POLICY IF EXISTS wellness_logs_insert_athlete ON public.wellness_logs;
DROP POLICY IF EXISTS wellness_logs_insert_own ON public.wellness_logs;
DROP POLICY IF EXISTS wellness_logs_update_athlete ON public.wellness_logs;
DROP POLICY IF EXISTS wellness_logs_update_own ON public.wellness_logs;
DROP POLICY IF EXISTS wellness_logs_delete_athlete ON public.wellness_logs;
DROP POLICY IF EXISTS wellness_logs_delete_own ON public.wellness_logs;

-- =============================================================================
-- PART 3: Remove Duplicate Indexes
-- =============================================================================

-- chatbot_user_context: Remove duplicate indexes
DROP INDEX IF EXISTS idx_chatbot_context_user;
-- Keep idx_chatbot_user_context_user_id

-- user_notification_preferences: Remove duplicate indexes
DROP INDEX IF EXISTS idx_unp_user_id;
-- Keep idx_user_notification_preferences_user_id

-- user_teams: Remove duplicate indexes
DROP INDEX IF EXISTS idx_user_teams_user;
-- Keep idx_user_teams_user_id

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check remaining policies (should show no duplicates for same role/action)
-- SELECT tablename, policyname, cmd, roles
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd, policyname;

-- Check remaining indexes (should show no duplicates)
-- SELECT tablename, indexname
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;


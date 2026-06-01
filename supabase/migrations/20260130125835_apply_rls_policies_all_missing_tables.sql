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

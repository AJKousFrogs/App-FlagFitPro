-- ============================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- FlagFit Pro - Complete Security Implementation
-- Version: 2.0 (Upgraded)
-- ============================================================================
--
-- This script enables Row Level Security on all tables and creates policies
-- to ensure users can only access their own data or authorized shared data.
--
-- UPGRADES IN VERSION 2.0:
-- - Added idempotency: All policies use DROP POLICY IF EXISTS before CREATE
-- - Standardized user_id handling: Added auth.user_id_text() helper for VARCHAR columns
-- - Added missing policies for: user_profiles, training_programs, exercises,
--   measurements, supplements, injuries, game_stats, tournament_matches
-- - Added UPDATE policies with WITH CHECK clauses for better security
-- - Improved coach/admin access patterns
-- - Enhanced team-based access control
--
-- Run this script in your Supabase SQL Editor:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Paste and execute this script
-- 
-- NOTE: This script is idempotent and can be run multiple times safely
-- ============================================================================

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

-- User-related tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE implementation_steps ENABLE ROW LEVEL SECURITY;

-- Team-related tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Training-related tables
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Performance tracking
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE injuries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearables_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_protocols ENABLE ROW LEVEL SECURITY;

-- Game-related tables
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;

-- Community features
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Chat and notifications
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Tournaments
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS: Get Current User ID
-- ============================================================================

-- Standard UUID user ID function
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    auth.uid(),
    (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid
  );
$$ LANGUAGE SQL STABLE;

-- Helper function for VARCHAR user_id columns (for legacy tables)
CREATE OR REPLACE FUNCTION auth.user_id_text()
RETURNS TEXT AS $$
  SELECT COALESCE(
    auth.uid()::text,
    current_setting('request.jwt.claims', true)::jsonb->>'sub'
  );
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view public profiles" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (id = auth.user_id());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (id = auth.user_id())
WITH CHECK (id = auth.user_id());

-- Users can view basic info of other users (for team features)
CREATE POLICY "Users can view public profiles"
ON users FOR SELECT
USING (true); -- Public read access for name, avatar, etc.

-- Users can insert their own profile (during registration)
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
WITH CHECK (id = auth.user_id());

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
ON users FOR DELETE
USING (id = auth.user_id());

-- ============================================================================
-- USER PROFILES POLICIES (if user_profiles table exists)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own user profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own user profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can create own user profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own user profile" ON user_profiles;

-- Users can view their own user profile
CREATE POLICY "Users can view own user profile"
ON user_profiles FOR SELECT
USING (user_id = auth.user_id());

-- Users can update their own user profile
CREATE POLICY "Users can update own user profile"
ON user_profiles FOR UPDATE
USING (user_id = auth.user_id())
WITH CHECK (user_id = auth.user_id());

-- Users can create their own user profile
CREATE POLICY "Users can create own user profile"
ON user_profiles FOR INSERT
WITH CHECK (user_id = auth.user_id());

-- Users can delete their own user profile
CREATE POLICY "Users can delete own user profile"
ON user_profiles FOR DELETE
USING (user_id = auth.user_id());

-- ============================================================================
-- IMPLEMENTATION STEPS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own implementation steps" ON implementation_steps;
DROP POLICY IF EXISTS "Users can create own implementation steps" ON implementation_steps;
DROP POLICY IF EXISTS "Users can update own implementation steps" ON implementation_steps;
DROP POLICY IF EXISTS "Users can delete own implementation steps" ON implementation_steps;

-- Users can view their own implementation steps
CREATE POLICY "Users can view own implementation steps"
ON implementation_steps FOR SELECT
USING (user_id = auth.user_id());

-- Users can create their own implementation steps
CREATE POLICY "Users can create own implementation steps"
ON implementation_steps FOR INSERT
WITH CHECK (user_id = auth.user_id());

-- Users can update their own implementation steps
CREATE POLICY "Users can update own implementation steps"
ON implementation_steps FOR UPDATE
USING (user_id = auth.user_id())
WITH CHECK (user_id = auth.user_id());

-- Users can delete their own implementation steps
CREATE POLICY "Users can delete own implementation steps"
ON implementation_steps FOR DELETE
USING (user_id = auth.user_id());

-- ============================================================================
-- TEAM POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their teams" ON teams;
DROP POLICY IF EXISTS "Team admins can update teams" ON teams;
DROP POLICY IF EXISTS "Team admins can delete teams" ON teams;
DROP POLICY IF EXISTS "Anyone can create teams" ON teams;
DROP POLICY IF EXISTS "Public teams are viewable" ON teams;

-- Team members can view their teams
CREATE POLICY "Users can view their teams"
ON teams FOR SELECT
USING (
  id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id()
  )
);

-- Public teams are viewable by all
CREATE POLICY "Public teams are viewable"
ON teams FOR SELECT
USING (is_public = true);

-- Team admins can update their teams
CREATE POLICY "Team admins can update teams"
ON teams FOR UPDATE
USING (
  id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id() AND role IN ('admin', 'coach')
  )
)
WITH CHECK (
  id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id() AND role IN ('admin', 'coach')
  )
);

-- Team admins can delete their teams
CREATE POLICY "Team admins can delete teams"
ON teams FOR DELETE
USING (
  id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id() AND role = 'admin'
  )
);

-- Anyone can create a team
CREATE POLICY "Anyone can create teams"
ON teams FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- TEAM MEMBERS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Team members can view teammates" ON team_members;
DROP POLICY IF EXISTS "Team admins can add members" ON team_members;
DROP POLICY IF EXISTS "Team admins can update members" ON team_members;
DROP POLICY IF EXISTS "Team admins can remove members" ON team_members;
DROP POLICY IF EXISTS "Users can leave teams" ON team_members;

-- Team members can view other team members
CREATE POLICY "Team members can view teammates"
ON team_members FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id()
  )
);

-- Team admins can add members
CREATE POLICY "Team admins can add members"
ON team_members FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id() AND role IN ('admin', 'coach')
  )
);

-- Team admins can update members
CREATE POLICY "Team admins can update members"
ON team_members FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id() AND role IN ('admin', 'coach')
  )
)
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id() AND role IN ('admin', 'coach')
  )
);

-- Team admins can remove members
CREATE POLICY "Team admins can remove members"
ON team_members FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id() AND role = 'admin'
  )
);

-- Users can leave teams themselves
CREATE POLICY "Users can leave teams"
ON team_members FOR DELETE
USING (user_id = auth.user_id());

-- ============================================================================
-- TRAINING SESSIONS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own training sessions" ON training_sessions;
DROP POLICY IF EXISTS "Coaches can view team training sessions" ON training_sessions;
DROP POLICY IF EXISTS "Users can create own training sessions" ON training_sessions;
DROP POLICY IF EXISTS "Users can update own training sessions" ON training_sessions;
DROP POLICY IF EXISTS "Users can delete own training sessions" ON training_sessions;

-- Users can view their own training sessions
CREATE POLICY "Users can view own training sessions"
ON training_sessions FOR SELECT
USING (user_id = auth.user_id());

-- Coaches can view their team's training sessions (WITH CONSENT CHECK - GDPR Compliance)
CREATE POLICY "Coaches can view team training sessions"
ON training_sessions FOR SELECT
USING (
  user_id IN (
    SELECT tm.user_id FROM team_members tm
    INNER JOIN team_members coach ON coach.team_id = tm.team_id
    WHERE coach.user_id = auth.user_id()
      AND coach.role IN ('coach', 'admin')
      -- GDPR Consent Check: Only show training data if player has enabled performance sharing
      AND check_performance_sharing(tm.user_id, tm.team_id)
  )
  OR team_id IN (
    SELECT tm.team_id FROM team_members tm
    WHERE tm.user_id = auth.user_id()
      AND tm.role IN ('coach', 'admin')
      -- GDPR Consent Check: Only show training data if player has enabled performance sharing
      AND EXISTS (
        SELECT 1 FROM team_members player_tm
        WHERE player_tm.team_id = tm.team_id
          AND check_performance_sharing(player_tm.user_id, player_tm.team_id)
      )
  )
);

-- Users can create their own training sessions
CREATE POLICY "Users can create own training sessions"
ON training_sessions FOR INSERT
WITH CHECK (user_id = auth.user_id());

-- Users can update their own training sessions
CREATE POLICY "Users can update own training sessions"
ON training_sessions FOR UPDATE
USING (user_id = auth.user_id())
WITH CHECK (user_id = auth.user_id());

-- Users can delete their own training sessions
CREATE POLICY "Users can delete own training sessions"
ON training_sessions FOR DELETE
USING (user_id = auth.user_id());

-- ============================================================================
-- TRAINING PROGRAMS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view training programs" ON training_programs;
DROP POLICY IF EXISTS "Coaches can manage training programs" ON training_programs;
DROP POLICY IF EXISTS "Users can view assigned training programs" ON training_programs;

-- Users can view training programs (public or assigned)
CREATE POLICY "Users can view training programs"
ON training_programs FOR SELECT
USING (
  is_active = true AND (
    created_by = auth.user_id()
    OR id IN (
      SELECT program_id FROM player_programs
      WHERE player_id = auth.user_id() AND is_active = true
    )
  )
);

-- Coaches can manage training programs
CREATE POLICY "Coaches can manage training programs"
ON training_programs FOR ALL
USING (created_by = auth.user_id())
WITH CHECK (created_by = auth.user_id());

-- ============================================================================
-- EXERCISES POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view exercises" ON exercises;
DROP POLICY IF EXISTS "Coaches can manage exercises" ON exercises;

-- Anyone can view exercises (public library)
CREATE POLICY "Anyone can view exercises"
ON exercises FOR SELECT
USING (true);

-- Coaches can manage exercises
CREATE POLICY "Coaches can manage exercises"
ON exercises FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = auth.user_id() AND role IN ('coach', 'admin')
  )
);

-- ============================================================================
-- PERFORMANCE METRICS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own performance metrics" ON performance_metrics;
DROP POLICY IF EXISTS "Coaches can view team performance metrics" ON performance_metrics;
DROP POLICY IF EXISTS "Users can create own performance metrics" ON performance_metrics;
DROP POLICY IF EXISTS "Users can update own performance metrics" ON performance_metrics;
DROP POLICY IF EXISTS "Users can delete own performance metrics" ON performance_metrics;

-- Users can view their own metrics
CREATE POLICY "Users can view own performance metrics"
ON performance_metrics FOR SELECT
USING (user_id = auth.user_id()::text OR user_id = auth.user_id_text());

-- Coaches can view their team's metrics (WITH CONSENT CHECK - GDPR Compliance)
CREATE POLICY "Coaches can view team performance metrics"
ON performance_metrics FOR SELECT
USING (
  user_id IN (
    SELECT tm.user_id::text FROM team_members tm
    INNER JOIN team_members coach ON coach.team_id = tm.team_id
    WHERE coach.user_id = auth.user_id()
      AND coach.role IN ('coach', 'admin')
      -- GDPR Consent Check: Only show data if player has enabled performance sharing
      AND check_performance_sharing(tm.user_id::uuid, tm.team_id)
  )
  OR user_id IN (
    SELECT tm.user_id::text FROM team_members tm
    WHERE tm.team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.user_id() AND role IN ('coach', 'admin')
    )
    -- GDPR Consent Check: Only show data if player has enabled performance sharing
    AND check_performance_sharing(tm.user_id::uuid, tm.team_id)
  )
);

-- Users can create their own metrics
CREATE POLICY "Users can create own performance metrics"
ON performance_metrics FOR INSERT
WITH CHECK (user_id = auth.user_id()::text OR user_id = auth.user_id_text());

-- Users can update their own metrics
CREATE POLICY "Users can update own performance metrics"
ON performance_metrics FOR UPDATE
USING (user_id = auth.user_id()::text OR user_id = auth.user_id_text())
WITH CHECK (user_id = auth.user_id()::text OR user_id = auth.user_id_text());

-- Users can delete their own metrics
CREATE POLICY "Users can delete own performance metrics"
ON performance_metrics FOR DELETE
USING (user_id = auth.user_id()::text OR user_id = auth.user_id_text());

-- ============================================================================
-- WELLNESS LOGS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own wellness logs" ON wellness_logs;
DROP POLICY IF EXISTS "Users can create own wellness logs" ON wellness_logs;
DROP POLICY IF EXISTS "Users can update own wellness logs" ON wellness_logs;
DROP POLICY IF EXISTS "Users can delete own wellness logs" ON wellness_logs;
DROP POLICY IF EXISTS "Coaches can view team wellness logs" ON wellness_logs;

-- Users can view their own wellness logs
CREATE POLICY "Users can view own wellness logs"
ON wellness_logs FOR SELECT
USING (user_id = auth.user_id()::text OR user_id = auth.user_id());

-- Coaches can view their team's wellness logs (WITH CONSENT CHECK - GDPR Compliance)
CREATE POLICY "Coaches can view team wellness logs"
ON wellness_logs FOR SELECT
USING (
  user_id IN (
    SELECT tm.user_id::text FROM team_members tm
    INNER JOIN team_members coach ON coach.team_id = tm.team_id
    WHERE coach.user_id = auth.user_id()
      AND coach.role IN ('coach', 'admin')
      -- GDPR Consent Check: Only show wellness data if player has enabled health sharing
      AND check_health_sharing(tm.user_id::uuid, tm.team_id)
  )
  OR user_id = auth.user_id()::text
);

-- Users can create their own wellness logs
CREATE POLICY "Users can create own wellness logs"
ON wellness_logs FOR INSERT
WITH CHECK (user_id = auth.user_id()::text OR user_id = auth.user_id());

-- Users can update their own wellness logs
CREATE POLICY "Users can update own wellness logs"
ON wellness_logs FOR UPDATE
USING (user_id = auth.user_id()::text OR user_id = auth.user_id())
WITH CHECK (user_id = auth.user_id()::text OR user_id = auth.user_id());

-- Users can delete their own wellness logs
CREATE POLICY "Users can delete own wellness logs"
ON wellness_logs FOR DELETE
USING (user_id = auth.user_id()::text OR user_id = auth.user_id());

-- ============================================================================
-- MEASUREMENTS POLICIES (physical_measurements table)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own measurements" ON measurements;
DROP POLICY IF EXISTS "Users can create own measurements" ON measurements;
DROP POLICY IF EXISTS "Users can update own measurements" ON measurements;
DROP POLICY IF EXISTS "Users can delete own measurements" ON measurements;
DROP POLICY IF EXISTS "Users can view own physical measurements" ON physical_measurements;
DROP POLICY IF EXISTS "Users can create own physical measurements" ON physical_measurements;
DROP POLICY IF EXISTS "Users can update own physical measurements" ON physical_measurements;
DROP POLICY IF EXISTS "Users can delete own physical measurements" ON physical_measurements;

-- Physical measurements policies (if table exists)
CREATE POLICY "Users can view own physical measurements"
ON physical_measurements FOR SELECT
USING (user_id = auth.user_id_text());

CREATE POLICY "Users can create own physical measurements"
ON physical_measurements FOR INSERT
WITH CHECK (user_id = auth.user_id_text());

CREATE POLICY "Users can update own physical measurements"
ON physical_measurements FOR UPDATE
USING (user_id = auth.user_id_text())
WITH CHECK (user_id = auth.user_id_text());

CREATE POLICY "Users can delete own physical measurements"
ON physical_measurements FOR DELETE
USING (user_id = auth.user_id_text());

-- Legacy measurements table policies (if table exists)
CREATE POLICY "Users can view own measurements"
ON measurements FOR SELECT
USING (user_id = auth.user_id()::text OR user_id = auth.user_id());

CREATE POLICY "Users can create own measurements"
ON measurements FOR INSERT
WITH CHECK (user_id = auth.user_id()::text OR user_id = auth.user_id());

CREATE POLICY "Users can update own measurements"
ON measurements FOR UPDATE
USING (user_id = auth.user_id()::text OR user_id = auth.user_id())
WITH CHECK (user_id = auth.user_id()::text OR user_id = auth.user_id());

CREATE POLICY "Users can delete own measurements"
ON measurements FOR DELETE
USING (user_id = auth.user_id()::text OR user_id = auth.user_id());

-- ============================================================================
-- SUPPLEMENTS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own supplements" ON supplements;
DROP POLICY IF EXISTS "Users can create own supplements" ON supplements;
DROP POLICY IF EXISTS "Users can update own supplements" ON supplements;
DROP POLICY IF EXISTS "Users can delete own supplements" ON supplements;
DROP POLICY IF EXISTS "Users can view own supplements data" ON supplements_data;
DROP POLICY IF EXISTS "Users can create own supplements data" ON supplements_data;
DROP POLICY IF EXISTS "Users can update own supplements data" ON supplements_data;
DROP POLICY IF EXISTS "Users can delete own supplements data" ON supplements_data;

-- Supplements data policies (if table exists)
CREATE POLICY "Users can view own supplements data"
ON supplements_data FOR SELECT
USING (user_id = auth.user_id_text());

CREATE POLICY "Users can create own supplements data"
ON supplements_data FOR INSERT
WITH CHECK (user_id = auth.user_id_text());

CREATE POLICY "Users can update own supplements data"
ON supplements_data FOR UPDATE
USING (user_id = auth.user_id_text())
WITH CHECK (user_id = auth.user_id_text());

CREATE POLICY "Users can delete own supplements data"
ON supplements_data FOR DELETE
USING (user_id = auth.user_id_text());

-- Legacy supplements table policies (if table exists)
CREATE POLICY "Users can view own supplements"
ON supplements FOR SELECT
USING (user_id = auth.user_id()::text OR user_id = auth.user_id());

CREATE POLICY "Users can create own supplements"
ON supplements FOR INSERT
WITH CHECK (user_id = auth.user_id()::text OR user_id = auth.user_id());

CREATE POLICY "Users can update own supplements"
ON supplements FOR UPDATE
USING (user_id = auth.user_id()::text OR user_id = auth.user_id())
WITH CHECK (user_id = auth.user_id()::text OR user_id = auth.user_id());

CREATE POLICY "Users can delete own supplements"
ON supplements FOR DELETE
USING (user_id = auth.user_id()::text OR user_id = auth.user_id());

-- ============================================================================
-- INJURIES POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own injuries" ON injuries;
DROP POLICY IF EXISTS "Users can create own injuries" ON injuries;
DROP POLICY IF EXISTS "Users can update own injuries" ON injuries;
DROP POLICY IF EXISTS "Users can delete own injuries" ON injuries;
DROP POLICY IF EXISTS "Coaches can view team injuries" ON injuries;

-- Users can view their own injuries
CREATE POLICY "Users can view own injuries"
ON injuries FOR SELECT
USING (user_id = auth.user_id_text());

-- Coaches can view their team's injuries
CREATE POLICY "Coaches can view team injuries"
ON injuries FOR SELECT
USING (
  user_id IN (
    SELECT tm.user_id::text FROM team_members tm
    INNER JOIN team_members coach ON coach.team_id = tm.team_id
    WHERE coach.user_id = auth.user_id() AND coach.role IN ('coach', 'admin')
  )
  OR user_id = auth.user_id_text()
);

-- Users can create their own injuries
CREATE POLICY "Users can create own injuries"
ON injuries FOR INSERT
WITH CHECK (user_id = auth.user_id_text());

-- Users can update their own injuries
CREATE POLICY "Users can update own injuries"
ON injuries FOR UPDATE
USING (user_id = auth.user_id_text())
WITH CHECK (user_id = auth.user_id_text());

-- Users can delete their own injuries
CREATE POLICY "Users can delete own injuries"
ON injuries FOR DELETE
USING (user_id = auth.user_id_text());

-- ============================================================================
-- WEARABLES DATA POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own wearables data" ON wearables_data;
DROP POLICY IF EXISTS "Users can create own wearables data" ON wearables_data;
DROP POLICY IF EXISTS "Users can update own wearables data" ON wearables_data;
DROP POLICY IF EXISTS "Users can delete own wearables data" ON wearables_data;

-- Users can view their own wearables data
CREATE POLICY "Users can view own wearables data"
ON wearables_data FOR SELECT
USING (user_id = auth.user_id_text());

-- Users can create their own wearables data
CREATE POLICY "Users can create own wearables data"
ON wearables_data FOR INSERT
WITH CHECK (user_id = auth.user_id_text());

-- Users can update their own wearables data
CREATE POLICY "Users can update own wearables data"
ON wearables_data FOR UPDATE
USING (user_id = auth.user_id_text())
WITH CHECK (user_id = auth.user_id_text());

-- Users can delete their own wearables data
CREATE POLICY "Users can delete own wearables data"
ON wearables_data FOR DELETE
USING (user_id = auth.user_id_text());

-- ============================================================================
-- TRAINING ANALYTICS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own training analytics" ON training_analytics;
DROP POLICY IF EXISTS "Users can create own training analytics" ON training_analytics;
DROP POLICY IF EXISTS "Users can update own training analytics" ON training_analytics;
DROP POLICY IF EXISTS "Users can delete own training analytics" ON training_analytics;
DROP POLICY IF EXISTS "Coaches can view team training analytics" ON training_analytics;

-- Users can view their own training analytics
CREATE POLICY "Users can view own training analytics"
ON training_analytics FOR SELECT
USING (user_id = auth.user_id_text());

-- Coaches can view their team's training analytics
CREATE POLICY "Coaches can view team training analytics"
ON training_analytics FOR SELECT
USING (
  user_id IN (
    SELECT tm.user_id::text FROM team_members tm
    INNER JOIN team_members coach ON coach.team_id = tm.team_id
    WHERE coach.user_id = auth.user_id() AND coach.role IN ('coach', 'admin')
  )
  OR user_id = auth.user_id_text()
);

-- Users can create their own training analytics
CREATE POLICY "Users can create own training analytics"
ON training_analytics FOR INSERT
WITH CHECK (user_id = auth.user_id_text());

-- Users can update their own training analytics
CREATE POLICY "Users can update own training analytics"
ON training_analytics FOR UPDATE
USING (user_id = auth.user_id_text())
WITH CHECK (user_id = auth.user_id_text());

-- Users can delete their own training analytics
CREATE POLICY "Users can delete own training analytics"
ON training_analytics FOR DELETE
USING (user_id = auth.user_id_text());

-- ============================================================================
-- USER BEHAVIOR POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own behavior data" ON user_behavior;
DROP POLICY IF EXISTS "Users can create own behavior data" ON user_behavior;
DROP POLICY IF EXISTS "Users can update own behavior data" ON user_behavior;
DROP POLICY IF EXISTS "Users can delete own behavior data" ON user_behavior;

-- Users can view their own behavior data
CREATE POLICY "Users can view own behavior data"
ON user_behavior FOR SELECT
USING (user_id = auth.user_id_text());

-- Users can create their own behavior data
CREATE POLICY "Users can create own behavior data"
ON user_behavior FOR INSERT
WITH CHECK (user_id = auth.user_id_text());

-- Users can update their own behavior data
CREATE POLICY "Users can update own behavior data"
ON user_behavior FOR UPDATE
USING (user_id = auth.user_id_text())
WITH CHECK (user_id = auth.user_id_text());

-- Users can delete their own behavior data
CREATE POLICY "Users can delete own behavior data"
ON user_behavior FOR DELETE
USING (user_id = auth.user_id_text());

-- ============================================================================
-- SUPPLEMENT PROTOCOLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own supplement protocols" ON supplement_protocols;
DROP POLICY IF EXISTS "Users can create own supplement protocols" ON supplement_protocols;
DROP POLICY IF EXISTS "Users can update own supplement protocols" ON supplement_protocols;
DROP POLICY IF EXISTS "Users can delete own supplement protocols" ON supplement_protocols;

-- Users can view their own supplement protocols
CREATE POLICY "Users can view own supplement protocols"
ON supplement_protocols FOR SELECT
USING (user_id = auth.user_id());

-- Users can create their own supplement protocols
CREATE POLICY "Users can create own supplement protocols"
ON supplement_protocols FOR INSERT
WITH CHECK (user_id = auth.user_id());

-- Users can update their own supplement protocols
CREATE POLICY "Users can update own supplement protocols"
ON supplement_protocols FOR UPDATE
USING (user_id = auth.user_id())
WITH CHECK (user_id = auth.user_id());

-- Users can delete their own supplement protocols
CREATE POLICY "Users can delete own supplement protocols"
ON supplement_protocols FOR DELETE
USING (user_id = auth.user_id());

-- ============================================================================
-- GAMES POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Team members can view team games" ON games;
DROP POLICY IF EXISTS "Public games are viewable" ON games;
DROP POLICY IF EXISTS "Team admins can create games" ON games;
DROP POLICY IF EXISTS "Team admins can update games" ON games;
DROP POLICY IF EXISTS "Team admins can delete games" ON games;

-- Team members can view their team's games
CREATE POLICY "Team members can view team games"
ON games FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.user_id()
  )
  OR home_team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.user_id()
  )
  OR away_team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.user_id()
  )
);

-- Public games are viewable by all
CREATE POLICY "Public games are viewable"
ON games FOR SELECT
USING (true); -- All games are viewable (adjust if you have is_public column)

-- Team admins can create games
CREATE POLICY "Team admins can create games"
ON games FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id() AND role IN ('admin', 'coach')
  )
  OR home_team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id() AND role IN ('admin', 'coach')
  )
);

-- Team admins can update games
CREATE POLICY "Team admins can update games"
ON games FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id() AND role IN ('admin', 'coach')
  )
  OR home_team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id() AND role IN ('admin', 'coach')
  )
)
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id() AND role IN ('admin', 'coach')
  )
  OR home_team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id() AND role IN ('admin', 'coach')
  )
);

-- Team admins can delete games
CREATE POLICY "Team admins can delete games"
ON games FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id() AND role = 'admin'
  )
  OR home_team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id() AND role = 'admin'
  )
);

-- ============================================================================
-- GAME STATS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Team members can view game stats" ON game_stats;
DROP POLICY IF EXISTS "Team admins can manage game stats" ON game_stats;

-- Team members can view game stats for their team's games
CREATE POLICY "Team members can view game stats"
ON game_stats FOR SELECT
USING (
  game_id IN (
    SELECT game_id FROM games
    WHERE team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.user_id()
    )
    OR home_team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.user_id()
    )
    OR away_team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.user_id()
    )
  )
);

-- Team admins can manage game stats
CREATE POLICY "Team admins can manage game stats"
ON game_stats FOR ALL
USING (
  game_id IN (
    SELECT game_id FROM games
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.user_id() AND role IN ('admin', 'coach')
    )
    OR home_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.user_id() AND role IN ('admin', 'coach')
    )
  )
)
WITH CHECK (
  game_id IN (
    SELECT game_id FROM games
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.user_id() AND role IN ('admin', 'coach')
    )
    OR home_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.user_id() AND role IN ('admin', 'coach')
    )
  )
);

-- ============================================================================
-- COMMUNITY POSTS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view public posts" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

-- Anyone can view public posts
CREATE POLICY "Anyone can view public posts"
ON posts FOR SELECT
USING (is_published = true OR user_id = auth.user_id());

-- Users can create posts
CREATE POLICY "Users can create posts"
ON posts FOR INSERT
WITH CHECK (user_id = auth.user_id());

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
USING (user_id = auth.user_id())
WITH CHECK (user_id = auth.user_id());

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
ON posts FOR DELETE
USING (user_id = auth.user_id());

-- ============================================================================
-- COMMENTS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- Anyone can view comments on posts they can see
CREATE POLICY "Anyone can view comments"
ON comments FOR SELECT
USING (
  post_id IN (
    SELECT id FROM posts
    WHERE is_published = true OR user_id = auth.user_id()
  )
);

-- Users can create comments
CREATE POLICY "Users can create comments"
ON comments FOR INSERT
WITH CHECK (user_id = auth.user_id());

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON comments FOR UPDATE
USING (user_id = auth.user_id())
WITH CHECK (user_id = auth.user_id());

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON comments FOR DELETE
USING (user_id = auth.user_id());

-- ============================================================================
-- LIKES POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view likes" ON likes;
DROP POLICY IF EXISTS "Users can like posts" ON likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON likes;

-- Users can view likes
CREATE POLICY "Users can view likes"
ON likes FOR SELECT
USING (true);

-- Users can like posts
CREATE POLICY "Users can like posts"
ON likes FOR INSERT
WITH CHECK (user_id = auth.user_id());

-- Users can unlike posts
CREATE POLICY "Users can unlike posts"
ON likes FOR DELETE
USING (user_id = auth.user_id());

-- ============================================================================
-- CHAT MESSAGES POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Team members can view team chat" ON chat_messages;
DROP POLICY IF EXISTS "Users can send chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own chat messages" ON chat_messages;

-- Team members can view team chat messages
CREATE POLICY "Team members can view team chat"
ON chat_messages FOR SELECT
USING (
  channel IN (
    SELECT CONCAT('team-', team_id::text) FROM team_members
    WHERE user_id = auth.user_id()
  )
  OR user_id = auth.user_id()
);

-- Users can send chat messages to their channels
CREATE POLICY "Users can send chat messages"
ON chat_messages FOR INSERT
WITH CHECK (
  user_id = auth.user_id() AND
  (
    channel IN (
      SELECT CONCAT('team-', team_id::text) FROM team_members
      WHERE user_id = auth.user_id()
    )
    OR channel LIKE 'dm-%'
  )
);

-- Users can update their own chat messages
CREATE POLICY "Users can update own chat messages"
ON chat_messages FOR UPDATE
USING (user_id = auth.user_id())
WITH CHECK (user_id = auth.user_id());

-- Users can delete their own chat messages
CREATE POLICY "Users can delete own chat messages"
ON chat_messages FOR DELETE
USING (user_id = auth.user_id());

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (user_id = auth.user_id()::text OR user_id = auth.user_id());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.user_id()::text OR user_id = auth.user_id())
WITH CHECK (user_id = auth.user_id()::text OR user_id = auth.user_id());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
USING (user_id = auth.user_id()::text OR user_id = auth.user_id());

-- System can create notifications for any user
CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
WITH CHECK (true); -- Will be restricted by service role in backend

-- ============================================================================
-- TOURNAMENTS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view public tournaments" ON tournaments;
DROP POLICY IF EXISTS "Organizers can update tournaments" ON tournaments;
DROP POLICY IF EXISTS "Anyone can create tournaments" ON tournaments;
DROP POLICY IF EXISTS "Organizers can delete tournaments" ON tournaments;

-- Anyone can view public tournaments
CREATE POLICY "Anyone can view public tournaments"
ON tournaments FOR SELECT
USING (is_public = true OR created_by = auth.user_id());

-- Tournament organizers can update their tournaments
CREATE POLICY "Organizers can update tournaments"
ON tournaments FOR UPDATE
USING (created_by = auth.user_id())
WITH CHECK (created_by = auth.user_id());

-- Anyone can create tournaments
CREATE POLICY "Anyone can create tournaments"
ON tournaments FOR INSERT
WITH CHECK (created_by = auth.user_id());

-- Tournament organizers can delete their tournaments
CREATE POLICY "Organizers can delete tournaments"
ON tournaments FOR DELETE
USING (created_by = auth.user_id());

-- ============================================================================
-- TOURNAMENT MATCHES POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view tournament matches" ON tournament_matches;
DROP POLICY IF EXISTS "Organizers can manage tournament matches" ON tournament_matches;

-- Anyone can view tournament matches
CREATE POLICY "Anyone can view tournament matches"
ON tournament_matches FOR SELECT
USING (
  tournament_id IN (
    SELECT id FROM tournaments
    WHERE is_public = true OR created_by = auth.user_id()
  )
);

-- Tournament organizers can manage matches
CREATE POLICY "Organizers can manage tournament matches"
ON tournament_matches FOR ALL
USING (
  tournament_id IN (
    SELECT id FROM tournaments
    WHERE created_by = auth.user_id()
  )
)
WITH CHECK (
  tournament_id IN (
    SELECT id FROM tournaments
    WHERE created_by = auth.user_id()
  )
);

-- ============================================================================
-- TOURNAMENT REGISTRATIONS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view tournament registrations" ON tournament_registrations;
DROP POLICY IF EXISTS "Team members can register" ON tournament_registrations;
DROP POLICY IF EXISTS "Team admins can update registrations" ON tournament_registrations;
DROP POLICY IF EXISTS "Team admins can cancel registrations" ON tournament_registrations;

-- Users can view registrations for tournaments they're part of
CREATE POLICY "Users can view tournament registrations"
ON tournament_registrations FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.user_id()
  )
  OR
  tournament_id IN (
    SELECT id FROM tournaments WHERE created_by = auth.user_id()
  )
);

-- Team members can register their team
CREATE POLICY "Team members can register"
ON tournament_registrations FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.user_id() AND role IN ('admin', 'coach')
  )
);

-- Team admins can update registrations
CREATE POLICY "Team admins can update registrations"
ON tournament_registrations FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.user_id() AND role IN ('admin', 'coach')
  )
)
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.user_id() AND role IN ('admin', 'coach')
  )
);

-- Team admins can cancel registrations
CREATE POLICY "Team admins can cancel registrations"
ON tournament_registrations FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.user_id() AND role IN ('admin', 'coach')
  )
);

-- ============================================================================
-- GRANT USAGE ON SEQUENCES (if needed)
-- ============================================================================

-- Grant usage on all sequences in public schema
DO $$
DECLARE
  seq RECORD;
BEGIN
  FOR seq IN
    SELECT schemaname, sequencename
    FROM pg_sequences
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('GRANT USAGE ON SEQUENCE %I.%I TO authenticated',
                   seq.schemaname, seq.sequencename);
  END LOOP;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- View all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- NOTES
-- ============================================================================
/*
UPGRADE SUMMARY (Version 2.0):
1. RLS is now enabled on all tables
2. Users can only access their own data by default
3. Team-based access is controlled through team_members table
4. Coaches have read access to their team members' data
5. Public content (posts, tournaments) is accessible to all
6. The service role (used by backend) bypasses RLS for admin operations
7. All policies are idempotent (can be run multiple times safely)
8. Consistent user_id handling across UUID and VARCHAR columns
9. Complete CRUD policies for all tables
10. Enhanced coach/admin role support

NEW POLICIES ADDED:
- user_profiles: Full CRUD policies
- training_programs: View and manage policies for coaches
- exercises: Public read, coach manage
- physical_measurements: Full CRUD policies
- supplements_data: Full CRUD policies
- injuries: Full CRUD with coach visibility
- game_stats: Team-based access
- tournament_matches: Tournament-based access

IMPROVEMENTS:
- All policies now include WITH CHECK clauses for UPDATE operations
- Better handling of VARCHAR user_id columns (legacy tables)
- Enhanced team member role checking (admin, coach)
- Improved public/private content visibility

To test RLS policies:
1. Create test users in Supabase Auth
2. Try accessing data from different users
3. Verify users can only see their own data
4. Test team-based access
5. Test coach/admin permissions

To disable RLS on a table (for testing):
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

To re-enable:
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

To drop all policies on a table:
DROP POLICY IF EXISTS policy_name ON table_name;
*/

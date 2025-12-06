-- ============================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- FlagFit Pro - Complete Security Implementation
-- ============================================================================
--
-- This script enables Row Level Security on all tables and creates policies
-- to ensure users can only access their own data or authorized shared data.
--
-- Run this script in your Supabase SQL Editor:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Paste and execute this script
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
-- HELPER FUNCTION: Get Current User ID
-- ============================================================================

CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    auth.uid(),
    (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid
  );
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (id = auth.user_id());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (id = auth.user_id());

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
-- IMPLEMENTATION STEPS POLICIES
-- ============================================================================

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

-- Team members can view their teams
CREATE POLICY "Users can view their teams"
ON teams FOR SELECT
USING (
  id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id()
  )
);

-- Team admins can update their teams
CREATE POLICY "Team admins can update teams"
ON teams FOR UPDATE
USING (
  id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id() AND role = 'admin'
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
    WHERE user_id = auth.user_id() AND role = 'admin'
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

-- ============================================================================
-- TRAINING SESSIONS POLICIES
-- ============================================================================

-- Users can view their own training sessions
CREATE POLICY "Users can view own training sessions"
ON training_sessions FOR SELECT
USING (user_id = auth.user_id());

-- Coaches can view their team's training sessions
CREATE POLICY "Coaches can view team training sessions"
ON training_sessions FOR SELECT
USING (
  user_id IN (
    SELECT tm.user_id FROM team_members tm
    INNER JOIN team_members coach ON coach.team_id = tm.team_id
    WHERE coach.user_id = auth.user_id() AND coach.role = 'coach'
  )
);

-- Users can create their own training sessions
CREATE POLICY "Users can create own training sessions"
ON training_sessions FOR INSERT
WITH CHECK (user_id = auth.user_id());

-- Users can update their own training sessions
CREATE POLICY "Users can update own training sessions"
ON training_sessions FOR UPDATE
USING (user_id = auth.user_id());

-- Users can delete their own training sessions
CREATE POLICY "Users can delete own training sessions"
ON training_sessions FOR DELETE
USING (user_id = auth.user_id());

-- ============================================================================
-- PERFORMANCE METRICS POLICIES
-- ============================================================================

-- Users can view their own metrics
CREATE POLICY "Users can view own performance metrics"
ON performance_metrics FOR SELECT
USING (user_id = auth.user_id());

-- Coaches can view their team's metrics
CREATE POLICY "Coaches can view team performance metrics"
ON performance_metrics FOR SELECT
USING (
  user_id IN (
    SELECT tm.user_id FROM team_members tm
    INNER JOIN team_members coach ON coach.team_id = tm.team_id
    WHERE coach.user_id = auth.user_id() AND coach.role = 'coach'
  )
);

-- Users can create their own metrics
CREATE POLICY "Users can create own performance metrics"
ON performance_metrics FOR INSERT
WITH CHECK (user_id = auth.user_id());

-- Users can update their own metrics
CREATE POLICY "Users can update own performance metrics"
ON performance_metrics FOR UPDATE
USING (user_id = auth.user_id());

-- ============================================================================
-- WELLNESS LOGS POLICIES
-- ============================================================================

-- Users can view their own wellness logs
CREATE POLICY "Users can view own wellness logs"
ON wellness_logs FOR SELECT
USING (user_id = auth.user_id());

-- Users can create their own wellness logs
CREATE POLICY "Users can create own wellness logs"
ON wellness_logs FOR INSERT
WITH CHECK (user_id = auth.user_id());

-- Users can update their own wellness logs
CREATE POLICY "Users can update own wellness logs"
ON wellness_logs FOR UPDATE
USING (user_id = auth.user_id());

-- Users can delete their own wellness logs
CREATE POLICY "Users can delete own wellness logs"
ON wellness_logs FOR DELETE
USING (user_id = auth.user_id());

-- ============================================================================
-- WEARABLES DATA POLICIES
-- ============================================================================

-- Users can view their own wearables data
CREATE POLICY "Users can view own wearables data"
ON wearables_data FOR SELECT
USING (user_id = (SELECT auth.uid())::text);

-- Users can create their own wearables data
CREATE POLICY "Users can create own wearables data"
ON wearables_data FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid())::text);

-- Users can update their own wearables data
CREATE POLICY "Users can update own wearables data"
ON wearables_data FOR UPDATE
USING (user_id = (SELECT auth.uid())::text);

-- Users can delete their own wearables data
CREATE POLICY "Users can delete own wearables data"
ON wearables_data FOR DELETE
USING (user_id = (SELECT auth.uid())::text);

-- ============================================================================
-- TRAINING ANALYTICS POLICIES
-- ============================================================================

-- Users can view their own training analytics
CREATE POLICY "Users can view own training analytics"
ON training_analytics FOR SELECT
USING (user_id = (SELECT auth.uid())::text);

-- Users can create their own training analytics
CREATE POLICY "Users can create own training analytics"
ON training_analytics FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid())::text);

-- Users can update their own training analytics
CREATE POLICY "Users can update own training analytics"
ON training_analytics FOR UPDATE
USING (user_id = (SELECT auth.uid())::text);

-- Users can delete their own training analytics
CREATE POLICY "Users can delete own training analytics"
ON training_analytics FOR DELETE
USING (user_id = (SELECT auth.uid())::text);

-- ============================================================================
-- USER BEHAVIOR POLICIES
-- ============================================================================

-- Users can view their own behavior data
CREATE POLICY "Users can view own behavior data"
ON user_behavior FOR SELECT
USING (user_id = (SELECT auth.uid())::text);

-- Users can create their own behavior data
CREATE POLICY "Users can create own behavior data"
ON user_behavior FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid())::text);

-- Users can update their own behavior data
CREATE POLICY "Users can update own behavior data"
ON user_behavior FOR UPDATE
USING (user_id = (SELECT auth.uid())::text);

-- Users can delete their own behavior data
CREATE POLICY "Users can delete own behavior data"
ON user_behavior FOR DELETE
USING (user_id = (SELECT auth.uid())::text);

-- ============================================================================
-- SUPPLEMENT PROTOCOLS POLICIES
-- ============================================================================

-- Users can view their own supplement protocols
CREATE POLICY "Users can view own supplement protocols"
ON supplement_protocols FOR SELECT
USING (user_id = (SELECT auth.uid()));

-- Users can create their own supplement protocols
CREATE POLICY "Users can create own supplement protocols"
ON supplement_protocols FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can update their own supplement protocols
CREATE POLICY "Users can update own supplement protocols"
ON supplement_protocols FOR UPDATE
USING (user_id = (SELECT auth.uid()));

-- Users can delete their own supplement protocols
CREATE POLICY "Users can delete own supplement protocols"
ON supplement_protocols FOR DELETE
USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- GAMES POLICIES
-- ============================================================================

-- Team members can view their team's games
CREATE POLICY "Team members can view team games"
ON games FOR SELECT
USING (
  home_team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.user_id()
  )
  OR
  away_team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.user_id()
  )
);

-- Public games are viewable by all
CREATE POLICY "Public games are viewable"
ON games FOR SELECT
USING (is_public = true);

-- Team admins can create games
CREATE POLICY "Team admins can create games"
ON games FOR INSERT
WITH CHECK (
  home_team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id() AND role IN ('admin', 'coach')
  )
);

-- ============================================================================
-- COMMUNITY POSTS POLICIES
-- ============================================================================

-- Anyone can view public posts
CREATE POLICY "Anyone can view public posts"
ON posts FOR SELECT
USING (is_public = true OR user_id = auth.user_id());

-- Users can create posts
CREATE POLICY "Users can create posts"
ON posts FOR INSERT
WITH CHECK (user_id = auth.user_id());

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
USING (user_id = auth.user_id());

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
ON posts FOR DELETE
USING (user_id = auth.user_id());

-- ============================================================================
-- COMMENTS POLICIES
-- ============================================================================

-- Anyone can view comments on posts they can see
CREATE POLICY "Anyone can view comments"
ON comments FOR SELECT
USING (
  post_id IN (
    SELECT id FROM posts
    WHERE is_public = true OR user_id = auth.user_id()
  )
);

-- Users can create comments
CREATE POLICY "Users can create comments"
ON comments FOR INSERT
WITH CHECK (user_id = auth.user_id());

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON comments FOR UPDATE
USING (user_id = auth.user_id());

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON comments FOR DELETE
USING (user_id = auth.user_id());

-- ============================================================================
-- LIKES POLICIES
-- ============================================================================

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

-- Team members can view team chat messages
CREATE POLICY "Team members can view team chat"
ON chat_messages FOR SELECT
USING (
  channel IN (
    SELECT CONCAT('team-', team_id) FROM team_members
    WHERE user_id = auth.user_id()
  )
  OR user_id = auth.user_id()
);

-- Users can send chat messages to their channels
CREATE POLICY "Users can send chat messages"
ON chat_messages FOR INSERT
WITH CHECK (
  user_id = auth.user_id() AND
  channel IN (
    SELECT CONCAT('team-', team_id) FROM team_members
    WHERE user_id = auth.user_id()
  )
);

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (user_id = auth.user_id());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.user_id());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
USING (user_id = auth.user_id());

-- System can create notifications for any user
CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
WITH CHECK (true); -- Will be restricted by service role in backend

-- ============================================================================
-- TOURNAMENTS POLICIES
-- ============================================================================

-- Anyone can view public tournaments
CREATE POLICY "Anyone can view public tournaments"
ON tournaments FOR SELECT
USING (is_public = true);

-- Tournament organizers can update their tournaments
CREATE POLICY "Organizers can update tournaments"
ON tournaments FOR UPDATE
USING (created_by = auth.user_id());

-- Anyone can create tournaments
CREATE POLICY "Anyone can create tournaments"
ON tournaments FOR INSERT
WITH CHECK (created_by = auth.user_id());

-- ============================================================================
-- TOURNAMENT REGISTRATIONS POLICIES
-- ============================================================================

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
    SELECT team_id FROM team_members WHERE user_id = auth.user_id()
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
1. RLS is now enabled on all tables
2. Users can only access their own data by default
3. Team-based access is controlled through team_members table
4. Coaches have read access to their team members' data
5. Public content (posts, tournaments) is accessible to all
6. The service role (used by backend) bypasses RLS for admin operations

To test RLS policies:
1. Create test users in Supabase Auth
2. Try accessing data from different users
3. Verify users can only see their own data
4. Test team-based access

To disable RLS on a table (for testing):
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

To re-enable:
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
*/

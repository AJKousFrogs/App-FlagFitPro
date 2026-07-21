-- CRITICAL: Enable Row-Level Security on tables missing RLS
-- Issue: Several tables were created without RLS, exposing them publicly
-- Fix: Enable RLS and add appropriate policies for each table

-- ============================================================================
-- Posts & Engagement (User-Generated Content)
-- ============================================================================

ALTER TABLE IF EXISTS public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.post_likes ENABLE ROW LEVEL SECURITY;

-- Posts: Users can read all posts, but only edit/delete their own
CREATE POLICY posts_select ON public.posts
  FOR SELECT USING (true);

CREATE POLICY posts_insert ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY posts_update ON public.posts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY posts_delete ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- Post likes: Users can read all likes, but only create/delete their own
CREATE POLICY post_likes_select ON public.post_likes
  FOR SELECT USING (true);

CREATE POLICY post_likes_insert ON public.post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY post_likes_delete ON public.post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- Privacy & Consent (Sensitive User Data)
-- ============================================================================

ALTER TABLE IF EXISTS public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.parental_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_sharing_settings ENABLE ROW LEVEL SECURITY;

-- Privacy settings: Users can only access their own
CREATE POLICY privacy_settings_own ON public.privacy_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY privacy_settings_insert ON public.privacy_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY privacy_settings_update ON public.privacy_settings
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY privacy_settings_delete ON public.privacy_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Parental consent: Users can access their own + staff can access team's
CREATE POLICY parental_consent_own ON public.parental_consent
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('owner', 'admin', 'head_coach', 'coach')
    )
  );

CREATE POLICY parental_consent_insert ON public.parental_consent
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY parental_consent_update ON public.parental_consent
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Team sharing settings: Team members only
CREATE POLICY team_sharing_settings_select ON public.team_sharing_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.team_id = team_sharing_settings.team_id
    )
  );

CREATE POLICY team_sharing_settings_update ON public.team_sharing_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.team_id = team_sharing_settings.team_id
        AND tm.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- Training & Exercise Data
-- ============================================================================

ALTER TABLE IF EXISTS public.training_session_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exercise_progressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.movement_patterns ENABLE ROW LEVEL SECURITY;

-- Training templates: Public read, owner/coach write
CREATE POLICY training_session_templates_select ON public.training_session_templates
  FOR SELECT USING (true);

CREATE POLICY training_session_templates_insert ON public.training_session_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY training_session_templates_update ON public.training_session_templates
  FOR UPDATE USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Exercise progressions: Athletes read own, coaches read team
CREATE POLICY exercise_progressions_own ON public.exercise_progressions
  FOR SELECT USING (auth.uid() = athlete_id);

CREATE POLICY exercise_progressions_coach ON public.exercise_progressions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('coach', 'head_coach', 'strength_coach', 'owner', 'admin')
    )
  );

-- Movement patterns: Public read
CREATE POLICY movement_patterns_select ON public.movement_patterns
  FOR SELECT USING (true);

-- ============================================================================
-- Team Operations
-- ============================================================================

ALTER TABLE IF EXISTS public.team_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Team events: Team members can read, team leaders can write
CREATE POLICY team_events_select ON public.team_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.team_id = team_events.team_id
    )
  );

CREATE POLICY team_events_insert ON public.team_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.team_id = team_events.team_id
        AND tm.role IN ('owner', 'admin', 'head_coach', 'coach')
    )
  );

-- Attendance records: Athletes read own, coaches read team
CREATE POLICY attendance_own ON public.attendance_records
  FOR SELECT USING (auth.uid() = athlete_id);

CREATE POLICY attendance_coach ON public.attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('coach', 'head_coach', 'owner', 'admin')
    )
  );

-- Blocked users: Users can only block/unblock for themselves
CREATE POLICY blocked_users_own ON public.blocked_users
  FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY blocked_users_insert ON public.blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY blocked_users_delete ON public.blocked_users
  FOR DELETE USING (auth.uid() = blocker_id);

-- ============================================================================
-- Cycle Tracking (Private Health Data)
-- ============================================================================

ALTER TABLE IF EXISTS public.cycle_tracking_entries ENABLE ROW LEVEL SECURITY;

-- Cycle entries: Only the athlete can access their own data
CREATE POLICY cycle_tracking_own ON public.cycle_tracking_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY cycle_tracking_insert ON public.cycle_tracking_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY cycle_tracking_update ON public.cycle_tracking_entries
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY cycle_tracking_delete ON public.cycle_tracking_entries
  FOR DELETE USING (auth.uid() = user_id);

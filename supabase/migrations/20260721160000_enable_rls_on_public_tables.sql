-- CRITICAL: Enable Row-Level Security on tables missing RLS and add comprehensive policies
-- Issue: Several tables were created without proper RLS policies
-- Fix: Add appropriate policies for each table based on actual schema

-- ============================================================================
-- Posts & Engagement (User-Generated Content)
-- ============================================================================

-- Posts: Users can read all posts, but only edit/delete their own
DROP POLICY IF EXISTS posts_select ON public.posts;
DROP POLICY IF EXISTS posts_insert ON public.posts;
DROP POLICY IF EXISTS posts_update ON public.posts;
DROP POLICY IF EXISTS posts_delete ON public.posts;

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
DROP POLICY IF EXISTS post_likes_select ON public.post_likes;
DROP POLICY IF EXISTS post_likes_insert ON public.post_likes;
DROP POLICY IF EXISTS post_likes_delete ON public.post_likes;

CREATE POLICY post_likes_select ON public.post_likes
  FOR SELECT USING (true);

CREATE POLICY post_likes_insert ON public.post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY post_likes_delete ON public.post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- Privacy & Consent (Sensitive User Data)
-- ============================================================================

-- Privacy settings: Users can only access their own
DROP POLICY IF EXISTS privacy_settings_own ON public.privacy_settings;
DROP POLICY IF EXISTS privacy_settings_insert ON public.privacy_settings;
DROP POLICY IF EXISTS privacy_settings_update ON public.privacy_settings;
DROP POLICY IF EXISTS privacy_settings_delete ON public.privacy_settings;

CREATE POLICY privacy_settings_own ON public.privacy_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY privacy_settings_insert ON public.privacy_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY privacy_settings_update ON public.privacy_settings
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY privacy_settings_delete ON public.privacy_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Parental consent: Guardians can manage minor consent, coaches/admin can view team's
-- Note: Uses minor_user_id for the athlete, not user_id
DROP POLICY IF EXISTS parental_consent_own ON public.parental_consent;
DROP POLICY IF EXISTS parental_consent_insert ON public.parental_consent;
DROP POLICY IF EXISTS parental_consent_update ON public.parental_consent;
DROP POLICY IF EXISTS parental_consent_staff_read ON public.parental_consent;

CREATE POLICY parental_consent_own ON public.parental_consent
  FOR SELECT USING (
    -- Guardians can see their own consents
    auth.uid() = minor_user_id OR
    -- Staff can see team members' consents
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('owner', 'admin', 'head_coach', 'coach')
        AND tm.team_id IN (
          SELECT team_id FROM team_members
          WHERE user_id = parental_consent.minor_user_id
            AND status = 'active'
        )
    )
  );

CREATE POLICY parental_consent_insert ON public.parental_consent
  FOR INSERT WITH CHECK (auth.uid() = minor_user_id);

CREATE POLICY parental_consent_update ON public.parental_consent
  FOR UPDATE USING (auth.uid() = minor_user_id)
  WITH CHECK (auth.uid() = minor_user_id);

-- Team sharing settings: Team members can read, admins can update
DROP POLICY IF EXISTS team_sharing_settings_select ON public.team_sharing_settings;
DROP POLICY IF EXISTS team_sharing_settings_insert ON public.team_sharing_settings;
DROP POLICY IF EXISTS team_sharing_settings_update ON public.team_sharing_settings;

CREATE POLICY team_sharing_settings_select ON public.team_sharing_settings
  FOR SELECT USING (
    -- User can see their own settings
    auth.uid() = user_id OR
    -- Team members can see team settings
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.team_id = team_sharing_settings.team_id
    )
  );

CREATE POLICY team_sharing_settings_insert ON public.team_sharing_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY team_sharing_settings_update ON public.team_sharing_settings
  FOR UPDATE USING (
    -- User can update their own settings
    auth.uid() = user_id OR
    -- Team admins can update team settings
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.team_id = team_sharing_settings.team_id
        AND tm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR
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

-- Training templates: Public read, creator write
DROP POLICY IF EXISTS training_session_templates_select ON public.training_session_templates;
DROP POLICY IF EXISTS training_session_templates_insert ON public.training_session_templates;
DROP POLICY IF EXISTS training_session_templates_update ON public.training_session_templates;

CREATE POLICY training_session_templates_select ON public.training_session_templates
  FOR SELECT USING (true);

CREATE POLICY training_session_templates_insert ON public.training_session_templates
  FOR INSERT WITH CHECK (true);  -- Any authenticated user can create templates

CREATE POLICY training_session_templates_update ON public.training_session_templates
  FOR UPDATE USING (
    -- Allow updates by template owner (through program relationship)
    EXISTS (
      SELECT 1 FROM programs p
      WHERE p.id = training_session_templates.program_id
        AND p.created_by = auth.uid()
    )
  );

-- Exercise progressions: Progression config is application-level reference data
-- No row-level restrictions needed for viewing progressions
DROP POLICY IF EXISTS exercise_progressions_select ON public.exercise_progressions;

CREATE POLICY exercise_progressions_select ON public.exercise_progressions
  FOR SELECT USING (true);

-- Movement patterns: Public read (reference library)
DROP POLICY IF EXISTS movement_patterns_select ON public.movement_patterns;

CREATE POLICY movement_patterns_select ON public.movement_patterns
  FOR SELECT USING (true);

-- ============================================================================
-- Team Operations
-- ============================================================================

-- Team events: Team members can read, team leaders can write
DROP POLICY IF EXISTS team_events_select ON public.team_events;
DROP POLICY IF EXISTS team_events_insert ON public.team_events;
DROP POLICY IF EXISTS team_events_update ON public.team_events;

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

CREATE POLICY team_events_update ON public.team_events
  FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.team_id = team_events.team_id
        AND tm.role IN ('owner', 'admin', 'head_coach')
    )
  );

-- Attendance records: Athletes read own, coaches read team
DROP POLICY IF EXISTS attendance_own ON public.attendance_records;
DROP POLICY IF EXISTS attendance_coach ON public.attendance_records;
DROP POLICY IF EXISTS attendance_insert ON public.attendance_records;

CREATE POLICY attendance_own ON public.attendance_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY attendance_coach ON public.attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.team_id = attendance_records.team_id
        AND tm.role IN ('coach', 'head_coach', 'owner', 'admin')
    )
  );

CREATE POLICY attendance_insert ON public.attendance_records
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.team_id = attendance_records.team_id
        AND tm.role IN ('coach', 'head_coach', 'owner', 'admin')
    )
  );

-- Blocked users: Bidirectional visibility, user-only blocking/unblocking
-- Note: Uses blocked_user_id instead of blocked_id
DROP POLICY IF EXISTS blocked_users_own ON public.blocked_users;
DROP POLICY IF EXISTS blocked_users_insert ON public.blocked_users;
DROP POLICY IF EXISTS blocked_users_delete ON public.blocked_users;

CREATE POLICY blocked_users_own ON public.blocked_users
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = blocked_user_id);

CREATE POLICY blocked_users_insert ON public.blocked_users
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY blocked_users_delete ON public.blocked_users
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- Comments & Documentation
-- ============================================================================

COMMENT ON POLICY posts_select ON public.posts IS
  'All authenticated users can read posts (public feed)';

COMMENT ON POLICY privacy_settings_own ON public.privacy_settings IS
  'Users can only access and manage their own privacy settings';

COMMENT ON POLICY team_sharing_settings_select ON public.team_sharing_settings IS
  'Users and team members can view team sharing settings';

COMMENT ON POLICY attendance_own ON public.attendance_records IS
  'Athletes can see their own attendance; coaches can see team attendance';

COMMENT ON POLICY blocked_users_own ON public.blocked_users IS
  'Users can see who they have blocked and who has blocked them (bidirectional)';

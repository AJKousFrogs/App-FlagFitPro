-- Clean up stale settings cache semantics in the app-facing schema and reduce
-- avoidable RLS/index overhead on the team feature tables we recently enabled.

-- ============================================================================
-- HELPER ALIGNMENT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ff_is_team_staff(
  p_team_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = p_team_id
      AND tm.user_id = p_user_id
      AND tm.status = 'active'
      AND tm.role IN (
        'owner',
        'admin',
        'head_coach',
        'coach',
        'assistant_coach',
        'manager',
        'offense_coordinator',
        'defense_coordinator'
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.ff_is_team_staff(uuid, uuid) TO authenticated;

-- ============================================================================
-- USER SETTINGS
-- ============================================================================

DROP POLICY IF EXISTS "Service role only access" ON public.user_settings;

-- ============================================================================
-- TEAMS
-- ============================================================================

DROP POLICY IF EXISTS "App active team members can view teams" ON public.teams;
DROP POLICY IF EXISTS "Team members can view teams" ON public.teams;
DROP POLICY IF EXISTS "Superadmins can view all teams" ON public.teams;
CREATE POLICY "App active team members can view teams"
  ON public.teams
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_active_team_member(id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "App coaches can update teams" ON public.teams;
DROP POLICY IF EXISTS "Coaches can update teams" ON public.teams;
CREATE POLICY "App coaches can update teams"
  ON public.teams
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(id, (SELECT auth.uid()))
  )
  WITH CHECK (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(id, (SELECT auth.uid()))
  );

-- ============================================================================
-- TEAM-SCOPED FEATURE TABLES
-- ============================================================================

DROP POLICY IF EXISTS "App active team members can view team preferences" ON public.team_preferences;
DROP POLICY IF EXISTS "App coaches can manage team preferences" ON public.team_preferences;
CREATE POLICY "App active team members can view team preferences"
  ON public.team_preferences
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_active_team_member(team_id, (SELECT auth.uid()))
  );
CREATE POLICY "App coaches can insert team preferences"
  ON public.team_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );
CREATE POLICY "App coaches can update team preferences"
  ON public.team_preferences
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  )
  WITH CHECK (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );
CREATE POLICY "App coaches can delete team preferences"
  ON public.team_preferences
  FOR DELETE
  TO authenticated
  USING (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "App active team members can view player development goals" ON public.player_development_goals;
DROP POLICY IF EXISTS "App coaches can manage player development goals" ON public.player_development_goals;
CREATE POLICY "App active team members can view player development goals"
  ON public.player_development_goals
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_active_team_member(team_id, (SELECT auth.uid()))
  );
CREATE POLICY "App coaches can insert player development goals"
  ON public.player_development_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );
CREATE POLICY "App coaches can update player development goals"
  ON public.player_development_goals
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  )
  WITH CHECK (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );
CREATE POLICY "App coaches can delete player development goals"
  ON public.player_development_goals
  FOR DELETE
  TO authenticated
  USING (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "App active team members can view player development notes" ON public.player_development_notes;
DROP POLICY IF EXISTS "App coaches can manage player development notes" ON public.player_development_notes;
CREATE POLICY "App active team members can view player development notes"
  ON public.player_development_notes
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_active_team_member(team_id, (SELECT auth.uid()))
  );
CREATE POLICY "App coaches can insert player development notes"
  ON public.player_development_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );
CREATE POLICY "App coaches can update player development notes"
  ON public.player_development_notes
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  )
  WITH CHECK (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );
CREATE POLICY "App coaches can delete player development notes"
  ON public.player_development_notes
  FOR DELETE
  TO authenticated
  USING (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "App active team members can view player skill assessments" ON public.player_skill_assessments;
DROP POLICY IF EXISTS "App coaches can manage player skill assessments" ON public.player_skill_assessments;
CREATE POLICY "App active team members can view player skill assessments"
  ON public.player_skill_assessments
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_active_team_member(team_id, (SELECT auth.uid()))
  );
CREATE POLICY "App coaches can insert player skill assessments"
  ON public.player_skill_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );
CREATE POLICY "App coaches can update player skill assessments"
  ON public.player_skill_assessments
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  )
  WITH CHECK (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );
CREATE POLICY "App coaches can delete player skill assessments"
  ON public.player_skill_assessments
  FOR DELETE
  TO authenticated
  USING (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Team members can view practice plans" ON public.practice_plans;
DROP POLICY IF EXISTS "Coaches can manage practice plans" ON public.practice_plans;
CREATE POLICY "Team members can view practice plans"
  ON public.practice_plans
  FOR SELECT
  TO authenticated
  USING (
    public.ff_is_active_team_member(team_id, (SELECT auth.uid()))
  );
CREATE POLICY "Coaches can insert practice plans"
  ON public.practice_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );
CREATE POLICY "Coaches can update practice plans"
  ON public.practice_plans
  FOR UPDATE
  TO authenticated
  USING (
    public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  )
  WITH CHECK (
    public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );
CREATE POLICY "Coaches can delete practice plans"
  ON public.practice_plans
  FOR DELETE
  TO authenticated
  USING (
    public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "App active team members can view tournament lineups" ON public.tournament_lineups;
DROP POLICY IF EXISTS "App coaches can manage tournament lineups" ON public.tournament_lineups;
CREATE POLICY "App active team members can view tournament lineups"
  ON public.tournament_lineups
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_active_team_member(team_id, (SELECT auth.uid()))
  );
CREATE POLICY "App coaches can insert tournament lineups"
  ON public.tournament_lineups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );
CREATE POLICY "App coaches can update tournament lineups"
  ON public.tournament_lineups
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  )
  WITH CHECK (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );
CREATE POLICY "App coaches can delete tournament lineups"
  ON public.tournament_lineups
  FOR DELETE
  TO authenticated
  USING (
    (SELECT public.is_active_superadmin())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );

-- ============================================================================
-- PERFORMANCE RECORDS
-- ============================================================================

DROP POLICY IF EXISTS performance_records_manage_own ON public.performance_records;
CREATE POLICY performance_records_insert_own
  ON public.performance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY performance_records_update_own
  ON public.performance_records
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY performance_records_delete_own
  ON public.performance_records
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- INDEX CLEANUP FOR RECENT FEATURE TABLES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_announcement_reads_user_id
  ON public.announcement_reads (user_id);

CREATE INDEX IF NOT EXISTS idx_channels_created_by
  ON public.channels (created_by);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id
  ON public.chat_messages (user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id
  ON public.chat_messages (sender_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_id
  ON public.chat_messages (recipient_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to
  ON public.chat_messages (reply_to);

CREATE INDEX IF NOT EXISTS idx_chat_messages_pinned_by
  ON public.chat_messages (pinned_by);

CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user_id
  ON public.message_read_receipts (user_id);

CREATE INDEX IF NOT EXISTS idx_protocol_generation_requests_protocol_id
  ON public.protocol_generation_requests (protocol_id);

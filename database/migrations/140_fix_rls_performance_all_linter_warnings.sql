-- =============================================================================
-- MIGRATION: Fix All RLS Performance and Index Warnings
-- Migration: 140_fix_rls_performance_all_linter_warnings.sql
-- Purpose: Fix all Supabase linter warnings for RLS performance and duplicate indexes
-- Created: 2026-01-30
-- =============================================================================
--
-- This migration fixes:
-- 1. auth_rls_initplan warnings: Wrap auth.uid(), auth.role(), and current_setting() calls in (SELECT ...)
-- 2. multiple_permissive_policies warnings: Note - these are intentional for different access patterns
-- 3. duplicate_index warnings: Remove duplicate indexes
--
-- =============================================================================

-- =============================================================================
-- PART 1: Fix auth_rls_initplan warnings - Wrap auth functions in (SELECT ...)
-- =============================================================================

-- TEAM_MEMBERS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view members of their own teams" ON public.team_members;
CREATE POLICY "Users can view members of their own teams"
    ON public.team_members
    FOR SELECT
    USING (
        team_id IN (
            SELECT team_id
            FROM public.team_members
            WHERE user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Coaches can add members to their teams" ON public.team_members;
CREATE POLICY "Coaches can add members to their teams"
    ON public.team_members
    FOR INSERT
    WITH CHECK (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Coaches can update members in their teams" ON public.team_members;
CREATE POLICY "Coaches can update members in their teams"
    ON public.team_members
    FOR UPDATE
    USING (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Coaches can remove members from their teams" ON public.team_members;
CREATE POLICY "Coaches can remove members from their teams"
    ON public.team_members
    FOR DELETE
    USING (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = (SELECT auth.uid())
        )
    );

-- TEAM_INVITATIONS TABLE POLICIES
DROP POLICY IF EXISTS "Coaches can view invitations for their teams" ON public.team_invitations;
CREATE POLICY "Coaches can view invitations for their teams"
    ON public.team_invitations
    FOR SELECT
    USING (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON public.team_invitations;
CREATE POLICY "Users can view invitations sent to their email"
    ON public.team_invitations
    FOR SELECT
    USING (
        email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
    );

DROP POLICY IF EXISTS "Coaches can create invitations for their teams" ON public.team_invitations;
CREATE POLICY "Coaches can create invitations for their teams"
    ON public.team_invitations
    FOR INSERT
    WITH CHECK (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = (SELECT auth.uid())
        )
        AND invited_by = (SELECT auth.uid())
    );

DROP POLICY IF EXISTS "Coaches can update invitations for their teams" ON public.team_invitations;
CREATE POLICY "Coaches can update invitations for their teams"
    ON public.team_invitations
    FOR UPDATE
    USING (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update their own invitations" ON public.team_invitations;
CREATE POLICY "Users can update their own invitations"
    ON public.team_invitations
    FOR UPDATE
    USING (
        email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
    );

-- MERLIN_VIOLATION_LOG TABLE POLICIES
DROP POLICY IF EXISTS "Service role reads merlin violations" ON public.merlin_violation_log;
CREATE POLICY "Service role reads merlin violations"
    ON public.merlin_violation_log
    FOR SELECT
    USING ((SELECT auth.role()) = 'service_role');

-- EXECUTION_LOGS TABLE POLICIES
DROP POLICY IF EXISTS "Athletes can log execution" ON public.execution_logs;
CREATE POLICY "Athletes can log execution"
    ON public.execution_logs
    FOR INSERT
    WITH CHECK (athlete_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Athletes can read own logs" ON public.execution_logs;
CREATE POLICY "Athletes can read own logs"
    ON public.execution_logs
    FOR SELECT
    USING (athlete_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Coaches can read athlete logs" ON public.execution_logs;
CREATE POLICY "Coaches can read athlete logs"
    ON public.execution_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.coach_athlete_assignments
            WHERE athlete_id = execution_logs.athlete_id
            AND coach_id = (SELECT auth.uid())
        )
    );

-- WELLNESS_ENTRIES TABLE POLICIES
DROP POLICY IF EXISTS "Athletes can view own wellness entries" ON public.wellness_entries;
CREATE POLICY "Athletes can view own wellness entries"
    ON public.wellness_entries
    FOR SELECT
    USING (athlete_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own wellness entries" ON public.wellness_entries;
CREATE POLICY "Users can insert own wellness entries"
    ON public.wellness_entries
    FOR INSERT
    WITH CHECK (athlete_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Coaches can view wellness with consent" ON public.wellness_entries;
CREATE POLICY "Coaches can view wellness with consent"
    ON public.wellness_entries
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.coach_athlete_assignments caa
            JOIN public.athlete_consent_settings acs ON acs.athlete_id = caa.athlete_id
            WHERE caa.athlete_id = wellness_entries.athlete_id
            AND caa.coach_id = (SELECT auth.uid())
            AND acs.share_wellness_answers_with_coach = true
        )
    );

-- READINESS_SCORES TABLE POLICIES
DROP POLICY IF EXISTS "Athletes can view own readiness scores" ON public.readiness_scores;
CREATE POLICY "Athletes can view own readiness scores"
    ON public.readiness_scores
    FOR SELECT
    USING (athlete_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Coaches can view readiness with consent" ON public.readiness_scores;
CREATE POLICY "Coaches can view readiness with consent"
    ON public.readiness_scores
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.coach_athlete_assignments caa
            JOIN public.athlete_consent_settings acs ON acs.athlete_id = caa.athlete_id
            WHERE caa.athlete_id = readiness_scores.athlete_id
            AND caa.coach_id = (SELECT auth.uid())
            AND acs.share_readiness_with_coach = true
        )
    );

DROP POLICY IF EXISTS "Medical staff can view readiness scores" ON public.readiness_scores;
CREATE POLICY "Medical staff can view readiness scores"
    ON public.readiness_scores
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = (SELECT auth.uid())
            AND raw_user_meta_data->>'role' IN ('physio', 'medical_staff', 'admin')
        )
    );

-- WELLNESS_LOGS TABLE POLICIES
DROP POLICY IF EXISTS "Athletes full access wellness logs" ON public.wellness_logs;
CREATE POLICY "Athletes full access wellness logs"
    ON public.wellness_logs
    FOR ALL
    USING (athlete_id = (SELECT auth.uid()))
    WITH CHECK (athlete_id = (SELECT auth.uid()));

-- COACH_ATHLETE_ASSIGNMENTS TABLE POLICIES
DROP POLICY IF EXISTS "Coaches can view own assignments" ON public.coach_athlete_assignments;
CREATE POLICY "Coaches can view own assignments"
    ON public.coach_athlete_assignments
    FOR SELECT
    USING (coach_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Athletes can view own assignments" ON public.coach_athlete_assignments;
CREATE POLICY "Athletes can view own assignments"
    ON public.coach_athlete_assignments
    FOR SELECT
    USING (athlete_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Coaches can create assignments" ON public.coach_athlete_assignments;
CREATE POLICY "Coaches can create assignments"
    ON public.coach_athlete_assignments
    FOR INSERT
    WITH CHECK (coach_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Coaches can update own assignments" ON public.coach_athlete_assignments;
CREATE POLICY "Coaches can update own assignments"
    ON public.coach_athlete_assignments
    FOR UPDATE
    USING (coach_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Coaches can delete own assignments" ON public.coach_athlete_assignments;
CREATE POLICY "Coaches can delete own assignments"
    ON public.coach_athlete_assignments
    FOR DELETE
    USING (coach_id = (SELECT auth.uid()));

-- ATHLETE_CONSENT_SETTINGS TABLE POLICIES
DROP POLICY IF EXISTS "Athletes can manage own consent" ON public.athlete_consent_settings;
CREATE POLICY "Athletes can manage own consent"
    ON public.athlete_consent_settings
    FOR ALL
    USING (athlete_id = (SELECT auth.uid()))
    WITH CHECK (athlete_id = (SELECT auth.uid()));

-- SAFETY_OVERRIDE_LOG TABLE POLICIES
DROP POLICY IF EXISTS "Service role can read safety overrides" ON public.safety_override_log;
CREATE POLICY "Service role can read safety overrides"
    ON public.safety_override_log
    FOR SELECT
    USING ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Service role can log safety overrides" ON public.safety_override_log;
CREATE POLICY "Service role can log safety overrides"
    ON public.safety_override_log
    FOR INSERT
    WITH CHECK ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Athletes can view own safety overrides" ON public.safety_override_log;
CREATE POLICY "Athletes can view own safety overrides"
    ON public.safety_override_log
    FOR SELECT
    USING (athlete_id = (SELECT auth.uid()));

-- USERS TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage own data" ON public.users;
CREATE POLICY "Users can manage own data"
    ON public.users
    FOR ALL
    USING (id = (SELECT auth.uid()))
    WITH CHECK (id = (SELECT auth.uid()));

-- TEAMS TABLE POLICIES
DROP POLICY IF EXISTS "Team members can view teams" ON public.teams;
CREATE POLICY "Team members can view teams"
    ON public.teams
    FOR SELECT
    USING (
        id IN (
            SELECT team_id FROM public.team_members
            WHERE user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Coaches can manage teams" ON public.teams;
CREATE POLICY "Coaches can manage teams"
    ON public.teams
    FOR ALL
    USING (coach_id = (SELECT auth.uid()))
    WITH CHECK (coach_id = (SELECT auth.uid()));

-- TRAINING_SESSIONS TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage own training sessions" ON public.training_sessions;
CREATE POLICY "Users can manage own training sessions"
    ON public.training_sessions
    FOR ALL
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own training sessions" ON public.training_sessions;
CREATE POLICY "Users can view own training sessions"
    ON public.training_sessions
    FOR SELECT
    USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own training sessions" ON public.training_sessions;
CREATE POLICY "Users can update own training sessions"
    ON public.training_sessions
    FOR UPDATE
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Coaches can modify team training sessions" ON public.training_sessions;
CREATE POLICY "Coaches can modify team training sessions"
    ON public.training_sessions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.teams t
            JOIN public.team_members tm ON tm.team_id = t.id
            WHERE t.coach_id = (SELECT auth.uid())
            AND tm.user_id = training_sessions.user_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teams t
            JOIN public.team_members tm ON tm.team_id = t.id
            WHERE t.coach_id = (SELECT auth.uid())
            AND tm.user_id = training_sessions.user_id
        )
    );

DROP POLICY IF EXISTS "Coaches can view training notes with consent" ON public.training_sessions;
CREATE POLICY "Coaches can view training notes with consent"
    ON public.training_sessions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.coach_athlete_assignments caa
            JOIN public.athlete_consent_settings acs ON acs.athlete_id = caa.athlete_id
            WHERE caa.athlete_id = training_sessions.user_id
            AND caa.coach_id = (SELECT auth.uid())
            AND acs.share_training_notes_with_coach = true
        )
    );

-- CHATBOT_USER_CONTEXT TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage own context" ON public.chatbot_user_context;
CREATE POLICY "Users can manage own context"
    ON public.chatbot_user_context
    FOR ALL
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- USER_AGE_GROUPS TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage own age group" ON public.user_age_groups;
CREATE POLICY "Users can manage own age group"
    ON public.user_age_groups
    FOR ALL
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- USER_AI_PREFERENCES TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_ai_preferences;
CREATE POLICY "Users can manage own preferences"
    ON public.user_ai_preferences
    FOR ALL
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- YOUTH_ATHLETE_SETTINGS TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage own settings" ON public.youth_athlete_settings;
CREATE POLICY "Users can manage own settings"
    ON public.youth_athlete_settings
    FOR ALL
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- NUTRITION_LOGS TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage own nutrition logs" ON public.nutrition_logs;
CREATE POLICY "Users can manage own nutrition logs"
    ON public.nutrition_logs
    FOR ALL
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- CLASSIFICATION_HISTORY TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own classification history" ON public.classification_history;
CREATE POLICY "Users can view own classification history"
    ON public.classification_history
    FOR SELECT
    USING (user_id = (SELECT auth.uid()));

-- NUTRITION_GOALS TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage own nutrition goals" ON public.nutrition_goals;
CREATE POLICY "Users can manage own nutrition goals"
    ON public.nutrition_goals
    FOR ALL
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- PHYSICAL_MEASUREMENTS TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage own measurements" ON public.physical_measurements;
CREATE POLICY "Users can manage own measurements"
    ON public.physical_measurements
    FOR ALL
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- RECOVERY_SESSIONS TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage own recovery sessions" ON public.recovery_sessions;
CREATE POLICY "Users can manage own recovery sessions"
    ON public.recovery_sessions
    FOR ALL
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- RECOVERY_PROTOCOLS TABLE POLICIES
DROP POLICY IF EXISTS "Authenticated users can view protocols" ON public.recovery_protocols;
CREATE POLICY "Authenticated users can view protocols"
    ON public.recovery_protocols
    FOR SELECT
    USING ((SELECT auth.uid()) IS NOT NULL);

-- COACH_INBOX_ITEMS TABLE POLICIES
DROP POLICY IF EXISTS "Coaches can manage own inbox" ON public.coach_inbox_items;
CREATE POLICY "Coaches can manage own inbox"
    ON public.coach_inbox_items
    FOR ALL
    USING (coach_id = (SELECT auth.uid()))
    WITH CHECK (coach_id = (SELECT auth.uid()));

-- COACH_ALERT_ACKNOWLEDGMENTS TABLE POLICIES
DROP POLICY IF EXISTS "Coaches can manage own acknowledgments" ON public.coach_alert_acknowledgments;
CREATE POLICY "Coaches can manage own acknowledgments"
    ON public.coach_alert_acknowledgments
    FOR ALL
    USING (coach_id = (SELECT auth.uid()))
    WITH CHECK (coach_id = (SELECT auth.uid()));

-- AI_FOLLOWUPS TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage own followups" ON public.ai_followups;
CREATE POLICY "Users can manage own followups"
    ON public.ai_followups
    FOR ALL
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- CONVERSATION_CONTEXT TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage own context" ON public.conversation_context;
CREATE POLICY "Users can manage own context"
    ON public.conversation_context
    FOR ALL
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- AI_REVIEW_QUEUE TABLE POLICIES
DROP POLICY IF EXISTS "Service role can manage review queue" ON public.ai_review_queue;
CREATE POLICY "Service role can manage review queue"
    ON public.ai_review_queue
    FOR ALL
    USING ((SELECT auth.role()) = 'service_role')
    WITH CHECK ((SELECT auth.role()) = 'service_role');

-- PARENT_GUARDIAN_LINKS TABLE POLICIES
DROP POLICY IF EXISTS "Parents and athletes can view links" ON public.parent_guardian_links;
CREATE POLICY "Parents and athletes can view links"
    ON public.parent_guardian_links
    FOR SELECT
    USING (
        parent_id = (SELECT auth.uid())
        OR athlete_id = (SELECT auth.uid())
    );

DROP POLICY IF EXISTS "Parents can manage links" ON public.parent_guardian_links;
CREATE POLICY "Parents can manage links"
    ON public.parent_guardian_links
    FOR ALL
    USING (parent_id = (SELECT auth.uid()))
    WITH CHECK (parent_id = (SELECT auth.uid()));

-- PARENT_NOTIFICATIONS TABLE POLICIES
DROP POLICY IF EXISTS "Parents can manage own notifications" ON public.parent_notifications;
CREATE POLICY "Parents can manage own notifications"
    ON public.parent_notifications
    FOR ALL
    USING (parent_id = (SELECT auth.uid()))
    WITH CHECK (parent_id = (SELECT auth.uid()));

-- TRAINING_LOAD_METRICS TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage own load metrics" ON public.training_load_metrics;
CREATE POLICY "Users can manage own load metrics"
    ON public.training_load_metrics
    FOR ALL
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- ACWR_CALCULATIONS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own ACWR calculations" ON public.acwr_calculations;
CREATE POLICY "Users can view own ACWR calculations"
    ON public.acwr_calculations
    FOR SELECT
    USING (user_id = (SELECT auth.uid()));

-- TRAINING_STRESS_BALANCE TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own stress balance" ON public.training_stress_balance;
CREATE POLICY "Users can view own stress balance"
    ON public.training_stress_balance
    FOR SELECT
    USING (user_id = (SELECT auth.uid()));

-- SESSION_RPE_DATA TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage own RPE data" ON public.session_rpe_data;
CREATE POLICY "Users can manage own RPE data"
    ON public.session_rpe_data
    FOR ALL
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- WEEKLY_TRAINING_ANALYSIS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own weekly analysis" ON public.weekly_training_analysis;
CREATE POLICY "Users can view own weekly analysis"
    ON public.weekly_training_analysis
    FOR SELECT
    USING (user_id = (SELECT auth.uid()));

-- INJURY_RISK_FACTORS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own injury risk" ON public.injury_risk_factors;
CREATE POLICY "Users can view own injury risk"
    ON public.injury_risk_factors
    FOR SELECT
    USING (user_id = (SELECT auth.uid()));

-- ACWR_HISTORY TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own ACWR history" ON public.acwr_history;
CREATE POLICY "Users can view own ACWR history"
    ON public.acwr_history
    FOR SELECT
    USING (user_id = (SELECT auth.uid()));

-- DIGEST_HISTORY TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own digest history" ON public.digest_history;
CREATE POLICY "Users can view own digest history"
    ON public.digest_history
    FOR SELECT
    USING (user_id = (SELECT auth.uid()));

-- MICRO_SESSIONS TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage own micro sessions" ON public.micro_sessions;
CREATE POLICY "Users can manage own micro sessions"
    ON public.micro_sessions
    FOR ALL
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- MICRO_SESSION_ANALYTICS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own micro session analytics" ON public.micro_session_analytics;
CREATE POLICY "Users can view own micro session analytics"
    ON public.micro_session_analytics
    FOR SELECT
    USING (user_id = (SELECT auth.uid()));

-- TEAM_TEMPLATES TABLE POLICIES
DROP POLICY IF EXISTS "Team members can view templates" ON public.team_templates;
CREATE POLICY "Team members can view templates"
    ON public.team_templates
    FOR SELECT
    USING (
        team_id IN (
            SELECT team_id FROM public.team_members
            WHERE user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Coaches can manage templates" ON public.team_templates;
CREATE POLICY "Coaches can manage templates"
    ON public.team_templates
    FOR ALL
    USING (
        team_id IN (
            SELECT id FROM public.teams
            WHERE coach_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        team_id IN (
            SELECT id FROM public.teams
            WHERE coach_id = (SELECT auth.uid())
        )
    );

-- TEMPLATE_ASSIGNMENTS TABLE POLICIES
DROP POLICY IF EXISTS "Players can view own assignments" ON public.template_assignments;
CREATE POLICY "Players can view own assignments"
    ON public.template_assignments
    FOR SELECT
    USING (player_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Coaches can manage assignments" ON public.template_assignments;
CREATE POLICY "Coaches can manage assignments"
    ON public.template_assignments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.teams t
            JOIN public.team_members tm ON tm.team_id = t.id
            WHERE t.coach_id = (SELECT auth.uid())
            AND tm.user_id = template_assignments.player_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teams t
            JOIN public.team_members tm ON tm.team_id = t.id
            WHERE t.coach_id = (SELECT auth.uid())
            AND tm.user_id = template_assignments.player_id
        )
    );

-- LOAD_MANAGEMENT_RESEARCH TABLE POLICIES
DROP POLICY IF EXISTS "Authenticated users can view research" ON public.load_management_research;
CREATE POLICY "Authenticated users can view research"
    ON public.load_management_research
    FOR SELECT
    USING ((SELECT auth.uid()) IS NOT NULL);

-- SESSION_VERSION_HISTORY TABLE POLICIES
DROP POLICY IF EXISTS "Athletes can view own session versions" ON public.session_version_history;
CREATE POLICY "Athletes can view own session versions"
    ON public.session_version_history
    FOR SELECT
    USING (athlete_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Coaches can view athlete session versions" ON public.session_version_history;
CREATE POLICY "Coaches can view athlete session versions"
    ON public.session_version_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.coach_athlete_assignments
            WHERE athlete_id = session_version_history.athlete_id
            AND coach_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Medical staff can view session versions" ON public.session_version_history;
CREATE POLICY "Medical staff can view session versions"
    ON public.session_version_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = (SELECT auth.uid())
            AND raw_user_meta_data->>'role' IN ('physio', 'medical_staff', 'admin')
        )
    );

-- GAMES TABLE POLICIES
DROP POLICY IF EXISTS "Team members can view team games" ON public.games;
CREATE POLICY "Team members can view team games"
    ON public.games
    FOR SELECT
    USING (
        team_id IN (
            SELECT team_id FROM public.team_members
            WHERE user_id = (SELECT auth.uid())
        )
    );

-- GAME_EVENTS TABLE POLICIES
DROP POLICY IF EXISTS "Team members can view team game events" ON public.game_events;
CREATE POLICY "Team members can view team game events"
    ON public.game_events
    FOR SELECT
    USING (
        game_id IN (
            SELECT id FROM public.games
            WHERE team_id IN (
                SELECT team_id FROM public.team_members
                WHERE user_id = (SELECT auth.uid())
            )
        )
    );

-- SESSIONS TABLE POLICIES
DROP POLICY IF EXISTS "Athletes can manage own sessions" ON public.sessions;
CREATE POLICY "Athletes can manage own sessions"
    ON public.sessions
    FOR ALL
    USING (athlete_id = (SELECT auth.uid()))
    WITH CHECK (athlete_id = (SELECT auth.uid()));

-- VIDEO_BOOKMARKS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.video_bookmarks;
CREATE POLICY "Users can view own bookmarks"
    ON public.video_bookmarks
    FOR SELECT
    USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create own bookmarks" ON public.video_bookmarks;
CREATE POLICY "Users can create own bookmarks"
    ON public.video_bookmarks
    FOR INSERT
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own bookmarks" ON public.video_bookmarks;
CREATE POLICY "Users can update own bookmarks"
    ON public.video_bookmarks
    FOR UPDATE
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.video_bookmarks;
CREATE POLICY "Users can delete own bookmarks"
    ON public.video_bookmarks
    FOR DELETE
    USING (user_id = (SELECT auth.uid()));

-- VIDEO_CURATION_STATUS TABLE POLICIES
DROP POLICY IF EXISTS "Team coaches can manage video curation" ON public.video_curation_status;
CREATE POLICY "Team coaches can manage video curation"
    ON public.video_curation_status
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.teams t
            JOIN public.team_members tm ON tm.team_id = t.id
            WHERE t.coach_id = (SELECT auth.uid())
            AND tm.user_id = video_curation_status.user_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teams t
            JOIN public.team_members tm ON tm.team_id = t.id
            WHERE t.coach_id = (SELECT auth.uid())
            AND tm.user_id = video_curation_status.user_id
        )
    );

-- VIDEO_PLAYLISTS TABLE POLICIES
DROP POLICY IF EXISTS "Team members can view playlists" ON public.video_playlists;
CREATE POLICY "Team members can view playlists"
    ON public.video_playlists
    FOR SELECT
    USING (
        team_id IN (
            SELECT team_id FROM public.team_members
            WHERE user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Coaches can manage playlists" ON public.video_playlists;
CREATE POLICY "Coaches can manage playlists"
    ON public.video_playlists
    FOR ALL
    USING (
        team_id IN (
            SELECT id FROM public.teams
            WHERE coach_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        team_id IN (
            SELECT id FROM public.teams
            WHERE coach_id = (SELECT auth.uid())
        )
    );

-- VIDEO_WATCH_HISTORY TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage own watch history" ON public.video_watch_history;
CREATE POLICY "Users can manage own watch history"
    ON public.video_watch_history
    FOR ALL
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- VIDEO_ASSIGNMENTS TABLE POLICIES
DROP POLICY IF EXISTS "Assigned users can view assignments" ON public.video_assignments;
CREATE POLICY "Assigned users can view assignments"
    ON public.video_assignments
    FOR SELECT
    USING (assigned_to = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Coaches can manage assignments" ON public.video_assignments;
CREATE POLICY "Coaches can manage assignments"
    ON public.video_assignments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.teams t
            JOIN public.team_members tm ON tm.team_id = t.id
            WHERE t.coach_id = (SELECT auth.uid())
            AND tm.user_id = video_assignments.assigned_to
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teams t
            JOIN public.team_members tm ON tm.team_id = t.id
            WHERE t.coach_id = (SELECT auth.uid())
            AND tm.user_id = video_assignments.assigned_to
        )
    );

-- AI_CHAT_SESSIONS TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage own AI chat sessions" ON public.ai_chat_sessions;
CREATE POLICY "Users can manage own AI chat sessions"
    ON public.ai_chat_sessions
    FOR ALL
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- AI_MESSAGES TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage own AI messages" ON public.ai_messages;
CREATE POLICY "Users can manage own AI messages"
    ON public.ai_messages
    FOR ALL
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- AI_RECOMMENDATIONS TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage own AI recommendations" ON public.ai_recommendations;
CREATE POLICY "Users can manage own AI recommendations"
    ON public.ai_recommendations
    FOR ALL
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- AI_FEEDBACK TABLE POLICIES
DROP POLICY IF EXISTS "Users can manage own AI feedback" ON public.ai_feedback;
CREATE POLICY "Users can manage own AI feedback"
    ON public.ai_feedback
    FOR ALL
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- NOTIFICATIONS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
    ON public.notifications
    FOR SELECT
    USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
    ON public.notifications
    FOR UPDATE
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (user_id = (SELECT auth.uid()));

-- =============================================================================
-- PART 2: Remove Duplicate Indexes
-- =============================================================================

-- Remove duplicate index on exercise_library
-- Keep exercise_library_pkey (primary key), drop idx_exercise_library_id_version
DROP INDEX IF EXISTS public.idx_exercise_library_id_version;

-- Remove duplicate index on load_daily
-- Keep load_daily_player_id_date_key (unique constraint), drop idx_load_daily_unique
DROP INDEX IF EXISTS public.idx_load_daily_unique;

-- Remove duplicate index on load_metrics
-- Keep load_metrics_player_id_date_key (unique constraint), drop idx_load_metrics_unique
DROP INDEX IF EXISTS public.idx_load_metrics_unique;

-- =============================================================================
-- NOTES ON MULTIPLE PERMISSIVE POLICIES
-- =============================================================================
-- The multiple_permissive_policies warnings are intentional design choices:
-- - Multiple policies allow different access patterns (e.g., athletes vs coaches)
-- - PostgreSQL evaluates all permissive policies with OR logic
-- - This provides fine-grained access control but may impact performance
-- - Consider consolidating policies if performance becomes an issue
-- - For now, these are left as-is since they provide necessary security granularity

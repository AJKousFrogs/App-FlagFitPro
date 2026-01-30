-- =============================================================================
-- Migration 119: Add indexes for unindexed foreign keys
-- Fixes performance issues identified by Supabase database linter
-- =============================================================================
-- Purpose: Add covering indexes for foreign key constraints to improve
--          referential integrity check performance and join operations.
--
-- This migration addresses all unindexed foreign keys reported by the
-- Supabase database linter. Foreign keys should always have covering indexes
-- for:
-- 1. Efficient referential integrity checks (ON DELETE/UPDATE CASCADE/SET NULL)
-- 2. Faster JOIN operations
-- 3. Better query planner optimization
-- 4. Reduced lock contention during FK constraint checks
-- =============================================================================

-- =============================================================================
-- PART 1: AI FEEDBACK TABLES
-- =============================================================================

-- ai_feedback.reviewed_by -> users(id)
CREATE INDEX IF NOT EXISTS idx_ai_feedback_reviewed_by 
ON ai_feedback(reviewed_by)
WHERE reviewed_by IS NOT NULL;

COMMENT ON INDEX idx_ai_feedback_reviewed_by IS 
'Index covering foreign key ai_feedback_reviewed_by_fkey. Required for referential integrity performance.';

-- ai_followups.user_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_ai_followups_user_id 
ON ai_followups(user_id)
WHERE user_id IS NOT NULL;

COMMENT ON INDEX idx_ai_followups_user_id IS 
'Index covering foreign key ai_followups_user_id_fkey. Required for referential integrity performance.';

-- ai_review_queue.reviewer_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_ai_review_queue_reviewer_id 
ON ai_review_queue(reviewer_id)
WHERE reviewer_id IS NOT NULL;

COMMENT ON INDEX idx_ai_review_queue_reviewer_id IS 
'Index covering foreign key ai_review_queue_reviewer_id_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 2: ANALYTICS TABLES
-- =============================================================================

-- analytics_aggregates.user_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_analytics_aggregates_user_id 
ON analytics_aggregates(user_id)
WHERE user_id IS NOT NULL;

COMMENT ON INDEX idx_analytics_aggregates_user_id IS 
'Index covering foreign key analytics_aggregates_user_id_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 3: CLASSIFICATION TABLES
-- =============================================================================

-- classification_history.classified_by -> users(id)
CREATE INDEX IF NOT EXISTS idx_classification_history_classified_by 
ON classification_history(classified_by)
WHERE classified_by IS NOT NULL;

COMMENT ON INDEX idx_classification_history_classified_by IS 
'Index covering foreign key classification_history_classified_by_fkey. Required for referential integrity performance.';

-- classification_history.user_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_classification_history_user_id 
ON classification_history(user_id)
WHERE user_id IS NOT NULL;

COMMENT ON INDEX idx_classification_history_user_id IS 
'Index covering foreign key classification_history_user_id_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 4: COACH TABLES
-- =============================================================================

-- coach_alert_acknowledgments.coach_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_coach_alert_acknowledgments_coach_id 
ON coach_alert_acknowledgments(coach_id)
WHERE coach_id IS NOT NULL;

COMMENT ON INDEX idx_coach_alert_acknowledgments_coach_id IS 
'Index covering foreign key coach_alert_acknowledgments_coach_id_fkey. Required for referential integrity performance.';

-- coach_alert_acknowledgments.player_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_coach_alert_acknowledgments_player_id 
ON coach_alert_acknowledgments(player_id)
WHERE player_id IS NOT NULL;

COMMENT ON INDEX idx_coach_alert_acknowledgments_player_id IS 
'Index covering foreign key coach_alert_acknowledgments_player_id_fkey. Required for referential integrity performance.';

-- coach_inbox_items.player_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_coach_inbox_items_player_id 
ON coach_inbox_items(player_id)
WHERE player_id IS NOT NULL;

COMMENT ON INDEX idx_coach_inbox_items_player_id IS 
'Index covering foreign key coach_inbox_items_player_id_fkey. Required for referential integrity performance.';

-- coach_inbox_items.team_id -> teams(id)
CREATE INDEX IF NOT EXISTS idx_coach_inbox_items_team_id 
ON coach_inbox_items(team_id)
WHERE team_id IS NOT NULL;

COMMENT ON INDEX idx_coach_inbox_items_team_id IS 
'Index covering foreign key coach_inbox_items_team_id_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 5: CONSENT TABLES
-- =============================================================================

-- consent_change_log.changed_by -> users(id)
CREATE INDEX IF NOT EXISTS idx_consent_change_log_changed_by 
ON consent_change_log(changed_by)
WHERE changed_by IS NOT NULL;

COMMENT ON INDEX idx_consent_change_log_changed_by IS 
'Index covering foreign key consent_change_log_changed_by_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 6: FIXTURES TABLE
-- =============================================================================

-- fixtures.team_id -> teams(id)
-- Note: This may have been addressed in migration 050, but ensuring it exists
CREATE INDEX IF NOT EXISTS idx_fixtures_team_id 
ON fixtures(team_id)
WHERE team_id IS NOT NULL;

COMMENT ON INDEX idx_fixtures_team_id IS 
'Index covering foreign key fixtures_team_id_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 7: KNOWLEDGE BASE TABLES
-- =============================================================================

-- knowledge_base_governance_log.performed_by -> users(id)
CREATE INDEX IF NOT EXISTS idx_knowledge_base_governance_log_performed_by 
ON knowledge_base_governance_log(performed_by)
WHERE performed_by IS NOT NULL;

COMMENT ON INDEX idx_knowledge_base_governance_log_performed_by IS 
'Index covering foreign key knowledge_base_governance_log_performed_by_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 8: LOAD MONITORING TABLES
-- =============================================================================

-- load_monitoring.player_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_load_monitoring_player_id 
ON load_monitoring(player_id)
WHERE player_id IS NOT NULL;

COMMENT ON INDEX idx_load_monitoring_player_id IS 
'Index covering foreign key load_monitoring_player_id_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 9: MICRO SESSIONS TABLES
-- =============================================================================

-- micro_session_analytics.micro_session_id -> micro_sessions(id)
CREATE INDEX IF NOT EXISTS idx_micro_session_analytics_micro_session_id 
ON micro_session_analytics(micro_session_id)
WHERE micro_session_id IS NOT NULL;

COMMENT ON INDEX idx_micro_session_analytics_micro_session_id IS 
'Index covering foreign key micro_session_analytics_micro_session_id_fkey. Required for referential integrity performance.';

-- micro_session_analytics.user_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_micro_session_analytics_user_id 
ON micro_session_analytics(user_id)
WHERE user_id IS NOT NULL;

COMMENT ON INDEX idx_micro_session_analytics_user_id IS 
'Index covering foreign key micro_session_analytics_user_id_fkey. Required for referential integrity performance.';

-- micro_sessions.user_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_micro_sessions_user_id 
ON micro_sessions(user_id)
WHERE user_id IS NOT NULL;

COMMENT ON INDEX idx_micro_sessions_user_id IS 
'Index covering foreign key micro_sessions_user_id_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 10: NOTIFICATIONS TABLE
-- =============================================================================

-- notifications.sender_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id 
ON notifications(sender_id)
WHERE sender_id IS NOT NULL;

COMMENT ON INDEX idx_notifications_sender_id IS 
'Index covering foreign key notifications_sender_id_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 11: NUTRITION TABLES
-- =============================================================================

-- nutrition_logs.user_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_id 
ON nutrition_logs(user_id)
WHERE user_id IS NOT NULL;

COMMENT ON INDEX idx_nutrition_logs_user_id IS 
'Index covering foreign key nutrition_logs_user_id_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 12: OWNERSHIP TRANSITIONS TABLE
-- =============================================================================

-- ownership_transitions.from_owner_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_ownership_transitions_from_owner_id 
ON ownership_transitions(from_owner_id)
WHERE from_owner_id IS NOT NULL;

COMMENT ON INDEX idx_ownership_transitions_from_owner_id IS 
'Index covering foreign key ownership_transitions_from_owner_id_fkey. Required for referential integrity performance.';

-- ownership_transitions.to_owner_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_ownership_transitions_to_owner_id 
ON ownership_transitions(to_owner_id)
WHERE to_owner_id IS NOT NULL;

COMMENT ON INDEX idx_ownership_transitions_to_owner_id IS 
'Index covering foreign key ownership_transitions_to_owner_id_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 13: PARENT/GUARDIAN TABLES
-- =============================================================================

-- parent_guardian_links.parent_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_parent_guardian_links_parent_id 
ON parent_guardian_links(parent_id)
WHERE parent_id IS NOT NULL;

COMMENT ON INDEX idx_parent_guardian_links_parent_id IS 
'Index covering foreign key parent_guardian_links_parent_id_fkey. Required for referential integrity performance.';

-- parent_notifications.parent_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_parent_notifications_parent_id 
ON parent_notifications(parent_id)
WHERE parent_id IS NOT NULL;

COMMENT ON INDEX idx_parent_notifications_parent_id IS 
'Index covering foreign key parent_notifications_parent_id_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 14: PHYSICAL MEASUREMENTS TABLE
-- =============================================================================

-- physical_measurements.user_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_physical_measurements_user_id 
ON physical_measurements(user_id)
WHERE user_id IS NOT NULL;

COMMENT ON INDEX idx_physical_measurements_user_id IS 
'Index covering foreign key physical_measurements_user_id_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 15: PLAYER PROGRAMS TABLE
-- =============================================================================

-- player_programs.assigned_by -> users(id)
CREATE INDEX IF NOT EXISTS idx_player_programs_assigned_by 
ON player_programs(assigned_by)
WHERE assigned_by IS NOT NULL;

COMMENT ON INDEX idx_player_programs_assigned_by IS 
'Index covering foreign key player_programs_assigned_by_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 16: PROGRAM ASSIGNMENTS TABLE
-- =============================================================================

-- program_assignments.assigned_by -> users(id)
CREATE INDEX IF NOT EXISTS idx_program_assignments_assigned_by 
ON program_assignments(assigned_by)
WHERE assigned_by IS NOT NULL;

COMMENT ON INDEX idx_program_assignments_assigned_by IS 
'Index covering foreign key program_assignments_assigned_by_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 17: RECOVERY SESSIONS TABLE
-- =============================================================================

-- recovery_sessions.athlete_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_recovery_sessions_athlete_id 
ON recovery_sessions(athlete_id)
WHERE athlete_id IS NOT NULL;

COMMENT ON INDEX idx_recovery_sessions_athlete_id IS 
'Index covering foreign key recovery_sessions_athlete_id_fkey. Required for referential integrity performance.';

-- recovery_sessions.protocol_id -> recovery_protocols(id)
CREATE INDEX IF NOT EXISTS idx_recovery_sessions_protocol_id 
ON recovery_sessions(protocol_id)
WHERE protocol_id IS NOT NULL;

COMMENT ON INDEX idx_recovery_sessions_protocol_id IS 
'Index covering foreign key recovery_sessions_protocol_id_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 18: ROLE CHANGE AUDIT TABLE
-- =============================================================================

-- role_change_audit.changed_by -> users(id)
CREATE INDEX IF NOT EXISTS idx_role_change_audit_changed_by 
ON role_change_audit(changed_by)
WHERE changed_by IS NOT NULL;

COMMENT ON INDEX idx_role_change_audit_changed_by IS 
'Index covering foreign key role_change_audit_changed_by_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 19: ROSTER AUDIT LOG TABLE
-- =============================================================================

-- roster_audit_log.performed_by -> users(id)
CREATE INDEX IF NOT EXISTS idx_roster_audit_log_performed_by 
ON roster_audit_log(performed_by)
WHERE performed_by IS NOT NULL;

COMMENT ON INDEX idx_roster_audit_log_performed_by IS 
'Index covering foreign key roster_audit_log_performed_by_fkey. Required for referential integrity performance.';

-- roster_audit_log.player_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_roster_audit_log_player_id 
ON roster_audit_log(player_id)
WHERE player_id IS NOT NULL;

COMMENT ON INDEX idx_roster_audit_log_player_id IS 
'Index covering foreign key roster_audit_log_player_id_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 20: SESSION RPE DATA TABLE
-- =============================================================================

-- session_rpe_data.session_id -> training_sessions(id)
CREATE INDEX IF NOT EXISTS idx_session_rpe_data_session_id 
ON session_rpe_data(session_id)
WHERE session_id IS NOT NULL;

COMMENT ON INDEX idx_session_rpe_data_session_id IS 
'Index covering foreign key session_rpe_data_session_id_fkey. Required for referential integrity performance.';

-- session_rpe_data.user_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_session_rpe_data_user_id 
ON session_rpe_data(user_id)
WHERE user_id IS NOT NULL;

COMMENT ON INDEX idx_session_rpe_data_user_id IS 
'Index covering foreign key session_rpe_data_user_id_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 21: SUPERADMINS TABLE
-- =============================================================================

-- superadmins.granted_by -> users(id)
CREATE INDEX IF NOT EXISTS idx_superadmins_granted_by 
ON superadmins(granted_by)
WHERE granted_by IS NOT NULL;

COMMENT ON INDEX idx_superadmins_granted_by IS 
'Index covering foreign key superadmins_granted_by_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 22: TEAM TABLES
-- =============================================================================

-- team_invitations.invited_by -> users(id)
CREATE INDEX IF NOT EXISTS idx_team_invitations_invited_by 
ON team_invitations(invited_by)
WHERE invited_by IS NOT NULL;

COMMENT ON INDEX idx_team_invitations_invited_by IS 
'Index covering foreign key team_invitations_invited_by_fkey. Required for referential integrity performance.';

-- team_members.role_approved_by -> users(id)
CREATE INDEX IF NOT EXISTS idx_team_members_role_approved_by 
ON team_members(role_approved_by)
WHERE role_approved_by IS NOT NULL;

COMMENT ON INDEX idx_team_members_role_approved_by IS 
'Index covering foreign key team_members_role_approved_by_fkey. Required for referential integrity performance.';

-- team_templates.created_by -> users(id)
CREATE INDEX IF NOT EXISTS idx_team_templates_created_by 
ON team_templates(created_by)
WHERE created_by IS NOT NULL;

COMMENT ON INDEX idx_team_templates_created_by IS 
'Index covering foreign key team_templates_created_by_fkey. Required for referential integrity performance.';

-- teams.approved_by -> users(id)
CREATE INDEX IF NOT EXISTS idx_teams_approved_by 
ON teams(approved_by)
WHERE approved_by IS NOT NULL;

COMMENT ON INDEX idx_teams_approved_by IS 
'Index covering foreign key teams_approved_by_fkey. Required for referential integrity performance.';

-- teams.coach_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_teams_coach_id 
ON teams(coach_id)
WHERE coach_id IS NOT NULL;

COMMENT ON INDEX idx_teams_coach_id IS 
'Index covering foreign key teams_coach_id_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 23: TEMPLATE ASSIGNMENTS TABLE
-- =============================================================================

-- template_assignments.assigned_by -> users(id)
CREATE INDEX IF NOT EXISTS idx_template_assignments_assigned_by 
ON template_assignments(assigned_by)
WHERE assigned_by IS NOT NULL;

COMMENT ON INDEX idx_template_assignments_assigned_by IS 
'Index covering foreign key template_assignments_assigned_by_fkey. Required for referential integrity performance.';

-- template_assignments.player_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_template_assignments_player_id 
ON template_assignments(player_id)
WHERE player_id IS NOT NULL;

COMMENT ON INDEX idx_template_assignments_player_id IS 
'Index covering foreign key template_assignments_player_id_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 24: TRAINING TABLES
-- =============================================================================

-- training_load_metrics.user_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_training_load_metrics_user_id 
ON training_load_metrics(user_id)
WHERE user_id IS NOT NULL;

COMMENT ON INDEX idx_training_load_metrics_user_id IS 
'Index covering foreign key training_load_metrics_user_id_fkey. Required for referential integrity performance.';

-- training_programs.created_by -> users(id)
CREATE INDEX IF NOT EXISTS idx_training_programs_created_by 
ON training_programs(created_by)
WHERE created_by IS NOT NULL;

COMMENT ON INDEX idx_training_programs_created_by IS 
'Index covering foreign key training_programs_created_by_fkey. Required for referential integrity performance.';

-- training_videos.created_by -> users(id)
CREATE INDEX IF NOT EXISTS idx_training_videos_created_by 
ON training_videos(created_by)
WHERE created_by IS NOT NULL;

COMMENT ON INDEX idx_training_videos_created_by IS 
'Index covering foreign key training_videos_created_by_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 25: USER AGE GROUPS TABLE
-- =============================================================================

-- user_age_groups.consent_given_by -> users(id)
CREATE INDEX IF NOT EXISTS idx_user_age_groups_consent_given_by 
ON user_age_groups(consent_given_by)
WHERE consent_given_by IS NOT NULL;

COMMENT ON INDEX idx_user_age_groups_consent_given_by IS 
'Index covering foreign key user_age_groups_consent_given_by_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 26: VIDEO TABLES
-- =============================================================================

-- video_assignments.assigned_by -> users(id)
CREATE INDEX IF NOT EXISTS idx_video_assignments_assigned_by 
ON video_assignments(assigned_by)
WHERE assigned_by IS NOT NULL;

COMMENT ON INDEX idx_video_assignments_assigned_by IS 
'Index covering foreign key video_assignments_assigned_by_fkey. Required for referential integrity performance.';

-- video_assignments.playlist_id -> video_playlists(id)
CREATE INDEX IF NOT EXISTS idx_video_assignments_playlist_id 
ON video_assignments(playlist_id)
WHERE playlist_id IS NOT NULL;

COMMENT ON INDEX idx_video_assignments_playlist_id IS 
'Index covering foreign key video_assignments_playlist_id_fkey. Required for referential integrity performance.';

-- video_curation_status.updated_by -> users(id)
CREATE INDEX IF NOT EXISTS idx_video_curation_status_updated_by 
ON video_curation_status(updated_by)
WHERE updated_by IS NOT NULL;

COMMENT ON INDEX idx_video_curation_status_updated_by IS 
'Index covering foreign key video_curation_status_updated_by_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 27: WELLNESS LOGS TABLE
-- =============================================================================

-- wellness_logs.athlete_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_wellness_logs_athlete_id 
ON wellness_logs(athlete_id)
WHERE athlete_id IS NOT NULL;

COMMENT ON INDEX idx_wellness_logs_athlete_id IS 
'Index covering foreign key wellness_logs_athlete_id_fkey. Required for referential integrity performance.';

-- =============================================================================
-- PART 28: WORKOUT LOGS TABLE
-- =============================================================================

-- workout_logs.player_id -> users(id)
CREATE INDEX IF NOT EXISTS idx_workout_logs_player_id 
ON workout_logs(player_id)
WHERE player_id IS NOT NULL;

COMMENT ON INDEX idx_workout_logs_player_id IS 
'Index covering foreign key workout_logs_player_id_fkey. Required for referential integrity performance.';

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- Verify indexes were created successfully
DO $$
DECLARE
    idx_count INTEGER;
    expected_count INTEGER := 50; -- Approximate number of indexes created
    actual_count INTEGER;
BEGIN
    -- Count indexes created by this migration
    SELECT COUNT(*) INTO actual_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%_%_id'
      AND (
        indexname LIKE '%_reviewed_by%' OR
        indexname LIKE '%_user_id%' OR
        indexname LIKE '%_coach_id%' OR
        indexname LIKE '%_player_id%' OR
        indexname LIKE '%_athlete_id%' OR
        indexname LIKE '%_assigned_by%' OR
        indexname LIKE '%_created_by%' OR
        indexname LIKE '%_changed_by%' OR
        indexname LIKE '%_performed_by%' OR
        indexname LIKE '%_granted_by%' OR
        indexname LIKE '%_invited_by%' OR
        indexname LIKE '%_approved_by%' OR
        indexname LIKE '%_updated_by%' OR
        indexname LIKE '%_from_owner_id%' OR
        indexname LIKE '%_to_owner_id%' OR
        indexname LIKE '%_parent_id%' OR
        indexname LIKE '%_sender_id%' OR
        indexname LIKE '%_team_id%' OR
        indexname LIKE '%_session_id%' OR
        indexname LIKE '%_protocol_id%' OR
        indexname LIKE '%_playlist_id%' OR
        indexname LIKE '%_micro_session_id%' OR
        indexname LIKE '%_consent_given_by%' OR
        indexname LIKE '%_classified_by%' OR
        indexname LIKE '%_reviewer_id%'
      );
    
    RAISE NOTICE 'Created % foreign key indexes', actual_count;
    
    IF actual_count < expected_count * 0.8 THEN
        RAISE WARNING 'Expected approximately % indexes, but found %. Please verify manually.', expected_count, actual_count;
    END IF;
END $$;

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- This migration adds indexes for 50+ unindexed foreign keys identified by
-- the Supabase database linter. These indexes are critical for:
--
-- 1. Performance: Faster referential integrity checks during DELETE/UPDATE
-- 2. JOIN optimization: Query planner can use indexes for efficient joins
-- 3. Lock reduction: Reduced lock contention during FK constraint validation
-- 4. CASCADE operations: Efficient CASCADE/SET NULL operations
--
-- All indexes use partial indexing (WHERE column IS NOT NULL) to:
-- - Reduce index size for nullable columns
-- - Improve index maintenance performance
-- - Maintain query performance for non-null values
--
-- Note: Unused indexes reported by the linter are NOT dropped in this migration.
-- They may be needed for future queries or specific use cases. Review them
-- separately before dropping.
-- =============================================================================

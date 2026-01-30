# Unused Indexes Audit Report

**Migration:** 120 (Documentation only)  
**Date:** 2026-01-30  
**Source:** Supabase Database Linter

## Overview

This document lists indexes that have been identified as "unused" by the Supabase database linter. These indexes have not been used by any queries according to PostgreSQL's statistics.

## Important Notes

⚠️ **DO NOT DROP THESE INDEXES AUTOMATICALLY**

1. **Future Queries**: These indexes may be needed for queries that haven't been executed yet
2. **Application Updates**: New features may require these indexes
3. **Reporting**: Some indexes may be used by reporting queries that run infrequently
4. **Statistics Lag**: PostgreSQL statistics may not reflect recent query patterns

## Recommendation

Before dropping any unused indexes:

1. **Monitor Usage**: Track index usage over a period (e.g., 30-90 days)
2. **Review Application Code**: Check if any queries are designed to use these indexes
3. **Test Impact**: Drop indexes in a staging environment first
4. **Document Dependencies**: Note which features might be affected

## Unused Indexes by Category

### Authorization & Security Indexes

- `idx_auth_violations_user` on `authorization_violations`
- `idx_auth_violations_timestamp` on `authorization_violations`
- `idx_auth_violations_resource` on `authorization_violations`
- `idx_auth_violations_error_code` on `authorization_violations`
- `idx_session_version_history_coach` on `session_version_history`

**Potential Use Cases:**
- Security auditing queries
- Violation pattern analysis
- Session history tracking

### Consent & Privacy Indexes

- `idx_athlete_consent_settings_athlete` on `athlete_consent_settings`
- `idx_consent_change_log_athlete` on `consent_change_log`
- `idx_consent_access_log_athlete` on `consent_access_log`
- `idx_consent_access_log_accessed_by` on `consent_access_log`
- `idx_consent_access_log_created` on `consent_access_log`

**Potential Use Cases:**
- Compliance reporting
- Privacy audit trails
- Consent history queries

### Role & Audit Indexes

- `idx_role_audit_user` on `role_change_audit`
- `idx_role_audit_timestamp` on `role_change_audit`
- `idx_merlin_violation_log_timestamp` on `merlin_violation_log`
- `idx_safety_override_log_athlete` on `safety_override_log`
- `idx_safety_override_log_trigger` on `safety_override_log`

**Potential Use Cases:**
- Security audits
- Compliance reporting
- Historical analysis

### User & Team Management Indexes

- `idx_users_email_lower` on `users`
- `idx_users_active` on `users`
- `idx_users_email_verified` on `users`
- `idx_users_email` on `users`
- `idx_users_position` on `users`
- `idx_team_members_team_id` on `team_members`
- `idx_team_members_user_id` on `team_members`
- `idx_team_members_status` on `team_members`
- `idx_team_members_team_role` on `team_members`
- `idx_team_members_user_teams` on `team_members`

**Potential Use Cases:**
- User search functionality
- Team membership queries
- Bulk operations

### Training Session Indexes

- `idx_training_sessions_user_date` on `training_sessions`
- `idx_training_sessions_team` on `training_sessions`
- `idx_training_sessions_type` on `training_sessions`
- `idx_training_sessions_coach_locked` on `training_sessions`
- `idx_training_sessions_session_state` on `training_sessions`
- `idx_training_sessions_modified_by_coach` on `training_sessions`
- `idx_training_sessions_covering` on `training_sessions`
- `idx_training_sessions_rpe` on `training_sessions`
- `idx_training_sessions_completed_at` on `training_sessions`
- `idx_training_sessions_athlete_id` on `training_sessions`

**Potential Use Cases:**
- Training analytics
- Session filtering
- Performance reporting

### Game & Statistics Indexes

- `idx_games_game_id` on `games`
- `idx_games_team_id` on `games`
- `idx_games_date` on `games`
- `idx_game_events_game_id` on `game_events`
- `idx_game_events_player` on `game_events`
- `idx_game_events_play_type` on `game_events`
- `idx_game_events_timestamp` on `game_events`
- `idx_game_events_quarter` on `game_events`
- `idx_game_events_result` on `game_events`
- `idx_passing_stats_game` on `passing_stats`
- `idx_passing_stats_qb` on `passing_stats`
- `idx_passing_stats_receiver` on `passing_stats`
- `idx_passing_stats_outcome` on `passing_stats`
- `idx_passing_stats_drops` on `passing_stats`
- `idx_passing_stats_throw_type` on `passing_stats`
- `idx_flag_pull_stats_game` on `flag_pull_stats`
- `idx_flag_pull_stats_defender` on `flag_pull_stats`
- `idx_flag_pull_stats_carrier` on `flag_pull_stats`
- `idx_flag_pull_stats_success` on `flag_pull_stats`
- `idx_receiving_stats_game` on `receiving_stats`
- `idx_receiving_stats_receiver` on `receiving_stats`
- `idx_receiving_stats_drops` on `receiving_stats`
- `idx_player_game_summary_player` on `player_game_summary`
- `idx_player_game_summary_game` on `player_game_summary`
- `idx_player_game_summary_position` on `player_game_summary`
- `idx_situational_stats_player` on `situational_stats`
- `idx_situational_stats_type` on `situational_stats`
- `idx_opponent_analysis_team` on `opponent_analysis`
- `idx_opponent_analysis_player` on `opponent_analysis`

**Potential Use Cases:**
- Game statistics queries
- Player performance analysis
- Team analytics
- Reporting dashboards

### Knowledge Base Indexes

- `idx_kb_entry_type` on `knowledge_base_entries`
- `idx_kb_topic` on `knowledge_base_entries`
- `idx_kb_evidence_strength` on `knowledge_base_entries`
- `idx_article_search_vector` on `article_search_index`
- `idx_knowledge_search_vector` on `knowledge_search_index`

**Potential Use Cases:**
- Search functionality
- Content filtering
- Evidence-based queries

### Chatbot & AI Indexes

- `idx_chatbot_context_user` on `chatbot_user_context`
- `idx_chatbot_context_role` on `chatbot_user_context`
- `idx_chatbot_context_team` on `chatbot_user_context`
- `idx_chatbot_context_team_type` on `chatbot_user_context`
- `idx_ai_chat_sessions_user` on `ai_chat_sessions`
- `idx_ai_chat_sessions_team` on `ai_chat_sessions`
- `idx_ai_chat_sessions_started` on `ai_chat_sessions`
- `idx_ai_messages_session` on `ai_messages`
- `idx_ai_messages_user` on `ai_messages`
- `idx_ai_messages_risk` on `ai_messages`
- `idx_ai_messages_created` on `ai_messages`
- `idx_ai_recommendations_user` on `ai_recommendations`
- `idx_ai_recommendations_session` on `ai_recommendations`
- `idx_ai_recommendations_status` on `ai_recommendations`
- `idx_ai_recommendations_type` on `ai_recommendations`
- `idx_ai_recommendations_created` on `ai_recommendations`
- `idx_ai_feedback_user` on `ai_feedback`
- `idx_ai_feedback_message` on `ai_feedback`
- `idx_ai_feedback_type` on `ai_feedback`
- `idx_ai_feedback_flagged` on `ai_feedback`

**Potential Use Cases:**
- AI feature queries
- Chat history
- Recommendation filtering
- Safety monitoring

### Video & Training Indexes

- `idx_video_bookmarks_user_id` on `video_bookmarks`
- `idx_video_bookmarks_saved_at` on `video_bookmarks`
- `idx_video_curation_team_id` on `video_curation_status`
- `idx_video_curation_status` on `video_curation_status`
- `idx_video_playlists_team_id` on `video_playlists`
- `idx_video_playlists_created_by` on `video_playlists`
- `idx_video_playlists_position` on `video_playlists`
- `idx_video_watch_user_id` on `video_watch_history`
- `idx_video_watch_video_id` on `video_watch_history`
- `idx_video_watch_watched_at` on `video_watch_history`
- `idx_video_assignments_team` on `video_assignments`
- `idx_video_assignments_assigned_to` on `video_assignments`
- `idx_video_assignments_status` on `video_assignments`
- `idx_video_assignments_due_date` on `video_assignments`
- `idx_training_programs_position` on `training_programs`
- `idx_training_programs_active` on `training_programs`
- `idx_training_phases_program` on `training_phases`
- `idx_training_weeks_phase` on `training_weeks`
- `idx_session_exercises_session` on `session_exercises`
- `idx_session_exercises_exercise` on `session_exercises`
- `idx_exercises_category` on `exercises`
- `idx_exercises_position_specific` on `exercises`

**Potential Use Cases:**
- Video library queries
- Training program management
- Exercise filtering
- Assignment tracking

### Wellness & Health Indexes

- `idx_wellness_logs_user_id` on `wellness_logs`
- `idx_wellness_data_user_date` on `wellness_data`
- `idx_supplements_data_user_date` on `supplements_data`
- `idx_supplements_data_name` on `supplements_data`
- `idx_sessions_athlete_date` on `sessions`
- `idx_sessions_date` on `sessions`
- `idx_sessions_athlete` on `sessions`
- `idx_daily_wellness_checkin_user_date` on `daily_wellness_checkin`

**Potential Use Cases:**
- Health tracking
- Wellness reporting
- Historical analysis

### Notifications & Preferences Indexes

- `idx_notifications_user_id` on `notifications`
- `idx_notifications_is_read` on `notifications`
- `idx_notifications_created_at` on `notifications`
- `idx_notifications_type` on `notifications`
- `idx_notifications_user_created` on `notifications`
- `idx_user_notification_preferences_user_id` on `user_notification_preferences`
- `idx_user_notification_preferences_type` on `user_notification_preferences`
- `idx_notification_preferences_user` on `notification_preferences`
- `idx_notification_preferences_type` on `notification_preferences`
- `idx_digest_history_user` on `digest_history`
- `idx_digest_history_date` on `digest_history`
- `idx_digest_history_type` on `digest_history`

**Potential Use Cases:**
- Notification queries
- Preference filtering
- Digest generation

### Other Indexes

- `idx_coach_athlete_assignments_athlete` on `coach_athlete_assignments`
- `idx_coach_athlete_assignments_coach` on `coach_athlete_assignments`
- `idx_execution_logs_session` on `execution_logs`
- `idx_execution_logs_athlete` on `execution_logs`
- `idx_execution_logs_version` on `execution_logs`
- `idx_team_invitations_team_id` on `team_invitations`
- `idx_team_invitations_email` on `team_invitations`
- `idx_team_invitations_token` on `team_invitations`
- `idx_team_invitations_status` on `team_invitations`
- `idx_team_invitations_expires_at` on `team_invitations`
- `idx_teams_name_search` on `teams`
- `idx_session_version_history_session` on `session_version_history`
- `idx_player_programs_player` on `player_programs`
- `idx_player_programs_program` on `player_programs`
- `idx_player_programs_active` on `player_programs`
- `idx_position_metrics_player` on `position_specific_metrics`
- `idx_position_metrics_date` on `position_specific_metrics`
- `idx_position_metrics_position` on `position_specific_metrics`
- `idx_position_metrics_name` on `position_specific_metrics`
- `idx_exercise_logs_workout` on `exercise_logs`
- `idx_exercise_logs_exercise` on `exercise_logs`
- `idx_player_tournament_availability_team` on `player_tournament_availability`
- `idx_player_tournament_availability_status` on `player_tournament_availability`
- `idx_tournament_budgets_team` on `tournament_budgets`
- `idx_tournament_budgets_tournament` on `tournament_budgets`
- `idx_player_payments_player` on `player_payments`
- `idx_player_payments_team` on `player_payments`
- `idx_player_payments_status` on `player_payments`
- `idx_sponsor_contributions_team` on `sponsor_contributions`
- `idx_sponsors_active_order` on `sponsors`
- `idx_roster_audit_log_team` on `roster_audit_log`
- `idx_roster_audit_log_action` on `roster_audit_log`
- `idx_roster_audit_log_created` on `roster_audit_log`
- `idx_decision_ledger_team` on `decision_ledger`
- `idx_decision_ledger_made_by` on `decision_ledger`
- `idx_decision_ledger_status` on `decision_ledger`
- `idx_exercise_registry_category` on `exercise_registry`
- `idx_exercise_registry_name` on `exercise_registry`
- `idx_metric_entries_player` on `metric_entries`
- `idx_metric_entries_created` on `metric_entries`
- `idx_ml_training_data_player` on `ml_training_data`
- `idx_ml_training_data_created` on `ml_training_data`
- `idx_athlete_daily_state_athlete` on `athlete_daily_state`
- `idx_athlete_daily_state_date` on `athlete_daily_state`
- `idx_coach_inbox_items_coach` on `coach_inbox_items`
- `idx_coach_inbox_items_status` on `coach_inbox_items`
- `idx_coach_inbox_items_priority` on `coach_inbox_items`
- `idx_micro_sessions_type` on `micro_sessions`
- `idx_team_templates_team` on `team_templates`
- `idx_team_templates_active` on `team_templates`
- `idx_template_assignments_template` on `template_assignments`
- `idx_template_assignments_status` on `template_assignments`
- `idx_coach_overrides_player` on `coach_overrides`
- `idx_coach_overrides_coach` on `coach_overrides`
- `idx_coach_overrides_type` on `coach_overrides`
- `idx_recovery_blocks_player` on `recovery_blocks`
- `idx_recovery_blocks_date` on `recovery_blocks`
- `idx_load_caps_player` on `load_caps`
- `idx_load_caps_type` on `load_caps`
- `idx_ownership_transitions_team` on `ownership_transitions`
- `idx_ownership_transitions_status` on `ownership_transitions`
- `idx_shared_insights_shared_by` on `shared_insights`
- `idx_shared_insights_shared_with` on `shared_insights`
- `idx_shared_insights_type` on `shared_insights`
- `idx_parent_guardian_links_athlete` on `parent_guardian_links`
- `idx_classification_history_type` on `classification_history`
- `idx_parent_notifications_athlete` on `parent_notifications`
- `idx_parent_notifications_type` on `parent_notifications`
- `idx_user_ai_preferences_user` on `user_ai_preferences`
- `idx_approval_requests_requester` on `approval_requests`
- `idx_approval_requests_approver` on `approval_requests`
- `idx_approval_requests_status` on `approval_requests`
- `idx_ai_response_feedback_user` on `ai_response_feedback`
- `idx_ai_response_feedback_type` on `ai_response_feedback`
- `idx_coach_analytics_cache_coach` on `coach_analytics_cache`
- `idx_coach_analytics_cache_team` on `coach_analytics_cache`
- `idx_team_insights_team` on `team_insights`
- `idx_team_insights_type` on `team_insights`
- `idx_athlete_achievements_athlete` on `athlete_achievements`
- `idx_athlete_achievements_type` on `athlete_achievements`
- `idx_conversation_context_user` on `conversation_context`
- `idx_conversation_context_session` on `conversation_context`
- `idx_push_subscriptions_user` on `push_subscriptions`
- `idx_user_security_user` on `user_security`
- `idx_user_settings_user` on `user_settings`
- `idx_user_settings_key` on `user_settings`
- `idx_injuries_player` on `injuries`
- `idx_injuries_status` on `injuries`
- `idx_injuries_date` on `injuries`
- `idx_workout_logs_rpe` on `workout_logs`

## Action Plan

1. **Monitor** (30-90 days): Track index usage statistics
2. **Review**: Check application code for planned usage
3. **Test**: Drop indexes in staging environment
4. **Document**: Note any performance impacts
5. **Schedule**: Plan index removal during low-traffic periods

## SQL Query to Monitor Index Usage

```sql
-- Check index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0  -- Unused indexes
ORDER BY tablename, indexname;
```

## References

- [Supabase Database Linter Documentation](https://supabase.com/docs/guides/database/database-linter)
- [PostgreSQL Index Maintenance](https://www.postgresql.org/docs/current/routine-maintenance.html#Routine-Maintenance-Indexes)

# Data Model (GENERATED — do not hand-edit)

> Regenerate: `npm run docs:regen` (reads `docs/generated/live-schema.snapshot.json`).
> Refresh against live: re-run the Supabase introspection into that snapshot (Supabase MCP), then rerun.
> **Schema snapshot (live): 2026-07-23** · doc regenerated: 2026-07-23

**204 base tables, 7 views.** Tables flagged `DRIFT` exist live but are not defined in any migration file.

**DRIFT (live, no migration file):** `zz_video_backup_20260719`

## Tables

### `account_deletion_requests`
Touched by: `account-deletion`, `auth`

- `id` uuid · not null
- `user_id` uuid · not null
- `reason` text
- `status` text · not null
- `soft_deleted_at` timestamp with time zone
- `scheduled_hard_delete_at` timestamp with time zone
- `sessions_revoked_at` timestamp with time zone
- `hard_deleted_at` timestamp with time zone
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null
- `requested_at` timestamp with time zone
- `error_message` text

### `account_pause_requests`
Touched by: `ai-chat`, `calc-readiness`, `coach-core`, `compute-acwr`, `daily-load`, `daily-training`, `load-management`, `monitoring-report`, `recovery-recommendations`, `smart-training-recommendations`, `training-metrics`, `training-plan`, `training-stats-enhanced`, `user-context`

- `id` uuid · not null
- `user_id` uuid · not null
- `paused_at` timestamp with time zone · not null
- `paused_until` timestamp with time zone
- `reason` text
- `acwr_frozen` boolean · not null
- `is_active` boolean · not null
- `resumed_at` timestamp with time zone
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `achievement_definitions`
Touched by: `achievements`

- `id` uuid · not null
- `slug` text · not null
- `name` text · not null
- `description` text
- `icon` text
- `category` text · not null
- `points` integer · not null
- `criteria` jsonb · not null
- `display_order` integer · not null
- `is_active` boolean · not null
- `created_at` timestamp with time zone · not null

### `acwr_snapshots`
Touched by: `alert-evaluate-rules`, `alert-resolve`

- `id` uuid · not null
- `user_id` uuid · not null
- `snapshot_date` date · not null
- `acute_load_au` numeric · not null
- `chronic_load_au` numeric · not null
- `acwr_ratio` numeric
- `personalized_safe_zone_min` numeric
- `personalized_safe_zone_max` numeric
- `acwr_status` character varying
- `safety_alert` boolean
- `biomarker_multiplier` numeric
- `confound_multiplier` numeric
- `menstrual_cycle_multiplier` numeric
- `chronotype_multiplier` numeric
- `position_multiplier` numeric
- `genetic_multiplier` numeric
- `cumulative_multiplier` numeric
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `age_recovery_modifiers`
Touched by: `daily-protocol`, `player-settings`, `roster`

- `id` integer · not null
- `age_min` integer · not null
- `age_max` integer · not null
- `recovery_modifier` numeric · not null
- `acwr_max_adjustment` numeric · not null
- `label` text

### `ai_chat_sessions`
Touched by: `ai-chat`, `ai-telemetry`

- `id` uuid · not null
- `user_id` uuid · not null
- `team_id` uuid
- `started_at` timestamp with time zone · not null
- `ended_at` timestamp with time zone
- `context_snapshot` jsonb
- `goal` character varying
- `time_horizon` character varying
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `ai_followups`
Touched by: `ai-chat`

- `id` uuid · not null
- `user_id` uuid · not null
- `session_id` uuid
- `followup_type` character varying · not null
- `scheduled_for` timestamp with time zone · not null
- `message` text · not null
- `status` character varying
- `sent_at` timestamp with time zone
- `response` text
- `metadata` jsonb
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `ai_messages`
Touched by: `ai-chat`, `ai-telemetry`, `coach`, `coach-analytics`, `coach-inbox`, `response-feedback`, `team`, `team-templates`

- `id` uuid · not null
- `session_id` uuid · not null
- `user_id` uuid · not null
- `role` character varying · not null
- `content` text · not null
- `risk_level` character varying
- `intent` character varying
- `citations` jsonb
- `metadata` jsonb
- `created_at` timestamp with time zone · not null
- `coach_reviewed_at` timestamp with time zone
- `coach_reviewed_by` uuid
- `feedback_received` boolean · not null

### `ai_recommendations`
Touched by: `ai-chat`, `ai-telemetry`

- `id` uuid · not null
- `user_id` uuid · not null
- `chat_session_id` uuid
- `message_id` uuid
- `recommendation_type` character varying · not null
- `reason` text · not null
- `recommendation_data` jsonb
- `status` character varying · not null
- `accepted_at` timestamp with time zone
- `rejected_at` timestamp with time zone
- `completed_at` timestamp with time zone
- `outcome` text
- `created_at` timestamp with time zone · not null

### `ai_response_feedback`
Touched by: `ai-chat`, `coach`, `coach-analytics`, `response-feedback`

- `id` uuid · not null
- `user_id` uuid · not null
- `session_id` uuid
- `message_id` uuid
- `feedback_type` character varying · not null
- `feedback_text` text
- `created_at` timestamp with time zone
- `feedback_source` text
- `was_helpful` boolean
- `knowledge_sources_used` jsonb

### `ai_training_suggestions`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `user_id` uuid · not null
- `suggestion_type` text · not null
- `priority` text
- `title` text
- `description` text
- `message` text
- `reason` text
- `confidence_score` numeric
- `data_sources` jsonb
- `status` text
- `accepted` boolean · not null
- `dismissed` boolean · not null
- `affected_session_id` uuid
- `suggested_changes` jsonb
- `applied_at` timestamp with time zone
- `dismissed_at` timestamp with time zone
- `expires_at` timestamp with time zone
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `alert_delivery_logs`
Touched by: `alert-evaluate-rules`, `alert-get-athlete`

- `id` uuid · not null
- `generated_alert_id` uuid · not null
- `recipient_user_id` uuid · not null
- `channel` character varying · not null
- `sent_at` timestamp without time zone
- `delivered_at` timestamp without time zone
- `read_at` timestamp without time zone
- `delivery_status` character varying
- `error_message` text
- `created_at` timestamp without time zone

### `alert_preferences`
Touched by: `alert-preferences`

- `id` uuid · not null
- `user_id` uuid · not null
- `alert_type` character varying · not null
- `enabled` boolean
- `channels` jsonb
- `quiet_hours_start` time without time zone
- `quiet_hours_end` time without time zone
- `timezone` character varying
- `created_at` timestamp without time zone
- `updated_at` timestamp without time zone

### `alert_routes`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `alert_rule_id` uuid · not null
- `recipient_role` character varying · not null
- `recipient_user_id` uuid
- `organization_id` uuid
- `enabled` boolean
- `created_at` timestamp without time zone

### `alert_rules`
Touched by: `alert-dashboard`, `alert-evaluate-rules`, `alert-get-athlete`

- `id` uuid · not null
- `name` character varying · not null
- `alert_type` character varying · not null
- `description` text
- `trigger_condition` jsonb · not null
- `enabled` boolean
- `organization_id` uuid
- `created_at` timestamp without time zone
- `updated_at` timestamp without time zone

### `alert_subscriptions`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `subscriber_user_id` uuid · not null
- `alert_rule_id` uuid · not null
- `target_athlete_id` uuid
- `channels` jsonb
- `enabled` boolean
- `created_at` timestamp without time zone
- `updated_at` timestamp without time zone

### `announcement_reads`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `message_id` uuid · not null
- `user_id` uuid · not null
- `read_at` timestamp with time zone · not null
- `acknowledged` boolean · not null
- `acknowledged_at` timestamp with time zone

### `approval_requests`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `requester_id` uuid · not null
- `approver_id` uuid · not null
- `request_type` character varying · not null
- `request_data` jsonb · not null
- `status` character varying
- `response_data` jsonb
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `athlete_consent_settings`
Touched by: `performance-data`, `readiness-history`, `team-monitoring`, `wellness-checkin`, `wellness-logs`

- `user_id` uuid · not null
- `share_readiness_with_coach` boolean · not null
- `share_wellness_answers_with_coach` boolean · not null
- `share_training_notes_with_coach` boolean · not null
- `share_merlin_conversations_with_coach` boolean · not null
- `share_readiness_with_all_coaches` boolean · not null
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `athlete_events`
Touched by: `athlete-events`, `periodization-prescription`, `schedule`

- `id` uuid · not null
- `user_id` uuid · not null
- `category` text · not null
- `kind` text · not null
- `title` text · not null
- `starts_at` timestamp with time zone · not null
- `ends_at` timestamp with time zone
- `expected_game_count` integer · not null
- `importance` text · not null
- `location` text
- `venue` text
- `notes` text
- `status` text · not null
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null
- `tier` text
- `surface` text

### `athlete_hydration_logs`
Touched by: `hydration`, `staff`, `staff-nutritionist`, `wellness`

- `id` uuid · not null
- `user_id` uuid · not null
- `logged_at` timestamp with time zone · not null
- `amount_ml` integer · not null
- `beverage_type` text · not null
- `note` text
- `source` text · not null
- `metadata` jsonb · not null
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `athlete_injuries`
Touched by: `alert-resolve`, `athlete-injuries`, `calc-readiness`, `coach`, `coach-core`, `daily-protocol`, `injury-analytics`, `monitoring-report`, `periodization-prescription`, `physiotherapist-dashboard`, `readiness`, `rtp-create-assignment`, `staff`, `staff-physiotherapist`, `user-profile`, `user-profile-core`, `wellness-checkin`

- `id` uuid · not null
- `user_id` uuid · not null
- `injury_type` text
- `injury_location` text
- `injury_grade` text
- `injury_date` date
- `injury_mechanism` text
- `activity_at_injury` text
- `diagnosis` text
- `recovery_status` text · not null
- `current_phase` text
- `rtp_progress` integer
- `expected_return_date` date
- `activity_restrictions` ARRAY
- `medical_notes` text
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `athlete_nutrition_profiles`
Touched by: `nutrition`, `staff`, `staff-nutritionist`, `wellness`

- `id` uuid · not null
- `user_id` uuid · not null
- `weight_kg` numeric
- `height_cm` numeric
- `age` integer
- `sex` text
- `activity_level` text
- `goal` text
- `training_time` text
- `bmr` numeric
- `tdee` numeric
- `target_calories` integer
- `protein_g` numeric
- `carbs_g` numeric
- `fat_g` numeric
- `calculated_profile` jsonb
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `athlete_training_config`
Touched by: `daily-protocol`, `periodization-prescription`, `player-settings`, `roster`

- `user_id` uuid · not null
- `primary_position` text · not null
- `secondary_position` text
- `birth_date` date
- `flag_practice_schedule` jsonb · not null
- `daily_routine` jsonb · not null
- `max_sessions_per_week` integer · not null
- `has_gym_access` boolean · not null
- `has_field_access` boolean · not null
- `warmup_focus` text
- `available_equipment` jsonb · not null
- `current_limitations` jsonb
- `age_recovery_modifier` numeric · not null
- `acwr_target_min` numeric · not null
- `acwr_target_max` numeric · not null
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null
- `season_calendar` jsonb · not null
- `team_training_days` jsonb · not null

### `athlete_travel_log`
Touched by: `event-travel`, `periodization-prescription`

- `id` uuid · not null
- `user_id` uuid · not null
- `arrival_date` date
- `adaptation_day` integer
- `timezone_difference` integer
- `notes` text
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null
- `competition_event_id` uuid
- `team_id` uuid
- `mode` text · not null
- `depart_at` timestamp with time zone · not null
- `arrive_at` timestamp with time zone · not null
- `overnight_stay` boolean · not null

### `attendance_records`
Touched by: `attendance`, `team`, `team-calendar`

- `id` uuid · not null
- `event_id` text · not null
- `team_id` uuid
- `user_id` uuid · not null
- `status` text · not null
- `guests` integer · not null
- `needs_ride` boolean · not null
- `can_provide_ride` boolean · not null
- `notes` text
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `authorization_violations`
Touched by: `admin`, `admin-credentials`, `ai-telemetry`, `alert-acknowledge`, `alert-dashboard`, `alert-get-athlete`, `alert-resolve`, `calc-readiness`, `calibration-logs`, `coach-core`, `compute-acwr`, `daily-training`, `import-open-data`, `injury-analytics`, `knowledge-governance`, `performance-data`, `physio-protocol`, `readiness-history`, `recovery-recommendations`, `rtp-advance-phase`, `rtp-all-protocols`, `rtp-create-assignment`, `rtp-phase-progress`, `rtp-protocol-assignment`, `rtp-psychological-assessment`, `rtp-record-assessment`, `rtp-team-protocols`, `season-archive`, `smart-training-recommendations`, `staff-profile`, `team-acwr`, `team-monitoring`, `training-metrics`, `training-sessions`, `user-profile-core`, `wellness-checkin`, `wellness-logs`

- `violation_id` uuid · not null
- `user_id` uuid · not null
- `resource_id` uuid
- `resource_type` text · not null
- `action` text · not null
- `error_code` text · not null
- `error_message` text · not null
- `timestamp` timestamp with time zone · not null
- `ip_address` inet
- `user_agent` text
- `request_path` text
- `request_method` text
- `request_body` jsonb

### `billing_customers`
Touched by: `billing-lapse-check`, `billing-status`, `daily-load`, `data`, `data-export`, `stripe-checkout`, `stripe-portal`, `stripe-webhook`, `training-sessions`

- `id` uuid · not null
- `stripe_customer_id` text · not null
- `owner_user_id` uuid
- `owner_team_id` uuid
- `created_at` timestamp with time zone · not null

### `blocked_users`
Touched by: `community`, `social`

- `id` uuid · not null
- `user_id` uuid · not null
- `blocked_user_id` uuid · not null
- `created_at` timestamp with time zone · not null

### `bloodwork_baselines`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `user_id` uuid · not null
- `marker_name` text · not null
- `baseline_value` numeric · not null
- `unit` text
- `established_on` date · not null
- `source_panel_id` uuid
- `notes` text
- `updated_at` timestamp with time zone · not null

### `bloodwork_markers`
Touched by: `bloodwork`, `monitoring-report`

- `id` uuid · not null
- `panel_id` uuid · not null
- `marker_name` text · not null
- `value` numeric
- `unit` text
- `reference_low` numeric
- `reference_high` numeric
- `flag` text
- `created_at` timestamp with time zone · not null

### `bloodwork_panels`
Touched by: `bloodwork`, `monitoring-report`

- `id` uuid · not null
- `user_id` uuid · not null
- `collected_date` date · not null
- `panel_type` text
- `lab_name` text
- `ordered_by` text
- `notes` text
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `calibration_logs`
Touched by: `calibration-logs`

- `id` uuid · not null
- `user_id` uuid · not null
- `timestamp` timestamp with time zone · not null
- `recommendation_type` text
- `readiness_score` numeric
- `acwr` numeric
- `rationale` text
- `preset_id` text
- `preset_version` text
- `phase` text
- `days_until_event` integer
- `event_importance` text
- `injury_flagged` boolean · not null
- `injury_date` date
- `injury_type` text
- `performance_rating` numeric
- `session_quality` numeric
- `subjective_feedback` text
- `outcome_recorded_at` timestamp with time zone
- `created_at` timestamp with time zone · not null

### `channel_members`
Touched by: `chat`, `social`

- `id` uuid · not null
- `channel_id` uuid · not null
- `user_id` uuid · not null
- `can_post` boolean · not null
- `is_admin` boolean · not null
- `is_muted` boolean · not null
- `last_read_at` timestamp with time zone
- `joined_at` timestamp with time zone · not null

### `channels`
Touched by: `chat`, `social`

- `id` uuid · not null
- `team_id` uuid
- `name` character varying · not null
- `description` text
- `channel_type` text · not null
- `position_filter` character varying
- `game_id` character varying
- `is_group_dm` boolean · not null
- `is_archived` boolean · not null
- `is_default` boolean · not null
- `allow_threads` boolean · not null
- `created_by` uuid
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `chat_messages`
Touched by: `chat`, `social`

- `id` uuid · not null
- `user_id` uuid
- `sender_id` uuid
- `recipient_id` uuid
- `team_id` uuid
- `channel_id` uuid
- `channel` text
- `message` text · not null
- `message_type` text · not null
- `metadata` jsonb · not null
- `attachments` jsonb · not null
- `mentions` ARRAY · not null
- `reply_to` uuid
- `thread_id` uuid
- `reply_count` integer · not null
- `is_edited` boolean · not null
- `is_pinned` boolean · not null
- `pinned_by` uuid
- `pinned_at` timestamp with time zone
- `is_important` boolean · not null
- `is_read` boolean · not null
- `read_at` timestamp with time zone
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `classification_history`
Touched by: `ai-chat`

- `id` uuid · not null
- `user_id` uuid · not null
- `classification_type` character varying · not null
- `previous_value` text
- `new_value` text
- `reason` text
- `classified_by` uuid
- `created_at` timestamp with time zone

### `coach_activity_log`
Touched by: `coach`, `coach-activity`

- `id` uuid · not null
- `team_id` uuid · not null
- `user_id` uuid · not null
- `coach_id` uuid
- `activity_type` character varying · not null
- `title` character varying · not null
- `description` text
- `data` jsonb · not null
- `is_read` boolean · not null
- `read_at` timestamp with time zone
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `coach_alert_acknowledgments`
Touched by: `coach`, `coach-alerts`

- `id` uuid · not null
- `coach_id` uuid · not null
- `alert_type` character varying · not null
- `user_id` uuid
- `acknowledged_at` timestamp with time zone
- `notes` text
- `action_taken` text
- `created_at` timestamp with time zone

### `coach_analytics_cache`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `coach_id` uuid · not null
- `team_id` uuid
- `cache_key` character varying · not null
- `cache_data` jsonb · not null
- `expires_at` timestamp with time zone · not null
- `created_at` timestamp with time zone

### `coach_inbox_items`
Touched by: `ai-chat`, `coach`, `coach-inbox`, `daily-protocol`, `team`, `team-templates`, `wellness`, `wellness-checkin`

- `id` uuid · not null
- `coach_id` uuid · not null
- `user_id` uuid
- `team_id` uuid
- `item_type` character varying · not null
- `title` text · not null
- `message` text
- `priority` character varying
- `status` character varying
- `metadata` jsonb
- `source` character varying
- `action_required` boolean
- `action_taken` text
- `actioned_at` timestamp with time zone
- `expires_at` timestamp with time zone
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `coach_overrides`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `user_id` uuid · not null
- `coach_id` uuid · not null
- `override_type` character varying · not null
- `override_data` jsonb · not null
- `reason` text
- `expires_at` timestamp with time zone
- `created_at` timestamp with time zone

### `coach_profiles`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `user_id` uuid · not null
- `coaching_license_number` character varying
- `coaching_license_issued_by` character varying
- `coach_specialty` character varying
- `position_specialization` character varying
- `years_of_coaching_experience` integer
- `education_background` text
- `coaching_certifications` ARRAY
- `coaching_philosophy` text
- `bio` text
- `credentials_verified` boolean
- `verification_completed_at` timestamp with time zone
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null
- `years_as_head_coach` integer
- `coaching_background` text
- `team_development_approach` text

### `comment_likes`
Touched by: `community`, `social`

- `id` uuid · not null
- `comment_id` uuid · not null
- `user_id` uuid · not null
- `created_at` timestamp with time zone · not null

### `community_poll_options`
Touched by: `community`, `social`

- `id` uuid · not null
- `poll_id` uuid · not null
- `option_text` text · not null
- `votes_count` integer · not null

### `community_poll_votes`
Touched by: `community`, `social`

- `id` uuid · not null
- `option_id` uuid · not null
- `user_id` uuid · not null
- `created_at` timestamp with time zone · not null

### `community_polls`
Touched by: `community`, `social`

- `id` uuid · not null
- `post_id` uuid · not null
- `question` text · not null
- `ends_at` timestamp with time zone
- `created_at` timestamp with time zone · not null

### `competition_events`
Touched by: `event-games`, `wellness`, `wellness-checkin`

- `id` uuid · not null
- `competition_id` uuid · not null
- `team_id` uuid · not null
- `starts_at` timestamp with time zone · not null
- `ends_at` timestamp with time zone
- `expected_game_count` integer · not null
- `importance` text · not null
- `label` text
- `location` text
- `venue` text
- `notes` text
- `status` text · not null
- `external_id` text
- `metadata` jsonb · not null
- `created_by` uuid
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null
- `minutes_per_game` integer
- `game_format` character varying
- `hotel_name` text
- `hotel_address` text
- `surface` text

### `competitions`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `name` text · not null
- `short_name` text
- `kind` text · not null
- `level` text · not null
- `country` text
- `governing_body` text
- `format` text
- `season_year` integer
- `starts_on` date
- `ends_on` date
- `external_id` text
- `source` text · not null
- `metadata` jsonb · not null
- `created_by` uuid
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `consent_access_log`
Touched by: `analytics-core`, `coach-core`, `load-management`, `performance-data`, `staff-nutritionist`, `staff-psychology`

- `id` uuid · not null
- `user_id` uuid · not null
- `accessed_by` uuid · not null
- `access_type` character varying · not null
- `data_category` character varying
- `accessed_at` timestamp with time zone
- `reason` text
- `consent_given` boolean

### `contraindication_rules`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `injury_location` text · not null
- `blocked_modality` text · not null
- `rtp_phase_cleared_at` integer
- `gate_level` text · not null
- `methodology_citation` text · not null
- `is_active` boolean · not null

### `conversation_context`
Touched by: `ai-chat`

- `id` uuid · not null
- `user_id` uuid · not null
- `session_id` uuid
- `context_type` character varying · not null
- `context_data` jsonb · not null
- `expires_at` timestamp with time zone
- `is_active` boolean
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `credential_verifications`
Touched by: `admin-credentials`, `staff-coach-profile`, `staff-head-coach-profile`, `staff-manager-profile`, `staff-nutritionist-profile`, `staff-physiotherapist-profile`, `staff-profile`, `staff-psychologist-profile`, `staff-strength-coach-profile`

- `id` uuid · not null
- `user_id` uuid · not null
- `credential_type` character varying · not null
- `credential_name` character varying · not null
- `issuing_body` character varying
- `credential_number` character varying
- `issue_date` date
- `expiry_date` date
- `document_url` text
- `status` character varying · not null
- `verified_by` uuid
- `verification_notes` text
- `rejected_reason` text
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null
- `verified_at` timestamp with time zone

### `cycle_logs`
Touched by: `cycle`

- `id` uuid · not null
- `user_id` uuid · not null
- `log_date` date · not null
- `flow` text
- `symptoms` ARRAY · not null
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `cycle_tracking_profiles`
Touched by: `cycle`

- `user_id` uuid · not null
- `enabled` boolean · not null
- `hormonal_contraception` boolean · not null
- `adaptation_level` text · not null
- `typical_cycle_length` integer
- `typical_period_length` integer
- `consent_version` text
- `consent_granted_at` timestamp with time zone
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `daily_protocols`
Touched by: `ai-chat`, `coach`, `coach-alerts`, `coach-core`, `daily-protocol`

- `id` uuid · not null
- `user_id` uuid · not null
- `protocol_date` date · not null
- `readiness_score` integer
- `acwr_value` numeric
- `total_load_target_au` integer
- `ai_rationale` text
- `training_focus` text
- `morning_status` text
- `foam_roll_status` text
- `main_session_status` text
- `evening_status` text
- `overall_progress` integer
- `completed_exercises` integer
- `total_exercises` integer
- `morning_completed_at` timestamp with time zone
- `foam_roll_completed_at` timestamp with time zone
- `main_session_completed_at` timestamp with time zone
- `evening_completed_at` timestamp with time zone
- `actual_duration_minutes` integer
- `actual_rpe` integer
- `actual_load_au` integer
- `session_notes` text
- `generated_at` timestamp with time zone
- `updated_at` timestamp with time zone
- `coach_alert_active` boolean
- `coach_alert_message` text
- `coach_alert_requires_acknowledgment` boolean
- `coach_acknowledged` boolean
- `coach_acknowledged_at` timestamp with time zone
- `modified_by_coach_id` uuid
- `modified_by_coach_name` text
- `modified_at` timestamp with time zone
- `coach_note` text
- `coach_note_priority` text
- `confidence_metadata` jsonb
- `isometrics_status` text
- `plyometrics_status` text
- `strength_status` text
- `conditioning_status` text
- `skill_drills_status` text
- `warm_up_status` text
- `cool_down_status` text
- `isometrics_completed_at` timestamp with time zone
- `plyometrics_completed_at` timestamp with time zone
- `strength_completed_at` timestamp with time zone
- `conditioning_completed_at` timestamp with time zone
- `skill_drills_completed_at` timestamp with time zone
- `warm_up_completed_at` timestamp with time zone
- `cool_down_completed_at` timestamp with time zone

### `daily_wellness_checkin`
Touched by: `ai-chat`, `analytics`, `analytics-core`, `calc-readiness`, `coach`, `coach-core`, `daily-protocol`, `load-management`, `monitoring-report`, `performance-data`, `readiness`, `sleep-data`, `smart-training-recommendations`, `staff-nutritionist`, `staff-psychology`, `team-monitoring`, `training`, `user-context`, `user-profile`, `wellness`, `wellness-checkin`, `wellness-logs`

- `id` uuid · not null
- `user_id` uuid · not null
- `checkin_date` date · not null
- `sleep_quality` integer
- `sleep_hours` numeric
- `energy_level` integer
- `muscle_soreness` integer
- `stress_level` integer
- `soreness_areas` ARRAY
- `motivation_level` integer
- `mood` integer
- `hydration_level` integer
- `notes` text
- `calculated_readiness` numeric
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone
- `travel_hours` integer

### `decision_ledger`
Touched by: `decisions`, `programs`

- `id` uuid · not null
- `team_id` uuid · not null
- `decision_type` character varying · not null
- `decision_maker` uuid · not null
- `decision_data` jsonb · not null
- `rationale` text
- `status` character varying
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone
- `review_date` timestamp with time zone
- `review_priority` text

### `decision_review_reminders`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `decision_id` uuid · not null
- `reminder_date` date · not null
- `reminder_sent` boolean
- `created_at` timestamp with time zone

### `device_pairings`
Touched by: `data`, `session-load-import`, `session-load-import-csv`, `wearables`, `wearables-callback`, `wearables-webhook`

- `id` uuid · not null
- `user_id` uuid · not null
- `provider_id` uuid · not null
- `team_id` uuid
- `external_athlete_id` text
- `device_identifier` text
- `is_active` boolean · not null
- `paired_at` timestamp with time zone · not null
- `access_token_encrypted` text
- `refresh_token_encrypted` text
- `token_expires_at` timestamp with time zone
- `scopes` ARRAY

### `emergency_medical_records`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `user_id` uuid
- `user_email_hash` text
- `record_type` text
- `record_data` jsonb · not null
- `retention_until` timestamp with time zone
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null
- `event_type` text
- `event_date` timestamp with time zone
- `medical_data` jsonb
- `location_data` jsonb
- `retention_expires_at` timestamp with time zone

### `event_availability`
Touched by: `event-availability`, `wellness`, `wellness-checkin`

- `id` uuid · not null
- `user_id` uuid · not null
- `competition_event_id` uuid · not null
- `team_id` uuid · not null
- `status` character varying · not null
- `reason` text
- `arrival_date` date
- `departure_date` date
- `accommodation_needed` boolean
- `transportation_needed` boolean
- `dietary_restrictions` text
- `payment_status` character varying
- `amount_due` numeric
- `amount_paid` numeric
- `payment_deadline` date
- `responded_at` timestamp with time zone
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `event_games`
Touched by: `event-games`

- `id` uuid · not null
- `competition_event_id` uuid · not null
- `team_id` uuid · not null
- `game_number` integer · not null
- `game_date` date · not null
- `kickoff_time` time without time zone · not null
- `expected_duration_minutes` integer · not null
- `opponent` text
- `field` text
- `bracket_stage` text
- `is_provisional` boolean · not null
- `status` text · not null
- `result` jsonb
- `created_by` uuid
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `event_participation`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `user_id` uuid · not null
- `competition_event_id` uuid · not null
- `team_id` uuid
- `attended` boolean · not null
- `games_played` integer · not null
- `games_expected` integer
- `total_minutes` integer
- `avg_rpe` numeric
- `load_au` numeric
- `status` text · not null
- `notes` text
- `training_session_id` uuid
- `recorded_by` uuid
- `recorded_at` timestamp with time zone
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone
- `game_id` uuid

### `execution_logs`
Touched by: _(no endpoint references this table)_

- `log_id` uuid · not null
- `session_id` uuid · not null
- `session_version` integer · not null
- `user_id` uuid · not null
- `exercise_id` uuid
- `exercise_name` text
- `sets_completed` integer
- `reps_completed` integer
- `load_kg` numeric
- `rpe` integer
- `duration_minutes` integer
- `notes` text
- `logged_at` timestamp with time zone · not null

### `exercise_progressions`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `exercise_id` uuid · not null
- `progression_type` text · not null
- `increment_value` numeric
- `min_value` numeric
- `max_value` numeric
- `reset_threshold` numeric
- `requires_completion` boolean
- `acwr_adjustment_factor` numeric
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `exercisedb_import_logs`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `import_date` timestamp with time zone
- `exercises_imported` integer
- `exercises_updated` integer
- `errors` jsonb
- `status` character varying

### `exercises`
Touched by: `daily-protocol`, `exercise-progression`, `exercises`, `team-practice-plan`

- `id` uuid · not null
- `name` character varying · not null
- `category` character varying
- `movement_pattern` character varying
- `description` text
- `video_url` character varying
- `equipment_needed` ARRAY
- `position_specific` ARRAY
- `applicable_positions` ARRAY
- `metrics_tracked` ARRAY
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone
- `slug` text
- `video_id` text
- `video_duration_seconds` integer
- `thumbnail_url` text
- `how_text` text
- `feel_text` text
- `compensation_text` text
- `load_contribution_au` integer
- `subcategory` text
- `instructions` ARRAY
- `coaching_cues` ARRAY
- `muscle_groups` ARRAY
- `difficulty_level` text
- `image_url` text
- `default_sets` integer
- `default_reps` integer
- `default_hold_seconds` integer
- `default_duration_seconds` integer
- `target_muscles` ARRAY
- `equipment_required` ARRAY
- `active` boolean
- `is_high_intensity` boolean
- `tissue_targets` ARRAY
- `contraction_type` text
- `joint_emphasis` text
- `loading_rate_band` text
- `peak_load_bw` numeric
- `evidence_tier` text
- `rehab_stage` smallint

### `external_load_metrics`
Touched by: `external-load`

- `id` uuid · not null
- `user_id` uuid · not null
- `session_date` date · not null
- `source` text · not null
- `device_name` text
- `total_distance_m` numeric
- `high_speed_distance_m` numeric
- `sprint_distance_m` numeric
- `player_load` numeric
- `accelerations` integer
- `decelerations` integer
- `max_velocity_kmh` numeric
- `avg_heart_rate` integer
- `max_heart_rate` integer
- `duration_minutes` integer
- `training_session_id` uuid
- `notes` text
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `flag_pull_stats`
Touched by: _(no endpoint references this table)_

- `id` integer · not null
- `game_event_id` integer
- `game_id` character varying · not null
- `ball_carrier_id` character varying · not null
- `defender_id` character varying · not null
- `attempt_type` character varying
- `attempt_location` character varying
- `is_successful` boolean · not null
- `yards_before_pull` integer
- `yards_after_miss` integer
- `miss_reason` character varying
- `evasion_technique` character varying
- `closing_speed` numeric
- `pursuit_angle_degrees` integer
- `reaction_time` numeric
- `num_broken_tackles` integer
- `yards_after_contact` integer
- `video_clip_url` text
- `created_at` timestamp without time zone

### `frontend_logs`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `timestamp` timestamp with time zone · not null
- `level` text · not null
- `trace_id` uuid
- `user_id` uuid · not null
- `message` text · not null
- `context` jsonb · not null

### `game_events`
Touched by: `game-events`, `games`, `games-core`, `player-stats`, `roster`

- `id` integer · not null
- `game_id` character varying · not null
- `team_id` character varying · not null
- `play_number` integer · not null
- `timestamp` timestamp without time zone
- `quarter` integer
- `down` integer
- `distance` integer
- `yard_line` integer
- `field_zone` character varying
- `time_remaining` integer
- `score_differential` integer
- `play_type` character varying
- `play_category` character varying
- `primary_player_id` character varying
- `secondary_player_ids` ARRAY
- `defender_ids` ARRAY
- `play_result` character varying
- `yards_gained` integer
- `yards_after_catch` integer
- `is_successful` boolean
- `is_turnover` boolean
- `is_penalty` boolean
- `penalty_type` character varying
- `weather_conditions` character varying
- `field_conditions` character varying
- `play_notes` text
- `video_timestamp` integer
- `video_clip_url` text
- `created_at` timestamp without time zone

### `game_participations`
Touched by: `game-events`, `games`

- `id` uuid · not null
- `game_id` character varying · not null
- `team_id` uuid · not null
- `user_id` uuid · not null
- `status` character varying · not null
- `position` character varying
- `notes` text
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `games`
Touched by: `ai-chat`, `coach`, `coach-core`, `daily-training`, `game-events`, `games`, `games-core`, `player-stats`, `roster`, `team`, `team-calendar`, `training`, `training-plan`, `trends`

- `id` integer · not null
- `game_id` character varying · not null
- `team_id` character varying · not null
- `opponent_team_name` character varying · not null
- `game_date` date · not null
- `game_time` time without time zone
- `location` character varying
- `is_home_game` boolean
- `team_score` integer
- `opponent_score` integer
- `game_result` character varying
- `weather_conditions` character varying
- `temperature` integer
- `field_conditions` character varying
- `season` character varying
- `tournament_name` character varying
- `game_type` character varying
- `game_video_url` text
- `created_at` timestamp without time zone
- `updated_at` timestamp without time zone
- `competition_event_id` uuid
- `version` integer · not null

### `generated_alerts`
Touched by: `alert-acknowledge`, `alert-dashboard`, `alert-evaluate-rules`, `alert-get-athlete`, `alert-resolve`

- `id` uuid · not null
- `user_id` uuid · not null
- `rule_id` uuid · not null
- `alert_type` character varying · not null
- `title` character varying · not null
- `description` text
- `trigger_data` jsonb
- `related_athlete_id` uuid
- `related_injury_id` uuid
- `related_entity_type` character varying
- `related_entity_id` uuid
- `acknowledged` boolean
- `acknowledged_by` uuid
- `acknowledged_note` text
- `acknowledged_at` timestamp without time zone
- `status` character varying
- `resolved_at` timestamp without time zone
- `alert_date` date · not null
- `created_at` timestamp without time zone
- `updated_at` timestamp without time zone

### `invoices`
Touched by: `data`, `data-export`, `stripe-webhook`

- `id` uuid · not null
- `subscription_id` uuid · not null
- `stripe_invoice_id` text · not null
- `amount_due_cents` integer · not null
- `currency` text · not null
- `status` text · not null
- `hosted_invoice_url` text
- `paid_at` timestamp with time zone
- `created_at` timestamp with time zone · not null

### `knowledge_base_entries`
Touched by: `ai-chat`, `ai-telemetry`, `knowledge`, `knowledge-governance`, `knowledge-search`

- `id` uuid · not null
- `entry_type` character varying · not null
- `topic` character varying · not null
- `question` text
- `answer` text · not null
- `summary` text
- `supporting_articles` ARRAY
- `evidence_strength` character varying
- `consensus_level` character varying
- `dosage_guidelines` jsonb
- `protocols` jsonb
- `contraindications` ARRAY
- `safety_warnings` ARRAY
- `best_practices` ARRAY
- `applicable_to` ARRAY
- `sport_specificity` character varying
- `query_count` integer
- `last_queried_at` timestamp without time zone
- `created_at` timestamp without time zone
- `updated_at` timestamp without time zone
- `is_merlin_approved` boolean · not null
- `merlin_approval_status` text · not null
- `merlin_submitted_by` uuid
- `merlin_submitted_by_role` text
- `merlin_submitted_at` timestamp with time zone · not null
- `merlin_approved_by` uuid
- `merlin_approved_by_role` text
- `merlin_approved_at` timestamp with time zone
- `merlin_approval_notes` text

### `knowledge_base_governance_log`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `entry_id` uuid
- `action` character varying · not null
- `performed_by` uuid
- `reason` text
- `changes` jsonb
- `created_at` timestamp with time zone

### `knowledge_review_audit`
Touched by: `knowledge`, `knowledge-governance`

- `id` bigint · not null
- `entry_id` uuid · not null
- `reviewed_by` uuid · not null
- `reviewed_by_role` text · not null
- `action` text · not null
- `notes` text
- `quality_gate_override` boolean · not null
- `quality_issues` jsonb · not null
- `created_at` timestamp with time zone · not null

### `knowledge_search_index`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `entry_id` uuid
- `searchable_text` text
- `search_vector` tsvector
- `created_at` timestamp without time zone

### `learned_user_preferences`
Touched by: `ai-chat`

- `user_id` uuid · not null
- `helpful_responses` integer · not null
- `dismissed_responses` integer · not null
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `manager_profiles`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `user_id` uuid · not null
- `education_background` text
- `years_of_experience` integer
- `management_specialization` character varying
- `bio` text
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `meal_templates`
Touched by: `nutrition`, `wellness`

- `id` uuid · not null
- `name` text · not null
- `category` text
- `meal_type` text
- `calories` integer
- `protein_g` numeric
- `carbs_g` numeric
- `fat_g` numeric
- `ingredients` jsonb
- `instructions` text
- `is_active` boolean · not null
- `created_by` uuid
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `mental_performance_logs`
Touched by: `staff`, `staff-psychology`

- `id` uuid · not null
- `user_id` uuid · not null
- `log_date` date · not null
- `confidence_level` integer
- `focus_level` integer
- `motivation_level` integer
- `anxiety_level` integer
- `pre_game_nerves` integer
- `visualization_completed` boolean
- `mental_rehearsal_minutes` integer
- `decision_making_clarity` integer
- `reaction_time_feeling` integer
- `life_stress_level` integer
- `mental_readiness_score` integer
- `context` text
- `notes` text
- `created_at` timestamp with time zone · not null

### `mental_wellness_reports`
Touched by: `staff`, `staff-psychology`

- `id` uuid · not null
- `user_id` uuid · not null
- `report_type` text · not null
- `report_data` jsonb · not null
- `generated_at` timestamp with time zone · not null
- `created_at` timestamp with time zone · not null

### `merlin_violation_log`
Touched by: `ai-chat`, `daily-training`, `decisions`, `performance-data`, `training-complete`, `training-sessions`

- `violation_id` uuid · not null
- `violation_type` text · not null
- `endpoint` text · not null
- `request_body` text
- `user_agent` text
- `timestamp` timestamp with time zone · not null

### `message_read_receipts`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `message_id` uuid · not null
- `user_id` uuid · not null
- `read_at` timestamp with time zone · not null

### `metric_definitions`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `metric_name` character varying · not null
- `metric_type` character varying · not null
- `unit` character varying
- `description` text
- `target_value` numeric
- `min_value` numeric
- `max_value` numeric
- `created_at` timestamp with time zone

### `metric_entries`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `user_id` uuid · not null
- `metric_id` uuid · not null
- `metric_value` numeric · not null
- `recorded_at` timestamp with time zone · not null
- `session_id` uuid
- `notes` text
- `created_at` timestamp with time zone

### `micro_session_analytics`
Touched by: `micro-sessions`, `programs`

- `id` uuid · not null
- `user_id` uuid · not null
- `micro_session_id` uuid
- `completion_rate` numeric
- `avg_duration_seconds` integer
- `streak_days` integer
- `total_completed` integer
- `favorite_type` character varying
- `last_completed_at` timestamp with time zone
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `micro_sessions`
Touched by: `coach`, `coach-analytics`, `micro-sessions`, `programs`, `team`, `team-templates`

- `id` uuid · not null
- `user_id` uuid · not null
- `session_type` character varying · not null
- `title` character varying · not null
- `duration_seconds` integer · not null
- `instructions` ARRAY
- `scheduled_time` time without time zone
- `trigger_context` character varying
- `completed_at` timestamp with time zone
- `skipped` boolean
- `notes` text
- `created_at` timestamp with time zone
- `assigned_date` date
- `status` text

### `ml_training_data`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `user_id` uuid · not null
- `feature_vector` jsonb · not null
- `target_value` numeric
- `prediction_type` character varying
- `model_version` character varying
- `created_at` timestamp with time zone

### `monitoring_config`
Touched by: `monitoring-report`

- `id` uuid · not null
- `team_id` uuid
- `metric` text · not null
- `key` text · not null
- `sex` text
- `value` numeric · not null
- `unit` text
- `citation` text
- `is_active` boolean · not null
- `updated_by` uuid
- `updated_at` timestamp with time zone · not null

### `monitoring_providers`
Touched by: `data`, `session-load-import`, `session-load-import-csv`, `wearables`, `wearables-callback`, `wearables-connect`, `wearables-webhook`

- `id` uuid · not null
- `key` text · not null
- `display_name` text · not null
- `kind` text · not null
- `is_active` boolean · not null

### `movement_patterns`
Touched by: `training`, `training-programs`

- `id` uuid · not null
- `program_id` uuid
- `name` character varying · not null
- `description` text
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `notifications`
Touched by: `coach`, `coach-core`, `daily-protocol`, `physiotherapist-dashboard`, `player-settings`, `staff`, `staff-physiotherapist`, `stripe-webhook`, `supplements`, `team-join`, `training`, `training-complete`, `training-programs`, `wellness`, `wellness-checkin`

- `id` uuid · not null
- `user_id` uuid · not null
- `notification_type` character varying
- `title` character varying
- `message` text · not null
- `is_read` boolean
- `priority` character varying
- `action_url` text
- `dismissed` boolean
- `expires_at` timestamp with time zone
- `category` character varying
- `severity` character varying
- `data` jsonb
- `sender_id` uuid
- `sender_name` character varying
- `related_entity_type` character varying
- `related_entity_id` uuid
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `nutrition_goals`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `user_id` uuid · not null
- `calories_target` integer
- `protein_target` integer
- `carbs_target` integer
- `fat_target` integer
- `fiber_target` integer
- `goal_type` character varying
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `nutrition_logs`
Touched by: `wellness`, `wellness-checkin`

- `id` uuid · not null
- `user_id` uuid · not null
- `food_name` character varying · not null
- `food_id` integer
- `calories` numeric
- `protein` numeric
- `carbohydrates` numeric
- `fat` numeric
- `fiber` numeric
- `meal_type` character varying
- `logged_at` timestamp with time zone
- `notes` text
- `created_at` timestamp with time zone

### `nutrition_plans`
Touched by: `ai-chat`, `nutrition`, `wellness`

- `id` uuid · not null
- `user_id` uuid · not null
- `name` text
- `plan_type` text
- `calories` integer
- `protein_g` numeric
- `carbs_g` numeric
- `fat_g` numeric
- `fluid_l` numeric
- `meals` jsonb
- `start_date` date
- `end_date` date
- `notes` text
- `is_active` boolean · not null
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `nutrition_reports`
Touched by: `staff`, `staff-nutritionist`

- `id` uuid · not null
- `user_id` uuid · not null
- `created_by` uuid
- `team_id` uuid
- `report_type` character varying · not null
- `report_data` jsonb · not null
- `period_start` date
- `period_end` date
- `created_at` timestamp with time zone · not null

### `nutritionist_profiles`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `user_id` uuid · not null
- `credential_type` character varying
- `credential_number` character varying
- `credential_issuing_body` character varying
- `specializations` ARRAY
- `years_of_experience` integer
- `education_background` text
- `certifications` ARRAY
- `bio` text
- `credentials_verified` boolean
- `verification_completed_at` timestamp with time zone
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `opponent_analysis`
Touched by: _(no endpoint references this table)_

- `id` integer · not null
- `opponent_team_name` character varying · not null
- `opponent_player_name` character varying
- `formation_tendencies` jsonb
- `play_tendencies` jsonb
- `situational_tendencies` jsonb
- `strengths` ARRAY
- `weaknesses` ARRAY
- `exploitable_matchups` ARRAY
- `avg_points_per_game` numeric
- `avg_yards_per_play` numeric
- `turnover_rate` numeric
- `scouting_notes` text
- `game_plan_recommendations` text
- `season` character varying
- `last_updated` timestamp without time zone
- `created_at` timestamp without time zone

### `ownership_transitions`
Touched by: `physiotherapist-dashboard`, `staff`, `staff-physiotherapist`, `wellness`, `wellness-checkin`

- `id` uuid · not null
- `team_id` uuid · not null
- `from_owner_id` uuid · not null
- `to_owner_id` uuid · not null
- `transition_date` date · not null
- `status` character varying
- `created_at` timestamp with time zone

### `parent_guardian_links`
Touched by: `ai-chat`

- `id` uuid · not null
- `user_id` uuid · not null
- `parent_id` uuid · not null
- `relationship` character varying
- `is_primary` boolean
- `can_view_training` boolean
- `can_view_wellness` boolean
- `can_view_nutrition` boolean
- `can_communicate_coach` boolean
- `verified` boolean
- `verified_at` timestamp with time zone
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `parent_notifications`
Touched by: `ai-chat`

- `id` uuid · not null
- `parent_id` uuid · not null
- `user_id` uuid · not null
- `notification_type` character varying · not null
- `title` text · not null
- `message` text
- `priority` character varying
- `is_read` boolean
- `read_at` timestamp with time zone
- `metadata` jsonb
- `created_at` timestamp with time zone

### `parental_consent`
Touched by: `auth`, `parental-consent`, `privacy-settings`, `user-profile`

- `id` uuid · not null
- `minor_user_id` uuid · not null
- `guardian_email` text
- `guardian_name` text
- `relationship` text
- `status` text · not null
- `consent_scope` jsonb · not null
- `verified_at` timestamp with time zone
- `expires_at` timestamp with time zone
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null
- `verification_token` text
- `verification_sent_at` timestamp with time zone

### `passing_stats`
Touched by: _(no endpoint references this table)_

- `id` integer · not null
- `game_event_id` integer
- `game_id` character varying · not null
- `quarterback_id` character varying · not null
- `receiver_id` character varying
- `defender_id` character varying
- `throw_type` character varying
- `route_depth` integer
- `target_location` character varying
- `throw_accuracy` character varying
- `intended_spot_accuracy` numeric
- `outcome` character varying
- `is_drop` boolean
- `drop_severity` character varying
- `drop_reason` character varying
- `qb_under_pressure` boolean
- `time_to_throw` numeric
- `coverage_type` character varying
- `separation_at_catch` numeric
- `throw_velocity` integer
- `hang_time` numeric
- `video_clip_url` text
- `video_start_time` numeric
- `video_end_time` numeric
- `created_at` timestamp without time zone

### `performance_records`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `user_id` uuid · not null
- `sprint_10m` numeric
- `sprint_20m` numeric
- `dash_40` numeric
- `pro_agility` numeric
- `l_drill` numeric
- `reactive_agility` numeric
- `vertical_jump` numeric
- `broad_jump` numeric
- `rsi` numeric
- `bench_press` numeric
- `back_squat` numeric
- `deadlift` numeric
- `body_weight` numeric
- `notes` text
- `overall_score` numeric
- `recorded_at` timestamp with time zone · not null
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null
- `performance_day` date · not null

### `performance_tests`
Touched by: `analytics`, `analytics-core`, `performance-data`, `performance-metrics`

- `id` uuid · not null
- `user_id` uuid · not null
- `test_type` character varying · not null
- `result_value` numeric · not null
- `target_value` numeric
- `test_date` timestamp with time zone · not null
- `conditions` jsonb
- `notes` text
- `created_at` timestamp with time zone · not null

### `physical_measurements`
Touched by: `ai-chat`, `analytics`, `performance-data`, `staff`, `staff-nutritionist`

- `id` uuid · not null
- `user_id` uuid · not null
- `weight` numeric
- `height` numeric
- `body_fat` numeric
- `muscle_mass` numeric
- `body_water_mass` numeric
- `fat_mass` numeric
- `protein_mass` numeric
- `bone_mineral_content` numeric
- `skeletal_muscle_mass` numeric
- `muscle_percentage` numeric
- `body_water_percentage` numeric
- `protein_percentage` numeric
- `bone_mineral_percentage` numeric
- `visceral_fat_rating` integer
- `basal_metabolic_rate` integer
- `waist_to_hip_ratio` numeric
- `body_age` integer
- `notes` text
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `physio_blocks`
Touched by: `monitoring-report`

- `id` uuid · not null
- `user_id` uuid · not null
- `body_region` text
- `block_type` text
- `restrictions` ARRAY · not null
- `max_load_percent` integer
- `injury_id` uuid
- `start_date` date · not null
- `end_date` date
- `is_active` boolean · not null
- `authored_by` uuid
- `clinical_note` text
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `physiotherapist_profiles`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `user_id` uuid · not null
- `license_number` character varying
- `license_issued_by` character varying
- `specializations` ARRAY
- `years_of_experience` integer
- `education_background` text
- `insurance_provider` character varying
- `insurance_policy_number` character varying
- `insurance_expiry_date` date
- `bio` text
- `credentials_verified` boolean
- `verification_completed_at` timestamp with time zone
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `player_achievements`
Touched by: `achievements`

- `id` uuid · not null
- `user_id` uuid · not null
- `achievement_id` uuid · not null
- `earned_at` timestamp with time zone · not null
- `context_data` jsonb · not null
- `created_at` timestamp with time zone · not null

### `player_programs`
Touched by: `daily-protocol`, `player-programs`, `programs`, `smart-training-recommendations`, `training`, `training-plan`

- `id` uuid · not null
- `program_id` uuid
- `assigned_by` uuid
- `start_date` date · not null
- `end_date` date
- `is_active` boolean
- `compliance_rate` numeric
- `notes` text
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone
- `user_id` uuid
- `assigned_position_id` uuid
- `status` USER-DEFINED
- `paused_reason` text
- `paused_at` timestamp with time zone
- `assigned_timezone` character varying
- `current_week` integer
- `current_phase_id` uuid
- `completion_percentage` numeric
- `modifications` jsonb

### `player_streaks`
Touched by: `achievements`, `wellness`, `wellness-checkin`

- `id` uuid · not null
- `user_id` uuid · not null
- `streak_type` text · not null
- `current_streak` integer · not null
- `longest_streak` integer · not null
- `last_activity_date` date
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `player_training_stats`
Touched by: `achievements`, `daily-protocol`

- `user_id` uuid · not null
- `total_sessions` integer · not null
- `total_exercises` integer · not null
- `total_training_minutes` integer · not null
- `total_load_au` numeric · not null
- `total_throws` integer · not null
- `tournaments_completed` integer · not null
- `total_achievements` integer · not null
- `total_points` integer · not null
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null
- `month_sessions` integer · not null
- `month_load_au` numeric · not null
- `current_month` text

### `position_specific_metrics`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `user_id` uuid
- `workout_log_id` uuid
- `position_id` uuid
- `metric_name` character varying · not null
- `metric_value` numeric · not null
- `metric_unit` character varying
- `date` date · not null
- `weekly_total` numeric
- `monthly_total` numeric
- `notes` text
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `positions`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `name` character varying · not null
- `display_name` character varying · not null
- `description` text
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `post_bookmarks`
Touched by: `community`, `social`

- `id` uuid · not null
- `post_id` uuid · not null
- `user_id` uuid · not null
- `created_at` timestamp with time zone · not null

### `post_comments`
Touched by: `community`, `social`

- `id` uuid · not null
- `post_id` uuid · not null
- `user_id` uuid · not null
- `content` text · not null
- `likes_count` integer · not null
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `post_likes`
Touched by: `community`, `social`

- `id` uuid · not null
- `post_id` uuid · not null
- `user_id` uuid · not null
- `created_at` timestamp with time zone · not null

### `posts`
Touched by: `community`, `social`

- `id` uuid · not null
- `user_id` uuid · not null
- `team_id` uuid
- `title` text
- `content` text · not null
- `post_type` text · not null
- `location` text
- `media_url` text
- `media_type` text
- `likes_count` integer · not null
- `comments_count` integer · not null
- `shares_count` integer · not null
- `is_published` boolean · not null
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `practice_plans`
Touched by: `team`, `team-calendar`

- `id` uuid · not null
- `team_id` uuid · not null
- `created_by` uuid · not null
- `title` text · not null
- `practice_date` date · not null
- `start_time` text · not null
- `end_time` text · not null
- `duration_minutes` integer · not null
- `location` text · not null
- `focus` text
- `equipment` jsonb · not null
- `activities` jsonb · not null
- `coach_notes` text
- `attendance` jsonb · not null
- `status` text · not null
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `prescription_audit_log`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `daily_protocol_id` uuid
- `athlete_id` uuid · not null
- `exercise_slug` text
- `field_changed` text · not null
- `original_value` text
- `modified_value` text
- `modification_reason` text · not null
- `modified_by` text · not null
- `created_at` timestamp with time zone · not null

### `prescription_templates`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `modality` text · not null
- `intensity_zone` text
- `position_group` text
- `periodization_phase` text
- `prescribed_sets` integer
- `prescribed_reps` integer
- `prescribed_hold_seconds` integer
- `prescribed_distance_m` integer
- `prescribed_duration_s` integer
- `rest_seconds` integer
- `load_contribution_au` numeric · not null
- `methodology_citation` text · not null
- `notes` text
- `is_active` boolean · not null
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `privacy_audit_log`
Touched by: `auth`, `cycle`, `parental-consent`, `privacy-settings`, `user-profile`

- `id` uuid · not null
- `user_id` uuid
- `action` text · not null
- `affected_table` text
- `affected_data` jsonb · not null
- `actor_user_id` uuid
- `created_at` timestamp with time zone · not null

### `privacy_settings`
Touched by: `ai-chat`, `analytics-core`, `coach-core`, `load-management`, `performance-data`, `privacy-settings`, `staff-nutritionist`, `staff-psychology`, `user-profile`

- `user_id` uuid · not null
- `performance_sharing_default` boolean · not null
- `health_sharing_default` boolean · not null
- `ai_processing_enabled` boolean · not null
- `ai_processing_consent_date` timestamp with time zone
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `proactive_checkins`
Touched by: `ai-chat`

- `id` uuid · not null
- `user_id` uuid · not null
- `checkin_type` text
- `message` text
- `status` text · not null
- `scheduled_for` timestamp with time zone
- `engaged_at` timestamp with time zone
- `created_at` timestamp with time zone · not null

### `program_assignments`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `program_id` uuid · not null
- `user_id` uuid · not null
- `assigned_by` uuid · not null
- `assigned_at` timestamp with time zone · not null
- `active_from` date · not null
- `active_to` date
- `status` character varying · not null
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `protocol_exercises`
Touched by: `daily-protocol`, `exercise-progression`, `exercises`

- `id` uuid · not null
- `protocol_id` uuid · not null
- `exercise_id` uuid
- `block_type` text · not null
- `sequence_order` integer · not null
- `prescribed_sets` integer
- `prescribed_reps` integer
- `prescribed_hold_seconds` integer
- `prescribed_duration_seconds` integer
- `prescribed_weight_kg` numeric
- `yesterday_sets` integer
- `yesterday_reps` integer
- `yesterday_hold_seconds` integer
- `progression_note` text
- `ai_note` text
- `status` text
- `completed_at` timestamp with time zone
- `actual_sets` integer
- `actual_reps` integer
- `actual_hold_seconds` integer
- `actual_duration_seconds` integer
- `actual_weight_kg` numeric
- `load_contribution_au` integer
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone
- `exercise_name` text
- `rest_seconds` integer

### `protocol_generation_requests`
Touched by: `daily-protocol`

- `id` uuid · not null
- `user_id` uuid · not null
- `protocol_date` date · not null
- `idempotency_key` text · not null
- `status` text · not null
- `protocol_id` uuid
- `error` text
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `psychological_assessments`
Touched by: `staff`, `staff-psychology`

- `id` uuid · not null
- `user_id` uuid · not null
- `coach_id` uuid
- `assessment_type` text
- `questions` jsonb
- `responses` jsonb
- `score` integer
- `interpretation` text
- `recommendations` jsonb
- `requires_professional_review` boolean · not null
- `completed_at` timestamp with time zone
- `created_at` timestamp with time zone · not null

### `psychologist_profiles`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `user_id` uuid · not null
- `license_number` character varying
- `license_issued_by` character varying
- `degree_type` character varying
- `degree_field` character varying
- `specializations` ARRAY
- `years_of_experience` integer
- `education_background` text
- `certifications` ARRAY
- `bio` text
- `credentials_verified` boolean
- `verification_completed_at` timestamp with time zone
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `push_subscriptions`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `user_id` uuid · not null
- `endpoint` text · not null
- `p256dh_key` text · not null
- `auth_key` text · not null
- `user_agent` text
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `qb_throwing_sessions`
Touched by: `exercises`, `qb-throwing`

- `id` uuid · not null
- `user_id` uuid · not null
- `session_date` date · not null
- `session_type` text · not null
- `total_throws` integer · not null
- `short_throws` integer · not null
- `medium_throws` integer · not null
- `long_throws` integer · not null
- `location` text
- `arm_feeling_before` integer
- `arm_feeling_after` integer
- `pre_throwing_warmup_done` boolean · not null
- `post_throwing_arm_care_done` boolean · not null
- `ice_applied` boolean · not null
- `warmup_duration_minutes` integer
- `throwing_duration_minutes` integer
- `arm_care_duration_minutes` integer
- `notes` text
- `mechanics_focus` text
- `fatigue_level` integer
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `readiness_gates`
Touched by: `daily-protocol`

- `id` uuid · not null
- `context` text · not null
- `threshold_low` integer · not null
- `threshold_mid` integer
- `threshold_high` integer
- `action_low` text · not null
- `action_mid` text
- `action_high` text
- `methodology_citation` text · not null
- `is_active` boolean · not null

### `readiness_scores`
Touched by: `calc-readiness`, `coach`, `coach-core`, `daily-protocol`, `performance-data`, `periodization-prescription`, `readiness`, `readiness-history`, `team-monitoring`, `wellness-checkin`, `wellness-logs`

- `id` uuid · not null
- `sleep_score` numeric
- `acwr` numeric
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone
- `user_id` uuid · not null
- `day` date · not null
- `score` numeric
- `level` text
- `suggestion` text
- `acute_load` numeric
- `chronic_load` numeric
- `workload_score` numeric
- `proximity_score` numeric

### `receiving_stats`
Touched by: _(no endpoint references this table)_

- `id` integer · not null
- `game_event_id` integer
- `game_id` character varying · not null
- `receiver_id` character varying · not null
- `quarterback_id` character varying
- `target_number` integer
- `route_type` character varying
- `route_depth` integer
- `is_target` boolean
- `is_catch` boolean
- `is_drop` boolean
- `drop_severity` character varying
- `yards_gained` integer
- `yards_after_catch` integer
- `is_touchdown` boolean
- `separation_at_catch` numeric
- `coverage_type` character varying
- `defender_id` character varying
- `contested_catch` boolean
- `video_clip_url` text
- `created_at` timestamp without time zone

### `recovery_blocks`
Touched by: `ai-chat`, `daily-protocol`, `games`, `games-core`, `wellness`, `wellness-checkin`

- `id` uuid · not null
- `user_id` uuid · not null
- `block_start_date` date · not null
- `block_end_date` date · not null
- `block_type` character varying
- `reason` text
- `created_at` timestamp with time zone
- `max_load_percent` integer
- `focus` text
- `restrictions` jsonb

### `recovery_logs`
Touched by: `recovery-effectiveness`

- `id` uuid · not null
- `athlete_id` uuid · not null
- `modality_name` text · not null
- `effectiveness_score` numeric · not null
- `domain` text · not null
- `created_at` timestamp with time zone · not null

### `recovery_protocols`
Touched by: `health`, `recovery-core`

- `id` uuid · not null
- `name` text · not null
- `description` text
- `category` text
- `duration_minutes` integer
- `instructions` jsonb
- `target_areas` ARRAY
- `equipment_needed` ARRAY
- `effectiveness_rating` numeric
- `is_active` boolean
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `recovery_sessions`
Touched by: `daily-protocol`, `health`, `recovery-core`

- `id` uuid · not null
- `user_id` uuid · not null
- `protocol_id` uuid
- `started_at` timestamp with time zone
- `completed_at` timestamp with time zone
- `status` text
- `duration_actual_minutes` integer
- `notes` text
- `effectiveness_rating` integer
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `research_articles`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `title` text · not null
- `authors` ARRAY
- `publication_year` integer
- `journal` character varying
- `publisher` character varying
- `doi` character varying
- `pubmed_id` character varying
- `pmc_id` character varying
- `arxiv_id` character varying
- `semantic_scholar_id` character varying
- `abstract` text
- `full_text` text
- `full_text_url` text
- `pdf_url` text
- `primary_category` character varying
- `categories` ARRAY
- `tags` ARRAY
- `study_type` character varying
- `evidence_level` character varying
- `sample_size` integer
- `population_type` character varying
- `sport_type` character varying
- `key_findings` text
- `methodology` text
- `results_summary` text
- `conclusions` text
- `practical_applications` ARRAY
- `injury_types` ARRAY
- `supplement_types` ARRAY
- `recovery_methods` ARRAY
- `training_types` ARRAY
- `psychological_topics` ARRAY
- `food_sources` jsonb
- `absorption_tips` ARRAY
- `supplement_guidance` jsonb
- `safety_warnings` ARRAY
- `sauna_protocols` jsonb
- `cold_therapy_protocols` jsonb
- `massage_gun_protocols` jsonb
- `training_protocols` jsonb
- `periodization_phases` ARRAY
- `psychological_techniques` ARRAY
- `mental_training_methods` ARRAY
- `citation_count` integer
- `altmetric_score` numeric
- `impact_factor` numeric
- `source_type` character varying
- `is_open_access` boolean
- `license_type` character varying
- `verified` boolean
- `verified_by` character varying
- `verification_date` timestamp without time zone
- `quality_score` integer
- `integrated_into_chatbot` boolean
- `chatbot_usage_count` integer
- `last_used_at` timestamp without time zone
- `keywords` ARRAY
- `mesh_terms` ARRAY
- `created_at` timestamp without time zone
- `updated_at` timestamp without time zone

### `return_to_play_protocols`
Touched by: `calc-readiness`, `daily-protocol`, `health`, `monitoring-report`, `return-to-play`

- `id` uuid · not null
- `user_id` uuid · not null
- `status` text · not null
- `current_phase` integer · not null
- `phase_description` text
- `start_date` date · not null
- `estimated_completion_date` date
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `role_change_audit`
Touched by: _(no endpoint references this table)_

- `id` bigint · not null
- `user_id` uuid · not null
- `old_role` text
- `new_role` text · not null
- `changed_by` uuid
- `changed_at` timestamp with time zone
- `change_reason` text
- `ip_address` inet
- `user_agent` text

### `roster_audit_log`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `team_id` uuid · not null
- `action` character varying · not null
- `user_id` uuid
- `performed_by` uuid · not null
- `old_values` jsonb
- `new_values` jsonb
- `reason` text
- `created_at` timestamp with time zone

### `rtp_athlete_protocol_assignments`
Touched by: `physiotherapist-dashboard`, `recovery-recommendations`, `rtp-advance-phase`, `rtp-all-protocols`, `rtp-create-assignment`, `rtp-protocol-assignment`, `rtp-record-assessment`, `rtp-team-protocols`

- `id` uuid · not null
- `athlete_id` uuid · not null
- `injury_id` uuid · not null
- `protocol_id` uuid · not null
- `current_phase` integer
- `phase_start_date` date · not null
- `estimated_return_date` date
- `individual_modifiers` jsonb
- `biological_maturity_gate_passed` boolean
- `created_at` timestamp without time zone
- `updated_at` timestamp without time zone

### `rtp_criteria_assessments`
Touched by: `rtp-advance-phase`, `rtp-protocol-assignment`, `rtp-record-assessment`

- `id` uuid · not null
- `assignment_id` uuid · not null
- `criteria_id` uuid · not null
- `assessed_date` date · not null
- `assessed_value` character varying
- `pass_fail` boolean
- `notes` text
- `assessed_by_staff_id` uuid
- `created_at` timestamp without time zone

### `rtp_functional_criteria`
Touched by: `rtp-advance-phase`, `rtp-protocol-assignment`, `rtp-record-assessment`

- `id` uuid · not null
- `protocol_id` uuid · not null
- `criteria_name` character varying
- `criteria_type` character varying
- `target_value` character varying
- `measurement_method` text
- `pass_threshold` character varying
- `phase_required` integer
- `created_at` timestamp without time zone

### `rtp_phase_progress`
Touched by: `rtp-phase-progress`

- `id` uuid · not null
- `user_id` uuid · not null
- `injury_id` uuid · not null
- `week_ending` date · not null
- `current_rtp_phase` integer · not null
- `strength_lsi_pct` numeric
- `hop_test_battery_pct` numeric
- `acl_rsi_pct` numeric
- `tsk11_normalized` boolean
- `biomechanics_symmetrical` boolean
- `athlete_confidence_1_10` integer
- `coach_confidence_1_10` integer
- `pain_level_0_10` integer
- `acwr_target_min` numeric
- `acwr_target_max` numeric
- `acwr_compliance_pct` numeric
- `ready_for_next_phase` boolean
- `coach_notes` text
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `rtp_prescription_approvals`
Touched by: `daily-protocol`

- `id` uuid · not null
- `return_to_play_id` uuid
- `daily_protocol_id` uuid
- `athlete_id` uuid · not null
- `rtp_phase` integer
- `trigger` text · not null
- `status` text · not null
- `approved_by` uuid
- `reviewed_at` timestamp with time zone
- `coach_notes` text
- `created_at` timestamp with time zone · not null

### `rtp_protocol_definitions`
Touched by: `rtp-advance-phase`, `rtp-create-assignment`

- `id` uuid · not null
- `injury_type` character varying · not null
- `display_name` character varying · not null
- `evidence_grade` character varying
- `typical_rtp_timeline_days_min` integer
- `typical_rtp_timeline_days_max` integer
- `rts_rate_percent` numeric
- `description` text
- `key_studies` jsonb
- `created_at` timestamp without time zone
- `updated_at` timestamp without time zone

### `rtp_protocol_phases`
Touched by: `rtp-advance-phase`, `rtp-protocol-assignment`

- `id` uuid · not null
- `protocol_id` uuid · not null
- `phase_number` integer · not null
- `phase_name` character varying
- `week_start` integer
- `week_end` integer
- `acwr_target_min` numeric
- `acwr_target_max` numeric
- `description` text
- `activities` ARRAY
- `restrictions` ARRAY
- `pain_level_max` integer
- `key_milestones` text
- `created_at` timestamp without time zone

### `rtp_psychological_assessments`
Touched by: `rtp-psychological-assessment`

- `id` uuid · not null
- `user_id` uuid · not null
- `assessment_date` date · not null
- `injury_id` uuid
- `acl_rsi_score` integer
- `tsk11_score` integer
- `confidence_1_10` integer
- `coping_strategies` text
- `created_at` timestamp with time zone

### `safety_override_log`
Touched by: _(no endpoint references this table)_

- `override_id` uuid · not null
- `user_id` uuid · not null
- `trigger_type` text · not null
- `trigger_value` jsonb · not null
- `data_disclosed` jsonb · not null
- `disclosed_to_roles` ARRAY · not null
- `disclosed_to_user_ids` ARRAY · not null
- `override_timestamp` timestamp with time zone · not null
- `athlete_notified` boolean
- `athlete_notified_at` timestamp with time zone

### `season_archives`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `season_id` uuid · not null
- `archived_at` timestamp with time zone · not null
- `metadata` jsonb · not null

### `seat_sync_queue`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `team_id` uuid · not null
- `requested_at` timestamp with time zone · not null
- `processed_at` timestamp with time zone
- `error_message` text

### `session_exercises`
Touched by: `daily-protocol`, `training`, `training-programs`

- `id` uuid · not null
- `session_id` uuid
- `exercise_id` uuid
- `exercise_order` integer · not null
- `sets` integer
- `reps` text
- `weight` numeric
- `duration_minutes` integer
- `distance` integer
- `rest_seconds` integer
- `notes` text
- `position_specific_params` jsonb
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone
- `session_template_id` uuid
- `exercise_name` text
- `load_type` character varying
- `load_value` numeric
- `duration_seconds` integer
- `distance_meters` integer
- `load_description` text
- `load_percentage` numeric
- `tempo` text
- `intensity` text

### `session_load`
Touched by: `monitoring-report`, `session-load-import`, `session-load-import-csv`

- `id` uuid · not null
- `user_id` uuid · not null
- `session_id` text · not null
- `provider` text · not null
- `recorded_at` timestamp with time zone · not null
- `training_session_id` uuid
- `player_load` numeric
- `player_load_per_min` numeric
- `high_ima` integer
- `jump_count` integer
- `landing_count` integer
- `landing_asymmetry_pct` numeric
- `cod_total` integer
- `cod_planned` integer
- `cod_reactive` integer
- `cod_band1_count` integer
- `cod_band2_count` integer
- `cod_band3_count` integer
- `accel_total` integer
- `accel_band1_count` integer
- `accel_band2_count` integer
- `accel_band3_count` integer
- `decel_total` integer
- `decel_band1_count` integer
- `decel_band2_count` integer
- `decel_band3_count` integer
- `decel_accel_ratio` numeric
- `total_distance_m` numeric
- `hsr_distance_m` numeric
- `max_velocity_kmh` numeric
- `sprint_count` integer
- `sprint_distance_m` numeric
- `hr_max` integer
- `hr_avg` integer
- `resting_hr` integer
- `hrv` numeric
- `trimp` numeric
- `hrr` integer
- `hr_z1_seconds` integer
- `hr_z2_seconds` integer
- `hr_z3_seconds` integer
- `hr_z4_seconds` integer
- `hr_z5_seconds` integer
- `session_context` text
- `notes` text
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `session_version_history`
Touched by: _(no endpoint references this table)_

- `version_id` uuid · not null
- `session_id` uuid · not null
- `version_number` integer · not null
- `session_structure` jsonb · not null
- `modified_by_coach_id` uuid
- `modified_at` timestamp with time zone · not null
- `modification_reason` text
- `visible_to_athlete` boolean
- `athlete_viewed_at` timestamp with time zone
- `created_at` timestamp with time zone · not null

### `shared_insights`
Touched by: `wellness`, `wellness-checkin`

- `id` uuid · not null
- `shared_by` uuid · not null
- `shared_with` uuid · not null
- `insight_type` character varying · not null
- `insight_data` jsonb · not null
- `shared_at` timestamp with time zone

### `situational_stats`
Touched by: _(no endpoint references this table)_

- `id` integer · not null
- `user_id` character varying · not null
- `situation_type` character varying
- `attempts` integer
- `successes` integer
- `success_rate` numeric
- `avg_yards` numeric
- `touchdowns` integer
- `turnovers` integer
- `season` character varying
- `date_start` date
- `date_end` date
- `created_at` timestamp without time zone
- `updated_at` timestamp without time zone

### `sponsors`
Touched by: `daily-protocol`, `player-settings`, `team-join`, `training-programs`

- `id` integer · not null
- `name` character varying · not null
- `logo_url` text · not null
- `website_url` text
- `display_order` integer
- `is_active` boolean
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `staff_roles`
Touched by: _(no endpoint references this table)_

- `id` character varying · not null
- `display_name` character varying · not null
- `category` character varying · not null
- `can_manage_roster` boolean
- `can_delete_players` boolean
- `can_view_health_data` boolean
- `sort_order` integer
- `created_at` timestamp with time zone

### `state_transition_history`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `session_id` uuid · not null
- `from_state` text
- `to_state` text · not null
- `actor_role` text · not null
- `actor_id` uuid
- `transitioned_at` timestamp with time zone · not null
- `reason` text
- `metadata` jsonb

### `strength_coach_profiles`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `user_id` uuid · not null
- `certifications` ARRAY
- `primary_certification` character varying
- `certification_issued_by` character varying
- `specializations` ARRAY
- `years_of_experience` integer
- `education_background` text
- `bio` text
- `credentials_verified` boolean
- `verification_completed_at` timestamp with time zone
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `subscriptions`
Touched by: `billing-lapse-check`, `billing-status`, `daily-load`, `data`, `data-export`, `stripe-webhook`, `training-sessions`

- `id` uuid · not null
- `billing_customer_id` uuid · not null
- `stripe_subscription_id` text · not null
- `tier` text · not null
- `status` text · not null
- `seat_quantity` integer
- `current_period_start` timestamp with time zone
- `current_period_end` timestamp with time zone
- `cancel_at_period_end` boolean · not null
- `past_due_since` timestamp with time zone
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `superadmins`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `user_id` uuid · not null
- `granted_by` uuid
- `granted_at` timestamp with time zone
- `is_active` boolean
- `notes` text

### `supplement_logs`
Touched by: `analytics`, `performance-data`, `staff`, `staff-nutritionist`, `supplements`, `user-context`, `user-profile`

- `id` uuid · not null
- `user_id` uuid · not null
- `supplement_name` character varying · not null
- `dosage` character varying
- `taken` boolean · not null
- `date` date · not null
- `time_of_day` character varying
- `notes` text
- `created_at` timestamp with time zone · not null

### `taper_rules`
Touched by: `periodization-prescription`

- `id` uuid · not null
- `tournament_level` text · not null
- `taper_days` integer · not null
- `volume_reduction_pct` numeric · not null
- `volume_floor_pct` numeric · not null
- `intensity_retention` numeric · not null
- `methodology_citation` text · not null
- `is_active` boolean · not null
- `version` text · not null

### `team_activities`
Touched by: `daily-protocol`

- `id` uuid · not null
- `team_id` uuid · not null
- `date` date · not null
- `type` text · not null
- `start_time_local` text
- `end_time_local` text
- `location` text
- `note` text
- `replaces_session` boolean · not null
- `weather_override` jsonb
- `created_by_coach_id` uuid
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `team_events`
Touched by: `attendance`, `coach`, `coach-core`, `team`, `team-calendar`

- `id` uuid · not null
- `team_id` uuid · not null
- `event_type` text · not null
- `title` text · not null
- `description` text
- `location` text
- `start_time` timestamp with time zone · not null
- `end_time` timestamp with time zone
- `is_mandatory` boolean · not null
- `rsvp_deadline` date
- `created_by` uuid
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `team_insights`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `team_id` uuid · not null
- `insight_type` character varying · not null
- `insight_data` jsonb · not null
- `generated_at` timestamp with time zone
- `created_at` timestamp with time zone

### `team_invitations`
Touched by: `accept-invitation`, `auth`, `team`, `team-invite`, `validate-invitation`

- `id` uuid · not null
- `team_id` uuid · not null
- `email` character varying · not null
- `token` character varying · not null
- `role` character varying · not null
- `status` character varying · not null
- `invited_by` uuid · not null
- `message` text
- `expires_at` timestamp with time zone · not null
- `accepted_at` timestamp with time zone
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `team_member_roles`
Touched by: `session-load-import`, `session-load-import-csv`

- `id` uuid · not null
- `team_id` uuid · not null
- `user_id` uuid · not null
- `role` text · not null
- `created_at` timestamp with time zone · not null

### `team_members`
Touched by: `accept-invitation`, `admin`, `admin-credentials`, `ai-chat`, `ai-telemetry`, `alert-acknowledge`, `alert-dashboard`, `alert-evaluate-rules`, `alert-get-athlete`, `alert-preferences`, `alert-resolve`, `analytics`, `analytics-core`, `attendance`, `auth`, `auth-login`, `auth-me`, `billing-lapse-check`, `billing-status`, `calc-readiness`, `calibration-logs`, `chat`, `coach`, `coach-activity`, `coach-analytics`, `coach-core`, `coach-inbox`, `community`, `compute-acwr`, `daily-load`, `daily-protocol`, `daily-training`, `dashboard`, `data`, `decisions`, `event-games`, `game-events`, `games`, `games-core`, `import-open-data`, `injury-analytics`, `knowledge-governance`, `load-management`, `monitoring-report`, `notifications`, `performance-data`, `periodization-prescription`, `physio-protocol`, `physiotherapist-dashboard`, `player-programs`, `player-settings`, `player-stats`, `privacy-settings`, `programs`, `readiness`, `readiness-history`, `recovery-effectiveness`, `recovery-recommendations`, `response-feedback`, `roster`, `roster-core`, `rtp-advance-phase`, `rtp-all-protocols`, `rtp-create-assignment`, `rtp-phase-progress`, `rtp-protocol-assignment`, `rtp-psychological-assessment`, `rtp-record-assessment`, `rtp-team-protocols`, `season-archive`, `smart-training-recommendations`, `social`, `staff`, `staff-nutritionist`, `staff-physiotherapist`, `staff-profile`, `staff-psychology`, `stripe-checkout`, `stripe-portal`, `stripe-webhook`, `team`, `team-acwr`, `team-calendar`, `team-invite`, `team-join`, `team-monitoring`, `team-practice-plan`, `team-templates`, `training`, `training-metrics`, `training-plan`, `training-programs`, `training-sessions`, `user-context`, `user-profile`, `user-profile-core`, `validate-invitation`, `weather`, `wellness`, `wellness-checkin`, `wellness-logs`

- `id` uuid · not null
- `team_id` uuid · not null
- `user_id` uuid · not null
- `role` character varying · not null
- `status` character varying · not null
- `jersey_number` integer
- `position` character varying
- `positions` ARRAY
- `joined_at` timestamp with time zone · not null
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null
- `role_approval_status` character varying
- `role_approved_by` uuid
- `role_approved_at` timestamp with time zone
- `role_rejection_reason` text
- `is_billable_seat` boolean · not null

### `team_season_phases`
Touched by: `daily-protocol`

- `id` uuid · not null
- `team_id` uuid · not null
- `phase_key` text · not null
- `phase_label` text
- `start_date` date · not null
- `end_date` date · not null
- `is_active` boolean · not null
- `created_at` timestamp with time zone · not null

### `team_sharing_settings`
Touched by: `analytics-core`, `coach-core`, `load-management`, `performance-data`, `privacy-settings`, `staff-nutritionist`, `staff-psychology`, `user-profile`

- `id` uuid · not null
- `user_id` uuid · not null
- `team_id` uuid · not null
- `performance_sharing_enabled` boolean · not null
- `health_sharing_enabled` boolean · not null
- `allowed_metric_categories` ARRAY · not null
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `team_templates`
Touched by: `team`, `team-templates`

- `id` uuid · not null
- `team_id` uuid · not null
- `created_by` uuid · not null
- `template_type` character varying · not null
- `name` character varying · not null
- `description` text
- `content` jsonb · not null
- `is_default` boolean
- `is_active` boolean
- `usage_count` integer
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `teams`
Touched by: `coach`, `coach-inbox`, `team`, `team-invite`, `team-join`

- `id` uuid · not null
- `name` character varying · not null
- `league` character varying
- `season` character varying
- `home_city` character varying
- `team_logo_url` text
- `primary_color` character varying
- `secondary_color` character varying
- `coach_id` uuid · not null
- `description` text
- `founded_year` integer
- `motto` character varying
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null
- `approval_status` character varying
- `approved_by` uuid
- `approved_at` timestamp with time zone
- `rejection_reason` text
- `application_notes` text
- `olympic_track` character varying
- `home_field` text

### `template_assignments`
Touched by: `team`, `team-templates`

- `id` uuid · not null
- `template_id` uuid · not null
- `user_id` uuid · not null
- `assigned_by` uuid · not null
- `assigned_date` date · not null
- `due_date` date
- `status` character varying
- `completed_at` timestamp with time zone
- `notes` text
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `tournament_budgets`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `tournament_id` uuid · not null
- `team_id` uuid · not null
- `budget_category` character varying · not null
- `estimated_cost` numeric
- `actual_cost` numeric
- `notes` text
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `tournament_day_plans`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `user_id` uuid · not null
- `team_id` uuid
- `tournament_date` date · not null
- `tournament_name` text · not null
- `games` jsonb · not null
- `nutrition_windows` jsonb · not null
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `training_phases`
Touched by: `daily-protocol`, `training`, `training-programs`

- `id` uuid · not null
- `program_id` uuid · not null
- `name` character varying · not null
- `description` text
- `start_date` date · not null
- `end_date` date · not null
- `phase_order` integer · not null
- `focus_areas` ARRAY
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `training_programs`
Touched by: `daily-protocol`, `player-programs`, `programs`, `training`, `training-programs`

- `id` uuid · not null
- `name` character varying · not null
- `position_id` uuid
- `description` text
- `program_type` character varying
- `difficulty_level` character varying
- `duration_weeks` integer
- `sessions_per_week` integer
- `start_date` date · not null
- `end_date` date · not null
- `is_template` boolean
- `created_by` uuid
- `is_active` boolean
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `training_session_templates`
Touched by: `daily-protocol`, `training`, `training-programs`

- `id` uuid · not null
- `program_id` uuid · not null
- `week_id` uuid · not null
- `session_name` character varying · not null
- `session_type` character varying
- `day_of_week` integer · not null
- `session_order` integer · not null
- `duration_minutes` integer
- `intensity_level` text
- `description` text
- `warm_up_protocol` text
- `notes` text
- `equipment_needed` ARRAY
- `is_team_practice` boolean
- `is_outdoor` boolean
- `weather_sensitive` boolean
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `training_sessions`
Touched by: `ai-chat`, `analytics`, `analytics-core`, `calc-readiness`, `coach`, `coach-core`, `compute-acwr`, `daily-load`, `daily-protocol`, `daily-training`, `dashboard`, `data`, `exercises`, `import-open-data`, `load-management`, `performance-data`, `performance-heatmap`, `performance-metrics`, `periodization-prescription`, `player-settings`, `qb-throwing`, `readiness`, `recovery-recommendations`, `smart-training-recommendations`, `staff-nutritionist`, `staff-psychology`, `team-join`, `team-monitoring`, `training`, `training-complete`, `training-metrics`, `training-plan`, `training-programs`, `training-sessions`, `training-stats-enhanced`, `training-suggestions`, `trends`, `user-context`, `user-profile`, `user-profile-core`, `weekend-games`, `wellness-checkin`

- `id` uuid · not null
- `user_id` uuid · not null
- `team_id` uuid
- `session_date` date · not null
- `session_type` character varying · not null
- `drill_type` character varying
- `duration_minutes` integer · not null
- `intensity_level` integer
- `completion_rate` numeric
- `performance_score` numeric
- `xp_earned` integer
- `notes` text
- `coach_feedback` text
- `status` character varying
- `created_at` timestamp without time zone
- `updated_at` timestamp without time zone
- `coach_locked` boolean · not null
- `modified_by_coach_id` uuid
- `modified_at` timestamp with time zone
- `session_state` text
- `current_version` integer · not null
- `rpe` integer
- `workload` numeric
- `completed_at` timestamp with time zone
- `session_structure` jsonb
- `exercises` jsonb
- `equipment` ARRAY
- `goals` ARRAY
- `log_status` character varying
- `requires_coach_approval` boolean
- `hours_delayed` integer
- `conflicts` jsonb
- `title` text
- `location` text
- `prescribed_duration` integer
- `prescribed_intensity` integer
- `throw_count` integer
- `throw_au` numeric

### `training_videos`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `title` text · not null
- `description` text
- `video_url` text · not null
- `thumbnail_url` text
- `duration_seconds` integer
- `category` character varying
- `position` character varying
- `difficulty_level` character varying
- `created_by` uuid
- `is_active` boolean
- `view_count` integer
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone
- `team_id` uuid

### `training_weeks`
Touched by: `daily-protocol`, `training`, `training-programs`

- `id` uuid · not null
- `phase_id` uuid · not null
- `week_number` integer · not null
- `start_date` date · not null
- `end_date` date · not null
- `load_percentage` numeric
- `volume_multiplier` numeric
- `focus` character varying
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `trending_topics`
Touched by: `community`, `social`

- `id` uuid · not null
- `name` text · not null
- `count` integer · not null
- `is_active` boolean · not null
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `user_age_groups`
Touched by: `ai-chat`

- `id` uuid · not null
- `user_id` uuid · not null
- `age_group` character varying · not null
- `birth_year` integer
- `requires_parental_consent` boolean
- `consent_given` boolean
- `consent_given_by` uuid
- `consent_given_at` timestamp with time zone
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `user_ai_preferences`
Touched by: `ai-chat`

- `id` uuid · not null
- `user_id` uuid · not null
- `tone` character varying
- `verbosity` character varying
- `proactive_suggestions` boolean
- `reminder_frequency` character varying
- `focus_areas` ARRAY
- `avoided_topics` ARRAY
- `language_preference` character varying
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `user_notification_preferences`
Touched by: `daily-protocol`, `player-settings`, `team-join`, `training-programs`

- `id` integer · not null
- `user_id` character varying · not null
- `notification_type` USER-DEFINED · not null
- `muted` boolean
- `push_enabled` boolean
- `in_app_enabled` boolean
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `user_preferences`
Touched by: _(no endpoint references this table)_

- `user_id` uuid · not null
- `email` text
- `schedule_type` text
- `practices_per_week` integer
- `practice_days` ARRAY · not null
- `morning_mobility` text
- `evening_mobility` text
- `foam_rolling_time` text
- `rest_day_preference` text
- `training_goals` ARRAY · not null
- `equipment_available` ARRAY · not null
- `current_injuries` jsonb · not null
- `injury_history` ARRAY · not null
- `medical_notes` text
- `enable_reminders` boolean · not null
- `reminder_time` text
- `notification_preferences` ARRAY · not null
- `consent_terms_of_service` boolean · not null
- `consent_privacy_policy` boolean · not null
- `consent_data_usage` boolean · not null
- `consent_ai_coach` boolean · not null
- `consent_email_updates` boolean · not null
- `consent_updated_at` timestamp with time zone
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `user_security`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `user_id` uuid · not null
- `two_factor_enabled` boolean
- `two_factor_secret` text
- `backup_codes` ARRAY
- `last_password_change` timestamp with time zone
- `failed_login_attempts` integer
- `account_locked_until` timestamp with time zone
- `security_questions` jsonb
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `user_settings`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `user_id` uuid · not null
- `setting_key` character varying · not null
- `setting_value` jsonb · not null
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `user_supplements`
Touched by: `staff`, `staff-nutritionist`, `supplements`

- `id` uuid · not null
- `user_id` uuid · not null
- `name` character varying · not null
- `dosage` character varying
- `timing` character varying · not null
- `category` character varying · not null
- `active` boolean · not null
- `created_at` timestamp with time zone · not null
- `updated_at` timestamp with time zone · not null

### `users`
Touched by: `accept-invitation`, `admin`, `admin-credentials`, `ai-chat`, `analytics`, `analytics-core`, `auth`, `billing-lapse-check`, `billing-status`, `calc-readiness`, `coach`, `coach-core`, `coach-inbox`, `daily-load`, `daily-protocol`, `daily-training`, `monitoring-report`, `nutrition`, `parental-consent`, `periodization-prescription`, `physiotherapist-dashboard`, `player-settings`, `privacy-settings`, `roster`, `rtp-all-protocols`, `rtp-team-protocols`, `sleep-data`, `stripe-checkout`, `team`, `team-invite`, `team-join`, `training`, `training-programs`, `training-sessions`, `user-context`, `user-profile`, `user-profile-core`, `wellness`, `wellness-checkin`

- `id` uuid · not null
- `email` character varying · not null
- `password_hash` character varying
- `first_name` character varying · not null
- `last_name` character varying · not null
- `position` character varying
- `experience_level` character varying
- `height_cm` numeric
- `weight_kg` numeric
- `birth_date` date
- `profile_picture` character varying
- `bio` text
- `is_active` boolean
- `email_verified` boolean
- `last_login` timestamp without time zone
- `created_at` timestamp without time zone
- `updated_at` timestamp without time zone
- `notification_last_opened_at` timestamp with time zone
- `full_name` text
- `jersey_number` integer
- `profile_photo_url` text
- `date_of_birth` date
- `phone` text
- `onboarding_completed` boolean · not null
- `gender` text
- `name` text
- `avatar_url` text
- `account_status` text
- `country` text
- `team` text
- `secondary_position` text
- `throwing_arm` text
- `preferred_units` text
- `onboarding_completed_at` timestamp with time zone
- `injury_gate_active` boolean · not null
- `injury_gate_set_at` timestamp with time zone
- `verification_token` text
- `verification_token_expires_at` timestamp with time zone
- `sport` character varying
- `years_experience` integer
- `medical_history` text
- `emergency_contact_name` character varying
- `emergency_contact_phone` character varying
- `trial_started_at` timestamp with time zone · not null

### `warmup_protocols`
Touched by: `training`, `training-programs`

- `id` uuid · not null
- `program_id` uuid
- `name` character varying · not null
- `description` text
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `wearable_consent`
Touched by: `data`, `wearable-health-ingest`, `wearable-health-ingest-apple-xml`, `wearables`, `wearables-webhook`

- `user_id` uuid · not null
- `source` text · not null
- `state` text · not null
- `granted_at` timestamp with time zone
- `revoked_at` timestamp with time zone
- `updated_at` timestamp with time zone · not null

### `wearable_health`
Touched by: `data`, `monitoring-report`, `wearable-health-ingest`, `wearable-health-ingest-apple-xml`, `wearables`, `wearables-webhook`

- `id` uuid · not null
- `user_id` uuid · not null
- `source` text · not null
- `source_device` text
- `metric` text · not null
- `value` numeric
- `unit` text
- `recorded_at` timestamp with time zone · not null
- `consent_state` text · not null
- `created_at` timestamp with time zone · not null

### `weather_substitution_rules`
Touched by: _(no endpoint references this table)_

- `id` uuid · not null
- `original_modality` text · not null
- `condition` text · not null
- `threshold_value` numeric
- `threshold_unit` text
- `threshold_direction` text · not null
- `substitute_modality` text · not null
- `substitute_rationale` text · not null
- `is_active` boolean · not null

### `youth_athlete_settings`
Touched by: `ai-chat`

- `id` uuid · not null
- `user_id` uuid · not null
- `parent_email` character varying
- `parent_phone` character varying
- `school_name` character varying
- `grade_level` integer
- `sport_experience_years` integer
- `medical_clearance_date` date
- `emergency_contact_name` character varying
- `emergency_contact_phone` character varying
- `dietary_restrictions` ARRAY
- `special_needs_notes` text
- `max_training_hours_per_week` integer
- `rest_day_requirements` integer
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

### `zz_video_backup_20260719` — ⚠️ DRIFT
Touched by: _(no endpoint references this table)_

- `src_table` text
- `id` uuid
- `video_url` text
- `thumbnail_url` text
- `video_id` text
- `backed_up_at` timestamp with time zone

## Views

### `physical_measurements_latest` (view)
- `id` uuid
- `user_id` uuid
- `weight` numeric
- `height` numeric
- `body_fat` numeric
- `muscle_mass` numeric
- `body_water_percentage` numeric
- `visceral_fat_rating` integer
- `basal_metabolic_rate` integer
- `body_age` integer
- `created_at` timestamp with time zone
- `previous_weight` numeric
- `previous_body_fat` numeric

### `user_achievements` (view)
- `id` uuid
- `user_id` uuid
- `achievement_slug` text
- `achievement_name` text
- `category` text
- `unlocked_at` timestamp with time zone
- `metadata` jsonb

### `v_athlete_schedule` (view)
- `id` uuid
- `competition_id` uuid
- `team_id` uuid
- `starts_at` timestamp with time zone
- `ends_at` timestamp with time zone
- `expected_game_count` integer
- `importance` text
- `label` text
- `location` text
- `venue` text
- `notes` text
- `status` text
- `external_id` text
- `metadata` jsonb
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone
- `competition_name` text
- `competition_short_name` text
- `competition_kind` text
- `competition_level` text
- `competition_country` text
- `competition_season_year` integer
- `team_name` character varying
- `user_id` uuid
- `hotel_name` text
- `hotel_address` text
- `surface` text

### `v_injuries_unified` (view)
- `id` uuid
- `user_id` uuid
- `injury_type` text
- `type` text
- `severity` integer
- `body_part` text
- `status` text
- `injury_date` date
- `occurred_at` date
- `start_date` date
- `description` text
- `restrictions` ARRAY

### `v_pending_event_participation` (view)
- `competition_event_id` uuid
- `team_id` uuid
- `team_name` character varying
- `competition_name` text
- `label` text
- `starts_at` timestamp with time zone
- `ends_at` timestamp with time zone
- `expected_game_count` integer
- `user_id` uuid
- `availability_status` character varying

### `v_seed_integrity` (view)
- `check_name` text
- `violations` bigint

### `v_training_sessions_consent` (view)
- `id` uuid
- `user_id` uuid
- `team_id` uuid
- `session_date` date
- `session_type` character varying
- `drill_type` character varying
- `status` character varying
- `session_state` text
- `title` text
- `location` text
- `completed_at` timestamp with time zone
- `rpe` integer
- `duration_minutes` integer
- `intensity_level` integer
- `workload` numeric
- `performance_score` numeric
- `completion_rate` numeric
- `notes` text
- `created_at` timestamp without time zone
- `updated_at` timestamp without time zone
- `consent_blocked` boolean
- `access_reason` text


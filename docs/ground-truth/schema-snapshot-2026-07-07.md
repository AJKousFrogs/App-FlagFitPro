# Supabase Schema Snapshot — 2026-07-07

> Read-only baseline snapshot of the live `public` schema (project `grfjmnjpzvknmsxrwesx`), introspected via Supabase MCP `list_tables`. **Do not edit** — this is a diffing baseline. Generated as Prompt-0 checkpoint.

**Tables:** 169

## Table index

- `account_deletion_requests` — 12 cols · RLS on · 0 rows
- `account_pause_requests` — 10 cols · RLS on · 0 rows
- `achievement_definitions` — 11 cols · RLS on · 0 rows
- `age_recovery_modifiers` — 6 cols · RLS on · 6 rows
- `ai_chat_sessions` — 10 cols · RLS on · 0 rows
- `ai_followups` — 12 cols · RLS on · 0 rows
- `ai_messages` — 13 cols · RLS on · 0 rows
- `ai_recommendations` — 13 cols · RLS on · 0 rows
- `ai_response_feedback` — 10 cols · RLS on · 0 rows
- `ai_training_suggestions` — 20 cols · RLS on · 0 rows
- `announcement_reads` — 6 cols · RLS on · 0 rows
- `approval_requests` — 9 cols · RLS on · 0 rows
- `athlete_consent_settings` — 8 cols · RLS on · 0 rows
- `athlete_events` — 16 cols · RLS on · 5 rows
- `athlete_hydration_logs` — 10 cols · RLS on · 3 rows
- `athlete_injuries` — 17 cols · RLS on · 7 rows
- `athlete_nutrition_profiles` — 18 cols · RLS on · 0 rows
- `athlete_training_config` — 19 cols · RLS on · 2 rows
- `athlete_travel_log` — 14 cols · RLS on · 0 rows
- `attendance_records` — 11 cols · RLS on · 0 rows
- `authorization_violations` — 13 cols · RLS on · 0 rows
- `blocked_users` — 4 cols · RLS on · 0 rows
- `calibration_logs` — 20 cols · RLS on · 86 rows
- `channel_members` — 8 cols · RLS on · 0 rows
- `channels` — 14 cols · RLS on · 0 rows
- `chat_messages` — 24 cols · RLS on · 0 rows
- `classification_history` — 8 cols · RLS on · 0 rows
- `coach_activity_log` — 12 cols · RLS on · 0 rows
- `coach_alert_acknowledgments` — 8 cols · RLS on · 0 rows
- `coach_analytics_cache` — 7 cols · RLS on · 0 rows
- `coach_inbox_items` — 17 cols · RLS on · 0 rows
- `coach_overrides` — 8 cols · RLS on · 0 rows
- `comment_likes` — 4 cols · RLS on · 0 rows
- `community_poll_options` — 4 cols · RLS on · 0 rows
- `community_poll_votes` — 4 cols · RLS on · 0 rows
- `community_polls` — 5 cols · RLS on · 0 rows
- `competition_events` — 21 cols · RLS on · 9 rows
- `competitions` — 17 cols · RLS on · 5 rows
- `consent_access_log` — 8 cols · RLS on · 0 rows
- `contraindication_rules` — 7 cols · RLS on · 22 rows
- `conversation_context` — 9 cols · RLS on · 0 rows
- `daily_protocols` — 50 cols · RLS on · 17 rows
- `daily_wellness_checkin` — 17 cols · RLS on · 27 rows
- `decision_ledger` — 11 cols · RLS on · 0 rows
- `decision_review_reminders` — 5 cols · RLS on · 0 rows
- `emergency_medical_records` — 13 cols · RLS on · 0 rows
- `event_availability` — 18 cols · RLS on · 0 rows
- `event_games` — 16 cols · RLS on · 0 rows
- `event_participation` — 18 cols · RLS on · 0 rows
- `execution_logs` — 13 cols · RLS on · 0 rows
- `exercise_progressions` — 11 cols · RLS on · 0 rows
- `exercise_registry` — 10 cols · RLS on · 0 rows
- `exercisedb_exercises` — 18 cols · RLS on · 0 rows
- `exercisedb_import_logs` — 6 cols · RLS on · 0 rows
- `exercises` — 34 cols · RLS on · 286 rows
- `ff_exercise_mappings` — 6 cols · RLS on · 0 rows
- `flag_pull_stats` — 19 cols · RLS on · 0 rows
- `frontend_logs` — 7 cols · RLS on · 0 rows
- `game_events` — 30 cols · RLS on · 0 rows
- `game_participations` — 9 cols · RLS on · 0 rows
- `games` — 22 cols · RLS on · 0 rows
- `isometrics_exercises` — 12 cols · RLS on · 0 rows
- `knowledge_base_entries` — 29 cols · RLS on · 112 rows
- `knowledge_base_governance_log` — 7 cols · RLS on · 0 rows
- `knowledge_review_audit` — 9 cols · RLS on · 0 rows
- `knowledge_search_index` — 5 cols · RLS on · 112 rows
- `learned_user_preferences` — 5 cols · RLS on · 0 rows
- `meal_templates` — 14 cols · RLS on · 4 rows
- `mental_performance_logs` — 17 cols · RLS on · 3 rows
- `mental_wellness_reports` — 6 cols · RLS on · 0 rows
- `merlin_violation_log` — 6 cols · RLS on · 0 rows
- `message_read_receipts` — 4 cols · RLS on · 0 rows
- `metric_definitions` — 9 cols · RLS on · 0 rows
- `metric_entries` — 8 cols · RLS on · 0 rows
- `micro_session_analytics` — 11 cols · RLS on · 0 rows
- `micro_sessions` — 14 cols · RLS on · 0 rows
- `ml_training_data` — 7 cols · RLS on · 0 rows
- `movement_patterns` — 6 cols · RLS on · 0 rows
- `notifications` — 19 cols · RLS on · 4 rows
- `nutrition_goals` — 10 cols · RLS on · 0 rows
- `nutrition_logs` — 13 cols · RLS on · 0 rows
- `nutrition_plans` — 16 cols · RLS on · 0 rows
- `nutrition_reports` — 9 cols · RLS on · 0 rows
- `opponent_analysis` — 17 cols · RLS on · 0 rows
- `ownership_transitions` — 7 cols · RLS on · 0 rows
- `parent_guardian_links` — 13 cols · RLS on · 0 rows
- `parent_notifications` — 11 cols · RLS on · 0 rows
- `parental_consent` — 13 cols · RLS on · 0 rows
- `passing_stats` — 25 cols · RLS on · 0 rows
- `performance_records` — 21 cols · RLS on · 0 rows
- `performance_tests` — 9 cols · RLS on · 0 rows
- `physical_measurements` — 22 cols · RLS on · 4 rows
- `player_achievements` — 6 cols · RLS on · 0 rows
- `player_payments` — 12 cols · RLS on · 0 rows
- `player_programs` — 20 cols · RLS on · 0 rows
- `player_streaks` — 8 cols · RLS on · 0 rows
- `player_training_stats` — 14 cols · RLS on · 0 rows
- `plyometrics_exercises` — 14 cols · RLS on · 0 rows
- `position_specific_metrics` — 13 cols · RLS on · 0 rows
- `positions` — 6 cols · RLS on · 0 rows
- `post_bookmarks` — 4 cols · RLS on · 0 rows
- `post_comments` — 7 cols · RLS on · 0 rows
- `post_likes` — 4 cols · RLS on · 0 rows
- `posts` — 15 cols · RLS on · 0 rows
- `practice_plans` — 17 cols · RLS on · 0 rows
- `prescription_audit_log` — 10 cols · RLS on · 0 rows
- `prescription_templates` — 17 cols · RLS on · 41 rows
- `privacy_audit_log` — 7 cols · RLS on · 0 rows
- `privacy_settings` — 7 cols · RLS on · 3 rows
- `proactive_checkins` — 8 cols · RLS on · 0 rows
- `program_assignments` — 10 cols · RLS on · 0 rows
- `protocol_exercises` — 25 cols · RLS on · 232 rows
- `protocol_generation_requests` — 9 cols · RLS on · 27 rows
- `psychological_assessments` — 12 cols · RLS on · 1 rows
- `push_subscriptions` — 8 cols · RLS on · 0 rows
- `qb_throwing_sessions` — 22 cols · RLS on · 0 rows
- `readiness_gates` — 10 cols · RLS on · 4 rows
- `readiness_scores` — 14 cols · RLS on · 13 rows
- `receiving_stats` — 21 cols · RLS on · 0 rows
- `recovery_blocks` — 10 cols · RLS on · 1 rows
- `recovery_protocols` — 12 cols · RLS on · 0 rows
- `recovery_sessions` — 11 cols · RLS on · 0 rows
- `research_articles` — 61 cols · RLS on · 0 rows
- `return_to_play_protocols` — 9 cols · RLS on · 1 rows
- `role_change_audit` — 9 cols · RLS on · 0 rows
- `roster_audit_log` — 9 cols · RLS on · 0 rows
- `rtp_prescription_approvals` — 11 cols · RLS on · 0 rows
- `safety_override_log` — 10 cols · RLS on · 11 rows
- `season_archives` — 4 cols · RLS on · 0 rows
- `session_exercises` — 24 cols · RLS on · 0 rows
- `session_version_history` — 10 cols · RLS on · 0 rows
- `shared_insights` — 6 cols · RLS on · 0 rows
- `situational_stats` — 14 cols · RLS on · 0 rows
- `sponsors` — 8 cols · RLS on · 0 rows
- `staff_roles` — 8 cols · RLS on · 0 rows
- `state_transition_history` — 9 cols · RLS on · 0 rows
- `superadmins` — 6 cols · RLS on · 0 rows
- `supplement_logs` — 9 cols · RLS on · 23 rows
- `taper_rules` — 8 cols · RLS on · 5 rows
- `team_activities` — 13 cols · RLS on · 0 rows
- `team_events` — 13 cols · RLS on · 0 rows
- `team_insights` — 6 cols · RLS on · 0 rows
- `team_invitations` — 12 cols · RLS on · 0 rows
- `team_members` — 15 cols · RLS on · 4 rows
- `team_season_phases` — 8 cols · RLS on · 11 rows
- `team_sharing_settings` — 8 cols · RLS on · 0 rows
- `team_templates` — 12 cols · RLS on · 0 rows
- `teams` — 21 cols · RLS on · 0 rows
- `template_assignments` — 11 cols · RLS on · 0 rows
- `tournament_budgets` — 9 cols · RLS on · 0 rows
- `tournament_day_plans` — 9 cols · RLS on · 0 rows
- `training_phases` — 10 cols · RLS on · 0 rows
- `training_programs` — 15 cols · RLS on · 0 rows
- `training_session_templates` — 18 cols · RLS on · 0 rows
- `training_sessions` — 38 cols · RLS on · 15 rows
- `training_videos` — 15 cols · RLS on · 65 rows
- `training_weeks` — 10 cols · RLS on · 0 rows
- `trending_topics` — 6 cols · RLS on · 0 rows
- `user_age_groups` — 10 cols · RLS on · 0 rows
- `user_ai_preferences` — 11 cols · RLS on · 0 rows
- `user_notification_preferences` — 8 cols · RLS on · 0 rows
- `user_preferences` — 25 cols · RLS on · 0 rows
- `user_security` — 11 cols · RLS on · 0 rows
- `user_settings` — 6 cols · RLS on · 0 rows
- `user_supplements` — 9 cols · RLS on · 0 rows
- `users` — 38 cols · RLS on · 11 rows
- `warmup_protocols` — 6 cols · RLS on · 0 rows
- `weather_substitution_rules` — 9 cols · RLS on · 8 rows
- `youth_athlete_settings` — 16 cols · RLS on · 0 rows

## Table details

### `account_deletion_requests`

RLS: enabled · rows: 0 · PK: id

| column                   | type                     | nullable | default           |
| ------------------------ | ------------------------ | -------- | ----------------- |
| id                       | uuid                     | no       | gen_random_uuid() |
| user_id                  | uuid                     | no       |                   |
| reason                   | text                     | yes      |                   |
| status                   | text                     | no       | 'pending'::text   |
| soft_deleted_at          | timestamp with time zone | yes      |                   |
| scheduled_hard_delete_at | timestamp with time zone | yes      |                   |
| sessions_revoked_at      | timestamp with time zone | yes      |                   |
| hard_deleted_at          | timestamp with time zone | yes      |                   |
| created_at               | timestamp with time zone | no       | now()             |
| updated_at               | timestamp with time zone | no       | now()             |
| requested_at             | timestamp with time zone | yes      |                   |
| error_message            | text                     | yes      |                   |

**Foreign keys:**

- `account_deletion_requests.user_id` → `auth.users.id`

### `account_pause_requests`

RLS: enabled · rows: 0 · PK: id

| column       | type                     | nullable | default           |
| ------------ | ------------------------ | -------- | ----------------- |
| id           | uuid                     | no       | gen_random_uuid() |
| user_id      | uuid                     | no       |                   |
| paused_at    | timestamp with time zone | no       | now()             |
| paused_until | timestamp with time zone | yes      |                   |
| reason       | text                     | yes      |                   |
| acwr_frozen  | boolean                  | no       | true              |
| is_active    | boolean                  | no       | true              |
| resumed_at   | timestamp with time zone | yes      |                   |
| created_at   | timestamp with time zone | no       | now()             |
| updated_at   | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `account_pause_requests.user_id` → `public.users.id`

### `achievement_definitions`

RLS: enabled · rows: 0 · PK: id

| column        | type                     | nullable | default           |
| ------------- | ------------------------ | -------- | ----------------- |
| id            | uuid                     | no       | gen_random_uuid() |
| slug          | text                     | no       |                   |
| name          | text                     | no       |                   |
| description   | text                     | yes      |                   |
| icon          | text                     | yes      |                   |
| category      | text                     | no       |                   |
| points        | integer                  | no       | 10                |
| criteria      | jsonb                    | no       | '{}'::jsonb       |
| display_order | integer                  | no       | 0                 |
| is_active     | boolean                  | no       | true              |
| created_at    | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `player_achievements.achievement_id` → `public.achievement_definitions.id`

### `age_recovery_modifiers`

RLS: enabled · rows: 6 · PK: id

| column              | type    | nullable | default                                            |
| ------------------- | ------- | -------- | -------------------------------------------------- |
| id                  | integer | no       | nextval('age_recovery_modifiers_id_seq'::regclass) |
| age_min             | integer | no       |                                                    |
| age_max             | integer | no       |                                                    |
| recovery_modifier   | numeric | no       | 1.00                                               |
| acwr_max_adjustment | numeric | no       | 0.00                                               |
| label               | text    | yes      |                                                    |

### `ai_chat_sessions`

RLS: enabled · rows: 0 · PK: id

| column           | type                     | nullable | default           |
| ---------------- | ------------------------ | -------- | ----------------- |
| id               | uuid                     | no       | gen_random_uuid() |
| user_id          | uuid                     | no       |                   |
| team_id          | uuid                     | yes      |                   |
| started_at       | timestamp with time zone | no       | now()             |
| ended_at         | timestamp with time zone | yes      |                   |
| context_snapshot | jsonb                    | yes      | '{}'::jsonb       |
| goal             | character varying        | yes      |                   |
| time_horizon     | character varying        | yes      |                   |
| created_at       | timestamp with time zone | no       | now()             |
| updated_at       | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `ai_chat_sessions.team_id` → `public.teams.id`
- `ai_chat_sessions.user_id` → `auth.users.id`

### `ai_followups`

RLS: enabled · rows: 0 · PK: id

| column        | type                     | nullable | default                      |
| ------------- | ------------------------ | -------- | ---------------------------- |
| id            | uuid                     | no       | gen_random_uuid()            |
| user_id       | uuid                     | no       |                              |
| session_id    | uuid                     | yes      |                              |
| followup_type | character varying        | no       |                              |
| scheduled_for | timestamp with time zone | no       |                              |
| message       | text                     | no       |                              |
| status        | character varying        | yes      | 'pending'::character varying |
| sent_at       | timestamp with time zone | yes      |                              |
| response      | text                     | yes      |                              |
| metadata      | jsonb                    | yes      | '{}'::jsonb                  |
| created_at    | timestamp with time zone | yes      | now()                        |
| updated_at    | timestamp with time zone | yes      | now()                        |

**Foreign keys:**

- `ai_followups.user_id` → `auth.users.id`

### `ai_messages`

RLS: enabled · rows: 0 · PK: id

| column            | type                     | nullable | default           |
| ----------------- | ------------------------ | -------- | ----------------- |
| id                | uuid                     | no       | gen_random_uuid() |
| session_id        | uuid                     | no       |                   |
| user_id           | uuid                     | no       |                   |
| role              | character varying        | no       |                   |
| content           | text                     | no       |                   |
| risk_level        | character varying        | yes      |                   |
| intent            | character varying        | yes      |                   |
| citations         | jsonb                    | yes      | '[]'::jsonb       |
| metadata          | jsonb                    | yes      | '{}'::jsonb       |
| created_at        | timestamp with time zone | no       | now()             |
| coach_reviewed_at | timestamp with time zone | yes      |                   |
| coach_reviewed_by | uuid                     | yes      |                   |
| feedback_received | boolean                  | no       | false             |

**Foreign keys:**

- `ai_messages.user_id` → `auth.users.id`

### `ai_recommendations`

RLS: enabled · rows: 0 · PK: id

| column              | type                     | nullable | default                      |
| ------------------- | ------------------------ | -------- | ---------------------------- |
| id                  | uuid                     | no       | gen_random_uuid()            |
| user_id             | uuid                     | no       |                              |
| chat_session_id     | uuid                     | yes      |                              |
| message_id          | uuid                     | yes      |                              |
| recommendation_type | character varying        | no       |                              |
| reason              | text                     | no       |                              |
| recommendation_data | jsonb                    | yes      | '{}'::jsonb                  |
| status              | character varying        | no       | 'pending'::character varying |
| accepted_at         | timestamp with time zone | yes      |                              |
| rejected_at         | timestamp with time zone | yes      |                              |
| completed_at        | timestamp with time zone | yes      |                              |
| outcome             | text                     | yes      |                              |
| created_at          | timestamp with time zone | no       | now()                        |

**Foreign keys:**

- `ai_recommendations.user_id` → `auth.users.id`

### `ai_response_feedback`

RLS: enabled · rows: 0 · PK: id

| column                 | type                     | nullable | default           |
| ---------------------- | ------------------------ | -------- | ----------------- |
| id                     | uuid                     | no       | gen_random_uuid() |
| user_id                | uuid                     | no       |                   |
| session_id             | uuid                     | yes      |                   |
| message_id             | uuid                     | yes      |                   |
| feedback_type          | character varying        | no       |                   |
| feedback_text          | text                     | yes      |                   |
| created_at             | timestamp with time zone | yes      | now()             |
| feedback_source        | text                     | yes      |                   |
| was_helpful            | boolean                  | yes      |                   |
| knowledge_sources_used | jsonb                    | yes      |                   |

**Foreign keys:**

- `ai_response_feedback.user_id` → `auth.users.id`

### `ai_training_suggestions`

RLS: enabled · rows: 0 · PK: id

| column              | type                     | nullable | default           |
| ------------------- | ------------------------ | -------- | ----------------- |
| id                  | uuid                     | no       | gen_random_uuid() |
| user_id             | uuid                     | no       |                   |
| suggestion_type     | text                     | no       |                   |
| priority            | text                     | yes      |                   |
| title               | text                     | yes      |                   |
| description         | text                     | yes      |                   |
| message             | text                     | yes      |                   |
| reason              | text                     | yes      |                   |
| confidence_score    | numeric                  | yes      |                   |
| data_sources        | jsonb                    | yes      | '[]'::jsonb       |
| status              | text                     | yes      | 'active'::text    |
| accepted            | boolean                  | no       | false             |
| dismissed           | boolean                  | no       | false             |
| affected_session_id | uuid                     | yes      |                   |
| suggested_changes   | jsonb                    | yes      | '{}'::jsonb       |
| applied_at          | timestamp with time zone | yes      |                   |
| dismissed_at        | timestamp with time zone | yes      |                   |
| expires_at          | timestamp with time zone | yes      |                   |
| created_at          | timestamp with time zone | no       | now()             |
| updated_at          | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `ai_training_suggestions.affected_session_id` → `public.training_sessions.id`
- `ai_training_suggestions.user_id` → `auth.users.id`

### `announcement_reads`

RLS: enabled · rows: 0 · PK: id

| column          | type                     | nullable | default           |
| --------------- | ------------------------ | -------- | ----------------- |
| id              | uuid                     | no       | gen_random_uuid() |
| message_id      | uuid                     | no       |                   |
| user_id         | uuid                     | no       |                   |
| read_at         | timestamp with time zone | no       | now()             |
| acknowledged    | boolean                  | no       | false             |
| acknowledged_at | timestamp with time zone | yes      |                   |

**Foreign keys:**

- `announcement_reads.user_id` → `auth.users.id`
- `announcement_reads.message_id` → `public.chat_messages.id`

### `approval_requests`

RLS: enabled · rows: 0 · PK: id

| column        | type                     | nullable | default                      |
| ------------- | ------------------------ | -------- | ---------------------------- |
| id            | uuid                     | no       | gen_random_uuid()            |
| requester_id  | uuid                     | no       |                              |
| approver_id   | uuid                     | no       |                              |
| request_type  | character varying        | no       |                              |
| request_data  | jsonb                    | no       | '{}'::jsonb                  |
| status        | character varying        | yes      | 'pending'::character varying |
| response_data | jsonb                    | yes      |                              |
| created_at    | timestamp with time zone | yes      | now()                        |
| updated_at    | timestamp with time zone | yes      | now()                        |

**Foreign keys:**

- `approval_requests.requester_id` → `auth.users.id`
- `approval_requests.approver_id` → `auth.users.id`

### `athlete_consent_settings`

RLS: enabled · rows: 0 · PK: user_id

| column                                | type                     | nullable | default |
| ------------------------------------- | ------------------------ | -------- | ------- |
| user_id                               | uuid                     | no       |         |
| share_readiness_with_coach            | boolean                  | no       | false   |
| share_wellness_answers_with_coach     | boolean                  | no       | false   |
| share_training_notes_with_coach       | boolean                  | no       | false   |
| share_merlin_conversations_with_coach | boolean                  | no       | false   |
| share_readiness_with_all_coaches      | boolean                  | no       | false   |
| created_at                            | timestamp with time zone | no       | now()   |
| updated_at                            | timestamp with time zone | no       | now()   |

**Foreign keys:**

- `athlete_consent_settings.user_id` → `auth.users.id`

### `athlete_events`

RLS: enabled · rows: 5 · PK: id

| column              | type                     | nullable | default           |
| ------------------- | ------------------------ | -------- | ----------------- |
| id                  | uuid                     | no       | gen_random_uuid() |
| user_id             | uuid                     | no       |                   |
| category            | text                     | no       | 'personal'::text  |
| kind                | text                     | no       | 'gameday'::text   |
| title               | text                     | no       |                   |
| starts_at           | timestamp with time zone | no       |                   |
| ends_at             | timestamp with time zone | yes      |                   |
| expected_game_count | integer                  | no       | 1                 |
| importance          | text                     | no       | 'regular'::text   |
| location            | text                     | yes      |                   |
| venue               | text                     | yes      |                   |
| notes               | text                     | yes      |                   |
| status              | text                     | no       | 'scheduled'::text |
| created_at          | timestamp with time zone | no       | now()             |
| updated_at          | timestamp with time zone | no       | now()             |
| tier                | text                     | yes      |                   |

**Foreign keys:**

- `athlete_events.user_id` → `auth.users.id`

### `athlete_hydration_logs`

RLS: enabled · rows: 3 · PK: id

| column        | type                     | nullable | default           |
| ------------- | ------------------------ | -------- | ----------------- |
| id            | uuid                     | no       | gen_random_uuid() |
| user_id       | uuid                     | no       |                   |
| logged_at     | timestamp with time zone | no       | now()             |
| amount_ml     | integer                  | no       |                   |
| beverage_type | text                     | no       | 'water'::text     |
| note          | text                     | yes      |                   |
| source        | text                     | no       | 'manual'::text    |
| metadata      | jsonb                    | no       | '{}'::jsonb       |
| created_at    | timestamp with time zone | no       | now()             |
| updated_at    | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `athlete_hydration_logs.user_id` → `auth.users.id`

### `athlete_injuries`

RLS: enabled · rows: 7 · PK: id

| column                | type                     | nullable | default           |
| --------------------- | ------------------------ | -------- | ----------------- |
| id                    | uuid                     | no       | gen_random_uuid() |
| user_id               | uuid                     | no       |                   |
| injury_type           | text                     | yes      |                   |
| injury_location       | text                     | yes      |                   |
| injury_grade          | text                     | yes      |                   |
| injury_date           | date                     | yes      |                   |
| injury_mechanism      | text                     | yes      |                   |
| activity_at_injury    | text                     | yes      |                   |
| diagnosis             | text                     | yes      |                   |
| recovery_status       | text                     | no       | 'active'::text    |
| current_phase         | text                     | yes      | 'Phase 1'::text   |
| rtp_progress          | integer                  | yes      | 0                 |
| expected_return_date  | date                     | yes      |                   |
| activity_restrictions | ARRAY                    | yes      | '{}'::text[]      |
| medical_notes         | text                     | yes      |                   |
| created_at            | timestamp with time zone | no       | now()             |
| updated_at            | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `athlete_injuries.user_id` → `auth.users.id`

### `athlete_nutrition_profiles`

RLS: enabled · rows: 0 · PK: id

| column             | type                     | nullable | default           |
| ------------------ | ------------------------ | -------- | ----------------- |
| id                 | uuid                     | no       | gen_random_uuid() |
| user_id            | uuid                     | no       |                   |
| weight_kg          | numeric                  | yes      |                   |
| height_cm          | numeric                  | yes      |                   |
| age                | integer                  | yes      |                   |
| sex                | text                     | yes      |                   |
| activity_level     | text                     | yes      |                   |
| goal               | text                     | yes      |                   |
| training_time      | text                     | yes      |                   |
| bmr                | numeric                  | yes      |                   |
| tdee               | numeric                  | yes      |                   |
| target_calories    | integer                  | yes      |                   |
| protein_g          | numeric                  | yes      |                   |
| carbs_g            | numeric                  | yes      |                   |
| fat_g              | numeric                  | yes      |                   |
| calculated_profile | jsonb                    | yes      |                   |
| created_at         | timestamp with time zone | no       | now()             |
| updated_at         | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `athlete_nutrition_profiles.user_id` → `auth.users.id`

### `athlete_training_config`

RLS: enabled · rows: 2 · PK: user_id

| column                 | type                     | nullable | default                                |
| ---------------------- | ------------------------ | -------- | -------------------------------------- |
| user_id                | uuid                     | no       |                                        |
| primary_position       | text                     | no       | 'wr_db'::text                          |
| secondary_position     | text                     | yes      |                                        |
| birth_date             | date                     | yes      |                                        |
| flag_practice_schedule | jsonb                    | no       | '[]'::jsonb                            |
| daily_routine          | jsonb                    | no       | '[]'::jsonb                            |
| max_sessions_per_week  | integer                  | no       | 5                                      |
| has_gym_access         | boolean                  | no       | true                                   |
| has_field_access       | boolean                  | no       | true                                   |
| warmup_focus           | text                     | yes      |                                        |
| available_equipment    | jsonb                    | no       | '[]'::jsonb                            |
| current_limitations    | jsonb                    | yes      |                                        |
| age_recovery_modifier  | numeric                  | no       | 1.0                                    |
| acwr_target_min        | numeric                  | no       | 0.8                                    |
| acwr_target_max        | numeric                  | no       | 1.3                                    |
| created_at             | timestamp with time zone | no       | now()                                  |
| updated_at             | timestamp with time zone | no       | now()                                  |
| season_calendar        | jsonb                    | no       | '[]'::jsonb                            |
| team_training_days     | jsonb                    | no       | '{"days": [], "time": "18:00"}'::jsonb |

**Foreign keys:**

- `athlete_training_config.user_id` → `auth.users.id`

### `athlete_travel_log`

RLS: enabled · rows: 0 · PK: id

| column               | type                     | nullable | default           |
| -------------------- | ------------------------ | -------- | ----------------- |
| id                   | uuid                     | no       | gen_random_uuid() |
| user_id              | uuid                     | no       |                   |
| arrival_date         | date                     | yes      |                   |
| adaptation_day       | integer                  | yes      |                   |
| timezone_difference  | integer                  | yes      |                   |
| notes                | text                     | yes      |                   |
| created_at           | timestamp with time zone | no       | now()             |
| updated_at           | timestamp with time zone | no       | now()             |
| competition_event_id | uuid                     | yes      |                   |
| team_id              | uuid                     | yes      |                   |
| mode                 | text                     | no       | 'car'::text       |
| depart_at            | timestamp with time zone | no       |                   |
| arrive_at            | timestamp with time zone | no       |                   |
| overnight_stay       | boolean                  | no       | false             |

**Foreign keys:**

- `athlete_travel_log.competition_event_id` → `public.competition_events.id`
- `athlete_travel_log.team_id` → `public.teams.id`
- `athlete_travel_log.user_id` → `auth.users.id`

### `attendance_records`

RLS: enabled · rows: 0 · PK: id

| column           | type                     | nullable | default           |
| ---------------- | ------------------------ | -------- | ----------------- |
| id               | uuid                     | no       | gen_random_uuid() |
| event_id         | text                     | no       |                   |
| team_id          | uuid                     | yes      |                   |
| user_id          | uuid                     | no       |                   |
| status           | text                     | no       | 'pending'::text   |
| guests           | integer                  | no       | 0                 |
| needs_ride       | boolean                  | no       | false             |
| can_provide_ride | boolean                  | no       | false             |
| notes            | text                     | yes      |                   |
| created_at       | timestamp with time zone | no       | now()             |
| updated_at       | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `attendance_records.user_id` → `auth.users.id`
- `attendance_records.team_id` → `public.teams.id`

### `authorization_violations`

RLS: enabled · rows: 0 · PK: violation_id

| column         | type                     | nullable | default           |
| -------------- | ------------------------ | -------- | ----------------- |
| violation_id   | uuid                     | no       | gen_random_uuid() |
| user_id        | uuid                     | no       |                   |
| resource_id    | uuid                     | yes      |                   |
| resource_type  | text                     | no       |                   |
| action         | text                     | no       |                   |
| error_code     | text                     | no       |                   |
| error_message  | text                     | no       |                   |
| timestamp      | timestamp with time zone | no       | now()             |
| ip_address     | inet                     | yes      |                   |
| user_agent     | text                     | yes      |                   |
| request_path   | text                     | yes      |                   |
| request_method | text                     | yes      |                   |
| request_body   | jsonb                    | yes      |                   |

**Foreign keys:**

- `authorization_violations.user_id` → `auth.users.id`

### `blocked_users`

RLS: enabled · rows: 0 · PK: id

| column          | type                     | nullable | default           |
| --------------- | ------------------------ | -------- | ----------------- |
| id              | uuid                     | no       | gen_random_uuid() |
| user_id         | uuid                     | no       |                   |
| blocked_user_id | uuid                     | no       |                   |
| created_at      | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `blocked_users.blocked_user_id` → `public.users.id`
- `blocked_users.user_id` → `public.users.id`

### `calibration_logs`

RLS: enabled · rows: 86 · PK: id

| column              | type                     | nullable | default           |
| ------------------- | ------------------------ | -------- | ----------------- |
| id                  | uuid                     | no       | gen_random_uuid() |
| user_id             | uuid                     | no       |                   |
| timestamp           | timestamp with time zone | no       | now()             |
| recommendation_type | text                     | yes      |                   |
| readiness_score     | numeric                  | yes      |                   |
| acwr                | numeric                  | yes      |                   |
| rationale           | text                     | yes      |                   |
| preset_id           | text                     | yes      |                   |
| preset_version      | text                     | yes      |                   |
| phase               | text                     | yes      |                   |
| days_until_event    | integer                  | yes      |                   |
| event_importance    | text                     | yes      |                   |
| injury_flagged      | boolean                  | no       | false             |
| injury_date         | date                     | yes      |                   |
| injury_type         | text                     | yes      |                   |
| performance_rating  | numeric                  | yes      |                   |
| session_quality     | numeric                  | yes      |                   |
| subjective_feedback | text                     | yes      |                   |
| outcome_recorded_at | timestamp with time zone | yes      |                   |
| created_at          | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `calibration_logs.user_id` → `public.users.id`

### `channel_members`

RLS: enabled · rows: 0 · PK: id

| column       | type                     | nullable | default           |
| ------------ | ------------------------ | -------- | ----------------- |
| id           | uuid                     | no       | gen_random_uuid() |
| channel_id   | uuid                     | no       |                   |
| user_id      | uuid                     | no       |                   |
| can_post     | boolean                  | no       | true              |
| is_admin     | boolean                  | no       | false             |
| is_muted     | boolean                  | no       | false             |
| last_read_at | timestamp with time zone | yes      |                   |
| joined_at    | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `channel_members.user_id` → `auth.users.id`
- `channel_members.channel_id` → `public.channels.id`

### `channels`

RLS: enabled · rows: 0 · PK: id

| column          | type                     | nullable | default              |
| --------------- | ------------------------ | -------- | -------------------- |
| id              | uuid                     | no       | gen_random_uuid()    |
| team_id         | uuid                     | yes      |                      |
| name            | character varying        | no       |                      |
| description     | text                     | yes      |                      |
| channel_type    | text                     | no       | 'team_general'::text |
| position_filter | character varying        | yes      |                      |
| game_id         | character varying        | yes      |                      |
| is_group_dm     | boolean                  | no       | false                |
| is_archived     | boolean                  | no       | false                |
| is_default      | boolean                  | no       | false                |
| allow_threads   | boolean                  | no       | true                 |
| created_by      | uuid                     | yes      |                      |
| created_at      | timestamp with time zone | no       | now()                |
| updated_at      | timestamp with time zone | no       | now()                |

**Foreign keys:**

- `channel_members.channel_id` → `public.channels.id`
- `chat_messages.channel_id` → `public.channels.id`
- `channels.game_id` → `public.games.game_id`
- `channels.team_id` → `public.teams.id`
- `channels.created_by` → `auth.users.id`

### `chat_messages`

RLS: enabled · rows: 0 · PK: id

| column       | type                     | nullable | default           |
| ------------ | ------------------------ | -------- | ----------------- |
| id           | uuid                     | no       | gen_random_uuid() |
| user_id      | uuid                     | yes      |                   |
| sender_id    | uuid                     | yes      |                   |
| recipient_id | uuid                     | yes      |                   |
| team_id      | uuid                     | yes      |                   |
| channel_id   | uuid                     | yes      |                   |
| channel      | text                     | yes      |                   |
| message      | text                     | no       |                   |
| message_type | text                     | no       | 'text'::text      |
| metadata     | jsonb                    | no       | '{}'::jsonb       |
| attachments  | jsonb                    | no       | '[]'::jsonb       |
| mentions     | ARRAY                    | no       | '{}'::uuid[]      |
| reply_to     | uuid                     | yes      |                   |
| thread_id    | uuid                     | yes      |                   |
| reply_count  | integer                  | no       | 0                 |
| is_edited    | boolean                  | no       | false             |
| is_pinned    | boolean                  | no       | false             |
| pinned_by    | uuid                     | yes      |                   |
| pinned_at    | timestamp with time zone | yes      |                   |
| is_important | boolean                  | no       | false             |
| is_read      | boolean                  | no       | false             |
| read_at      | timestamp with time zone | yes      |                   |
| created_at   | timestamp with time zone | no       | now()             |
| updated_at   | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `message_read_receipts.message_id` → `public.chat_messages.id`
- `chat_messages.user_id` → `public.users.id`
- `chat_messages.sender_id` → `public.users.id`
- `chat_messages.recipient_id` → `public.users.id`
- `chat_messages.team_id` → `public.teams.id`
- `chat_messages.channel_id` → `public.channels.id`
- `chat_messages.reply_to` → `public.chat_messages.id`
- `chat_messages.thread_id` → `public.chat_messages.id`
- `chat_messages.pinned_by` → `public.users.id`
- `announcement_reads.message_id` → `public.chat_messages.id`

### `classification_history`

RLS: enabled · rows: 0 · PK: id

| column              | type                     | nullable | default           |
| ------------------- | ------------------------ | -------- | ----------------- |
| id                  | uuid                     | no       | gen_random_uuid() |
| user_id             | uuid                     | no       |                   |
| classification_type | character varying        | no       |                   |
| previous_value      | text                     | yes      |                   |
| new_value           | text                     | yes      |                   |
| reason              | text                     | yes      |                   |
| classified_by       | uuid                     | yes      |                   |
| created_at          | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `classification_history.user_id` → `auth.users.id`
- `classification_history.classified_by` → `auth.users.id`

### `coach_activity_log`

RLS: enabled · rows: 0 · PK: id

| column        | type                     | nullable | default           |
| ------------- | ------------------------ | -------- | ----------------- |
| id            | uuid                     | no       | gen_random_uuid() |
| team_id       | uuid                     | no       |                   |
| user_id       | uuid                     | no       |                   |
| coach_id      | uuid                     | yes      |                   |
| activity_type | character varying        | no       |                   |
| title         | character varying        | no       |                   |
| description   | text                     | yes      |                   |
| data          | jsonb                    | no       | '{}'::jsonb       |
| is_read       | boolean                  | no       | false             |
| read_at       | timestamp with time zone | yes      |                   |
| created_at    | timestamp with time zone | no       | now()             |
| updated_at    | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `coach_activity_log.team_id` → `public.teams.id`
- `coach_activity_log.user_id` → `auth.users.id`
- `coach_activity_log.coach_id` → `auth.users.id`

### `coach_alert_acknowledgments`

RLS: enabled · rows: 0 · PK: id

| column          | type                     | nullable | default           |
| --------------- | ------------------------ | -------- | ----------------- |
| id              | uuid                     | no       | gen_random_uuid() |
| coach_id        | uuid                     | no       |                   |
| alert_type      | character varying        | no       |                   |
| user_id         | uuid                     | yes      |                   |
| acknowledged_at | timestamp with time zone | yes      | now()             |
| notes           | text                     | yes      |                   |
| action_taken    | text                     | yes      |                   |
| created_at      | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `coach_alert_acknowledgments.coach_id` → `auth.users.id`
- `coach_alert_acknowledgments.user_id` → `auth.users.id`

### `coach_analytics_cache`

RLS: enabled · rows: 0 · PK: id

| column     | type                     | nullable | default           |
| ---------- | ------------------------ | -------- | ----------------- |
| id         | uuid                     | no       | gen_random_uuid() |
| coach_id   | uuid                     | no       |                   |
| team_id    | uuid                     | yes      |                   |
| cache_key  | character varying        | no       |                   |
| cache_data | jsonb                    | no       | '{}'::jsonb       |
| expires_at | timestamp with time zone | no       |                   |
| created_at | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `coach_analytics_cache.coach_id` → `auth.users.id`
- `coach_analytics_cache.team_id` → `public.teams.id`

### `coach_inbox_items`

RLS: enabled · rows: 0 · PK: id

| column          | type                     | nullable | default                     |
| --------------- | ------------------------ | -------- | --------------------------- |
| id              | uuid                     | no       | gen_random_uuid()           |
| coach_id        | uuid                     | no       |                             |
| user_id         | uuid                     | yes      |                             |
| team_id         | uuid                     | yes      |                             |
| item_type       | character varying        | no       |                             |
| title           | text                     | no       |                             |
| message         | text                     | yes      |                             |
| priority        | character varying        | yes      | 'normal'::character varying |
| status          | character varying        | yes      | 'unread'::character varying |
| metadata        | jsonb                    | yes      | '{}'::jsonb                 |
| source          | character varying        | yes      |                             |
| action_required | boolean                  | yes      | false                       |
| action_taken    | text                     | yes      |                             |
| actioned_at     | timestamp with time zone | yes      |                             |
| expires_at      | timestamp with time zone | yes      |                             |
| created_at      | timestamp with time zone | yes      | now()                       |
| updated_at      | timestamp with time zone | yes      | now()                       |

**Foreign keys:**

- `coach_inbox_items.team_id` → `public.teams.id`
- `coach_inbox_items.coach_id` → `auth.users.id`
- `coach_inbox_items.user_id` → `auth.users.id`

### `coach_overrides`

RLS: enabled · rows: 0 · PK: id

| column        | type                     | nullable | default           |
| ------------- | ------------------------ | -------- | ----------------- |
| id            | uuid                     | no       | gen_random_uuid() |
| user_id       | uuid                     | no       |                   |
| coach_id      | uuid                     | no       |                   |
| override_type | character varying        | no       |                   |
| override_data | jsonb                    | no       | '{}'::jsonb       |
| reason        | text                     | yes      |                   |
| expires_at    | timestamp with time zone | yes      |                   |
| created_at    | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `coach_overrides.coach_id` → `auth.users.id`
- `coach_overrides.user_id` → `auth.users.id`

### `comment_likes`

RLS: enabled · rows: 0 · PK: id

| column     | type                     | nullable | default           |
| ---------- | ------------------------ | -------- | ----------------- |
| id         | uuid                     | no       | gen_random_uuid() |
| comment_id | uuid                     | no       |                   |
| user_id    | uuid                     | no       |                   |
| created_at | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `comment_likes.comment_id` → `public.post_comments.id`
- `comment_likes.user_id` → `public.users.id`

### `community_poll_options`

RLS: enabled · rows: 0 · PK: id

| column      | type    | nullable | default           |
| ----------- | ------- | -------- | ----------------- |
| id          | uuid    | no       | gen_random_uuid() |
| poll_id     | uuid    | no       |                   |
| option_text | text    | no       |                   |
| votes_count | integer | no       | 0                 |

**Foreign keys:**

- `community_poll_options.poll_id` → `public.community_polls.id`
- `community_poll_votes.option_id` → `public.community_poll_options.id`

### `community_poll_votes`

RLS: enabled · rows: 0 · PK: id

| column     | type                     | nullable | default           |
| ---------- | ------------------------ | -------- | ----------------- |
| id         | uuid                     | no       | gen_random_uuid() |
| option_id  | uuid                     | no       |                   |
| user_id    | uuid                     | no       |                   |
| created_at | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `community_poll_votes.user_id` → `public.users.id`
- `community_poll_votes.option_id` → `public.community_poll_options.id`

### `community_polls`

RLS: enabled · rows: 0 · PK: id

| column     | type                     | nullable | default           |
| ---------- | ------------------------ | -------- | ----------------- |
| id         | uuid                     | no       | gen_random_uuid() |
| post_id    | uuid                     | no       |                   |
| question   | text                     | no       |                   |
| ends_at    | timestamp with time zone | yes      |                   |
| created_at | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `community_polls.post_id` → `public.posts.id`
- `community_poll_options.poll_id` → `public.community_polls.id`

### `competition_events`

RLS: enabled · rows: 9 · PK: id

| column              | type                     | nullable | default           |
| ------------------- | ------------------------ | -------- | ----------------- |
| id                  | uuid                     | no       | gen_random_uuid() |
| competition_id      | uuid                     | no       |                   |
| team_id             | uuid                     | no       |                   |
| starts_at           | timestamp with time zone | no       |                   |
| ends_at             | timestamp with time zone | yes      |                   |
| expected_game_count | integer                  | no       | 1                 |
| importance          | text                     | no       | 'regular'::text   |
| label               | text                     | yes      |                   |
| location            | text                     | yes      |                   |
| venue               | text                     | yes      |                   |
| notes               | text                     | yes      |                   |
| status              | text                     | no       | 'scheduled'::text |
| external_id         | text                     | yes      |                   |
| metadata            | jsonb                    | no       | '{}'::jsonb       |
| created_by          | uuid                     | yes      |                   |
| created_at          | timestamp with time zone | no       | now()             |
| updated_at          | timestamp with time zone | no       | now()             |
| minutes_per_game    | integer                  | yes      |                   |
| game_format         | character varying        | yes      |                   |
| hotel_name          | text                     | yes      |                   |
| hotel_address       | text                     | yes      |                   |

**Foreign keys:**

- `athlete_travel_log.competition_event_id` → `public.competition_events.id`
- `competition_events.created_by` → `auth.users.id`
- `competition_events.team_id` → `public.teams.id`
- `competition_events.competition_id` → `public.competitions.id`
- `games.competition_event_id` → `public.competition_events.id`
- `event_games.competition_event_id` → `public.competition_events.id`
- `event_participation.competition_event_id` → `public.competition_events.id`
- `event_availability.competition_event_id` → `public.competition_events.id`

### `competitions`

RLS: enabled · rows: 5 · PK: id

| column         | type                     | nullable | default           |
| -------------- | ------------------------ | -------- | ----------------- |
| id             | uuid                     | no       | gen_random_uuid() |
| name           | text                     | no       |                   |
| short_name     | text                     | yes      |                   |
| kind           | text                     | no       | 'league'::text    |
| level          | text                     | no       | 'national'::text  |
| country        | text                     | yes      |                   |
| governing_body | text                     | yes      |                   |
| format         | text                     | yes      | '5v5'::text       |
| season_year    | integer                  | yes      |                   |
| starts_on      | date                     | yes      |                   |
| ends_on        | date                     | yes      |                   |
| external_id    | text                     | yes      |                   |
| source         | text                     | no       | 'manual'::text    |
| metadata       | jsonb                    | no       | '{}'::jsonb       |
| created_by     | uuid                     | yes      |                   |
| created_at     | timestamp with time zone | no       | now()             |
| updated_at     | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `competitions.created_by` → `auth.users.id`
- `competition_events.competition_id` → `public.competitions.id`

### `consent_access_log`

RLS: enabled · rows: 0 · PK: id

| column        | type                     | nullable | default           |
| ------------- | ------------------------ | -------- | ----------------- |
| id            | uuid                     | no       | gen_random_uuid() |
| user_id       | uuid                     | no       |                   |
| accessed_by   | uuid                     | no       |                   |
| access_type   | character varying        | no       |                   |
| data_category | character varying        | yes      |                   |
| accessed_at   | timestamp with time zone | yes      | now()             |
| reason        | text                     | yes      |                   |
| consent_given | boolean                  | yes      | false             |

**Foreign keys:**

- `consent_access_log.user_id` → `auth.users.id`
- `consent_access_log.accessed_by` → `auth.users.id`

### `contraindication_rules`

RLS: enabled · rows: 22 · PK: id

| column               | type    | nullable | default           |
| -------------------- | ------- | -------- | ----------------- |
| id                   | uuid    | no       | gen_random_uuid() |
| injury_location      | text    | no       |                   |
| blocked_modality     | text    | no       |                   |
| rtp_phase_cleared_at | integer | yes      |                   |
| gate_level           | text    | no       | 'hard'::text      |
| methodology_citation | text    | no       |                   |
| is_active            | boolean | no       | true              |

### `conversation_context`

RLS: enabled · rows: 0 · PK: id

| column       | type                     | nullable | default           |
| ------------ | ------------------------ | -------- | ----------------- |
| id           | uuid                     | no       | gen_random_uuid() |
| user_id      | uuid                     | no       |                   |
| session_id   | uuid                     | yes      |                   |
| context_type | character varying        | no       |                   |
| context_data | jsonb                    | no       | '{}'::jsonb       |
| expires_at   | timestamp with time zone | yes      |                   |
| is_active    | boolean                  | yes      | true              |
| created_at   | timestamp with time zone | yes      | now()             |
| updated_at   | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `conversation_context.user_id` → `auth.users.id`

### `daily_protocols`

RLS: enabled · rows: 17 · PK: id

| column                              | type                     | nullable | default           |
| ----------------------------------- | ------------------------ | -------- | ----------------- |
| id                                  | uuid                     | no       | gen_random_uuid() |
| user_id                             | uuid                     | no       |                   |
| protocol_date                       | date                     | no       |                   |
| readiness_score                     | integer                  | yes      |                   |
| acwr_value                          | numeric                  | yes      |                   |
| total_load_target_au                | integer                  | yes      |                   |
| ai_rationale                        | text                     | yes      |                   |
| training_focus                      | text                     | yes      |                   |
| morning_status                      | text                     | yes      | 'pending'::text   |
| foam_roll_status                    | text                     | yes      | 'pending'::text   |
| main_session_status                 | text                     | yes      | 'pending'::text   |
| evening_status                      | text                     | yes      | 'pending'::text   |
| overall_progress                    | integer                  | yes      | 0                 |
| completed_exercises                 | integer                  | yes      | 0                 |
| total_exercises                     | integer                  | yes      | 0                 |
| morning_completed_at                | timestamp with time zone | yes      |                   |
| foam_roll_completed_at              | timestamp with time zone | yes      |                   |
| main_session_completed_at           | timestamp with time zone | yes      |                   |
| evening_completed_at                | timestamp with time zone | yes      |                   |
| actual_duration_minutes             | integer                  | yes      |                   |
| actual_rpe                          | integer                  | yes      |                   |
| actual_load_au                      | integer                  | yes      |                   |
| session_notes                       | text                     | yes      |                   |
| generated_at                        | timestamp with time zone | yes      | now()             |
| updated_at                          | timestamp with time zone | yes      | now()             |
| coach_alert_active                  | boolean                  | yes      | false             |
| coach_alert_message                 | text                     | yes      |                   |
| coach_alert_requires_acknowledgment | boolean                  | yes      | false             |
| coach_acknowledged                  | boolean                  | yes      | false             |
| coach_acknowledged_at               | timestamp with time zone | yes      |                   |
| modified_by_coach_id                | uuid                     | yes      |                   |
| modified_by_coach_name              | text                     | yes      |                   |
| modified_at                         | timestamp with time zone | yes      |                   |
| coach_note                          | text                     | yes      |                   |
| coach_note_priority                 | text                     | yes      | 'info'::text      |
| confidence_metadata                 | jsonb                    | yes      |                   |
| isometrics_status                   | text                     | yes      | 'pending'::text   |
| plyometrics_status                  | text                     | yes      | 'pending'::text   |
| strength_status                     | text                     | yes      | 'pending'::text   |
| conditioning_status                 | text                     | yes      | 'pending'::text   |
| skill_drills_status                 | text                     | yes      | 'pending'::text   |
| warm_up_status                      | text                     | yes      | 'pending'::text   |
| cool_down_status                    | text                     | yes      | 'pending'::text   |
| isometrics_completed_at             | timestamp with time zone | yes      |                   |
| plyometrics_completed_at            | timestamp with time zone | yes      |                   |
| strength_completed_at               | timestamp with time zone | yes      |                   |
| conditioning_completed_at           | timestamp with time zone | yes      |                   |
| skill_drills_completed_at           | timestamp with time zone | yes      |                   |
| warm_up_completed_at                | timestamp with time zone | yes      |                   |
| cool_down_completed_at              | timestamp with time zone | yes      |                   |

**Foreign keys:**

- `daily_protocols.modified_by_coach_id` → `auth.users.id`
- `daily_protocols.user_id` → `auth.users.id`
- `protocol_generation_requests.protocol_id` → `public.daily_protocols.id`
- `protocol_exercises.protocol_id` → `public.daily_protocols.id`
- `prescription_audit_log.daily_protocol_id` → `public.daily_protocols.id`
- `rtp_prescription_approvals.daily_protocol_id` → `public.daily_protocols.id`

### `daily_wellness_checkin`

RLS: enabled · rows: 27 · PK: id

| column               | type                     | nullable | default           |
| -------------------- | ------------------------ | -------- | ----------------- |
| id                   | uuid                     | no       | gen_random_uuid() |
| user_id              | uuid                     | no       |                   |
| checkin_date         | date                     | no       |                   |
| sleep_quality        | integer                  | yes      |                   |
| sleep_hours          | numeric                  | yes      |                   |
| energy_level         | integer                  | yes      |                   |
| muscle_soreness      | integer                  | yes      |                   |
| stress_level         | integer                  | yes      |                   |
| soreness_areas       | ARRAY                    | yes      |                   |
| motivation_level     | integer                  | yes      |                   |
| mood                 | integer                  | yes      |                   |
| hydration_level      | integer                  | yes      |                   |
| notes                | text                     | yes      |                   |
| calculated_readiness | numeric                  | yes      |                   |
| created_at           | timestamp with time zone | yes      | now()             |
| updated_at           | timestamp with time zone | yes      | now()             |
| travel_hours         | integer                  | yes      |                   |

**Foreign keys:**

- `daily_wellness_checkin.user_id` → `public.users.id`

### `decision_ledger`

RLS: enabled · rows: 0 · PK: id

| column          | type                     | nullable | default                      |
| --------------- | ------------------------ | -------- | ---------------------------- |
| id              | uuid                     | no       | gen_random_uuid()            |
| team_id         | uuid                     | no       |                              |
| decision_type   | character varying        | no       |                              |
| decision_maker  | uuid                     | no       |                              |
| decision_data   | jsonb                    | no       | '{}'::jsonb                  |
| rationale       | text                     | yes      |                              |
| status          | character varying        | yes      | 'pending'::character varying |
| created_at      | timestamp with time zone | yes      | now()                        |
| updated_at      | timestamp with time zone | yes      | now()                        |
| review_date     | timestamp with time zone | yes      |                              |
| review_priority | text                     | yes      |                              |

**Foreign keys:**

- `decision_ledger.team_id` → `public.teams.id`
- `decision_ledger.decision_maker` → `auth.users.id`

### `decision_review_reminders`

RLS: enabled · rows: 0 · PK: id

| column        | type                     | nullable | default           |
| ------------- | ------------------------ | -------- | ----------------- |
| id            | uuid                     | no       | gen_random_uuid() |
| decision_id   | uuid                     | no       |                   |
| reminder_date | date                     | no       |                   |
| reminder_sent | boolean                  | yes      | false             |
| created_at    | timestamp with time zone | yes      | now()             |

### `emergency_medical_records`

RLS: enabled · rows: 0 · PK: id

| column               | type                     | nullable | default           |
| -------------------- | ------------------------ | -------- | ----------------- |
| id                   | uuid                     | no       | gen_random_uuid() |
| user_id              | uuid                     | yes      |                   |
| user_email_hash      | text                     | yes      |                   |
| record_type          | text                     | yes      |                   |
| record_data          | jsonb                    | no       | '{}'::jsonb       |
| retention_until      | timestamp with time zone | yes      |                   |
| created_at           | timestamp with time zone | no       | now()             |
| updated_at           | timestamp with time zone | no       | now()             |
| event_type           | text                     | yes      |                   |
| event_date           | timestamp with time zone | yes      |                   |
| medical_data         | jsonb                    | yes      |                   |
| location_data        | jsonb                    | yes      |                   |
| retention_expires_at | timestamp with time zone | yes      |                   |

**Foreign keys:**

- `emergency_medical_records.user_id` → `auth.users.id`

### `event_availability`

RLS: enabled · rows: 0 · PK: id

| column                | type                     | nullable | default                      |
| --------------------- | ------------------------ | -------- | ---------------------------- |
| id                    | uuid                     | no       | gen_random_uuid()            |
| user_id               | uuid                     | no       |                              |
| competition_event_id  | uuid                     | no       |                              |
| team_id               | uuid                     | no       |                              |
| status                | character varying        | no       | 'pending'::character varying |
| reason                | text                     | yes      |                              |
| arrival_date          | date                     | yes      |                              |
| departure_date        | date                     | yes      |                              |
| accommodation_needed  | boolean                  | yes      | true                         |
| transportation_needed | boolean                  | yes      | false                        |
| dietary_restrictions  | text                     | yes      |                              |
| payment_status        | character varying        | yes      | 'pending'::character varying |
| amount_due            | numeric                  | yes      | 0                            |
| amount_paid           | numeric                  | yes      | 0                            |
| payment_deadline      | date                     | yes      |                              |
| responded_at          | timestamp with time zone | yes      |                              |
| created_at            | timestamp with time zone | yes      | now()                        |
| updated_at            | timestamp with time zone | yes      | now()                        |

**Foreign keys:**

- `event_availability.team_id` → `public.teams.id`
- `event_availability.user_id` → `public.users.id`
- `event_availability.competition_event_id` → `public.competition_events.id`

### `event_games`

RLS: enabled · rows: 0 · PK: id

| column                    | type                     | nullable | default           |
| ------------------------- | ------------------------ | -------- | ----------------- |
| id                        | uuid                     | no       | gen_random_uuid() |
| competition_event_id      | uuid                     | no       |                   |
| team_id                   | uuid                     | no       |                   |
| game_number               | integer                  | no       |                   |
| game_date                 | date                     | no       |                   |
| kickoff_time              | time without time zone   | no       |                   |
| expected_duration_minutes | integer                  | no       | 40                |
| opponent                  | text                     | yes      |                   |
| field                     | text                     | yes      |                   |
| bracket_stage             | text                     | yes      |                   |
| is_provisional            | boolean                  | no       | false             |
| status                    | text                     | no       | 'scheduled'::text |
| result                    | jsonb                    | yes      |                   |
| created_by                | uuid                     | yes      |                   |
| created_at                | timestamp with time zone | no       | now()             |
| updated_at                | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `event_games.competition_event_id` → `public.competition_events.id`
- `event_games.created_by` → `auth.users.id`
- `event_participation.game_id` → `public.event_games.id`
- `event_games.team_id` → `public.teams.id`

### `event_participation`

RLS: enabled · rows: 0 · PK: id

| column               | type                     | nullable | default           |
| -------------------- | ------------------------ | -------- | ----------------- |
| id                   | uuid                     | no       | gen_random_uuid() |
| user_id              | uuid                     | no       |                   |
| competition_event_id | uuid                     | no       |                   |
| team_id              | uuid                     | yes      |                   |
| attended             | boolean                  | no       | false             |
| games_played         | integer                  | no       | 0                 |
| games_expected       | integer                  | yes      |                   |
| total_minutes        | integer                  | yes      |                   |
| avg_rpe              | numeric                  | yes      |                   |
| load_au              | numeric                  | yes      |                   |
| status               | text                     | no       | 'confirmed'::text |
| notes                | text                     | yes      |                   |
| training_session_id  | uuid                     | yes      |                   |
| recorded_by          | uuid                     | yes      |                   |
| recorded_at          | timestamp with time zone | yes      | now()             |
| created_at           | timestamp with time zone | yes      | now()             |
| updated_at           | timestamp with time zone | yes      | now()             |
| game_id              | uuid                     | yes      |                   |

**Foreign keys:**

- `event_participation.game_id` → `public.event_games.id`
- `event_participation.team_id` → `public.teams.id`
- `event_participation.competition_event_id` → `public.competition_events.id`
- `event_participation.training_session_id` → `public.training_sessions.id`
- `event_participation.user_id` → `auth.users.id`

### `execution_logs`

RLS: enabled · rows: 0 · PK: log_id

| column           | type                     | nullable | default           |
| ---------------- | ------------------------ | -------- | ----------------- |
| log_id           | uuid                     | no       | gen_random_uuid() |
| session_id       | uuid                     | no       |                   |
| session_version  | integer                  | no       |                   |
| user_id          | uuid                     | no       |                   |
| exercise_id      | uuid                     | yes      |                   |
| exercise_name    | text                     | yes      |                   |
| sets_completed   | integer                  | yes      |                   |
| reps_completed   | integer                  | yes      |                   |
| load_kg          | numeric                  | yes      |                   |
| rpe              | integer                  | yes      |                   |
| duration_minutes | integer                  | yes      |                   |
| notes            | text                     | yes      |                   |
| logged_at        | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `execution_logs.user_id` → `auth.users.id`
- `execution_logs.exercise_id` → `public.exercises.id`
- `execution_logs.session_id` → `public.training_sessions.id`

### `exercise_progressions`

RLS: enabled · rows: 0 · PK: id

| column                 | type                     | nullable | default           |
| ---------------------- | ------------------------ | -------- | ----------------- |
| id                     | uuid                     | no       | gen_random_uuid() |
| exercise_id            | uuid                     | no       |                   |
| progression_type       | text                     | no       |                   |
| increment_value        | numeric                  | yes      |                   |
| min_value              | numeric                  | yes      |                   |
| max_value              | numeric                  | yes      |                   |
| reset_threshold        | numeric                  | yes      |                   |
| requires_completion    | boolean                  | yes      | true              |
| acwr_adjustment_factor | numeric                  | yes      | 1.0               |
| created_at             | timestamp with time zone | yes      | now()             |
| updated_at             | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `exercise_progressions.exercise_id` → `public.exercises.id`

### `exercise_registry`

RLS: enabled · rows: 0 · PK: id

| column           | type                     | nullable | default           |
| ---------------- | ------------------------ | -------- | ----------------- |
| id               | uuid                     | no       | gen_random_uuid() |
| exercise_name    | character varying        | no       |                   |
| category         | character varying        | yes      |                   |
| muscle_groups    | ARRAY                    | yes      |                   |
| equipment_needed | ARRAY                    | yes      |                   |
| difficulty_level | character varying        | yes      |                   |
| instructions     | text                     | yes      |                   |
| video_url        | text                     | yes      |                   |
| created_at       | timestamp with time zone | yes      | now()             |
| updated_at       | timestamp with time zone | yes      | now()             |

### `exercisedb_exercises`

RLS: enabled · rows: 0 · PK: id

| column                  | type                     | nullable | default                           |
| ----------------------- | ------------------------ | -------- | --------------------------------- |
| id                      | uuid                     | no       | gen_random_uuid()                 |
| exercisedb_id           | character varying        | no       |                                   |
| name                    | character varying        | no       |                                   |
| category                | character varying        | yes      |                                   |
| muscle_groups           | ARRAY                    | yes      |                                   |
| equipment               | ARRAY                    | yes      |                                   |
| instructions            | text                     | yes      |                                   |
| image_url               | text                     | yes      |                                   |
| video_url               | text                     | yes      |                                   |
| created_at              | timestamp with time zone | yes      | now()                             |
| updated_at              | timestamp with time zone | yes      | now()                             |
| body_part               | character varying        | yes      |                                   |
| target_muscle           | character varying        | yes      |                                   |
| is_curated              | boolean                  | yes      | false                             |
| flag_football_relevance | integer                  | yes      | 7                                 |
| difficulty_level        | character varying        | yes      | 'intermediate'::character varying |
| is_active               | boolean                  | yes      | true                              |
| is_approved             | boolean                  | yes      | false                             |

**Foreign keys:**

- `ff_exercise_mappings.exercisedb_exercise_id` → `public.exercisedb_exercises.id`

### `exercisedb_import_logs`

RLS: enabled · rows: 0 · PK: id

| column             | type                     | nullable | default                        |
| ------------------ | ------------------------ | -------- | ------------------------------ |
| id                 | uuid                     | no       | gen_random_uuid()              |
| import_date        | timestamp with time zone | yes      | now()                          |
| exercises_imported | integer                  | yes      | 0                              |
| exercises_updated  | integer                  | yes      | 0                              |
| errors             | jsonb                    | yes      | '[]'::jsonb                    |
| status             | character varying        | yes      | 'completed'::character varying |

### `exercises`

RLS: enabled · rows: 286 · PK: id

| column                   | type                     | nullable | default           |
| ------------------------ | ------------------------ | -------- | ----------------- |
| id                       | uuid                     | no       | gen_random_uuid() |
| name                     | character varying        | no       |                   |
| category                 | character varying        | yes      |                   |
| movement_pattern         | character varying        | yes      |                   |
| description              | text                     | yes      |                   |
| video_url                | character varying        | yes      |                   |
| equipment_needed         | ARRAY                    | yes      |                   |
| position_specific        | ARRAY                    | yes      |                   |
| applicable_positions     | ARRAY                    | yes      |                   |
| metrics_tracked          | ARRAY                    | yes      |                   |
| created_at               | timestamp with time zone | yes      | now()             |
| updated_at               | timestamp with time zone | yes      | now()             |
| slug                     | text                     | yes      |                   |
| video_id                 | text                     | yes      |                   |
| video_duration_seconds   | integer                  | yes      |                   |
| thumbnail_url            | text                     | yes      |                   |
| how_text                 | text                     | yes      |                   |
| feel_text                | text                     | yes      |                   |
| compensation_text        | text                     | yes      |                   |
| load_contribution_au     | integer                  | yes      | 0                 |
| subcategory              | text                     | yes      |                   |
| instructions             | ARRAY                    | yes      |                   |
| coaching_cues            | ARRAY                    | yes      |                   |
| muscle_groups            | ARRAY                    | yes      |                   |
| difficulty_level         | text                     | yes      |                   |
| image_url                | text                     | yes      |                   |
| default_sets             | integer                  | yes      | 1                 |
| default_reps             | integer                  | yes      |                   |
| default_hold_seconds     | integer                  | yes      |                   |
| default_duration_seconds | integer                  | yes      |                   |
| target_muscles           | ARRAY                    | yes      |                   |
| equipment_required       | ARRAY                    | yes      |                   |
| active                   | boolean                  | yes      | true              |
| is_high_intensity        | boolean                  | yes      | false             |

**Foreign keys:**

- `exercise_progressions.exercise_id` → `public.exercises.id`
- `protocol_exercises.exercise_id` → `public.exercises.id`
- `execution_logs.exercise_id` → `public.exercises.id`
- `session_exercises.exercise_id` → `public.exercises.id`

### `ff_exercise_mappings`

RLS: enabled · rows: 0 · PK: id

| column                    | type                     | nullable | default           |
| ------------------------- | ------------------------ | -------- | ----------------- |
| id                        | uuid                     | no       | gen_random_uuid() |
| exercisedb_exercise_id    | uuid                     | no       |                   |
| flag_football_exercise_id | uuid                     | yes      |                   |
| mapping_type              | character varying        | yes      |                   |
| confidence_score          | numeric                  | yes      |                   |
| created_at                | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `ff_exercise_mappings.exercisedb_exercise_id` → `public.exercisedb_exercises.id`

### `flag_pull_stats`

RLS: enabled · rows: 0 · PK: id

| column                | type                        | nullable | default                                     |
| --------------------- | --------------------------- | -------- | ------------------------------------------- |
| id                    | integer                     | no       | nextval('flag_pull_stats_id_seq'::regclass) |
| game_event_id         | integer                     | yes      |                                             |
| game_id               | character varying           | no       |                                             |
| ball_carrier_id       | character varying           | no       |                                             |
| defender_id           | character varying           | no       |                                             |
| attempt_type          | character varying           | yes      |                                             |
| attempt_location      | character varying           | yes      |                                             |
| is_successful         | boolean                     | no       |                                             |
| yards_before_pull     | integer                     | yes      |                                             |
| yards_after_miss      | integer                     | yes      |                                             |
| miss_reason           | character varying           | yes      |                                             |
| evasion_technique     | character varying           | yes      |                                             |
| closing_speed         | numeric                     | yes      |                                             |
| pursuit_angle_degrees | integer                     | yes      |                                             |
| reaction_time         | numeric                     | yes      |                                             |
| num_broken_tackles    | integer                     | yes      | 0                                           |
| yards_after_contact   | integer                     | yes      |                                             |
| video_clip_url        | text                        | yes      |                                             |
| created_at            | timestamp without time zone | yes      | now()                                       |

**Foreign keys:**

- `flag_pull_stats.game_event_id` → `public.game_events.id`

### `frontend_logs`

RLS: enabled · rows: 0 · PK: id

| column    | type                     | nullable | default           |
| --------- | ------------------------ | -------- | ----------------- |
| id        | uuid                     | no       | gen_random_uuid() |
| timestamp | timestamp with time zone | no       | now()             |
| level     | text                     | no       |                   |
| trace_id  | uuid                     | yes      |                   |
| user_id   | uuid                     | no       |                   |
| message   | text                     | no       |                   |
| context   | jsonb                    | no       | '{}'::jsonb       |

**Foreign keys:**

- `frontend_logs.user_id` → `auth.users.id`

### `game_events`

RLS: enabled · rows: 0 · PK: id

| column               | type                        | nullable | default                                 |
| -------------------- | --------------------------- | -------- | --------------------------------------- |
| id                   | integer                     | no       | nextval('game_events_id_seq'::regclass) |
| game_id              | character varying           | no       |                                         |
| team_id              | character varying           | no       |                                         |
| play_number          | integer                     | no       |                                         |
| timestamp            | timestamp without time zone | yes      | now()                                   |
| quarter              | integer                     | yes      |                                         |
| down                 | integer                     | yes      |                                         |
| distance             | integer                     | yes      |                                         |
| yard_line            | integer                     | yes      |                                         |
| field_zone           | character varying           | yes      |                                         |
| time_remaining       | integer                     | yes      |                                         |
| score_differential   | integer                     | yes      |                                         |
| play_type            | character varying           | yes      |                                         |
| play_category        | character varying           | yes      |                                         |
| primary_player_id    | character varying           | yes      |                                         |
| secondary_player_ids | ARRAY                       | yes      |                                         |
| defender_ids         | ARRAY                       | yes      |                                         |
| play_result          | character varying           | yes      |                                         |
| yards_gained         | integer                     | yes      |                                         |
| yards_after_catch    | integer                     | yes      |                                         |
| is_successful        | boolean                     | yes      |                                         |
| is_turnover          | boolean                     | yes      | false                                   |
| is_penalty           | boolean                     | yes      | false                                   |
| penalty_type         | character varying           | yes      |                                         |
| weather_conditions   | character varying           | yes      |                                         |
| field_conditions     | character varying           | yes      |                                         |
| play_notes           | text                        | yes      |                                         |
| video_timestamp      | integer                     | yes      |                                         |
| video_clip_url       | text                        | yes      |                                         |
| created_at           | timestamp without time zone | yes      | now()                                   |

**Foreign keys:**

- `passing_stats.game_event_id` → `public.game_events.id`
- `flag_pull_stats.game_event_id` → `public.game_events.id`
- `receiving_stats.game_event_id` → `public.game_events.id`

### `game_participations`

RLS: enabled · rows: 0 · PK: id

| column     | type                     | nullable | default                        |
| ---------- | ------------------------ | -------- | ------------------------------ |
| id         | uuid                     | no       | gen_random_uuid()              |
| game_id    | character varying        | no       |                                |
| team_id    | uuid                     | no       |                                |
| user_id    | uuid                     | no       |                                |
| status     | character varying        | no       | 'scheduled'::character varying |
| position   | character varying        | yes      |                                |
| notes      | text                     | yes      |                                |
| created_at | timestamp with time zone | no       | now()                          |
| updated_at | timestamp with time zone | no       | now()                          |

**Foreign keys:**

- `game_participations.game_id` → `public.games.game_id`
- `game_participations.team_id` → `public.teams.id`
- `game_participations.user_id` → `auth.users.id`

### `games`

RLS: enabled · rows: 0 · PK: id

| column               | type                        | nullable | default                           |
| -------------------- | --------------------------- | -------- | --------------------------------- |
| id                   | integer                     | no       | nextval('games_id_seq'::regclass) |
| game_id              | character varying           | no       |                                   |
| team_id              | character varying           | no       |                                   |
| opponent_team_name   | character varying           | no       |                                   |
| game_date            | date                        | no       |                                   |
| game_time            | time without time zone      | yes      |                                   |
| location             | character varying           | yes      |                                   |
| is_home_game         | boolean                     | yes      | true                              |
| team_score           | integer                     | yes      |                                   |
| opponent_score       | integer                     | yes      |                                   |
| game_result          | character varying           | yes      |                                   |
| weather_conditions   | character varying           | yes      |                                   |
| temperature          | integer                     | yes      |                                   |
| field_conditions     | character varying           | yes      |                                   |
| season               | character varying           | yes      |                                   |
| tournament_name      | character varying           | yes      |                                   |
| game_type            | character varying           | yes      |                                   |
| game_video_url       | text                        | yes      |                                   |
| created_at           | timestamp without time zone | yes      | now()                             |
| updated_at           | timestamp without time zone | yes      | now()                             |
| competition_event_id | uuid                        | yes      |                                   |
| version              | integer                     | no       | 1                                 |

**Foreign keys:**

- `game_participations.game_id` → `public.games.game_id`
- `games.competition_event_id` → `public.competition_events.id`
- `channels.game_id` → `public.games.game_id`

### `isometrics_exercises`

RLS: enabled · rows: 0 · PK: id

| column                | type                        | nullable | default                                          |
| --------------------- | --------------------------- | -------- | ------------------------------------------------ |
| id                    | integer                     | no       | nextval('isometrics_exercises_id_seq'::regclass) |
| exercise_name         | character varying           | no       |                                                  |
| category              | character varying           | yes      |                                                  |
| target_muscles        | ARRAY                       | yes      |                                                  |
| equipment_needed      | ARRAY                       | yes      |                                                  |
| difficulty_level      | character varying           | yes      |                                                  |
| effectiveness_rating  | integer                     | yes      |                                                  |
| hold_duration_seconds | integer                     | yes      |                                                  |
| instructions          | text                        | yes      |                                                  |
| variations            | ARRAY                       | yes      |                                                  |
| performance_metrics   | jsonb                       | yes      |                                                  |
| created_at            | timestamp without time zone | yes      | now()                                            |

### `knowledge_base_entries`

RLS: enabled · rows: 112 · PK: id

| column                   | type                        | nullable | default           |
| ------------------------ | --------------------------- | -------- | ----------------- |
| id                       | uuid                        | no       | gen_random_uuid() |
| entry_type               | character varying           | no       |                   |
| topic                    | character varying           | no       |                   |
| question                 | text                        | yes      |                   |
| answer                   | text                        | no       |                   |
| summary                  | text                        | yes      |                   |
| supporting_articles      | ARRAY                       | yes      |                   |
| evidence_strength        | character varying           | yes      |                   |
| consensus_level          | character varying           | yes      |                   |
| dosage_guidelines        | jsonb                       | yes      |                   |
| protocols                | jsonb                       | yes      |                   |
| contraindications        | ARRAY                       | yes      |                   |
| safety_warnings          | ARRAY                       | yes      |                   |
| best_practices           | ARRAY                       | yes      |                   |
| applicable_to            | ARRAY                       | yes      |                   |
| sport_specificity        | character varying           | yes      |                   |
| query_count              | integer                     | yes      | 0                 |
| last_queried_at          | timestamp without time zone | yes      |                   |
| created_at               | timestamp without time zone | yes      | now()             |
| updated_at               | timestamp without time zone | yes      | now()             |
| is_merlin_approved       | boolean                     | no       | false             |
| merlin_approval_status   | text                        | no       | 'pending'::text   |
| merlin_submitted_by      | uuid                        | yes      |                   |
| merlin_submitted_by_role | text                        | yes      |                   |
| merlin_submitted_at      | timestamp with time zone    | no       | now()             |
| merlin_approved_by       | uuid                        | yes      |                   |
| merlin_approved_by_role  | text                        | yes      |                   |
| merlin_approved_at       | timestamp with time zone    | yes      |                   |
| merlin_approval_notes    | text                        | yes      |                   |

**Foreign keys:**

- `knowledge_base_entries.merlin_submitted_by` → `auth.users.id`
- `knowledge_review_audit.entry_id` → `public.knowledge_base_entries.id`
- `knowledge_base_entries.merlin_approved_by` → `auth.users.id`

### `knowledge_base_governance_log`

RLS: enabled · rows: 0 · PK: id

| column       | type                     | nullable | default           |
| ------------ | ------------------------ | -------- | ----------------- |
| id           | uuid                     | no       | gen_random_uuid() |
| entry_id     | uuid                     | yes      |                   |
| action       | character varying        | no       |                   |
| performed_by | uuid                     | yes      |                   |
| reason       | text                     | yes      |                   |
| changes      | jsonb                    | yes      |                   |
| created_at   | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `knowledge_base_governance_log.performed_by` → `auth.users.id`

### `knowledge_review_audit`

RLS: enabled · rows: 0 · PK: id

| column                | type                     | nullable | default                                            |
| --------------------- | ------------------------ | -------- | -------------------------------------------------- |
| id                    | bigint                   | no       | nextval('knowledge_review_audit_id_seq'::regclass) |
| entry_id              | uuid                     | no       |                                                    |
| reviewed_by           | uuid                     | no       |                                                    |
| reviewed_by_role      | text                     | no       |                                                    |
| action                | text                     | no       |                                                    |
| notes                 | text                     | yes      |                                                    |
| quality_gate_override | boolean                  | no       | false                                              |
| quality_issues        | jsonb                    | no       | '[]'::jsonb                                        |
| created_at            | timestamp with time zone | no       | now()                                              |

**Foreign keys:**

- `knowledge_review_audit.entry_id` → `public.knowledge_base_entries.id`

### `knowledge_search_index`

RLS: enabled · rows: 112 · PK: id

| column          | type                        | nullable | default           |
| --------------- | --------------------------- | -------- | ----------------- |
| id              | uuid                        | no       | gen_random_uuid() |
| entry_id        | uuid                        | yes      |                   |
| searchable_text | text                        | yes      |                   |
| search_vector   | tsvector                    | yes      |                   |
| created_at      | timestamp without time zone | yes      | now()             |

### `learned_user_preferences`

RLS: enabled · rows: 0 · PK: user_id

| column              | type                     | nullable | default |
| ------------------- | ------------------------ | -------- | ------- |
| user_id             | uuid                     | no       |         |
| helpful_responses   | integer                  | no       | 0       |
| dismissed_responses | integer                  | no       | 0       |
| created_at          | timestamp with time zone | no       | now()   |
| updated_at          | timestamp with time zone | no       | now()   |

**Foreign keys:**

- `learned_user_preferences.user_id` → `public.users.id`

### `meal_templates`

RLS: enabled · rows: 4 · PK: id

| column       | type                     | nullable | default           |
| ------------ | ------------------------ | -------- | ----------------- |
| id           | uuid                     | no       | gen_random_uuid() |
| name         | text                     | no       |                   |
| category     | text                     | yes      |                   |
| meal_type    | text                     | yes      |                   |
| calories     | integer                  | yes      |                   |
| protein_g    | numeric                  | yes      |                   |
| carbs_g      | numeric                  | yes      |                   |
| fat_g        | numeric                  | yes      |                   |
| ingredients  | jsonb                    | yes      |                   |
| instructions | text                     | yes      |                   |
| is_active    | boolean                  | no       | true              |
| created_by   | uuid                     | yes      |                   |
| created_at   | timestamp with time zone | no       | now()             |
| updated_at   | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `meal_templates.created_by` → `auth.users.id`

### `mental_performance_logs`

RLS: enabled · rows: 3 · PK: id

| column                   | type                     | nullable | default           |
| ------------------------ | ------------------------ | -------- | ----------------- |
| id                       | uuid                     | no       | gen_random_uuid() |
| user_id                  | uuid                     | no       |                   |
| log_date                 | date                     | no       | CURRENT_DATE      |
| confidence_level         | integer                  | yes      |                   |
| focus_level              | integer                  | yes      |                   |
| motivation_level         | integer                  | yes      |                   |
| anxiety_level            | integer                  | yes      |                   |
| pre_game_nerves          | integer                  | yes      |                   |
| visualization_completed  | boolean                  | yes      |                   |
| mental_rehearsal_minutes | integer                  | yes      |                   |
| decision_making_clarity  | integer                  | yes      |                   |
| reaction_time_feeling    | integer                  | yes      |                   |
| life_stress_level        | integer                  | yes      |                   |
| mental_readiness_score   | integer                  | yes      |                   |
| context                  | text                     | yes      |                   |
| notes                    | text                     | yes      |                   |
| created_at               | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `mental_performance_logs.user_id` → `auth.users.id`

### `mental_wellness_reports`

RLS: enabled · rows: 0 · PK: id

| column       | type                     | nullable | default           |
| ------------ | ------------------------ | -------- | ----------------- |
| id           | uuid                     | no       | gen_random_uuid() |
| user_id      | uuid                     | no       |                   |
| report_type  | text                     | no       | 'wellness'::text  |
| report_data  | jsonb                    | no       | '{}'::jsonb       |
| generated_at | timestamp with time zone | no       | now()             |
| created_at   | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `mental_wellness_reports.user_id` → `auth.users.id`

### `merlin_violation_log`

RLS: enabled · rows: 0 · PK: violation_id

| column         | type                     | nullable | default           |
| -------------- | ------------------------ | -------- | ----------------- |
| violation_id   | uuid                     | no       | gen_random_uuid() |
| violation_type | text                     | no       |                   |
| endpoint       | text                     | no       |                   |
| request_body   | text                     | yes      |                   |
| user_agent     | text                     | yes      |                   |
| timestamp      | timestamp with time zone | no       | now()             |

### `message_read_receipts`

RLS: enabled · rows: 0 · PK: id

| column     | type                     | nullable | default           |
| ---------- | ------------------------ | -------- | ----------------- |
| id         | uuid                     | no       | gen_random_uuid() |
| message_id | uuid                     | no       |                   |
| user_id    | uuid                     | no       |                   |
| read_at    | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `message_read_receipts.user_id` → `auth.users.id`
- `message_read_receipts.message_id` → `public.chat_messages.id`

### `metric_definitions`

RLS: enabled · rows: 0 · PK: id

| column       | type                     | nullable | default           |
| ------------ | ------------------------ | -------- | ----------------- |
| id           | uuid                     | no       | gen_random_uuid() |
| metric_name  | character varying        | no       |                   |
| metric_type  | character varying        | no       |                   |
| unit         | character varying        | yes      |                   |
| description  | text                     | yes      |                   |
| target_value | numeric                  | yes      |                   |
| min_value    | numeric                  | yes      |                   |
| max_value    | numeric                  | yes      |                   |
| created_at   | timestamp with time zone | yes      | now()             |

### `metric_entries`

RLS: enabled · rows: 0 · PK: id

| column       | type                     | nullable | default           |
| ------------ | ------------------------ | -------- | ----------------- |
| id           | uuid                     | no       | gen_random_uuid() |
| user_id      | uuid                     | no       |                   |
| metric_id    | uuid                     | no       |                   |
| metric_value | numeric                  | no       |                   |
| recorded_at  | timestamp with time zone | no       | now()             |
| session_id   | uuid                     | yes      |                   |
| notes        | text                     | yes      |                   |
| created_at   | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `metric_entries.user_id` → `auth.users.id`

### `micro_session_analytics`

RLS: enabled · rows: 0 · PK: id

| column               | type                     | nullable | default           |
| -------------------- | ------------------------ | -------- | ----------------- |
| id                   | uuid                     | no       | gen_random_uuid() |
| user_id              | uuid                     | no       |                   |
| micro_session_id     | uuid                     | yes      |                   |
| completion_rate      | numeric                  | yes      |                   |
| avg_duration_seconds | integer                  | yes      |                   |
| streak_days          | integer                  | yes      | 0                 |
| total_completed      | integer                  | yes      | 0                 |
| favorite_type        | character varying        | yes      |                   |
| last_completed_at    | timestamp with time zone | yes      |                   |
| created_at           | timestamp with time zone | yes      | now()             |
| updated_at           | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `micro_session_analytics.user_id` → `auth.users.id`
- `micro_session_analytics.micro_session_id` → `public.micro_sessions.id`

### `micro_sessions`

RLS: enabled · rows: 0 · PK: id

| column           | type                     | nullable | default           |
| ---------------- | ------------------------ | -------- | ----------------- |
| id               | uuid                     | no       | gen_random_uuid() |
| user_id          | uuid                     | no       |                   |
| session_type     | character varying        | no       |                   |
| title            | character varying        | no       |                   |
| duration_seconds | integer                  | no       |                   |
| instructions     | ARRAY                    | yes      |                   |
| scheduled_time   | time without time zone   | yes      |                   |
| trigger_context  | character varying        | yes      |                   |
| completed_at     | timestamp with time zone | yes      |                   |
| skipped          | boolean                  | yes      | false             |
| notes            | text                     | yes      |                   |
| created_at       | timestamp with time zone | yes      | now()             |
| assigned_date    | date                     | yes      |                   |
| status           | text                     | yes      | 'pending'::text   |

**Foreign keys:**

- `micro_sessions.user_id` → `auth.users.id`
- `micro_session_analytics.micro_session_id` → `public.micro_sessions.id`

### `ml_training_data`

RLS: enabled · rows: 0 · PK: id

| column          | type                     | nullable | default           |
| --------------- | ------------------------ | -------- | ----------------- |
| id              | uuid                     | no       | gen_random_uuid() |
| user_id         | uuid                     | no       |                   |
| feature_vector  | jsonb                    | no       |                   |
| target_value    | numeric                  | yes      |                   |
| prediction_type | character varying        | yes      |                   |
| model_version   | character varying        | yes      |                   |
| created_at      | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `ml_training_data.user_id` → `auth.users.id`

### `movement_patterns`

RLS: enabled · rows: 0 · PK: id

| column      | type                     | nullable | default           |
| ----------- | ------------------------ | -------- | ----------------- |
| id          | uuid                     | no       | gen_random_uuid() |
| program_id  | uuid                     | yes      |                   |
| name        | character varying        | no       |                   |
| description | text                     | yes      |                   |
| created_at  | timestamp with time zone | yes      | now()             |
| updated_at  | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `movement_patterns.program_id` → `public.training_programs.id`

### `notifications`

RLS: enabled · rows: 4 · PK: id

| column              | type                     | nullable | default                     |
| ------------------- | ------------------------ | -------- | --------------------------- |
| id                  | uuid                     | no       | gen_random_uuid()           |
| user_id             | uuid                     | no       |                             |
| notification_type   | character varying        | yes      |                             |
| title               | character varying        | yes      |                             |
| message             | text                     | no       |                             |
| is_read             | boolean                  | yes      | false                       |
| priority            | character varying        | yes      | 'normal'::character varying |
| action_url          | text                     | yes      |                             |
| dismissed           | boolean                  | yes      | false                       |
| expires_at          | timestamp with time zone | yes      |                             |
| category            | character varying        | yes      |                             |
| severity            | character varying        | yes      |                             |
| data                | jsonb                    | yes      | '{}'::jsonb                 |
| sender_id           | uuid                     | yes      |                             |
| sender_name         | character varying        | yes      |                             |
| related_entity_type | character varying        | yes      |                             |
| related_entity_id   | uuid                     | yes      |                             |
| created_at          | timestamp with time zone | yes      | now()                       |
| updated_at          | timestamp with time zone | yes      | now()                       |

**Foreign keys:**

- `notifications.user_id` → `public.users.id`
- `notifications.sender_id` → `auth.users.id`

### `nutrition_goals`

RLS: enabled · rows: 0 · PK: id

| column          | type                     | nullable | default                          |
| --------------- | ------------------------ | -------- | -------------------------------- |
| id              | uuid                     | no       | gen_random_uuid()                |
| user_id         | uuid                     | no       |                                  |
| calories_target | integer                  | yes      | 2500                             |
| protein_target  | integer                  | yes      | 150                              |
| carbs_target    | integer                  | yes      | 300                              |
| fat_target      | integer                  | yes      | 80                               |
| fiber_target    | integer                  | yes      | 30                               |
| goal_type       | character varying        | yes      | 'maintenance'::character varying |
| created_at      | timestamp with time zone | yes      | now()                            |
| updated_at      | timestamp with time zone | yes      | now()                            |

**Foreign keys:**

- `nutrition_goals.user_id` → `auth.users.id`

### `nutrition_logs`

RLS: enabled · rows: 0 · PK: id

| column        | type                     | nullable | default           |
| ------------- | ------------------------ | -------- | ----------------- |
| id            | uuid                     | no       | gen_random_uuid() |
| user_id       | uuid                     | no       |                   |
| food_name     | character varying        | no       |                   |
| food_id       | integer                  | yes      |                   |
| calories      | numeric                  | yes      | 0                 |
| protein       | numeric                  | yes      | 0                 |
| carbohydrates | numeric                  | yes      | 0                 |
| fat           | numeric                  | yes      | 0                 |
| fiber         | numeric                  | yes      | 0                 |
| meal_type     | character varying        | yes      |                   |
| logged_at     | timestamp with time zone | yes      | now()             |
| notes         | text                     | yes      |                   |
| created_at    | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `nutrition_logs.user_id` → `auth.users.id`

### `nutrition_plans`

RLS: enabled · rows: 0 · PK: id

| column     | type                     | nullable | default           |
| ---------- | ------------------------ | -------- | ----------------- |
| id         | uuid                     | no       | gen_random_uuid() |
| user_id    | uuid                     | no       |                   |
| name       | text                     | yes      |                   |
| plan_type  | text                     | yes      |                   |
| calories   | integer                  | yes      |                   |
| protein_g  | numeric                  | yes      |                   |
| carbs_g    | numeric                  | yes      |                   |
| fat_g      | numeric                  | yes      |                   |
| fluid_l    | numeric                  | yes      |                   |
| meals      | jsonb                    | yes      |                   |
| start_date | date                     | yes      |                   |
| end_date   | date                     | yes      |                   |
| notes      | text                     | yes      |                   |
| is_active  | boolean                  | no       | true              |
| created_at | timestamp with time zone | no       | now()             |
| updated_at | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `nutrition_plans.user_id` → `auth.users.id`

### `nutrition_reports`

RLS: enabled · rows: 0 · PK: id

| column       | type                     | nullable | default                     |
| ------------ | ------------------------ | -------- | --------------------------- |
| id           | uuid                     | no       | gen_random_uuid()           |
| user_id      | uuid                     | no       |                             |
| created_by   | uuid                     | yes      |                             |
| team_id      | uuid                     | yes      |                             |
| report_type  | character varying        | no       | 'weekly'::character varying |
| report_data  | jsonb                    | no       | '{}'::jsonb                 |
| period_start | date                     | yes      |                             |
| period_end   | date                     | yes      |                             |
| created_at   | timestamp with time zone | no       | now()                       |

**Foreign keys:**

- `nutrition_reports.user_id` → `auth.users.id`
- `nutrition_reports.team_id` → `public.teams.id`
- `nutrition_reports.created_by` → `auth.users.id`

### `opponent_analysis`

RLS: enabled · rows: 0 · PK: id

| column                    | type                        | nullable | default                                       |
| ------------------------- | --------------------------- | -------- | --------------------------------------------- |
| id                        | integer                     | no       | nextval('opponent_analysis_id_seq'::regclass) |
| opponent_team_name        | character varying           | no       |                                               |
| opponent_player_name      | character varying           | yes      |                                               |
| formation_tendencies      | jsonb                       | yes      |                                               |
| play_tendencies           | jsonb                       | yes      |                                               |
| situational_tendencies    | jsonb                       | yes      |                                               |
| strengths                 | ARRAY                       | yes      |                                               |
| weaknesses                | ARRAY                       | yes      |                                               |
| exploitable_matchups      | ARRAY                       | yes      |                                               |
| avg_points_per_game       | numeric                     | yes      |                                               |
| avg_yards_per_play        | numeric                     | yes      |                                               |
| turnover_rate             | numeric                     | yes      |                                               |
| scouting_notes            | text                        | yes      |                                               |
| game_plan_recommendations | text                        | yes      |                                               |
| season                    | character varying           | yes      |                                               |
| last_updated              | timestamp without time zone | yes      | now()                                         |
| created_at                | timestamp without time zone | yes      | now()                                         |

### `ownership_transitions`

RLS: enabled · rows: 0 · PK: id

| column          | type                     | nullable | default                      |
| --------------- | ------------------------ | -------- | ---------------------------- |
| id              | uuid                     | no       | gen_random_uuid()            |
| team_id         | uuid                     | no       |                              |
| from_owner_id   | uuid                     | no       |                              |
| to_owner_id     | uuid                     | no       |                              |
| transition_date | date                     | no       |                              |
| status          | character varying        | yes      | 'pending'::character varying |
| created_at      | timestamp with time zone | yes      | now()                        |

**Foreign keys:**

- `ownership_transitions.team_id` → `public.teams.id`
- `ownership_transitions.from_owner_id` → `auth.users.id`
- `ownership_transitions.to_owner_id` → `auth.users.id`

### `parent_guardian_links`

RLS: enabled · rows: 0 · PK: id

| column                | type                     | nullable | default                     |
| --------------------- | ------------------------ | -------- | --------------------------- |
| id                    | uuid                     | no       | gen_random_uuid()           |
| user_id               | uuid                     | no       |                             |
| parent_id             | uuid                     | no       |                             |
| relationship          | character varying        | yes      | 'parent'::character varying |
| is_primary            | boolean                  | yes      | false                       |
| can_view_training     | boolean                  | yes      | true                        |
| can_view_wellness     | boolean                  | yes      | true                        |
| can_view_nutrition    | boolean                  | yes      | false                       |
| can_communicate_coach | boolean                  | yes      | true                        |
| verified              | boolean                  | yes      | false                       |
| verified_at           | timestamp with time zone | yes      |                             |
| created_at            | timestamp with time zone | yes      | now()                       |
| updated_at            | timestamp with time zone | yes      | now()                       |

**Foreign keys:**

- `parent_guardian_links.parent_id` → `auth.users.id`
- `parent_guardian_links.user_id` → `auth.users.id`

### `parent_notifications`

RLS: enabled · rows: 0 · PK: id

| column            | type                     | nullable | default                     |
| ----------------- | ------------------------ | -------- | --------------------------- |
| id                | uuid                     | no       | gen_random_uuid()           |
| parent_id         | uuid                     | no       |                             |
| user_id           | uuid                     | no       |                             |
| notification_type | character varying        | no       |                             |
| title             | text                     | no       |                             |
| message           | text                     | yes      |                             |
| priority          | character varying        | yes      | 'normal'::character varying |
| is_read           | boolean                  | yes      | false                       |
| read_at           | timestamp with time zone | yes      |                             |
| metadata          | jsonb                    | yes      | '{}'::jsonb                 |
| created_at        | timestamp with time zone | yes      | now()                       |

**Foreign keys:**

- `parent_notifications.parent_id` → `auth.users.id`
- `parent_notifications.user_id` → `auth.users.id`

### `parental_consent`

RLS: enabled · rows: 0 · PK: id

| column               | type                     | nullable | default           |
| -------------------- | ------------------------ | -------- | ----------------- |
| id                   | uuid                     | no       | gen_random_uuid() |
| minor_user_id        | uuid                     | no       |                   |
| guardian_email       | text                     | yes      |                   |
| guardian_name        | text                     | yes      |                   |
| relationship         | text                     | yes      |                   |
| status               | text                     | no       | 'pending'::text   |
| consent_scope        | jsonb                    | no       | '{}'::jsonb       |
| verified_at          | timestamp with time zone | yes      |                   |
| expires_at           | timestamp with time zone | yes      |                   |
| created_at           | timestamp with time zone | no       | now()             |
| updated_at           | timestamp with time zone | no       | now()             |
| verification_token   | text                     | yes      |                   |
| verification_sent_at | timestamp with time zone | yes      |                   |

**Foreign keys:**

- `parental_consent.minor_user_id` → `auth.users.id`

### `passing_stats`

RLS: enabled · rows: 0 · PK: id

| column                 | type                        | nullable | default                                   |
| ---------------------- | --------------------------- | -------- | ----------------------------------------- |
| id                     | integer                     | no       | nextval('passing_stats_id_seq'::regclass) |
| game_event_id          | integer                     | yes      |                                           |
| game_id                | character varying           | no       |                                           |
| quarterback_id         | character varying           | no       |                                           |
| receiver_id            | character varying           | yes      |                                           |
| defender_id            | character varying           | yes      |                                           |
| throw_type             | character varying           | yes      |                                           |
| route_depth            | integer                     | yes      |                                           |
| target_location        | character varying           | yes      |                                           |
| throw_accuracy         | character varying           | yes      |                                           |
| intended_spot_accuracy | numeric                     | yes      |                                           |
| outcome                | character varying           | yes      |                                           |
| is_drop                | boolean                     | yes      | false                                     |
| drop_severity          | character varying           | yes      |                                           |
| drop_reason            | character varying           | yes      |                                           |
| qb_under_pressure      | boolean                     | yes      | false                                     |
| time_to_throw          | numeric                     | yes      |                                           |
| coverage_type          | character varying           | yes      |                                           |
| separation_at_catch    | numeric                     | yes      |                                           |
| throw_velocity         | integer                     | yes      |                                           |
| hang_time              | numeric                     | yes      |                                           |
| video_clip_url         | text                        | yes      |                                           |
| video_start_time       | numeric                     | yes      |                                           |
| video_end_time         | numeric                     | yes      |                                           |
| created_at             | timestamp without time zone | yes      | now()                                     |

**Foreign keys:**

- `passing_stats.game_event_id` → `public.game_events.id`

### `performance_records`

RLS: enabled · rows: 0 · PK: id

| column           | type                     | nullable | default           |
| ---------------- | ------------------------ | -------- | ----------------- |
| id               | uuid                     | no       | gen_random_uuid() |
| user_id          | uuid                     | no       |                   |
| sprint_10m       | numeric                  | yes      |                   |
| sprint_20m       | numeric                  | yes      |                   |
| dash_40          | numeric                  | yes      |                   |
| pro_agility      | numeric                  | yes      |                   |
| l_drill          | numeric                  | yes      |                   |
| reactive_agility | numeric                  | yes      |                   |
| vertical_jump    | numeric                  | yes      |                   |
| broad_jump       | numeric                  | yes      |                   |
| rsi              | numeric                  | yes      |                   |
| bench_press      | numeric                  | yes      |                   |
| back_squat       | numeric                  | yes      |                   |
| deadlift         | numeric                  | yes      |                   |
| body_weight      | numeric                  | yes      |                   |
| notes            | text                     | yes      |                   |
| overall_score    | numeric                  | yes      |                   |
| recorded_at      | timestamp with time zone | no       | now()             |
| created_at       | timestamp with time zone | no       | now()             |
| updated_at       | timestamp with time zone | no       | now()             |
| performance_day  | date                     | no       |                   |

**Foreign keys:**

- `performance_records.user_id` → `auth.users.id`

### `performance_tests`

RLS: enabled · rows: 0 · PK: id

| column       | type                     | nullable | default           |
| ------------ | ------------------------ | -------- | ----------------- |
| id           | uuid                     | no       | gen_random_uuid() |
| user_id      | uuid                     | no       |                   |
| test_type    | character varying        | no       |                   |
| result_value | numeric                  | no       |                   |
| target_value | numeric                  | yes      |                   |
| test_date    | timestamp with time zone | no       | now()             |
| conditions   | jsonb                    | yes      | '{}'::jsonb       |
| notes        | text                     | yes      |                   |
| created_at   | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `performance_tests.user_id` → `auth.users.id`

### `physical_measurements`

RLS: enabled · rows: 4 · PK: id

| column                  | type                     | nullable | default           |
| ----------------------- | ------------------------ | -------- | ----------------- |
| id                      | uuid                     | no       | gen_random_uuid() |
| user_id                 | uuid                     | no       |                   |
| weight                  | numeric                  | yes      |                   |
| height                  | numeric                  | yes      |                   |
| body_fat                | numeric                  | yes      |                   |
| muscle_mass             | numeric                  | yes      |                   |
| body_water_mass         | numeric                  | yes      |                   |
| fat_mass                | numeric                  | yes      |                   |
| protein_mass            | numeric                  | yes      |                   |
| bone_mineral_content    | numeric                  | yes      |                   |
| skeletal_muscle_mass    | numeric                  | yes      |                   |
| muscle_percentage       | numeric                  | yes      |                   |
| body_water_percentage   | numeric                  | yes      |                   |
| protein_percentage      | numeric                  | yes      |                   |
| bone_mineral_percentage | numeric                  | yes      |                   |
| visceral_fat_rating     | integer                  | yes      |                   |
| basal_metabolic_rate    | integer                  | yes      |                   |
| waist_to_hip_ratio      | numeric                  | yes      |                   |
| body_age                | integer                  | yes      |                   |
| notes                   | text                     | yes      |                   |
| created_at              | timestamp with time zone | yes      | now()             |
| updated_at              | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `physical_measurements.user_id` → `auth.users.id`

### `player_achievements`

RLS: enabled · rows: 0 · PK: id

| column         | type                     | nullable | default           |
| -------------- | ------------------------ | -------- | ----------------- |
| id             | uuid                     | no       | gen_random_uuid() |
| user_id        | uuid                     | no       |                   |
| achievement_id | uuid                     | no       |                   |
| earned_at      | timestamp with time zone | no       | now()             |
| context_data   | jsonb                    | no       | '{}'::jsonb       |
| created_at     | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `player_achievements.user_id` → `public.users.id`
- `player_achievements.achievement_id` → `public.achievement_definitions.id`

### `player_payments`

RLS: enabled · rows: 0 · PK: id

| column         | type                     | nullable | default                      |
| -------------- | ------------------------ | -------- | ---------------------------- |
| id             | uuid                     | no       | gen_random_uuid()            |
| user_id        | uuid                     | no       |                              |
| tournament_id  | uuid                     | no       |                              |
| team_id        | uuid                     | no       |                              |
| amount         | numeric                  | no       |                              |
| payment_date   | date                     | no       |                              |
| payment_method | character varying        | yes      |                              |
| transaction_id | character varying        | yes      |                              |
| status         | character varying        | yes      | 'pending'::character varying |
| notes          | text                     | yes      |                              |
| created_at     | timestamp with time zone | yes      | now()                        |
| updated_at     | timestamp with time zone | yes      | now()                        |

**Foreign keys:**

- `player_payments.team_id` → `public.teams.id`
- `player_payments.user_id` → `auth.users.id`

### `player_programs`

RLS: enabled · rows: 0 · PK: id

| column                | type                     | nullable | default                       |
| --------------------- | ------------------------ | -------- | ----------------------------- |
| id                    | uuid                     | no       | gen_random_uuid()             |
| program_id            | uuid                     | yes      |                               |
| assigned_by           | uuid                     | yes      |                               |
| start_date            | date                     | no       |                               |
| end_date              | date                     | yes      |                               |
| is_active             | boolean                  | yes      | true                          |
| compliance_rate       | numeric                  | yes      | 0.00                          |
| notes                 | text                     | yes      |                               |
| created_at            | timestamp with time zone | yes      | now()                         |
| updated_at            | timestamp with time zone | yes      | now()                         |
| user_id               | uuid                     | yes      |                               |
| assigned_position_id  | uuid                     | yes      |                               |
| status                | USER-DEFINED             | yes      | 'active'::program_status_enum |
| paused_reason         | text                     | yes      |                               |
| paused_at             | timestamp with time zone | yes      |                               |
| assigned_timezone     | character varying        | yes      | 'UTC'::character varying      |
| current_week          | integer                  | yes      | 1                             |
| current_phase_id      | uuid                     | yes      |                               |
| completion_percentage | numeric                  | yes      | 0                             |
| modifications         | jsonb                    | yes      | '{}'::jsonb                   |

**Foreign keys:**

- `player_programs.assigned_position_id` → `public.positions.id`
- `player_programs.assigned_by` → `auth.users.id`
- `player_programs.user_id` → `auth.users.id`
- `player_programs.program_id` → `public.training_programs.id`
- `player_programs.current_phase_id` → `public.training_phases.id`

### `player_streaks`

RLS: enabled · rows: 0 · PK: id

| column             | type                     | nullable | default           |
| ------------------ | ------------------------ | -------- | ----------------- |
| id                 | uuid                     | no       | gen_random_uuid() |
| user_id            | uuid                     | no       |                   |
| streak_type        | text                     | no       |                   |
| current_streak     | integer                  | no       | 0                 |
| longest_streak     | integer                  | no       | 0                 |
| last_activity_date | date                     | yes      |                   |
| created_at         | timestamp with time zone | no       | now()             |
| updated_at         | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `player_streaks.user_id` → `public.users.id`

### `player_training_stats`

RLS: enabled · rows: 0 · PK: user_id

| column                 | type                     | nullable | default |
| ---------------------- | ------------------------ | -------- | ------- |
| user_id                | uuid                     | no       |         |
| total_sessions         | integer                  | no       | 0       |
| total_exercises        | integer                  | no       | 0       |
| total_training_minutes | integer                  | no       | 0       |
| total_load_au          | numeric                  | no       | 0       |
| total_throws           | integer                  | no       | 0       |
| tournaments_completed  | integer                  | no       | 0       |
| total_achievements     | integer                  | no       | 0       |
| total_points           | integer                  | no       | 0       |
| created_at             | timestamp with time zone | no       | now()   |
| updated_at             | timestamp with time zone | no       | now()   |
| month_sessions         | integer                  | no       | 0       |
| month_load_au          | numeric                  | no       | 0       |
| current_month          | text                     | yes      |         |

**Foreign keys:**

- `player_training_stats.user_id` → `public.users.id`

### `plyometrics_exercises`

RLS: enabled · rows: 0 · PK: id

| column               | type                        | nullable | default                                           |
| -------------------- | --------------------------- | -------- | ------------------------------------------------- |
| id                   | integer                     | no       | nextval('plyometrics_exercises_id_seq'::regclass) |
| exercise_name        | character varying           | no       |                                                   |
| exercise_category    | character varying           | yes      |                                                   |
| target_muscles       | ARRAY                       | yes      |                                                   |
| equipment_needed     | ARRAY                       | yes      |                                                   |
| difficulty_level     | character varying           | yes      |                                                   |
| effectiveness_rating | integer                     | yes      |                                                   |
| injury_risk_rating   | integer                     | yes      |                                                   |
| instructions         | text                        | yes      |                                                   |
| variations           | ARRAY                       | yes      |                                                   |
| progressions         | ARRAY                       | yes      |                                                   |
| regressions          | ARRAY                       | yes      |                                                   |
| performance_metrics  | jsonb                       | yes      |                                                   |
| created_at           | timestamp without time zone | yes      | now()                                             |

### `position_specific_metrics`

RLS: enabled · rows: 0 · PK: id

| column         | type                     | nullable | default           |
| -------------- | ------------------------ | -------- | ----------------- |
| id             | uuid                     | no       | gen_random_uuid() |
| user_id        | uuid                     | yes      |                   |
| workout_log_id | uuid                     | yes      |                   |
| position_id    | uuid                     | yes      |                   |
| metric_name    | character varying        | no       |                   |
| metric_value   | numeric                  | no       |                   |
| metric_unit    | character varying        | yes      |                   |
| date           | date                     | no       |                   |
| weekly_total   | numeric                  | yes      |                   |
| monthly_total  | numeric                  | yes      |                   |
| notes          | text                     | yes      |                   |
| created_at     | timestamp with time zone | yes      | now()             |
| updated_at     | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `position_specific_metrics.user_id` → `auth.users.id`

### `positions`

RLS: enabled · rows: 0 · PK: id

| column       | type                     | nullable | default           |
| ------------ | ------------------------ | -------- | ----------------- |
| id           | uuid                     | no       | gen_random_uuid() |
| name         | character varying        | no       |                   |
| display_name | character varying        | no       |                   |
| description  | text                     | yes      |                   |
| created_at   | timestamp with time zone | yes      | now()             |
| updated_at   | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `player_programs.assigned_position_id` → `public.positions.id`
- `training_programs.position_id` → `public.positions.id`

### `post_bookmarks`

RLS: enabled · rows: 0 · PK: id

| column     | type                     | nullable | default           |
| ---------- | ------------------------ | -------- | ----------------- |
| id         | uuid                     | no       | gen_random_uuid() |
| post_id    | uuid                     | no       |                   |
| user_id    | uuid                     | no       |                   |
| created_at | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `post_bookmarks.post_id` → `public.posts.id`
- `post_bookmarks.user_id` → `public.users.id`

### `post_comments`

RLS: enabled · rows: 0 · PK: id

| column      | type                     | nullable | default           |
| ----------- | ------------------------ | -------- | ----------------- |
| id          | uuid                     | no       | gen_random_uuid() |
| post_id     | uuid                     | no       |                   |
| user_id     | uuid                     | no       |                   |
| content     | text                     | no       |                   |
| likes_count | integer                  | no       | 0                 |
| created_at  | timestamp with time zone | no       | now()             |
| updated_at  | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `post_comments.post_id` → `public.posts.id`
- `comment_likes.comment_id` → `public.post_comments.id`
- `post_comments.user_id` → `public.users.id`

### `post_likes`

RLS: enabled · rows: 0 · PK: id

| column     | type                     | nullable | default           |
| ---------- | ------------------------ | -------- | ----------------- |
| id         | uuid                     | no       | gen_random_uuid() |
| post_id    | uuid                     | no       |                   |
| user_id    | uuid                     | no       |                   |
| created_at | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `post_likes.user_id` → `public.users.id`
- `post_likes.post_id` → `public.posts.id`

### `posts`

RLS: enabled · rows: 0 · PK: id

| column         | type                     | nullable | default           |
| -------------- | ------------------------ | -------- | ----------------- |
| id             | uuid                     | no       | gen_random_uuid() |
| user_id        | uuid                     | no       |                   |
| team_id        | uuid                     | yes      |                   |
| title          | text                     | yes      |                   |
| content        | text                     | no       |                   |
| post_type      | text                     | no       | 'general'::text   |
| location       | text                     | yes      |                   |
| media_url      | text                     | yes      |                   |
| media_type     | text                     | yes      |                   |
| likes_count    | integer                  | no       | 0                 |
| comments_count | integer                  | no       | 0                 |
| shares_count   | integer                  | no       | 0                 |
| is_published   | boolean                  | no       | true              |
| created_at     | timestamp with time zone | no       | now()             |
| updated_at     | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `posts.user_id` → `public.users.id`
- `posts.team_id` → `public.teams.id`
- `community_polls.post_id` → `public.posts.id`
- `post_comments.post_id` → `public.posts.id`
- `post_bookmarks.post_id` → `public.posts.id`
- `post_likes.post_id` → `public.posts.id`

### `practice_plans`

RLS: enabled · rows: 0 · PK: id

| column           | type                     | nullable | default                                             |
| ---------------- | ------------------------ | -------- | --------------------------------------------------- |
| id               | uuid                     | no       | gen_random_uuid()                                   |
| team_id          | uuid                     | no       |                                                     |
| created_by       | uuid                     | no       |                                                     |
| title            | text                     | no       |                                                     |
| practice_date    | date                     | no       |                                                     |
| start_time       | text                     | no       |                                                     |
| end_time         | text                     | no       |                                                     |
| duration_minutes | integer                  | no       | 0                                                   |
| location         | text                     | no       |                                                     |
| focus            | text                     | yes      |                                                     |
| equipment        | jsonb                    | no       | '[]'::jsonb                                         |
| activities       | jsonb                    | no       | '[]'::jsonb                                         |
| coach_notes      | text                     | yes      |                                                     |
| attendance       | jsonb                    | no       | '{"total": 0, "pending": 0, "confirmed": 0}'::jsonb |
| status           | text                     | no       | 'scheduled'::text                                   |
| created_at       | timestamp with time zone | no       | now()                                               |
| updated_at       | timestamp with time zone | no       | now()                                               |

**Foreign keys:**

- `practice_plans.team_id` → `public.teams.id`

### `prescription_audit_log`

RLS: enabled · rows: 0 · PK: id

| column              | type                     | nullable | default           |
| ------------------- | ------------------------ | -------- | ----------------- |
| id                  | uuid                     | no       | gen_random_uuid() |
| daily_protocol_id   | uuid                     | yes      |                   |
| athlete_id          | uuid                     | no       |                   |
| exercise_slug       | text                     | yes      |                   |
| field_changed       | text                     | no       |                   |
| original_value      | text                     | yes      |                   |
| modified_value      | text                     | yes      |                   |
| modification_reason | text                     | no       |                   |
| modified_by         | text                     | no       |                   |
| created_at          | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `prescription_audit_log.athlete_id` → `public.users.id`
- `prescription_audit_log.daily_protocol_id` → `public.daily_protocols.id`

### `prescription_templates`

RLS: enabled · rows: 41 · PK: id

| column                  | type                     | nullable | default           |
| ----------------------- | ------------------------ | -------- | ----------------- |
| id                      | uuid                     | no       | gen_random_uuid() |
| modality                | text                     | no       |                   |
| intensity_zone          | text                     | yes      |                   |
| position_group          | text                     | yes      |                   |
| periodization_phase     | text                     | yes      |                   |
| prescribed_sets         | integer                  | yes      |                   |
| prescribed_reps         | integer                  | yes      |                   |
| prescribed_hold_seconds | integer                  | yes      |                   |
| prescribed_distance_m   | integer                  | yes      |                   |
| prescribed_duration_s   | integer                  | yes      |                   |
| rest_seconds            | integer                  | yes      |                   |
| load_contribution_au    | numeric                  | no       |                   |
| methodology_citation    | text                     | no       |                   |
| notes                   | text                     | yes      |                   |
| is_active               | boolean                  | no       | true              |
| created_at              | timestamp with time zone | no       | now()             |
| updated_at              | timestamp with time zone | no       | now()             |

### `privacy_audit_log`

RLS: enabled · rows: 0 · PK: id

| column         | type                     | nullable | default           |
| -------------- | ------------------------ | -------- | ----------------- |
| id             | uuid                     | no       | gen_random_uuid() |
| user_id        | uuid                     | yes      |                   |
| action         | text                     | no       |                   |
| affected_table | text                     | yes      |                   |
| affected_data  | jsonb                    | no       | '{}'::jsonb       |
| actor_user_id  | uuid                     | yes      |                   |
| created_at     | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `privacy_audit_log.user_id` → `auth.users.id`

### `privacy_settings`

RLS: enabled · rows: 3 · PK: user_id

| column                      | type                     | nullable | default |
| --------------------------- | ------------------------ | -------- | ------- |
| user_id                     | uuid                     | no       |         |
| performance_sharing_default | boolean                  | no       | false   |
| health_sharing_default      | boolean                  | no       | false   |
| ai_processing_enabled       | boolean                  | no       | false   |
| ai_processing_consent_date  | timestamp with time zone | yes      |         |
| created_at                  | timestamp with time zone | no       | now()   |
| updated_at                  | timestamp with time zone | no       | now()   |

**Foreign keys:**

- `privacy_settings.user_id` → `auth.users.id`

### `proactive_checkins`

RLS: enabled · rows: 0 · PK: id

| column        | type                     | nullable | default           |
| ------------- | ------------------------ | -------- | ----------------- |
| id            | uuid                     | no       | gen_random_uuid() |
| user_id       | uuid                     | no       |                   |
| checkin_type  | text                     | yes      |                   |
| message       | text                     | yes      |                   |
| status        | text                     | no       | 'pending'::text   |
| scheduled_for | timestamp with time zone | yes      |                   |
| engaged_at    | timestamp with time zone | yes      |                   |
| created_at    | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `proactive_checkins.user_id` → `public.users.id`

### `program_assignments`

RLS: enabled · rows: 0 · PK: id

| column      | type                     | nullable | default                     |
| ----------- | ------------------------ | -------- | --------------------------- |
| id          | uuid                     | no       | gen_random_uuid()           |
| program_id  | uuid                     | no       |                             |
| user_id     | uuid                     | no       |                             |
| assigned_by | uuid                     | no       |                             |
| assigned_at | timestamp with time zone | no       | now()                       |
| active_from | date                     | no       |                             |
| active_to   | date                     | yes      |                             |
| status      | character varying        | no       | 'active'::character varying |
| created_at  | timestamp with time zone | no       | now()                       |
| updated_at  | timestamp with time zone | no       | now()                       |

**Foreign keys:**

- `program_assignments.user_id` → `auth.users.id`
- `program_assignments.assigned_by` → `auth.users.id`

### `protocol_exercises`

RLS: enabled · rows: 232 · PK: id

| column                      | type                     | nullable | default           |
| --------------------------- | ------------------------ | -------- | ----------------- |
| id                          | uuid                     | no       | gen_random_uuid() |
| protocol_id                 | uuid                     | no       |                   |
| exercise_id                 | uuid                     | no       |                   |
| block_type                  | text                     | no       |                   |
| sequence_order              | integer                  | no       |                   |
| prescribed_sets             | integer                  | yes      |                   |
| prescribed_reps             | integer                  | yes      |                   |
| prescribed_hold_seconds     | integer                  | yes      |                   |
| prescribed_duration_seconds | integer                  | yes      |                   |
| prescribed_weight_kg        | numeric                  | yes      |                   |
| yesterday_sets              | integer                  | yes      |                   |
| yesterday_reps              | integer                  | yes      |                   |
| yesterday_hold_seconds      | integer                  | yes      |                   |
| progression_note            | text                     | yes      |                   |
| ai_note                     | text                     | yes      |                   |
| status                      | text                     | yes      | 'pending'::text   |
| completed_at                | timestamp with time zone | yes      |                   |
| actual_sets                 | integer                  | yes      |                   |
| actual_reps                 | integer                  | yes      |                   |
| actual_hold_seconds         | integer                  | yes      |                   |
| actual_duration_seconds     | integer                  | yes      |                   |
| actual_weight_kg            | numeric                  | yes      |                   |
| load_contribution_au        | integer                  | yes      | 0                 |
| created_at                  | timestamp with time zone | yes      | now()             |
| updated_at                  | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `protocol_exercises.exercise_id` → `public.exercises.id`
- `protocol_exercises.protocol_id` → `public.daily_protocols.id`

### `protocol_generation_requests`

RLS: enabled · rows: 27 · PK: id

| column          | type                     | nullable | default           |
| --------------- | ------------------------ | -------- | ----------------- |
| id              | uuid                     | no       | gen_random_uuid() |
| user_id         | uuid                     | no       |                   |
| protocol_date   | date                     | no       |                   |
| idempotency_key | text                     | no       |                   |
| status          | text                     | no       | 'pending'::text   |
| protocol_id     | uuid                     | yes      |                   |
| error           | text                     | yes      |                   |
| created_at      | timestamp with time zone | no       | now()             |
| updated_at      | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `protocol_generation_requests.user_id` → `auth.users.id`
- `protocol_generation_requests.protocol_id` → `public.daily_protocols.id`

### `psychological_assessments`

RLS: enabled · rows: 1 · PK: id

| column                       | type                     | nullable | default           |
| ---------------------------- | ------------------------ | -------- | ----------------- |
| id                           | uuid                     | no       | gen_random_uuid() |
| user_id                      | uuid                     | no       |                   |
| coach_id                     | uuid                     | yes      |                   |
| assessment_type              | text                     | yes      |                   |
| questions                    | jsonb                    | yes      |                   |
| responses                    | jsonb                    | yes      |                   |
| score                        | integer                  | yes      |                   |
| interpretation               | text                     | yes      |                   |
| recommendations              | jsonb                    | yes      |                   |
| requires_professional_review | boolean                  | no       | false             |
| completed_at                 | timestamp with time zone | yes      |                   |
| created_at                   | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `psychological_assessments.coach_id` → `auth.users.id`
- `psychological_assessments.user_id` → `auth.users.id`

### `push_subscriptions`

RLS: enabled · rows: 0 · PK: id

| column     | type                     | nullable | default           |
| ---------- | ------------------------ | -------- | ----------------- |
| id         | uuid                     | no       | gen_random_uuid() |
| user_id    | uuid                     | no       |                   |
| endpoint   | text                     | no       |                   |
| p256dh_key | text                     | no       |                   |
| auth_key   | text                     | no       |                   |
| user_agent | text                     | yes      |                   |
| created_at | timestamp with time zone | yes      | now()             |
| updated_at | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `push_subscriptions.user_id` → `auth.users.id`

### `qb_throwing_sessions`

RLS: enabled · rows: 0 · PK: id

| column                      | type                     | nullable | default           |
| --------------------------- | ------------------------ | -------- | ----------------- |
| id                          | uuid                     | no       | gen_random_uuid() |
| user_id                     | uuid                     | no       |                   |
| session_date                | date                     | no       |                   |
| session_type                | text                     | no       |                   |
| total_throws                | integer                  | no       | 0                 |
| short_throws                | integer                  | no       | 0                 |
| medium_throws               | integer                  | no       | 0                 |
| long_throws                 | integer                  | no       | 0                 |
| location                    | text                     | yes      |                   |
| arm_feeling_before          | integer                  | yes      |                   |
| arm_feeling_after           | integer                  | yes      |                   |
| pre_throwing_warmup_done    | boolean                  | no       | false             |
| post_throwing_arm_care_done | boolean                  | no       | false             |
| ice_applied                 | boolean                  | no       | false             |
| warmup_duration_minutes     | integer                  | yes      |                   |
| throwing_duration_minutes   | integer                  | yes      |                   |
| arm_care_duration_minutes   | integer                  | yes      |                   |
| notes                       | text                     | yes      |                   |
| mechanics_focus             | text                     | yes      |                   |
| fatigue_level               | integer                  | yes      |                   |
| created_at                  | timestamp with time zone | no       | now()             |
| updated_at                  | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `qb_throwing_sessions.user_id` → `public.users.id`

### `readiness_gates`

RLS: enabled · rows: 4 · PK: id

| column               | type    | nullable | default           |
| -------------------- | ------- | -------- | ----------------- |
| id                   | uuid    | no       | gen_random_uuid() |
| context              | text    | no       |                   |
| threshold_low        | integer | no       |                   |
| threshold_mid        | integer | yes      |                   |
| threshold_high       | integer | yes      |                   |
| action_low           | text    | no       |                   |
| action_mid           | text    | yes      |                   |
| action_high          | text    | yes      |                   |
| methodology_citation | text    | no       |                   |
| is_active            | boolean | no       | true              |

### `readiness_scores`

RLS: enabled · rows: 13 · PK: id

| column          | type                     | nullable | default           |
| --------------- | ------------------------ | -------- | ----------------- |
| id              | uuid                     | no       | gen_random_uuid() |
| sleep_score     | numeric                  | yes      |                   |
| acwr            | numeric                  | yes      |                   |
| created_at      | timestamp with time zone | yes      | now()             |
| updated_at      | timestamp with time zone | yes      | now()             |
| user_id         | uuid                     | no       |                   |
| day             | date                     | no       |                   |
| score           | numeric                  | yes      |                   |
| level           | text                     | yes      |                   |
| suggestion      | text                     | yes      |                   |
| acute_load      | numeric                  | yes      |                   |
| chronic_load    | numeric                  | yes      |                   |
| workload_score  | numeric                  | yes      |                   |
| proximity_score | numeric                  | yes      |                   |

**Foreign keys:**

- `readiness_scores.user_id` → `public.users.id`

### `receiving_stats`

RLS: enabled · rows: 0 · PK: id

| column              | type                        | nullable | default                                     |
| ------------------- | --------------------------- | -------- | ------------------------------------------- |
| id                  | integer                     | no       | nextval('receiving_stats_id_seq'::regclass) |
| game_event_id       | integer                     | yes      |                                             |
| game_id             | character varying           | no       |                                             |
| receiver_id         | character varying           | no       |                                             |
| quarterback_id      | character varying           | yes      |                                             |
| target_number       | integer                     | yes      |                                             |
| route_type          | character varying           | yes      |                                             |
| route_depth         | integer                     | yes      |                                             |
| is_target           | boolean                     | yes      | true                                        |
| is_catch            | boolean                     | yes      | false                                       |
| is_drop             | boolean                     | yes      | false                                       |
| drop_severity       | character varying           | yes      |                                             |
| yards_gained        | integer                     | yes      |                                             |
| yards_after_catch   | integer                     | yes      |                                             |
| is_touchdown        | boolean                     | yes      | false                                       |
| separation_at_catch | numeric                     | yes      |                                             |
| coverage_type       | character varying           | yes      |                                             |
| defender_id         | character varying           | yes      |                                             |
| contested_catch     | boolean                     | yes      | false                                       |
| video_clip_url      | text                        | yes      |                                             |
| created_at          | timestamp without time zone | yes      | now()                                       |

**Foreign keys:**

- `receiving_stats.game_event_id` → `public.game_events.id`

### `recovery_blocks`

RLS: enabled · rows: 1 · PK: id

| column           | type                     | nullable | default           |
| ---------------- | ------------------------ | -------- | ----------------- |
| id               | uuid                     | no       | gen_random_uuid() |
| user_id          | uuid                     | no       |                   |
| block_start_date | date                     | no       |                   |
| block_end_date   | date                     | no       |                   |
| block_type       | character varying        | yes      |                   |
| reason           | text                     | yes      |                   |
| created_at       | timestamp with time zone | yes      | now()             |
| max_load_percent | integer                  | yes      |                   |
| focus            | text                     | yes      |                   |
| restrictions     | jsonb                    | yes      |                   |

**Foreign keys:**

- `recovery_blocks.user_id` → `auth.users.id`

### `recovery_protocols`

RLS: enabled · rows: 0 · PK: id

| column               | type                     | nullable | default           |
| -------------------- | ------------------------ | -------- | ----------------- |
| id                   | uuid                     | no       | gen_random_uuid() |
| name                 | text                     | no       |                   |
| description          | text                     | yes      |                   |
| category             | text                     | yes      |                   |
| duration_minutes     | integer                  | yes      |                   |
| instructions         | jsonb                    | yes      |                   |
| target_areas         | ARRAY                    | yes      |                   |
| equipment_needed     | ARRAY                    | yes      |                   |
| effectiveness_rating | numeric                  | yes      |                   |
| is_active            | boolean                  | yes      | true              |
| created_at           | timestamp with time zone | yes      | now()             |
| updated_at           | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `recovery_sessions.protocol_id` → `public.recovery_protocols.id`

### `recovery_sessions`

RLS: enabled · rows: 0 · PK: id

| column                  | type                     | nullable | default             |
| ----------------------- | ------------------------ | -------- | ------------------- |
| id                      | uuid                     | no       | gen_random_uuid()   |
| user_id                 | uuid                     | no       |                     |
| protocol_id             | uuid                     | yes      |                     |
| started_at              | timestamp with time zone | yes      | now()               |
| completed_at            | timestamp with time zone | yes      |                     |
| status                  | text                     | yes      | 'in_progress'::text |
| duration_actual_minutes | integer                  | yes      |                     |
| notes                   | text                     | yes      |                     |
| effectiveness_rating    | integer                  | yes      |                     |
| created_at              | timestamp with time zone | yes      | now()               |
| updated_at              | timestamp with time zone | yes      | now()               |

**Foreign keys:**

- `recovery_sessions.user_id` → `auth.users.id`
- `recovery_sessions.protocol_id` → `public.recovery_protocols.id`

### `research_articles`

RLS: enabled · rows: 0 · PK: id

| column                   | type                        | nullable | default           |
| ------------------------ | --------------------------- | -------- | ----------------- |
| id                       | uuid                        | no       | gen_random_uuid() |
| title                    | text                        | no       |                   |
| authors                  | ARRAY                       | yes      |                   |
| publication_year         | integer                     | yes      |                   |
| journal                  | character varying           | yes      |                   |
| publisher                | character varying           | yes      |                   |
| doi                      | character varying           | yes      |                   |
| pubmed_id                | character varying           | yes      |                   |
| pmc_id                   | character varying           | yes      |                   |
| arxiv_id                 | character varying           | yes      |                   |
| semantic_scholar_id      | character varying           | yes      |                   |
| abstract                 | text                        | yes      |                   |
| full_text                | text                        | yes      |                   |
| full_text_url            | text                        | yes      |                   |
| pdf_url                  | text                        | yes      |                   |
| primary_category         | character varying           | yes      |                   |
| categories               | ARRAY                       | yes      |                   |
| tags                     | ARRAY                       | yes      |                   |
| study_type               | character varying           | yes      |                   |
| evidence_level           | character varying           | yes      |                   |
| sample_size              | integer                     | yes      |                   |
| population_type          | character varying           | yes      |                   |
| sport_type               | character varying           | yes      |                   |
| key_findings             | text                        | yes      |                   |
| methodology              | text                        | yes      |                   |
| results_summary          | text                        | yes      |                   |
| conclusions              | text                        | yes      |                   |
| practical_applications   | ARRAY                       | yes      |                   |
| injury_types             | ARRAY                       | yes      |                   |
| supplement_types         | ARRAY                       | yes      |                   |
| recovery_methods         | ARRAY                       | yes      |                   |
| training_types           | ARRAY                       | yes      |                   |
| psychological_topics     | ARRAY                       | yes      |                   |
| food_sources             | jsonb                       | yes      |                   |
| absorption_tips          | ARRAY                       | yes      |                   |
| supplement_guidance      | jsonb                       | yes      |                   |
| safety_warnings          | ARRAY                       | yes      |                   |
| sauna_protocols          | jsonb                       | yes      |                   |
| cold_therapy_protocols   | jsonb                       | yes      |                   |
| massage_gun_protocols    | jsonb                       | yes      |                   |
| training_protocols       | jsonb                       | yes      |                   |
| periodization_phases     | ARRAY                       | yes      |                   |
| psychological_techniques | ARRAY                       | yes      |                   |
| mental_training_methods  | ARRAY                       | yes      |                   |
| citation_count           | integer                     | yes      | 0                 |
| altmetric_score          | numeric                     | yes      |                   |
| impact_factor            | numeric                     | yes      |                   |
| source_type              | character varying           | yes      |                   |
| is_open_access           | boolean                     | yes      | true              |
| license_type             | character varying           | yes      |                   |
| verified                 | boolean                     | yes      | false             |
| verified_by              | character varying           | yes      |                   |
| verification_date        | timestamp without time zone | yes      |                   |
| quality_score            | integer                     | yes      |                   |
| integrated_into_chatbot  | boolean                     | yes      | false             |
| chatbot_usage_count      | integer                     | yes      | 0                 |
| last_used_at             | timestamp without time zone | yes      |                   |
| keywords                 | ARRAY                       | yes      |                   |
| mesh_terms               | ARRAY                       | yes      |                   |
| created_at               | timestamp without time zone | yes      | now()             |
| updated_at               | timestamp without time zone | yes      | now()             |

### `return_to_play_protocols`

RLS: enabled · rows: 1 · PK: id

| column                    | type                     | nullable | default           |
| ------------------------- | ------------------------ | -------- | ----------------- |
| id                        | uuid                     | no       | gen_random_uuid() |
| user_id                   | uuid                     | no       |                   |
| status                    | text                     | no       | 'active'::text    |
| current_phase             | integer                  | no       | 1                 |
| phase_description         | text                     | yes      |                   |
| start_date                | date                     | no       | CURRENT_DATE      |
| estimated_completion_date | date                     | yes      |                   |
| created_at                | timestamp with time zone | no       | now()             |
| updated_at                | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `return_to_play_protocols.user_id` → `auth.users.id`
- `rtp_prescription_approvals.return_to_play_id` → `public.return_to_play_protocols.id`

### `role_change_audit`

RLS: enabled · rows: 0 · PK: id

| column        | type                     | nullable | default                                       |
| ------------- | ------------------------ | -------- | --------------------------------------------- |
| id            | bigint                   | no       | nextval('role_change_audit_id_seq'::regclass) |
| user_id       | uuid                     | no       |                                               |
| old_role      | text                     | yes      |                                               |
| new_role      | text                     | no       |                                               |
| changed_by    | uuid                     | yes      |                                               |
| changed_at    | timestamp with time zone | yes      | now()                                         |
| change_reason | text                     | yes      |                                               |
| ip_address    | inet                     | yes      |                                               |
| user_agent    | text                     | yes      |                                               |

**Foreign keys:**

- `role_change_audit.changed_by` → `auth.users.id`
- `role_change_audit.user_id` → `auth.users.id`

### `roster_audit_log`

RLS: enabled · rows: 0 · PK: id

| column       | type                     | nullable | default           |
| ------------ | ------------------------ | -------- | ----------------- |
| id           | uuid                     | no       | gen_random_uuid() |
| team_id      | uuid                     | no       |                   |
| action       | character varying        | no       |                   |
| user_id      | uuid                     | yes      |                   |
| performed_by | uuid                     | no       |                   |
| old_values   | jsonb                    | yes      |                   |
| new_values   | jsonb                    | yes      |                   |
| reason       | text                     | yes      |                   |
| created_at   | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `roster_audit_log.performed_by` → `auth.users.id`
- `roster_audit_log.team_id` → `public.teams.id`
- `roster_audit_log.user_id` → `auth.users.id`

### `rtp_prescription_approvals`

RLS: enabled · rows: 0 · PK: id

| column            | type                     | nullable | default           |
| ----------------- | ------------------------ | -------- | ----------------- |
| id                | uuid                     | no       | gen_random_uuid() |
| return_to_play_id | uuid                     | yes      |                   |
| daily_protocol_id | uuid                     | yes      |                   |
| athlete_id        | uuid                     | no       |                   |
| rtp_phase         | integer                  | yes      |                   |
| trigger           | text                     | no       |                   |
| status            | text                     | no       | 'pending'::text   |
| approved_by       | uuid                     | yes      |                   |
| reviewed_at       | timestamp with time zone | yes      |                   |
| coach_notes       | text                     | yes      |                   |
| created_at        | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `rtp_prescription_approvals.return_to_play_id` → `public.return_to_play_protocols.id`
- `rtp_prescription_approvals.daily_protocol_id` → `public.daily_protocols.id`
- `rtp_prescription_approvals.athlete_id` → `public.users.id`
- `rtp_prescription_approvals.approved_by` → `public.users.id`

### `safety_override_log`

RLS: enabled · rows: 11 · PK: override_id

| column                | type                     | nullable | default           |
| --------------------- | ------------------------ | -------- | ----------------- |
| override_id           | uuid                     | no       | gen_random_uuid() |
| user_id               | uuid                     | no       |                   |
| trigger_type          | text                     | no       |                   |
| trigger_value         | jsonb                    | no       |                   |
| data_disclosed        | jsonb                    | no       |                   |
| disclosed_to_roles    | ARRAY                    | no       |                   |
| disclosed_to_user_ids | ARRAY                    | no       |                   |
| override_timestamp    | timestamp with time zone | no       | now()             |
| athlete_notified      | boolean                  | yes      | false             |
| athlete_notified_at   | timestamp with time zone | yes      |                   |

**Foreign keys:**

- `safety_override_log.user_id` → `auth.users.id`

### `season_archives`

RLS: enabled · rows: 0 · PK: id

| column      | type                     | nullable | default           |
| ----------- | ------------------------ | -------- | ----------------- |
| id          | uuid                     | no       | gen_random_uuid() |
| season_id   | uuid                     | no       |                   |
| archived_at | timestamp with time zone | no       | now()             |
| metadata    | jsonb                    | no       | '{}'::jsonb       |

### `session_exercises`

RLS: enabled · rows: 0 · PK: id

| column                   | type                     | nullable | default           |
| ------------------------ | ------------------------ | -------- | ----------------- |
| id                       | uuid                     | no       | gen_random_uuid() |
| session_id               | uuid                     | yes      |                   |
| exercise_id              | uuid                     | yes      |                   |
| exercise_order           | integer                  | no       |                   |
| sets                     | integer                  | yes      |                   |
| reps                     | text                     | yes      |                   |
| weight                   | numeric                  | yes      |                   |
| duration_minutes         | integer                  | yes      |                   |
| distance                 | integer                  | yes      |                   |
| rest_seconds             | integer                  | yes      |                   |
| notes                    | text                     | yes      |                   |
| position_specific_params | jsonb                    | yes      |                   |
| created_at               | timestamp with time zone | yes      | now()             |
| updated_at               | timestamp with time zone | yes      | now()             |
| session_template_id      | uuid                     | yes      |                   |
| exercise_name            | text                     | yes      |                   |
| load_type                | character varying        | yes      |                   |
| load_value               | numeric                  | yes      |                   |
| duration_seconds         | integer                  | yes      |                   |
| distance_meters          | integer                  | yes      |                   |
| load_description         | text                     | yes      |                   |
| load_percentage          | numeric                  | yes      |                   |
| tempo                    | text                     | yes      |                   |
| intensity                | text                     | yes      |                   |

**Foreign keys:**

- `session_exercises.exercise_id` → `public.exercises.id`
- `session_exercises.session_template_id` → `public.training_session_templates.id`
- `session_exercises.session_id` → `public.training_sessions.id`

### `session_version_history`

RLS: enabled · rows: 0 · PK: version_id

| column               | type                     | nullable | default           |
| -------------------- | ------------------------ | -------- | ----------------- |
| version_id           | uuid                     | no       | gen_random_uuid() |
| session_id           | uuid                     | no       |                   |
| version_number       | integer                  | no       |                   |
| session_structure    | jsonb                    | no       |                   |
| modified_by_coach_id | uuid                     | yes      |                   |
| modified_at          | timestamp with time zone | no       | now()             |
| modification_reason  | text                     | yes      |                   |
| visible_to_athlete   | boolean                  | yes      | false             |
| athlete_viewed_at    | timestamp with time zone | yes      |                   |
| created_at           | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `session_version_history.modified_by_coach_id` → `auth.users.id`
- `session_version_history.session_id` → `public.training_sessions.id`

### `shared_insights`

RLS: enabled · rows: 0 · PK: id

| column       | type                     | nullable | default           |
| ------------ | ------------------------ | -------- | ----------------- |
| id           | uuid                     | no       | gen_random_uuid() |
| shared_by    | uuid                     | no       |                   |
| shared_with  | uuid                     | no       |                   |
| insight_type | character varying        | no       |                   |
| insight_data | jsonb                    | no       | '{}'::jsonb       |
| shared_at    | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `shared_insights.shared_by` → `auth.users.id`
- `shared_insights.shared_with` → `auth.users.id`

### `situational_stats`

RLS: enabled · rows: 0 · PK: id

| column         | type                        | nullable | default                                       |
| -------------- | --------------------------- | -------- | --------------------------------------------- |
| id             | integer                     | no       | nextval('situational_stats_id_seq'::regclass) |
| user_id        | character varying           | no       |                                               |
| situation_type | character varying           | yes      |                                               |
| attempts       | integer                     | yes      | 0                                             |
| successes      | integer                     | yes      | 0                                             |
| success_rate   | numeric                     | yes      |                                               |
| avg_yards      | numeric                     | yes      |                                               |
| touchdowns     | integer                     | yes      | 0                                             |
| turnovers      | integer                     | yes      | 0                                             |
| season         | character varying           | yes      |                                               |
| date_start     | date                        | yes      |                                               |
| date_end       | date                        | yes      |                                               |
| created_at     | timestamp without time zone | yes      | now()                                         |
| updated_at     | timestamp without time zone | yes      | now()                                         |

### `sponsors`

RLS: enabled · rows: 0 · PK: id

| column        | type                     | nullable | default                              |
| ------------- | ------------------------ | -------- | ------------------------------------ |
| id            | integer                  | no       | nextval('sponsors_id_seq'::regclass) |
| name          | character varying        | no       |                                      |
| logo_url      | text                     | no       |                                      |
| website_url   | text                     | yes      |                                      |
| display_order | integer                  | yes      | 0                                    |
| is_active     | boolean                  | yes      | true                                 |
| created_at    | timestamp with time zone | yes      | now()                                |
| updated_at    | timestamp with time zone | yes      | now()                                |

### `staff_roles`

RLS: enabled · rows: 0 · PK: id

| column               | type                     | nullable | default |
| -------------------- | ------------------------ | -------- | ------- |
| id                   | character varying        | no       |         |
| display_name         | character varying        | no       |         |
| category             | character varying        | no       |         |
| can_manage_roster    | boolean                  | yes      | false   |
| can_delete_players   | boolean                  | yes      | false   |
| can_view_health_data | boolean                  | yes      | false   |
| sort_order           | integer                  | yes      | 100     |
| created_at           | timestamp with time zone | yes      | now()   |

### `state_transition_history`

RLS: enabled · rows: 0 · PK: id

| column          | type                     | nullable | default           |
| --------------- | ------------------------ | -------- | ----------------- |
| id              | uuid                     | no       | gen_random_uuid() |
| session_id      | uuid                     | no       |                   |
| from_state      | text                     | yes      |                   |
| to_state        | text                     | no       |                   |
| actor_role      | text                     | no       | 'system'::text    |
| actor_id        | uuid                     | yes      |                   |
| transitioned_at | timestamp with time zone | no       | now()             |
| reason          | text                     | yes      |                   |
| metadata        | jsonb                    | yes      |                   |

**Foreign keys:**

- `state_transition_history.actor_id` → `auth.users.id`
- `state_transition_history.session_id` → `public.training_sessions.id`

### `superadmins`

RLS: enabled · rows: 0 · PK: id

| column     | type                     | nullable | default           |
| ---------- | ------------------------ | -------- | ----------------- |
| id         | uuid                     | no       | gen_random_uuid() |
| user_id    | uuid                     | no       |                   |
| granted_by | uuid                     | yes      |                   |
| granted_at | timestamp with time zone | yes      | now()             |
| is_active  | boolean                  | yes      | true              |
| notes      | text                     | yes      |                   |

**Foreign keys:**

- `superadmins.user_id` → `auth.users.id`
- `superadmins.granted_by` → `auth.users.id`

### `supplement_logs`

RLS: enabled · rows: 23 · PK: id

| column          | type                     | nullable | default           |
| --------------- | ------------------------ | -------- | ----------------- |
| id              | uuid                     | no       | gen_random_uuid() |
| user_id         | uuid                     | no       |                   |
| supplement_name | character varying        | no       |                   |
| dosage          | character varying        | yes      |                   |
| taken           | boolean                  | no       | false             |
| date            | date                     | no       | CURRENT_DATE      |
| time_of_day     | character varying        | yes      |                   |
| notes           | text                     | yes      |                   |
| created_at      | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `supplement_logs.user_id` → `auth.users.id`

### `taper_rules`

RLS: enabled · rows: 5 · PK: id

| column               | type    | nullable | default           |
| -------------------- | ------- | -------- | ----------------- |
| id                   | uuid    | no       | gen_random_uuid() |
| tournament_level     | text    | no       |                   |
| taper_days           | integer | no       |                   |
| volume_reduction_pct | numeric | no       |                   |
| volume_floor_pct     | numeric | no       |                   |
| intensity_retention  | numeric | no       |                   |
| methodology_citation | text    | no       |                   |
| is_active            | boolean | no       | true              |

### `team_activities`

RLS: enabled · rows: 0 · PK: id

| column              | type                     | nullable | default           |
| ------------------- | ------------------------ | -------- | ----------------- |
| id                  | uuid                     | no       | gen_random_uuid() |
| team_id             | uuid                     | no       |                   |
| date                | date                     | no       |                   |
| type                | text                     | no       |                   |
| start_time_local    | text                     | yes      |                   |
| end_time_local      | text                     | yes      |                   |
| location            | text                     | yes      |                   |
| note                | text                     | yes      |                   |
| replaces_session    | boolean                  | no       | false             |
| weather_override    | jsonb                    | yes      |                   |
| created_by_coach_id | uuid                     | yes      |                   |
| created_at          | timestamp with time zone | no       | now()             |
| updated_at          | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `team_activities.team_id` → `public.teams.id`

### `team_events`

RLS: enabled · rows: 0 · PK: id

| column        | type                     | nullable | default           |
| ------------- | ------------------------ | -------- | ----------------- |
| id            | uuid                     | no       | gen_random_uuid() |
| team_id       | uuid                     | no       |                   |
| event_type    | text                     | no       | 'practice'::text  |
| title         | text                     | no       |                   |
| description   | text                     | yes      |                   |
| location      | text                     | yes      |                   |
| start_time    | timestamp with time zone | no       |                   |
| end_time      | timestamp with time zone | yes      |                   |
| is_mandatory  | boolean                  | no       | true              |
| rsvp_deadline | date                     | yes      |                   |
| created_by    | uuid                     | yes      |                   |
| created_at    | timestamp with time zone | no       | now()             |
| updated_at    | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `team_events.team_id` → `public.teams.id`
- `team_events.created_by` → `auth.users.id`

### `team_insights`

RLS: enabled · rows: 0 · PK: id

| column       | type                     | nullable | default           |
| ------------ | ------------------------ | -------- | ----------------- |
| id           | uuid                     | no       | gen_random_uuid() |
| team_id      | uuid                     | no       |                   |
| insight_type | character varying        | no       |                   |
| insight_data | jsonb                    | no       | '{}'::jsonb       |
| generated_at | timestamp with time zone | yes      | now()             |
| created_at   | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `team_insights.team_id` → `public.teams.id`

### `team_invitations`

RLS: enabled · rows: 0 · PK: id

| column      | type                     | nullable | default                      |
| ----------- | ------------------------ | -------- | ---------------------------- |
| id          | uuid                     | no       | gen_random_uuid()            |
| team_id     | uuid                     | no       |                              |
| email       | character varying        | no       |                              |
| token       | character varying        | no       |                              |
| role        | character varying        | no       | 'player'::character varying  |
| status      | character varying        | no       | 'pending'::character varying |
| invited_by  | uuid                     | no       |                              |
| message     | text                     | yes      |                              |
| expires_at  | timestamp with time zone | no       | (now() + '7 days'::interval) |
| accepted_at | timestamp with time zone | yes      |                              |
| created_at  | timestamp with time zone | no       | now()                        |
| updated_at  | timestamp with time zone | no       | now()                        |

**Foreign keys:**

- `team_invitations.team_id` → `public.teams.id`
- `team_invitations.invited_by` → `auth.users.id`

### `team_members`

RLS: enabled · rows: 4 · PK: id

| column                | type                     | nullable | default                       |
| --------------------- | ------------------------ | -------- | ----------------------------- |
| id                    | uuid                     | no       | gen_random_uuid()             |
| team_id               | uuid                     | no       |                               |
| user_id               | uuid                     | no       |                               |
| role                  | character varying        | no       |                               |
| status                | character varying        | no       | 'active'::character varying   |
| jersey_number         | integer                  | yes      |                               |
| position              | character varying        | yes      |                               |
| positions             | ARRAY                    | yes      |                               |
| joined_at             | timestamp with time zone | no       | now()                         |
| created_at            | timestamp with time zone | no       | now()                         |
| updated_at            | timestamp with time zone | no       | now()                         |
| role_approval_status  | character varying        | yes      | 'approved'::character varying |
| role_approved_by      | uuid                     | yes      |                               |
| role_approved_at      | timestamp with time zone | yes      |                               |
| role_rejection_reason | text                     | yes      |                               |

**Foreign keys:**

- `team_members.role_approved_by` → `auth.users.id`
- `team_members.team_id` → `public.teams.id`
- `team_members.user_id` → `auth.users.id`

### `team_season_phases`

RLS: enabled · rows: 11 · PK: id

| column      | type                     | nullable | default           |
| ----------- | ------------------------ | -------- | ----------------- |
| id          | uuid                     | no       | gen_random_uuid() |
| team_id     | uuid                     | no       |                   |
| phase_key   | text                     | no       |                   |
| phase_label | text                     | yes      |                   |
| start_date  | date                     | no       |                   |
| end_date    | date                     | no       |                   |
| is_active   | boolean                  | no       | true              |
| created_at  | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `team_season_phases.team_id` → `public.teams.id`

### `team_sharing_settings`

RLS: enabled · rows: 0 · PK: id

| column                      | type                     | nullable | default           |
| --------------------------- | ------------------------ | -------- | ----------------- |
| id                          | uuid                     | no       | gen_random_uuid() |
| user_id                     | uuid                     | no       |                   |
| team_id                     | uuid                     | no       |                   |
| performance_sharing_enabled | boolean                  | no       | false             |
| health_sharing_enabled      | boolean                  | no       | false             |
| allowed_metric_categories   | ARRAY                    | no       | ARRAY[]::text[]   |
| created_at                  | timestamp with time zone | no       | now()             |
| updated_at                  | timestamp with time zone | no       | now()             |

**Foreign keys:**

- `team_sharing_settings.team_id` → `public.teams.id`
- `team_sharing_settings.user_id` → `auth.users.id`

### `team_templates`

RLS: enabled · rows: 0 · PK: id

| column        | type                     | nullable | default           |
| ------------- | ------------------------ | -------- | ----------------- |
| id            | uuid                     | no       | gen_random_uuid() |
| team_id       | uuid                     | no       |                   |
| created_by    | uuid                     | no       |                   |
| template_type | character varying        | no       |                   |
| name          | character varying        | no       |                   |
| description   | text                     | yes      |                   |
| content       | jsonb                    | no       | '{}'::jsonb       |
| is_default    | boolean                  | yes      | false             |
| is_active     | boolean                  | yes      | true              |
| usage_count   | integer                  | yes      | 0                 |
| created_at    | timestamp with time zone | yes      | now()             |
| updated_at    | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `team_templates.team_id` → `public.teams.id`
- `team_templates.created_by` → `auth.users.id`
- `template_assignments.template_id` → `public.team_templates.id`

### `teams`

RLS: enabled · rows: 0 · PK: id

| column            | type                     | nullable | default                               |
| ----------------- | ------------------------ | -------- | ------------------------------------- |
| id                | uuid                     | no       | gen_random_uuid()                     |
| name              | character varying        | no       |                                       |
| league            | character varying        | yes      |                                       |
| season            | character varying        | yes      |                                       |
| home_city         | character varying        | yes      |                                       |
| team_logo_url     | text                     | yes      |                                       |
| primary_color     | character varying        | yes      | '#667eea'::character varying          |
| secondary_color   | character varying        | yes      | '#764ba2'::character varying          |
| coach_id          | uuid                     | no       |                                       |
| description       | text                     | yes      |                                       |
| founded_year      | integer                  | yes      |                                       |
| motto             | character varying        | yes      |                                       |
| created_at        | timestamp with time zone | no       | now()                                 |
| updated_at        | timestamp with time zone | no       | now()                                 |
| approval_status   | character varying        | yes      | 'pending_approval'::character varying |
| approved_by       | uuid                     | yes      |                                       |
| approved_at       | timestamp with time zone | yes      |                                       |
| rejection_reason  | text                     | yes      |                                       |
| application_notes | text                     | yes      |                                       |
| olympic_track     | character varying        | yes      |                                       |
| home_field        | text                     | yes      |                                       |

**Foreign keys:**

- `team_activities.team_id` → `public.teams.id`
- `competition_events.team_id` → `public.teams.id`
- `attendance_records.team_id` → `public.teams.id`
- `team_events.team_id` → `public.teams.id`
- `practice_plans.team_id` → `public.teams.id`
- `coach_activity_log.team_id` → `public.teams.id`
- `chat_messages.team_id` → `public.teams.id`
- `channels.team_id` → `public.teams.id`
- `game_participations.team_id` → `public.teams.id`
- `posts.team_id` → `public.teams.id`
- `tournament_day_plans.team_id` → `public.teams.id`
- `team_sharing_settings.team_id` → `public.teams.id`
- `training_sessions.team_id` → `public.teams.id`
- `tournament_budgets.team_id` → `public.teams.id`
- `team_templates.team_id` → `public.teams.id`
- `team_members.team_id` → `public.teams.id`
- `team_invitations.team_id` → `public.teams.id`
- `team_insights.team_id` → `public.teams.id`
- `roster_audit_log.team_id` → `public.teams.id`
- `ownership_transitions.team_id` → `public.teams.id`
- `decision_ledger.team_id` → `public.teams.id`
- `coach_inbox_items.team_id` → `public.teams.id`
- `coach_analytics_cache.team_id` → `public.teams.id`
- `ai_chat_sessions.team_id` → `public.teams.id`
- `nutrition_reports.team_id` → `public.teams.id`
- `teams.approved_by` → `auth.users.id`
- `event_availability.team_id` → `public.teams.id`
- `player_payments.team_id` → `public.teams.id`
- `training_videos.team_id` → `public.teams.id`
- `team_season_phases.team_id` → `public.teams.id`
- `athlete_travel_log.team_id` → `public.teams.id`
- `event_participation.team_id` → `public.teams.id`
- `event_games.team_id` → `public.teams.id`
- `teams.coach_id` → `auth.users.id`

### `template_assignments`

RLS: enabled · rows: 0 · PK: id

| column        | type                     | nullable | default                       |
| ------------- | ------------------------ | -------- | ----------------------------- |
| id            | uuid                     | no       | gen_random_uuid()             |
| template_id   | uuid                     | no       |                               |
| user_id       | uuid                     | no       |                               |
| assigned_by   | uuid                     | no       |                               |
| assigned_date | date                     | no       |                               |
| due_date      | date                     | yes      |                               |
| status        | character varying        | yes      | 'assigned'::character varying |
| completed_at  | timestamp with time zone | yes      |                               |
| notes         | text                     | yes      |                               |
| created_at    | timestamp with time zone | yes      | now()                         |
| updated_at    | timestamp with time zone | yes      | now()                         |

**Foreign keys:**

- `template_assignments.assigned_by` → `auth.users.id`
- `template_assignments.template_id` → `public.team_templates.id`
- `template_assignments.user_id` → `auth.users.id`

### `tournament_budgets`

RLS: enabled · rows: 0 · PK: id

| column          | type                     | nullable | default           |
| --------------- | ------------------------ | -------- | ----------------- |
| id              | uuid                     | no       | gen_random_uuid() |
| tournament_id   | uuid                     | no       |                   |
| team_id         | uuid                     | no       |                   |
| budget_category | character varying        | no       |                   |
| estimated_cost  | numeric                  | yes      |                   |
| actual_cost     | numeric                  | yes      |                   |
| notes           | text                     | yes      |                   |
| created_at      | timestamp with time zone | yes      | now()             |
| updated_at      | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `tournament_budgets.team_id` → `public.teams.id`

### `tournament_day_plans`

RLS: enabled · rows: 0 · PK: id

| column            | type                     | nullable | default                |
| ----------------- | ------------------------ | -------- | ---------------------- |
| id                | uuid                     | no       | gen_random_uuid()      |
| user_id           | uuid                     | no       |                        |
| team_id           | uuid                     | yes      |                        |
| tournament_date   | date                     | no       |                        |
| tournament_name   | text                     | no       | 'Tournament Day'::text |
| games             | jsonb                    | no       | '[]'::jsonb            |
| nutrition_windows | jsonb                    | no       | '[]'::jsonb            |
| created_at        | timestamp with time zone | no       | now()                  |
| updated_at        | timestamp with time zone | no       | now()                  |

**Foreign keys:**

- `tournament_day_plans.team_id` → `public.teams.id`
- `tournament_day_plans.user_id` → `auth.users.id`

### `training_phases`

RLS: enabled · rows: 0 · PK: id

| column      | type                     | nullable | default           |
| ----------- | ------------------------ | -------- | ----------------- |
| id          | uuid                     | no       | gen_random_uuid() |
| program_id  | uuid                     | no       |                   |
| name        | character varying        | no       |                   |
| description | text                     | yes      |                   |
| start_date  | date                     | no       |                   |
| end_date    | date                     | no       |                   |
| phase_order | integer                  | no       |                   |
| focus_areas | ARRAY                    | yes      |                   |
| created_at  | timestamp with time zone | yes      | now()             |
| updated_at  | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `training_phases.program_id` → `public.training_programs.id`
- `player_programs.current_phase_id` → `public.training_phases.id`
- `training_weeks.phase_id` → `public.training_phases.id`

### `training_programs`

RLS: enabled · rows: 0 · PK: id

| column            | type                     | nullable | default           |
| ----------------- | ------------------------ | -------- | ----------------- |
| id                | uuid                     | no       | gen_random_uuid() |
| name              | character varying        | no       |                   |
| position_id       | uuid                     | yes      |                   |
| description       | text                     | yes      |                   |
| program_type      | character varying        | yes      |                   |
| difficulty_level  | character varying        | yes      |                   |
| duration_weeks    | integer                  | yes      |                   |
| sessions_per_week | integer                  | yes      |                   |
| start_date        | date                     | no       |                   |
| end_date          | date                     | no       |                   |
| is_template       | boolean                  | yes      | false             |
| created_by        | uuid                     | yes      |                   |
| is_active         | boolean                  | yes      | true              |
| created_at        | timestamp with time zone | yes      | now()             |
| updated_at        | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `movement_patterns.program_id` → `public.training_programs.id`
- `training_programs.position_id` → `public.positions.id`
- `training_programs.created_by` → `auth.users.id`
- `training_phases.program_id` → `public.training_programs.id`
- `warmup_protocols.program_id` → `public.training_programs.id`
- `player_programs.program_id` → `public.training_programs.id`
- `training_session_templates.program_id` → `public.training_programs.id`

### `training_session_templates`

RLS: enabled · rows: 0 · PK: id

| column            | type                     | nullable | default           |
| ----------------- | ------------------------ | -------- | ----------------- |
| id                | uuid                     | no       | gen_random_uuid() |
| program_id        | uuid                     | no       |                   |
| week_id           | uuid                     | no       |                   |
| session_name      | character varying        | no       |                   |
| session_type      | character varying        | yes      |                   |
| day_of_week       | integer                  | no       |                   |
| session_order     | integer                  | no       | 1                 |
| duration_minutes  | integer                  | yes      |                   |
| intensity_level   | text                     | yes      |                   |
| description       | text                     | yes      |                   |
| warm_up_protocol  | text                     | yes      |                   |
| notes             | text                     | yes      |                   |
| equipment_needed  | ARRAY                    | yes      |                   |
| is_team_practice  | boolean                  | yes      | false             |
| is_outdoor        | boolean                  | yes      | false             |
| weather_sensitive | boolean                  | yes      | false             |
| created_at        | timestamp with time zone | yes      | now()             |
| updated_at        | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `training_session_templates.program_id` → `public.training_programs.id`
- `session_exercises.session_template_id` → `public.training_session_templates.id`
- `training_session_templates.week_id` → `public.training_weeks.id`

### `training_sessions`

RLS: enabled · rows: 15 · PK: id

| column                  | type                        | nullable | default                        |
| ----------------------- | --------------------------- | -------- | ------------------------------ |
| id                      | uuid                        | no       | gen_random_uuid()              |
| user_id                 | uuid                        | no       |                                |
| team_id                 | uuid                        | yes      |                                |
| session_date            | date                        | no       |                                |
| session_type            | character varying           | no       |                                |
| drill_type              | character varying           | yes      |                                |
| duration_minutes        | integer                     | no       |                                |
| intensity_level         | integer                     | yes      |                                |
| completion_rate         | numeric                     | yes      |                                |
| performance_score       | numeric                     | yes      |                                |
| xp_earned               | integer                     | yes      | 0                              |
| notes                   | text                        | yes      |                                |
| coach_feedback          | text                        | yes      |                                |
| status                  | character varying           | yes      | 'completed'::character varying |
| created_at              | timestamp without time zone | yes      | CURRENT_TIMESTAMP              |
| updated_at              | timestamp without time zone | yes      | CURRENT_TIMESTAMP              |
| coach_locked            | boolean                     | no       | false                          |
| modified_by_coach_id    | uuid                        | yes      |                                |
| modified_at             | timestamp with time zone    | yes      |                                |
| session_state           | text                        | yes      | 'PLANNED'::text                |
| current_version         | integer                     | no       | 1                              |
| rpe                     | integer                     | yes      |                                |
| workload                | numeric                     | yes      |                                |
| completed_at            | timestamp with time zone    | yes      |                                |
| session_structure       | jsonb                       | yes      |                                |
| exercises               | jsonb                       | yes      |                                |
| equipment               | ARRAY                       | yes      |                                |
| goals                   | ARRAY                       | yes      |                                |
| log_status              | character varying           | yes      | 'on_time'::character varying   |
| requires_coach_approval | boolean                     | yes      | false                          |
| hours_delayed           | integer                     | yes      |                                |
| conflicts               | jsonb                       | yes      | '[]'::jsonb                    |
| title                   | text                        | yes      |                                |
| location                | text                        | yes      |                                |
| prescribed_duration     | integer                     | yes      |                                |
| prescribed_intensity    | integer                     | yes      |                                |
| throw_count             | integer                     | yes      |                                |
| throw_au                | numeric                     | yes      |                                |

**Foreign keys:**

- `training_sessions.user_id` → `public.users.id`
- `ai_training_suggestions.affected_session_id` → `public.training_sessions.id`
- `training_sessions.team_id` → `public.teams.id`
- `event_participation.training_session_id` → `public.training_sessions.id`
- `state_transition_history.session_id` → `public.training_sessions.id`
- `execution_logs.session_id` → `public.training_sessions.id`
- `session_version_history.session_id` → `public.training_sessions.id`
- `session_exercises.session_id` → `public.training_sessions.id`
- `training_sessions.modified_by_coach_id` → `auth.users.id`

### `training_videos`

RLS: enabled · rows: 65 · PK: id

| column           | type                     | nullable | default           |
| ---------------- | ------------------------ | -------- | ----------------- |
| id               | uuid                     | no       | gen_random_uuid() |
| title            | text                     | no       |                   |
| description      | text                     | yes      |                   |
| video_url        | text                     | no       |                   |
| thumbnail_url    | text                     | yes      |                   |
| duration_seconds | integer                  | yes      |                   |
| category         | character varying        | yes      |                   |
| position         | character varying        | yes      |                   |
| difficulty_level | character varying        | yes      |                   |
| created_by       | uuid                     | yes      |                   |
| is_active        | boolean                  | yes      | true              |
| view_count       | integer                  | yes      | 0                 |
| created_at       | timestamp with time zone | yes      | now()             |
| updated_at       | timestamp with time zone | yes      | now()             |
| team_id          | uuid                     | yes      |                   |

**Foreign keys:**

- `training_videos.team_id` → `public.teams.id`
- `training_videos.created_by` → `auth.users.id`

### `training_weeks`

RLS: enabled · rows: 0 · PK: id

| column            | type                     | nullable | default           |
| ----------------- | ------------------------ | -------- | ----------------- |
| id                | uuid                     | no       | gen_random_uuid() |
| phase_id          | uuid                     | no       |                   |
| week_number       | integer                  | no       |                   |
| start_date        | date                     | no       |                   |
| end_date          | date                     | no       |                   |
| load_percentage   | numeric                  | yes      |                   |
| volume_multiplier | numeric                  | yes      | 1.0               |
| focus             | character varying        | yes      |                   |
| created_at        | timestamp with time zone | yes      | now()             |
| updated_at        | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `training_session_templates.week_id` → `public.training_weeks.id`
- `training_weeks.phase_id` → `public.training_phases.id`

### `trending_topics`

RLS: enabled · rows: 0 · PK: id

| column     | type                     | nullable | default           |
| ---------- | ------------------------ | -------- | ----------------- |
| id         | uuid                     | no       | gen_random_uuid() |
| name       | text                     | no       |                   |
| count      | integer                  | no       | 0                 |
| is_active  | boolean                  | no       | true              |
| created_at | timestamp with time zone | no       | now()             |
| updated_at | timestamp with time zone | no       | now()             |

### `user_age_groups`

RLS: enabled · rows: 0 · PK: id

| column                    | type                     | nullable | default           |
| ------------------------- | ------------------------ | -------- | ----------------- |
| id                        | uuid                     | no       | gen_random_uuid() |
| user_id                   | uuid                     | no       |                   |
| age_group                 | character varying        | no       |                   |
| birth_year                | integer                  | yes      |                   |
| requires_parental_consent | boolean                  | yes      | false             |
| consent_given             | boolean                  | yes      | false             |
| consent_given_by          | uuid                     | yes      |                   |
| consent_given_at          | timestamp with time zone | yes      |                   |
| created_at                | timestamp with time zone | yes      | now()             |
| updated_at                | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `user_age_groups.user_id` → `auth.users.id`
- `user_age_groups.consent_given_by` → `auth.users.id`

### `user_ai_preferences`

RLS: enabled · rows: 0 · PK: id

| column                | type                     | nullable | default                       |
| --------------------- | ------------------------ | -------- | ----------------------------- |
| id                    | uuid                     | no       | gen_random_uuid()             |
| user_id               | uuid                     | no       |                               |
| tone                  | character varying        | yes      | 'friendly'::character varying |
| verbosity             | character varying        | yes      | 'balanced'::character varying |
| proactive_suggestions | boolean                  | yes      | true                          |
| reminder_frequency    | character varying        | yes      | 'moderate'::character varying |
| focus_areas           | ARRAY                    | yes      | '{}'::text[]                  |
| avoided_topics        | ARRAY                    | yes      | '{}'::text[]                  |
| language_preference   | character varying        | yes      | 'en'::character varying       |
| created_at            | timestamp with time zone | yes      | now()                         |
| updated_at            | timestamp with time zone | yes      | now()                         |

**Foreign keys:**

- `user_ai_preferences.user_id` → `auth.users.id`

### `user_notification_preferences`

RLS: enabled · rows: 0 · PK: id

| column            | type                     | nullable | default                                                   |
| ----------------- | ------------------------ | -------- | --------------------------------------------------------- |
| id                | integer                  | no       | nextval('user_notification_preferences_id_seq'::regclass) |
| user_id           | character varying        | no       |                                                           |
| notification_type | USER-DEFINED             | no       |                                                           |
| muted             | boolean                  | yes      | false                                                     |
| push_enabled      | boolean                  | yes      | true                                                      |
| in_app_enabled    | boolean                  | yes      | true                                                      |
| created_at        | timestamp with time zone | yes      | now()                                                     |
| updated_at        | timestamp with time zone | yes      | now()                                                     |

### `user_preferences`

RLS: enabled · rows: 0 · PK: user_id

| column                   | type                     | nullable | default      |
| ------------------------ | ------------------------ | -------- | ------------ |
| user_id                  | uuid                     | no       |              |
| email                    | text                     | yes      |              |
| schedule_type            | text                     | yes      |              |
| practices_per_week       | integer                  | yes      |              |
| practice_days            | ARRAY                    | no       | '{}'::text[] |
| morning_mobility         | text                     | yes      |              |
| evening_mobility         | text                     | yes      |              |
| foam_rolling_time        | text                     | yes      |              |
| rest_day_preference      | text                     | yes      |              |
| training_goals           | ARRAY                    | no       | '{}'::text[] |
| equipment_available      | ARRAY                    | no       | '{}'::text[] |
| current_injuries         | jsonb                    | no       | '[]'::jsonb  |
| injury_history           | ARRAY                    | no       | '{}'::text[] |
| medical_notes            | text                     | yes      |              |
| enable_reminders         | boolean                  | no       | true         |
| reminder_time            | text                     | yes      |              |
| notification_preferences | ARRAY                    | no       | '{}'::text[] |
| consent_terms_of_service | boolean                  | no       | false        |
| consent_privacy_policy   | boolean                  | no       | false        |
| consent_data_usage       | boolean                  | no       | false        |
| consent_ai_coach         | boolean                  | no       | false        |
| consent_email_updates    | boolean                  | no       | false        |
| consent_updated_at       | timestamp with time zone | yes      |              |
| created_at               | timestamp with time zone | no       | now()        |
| updated_at               | timestamp with time zone | no       | now()        |

**Foreign keys:**

- `user_preferences.user_id` → `auth.users.id`

### `user_security`

RLS: enabled · rows: 0 · PK: id

| column                | type                     | nullable | default           |
| --------------------- | ------------------------ | -------- | ----------------- |
| id                    | uuid                     | no       | gen_random_uuid() |
| user_id               | uuid                     | no       |                   |
| two_factor_enabled    | boolean                  | yes      | false             |
| two_factor_secret     | text                     | yes      |                   |
| backup_codes          | ARRAY                    | yes      |                   |
| last_password_change  | timestamp with time zone | yes      |                   |
| failed_login_attempts | integer                  | yes      | 0                 |
| account_locked_until  | timestamp with time zone | yes      |                   |
| security_questions    | jsonb                    | yes      | '{}'::jsonb       |
| created_at            | timestamp with time zone | yes      | now()             |
| updated_at            | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `user_security.user_id` → `auth.users.id`

### `user_settings`

RLS: enabled · rows: 0 · PK: id

| column        | type                     | nullable | default           |
| ------------- | ------------------------ | -------- | ----------------- |
| id            | uuid                     | no       | gen_random_uuid() |
| user_id       | uuid                     | no       |                   |
| setting_key   | character varying        | no       |                   |
| setting_value | jsonb                    | no       | '{}'::jsonb       |
| created_at    | timestamp with time zone | yes      | now()             |
| updated_at    | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `user_settings.user_id` → `auth.users.id`

### `user_supplements`

RLS: enabled · rows: 0 · PK: id

| column     | type                     | nullable | default                      |
| ---------- | ------------------------ | -------- | ---------------------------- |
| id         | uuid                     | no       | gen_random_uuid()            |
| user_id    | uuid                     | no       |                              |
| name       | character varying        | no       |                              |
| dosage     | character varying        | yes      |                              |
| timing     | character varying        | no       | 'anytime'::character varying |
| category   | character varying        | no       | 'other'::character varying   |
| active     | boolean                  | no       | true                         |
| created_at | timestamp with time zone | no       | now()                        |
| updated_at | timestamp with time zone | no       | now()                        |

**Foreign keys:**

- `user_supplements.user_id` → `auth.users.id`

### `users`

RLS: enabled · rows: 11 · PK: id

| column                        | type                        | nullable | default                       |
| ----------------------------- | --------------------------- | -------- | ----------------------------- |
| id                            | uuid                        | no       | gen_random_uuid()             |
| email                         | character varying           | no       |                               |
| password_hash                 | character varying           | yes      |                               |
| first_name                    | character varying           | no       |                               |
| last_name                     | character varying           | no       |                               |
| position                      | character varying           | yes      |                               |
| experience_level              | character varying           | yes      | 'beginner'::character varying |
| height_cm                     | numeric                     | yes      |                               |
| weight_kg                     | numeric                     | yes      |                               |
| birth_date                    | date                        | yes      |                               |
| profile_picture               | character varying           | yes      |                               |
| bio                           | text                        | yes      |                               |
| is_active                     | boolean                     | yes      | true                          |
| email_verified                | boolean                     | yes      | false                         |
| last_login                    | timestamp without time zone | yes      |                               |
| created_at                    | timestamp without time zone | yes      | CURRENT_TIMESTAMP             |
| updated_at                    | timestamp without time zone | yes      | CURRENT_TIMESTAMP             |
| notification_last_opened_at   | timestamp with time zone    | yes      |                               |
| full_name                     | text                        | yes      |                               |
| jersey_number                 | integer                     | yes      |                               |
| profile_photo_url             | text                        | yes      |                               |
| date_of_birth                 | date                        | yes      |                               |
| phone                         | text                        | yes      |                               |
| onboarding_completed          | boolean                     | no       | false                         |
| gender                        | text                        | yes      |                               |
| name                          | text                        | yes      |                               |
| avatar_url                    | text                        | yes      |                               |
| account_status                | text                        | yes      | 'active'::text                |
| country                       | text                        | yes      |                               |
| team                          | text                        | yes      |                               |
| secondary_position            | text                        | yes      |                               |
| throwing_arm                  | text                        | yes      |                               |
| preferred_units               | text                        | yes      |                               |
| onboarding_completed_at       | timestamp with time zone    | yes      |                               |
| injury_gate_active            | boolean                     | no       | false                         |
| injury_gate_set_at            | timestamp with time zone    | yes      |                               |
| verification_token            | text                        | yes      |                               |
| verification_token_expires_at | timestamp with time zone    | yes      |                               |

**Foreign keys:**

- `qb_throwing_sessions.user_id` → `public.users.id`
- `learned_user_preferences.user_id` → `public.users.id`
- `player_training_stats.user_id` → `public.users.id`
- `player_streaks.user_id` → `public.users.id`
- `comment_likes.user_id` → `public.users.id`
- `post_comments.user_id` → `public.users.id`
- `post_bookmarks.user_id` → `public.users.id`
- `post_likes.user_id` → `public.users.id`
- `posts.user_id` → `public.users.id`
- `blocked_users.blocked_user_id` → `public.users.id`
- `blocked_users.user_id` → `public.users.id`
- `player_achievements.user_id` → `public.users.id`
- `rtp_prescription_approvals.athlete_id` → `public.users.id`
- `notifications.user_id` → `public.users.id`
- `daily_wellness_checkin.user_id` → `public.users.id`
- `community_poll_votes.user_id` → `public.users.id`
- `training_sessions.user_id` → `public.users.id`
- `readiness_scores.user_id` → `public.users.id`
- `proactive_checkins.user_id` → `public.users.id`
- `event_availability.user_id` → `public.users.id`
- `calibration_logs.user_id` → `public.users.id`
- `rtp_prescription_approvals.approved_by` → `public.users.id`
- `chat_messages.pinned_by` → `public.users.id`
- `chat_messages.recipient_id` → `public.users.id`
- `chat_messages.sender_id` → `public.users.id`
- `chat_messages.user_id` → `public.users.id`
- `prescription_audit_log.athlete_id` → `public.users.id`
- `account_pause_requests.user_id` → `public.users.id`

### `warmup_protocols`

RLS: enabled · rows: 0 · PK: id

| column      | type                     | nullable | default           |
| ----------- | ------------------------ | -------- | ----------------- |
| id          | uuid                     | no       | gen_random_uuid() |
| program_id  | uuid                     | yes      |                   |
| name        | character varying        | no       |                   |
| description | text                     | yes      |                   |
| created_at  | timestamp with time zone | yes      | now()             |
| updated_at  | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `warmup_protocols.program_id` → `public.training_programs.id`

### `weather_substitution_rules`

RLS: enabled · rows: 8 · PK: id

| column               | type    | nullable | default           |
| -------------------- | ------- | -------- | ----------------- |
| id                   | uuid    | no       | gen_random_uuid() |
| original_modality    | text    | no       |                   |
| condition            | text    | no       |                   |
| threshold_value      | numeric | yes      |                   |
| threshold_unit       | text    | yes      |                   |
| threshold_direction  | text    | no       | 'below'::text     |
| substitute_modality  | text    | no       |                   |
| substitute_rationale | text    | no       |                   |
| is_active            | boolean | no       | true              |

### `youth_athlete_settings`

RLS: enabled · rows: 0 · PK: id

| column                      | type                     | nullable | default           |
| --------------------------- | ------------------------ | -------- | ----------------- |
| id                          | uuid                     | no       | gen_random_uuid() |
| user_id                     | uuid                     | no       |                   |
| parent_email                | character varying        | yes      |                   |
| parent_phone                | character varying        | yes      |                   |
| school_name                 | character varying        | yes      |                   |
| grade_level                 | integer                  | yes      |                   |
| sport_experience_years      | integer                  | yes      | 0                 |
| medical_clearance_date      | date                     | yes      |                   |
| emergency_contact_name      | character varying        | yes      |                   |
| emergency_contact_phone     | character varying        | yes      |                   |
| dietary_restrictions        | ARRAY                    | yes      |                   |
| special_needs_notes         | text                     | yes      |                   |
| max_training_hours_per_week | integer                  | yes      | 10                |
| rest_day_requirements       | integer                  | yes      | 2                 |
| created_at                  | timestamp with time zone | yes      | now()             |
| updated_at                  | timestamp with time zone | yes      | now()             |

**Foreign keys:**

- `youth_athlete_settings.user_id` → `auth.users.id`

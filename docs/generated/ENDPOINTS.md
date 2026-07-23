# Endpoint Reference (GENERATED — do not hand-edit)

> Regenerate: `npm run docs:regen` (parses `netlify.toml` + `netlify/functions/*.js` + scans `angular/src`).
> **Last verified: 2026-07-23**

**157 functions: 136 exercised, 21 orphaned.** A table name with ⚠️ is referenced in code but not a live table (possible drift/typo); _(bucket)_ = Storage bucket, not a DB table.

## Exercised

| Function | Methods | /api path(s) | Tables / RPCs touched |
|---|---|---|---|
| `accept-invitation` | POST | _(router submodule)_ | users, team_invitations, team_members |
| `account-deletion` | GET, POST, DELETE | _(router submodule)_ | account_deletion_requests, initiate_account_deletion(), cancel_account_deletion() |
| `account-pause` | POST | _(router submodule)_ | pause_account(), resume_account() |
| `achievements` | GET, POST | /api/achievements<br>/api/achievements/* | achievement_definitions, player_achievements, player_streaks, player_training_stats, update_player_streak(), award_achievement() |
| `admin` | GET, POST | /api/admin/*<br>/api/admin | users, database-backups _(bucket)_, team_members, authorization_violations |
| `admin-credentials` | GET | /api/admin/credentials | credential_verifications, users, team_members, credential-documents _(bucket)_, authorization_violations |
| `ai-chat` | GET, POST | /api/ai/chat<br>/api/ai/chat/*<br>/api/ai-chat<br>/api/ai-chat/*<br>/api/ai/analyze-context<br>/api/ai/process-command<br>/api/ai/feedback<br>/api/ai/feedback/*<br>/api/ai-review/*<br>/api/ai-review | ai_chat_sessions, training_sessions, team_members, v_injuries_unified, daily_protocols, daily_wellness_checkin, games, nutrition_plans, recovery_blocks, users, physical_measurements, user_age_groups, knowledge_base_entries, privacy_settings, conversation_context, ai_messages, conversation_summaries ⚠️, proactive_checkins, ai_response_feedback, learned_user_preferences, merlin_violation_log, account_pause_requests, ai_followups, user_ai_preferences, youth_athlete_settings, parent_guardian_links, parent_notifications, classification_history, ai_recommendations, coach_inbox_items, search_knowledge_semantic(), get_relevant_conversation_context(), generate_proactive_checkins(), learn_user_preferences() |
| `ai-telemetry` | GET | /api/ai/telemetry | team_members, ai_chat_sessions, ai_messages, ai_recommendations, knowledge_base_entries, authorization_violations |
| `alert-dashboard` | GET | /api/alert-dashboard<br>/api/alert-dashboard/* | team_members, generated_alerts, alert_rules, authorization_violations |
| `alert-get-athlete` | GET | /api/alerts/athlete/* | generated_alerts, alert_rules, alert_delivery_logs, team_members, authorization_violations |
| `alert-preferences` | GET, PATCH | /api/alert-preferences | alert_preferences, team_members |
| `analytics` | OPTIONS | /api/analytics/*<br>/api/performance/metrics<br>/api/performance/metrics/*<br>/api/performance/heatmap<br>/api/performance/heatmap/*<br>/api/performance-data/measurements<br>/api/performance-data/performance-tests<br>/api/performance-data/wellness<br>/api/performance-data/supplements<br>/api/performance-data/injuries<br>/api/performance-data/injuries/*<br>/api/performance-data/trends<br>/api/performance-data/export<br>/api/performance/trends<br>/api/performance/trends/* | team_members, users, performance_tests, physical_measurements, daily_wellness_checkin, supplement_logs, v_injuries_unified, training_sessions |
| `analytics-core` | GET | _(router submodule)_ | team_members, users, performance_tests, training_sessions, daily_wellness_checkin, team_sharing_settings, privacy_settings, consent_access_log |
| `api-docs` | GET | /api/api-docs | — |
| `athlete-events` | GET, POST, PUT, PATCH, DELETE | /api/athlete-events/*<br>/api/athlete-events | athlete_events |
| `athlete-injuries` | GET, POST | /api/athlete-injuries/*<br>/api/athlete-injuries | athlete_injuries |
| `attendance` | GET, POST, PUT, DELETE | _(router submodule)_ | team_members, team_events, attendance_records |
| `auth` | OPTIONS | /api/auth/me<br>/api/auth-me<br>/api/auth/reset-password<br>/api/auth/login<br>/api/accept-invitation<br>/api/validate-invitation<br>/api/account/pause<br>/api/account/resume<br>/api/account/*<br>/api/parental-consent/*<br>/api/parental-consent | account_deletion_requests, users, team_invitations, team_members, parental_consent, privacy_audit_log, initiate_account_deletion(), cancel_account_deletion(), pause_account(), resume_account() |
| `auth-login` | POST | _(router submodule)_ | team_members |
| `auth-me` | GET | _(router submodule)_ | team_members |
| `bloodwork` | GET, POST | /api/bloodwork/*<br>/api/bloodwork | bloodwork_panels, bloodwork_markers |
| `cache` | — | _(router submodule)_ | — |
| `calc-readiness` | GET, POST | _(router submodule)_ | v_athlete_schedule, training_sessions, daily_wellness_checkin, readiness_scores, athlete_injuries, team_members, authorization_violations, account_pause_requests, users, return_to_play_protocols, has_active_safety_override(), detect_pain_trigger(), detect_acwr_trigger() |
| `calibration-logs` | GET, POST | /api/calibration-logs<br>/api/calibration-logs/* | calibration_logs, team_members, authorization_violations |
| `chat` | GET, POST, PATCH, DELETE | _(router submodule)_ | team_members, channels, channel_members, chat_messages |
| `coach` | OPTIONS | /api/coach-activity/*<br>/api/coach-activity<br>/api/coach/*<br>/api/coach<br>/api/coach-alerts/*<br>/api/coach-alerts<br>/api/coach-inbox/*<br>/api/coach-inbox<br>/api/coach-analytics/*<br>/api/coach-analytics<br>/api/film-room/*<br>/api/film-room<br>/api/playbook/*<br>/api/playbook | team_members, notifications, readiness_scores, users, training_sessions, games, team_events, athlete_injuries, daily_wellness_checkin, daily_protocols, coach_activity_log, ai_messages, micro_sessions, ai_response_feedback, coach_alert_acknowledgments, coach_inbox_items, teams, compute_coach_analytics() |
| `coach-activity` | GET, POST | _(router submodule)_ | team_members, coach_activity_log |
| `coach-alerts` | POST, OPTIONS | _(router submodule)_ | daily_protocols, coach_alert_acknowledgments |
| `coach-analytics` | GET, POST | _(router submodule)_ | team_members, ai_messages, micro_sessions, ai_response_feedback, compute_coach_analytics() |
| `coach-core` | GET, POST, PUT, DELETE | _(router submodule)_ | team_members, notifications, readiness_scores, users, training_sessions, games, team_events, athlete_injuries, daily_wellness_checkin, daily_protocols, team_sharing_settings, privacy_settings, consent_access_log, account_pause_requests, authorization_violations |
| `coach-inbox` | GET, PATCH, POST | _(router submodule)_ | team_members, coach_inbox_items, users, ai_messages, teams |
| `community` | GET, POST, DELETE | _(router submodule)_ | posts, team_members, blocked_users, post_likes, post_bookmarks, post_comments, comment_likes, trending_topics, community_polls, community_poll_options, community_poll_votes, decrement_likes_count(), increment_likes_count(), increment_comments_count(), decrement_comment_likes_count(), increment_comment_likes_count(), increment_poll_votes() |
| `compute-acwr` | POST | _(router submodule)_ | training_sessions, team_members, authorization_violations, account_pause_requests |
| `cycle` | GET, PUT, POST, DELETE | /api/cycle/*<br>/api/cycle | cycle_tracking_profiles, cycle_logs, privacy_audit_log |
| `daily-load` | GET | /api/daily-load | training_sessions, account_pause_requests, billing_customers, subscriptions, team_members |
| `daily-protocol` | GET, POST | /api/daily-protocol<br>/api/daily-protocol/* | athlete_training_config, users, age_recovery_modifiers, player_programs, training_phases, training_weeks, readiness_scores, daily_protocols, protocol_exercises, exercises, team_members, coach_inbox_items, team_season_phases, daily_wellness_checkin, training_sessions, notifications, user_notification_preferences, sponsors, training_session_templates, team_activities, training_programs, recovery_sessions, readiness_gates, recovery_blocks, return_to_play_protocols, rtp_prescription_approvals, athlete_injuries, session_exercises, protocol_generation_requests, player_training_stats, get_athlete_readiness(), generate_protocol_transactional(), update_player_streak(), award_achievement() |
| `daily-training` | GET, POST | _(router submodule)_ | users, training_sessions, games, merlin_violation_log, team_members, authorization_violations, account_pause_requests, has_active_safety_override(), detect_pain_trigger(), detect_acwr_trigger() |
| `dashboard` | GET | /api/dashboard/*<br>/api/dashboard | training_sessions, team_members |
| `data` | OPTIONS | /api/wearables/status<br>/api/import/fetch-url<br>/api/import/process<br>/api/import-open-data<br>/api/data-export/*<br>/api/data-export | billing_customers, subscriptions, invoices, monitoring_providers, device_pairings, wearable_health, team_members, training_sessions, log_training_session() |
| `data-export` | GET, POST | _(router submodule)_ | billing_customers, subscriptions, invoices |
| `decisions` | GET, POST | _(router submodule)_ | team_members, decision_ledger, merlin_violation_log |
| `event-availability` | GET, POST | /api/event-availability/*<br>/api/event-availability | event_availability, set_event_availability() |
| `event-games` | GET, POST, PATCH, DELETE | /api/event-games/*<br>/api/event-games | competition_events, event_games, team_members |
| `event-participation` | GET, POST | /api/event-participation/*<br>/api/event-participation | v_pending_event_participation, record_event_participation() |
| `event-travel` | GET, POST, PUT, PATCH, DELETE | /api/event-travel/*<br>/api/event-travel | athlete_travel_log |
| `exercise-progression` | POST | _(router submodule)_ | protocol_exercises, exercises |
| `exercises` | OPTIONS | /api/exercise-progression<br>/api/exercise-progression/*<br>/api/qb-throwing<br>/api/qb-throwing/* | protocol_exercises, exercises, qb_throwing_sessions, training_sessions, get_qb_throwing_progression() |
| `external-load` | GET, POST | /api/external-load/*<br>/api/external-load | external_load_metrics |
| `game-events` | POST, DELETE | _(router submodule)_ | games, game_events, team_members, game_participations |
| `games` | OPTIONS | /api/game-events/*<br>/api/game-events<br>/api/games/*<br>/api/games<br>/api/tournament-calendar<br>/api/tournament-calendar/* | team_members, games, recovery_blocks, game_events, game_participations |
| `games-core` | GET, POST, PUT, DELETE | _(router submodule)_ | team_members, games, recovery_blocks, game_events |
| `health` | OPTIONS | /api/health | recovery_sessions, recovery_protocols, return_to_play_protocols |
| `health-core` | GET, HEAD | _(router submodule)_ | — |
| `hydration` | GET, POST | _(router submodule)_ | athlete_hydration_logs |
| `import-open-data` | POST | _(router submodule)_ | team_members, training_sessions, authorization_violations, log_training_session() |
| `import-process` | POST | _(router submodule)_ | log_training_session() |
| `injury-analytics` | GET | /api/injury-analytics | athlete_injuries, team_members, authorization_violations |
| `knowledge` | OPTIONS | /api/knowledge-search<br>/api/knowledge-search/*<br>/api/knowledge<br>/api/knowledge/search<br>/api/knowledge-governance<br>/api/knowledge-governance/* | knowledge_base_entries, knowledge_review_audit |
| `knowledge-governance` | GET, POST, PATCH | _(router submodule)_ | knowledge_base_entries, knowledge_review_audit, team_members, authorization_violations |
| `knowledge-search` | GET, POST | _(router submodule)_ | knowledge_base_entries |
| `load-management` | GET | _(router submodule)_ | team_members, training_sessions, daily_wellness_checkin, team_sharing_settings, privacy_settings, consent_access_log, account_pause_requests |
| `micro-sessions` | GET, POST, PATCH | _(router submodule)_ | micro_sessions, micro_session_analytics |
| `monitoring-report` | GET | /api/monitoring-report/*<br>/api/monitoring-report | monitoring_config, team_members, daily_wellness_checkin, session_load, bloodwork_panels, bloodwork_markers, wearable_health, physio_blocks, athlete_injuries, return_to_play_protocols, users, account_pause_requests, check_health_sharing() |
| `notifications` | OPTIONS | /api/notifications<br>/api/notifications/* | team_members |
| `nutrition` | GET, POST, PUT | _(router submodule)_ | athlete_nutrition_profiles, nutrition_plans, meal_templates, users |
| `parental-consent` | GET, POST, PUT | _(router submodule)_ | users, parental_consent, privacy_audit_log |
| `performance-data` | GET, POST, PUT, PATCH, DELETE | _(router submodule)_ | team_members, physical_measurements, performance_tests, daily_wellness_checkin, supplement_logs, v_injuries_unified, athlete_consent_settings, readiness_scores, training_sessions, team_sharing_settings, privacy_settings, consent_access_log, authorization_violations, merlin_violation_log, has_active_safety_override(), can_view_player_performance(), detect_pain_trigger(), detect_acwr_trigger() |
| `performance-heatmap` | GET | _(router submodule)_ | training_sessions |
| `performance-metrics` | GET | _(router submodule)_ | training_sessions, performance_tests |
| `periodization-prescription` | GET | /api/periodization-prescription | athlete_travel_log, taper_rules, readiness_scores, users, athlete_training_config, training_sessions, v_athlete_schedule, athlete_events, athlete_injuries, team_members |
| `physiotherapist-dashboard` | GET | /api/staff/physiotherapist/dashboard | team_members, rtp_athlete_protocol_assignments, users, athlete_injuries, ownership_transitions, notifications |
| `player-programs` | GET, POST, PUT | _(router submodule)_ | player_programs, training_programs, team_members |
| `player-settings` | GET, POST | _(router submodule)_ | athlete_training_config, users, age_recovery_modifiers, training_sessions, team_members, notifications, user_notification_preferences, sponsors, ensure_public_user_profile() |
| `player-stats` | GET | _(router submodule)_ | games, game_events, team_members |
| `privacy-settings` | GET, PUT | _(router submodule)_ | privacy_settings, team_sharing_settings, users, parental_consent, team_members, privacy_audit_log |
| `programs` | OPTIONS | /api/decisions/*<br>/api/decisions<br>/api/player-programs<br>/api/player-programs/*<br>/api/program-cycles<br>/api/program-cycles/*<br>/api/micro-sessions/*<br>/api/micro-sessions | player_programs, training_programs, micro_sessions, micro_session_analytics, team_members, decision_ledger |
| `qb-throwing` | GET, POST | _(router submodule)_ | qb_throwing_sessions, training_sessions, get_qb_throwing_progression() |
| `readiness` | OPTIONS | /api/compute-acwr<br>/api/calc-readiness<br>/api/readiness-history<br>/api/load-management/*<br>/api/load-management | v_athlete_schedule, training_sessions, daily_wellness_checkin, readiness_scores, athlete_injuries, team_members |
| `readiness-history` | GET | _(router submodule)_ | readiness_scores, athlete_consent_settings, team_members, authorization_violations, has_active_safety_override(), can_view_player_performance() |
| `recovery-core` | GET, POST, PUT | /api/recovery/* | recovery_sessions, recovery_protocols |
| `recovery-effectiveness` | GET, POST | /api/recovery-effectiveness | recovery_logs, team_members |
| `response-feedback` | GET, POST | /api/response-feedback/*<br>/api/response-feedback | ai_messages, ai_response_feedback, team_members, increment_preference_counter(), award_achievement() |
| `return-to-play` | GET, POST | /api/return-to-play/*<br>/api/return-to-play | return_to_play_protocols |
| `roster` | OPTIONS | /api/roster/*<br>/api/scouting/*<br>/api/scouting<br>/api/player-stats<br>/api/player-stats/*<br>/api/depth-chart/*<br>/api/depth-chart<br>/api/player-settings<br>/api/player-settings/* | team_members, games, game_events, athlete_training_config, users, age_recovery_modifiers, ensure_public_user_profile() |
| `roster-core` | GET | _(router submodule)_ | team_members |
| `rtp-all-protocols` | GET | /api/rtp/protocols | rtp_athlete_protocol_assignments, users, team_members, authorization_violations |
| `rtp-phase-progress` | GET, POST | /api/rtp/phase-progress | rtp_phase_progress, team_members, authorization_violations |
| `rtp-psychological-assessment` | GET, POST | /api/rtp/psychological-assessment | rtp_psychological_assessments, team_members, authorization_violations |
| `rtp-record-assessment` | POST | /api/rtp/assessments | rtp_athlete_protocol_assignments, rtp_functional_criteria, rtp_criteria_assessments, team_members, authorization_violations |
| `schedule` | GET | /api/schedule/*<br>/api/schedule | v_athlete_schedule, athlete_events |
| `season-archive` | POST | _(router submodule)_ | team_members, authorization_violations, archive_season_data() |
| `sleep-data` | GET | _(router submodule)_ | users, daily_wellness_checkin |
| `smart-training-recommendations` | GET, POST | _(router submodule)_ | training_sessions, v_athlete_schedule, v_injuries_unified, daily_wellness_checkin, player_programs, team_members, authorization_violations, account_pause_requests |
| `social` | OPTIONS | /api/chat/*<br>/api/chat<br>/api/community/* | team_members, channels, channel_members, chat_messages, posts, blocked_users, post_likes, post_bookmarks, post_comments, comment_likes, trending_topics, community_polls, community_poll_options, community_poll_votes, decrement_likes_count(), increment_likes_count(), increment_comments_count(), decrement_comment_likes_count(), increment_comment_likes_count(), increment_poll_votes() |
| `sponsor-logo` | GET | _(router submodule)_ | — |
| `sponsors` | GET | _(router submodule)_ | — |
| `staff` | OPTIONS | /api/staff-nutritionist/*<br>/api/staff-nutritionist<br>/api/staff-physiotherapist/*<br>/api/staff-physiotherapist<br>/api/staff-psychology/*<br>/api/staff-psychology | team_members, athlete_nutrition_profiles, physical_measurements, supplement_logs, user_supplements, athlete_hydration_logs, nutrition_reports, athlete_injuries, ownership_transitions, notifications, mental_performance_logs, psychological_assessments, mental_wellness_reports |
| `staff-coach-profile` | — | /api/staff/coach-profile | credential_verifications |
| `staff-head-coach-profile` | — | /api/staff/head-coach-profile | credential_verifications |
| `staff-manager-profile` | — | /api/staff/manager-profile | credential_verifications |
| `staff-nutritionist` | GET | _(router submodule)_ | team_members, athlete_nutrition_profiles, physical_measurements, supplement_logs, user_supplements, athlete_hydration_logs, nutrition_reports, training_sessions, daily_wellness_checkin, team_sharing_settings, privacy_settings, consent_access_log |
| `staff-nutritionist-profile` | — | /api/staff/nutritionist-profile | credential_verifications |
| `staff-physiotherapist` | GET | _(router submodule)_ | team_members, athlete_injuries, ownership_transitions, notifications |
| `staff-physiotherapist-profile` | — | /api/staff/physiotherapist-profile | credential_verifications |
| `staff-profile` | GET | _(router submodule)_ | credential_verifications, team_members, authorization_violations |
| `staff-psychologist-profile` | — | /api/staff/psychologist-profile | credential_verifications |
| `staff-psychology` | GET | _(router submodule)_ | team_members, mental_performance_logs, psychological_assessments, mental_wellness_reports, training_sessions, daily_wellness_checkin, team_sharing_settings, privacy_settings, consent_access_log |
| `staff-strength-coach-profile` | — | /api/staff/strength-coach-profile | credential_verifications |
| `supplements` | GET, POST | /api/supplements<br>/api/supplements/* | supplement_logs, user_supplements, notifications |
| `team` | OPTIONS | /api/team-calendar/*<br>/api/team-calendar<br>/api/team-invite<br>/api/attendance/*<br>/api/attendance<br>/api/season/*<br>/api/season<br>/api/season-archive/*<br>/api/season-archive<br>/api/team-templates/*<br>/api/team-templates | attendance_records, games, practice_plans, team_events, teams, team_members, team_invitations, users, team_templates, coach_inbox_items, ai_messages, micro_sessions, template_assignments, archive_season_data() |
| `team-acwr` | GET | /api/team-acwr | team_members, daily_load_score ⚠️, authorization_violations |
| `team-calendar` | GET, POST | _(router submodule)_ | attendance_records, games, practice_plans, team_events, team_members |
| `team-invite` | POST | _(router submodule)_ | teams, team_members, team_invitations, users |
| `team-join` | GET, POST | /api/team-join<br>/api/team-join/* | teams, team_members, users, training_sessions, notifications, user_notification_preferences, sponsors |
| `team-monitoring` | GET | /api/team-monitoring | team_members, daily_wellness_checkin, training_sessions, readiness_scores, authorization_violations, athlete_consent_settings, has_active_safety_override(), can_view_player_performance() |
| `team-templates` | GET, POST, PATCH, DELETE | _(router submodule)_ | team_members, team_templates, coach_inbox_items, ai_messages, micro_sessions, template_assignments |
| `training` | OPTIONS | /api/training/sessions<br>/api/training-sessions<br>/api/training/sessions/*<br>/api/training-sessions/*<br>/api/training/complete<br>/api/training/complete/*<br>/api/training/suggestions<br>/api/training/suggestions/*<br>/api/training-metrics<br>/api/training-plan<br>/api/training-plan/*<br>/api/training/plan<br>/api/training/plan/*<br>/api/training/stats<br>/api/training/stats-enhanced<br>/api/training-programs<br>/api/training-programs/*<br>/api/smart-training<br>/api/smart-training/*<br>/api/training/programs<br>/api/training/programs/*<br>/api/daily-training<br>/api/daily-training/* | training_sessions, notifications, player_programs, team_members, games, training_programs, training_weeks, training_session_templates, movement_patterns, warmup_protocols, training_phases, session_exercises, v_athlete_schedule, v_injuries_unified, daily_wellness_checkin, users, increment_training_points(), complete_training_session() |
| `training-complete` | POST | _(router submodule)_ | notifications, training_sessions, merlin_violation_log, increment_training_points(), complete_training_session() |
| `training-metrics` | GET | _(router submodule)_ | training_sessions, team_members, authorization_violations, account_pause_requests |
| `training-plan` | GET | _(router submodule)_ | training_sessions, player_programs, team_members, games, account_pause_requests |
| `training-programs` | GET | _(router submodule)_ | training_programs, training_weeks, training_session_templates, movement_patterns, warmup_protocols, training_phases, session_exercises, training_sessions, team_members, notifications, users, user_notification_preferences, sponsors |
| `training-sessions` | GET, POST, PUT, DELETE | _(router submodule)_ | training_sessions, team_members, authorization_violations, merlin_violation_log, billing_customers, subscriptions |
| `training-stats-enhanced` | GET | _(router submodule)_ | training_sessions, account_pause_requests |
| `training-suggestions` | GET, POST | _(router submodule)_ | training_sessions |
| `trends` | GET | /api/trends/*<br>/api/trends | training_sessions, games |
| `upload` | POST, DELETE | /api/upload<br>/api/upload/* | — |
| `user-context` | GET | _(router submodule)_ | users, v_injuries_unified, training_sessions, daily_wellness_checkin, supplement_logs, team_members, account_pause_requests |
| `user-profile` | OPTIONS | /api/user/context<br>/api/user-context<br>/api/user/context/*<br>/api/user-context/*<br>/api/user/profile<br>/api/user-profile<br>/api/user/profile/*<br>/api/user-profile/*<br>/api/privacy-settings/*<br>/api/privacy-settings<br>/api/parent-dashboard/*<br>/api/parent-dashboard | users, athlete_injuries, training_sessions, v_injuries_unified, daily_wellness_checkin, supplement_logs, team_members, privacy_settings, team_sharing_settings, parental_consent, privacy_audit_log |
| `user-profile-core` | GET, PUT | _(router submodule)_ | users, athlete_injuries, training_sessions, team_members, authorization_violations |
| `validate-invitation` | GET | _(router submodule)_ | team_invitations, team_members |
| `wearables` | GET | _(router submodule)_ | monitoring_providers, device_pairings, wearable_health |
| `weather` | GET | /api/weather/current<br>/api/weather/* | team_members |
| `weekend-games` | GET, POST | /api/weekend-games | training_sessions |
| `wellness` | OPTIONS | /api/sleep-data<br>/api/nutrition/*<br>/api/wellness/checkin<br>/api/wellness/checkin/*<br>/api/wellness/*<br>/api/hydration<br>/api/hydration/*<br>/api/wellness-checkin<br>/api/wellness-checkin/* | daily_wellness_checkin, users, recovery_blocks, notifications, team_members, ownership_transitions, shared_insights, event_availability, competition_events, nutrition_logs, player_streaks, coach_inbox_items, athlete_hydration_logs, athlete_nutrition_profiles, nutrition_plans, meal_templates, upsert_wellness_checkin(), update_player_streak(), award_achievement() |
| `wellness-checkin` | GET, POST | _(router submodule)_ | users, daily_wellness_checkin, recovery_blocks, notifications, team_members, ownership_transitions, shared_insights, event_availability, competition_events, nutrition_logs, player_streaks, coach_inbox_items, v_athlete_schedule, training_sessions, readiness_scores, athlete_injuries, athlete_consent_settings, authorization_violations, upsert_wellness_checkin(), update_player_streak(), award_achievement(), has_active_safety_override(), can_view_player_performance(), detect_pain_trigger(), detect_acwr_trigger() |
| `wellness-logs` | GET, POST | _(router submodule)_ | daily_wellness_checkin, athlete_consent_settings, readiness_scores, team_members, authorization_violations, has_active_safety_override(), can_view_player_performance(), detect_pain_trigger(), detect_acwr_trigger() |

## Orphaned (no frontend reference — do NOT rebuild; verify before reuse)

| Function | Methods | /api path(s) | Tables / RPCs touched |
|---|---|---|---|
| `alert-acknowledge` | PATCH | /api/alerts/:alertId/acknowledge<br>/api/alerts/:alertId/acknowledge/* | generated_alerts, team_members, authorization_violations |
| `alert-evaluate-rules` | POST | /api/alert-evaluate-rules<br>/api/alert-evaluate-rules/* | alert_rules, acwr_snapshots, generated_alerts, alert_delivery_logs, team_members |
| `alert-resolve` | PATCH | /api/alerts/:alertId/resolve<br>/api/alerts/:alertId/resolve/* | generated_alerts, team_members, athlete_injuries, acwr_snapshots, authorization_violations |
| `billing-lapse-check` | POST | _(no /api redirect)_ | subscriptions, billing_customers, users, team_members |
| `payments` | OPTIONS | /api/sponsors/*<br>/api/sponsors<br>/api/sponsor-logo/* | — |
| `physio-protocol` | GET, POST | _(no /api redirect)_ | return_to_play_phases ⚠️, rtp_exercise_compliance ⚠️, rtp_phase_milestones ⚠️, team_members, authorization_violations |
| `recovery-recommendations` | GET | _(no /api redirect)_ | performance_metrics ⚠️, rtp_athlete_protocol_assignments, individual_profiles ⚠️, training_sessions, team_members, authorization_violations, account_pause_requests |
| `rtp-advance-phase` | PATCH | /api/rtp/athletes/:athleteId/:injuryId/phase | rtp_athlete_protocol_assignments, rtp_functional_criteria, rtp_criteria_assessments, rtp_protocol_definitions, rtp_protocol_phases, team_members, authorization_violations |
| `rtp-create-assignment` | POST | /api/rtp/assignments | athlete_injuries, rtp_protocol_definitions, rtp_athlete_protocol_assignments, team_members, authorization_violations |
| `rtp-protocol-assignment` | GET | /api/rtp/protocols/:athleteId/:injuryId | rtp_athlete_protocol_assignments, rtp_protocol_phases, rtp_functional_criteria, rtp_criteria_assessments, team_members, authorization_violations |
| `rtp-team-protocols` | GET | /api/rtp/team/:teamId/protocols | rtp_athlete_protocol_assignments, users, team_members, authorization_violations |
| `session-load-import` | POST | /api/session-load-import | team_member_roles, monitoring_providers, device_pairings, session_load |
| `session-load-import-csv` | POST | /api/session-load-import/csv | team_member_roles, monitoring_providers, device_pairings, session_load |
| `stripe-checkout` | POST | _(no /api redirect)_ | billing_customers, team_members |
| `stripe-portal` | POST | _(no /api redirect)_ | team_members, billing_customers |
| `stripe-webhook` | POST | _(no /api redirect)_ | billing_customers, subscriptions, team_members, notifications, invoices |
| `team-practice-plan` | POST | /api/team-practice-plan | team_members, exercises |
| `wearable-health-ingest` | POST, PUT | /api/wearable-health-ingest | wearable_consent, wearable_health |
| `wearables-callback` | GET | /api/wearables/callback/* | device_pairings, monitoring_providers |
| `wearables-connect` | GET | /api/wearables/connect/* | monitoring_providers |
| `wearables-webhook` | POST | /api/wearables/webhook/* | monitoring_providers, device_pairings, wearable_consent, wearable_health |

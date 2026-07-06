-- Cleanup 2026-07-06: add FK constraints to *_id columns that had none.
-- All pairs pre-verified: matching types and 0 orphaned rows.
-- user_id -> users uses ON DELETE CASCADE to align with the GDPR hard-delete flow.
-- NOT included (varchar child vs uuid/int parent — FK impossible without a column-type
-- migration; logged in SOURCE_OF_TRUTH §6): games.team_id, game_events.{game_id,team_id},
-- flag_pull_stats/passing_stats/receiving_stats.game_id, situational_stats.user_id,
-- user_notification_preferences.user_id, position_specific_metrics.position_id (no parent table).

alter table public.event_availability
  add constraint event_availability_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.execution_logs
  add constraint execution_logs_exercise_id_fkey
  foreign key (exercise_id) references public.exercises(id) on delete set null;

alter table public.ff_exercise_mappings
  add constraint ff_exercise_mappings_exercisedb_exercise_id_fkey
  foreign key (exercisedb_exercise_id) references public.exercisedb_exercises(id) on delete cascade;

alter table public.flag_pull_stats
  add constraint flag_pull_stats_game_event_id_fkey
  foreign key (game_event_id) references public.game_events(id) on delete cascade;

alter table public.passing_stats
  add constraint passing_stats_game_event_id_fkey
  foreign key (game_event_id) references public.game_events(id) on delete cascade;

alter table public.receiving_stats
  add constraint receiving_stats_game_event_id_fkey
  foreign key (game_event_id) references public.game_events(id) on delete cascade;

alter table public.nutrition_reports
  add constraint nutrition_reports_team_id_fkey
  foreign key (team_id) references public.teams(id) on delete set null;

alter table public.proactive_checkins
  add constraint proactive_checkins_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.readiness_scores
  add constraint readiness_scores_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.team_activities
  add constraint team_activities_team_id_fkey
  foreign key (team_id) references public.teams(id) on delete cascade;

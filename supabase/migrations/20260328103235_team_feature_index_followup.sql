-- Follow-up indexes for recently restored team/tournament/realtime features.

CREATE INDEX IF NOT EXISTS idx_tournament_day_plans_team_date
  ON public.tournament_day_plans(team_id, tournament_date DESC)
  WHERE team_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_team_preferences_created_by
  ON public.team_preferences(created_by);

CREATE INDEX IF NOT EXISTS idx_tournament_lineups_tournament_id
  ON public.tournament_lineups(tournament_id);

CREATE INDEX IF NOT EXISTS idx_tournament_lineups_saved_by
  ON public.tournament_lineups(saved_by);

CREATE INDEX IF NOT EXISTS idx_tournaments_created_by
  ON public.tournaments(created_by);

CREATE INDEX IF NOT EXISTS idx_coach_activity_log_coach_id
  ON public.coach_activity_log(coach_id);

CREATE INDEX IF NOT EXISTS idx_coach_activity_log_player_id
  ON public.coach_activity_log(player_id);

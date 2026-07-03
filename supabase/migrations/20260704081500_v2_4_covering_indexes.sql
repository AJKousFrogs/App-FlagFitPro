-- Covering indexes for the two unindexed-FK performance advisories the
-- Supabase linter flagged immediately after applying the V2.0/V2.4
-- event_games and athlete_travel_log migrations.
CREATE INDEX IF NOT EXISTS idx_athlete_travel_log_team_id
  ON public.athlete_travel_log (team_id);
CREATE INDEX IF NOT EXISTS idx_event_games_created_by
  ON public.event_games (created_by);

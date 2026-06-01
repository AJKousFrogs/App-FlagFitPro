-- Game-tracking consolidation: anchor per-game records to the schedule spine.
-- A game belongs to a scheduled competition_event (e.g. one of the 8 games of a tournament
-- weekend). Additive (games is empty; existing consumers unaffected). This also lets a future
-- stats feature derive event_participation.games_played from game_participations per event.
-- (The legacy free-text games.tournament_name is now superseded by this link → the event's
-- competition; left in place to avoid touching consumers, but redundant.)
ALTER TABLE public.games
  ADD COLUMN competition_event_id uuid REFERENCES public.competition_events(id) ON DELETE SET NULL;
CREATE INDEX idx_games_competition_event ON public.games(competition_event_id);

COMMENT ON COLUMN public.games.competition_event_id IS
  'The scheduled competition_event (spine) this game belongs to. games_played for an athlete '
  'at an event = count of game_participations for that event''s games — feeds event_participation/ACWR.';

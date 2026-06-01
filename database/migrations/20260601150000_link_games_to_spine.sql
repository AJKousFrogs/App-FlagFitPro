-- Game-tracking consolidation: link per-game records to the schedule spine.
-- Applied via Supabase MCP 2026-06-01. Additive (games empty; consumers unaffected).
-- A game belongs to a scheduled competition_event; enables future derivation of
-- event_participation.games_played from per-game game_participations.
ALTER TABLE public.games
  ADD COLUMN competition_event_id uuid REFERENCES public.competition_events(id) ON DELETE SET NULL;
CREATE INDEX idx_games_competition_event ON public.games(competition_event_id);

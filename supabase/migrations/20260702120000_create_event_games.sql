-- V2.0 Tournament Mode — event_games: per-game kickoff times, a child of the
-- schedule spine (competition_events). V1 only knew a tournament day as a
-- COUNT (expected_game_count); it could not tell an athlete when to re-warm-up
-- or what to eat between game 2 and game 3 vs game 3 and game 4. This table
-- lets a coach enter the actual kickoff times once (bulk paste: "11:00,
-- 12:30, 15:30, 17:00") so the client gap-classification engine
-- (tournament-plan.service.ts) can generate a per-gap warm-up + fueling
-- timeline. Deliberately scoped to competition_events (team-scheduled) for
-- V2.0 — athlete-entered `athlete_events` per-game timing is a documented
-- V2.1+ extension (see docs/v2/V2.0-tournament-mode.md), not built here.
--
-- team_id is denormalized from competition_events for RLS/index simplicity
-- and is trigger-enforced (never trusted from the client) so it can never
-- drift from its parent event.
CREATE TABLE IF NOT EXISTS public.event_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_event_id uuid NOT NULL REFERENCES public.competition_events(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  game_number int NOT NULL,
  game_date date NOT NULL,
  kickoff_time time NOT NULL,
  expected_duration_minutes int NOT NULL DEFAULT 40,
  opponent text,
  field text,
  bracket_stage text,
  is_provisional boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'scheduled',
  result jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_games_number_chk CHECK (game_number BETWEEN 1 AND 20),
  CONSTRAINT event_games_duration_chk CHECK (expected_duration_minutes BETWEEN 10 AND 120),
  CONSTRAINT event_games_bracket_chk CHECK (
    bracket_stage IS NULL OR bracket_stage IN
      ('group', 'pool', 'quarterfinal', 'semifinal', 'final', 'placement', 'friendly')
  ),
  CONSTRAINT event_games_status_chk CHECK (
    status IN ('scheduled', 'in_progress', 'final', 'cancelled')
  ),
  CONSTRAINT event_games_unique_number UNIQUE (competition_event_id, game_number)
);

CREATE INDEX IF NOT EXISTS idx_event_games_event
  ON public.event_games (competition_event_id, kickoff_time);
CREATE INDEX IF NOT EXISTS idx_event_games_team_date
  ON public.event_games (team_id, game_date);

-- team_id is always derived from the parent competition_event, never trusted
-- from the client — INSERT/UPDATE can't drift it or spoof a different team.
CREATE OR REPLACE FUNCTION public.event_games_sync_team_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  SELECT team_id INTO NEW.team_id
  FROM public.competition_events
  WHERE id = NEW.competition_event_id;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_event_games_sync_team_id ON public.event_games;
CREATE TRIGGER trg_event_games_sync_team_id
  BEFORE INSERT OR UPDATE ON public.event_games
  FOR EACH ROW EXECUTE FUNCTION public.event_games_sync_team_id();

ALTER TABLE public.event_games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_games_select ON public.event_games;
CREATE POLICY event_games_select
  ON public.event_games
  FOR SELECT
  TO authenticated
  USING (public.ff_is_active_team_member(team_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS event_games_insert ON public.event_games;
CREATE POLICY event_games_insert
  ON public.event_games
  FOR INSERT
  TO authenticated
  WITH CHECK (public.ff_is_team_staff(team_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS event_games_update ON public.event_games;
CREATE POLICY event_games_update
  ON public.event_games
  FOR UPDATE
  TO authenticated
  USING (public.ff_is_team_staff(team_id, (SELECT auth.uid())))
  WITH CHECK (public.ff_is_team_staff(team_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS event_games_delete ON public.event_games;
CREATE POLICY event_games_delete
  ON public.event_games
  FOR DELETE
  TO authenticated
  USING (public.ff_is_team_staff(team_id, (SELECT auth.uid())));

-- Per-game actuals: event_participation stays the day-level record (existing
-- record_event_participation RPC); game_id lets a future per-game quick-log
-- (V2.0 follow-up) attribute minutes/RPE/flags to a specific game instead of
-- only the day total, so ACWR can use real per-game load over the flat
-- ~350 AU/game estimate. Nullable — day-level-only logging keeps working.
ALTER TABLE public.event_participation
  ADD COLUMN IF NOT EXISTS game_id uuid REFERENCES public.event_games(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_event_participation_game
  ON public.event_participation (game_id);

COMMENT ON TABLE public.event_games IS
  'Per-game kickoff times for a competition_event (tournament day). Coach-entered (bulk paste); drives the client gap-classification/timeline engine (tournament-plan.service.ts). team_id trigger-synced from the parent event.';
COMMENT ON COLUMN public.event_games.kickoff_time IS
  'Venue-local time of day, no timezone (matches games.game_time convention) — the gap engine only needs local wall-clock deltas.';
COMMENT ON COLUMN public.event_games.is_provisional IS
  'Bracket-dependent games ("if we win, ~15:30") are provisional until the coach confirms — UI shows an unconfirmed marker; the timeline still generates off the provisional time.';
COMMENT ON COLUMN public.event_participation.game_id IS
  'Optional link to the specific event_games row this participation record covers (per-game actuals). NULL = day-level-only logging (legacy path, still valid).';

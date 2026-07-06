-- RESTORE: 20260706185636_retire_dead_tables_and_dead_rls_branches dropped
-- event_games and athlete_travel_log based on main-branch-only evidence. The
-- unmerged Tournament Mode v2.x branch (claude/codebase-audit-v2-proposal-d81ayk)
-- deployed these tables to live on 2026-07-03 and its code (event-games.js,
-- event-travel.js, event-games.service.ts, tournament-plan.service.ts) reads/writes
-- them. Restoring schema verbatim from that branch's migrations
-- (20260702120000_create_event_games.sql, 20260704080000_extend_athlete_travel_log.sql
-- + base table from 20260222202932). Both tables had 0 rows at drop time, so
-- schema restoration is full restoration.

-- ── event_games ─────────────────────────────────────────────────────────────
CREATE TABLE public.event_games (
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

CREATE INDEX idx_event_games_event
  ON public.event_games (competition_event_id, kickoff_time);
CREATE INDEX idx_event_games_team_date
  ON public.event_games (team_id, game_date);
CREATE INDEX idx_event_games_created_by
  ON public.event_games (created_by);

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
REVOKE EXECUTE ON FUNCTION public.event_games_sync_team_id() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_event_games_sync_team_id
  BEFORE INSERT OR UPDATE ON public.event_games
  FOR EACH ROW EXECUTE FUNCTION public.event_games_sync_team_id();

ALTER TABLE public.event_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY event_games_select ON public.event_games
  FOR SELECT TO authenticated
  USING (public.ff_is_active_team_member(team_id, (SELECT auth.uid())));
CREATE POLICY event_games_insert ON public.event_games
  FOR INSERT TO authenticated
  WITH CHECK (public.ff_is_team_staff(team_id, (SELECT auth.uid())));
CREATE POLICY event_games_update ON public.event_games
  FOR UPDATE TO authenticated
  USING (public.ff_is_team_staff(team_id, (SELECT auth.uid())))
  WITH CHECK (public.ff_is_team_staff(team_id, (SELECT auth.uid())));
CREATE POLICY event_games_delete ON public.event_games
  FOR DELETE TO authenticated
  USING (public.ff_is_team_staff(team_id, (SELECT auth.uid())));

ALTER TABLE public.event_participation
  ADD COLUMN game_id uuid REFERENCES public.event_games(id) ON DELETE SET NULL;
CREATE INDEX idx_event_participation_game
  ON public.event_participation (game_id);

COMMENT ON TABLE public.event_games IS
  'Per-game kickoff times for a competition_event (tournament day). Coach-entered (bulk paste); drives the client gap-classification/timeline engine (tournament-plan.service.ts). team_id trigger-synced from the parent event.';
COMMENT ON COLUMN public.event_games.kickoff_time IS
  'Venue-local time of day, no timezone (matches games.game_time convention) — the gap engine only needs local wall-clock deltas.';
COMMENT ON COLUMN public.event_games.is_provisional IS
  'Bracket-dependent games ("if we win, ~15:30") are provisional until the coach confirms — UI shows an unconfirmed marker; the timeline still generates off the provisional time.';
COMMENT ON COLUMN public.event_participation.game_id IS
  'Optional link to the specific event_games row this participation record covers (per-game actuals). NULL = day-level-only logging (legacy path, still valid).';

-- ── athlete_travel_log (final v2.4 shape: base 20260222202932 + extension) ──
CREATE TABLE public.athlete_travel_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  arrival_date date,
  adaptation_day integer,
  timezone_difference integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  competition_event_id uuid REFERENCES public.competition_events(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'car',
  depart_at timestamptz NOT NULL,
  arrive_at timestamptz NOT NULL,
  overnight_stay boolean NOT NULL DEFAULT false,
  CONSTRAINT athlete_travel_log_mode_chk CHECK (mode IN ('bus', 'car', 'plane', 'train', 'other')),
  CONSTRAINT athlete_travel_log_arrive_chk CHECK (arrive_at >= depart_at)
);

CREATE INDEX idx_athlete_travel_log_user_arrival
  ON public.athlete_travel_log (user_id, arrival_date DESC);
CREATE INDEX idx_athlete_travel_log_user_depart
  ON public.athlete_travel_log (user_id, depart_at);
CREATE INDEX idx_athlete_travel_log_event
  ON public.athlete_travel_log (competition_event_id);

CREATE OR REPLACE FUNCTION public.athlete_travel_log_sync_team_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.competition_event_id IS NOT NULL THEN
    SELECT team_id INTO NEW.team_id
    FROM public.competition_events
    WHERE id = NEW.competition_event_id;
  END IF;
  NEW.arrival_date := NEW.arrive_at::date;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.athlete_travel_log_sync_team_id() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_athlete_travel_log_sync_team_id
  BEFORE INSERT OR UPDATE ON public.athlete_travel_log
  FOR EACH ROW EXECUTE FUNCTION public.athlete_travel_log_sync_team_id();

ALTER TABLE public.athlete_travel_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY athlete_travel_log_own ON public.athlete_travel_log
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY athlete_travel_log_team_staff_select ON public.athlete_travel_log
  FOR SELECT TO authenticated
  USING (team_id IS NOT NULL AND public.ff_is_team_staff(team_id, (SELECT auth.uid())));

COMMENT ON TABLE public.athlete_travel_log IS
  'Athlete-declared travel leg, optionally linked to a competition_event (team trip). Feeds V2.1''s proactive travel card and V2.4''s heat/cold acclimatization guard. adaptation_day tracks days since arrival for acclimatization protocols; timezone_difference (signed hours, east=positive) drives jet-lag guidance.';
COMMENT ON COLUMN public.athlete_travel_log.adaptation_day IS
  'Days since arrival at the destination climate/timezone (0 = arrival day). Used by the V2.4 acclimatization guard to taper caution as the athlete adapts — heat/cold/jet-lag risk is highest on days 0-3 and eases through ~10-14 days.';
COMMENT ON COLUMN public.athlete_travel_log.timezone_difference IS
  'Signed hours crossed (positive = travelling east/later timezone). NULL = no timezone change / unknown.';

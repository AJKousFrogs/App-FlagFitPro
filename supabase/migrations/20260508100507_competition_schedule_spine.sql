-- =============================================================================
-- COMPETITION SCHEDULE SPINE
-- Canonical competition + event model that feeds periodization, readiness,
-- nutrition, and recovery.
-- =============================================================================

-- COMPETITIONS (shared registry)
CREATE TABLE IF NOT EXISTS public.competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text,
  kind text NOT NULL DEFAULT 'league',
  level text NOT NULL DEFAULT 'national',
  country text,
  governing_body text,
  format text DEFAULT '5v5',
  season_year int,
  starts_on date,
  ends_on date,
  external_id text,
  source text NOT NULL DEFAULT 'manual',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT competitions_kind_chk CHECK (
    kind IN ('league', 'cup', 'tournament', 'friendly')
  ),
  CONSTRAINT competitions_level_chk CHECK (
    level IN ('club', 'regional', 'national', 'international', 'continental', 'world', 'olympic')
  ),
  CONSTRAINT competitions_source_chk CHECK (
    source IN ('manual', 'federation_import', 'sync')
  ),
  CONSTRAINT competitions_dates_chk CHECK (
    ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on
  ),
  CONSTRAINT competitions_unique_per_season UNIQUE (name, season_year)
);

CREATE INDEX IF NOT EXISTS idx_competitions_kind         ON public.competitions (kind);
CREATE INDEX IF NOT EXISTS idx_competitions_season_year  ON public.competitions (season_year);
CREATE INDEX IF NOT EXISTS idx_competitions_country      ON public.competitions (country);
CREATE INDEX IF NOT EXISTS idx_competitions_starts_on    ON public.competitions (starts_on);

-- COMPETITION EVENTS (per team x date calendar slot)
CREATE TABLE IF NOT EXISTS public.competition_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  expected_game_count int NOT NULL DEFAULT 1,
  importance text NOT NULL DEFAULT 'regular',
  label text,
  location text,
  venue text,
  notes text,
  status text NOT NULL DEFAULT 'scheduled',
  external_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT comp_events_importance_chk CHECK (
    importance IN ('regular', 'high', 'peak')
  ),
  CONSTRAINT comp_events_status_chk CHECK (
    status IN ('scheduled', 'live', 'completed', 'cancelled', 'postponed')
  ),
  CONSTRAINT comp_events_game_count_chk CHECK (
    expected_game_count BETWEEN 1 AND 20
  ),
  CONSTRAINT comp_events_ends_chk CHECK (
    ends_at IS NULL OR ends_at >= starts_at
  )
);

CREATE INDEX IF NOT EXISTS idx_comp_events_team_starts  ON public.competition_events (team_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_comp_events_competition  ON public.competition_events (competition_id);
CREATE INDEX IF NOT EXISTS idx_comp_events_starts_at    ON public.competition_events (starts_at);
CREATE INDEX IF NOT EXISTS idx_comp_events_status       ON public.competition_events (status);

-- ROW LEVEL SECURITY
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS competitions_select ON public.competitions;
CREATE POLICY competitions_select
  ON public.competitions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS competitions_insert ON public.competitions;
CREATE POLICY competitions_insert
  ON public.competitions
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS competitions_update ON public.competitions;
CREATE POLICY competitions_update
  ON public.competitions
  FOR UPDATE
  TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS competition_events_select ON public.competition_events;
CREATE POLICY competition_events_select
  ON public.competition_events
  FOR SELECT
  TO authenticated
  USING (
    public.ff_is_active_team_member(team_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS competition_events_insert ON public.competition_events;
CREATE POLICY competition_events_insert
  ON public.competition_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS competition_events_update ON public.competition_events;
CREATE POLICY competition_events_update
  ON public.competition_events
  FOR UPDATE
  TO authenticated
  USING (public.ff_is_team_staff(team_id, (SELECT auth.uid())))
  WITH CHECK (public.ff_is_team_staff(team_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS competition_events_delete ON public.competition_events;
CREATE POLICY competition_events_delete
  ON public.competition_events
  FOR DELETE
  TO authenticated
  USING (public.ff_is_team_staff(team_id, (SELECT auth.uid())));

-- ATHLETE SCHEDULE VIEW
CREATE OR REPLACE VIEW public.v_athlete_schedule AS
SELECT
  ce.id,
  ce.competition_id,
  ce.team_id,
  ce.starts_at,
  ce.ends_at,
  ce.expected_game_count,
  ce.importance,
  ce.label,
  ce.location,
  ce.venue,
  ce.notes,
  ce.status,
  ce.external_id,
  ce.metadata,
  ce.created_at,
  ce.updated_at,
  c.name           AS competition_name,
  c.short_name     AS competition_short_name,
  c.kind           AS competition_kind,
  c.level          AS competition_level,
  c.country        AS competition_country,
  c.season_year    AS competition_season_year,
  t.name           AS team_name,
  tm.user_id       AS athlete_id
FROM public.competition_events ce
JOIN public.competitions c ON c.id = ce.competition_id
JOIN public.teams t        ON t.id = ce.team_id
JOIN public.team_members tm
  ON tm.team_id = ce.team_id
  AND tm.status = 'active';

GRANT SELECT ON public.v_athlete_schedule TO authenticated;

COMMENT ON TABLE public.competitions IS
  'Shared registry of competitions (leagues, cups, tournaments). One row per competition×season.';
COMMENT ON TABLE public.competition_events IS
  'Per-team calendar slot inside a competition. expected_game_count drives density-aware load planning.';
COMMENT ON COLUMN public.competition_events.importance IS
  'regular | high | peak — peak events become taper anchors for periodization.';
COMMENT ON COLUMN public.competition_events.expected_game_count IS
  'Total games this team is expected to play during this event (1 league round = ~3, full tournament day = up to 8).';
COMMENT ON VIEW public.v_athlete_schedule IS
  'Athlete schedule: union of competition_events across active team memberships. Filter by athlete_id.';

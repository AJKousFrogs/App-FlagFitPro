-- V2.4 — extend the existing (live, unwired, 0-row) athlete_travel_log
-- rather than ship a competing event_travel table. Discovered via Supabase
-- MCP introspection during the V2.4 global-climate/international-tournament
-- work: athlete_travel_log already exists (migration
-- 20260314094827_create_tournament_day_plans.sql's neighbourhood — check
-- live schema, not this repo's DATA_MODEL.md, which is stale for this
-- table) with arrival_date/adaptation_day/timezone_difference and an
-- owner-only RLS policy, but zero frontend/backend callers. Rather than add
-- a same-concept event_travel table (the earlier V2.1 commit on this branch
-- did exactly that before this session's live-schema check caught it — see
-- docs/v2/V2.4-global-tiers.md), this migration extends the existing table
-- to the shape the V2.1 travel-card + V2.4 acclimatization-guard code needs.
-- Zero rows live at the time of this migration, so every ALTER here is safe
-- with no backfill risk.
ALTER TABLE public.athlete_travel_log
  ADD COLUMN IF NOT EXISTS competition_event_id uuid REFERENCES public.competition_events(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'car',
  ADD COLUMN IF NOT EXISTS depart_at timestamptz,
  ADD COLUMN IF NOT EXISTS arrive_at timestamptz,
  ADD COLUMN IF NOT EXISTS overnight_stay boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes text;

-- Backfill arrive_at from the legacy date-only arrival_date for any row that
-- somehow predates this migration (defensive — table is empty on this
-- project today, but a migration must be correct if ever replayed against a
-- populated one).
UPDATE public.athlete_travel_log
  SET arrive_at = arrival_date::timestamptz
  WHERE arrive_at IS NULL AND arrival_date IS NOT NULL;

ALTER TABLE public.athlete_travel_log
  ALTER COLUMN arrive_at SET NOT NULL,
  ALTER COLUMN depart_at SET NOT NULL,
  -- arrival_date (legacy date-only column, still NOT NULL from the original
  -- schema) is superseded by arrive_at going forward — the sync trigger below
  -- keeps it populated for any old reader, but new writers should target
  -- arrive_at/depart_at, not this column.
  ALTER COLUMN arrival_date DROP NOT NULL;

ALTER TABLE public.athlete_travel_log
  ADD CONSTRAINT athlete_travel_log_mode_chk CHECK (mode IN ('bus', 'car', 'plane', 'train', 'other')),
  ADD CONSTRAINT athlete_travel_log_arrive_chk CHECK (arrive_at >= depart_at);

CREATE INDEX IF NOT EXISTS idx_athlete_travel_log_user_depart
  ON public.athlete_travel_log (user_id, depart_at);
CREATE INDEX IF NOT EXISTS idx_athlete_travel_log_event
  ON public.athlete_travel_log (competition_event_id);

-- team_id trigger-synced when a competition_event is linked — same pattern
-- as event_games (V2.0), so a coach-declared team trip can't drift or be
-- spoofed to a different team. A personal (no event) leg keeps whatever
-- team_id (if any) the athlete passed.
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
  -- Keep the legacy date-only column populated for any reader that predates
  -- the arrive_at/depart_at columns this migration adds.
  NEW.arrival_date := NEW.arrive_at::date;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_athlete_travel_log_sync_team_id ON public.athlete_travel_log;
CREATE TRIGGER trg_athlete_travel_log_sync_team_id
  BEFORE INSERT OR UPDATE ON public.athlete_travel_log
  FOR EACH ROW EXECUTE FUNCTION public.athlete_travel_log_sync_team_id();

-- Existing `athlete_travel_log_own` (FOR ALL, owner-only) is untouched and
-- still covers the owner's full CRUD. This ADDS team-staff visibility for a
-- team-linked leg (so a coach can see who's arriving late for an
-- international tournament) — permissive policies are OR'd, so this is
-- purely additive.
DROP POLICY IF EXISTS athlete_travel_log_team_staff_select ON public.athlete_travel_log;
CREATE POLICY athlete_travel_log_team_staff_select
  ON public.athlete_travel_log
  FOR SELECT
  TO authenticated
  USING (team_id IS NOT NULL AND public.ff_is_team_staff(team_id, (SELECT auth.uid())));

COMMENT ON TABLE public.athlete_travel_log IS
  'Athlete-declared travel leg, optionally linked to a competition_event (team trip). Feeds V2.1''s proactive travel card and V2.4''s heat/cold acclimatization guard. adaptation_day tracks days since arrival for acclimatization protocols; timezone_difference (signed hours, east=positive) drives jet-lag guidance.';
COMMENT ON COLUMN public.athlete_travel_log.adaptation_day IS
  'Days since arrival at the destination climate/timezone (0 = arrival day). Used by the V2.4 acclimatization guard to taper caution as the athlete adapts — heat/cold/jet-lag risk is highest on days 0-3 and eases through ~10-14 days.';
COMMENT ON COLUMN public.athlete_travel_log.timezone_difference IS
  'Signed hours crossed (positive = travelling east/later timezone). NULL = no timezone change / unknown.';

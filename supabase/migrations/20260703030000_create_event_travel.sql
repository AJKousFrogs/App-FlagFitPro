-- V2.1 — event_travel: travel legs attached to a schedule-spine event, so the
-- readiness penalty in calc-readiness.js (daily_wellness_checkin.travel_hours,
-- reactive/after-the-fact) gets a proactive counterpart — the athlete (or
-- coach, for a team-arranged trip) declares a leg once and the client can
-- prefill/pre-warn instead of waiting for the same-day self-report. Athlete-
-- owned (like athlete_events) but optionally linked to a team competition_event
-- so a coach-arranged team bus/flight can be declared once and read by every
-- athlete on that trip.
CREATE TABLE IF NOT EXISTS public.event_travel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competition_event_id uuid REFERENCES public.competition_events(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'car',
  depart_at timestamptz NOT NULL,
  arrive_at timestamptz NOT NULL,
  timezone_delta_hours numeric,
  overnight_stay boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_travel_mode_chk CHECK (mode IN ('bus', 'car', 'plane', 'train', 'other')),
  CONSTRAINT event_travel_arrive_chk CHECK (arrive_at >= depart_at)
);

CREATE INDEX IF NOT EXISTS idx_event_travel_user_depart
  ON public.event_travel (user_id, depart_at);
CREATE INDEX IF NOT EXISTS idx_event_travel_event
  ON public.event_travel (competition_event_id);

-- team_id is trigger-synced from the parent competition_event when one is
-- linked, same pattern as event_games — a coach-declared team trip can't
-- drift or be spoofed to a different team. A personal (no event) leg keeps
-- whatever team_id the athlete passed (nullable — travel with no team link
-- has no team-scoped visibility, it's owner-only, see RLS below).
CREATE OR REPLACE FUNCTION public.event_travel_sync_team_id()
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
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_event_travel_sync_team_id ON public.event_travel;
CREATE TRIGGER trg_event_travel_sync_team_id
  BEFORE INSERT OR UPDATE ON public.event_travel
  FOR EACH ROW EXECUTE FUNCTION public.event_travel_sync_team_id();

ALTER TABLE public.event_travel ENABLE ROW LEVEL SECURITY;

-- Owner always sees their own legs; team staff can see a team-linked leg
-- (so a coach can see who's arriving late) even if they didn't create it.
DROP POLICY IF EXISTS event_travel_select ON public.event_travel;
CREATE POLICY event_travel_select
  ON public.event_travel
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (team_id IS NOT NULL AND public.ff_is_team_staff(team_id, (SELECT auth.uid())))
  );

DROP POLICY IF EXISTS event_travel_insert ON public.event_travel;
CREATE POLICY event_travel_insert
  ON public.event_travel
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS event_travel_update ON public.event_travel;
CREATE POLICY event_travel_update
  ON public.event_travel
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS event_travel_delete ON public.event_travel;
CREATE POLICY event_travel_delete
  ON public.event_travel
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

COMMENT ON TABLE public.event_travel IS
  'Athlete-declared travel leg, optionally linked to a competition_event. Feeds a proactive travel card (client) — the reactive readiness penalty (daily_wellness_checkin.travel_hours in calc-readiness.js) is unchanged and still the safety backstop when no leg is declared.';
COMMENT ON COLUMN public.event_travel.timezone_delta_hours IS
  'Signed hours crossed (positive = travelling east/later timezone). NULL = no timezone change / unknown. Drives the (currently doc-only, V2.2+) jet-lag card threshold of |delta| >= 2h.';

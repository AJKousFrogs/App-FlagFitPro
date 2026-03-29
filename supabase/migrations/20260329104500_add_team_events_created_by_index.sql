BEGIN;

CREATE INDEX IF NOT EXISTS idx_team_events_created_by
  ON public.team_events(created_by);

COMMIT;

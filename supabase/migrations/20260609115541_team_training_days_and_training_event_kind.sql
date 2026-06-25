-- Recurring flag-football team-practice days (weekday set + default time),
-- declared by the athlete (Settings) and consumed by the periodization engine:
-- on a practice day, practice is the session and only light complementary work
-- is prescribed. Applied to the remote project via Supabase MCP; kept here for
-- repo parity.
alter table public.athlete_training_config
  add column if not exists team_training_days jsonb not null
  default '{"days": [], "time": "18:00"}'::jsonb;

-- Allow athlete_events to represent a one-off team training (per-week override),
-- distinct from competition events (gameday/tournament/camp/friendly).
alter table public.athlete_events drop constraint if exists athlete_events_kind_check;
alter table public.athlete_events
  add constraint athlete_events_kind_check
  check (kind in ('gameday','tournament','camp','friendly','training','other'));

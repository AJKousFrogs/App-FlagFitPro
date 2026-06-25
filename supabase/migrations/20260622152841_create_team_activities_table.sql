-- team-activity-resolver (daily-protocol path) reads this table to decide whether a
-- coach-scheduled team activity replaces the athlete's individual session (LOAD-
-- affecting). The table never existed → resolver erred and fell through to inert.
-- Create it matching the resolver's reads so the drift is gone and the resolver
-- functions (returns empty → no load change) until a coach-calendar writer + the
-- deliberate activation land as a tested change.
create table if not exists public.team_activities (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null,
  date date not null,
  type text not null,
  start_time_local text,
  end_time_local text,
  location text,
  note text,
  replaces_session boolean not null default false,
  weather_override jsonb,
  created_by_coach_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.team_activities enable row level security;
create index if not exists team_activities_team_date_idx
  on public.team_activities (team_id, date);

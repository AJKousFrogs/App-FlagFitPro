-- Athlete-owned schedule events (personal / domestic league / national-team).
-- Entered by the athlete and merged into their schedule snapshot
-- (/api/schedule) so the periodization engine tapers/recovers around them.
-- Applied to the remote project via Supabase MCP; kept here for repo parity.
create table if not exists public.athlete_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'personal'
    check (category in ('personal','domestic','national')),
  kind text not null default 'gameday'
    check (kind in ('gameday','tournament','camp','friendly','other')),
  title text not null check (length(title) between 1 and 160),
  starts_at timestamptz not null,
  ends_at timestamptz,
  expected_game_count integer not null default 1
    check (expected_game_count >= 0 and expected_game_count <= 50),
  importance text not null default 'regular'
    check (importance in ('regular','high','peak')),
  location text check (location is null or length(location) <= 200),
  venue text check (venue is null or length(venue) <= 200),
  notes text check (notes is null or length(notes) <= 2000),
  status text not null default 'scheduled'
    check (status in ('scheduled','live','completed','cancelled','postponed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint athlete_events_ends_after_starts
    check (ends_at is null or ends_at >= starts_at)
);

create index if not exists idx_athlete_events_user_starts
  on public.athlete_events (user_id, starts_at);

create or replace function public.athlete_events_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_athlete_events_updated_at on public.athlete_events;
create trigger trg_athlete_events_updated_at
  before update on public.athlete_events
  for each row execute function public.athlete_events_set_updated_at();

alter table public.athlete_events enable row level security;

drop policy if exists athlete_events_select_own on public.athlete_events;
create policy athlete_events_select_own on public.athlete_events
  for select using (auth.uid() = user_id);

drop policy if exists athlete_events_insert_own on public.athlete_events;
create policy athlete_events_insert_own on public.athlete_events
  for insert with check (auth.uid() = user_id);

drop policy if exists athlete_events_update_own on public.athlete_events;
create policy athlete_events_update_own on public.athlete_events
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists athlete_events_delete_own on public.athlete_events;
create policy athlete_events_delete_own on public.athlete_events
  for delete using (auth.uid() = user_id);

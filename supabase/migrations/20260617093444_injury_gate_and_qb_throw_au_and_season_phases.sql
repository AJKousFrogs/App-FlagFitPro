-- Reconstructed from live schema (Supabase MCP) — original file was never committed.

alter table public.users
  add column if not exists injury_gate_active boolean not null default false,
  add column if not exists injury_gate_set_at timestamptz;

alter table public.training_sessions
  add column if not exists throw_count integer,
  add column if not exists throw_au numeric;

create table if not exists public.team_season_phases (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  phase_key text not null,
  phase_label text,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint tsp_phase_key_check check (phase_key = any (array[
    'off_season', 'pre_season_early', 'pre_season_late', 'in_season', 'tournament_week',
    'deload', 'taper', 'foundation', 'strength_accumulation', 'power_development',
    'speed_development', 'competition_prep', 'in_season_maintenance', 'mid_season_reload',
    'peak', 'active_recovery', 'off_season_rest'
  ]::text[])),
  constraint team_season_phases_team_id_start_date_key unique (team_id, start_date)
);

create index if not exists team_season_phases_team_id_start_date_end_date_idx
  on public.team_season_phases (team_id, start_date, end_date) where (is_active = true);

alter table public.team_season_phases enable row level security;

drop policy if exists tsp_read on public.team_season_phases;
create policy tsp_read on public.team_season_phases
  for select using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = team_season_phases.team_id
        and team_members.user_id = auth.uid()
    )
  );

drop policy if exists tsp_coach_write on public.team_season_phases;
create policy tsp_coach_write on public.team_season_phases
  for all using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = team_season_phases.team_id
        and team_members.user_id = auth.uid()
        and team_members.role::text = any (array['coach', 'head_coach', 'assistant_coach']::text[])
    )
  );

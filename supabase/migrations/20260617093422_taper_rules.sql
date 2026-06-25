-- Reconstructed from live schema (Supabase MCP) — original file was never committed.

create table if not exists public.taper_rules (
  id uuid primary key default gen_random_uuid(),
  tournament_level text not null,
  taper_days integer not null,
  volume_reduction_pct numeric not null,
  volume_floor_pct numeric not null,
  intensity_retention numeric not null,
  methodology_citation text not null,
  is_active boolean not null default true
);

create unique index if not exists taper_rules_tournament_level_key on public.taper_rules (tournament_level);

alter table public.taper_rules enable row level security;

drop policy if exists taper_rules_read on public.taper_rules;
create policy taper_rules_read on public.taper_rules
  for select using (true);

-- Reconstructed from live schema (Supabase MCP) — original file was never committed.

create table if not exists public.contraindication_rules (
  id uuid primary key default gen_random_uuid(),
  injury_location text not null,
  blocked_modality text not null,
  rtp_phase_cleared_at integer,
  gate_level text not null default 'hard',
  methodology_citation text not null,
  is_active boolean not null default true
);

create unique index if not exists contraindication_rules_injury_location_blocked_modality_key
  on public.contraindication_rules (injury_location, blocked_modality);

alter table public.contraindication_rules enable row level security;

drop policy if exists contraindication_rules_read on public.contraindication_rules;
create policy contraindication_rules_read on public.contraindication_rules
  for select using (true);

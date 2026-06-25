-- Reconstructed from live schema (Supabase MCP) — original file was never committed.

create table if not exists public.weather_substitution_rules (
  id uuid primary key default gen_random_uuid(),
  original_modality text not null,
  condition text not null,
  threshold_value numeric,
  threshold_unit text,
  threshold_direction text not null default 'below',
  substitute_modality text not null,
  substitute_rationale text not null,
  is_active boolean not null default true
);

create unique index if not exists weather_substitution_rules_original_modality_condition_key
  on public.weather_substitution_rules (original_modality, condition);

create index if not exists weather_substitution_rules_original_modality_condition_idx
  on public.weather_substitution_rules (original_modality, condition);

alter table public.weather_substitution_rules enable row level security;

drop policy if exists weather_rules_read on public.weather_substitution_rules;
create policy weather_rules_read on public.weather_substitution_rules
  for select using (true);

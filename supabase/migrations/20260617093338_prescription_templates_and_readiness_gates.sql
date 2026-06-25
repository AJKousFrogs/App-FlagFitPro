-- Reconstructed from live schema (Supabase MCP) — original file was never committed.

create table if not exists public.prescription_templates (
  id uuid primary key default gen_random_uuid(),
  modality text not null,
  intensity_zone text,
  position_group text,
  periodization_phase text,
  prescribed_sets integer,
  prescribed_reps integer,
  prescribed_hold_seconds integer,
  prescribed_distance_m integer,
  prescribed_duration_s integer,
  rest_seconds integer,
  load_contribution_au numeric not null,
  methodology_citation text not null,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prescription_templates_modality_position_group_periodizatio_idx
  on public.prescription_templates (modality, position_group, periodization_phase, intensity_zone);

alter table public.prescription_templates enable row level security;

drop policy if exists prescription_templates_read on public.prescription_templates;
create policy prescription_templates_read on public.prescription_templates
  for select using (true);

create table if not exists public.readiness_gates (
  id uuid primary key default gen_random_uuid(),
  context text not null,
  threshold_low integer not null,
  threshold_mid integer,
  threshold_high integer,
  action_low text not null,
  action_mid text,
  action_high text,
  methodology_citation text not null,
  is_active boolean not null default true
);

create unique index if not exists readiness_gates_context_key on public.readiness_gates (context);

alter table public.readiness_gates enable row level security;

drop policy if exists readiness_gates_read on public.readiness_gates;
create policy readiness_gates_read on public.readiness_gates
  for select using (true);

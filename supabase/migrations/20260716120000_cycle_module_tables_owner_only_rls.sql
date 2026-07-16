-- Female cycle module (v3 M3) — SPECIAL-CATEGORY health data (GDPR Art. 9).
-- Owner-only by construction: NO staff/coach RLS policies exist (V3-DESIGN §4.4).
-- Disabled by default (profiles.enabled = false). Cycle data NEVER enters the
-- training engine — it only powers the athlete's own advisory layer.
-- Applied live via Supabase MCP 2026-07-16.

create table if not exists public.cycle_tracking_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  hormonal_contraception boolean not null default false,
  adaptation_level text not null default 'inform'
    check (adaptation_level in ('off','inform')),
  typical_cycle_length integer check (typical_cycle_length between 21 and 45),
  typical_period_length integer check (typical_period_length between 1 and 10),
  consent_version text,
  consent_granted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cycle_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  flow text check (flow in ('spotting','light','medium','heavy')),
  symptoms text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create index if not exists cycle_logs_user_date_idx
  on public.cycle_logs(user_id, log_date desc);

alter table public.cycle_tracking_profiles enable row level security;
alter table public.cycle_logs enable row level security;

-- Owner-only. Deliberately NO staff policy — individual cycle data is visible to
-- exactly one person: the athlete.
drop policy if exists cycle_profiles_owner on public.cycle_tracking_profiles;
create policy cycle_profiles_owner on public.cycle_tracking_profiles
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists cycle_logs_owner on public.cycle_logs;
create policy cycle_logs_owner on public.cycle_logs
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.cycle_tracking_profiles is
  'v3 M3 female cycle module. Special-category (GDPR Art. 9). Owner-only RLS, no staff access. Disabled by default.';
comment on table public.cycle_logs is
  'v3 M3 cycle daily logs. Special-category (GDPR Art. 9). Owner-only RLS. Never joined by any staff/coach lane.';

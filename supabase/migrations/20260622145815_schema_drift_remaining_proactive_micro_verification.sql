-- Remaining schema-drift remediation (additive/new — no risk).
create table if not exists public.proactive_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  checkin_type text,
  message text,
  status text not null default 'pending',
  scheduled_for timestamptz,
  engaged_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.proactive_checkins enable row level security;
create index if not exists proactive_checkins_user_status_idx
  on public.proactive_checkins (user_id, status, scheduled_for);
alter table public.micro_sessions add column if not exists assigned_date date;
alter table public.micro_sessions add column if not exists status text default 'pending';
alter table public.users add column if not exists verification_token text;
alter table public.users add column if not exists verification_token_expires_at timestamptz;

-- Reconstructed from live schema (Supabase MCP) — original file was never committed.

create table if not exists public.prescription_audit_log (
  id uuid primary key default gen_random_uuid(),
  daily_protocol_id uuid references public.daily_protocols (id) on delete cascade,
  athlete_id uuid not null references public.users (id),
  exercise_slug text,
  field_changed text not null,
  original_value text,
  modified_value text,
  modification_reason text not null,
  modified_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists prescription_audit_log_athlete_id_created_at_idx
  on public.prescription_audit_log (athlete_id, created_at desc);

create index if not exists prescription_audit_log_daily_protocol_id_idx
  on public.prescription_audit_log (daily_protocol_id);

alter table public.prescription_audit_log enable row level security;

drop policy if exists pal_athlete_read on public.prescription_audit_log;
create policy pal_athlete_read on public.prescription_audit_log
  for select using (athlete_id = auth.uid());

drop policy if exists pal_coach_read on public.prescription_audit_log;
create policy pal_coach_read on public.prescription_audit_log
  for select using (
    exists (
      select 1 from public.team_members tm
      where tm.user_id = auth.uid()
        and tm.role::text = any (array['coach', 'head_coach', 'assistant_coach']::text[])
        and exists (
          select 1 from public.team_members atm
          where atm.team_id = tm.team_id
            and atm.user_id = prescription_audit_log.athlete_id
        )
    )
  );

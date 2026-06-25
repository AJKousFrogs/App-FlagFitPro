-- Reconstructed from live schema (Supabase MCP) — original file was never committed.

create table if not exists public.rtp_prescription_approvals (
  id uuid primary key default gen_random_uuid(),
  return_to_play_id uuid references public.return_to_play_protocols (id) on delete cascade,
  daily_protocol_id uuid references public.daily_protocols (id) on delete set null,
  athlete_id uuid not null references public.users (id),
  rtp_phase integer,
  trigger text not null,
  status text not null default 'pending',
  approved_by uuid references public.users (id),
  reviewed_at timestamptz,
  coach_notes text,
  created_at timestamptz not null default now(),
  constraint rpa_status_check check (status = any (array['pending', 'approved', 'rejected', 'modified']::text[]))
);

create index if not exists rtp_prescription_approvals_athlete_id_status_idx
  on public.rtp_prescription_approvals (athlete_id, status);

create index if not exists rtp_prescription_approvals_return_to_play_id_status_idx
  on public.rtp_prescription_approvals (return_to_play_id, status);

create index if not exists rtp_prescription_approvals_status_created_at_idx
  on public.rtp_prescription_approvals (status, created_at desc);

alter table public.rtp_prescription_approvals enable row level security;

drop policy if exists rpa_athlete_read on public.rtp_prescription_approvals;
create policy rpa_athlete_read on public.rtp_prescription_approvals
  for select using (athlete_id = auth.uid());

drop policy if exists rpa_coach_read_update on public.rtp_prescription_approvals;
create policy rpa_coach_read_update on public.rtp_prescription_approvals
  for all using (
    exists (
      select 1 from public.team_members tm
      join public.team_members atm on atm.team_id = tm.team_id
      where tm.user_id = auth.uid()
        and tm.role::text = any (array['coach', 'head_coach', 'assistant_coach']::text[])
        and atm.user_id = rtp_prescription_approvals.athlete_id
    )
  );

-- Harden knowledge-base governance with explicit RLS and review audit trail.

create table if not exists public.knowledge_review_audit (
  id bigserial primary key,
  entry_id uuid not null references public.knowledge_base_entries(id) on delete cascade,
  reviewed_by uuid not null,
  reviewed_by_role text not null,
  action text not null check (action in ('approve', 'reject')),
  notes text,
  quality_gate_override boolean not null default false,
  quality_issues jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_knowledge_review_audit_entry_id
  on public.knowledge_review_audit(entry_id);
create index if not exists idx_knowledge_review_audit_reviewed_by
  on public.knowledge_review_audit(reviewed_by);
create index if not exists idx_knowledge_review_audit_created_at
  on public.knowledge_review_audit(created_at desc);

alter table public.knowledge_review_audit enable row level security;

-- Replace broad legacy select policy with governance-safe policies.
drop policy if exists "Anyone can read knowledge base entries" on public.knowledge_base_entries;
drop policy if exists "Anon users can read approved knowledge entries" on public.knowledge_base_entries;
drop policy if exists "Authenticated users can read approved or own knowledge entries" on public.knowledge_base_entries;
drop policy if exists "Authenticated users can submit pending knowledge entries" on public.knowledge_base_entries;
drop policy if exists "Nutritionists can review knowledge entries" on public.knowledge_base_entries;

create policy "Anon users can read approved knowledge entries"
  on public.knowledge_base_entries
  for select
  to anon
  using (is_merlin_approved = true);

create policy "Authenticated users can read approved or own knowledge entries"
  on public.knowledge_base_entries
  for select
  to authenticated
  using (
    is_merlin_approved = true
    or merlin_submitted_by = auth.uid()
    or exists (
      select 1
      from public.team_members tm
      where tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role = 'nutritionist'
    )
  );

create policy "Authenticated users can submit pending knowledge entries"
  on public.knowledge_base_entries
  for insert
  to authenticated
  with check (
    merlin_submitted_by = auth.uid()
    and is_merlin_approved = false
    and merlin_approval_status = 'pending'
  );

create policy "Nutritionists can review knowledge entries"
  on public.knowledge_base_entries
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.team_members tm
      where tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role = 'nutritionist'
    )
  )
  with check (
    exists (
      select 1
      from public.team_members tm
      where tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role = 'nutritionist'
    )
  );

drop policy if exists "Knowledge review audit visible to nutritionists and submitters" on public.knowledge_review_audit;

create policy "Knowledge review audit visible to nutritionists and submitters"
  on public.knowledge_review_audit
  for select
  to authenticated
  using (
    reviewed_by = auth.uid()
    or exists (
      select 1
      from public.team_members tm
      where tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in ('nutritionist', 'admin', 'owner', 'head_coach')
    )
    or exists (
      select 1
      from public.knowledge_base_entries kbe
      where kbe.id = entry_id
        and kbe.merlin_submitted_by = auth.uid()
    )
  );

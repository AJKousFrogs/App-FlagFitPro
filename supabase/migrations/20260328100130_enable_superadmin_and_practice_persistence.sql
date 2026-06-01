begin;

create or replace function public.is_active_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.superadmins
    where user_id = auth.uid()
      and is_active = true
  );
$$;

grant execute on function public.is_active_superadmin() to authenticated;

alter table public.superadmins enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'superadmins'
      and policyname = 'Active superadmins can view superadmins'
  ) then
    create policy "Active superadmins can view superadmins"
      on public.superadmins
      for select
      to authenticated
      using (public.is_active_superadmin());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'superadmins'
      and policyname = 'Active superadmins can manage superadmins'
  ) then
    create policy "Active superadmins can manage superadmins"
      on public.superadmins
      for all
      to authenticated
      using (public.is_active_superadmin())
      with check (public.is_active_superadmin());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'Superadmins can view all users'
  ) then
    create policy "Superadmins can view all users"
      on public.users
      for select
      to authenticated
      using (public.is_active_superadmin());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'Superadmins can update all users'
  ) then
    create policy "Superadmins can update all users"
      on public.users
      for update
      to authenticated
      using (public.is_active_superadmin())
      with check (public.is_active_superadmin());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'team_members'
      and policyname = 'Superadmins can view all team members'
  ) then
    create policy "Superadmins can view all team members"
      on public.team_members
      for select
      to authenticated
      using (public.is_active_superadmin());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'team_members'
      and policyname = 'Superadmins can update all team members'
  ) then
    create policy "Superadmins can update all team members"
      on public.team_members
      for update
      to authenticated
      using (public.is_active_superadmin())
      with check (public.is_active_superadmin());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'teams'
      and policyname = 'Superadmins can view all teams'
  ) then
    create policy "Superadmins can view all teams"
      on public.teams
      for select
      to authenticated
      using (public.is_active_superadmin());
  end if;
end
$$;

create table if not exists public.practice_plans (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  created_by uuid not null,
  title text not null,
  practice_date date not null,
  start_time text not null,
  end_time text not null,
  duration_minutes integer not null default 0,
  location text not null,
  focus text,
  equipment jsonb not null default '[]'::jsonb,
  activities jsonb not null default '[]'::jsonb,
  coach_notes text,
  attendance jsonb not null default '{"confirmed":0,"pending":0,"total":0}'::jsonb,
  status text not null default 'scheduled',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint practice_plans_status_check
    check (status in ('scheduled', 'in-progress', 'completed', 'cancelled', 'draft', 'template'))
);

create index if not exists idx_practice_plans_team_date
  on public.practice_plans(team_id, practice_date desc);

create index if not exists idx_practice_plans_created_by
  on public.practice_plans(created_by, updated_at desc);

alter table public.practice_plans enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'practice_plans'
      and policyname = 'Team members can view practice plans'
  ) then
    create policy "Team members can view practice plans"
      on public.practice_plans
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.team_members tm
          where tm.team_id = practice_plans.team_id
            and tm.user_id = auth.uid()
            and tm.status = 'active'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'practice_plans'
      and policyname = 'Coaches can manage practice plans'
  ) then
    create policy "Coaches can manage practice plans"
      on public.practice_plans
      for all
      to authenticated
      using (
        exists (
          select 1
          from public.team_members tm
          where tm.team_id = practice_plans.team_id
            and tm.user_id = auth.uid()
            and tm.status = 'active'
            and tm.role in (
              'owner',
              'admin',
              'head_coach',
              'coach',
              'assistant_coach',
              'offense_coordinator',
              'defense_coordinator',
              'manager'
            )
        )
      )
      with check (
        exists (
          select 1
          from public.team_members tm
          where tm.team_id = practice_plans.team_id
            and tm.user_id = auth.uid()
            and tm.status = 'active'
            and tm.role in (
              'owner',
              'admin',
              'head_coach',
              'coach',
              'assistant_coach',
              'offense_coordinator',
              'defense_coordinator',
              'manager'
            )
        )
      );
  end if;
end
$$;

commit;

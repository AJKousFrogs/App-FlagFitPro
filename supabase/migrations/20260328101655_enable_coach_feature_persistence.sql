begin;

alter table public.teams
  add column if not exists home_field text;

alter table public.teams enable row level security;

drop policy if exists "App active team members can view teams" on public.teams;
create policy "App active team members can view teams"
  on public.teams
  for select
  to authenticated
  using (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = teams.id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
    )
  );

drop policy if exists "App coaches can update teams" on public.teams;
create policy "App coaches can update teams"
  on public.teams
  for update
  to authenticated
  using (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = teams.id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'owner',
          'admin',
          'head_coach',
          'coach',
          'offense_coordinator',
          'defense_coordinator',
          'assistant_coach',
          'manager'
        )
    )
  )
  with check (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = teams.id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'owner',
          'admin',
          'head_coach',
          'coach',
          'offense_coordinator',
          'defense_coordinator',
          'assistant_coach',
          'manager'
        )
    )
  );

create table if not exists public.team_preferences (
  team_id uuid primary key references public.teams(id) on delete cascade,
  require_wellness_checkin boolean not null default true,
  auto_send_rsvp_reminders boolean not null default true,
  allow_players_view_analytics boolean not null default true,
  require_coach_approval_posts boolean not null default false,
  created_by uuid null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.team_preferences enable row level security;

drop policy if exists "App active team members can view team preferences" on public.team_preferences;
create policy "App active team members can view team preferences"
  on public.team_preferences
  for select
  to authenticated
  using (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = team_preferences.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
    )
  );

drop policy if exists "App coaches can manage team preferences" on public.team_preferences;
create policy "App coaches can manage team preferences"
  on public.team_preferences
  for all
  to authenticated
  using (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = team_preferences.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'owner',
          'admin',
          'head_coach',
          'coach',
          'offense_coordinator',
          'defense_coordinator',
          'assistant_coach',
          'manager'
        )
    )
  )
  with check (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = team_preferences.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'owner',
          'admin',
          'head_coach',
          'coach',
          'offense_coordinator',
          'defense_coordinator',
          'assistant_coach',
          'manager'
        )
    )
  );

create table if not exists public.tournament_lineups (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  slots jsonb not null default '[]'::jsonb,
  notes text,
  saved_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tournament_lineups_team_tournament_key unique (team_id, tournament_id)
);

create index if not exists idx_tournament_lineups_team_id
  on public.tournament_lineups(team_id, updated_at desc);

alter table public.tournament_lineups enable row level security;

drop policy if exists "App active team members can view tournament lineups" on public.tournament_lineups;
create policy "App active team members can view tournament lineups"
  on public.tournament_lineups
  for select
  to authenticated
  using (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = tournament_lineups.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
    )
  );

drop policy if exists "App coaches can manage tournament lineups" on public.tournament_lineups;
create policy "App coaches can manage tournament lineups"
  on public.tournament_lineups
  for all
  to authenticated
  using (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = tournament_lineups.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'owner',
          'admin',
          'head_coach',
          'coach',
          'offense_coordinator',
          'defense_coordinator',
          'assistant_coach',
          'manager'
        )
    )
  )
  with check (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = tournament_lineups.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'owner',
          'admin',
          'head_coach',
          'coach',
          'offense_coordinator',
          'defense_coordinator',
          'assistant_coach',
          'manager'
        )
    )
  );

create table if not exists public.coach_playbook_plays (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  name text not null,
  formation text not null,
  situation text not null,
  type text not null
    check (type = any (array['offense', 'defense', 'special'])),
  assignments jsonb not null default '[]'::jsonb,
  coach_notes text,
  team_memorized integer not null default 0
    check (team_memorized >= 0 and team_memorized <= 100),
  status text not null default 'active'
    check (status = any (array['active', 'archived'])),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_coach_playbook_plays_team_id
  on public.coach_playbook_plays(team_id, status, created_at desc);

alter table public.coach_playbook_plays enable row level security;

drop policy if exists "App active team members can view coach playbook plays" on public.coach_playbook_plays;
create policy "App active team members can view coach playbook plays"
  on public.coach_playbook_plays
  for select
  to authenticated
  using (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = coach_playbook_plays.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
    )
  );

drop policy if exists "App coaches can manage coach playbook plays" on public.coach_playbook_plays;
create policy "App coaches can manage coach playbook plays"
  on public.coach_playbook_plays
  for all
  to authenticated
  using (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = coach_playbook_plays.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'owner',
          'admin',
          'head_coach',
          'coach',
          'offense_coordinator',
          'defense_coordinator',
          'assistant_coach',
          'manager'
        )
    )
  )
  with check (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = coach_playbook_plays.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'owner',
          'admin',
          'head_coach',
          'coach',
          'offense_coordinator',
          'defense_coordinator',
          'assistant_coach',
          'manager'
        )
    )
  );

create table if not exists public.coach_film_sessions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  title text not null,
  film_type text not null
    check (film_type = any (array['game', 'practice', 'scouting', 'training'])),
  duration text not null default '',
  upload_date date not null default current_date,
  thumbnail_url text,
  video_url text not null,
  description text,
  tag_count integer not null default 0 check (tag_count >= 0),
  assignment text not null default '',
  due_date date,
  watched_count integer not null default 0 check (watched_count >= 0),
  total_assigned integer not null default 0 check (total_assigned >= 0),
  not_watched jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_coach_film_sessions_team_id
  on public.coach_film_sessions(team_id, upload_date desc, created_at desc);

alter table public.coach_film_sessions enable row level security;

drop policy if exists "App active team members can view coach film sessions" on public.coach_film_sessions;
create policy "App active team members can view coach film sessions"
  on public.coach_film_sessions
  for select
  to authenticated
  using (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = coach_film_sessions.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
    )
  );

drop policy if exists "App coaches can manage coach film sessions" on public.coach_film_sessions;
create policy "App coaches can manage coach film sessions"
  on public.coach_film_sessions
  for all
  to authenticated
  using (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = coach_film_sessions.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'owner',
          'admin',
          'head_coach',
          'coach',
          'offense_coordinator',
          'defense_coordinator',
          'assistant_coach',
          'manager'
        )
    )
  )
  with check (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = coach_film_sessions.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'owner',
          'admin',
          'head_coach',
          'coach',
          'offense_coordinator',
          'defense_coordinator',
          'assistant_coach',
          'manager'
        )
    )
  );

create table if not exists public.coach_film_tags (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.coach_film_sessions(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  coach_id uuid not null references auth.users(id),
  timestamp_label text not null,
  timestamp_seconds integer not null default 0 check (timestamp_seconds >= 0),
  tag_type text not null
    check (tag_type = any (array['positive', 'correction', 'teaching', 'opponent'])),
  target text not null
    check (target = any (array['everyone', 'specific'])),
  player_ids uuid[] not null default '{}'::uuid[],
  play_id uuid null references public.coach_playbook_plays(id) on delete set null,
  comment text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_coach_film_tags_session_id
  on public.coach_film_tags(session_id, created_at desc);

alter table public.coach_film_tags enable row level security;

drop policy if exists "App active team members can view coach film tags" on public.coach_film_tags;
create policy "App active team members can view coach film tags"
  on public.coach_film_tags
  for select
  to authenticated
  using (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = coach_film_tags.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
    )
  );

drop policy if exists "App coaches can manage coach film tags" on public.coach_film_tags;
create policy "App coaches can manage coach film tags"
  on public.coach_film_tags
  for all
  to authenticated
  using (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = coach_film_tags.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'owner',
          'admin',
          'head_coach',
          'coach',
          'offense_coordinator',
          'defense_coordinator',
          'assistant_coach',
          'manager'
        )
    )
  )
  with check (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = coach_film_tags.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'owner',
          'admin',
          'head_coach',
          'coach',
          'offense_coordinator',
          'defense_coordinator',
          'assistant_coach',
          'manager'
        )
    )
  );

create table if not exists public.player_development_goals (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references auth.users(id) on delete cascade,
  coach_id uuid not null references auth.users(id) on delete cascade,
  category text not null
    check (category = any (array['physical', 'skill', 'stats', 'compliance'])),
  metric text not null,
  current_value text,
  target_value text not null,
  start_value text,
  due_date date,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  status text not null default 'on-track'
    check (status = any (array['on-track', 'ahead', 'behind', 'completed'])),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_player_development_goals_team_player
  on public.player_development_goals(team_id, player_id, updated_at desc);

alter table public.player_development_goals enable row level security;

drop policy if exists "App active team members can view player development goals" on public.player_development_goals;
create policy "App active team members can view player development goals"
  on public.player_development_goals
  for select
  to authenticated
  using (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = player_development_goals.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
    )
  );

drop policy if exists "App coaches can manage player development goals" on public.player_development_goals;
create policy "App coaches can manage player development goals"
  on public.player_development_goals
  for all
  to authenticated
  using (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = player_development_goals.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'owner',
          'admin',
          'head_coach',
          'coach',
          'offense_coordinator',
          'defense_coordinator',
          'assistant_coach',
          'manager'
        )
    )
  )
  with check (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = player_development_goals.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'owner',
          'admin',
          'head_coach',
          'coach',
          'offense_coordinator',
          'defense_coordinator',
          'assistant_coach',
          'manager'
        )
    )
  );

create table if not exists public.player_development_notes (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references auth.users(id) on delete cascade,
  coach_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_player_development_notes_team_player
  on public.player_development_notes(team_id, player_id, created_at desc);

alter table public.player_development_notes enable row level security;

drop policy if exists "App active team members can view player development notes" on public.player_development_notes;
create policy "App active team members can view player development notes"
  on public.player_development_notes
  for select
  to authenticated
  using (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = player_development_notes.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
    )
  );

drop policy if exists "App coaches can manage player development notes" on public.player_development_notes;
create policy "App coaches can manage player development notes"
  on public.player_development_notes
  for all
  to authenticated
  using (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = player_development_notes.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'owner',
          'admin',
          'head_coach',
          'coach',
          'offense_coordinator',
          'defense_coordinator',
          'assistant_coach',
          'manager'
        )
    )
  )
  with check (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = player_development_notes.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'owner',
          'admin',
          'head_coach',
          'coach',
          'offense_coordinator',
          'defense_coordinator',
          'assistant_coach',
          'manager'
        )
    )
  );

create table if not exists public.player_skill_assessments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references auth.users(id) on delete cascade,
  coach_id uuid not null references auth.users(id) on delete cascade,
  skill text not null,
  skill_key text not null,
  score integer not null check (score >= 0 and score <= 100),
  grade text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_skill_assessments_team_player_skill_key
    unique (team_id, player_id, skill_key)
);

create index if not exists idx_player_skill_assessments_team_player
  on public.player_skill_assessments(team_id, player_id, updated_at desc);

alter table public.player_skill_assessments enable row level security;

drop policy if exists "App active team members can view player skill assessments" on public.player_skill_assessments;
create policy "App active team members can view player skill assessments"
  on public.player_skill_assessments
  for select
  to authenticated
  using (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = player_skill_assessments.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
    )
  );

drop policy if exists "App coaches can manage player skill assessments" on public.player_skill_assessments;
create policy "App coaches can manage player skill assessments"
  on public.player_skill_assessments
  for all
  to authenticated
  using (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = player_skill_assessments.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'owner',
          'admin',
          'head_coach',
          'coach',
          'offense_coordinator',
          'defense_coordinator',
          'assistant_coach',
          'manager'
        )
    )
  )
  with check (
    public.is_active_superadmin()
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = player_skill_assessments.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role in (
          'owner',
          'admin',
          'head_coach',
          'coach',
          'offense_coordinator',
          'defense_coordinator',
          'assistant_coach',
          'manager'
        )
    )
  );

commit;

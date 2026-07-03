-- Fixes two "rls_enabled_no_policy" advisor findings: proactive_checkins and
-- team_activities both had RLS enabled with ZERO policies (deny-all for every
-- role including authenticated, except service_role which bypasses RLS).
-- Currently both tables are only ever read/written server-side via the
-- service-role client, so this wasn't an active bug, but it's a landmine for
-- any future client-side read (silent empty-result, not an error) and
-- inconsistent with every other table in this schema, which follows the
-- "service_role ALL + authenticated scoped-SELECT/write" pattern. Policies
-- below match that exact established idiom (see daily_wellness_checkin,
-- competition_events, event_games).

-- proactive_checkins: personal, user_id-owned (id, user_id, checkin_type,
-- message, status, scheduled_for, engaged_at, created_at). Generation
-- (generate_proactive_checkins RPC) and status updates currently happen via
-- supabaseAdmin in smart-ai-service.js; the athlete has no client-side write
-- path today, so only a SELECT policy is added for the owning user, mirroring
-- daily_wellness_checkin's read-only-for-owner + service-role-all shape.
alter table public.proactive_checkins enable row level security;

drop policy if exists "Service role only access" on public.proactive_checkins;
create policy "Service role only access" on public.proactive_checkins
  for all to service_role using (true);

drop policy if exists "Users can view own proactive checkins" on public.proactive_checkins;
create policy "Users can view own proactive checkins" on public.proactive_checkins
  for select to authenticated
  using (user_id = (select auth.uid()));

-- team_activities: team-scoped (team_id, date, type, ..., created_by_coach_id).
-- Read: any active team member. Write: coach/head_coach/assistant_coach only
-- (ff_is_active_team_member / is_team_coach_or_higher already exist and are
-- used by the identical-shape competition_events/event_games policies).
drop policy if exists "Service role only access" on public.team_activities;
create policy "Service role only access" on public.team_activities
  for all to service_role using (true);

drop policy if exists "team_activities_select" on public.team_activities;
create policy "team_activities_select" on public.team_activities
  for select to authenticated
  using (ff_is_active_team_member(team_id, (select auth.uid())));

drop policy if exists "team_activities_coach_write" on public.team_activities;
create policy "team_activities_coach_write" on public.team_activities
  for all to authenticated
  using (is_team_coach_or_higher((select auth.uid()), team_id))
  with check (is_team_coach_or_higher((select auth.uid()), team_id));

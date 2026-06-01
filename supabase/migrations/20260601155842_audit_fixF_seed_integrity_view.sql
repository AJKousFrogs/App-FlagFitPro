-- Unit F: continuous referential-integrity monitor for the consolidated spine.
-- security_invoker so it never becomes a cross-tenant data-leak vector; locked to service_role.
create or replace view public.v_seed_integrity
with (security_invoker = true) as
  select 'competition_events.competition_id -> competitions' as check_name, count(*) as violations
  from competition_events ce left join competitions c on c.id = ce.competition_id
  where ce.competition_id is not null and c.id is null
  union all
  select 'competition_events.team_id -> teams', count(*)
  from competition_events ce left join teams t on t.id = ce.team_id
  where ce.team_id is not null and t.id is null
  union all
  select 'competition_events.created_by -> users', count(*)
  from competition_events ce left join users u on u.id = ce.created_by
  where ce.created_by is not null and u.id is null
  union all
  select 'event_participation.competition_event_id -> competition_events', count(*)
  from event_participation ep left join competition_events ce on ce.id = ep.competition_event_id
  where ep.competition_event_id is not null and ce.id is null
  union all
  select 'event_participation.training_session_id -> training_sessions', count(*)
  from event_participation ep left join training_sessions ts on ts.id = ep.training_session_id
  where ep.training_session_id is not null and ts.id is null
  union all
  select 'event_participation<->training_sessions user_id mismatch', count(*)
  from event_participation ep join training_sessions ts on ts.id = ep.training_session_id
  where ep.user_id is distinct from ts.user_id
  union all
  select 'event_participation.user_id -> users', count(*)
  from event_participation ep left join users u on u.id = ep.user_id
  where ep.user_id is not null and u.id is null
  union all
  select 'player_achievements.achievement_id -> achievement_definitions', count(*)
  from player_achievements pa left join achievement_definitions ad on ad.id = pa.achievement_id
  where pa.achievement_id is not null and ad.id is null
  union all
  select 'player_achievements.user_id -> users', count(*)
  from player_achievements pa left join users u on u.id = pa.user_id
  where pa.user_id is not null and u.id is null
  union all
  select 'team_members.user_id -> auth.users (orphans)', count(*)
  from team_members tm left join auth.users au on au.id = tm.user_id
  where tm.user_id is not null and au.id is null;

revoke all on public.v_seed_integrity from anon, authenticated;
grant select on public.v_seed_integrity to service_role;

comment on view public.v_seed_integrity is
  'Referential-integrity monitor for the consolidated competition/participation/achievement spine. Every row should report violations=0. Locked to service_role; queried by tests/privacy-safety/seed-integrity.test.js.';

create or replace function public.set_event_availability(
  p_competition_event_id uuid,
  p_status text,
  p_reason text default null
) returns public.event_availability
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_team uuid;
  v_row public.event_availability;
begin
  if v_uid is null then
    raise exception 'authentication required';
  end if;
  if p_status not in ('available','unavailable','maybe','tentative','confirmed','declined') then
    raise exception 'invalid status: %', p_status;
  end if;
  select ce.team_id into v_team from public.competition_events ce
   where ce.id = p_competition_event_id;
  if v_team is null then
    raise exception 'competition event not found';
  end if;
  if not public.ff_is_active_team_member(v_team, v_uid) then
    raise exception 'not an active member of this event''s team';
  end if;
  insert into public.event_availability
    (user_id, competition_event_id, team_id, status, reason, responded_at)
  values (v_uid, p_competition_event_id, v_team, p_status, p_reason, now())
  on conflict (user_id, competition_event_id) do update
    set status = excluded.status,
        reason = excluded.reason,
        responded_at = now(),
        updated_at = now()
  returning * into v_row;
  return v_row;
end $$;

revoke all on function public.set_event_availability(uuid,text,text) from public, anon;
grant execute on function public.set_event_availability(uuid,text,text) to authenticated, service_role;

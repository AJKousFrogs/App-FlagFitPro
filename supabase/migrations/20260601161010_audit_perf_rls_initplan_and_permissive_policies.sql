-- Performance lints: wrap auth.*() in (select ...) so it is evaluated once per
-- query instead of per row (auth_rls_initplan), and collapse overlapping
-- permissive SELECT policies (multiple_permissive_policies). All rewrites
-- preserve the existing access semantics exactly.

-- ---- auth_rls_initplan: wrap auth.uid()/auth.role() ----

alter policy "Users can manage own AI chat sessions" on public.ai_chat_sessions
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

alter policy "Users can manage own AI feedback" on public.ai_feedback
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

alter policy "Users can manage own AI messages" on public.ai_messages
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

alter policy "Users can manage own AI recommendations" on public.ai_recommendations
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

alter policy "Users can manage own notification preferences" on public.user_notification_preferences
  using ((user_id)::text = ((select auth.uid()))::text)
  with check ((user_id)::text = ((select auth.uid()))::text);

alter policy "Users can manage own watch history" on public.video_watch_history
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

alter policy "Coaches can create assignments" on public.coach_athlete_assignments
  with check (exists (
    select 1 from team_members tm
    where tm.user_id = (select auth.uid())
      and (tm.status)::text = 'active'
      and (tm.role)::text = any (array['coach','head_coach','admin','owner','offense_coordinator','defense_coordinator','assistant_coach']::text[])
  ));

alter policy "merged_select_session_version_history_public" on public.session_version_history
  using (
    exists (select 1 from training_sessions
            where training_sessions.id = session_version_history.session_id
              and training_sessions.user_id = (select auth.uid()))
    or exists (select 1 from training_sessions ts
               join coach_athlete_assignments caa on caa.user_id = ts.user_id
               where ts.id = session_version_history.session_id
                 and caa.coach_id = (select auth.uid()))
    or exists (select 1 from team_members tm
               where tm.user_id = (select auth.uid())
                 and (tm.status)::text = 'active'
                 and (tm.role)::text = any (array['physiotherapist','medical_staff','admin','owner']::text[]))
  );

alter policy "merged_update_training_sessions_public" on public.training_sessions
  using (
    ((exists (select 1 from team_members tm
              where tm.user_id = (select auth.uid())
                and (tm.status)::text = 'active'
                and (tm.role)::text = any (array['coach','head_coach','admin','owner','offense_coordinator','defense_coordinator','assistant_coach']::text[])))
      and (((coach_locked = true) and (modified_by_coach_id = (select auth.uid())))
           or ((coach_locked = false) and (session_state = any (array['PLANNED','GENERATED','VISIBLE','ACKNOWLEDGED']::text[])))))
    or ((user_id = (select auth.uid())) and (coach_locked = false)
        and (session_state = any (array['PLANNED','GENERATED','VISIBLE','ACKNOWLEDGED']::text[])))
  )
  with check (
    ((exists (select 1 from team_members tm
              where tm.user_id = (select auth.uid())
                and (tm.status)::text = 'active'
                and (tm.role)::text = any (array['coach','head_coach','admin','owner','offense_coordinator','defense_coordinator','assistant_coach']::text[])))
      and (((coach_locked = true) and (modified_by_coach_id = (select auth.uid())))
           or ((coach_locked = false) and (session_state = any (array['PLANNED','GENERATED','VISIBLE','ACKNOWLEDGED']::text[])))))
    or ((user_id = (select auth.uid())) and (coach_locked = false)
        and (session_state = any (array['PLANNED','GENERATED','VISIBLE','ACKNOWLEDGED']::text[])))
  );

alter policy "Service role or relevant staff can log safety overrides" on public.safety_override_log
  with check (
    ((select auth.role()) = 'service_role')
    or (user_id = (select auth.uid()))
    or exists (select 1 from team_members tm
               where tm.user_id = (select auth.uid())
                 and (tm.status)::text = 'active'
                 and (tm.role)::text = any (array['coach','head_coach','admin','owner','physiotherapist','medical_staff']::text[]))
  );

alter policy "Users can log own consent changes" on public.consent_change_log
  with check (changed_by = (select auth.uid()));

-- ---- multiple_permissive_policies ----

-- event_availability: the FOR ALL write policy overlapped the dedicated SELECT
-- policy. Split it into per-write-command policies so SELECT has exactly one.
drop policy event_availability_write on public.event_availability;
create policy event_availability_write_insert on public.event_availability
  for insert to public
  with check ((user_id = (select auth.uid())) or ff_is_team_staff(team_id, (select auth.uid())));
create policy event_availability_write_update on public.event_availability
  for update to public
  using ((user_id = (select auth.uid())) or ff_is_team_staff(team_id, (select auth.uid())))
  with check ((user_id = (select auth.uid())) or ff_is_team_staff(team_id, (select auth.uid())));
create policy event_availability_write_delete on public.event_availability
  for delete to public
  using ((user_id = (select auth.uid())) or ff_is_team_staff(team_id, (select auth.uid())));

-- event_participation: same pattern.
drop policy event_participation_write on public.event_participation;
create policy event_participation_write_insert on public.event_participation
  for insert to public
  with check ((user_id = (select auth.uid())) or ff_is_team_staff(team_id, (select auth.uid())));
create policy event_participation_write_update on public.event_participation
  for update to public
  using ((user_id = (select auth.uid())) or ff_is_team_staff(team_id, (select auth.uid())))
  with check ((user_id = (select auth.uid())) or ff_is_team_staff(team_id, (select auth.uid())));
create policy event_participation_write_delete on public.event_participation
  for delete to public
  using ((user_id = (select auth.uid())) or ff_is_team_staff(team_id, (select auth.uid())));

-- athlete_hydration_logs: merge the two permissive SELECT policies into one.
drop policy hydration_logs_select_own on public.athlete_hydration_logs;
drop policy hydration_logs_select_team_staff on public.athlete_hydration_logs;
create policy hydration_logs_select on public.athlete_hydration_logs
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from team_members staff
      join team_members athlete on athlete.team_id = staff.team_id
      where staff.user_id = (select auth.uid())
        and athlete.user_id = athlete_hydration_logs.user_id
        and (staff.status)::text = 'active'
        and (athlete.status)::text = 'active'
        and (staff.role)::text = any (array['owner','admin','head_coach','coach','assistant_coach','manager','physiotherapist','nutritionist']::text[])
    )
  );

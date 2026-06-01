-- Phase 2a: move availability + lineups onto the schedule spine (competition_event_id),
-- replacing the legacy tournament_id (→ legacy tournaments table). Both tables empty.

-- event_availability ← player_tournament_availability
ALTER TABLE public.player_tournament_availability RENAME TO event_availability;
ALTER TABLE public.event_availability RENAME COLUMN tournament_id TO competition_event_id;
ALTER TABLE public.event_availability
  ADD CONSTRAINT event_availability_event_fkey
  FOREIGN KEY (competition_event_id) REFERENCES public.competition_events(id) ON DELETE CASCADE;
ALTER TABLE public.event_availability
  ADD CONSTRAINT event_availability_user_event_key UNIQUE (user_id, competition_event_id);
-- RLS → v11 standard: self + team-staff write, active members read (was service-role-only)
DROP POLICY IF EXISTS "Service role only access" ON public.event_availability;
CREATE POLICY event_availability_select ON public.event_availability FOR SELECT TO public
  USING (user_id = (SELECT auth.uid()) OR ff_is_active_team_member(team_id, (SELECT auth.uid())));
CREATE POLICY event_availability_write ON public.event_availability FOR ALL TO public
  USING (user_id = (SELECT auth.uid()) OR ff_is_team_staff(team_id, (SELECT auth.uid())))
  WITH CHECK (user_id = (SELECT auth.uid()) OR ff_is_team_staff(team_id, (SELECT auth.uid())));

-- event_lineups ← tournament_lineups (no code readers; coach feature)
ALTER TABLE public.tournament_lineups DROP CONSTRAINT tournament_lineups_tournament_id_fkey;
ALTER TABLE public.tournament_lineups RENAME TO event_lineups;
ALTER TABLE public.event_lineups RENAME COLUMN tournament_id TO competition_event_id;
ALTER TABLE public.event_lineups
  ADD CONSTRAINT event_lineups_event_fkey
  FOREIGN KEY (competition_event_id) REFERENCES public.competition_events(id) ON DELETE CASCADE;

-- wire availability into the post-event prompt (status surfaced; CREATE OR REPLACE appends col)
CREATE OR REPLACE VIEW public.v_pending_event_participation
WITH (security_invoker = true) AS
SELECT ce.id AS competition_event_id, ce.team_id, t.name AS team_name,
       c.name AS competition_name, ce.label, ce.starts_at, ce.ends_at, ce.expected_game_count,
       tm.user_id,
       ea.status AS availability_status
FROM public.competition_events ce
JOIN public.competitions c ON c.id = ce.competition_id
JOIN public.teams t ON t.id = ce.team_id
JOIN public.team_members tm ON tm.team_id = ce.team_id AND tm.status::text = 'active'
LEFT JOIN public.event_availability ea
  ON ea.competition_event_id = ce.id AND ea.user_id = tm.user_id
WHERE ce.ends_at < now()
  AND ce.ends_at > now() - interval '45 days'
  AND NOT EXISTS (
    SELECT 1 FROM public.event_participation ep
    WHERE ep.competition_event_id = ce.id AND ep.user_id = tm.user_id AND ep.status = 'confirmed'
  );

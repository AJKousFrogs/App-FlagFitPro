-- Performance-advisor cleanup (no behaviour change for real users).
-- Applied live via Supabase MCP 2026-06-10 (version 20260610073448).

-- 1) athlete_events: the 4 _own policies used bare auth.uid(), re-evaluated
--    per row (auth_rls_initplan). Recreate with (select auth.uid()) — the
--    planner then evaluates it ONCE — and scope to `authenticated` (anon has
--    a null uid and never matched anyway).
DROP POLICY IF EXISTS athlete_events_select_own ON public.athlete_events;
DROP POLICY IF EXISTS athlete_events_insert_own ON public.athlete_events;
DROP POLICY IF EXISTS athlete_events_update_own ON public.athlete_events;
DROP POLICY IF EXISTS athlete_events_delete_own ON public.athlete_events;

CREATE POLICY athlete_events_select_own ON public.athlete_events
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY athlete_events_insert_own ON public.athlete_events
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY athlete_events_update_own ON public.athlete_events
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY athlete_events_delete_own ON public.athlete_events
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 2) training_videos: the "Service role only access" policy was TO public, so
--    it was evaluated for anon/authenticated on every command (28 of the 33
--    multiple_permissive_policies warnings) even though it can only ever be
--    true for service_role. Scope it to service_role. (service_role bypasses
--    RLS anyway, so this is purely removing dead per-row evaluation.)
ALTER POLICY "Service role only access" ON public.training_videos TO service_role;

-- 3) training_sessions: two permissive INSERT policies (own + staff) → merge
--    into one OR policy so authenticated INSERT evaluates a single policy.
DROP POLICY IF EXISTS "Users can insert own training sessions" ON public.training_sessions;
DROP POLICY IF EXISTS training_sessions_staff_insert ON public.training_sessions;

CREATE POLICY training_sessions_insert ON public.training_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR (
      team_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.user_id = (SELECT auth.uid())
          AND tm.team_id = training_sessions.team_id
          AND tm.status::text = 'active'
          AND tm.role::text = ANY (ARRAY['coach','head_coach','admin','owner','offense_coordinator','defense_coordinator','assistant_coach'])
      )
      AND EXISTS (
        SELECT 1 FROM public.team_members tgt
        WHERE tgt.user_id = training_sessions.user_id
          AND tgt.team_id = training_sessions.team_id
          AND tgt.status::text = 'active'
      )
    )
  );

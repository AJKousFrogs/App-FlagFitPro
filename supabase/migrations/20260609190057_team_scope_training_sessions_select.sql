-- Team-scope SELECT on training_sessions.
-- The old policy granted read via coach_athlete_assignments (empty table,
-- no team scoping — a coach assigned to an athlete could read ALL of that
-- athlete's sessions across every team). Postgres also applies SELECT
-- policies to UPDATE statements that reference columns, so without this
-- change team staff could never reach team sessions through RLS at all.
-- New rule: owner, or active staff of the session's own team.
-- Applied live via Supabase MCP 2026-06-09 (version 20260609190057).

DROP POLICY IF EXISTS merged_select_training_sessions_public ON public.training_sessions;

CREATE POLICY merged_select_training_sessions_public
ON public.training_sessions
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR (
    team_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.team_members tm
      WHERE tm.user_id = (SELECT auth.uid())
        AND tm.team_id = training_sessions.team_id
        AND tm.status::text = 'active'
        AND tm.role::text = ANY (ARRAY['coach'::text, 'head_coach'::text, 'admin'::text, 'owner'::text, 'offense_coordinator'::text, 'defense_coordinator'::text, 'assistant_coach'::text])
    )
  )
);

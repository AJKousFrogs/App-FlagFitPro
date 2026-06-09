-- Team-scope coach mutations on training_sessions.
-- Before: any active coach of ANY team could update any athlete's mutable
-- session (the API guard had the same gap). The coach branch now requires
-- active staff membership on the session's own team; sessions without a
-- team_id are personal and mutable only by their owner.
-- Applied live via Supabase MCP 2026-06-09 (version 20260609185647).

DROP POLICY IF EXISTS merged_update_training_sessions_public ON public.training_sessions;

CREATE POLICY merged_update_training_sessions_public
ON public.training_sessions
FOR UPDATE
TO authenticated
USING (
  (
    user_id = (SELECT auth.uid())
    AND coach_locked = false
    AND session_state = ANY (ARRAY['PLANNED'::text, 'GENERATED'::text, 'VISIBLE'::text, 'ACKNOWLEDGED'::text])
  )
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
    AND (
      (coach_locked = true AND modified_by_coach_id = (SELECT auth.uid()))
      OR (coach_locked = false AND session_state = ANY (ARRAY['PLANNED'::text, 'GENERATED'::text, 'VISIBLE'::text, 'ACKNOWLEDGED'::text]))
    )
  )
)
WITH CHECK (
  (
    user_id = (SELECT auth.uid())
    AND coach_locked = false
    AND session_state = ANY (ARRAY['PLANNED'::text, 'GENERATED'::text, 'VISIBLE'::text, 'ACKNOWLEDGED'::text])
  )
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
    AND (
      (coach_locked = true AND modified_by_coach_id = (SELECT auth.uid()))
      OR (coach_locked = false AND session_state = ANY (ARRAY['PLANNED'::text, 'GENERATED'::text, 'VISIBLE'::text, 'ACKNOWLEDGED'::text]))
    )
  )
);

-- Staff may create sessions for athletes of their own team only.
-- Previously the own-only INSERT policy blocked the coach-create API lane
-- entirely; this enables it, strictly scoped to (athlete, coached team).
DROP POLICY IF EXISTS training_sessions_staff_insert ON public.training_sessions;

CREATE POLICY training_sessions_staff_insert
ON public.training_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  team_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.user_id = (SELECT auth.uid())
      AND tm.team_id = training_sessions.team_id
      AND tm.status::text = 'active'
      AND tm.role::text = ANY (ARRAY['coach'::text, 'head_coach'::text, 'admin'::text, 'owner'::text, 'offense_coordinator'::text, 'defense_coordinator'::text, 'assistant_coach'::text])
  )
  AND EXISTS (
    SELECT 1
    FROM public.team_members tgt
    WHERE tgt.user_id = training_sessions.user_id
      AND tgt.team_id = training_sessions.team_id
      AND tgt.status::text = 'active'
  )
);

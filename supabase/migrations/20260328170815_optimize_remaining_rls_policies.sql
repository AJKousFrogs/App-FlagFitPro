-- ============================================================================
-- Optimize remaining RLS policies flagged by Supabase advisors
-- - remove authenticated/service-role policy collisions
-- - consolidate duplicate permissive policies on core app tables
-- - fix auth initplan warnings on coach film/playbook tables
-- ============================================================================

-- ============================================================================
-- SERVICE ROLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Service role only access" ON public.daily_wellness_checkin;
CREATE POLICY "Service role only access"
ON public.daily_wellness_checkin
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role only access" ON public.athlete_achievements;
CREATE POLICY "Service role only access"
ON public.athlete_achievements
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role only access" ON public.superadmins;
CREATE POLICY "Service role only access"
ON public.superadmins
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Active superadmins can view superadmins" ON public.superadmins;

-- ============================================================================
-- USERS
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own data" ON public.users;
DROP POLICY IF EXISTS "Superadmins can view all users" ON public.users;
DROP POLICY IF EXISTS "Superadmins can update all users" ON public.users;

CREATE POLICY "Users can view accessible profiles"
ON public.users
FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR (SELECT public.is_active_superadmin())
);

CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  id = (SELECT auth.uid())
  OR (SELECT public.is_active_superadmin())
);

CREATE POLICY "Users can update accessible profiles"
ON public.users
FOR UPDATE
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR (SELECT public.is_active_superadmin())
)
WITH CHECK (
  id = (SELECT auth.uid())
  OR (SELECT public.is_active_superadmin())
);

CREATE POLICY "Users can delete own profile"
ON public.users
FOR DELETE
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR (SELECT public.is_active_superadmin())
);

-- ============================================================================
-- TEAM MEMBERS
-- ============================================================================

DROP POLICY IF EXISTS "Coaches can remove members from their teams" ON public.team_members;
DROP POLICY IF EXISTS "Players can leave their own team" ON public.team_members;
DROP POLICY IF EXISTS "Coaches can add members to their teams" ON public.team_members;
DROP POLICY IF EXISTS "Players can join approved teams" ON public.team_members;
DROP POLICY IF EXISTS "Superadmins can view all team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view members of their own teams" ON public.team_members;
DROP POLICY IF EXISTS "Coaches can update members in their teams" ON public.team_members;
DROP POLICY IF EXISTS "Players can update own membership profile fields" ON public.team_members;
DROP POLICY IF EXISTS "Superadmins can update all team members" ON public.team_members;
DROP POLICY IF EXISTS "team_members_coaches_can_update" ON public.team_members;
DROP POLICY IF EXISTS "team_members_players_self_update" ON public.team_members;

CREATE POLICY "team_members_select_access"
ON public.team_members
FOR SELECT
TO authenticated
USING (
  (SELECT public.is_active_superadmin())
  OR team_id = ANY (COALESCE((SELECT public.auth_user_team_ids()), ARRAY[]::uuid[]))
);

CREATE POLICY "team_members_insert_access"
ON public.team_members
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT public.is_active_superadmin())
  OR team_id IN (
    SELECT t.id
    FROM public.teams t
    WHERE t.coach_id = (SELECT auth.uid())
  )
  OR (
    user_id = (SELECT auth.uid())
    AND role = 'player'
    AND status = 'active'
    AND COALESCE(role_approval_status, 'approved') IN ('pending_approval', 'approved')
    AND EXISTS (
      SELECT 1
      FROM public.teams t
      WHERE t.id = public.team_members.team_id
        AND COALESCE(t.approval_status, 'approved') = 'approved'
    )
  )
);

CREATE POLICY "team_members_update_access"
ON public.team_members
FOR UPDATE
TO authenticated
USING (
  (SELECT public.is_active_superadmin())
  OR team_id IN (
    SELECT t.id
    FROM public.teams t
    WHERE t.coach_id = (SELECT auth.uid())
  )
  OR user_id = (SELECT auth.uid())
)
WITH CHECK (
  (SELECT public.is_active_superadmin())
  OR team_id IN (
    SELECT t.id
    FROM public.teams t
    WHERE t.coach_id = (SELECT auth.uid())
  )
  OR user_id = (SELECT auth.uid())
);

CREATE POLICY "team_members_delete_access"
ON public.team_members
FOR DELETE
TO authenticated
USING (
  (SELECT public.is_active_superadmin())
  OR team_id IN (
    SELECT t.id
    FROM public.teams t
    WHERE t.coach_id = (SELECT auth.uid())
  )
  OR (
    user_id = (SELECT auth.uid())
    AND role = 'player'
  )
);

-- ============================================================================
-- TEAM INVITATIONS
-- ============================================================================

DROP POLICY IF EXISTS "Coaches can view invitations for their teams" ON public.team_invitations;
DROP POLICY IF EXISTS "Invitees can view invitations sent to their email" ON public.team_invitations;

CREATE POLICY "team_invitations_select_access"
ON public.team_invitations
FOR SELECT
TO authenticated
USING (
  team_id IN (
    SELECT t.id
    FROM public.teams t
    WHERE t.coach_id = (SELECT auth.uid())
  )
  OR lower(email::text) = lower(
    COALESCE(
      (
        SELECT u.email
        FROM public.users u
        WHERE u.id = (SELECT auth.uid())
      ),
      ''
    )::text
  )
);

-- ============================================================================
-- COACH FILM / PLAYBOOK TABLES
-- ============================================================================

DROP POLICY IF EXISTS "App active team members can view coach film sessions" ON public.coach_film_sessions;
DROP POLICY IF EXISTS "App coaches can manage coach film sessions" ON public.coach_film_sessions;

CREATE POLICY "coach_film_sessions_select_access"
ON public.coach_film_sessions
FOR SELECT
TO authenticated
USING (
  (SELECT public.is_active_superadmin())
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = public.coach_film_sessions.team_id
      AND tm.user_id = (SELECT auth.uid())
      AND tm.status = 'active'
  )
);

CREATE POLICY "coach_film_sessions_insert_access"
ON public.coach_film_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT public.is_active_superadmin())
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = public.coach_film_sessions.team_id
      AND tm.user_id = (SELECT auth.uid())
      AND tm.status = 'active'
      AND tm.role IN ('owner', 'admin', 'head_coach', 'coach', 'offense_coordinator', 'defense_coordinator', 'assistant_coach', 'manager')
  )
);

CREATE POLICY "coach_film_sessions_update_access"
ON public.coach_film_sessions
FOR UPDATE
TO authenticated
USING (
  (SELECT public.is_active_superadmin())
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = public.coach_film_sessions.team_id
      AND tm.user_id = (SELECT auth.uid())
      AND tm.status = 'active'
      AND tm.role IN ('owner', 'admin', 'head_coach', 'coach', 'offense_coordinator', 'defense_coordinator', 'assistant_coach', 'manager')
  )
)
WITH CHECK (
  (SELECT public.is_active_superadmin())
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = public.coach_film_sessions.team_id
      AND tm.user_id = (SELECT auth.uid())
      AND tm.status = 'active'
      AND tm.role IN ('owner', 'admin', 'head_coach', 'coach', 'offense_coordinator', 'defense_coordinator', 'assistant_coach', 'manager')
  )
);

CREATE POLICY "coach_film_sessions_delete_access"
ON public.coach_film_sessions
FOR DELETE
TO authenticated
USING (
  (SELECT public.is_active_superadmin())
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = public.coach_film_sessions.team_id
      AND tm.user_id = (SELECT auth.uid())
      AND tm.status = 'active'
      AND tm.role IN ('owner', 'admin', 'head_coach', 'coach', 'offense_coordinator', 'defense_coordinator', 'assistant_coach', 'manager')
  )
);

DROP POLICY IF EXISTS "App active team members can view coach film tags" ON public.coach_film_tags;
DROP POLICY IF EXISTS "App coaches can manage coach film tags" ON public.coach_film_tags;

CREATE POLICY "coach_film_tags_select_access"
ON public.coach_film_tags
FOR SELECT
TO authenticated
USING (
  (SELECT public.is_active_superadmin())
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = public.coach_film_tags.team_id
      AND tm.user_id = (SELECT auth.uid())
      AND tm.status = 'active'
  )
);

CREATE POLICY "coach_film_tags_insert_access"
ON public.coach_film_tags
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT public.is_active_superadmin())
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = public.coach_film_tags.team_id
      AND tm.user_id = (SELECT auth.uid())
      AND tm.status = 'active'
      AND tm.role IN ('owner', 'admin', 'head_coach', 'coach', 'offense_coordinator', 'defense_coordinator', 'assistant_coach', 'manager')
  )
);

CREATE POLICY "coach_film_tags_update_access"
ON public.coach_film_tags
FOR UPDATE
TO authenticated
USING (
  (SELECT public.is_active_superadmin())
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = public.coach_film_tags.team_id
      AND tm.user_id = (SELECT auth.uid())
      AND tm.status = 'active'
      AND tm.role IN ('owner', 'admin', 'head_coach', 'coach', 'offense_coordinator', 'defense_coordinator', 'assistant_coach', 'manager')
  )
)
WITH CHECK (
  (SELECT public.is_active_superadmin())
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = public.coach_film_tags.team_id
      AND tm.user_id = (SELECT auth.uid())
      AND tm.status = 'active'
      AND tm.role IN ('owner', 'admin', 'head_coach', 'coach', 'offense_coordinator', 'defense_coordinator', 'assistant_coach', 'manager')
  )
);

CREATE POLICY "coach_film_tags_delete_access"
ON public.coach_film_tags
FOR DELETE
TO authenticated
USING (
  (SELECT public.is_active_superadmin())
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = public.coach_film_tags.team_id
      AND tm.user_id = (SELECT auth.uid())
      AND tm.status = 'active'
      AND tm.role IN ('owner', 'admin', 'head_coach', 'coach', 'offense_coordinator', 'defense_coordinator', 'assistant_coach', 'manager')
  )
);

DROP POLICY IF EXISTS "App active team members can view coach playbook plays" ON public.coach_playbook_plays;
DROP POLICY IF EXISTS "App coaches can manage coach playbook plays" ON public.coach_playbook_plays;

CREATE POLICY "coach_playbook_plays_select_access"
ON public.coach_playbook_plays
FOR SELECT
TO authenticated
USING (
  (SELECT public.is_active_superadmin())
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = public.coach_playbook_plays.team_id
      AND tm.user_id = (SELECT auth.uid())
      AND tm.status = 'active'
  )
);

CREATE POLICY "coach_playbook_plays_insert_access"
ON public.coach_playbook_plays
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT public.is_active_superadmin())
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = public.coach_playbook_plays.team_id
      AND tm.user_id = (SELECT auth.uid())
      AND tm.status = 'active'
      AND tm.role IN ('owner', 'admin', 'head_coach', 'coach', 'offense_coordinator', 'defense_coordinator', 'assistant_coach', 'manager')
  )
);

CREATE POLICY "coach_playbook_plays_update_access"
ON public.coach_playbook_plays
FOR UPDATE
TO authenticated
USING (
  (SELECT public.is_active_superadmin())
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = public.coach_playbook_plays.team_id
      AND tm.user_id = (SELECT auth.uid())
      AND tm.status = 'active'
      AND tm.role IN ('owner', 'admin', 'head_coach', 'coach', 'offense_coordinator', 'defense_coordinator', 'assistant_coach', 'manager')
  )
)
WITH CHECK (
  (SELECT public.is_active_superadmin())
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = public.coach_playbook_plays.team_id
      AND tm.user_id = (SELECT auth.uid())
      AND tm.status = 'active'
      AND tm.role IN ('owner', 'admin', 'head_coach', 'coach', 'offense_coordinator', 'defense_coordinator', 'assistant_coach', 'manager')
  )
);

CREATE POLICY "coach_playbook_plays_delete_access"
ON public.coach_playbook_plays
FOR DELETE
TO authenticated
USING (
  (SELECT public.is_active_superadmin())
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = public.coach_playbook_plays.team_id
      AND tm.user_id = (SELECT auth.uid())
      AND tm.status = 'active'
      AND tm.role IN ('owner', 'admin', 'head_coach', 'coach', 'offense_coordinator', 'defense_coordinator', 'assistant_coach', 'manager')
  )
);

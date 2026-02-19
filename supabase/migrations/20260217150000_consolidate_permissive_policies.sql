-- Consolidate overlapping permissive RLS policies for performance.
-- Goal: avoid multiple permissive policies on the same table/action/role.

-- ============================================================================
-- parent_guardian_links
-- ============================================================================
DROP POLICY IF EXISTS "Parents can manage links" ON public.parent_guardian_links;

CREATE POLICY "Parents can insert links"
ON public.parent_guardian_links
FOR INSERT
TO public
WITH CHECK (parent_id = (SELECT auth.uid()));

CREATE POLICY "Parents can update links"
ON public.parent_guardian_links
FOR UPDATE
TO public
USING (parent_id = (SELECT auth.uid()))
WITH CHECK (parent_id = (SELECT auth.uid()));

CREATE POLICY "Parents can delete links"
ON public.parent_guardian_links
FOR DELETE
TO public
USING (parent_id = (SELECT auth.uid()));

-- ============================================================================
-- physical_measurements
-- ============================================================================
DROP POLICY IF EXISTS "Users can delete their own measurements" ON public.physical_measurements;
DROP POLICY IF EXISTS "Users can insert their own measurements" ON public.physical_measurements;
DROP POLICY IF EXISTS "Users can view their own measurements" ON public.physical_measurements;
DROP POLICY IF EXISTS "Users can update their own measurements" ON public.physical_measurements;

-- Keep existing "Users can manage own measurements" policy.

-- ============================================================================
-- team_templates
-- ============================================================================
DROP POLICY IF EXISTS "Coaches can manage templates" ON public.team_templates;

CREATE POLICY "Coaches can insert templates"
ON public.team_templates
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_members.team_id = team_templates.team_id
      AND team_members.user_id = (SELECT auth.uid())
      AND team_members.role::text = ANY (ARRAY['coach','head_coach','admin'])
  )
);

CREATE POLICY "Coaches can update templates"
ON public.team_templates
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_members.team_id = team_templates.team_id
      AND team_members.user_id = (SELECT auth.uid())
      AND team_members.role::text = ANY (ARRAY['coach','head_coach','admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_members.team_id = team_templates.team_id
      AND team_members.user_id = (SELECT auth.uid())
      AND team_members.role::text = ANY (ARRAY['coach','head_coach','admin'])
  )
);

CREATE POLICY "Coaches can delete templates"
ON public.team_templates
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_members.team_id = team_templates.team_id
      AND team_members.user_id = (SELECT auth.uid())
      AND team_members.role::text = ANY (ARRAY['coach','head_coach','admin'])
  )
);

-- ============================================================================
-- teams
-- ============================================================================
DROP POLICY IF EXISTS "Coaches can manage teams" ON public.teams;

CREATE POLICY "Coaches can insert teams"
ON public.teams
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_members.team_id = teams.id
      AND team_members.user_id = (SELECT auth.uid())
      AND team_members.role::text = ANY (ARRAY['coach','head_coach','admin'])
  )
);

CREATE POLICY "Coaches can update teams"
ON public.teams
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_members.team_id = teams.id
      AND team_members.user_id = (SELECT auth.uid())
      AND team_members.role::text = ANY (ARRAY['coach','head_coach','admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_members.team_id = teams.id
      AND team_members.user_id = (SELECT auth.uid())
      AND team_members.role::text = ANY (ARRAY['coach','head_coach','admin'])
  )
);

CREATE POLICY "Coaches can delete teams"
ON public.teams
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_members.team_id = teams.id
      AND team_members.user_id = (SELECT auth.uid())
      AND team_members.role::text = ANY (ARRAY['coach','head_coach','admin'])
  )
);

-- ============================================================================
-- template_assignments
-- ============================================================================
DROP POLICY IF EXISTS "Coaches can manage assignments" ON public.template_assignments;

CREATE POLICY "Coaches can insert assignments"
ON public.template_assignments
FOR INSERT
TO public
WITH CHECK (assigned_by = (SELECT auth.uid()));

CREATE POLICY "Coaches can update assignments"
ON public.template_assignments
FOR UPDATE
TO public
USING (assigned_by = (SELECT auth.uid()))
WITH CHECK (assigned_by = (SELECT auth.uid()));

CREATE POLICY "Coaches can delete assignments"
ON public.template_assignments
FOR DELETE
TO public
USING (assigned_by = (SELECT auth.uid()));

-- ============================================================================
-- training_sessions
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage own training sessions" ON public.training_sessions;

CREATE POLICY "Users can insert own training sessions"
ON public.training_sessions
FOR INSERT
TO public
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own training sessions"
ON public.training_sessions
FOR DELETE
TO public
USING (user_id = (SELECT auth.uid()));

-- Keep merged_select_training_sessions_public and merged_update_training_sessions_public.

-- ============================================================================
-- video_assignments
-- ============================================================================
DROP POLICY IF EXISTS "Coaches can manage assignments" ON public.video_assignments;

CREATE POLICY "Coaches can insert video assignments"
ON public.video_assignments
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_members.user_id = (SELECT auth.uid())
      AND team_members.team_id = video_assignments.team_id
      AND team_members.role::text = ANY (ARRAY['coach','head_coach','admin'])
  )
);

CREATE POLICY "Coaches can update video assignments"
ON public.video_assignments
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_members.user_id = (SELECT auth.uid())
      AND team_members.team_id = video_assignments.team_id
      AND team_members.role::text = ANY (ARRAY['coach','head_coach','admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_members.user_id = (SELECT auth.uid())
      AND team_members.team_id = video_assignments.team_id
      AND team_members.role::text = ANY (ARRAY['coach','head_coach','admin'])
  )
);

CREATE POLICY "Coaches can delete video assignments"
ON public.video_assignments
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_members.user_id = (SELECT auth.uid())
      AND team_members.team_id = video_assignments.team_id
      AND team_members.role::text = ANY (ARRAY['coach','head_coach','admin'])
  )
);

-- ============================================================================
-- video_playlists
-- ============================================================================
DROP POLICY IF EXISTS "Coaches can manage playlists" ON public.video_playlists;

CREATE POLICY "Coaches can insert playlists"
ON public.video_playlists
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_members.user_id = (SELECT auth.uid())
      AND team_members.team_id = video_playlists.team_id
      AND team_members.role::text = ANY (ARRAY['coach','head_coach','admin'])
  )
);

CREATE POLICY "Coaches can update playlists"
ON public.video_playlists
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_members.user_id = (SELECT auth.uid())
      AND team_members.team_id = video_playlists.team_id
      AND team_members.role::text = ANY (ARRAY['coach','head_coach','admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_members.user_id = (SELECT auth.uid())
      AND team_members.team_id = video_playlists.team_id
      AND team_members.role::text = ANY (ARRAY['coach','head_coach','admin'])
  )
);

CREATE POLICY "Coaches can delete playlists"
ON public.video_playlists
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_members.user_id = (SELECT auth.uid())
      AND team_members.team_id = video_playlists.team_id
      AND team_members.role::text = ANY (ARRAY['coach','head_coach','admin'])
  )
);

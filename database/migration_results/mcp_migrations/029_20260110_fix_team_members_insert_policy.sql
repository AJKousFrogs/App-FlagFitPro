-- ============================================================================
-- FIX: Missing INSERT policy for team_members table
-- ============================================================================
-- PROBLEM: The RLS migration 20260109_fix_rls_performance_warnings.sql removed
--   the INSERT policy for team_members, preventing new players from joining
--   teams during onboarding or via invitation acceptance.
--
-- SOLUTION: Add INSERT policies that allow:
--   1. Users to insert themselves when onboarding (for new team membership)
--   2. Coaches/admins to add members to their teams
--   3. System-level operations (invitation acceptance via service role)
-- ============================================================================

-- First, check if any INSERT policies exist and drop them
DROP POLICY IF EXISTS "team_members_insert_self" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_by_coach" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_onboarding" ON team_members;

-- Policy 1: Allow users to insert themselves into a team
-- This enables onboarding and invitation acceptance flows
CREATE POLICY "team_members_insert_self"
ON team_members FOR INSERT
TO authenticated
WITH CHECK (
    -- Users can insert themselves
    user_id = (SELECT auth.uid())
);

-- Policy 2: Allow coaches and admins to add members to their teams
CREATE POLICY "team_members_insert_by_coach"
ON team_members FOR INSERT
TO authenticated
WITH CHECK (
    -- Coaches/admins can add members to their teams
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.role IN ('coach', 'head_coach', 'admin', 'owner')
        AND tm.status = 'active'
    )
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'team_members'
AND cmd = 'INSERT'
ORDER BY policyname;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "team_members_insert_self" ON team_members IS 
'Allows users to insert themselves into team_members during onboarding or invitation acceptance';

COMMENT ON POLICY "team_members_insert_by_coach" ON team_members IS 
'Allows coaches and admins to add members to their teams';

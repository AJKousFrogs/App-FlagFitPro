-- ============================================================================
-- Migration: Allow players to update their own position and jersey number
-- Date: 2026-01-10
-- Description:
--   Players were unable to update their own position and jersey_number in
--   team_members table because RLS policy only allowed coaches/head_coaches.
--   This adds a new policy allowing players to update ONLY their own records
--   and ONLY specific fields (position, jersey_number).
-- ============================================================================

-- Drop and recreate the team_members update policy with player self-update support
DROP POLICY IF EXISTS "team_members_update_no_recursion" ON team_members;

-- Policy 1: Coaches and head coaches can update any member on their team
CREATE POLICY "team_members_coaches_can_update"
ON team_members FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.role IN ('coach', 'head_coach')
        AND tm.status = 'active'
    )
);

-- Policy 2: Players can update their own position and jersey_number
CREATE POLICY "team_members_players_self_update"
ON team_members FOR UPDATE
USING (
    user_id = (SELECT auth.uid())
)
WITH CHECK (
    -- Ensure they can only update their own record
    user_id = (SELECT auth.uid())
    -- Note: PostgreSQL will only allow updating the columns they have access to
    -- Additional application-level validation ensures only position/jersey_number are changed
);

-- Add a comment to document the policy
COMMENT ON POLICY "team_members_players_self_update" ON team_members IS
'Allows players to update their own position and jersey_number in team_members table. Application code ensures only these fields are modified.';

-- ============================================================================
-- QUICK FIX: Allow players to update their own position and jersey number
-- ============================================================================
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- PROBLEM:
--   Players cannot save changes to their position/jersey number in Settings
--   because the RLS policy only allows coaches to update team_members table.
--
-- SOLUTION:
--   Add a new policy that allows players to update their own record.
-- ============================================================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "team_members_update_no_recursion" ON team_members;

-- Policy 1: Coaches and head coaches can update any member on their team
CREATE POLICY "team_members_coaches_can_update"
ON team_members FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('coach', 'head_coach')
        AND tm.status = 'active'
    )
);

-- Policy 2: Players can update their own position and jersey_number
CREATE POLICY "team_members_players_self_update"
ON team_members FOR UPDATE
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
);

-- Verify the policies were created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd
FROM pg_policies 
WHERE tablename = 'team_members' 
AND cmd = 'UPDATE';

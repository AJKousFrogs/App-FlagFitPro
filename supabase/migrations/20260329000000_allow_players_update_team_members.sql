-- ==========================================================================
-- Allow players to update their own team_members row (position/jersey)
-- ==========================================================================

-- Drop the restrictive coach-only update policy
DROP POLICY IF EXISTS "team_members_update_no_recursion" ON team_members;

-- Coaches (and head coaches) continue to manage memberships for their team
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

-- Players may update their own membership (position and jersey)
CREATE POLICY "team_members_players_self_update"
ON team_members FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

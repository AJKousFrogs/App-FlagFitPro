-- ============================================================================
-- Migration: Roster Management Tables
-- Description: Creates team_players and team_invitations tables with RLS policies
-- Created: 2024-12-27
-- ============================================================================

-- =============================================================================
-- TEAM PLAYERS TABLE
-- Stores individual players on a team roster (separate from team_members which
-- tracks user accounts and their roles)
-- =============================================================================

CREATE TABLE IF NOT EXISTS team_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Player Information
    name VARCHAR(255) NOT NULL,
    position VARCHAR(50) NOT NULL,
    jersey_number VARCHAR(10),
    
    -- Demographics
    country VARCHAR(100),
    age INTEGER CHECK (age >= 0 AND age <= 100),
    height VARCHAR(20),
    weight VARCHAR(20),
    
    -- Contact (visible to coaches only)
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'injured', 'inactive')),
    
    -- Optional link to user account (if player has account)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Performance stats (JSONB for flexibility)
    stats JSONB DEFAULT '{}',
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TEAM INVITATIONS TABLE
-- Tracks pending invitations to join a team
-- =============================================================================

CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Invitation details
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'player' CHECK (role IN ('player', 'assistant_coach', 'coach')),
    message TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    
    -- Tracking
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Expiration
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate pending invitations
    UNIQUE(team_id, email, status)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Team Players indexes
CREATE INDEX IF NOT EXISTS idx_team_players_team ON team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_position ON team_players(position);
CREATE INDEX IF NOT EXISTS idx_team_players_status ON team_players(status);
CREATE INDEX IF NOT EXISTS idx_team_players_user ON team_players(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_team_players_created_by ON team_players(created_by);

-- Team Invitations indexes
CREATE INDEX IF NOT EXISTS idx_team_invitations_team ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_expires ON team_invitations(expires_at);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamp trigger for team_players
CREATE TRIGGER update_team_players_updated_at
    BEFORE UPDATE ON team_players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for team_invitations
CREATE TRIGGER update_team_invitations_updated_at
    BEFORE UPDATE ON team_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTION: Check user's role in a team
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_team_role(p_user_id UUID, p_team_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    SELECT role INTO v_role
    FROM team_members
    WHERE user_id = p_user_id AND team_id = p_team_id
    LIMIT 1;
    
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- HELPER FUNCTION: Check if user is coach or higher
-- =============================================================================

CREATE OR REPLACE FUNCTION is_team_coach_or_higher(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    v_role := get_user_team_role(p_user_id, p_team_id);
    RETURN v_role IN ('coach', 'assistant_coach', 'owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- HELPER FUNCTION: Check if user is owner or admin
-- =============================================================================

CREATE OR REPLACE FUNCTION is_team_owner_or_admin(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    v_role := get_user_team_role(p_user_id, p_team_id);
    RETURN v_role IN ('owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TEAM PLAYERS RLS POLICIES
-- =============================================================================

-- DROP existing policies if they exist
DROP POLICY IF EXISTS "Team members can view team players" ON team_players;
DROP POLICY IF EXISTS "Coaches can insert team players" ON team_players;
DROP POLICY IF EXISTS "Coaches can update team players" ON team_players;
DROP POLICY IF EXISTS "Owners can delete team players" ON team_players;

-- SELECT: All team members can view players on their team
CREATE POLICY "Team members can view team players"
ON team_players FOR SELECT
TO authenticated
USING (
    team_id IN (
        SELECT tm.team_id FROM team_members tm
        WHERE tm.user_id = (SELECT auth.uid())
    )
);

-- INSERT: Coaches, assistant coaches, owners, and admins can add players
CREATE POLICY "Coaches can insert team players"
ON team_players FOR INSERT
TO authenticated
WITH CHECK (
    is_team_coach_or_higher((SELECT auth.uid()), team_id)
);

-- UPDATE: Coaches, assistant coaches, owners, and admins can update players
CREATE POLICY "Coaches can update team players"
ON team_players FOR UPDATE
TO authenticated
USING (
    is_team_coach_or_higher((SELECT auth.uid()), team_id)
)
WITH CHECK (
    is_team_coach_or_higher((SELECT auth.uid()), team_id)
);

-- DELETE: Only owners and admins can delete players
CREATE POLICY "Owners can delete team players"
ON team_players FOR DELETE
TO authenticated
USING (
    is_team_owner_or_admin((SELECT auth.uid()), team_id)
);

-- =============================================================================
-- TEAM INVITATIONS RLS POLICIES
-- =============================================================================

-- DROP existing policies if they exist
DROP POLICY IF EXISTS "Coaches can view team invitations" ON team_invitations;
DROP POLICY IF EXISTS "Invitees can view their invitations" ON team_invitations;
DROP POLICY IF EXISTS "Coaches can create invitations" ON team_invitations;
DROP POLICY IF EXISTS "Coaches can update invitations" ON team_invitations;
DROP POLICY IF EXISTS "Invitees can accept invitations" ON team_invitations;
DROP POLICY IF EXISTS "Owners can delete invitations" ON team_invitations;

-- SELECT: Coaches can view all team invitations
CREATE POLICY "Coaches can view team invitations"
ON team_invitations FOR SELECT
TO authenticated
USING (
    is_team_coach_or_higher((SELECT auth.uid()), team_id)
);

-- SELECT: Users can view invitations sent to their email
CREATE POLICY "Invitees can view their invitations"
ON team_invitations FOR SELECT
TO authenticated
USING (
    email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
);

-- INSERT: Coaches can create invitations
CREATE POLICY "Coaches can create invitations"
ON team_invitations FOR INSERT
TO authenticated
WITH CHECK (
    is_team_coach_or_higher((SELECT auth.uid()), team_id)
);

-- UPDATE: Coaches can update invitations (cancel, resend, etc.)
CREATE POLICY "Coaches can update invitations"
ON team_invitations FOR UPDATE
TO authenticated
USING (
    is_team_coach_or_higher((SELECT auth.uid()), team_id)
)
WITH CHECK (
    is_team_coach_or_higher((SELECT auth.uid()), team_id)
);

-- UPDATE: Invitees can accept/decline their invitations
CREATE POLICY "Invitees can accept invitations"
ON team_invitations FOR UPDATE
TO authenticated
USING (
    email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
    AND status = 'pending'
)
WITH CHECK (
    email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
    AND status IN ('accepted', 'declined')
);

-- DELETE: Only owners and admins can delete invitations
CREATE POLICY "Owners can delete invitations"
ON team_invitations FOR DELETE
TO authenticated
USING (
    is_team_owner_or_admin((SELECT auth.uid()), team_id)
);

-- =============================================================================
-- FUNCTION: Accept team invitation
-- =============================================================================

CREATE OR REPLACE FUNCTION accept_team_invitation(p_invitation_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_invitation team_invitations%ROWTYPE;
    v_user_id UUID;
    v_user_email TEXT;
BEGIN
    v_user_id := auth.uid();
    
    -- Get user email
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    
    -- Get invitation
    SELECT * INTO v_invitation
    FROM team_invitations
    WHERE id = p_invitation_id
      AND email = v_user_email
      AND status = 'pending'
      AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
    END IF;
    
    -- Update invitation status
    UPDATE team_invitations
    SET status = 'accepted',
        accepted_by = v_user_id,
        updated_at = NOW()
    WHERE id = p_invitation_id;
    
    -- Add user to team
    INSERT INTO team_members (team_id, user_id, role, status, joined_at)
    VALUES (v_invitation.team_id, v_user_id, v_invitation.role, 'active', NOW())
    ON CONFLICT (user_id, team_id) DO UPDATE
    SET role = v_invitation.role,
        status = 'active',
        updated_at = NOW();
    
    RETURN jsonb_build_object(
        'success', true,
        'team_id', v_invitation.team_id,
        'role', v_invitation.role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION: Decline team invitation
-- =============================================================================

CREATE OR REPLACE FUNCTION decline_team_invitation(p_invitation_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
BEGIN
    v_user_id := auth.uid();
    
    -- Get user email
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    
    -- Update invitation status
    UPDATE team_invitations
    SET status = 'declined',
        updated_at = NOW()
    WHERE id = p_invitation_id
      AND email = v_user_email
      AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid invitation');
    END IF;
    
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION: Expire old invitations (run periodically)
-- =============================================================================

CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE team_invitations
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'pending'
      AND expires_at < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT EXECUTE ON FUNCTION get_user_team_role TO authenticated;
GRANT EXECUTE ON FUNCTION is_team_coach_or_higher TO authenticated;
GRANT EXECUTE ON FUNCTION is_team_owner_or_admin TO authenticated;
GRANT EXECUTE ON FUNCTION accept_team_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION decline_team_invitation TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE team_players IS 'Stores individual players on team rosters, separate from user accounts';
COMMENT ON TABLE team_invitations IS 'Tracks pending invitations to join teams';
COMMENT ON FUNCTION get_user_team_role IS 'Returns the role of a user in a specific team';
COMMENT ON FUNCTION is_team_coach_or_higher IS 'Checks if user has coach-level permissions or higher';
COMMENT ON FUNCTION is_team_owner_or_admin IS 'Checks if user has owner or admin permissions';
COMMENT ON FUNCTION accept_team_invitation IS 'Allows a user to accept a team invitation';
COMMENT ON FUNCTION decline_team_invitation IS 'Allows a user to decline a team invitation';
COMMENT ON FUNCTION expire_old_invitations IS 'Marks expired invitations as expired';

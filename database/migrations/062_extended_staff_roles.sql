-- ============================================================================
-- Migration: Extended Staff Roles
-- Description: Updates team_members role constraint and helper functions
--              to support full coaching/medical/performance staff hierarchy
-- Created: 2024-12-27
-- ============================================================================

-- =============================================================================
-- STAFF ROLE HIERARCHY
-- =============================================================================
-- 
-- OWNERSHIP & ADMIN:
--   - owner: Team Owner (full permissions)
--   - admin: Administrator (full permissions)
--
-- COACHING STAFF:
--   - head_coach: Head Coach (can manage roster, delete players)
--   - offense_coordinator: Offense Coordinator (can manage roster)
--   - defense_coordinator: Defense Coordinator (can manage roster)
--   - assistant_coach: Assistant Coach (can manage roster)
--
-- MEDICAL STAFF:
--   - physiotherapist: Physiotherapist (can view health data)
--   - nutritionist: Nutritionist (can view health data)
--
-- PERFORMANCE STAFF:
--   - strength_conditioning_coach: S&C Coach (can view health data)
--
-- OTHER:
--   - manager: Team Manager
--   - player: Player (basic access)
--
-- =============================================================================

-- =============================================================================
-- UPDATE ROLE CONSTRAINT ON TEAM_MEMBERS
-- =============================================================================

-- First, drop the existing constraint if it exists
DO $$
BEGIN
    ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_role_check;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Add new constraint with all staff roles
ALTER TABLE team_members ADD CONSTRAINT team_members_role_check 
CHECK (role IN (
    -- Players
    'player',
    -- Ownership & Admin
    'owner', 
    'admin',
    -- Coaching Staff
    'head_coach',
    'coach',  -- Legacy, maps to head_coach
    'offense_coordinator',
    'defense_coordinator',
    'assistant_coach',
    -- Medical Staff
    'physiotherapist',
    'nutritionist',
    -- Performance Staff
    'strength_conditioning_coach',
    -- Other
    'manager'
));

-- =============================================================================
-- UPDATE TEAM_INVITATIONS ROLE CONSTRAINT
-- =============================================================================

DO $$
BEGIN
    ALTER TABLE team_invitations DROP CONSTRAINT IF EXISTS team_invitations_role_check;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE team_invitations ADD CONSTRAINT team_invitations_role_check 
CHECK (role IN (
    'player',
    'head_coach',
    'coach',
    'offense_coordinator',
    'defense_coordinator',
    'assistant_coach',
    'physiotherapist',
    'nutritionist',
    'strength_conditioning_coach'
));

-- =============================================================================
-- UPDATE HELPER FUNCTIONS FOR ROLE CHECKING
-- =============================================================================

-- Function to check if user has coaching staff permissions (can manage roster)
CREATE OR REPLACE FUNCTION is_team_coach_or_higher(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    SELECT role INTO v_role
    FROM team_members
    WHERE user_id = p_user_id AND team_id = p_team_id
    LIMIT 1;
    
    -- Coaching staff roles that can manage roster
    RETURN v_role IN (
        'owner', 'admin',
        'head_coach', 'coach',
        'offense_coordinator', 'defense_coordinator',
        'assistant_coach'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is owner, admin, or head coach (can delete players)
CREATE OR REPLACE FUNCTION is_team_owner_or_admin(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    SELECT role INTO v_role
    FROM team_members
    WHERE user_id = p_user_id AND team_id = p_team_id
    LIMIT 1;
    
    RETURN v_role IN ('owner', 'admin', 'head_coach', 'coach');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can view health/medical data
CREATE OR REPLACE FUNCTION can_view_health_data(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    SELECT role INTO v_role
    FROM team_members
    WHERE user_id = p_user_id AND team_id = p_team_id
    LIMIT 1;
    
    -- Medical/performance staff and head coaches can view health data
    RETURN v_role IN (
        'owner', 'admin',
        'head_coach', 'coach',
        'physiotherapist', 'nutritionist',
        'strength_conditioning_coach'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is any type of staff (non-player)
CREATE OR REPLACE FUNCTION is_team_staff(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    SELECT role INTO v_role
    FROM team_members
    WHERE user_id = p_user_id AND team_id = p_team_id
    LIMIT 1;
    
    RETURN v_role IN (
        'owner', 'admin',
        'head_coach', 'coach',
        'offense_coordinator', 'defense_coordinator',
        'assistant_coach',
        'physiotherapist', 'nutritionist',
        'strength_conditioning_coach',
        'manager'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STAFF ROLES REFERENCE TABLE (for UI dropdowns)
-- =============================================================================

CREATE TABLE IF NOT EXISTS staff_roles (
    id VARCHAR(50) PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('ownership', 'coaching', 'medical', 'performance', 'other')),
    can_manage_roster BOOLEAN DEFAULT FALSE,
    can_delete_players BOOLEAN DEFAULT FALSE,
    can_view_health_data BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert staff roles
INSERT INTO staff_roles (id, display_name, category, can_manage_roster, can_delete_players, can_view_health_data, sort_order) VALUES
    -- Ownership
    ('owner', 'Team Owner', 'ownership', true, true, true, 1),
    ('admin', 'Administrator', 'ownership', true, true, true, 2),
    -- Coaching
    ('head_coach', 'Head Coach', 'coaching', true, true, true, 10),
    ('coach', 'Head Coach', 'coaching', true, true, true, 11), -- Legacy
    ('offense_coordinator', 'Offense Coordinator', 'coaching', true, false, true, 12),
    ('defense_coordinator', 'Defense Coordinator', 'coaching', true, false, true, 13),
    ('assistant_coach', 'Assistant Coach', 'coaching', true, false, false, 14),
    -- Medical
    ('physiotherapist', 'Physiotherapist', 'medical', false, false, true, 20),
    ('nutritionist', 'Nutritionist', 'medical', false, false, true, 21),
    -- Performance
    ('strength_conditioning_coach', 'Strength & Conditioning Coach', 'performance', false, false, true, 30),
    -- Other
    ('manager', 'Team Manager', 'other', false, false, false, 40),
    ('player', 'Player', 'other', false, false, false, 50)
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    category = EXCLUDED.category,
    can_manage_roster = EXCLUDED.can_manage_roster,
    can_delete_players = EXCLUDED.can_delete_players,
    can_view_health_data = EXCLUDED.can_view_health_data,
    sort_order = EXCLUDED.sort_order;

-- Enable RLS on staff_roles
ALTER TABLE staff_roles ENABLE ROW LEVEL SECURITY;

-- Everyone can read staff roles
DROP POLICY IF EXISTS "Anyone can view staff roles" ON staff_roles;
CREATE POLICY "Anyone can view staff roles"
ON staff_roles FOR SELECT
TO authenticated
USING (true);

-- Grant permissions
GRANT EXECUTE ON FUNCTION can_view_health_data TO authenticated;
GRANT EXECUTE ON FUNCTION is_team_staff TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE staff_roles IS 'Reference table for all available team staff roles';
COMMENT ON FUNCTION can_view_health_data IS 'Checks if user can view player health/medical data';
COMMENT ON FUNCTION is_team_staff IS 'Checks if user is any type of staff member (non-player)';

-- ============================================================================
-- Migration: Add Psychologist Role
-- Description: Adds psychologist role to support mental performance staff
-- Created: 2026-01-08
-- ============================================================================

-- =============================================================================
-- ADD PSYCHOLOGIST ROLE TO TEAM_MEMBERS CONSTRAINT
-- =============================================================================

-- Update team_members role constraint to include psychologist
DO $$
BEGIN
    -- Drop existing constraint
    ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_role_check;
    
    -- Add new constraint with psychologist role
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
        'psychologist',  -- NEW: Mental performance staff
        -- Performance Staff
        'strength_conditioning_coach',
        -- Other
        'manager'
    ));
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating team_members constraint: %', SQLERRM;
END $$;

-- =============================================================================
-- UPDATE TEAM_INVITATIONS ROLE CONSTRAINT
-- =============================================================================

DO $$
BEGIN
    -- Drop existing constraint
    ALTER TABLE team_invitations DROP CONSTRAINT IF EXISTS team_invitations_role_check;
    
    -- Add new constraint with psychologist role
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
        'psychologist',  -- NEW
        'strength_conditioning_coach'
    ));
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating team_invitations constraint: %', SQLERRM;
END $$;

-- =============================================================================
-- UPDATE HELPER FUNCTIONS TO INCLUDE PSYCHOLOGIST
-- =============================================================================

-- Update can_view_health_data to include psychologist
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
    -- Psychologist added for mental readiness data (with athlete consent)
    RETURN v_role IN (
        'owner', 'admin',
        'head_coach', 'coach',
        'physiotherapist', 'nutritionist', 'psychologist',
        'strength_conditioning_coach'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update is_team_staff to include psychologist
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
        'physiotherapist', 'nutritionist', 'psychologist',
        'strength_conditioning_coach',
        'manager'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ADD PSYCHOLOGIST TO STAFF_ROLES TABLE
-- =============================================================================

-- Insert psychologist role into staff_roles reference table
INSERT INTO staff_roles (id, display_name, category, can_manage_roster, can_delete_players, can_view_health_data, sort_order) VALUES
    ('psychologist', 'Psychologist', 'medical', false, false, true, 22)
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    category = EXCLUDED.category,
    can_manage_roster = EXCLUDED.can_manage_roster,
    can_delete_players = EXCLUDED.can_delete_players,
    can_view_health_data = EXCLUDED.can_view_health_data,
    sort_order = EXCLUDED.sort_order;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION can_view_health_data IS 'Checks if user can view player health/medical data. Includes psychologist for mental readiness data (with athlete consent).';

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify psychologist role was added
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM staff_roles
    WHERE id = 'psychologist';
    
    IF v_count = 0 THEN
        RAISE EXCEPTION 'Failed to add psychologist role to staff_roles table';
    ELSE
        RAISE NOTICE 'Successfully added psychologist role';
    END IF;
END $$;


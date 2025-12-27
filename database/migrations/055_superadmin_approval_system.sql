-- Migration: Superadmin Approval System
-- Purpose: Restrict app access to approved teams and admins only
-- 
-- BUSINESS LOGIC:
-- 1. New teams require SUPERADMIN approval before becoming active
-- 2. Team admins/coaches require SUPERADMIN approval before gaining privileges
-- 3. Only approved teams and their approved admins can fully use the app
-- 4. This keeps the platform exclusive for serious Olympic-track athletes (LA28, Brisbane 2032)
--
-- APPROVAL WORKFLOW:
-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 1. User creates a team → Team status = 'pending_approval'              │
-- │ 2. Superadmin reviews → Approves/Rejects team                          │
-- │ 3. If approved → Team status = 'approved', creator becomes admin       │
-- │ 4. Admin invites members → Members join with 'player' role             │
-- │ 5. Admin promotes user to coach/admin → Requires superadmin approval   │
-- └─────────────────────────────────────────────────────────────────────────┘

-- =====================================================
-- STEP 1: ADD APPROVAL COLUMNS TO TEAMS TABLE
-- =====================================================

-- Add approval status to teams
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) DEFAULT 'pending_approval' 
  CHECK (approval_status IN ('pending_approval', 'approved', 'rejected', 'suspended'));

-- Add approval metadata
ALTER TABLE teams ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS application_notes TEXT; -- Notes from team creator

-- Add Olympic track indicator
ALTER TABLE teams ADD COLUMN IF NOT EXISTS olympic_track VARCHAR(30) 
  CHECK (olympic_track IN ('la_2028', 'brisbane_2032', 'both', 'domestic_only'));

-- =====================================================
-- STEP 2: ADD APPROVAL STATUS TO TEAM_MEMBERS FOR ADMIN ROLES
-- =====================================================

-- Add approval status for elevated roles (admin, coach)
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS role_approval_status VARCHAR(30) DEFAULT 'approved'
  CHECK (role_approval_status IN ('pending_approval', 'approved', 'rejected'));

-- Add approval metadata
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS role_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS role_approved_at TIMESTAMPTZ;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS role_rejection_reason TEXT;

-- Note: Players don't need approval, only admin/coach roles do

-- =====================================================
-- STEP 3: CREATE SUPERADMIN TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS superadmins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  
  UNIQUE(user_id)
);

-- Enable RLS on superadmins table
ALTER TABLE superadmins ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view the superadmins table
CREATE POLICY "Superadmins can view superadmin list"
ON superadmins FOR SELECT
USING (is_superadmin());

-- Only existing superadmins can add new superadmins
CREATE POLICY "Superadmins can manage superadmin list"
ON superadmins FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- =====================================================
-- STEP 4: CREATE APPROVAL REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Request type
  request_type VARCHAR(30) NOT NULL CHECK (request_type IN ('team_creation', 'role_elevation', 'team_reinstatement')),
  
  -- What's being requested
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- User requesting or being elevated
  requested_role VARCHAR(30), -- For role_elevation requests
  
  -- Request details
  request_reason TEXT,
  olympic_goals TEXT, -- Why they want to use the platform (Olympic preparation)
  experience_level TEXT,
  federation_affiliation TEXT, -- National federation they're affiliated with
  
  -- Status
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'more_info_needed')),
  
  -- Review
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_type ON approval_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_approval_requests_team ON approval_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_user ON approval_requests(user_id);

-- Enable RLS
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own requests
CREATE POLICY "Users can view own approval requests"
ON approval_requests FOR SELECT
USING (user_id = (SELECT auth.uid()) OR is_superadmin());

-- Users can create requests
CREATE POLICY "Users can create approval requests"
ON approval_requests FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

-- Only superadmins can update (approve/reject)
CREATE POLICY "Superadmins can update approval requests"
ON approval_requests FOR UPDATE
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- =====================================================
-- STEP 5: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to check if current user is a superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.superadmins 
    WHERE user_id = (SELECT auth.uid()) 
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, auth;

COMMENT ON FUNCTION is_superadmin() IS 'Returns true if the current user is an active superadmin';

-- Function to check if a team is approved
CREATE OR REPLACE FUNCTION is_team_approved(p_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = p_team_id 
    AND approval_status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

COMMENT ON FUNCTION is_team_approved(UUID) IS 'Returns true if the specified team is approved';

-- Function to check if user has approved admin role in team
CREATE OR REPLACE FUNCTION has_approved_admin_role(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = p_team_id 
    AND user_id = p_user_id
    AND role IN ('admin', 'coach')
    AND role_approval_status = 'approved'
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

COMMENT ON FUNCTION has_approved_admin_role(UUID, UUID) IS 'Returns true if user has an approved admin/coach role in the team';

-- =====================================================
-- STEP 6: FUNCTION TO APPROVE A TEAM
-- =====================================================

CREATE OR REPLACE FUNCTION approve_team(
  p_team_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_creator_id UUID;
BEGIN
  -- Only superadmins can approve
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Only superadmins can approve teams';
  END IF;
  
  -- Update team status
  UPDATE public.teams
  SET 
    approval_status = 'approved',
    approved_by = (SELECT auth.uid()),
    approved_at = NOW()
  WHERE id = p_team_id AND approval_status = 'pending_approval';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team not found or not in pending status';
  END IF;
  
  -- Get the team creator (coach_id)
  SELECT coach_id INTO v_creator_id FROM public.teams WHERE id = p_team_id;
  
  -- Auto-approve the creator's admin role
  IF v_creator_id IS NOT NULL THEN
    UPDATE public.team_members
    SET 
      role_approval_status = 'approved',
      role_approved_by = (SELECT auth.uid()),
      role_approved_at = NOW()
    WHERE team_id = p_team_id AND user_id = v_creator_id AND role IN ('admin', 'coach');
  END IF;
  
  -- Update the approval request
  UPDATE public.approval_requests
  SET 
    status = 'approved',
    reviewed_by = (SELECT auth.uid()),
    reviewed_at = NOW(),
    review_notes = p_notes,
    updated_at = NOW()
  WHERE team_id = p_team_id AND request_type = 'team_creation' AND status = 'pending';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- =====================================================
-- STEP 7: FUNCTION TO REJECT A TEAM
-- =====================================================

CREATE OR REPLACE FUNCTION reject_team(
  p_team_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only superadmins can reject
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Only superadmins can reject teams';
  END IF;
  
  -- Update team status
  UPDATE public.teams
  SET 
    approval_status = 'rejected',
    approved_by = (SELECT auth.uid()),
    approved_at = NOW(),
    rejection_reason = p_reason
  WHERE id = p_team_id AND approval_status = 'pending_approval';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team not found or not in pending status';
  END IF;
  
  -- Update the approval request
  UPDATE public.approval_requests
  SET 
    status = 'rejected',
    reviewed_by = (SELECT auth.uid()),
    reviewed_at = NOW(),
    review_notes = p_reason,
    updated_at = NOW()
  WHERE team_id = p_team_id AND request_type = 'team_creation' AND status = 'pending';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- =====================================================
-- STEP 8: FUNCTION TO APPROVE ADMIN/COACH ROLE
-- =====================================================

CREATE OR REPLACE FUNCTION approve_admin_role(
  p_team_id UUID,
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only superadmins can approve
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Only superadmins can approve admin roles';
  END IF;
  
  -- Update role approval status
  UPDATE public.team_members
  SET 
    role_approval_status = 'approved',
    role_approved_by = (SELECT auth.uid()),
    role_approved_at = NOW()
  WHERE team_id = p_team_id 
    AND user_id = p_user_id 
    AND role IN ('admin', 'coach')
    AND role_approval_status = 'pending_approval';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team member not found or not pending admin approval';
  END IF;
  
  -- Update the approval request
  UPDATE public.approval_requests
  SET 
    status = 'approved',
    reviewed_by = (SELECT auth.uid()),
    reviewed_at = NOW(),
    review_notes = p_notes,
    updated_at = NOW()
  WHERE team_id = p_team_id 
    AND user_id = p_user_id 
    AND request_type = 'role_elevation' 
    AND status = 'pending';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- =====================================================
-- STEP 9: UPDATE RLS POLICIES FOR TEAMS
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Teams are viewable by members" ON teams;
DROP POLICY IF EXISTS "Coaches can manage their teams" ON teams;
DROP POLICY IF EXISTS "Users can view teams" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;

-- SELECT: Users can see approved teams they're members of, OR pending teams they created
-- Superadmins can see all teams
CREATE POLICY "teams_select_policy"
ON teams FOR SELECT
USING (
  is_superadmin()
  OR
  (
    approval_status = 'approved' 
    AND EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_members.team_id = teams.id 
      AND team_members.user_id = (SELECT auth.uid())
      AND team_members.status = 'active'
    )
  )
  OR
  (
    -- Creator can see their pending team
    coach_id = (SELECT auth.uid())
  )
);

-- INSERT: Anyone can create a team (but it starts as pending)
CREATE POLICY "teams_insert_policy"
ON teams FOR INSERT
WITH CHECK (
  -- Set creator as coach_id
  coach_id = (SELECT auth.uid())
  -- Must start as pending_approval
  AND approval_status = 'pending_approval'
);

-- UPDATE: Only approved admins of approved teams can update, OR superadmins
CREATE POLICY "teams_update_policy"
ON teams FOR UPDATE
USING (
  is_superadmin()
  OR
  (
    is_team_approved(id)
    AND has_approved_admin_role(id, (SELECT auth.uid()))
  )
)
WITH CHECK (
  is_superadmin()
  OR
  (
    is_team_approved(id)
    AND has_approved_admin_role(id, (SELECT auth.uid()))
    -- Non-superadmins cannot change approval_status
    AND approval_status = (SELECT approval_status FROM teams WHERE id = teams.id)
  )
);

-- DELETE: Only superadmins can delete teams
CREATE POLICY "teams_delete_policy"
ON teams FOR DELETE
USING (is_superadmin());

-- =====================================================
-- STEP 10: UPDATE RLS POLICIES FOR TEAM_MEMBERS
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Team members viewable by team" ON team_members;
DROP POLICY IF EXISTS "Team admins can manage members" ON team_members;

-- SELECT: Members can see other members of approved teams they belong to
CREATE POLICY "team_members_select_policy"
ON team_members FOR SELECT
USING (
  is_superadmin()
  OR
  (
    is_team_approved(team_id)
    AND EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = (SELECT auth.uid())
      AND tm.status = 'active'
    )
  )
);

-- INSERT: Approved admins of approved teams can add members
-- New admin/coach roles start as pending_approval
CREATE POLICY "team_members_insert_policy"
ON team_members FOR INSERT
WITH CHECK (
  is_superadmin()
  OR
  (
    is_team_approved(team_id)
    AND has_approved_admin_role(team_id, (SELECT auth.uid()))
    -- If adding admin/coach role, must be pending approval
    AND (
      role NOT IN ('admin', 'coach')
      OR role_approval_status = 'pending_approval'
    )
  )
);

-- UPDATE: Approved admins can update members, but role changes to admin/coach need approval
CREATE POLICY "team_members_update_policy"
ON team_members FOR UPDATE
USING (
  is_superadmin()
  OR
  (
    is_team_approved(team_id)
    AND has_approved_admin_role(team_id, (SELECT auth.uid()))
  )
)
WITH CHECK (
  is_superadmin()
  OR
  (
    is_team_approved(team_id)
    AND has_approved_admin_role(team_id, (SELECT auth.uid()))
    -- If changing role to admin/coach, must set pending approval
    AND (
      role NOT IN ('admin', 'coach')
      OR role_approval_status = 'pending_approval'
    )
  )
);

-- DELETE: Approved admins can remove members
CREATE POLICY "team_members_delete_policy"
ON team_members FOR DELETE
USING (
  is_superadmin()
  OR
  (
    is_team_approved(team_id)
    AND has_approved_admin_role(team_id, (SELECT auth.uid()))
  )
);

-- =====================================================
-- STEP 11: TRIGGER TO CREATE APPROVAL REQUEST ON TEAM CREATION
-- =====================================================

CREATE OR REPLACE FUNCTION create_team_approval_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Create an approval request when a new team is created
  INSERT INTO public.approval_requests (
    request_type,
    team_id,
    user_id,
    request_reason,
    olympic_goals,
    status
  ) VALUES (
    'team_creation',
    NEW.id,
    NEW.coach_id,
    NEW.application_notes,
    CASE 
      WHEN NEW.olympic_track IS NOT NULL THEN 'Olympic Track: ' || NEW.olympic_track
      ELSE NULL
    END,
    'pending'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS trigger_team_approval_request ON teams;
CREATE TRIGGER trigger_team_approval_request
AFTER INSERT ON teams
FOR EACH ROW
WHEN (NEW.approval_status = 'pending_approval')
EXECUTE FUNCTION create_team_approval_request();

-- =====================================================
-- STEP 12: TRIGGER TO CREATE APPROVAL REQUEST ON ROLE ELEVATION
-- =====================================================

CREATE OR REPLACE FUNCTION create_role_elevation_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Create an approval request when someone is promoted to admin/coach
  IF NEW.role IN ('admin', 'coach') AND NEW.role_approval_status = 'pending_approval' THEN
    INSERT INTO public.approval_requests (
      request_type,
      team_id,
      user_id,
      requested_role,
      status
    ) VALUES (
      'role_elevation',
      NEW.team_id,
      NEW.user_id,
      NEW.role,
      'pending'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS trigger_role_elevation_request ON team_members;
CREATE TRIGGER trigger_role_elevation_request
AFTER INSERT OR UPDATE OF role ON team_members
FOR EACH ROW
WHEN (NEW.role IN ('admin', 'coach') AND NEW.role_approval_status = 'pending_approval')
EXECUTE FUNCTION create_role_elevation_request();

-- =====================================================
-- STEP 13: CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_teams_approval_status ON teams(approval_status);
CREATE INDEX IF NOT EXISTS idx_teams_approved_by ON teams(approved_by);
CREATE INDEX IF NOT EXISTS idx_teams_olympic_track ON teams(olympic_track);

CREATE INDEX IF NOT EXISTS idx_team_members_role_approval ON team_members(role_approval_status);
CREATE INDEX IF NOT EXISTS idx_team_members_role_approved_by ON team_members(role_approved_by);

CREATE INDEX IF NOT EXISTS idx_superadmins_user ON superadmins(user_id);
CREATE INDEX IF NOT EXISTS idx_superadmins_active ON superadmins(is_active);

-- =====================================================
-- STEP 14: SUPERADMIN DASHBOARD VIEW
-- =====================================================

CREATE OR REPLACE VIEW pending_approvals_dashboard AS
SELECT 
  ar.id,
  ar.request_type,
  ar.status,
  ar.created_at,
  ar.request_reason,
  ar.olympic_goals,
  ar.federation_affiliation,
  -- Team info
  t.name AS team_name,
  t.team_type,
  t.country_code,
  t.olympic_track,
  -- User info
  u.email AS requester_email,
  u.first_name || ' ' || u.last_name AS requester_name,
  -- For role elevation
  ar.requested_role
FROM approval_requests ar
LEFT JOIN teams t ON ar.team_id = t.id
LEFT JOIN users u ON ar.user_id = u.id
WHERE ar.status = 'pending'
ORDER BY ar.created_at ASC;

-- Only superadmins can access this view
GRANT SELECT ON pending_approvals_dashboard TO authenticated;

-- =====================================================
-- STEP 15: COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE superadmins IS 'Tracks users with superadmin privileges who can approve teams and admin roles';

COMMENT ON TABLE approval_requests IS 'Queue of pending approvals for teams and admin role elevations';

COMMENT ON COLUMN teams.approval_status IS 'Team approval status: pending_approval (default), approved, rejected, suspended';

COMMENT ON COLUMN teams.olympic_track IS 'Which Olympic games the team is preparing for: la_2028, brisbane_2032, both, or domestic_only';

COMMENT ON COLUMN team_members.role_approval_status IS 'For admin/coach roles, whether the role has been approved by superadmin';

COMMENT ON FUNCTION approve_team(UUID, TEXT) IS 'Superadmin function to approve a pending team';

COMMENT ON FUNCTION reject_team(UUID, TEXT) IS 'Superadmin function to reject a pending team with reason';

COMMENT ON FUNCTION approve_admin_role(UUID, UUID, TEXT) IS 'Superadmin function to approve an admin/coach role elevation';

-- =====================================================
-- STEP 16: SET EXISTING TEAMS TO APPROVED (MIGRATION)
-- =====================================================

-- Approve all existing teams (grandfathered in)
UPDATE teams 
SET approval_status = 'approved', approved_at = NOW()
WHERE approval_status IS NULL OR approval_status = 'pending_approval';

-- Approve all existing admin/coach roles
UPDATE team_members 
SET role_approval_status = 'approved', role_approved_at = NOW()
WHERE role IN ('admin', 'coach') 
AND (role_approval_status IS NULL OR role_approval_status = 'pending_approval');

-- =====================================================
-- STEP 17: ADD FOUNDING SUPERADMIN
-- =====================================================

-- IMPORTANT: Only aljosa@ljubljanafrogs.si is the founding superadmin.
-- Only existing superadmins can add new superadmins (enforced by RLS).
-- This ensures the platform remains exclusive for Olympic-track athletes.

-- Note: The actual INSERT is done via SQL after migration since we need the auth.users id.
-- Run this manually or via seed script:
-- INSERT INTO superadmins (user_id, notes)
-- SELECT id, 'Founding superadmin - aljosa@ljubljanafrogs.si'
-- FROM auth.users WHERE email = 'aljosa@ljubljanafrogs.si';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary:
-- 1. Added approval_status to teams (pending_approval → approved/rejected)
-- 2. Added role_approval_status to team_members for admin/coach roles
-- 3. Created superadmins table to track who has superadmin privileges
-- 4. Created approval_requests table for tracking approval workflow
-- 5. Created helper functions: is_superadmin(), is_team_approved(), has_approved_admin_role()
-- 6. Created approval functions: approve_team(), reject_team(), approve_admin_role()
-- 7. Updated RLS policies to enforce:
--    - Only approved teams are accessible
--    - Only approved admins can manage teams
--    - Superadmins can access everything
-- 8. Created triggers to auto-create approval requests
-- 9. Created pending_approvals_dashboard view for superadmin UI
-- 10. Grandfathered existing teams and admins as approved
-- 11. Founding superadmin: aljosa@ljubljanafrogs.si (only person who can add more superadmins)
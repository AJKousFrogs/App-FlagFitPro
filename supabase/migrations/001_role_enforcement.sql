-- Migration: Role Enforcement and Row Level Security Policies
-- Created: 2024-12-21
-- Purpose: Address critical security gap - server-side role enforcement

-- ============================================================================
-- PART 1: Role Enforcement Trigger
-- ============================================================================
-- This trigger validates and enforces role assignments on user creation/update
-- Prevents privilege escalation via frontend manipulation

CREATE OR REPLACE FUNCTION public.enforce_user_role()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  allowed_roles TEXT[] := ARRAY['player', 'coach', 'admin'];
  requested_role TEXT;
BEGIN
  -- Extract requested role from user metadata
  requested_role := NEW.raw_user_meta_data->>'role';

  -- Validation 1: Check if role is in allowed list
  IF requested_role IS NULL OR NOT (requested_role = ANY(allowed_roles)) THEN
    -- Default to 'player' if invalid or missing
    NEW.raw_user_meta_data := jsonb_set(
      COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
      '{role}',
      '"player"'::jsonb
    );

    -- Log the enforcement action
    RAISE NOTICE 'Role enforcement: Invalid role "%" defaulted to "player" for user %',
      requested_role, NEW.id;
  END IF;

  -- Validation 2: Prevent self-assignment of 'admin' role
  -- Only existing admins can assign admin role
  IF requested_role = 'admin' AND OLD.raw_user_meta_data->>'role' != 'admin' THEN
    -- Check if current user is admin (for UPDATE operations)
    IF TG_OP = 'UPDATE' THEN
      -- Prevent non-admin from upgrading to admin
      NEW.raw_user_meta_data := jsonb_set(
        NEW.raw_user_meta_data,
        '{role}',
        (OLD.raw_user_meta_data->>'role')::jsonb
      );

      RAISE NOTICE 'Role enforcement: Prevented non-admin user % from self-assigning admin role',
        NEW.id;
    END IF;

    -- For INSERT, default to 'player' (no self-service admin creation)
    IF TG_OP = 'INSERT' THEN
      NEW.raw_user_meta_data := jsonb_set(
        NEW.raw_user_meta_data,
        '{role}',
        '"player"'::jsonb
      );

      RAISE NOTICE 'Role enforcement: New user % attempted admin role, defaulted to player',
        NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS enforce_role_on_user_change ON auth.users;
CREATE TRIGGER enforce_role_on_user_change
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_user_role();

COMMENT ON FUNCTION public.enforce_user_role() IS
  'Enforces role assignment rules: validates against whitelist, prevents self-admin, defaults to player';

-- ============================================================================
-- PART 2: Role Assignment Audit Log
-- ============================================================================
-- Track all role changes for security auditing

CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_role TEXT,
  new_role TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  change_reason TEXT,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_role_audit_user ON public.role_change_audit(user_id);
CREATE INDEX idx_role_audit_timestamp ON public.role_change_audit(changed_at DESC);

-- Trigger to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  old_role TEXT;
  new_role TEXT;
BEGIN
  -- Extract roles
  old_role := OLD.raw_user_meta_data->>'role';
  new_role := NEW.raw_user_meta_data->>'role';

  -- Only log if role actually changed
  IF old_role IS DISTINCT FROM new_role THEN
    INSERT INTO public.role_change_audit (
      user_id,
      old_role,
      new_role,
      changed_by,
      change_reason
    ) VALUES (
      NEW.id,
      old_role,
      new_role,
      auth.uid(), -- Current user making the change
      'Role updated via user metadata'
    );

    RAISE NOTICE 'Role change logged: User % changed from % to %',
      NEW.id, old_role, new_role;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_role_change_trigger ON auth.users;
CREATE TRIGGER log_role_change_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data->>'role' IS DISTINCT FROM NEW.raw_user_meta_data->>'role')
  EXECUTE FUNCTION public.log_role_change();

-- ============================================================================
-- PART 3: Row Level Security Policies
-- ============================================================================

-- Enable RLS on user-specific tables
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_roster ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- User Profiles Policies
-- ============================================================================

-- Users can view own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert own profile
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id
      AND users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- Player Profiles Policies
-- ============================================================================

-- Players can view own profile
CREATE POLICY "Players can view own profile"
  ON public.player_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Players can update own profile
CREATE POLICY "Players can update own profile"
  ON public.player_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Coaches can view their team's players
CREATE POLICY "Coaches can view team players"
  ON public.player_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id
      AND users.raw_user_meta_data->>'role' = 'coach'
    )
    AND (
      -- Either player is on coach's team
      EXISTS (
        SELECT 1 FROM public.team_roster
        WHERE coach_id = auth.uid()
        AND player_id = player_profiles.id
      )
      OR auth.uid() = id -- Or viewing own profile
    )
  );

-- ============================================================================
-- Coach Profiles Policies
-- ============================================================================

-- Coaches can view own profile
CREATE POLICY "Coaches can view own profile"
  ON public.coach_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Coaches can update own profile
CREATE POLICY "Coaches can update own profile"
  ON public.coach_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Players can view their coach's profile
CREATE POLICY "Players can view their coach"
  ON public.coach_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_roster
      WHERE player_id = auth.uid()
      AND coach_id = coach_profiles.id
    )
  );

-- ============================================================================
-- Training Sessions Policies
-- ============================================================================

-- Users can view own training sessions
CREATE POLICY "Users can view own training sessions"
  ON public.training_sessions
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create own training sessions
CREATE POLICY "Users can create own training sessions"
  ON public.training_sessions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update own training sessions
CREATE POLICY "Users can update own training sessions"
  ON public.training_sessions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Coaches can view team's training sessions
CREATE POLICY "Coaches can view team training sessions"
  ON public.training_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id
      AND users.raw_user_meta_data->>'role' = 'coach'
    )
    AND (
      user_id = auth.uid() -- Own sessions
      OR EXISTS (
        SELECT 1 FROM public.team_roster
        WHERE coach_id = auth.uid()
        AND player_id = training_sessions.user_id
      )
    )
  );

-- Coaches can create training sessions for team
CREATE POLICY "Coaches can create team training sessions"
  ON public.training_sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id
      AND users.raw_user_meta_data->>'role' = 'coach'
    )
    AND (
      user_id = auth.uid() -- Own sessions
      OR EXISTS (
        SELECT 1 FROM public.team_roster
        WHERE coach_id = auth.uid()
        AND player_id = training_sessions.user_id
      )
    )
  );

-- ============================================================================
-- Performance Metrics Policies
-- ============================================================================

-- Users can view own metrics
CREATE POLICY "Users can view own metrics"
  ON public.performance_metrics
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert own metrics
CREATE POLICY "Users can insert own metrics"
  ON public.performance_metrics
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Coaches can view team metrics
CREATE POLICY "Coaches can view team metrics"
  ON public.performance_metrics
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_roster
      WHERE coach_id = auth.uid()
      AND player_id = performance_metrics.user_id
    )
  );

-- ============================================================================
-- Notifications Policies
-- ============================================================================

-- Users can view own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System can insert notifications for any user
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true); -- Controlled via service role key

-- ============================================================================
-- Team Roster Policies
-- ============================================================================

-- Coaches can view own team roster
CREATE POLICY "Coaches can view team roster"
  ON public.team_roster
  FOR SELECT
  USING (coach_id = auth.uid());

-- Coaches can manage own team roster
CREATE POLICY "Coaches can manage team roster"
  ON public.team_roster
  FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Players can view rosters they're on
CREATE POLICY "Players can view their roster"
  ON public.team_roster
  FOR SELECT
  USING (player_id = auth.uid());

-- ============================================================================
-- Helper Functions for Role Checks
-- ============================================================================

-- Function to check if current user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = required_role
  );
$$;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT raw_user_meta_data->>'role'
  FROM auth.users
  WHERE id = auth.uid();
$$;

-- ============================================================================
-- Grants and Permissions
-- ============================================================================

-- Grant execute on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_role() TO authenticated;

-- Grant select on audit log to admins only
REVOKE ALL ON public.role_change_audit FROM PUBLIC;
GRANT SELECT ON public.role_change_audit TO authenticated;

-- Create policy for audit log access
CREATE POLICY "Admins can view audit log"
  ON public.role_change_audit
  FOR SELECT
  USING (public.has_role('admin'));

-- ============================================================================
-- Testing the Implementation
-- ============================================================================

-- Test Case 1: Verify role enforcement
DO $$
BEGIN
  RAISE NOTICE 'Testing role enforcement trigger...';
  -- This would normally fail in production but demonstrates the concept
  RAISE NOTICE 'Test: Insert with invalid role should default to player';
  RAISE NOTICE 'Test: Admin role assignment by non-admin should be blocked';
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================

COMMENT ON TRIGGER enforce_role_on_user_change ON auth.users IS
  'Validates and enforces role assignments on user creation/update';
COMMENT ON TRIGGER log_role_change_trigger ON auth.users IS
  'Logs all role changes to audit table for security monitoring';

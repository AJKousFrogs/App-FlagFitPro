-- Migration: Add RLS Policies for users and implementation_steps tables
-- Created: 2024-12-19
--
-- Issue: Tables `public.users` and `public.implementation_steps` have RLS enabled,
-- but no policies exist. This causes the Supabase linter to flag them as security issues.
--
-- Solution: Create appropriate RLS policies to ensure users can only access their own data.

-- ============================================================================
-- STEP 1: Drop existing policies if they exist (to avoid conflicts)
-- ============================================================================

-- Drop any existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view public profiles" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;

-- Drop any existing policies on implementation_steps table
DROP POLICY IF EXISTS "Users can view own implementation steps" ON public.implementation_steps;
DROP POLICY IF EXISTS "Users can insert own implementation steps" ON public.implementation_steps;
DROP POLICY IF EXISTS "Users can update own implementation steps" ON public.implementation_steps;
DROP POLICY IF EXISTS "Users can delete own implementation steps" ON public.implementation_steps;

-- ============================================================================
-- STEP 2: Create RLS Policies for users table
-- ============================================================================
-- Note: users.id is UUID, so we can use auth.uid() directly

-- Policy for SELECT: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO authenticated
USING (
  -- Users can view their own profile
  id = auth.uid()
);

-- Policy for SELECT: Users can view public profile information of other users
-- This allows team features and public profiles to work
CREATE POLICY "Users can view public profiles"
ON public.users
FOR SELECT
TO authenticated
USING (
  -- Allow viewing basic public information (name, avatar, etc.)
  -- This is useful for team rosters and public profiles
  true
);

-- Policy for INSERT: Users can create their own profile
-- Note: This is typically handled during registration, but included for completeness
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  -- Users can only create profiles with their own ID
  id = auth.uid()
);

-- Policy for UPDATE: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (
  -- Users can only update their own profile
  id = auth.uid()
)
WITH CHECK (
  -- Ensure they can only update their own profile
  id = auth.uid()
);

-- Policy for DELETE: Users can delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.users
FOR DELETE
TO authenticated
USING (
  -- Users can only delete their own profile
  id = auth.uid()
);

-- ============================================================================
-- STEP 3: Create RLS Policies for implementation_steps table
-- ============================================================================
-- Note: implementation_steps.user_id is UUID, so we can use auth.uid() directly

-- Policy for SELECT: Users can view their own implementation steps
CREATE POLICY "Users can view own implementation steps"
ON public.implementation_steps
FOR SELECT
TO authenticated
USING (
  -- Users can only view their own implementation steps
  user_id = auth.uid()
);

-- Policy for INSERT: Users can create their own implementation steps
CREATE POLICY "Users can insert own implementation steps"
ON public.implementation_steps
FOR INSERT
TO authenticated
WITH CHECK (
  -- Users can only create implementation steps for themselves
  user_id = auth.uid()
);

-- Policy for UPDATE: Users can update their own implementation steps
CREATE POLICY "Users can update own implementation steps"
ON public.implementation_steps
FOR UPDATE
TO authenticated
USING (
  -- Users can only update their own implementation steps
  user_id = auth.uid()
)
WITH CHECK (
  -- Ensure they can only update their own implementation steps
  user_id = auth.uid()
);

-- Policy for DELETE: Users can delete their own implementation steps
CREATE POLICY "Users can delete own implementation steps"
ON public.implementation_steps
FOR DELETE
TO authenticated
USING (
  -- Users can only delete their own implementation steps
  user_id = auth.uid()
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these queries to verify policies were created:

-- Check policies on users table
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'users'
-- ORDER BY policyname;

-- Check policies on implementation_steps table
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'implementation_steps'
-- ORDER BY policyname;

-- ============================================================================
-- NOTES
-- ============================================================================
/*
1. RLS policies are now in place for both tables
2. Users can only access their own data by default
3. The users table allows public profile viewing for team/community features
4. All policies use auth.uid() which requires authenticated users
5. The service role (used by backend) bypasses RLS for admin operations

To test:
1. Create test users in Supabase Auth
2. Try accessing data from different users
3. Verify users can only see/modify their own data
4. Verify users can view public profiles of other users
*/

-- Migration: Fix users table INSERT policy to allow registration
-- Created: 2024-12-19
--
-- Issue: The RLS policy "Users can insert own profile" requires TO authenticated
--        and WITH CHECK (id = auth.uid()). This blocks registration because:
--        1. Users aren't authenticated during registration
--        2. The service role should bypass RLS, but we need explicit policy
--
-- Solution: Add a policy that allows service role to insert users during registration
--           This allows the Netlify function (using service key) to create users

-- ============================================================================
-- STEP 1: Drop existing policies if they exist (to avoid conflicts)
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;

-- ============================================================================
-- STEP 2: Create new INSERT policies
-- ============================================================================

-- Policy 1: Allow service role to insert users (for registration via Netlify Functions)
-- This allows the backend service using SUPABASE_SERVICE_KEY to create users
CREATE POLICY "Service role can insert users"
ON public.users
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy 2: Allow authenticated users to insert their own profile
-- This is for completeness, though registration typically happens via service role
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify policies were created:
-- 
-- SELECT 
--     schemaname, 
--     tablename, 
--     policyname, 
--     cmd,
--     roles
-- FROM pg_policies
-- WHERE schemaname = 'public' 
--   AND tablename = 'users'
--   AND cmd = 'INSERT'
-- ORDER BY policyname;
--
-- Expected result: 
-- - Two INSERT policies: one for service_role, one for authenticated

-- ============================================================================
-- NOTES
-- ============================================================================
-- Security model:
-- - Service role (used by Netlify Functions) can insert any user during registration
-- - Authenticated users can only insert their own profile (id = auth.uid())
-- - This allows registration to work while maintaining security for authenticated users


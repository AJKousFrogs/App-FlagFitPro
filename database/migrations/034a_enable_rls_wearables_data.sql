-- Migration: Enable Row Level Security on wearables_data table
-- Created: 2024-12-19
--
-- Issue: Table public.wearables_data is public, but RLS has not been enabled.
-- This is a security concern as anyone with access to PostgREST could access all rows.
--
-- Solution: Enable RLS and create policies to ensure users can only access their own data.

-- ============================================================================
-- STEP 1: Enable Row Level Security
-- ============================================================================

ALTER TABLE public.wearables_data ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create RLS Policies
-- ============================================================================
-- Users can only access their own wearables data
-- user_id is VARCHAR(255), so we cast auth.uid() to text for comparison

-- Policy for SELECT: Users can view their own wearables data
CREATE POLICY wearables_data_select_policy
ON public.wearables_data
FOR SELECT
TO authenticated
USING (
  -- Regular users can view their own data
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can view all data
  (SELECT auth.role()) = 'admin'
);

-- Policy for INSERT: Users can insert their own wearables data
CREATE POLICY wearables_data_insert_policy
ON public.wearables_data
FOR INSERT
TO authenticated
WITH CHECK (
  -- Regular users can insert their own data
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can insert any data
  (SELECT auth.role()) = 'admin'
);

-- Policy for UPDATE: Users can update their own wearables data
CREATE POLICY wearables_data_update_policy
ON public.wearables_data
FOR UPDATE
TO authenticated
USING (
  -- Regular users can update their own data
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can update any data
  (SELECT auth.role()) = 'admin'
)
WITH CHECK (
  -- Same check for the new values
  user_id = (SELECT auth.uid())::text
  OR
  (SELECT auth.role()) = 'admin'
);

-- Policy for DELETE: Users can delete their own wearables data
CREATE POLICY wearables_data_delete_policy
ON public.wearables_data
FOR DELETE
TO authenticated
USING (
  -- Regular users can delete their own data
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can delete any data
  (SELECT auth.role()) = 'admin'
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify RLS is enabled and policies are created:
-- 
-- -- Check RLS is enabled
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'wearables_data';
--
-- -- Check policies
-- SELECT 
--     policyname,
--     cmd as action,
--     roles,
--     permissive
-- FROM pg_policies
-- WHERE tablename = 'wearables_data'
-- ORDER BY cmd, policyname;
--
-- Expected result: 
-- - rowsecurity = true
-- - Four policies: SELECT, INSERT, UPDATE, DELETE for 'authenticated' role

-- ============================================================================
-- NOTES
-- ============================================================================
-- Security model:
-- - Users can only access their own wearables data (based on user_id matching auth.uid())
-- - Admins have full access to all data
-- - Auth functions wrapped in subqueries to prevent per-row re-evaluation (performance optimization)
--
-- The user_id column is VARCHAR(255), so we cast auth.uid() (UUID) to text for comparison.
-- This matches the pattern used in other migrations (e.g., analytics_events).


-- Migration: Enable Row Level Security on remaining public tables
-- Created: 2024-12-19
--
-- Issue: Multiple tables are public but RLS has not been enabled:
--   - public.supplement_protocols
--   - public.training_analytics
--   - public.user_behavior
--
-- Solution: Enable RLS and create policies to ensure users can only access their own data.

-- ============================================================================
-- STEP 1: Enable Row Level Security
-- ============================================================================

ALTER TABLE public.supplement_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create RLS Policies for supplement_protocols
-- ============================================================================
-- Note: supplement_protocols.user_id is UUID, so we can use auth.uid() directly

-- Policy for SELECT: Users can view their own supplement protocols
CREATE POLICY supplement_protocols_select_policy
ON public.supplement_protocols
FOR SELECT
TO authenticated
USING (
  -- Regular users can view their own protocols
  user_id = (SELECT auth.uid())
  OR
  -- Admins can view all protocols
  (SELECT auth.role()) = 'admin'
);

-- Policy for INSERT: Users can insert their own supplement protocols
CREATE POLICY supplement_protocols_insert_policy
ON public.supplement_protocols
FOR INSERT
TO authenticated
WITH CHECK (
  -- Regular users can insert their own protocols
  user_id = (SELECT auth.uid())
  OR
  -- Admins can insert any protocols
  (SELECT auth.role()) = 'admin'
);

-- Policy for UPDATE: Users can update their own supplement protocols
CREATE POLICY supplement_protocols_update_policy
ON public.supplement_protocols
FOR UPDATE
TO authenticated
USING (
  -- Regular users can update their own protocols
  user_id = (SELECT auth.uid())
  OR
  -- Admins can update any protocols
  (SELECT auth.role()) = 'admin'
)
WITH CHECK (
  -- Same check for the new values
  user_id = (SELECT auth.uid())
  OR
  (SELECT auth.role()) = 'admin'
);

-- Policy for DELETE: Users can delete their own supplement protocols
CREATE POLICY supplement_protocols_delete_policy
ON public.supplement_protocols
FOR DELETE
TO authenticated
USING (
  -- Regular users can delete their own protocols
  user_id = (SELECT auth.uid())
  OR
  -- Admins can delete any protocols
  (SELECT auth.role()) = 'admin'
);

-- ============================================================================
-- STEP 3: Create RLS Policies for training_analytics
-- ============================================================================
-- Note: training_analytics.user_id is VARCHAR(255), so we cast auth.uid() to text

-- Policy for SELECT: Users can view their own training analytics
CREATE POLICY training_analytics_select_policy
ON public.training_analytics
FOR SELECT
TO authenticated
USING (
  -- Regular users can view their own analytics
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can view all analytics
  (SELECT auth.role()) = 'admin'
);

-- Policy for INSERT: Users can insert their own training analytics
CREATE POLICY training_analytics_insert_policy
ON public.training_analytics
FOR INSERT
TO authenticated
WITH CHECK (
  -- Regular users can insert their own analytics
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can insert any analytics
  (SELECT auth.role()) = 'admin'
);

-- Policy for UPDATE: Users can update their own training analytics
CREATE POLICY training_analytics_update_policy
ON public.training_analytics
FOR UPDATE
TO authenticated
USING (
  -- Regular users can update their own analytics
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can update any analytics
  (SELECT auth.role()) = 'admin'
)
WITH CHECK (
  -- Same check for the new values
  user_id = (SELECT auth.uid())::text
  OR
  (SELECT auth.role()) = 'admin'
);

-- Policy for DELETE: Users can delete their own training analytics
CREATE POLICY training_analytics_delete_policy
ON public.training_analytics
FOR DELETE
TO authenticated
USING (
  -- Regular users can delete their own analytics
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can delete any analytics
  (SELECT auth.role()) = 'admin'
);

-- ============================================================================
-- STEP 4: Create RLS Policies for user_behavior
-- ============================================================================
-- Note: user_behavior.user_id is VARCHAR(255), so we cast auth.uid() to text

-- Policy for SELECT: Users can view their own behavior data
CREATE POLICY user_behavior_select_policy
ON public.user_behavior
FOR SELECT
TO authenticated
USING (
  -- Regular users can view their own behavior data
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can view all behavior data
  (SELECT auth.role()) = 'admin'
);

-- Policy for INSERT: Users can insert their own behavior data
CREATE POLICY user_behavior_insert_policy
ON public.user_behavior
FOR INSERT
TO authenticated
WITH CHECK (
  -- Regular users can insert their own behavior data
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can insert any behavior data
  (SELECT auth.role()) = 'admin'
);

-- Policy for UPDATE: Users can update their own behavior data
CREATE POLICY user_behavior_update_policy
ON public.user_behavior
FOR UPDATE
TO authenticated
USING (
  -- Regular users can update their own behavior data
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can update any behavior data
  (SELECT auth.role()) = 'admin'
)
WITH CHECK (
  -- Same check for the new values
  user_id = (SELECT auth.uid())::text
  OR
  (SELECT auth.role()) = 'admin'
);

-- Policy for DELETE: Users can delete their own behavior data
CREATE POLICY user_behavior_delete_policy
ON public.user_behavior
FOR DELETE
TO authenticated
USING (
  -- Regular users can delete their own behavior data
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can delete any behavior data
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
-- WHERE schemaname = 'public' 
--   AND tablename IN ('supplement_protocols', 'training_analytics', 'user_behavior')
-- ORDER BY tablename;
--
-- -- Check policies
-- SELECT 
--     tablename,
--     policyname,
--     cmd as action,
--     roles,
--     permissive
-- FROM pg_policies
-- WHERE tablename IN ('supplement_protocols', 'training_analytics', 'user_behavior')
-- ORDER BY tablename, cmd, policyname;
--
-- Expected result: 
-- - rowsecurity = true for all three tables
-- - Four policies per table: SELECT, INSERT, UPDATE, DELETE for 'authenticated' role

-- ============================================================================
-- NOTES
-- ============================================================================
-- Security model:
-- - Users can only access their own data (based on user_id matching auth.uid())
-- - Admins have full access to all data
-- - Auth functions wrapped in subqueries to prevent per-row re-evaluation (performance optimization)
--
-- Data type handling:
-- - supplement_protocols.user_id is UUID, so we use auth.uid() directly
-- - training_analytics.user_id and user_behavior.user_id are VARCHAR(255), 
--   so we cast auth.uid() to text for comparison


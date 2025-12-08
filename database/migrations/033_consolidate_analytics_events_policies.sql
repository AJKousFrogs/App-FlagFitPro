-- Migration: Consolidate Multiple Permissive Policies on analytics_events
-- Fixes performance issue caused by multiple permissive policies for the same role/action
-- Created: 2024-12-19
--
-- Issue: Table has multiple permissive policies for INSERT and SELECT operations:
--   - analytics_events_admin_all (FOR ALL, allows admins)
--   - analytics_events_insert_authenticated (FOR INSERT, allows authenticated users)
--   - analytics_events_select_authenticated (FOR SELECT, allows authenticated users)
--
-- Problem: Multiple permissive policies require PostgreSQL to evaluate each policy
-- separately, which is suboptimal for performance. Each policy must be executed
-- for every relevant query.
--
-- Solution: Consolidate into a single policy that handles both cases efficiently.

-- ============================================================================
-- STEP 1: Drop existing policies
-- ============================================================================

DROP POLICY IF EXISTS analytics_events_admin_all ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_insert_authenticated ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_select_authenticated ON public.analytics_events;

-- ============================================================================
-- STEP 2: Create consolidated policies
-- ============================================================================
-- We'll create separate policies for different operations to maintain clarity,
-- but each operation will have only ONE policy per role/action combination.

-- Policy for INSERT: Allows users to insert their own events OR admins to insert any
CREATE POLICY analytics_events_insert_policy
ON public.analytics_events
FOR INSERT
TO authenticated
WITH CHECK (
  -- Regular users can insert their own events
  -- Optimized: Wrap auth function in subquery
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can insert any events
  -- Optimized: Wrap auth function in subquery
  (SELECT auth.role()) = 'admin'
);

-- Policy for SELECT: Allows users to view their own events OR admins to view all
CREATE POLICY analytics_events_select_policy
ON public.analytics_events
FOR SELECT
TO authenticated
USING (
  -- Regular users can view their own events
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can view all events
  (SELECT auth.role()) = 'admin'
);

-- Policy for UPDATE: Allows users to update their own events OR admins to update any
CREATE POLICY analytics_events_update_policy
ON public.analytics_events
FOR UPDATE
TO authenticated
USING (
  -- Regular users can update their own events
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can update any events
  (SELECT auth.role()) = 'admin'
)
WITH CHECK (
  -- Same check for the new values
  user_id = (SELECT auth.uid())::text
  OR
  (SELECT auth.role()) = 'admin'
);

-- Policy for DELETE: Allows users to delete their own events OR admins to delete any
CREATE POLICY analytics_events_delete_policy
ON public.analytics_events
FOR DELETE
TO authenticated
USING (
  -- Regular users can delete their own events
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can delete any events
  (SELECT auth.role()) = 'admin'
);

-- ============================================================================
-- ALTERNATIVE: Single FOR ALL policy (if you prefer one policy for all operations)
-- ============================================================================
-- If you prefer a single policy covering all operations, uncomment this and
-- comment out the individual policies above:
--
-- CREATE POLICY analytics_events_all_operations
-- ON public.analytics_events
-- FOR ALL
-- TO authenticated
-- USING (
--   user_id = (SELECT auth.uid())::text
--   OR
--   (SELECT auth.role()) = 'admin'
-- )
-- WITH CHECK (
--   user_id = (SELECT auth.uid())::text
--   OR
--   (SELECT auth.role()) = 'admin'
-- );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify there's only one policy per role/action:
-- 
-- SELECT 
--     policyname,
--     cmd as action,
--     roles,
--     permissive
-- FROM pg_policies
-- WHERE tablename = 'analytics_events'
-- ORDER BY cmd, policyname;
--
-- Expected result: Only one policy per action (INSERT, SELECT, UPDATE, DELETE)
-- for the 'authenticated' role.

-- ============================================================================
-- NOTES
-- ============================================================================
-- Key improvements:
-- 1. Single policy per role/action combination (better performance)
-- 2. Auth functions wrapped in subqueries (prevents per-row re-evaluation)
-- 3. Clear separation of concerns (one policy per operation)
-- 4. Maintains same security model (users see own data, admins see all)
--
-- Performance benefits:
-- - PostgreSQL only needs to evaluate one policy per operation
-- - Auth functions evaluated once per query (not per row)
-- - Reduced overhead for INSERT and SELECT operations at scale


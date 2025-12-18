-- ============================================================================
-- RLS Performance Fix Helper Script
-- Use this script to inspect and fix RLS policies with performance issues
-- ============================================================================
--
-- UPGRADES:
-- - Enhanced with more examples and best practices
-- - Added comprehensive verification queries
-- - Added helper function examples
-- ============================================================================

-- ============================================================================
-- STEP 1: Inspect the existing policy
-- ============================================================================
-- Run this query first to see the current policy definition

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'analytics_events'
AND policyname = 'analytics_events_admin_all';

-- ============================================================================
-- STEP 2: Check for problematic patterns
-- ============================================================================
-- This query will show if the policy contains unoptimized auth function calls

SELECT 
    policyname,
    qual,
    CASE 
        WHEN qual LIKE '%auth.%()%' AND qual NOT LIKE '%(SELECT auth.%()%' THEN 'NEEDS FIX: auth function not wrapped in subquery'
        WHEN qual LIKE '%current_setting(%' AND qual NOT LIKE '%(SELECT current_setting(%' THEN 'NEEDS FIX: current_setting not wrapped in subquery'
        ELSE 'OK'
    END as status
FROM pg_policies
WHERE tablename = 'analytics_events'
AND policyname = 'analytics_events_admin_all';

-- ============================================================================
-- STEP 3: Fix the policy
-- ============================================================================
-- After inspecting the policy above, modify the USING clause below to match
-- your actual policy logic, but wrap all auth functions in (SELECT ...)

-- First, drop the existing policy
DROP POLICY IF EXISTS analytics_events_admin_all ON public.analytics_events;

-- Then recreate with optimized version
-- IMPORTANT: Replace the USING clause below with your actual policy logic,
-- but wrap auth functions like this:
--   OLD: auth.uid() = user_id
--   NEW: (SELECT auth.uid()) = user_id
--
--   OLD: auth.role() = 'admin'
--   NEW: (SELECT auth.role()) = 'admin'
--
--   OLD: current_setting('request.jwt.claims', true)::jsonb->>'role'
--   NEW: (SELECT current_setting('request.jwt.claims', true)::jsonb->>'role')

-- Example 1: If your policy checks for admin role via auth.role()
CREATE POLICY analytics_events_admin_all
ON public.analytics_events
FOR ALL
USING ((SELECT auth.role()) = 'admin');

-- Example 2: If your policy checks for admin via JWT claims
-- CREATE POLICY analytics_events_admin_all
-- ON public.analytics_events
-- FOR ALL
-- USING (
--   (SELECT current_setting('request.jwt.claims', true)::jsonb->>'role') = 'admin'
-- );

-- Example 3: If your policy checks admin status via users table
-- CREATE POLICY analytics_events_admin_all
-- ON public.analytics_events
-- FOR ALL
-- USING (
--   EXISTS (
--     SELECT 1 FROM users
--     WHERE id = (SELECT auth.uid())
--     AND role = 'admin'
--   )
-- );

-- ============================================================================
-- STEP 4: Verify the fix
-- ============================================================================
-- Run this to verify the policy was recreated correctly

SELECT 
    schemaname,
    tablename,
    policyname,
    qual,
    CASE 
        WHEN qual LIKE '%(SELECT auth.%()%' THEN 'OPTIMIZED: auth function wrapped in subquery'
        WHEN qual LIKE '%(SELECT current_setting(%' THEN 'OPTIMIZED: current_setting wrapped in subquery'
        WHEN qual LIKE '%auth.%()%' THEN 'WARNING: Still contains unoptimized auth function'
        ELSE 'CHECK MANUALLY'
    END as optimization_status
FROM pg_policies
WHERE tablename = 'analytics_events'
AND policyname = 'analytics_events_admin_all';

-- ============================================================================
-- STEP 5: Comprehensive Policy Audit (Optional)
-- ============================================================================
-- Run this to check all policies in your database for optimization issues

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual LIKE '%(SELECT auth.%()%' OR qual LIKE '%(SELECT current_setting(%' THEN 'OPTIMIZED ✓'
        WHEN qual LIKE '%auth.%()%' OR qual LIKE '%current_setting(%' THEN 'NEEDS OPTIMIZATION ⚠'
        ELSE 'N/A'
    END as optimization_status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY 
    CASE 
        WHEN qual LIKE '%auth.%()%' OR qual LIKE '%current_setting(%' THEN 0
        ELSE 1
    END,
    tablename,
    policyname;

-- ============================================================================
-- STEP 6: Helper Function Pattern (Best Practice)
-- ============================================================================
-- Instead of wrapping auth.uid() in every policy, you can create helper functions
-- This is even more performant and maintainable

-- Example helper function (already exists in supabase-rls-policies.sql):
-- CREATE OR REPLACE FUNCTION auth.user_id()
-- RETURNS UUID AS $$
--   SELECT COALESCE(
--     auth.uid(),
--     (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid
--   );
-- $$ LANGUAGE SQL STABLE;

-- Then use it in policies:
-- CREATE POLICY example_policy
-- ON example_table FOR SELECT
-- USING (user_id = auth.user_id());
--
-- Note: Helper functions are automatically optimized by PostgreSQL


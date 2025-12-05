-- Migration: Fix analytics_events_admin_all RLS Policy Performance
-- Fixes suboptimal query performance by wrapping auth functions in subqueries
-- This prevents re-evaluation of auth functions for each row
-- Created: 2024-12-19
--
-- Issue: The analytics_events_admin_all policy re-evaluates auth functions
-- for each row, causing performance issues at scale.
-- Solution: Wrap auth function calls in (select auth.<function>()) to
-- ensure they're evaluated once per query instead of once per row.

-- ============================================================================
-- STEP 1: Drop the existing policy
-- ============================================================================

DROP POLICY IF EXISTS analytics_events_admin_all ON public.analytics_events;

-- ============================================================================
-- STEP 2: Recreate the policy with optimized auth function calls
-- ============================================================================
-- IMPORTANT: Before running this migration, inspect your existing policy
-- using the helper script: database/fix-rls-performance-helper.sql
--
-- The most common admin check patterns are shown below. Uncomment and
-- modify the one that matches your actual policy logic.
--
-- Key optimization: Wrap all auth functions in (SELECT ...) to ensure
-- they're evaluated once per query instead of once per row.

-- Pattern 1: Admin role check via auth.role() (most common in Supabase)
CREATE POLICY analytics_events_admin_all
ON public.analytics_events
FOR ALL
USING ((SELECT auth.role()) = 'admin');

-- ============================================================================
-- ALTERNATIVE PATTERNS: If Pattern 1 above doesn't match your policy,
-- comment it out and uncomment one of these alternatives:
-- ============================================================================

-- Pattern 2: Admin check via JWT claims (if using custom JWT claims)
-- DROP POLICY IF EXISTS analytics_events_admin_all ON public.analytics_events;
-- CREATE POLICY analytics_events_admin_all
-- ON public.analytics_events
-- FOR ALL
-- USING (
--   (SELECT current_setting('request.jwt.claims', true)::jsonb->>'role') = 'admin'
-- );

-- Pattern 3: Admin check via users table (if checking users.role column)
-- DROP POLICY IF EXISTS analytics_events_admin_all ON public.analytics_events;
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

-- Pattern 4: Service role bypass (if using service role key)
-- DROP POLICY IF EXISTS analytics_events_admin_all ON public.analytics_events;
-- CREATE POLICY analytics_events_admin_all
-- ON public.analytics_events
-- FOR ALL
-- USING (
--   (SELECT current_setting('request.jwt.claims', true)::jsonb->>'role') = 'service_role'
-- );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify the policy was created correctly:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'analytics_events'
-- AND policyname = 'analytics_events_admin_all';

-- ============================================================================
-- NOTES
-- ============================================================================
-- Key optimization: Wrapping auth functions in (SELECT ...) ensures they
-- are evaluated once per query execution rather than once per row.
--
-- Before: auth.role() evaluated for each row
-- After: (SELECT auth.role()) evaluated once per query
--
-- This significantly improves performance when querying large tables.


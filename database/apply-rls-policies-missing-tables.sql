-- ============================================================================
-- Apply RLS Policies for missing tables
-- Run this script in your Neon DB / Supabase SQL Editor to fix linter errors
-- ============================================================================
--
-- This script addresses the following linter errors:
--   - public.notifications (RLS disabled)
--   - public.performance_metrics (RLS disabled)
--   - public.supplement_protocols (RLS disabled)
--   - public.training_analytics (RLS disabled)
--   - public.user_behavior (RLS disabled)
--   - public.wearables_data (RLS disabled)
--
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop existing policies if they exist (to avoid conflicts)
-- ============================================================================

-- Drop policies for notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS notifications_select_policy ON public.notifications;
DROP POLICY IF EXISTS notifications_insert_policy ON public.notifications;
DROP POLICY IF EXISTS notifications_update_policy ON public.notifications;
DROP POLICY IF EXISTS notifications_delete_policy ON public.notifications;

-- Drop policies for performance_metrics
DROP POLICY IF EXISTS "Users can view own performance metrics" ON public.performance_metrics;
DROP POLICY IF EXISTS "Coaches can view team performance metrics" ON public.performance_metrics;
DROP POLICY IF EXISTS "Users can create own performance metrics" ON public.performance_metrics;
DROP POLICY IF EXISTS "Users can update own performance metrics" ON public.performance_metrics;
DROP POLICY IF EXISTS performance_metrics_select_policy ON public.performance_metrics;
DROP POLICY IF EXISTS performance_metrics_insert_policy ON public.performance_metrics;
DROP POLICY IF EXISTS performance_metrics_update_policy ON public.performance_metrics;
DROP POLICY IF EXISTS performance_metrics_delete_policy ON public.performance_metrics;

-- Drop policies for supplement_protocols
DROP POLICY IF EXISTS "Users can view own supplement protocols" ON public.supplement_protocols;
DROP POLICY IF EXISTS "Users can create own supplement protocols" ON public.supplement_protocols;
DROP POLICY IF EXISTS "Users can update own supplement protocols" ON public.supplement_protocols;
DROP POLICY IF EXISTS "Users can delete own supplement protocols" ON public.supplement_protocols;
DROP POLICY IF EXISTS supplement_protocols_select_policy ON public.supplement_protocols;
DROP POLICY IF EXISTS supplement_protocols_insert_policy ON public.supplement_protocols;
DROP POLICY IF EXISTS supplement_protocols_update_policy ON public.supplement_protocols;
DROP POLICY IF EXISTS supplement_protocols_delete_policy ON public.supplement_protocols;

-- Drop policies for training_analytics
DROP POLICY IF EXISTS "Users can view own training analytics" ON public.training_analytics;
DROP POLICY IF EXISTS "Users can create own training analytics" ON public.training_analytics;
DROP POLICY IF EXISTS "Users can update own training analytics" ON public.training_analytics;
DROP POLICY IF EXISTS "Users can delete own training analytics" ON public.training_analytics;
DROP POLICY IF EXISTS training_analytics_select_policy ON public.training_analytics;
DROP POLICY IF EXISTS training_analytics_insert_policy ON public.training_analytics;
DROP POLICY IF EXISTS training_analytics_update_policy ON public.training_analytics;
DROP POLICY IF EXISTS training_analytics_delete_policy ON public.training_analytics;

-- Drop policies for user_behavior
DROP POLICY IF EXISTS "Users can view own behavior data" ON public.user_behavior;
DROP POLICY IF EXISTS "Users can create own behavior data" ON public.user_behavior;
DROP POLICY IF EXISTS "Users can update own behavior data" ON public.user_behavior;
DROP POLICY IF EXISTS "Users can delete own behavior data" ON public.user_behavior;
DROP POLICY IF EXISTS user_behavior_select_policy ON public.user_behavior;
DROP POLICY IF EXISTS user_behavior_insert_policy ON public.user_behavior;
DROP POLICY IF EXISTS user_behavior_update_policy ON public.user_behavior;
DROP POLICY IF EXISTS user_behavior_delete_policy ON public.user_behavior;

-- Drop policies for wearables_data
DROP POLICY IF EXISTS "Users can view own wearables data" ON public.wearables_data;
DROP POLICY IF EXISTS "Users can create own wearables data" ON public.wearables_data;
DROP POLICY IF EXISTS "Users can update own wearables data" ON public.wearables_data;
DROP POLICY IF EXISTS "Users can delete own wearables data" ON public.wearables_data;
DROP POLICY IF EXISTS wearables_data_select_policy ON public.wearables_data;
DROP POLICY IF EXISTS wearables_data_insert_policy ON public.wearables_data;
DROP POLICY IF EXISTS wearables_data_update_policy ON public.wearables_data;
DROP POLICY IF EXISTS wearables_data_delete_policy ON public.wearables_data;

-- ============================================================================
-- STEP 2: Enable Row Level Security on all tables
-- ============================================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplement_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wearables_data ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Create RLS Policies for notifications table
-- ============================================================================
-- Note: notifications.user_id is VARCHAR(255), so we cast auth.uid() to text

CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can insert own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid())::text)
WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid())::text);

-- ============================================================================
-- STEP 4: Create RLS Policies for performance_metrics table
-- ============================================================================
-- Note: performance_metrics.user_id is VARCHAR(255), so we cast auth.uid() to text

CREATE POLICY "Users can view own performance metrics"
ON public.performance_metrics
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can insert own performance metrics"
ON public.performance_metrics
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can update own performance metrics"
ON public.performance_metrics
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid())::text)
WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can delete own performance metrics"
ON public.performance_metrics
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid())::text);

-- ============================================================================
-- STEP 5: Create RLS Policies for supplement_protocols table
-- ============================================================================
-- Note: supplement_protocols.user_id is UUID, so we can use auth.uid() directly

CREATE POLICY "Users can view own supplement protocols"
ON public.supplement_protocols
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own supplement protocols"
ON public.supplement_protocols
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own supplement protocols"
ON public.supplement_protocols
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own supplement protocols"
ON public.supplement_protocols
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- STEP 6: Create RLS Policies for training_analytics table
-- ============================================================================
-- Note: training_analytics.user_id is VARCHAR(255), so we cast auth.uid() to text

CREATE POLICY "Users can view own training analytics"
ON public.training_analytics
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can insert own training analytics"
ON public.training_analytics
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can update own training analytics"
ON public.training_analytics
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid())::text)
WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can delete own training analytics"
ON public.training_analytics
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid())::text);

-- ============================================================================
-- STEP 7: Create RLS Policies for user_behavior table
-- ============================================================================
-- Note: user_behavior.user_id is VARCHAR(255), so we cast auth.uid() to text

CREATE POLICY "Users can view own behavior data"
ON public.user_behavior
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can insert own behavior data"
ON public.user_behavior
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can update own behavior data"
ON public.user_behavior
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid())::text)
WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can delete own behavior data"
ON public.user_behavior
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid())::text);

-- ============================================================================
-- STEP 8: Create RLS Policies for wearables_data table
-- ============================================================================
-- Note: wearables_data.user_id is VARCHAR(255), so we cast auth.uid() to text

CREATE POLICY "Users can view own wearables data"
ON public.wearables_data
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can insert own wearables data"
ON public.wearables_data
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can update own wearables data"
ON public.wearables_data
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid())::text)
WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can delete own wearables data"
ON public.wearables_data
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid())::text);

-- ============================================================================
-- STEP 9: Verify policies were created
-- ============================================================================
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN (
    'notifications',
    'performance_metrics',
    'supplement_protocols',
    'training_analytics',
    'user_behavior',
    'wearables_data'
  )
ORDER BY tablename, policyname;

-- ============================================================================
-- VERIFICATION: Check RLS is enabled
-- ============================================================================
SELECT 
    tablename, 
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN (
    'notifications',
    'performance_metrics',
    'supplement_protocols',
    'training_analytics',
    'user_behavior',
    'wearables_data'
  )
ORDER BY tablename;


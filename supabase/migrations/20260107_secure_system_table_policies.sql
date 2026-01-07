-- Migration: Secure System Table RLS Policies
-- Date: 2026-01-07
-- Purpose: Replace permissive WITH CHECK (true) policies on system/audit tables
--          with proper service role or authenticated user checks

-- ============================================================================
-- AI COACH VISIBILITY TABLE
-- ============================================================================

-- Drop permissive policy
DROP POLICY IF EXISTS "System can create coach visibility records" ON public.ai_coach_visibility;

-- Create secure policy: Only authenticated users can insert (coaches creating visibility records)
CREATE POLICY "Authenticated users can create coach visibility records"
ON public.ai_coach_visibility
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Coaches can view their own visibility records
DROP POLICY IF EXISTS "Coaches can view coach visibility records" ON public.ai_coach_visibility;
CREATE POLICY "Coaches can view coach visibility records"
ON public.ai_coach_visibility
FOR SELECT
USING (coach_id = auth.uid());

-- Athletes can view visibility records about them
DROP POLICY IF EXISTS "Athletes can view own visibility records" ON public.ai_coach_visibility;
CREATE POLICY "Athletes can view own visibility records"
ON public.ai_coach_visibility
FOR SELECT
USING (player_id = auth.uid());

-- ============================================================================
-- COACH ACTIVITY LOG TABLE
-- ============================================================================

-- Drop permissive policy
DROP POLICY IF EXISTS "System can insert activity" ON public.coach_activity_log;

-- Create secure policy: Only authenticated users (system functions) can insert
CREATE POLICY "Authenticated users can insert activity logs"
ON public.coach_activity_log
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Coaches can view their own activity logs
DROP POLICY IF EXISTS "Coaches can view activity logs" ON public.coach_activity_log;
CREATE POLICY "Coaches can view activity logs"
ON public.coach_activity_log
FOR SELECT
USING (coach_id = auth.uid());

-- ============================================================================
-- CONSENT CHANGE LOG TABLE
-- ============================================================================

-- Drop permissive policy
DROP POLICY IF EXISTS "Append-only consent change log" ON public.consent_change_log;

-- Create secure policy: Only authenticated users can insert (system functions)
CREATE POLICY "Authenticated users can log consent changes"
ON public.consent_change_log
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Users can view their own consent change logs
DROP POLICY IF EXISTS "Users can view own consent change logs" ON public.consent_change_log;
CREATE POLICY "Users can view own consent change logs"
ON public.consent_change_log
FOR SELECT
USING (athlete_id = auth.uid() OR changed_by = auth.uid());

-- ============================================================================
-- DEPTH CHART HISTORY TABLE
-- ============================================================================

-- Drop permissive policy
DROP POLICY IF EXISTS "System can insert history" ON public.depth_chart_history;

-- Create secure policy: Only authenticated users can insert
CREATE POLICY "Authenticated users can insert depth chart history"
ON public.depth_chart_history
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Team members can view depth chart history for their teams
-- Note: depth_chart_history doesn't have team_id, so we check via template_id or player_id
DROP POLICY IF EXISTS "Team members can view depth chart history" ON public.depth_chart_history;
CREATE POLICY "Team members can view depth chart history"
ON public.depth_chart_history
FOR SELECT
USING (
    player_id = auth.uid()
    OR changed_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.team_members tm
        JOIN public.depth_chart_templates dct ON tm.team_id = (SELECT team_id FROM public.depth_chart_templates WHERE id = depth_chart_history.template_id)
        WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
);

-- ============================================================================
-- MERLIN VIOLATION LOG TABLE
-- ============================================================================

-- Drop permissive policy
DROP POLICY IF EXISTS "Append-only merlin violations" ON public.merlin_violation_log;

-- Create secure policy: Only service role or authenticated users can insert
-- (Merlin guard functions use service role)
CREATE POLICY "Service role can log merlin violations"
ON public.merlin_violation_log
FOR INSERT
WITH CHECK (
    auth.role() = 'service_role'
    OR auth.role() = 'authenticated'
);

-- Service role can read violations (for monitoring)
DROP POLICY IF EXISTS "Service role reads merlin violations" ON public.merlin_violation_log;
CREATE POLICY "Service role reads merlin violations"
ON public.merlin_violation_log
FOR SELECT
USING (auth.role() = 'service_role');

-- Note: merlin_violation_log doesn't have athlete_id column
-- Service role can read all violations, authenticated users can read their own (if we add user tracking)
-- For now, only service role can read (violations are logged by system)
-- If we need user-specific access, we'd need to add a user_id column

-- ============================================================================
-- ROSTER AUDIT LOG TABLE
-- ============================================================================

-- Drop permissive policy
DROP POLICY IF EXISTS "System can insert audit log" ON public.roster_audit_log;

-- Create secure policy: Only authenticated users can insert
CREATE POLICY "Authenticated users can insert roster audit logs"
ON public.roster_audit_log
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Team admins can view roster audit logs for their teams
DROP POLICY IF EXISTS "Team admins can view roster audit logs" ON public.roster_audit_log;
CREATE POLICY "Team admins can view roster audit logs"
ON public.roster_audit_log
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_id = roster_audit_log.team_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'coach', 'head_coach')
        AND status = 'active'
    )
);

-- ============================================================================
-- SAFETY OVERRIDE LOG TABLE
-- ============================================================================

-- Drop permissive policy
DROP POLICY IF EXISTS "Append-only safety override log" ON public.safety_override_log;

-- Create secure policy: Only service role or authenticated users can insert
-- (Safety override functions use service role)
CREATE POLICY "Service role can log safety overrides"
ON public.safety_override_log
FOR INSERT
WITH CHECK (
    auth.role() = 'service_role'
    OR auth.role() = 'authenticated'
);

-- Service role can read overrides (already exists, but ensure it's correct)
-- Athletes can view their own override logs
DROP POLICY IF EXISTS "Athletes can view own safety overrides" ON public.safety_override_log;
CREATE POLICY "Athletes can view own safety overrides"
ON public.safety_override_log
FOR SELECT
USING (athlete_id = auth.uid());

-- Coaches can view safety overrides for their athletes (with consent)
DROP POLICY IF EXISTS "Coaches can view athlete safety overrides" ON public.safety_override_log;
CREATE POLICY "Coaches can view athlete safety overrides"
ON public.safety_override_log
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.coach_athlete_assignments
        WHERE coach_id = auth.uid()
        AND athlete_id = safety_override_log.athlete_id
    )
    OR EXISTS (
        SELECT 1 FROM public.team_members tm1
        JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
        WHERE tm1.user_id = auth.uid()
        AND tm1.role IN ('coach', 'head_coach', 'assistant_coach')
        AND tm2.user_id = safety_override_log.athlete_id
        AND tm1.status = 'active'
        AND tm2.status = 'active'
    )
);

-- ============================================================================
-- SYNC LOGS TABLE
-- ============================================================================

-- Drop permissive policy
DROP POLICY IF EXISTS "System can insert sync logs" ON public.sync_logs;

-- Create secure policy: Only authenticated users can insert
CREATE POLICY "Authenticated users can insert sync logs"
ON public.sync_logs
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Note: sync_logs doesn't have user_id column
-- Only admins and service role can view sync logs
-- If we need user-specific access, we'd need to add a user_id column

-- Admins can view all sync logs
DROP POLICY IF EXISTS "Admins can view all sync logs" ON public.sync_logs;
CREATE POLICY "Admins can view all sync logs"
ON public.sync_logs
FOR SELECT
USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
    OR auth.role() = 'service_role'
);


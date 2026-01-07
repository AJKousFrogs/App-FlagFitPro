-- Migration: Fix RLS Performance and Duplicate Indexes
-- Date: 2026-01-30
-- Purpose: Fix auth RLS initplan issues and remove duplicate indexes

-- ============================================================================
-- FIX RLS POLICIES - Use (select auth.uid()) for better performance
-- ============================================================================

-- Fix decision_ledger RLS policies
DROP POLICY IF EXISTS "Staff can view team decisions" ON decision_ledger;
CREATE POLICY "Staff can view team decisions"
ON decision_ledger FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = (select auth.uid())
        AND tm.team_id = decision_ledger.team_id
        AND tm.role IN (
            'owner', 'admin', 'head_coach', 'coach',
            'physiotherapist', 'nutritionist', 'psychologist',
            'strength_conditioning_coach'
        )
    )
);

DROP POLICY IF EXISTS "Staff can create decisions" ON decision_ledger;
CREATE POLICY "Staff can create decisions"
ON decision_ledger FOR INSERT
TO authenticated
WITH CHECK (
    made_by = (select auth.uid())
    AND EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = (select auth.uid())
        AND tm.team_id = decision_ledger.team_id
    )
);

-- Consolidate the two UPDATE policies into one
DROP POLICY IF EXISTS "Decision makers can update own decisions" ON decision_ledger;
DROP POLICY IF EXISTS "Reviewers can update decisions" ON decision_ledger;

CREATE POLICY "Staff can update decisions"
ON decision_ledger FOR UPDATE
TO authenticated
USING (
    -- Decision makers can update their own decisions before review
    (
        made_by = (select auth.uid())
        AND status = 'active'
        AND review_date > NOW()
    )
    OR
    -- Reviewers can update decisions during review
    (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.user_id = (select auth.uid())
            AND tm.team_id = decision_ledger.team_id
            AND tm.role IN ('owner', 'admin', 'head_coach', 'coach')
        )
        AND review_date <= NOW()
    )
);

-- Fix decision_review_reminders RLS policy
DROP POLICY IF EXISTS "Staff can view reminders" ON decision_review_reminders;
CREATE POLICY "Staff can view reminders"
ON decision_review_reminders FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM decision_ledger dl
        JOIN team_members tm ON tm.team_id = dl.team_id
        WHERE dl.id = decision_review_reminders.decision_id
        AND tm.user_id = (select auth.uid())
        AND tm.role IN (
            'owner', 'admin', 'head_coach', 'coach',
            'physiotherapist', 'nutritionist', 'psychologist',
            'strength_conditioning_coach'
        )
    )
);

-- ============================================================================
-- REMOVE DUPLICATE INDEXES
-- ============================================================================

-- Drop duplicate indexes from coach_athlete_assignments
-- Keep idx_coach_athlete_assignments_athlete, drop idx_coach_athlete_assignments_athlete_id
DROP INDEX IF EXISTS idx_coach_athlete_assignments_athlete_id;

-- Keep idx_coach_athlete_assignments_coach, drop idx_coach_athlete_assignments_coach_id
DROP INDEX IF EXISTS idx_coach_athlete_assignments_coach_id;

-- Drop duplicate index from session_version_history
-- Keep idx_session_version_history_session, drop idx_session_version_history_session_version
DROP INDEX IF EXISTS idx_session_version_history_session_version;

-- Drop duplicate index from team_activities
-- Keep idx_team_activities_created_by, drop idx_team_activities_created_by_coach_id
DROP INDEX IF EXISTS idx_team_activities_created_by_coach_id;

-- Drop duplicate indexes from team_activity_attendance
-- Keep idx_attendance_activity, drop idx_team_activity_attendance_activity_id
DROP INDEX IF EXISTS idx_team_activity_attendance_activity_id;

-- Keep idx_attendance_athlete, drop idx_team_activity_attendance_athlete_id
DROP INDEX IF EXISTS idx_team_activity_attendance_athlete_id;

-- Add comments
COMMENT ON POLICY "Staff can view team decisions" ON decision_ledger IS 'RLS policy optimized with (select auth.uid()) for better performance';
COMMENT ON POLICY "Staff can create decisions" ON decision_ledger IS 'RLS policy optimized with (select auth.uid()) for better performance';
COMMENT ON POLICY "Staff can update decisions" ON decision_ledger IS 'Consolidated UPDATE policy combining decision maker and reviewer permissions. Optimized with (select auth.uid()) for better performance';
COMMENT ON POLICY "Staff can view reminders" ON decision_review_reminders IS 'RLS policy optimized with (select auth.uid()) for better performance';


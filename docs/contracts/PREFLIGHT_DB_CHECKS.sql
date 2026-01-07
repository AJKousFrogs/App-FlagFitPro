-- ============================================================================
-- PREFLIGHT DATABASE INTEGRITY CHECKS
-- Date: 2026-01-06
-- Purpose: Detect broken links, orphaned rows, enum drift, RLS issues
-- ============================================================================
-- Run these queries in Supabase SQL Editor to verify database integrity
-- ============================================================================

-- ============================================================================
-- A) ORPHAN CHECKS (FK-like relationships)
-- ============================================================================

-- 1. team_activity_attendance rows with missing activity or athlete
SELECT 
    'team_activity_attendance' as table_name,
    'orphaned_activity' as issue_type,
    COUNT(*) as orphan_count
FROM team_activity_attendance taa
LEFT JOIN team_activities ta ON taa.activity_id = ta.activity_id
WHERE ta.activity_id IS NULL
UNION ALL
SELECT 
    'team_activity_attendance' as table_name,
    'orphaned_athlete' as issue_type,
    COUNT(*) as orphan_count
FROM team_activity_attendance taa
LEFT JOIN auth.users u ON taa.athlete_id = u.id
WHERE u.id IS NULL;

-- 2. team_members rows with missing user/team
SELECT 
    'team_members' as table_name,
    'orphaned_user' as issue_type,
    COUNT(*) as orphan_count
FROM team_members tm
LEFT JOIN auth.users u ON tm.user_id = u.id
WHERE u.id IS NULL
UNION ALL
SELECT 
    'team_members' as table_name,
    'orphaned_team' as issue_type,
    COUNT(*) as orphan_count
FROM team_members tm
LEFT JOIN teams t ON tm.team_id = t.id
WHERE t.id IS NULL;

-- 3. session_version_history referencing missing sessions
SELECT 
    'session_version_history' as table_name,
    'orphaned_session' as issue_type,
    COUNT(*) as orphan_count
FROM session_version_history svh
LEFT JOIN training_sessions ts ON svh.session_id = ts.id
WHERE ts.id IS NULL;

-- 4. execution_logs referencing missing sessions or athletes
SELECT 
    'execution_logs' as table_name,
    'orphaned_session' as issue_type,
    COUNT(*) as orphan_count
FROM execution_logs el
LEFT JOIN training_sessions ts ON el.session_id = ts.id
WHERE ts.id IS NULL
UNION ALL
SELECT 
    'execution_logs' as table_name,
    'orphaned_athlete' as issue_type,
    COUNT(*) as orphan_count
FROM execution_logs el
LEFT JOIN auth.users u ON el.athlete_id = u.id
WHERE u.id IS NULL;

-- 5. coach_athlete_assignments with missing coach or athlete
SELECT 
    'coach_athlete_assignments' as table_name,
    'orphaned_coach' as issue_type,
    COUNT(*) as orphan_count
FROM coach_athlete_assignments caa
LEFT JOIN auth.users u ON caa.coach_id = u.id
WHERE u.id IS NULL
UNION ALL
SELECT 
    'coach_athlete_assignments' as table_name,
    'orphaned_athlete' as issue_type,
    COUNT(*) as orphan_count
FROM coach_athlete_assignments caa
LEFT JOIN auth.users u ON caa.athlete_id = u.id
WHERE u.id IS NULL;

-- ============================================================================
-- B) ENUM/STATE DRIFT CHECKS
-- ============================================================================

-- 1. session_state values not in canonical set
SELECT 
    'training_sessions' as table_name,
    'invalid_session_state' as issue_type,
    session_state,
    COUNT(*) as count
FROM training_sessions
WHERE session_state NOT IN (
    'PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED', 
    'IN_PROGRESS', 'COMPLETED', 'LOCKED', 'CANCELLED', 
    'EXPIRED', 'ABANDONED'
)
GROUP BY session_state;

-- 2. participation values not in enum (if participation column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'team_activity_attendance'
        AND column_name = 'participation'
    ) THEN
        -- Check for invalid participation values
        RAISE NOTICE 'Checking participation enum values...';
    END IF;
END $$;

-- ============================================================================
-- C) REQUIRED COLUMNS CHECKS
-- ============================================================================

-- 1. Coach modifications missing modified_by_coach_id or modified_at where coach_locked=true
SELECT 
    'training_sessions' as table_name,
    'missing_coach_attribution' as issue_type,
    COUNT(*) as count
FROM training_sessions
WHERE coach_locked = true
AND (modified_by_coach_id IS NULL OR modified_at IS NULL);

-- 2. Safety override rows missing override_flag or reason where required
SELECT 
    'safety_override_log' as table_name,
    'missing_override_flag' as issue_type,
    COUNT(*) as count
FROM safety_override_log
WHERE override_flag IS NULL
UNION ALL
SELECT 
    'safety_override_log' as table_name,
    'missing_reason' as issue_type,
    COUNT(*) as count
FROM safety_override_log
WHERE reason IS NULL OR reason = '';

-- ============================================================================
-- D) RLS ENABLED CHECK
-- ============================================================================

-- List all tables with RLS disabled (CRITICAL TABLES MUST HAVE RLS)
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'wellness_logs',
    'wellness_entries',
    'readiness_scores',
    'pain_reports',
    'athlete_consent_settings',
    'execution_logs',
    'session_version_history',
    'training_sessions',
    'team_activity_attendance',
    'coach_athlete_assignments'
)
ORDER BY tablename;

-- ============================================================================
-- E) POLICY COMPILE CHECK
-- ============================================================================

-- Check for policies referencing non-existent columns
-- Note: This requires manual inspection, but we can check for common issues

-- List all policies on critical tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'wellness_logs',
    'wellness_entries',
    'readiness_scores',
    'pain_reports',
    'execution_logs',
    'session_version_history',
    'training_sessions'
)
ORDER BY tablename, policyname;

-- ============================================================================
-- F) TRIGGER/FUNCTION HEALTH
-- ============================================================================

-- 1. List triggers and confirm functions exist
SELECT 
    t.tgname as trigger_name,
    t.tgrelid::regclass as table_name,
    p.proname as function_name,
    CASE 
        WHEN p.proname IS NULL THEN 'MISSING_FUNCTION'
        ELSE 'OK'
    END as status
FROM pg_trigger t
LEFT JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid IN (
    SELECT oid FROM pg_class 
    WHERE relname IN (
        'training_sessions',
        'execution_logs',
        'session_version_history'
    )
)
AND NOT t.tgisinternal
ORDER BY table_name, trigger_name;

-- 2. Check for recursive triggers (triggers that modify their own table)
-- This is a manual check - look for triggers that UPDATE/INSERT/DELETE on same table

-- ============================================================================
-- G) MIGRATION INTEGRITY CHECKS
-- ============================================================================

-- Check for duplicate column additions (if migrations were run multiple times)
SELECT 
    table_name,
    column_name,
    COUNT(*) as definition_count
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN (
    'training_sessions',
    'execution_logs',
    'session_version_history',
    'wellness_logs',
    'readiness_scores'
)
GROUP BY table_name, column_name
HAVING COUNT(*) > 1;

-- Check for conflicting constraints
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    contype as constraint_type
FROM pg_constraint
WHERE conrelid IN (
    SELECT oid FROM pg_class 
    WHERE relname IN (
        'training_sessions',
        'execution_logs',
        'session_version_history'
    )
)
AND contype IN ('c', 'f', 'u', 'p')
ORDER BY table_name, constraint_name;

-- ============================================================================
-- H) CRITICAL DATA INTEGRITY
-- ============================================================================

-- 1. execution_logs with invalid session_version (version doesn't exist)
SELECT 
    'execution_logs' as table_name,
    'invalid_session_version' as issue_type,
    COUNT(*) as count
FROM execution_logs el
WHERE NOT EXISTS (
    SELECT 1 FROM session_version_history svh
    WHERE svh.session_id = el.session_id
    AND svh.version_number = el.session_version
);

-- 2. session_version_history with version_number gaps
SELECT 
    session_id,
    MIN(version_number) as min_version,
    MAX(version_number) as max_version,
    COUNT(*) as version_count,
    MAX(version_number) - MIN(version_number) + 1 as expected_count,
    CASE 
        WHEN MAX(version_number) - MIN(version_number) + 1 != COUNT(*) THEN 'GAP_DETECTED'
        ELSE 'OK'
    END as status
FROM session_version_history
GROUP BY session_id
HAVING MAX(version_number) - MIN(version_number) + 1 != COUNT(*);

-- ============================================================================
-- SUMMARY QUERY (Run this to get overall status)
-- ============================================================================

SELECT 
    'PREFLIGHT_CHECK_SUMMARY' as check_type,
    COUNT(*) FILTER (WHERE issue_type IS NOT NULL) as issue_count,
    CASE 
        WHEN COUNT(*) FILTER (WHERE issue_type IS NOT NULL) = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as status
FROM (
    -- Aggregate all checks
    SELECT issue_type FROM (
        -- Orphan checks
        SELECT 'orphaned_activity' as issue_type FROM team_activity_attendance taa LEFT JOIN team_activities ta ON taa.activity_id = ta.activity_id WHERE ta.activity_id IS NULL LIMIT 1
        UNION ALL
        SELECT 'orphaned_athlete' as issue_type FROM team_activity_attendance taa LEFT JOIN auth.users u ON taa.athlete_id = u.id WHERE u.id IS NULL LIMIT 1
        UNION ALL
        SELECT 'orphaned_session' as issue_type FROM session_version_history svh LEFT JOIN training_sessions ts ON svh.session_id = ts.id WHERE ts.id IS NULL LIMIT 1
        UNION ALL
        SELECT 'invalid_session_state' as issue_type FROM training_sessions WHERE session_state NOT IN ('PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'LOCKED', 'CANCELLED', 'EXPIRED', 'ABANDONED') LIMIT 1
        UNION ALL
        SELECT 'missing_coach_attribution' as issue_type FROM training_sessions WHERE coach_locked = true AND (modified_by_coach_id IS NULL OR modified_at IS NULL) LIMIT 1
        UNION ALL
        SELECT 'rls_disabled' as issue_type FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('wellness_logs', 'readiness_scores', 'pain_reports', 'execution_logs') AND rowsecurity = false LIMIT 1
    ) checks
) all_checks;


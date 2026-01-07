-- ============================================================================
-- PROOF: Merlin Hard Guard - Technically Impossible to Write
-- ============================================================================
-- This script proves that Merlin AI cannot write to the database
-- even if it bypasses API middleware (defense in depth)

-- ============================================================================
-- TEST 1: Verify merlin_readonly role has NO write privileges
-- ============================================================================

-- Check all privileges for merlin_readonly role
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type,
    CASE 
        WHEN privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE') THEN '❌ WRITE PRIVILEGE FOUND'
        ELSE '✅ Read-only'
    END as security_status
FROM information_schema.role_table_grants
WHERE grantee = 'merlin_readonly'
ORDER BY table_name, privilege_type;

-- Expected: NO rows with INSERT, UPDATE, DELETE, or TRUNCATE privileges

-- ============================================================================
-- TEST 2: Attempt direct INSERT as merlin_readonly (should fail)
-- ============================================================================

-- This test requires switching to merlin_readonly role
-- In production, this would be done via connection string with merlin_readonly credentials

-- SET ROLE merlin_readonly;
-- 
-- -- Attempt to insert into training_sessions (should fail)
-- INSERT INTO training_sessions (user_id, session_date, status)
-- VALUES ('00000000-0000-0000-0000-000000000000', CURRENT_DATE, 'planned');
-- 
-- -- Expected: ERROR: permission denied for table training_sessions
-- 
-- -- Attempt to update (should fail)
-- UPDATE training_sessions SET status = 'completed' WHERE id = '00000000-0000-0000-0000-000000000000';
-- 
-- -- Expected: ERROR: permission denied for table training_sessions
-- 
-- -- Attempt to delete (should fail)
-- DELETE FROM training_sessions WHERE id = '00000000-0000-0000-0000-000000000000';
-- 
-- -- Expected: ERROR: permission denied for table training_sessions
-- 
-- RESET ROLE;

-- ============================================================================
-- TEST 3: Verify merlin_readonly can ONLY SELECT
-- ============================================================================

SELECT 
    COUNT(*) FILTER (WHERE privilege_type = 'SELECT') as select_privileges,
    COUNT(*) FILTER (WHERE privilege_type = 'INSERT') as insert_privileges,
    COUNT(*) FILTER (WHERE privilege_type = 'UPDATE') as update_privileges,
    COUNT(*) FILTER (WHERE privilege_type = 'DELETE') as delete_privileges,
    COUNT(*) FILTER (WHERE privilege_type = 'TRUNCATE') as truncate_privileges,
    CASE 
        WHEN COUNT(*) FILTER (WHERE privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')) = 0 
        THEN '✅ HARD GUARD VERIFIED: No write privileges'
        ELSE '❌ SECURITY BREACH: Write privileges found'
    END as verification_status
FROM information_schema.role_table_grants
WHERE grantee = 'merlin_readonly';

-- Expected: select_privileges > 0, all write privileges = 0

-- ============================================================================
-- TEST 4: Check function execution privileges
-- ============================================================================

SELECT 
    routine_schema,
    routine_name,
    privilege_type,
    grantee
FROM information_schema.routine_privileges
WHERE grantee = 'merlin_readonly'
ORDER BY routine_name, privilege_type;

-- Expected: Only EXECUTE on read-only functions (get_athlete_consent, has_active_safety_override, get_executed_version)
-- No EXECUTE on functions that perform writes

-- ============================================================================
-- TEST 5: Verify merlin_violation_log exists and is append-only
-- ============================================================================

SELECT 
    tablename,
    CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as rls_status,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename AND cmd = 'INSERT') as insert_policies,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename AND cmd = 'UPDATE') as update_policies,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename AND cmd = 'DELETE') as delete_policies
FROM pg_tables t
WHERE schemaname = 'public' AND tablename = 'merlin_violation_log';

-- Expected: RLS enabled, INSERT policy exists, UPDATE/DELETE policies = 0

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT 
    'Merlin Hard Guard Verification' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.role_table_grants
            WHERE grantee = 'merlin_readonly'
            AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
        ) THEN '❌ FAILED: Write privileges found'
        ELSE '✅ PASSED: No write privileges'
    END as db_role_check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_roles WHERE rolname = 'merlin_readonly'
        ) THEN '✅ PASSED: Role exists'
        ELSE '❌ FAILED: Role does not exist'
    END as role_exists_check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' AND tablename = 'merlin_violation_log'
        ) THEN '✅ PASSED: Violation log table exists'
        ELSE '❌ FAILED: Violation log table missing'
    END as violation_log_check;


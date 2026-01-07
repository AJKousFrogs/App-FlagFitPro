-- ============================================================================
-- PROOF: Session Versioning & Timeline Reconstruction
-- ============================================================================

-- Test 1: Version created on modification
UPDATE training_sessions
SET prescribed_duration = 90
WHERE id = '<session_id>'
AND session_state IN ('GENERATED', 'VISIBLE');

-- Check version history
SELECT 
    version_number,
    modified_by_coach_id,
    modified_at,
    session_structure->>'prescribed_duration' as duration
FROM session_version_history
WHERE session_id = '<session_id>'
ORDER BY version_number;
-- Expected: New version created with updated duration

-- Test 2: Execution logs reference version
INSERT INTO execution_logs (
    session_id,
    session_version,
    athlete_id,
    exercise_name,
    sets_completed,
    reps_completed,
    rpe
) VALUES (
    '<session_id>',
    2, -- Executed version 2
    '<athlete_id>',
    'Squats',
    3,
    10,
    7
);

-- Test 3: Timeline reconstruction
SELECT 
    svh.version_number,
    svh.modified_at as version_created_at,
    svh.modified_by_coach_id,
    el.logged_at as execution_logged_at,
    el.exercise_name,
    el.rpe
FROM session_version_history svh
LEFT JOIN execution_logs el ON (
    el.session_id = svh.session_id
    AND el.session_version = svh.version_number
)
WHERE svh.session_id = '<session_id>'
ORDER BY svh.version_number, el.logged_at;
-- Expected: Shows which version was executed and when

-- Test 4: Append-only enforcement
UPDATE execution_logs
SET rpe = 8
WHERE log_id = '<log_id>';
-- Expected: ERROR: Execution logs are append-only. Cannot UPDATE historical logs.

DELETE FROM execution_logs WHERE log_id = '<log_id>';
-- Expected: ERROR: Execution logs are append-only. Cannot DELETE historical logs.

-- Test 5: Late data append
SELECT insert_late_execution_data(
    '<session_id>',
    '<athlete_id>',
    'Bench Press',
    3,
    8,
    6,
    NOW() - INTERVAL '2 hours' -- Logged 2 hours after session
);
-- Expected: New log entry inserted (append only)

-- Test 6: Get executed version
SELECT get_executed_version('<session_id>', '<athlete_id>');
-- Expected: Returns version number that athlete executed


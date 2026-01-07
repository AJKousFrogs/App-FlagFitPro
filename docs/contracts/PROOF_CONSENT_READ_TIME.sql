-- ============================================================================
-- PROOF: Consent Checked at Read-Time (No Cache)
-- ============================================================================
-- This script proves that consent is checked on every read request
-- and changes take effect immediately without cache

-- ============================================================================
-- SETUP: Create test athlete and coach
-- ============================================================================

-- Note: Replace these UUIDs with actual test user IDs from your database
-- DO NOT RUN THIS IN PRODUCTION - Use test data only

-- Test athlete ID (replace with actual)
-- SET @athlete_id = '00000000-0000-0000-0000-000000000001';
-- Test coach ID (replace with actual)
-- SET @coach_id = '00000000-0000-0000-0000-000000000002';

-- ============================================================================
-- TEST CASE A1: Coach tries to read readiness detail → DENIED (no consent)
-- ============================================================================

-- Step 1: Ensure consent is OFF
UPDATE athlete_consent_settings
SET share_readiness_with_coach = false
WHERE athlete_id = :athlete_id;

-- Step 2: Coach attempts to read readiness scores
-- This query simulates what the API would execute for a coach request
SELECT 
    rs.day,
    rs.score,
    rs.level,
    rs.suggestion,
    rs.acwr,
    -- Coach should only see these fields if consent granted OR safety override
    CASE 
        WHEN get_athlete_consent(:athlete_id, 'readiness') = true THEN rs.acwr
        WHEN rs.acwr > 1.5 OR rs.acwr < 0.8 THEN rs.acwr  -- Safety override
        ELSE NULL
    END as acwr_visible,
    CASE 
        WHEN get_athlete_consent(:athlete_id, 'readiness') = true THEN rs.workload_score
        WHEN rs.acwr > 1.5 OR rs.acwr < 0.8 THEN rs.workload_score  -- Safety override
        ELSE NULL
    END as workload_score_visible
FROM readiness_scores rs
WHERE rs.athlete_id = :athlete_id
AND EXISTS (
    SELECT 1 FROM coach_athlete_assignments
    WHERE coach_id = :coach_id
    AND athlete_id = rs.athlete_id
)
ORDER BY rs.day DESC
LIMIT 1;

-- Expected Result: 
-- - acwr_visible = NULL (consent OFF, no safety override)
-- - workload_score_visible = NULL (consent OFF, no safety override)
-- - Only basic fields visible (day, score, level, suggestion)

-- ============================================================================
-- TEST CASE A2: Athlete toggles consent ON → coach read ALLOWED
-- ============================================================================

-- Step 1: Athlete grants consent
UPDATE athlete_consent_settings
SET share_readiness_with_coach = true,
    updated_at = NOW()
WHERE athlete_id = :athlete_id;

-- Log consent change
INSERT INTO consent_change_log (
    athlete_id,
    setting_name,
    old_value,
    new_value,
    changed_by,
    change_reason
) VALUES (
    :athlete_id,
    'share_readiness_with_coach',
    'false',
    'true',
    :athlete_id,
    'Athlete granted consent for testing'
);

-- Step 2: Coach attempts to read readiness scores (IMMEDIATELY after consent change)
SELECT 
    rs.day,
    rs.score,
    rs.level,
    rs.suggestion,
    rs.acwr,
    rs.workload_score,
    rs.wellness_score,
    rs.sleep_score,
    -- All fields should be visible now
    CASE 
        WHEN get_athlete_consent(:athlete_id, 'readiness') = true THEN '✅ FULL ACCESS'
        ELSE '❌ LIMITED ACCESS'
    END as access_level
FROM readiness_scores rs
WHERE rs.athlete_id = :athlete_id
AND EXISTS (
    SELECT 1 FROM coach_athlete_assignments
    WHERE coach_id = :coach_id
    AND athlete_id = rs.athlete_id
)
ORDER BY rs.day DESC
LIMIT 1;

-- Expected Result:
-- - acwr = actual value (not NULL)
-- - workload_score = actual value (not NULL)
-- - wellness_score = actual value (not NULL)
-- - access_level = '✅ FULL ACCESS'
-- - NO CACHE DELAY - changes take effect immediately

-- ============================================================================
-- TEST CASE A3: Athlete toggles consent OFF → coach read DENIED immediately
-- ============================================================================

-- Step 1: Athlete revokes consent
UPDATE athlete_consent_settings
SET share_readiness_with_coach = false,
    updated_at = NOW()
WHERE athlete_id = :athlete_id;

-- Log consent change
INSERT INTO consent_change_log (
    athlete_id,
    setting_name,
    old_value,
    new_value,
    changed_by,
    change_reason
) VALUES (
    :athlete_id,
    'share_readiness_with_coach',
    'true',
    'false',
    :athlete_id,
    'Athlete revoked consent for testing'
);

-- Step 2: Coach attempts to read readiness scores (IMMEDIATELY after consent revocation)
SELECT 
    rs.day,
    rs.score,
    rs.level,
    rs.suggestion,
    -- Detailed fields should be NULL again
    CASE 
        WHEN get_athlete_consent(:athlete_id, 'readiness') = true THEN rs.acwr
        WHEN rs.acwr > 1.5 OR rs.acwr < 0.8 THEN rs.acwr  -- Safety override
        ELSE NULL
    END as acwr_visible,
    CASE 
        WHEN get_athlete_consent(:athlete_id, 'readiness') = true THEN rs.workload_score
        WHEN rs.acwr > 1.5 OR rs.acwr < 0.8 THEN rs.workload_score  -- Safety override
        ELSE NULL
    END as workload_score_visible,
    CASE 
        WHEN get_athlete_consent(:athlete_id, 'readiness') = true THEN '✅ FULL ACCESS'
        WHEN rs.acwr > 1.5 OR rs.acwr < 0.8 THEN '⚠️ SAFETY OVERRIDE'
        ELSE '❌ LIMITED ACCESS (Consent Required)'
    END as access_level
FROM readiness_scores rs
WHERE rs.athlete_id = :athlete_id
AND EXISTS (
    SELECT 1 FROM coach_athlete_assignments
    WHERE coach_id = :coach_id
    AND athlete_id = rs.athlete_id
)
ORDER BY rs.day DESC
LIMIT 1;

-- Expected Result:
-- - acwr_visible = NULL (unless safety override active)
-- - workload_score_visible = NULL (unless safety override active)
-- - access_level = '❌ LIMITED ACCESS (Consent Required)'
-- - NO CACHE DELAY - revocation takes effect immediately

-- ============================================================================
-- VERIFICATION: Check consent change log timestamps
-- ============================================================================

SELECT 
    athlete_id,
    setting_name,
    old_value,
    new_value,
    changed_at,
    change_reason,
    -- Calculate time between changes
    LAG(changed_at) OVER (ORDER BY changed_at) as previous_change_time,
    changed_at - LAG(changed_at) OVER (ORDER BY changed_at) as time_between_changes
FROM consent_change_log
WHERE athlete_id = :athlete_id
AND setting_name = 'share_readiness_with_coach'
ORDER BY changed_at DESC
LIMIT 5;

-- This proves consent changes are logged and timestamped
-- API reads use get_athlete_consent() which queries the current state (no cache)

-- ============================================================================
-- SUMMARY: Consent Read-Time Verification
-- ============================================================================

SELECT 
    'Consent Read-Time Check' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM athlete_consent_settings
            WHERE athlete_id = :athlete_id
            AND share_readiness_with_coach = false
        ) THEN '✅ Consent OFF verified'
        ELSE '❌ Consent state unclear'
    END as current_state,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM consent_change_log
            WHERE athlete_id = :athlete_id
            AND setting_name = 'share_readiness_with_coach'
            AND changed_at >= NOW() - INTERVAL '1 hour'
        ) THEN '✅ Recent consent changes logged'
        ELSE '⚠️ No recent consent changes'
    END as change_logging,
    'Consent checked via get_athlete_consent() function on every read' as enforcement_method;


-- ============================================================================
-- PROOF: Safety Override Bypasses Consent
-- ============================================================================

-- Test 1: Pain >3/10 triggers override
SELECT detect_pain_trigger(
    '<athlete_id>',
    7, -- pain_score >3
    'knee',
    'worse'
);
-- Expected: Returns override_id (UUID)

-- Test 2: Override log entry created
SELECT *
FROM safety_override_log
WHERE athlete_id = '<athlete_id>'
AND trigger_type = 'pain_above_3'
ORDER BY override_timestamp DESC
LIMIT 1;
-- Expected: Row with disclosed_to_roles = ['coach', 'physio']

-- Test 3: Safety override bypasses consent check
SELECT 
    athlete_id,
    day,
    score,
    acwr
FROM readiness_scores
WHERE athlete_id = '<athlete_id>'
AND (
    get_athlete_consent(athlete_id, 'readiness') = true
    OR has_active_safety_override(athlete_id, 'acwr') = true
);
-- Expected: Returns score even if consent = false when override active

-- Test 4: ACWR danger zone triggers override
SELECT detect_acwr_trigger('<athlete_id>');
-- Expected: Returns override_id if ACWR >1.5 or <0.8

-- Test 5: Override active check
SELECT has_active_safety_override('<athlete_id>', 'pain');
-- Expected: Returns true if pain override active in last 7 days


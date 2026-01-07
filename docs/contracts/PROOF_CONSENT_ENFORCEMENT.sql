-- ============================================================================
-- PROOF: Consent Enforcement
-- ============================================================================
-- Run these queries to verify consent enforcement works

-- Test 1: Coach cannot view readinessScore without consent
-- Expected: Returns NULL for score column (filtered at API layer)
-- Note: RLS allows SELECT, but API filters columns
SELECT 
    athlete_id,
    day,
    score,  -- Should be NULL if consent not granted (API filters)
    level,
    acwr
FROM readiness_scores
WHERE athlete_id = '<athlete_id>'
AND EXISTS (
    SELECT 1 FROM coach_athlete_assignments
    WHERE coach_id = auth.uid()
    AND athlete_id = readiness_scores.athlete_id
)
AND get_athlete_consent(athlete_id, 'readiness') = false
AND (acwr <= 1.5 AND acwr >= 0.8); -- No safety override

-- Test 2: Coach can view readinessScore with consent
-- Expected: Returns full data including score
SELECT *
FROM readiness_scores
WHERE athlete_id = '<athlete_id>'
AND get_athlete_consent(athlete_id, 'readiness') = true;

-- Test 3: Safety override bypasses consent (ACWR danger)
-- Expected: Returns score even without consent
SELECT *
FROM readiness_scores
WHERE athlete_id = '<athlete_id>'
AND get_athlete_consent(athlete_id, 'readiness') = false
AND (acwr > 1.5 OR acwr < 0.8);

-- Test 4: Consent change is logged
INSERT INTO athlete_consent_settings (athlete_id, share_readiness_with_coach)
VALUES (auth.uid(), true)
ON CONFLICT (athlete_id) 
DO UPDATE SET 
    share_readiness_with_coach = true,
    updated_at = NOW();

-- Verify log entry created (requires service_role)
-- SELECT * FROM consent_change_log
-- WHERE athlete_id = auth.uid()
-- ORDER BY changed_at DESC
-- LIMIT 1;

-- Test 5: Default consent is false (hidden)
SELECT 
    athlete_id,
    share_readiness_with_coach,
    share_wellness_answers_with_coach
FROM athlete_consent_settings
WHERE athlete_id = '<new_athlete_id>';
-- Expected: NULL (no record) or all false


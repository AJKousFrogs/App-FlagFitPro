-- ============================================================================
-- PROOF: Safety Override Bypasses Consent
-- ============================================================================
-- This script proves that safety overrides allow coach/physio visibility
-- even when consent is OFF, but ONLY for safety-related data

-- ============================================================================
-- SETUP: Create test scenario
-- ============================================================================

-- Note: Replace these UUIDs with actual test user IDs from your database
-- DO NOT RUN THIS IN PRODUCTION - Use test data only

-- Test athlete ID (replace with actual)
-- SET @athlete_id = '00000000-0000-0000-0000-000000000001';
-- Test coach ID (replace with actual)
-- SET @coach_id = '00000000-0000-0000-0000-000000000002';

-- ============================================================================
-- TEST CASE B1: Consent OFF + Pain >3/10 → Coach/Physio visibility ALLOWED
-- ============================================================================

-- Step 1: Ensure consent is OFF
UPDATE athlete_consent_settings
SET share_wellness_answers_with_coach = false,
    share_readiness_with_coach = false
WHERE athlete_id = :athlete_id;

-- Step 2: Create wellness entry with pain > 3/10 (triggers safety override)
INSERT INTO wellness_logs (
    athlete_id,
    log_date,
    sleep_quality,
    sleep_hours,
    energy_level,
    muscle_soreness,  -- This will be > 3
    stress_level,
    mood,
    notes
) VALUES (
    :athlete_id,
    CURRENT_DATE,
    5,
    7,
    6,
    5,  -- Pain level 5/10 (> 3 triggers override)
    4,
    6,
    'Test entry with high pain for safety override'
) ON CONFLICT (athlete_id, log_date) DO UPDATE
SET muscle_soreness = 5,
    notes = 'Test entry with high pain for safety override';

-- Step 3: Trigger safety override detection (simulates API call)
-- This would normally be called by detectPainTrigger() function
INSERT INTO safety_override_log (
    athlete_id,
    trigger_type,
    trigger_value,
    data_disclosed,
    disclosed_to_roles,
    disclosed_to_user_ids
) VALUES (
    :athlete_id,
    'pain_above_3',
    jsonb_build_object('pain_score', 5, 'pain_location', 'general'),
    jsonb_build_object('pain_score', 5, 'pain_location', 'general'),
    ARRAY['coach', 'physio'],
    ARRAY[]::UUID[] -- Would be populated with actual coach/physio IDs
);

-- Step 4: Coach attempts to read wellness data (consent OFF, but safety override active)
SELECT 
    wl.log_date,
    wl.sleep_quality,
    wl.sleep_hours,
    wl.energy_level,
    -- Pain data should be visible due to safety override
    wl.muscle_soreness as pain_level,
    wl.stress_level,
    wl.mood,
    wl.notes,
    -- Check if safety override is active
    has_active_safety_override(:athlete_id, 'pain') as safety_override_active,
    -- Check consent status
    get_athlete_consent(:athlete_id, 'wellness') as consent_granted,
    -- Determine access level
    CASE 
        WHEN get_athlete_consent(:athlete_id, 'wellness') = true THEN '✅ FULL ACCESS (Consent)'
        WHEN has_active_safety_override(:athlete_id, 'pain') = true THEN '⚠️ SAFETY OVERRIDE (Pain >3/10)'
        ELSE '❌ LIMITED ACCESS'
    END as access_level,
    -- Safety override flag (check if override exists and includes coach role)
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM safety_override_log
            WHERE athlete_id = :athlete_id
            AND override_timestamp >= NOW() - INTERVAL '7 days'
            AND trigger_type IN ('pain_above_3', 'new_pain_area', 'worsening_pain')
            AND 'coach' = ANY(disclosed_to_roles)
        ) THEN true
        ELSE false
    END as override_flag
FROM wellness_logs wl
WHERE wl.athlete_id = :athlete_id
AND wl.log_date = CURRENT_DATE
AND EXISTS (
    SELECT 1 FROM coach_athlete_assignments
    WHERE coach_id = :coach_id
    AND athlete_id = wl.athlete_id
);

-- Expected Result:
-- - pain_level = 5 (visible due to safety override)
-- - notes = visible (safety-related data)
-- - safety_override_active = true
-- - consent_granted = false
-- - access_level = '⚠️ SAFETY OVERRIDE (Pain >3/10)'
-- - override_flag = true

-- ============================================================================
-- TEST CASE B2: Consent OFF + No Trigger → Coach CANNOT read content
-- ============================================================================

-- Step 1: Ensure consent is still OFF
UPDATE athlete_consent_settings
SET share_wellness_answers_with_coach = false
WHERE athlete_id = :athlete_id;

-- Step 2: Create wellness entry with LOW pain (no safety override)
INSERT INTO wellness_logs (
    athlete_id,
    log_date,
    sleep_quality,
    sleep_hours,
    energy_level,
    muscle_soreness,  -- This will be <= 3
    stress_level,
    mood,
    notes
) VALUES (
    :athlete_id,
    CURRENT_DATE + INTERVAL '1 day',
    6,
    8,
    7,
    2,  -- Pain level 2/10 (no override)
    3,
    7,
    'Test entry with low pain - no override'
) ON CONFLICT (athlete_id, log_date) DO UPDATE
SET muscle_soreness = 2,
    notes = 'Test entry with low pain - no override';

-- Step 3: Ensure NO safety override exists for this date
-- (Safety overrides expire after 7 days, so this should be clean)

-- Step 4: Coach attempts to read wellness data (consent OFF, NO safety override)
SELECT 
    wl.log_date,
    -- Basic compliance data (always visible)
    CASE 
        WHEN wl.log_date IS NOT NULL THEN true
        ELSE false
    END as check_in_completed,
    -- Detailed wellness answers (should be NULL without consent or override)
    CASE 
        WHEN get_athlete_consent(:athlete_id, 'wellness') = true THEN wl.sleep_quality
        WHEN has_active_safety_override(:athlete_id, 'pain') = true THEN wl.sleep_quality
        ELSE NULL
    END as sleep_quality_visible,
    CASE 
        WHEN get_athlete_consent(:athlete_id, 'wellness') = true THEN wl.muscle_soreness
        WHEN has_active_safety_override(:athlete_id, 'pain') = true THEN wl.muscle_soreness
        ELSE NULL
    END as pain_level_visible,
    CASE 
        WHEN get_athlete_consent(:athlete_id, 'wellness') = true THEN wl.notes
        WHEN has_active_safety_override(:athlete_id, 'pain') = true THEN wl.notes
        ELSE NULL
    END as notes_visible,
    -- Check if safety override is active
    has_active_safety_override(:athlete_id, 'pain') as safety_override_active,
    -- Check consent status
    get_athlete_consent(:athlete_id, 'wellness') as consent_granted,
    -- Determine access level
    CASE 
        WHEN get_athlete_consent(:athlete_id, 'wellness') = true THEN '✅ FULL ACCESS (Consent)'
        WHEN has_active_safety_override(:athlete_id, 'pain') = true THEN '⚠️ SAFETY OVERRIDE'
        ELSE '❌ LIMITED ACCESS (Compliance Only)'
    END as access_level
FROM wellness_logs wl
WHERE wl.athlete_id = :athlete_id
AND wl.log_date = CURRENT_DATE + INTERVAL '1 day'
AND EXISTS (
    SELECT 1 FROM coach_athlete_assignments
    WHERE coach_id = :coach_id
    AND athlete_id = wl.athlete_id
);

-- Expected Result:
-- - check_in_completed = true (compliance data always visible)
-- - sleep_quality_visible = NULL (no consent, no override)
-- - pain_level_visible = NULL (no consent, no override)
-- - notes_visible = NULL (no consent, no override)
-- - safety_override_active = false
-- - consent_granted = false
-- - access_level = '❌ LIMITED ACCESS (Compliance Only)'

-- ============================================================================
-- TEST CASE B3: Verify Safety Override Logging
-- ============================================================================

-- Check that safety overrides are properly logged
SELECT 
    sol.athlete_id,
    sol.trigger_type,
    sol.trigger_value,
    sol.override_timestamp,
    sol.data_disclosed,
    sol.disclosed_to_roles,
    sol.disclosed_to_user_ids,
    -- Verify override is recent (within last 7 days)
    CASE 
        WHEN sol.override_timestamp >= NOW() - INTERVAL '7 days' THEN '✅ ACTIVE'
        ELSE '⚠️ EXPIRED'
    END as override_status,
    -- Check if coach can see this override
    CASE 
        WHEN 'coach' = ANY(sol.disclosed_to_roles) THEN '✅ Visible to coach'
        ELSE '❌ Not visible to coach'
    END as coach_visibility,
    -- Check if physio can see this override
    CASE 
        WHEN 'physio' = ANY(sol.disclosed_to_roles) THEN '✅ Visible to physio'
        ELSE '❌ Not visible to physio'
    END as physio_visibility
FROM safety_override_log sol
WHERE sol.athlete_id = :athlete_id
ORDER BY sol.override_timestamp DESC
LIMIT 5;

-- Expected: Recent override entries with:
-- - trigger_type = 'pain_above_3' or 'acwr_danger_zone'
-- - disclosed_to_roles includes 'coach' and 'physio'
-- - override_status = '✅ ACTIVE'
-- - coach_visibility = '✅ Visible to coach'
-- - physio_visibility = '✅ Visible to physio'

-- ============================================================================
-- TEST CASE B4: ACWR Safety Override
-- ============================================================================

-- Step 1: Create readiness score with ACWR in danger zone
INSERT INTO readiness_scores (
    athlete_id,
    user_id,
    day,
    score,
    level,
    suggestion,
    acwr,  -- ACWR > 1.5 triggers override
    acute_load,
    chronic_load
) VALUES (
    :athlete_id,
    :athlete_id,
    CURRENT_DATE,
    65,
    'moderate',
    'maintain',
    1.6,  -- ACWR > 1.5 (danger zone)
    1000,
    625
) ON CONFLICT (athlete_id, day) DO UPDATE
SET acwr = 1.6;

-- Step 2: Trigger ACWR safety override
INSERT INTO safety_override_log (
    athlete_id,
    trigger_type,
    trigger_value,
    data_disclosed,
    disclosed_to_roles,
    disclosed_to_user_ids
) VALUES (
    :athlete_id,
    'acwr_danger_zone',
    jsonb_build_object('acwr', 1.6, 'risk_zone', 'high'),
    jsonb_build_object('acwr', 1.6, 'acute_load', 1000, 'chronic_load', 625),
    ARRAY['coach', 'physio'],
    ARRAY[]::UUID[] -- Would be populated with actual coach/physio IDs
);

-- Step 3: Coach attempts to read readiness (consent OFF, but ACWR override active)
SELECT 
    rs.day,
    rs.score,
    rs.level,
    rs.suggestion,
    -- ACWR should be visible due to safety override
    rs.acwr,
    rs.acute_load,
    rs.chronic_load,
    -- Check if safety override is active
    CASE 
        WHEN rs.acwr > 1.5 OR rs.acwr < 0.8 THEN true
        ELSE false
    END as acwr_override_active,
    -- Check consent status
    get_athlete_consent(:athlete_id, 'readiness') as consent_granted,
    -- Determine access level
    CASE 
        WHEN get_athlete_consent(:athlete_id, 'readiness') = true THEN '✅ FULL ACCESS (Consent)'
        WHEN rs.acwr > 1.5 OR rs.acwr < 0.8 THEN '⚠️ SAFETY OVERRIDE (ACWR Danger Zone)'
        ELSE '❌ LIMITED ACCESS'
    END as access_level
FROM readiness_scores rs
WHERE rs.athlete_id = :athlete_id
AND rs.day = CURRENT_DATE
AND EXISTS (
    SELECT 1 FROM coach_athlete_assignments
    WHERE coach_id = :coach_id
    AND athlete_id = rs.athlete_id
);

-- Expected Result:
-- - acwr = 1.6 (visible due to safety override)
-- - acute_load = visible (safety-related)
-- - chronic_load = visible (safety-related)
-- - acwr_override_active = true
-- - consent_granted = false
-- - access_level = '⚠️ SAFETY OVERRIDE (ACWR Danger Zone)'

-- ============================================================================
-- SUMMARY: Safety Override Bypass Verification
-- ============================================================================

SELECT 
    'Safety Override Bypass Check' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM safety_override_log
            WHERE athlete_id = :athlete_id
            AND override_timestamp >= NOW() - INTERVAL '7 days'
            AND trigger_type IN ('pain_above_3', 'acwr_danger_zone')
        ) THEN '✅ Active safety overrides found'
        ELSE '⚠️ No active safety overrides'
    END as override_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM athlete_consent_settings
            WHERE athlete_id = :athlete_id
            AND share_wellness_answers_with_coach = false
            AND share_readiness_with_coach = false
        ) THEN '✅ Consent OFF verified'
        ELSE '⚠️ Consent state unclear'
    END as consent_status,
    'Safety overrides bypass consent for safety-related data only' as enforcement_rule;


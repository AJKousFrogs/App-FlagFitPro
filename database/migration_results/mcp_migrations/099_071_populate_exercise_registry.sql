-- =============================================================================
-- POPULATE EXERCISE REGISTRY FROM EXISTING TABLES
-- =============================================================================
-- This script populates the exercise_registry table from existing exercise data
-- Run after migration 070 has been applied
-- =============================================================================

-- =============================================================================
-- STEP 1: Populate from Plyometrics Exercises
-- =============================================================================

INSERT INTO exercise_registry (
    name,
    exercise_type,
    category,
    difficulty_level,
    description,
    instructions,
    plyometric_details_id,
    video_url,
    thumbnail_url,
    equipment_needed,
    position_specific,
    applicable_positions,
    research_based,
    research_source,
    effectiveness_rating,
    injury_risk_rating,
    is_active,
    is_public,
    created_at,
    updated_at
)
SELECT 
    exercise_name,
    'plyometric'::TEXT,
    exercise_category::TEXT::exercise_category_enum,
    difficulty_level::TEXT::difficulty_level_enum,
    description,
    instructions,
    id, -- Reference to plyometrics_exercises
    video_url,
    thumbnail_url,
    equipment_needed,
    position_specific,
    CASE 
        WHEN position_applications IS NOT NULL 
        THEN ARRAY(SELECT jsonb_object_keys(position_applications))::UUID[]
        ELSE ARRAY[]::UUID[]
    END,
    research_based,
    research_source,
    effectiveness_rating,
    CASE injury_risk_rating
        WHEN 'Low' THEN 'Low'::risk_level_enum
        WHEN 'Moderate' THEN 'Moderate'::risk_level_enum
        WHEN 'High' THEN 'High'::risk_level_enum
        ELSE 'Low'::risk_level_enum
    END,
    TRUE, -- is_active
    TRUE, -- is_public
    created_at,
    updated_at
FROM plyometrics_exercises
ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 2: Populate from Isometrics Exercises
-- =============================================================================

INSERT INTO exercise_registry (
    name,
    exercise_type,
    category,
    difficulty_level,
    description,
    instructions,
    isometric_details_id,
    video_url,
    equipment_needed,
    position_specific,
    research_based,
    research_source,
    effectiveness_rating,
    injury_risk_rating,
    is_active,
    is_public,
    created_at,
    updated_at
)
SELECT 
    name,
    'isometric'::TEXT,
    CASE 
        WHEN category = 'Injury Prevention' THEN 'Injury Prevention'::exercise_category_enum
        WHEN category = 'Rehabilitation' THEN 'Rehabilitation'::exercise_category_enum
        ELSE 'Strength'::exercise_category_enum
    END,
    difficulty_level::TEXT::difficulty_level_enum,
    description,
    instructions,
    id, -- Reference to isometrics_exercises
    video_url,
    ARRAY[]::TEXT[], -- No equipment_needed in isometrics_exercises
    FALSE, -- Not position-specific by default
    research_based,
    research_source,
    effectiveness_rating,
    'Low'::risk_level_enum, -- Isometrics are generally low risk
    TRUE, -- is_active
    TRUE, -- is_public
    created_at,
    updated_at
FROM isometrics_exercises
ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 3: Populate from General Exercises
-- =============================================================================

INSERT INTO exercise_registry (
    name,
    exercise_type,
    category,
    difficulty_level,
    description,
    general_exercise_id,
    video_url,
    equipment_needed,
    position_specific,
    applicable_positions,
    research_based,
    is_active,
    is_public,
    created_at,
    updated_at
)
SELECT 
    name,
    CASE 
        WHEN category IN ('Strength', 'Flexibility') THEN 'strength'
        WHEN category IN ('Speed', 'Agility') THEN 'skill'
        ELSE 'skill'
    END::TEXT,
    CASE 
        WHEN category IN ('Strength', 'Speed', 'Agility', 'Flexibility', 'Position-Specific') 
        THEN category::TEXT::exercise_category_enum
        ELSE 'Strength'::exercise_category_enum
    END,
    'Intermediate'::difficulty_level_enum, -- Default since general exercises don't have difficulty
    COALESCE(description, 'No description available'),
    id, -- Reference to exercises
    video_url,
    equipment_needed,
    position_specific,
    applicable_positions,
    FALSE, -- research_based not in general exercises
    TRUE, -- is_active
    TRUE, -- is_public
    created_at,
    updated_at
FROM exercises
ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 4: Verification Queries
-- =============================================================================

-- Count exercises by type
SELECT 
    exercise_type,
    COUNT(*) AS count
FROM exercise_registry
GROUP BY exercise_type
ORDER BY count DESC;

-- Count exercises by category
SELECT 
    category,
    COUNT(*) AS count
FROM exercise_registry
GROUP BY category
ORDER BY count DESC;

-- Count exercises by difficulty
SELECT 
    difficulty_level,
    COUNT(*) AS count
FROM exercise_registry
GROUP BY difficulty_level
ORDER BY 
    CASE difficulty_level
        WHEN 'Beginner' THEN 1
        WHEN 'Intermediate' THEN 2
        WHEN 'Advanced' THEN 3
        WHEN 'Elite' THEN 4
    END;

-- Verify all references are valid
SELECT 
    er.id,
    er.name,
    er.exercise_type,
    CASE 
        WHEN er.plyometric_details_id IS NOT NULL THEN 'Has plyometric details'
        WHEN er.isometric_details_id IS NOT NULL THEN 'Has isometric details'
        WHEN er.general_exercise_id IS NOT NULL THEN 'Has general exercise details'
        ELSE 'ERROR: No details linked'
    END AS details_status
FROM exercise_registry er
WHERE 
    (er.plyometric_details_id IS NULL AND er.exercise_type = 'plyometric')
    OR (er.isometric_details_id IS NULL AND er.exercise_type = 'isometric')
    OR (er.general_exercise_id IS NULL AND er.exercise_type IN ('strength', 'skill'));

-- Sample query to verify joins work
SELECT 
    er.name,
    er.exercise_type,
    er.difficulty_level,
    pe.coaching_cues,
    ie.injury_prevention_benefits,
    e.movement_pattern
FROM exercise_registry er
LEFT JOIN plyometrics_exercises pe ON er.plyometric_details_id = pe.id
LEFT JOIN isometrics_exercises ie ON er.isometric_details_id = ie.id
LEFT JOIN exercises e ON er.general_exercise_id = e.id
LIMIT 10;

-- =============================================================================
-- SUMMARY REPORT
-- =============================================================================

SELECT 
    'Total exercises in registry' AS metric,
    COUNT(*)::TEXT AS value
FROM exercise_registry
UNION ALL
SELECT 
    'Plyometric exercises' AS metric,
    COUNT(*)::TEXT AS value
FROM exercise_registry
WHERE exercise_type = 'plyometric'
UNION ALL
SELECT 
    'Isometric exercises' AS metric,
    COUNT(*)::TEXT AS value
FROM exercise_registry
WHERE exercise_type = 'isometric'
UNION ALL
SELECT 
    'General exercises' AS metric,
    COUNT(*)::TEXT AS value
FROM exercise_registry
WHERE exercise_type IN ('strength', 'skill')
UNION ALL
SELECT 
    'Position-specific exercises' AS metric,
    COUNT(*)::TEXT AS value
FROM exercise_registry
WHERE position_specific = TRUE
UNION ALL
SELECT 
    'Research-based exercises' AS metric,
    COUNT(*)::TEXT AS value
FROM exercise_registry
WHERE research_based = TRUE;

-- =============================================================================
-- NOTES
-- =============================================================================
/*
This script:
1. Populates exercise_registry from plyometrics_exercises (70+ exercises)
2. Populates exercise_registry from isometrics_exercises (3+ exercises)
3. Populates exercise_registry from exercises (general library)
4. Verifies all data was populated correctly
5. Provides summary statistics

After running this script, you should:
1. Verify the counts match your expectations
2. Check that no exercises are missing details (see verification queries)
3. Update your application code to use exercise_registry instead of individual tables
4. Consider creating a view that combines the most commonly used fields

Example view:
CREATE VIEW v_exercises_full AS
SELECT 
    er.*,
    pe.coaching_cues,
    pe.common_mistakes,
    ie.injury_prevention_benefits,
    e.movement_pattern
FROM exercise_registry er
LEFT JOIN plyometrics_exercises pe ON er.plyometric_details_id = pe.id
LEFT JOIN isometrics_exercises ie ON er.isometric_details_id = ie.id
LEFT JOIN exercises e ON er.general_exercise_id = e.id;
*/


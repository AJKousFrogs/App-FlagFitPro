-- =============================================================================
-- BACKFILL METRIC ENTRIES FROM POSITION_SPECIFIC_METRICS
-- =============================================================================
-- This script migrates data from the old position_specific_metrics table
-- to the new metric_definitions/metric_entries system
-- Run after migration 070 and 071
-- =============================================================================

-- =============================================================================
-- STEP 1: Create Metric Definitions from Existing Data
-- =============================================================================

-- This finds all unique metric_name values from position_specific_metrics
-- and creates metric_definitions for them

INSERT INTO metric_definitions (
    code,
    display_name,
    value_type,
    unit,
    aggregation_method,
    position_id,
    is_position_specific,
    category,
    description,
    is_active
)
SELECT DISTINCT
    -- Generate code from metric_name (lowercase, replace spaces with underscores)
    LOWER(REGEXP_REPLACE(metric_name, '[^a-zA-Z0-9]+', '_', 'g')) AS code,
    
    -- Use original metric_name as display_name
    metric_name AS display_name,
    
    -- Infer value_type from metric_unit
    CASE 
        WHEN metric_unit IN ('%', 'percent', 'percentage') THEN 'percent'
        WHEN metric_unit IN ('s', 'sec', 'seconds', 'ms', 'milliseconds') THEN 'time'
        WHEN metric_value::TEXT ~ '^[0-9]+$' THEN 'integer'
        ELSE 'decimal'
    END AS value_type,
    
    -- Use metric_unit as unit
    metric_unit AS unit,
    
    -- Default aggregation method based on metric name
    CASE 
        WHEN metric_name ILIKE '%volume%' OR metric_name ILIKE '%total%' THEN 'sum'
        WHEN metric_name ILIKE '%rate%' OR metric_name ILIKE '%percentage%' THEN 'avg'
        WHEN metric_name ILIKE '%max%' OR metric_name ILIKE '%peak%' THEN 'max'
        WHEN metric_name ILIKE '%min%' THEN 'min'
        ELSE 'avg'
    END AS aggregation_method,
    
    -- Link to position if position_id exists
    position_id,
    
    -- Mark as position-specific if position_id is not null
    (position_id IS NOT NULL) AS is_position_specific,
    
    -- Infer category from metric name
    CASE 
        WHEN metric_name ILIKE '%volume%' OR metric_name ILIKE '%reps%' THEN 'Volume'
        WHEN metric_name ILIKE '%technique%' OR metric_name ILIKE '%form%' THEN 'Technique'
        WHEN metric_name ILIKE '%time%' OR metric_name ILIKE '%speed%' THEN 'Performance'
        ELSE 'Performance'
    END AS category,
    
    -- Description from aggregated context
    'Migrated from position_specific_metrics: ' || metric_name AS description,
    
    -- Active by default
    TRUE AS is_active
    
FROM position_specific_metrics
WHERE metric_name IS NOT NULL
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- STEP 2: Migrate Metric Entries
-- =============================================================================

-- This migrates all historical metric data to the new metric_entries table
INSERT INTO metric_entries (
    player_id,
    workout_log_id,
    metric_definition_id,
    date,
    value,
    notes,
    created_at,
    updated_at
)
SELECT 
    psm.player_id,
    psm.workout_log_id,
    md.id AS metric_definition_id,
    psm.date,
    psm.metric_value,
    NULL AS notes, -- old table didn't have notes
    psm.created_at,
    psm.updated_at
FROM position_specific_metrics psm
JOIN metric_definitions md ON (
    md.code = LOWER(REGEXP_REPLACE(psm.metric_name, '[^a-zA-Z0-9]+', '_', 'g'))
)
WHERE psm.metric_value IS NOT NULL
ON CONFLICT (player_id, metric_definition_id, workout_log_id) DO NOTHING;

-- =============================================================================
-- STEP 3: Verification Queries
-- =============================================================================

-- Count metrics migrated
SELECT 
    'Metric definitions created' AS metric,
    COUNT(*)::TEXT AS value
FROM metric_definitions
WHERE description ILIKE '%Migrated from position_specific_metrics%'
UNION ALL
SELECT 
    'Metric entries migrated' AS metric,
    COUNT(*)::TEXT AS value
FROM metric_entries;

-- Show sample of migrated data
SELECT 
    md.display_name,
    md.code,
    md.value_type,
    md.unit,
    COUNT(me.id) AS entry_count,
    MIN(me.date) AS earliest_date,
    MAX(me.date) AS latest_date
FROM metric_definitions md
LEFT JOIN metric_entries me ON me.metric_definition_id = md.id
WHERE md.description ILIKE '%Migrated from position_specific_metrics%'
GROUP BY md.id, md.display_name, md.code, md.value_type, md.unit
ORDER BY entry_count DESC;

-- Verify data integrity
SELECT 
    'Original position_specific_metrics rows' AS check_type,
    COUNT(*)::TEXT AS count
FROM position_specific_metrics
UNION ALL
SELECT 
    'Migrated metric_entries rows' AS check_type,
    COUNT(*)::TEXT AS count
FROM metric_entries me
JOIN metric_definitions md ON me.metric_definition_id = md.id
WHERE md.description ILIKE '%Migrated from position_specific_metrics%';

-- Check for any metrics that failed to migrate
SELECT DISTINCT 
    psm.metric_name,
    psm.metric_unit,
    COUNT(*) AS occurrence_count
FROM position_specific_metrics psm
LEFT JOIN metric_definitions md ON (
    md.code = LOWER(REGEXP_REPLACE(psm.metric_name, '[^a-zA-Z0-9]+', '_', 'g'))
)
WHERE md.id IS NULL
GROUP BY psm.metric_name, psm.metric_unit;

-- =============================================================================
-- STEP 4: Create View for Position-Specific Metrics (Legacy Compatibility)
-- =============================================================================

-- This view mimics the old position_specific_metrics structure
-- Use it for backward compatibility with existing queries

CREATE OR REPLACE VIEW v_position_specific_metrics_legacy AS
SELECT 
    me.id,
    me.player_id,
    me.workout_log_id,
    md.position_id,
    md.display_name AS metric_name,
    me.value AS metric_value,
    md.unit AS metric_unit,
    me.date,
    NULL::DECIMAL(10,2) AS weekly_total, -- Can be computed in application
    NULL::DECIMAL(10,2) AS monthly_total, -- Can be computed in application
    me.created_at,
    me.updated_at
FROM metric_entries me
JOIN metric_definitions md ON me.metric_definition_id = md.id;

-- Grant access to the view
GRANT SELECT ON v_position_specific_metrics_legacy TO authenticated;

-- =============================================================================
-- STEP 5: Optional - Archive Old Table
-- =============================================================================

-- After verifying migration is successful, you can archive the old table
-- DO NOT DROP until you're 100% confident the migration worked

-- Option A: Rename for archival (recommended)
-- ALTER TABLE position_specific_metrics RENAME TO position_specific_metrics_archived_20250129;

-- Option B: Create backup and drop (only after extensive testing)
-- CREATE TABLE position_specific_metrics_backup AS SELECT * FROM position_specific_metrics;
-- DROP TABLE position_specific_metrics;

-- =============================================================================
-- SUMMARY REPORT
-- =============================================================================

DO $$
DECLARE
    old_count INTEGER;
    new_count INTEGER;
    def_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO old_count FROM position_specific_metrics;
    SELECT COUNT(*) INTO new_count FROM metric_entries;
    SELECT COUNT(*) INTO def_count FROM metric_definitions 
    WHERE description ILIKE '%Migrated from position_specific_metrics%';
    
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'METRIC MIGRATION SUMMARY';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Original position_specific_metrics rows: %', old_count;
    RAISE NOTICE 'Metric definitions created: %', def_count;
    RAISE NOTICE 'Metric entries migrated: %', new_count;
    RAISE NOTICE '=============================================================================';
    
    IF new_count >= old_count THEN
        RAISE NOTICE '✅ Migration successful! All records migrated.';
    ELSIF new_count > old_count * 0.95 THEN
        RAISE NOTICE '⚠️  Migration mostly successful. % records migrated (% expected)', new_count, old_count;
        RAISE NOTICE '   Check verification queries for missing data.';
    ELSE
        RAISE NOTICE '❌ Migration incomplete! Only % of % records migrated.', new_count, old_count;
        RAISE NOTICE '   Review error logs and verification queries.';
    END IF;
    
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Review verification queries above';
    RAISE NOTICE '2. Test queries using metric_entries instead of position_specific_metrics';
    RAISE NOTICE '3. Update application code to use new metric system';
    RAISE NOTICE '4. For backward compatibility, use v_position_specific_metrics_legacy view';
    RAISE NOTICE '5. After confirming success, consider archiving old table';
    RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- NOTES
-- =============================================================================
/*
This migration:
1. Creates metric_definitions from unique metric_name values in position_specific_metrics
2. Migrates all metric data to metric_entries
3. Creates a legacy compatibility view
4. Provides comprehensive verification queries
5. Includes archival recommendations

After running this migration:

✅ DO:
- Test all metric-related queries
- Verify counts match expectations
- Update application code gradually
- Keep old table for at least 30 days

❌ DON'T:
- Drop the old table immediately
- Skip verification queries
- Assume 100% compatibility without testing

EXAMPLE QUERIES:

-- Old way (still works via view)
SELECT * FROM v_position_specific_metrics_legacy
WHERE player_id = $1;

-- New way (recommended)
SELECT 
    me.date,
    md.display_name,
    me.value,
    md.unit
FROM metric_entries me
JOIN metric_definitions md ON me.metric_definition_id = md.id
WHERE me.player_id = $1
ORDER BY me.date DESC;

-- Weekly aggregation (new system)
SELECT 
    date_trunc('week', me.date) AS week,
    md.display_name,
    CASE md.aggregation_method
        WHEN 'sum' THEN SUM(me.value)
        WHEN 'avg' THEN AVG(me.value)
        WHEN 'max' THEN MAX(me.value)
        WHEN 'min' THEN MIN(me.value)
    END AS aggregated_value,
    md.unit
FROM metric_entries me
JOIN metric_definitions md ON me.metric_definition_id = md.id
WHERE me.player_id = $1
GROUP BY week, md.display_name, md.aggregation_method, md.unit
ORDER BY week DESC;
*/


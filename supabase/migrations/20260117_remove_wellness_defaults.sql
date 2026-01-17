-- Migration: Remove hardcoded defaults from wellness sync trigger
-- 
-- CRITICAL FIX: The previous trigger used COALESCE(value, 3) which inserted
-- fake default values (3 for all metrics, 7.0 for sleep hours) when data was missing.
-- This corrupts ACWR and readiness calculations by treating missing data as real data.
--
-- NEW BEHAVIOR: NULL values are preserved to indicate missing data.
-- The frontend and backend calculation services handle NULL appropriately
-- with data quality indicators.

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS sync_wellness_entries_to_logs ON wellness_entries;
DROP FUNCTION IF EXISTS sync_wellness_entry_to_log();

-- Create improved function that preserves NULL values
CREATE OR REPLACE FUNCTION sync_wellness_entry_to_log()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update wellness_logs with data from wellness_entries
    -- IMPORTANT: Do NOT use COALESCE with default values - preserve NULLs
    -- NULL values indicate missing data and affect data quality scores
    INSERT INTO wellness_logs (
        athlete_id,
        user_id,
        log_date,
        fatigue,
        sleep_quality,
        soreness,
        mood,
        stress,
        energy,
        sleep_hours,
        created_at
    )
    VALUES (
        NEW.athlete_id,
        COALESCE(NEW.user_id, NEW.athlete_id), -- This COALESCE is OK - just ID fallback
        NEW.date,
        -- Map muscle_soreness to fatigue (inverted: low soreness = low fatigue)
        -- NO DEFAULT VALUES - preserve NULL to indicate missing data
        NEW.muscle_soreness,
        NEW.sleep_quality,
        NEW.muscle_soreness,
        NEW.mood,
        NEW.stress_level,
        NEW.energy_level,
        NEW.sleep_hours, -- Use actual value from wellness_entries, not hardcoded 7.0
        COALESCE(NEW.created_at, NOW()) -- Timestamp default is OK
    )
    ON CONFLICT (athlete_id, log_date)
    DO UPDATE SET
        user_id = EXCLUDED.user_id,
        fatigue = EXCLUDED.fatigue,
        sleep_quality = EXCLUDED.sleep_quality,
        soreness = EXCLUDED.soreness,
        mood = EXCLUDED.mood,
        stress = EXCLUDED.stress,
        energy = EXCLUDED.energy,
        sleep_hours = EXCLUDED.sleep_hours,
        created_at = EXCLUDED.created_at;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync on insert or update
CREATE TRIGGER sync_wellness_entries_to_logs
AFTER INSERT OR UPDATE ON wellness_entries
FOR EACH ROW
EXECUTE FUNCTION sync_wellness_entry_to_log();

-- Add comment explaining the fix
COMMENT ON FUNCTION sync_wellness_entry_to_log() IS 
'Syncs wellness_entries to wellness_logs WITHOUT inserting fake default values. 
NULL values are preserved to indicate missing data, which is handled by 
frontend services with data quality indicators. This ensures ACWR and 
readiness calculations are based on actual athlete-reported data only.';

-- NOTE: We do NOT backfill with defaults. Existing data with fake defaults
-- from the previous trigger should be audited and potentially cleaned up
-- by a separate data quality script.

-- Add sleep_hours column to wellness_entries if it doesn't exist
-- (so the trigger can use the actual value instead of hardcoded 7.0)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wellness_entries' 
        AND column_name = 'sleep_hours'
    ) THEN
        ALTER TABLE wellness_entries
        ADD COLUMN sleep_hours NUMERIC(4,2);
        
        COMMENT ON COLUMN wellness_entries.sleep_hours IS 
        'Actual sleep hours reported by athlete. NULL if not provided.';
    END IF;
END $$;

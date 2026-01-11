-- Migration: Sync wellness_entries to wellness_logs
-- This trigger ensures data flows from the frontend's wellness_entries table
-- to the backend's wellness_logs table that calc-readiness function expects.
--
-- Issue: Frontend writes to wellness_entries, backend reads from wellness_logs
-- Solution: Automatic sync via trigger

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS sync_wellness_entries_to_logs ON wellness_entries;
DROP FUNCTION IF EXISTS sync_wellness_entry_to_log();

-- Create function to sync wellness_entries -> wellness_logs
CREATE OR REPLACE FUNCTION sync_wellness_entry_to_log()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update wellness_logs with data from wellness_entries
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
        COALESCE(NEW.user_id, NEW.athlete_id), -- Use athlete_id if user_id is null
        NEW.date,
        -- Map muscle_soreness to fatigue (inverted: low soreness = low fatigue)
        COALESCE(NEW.muscle_soreness, 3),
        COALESCE(NEW.sleep_quality, 3),
        COALESCE(NEW.muscle_soreness, 3),
        COALESCE(NEW.mood, 3),
        COALESCE(NEW.stress_level, 3),
        COALESCE(NEW.energy_level, 3),
        7.0, -- Default sleep hours (wellness_entries doesn't have this field)
        COALESCE(NEW.created_at, NOW())
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

-- Add unique constraint to wellness_logs if not exists
-- This allows ON CONFLICT to work
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'wellness_logs_athlete_date_unique'
    ) THEN
        ALTER TABLE wellness_logs
        ADD CONSTRAINT wellness_logs_athlete_date_unique
        UNIQUE (athlete_id, log_date);
    END IF;
END $$;

-- Backfill existing wellness_entries data to wellness_logs
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
SELECT
    athlete_id,
    COALESCE(user_id, athlete_id),
    date,
    COALESCE(muscle_soreness, 3),
    COALESCE(sleep_quality, 3),
    COALESCE(muscle_soreness, 3),
    COALESCE(mood, 3),
    COALESCE(stress_level, 3),
    COALESCE(energy_level, 3),
    7.0,
    COALESCE(created_at, NOW())
FROM wellness_entries
ON CONFLICT (athlete_id, log_date)
DO UPDATE SET
    user_id = EXCLUDED.user_id,
    fatigue = EXCLUDED.fatigue,
    sleep_quality = EXCLUDED.sleep_quality,
    soreness = EXCLUDED.soreness,
    mood = EXCLUDED.mood,
    stress = EXCLUDED.stress,
    energy = EXCLUDED.energy,
    sleep_hours = EXCLUDED.sleep_hours;

-- Add comment explaining the sync
COMMENT ON FUNCTION sync_wellness_entry_to_log() IS 
'Automatically syncs wellness_entries (frontend) to wellness_logs (backend calc-readiness) to ensure data consistency';

COMMENT ON TRIGGER sync_wellness_entries_to_logs ON wellness_entries IS
'Keeps wellness_logs in sync with wellness_entries for backend readiness calculations';

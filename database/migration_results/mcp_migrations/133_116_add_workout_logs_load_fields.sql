-- ============================================================================
-- Migration 116: Add Load and External Metrics to workout_logs
-- ============================================================================
-- Purpose: Add calculated load (load_au) and external load metrics to workout_logs
--          so that LoadMonitoringService can persist complete training session data
-- Date: January 2026
-- Impact: Enables complete training load tracking without data loss
-- ============================================================================

-- Add load_au (calculated session load in Arbitrary Units)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_logs' AND column_name = 'load_au'
    ) THEN
        ALTER TABLE workout_logs 
        ADD COLUMN load_au INTEGER;
        COMMENT ON COLUMN workout_logs.load_au IS 'Calculated session load in Arbitrary Units (RPE × duration)';
    END IF;
END $$;

-- Add session_type for categorization
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_logs' AND column_name = 'session_type'
    ) THEN
        ALTER TABLE workout_logs 
        ADD COLUMN session_type VARCHAR(50);
        COMMENT ON COLUMN workout_logs.session_type IS 'Type of training session: game, sprint, technical, conditioning, strength, recovery';
    END IF;
END $$;

-- Add external_load_data for GPS/wearable metrics
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_logs' AND column_name = 'external_load_data'
    ) THEN
        ALTER TABLE workout_logs 
        ADD COLUMN external_load_data JSONB;
        COMMENT ON COLUMN workout_logs.external_load_data IS 'External load metrics from GPS/wearables: totalDistance, sprintDistance, playerLoad, etc.';
    END IF;
END $$;

-- Add wellness_data snapshot
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_logs' AND column_name = 'wellness_snapshot'
    ) THEN
        ALTER TABLE workout_logs 
        ADD COLUMN wellness_snapshot JSONB;
        COMMENT ON COLUMN workout_logs.wellness_snapshot IS 'Wellness metrics at time of session: sleepQuality, energyLevel, etc.';
    END IF;
END $$;

-- Add wellness_adjustment_factor
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_logs' AND column_name = 'wellness_adjustment_factor'
    ) THEN
        ALTER TABLE workout_logs 
        ADD COLUMN wellness_adjustment_factor DECIMAL(3,2);
        COMMENT ON COLUMN workout_logs.wellness_adjustment_factor IS 'Wellness-based load adjustment factor (0.8-1.3)';
    END IF;
END $$;

-- Add internal load metrics (for more detailed tracking)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_logs' AND column_name = 'avg_heart_rate'
    ) THEN
        ALTER TABLE workout_logs 
        ADD COLUMN avg_heart_rate INTEGER;
        COMMENT ON COLUMN workout_logs.avg_heart_rate IS 'Average heart rate during session (bpm)';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_logs' AND column_name = 'max_heart_rate'
    ) THEN
        ALTER TABLE workout_logs 
        ADD COLUMN max_heart_rate INTEGER;
        COMMENT ON COLUMN workout_logs.max_heart_rate IS 'Maximum heart rate during session (bpm)';
    END IF;
END $$;

-- Create index for load queries
CREATE INDEX IF NOT EXISTS idx_workout_logs_player_date_load
ON workout_logs(player_id, completed_at DESC, load_au)
WHERE load_au IS NOT NULL;

-- Create index for session type filtering
CREATE INDEX IF NOT EXISTS idx_workout_logs_session_type
ON workout_logs(player_id, session_type, completed_at DESC);

-- Update trigger for load calculation if missing
CREATE OR REPLACE FUNCTION calculate_workout_load_au()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate load_au from RPE and duration if not provided
    IF NEW.load_au IS NULL AND NEW.rpe IS NOT NULL AND NEW.duration_minutes IS NOT NULL THEN
        NEW.load_au := ROUND(NEW.rpe * NEW.duration_minutes);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then recreate
DROP TRIGGER IF EXISTS trigger_calculate_workout_load_au ON workout_logs;
CREATE TRIGGER trigger_calculate_workout_load_au
    BEFORE INSERT OR UPDATE ON workout_logs
    FOR EACH ROW
    EXECUTE FUNCTION calculate_workout_load_au();

COMMENT ON TABLE workout_logs IS 'Completed workout sessions with load metrics, external GPS/wearable data, and wellness adjustments';

-- Migration: Advanced UX Components Support
-- Adds support for Performance Dashboard, Training Builder, and Heatmap components
-- Created: 2024-01-XX

-- Ensure training_sessions table has all required fields for Training Builder
DO $$
BEGIN
    -- Add equipment field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_sessions' 
        AND column_name = 'equipment'
    ) THEN
        ALTER TABLE training_sessions 
        ADD COLUMN equipment TEXT[];
    END IF;

    -- Add goals field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_sessions' 
        AND column_name = 'goals'
    ) THEN
        ALTER TABLE training_sessions 
        ADD COLUMN goals TEXT[];
    END IF;

    -- Add exercises JSONB field for storing exercise details
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_sessions' 
        AND column_name = 'exercises'
    ) THEN
        ALTER TABLE training_sessions 
        ADD COLUMN exercises JSONB;
    END IF;

    -- Ensure completed_at exists (for status tracking)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_sessions' 
        AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE training_sessions 
        ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Update status to include 'planned' status
    -- Note: This is a comment - actual constraint update would require recreating the constraint
    -- ALTER TABLE training_sessions DROP CONSTRAINT IF EXISTS training_sessions_status_check;
    -- ALTER TABLE training_sessions ADD CONSTRAINT training_sessions_status_check 
    --   CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled'));
END $$;

-- Create index for performance metrics queries
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_completed 
ON training_sessions(user_id, completed_at DESC) 
WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_training_sessions_date_range 
ON training_sessions(user_id, session_date) 
WHERE session_date IS NOT NULL;

-- Create index for session type filtering
CREATE INDEX IF NOT EXISTS idx_training_sessions_type_status 
ON training_sessions(session_type, status) 
WHERE status IN ('planned', 'completed');

-- Performance metrics view for easier querying
CREATE OR REPLACE VIEW performance_metrics_summary AS
SELECT 
    user_id,
    session_type,
    COUNT(*) as total_sessions,
    AVG(duration_minutes) as avg_duration,
    AVG(intensity_level) as avg_intensity,
    AVG(performance_score) as avg_performance,
    MAX(session_date) as last_session_date,
    MIN(session_date) as first_session_date
FROM training_sessions
WHERE status = 'completed'
GROUP BY user_id, session_type;

-- Training load aggregation view for heatmap
CREATE OR REPLACE VIEW training_load_daily AS
SELECT 
    user_id,
    session_date,
    COUNT(*) as session_count,
    SUM(duration_minutes) as total_duration,
    AVG(intensity_level) as avg_intensity,
    MAX(intensity_level) as max_intensity,
    array_agg(DISTINCT session_type) as session_types
FROM training_sessions
WHERE status = 'completed' AND session_date IS NOT NULL
GROUP BY user_id, session_date;

-- Add comments for documentation
COMMENT ON COLUMN training_sessions.equipment IS 'Array of equipment used in the session (e.g., ["cones", "weights"])';
COMMENT ON COLUMN training_sessions.goals IS 'Array of training goals (e.g., ["speed", "agility"])';
COMMENT ON COLUMN training_sessions.exercises IS 'JSONB array of exercise details from Training Builder';
COMMENT ON COLUMN training_sessions.completed_at IS 'Timestamp when session was completed (null for planned sessions)';
COMMENT ON VIEW performance_metrics_summary IS 'Aggregated performance metrics by user and session type';
COMMENT ON VIEW training_load_daily IS 'Daily training load aggregation for heatmap visualization';


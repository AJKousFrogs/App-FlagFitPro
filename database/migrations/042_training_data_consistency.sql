-- =============================================================================
-- TRAINING DATA CONSISTENCY IMPROVEMENTS
-- Migration: 042_training_data_consistency.sql
-- Adds completed column and index for better date filtering and performance
-- =============================================================================

-- =============================================================================
-- 1. ADD COMPLETED COLUMN (OPTIONAL)
-- =============================================================================

DO $$
BEGIN
  -- Add completed boolean column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_sessions' AND column_name = 'completed'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN completed BOOLEAN DEFAULT true;
    COMMENT ON COLUMN training_sessions.completed IS 'Whether the training session has been completed. Defaults to true for backward compatibility.';
    
    -- Set default based on status if status column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'training_sessions' AND column_name = 'status'
    ) THEN
      UPDATE training_sessions 
      SET completed = CASE 
        WHEN status IN ('completed', 'done') THEN true
        WHEN status IN ('planned', 'scheduled', 'in_progress') THEN false
        ELSE true -- Default to completed for unknown statuses
      END
      WHERE completed IS NULL;
    END IF;
  END IF;
END $$;

-- =============================================================================
-- 2. ADD INDEX ON (user_id, session_date) FOR PERFORMANCE
-- =============================================================================

-- Index for filtering by user and date (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_date 
ON training_sessions(user_id, session_date DESC);

-- Index for date-only queries (when filtering to today)
CREATE INDEX IF NOT EXISTS idx_training_sessions_date 
ON training_sessions(session_date DESC);

-- Index for completed status filtering
CREATE INDEX IF NOT EXISTS idx_training_sessions_completed 
ON training_sessions(completed) 
WHERE completed = true;

-- Composite index for user + date + completed
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_date_completed 
ON training_sessions(user_id, session_date DESC, completed) 
WHERE completed = true;

-- =============================================================================
-- 3. CREATE DATABASE VIEW FOR COMPLETED SESSIONS
-- =============================================================================

CREATE OR REPLACE VIEW completed_training_sessions AS
SELECT 
  id,
  user_id,
  session_date,
  session_type,
  duration_minutes,
  rpe,
  intensity_level,
  status,
  completed,
  notes,
  created_at,
  updated_at
FROM training_sessions
WHERE (completed = true OR (completed IS NULL AND session_date <= CURRENT_DATE))
  AND session_date <= CURRENT_DATE;

COMMENT ON VIEW completed_training_sessions IS 'View of training sessions that are completed and up to and including today. Used for consistent statistics calculations.';

-- =============================================================================
-- 4. CREATE FUNCTION TO GET TODAY'S DATE (FOR CONSISTENCY)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_today_date()
RETURNS DATE
LANGUAGE sql
STABLE
AS $$
  SELECT CURRENT_DATE;
$$;

COMMENT ON FUNCTION get_today_date() IS 'Returns today''s date for consistent date filtering across queries';

-- =============================================================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE training_sessions IS 'Stores all training sessions. Use completed_training_sessions view for statistics that should only include completed sessions up to today.';
COMMENT ON COLUMN training_sessions.session_date IS 'Date of the training session. Sessions with date > CURRENT_DATE are considered future/planned sessions.';
COMMENT ON COLUMN training_sessions.completed IS 'Whether the session has been completed. Defaults to true. Future sessions should have completed = false.';

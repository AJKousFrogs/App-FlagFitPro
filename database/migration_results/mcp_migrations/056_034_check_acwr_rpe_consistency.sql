-- =============================================================================
-- ACWR & RPE CONSISTENCY CHECK
-- Migration: 034_check_acwr_rpe_consistency.sql
-- Verifies that all training session tables have proper RPE and duration fields
-- for ACWR calculations
-- =============================================================================

-- =============================================================================
-- 1. ENSURE training_sessions HAS RPE FIELD
-- =============================================================================

DO $$
BEGIN
  -- Add RPE column if it doesn't exist (from migration 033)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_sessions' AND column_name = 'rpe'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN rpe INTEGER CHECK (rpe BETWEEN 0 AND 10);
    COMMENT ON COLUMN training_sessions.rpe IS 'Rate of Perceived Exertion (0-10 scale) for session-RPE load calculation. Required for ACWR.';
  END IF;

  -- Add session_date if it doesn't exist (some versions might use date)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_sessions' AND column_name = 'session_date'
  ) THEN
    -- Check if 'date' column exists instead
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'training_sessions' AND column_name = 'date'
    ) THEN
      -- Rename date to session_date for consistency
      ALTER TABLE training_sessions RENAME COLUMN date TO session_date;
    ELSE
      -- Add session_date if neither exists
      ALTER TABLE training_sessions ADD COLUMN session_date DATE;
      -- Set default to created_at date if available
      UPDATE training_sessions 
      SET session_date = DATE(created_at) 
      WHERE session_date IS NULL;
    END IF;
  END IF;

  -- Ensure duration_minutes exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_sessions' AND column_name = 'duration_minutes'
  ) THEN
    -- Check for alternative duration field names
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'training_sessions' AND column_name = 'duration'
    ) THEN
      ALTER TABLE training_sessions RENAME COLUMN duration TO duration_minutes;
    ELSE
      ALTER TABLE training_sessions ADD COLUMN duration_minutes INTEGER;
    END IF;
  END IF;
END $$;

-- =============================================================================
-- 2. CREATE FUNCTION TO CALCULATE SESSION LOAD FROM ANY TABLE
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_session_load(
  rpe_value INTEGER,
  duration_value INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Session-RPE load = RPE × Duration (Foster et al. 2001)
  IF rpe_value IS NULL OR duration_value IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN COALESCE(rpe_value, 0) * COALESCE(duration_value, 0);
END;
$$;

COMMENT ON FUNCTION calculate_session_load IS 'Calculates session-RPE load (RPE × Duration) for ACWR calculations';

-- =============================================================================
-- 3. CREATE UNIFIED VIEW FOR TRAINING SESSIONS WITH LOAD
-- =============================================================================

CREATE OR REPLACE VIEW training_sessions_with_load AS
SELECT 
  id,
  COALESCE(user_id, athlete_id) as athlete_id,
  COALESCE(session_date, date) as session_date,
  session_type,
  duration_minutes,
  rpe,
  intensity_level,
  -- Calculate load: prefer rpe, fallback to intensity_level
  calculate_session_load(
    COALESCE(rpe, intensity_level),
    duration_minutes
  ) as training_load,
  'training_sessions' as source_table
FROM training_sessions
WHERE COALESCE(session_date, date) IS NOT NULL
  AND duration_minutes IS NOT NULL
  AND (rpe IS NOT NULL OR intensity_level IS NOT NULL)

UNION ALL

SELECT 
  id,
  athlete_id,
  date as session_date,
  NULL as session_type,
  duration_minutes,
  rpe,
  NULL as intensity_level,
  calculate_session_load(rpe, duration_minutes) as training_load,
  'sessions' as source_table
FROM sessions
WHERE date IS NOT NULL
  AND duration_minutes IS NOT NULL
  AND rpe IS NOT NULL

UNION ALL

SELECT 
  id,
  user_id as athlete_id,
  session_date,
  session_type,
  session_duration as duration_minutes,
  session_rpe as rpe,
  NULL as intensity_level,
  calculate_session_load(session_rpe, session_duration) as training_load,
  'training_load_metrics' as source_table
FROM training_load_metrics
WHERE session_date IS NOT NULL
  AND session_duration IS NOT NULL
  AND session_rpe IS NOT NULL;

COMMENT ON VIEW training_sessions_with_load IS 'Unified view of all training sessions with calculated session-RPE loads for ACWR calculations';

-- =============================================================================
-- 4. CREATE CONSISTENCY CHECK FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION check_acwr_data_consistency(athlete_uuid UUID DEFAULT NULL)
RETURNS TABLE (
  table_name TEXT,
  total_sessions BIGINT,
  sessions_with_rpe BIGINT,
  sessions_with_duration BIGINT,
  sessions_with_both BIGINT,
  sessions_with_load BIGINT,
  missing_rpe_count BIGINT,
  missing_duration_count BIGINT,
  avg_load NUMERIC,
  date_range_start DATE,
  date_range_end DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH training_sessions_stats AS (
    SELECT 
      'training_sessions'::TEXT as tbl,
      COUNT(*) as total,
      COUNT(rpe) as has_rpe,
      COUNT(duration_minutes) as has_duration,
      COUNT(CASE WHEN rpe IS NOT NULL AND duration_minutes IS NOT NULL THEN 1 END) as has_both,
      COUNT(CASE WHEN calculate_session_load(COALESCE(rpe, intensity_level), duration_minutes) IS NOT NULL THEN 1 END) as has_load,
      COUNT(CASE WHEN rpe IS NULL AND intensity_level IS NULL THEN 1 END) as missing_rpe,
      COUNT(CASE WHEN duration_minutes IS NULL THEN 1 END) as missing_duration,
      AVG(calculate_session_load(COALESCE(rpe, intensity_level), duration_minutes))::NUMERIC as avg_l,
      MIN(COALESCE(session_date, date))::DATE as start_date,
      MAX(COALESCE(session_date, date))::DATE as end_date
    FROM training_sessions
    WHERE (athlete_uuid IS NULL OR COALESCE(user_id, athlete_id) = athlete_uuid)
  ),
  sessions_stats AS (
    SELECT 
      'sessions'::TEXT as tbl,
      COUNT(*) as total,
      COUNT(rpe) as has_rpe,
      COUNT(duration_minutes) as has_duration,
      COUNT(CASE WHEN rpe IS NOT NULL AND duration_minutes IS NOT NULL THEN 1 END) as has_both,
      COUNT(CASE WHEN calculate_session_load(rpe, duration_minutes) IS NOT NULL THEN 1 END) as has_load,
      COUNT(CASE WHEN rpe IS NULL THEN 1 END) as missing_rpe,
      COUNT(CASE WHEN duration_minutes IS NULL THEN 1 END) as missing_duration,
      AVG(calculate_session_load(rpe, duration_minutes))::NUMERIC as avg_l,
      MIN(date)::DATE as start_date,
      MAX(date)::DATE as end_date
    FROM sessions
    WHERE (athlete_uuid IS NULL OR athlete_id = athlete_uuid)
  ),
  training_load_metrics_stats AS (
    SELECT 
      'training_load_metrics'::TEXT as tbl,
      COUNT(*) as total,
      COUNT(session_rpe) as has_rpe,
      COUNT(session_duration) as has_duration,
      COUNT(CASE WHEN session_rpe IS NOT NULL AND session_duration IS NOT NULL THEN 1 END) as has_both,
      COUNT(CASE WHEN calculate_session_load(session_rpe, session_duration) IS NOT NULL THEN 1 END) as has_load,
      COUNT(CASE WHEN session_rpe IS NULL THEN 1 END) as missing_rpe,
      COUNT(CASE WHEN session_duration IS NULL THEN 1 END) as missing_duration,
      AVG(calculate_session_load(session_rpe, session_duration))::NUMERIC as avg_l,
      MIN(session_date)::DATE as start_date,
      MAX(session_date)::DATE as end_date
    FROM training_load_metrics
    WHERE (athlete_uuid IS NULL OR user_id = athlete_uuid)
  )
  SELECT * FROM training_sessions_stats
  UNION ALL SELECT * FROM sessions_stats
  UNION ALL SELECT * FROM training_load_metrics_stats;
END;
$$;

COMMENT ON FUNCTION check_acwr_data_consistency IS 'Checks consistency of RPE and duration data across all training session tables for ACWR calculations';

-- =============================================================================
-- 5. CREATE FUNCTION TO FIX MISSING RPE FROM INTENSITY_LEVEL
-- =============================================================================

CREATE OR REPLACE FUNCTION sync_intensity_to_rpe()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Copy intensity_level to rpe where rpe is NULL
  -- This assumes intensity_level (1-10) maps directly to RPE (0-10)
  UPDATE training_sessions
  SET rpe = intensity_level
  WHERE rpe IS NULL 
    AND intensity_level IS NOT NULL
    AND intensity_level BETWEEN 1 AND 10;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;

COMMENT ON FUNCTION sync_intensity_to_rpe IS 'Copies intensity_level to rpe field where rpe is missing, assuming 1-10 scale maps directly';

-- =============================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index for ACWR calculations (date range queries)
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_date_rpe 
  ON training_sessions(COALESCE(user_id, athlete_id), COALESCE(session_date, date), rpe)
  WHERE rpe IS NOT NULL AND duration_minutes IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_athlete_date_rpe 
  ON sessions(athlete_id, date, rpe)
  WHERE rpe IS NOT NULL AND duration_minutes IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_training_load_metrics_user_date_rpe
  ON training_load_metrics(user_id, session_date, session_rpe)
  WHERE session_rpe IS NOT NULL AND session_duration IS NOT NULL;

-- =============================================================================
-- 7. CREATE VALIDATION CONSTRAINT
-- =============================================================================

-- Add check constraint to ensure training_load is calculated correctly
DO $$
BEGIN
  -- Add computed column or trigger to validate training_load
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_load_metrics' AND column_name = 'training_load_validated'
  ) THEN
    ALTER TABLE training_load_metrics ADD COLUMN training_load_validated BOOLEAN DEFAULT FALSE;
    
    -- Update existing records
    UPDATE training_load_metrics
    SET training_load_validated = (
      training_load = calculate_session_load(session_rpe, session_duration)
    )
    WHERE session_rpe IS NOT NULL AND session_duration IS NOT NULL;
  END IF;
END $$;

-- =============================================================================
-- 8. SUMMARY REPORT
-- =============================================================================

-- Create a summary view showing data quality
CREATE OR REPLACE VIEW acwr_data_quality_report AS
SELECT 
  'All Athletes' as scope,
  (SELECT COUNT(*) FROM training_sessions_with_load) as total_sessions,
  (SELECT COUNT(*) FROM training_sessions_with_load WHERE training_load IS NOT NULL) as sessions_with_load,
  (SELECT COUNT(*) FROM training_sessions_with_load WHERE training_load IS NULL) as sessions_missing_load,
  ROUND(
    100.0 * (SELECT COUNT(*) FROM training_sessions_with_load WHERE training_load IS NOT NULL)::NUMERIC /
    NULLIF((SELECT COUNT(*) FROM training_sessions_with_load), 0),
    2
  ) as data_completeness_percent,
  (SELECT AVG(training_load) FROM training_sessions_with_load WHERE training_load IS NOT NULL) as avg_load,
  (SELECT MIN(session_date) FROM training_sessions_with_load) as earliest_session,
  (SELECT MAX(session_date) FROM training_sessions_with_load) as latest_session;

COMMENT ON VIEW acwr_data_quality_report IS 'Summary report of data quality for ACWR calculations across all training session tables';


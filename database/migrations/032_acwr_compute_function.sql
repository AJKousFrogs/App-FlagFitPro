-- =============================================================================
-- ACWR COMPUTATION FUNCTION
-- Migration: 032_acwr_compute_function.sql
-- Computes ACWR (Acute:Chronic Workload Ratio) for any athlete using rolling averages
-- =============================================================================

-- Function to compute ACWR for an athlete
-- Updated to use unified view that includes all training session tables
CREATE OR REPLACE FUNCTION compute_acwr(athlete uuid)
RETURNS TABLE (
  session_date date,
  load numeric,
  acute_load numeric,
  chronic_load numeric,
  acwr numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Use unified view if it exists, otherwise fall back to sessions table
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_name = 'training_sessions_with_load'
  ) THEN
    RETURN QUERY
    SELECT
      tsl.session_date,
      COALESCE(tsl.training_load, 0)::numeric as load,
      (
        SELECT AVG(COALESCE(training_load, 0))
        FROM training_sessions_with_load
        WHERE athlete_id = athlete
          AND session_date BETWEEN tsl.session_date - INTERVAL '6 days' AND tsl.session_date
      )::numeric as acute_load,
      (
        SELECT AVG(COALESCE(training_load, 0))
        FROM training_sessions_with_load
        WHERE athlete_id = athlete
          AND session_date BETWEEN tsl.session_date - INTERVAL '27 days' AND tsl.session_date
      )::numeric as chronic_load,
      CASE
        WHEN (
          SELECT AVG(COALESCE(training_load, 0))
          FROM training_sessions_with_load
          WHERE athlete_id = athlete
            AND session_date BETWEEN tsl.session_date - INTERVAL '27 days' AND tsl.session_date
        ) = 0 THEN NULL
        ELSE (
          (
            SELECT AVG(COALESCE(training_load, 0))
            FROM training_sessions_with_load
            WHERE athlete_id = athlete
              AND session_date BETWEEN tsl.session_date - INTERVAL '6 days' AND tsl.session_date
          )::numeric
          /
          (
            SELECT AVG(COALESCE(training_load, 0))
            FROM training_sessions_with_load
            WHERE athlete_id = athlete
              AND session_date BETWEEN tsl.session_date - INTERVAL '27 days' AND tsl.session_date
          )::numeric
        )
      END as acwr
    FROM training_sessions_with_load tsl
    WHERE tsl.athlete_id = athlete
      AND tsl.training_load IS NOT NULL
    ORDER BY tsl.session_date DESC;
  ELSE
    -- Fallback to original sessions table implementation
    RETURN QUERY
    SELECT
      s.date as session_date,
      (COALESCE(s.rpe, 0) * COALESCE(s.duration_minutes, 0))::numeric as load,
      (
        SELECT AVG(COALESCE(rpe, 0) * COALESCE(duration_minutes, 0))
        FROM sessions
        WHERE athlete_id = athlete
          AND date BETWEEN s.date - INTERVAL '6 days' AND s.date
      )::numeric as acute_load,
      (
        SELECT AVG(COALESCE(rpe, 0) * COALESCE(duration_minutes, 0))
        FROM sessions
        WHERE athlete_id = athlete
          AND date BETWEEN s.date - INTERVAL '27 days' AND s.date
      )::numeric as chronic_load,
      CASE
        WHEN (
          SELECT AVG(COALESCE(rpe, 0) * COALESCE(duration_minutes, 0))
          FROM sessions
          WHERE athlete_id = athlete
            AND date BETWEEN s.date - INTERVAL '27 days' AND s.date
        ) = 0 THEN NULL
        ELSE (
          (
            SELECT AVG(COALESCE(rpe, 0) * COALESCE(duration_minutes, 0))
            FROM sessions
            WHERE athlete_id = athlete
              AND date BETWEEN s.date - INTERVAL '6 days' AND s.date
          )::numeric
          /
          (
            SELECT AVG(COALESCE(rpe, 0) * COALESCE(duration_minutes, 0))
            FROM sessions
            WHERE athlete_id = athlete
              AND date BETWEEN s.date - INTERVAL '27 days' AND s.date
          )::numeric
        )
      END as acwr
    FROM sessions s
    WHERE athlete_id = athlete
    ORDER BY s.date DESC;
  END IF;
END;
$$;

-- Comment
COMMENT ON FUNCTION compute_acwr IS 'Computes ACWR (Acute:Chronic Workload Ratio) for an athlete using rolling 7-day and 28-day averages. Uses unified training_sessions_with_load view if available, otherwise falls back to sessions table.';


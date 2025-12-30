-- =============================================================================
-- UNIFY ACWR LOGIC TO EWMA
-- Migration: 073_unify_acwr_ewma.sql
-- Updates compute_acwr to use Exponentially Weighted Moving Average (EWMA)
-- matching the frontend AcwrService logic for optimal injury prevention.
-- =============================================================================

-- Acute Lambda: 0.2 (7-day window)
-- Chronic Lambda: 0.05 (28-day window)

CREATE OR REPLACE FUNCTION compute_acwr_ewma(athlete uuid)
RETURNS TABLE (
  session_date date,
  load numeric,
  acute_load numeric,
  chronic_load numeric,
  acwr numeric
)
LANGUAGE plpgsql
AS $$
DECLARE
  acute_lambda numeric := 0.2;
  chronic_lambda numeric := 0.05;
BEGIN
  RETURN QUERY
  WITH RECURSIVE 
  -- 1. Get all daily loads, filling missing days with 0
  date_range AS (
    SELECT 
      MIN(COALESCE(tsl.session_date, tsl.date)) as start_date,
      MAX(COALESCE(tsl.session_date, tsl.date)) as end_date
    FROM (
      SELECT session_date, CAST(NULL AS date) as date FROM training_sessions WHERE athlete_id = athlete OR user_id = athlete
      UNION ALL
      SELECT CAST(NULL AS date), date FROM sessions WHERE athlete_id = athlete
    ) tsl
  ),
  all_days AS (
    SELECT generate_series(start_date, end_date, '1 day'::interval)::date as day
    FROM date_range
  ),
  daily_loads AS (
    SELECT 
      ad.day,
      COALESCE(SUM(l.load), 0)::numeric as load
    FROM all_days ad
    LEFT JOIN (
      SELECT session_date as date, (COALESCE(rpe, 0) * COALESCE(duration_minutes, 0)) as load FROM training_sessions WHERE athlete_id = athlete OR user_id = athlete
      UNION ALL
      SELECT date, (COALESCE(rpe, 0) * COALESCE(duration_minutes, 0)) as load FROM sessions WHERE athlete_id = athlete
    ) l ON ad.day = l.date
    GROUP BY ad.day
    ORDER BY ad.day ASC
  ),
  -- 2. Calculate EWMA recursively
  ewma_calc AS (
    -- Anchor member: first day
    (
      SELECT 
        day,
        load,
        load as acute_ewma,
        load as chronic_ewma,
        1 as row_num
      FROM daily_loads
      ORDER BY day ASC
      LIMIT 1
    )
    UNION ALL
    -- Recursive member
    SELECT 
      dl.day,
      dl.load,
      (acute_lambda * dl.load + (1 - acute_lambda) * ec.acute_ewma)::numeric,
      (chronic_lambda * dl.load + (1 - chronic_lambda) * ec.chronic_ewma)::numeric,
      ec.row_num + 1
    FROM daily_loads dl
    JOIN ewma_calc ec ON dl.day > ec.day
    WHERE dl.day = (SELECT day FROM daily_loads WHERE day > ec.day ORDER BY day ASC LIMIT 1)
  )
  SELECT 
    ec.day as session_date,
    ec.load,
    ec.acute_ewma as acute_load,
    ec.chronic_ewma as chronic_load,
    CASE 
      WHEN ec.chronic_ewma = 0 THEN 0 
      ELSE (ec.acute_ewma / ec.chronic_ewma)::numeric 
    END as acwr
  FROM ewma_calc ec
  ORDER BY ec.day DESC;
END;
$$;

-- Update the original function to point to the new logic
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
  RETURN QUERY SELECT * FROM compute_acwr_ewma(athlete);
END;
$$;

COMMENT ON FUNCTION compute_acwr IS 'Computes ACWR using EWMA (Exponentially Weighted Moving Average) to match the frontend logic. Acute Lambda: 0.2, Chronic Lambda: 0.05.';


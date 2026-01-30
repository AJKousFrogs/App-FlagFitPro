-- =============================================================================
-- Migration 047: Improve Function Security and Performance
-- =============================================================================
-- This migration adds:
-- 1. SECURITY INVOKER to respect RLS policies
-- 2. STABLE volatility for read-only functions (helps query optimizer)
-- 3. PARALLEL SAFE where applicable
-- =============================================================================

-- Function to calculate daily training load (RPE × Duration)
-- STABLE: Function only reads data, doesn't modify
-- SECURITY INVOKER: Respects RLS policies of the calling user
CREATE OR REPLACE FUNCTION calculate_daily_load(player_uuid UUID, log_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
PARALLEL SAFE
AS $$
DECLARE
  total_load INTEGER;
BEGIN
  SELECT COALESCE(SUM(rpe * duration_minutes), 0)
  INTO total_load
  FROM workout_logs
  WHERE player_id = player_uuid
    AND DATE(completed_at) = log_date;

  RETURN total_load;
END;
$$;

-- Function to calculate acute load (7-day rolling average)
CREATE OR REPLACE FUNCTION calculate_acute_load(player_uuid UUID, reference_date DATE)
RETURNS DECIMAL
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
PARALLEL SAFE
AS $$
DECLARE
  acute_load DECIMAL(10,2);
BEGIN
  SELECT COALESCE(AVG(daily_load), 0)
  INTO acute_load
  FROM load_monitoring
  WHERE player_id = player_uuid
    AND date >= reference_date - INTERVAL '6 days'
    AND date <= reference_date;

  RETURN acute_load;
END;
$$;

-- Function to calculate chronic load (28-day rolling average)
CREATE OR REPLACE FUNCTION calculate_chronic_load(player_uuid UUID, reference_date DATE)
RETURNS DECIMAL
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
PARALLEL SAFE
AS $$
DECLARE
  chronic_load DECIMAL(10,2);
BEGIN
  SELECT COALESCE(AVG(daily_load), 0)
  INTO chronic_load
  FROM load_monitoring
  WHERE player_id = player_uuid
    AND date >= reference_date - INTERVAL '27 days'
    AND date <= reference_date;

  RETURN chronic_load;
END;
$$;

-- Function to determine injury risk level based on ACWR
-- IMMUTABLE: Same input always produces same output (pure function)
CREATE OR REPLACE FUNCTION get_injury_risk_level(acwr_value DECIMAL)
RETURNS VARCHAR
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
AS $$
BEGIN
  IF acwr_value IS NULL OR acwr_value = 0 THEN
    RETURN 'Unknown';
  ELSIF acwr_value < 0.8 THEN
    RETURN 'Low'; -- Detraining risk
  ELSIF acwr_value >= 0.8 AND acwr_value <= 1.3 THEN
    RETURN 'Optimal'; -- Sweet spot
  ELSIF acwr_value > 1.3 AND acwr_value <= 1.5 THEN
    RETURN 'Moderate';
  ELSE
    RETURN 'High'; -- Increased injury risk
  END IF;
END;
$$;

-- Helper function for VARCHAR user_id columns (for legacy tables)
-- STABLE: Depends on session state but doesn't modify data
CREATE OR REPLACE FUNCTION auth.user_id_text()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT COALESCE(
    auth.uid()::text,
    current_setting('request.jwt.claims', true)::jsonb->>'sub'
  );
$$;

-- Standard UUID user ID function
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT COALESCE(
    auth.uid(),
    (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid
  );
$$;

-- =============================================================================
-- Add comments for documentation
-- =============================================================================
COMMENT ON FUNCTION calculate_daily_load(UUID, DATE) IS 
  'Calculates total training load for a player on a specific date (RPE × duration). Used for ACWR calculations.';

COMMENT ON FUNCTION calculate_acute_load(UUID, DATE) IS 
  'Calculates 7-day rolling average of daily load for acute workload ratio.';

COMMENT ON FUNCTION calculate_chronic_load(UUID, DATE) IS 
  'Calculates 28-day rolling average of daily load for chronic workload baseline.';

COMMENT ON FUNCTION get_injury_risk_level(DECIMAL) IS 
  'Maps ACWR value to injury risk category: Unknown, Low, Optimal, Moderate, High.';

COMMENT ON FUNCTION auth.user_id() IS 
  'Returns current authenticated user ID as UUID. Respects RLS policies.';

COMMENT ON FUNCTION auth.user_id_text() IS 
  'Returns current authenticated user ID as TEXT. For legacy VARCHAR columns.';

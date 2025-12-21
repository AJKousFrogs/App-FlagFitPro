-- =============================================================================
-- Migration: Fix ACWR Calculation with Baseline Checks
-- Version: 046
-- Date: 2025-01-21
-- Description: Implements safe ACWR calculation with baseline requirements
-- =============================================================================

-- =============================================================================
-- 0. ENSURE WORKOUT_LOGS TABLE EXISTS (REQUIRED FOR TRIGGER)
-- =============================================================================

-- Create workout_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  rpe DECIMAL(3,1) CHECK (rpe >= 1 AND rpe <= 10),
  duration_minutes INTEGER,
  notes TEXT,
  coach_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_logs_player ON workout_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON workout_logs(completed_at);

-- =============================================================================
-- 1. ENSURE LOAD_METRICS TABLE EXISTS WITH REQUIRED COLUMNS
-- =============================================================================

-- Create load_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS load_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  acute_7 DECIMAL(10,2) CHECK (acute_7 >= 0),
  chronic_28 DECIMAL(10,2) CHECK (chronic_28 >= 0),
  acwr DECIMAL(5,2) CHECK (acwr IS NULL OR acwr >= 0),
  risk_level VARCHAR(20) CHECK (risk_level IN ('baseline_building', 'baseline_low', 'low', 'optimal', 'moderate', 'high')),
  baseline_days INTEGER CHECK (baseline_days >= 0 AND baseline_days <= 28),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, date)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_load_metrics_player ON load_metrics(player_id);
CREATE INDEX IF NOT EXISTS idx_load_metrics_date ON load_metrics(date);
CREATE INDEX IF NOT EXISTS idx_load_metrics_acwr ON load_metrics(acwr) WHERE acwr IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_load_metrics_risk ON load_metrics(risk_level);
CREATE INDEX IF NOT EXISTS idx_load_metrics_player_date_range ON load_metrics(player_id, date);

-- =============================================================================
-- 2. UPDATE LOAD_MONITORING TABLE TO INCLUDE BASELINE_DAYS
-- =============================================================================

-- Ensure load_monitoring table exists first
CREATE TABLE IF NOT EXISTS load_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  daily_load INTEGER NOT NULL,
  acute_load DECIMAL(10,2),
  chronic_load DECIMAL(10,2),
  acwr DECIMAL(5,2),
  injury_risk_level VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, date)
);

-- Add baseline_days column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'load_monitoring' AND column_name = 'baseline_days'
  ) THEN
    ALTER TABLE load_monitoring ADD COLUMN baseline_days INTEGER CHECK (baseline_days >= 0 AND baseline_days <= 28);
  END IF;
END $$;

-- =============================================================================
-- 3. SAFE ACWR CALCULATION FUNCTION WITH BASELINE CHECKS
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_acwr_safe(
  player_uuid UUID,
  reference_date DATE
)
RETURNS TABLE (
  acwr DECIMAL(5,2),
  risk_level VARCHAR(20),
  baseline_days INTEGER,
  acute_7 DECIMAL(10,2),
  chronic_28 DECIMAL(10,2),
  daily_load INTEGER
) AS $$
DECLARE
  baseline_count INTEGER;
  acute_val DECIMAL(10,2);
  chronic_val DECIMAL(10,2);
  acwr_val DECIMAL(5,2);
  risk VARCHAR(20);
  daily_load_val INTEGER;
  MIN_CHRONIC_THRESHOLD CONSTANT DECIMAL := 50.0;
  MIN_BASELINE_DAYS CONSTANT INTEGER := 21;
BEGIN
  -- Count baseline days (days with load data in last 28 days)
  SELECT COUNT(*) INTO baseline_count
  FROM load_daily
  WHERE player_id = player_uuid
    AND date <= reference_date
    AND date > reference_date - INTERVAL '28 days';
  
  -- Calculate daily load for reference date
  SELECT COALESCE(SUM(rpe * duration_minutes), 0) INTO daily_load_val
  FROM workout_logs
  WHERE player_id = player_uuid
    AND DATE(completed_at) = reference_date;
  
  -- Calculate acute load (7-day rolling average)
  SELECT COALESCE(AVG(daily_load), 0) INTO acute_val
  FROM load_daily
  WHERE player_id = player_uuid
    AND date <= reference_date
    AND date > reference_date - INTERVAL '6 days';
  
  -- Calculate chronic load (28-day rolling average)
  SELECT COALESCE(AVG(daily_load), 0) INTO chronic_val
  FROM load_daily
  WHERE player_id = player_uuid
    AND date <= reference_date
    AND date > reference_date - INTERVAL '27 days';
  
  -- Determine risk level based on baseline and chronic load
  IF baseline_count < MIN_BASELINE_DAYS THEN
    -- Insufficient baseline (< 21 days)
    RETURN QUERY SELECT 
      NULL::DECIMAL(5,2) as acwr,
      'baseline_building'::VARCHAR(20) as risk_level,
      baseline_count as baseline_days,
      acute_val as acute_7,
      chronic_val as chronic_28,
      daily_load_val as daily_load;
  ELSIF chronic_val < MIN_CHRONIC_THRESHOLD THEN
    -- Baseline too low (< 50)
    RETURN QUERY SELECT 
      NULL::DECIMAL(5,2) as acwr,
      'baseline_low'::VARCHAR(20) as risk_level,
      baseline_count as baseline_days,
      acute_val as acute_7,
      chronic_val as chronic_28,
      daily_load_val as daily_load;
  ELSE
    -- Safe to calculate ACWR
    acwr_val := acute_val / chronic_val;
    risk := get_injury_risk_level_safe(acwr_val);
    
    RETURN QUERY SELECT 
      acwr_val as acwr,
      risk as risk_level,
      baseline_count as baseline_days,
      acute_val as acute_7,
      chronic_val as chronic_28,
      daily_load_val as daily_load;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. UPDATED RISK LEVEL FUNCTION (HANDLES BASELINE STATES)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_injury_risk_level_safe(acwr_value DECIMAL)
RETURNS VARCHAR AS $$
BEGIN
  IF acwr_value IS NULL THEN
    RETURN 'baseline_building';
  ELSIF acwr_value < 0.8 THEN
    RETURN 'low'; -- Detraining risk
  ELSIF acwr_value >= 0.8 AND acwr_value <= 1.3 THEN
    RETURN 'optimal'; -- Sweet spot
  ELSIF acwr_value > 1.3 AND acwr_value <= 1.5 THEN
    RETURN 'moderate';
  ELSE
    RETURN 'high'; -- Increased injury risk
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Keep old function for backward compatibility (deprecated)
CREATE OR REPLACE FUNCTION get_injury_risk_level(acwr_value DECIMAL)
RETURNS VARCHAR AS $$
BEGIN
  -- Map old risk levels to new ones
  IF acwr_value IS NULL OR acwr_value = 0 THEN
    RETURN 'Unknown';
  ELSIF acwr_value < 0.8 THEN
    RETURN 'Low';
  ELSIF acwr_value >= 0.8 AND acwr_value <= 1.3 THEN
    RETURN 'Optimal';
  ELSIF acwr_value > 1.3 AND acwr_value <= 1.5 THEN
    RETURN 'Moderate';
  ELSE
    RETURN 'High';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 5. ENSURE LOAD_DAILY TABLE EXISTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS load_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  daily_load INTEGER NOT NULL CHECK (daily_load >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, date)
);

CREATE INDEX IF NOT EXISTS idx_load_daily_player ON load_daily(player_id);
CREATE INDEX IF NOT EXISTS idx_load_daily_date ON load_daily(date);
CREATE INDEX IF NOT EXISTS idx_load_daily_player_date_range ON load_daily(player_id, date);

-- =============================================================================
-- 6. FUNCTION TO UPDATE LOAD_DAILY FROM WORKOUT_LOGS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_load_daily_for_date(
  player_uuid UUID,
  log_date DATE
)
RETURNS void AS $$
DECLARE
  total_load INTEGER;
BEGIN
  -- Calculate total daily load (RPE × Duration)
  SELECT COALESCE(SUM(rpe * duration_minutes), 0)
  INTO total_load
  FROM workout_logs
  WHERE player_id = player_uuid
    AND DATE(completed_at) = log_date;
  
  -- Insert or update load_daily
  INSERT INTO load_daily (player_id, date, daily_load)
  VALUES (player_uuid, log_date, total_load)
  ON CONFLICT (player_id, date)
  DO UPDATE SET
    daily_load = EXCLUDED.daily_load,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 7. UPDATED TRIGGER FUNCTION WITH BASELINE CHECKS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_load_monitoring()
RETURNS TRIGGER AS $$
DECLARE
  log_date DATE;
  acwr_result RECORD;
BEGIN
  log_date := DATE(NEW.completed_at);
  
  -- Update load_daily first
  PERFORM update_load_daily_for_date(NEW.player_id, log_date);
  
  -- Calculate ACWR with baseline checks
  SELECT * INTO acwr_result
  FROM calculate_acwr_safe(NEW.player_id, log_date);
  
  -- Update load_monitoring table
  INSERT INTO load_monitoring (
    player_id, 
    date, 
    daily_load, 
    acute_load, 
    chronic_load, 
    acwr, 
    injury_risk_level,
    baseline_days
  )
  VALUES (
    NEW.player_id,
    log_date,
    acwr_result.daily_load,
    acwr_result.acute_7,
    acwr_result.chronic_28,
    acwr_result.acwr,
    acwr_result.risk_level,
    acwr_result.baseline_days
  )
  ON CONFLICT (player_id, date)
  DO UPDATE SET
    daily_load = EXCLUDED.daily_load,
    acute_load = EXCLUDED.acute_load,
    chronic_load = EXCLUDED.chronic_load,
    acwr = EXCLUDED.acwr,
    injury_risk_level = EXCLUDED.injury_risk_level,
    baseline_days = EXCLUDED.baseline_days,
    updated_at = NOW();
  
  -- Also update load_metrics table (if using separate table)
  INSERT INTO load_metrics (
    player_id,
    date,
    acute_7,
    chronic_28,
    acwr,
    risk_level,
    baseline_days
  )
  VALUES (
    NEW.player_id,
    log_date,
    acwr_result.acute_7,
    acwr_result.chronic_28,
    acwr_result.acwr,
    acwr_result.risk_level,
    acwr_result.baseline_days
  )
  ON CONFLICT (player_id, date)
  DO UPDATE SET
    acute_7 = EXCLUDED.acute_7,
    chronic_28 = EXCLUDED.chronic_28,
    acwr = EXCLUDED.acwr,
    risk_level = EXCLUDED.risk_level,
    baseline_days = EXCLUDED.baseline_days,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 8. FUNCTION TO RECALCULATE LOAD METRICS FOR DATE RANGE
-- =============================================================================

CREATE OR REPLACE FUNCTION recalculate_load_metrics_range(
  player_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS void AS $$
DECLARE
  calc_date DATE;
  acwr_result RECORD;
BEGIN
  calc_date := start_date;
  
  WHILE calc_date <= end_date LOOP
    -- Update load_daily for this date
    PERFORM update_load_daily_for_date(player_uuid, calc_date);
    
    -- Calculate ACWR
    SELECT * INTO acwr_result
    FROM calculate_acwr_safe(player_uuid, calc_date);
    
    -- Update load_monitoring
    INSERT INTO load_monitoring (
      player_id,
      date,
      daily_load,
      acute_load,
      chronic_load,
      acwr,
      injury_risk_level,
      baseline_days
    )
    VALUES (
      player_uuid,
      calc_date,
      acwr_result.daily_load,
      acwr_result.acute_7,
      acwr_result.chronic_28,
      acwr_result.acwr,
      acwr_result.risk_level,
      acwr_result.baseline_days
    )
    ON CONFLICT (player_id, date)
    DO UPDATE SET
      daily_load = EXCLUDED.daily_load,
      acute_load = EXCLUDED.acute_load,
      chronic_load = EXCLUDED.chronic_load,
      acwr = EXCLUDED.acwr,
      injury_risk_level = EXCLUDED.injury_risk_level,
      baseline_days = EXCLUDED.baseline_days,
      updated_at = NOW();
    
    -- Update load_metrics
    INSERT INTO load_metrics (
      player_id,
      date,
      acute_7,
      chronic_28,
      acwr,
      risk_level,
      baseline_days
    )
    VALUES (
      player_uuid,
      calc_date,
      acwr_result.acute_7,
      acwr_result.chronic_28,
      acwr_result.acwr,
      acwr_result.risk_level,
      acwr_result.baseline_days
    )
    ON CONFLICT (player_id, date)
    DO UPDATE SET
      acute_7 = EXCLUDED.acute_7,
      chronic_28 = EXCLUDED.chronic_28,
      acwr = EXCLUDED.acwr,
      risk_level = EXCLUDED.risk_level,
      baseline_days = EXCLUDED.baseline_days,
      updated_at = NOW();
    
    calc_date := calc_date + INTERVAL '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 9. FUNCTION TO GET ACWR WITH BASELINE STATUS (FOR API USE)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_acwr_with_baseline(
  player_uuid UUID,
  reference_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  acwr DECIMAL(5,2),
  risk_level VARCHAR(20),
  baseline_days INTEGER,
  acute_7 DECIMAL(10,2),
  chronic_28 DECIMAL(10,2),
  daily_load INTEGER,
  baseline_status TEXT,
  message TEXT
) AS $$
DECLARE
  result RECORD;
  status_text TEXT;
  message_text TEXT;
BEGIN
  -- Get ACWR calculation
  SELECT * INTO result
  FROM calculate_acwr_safe(player_uuid, reference_date);
  
  -- Determine baseline status message
  IF result.baseline_days < 21 THEN
    status_text := 'building';
    message_text := format('Building baseline (%s/28 days). ACWR will be calculated once sufficient data is available.', result.baseline_days);
  ELSIF result.chronic_28 < 50 THEN
    status_text := 'low';
    message_text := format('Baseline load is low (%s). Consider gradually increasing training volume.', result.chronic_28);
  ELSIF result.acwr IS NULL THEN
    status_text := 'unknown';
    message_text := 'Unable to calculate ACWR. Please ensure you have logged training sessions.';
  ELSE
    status_text := 'ready';
    message_text := format('ACWR: %s (Risk: %s)', result.acwr, result.risk_level);
  END IF;
  
  RETURN QUERY SELECT
    result.acwr,
    result.risk_level,
    result.baseline_days,
    result.acute_7,
    result.chronic_28,
    result.daily_load,
    status_text::TEXT as baseline_status,
    message_text as message;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 10. UPDATE EXISTING LOAD_MONITORING RECORDS (BACKFILL)
-- =============================================================================

-- Function to backfill baseline_days for existing records
CREATE OR REPLACE FUNCTION backfill_baseline_days()
RETURNS void AS $$
DECLARE
  player_record RECORD;
  date_record RECORD;
  baseline_count INTEGER;
BEGIN
  -- For each player
  FOR player_record IN 
    SELECT DISTINCT player_id FROM load_monitoring
  LOOP
    -- For each date
    FOR date_record IN
      SELECT DISTINCT date FROM load_monitoring
      WHERE player_id = player_record.player_id
      ORDER BY date
    LOOP
      -- Count baseline days
      SELECT COUNT(*) INTO baseline_count
      FROM load_daily
      WHERE player_id = player_record.player_id
        AND date <= date_record.date
        AND date > date_record.date - INTERVAL '28 days';
      
      -- Update baseline_days
      UPDATE load_monitoring
      SET baseline_days = baseline_count
      WHERE player_id = player_record.player_id
        AND date = date_record.date;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- NOTES
-- =============================================================================
-- This migration implements safe ACWR calculation with baseline checks:
-- 
-- 1. Baseline Requirements:
--    - Minimum 21 days of data required for reliable ACWR
--    - Status: 'baseline_building' if < 21 days
--
-- 2. Chronic Load Threshold:
--    - Minimum chronic load of 50 required
--    - Status: 'baseline_low' if chronic < 50
--
-- 3. Safe ACWR Calculation:
--    - Only calculates ACWR when baseline is sufficient
--    - Returns NULL for ACWR when baseline insufficient
--    - Tracks baseline_days for UI display
--
-- 4. Risk Levels:
--    - baseline_building: < 21 days of data
--    - baseline_low: Chronic load < 50
--    - low: ACWR < 0.8
--    - optimal: ACWR 0.8-1.3
--    - moderate: ACWR 1.3-1.5
--    - high: ACWR > 1.5
--
-- 5. Functions:
--    - calculate_acwr_safe(): Main calculation with baseline checks
--    - get_acwr_with_baseline(): API-friendly function with status messages
--    - recalculate_load_metrics_range(): Recalculate for date range (for edits)
--
-- After running this migration:
-- 1. Run backfill_baseline_days() to update existing records
-- 2. Update frontend to display baseline status
-- 3. Test ACWR calculation with various data scenarios
-- =============================================================================


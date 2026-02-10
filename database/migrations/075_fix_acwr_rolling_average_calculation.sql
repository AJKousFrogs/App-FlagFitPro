-- =============================================================================
-- Migration 075: Fix ACWR Rolling Average Calculation
-- =============================================================================
-- 
-- BUG FIX: Rest days were not included in rolling averages
-- 
-- ISSUE:
-- The previous implementation used AVG(daily_load) which only averaged over
-- rows that exist in load_monitoring. Since rest days have no workout logs,
-- they had no rows, causing inflated averages.
--
-- EXAMPLE:
-- Player with 5 workouts in 7 days (total load = 2000 AU):
--   - Previous: AVG = 2000 / 5 = 400 AU (WRONG)
--   - Correct:  SUM / 7 = 2000 / 7 = 285.71 AU (RIGHT)
--
-- FIX:
-- Change from AVG(daily_load) to SUM(daily_load) / window_size
-- This ensures rest days (zero load) are properly accounted for.
--
-- IMPACT:
-- - Acute and chronic loads will be LOWER than before (correct behavior)
-- - ACWR ratios may change slightly
-- - Risk level classifications will be more accurate
--
-- REFERENCES:
-- - Gabbett (2016): Rolling averages should include all days in window
-- - docs/LOGIC_VALIDATION_DATASET.md: Validation dataset and expected values
-- =============================================================================

-- =============================================================================
-- PART 1: FIX ACUTE LOAD CALCULATION
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_acute_load(player_uuid UUID, reference_date DATE)
RETURNS DECIMAL AS $$
DECLARE
  total_load DECIMAL(10,2);
BEGIN
  -- Sum all daily loads in the 7-day window
  -- Rest days with no load_monitoring entry contribute 0 to the sum
  SELECT COALESCE(SUM(daily_load), 0)
  INTO total_load
  FROM load_monitoring
  WHERE player_id = player_uuid
    AND date >= reference_date - INTERVAL '6 days'
    AND date <= reference_date;

  -- Always divide by 7 (window size), not by count of rows
  -- This correctly accounts for rest days as zero load
  RETURN ROUND(total_load / 7.0, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION calculate_acute_load(UUID, DATE) IS 
  'Calculates 7-day rolling average of daily load for acute workload. 
   Uses SUM/7 to correctly include rest days (zero load) in the average.
   Fixed in migration 075 to address rest day exclusion bug.';

-- =============================================================================
-- PART 2: FIX CHRONIC LOAD CALCULATION
-- =============================================================================

-- Minimum chronic load floor (matches Angular: minChronicLoad: 50)
-- Prevents inflated ACWR ratios when chronic load is artificially low
-- (e.g., during return from injury or extended time off)
-- Reference: Gabbett (2016) - athletes returning from injury need protection

CREATE OR REPLACE FUNCTION calculate_chronic_load(player_uuid UUID, reference_date DATE)
RETURNS DECIMAL AS $$
DECLARE
  total_load DECIMAL(10,2);
  days_in_window INTEGER;
  calculated_chronic DECIMAL(10,2);
  MIN_CHRONIC_LOAD CONSTANT DECIMAL := 50.0;  -- Safety floor (matches Angular config)
BEGIN
  -- Sum all daily loads in the 28-day window
  SELECT COALESCE(SUM(daily_load), 0)
  INTO total_load
  FROM load_monitoring
  WHERE player_id = player_uuid
    AND date >= reference_date - INTERVAL '27 days'
    AND date <= reference_date;

  -- For chronic load, we need to handle the case where we have less than 28 days of data
  -- Count actual days since first workout (up to 28)
  SELECT LEAST(28, GREATEST(1, 
    EXTRACT(DAY FROM (reference_date - MIN(date) + INTERVAL '1 day'))::INTEGER
  ))
  INTO days_in_window
  FROM load_monitoring
  WHERE player_id = player_uuid
    AND date <= reference_date;

  -- If no data exists, return minimum floor
  IF days_in_window IS NULL OR days_in_window = 0 THEN
    RETURN MIN_CHRONIC_LOAD;
  END IF;

  -- Calculate chronic load
  calculated_chronic := ROUND(total_load / days_in_window, 2);

  -- Apply minimum chronic load floor safeguard
  -- This prevents inflated ACWR ratios when returning from injury/time off
  -- Example: Without floor, 100 acute / 10 chronic = 10.0 ACWR (dangerous false alarm)
  --          With floor,    100 acute / 50 chronic = 2.0 ACWR (still high, but realistic)
  RETURN GREATEST(calculated_chronic, MIN_CHRONIC_LOAD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION calculate_chronic_load(UUID, DATE) IS 
  'Calculates 28-day rolling average of daily load for chronic workload baseline.
   Uses SUM/window_size to correctly include rest days (zero load) in the average.
   Window size is the lesser of 28 days or days since first workout.
   Fixed in migration 075 to address rest day exclusion bug.';

-- =============================================================================
-- PART 3: UPDATE ACWR_SAFE FUNCTION WITH MINIMUM CHRONIC FLOOR
-- =============================================================================

-- Update calculate_acwr_safe to handle the minimum chronic load floor correctly
CREATE OR REPLACE FUNCTION calculate_acwr_safe(player_uuid UUID, reference_date DATE)
RETURNS TABLE (
    acwr DECIMAL(5,2),
    risk_level VARCHAR(20),
    baseline_days INTEGER
) AS $$
DECLARE
    days_of_data INTEGER;
    acute_load_val DECIMAL(10,2);
    chronic_load_val DECIMAL(10,2);
    acwr_val DECIMAL(5,2);
    risk VARCHAR(20);
    MIN_CHRONIC_LOAD CONSTANT DECIMAL := 50.0;  -- Must match calculate_chronic_load
BEGIN
    -- Count how many days of training data exist (up to 28)
    SELECT COUNT(DISTINCT date) INTO days_of_data
    FROM load_monitoring
    WHERE player_id = player_uuid
        AND date <= reference_date
        AND date >= reference_date - INTERVAL '27 days';

    -- Calculate loads (chronic already has floor applied)
    acute_load_val := calculate_acute_load(player_uuid, reference_date);
    chronic_load_val := calculate_chronic_load(player_uuid, reference_date);

    -- Determine risk based on baseline status
    IF days_of_data < 7 THEN
        -- Not enough data for acute window
        risk := 'baseline_building';
        acwr_val := NULL;
    ELSIF days_of_data < 21 THEN
        -- Building chronic baseline (21 days minimum per Gabbett)
        risk := 'baseline_building';
        -- Still calculate ACWR for reference, but flag as unreliable
        IF chronic_load_val > 0 THEN
            acwr_val := ROUND(acute_load_val / chronic_load_val, 2);
        ELSE
            acwr_val := NULL;
        END IF;
    ELSIF days_of_data < 28 THEN
        -- Have minimum chronic data, but not full window
        risk := 'baseline_low';
        IF chronic_load_val > 0 THEN
            acwr_val := ROUND(acute_load_val / chronic_load_val, 2);
            -- Override risk if ACWR indicates danger
            IF acwr_val > 1.5 THEN
                risk := 'High';
            ELSIF acwr_val > 1.3 THEN
                risk := 'Moderate';
            END IF;
        ELSE
            acwr_val := NULL;
        END IF;
    ELSE
        -- Full ACWR calculation with complete 28-day window
        IF chronic_load_val > 0 THEN
            acwr_val := ROUND(acute_load_val / chronic_load_val, 2);
            risk := get_injury_risk_level(acwr_val);
        ELSE
            -- This shouldn't happen with MIN_CHRONIC_LOAD floor, but handle gracefully
            acwr_val := NULL;
            risk := 'Unknown';
        END IF;
    END IF;

    RETURN QUERY SELECT acwr_val, risk, days_of_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION calculate_acwr_safe(UUID, DATE) IS
  'Calculates ACWR with baseline awareness and safety checks.
   - Returns NULL ACWR if < 7 days of data (building acute)
   - Returns baseline_building if < 21 days (building chronic)
   - Returns baseline_low if 21-27 days (partial chronic)
   - Returns full risk assessment at 28+ days
   - Chronic load has minimum floor of 50 AU to prevent inflated ratios
   Fixed in migration 075.';

-- =============================================================================
-- PART 4: UPDATE TRIGGER FUNCTION TO USE FIXED CALCULATIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_load_monitoring()
RETURNS TRIGGER AS $$
DECLARE
  log_date DATE;
  daily_load_value INTEGER;
  acute_load_value DECIMAL(10,2);
  chronic_load_value DECIMAL(10,2);
  acwr_value DECIMAL(5,2);
  risk_level VARCHAR(20);
  baseline_days_val INTEGER;
BEGIN
  log_date := DATE(NEW.completed_at);

  -- Calculate daily load (RPE × Duration)
  daily_load_value := calculate_daily_load(NEW.player_id, log_date);

  -- Insert/update load_monitoring record FIRST (so rolling averages include today)
  -- Note: calculate_daily_load already SUMs all workout_logs for the day,
  -- so we use EXCLUDED.daily_load to replace (not accumulate)
  INSERT INTO load_monitoring (player_id, date, daily_load, acute_load, chronic_load, acwr, injury_risk_level)
  VALUES (NEW.player_id, log_date, daily_load_value, 0, 0, NULL, 'Unknown')
  ON CONFLICT (player_id, date)
  DO UPDATE SET
    daily_load = EXCLUDED.daily_load,  -- Replace with recalculated sum from workout_logs
    updated_at = NOW();

  -- Now calculate acute and chronic loads (includes today's data)
  acute_load_value := calculate_acute_load(NEW.player_id, log_date);
  chronic_load_value := calculate_chronic_load(NEW.player_id, log_date);

  -- Calculate ACWR with baseline checks
  SELECT acwr, risk_level, baseline_days INTO acwr_value, risk_level, baseline_days_val
  FROM calculate_acwr_safe(NEW.player_id, log_date);

  -- Update the load monitoring record with calculated values
  UPDATE load_monitoring
  SET 
    acute_load = acute_load_value,
    chronic_load = chronic_load_value,
    acwr = acwr_value,
    injury_risk_level = risk_level,
    baseline_days = baseline_days_val,
    updated_at = NOW()
  WHERE player_id = NEW.player_id AND date = log_date;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PART 5: RECALCULATE EXISTING DATA (Optional - Run manually if needed)
-- =============================================================================

-- This function can be called to recalculate all load monitoring data
-- after the fix is applied. Run manually if historical data needs correction.

CREATE OR REPLACE FUNCTION recalculate_all_load_monitoring()
RETURNS TABLE(
  player_id UUID,
  records_updated INTEGER
) AS $$
DECLARE
  player_rec RECORD;
  date_rec RECORD;
  updated_count INTEGER;
  acute_val DECIMAL(10,2);
  chronic_val DECIMAL(10,2);
  acwr_val DECIMAL(5,2);
  risk_val VARCHAR(20);
BEGIN
  FOR player_rec IN 
    SELECT DISTINCT lm.player_id 
    FROM load_monitoring lm
  LOOP
    updated_count := 0;
    
    FOR date_rec IN
      SELECT DISTINCT lm.date
      FROM load_monitoring lm
      WHERE lm.player_id = player_rec.player_id
      ORDER BY lm.date
    LOOP
      -- Recalculate values
      acute_val := calculate_acute_load(player_rec.player_id, date_rec.date);
      chronic_val := calculate_chronic_load(player_rec.player_id, date_rec.date);
      
      IF chronic_val > 0 THEN
        acwr_val := ROUND(acute_val / chronic_val, 2);
        risk_val := get_injury_risk_level(acwr_val);
      ELSE
        acwr_val := NULL;
        risk_val := 'Unknown';
      END IF;
      
      -- Update record
      UPDATE load_monitoring lm
      SET 
        acute_load = acute_val,
        chronic_load = chronic_val,
        acwr = acwr_val,
        injury_risk_level = risk_val,
        updated_at = NOW()
      WHERE lm.player_id = player_rec.player_id 
        AND lm.date = date_rec.date;
      
      updated_count := updated_count + 1;
    END LOOP;
    
    player_id := player_rec.player_id;
    records_updated := updated_count;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION recalculate_all_load_monitoring() IS
  'Recalculates all load monitoring records using the fixed acute/chronic load formulas.
   Run this after migration 075 to correct historical data.
   Returns count of records updated per player.';

-- =============================================================================
-- PART 6: VERIFICATION QUERY
-- =============================================================================

-- Run this to verify the fix is working correctly
-- SELECT 
--   'Acute Load Function' AS check_name,
--   CASE 
--     WHEN pg_get_functiondef('calculate_acute_load'::regproc) LIKE '%SUM(daily_load)%'
--     THEN 'PASS - Uses SUM'
--     ELSE 'FAIL - Still uses AVG'
--   END AS status;

-- =============================================================================
-- PART 7: NOTES
-- =============================================================================
/*
MIGRATION 075 - Fix ACWR Rolling Average Calculation

BUGS FIXED:

1. REST DAYS EXCLUDED (Critical)
   BEFORE: calculate_acute_load used AVG(daily_load) 
           Rest days had no rows in load_monitoring
           AVG only divided by days WITH workouts
           Result: Inflated load values
   
   AFTER:  calculate_acute_load uses SUM(daily_load) / 7
           Rest days contribute 0 to the sum
           Division is always by window size (7 or 28)
           Result: Correct load values per Gabbett (2016)

2. MINIMUM CHRONIC LOAD FLOOR (Safety)
   BEFORE: No floor - returning athletes could have very low chronic load
           causing inflated ACWR (e.g., 100/10 = 10.0 ACWR)
   
   AFTER:  Minimum chronic load of 50 AU enforced
           Prevents false danger alerts during return-to-play
           Matches Angular service configuration

3. BASELINE AWARENESS (Improved)
   BEFORE: Used 28 days as threshold for "full" ACWR
   
   AFTER:  Uses 21 days (Gabbett minimum) for chronic baseline
           More accurate data state transitions

ROLLBACK:
To rollback this migration, restore the previous AVG-based functions from
migration 069_prerequisites_check_and_setup.sql

TESTING:
Run the regression test at tests/logic/acwr-regression.test.js to verify
the fix produces expected values from the synthetic dataset.

npm run test:acwr
*/

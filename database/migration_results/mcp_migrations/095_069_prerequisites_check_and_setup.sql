-- =============================================================================
-- PREREQUISITES CHECK AND SETUP - Migration 069
-- =============================================================================
-- This migration ensures all base tables exist before the comprehensive refactor
-- Run this BEFORE migration 070
-- =============================================================================

-- =============================================================================
-- PART 1: CREATE MISSING BASE TABLES (if they don't exist)
-- =============================================================================

-- PLAYER PROGRAMS TABLE (from migration 066)
CREATE TABLE IF NOT EXISTS player_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    program_id UUID REFERENCES training_programs(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    compliance_rate DECIMAL(5,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, program_id, start_date)
);

-- POSITION SPECIFIC METRICS TABLE (from migration 066)
CREATE TABLE IF NOT EXISTS position_specific_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE,
    position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_unit VARCHAR(50),
    date DATE NOT NULL,
    weekly_total DECIMAL(10,2),
    monthly_total DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXERCISE LOGS TABLE (from migration 066)
CREATE TABLE IF NOT EXISTS exercise_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE,
    session_exercise_id UUID REFERENCES session_exercises(id) ON DELETE SET NULL,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    sets_completed INTEGER,
    reps_completed INTEGER,
    weight_used DECIMAL(10,2),
    distance_completed INTEGER,
    time_completed INTEGER,
    performance_metrics JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PART 2: ENSURE ACWR FUNCTIONS EXIST
-- =============================================================================

-- Function to calculate daily training load (RPE × Duration)
CREATE OR REPLACE FUNCTION calculate_daily_load(player_uuid UUID, log_date DATE)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate acute load (7-day rolling average)
CREATE OR REPLACE FUNCTION calculate_acute_load(player_uuid UUID, reference_date DATE)
RETURNS DECIMAL AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate chronic load (28-day rolling average)
CREATE OR REPLACE FUNCTION calculate_chronic_load(player_uuid UUID, reference_date DATE)
RETURNS DECIMAL AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to determine injury risk level based on ACWR
CREATE OR REPLACE FUNCTION get_injury_risk_level(acwr_value DECIMAL)
RETURNS VARCHAR AS $$
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
$$ LANGUAGE plpgsql IMMUTABLE;

-- Safe ACWR calculation with baseline awareness (from migration 046)
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
BEGIN
    -- Count how many days of training data exist (up to 28)
    SELECT COUNT(DISTINCT date) INTO days_of_data
    FROM load_monitoring
    WHERE player_id = player_uuid
        AND date <= reference_date
        AND date >= reference_date - INTERVAL '27 days';

    -- Calculate loads
    acute_load_val := calculate_acute_load(player_uuid, reference_date);
    chronic_load_val := calculate_chronic_load(player_uuid, reference_date);

    -- Determine risk based on baseline status
    IF days_of_data < 7 THEN
        risk := 'baseline_building';
        acwr_val := NULL;
    ELSIF days_of_data < 28 THEN
        risk := 'baseline_low';
        IF chronic_load_val > 0 THEN
            acwr_val := acute_load_val / chronic_load_val;
        ELSE
            acwr_val := NULL;
        END IF;
    ELSE
        -- Full ACWR calculation
        IF chronic_load_val > 0 THEN
            acwr_val := acute_load_val / chronic_load_val;
            risk := get_injury_risk_level(acwr_val);
        ELSE
            acwr_val := NULL;
            risk := 'Unknown';
        END IF;
    END IF;

    RETURN QUERY SELECT acwr_val, risk, days_of_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PART 3: ENSURE ACWR TRIGGER EXISTS
-- =============================================================================

-- Trigger function to update load monitoring when workout is logged
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

  -- Calculate daily load
  daily_load_value := calculate_daily_load(NEW.player_id, log_date);

  -- Calculate acute and chronic loads
  acute_load_value := calculate_acute_load(NEW.player_id, log_date);
  chronic_load_value := calculate_chronic_load(NEW.player_id, log_date);

  -- Calculate ACWR with baseline checks
  SELECT acwr, risk_level, baseline_days INTO acwr_value, risk_level, baseline_days_val
  FROM calculate_acwr_safe(NEW.player_id, log_date);

  -- Insert or update load monitoring record
  INSERT INTO load_monitoring (player_id, date, daily_load, acute_load, chronic_load, acwr, injury_risk_level, baseline_days)
  VALUES (NEW.player_id, log_date, daily_load_value, acute_load_value, chronic_load_value, acwr_value, risk_level, baseline_days_val)
  ON CONFLICT (player_id, date)
  DO UPDATE SET
    daily_load = EXCLUDED.daily_load,
    acute_load = EXCLUDED.acute_load,
    chronic_load = EXCLUDED.chronic_load,
    acwr = EXCLUDED.acwr,
    injury_risk_level = EXCLUDED.injury_risk_level,
    baseline_days = COALESCE(EXCLUDED.baseline_days, load_monitoring.baseline_days),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger to ensure it's active
DROP TRIGGER IF EXISTS trigger_update_load_monitoring ON workout_logs;
CREATE TRIGGER trigger_update_load_monitoring
AFTER INSERT OR UPDATE ON workout_logs
FOR EACH ROW
EXECUTE FUNCTION update_load_monitoring();

-- =============================================================================
-- PART 4: CREATE INDEXES FOR BASE TABLES
-- =============================================================================

-- Player programs indexes
CREATE INDEX IF NOT EXISTS idx_player_programs_player ON player_programs(player_id);
CREATE INDEX IF NOT EXISTS idx_player_programs_program ON player_programs(program_id);
CREATE INDEX IF NOT EXISTS idx_player_programs_active ON player_programs(is_active);

-- Position metrics indexes
CREATE INDEX IF NOT EXISTS idx_position_metrics_player ON position_specific_metrics(player_id);
CREATE INDEX IF NOT EXISTS idx_position_metrics_date ON position_specific_metrics(date);
CREATE INDEX IF NOT EXISTS idx_position_metrics_position ON position_specific_metrics(position_id);

-- Exercise logs indexes
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout ON exercise_logs(workout_log_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_exercise ON exercise_logs(exercise_id);

-- =============================================================================
-- PART 5: ENABLE RLS ON MISSING TABLES
-- =============================================================================

ALTER TABLE player_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_specific_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

-- Player Programs Policies
DROP POLICY IF EXISTS "Players can view their own programs" ON player_programs;
CREATE POLICY "Players can view their own programs"
ON player_programs FOR SELECT
USING ((SELECT auth.uid()) = player_id);

DROP POLICY IF EXISTS "Coaches can view all programs" ON player_programs;
CREATE POLICY "Coaches can view all programs"
ON player_programs FOR SELECT
USING ((SELECT (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') IN ('coach', 'admin'));

DROP POLICY IF EXISTS "Coaches can manage programs" ON player_programs;
CREATE POLICY "Coaches can manage programs"
ON player_programs FOR ALL
USING ((SELECT (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') IN ('coach', 'admin'));

-- Position Specific Metrics Policies
DROP POLICY IF EXISTS "Players can view own metrics" ON position_specific_metrics;
CREATE POLICY "Players can view own metrics"
ON position_specific_metrics FOR SELECT
USING ((SELECT auth.uid()) = player_id);

DROP POLICY IF EXISTS "Coaches can view all metrics" ON position_specific_metrics;
CREATE POLICY "Coaches can view all metrics"
ON position_specific_metrics FOR SELECT
USING ((SELECT (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') IN ('coach', 'admin'));

DROP POLICY IF EXISTS "Players can insert own metrics" ON position_specific_metrics;
CREATE POLICY "Players can insert own metrics"
ON position_specific_metrics FOR INSERT
WITH CHECK ((SELECT auth.uid()) = player_id);

-- Exercise Logs Policies
DROP POLICY IF EXISTS "Players can view own exercise logs" ON exercise_logs;
CREATE POLICY "Players can view own exercise logs"
ON exercise_logs FOR SELECT
USING (
    workout_log_id IN (
        SELECT id FROM workout_logs WHERE player_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS "Coaches can view all exercise logs" ON exercise_logs;
CREATE POLICY "Coaches can view all exercise logs"
ON exercise_logs FOR SELECT
USING ((SELECT (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') IN ('coach', 'admin'));

DROP POLICY IF EXISTS "Players can insert own exercise logs" ON exercise_logs;
CREATE POLICY "Players can insert own exercise logs"
ON exercise_logs FOR INSERT
WITH CHECK (
    workout_log_id IN (
        SELECT id FROM workout_logs WHERE player_id = (SELECT auth.uid())
    )
);

-- =============================================================================
-- PART 6: VERIFICATION QUERY
-- =============================================================================

-- Verify all prerequisites are in place
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Check tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_name IN ('player_programs', 'position_specific_metrics', 'exercise_logs')
    AND table_schema = 'public';

    -- Check functions
    SELECT COUNT(*) INTO function_count
    FROM pg_proc
    WHERE proname IN ('calculate_daily_load', 'calculate_acute_load', 'calculate_chronic_load', 'calculate_acwr_safe', 'get_injury_risk_level');

    -- Check trigger
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname = 'trigger_update_load_monitoring';

    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'PREREQUISITES CHECK - Migration 069';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Tables created: % of 3 (player_programs, position_specific_metrics, exercise_logs)', table_count;
    RAISE NOTICE 'ACWR functions: % of 5', function_count;
    RAISE NOTICE 'ACWR trigger: % (should be 1)', trigger_count;
    RAISE NOTICE '=============================================================================';
    
    IF table_count = 3 AND function_count = 5 AND trigger_count = 1 THEN
        RAISE NOTICE '✅ All prerequisites are in place. Safe to run migration 070.';
    ELSE
        RAISE WARNING '⚠️  Some prerequisites are missing. Check the output above.';
    END IF;
    
    RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- NOTES
-- =============================================================================
/*
This migration ensures all base infrastructure is in place before the comprehensive refactor.

WHAT IT CREATES:
1. player_programs table (if missing)
2. position_specific_metrics table (if missing)
3. exercise_logs table (if missing)
4. All ACWR functions (5 functions)
5. ACWR trigger on workout_logs
6. Indexes for performance
7. RLS policies for security

WHY THIS IS NEEDED:
Migration 070 assumes these tables exist because it:
- Adds columns to player_programs
- Migrates data from position_specific_metrics
- References exercise_logs in documentation
- Enhances ACWR functions with versioning

RUN ORDER:
1. Migration 069 (this file) - Creates base tables + ACWR system
2. Migration 070 - Comprehensive refactor
3. Migration 071 - Populate exercise registry
4. Migration 072 - Backfill metrics

SAFETY:
- All operations use IF NOT EXISTS or CREATE OR REPLACE
- Safe to run multiple times
- Won't overwrite existing data
*/


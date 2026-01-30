-- =============================================================================
-- DEPLOY MISSING TABLES AND ACWR FUNCTIONS
-- Migration 066: Complete the training database infrastructure
-- =============================================================================
-- This migration creates:
-- 1. Missing tables: player_programs, position_specific_metrics, exercise_logs
-- 2. ACWR calculation functions
-- 3. ACWR auto-update trigger
-- =============================================================================

-- =============================================================================
-- 1. MISSING TABLES
-- =============================================================================

-- PLAYER PROGRAMS TABLE (Assign Programs to Players)
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

-- POSITION SPECIFIC METRICS TABLE
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

-- EXERCISE LOGS TABLE (Individual Exercise Performance)
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
-- 2. INDEXES FOR NEW TABLES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_player_programs_player ON player_programs(player_id);
CREATE INDEX IF NOT EXISTS idx_player_programs_program ON player_programs(program_id);
CREATE INDEX IF NOT EXISTS idx_player_programs_active ON player_programs(is_active);

CREATE INDEX IF NOT EXISTS idx_position_metrics_player ON position_specific_metrics(player_id);
CREATE INDEX IF NOT EXISTS idx_position_metrics_date ON position_specific_metrics(date);
CREATE INDEX IF NOT EXISTS idx_position_metrics_position ON position_specific_metrics(position_id);
CREATE INDEX IF NOT EXISTS idx_position_metrics_name ON position_specific_metrics(metric_name);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout ON exercise_logs(workout_log_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_exercise ON exercise_logs(exercise_id);

-- =============================================================================
-- 3. ENABLE RLS ON NEW TABLES
-- =============================================================================

ALTER TABLE player_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_specific_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

-- Player Programs Policies
CREATE POLICY "Players can view their own program assignments"
ON player_programs FOR SELECT
USING (player_id = auth.uid());

CREATE POLICY "Coaches can view all program assignments"
ON player_programs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = auth.uid() AND role IN ('coach', 'admin')
    )
);

CREATE POLICY "Coaches can manage program assignments"
ON player_programs FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = auth.uid() AND role IN ('coach', 'admin')
    )
);

-- Position Specific Metrics Policies
CREATE POLICY "Players can view their own metrics"
ON position_specific_metrics FOR SELECT
USING (player_id = auth.uid());

CREATE POLICY "Players can manage their own metrics"
ON position_specific_metrics FOR ALL
USING (player_id = auth.uid());

CREATE POLICY "Coaches can view team metrics"
ON position_specific_metrics FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = auth.uid() AND role IN ('coach', 'admin')
    )
);

-- Exercise Logs Policies
CREATE POLICY "Players can view their own exercise logs"
ON exercise_logs FOR SELECT
USING (
    workout_log_id IN (
        SELECT id FROM workout_logs WHERE player_id = auth.uid()
    )
);

CREATE POLICY "Players can manage their own exercise logs"
ON exercise_logs FOR ALL
USING (
    workout_log_id IN (
        SELECT id FROM workout_logs WHERE player_id = auth.uid()
    )
);

CREATE POLICY "Coaches can view team exercise logs"
ON exercise_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = auth.uid() AND role IN ('coach', 'admin')
    )
);

-- =============================================================================
-- 4. ACWR CALCULATION FUNCTIONS
-- =============================================================================

-- Function to calculate daily training load (RPE × Duration)
CREATE OR REPLACE FUNCTION calculate_daily_load(player_uuid UUID, log_date DATE)
RETURNS INTEGER AS $$
DECLARE
    total_load INTEGER;
BEGIN
    SELECT COALESCE(SUM(rpe * duration_minutes), 0)::INTEGER
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

-- =============================================================================
-- 5. ACWR AUTO-UPDATE TRIGGER
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
BEGIN
    log_date := DATE(NEW.completed_at);

    -- Calculate daily load
    daily_load_value := calculate_daily_load(NEW.player_id, log_date);

    -- Insert/update load_monitoring record first (so rolling averages include today)
    INSERT INTO load_monitoring (player_id, date, daily_load, acute_load, chronic_load, acwr, injury_risk_level)
    VALUES (NEW.player_id, log_date, daily_load_value, 0, 0, NULL, 'Unknown')
    ON CONFLICT (player_id, date)
    DO UPDATE SET
        daily_load = EXCLUDED.daily_load,
        updated_at = NOW();

    -- Calculate acute and chronic loads (now includes today's data)
    acute_load_value := calculate_acute_load(NEW.player_id, log_date);
    chronic_load_value := calculate_chronic_load(NEW.player_id, log_date);

    -- Calculate ACWR
    IF chronic_load_value > 0 THEN
        acwr_value := acute_load_value / chronic_load_value;
    ELSE
        acwr_value := NULL;
    END IF;

    -- Determine injury risk level
    risk_level := get_injury_risk_level(acwr_value);

    -- Update with calculated values
    UPDATE load_monitoring
    SET acute_load = acute_load_value,
        chronic_load = chronic_load_value,
        acwr = acwr_value,
        injury_risk_level = risk_level,
        updated_at = NOW()
    WHERE player_id = NEW.player_id AND date = log_date;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_update_load_monitoring ON workout_logs;

CREATE TRIGGER trigger_update_load_monitoring
AFTER INSERT OR UPDATE ON workout_logs
FOR EACH ROW
EXECUTE FUNCTION update_load_monitoring();

-- =============================================================================
-- 6. GRANT PERMISSIONS
-- =============================================================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION calculate_daily_load(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_acute_load(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_chronic_load(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_injury_risk_level(DECIMAL) TO authenticated;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- Run these queries to verify the migration:
--
-- Check tables exist:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('player_programs', 'position_specific_metrics', 'exercise_logs');
--
-- Check functions exist:
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('calculate_daily_load', 'calculate_acute_load', 'calculate_chronic_load', 'get_injury_risk_level');
--
-- Check trigger exists:
-- SELECT trigger_name FROM information_schema.triggers 
-- WHERE trigger_name = 'trigger_update_load_monitoring';

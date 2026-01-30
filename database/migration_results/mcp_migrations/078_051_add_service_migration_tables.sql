-- Migration: Add Tables for Supabase Direct Service Integration
-- Creates tables needed for wellness, recovery, nutrition, and performance tracking services
-- Created: 2024-12-23
-- Purpose: Support direct Supabase queries from Angular services (migration from Netlify Functions)

-- ============================================================================
-- WELLNESS ENTRIES TABLE
-- ============================================================================
-- Enhanced wellness tracking with proper column naming for Angular service
CREATE TABLE IF NOT EXISTS wellness_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Wellness metrics (0-10 scale)
    sleep_quality INTEGER CHECK (sleep_quality >= 0 AND sleep_quality <= 10),
    energy_level INTEGER CHECK (energy_level >= 0 AND energy_level <= 10),
    stress_level INTEGER CHECK (stress_level >= 0 AND stress_level <= 10),
    muscle_soreness INTEGER CHECK (muscle_soreness >= 0 AND muscle_soreness <= 10),
    motivation_level INTEGER CHECK (motivation_level >= 0 AND motivation_level <= 10),
    mood INTEGER CHECK (mood >= 0 AND mood <= 10),
    hydration_level INTEGER CHECK (hydration_level >= 0 AND hydration_level <= 10),
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(athlete_id, date)
);

-- ============================================================================
-- RECOVERY SESSIONS TABLE
-- ============================================================================
-- Tracks recovery protocol sessions
CREATE TABLE IF NOT EXISTS recovery_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    protocol_id VARCHAR(100) NOT NULL,
    protocol_name VARCHAR(255) NOT NULL,
    
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    stopped_at TIMESTAMP WITH TIME ZONE,
    
    duration_planned INTEGER, -- in minutes
    duration_actual INTEGER, -- in minutes
    
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress', -- in_progress, completed, stopped
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NUTRITION LOGS TABLE
-- ============================================================================
-- Logs individual food entries
CREATE TABLE IF NOT EXISTS nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    food_name VARCHAR(255) NOT NULL,
    food_id INTEGER, -- USDA FoodData Central ID if available
    
    -- Macronutrients
    calories DECIMAL(8,2) DEFAULT 0,
    protein DECIMAL(6,2) DEFAULT 0,
    carbohydrates DECIMAL(6,2) DEFAULT 0,
    fat DECIMAL(6,2) DEFAULT 0,
    fiber DECIMAL(6,2) DEFAULT 0,
    
    meal_type VARCHAR(50), -- breakfast, lunch, dinner, snack
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NUTRITION GOALS TABLE
-- ============================================================================
-- Stores user-specific nutrition targets
CREATE TABLE IF NOT EXISTS nutrition_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    calories_target INTEGER DEFAULT 2500,
    protein_target INTEGER DEFAULT 150,
    carbs_target INTEGER DEFAULT 300,
    fat_target INTEGER DEFAULT 80,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- ============================================================================
-- SUPPLEMENT LOGS TABLE
-- ============================================================================
-- Tracks supplement intake (renamed from supplements_data for consistency)
CREATE TABLE IF NOT EXISTS supplement_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    supplement_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100),
    taken BOOLEAN DEFAULT false,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_of_day VARCHAR(50), -- morning, afternoon, evening, pre-workout, post-workout
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PERFORMANCE TESTS TABLE
-- ============================================================================
-- Stores athletic performance test results
CREATE TABLE IF NOT EXISTS performance_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    test_type VARCHAR(100) NOT NULL, -- e.g., '40YardDash', 'VerticalJump', etc.
    result_value DECIMAL(8,2) NOT NULL,
    target_value DECIMAL(8,2),
    
    test_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    conditions JSONB, -- test conditions (weather, venue, etc.)
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wellness_entries_athlete_date
ON wellness_entries(athlete_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_recovery_sessions_athlete_status
ON recovery_sessions(athlete_id, status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date
ON nutrition_logs(user_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_nutrition_logs_meal_type
ON nutrition_logs(user_id, meal_type, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_supplement_logs_user_date
ON supplement_logs(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_performance_tests_user_type_date
ON performance_tests(user_id, test_type, test_date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE wellness_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_tests ENABLE ROW LEVEL SECURITY;

-- Wellness Entries Policies
CREATE POLICY "Users can view their own wellness entries"
ON wellness_entries FOR SELECT
USING (auth.uid() = athlete_id);

CREATE POLICY "Users can insert their own wellness entries"
ON wellness_entries FOR INSERT
WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "Users can update their own wellness entries"
ON wellness_entries FOR UPDATE
USING (auth.uid() = athlete_id);

CREATE POLICY "Users can delete their own wellness entries"
ON wellness_entries FOR DELETE
USING (auth.uid() = athlete_id);

-- Recovery Sessions Policies
CREATE POLICY "Users can view their own recovery sessions"
ON recovery_sessions FOR SELECT
USING (auth.uid() = athlete_id);

CREATE POLICY "Users can insert their own recovery sessions"
ON recovery_sessions FOR INSERT
WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "Users can update their own recovery sessions"
ON recovery_sessions FOR UPDATE
USING (auth.uid() = athlete_id);

CREATE POLICY "Users can delete their own recovery sessions"
ON recovery_sessions FOR DELETE
USING (auth.uid() = athlete_id);

-- Nutrition Logs Policies
CREATE POLICY "Users can view their own nutrition logs"
ON nutrition_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition logs"
ON nutrition_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition logs"
ON nutrition_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition logs"
ON nutrition_logs FOR DELETE
USING (auth.uid() = user_id);

-- Nutrition Goals Policies
CREATE POLICY "Users can view their own nutrition goals"
ON nutrition_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition goals"
ON nutrition_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition goals"
ON nutrition_goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition goals"
ON nutrition_goals FOR DELETE
USING (auth.uid() = user_id);

-- Supplement Logs Policies
CREATE POLICY "Users can view their own supplement logs"
ON supplement_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own supplement logs"
ON supplement_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own supplement logs"
ON supplement_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own supplement logs"
ON supplement_logs FOR DELETE
USING (auth.uid() = user_id);

-- Performance Tests Policies
CREATE POLICY "Users can view their own performance tests"
ON performance_tests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance tests"
ON performance_tests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own performance tests"
ON performance_tests FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own performance tests"
ON performance_tests FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE wellness_entries IS 'Daily wellness tracking for athlete monitoring and recovery assessment';
COMMENT ON TABLE recovery_sessions IS 'Recovery protocol session tracking with timing and status';
COMMENT ON TABLE nutrition_logs IS 'Individual food intake logs with macronutrient tracking';
COMMENT ON TABLE nutrition_goals IS 'User-specific daily nutrition targets';
COMMENT ON TABLE supplement_logs IS 'Supplement intake tracking for compliance monitoring';
COMMENT ON TABLE performance_tests IS 'Athletic performance test results over time';

COMMENT ON COLUMN wellness_entries.sleep_quality IS 'Sleep quality rating (0-10 scale)';
COMMENT ON COLUMN wellness_entries.energy_level IS 'Energy level rating (0-10 scale)';
COMMENT ON COLUMN wellness_entries.stress_level IS 'Stress level rating (0-10 scale, higher = more stressed)';
COMMENT ON COLUMN wellness_entries.muscle_soreness IS 'Muscle soreness rating (0-10 scale)';
COMMENT ON COLUMN wellness_entries.motivation_level IS 'Motivation level rating (0-10 scale)';
COMMENT ON COLUMN wellness_entries.mood IS 'Overall mood rating (0-10 scale)';
COMMENT ON COLUMN wellness_entries.hydration_level IS 'Hydration level rating (0-10 scale)';

COMMENT ON COLUMN recovery_sessions.status IS 'Session status: in_progress, completed, or stopped';
COMMENT ON COLUMN recovery_sessions.duration_planned IS 'Planned duration of recovery protocol in minutes';
COMMENT ON COLUMN recovery_sessions.duration_actual IS 'Actual duration completed in minutes';

COMMENT ON COLUMN nutrition_logs.meal_type IS 'Type of meal: breakfast, lunch, dinner, or snack';
COMMENT ON COLUMN nutrition_logs.food_id IS 'USDA FoodData Central ID if available';

COMMENT ON COLUMN supplement_logs.time_of_day IS 'When supplement was taken: morning, afternoon, evening, pre-workout, post-workout';
COMMENT ON COLUMN supplement_logs.taken IS 'Whether the supplement was actually taken on this date';

COMMENT ON COLUMN performance_tests.test_type IS 'Type of test: 40YardDash, VerticalJump, BroadJump, ThreeCone, Shuttle, BenchPress, Squat, PowerClean, etc.';
COMMENT ON COLUMN performance_tests.conditions IS 'JSON object with test conditions (weather, venue, equipment, etc.)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================


-- =============================================================================
-- FlagFit Pro - Comprehensive Neon PostgreSQL Database Schema
-- =============================================================================
-- This schema includes:
-- 1. Analytics tables for user behavior and performance tracking
-- 2. Training system tables for periodized programs, exercises, and load monitoring
-- 3. ACWR (Acute:Chronic Workload Ratio) system for injury prevention
-- =============================================================================

-- =============================================================================
-- PART 1: ANALYTICS TABLES
-- =============================================================================
-- Hybrid Analytics System: Advanced analytics storage for complex queries and reporting

-- ANALYTICS EVENTS TABLE
-- Stores all user interactions and events from the application
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    session_id VARCHAR(255) NOT NULL,
    page_url TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional metadata
    referrer TEXT,
    viewport_width INTEGER,
    viewport_height INTEGER,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100)
);

-- PERFORMANCE METRICS TABLE  
-- Stores application performance data for monitoring and optimization
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    page_url TEXT NOT NULL,
    
    -- Core performance metrics
    load_time DECIMAL(10,3), -- Page load time in milliseconds
    api_response_time DECIMAL(10,3), -- API response time in milliseconds
    bundle_size INTEGER, -- JavaScript bundle size in bytes
    memory_usage DECIMAL(10,3), -- Memory usage in MB
    
    -- Core Web Vitals
    fcp DECIMAL(10,3), -- First Contentful Paint
    lcp DECIMAL(10,3), -- Largest Contentful Paint
    fid DECIMAL(10,3), -- First Input Delay
    cls DECIMAL(10,6), -- Cumulative Layout Shift
    
    -- Network and device info
    connection_type VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER BEHAVIOR TABLE
-- Aggregated user behavior patterns and journey analysis
CREATE TABLE IF NOT EXISTS user_behavior (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    
    -- Journey tracking
    page_sequence TEXT[], -- Array of pages visited in order
    session_duration INTEGER, -- Session duration in seconds
    total_page_views INTEGER,
    bounce_rate BOOLEAN, -- True if single page session
    
    -- Feature usage
    features_used TEXT[], -- Array of features used in session
    training_sessions_completed INTEGER DEFAULT 0,
    goals_created INTEGER DEFAULT 0,
    
    -- Conversion tracking
    conversion_events TEXT[], -- Array of conversion events
    funnel_stage VARCHAR(100), -- Current stage in conversion funnel
    
    -- Device and context
    device_type VARCHAR(50),
    browser VARCHAR(100),
    entry_page TEXT,
    exit_page TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TRAINING ANALYTICS TABLE
-- Specific analytics for training sessions and performance
CREATE TABLE IF NOT EXISTS training_analytics (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    
    -- Training session data
    training_type VARCHAR(100), -- e.g., 'agility', 'passing', 'catching'
    duration_minutes INTEGER,
    exercises_completed INTEGER,
    difficulty_level VARCHAR(50),
    performance_score DECIMAL(5,2),
    
    -- Progress tracking
    goals_achieved INTEGER DEFAULT 0,
    personal_best BOOLEAN DEFAULT FALSE,
    improvement_percentage DECIMAL(5,2),
    
    -- Session metadata
    weather_conditions VARCHAR(100),
    location_type VARCHAR(100), -- e.g., 'indoor', 'outdoor', 'gym'
    equipment_used TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PART 2: TRAINING SYSTEM TABLES
-- =============================================================================
-- Flexible, position-agnostic schema for QB, WR, DB, Center, LB, Blitzer, etc.
-- Supports periodization, progressive overload, ACWR, RPE tracking

-- POSITIONS TABLE
-- Define available positions in flag football
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE, -- 'QB', 'WR', 'DB', 'Center', 'LB', 'Blitzer'
  display_name VARCHAR(100) NOT NULL, -- 'Quarterback', 'Wide Receiver', etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRAINING PROGRAMS TABLE
-- Annual or seasonal training programs (e.g., "QB Annual Program 2025-2026")
CREATE TABLE IF NOT EXISTS training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL, -- "QB Annual Program 2025-2026"
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Coach who created it
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRAINING PHASES TABLE (Periodization)
-- Mesocycles: Foundation, Power, Explosive, Tournament Maintenance
CREATE TABLE IF NOT EXISTS training_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES training_programs(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- "Foundation", "Power", "Explosive", "Tournament Maintenance"
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  phase_order INTEGER NOT NULL, -- 1 = Foundation, 2 = Power, 3 = Explosive, 4 = Maintenance
  focus_areas TEXT[], -- ['Strength', 'Speed', 'Agility', 'Endurance']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRAINING WEEKS TABLE (Microcycles)
-- Weekly structure with progressive loading (20% BW → 30% BW → 40% BW)
CREATE TABLE IF NOT EXISTS training_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID REFERENCES training_phases(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL, -- Week 1, 2, 3, 4 within phase
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  load_percentage DECIMAL(5,2), -- Progressive load: 20.00, 30.00, 40.00 (percentage of body weight)
  volume_multiplier DECIMAL(5,2) DEFAULT 1.0, -- For throwing volume progression (1.0 → 1.5 → 2.0 → 3.2)
  focus VARCHAR(255), -- "Foundation week", "Power build", "Deload week"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXERCISES LIBRARY TABLE
-- Exercise library with position-specific tags
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- 'Strength', 'Speed', 'Agility', 'Flexibility', 'Position-Specific'
  movement_pattern VARCHAR(100), -- '3-step acceleration', 'Deceleration', 'Unilateral', 'Lateral'
  description TEXT,
  video_url VARCHAR(500), -- Link to exercise video
  equipment_needed TEXT[], -- ['Barbell', 'Dumbbells', 'Resistance Bands']
  position_specific BOOLEAN DEFAULT FALSE,
  applicable_positions UUID[], -- Array of position IDs this exercise applies to
  metrics_tracked TEXT[], -- ['Reps', 'Sets', 'Weight', 'Distance', 'Time', 'Throws']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRAINING SESSIONS TABLE
-- Individual training sessions within a week
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID REFERENCES training_weeks(id) ON DELETE CASCADE,
  session_name VARCHAR(255) NOT NULL, -- "Morning Routine", "Speed Session", "Strength Training"
  session_type VARCHAR(100), -- 'Strength', 'Speed', 'Skill', 'Recovery', 'Position-Specific'
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Monday, 6 = Sunday
  session_order INTEGER, -- 1 = Morning, 2 = Afternoon, 3 = Evening
  duration_minutes INTEGER, -- Expected duration (e.g., 30, 60, 90)
  warm_up_protocol TEXT, -- Description or reference to warm-up routine
  cool_down_protocol TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SESSION EXERCISES TABLE (Many-to-Many)
-- Links exercises to specific training sessions with prescribed sets/reps/load
CREATE TABLE IF NOT EXISTS session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  exercise_order INTEGER NOT NULL, -- Order within the session
  sets INTEGER,
  reps INTEGER,
  rest_seconds INTEGER, -- Rest between sets
  load_type VARCHAR(50), -- 'Percentage BW', 'Fixed Weight', 'Bodyweight', 'Time-based'
  load_value DECIMAL(10,2), -- 20.0 (for 20% BW), or actual weight in kg
  distance_meters INTEGER, -- For sprints, runs
  duration_seconds INTEGER, -- For timed exercises
  position_specific_params JSONB, -- Flexible field for position-specific data
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WORKOUT LOGS TABLE (Actual Completed Workouts)
-- Records of completed workouts by players
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  rpe DECIMAL(3,1) CHECK (rpe >= 1 AND rpe <= 10), -- Rate of Perceived Exertion (1-10 scale)
  duration_minutes INTEGER, -- Actual duration
  notes TEXT, -- Player's notes about the session
  coach_feedback TEXT, -- Coach's feedback
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXERCISE LOGS TABLE (Individual Exercise Performance)
-- Detailed logs of each exercise performed within a workout
CREATE TABLE IF NOT EXISTS exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE,
  session_exercise_id UUID REFERENCES session_exercises(id) ON DELETE SET NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  sets_completed INTEGER,
  reps_completed INTEGER,
  weight_used DECIMAL(10,2), -- Actual weight used
  distance_completed INTEGER, -- For sprints
  time_completed INTEGER, -- For timed exercises
  performance_metrics JSONB, -- Flexible field for exercise-specific metrics
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LOAD MONITORING TABLE (ACWR & Injury Prevention)
-- Tracks acute and chronic workload for injury prevention
CREATE TABLE IF NOT EXISTS load_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  daily_load INTEGER NOT NULL, -- Total training load for the day (calculated from RPE × duration)
  acute_load DECIMAL(10,2), -- 7-day rolling average
  chronic_load DECIMAL(10,2), -- 28-day rolling average
  acwr DECIMAL(5,2), -- Acute:Chronic Workload Ratio (acute_load / chronic_load)
  injury_risk_level VARCHAR(20), -- 'baseline_building', 'baseline_low', 'low', 'optimal', 'moderate', 'high'
  baseline_days INTEGER CHECK (baseline_days >= 0 AND baseline_days <= 28), -- Days of data available (0-28)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, date)
);

-- POSITION SPECIFIC METRICS TABLE
-- Flexible table for position-specific tracking (e.g., QB throwing volume)
CREATE TABLE IF NOT EXISTS position_specific_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE,
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL, -- 'Throwing Volume', 'Route Completion', 'Tackles', etc.
  metric_value DECIMAL(10,2) NOT NULL,
  metric_unit VARCHAR(50), -- 'Throws', 'Routes', 'Yards', 'Seconds'
  date DATE NOT NULL,
  weekly_total DECIMAL(10,2), -- Rolling weekly total
  monthly_total DECIMAL(10,2), -- Rolling monthly total
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PLAYER PROGRAMS TABLE (Assign Programs to Players)
-- Assigns training programs to specific players
CREATE TABLE IF NOT EXISTS player_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES training_programs(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Coach who assigned
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  compliance_rate DECIMAL(5,2), -- Percentage of completed sessions (0-100)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, program_id, start_date)
);

-- TRAINING VIDEOS TABLE
-- Library of training videos (exercise demos, technique videos, etc.)
CREATE TABLE IF NOT EXISTS training_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  duration_seconds INTEGER,
  category VARCHAR(100), -- 'Exercise Demo', 'Technique', 'Position-Specific', 'Warm-up'
  position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
  tags TEXT[], -- ['QB', 'Throwing Mechanics', 'Arm Care']
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PART 3: INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Analytics Events Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page_url ON analytics_events(page_url);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_time ON analytics_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_time ON analytics_events(event_type, created_at);

-- JSONB indexes for event_data queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_feature ON analytics_events USING GIN ((event_data->>'feature'));
CREATE INDEX IF NOT EXISTS idx_analytics_events_action ON analytics_events USING GIN ((event_data->>'action'));

-- Performance Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_page_url ON performance_metrics(page_url);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_load_time ON performance_metrics(load_time);

-- User Behavior Indexes
CREATE INDEX IF NOT EXISTS idx_user_behavior_user_id ON user_behavior(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_session_id ON user_behavior(session_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_created_at ON user_behavior(created_at);
CREATE INDEX IF NOT EXISTS idx_user_behavior_funnel_stage ON user_behavior(funnel_stage);

-- Training Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_training_analytics_user_id ON training_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_training_analytics_type ON training_analytics(training_type);
CREATE INDEX IF NOT EXISTS idx_training_analytics_created_at ON training_analytics(created_at);

-- Training System Indexes
CREATE INDEX IF NOT EXISTS idx_training_programs_position ON training_programs(position_id);
CREATE INDEX IF NOT EXISTS idx_training_programs_active ON training_programs(is_active);
CREATE INDEX IF NOT EXISTS idx_training_phases_program ON training_phases(program_id);
CREATE INDEX IF NOT EXISTS idx_training_weeks_phase ON training_weeks(phase_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_week ON training_sessions(week_id);
CREATE INDEX IF NOT EXISTS idx_session_exercises_session ON session_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_session_exercises_exercise ON session_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_player ON workout_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_session ON workout_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON workout_logs(completed_at);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout ON exercise_logs(workout_log_id);
CREATE INDEX IF NOT EXISTS idx_load_monitoring_player ON load_monitoring(player_id);
CREATE INDEX IF NOT EXISTS idx_load_monitoring_date ON load_monitoring(date);
CREATE INDEX IF NOT EXISTS idx_load_monitoring_acwr ON load_monitoring(acwr);
CREATE INDEX IF NOT EXISTS idx_position_metrics_player ON position_specific_metrics(player_id);
CREATE INDEX IF NOT EXISTS idx_position_metrics_date ON position_specific_metrics(date);
CREATE INDEX IF NOT EXISTS idx_position_metrics_position ON position_specific_metrics(position_id);
CREATE INDEX IF NOT EXISTS idx_player_programs_player ON player_programs(player_id);
CREATE INDEX IF NOT EXISTS idx_player_programs_program ON player_programs(program_id);
CREATE INDEX IF NOT EXISTS idx_player_programs_active ON player_programs(is_active);
CREATE INDEX IF NOT EXISTS idx_training_videos_position ON training_videos(position_id);
CREATE INDEX IF NOT EXISTS idx_training_videos_exercise ON training_videos(exercise_id);
CREATE INDEX IF NOT EXISTS idx_training_videos_category ON training_videos(category);

-- =============================================================================
-- PART 4: FUNCTIONS FOR ACWR CALCULATION
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
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PART 5: TRIGGER TO AUTO-UPDATE LOAD MONITORING
-- =============================================================================

-- Trigger function to update load monitoring when workout is logged
-- NOTE: This function now uses calculate_acwr_safe() which includes baseline checks
-- See migration 046_fix_acwr_baseline_checks.sql for the safe implementation
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
  -- Use safe calculation if available, otherwise fallback to basic calculation
  BEGIN
    SELECT acwr, risk_level, baseline_days INTO acwr_value, risk_level, baseline_days_val
    FROM calculate_acwr_safe(NEW.player_id, log_date);
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to basic calculation if safe function doesn't exist yet
    IF chronic_load_value > 0 THEN
      acwr_value := acute_load_value / chronic_load_value;
    ELSE
      acwr_value := NULL;
    END IF;
    risk_level := get_injury_risk_level(acwr_value);
    baseline_days_val := NULL;
  END;

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
$$ LANGUAGE plpgsql;

-- Attach trigger to workout_logs
DROP TRIGGER IF EXISTS trigger_update_load_monitoring ON workout_logs;
CREATE TRIGGER trigger_update_load_monitoring
AFTER INSERT OR UPDATE ON workout_logs
FOR EACH ROW
EXECUTE FUNCTION update_load_monitoring();

-- =============================================================================
-- PART 6: SEED DATA - POSITIONS
-- =============================================================================
-- Insert positions (required before seeding training programs)

INSERT INTO positions (name, display_name, description) VALUES
  ('QB', 'Quarterback', 'Field general, responsible for passing and leadership'),
  ('WR', 'Wide Receiver', 'Primary pass catchers and route runners'),
  ('DB', 'Defensive Back', 'Coverage specialists and ball hawks'),
  ('Center', 'Center', 'Snaps the ball and protects the QB'),
  ('LB', 'Linebacker', 'Versatile defenders, rush and coverage'),
  ('Blitzer', 'Blitzer', 'Specialized pass rushers')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- PART 7: ANALYTICS VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Daily active users
CREATE OR REPLACE VIEW daily_active_users AS
SELECT 
    DATE(created_at) as date,
    COUNT(DISTINCT user_id) as active_users
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Popular features
CREATE OR REPLACE VIEW popular_features AS
SELECT 
    event_data->>'feature' as feature,
    COUNT(*) as usage_count,
    COUNT(DISTINCT user_id) as unique_users
FROM analytics_events
WHERE event_type = 'feature_usage'
    AND event_data->>'feature' IS NOT NULL
    AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY event_data->>'feature'
ORDER BY usage_count DESC;

-- Performance summary
CREATE OR REPLACE VIEW performance_summary AS
SELECT 
    page_url,
    COUNT(*) as measurements,
    AVG(load_time) as avg_load_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY load_time) as p95_load_time,
    AVG(api_response_time) as avg_api_response
FROM performance_metrics
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY page_url
ORDER BY avg_load_time DESC;

-- User journey analysis
CREATE OR REPLACE VIEW user_journeys AS
SELECT 
    page_sequence,
    COUNT(*) as frequency,
    AVG(session_duration) as avg_duration,
    AVG(total_page_views) as avg_page_views
FROM user_behavior
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY page_sequence
ORDER BY frequency DESC;

-- =============================================================================
-- NOTES
-- =============================================================================
-- This schema creates a comprehensive database structure for FlagFit Pro:
-- 
-- ANALYTICS SYSTEM:
-- - Tracks user behavior, performance metrics, and training analytics
-- - Provides views for common analytics queries
--
-- TRAINING SYSTEM:
-- - Supports periodized training programs with phases and weeks
-- - Exercise library with position-specific tagging
-- - ACWR (Acute:Chronic Workload Ratio) monitoring for injury prevention
-- - RPE (Rate of Perceived Exertion) tracking
-- - Position-specific metrics tracking (e.g., QB throwing volume)
--
-- NEXT STEPS:
-- 1. Run seed-qb-annual-program-corrected.sql to create QB program
-- 2. Run seed-test-account.sql to create test accounts
-- 3. Enable RLS policies if using Supabase (see create-training-schema.sql for examples)
-- =============================================================================

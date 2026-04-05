-- =====================================================
-- FLAGFIT PRO - COMPREHENSIVE TRAINING DATABASE SCHEMA
-- =====================================================
-- Flexible, position-agnostic schema for QB, WR, DB, Center, LB, Blitzer, etc.
-- Supports periodization, progressive overload, ACWR, RPE tracking

-- =====================================================
-- 1. POSITIONS TABLE
-- =====================================================
-- Define available positions in flag football
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE, -- 'QB', 'WR', 'DB', 'Center', 'LB', 'Blitzer'
  display_name VARCHAR(100) NOT NULL, -- 'Quarterback', 'Wide Receiver', etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. TRAINING PROGRAMS TABLE
-- =====================================================
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

-- =====================================================
-- 3. TRAINING PHASES TABLE (Periodization)
-- =====================================================
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

-- =====================================================
-- 4. TRAINING WEEKS TABLE (Microcycles)
-- =====================================================
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

-- =====================================================
-- 5. EXERCISES LIBRARY TABLE
-- =====================================================
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

-- =====================================================
-- 6. TRAINING SESSIONS TABLE
-- =====================================================
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

-- =====================================================
-- 7. SESSION EXERCISES TABLE (Many-to-Many)
-- =====================================================
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

-- =====================================================
-- 8. WORKOUT LOGS TABLE (Actual Completed Workouts)
-- =====================================================
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

-- =====================================================
-- 9. EXERCISE LOGS TABLE (Individual Exercise Performance)
-- =====================================================
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

-- =====================================================
-- 10. LOAD MONITORING TABLE (ACWR & Injury Prevention)
-- =====================================================
-- Tracks acute and chronic workload for injury prevention
CREATE TABLE IF NOT EXISTS load_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  daily_load INTEGER NOT NULL, -- Total training load for the day (calculated from RPE × duration)
  acute_load DECIMAL(10,2), -- 7-day rolling average
  chronic_load DECIMAL(10,2), -- 28-day rolling average
  acwr DECIMAL(5,2), -- Acute:Chronic Workload Ratio (acute_load / chronic_load)
  injury_risk_level VARCHAR(20), -- 'Low', 'Moderate', 'High' (based on ACWR thresholds)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, date)
);

-- =====================================================
-- 11. POSITION SPECIFIC METRICS TABLE
-- =====================================================
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

-- =====================================================
-- 12. PLAYER PROGRAMS TABLE (Assign Programs to Players)
-- =====================================================
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

-- =====================================================
-- 13. TRAINING VIDEOS TABLE
-- =====================================================
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

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Programs and phases
CREATE INDEX idx_training_programs_position ON training_programs(position_id);
CREATE INDEX idx_training_programs_active ON training_programs(is_active);
CREATE INDEX idx_training_phases_program ON training_phases(program_id);
CREATE INDEX idx_training_weeks_phase ON training_weeks(phase_id);

-- Sessions and exercises
CREATE INDEX idx_training_sessions_week ON training_sessions(week_id);
CREATE INDEX idx_session_exercises_session ON session_exercises(session_id);
CREATE INDEX idx_session_exercises_exercise ON session_exercises(exercise_id);

-- Workout logs
CREATE INDEX idx_workout_logs_player ON workout_logs(player_id);
CREATE INDEX idx_workout_logs_session ON workout_logs(session_id);
CREATE INDEX idx_workout_logs_date ON workout_logs(completed_at);
CREATE INDEX idx_exercise_logs_workout ON exercise_logs(workout_log_id);

-- Load monitoring
CREATE INDEX idx_load_monitoring_player ON load_monitoring(player_id);
CREATE INDEX idx_load_monitoring_date ON load_monitoring(date);
CREATE INDEX idx_load_monitoring_acwr ON load_monitoring(acwr);

-- Position-specific metrics
CREATE INDEX idx_position_metrics_player ON position_specific_metrics(player_id);
CREATE INDEX idx_position_metrics_date ON position_specific_metrics(date);
CREATE INDEX idx_position_metrics_position ON position_specific_metrics(position_id);

-- Player programs
CREATE INDEX idx_player_programs_player ON player_programs(player_id);
CREATE INDEX idx_player_programs_program ON player_programs(program_id);
CREATE INDEX idx_player_programs_active ON player_programs(is_active);

-- Videos
CREATE INDEX idx_training_videos_position ON training_videos(position_id);
CREATE INDEX idx_training_videos_exercise ON training_videos(exercise_id);
CREATE INDEX idx_training_videos_category ON training_videos(category);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_specific_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_videos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES (Optimized for Performance)
-- ============================================================================
-- All auth function calls are wrapped in (SELECT ...) for better query performance
-- This prevents PostgreSQL from calling auth functions multiple times per row

-- Positions: Public read, coaches can create/update
CREATE POLICY "Positions are viewable by everyone" ON positions FOR SELECT USING (true);
CREATE POLICY "Coaches can manage positions" ON positions FOR ALL USING (
  (SELECT auth.jwt()) ->> 'user_metadata' ->> 'role' = 'coach'
);

-- Training Programs: Coaches can manage, players can view assigned programs
CREATE POLICY "Programs viewable by coaches and assigned players" ON training_programs FOR SELECT USING (
  ((SELECT auth.jwt()) ->> 'user_metadata' ->> 'role' = 'coach') OR
  ((SELECT auth.uid()) IN (SELECT player_id FROM player_programs WHERE program_id = training_programs.id AND is_active = true))
);
CREATE POLICY "Coaches can manage programs" ON training_programs FOR ALL USING (
  (SELECT auth.jwt()) ->> 'user_metadata' ->> 'role' = 'coach'
);

-- Workout Logs: Players can manage their own, coaches can view all
CREATE POLICY "Players can manage their own workout logs" ON workout_logs FOR ALL USING (
  (SELECT auth.uid()) = player_id
);
CREATE POLICY "Coaches can view and comment on workout logs" ON workout_logs FOR SELECT USING (
  (SELECT auth.jwt()) ->> 'user_metadata' ->> 'role' = 'coach'
);
CREATE POLICY "Coaches can update feedback" ON workout_logs FOR UPDATE USING (
  (SELECT auth.jwt()) ->> 'user_metadata' ->> 'role' = 'coach'
) WITH CHECK (
  (SELECT auth.jwt()) ->> 'user_metadata' ->> 'role' = 'coach'
);

-- Load Monitoring: Players can view their own, coaches can view all
CREATE POLICY "Players can view their own load data" ON load_monitoring FOR SELECT USING (
  (SELECT auth.uid()) = player_id
);
CREATE POLICY "Coaches can view all load data" ON load_monitoring FOR SELECT USING (
  (SELECT auth.jwt()) ->> 'user_metadata' ->> 'role' = 'coach'
);

-- Training Videos: Public read, coaches can upload
CREATE POLICY "Training videos viewable by everyone" ON training_videos FOR SELECT USING (true);
CREATE POLICY "Coaches can manage training videos" ON training_videos FOR ALL USING (
  (SELECT auth.jwt()) ->> 'user_metadata' ->> 'role' = 'coach'
);

-- =====================================================
-- FUNCTIONS FOR ACWR CALCULATION
-- =====================================================

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

-- =====================================================
-- TRIGGER TO AUTO-UPDATE LOAD MONITORING
-- =====================================================

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

  -- Calculate acute and chronic loads
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

  -- Insert or update load monitoring record
  INSERT INTO load_monitoring (player_id, date, daily_load, acute_load, chronic_load, acwr, injury_risk_level)
  VALUES (NEW.player_id, log_date, daily_load_value, acute_load_value, chronic_load_value, acwr_value, risk_level)
  ON CONFLICT (player_id, date)
  DO UPDATE SET
    daily_load = EXCLUDED.daily_load,
    acute_load = EXCLUDED.acute_load,
    chronic_load = EXCLUDED.chronic_load,
    acwr = EXCLUDED.acwr,
    injury_risk_level = EXCLUDED.injury_risk_level,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to workout_logs
CREATE TRIGGER trigger_update_load_monitoring
AFTER INSERT OR UPDATE ON workout_logs
FOR EACH ROW
EXECUTE FUNCTION update_load_monitoring();

-- =====================================================
-- SAMPLE DATA SEED (Will create QB program structure)
-- =====================================================

-- Insert positions
INSERT INTO positions (name, display_name, description) VALUES
  ('QB', 'Quarterback', 'Field general, responsible for passing and leadership'),
  ('WR', 'Wide Receiver', 'Primary pass catchers and route runners'),
  ('DB', 'Defensive Back', 'Coverage specialists and ball hawks'),
  ('Center', 'Center', 'Snaps the ball and protects the QB'),
  ('LB', 'Linebacker', 'Versatile defenders, rush and coverage'),
  ('Blitzer', 'Blitzer', 'Specialized pass rushers')
ON CONFLICT (name) DO NOTHING;

-- Enhanced Sprint Training System based on Elite Methods
-- Migration: 024_enhanced_sprint_training_system.sql

-- Sprint training phases and periodization
CREATE TABLE sprint_training_phases (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL, -- 'pre_season', 'early_season', 'mid_season', 'late_season'
  description TEXT,
  duration_weeks INTEGER,
  intensity_focus VARCHAR(50), -- 'base_building', 'acceleration', 'speed_endurance', 'maintenance'
  volume_percentage INTEGER, -- relative to peak volume
  created_at TIMESTAMP DEFAULT NOW()
);

-- Elite-inspired sprint training categories
CREATE TABLE sprint_training_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category_type VARCHAR(50), -- 'acceleration', 'top_speed', 'speed_endurance', 'hill_training'
  description TEXT,
  elite_method_origin VARCHAR(50), -- 'jamaican_long_to_short', 'uk_athletics', 'usa_power'
  equipment_needed TEXT[],
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sprint workout protocols with elite specifications
CREATE TABLE sprint_workouts (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES sprint_training_categories(id),
  phase_id INTEGER REFERENCES sprint_training_phases(id),
  name VARCHAR(200) NOT NULL,
  distance_yards INTEGER,
  intensity_percentage INTEGER CHECK (intensity_percentage BETWEEN 50 AND 100),
  rest_duration_seconds INTEGER,
  sets INTEGER,
  reps_per_set INTEGER,
  recovery_between_sets_seconds INTEGER,
  surface_type VARCHAR(50), -- 'track', 'grass', 'turf', 'hill'
  gradient_percentage INTEGER, -- for hill training
  coaching_cues TEXT[],
  elite_application_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Hill training specific protocols
CREATE TABLE hill_training_protocols (
  id SERIAL PRIMARY KEY,
  workout_id INTEGER REFERENCES sprint_workouts(id),
  gradient_percentage INTEGER CHECK (gradient_percentage BETWEEN 5 AND 17),
  optimal_gradient_range VARCHAR(20), -- '8-12%' for flag football
  hill_length_yards INTEGER,
  surface_condition VARCHAR(50), -- 'grass', 'dirt', 'concrete'
  safety_considerations TEXT[],
  progression_notes TEXT
);

-- Direction change and agility patterns
CREATE TABLE agility_patterns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  pattern_type VARCHAR(50), -- 'l_drill', 'figure_8', 'cone_weave', 'shuttle', 'reactive'
  setup_description TEXT,
  cone_spacing_yards INTEGER,
  total_distance_yards INTEGER,
  direction_changes_count INTEGER,
  execution_instructions TEXT[],
  flag_football_application TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Speed endurance protocols (elite adapted)
CREATE TABLE speed_endurance_protocols (
  id SERIAL PRIMARY KEY,
  workout_id INTEGER REFERENCES sprint_workouts(id),
  protocol_type VARCHAR(50), -- 'special_endurance_i', 'special_endurance_ii', 'lactate_tolerance'
  target_distance_yards INTEGER,
  target_intensity_percentage INTEGER,
  rest_duration_minutes INTEGER,
  lactate_threshold_work BOOLEAN DEFAULT false,
  game_simulation_notes TEXT
);

-- Recovery protocols between sprint sessions
CREATE TABLE recovery_protocols (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  recovery_type VARCHAR(50), -- 'active', 'passive', 'cold_water', 'sauna', 'massage'
  duration_minutes INTEGER,
  temperature_fahrenheit INTEGER, -- for cold water immersion
  instructions TEXT,
  effectiveness_percentage INTEGER, -- based on elite usage stats
  recommended_timing VARCHAR(100), -- 'immediately_post', 'within_2_hours', 'before_sleep'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Strength training integration for sprinters
CREATE TABLE sprint_strength_protocols (
  id SERIAL PRIMARY KEY,
  phase_id INTEGER REFERENCES sprint_training_phases(id),
  exercise_name VARCHAR(100) NOT NULL,
  exercise_type VARCHAR(50), -- 'olympic_lift', 'bilateral_squat', 'unilateral', 'plyometric'
  sets INTEGER,
  reps_range VARCHAR(20), -- '6-8', '3-5'
  intensity_percentage INTEGER, -- of 1RM
  rest_duration_minutes INTEGER,
  frequency_per_week INTEGER,
  elite_rationale TEXT,
  flag_football_adaptation TEXT
);

-- Mental preparation techniques
CREATE TABLE mental_preparation_protocols (
  id SERIAL PRIMARY KEY,
  technique_name VARCHAR(100) NOT NULL,
  technique_type VARCHAR(50), -- 'visualization', 'self_talk', 'breathing', 'goal_setting'
  duration_minutes INTEGER,
  timing VARCHAR(50), -- 'pre_training', 'pre_game', 'between_plays', 'post_error'
  instructions TEXT,
  example_mantras TEXT[], -- for self-talk techniques
  effectiveness_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User sprint performance tracking (enhanced)
CREATE TABLE user_sprint_performances (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  workout_id INTEGER REFERENCES sprint_workouts(id),
  agility_pattern_id INTEGER REFERENCES agility_patterns(id),
  total_time_seconds DECIMAL(5,2),
  split_times DECIMAL(4,2)[], -- array for 10, 20, 30, 40 yard splits
  perceived_exertion INTEGER CHECK (perceived_exertion BETWEEN 1 AND 10),
  technique_rating INTEGER CHECK (technique_rating BETWEEN 1 AND 10),
  environmental_conditions JSONB, -- temperature, wind, humidity
  surface_quality INTEGER CHECK (surface_quality BETWEEN 1 AND 5),
  recorded_at TIMESTAMP DEFAULT NOW(),
  coach_notes TEXT
);

-- Training load monitoring (elite recovery principles)
CREATE TABLE training_load_monitoring (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  training_date DATE,
  sprint_volume_yards INTEGER,
  high_intensity_seconds INTEGER, -- time at >90% intensity
  direction_changes_count INTEGER,
  perceived_exertion INTEGER CHECK (perceived_exertion BETWEEN 1 AND 10),
  fatigue_level INTEGER CHECK (fatigue_level BETWEEN 1 AND 10),
  sleep_hours DECIMAL(3,1),
  recovery_methods_used INTEGER[] REFERENCES recovery_protocols(id)[],
  readiness_for_next_session INTEGER CHECK (readiness_for_next_session BETWEEN 1 AND 10),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Progressive skill building system
CREATE TABLE skill_progression_tiers (
  id SERIAL PRIMARY KEY,
  movement_category VARCHAR(50), -- 'acceleration', 'direction_change', 'deceleration', 'flag_pulling'
  tier_level INTEGER CHECK (tier_level BETWEEN 1 AND 4), -- 1=beginner, 4=elite
  tier_name VARCHAR(100),
  unlock_requirements JSONB, -- previous skills and performance benchmarks
  mastery_criteria JSONB, -- specific metrics for advancement
  elite_benchmark_notes TEXT, -- what elite athletes achieve at this level
  created_at TIMESTAMP DEFAULT NOW()
);

-- User skill progression tracking
CREATE TABLE user_skill_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  skill_tier_id INTEGER REFERENCES skill_progression_tiers(id),
  current_level INTEGER DEFAULT 1,
  mastery_percentage INTEGER DEFAULT 0,
  best_performance_metrics JSONB, -- personal bests in relevant categories
  unlocked_at TIMESTAMP,
  mastered_at TIMESTAMP,
  last_assessment TIMESTAMP,
  coach_evaluation TEXT
);

-- Flag football specific sprint scenarios
CREATE TABLE flag_football_sprint_scenarios (
  id SERIAL PRIMARY KEY,
  scenario_name VARCHAR(150) NOT NULL,
  game_situation VARCHAR(100), -- 'breakaway', 'comeback_route', 'blitz_escape', 'flag_pursuit'
  required_skills TEXT[], -- combination of movements needed
  distance_range VARCHAR(20), -- '5-15_yards', '15-25_yards'
  success_metrics JSONB, -- what constitutes success in this scenario
  training_drills INTEGER[] REFERENCES sprint_workouts(id)[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert initial data for sprint training phases
INSERT INTO sprint_training_phases (name, description, duration_weeks, intensity_focus, volume_percentage) VALUES
('pre_season', 'Base building and general conditioning', 8, 'base_building', 100),
('early_season', 'Acceleration development and technique refinement', 4, 'acceleration', 80),
('mid_season', 'Game-specific speed endurance and maintenance', 12, 'speed_endurance', 60),
('late_season', 'Peak performance and recovery focus', 4, 'maintenance', 40);

-- Insert elite-inspired training categories
INSERT INTO sprint_training_categories (name, category_type, description, elite_method_origin, equipment_needed, difficulty_level) VALUES
('3-Point Start Acceleration', 'acceleration', '0-20 yard explosive starts from 3-point stance', 'usa_power', ARRAY['cones', 'stopwatch'], 2),
('Hill Sprint Power', 'hill_training', '8-15 yard uphill sprints for power development', 'jamaican_long_to_short', ARRAY['hill 8-12% grade'], 3),
('Speed Endurance Repeats', 'speed_endurance', 'Multiple 25-yard sprints with short recovery', 'uk_athletics', ARRAY['cones', 'stopwatch'], 4),
('Direction Change Mastery', 'agility', 'L-drills and cone weaves for game situations', 'flag_football_specific', ARRAY['cones', 'flags'], 3);

-- Create indexes for performance
CREATE INDEX idx_user_sprint_performances_user_date ON user_sprint_performances(user_id, recorded_at);
CREATE INDEX idx_training_load_user_date ON training_load_monitoring(user_id, training_date);
CREATE INDEX idx_skill_progress_user ON user_skill_progress(user_id);
CREATE INDEX idx_sprint_workouts_category_phase ON sprint_workouts(category_id, phase_id);
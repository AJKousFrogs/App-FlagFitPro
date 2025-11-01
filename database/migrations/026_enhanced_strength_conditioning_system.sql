-- =============================================================================
-- ENHANCED STRENGTH & CONDITIONING SYSTEM FOR FLAG FOOTBALL
-- Migration: 026_enhanced_strength_conditioning_system.sql
-- Comprehensive position-specific training system with periodization
-- =============================================================================

-- =============================================================================
-- POSITION-SPECIFIC TRAINING PROGRAMS
-- =============================================================================

-- Enhanced position requirements with S&C focus
CREATE TABLE IF NOT EXISTS position_training_requirements (
    id SERIAL PRIMARY KEY,
    position_name VARCHAR(50) NOT NULL, -- 'quarterback', 'wide_receiver', 'defensive_back', 'blitzer_rusher'
    
    -- Primary training emphases (1-10 scale)
    linear_speed_emphasis INTEGER CHECK (linear_speed_emphasis BETWEEN 1 AND 10),
    acceleration_emphasis INTEGER CHECK (acceleration_emphasis BETWEEN 1 AND 10),
    agility_emphasis INTEGER CHECK (agility_emphasis BETWEEN 1 AND 10),
    power_emphasis INTEGER CHECK (power_emphasis BETWEEN 1 AND 10),
    strength_emphasis INTEGER CHECK (strength_emphasis BETWEEN 1 AND 10),
    endurance_emphasis INTEGER CHECK (endurance_emphasis BETWEEN 1 AND 10),
    
    -- Position-specific focus areas
    arm_strength_focus BOOLEAN DEFAULT FALSE, -- QB specific
    pocket_mobility_focus BOOLEAN DEFAULT FALSE, -- QB specific
    route_precision_focus BOOLEAN DEFAULT FALSE, -- WR specific
    backpedal_technique_focus BOOLEAN DEFAULT FALSE, -- DB specific
    first_step_explosion_focus BOOLEAN DEFAULT FALSE, -- Blitzer specific
    
    -- Movement pattern priorities
    primary_movement_patterns TEXT[], -- ['sprint', 'backpedal', 'cutting', 'jumping']
    secondary_movement_patterns TEXT[],
    
    -- Training volume distribution (percentages)
    strength_training_percentage INTEGER CHECK (strength_training_percentage BETWEEN 0 AND 100),
    speed_agility_percentage INTEGER CHECK (speed_agility_percentage BETWEEN 0 AND 100),
    power_development_percentage INTEGER CHECK (power_development_percentage BETWEEN 0 AND 100),
    skill_specific_percentage INTEGER CHECK (skill_specific_percentage BETWEEN 0 AND 100),
    recovery_percentage INTEGER CHECK (recovery_percentage BETWEEN 0 AND 100),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Periodization phases and their characteristics
CREATE TABLE IF NOT EXISTS periodization_phases (
    id SERIAL PRIMARY KEY,
    phase_name VARCHAR(100) NOT NULL, -- 'foundation', 'development', 'peak', 'transition'
    phase_order INTEGER, -- 1, 2, 3, 4
    
    -- Phase characteristics
    duration_weeks INTEGER,
    primary_focus TEXT NOT NULL,
    secondary_focus TEXT,
    
    -- Training load characteristics
    volume_emphasis VARCHAR(20), -- 'low', 'moderate', 'high', 'very_high'
    intensity_emphasis VARCHAR(20), -- 'low', 'moderate', 'high', 'maximum'
    
    -- Phase-specific distributions
    strength_percentage INTEGER,
    power_percentage INTEGER,
    speed_percentage INTEGER,
    skill_percentage INTEGER,
    recovery_percentage INTEGER,
    
    -- Testing and assessment schedule
    baseline_testing_required BOOLEAN DEFAULT FALSE,
    progress_testing_required BOOLEAN DEFAULT FALSE,
    peak_testing_required BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- EXERCISE DATABASE AND CATEGORIZATION
-- =============================================================================

-- Comprehensive exercise database with detailed categorization
CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    exercise_name VARCHAR(200) NOT NULL,
    exercise_category VARCHAR(50), -- 'strength', 'power', 'speed', 'agility', 'skill', 'recovery'
    exercise_subcategory VARCHAR(50), -- 'upper_body', 'lower_body', 'core', 'throwing', 'catching'
    
    -- Exercise specifications
    equipment_required TEXT[], -- ['dumbbells', 'medicine_ball', 'cones', 'resistance_bands']
    space_requirements VARCHAR(100), -- 'indoor_gym', 'outdoor_field', 'minimal_space'
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    
    -- Movement characteristics
    movement_plane VARCHAR(20), -- 'sagittal', 'frontal', 'transverse', 'multi_planar'
    movement_pattern VARCHAR(50), -- 'squat', 'hinge', 'lunge', 'push', 'pull', 'gait'
    
    -- Position relevance scores (1-10)
    quarterback_relevance INTEGER CHECK (quarterback_relevance BETWEEN 0 AND 10),
    wide_receiver_relevance INTEGER CHECK (wide_receiver_relevance BETWEEN 0 AND 10),
    defensive_back_relevance INTEGER CHECK (defensive_back_relevance BETWEEN 0 AND 10),
    blitzer_rusher_relevance INTEGER CHECK (blitzer_rusher_relevance BETWEEN 0 AND 10),
    
    -- Exercise details
    description TEXT,
    setup_instructions TEXT,
    execution_steps TEXT[],
    coaching_cues TEXT[],
    common_mistakes TEXT[],
    safety_considerations TEXT[],
    
    -- Progression and regression options
    progressions TEXT[], -- Harder variations
    regressions TEXT[], -- Easier variations
    
    -- Video and media references
    demonstration_video_url VARCHAR(500),
    instruction_images TEXT[], -- Array of image URLs
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Exercise prescription parameters
CREATE TABLE IF NOT EXISTS exercise_prescriptions (
    id SERIAL PRIMARY KEY,
    exercise_id INTEGER REFERENCES exercises(id),
    
    -- Prescription context
    phase_id INTEGER REFERENCES periodization_phases(id),
    position_requirement_id INTEGER REFERENCES position_training_requirements(id),
    
    -- Sets and reps parameters
    sets_min INTEGER,
    sets_max INTEGER,
    reps_min INTEGER,
    reps_max INTEGER,
    duration_seconds INTEGER, -- For time-based exercises
    
    -- Load parameters
    intensity_percentage DECIMAL(5,2), -- Percentage of 1RM or max effort
    rest_duration_seconds INTEGER,
    
    -- Frequency and timing
    sessions_per_week INTEGER,
    weeks_in_phase INTEGER,
    session_placement VARCHAR(50), -- 'beginning', 'middle', 'end', 'standalone'
    
    -- Progression scheme
    progression_method VARCHAR(50), -- 'linear', 'wave', 'step_loading', 'auto_regulation'
    progression_parameters JSONB, -- Specific progression details
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- TRAINING SESSION STRUCTURE
-- =============================================================================

-- Training session templates
CREATE TABLE IF NOT EXISTS training_session_templates (
    id SERIAL PRIMARY KEY,
    session_name VARCHAR(200) NOT NULL,
    position_id INTEGER REFERENCES position_training_requirements(id),
    phase_id INTEGER REFERENCES periodization_phases(id),
    
    -- Session characteristics
    session_type VARCHAR(50), -- 'strength', 'power', 'speed', 'agility', 'recovery', 'combined'
    session_focus VARCHAR(100),
    duration_minutes INTEGER,
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 10),
    
    -- Session structure
    warmup_duration_minutes INTEGER,
    main_training_duration_minutes INTEGER,
    cooldown_duration_minutes INTEGER,
    
    -- Target adaptations
    primary_adaptation VARCHAR(100),
    secondary_adaptations TEXT[],
    
    -- Session frequency and scheduling
    sessions_per_week INTEGER,
    optimal_day_spacing INTEGER, -- Days between similar sessions
    
    -- Equipment and space requirements
    required_equipment TEXT[],
    space_requirement VARCHAR(100),
    indoor_alternative_available BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Detailed session structure with exercise ordering
CREATE TABLE IF NOT EXISTS session_exercise_structure (
    id SERIAL PRIMARY KEY,
    session_template_id INTEGER REFERENCES training_session_templates(id) ON DELETE CASCADE,
    exercise_id INTEGER REFERENCES exercises(id),
    
    -- Exercise placement in session
    session_segment VARCHAR(20), -- 'warmup', 'main', 'auxiliary', 'cooldown'
    exercise_order INTEGER, -- Order within the segment
    
    -- Exercise prescription for this session
    sets INTEGER,
    reps INTEGER,
    duration_seconds INTEGER,
    rest_seconds INTEGER,
    intensity_percentage DECIMAL(5,2),
    
    -- Special instructions
    tempo VARCHAR(20), -- '3-1-1', 'explosive', 'controlled'
    special_instructions TEXT,
    coaching_emphasis TEXT[],
    
    -- Superset/circuit information
    superset_group INTEGER, -- Exercises with same number are superseted
    circuit_group INTEGER, -- Circuit groupings
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- ATHLETE TRAINING ASSIGNMENTS AND TRACKING
-- =============================================================================

-- Individual athlete training assignments
CREATE TABLE IF NOT EXISTS athlete_training_assignments (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    session_template_id INTEGER REFERENCES training_session_templates(id),
    
    -- Assignment details
    assigned_date DATE,
    target_completion_date DATE,
    assigned_by VARCHAR(100), -- Coach/trainer name
    
    -- Customizations for this athlete
    modifications_made TEXT[],
    load_adjustments JSONB, -- {exercise_id: adjustment_percentage}
    alternative_exercises JSONB, -- {original_exercise_id: alternative_exercise_id}
    
    -- Assignment status
    assignment_status VARCHAR(20) DEFAULT 'assigned', -- 'assigned', 'in_progress', 'completed', 'modified', 'skipped'
    
    -- Progress tracking
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    athlete_feedback TEXT,
    coach_notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Detailed session completion tracking
CREATE TABLE IF NOT EXISTS training_session_completions (
    id SERIAL PRIMARY KEY,
    athlete_assignment_id INTEGER REFERENCES athlete_training_assignments(id) ON DELETE CASCADE,
    
    -- Session completion details
    completion_date DATE,
    actual_duration_minutes INTEGER,
    location VARCHAR(100),
    
    -- Performance tracking
    overall_session_rating INTEGER CHECK (overall_session_rating BETWEEN 1 AND 10),
    effort_level INTEGER CHECK (effort_level BETWEEN 1 AND 10),
    technique_quality INTEGER CHECK (technique_quality BETWEEN 1 AND 10),
    
    -- Physiological responses
    rpe_pre_session INTEGER CHECK (rpe_pre_session BETWEEN 1 AND 10),
    rpe_post_session INTEGER CHECK (rpe_post_session BETWEEN 1 AND 10),
    heart_rate_peak INTEGER,
    heart_rate_average INTEGER,
    
    -- Environmental factors
    temperature_fahrenheit INTEGER,
    humidity_percentage INTEGER,
    wind_conditions VARCHAR(50),
    surface_conditions VARCHAR(50),
    
    -- Equipment and modifications
    equipment_used TEXT[],
    modifications_made TEXT[],
    exercises_skipped TEXT[],
    
    -- Feedback and observations
    athlete_session_feedback TEXT,
    coach_observations TEXT,
    areas_for_improvement TEXT[],
    positive_highlights TEXT[],
    
    -- Next session recommendations
    recommended_adjustments TEXT[],
    load_recommendations JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Individual exercise performance tracking
CREATE TABLE IF NOT EXISTS exercise_performance_logs (
    id SERIAL PRIMARY KEY,
    session_completion_id INTEGER REFERENCES training_session_completions(id) ON DELETE CASCADE,
    exercise_id INTEGER REFERENCES exercises(id),
    
    -- Performance data
    sets_completed INTEGER,
    reps_completed INTEGER,
    weight_used DECIMAL(6,2),
    distance_covered DECIMAL(6,2), -- For running/sprinting exercises
    time_taken DECIMAL(6,3), -- For timed exercises
    
    -- Quality assessments
    technique_rating INTEGER CHECK (technique_rating BETWEEN 1 AND 10),
    effort_rating INTEGER CHECK (effort_rating BETWEEN 1 AND 10),
    completion_percentage DECIMAL(5,2),
    
    -- Exercise-specific notes
    exercise_notes TEXT,
    coach_feedback TEXT,
    video_analysis_notes TEXT,
    
    -- Progression tracking
    improvement_from_previous DECIMAL(6,3),
    target_for_next_session DECIMAL(6,3),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- PERFORMANCE TESTING AND BENCHMARKS
-- =============================================================================

-- Comprehensive testing protocols for S&C
CREATE TABLE IF NOT EXISTS performance_test_protocols (
    id SERIAL PRIMARY KEY,
    test_name VARCHAR(100) NOT NULL,
    test_category VARCHAR(50), -- 'strength', 'power', 'speed', 'agility', 'endurance', 'skill'
    
    -- Test specifications
    test_description TEXT,
    test_instructions TEXT[],
    equipment_needed TEXT[],
    space_requirements VARCHAR(100),
    
    -- Standardization
    warmup_protocol TEXT,
    number_of_trials INTEGER,
    rest_between_trials_seconds INTEGER,
    environmental_considerations TEXT[],
    
    -- Measurement details
    measurement_unit VARCHAR(20),
    measurement_precision DECIMAL(4,3), -- To how many decimal places
    
    -- Normative data by position and gender
    quarterback_male_elite DECIMAL(6,3),
    quarterback_male_good DECIMAL(6,3),
    quarterback_male_average DECIMAL(6,3),
    quarterback_female_elite DECIMAL(6,3),
    quarterback_female_good DECIMAL(6,3),
    quarterback_female_average DECIMAL(6,3),
    
    wide_receiver_male_elite DECIMAL(6,3),
    wide_receiver_male_good DECIMAL(6,3),
    wide_receiver_male_average DECIMAL(6,3),
    wide_receiver_female_elite DECIMAL(6,3),
    wide_receiver_female_good DECIMAL(6,3),
    wide_receiver_female_average DECIMAL(6,3),
    
    defensive_back_male_elite DECIMAL(6,3),
    defensive_back_male_good DECIMAL(6,3),
    defensive_back_male_average DECIMAL(6,3),
    defensive_back_female_elite DECIMAL(6,3),
    defensive_back_female_good DECIMAL(6,3),
    defensive_back_female_average DECIMAL(6,3),
    
    blitzer_male_elite DECIMAL(6,3),
    blitzer_male_good DECIMAL(6,3),
    blitzer_male_average DECIMAL(6,3),
    blitzer_female_elite DECIMAL(6,3),
    blitzer_female_good DECIMAL(6,3),
    blitzer_female_average DECIMAL(6,3),
    
    -- Test reliability and validity
    test_retest_reliability DECIMAL(3,2),
    validity_research TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Individual test results tracking
CREATE TABLE IF NOT EXISTS athlete_performance_tests (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    test_protocol_id INTEGER REFERENCES performance_test_protocols(id),
    
    -- Test administration details
    test_date DATE,
    tester_name VARCHAR(100),
    testing_location VARCHAR(100),
    
    -- Test conditions
    environmental_conditions JSONB,
    athlete_preparation_status VARCHAR(50), -- 'fully_rested', 'normal', 'fatigued', 'recovering'
    
    -- Results
    trial_1_result DECIMAL(6,3),
    trial_2_result DECIMAL(6,3),
    trial_3_result DECIMAL(6,3),
    best_result DECIMAL(6,3),
    average_result DECIMAL(6,3),
    
    -- Analysis
    percentile_rank INTEGER, -- Compared to position/gender peers
    rating_category VARCHAR(20), -- 'elite', 'good', 'average', 'below_average'
    improvement_from_previous DECIMAL(6,3),
    
    -- Observations
    tester_observations TEXT,
    technique_notes TEXT,
    limiting_factors TEXT[],
    
    -- Recommendations
    training_recommendations TEXT[],
    retest_recommendations TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- INJURY PREVENTION AND LOAD MANAGEMENT
-- =============================================================================

-- Training load monitoring
CREATE TABLE IF NOT EXISTS training_load_monitoring (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    
    -- Date and period
    monitoring_date DATE,
    monitoring_week DATE, -- Monday of the week being monitored
    
    -- Load metrics
    total_training_time_minutes INTEGER,
    high_intensity_time_minutes INTEGER,
    strength_training_time_minutes INTEGER,
    skill_training_time_minutes INTEGER,
    
    -- RPE-based load calculations
    session_rpe_average DECIMAL(3,1),
    weekly_training_load INTEGER, -- RPE * duration for week
    acute_chronic_workload_ratio DECIMAL(3,2),
    
    -- Recovery metrics
    sleep_hours_average DECIMAL(3,1),
    sleep_quality_rating DECIMAL(3,1),
    stress_level_rating INTEGER CHECK (stress_level_rating BETWEEN 1 AND 10),
    muscle_soreness_rating INTEGER CHECK (muscle_soreness_rating BETWEEN 1 AND 10),
    
    -- Performance readiness
    readiness_to_train_rating INTEGER CHECK (readiness_to_train_rating BETWEEN 1 AND 10),
    motivation_level INTEGER CHECK (motivation_level BETWEEN 1 AND 10),
    
    -- Risk indicators
    injury_risk_score DECIMAL(3,2), -- Calculated risk score
    overreaching_indicators TEXT[],
    warning_flags TEXT[],
    
    -- Recommendations
    load_adjustments_recommended TEXT[],
    recovery_interventions_recommended TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Injury tracking and prevention
CREATE TABLE IF NOT EXISTS injury_tracking (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    
    -- Injury details
    injury_date DATE,
    injury_type VARCHAR(100),
    injury_location VARCHAR(100), -- Body part
    injury_mechanism VARCHAR(200), -- How it occurred
    
    -- Severity assessment
    severity_rating INTEGER CHECK (severity_rating BETWEEN 1 AND 5), -- 1=minor, 5=severe
    expected_recovery_weeks INTEGER,
    medical_attention_required BOOLEAN,
    
    -- Training impact
    training_modifications_needed TEXT[],
    exercises_to_avoid TEXT[],
    alternative_exercises TEXT[],
    
    -- Recovery tracking
    recovery_status VARCHAR(50), -- 'acute', 'healing', 'rehabilitation', 'return_to_play', 'recovered'
    return_to_play_date DATE,
    clearance_obtained BOOLEAN DEFAULT FALSE,
    
    -- Prevention insights
    contributing_factors TEXT[],
    prevention_strategies TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- ANALYTICS AND REPORTING
-- =============================================================================

-- Training effectiveness analytics
CREATE TABLE IF NOT EXISTS training_effectiveness_analytics (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    
    -- Analysis period
    analysis_start_date DATE,
    analysis_end_date DATE,
    training_phase VARCHAR(50),
    
    -- Performance improvements
    speed_improvement_percentage DECIMAL(5,2),
    power_improvement_percentage DECIMAL(5,2),
    strength_improvement_percentage DECIMAL(5,2),
    agility_improvement_percentage DECIMAL(5,2),
    
    -- Specific test improvements
    forty_yard_improvement_seconds DECIMAL(4,3),
    vertical_jump_improvement_inches DECIMAL(4,1),
    l_drill_improvement_seconds DECIMAL(4,3),
    broad_jump_improvement_inches DECIMAL(4,1),
    
    -- Training consistency metrics
    sessions_completed INTEGER,
    sessions_assigned INTEGER,
    completion_percentage DECIMAL(5,2),
    average_session_quality DECIMAL(3,1),
    
    -- Load tolerance analysis
    average_weekly_load INTEGER,
    peak_weekly_load INTEGER,
    load_tolerance_score DECIMAL(3,2),
    injury_incidents INTEGER,
    
    -- Position-specific improvements
    position_specific_metrics JSONB, -- Custom metrics per position
    
    -- Predictive modeling
    projected_peak_performance JSONB,
    optimal_training_load_range JSONB,
    injury_risk_factors TEXT[],
    
    -- Recommendations
    training_adjustments TEXT[],
    focus_areas_next_phase TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Core training system indexes
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(exercise_category);
CREATE INDEX IF NOT EXISTS idx_exercises_position_relevance ON exercises(quarterback_relevance, wide_receiver_relevance, defensive_back_relevance, blitzer_rusher_relevance);
CREATE INDEX IF NOT EXISTS idx_session_templates_position_phase ON training_session_templates(position_id, phase_id);

-- Training tracking indexes
CREATE INDEX IF NOT EXISTS idx_athlete_assignments_player ON athlete_training_assignments(player_profile_id);
CREATE INDEX IF NOT EXISTS idx_session_completions_date ON training_session_completions(completion_date);
CREATE INDEX IF NOT EXISTS idx_exercise_performance_session ON exercise_performance_logs(session_completion_id);

-- Testing and analytics indexes
CREATE INDEX IF NOT EXISTS idx_performance_tests_player_date ON athlete_performance_tests(player_profile_id, test_date);
CREATE INDEX IF NOT EXISTS idx_load_monitoring_player_week ON training_load_monitoring(player_profile_id, monitoring_week);
CREATE INDEX IF NOT EXISTS idx_training_analytics_player_period ON training_effectiveness_analytics(player_profile_id, analysis_start_date, analysis_end_date);

-- =============================================================================
-- FUNCTIONS FOR AUTOMATED CALCULATIONS
-- =============================================================================

-- Function to calculate acute:chronic workload ratio
CREATE OR REPLACE FUNCTION calculate_acwr(player_id INTEGER, calculation_date DATE)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    acute_load INTEGER;
    chronic_load INTEGER;
    acwr DECIMAL(3,2);
BEGIN
    -- Calculate acute load (last 7 days)
    SELECT COALESCE(SUM(weekly_training_load), 0) INTO acute_load
    FROM training_load_monitoring
    WHERE player_profile_id = player_id
    AND monitoring_week >= calculation_date - INTERVAL '7 days'
    AND monitoring_week < calculation_date;
    
    -- Calculate chronic load (average of last 28 days)
    SELECT COALESCE(AVG(weekly_training_load), 0) INTO chronic_load
    FROM training_load_monitoring
    WHERE player_profile_id = player_id
    AND monitoring_week >= calculation_date - INTERVAL '28 days'
    AND monitoring_week < calculation_date;
    
    -- Calculate ratio
    IF chronic_load > 0 THEN
        acwr := acute_load::DECIMAL / chronic_load::DECIMAL;
    ELSE
        acwr := 0.00;
    END IF;
    
    RETURN acwr;
END;
$$ LANGUAGE plpgsql;

-- Function to assess injury risk based on multiple factors
CREATE OR REPLACE FUNCTION assess_injury_risk(player_id INTEGER, assessment_date DATE)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    acwr DECIMAL(3,2);
    recent_injuries INTEGER;
    load_spike BOOLEAN;
    risk_score DECIMAL(3,2) := 0.00;
BEGIN
    -- Get ACWR
    acwr := calculate_acwr(player_id, assessment_date);
    
    -- Count recent injuries (last 6 months)
    SELECT COUNT(*) INTO recent_injuries
    FROM injury_tracking
    WHERE player_profile_id = player_id
    AND injury_date >= assessment_date - INTERVAL '6 months';
    
    -- Check for load spike (>30% increase from previous week)
    SELECT EXISTS(
        SELECT 1 FROM training_load_monitoring tlm1
        JOIN training_load_monitoring tlm2 ON tlm2.monitoring_week = tlm1.monitoring_week - INTERVAL '7 days'
        WHERE tlm1.player_profile_id = player_id
        AND tlm1.monitoring_week = assessment_date - INTERVAL '7 days'
        AND tlm1.weekly_training_load > tlm2.weekly_training_load * 1.3
    ) INTO load_spike;
    
    -- Calculate risk score
    risk_score := 0.00;
    
    -- ACWR risk factors
    IF acwr > 1.5 THEN risk_score := risk_score + 0.30;
    ELSIF acwr > 1.3 THEN risk_score := risk_score + 0.20;
    ELSIF acwr < 0.8 THEN risk_score := risk_score + 0.15;
    END IF;
    
    -- Recent injury history
    risk_score := risk_score + (recent_injuries * 0.10);
    
    -- Load spike
    IF load_spike THEN risk_score := risk_score + 0.25; END IF;
    
    -- Cap at 1.00
    IF risk_score > 1.00 THEN risk_score := 1.00; END IF;
    
    RETURN risk_score;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INITIAL DATA POPULATION
-- =============================================================================

-- Insert position training requirements
INSERT INTO position_training_requirements (
    position_name, linear_speed_emphasis, acceleration_emphasis, agility_emphasis, 
    power_emphasis, strength_emphasis, endurance_emphasis,
    arm_strength_focus, pocket_mobility_focus, route_precision_focus, 
    backpedal_technique_focus, first_step_explosion_focus,
    primary_movement_patterns, secondary_movement_patterns,
    strength_training_percentage, speed_agility_percentage, power_development_percentage,
    skill_specific_percentage, recovery_percentage
) VALUES 
('quarterback', 6, 7, 8, 8, 7, 6, true, true, false, false, false,
 ARRAY['throwing', 'pocket_movement', 'stepping'], ARRAY['sprint', 'cutting'],
 25, 20, 20, 25, 10),
 
('wide_receiver', 10, 10, 9, 8, 6, 7, false, false, true, false, false,
 ARRAY['sprint', 'cutting', 'jumping'], ARRAY['catching', 'route_running'],
 20, 35, 25, 15, 5),
 
('defensive_back', 8, 9, 10, 7, 6, 8, false, false, false, true, false,
 ARRAY['backpedal', 'direction_change', 'sprint'], ARRAY['jumping', 'covering'],
 20, 40, 20, 15, 5),
 
('blitzer_rusher', 9, 10, 8, 9, 8, 6, false, false, false, false, true,
 ARRAY['explosive_start', 'rush_moves', 'acceleration'], ARRAY['hand_fighting', 'finishing'],
 25, 30, 30, 10, 5);

-- Insert periodization phases
INSERT INTO periodization_phases (
    phase_name, phase_order, duration_weeks, primary_focus, secondary_focus,
    volume_emphasis, intensity_emphasis,
    strength_percentage, power_percentage, speed_percentage, skill_percentage, recovery_percentage,
    baseline_testing_required, progress_testing_required, peak_testing_required
) VALUES 
('foundation', 1, 8, 'Movement quality and base strength', 'Injury prevention',
 'high', 'moderate', 40, 15, 20, 15, 10, true, false, false),
 
('development', 2, 8, 'Power development and speed enhancement', 'Skill refinement',
 'moderate', 'high', 25, 35, 25, 10, 5, false, true, false),
 
('peak', 3, 6, 'Sport-specific preparation and competition readiness', 'Peak performance',
 'moderate', 'maximum', 15, 25, 35, 20, 5, false, false, true);

COMMIT;
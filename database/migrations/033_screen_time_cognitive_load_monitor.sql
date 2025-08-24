-- Migration: Screen-Time & Cognitive Load Monitor
-- This migration adds comprehensive cognitive load monitoring and digital wellness tracking

-- 1. COGNITIVE LOAD SCORES AND MONITORING
CREATE TABLE IF NOT EXISTS cognitive_load_scores (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,
    screen_minutes INTEGER NOT NULL,
    social_media_minutes INTEGER DEFAULT 0,
    gaming_minutes INTEGER DEFAULT 0,
    work_digital_minutes INTEGER DEFAULT 0,
    entertainment_minutes INTEGER DEFAULT 0,
    total_digital_time_minutes INTEGER NOT NULL,
    cognitive_load_score INTEGER CHECK (cognitive_load_score >= 1 AND cognitive_load_score <= 10),
    mental_fatigue_level INTEGER CHECK (mental_fatigue_level >= 1 AND mental_fatigue_level >= 10),
    focus_quality_rating INTEGER CHECK (focus_quality_rating >= 1 AND focus_quality_rating <= 10),
    decision_making_speed INTEGER CHECK (decision_making_speed >= 1 AND decision_making_speed <= 10),
    memory_recall_rating INTEGER CHECK (memory_recall_rating >= 1 AND memory_recall_rating <= 10),
    reaction_time_ms INTEGER,
    attention_span_minutes INTEGER,
    multitasking_ability INTEGER CHECK (multitasking_ability >= 1 AND multitasking_ability <= 10),
    digital_stress_level INTEGER CHECK (digital_stress_level >= 1 AND digital_stress_level <= 10),
    sleep_impact_prediction VARCHAR(50), -- 'positive', 'neutral', 'negative'
    performance_impact_prediction VARCHAR(50), -- 'positive', 'neutral', 'negative'
    assessment_method VARCHAR(100), -- 'self_report', 'cognitive_test', 'behavioral_analysis', 'hybrid'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. FOCUS TRAINING SESSIONS
CREATE TABLE IF NOT EXISTS focus_training_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    session_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    session_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    task_type VARCHAR(100) NOT NULL, -- 'reading', 'problem_solving', 'meditation', 'breathing', 'cognitive_game'
    task_duration_minutes INTEGER NOT NULL,
    task_complexity VARCHAR(50), -- 'low', 'medium', 'high'
    environmental_distractions INTEGER CHECK (environmental_distractions >= 1 AND environmental_distractions <= 10),
    digital_distractions INTEGER CHECK (digital_distractions >= 1 AND digital_distractions <= 10),
    focus_quality_start INTEGER CHECK (focus_quality_start >= 1 AND focus_quality_start <= 10),
    focus_quality_end INTEGER CHECK (focus_quality_end >= 1 AND focus_quality_end <= 10),
    rpe_mental_fatigue INTEGER CHECK (rpe_mental_fatigue >= 1 AND rpe_mental_fatigue <= 10),
    task_completion_percentage DECIMAL(5,2),
    outcome VARCHAR(100), -- 'completed', 'partially_completed', 'abandoned', 'exceeded_expectations'
    breakthrough_moments TEXT[],
    challenges_encountered TEXT[],
    strategies_used TEXT[],
    improvement_areas TEXT[],
    next_session_goals TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. DIGITAL WELLNESS PROTOCOLS
CREATE TABLE IF NOT EXISTS digital_wellness_protocols (
    id SERIAL PRIMARY KEY,
    protocol_name VARCHAR(200) NOT NULL,
    protocol_description TEXT NOT NULL,
    target_cognitive_issue VARCHAR(100), -- 'digital_fatigue', 'attention_deficit', 'sleep_disruption', 'stress_escalation'
    evidence_level VARCHAR(50) NOT NULL CHECK (evidence_level IN ('very_high', 'high', 'medium', 'low')),
    implementation_duration_weeks INTEGER NOT NULL,
    daily_digital_time_limit_hours DECIMAL(4,2),
    screen_free_blocks_hours DECIMAL(4,2)[],
    app_usage_restrictions JSONB, -- specific apps and time limits
    notification_management JSONB, -- notification settings and rules
    digital_detox_periods JSONB, -- scheduled detox periods
    alternative_activities TEXT[], -- non-digital activities to replace screen time
    cognitive_enhancement_exercises TEXT[],
    sleep_hygiene_guidelines TEXT[],
    stress_reduction_techniques TEXT[],
    success_metrics TEXT[],
    expected_improvements JSONB,
    contraindications TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. COGNITIVE PERFORMANCE TRACKING
CREATE TABLE IF NOT EXISTS cognitive_performance_tracking (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tracking_date DATE NOT NULL,
    cognitive_test_type VARCHAR(100), -- 'reaction_time', 'memory', 'attention', 'processing_speed', 'executive_function'
    test_duration_minutes INTEGER,
    baseline_score DECIMAL(8,2),
    current_score DECIMAL(8,2),
    improvement_percentage DECIMAL(5,2),
    percentile_rank INTEGER,
    age_group_comparison VARCHAR(50), -- 'above_average', 'average', 'below_average'
    athlete_population_comparison VARCHAR(50),
    flag_football_position_comparison VARCHAR(50),
    cognitive_fatigue_indicator BOOLEAN DEFAULT false,
    recovery_needed BOOLEAN DEFAULT false,
    recommended_interventions TEXT[],
    next_assessment_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. DIGITAL HABIT PATTERNS
CREATE TABLE IF NOT EXISTS digital_habit_patterns (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pattern_date DATE NOT NULL,
    morning_digital_routine_minutes INTEGER,
    pre_workout_digital_time_minutes INTEGER,
    post_workout_digital_time_minutes INTEGER,
    evening_digital_routine_minutes INTEGER,
    bedtime_digital_proximity_hours DECIMAL(4,2),
    weekend_digital_pattern JSONB, -- weekend vs weekday differences
    social_media_usage_pattern JSONB, -- time of day, frequency, duration
    gaming_habits JSONB, -- game types, session lengths, timing
    work_digital_pattern JSONB, -- productivity tools, communication platforms
    entertainment_consumption JSONB, -- streaming, reading, other media
    digital_multitasking_instances INTEGER,
    context_switching_frequency INTEGER,
    notification_response_time_avg_seconds INTEGER,
    device_usage_distribution JSONB, -- phone, tablet, computer, tv
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. COGNITIVE RECOVERY PROTOCOLS
CREATE TABLE IF NOT EXISTS cognitive_recovery_protocols (
    id SERIAL PRIMARY KEY,
    protocol_name VARCHAR(200) NOT NULL,
    protocol_description TEXT NOT NULL,
    recovery_type VARCHAR(100), -- 'acute_fatigue', 'chronic_overload', 'competition_recovery', 'training_adaptation'
    recovery_duration_minutes INTEGER NOT NULL,
    recovery_intensity VARCHAR(50), -- 'passive', 'light', 'moderate', 'active'
    digital_restrictions JSONB, -- screen time limits during recovery
    cognitive_activities TEXT[], -- brain training, meditation, reading
    physical_activities TEXT[], -- light exercise, stretching, walking
    environmental_requirements JSONB, -- lighting, noise, temperature
    recovery_metrics TEXT[], -- measures of recovery success
    expected_outcomes TEXT[],
    contraindications TEXT[],
         created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. BRAIN-DRAIN INDEX CALCULATIONS
CREATE TABLE IF NOT EXISTS brain_drain_index (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL,
    screen_time_score INTEGER CHECK (screen_time_score >= 1 AND screen_time_score <= 10),
    social_media_score INTEGER CHECK (social_media_score >= 1 AND social_media_score <= 10),
    gaming_score INTEGER CHECK (gaming_score >= 1 AND gaming_score <= 10),
    work_digital_score INTEGER CHECK (work_digital_score >= 1 AND work_digital_score <= 10),
    entertainment_score INTEGER CHECK (entertainment_score >= 1 AND entertainment_score <= 10),
    notification_frequency_score INTEGER CHECK (notification_frequency_score >= 1 AND notification_frequency_score <= 10),
    multitasking_score INTEGER CHECK (multitasking_score >= 1 AND multitasking_score <= 10),
    sleep_impact_score INTEGER CHECK (sleep_impact_score >= 1 AND sleep_impact_score >= 10),
    overall_brain_drain_index DECIMAL(5,2) CHECK (overall_brain_drain_index >= 0 AND overall_brain_drain_index <= 100),
    risk_level VARCHAR(50), -- 'low', 'moderate', 'high', 'critical'
    performance_impact_prediction VARCHAR(100),
    recommended_actions TEXT[],
    next_assessment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_cognitive_load_scores_user_date ON cognitive_load_scores(user_id, assessment_date);
CREATE INDEX IF NOT EXISTS idx_cognitive_load_scores_score ON cognitive_load_scores(cognitive_load_score);
CREATE INDEX IF NOT EXISTS idx_focus_training_user_date ON focus_training_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_focus_training_task_type ON focus_training_sessions(task_type);
CREATE INDEX IF NOT EXISTS idx_cognitive_performance_user ON cognitive_performance_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_habits_user_date ON digital_habit_patterns(user_id, pattern_date);
CREATE INDEX IF NOT EXISTS idx_brain_drain_user_date ON brain_drain_index(user_id, calculation_date);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_cognitive_load_scores_unique ON cognitive_load_scores(user_id, assessment_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cognitive_performance_unique ON cognitive_performance_tracking(user_id, tracking_date, cognitive_test_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_digital_habits_unique ON digital_habit_patterns(user_id, pattern_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_brain_drain_unique ON brain_drain_index(user_id, calculation_date);

-- Insert sample digital wellness protocols
INSERT INTO digital_wellness_protocols (protocol_name, protocol_description, target_cognitive_issue, evidence_level, implementation_duration_weeks, daily_digital_time_limit_hours, screen_free_blocks_hours, alternative_activities, cognitive_enhancement_exercises, success_metrics) VALUES
('Digital Sunset Protocol', 'Gradual reduction of screen time before bedtime to improve sleep quality and cognitive recovery', 'sleep_disruption', 'high', 4, 6.0, ARRAY[2.0, 1.5], ARRAY['reading', 'meditation', 'light_stretching', 'journaling'], ARRAY['breathing_exercises', 'mindfulness_meditation', 'progressive_muscle_relaxation'], ARRAY['improved_sleep_quality', 'reduced_digital_fatigue', 'enhanced_cognitive_clarity']),

('Focus Enhancement Protocol', 'Structured approach to improving attention span and cognitive performance through digital management', 'attention_deficit', 'high', 6, 5.0, ARRAY[3.0, 2.0, 1.0], ARRAY['puzzle_solving', 'physical_exercise', 'creative_activities', 'social_interaction'], ARRAY['attention_training_games', 'concentration_exercises', 'memory_enhancement_tasks'], ARRAY['increased_attention_span', 'improved_task_completion', 'enhanced_cognitive_performance']),

('Cognitive Recovery Protocol', 'Comprehensive approach to mental fatigue recovery and cognitive restoration', 'digital_fatigue', 'medium', 3, 4.0, ARRAY[4.0, 3.0, 2.0], ARRAY['nature_walks', 'art_therapy', 'music_listening', 'social_gathering'], ARRAY['cognitive_rest_exercises', 'mental_visualization', 'creative_thinking_tasks'], ARRAY['reduced_mental_fatigue', 'improved_cognitive_clarity', 'enhanced_creativity']);

-- Insert sample cognitive recovery protocols
INSERT INTO cognitive_recovery_protocols (protocol_name, protocol_description, recovery_type, recovery_duration_minutes, recovery_intensity, digital_restrictions, cognitive_activities, physical_activities, recovery_metrics) VALUES
('Acute Mental Fatigue Recovery', 'Quick recovery protocol for immediate cognitive fatigue relief', 'acute_fatigue', 30, 'passive', '{"screen_time_limit": 15, "notification_silence": true}', ARRAY['mindfulness_meditation', 'deep_breathing', 'mental_visualization'], ARRAY['gentle_stretching', 'slow_walking', 'yoga_poses'], ARRAY['mental_clarity_rating', 'fatigue_reduction', 'focus_improvement']),

('Competition Day Cognitive Prep', 'Pre-competition cognitive preparation and mental clarity optimization', 'competition_recovery', 45, 'light', '{"screen_time_limit": 30, "social_media_avoidance": true}', ARRAY['mental_rehearsal', 'positive_visualization', 'concentration_exercises'], ARRAY['dynamic_stretching', 'light_cardio', 'balance_exercises'], ARRAY['mental_alertness', 'decision_making_speed', 'reaction_time']),

('Training Adaptation Recovery', 'Recovery protocol for cognitive adaptation to new training stimuli', 'training_adaptation', 60, 'moderate', '{"screen_time_limit": 45, "work_digital_restriction": true}', ARRAY['cognitive_skill_practice', 'strategy_planning', 'performance_analysis'], ARRAY['moderate_exercise', 'skill_drills', 'coordination_work'], ARRAY['learning_retention', 'skill_improvement', 'cognitive_adaptation']);

-- Create function to calculate brain-drain index
CREATE OR REPLACE FUNCTION calculate_brain_drain_index(
    user_id_param UUID,
    target_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB AS $$
DECLARE
    screen_time_data JSONB;
    cognitive_data JSONB;
    sleep_data JSONB;
    brain_drain_score DECIMAL;
    risk_level VARCHAR;
    recommendations TEXT[];
BEGIN
    -- Get recent screen time patterns
    SELECT jsonb_build_object(
        'total_screen_time', COALESCE(SUM(duration_minutes), 0),
        'social_media_time', COALESCE(SUM(CASE WHEN app_category = 'social_media' THEN duration_minutes ELSE 0 END), 0),
        'gaming_time', COALESCE(SUM(CASE WHEN app_category = 'gaming' THEN duration_minutes ELSE 0 END), 0),
        'work_digital_time', COALESCE(SUM(CASE WHEN app_category = 'work' THEN duration_minutes ELSE 0 END), 0)
    ) INTO screen_time_data
    FROM screen_time_events 
    WHERE user_id = user_id_param 
    AND start_timestamp >= target_date - INTERVAL '7 days';
    
    -- Get recent cognitive performance data
    SELECT jsonb_build_object(
        'avg_focus_quality', AVG(focus_quality_rating),
        'avg_mental_fatigue', AVG(rpe_mental_fatigue),
        'task_completion_rate', AVG(task_completion_percentage)
    ) INTO cognitive_data
    FROM focus_training_sessions 
    WHERE user_id = user_id_param 
    AND session_date >= target_date - INTERVAL '7 days';
    
    -- Get recent sleep data
    SELECT jsonb_build_object(
        'avg_sleep_quality', AVG(sleep_quality_rating),
        'avg_sleep_efficiency', AVG(sleep_efficiency),
        'screen_time_before_bed', AVG(screen_time_before_bed_minutes)
    ) INTO sleep_data
    FROM sleep_logs 
    WHERE user_id = user_id_param 
    AND sleep_date >= target_date - INTERVAL '7 days';
    
    -- Calculate brain-drain score (0-100, higher = more brain drain)
    brain_drain_score := 0;
    
    -- Screen time contribution (40% weight)
    IF (screen_time_data->>'total_screen_time')::numeric > 480 THEN -- >8 hours
        brain_drain_score := brain_drain_score + 40;
    ELSIF (screen_time_data->>'total_screen_time')::numeric > 360 THEN -- >6 hours
        brain_drain_score := brain_drain_score + 30;
    ELSIF (screen_time_data->>'total_screen_time')::numeric > 240 THEN -- >4 hours
        brain_drain_score := brain_drain_score + 20;
    END IF;
    
    -- Social media contribution (25% weight)
    IF (screen_time_data->>'social_media_time')::numeric > 120 THEN -- >2 hours
        brain_drain_score := brain_drain_score + 25;
    ELSIF (screen_time_data->>'social_media_time')::numeric > 60 THEN -- >1 hour
        brain_drain_score := brain_drain_score + 15;
    END IF;
    
    -- Gaming contribution (20% weight)
    IF (screen_time_data->>'gaming_time')::numeric > 180 THEN -- >3 hours
        brain_drain_score := brain_drain_score + 20;
    ELSIF (screen_time_data->>'gaming_time')::numeric > 90 THEN -- >1.5 hours
        brain_drain_score := brain_drain_score + 10;
    END IF;
    
    -- Sleep impact contribution (15% weight)
    IF (sleep_data->>'screen_time_before_bed')::numeric < 120 THEN -- <2 hours before bed
        brain_drain_score := brain_drain_score + 15;
    ELSIF (sleep_data->>'screen_time_before_bed')::numeric < 60 THEN -- <1 hour before bed
        brain_drain_score := brain_drain_score + 10;
    END IF;
    
    -- Determine risk level
    IF brain_drain_score >= 80 THEN
        risk_level := 'critical';
    ELSIF brain_drain_score >= 60 THEN
        risk_level := 'high';
    ELSIF brain_drain_score >= 40 THEN
        risk_level := 'moderate';
    ELSE
        risk_level := 'low';
    END IF;
    
    -- Generate recommendations
    IF brain_drain_score >= 60 THEN
        recommendations := ARRAY[
            'Implement digital sunset protocol',
            'Reduce social media usage',
            'Increase screen-free activities',
            'Prioritize sleep hygiene'
        ];
    ELSIF brain_drain_score >= 40 THEN
        recommendations := ARRAY[
            'Monitor screen time patterns',
            'Take regular digital breaks',
            'Practice focus training exercises'
        ];
    ELSE
        recommendations := ARRAY[
            'Maintain current digital habits',
            'Continue cognitive enhancement activities'
        ];
    END IF;
    
    RETURN jsonb_build_object(
        'brain_drain_score', brain_drain_score,
        'risk_level', risk_level,
        'screen_time_analysis', screen_time_data,
        'cognitive_analysis', cognitive_data,
        'sleep_analysis', sleep_data,
        'recommendations', recommendations,
        'next_assessment_date', target_date + INTERVAL '7 days'
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to predict cognitive performance
CREATE OR REPLACE FUNCTION predict_cognitive_performance(
    user_id_param UUID,
    target_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB AS $$
DECLARE
    brain_drain_data JSONB;
    sleep_data JSONB;
    training_data JSONB;
    prediction_score INTEGER;
    factors JSONB;
BEGIN
    -- Get brain-drain index
    brain_drain_data := calculate_brain_drain_index(user_id_param, target_date);
    
    -- Get recent sleep data
    SELECT jsonb_build_object(
        'avg_sleep_quality', AVG(sleep_quality_rating),
        'avg_sleep_hours', AVG(total_sleep_hours),
        'sleep_consistency', STDDEV(bedtime::time)
    ) INTO sleep_data
    FROM sleep_logs 
    WHERE user_id = user_id_param 
    AND sleep_date >= target_date - INTERVAL '7 days';
    
    -- Calculate prediction score (1-10, higher = better performance)
    prediction_score := 7; -- Base score
    
    -- Adjust based on brain-drain index
    IF (brain_drain_data->>'brain_drain_score')::numeric > 60 THEN
        prediction_score := prediction_score - 2;
    ELSIF (brain_drain_data->>'brain_drain_score')::numeric > 40 THEN
        prediction_score := prediction_score - 1;
    END IF;
    
    -- Adjust based on sleep quality
    IF (sleep_data->>'avg_sleep_quality')::numeric < 6 THEN
        prediction_score := prediction_score - 1;
    ELSIF (sleep_data->>'avg_sleep_quality')::numeric >= 8 THEN
        prediction_score := prediction_score + 1;
    END IF;
    
    -- Adjust based on sleep consistency
    IF (sleep_data->>'sleep_consistency')::numeric > 120 THEN -- >2 hours variance
        prediction_score := prediction_score - 1;
    END IF;
    
    -- Ensure score stays within bounds
    prediction_score := GREATEST(1, LEAST(10, prediction_score));
    
    -- Build factors object
    factors := jsonb_build_object(
        'brain_drain_index', brain_drain_data,
        'sleep_analysis', sleep_data,
        'recommendations', ARRAY[
            'Limit screen time to 6 hours daily',
            'Implement digital sunset 2 hours before bed',
            'Maintain consistent sleep schedule',
            'Practice focus training exercises'
        ]
    );
    
    RETURN jsonb_build_object(
        'predicted_cognitive_performance', prediction_score,
        'confidence_level', 'medium',
        'factors', factors
    );
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for cognitive wellness summary
CREATE MATERIALIZED VIEW IF NOT EXISTS cognitive_wellness_summary AS
SELECT 
    user_id,
    AVG(cognitive_load_score) as avg_cognitive_load,
    AVG(focus_quality_rating) as avg_focus_quality,
    AVG(mental_fatigue_level) as avg_mental_fatigue,
    COUNT(*) as assessment_count,
    MIN(assessment_date) as first_assessment_date,
    MAX(assessment_date) as last_assessment_date,
    STDDEV(cognitive_load_score) as cognitive_load_consistency,
    calculate_brain_drain_index(user_id) as current_brain_drain
FROM cognitive_load_scores 
GROUP BY user_id
ORDER BY avg_cognitive_load DESC;

-- Add comments
COMMENT ON TABLE cognitive_load_scores IS 'Comprehensive cognitive load assessment and monitoring';
COMMENT ON TABLE focus_training_sessions IS 'Structured focus training and cognitive enhancement sessions';
COMMENT ON TABLE digital_wellness_protocols IS 'Evidence-based digital wellness and cognitive optimization protocols';
COMMENT ON TABLE cognitive_performance_tracking IS 'Longitudinal cognitive performance tracking and benchmarking';
COMMENT ON TABLE digital_habit_patterns IS 'Detailed analysis of digital usage patterns and habits';
COMMENT ON TABLE cognitive_recovery_protocols IS 'Structured protocols for cognitive recovery and restoration';
COMMENT ON TABLE brain_drain_index IS 'Comprehensive brain-drain index calculations and risk assessment';
COMMENT ON FUNCTION calculate_brain_drain_index IS 'Calculate comprehensive brain-drain index based on digital habits and cognitive patterns';
COMMENT ON FUNCTION predict_cognitive_performance IS 'Predict cognitive performance based on brain-drain index and sleep patterns';

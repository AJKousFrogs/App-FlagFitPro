-- Migration: Recovery and Rest System
-- Description: Sleep tracking, recovery sessions, rest day planning, and restoration metrics
-- Created: 2024-10-15

-- Sleep tracking and quality assessment
CREATE TABLE user_sleep_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Sleep timing
    sleep_date DATE NOT NULL, -- the night of sleep (e.g., Oct 15 for Oct 15-16 night)
    bedtime TIMESTAMP NOT NULL,
    wake_time TIMESTAMP NOT NULL,
    
    -- Sleep duration calculations
    time_to_fall_asleep_minutes INTEGER, -- sleep latency
    total_sleep_time_minutes INTEGER NOT NULL, -- actual sleep time
    time_in_bed_minutes INTEGER NOT NULL, -- total time in bed
    sleep_efficiency DECIMAL(5,2), -- (total_sleep_time / time_in_bed) * 100
    
    -- Sleep stages (if available from device)
    rem_sleep_minutes INTEGER,
    deep_sleep_minutes INTEGER,
    light_sleep_minutes INTEGER,
    awake_time_minutes INTEGER, -- time awake during night
    
    -- Sleep quality metrics
    sleep_quality_rating INTEGER CHECK (sleep_quality_rating BETWEEN 1 AND 10),
    restfulness_rating INTEGER CHECK (restfulness_rating BETWEEN 1 AND 10),
    morning_energy_level INTEGER CHECK (morning_energy_level BETWEEN 1 AND 10),
    
    -- Environmental factors
    room_temperature_celsius DECIMAL(4,2),
    noise_level VARCHAR(50), -- quiet, moderate, noisy
    light_exposure VARCHAR(50), -- dark, dim, bright
    
    -- Pre-sleep factors
    caffeine_after_2pm BOOLEAN DEFAULT false,
    alcohol_consumed BOOLEAN DEFAULT false,
    screen_time_before_bed_minutes INTEGER,
    exercise_within_4_hours BOOLEAN DEFAULT false,
    
    -- Training context
    training_day BOOLEAN DEFAULT false,
    training_intensity VARCHAR(50), -- light, moderate, high, very_high
    training_session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
    
    -- Recovery impact
    muscle_soreness_level INTEGER CHECK (muscle_soreness_level BETWEEN 1 AND 10),
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
    
    -- Data source
    tracking_method VARCHAR(50), -- manual, wearable, phone_sensor, smart_mattress
    device_data JSONB, -- raw data from tracking device
    
    -- User notes
    notes TEXT,
    sleep_disruptions TEXT[], -- noise, bathroom, stress, pain, etc.
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recovery sessions (active recovery activities)
CREATE TABLE recovery_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    
    -- Session basics
    session_date DATE NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    
    -- Recovery type
    recovery_type VARCHAR(50) NOT NULL, -- stretching, massage, foam_rolling, ice_bath, sauna, meditation, yoga, light_walking
    intensity_level VARCHAR(50), -- light, moderate, intensive
    
    -- Specific activities
    activities JSONB, -- structured data about specific recovery activities
    
    -- Location and equipment
    location VARCHAR(100), -- home, gym, field, spa, outdoors
    equipment_used TEXT[], -- foam_roller, massage_gun, ice_bath, compression_gear
    
    -- Guidance and supervision
    guided_session BOOLEAN DEFAULT false,
    instructor_name VARCHAR(255),
    program_followed VARCHAR(255), -- specific recovery program or routine
    
    -- Pre-session condition
    pre_session_soreness INTEGER CHECK (pre_session_soreness BETWEEN 1 AND 10),
    pre_session_stiffness INTEGER CHECK (pre_session_stiffness BETWEEN 1 AND 10),
    pre_session_energy INTEGER CHECK (pre_session_energy BETWEEN 1 AND 10),
    
    -- Post-session outcomes
    post_session_soreness INTEGER CHECK (post_session_soreness BETWEEN 1 AND 10),
    post_session_stiffness INTEGER CHECK (post_session_stiffness BETWEEN 1 AND 10),
    post_session_energy INTEGER CHECK (post_session_energy BETWEEN 1 AND 10),
    
    -- Overall effectiveness
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 10),
    would_repeat BOOLEAN,
    
    -- Training context
    related_training_session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
    days_since_last_training INTEGER,
    days_until_next_training INTEGER,
    
    -- Biometric data
    heart_rate_avg INTEGER,
    heart_rate_variability DECIMAL(5,2),
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rest day planning and activities
CREATE TABLE rest_day_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    
    -- Planning details
    rest_date DATE NOT NULL,
    plan_type VARCHAR(50) NOT NULL, -- complete_rest, active_recovery, light_activity
    
    -- Planned activities
    planned_activities JSONB, -- structured list of planned recovery/rest activities
    planned_nutrition_focus TEXT[], -- hydration, anti_inflammatory, protein, etc.
    planned_sleep_target INTEGER, -- target sleep hours
    
    -- Goals for the rest day
    primary_goal VARCHAR(100), -- muscle_recovery, mental_rest, injury_prevention, preparation
    secondary_goals TEXT[],
    
    -- Created by
    created_by VARCHAR(50), -- user, coach, ai_recommendation
    coach_notes TEXT,
    
    -- Compliance and outcomes
    plan_followed_percentage INTEGER CHECK (plan_followed_percentage BETWEEN 0 AND 100),
    actual_activities JSONB, -- what actually happened
    outcome_rating INTEGER CHECK (outcome_rating BETWEEN 1 AND 10),
    
    -- Next day preparation
    prepared_for_next_training BOOLEAN,
    energy_level_next_day INTEGER CHECK (energy_level_next_day BETWEEN 1 AND 10),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily wellness and recovery metrics
CREATE TABLE daily_wellness_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    metric_date DATE NOT NULL,
    recorded_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Subjective wellness metrics (usually recorded morning)
    overall_wellness INTEGER CHECK (overall_wellness BETWEEN 1 AND 10),
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
    muscle_soreness INTEGER CHECK (muscle_soreness BETWEEN 1 AND 10),
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
    motivation_level INTEGER CHECK (motivation_level BETWEEN 1 AND 10),
    
    -- Physical readiness
    readiness_to_train INTEGER CHECK (readiness_to_train BETWEEN 1 AND 10),
    injury_concerns TEXT[],
    pain_areas TEXT[], -- hamstring, shoulder, ankle, etc.
    pain_levels JSONB, -- map of pain_area -> pain_level (1-10)
    
    -- Mental state
    mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 10),
    focus_level INTEGER CHECK (focus_level BETWEEN 1 AND 10),
    anxiety_level INTEGER CHECK (anxiety_level BETWEEN 1 AND 10),
    
    -- Physiological metrics (if available)
    resting_heart_rate INTEGER,
    heart_rate_variability DECIMAL(5,2),
    body_weight_kg DECIMAL(5,2),
    body_fat_percentage DECIMAL(4,2),
    
    -- Hydration status
    urine_color INTEGER CHECK (urine_color BETWEEN 1 AND 8), -- hydration chart scale
    thirst_level INTEGER CHECK (thirst_level BETWEEN 1 AND 5),
    
    -- Sleep reference
    sleep_session_id UUID REFERENCES user_sleep_sessions(id) ON DELETE SET NULL,
    
    -- External factors
    weather_impact VARCHAR(50), -- none, positive, negative
    schedule_stress VARCHAR(50), -- low, moderate, high
    social_factors VARCHAR(50), -- positive, neutral, negative
    
    -- Notes and observations
    notes TEXT,
    coach_observations TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recovery recommendations and protocols
CREATE TABLE recovery_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Recommendation context
    date_generated DATE NOT NULL,
    recommendation_type VARCHAR(50) NOT NULL, -- post_training, rest_day, pre_competition, injury_prevention
    
    -- Training context
    training_load_last_7_days INTEGER, -- accumulated training stress
    upcoming_training_importance VARCHAR(50), -- low, moderate, high, competition
    days_until_competition INTEGER,
    
    -- Current recovery status
    recovery_score INTEGER CHECK (recovery_score BETWEEN 1 AND 100),
    fatigue_level VARCHAR(50), -- low, moderate, high, extreme
    
    -- Specific recommendations
    recommended_activities TEXT[] NOT NULL,
    recommended_duration_minutes INTEGER,
    priority_level VARCHAR(50), -- low, medium, high, critical
    
    -- Timing guidance
    timing_guidance TEXT, -- "within 30 minutes after training", "before bedtime"
    optimal_timing TIMESTAMP,
    
    -- Detailed guidance
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    step_by_step_instructions TEXT[],
    
    -- Equipment or resources needed
    equipment_needed TEXT[],
    estimated_cost DECIMAL(8,2),
    
    -- AI reasoning
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    reasoning TEXT,
    data_sources TEXT[], -- sleep_data, training_load, wellness_metrics, etc.
    
    -- User interaction
    viewed BOOLEAN DEFAULT false,
    followed BOOLEAN DEFAULT false,
    user_feedback INTEGER CHECK (user_feedback BETWEEN 1 AND 5),
    
    -- Effectiveness tracking
    recovery_improvement_tracked BOOLEAN DEFAULT false,
    recovery_improvement_score INTEGER, -- 1-10 scale of improvement
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Injury prevention and monitoring
CREATE TABLE injury_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Injury details
    injury_date DATE NOT NULL,
    body_part VARCHAR(100) NOT NULL, -- ankle, knee, shoulder, hamstring, etc.
    injury_type VARCHAR(100), -- strain, sprain, bruise, overuse, acute
    severity_level VARCHAR(50), -- minor, moderate, major, severe
    
    -- Incident details
    how_occurred TEXT, -- during training, game, daily activity
    training_session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
    immediate_cause TEXT,
    
    -- Symptoms and assessment
    pain_level INTEGER CHECK (pain_level BETWEEN 1 AND 10),
    swelling_level INTEGER CHECK (swelling_level BETWEEN 1 AND 5),
    range_of_motion_affected BOOLEAN DEFAULT false,
    functional_limitation TEXT,
    
    -- Treatment and care
    immediate_treatment TEXT[],
    medical_attention_sought BOOLEAN DEFAULT false,
    healthcare_provider VARCHAR(255),
    diagnosis TEXT,
    treatment_plan TEXT,
    
    -- Recovery tracking
    estimated_recovery_days INTEGER,
    actual_recovery_days INTEGER,
    return_to_activity_date DATE,
    return_to_full_activity_date DATE,
    
    -- Prevention insights
    preventable_factors TEXT[],
    contributing_factors TEXT[], -- fatigue, poor_warmup, equipment, environment
    prevention_recommendations TEXT[],
    
    -- Current status
    current_status VARCHAR(50), -- acute, recovering, healed, chronic
    affects_training BOOLEAN DEFAULT true,
    training_modifications TEXT[],
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recovery equipment and resource tracking
CREATE TABLE recovery_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    
    equipment_name VARCHAR(255) NOT NULL,
    equipment_type VARCHAR(100), -- foam_roller, massage_gun, compression_gear, ice_bath, etc.
    brand VARCHAR(255),
    
    -- Acquisition details
    purchase_date DATE,
    cost DECIMAL(8,2),
    purchase_location VARCHAR(255),
    
    -- Usage tracking
    frequency_of_use VARCHAR(50), -- daily, weekly, as_needed
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 10),
    
    -- Maintenance
    last_maintenance_date DATE,
    maintenance_needed BOOLEAN DEFAULT false,
    replacement_due_date DATE,
    
    -- Sharing (for team equipment)
    shared_equipment BOOLEAN DEFAULT false,
    available_for_team_use BOOLEAN DEFAULT false,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_user_sleep_sessions_user_date ON user_sleep_sessions(user_id, sleep_date);
CREATE INDEX idx_user_sleep_sessions_training ON user_sleep_sessions(training_session_id) WHERE training_session_id IS NOT NULL;

CREATE INDEX idx_recovery_sessions_user_date ON recovery_sessions(user_id, session_date);
CREATE INDEX idx_recovery_sessions_type ON recovery_sessions(recovery_type);

CREATE INDEX idx_rest_day_plans_user_date ON rest_day_plans(user_id, rest_date);

CREATE INDEX idx_daily_wellness_metrics_user_date ON daily_wellness_metrics(user_id, metric_date);

CREATE INDEX idx_recovery_recommendations_user_date ON recovery_recommendations(user_id, date_generated);
CREATE INDEX idx_recovery_recommendations_active ON recovery_recommendations(user_id, expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_injury_monitoring_user_date ON injury_monitoring(user_id, injury_date);
CREATE INDEX idx_injury_monitoring_body_part ON injury_monitoring(body_part);
CREATE INDEX idx_injury_monitoring_active ON injury_monitoring(current_status) WHERE current_status IN ('acute', 'recovering');

-- Note: TimescaleDB hypertables commented out for standard PostgreSQL
-- SELECT create_hypertable('user_sleep_sessions', 'bedtime');
-- SELECT create_hypertable('recovery_sessions', 'start_time');
-- SELECT create_hypertable('daily_wellness_metrics', 'recorded_time');

-- Add update triggers
CREATE TRIGGER update_user_sleep_sessions_updated_at
    BEFORE UPDATE ON user_sleep_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recovery_sessions_updated_at
    BEFORE UPDATE ON recovery_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rest_day_plans_updated_at
    BEFORE UPDATE ON rest_day_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_wellness_metrics_updated_at
    BEFORE UPDATE ON daily_wellness_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_injury_monitoring_updated_at
    BEFORE UPDATE ON injury_monitoring
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recovery_equipment_updated_at
    BEFORE UPDATE ON recovery_equipment
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
-- Migration: Sleep & Circadian Rhythm System
-- This migration adds comprehensive sleep optimization and monitoring

-- 1. SLEEP LOGS AND MONITORING
CREATE TABLE IF NOT EXISTS sleep_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sleep_date DATE NOT NULL,
    bedtime TIMESTAMP WITH TIME ZONE NOT NULL,
    wake_time TIMESTAMP WITH TIME ZONE NOT NULL,
    total_sleep_hours DECIMAL(4,2) NOT NULL,
    time_in_bed_hours DECIMAL(4,2) NOT NULL,
    sleep_efficiency DECIMAL(5,2) CHECK (sleep_efficiency >= 0 AND sleep_efficiency <= 100),
    deep_sleep_hours DECIMAL(4,2),
    rem_sleep_hours DECIMAL(4,2),
    light_sleep_hours DECIMAL(4,2),
    awake_time_minutes INTEGER,
    sleep_quality_rating INTEGER CHECK (sleep_quality_rating >= 1 AND sleep_quality_rating <= 10),
    restfulness_rating INTEGER CHECK (restfulness_rating >= 1 AND restfulness_rating <= 10),
    morning_energy_level INTEGER CHECK (morning_energy_level >= 1 AND morning_energy_level <= 10),
    room_temperature_celsius DECIMAL(4,1),
    noise_level VARCHAR(50), -- 'quiet', 'moderate', 'loud'
    light_exposure VARCHAR(50), -- 'dark', 'dim', 'bright'
    caffeine_after_2pm BOOLEAN DEFAULT false,
    alcohol_consumed BOOLEAN DEFAULT false,
    screen_time_before_bed_minutes INTEGER,
    exercise_within_4_hours BOOLEAN DEFAULT false,
    training_day BOOLEAN DEFAULT false,
    training_intensity VARCHAR(50), -- 'low', 'moderate', 'high'
    muscle_soreness_level INTEGER CHECK (muscle_soreness_level >= 1 AND muscle_soreness_level <= 10),
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
    tracking_method VARCHAR(50), -- 'manual', 'wearable', 'app', 'hybrid'
    device_data JSONB, -- raw data from sleep tracking devices
    sleep_disruptions TEXT[], -- array of disruption types
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. SLEEP GUIDELINES AND EVIDENCE
CREATE TABLE IF NOT EXISTS sleep_guidelines (
    id SERIAL PRIMARY KEY,
    evidence_level VARCHAR(50) NOT NULL CHECK (evidence_level IN ('very_high', 'high', 'medium', 'low')),
    recommendation TEXT NOT NULL,
    citation_id VARCHAR(255),
    citation_title TEXT,
    citation_authors TEXT[],
    citation_journal VARCHAR(255),
    citation_year INTEGER,
    citation_doi VARCHAR(255),
    target_athlete_type VARCHAR(100), -- 'elite', 'competitive', 'recreational', 'all'
    target_age_group VARCHAR(50), -- 'adolescent', 'young_adult', 'adult', 'masters'
    target_position VARCHAR(100), -- specific flag football positions
    sleep_phase VARCHAR(50), -- 'bedtime', 'sleep_quality', 'wake_time', 'recovery'
    implementation_steps TEXT[],
    expected_benefits TEXT[],
    contraindications TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SCREEN TIME MONITORING
CREATE TABLE IF NOT EXISTS screen_time_events (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    end_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    device_type VARCHAR(100) NOT NULL, -- 'phone', 'tablet', 'computer', 'tv'
    app_category VARCHAR(100), -- 'social_media', 'gaming', 'work', 'entertainment'
    app_name VARCHAR(200),
    duration_minutes INTEGER NOT NULL,
    blue_light_exposure BOOLEAN DEFAULT true,
    content_type VARCHAR(100), -- 'passive', 'interactive', 'productive', 'distracting'
    location VARCHAR(100), -- 'bedroom', 'living_room', 'office', 'other'
    proximity_to_bedtime_hours DECIMAL(4,2), -- hours before bedtime
    impact_on_sleep_predicted VARCHAR(50), -- 'positive', 'neutral', 'negative'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SLEEP OPTIMIZATION PROTOCOLS
CREATE TABLE IF NOT EXISTS sleep_optimization_protocols (
    id SERIAL PRIMARY KEY,
    protocol_name VARCHAR(200) NOT NULL,
    protocol_description TEXT NOT NULL,
    target_sleep_issue VARCHAR(100), -- 'insomnia', 'poor_quality', 'irregular_schedule', 'jet_lag'
    evidence_level VARCHAR(50) NOT NULL,
    implementation_duration_weeks INTEGER NOT NULL,
    bedtime_routine_duration_minutes INTEGER,
    pre_sleep_activities TEXT[],
    activities_to_avoid TEXT[],
    environmental_requirements JSONB, -- temperature, light, noise, bedding
    nutrition_guidelines TEXT[],
    supplement_recommendations TEXT[],
    exercise_timing_guidelines TEXT[],
    technology_restrictions JSONB, -- screen time limits, device usage rules
    success_metrics TEXT[],
    expected_improvements JSONB, -- sleep quality, energy, performance
    contraindications TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. SLEEP PERFORMANCE CORRELATIONS
CREATE TABLE IF NOT EXISTS sleep_performance_correlations (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    correlation_date DATE NOT NULL,
    sleep_metric VARCHAR(100) NOT NULL, -- 'total_hours', 'efficiency', 'deep_sleep', 'rem_sleep'
    performance_metric VARCHAR(100) NOT NULL, -- 'sprint_speed', 'reaction_time', 'endurance', 'strength'
    correlation_strength DECIMAL(3,2) CHECK (correlation_strength >= -1 AND correlation_strength <= 1),
    sample_size INTEGER NOT NULL,
    study_period_days INTEGER NOT NULL,
    statistical_significance BOOLEAN DEFAULT false,
    p_value DECIMAL(10,6),
    confidence_interval_lower DECIMAL(3,2),
    confidence_interval_upper DECIMAL(3,2),
    practical_significance TEXT,
    recommendations TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. SLEEP COACHING AND INTERVENTIONS
CREATE TABLE IF NOT EXISTS sleep_coaching_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    coach_id UUID REFERENCES users(id),
    session_type VARCHAR(100) NOT NULL, -- 'assessment', 'intervention', 'follow_up', 'crisis'
    sleep_issue_identified TEXT,
    intervention_plan TEXT,
    recommended_protocols TEXT[],
    homework_assignments TEXT[],
    follow_up_date DATE,
    session_notes TEXT,
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 10),
    user_compliance_percentage DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SLEEP RESEARCH AND EVIDENCE
CREATE TABLE IF NOT EXISTS sleep_research_studies (
    id SERIAL PRIMARY KEY,
    study_title TEXT NOT NULL,
    authors TEXT[] NOT NULL,
    journal VARCHAR(255),
    publication_year INTEGER,
    doi VARCHAR(255),
    pmid INTEGER,
    study_type VARCHAR(100), -- 'randomized_control', 'cohort', 'cross_sectional', 'meta_analysis'
    sample_size INTEGER,
    population_description TEXT,
    study_duration_weeks INTEGER,
    sleep_interventions_studied TEXT[],
    control_conditions TEXT[],
    outcome_measures TEXT[],
    primary_findings TEXT,
    effect_sizes JSONB,
    statistical_significance VARCHAR(50),
    clinical_significance TEXT,
    study_quality_rating VARCHAR(50),
    risk_of_bias TEXT[],
    limitations TEXT[],
    practical_applications TEXT[],
    flag_football_relevance VARCHAR(50), -- 'high', 'medium', 'low'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON sleep_logs(user_id, sleep_date);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_quality ON sleep_logs(sleep_quality_rating);
CREATE INDEX IF NOT EXISTS idx_screen_time_user_timestamp ON screen_time_events(user_id, start_timestamp);
CREATE INDEX IF NOT EXISTS idx_screen_time_bedtime ON screen_time_events(proximity_to_bedtime_hours);
CREATE INDEX IF NOT EXISTS idx_sleep_performance_user ON sleep_performance_correlations(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_coaching_user ON sleep_coaching_sessions(user_id);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_sleep_logs_unique ON sleep_logs(user_id, sleep_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_screen_time_unique ON screen_time_events(user_id, start_timestamp, device_type);

-- Insert sample sleep guidelines based on research
INSERT INTO sleep_guidelines (evidence_level, recommendation, citation_title, citation_authors, citation_journal, citation_year, target_athlete_type, sleep_phase, implementation_steps, expected_benefits) VALUES
('very_high', 'Athletes should aim for 7-9 hours of sleep per night for optimal performance and recovery', 'Sleep and Athletic Performance: Impacts on Physical Performance, Mental Performance, Injury Risk and Recovery in Athletes', ARRAY['Watson AM'], 'Sleep Medicine Clinics', 2017, 'all', 'sleep_quality', ARRAY['Establish consistent sleep schedule', 'Create dark, quiet sleep environment', 'Avoid screens 1 hour before bed'], ARRAY['improved reaction time', 'better decision making', 'enhanced recovery', 'reduced injury risk']),

('high', 'Avoid screen time within 90 minutes of bedtime to improve sleep quality', 'The effects of mobile phone dependence on athletic performance', ARRAY['Zhang L', 'Wang H'], 'BMC Sports Science', 2023, 'all', 'bedtime', ARRAY['Set phone to do not disturb', 'Use blue light filters', 'Establish screen-free bedtime routine'], ARRAY['faster sleep onset', 'deeper sleep', 'improved sleep efficiency']),

('high', 'Maintain consistent sleep schedule even on weekends to optimize circadian rhythm', 'Sleep and Athletic Performance: A Review', ARRAY['Halson SL'], 'Sports Medicine', 2014, 'elite', 'sleep_quality', ARRAY['Set consistent bedtime alarm', 'Avoid sleeping in more than 1 hour', 'Maintain regular meal times'], ARRAY['better sleep quality', 'improved daytime alertness', 'enhanced performance consistency']);

-- Insert sample sleep optimization protocols
INSERT INTO sleep_optimization_protocols (recommended_sleep_duration_hours, sleep_efficiency_target_percentage, deep_sleep_target_percentage, rem_sleep_target_percentage, pre_sleep_routine_duration_minutes, bedroom_temperature_celsius, light_exposure_guidelines, electronic_device_cutoff_hours, pre_sleep_nutrition_guidelines, sleep_promoting_supplements, supplements_to_avoid, caffeine_cutoff_hours, room_darkness_requirements, noise_management, bedding_recommendations, performance_improvement_with_optimization, injury_risk_reduction_percentage, cognitive_performance_benefits, immune_function_benefits, recommended_tracking_metrics) VALUES
(8.0, 85, 20, 25, 90, 18.5, ARRAY['dark_environment', 'no_blue_light'], 2.0, ARRAY['light_snack', 'avoid_large_meals'], ARRAY['magnesium', 'melatonin'], ARRAY['stimulants', 'alcohol'], 6, 'complete_darkness', ARRAY['white_noise', 'earplugs'], ARRAY['cooling_pillow', 'breathable_sheets'], 15.5, 12.3, ARRAY['improved_focus', 'better_reaction_time'], ARRAY['enhanced_immune_response'], ARRAY['sleep_duration', 'sleep_efficiency', 'deep_sleep_percentage']),

(8.5, 90, 22, 27, 60, 19.0, ARRAY['consistent_lighting', 'natural_light_exposure'], 3.0, ARRAY['regular_meal_times', 'protein_rich_dinner'], ARRAY['valerian_root', 'chamomile'], ARRAY['caffeine', 'nicotine'], 8, 'controlled_darkness', ARRAY['sound_machine', 'quiet_environment'], ARRAY['ergonomic_pillow', 'temperature_regulating'], 18.2, 15.7, ARRAY['enhanced_alertness', 'improved_memory'], ARRAY['better_stress_response'], ARRAY['sleep_consistency', 'wake_time_regularity', 'sleep_quality_rating']),

(9.0, 88, 21, 26, 45, 17.0, ARRAY['minimal_light', 'red_light_only'], 2.5, ARRAY['recovery_nutrition', 'electrolyte_balance'], ARRAY['protein_powder', 'bcaa'], ARRAY['heavy_meals', 'excessive_fluids'], 7, 'blackout_curtains', ARRAY['silence', 'minimal_disturbance'], ARRAY['compression_sheets', 'cooling_blanket'], 20.1, 18.9, ARRAY['faster_recovery', 'reduced_fatigue'], ARRAY['accelerated_healing'], ARRAY['recovery_rate', 'muscle_soreness', 'energy_levels']);

-- Create function to calculate sleep debt
CREATE OR REPLACE FUNCTION calculate_sleep_debt(
    user_id_param UUID,
    days_back INTEGER DEFAULT 7
) RETURNS DECIMAL AS $$
DECLARE
    total_sleep_debt DECIMAL := 0;
    target_sleep_hours DECIMAL := 8.0; -- 8 hours target
    sleep_record RECORD;
BEGIN
    FOR sleep_record IN 
        SELECT total_sleep_hours 
        FROM sleep_logs 
        WHERE user_id = user_id_param 
        AND sleep_date >= CURRENT_DATE - INTERVAL '1 day' * days_back
        ORDER BY sleep_date DESC
    LOOP
        IF sleep_record.total_sleep_hours < target_sleep_hours THEN
            total_sleep_debt := total_sleep_debt + (target_sleep_hours - sleep_record.total_sleep_hours);
        END IF;
    END LOOP;
    
    RETURN total_sleep_debt;
END;
$$ LANGUAGE plpgsql;

-- Create function to predict sleep quality
CREATE OR REPLACE FUNCTION predict_sleep_quality(
    user_id_param UUID,
    target_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB AS $$
DECLARE
    recent_sleep_data JSONB;
    screen_time_data JSONB;
    training_data JSONB;
    prediction_score INTEGER;
    factors JSONB;
BEGIN
    -- Get recent sleep patterns
    SELECT jsonb_build_object(
        'avg_sleep_hours', AVG(total_sleep_hours),
        'avg_efficiency', AVG(sleep_efficiency),
        'avg_quality', AVG(sleep_quality_rating),
        'consistency_score', STDDEV(bedtime::time)
    ) INTO recent_sleep_data
    FROM sleep_logs 
    WHERE user_id = user_id_param 
    AND sleep_date >= target_date - INTERVAL '7 days';
    
    -- Get recent screen time patterns
    SELECT jsonb_build_object(
        'avg_bedtime_proximity', AVG(proximity_to_bedtime_hours),
        'total_screen_time', SUM(duration_minutes)
    ) INTO screen_time_data
    FROM screen_time_events 
    WHERE user_id = user_id_param 
    AND start_timestamp >= target_date - INTERVAL '7 days';
    
    -- Calculate prediction score
    prediction_score := 7; -- Base score
    
    -- Adjust based on sleep consistency
    IF (recent_sleep_data->>'consistency_score')::numeric < 60 THEN
        prediction_score := prediction_score + 1;
    END IF;
    
    -- Adjust based on screen time
    IF (screen_time_data->>'avg_bedtime_proximity')::numeric < 2.0 THEN
        prediction_score := prediction_score - 1;
    END IF;
    
    -- Build factors object
    factors := jsonb_build_object(
        'recent_sleep_patterns', recent_sleep_data,
        'screen_time_patterns', screen_time_data,
        'sleep_debt', calculate_sleep_debt(user_id_param),
        'recommendations', ARRAY[
            'Maintain consistent bedtime',
            'Avoid screens 2+ hours before bed',
            'Ensure 7-9 hours of sleep'
        ]
    );
    
    RETURN jsonb_build_object(
        'predicted_sleep_quality', prediction_score,
        'confidence_level', 'medium',
        'factors', factors
    );
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_sleep_logs_updated_at 
    BEFORE UPDATE ON sleep_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create materialized view for sleep analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS sleep_analytics_summary AS
SELECT 
    user_id,
    AVG(sleep_quality_rating) as avg_sleep_quality,
    AVG(sleep_efficiency) as avg_sleep_efficiency,
    AVG(total_sleep_hours) as avg_sleep_hours,
    COUNT(*) as sleep_records_count,
    MIN(sleep_date) as first_record_date,
    MAX(sleep_date) as last_record_date,
    STDDEV(sleep_quality_rating) as sleep_quality_consistency,
    calculate_sleep_debt(user_id) as current_sleep_debt
FROM sleep_logs 
GROUP BY user_id
ORDER BY avg_sleep_quality DESC;

-- Add comments
COMMENT ON TABLE sleep_logs IS 'Comprehensive sleep tracking and monitoring data';
COMMENT ON TABLE sleep_guidelines IS 'Evidence-based sleep recommendations and guidelines';
COMMENT ON TABLE screen_time_events IS 'Screen time monitoring and blue light exposure tracking';
COMMENT ON TABLE sleep_optimization_protocols IS 'Structured sleep improvement protocols';
COMMENT ON TABLE sleep_performance_correlations IS 'Correlations between sleep and athletic performance';
COMMENT ON TABLE sleep_coaching_sessions IS 'Sleep coaching and intervention sessions';
COMMENT ON TABLE sleep_research_studies IS 'Research studies on sleep and athletic performance';
COMMENT ON FUNCTION calculate_sleep_debt IS 'Calculate accumulated sleep debt over specified period';
COMMENT ON FUNCTION predict_sleep_quality IS 'Predict sleep quality based on recent patterns and behaviors';

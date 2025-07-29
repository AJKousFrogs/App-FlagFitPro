-- =============================================================================
-- COMPREHENSIVE RECOVERY SYSTEM - Migration 010
-- Based on research from leading sports science institutions
-- Integrates cryotherapy, compression, foam rolling, and advanced recovery protocols
-- =============================================================================

-- =============================================================================
-- RECOVERY PROTOCOLS AND METHODOLOGIES
-- =============================================================================

-- Recovery protocol definitions based on scientific research
CREATE TABLE IF NOT EXISTS recovery_protocols (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'cryotherapy', 'compression', 'manual_therapy', 'heat_therapy', 'sleep', 'nutrition', 'active_recovery'
    subcategory VARCHAR(100),
    
    -- Protocol specifications
    description TEXT,
    detailed_instructions TEXT,
    duration_minutes INTEGER,
    intensity_level VARCHAR(50), -- 'low', 'moderate', 'high', 'very_high'
    frequency_per_week INTEGER,
    
    -- Equipment and requirements
    required_equipment TEXT[],
    facility_requirements TEXT[],
    supervision_required BOOLEAN DEFAULT FALSE,
    cost_level VARCHAR(50), -- 'free', 'low', 'moderate', 'high', 'very_high'
    
    -- Physiological targets
    target_systems TEXT[], -- 'muscle_soreness', 'inflammation', 'circulation', 'sleep_quality', 'mental_stress'
    contraindications TEXT[],
    side_effects TEXT[],
    
    -- Research backing
    evidence_level VARCHAR(50), -- 'strong', 'moderate', 'limited', 'emerging', 'anecdotal'
    research_sources TEXT[],
    key_studies JSONB, -- {study_title, year, findings, effect_size}
    
    -- Timing recommendations
    optimal_timing VARCHAR(100), -- 'immediate_post', '1-2h_post', '6-12h_post', '24h_post', 'daily'
    timing_relative_to_exercise TEXT,
    competition_day_safe BOOLEAN DEFAULT TRUE,
    
    -- Effectiveness metrics
    average_effectiveness_rating DECIMAL(3,2), -- 1-10 scale based on research
    user_satisfaction_rating DECIMAL(3,2), -- 1-10 scale based on user feedback
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- CRYOTHERAPY RESEARCH AND PROTOCOLS
-- =============================================================================

-- Cryotherapy specific protocols and research data
CREATE TABLE IF NOT EXISTS cryotherapy_protocols (
    id SERIAL PRIMARY KEY,
    recovery_protocol_id INTEGER REFERENCES recovery_protocols(id) ON DELETE CASCADE,
    
    -- Temperature specifications
    temperature_celsius DECIMAL(5,2),
    temperature_range_min DECIMAL(5,2),
    temperature_range_max DECIMAL(5,2),
    
    -- Method specifics
    method_type VARCHAR(100), -- 'whole_body_cryosauna', 'ice_bath', 'cold_shower', 'ice_packs', 'cryo_chamber'
    exposure_duration_seconds INTEGER,
    number_of_exposures INTEGER DEFAULT 1,
    interval_between_exposures_seconds INTEGER,
    
    -- Preparation and safety
    pre_treatment_preparation TEXT,
    safety_monitoring_requirements TEXT[],
    emergency_procedures TEXT,
    
    -- Physiological effects (based on research)
    muscle_damage_reduction_percentage DECIMAL(5,2), -- Based on creatine kinase reduction studies
    inflammation_reduction_percentage DECIMAL(5,2),
    pain_reduction_percentage DECIMAL(5,2),
    muscle_stiffness_reduction_percentage DECIMAL(5,2),
    
    -- Research citations
    primary_research_source TEXT,
    effect_size_studies JSONB, -- {study: effect_size} for meta-analysis data
    
    -- Practical considerations
    cost_per_session DECIMAL(10,2),
    accessibility_rating VARCHAR(50), -- 'widely_available', 'limited', 'specialized_facilities_only'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- COMPRESSION THERAPY PROTOCOLS
-- =============================================================================

-- Compression therapy research and protocols
CREATE TABLE IF NOT EXISTS compression_protocols (
    id SERIAL PRIMARY KEY,
    recovery_protocol_id INTEGER REFERENCES recovery_protocols(id) ON DELETE CASCADE,
    
    -- Compression specifications
    compression_type VARCHAR(100), -- 'pneumatic', 'static_garment', 'graduated_compression', 'intermittent_pneumatic'
    pressure_mmhg INTEGER,
    pressure_range_min INTEGER,
    pressure_range_max INTEGER,
    
    -- Device and garment specifications
    device_type VARCHAR(100), -- 'normatec', 'compression_boots', 'compression_sleeves', 'full_body_suit'
    body_areas_covered TEXT[], -- 'legs', 'arms', 'trunk', 'full_body'
    
    -- Treatment parameters
    session_duration_minutes INTEGER,
    cycle_duration_seconds INTEGER,
    pressure_hold_seconds INTEGER,
    pressure_release_seconds INTEGER,
    number_of_cycles INTEGER,
    
    -- Research-backed benefits
    strength_recovery_benefit VARCHAR(100), -- Based on meta-analysis showing benefits 2-8h and >24h post-exercise
    soreness_reduction_percentage DECIMAL(5,2),
    blood_flow_improvement_percentage DECIMAL(5,2),
    lymphatic_drainage_effectiveness VARCHAR(50),
    
    -- Specific effectiveness windows
    effectiveness_2_to_8_hours DECIMAL(3,2), -- Effect size from research
    effectiveness_24_hours_plus DECIMAL(3,2), -- Effect size from research
    resistance_exercise_effectiveness DECIMAL(3,2), -- Specific to resistance training recovery
    
    -- Practical implementation
    ease_of_use_rating VARCHAR(50), -- 'very_easy', 'easy', 'moderate', 'complex'
    portability VARCHAR(50), -- 'portable', 'semi_portable', 'stationary'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- MANUAL THERAPY AND FOAM ROLLING PROTOCOLS
-- =============================================================================

-- Self-myofascial release and manual therapy protocols
CREATE TABLE IF NOT EXISTS manual_therapy_protocols (
    id SERIAL PRIMARY KEY,
    recovery_protocol_id INTEGER REFERENCES recovery_protocols(id) ON DELETE CASCADE,
    
    -- Method specifications
    therapy_type VARCHAR(100), -- 'foam_rolling', 'massage', 'trigger_point', 'stretching', 'massage_gun'
    tool_used VARCHAR(100), -- 'foam_roller', 'lacrosse_ball', 'massage_stick', 'massage_gun', 'hands_only'
    
    -- Treatment parameters
    pressure_intensity VARCHAR(50), -- 'light', 'moderate', 'firm', 'deep'
    rolling_speed VARCHAR(50), -- 'slow', 'moderate', 'fast'
    seconds_per_muscle_group INTEGER,
    total_session_duration_minutes INTEGER,
    
    -- Target areas and techniques
    target_muscle_groups TEXT[],
    specific_techniques TEXT[],
    movement_patterns TEXT[],
    
    -- Research-backed benefits (based on systematic reviews)
    flexibility_improvement_percentage DECIMAL(5,2), -- +4% from research
    sprint_performance_improvement_percentage DECIMAL(5,2), -- +0.7% from research
    muscle_performance_preservation VARCHAR(100), -- Post-exercise application benefits
    pain_reduction_effectiveness VARCHAR(50),
    
    -- Timing and application
    pre_exercise_benefits TEXT[],
    post_exercise_benefits TEXT[],
    optimal_timing_pre_minutes INTEGER, -- Minutes before exercise
    optimal_timing_post_minutes INTEGER, -- Minutes after exercise
    
    -- Combination effectiveness
    synergy_with_static_stretching BOOLEAN DEFAULT FALSE,
    enhanced_effectiveness_combinations TEXT[],
    
    -- Learning curve and implementation
    skill_level_required VARCHAR(50), -- 'beginner', 'intermediate', 'advanced', 'professional'
    learning_time_hours INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- HEAT THERAPY AND SAUNA PROTOCOLS
-- =============================================================================

-- Heat therapy and sauna protocols
CREATE TABLE IF NOT EXISTS heat_therapy_protocols (
    id SERIAL PRIMARY KEY,
    recovery_protocol_id INTEGER REFERENCES recovery_protocols(id) ON DELETE CASCADE,
    
    -- Heat specifications
    therapy_type VARCHAR(100), -- 'dry_sauna', 'infrared_sauna', 'steam_room', 'hot_bath', 'heat_packs'
    temperature_celsius DECIMAL(5,2),
    humidity_percentage INTEGER,
    
    -- Session parameters
    session_duration_minutes INTEGER,
    number_of_sessions INTEGER DEFAULT 1,
    interval_between_sessions_minutes INTEGER,
    
    -- Physiological benefits (research-based)
    cardiovascular_adaptation_benefits TEXT[],
    heat_tolerance_improvement BOOLEAN DEFAULT FALSE,
    immune_system_boost TEXT[],
    inflammation_reduction_mechanisms TEXT[],
    
    -- Performance benefits
    endurance_performance_improvement VARCHAR(100),
    recovery_acceleration_factors TEXT[],
    biomarker_improvements JSONB, -- {biomarker: improvement_description}
    
    -- Safety and contraindications
    hydration_requirements TEXT,
    medical_contraindications TEXT[],
    monitoring_parameters TEXT[], -- 'heart_rate', 'hydration_status', 'comfort_level'
    
    -- Research backing (20-minute sessions boost immunity, etc.)
    longevity_biomarker_effects TEXT[],
    research_session_duration INTEGER, -- Optimal duration from research
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- SLEEP AND RECOVERY OPTIMIZATION
-- =============================================================================

-- Sleep optimization protocols for athletic recovery
CREATE TABLE IF NOT EXISTS sleep_optimization_protocols (
    id SERIAL PRIMARY KEY,
    recovery_protocol_id INTEGER REFERENCES recovery_protocols(id) ON DELETE CASCADE,
    
    -- Sleep targets and recommendations
    recommended_sleep_duration_hours DECIMAL(4,2),
    sleep_efficiency_target_percentage INTEGER, -- % of time in bed actually sleeping
    deep_sleep_target_percentage INTEGER,
    rem_sleep_target_percentage INTEGER,
    
    -- Sleep hygiene practices
    pre_sleep_routine_duration_minutes INTEGER,
    bedroom_temperature_celsius DECIMAL(4,2),
    light_exposure_guidelines TEXT[],
    electronic_device_cutoff_hours DECIMAL(3,2),
    
    -- Nutrition and supplementation for sleep
    pre_sleep_nutrition_guidelines TEXT[],
    sleep_promoting_supplements TEXT[],
    supplements_to_avoid TEXT[],
    caffeine_cutoff_hours INTEGER,
    alcohol_recommendations TEXT,
    
    -- Environmental optimization
    room_darkness_requirements TEXT,
    noise_management TEXT[],
    bedding_recommendations TEXT[],
    air_quality_factors TEXT[],
    
    -- Performance impact (research-based)
    performance_improvement_with_optimization DECIMAL(5,2), -- Percentage improvement
    injury_risk_reduction_percentage DECIMAL(5,2),
    cognitive_performance_benefits TEXT[],
    immune_function_benefits TEXT[],
    
    -- Monitoring and tracking
    recommended_tracking_metrics TEXT[], -- 'sleep_duration', 'sleep_efficiency', 'hrv', 'subjective_quality'
    tracking_devices TEXT[],
    
    -- Special considerations for athletes
    travel_sleep_strategies TEXT[],
    competition_sleep_preparation TEXT[],
    training_camp_sleep_optimization TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PERSONALIZED RECOVERY PROFILES
-- =============================================================================

-- Individual athlete recovery profiles and preferences
CREATE TABLE IF NOT EXISTS athlete_recovery_profiles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- Recovery assessment and baseline
    baseline_recovery_rate VARCHAR(50), -- 'fast', 'average', 'slow'
    primary_recovery_challenges TEXT[], -- 'muscle_soreness', 'sleep', 'fatigue', 'motivation'
    injury_history JSONB, -- {injury_type: frequency, recovery_time}
    
    -- Recovery preferences and accessibility
    preferred_recovery_methods TEXT[],
    available_facilities TEXT[],
    budget_for_recovery DECIMAL(10,2),
    time_available_daily_minutes INTEGER,
    
    -- Physiological factors affecting recovery
    age INTEGER,
    training_experience_years INTEGER,
    current_training_load VARCHAR(50), -- 'low', 'moderate', 'high', 'very_high'
    sport_specific_demands TEXT[],
    position_specific_stressors TEXT[],
    
    -- Recovery goals and priorities
    primary_recovery_goals TEXT[],
    performance_priorities TEXT[],
    lifestyle_constraints TEXT[],
    
    -- Current recovery routine
    current_protocols TEXT[], -- References to recovery_protocols
    protocol_compliance_percentage DECIMAL(5,2),
    satisfaction_with_current_routine INTEGER, -- 1-10 scale
    
    -- Medical and health considerations
    medical_conditions TEXT[],
    medications_affecting_recovery TEXT[],
    allergies_and_sensitivities TEXT[],
    
    -- Tracking and monitoring preferences
    preferred_tracking_methods TEXT[],
    objective_measures_used TEXT[],
    subjective_measures_tracked TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- RECOVERY SESSION TRACKING AND LOGS
-- =============================================================================

-- Individual recovery session logs
CREATE TABLE IF NOT EXISTS recovery_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    recovery_protocol_id INTEGER REFERENCES recovery_protocols(id),
    session_date DATE NOT NULL,
    session_time TIME,
    
    -- Session specifics
    duration_minutes INTEGER,
    intensity_level VARCHAR(50),
    compliance_percentage DECIMAL(5,2), -- How well they followed the protocol
    
    -- Pre-session state
    pre_session_fatigue_level INTEGER, -- 1-10 scale
    pre_session_soreness_level INTEGER, -- 1-10 scale
    pre_session_stress_level INTEGER, -- 1-10 scale
    pre_session_sleep_quality INTEGER, -- 1-10 scale from previous night
    
    -- Post-session feedback
    post_session_fatigue_level INTEGER, -- 1-10 scale
    post_session_soreness_level INTEGER, -- 1-10 scale
    post_session_mood INTEGER, -- 1-10 scale
    post_session_energy_level INTEGER, -- 1-10 scale
    
    -- Objective measures (if available)
    heart_rate_variability DECIMAL(6,3),
    resting_heart_rate INTEGER,
    body_temperature DECIMAL(4,2),
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    
    -- Session context
    timing_relative_to_training VARCHAR(100), -- 'immediately_after', '2-4h_after', 'next_day'
    training_intensity_previous VARCHAR(50), -- 'low', 'moderate', 'high', 'very_high'
    environmental_factors JSONB, -- temperature, humidity, etc.
    
    -- Equipment and setup
    equipment_used TEXT[],
    setting VARCHAR(100), -- 'home', 'gym', 'clinic', 'outdoors'
    assistance_received VARCHAR(100), -- 'self_administered', 'partner_assisted', 'professional'
    
    -- Effectiveness assessment
    immediate_effectiveness_rating INTEGER, -- 1-10 scale
    next_day_effectiveness_rating INTEGER, -- 1-10 scale (filled next day)
    would_repeat BOOLEAN,
    
    -- Notes and observations
    session_notes TEXT,
    side_effects_experienced TEXT[],
    modifications_made TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- RECOVERY ANALYTICS AND CORRELATIONS
-- =============================================================================

-- Recovery effectiveness analysis
CREATE TABLE IF NOT EXISTS recovery_analytics (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    analysis_period_start DATE,
    analysis_period_end DATE,
    
    -- Recovery metrics trends
    average_fatigue_reduction DECIMAL(5,2), -- Average improvement post-session
    average_soreness_reduction DECIMAL(5,2),
    recovery_compliance_rate DECIMAL(5,2),
    preferred_protocol_effectiveness JSONB, -- {protocol_id: effectiveness_rating}
    
    -- Performance correlations
    training_quality_correlation DECIMAL(5,3), -- -1 to 1
    performance_improvement_correlation DECIMAL(5,3),
    injury_risk_correlation DECIMAL(5,3),
    
    -- Optimal timing analysis
    optimal_recovery_timing TEXT, -- Best timing based on individual data
    most_effective_protocols TEXT[], -- Top 3 protocols for this individual
    least_effective_protocols TEXT[], -- Bottom 3 protocols
    
    -- Recommendations
    protocol_recommendations TEXT[],
    timing_recommendations TEXT[],
    frequency_recommendations TEXT[],
    
    -- Trend analysis
    recovery_trend VARCHAR(50), -- 'improving', 'stable', 'declining'
    key_insights TEXT[],
    areas_for_improvement TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- RESEARCH DATA AND EVIDENCE TRACKING
-- =============================================================================

-- Scientific research database for recovery methods
CREATE TABLE IF NOT EXISTS recovery_research_studies (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    authors TEXT[],
    journal VARCHAR(255),
    publication_year INTEGER,
    doi VARCHAR(255),
    pmid INTEGER, -- PubMed ID
    
    -- Study characteristics
    study_type VARCHAR(100), -- 'randomized_controlled_trial', 'meta_analysis', 'systematic_review', 'observational'
    sample_size INTEGER,
    population_description TEXT,
    study_duration_weeks INTEGER,
    
    -- Interventions studied
    recovery_methods_studied TEXT[],
    control_conditions TEXT[],
    outcome_measures TEXT[],
    
    -- Results and findings
    primary_findings TEXT,
    effect_sizes JSONB, -- {outcome: effect_size}
    statistical_significance VARCHAR(50),
    clinical_significance TEXT,
    
    -- Quality and bias assessment
    study_quality_rating VARCHAR(50), -- 'high', 'moderate', 'low'
    risk_of_bias TEXT[],
    limitations TEXT[],
    
    -- Practical implications
    practical_applications TEXT[],
    implementation_considerations TEXT[],
    cost_effectiveness_notes TEXT,
    
    -- Institutional affiliation
    lead_institution VARCHAR(255),
    institutional_ranking INTEGER, -- Based on sports science rankings
    funding_source VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Recovery protocols indexes
CREATE INDEX IF NOT EXISTS idx_recovery_protocols_category ON recovery_protocols(category);
CREATE INDEX IF NOT EXISTS idx_recovery_protocols_evidence ON recovery_protocols(evidence_level);
CREATE INDEX IF NOT EXISTS idx_recovery_protocols_effectiveness ON recovery_protocols(average_effectiveness_rating);

-- Recovery sessions indexes
CREATE INDEX IF NOT EXISTS idx_recovery_sessions_user_date ON recovery_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_recovery_sessions_protocol ON recovery_sessions(recovery_protocol_id);
CREATE INDEX IF NOT EXISTS idx_recovery_sessions_effectiveness ON recovery_sessions(immediate_effectiveness_rating);

-- Athlete profiles indexes
CREATE INDEX IF NOT EXISTS idx_athlete_recovery_profiles_user ON athlete_recovery_profiles(user_id);

-- Cryotherapy protocols indexes
CREATE INDEX IF NOT EXISTS idx_cryotherapy_temperature ON cryotherapy_protocols(temperature_celsius);
CREATE INDEX IF NOT EXISTS idx_cryotherapy_method ON cryotherapy_protocols(method_type);

-- Compression protocols indexes
CREATE INDEX IF NOT EXISTS idx_compression_type ON compression_protocols(compression_type);
CREATE INDEX IF NOT EXISTS idx_compression_pressure ON compression_protocols(pressure_mmhg);

-- Research studies indexes
CREATE INDEX IF NOT EXISTS idx_research_studies_year ON recovery_research_studies(publication_year);
CREATE INDEX IF NOT EXISTS idx_research_studies_quality ON recovery_research_studies(study_quality_rating);
CREATE INDEX IF NOT EXISTS idx_research_studies_institution ON recovery_research_studies(lead_institution);

-- =============================================================================
-- MATERIALIZED VIEWS FOR COMPLEX ANALYTICS
-- =============================================================================

-- Recovery effectiveness by protocol view
CREATE MATERIALIZED VIEW IF NOT EXISTS recovery_effectiveness_by_protocol AS
SELECT 
    rp.id as protocol_id,
    rp.name as protocol_name,
    rp.category,
    rp.subcategory,
    COUNT(rs.id) as total_sessions,
    COUNT(DISTINCT rs.user_id) as unique_users,
    AVG(rs.immediate_effectiveness_rating) as avg_immediate_effectiveness,
    AVG(rs.next_day_effectiveness_rating) as avg_next_day_effectiveness,
    AVG(rs.pre_session_fatigue_level - rs.post_session_fatigue_level) as avg_fatigue_reduction,
    AVG(rs.pre_session_soreness_level - rs.post_session_soreness_level) as avg_soreness_reduction,
    STDDEV(rs.immediate_effectiveness_rating) as effectiveness_variability,
    (COUNT(CASE WHEN rs.would_repeat = true THEN 1 END)::FLOAT / COUNT(rs.id)) * 100 as repeat_percentage
FROM recovery_protocols rp
LEFT JOIN recovery_sessions rs ON rp.id = rs.recovery_protocol_id
WHERE rs.session_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY rp.id, rp.name, rp.category, rp.subcategory;

CREATE UNIQUE INDEX IF NOT EXISTS idx_recovery_effectiveness_protocol_id 
ON recovery_effectiveness_by_protocol(protocol_id);

-- Individual recovery progress view
CREATE MATERIALIZED VIEW IF NOT EXISTS individual_recovery_progress AS
SELECT 
    user_id,
    DATE_TRUNC('week', session_date) as week,
    COUNT(*) as sessions_per_week,
    AVG(immediate_effectiveness_rating) as avg_effectiveness,
    AVG(pre_session_fatigue_level - post_session_fatigue_level) as avg_fatigue_improvement,
    AVG(compliance_percentage) as avg_compliance,
    ARRAY_AGG(DISTINCT recovery_protocol_id) as protocols_used
FROM recovery_sessions
WHERE session_date >= CURRENT_DATE - INTERVAL '3 months'
GROUP BY user_id, DATE_TRUNC('week', session_date);

CREATE UNIQUE INDEX IF NOT EXISTS idx_individual_recovery_progress_user_week 
ON individual_recovery_progress(user_id, week);

-- Research evidence summary view
CREATE MATERIALIZED VIEW IF NOT EXISTS research_evidence_summary AS
SELECT 
    UNNEST(recovery_methods_studied) as recovery_method,
    COUNT(*) as study_count,
    AVG(sample_size) as avg_sample_size,
    COUNT(CASE WHEN study_quality_rating = 'high' THEN 1 END) as high_quality_studies,
    COUNT(CASE WHEN study_type = 'randomized_controlled_trial' THEN 1 END) as rct_count,
    COUNT(CASE WHEN study_type = 'meta_analysis' THEN 1 END) as meta_analysis_count,
    MAX(publication_year) as most_recent_study,
    ARRAY_AGG(DISTINCT lead_institution) as researching_institutions
FROM recovery_research_studies
GROUP BY UNNEST(recovery_methods_studied);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_evidence_method 
ON research_evidence_summary(recovery_method);

-- =============================================================================
-- FUNCTIONS FOR RECOVERY RECOMMENDATIONS
-- =============================================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_recovery_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY recovery_effectiveness_by_protocol;
    REFRESH MATERIALIZED VIEW CONCURRENTLY individual_recovery_progress;
    REFRESH MATERIALIZED VIEW CONCURRENTLY research_evidence_summary;
END;
$$ LANGUAGE plpgsql;
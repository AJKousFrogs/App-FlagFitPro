-- =============================================================================
-- ADVANCED HYDRATION & PERFORMANCE NUTRITION SYSTEM - Migration 027
-- Comprehensive hydration science database for flag football athletes
-- Based on latest sports science research and IFAF competition requirements
-- Includes machine learning data collection and monthly research updates
-- =============================================================================

-- =============================================================================
-- HYDRATION SCIENCE RESEARCH DATABASE
-- =============================================================================

-- Core hydration research studies and findings
CREATE TABLE IF NOT EXISTS hydration_research_studies (
    id SERIAL PRIMARY KEY,
    study_title TEXT NOT NULL,
    authors TEXT[] NOT NULL,
    publication_year INTEGER NOT NULL,
    journal VARCHAR(255),
    doi VARCHAR(255),
    pubmed_id VARCHAR(50),
    
    -- Study characteristics
    study_type VARCHAR(100), -- 'meta_analysis', 'systematic_review', 'randomized_trial', 'observational', 'case_study'
    evidence_level VARCHAR(50), -- 'very_high', 'high', 'moderate', 'low', 'very_low'
    sample_size INTEGER,
    population_studied TEXT,
    
    -- Key findings
    key_findings TEXT[],
    effect_size DECIMAL(5,3),
    confidence_interval_lower DECIMAL(5,3),
    confidence_interval_upper DECIMAL(5,3),
    p_value DECIMAL(10,6),
    
    -- Practical applications
    practical_applications TEXT[],
    limitations TEXT[],
    recommendations TEXT[],
    
    -- Sports relevance
    sport_specific VARCHAR(100), -- 'flag_football', 'team_sports', 'endurance', 'strength', 'all_sports'
    competition_level VARCHAR(100), -- 'recreational', 'competitive', 'elite', 'professional', 'olympic'
    
    -- Data collection for ML
    citation_count INTEGER DEFAULT 0,
    impact_factor DECIMAL(5,2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hydration physiology and sweat rate research
CREATE TABLE IF NOT EXISTS hydration_physiology_data (
    id SERIAL PRIMARY KEY,
    research_study_id INTEGER REFERENCES hydration_research_studies(id),
    
    -- Environmental conditions
    temperature_celsius DECIMAL(4,2),
    humidity_percentage DECIMAL(5,2),
    altitude_meters INTEGER,
    wind_speed_kmh DECIMAL(5,2),
    
    -- Exercise characteristics
    exercise_type VARCHAR(100), -- 'flag_football', 'sprint', 'endurance', 'strength', 'hiit'
    exercise_intensity VARCHAR(50), -- 'low', 'moderate', 'high', 'very_high'
    exercise_duration_minutes INTEGER,
    rest_periods_minutes INTEGER,
    
    -- Sweat rate findings
    sweat_rate_ml_per_hour DECIMAL(8,2),
    sweat_rate_ml_per_kg_per_hour DECIMAL(8,2),
    total_fluid_loss_ml INTEGER,
    body_weight_loss_kg DECIMAL(5,3),
    
    -- Electrolyte loss findings
    sodium_loss_mg_per_hour DECIMAL(8,2),
    potassium_loss_mg_per_hour DECIMAL(8,2),
    magnesium_loss_mg_per_hour DECIMAL(8,2),
    calcium_loss_mg_per_hour DECIMAL(8,2),
    
    -- Individual factors
    age_range VARCHAR(50),
    gender VARCHAR(20),
    fitness_level VARCHAR(50),
    acclimation_status VARCHAR(50), -- 'acclimated', 'non_acclimated', 'partially_acclimated'
    
    -- Performance impact
    performance_decline_percentage DECIMAL(5,2),
    cognitive_impairment_measured BOOLEAN,
    reaction_time_impact DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- FLAG FOOTBALL SPECIFIC HYDRATION PROTOCOLS
-- =============================================================================

-- IFAF competition hydration protocols
CREATE TABLE IF NOT EXISTS ifaf_hydration_protocols (
    id SERIAL PRIMARY KEY,
    competition_type VARCHAR(100), -- 'regular_season', 'playoffs', 'continental_championship', 'world_championship', 'olympic_games'
    competition_level VARCHAR(50), -- 'regional', 'national', 'continental', 'world', 'olympic'
    
    -- Game structure
    games_per_day INTEGER, -- typically 3-4 for tournaments
    game_duration_minutes INTEGER, -- 2x20 minutes = 40 minutes
    total_playing_time_minutes INTEGER, -- including breaks
    time_between_games_minutes INTEGER,
    
    -- Environmental considerations
    typical_temperature_celsius DECIMAL(4,2),
    typical_humidity_percentage DECIMAL(5,2),
    indoor_outdoor VARCHAR(20),
    altitude_meters INTEGER,
    
    -- Hydration recommendations
    pre_game_hydration_ml_per_kg DECIMAL(8,2),
    pre_game_timing_hours DECIMAL(3,2),
    during_game_hydration_ml_per_15min DECIMAL(8,2),
    between_games_hydration_ml_per_kg DECIMAL(8,2),
    post_game_hydration_ml_per_kg DECIMAL(8,2),
    
    -- Electrolyte recommendations
    sodium_mg_per_liter DECIMAL(8,2),
    potassium_mg_per_liter DECIMAL(8,2),
    magnesium_mg_per_liter DECIMAL(8,2),
    calcium_mg_per_liter DECIMAL(8,2),
    
    -- Performance monitoring
    urine_color_target INTEGER, -- 1-8 scale
    body_weight_loss_limit_kg DECIMAL(5,3),
    cognitive_test_recommendations TEXT[],
    
    -- Research backing
    research_studies INTEGER[],
    evidence_strength VARCHAR(50),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training session hydration protocols
CREATE TABLE IF NOT EXISTS training_hydration_protocols (
    id SERIAL PRIMARY KEY,
    training_type VARCHAR(100), -- 'strength', 'hiit', 'sprint', 'endurance', 'skill', 'recovery'
    training_duration_minutes INTEGER,
    training_intensity VARCHAR(50),
    
    -- Hydration needs
    pre_training_hydration_ml_per_kg DECIMAL(8,2),
    pre_training_timing_hours DECIMAL(3,2),
    during_training_hydration_ml_per_15min DECIMAL(8,2),
    post_training_hydration_ml_per_kg DECIMAL(8,2),
    
    -- Electrolyte needs
    sodium_replacement_mg_per_hour DECIMAL(8,2),
    potassium_replacement_mg_per_hour DECIMAL(8,2),
    
    -- Environmental adjustments
    temperature_adjustment_factor DECIMAL(4,2),
    humidity_adjustment_factor DECIMAL(4,2),
    altitude_adjustment_factor DECIMAL(4,2),
    
    -- Performance targets
    maintain_performance_threshold DECIMAL(5,2), -- % body weight loss before performance decline
    cognitive_function_maintenance BOOLEAN,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PERFORMANCE SUPPLEMENTS RESEARCH DATABASE
-- =============================================================================

-- Creatine research and protocols
CREATE TABLE IF NOT EXISTS creatine_research (
    id SERIAL PRIMARY KEY,
    research_study_id INTEGER REFERENCES hydration_research_studies(id),
    
    -- Supplement details
    creatine_form VARCHAR(100), -- 'monohydrate', 'hydrochloride', 'ethyl_ester', 'nitrate'
    dosage_mg_per_kg DECIMAL(8,2),
    loading_phase_days INTEGER,
    maintenance_dose_mg_per_day DECIMAL(8,2),
    
    -- Performance outcomes
    strength_improvement_percentage DECIMAL(5,2),
    power_improvement_percentage DECIMAL(5,2),
    sprint_performance_improvement DECIMAL(5,2),
    muscle_mass_gain_kg DECIMAL(5,3),
    
    -- Safety and side effects
    side_effects TEXT[],
    contraindications TEXT[],
    long_term_safety_data BOOLEAN,
    
    -- Flag football specific
    flag_football_relevance_score INTEGER CHECK (flag_football_relevance_score BETWEEN 1 AND 10),
    position_specific_benefits TEXT[],
    
    -- Research quality
    study_duration_weeks INTEGER,
    population_size INTEGER,
    control_group_used BOOLEAN,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Beta-alanine research and protocols
CREATE TABLE IF NOT EXISTS beta_alanine_research (
    id SERIAL PRIMARY KEY,
    research_study_id INTEGER REFERENCES hydration_research_studies(id),
    
    -- Supplement details
    dosage_mg_per_day DECIMAL(8,2),
    administration_frequency VARCHAR(50), -- 'single_dose', 'divided_doses', 'time_release'
    loading_phase_weeks INTEGER,
    
    -- Performance outcomes
    muscular_endurance_improvement DECIMAL(5,2),
    anaerobic_power_improvement DECIMAL(5,2),
    time_to_exhaustion_improvement DECIMAL(5,2),
    sprint_repeat_performance DECIMAL(5,2),
    
    -- Side effects
    paresthesia_incidence_percentage DECIMAL(5,2),
    other_side_effects TEXT[],
    
    -- Flag football applications
    flag_football_benefits TEXT[],
    optimal_timing VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Caffeine research and protocols
CREATE TABLE IF NOT EXISTS caffeine_research (
    id SERIAL PRIMARY KEY,
    research_study_id INTEGER REFERENCES hydration_research_studies(id),
    
    -- Supplement details
    dosage_mg_per_kg DECIMAL(8,2),
    timing_minutes_before_exercise INTEGER,
    form VARCHAR(100), -- 'capsule', 'coffee', 'energy_drink', 'gum'
    
    -- Performance outcomes
    endurance_improvement_percentage DECIMAL(5,2),
    power_improvement_percentage DECIMAL(5,2),
    cognitive_enhancement_score DECIMAL(5,2),
    reaction_time_improvement DECIMAL(5,2),
    
    -- Individual factors
    habitual_caffeine_use_impact VARCHAR(50),
    genetic_variants_affecting_response TEXT[],
    tolerance_development BOOLEAN,
    
    -- Flag football specific
    pre_game_timing_recommendations TEXT[],
    during_game_use_recommendations TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- MACHINE LEARNING DATA COLLECTION SYSTEM
-- =============================================================================

-- Monthly research update tracking
CREATE TABLE IF NOT EXISTS research_update_logs (
    id SERIAL PRIMARY KEY,
    update_date DATE NOT NULL,
    update_type VARCHAR(100), -- 'monthly_scrape', 'new_studies', 'meta_analysis_update', 'protocol_revision'
    
    -- Data collection metrics
    new_studies_added INTEGER,
    studies_updated INTEGER,
    meta_analyses_reviewed INTEGER,
    protocols_modified INTEGER,
    
    -- Source tracking
    sources_scraped TEXT[],
    new_journals_discovered INTEGER,
    new_researchers_identified INTEGER,
    
    -- Quality metrics
    average_evidence_level VARCHAR(50),
    high_quality_studies_count INTEGER,
    conflicting_findings_identified INTEGER,
    
    -- Flag football relevance
    flag_football_specific_studies INTEGER,
    position_specific_insights INTEGER,
    competition_level_insights INTEGER,
    
    -- ML model updates
    model_retrained BOOLEAN,
    new_features_added INTEGER,
    accuracy_improvement_percentage DECIMAL(5,2),
    
    -- Notes and observations
    key_discoveries TEXT[],
    areas_needing_research TEXT[],
    next_month_priorities TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research source tracking for ML
CREATE TABLE IF NOT EXISTS research_sources (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(100), -- 'journal', 'database', 'institution', 'researcher', 'conference'
    url TEXT,
    
    -- Quality metrics
    impact_factor DECIMAL(5,2),
    peer_review_status BOOLEAN,
    update_frequency VARCHAR(50),
    
    -- Content focus
    primary_domains TEXT[],
    sports_coverage TEXT[],
    hydration_focus BOOLEAN,
    performance_nutrition_focus BOOLEAN,
    
    -- Access information
    access_type VARCHAR(50), -- 'open_access', 'subscription', 'institutional', 'pay_per_article'
    last_accessed TIMESTAMP WITH TIME ZONE,
    access_success_rate DECIMAL(5,2),
    
    -- ML relevance
    data_quality_score INTEGER CHECK (data_quality_score BETWEEN 1 AND 10),
    machine_readable_format BOOLEAN,
    structured_data_available BOOLEAN,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- COMPETITION LEVEL SPECIFIC PROTOCOLS
-- =============================================================================

-- European Championships hydration protocols
CREATE TABLE IF NOT EXISTS european_championship_protocols (
    id SERIAL PRIMARY KEY,
    championship_year INTEGER NOT NULL,
    host_country VARCHAR(100),
    climate_zone VARCHAR(100),
    
    -- Competition structure
    teams_participating INTEGER,
    games_per_team INTEGER,
    tournament_duration_days INTEGER,
    
    -- Environmental conditions
    average_temperature_celsius DECIMAL(4,2),
    average_humidity_percentage DECIMAL(5,2),
    altitude_variations_meters INTEGER[],
    
    -- Hydration strategies
    pre_tournament_hydration_protocol TEXT,
    daily_hydration_targets_ml_per_kg DECIMAL(8,2),
    between_games_hydration_strategy TEXT,
    recovery_hydration_protocol TEXT,
    
    -- Performance monitoring
    hydration_status_checks_per_day INTEGER,
    body_weight_monitoring_frequency VARCHAR(50),
    cognitive_testing_schedule TEXT[],
    
    -- Success metrics
    hydration_related_injuries INTEGER,
    performance_consistency_score DECIMAL(5,2),
    athlete_feedback_score DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- World Championship protocols
CREATE TABLE IF NOT EXISTS world_championship_protocols (
    id SERIAL PRIMARY KEY,
    championship_year INTEGER NOT NULL,
    host_country VARCHAR(100),
    climate_zone VARCHAR(100),
    
    -- Competition structure
    teams_participating INTEGER, -- typically 16 teams
    qualification_process TEXT,
    tournament_format VARCHAR(100),
    
    -- Environmental challenges
    climate_variations_across_venues TEXT[],
    altitude_challenges TEXT[],
    travel_impact_on_hydration TEXT[],
    
    -- Advanced hydration protocols
    personalized_hydration_plans BOOLEAN,
    real_time_hydration_monitoring BOOLEAN,
    emergency_hydration_protocols TEXT[],
    
    -- Research opportunities
    data_collection_protocols TEXT[],
    performance_correlation_studies BOOLEAN,
    long_term_follow_up_studies BOOLEAN,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Olympic Games protocols
CREATE TABLE IF NOT EXISTS olympic_games_protocols (
    id SERIAL PRIMARY KEY,
    olympic_year INTEGER NOT NULL,
    host_city VARCHAR(100),
    flag_football_status VARCHAR(50), -- 'demonstration', 'medal_sport', 'future_consideration'
    
    -- Olympic specific considerations
    anti_doping_compliance TEXT[],
    international_standards_application TEXT[],
    cultural_dietary_considerations TEXT[],
    
    -- Advanced monitoring
    wearable_technology_integration BOOLEAN,
    real_time_biometric_monitoring BOOLEAN,
    ai_powered_hydration_optimization BOOLEAN,
    
    -- Legacy and research
    research_collaborations TEXT[],
    knowledge_transfer_programs TEXT[],
    long_term_impact_studies BOOLEAN,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INJURY PREVENTION AND PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Hydration-related injury prevention
CREATE TABLE IF NOT EXISTS hydration_injury_prevention (
    id SERIAL PRIMARY KEY,
    injury_type VARCHAR(100), -- 'cramps', 'heat_exhaustion', 'dehydration', 'electrolyte_imbalance'
    risk_factors TEXT[],
    
    -- Prevention strategies
    hydration_prevention_protocols TEXT[],
    monitoring_indicators TEXT[],
    intervention_thresholds TEXT[],
    
    -- Flag football specific
    position_specific_risks TEXT[],
    game_situation_risks TEXT[],
    tournament_accumulation_risks TEXT[],
    
    -- Research backing
    prevention_effectiveness_percentage DECIMAL(5,2),
    studies_supporting_prevention INTEGER[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance optimization through hydration
CREATE TABLE IF NOT EXISTS hydration_performance_optimization (
    id SERIAL PRIMARY KEY,
    performance_metric VARCHAR(100), -- 'reaction_time', 'sprint_speed', 'endurance', 'cognitive_function'
    
    -- Hydration optimization strategies
    optimal_hydration_levels TEXT[],
    timing_optimization TEXT[],
    individual_factors TEXT[],
    
    -- Performance measurement
    measurement_methods TEXT[],
    improvement_metrics TEXT[],
    long_term_benefits TEXT[],
    
    -- Flag football applications
    game_situation_applications TEXT[],
    training_optimization TEXT[],
    competition_preparation TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Research studies indexes
CREATE INDEX IF NOT EXISTS idx_hydration_research_studies_year ON hydration_research_studies(publication_year);
CREATE INDEX IF NOT EXISTS idx_hydration_research_studies_evidence ON hydration_research_studies(evidence_level);
CREATE INDEX IF NOT EXISTS idx_hydration_research_studies_sport ON hydration_research_studies(sport_specific);
CREATE INDEX IF NOT EXISTS idx_hydration_research_studies_level ON hydration_research_studies(competition_level);

-- Physiology data indexes
CREATE INDEX IF NOT EXISTS idx_hydration_physiology_exercise ON hydration_physiology_data(exercise_type);
CREATE INDEX IF NOT EXISTS idx_hydration_physiology_intensity ON hydration_physiology_data(exercise_intensity);
CREATE INDEX IF NOT EXISTS idx_hydration_physiology_temperature ON hydration_physiology_data(temperature_celsius);

-- Protocol indexes
CREATE INDEX IF NOT EXISTS idx_ifaf_protocols_competition ON ifaf_hydration_protocols(competition_type);
CREATE INDEX IF NOT EXISTS idx_training_protocols_type ON training_hydration_protocols(training_type);

-- Supplement research indexes
CREATE INDEX IF NOT EXISTS idx_creatine_research_form ON creatine_research(creatine_form);
CREATE INDEX IF NOT EXISTS idx_beta_alanine_research_dosage ON beta_alanine_research(dosage_mg_per_day);
CREATE INDEX IF NOT EXISTS idx_caffeine_research_dosage ON caffeine_research(dosage_mg_per_kg);

-- Research update indexes
CREATE INDEX IF NOT EXISTS idx_research_updates_date ON research_update_logs(update_date);
CREATE INDEX IF NOT EXISTS idx_research_sources_quality ON research_sources(data_quality_score);

-- Competition protocol indexes
CREATE INDEX IF NOT EXISTS idx_european_championship_year ON european_championship_protocols(championship_year);
CREATE INDEX IF NOT EXISTS idx_world_championship_year ON world_championship_protocols(championship_year);
CREATE INDEX IF NOT EXISTS idx_olympic_games_year ON olympic_games_protocols(olympic_year);

-- =============================================================================
-- MATERIALIZED VIEWS FOR COMPLEX QUERIES
-- =============================================================================

-- Latest hydration research summary
CREATE MATERIALIZED VIEW IF NOT EXISTS latest_hydration_research_summary AS
SELECT 
    publication_year,
    COUNT(*) as total_studies,
    COUNT(CASE WHEN evidence_level IN ('very_high', 'high') THEN 1 END) as high_quality_studies,
    AVG(effect_size) as avg_effect_size,
    COUNT(CASE WHEN sport_specific = 'flag_football' THEN 1 END) as flag_football_studies,
    COUNT(CASE WHEN competition_level IN ('elite', 'professional', 'olympic') THEN 1 END) as elite_level_studies
FROM hydration_research_studies
WHERE publication_year >= EXTRACT(YEAR FROM NOW()) - 5
GROUP BY publication_year
ORDER BY publication_year DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_latest_hydration_research_year 
ON latest_hydration_research_summary(publication_year);

-- Flag football specific hydration recommendations
CREATE MATERIALIZED VIEW IF NOT EXISTS flag_football_hydration_recommendations AS
SELECT 
    'pre_game' as timing,
    AVG(pre_game_hydration_ml_per_kg) as avg_hydration_ml_per_kg,
    AVG(pre_game_timing_hours) as avg_timing_hours,
    COUNT(*) as protocols_count
FROM ifaf_hydration_protocols
UNION ALL
SELECT 
    'during_game' as timing,
    AVG(during_game_hydration_ml_per_15min) as avg_hydration_ml_per_15min,
    NULL as avg_timing_hours,
    COUNT(*) as protocols_count
FROM ifaf_hydration_protocols
UNION ALL
SELECT 
    'post_game' as timing,
    AVG(post_game_hydration_ml_per_kg) as avg_hydration_ml_per_kg,
    NULL as avg_timing_hours,
    COUNT(*) as protocols_count
FROM ifaf_hydration_protocols;

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================================================

-- Function to update research study citation count
CREATE OR REPLACE FUNCTION update_citation_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update citation count when new studies reference this one
    UPDATE hydration_research_studies 
    SET citation_count = citation_count + 1 
    WHERE id = NEW.research_study_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for citation tracking
CREATE TRIGGER trigger_citation_update
    AFTER INSERT ON hydration_physiology_data
    FOR EACH ROW
    EXECUTE FUNCTION update_citation_count();

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================

-- Sample hydration research study
INSERT INTO hydration_research_studies (
    study_title, authors, publication_year, journal, evidence_level,
    key_findings, sport_specific, competition_level
) VALUES (
    'Hydration Strategies for Team Sports: A Meta-Analysis of Performance Outcomes',
    ARRAY['Smith, J.', 'Johnson, A.', 'Williams, B.'],
    2024,
    'Sports Medicine',
    'high',
    ARRAY[
        'Optimal hydration prevents 2-3% performance decline',
        'Sodium replacement crucial for fluid retention',
        'Individual sweat rates vary by 2-3x between athletes'
    ],
    'flag_football',
    'elite'
);

-- Sample IFAF hydration protocol
INSERT INTO ifaf_hydration_protocols (
    competition_type, games_per_day, game_duration_minutes,
    pre_game_hydration_ml_per_kg, during_game_hydration_ml_per_15min,
    sodium_mg_per_liter
) VALUES (
    'world_championship',
    4,
    40,
    15.0,
    200.0,
    500.0
);

-- Sample training hydration protocol
INSERT INTO training_hydration_protocols (
    training_type, training_duration_minutes, training_intensity,
    pre_training_hydration_ml_per_kg, during_training_hydration_ml_per_15min
) VALUES (
    'hiit',
    90,
    'high',
    10.0,
    150.0
);

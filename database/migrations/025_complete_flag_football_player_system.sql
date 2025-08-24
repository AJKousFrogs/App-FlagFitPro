-- =============================================================================
-- COMPLETE FLAG FOOTBALL PLAYER DEVELOPMENT SYSTEM
-- Migration: 025_complete_flag_football_player_system.sql
-- Based on comprehensive research of elite player profiles and training methods
-- =============================================================================

-- =============================================================================
-- PLAYER ARCHETYPES AND PROFILES
-- =============================================================================

-- Player archetype definitions based on research
CREATE TABLE IF NOT EXISTS player_archetypes (
    id SERIAL PRIMARY KEY,
    archetype_name VARCHAR(100) NOT NULL, -- 'elite_speed_demon', 'complete_athlete', 'technical_specialist'
    description TEXT,
    
    -- Physical attribute ranges
    speed_rating_min INTEGER CHECK (speed_rating_min BETWEEN 1 AND 10),
    speed_rating_max INTEGER CHECK (speed_rating_max BETWEEN 1 AND 10),
    agility_rating_min INTEGER CHECK (agility_rating_min BETWEEN 1 AND 10),
    agility_rating_max INTEGER CHECK (agility_rating_max BETWEEN 1 AND 10),
    power_rating_min INTEGER CHECK (power_rating_min BETWEEN 1 AND 10),
    power_rating_max INTEGER CHECK (power_rating_max BETWEEN 1 AND 10),
    
    -- Ideal sports backgrounds
    ideal_sports_backgrounds TEXT[], -- ['soccer', 'track_field', 'basketball']
    secondary_sports_backgrounds TEXT[],
    
    -- Position suitability
    position_suitability JSONB, -- {quarterback: 8, receiver: 10, running_back: 9, defensive_back: 7}
    
    -- Elite benchmarks for this archetype
    ten_yard_sprint_target DECIMAL(4,2), -- Target time in seconds
    forty_yard_sprint_target DECIMAL(4,2),
    l_drill_target DECIMAL(4,2),
    vertical_jump_target INTEGER, -- Target in inches
    broad_jump_target INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Position-specific requirements and attributes
CREATE TABLE IF NOT EXISTS position_requirements (
    id SERIAL PRIMARY KEY,
    position_name VARCHAR(50) NOT NULL, -- 'quarterback', 'receiver', 'running_back', 'defensive_back', 'rusher'
    
    -- Physical requirements (1-10 scale importance)
    speed_importance INTEGER CHECK (speed_importance BETWEEN 1 AND 10),
    acceleration_importance INTEGER CHECK (acceleration_importance BETWEEN 1 AND 10),
    agility_importance INTEGER CHECK (agility_importance BETWEEN 1 AND 10),
    power_importance INTEGER CHECK (power_importance BETWEEN 1 AND 10),
    endurance_importance INTEGER CHECK (endurance_importance BETWEEN 1 AND 10),
    
    -- Technical skills requirements
    route_running_importance INTEGER CHECK (route_running_importance BETWEEN 1 AND 10),
    catching_importance INTEGER CHECK (catching_importance BETWEEN 1 AND 10),
    evasion_importance INTEGER CHECK (evasion_importance BETWEEN 1 AND 10),
    flag_pulling_importance INTEGER CHECK (flag_pulling_importance BETWEEN 1 AND 10),
    decision_making_importance INTEGER CHECK (decision_making_importance BETWEEN 1 AND 10),
    
    -- Cognitive requirements
    reaction_time_importance INTEGER CHECK (reaction_time_importance BETWEEN 1 AND 10),
    field_vision_importance INTEGER CHECK (field_vision_importance BETWEEN 1 AND 10),
    leadership_importance INTEGER CHECK (leadership_importance BETWEEN 1 AND 10),
    
    -- Specific skills and techniques
    key_techniques TEXT[], -- Position-specific techniques
    common_training_focus TEXT[],
    
    -- Performance benchmarks for elite level
    elite_benchmarks JSONB, -- Position-specific elite standards
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sports background crossover analysis
CREATE TABLE IF NOT EXISTS sports_crossover_analysis (
    id SERIAL PRIMARY KEY,
    source_sport VARCHAR(100) NOT NULL, -- 'soccer', 'basketball', 'track_field', 'rugby_sevens'
    
    -- Transfer effectiveness (1-10 scale)
    overall_transfer_rating INTEGER CHECK (overall_transfer_rating BETWEEN 1 AND 10),
    speed_transfer DECIMAL(3,2), -- How much speed transfers (0-1 scale)
    agility_transfer DECIMAL(3,2),
    technical_transfer DECIMAL(3,2),
    tactical_transfer DECIMAL(3,2),
    
    -- Specific skills that transfer
    transferable_skills TEXT[],
    skills_requiring_development TEXT[],
    
    -- Best flag football positions for this sport background
    optimal_positions TEXT[],
    secondary_positions TEXT[],
    
    -- Training focus for athletes from this sport
    recommended_training_emphasis TEXT[],
    common_weaknesses_to_address TEXT[],
    
    -- Research backing
    research_evidence TEXT,
    professional_examples TEXT[], -- Names of pro athletes who made this transition
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- PLAYER ASSESSMENT SYSTEM
-- =============================================================================

-- Physical assessment protocols and standards
CREATE TABLE IF NOT EXISTS physical_assessment_protocols (
    id SERIAL PRIMARY KEY,
    test_name VARCHAR(100) NOT NULL, -- '10_yard_sprint', 'l_drill', 'vertical_jump'
    test_category VARCHAR(50), -- 'speed', 'agility', 'power', 'endurance'
    
    -- Test specifications
    test_description TEXT,
    equipment_needed TEXT[],
    setup_instructions TEXT,
    execution_steps TEXT[],
    safety_considerations TEXT[],
    
    -- Scoring and benchmarks
    measurement_unit VARCHAR(20), -- 'seconds', 'inches', 'repetitions'
    elite_male_benchmark DECIMAL(6,3),
    elite_female_benchmark DECIMAL(6,3),
    good_male_benchmark DECIMAL(6,3),
    good_female_benchmark DECIMAL(6,3),
    average_male_benchmark DECIMAL(6,3),
    average_female_benchmark DECIMAL(6,3),
    
    -- Test reliability and validity
    test_retest_reliability DECIMAL(3,2), -- Correlation coefficient
    validity_research TEXT,
    
    -- Age group modifications
    youth_modifications JSONB, -- {age_group: modifications}
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Technical skill assessment framework
CREATE TABLE IF NOT EXISTS technical_skill_assessments (
    id SERIAL PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL, -- 'route_running_precision', 'evasion_effectiveness', 'catching_under_pressure'
    skill_category VARCHAR(50), -- 'route_running', 'evasion', 'catching', 'flag_pulling'
    
    -- Assessment methodology
    assessment_description TEXT,
    setup_requirements TEXT,
    evaluation_criteria TEXT[],
    
    -- Scoring system (1-10 scale with specific criteria)
    scoring_rubric JSONB, -- {10: 'elite_description', 9: 'excellent_description', etc.}
    
    -- Position relevance
    position_relevance JSONB, -- {quarterback: 5, receiver: 10, running_back: 8}
    
    -- Assessment tools and drills
    recommended_drills TEXT[],
    video_analysis_points TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cognitive assessment protocols
CREATE TABLE IF NOT EXISTS cognitive_assessments (
    id SERIAL PRIMARY KEY,
    assessment_name VARCHAR(100) NOT NULL, -- 'reaction_time_test', 'decision_making_drill', 'field_vision_assessment'
    cognitive_domain VARCHAR(50), -- 'reaction_time', 'decision_making', 'spatial_awareness', 'pattern_recognition'
    
    -- Assessment details
    assessment_description TEXT,
    duration_minutes INTEGER,
    equipment_required TEXT[],
    
    -- Scoring and benchmarks
    measurement_type VARCHAR(50), -- 'time_based', 'accuracy_based', 'composite_score'
    elite_benchmark DECIMAL(6,3),
    good_benchmark DECIMAL(6,3),
    average_benchmark DECIMAL(6,3),
    
    -- Position-specific importance
    position_importance JSONB, -- {quarterback: 10, receiver: 7, defensive_back: 9}
    
    -- Research validation
    research_backing TEXT,
    correlation_with_performance DECIMAL(3,2), -- Correlation with game performance
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- PLAYER PROFILES AND ASSESSMENTS
-- =============================================================================

-- Individual player comprehensive profiles
CREATE TABLE IF NOT EXISTS player_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic demographics
    height_inches INTEGER,
    weight_pounds INTEGER,
    age INTEGER,
    gender VARCHAR(10),
    primary_position VARCHAR(50),
    secondary_positions TEXT[],
    
    -- Sports background
    sports_background TEXT[], -- Array of sports played
    years_experience_flag_football DECIMAL(3,1),
    highest_level_played VARCHAR(50), -- 'recreational', 'high_school', 'college', 'semi_pro', 'professional'
    
    -- Current archetype classification
    assigned_archetype_id INTEGER REFERENCES player_archetypes(id),
    archetype_confidence_score DECIMAL(3,2), -- How well they fit the archetype (0-1)
    
    -- Training goals and focus areas
    primary_development_goals TEXT[],
    areas_needing_improvement TEXT[],
    training_availability_hours_per_week INTEGER,
    
    -- Injury history and limitations
    injury_history JSONB, -- {injury_type: details}
    current_limitations TEXT[],
    medical_clearances TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Physical assessment results
CREATE TABLE IF NOT EXISTS player_physical_assessments (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    assessment_protocol_id INTEGER REFERENCES physical_assessment_protocols(id),
    
    -- Assessment details
    assessment_date DATE,
    assessor_name VARCHAR(100),
    
    -- Results
    raw_score DECIMAL(6,3), -- The actual measurement
    percentile_rank INTEGER, -- Compared to age/gender peers
    rating_category VARCHAR(20), -- 'elite', 'excellent', 'good', 'average', 'below_average'
    
    -- Assessment conditions
    environmental_conditions JSONB, -- temperature, surface, etc.
    athlete_condition VARCHAR(50), -- 'fresh', 'fatigued', 'recovering_from_injury'
    
    -- Notes and observations
    assessor_notes TEXT,
    technique_observations TEXT[],
    improvement_recommendations TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Technical skill assessment results
CREATE TABLE IF NOT EXISTS player_technical_assessments (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    skill_assessment_id INTEGER REFERENCES technical_skill_assessments(id),
    
    -- Assessment details
    assessment_date DATE,
    assessor_name VARCHAR(100),
    
    -- Results
    skill_score INTEGER CHECK (skill_score BETWEEN 1 AND 10),
    specific_competencies JSONB, -- {competency: score} breakdown
    
    -- Qualitative assessment
    strengths TEXT[],
    areas_for_improvement TEXT[],
    technique_notes TEXT,
    
    -- Video analysis (if available)
    video_analysis_url VARCHAR(500),
    key_frames_analysis JSONB, -- {timestamp: observation}
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cognitive assessment results
CREATE TABLE IF NOT EXISTS player_cognitive_assessments (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    cognitive_assessment_id INTEGER REFERENCES cognitive_assessments(id),
    
    -- Assessment details
    assessment_date DATE,
    
    -- Results
    raw_score DECIMAL(6,3),
    percentile_rank INTEGER,
    cognitive_rating VARCHAR(20), -- 'elite', 'above_average', 'average', 'below_average'
    
    -- Detailed results
    sub_scores JSONB, -- Breakdown by different cognitive components
    response_time_analysis JSONB, -- {trial: response_time} for reaction tests
    accuracy_breakdown JSONB, -- For decision-making tests
    
    -- Recommendations
    cognitive_training_recommendations TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- TRAINING PRESCRIPTION ENGINE
-- =============================================================================

-- Training program templates based on player archetypes
CREATE TABLE IF NOT EXISTS archetype_training_programs (
    id SERIAL PRIMARY KEY,
    archetype_id INTEGER REFERENCES player_archetypes(id),
    position_id INTEGER REFERENCES position_requirements(id),
    
    -- Program details
    program_name VARCHAR(150) NOT NULL,
    program_description TEXT,
    duration_weeks INTEGER,
    sessions_per_week INTEGER,
    
    -- Training focus distribution (percentages should sum to 100)
    speed_training_percentage INTEGER,
    agility_training_percentage INTEGER,
    power_training_percentage INTEGER,
    technical_skills_percentage INTEGER,
    cognitive_training_percentage INTEGER,
    recovery_percentage INTEGER,
    
    -- Specific training components
    recommended_sprint_workouts INTEGER[] REFERENCES sprint_workouts(id)[],
    recommended_agility_patterns INTEGER[] REFERENCES agility_patterns(id)[],
    recommended_skill_drills TEXT[],
    
    -- Periodization strategy
    periodization_model VARCHAR(50), -- 'linear', 'conjugate', 'block'
    phase_breakdown JSONB, -- {phase: {weeks: X, focus: Y}}
    
    -- Assessment integration
    baseline_assessments_required INTEGER[] REFERENCES physical_assessment_protocols(id)[],
    progress_check_frequency_weeks INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Personalized training prescriptions
CREATE TABLE IF NOT EXISTS player_training_prescriptions (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    base_program_id INTEGER REFERENCES archetype_training_programs(id),
    
    -- Customization details
    prescription_date DATE,
    prescribed_by VARCHAR(100), -- Coach/trainer name
    
    -- Program modifications based on assessments
    modifications_made TEXT[],
    emphasis_adjustments JSONB, -- {training_type: adjustment_percentage}
    
    -- Specific workout prescriptions
    weekly_sprint_volume_yards INTEGER,
    weekly_agility_sessions INTEGER,
    weekly_technical_skill_hours DECIMAL(4,2),
    weekly_recovery_sessions INTEGER,
    
    -- Progression targets
    target_improvements JSONB, -- {assessment: target_improvement}
    milestone_benchmarks JSONB, -- {weeks: expected_performance}
    
    -- Monitoring and adjustments
    assessment_schedule TEXT[],
    adjustment_triggers TEXT[], -- Conditions that trigger program modifications
    
    -- Status
    prescription_status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'modified', 'discontinued'
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- PERFORMANCE TRACKING AND ANALYTICS
-- =============================================================================

-- Training session logs with detailed performance tracking
CREATE TABLE IF NOT EXISTS player_training_sessions (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    prescription_id INTEGER REFERENCES player_training_prescriptions(id),
    
    -- Session details
    session_date DATE,
    session_type VARCHAR(50), -- 'speed', 'agility', 'technical', 'recovery', 'combined'
    planned_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    
    -- Performance metrics
    sprint_times JSONB, -- {distance: time} for various sprint distances
    agility_times JSONB, -- {drill: time} for agility exercises
    technical_skill_scores JSONB, -- {skill: score} for technical work
    
    -- Physiological responses
    perceived_exertion INTEGER CHECK (perceived_exertion BETWEEN 1 AND 10),
    heart_rate_data JSONB, -- {timestamp: heart_rate} if available
    fatigue_level_pre INTEGER CHECK (fatigue_level_pre BETWEEN 1 AND 10),
    fatigue_level_post INTEGER CHECK (fatigue_level_post BETWEEN 1 AND 10),
    
    -- Session quality and adherence
    adherence_percentage DECIMAL(5,2), -- How much of planned session was completed
    technique_quality_rating INTEGER CHECK (technique_quality_rating BETWEEN 1 AND 10),
    motivation_level INTEGER CHECK (motivation_level BETWEEN 1 AND 10),
    
    -- Environmental factors
    environmental_conditions JSONB,
    equipment_used TEXT[],
    training_partners TEXT[],
    
    -- Coach/trainer feedback
    coach_observations TEXT,
    areas_of_improvement TEXT[],
    positive_feedback TEXT[],
    
    -- Next session adjustments
    recommended_adjustments TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Performance trend analysis and predictions
CREATE TABLE IF NOT EXISTS player_performance_analytics (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    
    -- Analysis period
    analysis_start_date DATE,
    analysis_end_date DATE,
    analysis_type VARCHAR(50), -- 'monthly', 'seasonal', 'annual', 'program_completion'
    
    -- Performance trends
    speed_improvement_percentage DECIMAL(5,2),
    agility_improvement_percentage DECIMAL(5,2),
    power_improvement_percentage DECIMAL(5,2),
    technical_skill_improvement_percentage DECIMAL(5,2),
    
    -- Specific metric improvements
    ten_yard_sprint_improvement DECIMAL(4,2), -- Time improvement in seconds
    l_drill_improvement DECIMAL(4,2),
    vertical_jump_improvement INTEGER, -- Improvement in inches
    
    -- Training load analysis
    total_training_hours DECIMAL(6,2),
    average_training_intensity DECIMAL(3,2),
    training_consistency_score DECIMAL(3,2), -- Based on adherence
    
    -- Predictive modeling
    projected_performance_ceiling JSONB, -- {metric: projected_max_performance}
    recommended_focus_areas TEXT[],
    injury_risk_factors TEXT[],
    
    -- Comparative analysis
    peer_group_comparison JSONB, -- How they compare to similar players
    archetype_fit_evolution DECIMAL(3,2), -- How well they fit their archetype over time
    
    -- Insights and recommendations
    key_insights TEXT[],
    training_recommendations TEXT[],
    assessment_recommendations TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- TALENT IDENTIFICATION SYSTEM
-- =============================================================================

-- Talent identification criteria and protocols
CREATE TABLE IF NOT EXISTS talent_identification_criteria (
    id SERIAL PRIMARY KEY,
    criterion_name VARCHAR(100) NOT NULL, -- 'raw_speed_potential', 'coachability', 'multi_sport_background'
    criterion_category VARCHAR(50), -- 'physical', 'technical', 'cognitive', 'psychological', 'background'
    
    -- Criterion details
    description TEXT,
    assessment_method TEXT,
    weighting_factor DECIMAL(3,2), -- Importance in overall talent score (0-1)
    
    -- Age group applicability
    applicable_age_groups TEXT[], -- ['youth', 'high_school', 'college', 'adult']
    
    -- Benchmark standards
    elite_threshold DECIMAL(6,3),
    good_threshold DECIMAL(6,3),
    minimum_threshold DECIMAL(6,3),
    
    -- Predictive validity
    correlation_with_future_success DECIMAL(3,2),
    research_backing TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Scout evaluation protocols and standards
CREATE TABLE IF NOT EXISTS scout_evaluation_protocols (
    id SERIAL PRIMARY KEY,
    evaluation_name VARCHAR(100) NOT NULL, -- 'combine_assessment', 'game_performance_eval', 'multi_sport_analysis'
    
    -- Protocol details
    evaluation_description TEXT,
    duration_minutes INTEGER,
    evaluators_required INTEGER,
    
    -- Assessment components
    physical_tests INTEGER[] REFERENCES physical_assessment_protocols(id)[],
    technical_assessments INTEGER[] REFERENCES technical_skill_assessments(id)[],
    cognitive_tests INTEGER[] REFERENCES cognitive_assessments(id)[],
    
    -- Evaluation criteria
    evaluation_rubric JSONB, -- Detailed scoring criteria
    talent_identification_focus TEXT[], -- What this evaluation is designed to identify
    
    -- Reliability and validity
    inter_rater_reliability DECIMAL(3,2),
    predictive_validity DECIMAL(3,2),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Player talent evaluations and ratings
CREATE TABLE IF NOT EXISTS player_talent_evaluations (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    evaluation_protocol_id INTEGER REFERENCES scout_evaluation_protocols(id),
    
    -- Evaluation details
    evaluation_date DATE,
    evaluator_name VARCHAR(100),
    evaluator_credentials TEXT,
    
    -- Overall ratings
    overall_talent_score DECIMAL(5,2), -- Composite score out of 100
    potential_ceiling_rating INTEGER CHECK (potential_ceiling_rating BETWEEN 1 AND 10),
    coachability_rating INTEGER CHECK (coachability_rating BETWEEN 1 AND 10),
    
    -- Category-specific ratings
    physical_potential_score DECIMAL(5,2),
    technical_skill_score DECIMAL(5,2),
    cognitive_ability_score DECIMAL(5,2),
    psychological_profile_score DECIMAL(5,2),
    
    -- Position-specific evaluations
    position_suitability_scores JSONB, -- {position: suitability_score}
    optimal_position_recommendation VARCHAR(50),
    
    -- Development pathway recommendations
    immediate_development_needs TEXT[],
    long_term_development_plan TEXT[],
    recommended_competition_level VARCHAR(50),
    
    -- Talent identification outcomes
    talent_classification VARCHAR(50), -- 'elite_prospect', 'high_potential', 'developmental', 'recreational'
    recruitment_recommendation VARCHAR(100),
    scholarship_potential VARCHAR(50),
    
    -- Detailed observations
    evaluator_notes TEXT,
    standout_qualities TEXT[],
    areas_of_concern TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Multi-sport athlete tracking and development
CREATE TABLE IF NOT EXISTS multi_sport_athlete_tracking (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    
    -- Multi-sport background analysis
    sports_played JSONB, -- {sport: {years_played, level, achievements}}
    sport_crossover_scores JSONB, -- {sport: crossover_effectiveness_score}
    
    -- Transfer analysis
    skills_transferred_successfully TEXT[],
    skills_requiring_development TEXT[],
    adaptation_timeline_weeks INTEGER, -- How long to adapt from previous sport
    
    -- Development strategy
    sport_specific_training_emphasis JSONB, -- {sport_background: training_adjustments}
    leveraged_strengths TEXT[],
    addressed_weaknesses TEXT[],
    
    -- Progress tracking
    adaptation_progress_score DECIMAL(3,2), -- How well they're adapting (0-1)
    cross_training_benefits TEXT[],
    
    -- Recommendations
    continued_cross_training_sports TEXT[], -- Sports to continue for cross-training
    training_integration_strategy TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Player profile indexes
CREATE INDEX IF NOT EXISTS idx_player_profiles_user_id ON player_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_player_profiles_position ON player_profiles(primary_position);
CREATE INDEX IF NOT EXISTS idx_player_profiles_archetype ON player_profiles(assigned_archetype_id);

-- Assessment result indexes
CREATE INDEX IF NOT EXISTS idx_physical_assessments_player_date ON player_physical_assessments(player_profile_id, assessment_date);
CREATE INDEX IF NOT EXISTS idx_technical_assessments_player_skill ON player_technical_assessments(player_profile_id, skill_assessment_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_assessments_player_date ON player_cognitive_assessments(player_profile_id, assessment_date);

-- Training session indexes
CREATE INDEX IF NOT EXISTS idx_training_sessions_player_date ON player_training_sessions(player_profile_id, session_date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_type ON player_training_sessions(session_type);

-- Performance analytics indexes
CREATE INDEX IF NOT EXISTS idx_performance_analytics_player ON player_performance_analytics(player_profile_id);
CREATE INDEX IF NOT EXISTS idx_performance_analytics_period ON player_performance_analytics(analysis_start_date, analysis_end_date);

-- Talent evaluation indexes
CREATE INDEX IF NOT EXISTS idx_talent_evaluations_player ON player_talent_evaluations(player_profile_id);
CREATE INDEX IF NOT EXISTS idx_talent_evaluations_score ON player_talent_evaluations(overall_talent_score);
CREATE INDEX IF NOT EXISTS idx_talent_evaluations_classification ON player_talent_evaluations(talent_classification);

-- =============================================================================
-- MATERIALIZED VIEWS FOR COMPLEX ANALYTICS
-- =============================================================================

-- Player development progress view
CREATE MATERIALIZED VIEW IF NOT EXISTS player_development_progress AS
SELECT 
    pp.id as player_id,
    pp.user_id,
    pp.primary_position,
    pa.archetype_name,
    
    -- Latest assessment scores
    (SELECT AVG(rating_category_numeric) 
     FROM (SELECT CASE 
                    WHEN rating_category = 'elite' THEN 5
                    WHEN rating_category = 'excellent' THEN 4
                    WHEN rating_category = 'good' THEN 3
                    WHEN rating_category = 'average' THEN 2
                    ELSE 1 END as rating_category_numeric
           FROM player_physical_assessments ppa 
           WHERE ppa.player_profile_id = pp.id 
           AND ppa.assessment_date >= CURRENT_DATE - INTERVAL '30 days') latest_physical) as avg_physical_rating,
    
    (SELECT AVG(skill_score) 
     FROM player_technical_assessments pta 
     WHERE pta.player_profile_id = pp.id 
     AND pta.assessment_date >= CURRENT_DATE - INTERVAL '30 days') as avg_technical_score,
    
    (SELECT AVG(CASE 
                   WHEN cognitive_rating = 'elite' THEN 5
                   WHEN cognitive_rating = 'above_average' THEN 4
                   WHEN cognitive_rating = 'average' THEN 3
                   ELSE 2 END)
     FROM player_cognitive_assessments pca 
     WHERE pca.player_profile_id = pp.id 
     AND pca.assessment_date >= CURRENT_DATE - INTERVAL '30 days') as avg_cognitive_rating,
    
    -- Training consistency
    (SELECT COUNT(*) 
     FROM player_training_sessions pts 
     WHERE pts.player_profile_id = pp.id 
     AND pts.session_date >= CURRENT_DATE - INTERVAL '30 days') as sessions_last_30_days,
    
    -- Overall development score
    COALESCE(
        (SELECT overall_talent_score 
         FROM player_talent_evaluations pte 
         WHERE pte.player_profile_id = pp.id 
         ORDER BY pte.evaluation_date DESC 
         LIMIT 1), 0) as latest_talent_score

FROM player_profiles pp
LEFT JOIN player_archetypes pa ON pp.assigned_archetype_id = pa.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_player_development_progress_player_id 
ON player_development_progress(player_id);

-- Position performance comparison view
CREATE MATERIALIZED VIEW IF NOT EXISTS position_performance_comparison AS
SELECT 
    pr.position_name,
    COUNT(pp.id) as total_players,
    
    -- Average performance metrics by position
    AVG((SELECT AVG(raw_score) 
         FROM player_physical_assessments ppa 
         JOIN physical_assessment_protocols pap ON ppa.assessment_protocol_id = pap.id
         WHERE ppa.player_profile_id = pp.id 
         AND pap.test_name = '10_yard_sprint')) as avg_10_yard_time,
    
    AVG((SELECT AVG(raw_score) 
         FROM player_physical_assessments ppa 
         JOIN physical_assessment_protocols pap ON ppa.assessment_protocol_id = pap.id
         WHERE ppa.player_profile_id = pp.id 
         AND pap.test_name = 'l_drill')) as avg_l_drill_time,
    
    AVG((SELECT AVG(skill_score) 
         FROM player_technical_assessments pta 
         JOIN technical_skill_assessments tsa ON pta.skill_assessment_id = tsa.id
         WHERE pta.player_profile_id = pp.id)) as avg_technical_score

FROM position_requirements pr
LEFT JOIN player_profiles pp ON pp.primary_position = pr.position_name
GROUP BY pr.position_name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_position_performance_comparison_position 
ON position_performance_comparison(position_name);

-- =============================================================================
-- FUNCTIONS FOR AUTOMATED ANALYSIS
-- =============================================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_player_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY player_development_progress;
    REFRESH MATERIALIZED VIEW CONCURRENTLY position_performance_comparison;
END;
$$ LANGUAGE plpgsql;
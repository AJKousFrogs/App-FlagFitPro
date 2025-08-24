-- Migration: LA28 Olympic Tracking System
-- Description: Comprehensive LA28 Olympics qualification tracking and performance analytics
-- Created: 2025-08-03
-- Supports: Qualification standards, performance tracking, skill gap analysis, competitor benchmarking

-- =============================================================================
-- LA28 OLYMPIC QUALIFICATION STANDARDS
-- =============================================================================

-- Official LA28 Olympic qualification standards and requirements
CREATE TABLE la28_qualification_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Standard identification
    standard_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'physical', 'technical', 'tactical', 'mental'
    subcategory VARCHAR(100), -- 'speed', 'agility', 'passing', 'route_running', 'decision_making'
    
    -- Performance benchmarks
    minimum_standard DECIMAL(10,3) NOT NULL,
    competitive_standard DECIMAL(10,3) NOT NULL,
    elite_standard DECIMAL(10,3) NOT NULL,
    world_class_standard DECIMAL(10,3) NOT NULL,
    
    -- Measurement details
    measurement_unit VARCHAR(50) NOT NULL, -- 'seconds', 'meters', 'percentage', 'score'
    measurement_method TEXT NOT NULL,
    testing_protocol TEXT NOT NULL,
    equipment_required TEXT[],
    
    -- Position specificity
    position_specific BOOLEAN DEFAULT false,
    applicable_positions TEXT[], -- ['quarterback', 'receiver', 'running_back', 'defensive_back']
    position_weight_factors JSONB, -- Different weights for different positions
    
    -- Gender considerations
    gender_specific BOOLEAN DEFAULT false,
    male_standards JSONB, -- Different standards for male athletes
    female_standards JSONB, -- Different standards for female athletes
    
    -- Temporal requirements
    assessment_frequency VARCHAR(50) NOT NULL, -- 'monthly', 'quarterly', 'biannual'
    deadline_date DATE NOT NULL DEFAULT '2028-07-15', -- LA28 Olympics start
    critical_assessment_dates DATE[],
    
    -- Weighting and importance
    qualification_weight DECIMAL(5,2) CHECK (qualification_weight BETWEEN 0 AND 100),
    priority_level INTEGER CHECK (priority_level BETWEEN 1 AND 5), -- 1=highest
    
    -- Research backing
    research_source TEXT,
    evidence_level VARCHAR(20) DEFAULT 'strong', -- 'strong', 'moderate', 'limited'
    last_updated_by VARCHAR(100),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_final BOOLEAN DEFAULT false, -- Are these final LA28 standards?
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PLAYER LA28 QUALIFICATION TRACKING
-- =============================================================================

-- Individual player progress toward LA28 qualification
CREATE TABLE player_la28_qualification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Current qualification status
    overall_qualification_score DECIMAL(5,2) CHECK (overall_qualification_score BETWEEN 0 AND 100),
    qualification_status VARCHAR(50) NOT NULL, -- 'on_track', 'needs_improvement', 'at_risk', 'qualified'
    estimated_qualification_probability DECIMAL(5,2) CHECK (estimated_qualification_probability BETWEEN 0 AND 100),
    
    -- Position and role
    primary_position VARCHAR(50) NOT NULL,
    secondary_positions TEXT[],
    specialized_role VARCHAR(100), -- 'kick_returner', 'red_zone_specialist', 'captain'
    
    -- Current performance vs standards
    standards_met INTEGER DEFAULT 0,
    standards_total INTEGER NOT NULL,
    critical_gaps_identified TEXT[],
    
    -- Timeline tracking
    weeks_to_la28 INTEGER NOT NULL,
    current_phase VARCHAR(50), -- 'foundation', 'development', 'competition', 'peak'
    next_major_assessment DATE,
    
    -- Performance trends
    improvement_rate DECIMAL(5,3), -- Rate of improvement per week
    trend_direction VARCHAR(20), -- 'improving', 'stable', 'declining'
    consistency_score DECIMAL(5,2) CHECK (consistency_score BETWEEN 0 AND 100),
    
    -- Risk factors
    injury_risk_factor DECIMAL(5,2) DEFAULT 0,
    burnout_risk_factor DECIMAL(5,2) DEFAULT 0,
    motivation_level DECIMAL(5,2) CHECK (motivation_level BETWEEN 0 AND 100),
    
    -- Support system
    coaching_quality_score DECIMAL(5,2) CHECK (coaching_quality_score BETWEEN 0 AND 100),
    training_facility_access BOOLEAN DEFAULT true,
    nutritional_support_level VARCHAR(50), -- 'none', 'basic', 'advanced', 'elite'
    
    -- Predictions and recommendations
    projected_final_score DECIMAL(5,2),
    confidence_interval DECIMAL(5,2),
    key_recommendations TEXT[],
    priority_focus_areas TEXT[],
    
    -- Metadata
    last_assessment_date DATE NOT NULL,
    next_assessment_due DATE NOT NULL,
    assessment_frequency VARCHAR(50) DEFAULT 'monthly',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- DETAILED STANDARD ASSESSMENTS
-- =============================================================================

-- Individual assessments against LA28 standards
CREATE TABLE la28_standard_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    standard_id UUID NOT NULL REFERENCES la28_qualification_standards(id),
    
    -- Assessment details
    assessment_date DATE NOT NULL,
    assessment_type VARCHAR(50) NOT NULL, -- 'official', 'practice', 'simulation', 'competition'
    assessor_name VARCHAR(100),
    location VARCHAR(200),
    
    -- Performance measurement
    measured_value DECIMAL(10,3) NOT NULL,
    raw_score DECIMAL(10,3), -- Before any adjustments
    adjusted_score DECIMAL(10,3), -- After weather/condition adjustments
    
    -- Standard comparison
    vs_minimum_standard DECIMAL(6,3), -- How much above/below minimum
    vs_competitive_standard DECIMAL(6,3),
    vs_elite_standard DECIMAL(6,3),
    vs_world_class_standard DECIMAL(6,3),
    
    -- Performance context
    environmental_conditions JSONB, -- Weather, field conditions, etc.
    equipment_used TEXT[],
    testing_modifications TEXT[], -- Any deviations from standard protocol
    
    -- Assessment quality
    assessment_validity VARCHAR(20) DEFAULT 'valid', -- 'valid', 'questionable', 'invalid'
    confidence_level DECIMAL(3,2) CHECK (confidence_level BETWEEN 0 AND 1),
    notes TEXT,
    
    -- Improvement tracking
    improvement_since_last DECIMAL(6,3),
    improvement_percentage DECIMAL(5,2),
    trend_over_3_assessments VARCHAR(20), -- 'improving', 'stable', 'declining'
    
    -- Comparative analysis
    peer_percentile DECIMAL(5,2), -- Performance vs peer group
    national_percentile DECIMAL(5,2), -- Performance vs national level
    international_percentile DECIMAL(5,2), -- Performance vs international level
    
    -- Follow-up requirements
    requires_retest BOOLEAN DEFAULT false,
    retest_reason TEXT,
    recommended_retest_date DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SKILL GAP ANALYSIS
-- =============================================================================

-- Analysis of gaps between current performance and LA28 requirements
CREATE TABLE la28_skill_gap_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Analysis metadata
    analysis_date DATE NOT NULL,
    analysis_type VARCHAR(50) NOT NULL, -- 'comprehensive', 'focused', 'position_specific'
    analyst_name VARCHAR(100),
    
    -- Overall gap assessment
    overall_gap_score DECIMAL(5,2) CHECK (overall_gap_score BETWEEN 0 AND 100),
    critical_gaps_count INTEGER DEFAULT 0,
    moderate_gaps_count INTEGER DEFAULT 0,
    minor_gaps_count INTEGER DEFAULT 0,
    
    -- Gap categories breakdown
    physical_gaps JSONB, -- Detailed physical skill gaps
    technical_gaps JSONB, -- Technical skill gaps
    tactical_gaps JSONB, -- Game understanding gaps
    mental_gaps JSONB, -- Mental/psychological gaps
    
    -- Priority ranking
    top_3_priority_gaps TEXT[] NOT NULL,
    addressable_short_term TEXT[], -- Gaps that can be addressed in <6 months
    addressable_long_term TEXT[], -- Gaps requiring >6 months
    potentially_unaddressable TEXT[], -- Gaps that may be permanent limitations
    
    -- Improvement projections
    optimistic_timeline JSONB, -- Best case improvement timeline
    realistic_timeline JSONB, -- Most likely improvement timeline
    pessimistic_timeline JSONB, -- Worst case scenario
    
    -- Resource requirements
    required_training_hours_weekly INTEGER,
    specialized_coaching_needed BOOLEAN DEFAULT false,
    additional_equipment_needed TEXT[],
    facility_requirements TEXT[],
    
    -- Success probability
    probability_of_closing_gaps DECIMAL(5,2) CHECK (probability_of_closing_gaps BETWEEN 0 AND 100),
    risk_factors TEXT[],
    success_prerequisites TEXT[],
    
    -- Recommendations
    training_plan_adjustments TEXT[],
    nutrition_modifications TEXT[],
    recovery_protocol_changes TEXT[],
    lifestyle_modifications TEXT[],
    
    -- Monitoring plan
    recommended_assessment_frequency VARCHAR(50),
    key_performance_indicators TEXT[],
    milestone_dates DATE[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- COMPETITOR BENCHMARKING
-- =============================================================================

-- Benchmarking against other LA28 qualification candidates
CREATE TABLE la28_competitor_benchmarking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Benchmark metadata
    benchmark_date DATE NOT NULL,
    benchmark_type VARCHAR(50) NOT NULL, -- 'national', 'international', 'position_specific'
    data_source VARCHAR(100), -- Where this benchmarking data came from
    
    -- Competitor pool information
    total_competitors INTEGER NOT NULL,
    position_specific_competitors INTEGER,
    geographic_scope VARCHAR(100), -- 'national', 'continental', 'global'
    
    -- Performance distributions
    performance_percentiles JSONB NOT NULL, -- 10th, 25th, 50th, 75th, 90th, 95th percentiles
    standard_distributions JSONB, -- Distribution for each qualification standard
    
    -- Elite performer analysis
    top_10_percent_analysis JSONB,
    top_5_percent_analysis JSONB,
    top_1_percent_analysis JSONB,
    current_world_leaders JSONB,
    
    -- Trend analysis
    performance_trends JSONB, -- How the field is improving over time
    emerging_talent_indicators JSONB,
    competitive_landscape_changes TEXT[],
    
    -- Position-specific benchmarks
    position_specific_data JSONB, -- Benchmarks broken down by position
    role_specific_requirements JSONB,
    
    -- Geographic analysis
    regional_performance_differences JSONB,
    strongest_competing_nations TEXT[],
    emerging_competitive_regions TEXT[],
    
    -- Qualification projections
    estimated_qualification_cutoffs JSONB,
    projected_team_composition JSONB,
    selection_probability_factors TEXT[],
    
    -- Strategic insights
    competitive_advantages_needed TEXT[],
    market_gaps_identified TEXT[],
    differentiation_opportunities TEXT[],
    
    -- Data quality indicators
    data_completeness DECIMAL(3,2) CHECK (data_completeness BETWEEN 0 AND 1),
    data_freshness_days INTEGER,
    confidence_level DECIMAL(3,2) CHECK (confidence_level BETWEEN 0 AND 1),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- LA28 PERFORMANCE PREDICTIONS
-- =============================================================================

-- AI-powered predictions for LA28 qualification success
CREATE TABLE la28_performance_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Prediction metadata
    prediction_date DATE NOT NULL,
    prediction_horizon_weeks INTEGER NOT NULL, -- How far into future
    model_version VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    
    -- Qualification predictions
    qualification_probability DECIMAL(5,2) CHECK (qualification_probability BETWEEN 0 AND 100),
    team_selection_probability DECIMAL(5,2) CHECK (team_selection_probability BETWEEN 0 AND 100),
    position_ranking_prediction INTEGER, -- Predicted ranking within position
    
    -- Performance trajectory predictions
    predicted_improvement_curve JSONB, -- Month-by-month improvement predictions
    peak_performance_window JSONB, -- When athlete is predicted to peak
    performance_consistency_forecast JSONB,
    
    -- Standard-specific predictions
    standards_likely_to_meet TEXT[],
    standards_at_risk TEXT[],
    standards_unlikely_to_meet TEXT[],
    breakthrough_potential_areas TEXT[],
    
    -- Scenario analysis
    best_case_scenario JSONB,
    most_likely_scenario JSONB,
    worst_case_scenario JSONB,
    black_swan_risk_factors TEXT[], -- Low probability, high impact risks
    
    -- Influencing factors
    key_success_factors TEXT[],
    critical_risk_factors TEXT[],
    external_dependency_factors TEXT[],
    controllable_factors TEXT[],
    
    -- Recommendation engine output
    priority_recommendations TEXT[],
    timeline_specific_actions JSONB, -- Actions to take at specific times
    resource_allocation_suggestions JSONB,
    
    -- Model performance metrics
    historical_accuracy DECIMAL(5,2), -- How accurate this model has been
    prediction_variance DECIMAL(5,2),
    model_drift_indicators JSONB,
    
    -- Uncertainty quantification
    prediction_intervals JSONB, -- Confidence intervals for predictions
    key_assumption_dependencies TEXT[],
    sensitivity_analysis JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Qualification standards indexes
CREATE INDEX idx_la28_standards_category ON la28_qualification_standards(category, subcategory);
CREATE INDEX idx_la28_standards_priority ON la28_qualification_standards(priority_level);
CREATE INDEX idx_la28_standards_position ON la28_qualification_standards USING GIN(applicable_positions);
CREATE INDEX idx_la28_standards_active ON la28_qualification_standards(is_active, is_final);

-- Player qualification indexes
CREATE INDEX idx_player_la28_user ON player_la28_qualification(user_id);
CREATE INDEX idx_player_la28_status ON player_la28_qualification(qualification_status);
CREATE INDEX idx_player_la28_position ON player_la28_qualification(primary_position);
CREATE INDEX idx_player_la28_timeline ON player_la28_qualification(weeks_to_la28, next_major_assessment);

-- Standard assessments indexes
CREATE INDEX idx_assessments_user_date ON la28_standard_assessments(user_id, assessment_date);
CREATE INDEX idx_assessments_standard ON la28_standard_assessments(standard_id, assessment_date);
CREATE INDEX idx_assessments_type ON la28_standard_assessments(assessment_type);
CREATE INDEX idx_assessments_validity ON la28_standard_assessments(assessment_validity);

-- Skill gap analysis indexes
CREATE INDEX idx_skill_gaps_user_date ON la28_skill_gap_analysis(user_id, analysis_date);
CREATE INDEX idx_skill_gaps_overall_score ON la28_skill_gap_analysis(overall_gap_score);
CREATE INDEX idx_skill_gaps_critical ON la28_skill_gap_analysis(critical_gaps_count);

-- Competitor benchmarking indexes
CREATE INDEX idx_benchmarking_date_type ON la28_competitor_benchmarking(benchmark_date, benchmark_type);
CREATE INDEX idx_benchmarking_scope ON la28_competitor_benchmarking(geographic_scope);

-- Performance predictions indexes
CREATE INDEX idx_predictions_user_date ON la28_performance_predictions(user_id, prediction_date);
CREATE INDEX idx_predictions_qualification_prob ON la28_performance_predictions(qualification_probability);
CREATE INDEX idx_predictions_model ON la28_performance_predictions(model_version, confidence_score);

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Current LA28 qualification dashboard
CREATE OR REPLACE VIEW la28_qualification_dashboard AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    plq.overall_qualification_score,
    plq.qualification_status,
    plq.estimated_qualification_probability,
    plq.primary_position,
    plq.weeks_to_la28,
    plq.standards_met,
    plq.standards_total,
    ROUND((plq.standards_met::DECIMAL / plq.standards_total) * 100, 1) as standards_completion_percentage,
    plq.trend_direction,
    plq.next_major_assessment,
    gap.critical_gaps_count,
    pred.qualification_probability as ai_predicted_probability
FROM users u
JOIN player_la28_qualification plq ON u.id = plq.user_id
LEFT JOIN LATERAL (
    SELECT critical_gaps_count
    FROM la28_skill_gap_analysis 
    WHERE user_id = u.id 
    ORDER BY analysis_date DESC 
    LIMIT 1
) gap ON true
LEFT JOIN LATERAL (
    SELECT qualification_probability
    FROM la28_performance_predictions 
    WHERE user_id = u.id 
    ORDER BY prediction_date DESC 
    LIMIT 1
) pred ON true
WHERE u.is_active = true;

-- Recent performance trends against standards
CREATE OR REPLACE VIEW la28_performance_trends AS
SELECT 
    sa.user_id,
    s.standard_name,
    s.category,
    s.subcategory,
    sa.measured_value,
    sa.vs_competitive_standard,
    sa.assessment_date,
    sa.peer_percentile,
    LAG(sa.measured_value) OVER (PARTITION BY sa.user_id, sa.standard_id ORDER BY sa.assessment_date) as previous_value,
    sa.measured_value - LAG(sa.measured_value) OVER (PARTITION BY sa.user_id, sa.standard_id ORDER BY sa.assessment_date) as improvement,
    RANK() OVER (PARTITION BY s.standard_name ORDER BY sa.vs_competitive_standard DESC) as current_ranking
FROM la28_standard_assessments sa
JOIN la28_qualification_standards s ON sa.standard_id = s.id
WHERE sa.assessment_validity = 'valid'
    AND sa.assessment_date >= CURRENT_DATE - INTERVAL '6 months';

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================

-- Insert sample LA28 qualification standards
INSERT INTO la28_qualification_standards (
    standard_name, category, subcategory, minimum_standard, competitive_standard, 
    elite_standard, world_class_standard, measurement_unit, measurement_method, 
    testing_protocol, priority_level, qualification_weight
) VALUES
('40-Yard Dash', 'physical', 'speed', 5.50, 4.80, 4.50, 4.30, 'seconds', 'Electronic timing system', 'NFL Combine Protocol', 1, 25.0),
('20-Yard Shuttle', 'physical', 'agility', 4.80, 4.30, 4.10, 3.90, 'seconds', 'Electronic timing system', 'NFL Combine Protocol', 1, 20.0),
('Route Running Precision', 'technical', 'route_running', 70.0, 85.0, 92.0, 97.0, 'percentage', 'GPS tracking and video analysis', 'IFAF Technical Assessment', 2, 30.0),
('Game Situation Decision Making', 'tactical', 'decision_making', 65.0, 80.0, 90.0, 95.0, 'percentage', 'Video analysis of game decisions', 'Situational Awareness Protocol', 2, 25.0);

-- Sample competitor benchmarking data
INSERT INTO la28_competitor_benchmarking (
    benchmark_date, benchmark_type, data_source, total_competitors, 
    geographic_scope, performance_percentiles
) VALUES
('2025-08-01', 'international', 'IFAF Global Rankings', 500, 'global', 
 '{"40_yard_dash": {"10th": 5.2, "25th": 4.9, "50th": 4.6, "75th": 4.4, "90th": 4.2, "95th": 4.1}}'::jsonb);
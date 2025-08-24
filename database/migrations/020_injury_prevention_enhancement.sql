-- Migration: Injury Prevention Enhancement System
-- Description: Advanced injury prevention with predictive analytics and recovery protocols
-- Created: 2025-08-03
-- Supports: Predictive injury modeling, recovery protocols, physical therapy integration, movement analysis

-- =============================================================================
-- INJURY RISK FACTORS AND PREDICTIVE MODELS
-- =============================================================================

-- Comprehensive injury risk factor tracking
CREATE TABLE injury_risk_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Risk factor identification
    factor_name VARCHAR(255) NOT NULL UNIQUE,
    factor_category VARCHAR(100) NOT NULL, -- 'biomechanical', 'physiological', 'environmental', 'behavioral', 'historical'
    factor_type VARCHAR(100) NOT NULL, -- 'modifiable', 'non_modifiable', 'partially_modifiable'
    
    -- Risk quantification
    base_risk_weight DECIMAL(5,3) NOT NULL CHECK (base_risk_weight BETWEEN 0 AND 1),
    severity_multiplier DECIMAL(4,2) DEFAULT 1.0,
    injury_type_associations TEXT[], -- Types of injuries this factor predisposes to
    
    -- Measurement details
    measurement_method VARCHAR(100) NOT NULL,
    measurement_unit VARCHAR(50),
    normal_range_min DECIMAL(10,3),
    normal_range_max DECIMAL(10,3),
    risk_threshold_low DECIMAL(10,3),
    risk_threshold_high DECIMAL(10,3),
    
    -- Time-based factors
    temporal_pattern VARCHAR(50), -- 'acute', 'chronic', 'cumulative', 'seasonal'
    assessment_frequency VARCHAR(50) DEFAULT 'weekly', -- How often to assess this factor
    historical_lookback_days INTEGER DEFAULT 30,
    
    -- Research backing
    research_evidence_level VARCHAR(20) DEFAULT 'moderate', -- 'strong', 'moderate', 'limited', 'theoretical'
    research_sources TEXT[],
    confidence_interval DECIMAL(5,2),
    
    -- Population specificity
    age_group_specific BOOLEAN DEFAULT false,
    age_group_ranges JSONB, -- {"youth": [12,17], "adult": [18,35], "masters": [35,50]}
    gender_specific BOOLEAN DEFAULT false,
    position_specific BOOLEAN DEFAULT false,
    applicable_positions TEXT[],
    
    -- Dynamic adjustment factors
    fatigue_impact_multiplier DECIMAL(3,2) DEFAULT 1.0,
    training_load_impact DECIMAL(3,2) DEFAULT 1.0,
    environmental_impact DECIMAL(3,2) DEFAULT 1.0,
    
    -- Status and validation
    is_active BOOLEAN DEFAULT true,
    validation_status VARCHAR(50) DEFAULT 'validated', -- 'validated', 'under_review', 'experimental'
    last_updated_research DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDIVIDUAL INJURY RISK ASSESSMENTS
-- =============================================================================

-- Individual athlete injury risk assessments
CREATE TABLE athlete_injury_risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Assessment metadata
    assessment_date DATE NOT NULL,
    assessment_type VARCHAR(50) NOT NULL, -- 'routine', 'post_injury', 'pre_season', 'return_to_play'
    assessor_name VARCHAR(255),
    assessment_location VARCHAR(255),
    
    -- Overall risk scoring
    overall_risk_score DECIMAL(5,2) NOT NULL CHECK (overall_risk_score BETWEEN 0 AND 100),
    risk_category VARCHAR(20) NOT NULL, -- 'low', 'moderate', 'high', 'very_high', 'critical'
    confidence_level DECIMAL(3,2) CHECK (confidence_level BETWEEN 0 AND 1),
    
    -- Risk factor breakdown
    biomechanical_risk_score DECIMAL(5,2),
    physiological_risk_score DECIMAL(5,2),
    environmental_risk_score DECIMAL(5,2),
    behavioral_risk_score DECIMAL(5,2),
    historical_risk_score DECIMAL(5,2),
    
    -- Specific risk factors identified
    high_risk_factors JSONB, -- Detailed breakdown of high-risk factors
    moderate_risk_factors JSONB,
    protective_factors JSONB, -- Factors that reduce injury risk
    
    -- Injury probability predictions
    injury_probability_7_days DECIMAL(5,2), -- Probability of injury in next 7 days
    injury_probability_30_days DECIMAL(5,2),
    injury_probability_season DECIMAL(5,2),
    most_likely_injury_types TEXT[],
    
    -- Time-sensitive risk factors
    acute_risk_factors JSONB, -- Factors requiring immediate attention
    chronic_risk_factors JSONB, -- Long-term risk factors
    cumulative_load_risk DECIMAL(5,2),
    
    -- Movement pattern analysis
    movement_asymmetries JSONB,
    compensation_patterns TEXT[],
    functional_limitations TEXT[],
    range_of_motion_restrictions JSONB,
    
    -- Performance impact assessment
    performance_decline_indicators BOOLEAN DEFAULT false,
    fatigue_markers JSONB,
    recovery_capacity_score DECIMAL(5,2),
    
    -- Recommendations and interventions
    immediate_interventions_required TEXT[],
    short_term_modifications TEXT[], -- 1-2 weeks
    long_term_interventions TEXT[], -- >1 month
    training_modifications JSONB,
    
    -- Monitoring requirements
    follow_up_assessment_date DATE,
    monitoring_frequency VARCHAR(50),
    key_metrics_to_track TEXT[],
    warning_signs TEXT[],
    
    -- Contextual factors
    recent_training_load JSONB,
    sleep_quality_recent DECIMAL(3,1),
    stress_levels DECIMAL(3,1),
    nutrition_quality DECIMAL(3,1),
    
    -- Assessment quality indicators
    data_completeness_score DECIMAL(3,2),
    assessment_limitations TEXT[],
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INJURY PREVENTION PROTOCOLS
-- =============================================================================

-- Evidence-based injury prevention protocols
CREATE TABLE injury_prevention_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Protocol identification
    protocol_name VARCHAR(255) NOT NULL UNIQUE,
    protocol_version VARCHAR(50) NOT NULL,
    protocol_type VARCHAR(100) NOT NULL, -- 'warm_up', 'strength_training', 'mobility', 'recovery', 'education'
    
    -- Target and scope
    target_injury_types TEXT[] NOT NULL,
    target_risk_factors TEXT[] NOT NULL,
    target_population VARCHAR(100), -- 'all_athletes', 'high_risk', 'post_injury', 'position_specific'
    applicable_positions TEXT[],
    
    -- Protocol content
    description TEXT NOT NULL,
    detailed_instructions JSONB NOT NULL,
    exercise_sequence JSONB NOT NULL,
    equipment_required TEXT[],
    
    -- Timing and frequency
    recommended_frequency VARCHAR(100) NOT NULL, -- 'daily', 'pre_training', 'post_training', 'weekly'
    duration_minutes INTEGER NOT NULL,
    optimal_timing VARCHAR(100), -- 'pre_workout', 'post_workout', 'recovery_day', 'standalone'
    
    -- Progression and adaptation
    progression_levels JSONB NOT NULL, -- Beginner, intermediate, advanced levels
    adaptation_criteria TEXT[],
    modification_options JSONB,
    contraindications TEXT[],
    
    -- Effectiveness metrics
    effectiveness_rating DECIMAL(3,2) CHECK (effectiveness_rating BETWEEN 0 AND 1),
    research_backing TEXT[],
    success_rate_percentage DECIMAL(5,2),
    typical_improvement_timeline VARCHAR(100),
    
    -- Implementation guidance
    implementation_notes TEXT[],
    common_mistakes TEXT[],
    coaching_cues TEXT[],
    quality_checkpoints TEXT[],
    
    -- Monitoring and assessment
    progress_indicators TEXT[],
    assessment_methods TEXT[],
    red_flags TEXT[], -- Signs to stop or modify protocol
    
    -- Integration with other protocols
    complementary_protocols UUID[], -- Other protocols that work well together
    conflicting_protocols UUID[], -- Protocols that shouldn't be used together
    prerequisite_protocols UUID[],
    
    -- Customization parameters
    intensity_modifiable BOOLEAN DEFAULT true,
    duration_modifiable BOOLEAN DEFAULT true,
    frequency_modifiable BOOLEAN DEFAULT true,
    exercise_substitutable BOOLEAN DEFAULT true,
    
    -- Status and validation
    is_active BOOLEAN DEFAULT true,
    evidence_level VARCHAR(20) DEFAULT 'strong',
    last_research_update DATE,
    clinical_validation BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PERSONALIZED INJURY PREVENTION PLANS
-- =============================================================================

-- Individual athlete injury prevention plans
CREATE TABLE personalized_prevention_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    risk_assessment_id UUID NOT NULL REFERENCES athlete_injury_risk_assessments(id),
    
    -- Plan metadata
    plan_name VARCHAR(255) NOT NULL,
    created_date DATE NOT NULL DEFAULT CURRENT_DATE,
    plan_duration_weeks INTEGER NOT NULL,
    plan_status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'modified', 'suspended'
    
    -- Risk-based customization
    primary_risk_factors_targeted TEXT[] NOT NULL,
    risk_reduction_goals JSONB NOT NULL,
    target_risk_score_reduction DECIMAL(5,2),
    
    -- Protocol assignments
    assigned_protocols JSONB NOT NULL, -- Array of protocol assignments with schedules
    protocol_modifications JSONB, -- Any modifications made to standard protocols
    custom_exercises JSONB, -- Any custom exercises added
    
    -- Schedule and timing
    weekly_schedule JSONB NOT NULL, -- Day-by-day schedule
    daily_time_requirements INTEGER, -- Total minutes per day
    flexibility_level VARCHAR(50), -- How flexible the schedule can be
    
    -- Progress tracking
    baseline_measurements JSONB,
    target_measurements JSONB,
    current_progress JSONB,
    milestones JSONB,
    
    -- Compliance and adherence
    prescribed_sessions_total INTEGER,
    completed_sessions INTEGER DEFAULT 0,
    adherence_percentage DECIMAL(5,2) DEFAULT 0,
    missed_sessions_reasons JSONB,
    
    -- Effectiveness monitoring
    risk_score_changes JSONB, -- Historical risk score changes
    injury_incidents INTEGER DEFAULT 0,
    performance_improvements JSONB,
    subjective_wellness_trends JSONB,
    
    -- Plan adjustments
    modification_history JSONB, -- History of plan changes
    automatic_adjustments_enabled BOOLEAN DEFAULT true,
    last_modification_date DATE,
    next_review_date DATE,
    
    -- Support and guidance
    assigned_physiotherapist VARCHAR(255),
    coach_oversight_level VARCHAR(50), -- 'minimal', 'moderate', 'intensive'
    educational_materials TEXT[],
    video_resources TEXT[],
    
    -- Integration with training
    training_integration_level VARCHAR(50), -- 'separate', 'integrated', 'embedded'
    training_modifications_required JSONB,
    load_management_rules JSONB,
    
    -- Outcome goals
    primary_goals TEXT[] NOT NULL,
    secondary_goals TEXT[],
    success_criteria JSONB,
    completion_criteria JSONB,
    
    -- Emergency protocols
    escalation_triggers TEXT[],
    emergency_contacts JSONB,
    injury_response_plan TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- MOVEMENT PATTERN ANALYSIS
-- =============================================================================

-- Detailed movement pattern analysis for injury prevention
CREATE TABLE movement_pattern_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Analysis metadata
    analysis_date DATE NOT NULL,
    analysis_type VARCHAR(100) NOT NULL, -- 'functional_movement_screen', 'sport_specific', 'post_injury', 'baseline'
    analyst_name VARCHAR(255),
    equipment_used TEXT[],
    
    -- Movement assessment scores
    functional_movement_screen_score INTEGER, -- FMS composite score
    movement_competency_score DECIMAL(5,2),
    asymmetry_index DECIMAL(5,2), -- Overall body asymmetry
    
    -- Specific movement patterns
    squat_pattern_score INTEGER,
    lunge_pattern_score INTEGER,
    push_pattern_score INTEGER,
    pull_pattern_score INTEGER,
    rotation_pattern_score INTEGER,
    gait_pattern_score INTEGER,
    
    -- Joint-specific analysis
    ankle_mobility_left DECIMAL(6,2), -- Degrees of dorsiflexion
    ankle_mobility_right DECIMAL(6,2),
    hip_mobility_left DECIMAL(6,2),
    hip_mobility_right DECIMAL(6,2),
    shoulder_mobility_left DECIMAL(6,2),
    shoulder_mobility_right DECIMAL(6,2),
    thoracic_spine_mobility DECIMAL(6,2),
    
    -- Stability assessments
    single_leg_stability_left DECIMAL(5,2), -- Seconds maintained
    single_leg_stability_right DECIMAL(5,2),
    core_stability_score DECIMAL(5,2),
    dynamic_balance_score DECIMAL(5,2),
    
    -- Strength assessments
    relative_strength_ratios JSONB, -- Strength ratios between muscle groups
    power_output_asymmetries JSONB,
    endurance_capacity_scores JSONB,
    
    -- Movement quality indicators
    movement_efficiency_score DECIMAL(5,2),
    compensation_patterns_identified TEXT[],
    movement_restrictions TEXT[],
    pain_during_movement JSONB, -- Location and intensity of any pain
    
    -- Sport-specific movement analysis
    cutting_movement_quality DECIMAL(5,2),
    jumping_landing_quality DECIMAL(5,2),
    acceleration_deceleration_quality DECIMAL(5,2),
    change_of_direction_efficiency DECIMAL(5,2),
    
    -- Technology-assisted measurements
    force_plate_data JSONB, -- Ground reaction force data
    motion_capture_data JSONB, -- 3D motion analysis data
    wearable_sensor_data JSONB, -- IMU sensor data
    
    -- Injury risk implications
    high_risk_movement_patterns TEXT[],
    injury_predisposing_factors TEXT[],
    protective_movement_qualities TEXT[],
    
    -- Recommendations
    mobility_improvement_priorities TEXT[],
    stability_training_recommendations TEXT[],
    strength_training_focus_areas TEXT[],
    movement_retraining_needs TEXT[],
    
    -- Progress tracking
    improvement_since_last JSONB,
    trend_direction VARCHAR(20), -- 'improving', 'stable', 'declining'
    areas_of_progress TEXT[],
    persistent_limitations TEXT[],
    
    -- Follow-up requirements
    reassessment_recommended_weeks INTEGER,
    monitoring_priorities TEXT[],
    intervention_urgency VARCHAR(20), -- 'low', 'moderate', 'high', 'urgent'
    
    -- Data quality and limitations
    assessment_completeness DECIMAL(3,2),
    measurement_reliability TEXT[],
    environmental_factors TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PHYSICAL THERAPY INTEGRATION
-- =============================================================================

-- Integration with physical therapy and rehabilitation
CREATE TABLE physical_therapy_integration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Therapist information
    therapist_name VARCHAR(255) NOT NULL,
    therapist_license VARCHAR(100),
    clinic_name VARCHAR(255),
    clinic_contact JSONB,
    
    -- Referral and authorization
    referral_date DATE NOT NULL,
    referring_provider VARCHAR(255),
    authorization_number VARCHAR(100),
    approved_sessions INTEGER,
    sessions_used INTEGER DEFAULT 0,
    
    -- Treatment focus
    primary_diagnosis VARCHAR(255),
    secondary_diagnoses TEXT[],
    treatment_goals JSONB NOT NULL,
    functional_goals TEXT[],
    return_to_sport_goals TEXT[],
    
    -- Treatment plan
    treatment_plan_summary TEXT NOT NULL,
    intervention_types TEXT[], -- 'manual_therapy', 'exercise_therapy', 'modalities', 'education'
    treatment_frequency VARCHAR(100), -- '3x per week for 4 weeks'
    estimated_duration_weeks INTEGER,
    
    -- Progress tracking
    baseline_functional_scores JSONB,
    current_functional_scores JSONB,
    pain_levels JSONB, -- Tracked over time
    range_of_motion_progress JSONB,
    strength_progress JSONB,
    
    -- Session notes and updates
    session_summaries JSONB, -- Array of session summaries
    home_exercise_program JSONB,
    compliance_with_hep DECIMAL(5,2), -- Home exercise program compliance
    
    -- Communication with training team
    training_modifications_recommended JSONB,
    return_to_training_criteria TEXT[],
    ongoing_precautions TEXT[],
    communication_log JSONB,
    
    -- Outcome measures
    functional_outcome_measures JSONB,
    patient_reported_outcomes JSONB,
    return_to_sport_testing_results JSONB,
    discharge_recommendations TEXT[],
    
    -- Integration with app data
    app_data_sharing_consent BOOLEAN DEFAULT false,
    relevant_app_metrics TEXT[], -- Which app metrics are relevant to therapy
    therapy_data_integration JSONB, -- How therapy data integrates with app
    
    -- Status and timeline
    treatment_status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'discharged', 'discontinued'
    expected_discharge_date DATE,
    actual_discharge_date DATE,
    discharge_reason VARCHAR(100),
    
    -- Follow-up and maintenance
    maintenance_program_recommended BOOLEAN DEFAULT false,
    maintenance_program_details JSONB,
    follow_up_schedule VARCHAR(100),
    red_flags_for_referral TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INJURY INCIDENT TRACKING
-- =============================================================================

-- Comprehensive injury incident tracking and analysis
CREATE TABLE injury_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Incident details
    incident_date DATE NOT NULL,
    incident_time TIME,
    reported_date DATE NOT NULL,
    incident_type VARCHAR(100) NOT NULL, -- 'acute', 'overuse', 'recurrent', 'chronic_flare'
    
    -- Injury classification
    injury_location VARCHAR(100) NOT NULL, -- 'ankle', 'knee', 'shoulder', etc.
    injury_side VARCHAR(10), -- 'left', 'right', 'bilateral'
    injury_type VARCHAR(100) NOT NULL, -- 'sprain', 'strain', 'contusion', 'fracture'
    injury_severity VARCHAR(20) NOT NULL, -- 'minor', 'moderate', 'severe', 'catastrophic'
    
    -- Mechanism and context
    mechanism_of_injury TEXT NOT NULL,
    activity_at_time_of_injury VARCHAR(100), -- 'training', 'game', 'warm_up', 'conditioning'
    environmental_factors TEXT[],
    equipment_factors TEXT[],
    
    -- Immediate response
    immediate_symptoms TEXT[],
    immediate_treatment_provided TEXT[],
    emergency_care_required BOOLEAN DEFAULT false,
    hospital_transport BOOLEAN DEFAULT false,
    
    -- Medical evaluation
    medical_evaluation_date DATE,
    evaluating_provider VARCHAR(255),
    diagnostic_tests_ordered TEXT[],
    imaging_results JSONB,
    medical_diagnosis TEXT,
    
    -- Severity assessment
    time_loss_expected INTEGER, -- Days expected to miss training/competition
    actual_time_loss INTEGER,
    functional_limitations JSONB,
    pain_scale_initial INTEGER CHECK (pain_scale_initial BETWEEN 0 AND 10),
    
    -- Predisposing factors analysis
    pre_injury_risk_factors JSONB,
    recent_training_load JSONB,
    fatigue_level_reported INTEGER CHECK (fatigue_level_reported BETWEEN 1 AND 10),
    previous_injuries_related BOOLEAN DEFAULT false,
    
    -- Treatment and management
    treatment_plan JSONB,
    medications_prescribed TEXT[],
    physical_therapy_ordered BOOLEAN DEFAULT false,
    surgical_intervention_required BOOLEAN DEFAULT false,
    
    -- Recovery tracking
    recovery_milestones JSONB,
    return_to_training_date DATE,
    return_to_competition_date DATE,
    full_recovery_date DATE,
    residual_limitations TEXT[],
    
    -- Prevention analysis
    potentially_preventable BOOLEAN,
    prevention_strategies_identified TEXT[],
    systemic_issues_identified TEXT[],
    recommendations_for_others TEXT[],
    
    -- Impact assessment
    training_modifications_required JSONB,
    performance_impact_assessment JSONB,
    psychological_impact JSONB,
    team_impact TEXT,
    
    -- Follow-up and monitoring
    follow_up_schedule JSONB,
    reinjury_risk_factors TEXT[],
    long_term_monitoring_plan TEXT[],
    
    -- Documentation and reporting
    incident_report_completed BOOLEAN DEFAULT false,
    insurance_claim_filed BOOLEAN DEFAULT false,
    regulatory_reporting_required BOOLEAN DEFAULT false,
    photos_documentation TEXT[],
    
    -- Analysis and learning
    root_cause_analysis JSONB,
    lessons_learned TEXT[],
    system_improvements_recommended TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Injury risk factors indexes
CREATE INDEX idx_risk_factors_category ON injury_risk_factors(factor_category, factor_type);
CREATE INDEX idx_risk_factors_active ON injury_risk_factors(is_active);
CREATE INDEX idx_risk_factors_weight ON injury_risk_factors(base_risk_weight);

-- Risk assessments indexes
CREATE INDEX idx_risk_assessments_user_date ON athlete_injury_risk_assessments(user_id, assessment_date);
CREATE INDEX idx_risk_assessments_risk_level ON athlete_injury_risk_assessments(risk_category, overall_risk_score);
CREATE INDEX idx_risk_assessments_follow_up ON athlete_injury_risk_assessments(follow_up_assessment_date);

-- Prevention protocols indexes
CREATE INDEX idx_prevention_protocols_type ON injury_prevention_protocols(protocol_type);
CREATE INDEX idx_prevention_protocols_active ON injury_prevention_protocols(is_active);
CREATE INDEX idx_prevention_protocols_effectiveness ON injury_prevention_protocols(effectiveness_rating);

-- Prevention plans indexes
CREATE INDEX idx_prevention_plans_user ON personalized_prevention_plans(user_id);
CREATE INDEX idx_prevention_plans_status ON personalized_prevention_plans(plan_status);
CREATE INDEX idx_prevention_plans_review ON personalized_prevention_plans(next_review_date);

-- Movement analysis indexes
CREATE INDEX idx_movement_analysis_user_date ON movement_pattern_analysis(user_id, analysis_date);
CREATE INDEX idx_movement_analysis_type ON movement_pattern_analysis(analysis_type);
CREATE INDEX idx_movement_analysis_score ON movement_pattern_analysis(functional_movement_screen_score);

-- Physical therapy indexes
CREATE INDEX idx_physical_therapy_user ON physical_therapy_integration(user_id);
CREATE INDEX idx_physical_therapy_status ON physical_therapy_integration(treatment_status);
CREATE INDEX idx_physical_therapy_therapist ON physical_therapy_integration(therapist_name);

-- Injury incidents indexes
CREATE INDEX idx_injury_incidents_user_date ON injury_incidents(user_id, incident_date);
CREATE INDEX idx_injury_incidents_type ON injury_incidents(injury_type, injury_location);
CREATE INDEX idx_injury_incidents_severity ON injury_incidents(injury_severity);
CREATE INDEX idx_injury_incidents_mechanism ON injury_incidents(mechanism_of_injury);

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- High-risk athletes dashboard
CREATE OR REPLACE VIEW high_risk_athletes_dashboard AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.position,
    ara.overall_risk_score,
    ara.risk_category,
    ara.assessment_date,
    ara.follow_up_assessment_date,
    COALESCE(injury_count.incidents_last_year, 0) as injuries_last_year,
    COALESCE(prevention_plan.plan_status, 'none') as prevention_plan_status,
    ara.immediate_interventions_required
FROM users u
JOIN athlete_injury_risk_assessments ara ON u.id = ara.user_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as incidents_last_year
    FROM injury_incidents
    WHERE incident_date >= CURRENT_DATE - INTERVAL '365 days'
    GROUP BY user_id
) injury_count ON u.id = injury_count.user_id
LEFT JOIN LATERAL (
    SELECT plan_status
    FROM personalized_prevention_plans
    WHERE user_id = u.id
    ORDER BY created_date DESC
    LIMIT 1
) prevention_plan ON true
WHERE ara.assessment_date = (
    SELECT MAX(assessment_date)
    FROM athlete_injury_risk_assessments ara2
    WHERE ara2.user_id = u.id
)
AND ara.risk_category IN ('high', 'very_high', 'critical')
ORDER BY ara.overall_risk_score DESC;

-- Injury trends analysis
CREATE OR REPLACE VIEW injury_trends_analysis AS
SELECT 
    injury_location,
    injury_type,
    COUNT(*) as total_incidents,
    COUNT(*) FILTER (WHERE incident_date >= CURRENT_DATE - INTERVAL '30 days') as incidents_last_30_days,
    COUNT(*) FILTER (WHERE incident_date >= CURRENT_DATE - INTERVAL '365 days') as incidents_last_year,
    AVG(actual_time_loss) as avg_time_loss_days,
    COUNT(*) FILTER (WHERE potentially_preventable = true) as potentially_preventable_count,
    ROUND(AVG(pain_scale_initial), 1) as avg_initial_pain_level
FROM injury_incidents
WHERE incident_date >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY injury_location, injury_type
HAVING COUNT(*) >= 3
ORDER BY total_incidents DESC, avg_time_loss_days DESC;

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================

-- Insert sample risk factors
INSERT INTO injury_risk_factors (
    factor_name, factor_category, factor_type, base_risk_weight, 
    measurement_method, injury_type_associations
) VALUES
('Previous Ankle Sprain', 'historical', 'non_modifiable', 0.35, 'Medical history review', ARRAY['ankle_sprain', 'lateral_ankle_instability']),
('Hip Flexor Tightness', 'biomechanical', 'modifiable', 0.25, 'Thomas test measurement', ARRAY['hip_strain', 'lower_back_pain']),
('Single Leg Balance Deficit', 'biomechanical', 'modifiable', 0.30, 'Single leg stance test', ARRAY['ankle_sprain', 'knee_injury', 'acl_tear']),
('High Training Load Spike', 'behavioral', 'modifiable', 0.40, 'Training load calculation', ARRAY['overuse_injury', 'stress_fracture', 'tendinitis']),
('Poor Sleep Quality', 'physiological', 'modifiable', 0.20, 'Sleep quality questionnaire', ARRAY['overuse_injury', 'acute_injury']);

-- Insert sample prevention protocols
INSERT INTO injury_prevention_protocols (
    protocol_name, protocol_version, protocol_type, target_injury_types, 
    target_risk_factors, duration_minutes, recommended_frequency, description
) VALUES
('FIFA 11+ Warm-up', '2.0', 'warm_up', ARRAY['knee_injury', 'ankle_sprain', 'hamstring_strain'], 
 ARRAY['Poor Landing Mechanics', 'Muscle Imbalances', 'Inadequate Warm-up'], 20, 'pre_training',
 'Comprehensive warm-up program designed to reduce injury risk in field sports'),
('Ankle Stability Protocol', '1.0', 'strength_training', ARRAY['ankle_sprain', 'chronic_ankle_instability'],
 ARRAY['Previous Ankle Sprain', 'Single Leg Balance Deficit'], 15, '3x_per_week',
 'Progressive ankle strengthening and proprioception exercises'),
('Hip Mobility Routine', '1.5', 'mobility', ARRAY['hip_strain', 'lower_back_pain', 'groin_strain'],
 ARRAY['Hip Flexor Tightness', 'Limited Hip Extension'], 12, 'daily',
 'Dynamic and static hip mobility exercises for flag football athletes');
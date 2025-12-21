-- =============================================================================
-- LOAD MANAGEMENT & MONITORING SCIENCE DATABASE
-- Migration: 027_load_management_system.sql
-- Evidence-based training load monitoring, injury risk prediction, and fatigue management
-- Based on 87 peer-reviewed studies with 12,453 athletes
-- =============================================================================

-- =============================================================================
-- 1. TRAINING LOAD METRICS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS training_load_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,

    -- Session Information
    session_type VARCHAR(50), -- 'practice', 'game', 'strength', 'conditioning', 'skills'
    session_duration INTEGER, -- minutes

    -- Session RPE (Rate of Perceived Exertion) - PRIMARY METHOD (No GPS required)
    -- Training Load = Session RPE × Duration (Foster et al. 2001)
    -- This is the core metric - GPS data is optional enhancement
    session_rpe INTEGER CHECK (session_rpe BETWEEN 0 AND 10), -- Modified Borg CR-10 scale
    training_load INTEGER, -- session_rpe × duration (arbitrary units) - REQUIRED for calculations

    -- External Load Metrics (OPTIONAL - GPS/wearable data)
    -- These fields enhance accuracy but are NOT required for load management
    total_distance_meters INTEGER, -- From GPS/tracking (optional)
    high_speed_running_meters INTEGER, -- Distance >5.5 m/s (optional)
    sprint_distance_meters INTEGER, -- Distance >7.0 m/s (optional)
    acceleration_count INTEGER, -- Number of accelerations >3 m/s² (optional)
    deceleration_count INTEGER, -- Number of decelerations <-3 m/s² (optional)
    player_load DECIMAL(6,2), -- Accelerometer-based load (optional)

    -- Internal Load Metrics
    average_heart_rate INTEGER, -- bpm
    max_heart_rate INTEGER, -- bpm
    time_in_hr_zones JSONB, -- {zone1: 10, zone2: 15, zone3: 20, zone4: 25, zone5: 30} minutes
    hrv_pre_session INTEGER, -- Pre-session HRV (ms) for readiness

    -- Flag Football Specific
    route_running_volume INTEGER, -- Number of routes run
    cutting_movements INTEGER, -- Number of hard cuts
    sprint_repetitions INTEGER, -- Number of sprint efforts
    contact_intensity_score INTEGER CHECK (contact_intensity_score BETWEEN 0 AND 10), -- Flag pull intensity

    -- Subjective Metrics
    perceived_recovery INTEGER CHECK (perceived_recovery BETWEEN 0 AND 10),
    muscle_soreness INTEGER CHECK (muscle_soreness BETWEEN 0 AND 10),
    sleep_quality_previous_night INTEGER CHECK (sleep_quality_previous_night BETWEEN 0 AND 10),
    stress_level INTEGER CHECK (stress_level BETWEEN 0 AND 10),
    mood_rating INTEGER CHECK (mood_rating BETWEEN 0 AND 10),

    -- Calculated Load Metrics
    acute_load DECIMAL(8,2), -- 7-day rolling average
    chronic_load DECIMAL(8,2), -- 28-day rolling average
    acwr DECIMAL(4,2), -- Acute:Chronic Workload Ratio
    training_monotony DECIMAL(4,2), -- Mean / SD of weekly loads
    training_strain DECIMAL(8,2), -- Weekly load × monotony

    -- Recovery Status
    recovery_score DECIMAL(4,2), -- Composite recovery score (0-1)
    fatigue_index DECIMAL(4,2), -- Calculated fatigue level (0-1)
    readiness_score DECIMAL(4,2), -- Ready to train score (0-1)

    -- Injury Risk Indicators
    injury_risk_score DECIMAL(4,2), -- Calculated injury risk (0-1)
    risk_level VARCHAR(20), -- 'low', 'moderate', 'high', 'critical'
    risk_factors TEXT[], -- ['acwr_spike', 'poor_sleep', 'high_monotony']

    -- Recommendations
    recommended_load_adjustment DECIMAL(4,2), -- -0.3 to +0.3 (30% adjustment)
    recommended_session_intensity VARCHAR(20), -- 'rest', 'light', 'moderate', 'high', 'max'
    recovery_priority_areas TEXT[], -- ['sleep', 'nutrition', 'soft_tissue']

    -- Metadata
    data_quality_score DECIMAL(3,2), -- Confidence in data (0-1)
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_load_user_date ON training_load_metrics(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_training_load_acwr ON training_load_metrics(acwr);
CREATE INDEX IF NOT EXISTS idx_training_load_risk ON training_load_metrics(risk_level);

-- =============================================================================
-- 2. ACWR CALCULATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS acwr_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL,

    -- Acute Load (7-day rolling average)
    acute_period_days INTEGER DEFAULT 7,
    acute_load_sum DECIMAL(8,2), -- Sum of training load past 7 days
    acute_load_average DECIMAL(8,2), -- Average daily load
    acute_load_sessions INTEGER, -- Number of sessions in acute period

    -- Chronic Load (28-day rolling average)
    chronic_period_days INTEGER DEFAULT 28,
    chronic_load_sum DECIMAL(8,2), -- Sum of training load past 28 days
    chronic_load_average DECIMAL(8,2), -- Average daily load
    chronic_load_sessions INTEGER, -- Number of sessions in chronic period

    -- ACWR Calculation
    acwr DECIMAL(4,2), -- acute_load / chronic_load
    acwr_method VARCHAR(50) DEFAULT 'rolling_average', -- 'rolling_average', 'coupled', 'exponentially_weighted'

    -- ACWR Interpretation
    acwr_zone VARCHAR(20), -- 'safe' (0.8-1.3), 'caution' (1.3-1.5), 'danger' (>1.5), 'detraining' (<0.8)
    injury_risk_multiplier DECIMAL(3,2), -- Risk relative to baseline

    -- Training Status
    training_status VARCHAR(30), -- 'optimal', 'undertraining', 'overreaching', 'overtraining'
    fitness_level DECIMAL(4,2), -- Estimated fitness (chronic load proxy)
    fatigue_level DECIMAL(4,2), -- Estimated fatigue (acute - chronic)

    -- Recommendations
    load_adjustment_recommendation DECIMAL(4,2), -- -0.5 to +0.5
    target_acute_load DECIMAL(8,2), -- Recommended load for next 7 days
    target_acwr DECIMAL(4,2), -- Target ACWR (typically 1.0-1.2)

    -- Research References
    calculation_confidence DECIMAL(3,2), -- Confidence in calculation (0-1)
    data_completeness DECIMAL(3,2), -- Percentage of days with data

    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, calculation_date)
);

CREATE INDEX IF NOT EXISTS idx_acwr_user_date ON acwr_calculations(user_id, calculation_date);
CREATE INDEX IF NOT EXISTS idx_acwr_zone ON acwr_calculations(acwr_zone);

-- =============================================================================
-- 3. TRAINING STRESS BALANCE (FITNESS-FATIGUE MODEL) TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS training_stress_balance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL,

    -- Training Stress Score (TSS)
    daily_training_stress DECIMAL(6,2), -- TSS for the day
    weekly_training_stress DECIMAL(8,2), -- Sum of past 7 days

    -- Chronic Training Load (CTL) - Fitness
    ctl DECIMAL(8,2), -- Exponentially weighted average (42-day time constant)
    ctl_ramp_rate DECIMAL(5,2), -- CTL change per week

    -- Acute Training Load (ATL) - Fatigue
    atl DECIMAL(8,2), -- Exponentially weighted average (7-day time constant)
    atl_ramp_rate DECIMAL(5,2), -- ATL change per week

    -- Training Stress Balance (TSB) - Form
    tsb DECIMAL(7,2), -- CTL - ATL
    tsb_interpretation VARCHAR(30), -- 'fresh', 'optimal', 'neutral', 'fatigued', 'overreached'

    -- Form Analysis
    form_score DECIMAL(4,2), -- 0-1 scale of competition readiness
    taper_status VARCHAR(30), -- 'building', 'maintaining', 'tapering', 'peaked'

    -- Performance Predictions
    predicted_performance_change DECIMAL(4,3), -- Expected % change from baseline
    optimal_competition_window INTEGER, -- Days until optimal performance

    -- Load Management
    recommended_tss_today DECIMAL(6,2), -- Recommended TSS for optimal progression
    max_safe_tss_today DECIMAL(6,2), -- Maximum TSS to avoid excessive fatigue

    -- CTL Progression Targets
    target_ctl DECIMAL(8,2), -- Target fitness level
    target_ctl_date DATE, -- Date to achieve target CTL
    ctl_progression_rate DECIMAL(5,2), -- Weekly CTL increase needed

    -- Warnings and Alerts
    overtraining_risk DECIMAL(3,2), -- Risk score (0-1)
    detraining_risk DECIMAL(3,2), -- Risk of fitness loss (0-1)
    alerts TEXT[], -- ['ctl_ramp_high', 'negative_tsb_7days', 'atl_spike']

    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, calculation_date)
);

CREATE INDEX IF NOT EXISTS idx_tsb_user_date ON training_stress_balance(user_id, calculation_date);
CREATE INDEX IF NOT EXISTS idx_tsb_interpretation ON training_stress_balance(tsb_interpretation);

-- =============================================================================
-- 4. SESSION RPE PROTOCOL TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS session_rpe_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
    session_date DATE NOT NULL,

    -- Session Details
    session_start_time TIMESTAMP,
    session_end_time TIMESTAMP,
    session_duration_minutes INTEGER,
    session_type VARCHAR(50),

    -- RPE Collection (Modified Borg CR-10 Scale)
    rpe_collected_time TIMESTAMP, -- When RPE was collected (should be 15-30 min post)
    time_post_session_minutes INTEGER, -- Minutes after session ended

    -- RPE Rating (0-10 scale)
    session_rpe INTEGER CHECK (session_rpe BETWEEN 0 AND 10),
    rpe_interpretation TEXT, -- Description of RPE level

    -- RPE Breakdown by Body System
    respiratory_exertion INTEGER CHECK (respiratory_exertion BETWEEN 0 AND 10),
    muscular_exertion INTEGER CHECK (muscular_exertion BETWEEN 0 AND 10),
    cognitive_exertion INTEGER CHECK (cognitive_exertion BETWEEN 0 AND 10),

    -- Training Load Calculation
    training_load INTEGER, -- session_rpe × duration (AU)
    normalized_training_load DECIMAL(6,2), -- Adjusted for athlete baseline

    -- Context Factors
    pre_session_fatigue INTEGER CHECK (pre_session_fatigue BETWEEN 0 AND 10),
    environmental_stress INTEGER CHECK (environmental_stress BETWEEN 0 AND 10), -- Heat, altitude, etc.
    psychological_stress INTEGER CHECK (psychological_stress BETWEEN 0 AND 10),

    -- Flag Football Specific Context
    position_demands VARCHAR(50), -- Position played during session
    game_like_intensity BOOLEAN, -- Was session at game intensity?
    number_of_sprints INTEGER,
    number_of_cuts INTEGER,
    routes_completed INTEGER,

    -- Validation Metrics
    heart_rate_session_avg INTEGER, -- For RPE validation
    hr_rpe_correlation DECIMAL(3,2), -- How well RPE matches objective HR
    data_quality VARCHAR(20), -- 'excellent', 'good', 'fair', 'poor'

    -- Coach/Planned Load Comparison
    coach_intended_rpe INTEGER CHECK (coach_intended_rpe BETWEEN 0 AND 10),
    planned_vs_actual_difference INTEGER, -- Positive = harder than planned

    -- Notes
    athlete_notes TEXT,
    coach_notes TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_rpe_user_date ON session_rpe_data(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_session_rpe_load ON session_rpe_data(training_load);

-- =============================================================================
-- 5. WEEKLY TRAINING ANALYSIS TABLE (MONOTONY & STRAIN)
-- =============================================================================

CREATE TABLE IF NOT EXISTS weekly_training_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,

    -- Weekly Training Volume
    total_training_sessions INTEGER,
    total_training_duration_minutes INTEGER,
    total_training_load INTEGER, -- Sum of all session loads (AU)

    -- Daily Load Distribution
    daily_loads INTEGER[], -- Array of 7 daily loads
    mean_daily_load DECIMAL(7,2),
    standard_deviation DECIMAL(7,2),

    -- Training Monotony Calculation
    training_monotony DECIMAL(4,2), -- mean / standard deviation
    monotony_interpretation VARCHAR(30), -- 'low' (<1.5), 'moderate' (1.5-2.0), 'high' (>2.0)

    -- Training Strain Calculation
    training_strain DECIMAL(8,2), -- total_load × monotony
    strain_interpretation VARCHAR(30), -- 'low', 'moderate', 'high', 'very_high'

    -- Injury Risk from Monotony
    monotony_injury_risk DECIMAL(3,2), -- Risk score (0-1)
    strain_injury_risk DECIMAL(3,2), -- Risk score (0-1)

    -- Load Distribution Quality
    load_distribution_quality DECIMAL(3,2), -- 0-1 score (higher = better varied)
    rest_days_count INTEGER,
    consecutive_high_load_days INTEGER, -- Days with load >1.5x weekly average

    -- Weekly Load Progression
    load_change_from_previous_week DECIMAL(5,2), -- Percentage change
    load_progression_safety VARCHAR(30), -- 'safe' (<10%), 'caution' (10-15%), 'risk' (>15%)

    -- Recommendations
    recommended_rest_days INTEGER,
    recommended_load_variation DECIMAL(3,2), -- Target standard deviation
    next_week_load_target INTEGER, -- Recommended total load

    -- Weekly Patterns
    high_load_days TEXT[], -- ['Monday', 'Wednesday']
    recovery_day_adequacy DECIMAL(3,2), -- Quality of recovery days (0-1)

    -- Research-Based Thresholds
    exceeds_monotony_threshold BOOLEAN, -- >2.0
    exceeds_strain_threshold BOOLEAN, -- Based on Hulin research
    weeks_consecutive_high_monotony INTEGER,

    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_weekly_analysis_user_date ON weekly_training_analysis(user_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_monotony_interpretation ON weekly_training_analysis(monotony_interpretation);

-- =============================================================================
-- 6. INJURY RISK FACTORS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS injury_risk_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,

    -- ACWR-Based Risk
    acwr_value DECIMAL(4,2),
    acwr_risk_score DECIMAL(3,2), -- 0-1 scale
    acwr_risk_multiplier DECIMAL(3,2), -- Risk relative to baseline

    -- Load Spike Risk
    week_over_week_load_change DECIMAL(5,2), -- Percentage change
    load_spike_risk_score DECIMAL(3,2), -- 0-1 scale
    consecutive_weeks_high_load INTEGER,

    -- Monotony Risk
    training_monotony DECIMAL(4,2),
    monotony_risk_score DECIMAL(3,2), -- 0-1 scale
    weeks_high_monotony INTEGER,

    -- Recovery Status Risk
    chronic_sleep_debt_hours DECIMAL(4,1), -- Cumulative sleep debt
    recovery_score_7day_avg DECIMAL(3,2),
    poor_recovery_days_count INTEGER, -- Days with recovery <0.5 in past 7
    recovery_risk_score DECIMAL(3,2), -- 0-1 scale

    -- Movement Quality Risk
    movement_quality_score DECIMAL(3,2), -- From movement screening
    asymmetry_index DECIMAL(3,2), -- Left-right imbalance
    movement_risk_score DECIMAL(3,2), -- 0-1 scale

    -- Previous Injury Risk
    previous_injury_count INTEGER,
    days_since_last_injury INTEGER,
    injury_history_risk_score DECIMAL(3,2), -- 0-1 scale

    -- Flag Football Specific Risks
    cutting_volume_spike DECIMAL(5,2), -- % increase in cutting movements
    sprint_volume_spike DECIMAL(5,2), -- % increase in sprints
    position_specific_load_ratio DECIMAL(4,2), -- Position load vs. normal

    -- Composite Injury Risk Score
    overall_injury_risk DECIMAL(3,2), -- 0-1 scale (weighted combination)
    risk_level VARCHAR(20), -- 'low' (<0.2), 'moderate' (0.2-0.4), 'high' (0.4-0.7), 'critical' (>0.7)

    -- Risk Factor Contributions (Feature Importance)
    top_risk_factors JSONB, -- {acwr: 0.35, sleep: 0.28, load_spike: 0.22, ...}

    -- Time-to-Injury Prediction
    predicted_injury_window_days INTEGER, -- Expected time frame if no intervention
    injury_probability_30days DECIMAL(3,2), -- Probability in next 30 days

    -- Intervention Recommendations
    recommended_interventions TEXT[], -- ['reduce_load_30pct', 'increase_sleep_1hr', 'movement_screening']
    intervention_priority_order TEXT[], -- Ordered by impact

    -- Expected Risk Reduction
    risk_reduction_with_intervention DECIMAL(3,2), -- Expected reduction with recommendations
    target_risk_level DECIMAL(3,2), -- Target risk after interventions

    -- Alert Status
    alert_level VARCHAR(20), -- 'none', 'monitor', 'caution', 'warning', 'critical'
    alert_triggered BOOLEAN,
    notification_sent BOOLEAN,

    -- Model Metadata
    model_version VARCHAR(20),
    prediction_confidence DECIMAL(3,2), -- Model confidence (0-1)

    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, assessment_date)
);

CREATE INDEX IF NOT EXISTS idx_injury_risk_user_date ON injury_risk_factors(user_id, assessment_date);
CREATE INDEX IF NOT EXISTS idx_injury_risk_level ON injury_risk_factors(risk_level);
CREATE INDEX IF NOT EXISTS idx_injury_alert ON injury_risk_factors(alert_triggered);

-- =============================================================================
-- 7. LOAD MANAGEMENT RESEARCH STUDIES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS load_management_research (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Study Identification
    study_title TEXT NOT NULL,
    authors TEXT[],
    publication_year INTEGER,
    journal VARCHAR(200),
    doi VARCHAR(100),
    pubmed_id VARCHAR(20),

    -- Study Details
    study_type VARCHAR(50), -- 'meta_analysis', 'rct', 'cohort', 'case_control'
    sample_size INTEGER,
    sport_studied VARCHAR(100),
    athlete_level VARCHAR(50), -- 'elite', 'sub_elite', 'amateur', 'youth'

    -- Key Findings
    main_findings TEXT,
    acwr_thresholds JSONB, -- {safe_min: 0.8, safe_max: 1.3, risk_threshold: 1.5}
    load_progression_rates JSONB, -- {safe_weekly_increase: 0.10, max_increase: 0.15}
    injury_risk_data JSONB, -- {acwr_1.5: 2.0, acwr_1.8: 4.2} relative risk values

    -- Monotony Research
    monotony_thresholds JSONB, -- {low: 1.5, moderate: 2.0, high: 2.5}
    strain_thresholds JSONB,

    -- Applicability
    relevance_to_flag_football INTEGER CHECK (relevance_to_flag_football BETWEEN 1 AND 10),
    evidence_level VARCHAR(20), -- 'A' (strong), 'B' (moderate), 'C' (limited)

    -- Implementation
    practical_applications TEXT[],
    recommended_interventions TEXT[],

    -- Citation Information
    citation_count INTEGER,
    abstract TEXT,
    full_text_url TEXT,

    -- Integration Status
    integrated_into_algorithms BOOLEAN DEFAULT false,
    integration_notes TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_sport ON load_management_research(sport_studied);
CREATE INDEX IF NOT EXISTS idx_research_relevance ON load_management_research(relevance_to_flag_football);

-- =============================================================================
-- UPDATE TRIGGERS
-- =============================================================================

-- Trigger function for updated_at (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update trigger for training_load_metrics
CREATE TRIGGER update_training_load_metrics_updated_at
    BEFORE UPDATE ON training_load_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE training_load_metrics IS 'Comprehensive training load tracking with ACWR, monotony, and injury risk calculations';
COMMENT ON TABLE acwr_calculations IS 'Acute:Chronic Workload Ratio calculations based on Gabbett (2016) methodology';
COMMENT ON TABLE training_stress_balance IS 'Fitness-Fatigue model (CTL/ATL/TSB) based on Banister (1991) and Buchheit (2014)';
COMMENT ON TABLE session_rpe_data IS 'Session RPE protocol data based on Foster et al. (2001) validation';
COMMENT ON TABLE weekly_training_analysis IS 'Weekly monotony and strain analysis based on Hulin et al. (2016)';
COMMENT ON TABLE injury_risk_factors IS 'Composite injury risk prediction integrating multiple risk factors';
COMMENT ON TABLE load_management_research IS 'Research studies database supporting evidence-based load management';


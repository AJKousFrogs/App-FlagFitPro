-- =============================================================================
-- ALGORITHM INTEGRATION SYSTEM TABLES
-- Database schema for new evidence-based algorithm services
-- =============================================================================

-- =============================================================================
-- EVIDENCE-BASED RESEARCH INTEGRATION
-- Already exists from previous migrations but ensuring completeness
-- =============================================================================

-- Table for storing algorithm execution results
CREATE TABLE IF NOT EXISTS algorithm_execution_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Algorithm execution details
    algorithm_type VARCHAR(100) NOT NULL, -- 'comprehensive', 'training', 'supplements', etc.
    execution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    execution_duration_ms INTEGER NOT NULL,
    
    -- Input parameters
    input_parameters JSONB NOT NULL,
    goals TEXT[], -- Array of user goals
    time_horizon INTEGER, -- Days
    
    -- Results
    results JSONB NOT NULL, -- Full algorithm output
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    success_probability INTEGER CHECK (success_probability BETWEEN 0 AND 100),
    
    -- Status
    status VARCHAR(50) DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    error_message TEXT,
    
    -- Metadata
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SUPPLEMENT RECOMMENDATIONS TRACKING
-- Store personalized supplement protocols and tracking
-- =============================================================================

CREATE TABLE supplement_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Supplement details
    supplement_name VARCHAR(100) NOT NULL,
    supplement_key VARCHAR(50) NOT NULL, -- 'CREATINE', 'CAFFEINE', etc.
    
    -- Personalized protocol
    dosage VARCHAR(100) NOT NULL,
    timing VARCHAR(200) NOT NULL,
    duration VARCHAR(100),
    frequency VARCHAR(100),
    
    -- Evidence basis
    evidence_level VARCHAR(20) NOT NULL, -- 'Very High', 'High', 'Moderate', 'Low'
    effect_size DECIMAL(4,2),
    research_citations TEXT[],
    
    -- Personalization factors
    body_weight_kg DECIMAL(5,2),
    genetic_factors JSONB,
    medical_considerations TEXT[],
    
    -- Monitoring
    compliance_score DECIMAL(3,2) CHECK (compliance_score BETWEEN 0 AND 1),
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 10),
    side_effects TEXT[],
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'completed', 'discontinued'
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- RECOVERY OPTIMIZATION TRACKING
-- Store recovery protocols and monitoring data
-- =============================================================================

CREATE TABLE recovery_optimization_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Plan details
    plan_type VARCHAR(50) NOT NULL, -- 'comprehensive', 'travel', 'competition'
    training_load_data JSONB NOT NULL,
    
    -- Recovery interventions
    sleep_protocol JSONB NOT NULL,
    heat_therapy_protocol JSONB,
    compression_protocol JSONB,
    nutrition_protocol JSONB,
    active_recovery_protocol JSONB,
    
    -- Expected outcomes
    expected_recovery_improvement DECIMAL(4,2), -- Percentage improvement
    expected_performance_benefit DECIMAL(4,2),
    confidence_level DECIMAL(3,2) CHECK (confidence_level BETWEEN 0 AND 1),
    
    -- Monitoring metrics
    baseline_recovery_score DECIMAL(3,2),
    current_recovery_score DECIMAL(3,2),
    improvement_trend VARCHAR(20), -- 'improving', 'stable', 'declining'
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PERFORMANCE PREDICTIONS TRACKING
-- Store performance prediction results and tracking
-- =============================================================================

CREATE TABLE performance_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Prediction parameters
    target_date DATE NOT NULL,
    time_horizon_days INTEGER NOT NULL,
    prediction_date DATE DEFAULT CURRENT_DATE,
    
    -- Current baseline
    current_speed DECIMAL(5,2), -- seconds for speed metrics
    current_strength DECIMAL(6,2), -- kg or lbs
    current_endurance DECIMAL(5,2), -- ml/kg/min or similar
    current_agility DECIMAL(5,2), -- seconds
    current_power DECIMAL(6,2), -- watts
    
    -- Predicted values
    predicted_speed DECIMAL(5,2),
    predicted_strength DECIMAL(6,2),
    predicted_endurance DECIMAL(5,2),
    predicted_agility DECIMAL(5,2),
    predicted_power DECIMAL(6,2),
    
    -- Improvement calculations
    speed_improvement_percent DECIMAL(5,2),
    strength_improvement_percent DECIMAL(5,2),
    endurance_improvement_percent DECIMAL(5,2),
    agility_improvement_percent DECIMAL(5,2),
    power_improvement_percent DECIMAL(5,2),
    
    -- Contributing factors
    training_effect DECIMAL(4,2),
    recovery_effect DECIMAL(4,2),
    nutrition_effect DECIMAL(4,2),
    genetic_effect DECIMAL(4,2),
    
    -- Confidence and validation
    overall_confidence DECIMAL(3,2) CHECK (overall_confidence BETWEEN 0 AND 1),
    prediction_accuracy DECIMAL(3,2), -- Filled in later when validated
    
    -- Timeline milestones
    milestones JSONB, -- Array of timeline predictions
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',
    is_validated BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- LA28 QUALIFICATION TRACKING
-- Enhanced tracking for Olympic qualification progress
-- =============================================================================

CREATE TABLE la28_qualification_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Qualification details
    target_level VARCHAR(50) NOT NULL, -- 'NATIONAL_TEAM', 'REGIONAL_TEAM'
    position VARCHAR(50) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    
    -- Current performance gaps
    performance_gaps JSONB NOT NULL, -- Detailed gap analysis
    critical_gaps TEXT[], -- Most critical areas
    strength_areas TEXT[], -- Areas already meeting standards
    
    -- Roadmap and phases
    training_phases JSONB NOT NULL, -- Phase-specific plans
    milestones JSONB NOT NULL, -- Milestone tracking
    periodization_plan JSONB NOT NULL,
    
    -- Qualification probability
    overall_probability INTEGER CHECK (overall_probability BETWEEN 0 AND 100),
    probability_factors JSONB, -- Breakdown of factors
    confidence_level DECIMAL(3,2),
    
    -- Progress tracking
    current_phase VARCHAR(50), -- 'foundation_building', 'development', etc.
    phase_completion_percent DECIMAL(5,2),
    weeks_to_qualification INTEGER,
    
    -- Risk factors and mitigation
    risk_factors TEXT[],
    mitigation_strategies TEXT[],
    critical_success_factors TEXT[],
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',
    last_assessment_date DATE,
    next_assessment_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- ALGORITHM SYNERGY TRACKING
-- Track synergy bonuses and cross-algorithm optimization
-- =============================================================================

CREATE TABLE algorithm_synergy_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Synergy details
    synergy_type VARCHAR(100) NOT NULL, -- 'training_recovery', 'training_supplements', etc.
    algorithms_involved TEXT[] NOT NULL, -- Array of algorithm names
    
    -- Synergy effects
    base_benefit DECIMAL(4,2) NOT NULL,
    synergy_bonus DECIMAL(4,2) NOT NULL,
    total_benefit DECIMAL(4,2) NOT NULL,
    
    -- Evidence and validation
    evidence_strength VARCHAR(20), -- 'strong', 'moderate', 'limited'
    research_backing TEXT,
    user_validation_score INTEGER CHECK (user_validation_score BETWEEN 1 AND 10),
    
    -- Implementation tracking
    implementation_date DATE,
    duration_days INTEGER,
    compliance_score DECIMAL(3,2),
    
    -- Results
    measured_benefit DECIMAL(4,2), -- Actual measured benefit
    effectiveness_ratio DECIMAL(4,2), -- Actual vs predicted
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- ALGORITHM CACHE TABLE
-- Cache expensive algorithm calculations
-- =============================================================================

CREATE TABLE algorithm_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Cache key details
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    algorithm_type VARCHAR(100) NOT NULL,
    input_hash VARCHAR(64) NOT NULL, -- SHA-256 of input parameters
    
    -- Cached data
    cached_result JSONB NOT NULL,
    computation_time_ms INTEGER NOT NULL,
    result_size_bytes INTEGER,
    
    -- Cache metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Status
    is_valid BOOLEAN DEFAULT true
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Algorithm execution results indexes
CREATE INDEX idx_algorithm_results_user_type ON algorithm_execution_results(user_id, algorithm_type);
CREATE INDEX idx_algorithm_results_date ON algorithm_execution_results(execution_date);
CREATE INDEX idx_algorithm_results_status ON algorithm_execution_results(status);

-- Supplement recommendations indexes
CREATE INDEX idx_supplement_recs_user_status ON supplement_recommendations(user_id, status);
CREATE INDEX idx_supplement_recs_supplement ON supplement_recommendations(supplement_key);
CREATE INDEX idx_supplement_recs_dates ON supplement_recommendations(start_date, end_date);

-- Recovery optimization plans indexes
CREATE INDEX idx_recovery_plans_user_type ON recovery_optimization_plans(user_id, plan_type);
CREATE INDEX idx_recovery_plans_status ON recovery_optimization_plans(status);
CREATE INDEX idx_recovery_plans_dates ON recovery_optimization_plans(start_date, end_date);

-- Performance predictions indexes
CREATE INDEX idx_performance_pred_user_date ON performance_predictions(user_id, target_date);
CREATE INDEX idx_performance_pred_confidence ON performance_predictions(overall_confidence);
CREATE INDEX idx_performance_pred_status ON performance_predictions(status);

-- LA28 qualification tracking indexes
CREATE INDEX idx_la28_tracking_user ON la28_qualification_tracking(user_id);
CREATE INDEX idx_la28_tracking_level ON la28_qualification_tracking(target_level);
CREATE INDEX idx_la28_tracking_phase ON la28_qualification_tracking(current_phase);
CREATE INDEX idx_la28_tracking_probability ON la28_qualification_tracking(overall_probability);

-- Algorithm synergy tracking indexes
CREATE INDEX idx_synergy_tracking_user_type ON algorithm_synergy_tracking(user_id, synergy_type);
CREATE INDEX idx_synergy_tracking_algorithms ON algorithm_synergy_tracking USING GIN(algorithms_involved);
CREATE INDEX idx_synergy_tracking_status ON algorithm_synergy_tracking(status);

-- Algorithm cache indexes
CREATE INDEX idx_algorithm_cache_key ON algorithm_cache(cache_key);
CREATE INDEX idx_algorithm_cache_type ON algorithm_cache(algorithm_type);
CREATE INDEX idx_algorithm_cache_expires ON algorithm_cache(expires_at);
CREATE INDEX idx_algorithm_cache_valid ON algorithm_cache(is_valid);

-- =============================================================================
-- UPDATE TRIGGERS
-- =============================================================================

CREATE TRIGGER update_algorithm_results_updated_at
    BEFORE UPDATE ON algorithm_execution_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplement_recs_updated_at
    BEFORE UPDATE ON supplement_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recovery_plans_updated_at
    BEFORE UPDATE ON recovery_optimization_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_pred_updated_at
    BEFORE UPDATE ON performance_predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_la28_tracking_updated_at
    BEFORE UPDATE ON la28_qualification_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_synergy_tracking_updated_at
    BEFORE UPDATE ON algorithm_synergy_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- CACHE CLEANUP FUNCTION
-- Automatically clean expired cache entries
-- =============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM algorithm_cache 
    WHERE expires_at < CURRENT_TIMESTAMP OR is_valid = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule cache cleanup (requires pg_cron extension in production)
-- SELECT cron.schedule('cleanup-algorithm-cache', '0 2 * * *', 'SELECT cleanup_expired_cache();');
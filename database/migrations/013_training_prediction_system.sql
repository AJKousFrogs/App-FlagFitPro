-- =============================================================================
-- TRAINING PREDICTION SYSTEM FOR LA28 OLYMPICS
-- Comprehensive backend for training progress prediction and mathematical corrections
-- 12 essential training categories with 3-year prediction logic
-- =============================================================================

-- =============================================================================
-- ENHANCED TRAINING CATEGORIES TABLE
-- Updated with all 12 essential training types for LA28 preparation
-- =============================================================================

CREATE TABLE enhanced_training_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Category details
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    color VARCHAR(7) NOT NULL,
    description TEXT NOT NULL,
    
    -- Training specifications
    category_type VARCHAR(50) NOT NULL, -- 'skill', 'strength', 'recovery', 'technique'
    difficulty_level VARCHAR(20) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'
    priority_level INTEGER CHECK (priority_level BETWEEN 1 AND 5), -- 1=highest, 5=lowest
    
    -- LA28 Olympic requirements
    la28_weekly_target INTEGER NOT NULL, -- Target sessions per week for LA28
    la28_total_sessions INTEGER NOT NULL, -- Total sessions needed by LA28
    la28_minimum_proficiency DECIMAL(5,2) NOT NULL, -- Minimum proficiency % for LA28
    
    -- Training parameters
    session_duration_minutes INTEGER NOT NULL,
    rest_hours_required INTEGER NOT NULL, -- Hours of rest required after this training
    energy_expenditure INTEGER NOT NULL, -- Energy cost (1-10 scale)
    skill_transfer_rate DECIMAL(3,2) NOT NULL, -- How much this training helps other skills (0-1)
    
    -- Mathematical correction factors
    fatigue_factor DECIMAL(3,2) DEFAULT 0.1, -- How much fatigue affects performance
    recovery_factor DECIMAL(3,2) DEFAULT 0.8, -- How quickly skills recover
    plateau_factor DECIMAL(3,2) DEFAULT 0.05, -- Rate of diminishing returns
    synergy_factor DECIMAL(3,2) DEFAULT 0.15, -- Bonus from combining with other trainings
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- TRAINING PROGRESS PREDICTION TABLE
-- Mathematical predictions for 3-year progression towards LA28
-- =============================================================================

CREATE TABLE training_progress_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Prediction period
    prediction_date DATE NOT NULL,
    target_date DATE NOT NULL, -- LA28 Olympics date
    weeks_remaining INTEGER NOT NULL,
    
    -- Current status
    current_week INTEGER NOT NULL,
    current_total_sessions INTEGER NOT NULL,
    current_proficiency DECIMAL(5,2) NOT NULL,
    
    -- Mathematical predictions
    predicted_sessions_by_target INTEGER NOT NULL,
    predicted_proficiency_by_target DECIMAL(5,2) NOT NULL,
    confidence_level DECIMAL(3,2) CHECK (confidence_level BETWEEN 0 AND 1),
    
    -- Correction factors applied
    fatigue_correction DECIMAL(5,2) NOT NULL,
    recovery_correction DECIMAL(5,2) NOT NULL,
    plateau_correction DECIMAL(5,2) NOT NULL,
    synergy_correction DECIMAL(5,2) NOT NULL,
    
    -- Recommendations
    recommended_weekly_sessions INTEGER NOT NULL,
    recommended_rest_days INTEGER NOT NULL,
    recommended_intensity_adjustment DECIMAL(3,2) NOT NULL,
    
    -- Status
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- CATEGORY-SPECIFIC PROGRESS TRACKING
-- Detailed tracking for each of the 12 training categories
-- =============================================================================

CREATE TABLE category_progress_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES enhanced_training_categories(id),
    
    -- Progress metrics
    assessment_date DATE NOT NULL,
    sessions_completed INTEGER NOT NULL DEFAULT 0,
    total_sessions_attempted INTEGER NOT NULL DEFAULT 0,
    current_proficiency DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- Performance metrics
    average_session_quality DECIMAL(3,2) CHECK (average_session_quality BETWEEN 0 AND 1),
    consistency_score DECIMAL(3,2) CHECK (consistency_score BETWEEN 0 AND 1),
    improvement_rate DECIMAL(5,2), -- % improvement per week
    
    -- LA28 readiness metrics
    la28_readiness_score DECIMAL(5,2) CHECK (la28_readiness_score BETWEEN 0 AND 100),
    weeks_to_target INTEGER,
    projected_final_score DECIMAL(5,2),
    
    -- Mathematical corrections
    fatigue_impact DECIMAL(3,2) DEFAULT 0,
    recovery_impact DECIMAL(3,2) DEFAULT 0,
    plateau_impact DECIMAL(3,2) DEFAULT 0,
    synergy_impact DECIMAL(3,2) DEFAULT 0,
    
    -- Notes and feedback
    notes TEXT,
    coach_feedback TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- WEEKLY TRAINING SCHEDULE PREDICTIONS
-- AI-powered weekly schedule recommendations
-- =============================================================================

CREATE TABLE weekly_schedule_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Schedule period
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    week_number INTEGER NOT NULL, -- Week number towards LA28
    
    -- Schedule recommendations
    recommended_schedule JSONB NOT NULL, -- Array of daily training recommendations
    total_weekly_hours INTEGER NOT NULL,
    rest_hours_allocated INTEGER NOT NULL,
    
    -- Mathematical optimization
    fatigue_balance_score DECIMAL(3,2) CHECK (fatigue_balance_score BETWEEN 0 AND 1),
    skill_development_score DECIMAL(3,2) CHECK (skill_development_score BETWEEN 0 AND 1),
    recovery_optimization_score DECIMAL(3,2) CHECK (recovery_optimization_score BETWEEN 0 AND 1),
    
    -- Constraints and requirements
    la28_requirements_met BOOLEAN DEFAULT false,
    rest_requirements_met BOOLEAN DEFAULT false,
    energy_balance_achieved BOOLEAN DEFAULT false,
    
    -- Status
    is_implemented BOOLEAN DEFAULT false,
    user_feedback_rating INTEGER CHECK (user_feedback_rating BETWEEN 1 AND 5),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- MATHEMATICAL CORRECTION FACTORS TABLE
-- Dynamic correction factors based on user performance and research
-- =============================================================================

CREATE TABLE mathematical_correction_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Factor details
    factor_name VARCHAR(100) NOT NULL,
    factor_type VARCHAR(50) NOT NULL, -- 'fatigue', 'recovery', 'plateau', 'synergy'
    description TEXT NOT NULL,
    
    -- Mathematical parameters
    base_value DECIMAL(5,4) NOT NULL,
    min_value DECIMAL(5,4) NOT NULL,
    max_value DECIMAL(5,4) NOT NULL,
    
    -- Dynamic adjustment parameters
    adjustment_rate DECIMAL(5,4) NOT NULL,
    decay_factor DECIMAL(5,4) NOT NULL,
    recovery_rate DECIMAL(5,4) NOT NULL,
    
    -- Research backing
    research_source TEXT,
    evidence_level VARCHAR(20), -- 'strong', 'moderate', 'limited'
    last_updated DATE NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- LA28 OLYMPIC REQUIREMENTS TABLE
-- Specific requirements and standards for LA28 Olympics
-- =============================================================================

CREATE TABLE la28_olympic_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Requirement details
    requirement_name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    
    -- Performance standards
    minimum_proficiency DECIMAL(5,2) NOT NULL,
    target_proficiency DECIMAL(5,2) NOT NULL,
    elite_proficiency DECIMAL(5,2) NOT NULL,
    
    -- Training requirements
    minimum_weekly_sessions INTEGER NOT NULL,
    recommended_weekly_sessions INTEGER NOT NULL,
    total_sessions_by_la28 INTEGER NOT NULL,
    
    -- Time constraints
    deadline_date DATE NOT NULL, -- LA28 Olympics date
    weeks_remaining INTEGER NOT NULL,
    critical_path_weeks INTEGER NOT NULL, -- Weeks where this is critical
    
    -- Weighting and importance
    importance_weight DECIMAL(3,2) CHECK (importance_weight BETWEEN 0 AND 1),
    difficulty_level VARCHAR(20) NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Enhanced training categories indexes
CREATE INDEX idx_enhanced_categories_type ON enhanced_training_categories(category_type);
CREATE INDEX idx_enhanced_categories_priority ON enhanced_training_categories(priority_level);
CREATE INDEX idx_enhanced_categories_la28_target ON enhanced_training_categories(la28_weekly_target);

-- Progress predictions indexes
CREATE INDEX idx_progress_predictions_user_date ON training_progress_predictions(user_id, prediction_date);
CREATE INDEX idx_progress_predictions_target ON training_progress_predictions(target_date);
CREATE INDEX idx_progress_predictions_current ON training_progress_predictions(is_current);

-- Category progress tracking indexes
CREATE INDEX idx_category_progress_user_category ON category_progress_tracking(user_id, category_id);
CREATE INDEX idx_category_progress_date ON category_progress_tracking(assessment_date);
CREATE INDEX idx_category_progress_readiness ON category_progress_tracking(la28_readiness_score);

-- Weekly schedule predictions indexes
CREATE INDEX idx_weekly_predictions_user_week ON weekly_schedule_predictions(user_id, week_start_date);
CREATE INDEX idx_weekly_predictions_implemented ON weekly_schedule_predictions(is_implemented);

-- Mathematical correction factors indexes
CREATE INDEX idx_correction_factors_type ON mathematical_correction_factors(factor_type);
CREATE INDEX idx_correction_factors_active ON mathematical_correction_factors(is_active);

-- LA28 requirements indexes
CREATE INDEX idx_la28_requirements_category ON la28_olympic_requirements(category);
CREATE INDEX idx_la28_requirements_importance ON la28_olympic_requirements(importance_weight);

-- =============================================================================
-- UPDATE TRIGGERS
-- =============================================================================

CREATE TRIGGER update_enhanced_categories_updated_at
    BEFORE UPDATE ON enhanced_training_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_predictions_updated_at
    BEFORE UPDATE ON training_progress_predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_progress_updated_at
    BEFORE UPDATE ON category_progress_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_predictions_updated_at
    BEFORE UPDATE ON weekly_schedule_predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_correction_factors_updated_at
    BEFORE UPDATE ON mathematical_correction_factors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_la28_requirements_updated_at
    BEFORE UPDATE ON la28_olympic_requirements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 
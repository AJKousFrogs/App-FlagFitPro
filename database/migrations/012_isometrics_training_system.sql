-- =============================================================================
-- ISOMETRICS TRAINING SYSTEM
-- Comprehensive backend for isometrics training with research-backed protocols
-- Integration with traditional lifting for optimal performance
-- =============================================================================

-- =============================================================================
-- ISOMETRICS EXERCISES TABLE
-- Core exercises with research-backed protocols
-- =============================================================================

CREATE TABLE isometrics_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Exercise details
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'upper_body', 'lower_body', 'core', 'full_body'
    muscle_groups TEXT[] NOT NULL,
    
    -- Research-backed protocols
    protocol_type VARCHAR(50) NOT NULL, -- 'maximal', 'submaximal', 'yielding', 'overcoming'
    recommended_duration_seconds INTEGER NOT NULL,
    recommended_sets INTEGER NOT NULL,
    recommended_reps INTEGER NOT NULL,
    rest_period_seconds INTEGER NOT NULL,
    
    -- Intensity and difficulty
    intensity_percentage INTEGER CHECK (intensity_percentage BETWEEN 0 AND 100),
    difficulty_level VARCHAR(20) DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
    
    -- Equipment and setup
    equipment_required TEXT[],
    setup_instructions TEXT,
    safety_notes TEXT,
    
    -- Research references
    research_studies TEXT[],
    evidence_level VARCHAR(20), -- 'strong', 'moderate', 'limited'
    
    -- Integration with lifting
    lifting_synergy_exercises TEXT[],
    pre_lifting_recommendation BOOLEAN DEFAULT false,
    post_lifting_recommendation BOOLEAN DEFAULT false,
    
    -- Visual and media
    video_url TEXT,
    image_url TEXT,
    demonstration_notes TEXT,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- ISOMETRICS TRAINING PROGRAMS TABLE
-- Structured programs combining isometrics with lifting
-- =============================================================================

CREATE TABLE isometrics_training_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Program details
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    program_type VARCHAR(100) NOT NULL, -- 'strength', 'power', 'endurance', 'rehabilitation'
    
    -- Target audience
    target_position VARCHAR(50), -- 'quarterback', 'receiver', 'lineman', etc.
    skill_level VARCHAR(20) DEFAULT 'beginner',
    age_group VARCHAR(20), -- 'youth', 'adult', 'senior'
    
    -- Program structure
    duration_weeks INTEGER NOT NULL,
    sessions_per_week INTEGER NOT NULL,
    total_sessions INTEGER NOT NULL,
    
    -- Integration strategy
    lifting_integration_type VARCHAR(50), -- 'pre-activation', 'post-activation', 'concurrent', 'alternating'
    isometrics_to_lifting_ratio DECIMAL(3,2), -- e.g., 0.3 means 30% isometrics, 70% lifting
    
    -- Research foundation
    research_basis TEXT,
    expected_outcomes TEXT[],
    contraindications TEXT[],
    
    -- Program phases
    phases JSONB, -- Array of program phases with exercises, sets, reps, etc.
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- ISOMETRICS SESSIONS TABLE
-- Individual training sessions with detailed tracking
-- =============================================================================

CREATE TABLE isometrics_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id UUID REFERENCES isometrics_training_programs(id),
    
    -- Session details
    session_date DATE NOT NULL,
    session_type VARCHAR(100) NOT NULL, -- 'isometrics_only', 'isometrics_lifting', 'pre_activation'
    session_phase VARCHAR(50), -- 'warmup', 'main', 'cooldown'
    
    -- Performance metrics
    total_duration_minutes INTEGER NOT NULL,
    exercises_completed INTEGER DEFAULT 0,
    total_work_time_seconds INTEGER DEFAULT 0,
    total_rest_time_seconds INTEGER DEFAULT 0,
    
    -- Intensity tracking
    average_intensity_percentage DECIMAL(5,2),
    max_intensity_percentage DECIMAL(5,2),
    perceived_exertion INTEGER CHECK (perceived_exertion BETWEEN 1 AND 10),
    
    -- Quality metrics
    form_quality_score DECIMAL(3,2) CHECK (form_quality_score BETWEEN 0 AND 1),
    adherence_score DECIMAL(3,2) CHECK (adherence_score BETWEEN 0 AND 1),
    completion_rate DECIMAL(5,2) CHECK (completion_rate BETWEEN 0 AND 100),
    
    -- Integration metrics
    lifting_session_id UUID, -- Reference to associated lifting session
    pre_lifting_performance_impact DECIMAL(5,2), -- How isometrics affected lifting performance
    post_lifting_recovery_impact DECIMAL(5,2), -- How isometrics aided recovery
    
    -- Notes and feedback
    notes TEXT,
    coach_feedback TEXT,
    self_assessment TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed', -- 'planned', 'in_progress', 'completed', 'cancelled'
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- ISOMETRICS EXERCISE PERFORMANCE TABLE
-- Detailed tracking of individual exercise performance
-- =============================================================================

CREATE TABLE isometrics_exercise_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES isometrics_sessions(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES isometrics_exercises(id),
    
    -- Performance details
    set_number INTEGER NOT NULL,
    rep_number INTEGER NOT NULL,
    
    -- Duration and intensity
    actual_duration_seconds INTEGER NOT NULL,
    target_duration_seconds INTEGER NOT NULL,
    intensity_percentage DECIMAL(5,2),
    force_output DECIMAL(8,2), -- in Newtons if available
    
    -- Quality metrics
    form_quality DECIMAL(3,2) CHECK (form_quality BETWEEN 0 AND 1),
    stability_score DECIMAL(3,2) CHECK (stability_score BETWEEN 0 AND 1),
    breathing_control DECIMAL(3,2) CHECK (breathing_control BETWEEN 0 AND 1),
    
    -- Fatigue indicators
    fatigue_level INTEGER CHECK (fatigue_level BETWEEN 1 AND 10),
    muscle_tremor_observed BOOLEAN DEFAULT false,
    form_breakdown_observed BOOLEAN DEFAULT false,
    
    -- Rest periods
    rest_before_seconds INTEGER,
    rest_after_seconds INTEGER,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- ISOMETRICS RESEARCH ARTICLES TABLE
-- Peer-reviewed research backing the training protocols
-- =============================================================================

CREATE TABLE isometrics_research_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Article details
    title TEXT NOT NULL,
    authors TEXT[] NOT NULL,
    journal VARCHAR(200) NOT NULL,
    publication_year INTEGER NOT NULL,
    doi VARCHAR(100),
    url TEXT,
    
    -- Research focus
    research_area VARCHAR(100) NOT NULL, -- 'strength', 'power', 'endurance', 'rehabilitation'
    study_type VARCHAR(50) NOT NULL, -- 'rct', 'systematic_review', 'meta_analysis', 'case_study'
    population_type VARCHAR(100), -- 'athletes', 'recreational', 'rehabilitation'
    
    -- Key findings
    key_findings TEXT[],
    isometrics_protocols TEXT[],
    lifting_integration_findings TEXT[],
    
    -- Evidence quality
    evidence_level VARCHAR(20), -- 'strong', 'moderate', 'limited'
    sample_size INTEGER,
    study_duration_weeks INTEGER,
    
    -- Practical applications
    practical_recommendations TEXT[],
    contraindications TEXT[],
    limitations TEXT[],
    
    -- Integration insights
    lifting_synergy_evidence TEXT,
    optimal_timing TEXT,
    dosage_recommendations TEXT,
    
    -- Status
    is_verified BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- ISOMETRICS PROGRESS TRACKING TABLE
-- Long-term progress and adaptation tracking
-- =============================================================================

CREATE TABLE isometrics_progress_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Assessment period
    assessment_date DATE NOT NULL,
    assessment_type VARCHAR(50) NOT NULL, -- 'baseline', 'monthly', 'quarterly', 'annual'
    
    -- Strength metrics
    max_isometric_force DECIMAL(8,2), -- in Newtons
    force_endurance_seconds INTEGER,
    rate_of_force_development DECIMAL(8,2),
    
    -- Performance metrics
    power_output DECIMAL(8,2),
    movement_efficiency DECIMAL(5,2),
    stability_improvement DECIMAL(5,2),
    
    -- Functional metrics
    functional_movement_score DECIMAL(5,2),
    sport_specific_performance DECIMAL(5,2),
    injury_prevention_score DECIMAL(5,2),
    
    -- Integration benefits
    lifting_performance_improvement DECIMAL(5,2),
    recovery_rate_improvement DECIMAL(5,2),
    overall_athletic_performance DECIMAL(5,2),
    
    -- Subjective metrics
    perceived_strength_improvement INTEGER CHECK (perceived_strength_improvement BETWEEN 1 AND 10),
    perceived_stability_improvement INTEGER CHECK (perceived_stability_improvement BETWEEN 1 AND 10),
    overall_satisfaction INTEGER CHECK (overall_satisfaction BETWEEN 1 AND 10),
    
    -- Notes
    notes TEXT,
    coach_assessment TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Isometrics exercises indexes
CREATE INDEX idx_isometrics_exercises_category ON isometrics_exercises(category);
CREATE INDEX idx_isometrics_exercises_difficulty ON isometrics_exercises(difficulty_level);
CREATE INDEX idx_isometrics_exercises_protocol ON isometrics_exercises(protocol_type);
CREATE INDEX idx_isometrics_exercises_muscle_groups ON isometrics_exercises USING GIN (muscle_groups);

-- Training programs indexes
CREATE INDEX idx_isometrics_programs_type ON isometrics_training_programs(program_type);
CREATE INDEX idx_isometrics_programs_position ON isometrics_training_programs(target_position);
CREATE INDEX idx_isometrics_programs_level ON isometrics_training_programs(skill_level);

-- Sessions indexes
CREATE INDEX idx_isometrics_sessions_user_date ON isometrics_sessions(user_id, session_date);
CREATE INDEX idx_isometrics_sessions_type ON isometrics_sessions(session_type);
CREATE INDEX idx_isometrics_sessions_program ON isometrics_sessions(program_id);

-- Exercise performance indexes
CREATE INDEX idx_isometrics_performance_session ON isometrics_exercise_performance(session_id);
CREATE INDEX idx_isometrics_performance_exercise ON isometrics_exercise_performance(exercise_id);

-- Research articles indexes
CREATE INDEX idx_isometrics_research_area ON isometrics_research_articles(research_area);
CREATE INDEX idx_isometrics_research_year ON isometrics_research_articles(publication_year);
CREATE INDEX idx_isometrics_research_evidence ON isometrics_research_articles(evidence_level);

-- Progress tracking indexes
CREATE INDEX idx_isometrics_progress_user_date ON isometrics_progress_tracking(user_id, assessment_date);
CREATE INDEX idx_isometrics_progress_type ON isometrics_progress_tracking(assessment_type);

-- =============================================================================
-- UPDATE TRIGGERS
-- =============================================================================

CREATE TRIGGER update_isometrics_exercises_updated_at
    BEFORE UPDATE ON isometrics_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_isometrics_programs_updated_at
    BEFORE UPDATE ON isometrics_training_programs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_isometrics_sessions_updated_at
    BEFORE UPDATE ON isometrics_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_isometrics_research_updated_at
    BEFORE UPDATE ON isometrics_research_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_isometrics_progress_updated_at
    BEFORE UPDATE ON isometrics_progress_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 
-- Migration: Plyometrics Research System
-- Description: Evidence-based plyometrics research and Yuri Verkhoshansky's work
-- Created: 2024-12-19

-- Plyometrics research articles and studies
CREATE TABLE plyometrics_research (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Article identification
    title TEXT NOT NULL,
    authors TEXT[] NOT NULL,
    journal VARCHAR(255),
    publication_year INTEGER,
    doi VARCHAR(255),
    pmid VARCHAR(50),
    url TEXT,
    
    -- Research categorization
    research_type VARCHAR(50) NOT NULL, -- original_study, review, meta_analysis, case_study, theoretical
    study_design VARCHAR(100), -- randomized_controlled_trial, cohort_study, cross_sectional, longitudinal
    evidence_level VARCHAR(50), -- strong, moderate, weak, expert_opinion
    
    -- Study details
    population_type VARCHAR(100), -- athletes, untrained, youth, elite, recreational
    sample_size INTEGER,
    age_range VARCHAR(50),
    gender_distribution VARCHAR(100),
    study_duration_weeks INTEGER,
    
    -- Verkhoshansky connection
    relates_to_verkhoshansky BOOLEAN DEFAULT false,
    verkhoshansky_method VARCHAR(100), -- shock_method, depth_jump, stretch_shortening_cycle
    verkhoshansky_principles TEXT[],
    
    -- Key findings
    key_findings TEXT[] NOT NULL,
    performance_improvements JSONB, -- structured data about improvements
    training_protocols TEXT[],
    safety_considerations TEXT[],
    
    -- Practical applications
    practical_recommendations TEXT[],
    contraindications TEXT[],
    progression_guidelines TEXT[],
    
    -- Technical details
    exercise_types TEXT[], -- depth_jumps, box_jumps, bounds, etc.
    intensity_levels VARCHAR(100)[],
    volume_recommendations TEXT[],
    rest_periods TEXT[],
    
    -- Sport-specific applications
    applicable_sports TEXT[],
    position_specific_applications JSONB,
    skill_level_applications VARCHAR(50)[], -- beginner, intermediate, advanced, elite
    
    -- Methodological quality
    methodology_score DECIMAL(3,2), -- 0-1 quality score
    statistical_power VARCHAR(50),
    limitations TEXT[],
    future_research_needs TEXT[],
    
    -- Impact and citations
    citation_count INTEGER DEFAULT 0,
    impact_factor DECIMAL(4,2),
    peer_reviewed BOOLEAN DEFAULT true,
    
    -- Database integration
    ai_coach_knowledge_id UUID REFERENCES ai_coach_knowledge(id) ON DELETE SET NULL,
    training_program_id UUID, -- reference to training programs that use this research
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Yuri Verkhoshansky's original work and methodology
CREATE TABLE verkhoshansky_methodology (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Original work identification
    work_title TEXT NOT NULL,
    original_language VARCHAR(50) DEFAULT 'Russian',
    translation_available BOOLEAN DEFAULT false,
    publication_year INTEGER,
    original_journal VARCHAR(255),
    
    -- Methodology details
    method_name VARCHAR(100) NOT NULL, -- shock_method, depth_jump_methodology, etc.
    method_description TEXT NOT NULL,
    theoretical_foundation TEXT,
    physiological_principles TEXT[],
    
    -- Original protocols
    original_protocols JSONB NOT NULL,
    exercise_parameters JSONB,
    progression_systems JSONB,
    
    -- Scientific basis
    research_evidence TEXT[],
    experimental_results JSONB,
    validation_studies TEXT[],
    
    -- Modern adaptations
    modern_adaptations TEXT[],
    modifications_for_safety TEXT[],
    contemporary_applications TEXT[],
    
    -- Historical significance
    historical_impact TEXT,
    influence_on_field TEXT,
    legacy_contributions TEXT[],
    
    -- Implementation guidelines
    implementation_notes TEXT[],
    common_misconceptions TEXT[],
    proper_execution_guidelines TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plyometrics exercises based on research
CREATE TABLE plyometrics_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Exercise basics
    exercise_name VARCHAR(255) NOT NULL,
    exercise_category VARCHAR(100) NOT NULL, -- lower_body, upper_body, total_body, sport_specific
    difficulty_level VARCHAR(50) NOT NULL, -- beginner, intermediate, advanced, elite
    
    -- Exercise details
    description TEXT NOT NULL,
    instructions TEXT[] NOT NULL,
    video_url TEXT,
    image_url TEXT,
    
    -- Research-based parameters
    research_based BOOLEAN DEFAULT true,
    supporting_research_id UUID REFERENCES plyometrics_research(id) ON DELETE SET NULL,
    verkhoshansky_method_id UUID REFERENCES verkhoshansky_methodology(id) ON DELETE SET NULL,
    
    -- Performance parameters
    intensity_level VARCHAR(50), -- low, moderate, high, maximal
    volume_recommendations TEXT[],
    rest_periods TEXT[],
    progression_guidelines TEXT[],
    
    -- Safety considerations
    safety_notes TEXT[],
    contraindications TEXT[],
    proper_form_guidelines TEXT[],
    common_mistakes TEXT[],
    
    -- Sport applications
    applicable_sports TEXT[],
    position_specific BOOLEAN DEFAULT false,
    position_applications JSONB,
    
    -- Equipment requirements
    equipment_needed TEXT[],
    space_requirements VARCHAR(100),
    surface_requirements VARCHAR(100),
    
    -- Effectiveness metrics
    effectiveness_rating DECIMAL(3,2), -- 0-1 based on research
    performance_improvements JSONB,
    injury_risk_rating VARCHAR(50), -- low, moderate, high
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plyometrics training programs based on research
CREATE TABLE plyometrics_training_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Program basics
    program_name VARCHAR(255) NOT NULL,
    program_type VARCHAR(100) NOT NULL, -- beginner, intermediate, advanced, sport_specific, rehabilitation
    target_population VARCHAR(100) NOT NULL,
    
    -- Research foundation
    research_based BOOLEAN DEFAULT true,
    supporting_research_ids UUID[],
    verkhoshansky_influence BOOLEAN DEFAULT false,
    
    -- Program structure
    duration_weeks INTEGER NOT NULL,
    sessions_per_week INTEGER NOT NULL,
    exercises_per_session INTEGER,
    
    -- Progression system
    progression_model VARCHAR(100), -- linear, undulating, block_periodization
    intensity_progression JSONB,
    volume_progression JSONB,
    
    -- Exercise selection
    exercise_sequence JSONB NOT NULL,
    exercise_substitutions JSONB,
    modification_guidelines TEXT[],
    
    -- Performance tracking
    performance_metrics TEXT[],
    assessment_protocols TEXT[],
    success_criteria JSONB,
    
    -- Safety and monitoring
    safety_guidelines TEXT[],
    monitoring_parameters TEXT[],
    warning_signs TEXT[],
    
    -- Expected outcomes
    expected_improvements JSONB,
    timeline_expectations TEXT[],
    individual_variability_notes TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Research-based plyometrics guidelines
CREATE TABLE plyometrics_guidelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Guideline identification
    guideline_type VARCHAR(100) NOT NULL, -- safety, progression, programming, assessment
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Research foundation
    evidence_level VARCHAR(50) NOT NULL, -- strong, moderate, weak, expert_opinion
    supporting_research_ids UUID[],
    expert_consensus BOOLEAN DEFAULT false,
    
    -- Guideline content
    recommendations TEXT[] NOT NULL,
    contraindications TEXT[],
    exceptions TEXT[],
    
    -- Application context
    applicable_populations TEXT[],
    applicable_sports TEXT[],
    skill_level_applications VARCHAR(50)[],
    
    -- Implementation
    implementation_notes TEXT[],
    monitoring_guidelines TEXT[],
    adjustment_criteria TEXT[],
    
    -- Quality indicators
    last_updated DATE,
    review_frequency VARCHAR(50),
    next_review_date DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_plyometrics_research_type ON plyometrics_research(research_type, evidence_level);
CREATE INDEX idx_plyometrics_research_verkhoshansky ON plyometrics_research(relates_to_verkhoshansky) WHERE relates_to_verkhoshansky = true;
CREATE INDEX idx_plyometrics_research_year ON plyometrics_research(publication_year);
CREATE INDEX idx_plyometrics_research_population ON plyometrics_research(population_type);

CREATE INDEX idx_verkhoshansky_methodology_method ON verkhoshansky_methodology(method_name);
CREATE INDEX idx_verkhoshansky_methodology_year ON verkhoshansky_methodology(publication_year);

CREATE INDEX idx_plyometrics_exercises_category ON plyometrics_exercises(exercise_category, difficulty_level);
CREATE INDEX idx_plyometrics_exercises_research ON plyometrics_exercises(research_based) WHERE research_based = true;
CREATE INDEX idx_plyometrics_exercises_sports ON plyometrics_exercises USING GIN(applicable_sports);

CREATE INDEX idx_plyometrics_programs_type ON plyometrics_training_programs(program_type, target_population);
CREATE INDEX idx_plyometrics_programs_research ON plyometrics_training_programs(research_based) WHERE research_based = true;

CREATE INDEX idx_plyometrics_guidelines_type ON plyometrics_guidelines(guideline_type, evidence_level);

-- Add update triggers
CREATE TRIGGER update_plyometrics_research_updated_at
    BEFORE UPDATE ON plyometrics_research
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verkhoshansky_methodology_updated_at
    BEFORE UPDATE ON verkhoshansky_methodology
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plyometrics_exercises_updated_at
    BEFORE UPDATE ON plyometrics_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plyometrics_training_programs_updated_at
    BEFORE UPDATE ON plyometrics_training_programs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plyometrics_guidelines_updated_at
    BEFORE UPDATE ON plyometrics_guidelines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 
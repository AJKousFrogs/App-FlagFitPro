-- Migration: Science-Based Supplement Decision Tree
-- This migration adds comprehensive supplement research and decision-making logic

-- 1. SUPPLEMENT RESEARCH EVIDENCE DATABASE
CREATE TABLE IF NOT EXISTS supplement_research (
    id SERIAL PRIMARY KEY,
    supplement_id INTEGER REFERENCES supplements(id) ON DELETE CASCADE,
    study_reference VARCHAR(255) NOT NULL,
    study_title TEXT NOT NULL,
    authors TEXT[] NOT NULL,
    journal VARCHAR(255),
    publication_year INTEGER,
    doi VARCHAR(255),
    pmid INTEGER,
    population_description TEXT NOT NULL,
    sample_size INTEGER,
    study_duration_weeks INTEGER,
    dose_studied_mg_per_kg DECIMAL(8,2),
    dose_studied_mg_per_day DECIMAL(8,2),
    dosing_frequency VARCHAR(100), -- 'daily', 'twice_daily', 'pre_workout', 'post_workout'
    loading_phase_days INTEGER,
    maintenance_phase_days INTEGER,
    outcome_measures TEXT[] NOT NULL,
    primary_outcome TEXT NOT NULL,
    effect_size DECIMAL(5,2),
    statistical_significance BOOLEAN DEFAULT false,
    p_value DECIMAL(10,6),
    confidence_interval_lower DECIMAL(5,2),
    confidence_interval_upper DECIMAL(5,2),
    clinical_significance TEXT,
    adverse_events TEXT[],
    dropout_rate DECIMAL(5,2),
    study_quality_score INTEGER CHECK (study_quality_score >= 1 AND study_quality_score <= 10),
    risk_of_bias TEXT[],
    limitations TEXT[],
    practical_applications TEXT[],
    flag_football_relevance VARCHAR(50), -- 'high', 'medium', 'low'
    position_specific_benefits TEXT[],
    evidence_level VARCHAR(50) CHECK (evidence_level IN ('very_high', 'high', 'medium', 'low')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. SUPPLEMENT PROTOCOLS AND RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS supplement_protocols (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supplement_id INTEGER NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
    goal VARCHAR(200) NOT NULL, -- 'strength_gain', 'endurance', 'recovery', 'cognitive_enhancement'
    recommended_dose_mg_per_kg DECIMAL(8,2),
    recommended_dose_mg_per_day DECIMAL(8,2),
    dosing_frequency VARCHAR(100) NOT NULL,
    loading_phase_days INTEGER,
    maintenance_phase_days INTEGER,
    timing_relative_to_exercise VARCHAR(100), -- 'pre_workout', 'post_workout', 'morning', 'evening'
    administration_method VARCHAR(100), -- 'oral', 'powder', 'capsule', 'liquid'
    cycle_duration_weeks INTEGER,
    break_duration_weeks INTEGER,
    safety_flags TEXT[],
    contraindications TEXT[],
    drug_interactions TEXT[],
    wada_compliance_status VARCHAR(50) DEFAULT 'compliant',
    evidence_strength VARCHAR(50),
    expected_benefits TEXT[],
    expected_timeline_weeks INTEGER,
    monitoring_parameters TEXT[],
    success_metrics TEXT[],
    risk_assessment_score INTEGER CHECK (risk_assessment_score >= 1 AND risk_assessment_score <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SUPPLEMENT SAFETY MONITORING
CREATE TABLE IF NOT EXISTS supplement_safety_monitoring (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supplement_id INTEGER NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
    protocol_id INTEGER REFERENCES supplement_protocols(id) ON DELETE CASCADE,
    monitoring_date DATE NOT NULL,
    dose_taken_mg DECIMAL(8,2),
    side_effects_experienced TEXT[],
    side_effect_severity INTEGER CHECK (side_effect_severity >= 1 AND side_effect_severity <= 10),
    performance_impact VARCHAR(50), -- 'positive', 'neutral', 'negative'
    subjective_benefits TEXT[],
    subjective_concerns TEXT[],
    blood_work_results JSONB, -- liver enzymes, kidney function, etc.
    heart_rate_variability DECIMAL(5,2),
    sleep_quality_rating INTEGER CHECK (sleep_quality_rating >= 1 AND sleep_quality_rating <= 10),
    energy_level_rating INTEGER CHECK (energy_level_rating >= 1 AND energy_level_rating <= 10),
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
    compliance_percentage DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SUPPLEMENT INTERACTION DATABASE
CREATE TABLE IF NOT EXISTS supplement_interactions (
    id SERIAL PRIMARY KEY,
    supplement1_id INTEGER NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
    supplement2_id INTEGER NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
    interaction_type VARCHAR(100) NOT NULL, -- 'synergistic', 'antagonistic', 'additive', 'unknown'
    interaction_severity VARCHAR(50) NOT NULL, -- 'mild', 'moderate', 'severe', 'contraindicated'
    mechanism_of_interaction TEXT,
    clinical_evidence TEXT,
    recommendations TEXT[],
    contraindications TEXT[],
    monitoring_requirements TEXT[],
    evidence_level VARCHAR(50),
    citation_references TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. SUPPLEMENT EVIDENCE GRADING SYSTEM
CREATE TABLE IF NOT EXISTS supplement_evidence_grades (
    id SERIAL PRIMARY KEY,
    supplement_id INTEGER NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
    evidence_grade VARCHAR(10) NOT NULL CHECK (evidence_grade IN ('A', 'B', 'C', 'D', 'F')),
    grade_calculation_date DATE NOT NULL,
    total_studies INTEGER NOT NULL,
    high_quality_studies INTEGER NOT NULL,
    positive_outcome_studies INTEGER NOT NULL,
    negative_outcome_studies INTEGER NOT NULL,
    neutral_outcome_studies INTEGER NOT NULL,
    overall_effect_size DECIMAL(5,2),
    consistency_score DECIMAL(3,2) CHECK (consistency_score >= 0 AND consistency_score <= 1),
    publication_bias_assessment VARCHAR(50),
    sample_size_adequacy VARCHAR(50),
    study_duration_adequacy VARCHAR(50),
    population_relevance_score DECIMAL(3,2) CHECK (population_relevance_score >= 0 AND population_relevance_score <= 1),
    flag_football_specific_score DECIMAL(3,2) CHECK (flag_football_specific_score >= 0 AND flag_football_specific_score <= 1),
    final_grade_justification TEXT,
    grade_reviewer VARCHAR(200),
    next_review_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. SUPPLEMENT DECISION TREE LOGIC
CREATE TABLE IF NOT EXISTS supplement_decision_trees (
    id SERIAL PRIMARY KEY,
    decision_tree_name VARCHAR(200) NOT NULL,
    decision_tree_description TEXT NOT NULL,
    target_outcome VARCHAR(200) NOT NULL,
    target_population VARCHAR(200) NOT NULL,
    tree_structure JSONB NOT NULL, -- hierarchical decision logic
    decision_nodes JSONB NOT NULL, -- decision points and criteria
    outcome_paths JSONB NOT NULL, -- paths to different recommendations
    evidence_thresholds JSONB, -- minimum evidence requirements
    safety_thresholds JSONB, -- safety considerations
    wada_compliance_checks JSONB, -- anti-doping compliance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SUPPLEMENT RECOMMENDATION ENGINE
CREATE TABLE IF NOT EXISTS supplement_recommendations (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommendation_date DATE NOT NULL,
    target_outcome VARCHAR(200) NOT NULL,
    current_performance_level VARCHAR(50),
    training_phase VARCHAR(50), -- 'off_season', 'pre_season', 'in_season', 'post_season'
    competition_schedule JSONB, -- upcoming competitions and timing
    health_status JSONB, -- current health conditions and medications
    dietary_restrictions TEXT[],
    supplement_preferences TEXT[],
    budget_constraints VARCHAR(50), -- 'low', 'medium', 'high'
    recommended_supplements JSONB, -- array of supplement recommendations
    dosing_schedules JSONB, -- detailed dosing information
    expected_timeline_weeks INTEGER,
    success_probability DECIMAL(3,2) CHECK (success_probability >= 0 AND success_probability <= 1),
    risk_assessment JSONB,
    monitoring_plan JSONB,
    alternative_recommendations JSONB,
    evidence_summary JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_supplement_research_supplement ON supplement_research(supplement_id);
CREATE INDEX IF NOT EXISTS idx_supplement_research_evidence ON supplement_research(evidence_level);
CREATE INDEX IF NOT EXISTS idx_supplement_protocols_user ON supplement_protocols(user_id);
CREATE INDEX IF NOT EXISTS idx_supplement_protocols_supplement ON supplement_protocols(supplement_id);
CREATE INDEX IF NOT EXISTS idx_supplement_safety_user ON supplement_safety_monitoring(user_id);
CREATE INDEX IF NOT EXISTS idx_supplement_interactions_supplements ON supplement_interactions(supplement1_id, supplement2_id);
CREATE INDEX IF NOT EXISTS idx_supplement_evidence_grades_supplement ON supplement_evidence_grades(supplement_id);
CREATE INDEX IF NOT EXISTS idx_supplement_recommendations_user ON supplement_recommendations(user_id);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_supplement_evidence_grades_unique ON supplement_evidence_grades(supplement_id, evidence_grade);
CREATE UNIQUE INDEX IF NOT EXISTS idx_supplement_interactions_unique ON supplement_interactions(supplement1_id, supplement2_id);

-- Insert sample supplement research data
INSERT INTO supplement_research (supplement_id, study_reference, study_title, authors, journal, publication_year, population_description, sample_size, study_duration_weeks, dose_studied_mg_per_kg, outcome_measures, primary_outcome, effect_size, statistical_significance, evidence_level, flag_football_relevance) VALUES
(1, 'Kreider et al. 2017', 'International Society of Sports Nutrition position stand: safety and efficacy of creatine supplementation in exercise, sport, and medicine', ARRAY['Kreider RB', 'Kalman DS', 'Antonio J'], 'Journal of the International Society of Sports Nutrition', 2017, 'Trained athletes and active individuals', 1000, 12, 20.0, ARRAY['strength', 'power', 'muscle_mass', 'recovery'], 'strength_improvement', 0.85, true, 'very_high', 'high'),

(2, 'Saunders et al. 2017', 'Beta-alanine supplementation to improve exercise capacity and performance: a systematic review and meta-analysis', ARRAY['Saunders B', 'Elliott-Sale K', 'Artioli GG'], 'British Journal of Sports Medicine', 2017, 'Trained athletes performing high-intensity exercise', 800, 8, 6.4, ARRAY['endurance', 'anaerobic_capacity', 'muscle_carnosine'], 'endurance_improvement', 0.72, true, 'high', 'high'),

(3, 'Grgic et al. 2019', 'Wake up and smell the coffee: caffeine supplementation and exercise performance-an umbrella review of 21 published meta-analyses', ARRAY['Grgic J', 'Trexler ET', 'Lazinic B'], 'British Journal of Sports Medicine', 2019, 'Athletes and active individuals', 1200, 4, 3.0, ARRAY['endurance', 'strength', 'power', 'cognitive_function'], 'performance_enhancement', 0.68, true, 'very_high', 'high');

-- Insert sample supplement protocols
INSERT INTO supplement_protocols (user_id, supplement_id, goal, recommended_dose_mg_per_kg, dosing_frequency, timing_relative_to_exercise, loading_phase_days, maintenance_phase_days, evidence_strength, expected_benefits, risk_assessment_score) VALUES
('f31b59e5-8a73-4afb-a444-f80b728a8a54', 1, 'strength_gain', 20.0, 'daily', 'post_workout', 7, 21, 'very_high', ARRAY['increased_strength', 'improved_power', 'enhanced_recovery'], 2),
('f31b59e5-8a73-4afb-a444-f80b728a8a54', 2, 'endurance_improvement', 6.4, 'daily', 'pre_workout', 0, 28, 'high', ARRAY['improved_endurance', 'delayed_fatigue', 'increased_work_capacity'], 3),
('f31b59e5-8a73-4afb-a444-f80b728a8a54', 3, 'cognitive_enhancement', 3.0, 'pre_workout', 'pre_workout', 0, 0, 'very_high', ARRAY['improved_focus', 'enhanced_alertness', 'better_reaction_time'], 2);

-- Insert sample supplement interactions
INSERT INTO supplement_interactions (supplement1_id, supplement2_id, interaction_type, interaction_severity, mechanism_of_interaction, clinical_evidence, recommendations) VALUES
(1, 2, 'synergistic', 'mild', 'Creatine increases muscle carnosine levels, enhancing beta-alanine effectiveness', 'Limited clinical evidence suggests potential synergistic effects', ARRAY['Monitor for enhanced effects', 'Consider reducing individual doses']),
(1, 3, 'additive', 'mild', 'Both supplements enhance performance through different mechanisms', 'Well-established safety profile for combination use', ARRAY['Standard dosing protocols apply', 'Monitor for individual tolerance']),
(2, 3, 'neutral', 'mild', 'No known direct interaction between beta-alanine and caffeine', 'Extensive clinical use without reported interactions', ARRAY['Standard dosing protocols apply', 'Monitor individual response']);

-- Insert sample evidence grades
INSERT INTO supplement_evidence_grades (supplement_id, evidence_grade, grade_calculation_date, total_studies, high_quality_studies, positive_outcome_studies, negative_outcome_studies, neutral_outcome_studies, overall_effect_size, consistency_score, flag_football_specific_score) VALUES
(1, 'A', '2025-01-01', 500, 150, 400, 50, 50, 0.85, 0.90, 0.95),
(2, 'B', '2025-01-01', 300, 80, 220, 40, 40, 0.72, 0.75, 0.85),
(3, 'A', '2025-01-01', 800, 200, 600, 100, 100, 0.68, 0.85, 0.90);

-- Create function to calculate supplement evidence grade
CREATE OR REPLACE FUNCTION calculate_supplement_evidence_grade(
    supplement_id_param INTEGER
) RETURNS VARCHAR AS $$
DECLARE
    total_studies INTEGER;
    high_quality_studies INTEGER;
    positive_outcomes INTEGER;
    effect_size_avg DECIMAL;
    grade VARCHAR;
BEGIN
    -- Get study counts and quality metrics
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN study_quality_score >= 8 THEN 1 END),
        COUNT(CASE WHEN statistical_significance = true THEN 1 END),
        AVG(effect_size)
    INTO total_studies, high_quality_studies, positive_outcomes, effect_size_avg
    FROM supplement_research 
    WHERE supplement_id = supplement_id_param;
    
    -- Calculate grade based on evidence criteria
    IF total_studies >= 50 AND high_quality_studies >= 20 AND positive_outcomes >= 40 AND effect_size_avg >= 0.5 THEN
        grade := 'A';
    ELSIF total_studies >= 30 AND high_quality_studies >= 10 AND positive_outcomes >= 20 AND effect_size_avg >= 0.3 THEN
        grade := 'B';
    ELSIF total_studies >= 15 AND high_quality_studies >= 5 AND positive_outcomes >= 10 AND effect_size_avg >= 0.2 THEN
        grade := 'C';
    ELSIF total_studies >= 5 AND positive_outcomes >= 3 THEN
        grade := 'D';
    ELSE
        grade := 'F';
    END IF;
    
    RETURN grade;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate supplement recommendations
CREATE OR REPLACE FUNCTION generate_supplement_recommendations(
    user_id_param UUID,
    target_outcome_param VARCHAR,
    training_phase_param VARCHAR DEFAULT 'in_season'
) RETURNS JSONB AS $$
DECLARE
    recommendations JSONB;
    supplement_record RECORD;
    evidence_record RECORD;
    protocol_record RECORD;
BEGIN
    recommendations := '[]'::jsonb;
    
    -- Find supplements relevant to target outcome
    FOR supplement_record IN 
        SELECT s.id, s.name, s.category, s.performance_benefits
        FROM supplements s
        JOIN supplement_research sr ON s.id = sr.supplement_id
        WHERE sr.evidence_level IN ('very_high', 'high')
        AND sr.flag_football_relevance = 'high'
        ORDER BY sr.evidence_level DESC, sr.effect_size DESC
        LIMIT 5
    LOOP
        -- Get evidence summary
        SELECT 
            evidence_grade,
            overall_effect_size,
            consistency_score
        INTO evidence_record
        FROM supplement_evidence_grades 
        WHERE supplement_id = supplement_record.id;
        
        -- Get recommended protocol
        SELECT 
            recommended_dose_mg_per_kg,
            dosing_frequency,
            timing_relative_to_exercise,
            loading_phase_days,
            maintenance_phase_days
        INTO protocol_record
        FROM supplement_protocols 
        WHERE user_id = user_id_param 
        AND supplement_id = supplement_record.id
        ORDER BY created_at DESC 
        LIMIT 1;
        
        -- Build recommendation object
        recommendations := recommendations || jsonb_build_object(
            'supplement_id', supplement_record.id,
            'supplement_name', supplement_record.name,
            'category', supplement_record.category,
            'target_outcome', target_outcome_param,
            'evidence_grade', evidence_record.evidence_grade,
            'effect_size', evidence_record.overall_effect_size,
            'consistency', evidence_record.consistency_score,
            'recommended_dose', protocol_record.recommended_dose_mg_per_kg,
            'dosing_frequency', protocol_record.dosing_frequency,
            'timing', protocol_record.timing_relative_to_exercise,
            'loading_phase_days', protocol_record.loading_phase_days,
            'maintenance_phase_days', protocol_record.maintenance_phase_days,
            'expected_benefits', supplement_record.performance_benefits,
            'success_probability', LEAST(0.95, 0.5 + (evidence_record.overall_effect_size * 0.3))
        );
    END LOOP;
    
    RETURN recommendations;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_supplement_protocols_updated_at 
    BEFORE UPDATE ON supplement_protocols 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create materialized view for supplement evidence summary
CREATE MATERIALIZED VIEW IF NOT EXISTS supplement_evidence_summary AS
SELECT 
    s.id as supplement_id,
    s.name as supplement_name,
    s.category,
    seg.evidence_grade,
    seg.overall_effect_size,
    seg.consistency_score,
    seg.flag_football_specific_score,
    COUNT(sr.id) as total_studies,
    COUNT(CASE WHEN sr.evidence_level = 'very_high' THEN 1 END) as very_high_evidence_studies,
    COUNT(CASE WHEN sr.evidence_level = 'high' THEN 1 END) as high_evidence_studies,
    AVG(sr.effect_size) as avg_effect_size,
    MAX(sr.publication_year) as latest_study_year
FROM supplements s
LEFT JOIN supplement_evidence_grades seg ON s.id = seg.supplement_id
LEFT JOIN supplement_research sr ON s.id = sr.supplement_id
GROUP BY s.id, s.name, s.category, seg.evidence_grade, seg.overall_effect_size, seg.consistency_score, seg.flag_football_specific_score
ORDER BY seg.evidence_grade, seg.overall_effect_size DESC;

-- Add comments
COMMENT ON TABLE supplement_research IS 'Comprehensive database of supplement research studies and evidence';
COMMENT ON TABLE supplement_protocols IS 'Individualized supplement protocols and recommendations';
COMMENT ON TABLE supplement_safety_monitoring IS 'Ongoing safety monitoring for supplement use';
COMMENT ON TABLE supplement_interactions IS 'Database of supplement interactions and contraindications';
COMMENT ON TABLE supplement_evidence_grades IS 'Evidence grading system for supplements using GRADE methodology';
COMMENT ON TABLE supplement_decision_trees IS 'Decision tree logic for supplement recommendations';
COMMENT ON TABLE supplement_recommendations IS 'Generated supplement recommendations for athletes';
COMMENT ON FUNCTION calculate_supplement_evidence_grade IS 'Calculate evidence grade for supplements based on research quality';
COMMENT ON FUNCTION generate_supplement_recommendations IS 'Generate personalized supplement recommendations based on evidence and user profile';

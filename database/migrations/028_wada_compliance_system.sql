-- =============================================================================
-- WADA COMPLIANCE SYSTEM - Migration 028
-- Tracks prohibited substances, supplement safety, and compliance for flag football athletes
-- Prevents accidental doping violations and ensures clean sport participation
-- =============================================================================

-- WADA prohibited substances list
CREATE TABLE IF NOT EXISTS wada_prohibited_substances (
    id SERIAL PRIMARY KEY,
    substance_name VARCHAR(255) NOT NULL,
    substance_category VARCHAR(100), -- 'anabolic_agents', 'peptide_hormones', 'beta_2_agonists', 'hormone_antagonists', 'diuretics', 'stimulants', 'narcotics', 'cannabinoids', 'glucocorticoids', 'beta_blockers'
    prohibited_status VARCHAR(50), -- 'prohibited_at_all_times', 'prohibited_in_competition', 'prohibited_in_certain_sports', 'not_prohibited'
    wada_code VARCHAR(20), -- Official WADA substance code
    risk_level VARCHAR(50), -- 'high', 'moderate', 'low', 'none'
    
    -- Prohibition details
    prohibition_start_date DATE,
    prohibition_end_date DATE,
    prohibition_reason TEXT,
    exceptions TEXT[], -- e.g., 'therapeutic_use_exemption', 'certain_sports_excluded'
    
    -- Detection information
    detection_window_days INTEGER, -- How long it stays detectable
    common_sources TEXT[], -- Where athletes might accidentally encounter it
    cross_contamination_risk BOOLEAN DEFAULT false,
    
    -- Flag football specific
    flag_football_relevance VARCHAR(50), -- 'high', 'moderate', 'low', 'none'
    position_specific_risks TEXT[], -- Which positions might be more at risk
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplement safety and WADA compliance
CREATE TABLE IF NOT EXISTS supplement_wada_compliance (
    id SERIAL PRIMARY KEY,
    supplement_name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    wada_status VARCHAR(50), -- 'compliant', 'prohibited', 'high_risk', 'moderate_risk', 'low_risk'
    
    -- Risk assessment
    contamination_risk_percentage DECIMAL(5,2),
    banned_substances_detected TEXT[],
    testing_frequency VARCHAR(50), -- 'batch_tested', 'occasionally_tested', 'not_tested'
    
    -- Third-party testing
    third_party_tested BOOLEAN DEFAULT false,
    testing_organization VARCHAR(255),
    last_test_date DATE,
    test_result VARCHAR(50),
    
    -- Flag football recommendations
    flag_football_safe BOOLEAN DEFAULT true,
    recommended_for_position TEXT[],
    usage_guidelines TEXT,
    
    -- WADA compliance notes
    compliance_notes TEXT,
    risk_mitigation_strategies TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Athlete supplement monitoring
CREATE TABLE IF NOT EXISTS athlete_supplement_monitoring (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    supplement_id INTEGER REFERENCES supplement_wada_compliance(id),
    
    -- Usage tracking
    start_date DATE NOT NULL,
    end_date DATE,
    dosage VARCHAR(100),
    frequency VARCHAR(50),
    
    -- WADA compliance checks
    wada_compliance_verified BOOLEAN DEFAULT false,
    verification_date DATE,
    verification_method VARCHAR(100), -- 'batch_testing', 'third_party_certification', 'wada_database_check'
    
    -- Risk assessment
    current_risk_level VARCHAR(50),
    risk_factors TEXT[],
    mitigation_actions TEXT[],
    
    -- Testing results
    drug_test_results TEXT[], -- Results of any drug tests while using supplement
    test_dates DATE[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WADA testing schedule and results
CREATE TABLE IF NOT EXISTS wada_testing_records (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    
    -- Test details
    test_date DATE NOT NULL,
    test_type VARCHAR(100), -- 'in_competition', 'out_of_competition', 'targeted', 'random'
    test_location VARCHAR(255),
    testing_authority VARCHAR(255), -- 'WADA', 'IFAF', 'national_authority'
    
    -- Test results
    result VARCHAR(50), -- 'negative', 'positive', 'atypical', 'pending'
    substances_detected TEXT[],
    concentration_levels JSONB,
    
    -- Consequences
    provisional_suspension BOOLEAN DEFAULT false,
    suspension_duration_days INTEGER,
    appeal_status VARCHAR(50), -- 'none', 'pending', 'upheld', 'overturned'
    
    -- Flag football impact
    competition_eligibility_affected BOOLEAN DEFAULT false,
    affected_competitions TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Therapeutic Use Exemptions (TUEs)
CREATE TABLE IF NOT EXISTS therapeutic_use_exemptions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    
    -- Medical condition
    medical_condition TEXT NOT NULL,
    diagnosis_date DATE,
    treating_physician VARCHAR(255),
    medical_specialty VARCHAR(100),
    
    -- Prohibited substance
    prohibited_substance VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    administration_method VARCHAR(100),
    treatment_duration_days INTEGER,
    
    -- TUE application
    tue_status VARCHAR(50), -- 'pending', 'approved', 'denied', 'expired'
    application_date DATE,
    decision_date DATE,
    decision_reason TEXT,
    
    -- WADA compliance
    wada_approval_required BOOLEAN DEFAULT false,
    wada_approval_status VARCHAR(50),
    wada_approval_date DATE,
    
    -- Flag football specific
    competition_restrictions TEXT[],
    monitoring_requirements TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WADA education and awareness
CREATE TABLE IF NOT EXISTS wada_education_materials (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(100), -- 'video', 'document', 'interactive', 'quiz'
    target_audience VARCHAR(100), -- 'athletes', 'coaches', 'medical_staff', 'all'
    
    -- Content details
    description TEXT,
    content_url TEXT,
    duration_minutes INTEGER,
    
    -- WADA focus areas
    prohibited_substances_covered TEXT[],
    risk_scenarios TEXT[],
    compliance_strategies TEXT[],
    
    -- Flag football specific
    flag_football_examples TEXT[],
    position_specific_content BOOLEAN DEFAULT false,
    
    -- Tracking
    views_count INTEGER DEFAULT 0,
    completion_rate_percentage DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Athlete education tracking
CREATE TABLE IF NOT EXISTS athlete_education_completion (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    education_material_id INTEGER REFERENCES wada_education_materials(id),
    
    -- Completion tracking
    start_date TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,
    completion_status VARCHAR(50), -- 'not_started', 'in_progress', 'completed', 'failed'
    
    -- Assessment results
    quiz_score_percentage DECIMAL(5,2),
    questions_answered INTEGER,
    correct_answers INTEGER,
    
    -- Understanding verification
    understanding_verified BOOLEAN DEFAULT false,
    verification_method VARCHAR(100), -- 'quiz', 'coach_assessment', 'medical_staff_assessment'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE OPTIMIZATION
CREATE INDEX IF NOT EXISTS idx_wada_substances_category ON wada_prohibited_substances(substance_category);
CREATE INDEX IF NOT EXISTS idx_wada_substances_status ON wada_prohibited_substances(prohibited_status);
CREATE INDEX IF NOT EXISTS idx_wada_substances_flag_football ON wada_prohibited_substances(flag_football_relevance);

CREATE INDEX IF NOT EXISTS idx_supplement_compliance_wada_status ON supplement_wada_compliance(wada_status);
CREATE INDEX IF NOT EXISTS idx_supplement_compliance_flag_football ON supplement_wada_compliance(flag_football_safe);

CREATE INDEX IF NOT EXISTS idx_athlete_supplement_user ON athlete_supplement_monitoring(user_id);
CREATE INDEX IF NOT EXISTS idx_athlete_supplement_risk ON athlete_supplement_monitoring(current_risk_level);

CREATE INDEX IF NOT EXISTS idx_wada_testing_user ON wada_testing_records(user_id);
CREATE INDEX IF NOT EXISTS idx_wada_testing_result ON wada_testing_records(result);

CREATE INDEX IF NOT EXISTS idx_tue_user ON therapeutic_use_exemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_tue_status ON therapeutic_use_exemptions(tue_status);

-- SAMPLE DATA FOR TESTING
INSERT INTO wada_prohibited_substances (
    substance_name, substance_category, prohibited_status, wada_code, risk_level,
    flag_football_relevance, detection_window_days, common_sources
) VALUES 
('Testosterone', 'anabolic_agents', 'prohibited_at_all_times', 'S1.1', 'high', 'high', 30, ARRAY['anabolic_steroids', 'testosterone_boosters']),
('Erythropoietin (EPO)', 'peptide_hormones', 'prohibited_at_all_times', 'S2.1', 'high', 'moderate', 7, ARRAY['blood_doping', 'recombinant_epo']),
('Stimulants', 'stimulants', 'prohibited_in_competition', 'S6', 'moderate', 'moderate', 3, ARRAY['cold_medications', 'energy_drinks', 'pre_workout_supplements']),
('Cannabinoids', 'cannabinoids', 'prohibited_in_competition', 'S8', 'moderate', 'low', 30, ARRAY['marijuana', 'cbd_products', 'hemp_products']),
('Beta-blockers', 'beta_blockers', 'prohibited_in_competition', 'P3', 'low', 'low', 2, ARRAY['blood_pressure_medications', 'performance_anxiety_medications']);

INSERT INTO supplement_wada_compliance (
    supplement_name, brand, wada_status, contamination_risk_percentage, 
    third_party_tested, flag_football_safe, recommended_for_position
) VALUES 
('Creatine Monohydrate', 'Generic', 'compliant', 0.1, true, true, ARRAY['all_positions']),
('Whey Protein Isolate', 'Generic', 'compliant', 0.05, true, true, ARRAY['all_positions']),
('Beta-Alanine', 'Generic', 'compliant', 0.2, true, true, ARRAY['receiver', 'defensive_back', 'lineman']),
('Caffeine', 'Generic', 'compliant', 0.1, true, true, ARRAY['quarterback', 'receiver', 'defensive_back']),
('Pre-Workout Blend', 'Generic', 'high_risk', 15.0, false, false, ARRAY['none']);

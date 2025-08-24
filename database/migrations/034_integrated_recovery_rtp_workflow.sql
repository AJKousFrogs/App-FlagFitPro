-- Migration: Integrated Recovery & Return-to-Play (RTP) Workflow
-- This migration adds comprehensive recovery management and return-to-play decision logic

-- 1. INJURY EVENTS AND MONITORING
CREATE TABLE IF NOT EXISTS injury_events (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    injury_date DATE NOT NULL,
    injury_type VARCHAR(100) NOT NULL, -- 'muscle_strain', 'ligament_sprain', 'fracture', 'concussion', 'overuse'
    injury_location VARCHAR(100) NOT NULL, -- 'ankle', 'knee', 'shoulder', 'head', 'back'
    injury_severity VARCHAR(50) NOT NULL CHECK (injury_severity IN ('mild', 'moderate', 'severe', 'critical')),
    injury_mechanism TEXT, -- how the injury occurred
    initial_symptoms TEXT[],
    pain_level_start INTEGER CHECK (pain_level_start >= 1 AND pain_level_start <= 10),
    swelling_level INTEGER CHECK (swelling_level >= 1 AND swelling_level <= 10),
    bruising_level INTEGER CHECK (bruising_level >= 1 AND bruising_level <= 10),
    range_of_motion_affected DECIMAL(5,2), -- percentage of normal ROM
    strength_affected DECIMAL(5,2), -- percentage of normal strength
    functional_limitations TEXT[],
    medical_diagnosis TEXT,
    imaging_results JSONB, -- MRI, X-ray, ultrasound results
    treatment_plan TEXT,
    expected_recovery_time_weeks INTEGER,
    risk_factors TEXT[],
    previous_injury_history TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RETURN-TO-PLAY PROTOCOLS
CREATE TABLE IF NOT EXISTS rtp_protocols (
    id SERIAL PRIMARY KEY,
    injury_type VARCHAR(100) NOT NULL,
    injury_severity VARCHAR(50) NOT NULL,
    phase_number INTEGER NOT NULL,
    phase_name VARCHAR(200) NOT NULL,
    min_days_in_phase INTEGER NOT NULL,
    max_days_in_phase INTEGER,
    phase_description TEXT NOT NULL,
    objective_tests TEXT[] NOT NULL, -- specific tests to pass
    pass_thresholds JSONB NOT NULL, -- minimum values to progress
    functional_activities TEXT[] NOT NULL, -- activities allowed in this phase
    restricted_activities TEXT[] NOT NULL, -- activities not allowed
    pain_threshold INTEGER CHECK (pain_threshold >= 1 AND pain_threshold <= 10),
    swelling_threshold INTEGER CHECK (swelling_threshold >= 0 AND swelling_threshold <= 10),
    strength_requirements JSONB, -- strength benchmarks
    range_of_motion_requirements JSONB, -- ROM benchmarks
    balance_requirements JSONB, -- balance and proprioception tests
    sport_specific_tests TEXT[], -- flag football specific tests
    progression_criteria TEXT[],
    regression_criteria TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RECOVERY DEVICE INVENTORY
CREATE TABLE IF NOT EXISTS recovery_device_inventory (
    id SERIAL PRIMARY KEY,
    team_id UUID,
    device_name VARCHAR(200) NOT NULL,
    device_type VARCHAR(100) NOT NULL, -- 'compression', 'percussion', 'electrical_stimulation', 'cryotherapy'
    modality VARCHAR(100) NOT NULL, -- specific treatment type
    intensity_levels JSONB, -- available intensity settings
    treatment_duration_minutes INTEGER,
    frequency_recommendations TEXT[], -- how often to use
    contraindications TEXT[],
    maintenance_requirements TEXT[],
    availability_status VARCHAR(50) DEFAULT 'available', -- 'available', 'in_use', 'maintenance', 'out_of_order'
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    device_condition VARCHAR(50) DEFAULT 'excellent', -- 'excellent', 'good', 'fair', 'poor'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. INDIVIDUAL RECOVERY TRACKING
CREATE TABLE IF NOT EXISTS individual_recovery_tracking (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    injury_event_id INTEGER REFERENCES injury_events(id) ON DELETE CASCADE,
    rtp_protocol_id INTEGER REFERENCES rtp_protocols(id) ON DELETE CASCADE,
    current_phase INTEGER NOT NULL,
    phase_start_date DATE NOT NULL,
    days_in_current_phase INTEGER NOT NULL,
    phase_completion_percentage DECIMAL(5,2) DEFAULT 0,
    objective_test_results JSONB, -- results of required tests
    functional_activity_log JSONB, -- activities performed and outcomes
    pain_level_current INTEGER CHECK (pain_level_current >= 1 AND pain_level_current <= 10),
    swelling_level_current INTEGER CHECK (swelling_level_current >= 1 AND swelling_level_current <= 10),
    range_of_motion_current DECIMAL(5,2),
    strength_current DECIMAL(5,2),
    balance_scores JSONB,
    sport_specific_test_results JSONB,
    phase_ready_for_progression BOOLEAN DEFAULT false,
    progression_date DATE,
    regression_occurred BOOLEAN DEFAULT false,
    regression_reason TEXT,
    regression_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RECOVERY SESSION LOGS
CREATE TABLE IF NOT EXISTS recovery_session_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recovery_date DATE NOT NULL,
    session_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    session_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    session_duration_minutes INTEGER NOT NULL,
    recovery_type VARCHAR(100) NOT NULL, -- 'active_recovery', 'passive_recovery', 'mobility', 'strengthening'
    devices_used INTEGER[],
    treatment_parameters JSONB, -- intensity, duration, frequency for each device
    subjective_feedback JSONB, -- how the athlete felt during and after
    objective_measurements JSONB, -- pain, swelling, ROM, strength measurements
    functional_improvements TEXT[],
    challenges_encountered TEXT[],
    next_session_goals TEXT[],
    session_effectiveness_rating INTEGER CHECK (session_effectiveness_rating >= 1 AND session_effectiveness_rating <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. RECOVERY PROTOCOL MATCHING
CREATE TABLE IF NOT EXISTS recovery_protocol_matching (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    injury_event_id INTEGER REFERENCES injury_events(id) ON DELETE CASCADE,
    matched_protocol_id INTEGER REFERENCES rtp_protocols(id) ON DELETE CASCADE,
    matching_score DECIMAL(5,2) CHECK (matching_score >= 0 AND matching_score <= 100),
    matching_factors JSONB, -- why this protocol was selected
    alternative_protocols INTEGER[],
    customization_notes TEXT[],
    contraindication_checks JSONB, -- safety checks performed
    risk_assessment_score INTEGER CHECK (risk_assessment_score >= 1 AND risk_assessment_score <= 10),
    protocol_start_date DATE,
    expected_completion_date DATE,
    actual_completion_date DATE,
    protocol_success_rating INTEGER CHECK (protocol_success_rating >= 1 AND protocol_success_rating <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. RECOVERY PERFORMANCE ANALYTICS
CREATE TABLE IF NOT EXISTS recovery_performance_analytics (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis_date DATE NOT NULL,
    recovery_phase INTEGER NOT NULL,
    phase_duration_days INTEGER NOT NULL,
    phase_completion_rate DECIMAL(5,2),
    objective_test_progress JSONB, -- improvement in test scores
    functional_activity_progress JSONB, -- improvement in activities
    pain_reduction_percentage DECIMAL(5,2),
    swelling_reduction_percentage DECIMAL(5,2),
    range_of_motion_improvement_percentage DECIMAL(5,2),
    strength_improvement_percentage DECIMAL(5,2),
    balance_improvement_percentage DECIMAL(5,2),
    sport_specific_improvement_percentage DECIMAL(5,2),
    recovery_efficiency_score DECIMAL(5,2), -- progress vs. expected timeline
    risk_factors_identified TEXT[],
    success_factors_identified TEXT[],
    recommendations_for_next_phase TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_injury_events_user_date ON injury_events(user_id, injury_date);
CREATE INDEX IF NOT EXISTS idx_injury_events_type_severity ON injury_events(injury_type, injury_severity);
CREATE INDEX IF NOT EXISTS idx_rtp_protocols_injury ON rtp_protocols(injury_type, injury_severity);
CREATE INDEX IF NOT EXISTS idx_recovery_device_team ON recovery_device_inventory(team_id);
CREATE INDEX IF NOT EXISTS idx_recovery_device_type ON recovery_device_inventory(device_type);
CREATE INDEX IF NOT EXISTS idx_individual_recovery_user ON individual_recovery_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_individual_recovery_phase ON individual_recovery_tracking(current_phase);
CREATE INDEX IF NOT EXISTS idx_recovery_sessions_user ON recovery_session_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_sessions_date ON recovery_session_logs(recovery_date);
CREATE INDEX IF NOT EXISTS idx_recovery_protocol_matching_user ON recovery_protocol_matching(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_performance_user ON recovery_performance_analytics(user_id);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_individual_recovery_unique ON individual_recovery_tracking(user_id, injury_event_id, current_phase);
CREATE UNIQUE INDEX IF NOT EXISTS idx_recovery_protocol_matching_unique ON recovery_protocol_matching(user_id, injury_event_id);

-- Insert sample RTP protocols for common flag football injuries
INSERT INTO rtp_protocols (injury_type, injury_severity, phase_number, phase_name, min_days_in_phase, phase_description, objective_tests, pass_thresholds, functional_activities, restricted_activities, pain_threshold, swelling_threshold, strength_requirements, range_of_motion_requirements, balance_requirements, sport_specific_tests, progression_criteria) VALUES
('ankle_sprain', 'mild', 1, 'Acute Phase - Protection and Rest', 3, 'Focus on reducing pain and swelling, protecting the injury', ARRAY['pain_assessment', 'swelling_assessment'], '{"pain_level": 3, "swelling_level": 2}', ARRAY['gentle_range_of_motion', 'ice_applications'], ARRAY['weight_bearing', 'sport_activities', 'running'], 3, 2, '{"strength_test": "none"}', '{"rom_test": "none"}', '{"balance_test": "none"}', ARRAY['none'], ARRAY['pain_less_than_3', 'swelling_less_than_2', 'no_increase_in_symptoms']),

('ankle_sprain', 'mild', 2, 'Subacute Phase - Early Mobilization', 7, 'Begin gentle movement and basic strengthening', ARRAY['pain_assessment', 'swelling_assessment', 'range_of_motion', 'basic_strength'], '{"pain_level": 2, "swelling_level": 1, "rom_percentage": 70, "strength_percentage": 60}', ARRAY['ankle_alphabet', 'calf_stretches', 'resistance_band_exercises'], ARRAY['jumping', 'cutting', 'sport_specific_movements'], 2, 1, '{"calf_raise": 60, "ankle_dorsiflexion": 60}', '{"ankle_dorsiflexion": 70, "ankle_plantarflexion": 70, "ankle_inversion": 70, "ankle_eversion": 70}', '{"single_leg_balance": 30}', ARRAY['basic_ankle_mobility', 'calf_strength'], ARRAY['pain_less_than_2', 'swelling_less_than_1', 'rom_greater_than_70_percent', 'strength_greater_than_60_percent']),

('ankle_sprain', 'mild', 3, 'Advanced Phase - Sport-Specific Training', 14, 'Return to sport-specific movements and conditioning', ARRAY['pain_assessment', 'swelling_assessment', 'strength_testing', 'balance_testing', 'functional_testing'], '{"pain_level": 1, "swelling_level": 0, "strength_percentage": 90, "balance_time": 60, "functional_score": 85}', ARRAY['jogging', 'agility_drills', 'sport_specific_movements'], ARRAY['full_contact', 'competition'], 1, 0, '{"calf_raise": 90, "ankle_dorsiflexion": 90, "single_leg_hop": 90}', '{"ankle_rom": 90}', '{"single_leg_balance": 60, "dynamic_balance": 85}', ARRAY['figure_8_drill', 'lateral_movements', 'cutting_drills'], ARRAY['pain_less_than_1', 'no_swelling', 'strength_greater_than_90_percent', 'balance_greater_than_60_seconds', 'functional_score_greater_than_85']);

-- Insert sample recovery devices
INSERT INTO recovery_device_inventory (team_id, device_name, device_type, modality, intensity_levels, treatment_duration_minutes, frequency_recommendations, contraindications) VALUES
(gen_random_uuid(), 'NormaTec Recovery System', 'compression', 'sequential_compression', '{"pressure_levels": [30, 45, 60, 75, 90], "compression_patterns": ["wave", "pulse", "static"]}', 30, ARRAY['post_workout', 'recovery_days', 'injury_recovery'], ARRAY['deep_vein_thrombosis', 'acute_injury', 'infection']),
(gen_random_uuid(), 'Hyperice Hypervolt', 'percussion', 'percussive_therapy', '{"speed_levels": [1750, 2000, 2200, 2400, 3200], "attachment_types": ["ball", "flat", "fork"]}', 15, ARRAY['pre_workout', 'post_workout', 'recovery_days'], ARRAY['acute_injury', 'bone_fracture', 'nerve_damage']),
(gen_random_uuid(), 'Compex Electrical Stimulation', 'electrical_stimulation', 'neuromuscular_electrical_stimulation', '{"intensity_levels": [1, 50], "frequency_ranges": [2, 100], "pulse_widths": [50, 400]}', 20, ARRAY['recovery_days', 'injury_recovery'], ARRAY['pacemaker', 'pregnancy', 'epilepsy']);

-- Create function to assess RTP readiness
CREATE OR REPLACE FUNCTION assess_rtp_readiness(
    user_id_param UUID,
    injury_event_id_param INTEGER
) RETURNS JSONB AS $$
DECLARE
    current_recovery RECORD;
    rtp_protocol RECORD;
    readiness_score DECIMAL;
    readiness_status VARCHAR;
    recommendations TEXT[];
    next_phase_requirements JSONB;
BEGIN
    -- Get current recovery status
    SELECT 
        irt.current_phase,
        irt.phase_completion_percentage,
        irt.objective_test_results,
        irt.functional_activity_log,
        irt.pain_level_current,
        irt.swelling_level_current,
        irt.range_of_motion_current,
        irt.strength_current,
        irt.balance_scores,
        irt.sport_specific_test_results
    INTO current_recovery
    FROM individual_recovery_tracking irt
    WHERE irt.user_id = user_id_param 
    AND irt.injury_event_id = injury_event_id_param
    ORDER BY irt.created_at DESC
    LIMIT 1;
    
    -- Get RTP protocol requirements
    SELECT 
        rp.pass_thresholds,
        rp.objective_tests,
        rp.functional_activities
    INTO rtp_protocol
    FROM rtp_protocols rp
    JOIN individual_recovery_tracking irt ON rp.id = irt.rtp_protocol_id
    WHERE irt.user_id = user_id_param 
    AND irt.injury_event_id = injury_event_id_param
    AND rp.phase_number = current_recovery.current_phase;
    
    -- Calculate readiness score (0-100)
    readiness_score := 0;
    
    -- Pain assessment (25% weight)
    IF current_recovery.pain_level_current <= 2 THEN
        readiness_score := readiness_score + 25;
    ELSIF current_recovery.pain_level_current <= 4 THEN
        readiness_score := readiness_score + 15;
    END IF;
    
    -- Swelling assessment (20% weight)
    IF current_recovery.swelling_level_current <= 1 THEN
        readiness_score := readiness_score + 20;
    ELSIF current_recovery.swelling_level_current <= 2 THEN
        readiness_score := readiness_score + 10;
    END IF;
    
    -- Range of motion (20% weight)
    IF current_recovery.range_of_motion_current >= 90 THEN
        readiness_score := readiness_score + 20;
    ELSIF current_recovery.range_of_motion_current >= 80 THEN
        readiness_score := readiness_score + 15;
    ELSIF current_recovery.range_of_motion_current >= 70 THEN
        readiness_score := readiness_score + 10;
    END IF;
    
    -- Strength (20% weight)
    IF current_recovery.strength_current >= 90 THEN
        readiness_score := readiness_score + 20;
    ELSIF current_recovery.strength_current >= 80 THEN
        readiness_score := readiness_score + 15;
    ELSIF current_recovery.strength_current >= 70 THEN
        readiness_score := readiness_score + 10;
    END IF;
    
    -- Phase completion (15% weight)
    readiness_score := readiness_score + (current_recovery.phase_completion_percentage * 0.15);
    
    -- Determine readiness status
    IF readiness_score >= 90 THEN
        readiness_status := 'ready_for_progression';
    ELSIF readiness_score >= 75 THEN
        readiness_status := 'nearly_ready';
    ELSIF readiness_score >= 60 THEN
        readiness_status := 'moderate_progress';
    ELSE
        readiness_status := 'needs_more_time';
    END IF;
    
    -- Generate recommendations
    IF readiness_status = 'ready_for_progression' THEN
        recommendations := ARRAY[
            'Ready to progress to next phase',
            'Schedule phase progression assessment',
            'Begin next phase protocols'
        ];
    ELSIF readiness_status = 'nearly_ready' THEN
        recommendations := ARRAY[
            'Continue current phase activities',
            'Focus on remaining objective tests',
            'Reassess in 2-3 days'
        ];
    ELSE
        recommendations := ARRAY[
            'Continue current phase protocols',
            'Address identified deficits',
            'Monitor progress daily'
        ];
    END IF;
    
    -- Build next phase requirements
    next_phase_requirements := jsonb_build_object(
        'phase_number', current_recovery.current_phase + 1,
        'objective_tests', rtp_protocol.objective_tests,
        'pass_thresholds', rtp_protocol.pass_thresholds,
        'functional_activities', rtp_protocol.functional_activities
    );
    
    RETURN jsonb_build_object(
        'readiness_score', readiness_score,
        'readiness_status', readiness_status,
        'current_phase', current_recovery.current_phase,
        'phase_completion', current_recovery.phase_completion_percentage,
        'assessments', jsonb_build_object(
            'pain_level', current_recovery.pain_level_current,
            'swelling_level', current_recovery.swelling_level_current,
            'range_of_motion', current_recovery.range_of_motion_current,
            'strength', current_recovery.strength_current
        ),
        'recommendations', recommendations,
        'next_phase_requirements', next_phase_requirements
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to match recovery protocols
CREATE OR REPLACE FUNCTION match_recovery_protocol(
    user_id_param UUID,
    injury_event_id_param INTEGER
) RETURNS JSONB AS $$
DECLARE
    injury_record RECORD;
    protocol_record RECORD;
    matching_score DECIMAL;
    best_protocol_id INTEGER;
    alternative_protocols INTEGER[];
    risk_factors TEXT[];
BEGIN
    -- Get injury details
    SELECT 
        injury_type,
        injury_severity,
        injury_location,
        pain_level_start,
        swelling_level_start
    INTO injury_record
    FROM injury_events
    WHERE id = injury_event_id_param;
    
    -- Find best matching protocol
    SELECT 
        rp.id,
        rp.phase_name,
        rp.phase_description,
        rp.min_days_in_phase
    INTO protocol_record
    FROM rtp_protocols rp
    WHERE rp.injury_type = injury_record.injury_type
    AND rp.injury_severity = injury_record.injury_severity
    AND rp.phase_number = 1
    ORDER BY rp.min_days_in_phase ASC
    LIMIT 1;
    
    -- Calculate matching score based on injury characteristics
    matching_score := 100; -- Base score
    
    -- Adjust for pain level
    IF injury_record.pain_level_start > 7 THEN
        matching_score := matching_score - 10;
    ELSIF injury_record.pain_level_start > 5 THEN
        matching_score := matching_score - 5;
    END IF;
    
    -- Adjust for swelling level
    IF injury_record.swelling_level_start > 7 THEN
        matching_score := matching_score - 10;
    ELSIF injury_record.swelling_level_start > 5 THEN
        matching_score := matching_score - 5;
    END IF;
    
    -- Get alternative protocols
    SELECT ARRAY_AGG(id) INTO alternative_protocols
    FROM rtp_protocols
    WHERE injury_type = injury_record.injury_type
    AND injury_severity = injury_record.injury_severity
    AND id != protocol_record.id;
    
    -- Identify risk factors
    IF injury_record.pain_level_start > 8 THEN
        risk_factors := ARRAY['high_pain_level', 'may_need_medical_attention'];
    END IF;
    
    IF injury_record.swelling_level_start > 8 THEN
        risk_factors := ARRAY_APPEND(risk_factors, 'severe_swelling');
    END IF;
    
    RETURN jsonb_build_object(
        'matched_protocol_id', protocol_record.id,
        'matching_score', matching_score,
        'protocol_name', protocol_record.phase_name,
        'protocol_description', protocol_record.phase_description,
        'expected_duration_days', protocol_record.min_days_in_phase,
        'alternative_protocols', alternative_protocols,
        'risk_factors', risk_factors,
        'recommendations', ARRAY[
            'Begin with phase 1 protocols',
            'Monitor pain and swelling daily',
            'Progress based on objective criteria'
        ]
    );
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_injury_events_updated_at 
    BEFORE UPDATE ON injury_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_individual_recovery_tracking_updated_at 
    BEFORE UPDATE ON individual_recovery_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create materialized view for recovery summary
CREATE MATERIALIZED VIEW IF NOT EXISTS recovery_summary AS
SELECT 
    irt.user_id,
    ie.injury_type,
    ie.injury_severity,
    irt.current_phase,
    irt.phase_completion_percentage,
    irt.days_in_current_phase,
    irt.phase_ready_for_progression,
    irt.regression_occurred,
    assess_rtp_readiness(irt.user_id, irt.injury_event_id) as readiness_assessment
FROM individual_recovery_tracking irt
JOIN injury_events ie ON irt.injury_event_id = ie.id
WHERE irt.created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY irt.user_id, irt.current_phase DESC;

-- Add comments
COMMENT ON TABLE injury_events IS 'Comprehensive injury tracking and assessment';
COMMENT ON TABLE rtp_protocols IS 'Structured return-to-play protocols by injury type and severity';
COMMENT ON TABLE recovery_device_inventory IS 'Team recovery equipment and device management';
COMMENT ON TABLE individual_recovery_tracking IS 'Individual athlete recovery progress tracking';
COMMENT ON TABLE recovery_session_logs IS 'Detailed recovery session logs and outcomes';
COMMENT ON TABLE recovery_protocol_matching IS 'Automated recovery protocol matching and customization';
COMMENT ON TABLE recovery_performance_analytics IS 'Recovery performance analytics and progress tracking';
COMMENT ON FUNCTION assess_rtp_readiness IS 'Assess return-to-play readiness based on current recovery status';
COMMENT ON FUNCTION match_recovery_protocol IS 'Match injury characteristics to appropriate recovery protocols';

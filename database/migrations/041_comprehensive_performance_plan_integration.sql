-- Migration: Comprehensive Performance Plan Integration System
-- This migration integrates all aspects of the performance plan including implementation, success indicators, and education

-- 1. IMPLEMENTATION STEPS AND PROGRESS TRACKING
CREATE TABLE IF NOT EXISTS implementation_steps (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    step_name VARCHAR(200) NOT NULL,
    step_description TEXT NOT NULL,
    step_category VARCHAR(100) NOT NULL, -- 'baseline_testing', 'budget_allocation', 'plan_building', 'education', 'accountability', 'dashboard'
    step_order INTEGER NOT NULL,
    estimated_duration_days INTEGER NOT NULL,
    dependencies TEXT[], -- array of step names that must be completed first
    required_resources TEXT[],
    success_criteria TEXT[] NOT NULL,
    step_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'blocked', 'skipped'
    start_date DATE,
    completion_date DATE,
    actual_duration_days INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BASELINE TESTING AND ASSESSMENT FRAMEWORK
CREATE TABLE IF NOT EXISTS baseline_testing_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    test_type VARCHAR(100) NOT NULL, -- 'body_composition', 'sprint_time', 'hrv', 'fms_screen', 'cognitive', 'nutrition'
    test_name VARCHAR(200) NOT NULL,
    baseline_value DECIMAL(8,2),
    baseline_unit VARCHAR(50),
    current_value DECIMAL(8,2),
    improvement_percentage DECIMAL(5,2),
    test_status VARCHAR(50) DEFAULT 'completed', -- 'scheduled', 'in_progress', 'completed', 'failed'
    tester_id UUID REFERENCES users(id),
    test_notes TEXT,
    retest_recommended BOOLEAN DEFAULT false,
    retest_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. EDUCATION AND CLINIC MANAGEMENT SYSTEM
CREATE TABLE IF NOT EXISTS education_clinics (
    id SERIAL PRIMARY KEY,
    clinic_name VARCHAR(200) NOT NULL,
    clinic_description TEXT NOT NULL,
    clinic_topic VARCHAR(100) NOT NULL, -- 'sleep', 'nutrition', 'training', 'recovery'
    clinic_type VARCHAR(100) NOT NULL, -- 'workshop', 'webinar', 'one_on_one', 'group_session'
    presenter_id UUID REFERENCES users(id),
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    clinic_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    location VARCHAR(200),
    virtual_platform VARCHAR(100),
    recording_url TEXT,
    materials_url TEXT,
    clinic_status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'active', 'completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CLINIC PARTICIPATION AND FEEDBACK
CREATE TABLE IF NOT EXISTS clinic_participations (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER NOT NULL REFERENCES education_clinics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participation_status VARCHAR(50) DEFAULT 'registered', -- 'registered', 'attended', 'completed', 'no_show'
    attendance_date DATE,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 10),
    feedback_comments TEXT,
    knowledge_gained TEXT[],
    action_items TEXT[],
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. SUCCESS INDICATORS AND KPI MONITORING
CREATE TABLE IF NOT EXISTS success_indicators (
    id SERIAL PRIMARY KEY,
    indicator_name VARCHAR(200) NOT NULL,
    indicator_description TEXT NOT NULL,
    indicator_domain VARCHAR(100) NOT NULL, -- 'sleep', 'hydration', 'injuries', 'sprint_speed', 'team_chemistry', 'cognitive'
    target_value DECIMAL(8,2),
    target_unit VARCHAR(50),
    baseline_value DECIMAL(8,2),
    current_value DECIMAL(8,2),
    improvement_target_percentage DECIMAL(5,2),
    measurement_frequency VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'
    measurement_tool VARCHAR(200) NOT NULL,
    verification_method TEXT NOT NULL,
    priority_level VARCHAR(20) CHECK (priority_level IN ('critical', 'high', 'medium', 'low')),
    indicator_status VARCHAR(50) DEFAULT 'active', -- 'active', 'monitoring', 'achieved', 'modified'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. KPI MEASUREMENT LOGS
CREATE TABLE IF NOT EXISTS kpi_measurement_logs (
    id SERIAL PRIMARY KEY,
    indicator_id INTEGER NOT NULL REFERENCES success_indicators(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    measurement_date DATE NOT NULL,
    measured_value DECIMAL(8,2) NOT NULL,
    measurement_notes TEXT,
    measurement_method VARCHAR(100),
    measurement_accuracy VARCHAR(50), -- 'high', 'medium', 'low'
    external_factors TEXT[],
    improvement_actions TEXT[],
    next_measurement_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. PERFORMANCE PLAN TEMPLATES
CREATE TABLE IF NOT EXISTS performance_plan_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(200) NOT NULL,
    template_description TEXT NOT NULL,
    template_category VARCHAR(100) NOT NULL, -- 'beginner', 'intermediate', 'advanced', 'elite', 'custom'
    target_athlete_type VARCHAR(100) NOT NULL, -- 'recreational', 'competitive', 'elite', 'professional'
    budget_range_min DECIMAL(8,2),
    budget_range_max DECIMAL(8,2),
    timeline_weeks INTEGER NOT NULL,
    core_pillars TEXT[] NOT NULL,
    recommended_resources TEXT[],
    success_metrics TEXT[],
    template_status VARCHAR(50) DEFAULT 'active', -- 'draft', 'active', 'archived', 'deprecated'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. PERSONALIZED PERFORMANCE PLANS
CREATE TABLE IF NOT EXISTS personalized_performance_plans (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES performance_plan_templates(id),
    plan_name VARCHAR(200) NOT NULL,
    plan_description TEXT NOT NULL,
    plan_start_date DATE NOT NULL,
    plan_end_date DATE NOT NULL,
    total_budget DECIMAL(8,2) NOT NULL,
    current_spending DECIMAL(8,2) DEFAULT 0,
    plan_status VARCHAR(50) DEFAULT 'active', -- 'draft', 'active', 'paused', 'completed', 'cancelled'
    customization_notes TEXT[],
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    next_review_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. PLAN COMPONENTS AND RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS plan_components (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL REFERENCES personalized_performance_plans(id) ON DELETE CASCADE,
    component_name VARCHAR(200) NOT NULL,
    component_type VARCHAR(100) NOT NULL, -- 'training', 'nutrition', 'recovery', 'equipment', 'service'
    component_description TEXT NOT NULL,
    estimated_cost DECIMAL(8,2) NOT NULL,
    priority_level VARCHAR(20) CHECK (priority_level IN ('critical', 'high', 'medium', 'low')),
    implementation_order INTEGER NOT NULL,
    duration_weeks INTEGER,
    success_criteria TEXT[],
    component_status VARCHAR(50) DEFAULT 'planned', -- 'planned', 'in_progress', 'completed', 'skipped'
    start_date DATE,
    completion_date DATE,
    actual_cost DECIMAL(8,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. COMPREHENSIVE PERFORMANCE DASHBOARD
CREATE TABLE IF NOT EXISTS performance_dashboards (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dashboard_name VARCHAR(200) NOT NULL,
    dashboard_type VARCHAR(100) NOT NULL, -- 'overview', 'detailed', 'focused', 'custom'
    dashboard_config JSONB NOT NULL, -- configuration for widgets and layout
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    refresh_frequency VARCHAR(50) DEFAULT 'daily', -- 'real_time', 'hourly', 'daily', 'weekly'
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_implementation_steps_user_category ON implementation_steps(user_id, step_category);
CREATE INDEX IF NOT EXISTS idx_implementation_steps_status ON implementation_steps(step_status);
CREATE INDEX IF NOT EXISTS idx_baseline_testing_user_type ON baseline_testing_sessions(user_id, test_type);
CREATE INDEX IF NOT EXISTS idx_baseline_testing_date ON baseline_testing_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_education_clinics_topic_type ON education_clinics(clinic_topic, clinic_type);
CREATE INDEX IF NOT EXISTS idx_education_clinics_date ON education_clinics(clinic_date);
CREATE INDEX IF NOT EXISTS idx_clinic_participations_clinic ON clinic_participations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_participations_user ON clinic_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_success_indicators_domain ON success_indicators(indicator_domain);
CREATE INDEX IF NOT EXISTS idx_kpi_measurement_indicator_date ON kpi_measurement_logs(indicator_id, measurement_date);
CREATE INDEX IF NOT EXISTS idx_performance_plan_templates_category ON performance_plan_templates(template_category);
CREATE INDEX IF NOT EXISTS idx_personalized_plans_user ON personalized_performance_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_components_plan ON plan_components(plan_id);
CREATE INDEX IF NOT EXISTS idx_performance_dashboards_user ON performance_dashboards(user_id);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_implementation_steps_unique ON implementation_steps(user_id, step_name, step_category);
CREATE UNIQUE INDEX IF NOT EXISTS idx_baseline_testing_unique ON baseline_testing_sessions(user_id, test_type, test_name, session_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clinic_participations_unique ON clinic_participations(clinic_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kpi_measurement_unique ON kpi_measurement_logs(indicator_id, user_id, measurement_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_plan_components_unique ON plan_components(plan_id, component_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_performance_dashboards_default ON performance_dashboards(user_id, is_default) WHERE is_default = true;

-- Insert sample implementation steps for the first 30 days
INSERT INTO implementation_steps (user_id, step_name, step_description, step_category, step_order, estimated_duration_days, dependencies, required_resources, success_criteria) VALUES
('f31b59e5-8a73-4afb-a444-f80b728a8a54', 'Baseline Testing', 'Complete comprehensive baseline testing for body composition, sprint time, HRV, and FMS screen', 'baseline_testing', 1, 3, ARRAY[]::text[], ARRAY['testing_equipment', 'qualified_tester'], ARRAY['all_tests_completed', 'baseline_data_recorded', 'testing_report_generated']),
('f31b59e5-8a73-4afb-a444-f80b728a8a54', 'Budget Allocation', 'Pre-pay core technology and secure shared resources', 'budget_allocation', 2, 2, ARRAY['Baseline Testing'], ARRAY['financial_resources', 'budget_plan'], ARRAY['core_tech_purchased', 'shared_resources_secured', 'budget_tracking_setup']),
('f31b59e5-8a73-4afb-a444-f80b728a8a54', 'Personalized Plan Build', 'Create vegan vs. omnivore nutrition templates and individual supplement checklists', 'plan_building', 3, 5, ARRAY['Baseline Testing'], ARRAY['nutrition_expertise', 'supplement_knowledge'], ARRAY['nutrition_templates_created', 'supplement_checklists_completed', 'plan_personalized']),
('f31b59e5-8a73-4afb-a444-f80b728a8a54', 'Education Blitz', 'Four 60-minute clinics on sleep, nutrition, training, and recovery', 'education', 4, 7, ARRAY['Personalized Plan Build'], ARRAY['expert_presenters', 'facility_equipment'], ARRAY['clinics_delivered', 'recordings_created', 'materials_distributed']),
('f31b59e5-8a73-4afb-a444-f80b728a8a54', 'Accountability Groups', 'Form 8-10 athlete mentor coach groups with weekly check-ins', 'accountability', 5, 3, ARRAY['Education Blitz'], ARRAY['mentor_coaches', 'group_platforms'], ARRAY['groups_formed', 'check_in_schedule_set', 'mentorship_relationships_established']),
('f31b59e5-8a73-4afb-a444-f80b728a8a54', 'Data Dashboard Launch', 'Launch simple tracking system for sleep, load, soreness, and hydration', 'dashboard', 6, 2, ARRAY['Accountability Groups'], ARRAY['dashboard_platform', 'data_tracking_tools'], ARRAY['dashboard_launched', 'users_trained', 'data_collection_started']);

-- Insert sample success indicators based on the performance plan
INSERT INTO success_indicators (indicator_name, indicator_description, indicator_domain, target_value, target_unit, improvement_target_percentage, measurement_frequency, measurement_tool, verification_method, priority_level) VALUES
('Sleep Duration', 'Average nightly sleep duration in hours', 'sleep', 8.0, 'hours', 10.0, 'daily', 'Smart ring/watch', 'Smart-ring export data analysis', 'critical'),
('HRV Improvement', 'Heart rate variability improvement percentage', 'sleep', 10.0, 'percent', 10.0, 'daily', 'Smart ring/watch', 'Smart-ring export data analysis', 'critical'),
('Urine Color', 'Hydration status based on urine color (1-8 scale)', 'hydration', 3.0, 'scale', 0.0, 'daily', 'Hydration color chart', 'Game-day weigh-in and urine analysis', 'critical'),
('Body Mass Loss', 'Maximum body mass loss during training', 'hydration', 2.0, 'percent', 0.0, 'daily', 'Digital scale', 'Game-day weigh-in protocol', 'critical'),
('Injury Days Missed', 'Days missed due to injuries per 100 athlete-days', 'injuries', 5.0, 'days', -20.0, 'monthly', 'Physio log', 'Physio log analysis and reporting', 'high'),
('Flying 10m Sprint', 'Sprint speed improvement after 12 weeks', 'sprint_speed', 3.0, 'percent', 3.0, 'quarterly', 'Timing gates/GPS', 'Timing gates or GPS measurement', 'high'),
('Passing Completion', 'Team passing completion rate improvement', 'team_chemistry', 6.0, 'percent', 6.0, 'weekly', 'Stat sheet', 'Game statistics analysis', 'medium'),
('Drop Count Reduction', 'Reduction in dropped passes', 'team_chemistry', 10.0, 'percent', 10.0, 'weekly', 'Stat sheet', 'Game statistics analysis', 'medium'),
('Stroop Accuracy', 'Cognitive response accuracy improvement', 'cognitive', 5.0, 'percent', 5.0, 'weekly', 'App analytics', 'Cognitive training app data', 'medium'),
('Reaction Time', 'Cognitive response time improvement', 'cognitive', 8.0, 'percent', 8.0, 'weekly', 'App analytics', 'Cognitive training app data', 'medium');

-- Insert sample performance plan templates
INSERT INTO performance_plan_templates (template_name, template_description, template_category, target_athlete_type, budget_range_min, budget_range_max, timeline_weeks, core_pillars, recommended_resources, success_metrics) VALUES
('Amateur Performance Foundation', 'Comprehensive performance plan for amateur flag football players with €5,000-€10,000 budget', 'intermediate', 'competitive', 5000.00, 10000.00, 52, ARRAY['sleep_recovery', 'nutrition_meal_prep', 'training_coaching', 'preventive_medical', 'sport_science', 'supplements', 'competition_travel'], ARRAY['smart_ring_watch', 'high_end_mattress', 'compression_boots', 'gps_tracker', 'heart_rate_monitor'], ARRAY['sleep_improvement', 'strength_gains', 'injury_reduction', 'performance_improvement']),
('Elite Performance Optimization', 'Advanced performance plan for elite flag football players with €15,000-€25,000 budget', 'advanced', 'elite', 15000.00, 25000.00, 52, ARRAY['advanced_recovery', 'premium_nutrition', 'elite_coaching', 'comprehensive_medical', 'advanced_analytics', 'premium_supplements', 'international_travel'], ARRAY['cryo_sauna', 'hyperbaric_chamber', 'personal_chef', 'biomechanical_analysis'], ARRAY['elite_performance', 'international_competition', 'professional_development']),
('Recreational Performance Starter', 'Basic performance plan for recreational flag football players with €2,000-€5,000 budget', 'beginner', 'recreational', 2000.00, 5000.00, 26, ARRAY['basic_recovery', 'nutrition_basics', 'fundamental_training', 'basic_health', 'simple_tracking'], ARRAY['basic_sleep_tracker', 'foam_roller', 'protein_powder', 'simple_apps'], ARRAY['basic_fitness', 'injury_prevention', 'enjoyment_improvement']);

-- Create function to generate implementation roadmap
CREATE OR REPLACE FUNCTION generate_implementation_roadmap(
    user_id_param UUID,
    plan_start_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB AS $$
DECLARE
    roadmap_data JSONB;
    step_record RECORD;
    total_duration INTEGER := 0;
    calc_date DATE := plan_start_date;
BEGIN
    roadmap_data := '[]'::jsonb;
    
    -- Get implementation steps ordered by step_order
    FOR step_record IN 
        SELECT 
            step_name,
            step_description,
            step_category,
            step_order,
            estimated_duration_days,
            dependencies,
            required_resources,
            success_criteria
        FROM implementation_steps
        WHERE user_id = user_id_param
        ORDER BY step_order
    LOOP
        -- Calculate start and end dates
        calc_date := calc_date + INTERVAL '1 day' * total_duration;
        total_duration := total_duration + step_record.estimated_duration_days;
        
        -- Build step data
        roadmap_data := roadmap_data || jsonb_build_object(
            'step_name', step_record.step_name,
            'step_description', step_record.step_description,
            'step_category', step_record.step_category,
            'step_order', step_record.step_order,
            'estimated_duration_days', step_record.estimated_duration_days,
            'start_date', calc_date,
            'end_date', calc_date + INTERVAL '1 day' * step_record.estimated_duration_days,
            'dependencies', step_record.dependencies,
            'required_resources', step_record.required_resources,
            'success_criteria', step_record.success_criteria,
            'milestone_description', 'Complete ' || LOWER(step_record.step_name)
        );
    END LOOP;
    
    RETURN jsonb_build_object(
        'user_id', user_id_param,
        'plan_start_date', plan_start_date,
        'total_estimated_duration_days', total_duration,
        'estimated_completion_date', plan_start_date + INTERVAL '1 day' * total_duration,
        'implementation_steps', roadmap_data,
        'recommendations', ARRAY[
            'Start with baseline testing to establish current status',
            'Secure budget and resources before beginning implementation',
            'Build accountability groups early for ongoing support',
            'Launch data dashboard to track progress from day one'
        ]
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate comprehensive performance score
CREATE OR REPLACE FUNCTION calculate_comprehensive_performance_score(
    user_id_param UUID,
    assessment_period_days INTEGER DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
    performance_data JSONB;
    sleep_score DECIMAL := 0;
    hydration_score DECIMAL := 0;
    injury_score DECIMAL := 0;
    performance_score DECIMAL := 0;
    team_score DECIMAL := 0;
    cognitive_score DECIMAL := 0;
    overall_score DECIMAL := 0;
    assessment_date DATE := CURRENT_DATE;
BEGIN
    -- Calculate sleep score (25% weight)
    SELECT 
        CASE 
            WHEN AVG(total_sleep_hours) >= 8.0 THEN 100
            WHEN AVG(total_sleep_hours) >= 7.5 THEN 85
            WHEN AVG(total_sleep_hours) >= 7.0 THEN 70
            WHEN AVG(total_sleep_hours) >= 6.5 THEN 55
            ELSE 40
        END
    INTO sleep_score
    FROM sleep_logs
    WHERE user_id = user_id_param
    AND sleep_date >= assessment_date - INTERVAL '1 day' * assessment_period_days;
    
    -- Calculate hydration score (20% weight)
    SELECT 
        CASE 
            WHEN AVG(urine_color) <= 3 THEN 100
            WHEN AVG(urine_color) <= 4 THEN 80
            WHEN AVG(urine_color) <= 5 THEN 60
            WHEN AVG(urine_color) <= 6 THEN 40
            ELSE 20
        END
    INTO hydration_score
    FROM hydration_logs
    WHERE user_id = user_id_param
    AND log_date >= assessment_date - INTERVAL '1 day' * assessment_period_days;
    
    -- Calculate injury score (15% weight)
    SELECT 
        CASE 
            WHEN COUNT(*) = 0 THEN 100
            WHEN COUNT(*) <= 2 THEN 80
            WHEN COUNT(*) <= 5 THEN 60
            WHEN COUNT(*) <= 10 THEN 40
            ELSE 20
        END
    INTO injury_score
    FROM injury_events
    WHERE user_id = user_id_param
    AND injury_date >= assessment_date - INTERVAL '1 day' * assessment_period_days;
    
    -- Calculate performance score (20% weight)
    SELECT 
        CASE 
            WHEN AVG(performance_rating) >= 8.0 THEN 100
            WHEN AVG(performance_rating) >= 7.0 THEN 85
            WHEN AVG(performance_rating) >= 6.0 THEN 70
            WHEN AVG(performance_rating) >= 5.0 THEN 55
            ELSE 40
        END
    INTO performance_score
    FROM training_sessions
    WHERE user_id = user_id_param
    AND session_date >= assessment_date - INTERVAL '1 day' * assessment_period_days;
    
    -- Calculate team score (10% weight)
    SELECT 
        CASE 
            WHEN AVG(team_chemistry_score) >= 8.0 THEN 100
            WHEN AVG(team_chemistry_score) >= 7.0 THEN 85
            WHEN AVG(team_chemistry_score) >= 6.0 THEN 70
            WHEN AVG(team_chemistry_score) >= 5.0 THEN 55
            ELSE 40
        END
    INTO team_score
    FROM team_chemistry_metrics
    WHERE user_id = user_id_param
    AND metric_date >= assessment_date - INTERVAL '1 day' * assessment_period_days;
    
    -- Calculate cognitive score (10% weight)
    SELECT 
        CASE 
            WHEN AVG(cognitive_load_score) <= 3.0 THEN 100
            WHEN AVG(cognitive_load_score) <= 4.0 THEN 85
            WHEN AVG(cognitive_load_score) <= 5.0 THEN 70
            WHEN AVG(cognitive_load_score) <= 6.0 THEN 55
            ELSE 40
        END
    INTO cognitive_score
    FROM cognitive_load_scores
    WHERE user_id = user_id_param
    AND assessment_date >= assessment_date - INTERVAL '1 day' * assessment_period_days;
    
    -- Calculate overall weighted score
    overall_score := (sleep_score * 0.25) + (hydration_score * 0.20) + (injury_score * 0.15) + 
                    (performance_score * 0.20) + (team_score * 0.10) + (cognitive_score * 0.10);
    
    -- Build performance data
    performance_data := jsonb_build_object(
        'user_id', user_id_param,
        'assessment_period_days', assessment_period_days,
        'assessment_date', assessment_date,
        'component_scores', jsonb_build_object(
            'sleep_score', sleep_score,
            'hydration_score', hydration_score,
            'injury_score', injury_score,
            'performance_score', performance_score,
            'team_score', team_score,
            'cognitive_score', cognitive_score
        ),
        'overall_performance_score', overall_score,
        'performance_rating', CASE 
            WHEN overall_score >= 90 THEN 'excellent'
            WHEN overall_score >= 80 THEN 'very_good'
            WHEN overall_score >= 70 THEN 'good'
            WHEN overall_score >= 60 THEN 'fair'
            ELSE 'needs_improvement'
        END,
        'recommendations', ARRAY[
            'Focus on sleep optimization for maximum recovery',
            'Maintain consistent hydration throughout the day',
            'Continue injury prevention protocols',
            'Monitor performance trends for improvement opportunities'
        ]
    );
    
    RETURN performance_data;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_implementation_steps_updated_at 
    BEFORE UPDATE ON implementation_steps 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_baseline_testing_sessions_updated_at 
    BEFORE UPDATE ON baseline_testing_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_clinics_updated_at 
    BEFORE UPDATE ON education_clinics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinic_participations_updated_at 
    BEFORE UPDATE ON clinic_participations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_success_indicators_updated_at 
    BEFORE UPDATE ON success_indicators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_plan_templates_updated_at 
    BEFORE UPDATE ON performance_plan_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personalized_performance_plans_updated_at 
    BEFORE UPDATE ON personalized_performance_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_components_updated_at 
    BEFORE UPDATE ON plan_components 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_dashboards_updated_at 
    BEFORE UPDATE ON performance_dashboards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE implementation_steps IS 'Step-by-step implementation tracking for performance plan';
COMMENT ON TABLE baseline_testing_sessions IS 'Comprehensive baseline testing and assessment framework';
COMMENT ON TABLE education_clinics IS 'Education and clinic management system for performance knowledge';
COMMENT ON TABLE clinic_participations IS 'User participation and feedback for education clinics';
COMMENT ON TABLE success_indicators IS 'Success indicators and KPI definitions for performance monitoring';
COMMENT ON TABLE kpi_measurement_logs IS 'KPI measurement tracking and historical data';
COMMENT ON TABLE performance_plan_templates IS 'Standardized performance plan templates for different athlete types';
COMMENT ON TABLE personalized_performance_plans IS 'Individualized performance plans based on templates';
COMMENT ON TABLE plan_components IS 'Individual components within personalized performance plans';
COMMENT ON TABLE performance_dashboards IS 'Comprehensive performance dashboards for monitoring and analysis';
COMMENT ON FUNCTION generate_implementation_roadmap IS 'Generate comprehensive implementation roadmap for user';
COMMENT ON FUNCTION calculate_comprehensive_performance_score IS 'Calculate comprehensive performance score across all domains';

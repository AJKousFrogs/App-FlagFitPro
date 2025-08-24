-- Migration: Longitudinal Performance Analytics
-- This migration adds comprehensive performance tracking, benchmarking, and forecasting systems

-- 1. SEASON METRICS AND PERFORMANCE TRACKING
CREATE TABLE IF NOT EXISTS season_metrics (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    season_id VARCHAR(100) NOT NULL, -- '2024_spring', '2024_fall', '2025_winter'
    season_name VARCHAR(200) NOT NULL,
    season_start_date DATE NOT NULL,
    season_end_date DATE NOT NULL,
    metric_category VARCHAR(100) NOT NULL, -- 'physical', 'technical', 'tactical', 'cognitive', 'recovery'
    metric_name VARCHAR(200) NOT NULL, -- 'sprint_speed', 'agility', 'passing_accuracy', 'decision_speed'
    metric_value DECIMAL(10,4) NOT NULL,
    metric_unit VARCHAR(50), -- 'seconds', 'meters', 'percentage', 'score'
    measurement_date DATE NOT NULL,
    measurement_context VARCHAR(100), -- 'training', 'competition', 'assessment', 'recovery'
    measurement_method VARCHAR(100), -- 'electronic_timing', 'manual_assessment', 'wearable_device', 'coach_rating'
    baseline_value DECIMAL(10,4), -- pre-season baseline
    target_value DECIMAL(10,4), -- season goal
    z_score DECIMAL(5,2), -- standardized score vs peer group
    percentile_rank INTEGER CHECK (percentile_rank >= 1 AND percentile_rank <= 100),
    improvement_percentage DECIMAL(5,2), -- change from baseline
    trend_direction VARCHAR(20), -- 'improving', 'declining', 'stable', 'fluctuating'
    confidence_interval_lower DECIMAL(10,4),
    confidence_interval_upper DECIMAL(10,4),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BENCHMARK TABLES AND PEER COMPARISONS
CREATE TABLE IF NOT EXISTS benchmark_tables (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(200) NOT NULL,
    metric_category VARCHAR(100) NOT NULL,
    age_group VARCHAR(50) NOT NULL, -- 'u16', 'u19', 'u23', 'senior', 'masters'
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('male', 'female', 'mixed')),
    position VARCHAR(100), -- specific flag football positions
    competition_level VARCHAR(50), -- 'recreational', 'competitive', 'elite', 'professional'
    sample_size INTEGER NOT NULL,
    percentile_5 DECIMAL(10,4),
    percentile_10 DECIMAL(10,4),
    percentile_25 DECIMAL(10,4),
    percentile_50 DECIMAL(10,4), -- median
    percentile_75 DECIMAL(10,4),
    percentile_90 DECIMAL(10,4),
    percentile_95 DECIMAL(10,4),
    mean_value DECIMAL(10,4),
    standard_deviation DECIMAL(10,4),
    coefficient_of_variation DECIMAL(5,2),
    benchmark_date DATE NOT NULL,
    data_source VARCHAR(200), -- source of benchmark data
    methodology TEXT, -- how benchmarks were calculated
    last_updated DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PERFORMANCE TREND ANALYSIS
CREATE TABLE IF NOT EXISTS performance_trends (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_name VARCHAR(200) NOT NULL,
    analysis_period VARCHAR(50) NOT NULL, -- 'weekly', 'monthly', 'seasonal', 'annual'
    trend_start_date DATE NOT NULL,
    trend_end_date DATE NOT NULL,
    data_points_count INTEGER NOT NULL,
    linear_regression_slope DECIMAL(10,6), -- rate of change
    linear_regression_intercept DECIMAL(10,6),
    r_squared_value DECIMAL(5,4), -- goodness of fit
    trend_strength VARCHAR(50), -- 'strong', 'moderate', 'weak', 'none'
    trend_direction VARCHAR(20), -- 'improving', 'declining', 'stable'
    predicted_value_30_days DECIMAL(10,4),
    predicted_value_90_days DECIMAL(10,4),
    confidence_level DECIMAL(3,2) CHECK (confidence_level >= 0 AND confidence_level <= 1),
    seasonal_patterns JSONB, -- seasonal variations identified
    cyclical_patterns JSONB, -- weekly/monthly cycles
    outlier_dates DATE[], -- dates with unusual performance
    trend_breakpoints JSONB, -- significant changes in trend
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PERFORMANCE FORECASTING MODELS
CREATE TABLE IF NOT EXISTS performance_forecasts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL,
    target_date DATE NOT NULL,
    metric_name VARCHAR(200) NOT NULL,
    forecasted_value DECIMAL(10,4) NOT NULL,
    confidence_interval_lower DECIMAL(10,4),
    confidence_interval_upper DECIMAL(10,4),
    forecast_method VARCHAR(100), -- 'linear_regression', 'time_series', 'ml_model', 'ensemble'
    model_accuracy DECIMAL(5,4), -- historical accuracy of the model
    forecast_confidence DECIMAL(3,2) CHECK (forecast_confidence >= 0 AND forecast_confidence <= 1),
    influencing_factors JSONB, -- factors that influenced the forecast
    risk_factors TEXT[], -- factors that could affect forecast accuracy
    recommended_actions TEXT[], -- actions to optimize performance
    forecast_review_date DATE, -- when to review forecast accuracy
    actual_value DECIMAL(10,4), -- actual value when available
    forecast_error DECIMAL(10,4), -- difference between forecasted and actual
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PERFORMANCE CORRELATIONS AND INSIGHTS
CREATE TABLE IF NOT EXISTS performance_correlations (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    correlation_date DATE NOT NULL,
    primary_metric VARCHAR(200) NOT NULL,
    secondary_metric VARCHAR(200) NOT NULL,
    correlation_coefficient DECIMAL(3,2) CHECK (correlation_coefficient >= -1 AND correlation_coefficient <= 1),
    correlation_strength VARCHAR(50), -- 'strong', 'moderate', 'weak', 'none'
    correlation_direction VARCHAR(20), -- 'positive', 'negative', 'none'
    sample_size INTEGER NOT NULL,
    study_period_days INTEGER NOT NULL,
    statistical_significance BOOLEAN DEFAULT false,
    p_value DECIMAL(10,6),
    practical_significance TEXT, -- interpretation of the correlation
    causal_relationship_hypothesis TEXT, -- potential cause-effect relationship
    confounding_variables TEXT[], -- other factors that might influence correlation
    recommendations TEXT[], -- actionable insights
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. PERFORMANCE ALERTS AND NOTIFICATIONS
CREATE TABLE IF NOT EXISTS performance_alerts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_date DATE NOT NULL,
    alert_type VARCHAR(100) NOT NULL, -- 'performance_decline', 'injury_risk', 'overtraining', 'improvement_opportunity'
    alert_severity VARCHAR(50) NOT NULL CHECK (alert_severity IN ('low', 'medium', 'high', 'critical')),
    metric_name VARCHAR(200) NOT NULL,
    current_value DECIMAL(10,4),
    threshold_value DECIMAL(10,4),
    threshold_type VARCHAR(50), -- 'below_target', 'above_target', 'trend_decline', 'anomaly'
    alert_message TEXT NOT NULL,
    alert_description TEXT,
    recommended_actions TEXT[],
    alert_status VARCHAR(50) DEFAULT 'active' CHECK (alert_status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_date TIMESTAMP WITH TIME ZONE,
    resolved_date TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. PERFORMANCE COMPETENCY FRAMEWORKS
CREATE TABLE IF NOT EXISTS performance_competencies (
    id SERIAL PRIMARY KEY,
    competency_name VARCHAR(200) NOT NULL,
    competency_category VARCHAR(100) NOT NULL, -- 'physical', 'technical', 'tactical', 'mental', 'social'
    competency_description TEXT NOT NULL,
    position_specific BOOLEAN DEFAULT false,
    applicable_positions TEXT[], -- flag football positions where this competency applies
    competency_levels JSONB, -- beginner, intermediate, advanced, elite criteria
    assessment_methods TEXT[], -- how to measure this competency
    development_activities TEXT[], -- activities to improve this competency
    benchmark_standards JSONB, -- performance standards for each level
    evidence_level VARCHAR(50) CHECK (evidence_level IN ('very_high', 'high', 'medium', 'low')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. INDIVIDUAL COMPETENCY ASSESSMENTS
CREATE TABLE IF NOT EXISTS competency_assessments (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    competency_id INTEGER NOT NULL REFERENCES performance_competencies(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,
    assessed_by UUID REFERENCES users(id), -- coach, trainer, or self-assessment
    assessment_method VARCHAR(100), -- 'observation', 'testing', 'performance_analysis', 'peer_review'
    competency_level VARCHAR(50) NOT NULL, -- 'beginner', 'intermediate', 'advanced', 'elite'
    level_score DECIMAL(3,2) CHECK (level_score >= 0 AND level_score <= 1), -- progress within level
    assessment_notes TEXT,
    strengths_identified TEXT[],
    areas_for_improvement TEXT[],
    development_plan TEXT,
    next_assessment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_season_metrics_user_season ON season_metrics(user_id, season_id);
CREATE INDEX IF NOT EXISTS idx_season_metrics_metric_date ON season_metrics(metric_name, measurement_date);
CREATE INDEX IF NOT EXISTS idx_season_metrics_z_score ON season_metrics(z_score);
CREATE INDEX IF NOT EXISTS idx_benchmark_tables_metric ON benchmark_tables(metric_name, age_group, gender);
CREATE INDEX IF NOT EXISTS idx_benchmark_tables_position ON benchmark_tables(position, competition_level);
CREATE INDEX IF NOT EXISTS idx_performance_trends_user ON performance_trends(user_id, metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_trends_period ON performance_trends(analysis_period, trend_end_date);
CREATE INDEX IF NOT EXISTS idx_performance_forecasts_user ON performance_forecasts(user_id, target_date);
CREATE INDEX IF NOT EXISTS idx_performance_correlations_user ON performance_correlations(user_id, primary_metric);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_user ON performance_alerts(user_id, alert_status);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_severity ON performance_alerts(alert_severity, alert_date);
CREATE INDEX IF NOT EXISTS idx_competency_assessments_user ON competency_assessments(user_id, competency_id);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_season_metrics_unique ON season_metrics(user_id, season_id, metric_name, measurement_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_benchmark_tables_unique ON benchmark_tables(metric_name, age_group, gender, position, competition_level);
CREATE UNIQUE INDEX IF NOT EXISTS idx_performance_trends_unique ON performance_trends(user_id, metric_name, analysis_period, trend_end_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_performance_forecasts_unique ON performance_forecasts(user_id, metric_name, target_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_performance_correlations_unique ON performance_correlations(user_id, primary_metric, secondary_metric);
CREATE UNIQUE INDEX IF NOT EXISTS idx_competency_assessments_unique ON competency_assessments(user_id, competency_id, assessment_date);

-- Insert sample benchmark data for flag football
INSERT INTO benchmark_tables (metric_name, metric_category, age_group, gender, position, competition_level, sample_size, percentile_5, percentile_10, percentile_25, percentile_50, percentile_75, percentile_90, percentile_95, mean_value, standard_deviation, benchmark_date, data_source, methodology) VALUES
('40_yard_dash', 'physical', 'senior', 'male', 'all', 'elite', 500, 4.8, 5.0, 5.2, 5.5, 5.8, 6.1, 6.3, 5.52, 0.35, '2025-01-01', 'IFAF_Elite_Athlete_Database', 'Electronic timing, standardized conditions'),
('40_yard_dash', 'physical', 'senior', 'female', 'all', 'elite', 300, 5.2, 5.4, 5.6, 5.9, 6.2, 6.5, 6.7, 5.95, 0.38, '2025-01-01', 'IFAF_Elite_Athlete_Database', 'Electronic timing, standardized conditions'),
('vertical_jump', 'physical', 'senior', 'male', 'all', 'elite', 500, 24, 26, 28, 32, 36, 40, 42, 32.1, 4.8, '2025-01-01', 'IFAF_Elite_Athlete_Database', 'Vertec measurement, standardized protocol'),
('vertical_jump', 'physical', 'senior', 'female', 'all', 'elite', 300, 20, 22, 24, 28, 32, 36, 38, 28.2, 4.2, '2025-01-01', 'IFAF_Elite_Athlete_Database', 'Vertec measurement, standardized protocol'),
('agility_t_test', 'physical', 'senior', 'male', 'all', 'elite', 500, 8.5, 8.8, 9.2, 9.8, 10.4, 11.0, 11.5, 9.85, 0.85, '2025-01-01', 'IFAF_Elite_Athlete_Database', 'Electronic timing, standardized course'),
('agility_t_test', 'physical', 'senior', 'female', 'all', 'elite', 300, 9.0, 9.3, 9.7, 10.3, 10.9, 11.5, 12.0, 10.35, 0.90, '2025-01-01', 'IFAF_Elite_Athlete_Database', 'Electronic timing, standardized course');

-- Insert sample performance competencies
INSERT INTO performance_competencies (competency_name, competency_category, competency_description, position_specific, applicable_positions, competency_levels, assessment_methods, development_activities, evidence_level) VALUES
('Route Running Precision', 'technical', 'Ability to execute precise routes with proper timing and spacing', true, ARRAY['receiver', 'tight_end'], '{"beginner": "Basic route understanding", "intermediate": "Consistent route execution", "advanced": "Precise timing and spacing", "elite": "Exceptional route mastery with deception"}', ARRAY['video_analysis', 'coach_observation', 'timing_measurements'], ARRAY['route_drills', 'timing_work', 'film_study'], 'high'),

('Pass Rush Technique', 'technical', 'Effective pass rushing with proper hand placement and leverage', true, ARRAY['defensive_end', 'linebacker'], '{"beginner": "Basic pass rush moves", "intermediate": "Multiple move repertoire", "advanced": "Counter move effectiveness", "elite": "Elite pass rush dominance"}', ARRAY['coach_evaluation', 'success_rate_analysis', 'opponent_feedback'], ARRAY['pass_rush_drills', 'hand_fighting_practice', 'film_study'], 'high'),

('Decision Making Speed', 'cognitive', 'Quick and accurate decision making under pressure', false, ARRAY['quarterback', 'safety', 'linebacker'], '{"beginner": "Basic decision making", "intermediate": "Quick decisions", "advanced": "Fast accurate decisions", "elite": "Exceptional decision speed and accuracy"}', ARRAY['cognitive_testing', 'game_situation_analysis', 'reaction_time_tests'], ARRAY['cognitive_training', 'situation_practice', 'pressure_simulation'], 'high'),

('Team Chemistry', 'social', 'Ability to work effectively with teammates and build cohesion', false, ARRAY['all'], '{"beginner": "Basic teamwork", "intermediate": "Good communication", "advanced": "Strong leadership", "elite": "Exceptional team building"}', ARRAY['peer_evaluations', 'coach_observations', 'team_surveys'], ARRAY['team_building_activities', 'communication_practice', 'leadership_development'], 'medium');

-- Create function to calculate z-scores
CREATE OR REPLACE FUNCTION calculate_performance_z_score(
    user_id_param UUID,
    metric_name_param VARCHAR,
    metric_value_param DECIMAL,
    age_group_param VARCHAR DEFAULT 'senior',
    gender_param VARCHAR DEFAULT 'male',
    position_param VARCHAR DEFAULT 'all',
    competition_level_param VARCHAR DEFAULT 'elite'
) RETURNS JSONB AS $$
DECLARE
    benchmark_record RECORD;
    z_score DECIMAL;
    percentile_rank INTEGER;
    performance_level VARCHAR;
    recommendations TEXT[];
BEGIN
    -- Get benchmark data
    SELECT 
        mean_value,
        standard_deviation,
        percentile_5,
        percentile_10,
        percentile_25,
        percentile_50,
        percentile_75,
        percentile_90,
        percentile_95
    INTO benchmark_record
    FROM benchmark_tables 
    WHERE metric_name = metric_name_param
    AND age_group = age_group_param
    AND gender = gender_param
    AND (position = position_param OR position = 'all')
    AND competition_level = competition_level_param
    ORDER BY position = position_param DESC, position = 'all' DESC
    LIMIT 1;
    
    -- Calculate z-score
    IF benchmark_record.standard_deviation > 0 THEN
        z_score := (metric_value_param - benchmark_record.mean_value) / benchmark_record.standard_deviation;
    ELSE
        z_score := 0;
    END IF;
    
    -- Calculate percentile rank
    IF metric_value_param <= benchmark_record.percentile_5 THEN
        percentile_rank := 5;
    ELSIF metric_value_param <= benchmark_record.percentile_10 THEN
        percentile_rank := 10;
    ELSIF metric_value_param <= benchmark_record.percentile_25 THEN
        percentile_rank := 25;
    ELSIF metric_value_param <= benchmark_record.percentile_50 THEN
        percentile_rank := 50;
    ELSIF metric_value_param <= benchmark_record.percentile_75 THEN
        percentile_rank := 75;
    ELSIF metric_value_param <= benchmark_record.percentile_90 THEN
        percentile_rank := 90;
    ELSIF metric_value_param <= benchmark_record.percentile_95 THEN
        percentile_rank := 95;
    ELSE
        percentile_rank := 100;
    END IF;
    
    -- Determine performance level
    IF z_score >= 2.0 THEN
        performance_level := 'exceptional';
    ELSIF z_score >= 1.0 THEN
        performance_level := 'above_average';
    ELSIF z_score >= -1.0 THEN
        performance_level := 'average';
    ELSIF z_score >= -2.0 THEN
        performance_level := 'below_average';
    ELSE
        performance_level := 'needs_improvement';
    END IF;
    
    -- Generate recommendations
    IF performance_level = 'needs_improvement' THEN
        recommendations := ARRAY[
            'Focus on fundamental technique',
            'Increase training frequency',
            'Consider specialized coaching',
            'Set incremental improvement goals'
        ];
    ELSIF performance_level = 'below_average' THEN
        recommendations := ARRAY[
            'Targeted skill development',
            'Regular practice sessions',
            'Performance monitoring',
            'Coach feedback integration'
        ];
    ELSIF performance_level = 'average' THEN
        recommendations := ARRAY[
            'Maintain current level',
            'Identify improvement areas',
            'Consistent practice',
            'Performance tracking'
        ];
    ELSIF performance_level = 'above_average' THEN
        recommendations := ARRAY[
            'Advanced skill development',
            'Elite performance goals',
            'Competition preparation',
            'Leadership development'
        ];
    ELSE
        recommendations := ARRAY[
            'Elite performance maintenance',
            'Mentorship opportunities',
            'Advanced competition',
            'Skill refinement'
        ];
    END IF;
    
    RETURN jsonb_build_object(
        'z_score', ROUND(z_score::numeric, 2),
        'percentile_rank', percentile_rank,
        'performance_level', performance_level,
        'benchmark_mean', benchmark_record.mean_value,
        'benchmark_std', benchmark_record.standard_deviation,
        'recommendations', recommendations,
        'benchmark_data', jsonb_build_object(
            'age_group', age_group_param,
            'gender', gender_param,
            'position', position_param,
            'competition_level', competition_level_param
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to forecast performance
CREATE OR REPLACE FUNCTION forecast_performance(
    user_id_param UUID,
    metric_name_param VARCHAR,
    target_date_param DATE DEFAULT CURRENT_DATE + INTERVAL '30 days',
    forecast_method_param VARCHAR DEFAULT 'linear_regression'
) RETURNS JSONB AS $$
DECLARE
    trend_record RECORD;
    forecasted_value DECIMAL;
    confidence_interval_lower DECIMAL;
    confidence_interval_upper DECIMAL;
    forecast_confidence DECIMAL;
    days_to_target INTEGER;
    trend_strength_factor DECIMAL;
BEGIN
    -- Get recent trend data
    SELECT 
        linear_regression_slope,
        linear_regression_intercept,
        r_squared_value,
        trend_strength,
        data_points_count
    INTO trend_record
    FROM performance_trends 
    WHERE user_id = user_id_param 
    AND metric_name = metric_name_param
    AND analysis_period = 'weekly'
    ORDER BY trend_end_date DESC
    LIMIT 1;
    
    -- Calculate days to target
    days_to_target := EXTRACT(DAY FROM (target_date_param - CURRENT_DATE));
    
    -- Calculate forecasted value using linear regression
    IF trend_record.linear_regression_slope IS NOT NULL THEN
        forecasted_value := trend_record.linear_regression_intercept + (trend_record.linear_regression_slope * (days_to_target / 7.0)); -- convert to weeks
        
        -- Adjust confidence based on trend strength
        IF trend_record.trend_strength = 'strong' THEN
            trend_strength_factor := 0.9;
        ELSIF trend_record.trend_strength = 'moderate' THEN
            trend_strength_factor := 0.7;
        ELSIF trend_record.trend_strength = 'weak' THEN
            trend_strength_factor := 0.5;
        ELSE
            trend_strength_factor := 0.3;
        END IF;
        
        -- Calculate confidence interval
        forecast_confidence := LEAST(0.95, trend_record.r_squared_value * trend_strength_factor);
        confidence_interval_lower := forecasted_value * (1 - (1 - forecast_confidence) * 0.1);
        confidence_interval_upper := forecasted_value * (1 + (1 - forecast_confidence) * 0.1);
    ELSE
        -- No trend data available
        forecasted_value := NULL;
        confidence_interval_lower := NULL;
        confidence_interval_upper := NULL;
        forecast_confidence := 0.0;
    END IF;
    
    RETURN jsonb_build_object(
        'forecasted_value', forecasted_value,
        'confidence_interval_lower', confidence_interval_lower,
        'confidence_interval_upper', confidence_interval_upper,
        'forecast_confidence', forecast_confidence,
        'forecast_method', forecast_method_param,
        'trend_data_quality', jsonb_build_object(
            'r_squared', trend_record.r_squared_value,
            'trend_strength', trend_record.trend_strength,
            'data_points', trend_record.data_points_count
        ),
        'target_date', target_date_param,
        'days_to_target', days_to_target,
        'recommendations', CASE 
            WHEN forecast_confidence >= 0.8 THEN ARRAY['High confidence forecast', 'Plan based on prediction']
            WHEN forecast_confidence >= 0.6 THEN ARRAY['Moderate confidence forecast', 'Use with caution', 'Monitor trends']
            ELSE ARRAY['Low confidence forecast', 'Collect more data', 'Focus on current performance']
        END
    );
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for performance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS performance_summary AS
SELECT 
    sm.user_id,
    sm.season_id,
    sm.metric_category,
    COUNT(DISTINCT sm.metric_name) as metrics_tracked,
    AVG(sm.z_score) as avg_z_score,
    AVG(sm.improvement_percentage) as avg_improvement,
    COUNT(CASE WHEN sm.trend_direction = 'improving' THEN 1 END) as improving_metrics,
    COUNT(CASE WHEN sm.trend_direction = 'declining' THEN 1 END) as declining_metrics,
    COUNT(CASE WHEN sm.trend_direction = 'stable' THEN 1 END) as stable_metrics,
    MAX(sm.measurement_date) as last_measurement_date,
    calculate_performance_z_score(sm.user_id, 'overall_performance', AVG(sm.z_score)) as overall_performance_assessment
FROM season_metrics sm
WHERE sm.measurement_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY sm.user_id, sm.season_id, sm.metric_category
ORDER BY sm.user_id, sm.season_id, sm.metric_category;

-- Add comments
COMMENT ON TABLE season_metrics IS 'Comprehensive season-long performance tracking and metrics';
COMMENT ON TABLE benchmark_tables IS 'Performance benchmarks and percentile rankings by demographic groups';
COMMENT ON TABLE performance_trends IS 'Longitudinal performance trend analysis and statistical modeling';
COMMENT ON TABLE performance_forecasts IS 'Performance forecasting and prediction models';
COMMENT ON TABLE performance_correlations IS 'Correlations between different performance metrics';
COMMENT ON TABLE performance_alerts IS 'Performance alerts and notifications for coaches and athletes';
COMMENT ON TABLE performance_competencies IS 'Performance competency frameworks and assessment criteria';
COMMENT ON TABLE competency_assessments IS 'Individual competency assessments and development tracking';
COMMENT ON FUNCTION calculate_performance_z_score IS 'Calculate z-scores and percentile rankings for performance metrics';
COMMENT ON FUNCTION forecast_performance IS 'Forecast future performance based on historical trends and statistical models';

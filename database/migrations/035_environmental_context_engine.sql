-- Migration: Environmental Context Engine
-- This migration adds comprehensive environmental monitoring and adjustment systems

-- 1. WEATHER LOGS AND MONITORING
CREATE TABLE IF NOT EXISTS weather_logs (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(100) NOT NULL, -- city, venue, or GPS coordinates
    location_name VARCHAR(200) NOT NULL,
    weather_date DATE NOT NULL,
    weather_time TIME NOT NULL,
    temperature_celsius DECIMAL(4,1) NOT NULL,
    temperature_fahrenheit DECIMAL(4,1),
    relative_humidity_percent DECIMAL(5,2),
    dew_point_celsius DECIMAL(4,1),
    wet_bulb_globe_temperature_celsius DECIMAL(4,1), -- WBGT for heat stress
    heat_index_celsius DECIMAL(4,1),
    wind_speed_kmh DECIMAL(5,2),
    wind_direction_degrees INTEGER,
    atmospheric_pressure_hpa DECIMAL(7,2),
    precipitation_mm DECIMAL(6,2),
    precipitation_type VARCHAR(50), -- 'rain', 'snow', 'sleet', 'none'
    uv_index INTEGER CHECK (uv_index >= 0 AND uv_index <= 11),
    air_quality_index INTEGER,
    visibility_km DECIMAL(5,2),
    cloud_cover_percent INTEGER CHECK (cloud_cover_percent >= 0 AND cloud_cover_percent <= 100),
    weather_condition VARCHAR(100), -- 'sunny', 'cloudy', 'rainy', 'stormy'
    data_source VARCHAR(100) DEFAULT 'weather_api', -- 'weather_api', 'manual_entry', 'sensor'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ALTITUDE AND ENVIRONMENTAL FACTORS
CREATE TABLE IF NOT EXISTS altitude_environmental_factors (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(100) NOT NULL,
    location_name VARCHAR(200) NOT NULL,
    altitude_meters INTEGER NOT NULL,
    altitude_feet INTEGER,
    atmospheric_pressure_hpa DECIMAL(7,2),
    oxygen_saturation_percent DECIMAL(5,2),
    temperature_lapse_rate DECIMAL(5,2), -- temperature change per altitude
    humidity_variation_percent DECIMAL(5,2),
    wind_patterns JSONB, -- altitude-specific wind characteristics
    acclimatization_requirements_days INTEGER, -- days needed for altitude acclimatization
    performance_impact_percentage DECIMAL(5,2), -- expected performance impact
    health_considerations TEXT[],
    training_recommendations TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ENVIRONMENTAL ADJUSTMENTS AND PROTOCOLS
CREATE TABLE IF NOT EXISTS environmental_adjustments (
    id SERIAL PRIMARY KEY,
    protocol_id INTEGER NOT NULL, -- references training or nutrition protocols
    protocol_type VARCHAR(100) NOT NULL, -- 'hydration', 'nutrition', 'training_intensity', 'recovery'
    environmental_parameter VARCHAR(100) NOT NULL, -- 'temperature', 'humidity', 'altitude', 'wbgt'
    adjustment_factor DECIMAL(5,2) NOT NULL, -- multiplier for adjustments
    adjustment_type VARCHAR(50) NOT NULL, -- 'increase', 'decrease', 'modify'
    adjustment_description TEXT NOT NULL,
    threshold_value DECIMAL(8,2) NOT NULL, -- environmental value that triggers adjustment
    threshold_operator VARCHAR(10) NOT NULL, -- '>', '<', '>=', '<=', '='
    adjustment_magnitude DECIMAL(5,2), -- specific amount to adjust
    adjustment_unit VARCHAR(50), -- unit of measurement for adjustment
    evidence_level VARCHAR(50) CHECK (evidence_level IN ('very_high', 'high', 'medium', 'low')),
    citation_references TEXT[],
    contraindications TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. HEAT STRESS MONITORING
CREATE TABLE IF NOT EXISTS heat_stress_monitoring (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    monitoring_date DATE NOT NULL,
    monitoring_time TIME NOT NULL,
    location_id VARCHAR(100) NOT NULL,
    wbgt_celsius DECIMAL(4,1) NOT NULL,
    heat_stress_level VARCHAR(50) NOT NULL CHECK (heat_stress_level IN ('low', 'moderate', 'high', 'extreme')),
    heat_stress_score INTEGER CHECK (heat_stress_score >= 1 AND heat_stress_score <= 10),
    core_temperature_celsius DECIMAL(4,1),
    skin_temperature_celsius DECIMAL(4,1),
    heart_rate_bpm INTEGER,
    sweat_rate_ml_per_hour INTEGER,
    hydration_status VARCHAR(50), -- 'well_hydrated', 'mildly_dehydrated', 'dehydrated'
    heat_illness_symptoms TEXT[],
    acclimatization_status VARCHAR(50), -- 'not_acclimatized', 'partially_acclimatized', 'fully_acclimatized'
    days_in_heat INTEGER,
    heat_tolerance_rating INTEGER CHECK (heat_tolerance_rating >= 1 AND heat_tolerance_rating <= 10),
    recommended_actions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. COLD STRESS MONITORING
CREATE TABLE IF NOT EXISTS cold_stress_monitoring (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    monitoring_date DATE NOT NULL,
    monitoring_time TIME NOT NULL,
    location_id VARCHAR(100) NOT NULL,
    temperature_celsius DECIMAL(4,1) NOT NULL,
    wind_chill_celsius DECIMAL(4,1),
    cold_stress_level VARCHAR(50) NOT NULL CHECK (cold_stress_level IN ('low', 'moderate', 'high', 'extreme')),
    cold_stress_score INTEGER CHECK (cold_stress_score >= 1 AND cold_stress_score <= 10),
    core_temperature_celsius DECIMAL(4,1),
    skin_temperature_celsius DECIMAL(4,1),
    shivering_intensity INTEGER CHECK (shivering_intensity >= 1 AND shivering_intensity <= 10),
    peripheral_circulation VARCHAR(50), -- 'normal', 'reduced', 'poor'
    cold_illness_symptoms TEXT[],
    clothing_adequacy_rating INTEGER CHECK (clothing_adequacy_rating >= 1 AND clothing_adequacy_rating <= 10),
    cold_tolerance_rating INTEGER CHECK (cold_tolerance_rating >= 1 AND cold_tolerance_rating <= 10),
    recommended_actions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ENVIRONMENTAL TRAINING ADAPTATIONS
CREATE TABLE IF NOT EXISTS environmental_training_adaptations (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    adaptation_date DATE NOT NULL,
    environmental_condition VARCHAR(100) NOT NULL, -- 'heat', 'cold', 'altitude', 'humidity'
    baseline_performance_metrics JSONB, -- performance in normal conditions
    adapted_performance_metrics JSONB, -- performance in environmental conditions
    adaptation_strategies_used TEXT[],
    adaptation_effectiveness_rating INTEGER CHECK (adaptation_effectiveness_rating >= 1 AND adaptation_effectiveness_rating <= 10),
    performance_impact_percentage DECIMAL(5,2),
    adaptation_duration_minutes INTEGER,
    acclimatization_progress_percentage DECIMAL(5,2),
    next_adaptation_session_goals TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ENVIRONMENTAL NUTRITION ADJUSTMENTS
CREATE TABLE IF NOT EXISTS environmental_nutrition_adjustments (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    adjustment_date DATE NOT NULL,
    environmental_condition VARCHAR(100) NOT NULL,
    baseline_nutrition_plan JSONB, -- normal nutrition requirements
    adjusted_nutrition_plan JSONB, -- modified for environmental conditions
    hydration_adjustments JSONB, -- fluid intake modifications
    electrolyte_adjustments JSONB, -- sodium, potassium, magnesium adjustments
    energy_adjustments JSONB, -- caloric intake modifications
    timing_adjustments JSONB, -- meal timing modifications
    supplement_adjustments JSONB, -- supplement modifications
    adjustment_rationale TEXT,
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. ENVIRONMENTAL RECOVERY PROTOCOLS
CREATE TABLE IF NOT EXISTS environmental_recovery_protocols (
    id SERIAL PRIMARY KEY,
    protocol_name VARCHAR(200) NOT NULL,
    environmental_condition VARCHAR(100) NOT NULL,
    protocol_description TEXT NOT NULL,
    recovery_duration_minutes INTEGER NOT NULL,
    temperature_requirements_celsius JSONB, -- optimal temperature range
    humidity_requirements_percent JSONB, -- optimal humidity range
    altitude_requirements_meters JSONB, -- altitude considerations
    recovery_modalities TEXT[], -- specific recovery methods
    hydration_protocols JSONB, -- fluid replacement strategies
    nutrition_protocols JSONB, -- post-recovery nutrition
    contraindications TEXT[],
    evidence_level VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_weather_logs_location_date ON weather_logs(location_id, weather_date);
CREATE INDEX IF NOT EXISTS idx_weather_logs_temperature ON weather_logs(temperature_celsius);
CREATE INDEX IF NOT EXISTS idx_weather_logs_wbgt ON weather_logs(wet_bulb_globe_temperature_celsius);
CREATE INDEX IF NOT EXISTS idx_altitude_environmental_location ON altitude_environmental_factors(location_id);
CREATE INDEX IF NOT EXISTS idx_altitude_environmental_altitude ON altitude_environmental_factors(altitude_meters);
CREATE INDEX IF NOT EXISTS idx_environmental_adjustments_protocol ON environmental_adjustments(protocol_id);
CREATE INDEX IF NOT EXISTS idx_environmental_adjustments_parameter ON environmental_adjustments(environmental_parameter);
CREATE INDEX IF NOT EXISTS idx_heat_stress_user_date ON heat_stress_monitoring(user_id, monitoring_date);
CREATE INDEX IF NOT EXISTS idx_cold_stress_user_date ON cold_stress_monitoring(user_id, monitoring_date);
CREATE INDEX IF NOT EXISTS idx_environmental_training_user ON environmental_training_adaptations(user_id);
CREATE INDEX IF NOT EXISTS idx_environmental_nutrition_user ON environmental_nutrition_adjustments(user_id);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_weather_logs_unique ON weather_logs(location_id, weather_date, weather_time);
CREATE UNIQUE INDEX IF NOT EXISTS idx_altitude_environmental_unique ON altitude_environmental_factors(location_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_heat_stress_unique ON heat_stress_monitoring(user_id, monitoring_date, monitoring_time);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cold_stress_unique ON cold_stress_monitoring(user_id, monitoring_date, monitoring_time);

-- Insert sample environmental adjustments
INSERT INTO environmental_adjustments (protocol_id, protocol_type, environmental_parameter, adjustment_factor, adjustment_type, adjustment_description, threshold_value, threshold_operator, adjustment_magnitude, adjustment_unit, evidence_level) VALUES
(1, 'hydration', 'wbgt', 1.5, 'increase', 'Increase fluid intake by 50% when WBGT exceeds 26°C', 26.0, '>', 50.0, 'percent', 'high'),
(1, 'hydration', 'wbgt', 2.0, 'increase', 'Increase fluid intake by 100% when WBGT exceeds 30°C', 30.0, '>', 100.0, 'percent', 'high'),
(2, 'nutrition', 'altitude', 1.3, 'increase', 'Increase caloric intake by 30% at altitudes above 1500m', 1500.0, '>', 30.0, 'percent', 'medium'),
(3, 'training_intensity', 'altitude', 0.8, 'decrease', 'Reduce training intensity by 20% at altitudes above 2000m', 2000.0, '>', 20.0, 'percent', 'high'),
(4, 'recovery', 'temperature', 1.2, 'increase', 'Increase recovery time by 20% in temperatures below 5°C', 5.0, '<', 20.0, 'percent', 'medium');

-- Insert sample altitude environmental factors
INSERT INTO altitude_environmental_factors (location_id, location_name, altitude_meters, altitude_feet, atmospheric_pressure_hpa, oxygen_saturation_percent, acclimatization_requirements_days, performance_impact_percentage, health_considerations, training_recommendations) VALUES
('sea_level', 'Sea Level Training', 0, 0, 1013.25, 100.0, 0, 0.0, ARRAY['none'], ARRAY['standard_training_protocols']),
('moderate_altitude', 'Moderate Altitude Camp (1500m)', 1500, 4921, 850.0, 85.0, 7, 15.0, ARRAY['mild_hypoxia', 'increased_heart_rate'], ARRAY['gradual_intensity_increase', 'extended_warm_ups', 'reduced_volume']),
('high_altitude', 'High Altitude Camp (3000m)', 3000, 9843, 700.0, 70.0, 14, 30.0, ARRAY['moderate_hypoxia', 'sleep_disturbances', 'decreased_appetite'], ARRAY['significant_intensity_reduction', 'increased_recovery_time', 'altitude_sickness_monitoring']),
('extreme_altitude', 'Extreme Altitude (4000m+)', 4000, 13123, 600.0, 60.0, 21, 45.0, ARRAY['severe_hypoxia', 'altitude_sickness_risk', 'cognitive_impairment'], ARRAY['minimal_training', 'constant_monitoring', 'immediate_descent_if_symptoms']);

-- Insert sample environmental recovery protocols
INSERT INTO environmental_recovery_protocols (protocol_name, environmental_condition, protocol_description, recovery_duration_minutes, temperature_requirements_celsius, humidity_requirements_percent, recovery_modalities, hydration_protocols, evidence_level) VALUES
('Heat Stress Recovery Protocol', 'heat', 'Comprehensive recovery protocol for athletes training in hot conditions', 45, '{"min": 20, "max": 25}', '{"min": 40, "max": 60}', ARRAY['cool_down_stretching', 'ice_bath', 'compression_garments'], '{"fluid_replacement": "150_percent_sweat_loss", "electrolyte_supplementation": "sodium_potassium_magnesium"}', 'high'),

('Cold Stress Recovery Protocol', 'cold', 'Recovery protocol optimized for cold weather training', 60, '{"min": 18, "max": 22}', '{"min": 30, "max": 50}', ARRAY['gradual_warming', 'hot_shower', 'warm_compression'], '{"fluid_replacement": "standard_protocols", "warm_beverages": "tea_soup"}', 'medium'),

('Altitude Recovery Protocol', 'altitude', 'Recovery strategies for altitude training and competition', 90, '{"min": 16, "max": 20}', '{"min": 35, "max": 55}', ARRAY['extended_cool_down', 'compression_therapy', 'oxygen_supplementation'], '{"fluid_replacement": "increased_volume", "iron_supplementation": "consider_iron_status"}', 'high');

-- Create function to calculate heat stress index
CREATE OR REPLACE FUNCTION calculate_heat_stress_index(
    temperature_celsius DECIMAL,
    humidity_percent DECIMAL,
    wind_speed_kmh DECIMAL DEFAULT 0,
    solar_radiation_wm2 DECIMAL DEFAULT 800
) RETURNS JSONB AS $$
DECLARE
    wbgt_celsius DECIMAL;
    heat_stress_level VARCHAR;
    heat_stress_score INTEGER;
    risk_category VARCHAR;
    recommendations TEXT[];
BEGIN
    -- Calculate Wet Bulb Globe Temperature (WBGT) - simplified approximation
    wbgt_celsius := temperature_celsius * 0.7 + (humidity_percent * 0.3) + (solar_radiation_wm2 / 1000) * 0.1;
    
    -- Determine heat stress level
    IF wbgt_celsius >= 32.0 THEN
        heat_stress_level := 'extreme';
        heat_stress_score := 10;
        risk_category := 'very_high';
    ELSIF wbgt_celsius >= 28.0 THEN
        heat_stress_level := 'high';
        heat_stress_score := 8;
        risk_category := 'high';
    ELSIF wbgt_celsius >= 26.0 THEN
        heat_stress_level := 'moderate';
        heat_stress_score := 6;
        risk_category := 'moderate';
    ELSIF wbgt_celsius >= 22.0 THEN
        heat_stress_level := 'low';
        heat_stress_score := 4;
        risk_category := 'low';
    ELSE
        heat_stress_level := 'minimal';
        heat_stress_score := 2;
        risk_category := 'minimal';
    END IF;
    
    -- Generate recommendations based on heat stress level
    IF heat_stress_level = 'extreme' THEN
        recommendations := ARRAY[
            'Cancel or postpone training',
            'Seek air-conditioned environment',
            'Monitor for heat illness symptoms',
            'Emergency protocols if needed'
        ];
    ELSIF heat_stress_level = 'high' THEN
        recommendations := ARRAY[
            'Reduce training intensity by 50%',
            'Increase rest periods',
            'Frequent hydration breaks',
            'Monitor core temperature'
        ];
    ELSIF heat_stress_level = 'moderate' THEN
        recommendations := ARRAY[
            'Moderate training intensity',
            'Regular hydration breaks',
            'Monitor for symptoms',
            'Consider training timing'
        ];
    ELSE
        recommendations := ARRAY[
            'Normal training protocols',
            'Standard hydration',
            'Monitor conditions',
            'No special precautions needed'
        ];
    END IF;
    
    RETURN jsonb_build_object(
        'wbgt_celsius', ROUND(wbgt_celsius::numeric, 1),
        'heat_stress_level', heat_stress_level,
        'heat_stress_score', heat_stress_score,
        'risk_category', risk_category,
        'recommendations', recommendations,
        'calculation_factors', jsonb_build_object(
            'temperature_celsius', temperature_celsius,
            'humidity_percent', humidity_percent,
            'wind_speed_kmh', wind_speed_kmh,
            'solar_radiation_wm2', solar_radiation_wm2
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate altitude performance impact
CREATE OR REPLACE FUNCTION calculate_altitude_performance_impact(
    altitude_meters INTEGER,
    acclimatization_days INTEGER DEFAULT 0,
    baseline_performance DECIMAL DEFAULT 100.0
) RETURNS JSONB AS $$
DECLARE
    performance_impact_percentage DECIMAL;
    acclimatization_factor DECIMAL;
    adjusted_performance DECIMAL;
    recommendations TEXT[];
    risk_factors TEXT[];
BEGIN
    -- Calculate base performance impact (without acclimatization)
    IF altitude_meters <= 500 THEN
        performance_impact_percentage := 0.0;
    ELSIF altitude_meters <= 1500 THEN
        performance_impact_percentage := 5.0;
    ELSIF altitude_meters <= 2500 THEN
        performance_impact_percentage := 15.0;
    ELSIF altitude_meters <= 3500 THEN
        performance_impact_percentage := 25.0;
    ELSIF altitude_meters <= 4500 THEN
        performance_impact_percentage := 40.0;
    ELSE
        performance_impact_percentage := 60.0;
    END IF;
    
    -- Apply acclimatization factor
    IF acclimatization_days >= 21 THEN
        acclimatization_factor := 0.8; -- 80% of impact remains
    ELSIF acclimatization_days >= 14 THEN
        acclimatization_factor := 0.6; -- 60% of impact remains
    ELSIF acclimatization_days >= 7 THEN
        acclimatization_factor := 0.4; -- 40% of impact remains
    ELSIF acclimatization_days >= 3 THEN
        acclimatization_factor := 0.2; -- 20% of impact remains
    ELSE
        acclimatization_factor := 1.0; -- Full impact
    END IF;
    
    -- Calculate adjusted performance impact
    performance_impact_percentage := performance_impact_percentage * acclimatization_factor;
    adjusted_performance := baseline_performance - (baseline_performance * performance_impact_percentage / 100);
    
    -- Generate recommendations
    IF altitude_meters > 3000 THEN
        recommendations := ARRAY[
            'Gradual altitude exposure',
            'Extended acclimatization period',
            'Monitor for altitude sickness',
            'Consider supplemental oxygen'
        ];
        risk_factors := ARRAY['acute_mountain_sickness', 'high_altitude_pulmonary_edema', 'cognitive_impairment'];
    ELSIF altitude_meters > 2000 THEN
        recommendations := ARRAY[
            'Progressive altitude training',
            'Adequate rest periods',
            'Hydration monitoring',
            'Performance expectations adjustment'
        ];
        risk_factors := ARRAY['mild_hypoxia', 'sleep_disturbances'];
    ELSIF altitude_meters > 1000 THEN
        recommendations := ARRAY[
            'Moderate training adjustments',
            'Extended warm-ups',
            'Recovery time increase',
            'Performance monitoring'
        ];
        risk_factors := ARRAY['mild_performance_decrease'];
    ELSE
        recommendations := ARRAY[
            'Minimal adjustments needed',
            'Monitor individual response',
            'Standard training protocols'
        ];
        risk_factors := ARRAY['none'];
    END IF;
    
    RETURN jsonb_build_object(
        'altitude_meters', altitude_meters,
        'acclimatization_days', acclimatization_days,
        'baseline_performance', baseline_performance,
        'performance_impact_percentage', ROUND(performance_impact_percentage::numeric, 1),
        'adjusted_performance', ROUND(adjusted_performance::numeric, 1),
        'acclimatization_factor', ROUND(acclimatization_factor::numeric, 2),
        'recommendations', recommendations,
        'risk_factors', risk_factors
    );
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for environmental summary
CREATE MATERIALIZED VIEW IF NOT EXISTS environmental_summary AS
SELECT 
    wl.location_id,
    wl.location_name,
    AVG(wl.temperature_celsius) as avg_temperature,
    AVG(wl.relative_humidity_percent) as avg_humidity,
    AVG(wl.wet_bulb_globe_temperature_celsius) as avg_wbgt,
    MAX(wl.temperature_celsius) as max_temperature,
    MIN(wl.temperature_celsius) as min_temperature,
    COUNT(*) as weather_records,
    aef.altitude_meters,
    aef.performance_impact_percentage,
    calculate_heat_stress_index(
        AVG(wl.temperature_celsius), 
        AVG(wl.relative_humidity_percent)
    ) as heat_stress_assessment
FROM weather_logs wl
LEFT JOIN altitude_environmental_factors aef ON wl.location_id = aef.location_id
WHERE wl.weather_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY wl.location_id, wl.location_name, aef.altitude_meters, aef.performance_impact_percentage
ORDER BY wl.location_id;

-- Add comments
COMMENT ON TABLE weather_logs IS 'Comprehensive weather monitoring and logging';
COMMENT ON TABLE altitude_environmental_factors IS 'Altitude-specific environmental factors and considerations';
COMMENT ON TABLE environmental_adjustments IS 'Protocol adjustments based on environmental conditions';
COMMENT ON TABLE heat_stress_monitoring IS 'Individual heat stress monitoring and assessment';
COMMENT ON TABLE cold_stress_monitoring IS 'Individual cold stress monitoring and assessment';
COMMENT ON TABLE environmental_training_adaptations IS 'Training adaptations for environmental conditions';
COMMENT ON TABLE environmental_nutrition_adjustments IS 'Nutrition adjustments for environmental conditions';
COMMENT ON TABLE environmental_recovery_protocols IS 'Recovery protocols optimized for environmental conditions';
COMMENT ON FUNCTION calculate_heat_stress_index IS 'Calculate heat stress index and provide recommendations';
COMMENT ON FUNCTION calculate_altitude_performance_impact IS 'Calculate performance impact of altitude and acclimatization';

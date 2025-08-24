-- Migration: Wearables Integration System
-- Description: Complete wearables ecosystem for Apple Watch, Fitbit, Garmin, and smart scales
-- Created: 2025-08-03
-- Supports: Real-time biometric tracking, injury prevention, performance optimization

-- =============================================================================
-- WEARABLE DEVICES MANAGEMENT
-- =============================================================================

-- Supported wearable devices and brands
CREATE TABLE wearable_device_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand VARCHAR(50) NOT NULL, -- 'apple', 'fitbit', 'garmin', 'polar', 'whoop'
    model VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL, -- 'watch', 'fitness_tracker', 'smart_scale', 'heart_rate_monitor'
    capabilities TEXT[], -- ['heart_rate', 'gps', 'sleep', 'steps', 'weight', 'body_composition']
    api_version VARCHAR(20),
    data_refresh_rate INTEGER DEFAULT 60, -- seconds between syncs
    battery_life_hours INTEGER,
    
    -- Technical specifications
    sensor_accuracy JSONB, -- {"heart_rate": "±1bpm", "gps": "±3m"}
    supported_metrics TEXT[],
    
    -- Status
    is_supported BOOLEAN DEFAULT true,
    firmware_requirements JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(brand, model)
);

-- User's connected wearable devices
CREATE TABLE user_wearable_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_type_id UUID NOT NULL REFERENCES wearable_device_types(id),
    
    -- Device identification
    device_id VARCHAR(255) NOT NULL, -- Unique device identifier from manufacturer
    device_name VARCHAR(100), -- User-assigned name
    serial_number VARCHAR(100),
    
    -- Connection and sync
    connection_status VARCHAR(20) DEFAULT 'disconnected', -- 'connected', 'disconnected', 'syncing', 'error'
    last_sync_at TIMESTAMP,
    sync_frequency INTEGER DEFAULT 300, -- seconds
    auto_sync_enabled BOOLEAN DEFAULT true,
    
    -- Authentication tokens (encrypted)
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP,
    
    -- Device settings
    notification_enabled BOOLEAN DEFAULT true,
    data_sharing_consent BOOLEAN DEFAULT false,
    backup_enabled BOOLEAN DEFAULT true,
    
    -- Sync statistics
    total_syncs INTEGER DEFAULT 0,
    failed_syncs INTEGER DEFAULT 0,
    last_error_message TEXT,
    
    -- Battery and health
    battery_level INTEGER, -- 0-100
    firmware_version VARCHAR(50),
    last_health_check TIMESTAMP,
    
    -- Status
    is_primary_device BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, device_id),
    UNIQUE(user_id, is_primary_device) WHERE is_primary_device = true
);

-- =============================================================================
-- REAL-TIME HEALTH METRICS
-- =============================================================================

-- Comprehensive health and fitness metrics from wearables
CREATE TABLE wearable_health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES user_wearable_devices(id) ON DELETE CASCADE,
    
    -- Timestamp and measurement context
    recorded_at TIMESTAMP NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'heart_rate', 'steps', 'calories', 'sleep', 'weight', 'body_fat'
    measurement_context VARCHAR(50), -- 'resting', 'active', 'workout', 'sleep', 'manual'
    
    -- Core measurements
    value DECIMAL(10,3) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- 'bpm', 'steps', 'calories', 'hours', 'kg', 'percent'
    confidence_score DECIMAL(3,2) DEFAULT 1.0, -- 0.0-1.0 accuracy confidence
    
    -- Heart rate specific
    hr_zone INTEGER, -- 1-5 heart rate zones
    hr_variability DECIMAL(6,2), -- HRV in milliseconds
    resting_hr INTEGER,
    max_hr INTEGER,
    
    -- Activity specific
    active_minutes INTEGER,
    exercise_minutes INTEGER,
    sedentary_minutes INTEGER,
    floors_climbed INTEGER,
    
    -- Sleep specific (when metric_type = 'sleep')
    sleep_stage VARCHAR(20), -- 'deep', 'light', 'rem', 'awake'
    sleep_efficiency DECIMAL(5,2), -- percentage
    sleep_disturbances INTEGER,
    
    -- Body composition (smart scale data)
    muscle_mass DECIMAL(5,2),
    bone_mass DECIMAL(5,2),
    water_percentage DECIMAL(5,2),
    metabolic_age INTEGER,
    
    -- GPS and movement data
    location_data JSONB, -- {"latitude": 40.7128, "longitude": -74.0060, "altitude": 10}
    distance_meters DECIMAL(10,2),
    pace_per_km DECIMAL(6,2), -- minutes per kilometer
    cadence INTEGER, -- steps per minute
    
    -- Environmental context
    temperature_celsius DECIMAL(4,1),
    humidity_percent INTEGER,
    weather_conditions VARCHAR(50),
    
    -- Data quality and validation
    is_validated BOOLEAN DEFAULT false,
    validation_source VARCHAR(50), -- 'automatic', 'manual', 'cross_reference'
    outlier_flag BOOLEAN DEFAULT false,
    
    -- Metadata
    raw_data JSONB, -- Original data from device
    processing_notes TEXT,
    sync_batch_id UUID, -- Group related measurements
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- WORKOUT AND ACTIVITY TRACKING
-- =============================================================================

-- Detailed workout sessions tracked by wearables
CREATE TABLE wearable_workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES user_wearable_devices(id) ON DELETE CASCADE,
    training_session_id UUID REFERENCES training_sessions(id), -- Link to app training sessions
    
    -- Workout identification
    workout_type VARCHAR(100) NOT NULL, -- 'flag_football', 'running', 'strength_training', 'agility'
    device_workout_id VARCHAR(255), -- Unique ID from wearable device
    
    -- Timing
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP NOT NULL,
    duration_seconds INTEGER NOT NULL,
    active_duration_seconds INTEGER, -- Excluding breaks
    
    -- Performance metrics
    total_calories INTEGER,
    average_heart_rate INTEGER,
    max_heart_rate INTEGER,
    min_heart_rate INTEGER,
    hr_zones_breakdown JSONB, -- {"zone1": 300, "zone2": 600, "zone3": 900, "zone4": 300, "zone5": 120}
    
    -- Movement and GPS data
    total_distance_meters DECIMAL(10,2),
    average_pace_per_km DECIMAL(6,2),
    max_speed_kmh DECIMAL(6,2),
    elevation_gain_meters DECIMAL(8,2),
    gps_route JSONB, -- Array of GPS coordinates with timestamps
    
    -- Advanced metrics
    training_load DECIMAL(6,2), -- Calculated training stress
    recovery_time_hours INTEGER, -- Recommended recovery
    vo2_max_estimate DECIMAL(5,2),
    training_effect DECIMAL(3,1), -- 1.0-5.0 aerobic training effect
    
    -- Power and biomechanics (for advanced devices)
    average_power_watts INTEGER,
    max_power_watts INTEGER,
    average_cadence INTEGER,
    ground_contact_time_ms INTEGER,
    vertical_oscillation_mm DECIMAL(5,2),
    left_right_balance DECIMAL(5,2), -- Percentage balance
    
    -- Environmental conditions
    weather_data JSONB,
    temperature_celsius DECIMAL(4,1),
    humidity_percent INTEGER,
    
    -- Workout quality and notes
    perceived_exertion INTEGER CHECK (perceived_exertion BETWEEN 1 AND 10),
    mood_before VARCHAR(20), -- 'excellent', 'good', 'average', 'poor', 'terrible'
    mood_after VARCHAR(20),
    user_notes TEXT,
    
    -- Auto-detection and validation
    auto_detected BOOLEAN DEFAULT false,
    detection_confidence DECIMAL(3,2),
    manually_edited BOOLEAN DEFAULT false,
    
    -- Data processing
    raw_workout_data JSONB,
    processed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- BIOMECHANICAL ANALYSIS
-- =============================================================================

-- Advanced movement pattern analysis for injury prevention
CREATE TABLE biomechanical_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_session_id UUID REFERENCES wearable_workout_sessions(id),
    
    -- Assessment context
    assessment_type VARCHAR(50) NOT NULL, -- 'running_gait', 'jumping', 'cutting', 'throwing'
    assessed_at TIMESTAMP NOT NULL,
    duration_seconds INTEGER,
    
    -- Movement symmetry analysis
    left_right_asymmetry DECIMAL(5,2), -- Percentage difference
    anterior_posterior_balance DECIMAL(5,2),
    medial_lateral_balance DECIMAL(5,2),
    
    -- Gait analysis (for running/walking)
    stride_length_cm DECIMAL(6,2),
    stride_frequency DECIMAL(6,2),
    ground_contact_time_ms INTEGER,
    flight_time_ms INTEGER,
    vertical_oscillation_cm DECIMAL(5,2),
    
    -- Force and power analysis
    peak_ground_force_n DECIMAL(8,2),
    force_loading_rate DECIMAL(8,2),
    power_output_watts DECIMAL(8,2),
    impulse_ns DECIMAL(8,2),
    
    -- Joint angles and ranges of motion
    ankle_dorsiflexion_degrees DECIMAL(5,2),
    knee_flexion_degrees DECIMAL(5,2),
    hip_flexion_degrees DECIMAL(5,2),
    trunk_lean_degrees DECIMAL(5,2),
    
    -- Stability and coordination
    center_of_mass_displacement DECIMAL(6,2),
    postural_sway_mm DECIMAL(6,2),
    coordination_index DECIMAL(5,2), -- Calculated metric
    
    -- Risk factors identified
    injury_risk_score DECIMAL(5,2), -- 0-100 calculated risk
    risk_factors JSONB, -- ["excessive_pronation", "asymmetric_loading", "reduced_range_of_motion"]
    compensation_patterns TEXT[],
    
    -- Recommendations
    corrective_exercises TEXT[],
    modification_suggestions TEXT[],
    follow_up_needed BOOLEAN DEFAULT false,
    
    -- Data sources and confidence
    data_sources TEXT[], -- ['accelerometer', 'gyroscope', 'pressure_sensors', 'gps']
    analysis_confidence DECIMAL(3,2),
    manual_review_needed BOOLEAN DEFAULT false,
    
    -- Processing metadata
    algorithm_version VARCHAR(20),
    raw_sensor_data JSONB,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- DEVICE SYNC AND DATA MANAGEMENT
-- =============================================================================

-- Track data synchronization between devices and app
CREATE TABLE wearable_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_device_id UUID NOT NULL REFERENCES user_wearable_devices(id) ON DELETE CASCADE,
    
    -- Sync details
    sync_started_at TIMESTAMP NOT NULL,
    sync_completed_at TIMESTAMP,
    sync_status VARCHAR(20) NOT NULL, -- 'in_progress', 'completed', 'failed', 'partial'
    
    -- Data transferred
    metrics_synced INTEGER DEFAULT 0,
    workouts_synced INTEGER DEFAULT 0,
    data_size_bytes BIGINT DEFAULT 0,
    
    -- Time ranges
    data_from_date TIMESTAMP,
    data_to_date TIMESTAMP,
    
    -- Error handling
    error_code VARCHAR(50),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- API details
    api_endpoint VARCHAR(255),
    api_response_time_ms INTEGER,
    rate_limit_remaining INTEGER,
    
    -- Data quality
    duplicate_records INTEGER DEFAULT 0,
    invalid_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Health metrics indexes
CREATE INDEX idx_health_metrics_user_time ON wearable_health_metrics(user_id, recorded_at);
CREATE INDEX idx_health_metrics_type ON wearable_health_metrics(metric_type);
CREATE INDEX idx_health_metrics_device ON wearable_health_metrics(device_id, recorded_at);
CREATE INDEX idx_health_metrics_hr_zone ON wearable_health_metrics(hr_zone) WHERE metric_type = 'heart_rate';

-- Workout sessions indexes
CREATE INDEX idx_workout_sessions_user_time ON wearable_workout_sessions(user_id, started_at);
CREATE INDEX idx_workout_sessions_type ON wearable_workout_sessions(workout_type);
CREATE INDEX idx_workout_sessions_device ON wearable_workout_sessions(device_id);
CREATE INDEX idx_workout_sessions_training ON wearable_workout_sessions(training_session_id);

-- Biomechanical assessments indexes
CREATE INDEX idx_biomech_user_time ON biomechanical_assessments(user_id, assessed_at);
CREATE INDEX idx_biomech_risk_score ON biomechanical_assessments(injury_risk_score);
CREATE INDEX idx_biomech_workout ON biomechanical_assessments(workout_session_id);

-- Device management indexes
CREATE INDEX idx_user_devices_status ON user_wearable_devices(user_id, connection_status);
CREATE INDEX idx_user_devices_sync ON user_wearable_devices(last_sync_at);
CREATE INDEX idx_sync_logs_device_time ON wearable_sync_logs(user_device_id, sync_started_at);

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Real-time device status summary
CREATE OR REPLACE VIEW user_wearables_status AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    uwd.device_name,
    wdt.brand,
    wdt.model,
    uwd.connection_status,
    uwd.last_sync_at,
    uwd.battery_level,
    EXTRACT(EPOCH FROM (NOW() - uwd.last_sync_at))/60 as minutes_since_sync,
    CASE 
        WHEN uwd.connection_status = 'connected' AND uwd.last_sync_at > NOW() - INTERVAL '30 minutes' THEN 'healthy'
        WHEN uwd.connection_status = 'connected' AND uwd.last_sync_at > NOW() - INTERVAL '2 hours' THEN 'warning'
        ELSE 'critical'
    END as sync_health
FROM users u
JOIN user_wearable_devices uwd ON u.id = uwd.user_id
JOIN wearable_device_types wdt ON uwd.device_type_id = wdt.id
WHERE uwd.is_active = true;

-- Latest health metrics by user
CREATE OR REPLACE VIEW latest_health_metrics AS
SELECT DISTINCT ON (user_id, metric_type)
    user_id,
    metric_type,
    value,
    unit,
    recorded_at,
    hr_zone,
    confidence_score
FROM wearable_health_metrics
ORDER BY user_id, metric_type, recorded_at DESC;

-- Workout performance summary
CREATE OR REPLACE VIEW workout_performance_summary AS
SELECT 
    user_id,
    workout_type,
    COUNT(*) as total_workouts,
    AVG(duration_seconds)/60 as avg_duration_minutes,
    AVG(total_calories) as avg_calories,
    AVG(average_heart_rate) as avg_heart_rate,
    AVG(training_load) as avg_training_load,
    MAX(started_at) as last_workout
FROM wearable_workout_sessions
WHERE started_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id, workout_type;

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================

-- Insert sample device types
INSERT INTO wearable_device_types (brand, model, device_type, capabilities, supported_metrics) VALUES
('apple', 'Apple Watch Series 9', 'watch', ARRAY['heart_rate', 'gps', 'sleep', 'steps', 'workout_tracking'], ARRAY['heart_rate', 'steps', 'calories', 'distance', 'sleep_hours', 'workout_duration']),
('garmin', 'Forerunner 965', 'watch', ARRAY['heart_rate', 'gps', 'sleep', 'steps', 'advanced_metrics'], ARRAY['heart_rate', 'vo2_max', 'training_load', 'recovery_time', 'running_dynamics']),
('fitbit', 'Charge 6', 'fitness_tracker', ARRAY['heart_rate', 'sleep', 'steps', 'stress'], ARRAY['heart_rate', 'sleep_score', 'stress_level', 'readiness_score']),
('withings', 'Body Comp', 'smart_scale', ARRAY['weight', 'body_composition'], ARRAY['weight', 'body_fat_percent', 'muscle_mass', 'bone_mass']);

-- Sample user device connection (would be created when user connects device)
-- INSERT INTO user_wearable_devices (user_id, device_type_id, device_id, device_name, connection_status) 
-- VALUES (
--     (SELECT id FROM users LIMIT 1),
--     (SELECT id FROM wearable_device_types WHERE brand = 'apple' AND model = 'Apple Watch Series 9'),
--     'AW-123456789',
--     'Alex''s Apple Watch',
--     'connected'
-- );
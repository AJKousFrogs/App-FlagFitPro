-- Migration: AI Schedule Reshuffling System
-- Description: Intelligent scheduling with weather disruption detection and automatic rescheduling
-- Created: 2025-08-03
-- Supports: Weather monitoring, facility management, conflict resolution, load optimization, emergency rescheduling

-- =============================================================================
-- WEATHER DATA AND MONITORING
-- =============================================================================

-- Real-time weather data and forecasting
CREATE TABLE weather_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Location details
    location_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(11, 7) NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    
    -- Weather timestamp
    forecast_timestamp TIMESTAMP NOT NULL,
    data_source VARCHAR(100) NOT NULL, -- 'openweathermap', 'weatherapi', 'nws', 'local_station'
    forecast_type VARCHAR(50) NOT NULL, -- 'current', 'hourly', 'daily', 'severe_weather_alert'
    
    -- Temperature data
    temperature_celsius DECIMAL(5,2),
    feels_like_celsius DECIMAL(5,2),
    humidity_percentage INTEGER CHECK (humidity_percentage BETWEEN 0 AND 100),
    dew_point_celsius DECIMAL(5,2),
    
    -- Precipitation
    precipitation_mm DECIMAL(6,2) DEFAULT 0,
    precipitation_probability INTEGER CHECK (precipitation_probability BETWEEN 0 AND 100),
    precipitation_type VARCHAR(50), -- 'rain', 'snow', 'sleet', 'freezing_rain'
    precipitation_intensity VARCHAR(20), -- 'light', 'moderate', 'heavy', 'extreme'
    
    -- Wind conditions
    wind_speed_kmh DECIMAL(5,2),
    wind_direction_degrees INTEGER CHECK (wind_direction_degrees BETWEEN 0 AND 360),
    wind_gust_kmh DECIMAL(5,2),
    
    -- Atmospheric conditions
    atmospheric_pressure_hpa DECIMAL(7,2),
    visibility_km DECIMAL(5,2),
    uv_index DECIMAL(3,1),
    cloud_cover_percentage INTEGER CHECK (cloud_cover_percentage BETWEEN 0 AND 100),
    
    -- Severe weather indicators
    severe_weather_alerts JSONB, -- Active weather warnings/watches
    lightning_risk BOOLEAN DEFAULT false,
    tornado_risk BOOLEAN DEFAULT false,
    hail_risk BOOLEAN DEFAULT false,
    
    -- Air quality (if available)
    air_quality_index INTEGER,
    air_quality_category VARCHAR(50), -- 'good', 'moderate', 'unhealthy_for_sensitive', 'unhealthy', 'very_unhealthy', 'hazardous'
    
    -- Training impact assessment
    training_suitability_score DECIMAL(3,2) CHECK (training_suitability_score BETWEEN 0 AND 1),
    outdoor_training_recommended BOOLEAN DEFAULT true,
    safety_concerns TEXT[],
    recommended_modifications TEXT[],
    
    -- Data quality indicators
    data_accuracy_rating DECIMAL(3,2), -- Confidence in the forecast
    forecast_age_hours DECIMAL(4,1), -- How old this forecast is
    
    -- Update tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- FACILITY MANAGEMENT AND AVAILABILITY
-- =============================================================================

-- Training facilities and their availability
CREATE TABLE training_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Facility identification
    facility_name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(100) NOT NULL, -- 'outdoor_field', 'indoor_gym', 'weight_room', 'meeting_room', 'recovery_center'
    facility_code VARCHAR(50), -- Internal code for quick reference
    
    -- Location and contact
    address JSONB NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(11, 7),
    contact_information JSONB,
    
    -- Capacity and specifications
    max_capacity INTEGER NOT NULL,
    field_dimensions JSONB, -- Length, width, surface type
    surface_type VARCHAR(100), -- 'natural_grass', 'artificial_turf', 'indoor_court', 'gym_floor'
    indoor_facility BOOLEAN NOT NULL DEFAULT false,
    
    -- Equipment and amenities
    available_equipment TEXT[],
    amenities TEXT[], -- 'locker_rooms', 'medical_room', 'video_analysis', 'sound_system'
    lighting_available BOOLEAN DEFAULT false,
    lighting_quality VARCHAR(20), -- 'excellent', 'good', 'adequate', 'poor'
    
    -- Weather protection
    covered_areas BOOLEAN DEFAULT false,
    weather_protection_level VARCHAR(50), -- 'none', 'partial', 'full_indoor', 'retractable_roof'
    heating_available BOOLEAN DEFAULT false,
    air_conditioning BOOLEAN DEFAULT false,
    
    -- Booking and availability
    requires_booking BOOLEAN DEFAULT true,
    booking_lead_time_hours INTEGER DEFAULT 24,
    cancellation_policy TEXT,
    booking_contact JSONB,
    
    -- Cost information
    hourly_rate DECIMAL(8,2),
    daily_rate DECIMAL(8,2),
    member_discount_percentage DECIMAL(5,2) DEFAULT 0,
    payment_terms VARCHAR(100),
    
    -- Facility rules and restrictions
    usage_rules TEXT[],
    equipment_restrictions TEXT[],
    noise_restrictions JSONB, -- Time-based noise limits
    parking_availability VARCHAR(100),
    
    -- Maintenance and conditions
    last_maintenance_date DATE,
    next_maintenance_scheduled DATE,
    current_condition_rating DECIMAL(3,2) CHECK (current_condition_rating BETWEEN 0 AND 1),
    maintenance_notes TEXT,
    
    -- Accessibility features
    ada_compliant BOOLEAN DEFAULT false,
    accessibility_features TEXT[],
    
    -- Technology integration
    wifi_available BOOLEAN DEFAULT false,
    av_equipment BOOLEAN DEFAULT false,
    live_streaming_capable BOOLEAN DEFAULT false,
    
    -- Status and operational info
    is_active BOOLEAN DEFAULT true,
    operational_hours JSONB, -- Operating hours by day of week
    seasonal_availability JSONB, -- Seasonal restrictions
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SCHEDULE DISRUPTION DETECTION
-- =============================================================================

-- Automated detection of schedule disruptions
CREATE TABLE schedule_disruption_detection (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Disruption identification
    disruption_type VARCHAR(100) NOT NULL, -- 'weather', 'facility_unavailable', 'coach_unavailable', 'equipment_failure', 'emergency'
    severity_level VARCHAR(20) NOT NULL, -- 'minor', 'moderate', 'major', 'critical'
    detection_method VARCHAR(100) NOT NULL, -- 'weather_api', 'facility_system', 'manual_report', 'automated_monitoring'
    
    -- Affected schedule elements
    affected_sessions UUID[], -- Array of training session IDs
    affected_facilities UUID[], -- Array of facility IDs
    affected_teams UUID[], -- Array of team IDs
    affected_timeframe JSONB, -- Start and end time of disruption
    
    -- Disruption details
    description TEXT NOT NULL,
    root_cause TEXT,
    contributing_factors TEXT[],
    
    -- Geographic and temporal scope
    affected_locations JSONB, -- Geographic areas affected
    estimated_duration_hours INTEGER,
    earliest_resolution_time TIMESTAMP,
    latest_resolution_time TIMESTAMP,
    
    -- Weather-specific details
    weather_conditions JSONB, -- Related weather data if weather disruption
    weather_data_id UUID REFERENCES weather_data(id),
    weather_safety_concerns TEXT[],
    
    -- Facility-specific details
    facility_issues JSONB, -- Details about facility problems
    maintenance_required BOOLEAN DEFAULT false,
    alternative_facilities_available BOOLEAN DEFAULT false,
    
    -- Impact assessment
    sessions_affected_count INTEGER DEFAULT 0,
    athletes_affected_count INTEGER DEFAULT 0,
    estimated_financial_impact DECIMAL(10,2),
    training_quality_impact VARCHAR(20), -- 'none', 'minimal', 'moderate', 'significant', 'severe'
    
    -- Detection timeline
    first_detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    resolution_detected_at TIMESTAMP,
    
    -- Response tracking
    automatic_response_triggered BOOLEAN DEFAULT false,
    manual_intervention_required BOOLEAN DEFAULT false,
    escalation_level INTEGER DEFAULT 0, -- 0=none, 1=supervisor, 2=management, 3=emergency
    
    -- Communication needs
    notification_sent BOOLEAN DEFAULT false,
    stakeholders_notified TEXT[], -- Who was notified
    public_announcement_required BOOLEAN DEFAULT false,
    
    -- Resolution planning
    resolution_strategies JSONB, -- Possible ways to resolve
    preferred_resolution VARCHAR(100),
    backup_plans TEXT[],
    
    -- Learning and improvement
    prevention_possible BOOLEAN,
    prevention_strategies TEXT[],
    system_improvements_needed TEXT[],
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'detected', -- 'detected', 'confirmed', 'resolving', 'resolved', 'false_alarm'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- AUTOMATED RESCHEDULING ENGINE
-- =============================================================================

-- AI-powered rescheduling recommendations and decisions
CREATE TABLE automated_rescheduling (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disruption_id UUID NOT NULL REFERENCES schedule_disruption_detection(id),
    
    -- Rescheduling metadata
    rescheduling_algorithm_version VARCHAR(50) NOT NULL,
    generation_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    
    -- Original schedule details
    original_sessions JSONB NOT NULL, -- Original sessions that need rescheduling
    total_sessions_affected INTEGER NOT NULL,
    original_timeframe JSONB,
    
    -- Rescheduling constraints
    hard_constraints JSONB NOT NULL, -- Constraints that cannot be violated
    soft_constraints JSONB NOT NULL, -- Constraints that are preferential
    priority_weights JSONB, -- Weights for different optimization criteria
    
    -- Alternative solutions generated
    solution_count INTEGER NOT NULL,
    recommended_solution JSONB NOT NULL, -- The top recommended solution
    alternative_solutions JSONB, -- Other viable solutions
    
    -- Solution quality metrics
    constraint_satisfaction_score DECIMAL(3,2),
    participant_satisfaction_estimate DECIMAL(3,2),
    facility_utilization_efficiency DECIMAL(3,2),
    total_displacement_hours INTEGER, -- Total hours sessions moved
    
    -- Resource availability analysis
    available_facilities JSONB,
    available_time_slots JSONB,
    coach_availability JSONB,
    athlete_availability_conflicts JSONB,
    
    -- Impact analysis
    training_quality_impact_score DECIMAL(3,2),
    participant_convenience_score DECIMAL(3,2),
    financial_impact DECIMAL(10,2),
    competitive_calendar_conflicts TEXT[],
    
    -- Implementation feasibility
    implementation_complexity VARCHAR(20), -- 'simple', 'moderate', 'complex', 'very_complex'
    required_approvals TEXT[], -- Who needs to approve this solution
    notification_requirements JSONB,
    logistical_requirements TEXT[],
    
    -- Timeline for implementation
    earliest_implementation_time TIMESTAMP,
    recommended_implementation_time TIMESTAMP,
    implementation_deadline TIMESTAMP,
    
    -- Risk assessment
    implementation_risks TEXT[],
    contingency_plans JSONB,
    rollback_plan TEXT,
    
    -- Stakeholder impact
    coach_impact_assessment JSONB,
    athlete_impact_assessment JSONB,
    facility_impact_assessment JSONB,
    family_impact_assessment JSONB, -- For youth athletes
    
    -- Communication plan
    notification_sequence JSONB, -- Order and timing of notifications
    communication_templates JSONB,
    feedback_collection_plan TEXT,
    
    -- Approval and implementation tracking
    approval_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'partially_approved'
    approved_by VARCHAR(255),
    approval_timestamp TIMESTAMP,
    implementation_status VARCHAR(50) DEFAULT 'not_started',
    
    -- Outcome tracking
    actual_implementation_time TIMESTAMP,
    implementation_success BOOLEAN,
    participant_feedback_summary JSONB,
    lessons_learned TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- TRAINING LOAD OPTIMIZATION
-- =============================================================================

-- Optimization of training loads in rescheduled sessions
CREATE TABLE training_load_optimization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rescheduling_id UUID REFERENCES automated_rescheduling(id),
    
    -- Optimization period
    optimization_date DATE NOT NULL,
    optimization_period_start DATE NOT NULL,
    optimization_period_end DATE NOT NULL,
    
    -- Current load analysis
    current_weekly_load DECIMAL(8,2) NOT NULL,
    target_weekly_load DECIMAL(8,2) NOT NULL,
    load_variation_percentage DECIMAL(5,2),
    
    -- Load distribution analysis
    current_load_distribution JSONB, -- How load is distributed across days
    recommended_load_distribution JSONB,
    load_balance_score DECIMAL(3,2) CHECK (load_balance_score BETWEEN 0 AND 1),
    
    -- Rescheduling impact on load
    additional_load_from_rescheduling DECIMAL(8,2),
    load_concentration_risk DECIMAL(3,2), -- Risk of too much load in short period
    recovery_time_impact_hours INTEGER,
    
    -- Individual athlete considerations
    athlete_fitness_level DECIMAL(3,2),
    recent_injury_history BOOLEAN DEFAULT false,
    fatigue_indicators JSONB,
    performance_trends JSONB,
    
    -- Load optimization recommendations
    recommended_load_adjustments JSONB,
    session_intensity_modifications JSONB,
    recovery_protocol_adjustments JSONB,
    rest_day_recommendations JSONB,
    
    -- Periodization considerations
    current_training_phase VARCHAR(100), -- 'base', 'build', 'peak', 'recovery', 'transition'
    phase_appropriate_load DECIMAL(8,2),
    periodization_compliance_score DECIMAL(3,2),
    
    -- Performance predictions
    predicted_performance_impact DECIMAL(5,2), -- % change in performance
    injury_risk_change DECIMAL(5,2), -- Change in injury risk
    adaptation_likelihood DECIMAL(3,2),
    
    -- Monitoring recommendations
    key_metrics_to_monitor TEXT[],
    monitoring_frequency VARCHAR(50),
    warning_thresholds JSONB,
    adjustment_triggers TEXT[],
    
    -- Implementation guidance
    gradual_implementation_plan JSONB,
    load_progression_strategy JSONB,
    backup_load_scenarios JSONB,
    
    -- Quality indicators
    optimization_confidence DECIMAL(3,2),
    data_completeness_score DECIMAL(3,2),
    model_reliability_score DECIMAL(3,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SCHEDULE CONFLICT RESOLUTION
-- =============================================================================

-- Resolution of scheduling conflicts between teams, coaches, and facilities
CREATE TABLE schedule_conflict_resolution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Conflict identification
    conflict_type VARCHAR(100) NOT NULL, -- 'facility_double_booking', 'coach_overlap', 'team_conflict', 'resource_shortage'
    conflict_severity VARCHAR(20) NOT NULL, -- 'minor', 'moderate', 'major', 'critical'
    detection_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Conflicting elements
    conflicting_sessions JSONB NOT NULL, -- Sessions in conflict
    conflicting_resources JSONB, -- Facilities, coaches, equipment in conflict
    affected_stakeholders JSONB, -- Teams, coaches, athletes affected
    
    -- Conflict details
    conflict_description TEXT NOT NULL,
    conflict_window JSONB, -- Time period of conflict
    resource_shortage_details JSONB,
    
    -- Resolution strategies evaluated
    resolution_options JSONB NOT NULL, -- Different resolution approaches
    recommended_resolution JSONB NOT NULL,
    resolution_rationale TEXT,
    
    -- Stakeholder preferences
    stakeholder_preferences JSONB, -- Preferences from affected parties
    priority_rankings JSONB, -- How to prioritize conflicting needs
    compromise_opportunities TEXT[],
    
    -- Resolution impact analysis
    impact_on_training_quality DECIMAL(3,2),
    impact_on_participant_satisfaction DECIMAL(3,2),
    financial_implications DECIMAL(10,2),
    long_term_consequences TEXT[],
    
    -- Implementation requirements
    approval_requirements TEXT[],
    notification_requirements JSONB,
    resource_reallocation_needed JSONB,
    timeline_for_resolution JSONB,
    
    -- Alternative arrangements
    backup_plans JSONB,
    contingency_resources JSONB,
    emergency_protocols TEXT[],
    
    -- Communication and negotiation
    stakeholder_communications JSONB,
    negotiation_points TEXT[],
    compromise_agreements JSONB,
    
    -- Resolution status and outcome
    resolution_status VARCHAR(50) DEFAULT 'identified', -- 'identified', 'analyzing', 'resolving', 'resolved', 'escalated'
    resolution_implemented_at TIMESTAMP,
    resolution_effectiveness DECIMAL(3,2),
    
    -- Follow-up and learning
    follow_up_actions TEXT[],
    prevention_measures TEXT[],
    system_improvements_identified TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- EMERGENCY SCHEDULE MODIFICATIONS
-- =============================================================================

-- Emergency schedule changes and crisis management
CREATE TABLE emergency_schedule_modifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Emergency details
    emergency_type VARCHAR(100) NOT NULL, -- 'severe_weather', 'facility_emergency', 'medical_emergency', 'security_threat', 'public_health'
    emergency_severity VARCHAR(20) NOT NULL, -- 'low', 'moderate', 'high', 'critical', 'catastrophic'
    declared_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Scope of impact
    geographic_impact JSONB, -- Areas affected
    temporal_impact JSONB, -- Time periods affected
    affected_sessions_count INTEGER NOT NULL,
    affected_participants_count INTEGER NOT NULL,
    
    -- Emergency response
    response_protocol_activated VARCHAR(100),
    emergency_contacts_notified JSONB,
    public_safety_coordination BOOLEAN DEFAULT false,
    media_communication_required BOOLEAN DEFAULT false,
    
    -- Immediate actions taken
    immediate_cancellations JSONB, -- Sessions immediately cancelled
    immediate_relocations JSONB, -- Sessions immediately moved
    safety_measures_implemented TEXT[],
    
    -- Communication response
    emergency_notifications_sent JSONB,
    communication_channels_used TEXT[],
    notification_timestamp TIMESTAMP,
    follow_up_communications JSONB,
    
    -- Rescheduling under emergency conditions
    emergency_rescheduling_constraints JSONB,
    available_emergency_facilities JSONB,
    modified_safety_protocols TEXT[],
    reduced_capacity_requirements JSONB,
    
    -- Resource mobilization
    emergency_resources_deployed JSONB,
    backup_equipment_utilized JSONB,
    additional_staff_called_in JSONB,
    external_support_requested JSONB,
    
    -- Participant safety and welfare
    participant_safety_status JSONB,
    medical_support_provided JSONB,
    transportation_arrangements JSONB,
    shelter_arrangements JSONB,
    
    -- Recovery planning
    damage_assessment JSONB,
    facility_inspection_required BOOLEAN DEFAULT false,
    recovery_timeline_estimate JSONB,
    return_to_normal_operations_plan TEXT,
    
    -- Financial impact
    emergency_costs DECIMAL(10,2),
    insurance_claims_initiated JSONB,
    refund_policies_activated JSONB,
    financial_assistance_programs JSONB,
    
    -- Documentation and reporting
    incident_report_filed BOOLEAN DEFAULT false,
    regulatory_reporting_required BOOLEAN DEFAULT false,
    insurance_documentation JSONB,
    media_statements JSONB,
    
    -- Lessons learned and improvement
    response_effectiveness_evaluation JSONB,
    areas_for_improvement TEXT[],
    protocol_updates_needed TEXT[],
    training_needs_identified TEXT[],
    
    -- Resolution and follow-up
    emergency_resolved_at TIMESTAMP,
    normal_operations_resumed_at TIMESTAMP,
    final_impact_assessment JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Weather data indexes
CREATE INDEX idx_weather_data_location_time ON weather_data(latitude, longitude, forecast_timestamp);
CREATE INDEX idx_weather_data_forecast_type ON weather_data(forecast_type, forecast_timestamp);
CREATE INDEX idx_weather_data_severe_alerts ON weather_data(forecast_timestamp) WHERE severe_weather_alerts IS NOT NULL;
CREATE INDEX idx_weather_data_training_suitability ON weather_data(training_suitability_score, forecast_timestamp);

-- Training facilities indexes
CREATE INDEX idx_facilities_type ON training_facilities(facility_type);
CREATE INDEX idx_facilities_location ON training_facilities(latitude, longitude);
CREATE INDEX idx_facilities_indoor ON training_facilities(indoor_facility);
CREATE INDEX idx_facilities_active ON training_facilities(is_active);

-- Schedule disruption indexes
CREATE INDEX idx_disruption_type_severity ON schedule_disruption_detection(disruption_type, severity_level);
CREATE INDEX idx_disruption_status ON schedule_disruption_detection(status, first_detected_at);
CREATE INDEX idx_disruption_affected_sessions ON schedule_disruption_detection USING GIN(affected_sessions);

-- Automated rescheduling indexes
CREATE INDEX idx_rescheduling_disruption ON automated_rescheduling(disruption_id);
CREATE INDEX idx_rescheduling_status ON automated_rescheduling(approval_status, implementation_status);
CREATE INDEX idx_rescheduling_confidence ON automated_rescheduling(confidence_score);

-- Training load optimization indexes
CREATE INDEX idx_load_optimization_user_date ON training_load_optimization(user_id, optimization_date);
CREATE INDEX idx_load_optimization_rescheduling ON training_load_optimization(rescheduling_id);

-- Conflict resolution indexes
CREATE INDEX idx_conflict_resolution_type ON schedule_conflict_resolution(conflict_type, conflict_severity);
CREATE INDEX idx_conflict_resolution_status ON schedule_conflict_resolution(resolution_status);

-- Emergency modifications indexes
CREATE INDEX idx_emergency_modifications_type ON emergency_schedule_modifications(emergency_type, emergency_severity);
CREATE INDEX idx_emergency_modifications_declared ON emergency_schedule_modifications(declared_at);

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Current weather impact on training
CREATE OR REPLACE VIEW current_weather_training_impact AS
SELECT 
    wd.location_name,
    wd.temperature_celsius,
    wd.precipitation_mm,
    wd.precipitation_probability,
    wd.wind_speed_kmh,
    wd.training_suitability_score,
    wd.outdoor_training_recommended,
    wd.safety_concerns,
    wd.recommended_modifications,
    CASE 
        WHEN wd.training_suitability_score >= 0.8 THEN 'excellent'
        WHEN wd.training_suitability_score >= 0.6 THEN 'good' 
        WHEN wd.training_suitability_score >= 0.4 THEN 'moderate'
        WHEN wd.training_suitability_score >= 0.2 THEN 'poor'
        ELSE 'unsuitable'
    END as training_conditions
FROM weather_data wd
WHERE wd.forecast_type = 'current'
  AND wd.forecast_timestamp = (
      SELECT MAX(forecast_timestamp)
      FROM weather_data wd2
      WHERE wd2.location_name = wd.location_name
        AND wd2.forecast_type = 'current'
  );

-- Active schedule disruptions dashboard
CREATE OR REPLACE VIEW active_disruptions_dashboard AS
SELECT 
    sdd.id,
    sdd.disruption_type,
    sdd.severity_level,
    sdd.description,
    sdd.sessions_affected_count,
    sdd.athletes_affected_count,
    sdd.first_detected_at,
    sdd.status,
    ar.approval_status as rescheduling_status,
    ar.confidence_score as rescheduling_confidence,
    EXTRACT(EPOCH FROM (NOW() - sdd.first_detected_at))/3600 as hours_since_detection
FROM schedule_disruption_detection sdd
LEFT JOIN automated_rescheduling ar ON sdd.id = ar.disruption_id
WHERE sdd.status IN ('detected', 'confirmed', 'resolving')
ORDER BY sdd.severity_level DESC, sdd.first_detected_at ASC;

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================

-- Insert sample training facilities
INSERT INTO training_facilities (
    facility_name, facility_type, address, max_capacity, indoor_facility, 
    surface_type, lighting_available, requires_booking
) VALUES
('Main Training Field', 'outdoor_field', '{"street": "123 Sports Ave", "city": "Sportsville", "state": "CA", "zip": "90210"}'::jsonb, 
 50, false, 'artificial_turf', true, true),
('Indoor Training Center', 'indoor_gym', '{"street": "456 Athletic Blvd", "city": "Sportsville", "state": "CA", "zip": "90210"}'::jsonb,
 30, true, 'gym_floor', true, true),
('Weight Room', 'weight_room', '{"street": "789 Fitness St", "city": "Sportsville", "state": "CA", "zip": "90210"}'::jsonb,
 20, true, 'rubber_flooring', true, true);

-- Insert sample risk factors for weather monitoring
INSERT INTO weather_data (
    location_name, latitude, longitude, timezone, forecast_timestamp, data_source,
    forecast_type, temperature_celsius, precipitation_probability, wind_speed_kmh, training_suitability_score
) VALUES
('Sportsville Training Complex', 34.0522, -118.2437, 'America/Los_Angeles', 
 CURRENT_TIMESTAMP, 'openweathermap', 'current', 22.5, 10, 8.0, 0.9),
('Sportsville Training Complex', 34.0522, -118.2437, 'America/Los_Angeles', 
 CURRENT_TIMESTAMP + INTERVAL '1 hour', 'openweathermap', 'hourly', 23.0, 15, 12.0, 0.85);
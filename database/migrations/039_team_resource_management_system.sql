-- Migration: Team Resource Management & Shared Assets System
-- This migration adds comprehensive team resource management for community ownership and scale efficiency

-- 1. TEAM RESOURCE INVENTORY
CREATE TABLE IF NOT EXISTS team_resources (
    id SERIAL PRIMARY KEY,
    resource_name VARCHAR(200) NOT NULL,
    resource_type VARCHAR(100) NOT NULL, -- 'equipment', 'facility', 'service', 'technology', 'expertise'
    resource_category VARCHAR(100) NOT NULL, -- 'recovery', 'training', 'nutrition', 'medical', 'analytics'
    description TEXT NOT NULL,
    one_time_cost DECIMAL(10,2) NOT NULL,
    per_athlete_share DECIMAL(8,2) NOT NULL,
    total_athletes_capacity INTEGER NOT NULL,
    current_utilization_percentage DECIMAL(5,2) DEFAULT 0,
    ownership_model VARCHAR(50) NOT NULL, -- 'community_owned', 'team_owned', 'shared_lease', 'donated'
    location VARCHAR(200),
    availability_status VARCHAR(50) DEFAULT 'available', -- 'available', 'in_use', 'maintenance', 'out_of_order'
    maintenance_schedule TEXT[],
    insurance_coverage JSONB,
    depreciation_years INTEGER,
    expected_lifespan_years INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RESOURCE BOOKINGS AND SCHEDULING
CREATE TABLE IF NOT EXISTS resource_bookings (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES team_resources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    booking_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    booking_purpose VARCHAR(200) NOT NULL,
    booking_type VARCHAR(50) NOT NULL, -- 'individual', 'group', 'team', 'event'
    participants_count INTEGER DEFAULT 1,
    special_requirements TEXT[],
    booking_status VARCHAR(50) DEFAULT 'confirmed', -- 'pending', 'confirmed', 'cancelled', 'completed'
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RESOURCE MAINTENANCE LOGS
CREATE TABLE IF NOT EXISTS resource_maintenance_logs (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES team_resources(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(100) NOT NULL, -- 'routine', 'preventive', 'repair', 'inspection', 'calibration'
    maintenance_date DATE NOT NULL,
    performed_by VARCHAR(200),
    cost DECIMAL(8,2),
    description TEXT NOT NULL,
    parts_replaced TEXT[],
    next_maintenance_date DATE,
    maintenance_status VARCHAR(50) DEFAULT 'completed', -- 'scheduled', 'in_progress', 'completed', 'overdue'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RESOURCE UTILIZATION TRACKING
CREATE TABLE IF NOT EXISTS resource_utilization_tracking (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES team_resources(id) ON DELETE CASCADE,
    tracking_date DATE NOT NULL,
    total_bookings INTEGER NOT NULL,
    total_hours_utilized DECIMAL(5,2) NOT NULL,
    peak_usage_hours JSONB, -- peak usage times
    average_session_duration DECIMAL(5,2),
    utilization_percentage DECIMAL(5,2) NOT NULL,
    revenue_generated DECIMAL(8,2) DEFAULT 0,
    maintenance_hours DECIMAL(5,2) DEFAULT 0,
    downtime_hours DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. COMMUNITY RESOURCE ACCESS LEVELS
CREATE TABLE IF NOT EXISTS resource_access_levels (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL REFERENCES team_resources(id) ON DELETE CASCADE,
    access_level VARCHAR(50) NOT NULL, -- 'full_access', 'limited_access', 'supervised_access', 'no_access'
    access_granted_date DATE NOT NULL,
    access_expiry_date DATE,
    granted_by UUID REFERENCES users(id),
    access_restrictions TEXT[],
    training_requirements TEXT[],
    safety_certifications TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. RESOURCE SHARING AGREEMENTS
CREATE TABLE IF NOT EXISTS resource_sharing_agreements (
    id SERIAL PRIMARY KEY,
    agreement_name VARCHAR(200) NOT NULL,
    resource_id INTEGER NOT NULL REFERENCES team_resources(id) ON DELETE CASCADE,
    agreement_type VARCHAR(100) NOT NULL, -- 'community_ownership', 'time_sharing', 'cost_sharing', 'donation'
    parties_involved TEXT[] NOT NULL,
    agreement_start_date DATE NOT NULL,
    agreement_end_date DATE,
    cost_sharing_model VARCHAR(100), -- 'equal_split', 'usage_based', 'tiered_access', 'free'
    usage_rights TEXT[],
    maintenance_responsibilities TEXT[],
    insurance_requirements TEXT[],
    termination_conditions TEXT[],
    agreement_status VARCHAR(50) DEFAULT 'active', -- 'draft', 'active', 'expired', 'terminated'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. RESOURCE PERFORMANCE METRICS
CREATE TABLE IF NOT EXISTS resource_performance_metrics (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES team_resources(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    metric_type VARCHAR(100) NOT NULL, -- 'efficiency', 'reliability', 'cost_effectiveness', 'user_satisfaction'
    metric_value DECIMAL(8,2) NOT NULL,
    metric_unit VARCHAR(50),
    benchmark_value DECIMAL(8,2),
    performance_rating VARCHAR(20) CHECK (performance_rating IN ('excellent', 'good', 'average', 'poor', 'critical')),
    contributing_factors TEXT[],
    improvement_actions TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. RESOURCE INVENTORY AUDITS
CREATE TABLE IF NOT EXISTS resource_inventory_audits (
    id SERIAL PRIMARY KEY,
    audit_date DATE NOT NULL,
    auditor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    audit_type VARCHAR(100) NOT NULL, -- 'annual', 'quarterly', 'incident_based', 'compliance'
    total_resources_audited INTEGER NOT NULL,
    resources_in_good_condition INTEGER NOT NULL,
    resources_needing_maintenance INTEGER NOT NULL,
    resources_out_of_order INTEGER NOT NULL,
    total_asset_value DECIMAL(12,2) NOT NULL,
    depreciation_value DECIMAL(12,2) NOT NULL,
    net_asset_value DECIMAL(12,2) NOT NULL,
    audit_findings TEXT[],
    recommendations TEXT[],
    next_audit_date DATE,
    audit_status VARCHAR(50) DEFAULT 'completed', -- 'scheduled', 'in_progress', 'completed', 'overdue'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_team_resources_type_category ON team_resources(resource_type, resource_category);
CREATE INDEX IF NOT EXISTS idx_team_resources_availability ON team_resources(availability_status);
CREATE INDEX IF NOT EXISTS idx_resource_bookings_resource_time ON resource_bookings(resource_id, booking_start_time, booking_end_time);
CREATE INDEX IF NOT EXISTS idx_resource_bookings_user ON resource_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_maintenance_resource_date ON resource_maintenance_logs(resource_id, maintenance_date);
CREATE INDEX IF NOT EXISTS idx_resource_utilization_resource_date ON resource_utilization_tracking(resource_id, tracking_date);
CREATE INDEX IF NOT EXISTS idx_resource_access_user_resource ON resource_access_levels(user_id, resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_sharing_resource ON resource_sharing_agreements(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_performance_resource_date ON resource_performance_metrics(resource_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_resource_audits_date ON resource_inventory_audits(audit_date);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_resource_bookings_unique ON resource_bookings(resource_id, booking_start_time, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_resource_access_unique ON resource_access_levels(user_id, resource_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_resource_utilization_unique ON resource_utilization_tracking(resource_id, tracking_date);

-- Insert sample team resources based on the performance plan
INSERT INTO team_resources (resource_name, resource_type, resource_category, description, one_time_cost, per_athlete_share, total_athletes_capacity, ownership_model, location, maintenance_schedule, expected_lifespan_years) VALUES
('Mobile Cryo-Sauna Trailer', 'equipment', 'recovery', 'Portable cryotherapy unit for post-tournament recovery', 70000.00, 70.00, 1000, 'community_owned', 'Mobile - travels to tournaments', ARRAY['monthly_cleaning', 'quarterly_inspection', 'annual_calibration'], 8),
('Infrared Sauna Cabin (x3)', 'facility', 'recovery', 'Three infrared sauna units for year-round recovery sessions', 18000.00, 18.00, 1000, 'community_owned', 'Main training facility', ARRAY['weekly_cleaning', 'monthly_inspection', 'quarterly_maintenance'], 10),
('Team Hyperbaric Chamber', 'equipment', 'recovery', 'Hyperbaric oxygen therapy for injury and soft-tissue recovery', 22000.00, 22.00, 1000, 'community_owned', 'Medical wing', ARRAY['daily_inspection', 'weekly_cleaning', 'monthly_calibration'], 12),
('GPS Team Set (30 units)', 'technology', 'analytics', 'GPS tracking units for workload monitoring during practices', 15000.00, 15.00, 1000, 'community_owned', 'Equipment room', ARRAY['weekly_charging', 'monthly_calibration', 'quarterly_software_update'], 5),
('Group Dietitian Webinar Series (6)', 'service', 'nutrition', 'Six nutrition webinars covering plant-based and omnivore personalization', 6000.00, 6.00, 1000, 'community_owned', 'Virtual platform', ARRAY['pre_webinar_testing', 'post_webinar_feedback'], 1),
('Cognitive-Training Platform (1-yr license)', 'technology', 'training', 'Unlimited user seats for cognitive training and brain games', 10000.00, 10.00, 1000, 'community_owned', 'Online platform', ARRAY['monthly_software_update', 'quarterly_performance_review'], 1);

-- Create function to calculate resource utilization
CREATE OR REPLACE FUNCTION calculate_resource_utilization(
    resource_id_param INTEGER,
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB AS $$
DECLARE
    utilization_data JSONB;
    total_hours DECIMAL := 0;
    total_bookings INTEGER := 0;
    peak_hours JSONB;
    avg_duration DECIMAL;
BEGIN
    -- Calculate total utilization
    SELECT 
        COALESCE(SUM(EXTRACT(EPOCH FROM (booking_end_time - booking_start_time)) / 3600), 0),
        COUNT(*),
        AVG(EXTRACT(EPOCH FROM (booking_end_time - booking_start_time)) / 3600)
    INTO total_hours, total_bookings, avg_duration
    FROM resource_bookings
    WHERE resource_id = resource_id_param
    AND booking_start_time >= start_date
    AND booking_end_time <= end_date
    AND booking_status = 'completed';
    
    -- Get peak usage hours
    SELECT jsonb_build_object(
        'peak_hour', EXTRACT(HOUR FROM peak_time),
        'peak_bookings', peak_count
    ) INTO peak_hours
    FROM (
        SELECT 
            EXTRACT(HOUR FROM booking_start_time) as peak_time,
            COUNT(*) as peak_count
        FROM resource_bookings
        WHERE resource_id = resource_id_param
        AND booking_start_time >= start_date
        AND booking_end_time <= end_date
        AND booking_status = 'completed'
        GROUP BY EXTRACT(HOUR FROM booking_start_time)
        ORDER BY peak_count DESC
        LIMIT 1
    ) peak_data;
    
    -- Build utilization data
    utilization_data := jsonb_build_object(
        'resource_id', resource_id_param,
        'period_start', start_date,
        'period_end', end_date,
        'total_hours_utilized', total_hours,
        'total_bookings', total_bookings,
        'average_session_duration', avg_duration,
        'utilization_percentage', CASE 
            WHEN (end_date - start_date) * 24 > 0 
            THEN (total_hours / ((end_date - start_date) * 24)) * 100
            ELSE 0 
        END,
        'peak_usage_hours', peak_hours,
        'efficiency_score', CASE 
            WHEN total_bookings > 0 THEN LEAST(100, (total_hours / total_bookings) * 10)
            ELSE 0 
        END
    );
    
    -- Insert utilization tracking record
    INSERT INTO resource_utilization_tracking (
        resource_id, tracking_date, total_bookings, total_hours_utilized,
        average_session_duration, utilization_percentage, peak_usage_hours
    ) VALUES (
        resource_id_param, end_date, total_bookings, total_hours,
        avg_duration, 
        CASE 
            WHEN (end_date - start_date) * 24 > 0 
            THEN (total_hours / ((end_date - start_date) * 24)) * 100
            ELSE 0 
        END,
        peak_hours
    );
    
    RETURN utilization_data;
END;
$$ LANGUAGE plpgsql;

-- Create function to check resource availability
CREATE OR REPLACE FUNCTION check_resource_availability(
    resource_id_param INTEGER,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE
) RETURNS JSONB AS $$
DECLARE
    availability_data JSONB;
    conflicting_bookings INTEGER := 0;
    resource_info RECORD;
BEGIN
    -- Get resource information
    SELECT 
        resource_name,
        availability_status,
        current_utilization_percentage
    INTO resource_info
    FROM team_resources
    WHERE id = resource_id_param;
    
    -- Check for conflicting bookings
    SELECT COUNT(*)
    INTO conflicting_bookings
    FROM resource_bookings
    WHERE resource_id = resource_id_param
    AND booking_status IN ('confirmed', 'pending')
    AND (
        (start_time BETWEEN booking_start_time AND booking_end_time) OR
        (end_time BETWEEN booking_start_time AND booking_end_time) OR
        (start_time <= booking_start_time AND end_time >= booking_end_time)
    );
    
    -- Build availability data
    availability_data := jsonb_build_object(
        'resource_id', resource_id_param,
        'resource_name', resource_info.resource_name,
        'requested_start_time', start_time,
        'requested_end_time', end_time,
        'availability_status', resource_info.availability_status,
        'current_utilization', resource_info.current_utilization_percentage,
        'conflicting_bookings', conflicting_bookings,
        'is_available', conflicting_bookings = 0 AND resource_info.availability_status = 'available',
        'next_available_slot', CASE 
            WHEN conflicting_bookings > 0 THEN (
                SELECT MIN(booking_end_time) + INTERVAL '1 hour'
                FROM resource_bookings
                WHERE resource_id = resource_id_param
                AND booking_status IN ('confirmed', 'pending')
                AND booking_end_time > start_time
            )
            ELSE start_time
        END
    );
    
    RETURN availability_data;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate resource ROI
CREATE OR REPLACE FUNCTION calculate_resource_roi(
    resource_id_param INTEGER,
    analysis_period_months INTEGER DEFAULT 12
) RETURNS JSONB AS $$
DECLARE
    roi_data JSONB;
    resource_record RECORD;
    total_revenue DECIMAL := 0;
    total_cost DECIMAL := 0;
    total_maintenance_cost DECIMAL := 0;
    roi_percentage DECIMAL;
    payback_period_months INTEGER;
BEGIN
    -- Get resource information
    SELECT 
        one_time_cost,
        per_athlete_share,
        total_athletes_capacity,
        expected_lifespan_years
    INTO resource_record
    FROM team_resources
    WHERE id = resource_id_param;
    
    -- Calculate total costs
    total_cost := resource_record.one_time_cost;
    
    -- Get maintenance costs for the period
    SELECT COALESCE(SUM(cost), 0)
    INTO total_maintenance_cost
    FROM resource_maintenance_logs
    WHERE resource_id = resource_id_param
    AND maintenance_date >= CURRENT_DATE - INTERVAL '1 month' * analysis_period_months;
    
    -- Get revenue generated (if any)
    SELECT COALESCE(SUM(revenue_generated), 0)
    INTO total_revenue
    FROM resource_utilization_tracking
    WHERE resource_id = resource_id_param
    AND tracking_date >= CURRENT_DATE - INTERVAL '1 month' * analysis_period_months;
    
    -- Calculate ROI
    roi_percentage := CASE 
        WHEN (total_cost + total_maintenance_cost) > 0 
        THEN ((total_revenue - (total_cost + total_maintenance_cost)) / (total_cost + total_maintenance_cost)) * 100
        ELSE 0 
    END;
    
    -- Calculate payback period
    payback_period_months := CASE 
        WHEN total_revenue > 0 
        THEN CEIL((total_cost + total_maintenance_cost) / (total_revenue / analysis_period_months))
        ELSE NULL 
    END;
    
    -- Build ROI data
    roi_data := jsonb_build_object(
        'resource_id', resource_id_param,
        'analysis_period_months', analysis_period_months,
        'one_time_cost', resource_record.one_time_cost,
        'total_maintenance_cost', total_maintenance_cost,
        'total_revenue', total_revenue,
        'net_profit', total_revenue - (total_cost + total_maintenance_cost),
        'roi_percentage', roi_percentage,
        'payback_period_months', payback_period_months,
        'per_athlete_cost', resource_record.per_athlete_share,
        'community_benefit_score', CASE 
            WHEN roi_percentage > 50 THEN 'excellent'
            WHEN roi_percentage > 20 THEN 'good'
            WHEN roi_percentage > 0 THEN 'positive'
            ELSE 'negative'
        END,
        'recommendations', ARRAY[
            'Monitor utilization rates to maximize community benefit',
            'Consider maintenance schedule optimization',
            'Evaluate pricing strategy if revenue generation is needed'
        ]
    );
    
    RETURN roi_data;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_team_resources_updated_at 
    BEFORE UPDATE ON team_resources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_bookings_updated_at 
    BEFORE UPDATE ON resource_bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_access_levels_updated_at 
    BEFORE UPDATE ON resource_access_levels 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_sharing_agreements_updated_at 
    BEFORE UPDATE ON resource_sharing_agreements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE team_resources IS 'Comprehensive inventory of team resources and shared assets';
COMMENT ON TABLE resource_bookings IS 'Resource booking and scheduling system for community access';
COMMENT ON TABLE resource_maintenance_logs IS 'Maintenance tracking and scheduling for team resources';
COMMENT ON TABLE resource_utilization_tracking IS 'Utilization metrics and performance tracking for resources';
COMMENT ON TABLE resource_access_levels IS 'User access levels and permissions for team resources';
COMMENT ON TABLE resource_sharing_agreements IS 'Legal agreements and terms for resource sharing';
COMMENT ON TABLE resource_performance_metrics IS 'Performance metrics and benchmarking for resources';
COMMENT ON TABLE resource_inventory_audits IS 'Regular audits and compliance checks for resource inventory';
COMMENT ON FUNCTION calculate_resource_utilization IS 'Calculate resource utilization metrics for specified period';
COMMENT ON FUNCTION check_resource_availability IS 'Check resource availability for requested time slot';
COMMENT ON FUNCTION calculate_resource_roi IS 'Calculate return on investment for team resources';

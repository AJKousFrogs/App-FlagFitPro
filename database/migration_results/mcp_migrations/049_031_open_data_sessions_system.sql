-- =============================================================================
-- OPEN DATA SESSIONS SYSTEM
-- Migration: 031_open_data_sessions_system.sql
-- Supports importing open-source sport-science datasets and computing flag-football metrics
-- =============================================================================

-- Sessions table for imported open-source data
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session date
    date DATE NOT NULL,
    
    -- RPE (Rate of Perceived Exertion) - filled post-session
    rpe INTEGER CHECK (rpe >= 0 AND rpe <= 10),
    
    -- Computed metrics from imported data
    total_volume DECIMAL(10,2), -- Total distance in meters
    high_speed_distance DECIMAL(10,2), -- Distance at high speed (>5.5 m/s) in meters
    sprint_count INTEGER, -- Number of sprint efforts (>7.0 m/s)
    duration_minutes INTEGER, -- Session duration in minutes
    
    -- Metadata
    data_source VARCHAR(100), -- Source of the data (e.g., 'gps_tracker', 'open_dataset')
    raw_data JSONB, -- Store original dataset for reference
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_athlete_date ON sessions(athlete_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_athlete ON sessions(athlete_id);

-- Comments
COMMENT ON TABLE sessions IS 'Stores training sessions imported from open-source datasets with computed flag-football metrics';
COMMENT ON COLUMN sessions.total_volume IS 'Total distance covered in meters';
COMMENT ON COLUMN sessions.high_speed_distance IS 'Distance covered at high speed (>5.5 m/s) in meters';
COMMENT ON COLUMN sessions.sprint_count IS 'Number of sprint efforts (>7.0 m/s)';
COMMENT ON COLUMN sessions.rpe IS 'Rate of Perceived Exertion (0-10 scale), filled post-session';


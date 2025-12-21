-- Create injuries table for tracking player injuries
-- This table stores injury reports that can be used for:
-- - Wellness statistics and analytics
-- - AI-Powered Training Scheduler adjustments
-- - Periodization modifications

CREATE TABLE IF NOT EXISTS injuries (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- Body part (ankle, knee, hamstring, etc.)
    severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 10), -- 1-10 scale
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, recovering, monitoring, recovered
    start_date DATE NOT NULL,
    recovery_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for common queries
    CONSTRAINT valid_status CHECK (status IN ('active', 'recovering', 'monitoring', 'recovered'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_injuries_user_id ON injuries(user_id);
CREATE INDEX IF NOT EXISTS idx_injuries_status ON injuries(status);
CREATE INDEX IF NOT EXISTS idx_injuries_start_date ON injuries(start_date);
CREATE INDEX IF NOT EXISTS idx_injuries_user_status ON injuries(user_id, status);
CREATE INDEX IF NOT EXISTS idx_injuries_active ON injuries(user_id, status) WHERE status IN ('active', 'recovering', 'monitoring');

-- Add comment for documentation
COMMENT ON TABLE injuries IS 'Stores player injury reports for wellness tracking and training schedule adjustments';
COMMENT ON COLUMN injuries.severity IS 'Pain/injury severity on a scale of 1-10';
COMMENT ON COLUMN injuries.status IS 'Injury status: active (currently affecting training), recovering (improving), monitoring (minor, watching closely), recovered (healed)';


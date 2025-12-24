-- =============================================================================
-- READINESS SCORE SYSTEM
-- Migration: 033_readiness_score_system.sql
-- Evidence-based readiness scoring combining session-RPE, ACWR, wellness, and game proximity
-- =============================================================================

-- Add RPE field to training_sessions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_sessions' AND column_name = 'rpe'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN rpe INTEGER CHECK (rpe BETWEEN 1 AND 10);
    COMMENT ON COLUMN training_sessions.rpe IS 'Rate of Perceived Exertion (1-10 scale) for session-RPE load calculation';
  END IF;
END $$;

-- Wellness logs table (if wellness_data exists, we'll use that structure)
-- Create wellness_logs for readiness-specific fields
CREATE TABLE IF NOT EXISTS wellness_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    
    -- Core wellness metrics for readiness
    fatigue INTEGER NOT NULL CHECK (fatigue BETWEEN 1 AND 10), -- 1 = very fresh, 10 = exhausted
    sleep_quality INTEGER NOT NULL CHECK (sleep_quality BETWEEN 1 AND 10), -- 1 = poor, 10 = excellent
    soreness INTEGER NOT NULL CHECK (soreness BETWEEN 1 AND 10), -- 1 = no soreness, 10 = very sore
    
    -- Optional sleep hours
    sleep_hours NUMERIC(4,1),
    
    -- Additional wellness fields (optional, can map from wellness_data)
    energy INTEGER CHECK (energy BETWEEN 1 AND 10),
    stress INTEGER CHECK (stress BETWEEN 1 AND 10),
    mood INTEGER CHECK (mood BETWEEN 1 AND 10),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (athlete_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_wellness_logs_athlete_date ON wellness_logs(athlete_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_wellness_logs_date ON wellness_logs(log_date DESC);

COMMENT ON TABLE wellness_logs IS 'Daily wellness logs for readiness score calculation';
COMMENT ON COLUMN wellness_logs.fatigue IS 'Fatigue level (1 = very fresh, 10 = exhausted)';
COMMENT ON COLUMN wellness_logs.sleep_quality IS 'Sleep quality rating (1 = poor, 10 = excellent)';
COMMENT ON COLUMN wellness_logs.soreness IS 'Muscle soreness (1 = none, 10 = very sore)';

-- Function to sync wellness_data to wellness_logs (if wellness_data exists)
CREATE OR REPLACE FUNCTION sync_wellness_to_readiness()
RETURNS TRIGGER AS $$
BEGIN
    -- Map wellness_data fields to wellness_logs
    -- fatigue: use energy inverted (10 - energy) or soreness as proxy
    -- sleep_quality: use sleep field directly
    -- soreness: use soreness field directly
    INSERT INTO wellness_logs (
        athlete_id,
        log_date,
        fatigue,
        sleep_quality,
        soreness,
        sleep_hours,
        energy,
        stress,
        mood
    )
    VALUES (
        NEW.user_id::uuid,
        NEW.date,
        COALESCE(10 - NEW.energy, NEW.soreness, 5), -- Estimate fatigue
        NEW.sleep,
        NEW.soreness,
        NULL, -- sleep_hours not in wellness_data
        NEW.energy,
        NEW.stress,
        NEW.mood
    )
    ON CONFLICT (athlete_id, log_date) 
    DO UPDATE SET
        fatigue = COALESCE(10 - NEW.energy, NEW.soreness, 5),
        sleep_quality = NEW.sleep,
        soreness = NEW.soreness,
        energy = NEW.energy,
        stress = NEW.stress,
        mood = NEW.mood;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if wellness_data table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wellness_data') THEN
        DROP TRIGGER IF EXISTS trigger_sync_wellness_to_readiness ON wellness_data;
        CREATE TRIGGER trigger_sync_wellness_to_readiness
            AFTER INSERT OR UPDATE ON wellness_data
            FOR EACH ROW
            EXECUTE FUNCTION sync_wellness_to_readiness();
    END IF;
END $$;

-- Fixtures table for game proximity calculation
CREATE TABLE IF NOT EXISTS fixtures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    athlete_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Optional: individual athlete fixtures
    
    opponent TEXT,
    game_start TIMESTAMPTZ NOT NULL,
    location TEXT,
    game_type VARCHAR(50), -- 'game', 'scrimmage', 'tournament', etc.
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fixtures_team ON fixtures(team_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_athlete ON fixtures(athlete_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_game_start ON fixtures(game_start);

COMMENT ON TABLE fixtures IS 'Game fixtures for calculating game proximity in readiness scores';

-- Readiness scores table (materialized daily scores)
CREATE TABLE IF NOT EXISTS readiness_scores (
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day DATE NOT NULL,
    
    -- Composite score (0-100)
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    
    -- Categorical outputs
    level TEXT NOT NULL CHECK (level IN ('low', 'moderate', 'high')),
    suggestion TEXT NOT NULL CHECK (suggestion IN ('deload', 'maintain', 'push')),
    
    -- Component metrics
    acwr NUMERIC(6,2),
    acute_load NUMERIC(10,2),
    chronic_load NUMERIC(10,2),
    
    -- Component scores (for transparency)
    workload_score INTEGER CHECK (workload_score BETWEEN 0 AND 100),
    wellness_score INTEGER CHECK (wellness_score BETWEEN 0 AND 100),
    sleep_score INTEGER CHECK (sleep_score BETWEEN 0 AND 100),
    proximity_score INTEGER CHECK (proximity_score BETWEEN 0 AND 100),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (athlete_id, day)
);

CREATE INDEX IF NOT EXISTS idx_readiness_scores_athlete ON readiness_scores(athlete_id, day DESC);
CREATE INDEX IF NOT EXISTS idx_readiness_scores_level ON readiness_scores(level);
CREATE INDEX IF NOT EXISTS idx_readiness_scores_day ON readiness_scores(day DESC);

COMMENT ON TABLE readiness_scores IS 'Daily readiness scores combining workload, wellness, sleep, and game proximity';
COMMENT ON COLUMN readiness_scores.score IS 'Composite readiness score (0-100)';
COMMENT ON COLUMN readiness_scores.level IS 'Readiness level: low, moderate, or high';
COMMENT ON COLUMN readiness_scores.suggestion IS 'Training suggestion: deload, maintain, or push';
COMMENT ON COLUMN readiness_scores.acwr IS 'Acute:Chronic Workload Ratio';
COMMENT ON COLUMN readiness_scores.acute_load IS '7-day acute load (session-RPE sum)';
COMMENT ON COLUMN readiness_scores.chronic_load IS '28-day chronic load (weekly average)';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_readiness_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_readiness_scores_updated_at
    BEFORE UPDATE ON readiness_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_readiness_scores_updated_at();


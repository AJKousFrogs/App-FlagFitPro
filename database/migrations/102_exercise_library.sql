-- ============================================================================
-- Migration 102: Exercise Library for Daily Protocol System
-- ============================================================================
-- Creates the master exercise library with video references and instruction text.
-- Supports Morning Mobility, Foam Rolling, Main Session, and Recovery exercises.
-- ============================================================================

-- ============================================================================
-- EXERCISES TABLE - Master exercise library
-- ============================================================================
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic info
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
    category TEXT NOT NULL CHECK (category IN (
        'mobility', 'foam_roll', 'warm_up', 'strength', 
        'skill', 'conditioning', 'plyometric', 'recovery', 'cool_down'
    )),
    subcategory TEXT, -- e.g., 'hip_mobility', 'upper_body', 'route_running'
    
    -- Video reference
    video_url TEXT, -- YouTube URL
    video_id TEXT, -- YouTube video ID for embedding
    video_duration_seconds INTEGER,
    thumbnail_url TEXT,
    
    -- Instruction text (HOW / FEEL / COMPENSATION format)
    how_text TEXT NOT NULL, -- How to perform the exercise
    feel_text TEXT, -- What the athlete should feel
    compensation_text TEXT, -- Common mistakes to avoid
    
    -- Default prescription (can be overridden by AI)
    default_sets INTEGER DEFAULT 1,
    default_reps INTEGER,
    default_hold_seconds INTEGER,
    default_duration_seconds INTEGER, -- For timed exercises like foam rolling
    
    -- Equipment and difficulty
    equipment_required TEXT[] DEFAULT '{}', -- e.g., ['foam_roller', 'resistance_band']
    difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN (
        'beginner', 'intermediate', 'advanced'
    )),
    
    -- Targeting
    target_muscles TEXT[] DEFAULT '{}', -- e.g., ['hip_flexors', 'quads', 'glutes']
    position_specific TEXT[], -- e.g., ['QB', 'WR'] or NULL for all positions
    
    -- Load contribution (for ACWR calculation)
    load_contribution_au INTEGER DEFAULT 0, -- Arbitrary units per set
    is_high_intensity BOOLEAN DEFAULT false,
    
    -- Metadata
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(category, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(how_text, '')), 'C')
    ) STORED
);

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_exercises_search ON exercises USING GIN (search_vector);

-- Create index for category lookups
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises (category) WHERE active = true;

-- Create index for position-specific queries
CREATE INDEX IF NOT EXISTS idx_exercises_position ON exercises USING GIN (position_specific) WHERE active = true;

-- ============================================================================
-- EXERCISE_PROGRESSIONS TABLE - Tracks progression rules per exercise
-- ============================================================================
CREATE TABLE IF NOT EXISTS exercise_progressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    
    -- Progression type
    progression_type TEXT NOT NULL CHECK (progression_type IN (
        'linear_reps', -- Add reps each session
        'linear_sets', -- Add sets each session
        'linear_hold', -- Add hold time each session
        'linear_weight', -- Add weight each session
        'wave', -- Wave loading pattern
        'autoregulated' -- Based on RPE/readiness
    )),
    
    -- Progression parameters
    increment_value NUMERIC(5,2), -- e.g., 1 rep, 5 seconds, 2.5 kg
    min_value NUMERIC(5,2), -- Floor value
    max_value NUMERIC(5,2), -- Ceiling value
    reset_threshold NUMERIC(5,2), -- When to reset (e.g., after reaching max)
    
    -- Conditions
    requires_completion BOOLEAN DEFAULT true, -- Must complete previous to progress
    acwr_adjustment_factor NUMERIC(3,2) DEFAULT 1.0, -- Multiply increment by this based on ACWR
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(exercise_id, progression_type)
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Exercises are readable by all authenticated users
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercises_read_all" ON exercises
    FOR SELECT
    TO authenticated
    USING (active = true);

CREATE POLICY "exercises_admin_all" ON exercises
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'superadmin', 'coach')
        )
    );

-- Exercise progressions are readable by all authenticated users
ALTER TABLE exercise_progressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercise_progressions_read_all" ON exercise_progressions
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "exercise_progressions_admin_all" ON exercise_progressions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'superadmin', 'coach')
        )
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_exercises_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

CREATE TRIGGER exercises_updated_at
    BEFORE UPDATE ON exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_exercises_updated_at();

CREATE TRIGGER exercise_progressions_updated_at
    BEFORE UPDATE ON exercise_progressions
    FOR EACH ROW
    EXECUTE FUNCTION update_exercises_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get exercises by category
CREATE OR REPLACE FUNCTION get_exercises_by_category(p_category TEXT)
RETURNS SETOF exercises AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM exercises
    WHERE category = p_category
    AND active = true
    ORDER BY name;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Search exercises
CREATE OR REPLACE FUNCTION search_exercises(p_query TEXT)
RETURNS SETOF exercises AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM exercises
    WHERE search_vector @@ plainto_tsquery('english', p_query)
    AND active = true
    ORDER BY ts_rank(search_vector, plainto_tsquery('english', p_query)) DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

COMMENT ON TABLE exercises IS 'Master exercise library with video references and HOW/FEEL/COMPENSATION instructions';
COMMENT ON TABLE exercise_progressions IS 'Defines how exercises progress over time (reps, sets, hold time, etc.)';

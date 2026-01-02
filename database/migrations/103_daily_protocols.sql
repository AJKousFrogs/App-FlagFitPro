-- ============================================================================
-- Migration 103: Daily Protocol System
-- ============================================================================
-- Creates the daily protocol system that prescribes exercises to athletes
-- based on their readiness, ACWR, and training goals.
-- ============================================================================

-- ============================================================================
-- DAILY_PROTOCOLS TABLE - AI-generated daily prescription per user
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    protocol_date DATE NOT NULL,
    
    -- Context at generation time
    readiness_score INTEGER, -- 0-100
    acwr_value NUMERIC(4,2), -- e.g., 1.12
    total_load_target_au INTEGER, -- Target load in arbitrary units
    
    -- AI rationale for the day's prescription
    ai_rationale TEXT, -- "Based on moderate readiness, skill work recommended"
    training_focus TEXT, -- 'recovery', 'skill', 'conditioning', 'strength'
    
    -- Block statuses
    morning_status TEXT DEFAULT 'pending' CHECK (morning_status IN ('pending', 'in_progress', 'complete', 'skipped')),
    foam_roll_status TEXT DEFAULT 'pending' CHECK (foam_roll_status IN ('pending', 'in_progress', 'complete', 'skipped')),
    main_session_status TEXT DEFAULT 'pending' CHECK (main_session_status IN ('pending', 'in_progress', 'complete', 'skipped')),
    evening_status TEXT DEFAULT 'pending' CHECK (evening_status IN ('pending', 'in_progress', 'complete', 'skipped')),
    
    -- Completion tracking
    overall_progress INTEGER DEFAULT 0, -- 0-100%
    completed_exercises INTEGER DEFAULT 0,
    total_exercises INTEGER DEFAULT 0,
    
    -- Timestamps
    morning_completed_at TIMESTAMPTZ,
    foam_roll_completed_at TIMESTAMPTZ,
    main_session_completed_at TIMESTAMPTZ,
    evening_completed_at TIMESTAMPTZ,
    
    -- Actual logged values (after main session)
    actual_duration_minutes INTEGER,
    actual_rpe INTEGER CHECK (actual_rpe >= 1 AND actual_rpe <= 10),
    actual_load_au INTEGER,
    session_notes TEXT,
    
    -- Metadata
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one protocol per user per day
    UNIQUE(user_id, protocol_date)
);

-- Index for user's protocols
CREATE INDEX IF NOT EXISTS idx_daily_protocols_user_date 
    ON daily_protocols (user_id, protocol_date DESC);

-- Index for finding incomplete protocols
CREATE INDEX IF NOT EXISTS idx_daily_protocols_incomplete 
    ON daily_protocols (user_id, protocol_date) 
    WHERE overall_progress < 100;

-- ============================================================================
-- PROTOCOL_EXERCISES TABLE - Prescribed exercises for each protocol block
-- ============================================================================
CREATE TABLE IF NOT EXISTS protocol_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id UUID NOT NULL REFERENCES daily_protocols(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    
    -- Which block this exercise belongs to
    block_type TEXT NOT NULL CHECK (block_type IN (
        'morning_mobility', 'foam_roll', 'warm_up', 
        'main_session', 'cool_down', 'evening_recovery'
    )),
    
    -- Order within the block
    sequence_order INTEGER NOT NULL,
    
    -- AI-calculated prescription for TODAY
    prescribed_sets INTEGER NOT NULL,
    prescribed_reps INTEGER,
    prescribed_hold_seconds INTEGER,
    prescribed_duration_seconds INTEGER, -- For timed exercises
    prescribed_weight_kg NUMERIC(5,2), -- For weighted exercises
    
    -- Progression context
    yesterday_sets INTEGER,
    yesterday_reps INTEGER,
    yesterday_hold_seconds INTEGER,
    progression_note TEXT, -- "+1 rep from yesterday"
    
    -- AI notes for this specific exercise today
    ai_note TEXT, -- "Focus on IT band - high sprint volume last 48h"
    
    -- Completion tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'complete', 'skipped')),
    completed_at TIMESTAMPTZ,
    
    -- Actual performance (if different from prescribed)
    actual_sets INTEGER,
    actual_reps INTEGER,
    actual_hold_seconds INTEGER,
    actual_duration_seconds INTEGER,
    actual_weight_kg NUMERIC(5,2),
    
    -- Load calculation
    load_contribution_au INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(protocol_id, exercise_id, block_type)
);

-- Index for fetching protocol exercises
CREATE INDEX IF NOT EXISTS idx_protocol_exercises_protocol 
    ON protocol_exercises (protocol_id, block_type, sequence_order);

-- ============================================================================
-- PROTOCOL_COMPLETIONS TABLE - Detailed completion log for analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS protocol_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    protocol_id UUID NOT NULL REFERENCES daily_protocols(id) ON DELETE CASCADE,
    protocol_exercise_id UUID REFERENCES protocol_exercises(id) ON DELETE CASCADE,
    
    -- What was completed
    completion_date DATE NOT NULL,
    block_type TEXT NOT NULL,
    exercise_id UUID REFERENCES exercises(id),
    
    -- Completion details
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    time_spent_seconds INTEGER,
    
    -- Integration flags
    logged_to_acwr BOOLEAN DEFAULT false,
    logged_to_wellness BOOLEAN DEFAULT false,
    badge_awarded TEXT, -- If a badge was earned
    
    -- Notes
    athlete_notes TEXT,
    skip_reason TEXT, -- If skipped, why
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user's completion history
CREATE INDEX IF NOT EXISTS idx_protocol_completions_user 
    ON protocol_completions (user_id, completion_date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE daily_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_completions ENABLE ROW LEVEL SECURITY;

-- Daily protocols: users see their own, coaches see their athletes
CREATE POLICY "daily_protocols_own" ON daily_protocols
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "daily_protocols_coach_read" ON daily_protocols
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            JOIN team_members coach ON coach.team_id = tm.team_id
            WHERE tm.user_id = daily_protocols.user_id
            AND coach.user_id = auth.uid()
            AND coach.role IN ('coach', 'head_coach', 'owner')
        )
    );

-- Protocol exercises follow daily_protocols access
CREATE POLICY "protocol_exercises_via_protocol" ON protocol_exercises
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM daily_protocols dp
            WHERE dp.id = protocol_exercises.protocol_id
            AND dp.user_id = auth.uid()
        )
    );

CREATE POLICY "protocol_exercises_coach_read" ON protocol_exercises
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM daily_protocols dp
            JOIN team_members tm ON tm.user_id = dp.user_id
            JOIN team_members coach ON coach.team_id = tm.team_id
            WHERE dp.id = protocol_exercises.protocol_id
            AND coach.user_id = auth.uid()
            AND coach.role IN ('coach', 'head_coach', 'owner')
        )
    );

-- Protocol completions: users see their own
CREATE POLICY "protocol_completions_own" ON protocol_completions
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for daily_protocols
CREATE OR REPLACE FUNCTION update_daily_protocols_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

CREATE TRIGGER daily_protocols_updated_at
    BEFORE UPDATE ON daily_protocols
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_protocols_updated_at();

CREATE TRIGGER protocol_exercises_updated_at
    BEFORE UPDATE ON protocol_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_protocols_updated_at();

-- Update protocol progress when exercises are completed
CREATE OR REPLACE FUNCTION update_protocol_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_total INTEGER;
    v_completed INTEGER;
    v_progress INTEGER;
BEGIN
    -- Count total and completed exercises for this protocol
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'complete')
    INTO v_total, v_completed
    FROM protocol_exercises
    WHERE protocol_id = NEW.protocol_id;
    
    -- Calculate progress percentage
    IF v_total > 0 THEN
        v_progress := ROUND((v_completed::NUMERIC / v_total) * 100);
    ELSE
        v_progress := 0;
    END IF;
    
    -- Update the protocol
    UPDATE daily_protocols
    SET 
        overall_progress = v_progress,
        completed_exercises = v_completed,
        total_exercises = v_total,
        updated_at = NOW()
    WHERE id = NEW.protocol_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

CREATE TRIGGER protocol_exercises_progress
    AFTER UPDATE OF status ON protocol_exercises
    FOR EACH ROW
    WHEN (NEW.status = 'complete' AND OLD.status != 'complete')
    EXECUTE FUNCTION update_protocol_progress();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get or create today's protocol for a user
CREATE OR REPLACE FUNCTION get_or_create_daily_protocol(
    p_user_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
    v_protocol_id UUID;
BEGIN
    -- Try to get existing protocol
    SELECT id INTO v_protocol_id
    FROM daily_protocols
    WHERE user_id = p_user_id AND protocol_date = p_date;
    
    -- If not found, create a placeholder (AI will populate later)
    IF v_protocol_id IS NULL THEN
        INSERT INTO daily_protocols (user_id, protocol_date)
        VALUES (p_user_id, p_date)
        RETURNING id INTO v_protocol_id;
    END IF;
    
    RETURN v_protocol_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Mark exercise as complete
CREATE OR REPLACE FUNCTION complete_protocol_exercise(
    p_protocol_exercise_id UUID,
    p_actual_sets INTEGER DEFAULT NULL,
    p_actual_reps INTEGER DEFAULT NULL,
    p_actual_hold_seconds INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_exercise RECORD;
BEGIN
    -- Get the exercise details
    SELECT pe.*, dp.user_id, dp.protocol_date
    INTO v_exercise
    FROM protocol_exercises pe
    JOIN daily_protocols dp ON dp.id = pe.protocol_id
    WHERE pe.id = p_protocol_exercise_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update the exercise
    UPDATE protocol_exercises
    SET 
        status = 'complete',
        completed_at = NOW(),
        actual_sets = COALESCE(p_actual_sets, prescribed_sets),
        actual_reps = COALESCE(p_actual_reps, prescribed_reps),
        actual_hold_seconds = COALESCE(p_actual_hold_seconds, prescribed_hold_seconds),
        updated_at = NOW()
    WHERE id = p_protocol_exercise_id;
    
    -- Log the completion
    INSERT INTO protocol_completions (
        user_id, protocol_id, protocol_exercise_id,
        completion_date, block_type, exercise_id, completed_at
    )
    VALUES (
        v_exercise.user_id, v_exercise.protocol_id, p_protocol_exercise_id,
        v_exercise.protocol_date, v_exercise.block_type, v_exercise.exercise_id, NOW()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Get user's protocol completion stats
CREATE OR REPLACE FUNCTION get_protocol_stats(
    p_user_id UUID,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    total_protocols INTEGER,
    completed_protocols INTEGER,
    avg_completion_rate NUMERIC,
    total_exercises_completed INTEGER,
    current_streak INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_protocols AS (
        SELECT 
            dp.id,
            dp.overall_progress,
            dp.protocol_date
        FROM daily_protocols dp
        WHERE dp.user_id = p_user_id
        AND dp.protocol_date >= CURRENT_DATE - p_days
    ),
    streak AS (
        SELECT COUNT(*) as streak_count
        FROM (
            SELECT protocol_date
            FROM daily_protocols
            WHERE user_id = p_user_id
            AND overall_progress >= 80
            AND protocol_date <= CURRENT_DATE
            ORDER BY protocol_date DESC
        ) sq
        WHERE protocol_date >= CURRENT_DATE - (
            SELECT COUNT(*) FROM generate_series(0, 365) gs(n)
            WHERE EXISTS (
                SELECT 1 FROM daily_protocols 
                WHERE user_id = p_user_id 
                AND protocol_date = CURRENT_DATE - gs.n
                AND overall_progress >= 80
            )
            AND NOT EXISTS (
                SELECT 1 FROM generate_series(0, gs.n - 1) prev(m)
                WHERE NOT EXISTS (
                    SELECT 1 FROM daily_protocols 
                    WHERE user_id = p_user_id 
                    AND protocol_date = CURRENT_DATE - prev.m
                    AND overall_progress >= 80
                )
            )
        )
    )
    SELECT 
        COUNT(*)::INTEGER as total_protocols,
        COUNT(*) FILTER (WHERE overall_progress >= 80)::INTEGER as completed_protocols,
        ROUND(AVG(overall_progress), 1) as avg_completion_rate,
        (SELECT COUNT(*) FROM protocol_completions WHERE user_id = p_user_id AND completion_date >= CURRENT_DATE - p_days)::INTEGER,
        COALESCE((SELECT streak_count FROM streak), 0)::INTEGER
    FROM recent_protocols;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

COMMENT ON TABLE daily_protocols IS 'Daily training protocol generated for each user based on readiness and ACWR';
COMMENT ON TABLE protocol_exercises IS 'Individual exercises prescribed within a daily protocol';
COMMENT ON TABLE protocol_completions IS 'Log of completed exercises for analytics and achievement tracking';

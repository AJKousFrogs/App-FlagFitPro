-- Migration: Session Versioning System
-- Date: 2026-01-06
-- Purpose: Track session versions and enforce append-only execution logs

-- ============================================================================
-- SESSION VERSION HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS session_version_history (
    version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    session_structure JSONB NOT NULL, -- Complete snapshot of session structure
    modified_by_coach_id UUID REFERENCES auth.users(id),
    modified_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    modification_reason TEXT,
    visible_to_athlete BOOLEAN DEFAULT false, -- Which version athlete saw
    athlete_viewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(session_id, version_number)
);

CREATE INDEX idx_session_version_history_session ON session_version_history(session_id, version_number DESC);
CREATE INDEX idx_session_version_history_coach ON session_version_history(modified_by_coach_id);

COMMENT ON TABLE session_version_history IS 'Immutable version history of all session modifications';
COMMENT ON COLUMN session_version_history.session_structure IS 'Complete JSON snapshot of exercises, sets, reps, intensity';

-- ============================================================================
-- ADD VERSION COLUMN TO TRAINING_SESSIONS
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'training_sessions'
        AND column_name = 'current_version'
    ) THEN
        ALTER TABLE training_sessions
        ADD COLUMN current_version INTEGER DEFAULT 1 NOT NULL;
    END IF;
END $$;

-- ============================================================================
-- FUNCTION: Create New Version on Modification
-- ============================================================================
CREATE OR REPLACE FUNCTION create_session_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_version INTEGER;
    v_structure_snapshot JSONB;
BEGIN
    -- Only create version if structural fields changed
    IF (
        (OLD.session_structure IS DISTINCT FROM NEW.session_structure)
        OR (OLD.prescribed_duration IS DISTINCT FROM NEW.prescribed_duration)
        OR (OLD.prescribed_intensity IS DISTINCT FROM NEW.prescribed_intensity)
    ) THEN
        -- Get next version number
        SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_new_version
        FROM session_version_history
        WHERE session_id = NEW.id;
        
        -- Create structure snapshot
        v_structure_snapshot := jsonb_build_object(
            'exercises', COALESCE(NEW.session_structure, '{}'::jsonb),
            'prescribed_duration', NEW.prescribed_duration,
            'prescribed_intensity', NEW.prescribed_intensity,
            'coach_locked', NEW.coach_locked,
            'modified_by_coach_id', NEW.modified_by_coach_id
        );
        
        -- Insert version history
        INSERT INTO session_version_history (
            session_id,
            version_number,
            session_structure,
            modified_by_coach_id,
            modified_at,
            modification_reason
        ) VALUES (
            NEW.id,
            v_new_version,
            v_structure_snapshot,
            NEW.modified_by_coach_id,
            COALESCE(NEW.modified_at, NOW()),
            NULL -- Can be set by coach
        );
        
        -- Update current version
        NEW.current_version := v_new_version;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger: Create version on modification
DROP TRIGGER IF EXISTS create_session_version_trigger ON training_sessions;
CREATE TRIGGER create_session_version_trigger
BEFORE UPDATE ON training_sessions
FOR EACH ROW
EXECUTE FUNCTION create_session_version();

-- ============================================================================
-- EXECUTION LOGS TABLE (Append-Only)
-- ============================================================================
CREATE TABLE IF NOT EXISTS execution_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    session_version INTEGER NOT NULL, -- Which version was executed
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id UUID,
    exercise_name TEXT,
    sets_completed INTEGER,
    reps_completed INTEGER,
    load_kg NUMERIC(6,2),
    rpe INTEGER CHECK (rpe BETWEEN 1 AND 10),
    duration_minutes INTEGER,
    notes TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Prevent backdating
    CONSTRAINT no_future_timestamps CHECK (logged_at <= NOW() + INTERVAL '1 minute'),
    CONSTRAINT no_old_backdating CHECK (
        logged_at >= (
            SELECT created_at FROM training_sessions 
            WHERE id = session_id
        ) - INTERVAL '1 day'
    )
);

CREATE INDEX idx_execution_logs_session ON execution_logs(session_id, logged_at DESC);
CREATE INDEX idx_execution_logs_athlete ON execution_logs(athlete_id, logged_at DESC);
CREATE INDEX idx_execution_logs_version ON execution_logs(session_id, session_version);

COMMENT ON TABLE execution_logs IS 'Append-only execution logs. Never UPDATE or DELETE.';

-- ============================================================================
-- RLS: Execution logs append-only
-- ============================================================================
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;

-- Athletes: Can insert own logs
DROP POLICY IF EXISTS "Athletes can log execution" ON execution_logs;
CREATE POLICY "Athletes can log execution"
ON execution_logs
FOR INSERT
WITH CHECK (athlete_id = auth.uid());

-- Athletes: Can read own logs
DROP POLICY IF EXISTS "Athletes can read own logs" ON execution_logs;
CREATE POLICY "Athletes can read own logs"
ON execution_logs
FOR SELECT
USING (athlete_id = auth.uid());

-- Coaches: Can read assigned athlete logs (compliance)
DROP POLICY IF EXISTS "Coaches can read athlete logs" ON execution_logs;
CREATE POLICY "Coaches can read athlete logs"
ON execution_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM coach_athlete_assignments
        WHERE coach_id = auth.uid()
        AND athlete_id = execution_logs.athlete_id
    )
);

-- Prevent UPDATE and DELETE
DROP POLICY IF EXISTS "No updates on execution logs" ON execution_logs;
CREATE POLICY "No updates on execution logs"
ON execution_logs
FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "No deletes on execution logs" ON execution_logs;
CREATE POLICY "No deletes on execution logs"
ON execution_logs
FOR DELETE
USING (false);

-- ============================================================================
-- FUNCTION: Get Session Version Executed by Athlete
-- ============================================================================
CREATE OR REPLACE FUNCTION get_executed_version(
    p_session_id UUID,
    p_athlete_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_version INTEGER;
BEGIN
    SELECT session_version INTO v_version
    FROM execution_logs
    WHERE session_id = p_session_id
    AND athlete_id = p_athlete_id
    ORDER BY logged_at ASC
    LIMIT 1;
    
    RETURN COALESCE(v_version, 1); -- Default to v1 if no logs
END;
$$;


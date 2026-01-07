-- Migration: Append-Only Execution Logs Enforcement
-- Date: 2026-01-06
-- Purpose: Prevent UPDATE/DELETE on execution logs

-- ============================================================================
-- TRIGGER: Prevent UPDATE on Execution Logs
-- ============================================================================
CREATE OR REPLACE FUNCTION prevent_execution_log_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RAISE EXCEPTION 'Execution logs are append-only. Cannot UPDATE historical logs. Use INSERT for corrections.';
END;
$$;

DROP TRIGGER IF EXISTS prevent_execution_log_update_trigger ON execution_logs;
CREATE TRIGGER prevent_execution_log_update_trigger
BEFORE UPDATE ON execution_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_execution_log_update();

-- ============================================================================
-- TRIGGER: Prevent DELETE on Execution Logs
-- ============================================================================
CREATE OR REPLACE FUNCTION prevent_execution_log_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RAISE EXCEPTION 'Execution logs are append-only. Cannot DELETE historical logs.';
END;
$$;

DROP TRIGGER IF EXISTS prevent_execution_log_delete_trigger ON execution_logs;
CREATE TRIGGER prevent_execution_log_delete_trigger
BEFORE DELETE ON execution_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_execution_log_delete();

-- ============================================================================
-- FUNCTION: Insert Late-Arriving Data (Append Only)
-- ============================================================================
CREATE OR REPLACE FUNCTION insert_late_execution_data(
    p_session_id UUID,
    p_athlete_id UUID,
    p_exercise_name TEXT,
    p_sets_completed INTEGER,
    p_reps_completed INTEGER,
    p_rpe INTEGER,
    p_logged_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
    v_session_version INTEGER;
BEGIN
    -- Get version that was executed
    v_session_version := get_executed_version(p_session_id, p_athlete_id);
    
    -- Insert new log entry (append only)
    INSERT INTO execution_logs (
        session_id,
        session_version,
        athlete_id,
        exercise_name,
        sets_completed,
        reps_completed,
        rpe,
        logged_at
    ) VALUES (
        p_session_id,
        v_session_version,
        p_athlete_id,
        p_exercise_name,
        p_sets_completed,
        p_reps_completed,
        p_rpe,
        p_logged_at
    ) RETURNING log_id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;


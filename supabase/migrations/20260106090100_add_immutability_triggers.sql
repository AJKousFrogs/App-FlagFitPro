-- Migration: Add immutability triggers
-- Date: 2026-01-06
-- Purpose: Implement Section 4.3 (Trigger-Based Rejection) and Section 3.1 (Session Mutation APIs)

-- Trigger 1: Prevent modifications to IN_PROGRESS or later sessions
CREATE OR REPLACE FUNCTION prevent_in_progress_modification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if structural modification attempted
  -- Note: Adjust column names based on actual schema
  IF (
    (OLD.session_structure IS DISTINCT FROM NEW.session_structure)
    OR (OLD.prescribed_duration IS DISTINCT FROM NEW.prescribed_duration)
    OR (OLD.prescribed_intensity IS DISTINCT FROM NEW.prescribed_intensity)
    OR (OLD.duration_minutes IS DISTINCT FROM NEW.duration_minutes AND OLD.session_state >= 'IN_PROGRESS')
    OR (OLD.intensity_level IS DISTINCT FROM NEW.intensity_level AND OLD.session_state >= 'IN_PROGRESS')
  ) THEN
    
    -- Reject if session is IN_PROGRESS or later
    IF OLD.session_state IN ('IN_PROGRESS', 'COMPLETED', 'LOCKED', 'CANCELLED', 'EXPIRED', 'ABANDONED') THEN
      RAISE EXCEPTION 'Cannot modify session structure: session is %', OLD.session_state;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_in_progress_modification_trigger ON training_sessions;
CREATE TRIGGER prevent_in_progress_modification_trigger
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_in_progress_modification();

-- Trigger 2: Prevent modifications to coach_locked sessions
CREATE OR REPLACE FUNCTION prevent_coach_locked_modification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- If session is coach_locked, only the coach who locked it can modify
  IF OLD.coach_locked = true THEN
    -- Only allow if modifying coach is the one who locked it
    IF NEW.modified_by_coach_id IS NULL 
       OR NEW.modified_by_coach_id != OLD.modified_by_coach_id THEN
      RAISE EXCEPTION 'Cannot modify coach_locked session: locked by coach %', OLD.modified_by_coach_id;
    END IF;
  END IF;
  
  -- Auto-set coach_locked when coach modifies structure
  -- Check if structural fields changed
  IF (
    (OLD.session_structure IS DISTINCT FROM NEW.session_structure)
    OR (OLD.prescribed_duration IS DISTINCT FROM NEW.prescribed_duration)
    OR (OLD.prescribed_intensity IS DISTINCT FROM NEW.prescribed_intensity)
  ) AND NEW.modified_by_coach_id IS NOT NULL THEN
    NEW.coach_locked = true;
    NEW.modified_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_coach_locked_modification_trigger ON training_sessions;
CREATE TRIGGER prevent_coach_locked_modification_trigger
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_coach_locked_modification();

-- Trigger 3: Prevent updates to immutable timestamp columns
CREATE OR REPLACE FUNCTION prevent_timestamp_modification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Prevent updates to started_at once set
  IF OLD.started_at IS NOT NULL AND OLD.started_at IS DISTINCT FROM NEW.started_at THEN
    RAISE EXCEPTION 'Cannot modify started_at: field is immutable once set';
  END IF;
  
  -- Prevent updates to completed_at once set
  IF OLD.completed_at IS NOT NULL AND OLD.completed_at IS DISTINCT FROM NEW.completed_at THEN
    RAISE EXCEPTION 'Cannot modify completed_at: field is immutable once set';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_timestamp_modification_trigger ON training_sessions;
CREATE TRIGGER prevent_timestamp_modification_trigger
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_timestamp_modification();

COMMENT ON FUNCTION prevent_in_progress_modification() IS 'Prevents structural modifications to sessions in IN_PROGRESS or later states';
COMMENT ON FUNCTION prevent_coach_locked_modification() IS 'Prevents modifications to coach_locked sessions except by the locking coach';
COMMENT ON FUNCTION prevent_timestamp_modification() IS 'Prevents retroactive modification of immutable timestamp fields';


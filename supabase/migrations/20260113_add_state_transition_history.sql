-- Migration: Add State Transition History Table
-- Date: 2026-01-13
-- Purpose: Implement STEP_2_6 §1.3 - State Transition History Logging
-- Contract: Session Lifecycle & Immutability Contract v1

-- ============================================================================
-- STATE TRANSITION HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS state_transition_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  
  -- State transition details
  from_state TEXT CHECK (from_state IS NULL OR from_state IN (
    'UNRESOLVED', 'PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED', 
    'IN_PROGRESS', 'COMPLETED', 'LOCKED', 'CANCELLED', 'EXPIRED', 'ABANDONED'
  )),
  to_state TEXT NOT NULL CHECK (to_state IN (
    'UNRESOLVED', 'PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED', 
    'IN_PROGRESS', 'COMPLETED', 'LOCKED', 'CANCELLED', 'EXPIRED', 'ABANDONED'
  )),
  
  -- Actor information
  actor_role TEXT NOT NULL CHECK (actor_role IN ('athlete', 'coach', 'physio', 'system', 'admin')),
  actor_id UUID REFERENCES auth.users(id), -- NULL for system transitions
  
  -- Transition metadata
  transitioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT, -- Optional reason for transition
  metadata JSONB, -- Flexible field for override flags, conflict resolution, etc.
  
  -- Indexes for performance
  CONSTRAINT state_transition_history_session_id_idx UNIQUE NULLS NOT DISTINCT (session_id, transitioned_at)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_state_transition_history_session_id 
  ON state_transition_history(session_id);

CREATE INDEX IF NOT EXISTS idx_state_transition_history_to_state 
  ON state_transition_history(to_state);

CREATE INDEX IF NOT EXISTS idx_state_transition_history_transitioned_at 
  ON state_transition_history(transitioned_at DESC);

CREATE INDEX IF NOT EXISTS idx_state_transition_history_actor 
  ON state_transition_history(actor_id) WHERE actor_id IS NOT NULL;

-- Comments
COMMENT ON TABLE state_transition_history IS 'Append-only audit log of all session state transitions. Contract: STEP_2_6 §1.3';
COMMENT ON COLUMN state_transition_history.from_state IS 'Previous state (NULL for initial state)';
COMMENT ON COLUMN state_transition_history.to_state IS 'New state after transition';
COMMENT ON COLUMN state_transition_history.actor_role IS 'Role of actor who triggered transition';
COMMENT ON COLUMN state_transition_history.actor_id IS 'User ID of actor (NULL for system transitions)';
COMMENT ON COLUMN state_transition_history.metadata IS 'Additional context: override flags, conflict resolution, etc.';

-- ============================================================================
-- IMMUTABILITY ENFORCEMENT
-- ============================================================================

-- Trigger: Prevent UPDATE and DELETE on state_transition_history
CREATE OR REPLACE FUNCTION prevent_state_history_modification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Cannot UPDATE state_transition_history: table is append-only (Contract: STEP_2_6 §1.3)';
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Cannot DELETE from state_transition_history: table is append-only (Contract: STEP_2_6 §1.3)';
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS prevent_state_history_modification_trigger ON state_transition_history;
CREATE TRIGGER prevent_state_history_modification_trigger
  BEFORE UPDATE OR DELETE ON state_transition_history
  FOR EACH ROW
  EXECUTE FUNCTION prevent_state_history_modification();

COMMENT ON FUNCTION prevent_state_history_modification() IS 'Enforces append-only constraint on state_transition_history (Contract: STEP_2_6 §1.3)';

-- ============================================================================
-- AUTOMATIC STATE TRANSITION LOGGING
-- ============================================================================

-- Function: Log state transition automatically
CREATE OR REPLACE FUNCTION log_session_state_transition()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  current_actor_role TEXT;
  current_actor_id UUID;
BEGIN
  -- Only log if state actually changed
  IF OLD.session_state IS DISTINCT FROM NEW.session_state THEN
    -- Determine actor role and ID from current context
    -- For system transitions (midnight transitions, auto-locking), actor_role = 'system', actor_id = NULL
    -- For user-initiated transitions, we need to get role from auth context or metadata
    
    -- Try to get actor from NEW metadata if set (set by application code)
    IF NEW.metadata IS NOT NULL AND NEW.metadata ? 'transition_actor_role' THEN
      current_actor_role := NEW.metadata->>'transition_actor_role';
      IF NEW.metadata ? 'transition_actor_id' THEN
        current_actor_id := (NEW.metadata->>'transition_actor_id')::UUID;
      END IF;
    ELSE
      -- Default to system if not specified
      current_actor_role := 'system';
      current_actor_id := NULL;
    END IF;
    
    -- Insert transition record
    INSERT INTO state_transition_history (
      session_id,
      from_state,
      to_state,
      actor_role,
      actor_id,
      transitioned_at,
      reason,
      metadata
    ) VALUES (
      NEW.id,
      OLD.session_state,
      NEW.session_state,
      current_actor_role,
      current_actor_id,
      NOW(),
      CASE 
        WHEN NEW.metadata IS NOT NULL AND NEW.metadata ? 'transition_reason' 
        THEN NEW.metadata->>'transition_reason'
        ELSE NULL
      END,
      NEW.metadata
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_session_state_transition_trigger ON training_sessions;
CREATE TRIGGER log_session_state_transition_trigger
  AFTER UPDATE ON training_sessions
  FOR EACH ROW
  WHEN (OLD.session_state IS DISTINCT FROM NEW.session_state)
  EXECUTE FUNCTION log_session_state_transition();

COMMENT ON FUNCTION log_session_state_transition() IS 'Automatically logs state transitions to state_transition_history (Contract: STEP_2_6 §1.3)';

-- ============================================================================
-- BACKFILL EXISTING SESSIONS
-- ============================================================================

-- Backfill: Create initial state transition records for existing sessions
-- Only runs if safe (no existing history records)
DO $$
DECLARE
  session_record RECORD;
  initial_state TEXT;
BEGIN
  -- Only backfill if history table is empty (safe check)
  IF (SELECT COUNT(*) FROM state_transition_history) = 0 THEN
    FOR session_record IN 
      SELECT id, session_state, created_at, generated_at, user_id
      FROM training_sessions
      WHERE session_state IS NOT NULL
    LOOP
      -- Determine initial state (use current state, from_state = NULL)
      initial_state := session_record.session_state;
      
      -- Use created_at or generated_at as transition timestamp, fallback to NOW()
      INSERT INTO state_transition_history (
        session_id,
        from_state,
        to_state,
        actor_role,
        actor_id,
        transitioned_at,
        reason,
        metadata
      ) VALUES (
        session_record.id,
        NULL, -- Initial state (no from_state)
        initial_state,
        'system', -- Backfilled records are system-initiated
        NULL,
        COALESCE(
          session_record.generated_at,
          session_record.created_at,
          NOW()
        ),
        'Backfilled initial state',
        jsonb_build_object('backfilled', true)
      );
    END LOOP;
    
    RAISE NOTICE 'Backfilled state transition history for % sessions', (SELECT COUNT(*) FROM training_sessions WHERE session_state IS NOT NULL);
  ELSE
    RAISE NOTICE 'State transition history table already contains data, skipping backfill';
  END IF;
END $$;

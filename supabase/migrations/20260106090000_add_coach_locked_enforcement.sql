-- Migration: Add coach_locked enforcement
-- Date: 2026-01-06
-- Purpose: Implement Section 1.6 (Lock) and Section 5 (Coach-Locked Session Enforcement)

-- Add coach_locked column to training_sessions
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS coach_locked BOOLEAN DEFAULT false NOT NULL;

-- Add coach attribution fields
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS modified_by_coach_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ;

-- Add session_state column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'training_sessions' 
    AND column_name = 'session_state'
  ) THEN
    ALTER TABLE training_sessions
    ADD COLUMN session_state TEXT DEFAULT 'PLANNED';
    
    -- Add constraint
    ALTER TABLE training_sessions
    ADD CONSTRAINT check_session_state CHECK (
      session_state IN ('PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'LOCKED', 'CANCELLED', 'EXPIRED', 'ABANDONED')
    );
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_coach_locked ON training_sessions(coach_locked) WHERE coach_locked = true;
CREATE INDEX IF NOT EXISTS idx_training_sessions_session_state ON training_sessions(session_state);
CREATE INDEX IF NOT EXISTS idx_training_sessions_modified_by_coach ON training_sessions(modified_by_coach_id) WHERE modified_by_coach_id IS NOT NULL;

COMMENT ON COLUMN training_sessions.coach_locked IS 'When true, prevents AI/system modifications. Only the coach who locked it can modify.';
COMMENT ON COLUMN training_sessions.modified_by_coach_id IS 'Coach who last modified this session. Set automatically when coach modifies structure.';
COMMENT ON COLUMN training_sessions.session_state IS 'Current lifecycle state of the session. Determines what modifications are allowed.';


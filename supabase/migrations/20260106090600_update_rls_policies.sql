-- Migration: Update RLS policies for coach_locked and state enforcement
-- Date: 2026-01-06
-- Purpose: Implement Section 3.1 (API Guard Rules) via RLS

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Users can update own training sessions" ON training_sessions;

-- Create new UPDATE policy with coach_locked and state checks
CREATE POLICY "Users can update own training sessions"
ON training_sessions FOR UPDATE
USING (
  user_id = auth.uid()
  AND coach_locked = false
  AND session_state IN ('PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED')
)
WITH CHECK (
  user_id = auth.uid()
  AND coach_locked = false
  AND session_state IN ('PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED')
);

-- Create separate policy for coaches modifying sessions
DROP POLICY IF EXISTS "Coaches can modify team training sessions" ON training_sessions;
CREATE POLICY "Coaches can modify team training sessions"
ON training_sessions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = users.id
    AND users.raw_user_meta_data->>'role' = 'coach'
  )
  AND (
    -- Coach can modify if they locked it
    (coach_locked = true AND modified_by_coach_id = auth.uid())
    OR
    -- Coach can modify if not locked and state allows
    (coach_locked = false AND session_state IN ('PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = users.id
    AND users.raw_user_meta_data->>'role' = 'coach'
  )
  AND (
    (coach_locked = true AND modified_by_coach_id = auth.uid())
    OR
    (coach_locked = false AND session_state IN ('PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED'))
  )
);

-- Policy for athletes to log execution data (append-only, no structure changes)
DROP POLICY IF EXISTS "Athletes can log execution data" ON training_sessions;
CREATE POLICY "Athletes can log execution data"
ON training_sessions FOR UPDATE
USING (
  user_id = auth.uid()
  AND session_state IN ('IN_PROGRESS', 'COMPLETED')
)
WITH CHECK (
  user_id = auth.uid()
  AND session_state IN ('IN_PROGRESS', 'COMPLETED')
  -- Prevent structure modifications via RLS
  AND (
    session_structure IS NOT DISTINCT FROM (SELECT session_structure FROM training_sessions WHERE id = training_sessions.id)
  )
);

COMMENT ON POLICY "Users can update own training sessions" ON training_sessions IS 'Allows users to update their own sessions only when not coach_locked and state allows';
COMMENT ON POLICY "Coaches can modify team training sessions" ON training_sessions IS 'Allows coaches to modify sessions they locked or sessions in mutable states';
COMMENT ON POLICY "Athletes can log execution data" ON training_sessions IS 'Allows athletes to log execution data (RPE, duration) but not modify structure';


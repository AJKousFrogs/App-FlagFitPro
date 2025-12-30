-- =============================================================================
-- STANDARDIZE USER IDS (ATHLETE_ID -> USER_ID)
-- Migration: 074_standardize_user_id.sql
-- Ensures all user-related tables use 'user_id' for consistency across the codebase.
-- =============================================================================

-- 1. readiness_scores: already has both, but ensure user_id is populated
UPDATE readiness_scores SET user_id = athlete_id WHERE user_id IS NULL;

-- 2. wellness_logs: add user_id if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wellness_logs' AND column_name='user_id') THEN
        ALTER TABLE wellness_logs ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE wellness_logs SET user_id = athlete_id WHERE user_id IS NULL;

-- 3. fixtures: already has both
UPDATE fixtures SET user_id = athlete_id WHERE user_id IS NULL;

-- 4. training_sessions: already has both
UPDATE training_sessions SET user_id = athlete_id WHERE user_id IS NULL;

-- 5. athlete_recovery_profiles: add user_id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='athlete_recovery_profiles' AND column_name='user_id') THEN
        ALTER TABLE athlete_recovery_profiles ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE athlete_recovery_profiles SET user_id = athlete_id WHERE user_id IS NULL;

-- 6. wellness_entries: already has both
UPDATE wellness_entries SET user_id = athlete_id WHERE user_id IS NULL;

-- 7. calibration_logs: already has user_id, ensure it matches athlete_id if applicable
UPDATE calibration_logs SET user_id = athlete_id WHERE user_id IS NULL;

-- 8. competition_readiness: add user_id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='competition_readiness' AND column_name='user_id') THEN
        ALTER TABLE competition_readiness ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE competition_readiness SET user_id = athlete_id WHERE user_id IS NULL;

-- 9. recovery_sessions: already has both
UPDATE recovery_sessions SET user_id = athlete_id WHERE user_id IS NULL;

-- 10. injury_tracking: add user_id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='injury_tracking' AND column_name='user_id') THEN
        ALTER TABLE injury_tracking ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE injury_tracking SET user_id = player_id WHERE user_id IS NULL;

-- 11. athlete_drill_assignments: add user_id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='athlete_drill_assignments' AND column_name='user_id') THEN
        ALTER TABLE athlete_drill_assignments ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE athlete_drill_assignments SET user_id = athlete_id WHERE user_id IS NULL;

-- Create a helper view for the legacy code that still expects athlete_id
-- This allows us to keep the code working while we transition.
CREATE OR REPLACE VIEW athlete_activity_unified AS
SELECT 
    user_id,
    user_id as athlete_id,
    created_at
FROM (
    SELECT user_id, created_at FROM training_sessions
    UNION ALL
    SELECT user_id, created_at FROM wellness_logs
    UNION ALL
    SELECT user_id, created_at FROM readiness_scores
) combined;

COMMENT ON COLUMN wellness_logs.user_id IS 'Standardized user reference. Replaces athlete_id.';
COMMENT ON COLUMN athlete_recovery_profiles.user_id IS 'Standardized user reference. Replaces athlete_id.';
COMMENT ON COLUMN competition_readiness.user_id IS 'Standardized user reference. Replaces athlete_id.';
COMMENT ON COLUMN injury_tracking.user_id IS 'Standardized user reference. Replaces player_id/athlete_id.';
COMMENT ON COLUMN athlete_drill_assignments.user_id IS 'Standardized user reference. Replaces athlete_id.';


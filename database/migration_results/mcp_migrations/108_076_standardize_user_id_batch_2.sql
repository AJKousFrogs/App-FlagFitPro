-- =============================================================================
-- STANDARDIZE USER IDS (ATHLETE_ID/PLAYER_ID -> USER_ID) - BATCH 2
-- Migration: 076_standardize_user_id_batch_2.sql
-- Ensures all user-related tables use 'user_id' for consistency across the codebase.
-- =============================================================================

-- 1. coach_activity_log: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coach_activity_log' AND column_name='user_id') THEN
        ALTER TABLE coach_activity_log ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE coach_activity_log SET user_id = player_id WHERE user_id IS NULL;

-- 2. equipment_requests: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment_requests' AND column_name='user_id') THEN
        ALTER TABLE equipment_requests ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE equipment_requests SET user_id = player_id WHERE user_id IS NULL;

-- 3. workout_logs: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workout_logs' AND column_name='user_id') THEN
        ALTER TABLE workout_logs ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE workout_logs SET user_id = player_id WHERE user_id IS NULL;

-- 4. video_clip_assignments: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='video_clip_assignments' AND column_name='user_id') THEN
        ALTER TABLE video_clip_assignments ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE video_clip_assignments SET user_id = player_id WHERE user_id IS NULL;

-- 5. player_evaluations: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='player_evaluations' AND column_name='user_id') THEN
        ALTER TABLE player_evaluations ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE player_evaluations SET user_id = player_id WHERE user_id IS NULL;

-- 6. player_programs: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='player_programs' AND column_name='user_id') THEN
        ALTER TABLE player_programs ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE player_programs SET user_id = player_id WHERE user_id IS NULL;

-- 7. player_attendance_stats: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='player_attendance_stats' AND column_name='user_id') THEN
        ALTER TABLE player_attendance_stats ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE player_attendance_stats SET user_id = player_id WHERE user_id IS NULL;

-- 8. absence_requests: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absence_requests' AND column_name='user_id') THEN
        ALTER TABLE absence_requests ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE absence_requests SET user_id = player_id WHERE user_id IS NULL;

-- 9. player_position_preferences: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='player_position_preferences' AND column_name='user_id') THEN
        ALTER TABLE player_position_preferences ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE player_position_preferences SET user_id = player_id WHERE user_id IS NULL;

-- 10. load_daily: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='load_daily' AND column_name='user_id') THEN
        ALTER TABLE load_daily ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE load_daily SET user_id = player_id WHERE user_id IS NULL;

-- 11. attendance_records: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_records' AND column_name='user_id') THEN
        ALTER TABLE attendance_records ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE attendance_records SET user_id = player_id WHERE user_id IS NULL;

-- 12. equipment_checkout_log: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment_checkout_log' AND column_name='user_id') THEN
        ALTER TABLE equipment_checkout_log ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE equipment_checkout_log SET user_id = player_id WHERE user_id IS NULL;

COMMENT ON COLUMN coach_activity_log.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN equipment_requests.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN workout_logs.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN video_clip_assignments.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN player_evaluations.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN player_programs.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN player_attendance_stats.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN absence_requests.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN player_position_preferences.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN load_daily.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN attendance_records.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN equipment_checkout_log.user_id IS 'Standardized user reference. Replaces player_id.';


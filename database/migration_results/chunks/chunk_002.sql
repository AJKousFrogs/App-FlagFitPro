-- ============================================================================
-- Fixes: PGRST204 error "Could not find the 'rest_seconds' column of 
--        'protocol_exercises' in the schema cache"
--
-- The daily-protocol.js function generates exercises with rest periods,
-- but the column was missing from the original table definition.
-- ============================================================================

-- Add the rest_seconds column
ALTER TABLE protocol_exercises 
ADD COLUMN IF NOT EXISTS rest_seconds INTEGER;

-- Add documentation
COMMENT ON COLUMN protocol_exercises.rest_seconds IS 'Rest period between sets in seconds. Varies by block type: isometrics ~30s, plyometrics ~60-90s, strength ~90s, conditioning ~30-45s';

-- Verify the column was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'protocol_exercises' 
        AND column_name = 'rest_seconds'
    ) THEN
        RAISE NOTICE 'SUCCESS: rest_seconds column added to protocol_exercises';
    ELSE
        RAISE EXCEPTION 'FAILED: rest_seconds column was not added';
    END IF;
END $$;



-- ============================================================================
-- Migration: 115_add_wellness_fields.sql
-- Type: database
-- ============================================================================

-- ============================================================================
-- Migration 115: Add Missing Wellness Fields to daily_wellness_checkin
-- ============================================================================
-- Purpose: Add motivation, mood, and hydration fields that exist in legacy wellness_entries
--          but are missing from daily_wellness_checkin table
-- Date: January 2026
-- Impact: Enables full wellness tracking without data loss
-- ============================================================================

-- Add motivation_level column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_wellness_checkin' AND column_name = 'motivation_level'
    ) THEN
        ALTER TABLE daily_wellness_checkin 
        ADD COLUMN motivation_level INTEGER CHECK (motivation_level >= 0 AND motivation_level <= 10);
        COMMENT ON COLUMN daily_wellness_checkin.motivation_level IS 'Motivation level (0-10 scale)';
    END IF;
END $$;

-- Add mood column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_wellness_checkin' AND column_name = 'mood'
    ) THEN
        ALTER TABLE daily_wellness_checkin 
        ADD COLUMN mood INTEGER CHECK (mood >= 0 AND mood <= 10);
        COMMENT ON COLUMN daily_wellness_checkin.mood IS 'Overall mood (0-10 scale)';
    END IF;
END $$;

-- Add hydration_level column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_wellness_checkin' AND column_name = 'hydration_level'
    ) THEN
        ALTER TABLE daily_wellness_checkin 
        ADD COLUMN hydration_level INTEGER CHECK (hydration_level >= 0 AND hydration_level <= 10);
        COMMENT ON COLUMN daily_wellness_checkin.hydration_level IS 'Hydration level (0-10 scale)';
    END IF;
END $$;

-- Add overall_readiness_score if it doesn't exist (replacing calculated_readiness for consistency)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_wellness_checkin' AND column_name = 'overall_readiness_score'
    ) THEN
        ALTER TABLE daily_wellness_checkin 
        ADD COLUMN overall_readiness_score INTEGER CHECK (overall_readiness_score >= 0 AND overall_readiness_score <= 100);
        COMMENT ON COLUMN daily_wellness_checkin.overall_readiness_score IS 'Calculated overall readiness score (0-100)';
    END IF;
END $$;

-- Add index for wellness queries
CREATE INDEX IF NOT EXISTS idx_daily_wellness_checkin_user_date_v2
ON daily_wellness_checkin(user_id, checkin_date DESC);

-- Update comment on table
COMMENT ON TABLE daily_wellness_checkin IS 'Primary table for daily wellness check-ins. Contains all wellness metrics including sleep, energy, stress, soreness, motivation, mood, and hydration.';



-- ============================================================================
-- Migration: 116_add_workout_logs_load_fields.sql
-- Type: database
-- ============================================================================

-- ============================================================================
-- Migration 116: Add Load and External Metrics to workout_logs
-- ============================================================================
-- Purpose: Add calculated load (load_au) and external load metrics to workout_logs
--          so that LoadMonitoringService can persist complete training session data
-- Date: January 2026
-- Impact: Enables complete training load tracking without data loss
-- ============================================================================

-- Add load_au (calculated session load in Arbitrary Units)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_logs' AND column_name = 'load_au'
    ) THEN
        ALTER TABLE workout_logs 
        ADD COLUMN load_au INTEGER;
        COMMENT ON COLUMN workout_logs.load_au IS 'Calculated session load in Arbitrary Units (RPE × duration)';
    END IF;
END $$;

-- Add session_type for categorization
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_logs' AND column_name = 'session_type'
    ) THEN
        ALTER TABLE workout_logs 
        ADD COLUMN session_type VARCHAR(50);
        COMMENT ON COLUMN workout_logs.session_type IS 'Type of training session: game, sprint, technical, conditioning, strength, recovery';
    END IF;
END $$;

-- Add external_load_data for GPS/wearable metrics
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_logs' AND column_name = 'external_load_data'
    ) THEN
        ALTER TABLE workout_logs 
        ADD COLUMN external_load_data JSONB;
        COMMENT ON COLUMN workout_logs.external_load_data IS 'External load metrics from GPS/wearables: totalDistance, sprintDistance, playerLoad, etc.';
    END IF;
END $$;

-- Add wellness_data snapshot
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_logs' AND column_name = 'wellness_snapshot'
    ) THEN
        ALTER TABLE workout_logs 
        ADD COLUMN wellness_snapshot JSONB;
        COMMENT ON COLUMN workout_logs.wellness_snapshot IS 'Wellness metrics at time of session: sleepQuality, energyLevel, etc.';
    END IF;
END $$;

-- Add wellness_adjustment_factor
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_logs' AND column_name = 'wellness_adjustment_factor'
    ) THEN
        ALTER TABLE workout_logs 
        ADD COLUMN wellness_adjustment_factor DECIMAL(3,2);
        COMMENT ON COLUMN workout_logs.wellness_adjustment_factor IS 'Wellness-based load adjustment factor (0.8-1.3)';
    END IF;
END $$;

-- Add internal load metrics (for more detailed tracking)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_logs' AND column_name = 'avg_heart_rate'
    ) THEN
        ALTER TABLE workout_logs 
        ADD COLUMN avg_heart_rate INTEGER;
        COMMENT ON COLUMN workout_logs.avg_heart_rate IS 'Average heart rate during session (bpm)';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_logs' AND column_name = 'max_heart_rate'
    ) THEN
        ALTER TABLE workout_logs 
        ADD COLUMN max_heart_rate INTEGER;
        COMMENT ON COLUMN workout_logs.max_heart_rate IS 'Maximum heart rate during session (bpm)';
    END IF;
END $$;

-- Create index for load queries
CREATE INDEX IF NOT EXISTS idx_workout_logs_player_date_load
ON workout_logs(player_id, completed_at DESC, load_au)
WHERE load_au IS NOT NULL;

-- Create index for session type filtering
CREATE INDEX IF NOT EXISTS idx_workout_logs_session_type
ON workout_logs(player_id, session_type, completed_at DESC);

-- Update trigger for load calculation if missing
CREATE OR REPLACE FUNCTION calculate_workout_load_au()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate load_au from RPE and duration if not provided
    IF NEW.load_au IS NULL AND NEW.rpe IS NOT NULL AND NEW.duration_minutes IS NOT NULL THEN
        NEW.load_au := ROUND(NEW.rpe * NEW.duration_minutes);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then recreate
DROP TRIGGER IF EXISTS trigger_calculate_workout_load_au ON workout_logs;
CREATE TRIGGER trigger_calculate_workout_load_au
    BEFORE INSERT OR UPDATE ON workout_logs
    FOR EACH ROW
    EXECUTE FUNCTION calculate_workout_load_au();

COMMENT ON TABLE workout_logs IS 'Completed workout sessions with load metrics, external GPS/wearable data, and wellness adjustments';



-- ============================================================================
-- Migration: 117_wellness_checkin_transaction.sql
-- Type: database
-- ============================================================================

-- ============================================================================
-- Migration 117: Add Transactional Wellness Check-in Function
-- ============================================================================
-- Purpose: Create a database function for atomic wellness check-in that writes 
--          to both daily_wellness_checkin and wellness_entries tables
-- Date: January 2026
-- Impact: Ensures data consistency between wellness tables
-- ============================================================================

-- Create or replace the transactional wellness check-in function
CREATE OR REPLACE FUNCTION upsert_wellness_checkin(
    p_user_id UUID,
    p_checkin_date DATE,
    p_sleep_quality INTEGER DEFAULT NULL,
    p_sleep_hours NUMERIC(3,1) DEFAULT NULL,
    p_energy_level INTEGER DEFAULT NULL,
    p_muscle_soreness INTEGER DEFAULT NULL,
    p_stress_level INTEGER DEFAULT NULL,
    p_soreness_areas TEXT[] DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_calculated_readiness INTEGER DEFAULT NULL,
    p_motivation_level INTEGER DEFAULT NULL,
    p_mood INTEGER DEFAULT NULL,
    p_hydration_level INTEGER DEFAULT NULL
)
RETURNS TABLE (
    id BIGINT,
    checkin_date DATE,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_checkin_id BIGINT;
BEGIN
    -- Begin atomic transaction
    
    -- 1. Upsert to daily_wellness_checkin (primary table)
    INSERT INTO daily_wellness_checkin (
        user_id,
        checkin_date,
        sleep_quality,
        sleep_hours,
        energy_level,
        muscle_soreness,
        stress_level,
        soreness_areas,
        notes,
        calculated_readiness,
        motivation_level,
        mood,
        hydration_level,
        overall_readiness_score,
        updated_at
    ) VALUES (
        p_user_id,
        p_checkin_date,
        p_sleep_quality,
        p_sleep_hours,
        p_energy_level,
        p_muscle_soreness,
        p_stress_level,
        COALESCE(p_soreness_areas, ARRAY[]::TEXT[]),
        p_notes,
        p_calculated_readiness,
        p_motivation_level,
        p_mood,
        p_hydration_level,
        p_calculated_readiness,
        NOW()
    )
    ON CONFLICT (user_id, checkin_date) 
    DO UPDATE SET
        sleep_quality = COALESCE(EXCLUDED.sleep_quality, daily_wellness_checkin.sleep_quality),
        sleep_hours = COALESCE(EXCLUDED.sleep_hours, daily_wellness_checkin.sleep_hours),
        energy_level = COALESCE(EXCLUDED.energy_level, daily_wellness_checkin.energy_level),
        muscle_soreness = COALESCE(EXCLUDED.muscle_soreness, daily_wellness_checkin.muscle_soreness),
        stress_level = COALESCE(EXCLUDED.stress_level, daily_wellness_checkin.stress_level),
        soreness_areas = COALESCE(EXCLUDED.soreness_areas, daily_wellness_checkin.soreness_areas),
        notes = COALESCE(EXCLUDED.notes, daily_wellness_checkin.notes),
        calculated_readiness = COALESCE(EXCLUDED.calculated_readiness, daily_wellness_checkin.calculated_readiness),
        motivation_level = COALESCE(EXCLUDED.motivation_level, daily_wellness_checkin.motivation_level),
        mood = COALESCE(EXCLUDED.mood, daily_wellness_checkin.mood),
        hydration_level = COALESCE(EXCLUDED.hydration_level, daily_wellness_checkin.hydration_level),
        overall_readiness_score = COALESCE(EXCLUDED.overall_readiness_score, daily_wellness_checkin.overall_readiness_score),
        updated_at = NOW()
    RETURNING daily_wellness_checkin.id INTO v_checkin_id;

    -- 2. Upsert to wellness_entries (legacy table for backward compatibility)
    INSERT INTO wellness_entries (
        athlete_id,
        user_id,
        date,
        sleep_quality,
        energy_level,
        stress_level,
        muscle_soreness,
        motivation_level,
        mood,
        hydration_level,
        notes,
        updated_at
    ) VALUES (
        p_user_id,
        p_user_id,
        p_checkin_date,
        p_sleep_quality,
        p_energy_level,
        p_stress_level,
        p_muscle_soreness,
        p_motivation_level,
        p_mood,
        p_hydration_level,
        p_notes,
        NOW()
    )
    ON CONFLICT (athlete_id, date) 
    DO UPDATE SET
        sleep_quality = COALESCE(EXCLUDED.sleep_quality, wellness_entries.sleep_quality),
        energy_level = COALESCE(EXCLUDED.energy_level, wellness_entries.energy_level),
        stress_level = COALESCE(EXCLUDED.stress_level, wellness_entries.stress_level),
        muscle_soreness = COALESCE(EXCLUDED.muscle_soreness, wellness_entries.muscle_soreness),
        motivation_level = COALESCE(EXCLUDED.motivation_level, wellness_entries.motivation_level),
        mood = COALESCE(EXCLUDED.mood, wellness_entries.mood),
        hydration_level = COALESCE(EXCLUDED.hydration_level, wellness_entries.hydration_level),
        notes = COALESCE(EXCLUDED.notes, wellness_entries.notes),
        updated_at = NOW();

    RETURN QUERY SELECT v_checkin_id, p_checkin_date, true, 'Wellness check-in saved successfully'::TEXT;

EXCEPTION
    WHEN OTHERS THEN
        -- Transaction will be rolled back automatically
        RAISE EXCEPTION 'Failed to save wellness check-in: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_wellness_checkin TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION upsert_wellness_checkin IS 'Atomic wellness check-in that writes to both daily_wellness_checkin and wellness_entries tables';

-- ============================================================================
-- Similar function for training session logging (writes to training_sessions + workout_logs)
-- ============================================================================

CREATE OR REPLACE FUNCTION log_training_session(
    p_user_id UUID,
    p_session_date DATE,
    p_session_type VARCHAR(50),
    p_duration_minutes INTEGER,
    p_rpe DECIMAL(3,1) DEFAULT NULL,
    p_load_au INTEGER DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_external_load_data JSONB DEFAULT NULL,
    p_wellness_snapshot JSONB DEFAULT NULL,
    p_avg_heart_rate INTEGER DEFAULT NULL,
    p_max_heart_rate INTEGER DEFAULT NULL
)
RETURNS TABLE (
    session_id UUID,
    workout_log_id UUID,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_session_id UUID;
    v_workout_log_id UUID;
    v_calculated_load INTEGER;
BEGIN
    -- Calculate load if not provided
    v_calculated_load := COALESCE(p_load_au, 
        CASE WHEN p_rpe IS NOT NULL AND p_duration_minutes IS NOT NULL 
             THEN ROUND(p_rpe * p_duration_minutes)::INTEGER
             ELSE NULL
        END
    );

    -- 1. Insert into training_sessions
    INSERT INTO training_sessions (
        user_id,
        session_date,
        session_type,
        duration_minutes,
        rpe,
        load_au,
        notes,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_session_date,
        p_session_type,
        p_duration_minutes,
        p_rpe,
        v_calculated_load,
        p_notes,
        'completed',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_session_id;

    -- 2. Insert into workout_logs
    INSERT INTO workout_logs (
        player_id,
        session_id,
        completed_at,
        rpe,
        duration_minutes,
        notes,
        load_au,
        session_type,
        external_load_data,
        wellness_snapshot,
        avg_heart_rate,
        max_heart_rate,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        v_session_id,
        (p_session_date::TIMESTAMP AT TIME ZONE 'UTC'),
        p_rpe,
        p_duration_minutes,
        p_notes,
        v_calculated_load,
        p_session_type,
        p_external_load_data,
        p_wellness_snapshot,
        p_avg_heart_rate,
        p_max_heart_rate,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_workout_log_id;

    RETURN QUERY SELECT v_session_id, v_workout_log_id, true, 'Training session logged successfully'::TEXT;

EXCEPTION
    WHEN OTHERS THEN
        -- Transaction will be rolled back automatically
        RAISE EXCEPTION 'Failed to log training session: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION log_training_session TO authenticated;

COMMENT ON FUNCTION log_training_session IS 'Atomic training session logging that writes to both training_sessions and workout_logs tables';



-- ============================================================================
-- Migration: 118_add_session_metrics_jsonb.sql
-- Type: database
-- ============================================================================

-- Add JSONB field for optional session metrics (sprints/cuts/throws/jumps)
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS session_metrics JSONB;

COMMENT ON COLUMN training_sessions.session_metrics IS
  'Optional session metrics (sprint_reps, cutting_movements, throw_count, jump_count).';



-- ============================================================================
-- Migration: 20241227_add_push_subscriptions.sql
-- Type: database
-- ============================================================================

-- Migration: Add push subscriptions table
-- Description: Stores push notification subscriptions for users
-- Date: 2024-12-27

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT,
    auth TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own subscriptions
CREATE POLICY "Users can view own push subscriptions"
    ON push_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own push subscriptions"
    ON push_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own push subscriptions"
    ON push_subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own push subscriptions"
    ON push_subscriptions FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_push_subscriptions_updated_at
    BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- Comment on table
COMMENT ON TABLE push_subscriptions IS 'Stores push notification subscriptions for Web Push API';



-- ============================================================================
-- Migration: 20241227_add_user_security.sql
-- Type: database
-- ============================================================================

-- Migration: Add user security table for 2FA
-- Description: Stores two-factor authentication settings and backup codes
-- Date: 2024-12-27

-- Create user_security table
CREATE TABLE IF NOT EXISTS user_security (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT, -- Encrypted TOTP secret
    two_factor_backup_codes TEXT[], -- Array of hashed backup codes
    two_factor_enabled_at TIMESTAMPTZ,
    last_password_change TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    lockout_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_security_user_id ON user_security(user_id);

-- Enable RLS
ALTER TABLE user_security ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own security settings
CREATE POLICY "Users can view own security settings"
    ON user_security FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own security settings
CREATE POLICY "Users can insert own security settings"
    ON user_security FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own security settings
CREATE POLICY "Users can update own security settings"
    ON user_security FOR UPDATE
    USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_security_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_security_updated_at
    BEFORE UPDATE ON user_security
    FOR EACH ROW
    EXECUTE FUNCTION update_user_security_updated_at();

-- Function to record 2FA enable time
CREATE OR REPLACE FUNCTION record_2fa_enabled_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.two_factor_enabled = TRUE AND (OLD.two_factor_enabled IS NULL OR OLD.two_factor_enabled = FALSE) THEN
        NEW.two_factor_enabled_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_record_2fa_enabled_at
    BEFORE UPDATE ON user_security
    FOR EACH ROW
    EXECUTE FUNCTION record_2fa_enabled_at();

-- Comment on table
COMMENT ON TABLE user_security IS 'Stores user security settings including 2FA configuration';
COMMENT ON COLUMN user_security.two_factor_secret IS 'Encrypted TOTP secret for authenticator apps';
COMMENT ON COLUMN user_security.two_factor_backup_codes IS 'Hashed backup codes for account recovery';



-- ============================================================================
-- Migration: 20241227_add_user_settings.sql
-- Type: database
-- ============================================================================

-- Migration: Add user settings table
-- Description: Stores user preferences and notification settings
-- Date: 2024-12-27

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Notification settings
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    training_reminders BOOLEAN DEFAULT TRUE,
    team_notifications BOOLEAN DEFAULT TRUE,
    game_notifications BOOLEAN DEFAULT TRUE,
    achievement_notifications BOOLEAN DEFAULT TRUE,
    
    -- Privacy settings
    profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'friends')),
    show_stats BOOLEAN DEFAULT TRUE,
    show_activity BOOLEAN DEFAULT TRUE,
    
    -- App preferences
    theme TEXT DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'America/Los_Angeles',
    date_format TEXT DEFAULT 'MM/DD/YYYY',
    time_format TEXT DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
    
    -- Training preferences
    default_rest_duration INTEGER DEFAULT 60, -- seconds
    workout_reminder_time TIME DEFAULT '08:00:00',
    weekly_goal_workouts INTEGER DEFAULT 4,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own settings
CREATE POLICY "Users can view own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_updated_at();

-- Function to create default settings for new users
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger should be created on auth.users table
-- You may need to run this separately with admin privileges:
-- CREATE TRIGGER trigger_create_default_user_settings
--     AFTER INSERT ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION create_default_user_settings();

-- Comment on table
COMMENT ON TABLE user_settings IS 'Stores user preferences, notification settings, and app configuration';



-- ============================================================================
-- Migration: create-injuries-table.sql
-- Type: database
-- ============================================================================

-- Create injuries table for tracking player injuries
-- This table stores injury reports that can be used for:
-- - Wellness statistics and analytics
-- - AI-Powered Training Scheduler adjustments
-- - Periodization modifications

CREATE TABLE IF NOT EXISTS injuries (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- Body part (ankle, knee, hamstring, etc.)
    severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 10), -- 1-10 scale
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, recovering, monitoring, recovered
    start_date DATE NOT NULL,
    recovery_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for common queries
    CONSTRAINT valid_status CHECK (status IN ('active', 'recovering', 'monitoring', 'recovered'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_injuries_user_id ON injuries(user_id);
CREATE INDEX IF NOT EXISTS idx_injuries_status ON injuries(status);
CREATE INDEX IF NOT EXISTS idx_injuries_start_date ON injuries(start_date);
CREATE INDEX IF NOT EXISTS idx_injuries_user_status ON injuries(user_id, status);
CREATE INDEX IF NOT EXISTS idx_injuries_active ON injuries(user_id, status) WHERE status IN ('active', 'recovering', 'monitoring');

-- Add comment for documentation
COMMENT ON TABLE injuries IS 'Stores player injury reports for wellness tracking and training schedule adjustments';
COMMENT ON COLUMN injuries.severity IS 'Pain/injury severity on a scale of 1-10';
COMMENT ON COLUMN injuries.status IS 'Injury status: active (currently affecting training), recovering (improving), monitoring (minor, watching closely), recovered (healed)';




-- ============================================================================
-- Migration: fix_wellness_sync_trigger.sql
-- Type: database
-- ============================================================================

-- Migration: Sync wellness_entries to wellness_logs
-- This trigger ensures data flows from the frontend's wellness_entries table
-- to the backend's wellness_logs table that calc-readiness function expects.
--
-- Issue: Frontend writes to wellness_entries, backend reads from wellness_logs
-- Solution: Automatic sync via trigger

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS sync_wellness_entries_to_logs ON wellness_entries;
DROP FUNCTION IF EXISTS sync_wellness_entry_to_log();

-- Create function to sync wellness_entries -> wellness_logs
CREATE OR REPLACE FUNCTION sync_wellness_entry_to_log()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update wellness_logs with data from wellness_entries
    INSERT INTO wellness_logs (
        athlete_id,
        user_id,
        log_date,
        fatigue,
        sleep_quality,
        soreness,
        mood,
        stress,
        energy,
        sleep_hours,
        created_at
    )
    VALUES (
        NEW.athlete_id,
        COALESCE(NEW.user_id, NEW.athlete_id), -- Use athlete_id if user_id is null
        NEW.date,
        -- Map muscle_soreness to fatigue (inverted: low soreness = low fatigue)
        COALESCE(NEW.muscle_soreness, 3),
        COALESCE(NEW.sleep_quality, 3),
        COALESCE(NEW.muscle_soreness, 3),
        COALESCE(NEW.mood, 3),
        COALESCE(NEW.stress_level, 3),
        COALESCE(NEW.energy_level, 3),
        7.0, -- Default sleep hours (wellness_entries doesn't have this field)
        COALESCE(NEW.created_at, NOW())
    )
    ON CONFLICT (athlete_id, log_date)
    DO UPDATE SET
        user_id = EXCLUDED.user_id,
        fatigue = EXCLUDED.fatigue,
        sleep_quality = EXCLUDED.sleep_quality,
        soreness = EXCLUDED.soreness,
        mood = EXCLUDED.mood,
        stress = EXCLUDED.stress,
        energy = EXCLUDED.energy,
        sleep_hours = EXCLUDED.sleep_hours,
        created_at = EXCLUDED.created_at;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync on insert or update
CREATE TRIGGER sync_wellness_entries_to_logs
AFTER INSERT OR UPDATE ON wellness_entries
FOR EACH ROW
EXECUTE FUNCTION sync_wellness_entry_to_log();

-- Add unique constraint to wellness_logs if not exists
-- This allows ON CONFLICT to work
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'wellness_logs_athlete_date_unique'
    ) THEN
        ALTER TABLE wellness_logs
        ADD CONSTRAINT wellness_logs_athlete_date_unique
        UNIQUE (athlete_id, log_date);
    END IF;
END $$;

-- Backfill existing wellness_entries data to wellness_logs
INSERT INTO wellness_logs (
    athlete_id,
    user_id,
    log_date,
    fatigue,
    sleep_quality,
    soreness,
    mood,
    stress,
    energy,
    sleep_hours,
    created_at
)
SELECT
    athlete_id,
    COALESCE(user_id, athlete_id),
    date,
    COALESCE(muscle_soreness, 3),
    COALESCE(sleep_quality, 3),
    COALESCE(muscle_soreness, 3),
    COALESCE(mood, 3),
    COALESCE(stress_level, 3),
    COALESCE(energy_level, 3),
    7.0,
    COALESCE(created_at, NOW())
FROM wellness_entries
ON CONFLICT (athlete_id, log_date)
DO UPDATE SET
    user_id = EXCLUDED.user_id,
    fatigue = EXCLUDED.fatigue,
    sleep_quality = EXCLUDED.sleep_quality,
    soreness = EXCLUDED.soreness,
    mood = EXCLUDED.mood,
    stress = EXCLUDED.stress,
    energy = EXCLUDED.energy,
    sleep_hours = EXCLUDED.sleep_hours;

-- Add comment explaining the sync
COMMENT ON FUNCTION sync_wellness_entry_to_log() IS 
'Automatically syncs wellness_entries (frontend) to wellness_logs (backend calc-readiness) to ensure data consistency';

COMMENT ON TRIGGER sync_wellness_entries_to_logs ON wellness_entries IS
'Keeps wellness_logs in sync with wellness_entries for backend readiness calculations';




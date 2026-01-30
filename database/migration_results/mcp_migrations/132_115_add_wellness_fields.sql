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

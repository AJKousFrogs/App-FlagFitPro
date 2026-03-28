-- ============================================================================
-- Migration 20260330: Add missing wellness fields to daily_wellness_checkin + wellness_entries
-- ============================================================================
-- Motivation/mood/hydration were added to the frontend, but production schema lacked
-- those columns so the wellness check-in API failed with `column does not exist` errors.
-- This migration adds the columns only when they are absent and keeps the table comment/details.
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'daily_wellness_checkin'
          AND column_name = 'motivation_level'
    ) THEN
        ALTER TABLE public.daily_wellness_checkin
        ADD COLUMN motivation_level INTEGER CHECK (motivation_level >= 0 AND motivation_level <= 10);
        COMMENT ON COLUMN public.daily_wellness_checkin.motivation_level IS 'Motivation level (0-10 scale)';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'daily_wellness_checkin'
          AND column_name = 'mood'
    ) THEN
        ALTER TABLE public.daily_wellness_checkin
        ADD COLUMN mood INTEGER CHECK (mood >= 0 AND mood <= 10);
        COMMENT ON COLUMN public.daily_wellness_checkin.mood IS 'Mood rating (0-10 scale)';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'daily_wellness_checkin'
          AND column_name = 'hydration_level'
    ) THEN
        ALTER TABLE public.daily_wellness_checkin
        ADD COLUMN hydration_level INTEGER CHECK (hydration_level >= 0 AND hydration_level <= 10);
        COMMENT ON COLUMN public.daily_wellness_checkin.hydration_level IS 'Hydration level (0-10 scale)';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'wellness_entries'
          AND column_name = 'motivation_level'
    ) THEN
        ALTER TABLE public.wellness_entries
        ADD COLUMN motivation_level INTEGER CHECK (motivation_level >= 0 AND motivation_level <= 10);
        COMMENT ON COLUMN public.wellness_entries.motivation_level IS 'Motivation level (0-10 scale)';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'wellness_entries'
          AND column_name = 'mood'
    ) THEN
        ALTER TABLE public.wellness_entries
        ADD COLUMN mood INTEGER CHECK (mood >= 0 AND mood <= 10);
        COMMENT ON COLUMN public.wellness_entries.mood IS 'Mood rating (0-10 scale)';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'wellness_entries'
          AND column_name = 'hydration_level'
    ) THEN
        ALTER TABLE public.wellness_entries
        ADD COLUMN hydration_level INTEGER CHECK (hydration_level >= 0 AND hydration_level <= 10);
        COMMENT ON COLUMN public.wellness_entries.hydration_level IS 'Hydration level (0-10 scale)';
    END IF;
END $$;

COMMENT ON TABLE public.daily_wellness_checkin IS
    'Primary table for daily wellness check-ins. Contains sleep, energy, stress, soreness, motivation, mood, hydration, and readiness metrics.';

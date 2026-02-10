-- ============================================================================
-- Migration: Add rest_seconds column to protocol_exercises
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

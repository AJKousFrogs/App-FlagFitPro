-- ============================================================================
-- Migration 113: Extend Protocol Block Types
-- ============================================================================
-- This migration extends the block_type CHECK constraint in protocol_exercises
-- to support the new evidence-based training blocks introduced for the 1.5h
-- structured gym training program.
--
-- New block types added:
-- - isometrics: Tendon loading, injury prevention (15 min)
-- - plyometrics: Power development, reactive strength (15 min)
-- - strength: Primary strength work incl. Nordic curls (15 min)
-- - conditioning: ACWR-adjusted metabolic conditioning (15 min)
-- - skill_drills: Position-specific skill/twitching work (15 min)
-- - rehab_exercises: For return-to-play protocol
-- - rehab_progression: Progressive rehab loading
--
-- This change is backwards compatible - existing data is preserved.
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE protocol_exercises 
DROP CONSTRAINT IF EXISTS protocol_exercises_block_type_check;

-- Add the new expanded constraint with all block types
ALTER TABLE protocol_exercises 
ADD CONSTRAINT protocol_exercises_block_type_check 
CHECK (block_type IN (
    -- Original blocks
    'morning_mobility', 
    'foam_roll', 
    'warm_up', 
    'main_session', 
    'cool_down', 
    'evening_recovery',
    -- New evidence-based blocks (1.5h gym structure)
    'isometrics',
    'plyometrics',
    'strength',
    'conditioning',
    'skill_drills',
    -- Return-to-play blocks
    'rehab_exercises',
    'rehab_progression',
    -- Evening mobility (alternative name)
    'evening_mobility'
));

-- Add status columns for new blocks to daily_protocols if they don't exist
DO $$
BEGIN
    -- Isometrics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'isometrics_status') THEN
        ALTER TABLE daily_protocols ADD COLUMN isometrics_status TEXT DEFAULT 'pending' 
        CHECK (isometrics_status IN ('pending', 'in_progress', 'complete', 'skipped'));
    END IF;
    
    -- Plyometrics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'plyometrics_status') THEN
        ALTER TABLE daily_protocols ADD COLUMN plyometrics_status TEXT DEFAULT 'pending'
        CHECK (plyometrics_status IN ('pending', 'in_progress', 'complete', 'skipped'));
    END IF;
    
    -- Strength
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'strength_status') THEN
        ALTER TABLE daily_protocols ADD COLUMN strength_status TEXT DEFAULT 'pending'
        CHECK (strength_status IN ('pending', 'in_progress', 'complete', 'skipped'));
    END IF;
    
    -- Conditioning
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'conditioning_status') THEN
        ALTER TABLE daily_protocols ADD COLUMN conditioning_status TEXT DEFAULT 'pending'
        CHECK (conditioning_status IN ('pending', 'in_progress', 'complete', 'skipped'));
    END IF;
    
    -- Skill Drills
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'skill_drills_status') THEN
        ALTER TABLE daily_protocols ADD COLUMN skill_drills_status TEXT DEFAULT 'pending'
        CHECK (skill_drills_status IN ('pending', 'in_progress', 'complete', 'skipped'));
    END IF;
    
    -- Warm Up
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'warm_up_status') THEN
        ALTER TABLE daily_protocols ADD COLUMN warm_up_status TEXT DEFAULT 'pending'
        CHECK (warm_up_status IN ('pending', 'in_progress', 'complete', 'skipped'));
    END IF;
    
    -- Cool Down
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'cool_down_status') THEN
        ALTER TABLE daily_protocols ADD COLUMN cool_down_status TEXT DEFAULT 'pending'
        CHECK (cool_down_status IN ('pending', 'in_progress', 'complete', 'skipped'));
    END IF;
END $$;

-- Add timestamp columns for new blocks if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'isometrics_completed_at') THEN
        ALTER TABLE daily_protocols ADD COLUMN isometrics_completed_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'plyometrics_completed_at') THEN
        ALTER TABLE daily_protocols ADD COLUMN plyometrics_completed_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'strength_completed_at') THEN
        ALTER TABLE daily_protocols ADD COLUMN strength_completed_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'conditioning_completed_at') THEN
        ALTER TABLE daily_protocols ADD COLUMN conditioning_completed_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'skill_drills_completed_at') THEN
        ALTER TABLE daily_protocols ADD COLUMN skill_drills_completed_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'warm_up_completed_at') THEN
        ALTER TABLE daily_protocols ADD COLUMN warm_up_completed_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'cool_down_completed_at') THEN
        ALTER TABLE daily_protocols ADD COLUMN cool_down_completed_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add coach modification fields if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'coach_alert_active') THEN
        ALTER TABLE daily_protocols ADD COLUMN coach_alert_active BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'coach_alert_message') THEN
        ALTER TABLE daily_protocols ADD COLUMN coach_alert_message TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'coach_alert_requires_acknowledgment') THEN
        ALTER TABLE daily_protocols ADD COLUMN coach_alert_requires_acknowledgment BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'coach_acknowledged') THEN
        ALTER TABLE daily_protocols ADD COLUMN coach_acknowledged BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'modified_by_coach_id') THEN
        ALTER TABLE daily_protocols ADD COLUMN modified_by_coach_id UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'modified_by_coach_name') THEN
        ALTER TABLE daily_protocols ADD COLUMN modified_by_coach_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'modified_at') THEN
        ALTER TABLE daily_protocols ADD COLUMN modified_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'coach_note') THEN
        ALTER TABLE daily_protocols ADD COLUMN coach_note TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'coach_note_priority') THEN
        ALTER TABLE daily_protocols ADD COLUMN coach_note_priority TEXT DEFAULT 'info';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_protocols' AND column_name = 'confidence_metadata') THEN
        ALTER TABLE daily_protocols ADD COLUMN confidence_metadata JSONB;
    END IF;
END $$;

-- Update the protocol_completions table to support new block types if needed
ALTER TABLE protocol_completions 
DROP CONSTRAINT IF EXISTS protocol_completions_block_type_check;

-- Allow any block type in completions (no constraint - more flexible)
-- The application code controls which block types are valid

COMMENT ON TABLE protocol_exercises IS 'Individual exercises prescribed within a daily protocol. Supports evidence-based 1.5h gym structure with isometrics, plyometrics, strength, conditioning, and skill drills blocks.';

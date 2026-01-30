-- Migration: Fix users table to support profile save functionality
-- Issue: Profile settings cannot save because required columns are missing
-- Created: 2025-01-09
--
-- This migration adds the missing columns that the settings component expects
-- and renames birth_date to date_of_birth for consistency

-- =============================================================================
-- STEP 1: Add missing columns
-- =============================================================================

-- Add full_name column (calculated from first_name + last_name)
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(200);

-- Add jersey_number column (player's jersey number)
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS jersey_number INTEGER;

-- Add phone column (contact phone number)
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add team column (team name/ID - note: this is separate from team_members relationship)
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS team VARCHAR(100);

-- =============================================================================
-- STEP 2: Rename birth_date to date_of_birth for consistency
-- =============================================================================

-- Check if birth_date exists before renaming
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE public.users 
      RENAME COLUMN birth_date TO date_of_birth;
    
    RAISE NOTICE 'Column birth_date renamed to date_of_birth';
  ELSE
    RAISE NOTICE 'Column birth_date does not exist, skipping rename';
  END IF;
END $$;

-- =============================================================================
-- STEP 3: Backfill full_name from existing data
-- =============================================================================

-- Update existing records to populate full_name
UPDATE public.users 
SET full_name = TRIM(CONCAT(first_name, ' ', last_name))
WHERE full_name IS NULL 
  AND (first_name IS NOT NULL OR last_name IS NOT NULL);

-- =============================================================================
-- STEP 4: Create index for performance
-- =============================================================================

-- Add index on full_name for search performance
CREATE INDEX IF NOT EXISTS idx_users_full_name ON public.users(full_name);

-- Add index on jersey_number for team roster queries
CREATE INDEX IF NOT EXISTS idx_users_jersey_number ON public.users(jersey_number) 
  WHERE jersey_number IS NOT NULL;

-- =============================================================================
-- STEP 5: Add comments for documentation
-- =============================================================================

COMMENT ON COLUMN public.users.full_name IS 'Full display name (calculated from first_name + last_name or user-provided)';
COMMENT ON COLUMN public.users.jersey_number IS 'Player jersey number (can also be stored in team_members for team-specific jerseys)';
COMMENT ON COLUMN public.users.phone IS 'Contact phone number';
COMMENT ON COLUMN public.users.team IS 'Primary team affiliation (name or reference)';
COMMENT ON COLUMN public.users.date_of_birth IS 'Date of birth (renamed from birth_date for API consistency)';

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify columns were added:
-- SELECT column_name, data_type, character_maximum_length 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND table_name = 'users' 
--   AND column_name IN ('full_name', 'jersey_number', 'phone', 'team', 'date_of_birth')
-- ORDER BY column_name;

-- Verify full_name was populated:
-- SELECT id, first_name, last_name, full_name 
-- FROM public.users 
-- LIMIT 5;

-- =============================================================================
-- NOTES
-- =============================================================================
/*
1. This migration makes the users table compatible with the settings component
2. full_name is now the authoritative display name
3. jersey_number in users table is for personal jersey preference
   (team_members.jersey_number is for team-specific jersey assignments)
4. date_of_birth is now consistent with the API naming convention
5. All changes are backwards-compatible (columns are nullable)
6. Existing data is preserved and backfilled where possible
*/

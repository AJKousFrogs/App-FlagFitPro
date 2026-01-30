-- Migration: Make password_hash nullable in users table
-- Issue: Settings cannot save for users who don't have a password_hash
-- Reason: Supabase Auth manages passwords in auth.users, not in public.users
-- Created: 2026-01-11
--
-- This migration makes password_hash nullable because:
-- 1. Supabase Auth stores passwords in auth.users table (encrypted)
-- 2. The public.users table is for profile/app data only
-- 3. Having password_hash as NOT NULL prevents profile updates for auth-only users

-- =============================================================================
-- STEP 1: Make password_hash nullable
-- =============================================================================

-- Check if password_hash column exists and alter it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'password_hash'
  ) THEN
    -- Make the column nullable
    ALTER TABLE public.users 
      ALTER COLUMN password_hash DROP NOT NULL;
    
    RAISE NOTICE 'Column password_hash is now nullable';
  ELSE
    RAISE NOTICE 'Column password_hash does not exist in public.users';
  END IF;
END $$;

-- =============================================================================
-- STEP 2: Add comment explaining why it's nullable
-- =============================================================================

COMMENT ON COLUMN public.users.password_hash IS 
  'DEPRECATED: Password hashes are managed by Supabase Auth in auth.users table. 
   This column is kept for backwards compatibility but should be NULL for all users. 
   Do not use this column for authentication.';

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================

-- Verify the column is now nullable:
-- SELECT column_name, is_nullable, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND table_name = 'users' 
--   AND column_name = 'password_hash';

-- =============================================================================
-- NOTES
-- =============================================================================
/*
1. This makes password_hash nullable so profile updates don't fail
2. Supabase Auth handles all password management in auth.users
3. The password_hash column in public.users should always be NULL
4. Consider removing this column entirely in a future migration once verified
5. This is a safe change - no data loss, backwards compatible
*/

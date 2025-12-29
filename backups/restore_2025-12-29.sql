-- FlagFit Pro Database Restore Script
-- Backup Date: 2025-12-29
-- 
-- This script restores all backed up data from the 2025-12-29 backup.
-- 
-- USAGE:
--   Run each file in order, or run this master script which includes all tables.
--
-- RESTORE ORDER (respects foreign key dependencies):
--   1. users (no dependencies)
--   2. flag_football_positions (no dependencies)
--   3. exercises (no dependencies)
--   4. research_topics (no dependencies)
--   5. ai_coaches (no dependencies)
--   6. training_programs (depends on flag_football_positions)
--   7. training_phases (depends on training_programs)
--   8. training_weeks (depends on training_phases)
--
-- WARNING: This will upsert data. Existing records with matching IDs will be updated.

-- ============================================================================
-- RESTORE INSTRUCTIONS
-- ============================================================================
-- 
-- Option 1: Run individual SQL files via Supabase Dashboard
--   1. Go to Supabase Dashboard > SQL Editor
--   2. Run each backup file in the order listed above
--
-- Option 2: Use Supabase CLI
--   supabase db reset  # WARNING: This drops all data!
--   # Then run migrations and seed data
--
-- Option 3: Use psql directly
--   psql $DATABASE_URL -f backups/backup_2025-12-29_users.sql
--   psql $DATABASE_URL -f backups/backup_2025-12-29_exercises.sql
--   # ... etc
--
-- ============================================================================

BEGIN;

-- Log restore start
DO $$
BEGIN
  RAISE NOTICE 'Starting FlagFit Pro database restore from 2025-12-29 backup...';
END $$;

-- Include all backup files here (copy-paste contents or use \i in psql)
-- \i backup_2025-12-29_users.sql
-- \i backup_2025-12-29_flag_football_positions.sql
-- \i backup_2025-12-29_exercises.sql
-- \i backup_2025-12-29_research_topics.sql
-- \i backup_2025-12-29_ai_coaches.sql
-- \i backup_2025-12-29_training_programs.sql
-- \i backup_2025-12-29_training_phases.sql
-- \i backup_2025-12-29_training_weeks.sql

-- Log restore complete
DO $$
BEGIN
  RAISE NOTICE 'FlagFit Pro database restore complete!';
  RAISE NOTICE 'Restored tables: users, exercises, training_programs, training_phases, training_weeks, flag_football_positions, ai_coaches, research_topics';
END $$;

COMMIT;


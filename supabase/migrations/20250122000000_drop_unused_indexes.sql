-- =============================================================================
-- MIGRATION: Drop Unused Indexes
-- Migration: 20250122000000_drop_unused_indexes.sql
-- Purpose: Remove indexes that have never been used according to database linter
-- Created: 2025-01-22
-- =============================================================================
-- 
-- Indexes being removed:
-- 1. idx_chatbot_user_context_primary_team_id on chatbot_user_context(primary_team_id)
--    - Queries filter by user_id (which has an index), not primary_team_id
-- 2. idx_fixtures_team_id on fixtures(team_id)
--    - Queries filter by athlete_id (which has an index), not team_id directly
--    - RLS policies use subqueries that don't benefit from this index
-- =============================================================================

-- Drop unused index on chatbot_user_context.primary_team_id
-- Note: PostgreSQL/Supabase may have auto-created this with a different name
DROP INDEX IF EXISTS public.idx_chatbot_user_context_primary_team_id;
DROP INDEX IF EXISTS public.idx_chatbot_context_team;

-- Drop unused index on fixtures.team_id
-- Note: PostgreSQL/Supabase may have auto-created this with a different name
DROP INDEX IF EXISTS public.idx_fixtures_team_id;
DROP INDEX IF EXISTS public.idx_fixtures_team;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- After running this migration, verify the indexes are removed:
-- SELECT indexname, tablename 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('chatbot_user_context', 'fixtures')
--   AND indexname LIKE '%team%';
-- =============================================================================


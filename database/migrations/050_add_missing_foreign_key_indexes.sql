-- =============================================================================
-- Migration 050: Add missing foreign key indexes
-- Fixes unindexed foreign keys identified by database linter
-- =============================================================================
-- Purpose: Add covering indexes for foreign key constraints to improve
--          referential integrity check performance and join operations.
--
-- Note: These indexes were previously dropped in migration 049 as "unused"
--       for query filtering, but they are required for foreign key performance.
--       Foreign keys should always have covering indexes for:
--       1. Efficient referential integrity checks (ON DELETE/UPDATE)
--       2. Faster JOIN operations
--       3. Better query planner optimization
-- =============================================================================

-- Fix unindexed foreign key: chatbot_user_context.primary_team_id
-- Foreign key: chatbot_user_context_primary_team_id_fkey
-- References: teams(id) ON DELETE SET NULL
-- 
-- This index is required for:
-- - Efficient CASCADE/SET NULL operations when teams are deleted
-- - Fast JOINs between chatbot_user_context and teams
-- - Query planner optimization for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_chatbot_user_context_primary_team_id 
ON chatbot_user_context(primary_team_id)
WHERE primary_team_id IS NOT NULL;

COMMENT ON INDEX idx_chatbot_user_context_primary_team_id IS 
'Index covering foreign key chatbot_user_context_primary_team_id_fkey. Required for referential integrity performance and JOIN optimization.';

-- Fix unindexed foreign key: fixtures.team_id
-- Foreign key: fixtures_team_id_fkey
-- References: teams(id) ON DELETE CASCADE
--
-- This index is required for:
-- - Efficient CASCADE operations when teams are deleted
-- - Fast JOINs between fixtures and teams
-- - Query planner optimization for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_fixtures_team_id 
ON fixtures(team_id)
WHERE team_id IS NOT NULL;

COMMENT ON INDEX idx_fixtures_team_id IS 
'Index covering foreign key fixtures_team_id_fkey. Required for referential integrity performance and JOIN optimization.';

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- Verify indexes were created successfully
DO $$
DECLARE
    idx_count INTEGER;
BEGIN
    -- Check chatbot_user_context index
    SELECT COUNT(*) INTO idx_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'chatbot_user_context'
      AND indexname = 'idx_chatbot_user_context_primary_team_id';
    
    IF idx_count = 0 THEN
        RAISE WARNING 'Index idx_chatbot_user_context_primary_team_id was not created';
    ELSE
        RAISE NOTICE 'Index idx_chatbot_user_context_primary_team_id created successfully';
    END IF;
    
    -- Check fixtures index
    SELECT COUNT(*) INTO idx_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'fixtures'
      AND indexname = 'idx_fixtures_team_id';
    
    IF idx_count = 0 THEN
        RAISE WARNING 'Index idx_fixtures_team_id was not created';
    ELSE
        RAISE NOTICE 'Index idx_fixtures_team_id created successfully';
    END IF;
END $$;


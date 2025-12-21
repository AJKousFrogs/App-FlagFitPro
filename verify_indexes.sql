-- Verify that the foreign key indexes were created successfully
-- Run this in Supabase SQL Editor to confirm

-- Check chatbot_user_context index
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'chatbot_user_context'
  AND indexname = 'idx_chatbot_user_context_primary_team_id';

-- Check fixtures index
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'fixtures'
  AND indexname = 'idx_fixtures_team_id';

-- Summary: List all indexes on these tables
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('chatbot_user_context', 'fixtures')
ORDER BY tablename, indexname;


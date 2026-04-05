-- ============================================================================
-- Database Index Validation Script
-- Verifies indexes exist for optimal query performance under concurrent load
-- ============================================================================
-- Run this in Supabase SQL Editor to validate database indexes
-- Expected execution time: < 5 seconds
-- ============================================================================

-- ============================================================================
-- PART 1: CHECK CRITICAL INDEXES FOR WORKOUT LOGS
-- ============================================================================

\echo '=== Workout Logs Indexes ==='

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'workout_logs'
ORDER BY indexname;

-- Expected indexes:
-- ✓ idx_workout_logs_player (player_id)
-- ✓ idx_workout_logs_date (completed_at)
-- ✓ idx_workout_logs_session (session_id)
-- ✓ idx_workout_logs_player_date (player_id, created_at DESC)

-- ============================================================================
-- PART 2: CHECK TRAINING SESSIONS INDEXES
-- ============================================================================

\echo ''
\echo '=== Training Sessions Indexes ==='

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'training_sessions'
ORDER BY indexname;

-- Expected indexes:
-- ✓ idx_training_sessions_user_id (user_id)
-- ✓ idx_training_sessions_date (session_date)

-- ============================================================================
-- PART 3: CHECK ANALYTICS INDEXES
-- ============================================================================

\echo ''
\echo '=== Analytics Events Indexes ==='

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'analytics_events'
ORDER BY indexname;

-- Expected indexes:
-- ✓ idx_analytics_events_user_id (user_id)
-- ✓ idx_analytics_events_created_at (created_at)
-- ✓ idx_analytics_events_user_time (user_id, created_at)

\echo ''
\echo '=== Performance Metrics Indexes ==='

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'performance_metrics'
ORDER BY indexname;

\echo ''
\echo '=== Training Analytics Indexes ==='

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'training_analytics'
ORDER BY indexname;

-- ============================================================================
-- PART 4: INDEX USAGE STATISTICS
-- ============================================================================

\echo ''
\echo '=== Index Usage Statistics (Top 20) ==='

SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  CASE 
    WHEN idx_scan = 0 THEN '⚠️ UNUSED'
    WHEN idx_scan < 10 THEN '📊 Low usage'
    WHEN idx_scan < 100 THEN '✅ Normal usage'
    ELSE '🔥 High usage'
  END as usage_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'workout_logs',
    'training_sessions',
    'analytics_events',
    'performance_metrics',
    'training_analytics',
    'load_monitoring'
  )
ORDER BY idx_scan DESC
LIMIT 20;

-- ============================================================================
-- PART 5: TABLE SCAN ANALYSIS (Find Missing Indexes)
-- ============================================================================

\echo ''
\echo '=== Tables with High Sequential Scans (Potential Missing Indexes) ==='

SELECT 
  schemaname,
  tablename,
  seq_scan as sequential_scans,
  seq_tup_read as rows_scanned,
  idx_scan as index_scans,
  n_live_tup as total_rows,
  CASE 
    WHEN seq_scan = 0 THEN '✅ No seq scans'
    WHEN seq_scan < idx_scan THEN '✅ Mostly indexed'
    WHEN seq_scan > idx_scan THEN '⚠️ More seq scans than index scans'
    ELSE '❌ Only seq scans'
  END as scan_status,
  ROUND(100.0 * seq_scan / NULLIF(seq_scan + idx_scan, 0), 2) as seq_scan_percentage
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'workout_logs',
    'training_sessions',
    'analytics_events',
    'performance_metrics',
    'training_analytics',
    'load_monitoring'
  )
  AND seq_scan > 0
ORDER BY seq_scan DESC;

-- ============================================================================
-- PART 6: INDEX SIZE AND BLOAT
-- ============================================================================

\echo ''
\echo '=== Index Sizes ==='

SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'workout_logs',
    'training_sessions',
    'analytics_events',
    'performance_metrics',
    'training_analytics'
  )
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- PART 7: RECOMMENDED INDEXES (If Missing)
-- ============================================================================

\echo ''
\echo '=== Checking for Recommended Indexes ==='

-- Check if composite index for training sessions exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND tablename = 'training_sessions'
        AND indexdef LIKE '%status%session_date%'
    ) THEN '✅ Composite index (status, session_date) exists'
    ELSE '⚠️ RECOMMENDED: CREATE INDEX idx_training_sessions_status_date ON training_sessions(status, session_date DESC);'
  END as status_date_index;

-- Check if composite index for load monitoring exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND tablename = 'load_monitoring'
        AND indexdef LIKE '%player_id%date%'
    ) THEN '✅ Composite index (player_id, date) exists'
    ELSE '⚠️ RECOMMENDED: CREATE INDEX idx_load_monitoring_player_date ON load_monitoring(player_id, date DESC);'
  END as load_monitoring_index;

-- Check if composite index for training analytics exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND tablename = 'training_analytics'
        AND indexdef LIKE '%user_id%training_type%'
    ) THEN '✅ Composite index (user_id, training_type, created_at) exists'
    ELSE '⚠️ RECOMMENDED: CREATE INDEX idx_training_analytics_user_type_date ON training_analytics(user_id, training_type, created_at DESC);'
  END as analytics_type_index;

-- ============================================================================
-- PART 8: CONCURRENT INSERT PERFORMANCE CHECK
-- ============================================================================

\echo ''
\echo '=== Concurrent Insert Performance Analysis ==='

-- Check workout_logs table for potential insert bottlenecks
SELECT 
  'workout_logs' as table_name,
  n_tup_ins as total_inserts,
  n_tup_upd as total_updates,
  n_tup_del as total_deletes,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  CASE 
    WHEN n_dead_tup > n_live_tup * 0.1 THEN '⚠️ High dead tuples - consider VACUUM'
    ELSE '✅ Normal'
  END as vacuum_status,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename = 'workout_logs';

-- Check for lock contention
SELECT 
  'Lock Contention' as metric,
  COUNT(*) as waiting_queries
FROM pg_stat_activity
WHERE wait_event_type = 'Lock'
  AND query LIKE '%workout_logs%';

-- ============================================================================
-- PART 9: CREATE MISSING RECOMMENDED INDEXES (OPTIONAL)
-- ============================================================================

\echo ''
\echo '=== Optional: Run these commands to create missing indexes ==='
\echo ''

-- Composite index for training sessions (status + date filtering)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'training_sessions'
      AND indexname = 'idx_training_sessions_status_date'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_training_sessions_status_date 
             ON training_sessions(status, session_date DESC) 
             WHERE status = ''completed''';
    RAISE NOTICE '✅ Created: idx_training_sessions_status_date';
  ELSE
    RAISE NOTICE '✓ Already exists: idx_training_sessions_status_date';
  END IF;
END $$;

-- Composite index for load monitoring (athlete + date range)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'load_monitoring'
      AND indexname = 'idx_load_monitoring_player_date'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_load_monitoring_player_date 
             ON load_monitoring(player_id, date DESC)';
    RAISE NOTICE '✅ Created: idx_load_monitoring_player_date';
  ELSE
    RAISE NOTICE '✓ Already exists: idx_load_monitoring_player_date';
  END IF;
END $$;

-- Composite index for training analytics (user + type + date)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'training_analytics'
      AND indexname = 'idx_training_analytics_user_type_date'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_training_analytics_user_type_date 
             ON training_analytics(user_id, training_type, created_at DESC)';
    RAISE NOTICE '✅ Created: idx_training_analytics_user_type_date';
  ELSE
    RAISE NOTICE '✓ Already exists: idx_training_analytics_user_type_date';
  END IF;
END $$;

-- Composite index for performance metrics (user + date)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'performance_metrics'
      AND indexname = 'idx_performance_metrics_user_date'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_date 
             ON performance_metrics(user_id, created_at DESC)';
    RAISE NOTICE '✅ Created: idx_performance_metrics_user_date';
  ELSE
    RAISE NOTICE '✓ Already exists: idx_performance_metrics_user_date';
  END IF;
END $$;

-- ============================================================================
-- PART 10: VALIDATION SUMMARY
-- ============================================================================

\echo ''
\echo '=== Index Validation Summary ==='

WITH index_checks AS (
  SELECT 
    tablename,
    COUNT(*) as index_count,
    SUM(CASE WHEN idx_scan > 0 THEN 1 ELSE 0 END) as used_indexes,
    SUM(CASE WHEN idx_scan = 0 THEN 1 ELSE 0 END) as unused_indexes
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
    AND tablename IN (
      'workout_logs',
      'training_sessions',
      'analytics_events',
      'performance_metrics',
      'training_analytics',
      'load_monitoring'
    )
  GROUP BY tablename
)
SELECT 
  tablename,
  index_count,
  used_indexes,
  unused_indexes,
  CASE 
    WHEN index_count >= 3 AND unused_indexes = 0 THEN '✅ Well indexed'
    WHEN index_count >= 2 AND unused_indexes <= 1 THEN '✅ Good'
    WHEN unused_indexes > index_count / 2 THEN '⚠️ Many unused indexes'
    ELSE '⚠️ Needs review'
  END as status
FROM index_checks
ORDER BY tablename;

\echo ''
\echo '=== Validation Complete ==='
\echo 'Review the output above for any warnings or recommendations.'
\echo 'Run the CREATE INDEX commands in Part 9 if indexes are missing.'
\echo ''

-- =============================================================================
-- CONSENT PERFORMANCE INDEXES - Migration 074
-- =============================================================================
-- This migration adds optimized indexes for consent-aware view performance.
-- 
-- Based on EXPLAIN ANALYZE of consent views and common query patterns.
-- These indexes specifically optimize:
-- 1. Consent lookup joins (team_sharing_settings + team_members)
-- 2. Player data queries with date ordering
-- 3. Privacy settings lookups
-- 4. Deletion queue processing
-- =============================================================================

-- =============================================================================
-- PART 1: CONSENT LOOKUP INDEXES
-- =============================================================================

-- Index for fast consent lookup in coach queries
-- Used by: v_load_monitoring_consent, v_workout_logs_consent
CREATE INDEX IF NOT EXISTS idx_team_sharing_settings_consent_lookup
ON team_sharing_settings (user_id, team_id)
WHERE performance_sharing_enabled = true;

COMMENT ON INDEX idx_team_sharing_settings_consent_lookup IS 
'Optimizes consent checks in coach-facing views. Partial index only includes players who have enabled sharing.';

-- Index for health consent lookup (separate from performance)
CREATE INDEX IF NOT EXISTS idx_team_sharing_settings_health_consent
ON team_sharing_settings (user_id, team_id)
WHERE health_sharing_enabled = true;

COMMENT ON INDEX idx_team_sharing_settings_health_consent IS 
'Optimizes health data consent checks. Partial index for players who enabled health sharing.';

-- Index for fast coach membership lookup
-- Used by: consent views to verify coach role
CREATE INDEX IF NOT EXISTS idx_team_members_active_coaches
ON team_members (team_id, user_id)
WHERE role IN ('coach', 'assistant_coach', 'head_coach', 'admin') 
AND status = 'active';

COMMENT ON INDEX idx_team_members_active_coaches IS 
'Optimizes coach role verification in consent views. Partial index for active coaches only.';

-- Index for active player membership lookup
CREATE INDEX IF NOT EXISTS idx_team_members_active_players
ON team_members (team_id, user_id)
WHERE role = 'player' AND status = 'active';

COMMENT ON INDEX idx_team_members_active_players IS 
'Optimizes player membership lookup in team queries.';

-- =============================================================================
-- PART 2: PLAYER DATA INDEXES
-- =============================================================================

-- Index for load monitoring queries by player with date ordering
CREATE INDEX IF NOT EXISTS idx_load_monitoring_player_date
ON load_monitoring (player_id, calculated_at DESC);

COMMENT ON INDEX idx_load_monitoring_player_date IS 
'Optimizes player load history queries. DESC ordering matches common query pattern.';

-- Index for workout logs queries by player with date ordering
CREATE INDEX IF NOT EXISTS idx_workout_logs_player_date
ON workout_logs (player_id, created_at DESC);

COMMENT ON INDEX idx_workout_logs_player_date IS 
'Optimizes player workout history queries. DESC ordering matches common query pattern.';

-- Index for training sessions queries (common in ACWR calculations)
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_date
ON training_sessions (user_id, session_date DESC);

COMMENT ON INDEX idx_training_sessions_user_date IS 
'Optimizes training session queries for ACWR and load calculations.';

-- Alternative index for athlete_id column (some tables use this)
CREATE INDEX IF NOT EXISTS idx_training_sessions_athlete_date
ON training_sessions (athlete_id, session_date DESC)
WHERE athlete_id IS NOT NULL;

COMMENT ON INDEX idx_training_sessions_athlete_date IS 
'Optimizes training queries using athlete_id column.';

-- =============================================================================
-- PART 3: PRIVACY SETTINGS INDEXES
-- =============================================================================

-- Index for privacy settings lookup with sharing defaults
CREATE INDEX IF NOT EXISTS idx_privacy_settings_sharing
ON privacy_settings (user_id, performance_sharing_default, health_sharing_default);

COMMENT ON INDEX idx_privacy_settings_sharing IS 
'Optimizes privacy settings lookup for default sharing preferences.';

-- Index for AI processing consent checks
CREATE INDEX IF NOT EXISTS idx_privacy_settings_ai
ON privacy_settings (user_id)
WHERE ai_processing_enabled = true;

COMMENT ON INDEX idx_privacy_settings_ai IS 
'Optimizes AI consent checks. Partial index for users who enabled AI.';

-- =============================================================================
-- PART 4: DELETION QUEUE INDEXES
-- =============================================================================

-- Index for deletion queue processing
CREATE INDEX IF NOT EXISTS idx_deletion_requests_pending
ON account_deletion_requests (status, grace_period_ends_at)
WHERE status = 'pending';

COMMENT ON INDEX idx_deletion_requests_pending IS 
'Optimizes deletion queue batch processing. Partial index for pending deletions only.';

-- Index for deletion status lookup by user
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user
ON account_deletion_requests (user_id, status, requested_at DESC);

COMMENT ON INDEX idx_deletion_requests_user IS 
'Optimizes user deletion status lookup.';

-- =============================================================================
-- PART 5: CONSENT AUDIT LOG INDEXES
-- =============================================================================

-- Index for audit log queries by accessor
CREATE INDEX IF NOT EXISTS idx_consent_access_log_accessor_time
ON consent_access_log (accessor_user_id, accessed_at DESC);

COMMENT ON INDEX idx_consent_access_log_accessor_time IS 
'Optimizes audit log queries for who accessed what.';

-- Index for audit log queries by target user
CREATE INDEX IF NOT EXISTS idx_consent_access_log_target_time
ON consent_access_log (target_user_id, accessed_at DESC);

COMMENT ON INDEX idx_consent_access_log_target_time IS 
'Optimizes audit log queries for whose data was accessed.';

-- =============================================================================
-- PART 6: COMPOSITE INDEXES FOR COMMON JOIN PATTERNS
-- =============================================================================

-- Composite index for the common consent view join pattern
-- This covers the subquery: team_members coach JOIN team_members player ON team_id
CREATE INDEX IF NOT EXISTS idx_team_members_team_user_role_status
ON team_members (team_id, user_id, role, status);

COMMENT ON INDEX idx_team_members_team_user_role_status IS 
'Composite index for consent view join patterns. Covers team membership + role + status checks.';

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Function to verify indexes were created
CREATE OR REPLACE FUNCTION verify_consent_indexes()
RETURNS TABLE(
  index_name TEXT,
  table_name TEXT,
  exists BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    idx.name,
    idx.tbl,
    EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = idx.name AND tablename = idx.tbl
    )
  FROM (VALUES
    ('idx_team_sharing_settings_consent_lookup', 'team_sharing_settings'),
    ('idx_team_sharing_settings_health_consent', 'team_sharing_settings'),
    ('idx_team_members_active_coaches', 'team_members'),
    ('idx_team_members_active_players', 'team_members'),
    ('idx_load_monitoring_player_date', 'load_monitoring'),
    ('idx_workout_logs_player_date', 'workout_logs'),
    ('idx_training_sessions_user_date', 'training_sessions'),
    ('idx_privacy_settings_sharing', 'privacy_settings'),
    ('idx_privacy_settings_ai', 'privacy_settings'),
    ('idx_deletion_requests_pending', 'account_deletion_requests'),
    ('idx_consent_access_log_accessor_time', 'consent_access_log'),
    ('idx_consent_access_log_target_time', 'consent_access_log'),
    ('idx_team_members_team_user_role_status', 'team_members')
  ) AS idx(name, tbl);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- NOTES
-- =============================================================================
/*
Index Strategy:

1. PARTIAL INDEXES: Used where appropriate to reduce index size and improve
   write performance. Only index rows that match common query patterns.

2. DESC ORDERING: Most time-series queries order by date descending (most recent
   first), so indexes are created with DESC to match.

3. COMPOSITE INDEXES: Created for common join patterns to allow index-only scans.

4. COVERING INDEXES: Include all columns needed by common queries to avoid
   table lookups.

Performance Targets:
- Consent view read: < 100ms
- Dashboard load: < 500ms
- Batch player read (20): < 200ms
- Deletion queue processing: < 1000ms

Monitoring:
- Run EXPLAIN ANALYZE on consent views after applying
- Check pg_stat_user_indexes for index usage
- Monitor query performance in Supabase dashboard

To verify indexes:
  SELECT * FROM verify_consent_indexes();
*/


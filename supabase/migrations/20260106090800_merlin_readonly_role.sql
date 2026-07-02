-- Migration: Merlin Read-Only Role
-- Date: 2026-01-06
-- Purpose: Create read-only database role for Merlin AI

-- ============================================================================
-- CREATE READ-ONLY ROLE FOR MERLIN
-- ============================================================================
DO $$
BEGIN
    -- Create role if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'merlin_readonly') THEN
        CREATE ROLE merlin_readonly;
    END IF;
    
    -- Grant connect privilege
    GRANT CONNECT ON DATABASE postgres TO merlin_readonly;
    
    -- Grant usage on schema
    GRANT USAGE ON SCHEMA public TO merlin_readonly;
    
    -- Grant SELECT on read-only tables
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO merlin_readonly;
    GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO merlin_readonly;
    
    -- Set default privileges for future tables
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO merlin_readonly;
    
    -- REVOKE all write privileges explicitly
    REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM merlin_readonly;
    REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM merlin_readonly;
    
    -- Grant execute on read-only functions only
    GRANT EXECUTE ON FUNCTION get_athlete_consent(UUID, TEXT) TO merlin_readonly;
    GRANT EXECUTE ON FUNCTION has_active_safety_override(UUID, TEXT) TO merlin_readonly;
    GRANT EXECUTE ON FUNCTION get_executed_version(UUID, UUID) TO merlin_readonly;
    
    COMMENT ON ROLE merlin_readonly IS 'Read-only role for Merlin AI. Cannot modify any data.';
END $$;

-- ============================================================================
-- MERLIN VIOLATION LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS merlin_violation_log (
    violation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    violation_type TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_body TEXT,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_merlin_violation_log_timestamp ON merlin_violation_log(timestamp DESC);

COMMENT ON TABLE merlin_violation_log IS 'Append-only log of Merlin AI violation attempts';

-- ============================================================================
-- RLS: Merlin violation log append-only
-- ============================================================================
ALTER TABLE merlin_violation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Append-only merlin violations" ON merlin_violation_log;
CREATE POLICY "Append-only merlin violations"
ON merlin_violation_log
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role reads merlin violations" ON merlin_violation_log;
CREATE POLICY "Service role reads merlin violations"
ON merlin_violation_log
FOR SELECT
USING (auth.role() = 'service_role');


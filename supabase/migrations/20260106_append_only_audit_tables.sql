-- Migration: Create append-only audit tables
-- Date: 2026-01-06
-- Purpose: Implement Section 4.2 (Append-Only Tables) and Section 8 (Violation Handling)

-- Create authorization_violations table
CREATE TABLE IF NOT EXISTS authorization_violations (
  violation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  resource_id UUID,
  resource_type TEXT NOT NULL,
  action TEXT NOT NULL,
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  request_path TEXT,
  request_method TEXT,
  request_body JSONB
);

-- Append-only policy for authorization_violations
ALTER TABLE authorization_violations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Append-only authorization violations" ON authorization_violations;
CREATE POLICY "Append-only authorization violations"
ON authorization_violations FOR ALL
USING (false)  -- No reads except via service role
WITH CHECK (
  -- Only allow inserts
  true
);

-- Grant insert to authenticated (for API logging)
GRANT INSERT ON authorization_violations TO authenticated;

-- Grant select to service role (for admin viewing)
GRANT SELECT ON authorization_violations TO service_role;

-- Create indexes for querying
CREATE INDEX IF NOT EXISTS idx_auth_violations_user ON authorization_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_violations_timestamp ON authorization_violations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_auth_violations_resource ON authorization_violations(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_auth_violations_error_code ON authorization_violations(error_code);

-- Create append-only policies for audit logs (if tables exist)
DO $$
BEGIN
  -- execution_logs
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'execution_logs') THEN
    ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Append-only execution logs" ON execution_logs;
    CREATE POLICY "Append-only execution logs"
    ON execution_logs FOR ALL
    USING (false)
    WITH CHECK (true);  -- Allow inserts only
    GRANT INSERT ON execution_logs TO authenticated;
  END IF;
  
  -- readiness_logs
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'readiness_logs') THEN
    ALTER TABLE readiness_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Append-only readiness logs" ON readiness_logs;
    CREATE POLICY "Append-only readiness logs"
    ON readiness_logs FOR ALL
    USING (false)
    WITH CHECK (true);
    GRANT INSERT ON readiness_logs TO authenticated;
  END IF;
  
  -- pain_reports
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pain_reports') THEN
    ALTER TABLE pain_reports ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Append-only pain reports" ON pain_reports;
    CREATE POLICY "Append-only pain reports"
    ON pain_reports FOR ALL
    USING (false)
    WITH CHECK (true);
    GRANT INSERT ON pain_reports TO authenticated;
  END IF;
END $$;

COMMENT ON TABLE authorization_violations IS 'Append-only log of all authorization violation attempts. Used for security monitoring and audit.';


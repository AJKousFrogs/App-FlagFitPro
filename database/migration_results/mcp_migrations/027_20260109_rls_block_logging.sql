-- Migration: RLS Block Logging System
-- Date: 2026-01-09
-- Purpose: Log RLS policy blocks for observability
-- Note: This provides visibility into silent RLS failures

-- ============================================================================
-- FUNCTION: Log RLS Policy Blocks
-- ============================================================================

CREATE OR REPLACE FUNCTION log_rls_policy_block()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_operation TEXT;
BEGIN
  -- Get current user (may be null for anonymous attempts)
  v_user_id := auth.uid();
  
  -- Map trigger operation to action
  CASE TG_OP
    WHEN 'INSERT' THEN v_operation := 'INSERT';
    WHEN 'UPDATE' THEN v_operation := 'UPDATE';
    WHEN 'DELETE' THEN v_operation := 'DELETE';
    WHEN 'SELECT' THEN v_operation := 'SELECT';
    ELSE v_operation := 'UNKNOWN';
  END CASE;
  
  -- Log the block attempt (fire-and-forget, don't fail the operation)
  BEGIN
    INSERT INTO authorization_violations (
      user_id,
      resource_id,
      resource_type,
      action,
      error_code,
      error_message,
      timestamp
    ) VALUES (
      v_user_id,
      CASE 
        WHEN TG_OP IN ('UPDATE', 'DELETE') THEN COALESCE(OLD.id::TEXT, 'unknown')
        WHEN TG_OP = 'INSERT' THEN COALESCE(NEW.id::TEXT, 'unknown')
        ELSE 'unknown'
      END::UUID,
      TG_TABLE_NAME,
      v_operation,
      'RLS_POLICY_BLOCKED',
      format('RLS policy blocked %s operation on table %s', v_operation, TG_TABLE_NAME),
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Silently fail logging to avoid breaking the RLS check
    -- RLS block will still occur, we just won't log it
    NULL;
  END;
  
  -- Return NULL to indicate row should be blocked
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION log_rls_policy_block IS 'Logs RLS policy blocks to authorization_violations table for observability';

-- ============================================================================
-- EXAMPLE: Add logging trigger to a table
-- ============================================================================
-- 
-- To enable RLS block logging on a table, create a trigger like this:
--
-- CREATE TRIGGER log_training_sessions_rls_block
--   BEFORE INSERT OR UPDATE OR DELETE ON training_sessions
--   FOR EACH ROW
--   WHEN (NOT is_granted())  -- Only fire when RLS would block
--   EXECUTE FUNCTION log_rls_policy_block();
--
-- Note: This requires a helper function to check if RLS would grant access
-- For now, we'll implement this manually on high-value tables

-- ============================================================================
-- HIGH-VALUE TABLES: Add RLS block logging
-- ============================================================================

-- Training Sessions (high value, coach_locked logic)
-- Note: We can't directly detect RLS blocks, but we can log failed attempts
-- For now, this is a placeholder for future implementation

-- Future Enhancement:
-- Consider using PostgreSQL's pg_stat_statements extension to track query failures
-- Or implement application-level logging in the API layer

-- ============================================================================
-- ALTERNATIVE: Application-Level RLS Block Detection
-- ============================================================================

-- Instead of database triggers (which are complex for RLS detection),
-- recommend implementing RLS block detection in the API layer:
--
-- 1. Count rows before operation: SELECT COUNT(*) WHERE <condition>
-- 2. Attempt operation
-- 3. Check affected rows
-- 4. If affected_rows < expected_rows, log to authorization_violations
--
-- This is implemented in netlify/functions/utils/authorization-guard.cjs

COMMENT ON TABLE authorization_violations IS 'Logs authorization failures including RLS blocks. Application-level logging recommended over database triggers.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check authorization_violations table exists and has correct structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'authorization_violations'
  ) THEN
    RAISE EXCEPTION 'authorization_violations table does not exist. Run 20260106_append_only_audit_tables.sql first.';
  END IF;
END $$;

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'authorization_violations';


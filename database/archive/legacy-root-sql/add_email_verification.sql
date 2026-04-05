-- ============================================================================
-- Add Email Verification Support to Users Table
-- ============================================================================
-- This migration adds email verification columns and helper functions
-- Run this script in your Supabase SQL Editor
-- ============================================================================

-- Add email verification columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);

-- Create index for expired token cleanup queries
CREATE INDEX IF NOT EXISTS idx_users_verification_expires ON users(verification_token_expires_at) 
WHERE verification_token_expires_at IS NOT NULL;

-- ============================================================================
-- Helper Function: Generate Verification Token
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_verification_token()
RETURNS TEXT AS $$
BEGIN
  -- Generate a secure random token (64 characters)
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Helper Function: Verify Email Token
-- ============================================================================
CREATE OR REPLACE FUNCTION verify_email_token(token TEXT)
RETURNS UUID AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Find user with matching token that hasn't expired
  SELECT id INTO user_uuid
  FROM users
  WHERE verification_token = token
    AND verification_token_expires_at > NOW()
    AND email_verified = false;
  
  -- If found, mark email as verified and clear token
  IF user_uuid IS NOT NULL THEN
    UPDATE users
    SET email_verified = true,
        verification_token = NULL,
        verification_token_expires_at = NULL,
        updated_at = NOW()
    WHERE id = user_uuid;
  END IF;
  
  RETURN user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Helper Function: Clean Expired Tokens (for scheduled cleanup)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_verification_tokens()
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  UPDATE users
  SET verification_token = NULL,
      verification_token_expires_at = NULL
  WHERE verification_token_expires_at < NOW();
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================
COMMENT ON COLUMN users.verification_token IS 'Secure token for email verification';
COMMENT ON COLUMN users.verification_token_expires_at IS 'Expiration timestamp for verification token (typically 24-48 hours)';
COMMENT ON FUNCTION generate_verification_token() IS 'Generates a secure random token for email verification';
COMMENT ON FUNCTION verify_email_token(TEXT) IS 'Verifies email token and marks email as verified if valid';
COMMENT ON FUNCTION cleanup_expired_verification_tokens() IS 'Removes expired verification tokens (run periodically)';


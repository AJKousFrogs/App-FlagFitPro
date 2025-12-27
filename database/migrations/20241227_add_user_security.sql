-- Migration: Add user security table for 2FA
-- Description: Stores two-factor authentication settings and backup codes
-- Date: 2024-12-27

-- Create user_security table
CREATE TABLE IF NOT EXISTS user_security (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT, -- Encrypted TOTP secret
    two_factor_backup_codes TEXT[], -- Array of hashed backup codes
    two_factor_enabled_at TIMESTAMPTZ,
    last_password_change TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    lockout_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_security_user_id ON user_security(user_id);

-- Enable RLS
ALTER TABLE user_security ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own security settings
CREATE POLICY "Users can view own security settings"
    ON user_security FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own security settings
CREATE POLICY "Users can insert own security settings"
    ON user_security FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own security settings
CREATE POLICY "Users can update own security settings"
    ON user_security FOR UPDATE
    USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_security_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_security_updated_at
    BEFORE UPDATE ON user_security
    FOR EACH ROW
    EXECUTE FUNCTION update_user_security_updated_at();

-- Function to record 2FA enable time
CREATE OR REPLACE FUNCTION record_2fa_enabled_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.two_factor_enabled = TRUE AND (OLD.two_factor_enabled IS NULL OR OLD.two_factor_enabled = FALSE) THEN
        NEW.two_factor_enabled_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_record_2fa_enabled_at
    BEFORE UPDATE ON user_security
    FOR EACH ROW
    EXECUTE FUNCTION record_2fa_enabled_at();

-- Comment on table
COMMENT ON TABLE user_security IS 'Stores user security settings including 2FA configuration';
COMMENT ON COLUMN user_security.two_factor_secret IS 'Encrypted TOTP secret for authenticator apps';
COMMENT ON COLUMN user_security.two_factor_backup_codes IS 'Hashed backup codes for account recovery';

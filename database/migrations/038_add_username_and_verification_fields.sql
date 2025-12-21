-- Migration: Add username field and email verification fields
-- Description: Adds unique username and email verification tokens
-- Created: 2024-12-06

-- Add username column if it doesn't exist (unique)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;
        CREATE INDEX idx_users_username ON users(username);

        -- Optionally, populate username from email for existing users
        UPDATE users SET username = SPLIT_PART(email, '@', 1) WHERE username IS NULL;
    END IF;
END $$;

-- Add email verification columns if they don't exist
DO $$
BEGIN
    -- Add verification_token column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'verification_token'
    ) THEN
        ALTER TABLE users ADD COLUMN verification_token VARCHAR(255);
        CREATE INDEX idx_users_verification_token ON users(verification_token);
    END IF;

    -- Add verification_token_expires_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'verification_token_expires_at'
    ) THEN
        ALTER TABLE users ADD COLUMN verification_token_expires_at TIMESTAMP;
    END IF;

    -- Ensure email_verified exists (should already exist from base migration)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add role column if it doesn't exist (for player, coach, admin roles)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('player', 'coach', 'admin'));
        CREATE INDEX idx_users_role ON users(role);
    END IF;
END $$;

-- Add comment explaining the schema
COMMENT ON COLUMN users.username IS 'Unique username for the user (optional, can be NULL)';
COMMENT ON COLUMN users.email IS 'Unique email address for login and verification';
COMMENT ON COLUMN users.verification_token IS 'Token for email verification';
COMMENT ON COLUMN users.verification_token_expires_at IS 'Expiration time for verification token';
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email';
COMMENT ON COLUMN users.role IS 'User role: player, coach, or admin';

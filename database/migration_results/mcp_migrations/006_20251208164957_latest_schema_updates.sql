-- =============================================================================
-- LATEST SCHEMA UPDATES - Consolidated Migration
-- Migration: 20251208164957_latest_schema_updates.sql
-- Purpose: Consolidate latest database schema changes including notifications,
--          username/verification fields, and ensure all tables are up to date
-- Created: 2025-12-08
-- =============================================================================

-- =============================================================================
-- MIGRATION 037: NOTIFICATIONS UNIFICATION
-- Adds notification categories, preferences, and last_opened_at tracking
-- =============================================================================

-- 1. Create notification_type enum
DO $$ BEGIN
    CREATE TYPE notification_type_enum AS ENUM (
        'training',
        'achievement',
        'team',
        'wellness',
        'general',
        'game',
        'tournament',
        'injury_risk',
        'weather'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add last_opened_at to users table (if not exists)
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_last_opened_at TIMESTAMPTZ;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 3. Create user_notification_preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type notification_type_enum NOT NULL,
    muted BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- 4. Add updated_at to notifications table if not exists
DO $$ BEGIN
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 5. Add indexes for user_notification_preferences
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id 
    ON user_notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_type 
    ON user_notification_preferences(notification_type);

-- 6. Add index for notifications on notification_type
CREATE INDEX IF NOT EXISTS idx_notifications_type 
    ON notifications(notification_type);

-- 7. Add index for notifications on created_at (for last_opened_at filtering)
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
    ON notifications(user_id, created_at DESC);

-- 8. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_notification_updated_at ON notifications;
CREATE TRIGGER trigger_notification_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();

-- 10. Create function to update user_notification_preferences updated_at
CREATE OR REPLACE FUNCTION update_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger for preferences updated_at
DROP TRIGGER IF EXISTS trigger_preferences_updated_at ON user_notification_preferences;
CREATE TRIGGER trigger_preferences_updated_at
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_preferences_updated_at();

-- 12. Insert default preferences for existing users (all types enabled)
INSERT INTO user_notification_preferences (user_id, notification_type, muted, push_enabled, in_app_enabled)
SELECT DISTINCT 
    u.id,
    unnest(ARRAY[
        'training'::notification_type_enum,
        'achievement'::notification_type_enum,
        'team'::notification_type_enum,
        'wellness'::notification_type_enum,
        'general'::notification_type_enum,
        'game'::notification_type_enum,
        'tournament'::notification_type_enum,
        'injury_risk'::notification_type_enum,
        'weather'::notification_type_enum
    ]),
    false,
    true,
    true
FROM users u
ON CONFLICT (user_id, notification_type) DO NOTHING;

-- 13. Add RLS policies for user_notification_preferences
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON user_notification_preferences;

-- Users can read their own preferences
CREATE POLICY "Users can read their own notification preferences"
    ON user_notification_preferences
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can update their own notification preferences"
    ON user_notification_preferences
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own notification preferences"
    ON user_notification_preferences
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- MIGRATION 038: ADD USERNAME AND VERIFICATION FIELDS
-- Adds unique username and email verification tokens
-- =============================================================================

-- Add username column if it doesn't exist (unique)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

        -- Optionally, populate username from email for existing users
        UPDATE users SET username = SPLIT_PART(email, '@', 1) WHERE username IS NULL;
        
        EXECUTE 'COMMENT ON COLUMN users.username IS ''Unique username for the user (optional, can be NULL)''';
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
        CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
        EXECUTE 'COMMENT ON COLUMN users.verification_token IS ''Token for email verification''';
    END IF;

    -- Add verification_token_expires_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'verification_token_expires_at'
    ) THEN
        ALTER TABLE users ADD COLUMN verification_token_expires_at TIMESTAMP;
        EXECUTE 'COMMENT ON COLUMN users.verification_token_expires_at IS ''Expiration time for verification token''';
    END IF;

    -- Ensure email_verified exists (should already exist from base migration)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
        EXECUTE 'COMMENT ON COLUMN users.email_verified IS ''Whether the user has verified their email''';
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
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        EXECUTE 'COMMENT ON COLUMN users.role IS ''User role: player, coach, or admin''';
    END IF;
END $$;

-- Add comment for email column if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
        EXECUTE 'COMMENT ON COLUMN users.email IS ''Unique email address for login and verification''';
    END IF;
END $$;

-- =============================================================================
-- ENSURE UPDATE_UPDATED_AT_COLUMN FUNCTION EXISTS
-- This function is used by various triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ENSURE ALL CORE TABLES HAVE UPDATED_AT COLUMNS
-- =============================================================================

-- Add updated_at to teams if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'teams' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE teams ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add updated_at trigger for teams
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at to users if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add updated_at trigger for users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VERIFY CHATBOT CONTEXT TABLE EXISTS (from migration 039)
-- =============================================================================

-- Ensure chatbot_user_context table exists with all required fields
CREATE TABLE IF NOT EXISTS chatbot_user_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Role and team context
    user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('player', 'coach', 'admin')),
    primary_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team_type VARCHAR(20), -- 'domestic', 'international' (denormalized from teams)
    
    -- Personalization preferences
    preferred_topics TEXT[], -- Topics user frequently asks about
    expertise_level VARCHAR(20) DEFAULT 'intermediate' CHECK (expertise_level IN ('beginner', 'intermediate', 'advanced')),
    
    -- Usage statistics
    total_queries INTEGER DEFAULT 0,
    last_query_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Create indexes for chatbot_user_context if they don't exist
CREATE INDEX IF NOT EXISTS idx_chatbot_context_user ON chatbot_user_context(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_context_role ON chatbot_user_context(user_role);
CREATE INDEX IF NOT EXISTS idx_chatbot_context_team ON chatbot_user_context(primary_team_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_context_team_type ON chatbot_user_context(team_type);

-- Add update timestamp trigger for chatbot_user_context
DROP TRIGGER IF EXISTS update_chatbot_context_updated_at ON chatbot_user_context;
CREATE TRIGGER update_chatbot_context_updated_at
BEFORE UPDATE ON chatbot_user_context
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VERIFY TEAMS TABLE HAS TEAM TYPE FIELDS (from migration 039)
-- =============================================================================

-- Add team type and region fields to teams table
DO $$
BEGIN
    -- Add team_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'teams' AND column_name = 'team_type'
    ) THEN
        ALTER TABLE teams ADD COLUMN team_type VARCHAR(20) DEFAULT 'domestic' 
            CHECK (team_type IN ('domestic', 'international'));
        COMMENT ON COLUMN teams.team_type IS 'Team type: domestic (local/regional) or international (competes internationally)';
    END IF;

    -- Add region column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'teams' AND column_name = 'region'
    ) THEN
        ALTER TABLE teams ADD COLUMN region VARCHAR(100);
        COMMENT ON COLUMN teams.region IS 'Geographic region or country for the team';
    END IF;

    -- Add country_code column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'teams' AND column_name = 'country_code'
    ) THEN
        ALTER TABLE teams ADD COLUMN country_code VARCHAR(3);
        COMMENT ON COLUMN teams.country_code IS 'ISO 3166-1 alpha-3 country code (e.g., USA, CAN, GBR)';
    END IF;
END $$;

-- Create indexes for team type queries
CREATE INDEX IF NOT EXISTS idx_teams_type ON teams(team_type);
CREATE INDEX IF NOT EXISTS idx_teams_region ON teams(region);
CREATE INDEX IF NOT EXISTS idx_teams_country ON teams(country_code);

-- =============================================================================
-- VERIFY CHATBOT FUNCTIONS EXIST (from migration 039)
-- =============================================================================

-- Function: Get or create chatbot context
CREATE OR REPLACE FUNCTION get_or_create_chatbot_context(p_user_id UUID)
RETURNS chatbot_user_context AS $$
DECLARE
    v_context chatbot_user_context;
    v_user_role VARCHAR(20);
    v_primary_team_id UUID;
    v_team_type VARCHAR(20);
BEGIN
    -- Get user role
    SELECT role INTO v_user_role
    FROM users
    WHERE id = p_user_id;
    
    IF v_user_role IS NULL THEN
        v_user_role := 'player'; -- Default role
    END IF;
    
    -- Get primary team (most recent active team membership)
    SELECT tm.team_id, t.team_type INTO v_primary_team_id, v_team_type
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    WHERE tm.user_id = p_user_id
      AND tm.status = 'active'
    ORDER BY tm.joined_at DESC
    LIMIT 1;
    
    -- Get or create context
    SELECT * INTO v_context
    FROM chatbot_user_context
    WHERE user_id = p_user_id;
    
    IF v_context IS NULL THEN
        -- Create new context
        INSERT INTO chatbot_user_context (
            user_id,
            user_role,
            primary_team_id,
            team_type
        ) VALUES (
            p_user_id,
            v_user_role,
            v_primary_team_id,
            COALESCE(v_team_type, 'domestic')
        )
        RETURNING * INTO v_context;
    ELSE
        -- Update existing context if role or team changed
        IF v_context.user_role != v_user_role OR 
           v_context.primary_team_id IS DISTINCT FROM v_primary_team_id OR
           v_context.team_type IS DISTINCT FROM v_team_type THEN
            UPDATE chatbot_user_context
            SET user_role = v_user_role,
                primary_team_id = v_primary_team_id,
                team_type = COALESCE(v_team_type, 'domestic'),
                updated_at = NOW()
            WHERE user_id = p_user_id
            RETURNING * INTO v_context;
        END IF;
    END IF;
    
    RETURN v_context;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_or_create_chatbot_context IS 'Gets or creates chatbot context for a user, automatically syncing role and team info';

-- Function: Update chatbot query statistics
CREATE OR REPLACE FUNCTION update_chatbot_query_stats(p_user_id UUID, p_topic VARCHAR(100) DEFAULT NULL)
RETURNS void AS $$
BEGIN
    UPDATE chatbot_user_context
    SET total_queries = total_queries + 1,
        last_query_at = NOW(),
        preferred_topics = CASE
            WHEN p_topic IS NOT NULL AND NOT (p_topic = ANY(preferred_topics))
            THEN array_append(COALESCE(preferred_topics, ARRAY[]::TEXT[]), p_topic)
            ELSE preferred_topics
        END,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Create context if it doesn't exist
    IF NOT FOUND THEN
        PERFORM get_or_create_chatbot_context(p_user_id);
        UPDATE chatbot_user_context
        SET total_queries = 1,
            last_query_at = NOW(),
            preferred_topics = CASE
                WHEN p_topic IS NOT NULL THEN ARRAY[p_topic]
                ELSE ARRAY[]::TEXT[]
            END,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_chatbot_query_stats IS 'Updates chatbot usage statistics and tracks preferred topics';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================


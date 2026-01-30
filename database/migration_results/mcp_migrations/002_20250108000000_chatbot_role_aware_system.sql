-- =============================================================================
-- CHATBOT ROLE-AWARE SYSTEM
-- Migration: 039_chatbot_role_aware_system.sql
-- Purpose: Enable role-aware chatbot responses and team type differentiation
-- Created: 2025-01-XX
-- =============================================================================

-- =============================================================================
-- TEAM TYPE FIELDS
-- Add fields to distinguish domestic vs international teams
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
-- CHATBOT USER CONTEXT TABLE
-- Store user context for chatbot personalization
-- =============================================================================

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chatbot_context_user ON chatbot_user_context(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_context_role ON chatbot_user_context(user_role);
CREATE INDEX IF NOT EXISTS idx_chatbot_context_team ON chatbot_user_context(primary_team_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_context_team_type ON chatbot_user_context(team_type);

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update timestamp trigger
CREATE TRIGGER update_chatbot_context_updated_at
BEFORE UPDATE ON chatbot_user_context
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE chatbot_user_context IS 'Stores user context for chatbot personalization including role, team type, and preferences';
COMMENT ON COLUMN chatbot_user_context.user_role IS 'User role: player (athlete), coach, or admin';
COMMENT ON COLUMN chatbot_user_context.team_type IS 'Team type: domestic (local/regional) or international (competes internationally)';
COMMENT ON COLUMN chatbot_user_context.preferred_topics IS 'Array of topics the user frequently asks about (e.g., nutrition, recovery, training)';
COMMENT ON COLUMN chatbot_user_context.expertise_level IS 'User expertise level for tailoring response complexity';

-- =============================================================================
-- FUNCTION: Get or create chatbot context
-- Automatically creates context if it doesn't exist
-- =============================================================================

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

-- =============================================================================
-- FUNCTION: Update chatbot query statistics
-- Tracks chatbot usage for analytics
-- =============================================================================

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


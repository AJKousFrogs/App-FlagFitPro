-- Migration: Base Tables for Flag Football App
-- Description: Core user, team, and training tables
-- Created: 2024-10-15

-- =============================================================================
-- CORE FUNCTION: Update updated_at timestamp
-- This function is used by triggers across the database
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Users table (core user management)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    
    -- Player information
    position VARCHAR(20) CHECK (position IN ('QB', 'WR', 'RB', 'DB', 'LB', 'K', 'FLEX')),
    experience_level VARCHAR(20) DEFAULT 'beginner',
    
    -- Physical stats
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    birth_date DATE,
    
    -- Profile
    profile_picture VARCHAR(500),
    bio TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    
    -- Team settings
    max_members INTEGER DEFAULT 50,
    is_public BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT true,
    
    -- Contact info
    contact_email VARCHAR(255),
    website VARCHAR(500),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team memberships
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Role and position
    role VARCHAR(50) DEFAULT 'player', -- player, coach, assistant_coach, admin
    position VARCHAR(20),
    jersey_number INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, pending
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraints
    UNIQUE(user_id, team_id)
);

-- Training sessions (basic structure)
CREATE TABLE training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    
    -- Session details
    session_date DATE NOT NULL,
    session_type VARCHAR(100) NOT NULL,
    drill_type VARCHAR(100),
    
    -- Performance metrics
    duration_minutes INTEGER NOT NULL,
    intensity_level INTEGER CHECK (intensity_level BETWEEN 1 AND 10),
    completion_rate DECIMAL(5,2) CHECK (completion_rate BETWEEN 0 AND 100),
    performance_score DECIMAL(5,2),
    
    -- XP and progression
    xp_earned INTEGER DEFAULT 0,
    verification_confidence DECIMAL(3,2) DEFAULT 0.5,
    
    -- Notes and feedback
    notes TEXT,
    coach_feedback TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed', -- planned, in_progress, completed, cancelled
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_position ON users(position);

CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_location ON teams(location);

CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_role ON team_members(role);

CREATE INDEX idx_training_sessions_user_date ON training_sessions(user_id, session_date);
CREATE INDEX idx_training_sessions_team ON training_sessions(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_training_sessions_type ON training_sessions(session_type);

-- Add update triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_sessions_updated_at
    BEFORE UPDATE ON training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
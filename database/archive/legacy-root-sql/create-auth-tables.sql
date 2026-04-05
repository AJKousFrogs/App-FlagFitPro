-- ============================================================================
-- Authentication Tables for Supabase
-- Required for Netlify Functions auth flow
-- ============================================================================
-- This script creates core authentication tables with RLS policies
-- Run this script in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- Users table with proper authentication structure
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'player',
    
    -- Profile information
    avatar_url TEXT,
    bio TEXT,
    
    -- Player specific fields
    position VARCHAR(20),
    experience_level VARCHAR(20) DEFAULT 'beginner',
    
    -- Physical stats
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    birth_date DATE,
    
    -- Status and verification
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team memberships
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Role and position
    role VARCHAR(50) DEFAULT 'player',
    position VARCHAR(20),
    jersey_number INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraints
    UNIQUE(user_id, team_id)
);

-- Training sessions
CREATE TABLE IF NOT EXISTS training_sessions (
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
    is_verified BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts for community features
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Content
    title VARCHAR(255),
    content TEXT NOT NULL,
    post_type VARCHAR(50) DEFAULT 'general',
    
    -- Engagement
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    
    -- Status
    is_published BOOLEAN DEFAULT true,
    is_pinned BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Message details
    channel VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    
    -- Metadata
    reply_to UUID REFERENCES chat_messages(id),
    is_edited BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id ON training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON training_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- ============================================================================
-- Enable Row Level Security (RLS) on all tables
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for users table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view public profiles" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;

CREATE POLICY "Users can view own profile"
ON users FOR SELECT
TO authenticated
USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can view public profiles"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own profile"
ON users FOR DELETE
TO authenticated
USING (id = (SELECT auth.uid()));

-- ============================================================================
-- RLS Policies for teams table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view public teams" ON teams;
DROP POLICY IF EXISTS "Users can view own teams" ON teams;
DROP POLICY IF EXISTS "Coaches can manage teams" ON teams;

CREATE POLICY "Users can view public teams"
ON teams FOR SELECT
TO authenticated
USING (is_public = true OR id IN (
    SELECT team_id FROM team_members WHERE user_id = (SELECT auth.uid())
));

CREATE POLICY "Coaches can manage teams"
ON teams FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = teams.id
        AND user_id = (SELECT auth.uid())
        AND role IN ('coach', 'admin')
    )
);

-- ============================================================================
-- RLS Policies for team_members table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own team memberships" ON team_members;
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
DROP POLICY IF EXISTS "Coaches can manage team members" ON team_members;

CREATE POLICY "Users can view own team memberships"
ON team_members FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view team members"
ON team_members FOR SELECT
TO authenticated
USING (
    team_id IN (
        SELECT team_id FROM team_members WHERE user_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Coaches can manage team members"
ON team_members FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.role IN ('coach', 'admin')
    )
);

-- ============================================================================
-- RLS Policies for training_sessions table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own training sessions" ON training_sessions;
DROP POLICY IF EXISTS "Users can create own training sessions" ON training_sessions;
DROP POLICY IF EXISTS "Users can update own training sessions" ON training_sessions;
DROP POLICY IF EXISTS "Coaches can view team training sessions" ON training_sessions;

CREATE POLICY "Users can view own training sessions"
ON training_sessions FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own training sessions"
ON training_sessions FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own training sessions"
ON training_sessions FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Coaches can view team training sessions"
ON training_sessions FOR SELECT
TO authenticated
USING (
    team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = (SELECT auth.uid())
        AND role IN ('coach', 'admin')
    )
);

-- ============================================================================
-- RLS Policies for posts table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view published posts" ON posts;
DROP POLICY IF EXISTS "Users can create own posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

CREATE POLICY "Users can view published posts"
ON posts FOR SELECT
TO authenticated
USING (is_published = true OR user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own posts"
ON posts FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- RLS Policies for chat_messages table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view channel messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can create messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;

CREATE POLICY "Users can view channel messages"
ON chat_messages FOR SELECT
TO authenticated
USING (true); -- All authenticated users can view all channels

CREATE POLICY "Users can create messages"
ON chat_messages FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own messages"
ON chat_messages FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own messages"
ON chat_messages FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));
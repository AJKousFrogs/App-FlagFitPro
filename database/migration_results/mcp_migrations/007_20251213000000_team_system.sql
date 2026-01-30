-- Team System Migration
-- Creates tables for team management, invitations, and member tracking

-- =====================================================
-- TEAMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    league VARCHAR(255),
    season VARCHAR(100),
    home_city VARCHAR(255),
    team_logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#667eea',
    secondary_color VARCHAR(7) DEFAULT '#764ba2',
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT,
    founded_year INTEGER,
    motto VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for teams table
CREATE INDEX IF NOT EXISTS idx_teams_coach_id ON public.teams(coach_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_at ON public.teams(created_at DESC);

-- Add RLS policies for teams table
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Policy: Coaches can view their own teams
CREATE POLICY "Coaches can view their own teams"
    ON public.teams
    FOR SELECT
    USING (auth.uid() = coach_id);

-- Policy: Team members can view their team
CREATE POLICY "Team members can view their team"
    ON public.teams
    FOR SELECT
    USING (
        id IN (
            SELECT team_id
            FROM public.team_members
            WHERE user_id = auth.uid()
            AND status = 'active'
        )
    );

-- Policy: Coaches can create teams
CREATE POLICY "Coaches can create teams"
    ON public.teams
    FOR INSERT
    WITH CHECK (auth.uid() = coach_id);

-- Policy: Coaches can update their own teams
CREATE POLICY "Coaches can update their own teams"
    ON public.teams
    FOR UPDATE
    USING (auth.uid() = coach_id);

-- Policy: Coaches can delete their own teams
CREATE POLICY "Coaches can delete their own teams"
    ON public.teams
    FOR DELETE
    USING (auth.uid() = coach_id);

-- =====================================================
-- TEAM MEMBERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('coach', 'player', 'assistant_coach')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    jersey_number INTEGER CHECK (jersey_number >= 0 AND jersey_number <= 99),
    position VARCHAR(50),
    positions TEXT[], -- Array for multiple positions
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, user_id),
    UNIQUE(team_id, jersey_number)
);

-- Add indexes for team_members table
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON public.team_members(status);

-- Add RLS policies for team_members table
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view members of their own teams
CREATE POLICY "Users can view members of their own teams"
    ON public.team_members
    FOR SELECT
    USING (
        team_id IN (
            SELECT team_id
            FROM public.team_members
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Coaches can add members to their teams
CREATE POLICY "Coaches can add members to their teams"
    ON public.team_members
    FOR INSERT
    WITH CHECK (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = auth.uid()
        )
    );

-- Policy: Coaches can update members in their teams
CREATE POLICY "Coaches can update members in their teams"
    ON public.team_members
    FOR UPDATE
    USING (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = auth.uid()
        )
    );

-- Policy: Coaches can remove members from their teams
CREATE POLICY "Coaches can remove members from their teams"
    ON public.team_members
    FOR DELETE
    USING (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = auth.uid()
        )
    );

-- =====================================================
-- TEAM INVITATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'assistant_coach')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, email)
);

-- Add indexes for team_invitations table
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON public.team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON public.team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_expires_at ON public.team_invitations(expires_at);

-- Add RLS policies for team_invitations table
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Coaches can view invitations for their teams
CREATE POLICY "Coaches can view invitations for their teams"
    ON public.team_invitations
    FOR SELECT
    USING (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = auth.uid()
        )
    );

-- Policy: Users can view invitations sent to their email
CREATE POLICY "Users can view invitations sent to their email"
    ON public.team_invitations
    FOR SELECT
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Policy: Public access to invitations by token (for signup page)
CREATE POLICY "Public can view invitations by token"
    ON public.team_invitations
    FOR SELECT
    USING (true);

-- Policy: Coaches can create invitations for their teams
CREATE POLICY "Coaches can create invitations for their teams"
    ON public.team_invitations
    FOR INSERT
    WITH CHECK (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = auth.uid()
        )
        AND invited_by = auth.uid()
    );

-- Policy: Coaches can update invitations for their teams
CREATE POLICY "Coaches can update invitations for their teams"
    ON public.team_invitations
    FOR UPDATE
    USING (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = auth.uid()
        )
    );

-- Policy: Users can update invitations sent to their email (accept/decline)
CREATE POLICY "Users can update their own invitations"
    ON public.team_invitations
    FOR UPDATE
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for teams table
DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for team_members table
DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;
CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for team_invitations table
DROP TRIGGER IF EXISTS update_team_invitations_updated_at ON public.team_invitations;
CREATE TRIGGER update_team_invitations_updated_at
    BEFORE UPDATE ON public.team_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-expire invitations
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS void AS $$
BEGIN
    UPDATE public.team_invitations
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to add coach as team member when team is created
CREATE OR REPLACE FUNCTION public.add_coach_as_team_member()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.team_members (team_id, user_id, role, status)
    VALUES (NEW.id, NEW.coach_id, 'coach', 'active')
    ON CONFLICT (team_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-add coach as team member
DROP TRIGGER IF EXISTS auto_add_coach_to_team ON public.teams;
CREATE TRIGGER auto_add_coach_to_team
    AFTER INSERT ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION public.add_coach_as_team_member();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.teams IS 'Stores team information created by coaches';
COMMENT ON TABLE public.team_members IS 'Tracks team membership and player assignments';
COMMENT ON TABLE public.team_invitations IS 'Manages email invitations for players to join teams';

COMMENT ON COLUMN public.teams.coach_id IS 'The coach/owner who created and manages the team';
COMMENT ON COLUMN public.team_members.positions IS 'Array of positions a player can play (e.g., {QB, WR})';
COMMENT ON COLUMN public.team_invitations.token IS 'Unique token for invitation link verification';
COMMENT ON COLUMN public.team_invitations.expires_at IS 'Invitation expiry date (default 7 days from creation)';

-- ============================================================================
-- VIDEO BOOKMARKS AND CURATION TABLES
-- Migration: 050_create_video_tables.sql
-- Description: Tables for Instagram video integration, bookmarks, and curation
-- ============================================================================

-- ============================================================================
-- VIDEO BOOKMARKS TABLE
-- Stores user's saved/bookmarked training videos
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    video_title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    creator_username TEXT,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    
    -- Ensure unique bookmark per user per video
    UNIQUE(user_id, video_id)
);

-- Index for fast user bookmark lookups
CREATE INDEX IF NOT EXISTS idx_video_bookmarks_user_id ON video_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_video_bookmarks_saved_at ON video_bookmarks(saved_at DESC);

-- ============================================================================
-- VIDEO CURATION STATUS TABLE
-- Tracks approval/rejection status of videos for teams
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_curation_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One status per video per team
    UNIQUE(team_id, video_id)
);

-- Indexes for curation lookups
CREATE INDEX IF NOT EXISTS idx_video_curation_team_id ON video_curation_status(team_id);
CREATE INDEX IF NOT EXISTS idx_video_curation_status ON video_curation_status(status);

-- ============================================================================
-- TEAM VIDEO PLAYLISTS TABLE
-- Custom playlists created by coaches
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    position TEXT, -- Target position (QB, WR, DB, etc.)
    focus_areas TEXT[], -- Training focus areas
    video_ids TEXT[] NOT NULL DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for playlist lookups
CREATE INDEX IF NOT EXISTS idx_video_playlists_team_id ON video_playlists(team_id);
CREATE INDEX IF NOT EXISTS idx_video_playlists_created_by ON video_playlists(created_by);
CREATE INDEX IF NOT EXISTS idx_video_playlists_position ON video_playlists(position);

-- ============================================================================
-- VIDEO WATCH HISTORY TABLE
-- Tracks which videos users have watched
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_watch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    watched_at TIMESTAMPTZ DEFAULT NOW(),
    watch_duration_seconds INTEGER,
    completed BOOLEAN DEFAULT false,
    
    -- Allow multiple watches of same video
    CONSTRAINT unique_watch_session UNIQUE(user_id, video_id, watched_at)
);

-- Indexes for watch history
CREATE INDEX IF NOT EXISTS idx_video_watch_user_id ON video_watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_video_watch_video_id ON video_watch_history(video_id);
CREATE INDEX IF NOT EXISTS idx_video_watch_watched_at ON video_watch_history(watched_at DESC);

-- ============================================================================
-- VIDEO ASSIGNMENTS TABLE
-- Videos assigned to specific players by coaches
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES auth.users(id),
    assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    playlist_id UUID REFERENCES video_playlists(id) ON DELETE SET NULL,
    due_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes for assignments
CREATE INDEX IF NOT EXISTS idx_video_assignments_team ON video_assignments(team_id);
CREATE INDEX IF NOT EXISTS idx_video_assignments_assigned_to ON video_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_video_assignments_status ON video_assignments(status);
CREATE INDEX IF NOT EXISTS idx_video_assignments_due_date ON video_assignments(due_date);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE video_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_curation_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_assignments ENABLE ROW LEVEL SECURITY;

-- Video Bookmarks: Users can only access their own bookmarks
CREATE POLICY "Users can view own bookmarks"
    ON video_bookmarks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
    ON video_bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
    ON video_bookmarks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
    ON video_bookmarks FOR DELETE
    USING (auth.uid() = user_id);

-- Video Curation: Team members can view, coaches/admins can modify
CREATE POLICY "Team members can view curation status"
    ON video_curation_status FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = video_curation_status.team_id
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can manage curation status"
    ON video_curation_status FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = video_curation_status.team_id
            AND team_members.user_id = auth.uid()
            AND team_members.role IN ('coach', 'admin', 'owner')
        )
    );

-- Video Playlists: Team members can view, creators/coaches can modify
CREATE POLICY "Team members can view playlists"
    ON video_playlists FOR SELECT
    USING (
        is_public = true
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = video_playlists.team_id
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create playlists"
    ON video_playlists FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update own playlists"
    ON video_playlists FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete own playlists"
    ON video_playlists FOR DELETE
    USING (auth.uid() = created_by);

-- Video Watch History: Users can only access their own history
CREATE POLICY "Users can view own watch history"
    ON video_watch_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own watch history"
    ON video_watch_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watch history"
    ON video_watch_history FOR UPDATE
    USING (auth.uid() = user_id);

-- Video Assignments: Assignees can view/update, coaches can manage
CREATE POLICY "Users can view their assignments"
    ON video_assignments FOR SELECT
    USING (
        assigned_to = auth.uid()
        OR assigned_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = video_assignments.team_id
            AND team_members.user_id = auth.uid()
            AND team_members.role IN ('coach', 'admin', 'owner')
        )
    );

CREATE POLICY "Coaches can create assignments"
    ON video_assignments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = video_assignments.team_id
            AND team_members.user_id = auth.uid()
            AND team_members.role IN ('coach', 'admin', 'owner')
        )
    );

CREATE POLICY "Users can update their assignments"
    ON video_assignments FOR UPDATE
    USING (
        assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = video_assignments.team_id
            AND team_members.user_id = auth.uid()
            AND team_members.role IN ('coach', 'admin', 'owner')
        )
    );

CREATE POLICY "Coaches can delete assignments"
    ON video_assignments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = video_assignments.team_id
            AND team_members.user_id = auth.uid()
            AND team_members.role IN ('coach', 'admin', 'owner')
        )
    );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE video_bookmarks IS 'User saved/bookmarked training videos';
COMMENT ON TABLE video_curation_status IS 'Team approval status for training videos';
COMMENT ON TABLE video_playlists IS 'Custom video playlists created by coaches';
COMMENT ON TABLE video_watch_history IS 'Tracking of video views by users';
COMMENT ON TABLE video_assignments IS 'Videos assigned to players by coaches';

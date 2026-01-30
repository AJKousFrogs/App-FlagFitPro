-- Add team_id to community_posts for team-scoped visibility
-- Migration: 102_add_team_to_community_posts.sql

-- Add team_id column to community_posts if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'community_posts' 
        AND column_name = 'team_id'
    ) THEN
        ALTER TABLE community_posts 
        ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
        
        -- Add index for team-based queries
        CREATE INDEX IF NOT EXISTS idx_community_posts_team_id 
        ON community_posts(team_id);
        
        -- Update RLS policy to allow team members to see posts
        DROP POLICY IF EXISTS "Anyone can view published posts" ON community_posts;
        
        CREATE POLICY "Team members can view published posts" ON community_posts
        FOR SELECT
        USING (
            is_published = true
            AND (
                team_id IS NULL
                OR team_id IN (
                    SELECT team_id 
                    FROM team_members 
                    WHERE user_id = auth.uid() 
                    AND status = 'active'
                )
            )
        );
    END IF;
END $$;

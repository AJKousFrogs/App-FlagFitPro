-- ============================================================================
-- CHANNEL MEMBER COUNT MIGRATION
-- Migration: 062_channel_member_count.sql
-- Purpose: Add member_count to channels table with auto-update trigger
--          Provides fast member counts without aggregate queries
-- Created: 2026-01-01
-- ============================================================================

-- ============================================================================
-- ADD MEMBER COUNT COLUMNS TO CHANNELS
-- ============================================================================
DO $$ BEGIN
    ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS online_count INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Index for quick sorting by member count
CREATE INDEX IF NOT EXISTS idx_channels_member_count ON public.channels(member_count DESC);

-- ============================================================================
-- FUNCTION: Calculate implicit members for a channel
-- Returns count based on channel_type visibility rules
-- ============================================================================
CREATE OR REPLACE FUNCTION get_channel_implicit_member_count(channel_record public.channels)
RETURNS INTEGER AS $$
DECLARE
    member_count INTEGER := 0;
BEGIN
    CASE channel_record.channel_type
        -- Announcements & Team General: All active team members
        WHEN 'announcements', 'team_general' THEN
            SELECT COUNT(*)::INTEGER INTO member_count
            FROM public.team_members tm
            WHERE tm.team_id = channel_record.team_id
            AND tm.status = 'active';
            
        -- Coaches Only: Only coaches and assistant coaches
        WHEN 'coaches_only' THEN
            SELECT COUNT(*)::INTEGER INTO member_count
            FROM public.team_members tm
            WHERE tm.team_id = channel_record.team_id
            AND tm.status = 'active'
            AND tm.role IN ('coach', 'assistant_coach');
            
        -- Position Group: Coaches + athletes with matching position
        WHEN 'position_group' THEN
            SELECT COUNT(*)::INTEGER INTO member_count
            FROM public.team_members tm
            WHERE tm.team_id = channel_record.team_id
            AND tm.status = 'active'
            AND (tm.role IN ('coach', 'assistant_coach') OR tm.position = channel_record.position_filter);
            
        -- Game Day: All active team members (same as team_general)
        WHEN 'game_day' THEN
            SELECT COUNT(*)::INTEGER INTO member_count
            FROM public.team_members tm
            WHERE tm.team_id = channel_record.team_id
            AND tm.status = 'active';
            
        -- Direct Message: Use explicit channel_members count
        WHEN 'direct_message' THEN
            SELECT COUNT(*)::INTEGER INTO member_count
            FROM public.channel_members cm
            WHERE cm.channel_id = channel_record.id;
            
        ELSE
            member_count := 0;
    END CASE;
    
    RETURN member_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: Update channel member count
-- Called by triggers when team_members or channel_members change
-- ============================================================================
CREATE OR REPLACE FUNCTION update_channel_member_count()
RETURNS TRIGGER AS $$
DECLARE
    channel_record public.channels%ROWTYPE;
    new_count INTEGER;
BEGIN
    -- For channel_members changes (DMs)
    IF TG_TABLE_NAME = 'channel_members' THEN
        -- Get the channel
        SELECT * INTO channel_record FROM public.channels WHERE id = COALESCE(NEW.channel_id, OLD.channel_id);
        
        IF channel_record.id IS NOT NULL THEN
            new_count := get_channel_implicit_member_count(channel_record);
            UPDATE public.channels SET member_count = new_count WHERE id = channel_record.id;
        END IF;
        
    -- For team_members changes (team channels)
    ELSIF TG_TABLE_NAME = 'team_members' THEN
        -- Update all channels for this team
        FOR channel_record IN 
            SELECT * FROM public.channels 
            WHERE team_id = COALESCE(NEW.team_id, OLD.team_id)
            AND channel_type != 'direct_message'
        LOOP
            new_count := get_channel_implicit_member_count(channel_record);
            UPDATE public.channels SET member_count = new_count WHERE id = channel_record.id;
        END LOOP;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS: Auto-update member counts
-- ============================================================================

-- Trigger on channel_members (for DMs)
DROP TRIGGER IF EXISTS trigger_update_channel_member_count_on_members ON public.channel_members;
CREATE TRIGGER trigger_update_channel_member_count_on_members
    AFTER INSERT OR UPDATE OR DELETE ON public.channel_members
    FOR EACH ROW
    EXECUTE FUNCTION update_channel_member_count();

-- Trigger on team_members (for team channels)
DROP TRIGGER IF EXISTS trigger_update_channel_member_count_on_team ON public.team_members;
CREATE TRIGGER trigger_update_channel_member_count_on_team
    AFTER INSERT OR UPDATE OR DELETE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_channel_member_count();

-- ============================================================================
-- FUNCTION: Get channel members with details
-- Returns all members who can see a channel with their info
-- ============================================================================
CREATE OR REPLACE FUNCTION get_channel_members(p_channel_id UUID)
RETURNS TABLE (
    user_id UUID,
    email VARCHAR,
    full_name VARCHAR,
    avatar_url VARCHAR,
    role VARCHAR,
    position VARCHAR,
    jersey_number INTEGER,
    is_explicit_member BOOLEAN,
    can_post BOOLEAN,
    joined_at TIMESTAMPTZ
) AS $$
DECLARE
    channel_record public.channels%ROWTYPE;
BEGIN
    -- Get the channel
    SELECT * INTO channel_record FROM public.channels WHERE id = p_channel_id;
    
    IF channel_record.id IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    CASE channel_record.channel_type
        -- Announcements: All team members (can view, only coaches can post)
        WHEN 'announcements' THEN
            SELECT 
                tm.user_id,
                u.email::VARCHAR,
                (u.raw_user_meta_data->>'full_name')::VARCHAR,
                (u.raw_user_meta_data->>'avatar_url')::VARCHAR,
                tm.role::VARCHAR,
                tm.position::VARCHAR,
                tm.jersey_number,
                false AS is_explicit_member,
                (tm.role IN ('coach', 'assistant_coach')) AS can_post,
                tm.joined_at::TIMESTAMPTZ
            FROM public.team_members tm
            JOIN auth.users u ON u.id = tm.user_id
            WHERE tm.team_id = channel_record.team_id
            AND tm.status = 'active'
            ORDER BY 
                CASE WHEN tm.role IN ('coach', 'assistant_coach') THEN 0 ELSE 1 END,
                u.raw_user_meta_data->>'full_name'
                
        -- Team General: All team members can view and post
        WHEN 'team_general' THEN
            SELECT 
                tm.user_id,
                u.email::VARCHAR,
                (u.raw_user_meta_data->>'full_name')::VARCHAR,
                (u.raw_user_meta_data->>'avatar_url')::VARCHAR,
                tm.role::VARCHAR,
                tm.position::VARCHAR,
                tm.jersey_number,
                false AS is_explicit_member,
                true AS can_post,
                tm.joined_at::TIMESTAMPTZ
            FROM public.team_members tm
            JOIN auth.users u ON u.id = tm.user_id
            WHERE tm.team_id = channel_record.team_id
            AND tm.status = 'active'
            ORDER BY 
                CASE WHEN tm.role IN ('coach', 'assistant_coach') THEN 0 ELSE 1 END,
                u.raw_user_meta_data->>'full_name'
                
        -- Coaches Only: Only coaches
        WHEN 'coaches_only' THEN
            SELECT 
                tm.user_id,
                u.email::VARCHAR,
                (u.raw_user_meta_data->>'full_name')::VARCHAR,
                (u.raw_user_meta_data->>'avatar_url')::VARCHAR,
                tm.role::VARCHAR,
                tm.position::VARCHAR,
                tm.jersey_number,
                false AS is_explicit_member,
                true AS can_post,
                tm.joined_at::TIMESTAMPTZ
            FROM public.team_members tm
            JOIN auth.users u ON u.id = tm.user_id
            WHERE tm.team_id = channel_record.team_id
            AND tm.status = 'active'
            AND tm.role IN ('coach', 'assistant_coach')
            ORDER BY 
                CASE WHEN tm.role = 'coach' THEN 0 ELSE 1 END,
                u.raw_user_meta_data->>'full_name'
                
        -- Position Group: Coaches + matching position athletes
        WHEN 'position_group' THEN
            SELECT 
                tm.user_id,
                u.email::VARCHAR,
                (u.raw_user_meta_data->>'full_name')::VARCHAR,
                (u.raw_user_meta_data->>'avatar_url')::VARCHAR,
                tm.role::VARCHAR,
                tm.position::VARCHAR,
                tm.jersey_number,
                false AS is_explicit_member,
                true AS can_post,
                tm.joined_at::TIMESTAMPTZ
            FROM public.team_members tm
            JOIN auth.users u ON u.id = tm.user_id
            WHERE tm.team_id = channel_record.team_id
            AND tm.status = 'active'
            AND (tm.role IN ('coach', 'assistant_coach') OR tm.position = channel_record.position_filter)
            ORDER BY 
                CASE WHEN tm.role IN ('coach', 'assistant_coach') THEN 0 ELSE 1 END,
                u.raw_user_meta_data->>'full_name'
                
        -- Game Day: All team members
        WHEN 'game_day' THEN
            SELECT 
                tm.user_id,
                u.email::VARCHAR,
                (u.raw_user_meta_data->>'full_name')::VARCHAR,
                (u.raw_user_meta_data->>'avatar_url')::VARCHAR,
                tm.role::VARCHAR,
                tm.position::VARCHAR,
                tm.jersey_number,
                false AS is_explicit_member,
                true AS can_post,
                tm.joined_at::TIMESTAMPTZ
            FROM public.team_members tm
            JOIN auth.users u ON u.id = tm.user_id
            WHERE tm.team_id = channel_record.team_id
            AND tm.status = 'active'
            ORDER BY 
                CASE WHEN tm.role IN ('coach', 'assistant_coach') THEN 0 ELSE 1 END,
                u.raw_user_meta_data->>'full_name'
                
        -- Direct Message: Explicit members only
        WHEN 'direct_message' THEN
            SELECT 
                cm.user_id,
                u.email::VARCHAR,
                (u.raw_user_meta_data->>'full_name')::VARCHAR,
                (u.raw_user_meta_data->>'avatar_url')::VARCHAR,
                COALESCE(tm.role, 'member')::VARCHAR,
                tm.position::VARCHAR,
                tm.jersey_number,
                true AS is_explicit_member,
                cm.can_post,
                cm.joined_at
            FROM public.channel_members cm
            JOIN auth.users u ON u.id = cm.user_id
            LEFT JOIN public.team_members tm ON tm.user_id = cm.user_id AND tm.team_id = channel_record.team_id
            WHERE cm.channel_id = p_channel_id
            ORDER BY 
                CASE WHEN cm.is_admin THEN 0 ELSE 1 END,
                u.raw_user_meta_data->>'full_name'
                
        ELSE
            -- Return empty for unknown types
            SELECT 
                NULL::UUID,
                NULL::VARCHAR,
                NULL::VARCHAR,
                NULL::VARCHAR,
                NULL::VARCHAR,
                NULL::VARCHAR,
                NULL::INTEGER,
                NULL::BOOLEAN,
                NULL::BOOLEAN,
                NULL::TIMESTAMPTZ
            WHERE FALSE
    END CASE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- BACKFILL: Calculate member counts for existing channels
-- ============================================================================
DO $$
DECLARE
    channel_record public.channels%ROWTYPE;
    new_count INTEGER;
BEGIN
    FOR channel_record IN SELECT * FROM public.channels
    LOOP
        new_count := get_channel_implicit_member_count(channel_record);
        UPDATE public.channels SET member_count = new_count WHERE id = channel_record.id;
    END LOOP;
END $$;

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_channel_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_channel_implicit_member_count(public.channels) TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
COMMENT ON COLUMN public.channels.member_count IS 'Cached count of members who can view this channel';
COMMENT ON COLUMN public.channels.online_count IS 'Count of currently online members (updated by presence system)';
COMMENT ON FUNCTION get_channel_members(UUID) IS 'Returns all members who can see a channel with their details';

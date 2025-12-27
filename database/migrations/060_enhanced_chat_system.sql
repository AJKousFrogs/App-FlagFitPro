-- ============================================================================
-- ENHANCED CHAT SYSTEM MIGRATION
-- Migration: 060_enhanced_chat_system.sql
-- Purpose: Complete chat/community system with channels, permissions, 
--          announcements, pinned messages, and notification triggers
-- Created: 2025-12-27
-- ============================================================================

-- ============================================================================
-- CHANNEL TYPES ENUM
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE channel_type_enum AS ENUM (
        'announcements',      -- Coach-only posting, all team can view
        'team_general',       -- All team members can post
        'coaches_only',       -- Only coaches can view and post
        'position_group',     -- Position-specific (QB room, WR room, etc.)
        'game_day',          -- Auto-created per game
        'direct_message'     -- 1:1 or group DMs
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- CHANNELS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    
    -- Channel info
    name VARCHAR(100) NOT NULL,
    description TEXT,
    channel_type channel_type_enum NOT NULL DEFAULT 'team_general',
    
    -- For position groups
    position_filter VARCHAR(50), -- 'QB', 'WR', 'RB', 'DB', etc.
    
    -- For game day channels
    game_id UUID REFERENCES public.games(game_id) ON DELETE CASCADE,
    
    -- For DMs (comma-separated user IDs or use channel_members)
    is_group_dm BOOLEAN DEFAULT false,
    
    -- Settings
    is_archived BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false, -- Auto-join for new team members
    allow_threads BOOLEAN DEFAULT true,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(team_id, name)
);

-- Indexes for channels
CREATE INDEX IF NOT EXISTS idx_channels_team_id ON public.channels(team_id);
CREATE INDEX IF NOT EXISTS idx_channels_type ON public.channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_channels_game_id ON public.channels(game_id);
CREATE INDEX IF NOT EXISTS idx_channels_created_at ON public.channels(created_at DESC);

-- ============================================================================
-- CHANNEL MEMBERS TABLE (for DMs and explicit membership)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.channel_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Permissions
    can_post BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false, -- Can manage channel settings
    is_muted BOOLEAN DEFAULT false,
    
    -- Status
    last_read_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(channel_id, user_id)
);

-- Indexes for channel_members
CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON public.channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON public.channel_members(user_id);

-- ============================================================================
-- ENHANCED CHAT MESSAGES TABLE
-- ============================================================================
-- Add columns to existing chat_messages if they don't exist
DO $$ BEGIN
    -- Add channel_id reference
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    -- Add pinned status
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    -- Add pinned by
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS pinned_by UUID REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    -- Add pinned at
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    -- Add importance flag
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    -- Add mentions array
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS mentions UUID[] DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    -- Add attachments JSON
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    -- Add thread support
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES public.chat_messages(id);
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    -- Add reply count for thread parents
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Additional indexes for chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON public.chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_pinned ON public.chat_messages(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_important ON public.chat_messages(is_important) WHERE is_important = true;
CREATE INDEX IF NOT EXISTS idx_chat_messages_mentions ON public.chat_messages USING GIN(mentions);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON public.chat_messages(thread_id);

-- ============================================================================
-- MESSAGE READ RECEIPTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.message_read_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(message_id, user_id)
);

-- Indexes for read receipts
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message_id ON public.message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user_id ON public.message_read_receipts(user_id);

-- ============================================================================
-- ANNOUNCEMENT READ STATUS TABLE
-- For tracking who has read important announcements
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.announcement_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT false, -- User explicitly acknowledged
    acknowledged_at TIMESTAMPTZ,
    
    UNIQUE(message_id, user_id)
);

-- Indexes for announcement reads
CREATE INDEX IF NOT EXISTS idx_announcement_reads_message_id ON public.announcement_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user_id ON public.announcement_reads(user_id);

-- ============================================================================
-- ENHANCED NOTIFICATIONS TABLE
-- Add new notification types for chat events
-- ============================================================================
DO $$ BEGIN
    -- Add notification_type enum if not exists, or add new values
    ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'chat_mention';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'chat_announcement';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'chat_important';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'stats_uploaded';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'player_activity';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add additional columns to notifications if not exists
DO $$ BEGIN
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255);
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS source_type VARCHAR(50); -- 'chat', 'game', 'training', etc.
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS source_id UUID; -- Reference to source record
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- ============================================================================
-- COACH ACTIVITY LOG TABLE
-- Track player activities for coach dashboard
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.coach_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES auth.users(id), -- Which coach this is for (null = all coaches)
    
    -- Activity details
    activity_type VARCHAR(50) NOT NULL, -- 'stats_uploaded', 'training_completed', 'wellness_logged', etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    data JSONB DEFAULT '{}',
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for coach activity log
CREATE INDEX IF NOT EXISTS idx_coach_activity_log_team_id ON public.coach_activity_log(team_id);
CREATE INDEX IF NOT EXISTS idx_coach_activity_log_coach_id ON public.coach_activity_log(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_activity_log_player_id ON public.coach_activity_log(player_id);
CREATE INDEX IF NOT EXISTS idx_coach_activity_log_created_at ON public.coach_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_activity_log_is_read ON public.coach_activity_log(is_read) WHERE is_read = false;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CHANNELS POLICIES
-- ============================================================================

-- Team members can view their team's channels
CREATE POLICY "Team members can view team channels"
ON public.channels FOR SELECT
USING (
    -- Team channels: user must be team member
    (team_id IS NOT NULL AND team_id IN (
        SELECT tm.team_id FROM public.team_members tm
        WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    ))
    -- DM channels: user must be a member
    OR (channel_type = 'direct_message' AND id IN (
        SELECT cm.channel_id FROM public.channel_members cm
        WHERE cm.user_id = auth.uid()
    ))
    -- Coaches-only channels: user must be coach
    OR (channel_type = 'coaches_only' AND team_id IN (
        SELECT tm.team_id FROM public.team_members tm
        WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
    ))
    -- Position group channels: user must match position or be coach
    OR (channel_type = 'position_group' AND (
        team_id IN (
            SELECT tm.team_id FROM public.team_members tm
            WHERE tm.user_id = auth.uid() 
            AND (tm.role IN ('coach', 'assistant_coach') OR tm.position = channels.position_filter)
        )
    ))
);

-- Coaches can create channels
CREATE POLICY "Coaches can create channels"
ON public.channels FOR INSERT
WITH CHECK (
    created_by = auth.uid()
    AND (
        -- Coaches can create team channels
        team_id IN (
            SELECT tm.team_id FROM public.team_members tm
            WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
        )
        -- Anyone can create DMs
        OR channel_type = 'direct_message'
    )
);

-- Coaches can update their team's channels
CREATE POLICY "Coaches can update channels"
ON public.channels FOR UPDATE
USING (
    team_id IN (
        SELECT tm.team_id FROM public.team_members tm
        WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
    )
    OR (channel_type = 'direct_message' AND created_by = auth.uid())
);

-- Coaches can delete channels
CREATE POLICY "Coaches can delete channels"
ON public.channels FOR DELETE
USING (
    team_id IN (
        SELECT tm.team_id FROM public.team_members tm
        WHERE tm.user_id = auth.uid() AND tm.role = 'coach'
    )
);

-- ============================================================================
-- CHANNEL MEMBERS POLICIES
-- ============================================================================

-- Users can view members of channels they're in
CREATE POLICY "Users can view channel members"
ON public.channel_members FOR SELECT
USING (
    channel_id IN (
        SELECT cm.channel_id FROM public.channel_members cm
        WHERE cm.user_id = auth.uid()
    )
    OR channel_id IN (
        SELECT c.id FROM public.channels c
        JOIN public.team_members tm ON c.team_id = tm.team_id
        WHERE tm.user_id = auth.uid()
    )
);

-- Coaches can add members to channels
CREATE POLICY "Coaches can add channel members"
ON public.channel_members FOR INSERT
WITH CHECK (
    channel_id IN (
        SELECT c.id FROM public.channels c
        JOIN public.team_members tm ON c.team_id = tm.team_id
        WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
    )
    -- Users can add themselves to DMs they're invited to
    OR (user_id = auth.uid() AND channel_id IN (
        SELECT c.id FROM public.channels c WHERE c.channel_type = 'direct_message'
    ))
);

-- Users can update their own membership (mute, etc.)
CREATE POLICY "Users can update own channel membership"
ON public.channel_members FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- ENHANCED CHAT MESSAGES POLICIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Team members can view team chat" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send chat messages" ON public.chat_messages;

-- Users can view messages in channels they have access to
CREATE POLICY "Users can view channel messages"
ON public.chat_messages FOR SELECT
USING (
    -- Channel-based access
    channel_id IN (
        SELECT c.id FROM public.channels c
        WHERE 
            -- Team channels
            (c.team_id IN (
                SELECT tm.team_id FROM public.team_members tm
                WHERE tm.user_id = auth.uid() AND tm.status = 'active'
            ))
            -- DM channels
            OR (c.channel_type = 'direct_message' AND c.id IN (
                SELECT cm.channel_id FROM public.channel_members cm
                WHERE cm.user_id = auth.uid()
            ))
            -- Coaches-only
            OR (c.channel_type = 'coaches_only' AND c.team_id IN (
                SELECT tm.team_id FROM public.team_members tm
                WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
            ))
    )
    -- Legacy channel string support
    OR channel IN (
        SELECT CONCAT('team-', tm.team_id::text) FROM public.team_members tm
        WHERE tm.user_id = auth.uid()
    )
    OR user_id = auth.uid()
);

-- Users can send messages based on channel permissions
CREATE POLICY "Users can send channel messages"
ON public.chat_messages FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND (
        -- Announcements: coaches only
        (channel_id IN (
            SELECT c.id FROM public.channels c
            WHERE c.channel_type = 'announcements'
            AND c.team_id IN (
                SELECT tm.team_id FROM public.team_members tm
                WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
            )
        ))
        -- Coaches-only channels
        OR (channel_id IN (
            SELECT c.id FROM public.channels c
            WHERE c.channel_type = 'coaches_only'
            AND c.team_id IN (
                SELECT tm.team_id FROM public.team_members tm
                WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
            )
        ))
        -- Team general, game day, position group: all members
        OR (channel_id IN (
            SELECT c.id FROM public.channels c
            WHERE c.channel_type IN ('team_general', 'game_day', 'position_group')
            AND c.team_id IN (
                SELECT tm.team_id FROM public.team_members tm
                WHERE tm.user_id = auth.uid() AND tm.status = 'active'
            )
        ))
        -- DMs: only members
        OR (channel_id IN (
            SELECT cm.channel_id FROM public.channel_members cm
            WHERE cm.user_id = auth.uid() AND cm.can_post = true
        ))
        -- Legacy channel support
        OR (channel IN (
            SELECT CONCAT('team-', tm.team_id::text) FROM public.team_members tm
            WHERE tm.user_id = auth.uid()
        ))
        OR channel LIKE 'dm-%'
    )
);

-- Coaches can pin/unpin messages
CREATE POLICY "Coaches can update message pins"
ON public.chat_messages FOR UPDATE
USING (
    -- Own messages
    user_id = auth.uid()
    -- Or coach updating pins in their team
    OR (channel_id IN (
        SELECT c.id FROM public.channels c
        WHERE c.team_id IN (
            SELECT tm.team_id FROM public.team_members tm
            WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
        )
    ))
)
WITH CHECK (
    user_id = auth.uid()
    OR (channel_id IN (
        SELECT c.id FROM public.channels c
        WHERE c.team_id IN (
            SELECT tm.team_id FROM public.team_members tm
            WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
        )
    ))
);

-- ============================================================================
-- MESSAGE READ RECEIPTS POLICIES
-- ============================================================================

-- Users can view read receipts for messages in their channels
CREATE POLICY "Users can view read receipts"
ON public.message_read_receipts FOR SELECT
USING (
    message_id IN (
        SELECT cm.id FROM public.chat_messages cm
        WHERE cm.channel_id IN (
            SELECT c.id FROM public.channels c
            JOIN public.team_members tm ON c.team_id = tm.team_id
            WHERE tm.user_id = auth.uid()
        )
    )
);

-- Users can create their own read receipts
CREATE POLICY "Users can create read receipts"
ON public.message_read_receipts FOR INSERT
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- ANNOUNCEMENT READS POLICIES
-- ============================================================================

-- Users can view their own announcement reads
CREATE POLICY "Users can view own announcement reads"
ON public.announcement_reads FOR SELECT
USING (user_id = auth.uid());

-- Coaches can view all announcement reads for their team
CREATE POLICY "Coaches can view team announcement reads"
ON public.announcement_reads FOR SELECT
USING (
    message_id IN (
        SELECT cm.id FROM public.chat_messages cm
        WHERE cm.channel_id IN (
            SELECT c.id FROM public.channels c
            WHERE c.team_id IN (
                SELECT tm.team_id FROM public.team_members tm
                WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
            )
        )
    )
);

-- Users can create their own announcement reads
CREATE POLICY "Users can create announcement reads"
ON public.announcement_reads FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own announcement reads
CREATE POLICY "Users can update own announcement reads"
ON public.announcement_reads FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- COACH ACTIVITY LOG POLICIES
-- ============================================================================

-- Coaches can view activity for their teams
CREATE POLICY "Coaches can view team activity"
ON public.coach_activity_log FOR SELECT
USING (
    team_id IN (
        SELECT tm.team_id FROM public.team_members tm
        WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
    )
    AND (coach_id IS NULL OR coach_id = auth.uid())
);

-- System can insert activity (via service role)
CREATE POLICY "System can insert activity"
ON public.coach_activity_log FOR INSERT
WITH CHECK (true);

-- Coaches can mark activity as read
CREATE POLICY "Coaches can update activity read status"
ON public.coach_activity_log FOR UPDATE
USING (
    team_id IN (
        SELECT tm.team_id FROM public.team_members tm
        WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
    )
)
WITH CHECK (
    team_id IN (
        SELECT tm.team_id FROM public.team_members tm
        WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
    )
);

-- ============================================================================
-- FUNCTIONS FOR NOTIFICATION TRIGGERS
-- ============================================================================

-- Function to notify team members of announcements
CREATE OR REPLACE FUNCTION notify_announcement()
RETURNS TRIGGER AS $$
DECLARE
    channel_record RECORD;
    team_member RECORD;
BEGIN
    -- Only trigger for announcement channels or important messages
    IF NEW.is_important = true OR EXISTS (
        SELECT 1 FROM public.channels c 
        WHERE c.id = NEW.channel_id AND c.channel_type = 'announcements'
    ) THEN
        -- Get channel info
        SELECT * INTO channel_record FROM public.channels WHERE id = NEW.channel_id;
        
        -- Notify all team members
        IF channel_record.team_id IS NOT NULL THEN
            FOR team_member IN 
                SELECT tm.user_id FROM public.team_members tm
                WHERE tm.team_id = channel_record.team_id
                AND tm.user_id != NEW.user_id
                AND tm.status = 'active'
            LOOP
                INSERT INTO public.notifications (
                    user_id, type, title, message, priority, data, source_type, source_id
                ) VALUES (
                    team_member.user_id::text,
                    'team',
                    CASE WHEN NEW.is_important THEN '🔴 Important Message' ELSE '📢 Team Announcement' END,
                    LEFT(NEW.message, 100),
                    CASE WHEN NEW.is_important THEN 'high' ELSE 'medium' END,
                    jsonb_build_object(
                        'channel_id', NEW.channel_id,
                        'message_id', NEW.id,
                        'sender_id', NEW.user_id
                    ),
                    'chat',
                    NEW.id
                );
            END LOOP;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify mentioned users
CREATE OR REPLACE FUNCTION notify_mentions()
RETURNS TRIGGER AS $$
DECLARE
    mentioned_user UUID;
BEGIN
    -- Check if there are mentions
    IF NEW.mentions IS NOT NULL AND array_length(NEW.mentions, 1) > 0 THEN
        FOREACH mentioned_user IN ARRAY NEW.mentions
        LOOP
            -- Don't notify the sender
            IF mentioned_user != NEW.user_id THEN
                INSERT INTO public.notifications (
                    user_id, type, title, message, priority, data, source_type, source_id
                ) VALUES (
                    mentioned_user::text,
                    'team',
                    '💬 You were mentioned',
                    LEFT(NEW.message, 100),
                    'high',
                    jsonb_build_object(
                        'channel_id', NEW.channel_id,
                        'message_id', NEW.id,
                        'sender_id', NEW.user_id
                    ),
                    'chat',
                    NEW.id
                );
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log coach activity on stats upload
CREATE OR REPLACE FUNCTION log_stats_upload_activity()
RETURNS TRIGGER AS $$
DECLARE
    player_record RECORD;
    team_record RECORD;
    coach_record RECORD;
BEGIN
    -- Get player info
    SELECT u.id, u.raw_user_meta_data->>'full_name' as full_name, u.email
    INTO player_record
    FROM auth.users u
    WHERE u.id = NEW.primary_player_id OR u.id = NEW.user_id;
    
    -- Get team info for the player
    FOR team_record IN
        SELECT tm.team_id, t.name as team_name
        FROM public.team_members tm
        JOIN public.teams t ON t.id = tm.team_id
        WHERE tm.user_id = COALESCE(NEW.primary_player_id, NEW.user_id)
        AND tm.status = 'active'
    LOOP
        -- Log activity for all coaches of this team
        FOR coach_record IN
            SELECT tm.user_id
            FROM public.team_members tm
            WHERE tm.team_id = team_record.team_id
            AND tm.role IN ('coach', 'assistant_coach')
        LOOP
            INSERT INTO public.coach_activity_log (
                team_id, player_id, coach_id, activity_type, title, description, data
            ) VALUES (
                team_record.team_id,
                COALESCE(NEW.primary_player_id, NEW.user_id),
                coach_record.user_id,
                'stats_uploaded',
                COALESCE(player_record.full_name, split_part(player_record.email, '@', 1)) || ' uploaded game stats',
                'New play recorded: ' || COALESCE(NEW.play_type::text, 'play'),
                jsonb_build_object(
                    'game_id', NEW.game_id,
                    'play_type', NEW.play_type,
                    'yards_gained', NEW.yards_gained,
                    'play_result', NEW.play_result
                )
            );
            
            -- Also create a notification
            INSERT INTO public.notifications (
                user_id, type, title, message, priority, data, source_type, source_id
            ) VALUES (
                coach_record.user_id::text,
                'game',
                '📊 Stats Uploaded',
                COALESCE(player_record.full_name, split_part(player_record.email, '@', 1)) || ' logged game stats',
                'medium',
                jsonb_build_object(
                    'player_id', COALESCE(NEW.primary_player_id, NEW.user_id),
                    'game_id', NEW.game_id,
                    'event_id', NEW.id
                ),
                'game_event',
                NEW.id
            );
        END LOOP;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log training completion
CREATE OR REPLACE FUNCTION log_training_completion_activity()
RETURNS TRIGGER AS $$
DECLARE
    player_record RECORD;
    team_record RECORD;
    coach_record RECORD;
BEGIN
    -- Only trigger on completion
    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
        -- Get player info
        SELECT u.id, u.raw_user_meta_data->>'full_name' as full_name, u.email
        INTO player_record
        FROM auth.users u
        WHERE u.id = NEW.user_id;
        
        -- Get team info
        FOR team_record IN
            SELECT tm.team_id, t.name as team_name
            FROM public.team_members tm
            JOIN public.teams t ON t.id = tm.team_id
            WHERE tm.user_id = NEW.user_id
            AND tm.status = 'active'
        LOOP
            -- Log activity for coaches
            FOR coach_record IN
                SELECT tm.user_id
                FROM public.team_members tm
                WHERE tm.team_id = team_record.team_id
                AND tm.role IN ('coach', 'assistant_coach')
            LOOP
                INSERT INTO public.coach_activity_log (
                    team_id, player_id, coach_id, activity_type, title, description, data
                ) VALUES (
                    team_record.team_id,
                    NEW.user_id,
                    coach_record.user_id,
                    'training_completed',
                    COALESCE(player_record.full_name, split_part(player_record.email, '@', 1)) || ' completed training',
                    COALESCE(NEW.session_type, 'Training') || ' - ' || COALESCE(NEW.duration_minutes, 0) || ' min',
                    jsonb_build_object(
                        'session_id', NEW.id,
                        'session_type', NEW.session_type,
                        'duration', NEW.duration_minutes,
                        'rpe', NEW.rpe
                    )
                );
            END LOOP;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Trigger for announcements
DROP TRIGGER IF EXISTS trigger_notify_announcement ON public.chat_messages;
CREATE TRIGGER trigger_notify_announcement
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_announcement();

-- Trigger for mentions
DROP TRIGGER IF EXISTS trigger_notify_mentions ON public.chat_messages;
CREATE TRIGGER trigger_notify_mentions
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_mentions();

-- Trigger for stats upload (on game_events table)
DROP TRIGGER IF EXISTS trigger_log_stats_upload ON public.game_events;
CREATE TRIGGER trigger_log_stats_upload
    AFTER INSERT ON public.game_events
    FOR EACH ROW
    EXECUTE FUNCTION log_stats_upload_activity();

-- Trigger for training completion
DROP TRIGGER IF EXISTS trigger_log_training_completion ON public.training_sessions;
CREATE TRIGGER trigger_log_training_completion
    AFTER INSERT OR UPDATE ON public.training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION log_training_completion_activity();

-- ============================================================================
-- DEFAULT CHANNEL CREATION FUNCTION
-- Auto-create default channels when a team is created
-- ============================================================================
CREATE OR REPLACE FUNCTION create_default_team_channels()
RETURNS TRIGGER AS $$
BEGIN
    -- Create announcements channel
    INSERT INTO public.channels (team_id, name, description, channel_type, is_default, created_by)
    VALUES (
        NEW.id,
        'announcements',
        'Important team announcements from coaches',
        'announcements',
        true,
        NEW.coach_id
    );
    
    -- Create general channel
    INSERT INTO public.channels (team_id, name, description, channel_type, is_default, created_by)
    VALUES (
        NEW.id,
        'general',
        'General team discussion',
        'team_general',
        true,
        NEW.coach_id
    );
    
    -- Create coaches-only channel
    INSERT INTO public.channels (team_id, name, description, channel_type, is_default, created_by)
    VALUES (
        NEW.id,
        'coaches',
        'Private channel for coaching staff',
        'coaches_only',
        true,
        NEW.coach_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default channels
DROP TRIGGER IF EXISTS trigger_create_default_channels ON public.teams;
CREATE TRIGGER trigger_create_default_channels
    AFTER INSERT ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION create_default_team_channels();

-- ============================================================================
-- ENABLE REALTIME FOR NEW TABLES
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_read_receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcement_reads;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
COMMENT ON TABLE public.channels IS 'Team communication channels with type-based permissions';
COMMENT ON TABLE public.channel_members IS 'Explicit channel membership for DMs and permissions';
COMMENT ON TABLE public.message_read_receipts IS 'Track who has read which messages';
COMMENT ON TABLE public.announcement_reads IS 'Track acknowledgment of important announcements';
COMMENT ON TABLE public.coach_activity_log IS 'Activity feed for coaches showing player actions';

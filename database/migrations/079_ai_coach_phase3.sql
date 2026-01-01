-- =============================================================================
-- AI COACH PHASE 3: PARENT/YOUTH MODE & ENHANCED CLASSIFICATION
-- Migration: 079_ai_coach_phase3.sql
-- Purpose: Support parent/guardian oversight for youth athletes, enhanced
--          multi-signal classification, and personalization features.
-- Created: 2026-01-01
-- =============================================================================

-- =============================================================================
-- 1. PARENT/GUARDIAN LINKS TABLE
-- Links parent accounts to youth athlete accounts
-- =============================================================================

CREATE TABLE IF NOT EXISTS parent_guardian_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    youth_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Relationship details
    relationship VARCHAR(30) NOT NULL CHECK (relationship IN (
        'parent', 'guardian', 'step_parent', 'grandparent', 'other'
    )),
    
    -- Verification status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',     -- Link requested, awaiting verification
        'verified',    -- Link confirmed
        'revoked',     -- Link removed
        'expired'      -- Link no longer valid
    )),
    verified_at TIMESTAMPTZ,
    verified_method VARCHAR(30), -- 'email', 'coach_approval', 'document'
    
    -- Permissions
    can_view_ai_chats BOOLEAN DEFAULT TRUE,
    can_approve_recommendations BOOLEAN DEFAULT TRUE,
    can_receive_alerts BOOLEAN DEFAULT TRUE,
    can_override_restrictions BOOLEAN DEFAULT FALSE,
    
    -- Notification preferences
    alert_on_high_risk BOOLEAN DEFAULT TRUE,
    alert_on_supplement_topics BOOLEAN DEFAULT TRUE,
    alert_on_injury_topics BOOLEAN DEFAULT TRUE,
    daily_summary_enabled BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Optional expiration for temporary guardianship
    
    UNIQUE(parent_id, youth_id)
);

-- Indexes for parent_guardian_links
CREATE INDEX IF NOT EXISTS idx_parent_guardian_parent 
    ON parent_guardian_links(parent_id, status);
CREATE INDEX IF NOT EXISTS idx_parent_guardian_youth 
    ON parent_guardian_links(youth_id, status);
CREATE INDEX IF NOT EXISTS idx_parent_guardian_verified 
    ON parent_guardian_links(status) WHERE status = 'verified';

-- =============================================================================
-- 2. YOUTH SETTINGS TABLE
-- Per-user youth-specific safety settings
-- =============================================================================

CREATE TABLE IF NOT EXISTS youth_athlete_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Age verification
    birth_date_verified BOOLEAN DEFAULT FALSE,
    age_group VARCHAR(20) NOT NULL DEFAULT 'youth' CHECK (age_group IN (
        'youth_under_12', 'youth_12_15', 'youth_16_17', 'adult'
    )),
    
    -- Content restrictions
    restrict_supplement_topics BOOLEAN DEFAULT TRUE,
    restrict_weight_training BOOLEAN DEFAULT TRUE,
    restrict_high_intensity BOOLEAN DEFAULT TRUE,
    restrict_nutrition_advice BOOLEAN DEFAULT TRUE,
    
    -- Approval requirements
    require_parent_approval_programs BOOLEAN DEFAULT TRUE,
    require_parent_approval_supplements BOOLEAN DEFAULT TRUE,
    require_coach_approval_intensity BOOLEAN DEFAULT TRUE,
    
    -- Communication style
    use_simplified_language BOOLEAN DEFAULT TRUE,
    include_parent_cc BOOLEAN DEFAULT TRUE,
    max_session_duration_minutes INTEGER DEFAULT 30,
    
    -- Safety thresholds (stricter than adult defaults)
    acwr_warning_threshold DECIMAL(3,2) DEFAULT 1.2,
    acwr_danger_threshold DECIMAL(3,2) DEFAULT 1.4,
    max_daily_training_load INTEGER DEFAULT 500,
    
    -- Metadata
    set_by UUID REFERENCES auth.users(id), -- Who configured these settings
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 3. CLASSIFICATION HISTORY TABLE
-- Track classification decisions for learning and analysis
-- =============================================================================

CREATE TABLE IF NOT EXISTS classification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES ai_messages(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID,
    
    -- Input
    query_text TEXT NOT NULL,
    query_length INTEGER,
    
    -- Classification results
    detected_intent VARCHAR(50) NOT NULL,
    intent_confidence DECIMAL(4,3), -- 0.000 to 1.000
    detected_tier INTEGER CHECK (detected_tier BETWEEN 1 AND 3),
    tier_confidence DECIMAL(4,3),
    
    -- Multi-signal analysis
    keyword_signals JSONB DEFAULT '{}', -- {matched_keywords: [...], categories: [...]}
    context_signals JSONB DEFAULT '{}', -- {conversation_history: {...}, user_state: {...}}
    pattern_signals JSONB DEFAULT '{}', -- {escalation_detected: bool, repeated_topics: [...]}
    
    -- Final decision
    final_risk_level VARCHAR(10) NOT NULL,
    escalation_applied BOOLEAN DEFAULT FALSE,
    escalation_reasons TEXT[],
    
    -- Youth-specific flags
    is_youth_user BOOLEAN DEFAULT FALSE,
    youth_restrictions_applied TEXT[],
    parent_notification_triggered BOOLEAN DEFAULT FALSE,
    
    -- Feedback for learning
    coach_feedback VARCHAR(20), -- 'appropriate', 'too_strict', 'too_lenient'
    feedback_notes TEXT,
    feedback_at TIMESTAMPTZ,
    feedback_by UUID REFERENCES auth.users(id),
    
    -- Metadata
    processing_time_ms INTEGER,
    model_version VARCHAR(20) DEFAULT 'v3.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for classification_history
CREATE INDEX IF NOT EXISTS idx_classification_user 
    ON classification_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_classification_intent 
    ON classification_history(detected_intent);
CREATE INDEX IF NOT EXISTS idx_classification_risk 
    ON classification_history(final_risk_level);
CREATE INDEX IF NOT EXISTS idx_classification_youth 
    ON classification_history(is_youth_user) WHERE is_youth_user = TRUE;
CREATE INDEX IF NOT EXISTS idx_classification_feedback 
    ON classification_history(coach_feedback) WHERE coach_feedback IS NOT NULL;

-- =============================================================================
-- 4. PARENT NOTIFICATIONS TABLE
-- Alerts sent to parents about youth AI interactions
-- =============================================================================

CREATE TABLE IF NOT EXISTS parent_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    youth_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification details
    notification_type VARCHAR(30) NOT NULL CHECK (notification_type IN (
        'high_risk_query',
        'supplement_topic',
        'injury_topic',
        'program_approval_needed',
        'override_used',
        'session_summary',
        'streak_achievement',
        'safety_concern'
    )),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Content
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    details JSONB DEFAULT '{}', -- Full context
    
    -- Source reference
    source_type VARCHAR(30), -- 'ai_message', 'classification', 'daily_state'
    source_id UUID,
    
    -- Actions available
    actions_available JSONB DEFAULT '[]', -- [{type: 'approve', label: '...'}, ...]
    
    -- Status
    status VARCHAR(20) DEFAULT 'unread' CHECK (status IN (
        'unread', 'read', 'actioned', 'dismissed'
    )),
    read_at TIMESTAMPTZ,
    actioned_at TIMESTAMPTZ,
    action_taken VARCHAR(30),
    action_notes TEXT,
    
    -- Delivery
    delivery_method VARCHAR(20) DEFAULT 'in_app', -- 'in_app', 'email', 'push', 'sms'
    delivered_at TIMESTAMPTZ,
    delivery_status VARCHAR(20) DEFAULT 'pending',
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ -- Some notifications expire
);

-- Indexes for parent_notifications
CREATE INDEX IF NOT EXISTS idx_parent_notif_parent 
    ON parent_notifications(parent_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parent_notif_youth 
    ON parent_notifications(youth_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parent_notif_type 
    ON parent_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_parent_notif_unread 
    ON parent_notifications(parent_id, created_at DESC) 
    WHERE status = 'unread';

-- =============================================================================
-- 5. USER PREFERENCES TABLE
-- Personalization and learning from user behavior
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_ai_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Response preferences
    preferred_detail_level VARCHAR(20) DEFAULT 'moderate', -- 'brief', 'moderate', 'detailed'
    preferred_tone VARCHAR(20) DEFAULT 'supportive', -- 'professional', 'supportive', 'casual'
    include_citations BOOLEAN DEFAULT TRUE,
    include_warnings BOOLEAN DEFAULT TRUE,
    
    -- Topic preferences (learned from interactions)
    favorite_topics TEXT[] DEFAULT '{}', -- Most frequently asked topics
    avoided_topics TEXT[] DEFAULT '{}', -- Topics they skip or dismiss
    
    -- Position-specific defaults
    primary_position VARCHAR(20),
    position_focus_areas JSONB DEFAULT '{}', -- {QB: ['arm_care', 'footwork'], WR: ['routes', 'catching']}
    
    -- Training preferences (learned)
    preferred_session_duration INTEGER, -- Minutes
    preferred_intensity_level VARCHAR(20),
    preferred_equipment TEXT[],
    
    -- Time preferences
    typical_training_time VARCHAR(20), -- 'morning', 'afternoon', 'evening'
    typical_game_day VARCHAR(20), -- 'saturday', 'sunday'
    
    -- Learning metrics
    total_interactions INTEGER DEFAULT 0,
    helpful_responses INTEGER DEFAULT 0,
    dismissed_responses INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    
    -- Last activity
    last_topic TEXT,
    last_interaction_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 6. APPROVAL REQUESTS TABLE
-- Pending approvals from parents/coaches for youth athletes
-- =============================================================================

CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youth_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Approver (parent or coach)
    approver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    approver_type VARCHAR(20) NOT NULL CHECK (approver_type IN ('parent', 'coach')),
    
    -- Request details
    request_type VARCHAR(30) NOT NULL CHECK (request_type IN (
        'program_approval',
        'supplement_discussion',
        'intensity_increase',
        'restriction_override',
        'external_link_access'
    )),
    
    -- Content
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    context JSONB DEFAULT '{}', -- Full context of what's being requested
    
    -- Source
    source_type VARCHAR(30), -- 'ai_recommendation', 'micro_session', 'ai_message'
    source_id UUID,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'denied', 'expired', 'cancelled'
    )),
    
    -- Decision
    decided_at TIMESTAMPTZ,
    decision_notes TEXT,
    
    -- Expiration
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for approval_requests
CREATE INDEX IF NOT EXISTS idx_approval_youth 
    ON approval_requests(youth_id, status);
CREATE INDEX IF NOT EXISTS idx_approval_approver 
    ON approval_requests(approver_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_pending 
    ON approval_requests(approver_id, created_at DESC) 
    WHERE status = 'pending';

-- =============================================================================
-- 7. EXTEND AI_MESSAGES TABLE
-- Add youth-specific tracking fields
-- =============================================================================

ALTER TABLE ai_messages 
    ADD COLUMN IF NOT EXISTS is_youth_interaction BOOLEAN DEFAULT FALSE;

ALTER TABLE ai_messages 
    ADD COLUMN IF NOT EXISTS youth_restrictions_applied TEXT[];

ALTER TABLE ai_messages 
    ADD COLUMN IF NOT EXISTS parent_notified BOOLEAN DEFAULT FALSE;

ALTER TABLE ai_messages 
    ADD COLUMN IF NOT EXISTS parent_notification_id UUID REFERENCES parent_notifications(id);

ALTER TABLE ai_messages 
    ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE;

ALTER TABLE ai_messages 
    ADD COLUMN IF NOT EXISTS approval_request_id UUID REFERENCES approval_requests(id);

ALTER TABLE ai_messages
    ADD COLUMN IF NOT EXISTS classification_confidence DECIMAL(4,3);

-- Index for youth interactions
CREATE INDEX IF NOT EXISTS idx_ai_messages_youth 
    ON ai_messages(user_id, is_youth_interaction, created_at DESC) 
    WHERE is_youth_interaction = TRUE;

-- =============================================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Parent/Guardian Links: parents see own links, youth see links to them
ALTER TABLE parent_guardian_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own links"
ON parent_guardian_links FOR SELECT
USING (parent_id = auth.uid());

CREATE POLICY "Youth can view links to them"
ON parent_guardian_links FOR SELECT
USING (youth_id = auth.uid());

CREATE POLICY "Parents can update own links"
ON parent_guardian_links FOR UPDATE
USING (parent_id = auth.uid())
WITH CHECK (parent_id = auth.uid());

-- Youth Settings: users see own, parents see linked youth, coaches see team
ALTER TABLE youth_athlete_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own youth settings"
ON youth_athlete_settings FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Parents can view linked youth settings"
ON youth_athlete_settings FOR SELECT
USING (
    user_id IN (
        SELECT youth_id FROM parent_guardian_links
        WHERE parent_id = auth.uid() AND status = 'verified'
    )
);

CREATE POLICY "Coaches can view team youth settings"
ON youth_athlete_settings FOR SELECT
USING (
    user_id IN (
        SELECT tm.user_id FROM team_members tm
        WHERE tm.team_id IN (
            SELECT tm2.team_id FROM team_members tm2
            WHERE tm2.user_id = auth.uid() AND tm2.role IN ('coach', 'assistant_coach')
        )
        AND tm.status = 'active'
    )
);

-- Parent Notifications: parents see own
ALTER TABLE parent_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own notifications"
ON parent_notifications FOR ALL
USING (parent_id = auth.uid())
WITH CHECK (parent_id = auth.uid());

-- User AI Preferences: users manage own
ALTER TABLE user_ai_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own AI preferences"
ON user_ai_preferences FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Approval Requests: youth see own, approvers see theirs
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Youth can view own approval requests"
ON approval_requests FOR SELECT
USING (youth_id = auth.uid());

CREATE POLICY "Approvers can view and update requests"
ON approval_requests FOR ALL
USING (approver_id = auth.uid());

-- Classification History: users see own (for transparency)
ALTER TABLE classification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own classification history"
ON classification_history FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Coaches can view team classification history"
ON classification_history FOR SELECT
USING (
    user_id IN (
        SELECT tm.user_id FROM team_members tm
        WHERE tm.team_id IN (
            SELECT tm2.team_id FROM team_members tm2
            WHERE tm2.user_id = auth.uid() AND tm2.role IN ('coach', 'assistant_coach')
        )
        AND tm.status = 'active'
    )
);

-- =============================================================================
-- 9. HELPER FUNCTIONS
-- =============================================================================

-- Function to check if a user is a youth athlete
CREATE OR REPLACE FUNCTION is_youth_athlete(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_age INTEGER;
    has_settings BOOLEAN;
BEGIN
    -- Check age from users table
    SELECT EXTRACT(YEAR FROM age(birth_date)) INTO user_age
    FROM users WHERE id = check_user_id;
    
    IF user_age IS NOT NULL AND user_age < 18 THEN
        RETURN TRUE;
    END IF;
    
    -- Check if youth settings exist
    SELECT EXISTS(
        SELECT 1 FROM youth_athlete_settings 
        WHERE user_id = check_user_id
    ) INTO has_settings;
    
    RETURN has_settings;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get verified parent IDs for a youth
CREATE OR REPLACE FUNCTION get_verified_parents(youth_user_id UUID)
RETURNS TABLE(parent_id UUID, relationship VARCHAR, can_view_ai_chats BOOLEAN, can_approve BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pgl.parent_id,
        pgl.relationship,
        pgl.can_view_ai_chats,
        pgl.can_approve_recommendations
    FROM parent_guardian_links pgl
    WHERE pgl.youth_id = youth_user_id
    AND pgl.status = 'verified'
    AND (pgl.expires_at IS NULL OR pgl.expires_at > NOW());
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to create parent notification
CREATE OR REPLACE FUNCTION create_parent_notification(
    p_youth_id UUID,
    p_notification_type VARCHAR,
    p_title VARCHAR,
    p_summary TEXT,
    p_details JSONB DEFAULT '{}',
    p_priority VARCHAR DEFAULT 'medium',
    p_source_type VARCHAR DEFAULT NULL,
    p_source_id UUID DEFAULT NULL
) RETURNS SETOF parent_notifications AS $$
DECLARE
    parent_record RECORD;
BEGIN
    -- Create notification for each verified parent
    FOR parent_record IN 
        SELECT * FROM get_verified_parents(p_youth_id)
        WHERE can_view_ai_chats = TRUE
    LOOP
        RETURN QUERY
        INSERT INTO parent_notifications (
            parent_id, youth_id, notification_type, priority,
            title, summary, details, source_type, source_id
        ) VALUES (
            parent_record.parent_id, p_youth_id, p_notification_type, p_priority,
            p_title, p_summary, p_details, p_source_type, p_source_id
        )
        RETURNING *;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 10. TRIGGERS
-- =============================================================================

-- Update timestamps
DROP TRIGGER IF EXISTS update_parent_guardian_links_updated_at ON parent_guardian_links;
CREATE TRIGGER update_parent_guardian_links_updated_at
    BEFORE UPDATE ON parent_guardian_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_youth_athlete_settings_updated_at ON youth_athlete_settings;
CREATE TRIGGER update_youth_athlete_settings_updated_at
    BEFORE UPDATE ON youth_athlete_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_ai_preferences_updated_at ON user_ai_preferences;
CREATE TRIGGER update_user_ai_preferences_updated_at
    BEFORE UPDATE ON user_ai_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 11. ENABLE REALTIME
-- =============================================================================

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE parent_notifications;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE approval_requests;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- =============================================================================
-- 12. COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE parent_guardian_links IS 'Links parent/guardian accounts to youth athlete accounts for oversight';
COMMENT ON TABLE youth_athlete_settings IS 'Youth-specific safety settings and content restrictions';
COMMENT ON TABLE classification_history IS 'Historical record of AI query classifications for learning and analysis';
COMMENT ON TABLE parent_notifications IS 'Alerts and notifications sent to parents about youth AI interactions';
COMMENT ON TABLE user_ai_preferences IS 'User preferences for AI responses, learned from interactions';
COMMENT ON TABLE approval_requests IS 'Pending approvals required from parents/coaches for youth athletes';

COMMENT ON FUNCTION is_youth_athlete IS 'Check if a user is classified as a youth athlete';
COMMENT ON FUNCTION get_verified_parents IS 'Get list of verified parents/guardians for a youth';
COMMENT ON FUNCTION create_parent_notification IS 'Create notification for all verified parents of a youth';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

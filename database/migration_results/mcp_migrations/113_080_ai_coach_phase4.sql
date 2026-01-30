-- =============================================================================
-- AI COACH PHASE 4: ANALYTICS, FEEDBACK & SMART NOTIFICATIONS
-- Migration: 080_ai_coach_phase4.sql
-- Purpose: Support response feedback, coach analytics, notification digests,
--          team insights, and gamification features.
-- Created: 2026-01-01
-- =============================================================================

-- =============================================================================
-- 1. RESPONSE FEEDBACK TABLE
-- Track athlete and coach feedback on AI responses
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_response_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES ai_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE SET NULL,
    
    -- Feedback type
    feedback_source VARCHAR(20) NOT NULL CHECK (feedback_source IN (
        'athlete',      -- Thumbs up/down from athlete
        'coach',        -- Coach review feedback
        'parent',       -- Parent feedback on youth interaction
        'system'        -- Automated feedback (e.g., from follow-up outcomes)
    )),
    
    -- Athlete feedback (simple)
    was_helpful BOOLEAN,  -- true = thumbs up, false = thumbs down
    
    -- Coach feedback (detailed)
    classification_accuracy VARCHAR(20) CHECK (classification_accuracy IN (
        'appropriate',  -- Classification was correct
        'too_strict',   -- Should have been lower risk
        'too_lenient',  -- Should have been higher risk
        'wrong_intent'  -- Intent was misclassified
    )),
    
    -- Suggested corrections
    suggested_risk_level VARCHAR(10), -- What it should have been
    suggested_intent VARCHAR(50),     -- What intent it should have been
    
    -- Qualitative feedback
    feedback_text TEXT,
    feedback_categories TEXT[] DEFAULT '{}', -- ['inaccurate', 'unclear', 'too_long', 'missing_info']
    
    -- Context at feedback time
    original_risk_level VARCHAR(10),
    original_intent VARCHAR(50),
    original_confidence DECIMAL(4,3),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for ai_response_feedback
CREATE INDEX IF NOT EXISTS idx_feedback_message 
    ON ai_response_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user 
    ON ai_response_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_source 
    ON ai_response_feedback(feedback_source);
CREATE INDEX IF NOT EXISTS idx_feedback_accuracy 
    ON ai_response_feedback(classification_accuracy) 
    WHERE classification_accuracy IS NOT NULL;

-- =============================================================================
-- 2. COACH ANALYTICS CACHE TABLE
-- Pre-computed analytics for fast dashboard loading
-- =============================================================================

CREATE TABLE IF NOT EXISTS coach_analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Time period
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN (
        'daily', 'weekly', 'monthly', 'all_time'
    )),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Classification metrics
    total_classifications INTEGER DEFAULT 0,
    high_risk_count INTEGER DEFAULT 0,
    medium_risk_count INTEGER DEFAULT 0,
    low_risk_count INTEGER DEFAULT 0,
    
    -- Accuracy metrics (from feedback)
    feedback_count INTEGER DEFAULT 0,
    appropriate_count INTEGER DEFAULT 0,
    too_strict_count INTEGER DEFAULT 0,
    too_lenient_count INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,2), -- Percentage
    
    -- Intent distribution
    intent_distribution JSONB DEFAULT '{}', -- {technique_correction: 45, pain_injury: 23, ...}
    
    -- Youth metrics
    youth_interactions INTEGER DEFAULT 0,
    youth_blocked_topics INTEGER DEFAULT 0,
    parent_notifications_sent INTEGER DEFAULT 0,
    
    -- Session metrics
    micro_sessions_created INTEGER DEFAULT 0,
    micro_sessions_completed INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2),
    
    -- Escalation metrics
    escalations_applied INTEGER DEFAULT 0,
    acwr_overrides INTEGER DEFAULT 0,
    
    -- Top topics
    top_topics JSONB DEFAULT '[]', -- [{topic: 'recovery', count: 50}, ...]
    
    -- Response quality
    avg_confidence DECIMAL(4,3),
    avg_helpful_rate DECIMAL(5,2), -- From athlete feedback
    
    -- Metadata
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(coach_id, team_id, period_type, period_start)
);

-- Indexes for coach_analytics_cache
CREATE INDEX IF NOT EXISTS idx_analytics_coach_period 
    ON coach_analytics_cache(coach_id, period_type, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_team 
    ON coach_analytics_cache(team_id, period_type, period_start DESC);

-- =============================================================================
-- 3. NOTIFICATION PREFERENCES TABLE
-- User preferences for digest and notification delivery
-- =============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Digest preferences
    daily_digest_enabled BOOLEAN DEFAULT FALSE,
    daily_digest_time TIME DEFAULT '08:00:00', -- Local time
    weekly_digest_enabled BOOLEAN DEFAULT TRUE,
    weekly_digest_day INTEGER DEFAULT 1, -- 0=Sun, 1=Mon, ..., 6=Sat
    weekly_digest_time TIME DEFAULT '09:00:00',
    
    -- Delivery channels
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    
    -- Content preferences
    include_ai_summary BOOLEAN DEFAULT TRUE,
    include_session_stats BOOLEAN DEFAULT TRUE,
    include_injury_alerts BOOLEAN DEFAULT TRUE,
    include_acwr_warnings BOOLEAN DEFAULT TRUE,
    include_achievement_alerts BOOLEAN DEFAULT TRUE,
    
    -- Coach-specific
    include_team_overview BOOLEAN DEFAULT TRUE,
    include_high_risk_summary BOOLEAN DEFAULT TRUE,
    include_feedback_needed BOOLEAN DEFAULT TRUE,
    
    -- Parent-specific
    include_child_activity BOOLEAN DEFAULT TRUE,
    include_approval_reminders BOOLEAN DEFAULT TRUE,
    
    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '07:00:00',
    
    -- Timezone
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 4. DIGEST HISTORY TABLE
-- Track sent digests to avoid duplicates
-- =============================================================================

CREATE TABLE IF NOT EXISTS digest_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Digest details
    digest_type VARCHAR(20) NOT NULL CHECK (digest_type IN (
        'daily', 'weekly', 'monthly'
    )),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Content summary
    content_summary JSONB DEFAULT '{}',
    items_included INTEGER DEFAULT 0,
    
    -- Delivery
    delivery_channel VARCHAR(20) NOT NULL,
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivery_status VARCHAR(20) DEFAULT 'delivered',
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, digest_type, period_start, delivery_channel)
);

-- Indexes for digest_history
CREATE INDEX IF NOT EXISTS idx_digest_user_type 
    ON digest_history(user_id, digest_type, period_start DESC);

-- =============================================================================
-- 5. TEAM INSIGHTS TABLE
-- Aggregated team-level metrics and trends
-- =============================================================================

CREATE TABLE IF NOT EXISTS team_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Time period
    period_type VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Roster metrics
    active_athletes INTEGER DEFAULT 0,
    athletes_using_ai INTEGER DEFAULT 0,
    ai_adoption_rate DECIMAL(5,2),
    
    -- ACWR distribution
    acwr_optimal_count INTEGER DEFAULT 0,  -- 0.8-1.3
    acwr_warning_count INTEGER DEFAULT 0,  -- 1.3-1.5
    acwr_danger_count INTEGER DEFAULT 0,   -- >1.5
    avg_team_acwr DECIMAL(4,2),
    
    -- Injury trends
    active_injuries INTEGER DEFAULT 0,
    new_injuries_this_period INTEGER DEFAULT 0,
    injury_types JSONB DEFAULT '{}', -- {muscle_strain: 3, joint: 2}
    common_body_parts JSONB DEFAULT '[]',
    
    -- AI interaction patterns
    total_ai_queries INTEGER DEFAULT 0,
    avg_queries_per_athlete DECIMAL(5,1),
    most_common_intents JSONB DEFAULT '[]',
    risk_level_distribution JSONB DEFAULT '{}',
    
    -- Session engagement
    total_micro_sessions INTEGER DEFAULT 0,
    team_completion_rate DECIMAL(5,2),
    most_popular_session_types JSONB DEFAULT '[]',
    
    -- Readiness trends
    avg_readiness_score DECIMAL(4,1),
    readiness_trend VARCHAR(20), -- 'improving', 'stable', 'declining'
    avg_pain_level DECIMAL(3,1),
    avg_fatigue_level DECIMAL(3,1),
    
    -- Computed at
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(team_id, period_type, period_start)
);

-- Indexes for team_insights
CREATE INDEX IF NOT EXISTS idx_team_insights_period 
    ON team_insights(team_id, period_type, period_start DESC);

-- =============================================================================
-- 6. ACHIEVEMENTS TABLE
-- Gamification - track athlete achievements
-- =============================================================================

CREATE TABLE IF NOT EXISTS athlete_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Achievement details
    achievement_type VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    achievement_description TEXT,
    achievement_icon VARCHAR(50), -- Icon class/name
    
    -- Progress tracking
    progress_current INTEGER DEFAULT 0,
    progress_target INTEGER DEFAULT 1,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    
    -- Points/rewards
    points_awarded INTEGER DEFAULT 0,
    
    -- Category
    category VARCHAR(30) CHECK (category IN (
        'sessions',      -- Micro-session related
        'consistency',   -- Streak related
        'learning',      -- AI interactions
        'recovery',      -- Recovery compliance
        'team',          -- Team engagement
        'milestones'     -- General milestones
    )),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_type)
);

-- Indexes for athlete_achievements
CREATE INDEX IF NOT EXISTS idx_achievements_user 
    ON athlete_achievements(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_achievements_category 
    ON athlete_achievements(category);

-- =============================================================================
-- 7. LEADERBOARD VIEW
-- Team session completion leaderboard
-- =============================================================================

CREATE OR REPLACE VIEW team_session_leaderboard AS
SELECT 
    tm.team_id,
    ms.user_id,
    u.first_name,
    u.last_name,
    u.first_name || ' ' || COALESCE(u.last_name, '') AS display_name,
    COUNT(ms.id) FILTER (WHERE ms.status = 'completed') AS completed_sessions,
    COUNT(ms.id) AS total_sessions,
    ROUND(
        100.0 * COUNT(ms.id) FILTER (WHERE ms.status = 'completed') / 
        NULLIF(COUNT(ms.id), 0), 
        1
    ) AS completion_rate,
    COALESCE(SUM(ms.actual_duration_minutes) FILTER (WHERE ms.status = 'completed'), 0) AS total_minutes,
    MAX(ms.completed_at) AS last_completed
FROM micro_sessions ms
JOIN users u ON u.id = ms.user_id
JOIN team_members tm ON tm.user_id = ms.user_id AND tm.status = 'active'
WHERE ms.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY tm.team_id, ms.user_id, u.first_name, u.last_name;

-- =============================================================================
-- 8. CONVERSATION CONTEXT TABLE
-- Cross-session memory for conversation continuity
-- =============================================================================

CREATE TABLE IF NOT EXISTS conversation_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Context type
    context_type VARCHAR(30) NOT NULL CHECK (context_type IN (
        'injury_followup',    -- Following up on injury
        'goal_tracking',      -- Tracking a goal
        'program_progress',   -- Training program progress
        'technique_focus',    -- Working on specific technique
        'recovery_protocol',  -- Following recovery plan
        'general_context'     -- General conversation memory
    )),
    
    -- Context details
    context_key VARCHAR(100) NOT NULL, -- e.g., 'knee_injury_dec_2025'
    context_summary TEXT NOT NULL,
    context_data JSONB DEFAULT '{}',
    
    -- Source references
    source_session_id UUID REFERENCES ai_chat_sessions(id),
    source_message_ids UUID[] DEFAULT '{}',
    
    -- Relevance tracking
    last_referenced_at TIMESTAMPTZ,
    reference_count INTEGER DEFAULT 0,
    
    -- Expiration
    expires_at TIMESTAMPTZ, -- Some contexts expire (e.g., injury healed)
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, context_type, context_key)
);

-- Indexes for conversation_context
CREATE INDEX IF NOT EXISTS idx_context_user_active 
    ON conversation_context(user_id, is_active, context_type);
CREATE INDEX IF NOT EXISTS idx_context_expires 
    ON conversation_context(expires_at) 
    WHERE expires_at IS NOT NULL AND is_active = TRUE;

-- =============================================================================
-- 9. FOLLOW-UP TRACKING TABLE
-- Track scheduled follow-ups for injuries, goals, etc.
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Follow-up details
    followup_type VARCHAR(30) NOT NULL CHECK (followup_type IN (
        'injury_check',      -- Check on injury status
        'pain_followup',     -- Follow up on reported pain
        'session_feedback',  -- Get feedback on completed session
        'goal_checkin',      -- Progress check on goal
        'recovery_check',    -- Check recovery compliance
        'custom'             -- Custom follow-up
    )),
    
    -- Content
    followup_prompt TEXT NOT NULL,  -- Question to ask
    context JSONB DEFAULT '{}',     -- Context for the follow-up
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ NOT NULL,
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Not yet triggered
        'triggered',    -- Shown to user
        'completed',    -- User responded
        'skipped',      -- User skipped
        'expired'       -- Past due, not completed
    )),
    
    -- Response
    triggered_at TIMESTAMPTZ,
    response_message_id UUID REFERENCES ai_messages(id),
    response_summary TEXT,
    
    -- Source
    source_type VARCHAR(30), -- 'ai_message', 'injury', 'micro_session'
    source_id UUID,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for ai_followups
CREATE INDEX IF NOT EXISTS idx_followups_user_pending 
    ON ai_followups(user_id, scheduled_for) 
    WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_followups_scheduled 
    ON ai_followups(scheduled_for, status) 
    WHERE status = 'pending';

-- =============================================================================
-- 10. EXTEND EXISTING TABLES
-- =============================================================================

-- Add feedback tracking to ai_messages
ALTER TABLE ai_messages 
    ADD COLUMN IF NOT EXISTS feedback_received BOOLEAN DEFAULT FALSE;

ALTER TABLE ai_messages 
    ADD COLUMN IF NOT EXISTS feedback_helpful BOOLEAN;

-- Add achievement points to users
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS achievement_points INTEGER DEFAULT 0;

ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;

ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;

-- =============================================================================
-- 11. ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Response Feedback
ALTER TABLE ai_response_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
ON ai_response_feedback FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create feedback on own messages"
ON ai_response_feedback FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Coaches can view team feedback"
ON ai_response_feedback FOR SELECT
USING (
    user_id IN (
        SELECT tm.user_id FROM team_members tm
        WHERE tm.team_id IN (
            SELECT tm2.team_id FROM team_members tm2
            WHERE tm2.user_id = auth.uid() AND tm2.role IN ('coach', 'assistant_coach')
        )
    )
);

-- Notification Preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification preferences"
ON notification_preferences FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Achievements
ALTER TABLE athlete_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
ON athlete_achievements FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can see team achievements"
ON athlete_achievements FOR SELECT
USING (
    user_id IN (
        SELECT tm.user_id FROM team_members tm
        WHERE tm.team_id IN (
            SELECT tm2.team_id FROM team_members tm2
            WHERE tm2.user_id = auth.uid()
        )
    )
);

-- Conversation Context
ALTER TABLE conversation_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversation context"
ON conversation_context FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Follow-ups
ALTER TABLE ai_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own followups"
ON ai_followups FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Coach Analytics Cache
ALTER TABLE coach_analytics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view own analytics"
ON coach_analytics_cache FOR SELECT
USING (coach_id = auth.uid());

-- Team Insights
ALTER TABLE team_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view team insights"
ON team_insights FOR SELECT
USING (
    team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- =============================================================================
-- 12. HELPER FUNCTIONS
-- =============================================================================

-- Function to compute coach analytics for a period
CREATE OR REPLACE FUNCTION compute_coach_analytics(
    p_coach_id UUID,
    p_team_id UUID,
    p_period_type VARCHAR,
    p_period_start DATE,
    p_period_end DATE
) RETURNS coach_analytics_cache AS $$
DECLARE
    result coach_analytics_cache;
    v_team_members UUID[];
BEGIN
    -- Get team member IDs
    SELECT ARRAY_AGG(user_id) INTO v_team_members
    FROM team_members
    WHERE team_id = p_team_id AND status = 'active';

    -- Build analytics
    WITH classification_stats AS (
        SELECT 
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE risk_level = 'high') AS high_risk,
            COUNT(*) FILTER (WHERE risk_level = 'medium') AS medium_risk,
            COUNT(*) FILTER (WHERE risk_level = 'low') AS low_risk,
            COUNT(*) FILTER (WHERE is_youth_interaction = TRUE) AS youth,
            AVG(classification_confidence) AS avg_conf
        FROM ai_messages
        WHERE user_id = ANY(v_team_members)
        AND role = 'user'
        AND created_at >= p_period_start
        AND created_at < p_period_end + INTERVAL '1 day'
    ),
    feedback_stats AS (
        SELECT 
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE classification_accuracy = 'appropriate') AS appropriate,
            COUNT(*) FILTER (WHERE classification_accuracy = 'too_strict') AS too_strict,
            COUNT(*) FILTER (WHERE classification_accuracy = 'too_lenient') AS too_lenient
        FROM ai_response_feedback
        WHERE user_id = ANY(v_team_members)
        AND feedback_source = 'coach'
        AND created_at >= p_period_start
        AND created_at < p_period_end + INTERVAL '1 day'
    ),
    session_stats AS (
        SELECT 
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'completed') AS completed
        FROM micro_sessions
        WHERE user_id = ANY(v_team_members)
        AND created_at >= p_period_start
        AND created_at < p_period_end + INTERVAL '1 day'
    )
    INSERT INTO coach_analytics_cache (
        coach_id, team_id, period_type, period_start, period_end,
        total_classifications, high_risk_count, medium_risk_count, low_risk_count,
        feedback_count, appropriate_count, too_strict_count, too_lenient_count,
        accuracy_rate, youth_interactions, micro_sessions_created, micro_sessions_completed,
        completion_rate, avg_confidence, computed_at
    )
    SELECT 
        p_coach_id, p_team_id, p_period_type, p_period_start, p_period_end,
        cs.total, cs.high_risk, cs.medium_risk, cs.low_risk,
        fs.total, fs.appropriate, fs.too_strict, fs.too_lenient,
        CASE WHEN fs.total > 0 THEN ROUND(100.0 * fs.appropriate / fs.total, 2) END,
        cs.youth,
        ss.total, ss.completed,
        CASE WHEN ss.total > 0 THEN ROUND(100.0 * ss.completed / ss.total, 2) END,
        cs.avg_conf,
        NOW()
    FROM classification_stats cs, feedback_stats fs, session_stats ss
    ON CONFLICT (coach_id, team_id, period_type, period_start)
    DO UPDATE SET
        total_classifications = EXCLUDED.total_classifications,
        high_risk_count = EXCLUDED.high_risk_count,
        medium_risk_count = EXCLUDED.medium_risk_count,
        low_risk_count = EXCLUDED.low_risk_count,
        feedback_count = EXCLUDED.feedback_count,
        appropriate_count = EXCLUDED.appropriate_count,
        too_strict_count = EXCLUDED.too_strict_count,
        too_lenient_count = EXCLUDED.too_lenient_count,
        accuracy_rate = EXCLUDED.accuracy_rate,
        youth_interactions = EXCLUDED.youth_interactions,
        micro_sessions_created = EXCLUDED.micro_sessions_created,
        micro_sessions_completed = EXCLUDED.micro_sessions_completed,
        completion_rate = EXCLUDED.completion_rate,
        avg_confidence = EXCLUDED.avg_confidence,
        computed_at = NOW()
    RETURNING * INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to award achievement
CREATE OR REPLACE FUNCTION award_achievement(
    p_user_id UUID,
    p_achievement_type VARCHAR,
    p_achievement_name VARCHAR,
    p_description TEXT,
    p_category VARCHAR,
    p_points INTEGER DEFAULT 10,
    p_progress_target INTEGER DEFAULT 1
) RETURNS athlete_achievements AS $$
DECLARE
    result athlete_achievements;
BEGIN
    INSERT INTO athlete_achievements (
        user_id, achievement_type, achievement_name, 
        achievement_description, category, points_awarded,
        progress_target, progress_current, is_completed, completed_at
    ) VALUES (
        p_user_id, p_achievement_type, p_achievement_name,
        p_description, p_category, p_points,
        p_progress_target, 1, p_progress_target = 1, 
        CASE WHEN p_progress_target = 1 THEN NOW() END
    )
    ON CONFLICT (user_id, achievement_type)
    DO UPDATE SET
        progress_current = athlete_achievements.progress_current + 1,
        is_completed = CASE 
            WHEN athlete_achievements.progress_current + 1 >= athlete_achievements.progress_target 
            THEN TRUE ELSE FALSE END,
        completed_at = CASE 
            WHEN athlete_achievements.progress_current + 1 >= athlete_achievements.progress_target 
            AND athlete_achievements.completed_at IS NULL
            THEN NOW() ELSE athlete_achievements.completed_at END,
        updated_at = NOW()
    RETURNING * INTO result;

    -- Update user points if newly completed
    IF result.is_completed AND result.completed_at = NOW() THEN
        UPDATE users 
        SET achievement_points = achievement_points + result.points_awarded
        WHERE id = p_user_id;
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to check and trigger pending follow-ups
CREATE OR REPLACE FUNCTION get_pending_followups(p_user_id UUID)
RETURNS SETOF ai_followups AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM ai_followups
    WHERE user_id = p_user_id
    AND status = 'pending'
    AND scheduled_for <= NOW()
    ORDER BY scheduled_for ASC
    LIMIT 3;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- 13. TRIGGERS
-- =============================================================================

-- Update timestamps
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversation_context_updated_at ON conversation_context;
CREATE TRIGGER update_conversation_context_updated_at
    BEFORE UPDATE ON conversation_context
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_athlete_achievements_updated_at ON athlete_achievements;
CREATE TRIGGER update_athlete_achievements_updated_at
    BEFORE UPDATE ON athlete_achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 14. SEED ACHIEVEMENT DEFINITIONS
-- =============================================================================

-- Create a table for achievement templates (one-time definitions)
CREATE TABLE IF NOT EXISTS achievement_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    achievement_type VARCHAR(50) UNIQUE NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    achievement_description TEXT,
    achievement_icon VARCHAR(50),
    category VARCHAR(30) NOT NULL,
    points INTEGER DEFAULT 10,
    progress_target INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE
);

-- Seed default achievements
INSERT INTO achievement_definitions (achievement_type, achievement_name, achievement_description, achievement_icon, category, points, progress_target)
VALUES
    -- Sessions
    ('first_session', 'First Steps', 'Complete your first micro-session', 'pi-play', 'sessions', 10, 1),
    ('session_5', 'Getting Started', 'Complete 5 micro-sessions', 'pi-star', 'sessions', 25, 5),
    ('session_25', 'Session Pro', 'Complete 25 micro-sessions', 'pi-star-fill', 'sessions', 50, 25),
    ('session_100', 'Session Master', 'Complete 100 micro-sessions', 'pi-trophy', 'sessions', 100, 100),
    
    -- Consistency
    ('streak_3', 'Getting Consistent', '3-day training streak', 'pi-bolt', 'consistency', 15, 3),
    ('streak_7', 'Week Warrior', '7-day training streak', 'pi-bolt', 'consistency', 30, 7),
    ('streak_30', 'Monthly Champion', '30-day training streak', 'pi-crown', 'consistency', 100, 30),
    
    -- Learning
    ('first_question', 'Curious Mind', 'Ask your first AI Coach question', 'pi-question-circle', 'learning', 5, 1),
    ('questions_10', 'Knowledge Seeker', 'Ask 10 questions to AI Coach', 'pi-book', 'learning', 20, 10),
    ('questions_50', 'Student of the Game', 'Ask 50 questions to AI Coach', 'pi-graduation-cap', 'learning', 50, 50),
    
    -- Recovery
    ('recovery_complete', 'Recovery Ready', 'Complete a recovery session', 'pi-heart', 'recovery', 10, 1),
    ('recovery_5', 'Recovery Focused', 'Complete 5 recovery sessions', 'pi-heart-fill', 'recovery', 30, 5),
    ('daily_checkin_7', 'Check-in Champ', 'Log daily state 7 days in a row', 'pi-calendar-plus', 'recovery', 25, 7),
    
    -- Team
    ('team_join', 'Team Player', 'Join a team', 'pi-users', 'team', 10, 1),
    ('leaderboard_top3', 'Top Performer', 'Reach top 3 on team leaderboard', 'pi-chart-line', 'team', 50, 1),
    
    -- Milestones
    ('profile_complete', 'All Set Up', 'Complete your athlete profile', 'pi-user-edit', 'milestones', 15, 1),
    ('first_week', 'One Week In', 'Active for your first week', 'pi-calendar', 'milestones', 20, 1)
ON CONFLICT (achievement_type) DO NOTHING;

-- =============================================================================
-- 15. COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE ai_response_feedback IS 'Athlete and coach feedback on AI responses for learning';
COMMENT ON TABLE coach_analytics_cache IS 'Pre-computed analytics for coach dashboard';
COMMENT ON TABLE notification_preferences IS 'User preferences for digests and notifications';
COMMENT ON TABLE digest_history IS 'Track sent digests to avoid duplicates';
COMMENT ON TABLE team_insights IS 'Aggregated team-level metrics and trends';
COMMENT ON TABLE athlete_achievements IS 'Gamification achievements for athletes';
COMMENT ON TABLE conversation_context IS 'Cross-session memory for conversation continuity';
COMMENT ON TABLE ai_followups IS 'Scheduled follow-ups for injuries, goals, etc.';
COMMENT ON TABLE achievement_definitions IS 'Template definitions for available achievements';

COMMENT ON FUNCTION compute_coach_analytics IS 'Compute and cache coach analytics for a period';
COMMENT ON FUNCTION award_achievement IS 'Award or progress an achievement for a user';
COMMENT ON FUNCTION get_pending_followups IS 'Get pending follow-ups ready to trigger for a user';

COMMENT ON VIEW team_session_leaderboard IS 'Team session completion leaderboard (last 30 days)';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

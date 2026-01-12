-- Migration: Add Missing Tables for Frontend API Calls
-- Date: 2026-01-12
-- Purpose: Add missing tables and columns used by frontend and Netlify functions
-- Already applied to database via Supabase MCP

-- =============================================================================
-- 1. Add missing columns to exercises table
-- =============================================================================

ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS target_muscles TEXT[] DEFAULT '{}'::TEXT[],
ADD COLUMN IF NOT EXISTS equipment_required TEXT[] DEFAULT '{}'::TEXT[];

-- =============================================================================
-- 2. Add missing columns to isometrics_exercises table
-- =============================================================================

ALTER TABLE public.isometrics_exercises 
ADD COLUMN IF NOT EXISTS target_muscles TEXT[] DEFAULT '{}'::TEXT[],
ADD COLUMN IF NOT EXISTS instructions TEXT[] DEFAULT '{}'::TEXT[],
ADD COLUMN IF NOT EXISTS hold_duration_seconds INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS sets INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS reps INTEGER DEFAULT 1;

-- =============================================================================
-- 3. Add missing columns to plyometrics_exercises table
-- =============================================================================

ALTER TABLE public.plyometrics_exercises 
ADD COLUMN IF NOT EXISTS target_muscles TEXT[] DEFAULT '{}'::TEXT[],
ADD COLUMN IF NOT EXISTS coaching_cues TEXT[] DEFAULT '{}'::TEXT[];

-- =============================================================================
-- 4. Add missing columns to training_sessions table
-- =============================================================================

ALTER TABLE public.training_sessions 
ADD COLUMN IF NOT EXISTS is_outdoor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS intensity VARCHAR(50);

-- =============================================================================
-- 5. Create coach_inbox_items table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.coach_inbox_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    player_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- 'alert', 'recommendation', 'request', 'observation'
    title TEXT NOT NULL,
    message TEXT,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    status VARCHAR(20) DEFAULT 'unread', -- 'unread', 'read', 'actioned', 'dismissed'
    metadata JSONB DEFAULT '{}',
    source VARCHAR(50), -- 'ai', 'system', 'player', 'auto'
    action_required BOOLEAN DEFAULT false,
    action_taken TEXT,
    actioned_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coach_inbox_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY coach_inbox_items_own_data ON public.coach_inbox_items
    FOR ALL TO authenticated
    USING (coach_id = auth.uid())
    WITH CHECK (coach_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_coach_inbox_items_coach_id ON public.coach_inbox_items(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_inbox_items_status ON public.coach_inbox_items(status) WHERE status IN ('unread', 'read');

-- =============================================================================
-- 6. Create coach_alert_acknowledgments table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.coach_alert_acknowledgments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL,
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    action_taken TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coach_alert_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY coach_alert_acknowledgments_own_data ON public.coach_alert_acknowledgments
    FOR ALL TO authenticated
    USING (coach_id = auth.uid())
    WITH CHECK (coach_id = auth.uid());

-- =============================================================================
-- 7. Create ai_followups table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ai_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
    followup_type VARCHAR(50) NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'dismissed', 'completed'
    sent_at TIMESTAMPTZ,
    response TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_followups_own_data ON public.ai_followups
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 8. Create user_ai_preferences table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_ai_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tone VARCHAR(50) DEFAULT 'friendly', -- 'friendly', 'professional', 'coach-like', 'casual'
    verbosity VARCHAR(20) DEFAULT 'balanced', -- 'brief', 'balanced', 'detailed'
    proactive_suggestions BOOLEAN DEFAULT true,
    reminder_frequency VARCHAR(20) DEFAULT 'moderate', -- 'low', 'moderate', 'high'
    focus_areas TEXT[] DEFAULT '{}',
    avoided_topics TEXT[] DEFAULT '{}',
    language_preference VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_ai_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_ai_preferences_own_data ON public.user_ai_preferences
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 9. Create user_age_groups table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_age_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    age_group VARCHAR(20) NOT NULL, -- 'youth', 'teen', 'adult', 'senior'
    birth_year INTEGER,
    requires_parental_consent BOOLEAN DEFAULT false,
    consent_given BOOLEAN DEFAULT false,
    consent_given_by UUID REFERENCES auth.users(id),
    consent_given_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_age_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_age_groups_own_data ON public.user_age_groups
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 10. Create youth_athlete_settings table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.youth_athlete_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_email VARCHAR(255),
    parent_phone VARCHAR(50),
    school_name VARCHAR(255),
    grade_level INTEGER,
    sport_experience_years INTEGER DEFAULT 0,
    medical_clearance_date DATE,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    dietary_restrictions TEXT[],
    special_needs_notes TEXT,
    max_training_hours_per_week INTEGER DEFAULT 10,
    rest_day_requirements INTEGER DEFAULT 2,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.youth_athlete_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY youth_athlete_settings_own_data ON public.youth_athlete_settings
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 11. Create parent_guardian_links table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.parent_guardian_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    relationship VARCHAR(50) DEFAULT 'parent', -- 'parent', 'guardian', 'coach'
    is_primary BOOLEAN DEFAULT false,
    can_view_training BOOLEAN DEFAULT true,
    can_view_wellness BOOLEAN DEFAULT true,
    can_view_nutrition BOOLEAN DEFAULT false,
    can_communicate_coach BOOLEAN DEFAULT true,
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(athlete_id, parent_id)
);

ALTER TABLE public.parent_guardian_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY parent_guardian_links_athlete ON public.parent_guardian_links
    FOR SELECT TO authenticated
    USING (athlete_id = auth.uid() OR parent_id = auth.uid());

CREATE POLICY parent_guardian_links_parent ON public.parent_guardian_links
    FOR ALL TO authenticated
    USING (parent_id = auth.uid())
    WITH CHECK (parent_id = auth.uid());

-- =============================================================================
-- 12. Create parent_notifications table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.parent_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    priority VARCHAR(20) DEFAULT 'normal',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.parent_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY parent_notifications_own_data ON public.parent_notifications
    FOR ALL TO authenticated
    USING (parent_id = auth.uid())
    WITH CHECK (parent_id = auth.uid());

-- =============================================================================
-- 13. Create classification_history table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.classification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
    input_text TEXT NOT NULL,
    classified_intent VARCHAR(100),
    confidence_score DECIMAL(5,4),
    model_version VARCHAR(50),
    response_time_ms INTEGER,
    was_correct BOOLEAN,
    corrected_intent VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.classification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY classification_history_own_data ON public.classification_history
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 14. Create conversation_context table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.conversation_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
    context_type VARCHAR(50) NOT NULL,
    context_data JSONB NOT NULL DEFAULT '{}',
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.conversation_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversation_context_own_data ON public.conversation_context
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 15. Create ai_review_queue table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ai_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id UUID NOT NULL REFERENCES public.ai_coach_interactions(id) ON DELETE CASCADE,
    review_type VARCHAR(50) NOT NULL, -- 'safety', 'quality', 'escalation'
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_review', 'approved', 'rejected'
    reviewer_id UUID REFERENCES auth.users(id),
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    auto_flagged_reasons TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_review_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_review_queue_admin_only ON public.ai_review_queue
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND email LIKE '%@admin%'));

-- =============================================================================
-- 16. Create acwr_history table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.acwr_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL,
    acute_load DECIMAL(10,2),
    chronic_load DECIMAL(10,2),
    acwr_ratio DECIMAL(5,3),
    risk_level VARCHAR(20), -- 'low', 'moderate', 'high', 'very_high'
    training_sessions_count INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, calculation_date)
);

ALTER TABLE public.acwr_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY acwr_history_own_data ON public.acwr_history
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 17. Create digest_history table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.digest_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    digest_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
    digest_date DATE NOT NULL,
    content JSONB NOT NULL,
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, digest_type, digest_date)
);

ALTER TABLE public.digest_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY digest_history_own_data ON public.digest_history
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 18. Create micro_sessions table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.micro_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL, -- 'mobility', 'breathing', 'visualization', 'warmup'
    title VARCHAR(255) NOT NULL,
    duration_seconds INTEGER NOT NULL,
    instructions TEXT[],
    scheduled_time TIME,
    trigger_context VARCHAR(100), -- 'pre_training', 'post_training', 'morning', 'evening'
    completed_at TIMESTAMPTZ,
    skipped BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.micro_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY micro_sessions_own_data ON public.micro_sessions
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 19. Create micro_session_analytics table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.micro_session_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    micro_session_id UUID REFERENCES public.micro_sessions(id) ON DELETE CASCADE,
    completion_rate DECIMAL(5,2),
    avg_duration_seconds INTEGER,
    streak_days INTEGER DEFAULT 0,
    total_completed INTEGER DEFAULT 0,
    favorite_type VARCHAR(50),
    last_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.micro_session_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY micro_session_analytics_own_data ON public.micro_session_analytics
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 20. Create team_templates table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.team_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    template_type VARCHAR(50) NOT NULL, -- 'training', 'protocol', 'warmup', 'recovery'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.team_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_templates_team_access ON public.team_templates
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_members.team_id = team_templates.team_id 
        AND team_members.user_id = auth.uid()
    ));

CREATE POLICY team_templates_coach_modify ON public.team_templates
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_members.team_id = team_templates.team_id 
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('coach', 'head_coach', 'admin')
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_members.team_id = team_templates.team_id 
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('coach', 'head_coach', 'admin')
    ));

-- =============================================================================
-- 21. Create template_assignments table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.template_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.team_templates(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES auth.users(id),
    assigned_date DATE NOT NULL,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'assigned', -- 'assigned', 'in_progress', 'completed', 'skipped'
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.template_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY template_assignments_player ON public.template_assignments
    FOR SELECT TO authenticated
    USING (player_id = auth.uid());

CREATE POLICY template_assignments_coach ON public.template_assignments
    FOR ALL TO authenticated
    USING (assigned_by = auth.uid())
    WITH CHECK (assigned_by = auth.uid());

-- =============================================================================
-- Done - All missing tables and columns have been added
-- =============================================================================

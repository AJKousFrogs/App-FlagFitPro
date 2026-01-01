-- =============================================================================
-- AI COACH PHASE 2: MICRO-SESSIONS & TEAM TEMPLATES
-- Migration: 078_ai_coach_phase2.sql
-- Purpose: Transform suggested actions into trackable micro-sessions with 
--          completion tracking, and enable coaches to save recommendations
--          as reusable team templates.
-- Created: 2026-01-01
-- =============================================================================

-- =============================================================================
-- 1. MICRO-SESSIONS TABLE
-- Trackable workout/activity sessions from AI suggestions
-- =============================================================================

CREATE TABLE IF NOT EXISTS micro_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Session details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    session_type VARCHAR(50) NOT NULL, -- 'recovery', 'technique', 'mobility', 'mental', 'strength'
    
    -- Time and equipment
    estimated_duration_minutes INTEGER NOT NULL DEFAULT 5,
    equipment_needed TEXT[] DEFAULT '{}', -- ['foam roller', 'resistance band', 'none']
    
    -- Source tracking
    source_type VARCHAR(30) NOT NULL, -- 'ai_suggestion', 'coach_assigned', 'team_template', 'self_created'
    source_id UUID, -- Reference to ai_message, coach_inbox_item, or team_template
    source_message_id UUID REFERENCES ai_messages(id) ON DELETE SET NULL,
    
    -- Position and intensity
    position_relevance TEXT[] DEFAULT '{"ALL"}',
    intensity_level VARCHAR(20) DEFAULT 'low', -- 'rest', 'low', 'moderate'
    
    -- Content structure
    steps JSONB DEFAULT '[]', -- [{order: 1, instruction: "...", duration_seconds: 30}, ...]
    coaching_cues TEXT[], -- Key points to remember
    safety_notes TEXT, -- Warnings or modifications
    
    -- Completion tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Not started
        'in_progress',  -- Started but not finished
        'completed',    -- Finished
        'skipped',      -- User skipped
        'expired'       -- Past the intended date
    )),
    
    -- Timing
    assigned_date DATE DEFAULT CURRENT_DATE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    actual_duration_minutes INTEGER,
    
    -- Follow-up
    follow_up_prompt TEXT, -- "How do you feel now? (0-10)"
    follow_up_response JSONB, -- {rating: 7, notes: "feeling better"}
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for micro_sessions
CREATE INDEX IF NOT EXISTS idx_micro_sessions_user_status 
    ON micro_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_micro_sessions_user_date 
    ON micro_sessions(user_id, assigned_date DESC);
CREATE INDEX IF NOT EXISTS idx_micro_sessions_type 
    ON micro_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_micro_sessions_source 
    ON micro_sessions(source_id) WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_micro_sessions_pending 
    ON micro_sessions(user_id, assigned_date) 
    WHERE status = 'pending';

-- =============================================================================
-- 2. TEAM TEMPLATES TABLE
-- Reusable coaching templates saved by coaches
-- =============================================================================

CREATE TABLE IF NOT EXISTS team_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Template info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'recovery', 'warm_up', 'technique', 'injury_prevention', 'mental'
    
    -- Content
    template_type VARCHAR(30) NOT NULL, -- 'micro_session', 'response_override', 'checklist'
    content JSONB NOT NULL, -- Full template content based on type
    
    -- For micro_session type:
    -- {
    --   title: "Team Recovery Protocol",
    --   description: "Standard recovery routine",
    --   session_type: "recovery",
    --   estimated_duration_minutes: 10,
    --   equipment_needed: ["foam roller"],
    --   steps: [...],
    --   coaching_cues: [...],
    --   safety_notes: "..."
    -- }
    
    -- For response_override type:
    -- {
    --   trigger_intents: ["pain_injury", "recovery_readiness"],
    --   override_message: "Team policy: ...",
    --   suggested_action: {...}
    -- }
    
    -- Applicability
    position_filter TEXT[] DEFAULT '{"ALL"}', -- Which positions this applies to
    applies_to_youth BOOLEAN DEFAULT TRUE,
    applies_to_adults BOOLEAN DEFAULT TRUE,
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE, -- Auto-apply for team
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for team_templates
CREATE INDEX IF NOT EXISTS idx_team_templates_team 
    ON team_templates(team_id, is_active);
CREATE INDEX IF NOT EXISTS idx_team_templates_category 
    ON team_templates(category);
CREATE INDEX IF NOT EXISTS idx_team_templates_default 
    ON team_templates(team_id, is_default) WHERE is_default = TRUE;

-- =============================================================================
-- 3. TEMPLATE ASSIGNMENTS TABLE
-- Track when templates are applied to athletes
-- =============================================================================

CREATE TABLE IF NOT EXISTS template_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES team_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Context
    reason TEXT, -- Why this was assigned
    source_inbox_item_id UUID REFERENCES coach_inbox_items(id) ON DELETE SET NULL,
    
    -- Result
    micro_session_id UUID REFERENCES micro_sessions(id) ON DELETE SET NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN (
        'assigned', 'accepted', 'declined', 'completed', 'expired'
    )),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_assignments_user 
    ON template_assignments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_template_assignments_template 
    ON template_assignments(template_id);

-- =============================================================================
-- 4. COMPLETION ANALYTICS VIEW
-- Aggregate completion metrics for dashboards
-- =============================================================================

CREATE OR REPLACE VIEW micro_session_analytics AS
SELECT 
    ms.user_id,
    DATE_TRUNC('week', ms.assigned_date) as week_start,
    ms.session_type,
    COUNT(*) as total_assigned,
    COUNT(*) FILTER (WHERE ms.status = 'completed') as completed,
    COUNT(*) FILTER (WHERE ms.status = 'skipped') as skipped,
    COUNT(*) FILTER (WHERE ms.status = 'pending') as pending,
    ROUND(
        COUNT(*) FILTER (WHERE ms.status = 'completed')::DECIMAL / 
        NULLIF(COUNT(*) FILTER (WHERE ms.status IN ('completed', 'skipped')), 0) * 100, 
        1
    ) as completion_rate,
    AVG(ms.actual_duration_minutes) FILTER (WHERE ms.status = 'completed') as avg_duration_minutes,
    AVG((ms.follow_up_response->>'rating')::INTEGER) FILTER (
        WHERE ms.status = 'completed' AND ms.follow_up_response->>'rating' IS NOT NULL
    ) as avg_follow_up_rating
FROM micro_sessions ms
GROUP BY ms.user_id, DATE_TRUNC('week', ms.assigned_date), ms.session_type;

-- =============================================================================
-- 5. EXTEND AI_RECOMMENDATIONS TABLE
-- Link recommendations to micro-sessions
-- =============================================================================

ALTER TABLE ai_recommendations 
    ADD COLUMN IF NOT EXISTS micro_session_id UUID REFERENCES micro_sessions(id) ON DELETE SET NULL;

ALTER TABLE ai_recommendations 
    ADD COLUMN IF NOT EXISTS is_micro_session BOOLEAN DEFAULT FALSE;

-- Index for finding recommendations with micro-sessions
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_micro_session 
    ON ai_recommendations(micro_session_id) WHERE micro_session_id IS NOT NULL;

-- =============================================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Micro sessions: users see own, coaches see team members
ALTER TABLE micro_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own micro sessions"
ON micro_sessions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can view team member micro sessions"
ON micro_sessions FOR SELECT
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

-- Team templates: coaches of team can manage, team members can view
ALTER TABLE team_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage team templates"
ON team_templates FOR ALL
USING (
    team_id IN (
        SELECT tm.team_id FROM team_members tm
        WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
        AND tm.status = 'active'
    )
)
WITH CHECK (
    team_id IN (
        SELECT tm.team_id FROM team_members tm
        WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
        AND tm.status = 'active'
    )
);

CREATE POLICY "Team members can view active templates"
ON team_templates FOR SELECT
USING (
    is_active = TRUE AND
    team_id IN (
        SELECT tm.team_id FROM team_members tm
        WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
);

-- Template assignments: users see own, coaches see team
ALTER TABLE template_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assignments"
ON template_assignments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own assignments"
ON template_assignments FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can manage team assignments"
ON template_assignments FOR ALL
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
-- 7. TRIGGERS
-- =============================================================================

-- Update updated_at on micro_sessions
DROP TRIGGER IF EXISTS update_micro_sessions_updated_at ON micro_sessions;
CREATE TRIGGER update_micro_sessions_updated_at
    BEFORE UPDATE ON micro_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on team_templates
DROP TRIGGER IF EXISTS update_team_templates_updated_at ON team_templates;
CREATE TRIGGER update_team_templates_updated_at
    BEFORE UPDATE ON team_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update usage count when template is used
CREATE OR REPLACE FUNCTION update_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE team_templates 
    SET 
        usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = NEW.template_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_template_usage ON template_assignments;
CREATE TRIGGER trigger_template_usage
    AFTER INSERT ON template_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_template_usage();

-- =============================================================================
-- 8. ENABLE REALTIME FOR MICRO-SESSIONS
-- =============================================================================

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE micro_sessions;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- =============================================================================
-- 9. COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE micro_sessions IS 'Trackable micro-workout sessions created from AI suggestions, coach assignments, or team templates';
COMMENT ON TABLE team_templates IS 'Reusable coaching templates saved by coaches for team-wide application';
COMMENT ON TABLE template_assignments IS 'Track when team templates are assigned to individual athletes';

COMMENT ON COLUMN micro_sessions.session_type IS 'Type: recovery, technique, mobility, mental, strength';
COMMENT ON COLUMN micro_sessions.steps IS 'JSON array of ordered steps with instructions and durations';
COMMENT ON COLUMN micro_sessions.follow_up_prompt IS 'Question asked after completion, e.g., "How do you feel now?"';
COMMENT ON COLUMN micro_sessions.follow_up_response IS 'Athlete response: {rating: 0-10, notes: "..."}';

COMMENT ON COLUMN team_templates.template_type IS 'micro_session (workout), response_override (replace AI answer), checklist';
COMMENT ON COLUMN team_templates.is_default IS 'If true, auto-applies to matching situations';

COMMENT ON VIEW micro_session_analytics IS 'Weekly aggregated completion metrics for micro-sessions';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- =============================================================================
-- AI COACH PHASE 1: MEMBER STATE GATING & COACH INBOX
-- Migration: 077_ai_coach_phase1.sql
-- Purpose: Enhanced safety system with real member-state gating, ACWR swap plans,
--          evidence grade explanations, and real-time coach inbox workflow
-- Created: 2026-01-01
-- =============================================================================

-- =============================================================================
-- 1. DAILY ATHLETE STATE TABLE (Readiness Check)
-- Captures quick daily check-in for pain, fatigue, sleep, motivation
-- =============================================================================

CREATE TABLE IF NOT EXISTS athlete_daily_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    state_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Quick readiness inputs (0-10 scale)
    pain_level INTEGER CHECK (pain_level BETWEEN 0 AND 10),
    fatigue_level INTEGER CHECK (fatigue_level BETWEEN 0 AND 10),
    sleep_quality INTEGER CHECK (sleep_quality BETWEEN 0 AND 10),
    motivation_level INTEGER CHECK (motivation_level BETWEEN 0 AND 10),
    
    -- Computed readiness
    readiness_score DECIMAL(3,2), -- 0-1 composite
    risk_flags TEXT[], -- ['high_pain', 'poor_sleep', 'fatigued']
    
    -- Source tracking
    source VARCHAR(20) DEFAULT 'manual', -- 'manual', 'ai_prompt', 'wearable'
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- One state per user per day
    UNIQUE(user_id, state_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_athlete_daily_state_user_date 
    ON athlete_daily_state(user_id, state_date DESC);
CREATE INDEX IF NOT EXISTS idx_athlete_daily_state_risk 
    ON athlete_daily_state(user_id) 
    WHERE array_length(risk_flags, 1) > 0;

-- =============================================================================
-- 2. COACH INBOX ITEMS TABLE (Workflow Queue)
-- Inbox-style triage for coaches with Safety Alerts, Review Needed, Wins
-- =============================================================================

CREATE TABLE IF NOT EXISTS coach_inbox_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Item classification
    inbox_type VARCHAR(30) NOT NULL CHECK (inbox_type IN (
        'safety_alert',      -- Tier 2/3 + ACWR danger + pain mentions
        'review_needed',     -- Program requests, return-to-play, conflicting
        'win'                -- Completed actions, streaks, positive habits
    )),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Source reference
    source_type VARCHAR(30) NOT NULL, -- 'ai_message', 'ai_recommendation', 'daily_state'
    source_id UUID NOT NULL,
    
    -- Summary for quick scan
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL, -- 3 bullet points max
    
    -- Risk context
    risk_level VARCHAR(10), -- 'low', 'medium', 'high'
    acwr_value DECIMAL(4,2),
    acwr_zone VARCHAR(20),
    intent_type VARCHAR(50),
    
    -- Athlete context snapshot
    athlete_context JSONB DEFAULT '{}', -- {injuries: [...], recent_pain: 7, age_group: 'youth'}
    
    -- Coach workflow
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'viewed', 'approved', 'overridden', 'noted', 'saved_template'
    )),
    coach_action VARCHAR(20), -- 'approve', 'add_note', 'override', 'save_template'
    coach_notes TEXT,
    override_reason TEXT,
    override_alternative TEXT,
    
    -- Timestamps
    viewed_at TIMESTAMPTZ,
    actioned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- For realtime subscriptions
    is_new BOOLEAN DEFAULT TRUE
);

-- Indexes for coach inbox queries
CREATE INDEX IF NOT EXISTS idx_coach_inbox_coach_status 
    ON coach_inbox_items(coach_id, status);
CREATE INDEX IF NOT EXISTS idx_coach_inbox_type 
    ON coach_inbox_items(inbox_type);
CREATE INDEX IF NOT EXISTS idx_coach_inbox_player 
    ON coach_inbox_items(player_id);
CREATE INDEX IF NOT EXISTS idx_coach_inbox_new 
    ON coach_inbox_items(coach_id, is_new) 
    WHERE is_new = TRUE;
CREATE INDEX IF NOT EXISTS idx_coach_inbox_created 
    ON coach_inbox_items(created_at DESC);

-- =============================================================================
-- 3. EXTEND AI_MESSAGES TABLE
-- Add intent classification, user state snapshot, and coach review status
-- =============================================================================

-- Add intent classification column
ALTER TABLE ai_messages ADD COLUMN IF NOT EXISTS intent_type VARCHAR(50);

-- Add user state snapshot for context at time of message
ALTER TABLE ai_messages ADD COLUMN IF NOT EXISTS user_state_snapshot JSONB DEFAULT '{}';

-- Add coach review tracking
ALTER TABLE ai_messages ADD COLUMN IF NOT EXISTS coach_reviewed_at TIMESTAMPTZ;
ALTER TABLE ai_messages ADD COLUMN IF NOT EXISTS coach_reviewed_by UUID REFERENCES auth.users(id);

-- Add evidence grade explanation
ALTER TABLE ai_messages ADD COLUMN IF NOT EXISTS evidence_grade_explanation TEXT;

-- Index for finding messages that need coach review
CREATE INDEX IF NOT EXISTS idx_ai_messages_coach_reviewed 
    ON ai_messages(coach_reviewed_at) 
    WHERE coach_reviewed_at IS NOT NULL;

-- =============================================================================
-- 4. USER AGE GROUPS VIEW
-- Compute age group (youth < 16, adult >= 16) from birth_date
-- =============================================================================

CREATE OR REPLACE VIEW user_age_groups AS
SELECT 
    id as user_id,
    CASE 
        WHEN birth_date IS NULL THEN 'unknown'
        WHEN EXTRACT(YEAR FROM age(birth_date)) < 16 THEN 'youth'
        ELSE 'adult'
    END as age_group,
    EXTRACT(YEAR FROM age(birth_date))::INTEGER as age_years
FROM users;

-- =============================================================================
-- 5. EXTEND KNOWLEDGE BASE FOR RECOVERY ALTERNATIVES
-- Add fields for swap plan responses
-- =============================================================================

-- Add recovery alternative flag
ALTER TABLE knowledge_base_entries 
    ADD COLUMN IF NOT EXISTS is_recovery_alternative BOOLEAN DEFAULT FALSE;

-- Add position relevance array
ALTER TABLE knowledge_base_entries 
    ADD COLUMN IF NOT EXISTS position_relevance TEXT[]; -- ['QB', 'WR', 'ALL']

-- Add intensity level for swap plans
ALTER TABLE knowledge_base_entries 
    ADD COLUMN IF NOT EXISTS intensity_level VARCHAR(20); -- 'rest', 'low', 'moderate'

-- Index for recovery alternatives
CREATE INDEX IF NOT EXISTS idx_kb_recovery 
    ON knowledge_base_entries(is_recovery_alternative) 
    WHERE is_recovery_alternative = TRUE;

-- =============================================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on athlete_daily_state
ALTER TABLE athlete_daily_state ENABLE ROW LEVEL SECURITY;

-- Users can manage their own daily state
CREATE POLICY "Users can manage own daily state"
ON athlete_daily_state FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Coaches can view team member states
CREATE POLICY "Coaches can view team member states"
ON athlete_daily_state FOR SELECT
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

-- Enable RLS on coach_inbox_items
ALTER TABLE coach_inbox_items ENABLE ROW LEVEL SECURITY;

-- Coaches can view their own inbox items
CREATE POLICY "Coaches can view own inbox"
ON coach_inbox_items FOR SELECT
USING (coach_id = auth.uid());

-- Coaches can update their own inbox items
CREATE POLICY "Coaches can update own inbox items"
ON coach_inbox_items FOR UPDATE
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

-- System can insert inbox items (via service role)
CREATE POLICY "System can insert inbox items"
ON coach_inbox_items FOR INSERT
WITH CHECK (TRUE);

-- =============================================================================
-- 7. TRIGGER FOR UPDATED_AT
-- =============================================================================

-- Create trigger for athlete_daily_state updated_at
DROP TRIGGER IF EXISTS update_athlete_daily_state_updated_at ON athlete_daily_state;
CREATE TRIGGER update_athlete_daily_state_updated_at
    BEFORE UPDATE ON athlete_daily_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 8. FUNCTION TO COMPUTE READINESS SCORE
-- Combines pain, fatigue, sleep, motivation into single 0-1 score
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_readiness_score(
    p_pain INTEGER,
    p_fatigue INTEGER,
    p_sleep INTEGER,
    p_motivation INTEGER
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    v_readiness DECIMAL(5,2);
BEGIN
    -- Invert pain and fatigue (lower is better)
    -- Keep sleep and motivation as-is (higher is better)
    -- Weight: pain 30%, fatigue 25%, sleep 25%, motivation 20%
    v_readiness := (
        (10 - COALESCE(p_pain, 5)) * 0.30 +
        (10 - COALESCE(p_fatigue, 5)) * 0.25 +
        COALESCE(p_sleep, 5) * 0.25 +
        COALESCE(p_motivation, 5) * 0.20
    ) / 10.0;
    
    -- Clamp to 0-1 range
    RETURN GREATEST(0, LEAST(1, v_readiness));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- 9. FUNCTION TO COMPUTE RISK FLAGS
-- Returns array of risk flags based on daily state values
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_risk_flags(
    p_pain INTEGER,
    p_fatigue INTEGER,
    p_sleep INTEGER,
    p_motivation INTEGER
) RETURNS TEXT[] AS $$
DECLARE
    v_flags TEXT[] := '{}';
BEGIN
    -- High pain (7+)
    IF COALESCE(p_pain, 0) >= 7 THEN
        v_flags := array_append(v_flags, 'high_pain');
    END IF;
    
    -- High fatigue (7+)
    IF COALESCE(p_fatigue, 0) >= 7 THEN
        v_flags := array_append(v_flags, 'fatigued');
    END IF;
    
    -- Poor sleep (3 or below)
    IF COALESCE(p_sleep, 10) <= 3 THEN
        v_flags := array_append(v_flags, 'poor_sleep');
    END IF;
    
    -- Low motivation (3 or below)
    IF COALESCE(p_motivation, 10) <= 3 THEN
        v_flags := array_append(v_flags, 'low_motivation');
    END IF;
    
    RETURN v_flags;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- 10. TRIGGER TO AUTO-COMPUTE READINESS SCORE AND FLAGS
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_compute_readiness()
RETURNS TRIGGER AS $$
BEGIN
    NEW.readiness_score := compute_readiness_score(
        NEW.pain_level, NEW.fatigue_level, NEW.sleep_quality, NEW.motivation_level
    );
    NEW.risk_flags := compute_risk_flags(
        NEW.pain_level, NEW.fatigue_level, NEW.sleep_quality, NEW.motivation_level
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_athlete_daily_state_compute ON athlete_daily_state;
CREATE TRIGGER trigger_athlete_daily_state_compute
    BEFORE INSERT OR UPDATE ON athlete_daily_state
    FOR EACH ROW
    EXECUTE FUNCTION trigger_compute_readiness();

-- =============================================================================
-- 11. ENABLE REALTIME FOR NEW TABLES
-- =============================================================================

-- Enable realtime for coach inbox (for instant notifications)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE coach_inbox_items;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- Enable realtime for athlete daily state (optional, for coach dashboards)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE athlete_daily_state;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- =============================================================================
-- 12. COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE athlete_daily_state IS 'Daily check-in for athletes: pain, fatigue, sleep, motivation with computed readiness score';
COMMENT ON TABLE coach_inbox_items IS 'Workflow queue for coaches: Safety Alerts, Review Needed, Wins - with real-time updates';

COMMENT ON COLUMN athlete_daily_state.pain_level IS '0-10 scale: 0 = no pain, 10 = severe pain';
COMMENT ON COLUMN athlete_daily_state.fatigue_level IS '0-10 scale: 0 = fully energized, 10 = exhausted';
COMMENT ON COLUMN athlete_daily_state.sleep_quality IS '0-10 scale: 0 = terrible sleep, 10 = excellent sleep';
COMMENT ON COLUMN athlete_daily_state.motivation_level IS '0-10 scale: 0 = no motivation, 10 = highly motivated';
COMMENT ON COLUMN athlete_daily_state.readiness_score IS 'Computed 0-1 score combining all factors (auto-calculated)';
COMMENT ON COLUMN athlete_daily_state.risk_flags IS 'Auto-computed array of risk indicators';

COMMENT ON COLUMN coach_inbox_items.inbox_type IS 'Triage category: safety_alert (urgent), review_needed (action required), win (positive)';
COMMENT ON COLUMN coach_inbox_items.priority IS 'Urgency: low, medium, high, critical';
COMMENT ON COLUMN coach_inbox_items.athlete_context IS 'Snapshot of athlete state at time of item creation';
COMMENT ON COLUMN coach_inbox_items.is_new IS 'For realtime: TRUE until coach has seen the item';

COMMENT ON COLUMN ai_messages.intent_type IS 'Classified intent: plan_request, technique_correction, pain_injury, recovery_readiness, supplement_medical, general';
COMMENT ON COLUMN ai_messages.user_state_snapshot IS 'Athlete state at time of message (ACWR, injuries, pain, age_group)';
COMMENT ON COLUMN ai_messages.coach_reviewed_at IS 'Timestamp when coach reviewed this message';
COMMENT ON COLUMN ai_messages.evidence_grade_explanation IS 'Human-readable explanation of evidence grade';

COMMENT ON COLUMN knowledge_base_entries.is_recovery_alternative IS 'TRUE if this entry can be used in ACWR swap plans';
COMMENT ON COLUMN knowledge_base_entries.position_relevance IS 'Positions this applies to: QB, WR, RB, DB, LB, K, FLEX, ALL';
COMMENT ON COLUMN knowledge_base_entries.intensity_level IS 'Activity intensity: rest, low, moderate';

COMMENT ON VIEW user_age_groups IS 'Computed view: age_group (youth < 16, adult >= 16) from users.birth_date';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- ============================================================================
-- Migration: Decision Ledger System
-- Description: Creates decision ledger tables for decision accountability,
--              review triggers, and confidence scoring
-- Created: 2026-01-08
-- ============================================================================

-- =============================================================================
-- DECISION LEDGER TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS decision_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Athlete context
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Decision details
    decision_type VARCHAR(50) NOT NULL CHECK (decision_type IN (
        'load_adjustment',
        'rtp_clearance',
        'rtp_progression',
        'nutrition_change',
        'hydration_adjustment',
        'mental_protocol',
        'tactical_modification',
        'recovery_intervention',
        'medical_constraint',
        'supplement_change',
        'training_program_assignment',
        'session_modification',
        'readiness_override',
        'acwr_override',
        'other'
    )),
    
    decision_summary TEXT NOT NULL,
    decision_category VARCHAR(50) NOT NULL CHECK (decision_category IN (
        'medical',
        'load',
        'nutrition',
        'psychological',
        'tactical',
        'recovery'
    )),
    
    -- Decision maker
    made_by UUID NOT NULL REFERENCES auth.users(id),
    made_by_role VARCHAR(50) NOT NULL,
    made_by_name TEXT, -- Denormalized for audit trail
    
    -- Decision basis (structured data)
    decision_basis JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Structure: {
    --   "data_points": ["ACWR: 1.45", "Readiness: 62", "Sleep debt: 3h"],
    --   "constraints": ["RTP Phase 2", "No sprinting >80%"],
    --   "rationale": "Elevated ACWR with sleep debt suggests recovery focus",
    --   "confidence": 0.85,
    --   "data_quality": {"completeness": 0.92, "stale_days": 0}
    -- }
    
    -- Review system
    intended_duration INTERVAL,
    review_trigger VARCHAR(100) NOT NULL,
    review_date TIMESTAMPTZ NOT NULL,
    review_priority VARCHAR(20) DEFAULT 'normal' CHECK (review_priority IN (
        'critical',
        'high',
        'normal',
        'low'
    )),
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active',
        'reviewed',
        'superseded',
        'expired',
        'cancelled'
    )),
    
    -- Supersession chain
    superseded_by UUID REFERENCES decision_ledger(id),
    supersedes UUID[], -- Array of decision IDs this supersedes
    
    -- Review tracking
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    review_outcome VARCHAR(50) CHECK (review_outcome IN (
        'maintained',
        'modified',
        'reversed',
        'extended'
    )),
    review_notes TEXT,
    
    -- Outcome tracking (filled after review or decision end)
    outcome_data JSONB DEFAULT '{}'::jsonb,
    -- Structure: {
    --   "athlete_state_before": {...},
    --   "athlete_state_after": {...},
    --   "goal_achieved": true,
    --   "unintended_consequences": [],
    --   "lessons_learned": "..."
    -- }
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT review_date_future CHECK (review_date > created_at),
    CONSTRAINT decision_basis_not_empty CHECK (jsonb_typeof(decision_basis) = 'object')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_decision_ledger_athlete ON decision_ledger(athlete_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_ledger_review ON decision_ledger(review_date, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_decision_ledger_made_by ON decision_ledger(made_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_ledger_team ON decision_ledger(team_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_ledger_type ON decision_ledger(decision_type, status);
CREATE INDEX IF NOT EXISTS idx_decision_ledger_category ON decision_ledger(decision_category, status);
CREATE INDEX IF NOT EXISTS idx_decision_ledger_superseded ON decision_ledger(superseded_by) WHERE superseded_by IS NOT NULL;

-- =============================================================================
-- DECISION REVIEW REMINDERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS decision_review_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES decision_ledger(id) ON DELETE CASCADE,
    
    -- Reminder scheduling
    reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN (
        'review_due',
        'review_overdue',
        'decision_expiring',
        'outcome_check'
    )),
    scheduled_for TIMESTAMPTZ NOT NULL,
    
    -- Notification
    notified_at TIMESTAMPTZ,
    notification_sent BOOLEAN DEFAULT FALSE,
    
    -- Recipients
    notify_user_ids UUID[], -- Specific users to notify
    notify_roles TEXT[], -- Roles to notify
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'sent',
        'acknowledged',
        'dismissed',
        'expired'
    )),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_review_reminders_due ON decision_review_reminders(scheduled_for, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_review_reminders_decision ON decision_review_reminders(decision_id);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE decision_ledger ENABLE ROW LEVEL SECURITY;

-- Staff can view decisions for athletes on their team
DROP POLICY IF EXISTS "Staff can view team decisions" ON decision_ledger;
CREATE POLICY "Staff can view team decisions"
ON decision_ledger FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = (select auth.uid())
        AND tm.team_id = decision_ledger.team_id
        AND tm.role IN (
            'owner', 'admin', 'head_coach', 'coach',
            'physiotherapist', 'nutritionist', 'psychologist',
            'strength_conditioning_coach'
        )
    )
);

-- Decision makers can create decisions
DROP POLICY IF EXISTS "Staff can create decisions" ON decision_ledger;
CREATE POLICY "Staff can create decisions"
ON decision_ledger FOR INSERT
TO authenticated
WITH CHECK (
    made_by = (select auth.uid())
    AND EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = (select auth.uid())
        AND tm.team_id = decision_ledger.team_id
    )
);

-- Consolidated UPDATE policy: Decision makers can update their own decisions (before review)
-- OR Reviewers can update decisions during review
DROP POLICY IF EXISTS "Decision makers can update own decisions" ON decision_ledger;
DROP POLICY IF EXISTS "Reviewers can update decisions" ON decision_ledger;
CREATE POLICY "Staff can update decisions"
ON decision_ledger FOR UPDATE
TO authenticated
USING (
    -- Decision makers can update their own decisions before review
    (
        made_by = (select auth.uid())
        AND status = 'active'
        AND review_date > NOW()
    )
    OR
    -- Reviewers can update decisions during review
    (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.user_id = (select auth.uid())
            AND tm.team_id = decision_ledger.team_id
            AND tm.role IN ('owner', 'admin', 'head_coach', 'coach')
        )
        AND review_date <= NOW()
    )
);

-- RLS for reminders
ALTER TABLE decision_review_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view reminders" ON decision_review_reminders;
CREATE POLICY "Staff can view reminders"
ON decision_review_reminders FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM decision_ledger dl
        JOIN team_members tm ON tm.team_id = dl.team_id
        WHERE dl.id = decision_review_reminders.decision_id
        AND tm.user_id = (select auth.uid())
        AND tm.role IN (
            'owner', 'admin', 'head_coach', 'coach',
            'physiotherapist', 'nutritionist', 'psychologist',
            'strength_conditioning_coach'
        )
    )
);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to calculate review date from trigger
CREATE OR REPLACE FUNCTION calculate_review_date(
    p_trigger VARCHAR(100),
    p_created_at TIMESTAMPTZ,
    p_next_session_date TIMESTAMPTZ DEFAULT NULL,
    p_next_game_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_review_date TIMESTAMPTZ;
    v_parts TEXT[];
    v_base_trigger TEXT;
    v_amount INTEGER;
    v_unit TEXT;
BEGIN
    v_parts := string_to_array(p_trigger, ':');
    v_base_trigger := v_parts[1];
    
    -- Time-based triggers: in_Xh, in_Xd, in_Xw
    IF v_base_trigger LIKE 'in_%' THEN
        -- Extract amount and unit
        v_amount := substring(v_base_trigger from 'in_(\d+)')::INTEGER;
        v_unit := substring(v_base_trigger from 'in_\d+([hdw])');
        
        IF v_unit = 'h' THEN
            v_review_date := p_created_at + (v_amount || ' hours')::INTERVAL;
        ELSIF v_unit = 'd' THEN
            v_review_date := p_created_at + (v_amount || ' days')::INTERVAL;
        ELSIF v_unit = 'w' THEN
            v_review_date := p_created_at + (v_amount || ' weeks')::INTERVAL;
        ELSE
            v_review_date := p_created_at + INTERVAL '7 days'; -- Default
        END IF;
    -- Event-based triggers
    ELSIF v_base_trigger = 'after_next_session' AND p_next_session_date IS NOT NULL THEN
        v_review_date := p_next_session_date + INTERVAL '2 hours';
    ELSIF v_base_trigger = 'after_next_game' AND p_next_game_date IS NOT NULL THEN
        v_review_date := p_next_game_date + INTERVAL '24 hours';
    -- Conditional triggers (set initial check date)
    ELSIF v_base_trigger LIKE 'if_%' THEN
        v_review_date := p_created_at + INTERVAL '24 hours'; -- Check daily
    ELSE
        v_review_date := p_created_at + INTERVAL '7 days'; -- Default
    END IF;
    
    RETURN v_review_date;
END;
$$;

-- Function to calculate review priority
CREATE OR REPLACE FUNCTION calculate_review_priority(
    p_decision_type VARCHAR(50),
    p_decision_category VARCHAR(50),
    p_review_trigger VARCHAR(100),
    p_confidence NUMERIC
)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    -- Critical: Medical decisions, low confidence, short-term triggers
    IF p_decision_category = 'medical' OR
       p_confidence < 0.6 OR
       p_review_trigger LIKE 'in_24h%' OR
       p_review_trigger LIKE 'if_symptoms%' THEN
        RETURN 'critical';
    END IF;
    
    -- High: Load adjustments, RTP progressions, short-term triggers
    IF p_decision_type LIKE '%load%' OR
       p_decision_type LIKE '%rtp%' OR
       p_review_trigger LIKE 'in_72h%' THEN
        RETURN 'high';
    END IF;
    
    -- Normal: Most decisions
    IF p_review_trigger LIKE 'in_7d%' OR
       p_review_trigger LIKE 'after_next%' THEN
        RETURN 'normal';
    END IF;
    
    -- Low: Long-term program changes
    RETURN 'low';
END;
$$;

-- Function to create review reminders
CREATE OR REPLACE FUNCTION create_review_reminders(p_decision_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_decision RECORD;
    v_reminder_24h TIMESTAMPTZ;
    v_reminder_due TIMESTAMPTZ;
    v_reminder_overdue TIMESTAMPTZ;
BEGIN
    SELECT * INTO v_decision
    FROM decision_ledger
    WHERE id = p_decision_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- 24 hours before review
    v_reminder_24h := v_decision.review_date - INTERVAL '24 hours';
    
    -- On review date
    v_reminder_due := v_decision.review_date;
    
    -- 24 hours after review date (overdue)
    v_reminder_overdue := v_decision.review_date + INTERVAL '24 hours';
    
    -- Create reminders
    INSERT INTO decision_review_reminders (
        decision_id,
        reminder_type,
        scheduled_for,
        notify_roles,
        status
    ) VALUES
    (
        p_decision_id,
        'review_due',
        v_reminder_24h,
        ARRAY[v_decision.made_by_role, 'head_coach'],
        'pending'
    ),
    (
        p_decision_id,
        'review_due',
        v_reminder_due,
        ARRAY[v_decision.made_by_role, 'head_coach'],
        'pending'
    ),
    (
        p_decision_id,
        'review_overdue',
        v_reminder_overdue,
        ARRAY['head_coach', 'admin'],
        'pending'
    );
END;
$$;

-- Trigger to create reminders when decision is created
CREATE OR REPLACE FUNCTION decision_ledger_create_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    PERFORM create_review_reminders(NEW.id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_decision_ledger_create_reminders ON decision_ledger;
CREATE TRIGGER trigger_decision_ledger_create_reminders
AFTER INSERT ON decision_ledger
FOR EACH ROW
EXECUTE FUNCTION decision_ledger_create_reminders();

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_decision_ledger_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_decision_ledger_updated_at ON decision_ledger;
CREATE TRIGGER trigger_update_decision_ledger_updated_at
BEFORE UPDATE ON decision_ledger
FOR EACH ROW
EXECUTE FUNCTION update_decision_ledger_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE decision_ledger IS 'Decision accountability ledger - tracks all staff decisions with review triggers and confidence scoring';
COMMENT ON COLUMN decision_ledger.decision_basis IS 'JSONB containing data points, constraints, rationale, confidence, and data quality metrics';
COMMENT ON COLUMN decision_ledger.review_trigger IS 'Trigger type: in_Xh/in_Xd/in_Xw, after_next_session, after_next_game, if_* conditions';
COMMENT ON COLUMN decision_ledger.outcome_data IS 'JSONB containing before/after state, goal achievement, unintended consequences, lessons learned';

COMMENT ON TABLE decision_review_reminders IS 'Automated reminders for decision reviews';
COMMENT ON FUNCTION calculate_review_date IS 'Calculates review date from trigger string and context';
COMMENT ON FUNCTION calculate_review_priority IS 'Calculates review priority based on decision type, category, trigger, and confidence';
COMMENT ON FUNCTION create_review_reminders IS 'Creates review reminders for a decision';


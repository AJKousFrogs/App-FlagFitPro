-- Migration: Fix Decision Ledger Function Search Paths
-- Date: 2026-01-30
-- Purpose: Fix mutable search_path security issue in decision ledger functions

-- ============================================================================
-- FIX FUNCTION SEARCH PATHS
-- ============================================================================

-- Fix calculate_review_date function
CREATE OR REPLACE FUNCTION public.calculate_review_date(
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

-- Fix calculate_review_priority function
CREATE OR REPLACE FUNCTION public.calculate_review_priority(
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

-- Fix create_review_reminders function
CREATE OR REPLACE FUNCTION public.create_review_reminders(p_decision_id UUID)
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

-- Fix decision_ledger_create_reminders function
CREATE OR REPLACE FUNCTION public.decision_ledger_create_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    PERFORM create_review_reminders(NEW.id);
    RETURN NEW;
END;
$$;

-- Fix update_decision_ledger_updated_at function
CREATE OR REPLACE FUNCTION public.update_decision_ledger_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Add comments
COMMENT ON FUNCTION public.calculate_review_date IS 'Calculates review date from trigger string and context. Search path fixed for security.';
COMMENT ON FUNCTION public.calculate_review_priority IS 'Calculates review priority based on decision type, category, trigger, and confidence. Search path fixed for security.';
COMMENT ON FUNCTION public.create_review_reminders IS 'Creates review reminders for a decision. Search path fixed for security.';
COMMENT ON FUNCTION public.decision_ledger_create_reminders IS 'Trigger function to create reminders when decision is created. Search path fixed for security.';
COMMENT ON FUNCTION public.update_decision_ledger_updated_at IS 'Trigger function to update updated_at timestamp. Search path fixed for security.';


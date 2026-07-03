-- Migration: Safety Override System
-- Date: 2026-01-06
-- Purpose: Implement safety triggers that override consent

-- ============================================================================
-- SAFETY OVERRIDE LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS safety_override_log (
    override_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN (
        'pain_above_3',
        'new_pain_area',
        'worsening_pain',
        'acwr_danger_zone',
        'high_rpe_streak',
        'rehab_violation',
        'high_stress_streak'
    )),
    trigger_value JSONB NOT NULL, -- Stores trigger-specific data
    data_disclosed JSONB NOT NULL, -- What data was disclosed
    disclosed_to_roles TEXT[] NOT NULL, -- ['coach', 'physio']
    disclosed_to_user_ids UUID[] NOT NULL, -- Specific user IDs notified
    override_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    athlete_notified BOOLEAN DEFAULT false,
    athlete_notified_at TIMESTAMPTZ
);

CREATE INDEX idx_safety_override_log_athlete ON safety_override_log(athlete_id, override_timestamp DESC);
CREATE INDEX idx_safety_override_log_trigger ON safety_override_log(trigger_type, override_timestamp DESC);

COMMENT ON TABLE safety_override_log IS 'Append-only log of all safety overrides that bypass consent';

-- ============================================================================
-- FUNCTION: Detect Pain >3/10 Trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION detect_pain_trigger(
    p_athlete_id UUID,
    p_pain_score INTEGER,
    p_pain_location TEXT,
    p_pain_trend TEXT DEFAULT NULL
)
RETURNS UUID -- Returns override_id if trigger fired
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_override_id UUID;
    v_previous_pain INTEGER;
    v_previous_location TEXT;
    v_trigger_type TEXT;
BEGIN
    -- Check if pain >3/10
    IF p_pain_score > 3 THEN
        -- Get previous pain report (if wellness_entries has pain_score column)
        BEGIN
            SELECT pain_score, pain_location INTO v_previous_pain, v_previous_location
            FROM wellness_entries
            WHERE athlete_id = p_athlete_id
            AND pain_score IS NOT NULL
            ORDER BY date DESC
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            -- Column may not exist, use NULL
            v_previous_pain := NULL;
        END;
        
        -- Determine trigger type
        IF v_previous_pain IS NULL THEN
            v_trigger_type := 'new_pain_area';
        ELSIF p_pain_trend = 'worse' OR (p_pain_score > v_previous_pain) THEN
            v_trigger_type := 'worsening_pain';
        ELSE
            v_trigger_type := 'pain_above_3';
        END IF;
        
        -- Log override
        INSERT INTO safety_override_log (
            athlete_id,
            trigger_type,
            trigger_value,
            data_disclosed,
            disclosed_to_roles,
            disclosed_to_user_ids
        ) VALUES (
            p_athlete_id,
            v_trigger_type,
            jsonb_build_object(
                'pain_score', p_pain_score,
                'pain_location', p_pain_location,
                'pain_trend', p_pain_trend
            ),
            jsonb_build_object(
                'pain_score', p_pain_score,
                'pain_location', p_pain_location
            ),
            ARRAY['coach', 'physio'],
            -- Get assigned coach and physio IDs
            COALESCE(
                ARRAY(
                    SELECT coach_id FROM coach_athlete_assignments
                    WHERE athlete_id = p_athlete_id
                    UNION
                    SELECT id FROM auth.users
                    WHERE raw_user_meta_data->>'role' IN ('physio', 'medical_staff')
                    AND EXISTS (
                        SELECT 1 FROM coach_athlete_assignments
                        WHERE athlete_id = p_athlete_id
                    )
                ),
                ARRAY[]::UUID[]
            )
        ) RETURNING override_id INTO v_override_id;
        
        RETURN v_override_id;
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- FUNCTION: Detect ACWR Danger Zone
-- ============================================================================
CREATE OR REPLACE FUNCTION detect_acwr_trigger(
    p_athlete_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_override_id UUID;
    v_acwr NUMERIC;
BEGIN
    -- Get latest ACWR
    SELECT acwr INTO v_acwr
    FROM readiness_scores
    WHERE athlete_id = p_athlete_id
    ORDER BY day DESC
    LIMIT 1;
    
    -- Check if ACWR in danger zone
    IF v_acwr IS NOT NULL AND (v_acwr > 1.5 OR v_acwr < 0.8) THEN
        INSERT INTO safety_override_log (
            athlete_id,
            trigger_type,
            trigger_value,
            data_disclosed,
            disclosed_to_roles,
            disclosed_to_user_ids
        ) VALUES (
            p_athlete_id,
            'acwr_danger_zone',
            jsonb_build_object('acwr', v_acwr),
            jsonb_build_object('acwr', v_acwr, 'message', 'ACWR outside safe range'),
            ARRAY['coach', 's&c_staff'],
            COALESCE(
                ARRAY(
                    SELECT coach_id FROM coach_athlete_assignments
                    WHERE athlete_id = p_athlete_id
                ),
                ARRAY[]::UUID[]
            )
        ) RETURNING override_id INTO v_override_id;
        
        RETURN v_override_id;
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- FUNCTION: Check Safety Override Active
-- ============================================================================
CREATE OR REPLACE FUNCTION has_active_safety_override(
    p_athlete_id UUID,
    p_data_type TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if any safety override is active (within last 7 days)
    RETURN EXISTS(
        SELECT 1 FROM safety_override_log
        WHERE athlete_id = p_athlete_id
        AND override_timestamp >= NOW() - INTERVAL '7 days'
        AND (
            p_data_type IS NULL
            OR (
                p_data_type = 'pain' AND trigger_type IN ('pain_above_3', 'new_pain_area', 'worsening_pain')
                OR p_data_type = 'acwr' AND trigger_type = 'acwr_danger_zone'
            )
        )
    );
END;
$$;

-- ============================================================================
-- RLS: Safety override log is append-only
-- ============================================================================
ALTER TABLE safety_override_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Append-only safety override log" ON safety_override_log;
CREATE POLICY "Append-only safety override log"
ON safety_override_log
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can read safety overrides" ON safety_override_log;
CREATE POLICY "Service role can read safety overrides"
ON safety_override_log
FOR SELECT
USING (auth.role() = 'service_role');


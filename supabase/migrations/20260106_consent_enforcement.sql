-- Migration: Consent Enforcement Model
-- Date: 2026-01-06
-- Purpose: Implement Data Consent & Visibility Contract v1

-- ============================================================================
-- CONSENT SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS athlete_consent_settings (
    athlete_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Content sharing settings (default: false = hidden)
    share_readiness_with_coach BOOLEAN DEFAULT false NOT NULL,
    share_wellness_answers_with_coach BOOLEAN DEFAULT false NOT NULL,
    share_training_notes_with_coach BOOLEAN DEFAULT false NOT NULL,
    share_merlin_conversations_with_coach BOOLEAN DEFAULT false NOT NULL,
    share_readiness_with_all_coaches BOOLEAN DEFAULT false NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_athlete_consent_settings_athlete ON athlete_consent_settings(athlete_id);

COMMENT ON TABLE athlete_consent_settings IS 'Athlete consent preferences for data sharing with coaches';
COMMENT ON COLUMN athlete_consent_settings.share_readiness_with_coach IS 'If true, coach can see readinessScore. Default: false (hidden).';
COMMENT ON COLUMN athlete_consent_settings.share_wellness_answers_with_coach IS 'If true, coach can see individual wellness answers. Default: false (hidden).';

-- ============================================================================
-- CONSENT CHANGE AUDIT LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS consent_change_log (
    change_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    setting_name TEXT NOT NULL,
    previous_value BOOLEAN NOT NULL,
    new_value BOOLEAN NOT NULL,
    changed_by UUID NOT NULL REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    reason TEXT
);

CREATE INDEX idx_consent_change_log_athlete ON consent_change_log(athlete_id, changed_at DESC);

COMMENT ON TABLE consent_change_log IS 'Append-only audit log of all consent setting changes';

-- ============================================================================
-- FUNCTION: Get Consent Setting
-- ============================================================================
CREATE OR REPLACE FUNCTION get_athlete_consent(
    p_athlete_id UUID,
    p_setting_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_consent BOOLEAN;
BEGIN
    SELECT CASE p_setting_name
        WHEN 'readiness' THEN share_readiness_with_coach
        WHEN 'wellness' THEN share_wellness_answers_with_coach
        WHEN 'training_notes' THEN share_training_notes_with_coach
        WHEN 'merlin' THEN share_merlin_conversations_with_coach
        WHEN 'readiness_all_coaches' THEN share_readiness_with_all_coaches
        ELSE false
    END INTO v_consent
    FROM athlete_consent_settings
    WHERE athlete_id = p_athlete_id;
    
    -- Default to false if no consent record exists
    RETURN COALESCE(v_consent, false);
END;
$$;

-- ============================================================================
-- RLS POLICY: Athletes can manage own consent
-- ============================================================================
ALTER TABLE athlete_consent_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes can manage own consent" ON athlete_consent_settings;
CREATE POLICY "Athletes can manage own consent"
ON athlete_consent_settings
FOR ALL
USING (athlete_id = auth.uid())
WITH CHECK (athlete_id = auth.uid());

-- ============================================================================
-- RLS POLICY: Consent change log is append-only
-- ============================================================================
ALTER TABLE consent_change_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Append-only consent change log" ON consent_change_log;
CREATE POLICY "Append-only consent change log"
ON consent_change_log
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "No reads on consent change log" ON consent_change_log;
CREATE POLICY "No reads on consent change log"
ON consent_change_log
FOR SELECT
USING (false); -- Only service_role can read via bypass

COMMENT ON POLICY "Append-only consent change log" ON consent_change_log IS 'Consent changes are append-only. No UPDATE or DELETE allowed.';


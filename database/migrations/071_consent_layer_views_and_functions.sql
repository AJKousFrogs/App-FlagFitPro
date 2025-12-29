-- =============================================================================
-- CONSENT LAYER - Migration 071
-- =============================================================================
-- This migration adds consent-aware access enforcement:
-- 1. Helper functions for consent validation
-- 2. Consent-aware views for load monitoring and workout logs
-- 3. AI processing fail-fast function
-- 4. Enhanced RLS policies for coach access with consent checks
-- 5. Consent audit logging table
-- =============================================================================

-- =============================================================================
-- PART 1: CONSENT VALIDATION HELPER FUNCTIONS
-- =============================================================================

-- Function to check if a player has enabled performance sharing for a specific team
CREATE OR REPLACE FUNCTION check_performance_sharing(
    p_player_id UUID,
    p_team_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_sharing_enabled BOOLEAN;
    v_default_sharing BOOLEAN;
BEGIN
    -- First check team-specific settings
    SELECT performance_sharing_enabled INTO v_sharing_enabled
    FROM team_sharing_settings
    WHERE user_id = p_player_id AND team_id = p_team_id;
    
    -- If team-specific setting exists, use it
    IF FOUND THEN
        RETURN COALESCE(v_sharing_enabled, FALSE);
    END IF;
    
    -- Fall back to user's default setting
    SELECT performance_sharing_default INTO v_default_sharing
    FROM privacy_settings
    WHERE user_id = p_player_id;
    
    -- If no settings exist, default to FALSE (privacy-first)
    RETURN COALESCE(v_default_sharing, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- Function to check if a player has enabled health sharing for a specific team
CREATE OR REPLACE FUNCTION check_health_sharing(
    p_player_id UUID,
    p_team_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_sharing_enabled BOOLEAN;
    v_default_sharing BOOLEAN;
BEGIN
    -- First check team-specific settings
    SELECT health_sharing_enabled INTO v_sharing_enabled
    FROM team_sharing_settings
    WHERE user_id = p_player_id AND team_id = p_team_id;
    
    -- If team-specific setting exists, use it
    IF FOUND THEN
        RETURN COALESCE(v_sharing_enabled, FALSE);
    END IF;
    
    -- Fall back to user's default setting
    SELECT health_sharing_default INTO v_default_sharing
    FROM privacy_settings
    WHERE user_id = p_player_id;
    
    -- If no settings exist, default to FALSE (privacy-first)
    RETURN COALESCE(v_default_sharing, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- Function to check if AI processing is enabled for a user
CREATE OR REPLACE FUNCTION check_ai_processing_enabled(
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_ai_enabled BOOLEAN;
BEGIN
    SELECT ai_processing_enabled INTO v_ai_enabled
    FROM privacy_settings
    WHERE user_id = p_user_id;
    
    -- Default to FALSE if no settings exist (privacy-first)
    RETURN COALESCE(v_ai_enabled, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- Function to check allowed metric categories for a team
CREATE OR REPLACE FUNCTION check_metric_category_allowed(
    p_player_id UUID,
    p_team_id UUID,
    p_category TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_allowed_categories TEXT[];
BEGIN
    SELECT allowed_metric_categories INTO v_allowed_categories
    FROM team_sharing_settings
    WHERE user_id = p_player_id AND team_id = p_team_id;
    
    -- If no settings or empty array, nothing is allowed
    IF v_allowed_categories IS NULL OR array_length(v_allowed_categories, 1) IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if category is in allowed list
    RETURN p_category = ANY(v_allowed_categories);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- Function to get teams where current user is coach/admin
CREATE OR REPLACE FUNCTION get_coached_teams()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT team_id 
    FROM team_members 
    WHERE user_id = (SELECT auth.uid())
    AND role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- =============================================================================
-- PART 2: AI PROCESSING FAIL-FAST FUNCTION
-- =============================================================================

-- Function that fails fast if AI processing is disabled
-- Use this in any AI-related queries to ensure consent
CREATE OR REPLACE FUNCTION require_ai_consent(
    p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    IF NOT check_ai_processing_enabled(p_user_id) THEN
        RAISE EXCEPTION 'AI_CONSENT_REQUIRED: User % has not enabled AI processing. Enable AI processing in Privacy Settings to use this feature.', p_user_id
            USING ERRCODE = 'P0001';
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- Function to get AI processing status with explanation
CREATE OR REPLACE FUNCTION get_ai_consent_status(
    p_user_id UUID
) RETURNS TABLE(
    ai_enabled BOOLEAN,
    consent_date TIMESTAMPTZ,
    can_process BOOLEAN,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ps.ai_processing_enabled, FALSE) AS ai_enabled,
        ps.ai_processing_consent_date AS consent_date,
        COALESCE(ps.ai_processing_enabled, FALSE) AS can_process,
        CASE 
            WHEN ps.ai_processing_enabled = TRUE THEN 'AI processing enabled by user consent'
            WHEN ps.ai_processing_enabled = FALSE THEN 'AI processing disabled by user preference'
            WHEN ps.user_id IS NULL THEN 'No privacy settings configured - AI processing disabled by default'
            ELSE 'AI processing status unknown'
        END AS reason
    FROM (SELECT p_user_id AS uid) t
    LEFT JOIN privacy_settings ps ON ps.user_id = t.uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- =============================================================================
-- PART 3: CONSENT-AWARE VIEWS
-- =============================================================================

-- View for load monitoring with consent checks (SECURITY INVOKER)
-- Returns NULL metrics if consent is missing, includes consent_blocked flag
CREATE OR REPLACE VIEW v_load_monitoring_consent 
WITH (security_invoker = true)
AS
SELECT 
    lm.id,
    lm.workout_log_id,
    lm.player_id,
    -- Only show metrics if viewer is the player OR has consent
    CASE 
        WHEN lm.player_id = (SELECT auth.uid()) THEN lm.daily_load
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = lm.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(lm.player_id, coach_tm.team_id)
        ) THEN lm.daily_load
        ELSE NULL
    END AS daily_load,
    CASE 
        WHEN lm.player_id = (SELECT auth.uid()) THEN lm.acute_load
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = lm.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(lm.player_id, coach_tm.team_id)
        ) THEN lm.acute_load
        ELSE NULL
    END AS acute_load,
    CASE 
        WHEN lm.player_id = (SELECT auth.uid()) THEN lm.chronic_load
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = lm.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(lm.player_id, coach_tm.team_id)
        ) THEN lm.chronic_load
        ELSE NULL
    END AS chronic_load,
    CASE 
        WHEN lm.player_id = (SELECT auth.uid()) THEN lm.acwr
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = lm.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(lm.player_id, coach_tm.team_id)
        ) THEN lm.acwr
        ELSE NULL
    END AS acwr,
    -- Health-related fields require health consent
    CASE 
        WHEN lm.player_id = (SELECT auth.uid()) THEN lm.injury_risk_level
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = lm.player_id
            AND player_tm.status = 'active'
            AND check_health_sharing(lm.player_id, coach_tm.team_id)
        ) THEN lm.injury_risk_level
        ELSE NULL
    END AS injury_risk_level,
    lm.calculated_at,
    lm.created_at,
    -- Consent status flags
    CASE 
        WHEN lm.player_id = (SELECT auth.uid()) THEN FALSE
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = lm.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(lm.player_id, coach_tm.team_id)
        ) THEN FALSE
        ELSE TRUE
    END AS consent_blocked,
    CASE 
        WHEN lm.player_id = (SELECT auth.uid()) THEN 'own_data'
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = lm.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(lm.player_id, coach_tm.team_id)
        ) THEN 'team_consent'
        ELSE 'no_consent'
    END AS access_reason
FROM load_monitoring lm;

-- Grant access to the view
GRANT SELECT ON v_load_monitoring_consent TO authenticated;

-- View for workout logs with consent checks (SECURITY INVOKER)
CREATE OR REPLACE VIEW v_workout_logs_consent 
WITH (security_invoker = true)
AS
SELECT 
    wl.id,
    wl.player_id,
    wl.session_id,
    -- Only show details if viewer is the player OR has consent
    CASE 
        WHEN wl.player_id = (SELECT auth.uid()) THEN wl.completed_at
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = wl.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(wl.player_id, coach_tm.team_id)
        ) THEN wl.completed_at
        ELSE NULL
    END AS completed_at,
    CASE 
        WHEN wl.player_id = (SELECT auth.uid()) THEN wl.rpe
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = wl.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(wl.player_id, coach_tm.team_id)
        ) THEN wl.rpe
        ELSE NULL
    END AS rpe,
    CASE 
        WHEN wl.player_id = (SELECT auth.uid()) THEN wl.duration_minutes
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = wl.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(wl.player_id, coach_tm.team_id)
        ) THEN wl.duration_minutes
        ELSE NULL
    END AS duration_minutes,
    CASE 
        WHEN wl.player_id = (SELECT auth.uid()) THEN wl.notes
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = wl.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(wl.player_id, coach_tm.team_id)
        ) THEN wl.notes
        ELSE NULL
    END AS notes,
    wl.created_at,
    wl.updated_at,
    -- Consent status flags
    CASE 
        WHEN wl.player_id = (SELECT auth.uid()) THEN FALSE
        ELSE NOT EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = wl.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(wl.player_id, coach_tm.team_id)
        )
    END AS consent_blocked
FROM workout_logs wl;

-- Grant access to the view
GRANT SELECT ON v_workout_logs_consent TO authenticated;

-- =============================================================================
-- PART 4: ENHANCED RLS POLICIES FOR COACH ACCESS WITH CONSENT
-- =============================================================================

-- Drop existing coach policies on load_monitoring if they exist
DROP POLICY IF EXISTS "Coaches can view team load monitoring with consent" ON load_monitoring;

-- Create consent-aware coach policy for load_monitoring
CREATE POLICY "Coaches can view team load monitoring with consent" 
ON load_monitoring FOR SELECT 
USING (
    -- Player can always see their own data
    player_id = (SELECT auth.uid())
    OR
    -- Coaches can see data only if player has enabled sharing for their team
    EXISTS (
        SELECT 1 
        FROM team_members coach_tm
        JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
        WHERE coach_tm.user_id = (SELECT auth.uid())
        AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
        AND coach_tm.status = 'active'
        AND player_tm.user_id = load_monitoring.player_id
        AND player_tm.status = 'active'
        AND check_performance_sharing(load_monitoring.player_id, coach_tm.team_id)
    )
);

-- Drop existing coach policies on workout_logs if they exist
DROP POLICY IF EXISTS "Coaches can view team workout logs with consent" ON workout_logs;

-- Create consent-aware coach policy for workout_logs
CREATE POLICY "Coaches can view team workout logs with consent" 
ON workout_logs FOR SELECT 
USING (
    -- Player can always see their own data
    player_id = (SELECT auth.uid())
    OR
    -- Coaches can see data only if player has enabled sharing for their team
    EXISTS (
        SELECT 1 
        FROM team_members coach_tm
        JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
        WHERE coach_tm.user_id = (SELECT auth.uid())
        AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
        AND coach_tm.status = 'active'
        AND player_tm.user_id = workout_logs.player_id
        AND player_tm.status = 'active'
        AND check_performance_sharing(workout_logs.player_id, coach_tm.team_id)
    )
);

-- =============================================================================
-- PART 5: CONSENT AUDIT LOGGING
-- =============================================================================

-- Table to log consent-related access attempts (for GDPR Article 30 compliance)
CREATE TABLE IF NOT EXISTS consent_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accessor_user_id UUID NOT NULL,
    target_user_id UUID NOT NULL,
    resource_type TEXT NOT NULL, -- 'load_monitoring', 'workout_logs', etc.
    access_granted BOOLEAN NOT NULL,
    consent_type TEXT, -- 'performance', 'health', 'ai_processing'
    team_id UUID,
    access_reason TEXT,
    accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on consent_access_log
ALTER TABLE consent_access_log ENABLE ROW LEVEL SECURITY;

-- Only system/service role can write to this table
DROP POLICY IF EXISTS "Service role can manage consent logs" ON consent_access_log;
CREATE POLICY "Service role can manage consent logs" 
ON consent_access_log FOR ALL 
USING (FALSE)
WITH CHECK (FALSE);

-- Users can read their own access logs (both as accessor and target)
DROP POLICY IF EXISTS "Users can view their own consent access logs" ON consent_access_log;
CREATE POLICY "Users can view their own consent access logs" 
ON consent_access_log FOR SELECT 
USING (
    accessor_user_id = (SELECT auth.uid())
    OR target_user_id = (SELECT auth.uid())
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_consent_access_log_accessor ON consent_access_log(accessor_user_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_access_log_target ON consent_access_log(target_user_id, accessed_at DESC);

-- =============================================================================
-- PART 6: GRANT PERMISSIONS
-- =============================================================================

-- Grant execute on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION check_performance_sharing(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_health_sharing(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_ai_processing_enabled(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_metric_category_allowed(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_coached_teams() TO authenticated;
GRANT EXECUTE ON FUNCTION require_ai_consent(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_consent_status(UUID) TO authenticated;

-- =============================================================================
-- NOTES
-- =============================================================================
/*
This migration implements consent-aware access enforcement:

1. Helper Functions:
   - check_performance_sharing(player_id, team_id) - Checks if player allows performance data sharing
   - check_health_sharing(player_id, team_id) - Checks if player allows health data sharing
   - check_ai_processing_enabled(user_id) - Checks if user has enabled AI processing
   - check_metric_category_allowed(player_id, team_id, category) - Checks specific metric category access
   - get_coached_teams() - Returns teams where current user is coach

2. AI Fail-Fast:
   - require_ai_consent(user_id) - Raises exception if AI processing is disabled
   - get_ai_consent_status(user_id) - Returns detailed AI consent status

3. Consent-Aware Views:
   - v_load_monitoring_consent - Load monitoring with NULL values if no consent
   - v_workout_logs_consent - Workout logs with NULL values if no consent
   Both views include consent_blocked flag for UI handling

4. Enhanced RLS Policies:
   - Coaches can only view player data if player has enabled sharing for their team
   - Players always have full access to their own data

5. Audit Logging:
   - consent_access_log table for GDPR Article 30 compliance
   - Tracks who accessed what data and whether consent was present

USAGE:
- Use v_load_monitoring_consent instead of load_monitoring for coach dashboards
- Use v_workout_logs_consent instead of workout_logs for coach dashboards
- Call require_ai_consent(user_id) before any AI processing
- Check consent_blocked flag in UI to show appropriate messages
*/


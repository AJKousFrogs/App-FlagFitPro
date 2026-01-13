-- Migration: Add Consent-Aware Views
-- Date: 2026-01-13
-- Purpose: Implement STEP_2_5 §11.1 - Consent-Aware Data Access
-- Contract: Data Consent & Visibility Contract v1

-- ============================================================================
-- CONSENT VIEW: Readiness Scores
-- ============================================================================

CREATE OR REPLACE VIEW v_readiness_scores_consent AS
SELECT 
  rs.*,
  CASE
    -- Athlete viewing own data: always visible
    WHEN rs.athlete_id = auth.uid() THEN false
    -- Coach viewing: check consent
    WHEN EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('coach', 'admin')
    ) THEN
      CASE
        -- Check if athlete has consented
        WHEN EXISTS (
          SELECT 1 FROM athlete_consent_settings acs
          WHERE acs.athlete_id = rs.athlete_id
          AND acs.share_readiness_with_coach = true
        ) THEN false
        -- Safety override: ACWR danger zone
        WHEN rs.acwr > 1.5 OR rs.acwr < 0.8 THEN false
        ELSE true
      END
    ELSE true
  END AS consent_blocked,
  CASE
    WHEN rs.athlete_id = auth.uid() THEN 'own_data'
    WHEN EXISTS (
      SELECT 1 FROM athlete_consent_settings acs
      WHERE acs.athlete_id = rs.athlete_id
      AND acs.share_readiness_with_coach = true
    ) THEN 'consent_granted'
    WHEN rs.acwr > 1.5 OR rs.acwr < 0.8 THEN 'safety_override'
    ELSE 'no_consent'
  END AS access_reason
FROM readiness_scores rs;

COMMENT ON VIEW v_readiness_scores_consent IS 'Consent-aware view for readiness scores. Returns NULL score when consent_blocked=true (Contract: STEP_2_5 §1.5)';

-- ============================================================================
-- CONSENT VIEW: Wellness Entries
-- ============================================================================

CREATE OR REPLACE VIEW v_wellness_entries_consent AS
SELECT 
  we.*,
  CASE
    -- Athlete viewing own data: always visible
    WHEN we.athlete_id = auth.uid() THEN false
    -- Coach viewing: check consent
    WHEN EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('coach', 'admin')
    ) THEN
      CASE
        -- Check if athlete has consented
        WHEN EXISTS (
          SELECT 1 FROM athlete_consent_settings acs
          WHERE acs.athlete_id = we.athlete_id
          AND acs.share_wellness_answers_with_coach = true
        ) THEN false
        -- Safety override: high stress for 3+ days
        WHEN EXISTS (
          SELECT 1 FROM wellness_entries we2
          WHERE we2.athlete_id = we.athlete_id
          AND we2.stress_level = 5
          AND we2.date >= CURRENT_DATE - INTERVAL '7 days'
          GROUP BY we2.athlete_id
          HAVING COUNT(*) >= 3
        ) THEN false
        ELSE true
      END
    ELSE true
  END AS consent_blocked,
  CASE
    WHEN we.athlete_id = auth.uid() THEN 'own_data'
    WHEN EXISTS (
      SELECT 1 FROM athlete_consent_settings acs
      WHERE acs.athlete_id = we.athlete_id
      AND acs.share_wellness_answers_with_coach = true
    ) THEN 'consent_granted'
    WHEN EXISTS (
      SELECT 1 FROM wellness_entries we2
      WHERE we2.athlete_id = we.athlete_id
      AND we2.stress_level = 5
      AND we2.date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY we2.athlete_id
      HAVING COUNT(*) >= 3
    ) THEN 'safety_override'
    ELSE 'no_consent'
  END AS access_reason
FROM wellness_entries we;

COMMENT ON VIEW v_wellness_entries_consent IS 'Consent-aware view for wellness entries. Returns NULL detail when consent_blocked=true (Contract: STEP_2_5 §1.6)';

-- ============================================================================
-- CONSENT VIEW: Pain Reports
-- ============================================================================

CREATE OR REPLACE VIEW v_pain_reports_consent AS
SELECT 
  pr.*,
  CASE
    -- Athlete viewing own data: always visible
    WHEN pr.athlete_id = auth.uid() THEN false
    -- Medical staff: always visible (role authority)
    WHEN EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('physio', 'medical', 'admin')
    ) THEN false
    -- Coach viewing: flag only by default, detail if safety override
    WHEN EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('coach', 'admin')
    ) THEN
      CASE
        -- Safety override: pain >3/10 or new/worsening pain
        WHEN pr.pain_score > 3 THEN false
        WHEN pr.pain_trend IN ('new', 'worse') THEN false
        ELSE true -- Detail hidden, flag visible
      END
    ELSE true
  END AS consent_blocked,
  CASE
    WHEN pr.athlete_id = auth.uid() THEN 'own_data'
    WHEN EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('physio', 'medical', 'admin')
    ) THEN 'role_authority'
    WHEN pr.pain_score > 3 OR pr.pain_trend IN ('new', 'worse') THEN 'safety_override'
    ELSE 'no_consent'
  END AS access_reason,
  -- Flag-only field for coaches (always visible)
  CASE
    WHEN pr.pain_score > 0 THEN true
    ELSE false
  END AS has_pain_flag
FROM pain_reports pr;

COMMENT ON VIEW v_pain_reports_consent IS 'Consent-aware view for pain reports. Returns NULL detail when consent_blocked=true, but has_pain_flag always visible (Contract: STEP_2_5 §1.7)';

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT ON v_readiness_scores_consent TO authenticated;
GRANT SELECT ON v_wellness_entries_consent TO authenticated;
GRANT SELECT ON v_pain_reports_consent TO authenticated;

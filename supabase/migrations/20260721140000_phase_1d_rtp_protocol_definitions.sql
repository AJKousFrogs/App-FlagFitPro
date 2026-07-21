-- Phase 1D: Return-to-Play Protocol Definitions for 20 Injuries (Evidence-Based)
-- Supports injury-specific, criteria-based RTP progressions with periodization
-- Status: Defines protocol structure; data seeding follows in separate migration

-- ============================================================================
-- RTP Protocol Definitions — Injury Library
-- ============================================================================

CREATE TABLE IF NOT EXISTS rtp_protocol_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  injury_type VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(150) NOT NULL,
  evidence_grade VARCHAR(5), -- A1, A2, B1, B2, etc.
  typical_rtp_timeline_days_min INT,
  typical_rtp_timeline_days_max INT,
  rts_rate_percent DECIMAL(5, 2), -- Return-to-sport rate
  description TEXT,
  key_studies JSONB, -- Array of DOI links
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_rtp_protocol_definitions_injury_type
  ON rtp_protocol_definitions(injury_type);

-- ============================================================================
-- RTP Protocol Phases — 5-Mesocycle Structure
-- ============================================================================

CREATE TABLE IF NOT EXISTS rtp_protocol_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES rtp_protocol_definitions(id) ON DELETE CASCADE,
  phase_number INT NOT NULL CHECK (phase_number BETWEEN 1 AND 5),
  phase_name VARCHAR(100),
  week_start INT,
  week_end INT,
  acwr_target_min DECIMAL(3, 2), -- Min ACWR for this phase (e.g., 0.3)
  acwr_target_max DECIMAL(3, 2), -- Max ACWR for this phase (e.g., 0.6)
  description TEXT,
  activities TEXT[], -- Array of recommended activities
  restrictions TEXT[], -- Array of contraindicated activities
  pain_level_max INT DEFAULT 3, -- Max pain allowed (0-10 scale)
  key_milestones TEXT,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE (protocol_id, phase_number)
);

CREATE INDEX idx_rtp_protocol_phases_protocol_id
  ON rtp_protocol_phases(protocol_id);

-- ============================================================================
-- Functional Criteria for RTP Clearance — Per Injury
-- ============================================================================

CREATE TABLE IF NOT EXISTS rtp_functional_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES rtp_protocol_definitions(id) ON DELETE CASCADE,
  criteria_name VARCHAR(150), -- e.g., "Strength LSI", "Hop Test Symmetry"
  criteria_type VARCHAR(50), -- "strength", "functional_test", "psychological", "pain", "range_of_motion"
  target_value VARCHAR(100), -- e.g., "≥90%", "≥90% LSI", "ACL-RSI ≥56"
  measurement_method TEXT,
  pass_threshold VARCHAR(50),
  phase_required INT DEFAULT 5, -- Can be cleared when reaching this phase
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_rtp_functional_criteria_protocol_id
  ON rtp_functional_criteria(protocol_id);

-- ============================================================================
-- Athlete Injury → Protocol Mapping
-- ============================================================================

CREATE TABLE IF NOT EXISTS rtp_athlete_protocol_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  injury_id UUID NOT NULL REFERENCES athlete_injuries(id) ON DELETE CASCADE,
  protocol_id UUID NOT NULL REFERENCES rtp_protocol_definitions(id) ON DELETE RESTRICT,
  current_phase INT DEFAULT 1 CHECK (current_phase BETWEEN 1 AND 5),
  phase_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  estimated_return_date DATE, -- Calculated based on protocol timeline + current phase
  individual_modifiers JSONB, -- { age_modifier: 1.2, prior_injuries: false, ... }
  biological_maturity_gate_passed BOOLEAN DEFAULT false, -- Minimum biological window respected
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE (athlete_id, injury_id)
);

CREATE INDEX idx_rtp_athlete_protocol_athlete_id
  ON rtp_athlete_protocol_assignments(athlete_id);
CREATE INDEX idx_rtp_athlete_protocol_injury_id
  ON rtp_athlete_protocol_assignments(injury_id);
CREATE INDEX idx_rtp_athlete_protocol_current_phase
  ON rtp_athlete_protocol_assignments(current_phase);

-- ============================================================================
-- Functional Assessment Tracking — Criteria Completion
-- ============================================================================

CREATE TABLE IF NOT EXISTS rtp_criteria_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES rtp_athlete_protocol_assignments(id) ON DELETE CASCADE,
  criteria_id UUID NOT NULL REFERENCES rtp_functional_criteria(id) ON DELETE CASCADE,
  assessed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assessed_value VARCHAR(100), -- e.g., "92%", "passed", "ACL-RSI 58"
  pass_fail BOOLEAN,
  notes TEXT,
  assessed_by_staff_id UUID REFERENCES auth.users(id), -- Physio or clinician
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_rtp_criteria_assessments_assignment_id
  ON rtp_criteria_assessments(assignment_id);
CREATE INDEX idx_rtp_criteria_assessments_criteria_id
  ON rtp_criteria_assessments(criteria_id);
CREATE INDEX idx_rtp_criteria_assessments_assessed_date
  ON rtp_criteria_assessments(assessed_date DESC);

-- ============================================================================
-- Row-Level Security (RLS)
-- ============================================================================

ALTER TABLE rtp_protocol_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rtp_protocol_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE rtp_functional_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE rtp_athlete_protocol_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rtp_criteria_assessments ENABLE ROW LEVEL SECURITY;

-- Protocol definitions: public read (lookup tables)
CREATE POLICY rtp_protocol_definitions_read ON rtp_protocol_definitions
  FOR SELECT USING (true);

CREATE POLICY rtp_protocol_phases_read ON rtp_protocol_phases
  FOR SELECT USING (true);

CREATE POLICY rtp_functional_criteria_read ON rtp_functional_criteria
  FOR SELECT USING (true);

-- Athlete protocol assignments: athletes read own, staff read team
CREATE POLICY rtp_athlete_protocol_self_read ON rtp_athlete_protocol_assignments
  FOR SELECT USING (athlete_id = auth.uid());

CREATE POLICY rtp_athlete_protocol_staff_read ON rtp_athlete_protocol_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('physiotherapist', 'coach', 'head_coach', 'strength_coach')
        AND tm.team_id IN (
          SELECT team_id FROM team_members
          WHERE user_id = rtp_athlete_protocol_assignments.athlete_id
            AND status = 'active'
        )
    )
  );

CREATE POLICY rtp_athlete_protocol_staff_write ON rtp_athlete_protocol_assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('physiotherapist', 'head_coach')
    )
  );

-- Criteria assessments: athletes read own, staff read team's
CREATE POLICY rtp_criteria_assessments_self_read ON rtp_criteria_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rtp_athlete_protocol_assignments
      WHERE id = rtp_criteria_assessments.assignment_id
        AND athlete_id = auth.uid()
    )
  );

CREATE POLICY rtp_criteria_assessments_staff_read ON rtp_criteria_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rtp_athlete_protocol_assignments rtp
      INNER JOIN team_members tm ON (
        tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('physiotherapist', 'coach', 'head_coach', 'strength_coach')
      )
      WHERE rtp.id = rtp_criteria_assessments.assignment_id
        AND rtp.athlete_id IN (
          SELECT user_id FROM team_members
          WHERE team_id = tm.team_id AND status = 'active'
        )
    )
  );

CREATE POLICY rtp_criteria_assessments_staff_write ON rtp_criteria_assessments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('physiotherapist', 'strength_coach')
    )
  );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Calculate estimated return date based on protocol timeline and current phase
CREATE OR REPLACE FUNCTION calculate_estimated_rtp_date(
  p_protocol_id UUID,
  p_current_phase INT
)
RETURNS DATE AS $$
DECLARE
  v_timeline_days INT;
  v_protocol record;
BEGIN
  SELECT typical_rtp_timeline_days_min INTO v_protocol
  FROM rtp_protocol_definitions
  WHERE id = p_protocol_id;

  IF v_protocol IS NULL THEN
    RETURN NULL;
  END IF;

  -- Estimate: phase completion = (current_phase / 5) * total_timeline
  v_timeline_days := (p_current_phase * v_protocol.typical_rtp_timeline_days_min) / 5;
  RETURN CURRENT_DATE + v_timeline_days;
END;
$$ LANGUAGE plpgsql;

-- Check if athlete meets phase criteria (all required functional tests passed)
CREATE OR REPLACE FUNCTION athlete_phase_criteria_met(
  p_assignment_id UUID,
  p_phase INT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_total_criteria INT;
  v_passed_criteria INT;
BEGIN
  -- Count functional criteria required for this phase
  SELECT COUNT(*) INTO v_total_criteria
  FROM rtp_functional_criteria rfc
  INNER JOIN rtp_athlete_protocol_assignments rapa ON rapa.protocol_id = rfc.protocol_id
  WHERE rapa.id = p_assignment_id
    AND rfc.phase_required <= p_phase;

  IF v_total_criteria = 0 THEN
    RETURN true; -- No criteria required
  END IF;

  -- Count passed assessments (most recent per criteria)
  SELECT COUNT(*) INTO v_passed_criteria
  FROM (
    SELECT DISTINCT ON (criteria_id) criteria_id
    FROM rtp_criteria_assessments rca
    WHERE rca.assignment_id = p_assignment_id
      AND rca.pass_fail = true
    ORDER BY criteria_id, assessed_date DESC
  ) AS passed;

  RETURN v_passed_criteria >= v_total_criteria;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments (Documentation)
-- ============================================================================

COMMENT ON TABLE rtp_protocol_definitions IS
  'Centralized injury protocol library (20 common sports injuries).
   Defines evidence-grade, typical timelines, RTS rates, and structure for injury-specific RTP.
   Every protocol follows 5-mesocycle periodization with ACWR targets per phase.';

COMMENT ON TABLE rtp_protocol_phases IS
  'Per-injury phase definition (Phases 1–5).
   Specifies ACWR targets, recommended activities, contraindications, and key milestones.
   ACWR drops dramatically during rehab (0.3–0.6 early phases; 0.9–1.3 late phases).';

COMMENT ON TABLE rtp_functional_criteria IS
  'Injury-specific functional criteria for phase advancement (strength, hop tests, psychology, etc.).
   Criteria-based RTP replaces time-based: "3 months post-injury" → "90% strength + 90% hop tests + ACL-RSI ≥56".';

COMMENT ON TABLE rtp_athlete_protocol_assignments IS
  'Links athlete injuries to protocols. Tracks current phase, individual modifiers, and biological maturity gates.
   Key insight: functional recovery (strength/ROM ≥80% LSI) precedes biological healing.
   Premature RTP = 25% re-injury rate. Minimum biological window must be respected.';

COMMENT ON TABLE rtp_criteria_assessments IS
  'Audit trail of functional criterion assessments (who, when, result).
   Tracks progression: "2026-07-21 Strength 85% LSI (pass)" → "2026-07-28 Strength 92% LSI (pass)" → phase advancement eligible.';

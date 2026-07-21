-- Phase 1D: Auto-assign RTP protocol when athlete injury is created
-- Trigger: When a new athlete_injury is recorded, automatically create an rtp_athlete_protocol_assignment
-- This enables seamless workflow: coach records injury → protocol auto-assigned → physio logs criteria

-- Function to auto-assign RTP protocol on injury creation
CREATE OR REPLACE FUNCTION auto_assign_rtp_protocol_on_injury()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_protocol_id UUID;
  v_injury_type VARCHAR;
  v_estimated_rtp_days INT;
BEGIN
  -- Get injury details from athlete_injuries
  SELECT injury_type INTO v_injury_type
  FROM athlete_injuries
  WHERE id = NEW.injury_id;

  IF v_injury_type IS NULL THEN
    RAISE EXCEPTION 'Injury type not found for injury_id: %', NEW.injury_id;
  END IF;

  -- Find matching RTP protocol definition by injury_type
  SELECT id, typical_rtp_timeline_days_max INTO v_protocol_id, v_estimated_rtp_days
  FROM rtp_protocol_definitions
  WHERE LOWER(injury_type) = LOWER(v_injury_type)
  LIMIT 1;

  -- If no exact match, skip auto-assignment (physio will manually assign)
  IF v_protocol_id IS NULL THEN
    -- Log that auto-assignment was not possible for this injury type
    -- In production, consider logging to a system log table or raising a notification
    RETURN NEW;
  END IF;

  -- Create RTP protocol assignment
  INSERT INTO rtp_athlete_protocol_assignments (
    athlete_id,
    injury_id,
    protocol_id,
    current_phase,
    phase_start_date,
    estimated_return_date,
    individual_modifiers,
    biological_maturity_gate_passed,
    created_at,
    updated_at
  ) VALUES (
    NEW.athlete_id,
    NEW.injury_id,
    v_protocol_id,
    1,  -- Start at Phase 1
    CURRENT_DATE,  -- Phase 1 starts today
    CURRENT_DATE + (v_estimated_rtp_days || ' days')::INTERVAL,  -- Estimated return from protocol timeline
    '{}',  -- Empty modifiers (physio can add later)
    TRUE,  -- Assume biological maturity gate passed (can be overridden)
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists (safe for idempotent migration)
DROP TRIGGER IF EXISTS auto_assign_rtp_on_injury_create ON athlete_injuries;

-- Create trigger on athlete_injuries INSERT
CREATE TRIGGER auto_assign_rtp_on_injury_create
AFTER INSERT ON athlete_injuries
FOR EACH ROW
EXECUTE FUNCTION auto_assign_rtp_protocol_on_injury();

-- Comment for documentation
COMMENT ON FUNCTION auto_assign_rtp_protocol_on_injury IS
  'Auto-assign RTP protocol when athlete suffers injury. Matches injury_type to protocol definition and creates initial assignment in Phase 1.';

COMMENT ON TRIGGER auto_assign_rtp_on_injury_create ON athlete_injuries IS
  'Trigger that fires after injury is recorded, automatically creating RTP protocol assignment for seamless workflow.';

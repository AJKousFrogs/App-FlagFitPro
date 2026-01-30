-- ============================================================================
-- Migration 104: Add Coach Alert Fields to Daily Protocols
-- ============================================================================
-- Adds coach alert and acknowledgment fields to daily_protocols table
-- Supports TODAY screen coach alert gating and acknowledgment workflow
-- ============================================================================

-- Add coach alert fields
DO $$ BEGIN
  -- Coach alert active flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_protocols' 
    AND column_name = 'coach_alert_active'
  ) THEN
    ALTER TABLE daily_protocols
    ADD COLUMN coach_alert_active BOOLEAN DEFAULT false NOT NULL;
  END IF;

  -- Coach alert message
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_protocols' 
    AND column_name = 'coach_alert_message'
  ) THEN
    ALTER TABLE daily_protocols
    ADD COLUMN coach_alert_message TEXT;
  END IF;

  -- Coach alert requires acknowledgment
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_protocols' 
    AND column_name = 'coach_alert_requires_acknowledgment'
  ) THEN
    ALTER TABLE daily_protocols
    ADD COLUMN coach_alert_requires_acknowledgment BOOLEAN DEFAULT false NOT NULL;
  END IF;

  -- Coach acknowledged flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_protocols' 
    AND column_name = 'coach_acknowledged'
  ) THEN
    ALTER TABLE daily_protocols
    ADD COLUMN coach_acknowledged BOOLEAN DEFAULT false NOT NULL;
  END IF;

  -- Coach acknowledged timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_protocols' 
    AND column_name = 'coach_acknowledged_at'
  ) THEN
    ALTER TABLE daily_protocols
    ADD COLUMN coach_acknowledged_at TIMESTAMPTZ;
  END IF;

  -- Modified by coach ID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_protocols' 
    AND column_name = 'modified_by_coach_id'
  ) THEN
    ALTER TABLE daily_protocols
    ADD COLUMN modified_by_coach_id UUID REFERENCES auth.users(id);
  END IF;

  -- Modified by coach name (denormalized for performance)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_protocols' 
    AND column_name = 'modified_by_coach_name'
  ) THEN
    ALTER TABLE daily_protocols
    ADD COLUMN modified_by_coach_name VARCHAR(255);
  END IF;

  -- Modified at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_protocols' 
    AND column_name = 'modified_at'
  ) THEN
    ALTER TABLE daily_protocols
    ADD COLUMN modified_at TIMESTAMPTZ;
  END IF;

  -- Coach note
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_protocols' 
    AND column_name = 'coach_note'
  ) THEN
    ALTER TABLE daily_protocols
    ADD COLUMN coach_note TEXT;
  END IF;

  -- Coach note priority
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_protocols' 
    AND column_name = 'coach_note_priority'
  ) THEN
    ALTER TABLE daily_protocols
    ADD COLUMN coach_note_priority VARCHAR(20) DEFAULT 'info' 
    CHECK (coach_note_priority IN ('info', 'attention', 'urgent'));
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_protocols_coach_alert_active 
  ON daily_protocols(user_id, protocol_date) 
  WHERE coach_alert_active = true;

CREATE INDEX IF NOT EXISTS idx_daily_protocols_coach_acknowledged 
  ON daily_protocols(user_id, protocol_date) 
  WHERE coach_acknowledged = false AND coach_alert_requires_acknowledgment = true;

CREATE INDEX IF NOT EXISTS idx_daily_protocols_modified_by_coach 
  ON daily_protocols(modified_by_coach_id) 
  WHERE modified_by_coach_id IS NOT NULL;

-- ============================================================================
-- Coach Alert Acknowledgments Audit Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS coach_alert_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES daily_protocols(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protocol_date DATE NOT NULL,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(protocol_id, user_id)
);

-- Indexes for coach_alert_acknowledgments
CREATE INDEX IF NOT EXISTS idx_coach_alert_ack_protocol 
  ON coach_alert_acknowledgments(protocol_id);

CREATE INDEX IF NOT EXISTS idx_coach_alert_ack_user 
  ON coach_alert_acknowledgments(user_id, acknowledged_at DESC);

CREATE INDEX IF NOT EXISTS idx_coach_alert_ack_date 
  ON coach_alert_acknowledgments(protocol_date);

-- RLS for coach_alert_acknowledgments
ALTER TABLE coach_alert_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_alert_acknowledgments_own" ON coach_alert_acknowledgments
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "coach_alert_acknowledgments_coach_read" ON coach_alert_acknowledgments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_protocols dp
      JOIN team_members tm ON tm.user_id = dp.user_id
      JOIN team_members coach ON coach.team_id = tm.team_id
      WHERE dp.id = coach_alert_acknowledgments.protocol_id
      AND coach.user_id = auth.uid()
      AND coach.role IN ('coach', 'head_coach', 'owner')
    )
  );

-- Comments
COMMENT ON COLUMN daily_protocols.coach_alert_active IS 'Whether a coach alert is active for this protocol';
COMMENT ON COLUMN daily_protocols.coach_alert_message IS 'Message from coach displayed to athlete';
COMMENT ON COLUMN daily_protocols.coach_alert_requires_acknowledgment IS 'Whether athlete must acknowledge before training';
COMMENT ON COLUMN daily_protocols.coach_acknowledged IS 'Whether athlete has acknowledged the coach alert';
COMMENT ON COLUMN daily_protocols.coach_acknowledged_at IS 'Timestamp when athlete acknowledged';
COMMENT ON COLUMN daily_protocols.modified_by_coach_id IS 'Coach who modified this protocol';
COMMENT ON COLUMN daily_protocols.modified_by_coach_name IS 'Denormalized coach name for display';
COMMENT ON COLUMN daily_protocols.modified_at IS 'When coach modified this protocol';
COMMENT ON COLUMN daily_protocols.coach_note IS 'Coach note content (verbatim)';
COMMENT ON COLUMN daily_protocols.coach_note_priority IS 'Priority level: info, attention, urgent';

COMMENT ON TABLE coach_alert_acknowledgments IS 'Audit log of coach alert acknowledgments';


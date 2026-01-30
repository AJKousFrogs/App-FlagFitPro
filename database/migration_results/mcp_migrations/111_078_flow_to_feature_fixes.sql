-- Migration: Flow-to-Feature Fixes
-- Date: 2026-01-XX
-- Purpose: Create tables for data confidence, missing data detection, overrides, recovery protocols, load caps, and ownership transitions

-- ============================================================================
-- 1. COACH OVERRIDES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS coach_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  override_type VARCHAR(50) NOT NULL CHECK (override_type IN (
    'training_load',
    'session_modification',
    'acwr_override',
    'recovery_protocol',
    'other'
  )),
  ai_recommendation JSONB NOT NULL,
  coach_decision JSONB NOT NULL,
  reason TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coach_overrides_player ON coach_overrides(player_id, created_at DESC);
CREATE INDEX idx_coach_overrides_coach ON coach_overrides(coach_id, created_at DESC);
CREATE INDEX idx_coach_overrides_type ON coach_overrides(override_type, created_at DESC);

COMMENT ON TABLE coach_overrides IS 'Logs all coach overrides of AI recommendations for transparency';
COMMENT ON COLUMN coach_overrides.ai_recommendation IS 'What the AI recommended (JSONB)';
COMMENT ON COLUMN coach_overrides.coach_decision IS 'What the coach actually set (JSONB)';
COMMENT ON COLUMN coach_overrides.context IS 'Context at time of override (ACWR, wellness, etc.)';

-- ============================================================================
-- 2. RECOVERY PROTOCOLS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS recovery_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protocol_type VARCHAR(50) NOT NULL CHECK (protocol_type IN (
    'game_day_recovery',
    'travel_recovery',
    'injury_recovery',
    'wellness_recovery'
  )),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_load_percent INTEGER CHECK (max_load_percent BETWEEN 0 AND 100),
  restrictions TEXT[] DEFAULT '{}',
  focus VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recovery_protocols_player ON recovery_protocols(player_id, start_date DESC);
CREATE INDEX idx_recovery_protocols_active ON recovery_protocols(player_id, protocol_type) 
  WHERE end_date >= CURRENT_DATE;

COMMENT ON TABLE recovery_protocols IS 'Tracks active recovery protocols (game day, travel, etc.)';

-- ============================================================================
-- 3. RECOVERY BLOCKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS recovery_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_date DATE NOT NULL,
  max_load_percent INTEGER CHECK (max_load_percent BETWEEN 0 AND 100),
  focus VARCHAR(100),
  restrictions TEXT[] DEFAULT '{}',
  protocol_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (player_id, block_date, protocol_type)
);

CREATE INDEX idx_recovery_blocks_player_date ON recovery_blocks(player_id, block_date DESC);
CREATE INDEX idx_recovery_blocks_active ON recovery_blocks(player_id, block_date) 
  WHERE block_date >= CURRENT_DATE;

COMMENT ON TABLE recovery_blocks IS 'Individual recovery blocks for specific days';

-- ============================================================================
-- 4. LOAD CAPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS load_caps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_load_percent INTEGER NOT NULL CHECK (max_load_percent BETWEEN 0 AND 100),
  sessions_remaining INTEGER NOT NULL DEFAULT 3,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'overridden')),
  override_reason TEXT,
  overridden_by UUID REFERENCES auth.users(id),
  overridden_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_load_caps_player_active ON load_caps(player_id, status) WHERE status = 'active';
CREATE INDEX idx_load_caps_active ON load_caps(status, created_at DESC) WHERE status = 'active';

COMMENT ON TABLE load_caps IS 'Automatic load caps triggered by ACWR spikes or other safety concerns';
COMMENT ON COLUMN load_caps.sessions_remaining IS 'Number of sessions remaining before cap is removed';

-- ============================================================================
-- 5. OWNERSHIP TRANSITIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ownership_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger VARCHAR(100) NOT NULL, -- 'wellness_low', 'acwr_critical', 'injury_flag', etc.
  from_role VARCHAR(50) NOT NULL,
  to_role VARCHAR(50) NOT NULL,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_required TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ownership_transitions_player ON ownership_transitions(player_id, created_at DESC);
CREATE INDEX idx_ownership_transitions_status ON ownership_transitions(status, created_at DESC);
CREATE INDEX idx_ownership_transitions_to_role ON ownership_transitions(to_role, status) 
  WHERE status IN ('pending', 'in_progress', 'overdue');

COMMENT ON TABLE ownership_transitions IS 'Audit trail for ownership transitions (Player → Coach → Physio, etc.)';
COMMENT ON COLUMN ownership_transitions.trigger IS 'What caused the transition (wellness_low, acwr_critical, etc.)';
COMMENT ON COLUMN ownership_transitions.action_required IS 'What the new owner must do';

-- ============================================================================
-- 6. TRAINING SESSION LOG STATUS FIELDS
-- ============================================================================
ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS log_status VARCHAR(20) DEFAULT 'on_time' 
CHECK (log_status IN ('on_time', 'late', 'retroactive'));

ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS requires_coach_approval BOOLEAN DEFAULT false;

ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS hours_delayed INTEGER;

ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS conflicts JSONB DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_training_sessions_log_status ON training_sessions(log_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_sessions_conflicts ON training_sessions 
USING GIN (conflicts) WHERE jsonb_array_length(conflicts) > 0;

COMMENT ON COLUMN training_sessions.log_status IS 'Whether session was logged on time, late, or retroactively';
COMMENT ON COLUMN training_sessions.conflicts IS 'Array of detected conflicts (e.g., RPE vs session type)';

-- ============================================================================
-- 7. FUNCTION: Auto-detect overdue transitions
-- ============================================================================
CREATE OR REPLACE FUNCTION check_overdue_transitions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ownership_transitions
  SET status = 'overdue',
      updated_at = NOW()
  WHERE status = 'pending'
    AND trigger IN ('acwr_critical', 'injury_flag')
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Schedule this function to run hourly (requires pg_cron extension)
-- SELECT cron.schedule('check-overdue-transitions', '0 * * * *', 'SELECT check_overdue_transitions()');

COMMENT ON FUNCTION check_overdue_transitions() IS 'Marks critical transitions as overdue after 24 hours';

-- ============================================================================
-- 8. SHARED INSIGHTS TABLE (Multi-Role Collaboration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS shared_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN (
    'physio_note',
    'nutrition_compliance',
    'psychology_flag',
    'coach_note'
  )),
  from_role VARCHAR(50) NOT NULL CHECK (from_role IN (
    'physiotherapist',
    'nutritionist',
    'psychologist',
    'coach',
    'system'
  )),
  to_roles TEXT[] NOT NULL DEFAULT '{}', -- Array of roles that can view
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_name VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shared_insights_player ON shared_insights(player_id, created_at DESC);
CREATE INDEX idx_shared_insights_team ON shared_insights(team_id, created_at DESC);
CREATE INDEX idx_shared_insights_type ON shared_insights(insight_type, created_at DESC);
CREATE INDEX idx_shared_insights_status ON shared_insights(status, created_at DESC) WHERE status = 'active';
CREATE INDEX idx_shared_insights_to_roles ON shared_insights USING GIN (to_roles);

COMMENT ON TABLE shared_insights IS 'Role-filtered feed of professional insights for multi-role collaboration';
COMMENT ON COLUMN shared_insights.to_roles IS 'Array of roles that can view this insight (e.g., ["coach", "player"])';
COMMENT ON COLUMN shared_insights.metadata IS 'Additional context (e.g., injury details, compliance scores)';


-- Migration: AI Safety Tier System
-- Based on: AI_COACHING_SYSTEM_REVAMP.md
-- Creates tables for AI chat sessions, messages, recommendations, feedback, and coach visibility

-- =====================================================
-- AI CHAT SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  context_snapshot JSONB DEFAULT '{}',
  goal VARCHAR(500),
  time_horizon VARCHAR(50) CHECK (time_horizon IN ('immediate', 'weekly', 'monthly', 'seasonal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user ON ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_team ON ai_chat_sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_started ON ai_chat_sessions(started_at DESC);

-- =====================================================
-- AI MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
  intent VARCHAR(50),
  citations JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_session ON ai_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user ON ai_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_risk ON ai_messages(risk_level);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created ON ai_messages(created_at DESC);

-- =====================================================
-- AI RECOMMENDATIONS TABLE
-- Tracks actionable recommendations from AI
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE SET NULL,
  message_id UUID REFERENCES ai_messages(id) ON DELETE SET NULL,
  recommendation_type VARCHAR(50) NOT NULL CHECK (
    recommendation_type IN (
      'create_session', 
      'modify_plan', 
      'add_exercise', 
      'read_article', 
      'ask_coach',
      'schedule_recovery',
      'reduce_load',
      'increase_load'
    )
  ),
  reason TEXT NOT NULL,
  recommendation_data JSONB DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'rejected', 'completed', 'expired')
  ),
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user ON ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_session ON ai_recommendations(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_type ON ai_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_created ON ai_recommendations(created_at DESC);

-- =====================================================
-- AI FEEDBACK TABLE
-- User feedback on AI responses
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE SET NULL,
  message_id UUID REFERENCES ai_messages(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type VARCHAR(50) NOT NULL CHECK (
    feedback_type IN (
      'thumbs_up', 
      'thumbs_down', 
      'helpful', 
      'not_helpful', 
      'incorrect', 
      'unsafe',
      'too_generic',
      'too_specific'
    )
  ),
  feedback_reason TEXT,
  outcome TEXT,
  flagged_for_review BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_message ON ai_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON ai_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_flagged ON ai_feedback(flagged_for_review) WHERE flagged_for_review = TRUE;

-- =====================================================
-- AI COACH VISIBILITY TABLE
-- Coach visibility into player AI interactions
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_coach_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID REFERENCES ai_recommendations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES ai_messages(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  visibility_type VARCHAR(50) NOT NULL CHECK (
    visibility_type IN ('risk_warning', 'recommendation', 'override', 'note')
  ),
  coach_notes TEXT,
  override_reason TEXT,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_coach_visibility_coach ON ai_coach_visibility(coach_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_visibility_player ON ai_coach_visibility(player_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_visibility_team ON ai_coach_visibility(team_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_visibility_type ON ai_coach_visibility(visibility_type);

-- =====================================================
-- KNOWLEDGE BASE TABLE (Create if not exists)
-- This table stores curated knowledge for AI responses
-- =====================================================
CREATE TABLE IF NOT EXISTS knowledge_base_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  source_type VARCHAR(50) CHECK (source_type IN ('curated', 'trusted', 'web', 'internal')),
  source_url TEXT,
  source_title VARCHAR(500),
  publication_date DATE,
  evidence_grade VARCHAR(10) CHECK (evidence_grade IN ('A', 'B', 'C', 'D')),
  risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')) DEFAULT 'low',
  requires_professional BOOLEAN DEFAULT FALSE,
  requires_labs BOOLEAN DEFAULT FALSE,
  source_quality_score DECIMAL(3,2) CHECK (source_quality_score >= 0 AND source_quality_score <= 1) DEFAULT 0.5,
  query_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base_entries(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_risk_level ON knowledge_base_entries(risk_level);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_evidence ON knowledge_base_entries(evidence_grade);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_active ON knowledge_base_entries(is_active) WHERE is_active = TRUE;

-- Enable RLS on knowledge_base_entries
ALTER TABLE knowledge_base_entries ENABLE ROW LEVEL SECURITY;

-- Everyone can read knowledge base entries
CREATE POLICY "Anyone can read knowledge base"
  ON knowledge_base_entries FOR SELECT
  USING (is_active = TRUE);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach_visibility ENABLE ROW LEVEL SECURITY;

-- AI Chat Sessions: Users can see their own sessions
CREATE POLICY "Users can view own chat sessions"
  ON ai_chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions"
  ON ai_chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON ai_chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- AI Messages: Users can see their own messages
CREATE POLICY "Users can view own messages"
  ON ai_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own messages"
  ON ai_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- AI Recommendations: Users can see and update their own recommendations
CREATE POLICY "Users can view own recommendations"
  ON ai_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recommendations"
  ON ai_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON ai_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

-- AI Feedback: Users can manage their own feedback
CREATE POLICY "Users can view own feedback"
  ON ai_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own feedback"
  ON ai_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- AI Coach Visibility: Coaches can see their players' data
CREATE POLICY "Coaches can view their players AI data"
  ON ai_coach_visibility FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "System can create coach visibility records"
  ON ai_coach_visibility FOR INSERT
  WITH CHECK (TRUE); -- Handled by backend

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'ai_chat_sessions_updated_at'
  ) THEN
    CREATE TRIGGER ai_chat_sessions_updated_at
      BEFORE UPDATE ON ai_chat_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE ai_chat_sessions IS 'Stores AI chat sessions with context snapshots';
COMMENT ON TABLE ai_messages IS 'Stores individual messages in AI chat sessions with risk classification';
COMMENT ON TABLE ai_recommendations IS 'Tracks actionable AI recommendations with acceptance/rejection status';
COMMENT ON TABLE ai_feedback IS 'User feedback on AI responses for continuous improvement';
COMMENT ON TABLE ai_coach_visibility IS 'Coach visibility into player AI interactions for team contexts';

COMMENT ON COLUMN ai_messages.risk_level IS 'Safety tier: low (general training), medium (injury/recovery), high (supplements/medical)';
COMMENT ON COLUMN ai_recommendations.recommendation_type IS 'Type of action recommended by AI';
COMMENT ON COLUMN ai_feedback.flagged_for_review IS 'TRUE if feedback indicates unsafe or incorrect response';


-- Phase 3: Alert & Automation Engine for RTP and Load Management
-- Defines alert rules, generated alerts, delivery logs, preferences, and subscriptions
-- Status: Built, not deployed
-- Depends on: Phase 2a (acwr_snapshots, rtp_phase_progress, psychological_assessments)

-- ============================================================================
-- Alert Rules (system-managed rule definitions)
-- ============================================================================

CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('critical', 'high', 'medium', 'low')),
  description TEXT,
  trigger_condition JSONB NOT NULL, -- {trigger: 'acwr_red_flag', threshold: 1.3, ...}
  enabled BOOLEAN DEFAULT true,
  organization_id UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE (name, organization_id) -- One rule name per org
);

INSERT INTO alert_rules (name, alert_type, description, trigger_condition, enabled, organization_id)
VALUES
  ('ACWR Red Flag', 'critical', 'Athlete''s ACWR exceeds personalized safe zone (>upper bound + 30%)',
   '{"trigger":"acwr_red_flag","threshold_multiplier":1.3}'::jsonb, true, NULL),
  ('ACWR Yellow Flag', 'high', 'ACWR approaching personalized limit (>upper bound, <red flag)',
   '{"trigger":"acwr_yellow_flag","threshold_multiplier":1.0}'::jsonb, true, NULL),
  ('Safety Alert', 'critical', 'Personalized ACWR safety_alert flag set',
   '{"trigger":"acwr_safety_alert"}'::jsonb, true, NULL),
  ('Phase Advancement Ready', 'high', 'Athlete meets all RTP phase advancement criteria (2+ weeks stable)',
   '{"trigger":"phase_advancement_ready","weeks_stable":2}'::jsonb, true, NULL),
  ('Readiness Gate Failed', 'critical', 'One functional criterion blocks phase advancement',
   '{"trigger":"readiness_gate_failed"}'::jsonb, true, NULL),
  ('Psychological Readiness Failed', 'critical', 'ACL-RSI <56 or TSK-11 >=37 on assessment',
   '{"trigger":"psych_readiness_failed"}'::jsonb, true, NULL),
  ('CMJ Depression Trend', 'medium', 'Weekly CMJ drop >5% (neuromuscular fatigue)',
   '{"trigger":"cmj_depression_trend","drop_threshold":5}'::jsonb, true, NULL),
  ('Underload Alert', 'low', 'ACWR <0.8 for 3+ days (athlete undertrained)',
   '{"trigger":"underload_alert","threshold":0.8,"consecutive_days":3}'::jsonb, true, NULL);

-- ============================================================================
-- Generated Alerts (one row per fired event)
-- ============================================================================

CREATE TABLE generated_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE RESTRICT,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('critical', 'high', 'medium', 'low')),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  trigger_data JSONB, -- {acwr: 1.42, upper_bound: 1.30, acute_load: 150, chronic_load: 106, ...}
  related_athlete_id UUID REFERENCES users(id), -- For staff alerts about other athletes
  related_injury_id UUID REFERENCES athlete_injuries(id),
  related_entity_type VARCHAR(50), -- 'acwr_snapshot', 'rtp_phase_progress', 'psychological_assessment'
  related_entity_id UUID,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_note TEXT,
  acknowledged_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT athlete_rule_date_unique UNIQUE (user_id, rule_id, DATE(created_at))
);

COMMENT ON TABLE generated_alerts IS 'Alert events fired by rule engine. One row per triggered event. Deduped per (user_id, rule_id, DATE).';

-- ============================================================================
-- Alert Routing (who receives which alert types)
-- ============================================================================

CREATE TABLE alert_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  recipient_role VARCHAR(50) NOT NULL CHECK (recipient_role IN ('athlete', 'coach', 'physiotherapist', 'strength_coach', 'psychologist', 'nutritionist', 'admin')),
  recipient_user_id UUID, -- NULL = all users with this role; non-NULL = specific user
  organization_id UUID,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE (alert_rule_id, recipient_role, recipient_user_id, organization_id)
);

INSERT INTO alert_routes (alert_rule_id, recipient_role, recipient_user_id, enabled, organization_id)
SELECT r.id, t.role, NULL, true, NULL
FROM alert_rules r
CROSS JOIN (
  VALUES ('critical'), ('high'), ('medium'), ('low')
) AS t(alert_type)
CROSS JOIN (
  VALUES ('athlete'), ('coach'), ('physiotherapist'), ('strength_coach'), ('psychologist'), ('nutritionist')
) AS role_t(role)
WHERE r.alert_type = t.alert_type
  AND CASE
    WHEN r.alert_type = 'critical' THEN role_t.role IN ('athlete', 'coach', 'physiotherapist', 'psychologist')
    WHEN r.alert_type = 'high' THEN role_t.role IN ('athlete', 'coach', 'physiotherapist', 'psychologist')
    WHEN r.alert_type = 'medium' THEN role_t.role IN ('coach', 'physiotherapist', 'nutritionist')
    WHEN r.alert_type = 'low' THEN role_t.role IN ('coach')
  END;

-- ============================================================================
-- Alert Delivery Logs (when/how alerts were sent)
-- ============================================================================

CREATE TABLE alert_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_alert_id UUID NOT NULL REFERENCES generated_alerts(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('in_app', 'push', 'email', 'sms')),
  sent_at TIMESTAMP DEFAULT now(),
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  delivery_status VARCHAR(50) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'deduped', 'suppressed')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now()
);

COMMENT ON TABLE alert_delivery_logs IS 'Audit trail for alert delivery. One row per (alert, recipient, channel). Track sent/delivered/read timestamps for compliance.';

-- ============================================================================
-- User Alert Preferences (opt-in/out, quiet hours, channels)
-- ============================================================================

CREATE TABLE alert_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('critical', 'high', 'medium', 'low')),
  enabled BOOLEAN DEFAULT true,
  channels JSONB DEFAULT '["in_app"]'::jsonb, -- ['in_app', 'push', 'email', 'sms']
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT one_pref_per_type UNIQUE (user_id, alert_type)
);

COMMENT ON TABLE alert_preferences IS 'User notification preferences. One row per (user_id, alert_type). Governs which channels are active and quiet-hours suppression.';

-- ============================================================================
-- Alert Subscriptions (staff subscribes to alerts about team members)
-- ============================================================================

CREATE TABLE alert_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Coach/Physio doing subscribing
  alert_rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  target_athlete_id UUID, -- NULL = all team members; specific UUID = this athlete
  channels JSONB DEFAULT '["in_app"]'::jsonb,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT subscriber_rule_athlete_unique UNIQUE (subscriber_user_id, alert_rule_id, target_athlete_id)
);

COMMENT ON TABLE alert_subscriptions IS 'Staff alert subscriptions. Coach subscribes to ACWR alerts for their team or specific athletes. Supplements alert_routes with dynamic subscriptions.';

-- ============================================================================
-- Indexes for performance
-- ============================================================================

CREATE INDEX idx_generated_alerts_user_id ON generated_alerts(user_id);
CREATE INDEX idx_generated_alerts_status ON generated_alerts(status);
CREATE INDEX idx_generated_alerts_created_at ON generated_alerts(created_at DESC);
CREATE INDEX idx_generated_alerts_alert_type ON generated_alerts(alert_type);
CREATE INDEX idx_generated_alerts_rule_id ON generated_alerts(rule_id);
CREATE INDEX idx_generated_alerts_acknowledged_at ON generated_alerts(acknowledged_at) WHERE acknowledged = false;

CREATE INDEX idx_alert_delivery_logs_alert_id ON alert_delivery_logs(generated_alert_id);
CREATE INDEX idx_alert_delivery_logs_recipient ON alert_delivery_logs(recipient_user_id);
CREATE INDEX idx_alert_delivery_logs_channel ON alert_delivery_logs(channel);
CREATE INDEX idx_alert_delivery_logs_status ON alert_delivery_logs(delivery_status);
CREATE INDEX idx_alert_delivery_logs_created_at ON alert_delivery_logs(created_at DESC);

CREATE INDEX idx_alert_preferences_user_id ON alert_preferences(user_id);
CREATE INDEX idx_alert_subscriptions_subscriber ON alert_subscriptions(subscriber_user_id);
CREATE INDEX idx_alert_subscriptions_rule_id ON alert_subscriptions(alert_rule_id);

-- ============================================================================
-- Row-Level Security (RLS) Policies
-- ============================================================================

ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_subscriptions ENABLE ROW LEVEL SECURITY;

-- alert_rules: public read (rules are visible to all), admin/service-role write
CREATE POLICY alert_rules_read_all ON alert_rules FOR SELECT USING (true);
CREATE POLICY alert_rules_write_admin ON alert_rules FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY alert_rules_update_admin ON alert_rules FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- generated_alerts: athletes see own, staff see team members' alerts
CREATE POLICY athlete_see_own_alerts ON generated_alerts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY staff_see_team_alerts ON generated_alerts
  FOR SELECT USING (
    auth.uid() != user_id
    AND EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('coach', 'physiotherapist', 'strength_coach', 'head_coach')
        AND tm.team_id IN (
          SELECT team_id FROM team_members
          WHERE user_id = generated_alerts.user_id
            AND status = 'active'
          LIMIT 1
        )
    )
  );

-- Staff can acknowledge/update team alerts
CREATE POLICY staff_acknowledge_team_alerts ON generated_alerts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('coach', 'physiotherapist', 'strength_coach', 'head_coach')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
  );

-- Insert alerts: service role only
CREATE POLICY alerts_insert_service ON generated_alerts
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- alert_routes: public read, admin/service-role write
CREATE POLICY alert_routes_read_all ON alert_routes FOR SELECT USING (true);
CREATE POLICY alert_routes_write_admin ON alert_routes FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- alert_delivery_logs: athletes see their own deliveries, staff see team deliveries, service-role writes
CREATE POLICY delivery_logs_read_own ON alert_delivery_logs
  FOR SELECT USING (recipient_user_id = auth.uid());

CREATE POLICY delivery_logs_read_team ON alert_delivery_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM generated_alerts ga
      INNER JOIN team_members tm ON (
        tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('coach', 'physiotherapist', 'strength_coach', 'head_coach')
      )
      WHERE ga.id = alert_delivery_logs.generated_alert_id
        AND ga.user_id IN (
          SELECT user_id FROM team_members
          WHERE team_id = tm.team_id AND status = 'active'
        )
    )
  );

CREATE POLICY delivery_logs_insert_service ON alert_delivery_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- alert_preferences: users manage their own
CREATE POLICY preferences_all_own ON alert_preferences
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- alert_subscriptions: staff manage their own subscriptions
CREATE POLICY subscriptions_read_own ON alert_subscriptions
  FOR SELECT USING (subscriber_user_id = auth.uid());

CREATE POLICY subscriptions_write_own ON alert_subscriptions
  FOR INSERT WITH CHECK (subscriber_user_id = auth.uid());

CREATE POLICY subscriptions_update_own ON alert_subscriptions
  FOR UPDATE USING (subscriber_user_id = auth.uid()) WITH CHECK (subscriber_user_id = auth.uid());

-- ============================================================================
-- Stored Procedure: Generate ACWR Alert
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_acwr_alert(
  p_user_id UUID,
  p_acwr NUMERIC,
  p_upper_bound NUMERIC,
  p_alert_type VARCHAR,
  p_acwr_snapshot_id UUID,
  p_acute_load NUMERIC,
  p_chronic_load NUMERIC,
  p_cumulative_multiplier NUMERIC
)
RETURNS UUID AS $$
DECLARE
  v_rule_id UUID;
  v_alert_id UUID;
  v_title VARCHAR;
BEGIN
  -- Get the corresponding rule ID
  SELECT id INTO v_rule_id FROM alert_rules
  WHERE name = CASE
    WHEN p_alert_type = 'red_flag' THEN 'ACWR Red Flag'
    WHEN p_alert_type = 'yellow_flag' THEN 'ACWR Yellow Flag'
    WHEN p_alert_type = 'safety_alert' THEN 'Safety Alert'
  END
  LIMIT 1;

  IF v_rule_id IS NULL THEN
    RETURN NULL; -- Rule not found
  END IF;

  -- Construct title
  v_title := 'ACWR ' || INITCAP(REPLACE(p_alert_type, '_', ' ')) || ': ' ||
    ROUND(p_acwr::NUMERIC, 2)::TEXT || ' (limit ' || ROUND(p_upper_bound::NUMERIC, 2)::TEXT || ')';

  -- Insert alert (dedup on (user_id, rule_id, DATE))
  INSERT INTO generated_alerts (
    user_id, rule_id, alert_type, title, description,
    trigger_data, related_entity_type, related_entity_id,
    status, created_at
  )
  VALUES (
    p_user_id,
    v_rule_id,
    CASE WHEN p_alert_type = 'red_flag' THEN 'critical'
         WHEN p_alert_type = 'yellow_flag' THEN 'high'
         ELSE 'critical' END,
    v_title,
    'Your training load ' || CASE
      WHEN p_alert_type = 'red_flag' THEN 'exceeded your personalized safe zone.'
      WHEN p_alert_type = 'yellow_flag' THEN 'is approaching your personalized limit.'
      ELSE 'triggered a safety flag.' END,
    JSONB_BUILD_OBJECT(
      'acwr', p_acwr,
      'upper_bound', p_upper_bound,
      'acute_load', p_acute_load,
      'chronic_load', p_chronic_load,
      'cumulative_multiplier', p_cumulative_multiplier
    ),
    'acwr_snapshot',
    p_acwr_snapshot_id,
    'active',
    now()
  )
  ON CONFLICT (user_id, rule_id, DATE(created_at)) DO NOTHING
  RETURNING id INTO v_alert_id;

  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_acwr_alert IS 'Fire ACWR alert when snapshot status changes. Deduped per (user_id, rule_id, DATE).';

-- ============================================================================
-- Stored Procedure: Generate Phase Advancement Alert
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_phase_advancement_alert(
  p_user_id UUID,
  p_injury_id UUID,
  p_current_phase INT,
  p_next_phase INT
)
RETURNS UUID AS $$
DECLARE
  v_rule_id UUID;
  v_alert_id UUID;
  v_injury_type VARCHAR;
BEGIN
  -- Get injury type
  SELECT injury_type INTO v_injury_type FROM athlete_injuries
  WHERE id = p_injury_id AND user_id = p_user_id LIMIT 1;

  IF v_injury_type IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get rule ID
  SELECT id INTO v_rule_id FROM alert_rules
  WHERE name = 'Phase Advancement Ready' LIMIT 1;

  -- Insert alert
  INSERT INTO generated_alerts (
    user_id, rule_id, alert_type, title, description,
    trigger_data, related_injury_id, related_entity_type,
    status, created_at
  )
  VALUES (
    p_user_id,
    v_rule_id,
    'high',
    'Phase Advancement Ready: ' || v_injury_type || ' (phase ' || p_current_phase || '→' || p_next_phase || ')',
    'All functional criteria met. Review psychological readiness before advancing.',
    JSONB_BUILD_OBJECT(
      'injury_type', v_injury_type,
      'current_phase', p_current_phase,
      'next_phase', p_next_phase
    ),
    p_injury_id,
    'rtp_phase_progress',
    'active',
    now()
  )
  ON CONFLICT (user_id, rule_id, DATE(created_at)) DO NOTHING
  RETURNING id INTO v_alert_id;

  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_phase_advancement_alert IS 'Fire phase advancement alert when criteria met (2+ weeks stable).';

-- ============================================================================
-- Stored Procedure: Generate Psychological Readiness Alert
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_psych_readiness_alert(
  p_user_id UUID,
  p_injury_id UUID,
  p_acl_rsi_score INT,
  p_tsk11_score INT
)
RETURNS UUID AS $$
DECLARE
  v_rule_id UUID;
  v_alert_id UUID;
  v_title VARCHAR;
BEGIN
  -- Only fire if at least one gate is failed
  IF (p_acl_rsi_score IS NULL OR p_acl_rsi_score >= 56)
    AND (p_tsk11_score IS NULL OR p_tsk11_score < 37) THEN
    RETURN NULL; -- Both gates pass, no alert
  END IF;

  -- Get rule ID
  SELECT id INTO v_rule_id FROM alert_rules
  WHERE name = 'Psychological Readiness Failed' LIMIT 1;

  v_title := 'Psychological Readiness Setback';
  IF p_acl_rsi_score IS NOT NULL AND p_acl_rsi_score < 56 THEN
    v_title := v_title || ': ACL-RSI ' || p_acl_rsi_score || '/100';
  END IF;
  IF p_tsk11_score IS NOT NULL AND p_tsk11_score >= 37 THEN
    v_title := v_title || ' | TSK-11 ' || p_tsk11_score || '/55';
  END IF;

  INSERT INTO generated_alerts (
    user_id, rule_id, alert_type, title, description,
    trigger_data, related_injury_id, related_entity_type,
    status, created_at
  )
  VALUES (
    p_user_id,
    v_rule_id,
    'critical',
    v_title,
    'Psychological readiness scores indicate fear-avoidance or confidence crisis. Consider protocol delay or psychologist intervention.',
    JSONB_BUILD_OBJECT(
      'acl_rsi_score', p_acl_rsi_score,
      'tsk11_score', p_tsk11_score
    ),
    p_injury_id,
    'psychological_assessment',
    'active',
    now()
  )
  ON CONFLICT (user_id, rule_id, DATE(created_at)) DO NOTHING
  RETURNING id INTO v_alert_id;

  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_psych_readiness_alert IS 'Fire alert when ACL-RSI <56 or TSK-11 >=37 on assessment.';

-- ============================================================================
-- Realtime Publication (add generated_alerts + alert_delivery_logs)
-- ============================================================================

-- Include generated_alerts and alert_delivery_logs in realtime publication
-- (assume supabase_realtime publication already exists)

DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;
CREATE PUBLICATION supabase_realtime FOR TABLE
  training_sessions,
  daily_wellness_checkin,
  readiness_scores,
  chat_messages,
  channels,
  notifications,
  team_members,
  coach_activity_log,
  games,
  messages,
  performance_metrics,
  generated_alerts,
  alert_delivery_logs,
  acwr_snapshots,
  rtp_phase_progress,
  psychological_assessments;

-- ============================================================================
-- Trigger: Wire ACWR snapshot status changes to alert generation
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_acwr_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- Fire alert if status changed to red_flag or yellow_flag
  IF NEW.status IN ('red_flag', 'yellow_flag', 'safety_alert') THEN
    PERFORM generate_acwr_alert(
      NEW.user_id,
      NEW.acwr_ratio,
      CASE WHEN NEW.personalized_upper IS NOT NULL THEN NEW.personalized_upper
           ELSE 1.3 END,
      NEW.status,
      NEW.id,
      NEW.acute_load,
      NEW.chronic_load,
      NEW.cumulative_multiplier
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER acwr_snapshot_alert_trigger
AFTER INSERT OR UPDATE ON acwr_snapshots
FOR EACH ROW
EXECUTE FUNCTION trigger_acwr_alert();

-- ============================================================================
-- Trigger: Wire RTP phase progress to phase advancement alert
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_phase_advancement_alert()
RETURNS TRIGGER AS $$
DECLARE
  v_is_stable BOOLEAN;
  v_next_phase INT;
BEGIN
  -- Check if ready_for_next_phase AND at least 2 weeks of data
  IF NEW.ready_for_next_phase THEN
    SELECT COUNT(*) >= 2 INTO v_is_stable
    FROM rtp_phase_progress
    WHERE user_id = NEW.user_id
      AND injury_id = NEW.injury_id
      AND week_ending >= (NEW.week_ending - INTERVAL '14 days');

    IF v_is_stable THEN
      v_next_phase := COALESCE(NEW.current_rtp_phase, 0) + 1;
      PERFORM generate_phase_advancement_alert(
        NEW.user_id,
        NEW.injury_id,
        COALESCE(NEW.current_rtp_phase, 0),
        v_next_phase
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER rtp_phase_alert_trigger
AFTER INSERT OR UPDATE ON rtp_phase_progress
FOR EACH ROW
EXECUTE FUNCTION trigger_phase_advancement_alert();

-- ============================================================================
-- Trigger: Wire psychological assessments to readiness alerts
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_psych_readiness_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- Fire alert if either ACL-RSI or TSK-11 gates fail
  IF (NEW.acl_rsi_score IS NOT NULL AND NEW.acl_rsi_score < 56)
    OR (NEW.tsk11_score IS NOT NULL AND NEW.tsk11_score >= 37) THEN
    PERFORM generate_psych_readiness_alert(
      NEW.user_id,
      NEW.injury_id,
      NEW.acl_rsi_score,
      NEW.tsk11_score
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER psych_assessment_alert_trigger
AFTER INSERT OR UPDATE ON psychological_assessments
FOR EACH ROW
EXECUTE FUNCTION trigger_psych_readiness_alert();

-- ============================================================================
-- Audit Comment
-- ============================================================================

COMMENT ON SCHEMA public IS 'Phase 3 Alert & Automation adds generated_alerts + delivery infrastructure to Phase 2a (ACWR) + Phase 2b (RTP). Rules fire automatically on data mutations via triggers; delivery is handled by Netlify edge functions (send-alert-email.js, push.js, notifications.js).';

# Phase 3: Alerts & Automation for RTP and Load Management

**Status:** SPECIFICATION (not yet built)  
**Depends on:** Phase 2a (schema), 2b (RTP endpoints), 2c (recovery engine)  
**Deliverable:** Alert engine (triggers, rules, preferences), notification channels, 4 Netlify endpoints, real-time dashboard updates  
**Timeline:** 4 weeks (alerts schema + engine → channels → preferences UI → automation rules)

---

## 1. Alert Architecture

Alerts are **generated** when Phase 2 data crosses thresholds, **routed** through preferences and channels, and **stored** for audit. No alerts mutate the underlying data — they inform coaches, athletes, and psychologists so they can make decisions.

### 1.1 Alert Types

#### Critical (Immediate notification, high visual priority)

| Trigger | WHO Sees | Channel | Why | Action Required |
|---------|----------|---------|-----|-----------------|
| **ACWR Red Flag** (ACWR > 1.3 + cumulative_multiplier upper bound) | Athlete + Coach + Physio | In-app (priority), Push, Email | Acute overload risk; injury spike | Athlete lightens today's session; Coach reviews load plan |
| **Safety Alert Flag** (from `acwr_snapshots.safety_alert=true`) | Athlete + Coach + Physio | In-app (priority), Push | Personalized ACWR threshold breached | Review cumulative multiplier (biomarker/confound/menstrual) |
| **Readiness Gate FAILED** (athlete meets phase advancement criteria **except one**) | Coach + Psychologist | In-app, Email | Athlete 48h away from phase progression but LSI/TSK-11/confidence gap | Coach/psych addresses the blocker before advancing |
| **Psychological Readiness FAILED** (ACL-RSI <56 OR TSK-11 ≥37 on assessment day) | Coach + Psychologist | In-app, Email | Fear-avoidance or confidence crisis mid-RTP | Psychologist intervention / protocol delay |
| **Injury Phase Misalignment** (athlete training above phase load, CMJ >7% drop, OR pain escalation) | Coach + Physio | In-app, Email | Premature loading or regression signal | Physio/coach review RTP phase protocol |

#### High Priority (Within 24h, coach visibility)

| Trigger | WHO Sees | Channel | Why | Action Required |
|---------|----------|---------|-----|-----------------|
| **ACWR Yellow Flag** (ACWR > 1.0 + upper bound, <1.3 threshold) | Athlete + Coach | In-app, Email (opt-in) | Load approaching limit; risk window opening | Coach considers load reduction; athlete monitors recovery |
| **Phase Advancement Ready** (all functional criteria met, 2+ weeks stable) | Coach + Athlete | In-app, Email | RTP progression possible | Coach advances phase (or notifies psychologist if confidence gate blocks) |
| **Recovery Modality Recommended** (recovery-recommendations engine fires) | Athlete + Coach | In-app, In-app Card | Specific modality (ice bath, compression, foam rolling, etc.) | Athlete uses modality; logs effectiveness |
| **ACWR Confidence Low** (acute load <8 days) | Coach + Physio | Email only | ACWR ratio unreliable; chronic load still building | Coach waits for data to mature before load decisions |

#### Medium Priority (Daily digest)

| Trigger | WHO Sees | Channel | Why | Action Required |
|---------|----------|---------|-----|-----------------|
| **ACWR Trend Alert** (3+ consecutive days yellow OR trending red) | Coach | Email (daily digest) | Load pattern emerging | Coach rebalances the week |
| **CMJ Depression Trend** (weekly drop >5%, regression) | Physio + Coach | Email (weekly) | Neuromuscular fatigue accumulation | Assess overreaching; consider unload day |
| **Biomarker Threshold** (ferritin <20, vitamin D <20, cortisol >10) | Athlete + Coach + Nutritionist | In-app, Email | Supplementation or diet opportunity | Nutritionist counsels; monitor next panel |
| **Recovery Modality Effectiveness Low** (avg rating <5/10 over 10 sessions) | Coach + Athlete | In-app Card | Modality may not suit this athlete | Coach suggests alternative or technique check |

#### Low Priority (Weekly summary, opt-in)

| Trigger | WHO Sees | Channel | Why | Action Required |
|---------|----------|---------|-----|-----------------|
| **Weekly ACWR Summary** | Athlete + Coach | Email (weekly digest) | Load overview; no threshold crossed | Informational |
| **RTP Phase Summary** (weekly progress card) | Coach + Athlete | Email (weekly) | Phase stability, functional criteria trend | Motivation + compliance check |
| **Underload Alert** (ACWR <0.8 for 3+ days, building base) | Coach | Email only | Athlete undertrained; no overload | Coach increases load if planned |

---

## 2. Database Schema Extensions

### 2.1 Core Alert Tables

```sql
-- Stores alert rule definitions (created by system, managed by admin UI)
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, -- "ACWR Red Flag", "Phase Advancement", etc.
  alert_type VARCHAR(50) NOT NULL, -- 'critical', 'high', 'medium', 'low'
  trigger_condition JSONB NOT NULL, -- {trigger: 'acwr_red_flag', threshold: 1.3, ...}
  enabled BOOLEAN DEFAULT true,
  organization_id UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Generated alerts (one row per event)
CREATE TABLE generated_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  rule_id UUID NOT NULL REFERENCES alert_rules(id),
  alert_type VARCHAR(50) NOT NULL, -- 'critical', 'high', 'medium', 'low'
  title VARCHAR(200) NOT NULL, -- "ACWR Red Flag: Load 1.42 (limit 1.30)"
  description TEXT,
  trigger_data JSONB, -- {acwr: 1.42, upper_bound: 1.30, acute_load: 150, chronic_load: 106, ...}
  related_athlete_id UUID, -- For staff viewing alerts about team members
  related_injury_id UUID,
  related_entity_type VARCHAR(50), -- 'acwr_snapshot', 'rtp_phase_progress', 'psychological_assessment'
  related_entity_id UUID,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID, -- User who acknowledged (for staff-level alerts)
  acknowledged_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'resolved', 'dismissed'
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT athlete_rule_unique UNIQUE (user_id, rule_id, created_at::DATE)
);

-- Alert routing: who sees which alerts
CREATE TABLE alert_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id UUID NOT NULL REFERENCES alert_rules(id),
  recipient_role VARCHAR(50) NOT NULL, -- 'athlete', 'coach', 'physio', 'psychologist', 'nutritionist'
  recipient_user_id UUID, -- NULL = all users with this role; specific UUID = this user only
  organization_id UUID,
  created_at TIMESTAMP DEFAULT now()
);

-- Alert delivery logs (when/how each alert was sent)
CREATE TABLE alert_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_alert_id UUID NOT NULL REFERENCES generated_alerts(id),
  recipient_user_id UUID NOT NULL REFERENCES users(id),
  channel VARCHAR(50) NOT NULL, -- 'in_app', 'push', 'email', 'sms'
  sent_at TIMESTAMP DEFAULT now(),
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  delivery_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- User alert preferences (opt-in/out)
CREATE TABLE alert_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  alert_type VARCHAR(50) NOT NULL, -- 'critical', 'high', 'medium', 'low'
  enabled BOOLEAN DEFAULT true,
  channels JSONB DEFAULT '["in_app"]'::jsonb, -- ['in_app', 'push', 'email', 'sms']
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT one_pref_per_type UNIQUE (user_id, alert_type)
);

-- Subscription to specific alert types (e.g., coach subscribes to ACWR alerts for team members)
CREATE TABLE alert_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_user_id UUID NOT NULL REFERENCES users(id), -- Coach/Physio
  alert_rule_id UUID NOT NULL REFERENCES alert_rules(id),
  target_athlete_id UUID, -- NULL = all team members
  channels JSONB DEFAULT '["in_app"]'::jsonb,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT subscriber_rule_unique UNIQUE (subscriber_user_id, alert_rule_id, target_athlete_id)
);
```

### 2.2 Indexes

```sql
CREATE INDEX idx_generated_alerts_user_id ON generated_alerts(user_id);
CREATE INDEX idx_generated_alerts_status ON generated_alerts(status);
CREATE INDEX idx_generated_alerts_created_at ON generated_alerts(created_at DESC);
CREATE INDEX idx_generated_alerts_alert_type ON generated_alerts(alert_type);
CREATE INDEX idx_alert_delivery_logs_alert_id ON alert_delivery_logs(generated_alert_id);
CREATE INDEX idx_alert_delivery_logs_recipient ON alert_delivery_logs(recipient_user_id);
CREATE INDEX idx_alert_subscriptions_subscriber ON alert_subscriptions(subscriber_user_id);
```

### 2.3 RLS Policies

```sql
-- Athletes see their own alerts
CREATE POLICY athletes_see_own_alerts ON generated_alerts
  FOR SELECT USING (user_id = auth.uid());

-- Coaches/Physios see alerts for their team members' athletes
CREATE POLICY staff_see_team_alerts ON generated_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.team_id = (
          SELECT team_id FROM team_members 
          WHERE user_id = generated_alerts.user_id LIMIT 1
        )
        AND tm.role IN ('coach', 'physiotherapist', 'strength_coach')
        AND tm.status = 'active'
    )
  );

-- Staff can acknowledge alerts for their team
CREATE POLICY staff_acknowledge_team_alerts ON generated_alerts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('coach', 'physiotherapist', 'strength_coach')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
  );

-- Users manage their own preferences
CREATE POLICY users_manage_own_preferences ON alert_preferences
  FOR ALL USING (user_id = auth.uid());
```

---

## 3. Alert Generation Engine

### 3.1 Core Rules (Fire via Supabase triggers or Netlify scheduler)

**Location:** `netlify/functions/alert-engine.js` (or trigger RPC)

#### Rule: ACWR Red Flag

```
Trigger: acwr_snapshots INSERT/UPDATE
Condition: status = 'red_flag'
Alert Title: "ACWR Red Flag: {acwr:.2f} (limit {upper_bound:.2f})"
Recipients: [athlete, coach, physio]
Channels: [in_app (priority), push (immediate), email (immediate)]
Dedup: 1 per day per athlete (suppress repeat red flags within 24h)
```

#### Rule: Phase Advancement Ready

```
Trigger: rtp_phase_progress INSERT
Condition: 
  strength_lsi_pct >= 90 AND
  hop_test_battery_pct >= 90 AND
  acl_rsi_pct >= 56 AND
  tsk11_normalized = true AND
  ready_for_next_phase = true AND
  (SELECT COUNT(*) FROM rtp_phase_progress 
   WHERE user_id=X AND injury_id=Y 
   AND week_ending >= DATE_TRUNC('week', now()) - 14) >= 2
Alert Title: "Phase Advancement Ready: {injury_type} can progress to phase {next_phase}"
Recipients: [coach, psychologist]
Channels: [in_app, email]
Dedup: 1 per injury per 7 days
```

#### Rule: Psychological Readiness Failed

```
Trigger: psychological_assessments INSERT/UPDATE
Condition: 
  (acl_rsi_score < 56 OR tsk11_score >= 37) AND
  (previous assessment had both >= 56 and < 37)
Alert Title: "Psychological Readiness Setback: ACL-RSI {acl_rsi_score} / TSK-11 {tsk11_score}"
Recipients: [coach, psychologist]
Channels: [in_app, email (immediate)]
Dedup: 1 per injury per assessment
```

#### Rule: Recovery Modality Recommended

```
Trigger: recovery-recommendations GET
Condition: recommendations array is non-empty
Alert Title: "Recovery Recommendation: {modality_name} ({evidence_grade}, {priority})"
Recipients: [athlete]
Channels: [in_app (card-dismissible)]
Dedup: 1 per modality per day
```

#### Rule: ACWR Yellow Flag (optional trend)

```
Trigger: acwr_snapshots INSERT/UPDATE
Condition: status = 'yellow_flag'
Alert Title: "ACWR Approaching Limit: {acwr:.2f} (safe <{upper_bound:.2f})"
Recipients: [coach]
Channels: [email (daily digest)]
Dedup: 1 per day per athlete (batched in digest)
```

### 3.2 Deduplication Strategy

- **Time-window dedup:** If an identical alert fired in the last N hours, suppress the new one; log to `alert_delivery_logs` with status 'deduped'
- **Per-entity dedup:** ACWR alerts keyed by `(user_id, alert_type, DATE(created_at))`; don't fire red flag twice on the same day even if ACWR stays red
- **Digest batching:** Low-priority alerts (yellow, underload, weekly summary) batch into a daily/weekly digest email rather than individual sends

---

## 4. Notification Channels

### 4.1 In-App Notifications

**Location:** `netlify/functions/notifications.js` (extended)

```typescript
// Existing `notifications` table, add alert_id foreign key
// Alert appears in the bell icon, stacked by priority, dismissible
// Critical/High = red banner at top of screen for 5 seconds
// Medium = card in notification center
// Low = summary in digest view (stats page)
```

**UI Behavior:**
- Priority badge (🔴 Critical, 🟡 High, 🔵 Medium, ⚪ Low)
- Timestamp + "Acknowledge" button (for staff alerts)
- Tap to detail view (show trigger data, recommended action, affected athletes if staff)
- Swipe/X to dismiss (logged but status='dismissed', not 'resolved')

### 4.2 Push Notifications

**Location:** `netlify/functions/push.js` (extended)

**Service Workers:** Uses existing FCM/Web Push (from `push-service.ts`)

```
Critical/High only:
  - Title: "ACWR Alert" / "RTP Alert"
  - Body: First 120 chars of alert description
  - Badge: "🏃" / "⚕️" (athlete/medical theme)
  - Tag: "acwr-red-{userId}" (replace/dedupe by tag)
  - Require Interaction: true (user must click/dismiss)
  - Click Action: Deep link to alert detail view
  - Time-to-live: 24 hours

Quiet Hours:
  - Suppress push if recipient's alert_preferences has quiet_hours set and current time is within [start, end]
  - Still deliver in-app notification
  - Deliver via email immediately after quiet hours end
```

### 4.3 Email Notifications

**Location:** `netlify/functions/send-alert-email.js` (new)

**Templates:**

#### Immediate (Critical/High)
```
To: athlete@example.com
Subject: ACWR Alert: Load 1.42 (limit 1.30) — Action needed

Body:
---
Hi {athlete_name},

Your training load today exceeded your personalized safe zone:

📊 ACWR Ratio: 1.42 (safe: 0.80–1.30)
📈 Acute Load (7-day): 150 AU
📉 Chronic Load (21-day): 106 AU
⚠️ Cumulative Multiplier: 0.92 (ferritin 18 µg/L + caffeine intake flagged)

What to do now:
• Reduce today's planned session intensity or duration
• Increase recovery (ice bath, compression, massage)
• Review your biomarkers (iron supplementation may help)
• Contact your coach if you have questions

View full details: [link to alert]
---
```

#### Daily Digest (Medium/Low)
```
To: coach@example.com
Subject: FlagFit Daily Alert Digest — 7/21/2026

Body:
---
Hi Coach,

Your team summary for today:

🔴 Critical
• Athlete #1: ACWR red flag (1.42)

🟡 High
• Athlete #2: Phase advancement ready (all criteria met, wait for psych gate)
• Athlete #3: Recovery modality recommended (foam rolling)

🔵 Medium
• Athlete #2, #4: ACWR trending yellow (3 consecutive days >1.0)

View full dashboard: [link to team heatmap]
---
```

#### Weekly Summary (Low priority)
```
To: athlete@example.com
Subject: FlagFit Weekly Summary — Week of 7/21/2026

Body:
---
Hi {athlete_name},

Your week at a glance:

📊 Avg ACWR: 0.95 (safe)
😴 Avg Sleep: 7.4 hours
💪 CMJ: 42 cm (trend: stable)
✅ Recovery Sessions: 5 completed

Next week: Competition on 7/28 (taper begins 7/24)
View prescription: [link to today]
---
```

---

## 5. Netlify Endpoints

### 5.1 GET /api/alerts?type=high&limit=20

**Description:** Fetch athlete's or staff's alerts (paginated, filterable)

**Query Parameters:**
- `type` (optional): 'critical', 'high', 'medium', 'low', or comma-separated
- `status` (optional): 'active', 'resolved', 'dismissed'
- `limit` (default 20, max 100)
- `offset` (default 0)
- `athleteId` (staff only, filter to specific athlete)

**Response:**
```json
{
  "success": true,
  "alerts": [
    {
      "id": "alert-123",
      "title": "ACWR Red Flag: 1.42",
      "description": "Your load exceeded personalized limit...",
      "type": "critical",
      "triggerData": {
        "acwr": 1.42,
        "upperBound": 1.30,
        "acuteLoad": 150,
        "chronicLoad": 106
      },
      "relatedInjuryId": "injury-456",
      "acknowledged": false,
      "status": "active",
      "createdAt": "2026-07-21T14:30:00Z",
      "deliveryChannels": ["in_app", "push", "email"]
    }
  ],
  "totalCount": 42,
  "hasMore": true
}
```

### 5.2 POST /api/alerts/{alertId}/acknowledge

**Description:** Mark alert as acknowledged (staff reviewing team alerts)

**Body:**
```json
{
  "acknowledgedNote": "Reviewed with athlete; reducing load tomorrow"
}
```

**Response:**
```json
{
  "success": true,
  "alert": {
    "id": "alert-123",
    "acknowledged": true,
    "acknowledgedBy": "coach-789",
    "acknowledgedAt": "2026-07-21T14:35:00Z",
    "acknowledgedNote": "Reviewed with athlete..."
  }
}
```

### 5.3 PUT /api/alert-preferences

**Description:** Update athlete's notification preferences

**Body:**
```json
{
  "alertType": "high", // or 'critical', 'medium', 'low'
  "enabled": true,
  "channels": ["in_app", "push", "email"],
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00",
  "timezone": "Europe/London"
}
```

**Response:**
```json
{
  "success": true,
  "preferences": {
    "alertType": "high",
    "enabled": true,
    "channels": ["in_app", "push", "email"],
    "quietHoursStart": "22:00",
    "quietHoursEnd": "08:00",
    "timezone": "Europe/London"
  }
}
```

### 5.4 GET /api/alert-rules (admin-only)

**Description:** Fetch all active alert rules (for debugging / customization)

**Response:**
```json
{
  "success": true,
  "rules": [
    {
      "id": "rule-acwr-red",
      "name": "ACWR Red Flag",
      "alertType": "critical",
      "enabled": true,
      "triggerCondition": {
        "trigger": "acwr_red_flag",
        "threshold": 1.3
      }
    }
  ],
  "totalCount": 8
}
```

---

## 6. Real-Time Subscriptions

### 6.1 Supabase Realtime

**Location:** `core/services/realtime.service.ts` (extended)

```typescript
// Subscribe to generated_alerts table for current user
this.supabase
  .from('generated_alerts')
  .on('*', (payload) => {
    if (payload.new.user_id === this.userId) {
      this.alertsSubject.next(payload.new);
      // Trigger toast notification for critical alerts
      if (payload.new.alert_type === 'critical') {
        this.showPriorityBanner(payload.new);
      }
    }
  })
  .subscribe();
```

### 6.2 WebSocket for Coach Dashboards

**Location:** `team-acwr-heatmap.component.ts` (from Phase 2d spec)

```typescript
// Listen for ACWR status changes on team members
this.alertService.subscribeTeamACWRAlerts(this.teamId).subscribe(alert => {
  // Update heatmap cell color from 'yellow_flag' to 'red_flag'
  this.updateAthleteACWRStatus(alert.relatedAthlete, alert.triggerData.status);
});
```

---

## 7. Implementation Roadmap (4 weeks)

### Week 1: Schema & Core Engine
- [ ] Create alert tables (alert_rules, generated_alerts, alert_delivery_logs, alert_preferences, alert_subscriptions)
- [ ] Add RLS policies
- [ ] Implement `alert-engine.js` with ACWR red/yellow flag, phase advancement, psych readiness rules
- [ ] Test rule firing on Phase 2 data mutations (ACWR snapshots, RTP progress, assessments)
- [ ] Add alert deduplication logic

### Week 2: Channels (In-App + Push)
- [ ] Extend `notifications.js` to accept `alert_id` foreign key
- [ ] Implement alert UI component (priority badge, detail view, dismiss/acknowledge actions)
- [ ] Wire push notifications (FCM template, quiet hours suppression)
- [ ] Test alert delivery on all channels
- [ ] Add realtime subscription to `generated_alerts` table

### Week 3: Email + Preferences
- [ ] Implement `send-alert-email.js` with immediate/digest/weekly templates
- [ ] Build alert preferences UI (enable/disable by type, channel picker, quiet hours, timezone)
- [ ] Implement `PUT /api/alert-preferences` endpoint
- [ ] Batch low-priority alerts into daily digest email job (Netlify scheduled function)
- [ ] Test email delivery (immediate + digest + quiet hours)

### Week 4: Team Alerts + Coach Dashboard
- [ ] Implement `alert-subscriptions` (coach subscribes to ACWR alerts for team)
- [ ] Build `GET /api/alerts` endpoint (filterable, paginated)
- [ ] Implement `POST /api/alerts/{alertId}/acknowledge` (staff annotation)
- [ ] Wire team alerts to Phase 2d Team ACWR Heatmap (real-time status updates)
- [ ] End-to-end test (ACWR red flag → coach notification → acknowledge → heatmap updates)
- [ ] Spike e2e test: full RTP workflow (phase advancement ready → psych assessment → readiness gate closed → alert fires)

---

## 8. Example Workflows

### Workflow 1: ACWR Red Flag → Coach Response

**Day 1, 14:00** Athlete logs training session
→ Compute ACWR → status = 'red_flag' (1.42)
→ Alert engine fires rule "ACWR Red Flag"
→ Generate alert for athlete + coach + physio
→ In-app notification (priority banner) + push (immediate) + email (immediate)

**Athlete sees:**
- 🔴 Banner: "ACWR Red Flag: 1.42 (limit 1.30) — Reduce load now"
- Taps → alert detail view (trigger data, cumulative multiplier breakdown, coach note)
- Message: Recoverymodalities recommended (ice bath A1, compression A2)

**Coach sees:**
- 🔴 Alert in team alerts list, tagged with athlete name
- Taps → detail view + recommendation from recovery engine
- Acknowledges: "Reviewed with athlete; reducing load tomorrow"
- Updates athlete's next session (via training plan editor)
- Heatmap updates in real time (athlete cell turns red)

---

### Workflow 2: Phase Advancement Ready → Psych Gate

**Week 5 of RTP**
Athlete's functional criteria (LSI 93%, hop 91%, CMJ stable) + confidence meet threshold
→ Alert engine fires rule "Phase Advancement Ready"
→ Generate alert for coach + psychologist (not athlete — suspense is intentional)
→ Coach sees notification: "ACL Tear RTP ready for phase 4"
→ Coach checks if psychologist is satisfied (TSK-11 <37? ACL-RSI ≥56?)

**Psychologist's perspective:**
- Gets alert only if TSK-11 ≥37 OR ACL-RSI <56 (implied: readiness gate is FAILED)
- Alert: "Phase Advancement Blocked: ACL-RSI 52/100 (need ≥56)"
- Sessions with athlete to address confidence / residual fear

**Coach's action:**
- If both gates pass: advances phase in RTP dashboard
- If psych gate blocks: waits 1 week, reassesses

---

### Workflow 3: Weekly ACWR Digest

**Every Monday 09:00 (in coach's timezone)**
- Batch all yellow_flag + underload alerts from the past week
- Group by athlete
- Send one email: "5 athletes in yellow load zone; see attached week summary"
- Link to team heatmap + drill-in to each athlete

---

## 9. Configuration & Governance

### 9.1 Alert Rule Customization (Future)

```json
{
  "ruleId": "acwr-red",
  "name": "ACWR Red Flag",
  "organizationId": "team-123",
  "triggerCondition": {
    "trigger": "acwr_red_flag",
    "threshold": 1.3,
    "thresholdOverride": 1.25 // Team can tighten the threshold
  },
  "recipients": {
    "athlete": true,
    "coach": true,
    "physio": true,
    "psychologist": false
  },
  "channels": {
    "inApp": true,
    "push": true,
    "email": true,
    "sms": false
  },
  "deduplicationWindow": "24h",
  "enabled": true
}
```

Teams can toggle rules, adjust thresholds, and customize recipients per the configuration spec (see `docs/governance/`).

### 9.2 Audit Trail

Every alert + every delivery + every acknowledgment is logged:
- `generated_alerts.created_at` = rule fired
- `alert_delivery_logs.sent_at` = when channel attempted delivery
- `alert_delivery_logs.delivered_at` = when device confirmed
- `alert_delivery_logs.read_at` = when user opened (in-app only)
- `generated_alerts.acknowledged_at` + `acknowledged_by` = staff action

**Compliance use cases:**
- "Did we alert coach X about athlete Y's red flag on date Z?" → Query `generated_alerts` + `alert_delivery_logs`
- "Who acknowledged the alert?" → `acknowledged_by` field + `acknowledged_note`
- "What % of critical alerts are acknowledged within 4 hours?" → Analytics on delivery + ack timestamps

---

## 10. Testing Strategy

### Unit Tests
- Alert rule evaluation (mock acwr/rtp/psych data, verify condition logic)
- Deduplication (suppress repeat alerts within 24h)
- Channel routing (athlete sees in-app/push, coach sees email/digest)
- Quiet hours (suppress push 22:00–08:00, deliver in-app)

### Integration Tests
- Phase 2 data mutation → alert generation (ACWR snapshot INSERT → generated_alerts row)
- Alert delivery to all channels (email template render, FCM push payload, in-app notification)
- RLS policies (athlete sees own alerts, staff sees team alerts, no cross-team leakage)
- Acknowledge + acknowledge_note persistence

### E2E Tests
- Full RTP workflow: injury → phase 0 → weekly progress → phase advancement ready alert → psych gate → coach acknowledges + advances
- ACWR red flag: log session → ACWR computed → alert fires → coach notified → athlete sees recommendation
- Quiet hours: alert fires at 23:00 → push suppressed, email queued → 08:00 → email sent

---

## 11. Success Metrics

- **Alert Latency:** <1 second from data mutation to athlete notification
- **Delivery Rate:** 99%+ of critical alerts delivered
- **Acknowledgment Rate:** 90%+ of coach-facing alerts acknowledged within 4 hours
- **False Positive Rate:** <5% (rules tuned to avoid alert fatigue)
- **Opt-Out Rate:** <10% (low noise = high engagement)

---

## Dependencies & Risks

**Depends on:**
- Phase 2a: `acwr_snapshots`, `rtp_phase_progress`, `psychological_assessments` tables
- Phase 2c: `recovery-recommendations.js` endpoint (modality suggestions)
- Existing: `notifications`, `push_subscriptions` tables + email infrastructure

**Risks:**
- **Alert fatigue:** Too many alerts → users ignore them. Deduplication + digest batching critical.
- **Delivery reliability:** Email/push failures silent. Implement delivery logging + retry queue.
- **Timezone handling:** Staff in multiple zones; quiet hours per user necessary.
- **Data privacy:** GDPR Art. 9 (health data) — alerts contain medical/injury info. Ensure email encryption in transit + at-rest.

---

## Appendix: Alert Response Card UI (Phase 2d Integration)

Phase 2d dashboards include inline alert response cards:

```
[🔴 ACWR Red Flag] Load 1.42 (limit 1.30)
├─ Acute Load: 150 AU | Chronic: 106 AU
├─ Cumulative Multiplier: 0.92 (ferritin 18 µg/L)
├─ Recommended Actions:
│  ├─ Ice Bath (A1) — 10-15 min, 10-15°C, post-session
│  ├─ Sleep Optimization (A1) — 8-9 hours tonight
│  └─ Compression Boots (A2) — evening, 20-30 min
└─ [Acknowledge] [View Full Alert] [Dismiss]
```

Real-time update: Coach marks alert as acknowledged → card updates to show "Reviewed by Coach at 2:35 PM — Load plan updated tomorrow"


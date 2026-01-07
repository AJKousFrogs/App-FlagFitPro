# Escalation Rules Visualization — v1

**Contract Version:** 1.0  
**Date:** 2026-01-29  
**Status:** Normative (Binding)  
**Scope:** Visual escalation rules, workflows, and UI states  
**Maintained By:** Product Architecture + Engineering

---

## SECTION 1 — Escalation Priority Levels

### 1.1 Priority Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ESCALATION PRIORITY LEVELS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PRIORITY    │ RESPONSE TIME │ ESCALATION PATH        │ UI INDICATOR       │
├──────────────┼───────────────┼────────────────────────┼────────────────────┤
│  URGENT      │ 1 hour        │ Direct to medical      │ 🔴 Red badge,     │
│  (Medical    │               │ staff                   │    pulsing         │
│   Safety)    │               │                        │                    │
├──────────────┼───────────────┼────────────────────────┼────────────────────┤
│  HIGH        │ 24 hours      │ S&C → Head Coach       │ 🟠 Orange badge   │
│  (Load        │               │                        │                    │
│   Safety)    │               │                        │                    │
├──────────────┼───────────────┼────────────────────────┼────────────────────┤
│  MEDIUM      │ 48 hours      │ Coach → Head Coach     │ 🟡 Yellow badge   │
│  (Compliance) │               │                        │                    │
├──────────────┼───────────────┼────────────────────────┼────────────────────┤
│  LOW          │ 72 hours      │ Role-specific          │ ⚪ Gray badge     │
│  (Informational)│              │                        │                    │
└──────────────┴───────────────┴────────────────────────┴────────────────────┘
```

### 1.2 Priority Determination Logic

```typescript
enum EscalationPriority {
  URGENT = 'urgent',    // Medical safety, 1 hour response
  HIGH = 'high',        // Load safety, 24 hour response
  MEDIUM = 'medium',    // Compliance, 48 hour response
  LOW = 'low'           // Informational, 72 hour response
}

function determinePriority(trigger: EscalationTrigger): EscalationPriority {
  if (trigger.isMedicalSafety) return EscalationPriority.URGENT;
  if (trigger.isLoadSafety) return EscalationPriority.HIGH;
  if (trigger.isCompliance) return EscalationPriority.MEDIUM;
  return EscalationPriority.LOW;
}
```

---

## SECTION 2 — Escalation Triggers & Flows

### 2.1 Medical Safety Escalations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MEDICAL SAFETY ESCALATION FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TRIGGER: Pain >3/10                                                        │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Athlete reports pain >3/10                                       │    │
│  │    ├─→ Coach: "Athlete has pain >3/10" (flag only)               │    │
│  │    │   └─→ Response Required: 24 hours                            │    │
│  │    └─→ Physio: Full detail (score, location, trend)              │    │
│  │        └─→ Response Required: 4 hours (URGENT)                    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  TRIGGER: New/Worsening Pain                                                │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Athlete reports new pain area or worsening pain                   │    │
│  │    └─→ Physio + Medical Staff: Full detail                        │    │
│  │        └─→ Response Required: 4 hours (URGENT)                    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  TRIGGER: Rehab Restriction Violation                                        │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Athlete attempts restricted exercise                             │    │
│  │    ├─→ Coach: "Athlete attempted restricted exercise: [exercise]" │    │
│  │    │   └─→ Response Required: 24 hours                            │    │
│  │    └─→ Physio: Full violation detail                              │    │
│  │        └─→ Response Required: 4 hours (URGENT)                    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  TRIGGER: Merlin Safety Keywords                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Merlin detects safety keywords (self-harm, severe distress)     │    │
│  │    └─→ Medical Staff: Conversation snippet                        │    │
│  │        └─→ Response Required: 4 hours (URGENT)                    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Load Safety Escalations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      LOAD SAFETY ESCALATION FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TRIGGER: ACWR Danger Zone (>1.5)                                          │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Athlete's ACWR exceeds 1.5                                       │    │
│  │    ├─→ Coach: "ACWR is [value] (danger zone)"                     │    │
│  │    │   └─→ Response Required: 48 hours                            │    │
│  │    └─→ S&C: Full load metrics (acute, chronic, ACWR)              │    │
│  │        └─→ Response Required: 24 hours (HIGH)                  │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  TRIGGER: High RPE Streak (≥9 for 3+ sessions)                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Athlete logs RPE ≥9 for 3+ consecutive sessions                   │    │
│  │    └─→ Coach: RPE trend, session dates                             │    │
│  │        └─→ Response Required: 48 hours (MEDIUM)                   │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Compliance Escalations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      COMPLIANCE ESCALATION FLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TRIGGER: Missed Check-ins (3+ days)                                       │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Athlete misses check-ins for 3+ days                              │    │
│  │    └─→ Coach: Compliance alert                                     │    │
│  │        └─→ Response Required: 48 hours (MEDIUM)                   │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  TRIGGER: Skipped Sessions (2+ consecutive)                               │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Athlete skips 2+ consecutive sessions                             │    │
│  │    └─→ Coach: Compliance alert                                     │    │
│  │        └─→ Response Required: 48 hours (MEDIUM)                   │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Mental Health Escalations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MENTAL HEALTH ESCALATION FLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TRIGGER: Sustained High Stress (5/5 for 3+ days)                          │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Athlete reports stress 5/5 for 3+ consecutive days                │    │
│  │    └─→ Physio + Medical Staff: Full wellness detail                │    │
│  │        └─→ Response Required: 72 hours (LOW)                      │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SECTION 3 — Escalation Workflow

### 3.1 Escalation Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ESCALATION LIFECYCLE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. TRIGGER FIRED                                                           │
│     └─→ System detects escalation trigger                                  │
│         └─→ Determines priority level                                      │
│             └─→ Identifies recipients                                       │
│                                                                              │
│  2. ESCALATION CREATED                                                      │
│     └─→ System creates escalation record                                   │
│         ├─→ Sets response deadline                                          │
│         ├─→ Notifies recipients                                             │
│         └─→ Displays in dashboard                                          │
│                                                                              │
│  3. ESCALATION ACKNOWLEDGED                                                 │
│     └─→ Recipient acknowledges escalation                                   │
│         ├─→ Status changes to "IN PROGRESS"                                 │
│         ├─→ Timer continues counting                                        │
│         └─→ Notes can be added                                             │
│                                                                              │
│  4. ESCALATION RESPONDED                                                    │
│     └─→ Recipient responds to escalation                                    │
│         ├─→ Status changes to "RESOLVED"                                   │
│         ├─→ Resolution notes added                                         │
│         └─→ All recipients notified                                        │
│                                                                              │
│  5. ESCALATION OVERDUE                                                      │
│     └─→ Response deadline passes                                            │
│         ├─→ Status changes to "OVERDUE"                                    │
│         ├─→ Escalates to next level (if applicable)                        │
│         └─→ Head Coach automatically notified                               │
│                                                                              │
│  6. ESCALATION ARCHIVED                                                     │
│     └─→ Escalation resolved for 7+ days                                    │
│         └─→ Moves to archived escalations                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Escalation Paths

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ESCALATION PATHS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  MEDICAL SAFETY (URGENT)                                                    │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Athlete → System → Physio (4h) → Medical Staff (if needed)      │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  LOAD SAFETY (HIGH)                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Athlete → System → S&C (24h) → Head Coach (if needed)            │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  COMPLIANCE (MEDIUM)                                                        │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Athlete → System → Coach (48h) → Head Coach (if needed)         │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  INFORMATIONAL (LOW)                                                       │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Athlete → System → Role-Specific (72h)                          │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SECTION 4 — Escalation UI States

### 4.1 Pending Escalation State

**Visual Indicators:**
- Badge: 🔴 Red "URGENT" or 🟠 Orange "HIGH"
- Priority indicator: Color-coded badge
- Timer: Countdown to response deadline
- Action button: "Respond" (enabled)

**UI Components:**
- Escalation card with priority badge
- Countdown timer (hours:minutes remaining)
- "Respond" button (primary color)
- Athlete name and trigger description

**Example:**
```
┌─────────────────────────────────────────────────────────┐
│  🔴 URGENT                                               │
│  Pain >3/10 Reported                                    │
│  Athlete: John Doe                                      │
│  Response Required: 3h 45m remaining                    │
│  [Respond]                                              │
└─────────────────────────────────────────────────────────┘
```

### 4.2 In Progress State

**Visual Indicators:**
- Badge: 🟡 Yellow "IN PROGRESS"
- Timer: Still counting, but shows "Responding"
- Action button: "Mark Resolved" (enabled)
- Notes field: Enabled for progress notes

**UI Components:**
- Escalation card with "IN PROGRESS" badge
- Timer showing "Responding for X hours"
- Notes textarea
- "Mark Resolved" button

**Example:**
```
┌─────────────────────────────────────────────────────────┐
│  🟡 IN PROGRESS                                         │
│  Pain >3/10 Reported                                    │
│  Athlete: John Doe                                      │
│  Responding for: 1h 23m                                │
│  Notes: [________________________]                      │
│  [Mark Resolved]                                        │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Resolved State

**Visual Indicators:**
- Badge: 🟢 Green "RESOLVED"
- Resolution notes: Visible
- Action link: "View Resolution"
- Archive: Moves to resolved after 7 days

**UI Components:**
- Escalation card with "RESOLVED" badge
- Resolution notes displayed
- "View Resolution" link
- Timestamp of resolution

**Example:**
```
┌─────────────────────────────────────────────────────────┐
│  🟢 RESOLVED                                            │
│  Pain >3/10 Reported                                    │
│  Athlete: John Doe                                      │
│  Resolved: 2 hours ago                                  │
│  Resolution: Assessed, no acute injury. Monitoring.     │
│  [View Resolution]                                      │
└─────────────────────────────────────────────────────────┘
```

### 4.4 Overdue State

**Visual Indicators:**
- Badge: 🔴 Red "OVERDUE"
- Timer: Shows hours overdue
- Action button: "Escalate" (enabled, urgent)
- Notification: Head Coach automatically notified

**UI Components:**
- Escalation card with "OVERDUE" badge
- Timer showing "X hours overdue"
- "Escalate" button (urgent styling)
- Auto-escalation notification

**Example:**
```
┌─────────────────────────────────────────────────────────┐
│  🔴 OVERDUE                                             │
│  Pain >3/10 Reported                                    │
│  Athlete: John Doe                                      │
│  Overdue by: 2h 15m                                     │
│  Head Coach notified automatically                      │
│  [Escalate]                                             │
└─────────────────────────────────────────────────────────┘
```

---

## SECTION 5 — Escalation Notification Rules

### 5.1 Notification Suppression

**Suppressed When:**
- Same notification sent within last 24 hours (unless escalation)
- More than 3 notifications sent in 1 hour (unless escalation)
- User has disabled notification category

**Never Suppressed:**
- Safety escalations (bypass suppression)
- Coach alerts (bypass suppression)
- Medical escalations (bypass suppression)

### 5.2 Notification Format

**Escalation Notification Must Include:**
- Subject: Clear safety concern (e.g., "Athlete [Name] reported pain >3/10")
- Priority: URGENT / HIGH / MEDIUM / LOW
- Recipient: Who needs to respond
- Response Deadline: When response is required
- Action Required: What recipient must do
- Athlete Context: Minimum necessary data (readiness, ACWR, recent activity)

---

## SECTION 6 — Implementation Requirements

### 6.1 Database Schema

```sql
CREATE TABLE escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES auth.users(id),
    trigger_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'overdue')),
    assigned_to UUID NOT NULL REFERENCES auth.users(id),
    assigned_role VARCHAR(50) NOT NULL,
    response_deadline TIMESTAMPTZ NOT NULL,
    response_required TEXT NOT NULL,
    athlete_context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    escalated_to UUID REFERENCES auth.users(id),
    escalated_at TIMESTAMPTZ
);
```

### 6.2 API Endpoints

**Required Endpoints:**
- `GET /api/staff/coordination/escalations` — Get active escalations
- `GET /api/staff/coordination/escalations/:id` — Get escalation details
- `POST /api/staff/coordination/escalations/:id/acknowledge` — Acknowledge escalation
- `POST /api/staff/coordination/escalations/:id/resolve` — Resolve escalation
- `POST /api/staff/coordination/escalations/:id/escalate` — Escalate to next level

### 6.3 UI Components

**Required Components:**
- `EscalationListComponent` — List of active escalations
- `EscalationCardComponent` — Individual escalation card
- `EscalationDetailComponent` — Escalation details modal
- `EscalationTimerComponent` — Countdown timer
- `EscalationNotificationComponent` — Real-time escalation alerts

---

## End of Document

**This contract is law. Escalation implementations that deviate are system failures.**


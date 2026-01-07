# Staff Coordination Dashboard Design — v1

**Contract Version:** 1.0  
**Date:** 2026-01-29  
**Status:** Normative (Binding)  
**Scope:** Staff coordination dashboard UI, escalation workflows, conflict resolution, responsibility matrix, permissions  
**Maintained By:** Product Architecture + Engineering  
**Supersedes:** None

**Dependencies (MUST Be Compatible With):**
- Staff Roles and Coordination Contract v1
- Notification & Escalation Authority Contract v1
- Coach Dashboard Authority Contract v1
- TODAY State Behavior Resolution Contract v1

---

## SECTION 1 — Overview

### 1.1 Purpose

This document defines the **Staff Coordination Dashboard** — a unified interface that enables all staff roles to:
- View their domain responsibilities and boundaries
- Monitor active escalations and conflicts
- Understand coordination workflows
- Resolve conflicts through structured pathways
- Track decision accountability

### 1.2 Core Principles

1. **Domain Ownership is Visual** — Each role sees their domain clearly marked
2. **Conflicts are Visible, Not Hidden** — All conflicts surface immediately
3. **Escalation Paths are Clear** — No ambiguity about who handles what
4. **Decisions are Traceable** — Every decision links to data and constraints
5. **Coordination is Structured** — No ad-hoc communication required

---

## SECTION 2 — Dashboard Structure

### 2.1 Dashboard Layout

The Staff Coordination Dashboard consists of **5 primary sections**:

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Role Badge | Team Name | Current Mode (Normal/Tournament) │
├─────────────────────────────────────────────────────────────┤
│  SECTION 1: Responsibility Matrix (Visual)                  │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐│
│  │ Domain      │ Owner       │ Authority   │ Status      ││
│  └─────────────┴─────────────┴─────────────┴─────────────┘│
├─────────────────────────────────────────────────────────────┤
│  SECTION 2: Active Escalations                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Priority | Athlete | Trigger | Assigned To | Deadline ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  SECTION 3: Conflict Resolution Center                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Conflict Type | Athlete | Roles Involved | Resolution   ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  SECTION 4: Daily Coordination Flow                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ What Changed | Who Needs to Know | Action Required     ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  SECTION 5: Decision Ledger (Recent)                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Decision | Made By | Date | Review Due | Status         ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Role-Specific Views

Each role sees a **filtered view** of the dashboard:

| Role | Sections Visible | Filters Applied |
|------|-----------------|-----------------|
| **Head Coach** | All sections | Full visibility, can resolve all conflicts |
| **Physiotherapist** | Escalations (medical), Conflicts (medical), Daily Delta (medical), Decisions (medical) | Medical domain only |
| **S&C Coach** | Escalations (load), Conflicts (load), Daily Delta (load), Decisions (load) | Load domain only |
| **Nutritionist** | Escalations (nutrition), Daily Delta (nutrition), Decisions (nutrition) | Nutrition domain only |
| **Psychologist** | Escalations (mental), Daily Delta (mental), Decisions (mental) | Mental domain only |
| **Assistant Coach** | Daily Delta (tactical), Decisions (tactical) | Tactical domain, read-only |

---

## SECTION 3 — Responsibility Matrix (Visual)

### 3.1 Matrix Structure

The Responsibility Matrix displays **domain ownership** and **authority boundaries**:

| Domain | Owner Role | Final Authority | Can Override? | Escalation Path |
|--------|-----------|----------------|---------------|-----------------|
| **Tactical Execution** | Head Coach | Head Coach | No (unless medical) | N/A |
| **Physical Load & Capacity** | S&C Coach | S&C Coach | No (unless medical) | Head Coach |
| **Medical Readiness & RTP** | Physiotherapist | Physio | No (non-negotiable) | Medical Director |
| **Fuel & Recovery Timing** | Nutritionist | Nutritionist | No (unless medical) | Head Coach |
| **Mental Readiness & Pressure** | Psychologist | Psychologist | No (unless medical) | Head Coach |

### 3.2 Visual Indicators

**Color Coding:**
- 🟢 **Green** — Domain is healthy, no conflicts
- 🟡 **Yellow** — Domain has active escalations
- 🔴 **Red** — Domain has unresolved conflicts
- ⚪ **Gray** — Domain not applicable to current role

**Status Badges:**
- `ACTIVE` — Domain owner is active, monitoring
- `ESCALATED` — Domain has active escalations
- `CONFLICT` — Domain has unresolved conflicts
- `LOCKED` — Domain locked (tournament mode, game day)

### 3.3 Interaction Rules

- **Click Domain** → View domain details, active decisions, constraints
- **Click Owner** → View owner's recent decisions, escalation history
- **Click Escalation Path** → View escalation workflow, who to contact

---

## SECTION 4 — Escalation Rules & Workflows

### 4.1 Escalation Priority Levels

| Priority | Response Time | Escalation Path | UI Indicator |
|----------|---------------|-----------------|--------------|
| **URGENT** (Medical Safety) | 1 hour | Direct to medical staff | 🔴 Red badge, pulsing |
| **HIGH** (Load Safety) | 24 hours | S&C → Head Coach | 🟠 Orange badge |
| **MEDIUM** (Compliance) | 48 hours | Coach → Head Coach | 🟡 Yellow badge |
| **LOW** (Informational) | 72 hours | Role-specific | ⚪ Gray badge |

### 4.2 Escalation Triggers (Visual Flow)

```
┌─────────────────────────────────────────────────────────────┐
│  ESCALATION TRIGGER FLOW                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Pain >3/10                                                 │
│    ├─→ Coach: "Athlete has pain >3/10" (flag only)         │
│    └─→ Physio: Full detail (score, location, trend)        │
│         └─→ Response Required: 4 hours                     │
│                                                              │
│  ACWR Danger Zone (>1.5)                                    │
│    ├─→ Coach: "ACWR is [value] (danger zone)"             │
│    └─→ S&C: Full load metrics (acute, chronic, ACWR)       │
│         └─→ Response Required: 48 hours                    │
│                                                              │
│  Rehab Restriction Violation                                │
│    ├─→ Coach: "Athlete attempted restricted exercise"      │
│    └─→ Physio: Full violation detail                        │
│         └─→ Response Required: 4 hours                     │
│                                                              │
│  Sustained High Stress (5/5 for 3+ days)                   │
│    └─→ Physio + Medical Staff: Full wellness detail         │
│         └─→ Response Required: 72 hours                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Escalation UI States

**State 1: Pending Escalation**
- Badge: 🔴 Red "URGENT" or 🟠 Orange "HIGH"
- Action: "Respond" button (links to athlete profile)
- Timer: Countdown to response deadline
- Auto-escalation: If deadline passes, escalates to next level

**State 2: In Progress**
- Badge: 🟡 Yellow "IN PROGRESS"
- Action: "Mark Resolved" button
- Notes: Staff can add progress notes
- Timer: Still counting, but shows "Responding"

**State 3: Resolved**
- Badge: 🟢 Green "RESOLVED"
- Action: "View Resolution" link
- Notes: Resolution notes visible
- Archive: Moves to resolved escalations after 7 days

**State 4: Overdue**
- Badge: 🔴 Red "OVERDUE"
- Action: "Escalate" button (escalates to next level)
- Notification: Head Coach automatically notified
- Timer: Shows hours overdue

---

## SECTION 5 — Conflict Scenarios & Resolution

### 5.1 Conflict Types

| Conflict Type | Description | Resolution Priority | UI State |
|---------------|-------------|---------------------|----------|
| **Domain Override** | Role attempts to override another role's domain | Medical > Load > Tactical | 🔴 Red "CONFLICT" |
| **Simultaneous Modification** | Two coaches modify same session | First modification wins | 🟡 Yellow "LOCKED" |
| **Constraint Violation** | Coach assigns exercise violating rehab restrictions | Reject modification, require physio clearance | 🔴 Red "BLOCKED" |
| **Schedule Conflict** | National coach vs club coach schedule | National coach precedence | 🟠 Orange "SCHEDULE CONFLICT" |
| **Decision Conflict** | Conflicting decisions on same athlete | Escalate to Head Coach | 🔴 Red "DECISION CONFLICT" |

### 5.2 Conflict Resolution Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  CONFLICT RESOLUTION WORKFLOW                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. CONFLICT DETECTED                                       │
│     └─→ System identifies conflict type                     │
│         └─→ Notifies all involved roles                      │
│                                                              │
│  2. CONFLICT DISPLAYED                                      │
│     └─→ Shows in Conflict Resolution Center                 │
│         ├─→ Conflict type                                    │
│         ├─→ Athlete affected                                 │
│         ├─→ Roles involved                                   │
│         ├─→ Current state (before conflict)                 │
│         └─→ Proposed resolutions                             │
│                                                              │
│  3. RESOLUTION OPTIONS                                      │
│     ├─→ Option A: Accept first modification (default)      │
│     ├─→ Option B: Accept second modification               │
│     ├─→ Option C: Escalate to Head Coach                   │
│     └─→ Option D: Manual resolution (requires notes)       │
│                                                              │
│  4. RESOLUTION EXECUTED                                     │
│     └─→ System applies resolution                           │
│         ├─→ Logs resolution in Decision Ledger              │
│         ├─→ Notifies all involved roles                     │
│         └─→ Updates conflict status to "RESOLVED"           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Conflict UI States

**State 1: Active Conflict**
- Badge: 🔴 Red "CONFLICT"
- Action: "Resolve" button opens resolution dialog
- Details: Shows conflict type, involved roles, athlete
- Timer: Shows time since conflict detected

**State 2: Resolution Pending**
- Badge: 🟡 Yellow "RESOLVING"
- Action: "View Resolution" link
- Notes: Shows resolution proposal, awaiting approval
- Participants: Shows who needs to approve

**State 3: Resolved**
- Badge: 🟢 Green "RESOLVED"
- Action: "View Resolution" link
- Notes: Shows final resolution, who resolved, when
- Archive: Moves to resolved conflicts after 30 days

---

## SECTION 6 — Permissions Matrix

### 6.1 Read Permissions

| Data Category | Head Coach | Physio | S&C | Nutrition | Psych | Assistant Coach |
|---------------|------------|--------|-----|-----------|-------|-----------------|
| **Compliance Data** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Readiness Score** | ⚠️ Opt-in | ✅ Full | ⚠️ Opt-in | ⚠️ Opt-in | ✅ Full | ⚠️ Opt-in |
| **Wellness Answers** | ⚠️ Opt-in | ✅ Full | ⚠️ Opt-in | ⚠️ Opt-in | ✅ Full | ❌ No |
| **Pain Detail** | ⚠️ Safety only | ✅ Full | ❌ No | ❌ No | ❌ No | ❌ No |
| **Load Metrics** | ✅ Summary | ✅ Summary | ✅ Full | ✅ Summary | ✅ Summary | ✅ Summary |
| **Medical Status** | ✅ Summary | ✅ Full | ✅ Summary | ❌ No | ❌ No | ✅ Summary |
| **Rehab Protocols** | ✅ Active only | ✅ Full | ✅ Constraints | ❌ No | ❌ No | ✅ Active only |
| **Nutrition Data** | ❌ No | ❌ No | ❌ No | ✅ Full | ❌ No | ❌ No |
| **Mental Readiness** | ⚠️ Opt-in | ❌ No | ❌ No | ❌ No | ✅ Full | ⚠️ Opt-in |

**Legend:**
- ✅ **Full** — Complete access
- ⚠️ **Opt-in** — Requires athlete consent
- ✅ **Summary** — Summary/aggregate data only
- ❌ **No** — No access

### 6.2 Write Permissions

| Action | Head Coach | Physio | S&C | Nutrition | Psych | Assistant Coach |
|--------|------------|--------|-----|-----------|-------|-----------------|
| **Modify Sessions** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes (tactical only) |
| **Assign Programs** | ✅ Yes | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Set Rehab Protocols** | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **Set Load Constraints** | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Set Nutrition Plans** | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Set Mental Protocols** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No |
| **Override ACWR** | ✅ Yes (with acknowledgment) | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Override Rehab** | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **Log Decisions** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Resolve Conflicts** | ✅ Yes (all) | ✅ Yes (medical) | ✅ Yes (load) | ✅ Yes (nutrition) | ✅ Yes (mental) | ❌ No |

### 6.3 Permission UI States

**State 1: Allowed Action**
- Button: Enabled, primary color
- Tooltip: None (action is allowed)
- Icon: Standard action icon

**State 2: Requires Consent**
- Button: Enabled, but with ⚠️ warning icon
- Tooltip: "Athlete consent required. Some data may be hidden."
- Icon: Warning icon next to action

**State 3: Requires Acknowledgment**
- Button: Enabled, but opens acknowledgment dialog first
- Tooltip: "This action requires acknowledgment of risks."
- Icon: Info icon next to action

**State 4: Blocked Action**
- Button: Disabled, grayed out
- Tooltip: "This action is not permitted for your role."
- Icon: Lock icon

**State 5: Escalation Required**
- Button: Enabled, but opens escalation dialog first
- Tooltip: "This action requires escalation to [Role]."
- Icon: Escalation icon

---

## SECTION 7 — Daily Coordination Flow

### 7.1 Daily Delta View

Each role sees **what changed since yesterday** in their domain:

**Head Coach View:**
- Availability changes (injuries, clearances)
- Compliance issues (missed sessions, check-ins)
- Safety flags (pain, ACWR danger)
- Schedule changes (practices, games)

**Physiotherapist View:**
- Pain reports (new, worsening)
- Symptom shifts (location, intensity)
- Rehab protocol violations
- Clearance status changes

**S&C Coach View:**
- Load deviations (ACWR spikes, RPE trends)
- Compliance with load prescriptions
- Recovery indicators
- Fatigue markers

**Nutritionist View:**
- Hydration compliance
- Missed fueling targets
- Energy availability indicators
- Competition schedule changes

**Psychologist View:**
- Mental readiness volatility
- Stress indicators
- Confidence trends
- Cognitive load patterns

### 7.2 Coordination UI States

**State 1: New Change**
- Badge: 🔵 Blue "NEW"
- Action: "Review" button
- Details: Shows what changed, when, why
- Notification: Highlighted in dashboard

**State 2: Acknowledged**
- Badge: ⚪ Gray "SEEN"
- Action: "View Details" link
- Details: Still visible, but not highlighted
- Archive: Moves to history after 7 days

**State 3: Action Required**
- Badge: 🟡 Yellow "ACTION REQUIRED"
- Action: "Take Action" button (links to relevant interface)
- Details: Shows what action is needed, deadline
- Escalation: Auto-escalates if no action taken

---

## SECTION 8 — UI Component Specifications

### 8.1 Responsibility Matrix Component

**Component Name:** `StaffResponsibilityMatrixComponent`

**Props:**
```typescript
interface ResponsibilityMatrixProps {
  currentRole: StaffRole;
  domains: Domain[];
  conflicts: Conflict[];
  escalations: Escalation[];
}
```

**Visual Design:**
- Grid layout: Domains × Roles
- Color-coded cells based on ownership and status
- Clickable cells → Domain detail modal
- Hover tooltips → Quick info

### 8.2 Escalation List Component

**Component Name:** `EscalationListComponent`

**Props:**
```typescript
interface EscalationListProps {
  escalations: Escalation[];
  currentRole: StaffRole;
  onResolve: (escalationId: string) => void;
}
```

**Visual Design:**
- Table layout with sortable columns
- Priority badges (color-coded)
- Countdown timers for deadlines
- Filter by priority, status, athlete

### 8.3 Conflict Resolution Component

**Component Name:** `ConflictResolutionComponent`

**Props:**
```typescript
interface ConflictResolutionProps {
  conflict: Conflict;
  currentRole: StaffRole;
  onResolve: (resolution: ConflictResolution) => void;
}
```

**Visual Design:**
- Modal dialog for conflict details
- Side-by-side comparison of conflicting states
- Resolution options (radio buttons or dropdown)
- Notes field for manual resolution
- "Resolve" button (disabled until resolution selected)

### 8.4 Daily Delta Component

**Component Name:** `DailyDeltaComponent`

**Props:**
```typescript
interface DailyDeltaProps {
  changes: DeltaChange[];
  currentRole: StaffRole;
  onAcknowledge: (changeId: string) => void;
}
```

**Visual Design:**
- Card layout with change cards
- Grouped by category (medical, load, nutrition, etc.)
- "New" badges for unacknowledged changes
- Expandable cards for details
- "Acknowledge All" button

### 8.5 Decision Ledger Component

**Component Name:** `DecisionLedgerComponent`

**Props:**
```typescript
interface DecisionLedgerProps {
  decisions: Decision[];
  currentRole: StaffRole;
  onReview: (decisionId: string) => void;
}
```

**Visual Design:**
- Timeline layout (vertical)
- Decision cards with expandable details
- Review due badges (color-coded by urgency)
- Filter by status, role, athlete
- "Create Decision" button (opens form)

---

## SECTION 9 — Implementation Requirements

### 9.1 Database Schema

See `STAFF_ROLES_AND_COORDINATION_CONTRACT_v1.md` Section 4 for database schemas:
- `decision_ledger` table
- `staff_flags` table
- `daily_delta_log` table
- `staff_alignment_metrics` table

### 9.2 API Endpoints

**Required Endpoints:**
- `GET /api/staff/coordination/dashboard` — Get dashboard data for current role
- `GET /api/staff/coordination/escalations` — Get active escalations
- `GET /api/staff/coordination/conflicts` — Get active conflicts
- `GET /api/staff/coordination/daily-delta` — Get daily changes
- `GET /api/staff/coordination/decisions` — Get recent decisions
- `POST /api/staff/coordination/conflicts/:id/resolve` — Resolve conflict
- `POST /api/staff/coordination/escalations/:id/resolve` — Resolve escalation
- `POST /api/staff/coordination/decisions` — Create decision
- `POST /api/staff/coordination/delta/:id/acknowledge` — Acknowledge change

### 9.3 UI Routes

**Route Structure:**
- `/staff/coordination` — Main dashboard (role-filtered)
- `/staff/coordination/escalations` — Escalations view
- `/staff/coordination/conflicts` — Conflicts view
- `/staff/coordination/decisions` — Decision ledger view
- `/staff/coordination/responsibility-matrix` — Responsibility matrix view

---

## SECTION 10 — Acceptance Criteria

### 10.1 Functional Requirements

- [ ] Dashboard displays role-filtered view correctly
- [ ] Responsibility matrix shows correct domain ownership
- [ ] Escalations display with correct priority and deadlines
- [ ] Conflicts are detected and displayed immediately
- [ ] Daily delta shows changes relevant to current role
- [ ] Decision ledger displays recent decisions
- [ ] All actions respect permission boundaries
- [ ] Conflict resolution workflow functions correctly
- [ ] Escalation workflows function correctly

### 10.2 UI/UX Requirements

- [ ] Color coding is consistent and accessible
- [ ] Badges are clear and informative
- [ ] Tooltips provide helpful context
- [ ] Modals are accessible and keyboard-navigable
- [ ] Loading states are clear
- [ ] Error states are informative
- [ ] Responsive design works on mobile

### 10.3 Performance Requirements

- [ ] Dashboard loads in < 2 seconds
- [ ] Real-time updates (WebSocket) for escalations and conflicts
- [ ] Pagination for large lists (escalations, decisions)
- [ ] Efficient filtering and sorting

---

## Appendix A — Related Documents

- **Staff Roles and Coordination Contract v1** — Role definitions, coordination model
- **Notification & Escalation Authority Contract v1** — Escalation triggers, rules
- **Coach Dashboard Authority Contract v1** — Multi-coach conflict resolution
- **TODAY State Behavior Resolution Contract v1** — Conflict scenario mapping

---

## End of Document

**This contract is law. Dashboard implementations that deviate are system failures.**


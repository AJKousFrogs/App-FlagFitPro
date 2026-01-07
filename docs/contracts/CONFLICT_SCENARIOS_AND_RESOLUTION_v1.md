# Conflict Scenarios and Resolution — v1

**Contract Version:** 1.0  
**Date:** 2026-01-29  
**Status:** Normative (Binding)  
**Scope:** Conflict scenario mapping and resolution workflows  
**Maintained By:** Product Architecture + Engineering

---

## SECTION 1 — Conflict Types

### 1.1 Domain Override Conflicts

**Scenario:** Role attempts to override another role's domain authority.

**Example:**
- Coach attempts to assign exercise that violates physio's rehab restrictions
- S&C attempts to override psychologist's cognitive load recommendations
- Nutritionist attempts to override S&C's load architecture

**Resolution Priority:**
1. Medical domain (highest priority)
2. Load domain
3. Tactical domain (lowest priority)

**Resolution Process:**
1. System detects override attempt
2. System blocks action
3. System notifies domain owner
4. System requires escalation if override is necessary
5. Head coach approves escalation (if non-medical)

### 1.2 Simultaneous Modification Conflicts

**Scenario:** Two coaches modify the same session simultaneously.

**Example:**
- Club coach modifies session at 09:00
- National coach attempts modification at 09:05
- Both modifications affect same athlete, same session

**Resolution Priority:**
1. First modification wins (timestamp-based)
2. National coach precedence (if schedule-related)
3. Club coach precedence (if program-related)
4. System default (reject both, require manual resolution)

**Resolution Process:**
1. System detects simultaneous modification
2. System identifies first modification (by timestamp)
3. System accepts first modification
4. System rejects second modification
5. System notifies both coaches of conflict
6. System provides communication pathway

### 1.3 Constraint Violation Conflicts

**Scenario:** Coach assigns exercise violating rehab restrictions.

**Example:**
- Physio sets restriction: "No sprinting above 80% intensity"
- Coach assigns sprint session at 90% intensity
- System detects violation

**Resolution Priority:**
1. Medical constraints (non-negotiable)
2. Load constraints
3. Tactical constraints

**Resolution Process:**
1. System detects constraint violation
2. System blocks assignment
3. System warns coach of violation
4. System requires physio clearance for override
5. System logs override attempt (if coach proceeds)

### 1.4 Schedule Conflicts

**Scenario:** National coach vs club coach schedule conflict.

**Example:**
- National team camp conflicts with club match
- National coach schedules practice
- Club coach sees conflict, cannot override

**Resolution Priority:**
1. National coach precedence (schedule-related)
2. Club coach precedence (program-related)
3. First modification wins (if both schedule-related)

**Resolution Process:**
1. System detects schedule conflict
2. System applies precedence rules
3. System notifies both coaches
4. System displays conflict in dashboard
5. System requires manual resolution if precedence unclear

### 1.5 Decision Conflicts

**Scenario:** Conflicting decisions on same athlete.

**Example:**
- S&C reduces load: "Reduce sprint volume by 50%"
- Coach increases intensity: "Increase sprint intensity for game prep"
- Both decisions affect same athlete, same time period

**Resolution Priority:**
1. Medical decisions (highest)
2. Load decisions
3. Tactical decisions (lowest)

**Resolution Process:**
1. System detects conflicting decisions
2. System alerts both decision makers
3. System requires resolution
4. System escalates to head coach if unresolved
5. System logs resolution in Decision Ledger

---

## SECTION 2 — Conflict Resolution Workflows

### 2.1 Conflict Detection

**Trigger Events:**
- Domain override attempt
- Simultaneous modification
- Constraint violation
- Schedule conflict
- Decision conflict

**Detection Logic:**
```typescript
interface ConflictDetection {
  conflictType: ConflictType;
  detectedAt: Timestamp;
  involvedRoles: StaffRole[];
  athleteId: string;
  conflictDetails: ConflictDetails;
  resolutionRequired: boolean;
}
```

### 2.2 Conflict Notification

**Notification Recipients:**
- All involved roles
- Head coach (if escalation required)
- Domain owner (if override attempted)

**Notification Content:**
- Conflict type
- Athlete affected
- Roles involved
- Current state (before conflict)
- Proposed resolutions

### 2.3 Conflict Resolution Options

**Option A: Accept First Modification (Default)**
- Applies to: Simultaneous modifications
- Process: Accept first modification, reject second
- Notification: Notify both coaches

**Option B: Accept Second Modification**
- Applies to: Simultaneous modifications (if second is higher priority)
- Process: Reject first, accept second
- Notification: Notify both coaches

**Option C: Escalate to Head Coach**
- Applies to: All conflict types
- Process: Send conflict to head coach for resolution
- Notification: Notify head coach, all involved roles

**Option D: Manual Resolution**
- Applies to: Complex conflicts
- Process: Require notes, manual intervention
- Notification: Notify all involved roles

### 2.4 Conflict Resolution Execution

**Steps:**
1. System applies resolution
2. System logs resolution in Decision Ledger
3. System notifies all involved roles
4. System updates conflict status to "RESOLVED"
5. System archives conflict after 30 days

---

## SECTION 3 — Conflict Scenario Mapping

### 3.1 Scenario 1: Rehab Protocol + Team Practice

**Inputs:**
- `injuryProtocolActive: true`
- `sessionOverride: "rehab_protocol"`
- `teamPracticeScheduled: true`

**Conflict Type:** Domain Override

**Resolution:**
- Rehab protocol wins (medical priority)
- Team practice is visible but not executable
- Athlete sees: "Return-to-Play Protocol Active. Team practice today, but you're following rehab plan."

**Forbidden Actions:**
- Showing team practice exercises
- Suggesting "light participation" in practice
- Allowing athlete to override rehab protocol
- Hiding practice from schedule

### 3.2 Scenario 2: National Coach vs Club Coach Schedule

**Inputs:**
- `nationalCoachSchedule: "practice"`
- `clubCoachSchedule: "match"`
- `sameDate: true`

**Conflict Type:** Schedule Conflict

**Resolution:**
- National coach precedence (schedule-related)
- Club coach sees conflict, cannot override
- System displays: "National team camp conflicts with club match → National camp takes precedence"

**Forbidden Actions:**
- Allowing club coach to override national schedule
- Hiding national schedule from club coach
- Allowing both schedules simultaneously

### 3.3 Scenario 3: S&C Load Reduction + Coach Intensity Increase

**Inputs:**
- `sAndCDecision: "Reduce sprint volume by 50%"`
- `coachDecision: "Increase sprint intensity for game prep"`
- `sameAthlete: true`
- `sameTimePeriod: true`

**Conflict Type:** Decision Conflict

**Resolution:**
- System detects conflict on creation
- System alerts both decision makers
- System requires resolution
- System escalates to head coach if unresolved

**Forbidden Actions:**
- Allowing both decisions simultaneously
- Auto-resolving without notification
- Hiding conflict from head coach

### 3.4 Scenario 4: Coach Assigns Restricted Exercise

**Inputs:**
- `physioRestriction: "No sprinting above 80% intensity"`
- `coachAssignment: "Sprint session at 90% intensity"`

**Conflict Type:** Constraint Violation

**Resolution:**
- System blocks assignment
- System warns coach of violation
- System requires physio clearance for override
- System logs override attempt (if coach proceeds)

**Forbidden Actions:**
- Allowing assignment without clearance
- Hiding violation from physio
- Auto-overriding restrictions

### 3.5 Scenario 5: Simultaneous Session Modifications

**Inputs:**
- `clubCoachModification: "09:00"`
- `nationalCoachModification: "09:05"`
- `sameSession: true`

**Conflict Type:** Simultaneous Modification

**Resolution:**
- First modification wins (timestamp-based)
- System accepts club coach's modification
- System rejects national coach's modification
- System notifies both coaches

**Forbidden Actions:**
- Allowing both modifications
- Auto-resolving without notification
- Hiding conflict from coaches

---

## SECTION 4 — Conflict Resolution UI States

### 4.1 Active Conflict State

**Visual Indicators:**
- 🔴 Red "CONFLICT" badge
- Conflict type displayed
- Athlete name highlighted
- Roles involved listed
- Time since conflict detected

**Actions Available:**
- "Resolve" button → Opens resolution dialog
- "View Details" link → Shows conflict details
- "Escalate" button → Escalates to head coach

### 4.2 Resolution Pending State

**Visual Indicators:**
- 🟡 Yellow "RESOLVING" badge
- Resolution proposal displayed
- Approval status shown
- Participants listed

**Actions Available:**
- "Approve" button → Approves resolution
- "Reject" button → Rejects resolution
- "View Proposal" link → Shows resolution details

### 4.3 Resolved State

**Visual Indicators:**
- 🟢 Green "RESOLVED" badge
- Resolution details displayed
- Who resolved, when resolved
- Final outcome shown

**Actions Available:**
- "View Resolution" link → Shows resolution details
- "Archive" button → Archives conflict (after 30 days)

---

## SECTION 5 — Conflict Prevention Mechanisms

### 5.1 Pre-Flight Checks

**Before allowing action:**
1. Check domain authority
2. Check active constraints
3. Check existing conflicts
4. Check session state
5. Check permission boundaries

**If any check fails:**
- Block action
- Show warning
- Require escalation (if necessary)

### 5.2 Real-Time Conflict Detection

**During action:**
1. Monitor for simultaneous modifications
2. Monitor for constraint violations
3. Monitor for domain overrides
4. Alert immediately if conflict detected

**If conflict detected:**
- Block action
- Notify involved roles
- Display conflict in dashboard

### 5.3 Conflict Prevention Rules

**Rule 1: No Direct Overrides**
- Coaches cannot override medical
- S&C cannot override psychology
- Nutrition cannot override load

**Rule 2: One Message, One Authority**
- Athlete never receives conflicting instructions
- App merges inputs
- App shows who owns each instruction

**Rule 3: Shared Language, Not Shared Opinions**
- Everything expressed as status, threshold, recommendation, constraint
- No feelings, no debates

---

## SECTION 6 — Implementation Requirements

### 6.1 Database Schema

**Conflict Table:**
```sql
CREATE TABLE conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conflict_type VARCHAR(50) NOT NULL,
    athlete_id UUID NOT NULL REFERENCES auth.users(id),
    detected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    involved_roles TEXT[] NOT NULL,
    conflict_details JSONB NOT NULL,
    resolution_status VARCHAR(20) DEFAULT 'active',
    resolution_type VARCHAR(50),
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### 6.2 API Endpoints

**Required Endpoints:**
- `GET /api/staff/coordination/conflicts` — Get active conflicts
- `GET /api/staff/coordination/conflicts/:id` — Get conflict details
- `POST /api/staff/coordination/conflicts/:id/resolve` — Resolve conflict
- `POST /api/staff/coordination/conflicts/:id/escalate` — Escalate conflict

### 6.3 UI Components

**Required Components:**
- `ConflictListComponent` — List of active conflicts
- `ConflictDetailComponent` — Conflict details modal
- `ConflictResolutionComponent` — Resolution dialog
- `ConflictNotificationComponent` — Real-time conflict alerts

---

## End of Document

**This contract is law. Conflict resolution implementations that deviate are system failures.**


# Staff Coordination Dashboard — Implementation Summary

**Date:** 2026-01-29  
**Status:** Design Complete, Ready for Implementation  
**Scope:** Staff coordination dashboard, escalation rules, conflict resolution, responsibility matrix, permissions

---

## Overview

This document summarizes the comprehensive design for the **Staff Coordination Dashboard** — a unified interface that enables all staff roles to coordinate effectively, resolve conflicts, and maintain accountability.

---

## What Was Created

### 1. Staff Coordination Dashboard Design (`STAFF_COORDINATION_DASHBOARD_DESIGN_v1.md`)

**Comprehensive dashboard design document** covering:
- Dashboard structure (5 primary sections)
- Role-specific views and filters
- UI component specifications
- API endpoint requirements
- Implementation requirements

**Key Features:**
- Responsibility Matrix (visual domain ownership)
- Active Escalations (priority-based)
- Conflict Resolution Center (structured workflows)
- Daily Coordination Flow (what changed since yesterday)
- Decision Ledger (recent decisions)

### 2. Staff Responsibility Matrix (`STAFF_RESPONSIBILITY_MATRIX_v1.md`)

**Visual responsibility matrix** showing:
- Domain ownership (who owns what)
- Authority hierarchy (who has final say)
- Coordination flow (how domains interact)
- Critical 1:1 relationships (key staff pairings)
- Conflict prevention mechanisms

**Key Features:**
- Color-coded status indicators
- Interactive grid layout
- Domain status tracking
- Role status indicators

### 3. Conflict Scenarios and Resolution (`CONFLICT_SCENARIOS_AND_RESOLUTION_v1.md`)

**Conflict scenario mapping** covering:
- 5 conflict types (domain override, simultaneous modification, constraint violation, schedule conflict, decision conflict)
- Resolution workflows (step-by-step processes)
- Conflict scenario mapping (5 detailed scenarios)
- UI states (active, resolving, resolved)
- Prevention mechanisms

**Key Features:**
- Conflict detection logic
- Resolution options (4 options per conflict)
- Real-time conflict alerts
- Conflict prevention rules

### 4. Permissions and UI States Matrix (`PERMISSIONS_AND_UI_STATES_MATRIX_v1.md`)

**Exact permissions matrix** defining:
- Read permissions (9 data categories × 6 roles)
- Write permissions (11 actions × 6 roles)
- Session modification permissions (6 states × 6 roles)
- Escalation permissions (5 types × 6 roles)
- Conflict resolution permissions (5 types × 6 roles)
- Decision ledger permissions (6 actions × 6 roles)

**Key Features:**
- 10 UI states (allowed, requires consent, blocked, etc.)
- State machine implementation
- Permission check functions
- Real-time permission updates

### 5. Escalation Rules Visualization (`ESCALATION_RULES_VISUALIZATION_v1.md`)

**Visual escalation rules** covering:
- 4 priority levels (URGENT, HIGH, MEDIUM, LOW)
- Escalation triggers (medical safety, load safety, compliance, mental health)
- Escalation workflows (6-step lifecycle)
- Escalation paths (role-specific)
- UI states (pending, in progress, resolved, overdue)

**Key Features:**
- Priority determination logic
- Response time requirements
- Notification suppression rules
- Auto-escalation on overdue

---

## Key Design Principles

### 1. Domain Ownership is Visual
Each role sees their domain clearly marked with color-coded status indicators.

### 2. Conflicts are Visible, Not Hidden
All conflicts surface immediately in the Conflict Resolution Center with clear resolution pathways.

### 3. Escalation Paths are Clear
No ambiguity about who handles what, with priority-based routing and response deadlines.

### 4. Decisions are Traceable
Every decision links to data and constraints, logged in the Decision Ledger.

### 5. Coordination is Structured
No ad-hoc communication required — the app provides structured workflows.

---

## Dashboard Structure

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Role Badge | Team Name | Current Mode             │
├─────────────────────────────────────────────────────────────┤
│  SECTION 1: Responsibility Matrix (Visual)                  │
│  SECTION 2: Active Escalations                              │
│  SECTION 3: Conflict Resolution Center                     │
│  SECTION 4: Daily Coordination Flow                        │
│  SECTION 5: Decision Ledger (Recent)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Role-Specific Views

| Role | Sections Visible | Filters Applied |
|------|-----------------|-----------------|
| **Head Coach** | All sections | Full visibility, can resolve all conflicts |
| **Physiotherapist** | Escalations (medical), Conflicts (medical), Daily Delta (medical), Decisions (medical) | Medical domain only |
| **S&C Coach** | Escalations (load), Conflicts (load), Daily Delta (load), Decisions (load) | Load domain only |
| **Nutritionist** | Escalations (nutrition), Daily Delta (nutrition), Decisions (nutrition) | Nutrition domain only |
| **Psychologist** | Escalations (mental), Daily Delta (mental), Decisions (mental) | Mental domain only |
| **Assistant Coach** | Daily Delta (tactical), Decisions (tactical) | Tactical domain, read-only |

---

## Conflict Types & Resolution

### Conflict Types
1. **Domain Override** — Role attempts to override another role's domain
2. **Simultaneous Modification** — Two coaches modify same session
3. **Constraint Violation** — Coach assigns exercise violating restrictions
4. **Schedule Conflict** — National coach vs club coach schedule
5. **Decision Conflict** — Conflicting decisions on same athlete

### Resolution Priority
1. Medical domain (highest priority)
2. Load domain
3. Tactical domain (lowest priority)

---

## Escalation Priority Levels

| Priority | Response Time | Escalation Path | UI Indicator |
|----------|---------------|-----------------|--------------|
| **URGENT** (Medical Safety) | 1 hour | Direct to medical staff | 🔴 Red badge, pulsing |
| **HIGH** (Load Safety) | 24 hours | S&C → Head Coach | 🟠 Orange badge |
| **MEDIUM** (Compliance) | 48 hours | Coach → Head Coach | 🟡 Yellow badge |
| **LOW** (Informational) | 72 hours | Role-specific | ⚪ Gray badge |

---

## Permissions Summary

### Read Permissions
- **Compliance Data:** All roles have full access
- **Readiness Score:** Opt-in for coaches, full for medical/psych
- **Wellness Answers:** Opt-in for coaches, full for medical/psych
- **Pain Detail:** Safety only for coaches, full for physio
- **Load Metrics:** Summary for most, full for S&C
- **Medical Status:** Summary for coaches, full for physio
- **Rehab Protocols:** Active only for coaches, full for physio
- **Nutrition Data:** Full for nutritionist only
- **Mental Readiness:** Opt-in for coaches, full for psych

### Write Permissions
- **Modify Sessions:** Head Coach and Assistant Coach (tactical only)
- **Assign Programs:** Head Coach and S&C Coach
- **Set Rehab Protocols:** Physiotherapist only
- **Set Load Constraints:** S&C Coach only
- **Set Nutrition Plans:** Nutritionist only
- **Set Mental Protocols:** Psychologist only
- **Override ACWR:** Head Coach and S&C Coach (with acknowledgment)
- **Override Rehab:** Physiotherapist only
- **Log Decisions:** All roles
- **Resolve Conflicts:** Domain-specific (Head Coach can resolve all)

---

## Implementation Requirements

### Database Schema
- `escalations` table (escalation tracking)
- `conflicts` table (conflict tracking)
- `decision_ledger` table (decision accountability)
- `daily_delta_log` table (daily changes)
- `staff_flags` table (do not escalate flags)

### API Endpoints
- `GET /api/staff/coordination/dashboard` — Dashboard data
- `GET /api/staff/coordination/escalations` — Active escalations
- `GET /api/staff/coordination/conflicts` — Active conflicts
- `GET /api/staff/coordination/daily-delta` — Daily changes
- `GET /api/staff/coordination/decisions` — Recent decisions
- `POST /api/staff/coordination/conflicts/:id/resolve` — Resolve conflict
- `POST /api/staff/coordination/escalations/:id/resolve` — Resolve escalation

### UI Components
- `StaffResponsibilityMatrixComponent` — Responsibility matrix
- `EscalationListComponent` — Escalation list
- `ConflictResolutionComponent` — Conflict resolution
- `DailyDeltaComponent` — Daily changes
- `DecisionLedgerComponent` — Decision ledger

### UI Routes
- `/staff/coordination` — Main dashboard
- `/staff/coordination/escalations` — Escalations view
- `/staff/coordination/conflicts` — Conflicts view
- `/staff/coordination/decisions` — Decision ledger view
- `/staff/coordination/responsibility-matrix` — Responsibility matrix view

---

## Related Documents

1. **Staff Roles and Coordination Contract v1** — Role definitions, coordination model
2. **Notification & Escalation Authority Contract v1** — Escalation triggers, rules
3. **Coach Dashboard Authority Contract v1** — Multi-coach conflict resolution
4. **TODAY State Behavior Resolution Contract v1** — Conflict scenario mapping

---

## Next Steps

### Immediate Actions
1. **Review all design documents** — Ensure alignment with existing contracts
2. **Create database migrations** — Implement required database schemas
3. **Build API endpoints** — Implement required API endpoints
4. **Create UI components** — Build dashboard components
5. **Implement real-time updates** — WebSocket integration for live updates

### Testing Requirements
- Test role-specific views
- Test conflict detection and resolution
- Test escalation workflows
- Test permission boundaries
- Test real-time updates

---

## Summary

This design provides:
- ✅ **Visual responsibility matrix** — Clear domain ownership
- ✅ **Structured escalation workflows** — Priority-based routing
- ✅ **Conflict resolution pathways** — Clear resolution processes
- ✅ **Exact permissions matrix** — Precise UI states
- ✅ **Daily coordination flow** — What changed since yesterday

**The app replaces meetings with structure, replaces opinions with domains, and replaces pressure with traceable decisions.**

---

**End of Summary**


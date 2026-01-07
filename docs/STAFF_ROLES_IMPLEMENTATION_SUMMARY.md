# Staff Roles and Coordination Implementation Summary

**Date:** 2026-01-08  
**Status:** Contract Created, Database Migration Prepared, TypeScript Types Updated

---

## Overview

This document summarizes the implementation of comprehensive staff role definitions, coordination rules, and identification of missing organizational features based on detailed requirements provided.

---

## What Was Created

### 1. Comprehensive Contract Document

**File:** `docs/contracts/STAFF_ROLES_AND_COORDINATION_CONTRACT_v1.md`

This normative contract defines:

#### Role Definitions (6 Roles)
- **Head Coach** — Tactical execution authority
- **Assistant Coaches** (Offensive/Defensive Coordinators) — Position-specific training
- **Physiotherapist** — Medical readiness & RTP authority
- **Strength & Conditioning Coach** — Physical load & capacity authority
- **Nutritionist** — Fuel & recovery timing authority
- **Psychologist** — Mental readiness & pressure control authority

#### Coordination Model
- Domain ownership (non-negotiable)
- Daily coordination flow
- Critical 1:1 relationships
- Conflict prevention mechanisms
- Game week & tournament mode

#### Missing Organizational Features (8 Features)
1. **Decision Ledger** — Critical missing feature for decision accountability
2. **Explicit Unknowns and Data Confidence** — Prevents dangerous overconfidence
3. **"Do Not Escalate" Flag** — Reduces noise and overreaction
4. **Recovery as First-Class Citizen** — Closes critical gap in load management
5. **Role-Based Daily Delta** — Saves time and focuses attention
6. **Pre-Mortem Mode** — Structured humility before high-stakes periods
7. **Consent Visibility for Staff** — Protects trust and prevents misinterpretation
8. **Staff Alignment Score** — Internal metric for coordination improvement

---

### 2. Database Migration

**File:** `database/migrations/063_add_psychologist_role.sql`

**Changes:**
- Added `psychologist` role to `team_members` role constraint
- Added `psychologist` role to `team_invitations` role constraint
- Updated `can_view_health_data()` function to include psychologist
- Updated `is_team_staff()` function to include psychologist
- Added psychologist entry to `staff_roles` reference table

**Status:** Ready to apply

---

### 3. TypeScript Type Updates

**Files Updated:**
- `angular/src/app/features/roster/roster.models.ts`
- `angular/src/app/features/roster/roster.service.ts`

**Changes:**
- Added `psychologist` to `TeamRole` type
- Added psychologist to `ROLE_OPTIONS` array
- Added psychologist to `GROUPED_ROLE_OPTIONS` array
- Added psychologist to `canViewHealthData` computed property

**Status:** Complete

---

## Key Principles Established

### 1. Domain Ownership
Each role owns exactly one domain. Overlap is visible, but authority is not shared.

| Domain | Owner | Final Authority |
|--------|-------|----------------|
| Tactical execution | Head Coach / Coordinators | Head Coach |
| Physical load & capacity | Strength & Conditioning | S&C |
| Medical readiness & RTP | Physiotherapist | Physio |
| Fuel & recovery timing | Nutritionist | Nutrition |
| Mental readiness & pressure control | Psychologist | Psychology |

### 2. Coordination Flow
**Medical → Physical → Tactical**

Constraints flow upward, not sideways. The app blocks reverse pressure.

### 3. Decision Accountability
All significant decisions must be logged in a Decision Ledger with:
- Who made the decision
- What decision was made
- Why (data + constraints)
- When review is due
- Whether review occurred

### 4. Data Confidence
All metrics must display confidence metadata to prevent dangerous overconfidence.

---

## Implementation Priority

### Priority 1: Critical (Implement First)
1. **Decision Ledger** — Transforms app from monitoring system to organizational brain
2. **Explicit Unknowns and Data Confidence** — Prevents dangerous overconfidence
3. **Consent Visibility for Staff** — Protects trust and prevents misinterpretation

### Priority 2: High Value (Implement Second)
4. **Recovery as First-Class Citizen** — Closes critical gap in load management
5. **Role-Based Daily Delta** — Saves time and focuses attention
6. **"Do Not Escalate" Flag** — Reduces noise and overreaction

### Priority 3: Organizational Learning (Implement Third)
7. **Pre-Mortem Mode** — Structured humility before high-stakes periods
8. **Staff Alignment Score** — Internal metric for coordination improvement

---

## Next Steps

### Immediate Actions Required

1. **Apply Database Migration**
   ```bash
   # Apply migration 063_add_psychologist_role.sql
   ```

2. **Implement Decision Ledger**
   - Create database schema (see contract Section 4.1)
   - Build UI for decision logging
   - Add review trigger system

3. **Add Confidence Metadata**
   - Update existing metrics tables
   - Add confidence indicators to UI
   - Implement missing data warnings

4. **Implement Consent Visibility**
   - Add consent status indicators to all athlete views
   - Create "Data unavailable" badges
   - Add consent explanation tooltips

### Documentation Updates Needed

1. **Update Role Permission Matrices**
   - Document exact permissions per role
   - Create visual permission matrix

2. **Create Staff Coordination Runbook**
   - Step-by-step coordination procedures
   - Conflict resolution workflows
   - Escalation procedures

3. **Document Decision-Making Workflows**
   - How to log decisions
   - When to review decisions
   - How to escalate conflicts

---

## Database Schema Requirements

### Decision Ledger Table (Priority 1)

```sql
CREATE TABLE decision_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES auth.users(id),
    decision_type VARCHAR(50) NOT NULL,
    decision_summary TEXT NOT NULL,
    made_by UUID NOT NULL REFERENCES auth.users(id),
    made_by_role VARCHAR(50) NOT NULL,
    decision_basis JSONB NOT NULL,
    intended_duration INTERVAL,
    review_trigger VARCHAR(100),
    review_date TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active',
    superseded_by UUID REFERENCES decision_ledger(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id)
);
```

### Recovery Load Index Table (Priority 2)

```sql
CREATE TABLE recovery_load_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL,
    sleep_debt_hours DECIMAL(4,2),
    travel_stress_score INTEGER CHECK (travel_stress_score BETWEEN 0 AND 10),
    mental_fatigue_score INTEGER CHECK (mental_fatigue_score BETWEEN 0 AND 10),
    consecutive_high_intensity_days INTEGER DEFAULT 0,
    recovery_load_score DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(athlete_id, date)
);
```

### Daily Delta Log Table (Priority 2)

```sql
CREATE TABLE daily_delta_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL,
    delta_type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    change_description TEXT NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    relevance_roles TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(athlete_id, date, delta_type)
);
```

### Staff Flags Table (Priority 2)

```sql
CREATE TABLE staff_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES auth.users(id),
    flagged_by UUID NOT NULL REFERENCES auth.users(id),
    flagged_by_role VARCHAR(50) NOT NULL,
    flag_type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    expires_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id)
);
```

---

## Testing Requirements

### Domain Authority Enforcement
- [ ] Test that roles cannot override other roles' domain authority
- [ ] Test escalation workflow for overrides
- [ ] Test conflict prevention mechanisms

### Decision Ledger
- [ ] Test decision logging
- [ ] Test review trigger system
- [ ] Test decision history visibility

### Coordination Workflows
- [ ] Test constraint flow (Medical → Physical → Tactical)
- [ ] Test multi-role coordination
- [ ] Test conflict resolution

### Data Confidence
- [ ] Test confidence metadata display
- [ ] Test missing data warnings
- [ ] Test incomplete baseline indicators

---

## Related Documents

- **Contract:** `docs/contracts/STAFF_ROLES_AND_COORDINATION_CONTRACT_v1.md`
- **Database Migration:** `database/migrations/063_add_psychologist_role.sql`
- **Coach Dashboard Contract:** `docs/contracts/COACH_DASHBOARD_AUTHORITY_CONTRACT_v1.md`
- **Data Consent Contract:** `docs/contracts/STEP_2_5_DATA_CONSENT_VISIBILITY_CONTRACT_V1.md`

---

## Summary

This implementation establishes:

1. **Clear role definitions** — Each role knows exactly what they do and don't do
2. **Coordination structure** — How staff work together without chaos
3. **Missing features identified** — Critical organizational features that transform the app from monitoring to organizational brain
4. **Implementation roadmap** — Prioritized list of features to implement

**The app replaces meetings with structure, replaces opinions with domains, and replaces pressure with traceable decisions.**

---

**End of Summary**


# Staff Responsibility Matrix — v1

**Contract Version:** 1.0  
**Date:** 2026-01-29  
**Status:** Normative (Binding)  
**Scope:** Visual responsibility matrix for all staff roles  
**Maintained By:** Product Architecture + Engineering

---

## SECTION 1 — Visual Responsibility Matrix

### 1.1 Domain Ownership Matrix

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          STAFF RESPONSIBILITY MATRIX                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  DOMAIN                    │ OWNER              │ FINAL AUTHORITY │ OVERRIDE RULES         │
├────────────────────────────┼────────────────────┼─────────────────┼───────────────────────┤
│  Tactical Execution        │ Head Coach          │ Head Coach       │ Medical can override  │
│  • Game strategy          │                    │                 │ All others: No         │
│  • Player selection        │                    │                 │                        │
│  • Tactical training      │                    │                 │                        │
├────────────────────────────┼────────────────────┼─────────────────┼───────────────────────┤
│  Physical Load & Capacity │ S&C Coach          │ S&C Coach       │ Medical can override  │
│  • Load architecture      │                    │                 │ Head Coach escalation │
│  • Volume/intensity       │                    │                 │ All others: No         │
│  • ACWR management        │                    │                 │                        │
├────────────────────────────┼────────────────────┼─────────────────┼───────────────────────┤
│  Medical Readiness & RTP   │ Physiotherapist    │ Physiotherapist │ Non-negotiable        │
│  • Injury status          │                    │                 │ No overrides allowed   │
│  • RTP protocols          │                    │                 │                        │
│  • Medical constraints    │                    │                 │                        │
├────────────────────────────┼────────────────────┼─────────────────┼───────────────────────┤
│  Fuel & Recovery Timing   │ Nutritionist        │ Nutritionist     │ Medical can override  │
│  • Nutrition strategy     │                    │                 │ Head Coach escalation │
│  • Hydration targets      │                    │                 │ All others: No         │
│  • Supplement protocols   │                    │                 │                        │
├────────────────────────────┼────────────────────┼─────────────────┼───────────────────────┤
│  Mental Readiness &        │ Psychologist       │ Psychologist     │ Medical can override  │
│  Pressure Control          │                    │                 │ Head Coach escalation │
│  • Mental protocols       │                    │                 │ All others: No         │
│  • Cognitive load         │                    │                 │                        │
│  • Pre-competition prep   │                    │                 │                        │
└────────────────────────────┴────────────────────┴─────────────────┴───────────────────────┘
```

### 1.2 Authority Hierarchy

```
                    ┌─────────────────┐
                    │   Head Coach    │
                    │  (Integration)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Medical     │   │    Physical   │   │   Tactical    │
│   Domain      │   │    Domain      │   │    Domain     │
│               │   │               │   │               │
│ • Physio      │   │ • S&C Coach   │   │ • Head Coach  │
│ • Nutrition   │   │               │   │ • Coordinators│
│ • Psychology  │   │               │   │               │
└───────────────┘   └───────────────┘   └───────────────┘

CONSTRAINT FLOW: Medical → Physical → Tactical (upward only)
```

### 1.3 Coordination Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COORDINATION FLOW DIAGRAM                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 1: UNIFIED ATHLETE STATE                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Load (S&C) + Medical (Physio) + Fuel (Nutrition) +              │    │
│  │  Mental (Psych) + Tactical (Coaches) = ONE STATE                    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  STEP 2: CONSTRAINTS FLOW UPWARD                                            │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Medical Constraints → Physical Constraints → Tactical Constraints │    │
│  │  (Cannot flow sideways or backward)                                 │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  STEP 3: ADJUSTMENTS ARE VISIBLE                                            │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Who changed what + Why + When + Duration                           │    │
│  │  (Logged in Decision Ledger)                                        │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SECTION 2 — Role Responsibilities (Detailed)

### 2.1 Head Coach

**Domain:** Tactical Execution

**Responsibilities:**
- ✅ See team readiness at a glance
- ✅ Identify at-risk athletes
- ✅ Plan training without guessing
- ✅ Monitor compliance
- ✅ Intervene early
- ✅ Communicate with clarity
- ✅ Prepare for competition

**Boundaries:**
- ❌ Cannot override medical decisions
- ❌ Cannot override nutrition strategies
- ❌ Cannot override psychology protocols
- ❌ Cannot override S&C load architecture
- ❌ Cannot modify medical constraints

**Data Visibility:**
- Compliance data (default)
- Content data (with opt-in)
- Safety flags (always)
- Medical status (summary only)
- Load metrics (summary during baseline, numerical after)

### 2.2 Physiotherapist

**Domain:** Medical Readiness & RTP

**Responsibilities:**
- ✅ Own injury status
- ✅ Define and manage RTP protocols
- ✅ Monitor rehab load separately
- ✅ Track symptoms, not just outcomes
- ✅ Set medical guardrails
- ✅ Communicate clinically
- ✅ Support long-term prevention

**Boundaries:**
- ❌ Cannot modify team tactics
- ❌ Cannot decide player selection
- ❌ Cannot override consent boundaries
- ❌ Cannot act as coaches
- ❌ Cannot schedule team training

**Data Visibility:**
- Full access to pain, injury, rehab data (role authority)
- Can override athlete consent for medical necessity (with audit trail)
- Bound by medical confidentiality
- See training load (to coordinate with rehab load)
- See compliance with rehab protocols

### 2.3 Strength & Conditioning Coach

**Domain:** Physical Load & Capacity

**Responsibilities:**
- ✅ Own physical load design
- ✅ Control weekly and rolling load
- ✅ Translate readiness into adjustments
- ✅ Design progression
- ✅ Coordinate with physiotherapy constraints
- ✅ Support competition demands
- ✅ Monitor execution quality

**Boundaries:**
- ❌ Cannot override physiotherapy medical decisions
- ❌ Cannot decide tactical training content
- ❌ Cannot act as head coaches
- ❌ Cannot ignore consent boundaries

**Data Visibility:**
- Load metrics (session RPE, volume, ACWR)
- Compliance data
- Readiness indicators (to adjust load)
- Medical constraints (from physio)
- Rehab load (to coordinate with training load)

### 2.4 Nutritionist

**Domain:** Fuel & Recovery Timing

**Responsibilities:**
- ✅ Translate training into fuel strategy
- ✅ Own hydration strategy
- ✅ Design competition-day fueling windows
- ✅ Monitor energy availability
- ✅ Manage supplements conservatively
- ✅ Communicate with clarity
- ✅ Support recovery between sessions

**Boundaries:**
- ❌ Cannot prescribe medical treatments
- ❌ Cannot override physiotherapy restrictions
- ❌ Cannot plan training content
- ❌ Cannot act as coaches

**Data Visibility:**
- Training load and schedule (to plan fueling)
- Hydration compliance
- Energy availability indicators
- Readiness trends (to correlate with nutrition)
- Competition schedules (to plan fueling windows)

### 2.5 Psychologist

**Domain:** Mental Readiness & Pressure Control

**Responsibilities:**
- ✅ Monitor mental readiness
- ✅ Own pre-competition mental protocols
- ✅ Detect overload before collapse
- ✅ Support confidence and role clarity
- ✅ Manage pressure during tournaments
- ✅ Communicate selectively
- ✅ Protect psychological safety

**Boundaries:**
- ❌ Cannot provide clinical therapy
- ❌ Cannot diagnose mental illness
- ❌ Cannot override medical or coaching authority
- ❌ Cannot act as emotional support for non-performance issues

**Data Visibility:**
- Mental readiness signals (with athlete consent)
- Confidence trends
- Stress indicators
- Cognitive load patterns
- Performance-relevant psychological data only

---

## SECTION 3 — Critical 1:1 Relationships

### 3.1 Head Coach ↔ Physiotherapist

**Trust over optimism**

**What flows:**
- Clearance status
- Risk flags
- RTP phase boundaries

**What does NOT flow:**
- Clinical detail
- Pain narratives

**Rule enforced by app:**
Head coach sees status and limits, not medical debate.

### 3.2 S&C Coach ↔ Physiotherapist

**Precision over speed**

**What flows:**
- Load ceilings
- Movement restrictions
- Rehab-to-performance transition

**What the app enforces:**
- No training prescription that violates RTP phase
- Rehab load counted in total load

**This stops the most common failure:**
"Rehab + training quietly doubled the stress."

### 3.3 Coordinators ↔ Psychologist

**Clarity over complexity**

**What flows:**
- Cognitive readiness
- Decision load risk
- Recommendation to simplify or stabilize

**What does NOT flow:**
- Emotional detail
- Private disclosures

**Rule:**
Psychologist flags capacity, coordinators adjust complexity.

---

## SECTION 4 — Conflict Prevention Mechanisms

### 4.1 No Direct Overrides

Coaches cannot override medical.  
S&C cannot override psychology.  
Nutrition cannot override load.

**Overrides require:**
- Explicit escalation
- Logged decision
- Head coach sign-off

### 4.2 One Message, One Authority

An athlete never receives:
- Conflicting instructions
- Parallel advice

**The app:**
- Merges inputs
- Pushes one instruction per domain
- Shows who owns it

### 4.3 Shared Language, Not Shared Opinions

Everything is expressed as:
- Status
- Threshold
- Recommendation
- Constraint

**Not feelings. Not debates.**

---

## SECTION 5 — Visual Status Indicators

### 5.1 Domain Status Colors

| Status | Color | Meaning | Action Required |
|--------|-------|---------|-----------------|
| 🟢 **ACTIVE** | Green | Domain is healthy, no conflicts | None |
| 🟡 **ESCALATED** | Yellow | Domain has active escalations | Review escalations |
| 🔴 **CONFLICT** | Red | Domain has unresolved conflicts | Resolve conflicts |
| ⚪ **LOCKED** | Gray | Domain locked (tournament mode) | Wait for unlock |
| 🔵 **MONITORING** | Blue | Domain under active monitoring | Continue monitoring |

### 5.2 Role Status Indicators

| Status | Badge | Meaning |
|--------|-------|---------|
| **Active** | 🟢 Green dot | Role is active, monitoring domain |
| **Escalated** | 🟡 Yellow badge | Role has active escalations |
| **Conflict** | 🔴 Red badge | Role involved in conflict |
| **Away** | ⚪ Gray badge | Role temporarily unavailable |
| **Locked** | 🔒 Lock icon | Role locked (game day, tournament) |

---

## SECTION 6 — Implementation Notes

### 6.1 UI Component Requirements

The Responsibility Matrix should be implemented as:
- **Interactive grid** — Click cells to view details
- **Color-coded** — Status colors as defined above
- **Tooltips** — Hover for quick info
- **Filterable** — Filter by role, domain, status
- **Real-time** — Updates via WebSocket

### 6.2 Data Requirements

The matrix requires:
- Current role assignments
- Active escalations per domain
- Active conflicts per domain
- Domain status (from Decision Ledger)
- Recent decisions per domain

### 6.3 Performance Considerations

- Cache domain status (update every 5 minutes)
- Lazy load conflict details
- Paginate if many escalations
- Optimize WebSocket updates

---

## End of Document

**This matrix is law. Role implementations that deviate are system failures.**


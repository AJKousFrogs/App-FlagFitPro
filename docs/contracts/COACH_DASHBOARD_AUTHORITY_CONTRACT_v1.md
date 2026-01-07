# Coach Dashboard Authority Contract — v1

**Contract Version:** 1.0  
**Date:** 2026-01-06  
**Status:** Normative (Binding)  
**Scope:** Coach-facing dashboard interfaces — all platforms (web, iOS, Android)  
**Maintained By:** Product Architecture + Engineering  
**Supersedes:** None

**Dependencies (MUST Be Compatible With):**
- Coach Authority & Visibility Contract v1 (CONTRACT_2.4)
- Data Consent & Visibility Contract v1 (STEP_2_5)
- Authorization & Guardrails Contract v1
- Session Lifecycle Authority Contract v1
- TODAY Screen UX Authority Contract v1

---

## SECTION 1 — Scope + Definitions

### 1.1 Scope

This contract governs the **coach-facing dashboard interfaces** where coaches view athlete data, modify sessions, assign programs, and monitor compliance. This contract defines:
- What coaches can see (read authority)
- What coaches can modify (write authority)
- What coaches cannot see (privacy boundaries)
- What coaches cannot modify (immutability boundaries)
- Multi-coach conflict resolution
- National vs club coach precedence
- Audit requirements for all dashboard actions

This contract does NOT govern:
- Athlete-facing interfaces (see TODAY Screen UX Authority Contract v1)
- Backend authorization enforcement (see Authorization & Guardrails Contract v1)
- Data privacy defaults (see Data Consent & Visibility Contract v1)

### 1.2 Definitions

#### Coach Dashboard
The primary interface where coaches view athlete data, modify training plans, assign programs, and monitor compliance. Dashboard includes: athlete list, session calendar, compliance reports, load metrics, and modification tools.

#### Read Authority
The right to view athlete data. Read authority is constrained by athlete consent settings, data sensitivity, and role permissions.

#### Write Authority
The right to modify athlete data, sessions, or programs. Write authority is constrained by session state, immutability rules, and role permissions.

#### Compliance Data
Data that coaches can see by default without athlete opt-in. Includes: check-in completion (yes/no), session completion (yes/no), days since last check-in, sets/reps/load/RPE (numerical), safety flags (existence), rehab restrictions.

#### Content Data
Data that coaches cannot see without athlete opt-in. Includes: readinessScore, individual wellness answers (sleep, stress, mood), freeform comments, pain detail (unless safety trigger), Merlin conversations.

#### Multi-Coach Conflict
A situation where multiple coaches (e.g., domestic club coach and national team coach) attempt to modify the same athlete's session or program simultaneously.

#### National vs Club Coach
A distinction between coaches assigned to athletes for different purposes:
- **Club Coach:** Assigned to athlete for domestic/club program
- **National Coach:** Assigned to athlete for national team duty

---

## SECTION 2 — Coach Read Authority

### 2.1 Default Visibility (Compliance Only)

Coaches MUST see the following data for assigned athletes **by default** (no athlete opt-in required):

| Data Category | What Coach Sees | What Coach Does NOT See |
|---------------|------------------|-------------------------|
| Check-in Status | Completed: yes/no, days since last, completion streak | ReadinessScore, individual wellness answers |
| Session Completion | Completed: yes/no, duration, date/time | Freeform training notes, RPE reasoning |
| Execution Data | Sets, reps, load, duration, RPE (numbers only) | Comments, modifications, skipped exercises (unless logged) |
| Safety Flags | Flag existence (pain >3, ACWR danger, high RPE streak) | Pain detail (unless safety trigger), ACWR value (until baseline complete) |
| Rehab Status | Active: yes/no, restrictions list, clearance status | Diagnosis, protocol detail, clinician notes |
| Load Metrics | Summary indicators (green/amber/red) during baseline; numerical ACWR after baseline complete | Individual wellness factors affecting load |

### 2.2 Opt-In Visibility (Content Data)

Coaches CAN see the following data **only if athlete opts in**:

| Data Category | Opt-In Setting | What Coach Sees When Enabled |
|---------------|----------------|------------------------------|
| ReadinessScore | "Share readiness with coach" | ReadinessScore (0-100), readiness trend graph |
| Wellness Answers | "Share wellness answers with coach" | Sleep hours, stress level, soreness, mood, energy (individual answers) |
| Training Notes | "Share training log notes with coach" | Freeform comments in training logs |
| Merlin Conversations | "Share Merlin conversations with coach" | Full conversation history with Merlin |

### 2.3 Safety Override Visibility

Coaches MUST see the following data **regardless of athlete consent** when safety triggers fire:

| Trigger | What Coach Sees | Minimum Necessary Disclosure |
|---------|-----------------|------------------------------|
| Pain >3/10 | Pain score, location, trend | "Athlete has reported pain >3/10 in [location]" |
| New/Worsening Pain | Pain detail, trend | "Athlete has reported new/worsening pain" |
| ACWR Danger Zone | ACWR value, acute/chronic load | "Athlete's ACWR is [value] (danger zone)" |
| High RPE Streak | RPE trend, session dates | "Athlete has logged RPE ≥9 for [X] consecutive sessions" |
| Rehab Restriction Violation | Attempted exercise, restriction | "Athlete attempted restricted exercise: [exercise]" |

### 2.4 Forbidden Read Operations

Coaches MUST NOT see:
- Teammate data (unless aggregate with ≥5 athletes)
- Athlete's Merlin conversations (unless opt-in or safety trigger)
- Coach notes written by other coaches about athlete (unless shared)
- Historical wellness detail (unless opt-in applies retroactively)
- Admin audit logs (system integrity only)
- Deleted account data (anonymized)

---

## SECTION 3 — Coach Write Authority

### 3.1 Session Modification Rights

Coaches MAY modify sessions when:
- Session state is PLANNED, GENERATED, or VISIBLE (before IN_PROGRESS)
- Coach is assigned to athlete
- Session is not `coach_locked` by another coach
- Modification does not violate rehab restrictions (warning required)

Coaches MUST NOT modify sessions when:
- Session state is IN_PROGRESS, COMPLETED, or LOCKED
- Session is `coach_locked` by another coach (without explicit override)
- Modification violates active rehab restrictions (unless physio clearance provided)
- Modification exceeds ACWR safety boundary (without explicit acknowledgment)

### 3.2 Modification Types Allowed

| Modification Type | Allowed | Constraints |
|-------------------|---------|-------------|
| Exercise swap | YES | Before IN_PROGRESS only |
| Sets/reps change | YES | Before IN_PROGRESS only |
| Duration change | YES | Before IN_PROGRESS only |
| Intensity adjustment | YES | Before IN_PROGRESS only |
| Session cancellation | YES | Before IN_PROGRESS only |
| Practice assignment | YES | Replaces individual session |
| Film room assignment | YES | Replaces field training |
| Taper activation | YES | Requires athlete acknowledgment |
| Weather override | YES | Requires reason and acknowledgment if against API recommendation |

### 3.3 Modification Attribution Requirements

When coach modifies a session, system MUST:
- Record `coach_id` (who modified)
- Record `modified_at_timestamp` (when modified)
- Record `modification_reason` (why modified, if provided)
- Display attribution to athlete: "Updated by Coach [Name] at [Time]"
- Log modification in audit trail with before/after snapshots

### 3.4 Modification Limits

| Limit Type | Constraint | Rationale |
|------------|------------|-----------|
| ACWR Safety Boundary | Coach MUST acknowledge if override exceeds threshold | Injury risk protection |
| Rehab Restrictions | Coach MUST NOT assign restricted exercises | Medical safety |
| Session State | Coach MUST NOT modify IN_PROGRESS or COMPLETED | Immutability protection |
| Multi-Coach Lock | Coach MUST NOT modify if `coach_locked` by another coach | Conflict prevention |

---

## SECTION 4 — Multi-Coach Conflict Rules

### 4.1 Conflict Detection

A multi-coach conflict occurs when:
- Two or more coaches attempt to modify the same session simultaneously
- One coach modifies session while another coach's modification is in-flight
- National coach and club coach assign conflicting activities on same date

### 4.2 Conflict Resolution Priority

When conflicts arise, resolution follows this order (highest to lowest):

1. **Medical/Rehab Protocol** (physio-prescribed restrictions)
2. **First Modification Wins** (timestamp-based, atomic write)
3. **National Coach** (if conflict is schedule-related, national duty takes precedence)
4. **Club Coach** (if conflict is program-related, club program takes precedence)
5. **System Default** (reject both, require manual resolution)

### 4.3 National vs Club Coach Precedence

#### Schedule Conflicts (Practice/Matches)

**National Coach Precedence:**
- National team camp conflicts with club match → National camp takes precedence
- National coach schedules practice → Club coach sees conflict, cannot override
- National coach assigns taper → Club coach adjusts program around taper

**Club Coach Precedence:**
- Club program modification → National coach sees modification, cannot override club program
- Club coach assigns practice → National coach sees schedule, coordinates around it

#### Program Modification Conflicts

**First Modification Wins:**
- If club coach modifies session at 09:00 and national coach attempts modification at 09:05, club coach's modification stands
- System MUST reject second modification with message: "Session was modified by [Coach Name] at [Time]. Contact [Coach Name] to discuss changes."

### 4.4 Conflict Notification

When conflict is detected:
- System MUST notify both coaches of conflict
- System MUST display who modified first and when
- System MUST provide communication pathway between coaches
- System MUST log conflict in audit trail

---

## SECTION 5 — Dashboard Action Audit Requirements

### 5.1 Required Audit Fields

Every coach dashboard action MUST be logged with:

| Field | Description |
|-------|-------------|
| `coach_id` | Who performed action |
| `athlete_id` | Whose data was accessed/modified |
| `action_type` | VIEW / MODIFY / ASSIGN / CANCEL / NOTE |
| `timestamp` | When action occurred (ISO 8601) |
| `session_id` | Which session (if applicable) |
| `before_state` | JSON snapshot before modification |
| `after_state` | JSON snapshot after modification |
| `modification_reason` | Why modification was made (if provided) |
| `athlete_readiness_at_time` | Readiness value at time of action |
| `athlete_acwr_at_time` | ACWR value at time of action (if available) |
| `override_flags` | Array of overrides (ACWR_OVERRIDE, REHAB_OVERRIDE, etc.) |

### 5.2 View Action Logging

When coach views athlete data:
- Log `action_type: VIEW`
- Log `data_category` (compliance, readiness, load, etc.)
- Log `consent_status` (did athlete opt-in for this data?)
- Log `view_duration` (how long coach viewed data)

### 5.3 Modification Action Logging

When coach modifies session:
- Log `action_type: MODIFY`
- Log `modification_type` (exercise_swap, intensity_change, etc.)
- Log `before_state` and `after_state` (complete JSON snapshots)
- Log `modification_reason` (if provided)
- Log `athlete_acknowledgment_required` (boolean)
- Log `athlete_acknowledgment_timestamp` (if acknowledged)

### 5.4 Audit Retention

- **Active Athlete:** Retain all audit logs for lifetime of account + 7 years post-deletion
- **Deleted Account:** Anonymize but retain logs for 7 years (legal compliance)
- **Minor Athlete:** Retain until age 25 or account deletion + 7 years (whichever is longer)

---

## SECTION 6 — Forbidden Dashboard Actions

### 6.1 Hard Bans (10 Required)

#### Ban 1: Modifying IN_PROGRESS Sessions
**Forbidden:** Coach modifying session structure after athlete has started execution.

**Enforcement:** Backend MUST reject modification if `session.state === IN_PROGRESS`.

**Rationale:** Immutability protection. Athlete is executing plan; changes create confusion and liability risk.

---

#### Ban 2: Modifying COMPLETED Sessions
**Forbidden:** Coach modifying session after athlete has completed it.

**Enforcement:** Backend MUST reject modification if `session.state === COMPLETED` or `LOCKED`.

**Rationale:** Historical accuracy. Completed sessions are immutable for audit and liability protection.

---

#### Ban 3: Viewing Teammate Data Without Consent
**Forbidden:** Coach viewing individual athlete readiness, wellness, or pain data without athlete consent.

**Enforcement:** Backend MUST enforce consent checks. Return 403 Forbidden if consent not granted.

**Rationale:** Privacy-by-design. Athletes own their personal data.

---

#### Ban 4: Assigning Restricted Exercises During Rehab
**Forbidden:** Coach assigning exercises that violate active rehab restrictions.

**Enforcement:** Backend MUST warn coach before allowing assignment. Coach MUST acknowledge override.

**Rationale:** Medical safety. Rehab restrictions are non-negotiable without physio clearance.

---

#### Ban 5: Overriding ACWR Safety Boundary Without Acknowledgment
**Forbidden:** Coach increasing volume beyond ACWR threshold without explicit acknowledgment.

**Enforcement:** Backend MUST require coach to acknowledge override. Log `ACWR_OVERRIDE` flag.

**Rationale:** Injury risk protection. Coaches must be aware of load spike risks.

---

#### Ban 6: Modifying Another Coach's Locked Session
**Forbidden:** Coach modifying session that is `coach_locked` by another coach.

**Enforcement:** Backend MUST reject modification. Notify coach of conflict.

**Rationale:** Multi-coach conflict prevention. First modification wins.

---

#### Ban 7: Viewing Deleted Account Data
**Forbidden:** Coach accessing athlete data after account deletion (unless anonymized audit logs).

**Enforcement:** Backend MUST return 404 Not Found for deleted accounts.

**Rationale:** Privacy protection. Deleted accounts are anonymized.

---

#### Ban 8: Sharing Athlete Data with Unauthorized Parties
**Forbidden:** Coach exporting or sharing athlete data with parties not assigned to athlete.

**Enforcement:** Backend MUST validate coach-athlete relationship before data export.

**Rationale:** Privacy compliance. Data sharing requires authorization.

---

#### Ban 9: Modifying Session Without Attribution
**Forbidden:** System allowing session modification without recording `coach_id` and `timestamp`.

**Enforcement:** Database constraints MUST require non-null `modified_by_coach_id` and `modified_at_timestamp`.

**Rationale:** Accountability. Every modification must be traceable.

---

#### Ban 10: Viewing Historical Data Without Retroactive Consent
**Forbidden:** Coach viewing historical wellness detail if athlete disables sharing retroactively.

**Enforcement:** Backend MUST check consent at time of view. If consent revoked, hide historical data.

**Rationale:** Privacy control. Athletes can revoke consent at any time.

---

## SECTION 7 — Conflict Resolution Rules

### 7.1 When Multiple Conditions Apply

If multiple constraints apply simultaneously (e.g., rehab restriction + ACWR override + multi-coach lock):

**Resolution Process:**
1. Identify all active constraints
2. Apply highest priority constraint first (medical > safety > authority > preference)
3. If constraints conflict, reject action and notify coach of conflict
4. Require manual resolution (coach-to-coach communication)

### 7.2 When Input State Is Ambiguous

If required data is missing or invalid:
1. Log error with complete state snapshot
2. Reject action with error message
3. Do NOT attempt fallback or guess
4. Surface error to engineering (system bug)

---

## SECTION 8 — Acceptance Criteria + QA Checklist

### 8.1 Deterministic Output Criteria

Given identical input state, coach dashboard MUST produce:
- [ ] Identical data visibility (same fields shown/hidden)
- [ ] Identical modification options (same actions enabled/disabled)
- [ ] Identical conflict resolution (same outcome for same conflict)

### 8.2 Functional QA Checklist

| Test Case | Expected Result | Pass/Fail |
|-----------|-----------------|-----------|
| Coach views athlete with default consent | Sees compliance only, not readiness | |
| Coach views athlete with opt-in consent | Sees readinessScore and wellness | |
| Coach modifies PLANNED session | Modification succeeds, attribution logged | |
| Coach modifies IN_PROGRESS session | Modification rejected with error | |
| Coach assigns restricted exercise during rehab | Warning shown, override acknowledgment required | |
| National coach conflicts with club coach | First modification wins, second rejected | |
| Coach views deleted athlete | 404 Not Found returned | |
| Coach exports athlete data | Export includes only authorized data | |
| Coach views teammate data | 403 Forbidden returned | |
| Coach modifies without reason (ACWR override) | System requires reason before allowing | |

---

## Appendix A — Document Metadata

**Maintained By:** Product Architecture + Engineering  
**Enforcement:** All coach dashboard implementations MUST comply exactly  
**Testing:** QA must verify all forbidden patterns are prevented  
**Review Cycle:** Quarterly or on contract breach  
**Audit:** Non-compliance is system failure requiring immediate remediation

**Related Documents:**
- Coach Authority & Visibility Contract v1 (CONTRACT_2.4)
- Data Consent & Visibility Contract v1 (STEP_2_5)
- Authorization & Guardrails Contract v1
- Session Lifecycle Authority Contract v1

**Version History:**
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-06 | Initial coach dashboard authority contract | Product Architecture |

---

## End of Document

**This contract is law. Dashboard implementations that deviate are system failures.**


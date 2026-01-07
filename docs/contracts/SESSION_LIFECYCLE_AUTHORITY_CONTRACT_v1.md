# SESSION LIFECYCLE AUTHORITY CONTRACT v1

**Contract Version:** 1.0  
**Date:** 2026-01-06  
**Status:** Normative (Binding)  
**Scope:** Complete training session lifecycle from creation to permanent lock  
**Authority:** Product Architecture, Engineering, Legal, Coaching Staff  
**Supersedes:** None  
**Effective Date:** 2026-01-06  

---

## PREAMBLE

This contract defines the **complete, deterministic lifecycle of a training session** from creation to permanent lock. This document is **LAW**. All backend logic, UI behavior, AI behavior, and audit systems MUST comply exactly. Deviation equals system failure.

**Scope:**
- Applies to ALL training session types: individual, practice, film room, rehab, taper
- Applies to ALL platforms: web, iOS, Android
- Applies to ALL system components: backend, frontend, AI, audit logs
- Written as LAW using MUST / MUST NOT language

**Core Principles:**
1. Sessions progress through deterministic states with zero ambiguity
2. State transitions are atomic and auditable
3. Mutation rights are role-based and state-dependent
4. Immutability rules are absolute and enforced at database level
5. Race conditions resolve deterministically
6. Late data appends, never overwrites historical truth
7. Audit trail enables complete dispute reconstruction
8. Coach liability protection is mandatory
9. Athlete informed-consent proof is mandatory

---

## SECTION 1 — CANONICAL SESSION STATES

### 1.1 State Definitions

A training session MUST exist in exactly one of the following states at any given time. States are mutually exclusive and ordered by lifecycle progression.

#### UNRESOLVED

**Definition:** Session cannot be generated due to missing prerequisites or system failure.

**Entry Conditions:**
- No active program assigned to athlete
- Program exists but session resolution fails (backend error, data corruption)
- Required data missing (athlete profile incomplete, program template corrupted)
- System error prevents generation

**Exit Conditions:**
- Prerequisites satisfied (program assigned, data complete)
- System recovery (backend error resolved)
- Manual intervention (admin fixes data, assigns program)

**Allowed Transitions:**
- UNRESOLVED → PLANNED (prerequisites satisfied)
- UNRESOLVED → UNRESOLVED (system retry, no change)

**Forbidden Transitions:**
- UNRESOLVED → GENERATED (cannot generate without prerequisites)
- UNRESOLVED → VISIBLE (cannot show what doesn't exist)
- UNRESOLVED → IN_PROGRESS (impossible)
- UNRESOLVED → COMPLETED (impossible)

**Who Can Transition:** System only (resolves prerequisites), Admin (manual fixes)

**Training Allowed:** NO (session does not exist)

**Mutations Allowed:** NONE (session does not exist)

**Immutability:** N/A (no session structure exists)

---

#### PLANNED

**Definition:** Session is scheduled in program calendar but not yet generated for specific date.

**Entry Conditions:**
- Program exists with session template for date
- Date is in future (not today, not past)
- No explicit coach cancellation
- Prerequisites satisfied (UNRESOLVED → PLANNED transition)

**Exit Conditions:**
- Date becomes "today" (midnight transition) → GENERATED
- Coach cancels session → CANCELLED (terminal state)
- Program ends or athlete removed → CANCELLED

**Allowed Transitions:**
- PLANNED → GENERATED (date becomes today, system auto-transition)
- PLANNED → CANCELLED (coach cancels, program ends)
- PLANNED → PLANNED (coach modifies template, but session not yet generated)

**Forbidden Transitions:**
- PLANNED → VISIBLE (must be GENERATED first)
- PLANNED → IN_PROGRESS (cannot execute future session)
- PLANNED → COMPLETED (impossible)

**Who Can Transition:** System (auto-transition on date), Coach (cancel), System (program end)

**Training Allowed:** NO (session not yet instantiated)

**Mutations Allowed:**
- Coach: Modify template (exercises, duration, intensity)
- Coach: Reschedule date
- Coach: Assign/unassign athlete
- System: NONE (not yet generated)

**Immutability:** Nothing yet (session not instantiated)

---

#### GENERATED

**Definition:** Session has been instantiated for today's date with specific exercises, sets, reps, and intensity.

**Entry Conditions:**
- Date is "today" (midnight transition from PLANNED)
- Backend successfully resolved session from program template
- Session structure exists in database with `session_date = today`
- `generated_at` timestamp recorded

**Exit Conditions:**
- Athlete opens TODAY screen → VISIBLE
- Coach modifies session → GENERATED (new version, v2)
- Date passes without execution → EXPIRED (terminal state)
- Coach cancels → CANCELLED (terminal state)

**Allowed Transitions:**
- GENERATED → VISIBLE (athlete views session)
- GENERATED → GENERATED (coach modifies, creates v2)
- GENERATED → EXPIRED (date passes, no execution)
- GENERATED → CANCELLED (coach cancels before visibility)

**Forbidden Transitions:**
- GENERATED → IN_PROGRESS (must be VISIBLE first)
- GENERATED → COMPLETED (cannot complete unseen session)

**Who Can Transition:** Athlete (opens TODAY), Coach (modifies), System (date passes), Coach (cancels)

**Training Allowed:** NO (athlete has not seen session)

**Mutations Allowed:**
- Coach: Modify structure (exercises, sets, reps, intensity, duration)
- Coach: Add override flags (weather, practice, ACWR)
- System: Apply weather override (before VISIBLE)
- System: Apply readiness adjustment (before VISIBLE)
- System: Apply ACWR adjustment (before VISIBLE)

**Immutability:**
- `session_id` (UUID, immutable)
- `session_date` (date, immutable)
- `generated_at` (timestamp, immutable)
- `generated_by` (system or coach_id, immutable)
- `program_id` (reference, immutable)
- `program_week` (reference, immutable)

---

#### VISIBLE

**Definition:** Athlete has opened TODAY screen and seen session content. Session is now "in play."

**Entry Conditions:**
- Session is GENERATED
- Athlete opens TODAY screen
- Session is displayed to athlete (even if not acknowledged)
- `visible_at` timestamp recorded
- `visible_version` recorded (v1, v2, etc.)

**Exit Conditions:**
- Athlete acknowledges session (if required) → ACKNOWLEDGED
- Athlete starts execution → IN_PROGRESS
- Coach modifies session → VISIBLE (new version, conflict resolution required)
- Date passes → EXPIRED

**Allowed Transitions:**
- VISIBLE → ACKNOWLEDGED (athlete acknowledges, if required)
- VISIBLE → IN_PROGRESS (athlete starts training)
- VISIBLE → VISIBLE (coach modifies, creates v2, conflict resolution)
- VISIBLE → EXPIRED (date passes)

**Forbidden Transitions:**
- VISIBLE → GENERATED (cannot un-see)
- VISIBLE → PLANNED (cannot reverse lifecycle)

**Who Can Transition:** Athlete (acknowledges, starts), Coach (modifies), System (date passes)

**Training Allowed:** YES (athlete can start training)

**Mutations Allowed:**
- Coach: Modify structure (creates v2, conflict resolution required)
- System: Append late data only (check-in, pain report)
- System: CANNOT modify structure (soft immutable after VISIBLE)

**Immutability:**
- `visible_at` (timestamp, immutable)
- `visible_version` (which version athlete saw, immutable)
- Session structure becomes "soft immutable" — modifications create new version, athlete sees version they opened

---

#### ACKNOWLEDGED

**Definition:** Athlete has explicitly acknowledged session (if acknowledgment required per coach modification rules).

**Entry Conditions:**
- Session is VISIBLE
- Coach modification requires acknowledgment (intensity >10% increase, ACWR override, weather override)
- Athlete presses "I Understand" or equivalent acknowledgment button
- `acknowledged_at` timestamp recorded

**Exit Conditions:**
- Athlete starts execution → IN_PROGRESS
- Coach modifies session → ACKNOWLEDGED (new version, re-acknowledgment may be required)
- Date passes → EXPIRED

**Allowed Transitions:**
- ACKNOWLEDGED → IN_PROGRESS (athlete starts training)
- ACKNOWLEDGED → ACKNOWLEDGED (coach modifies, may require re-acknowledgment)
- ACKNOWLEDGED → EXPIRED (date passes)

**Forbidden Transitions:**
- ACKNOWLEDGED → VISIBLE (cannot un-acknowledge)
- ACKNOWLEDGED → GENERATED (cannot reverse)

**Who Can Transition:** Athlete (starts), Coach (modifies), System (date passes)

**Training Allowed:** YES (athlete can start training)

**Mutations Allowed:**
- Coach: Modify structure (re-acknowledgment required if blocking change)
- System: Append late data only

**Immutability:**
- `acknowledged_at` (timestamp, immutable)
- Acknowledgment record (permanent audit record)

---

#### IN_PROGRESS

**Definition:** Athlete has started executing session. First exercise marked "started" or first set logged.

**Entry Conditions:**
- Session is VISIBLE or ACKNOWLEDGED
- Athlete presses "Start Training" or logs first set/rep
- `session_started_at` timestamp recorded
- `executed_version` recorded (v1, v2, etc.)

**Exit Conditions:**
- Athlete completes all exercises → COMPLETED
- Athlete abandons session → ABANDONED (terminal state)
- Athlete skips session → SKIPPED (terminal state)

**Allowed Transitions:**
- IN_PROGRESS → COMPLETED (athlete finishes all exercises)
- IN_PROGRESS → ABANDONED (athlete stops mid-session, no intent to resume)
- IN_PROGRESS → SKIPPED (athlete explicitly skips session)

**Forbidden Transitions:**
- IN_PROGRESS → VISIBLE (cannot un-start)
- IN_PROGRESS → GENERATED (cannot reverse)
- IN_PROGRESS → IN_PROGRESS (coach cannot modify structure once started)

**Who Can Transition:** Athlete only (completes, abandons, skips)

**Training Allowed:** YES (athlete is executing)

**Mutations Allowed:**
- Athlete: Log execution data only (sets completed, reps logged, RPE, duration, notes)
- System: Append late data only (check-in, pain report)
- Coach: CANNOT modify structure (HARD BAN)

**Immutability:**
- `session_started_at` (timestamp, immutable)
- `executed_version` (which version athlete executes, immutable)
- Session structure (exercises, prescribed sets/reps, intensity targets) — HARD IMMUTABLE
- `prescribed_duration` (target duration) — HARD IMMUTABLE
- `prescribed_intensity` (target intensity) — HARD IMMUTABLE
- Coach attribution (who modified session) — HARD IMMUTABLE
- Generation timestamp — HARD IMMUTABLE

---

#### COMPLETED

**Definition:** Athlete has finished session execution. All exercises completed or explicitly skipped. Minimum required data logged (RPE, duration).

**Entry Conditions:**
- Session is IN_PROGRESS
- Athlete marks session "complete" OR all exercises marked done/skipped
- Minimum required data present: `rpe` (1-10), `duration_minutes` (>0)
- `completed_at` timestamp recorded

**Exit Conditions:**
- Locking period expires (24 hours) → LOCKED
- Coach requests correction (admin override) → COMPLETED (correction appended, not overwritten)

**Allowed Transitions:**
- COMPLETED → LOCKED (24-hour grace period expires)
- COMPLETED → COMPLETED (correction appended, state remains COMPLETED)

**Forbidden Transitions:**
- COMPLETED → IN_PROGRESS (cannot un-complete)
- COMPLETED → VISIBLE (cannot reverse)
- COMPLETED → GENERATED (impossible)

**Who Can Transition:** System (auto-lock after 24h), Athlete (append corrections within 24h)

**Training Allowed:** NO (session completed)

**Mutations Allowed (24-hour grace period only):**
- Athlete: Append corrections (fix typos in RPE, duration, notes)
- Athlete: Add missing data (RPE if forgotten)
- Coach: CANNOT modify structure (HARD BAN)
- System: Append late data only

**Immutability:**
- `completed_at` (timestamp, immutable)
- Session structure (HARD IMMUTABLE)
- Coach attribution (HARD IMMUTABLE)
- Core execution data (immutable after 24h grace period)

---

#### LOCKED

**Definition:** Session is permanently immutable. All modifications forbidden. Audit record frozen.

**Entry Conditions:**
- Session is COMPLETED
- 24-hour grace period has expired
- OR admin explicitly locks session (emergency)
- `locked_at` timestamp recorded

**Exit Conditions:** NONE (terminal state)

**Allowed Transitions:** NONE (LOCKED is terminal)

**Forbidden Transitions:** ALL (no transitions from LOCKED)

**Who Can Transition:** System (auto-lock), Admin (emergency lock)

**Training Allowed:** NO (session locked)

**Mutations Allowed:** NONE (NO ONE can modify)

**Immutability:**
- EVERYTHING (all fields immutable)
- Session structure (immutable)
- Execution data (immutable)
- Timestamps (immutable)
- Audit logs (immutable)
- Coach attribution (immutable)

---

#### CANCELLED

**Definition:** Session was cancelled before execution. Never executed, never visible to athlete (or visible but explicitly cancelled).

**Entry Conditions:**
- Coach cancels PLANNED or GENERATED session
- Program ends before session date
- Athlete removed from program before session date
- `cancelled_at` timestamp recorded

**Exit Conditions:** NONE (terminal state, but new session can be created for same date)

**Allowed Transitions:** NONE (CANCELLED is terminal, but new session can be created for same date)

**Forbidden Transitions:** ALL (cannot un-cancel)

**Who Can Transition:** Coach (cancels), System (program ends)

**Training Allowed:** NO (session cancelled)

**Mutations Allowed:** NONE (cancellation is permanent)

**Immutability:**
- `cancelled_at` (timestamp, immutable)
- Cancellation reason (if provided, immutable)
- Coach attribution (immutable)

---

#### EXPIRED

**Definition:** Date passed without execution. Session was GENERATED or VISIBLE but never started.

**Entry Conditions:**
- Session is GENERATED, VISIBLE, or ACKNOWLEDGED
- Date becomes yesterday (midnight transition)
- No execution data logged (`session_started_at` is null)
- `expired_at` timestamp recorded

**Exit Conditions:** NONE (terminal state)

**Allowed Transitions:** NONE (EXPIRED is terminal)

**Forbidden Transitions:** ALL (cannot un-expire)

**Who Can Transition:** System (date passes)

**Training Allowed:** NO (session expired)

**Mutations Allowed:** NONE (expiration is permanent)

**Immutability:**
- `expired_at` (timestamp, immutable)
- Session structure as it existed on date (immutable)

---

#### ABANDONED

**Definition:** Athlete started session but stopped mid-execution with no intent to resume.

**Entry Conditions:**
- Session is IN_PROGRESS
- Athlete explicitly marks session "abandoned" OR
- 48 hours pass with no activity after `session_started_at`
- `abandoned_at` timestamp recorded

**Exit Conditions:**
- Locking period expires (24 hours after abandonment) → LOCKED

**Allowed Transitions:**
- ABANDONED → LOCKED (24-hour grace period expires)

**Forbidden Transitions:**
- ABANDONED → IN_PROGRESS (cannot un-abandon)
- ABANDONED → COMPLETED (cannot complete abandoned session)

**Who Can Transition:** System (auto-lock after 24h)

**Training Allowed:** NO (session abandoned)

**Mutations Allowed (24-hour grace period only):**
- Athlete: Append notes explaining abandonment
- Coach: CANNOT modify structure (HARD BAN)

**Immutability:**
- `abandoned_at` (timestamp, immutable)
- Session structure (HARD IMMUTABLE)
- Partial execution data (immutable after 24h grace period)

---

#### SKIPPED

**Definition:** Athlete explicitly skipped session without starting execution.

**Entry Conditions:**
- Session is VISIBLE, ACKNOWLEDGED, or IN_PROGRESS
- Athlete presses "Skip Session" button
- `skipped_at` timestamp recorded

**Exit Conditions:**
- Locking period expires (24 hours after skip) → LOCKED

**Allowed Transitions:**
- SKIPPED → LOCKED (24-hour grace period expires)

**Forbidden Transitions:**
- SKIPPED → IN_PROGRESS (cannot un-skip)
- SKIPPED → COMPLETED (cannot complete skipped session)

**Who Can Transition:** System (auto-lock after 24h)

**Training Allowed:** NO (session skipped)

**Mutations Allowed (24-hour grace period only):**
- Athlete: Append skip reason
- Coach: CANNOT modify structure (HARD BAN)

**Immutability:**
- `skipped_at` (timestamp, immutable)
- Session structure (HARD IMMUTABLE)

---

### 1.2 State Transition Diagram (Textual)

| FROM_STATE | TO_STATE | TRIGGER | AUTHORITY | ALLOWED / REJECTED |
|------------|----------|---------|-----------|-------------------|
| UNRESOLVED | PLANNED | Prerequisites satisfied | System | ALLOWED |
| PLANNED | GENERATED | Date becomes today | System | ALLOWED |
| PLANNED | CANCELLED | Coach cancels | Coach | ALLOWED |
| GENERATED | VISIBLE | Athlete opens TODAY | Athlete | ALLOWED |
| GENERATED | GENERATED | Coach modifies | Coach | ALLOWED (creates v2) |
| GENERATED | EXPIRED | Date passes | System | ALLOWED |
| GENERATED | CANCELLED | Coach cancels | Coach | ALLOWED |
| VISIBLE | ACKNOWLEDGED | Athlete acknowledges | Athlete | ALLOWED (if required) |
| VISIBLE | IN_PROGRESS | Athlete starts | Athlete | ALLOWED |
| VISIBLE | VISIBLE | Coach modifies | Coach | ALLOWED (creates v2, conflict resolution) |
| VISIBLE | EXPIRED | Date passes | System | ALLOWED |
| ACKNOWLEDGED | IN_PROGRESS | Athlete starts | Athlete | ALLOWED |
| ACKNOWLEDGED | ACKNOWLEDGED | Coach modifies | Coach | ALLOWED (re-acknowledgment may be required) |
| ACKNOWLEDGED | EXPIRED | Date passes | System | ALLOWED |
| IN_PROGRESS | COMPLETED | Athlete finishes | Athlete | ALLOWED |
| IN_PROGRESS | ABANDONED | Athlete abandons | Athlete | ALLOWED |
| IN_PROGRESS | SKIPPED | Athlete skips | Athlete | ALLOWED |
| COMPLETED | LOCKED | 24h grace period | System | ALLOWED |
| ABANDONED | LOCKED | 24h grace period | System | ALLOWED |
| SKIPPED | LOCKED | 24h grace period | System | ALLOWED |
| IN_PROGRESS | IN_PROGRESS | Coach modifies | Coach | **REJECTED** (HARD BAN) |
| COMPLETED | COMPLETED | Coach modifies structure | Coach | **REJECTED** (HARD BAN) |
| LOCKED | * | Any modification | Anyone | **REJECTED** (HARD BAN) |
| CANCELLED | * | Any modification | Anyone | **REJECTED** (HARD BAN) |
| EXPIRED | * | Any modification | Anyone | **REJECTED** (HARD BAN) |

---

## SECTION 2 — MUTATION RIGHTS MATRIX

### 2.1 Role Definitions

#### Athlete
- Primary executor of sessions
- Logs execution data
- Can append corrections during grace periods
- CANNOT modify session structure
- CANNOT modify coach-attributed content

#### Coach
- Modifies session structure before execution
- CANNOT modify session structure after athlete starts (IN_PROGRESS)
- CANNOT modify completed sessions (COMPLETED, LOCKED)
- Can append notes and guidance
- Can cancel future sessions (PLANNED, GENERATED)

#### Physio / Medical Staff
- Can override session with rehab protocol
- Can append medical notes
- CANNOT modify execution data
- CANNOT modify completed sessions

#### System
- Generates sessions from program templates
- Applies readiness/ACWR adjustments (before VISIBLE)
- Applies weather overrides (before VISIBLE)
- Appends late-arriving data (check-in, pain reports)
- CANNOT modify session structure after VISIBLE
- CANNOT modify completed sessions

#### Merlin (AI)
- CANNOT modify sessions (read-only assistant)
- CANNOT suggest structural changes
- CANNOT override coach decisions
- Can only explain and guide execution

#### Admin / Support
- Can lock sessions early (emergency)
- Can view audit logs
- CANNOT modify session structure
- CANNOT modify execution data
- Break-glass access only (logged and reviewed)

---

### 2.2 Mutation Rights Matrix

| State | Athlete | Coach | Physio | System | Merlin | Admin |
|-------|---------|-------|--------|--------|--------|-------|
| **UNRESOLVED** | None | None | None | Resolve prerequisites | None | Fix data |
| **PLANNED** | None | Modify template, Cancel | None | Generate on date | None | None |
| **GENERATED** | None | Modify structure, Cancel | Override with rehab | Apply overrides, Append late data | None | None |
| **VISIBLE** | None | Modify structure (v2), Cancel | Override with rehab | Append late data only | None | None |
| **ACKNOWLEDGED** | None | Modify structure (v2, re-ack), Cancel | Override with rehab | Append late data only | None | None |
| **IN_PROGRESS** | Log execution only | **NONE** (structure locked) | Append medical notes | Append late data only | None | None |
| **COMPLETED** | Append corrections (24h) | **NONE** | Append medical notes | Append late data only | None | Lock early |
| **LOCKED** | **NONE** | **NONE** | **NONE** | **NONE** | **NONE** | View audit only |
| **CANCELLED** | **NONE** | **NONE** | **NONE** | **NONE** | **NONE** | View audit only |
| **EXPIRED** | **NONE** | **NONE** | **NONE** | **NONE** | **NONE** | View audit only |
| **ABANDONED** | Append notes (24h) | **NONE** | Append medical notes | Append late data only | None | Lock early |
| **SKIPPED** | Append reason (24h) | **NONE** | Append medical notes | Append late data only | None | Lock early |

**Legend:**
- **NONE** = No modifications allowed (hard ban)
- Modify structure = Change exercises, sets, reps, intensity, duration
- Append late data = Check-in, pain reports, readiness updates (append-only)
- Log execution = Record sets completed, reps, RPE, duration, notes
- Append corrections = Fix typos, add missing data (grace period only)

---

### 2.3 Hard Mutation Bans

#### Ban 1: Coach Modifying IN_PROGRESS Sessions
**Rule:** Coach MUST NOT modify session structure once athlete has started execution (IN_PROGRESS state).

**Rationale:** Athlete is executing specific plan. Changing plan mid-execution creates confusion, liability risk, and audit trail corruption.

**Enforcement:** Backend API MUST reject coach modification requests if `session_state = 'IN_PROGRESS'`.

**Exception:** NONE. Not even admin can override this.

---

#### Ban 2: Coach Modifying COMPLETED Sessions
**Rule:** Coach MUST NOT modify session structure after athlete completes session (COMPLETED state).

**Rationale:** Completed sessions are historical record. Retroactive changes corrupt audit trail and create liability risk.

**Enforcement:** Backend API MUST reject coach modification requests if `session_state = 'COMPLETED'` or `session_state = 'LOCKED'`.

**Exception:** NONE. Corrections can be appended (notes), but structure cannot change.

---

#### Ban 3: System Modifying VISIBLE Sessions
**Rule:** System MUST NOT modify session structure after athlete has seen session (VISIBLE state).

**Rationale:** Athlete has seen specific plan. Changing plan after visibility creates confusion and trust violation.

**Enforcement:** Backend MUST prevent system modifications (readiness adjustments, ACWR adjustments) if `session_state >= 'VISIBLE'`.

**Exception:** Late-arriving data can append (check-in, pain reports), but structure cannot change.

---

#### Ban 4: Athlete Modifying Session Structure
**Rule:** Athlete MUST NOT modify session structure (exercises, sets, reps, intensity) at any state.

**Rationale:** Session structure is coach/system authority. Athlete executes, does not design.

**Enforcement:** Frontend MUST hide modification UI for athletes. Backend MUST reject athlete modification requests.

**Exception:** Athlete can log execution data (what they actually did), but cannot change what was prescribed.

---

#### Ban 5: AI Modifying Coach-Locked Sessions
**Rule:** AI (Merlin) MUST NOT modify any coach-locked session or override coach decisions.

**Rationale:** Coach authority is absolute. AI cannot override coach decisions.

**Enforcement:** Backend MUST reject AI modification requests. Frontend MUST prevent AI from suggesting structural changes.

**Exception:** NONE. AI is read-only assistant.

---

## SECTION 3 — IMMUTABILITY RULES (HARD LAW)

### 3.1 Execution Freeze Moment

**Definition:** The moment when session structure becomes hard immutable and cannot be modified by anyone.

**Trigger:** Session state transitions to IN_PROGRESS.

**What Becomes Immutable:**
- Session structure (exercises, sets, reps, intensity)
- Prescribed duration
- Prescribed intensity
- Coach attribution
- Generation timestamp
- Visible version

**Who Can Modify:** NO ONE (not coach, not system, not admin)

**Exception:** NONE.

---

### 3.2 Audit Freeze Moment

**Definition:** The moment when all session data becomes permanently immutable for audit purposes.

**Trigger:** Session state transitions to LOCKED.

**What Becomes Immutable:**
- EVERYTHING (all fields immutable)
- Session structure
- Execution data
- Timestamps
- Audit logs
- Coach attribution
- Version history

**Who Can Modify:** NO ONE (not athlete, not coach, not system, not admin)

**Exception:** NONE.

---

### 3.3 Field Immutability Timeline

#### Always Immutable (Once Set)
- `session_id` (UUID, never changes)
- `session_date` (date, never changes)
- `generated_at` (timestamp, never changes)
- `generated_by` (system or coach_id, never changes)
- `program_id` (reference, never changes)
- `program_week` (reference, never changes)

#### Immutable After GENERATED
- `session_version` (v1, v2, etc. — version number never changes for existing version)
- `session_structure_hash` (hash of exercises/sets/reps — used for conflict detection)

#### Immutable After VISIBLE
- `visible_at` (timestamp, never changes)
- `visible_version` (which version athlete saw — v1, v2, etc.)

#### Immutable After IN_PROGRESS (Execution Freeze)
- `session_structure` (exercises, sets, reps, intensity — hard immutable)
- `prescribed_duration` (target duration — hard immutable)
- `prescribed_intensity` (target intensity — hard immutable)
- `coach_attribution` (who modified session — hard immutable)
- `session_started_at` (timestamp, never changes)
- `executed_version` (which version athlete executes — hard immutable)

#### Immutable After COMPLETED
- `completed_at` (timestamp, never changes)
- `completion_status` (completed/abandoned/skipped — immutable after 24h)
- Core execution data (RPE, duration — immutable after 24h grace period)

#### Immutable After LOCKED (Audit Freeze)
- **EVERYTHING** (all fields immutable)

---

### 3.4 Readiness Snapshot Immutability

**Rule:** Readiness snapshot at generation time MUST be preserved and MUST NOT be recalculated retroactively.

**When Set:** At GENERATED state (or VISIBLE if late check-in arrives before VISIBLE).

**When Immutable:** After VISIBLE state.

**Rationale:** Readiness at execution time is historical fact. Recalculating changes historical truth.

**Exception:** NONE. Readiness can be recalculated for future sessions, but not for past executions.

---

### 3.5 ACWR Snapshot Immutability

**Rule:** ACWR snapshot at generation time MUST be preserved and MUST NOT be recalculated retroactively.

**When Set:** At GENERATED state.

**When Immutable:** After VISIBLE state.

**Rationale:** ACWR at execution time is historical fact. Recalculating changes historical truth.

**Exception:** NONE. ACWR can be recalculated for future sessions, but not for past executions.

---

## SECTION 4 — MID-DAY CHANGES & RACE CONDITIONS

### 4.1 Deterministic Resolution Principles

**Principle 1: First-Write-Wins for Structure**
- First modification (coach or system) locks structure
- Subsequent modifications create new version (v2, v3)
- Athlete sees version they opened (v1, v2, or v3)

**Principle 2: Athlete Execution Lock**
- Once athlete starts execution (IN_PROGRESS), structure becomes hard immutable
- Coach modifications after IN_PROGRESS are rejected (hard ban)

**Principle 3: Version Visibility**
- Athlete sees version they opened (even if newer version exists)
- Coach sees all versions (v1, v2, v3)
- Audit log preserves all versions

**Principle 4: Conflict Notification**
- If coach modifies session after athlete opens (VISIBLE), athlete MUST be notified
- Notification shows: "Coach [Name] updated this session. View changes?"
- Athlete can choose to see new version (v2) or continue with old version (v1)

---

### 4.2 Scenario: Coach Modifies Session AFTER Athlete Opened TODAY

**Timeline:**
- 08:00 — Session GENERATED (v1)
- 09:00 — Athlete opens TODAY, sees v1 (VISIBLE state)
- 10:30 — Coach modifies session (creates v2)
- 11:00 — Athlete still viewing TODAY (has not started training)

**Resolution:**
1. System creates v2 (new version)
2. System sets `visible_version = 'v1'` for athlete (athlete saw v1)
3. System shows notification banner: "Coach [Name] updated this session at 10:30. [View Changes] [Continue with Original]"
4. If athlete clicks "View Changes": Shows v2, updates `visible_version = 'v2'`
5. If athlete clicks "Continue with Original": Continues with v1, `visible_version` remains 'v1'
6. Both versions preserved in audit log

**What Athlete Executes:**
- Athlete executes version they choose (v1 or v2)
- Execution data linked to chosen version (`executed_version = 'v1'` or `'v2'`)

**What Coach Sees:**
- Coach sees both versions (v1 and v2)
- Coach sees which version athlete executed
- Coach sees athlete's choice timestamp

**Immutability:**
- v1 structure: Immutable (preserved)
- v2 structure: Immutable after creation
- Athlete's choice: Immutable (cannot change after execution starts)

---

### 4.3 Scenario: Coach Modifies Session AFTER Athlete Acknowledged

**Timeline:**
- 08:00 — Session GENERATED (v1)
- 09:00 — Athlete opens TODAY, sees v1 (VISIBLE state)
- 09:30 — Athlete acknowledges session (ACKNOWLEDGED state)
- 10:30 — Coach modifies session (creates v2)

**Resolution:**
1. System creates v2 (new version)
2. System sets `visible_version = 'v1'` for athlete (athlete saw v1)
3. System shows notification banner: "Coach [Name] updated this session at 10:30. [View Changes] [Continue with Original]"
4. If athlete clicks "View Changes": Shows v2, updates `visible_version = 'v2'`, re-acknowledgment may be required if blocking change
5. If athlete clicks "Continue with Original": Continues with v1, `visible_version` remains 'v1'
6. Both versions preserved in audit log

**What Athlete Executes:**
- Athlete executes version they choose (v1 or v2)
- Execution data linked to chosen version (`executed_version = 'v1'` or `'v2'`)

**What Coach Sees:**
- Coach sees both versions (v1 and v2)
- Coach sees which version athlete executed
- Coach sees athlete's choice timestamp

**Immutability:**
- v1 structure: Immutable (preserved)
- v2 structure: Immutable after creation
- Athlete's choice: Immutable (cannot change after execution starts)

---

### 4.4 Scenario: Coach Attempts Modification AFTER IN_PROGRESS

**Timeline:**
- 08:00 — Session GENERATED (v1)
- 09:00 — Athlete opens TODAY, sees v1 (VISIBLE state)
- 10:00 — Athlete starts training, logs first set (IN_PROGRESS state)
- 10:30 — Coach attempts to modify session

**Resolution:**
1. Backend API rejects coach modification request
2. Error returned: "Cannot modify session: Athlete has started execution (IN_PROGRESS state)"
3. Coach sees notification: "This session is in progress. Modifications are locked."
4. Coach can append note (non-structural), but cannot change exercises/sets/reps
5. Athlete continues executing v1 (unaware of modification attempt)

**What Athlete Executes:**
- Athlete executes v1 (original version they saw)
- Execution data linked to v1 (`executed_version = 'v1'`)

**What Coach Sees:**
- Coach sees v1 (original version)
- Coach sees athlete is executing v1
- Coach sees modification was rejected (logged in audit)

**Immutability:**
- v1 structure: Hard immutable (athlete is executing it)
- Coach modification attempt: Logged but rejected

**Rationale:** Once athlete starts execution, changing plan mid-execution creates confusion, liability risk, and audit trail corruption. Hard ban enforced.

---

### 4.5 Scenario: Athlete Starts Session While Coach Change Is In-Flight

**Timeline:**
- 08:00 — Session GENERATED (v1)
- 09:00 — Athlete opens TODAY, sees v1 (VISIBLE state)
- 09:30 — Coach initiates modification (creates v2)
- 09:31 — Athlete starts training (IN_PROGRESS state) — BEFORE coach modification completes

**Resolution:**
1. System checks `session_state` before applying coach modification
2. If `session_state = 'IN_PROGRESS'`, modification is rejected
3. If modification was in-flight but athlete started before completion, modification is rejected
4. Error returned: "Cannot modify session: Athlete has started execution (IN_PROGRESS state)"
5. Athlete continues executing v1 (original version)

**What Athlete Executes:**
- Athlete executes v1 (original version they saw)
- Execution data linked to v1 (`executed_version = 'v1'`)

**What Coach Sees:**
- Coach sees modification was rejected
- Coach sees athlete started execution before modification completed
- Coach sees rejection reason logged in audit

**Immutability:**
- v1 structure: Hard immutable (athlete is executing it)
- Coach modification attempt: Logged but rejected

**Rationale:** Race condition resolved deterministically: athlete execution takes precedence. Coach modification rejected if athlete has started.

---

### 4.6 Versioning Rules

**Version Format:** `v1`, `v2`, `v3`, etc.

**Version Creation:**
- v1: Initial generation (system or coach)
- v2: First modification (coach or system)
- v3: Second modification (coach or system)
- etc.

**Version Storage:**
- Each version stored as separate record in `session_versions` table
- `session_versions.session_id` references main session
- `session_versions.version` stores version number (v1, v2, v3)
- `session_versions.structure` stores JSON snapshot of session structure
- `session_versions.created_at` stores version creation timestamp
- `session_versions.created_by` stores who created version

**Version Immutability:**
- Versions are immutable once created (cannot be updated or deleted)
- Version history is append-only (cannot remove versions)
- All versions preserved in audit log

**Version Visibility:**
- Athlete sees version they opened (`visible_version`)
- Coach sees all versions (v1, v2, v3)
- Audit log preserves all versions

---

### 4.7 Athlete-Visible Messaging

**Rule:** Athlete MUST be notified when coach modifies session after athlete has seen it.

**Notification Format:**
- Banner: "Coach [Name] updated this session at [Time]. [View Changes] [Continue with Original]"
- If blocking change (intensity >10% increase, ACWR override): "Coach [Name] updated this session. Acknowledgment required. [View Changes]"

**Athlete Choice:**
- Athlete can choose to see new version (v2) or continue with old version (v1)
- Athlete's choice is immutable after execution starts
- Athlete's choice is logged in audit trail

**Rationale:** Athlete must be informed of changes and must consent to new version before execution.

---

## SECTION 5 — LATE-ARRIVING DATA HANDLING

### 5.1 Append-Only Principle

**Core Rule:** Late-arriving data MAY annotate, but MUST NOT retroactively change execution decisions.

**Late Data Types:**
- Late check-in (submitted after session GENERATED)
- Late pain report (submitted after session GENERATED)
- Late readiness update (recalculated after session GENERATED)
- Late RPE correction (submitted after session COMPLETED, within 24h grace period)

**Append-Only Enforcement:**
- Late data is stored in separate append-only log
- Late data does not modify session structure
- Late data does not modify execution data (except corrections within grace period)
- Late data is visible in session context but does not affect historical truth

---

### 5.2 Late Check-In Handling

#### Scenario: Check-In Submitted After GENERATED, Before VISIBLE

**Timeline:**
- 08:00 — Session GENERATED (v1, uses program defaults for readiness)
- 09:00 — Athlete submits check-in (readiness = 75, wellness data)
- 10:00 — Athlete opens TODAY, sees v1

**Resolution:**
1. System receives check-in at 09:00
2. System checks `session_state = 'GENERATED'`
3. System CAN modify structure (before VISIBLE)
4. System recalculates session intensity based on readiness = 75
5. System creates v2 with adjusted intensity
6. Athlete sees v2 (latest version) when opening TODAY

**What Athlete Sees:**
- Athlete sees v2 (adjusted intensity based on check-in)
- Check-in data is visible in session context

**What Coach Sees:**
- Coach sees v2 (adjusted version)
- Coach sees check-in was submitted at 09:00
- Coach sees readiness = 75 was used for adjustment

**Immutability:**
- v1 structure: Preserved in audit log (original with defaults)
- v2 structure: Immutable after creation
- Check-in timestamp: Immutable

**Rationale:** Before athlete sees session, system can adjust based on late data. Adjustment creates new version.

---

#### Scenario: Check-In Submitted After VISIBLE, Before IN_PROGRESS

**Timeline:**
- 08:00 — Session GENERATED (v1, uses program defaults)
- 09:00 — Athlete opens TODAY, sees v1 (VISIBLE state)
- 10:00 — Athlete submits check-in (readiness = 75)
- 11:00 — Athlete has not started training yet

**Resolution:**
1. System receives check-in at 10:00
2. System checks `session_state = 'VISIBLE'`
3. System CANNOT modify structure (soft immutable after VISIBLE)
4. System appends check-in data to session context
5. System shows notification: "Check-in received. Your readiness is 75. This session was generated with program defaults. Continue with original plan?"
6. Athlete can choose to continue with v1 or request regeneration (creates v2)

**What Athlete Sees:**
- Athlete sees v1 (original version they opened)
- Check-in data is appended (visible in context)
- Notification offers choice: continue v1 or regenerate v2

**What Coach Sees:**
- Coach sees v1 (original version)
- Coach sees check-in was submitted at 10:00
- Coach sees athlete's choice (continue v1 or regenerate v2)

**Immutability:**
- v1 structure: Soft immutable (athlete saw it)
- Check-in timestamp: Immutable
- Athlete's choice: Immutable after decision

**Rationale:** After athlete sees session, structure is soft immutable. Late check-in appends but does not automatically modify structure. Athlete chooses.

---

#### Scenario: Check-In Submitted After IN_PROGRESS

**Timeline:**
- 08:00 — Session GENERATED (v1, uses program defaults)
- 09:00 — Athlete opens TODAY, sees v1 (VISIBLE state)
- 10:00 — Athlete starts training (IN_PROGRESS state)
- 10:30 — Athlete submits check-in (readiness = 75)

**Resolution:**
1. System receives check-in at 10:30
2. System checks `session_state = 'IN_PROGRESS'`
3. System CANNOT modify structure (hard immutable after IN_PROGRESS)
4. System appends check-in data to session context
5. System shows informational note: "Check-in received. Your readiness is 75. This session was generated with program defaults."
6. Check-in data is logged for future sessions (not current session)

**What Athlete Sees:**
- Athlete sees informational note (non-blocking)
- Athlete continues executing v1
- Check-in data is visible in context (but does not affect current session)

**What Coach Sees:**
- Coach sees v1 (original version athlete is executing)
- Coach sees check-in was submitted at 10:30 (mid-execution)
- Coach sees check-in data (readiness = 75)
- Coach sees this data will be used for future sessions (not current)

**Immutability:**
- v1 structure: Hard immutable (athlete is executing it)
- Check-in timestamp: Immutable
- Check-in data: Appended (does not modify structure)

**Rationale:** After athlete starts execution, structure is hard immutable. Late check-in appends but cannot modify current session. Data used for future sessions.

---

#### Scenario: Check-In Submitted After COMPLETED

**Timeline:**
- 08:00 — Session GENERATED (v1)
- 09:00 — Athlete opens TODAY, sees v1 (VISIBLE state)
- 10:00 — Athlete starts training (IN_PROGRESS state)
- 11:00 — Athlete completes training (COMPLETED state)
- 12:00 — Athlete submits check-in (readiness = 75)

**Resolution:**
1. System receives check-in at 12:00
2. System checks `session_state = 'COMPLETED'`
3. System CANNOT modify structure (hard immutable after COMPLETED)
4. System appends check-in data to session context (historical record)
5. System shows informational note: "Check-in received post-session. This data will be used for future sessions."
6. Check-in data is logged for future sessions (not current session)

**What Athlete Sees:**
- Athlete sees informational note (non-blocking)
- Check-in data is visible in session history (but does not affect completed session)

**What Coach Sees:**
- Coach sees v1 (completed version)
- Coach sees check-in was submitted at 12:00 (post-completion)
- Coach sees check-in data (readiness = 75)
- Coach sees this data will be used for future sessions (not current)

**Immutability:**
- v1 structure: Hard immutable (completed session)
- Check-in timestamp: Immutable
- Check-in data: Appended (does not modify structure)

**Rationale:** Completed sessions are historical record. Late check-in appends but cannot modify completed session. Data used for future sessions.

---

### 5.3 Late Pain Report Handling

#### Scenario: Pain Reported After VISIBLE, Before IN_PROGRESS

**Timeline:**
- 08:00 — Session GENERATED (v1, high-intensity session)
- 09:00 — Athlete opens TODAY, sees v1 (VISIBLE state)
- 10:00 — Athlete reports pain (level 4/10, hamstring)
- 11:00 — Athlete has not started training yet

**Resolution:**
1. System receives pain report at 10:00
2. System checks `session_state = 'VISIBLE'`
3. System checks pain level = 4/10 (>3/10 threshold)
4. System CANNOT modify structure (soft immutable after VISIBLE)
5. System appends safety alert: "⚠️ Pain Reported: Level 4/10 at hamstring. Consider modifying session or contacting physio."
6. System blocks session start (athlete must acknowledge alert before starting)
7. Physio is notified

**What Athlete Sees:**
- Athlete sees safety alert banner (blocking)
- Athlete must acknowledge alert before starting training
- Alert offers: "Contact Physio" or "Acknowledge and Continue"
- Athlete's choice is logged

**What Coach Sees:**
- Coach sees v1 (original version)
- Coach sees pain report was submitted at 10:00
- Coach sees pain level = 4/10 (safety threshold exceeded)
- Coach sees athlete's choice (acknowledged or contacted physio)

**What Physio Sees:**
- Physio sees pain report (if pain >3/10)
- Physio can append medical notes (non-structural)
- Physio can override future sessions (not current session)

**Immutability:**
- v1 structure: Soft immutable (athlete saw it)
- Pain report timestamp: Immutable
- Athlete's choice: Immutable after decision

**Rationale:** Pain report cannot modify structure after VISIBLE, but can block execution if safety threshold exceeded. Athlete chooses whether to proceed.

---

#### Scenario: Pain Reported After IN_PROGRESS

**Timeline:**
- 08:00 — Session GENERATED (v1)
- 09:00 — Athlete opens TODAY, sees v1 (VISIBLE state)
- 10:00 — Athlete starts training (IN_PROGRESS state)
- 10:30 — Athlete reports pain (level 5/10, knee)

**Resolution:**
1. System receives pain report at 10:30
2. System checks `session_state = 'IN_PROGRESS'`
3. System checks pain level = 5/10 (>3/10 threshold)
4. System CANNOT modify structure (hard immutable after IN_PROGRESS)
5. System appends safety alert: "⚠️ Pain Reported: Level 5/10 at knee. Stop training if pain increases."
6. System blocks further execution (athlete must acknowledge alert before continuing)
7. Physio is notified immediately

**What Athlete Sees:**
- Athlete sees safety alert banner (blocking)
- Athlete must acknowledge alert before continuing training
- Alert offers: "Stop Training" or "Acknowledge and Continue"
- Athlete's choice is logged

**What Coach Sees:**
- Coach sees v1 (original version athlete is executing)
- Coach sees pain report was submitted at 10:30 (mid-execution)
- Coach sees pain level = 5/10 (safety threshold exceeded)
- Coach sees athlete's choice (stopped or continued)

**What Physio Sees:**
- Physio sees pain report (immediate notification)
- Physio can append medical notes (non-structural)
- Physio can override future sessions (not current session)

**Immutability:**
- v1 structure: Hard immutable (athlete is executing it)
- Pain report timestamp: Immutable
- Athlete's choice: Immutable after decision

**Rationale:** Pain report cannot modify structure mid-execution, but can block further execution if safety threshold exceeded. Athlete chooses whether to proceed.

---

### 5.4 Late Readiness Update Handling

#### Scenario: Readiness Recalculated After COMPLETED

**Timeline:**
- 08:00 — Session GENERATED (v1, uses readiness = 80)
- 09:00 — Athlete opens TODAY, sees v1 (VISIBLE state)
- 10:00 — Athlete starts training (IN_PROGRESS state)
- 11:00 — Athlete completes training (COMPLETED state)
- 12:00 — System recalculates readiness (new value = 75, based on updated wellness data)

**Resolution:**
1. System recalculates readiness at 12:00
2. System checks `session_state = 'COMPLETED'`
3. System CANNOT modify structure (hard immutable after COMPLETED)
4. System CANNOT recalculate readiness for completed session (hard ban)
5. System stores new readiness value (75) for future sessions (not current)
6. Completed session retains original readiness value (80) used at generation time

**What Athlete Sees:**
- Athlete sees completed session with original readiness = 80 (historical fact)
- New readiness = 75 is used for future sessions (not current)

**What Coach Sees:**
- Coach sees completed session with original readiness = 80 (historical fact)
- Coach sees new readiness = 75 is calculated for future sessions (not current)

**Immutability:**
- v1 structure: Hard immutable (completed session)
- Original readiness value (80): Immutable (historical fact)
- New readiness value (75): Used for future sessions (not current)

**Rationale:** Readiness at execution time is historical fact. Recalculating readiness for completed sessions corrupts audit trail. Hard ban enforced.

---

### 5.5 Late RPE Correction Handling

#### Scenario: RPE Correction Submitted After COMPLETED, Within 24h Grace Period

**Timeline:**
- 08:00 — Session GENERATED (v1)
- 09:00 — Athlete opens TODAY, sees v1 (VISIBLE state)
- 10:00 — Athlete starts training (IN_PROGRESS state)
- 11:00 — Athlete completes training, logs RPE = 8 (COMPLETED state)
- 12:00 — Athlete realizes RPE was incorrect, submits correction: RPE = 7

**Resolution:**
1. System receives RPE correction at 12:00
2. System checks `session_state = 'COMPLETED'`
3. System checks time elapsed: `12:00 - 11:00 = 1 hour` (< 24h grace period)
4. System allows correction (within grace period)
5. System appends correction log: "RPE corrected from 8 to 7 at 12:00"
6. System updates RPE value: `rpe = 7`
7. Original RPE value (8) preserved in audit log

**What Athlete Sees:**
- Athlete sees corrected RPE = 7
- Athlete sees correction log: "RPE corrected from 8 to 7 at 12:00"

**What Coach Sees:**
- Coach sees corrected RPE = 7
- Coach sees correction log: "RPE corrected from 8 to 7 at 12:00"
- Coach sees original RPE value (8) in audit log

**Immutability:**
- Original RPE value (8): Preserved in audit log (immutable)
- Corrected RPE value (7): Immutable after grace period expires
- Correction timestamp: Immutable

**Rationale:** Athlete can correct typos within 24h grace period. Original value preserved in audit log for transparency.

---

#### Scenario: RPE Correction Submitted After COMPLETED, After 24h Grace Period

**Timeline:**
- 08:00 — Session GENERATED (v1)
- 09:00 — Athlete opens TODAY, sees v1 (VISIBLE state)
- 10:00 — Athlete starts training (IN_PROGRESS state)
- 11:00 — Athlete completes training, logs RPE = 8 (COMPLETED state)
- 12:00 — Session transitions to LOCKED (24h grace period expired)
- 13:00 — Athlete realizes RPE was incorrect, attempts correction: RPE = 7

**Resolution:**
1. System receives RPE correction attempt at 13:00
2. System checks `session_state = 'LOCKED'`
3. System rejects correction (grace period expired)
4. Error returned: "Cannot modify session: Session is locked. Corrections are no longer possible."
5. Original RPE value (8) remains unchanged

**What Athlete Sees:**
- Athlete sees error: "Cannot modify session: Session is locked. Corrections are no longer possible."
- Athlete sees original RPE = 8 (unchanged)

**What Coach Sees:**
- Coach sees original RPE = 8 (unchanged)
- Coach sees correction attempt was rejected (logged in audit)

**Immutability:**
- Original RPE value (8): Immutable (locked session)
- Correction attempt: Logged but rejected

**Rationale:** After grace period expires, session is locked. No corrections allowed. Original value preserved.

---

## SECTION 6 — COMPLETION, GRACE PERIOD, LOCKING

### 6.1 Completion Definition

A session is considered **COMPLETED** when:
1. Athlete marks session "complete" OR
2. All exercises are marked "done" or "skipped" AND
3. Minimum required data is present:
   - `rpe` (1-10 scale, required)
   - `duration_minutes` (>0, required)
   - `session_started_at` (timestamp, required)

**Optional but recommended:**
- Exercise-specific notes
- Overall session notes
- Pain level during session (if applicable)

---

### 6.2 Minimum Required Data

#### Required Fields for COMPLETED State

**Absolute Requirements:**
- `rpe` (integer, 1-10): Perceived exertion
- `duration_minutes` (integer, >0): Total session duration
- `session_started_at` (timestamp): When athlete started
- `completed_at` (timestamp): When athlete completed

**If Missing:**
- System blocks completion (athlete cannot mark "complete" without RPE and duration)
- System shows error: "Please log RPE and duration before completing session"

**Rationale:** RPE and duration are minimum data needed for load calculation and audit trail.

---

### 6.3 24-Hour Correction Window Rules

**Duration:** 24 hours after COMPLETED state

**Allowed Corrections:**
- Fix typos in RPE (e.g., "8" → "7")
- Fix typos in duration (e.g., "60" → "45")
- Add missing RPE (if forgotten)
- Add missing duration (if forgotten)
- Add exercise-specific notes
- Add overall session notes

**Forbidden Corrections:**
- Change exercise completion status (done → skipped, skipped → done)
- Change prescribed values (what coach assigned)
- Change session structure (exercises, sets, reps)
- Change completion timestamp
- Change coach attribution

**After Grace Period:**
- All corrections locked
- Session transitions to LOCKED state
- No modifications allowed

---

### 6.4 Auto-Lock Conditions

**Trigger:** 24 hours after COMPLETED state

**Process:**
1. System checks `completed_at` timestamp
2. System calculates time elapsed: `now - completed_at`
3. If `time_elapsed >= 24 hours`:
   - System transitions session to LOCKED state
   - System sets `locked_at` timestamp
   - System prevents all modifications

**Notification:**
- Athlete receives notification: "Session locked. Corrections are no longer possible."
- Coach receives notification: "Session locked. Modifications are no longer possible."

---

### 6.5 Manual Lock Conditions

**Trigger:** Admin explicitly locks session (emergency)

**Process:**
1. Admin requests lock via break-glass access
2. System checks admin permissions
3. System logs admin action (justification required)
4. System transitions session to LOCKED state immediately
5. System sets `locked_at` timestamp
6. System prevents all modifications

**Use Cases:**
- Legal investigation requires immediate lock
- Data integrity concern requires immediate lock
- Athlete/coach dispute requires immediate lock

**Rationale:** Admin can lock sessions early for legal/compliance reasons, but cannot modify content.

---

### 6.6 Who Can Unlock

**Rule:** NO ONE can unlock a LOCKED session.

**Rationale:** Locked sessions are permanent audit records. Unlocking corrupts audit trail and creates legal risk.

**Exception:** NONE. Not even admin can unlock locked sessions.

---

## SECTION 7 — AUDIT & LIABILITY GUARANTEES

### 7.1 Immutable Audit Fields

#### Fields That Become Immutable

**At GENERATED:**
- `session_id` (UUID)
- `session_date` (date)
- `generated_at` (timestamp)
- `generated_by` (system or coach_id)
- `program_id` (reference)
- `program_week` (reference)

**At VISIBLE:**
- `visible_at` (timestamp)
- `visible_version` (which version athlete saw)

**At IN_PROGRESS:**
- `session_structure` (exercises, sets, reps, intensity)
- `prescribed_duration` (target duration)
- `prescribed_intensity` (target intensity)
- `coach_attribution` (who modified session)
- `session_started_at` (timestamp)
- `executed_version` (which version athlete executes)

**At COMPLETED:**
- `completed_at` (timestamp)
- `completion_status` (completed/abandoned/skipped)
- Core execution data (RPE, duration — after 24h grace period)

**At LOCKED:**
- **EVERYTHING** (all fields immutable)

---

### 7.2 Who Decided

**Rule:** System MUST record who made each decision and when.

**Required Fields:**
- `actor_id` (UUID, who performed action)
- `actor_role` (enum: athlete, coach, physio, system, admin)
- `decision_timestamp` (ISO 8601)
- `decision_context` (JSON, what data was known at the time)

**Immutability:**
- `actor_id`: Immutable once set
- `actor_role`: Immutable once set
- `decision_timestamp`: Immutable once set
- `decision_context`: Immutable once set

**Rationale:** Audit trail must show who decided what and when, for liability protection and dispute resolution.

---

### 7.3 What Data Was Known at the Time

**Rule:** System MUST record what data was known at decision time.

**Required Fields:**
- `readiness_at_generation` (readiness value used at generation)
- `acwr_at_generation` (ACWR value used at generation)
- `weather_at_generation` (weather conditions at generation)
- `wellness_snapshot` (JSON, wellness data snapshot at generation)
- `program_context` (JSON, program context at generation)

**Immutability:**
- All snapshot fields: Immutable once set

**Rationale:** Decision context must be preserved for liability protection. Recalculating readiness/ACWR retroactively corrupts audit trail.

---

### 7.4 What Version Athlete Executed

**Rule:** System MUST record which version athlete saw and executed.

**Required Fields:**
- `visible_version` (v1, v2, etc., which version athlete saw)
- `executed_version` (v1, v2, etc., which version athlete executed)
- `visible_at` (timestamp, when athlete saw version)
- `executed_at` (timestamp, when athlete executed version)

**Immutability:**
- `visible_version`: Immutable once set
- `executed_version`: Immutable once set
- `visible_at`: Immutable once set
- `executed_at`: Immutable once set

**Rationale:** Version tracking enables dispute reconstruction. System can show exactly what athlete saw and executed.

---

### 7.5 Dispute Reconstruction Guarantee

**Rule:** System MUST be able to reconstruct complete session history for any dispute.

**Reconstruction Process:**
1. Query `session_versions` table for `session_id`
2. Filter by `visible_version` (which version athlete saw)
3. Retrieve `structure` JSON for that version
4. Retrieve `visible_at` timestamp (when athlete saw it)
5. Retrieve `session_started_at` timestamp (when athlete started)
6. Retrieve execution data (`executed_version` links to version)
7. Retrieve decision context (readiness, ACWR, weather at generation)
8. Retrieve coach attribution (who modified, when, why)
9. Retrieve athlete choices (acknowledged, continued, stopped)
10. Reconstruct complete picture: "Athlete saw v2 at 09:00, started executing v2 at 10:00, completed v2 at 11:00. Coach modified at 08:30. Readiness was 75 at generation."

**Reconstruction Guarantees:**
- System can show exactly what athlete saw (version + timestamp)
- System can show exactly what athlete executed (version + execution data)
- System can show all modifications (v1 → v2 → v3) with timestamps
- System can show coach attribution for each version
- System can show athlete's choices (acknowledged, continued, stopped)
- System can show decision context (readiness, ACWR, weather at generation)

**Use Cases:**
- Legal disputes: "What did athlete see when they trained?"
- Injury investigations: "What was prescribed vs what was executed?"
- Coach accountability: "Who modified session and when?"
- Athlete accountability: "Did athlete execute prescribed plan?"

---

### 7.6 Coach Liability Protection

**Audit Trail Protects Coach Decisions:**
- Coach's decisions are preserved (version history)
- Coach's rationale is preserved (`modification_reason`)
- Coach's timestamps are preserved (`modified_at`)
- Coach's context is preserved (readiness, ACWR, weather at decision time)
- Coach's overrides are logged (`override_flags`)

**If Injury Occurs:**
- System can show: "Coach modified session at 10:00, athlete saw v2 at 11:00, athlete started executing v2 at 12:00"
- System can show: "Coach was aware of readiness = 35, ACWR = 1.6, weather = dangerous"
- System can show: "Coach provided reason: 'Competition prep, monitoring closely'"
- System can show: "Athlete acknowledged modification at 11:30"

**Rationale:** Audit trail protects coach by showing decision context and athlete consent.

---

### 7.7 Athlete Informed-Consent Proof

**Audit Trail Protects Athlete Execution:**
- Athlete's execution is preserved (what they actually did)
- Athlete's choices are preserved (acknowledged, continued, stopped)
- Athlete's timestamps are preserved (`session_started_at`, `completed_at`)
- Athlete's data is preserved (RPE, duration, notes)
- Athlete's version is preserved (`visible_version`, `executed_version`)

**If Dispute Occurs:**
- System can show: "Athlete saw v1 at 09:00, started executing v1 at 10:00"
- System can show: "Coach modified session at 10:30 (after athlete started)"
- System can show: "Modification was rejected (athlete already IN_PROGRESS)"
- System can show: "Athlete executed v1 as originally seen"

**Rationale:** Audit trail protects athlete by showing what they saw and executed, even if coach attempted modification.

---

## SECTION 8 — FORBIDDEN PATTERNS (HARD BANS)

### 8.1 Retroactive Session Edits

**Forbidden:** Coach modifying session structure after athlete completes session (COMPLETED or LOCKED state).

**Rationale:** Completed sessions are historical record. Retroactive changes corrupt audit trail and create liability risk.

**Enforcement:** Backend API MUST reject coach modification requests if `session_state = 'COMPLETED'` or `session_state = 'LOCKED'`.

**Exception:** NONE. Not even admin can override this.

---

### 8.2 Recalculating Readiness Post-Execution

**Forbidden:** System recalculating readiness scores for completed sessions and retroactively changing session structure.

**Rationale:** Readiness at execution time is historical fact. Recalculating changes historical truth.

**Enforcement:** Backend MUST prevent readiness recalculation if `session_state >= 'COMPLETED'`.

**Exception:** Readiness can be recalculated for future sessions (PLANNED, GENERATED), but not for past executions.

---

### 8.3 Silent History Mutation

**Forbidden:** System modifying execution data (RPE, duration, notes) without athlete's explicit action or after 24-hour grace period.

**Rationale:** Execution data is historical fact. Silent changes corrupt audit trail and create trust violation.

**Enforcement:** Backend MUST prevent execution data modifications after 24-hour grace period. All modifications MUST be logged with actor and timestamp.

**Exception:** Athlete can correct typos within 24-hour grace period (explicit action required).

---

### 8.4 Timestamp Rewriting

**Forbidden:** System or admin modifying timestamps (`generated_at`, `visible_at`, `completed_at`, etc.) after they are set.

**Rationale:** Timestamps are audit trail. Changing timestamps retroactively corrupts historical record.

**Enforcement:** Database constraints prevent timestamp updates. Backend API has no update endpoints for timestamps.

**Exception:** NONE. Not even admin can change timestamps.

---

### 8.5 AI Rewriting Coach Decisions

**Forbidden:** AI (Merlin) modifying any coach-locked session or overriding coach decisions.

**Rationale:** Coach authority is absolute. AI cannot override coach decisions.

**Enforcement:** Backend MUST reject AI modification requests. Frontend MUST prevent AI from suggesting structural changes.

**Exception:** NONE. AI is read-only assistant.

---

### 8.6 "Effective from Earlier Today" Edits

**Forbidden:** Coach modifying session with "effective from earlier today" timestamp, retroactively changing what athlete saw.

**Rationale:** Athlete saw specific version at specific time. Retroactive edits corrupt audit trail and create trust violation.

**Enforcement:** Backend MUST reject modifications with retroactive timestamps. All modifications MUST use current timestamp.

**Exception:** NONE. Modifications cannot be backdated.

---

### 8.7 Coach Modifying Structure After IN_PROGRESS

**Forbidden:** Coach modifying session structure after athlete starts execution (IN_PROGRESS state).

**Rationale:** Athlete is executing specific plan. Changing plan mid-execution creates confusion, liability risk, and audit trail corruption.

**Enforcement:** Backend API MUST reject coach modification requests if `session_state = 'IN_PROGRESS'`.

**Exception:** NONE. Not even admin can override this.

---

### 8.8 System Modifying Session After Athlete Sees It

**Forbidden:** System modifying session structure after athlete has seen session (VISIBLE state).

**Rationale:** Athlete has seen specific plan. Changing plan after visibility creates confusion and trust violation.

**Enforcement:** Backend MUST prevent system modifications (readiness adjustments, ACWR adjustments) if `session_state >= 'VISIBLE'`.

**Exception:** Late-arriving data can append (check-in, pain reports), but structure cannot change.

---

### 8.9 Changing Coach Attribution Retroactively

**Forbidden:** System or admin changing coach attribution (`modified_by_coach_id`, `modified_at_timestamp`) after modification is logged.

**Rationale:** Coach attribution is liability protection. Changing attribution retroactively corrupts audit trail and creates legal risk.

**Enforcement:** Database constraints prevent attribution updates. Backend API has no update endpoints for attribution.

**Exception:** NONE. Not even admin can change attribution.

---

### 8.10 Allowing Athlete to Modify Session Structure

**Forbidden:** Athlete modifying session structure (exercises, sets, reps, intensity) at any state.

**Rationale:** Session structure is coach/system authority. Athlete executes, does not design.

**Enforcement:** Frontend MUST hide modification UI for athletes. Backend MUST reject athlete modification requests.

**Exception:** Athlete can log execution data (what they actually did), but cannot change what was prescribed.

---

### 8.11 Deleting Sessions Instead of Locking

**Forbidden:** System or admin deleting sessions (soft delete or hard delete). Sessions MUST be locked, not deleted.

**Rationale:** Deleted sessions cannot be audited. Locking preserves audit trail while preventing modifications.

**Enforcement:** Backend MUST prevent session deletion. Only locking is allowed.

**Exception:** NONE. Not even admin can delete sessions.

---

### 8.12 Overwriting Logs Instead of Appending

**Forbidden:** System overwriting audit logs or execution logs. All logs MUST be append-only.

**Rationale:** Overwriting logs corrupts audit trail. Append-only ensures historical integrity.

**Enforcement:** Database constraints prevent log updates. Backend API has no update endpoints for logs.

**Exception:** NONE. Not even admin can overwrite logs.

---

## SECTION 9 — CONCRETE TIMELINE EXAMPLES

### Example 1: Normal Lifecycle

**Timeline:**
- **2026-01-06 00:00** — System generates session (v1) from program template. State: GENERATED
- **2026-01-06 08:00** — Athlete opens TODAY screen, sees v1. State: VISIBLE, `visible_version = 'v1'`
- **2026-01-06 09:00** — Athlete starts training, logs first set. State: IN_PROGRESS, `session_started_at = 2026-01-06T09:00:00Z`
- **2026-01-06 10:00** — Athlete completes training, logs RPE=7, duration=60min. State: COMPLETED, `completed_at = 2026-01-06T10:00:00Z`
- **2026-01-07 10:00** — 24-hour grace period expires. State: LOCKED, `locked_at = 2026-01-07T10:00:00Z`

**Mutations:**
- **00:00-08:00:** Coach can modify structure (before VISIBLE) ✅
- **08:00-09:00:** Coach can modify structure (creates v2, conflict resolution) ✅
- **09:00-10:00:** Coach CANNOT modify structure (IN_PROGRESS, hard ban) ❌
- **10:00-10:00+24h:** Athlete can correct typos (grace period) ✅
- **After 24h:** NO modifications allowed (LOCKED) ❌

**Audit Trail:**
- v1 structure preserved
- `visible_at = 2026-01-06T08:00:00Z` (immutable)
- `session_started_at = 2026-01-06T09:00:00Z` (immutable)
- `completed_at = 2026-01-06T10:00:00Z` (immutable)
- `locked_at = 2026-01-07T10:00:00Z` (immutable)

---

### Example 2: Coach Change Before Execution

**Timeline:**
- **2026-01-06 00:00** — System generates session (v1). State: GENERATED
- **2026-01-06 07:00** — Coach modifies session (increases intensity). Creates v2. State: GENERATED (v2)
- **2026-01-06 08:00** — Athlete opens TODAY screen, sees v2. State: VISIBLE, `visible_version = 'v2'`
- **2026-01-06 09:00** — Athlete starts training. State: IN_PROGRESS, `executed_version = 'v2'`
- **2026-01-06 10:00** — Athlete completes training. State: COMPLETED

**Mutations:**
- **00:00-07:00:** Coach can modify (before VISIBLE) ✅
- **07:00:** Coach modifies, creates v2 ✅
- **08:00:** Athlete sees v2 (latest version) ✅
- **09:00-10:00:** Coach CANNOT modify (IN_PROGRESS) ❌

**Audit Trail:**
- v1 structure preserved (original)
- v2 structure preserved (modified)
- `modified_by_coach_id` preserved (immutable)
- `modified_at = 2026-01-06T07:00:00Z` (immutable)
- `visible_version = 'v2'` (athlete saw v2)
- `executed_version = 'v2'` (athlete executed v2)

---

### Example 3: Coach Change Rejected After IN_PROGRESS

**Timeline:**
- **2026-01-06 00:00** — System generates session (v1). State: GENERATED
- **2026-01-06 08:00** — Athlete opens TODAY screen, sees v1. State: VISIBLE, `visible_version = 'v1'`
- **2026-01-06 09:00** — Athlete starts training, logs first set. State: IN_PROGRESS, `executed_version = 'v1'`
- **2026-01-06 09:30** — Coach attempts to modify session. **REJECTED** (hard ban)
- **2026-01-06 10:00** — Athlete completes training. State: COMPLETED

**Mutations:**
- **00:00-08:00:** Coach can modify (before VISIBLE) ✅
- **08:00:** Athlete sees v1 ✅
- **09:00:** Athlete starts, structure becomes hard immutable ✅
- **09:30:** Coach modification **REJECTED** ❌ (hard ban enforced)
- **10:00:** Athlete completes v1 ✅

**Audit Trail:**
- v1 structure preserved (original, executed)
- Coach modification attempt logged but rejected
- `executed_version = 'v1'` (athlete executed v1, not v2)
- Rejection reason: "Cannot modify session: Athlete has started execution (IN_PROGRESS state)"

---

### Example 4: Athlete Abandons Session

**Timeline:**
- **2026-01-06 00:00** — System generates session (v1). State: GENERATED
- **2026-01-06 08:00** — Athlete opens TODAY screen, sees v1. State: VISIBLE, `visible_version = 'v1'`
- **2026-01-06 09:00** — Athlete starts training, logs first set. State: IN_PROGRESS, `executed_version = 'v1'`
- **2026-01-06 09:30** — Athlete abandons session (stops mid-execution). State: ABANDONED, `abandoned_at = 2026-01-06T09:30:00Z`
- **2026-01-07 09:30** — 24-hour grace period expires. State: LOCKED, `locked_at = 2026-01-07T09:30:00Z`

**Mutations:**
- **00:00-08:00:** Coach can modify (before VISIBLE) ✅
- **08:00:** Athlete sees v1 ✅
- **09:00:** Athlete starts, structure becomes hard immutable ✅
- **09:30:** Athlete abandons ✅
- **09:30-09:30+24h:** Athlete can append notes (grace period) ✅
- **After 24h:** NO modifications allowed (LOCKED) ❌

**Audit Trail:**
- v1 structure preserved (original, partially executed)
- `session_started_at = 2026-01-06T09:00:00Z` (immutable)
- `abandoned_at = 2026-01-06T09:30:00Z` (immutable)
- Partial execution data preserved (what athlete did before abandoning)
- `locked_at = 2026-01-07T09:30:00Z` (immutable)

---

### Example 5: Late Data Arrival After Lock

**Timeline:**
- **2026-01-06 00:00** — System generates session (v1, uses program defaults). State: GENERATED
- **2026-01-06 08:00** — Athlete opens TODAY screen, sees v1. State: VISIBLE, `visible_version = 'v1'`
- **2026-01-06 09:00** — Athlete starts training. State: IN_PROGRESS, `executed_version = 'v1'`
- **2026-01-06 10:00** — Athlete completes training. State: COMPLETED, `completed_at = 2026-01-06T10:00:00Z`
- **2026-01-07 10:00** — 24-hour grace period expires. State: LOCKED, `locked_at = 2026-01-07T10:00:00Z`
- **2026-01-07 12:00** — Athlete submits check-in (readiness = 75). **APPENDED** (does not modify structure)

**Mutations:**
- **00:00-08:00:** System can adjust based on check-in (before VISIBLE) ✅
- **08:00:** Athlete sees v1 (with defaults) ✅
- **09:00-10:00:** Structure hard immutable (IN_PROGRESS) ✅
- **10:00:** Structure hard immutable (COMPLETED) ✅
- **10:00+24h:** Structure hard immutable (LOCKED) ✅
- **12:00:** Check-in **APPENDED** ✅ (does not modify structure, used for future sessions)

**Audit Trail:**
- v1 structure preserved (original, executed with defaults)
- Check-in data appended at 12:00 (immutable timestamp)
- Check-in data used for future sessions (not current)
- Completed session retains original readiness defaults (historical fact)
- Session remains LOCKED (no modifications allowed)

---

## SECTION 10 — CONTRACT ENFORCEMENT

### 10.1 Enforcement Mechanisms

This contract is enforced via:
- **Database constraints:** Immutable fields, append-only logs, version history
- **Backend API:** State-based mutation checks, rejection of forbidden actions
- **Frontend UI:** State-based UI rendering, blocking of forbidden actions
- **Audit triggers:** Logging of all state changes and modification attempts

---

### 10.2 Violation Handling

If system detects contract violation:
1. **Log error** with full context (attempted action, violating component, timestamp, state)
2. **Block action immediately** (no partial execution)
3. **Alert engineering team** (critical violation)
4. **Notify affected parties** (athlete, coach, admin if applicable)
5. **Preserve audit trail** (violation attempt logged, even if rejected)

---

### 10.3 Contract Updates

This contract may be updated ONLY via:
- **Formal versioning** (v1 → v2)
- **Explicit changelog** documenting what changed
- **Stakeholder review** (product, engineering, coaching staff, legal)
- **Migration plan** for in-flight sessions

Versioning follows semantic versioning: MAJOR.MINOR (e.g., v1.0, v1.1, v2.0).

---

## DOCUMENT METADATA

**Maintained By:** Product Architecture + Engineering  
**Enforcement:** All session lifecycle implementations MUST comply exactly  
**Testing:** QA must verify all state transitions, mutation rights, and immutability rules deterministically  
**Review Cycle:** Quarterly or on contract breach

**Related Documents:**
- Step 2.1: TODAY Screen UX Authority Contract v1
- Step 2.2: TODAY State → Behavior Resolution Contract v1
- Step 2.3: Merlin Dialogue Authority Contract v1
- Step 2.4: Coach Authority & Visibility Contract v1
- Step 2.5: Data Consent & Visibility Contract v1
- Backend Truthfulness Contract

**Version History:**
- v1.0 (2026-01-06): Initial session lifecycle authority contract

---

## END OF DOCUMENT

**This contract is law. Deviation is system failure.**

**Status:** FINAL (v1.0)  
**Effective Date:** 2026-01-06  
**Next Review:** Upon implementation or material system change  
**Authority:** Product Architecture, endorsed by Engineering, Legal, and Coaching

This contract is now binding for all system components, UI flows, backend logic, and audit systems.


# Step 2.6: Session Lifecycle & Immutability Contract (v1)

**Contract Version:** 1.0  
**Date:** January 6, 2026  
**Status:** Normative (Binding)  
**Scope:** Training session lifecycle, mutation rights, immutability rules, and audit guarantees  
**Supersedes:** None  
**Depends On:**
- Step 2.1: TODAY Screen UX Authority Contract v1 (FINAL)
- Step 2.2: TODAY State → Behavior Resolution Contract v1 (FINAL)
- Step 2.3: Merlin Dialogue Authority Contract v1 (FINAL)
- Step 2.4: Coach Authority & Visibility Contract v1 (FINAL)
- Step 2.5: Data Consent & Visibility Contract v1 (FINAL)
- Backend Truthfulness Contract (ENFORCED)

---

## Preamble

This contract defines the **complete lifecycle of a training session**, from pre-generation through post-completion immutability. It establishes:

- When sessions exist and in what states
- Who can modify what, and when
- What becomes immutable and when
- How race conditions are resolved deterministically
- How late-arriving data is handled
- What is frozen forever for audit and liability protection

This contract is **legally binding system law**. All backend logic, frontend UI, coach tools, athlete interfaces, and Merlin dialogue behavior MUST comply. Retroactive changes to completed sessions are a legal and trust risk. This contract prevents such violations.

**Core Principles:**
1. Sessions are derived from 52-week programs and/or explicit coach actions
2. Backend is the single source of truth
3. Auditability and liability protection are mandatory
4. Once an athlete begins execution, session structure becomes immutable
5. Completion triggers permanent lock
6. All modifications are versioned and auditable
7. Race conditions resolve deterministically (first-write-wins or explicit conflict resolution)
8. Late data appends, never overwrites historical truth

---

## SECTION 1 — Session States (Canonical)

### 1.1 State Definitions

A training session MUST exist in exactly one of the following states at any given time. States are mutually exclusive and ordered by lifecycle progression.

#### UNRESOLVED

**Definition:** Session cannot be generated due to missing prerequisites or system failure.

**Entry Conditions:**
- No active program assigned to athlete
- Program exists but session resolution fails (backend error)
- Required data missing (athlete profile incomplete, program corrupted)

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
- UNRESOLVED → COMPLETED (impossible)

**Who Can Modify:** System only (resolves prerequisites), Admin (manual fixes)

**What Is Mutable:** None (session does not exist)

**What Is Immutable:** N/A (no session structure exists)

---

#### PLANNED

**Definition:** Session is scheduled in program calendar but not yet generated for specific date.

**Entry Conditions:**
- Program exists with session template for date
- Date is in future (not today, not past)
- No explicit coach cancellation

**Exit Conditions:**
- Date becomes "today" (midnight transition) → GENERATED
- Coach cancels session → CANCELLED (terminal state)
- Program ends or athlete removed → CANCELLED

**Allowed Transitions:**
- PLANNED → GENERATED (date becomes today)
- PLANNED → CANCELLED (coach cancels, program ends)
- PLANNED → PLANNED (coach modifies template, but session not yet generated)

**Forbidden Transitions:**
- PLANNED → VISIBLE (must be GENERATED first)
- PLANNED → IN_PROGRESS (cannot execute future session)
- PLANNED → COMPLETED (impossible)

**Who Can Modify:** Coach (modify template, cancel), System (generate on date transition)

**What Is Mutable:**
- Session template (exercises, duration, intensity)
- Scheduled date (coach can reschedule)
- Assignment status (coach can assign/unassign)

**What Is Immutable:** Nothing yet (session not instantiated)

---

#### GENERATED

**Definition:** Session has been instantiated for today's date with specific exercises, sets, reps, and intensity.

**Entry Conditions:**
- Date is "today" (midnight transition from PLANNED)
- Backend successfully resolved session from program template
- Session structure exists in database with `session_date = today`

**Exit Conditions:**
- Athlete opens TODAY screen → VISIBLE
- Coach modifies session → GENERATED (new version, v2)
- Date passes without execution → EXPIRED (terminal state)

**Allowed Transitions:**
- GENERATED → VISIBLE (athlete views session)
- GENERATED → GENERATED (coach modifies, creates v2)
- GENERATED → EXPIRED (date passes, no execution)
- GENERATED → CANCELLED (coach cancels before visibility)

**Forbidden Transitions:**
- GENERATED → IN_PROGRESS (must be VISIBLE first)
- GENERATED → COMPLETED (cannot complete unseen session)

**Who Can Modify:** Coach (modify structure), System (weather override, readiness adjustment)

**What Is Mutable:**
- Exercise selection (coach can swap exercises)
- Sets/reps/intensity (coach can modify)
- Duration (coach can change)
- Override flags (coach can add weather/practice overrides)

**What Is Immutable:** Nothing yet (but modifications create new version)

---

#### VISIBLE

**Definition:** Athlete has opened TODAY screen and seen session content. Session is now "in play."

**Entry Conditions:**
- Session is GENERATED
- Athlete opens TODAY screen
- Session is displayed to athlete (even if not acknowledged)

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

**Who Can Modify:** Coach (modify with conflict resolution), System (append late data only)

**What Is Mutable:**
- Session structure (coach can modify, but creates conflict if athlete already started)
- Late-arriving data (check-in, pain report) appends

**What Is Immutable:** Session structure becomes "soft immutable" — modifications create new version, athlete sees version they opened

---

#### ACKNOWLEDGED

**Definition:** Athlete has explicitly acknowledged session (if acknowledgment required per coach modification rules).

**Entry Conditions:**
- Session is VISIBLE
- Coach modification requires acknowledgment (intensity >10% increase, ACWR override, weather override)
- Athlete presses "I Understand" or equivalent acknowledgment button

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

**Who Can Modify:** Coach (modify with re-acknowledgment if required), System (append late data)

**What Is Mutable:**
- Session structure (coach can modify, but re-acknowledgment required if blocking change)
- Late-arriving data (check-in, pain report) appends

**What Is Immutable:** Acknowledgment timestamp (permanent audit record)

---

#### IN_PROGRESS

**Definition:** Athlete has started executing session. First exercise marked "started" or first set logged.

**Entry Conditions:**
- Session is VISIBLE or ACKNOWLEDGED
- Athlete presses "Start Training" or logs first set/rep
- `session_started_at` timestamp recorded

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

**Who Can Modify:** Athlete (log execution data only), System (append late data), Coach (CANNOT modify structure)

**What Is Mutable:**
- Execution data (sets completed, reps logged, RPE, duration, notes)
- Late-arriving data (check-in submitted mid-session, pain reported mid-session) appends
- Exercise completion status (athlete marks exercises done/skipped)

**What Is Immutable:** Session structure (exercises, prescribed sets/reps, intensity targets), Coach attribution, Generation timestamp

---

#### COMPLETED

**Definition:** Athlete has finished session execution. All exercises completed or explicitly skipped. Minimum required data logged (RPE, duration).

**Entry Conditions:**
- Session is IN_PROGRESS
- Athlete marks session "complete" OR all exercises marked done/skipped
- Minimum required data present: `rpe` (1-10), `duration_minutes` (>0)

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

**Who Can Modify:** Athlete (append corrections within 24h), Coach (CANNOT modify structure), System (append late data only)

**What Is Mutable (24-hour grace period only):**
- Execution data corrections (athlete can fix typos in RPE, duration, notes)
- Missing data completion (athlete can add missing RPE if forgotten)

**What Is Immutable:** Session structure, Coach attribution, Completion timestamp, Core execution data (after 24h)

---

#### LOCKED

**Definition:** Session is permanently immutable. All modifications forbidden. Audit record frozen.

**Entry Conditions:**
- Session is COMPLETED
- 24-hour grace period has expired
- OR admin explicitly locks session (emergency)

**Exit Conditions:** NONE (terminal state)

**Allowed Transitions:** NONE (LOCKED is terminal)

**Forbidden Transitions:** ALL (no transitions from LOCKED)

**Who Can Modify:** NO ONE (not athlete, not coach, not system, not admin)

**What Is Mutable:** NOTHING (all fields immutable)

**What Is Immutable:** EVERYTHING (session structure, execution data, timestamps, audit logs, coach attribution)

---

#### CANCELLED

**Definition:** Session was cancelled before execution. Never executed, never visible to athlete (or visible but explicitly cancelled).

**Entry Conditions:**
- Coach cancels PLANNED or GENERATED session
- Program ends before session date
- Athlete removed from program before session date

**Exit Conditions:** NONE (terminal state, but can be replaced by new session)

**Allowed Transitions:** NONE (CANCELLED is terminal, but new session can be created for same date)

**Forbidden Transitions:** ALL (cannot un-cancel)

**Who Can Modify:** NO ONE (cancellation is permanent)

**What Is Mutable:** NOTHING (cancellation record is immutable)

**What Is Immutable:** Cancellation timestamp, Coach attribution, Reason (if provided)

---

#### EXPIRED

**Definition:** Date passed without execution. Session was GENERATED or VISIBLE but never started.

**Entry Conditions:**
- Session is GENERATED, VISIBLE, or ACKNOWLEDGED
- Date becomes yesterday (midnight transition)
- No execution data logged (`session_started_at` is null)

**Exit Conditions:** NONE (terminal state)

**Allowed Transitions:** NONE (EXPIRED is terminal)

**Forbidden Transitions:** ALL (cannot un-expire)

**Who Can Modify:** NO ONE (expiration is permanent)

**What Is Mutable:** NOTHING (expiration record is immutable)

**What Is Immutable:** Expiration timestamp, Session structure as it existed on date

---

#### ABANDONED

**Definition:** Athlete started session but stopped mid-execution with no intent to resume.

**Entry Conditions:**
- Session is IN_PROGRESS
- Athlete explicitly marks session "abandoned" OR
- 48 hours pass with no activity after `session_started_at`

**Exit Conditions:**
- Locking period expires (24 hours after abandonment) → LOCKED

**Allowed Transitions:**
- ABANDONED → LOCKED (24-hour grace period expires)

**Forbidden Transitions:**
- ABANDONED → IN_PROGRESS (cannot un-abandon)
- ABANDONED → COMPLETED (cannot complete abandoned session)

**Who Can Modify:** Athlete (append notes explaining abandonment within 24h), Coach (CANNOT modify structure)

**What Is Mutable (24-hour grace period only):**
- Abandonment notes (athlete can add explanation)

**What Is Immutable:** Session structure, Partial execution data (after 24h)

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

**Who Can Modify:** Athlete (append skip reason within 24h), Coach (CANNOT modify structure)

**What Is Mutable (24-hour grace period only):**
- Skip reason (athlete can add explanation)

**What Is Immutable:** Session structure, Skip timestamp

---

### 1.2 State Transition Matrix

| From State | To State | Trigger | Who | Notes |
|------------|----------|---------|-----|-------|
| UNRESOLVED | PLANNED | Prerequisites satisfied | System | Auto-transition |
| PLANNED | GENERATED | Date becomes today | System | Auto-transition at midnight |
| PLANNED | CANCELLED | Coach cancels | Coach | Terminal |
| GENERATED | VISIBLE | Athlete opens TODAY | Athlete | First view |
| GENERATED | GENERATED | Coach modifies | Coach | Creates v2 |
| GENERATED | EXPIRED | Date passes | System | Auto-transition |
| VISIBLE | ACKNOWLEDGED | Athlete acknowledges | Athlete | If required |
| VISIBLE | IN_PROGRESS | Athlete starts | Athlete | First set logged |
| VISIBLE | VISIBLE | Coach modifies | Coach | Creates v2, conflict resolution |
| ACKNOWLEDGED | IN_PROGRESS | Athlete starts | Athlete | First set logged |
| IN_PROGRESS | COMPLETED | Athlete finishes | Athlete | All exercises done |
| IN_PROGRESS | ABANDONED | Athlete abandons | Athlete | Explicit or timeout |
| IN_PROGRESS | SKIPPED | Athlete skips | Athlete | Explicit skip |
| COMPLETED | LOCKED | 24h grace period | System | Auto-transition |
| ABANDONED | LOCKED | 24h grace period | System | Auto-transition |
| SKIPPED | LOCKED | 24h grace period | System | Auto-transition |

---

### 1.3 State Persistence Rules

**Database Requirements:**
- `session_state` field MUST be stored as enum (not string)
- `state_transition_history` table MUST log all transitions with timestamps
- `state_entered_at` timestamp MUST be set on every state entry
- `state_exited_at` timestamp MUST be set on every state exit

**Query Requirements:**
- All session queries MUST filter by `session_state`
- State transitions MUST be atomic (database transaction)
- Concurrent state transitions MUST be prevented (optimistic locking or row-level locks)

---

## SECTION 2 — Mutation Rights by Role & State

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

### 2.2 Mutation Matrix by State

| State | Athlete | Coach | Physio | System | Merlin | Admin |
|-------|---------|-------|-------|--------|--------|-------|
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

#### Ban 5: Retroactive Readiness Recalculation

**Rule:** System MUST NOT recalculate readiness scores for completed sessions and retroactively change session structure.

**Rationale:** Readiness at execution time is historical fact. Recalculating changes historical truth.

**Enforcement:** Backend MUST prevent readiness recalculation if `session_state >= 'COMPLETED'`.

**Exception:** Readiness can be recalculated for future sessions (PLANNED, GENERATED), but not for past executions.

---

## SECTION 3 — Immutability Rules (Hard)

### 3.1 Immutability Timeline

**Pre-VISIBLE (UNRESOLVED, PLANNED, GENERATED):**
- Session structure is mutable (coach can modify)
- Modifications create new versions (v1, v2, v3)
- Old versions preserved in audit log

**VISIBLE to IN_PROGRESS:**
- Session structure becomes "soft immutable"
- Coach modifications create new version (v2)
- Athlete sees version they opened (v1)
- Conflict resolution required (Section 4)

**IN_PROGRESS:**
- Session structure becomes **hard immutable**
- No structural modifications allowed
- Only execution data logging permitted
- Late-arriving data appends (does not modify structure)

**COMPLETED (24-hour grace period):**
- Session structure remains **hard immutable**
- Execution data corrections allowed (typos, missing RPE)
- No structural changes

**LOCKED:**
- **Everything immutable**
- No modifications of any kind
- Permanent audit record

---

### 3.2 Immutable Fields by State

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

#### Immutable After IN_PROGRESS

- `session_structure` (exercises, sets, reps, intensity — hard immutable)
- `prescribed_duration` (target duration — hard immutable)
- `prescribed_intensity` (target intensity — hard immutable)
- `coach_attribution` (who modified session — hard immutable)

#### Immutable After COMPLETED

- `completed_at` (timestamp, never changes)
- `completion_status` (completed/abandoned/skipped — immutable after 24h)
- Core execution data (RPE, duration — immutable after 24h grace period)

#### Immutable After LOCKED

- **EVERYTHING** (all fields immutable)

---

### 3.3 Partial Completion Rules

#### Scenario: Athlete Completes Some Exercises, Skips Others

**State:** IN_PROGRESS → COMPLETED (partial)

**Rules:**
- Athlete can mark exercises "done" or "skipped"
- Session can be completed with partial execution
- Skipped exercises are logged as "skipped" (not "not done")
- Skipped exercises are immutable after COMPLETED (cannot retroactively mark as "done")

**Immutability:**
- Exercise completion status becomes immutable after COMPLETED
- Skipped exercises cannot be changed to "done" after completion
- Done exercises cannot be changed to "skipped" after completion

**Rationale:** Execution record must reflect what athlete actually did. Changing completion status retroactively corrupts audit trail.

---

#### Scenario: Athlete Modifies Execution (Does Different Sets/Reps Than Prescribed)

**State:** IN_PROGRESS

**Rules:**
- Athlete logs what they actually did (may differ from prescribed)
- Prescribed values remain immutable (what coach assigned)
- Actual values are logged separately (`prescribed_sets` vs `actual_sets`)
- Both values preserved in audit log

**Immutability:**
- Prescribed values: Immutable after VISIBLE
- Actual values: Immutable after COMPLETED (24h grace period for corrections)

**Rationale:** Coach needs to see both what was assigned and what was executed. Both are historical facts.

---

#### Scenario: Athlete Abandons Session Mid-Execution

**State:** IN_PROGRESS → ABANDONED

**Rules:**
- Partial execution data is preserved (what athlete did before abandoning)
- Abandonment timestamp is immutable
- Abandonment reason can be appended within 24h (athlete can add explanation)
- Session structure remains immutable (cannot modify what was prescribed)

**Immutability:**
- Abandonment timestamp: Immutable
- Partial execution data: Immutable after 24h grace period
- Abandonment reason: Immutable after 24h grace period

---

### 3.4 Coach Attribution Immutability

#### Rule: Coach Attribution Never Changes

**Once a session is modified by a coach:**
- `modified_by_coach_id` is immutable (never changes)
- `modified_at_timestamp` is immutable (never changes)
- `modification_reason` is immutable (coach cannot edit reason after submission)

**Rationale:** Coach attribution is liability protection. Changing attribution retroactively corrupts audit trail and creates legal risk.

**Exception:** NONE. Not even admin can change coach attribution.

---

#### Rule: Version History Preserves All Attributions

**When coach modifies session multiple times:**
- Each version (v1, v2, v3) preserves its own attribution
- Version history shows: "v1: Generated by System", "v2: Modified by Coach Smith", "v3: Modified by Coach Jones"
- Athlete sees version they opened (v1, v2, or v3)
- All versions preserved in audit log

**Immutability:**
- Version history is append-only (cannot delete versions)
- Attribution for each version is immutable

---

### 3.5 Timestamp Immutability

#### Rule: All Timestamps Are Immutable Once Set

**Timestamps that become immutable:**
- `generated_at`: Immutable after GENERATED
- `visible_at`: Immutable after VISIBLE
- `acknowledged_at`: Immutable after ACKNOWLEDGED
- `session_started_at`: Immutable after IN_PROGRESS
- `completed_at`: Immutable after COMPLETED
- `locked_at`: Immutable after LOCKED
- `cancelled_at`: Immutable after CANCELLED
- `expired_at`: Immutable after EXPIRED
- `abandoned_at`: Immutable after ABANDONED
- `skipped_at`: Immutable after SKIPPED

**Rationale:** Timestamps are audit trail. Changing timestamps retroactively corrupts historical record.

**Exception:** NONE. Not even admin can change timestamps.

---

## SECTION 4 — Mid-Day Changes & Race Conditions

### 4.1 Conflict Resolution Principles

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

### 4.2 Scenario: Coach Modifies After Athlete Opens TODAY

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

### 4.3 Scenario: Coach Modifies After Athlete Starts Training

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

### 4.4 Scenario: Coach Modifies After Athlete Completes Training

**Timeline:**
- 08:00 — Session GENERATED (v1)
- 09:00 — Athlete opens TODAY, sees v1 (VISIBLE state)
- 10:00 — Athlete starts training (IN_PROGRESS)
- 11:00 — Athlete completes training (COMPLETED state)
- 12:00 — Coach attempts to modify session

**Resolution:**
1. Backend API rejects coach modification request
2. Error returned: "Cannot modify session: Session is completed (COMPLETED state)"
3. Coach sees notification: "This session is completed. Modifications are locked. You can append a note if needed."
4. Coach can append note (non-structural), but cannot change exercises/sets/reps
5. Completed session remains v1 (unchanged)

**What Athlete Executes:**
- Athlete executed v1 (completed)
- Execution data linked to v1 (`executed_version = 'v1'`)

**What Coach Sees:**
- Coach sees v1 (original version)
- Coach sees athlete completed v1
- Coach sees modification was rejected (logged in audit)

**Immutability:**
- v1 structure: Hard immutable (completed session)
- Coach modification attempt: Logged but rejected

**Rationale:** Completed sessions are historical record. Retroactive changes corrupt audit trail and create liability risk. Hard ban enforced.

---

### 4.5 Scenario: Weather Override Arrives Mid-Session

**Timeline:**
- 08:00 — Session GENERATED (v1, outdoor session)
- 09:00 — Athlete opens TODAY, sees v1 (VISIBLE state)
- 10:00 — Athlete starts training (IN_PROGRESS state)
- 10:30 — Weather API detects dangerous conditions, sends override

**Resolution:**
1. System receives weather override
2. System checks `session_state = 'IN_PROGRESS'`
3. System CANNOT modify structure (hard immutable)
4. System appends safety alert: "⚠️ Weather Alert: Dangerous conditions detected at 10:30. Consider stopping outdoor training."
5. Alert is non-blocking (athlete can continue if they choose)
6. Alert is logged in audit trail

**What Athlete Sees:**
- Athlete sees safety alert banner (non-blocking)
- Athlete can continue executing v1 or stop
- Athlete's choice is logged

**What Coach Sees:**
- Coach sees weather alert was sent
- Coach sees athlete's response (continued or stopped)
- Coach sees timestamp of alert

**Immutability:**
- v1 structure: Hard immutable (athlete is executing it)
- Weather alert: Appended (does not modify structure)

**Rationale:** Weather override cannot change structure mid-execution (safety risk of changing plan while athlete is training). Alert is informational only.

---

### 4.6 Scenario: Injury Reported Mid-Session

**Timeline:**
- 08:00 — Session GENERATED (v1)
- 09:00 — Athlete opens TODAY, sees v1 (VISIBLE state)
- 10:00 — Athlete starts training (IN_PROGRESS state)
- 10:30 — Athlete reports pain/injury via check-in or Merlin

**Resolution:**
1. System receives injury report
2. System checks `session_state = 'IN_PROGRESS'`
3. System CANNOT modify structure (hard immutable)
4. System appends safety alert: "⚠️ Injury Reported: [Pain level] at [Location]. Stop training if pain increases."
5. Alert is blocking if pain >3/10 (athlete must acknowledge before continuing)
6. Alert is logged in audit trail
7. Physio is notified (if pain >3/10)

**What Athlete Sees:**
- Athlete sees safety alert banner
- If pain >3/10: Alert is blocking (must acknowledge to continue)
- If pain ≤3/10: Alert is non-blocking (can continue)
- Athlete's choice is logged

**What Coach Sees:**
- Coach sees injury report was submitted
- Coach sees athlete's response (continued or stopped)
- Coach sees timestamp of report

**What Physio Sees:**
- Physio sees injury report (if pain >3/10)
- Physio can append medical notes (non-structural)
- Physio can override future sessions (not current session)

**Immutability:**
- v1 structure: Hard immutable (athlete is executing it)
- Injury report: Appended (does not modify structure)

**Rationale:** Injury report cannot change structure mid-execution (safety risk). Alert is informational/blocking based on severity.

---

### 4.7 Conflict Resolution Summary Table

| Coach Action | Athlete State | Resolution | Athlete Sees | Coach Sees |
|--------------|---------------|------------|--------------|------------|
| Modify structure | VISIBLE | Creates v2, notification | Choose v1 or v2 | Both versions |
| Modify structure | IN_PROGRESS | **REJECTED** | Continues v1 | Rejection logged |
| Modify structure | COMPLETED | **REJECTED** | Completed v1 | Rejection logged |
| Append note | IN_PROGRESS | Allowed | Note appended | Note visible |
| Append note | COMPLETED | Allowed | Note appended | Note visible |
| Cancel | VISIBLE | Creates CANCELLED | Cannot start | Cancellation logged |
| Cancel | IN_PROGRESS | **REJECTED** | Continues v1 | Rejection logged |
| Cancel | COMPLETED | **REJECTED** | Completed v1 | Rejection logged |

---

## SECTION 5 — Check-in, Pain, and Late Data Arrival

### 5.1 Late Data Definition

**Late data** is information that arrives after session generation but may be relevant to session execution:
- Check-in submitted after session GENERATED
- Pain report submitted after session GENERATED
- Readiness score updated after session GENERATED
- ACWR updated after session GENERATED
- Weather conditions updated after session GENERATED

**Core Principle:** Late data **appends**, never overwrites. Historical truth is preserved.

---

### 5.2 Check-in Submitted After Session Generation

#### Scenario: Check-in Submitted After GENERATED, Before VISIBLE

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

#### Scenario: Check-in Submitted After VISIBLE, Before IN_PROGRESS

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

#### Scenario: Check-in Submitted After IN_PROGRESS

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

#### Scenario: Check-in Submitted After COMPLETED

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

### 5.3 Pain Report Submitted After Session Generation

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

### 5.4 Readiness Updated After Session Generation

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

### 5.5 Late Data Summary Table

| Late Data Type | Session State | Action | Structure Modified? | Data Appended? |
|----------------|---------------|--------|---------------------|----------------|
| Check-in | GENERATED | Recalculate intensity, create v2 | ✅ Yes (before VISIBLE) | ✅ Yes |
| Check-in | VISIBLE | Append data, offer regeneration | ❌ No (soft immutable) | ✅ Yes |
| Check-in | IN_PROGRESS | Append data, informational note | ❌ No (hard immutable) | ✅ Yes |
| Check-in | COMPLETED | Append data, use for future | ❌ No (hard immutable) | ✅ Yes |
| Pain report | VISIBLE | Append alert, block if >3/10 | ❌ No (soft immutable) | ✅ Yes |
| Pain report | IN_PROGRESS | Append alert, block if >3/10 | ❌ No (hard immutable) | ✅ Yes |
| Pain report | COMPLETED | Append data, use for future | ❌ No (hard immutable) | ✅ Yes |
| Readiness update | GENERATED | Recalculate, create v2 | ✅ Yes (before VISIBLE) | ✅ Yes |
| Readiness update | VISIBLE | Append data, use for future | ❌ No (soft immutable) | ✅ Yes |
| Readiness update | IN_PROGRESS | Append data, use for future | ❌ No (hard immutable) | ✅ Yes |
| Readiness update | COMPLETED | **HARD BAN** (no recalculation) | ❌ No (hard immutable) | ❌ No (hard ban) |

---

## SECTION 6 — Completion & Locking Rules

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

### 6.3 Partial Completion Handling

#### Scenario: Athlete Completes Some Exercises, Skips Others

**Rules:**
- Session can be completed with partial execution
- Skipped exercises are logged as "skipped" (not "not done")
- Skipped exercises count toward completion (session is complete if all exercises are "done" or "skipped")
- Skipped exercises are immutable after COMPLETED (cannot retroactively mark as "done")

**Completion Criteria:**
- All exercises marked "done" OR "skipped"
- RPE logged
- Duration logged
- `completed_at` timestamp set

**Immutability:**
- Exercise completion status becomes immutable after COMPLETED
- Skipped exercises cannot be changed to "done" after completion
- Done exercises cannot be changed to "skipped" after completion

---

#### Scenario: Athlete Modifies Execution (Does Different Sets/Reps)

**Rules:**
- Athlete logs what they actually did (may differ from prescribed)
- Prescribed values remain immutable (what coach assigned)
- Actual values are logged separately (`prescribed_sets` vs `actual_sets`)
- Both values preserved in audit log
- Session can be completed with modified execution

**Completion Criteria:**
- All exercises marked "done" OR "skipped" (with actual execution logged)
- RPE logged
- Duration logged
- `completed_at` timestamp set

**Immutability:**
- Prescribed values: Immutable after VISIBLE
- Actual values: Immutable after COMPLETED (24h grace period for corrections)

---

### 6.4 Grace Period Rules

#### 24-Hour Grace Period for Corrections

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

### 6.5 Locking Rules

#### Automatic Locking

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

#### Manual Locking (Admin Override)

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

### 6.6 Post-Lock Immutability

#### Rule: Everything Immutable After LOCKED

**After LOCKED state:**
- **NO modifications allowed** (not athlete, not coach, not system, not admin)
- **NO corrections allowed** (not even typos)
- **NO appends allowed** (not even notes)
- **NO deletions allowed** (not even soft deletes)

**What Is Immutable:**
- Session structure (exercises, sets, reps, intensity)
- Execution data (RPE, duration, notes)
- Timestamps (all timestamps)
- Coach attribution
- Audit logs
- Version history

**Exception:** NONE. Not even admin can modify locked sessions.

**Rationale:** Locked sessions are permanent audit records. Modifications after lock corrupt audit trail and create legal risk.

---

## SECTION 7 — Audit & Liability Guarantees

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

**At COMPLETED:**
- `completed_at` (timestamp)
- `completion_status` (completed/abandoned/skipped)
- Core execution data (RPE, duration — after 24h grace period)

**At LOCKED:**
- **EVERYTHING** (all fields immutable)

---

### 7.2 Append-Only Logs

#### Rule: Audit Logs Are Append-Only

**Audit log structure:**
- `log_id` (UUID, unique)
- `session_id` (UUID, reference)
- `event_type` (enum: state_transition, modification, execution, completion, lock)
- `event_timestamp` (ISO 8601)
- `actor_id` (UUID, who performed action)
- `actor_role` (enum: athlete, coach, physio, system, admin)
- `event_data` (JSON, snapshot of change)
- `previous_state` (JSON, state before change)
- `new_state` (JSON, state after change)

**Append-Only Enforcement:**
- Database constraint: `log_id` is primary key (cannot be updated)
- Database constraint: `event_timestamp` is immutable
- Backend API: No update/delete endpoints for audit logs
- Admin UI: Read-only view of audit logs (no edit/delete buttons)

**Rationale:** Append-only logs ensure audit trail integrity. Deleting or modifying logs corrupts historical record.

---

### 7.3 Versioning Strategy

#### Session Versioning

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

### 7.4 Dispute Reconstruction

#### Rule: System Can Reconstruct "What Athlete Saw When They Trained"

**Reconstruction Process:**
1. Query `session_versions` table for `session_id`
2. Filter by `visible_version` (which version athlete saw)
3. Retrieve `structure` JSON for that version
4. Retrieve `visible_at` timestamp (when athlete saw it)
5. Retrieve `session_started_at` timestamp (when athlete started)
6. Retrieve execution data (`executed_version` links to version)
7. Reconstruct complete picture: "Athlete saw v2 at 09:00, started executing v2 at 10:00, completed v2 at 11:00"

**Reconstruction Guarantees:**
- System can show exactly what athlete saw (version + timestamp)
- System can show exactly what athlete executed (version + execution data)
- System can show all modifications (v1 → v2 → v3) with timestamps
- System can show coach attribution for each version
- System can show athlete's choices (acknowledged, continued, stopped)

**Use Cases:**
- Legal disputes: "What did athlete see when they trained?"
- Injury investigations: "What was prescribed vs what was executed?"
- Coach accountability: "Who modified session and when?"
- Athlete accountability: "Did athlete execute prescribed plan?"

---

### 7.5 Coach Protection

#### Audit Trail Protects Coach Decisions

**Coach Protection Guarantees:**
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

### 7.6 Athlete Protection

#### Audit Trail Protects Athlete Execution

**Athlete Protection Guarantees:**
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

### 7.7 System Protection

#### Audit Trail Protects System Integrity

**System Protection Guarantees:**
- System's generation is preserved (v1 structure)
- System's adjustments are preserved (readiness, ACWR, weather)
- System's timestamps are preserved (`generated_at`)
- System's context is preserved (program template, week, phase)
- System's errors are preserved (if generation fails, error is logged)

**If System Error Occurs:**
- System can show: "Session generation failed at 08:00, error: 'Missing program template'"
- System can show: "System retried at 08:05, success, generated v1"
- System can show: "System applied readiness adjustment at 08:10, created v2"

**Rationale:** Audit trail protects system by showing generation process and any errors or adjustments.

---

### 7.8 Audit Log Retention

#### Retention Periods

**Active Athlete:**
- Retain all audit logs for lifetime of account
- Retain all audit logs for 7 years post-deletion

**Minor Athlete:**
- Retain until age 25 or account deletion + 7 years (whichever is longer)

**Deleted Account:**
- Anonymize but retain logs for 7 years (for legal compliance)

**Locked Sessions:**
- Retain audit logs permanently (never delete)

**Rationale:** Audit logs are legal records. Retention periods ensure compliance and dispute resolution.

---

### 7.9 Audit Export

#### Export Formats

**Coaches and Admins Can Export:**
- JSON (machine-readable, complete audit trail)
- CSV (spreadsheet analysis, filtered by date/athlete/coach)
- PDF (human-readable report with timestamps and signatures)

**Athletes Can Export:**
- Own session history (all sessions athlete executed)
- Own audit trail (all actions athlete performed)
- Coach modification history (all coach actions affecting athlete)

**Export Contents:**
- Session structure (all versions)
- Execution data (what athlete did)
- Modification history (who changed what, when)
- Timestamps (all timestamps)
- Coach attribution (who modified, when, why)
- Athlete choices (acknowledged, continued, stopped)

**Rationale:** Export enables dispute resolution, legal compliance, and transparency.

---

## SECTION 8 — Forbidden Patterns (Hard Bans)

### 8.1 Retroactive Coach Edits to Completed Sessions

**Forbidden:** Coach modifying session structure after athlete completes session (COMPLETED or LOCKED state).

**Rationale:** Completed sessions are historical record. Retroactive changes corrupt audit trail and create liability risk.

**Enforcement:** Backend API MUST reject coach modification requests if `session_state = 'COMPLETED'` or `session_state = 'LOCKED'`.

**Exception:** NONE. Not even admin can override this.

---

### 8.2 Recalculating Readiness After Completion

**Forbidden:** System recalculating readiness scores for completed sessions and retroactively changing session structure.

**Rationale:** Readiness at execution time is historical fact. Recalculating changes historical truth.

**Enforcement:** Backend MUST prevent readiness recalculation if `session_state >= 'COMPLETED'`.

**Exception:** Readiness can be recalculated for future sessions (PLANNED, GENERATED), but not for past executions.

---

### 8.3 Silently Changing Executed Session History

**Forbidden:** System modifying execution data (RPE, duration, notes) without athlete's explicit action or after 24-hour grace period.

**Rationale:** Execution data is historical fact. Silent changes corrupt audit trail and create trust violation.

**Enforcement:** Backend MUST prevent execution data modifications after 24-hour grace period. All modifications MUST be logged with actor and timestamp.

**Exception:** Athlete can correct typos within 24-hour grace period (explicit action required).

---

### 8.4 Deleting Sessions Instead of Locking

**Forbidden:** System or admin deleting sessions (soft delete or hard delete). Sessions MUST be locked, not deleted.

**Rationale:** Deleted sessions cannot be audited. Locking preserves audit trail while preventing modifications.

**Enforcement:** Backend MUST prevent session deletion. Only locking is allowed.

**Exception:** NONE. Not even admin can delete sessions.

---

### 8.5 Overwriting Logs Instead of Appending

**Forbidden:** System overwriting audit logs or execution logs. All logs MUST be append-only.

**Rationale:** Overwriting logs corrupts audit trail. Append-only ensures historical integrity.

**Enforcement:** Database constraints prevent log updates. Backend API has no update endpoints for logs.

**Exception:** NONE. Not even admin can overwrite logs.

---

### 8.6 Showing Athlete a Session Different from What Was Logged

**Forbidden:** System showing athlete a different session version than what was logged as "visible" or "executed".

**Rationale:** Athlete must see what was logged. Showing different version creates confusion and trust violation.

**Enforcement:** Frontend MUST display `visible_version` exactly as stored. Backend MUST return `visible_version` without modification.

**Exception:** NONE. Not even admin can change `visible_version` retroactively.

---

### 8.7 "Fixing" Data for Analytics by Altering History

**Forbidden:** System or admin modifying historical session data to "fix" analytics or reporting.

**Rationale:** Historical data is truth. "Fixing" data corrupts audit trail and creates liability risk.

**Enforcement:** Backend MUST prevent historical data modifications. Analytics MUST use historical data as-is.

**Exception:** NONE. Analytics must work with historical truth, not "fixed" data.

---

### 8.8 Coach Modifying Session After Athlete Starts

**Forbidden:** Coach modifying session structure after athlete starts execution (IN_PROGRESS state).

**Rationale:** Athlete is executing specific plan. Changing plan mid-execution creates confusion, liability risk, and audit trail corruption.

**Enforcement:** Backend API MUST reject coach modification requests if `session_state = 'IN_PROGRESS'`.

**Exception:** NONE. Not even admin can override this.

---

### 8.9 System Modifying Session After Athlete Sees It

**Forbidden:** System modifying session structure after athlete has seen session (VISIBLE state).

**Rationale:** Athlete has seen specific plan. Changing plan after visibility creates confusion and trust violation.

**Enforcement:** Backend MUST prevent system modifications (readiness adjustments, ACWR adjustments) if `session_state >= 'VISIBLE'`.

**Exception:** Late-arriving data can append (check-in, pain reports), but structure cannot change.

---

### 8.10 Changing Coach Attribution Retroactively

**Forbidden:** System or admin changing coach attribution (`modified_by_coach_id`, `modified_at_timestamp`) after modification is logged.

**Rationale:** Coach attribution is liability protection. Changing attribution retroactively corrupts audit trail and creates legal risk.

**Enforcement:** Database constraints prevent attribution updates. Backend API has no update endpoints for attribution.

**Exception:** NONE. Not even admin can change attribution.

---

### 8.11 Allowing Athlete to Modify Session Structure

**Forbidden:** Athlete modifying session structure (exercises, sets, reps, intensity) at any state.

**Rationale:** Session structure is coach/system authority. Athlete executes, does not design.

**Enforcement:** Frontend MUST hide modification UI for athletes. Backend MUST reject athlete modification requests.

**Exception:** Athlete can log execution data (what they actually did), but cannot change what was prescribed.

---

### 8.12 Modifying Timestamps Retroactively

**Forbidden:** System or admin modifying timestamps (`generated_at`, `visible_at`, `completed_at`, etc.) after they are set.

**Rationale:** Timestamps are audit trail. Changing timestamps retroactively corrupts historical record.

**Enforcement:** Database constraints prevent timestamp updates. Backend API has no update endpoints for timestamps.

**Exception:** NONE. Not even admin can change timestamps.

---

## SECTION 9 — Concrete Timeline Examples

### Example 1: Normal Session Lifecycle

**Timeline:**
- **2026-01-06 00:00** — System generates session (v1) from program template. State: GENERATED
- **2026-01-06 08:00** — Athlete opens TODAY screen, sees v1. State: VISIBLE, `visible_version = 'v1'`
- **2026-01-06 09:00** — Athlete starts training, logs first set. State: IN_PROGRESS, `session_started_at = 2026-01-06T09:00:00Z`
- **2026-01-06 10:00** — Athlete completes training, logs RPE=7, duration=60min. State: COMPLETED, `completed_at = 2026-01-06T10:00:00Z`
- **2026-01-07 10:00** — 24-hour grace period expires. State: LOCKED, `locked_at = 2026-01-07T10:00:00Z`

**Mutations:**
- **00:00-08:00:** Coach can modify structure (before VISIBLE)
- **08:00-09:00:** Coach can modify structure (creates v2, conflict resolution)
- **09:00-10:00:** Coach CANNOT modify structure (IN_PROGRESS, hard ban)
- **10:00-10:00+24h:** Athlete can correct typos (grace period)
- **After 24h:** NO modifications allowed (LOCKED)

**Audit Trail:**
- v1 structure preserved
- `visible_at = 2026-01-06T08:00:00Z` (immutable)
- `session_started_at = 2026-01-06T09:00:00Z` (immutable)
- `completed_at = 2026-01-06T10:00:00Z` (immutable)
- `locked_at = 2026-01-07T10:00:00Z` (immutable)

---

### Example 2: Coach Modification Before Athlete Sees

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

### Example 3: Coach Modification After Athlete Sees, Before Athlete Starts

**Timeline:**
- **2026-01-06 00:00** — System generates session (v1). State: GENERATED
- **2026-01-06 08:00** — Athlete opens TODAY screen, sees v1. State: VISIBLE, `visible_version = 'v1'`
- **2026-01-06 09:00** — Coach modifies session (swaps exercise). Creates v2. State: VISIBLE (v2 exists, athlete saw v1)
- **2026-01-06 09:30** — Athlete sees notification: "Coach updated session. View changes?" Athlete chooses "View Changes". `visible_version` updated to 'v2'
- **2026-01-06 10:00** — Athlete starts training. State: IN_PROGRESS, `executed_version = 'v2'`

**Mutations:**
- **00:00-08:00:** Coach can modify (before VISIBLE) ✅
- **08:00:** Athlete sees v1 ✅
- **09:00:** Coach modifies, creates v2 ✅ (conflict resolution required)
- **09:30:** Athlete chooses v2 ✅
- **10:00:** Athlete executes v2 ✅

**Audit Trail:**
- v1 structure preserved (original)
- v2 structure preserved (modified)
- `visible_version` changed from 'v1' to 'v2' at 09:30 (athlete's choice, immutable)
- `executed_version = 'v2'` (athlete executed v2)

---

### Example 4: Coach Modification Attempt After Athlete Starts (Rejected)

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

### Example 5: Late Check-in After Session Completion

**Timeline:**
- **2026-01-06 00:00** — System generates session (v1, uses program defaults). State: GENERATED
- **2026-01-06 08:00** — Athlete opens TODAY screen, sees v1. State: VISIBLE, `visible_version = 'v1'`
- **2026-01-06 09:00** — Athlete starts training. State: IN_PROGRESS, `executed_version = 'v1'`
- **2026-01-06 10:00** — Athlete completes training. State: COMPLETED
- **2026-01-06 12:00** — Athlete submits check-in (readiness = 75). **APPENDED** (does not modify structure)

**Mutations:**
- **00:00-08:00:** System can adjust based on check-in (before VISIBLE) ✅
- **08:00:** Athlete sees v1 (with defaults) ✅
- **09:00-10:00:** Structure hard immutable (IN_PROGRESS) ✅
- **10:00:** Structure hard immutable (COMPLETED) ✅
- **12:00:** Check-in **APPENDED** ✅ (does not modify structure, used for future sessions)

**Audit Trail:**
- v1 structure preserved (original, executed with defaults)
- Check-in data appended at 12:00 (immutable timestamp)
- Check-in data used for future sessions (not current)
- Completed session retains original readiness defaults (historical fact)

---

## SECTION 10 — Contract Enforcement & Violations

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

## SECTION 11 — Success Criteria

This contract is successful when:

1. **Zero Retroactive Changes:** Completed sessions are never modified
2. **Zero Structure Modifications After Start:** Sessions are never modified after athlete starts execution
3. **Zero Audit Trail Corruption:** All modifications are logged and immutable
4. **Zero Version Confusion:** Athletes always know which version they saw and executed
5. **Zero Timestamp Manipulation:** All timestamps are immutable once set
6. **Zero Attribution Changes:** Coach attribution never changes retroactively
7. **Zero Silent Modifications:** All modifications are visible and auditable
8. **Zero Liability Gaps:** System can reconstruct decision context for any session

---

## Document Metadata

**Maintained By:** Product Architecture + Engineering  
**Enforcement:** All session lifecycle implementations MUST comply exactly  
**Testing:** QA must verify all state transitions, mutation rights, and immutability rules deterministically  
**Review Cycle:** Quarterly or on contract breach

**Related Documents:**
- Step 2.1: TODAY Screen UX Authority Contract v1 (parent)
- Step 2.2: TODAY State → Behavior Resolution Contract v1 (parent)
- Step 2.3: Merlin Dialogue Authority Contract v1 (parent)
- Step 2.4: Coach Authority & Visibility Contract v1 (parent)
- Step 2.5: Data Consent & Visibility Contract v1 (parent)
- Backend Truthfulness Contract (foundation)

**Version History:**
- v1.0 (2026-01-06): Initial session lifecycle and immutability contract

---

## End of Document

**This contract is law. Deviation is system failure.**

**Status:** FINAL (v1.0)  
**Effective Date:** 2026-01-06  
**Next Review:** Upon implementation or material system change  
**Authority:** Product Architecture, endorsed by Engineering, Legal, and Coaching

This contract is now binding for all system components, UI flows, backend logic, and audit systems.


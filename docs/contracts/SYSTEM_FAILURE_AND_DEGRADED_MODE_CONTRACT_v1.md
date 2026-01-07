# System Failure & Degraded Mode Contract — v1

**Contract Version:** 1.0  
**Date:** 2026-01-06  
**Status:** Normative (Binding)  
**Scope:** System behavior during partial or total failure — all platforms  
**Maintained By:** Product Architecture + Engineering  
**Supersedes:** None

**Dependencies (MUST Be Compatible With):**
- Authorization & Guardrails Contract v1
- TODAY Screen UX Authority Contract v1
- Session Lifecycle Authority Contract v1
- Backend Truthfulness Contract

---

## SECTION 1 — Scope + Definitions

### 1.1 Scope

This contract defines **system behavior during partial or total failure**, including:
- API failure behavior
- Data unavailability handling
- Fallback UI rules
- Truthfulness under uncertainty
- What MUST be hidden vs shown
- Logging requirements
- Forbidden "fake data" behavior

This contract does NOT govern:
- Normal system operation (see other contracts)
- Planned maintenance (separate maintenance protocol)
- Security breaches (separate incident response protocol)

### 1.2 Definitions

#### System Failure
A condition where system components cannot perform their intended function. Failures include: API timeouts, database unavailability, service outages, network failures, data corruption.

#### Degraded Mode
A system state where some functionality is unavailable but core features remain operational. Degraded mode allows partial service continuation.

#### Partial Failure
A failure affecting some system components but not others. Example: Readiness API fails but session resolution succeeds.

#### Total Failure
A failure affecting all system components. Example: Database unavailable, all APIs fail.

#### Fallback UI
A user interface state displayed when system cannot provide normal functionality. Fallback UI must be truthful and non-misleading.

#### Fake Data
Data displayed to users that is not derived from actual system state. Fake data includes: placeholder values, imputed data, default values presented as real data.

---

## SECTION 2 — API Failure Behavior

### 2.1 API Failure Categories

| Failure Type | Timeout Threshold | Retry Policy | Fallback Behavior |
|--------------|-------------------|--------------|-------------------|
| Session Resolution API | 5 seconds | 2 retries | Show error state, no session |
| Readiness API | 3 seconds | 1 retry | Show "—" (null readiness) |
| ACWR API | 3 seconds | 1 retry | Hide ACWR widget, show baseline progress if cached |
| Coach Modification API | 10 seconds | 3 retries | Show error, allow manual retry |
| Audit Log API | 5 seconds | 1 retry | Queue log for later, continue operation |

### 2.2 API Failure Response Rules

When API fails:

**System MUST:**
- Display error state (not fake data)
- Log failure with timestamp and error code
- Provide retry mechanism (if applicable)
- Show clear error message to user

**System MUST NOT:**
- Display placeholder data as real data
- Hide error from user
- Continue with stale cached data (if >5 minutes old)
- Assume default values without user awareness

### 2.3 Retry Policy

**Retry Rules:**
- Maximum 3 retries per API call
- Exponential backoff: 1s, 2s, 4s delays
- After 3 failures, show error state
- Do NOT retry indefinitely (prevents UI freezing)

---

## SECTION 3 — Data Unavailability Handling

### 3.1 Readiness Data Unavailable

When readiness API fails or data is unavailable:

**System MUST Display:**
- Readiness indicator: "—" (not a number)
- Banner: "Check-in data unavailable. Your plan uses program defaults."
- No fake readiness value (0, 50, 75, "average")

**System MUST NOT Display:**
- Any numeric readiness value
- "Low readiness" or "High readiness" interpretation
- Cached readiness value if >5 minutes old

---

### 3.2 ACWR Data Unavailable

When ACWR API fails or data is unavailable:

**System MUST Display:**
- Hide ACWR widget (if baseline not established)
- Show baseline progress if cached and <5 minutes old: "Building baseline — X/21 training days"
- Banner: "Load metrics unavailable. Baseline progress may be delayed."

**System MUST NOT Display:**
- ACWR ratio value (if unavailable)
- "Low confidence" or "Unreliable" language
- Fake ACWR value (1.0, "safe", etc.)

---

### 3.3 Session Data Unavailable

When session resolution API fails:

**System MUST Display:**
- Error banner: "No session found for today. Program not configured for this date."
- No training blocks
- Primary CTA: "Contact Coach"
- Secondary CTA: "View Program Details"

**System MUST NOT Display:**
- Generic exercises or placeholder workouts
- "Rest day" assumption
- AI-generated replacement session
- Cached session if >5 minutes old

---

### 3.4 Coach Modification Data Unavailable

When coach modification API fails:

**System MUST Display:**
- Error message: "Unable to load coach modifications. Please try again."
- Retry button
- Do NOT show cached modifications if >5 minutes old

**System MUST NOT Display:**
- Stale coach modifications as current
- Assumed coach modifications
- Hide error from user

---

## SECTION 4 — Fallback UI Rules

### 4.1 Fallback UI Principles

Fallback UI MUST:
- Be truthful (show what is known, hide what is unknown)
- Be non-misleading (no fake data, no assumptions)
- Provide clear error messages
- Offer retry mechanisms (where applicable)
- Maintain user trust (honest about failures)

Fallback UI MUST NOT:
- Display fake data as real data
- Hide errors from users
- Assume default values without disclosure
- Continue with stale data without warning

### 4.2 Fallback UI States

| System State | Fallback UI Display | User Action Available |
|--------------|---------------------|----------------------|
| Session API fails | Error banner, no blocks | Retry, contact coach |
| Readiness API fails | "—" indicator, info banner | Retry, start training anyway |
| ACWR API fails | Hide widget, baseline if cached | Continue training |
| Coach API fails | Error message, retry button | Retry, view cached (if <5min) |
| Total failure | Error screen, contact support | Contact support, offline mode (if available) |

### 4.3 Offline Mode (If Available)

If offline mode is implemented:

**Offline Mode MUST:**
- Display cached data with timestamp ("Last updated: [Time]")
- Warn user: "You're offline. Data may be outdated."
- Allow viewing cached sessions (if <24 hours old)
- Prevent modifications (cannot save offline)

**Offline Mode MUST NOT:**
- Display cached data as current without warning
- Allow saving modifications offline
- Hide offline status from user

---

## SECTION 5 — Truthfulness Under Uncertainty

### 5.1 Unknown Data Display Rules

When data is unknown or unavailable:

**System MUST:**
- Display explicit absence: "Not available", "—", "Unavailable"
- Explain why data is unavailable (if known)
- Provide action to resolve (if applicable)

**System MUST NOT:**
- Display placeholder values as real data
- Use "average" or "typical" when data missing
- Impute values from other metrics
- Hide absence of data

### 5.2 Stale Data Display Rules

When data is stale (>5 minutes old):

**System MUST:**
- Display age indicator: "Last updated: [Time]"
- Warn user: "Data may be outdated"
- Provide refresh mechanism
- Do NOT use stale data for critical decisions

**System MUST NOT:**
- Display stale data as current
- Hide staleness from user
- Use stale data for safety-critical decisions

### 5.3 Partial Data Display Rules

When only partial data is available:

**System MUST:**
- Display available data with clear labels
- Indicate what data is missing
- Explain consequence of missing data
- Do NOT fill gaps with assumptions

**System MUST NOT:**
- Display partial data as complete
- Hide missing data from user
- Assume missing data values

---

## SECTION 6 — What MUST Be Hidden vs Shown

### 6.1 What MUST Be Hidden During Failure

System MUST hide:
- Fake data (placeholder values, imputed data)
- Stale data (>5 minutes old) presented as current
- Assumed values (defaults presented as real data)
- Error details that expose system internals (show user-friendly message only)

### 6.2 What MUST Be Shown During Failure

System MUST show:
- Error states (clear, user-friendly messages)
- Data unavailability indicators ("—", "Not available")
- Retry mechanisms (where applicable)
- Contact pathways (coach, support)
- System status (degraded mode indicator if applicable)

### 6.3 What MAY Be Shown During Failure

System MAY show:
- Cached data with clear timestamp and staleness warning (if <5 minutes old)
- Offline mode indicator (if offline mode available)
- Estimated recovery time (if known and reliable)

---

## SECTION 7 — Logging Requirements

### 7.1 Failure Logging

Every system failure MUST be logged with:

| Field | Description |
|-------|-------------|
| `failure_id` | Unique identifier for failure event |
| `failure_type` | API_FAILURE / DATABASE_FAILURE / NETWORK_FAILURE / SERVICE_OUTAGE |
| `timestamp` | When failure occurred (ISO 8601) |
| `affected_component` | Which system component failed |
| `error_code` | System error code |
| `error_message` | Detailed error message (for engineering) |
| `user_impact` | What user saw (fallback UI state) |
| `retry_attempts` | Number of retries attempted |
| `resolution` | How failure was resolved (if resolved) |

### 7.2 Degraded Mode Logging

When system enters degraded mode:

**System MUST log:**
- Degraded mode start time
- Which features are unavailable
- Which features remain operational
- Degraded mode end time (when resolved)

### 7.3 User-Facing Error Logging

When user sees error:

**System MUST log:**
- Error message displayed to user
- User action taken (retry, contact support, etc.)
- Whether error was resolved
- Time to resolution (if resolved)

---

## SECTION 8 — Forbidden "Fake Data" Behavior

### 8.1 Hard Bans (10 Required)

#### Ban 1: Displaying Placeholder Readiness Values
**Forbidden:** System displaying "0", "50", "75", or "average" when readiness data is unavailable.

**Enforcement:** Backend MUST return `null` for unavailable readiness. Frontend MUST display "—" only.

**Rationale:** Truthfulness. Missing data is information. Fake data is lying.

---

#### Ban 2: Displaying Fake ACWR Values
**Forbidden:** System displaying "1.0", "safe", or "normal" when ACWR data is unavailable.

**Enforcement:** Backend MUST return `null` for unavailable ACWR. Frontend MUST hide widget or show baseline progress only.

**Rationale:** Truthfulness. ACWR requires complete data. Fake values create false safety perception.

---

#### Ban 3: Generating Replacement Sessions
**Forbidden:** System generating generic workouts or placeholder sessions when session resolution fails.

**Enforcement:** Backend MUST return error state. Frontend MUST display error banner, no blocks.

**Rationale:** Coach authority. Sessions belong to coaches. System cannot generate alternatives.

---

#### Ban 4: Hiding Errors from Users
**Forbidden:** System hiding API failures or errors from users.

**Enforcement:** All failures MUST be displayed to users with clear error messages.

**Rationale:** Trust. Users must know when system is failing.

---

#### Ban 5: Using Stale Data Without Warning
**Forbidden:** System displaying cached data >5 minutes old without staleness warning.

**Enforcement:** Frontend MUST check data timestamp. Display warning if >5 minutes old.

**Rationale:** Truthfulness. Stale data may be incorrect. Users must know data age.

---

#### Ban 6: Assuming Default Values
**Forbidden:** System assuming default values (e.g., "readiness = 75") when data is unavailable.

**Enforcement:** System MUST use `null` for unavailable data. No defaults without explicit user awareness.

**Rationale:** Truthfulness. Defaults presented as real data are misleading.

---

#### Ban 7: Continuing with Corrupted Data
**Forbidden:** System continuing operation with corrupted or invalid data.

**Enforcement:** System MUST validate data integrity. Show error state if data is corrupted.

**Rationale:** Data integrity. Corrupted data leads to incorrect decisions.

---

#### Ban 8: Masking Total Failure as Partial Failure
**Forbidden:** System presenting total failure as degraded mode or partial failure.

**Enforcement:** System MUST accurately report failure severity. Total failure requires total error state.

**Rationale:** Trust. Users must know true system state.

---

#### Ban 9: Retrying Indefinitely
**Forbidden:** System retrying failed APIs indefinitely without showing error state.

**Enforcement:** System MUST limit retries (max 3). Show error state after retries exhausted.

**Rationale:** User experience. Infinite retries freeze UI and frustrate users.

---

#### Ban 10: Displaying System Internals in Error Messages
**Forbidden:** System displaying technical error details (stack traces, database errors) to users.

**Enforcement:** System MUST show user-friendly error messages. Log technical details for engineering only.

**Rationale:** User experience. Technical details confuse users and expose system internals.

---

## SECTION 9 — Conflict Resolution Rules

### 9.1 When Multiple Failures Occur Simultaneously

If multiple system components fail simultaneously:

**Resolution Process:**
1. Identify all failed components
2. Determine failure severity (partial vs total)
3. Display appropriate error state (partial failure: degraded mode, total failure: error screen)
4. Prioritize error messages (safety-critical first)
5. Provide contact pathways for all failures

### 9.2 When Failure Conflicts with Safety Requirements

If system failure prevents safety-critical functionality (e.g., pain reporting, rehab restrictions):

**Resolution:**
1. System MUST prioritize safety functionality
2. System MUST display clear error: "Safety features unavailable. Contact support immediately."
3. System MUST escalate to medical staff if safety trigger cannot be processed
4. System MUST log safety failure as critical incident

---

## SECTION 10 — Acceptance Criteria + QA Checklist

### 10.1 Deterministic Output Criteria

Given identical failure state, system MUST produce:
- [ ] Identical error display (same message, same state)
- [ ] Identical fallback UI (same hidden/shown elements)
- [ ] Identical retry behavior (same retry policy)

### 10.2 Functional QA Checklist

| Test Case | Expected Result | Pass/Fail |
|-----------|-----------------|-----------|
| Readiness API fails | Shows "—", not fake value | |
| ACWR API fails | Hides widget, shows baseline if cached | |
| Session API fails | Shows error banner, no blocks | |
| Coach API fails | Shows error, retry button | |
| Multiple APIs fail | Shows appropriate error state | |
| Stale data displayed | Shows timestamp and warning | |
| Cached data >5min old | Not displayed as current | |
| Total failure | Shows error screen, contact support | |
| Partial failure | Shows degraded mode indicator | |
| Retry exhausted | Shows error state, no infinite retry | |

---

## Appendix A — Document Metadata

**Maintained By:** Product Architecture + Engineering  
**Enforcement:** All failure handling implementations MUST comply exactly  
**Testing:** QA must verify all failure scenarios and fallback UI states  
**Review Cycle:** Quarterly or on contract breach  
**Audit:** Non-compliance is system failure requiring immediate remediation

**Related Documents:**
- Authorization & Guardrails Contract v1
- TODAY Screen UX Authority Contract v1
- Session Lifecycle Authority Contract v1
- Backend Truthfulness Contract

**Version History:**
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-06 | Initial system failure & degraded mode contract | Product Architecture |

---

## End of Document

**This contract is law. Failure handling implementations that deviate are system failures.**


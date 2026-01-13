# AUTHORIZATION_AND_GUARDRAILS_CONTRACT_v1

Document Version: 1.0  
Status: NORMATIVE (BINDING)  
Scope: All backend services, APIs, databases, AI systems, UI gates, and background jobs  
Effective Date: 2026-01-06  

This contract defines the **technical enforcement layer** that makes all other system contracts non-violable.  
If a behavior is forbidden by any other contract, this contract MUST make it **technically impossible**.

This document is written as law.  
All clauses use **MUST / MUST NOT** language.  
No reliance on frontend correctness is permitted.

---

## SECTION 1 — Authorization Primitives (Canonical)

The system uses the following canonical primitives. All enforcement is derived from these.

### 1.1 Role
A **role** defines what class of actor is making a request.

Canonical roles:
- ATHLETE
- COACH
- PHYSIO
- ADMIN
- SYSTEM
- AI (Merlin)

Roles MUST be assigned explicitly.  
Roles MUST NOT be inferred from context, token content, or behavior.

---

### 1.2 Authority
**Authority** is the legal right to make a decision that affects training execution.

Examples:
- Coaches have authority over training structure
- Physios have authority over rehab protocols
- Athletes have authority only over execution logging

Authority MUST be explicit and role-bound.  
AI systems MUST NEVER possess authority.

---

### 1.3 Capability
A **capability** is a specific permitted action (e.g. `MODIFY_SESSION`, `LOG_RPE`).

Capabilities:
- Are granted by role
- Are constrained by session state
- Are revoked by locks

Capabilities MUST be evaluated per request.  
Capabilities MUST NOT be cached beyond request scope.

---

### 1.4 Ownership
**Ownership** defines whose data an object belongs to.

Rules:
- Athletes own their performance and wellness data
- Coaches own the plans they author
- The system owns audit logs

Ownership DOES NOT imply modification rights.

---

### 1.5 Consent
**Consent** is an explicit grant allowing a role to read specific data.

Rules:
- Consent is checked at READ time
- Consent defaults are restrictive
- Consent revocation is immediate

Consent MUST NOT be cached.  
Consent MUST NOT be overridden except by safety triggers.

---

### 1.6 Lock
A **lock** is a hard technical constraint that blocks mutation.

Canonical locks:
- `coach_locked`
- `execution_locked`
- `audit_locked`

Locks:
- MUST be enforced at API and database layers
- MUST override role and capability

---

### 1.7 override_flag
An **override_flag** records that an authority knowingly exceeded a safety boundary.

Rules:
- override_flag MUST be explicit
- override_flag MUST be logged
- override_flag NEVER grants additional permissions

---

## SECTION 2 — Global Authorization Model

Authorization MUST be evaluated in the following order:

1. Authentication validity
2. Role verification
3. Ownership verification
4. Consent verification (for reads)
5. Session state validation
6. Lock enforcement
7. Capability check
8. Safety override check

If ANY step fails:
- The request MUST be rejected
- No partial execution is permitted

### Conflict Resolution
When checks conflict, precedence is:

Locks > Session State > Authority > Capability > Consent > Preference

---

## SECTION 3 — API Guard Rules (Hard)

### 3.1 Session Mutation APIs
Allowed:
- COACH: only if session state < IN_PROGRESS
- SYSTEM: only for state transitions

Rejected if:
- session.state ≥ IN_PROGRESS
- coach_locked = true
- caller_role ≠ COACH

---

### 3.2 Coach Modification APIs
Required:
- Role = COACH
- Explicit coach_id
- Reason if override_flag present

Rejected if:
- Rehab protocol active without physio clearance
- Session already IN_PROGRESS

---

### 3.3 Logging APIs
Allowed:
- ATHLETE: execution logs, RPE, completion
- SYSTEM: derived metrics

Rejected if:
- Attempt to overwrite historical logs
- Attempt to log future timestamps

---

### 3.4 Check-in APIs
Allowed:
- ATHLETE only

Rules:
- Append-only
- Late data allowed
- Never recalculates past readiness

---

### 3.5 AI / Merlin APIs
AI:
- MUST be read-only
- MUST NOT call mutation endpoints
- MUST fail if attempting write access

---

### 3.6 Admin / Support APIs
Admins:
- MAY read everything
- MUST NOT mutate training data
- MUST NOT modify audit logs

---

## SECTION 4 — Database-Level Enforcement

### 4.1 Immutable Columns
Once set, these fields MUST NOT be updated:
- session.started_at
- session.completed_at
- audit.actor_id
- audit.timestamp

---

### 4.2 Append-Only Tables
Append-only:
- audit_logs
- execution_logs
- readiness_logs
- pain_reports

UPDATE and DELETE MUST be rejected at DB level.

---

### 4.3 Trigger-Based Rejection
DB triggers MUST reject:
- Any UPDATE on sessions where state ≥ IN_PROGRESS
- Any mutation when coach_locked = true

---

## SECTION 5 — Coach-Locked Session Enforcement

When `coach_locked = true`:
- ALL mutation APIs MUST reject
- AI pipelines MUST bypass personalization
- Read-only access only

Merlin MUST NOT possess database credentials capable of bypassing this.

---

## SECTION 6 — AI / Merlin Hard Guards

Merlin:
- MUST use read-only DB credentials
- MUST NOT access mutation APIs
- MUST pass pre-flight authority checks

Refusals MUST occur due to system denial, not language logic.

---

## SECTION 7 — Consent Enforcement

Consent rules:
- Checked at read time
- Enforced per field
- Revoked consent invalidates active sessions immediately

Safety overrides MAY bypass consent but MUST be logged.

---

## SECTION 8 — Violation Handling

On violation attempt:
1. Reject request
2. Log violation with full context
3. Alert engineering if severity ≥ HIGH
4. Return deterministic error message

Silent failures are forbidden.

---

## SECTION 9 — Forbidden Authorization Patterns (Hard Bans)

The system MUST NOT:
1. Trust frontend state
2. Soft-fail permission checks
3. Allow "best effort" writes
4. Let AI infer permissions
5. Permit backdated writes
6. Infer roles
7. Cache permissions across requests
8. Allow partial mutation
9. Modify audit history
10. Mask authorization errors
11. Allow system actors to impersonate humans
12. Permit AI to write through indirect paths

---

## SECTION 10 — Concrete Exploit Scenarios

### Scenario 1: Athlete modifies session via API
Blocked at:
- API guard (role mismatch)
- DB trigger (state violation)

---

### Scenario 2: Merlin writes to coach-locked session
Blocked at:
- Credential scope (read-only)
- API deny-list

---

### Scenario 3: Coach edits after IN_PROGRESS
Blocked at:
- Session state guard
- DB trigger

---

### Scenario 4: Admin modifies locked session
Blocked at:
- Capability restriction
- Immutable DB columns

---

### Scenario 5: Athlete reads teammate data without consent
Blocked at:
- Ownership check
- Consent check

---

## ENFORCEMENT GUARANTEE

If this contract is implemented correctly:
- Violating earlier contracts becomes impossible
- Responsibility is always attributable
- Audit history is immutable
- AI cannot bypass authority
- Safety boundaries are enforced by code, not intent

---

END OF CONTRACT  
AUTHORIZATION_AND_GUARDRAILS_CONTRACT_v1

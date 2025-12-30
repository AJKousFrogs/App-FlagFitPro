# Triage Rubric - Friday Test

**Purpose:** Quickly decide what gets fixed before Friday vs after.

---

## Decision Flowchart

```
                    ┌─────────────────────────────┐
                    │   BUG DISCOVERED            │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │ Does it violate GDPR or     │
              YES   │ expose user data?           │   NO
           ┌────────┤                             ├────────┐
           │        └─────────────────────────────┘        │
           │                                               │
           ▼                                               ▼
    ┌──────────────┐                        ┌─────────────────────────┐
    │  🛑 BLOCKER  │                        │ Does it prevent users   │
    │  FIX NOW     │                  YES   │ from completing core    │   NO
    └──────────────┘               ┌────────┤ workflow?               ├────────┐
                                   │        └─────────────────────────┘        │
                                   │                                           │
                                   ▼                                           ▼
                            ┌──────────────┐              ┌─────────────────────────┐
                            │  🛑 BLOCKER  │              │ Does it cause incorrect │
                            │  FIX NOW     │        YES   │ calculations affecting  │   NO
                            └──────────────┘     ┌────────┤ safety (ACWR, injury)?  ├────────┐
                                                 │        └─────────────────────────┘        │
                                                 │                                           │
                                                 ▼                                           ▼
                                          ┌──────────────┐        ┌─────────────────────────┐
                                          │  ⚠️ CRITICAL │        │ Does it create a UI     │
                                          │  FIX IF TIME │  YES   │ dead end (no escape)?   │   NO
                                          └──────────────┘ ┌──────┤                         ├──────┐
                                                           │      └─────────────────────────┘      │
                                                           │                                       │
                                                           ▼                                       ▼
                                                    ┌──────────────┐                    ┌──────────────┐
                                                    │  ⚠️ CRITICAL │                    │  📅 POST-    │
                                                    │  FIX IF TIME │                    │  FRIDAY      │
                                                    └──────────────┘                    └──────────────┘
```

---

## FIX BEFORE FRIDAY (Ship Blockers)

### Category 1: Security & Privacy Regressions
**Severity:** BLOCKER  
**Action:** Stop everything, fix immediately

| Bug Type | Example | Why It's a Blocker |
|----------|---------|-------------------|
| RLS policy bypass | Coach sees unshared player data | GDPR data breach |
| AI without consent | AI features work when consent = false | GDPR Article 22 violation |
| Session not revoked | Deleted user can still access app | Security vulnerability |
| Data leak | API returns other users' data | Privacy violation |
| Auth bypass | Unauthenticated access to protected routes | Security hole |

### Category 2: Broken Workflows
**Severity:** BLOCKER  
**Action:** Fix before any other work

| Bug Type | Example | Why It's a Blocker |
|----------|---------|-------------------|
| Cannot login | Valid credentials rejected | No one can use app |
| Cannot register | Registration form broken | No new users |
| Dashboard crash | Infinite redirect loop | App unusable |
| Deletion broken | Account deleted immediately (no grace period) | GDPR Article 17 violation |
| Settings don't save | Privacy toggles reset on refresh | Core feature broken |

### Category 3: Incorrect Calculations
**Severity:** CRITICAL  
**Action:** Fix before Friday

| Bug Type | Example | Why It's Critical |
|----------|---------|-------------------|
| ACWR wrong | Formula returns 0.5 when should be 1.2 | Injury risk miscalculated |
| Readiness wrong | Shows 90% when athlete is exhausted | Safety concern |
| Load not updating | Training sessions not counted | ACWR becomes stale |
| Consent state wrong | Toggle ON but database shows false | Features randomly blocked |

### Category 4: UI Dead Ends
**Severity:** CRITICAL  
**Action:** Fix before Friday

| Bug Type | Example | Why It's Critical |
|----------|---------|-------------------|
| Button does nothing | Save button no response, no error | User stuck |
| Modal won't close | X button doesn't work | User trapped |
| Form field broken | Required field cannot be filled | Cannot complete task |
| Navigation broken | Link leads to 404 | User lost |
| No escape route | Page with no back button or nav | User must refresh |

---

## FIX AFTER FRIDAY (Post-Launch)

### Category 5: UX Improvements
**Severity:** MEDIUM/LOW  
**Action:** Add to backlog

| Bug Type | Example | Why It Can Wait |
|----------|---------|-----------------|
| Tooltip missing | Chart hover shows nothing | Data still visible |
| Loading too fast | Spinner flashes briefly | Not broken |
| Message unclear | "Error occurred" instead of specific | User can retry |
| Mobile layout off | Button slightly misaligned | Still functional |

### Category 6: Nice-to-Have Features
**Severity:** LOW  
**Action:** Add to backlog

| Bug Type | Example | Why It Can Wait |
|----------|---------|-----------------|
| CSV export | Only JSON works | JSON sufficient |
| Chat editing | Cannot edit sent messages | Can send correction |
| Pagination slow | Community feed loads 100+ items | Still works |

### Category 7: Edge Cases
**Severity:** LOW  
**Action:** Add to backlog

| Bug Type | Example | Why It Can Wait |
|----------|---------|-----------------|
| Timezone bug | Wrong date at midnight UTC | Rare occurrence |
| Long name wrap | 50-character name breaks layout | Very rare |
| 1000+ workouts | Performance degrades | Most users <100 |

---

## Quick Decision Questions

Ask these questions in order. Stop at first YES:

| # | Question | If YES | Category |
|---|----------|--------|----------|
| 1 | Does it violate GDPR/privacy rules or expose user data? | **FIX NOW** | Security/Privacy Regression |
| 2 | Does it prevent users from completing a core workflow? | **FIX NOW** | Broken Workflow |
| 3 | Does it cause incorrect calculations (ACWR, load, readiness)? | **FIX NOW** | Incorrect Calculation |
| 4 | Does it create a UI dead end (user stuck, no escape)? | **FIX NOW** | UI Dead End |
| 5 | Is it only edge cases, aesthetics, or nice-to-haves? | **FIX AFTER** | Post-Friday |

---

## Severity Reference Card

| Severity | Color | Action | Fix Before Friday? |
|----------|-------|--------|-------------------|
| **BLOCKER** | 🔴 | Fix immediately, blocks launch | **YES - MANDATORY** |
| **CRITICAL** | 🟠 | Fix before Friday | **YES - MANDATORY** |
| **HIGH** | 🟡 | Fix if time permits | Maybe |
| **MEDIUM** | 🔵 | Fix after Friday | No |
| **LOW** | ⚪ | Backlog | No |

### What Qualifies as Fix Before Friday

Only these four categories qualify for pre-Friday fixes:

1. **Security/Privacy Regressions** - GDPR violations, data leaks, auth bypasses
2. **Broken Workflows** - Features that don't complete their intended flow
3. **Incorrect Calculations** - Math/logic errors in ACWR, load, readiness
4. **UI Dead Ends** - Buttons that don't work, forms that can't submit, navigation traps

---

## Example Triage Decisions

### Example 1: Coach sees player's wellness data (consent = false)
```
Q1: GDPR violation? → YES
Decision: 🔴 BLOCKER - FIX NOW
Rationale: RLS policy bypass, data breach risk
```

### Example 2: Chart tooltip doesn't show on mobile
```
Q1: GDPR violation? → NO
Q2: Prevents core workflow? → NO
Q3: Safety calculation wrong? → NO
Q4: UI dead end? → NO
Q5: Edge case/aesthetic? → YES
Decision: ⚪ LOW - FIX AFTER FRIDAY
Rationale: Data still visible, just no tooltip
```

### Example 3: ACWR shows 0.0 for user with 30 days of data
```
Q1: GDPR violation? → NO
Q2: Prevents core workflow? → NO
Q3: Safety calculation wrong? → YES
Decision: 🟠 CRITICAL - FIX IF TIME
Rationale: Athlete may train unsafely based on wrong metric
```

### Example 4: Delete Account button does nothing (no error, no success)
```
Q1: GDPR violation? → NO (but close - deletion right)
Q2: Prevents core workflow? → YES (cannot delete account)
Decision: 🔴 BLOCKER - FIX NOW
Rationale: GDPR Article 17 right to erasure blocked
```

---

## Post-Friday Label

When documenting improvements that should NOT be implemented before Friday, use this label:

```markdown
**Post-Friday:** [Description of improvement]
```

Example:
> **Post-Friday:** Add CSV export option alongside JSON export.

This ensures the improvement is tracked but not implemented during the freeze.

---

**END OF TRIAGE RUBRIC**

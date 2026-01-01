# Bug Report Template - FlagFit Pro

**Use this template for ALL bug reports found during Friday testing.**

Save bug reports in `/docs/bugs/` directory with filename: `BUG-YYYYMMDD-###.md`

---

## Title Format

**Use this format:** `[SEVERITY] [COMPONENT] Brief description`

**Examples:**

- `[BLOCKER] [Auth] Cannot login with valid credentials`
- `[BLOCKER] [Privacy] AI features accessible without consent`
- `[CRITICAL] [ACWR] Calculation incorrect for athletes with gaps in data`
- `[HIGH] [UI] Save button doesn't show loading state`
- `[MEDIUM] [Mobile] Chart tooltip cuts off on small screens`

---

## Bug Report Fields

### Metadata

| Field               | Value                                                    |
| ------------------- | -------------------------------------------------------- |
| **Bug ID**          | BUG-YYYYMMDD-###                                         |
| **Date Found**      | YYYY-MM-DD                                               |
| **Found By**        | [Tester Name]                                            |
| **Test Case**       | [Test number from TEST_PLAN_FRIDAY.md, e.g., "Test 1.2"] |
| **Severity**        | BLOCKER / CRITICAL / HIGH / MEDIUM / LOW                 |
| **Priority**        | Fix Before Friday / Fix After Friday                     |
| **Reproducibility** | Always / Often (>50%) / Sometimes (<50%) / Once          |
| **Status**          | New / In Progress / Fixed / Won't Fix / Duplicate        |
| **Assigned To**     | [Developer Name or "Unassigned"]                         |

---

### Environment

| Field                  | Value                                                     |
| ---------------------- | --------------------------------------------------------- |
| **Browser**            | Chrome 120 / Firefox 121 / Safari 17 / Edge 120           |
| **OS**                 | macOS 14.2 / Windows 11 / iOS 17 / Android 14             |
| **Screen Size**        | Desktop 1920x1080 / Tablet 768x1024 / Mobile 375x667      |
| **User Role**          | Athlete / Coach / Admin                                   |
| **Account State**      | New User / Rich Data / Consent Blocked / Deletion Pending |
| **Test Account Email** | e.g., athlete.adult@test.com                              |
| **Network**            | Fast WiFi / Slow 3G / Offline                             |

---

### Steps to Reproduce

**Prerequisites:**

- [ ] Test account created: [email]
- [ ] Database seeded with: [describe data]
- [ ] Privacy setting: AI consent = [true/false]
- [ ] User logged in: [yes/no]

**Reproduction Steps:**

1. Navigate to [URL or route]
2. Click on [button/link/element]
3. Enter [data] in [field]
4. Click [submit/save/action]
5. Observe [what happens]

**Reproduction Rate:** [10/10 attempts | 5/10 attempts | 1/10 attempts]

---

### Expected Behavior

**What SHOULD happen:**

- [Describe expected outcome]
- [Describe expected UI state]

**Reference:** [Link to design doc, user story, or GDPR requirement]

---

### Actual Behavior

**What ACTUALLY happens:**

- [Describe actual outcome]
- [Describe actual UI state]

**Evidence:**

- Screenshot: [filename.png]
- Console Error: [error message]
- Network Request: [failed API call]

---

### Screenshots / Logs

**Console Errors:**

```javascript
// Paste console errors here
```

**Network Activity:**

```
POST /api/endpoint
Status: XXX
Response: { ... }
```

---

### Impact Assessment

**User Impact:** (check all that apply)

- [ ] Blocks all users from core functionality
- [ ] Blocks specific user role from core functionality
- [ ] Causes data loss or corruption
- [ ] Violates GDPR/privacy requirements
- [ ] Security vulnerability (data breach risk)
- [ ] Incorrect calculations affecting user decisions
- [ ] Creates UI dead end (cannot escape state)
- [ ] Confusing UX but workaround exists
- [ ] Cosmetic issue only

**Affected Features:**

- [List all features affected by this bug]

---

### Tags

**Data State:** (select applicable)

- [ ] consent-blocked
- [ ] ai-disabled
- [ ] deletion-pending
- [ ] insufficient-data
- [ ] new-user
- [ ] rich-data

**Component:** (select applicable)

- [ ] auth
- [ ] privacy-settings
- [ ] account-deletion
- [ ] data-export
- [ ] ai-service
- [ ] coach-dashboard
- [ ] athlete-dashboard
- [ ] training
- [ ] wellness
- [ ] performance
- [ ] acwr
- [ ] analytics
- [ ] forms
- [ ] navigation
- [ ] mobile-ui

**GDPR Compliance:** (select if applicable)

- [ ] consent-violation
- [ ] data-breach
- [ ] deletion-rights
- [ ] portability-rights
- [ ] access-control

---

### Suggested Fix (Optional)

**Root Cause:**

- [Your hypothesis about what's causing the bug]

**Proposed Solution:**

- [Suggested code change or approach]

**Files to Check:**

- `[file path:line number]` - [reason]

**Risks of Fix:**

- [What might break if we fix this]

---

### Triage Decision

**Fix Before Friday?** YES / NO

**Rationale:**

- [Explain why this must/can be fixed before Friday]
- [Reference triage rubric category]

---

### Resolution Notes (Fill after fix)

| Field           | Value             |
| --------------- | ----------------- |
| **Fixed By**    | [Developer name]  |
| **Fixed On**    | YYYY-MM-DD        |
| **Commit Hash** | [git commit hash] |

**Fix Summary:**

- [Brief description of what was changed]

**Files Changed:**

- `[file path]` - [what changed]

**Verification:**

- [ ] Bug no longer reproducible
- [ ] All regression tests pass
- [ ] Code reviewed
- [ ] Merged to main

---

## Quick Reference: Severity Definitions

| Severity     | Definition                                                                 | Examples                                              | Action                                |
| ------------ | -------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------- |
| **BLOCKER**  | Prevents core functionality, affects all users, security/privacy violation | Cannot login, GDPR violation, data breach, RLS bypass | Fix immediately, blocks Friday launch |
| **CRITICAL** | Major feature broken, affects many users, incorrect calculations           | ACWR wrong formula, dashboard crash, data loss        | Fix before Friday if possible         |
| **HIGH**     | Important feature degraded, affects some users, has workaround             | Chart tooltips missing, slow performance              | Fix before Friday if time permits     |
| **MEDIUM**   | Minor feature issue, affects few users, cosmetic problems                  | Button alignment off, text typo                       | Fix after Friday                      |
| **LOW**      | Edge case, rare occurrence, nice-to-have                                   | Timezone edge case, very long name wraps poorly       | Backlog                               |

---

## Quick Reference: Tag Meanings

| Tag                 | Meaning                                                        |
| ------------------- | -------------------------------------------------------------- |
| `consent-blocked`   | User has explicitly disabled consent (AI, research, marketing) |
| `ai-disabled`       | AI features turned off globally or for user                    |
| `deletion-pending`  | Account in 30-day grace period before hard deletion            |
| `insufficient-data` | User has <7 days or <28 days of data for calculations          |
| `new-user`          | User just registered, no historical data                       |
| `rich-data`         | User has 30+ days of comprehensive data                        |

---

**END OF TEMPLATE**

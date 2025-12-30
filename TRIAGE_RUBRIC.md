# Triage Rubric - Friday Test
**Quick Reference: What Gets Fixed Before Friday vs After**

---

## Decision Matrix (Use This First)

When triaging a bug, ask these questions **in order**:

| # | Question | If YES → |
|---|----------|----------|
| 1️⃣ | Does it violate GDPR/privacy rules? | **FIX NOW (BLOCKER)** |
| 2️⃣ | Does it prevent core workflow completion? | **FIX NOW (BLOCKER)** |
| 3️⃣ | Does it cause incorrect calculations affecting safety/decisions? | **FIX NOW (CRITICAL)** |
| 4️⃣ | Does it create a UI dead end (no escape)? | **FIX NOW (CRITICAL)** |
| 5️⃣ | Does it only affect edge cases or aesthetics? | **FIX AFTER (Post-Friday)** |

---

## Fix Before Friday (Ship Blockers)

### 🛑 Category 1: Security & Privacy Violations
**Severity: BLOCKER**

- RLS policy bypass (coach sees unshared data)
- AI features accessible without consent
- Account deletion doesn't revoke session
- Parental consent not enforced for minors (<18)
- CSRF protection missing on critical endpoints
- Password stored/transmitted in plaintext
- JWT token manipulation allows unauthorized access

**Why:** Legal liability, GDPR violations, data breach risk
**Impact:** Cannot ship, immediate legal exposure

---

### 🛑 Category 2: Broken Core Workflows
**Severity: BLOCKER**

- Cannot login with valid credentials
- Cannot register new account
- Dashboard infinite redirect loop
- Account deletion grace period not enforced
- Privacy settings don't save/persist
- Cannot assign training to athletes (coach)
- Cannot log workout (athlete)
- Email verification fails completely

**Why:** Users cannot complete essential tasks
**Impact:** App unusable for primary use cases

---

### ⚠️ Category 3: Data Integrity Issues
**Severity: CRITICAL**

- ACWR calculation incorrect (affects injury prevention)
- Readiness score wrong formula
- Training load not updating after session
- Consent status not persisting across sessions
- Performance metrics aggregation wrong
- Deletion request status not reflected in UI

**Why:** Wrong calculations → wrong decisions → user harm
**Impact:** Safety risk, trust erosion

---

### ⚠️ Category 4: UI Dead Ends
**Severity: CRITICAL**

- Save button doesn't work (no error, no success, no feedback)
- Required form field cannot be filled (disabled/hidden)
- Modal cannot be closed (X button broken, ESC key doesn't work)
- Navigation stuck (back button doesn't work)
- Form submission fails silently (no validation errors shown)

**Why:** Users trapped in broken state, cannot proceed
**Impact:** Frustration, support burden, poor UX

---

## Fix After Friday (Post-Launch)

### 📅 Category 5: UX Improvements
**Severity: MEDIUM → LOW**

- Chart tooltips not showing
- Loading spinner too fast/slow
- Form validation message unclear
- Mobile layout slightly off (still usable)
- Button color inconsistent with design
- Icon size too small
- Text wraps awkwardly
- Empty state message could be more helpful

**Why:** Annoyance but not blocking
**Impact:** Minor UX degradation, has workarounds

---

### 📅 Category 6: Nice-to-Have Features
**Severity: LOW**

- Community feed pagination slow
- Chat message editing (can delete/resend)
- Export to CSV (JSON export works)
- Dark mode toggle (light mode works)
- Advanced filtering options (basic filter works)
- Keyboard shortcuts missing

**Why:** Enhancement, not core functionality
**Impact:** Convenience feature, not required for launch

---

### 📅 Category 7: Edge Cases
**Severity: LOW**

- Performance issue with 1000+ workouts (most users have <100)
- Rare timezone bug in date formatting (affects <1% users)
- Very long athlete name wraps poorly (>50 characters)
- Network timeout on very slow 2G (retry works)
- Chart breaks with 0 data points (impossible scenario)

**Why:** Affects very few users in rare scenarios
**Impact:** Minimal real-world impact

---

## Severity Cheat Sheet

### BLOCKER 🛑
- **What:** Prevents core functionality, security/privacy violation
- **Who:** Affects all users OR creates legal liability
- **When:** Fix immediately, blocks Friday launch
- **Examples:** Cannot login, GDPR violation, data breach

### CRITICAL ⚠️
- **What:** Major feature broken, incorrect calculations
- **Who:** Affects many users OR impacts safety
- **When:** Fix before Friday if possible
- **Examples:** ACWR wrong, dashboard crash, deletion broken

### HIGH 🔶
- **What:** Important feature degraded, has workaround
- **Who:** Affects some users
- **When:** Fix before Friday if time permits
- **Examples:** Slow chart load, weak validation, missing tooltip

### MEDIUM 🔷
- **What:** Minor feature issue, cosmetic problem
- **Who:** Affects few users
- **When:** Fix after Friday
- **Examples:** Button misaligned, spinner timing, text typo

### LOW ⚪
- **What:** Edge case, rare occurrence
- **Who:** Affects very few users in rare scenarios
- **When:** Backlog
- **Examples:** Timezone edge case, very long name, extreme data volume

---

## Triage Examples

### Example 1: Coach Sees Athlete Data Without Consent
- **Question 1:** Violates GDPR? → **YES** (Article 6 & 22)
- **Severity:** BLOCKER
- **Category:** Security & Privacy Violations
- **Decision:** **FIX BEFORE FRIDAY**
- **Why:** Legal liability, cannot ship

### Example 2: ACWR Shows 0.0 for All Athletes
- **Question 1:** GDPR violation? → No
- **Question 2:** Prevents core workflow? → No (can still view dashboard)
- **Question 3:** Incorrect calculation affecting safety? → **YES** (injury prevention)
- **Severity:** CRITICAL
- **Category:** Data Integrity Issues
- **Decision:** **FIX BEFORE FRIDAY**
- **Why:** Safety risk (coaches rely on this for injury prevention)

### Example 3: Chart Tooltip Doesn't Show on Hover
- **Question 1-4:** All No
- **Question 5:** Aesthetic issue? → **YES**
- **Severity:** MEDIUM
- **Category:** UX Improvements
- **Decision:** **FIX AFTER FRIDAY**
- **Why:** Annoying but doesn't block usage, can see data in table below chart

### Example 4: Save Button on Privacy Settings Doesn't Respond
- **Question 1:** GDPR violation? → Potentially (if consent can't be saved)
- **Question 2:** Prevents core workflow? → **YES** (cannot update settings)
- **Question 4:** UI dead end? → **YES** (no feedback, no success, no error)
- **Severity:** BLOCKER (if consent-related) or CRITICAL (if other settings)
- **Category:** Broken Core Workflows OR UI Dead Ends
- **Decision:** **FIX BEFORE FRIDAY**
- **Why:** Critical functionality broken, may be GDPR compliance issue

### Example 5: Mobile Menu Animation Slightly Jerky
- **Question 1-4:** All No
- **Question 5:** Aesthetic issue? → **YES**
- **Severity:** LOW
- **Category:** UX Improvements
- **Decision:** **FIX AFTER FRIDAY**
- **Why:** Cosmetic, doesn't affect functionality

---

## Special Cases

### What if we can't fix a BLOCKER before Friday?
**Options:**
1. **Disable the feature** (e.g., hide AI suggestions if consent check broken)
2. **Add manual workaround** (e.g., admin script to fix data)
3. **Delay launch** (if truly critical and no workaround exists)

**Decision criteria:**
- Can we disable without breaking other features?
- Is there a safe manual workaround for admins?
- How many users affected vs. delay cost?

### What if a LOW bug affects a VIP user?
**Still LOW priority** unless:
- It's actually a BLOCKER for ALL users (mis-categorized)
- It creates reputational risk (public demo failure)

**Don't:** Reprioritize every bug VIPs report
**Do:** Communicate workaround and timeline

### What if we're unsure about severity?
**Default to higher severity** and triage down:
- Mark as CRITICAL if unsure between CRITICAL and HIGH
- Mark as BLOCKER if there's any GDPR concern
- Get second opinion from security/compliance team

**When in doubt, ask:**
- "Would I be comfortable launching with this bug?"
- "What's the worst-case outcome if we ship this?"

---

## Triage Workflow

```
Bug Found
    ↓
File Bug Report (BUG_REPORT_TEMPLATE.md)
    ↓
Answer Decision Matrix Questions
    ↓
Assign Severity (BLOCKER/CRITICAL/HIGH/MEDIUM/LOW)
    ↓
Choose Category (1-7)
    ↓
Decide: Fix Before Friday? (YES/NO)
    ↓
Mark Priority in Bug Report
    ↓
Assign to Developer (if Fix Before Friday)
    ↓
Add to Friday Fix List OR Post-Friday Backlog
```

---

## Friday Fix List Checklist

Before launch, ensure:

- [ ] **ZERO BLOCKER bugs** remain open
- [ ] **All CRITICAL bugs** fixed or have approved workaround
- [ ] **All GDPR-related bugs** fixed (consent, deletion, portability, access control)
- [ ] **All security bugs** fixed (RLS, auth, CSRF, XSS, injection)
- [ ] **Core workflows** tested end-to-end with no blockers
- [ ] **Triage decisions** documented and approved by team lead

---

## Quick Reference: GDPR Triggers

If bug involves any of these, likely **BLOCKER**:

- ✋ Consent not enforced (Article 6, 7, 22)
- ✋ Data accessible without authorization (Article 5, 6)
- ✋ Deletion request not honored (Article 17)
- ✋ Data export fails (Article 20)
- ✋ Parental consent bypassed for minors (Article 8)
- ✋ Purpose limitation violated (Article 5)
- ✋ Data retention policy not followed (Article 5)

---

**Last Updated:** 2025-12-30
**Valid For:** Friday Launch Test

**END OF TRIAGE RUBRIC**

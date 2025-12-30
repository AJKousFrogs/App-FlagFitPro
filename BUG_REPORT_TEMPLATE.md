# Bug Report Template - FlagFit Pro

**Use this template for ALL bug reports found during Friday testing.**

Copy this template for each bug and save in `/docs/bugs/` directory with filename: `BUG-YYYYMMDD-###.md`

---

## Bug Report

### Title Format
**Use this format:** `[SEVERITY] [COMPONENT] Brief description`

**Examples:**
- `[BLOCKER] [Auth] Cannot login with valid credentials`
- `[CRITICAL] [Privacy] AI features accessible without consent`
- `[HIGH] [ACWR] Calculation incorrect for athletes with gaps in data`
- `[MEDIUM] [UI] Save button doesn't show loading state`
- `[LOW] [Mobile] Chart tooltip cuts off on small screens`

---

### Metadata

**Bug ID:** BUG-YYYYMMDD-### _(auto-increment number)_

**Date Found:** YYYY-MM-DD

**Found By:** [Tester Name]

**Test Case:** [Test number from TEST_PLAN_FRIDAY.md, e.g., "Test 1.2"]

**Severity:** [BLOCKER | CRITICAL | HIGH | MEDIUM | LOW]

**Priority:** [Fix Before Friday | Fix After Friday]

**Reproducibility:** [Always | Often (>50%) | Sometimes (<50%) | Once]

**Status:** [New | In Progress | Fixed | Won't Fix | Duplicate]

**Assigned To:** [Developer Name or "Unassigned"]

---

### Environment

**Browser:** [Chrome 120 | Firefox 121 | Safari 17 | Edge 120]

**OS:** [macOS 14.2 | Windows 11 | iOS 17 | Android 14]

**Screen Size:** [Desktop 1920x1080 | Tablet 768x1024 | Mobile 375x667]

**User Role:** [Athlete | Coach | Guardian | Admin]

**Account State:** [New User | Rich Data | Consent Blocked | Deletion Pending]

**Test Account Email:** [e.g., athlete.adult@test.com]

**Network:** [Fast WiFi | Slow 3G | Offline]

**Database State:** [Fresh seed | Modified | Production-like]

---

### Steps to Reproduce

**Prerequisites:**
_(What needs to be set up before reproducing)_
- [ ] Test account created: [email]
- [ ] Database seeded with: [describe data]
- [ ] Privacy setting: AI consent = [true/false]
- [ ] User logged in: [yes/no]
- [ ] Other: [any other prerequisites]

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
- [Describe expected data state]

**Why this is expected:**
- [Reference to design doc, user story, or acceptance criteria]
- [Reference to GDPR requirement, if applicable]

**Example:**
> When clicking "Request Account Deletion" and confirming, the user should see a success toast and a warning banner showing "Account deletion scheduled for [30 days from now]". The user should remain logged in and able to cancel the deletion.

---

### Actual Behavior

**What ACTUALLY happens:**
- [Describe actual outcome]
- [Describe actual UI state]
- [Describe actual data state]

**Evidence:**
- Screenshot: [filename.png]
- Video: [filename.mp4]
- Console Error: [error message]
- Network Request: [failed API call]
- Database Query Result: [unexpected data]

**Example:**
> After clicking "Request Account Deletion" and confirming, the user is immediately logged out and cannot log back in. The account appears to be hard-deleted instead of soft-deleted.

---

### Screenshots / Logs

**Screenshot 1: [Description]**
![Screenshot](./screenshots/BUG-YYYYMMDD-###-1.png)

**Screenshot 2: [Description]**
![Screenshot](./screenshots/BUG-YYYYMMDD-###-2.png)

**Console Errors:**
```javascript
Uncaught TypeError: Cannot read property 'id' of null
    at PrivacySettingsService.requireAiConsent (privacy-settings.service.ts:554)
    at AIService.getTrainingSuggestions (ai.service.ts:83)
```

**Network Activity:**
```
POST /api/training/suggestions
Status: 200 OK
Response: { suggestions: [...] }  // <- Should have been blocked!
```

**Database Query:**
```sql
SELECT ai_processing_enabled FROM privacy_settings WHERE user_id = 'xxx';
-- Result: false

-- But API still returned suggestions! RLS policy not enforced.
```

---

### Impact Assessment

**User Impact:**
- [ ] Blocks all users from core functionality
- [ ] Blocks specific user role from core functionality
- [ ] Causes data loss or corruption
- [ ] Violates GDPR/privacy requirements
- [ ] Security vulnerability (data breach risk)
- [ ] Incorrect calculations affecting user decisions
- [ ] Creates UI dead end (cannot escape state)
- [ ] Confusing UX but workaround exists
- [ ] Cosmetic issue only

**Business Impact:**
- [ ] Cannot launch on Friday (ship blocker)
- [ ] Legal liability (GDPR violation)
- [ ] Reputational risk (data breach)
- [ ] Performance degradation
- [ ] Minor annoyance

**Affected Features:**
- [List all features affected by this bug]

**Example:**
> **User Impact:** Violates GDPR Article 22 - AI processing consent not enforced.
>
> **Business Impact:** Legal liability - cannot launch without fixing.
>
> **Affected Features:** AI training suggestions, AI scheduler, AI chat

---

### Tags

**Select all that apply:**

**Data State:**
- [ ] consent-blocked
- [ ] consent-pending
- [ ] ai-disabled
- [ ] deletion-pending
- [ ] insufficient-data
- [ ] new-user
- [ ] rich-data
- [ ] parental-consent

**Component:**
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
- [ ] roster
- [ ] chat
- [ ] community
- [ ] forms
- [ ] navigation
- [ ] mobile-ui

**Layer:**
- [ ] frontend-ui
- [ ] frontend-logic
- [ ] api-endpoint
- [ ] database-rls
- [ ] database-trigger
- [ ] authentication
- [ ] authorization

**GDPR Compliance:**
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

**Example:**
> **Root Cause:** `AIService.getTrainingSuggestions()` doesn't call `privacySettingsService.requireAiConsent()` before making API request.
>
> **Proposed Solution:** Add consent check at line 83 of `ai.service.ts`:
> ```typescript
> async getTrainingSuggestions() {
>   await this.privacySettingsService.requireAiConsent(); // ADD THIS
>   // existing code...
> }
> ```
>
> **Files to Check:**
> - `angular/src/app/core/services/ai.service.ts:83` - Add consent check
> - `angular/src/app/core/services/privacy-settings.service.ts:554` - Verify requireAiConsent throws error correctly
>
> **Risks of Fix:** Might break other AI features that bypass consent for admin overrides.

---

### Related Bugs

**Duplicates:**
- BUG-YYYYMMDD-### (if this is a duplicate, mark status as "Duplicate")

**Related Issues:**
- BUG-YYYYMMDD-### (similar root cause)

**Blocks:**
- BUG-YYYYMMDD-### (this bug must be fixed before that one can be fixed)

**Blocked By:**
- BUG-YYYYMMDD-### (that bug must be fixed before this one can be fixed)

---

### Verification Steps (After Fix)

**How to verify this bug is fixed:**
1. [Step to reproduce original bug]
2. [Expected behavior should now occur]
3. [No regression in related functionality]

**Regression Tests:**
- [ ] Test [related feature] still works
- [ ] Test [edge case] still handled correctly
- [ ] Test [user role] can still [action]

**Example:**
> 1. Login as `athlete.adult@test.com` with AI consent = false
> 2. Navigate to `/training/ai-scheduler`
> 3. **Expected:** See opt-in prompt, NO network requests to `/api/training/suggestions`
> 4. **Regression:** Test that enabling AI consent in `/settings/privacy` does allow suggestions

---

### Triage Decision

**Fix Before Friday?** [YES | NO]

**Rationale:**
- [Explain why this must/can be fixed before Friday]
- [Reference triage rubric category]

**Example:**
> **Fix Before Friday?** YES
>
> **Rationale:** This is a GDPR Article 22 violation. AI processing without explicit consent creates legal liability. Meets "Security & Privacy Violations" category in triage rubric - BLOCKER severity.

---

### Resolution Notes (Fill after fix)

**Fixed By:** [Developer name]

**Fixed On:** YYYY-MM-DD

**Commit Hash:** [git commit hash]

**Fix Summary:**
- [Brief description of what was changed]

**Files Changed:**
- `[file path]` - [what changed]

**Verification:**
- [ ] Bug no longer reproducible
- [ ] All regression tests pass
- [ ] Code reviewed by [name]
- [ ] Merged to [branch]

**Example:**
> **Fixed By:** John Doe
>
> **Fixed On:** 2025-12-30
>
> **Commit Hash:** `abc123def456`
>
> **Fix Summary:** Added `requireAiConsent()` check before all AI API calls. AI features now properly gated by consent.
>
> **Files Changed:**
> - `ai.service.ts:83` - Added consent check in `getTrainingSuggestions()`
> - `ai.service.ts:230` - Added consent check in `processNaturalLanguageCommand()`
> - `ai.service.ts:365` - Added consent check in `analyzeContext()`
>
> **Verification:**
> - ✅ Bug no longer reproducible (Test 1.2 passes)
> - ✅ Regression tests pass (AI features still work when consent enabled)
> - ✅ Code reviewed by Jane Smith
> - ✅ Merged to `main`

---

## Quick Reference: Severity Definitions

### BLOCKER
- **Definition:** Prevents core functionality, affects all users, security/privacy violation
- **Examples:** Cannot login, GDPR violation, data breach, RLS bypass
- **Action:** Fix immediately, blocks Friday launch

### CRITICAL
- **Definition:** Major feature broken, affects many users, incorrect calculations
- **Examples:** ACWR wrong formula, dashboard crash, data loss
- **Action:** Fix before Friday if possible

### HIGH
- **Definition:** Important feature degraded, affects some users, has workaround
- **Examples:** Chart tooltips missing, slow performance, form validation weak
- **Action:** Fix before Friday if time permits

### MEDIUM
- **Definition:** Minor feature issue, affects few users, cosmetic problems
- **Examples:** Button alignment off, loading spinner too fast, text typo
- **Action:** Fix after Friday

### LOW
- **Definition:** Edge case, rare occurrence, nice-to-have
- **Examples:** Timezone edge case, very long name wraps poorly
- **Action:** Backlog

---

## Quick Reference: Tag Meanings

**consent-blocked:** User has explicitly disabled consent (AI, research, marketing)
**consent-pending:** User hasn't responded to consent request yet
**ai-disabled:** AI features turned off globally or for user
**deletion-pending:** Account in 30-day grace period before hard deletion
**insufficient-data:** User has <7 days or <28 days of data for calculations
**new-user:** User just registered, no historical data
**rich-data:** User has 30+ days of comprehensive data
**parental-consent:** Related to minor (13-17) consent requirements

---

**END OF TEMPLATE**

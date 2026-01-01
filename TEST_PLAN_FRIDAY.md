# Friday Test Plan - FlagFit Pro

**Date:** 2025-12-30  
**Session Duration:** 90 minutes  
**Focus:** Maximize defect discovery in critical workflows  
**Scope:** FROZEN - No new features, only fixes for broken workflows, incorrect calculations, security/privacy regressions, and UI dead ends

---

## Pre-Test Setup (10 minutes)

### Test Accounts to Create

Create the following accounts in your Supabase database:

| Account                       | Email                      | Password          | Role    | Purpose                                 |
| ----------------------------- | -------------------------- | ----------------- | ------- | --------------------------------------- |
| **Coach**                     | `coach.friday@test.com`    | `TestCoach123!`   | coach   | Coach dashboard, team management        |
| **Adult Athlete (Rich Data)** | `athlete.adult@test.com`   | `TestAthlete123!` | athlete | 30+ days seeded data, AI consent OFF    |
| **New Athlete (No Data)**     | `athlete.new@test.com`     | `TestNew123!`     | athlete | Fresh account, insufficient data states |
| **Consent Blocked Athlete**   | `athlete.blocked@test.com` | `TestBlocked123!` | athlete | All consents OFF, team sharing OFF      |

> **Note:** App is **16+ only**. No minor accounts or parental consent testing required.

### Database Prerequisites

Run these SQL commands in Supabase SQL Editor:

```sql
-- 1. Create test team for coach
INSERT INTO teams (id, name, coach_id, sport, division)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Friday Test Team',
  (SELECT id FROM auth.users WHERE email = 'coach.friday@test.com'),
  'flag_football',
  'olympic'
);

-- 2. Add athletes to team
INSERT INTO team_members (team_id, user_id, role, status)
SELECT
  '00000000-0000-0000-0000-000000000001',
  id,
  'player',
  'active'
FROM auth.users
WHERE email IN ('athlete.adult@test.com', 'athlete.blocked@test.com');

-- 3. Set AI consent to FALSE for adult athlete (for consent blocking tests)
UPDATE privacy_settings
SET ai_processing_enabled = false,
    ai_processing_consent_date = NULL,
    research_opt_in = false,
    marketing_opt_in = false
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'athlete.adult@test.com');

-- 4. Set ALL consents to FALSE for blocked athlete
UPDATE privacy_settings
SET ai_processing_enabled = false,
    research_opt_in = false,
    marketing_opt_in = false,
    team_data_sharing_enabled = false
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'athlete.blocked@test.com');

-- 5. Seed 30+ days of training data for adult athlete
-- Use: database/seed-qb-annual-program-corrected.sql or manual entries
```

### Email Setup Verification

- [ ] Supabase email templates configured
- [ ] SMTP service working
- [ ] Check spam folder during test

---

## 90-Minute Test Session Plan

### Time-Boxed Flow Summary

| Time      | Tier       | Tests                     | Focus Area                  |
| --------- | ---------- | ------------------------- | --------------------------- |
| 0-5 min   | Setup      | Account verification      | Prerequisites               |
| 5-20 min  | **Tier 1** | Auth + Consent Blocking   | Security/Privacy (BLOCKERS) |
| 20-35 min | **Tier 1** | Deletion + RLS            | GDPR Compliance (BLOCKERS)  |
| 35-50 min | **Tier 2** | Dashboard + ACWR          | Core Workflows              |
| 50-65 min | **Tier 2** | Privacy Settings + Export | GDPR Features               |
| 65-80 min | **Tier 3** | Team Sharing + Forms      | Medium Priority             |
| 80-90 min | **Tier 4** | Exploratory               | Nice-to-Have                |

---

## TIER 1: CRITICAL WORKFLOWS (30 minutes)

> **BLOCKER bugs found here = NO FRIDAY LAUNCH**

---

### Test 1.1: Authentication Flow (5 minutes)

**Priority:** BLOCKER  
**Files:** `angular/src/app/features/auth/login/login.component.ts`, `auth.service.ts`

**Steps:**

1. Navigate to `/login`
2. Enter invalid email format: `test@` → Submit
3. Enter valid email, short password: `123` → Submit
4. Enter valid credentials: `athlete.adult@test.com` / `TestAthlete123!`
5. Click "Sign In"
6. Observe redirect

**Pass Criteria:**

- ✅ Form validates email format before submission
- ✅ Form validates password length (8+ chars)
- ✅ Password field is masked (type="password")
- ✅ Error toast displays for invalid credentials
- ✅ Successful login redirects to `/dashboard`
- ✅ User name displays in header after login
- ✅ Session persists on page refresh

**Fail Criteria:**

- ❌ Form accepts malformed email
- ❌ Form accepts password < 8 chars
- ❌ Password visible in plain text
- ❌ Redirect loops on successful login
- ❌ Session not persisted on page refresh

**Bug Severity if Failed:** **BLOCKER**

---

### Test 1.2: Consent Blocking AI Features (8 minutes)

**Priority:** BLOCKER (GDPR Article 22 Violation Risk)  
**Files:** `privacy-settings.service.ts`, `ai-chat.service.ts`

**Setup:** Login as `athlete.adult@test.com` (AI consent = FALSE)

**Steps:**

1. Navigate to `/chat` (AI Chat page)
2. Attempt to send message: "How can I improve my speed?"
3. Navigate to `/training`
4. Look for any AI-powered recommendations or suggestions
5. Open DevTools → Network tab
6. Refresh page, filter for requests to `/api/ai/*` or `/functions/v1/ai-*`

**Pass Criteria:**

- ✅ Chat page shows consent prompt: "Enable AI to get personalized coaching"
- ✅ Chat input is disabled or hidden until consent granted
- ✅ Training page shows manual templates only (no AI suggestions)
- ✅ **ZERO network requests** to AI endpoints without consent
- ✅ "Enable AI Features" CTA visible, links to `/settings/privacy`

**Fail Criteria:**

- ❌ AI chat responds despite consent = FALSE
- ❌ AI suggestions appear on training page
- ❌ Network tab shows API calls to AI endpoints
- ❌ No opt-in prompt visible

**Expected UI State - AI Disabled:**

```
┌─────────────────────────────────────────────┐
│  🤖 AI Features Disabled                     │
│                                              │
│  You have opted out of AI-powered analysis   │
│  and recommendations.                        │
│                                              │
│  Enable AI processing in Privacy Settings    │
│  to receive personalized insights.           │
│                                              │
│  [Go to Privacy Settings]                    │
└─────────────────────────────────────────────┘
```

**Bug Severity if Failed:** **BLOCKER** (GDPR violation)

---

### Test 1.3: Account Deletion Grace Period (7 minutes)

**Priority:** BLOCKER (GDPR Article 17)  
**Files:** `account-deletion.service.ts`, `privacy-controls.component.ts`

**Setup:** Login as `athlete.new@test.com`

**Steps:**

1. Navigate to `/settings/privacy`
2. Scroll to "Your Data Rights" section
3. Click "Delete" button
4. Observe confirmation dialog
5. Type `DELETE` in confirmation field
6. Click "Delete My Account"
7. Observe response (toast, banner)
8. Log out
9. Attempt to log back in with same credentials
10. If login succeeds, check for deletion warning banner
11. Click "Cancel Deletion" if visible

**Pass Criteria:**

- ✅ Confirmation dialog requires typing `DELETE`
- ✅ Dialog shows: "Your data will be permanently deleted after the 30-day grace period"
- ✅ Dialog shows: "You can cancel this request anytime before then"
- ✅ Success toast: "Account deletion requested"
- ✅ User can still login during grace period
- ✅ Dashboard shows warning: "Deletion scheduled in X days"
- ✅ "Cancel Deletion" button visible and functional
- ✅ Canceling removes warning and restores account

**Fail Criteria:**

- ❌ Account deleted immediately (no grace period)
- ❌ User cannot login after deletion request
- ❌ No deletion warning visible after login
- ❌ "Cancel Deletion" button missing or broken
- ❌ Cancellation doesn't restore account

**Expected UI State - Deletion Pending:**

```
┌─────────────────────────────────────────────┐
│  ⏳ Deletion Pending                         │
│                                              │
│  Your account is scheduled for deletion      │
│  in 28 days.                                 │
│                                              │
│  Cancel the deletion request to keep your    │
│  account and all your data.                  │
│                                              │
│  [Cancel Deletion]                           │
└─────────────────────────────────────────────┘
```

**Bug Severity if Failed:** **BLOCKER** (GDPR violation)

---

### Test 1.4: RLS Policy - Coach Cannot Access Unshared Data (10 minutes)

**Priority:** BLOCKER (Data Breach Risk)  
**Files:** `database/supabase-rls-policies.sql`, `coach-dashboard.component.ts`

**Setup:**

- Login as `coach.friday@test.com`
- Ensure `athlete.blocked@test.com` has team sharing disabled

**Steps:**

1. Navigate to `/coach/dashboard`
2. View team roster showing both athletes
3. Observe how blocked athlete appears in roster
4. Click on blocked athlete's row
5. Check what data is visible vs hidden
6. Open DevTools → Console
7. Run direct Supabase query (if accessible):
   ```javascript
   const { data, error } = await supabase
     .from("training_sessions")
     .select("*")
     .eq("user_id", "<blocked_athlete_user_id>");
   console.log("Data:", data, "Error:", error);
   ```

**Pass Criteria:**

- ✅ Roster shows blocked athlete with "Private" tag
- ✅ Performance metrics show `—` (dash) for blocked athlete
- ✅ Partial data notice appears: "Some Players Have Not Shared Data"
- ✅ "Request data sharing" button visible for blocked athlete
- ✅ Direct query returns empty result OR RLS error
- ✅ Coach CANNOT see: workout logs, wellness data, health records

**Fail Criteria:**

- ❌ Coach sees blocked athlete's actual data
- ❌ Direct query returns data
- ❌ No indication that data is restricted
- ❌ No "partial data" notice when some athletes blocked

**Expected UI State - Consent Blocked (Coach View):**

```
┌─────────────────────────────────────────────────────────────────┐
│  ℹ️  Some Players Have Not Shared Data                          │
│                                                                  │
│  Not all team members have enabled performance data sharing.     │
│  Players can choose to share their data in Privacy Settings.    │
│                                                                  │
│  [Learn More]                                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Player         │ Pos │ Perf │ ACWR │ Ready │ Status  │ Actions │
├─────────────────┼─────┼──────┼──────┼───────┼─────────┼─────────┤
│  Adult Athlete  │ QB  │ 85%  │ 1.12 │  78   │ Active  │ 👁️ 📊  │
│  🔒 Blocked     │ WR  │  —   │  —   │   —   │ Private │ ✉️      │
└─────────────────────────────────────────────────────────────────┘
```

**Bug Severity if Failed:** **BLOCKER** (GDPR violation, data breach)

---

## TIER 2: HIGH PRIORITY (25 minutes)

---

### Test 2.1: Dashboard Role-Based Routing (3 minutes)

**Priority:** HIGH  
**Files:** `dashboard.component.ts`, `app.routes.ts`

**Steps:**

1. Login as `coach.friday@test.com` → Navigate to `/dashboard`
2. Observe redirect destination
3. Logout
4. Login as `athlete.adult@test.com` → Navigate to `/dashboard`
5. Observe redirect destination

**Pass Criteria:**

- ✅ Coach redirects to `/coach/dashboard`
- ✅ Athlete stays on `/dashboard` (athlete dashboard)
- ✅ No infinite redirect loops
- ✅ Correct header/title for each role

**Fail Criteria:**

- ❌ Coach sees athlete dashboard
- ❌ Athlete sees coach dashboard
- ❌ Redirect loop (check console)

---

### Test 2.2: ACWR Calculation with Sufficient Data (5 minutes)

**Priority:** HIGH (Injury Prevention Feature)  
**Files:** `acwr.service.ts`, `acwr-dashboard.component.ts`

**Setup:** Login as `athlete.adult@test.com` (30+ days training data)

**Steps:**

1. Navigate to `/acwr`
2. Observe ACWR chart and metrics
3. Check injury risk indicator color
4. Hover over data points on chart

**Pass Criteria:**

- ✅ ACWR chart displays with line graph
- ✅ Current ACWR ratio shown (e.g., "1.12")
- ✅ Risk zone indicator correct:
  - 🟢 Green: 0.80 - 1.30 (Sweet Spot)
  - 🟡 Yellow: 1.30 - 1.50 (Elevated)
  - 🔴 Red: > 1.50 (Danger) or < 0.80 (Under-training)
- ✅ Tooltip shows date and exact value on hover
- ✅ Acute/Chronic load values displayed

**Fail Criteria:**

- ❌ Chart shows "No data" despite seeded data
- ❌ ACWR calculation incorrect
- ❌ Risk indicator wrong color for value
- ❌ Chart crashes or shows error

---

### Test 2.3: ACWR with Insufficient Data (3 minutes)

**Priority:** HIGH  
**Files:** Same as 2.2

**Setup:** Login as `athlete.new@test.com` (no training data)

**Steps:**

1. Navigate to `/acwr`
2. Observe UI state

**Pass Criteria:**

- ✅ Message: "Building Your Profile" or "Not enough data"
- ✅ Subtext: "We need more training data to provide reliable metrics"
- ✅ CTA button: "Log Training" or similar
- ✅ No chart crash or null errors
- ✅ Data quality indicator shows "Insufficient"

**Expected UI State - Insufficient Data:**

```
┌─────────────────────────────────────────────┐
│  📈 Building Your Profile                    │
│                                              │
│  We need more training data to provide       │
│  reliable metrics.                           │
│                                              │
│  Continue logging sessions. Most metrics     │
│  need 2-4 weeks of data.                     │
│                                              │
│  ACWR requires 28 days of training data.     │
│                                              │
│  [Log Today's Training]                      │
└─────────────────────────────────────────────┘
```

**Fail Criteria:**

- ❌ Chart crashes with null error
- ❌ Chart shows 0 values or broken visualization
- ❌ No helpful message for user

---

### Test 2.4: Privacy Settings UI & Persistence (7 minutes)

**Priority:** HIGH  
**Files:** `privacy-controls.component.ts`, `privacy-settings.service.ts`

**Setup:** Login as `athlete.adult@test.com`

**Steps:**

1. Navigate to `/settings/privacy`
2. Verify current state: AI Processing = OFF
3. Toggle "AI-Powered Recommendations" to ON
4. Observe any confirmation or immediate save
5. Refresh page
6. Verify toggle is still ON
7. Navigate to `/chat`
8. Verify AI chat is now accessible
9. Return to `/settings/privacy`
10. Toggle "Research Participation" to ON
11. Toggle "Marketing Communications" to OFF
12. Refresh and verify persistence

**Pass Criteria:**

- ✅ All toggles functional with smooth animation
- ✅ Changes save immediately (no explicit save button needed)
- ✅ Success toast: "Privacy settings updated"
- ✅ Settings persist after page refresh
- ✅ AI features unlock after enabling AI consent
- ✅ Consent dates show: "Status: Enabled" with date
- ✅ No console errors during save

**Fail Criteria:**

- ❌ Toggles don't save
- ❌ Page refresh resets toggles
- ❌ AI features still blocked after enabling
- ❌ Error toast on save

---

### Test 2.5: Data Export Functionality (5 minutes)

**Priority:** HIGH (GDPR Article 20)  
**Files:** `data-export.service.ts`

**Setup:** Login as `athlete.adult@test.com`

**Steps:**

1. Navigate to `/settings/privacy`
2. Scroll to "Your Data Rights" section
3. Click "Export" button
4. Observe progress indicator
5. Wait for download to complete
6. Open downloaded file
7. Verify JSON structure

**Pass Criteria:**

- ✅ Export button shows progress: "Gathering profile...", "Gathering training...", etc.
- ✅ Progress bar fills during export
- ✅ File downloads successfully
- ✅ File is valid JSON
- ✅ File includes: `export_metadata`, `profile`, `training_sessions`, `wellness_entries`
- ✅ File does NOT include other users' data

**Fail Criteria:**

- ❌ Export fails or times out
- ❌ Downloaded file is empty or corrupted
- ❌ File missing expected data categories
- ❌ File includes other users' data

---

### Test 2.6: Registration Age Verification (2 minutes)

**Priority:** HIGH  
**Files:** `register.component.ts`

**Steps:**

1. Navigate to `/register`
2. Fill all fields with valid data
3. Leave "I confirm I am 16 years or older" unchecked
4. Attempt to submit
5. Check checkbox and submit

**Pass Criteria:**

- ✅ Submit button disabled until age checkbox checked
- ✅ Error message: "You must be 16 or older to use this app"
- ✅ Terms checkbox also required
- ✅ Form submits only when both checkboxes checked

**Fail Criteria:**

- ❌ Form submits without age verification
- ❌ No error message shown

---

## TIER 3: MEDIUM PRIORITY (15 minutes)

---

### Test 3.1: Team Sharing Restrictions (5 minutes)

**Priority:** MEDIUM  
**Files:** `privacy-settings.service.ts`, `team-statistics.service.ts`

**Setup:** Login as `athlete.adult@test.com`

**Steps:**

1. Navigate to `/settings/privacy`
2. Scroll to "Team Data Sharing" section
3. If team exists, expand team accordion
4. Enable "Performance Data" sharing
5. Disable "Health Data" sharing
6. Select specific metrics to share
7. Save settings
8. Logout, login as `coach.friday@test.com`
9. Navigate to `/coach/dashboard`
10. View `athlete.adult@test.com` details
11. Verify which metrics are visible

**Pass Criteria:**

- ✅ Coach sees performance metrics that were enabled
- ✅ Coach sees placeholder for health data: "Not shared by athlete"
- ✅ Metric category filter enforced correctly
- ✅ Changes reflect immediately for coach

**Fail Criteria:**

- ❌ Coach sees health data despite setting disabled
- ❌ Coach sees all metrics regardless of settings
- ❌ No placeholder message for restricted data

---

### Test 3.2: Training Page Navigation (3 minutes)

**Priority:** MEDIUM  
**Files:** `training.component.ts`

**Setup:** Login as `athlete.adult@test.com`

**Steps:**

1. Navigate to `/training`
2. Verify training hub loads
3. Click through available sections
4. Return to dashboard via navigation

**Pass Criteria:**

- ✅ Training page loads without errors
- ✅ All navigation links work
- ✅ No dead-end states
- ✅ Can return to dashboard

**Fail Criteria:**

- ❌ Page crashes
- ❌ Navigation links broken
- ❌ Cannot escape page

---

### Test 3.3: Form Validation - Registration (3 minutes)

**Priority:** MEDIUM  
**Files:** `register.component.ts`

**Steps:**

1. Navigate to `/register`
2. Test invalid inputs:
   - Email: `test@` (invalid format)
   - Password: `123` (too short)
   - Password: `password` (no uppercase/number/special)
   - Confirm Password: mismatch
3. Observe validation errors
4. Correct all fields
5. Submit form

**Pass Criteria:**

- ✅ Email validation: "Invalid email format"
- ✅ Password validation: "Password must be at least 8 characters"
- ✅ Password pattern: "include uppercase, lowercase, number, and special character"
- ✅ Mismatch: "Passwords do not match"
- ✅ Submit button disabled until valid
- ✅ Form submits with valid data

**Fail Criteria:**

- ❌ Form accepts invalid email
- ❌ Form accepts weak password
- ❌ Form submits with mismatched passwords
- ❌ No validation error messages

---

### Test 3.4: Wellness Check-in (2 minutes)

**Priority:** MEDIUM  
**Files:** `wellness.component.ts`

**Setup:** Login as `athlete.adult@test.com`

**Steps:**

1. Navigate to `/wellness`
2. Fill in wellness check-in form
3. Submit
4. Verify entry appears in history

**Pass Criteria:**

- ✅ Form submits successfully
- ✅ Success toast: "Wellness logged"
- ✅ Entry appears in history
- ✅ Readiness score updates

**Fail Criteria:**

- ❌ Form doesn't submit
- ❌ Entry not saved
- ❌ No feedback to user

---

### Test 3.5: Analytics with Insufficient Data (2 minutes)

**Priority:** MEDIUM  
**Files:** `analytics.component.ts`

**Setup:** Login as `athlete.new@test.com` (no data)

**Steps:**

1. Navigate to `/analytics`
2. Observe charts and metrics

**Pass Criteria:**

- ✅ Charts show placeholder: "Not enough data"
- ✅ Helpful message displayed
- ✅ CTA: "Log Training" button
- ✅ No chart crashes

**Fail Criteria:**

- ❌ Charts crash with errors
- ❌ Empty axes or broken visualization
- ❌ No helpful message

---

## TIER 4: NICE-TO-HAVE (10 minutes)

---

### Test 4.1: Mobile Responsiveness (3 minutes)

**Priority:** LOW

**Steps:**

1. Open DevTools → Mobile view (iPhone 12)
2. Navigate through: `/dashboard`, `/training`, `/settings/privacy`
3. Test touch interactions

**Pass Criteria:**

- ✅ Layout adapts to mobile
- ✅ Navigation accessible
- ✅ Forms usable
- ✅ No horizontal scroll

---

### Test 4.2: Chat Page (2 minutes)

**Priority:** LOW

**Setup:** Login as `athlete.adult@test.com` (with AI consent ON)

**Steps:**

1. Navigate to `/chat`
2. Send message: "Test message"
3. Observe response

**Pass Criteria:**

- ✅ Message sends
- ✅ Response appears
- ✅ No errors

---

### Test 4.3: Community Page (2 minutes)

**Priority:** LOW

**Steps:**

1. Navigate to `/community`
2. View feed
3. Interact with posts

**Pass Criteria:**

- ✅ Feed loads
- ✅ Interactions work
- ✅ No errors

---

### Test 4.4: Profile Page (3 minutes)

**Priority:** LOW

**Steps:**

1. Navigate to `/profile`
2. Edit profile fields
3. Save changes
4. Refresh and verify

**Pass Criteria:**

- ✅ Profile loads
- ✅ Changes save
- ✅ Changes persist

---

## Expected UI States Reference

### Consent Blocked State (User View)

```
Title: Your Data is Private
Reason: Your performance data is not currently shared with your team coaches.
Action: Enable sharing in Privacy Settings to let coaches see your progress.
Icon: 🛡️ (pi-shield)
Severity: info
```

### AI Disabled State

```
Title: AI Features Disabled
Reason: You have opted out of AI-powered analysis and recommendations.
Action: Enable AI processing in Privacy Settings to receive personalized insights.
Icon: 🤖 (pi-microchip-ai)
Severity: info
```

### Deletion Pending State

```
Title: Deletion Pending
Reason: Your account is scheduled for deletion in {X} days.
Action: Cancel the deletion request to keep your account and all your data.
Icon: ⏳ (pi-hourglass)
Severity: warning
```

### Insufficient Data State

```
Title: Building Your Profile
Reason: We need more training data to provide reliable metrics.
Action: Continue logging sessions. Most metrics need 2-4 weeks of data.
Icon: 📈 (pi-chart-line)
Severity: info
```

### No Data State

```
Title: No Data Yet
Reason: We don't have any training data for you yet.
Action: Start logging your training sessions to see metrics and insights.
Icon: 💾 (pi-database)
Severity: info
```

---

## Post-Test Checklist

After completing 90-minute session:

- [ ] All TIER 1 tests completed (30 min)
- [ ] All TIER 2 tests completed (25 min)
- [ ] At least 50% of TIER 3 tests completed (10+ min)
- [ ] Bug reports filed for all failures (use BUG_REPORT_TEMPLATE.md)
- [ ] Severity assigned to each bug
- [ ] Screenshots captured for visual bugs
- [ ] Console logs saved for errors
- [ ] Network activity recorded for API failures

---

## Success Criteria for Friday Launch

### ✅ READY TO SHIP if:

- All TIER 1 tests pass (0 blockers)
- All TIER 2 tests pass OR have documented workarounds
- No GDPR violations detected
- No security vulnerabilities found
- Core user journeys completable end-to-end

### ❌ NOT READY if:

- Any TIER 1 test fails
- GDPR consent violations detected
- RLS policies can be bypassed
- Account deletion doesn't work correctly
- Users cannot complete: registration → training → analytics journey

---

**END OF TEST PLAN**

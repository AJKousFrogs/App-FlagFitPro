# Friday Test Plan - FlagFit Pro
**Date:** 2025-12-30
**Session Duration:** 90 minutes
**Focus:** Maximize defect discovery in critical workflows

---

## Pre-Test Setup (10 minutes)

### Test Accounts to Create

Create the following accounts in your Supabase database:

1. **Coach Account**
   - Email: `coach.friday@test.com`
   - Password: `TestCoach123!`
   - Role: `coach`
   - Name: `Test Coach`
   - Date of Birth: `1985-06-15`

2. **Adult Athlete Account (Rich Data)**
   - Email: `athlete.adult@test.com`
   - Password: `TestAthlete123!`
   - Role: `athlete`
   - Name: `Adult Athlete`
   - Date of Birth: `1995-03-20`
   - **Pre-seed:** 30+ days of training sessions, wellness logs, game stats

3. **New Athlete Account (No Data)**
   - Email: `athlete.new@test.com`
   - Password: `TestNew123!`
   - Role: `athlete`
   - Name: `New Athlete`
   - Date of Birth: `2000-08-10`
   - **Pre-seed:** None (brand new account)

4. **Minor Athlete Account (Age 15)**
   - Email: `athlete.minor@test.com`
   - Password: `TestMinor123!`
   - Role: `athlete`
   - Name: `Minor Athlete`
   - Date of Birth: `2010-01-15` (15 years old)
   - **Pre-seed:** None

5. **Guardian Account**
   - Email: `guardian.friday@test.com`
   - Password: `TestGuardian123!`
   - Role: `guardian`
   - Name: `Test Guardian`

### Database Prerequisites

Run these SQL commands in Supabase SQL Editor:

```sql
-- Create team for coach
INSERT INTO teams (id, name, coach_id, sport, division)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Friday Test Team',
  (SELECT id FROM auth.users WHERE email = 'coach.friday@test.com'),
  'flag_football',
  'olympic'
);

-- Add adult athlete to team
INSERT INTO team_members (team_id, user_id, role, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM auth.users WHERE email = 'athlete.adult@test.com'),
  'player',
  'active'
);

-- Seed 30 days of training data for adult athlete
-- (Use seeding script or manually create entries in:
--  training_sessions, wellness_logs, game_stats)

-- Set AI consent to FALSE for adult athlete
UPDATE privacy_settings
SET ai_processing_enabled = false, ai_processing_consent_date = NULL
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'athlete.adult@test.com');
```

### Email Setup

- Ensure Supabase email templates are configured
- Verify SMTP or email service is working
- Check spam folder during test

---

## 90-Minute Test Session Plan

### TIER 1: CRITICAL WORKFLOWS (30 minutes)

These tests validate security, privacy, and core functionality.

---

#### Test 1.1: Authentication Flow (5 minutes)
**Priority:** BLOCKER
**File:** `angular/src/app/features/auth/login/login.component.ts`

**Steps:**
1. Navigate to `/login`
2. Enter valid credentials: `athlete.adult@test.com` / `TestAthlete123!`
3. Click "Sign In"
4. Observe redirect to dashboard

**Pass Criteria:**
- ✅ Login form validates email format before submission
- ✅ Password field is masked (type="password")
- ✅ Error message displays for invalid credentials
- ✅ Successful login redirects to `/dashboard` (role-based routing)
- ✅ User name displays in header after login

**Fail Criteria:**
- ❌ Form accepts malformed email (`test@`, `@test.com`)
- ❌ Password visible in plain text
- ❌ Redirect loops on successful login
- ❌ Session not persisted on page refresh

**Expected UI States:**
- Loading state during authentication
- Error toast for failed login
- Success redirect with smooth transition

---

#### Test 1.2: Consent Blocking AI Features (8 minutes)
**Priority:** BLOCKER (GDPR Violation Risk)
**File:** `angular/src/app/core/services/privacy-settings.service.ts:127`

**Setup:**
- Login as `athlete.adult@test.com` (AI consent = FALSE in DB)

**Steps:**
1. Navigate to `/training/ai-scheduler`
2. Check if AI suggestions appear
3. Navigate to `/training`
4. Look for AI-powered recommendations
5. Open browser DevTools → Network tab
6. Refresh page and filter for requests to `/api/training/suggestions`

**Pass Criteria:**
- ✅ AI scheduler shows opt-in prompt: "Enable AI to get personalized suggestions"
- ✅ No AI suggestions visible on training page
- ✅ **NO network requests** to `/api/training/suggestions` or `/api/ai/*`
- ✅ "Enable AI Features" button visible in privacy settings

**Fail Criteria:**
- ❌ AI suggestions appear despite consent = FALSE
- ❌ Network tab shows API calls to AI endpoints
- ❌ AI features accessible without consent prompt

**What to Log if Failed:**
- Screenshot of AI content appearing
- Network tab screenshot showing unauthorized API call
- Console errors (if any)

**Bug Severity if Failed:** **BLOCKER** (GDPR Article 22 violation)

---

#### Test 1.3: Account Deletion Grace Period (7 minutes)
**Priority:** BLOCKER (GDPR Article 17)
**File:** `netlify/functions/account-deletion.cjs:113`

**Setup:**
- Login as `athlete.new@test.com`

**Steps:**
1. Navigate to `/settings/privacy`
2. Scroll to "Delete Account" section
3. Click "Request Account Deletion"
4. Observe confirmation dialog requiring `confirmDelete: true`
5. Confirm deletion request
6. Check response for `daysRemaining` and `scheduledDeletionDate`
7. Log out
8. Attempt to log back in with same credentials
9. If login succeeds, check for deletion warning banner

**Pass Criteria:**
- ✅ Confirmation dialog appears with warning text
- ✅ Deletion requires explicit confirmation checkbox
- ✅ Response includes `daysRemaining: 30` and future `scheduledDeletionDate`
- ✅ After deletion request, user can still login
- ✅ Dashboard shows prominent warning: "Account deletion scheduled for [DATE]"
- ✅ "Cancel Deletion" button visible and functional
- ✅ Clicking "Cancel Deletion" removes warning and restores account

**Fail Criteria:**
- ❌ Account deleted immediately without grace period
- ❌ User cannot login after deletion request
- ❌ No deletion warning visible after login
- ❌ "Cancel Deletion" button missing or non-functional

**Expected UI States:**
- Warning banner: Red/orange alert at top of dashboard
- Countdown: "Your account will be deleted in 30 days"
- Cancel button: Prominent, easily accessible

**Bug Severity if Failed:** **BLOCKER** (GDPR compliance)

---

#### Test 1.4: RLS Policy - Coach Cannot Access Unshared Data (10 minutes)
**Priority:** BLOCKER (Data Breach Risk)
**File:** `database/supabase-rls-policies.sql:200+`

**Setup:**
- Login as `coach.friday@test.com`
- Ensure `athlete.adult@test.com` has `aiProcessingEnabled = false` and team sharing disabled

**Steps:**
1. Navigate to `/coach/dashboard`
2. View roster showing `athlete.adult@test.com`
3. Click on athlete's profile/details
4. Attempt to view performance metrics
5. Open browser DevTools → Console
6. Run query in Supabase client (if accessible):
   ```javascript
   const { data, error } = await supabase
     .from('workout_logs')
     .select('*')
     .eq('user_id', '<athlete_adult_user_id>');
   console.log(data, error);
   ```

**Pass Criteria:**
- ✅ Coach sees "Data Sharing Disabled" message
- ✅ Performance metrics show placeholder: "Athlete has not shared this data"
- ✅ No actual workout/wellness data visible
- ✅ Direct query returns error: "RLS policy violation" or empty result

**Fail Criteria:**
- ❌ Coach sees athlete's workout logs, wellness data, or performance metrics
- ❌ Direct query returns actual data
- ❌ No message explaining why data is unavailable

**Expected UI States:**
- Consent blocked: Lock icon + "Request Access" button
- Placeholder charts: Gray boxes with "No Data Shared"

**Bug Severity if Failed:** **BLOCKER** (GDPR violation, data breach)

---

### TIER 2: HIGH PRIORITY (25 minutes)

---

#### Test 2.1: Dashboard Role-Based Routing (3 minutes)
**Priority:** HIGH
**File:** `angular/src/app/features/dashboard/dashboard.component.ts:26`

**Steps:**
1. Login as `coach.friday@test.com`
2. Navigate to `/dashboard`
3. Observe redirect
4. Logout
5. Login as `athlete.adult@test.com`
6. Navigate to `/dashboard`
7. Observe redirect

**Pass Criteria:**
- ✅ Coach redirects to `/coach/dashboard`
- ✅ Athlete redirects to athlete-specific dashboard
- ✅ No infinite redirect loops
- ✅ Correct header title for each role

**Fail Criteria:**
- ❌ Coach sees athlete dashboard
- ❌ Athlete sees coach dashboard
- ❌ Redirect loop (check console for errors)

---

#### Test 2.2: Training Program Creation & Assignment (7 minutes)
**Priority:** HIGH
**File:** `angular/src/app/features/training/*`

**Setup:**
- Login as `coach.friday@test.com`

**Steps:**
1. Navigate to `/training/periodization`
2. Click "Create New Program"
3. Fill in program details:
   - Name: "Friday Test Program"
   - Start Date: Today
   - End Date: +12 weeks
   - Position: "WR"
4. Click "Create Program"
5. Add training phase:
   - Phase Name: "Foundation"
   - Duration: 4 weeks
   - Load Percentage: 20%
6. Add training week to phase
7. Add training session:
   - Day: Monday
   - Session Type: "Speed"
   - Duration: 45 minutes
   - Exercises: Select 3 exercises from library
8. Assign program to `athlete.adult@test.com`
9. Logout and login as `athlete.adult@test.com`
10. Navigate to `/training/schedule`
11. Check if assigned program appears

**Pass Criteria:**
- ✅ Program created successfully
- ✅ Phases, weeks, sessions saved correctly
- ✅ Athlete sees assigned program in schedule
- ✅ Athlete can view session details
- ✅ Load percentage calculates correctly

**Fail Criteria:**
- ❌ Program not saved
- ❌ Athlete doesn't see assignment
- ❌ Load percentage incorrect or missing

---

#### Test 2.3: ACWR Calculation with Sufficient Data (5 minutes)
**Priority:** HIGH (Injury Prevention Feature)
**File:** `angular/src/app/core/services/acwr.service.ts`

**Setup:**
- Login as `athlete.adult@test.com` (should have 30+ days of training data)

**Steps:**
1. Navigate to `/acwr`
2. Observe ACWR chart and metrics
3. Check for injury risk indicator
4. Hover over data points on chart

**Pass Criteria:**
- ✅ ACWR chart displays with line graph
- ✅ Current ACWR ratio shown (e.g., "1.2")
- ✅ Injury risk indicator: Green (0.8-1.3), Yellow (1.3-1.5), Red (>1.5 or <0.8)
- ✅ Tooltip shows date and exact value on hover
- ✅ "Last 7 days" and "Last 4 weeks" averages displayed

**Fail Criteria:**
- ❌ Chart shows "No data" despite seeded data
- ❌ ACWR calculation incorrect (ratio should be acute/chronic)
- ❌ Injury risk indicator wrong color
- ❌ Chart crashes or shows error

---

#### Test 2.4: ACWR with Insufficient Data (3 minutes)
**Priority:** HIGH
**File:** Same as 2.3

**Setup:**
- Login as `athlete.new@test.com` (no training data)

**Steps:**
1. Navigate to `/acwr`
2. Observe UI state

**Pass Criteria:**
- ✅ Message: "Not enough data to calculate ACWR"
- ✅ Subtext: "Log at least 28 days of training to see injury risk analysis"
- ✅ Call-to-action button: "Log Today's Training"
- ✅ No chart visible or placeholder chart shown

**Fail Criteria:**
- ❌ Chart crashes with null error
- ❌ Chart shows incorrect data (0 values)
- ❌ No helpful message displayed

---

#### Test 2.5: Privacy Settings UI & API (5 minutes)
**Priority:** HIGH
**File:** `angular/src/app/features/settings/privacy-controls/privacy-controls.component.ts`

**Setup:**
- Login as `athlete.adult@test.com`

**Steps:**
1. Navigate to `/settings/privacy`
2. Toggle "Enable AI Processing" to ON
3. Click "Save Changes"
4. Refresh page
5. Verify toggle is still ON
6. Navigate to `/training/ai-scheduler`
7. Check if AI suggestions now appear
8. Return to `/settings/privacy`
9. Toggle "Research Opt-In" to ON
10. Toggle "Marketing Communications" to OFF
11. Click "Save Changes"

**Pass Criteria:**
- ✅ All toggles functional (smooth animation)
- ✅ Save shows success toast: "Privacy settings updated"
- ✅ Settings persist after page refresh
- ✅ AI features unlock after enabling AI consent
- ✅ Consent dates show: "Consented on [DATE]"
- ✅ No save errors or console errors

**Fail Criteria:**
- ❌ Toggles don't save
- ❌ Page refresh resets toggles
- ❌ AI features still blocked after enabling
- ❌ Error toast on save

---

#### Test 2.6: Data Export Functionality (2 minutes)
**Priority:** HIGH (GDPR Article 20)
**File:** `netlify/functions/data-export.cjs`

**Setup:**
- Login as `athlete.adult@test.com`

**Steps:**
1. Navigate to `/settings/privacy`
2. Scroll to "Data Export" section
3. Select format: JSON
4. Select categories: All
5. Click "Export My Data"
6. Wait for download
7. Open downloaded file
8. Verify contents include userId, timestamp, consent version

**Pass Criteria:**
- ✅ Export initiates and downloads file
- ✅ File format is valid JSON
- ✅ File includes metadata: `userId`, `exportedAt`, `consentVersion`
- ✅ File includes all selected categories (profile, privacy, teams, workouts, wellness, achievements)
- ✅ No sensitive data of other users included

**Fail Criteria:**
- ❌ Export fails or times out
- ❌ Downloaded file is empty or corrupted
- ❌ File missing expected categories
- ❌ File includes other users' data

---

### TIER 3: MEDIUM PRIORITY (20 minutes)

---

#### Test 3.1: Parental Consent Workflow (7 minutes)
**Priority:** MEDIUM
**File:** `angular/src/app/core/services/privacy-settings.service.ts:261-269`

**Setup:**
- Login as `athlete.minor@test.com` (age 15)

**Steps:**
1. Navigate to `/dashboard`
2. Check for parental consent banner
3. Click "Request Parental Consent"
4. Fill in guardian email: `guardian.friday@test.com`
5. Submit request
6. Check guardian's email inbox
7. Logout and login as `guardian.friday@test.com`
8. Click verification link from email
9. Approve consent for all categories
10. Logout and login as `athlete.minor@test.com`
11. Navigate to `/settings/privacy`
12. Verify parental consent status

**Pass Criteria:**
- ✅ Minor account shows parental consent requirement
- ✅ Request form sends email to guardian
- ✅ Guardian can verify and approve consent
- ✅ Minor account unlocks features after approval
- ✅ Consent status shows "Verified on [DATE]" in privacy settings

**Fail Criteria:**
- ❌ Minor can access restricted features without consent
- ❌ Email not sent to guardian
- ❌ Guardian verification doesn't update minor's status
- ❌ Age calculation incorrect (15-year-old treated as adult)

---

#### Test 3.2: Team Sharing Restrictions (5 minutes)
**Priority:** MEDIUM
**File:** `angular/src/app/core/services/privacy-settings.service.ts:610`

**Setup:**
- Login as `athlete.adult@test.com`

**Steps:**
1. Navigate to `/settings/privacy`
2. Scroll to "Team Data Sharing"
3. Enable "Share Performance Data with Coach"
4. Disable "Share Wellness Data with Coach"
5. Select allowed metrics: Only "performance", "training_load"
6. Save settings
7. Logout and login as `coach.friday@test.com`
8. Navigate to `/coach/dashboard`
9. View `athlete.adult@test.com` details
10. Check which metrics are visible

**Pass Criteria:**
- ✅ Coach sees performance and training_load metrics
- ✅ Coach sees placeholder for wellness: "Not shared by athlete"
- ✅ Coach cannot see readiness, injury_history, body_composition
- ✅ Metric category filter enforced in UI and API

**Fail Criteria:**
- ❌ Coach sees wellness data despite setting disabled
- ❌ Coach sees all metrics regardless of allowed categories
- ❌ No placeholder message for restricted data

---

#### Test 3.3: Coach Activity Feed (3 minutes)
**Priority:** MEDIUM
**File:** `angular/src/app/features/dashboard/coach-dashboard.component.ts`

**Setup:**
- Login as `coach.friday@test.com`

**Steps:**
1. Navigate to `/coach/activity`
2. View activity feed
3. Check for recent athlete activities (logged workouts, achievements)
4. Filter by date range
5. Filter by athlete

**Pass Criteria:**
- ✅ Activity feed loads with recent activities
- ✅ Activities show athlete name, action, timestamp
- ✅ Filters work correctly
- ✅ Feed updates when new activity logged

**Fail Criteria:**
- ❌ Feed empty despite athlete activity
- ❌ Filters don't work
- ❌ Feed doesn't update in real-time

---

#### Test 3.4: Form Validation - Registration (3 minutes)
**Priority:** MEDIUM
**File:** `angular/src/app/features/auth/register/register.component.ts`

**Steps:**
1. Navigate to `/register`
2. Test invalid inputs:
   - Email: `test@` (invalid format)
   - Password: `123` (too short)
   - Password Confirm: `456` (mismatch)
   - Name: `` (empty)
3. Submit form and observe validation errors
4. Correct all fields
5. Submit form

**Pass Criteria:**
- ✅ Email validation shows error: "Invalid email format"
- ✅ Password validation shows error: "Password must be at least 8 characters"
- ✅ Password mismatch shows error: "Passwords do not match"
- ✅ Name validation shows error: "Name is required"
- ✅ Submit button disabled until all fields valid
- ✅ Form submits successfully with valid data

**Fail Criteria:**
- ❌ Form accepts invalid email
- ❌ Form accepts weak password
- ❌ Form submits with mismatched passwords
- ❌ No validation error messages displayed

---

#### Test 3.5: Insufficient Data State - Analytics (2 minutes)
**Priority:** MEDIUM
**File:** `angular/src/app/features/analytics/*`

**Setup:**
- Login as `athlete.new@test.com` (no data)

**Steps:**
1. Navigate to `/analytics`
2. Observe charts and metrics
3. Check for helpful messaging

**Pass Criteria:**
- ✅ Charts show placeholder: "Not enough data"
- ✅ Message: "Log at least 7 days of training to see trends"
- ✅ Call-to-action: "Log Training" button
- ✅ No chart crashes or null errors

**Fail Criteria:**
- ❌ Charts crash with console errors
- ❌ Charts show empty axes or broken visualization
- ❌ No helpful message for user

---

### TIER 4: NICE-TO-HAVE (15 minutes)

---

#### Test 4.1: Performance Metrics Visualization (5 minutes)
**Priority:** LOW
**File:** `angular/src/app/features/performance-tracking/*`

**Setup:**
- Login as `athlete.adult@test.com`

**Steps:**
1. Navigate to `/performance-tracking`
2. Select metric: "Speed"
3. Select timeframe: "Last 30 days"
4. View chart

**Pass Criteria:**
- ✅ Chart renders correctly
- ✅ Data points match timeframe
- ✅ Tooltips show correct values
- ✅ Axes labeled correctly

---

#### Test 4.2: Wellness Logging (3 minutes)
**Priority:** LOW

**Setup:**
- Login as `athlete.adult@test.com`

**Steps:**
1. Navigate to `/wellness`
2. Click "Log Today's Wellness"
3. Fill in sleep hours: 8
4. Fill in stress level: 3/10
5. Fill in recovery rating: 7/10
6. Add notes: "Feeling good"
7. Submit

**Pass Criteria:**
- ✅ Form submits successfully
- ✅ Success toast: "Wellness logged"
- ✅ Entry appears in wellness history
- ✅ Readiness score updates

---

#### Test 4.3: Chat Messaging (3 minutes)
**Priority:** LOW

**Setup:**
- Login as `athlete.adult@test.com`

**Steps:**
1. Navigate to `/chat`
2. Select channel or create DM
3. Send message: "Test message"
4. Check if message appears

**Pass Criteria:**
- ✅ Message sends successfully
- ✅ Message appears in chat history
- ✅ Timestamp accurate
- ✅ No consent violations (messages respect privacy settings)

---

#### Test 4.4: Mobile Responsiveness (2 minutes)
**Priority:** LOW

**Steps:**
1. Open browser DevTools
2. Switch to mobile view (iPhone 12)
3. Navigate through major routes:
   - `/dashboard`
   - `/training`
   - `/settings/privacy`
4. Test touch interactions

**Pass Criteria:**
- ✅ Layout adapts to mobile screen
- ✅ Bottom navigation visible
- ✅ Forms usable on mobile
- ✅ No horizontal scroll

---

#### Test 4.5: Community Features (2 minutes)
**Priority:** LOW

**Steps:**
1. Navigate to `/community`
2. View posts feed
3. Like a post
4. Comment on a post

**Pass Criteria:**
- ✅ Feed loads correctly
- ✅ Like and comment interactions work
- ✅ No errors

---

## Post-Test Checklist

After completing 90-minute session:

- [ ] All TIER 1 tests completed (30 min)
- [ ] All TIER 2 tests completed (25 min)
- [ ] At least 50% of TIER 3 tests completed (10+ min)
- [ ] Bug reports filed for all failures (use BUG_REPORT_TEMPLATE.md)
- [ ] Severity assigned to each bug (use triage rubric below)
- [ ] Screenshots captured for visual bugs
- [ ] Console logs saved for errors
- [ ] Network activity recorded for API failures

---

## Triage Rubric: Fix Before Friday vs After

Use this rubric to prioritize bug fixes:

### FIX BEFORE FRIDAY (Ship Blockers)

**Category 1: Security & Privacy Violations**
- ✋ **BLOCKER**: RLS policy bypass (coach sees unshared data)
- ✋ **BLOCKER**: AI features accessible without consent
- ✋ **BLOCKER**: Account deletion doesn't revoke session
- ✋ **BLOCKER**: Parental consent not enforced for minors
- ✋ **BLOCKER**: CSRF protection missing on critical endpoints

**Category 2: Broken Core Workflows**
- ✋ **BLOCKER**: Cannot login with valid credentials
- ✋ **BLOCKER**: Cannot register new account
- ✋ **BLOCKER**: Dashboard infinite redirect loop
- ✋ **BLOCKER**: Account deletion grace period not enforced
- ✋ **BLOCKER**: Privacy settings don't save

**Category 3: Data Integrity Issues**
- ✋ **CRITICAL**: ACWR calculation incorrect
- ✋ **CRITICAL**: Readiness score wrong formula
- ✋ **CRITICAL**: Training load not updating
- ✋ **CRITICAL**: Consent status not persisting

**Category 4: UI Dead Ends**
- ✋ **CRITICAL**: Save button doesn't work (no error, no success)
- ✋ **CRITICAL**: Required form field cannot be filled
- ✋ **CRITICAL**: Modal cannot be closed

---

### FIX AFTER FRIDAY (Post-Launch)

**Category 5: UX Improvements**
- 📅 **Post-Friday**: Chart tooltips not showing
- 📅 **Post-Friday**: Loading spinner too fast/slow
- 📅 **Post-Friday**: Form validation message unclear
- 📅 **Post-Friday**: Mobile layout slightly off

**Category 6: Nice-to-Have Features**
- 📅 **Post-Friday**: Community feed pagination slow
- 📅 **Post-Friday**: Chat message editing
- 📅 **Post-Friday**: Export to CSV (JSON works)

**Category 7: Edge Cases**
- 📅 **Post-Friday**: Performance issue with 1000+ workouts
- 📅 **Post-Friday**: Rare timezone bug in date formatting
- 📅 **Post-Friday**: Very long athlete name wraps poorly

---

## Decision Matrix

When triaging a bug, ask:

1. **Does it violate GDPR/privacy rules?** → FIX NOW (BLOCKER)
2. **Does it prevent core workflow completion?** → FIX NOW (BLOCKER)
3. **Does it cause incorrect calculations affecting safety?** → FIX NOW (CRITICAL)
4. **Does it create a UI dead end (no escape)?** → FIX NOW (CRITICAL)
5. **Does it only affect edge cases or aesthetics?** → FIX AFTER (Post-Friday)

---

## Expected UI States Reference

Use this as a guide for what "correct" looks like:

### Consent Blocked State
- **Visual**: Lock icon, gray disabled state
- **Message**: "Enable AI Processing in Privacy Settings to use this feature"
- **CTA**: "Go to Settings" button

### AI Disabled State
- **Visual**: AI features grayed out or hidden
- **Message**: "AI-powered suggestions are not available"
- **Fallback**: Show manual training templates instead

### Deletion Pending State
- **Visual**: Red/orange warning banner at top
- **Message**: "Your account will be permanently deleted on [DATE]"
- **CTA**: "Cancel Deletion" button (prominent)
- **Restrictions**: User can still view data, cannot create new content

### Insufficient Data State
- **Visual**: Placeholder chart with dotted lines
- **Message**: "Not enough data to calculate [METRIC]. Log at least [X days] to see analysis."
- **CTA**: "Log [Activity]" button

### New User State
- **Visual**: Friendly onboarding UI
- **Message**: "Welcome! Let's get you started."
- **CTA**: "Complete Profile" or "Log First Training" buttons
- **No Errors**: Should not show "No data" errors, instead show encouragement

---

## Time-Boxed Flow Summary (90 minutes)

| Time | Tier | Tests | Focus Area |
|------|------|-------|------------|
| 0-5 min | Setup | Account creation | Prerequisites |
| 5-15 min | Tier 1 | Auth + Consent | Security |
| 15-22 min | Tier 1 | Deletion + RLS | Privacy |
| 22-30 min | Tier 1 | Review & Log | Critical bugs |
| 30-42 min | Tier 2 | Dashboard + Training | Core workflows |
| 42-50 min | Tier 2 | ACWR + Privacy UI | Calculations |
| 50-55 min | Tier 2 | Data Export | GDPR compliance |
| 55-70 min | Tier 3 | Parental + Team Sharing | Medium priority |
| 70-75 min | Tier 3 | Forms + Validation | Quality checks |
| 75-90 min | Tier 4 | Optional exploratory | Nice-to-have |

**Total:** 90 minutes structured testing

---

## Success Criteria for Friday Launch

The app is **READY TO SHIP** if:

- ✅ All TIER 1 tests pass (0 blockers)
- ✅ All TIER 2 tests pass OR have documented workarounds
- ✅ No GDPR violations detected
- ✅ No security vulnerabilities found
- ✅ Core user journeys completable end-to-end

The app is **NOT READY** if:

- ❌ Any TIER 1 test fails
- ❌ GDPR consent violations detected
- ❌ RLS policies can be bypassed
- ❌ Account deletion doesn't work correctly
- ❌ Users cannot complete registration → training → analytics journey

---

## Contact for Issues During Test

- **Technical Questions**: Check codebase comments or migration files
- **Database Issues**: Use Supabase dashboard SQL editor
- **Email Testing**: Check spam folder, verify SMTP config
- **Auth Issues**: Check Supabase Auth dashboard for user status

---

**END OF TEST PLAN**

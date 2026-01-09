# Manual Testing Guide: Auth & Logging Verification

**Date**: January 9, 2026  
**Testing Person**: [Your Name]  
**Environment**: Local Development (`http://localhost:4200`)

---

## Pre-Test Setup

### 1. Start Development Server

```bash
# Terminal 1: Start API server
npm run dev:api

# Terminal 2: Start Angular dev server
npm run dev:angular

# Wait for both servers to be ready:
# - API: http://localhost:8888
# - Angular: http://localhost:4200
```

### 2. Verify Supabase Connection

```bash
# Check environment variables
node -e "console.log(process.env.SUPABASE_URL)"
node -e "console.log(process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')"

# Both should return valid values
```

### 3. Prepare Test Users

Create test users in Supabase Dashboard:

**Player Account**:
- Email: `test-player@flagfitpro.com`
- Password: `TestPlayer123!`
- Role: `player`
- Confirm email (or disable email confirmation in Supabase settings)

**Organizer Account**:
- Email: `test-organizer@flagfitpro.com`
- Password: `TestOrganizer123!`
- Role: `organizer`

---

## Test Execution

### ✅ TEST 1: Magic Link Delivery (Desktop)

**Objective**: Verify magic link authentication flow

**Steps**:
1. Navigate to `http://localhost:4200/login`
2. Look for "Magic Link" or "Send Email Link" option
3. Enter email: `test-player@flagfitpro.com`
4. Click "Send Magic Link"

**Verification**:
- [ ] Toast notification: "Check your email for magic link"
- [ ] No errors in browser console
- [ ] Navigate to Supabase Dashboard → Authentication → Logs
- [ ] Find "magic_link" event for test-player email
- [ ] Copy magic link URL from logs (if email not configured)

**Click Magic Link**:
1. Paste URL in browser (or click from email)
2. Should redirect to `/auth/callback` with tokens in URL hash
3. Verify URL contains: `access_token=...&refresh_token=...&type=magiclink`

**Expected Result**:
- [ ] `AuthCallbackComponent` displays "Signing you in..."
- [ ] Console log: `[Auth] Session established successfully`
- [ ] Redirect to `/dashboard` after ~1.5 seconds
- [ ] Toast: "Signed in successfully!"
- [ ] User menu shows logged-in state
- [ ] `currentUser()` signal populated (check DevTools → Components)

**Result**: PASS / FAIL / SKIP  
**Notes**: _______________________________________________

---

### ✅ TEST 2: Magic Link Delivery (Mobile)

**Objective**: Verify magic link flow on mobile viewport

**Steps**:
1. Open Chrome DevTools (Cmd+Option+I / Ctrl+Shift+I)
2. Click "Toggle device toolbar" (Cmd+Shift+M / Ctrl+Shift+M)
3. Select "iPhone 12" (390 × 844)
4. Repeat TEST 1 steps

**Verification**:
- [ ] Login page is responsive (buttons not cut off)
- [ ] Email input is usable (no zoom issues)
- [ ] Magic link button is tappable (>44px touch target)
- [ ] Toast notifications visible on mobile
- [ ] Auth callback page responsive

**Also test on**:
- [ ] Pixel 5 (393 × 851)
- [ ] iPad (768 × 1024)

**Result**: PASS / FAIL / SKIP  
**Notes**: _______________________________________________

---

### ✅ TEST 3: Password Login (Desktop)

**Objective**: Verify traditional email/password login

**Steps**:
1. Navigate to `http://localhost:4200/login`
2. Enter email: `test-player@flagfitpro.com`
3. Enter password: `TestPlayer123!`
4. Check "Remember me" checkbox
5. Click "Sign In"

**Verification**:
- [ ] Form validation works (try invalid email first)
- [ ] Password field is masked (type="password")
- [ ] Submit button disabled when form invalid
- [ ] Loading spinner shown during submission
- [ ] Successful login shows toast
- [ ] Redirect to `/dashboard`
- [ ] Check localStorage for Supabase session:
  ```javascript
  // In browser console:
  JSON.parse(localStorage.getItem('sb-[project-id]-auth-token'))
  // Should show: { access_token, refresh_token, expires_at, ... }
  ```

**Result**: PASS / FAIL / SKIP  
**Notes**: _______________________________________________

---

### ✅ TEST 4: Registration Flow

**Objective**: Verify new user registration

**Steps**:
1. Navigate to `http://localhost:4200/register`
2. Fill form:
   - Full Name: `Test User [timestamp]`
   - Email: `testuser-[timestamp]@test.com`
   - Password: `SecurePass123!`
   - Confirm Password: `SecurePass123!`
   - Role: `Player`
3. Click "Create Account"

**Verification**:
- [ ] Password strength indicator shows strength
- [ ] Password confirmation validates match
- [ ] Email format validated
- [ ] Submit button disabled until form valid
- [ ] Toast: "Please check your email to verify your account"
- [ ] User created in Supabase (check auth.users table)
- [ ] Email confirmation sent (check Supabase logs)

**Result**: PASS / FAIL / SKIP  
**Notes**: _______________________________________________

---

### ✅ TEST 5: Session Persistence

**Objective**: Verify session persists across page refreshes

**Steps**:
1. Login as `test-player@flagfitpro.com`
2. Verify logged in (see user menu)
3. **Close browser tab** (not entire browser)
4. **Reopen new tab** to `http://localhost:4200`
5. Navigate to dashboard

**Verification**:
- [ ] User still logged in (no redirect to /login)
- [ ] User menu shows correct name
- [ ] Dashboard loads without auth prompt
- [ ] Console log: `[Supabase] User signed in` (from cached session)
- [ ] `localStorage` still has valid session token

**Result**: PASS / FAIL / SKIP  
**Notes**: _______________________________________________

---

### ✅ TEST 6: Token Refresh (Automatic)

**Objective**: Verify Supabase auto-refreshes tokens before expiry

**Note**: This test requires waiting ~55 minutes or mocking time

**Steps**:
1. Login as test user
2. Open browser console
3. Run:
   ```javascript
   const { data: { session } } = await supabase.auth.getSession()
   console.log('Expires at:', new Date(session.expires_at * 1000))
   console.log('In:', Math.floor((session.expires_at * 1000 - Date.now()) / 60000), 'minutes')
   ```
4. Wait for ~55 minutes (or until 5 minutes before expiry)
5. Make an API call (navigate to analytics page)

**Verification**:
- [ ] Before expiry, console logs: `[Supabase] Session token refreshed automatically`
- [ ] No logout or auth error
- [ ] User can continue working seamlessly
- [ ] New expiry time extended by 1 hour

**Alternative Quick Test**:
1. Manually set session expiry to near future in localStorage
2. Trigger a Supabase call
3. Verify refresh happens

**Result**: PASS / FAIL / SKIP  
**Notes**: _______________________________________________

---

### ✅ TEST 7: Session Timeout (Invalid Token)

**Objective**: Verify handling of expired/invalid session

**Steps**:
1. Login as test user
2. Open browser console
3. Clear session:
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   ```
4. Try to navigate to `/dashboard`

**Verification**:
- [ ] Redirected to `/login`
- [ ] URL contains `returnUrl` parameter: `/login?returnUrl=%2Fdashboard`
- [ ] No error thrown in console
- [ ] User can login again successfully
- [ ] After login, redirected to original destination (dashboard)

**Result**: PASS / FAIL / SKIP  
**Notes**: _______________________________________________

---

### ✅ TEST 8: Role-Based Access - Player

**Objective**: Verify player role permissions

**Steps**:
1. Login as `test-player@flagfitpro.com`
2. Try to access each route below

**Can Access** (should load successfully):
- [ ] `/dashboard` - Player dashboard
- [ ] `/training/log` - Log training session
- [ ] `/analytics` - View analytics
- [ ] `/profile` - Edit profile
- [ ] `/ai-coach` - Chat with AI

**Cannot Access** (should redirect to /login or /unauthorized):
- [ ] `/organizer/teams` - Organizer-only route
- [ ] `/organizer/events` - Organizer-only route
- [ ] `/coach/inbox` - Coach-only route
- [ ] `/admin/users` - Admin-only route

**Verification**:
```javascript
// In browser console:
const user = authService.getUser()
console.log('Role:', user.role) // Should be "player"
```

**Result**: PASS / FAIL / SKIP  
**Notes**: _______________________________________________

---

### ✅ TEST 9: Role-Based Access - Organizer

**Objective**: Verify organizer role permissions

**Steps**:
1. Logout current user
2. Login as `test-organizer@flagfitpro.com`
3. Try to access each route below

**Can Access**:
- [ ] `/dashboard` - Organizer dashboard
- [ ] `/organizer/teams` - Manage teams
- [ ] `/organizer/events` - Create events
- [ ] `/analytics` - View team analytics

**Cannot Access**:
- [ ] `/training/log` - Players only
- [ ] `/coach/inbox` - Coaches only
- [ ] `/admin/users` - Admins only

**Verification**:
```javascript
// In browser console:
const user = authService.getUser()
console.log('Role:', user.role) // Should be "organizer"
```

**Result**: PASS / FAIL / SKIP  
**Notes**: _______________________________________________

---

### ✅ TEST 10-19: Manual Log Entries (10 Sessions)

**Objective**: Create 10 training log entries end-to-end

**User**: `test-player@flagfitpro.com`  
**Dates**: January 3-12, 2026

For each entry below, follow these steps:

#### Log Entry Steps:
1. Navigate to `/training/log`
2. Fill form with data below
3. Click "Log Session"
4. Verify:
   - [ ] Calculated load shows: `duration × RPE = load AU`
   - [ ] Form submits without errors
   - [ ] Toast: "Session logged successfully!"
   - [ ] Redirect to `/dashboard`
   - [ ] New session appears in dashboard list
   - [ ] ACWR updates (if visible)

---

#### Entry 1: Practice Session
- **Date**: 2026-01-03
- **Type**: Practice
- **Duration**: 90 minutes
- **RPE**: 6
- **Sprint Reps**: 15
- **Cutting Movements**: 30
- **Notes**: "Team practice, moderate intensity"
- **Expected Load**: 90 × 6 = **540 AU**

**Result**: PASS / FAIL  
**Actual Load Calculated**: _____ AU  
**Session ID in DB**: _____________

---

#### Entry 2: Strength Training
- **Date**: 2026-01-04
- **Type**: Strength
- **Duration**: 60 minutes
- **RPE**: 7
- **Jump Count**: 20
- **Notes**: "Lower body focus - squats and plyos"
- **Expected Load**: 60 × 7 = **420 AU**

**Result**: PASS / FAIL  
**Actual Load**: _____ AU

---

#### Entry 3: Game Day
- **Date**: 2026-01-05
- **Type**: Game
- **Duration**: 120 minutes
- **RPE**: 9
- **Sprint Reps**: 25
- **Cutting Movements**: 50
- **Throw Count**: 5
- **Notes**: "Championship game - high intensity"
- **Expected Load**: 120 × 9 = **1080 AU**

**Result**: PASS / FAIL  
**Actual Load**: _____ AU

---

#### Entry 4: Recovery Session
- **Date**: 2026-01-06
- **Type**: Recovery
- **Duration**: 30 minutes
- **RPE**: 3
- **Notes**: "Light stretching and mobility"
- **Expected Load**: 30 × 3 = **90 AU**

**Result**: PASS / FAIL  
**Actual Load**: _____ AU

---

#### Entry 5: Speed Work
- **Date**: 2026-01-07
- **Type**: Speed
- **Duration**: 45 minutes
- **RPE**: 8
- **Sprint Reps**: 20
- **Notes**: "40-yard dash drills, acceleration work"
- **Expected Load**: 45 × 8 = **360 AU**

**Result**: PASS / FAIL  
**Actual Load**: _____ AU

---

#### Entry 6: Skills Practice
- **Date**: 2026-01-08
- **Type**: Skills
- **Duration**: 60 minutes
- **RPE**: 5
- **Cutting Movements**: 25
- **Notes**: "Route running, agility ladder"
- **Expected Load**: 60 × 5 = **300 AU**

**Result**: PASS / FAIL  
**Actual Load**: _____ AU

---

#### Entry 7: Full Practice
- **Date**: 2026-01-09
- **Type**: Practice
- **Duration**: 90 minutes
- **RPE**: 7
- **Sprint Reps**: 18
- **Cutting Movements**: 35
- **Jump Count**: 15
- **Notes**: "Full team scrimmage"
- **Expected Load**: 90 × 7 = **630 AU**

**Result**: PASS / FAIL  
**Actual Load**: _____ AU

---

#### Entry 8: Gym Session
- **Date**: 2026-01-10
- **Type**: Strength
- **Duration**: 75 minutes
- **RPE**: 8
- **Jump Count**: 30
- **Notes**: "Upper body + explosive power"
- **Expected Load**: 75 × 8 = **600 AU**

**Result**: PASS / FAIL  
**Actual Load**: _____ AU

---

#### Entry 9: Light Practice
- **Date**: 2026-01-11
- **Type**: Practice
- **Duration**: 60 minutes
- **RPE**: 5
- **Sprint Reps**: 10
- **Notes**: "Walkthrough, low intensity"
- **Expected Load**: 60 × 5 = **300 AU**

**Result**: PASS / FAIL  
**Actual Load**: _____ AU

---

#### Entry 10: Game Preparation
- **Date**: 2026-01-12
- **Type**: Skills
- **Duration**: 45 minutes
- **RPE**: 6
- **Cutting Movements**: 20
- **Notes**: "Pre-game warmup and drills"
- **Expected Load**: 45 × 6 = **270 AU**

**Result**: PASS / FAIL  
**Actual Load**: _____ AU

---

### Data Integrity Verification

After completing all 10 entries, verify data in Supabase:

**SQL Query**:
```sql
SELECT 
  session_date,
  session_type,
  duration_minutes,
  rpe,
  training_load,
  created_at
FROM training_sessions
WHERE user_id = '[YOUR-USER-ID]'
  AND session_date >= '2026-01-03'
  AND session_date <= '2026-01-12'
ORDER BY session_date ASC;
```

**Verification Checklist**:
- [ ] 10 rows returned
- [ ] All dates correct (2026-01-03 to 2026-01-12)
- [ ] All session types correct
- [ ] No NULL values in required fields
- [ ] `training_load = duration_minutes * rpe` for all rows
- [ ] Total training load: **4590 AU**

**Calculation Check**:
```
540 + 420 + 1080 + 90 + 360 + 300 + 630 + 600 + 300 + 270 = 4590 AU
```

**Result**: PASS / FAIL  
**Total Load in DB**: _____ AU  
**Notes**: _______________________________________________

---

### ✅ TEST 20: ACWR Calculation Updates

**Objective**: Verify ACWR updates correctly with new training loads

**Steps**:
1. After logging all 10 entries, navigate to `/dashboard` or `/analytics`
2. Find ACWR display

**Verification**:
- [ ] ACWR ratio displayed (e.g., "1.2")
- [ ] Acute load (7-day) includes recent sessions
- [ ] Chronic load (28-day) calculated
- [ ] Risk zone indicator shows color:
  - Green: 0.8 - 1.3 (optimal)
  - Yellow: 1.3 - 1.5 (caution)
  - Red: > 1.5 or < 0.8 (high risk)

**Manual Calculation**:
```
Acute Load (7-day):
Jan 6-12 sessions: 90 + 360 + 300 + 630 + 600 + 300 + 270 = 2550 AU

Chronic Load (28-day):
If first-time logging: same as acute
Else: Average of last 28 days

ACWR = Acute / Chronic
```

**Result**: PASS / FAIL  
**ACWR Value**: _____  
**Risk Zone**: GREEN / YELLOW / RED  
**Notes**: _______________________________________________

---

## Test Summary

**Total Tests**: 20  
**Passed**: _____  
**Failed**: _____  
**Skipped**: _____  

**Success Rate**: _____%

**Critical Issues Found**: ___ (describe below)

---

**Issues**:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Notes**:
_______________________________________________
_______________________________________________
_______________________________________________

**Tested By**: _____________  
**Date**: _____________  
**Sign-off**: _____________

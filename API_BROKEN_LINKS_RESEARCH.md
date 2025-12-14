# API Broken Links and Logger Issues - Detailed Research Report

## Executive Summary

**Date:** December 13, 2025
**Status:** 🔴 CRITICAL - Authentication Mismatch Detected

The application is experiencing **401 Unauthorized errors** on two critical API endpoints. The root cause is an **authentication system mismatch** between the frontend (using Supabase JWT tokens) and the backend Netlify functions (expecting custom JWT tokens).

---

## 1. Broken API Endpoints

### 1.1 `/auth-me` Endpoint
- **URL:** `https://webflagfootballfrogs.netlify.app/.netlify/functions/auth-me`
- **Status:** 401 (Unauthorized)
- **Error:** "Invalid or expired token"
- **Called By:**
  - `src/auth-manager.js:250` (during token validation)
  - `src/auth-manager.js:61` (during initialization)
- **Function File:** `netlify/functions/auth-me.cjs`

### 1.2 `/notifications-count` Endpoint
- **URL:** `https://webflagfootballfrogs.netlify.app/.netlify/functions/notifications-count`
- **Status:** 401 (Unauthorized)
- **Error:** "Authentication required"
- **Called By:**
  - `src/js/pages/dashboard-page.js:244` (NotificationStore.refreshBadge)
  - `src/js/pages/dashboard-page.js:441` (DashboardPage.refreshBadge)
  - `src/components/organisms/top-bar/top-bar.js:59` (top bar badge)
- **Function File:** `netlify/functions/notifications-count.cjs`

---

## 2. Root Cause Analysis

### 2.1 Authentication System Mismatch

**Frontend (Client-Side):**
```javascript
// src/auth-manager.js:306-332
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// Stores SUPABASE JWT token
this.token = data.session.access_token;  // ⚠️ Supabase-signed JWT
await secureStorage.setAuthToken(this.token);
```

**Backend (Netlify Functions):**
```javascript
// netlify/functions/auth-me.cjs:58
const jwtValidation = validateJWT(event, jwt, JWT_SECRET);  // ⚠️ Expects custom JWT_SECRET

// netlify/functions/notifications-count.cjs:56
decoded = jwt.verify(token, JWT_SECRET);  // ⚠️ Expects custom JWT_SECRET
```

**The Problem:**
- Frontend sends: **Supabase JWT** (signed by Supabase with their secret)
- Backend expects: **Custom JWT** (signed with `JWT_SECRET` environment variable)
- Result: Token verification fails → 401 Unauthorized

### 2.2 Token Flow Diagram

```
User Login
    ↓
Supabase.auth.signInWithPassword()
    ↓
Returns: { session: { access_token: "supabase-jwt-token" } }
    ↓
Frontend stores token
    ↓
API requests sent with: Authorization: Bearer supabase-jwt-token
    ↓
Backend tries: jwt.verify(token, JWT_SECRET)
    ↓
❌ FAILS - Token signed by Supabase, not JWT_SECRET
    ↓
401 Unauthorized Response
```

---

## 3. Affected Code Locations

### 3.1 Frontend Files

| File | Line | Issue | Impact |
|------|------|-------|--------|
| `src/auth-manager.js` | 61 | Calls `validateStoredToken()` on init | Logs 401 error on page load |
| `src/auth-manager.js` | 250 | Calls `auth.getCurrentUser()` | Token validation fails |
| `src/auth-manager.js` | 332 | Stores Supabase token | Wrong token type stored |
| `src/api-config.js` | 562 | Defines `getCurrentUser()` | Maps to broken endpoint |
| `src/api-config.js` | 582 | Defines `getNotificationCount()` | Maps to broken endpoint |
| `dashboard-page.js` | 244, 441 | Calls `refreshBadge()` | Notification count fails |
| `top-bar.js` | 59 | Calls notifications-count | Badge doesn't update |

### 3.2 Backend Files (Netlify Functions)

| File | Line | Issue | Fix Needed |
|------|------|-------|------------|
| `auth-me.cjs` | 58 | Uses `validateJWT(event, jwt, JWT_SECRET)` | ✅ Use Supabase token verification |
| `auth-me.cjs` | 17-23 | Expects `JWT_SECRET` env var | ✅ Use Supabase service key |
| `notifications-count.cjs` | 56 | Uses `jwt.verify(token, JWT_SECRET)` | ✅ Use Supabase token verification |
| `notifications-count.cjs` | 15-21 | Expects `JWT_SECRET` env var | ✅ Use Supabase service key |

---

## 4. Logger Issues

### 4.1 Error Logging Locations

| File | Line | Logger Call | Message |
|------|------|-------------|---------|
| `logger.js` | 67 | `console.error()` | "❌ [ERROR] API request failed: /notifications-count" |
| `logger.js` | 67 | `console.error()` | "❌ [ERROR] API request failed: /auth-me" |
| `api-config.js` | 320-327 | Throws error | "Invalid or expired token" |

### 4.2 Logger Behavior

The logger itself is **functioning correctly**. It's properly capturing and displaying:
- Error messages (line 67 in logger.js)
- Stack traces
- Request details

**The issue is NOT the logger** - it's correctly reporting the authentication failures.

---

## 5. Environment Configuration Issues

### 5.1 Missing/Incorrect Environment Variables

**Current Setup:**
```env
# What's being used:
JWT_SECRET=some-custom-secret  # ❌ Not compatible with Supabase tokens

# What's needed:
SUPABASE_URL=https://pvziciccwxgftcielknm.supabase.co  # ✅ Already set
SUPABASE_SERVICE_KEY=your-service-role-key  # ⚠️ Needed for token verification
```

### 5.2 Token Verification Options

**Option 1: Use Supabase Admin SDK** (Recommended)
```javascript
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // Service role key
);

// Verify token
const { data: { user }, error } = await supabase.auth.getUser(token);
```

**Option 2: Manually verify Supabase JWT**
```javascript
const { data: { user }, error } = await supabase.auth.getUser(authToken);
if (error || !user) {
  return 401 Unauthorized
}
```

---

## 6. Complete List of API Endpoints

### 6.1 Broken Endpoints (Require Fixes)

| Endpoint | Status | Issue | Priority |
|----------|--------|-------|----------|
| `/auth-me` | 🔴 401 | Auth mismatch | Critical |
| `/notifications-count` | 🔴 401 | Auth mismatch | Critical |

### 6.2 Working Endpoints (No Issues)

| Endpoint | Status | Verification |
|----------|--------|--------------|
| `/team-invite` | ✅ Working | Uses Supabase auth correctly |
| `/validate-invitation` | ✅ Working | Uses Supabase auth correctly |
| `/accept-invitation` | ✅ Working | Uses Supabase auth correctly |

### 6.3 Endpoints to Audit (Potential Issues)

Based on the pattern, these functions may have the same JWT_SECRET issue:

| File | Likely Issue |
|------|--------------|
| `analytics.cjs` | May use JWT_SECRET |
| `dashboard.cjs` | May use JWT_SECRET |
| `performance-metrics.cjs` | May use JWT_SECRET |
| `training-sessions.cjs` | May use JWT_SECRET |
| `community.cjs` | May use JWT_SECRET |
| `tournaments.cjs` | May use JWT_SECRET |
| `notifications.cjs` | May use JWT_SECRET |
| `notifications-create.cjs` | May use JWT_SECRET |
| `notifications-preferences.cjs` | May use JWT_SECRET |

**Recommendation:** Audit all Netlify functions for `JWT_SECRET` usage and replace with Supabase authentication.

---

## 7. Detailed Solution Steps

### Step 1: Update `auth-me.cjs`

**Current Code (Lines 50-62):**
```javascript
const JWT_SECRET = getJWTSecret();
const jwtValidation = validateJWT(event, jwt, JWT_SECRET);
if (!jwtValidation.success) {
  return jwtValidation.error;
}
const { decoded } = jwtValidation;
```

**Fixed Code:**
```javascript
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Get auth header
const authHeader = event.headers.authorization || event.headers.Authorization;
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return {
    statusCode: 401,
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: false, error: 'Authentication required' })
  };
}

const token = authHeader.substring(7);

// Verify with Supabase
const { data: { user }, error: authError } = await supabase.auth.getUser(token);

if (authError || !user) {
  return {
    statusCode: 401,
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: false, error: 'Invalid or expired token' })
  };
}

// Now 'user' contains the authenticated user
```

### Step 2: Update `notifications-count.cjs`

**Current Code (Lines 40-60):**
```javascript
const JWT_SECRET = getJWTSecret();
const authHeader = event.headers.authorization || event.headers.Authorization;

if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return createErrorResponse("Authentication required", 401, 'unauthorized');
}

const token = authHeader.substring(7);
let decoded;
let userId = null;

try {
  decoded = jwt.verify(token, JWT_SECRET);  // ❌ Wrong verification
  userId = decoded.userId;
} catch (jwtError) {
  return createErrorResponse("Invalid or expired token", 401, 'unauthorized');
}
```

**Fixed Code:**
```javascript
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const authHeader = event.headers.authorization || event.headers.Authorization;

if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return createErrorResponse("Authentication required", 401, 'unauthorized');
}

const token = authHeader.substring(7);

// Verify with Supabase
const { data: { user }, error: authError } = await supabase.auth.getUser(token);

if (authError || !user) {
  return createErrorResponse("Invalid or expired token", 401, 'unauthorized');
}

const userId = user.id;  // ✅ Get user ID from Supabase user object
```

### Step 3: Update Environment Variables

Add to `.env` and Netlify environment:
```env
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
```

**How to get the service key:**
1. Go to Supabase Dashboard → Settings → API
2. Copy the `service_role` key (NOT the `anon` key)
3. Add to Netlify: Site Settings → Environment Variables

---

## 8. Testing Checklist

After fixes are applied:

- [ ] Test `/auth-me` endpoint
  - [ ] With valid Supabase token → Should return user data
  - [ ] With no token → Should return 401
  - [ ] With invalid token → Should return 401

- [ ] Test `/notifications-count` endpoint
  - [ ] With valid Supabase token → Should return count
  - [ ] With no token → Should return 401
  - [ ] With invalid token → Should return 401

- [ ] Test dashboard page
  - [ ] Notification badge updates
  - [ ] No 401 errors in console
  - [ ] User data loads correctly

- [ ] Test auth flow
  - [ ] Login works
  - [ ] Token validation succeeds
  - [ ] Page loads without errors

---

## 9. Impact Assessment

### 9.1 User-Facing Impact

| Feature | Impact | Severity |
|---------|--------|----------|
| User authentication | ⚠️ Works but logs errors | Medium |
| Notification badge | ❌ Doesn't update | High |
| Dashboard loading | ⚠️ Partially broken | High |
| Team invitations | ✅ No impact | None |

### 9.2 Developer Experience Impact

| Issue | Impact |
|-------|--------|
| Console errors | Clutters logs, makes debugging harder |
| Authentication confusion | Developers unsure which auth system to use |
| Mixed patterns | Some functions use Supabase, others use JWT_SECRET |

---

## 10. Recommendations

### 10.1 Immediate Actions (Critical)

1. ✅ **Fix `auth-me.cjs`** - Switch to Supabase authentication
2. ✅ **Fix `notifications-count.cjs`** - Switch to Supabase authentication
3. ✅ **Add `SUPABASE_SERVICE_KEY`** to environment variables
4. ✅ **Test authentication flow** end-to-end

### 10.2 Short-term Actions (High Priority)

1. 🔍 **Audit all Netlify functions** for `JWT_SECRET` usage
2. 🔄 **Standardize on Supabase auth** across all functions
3. 📝 **Update documentation** to reflect Supabase-only auth
4. 🧪 **Add integration tests** for authentication

### 10.3 Long-term Actions (Medium Priority)

1. 🏗️ **Create auth utility** module for Netlify functions
2. 📊 **Set up error monitoring** for 401 errors
3. 🔐 **Implement token refresh** mechanism
4. 📖 **Document authentication patterns** for new developers

---

## 11. Related Files

### Files That Need Changes
- `netlify/functions/auth-me.cjs` ⚠️
- `netlify/functions/notifications-count.cjs` ⚠️
- Any other function using `JWT_SECRET` ⚠️

### Files That Are Correct
- `src/auth-manager.js` ✅ (Already uses Supabase)
- `src/api-config.js` ✅ (Correctly sends tokens)
- `netlify/functions/team-invite.cjs` ✅ (Uses Supabase auth)
- `netlify/functions/validate-invitation.cjs` ✅ (Uses Supabase auth)
- `netlify/functions/accept-invitation.cjs` ✅ (Uses Supabase auth)

---

## 12. Summary

**Root Cause:** Authentication system mismatch
**Affected Endpoints:** 2 confirmed, potentially more
**Fix Complexity:** Medium (requires code changes + env vars)
**Estimated Time:** 2-4 hours for full fix and testing

**Next Steps:**
1. Update the two broken Netlify functions
2. Add SUPABASE_SERVICE_KEY environment variable
3. Test thoroughly
4. Audit remaining functions
5. Document the standard authentication pattern

---

**Report Generated:** December 13, 2025
**Version:** 1.0
**Status:** Ready for Implementation

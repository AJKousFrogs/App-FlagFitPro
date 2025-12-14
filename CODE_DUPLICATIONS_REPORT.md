# Code Duplications Report

**Date:** 2025-12-14
**Status:** Analysis Complete

## Executive Summary

This report identifies significant code duplications across the codebase. Eliminating these duplications will:
- Reduce maintenance burden
- Improve code consistency
- Reduce bundle size
- Make bug fixes easier (fix once, not 20+ times)
- Follow DRY (Don't Repeat Yourself) principle

**Total Duplications Found:** 12 major patterns
**Estimated Lines of Duplicate Code:** 500+ lines
**Priority:** High (affects maintainability and security)

---

## Critical Duplications (High Priority)

### 1. `getJWTSecret()` Function - Duplicated in 24+ Files

**Severity:** CRITICAL - Security & Maintainability Issue

**Duplicate Code:**
```javascript
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("CRITICAL: JWT_SECRET environment variable is not set!");
    throw new Error("JWT_SECRET environment variable is required for security");
  }
  return secret;
};
```

**Files Affected (24+):**
- netlify/functions/performance-heatmap.cjs:18
- netlify/functions/performance-metrics.cjs:18
- netlify/functions/training-sessions.cjs:19
- netlify/functions/notifications-preferences.cjs:15
- netlify/functions/notifications.cjs:17
- netlify/functions/analytics.cjs:19
- netlify/functions/performance-data.js:17
- netlify/functions/tournaments.cjs:18
- netlify/functions/notifications-create.cjs:15
- Plus 15+ more files...

**Issue:**
- This is DEPRECATED authentication - should use Supabase auth from auth-helper.cjs
- 24+ files still using old JWT_SECRET instead of migrated Supabase authentication
- Security risk: Inconsistent authentication across the application

**Solution:**
Replace all instances with Supabase authentication:
```javascript
const { authenticateRequest } = require("./utils/auth-helper.cjs");

// In handler:
const auth = await authenticateRequest(event);
if (!auth.success) return auth.error;
const userId = auth.user.id;
```

**Impact:** Critical - Affects security, consistency, and 24+ files

---

### 2. `getSupabaseClient()` Function - Duplicated in 6 Files

**Severity:** HIGH - Already have centralized version

**Duplicate Code:**
```javascript
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase configuration");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}
```

**Files Affected:**
- netlify/functions/auth-me.cjs:14-23
- netlify/functions/validate-invitation.cjs:12-21
- netlify/functions/accept-invitation.cjs
- netlify/functions/team-invite.cjs
- netlify/functions/notifications-count.cjs
- netlify/functions/utils/auth-helper.cjs (CORRECT ONE)

**Issue:**
- We already have this centralized in `auth-helper.cjs`
- 5 files duplicating this logic unnecessarily

**Solution:**
Import from auth-helper.cjs:
```javascript
const { getSupabaseClient } = require("./utils/auth-helper.cjs");
```

Note: auth-helper.cjs currently doesn't export this function, but should.

**Fix Required:**
1. Export `getSupabaseClient` from auth-helper.cjs
2. Replace all 5 duplicates with import

**Impact:** Moderate - Affects 5 files, easy to fix

---

### 3. `createSuccessResponse()` & `createErrorResponse()` - Duplicated in 4 Files

**Severity:** HIGH - Already have centralized version

**Duplicate Code:**
```javascript
// user-profile.cjs:39-49
function createSuccessResponse(data) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify({ success: true, data }),
  };
}

// user-profile.cjs:52-62
function createErrorResponse(message, statusCode = 400) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify({ success: false, error: message }),
  };
}
```

**Files Affected:**
- netlify/functions/user-profile.cjs:39-62 (24 lines)
- netlify/functions/user-context.cjs:39-62 (24 lines)
- netlify/functions/update-chatbot-stats.cjs
- netlify/functions/utils/error-handler.cjs (CORRECT ONE - already imported by 30+ files!)

**Issue:**
- We already have this centralized in `error-handler.cjs`
- 3 files duplicating this logic unnecessarily
- Different CORS headers in duplicates vs centralized version

**Solution:**
Replace with imports from error-handler.cjs:
```javascript
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
```

**Impact:** Moderate - Affects 3 files, 48+ lines of duplicate code

---

### 4. `getUserFromToken()` - EXACT Duplicate in 2 Files

**Severity:** HIGH - Completely identical code

**Duplicate Code (user-profile.cjs:19-36 and user-context.cjs:19-36):**
```javascript
async function getUserFromToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    return user;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}
```

**Files Affected:**
- netlify/functions/user-profile.cjs:19-36 (18 lines)
- netlify/functions/user-context.cjs:19-36 (18 lines)

**Issue:**
- EXACTLY the same function in both files
- Should use `authenticateRequest()` from auth-helper.cjs instead

**Solution:**
Replace with:
```javascript
const { authenticateRequest } = require("./utils/auth-helper.cjs");

// In handler:
const auth = await authenticateRequest(event);
if (!auth.success) return auth.error;
const user = auth.user;
```

**Impact:** High - 36 lines of exact duplicate code

---

### 5. `getTimeAgo()` Function - Duplicated in 3 Files

**Severity:** MEDIUM - Similar but slightly different implementations

**Duplicate Code:**
```javascript
// dashboard.cjs:155-168
const getTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  const weeks = Math.floor(diffDays / 7);
  return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
};
```

**Files Affected:**
- netlify/functions/dashboard.cjs:155-168
- netlify/functions/training-stats.cjs:198-213 (similar)
- netlify/functions/supabase-client.cjs:961-978 (similar)

**Issue:**
- 3 different implementations of the same utility function
- Should be centralized in a shared utilities file

**Solution:**
Create `netlify/functions/utils/date-utils.cjs`:
```javascript
function getTimeAgo(date) {
  // ... implementation
}

module.exports = { getTimeAgo };
```

Then import:
```javascript
const { getTimeAgo } = require("./utils/date-utils.cjs");
```

**Impact:** Low-Medium - 40+ lines of duplicate code

---

### 6. PostgreSQL Pool Initialization - Duplicated in 2 Files

**Severity:** MEDIUM - Database connection duplication

**Duplicate Code:**
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
```

**Files Affected:**
- netlify/functions/user-profile.cjs:4,13-16
- netlify/functions/user-context.cjs:4,13-16

**Issue:**
- Both files create their own database pool
- Should use Supabase client instead or share pool

**Solution:**
If Postgres is needed, create shared pool:
```javascript
// utils/database.cjs
const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

module.exports = { getPool };
```

**Impact:** Low - 2 files affected

---

### 7. Supabase Client Initialization - Duplicated in 2 Files

**Severity:** MEDIUM

**Duplicate Code:**
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
```

**Files Affected:**
- netlify/functions/user-profile.cjs:5,8-10
- netlify/functions/user-context.cjs:5,8-10

**Issue:**
- Duplicate Supabase client initialization
- Should use `getSupabaseClient()` from auth-helper.cjs

**Solution:**
```javascript
const { getSupabaseClient } = require("./utils/auth-helper.cjs");
const supabase = getSupabaseClient();
```

**Impact:** Low - 2 files affected

---

## Medium Priority Duplications

### 8. CORS Preflight Handling - Duplicated in 32 Files

**Severity:** MEDIUM - Pattern duplication

**Duplicate Code:**
```javascript
if (event.httpMethod === "OPTIONS") {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
  };
}
```

**Files Affected:** 32+ backend functions

**Issue:**
- Same CORS preflight handling in every function
- Could be centralized in a middleware

**Solution:**
Create middleware:
```javascript
// utils/middleware.cjs
function handleCORS(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
    };
  }
  return null;
}

// In functions:
const corsResponse = handleCORS(event);
if (corsResponse) return corsResponse;
```

**Impact:** Low - Pattern duplication, not critical

---

### 9. `getAllHtmlFiles()` Function - Duplicated in 13 Script Files

**Severity:** LOW - Build scripts only

**Duplicate Code:**
```javascript
function getAllHtmlFiles(dir) {
  let htmlFiles = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      if (item !== 'node_modules' && item !== '.git') {
        htmlFiles = htmlFiles.concat(getAllHtmlFiles(fullPath));
      }
    } else if (item.endsWith('.html')) {
      htmlFiles.push(fullPath);
    }
  }

  return htmlFiles;
}
```

**Files Affected (13):**
- scripts/archive/apply-unified-theme.js
- scripts/archive/fix-icon-styles.js
- scripts/update-footer-component.js
- scripts/archive/fix-dark-mode-text-colors.js
- scripts/archive/update-inline-colors.js
- scripts/archive/update-icons.js
- scripts/archive/update-icon-colors.js
- scripts/archive/replace-non-green-colors.js
- scripts/archive/fix-responsive-design.js
- scripts/archive/fix-design-system-issues.js
- scripts/archive/cleanup-theme-styles.js
- scripts/archive/add-theme-toggle.js
- scripts/audit-design-system.js

**Issue:**
- 13 copies of the exact same utility function
- 10 of these are in archived scripts, but still counted

**Solution:**
Create shared script utility:
```javascript
// scripts/utils/file-utils.js
function getAllHtmlFiles(dir) { ... }
module.exports = { getAllHtmlFiles };
```

**Impact:** Very Low - Only affects build scripts, many are archived

---

### 10. Authorization Header Extraction - Pattern Duplication

**Severity:** MEDIUM

**Duplicate Pattern:**
```javascript
const authHeader = event.headers.authorization || event.headers.Authorization;
```

**Files Affected:** 20+ backend functions

**Issue:**
- Every function has this line
- Should be part of `authenticateRequest()` utility

**Solution:**
The `authenticateRequest()` in auth-helper.cjs already handles this internally, so files using it don't need this line.

**Impact:** Low - Already solved by using authenticateRequest()

---

## Low Priority Duplications

### 11. Method Validation - Pattern Duplication

**Duplicate Pattern:**
```javascript
if (event.httpMethod !== "GET") {
  return {
    statusCode: 405,
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: false, error: "Method not allowed" }),
  };
}
```

**Files Affected:** 15+ backend functions

**Solution:**
Create middleware:
```javascript
function validateMethod(event, allowedMethods) {
  if (!allowedMethods.includes(event.httpMethod)) {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: "Method not allowed" }),
    };
  }
  return null;
}
```

**Impact:** Very Low - Pattern duplication

---

### 12. `checkEnvVars()` Calls - Pattern Duplication

**Duplicate Pattern:**
```javascript
checkEnvVars();
```

**Files Affected:** 24+ backend functions

**Issue:**
- Every function calls `checkEnvVars()` at the start
- Could be part of middleware or handled at module load

**Solution:**
Not really a problem - this is a necessary validation.

**Impact:** None - This is fine as-is

---

## Summary by Severity

### Critical Priority (Fix Immediately)
1. **getJWTSecret()** - 24+ files using deprecated auth ⚠️
   - Action: Migrate to Supabase auth from auth-helper.cjs
   - Estimated Effort: 2-3 hours per file = 48-72 hours total

### High Priority (Fix Soon)
2. **getSupabaseClient()** - 5 duplicate implementations
   - Action: Export from auth-helper.cjs, replace duplicates
   - Estimated Effort: 30 minutes

3. **createSuccessResponse/createErrorResponse** - 3 duplicates
   - Action: Use error-handler.cjs imports
   - Estimated Effort: 15 minutes

4. **getUserFromToken()** - Exact duplicate in 2 files
   - Action: Use authenticateRequest() instead
   - Estimated Effort: 20 minutes

5. **getTimeAgo()** - 3 implementations
   - Action: Create date-utils.cjs, consolidate
   - Estimated Effort: 30 minutes

### Medium Priority (Fix When Convenient)
6. **PostgreSQL Pool** - 2 duplicates
   - Action: Create shared pool or remove
   - Estimated Effort: 20 minutes

7. **Supabase Client Init** - 2 duplicates
   - Action: Use getSupabaseClient()
   - Estimated Effort: 10 minutes

8. **CORS Preflight** - 32 duplicates
   - Action: Consider middleware (optional)
   - Estimated Effort: 1 hour

### Low Priority (Optional)
9. **getAllHtmlFiles()** - 13 duplicates (10 in archive)
   - Action: Create shared script utility
   - Estimated Effort: 30 minutes

10-12. Various pattern duplications
   - Action: Optional refactoring
   - Estimated Effort: Variable

---

## Refactoring Plan

### Phase 1: Critical Fixes (Week 1)
- [ ] Migrate all 24+ files from JWT_SECRET to Supabase auth
- [ ] Test each function after migration
- [ ] Update documentation

### Phase 2: High Priority Consolidation (Week 2)
- [ ] Export getSupabaseClient() from auth-helper.cjs
- [ ] Replace 5 getSupabaseClient() duplicates
- [ ] Replace 3 createSuccessResponse/createErrorResponse duplicates
- [ ] Replace 2 getUserFromToken() duplicates
- [ ] Create date-utils.cjs and consolidate getTimeAgo()
- [ ] Test all affected functions

### Phase 3: Medium Priority Cleanup (Week 3)
- [ ] Consolidate PostgreSQL pool initialization
- [ ] Consolidate Supabase client initialization
- [ ] Consider CORS middleware
- [ ] Test integration

### Phase 4: Low Priority (Optional)
- [ ] Create shared script utilities
- [ ] Refactor pattern duplications
- [ ] Update ESLint to catch future duplications

---

## Estimated Impact

### Lines of Code Reduction
- **Critical Fixes:** ~480 lines (24 files × 20 lines each)
- **High Priority:** ~120 lines
- **Medium Priority:** ~50 lines
- **Total:** ~650 lines of duplicate code

### Benefits
1. **Security:** Consistent authentication across all functions
2. **Maintainability:** Fix bugs in one place, not 20+
3. **Code Quality:** DRY principle compliance
4. **Bundle Size:** Smaller deployment packages
5. **Development Speed:** Reuse instead of rewrite

### Risks
- Breaking changes if not tested properly
- Need comprehensive testing of all affected functions
- May expose bugs that were hidden by duplicates

---

## Testing Strategy

### Unit Tests
- Test auth-helper.cjs functions
- Test error-handler.cjs functions
- Test date-utils.cjs functions

### Integration Tests
- Test each migrated function end-to-end
- Verify authentication works
- Verify error responses are correct
- Verify CORS headers are correct

### Regression Tests
- Test all API endpoints
- Verify no breaking changes
- Check error handling

---

## Conclusion

The codebase has significant code duplication, primarily in authentication logic and utility functions. The most critical issue is the 24+ files still using deprecated JWT_SECRET instead of Supabase authentication.

**Immediate Actions Required:**
1. Migrate all functions to Supabase auth (CRITICAL)
2. Consolidate getSupabaseClient() (HIGH)
3. Remove createSuccessResponse/createErrorResponse duplicates (HIGH)
4. Consolidate getUserFromToken() (HIGH)

**Total Estimated Effort:** 50-75 hours
**Priority:** High - Affects security and maintainability
**Recommended Timeline:** Complete Phase 1-2 within 2 weeks

---

## Files Requiring Immediate Attention

### Still Using JWT_SECRET (24+ files):
1. netlify/functions/performance-heatmap.cjs
2. netlify/functions/performance-metrics.cjs
3. netlify/functions/training-sessions.cjs
4. netlify/functions/notifications-preferences.cjs
5. netlify/functions/notifications.cjs
6. netlify/functions/analytics.cjs
7. netlify/functions/performance-data.js
8. netlify/functions/tournaments.cjs
9. netlify/functions/notifications-create.cjs
10. netlify/functions/training-stats.cjs
11. netlify/functions/training-metrics.cjs
12. netlify/functions/fixtures.cjs
13. netlify/functions/compute-acwr.cjs
14. netlify/functions/calc-readiness.cjs
15. netlify/functions/readiness-history.cjs
16. netlify/functions/trends.cjs
17. netlify/functions/import-open-data.cjs
18. Plus more...

### Have Duplicate Helper Functions:
1. netlify/functions/user-profile.cjs (getUserFromToken, createSuccessResponse, createErrorResponse, Pool, Supabase client)
2. netlify/functions/user-context.cjs (getUserFromToken, createSuccessResponse, createErrorResponse, Pool, Supabase client)
3. netlify/functions/update-chatbot-stats.cjs (createSuccessResponse, createErrorResponse)
4. netlify/functions/auth-me.cjs (getSupabaseClient)
5. netlify/functions/validate-invitation.cjs (getSupabaseClient)
6. netlify/functions/accept-invitation.cjs (getSupabaseClient)
7. netlify/functions/team-invite.cjs (getSupabaseClient)
8. netlify/functions/notifications-count.cjs (getSupabaseClient)

---

**Next Steps:** Start with Phase 1 - migrate JWT_SECRET functions to Supabase auth.

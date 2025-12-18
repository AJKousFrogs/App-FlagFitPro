# Error Handling Implementation Checklist

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: ✅ In Progress

---

## Status Overview

### ✅ Completed
- [x] Backend error handler utility (`netlify/functions/utils/error-handler.cjs`)
- [x] Frontend unified error handler (`src/js/utils/unified-error-handler.js`)
- [x] Documentation (`docs/ERROR_HANDLING_GUIDE.md`)
- [x] `netlify/functions/dashboard.cjs` - **REFERENCE IMPLEMENTATION**
- [x] `netlify/functions/auth-me.cjs` - **REFERENCE IMPLEMENTATION**

### 🔄 Backend Functions Remaining (18+ files)

#### Auth Functions (Partial - need logging added)
- [ ] `auth-login.cjs` - Has rate limiting & CSRF, needs logFunctionCall
- [ ] `auth-register.cjs` - Has rate limiting & CSRF, needs logFunctionCall
- [ ] `auth-reset-password.cjs` - Has rate limiting & CSRF, needs logFunctionCall

#### Data Functions
- [ ] `games.cjs`
- [ ] `tournaments.cjs`
- [ ] `community.cjs`

#### Performance Functions
- [ ] `performance-metrics.cjs`
- [ ] `performance-heatmap.cjs`
- [ ] `performance-data.js`

#### Training Functions
- [ ] `training-sessions.cjs`
- [ ] `training-stats.cjs`

#### Other Functions
- [ ] `analytics.cjs`
- [ ] `notifications.cjs`
- [ ] `knowledge-search.cjs`
- [ ] `load-management.cjs`
- [ ] `cache.cjs` (utility - may not need)
- [ ] `test-email.cjs` (test only)

### 🔄 Frontend Files Remaining (6+ files)

- [ ] `src/js/pages/dashboard-page.js` (1,395 lines - **PRIORITY**)
- [ ] `src/js/pages/training-page.js`
- [ ] `src/js/pages/analytics-page.js`
- [ ] `src/js/pages/chat-page.js`
- [ ] `src/js/pages/exercise-library-page.js`
- [ ] `src/js/pages/game-tracker-page.js`

---

## Backend Implementation Pattern

### Step 1: Add Imports

```javascript
const {
  validateJWT,
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  handleDatabaseError,
  handleValidationError,
  handleNotFoundError,
  handleAuthenticationError,
  handleAuthorizationError,
  logFunctionCall,
  CORS_HEADERS
} = require("./utils/error-handler.cjs");
```

### Step 2: Add Logging at Handler Start

```javascript
exports.handler = async (event, context) => {
  logFunctionCall('FunctionName', event);

  // ... rest of code
}
```

### Step 3: Replace CORS Headers

**Before:**
```javascript
if (event.httpMethod === "OPTIONS") {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  };
}
```

**After:**
```javascript
if (event.httpMethod === "OPTIONS") {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
  };
}
```

### Step 4: Replace JWT Validation

**Before:**
```javascript
const authHeader = event.headers.authorization || event.headers.Authorization;

if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return {
    statusCode: 401,
    headers: { ... },
    body: JSON.stringify({ success: false, error: "No token provided" })
  };
}

const token = authHeader.substring(7);
let decoded;

try {
  decoded = jwt.verify(token, JWT_SECRET);
} catch (jwtError) {
  return {
    statusCode: 401,
    headers: { ... },
    body: JSON.stringify({ success: false, error: "Invalid or expired token" })
  };
}
```

**After:**
```javascript
const jwtValidation = validateJWT(event, jwt, JWT_SECRET);
if (!jwtValidation.success) {
  return jwtValidation.error;
}
const { decoded } = jwtValidation;
```

### Step 5: Replace Success Responses

**Before:**
```javascript
return {
  statusCode: 200,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    success: true,
    data: result,
  }),
};
```

**After:**
```javascript
return createSuccessResponse(result);
```

### Step 6: Replace Error Responses

**Before:**
```javascript
} catch (error) {
  console.error("Some error:", error);

  return {
    statusCode: 500,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      success: false,
      error: "Internal server error",
    }),
  };
}
```

**After:**
```javascript
} catch (error) {
  return handleServerError(error, 'FunctionName');
}
```

### Step 7: Replace Specific Error Cases

| Use Case | Before | After |
|----------|--------|-------|
| User not found | `statusCode: 404, body: {...}` | `return handleNotFoundError('User');` |
| Validation error | `statusCode: 400, body: {...}` | `return handleValidationError(errors);` |
| Database error | `console.error(...); throw error;` | `return handleDatabaseError(error, 'context');` |

---

## Frontend Implementation Pattern

### Step 1: Add Import

```javascript
import { errorHandler, AppError, ErrorType } from '../utils/unified-error-handler.js';
```

### Step 2: Replace Try-Catch Blocks

**Before:**
```javascript
try {
  const response = await apiClient.get(endpoint);
  const data = await response.json();
  this.renderData(data);
} catch (error) {
  console.error('Failed to load:', error);
  logger.error('API Error:', error);
  this.showNotification('Failed to load data', 'error');
}
```

**After:**
```javascript
const result = await errorHandler.safeAsync(
  async () => {
    const response = await apiClient.get(endpoint);
    if (!response.ok) throw new Error('Failed to load data');
    return response.json();
  },
  {
    context: 'Load Data',
    showToUser: true,
    fallbackMessage: 'Failed to load data. Please try again.'
  }
);

if (result.success) {
  this.renderData(result.data);
}
```

### Step 3: Replace Notifications

**Before:**
```javascript
this.showNotification('Success!', 'success');
this.showNotification('Error occurred', 'error');
```

**After:**
```javascript
errorHandler.showSuccess('Success!');
errorHandler.showError('Error occurred');
```

### Step 4: Add Retry for Network Operations

```javascript
const result = await errorHandler.safeAsync(
  async () => {
    return await errorHandler.withRetry(
      () => apiClient.post(endpoint, data),
      { maxAttempts: 3, delay: 1000 }
    );
  },
  {
    context: 'Save Data',
    showToUser: true,
    allowRetry: true,
    retryCallback: () => this.saveData()
  }
);
```

---

## Quick Reference: Before/After Examples

### Complete Backend Function Example

**Before (`games.cjs`):**
```javascript
const jwt = require("jsonwebtoken");

exports.handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        ...
      },
    };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { statusCode: 401, ... };
    }

    const token = authHeader.substring(7);
    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return { statusCode: 401, ... };
    }

    const data = await fetchGames(decoded.userId);

    return {
      statusCode: 200,
      headers: { ... },
      body: JSON.stringify({ success: true, data }),
    };
  } catch (error) {
    console.error("Games error:", error);
    return {
      statusCode: 500,
      headers: { ... },
      body: JSON.stringify({ success: false, error: "Internal server error" }),
    };
  }
};
```

**After:**
```javascript
const jwt = require("jsonwebtoken");
const {
  validateJWT,
  createSuccessResponse,
  handleServerError,
  logFunctionCall,
  CORS_HEADERS
} = require("./utils/error-handler.cjs");

exports.handler = async (event, context) => {
  logFunctionCall('Games', event);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS };
  }

  try {
    const jwtValidation = validateJWT(event, jwt, JWT_SECRET);
    if (!jwtValidation.success) {
      return jwtValidation.error;
    }
    const { decoded } = jwtValidation;

    const data = await fetchGames(decoded.userId);

    return createSuccessResponse(data);
  } catch (error) {
    return handleServerError(error, 'Games');
  }
};
```

**Lines Saved:** ~40 lines → ~20 lines (50% reduction)
**Consistency:** ✅ Standardized error responses
**Logging:** ✅ Automatic function call logging
**Maintenance:** ✅ Centralized error handling logic

---

## Verification Checklist

After updating each file, verify:

### Backend
- [ ] Imports error-handler.cjs utilities
- [ ] Uses `logFunctionCall()` at handler start
- [ ] Uses `CORS_HEADERS` constant
- [ ] Uses `validateJWT()` for auth
- [ ] Uses `createSuccessResponse()` for success
- [ ] Uses appropriate `handle*Error()` functions
- [ ] No `console.error()` without structured logging
- [ ] No hardcoded status codes/headers

### Frontend
- [ ] Imports unified-error-handler.js
- [ ] Uses `errorHandler.safeAsync()` for async operations
- [ ] Uses `errorHandler.show*()` for notifications
- [ ] Uses `errorHandler.withRetry()` for network calls
- [ ] No bare try-catch with console.error
- [ ] No custom notification functions

---

## Testing After Implementation

### Backend
```bash
# Test error response format
curl -X POST https://your-site.netlify.app/.netlify/functions/games \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'

# Should return:
# {
#   "success": false,
#   "error": "...",
#   "errorType": "...",
#   "timestamp": "..."
# }
```

### Frontend
```javascript
// Test error notification
errorHandler.showError('Test error');

// Test async with retry
await errorHandler.withRetry(() => fetch('/api/test'), { maxAttempts: 3 });
```

---

## Progress Tracking

Update this checklist as you complete each file. Mark with ✅ when done.

**Target:** 100% coverage across all backend functions and major frontend pages.

**Current:**
- Backend: 2/20 files (10%)
- Frontend: 0/6 files (0%)

## 🔗 **Related Documentation**

- [Error Handling Guide](ERROR_HANDLING_GUIDE.md) - Error handling patterns
- [Backend Setup](BACKEND_SETUP.md) - Backend API setup guide
- [Architecture](ARCHITECTURE.md) - System architecture overview

## 📝 **Changelog**

- **v1.0 (2025-01-30)**: Initial implementation checklist
- Backend and frontend implementation patterns documented
- Progress tracking system added
- Verification checklist created

---

Last Updated: 2025-01-30

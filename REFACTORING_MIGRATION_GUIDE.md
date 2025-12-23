# Refactoring Migration Guide

## Overview

This guide explains how to migrate existing Netlify functions to use the new utility modules:

- `base-handler.cjs` - Handles CORS, auth, rate limiting, error handling
- `db-query-helper.cjs` - Standardized database query execution
- `response-helper.cjs` - Standardized response formatting

## Before & After Comparison

### Example 1: fixtures.cjs

#### Before (94 lines)

```javascript
const { db, checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  handleValidationError,
  logFunctionCall,
  CORS_HEADERS,
} = require("./utils/error-handler.cjs");
const { authenticateRequest } = require("./utils/auth-helper.cjs");
const { applyRateLimit } = require("./utils/rate-limiter.cjs");

exports.handler = async (event, context) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  logFunctionCall("fixtures", event.httpMethod);

  try {
    checkEnvVars();

    if (event.httpMethod !== "GET") {
      return createErrorResponse(
        "Method not allowed. Use GET to retrieve fixtures.",
        405,
        "method_not_allowed",
      );
    }

    // SECURITY: Apply rate limiting
    const rateLimitResponse = applyRateLimit(event, "READ");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // SECURITY: Authenticate request using Supabase
    const auth = await authenticateRequest(event);
    if (!auth.success) {
      return auth.error;
    }

    const userId = auth.user.id;

    // Parse query parameters
    const athleteId = event.queryStringParameters?.athleteId || userId;
    const days = parseInt(event.queryStringParameters?.days || "14", 10);

    if (!athleteId) {
      return handleValidationError("athleteId query parameter is required");
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    // Get fixtures
    const { data, error } = await supabaseAdmin
      .from("fixtures")
      .select("*")
      .or(`athlete_id.eq.${athleteId},athlete_id.is.null`)
      .gte("game_start", new Date().toISOString())
      .lte("game_start", endDate.toISOString())
      .order("game_start", { ascending: true });

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        500,
        `Failed to retrieve fixtures: ${error.message}`,
      );
    }

    return createSuccessResponse({
      data: data || [],
    });
  } catch (error) {
    return handleServerError(error, "fixtures");
  }
};
```

#### After (45 lines - 52% reduction)

```javascript
const { supabaseAdmin } = require("./supabase-client.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");
const {
  executeQuery,
  parseAthleteId,
  parseIntParam,
  calculateDateRange,
} = require("./utils/db-query-helper.cjs");
const { successResponse } = require("./utils/response-helper.cjs");

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "fixtures",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    handler: async (event, context, { userId }) => {
      // Parse query parameters
      const { valid, athleteId, error } = parseAthleteId(event, userId);
      if (!valid) {
        return error;
      }

      const days = parseIntParam(event, "days", 14, 1, 365);
      const { endDate } = calculateDateRange(days, true);

      // Get fixtures
      const query = supabaseAdmin
        .from("fixtures")
        .select("*")
        .or(`athlete_id.eq.${athleteId},athlete_id.is.null`)
        .gte("game_start", new Date().toISOString())
        .lte("game_start", endDate.toISOString())
        .order("game_start", { ascending: true });

      const result = await executeQuery(query, "Failed to retrieve fixtures");
      if (!result.success) {
        return result.error;
      }

      return successResponse(result.data);
    },
  });
};
```

## Migration Steps

### Step 1: Update Imports

**Remove:**

```javascript
const { db, checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  handleValidationError,
  logFunctionCall,
  CORS_HEADERS,
} = require("./utils/error-handler.cjs");
const { authenticateRequest } = require("./utils/auth-helper.cjs");
const { applyRateLimit } = require("./utils/rate-limiter.cjs");
```

**Add:**

```javascript
const { supabaseAdmin } = require("./supabase-client.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");
const {
  executeQuery,
  parseAthleteId,
  parseIntParam,
  calculateDateRange,
} = require("./utils/db-query-helper.cjs");
const { successResponse } = require("./utils/response-helper.cjs");
```

### Step 2: Replace Handler Function

**Remove:**

```javascript
exports.handler = async (event, context) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  logFunctionCall("function-name", event.httpMethod);

  try {
    checkEnvVars();

    if (event.httpMethod !== "GET") {
      return createErrorResponse(
        "Method not allowed. Use GET...",
        405,
        "method_not_allowed",
      );
    }

    // SECURITY: Apply rate limiting
    const rateLimitResponse = applyRateLimit(event, "READ");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // SECURITY: Authenticate request
    const auth = await authenticateRequest(event);
    if (!auth.success) {
      return auth.error;
    }

    const userId = auth.user.id;

    // ... your logic here ...
  } catch (error) {
    return handleServerError(error, "function-name");
  }
};
```

**Replace with:**

```javascript
exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "function-name",
    allowedMethods: ["GET"], // or ['POST'], ['GET', 'POST'], etc.
    rateLimitType: "READ", // or 'CREATE', 'AUTH', 'DEFAULT'
    handler: async (event, context, { userId }) => {
      // Your logic here - userId is already available
      // No need for CORS, auth, rate limiting - handled by baseHandler
    },
  });
};
```

### Step 3: Replace Query Parameter Parsing

**Before:**

```javascript
const athleteId = event.queryStringParameters?.athleteId || userId;
const days = parseInt(event.queryStringParameters?.days || "14", 10);

if (!athleteId) {
  return handleValidationError("athleteId query parameter is required");
}
```

**After:**

```javascript
const { valid, athleteId, error } = parseAthleteId(event, userId);
if (!valid) {
  return error;
}

const days = parseIntParam(event, "days", 14, 1, 365);
```

### Step 4: Replace Database Query Execution

**Before:**

```javascript
const { data, error } = await supabaseAdmin
  .from("table")
  .select("*")
  .eq("id", id);

if (error) {
  console.error("Database error:", error);
  return createErrorResponse(500, `Failed to retrieve data: ${error.message}`);
}

return createSuccessResponse({
  data: data || [],
});
```

**After:**

```javascript
const query = supabaseAdmin.from("table").select("*").eq("id", id);

const result = await executeQuery(query, "Failed to retrieve data");
if (!result.success) {
  return result.error;
}

return successResponse(result.data);
```

### Step 5: Replace Response Creation

**Before:**

```javascript
return createSuccessResponse({
  data: data || [],
});
```

**After:**

```javascript
return successResponse(data);
```

## Common Patterns

### Pattern 1: GET Endpoint with athleteId

```javascript
exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "my-function",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    handler: async (event, context, { userId }) => {
      const { valid, athleteId, error } = parseAthleteId(event, userId);
      if (!valid) return error;

      const query = supabaseAdmin
        .from("table")
        .select("*")
        .eq("athlete_id", athleteId);
      const result = await executeQuery(query, "Failed to retrieve data");
      if (!result.success) return result.error;

      return successResponse(result.data);
    },
  });
};
```

### Pattern 2: POST Endpoint with Body Validation

```javascript
exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "my-function",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    handler: async (event, context, { userId }) => {
      const body = JSON.parse(event.body || "{}");
      const { requiredField } = body;

      if (!requiredField) {
        return errorResponse(
          "requiredField is required",
          400,
          "validation_error",
        );
      }

      const query = supabaseAdmin
        .from("table")
        .insert({ ...body, user_id: userId });
      const result = await executeQuery(query, "Failed to create record");
      if (!result.success) return result.error;

      return successObjectResponse(
        result.data[0],
        "Record created successfully",
      );
    },
  });
};
```

### Pattern 3: Multiple HTTP Methods

```javascript
exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "my-function",
    allowedMethods: ["GET", "POST", "PUT"],
    rateLimitType: event.httpMethod === "GET" ? "READ" : "CREATE",
    handler: async (event, context, { userId }) => {
      if (event.httpMethod === "GET") {
        // GET logic
        const query = supabaseAdmin.from("table").select("*");
        const result = await executeQuery(query, "Failed to retrieve data");
        if (!result.success) return result.error;
        return successResponse(result.data);
      } else if (event.httpMethod === "POST") {
        // POST logic
        const body = JSON.parse(event.body || "{}");
        // ... create logic
      } else if (event.httpMethod === "PUT") {
        // PUT logic
        const body = JSON.parse(event.body || "{}");
        // ... update logic
      }
    },
  });
};
```

## Benefits

1. **Reduced Code:** 40-50% reduction in function file size
2. **Consistency:** All functions use the same security patterns
3. **Maintainability:** Bug fixes in one place propagate to all functions
4. **Readability:** Function files focus on business logic only
5. **Testability:** Base handler can be unit tested independently

## Testing Checklist

After refactoring, verify:

- [ ] CORS preflight requests work
- [ ] Authentication is enforced
- [ ] Rate limiting works
- [ ] Error handling works correctly
- [ ] Database queries execute properly
- [ ] Responses are formatted correctly
- [ ] Query parameters are parsed correctly
- [ ] Function-specific logic still works

## Rollback Plan

If issues arise:

1. Keep `.refactored.cjs` files as backups
2. Original files are in git history
3. Can revert individual files without affecting others
4. Utilities are backward-compatible (don't break existing code)

## Next Steps

1. ✅ Created utility files (`base-handler.cjs`, `db-query-helper.cjs`, `response-helper.cjs`)
2. ✅ Created refactored examples (`*.refactored.cjs`)
3. ⏳ Test refactored files
4. ⏳ Replace original files with refactored versions
5. ⏳ Migrate remaining high-similarity files
6. ⏳ Migrate all other function files

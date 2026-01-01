# Error Handling Guide

**Version**: 2.0  
**Last Updated**: 29. December 2025  
**Status**: ✅ Production Ready

---

## Overview

This guide explains the standardized error handling patterns used across the FlagFit Pro application.

### Key Features

- **Unified Error Handling**: Consistent error responses across backend and frontend
- **Structured Error Format**: Standardized error response structure with request IDs
- **baseHandler Pattern**: Centralized middleware for all Netlify functions
- **Automatic Logging**: Function call logging and error tracking
- **User-Friendly Messages**: Clear error messages for users
- **Retry Logic**: Built-in retry mechanisms for network operations
- **Rate Limiting**: Built-in rate limiting per endpoint type

## Architecture

### Backend (Netlify Functions)

- **Location**: `netlify/functions/utils/error-handler.cjs`
- **Purpose**: Consistent error responses and logging for all Netlify functions

### Frontend

- **Location**: `src/js/utils/unified-error-handler.js`
- **Purpose**: Unified error handling, user notifications, and global error catching

---

## Backend Error Handling

### Import the Error Handler

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
  logFunctionCall,
  CORS_HEADERS,
} = require("./utils/error-handler.cjs");
```

### Basic Usage

```javascript
exports.handler = async (event, context) => {
  // Log function call
  logFunctionCall("MyFunction", event);

  // Handle CORS
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS };
  }

  try {
    // Validate JWT
    const jwtValidation = validateJWT(event, jwt, JWT_SECRET);
    if (!jwtValidation.success) {
      return jwtValidation.error;
    }
    const { decoded } = jwtValidation;

    // Your business logic here
    const data = await fetchData(decoded.userId);

    // Return success
    return createSuccessResponse(data);
  } catch (error) {
    // Handle errors
    return handleServerError(error, "MyFunction");
  }
};
```

### Error Response Formats

All error responses follow this structure:

```json
{
  "success": false,
  "error": "User-friendly error message",
  "errorType": "validation_error",
  "timestamp": "2025-01-30T12:00:00.000Z"
}
```

### Available Error Handlers

| Handler                         | Status Code | Use Case                 |
| ------------------------------- | ----------- | ------------------------ |
| `handleAuthenticationError()`   | 401         | Missing or invalid token |
| `handleAuthorizationError()`    | 403         | Insufficient permissions |
| `handleValidationError(errors)` | 400         | Invalid request data     |
| `handleNotFoundError(resource)` | 404         | Resource not found       |
| `handleConflictError(message)`  | 409         | Duplicate resource       |
| `handleDatabaseError(error)`    | 500         | Database errors          |
| `handleServerError(error)`      | 500         | General server errors    |

---

## baseHandler Pattern (Recommended)

The `baseHandler` pattern provides a standardized middleware for all Netlify functions, handling CORS, authentication, rate limiting, and error handling automatically.

### Location

`netlify/functions/utils/base-handler.cjs`

### Usage

```javascript
const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "my-function",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "READ", // READ, CREATE, UPDATE, DELETE
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      // Your business logic here
      const data = await fetchData(userId);
      return createSuccessResponse(data, requestId);
    },
  });
};
```

### Features

| Feature        | Description                              |
| -------------- | ---------------------------------------- |
| CORS           | Automatic CORS headers for all responses |
| Authentication | JWT validation with user ID extraction   |
| Rate Limiting  | Configurable per endpoint type           |
| Request ID     | Unique ID for request tracking           |
| Error Handling | Consistent error responses               |
| Logging        | Automatic request/response logging       |

### Configuration Options

| Option           | Type     | Required | Description             |
| ---------------- | -------- | -------- | ----------------------- |
| `functionName`   | string   | Yes      | Name for logging        |
| `allowedMethods` | string[] | Yes      | HTTP methods allowed    |
| `rateLimitType`  | string   | Yes      | Rate limit tier         |
| `requireAuth`    | boolean  | Yes      | Require authentication  |
| `handler`        | function | Yes      | Business logic function |

---

## Frontend Error Handling

### Import the Error Handler

```javascript
import {
  errorHandler,
  AppError,
  ErrorType,
} from "../utils/unified-error-handler.js";
```

### Basic Usage

```javascript
// Wrap async operations
async function loadData() {
  const result = await errorHandler.safeAsync(
    async () => {
      const response = await fetch("/api/data");
      if (!response.ok) throw new Error("Failed to load data");
      return response.json();
    },
    {
      context: "Load Data",
      showToUser: true,
      fallbackMessage: "Failed to load data. Please try again.",
    },
  );

  if (result.success) {
    console.log("Data loaded:", result.data);
  }
}
```

### Show Notifications

```javascript
// Success
errorHandler.showSuccess("Data saved successfully!");

// Error
errorHandler.showError("Failed to save data");

// Warning
errorHandler.showWarning("Connection is unstable");

// Info
errorHandler.showInfo("Processing your request...");
```

### Error with Retry

```javascript
errorHandler.showErrorWithRetry(
  "Failed to save changes",
  () => saveChanges(), // Retry callback
);
```

### Handle API Errors

```javascript
try {
  const response = await apiClient.post("/endpoint", data);
} catch (error) {
  errorHandler.handleApiError(error, "Save Data");
}
```

### Form Validation Errors

```javascript
// Show field-level error
errorHandler.handleValidationError("email", "Please enter a valid email");
```

### With Retry Logic

```javascript
const data = await errorHandler.withRetry(async () => await fetchData(), {
  maxAttempts: 3,
  delay: 1000,
  backoff: 2,
  onRetry: (error, attempt) => {
    console.log(`Retry attempt ${attempt}`);
  },
});
```

### Custom Error Types

```javascript
// Throw custom errors
throw new AppError(
  "User not found",
  ErrorType.NOT_FOUND,
  ErrorSeverity.WARNING,
  { userId: 123 },
);
```

---

## Migration Guide

### Backend Migration

**Before:**

```javascript
try {
  // logic
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ success: true, data }),
  };
} catch (error) {
  console.error("Error:", error);
  return {
    statusCode: 500,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ success: false, error: "Internal server error" }),
  };
}
```

**After:**

```javascript
const {
  createSuccessResponse,
  handleServerError,
} = require("./utils/error-handler.cjs");

try {
  // logic
  return createSuccessResponse(data);
} catch (error) {
  return handleServerError(error, "FunctionName");
}
```

### Frontend Migration

**Before:**

```javascript
try {
  const response = await fetch("/api/data");
  const data = await response.json();
} catch (error) {
  console.error("Failed:", error);
  logger.error("API Error:", error);
  this.showNotification("Failed to load data", "error");
}
```

**After:**

```javascript
import { errorHandler } from "../utils/unified-error-handler.js";

const result = await errorHandler.safeAsync(
  async () => {
    const response = await fetch("/api/data");
    if (!response.ok) throw new Error("Failed to load");
    return response.json();
  },
  { context: "Load Data", showToUser: true },
);

if (result.success) {
  // Use result.data
}
```

---

## Best Practices

### 1. Always Use Consistent Error Handling

✅ **Do:**

```javascript
return handleServerError(error, "MyFunction");
```

❌ **Don't:**

```javascript
console.error(error);
return { statusCode: 500, body: JSON.stringify({ error: "Error" }) };
```

### 2. Provide Context

✅ **Do:**

```javascript
errorHandler.handleError(error, {
  context: "Save User Profile",
  showToUser: true,
});
```

❌ **Don't:**

```javascript
console.error(error);
```

### 3. Use Appropriate Error Types

```javascript
// Network errors
throw new AppError("Connection failed", ErrorType.NETWORK);

// Validation errors
throw new AppError("Invalid email", ErrorType.VALIDATION);

// Not found
throw new AppError("User not found", ErrorType.NOT_FOUND);
```

### 4. Log Function Calls (Backend)

```javascript
exports.handler = async (event, context) => {
  logFunctionCall("MyFunction", event);
  // ...
};
```

### 5. Handle Retries for Network Errors

```javascript
const data = await errorHandler.withRetry(() => fetchFromAPI(), {
  maxAttempts: 3,
  delay: 1000,
});
```

---

## Error Types Reference

### Backend Error Types

- `validation_error` - Invalid request data
- `authentication_error` - Missing/invalid credentials
- `authorization_error` - Insufficient permissions
- `not_found` - Resource not found
- `conflict` - Duplicate resource
- `rate_limit_exceeded` - Too many requests
- `database_error` - Database operation failed
- `network_error` - Network connectivity issue
- `server_error` - Internal server error
- `unknown_error` - Unclassified error

### Frontend Error Severity

- `info` - Informational message
- `warning` - Warning that doesn't block operation
- `error` - Error that requires attention
- `critical` - Critical error requiring immediate action

---

## Testing Error Handling

### Test Network Errors

```javascript
// Simulate network error
window.dispatchEvent(new Event("offline"));

// Test recovery
window.dispatchEvent(new Event("online"));
```

### Test Error Notifications

```javascript
errorHandler.showError("Test error message");
errorHandler.showSuccess("Test success message");
errorHandler.showWarning("Test warning message");
```

### Test Retry Logic

```javascript
let attempts = 0;
const result = await errorHandler.withRetry(
  async () => {
    attempts++;
    if (attempts < 3) throw new Error("Retry test");
    return "Success";
  },
  { maxAttempts: 3 },
);
```

---

## Support

For questions or issues with error handling:

1. Check this documentation
2. Review existing implementations in `dashboard.cjs` (backend) or `dashboard-page.js` (frontend)
3. Check the error handler source code for additional methods

## 🔗 **Related Documentation**

- [Error Handling Implementation Checklist](ERROR_HANDLING_IMPLEMENTATION_CHECKLIST.md) - Implementation checklist
- [Backend Setup](BACKEND_SETUP.md) - Backend API setup guide
- [Architecture](ARCHITECTURE.md) - System architecture overview

## 📝 **Changelog**

- **v1.0 (2025-01-30)**: Initial error handling guide
- Backend and frontend error handling documented
- Migration guide added
- Best practices documented

---

Last Updated: 2025-01-30

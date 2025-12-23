# FlagFit Pro - Utilities API Reference

**Version:** 1.0.0
**Last Updated:** November 2025

## Table of Contents

1. [Overview](#overview)
2. [Sanitization Utilities](#sanitization-utilities)
3. [CSRF Protection](#csrf-protection)
4. [Error Handling](#error-handling)
5. [Cache Service](#cache-service)
6. [Validation Utilities](#validation-utilities)
7. [Application Constants](#application-constants)

---

## Overview

This document provides complete API reference for all utility modules in the FlagFit Pro application. Each utility is designed to be modular, reusable, and follow best practices.

### Module Loading

All utilities support both ES6 modules and CommonJS:

```javascript
// ES6 Import
import { escapeHtml } from "./utils/sanitize.js";

// CommonJS
const { escapeHtml } = require("./utils/sanitize.js");

// Global (non-module scripts)
window.sanitize.escapeHtml(text);
```

---

## Sanitization Utilities

**File:** `src/js/utils/sanitize.js`

Prevents XSS attacks by escaping and sanitizing user-generated content.

### Functions

#### `escapeHtml(str)`

Escapes HTML special characters to prevent XSS attacks.

**Parameters:**

- `str` (string): String to escape

**Returns:**

- (string): Escaped string safe for HTML insertion

**Example:**

```javascript
import { escapeHtml } from "./utils/sanitize.js";

const userInput = '<script>alert("XSS")</script>';
const safe = escapeHtml(userInput);
// Result: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'

document.getElementById("display").innerHTML = safe; // Safe
```

**Escaped Characters:**
| Character | Escaped To |
|-----------|------------|
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` |
| `'` | `&#039;` |
| `/` | `&#x2F;` |

**Edge Cases:**

- `null` or `undefined` returns empty string
- Numbers and other types converted to string first

---

#### `sanitizeAttribute(attr)`

Sanitizes HTML attributes, removing dangerous protocols.

**Parameters:**

- `attr` (string): Attribute value to sanitize

**Returns:**

- (string): Sanitized attribute value

**Example:**

```javascript
import { sanitizeAttribute } from "./utils/sanitize.js";

// Removes javascript: protocol
const dangerous = "javascript:alert(1)";
const safe = sanitizeAttribute(dangerous);
// Result: '' (empty string)

// Normal attribute is escaped
const normal = "user-class";
const cleaned = sanitizeAttribute(normal);
// Result: 'user-class'
```

**Blocked Patterns:**

- `javascript:` URLs
- `data:` URLs
- `vbscript:` URLs

**Edge Cases:**

- `null` or `undefined` returns empty string
- Dangerous protocols return empty string
- All other values are HTML-escaped

---

#### `sanitizeUrl(url)`

Sanitizes URLs to prevent XSS via href/src attributes.

**Parameters:**

- `url` (string): URL to sanitize

**Returns:**

- (string): Sanitized URL or empty string if dangerous

**Example:**

```javascript
import { sanitizeUrl } from "./utils/sanitize.js";

// Safe protocols allowed
const https = sanitizeUrl("https://example.com");
// Result: 'https://example.com'

const mailto = sanitizeUrl("mailto:user@example.com");
// Result: 'mailto:user@example.com'

// Dangerous protocols blocked
const xss = sanitizeUrl("javascript:alert(1)");
// Result: '' (empty string, warning logged)

const data = sanitizeUrl("data:text/html,<script>alert(1)</script>");
// Result: '' (empty string, warning logged)
```

**Allowed Protocols:**

- `https://`
- `http://`
- `mailto:`
- `tel:`
- `sms:`

**Blocked Protocols:**

- `javascript:`
- `data:`
- `vbscript:`
- Any other non-standard protocol

**Edge Cases:**

- Empty or falsy values return empty string
- URLs without protocol are allowed (relative URLs)
- Trimmed before processing

---

#### `createSafeElement(tag, attributes, content)`

Creates a DOM element with safe attribute and content handling.

**Parameters:**

- `tag` (string): HTML tag name (e.g., 'div', 'span', 'a')
- `attributes` (object): Element attributes (optional, default: `{}`)
- `content` (string|Node): Text content or child node (optional, default: `''`)

**Returns:**

- (HTMLElement): Safe DOM element

**Example:**

```javascript
import { createSafeElement } from "./utils/sanitize.js";

// Simple element
const div = createSafeElement("div", { class: "user-card" }, "John Doe");

// Element with multiple attributes
const link = createSafeElement(
  "a",
  {
    href: "https://example.com",
    class: "external-link",
    target: "_blank",
  },
  "Visit Site",
);

// Element with child node
const child = document.createElement("span");
child.textContent = "Child";
const parent = createSafeElement("div", {}, child);

// Element with inline styles
const styled = createSafeElement(
  "div",
  {
    style: {
      color: "blue",
      fontSize: "16px",
    },
  },
  "Styled text",
);
```

**Special Attribute Handling:**

- `href` and `src`: Automatically sanitized with `sanitizeUrl()`
- `style`: Can be object or string
- `class` or `className`: Set as className
- All others: Sanitized with `sanitizeAttribute()`

**Edge Cases:**

- If content is a Node, it's appended; if string, set as textContent
- Null/undefined content creates empty element
- Invalid tag names throw DOM exception

---

#### `sanitizeRichText(html)`

Sanitizes HTML while allowing specific safe formatting tags.

**Parameters:**

- `html` (string): HTML string to sanitize

**Returns:**

- (string): Sanitized HTML with only allowed tags

**Example:**

```javascript
import { sanitizeRichText } from "./utils/sanitize.js";

const userContent = "Hello <b>world</b>! <script>alert(1)</script>";
const safe = sanitizeRichText(userContent);
// Result: 'Hello <b>world</b>! &lt;script&gt;alert(1)&lt;/script&gt;'

element.innerHTML = safe; // Safe - script tags escaped, <b> preserved
```

**Allowed Tags:**

- `<b>`, `<strong>` (bold)
- `<i>`, `<em>` (italic)
- `<br>` (line break)

**Process:**

1. First escapes everything as text
2. Then unescapes only allowed tags
3. Dangerous content remains escaped

**Limitations:**

- Simple implementation for basic formatting
- For production with complex needs, consider DOMPurify library

**Edge Cases:**

- Empty or falsy values return empty string
- Nested tags are preserved if all are allowed
- Attributes on allowed tags are stripped

---

## CSRF Protection

**File:** `src/js/security/csrf-protection.js`

Generates and manages CSRF tokens for secure API requests using the Synchronizer Token Pattern.

### Class: `CSRFProtection`

Singleton class managing CSRF token lifecycle.

### Methods

#### `generateToken()`

Generates a cryptographically secure CSRF token.

**Returns:**

- (string): 64-character hex token

**Example:**

```javascript
import csrfProtection from "./security/csrf-protection.js";

const token = csrfProtection.generateToken();
// Result: "a1b2c3d4..." (64 hex chars)
```

**Details:**

- Uses Web Crypto API (`crypto.getRandomValues()`)
- Generates 32 random bytes (256 bits)
- Converts to hexadecimal string
- Stores in sessionStorage automatically

**Edge Cases:**

- Automatically called on initialization
- Overwrites existing token
- If sessionStorage unavailable, stores in memory only

---

#### `getToken()`

Retrieves the current CSRF token.

**Returns:**

- (string|null): Current CSRF token

**Example:**

```javascript
const token = csrfProtection.getToken();
console.log(token); // "a1b2c3d4..."
```

**Fallback Chain:**

1. Returns from memory if available
2. Retrieves from sessionStorage
3. Generates new token if none exists

**Edge Cases:**

- Never returns null (generates if missing)
- sessionStorage errors logged but don't crash

---

#### `rotateToken()`

Rotates (regenerates) the CSRF token.

**Returns:**

- (void)

**Example:**

```javascript
// After sensitive operation
await login(credentials);
csrfProtection.rotateToken(); // Get new token

// After password change
await changePassword(newPassword);
csrfProtection.rotateToken();
```

**When to Rotate:**

- After successful login
- After password change
- After privilege escalation
- Periodically for long-lived sessions

---

#### `clearToken()`

Clears the CSRF token from memory and storage.

**Returns:**

- (void)

**Example:**

```javascript
// On logout
function logout() {
  csrfProtection.clearToken();
  sessionStorage.clear();
  window.location = "/login";
}
```

**When to Clear:**

- On logout
- On session expiration
- On authentication failure

---

#### `getHeaders()`

Returns headers object with CSRF token.

**Returns:**

- (object): Headers object `{ 'X-CSRF-Token': token }`

**Example:**

```javascript
const headers = {
  "Content-Type": "application/json",
  ...csrfProtection.getHeaders(),
};

fetch("/api/data", {
  method: "POST",
  headers,
  body: JSON.stringify(data),
});
```

**Edge Cases:**

- Returns empty object `{}` if no token available
- Logs warning if token missing

---

#### `addTokenToRequest(options)`

Adds CSRF token to fetch options.

**Parameters:**

- `options` (object): Fetch options object (optional, default: `{}`)

**Returns:**

- (object): Modified options with CSRF token header

**Example:**

```javascript
// Basic usage
const options = csrfProtection.addTokenToRequest({
  method: "POST",
  body: JSON.stringify(data),
});

fetch("/api/endpoint", options);

// Chain with other options
const options = csrfProtection.addTokenToRequest({
  method: "DELETE",
  headers: {
    "Content-Type": "application/json",
    "Custom-Header": "value",
  },
});
```

**Details:**

- Creates `headers` object if not present
- Adds `X-CSRF-Token` header
- Preserves existing headers

**Edge Cases:**

- Safe to call with empty object
- Doesn't override existing X-CSRF-Token header
- Logs warning if no token available

---

#### `requiresProtection(method)`

Checks if HTTP method requires CSRF protection.

**Parameters:**

- `method` (string): HTTP method name

**Returns:**

- (boolean): True if method requires CSRF protection

**Example:**

```javascript
if (csrfProtection.requiresProtection("POST")) {
  options = csrfProtection.addTokenToRequest(options);
}

fetch(url, options);
```

**Protected Methods:**

- `POST`
- `PUT`
- `DELETE`
- `PATCH`

**Unprotected Methods:**

- `GET`
- `HEAD`
- `OPTIONS`

**Edge Cases:**

- Case-insensitive comparison
- Unknown methods return false

---

#### `validateToken(token)`

Validates a token against the current token (constant-time comparison).

**Parameters:**

- `token` (string): Token to validate

**Returns:**

- (boolean): True if token matches

**Example:**

```javascript
// Server-side validation
const clientToken = req.headers["x-csrf-token"];
const isValid = csrfProtection.validateToken(clientToken);

if (!isValid) {
  return res.status(403).json({ error: "Invalid CSRF token" });
}
```

**Details:**

- Uses constant-time comparison to prevent timing attacks
- Compares each character using XOR
- Returns false if lengths don't match

**Edge Cases:**

- Returns false if either token is null/undefined
- Returns false if lengths differ
- Safe against timing attacks

---

#### `addTokenToFormData(formData)`

Adds CSRF token to FormData object.

**Parameters:**

- `formData` (FormData): Form data object

**Returns:**

- (FormData): Modified form data with CSRF token

**Example:**

```javascript
const formData = new FormData();
formData.append("file", fileInput.files[0]);
formData.append("title", "My Upload");

csrfProtection.addTokenToFormData(formData);

fetch("/api/upload", {
  method: "POST",
  body: formData,
});
```

**Details:**

- Adds token as `csrf_token` field
- Preserves existing form fields

**Edge Cases:**

- Logs warning if no token available
- Returns unmodified FormData if no token

---

#### `getMetaTag()`

Returns HTML meta tag with CSRF token.

**Returns:**

- (string): HTML meta tag

**Example:**

```javascript
// Add to page head
document.head.insertAdjacentHTML("beforeend", csrfProtection.getMetaTag());

// Result in HTML:
// <meta name="csrf-token" content="a1b2c3d4...">
```

**Use Cases:**

- Including token in HTML forms
- Making token available to other scripts
- Rendering server-side templates

---

### Global Instance

A singleton instance is automatically created and available globally:

```javascript
// Global access
window.csrfProtection.getToken();

// ES6 import
import csrfProtection from "./security/csrf-protection.js";
```

---

## Error Handling

**File:** `src/js/utils/error-handling.js`

Standardized error handling utilities for consistent error management across the application.

### Enums

#### `ErrorType`

Error categories for classification.

**Values:**

```javascript
export const ErrorType = {
  NETWORK: "network",
  VALIDATION: "validation",
  AUTHENTICATION: "authentication",
  AUTHORIZATION: "authorization",
  NOT_FOUND: "not_found",
  SERVER: "server",
  CLIENT: "client",
  UNKNOWN: "unknown",
};
```

---

### Classes

#### `AppError`

Custom error class with type and details.

**Constructor:**

```javascript
new AppError(message, type, details);
```

**Parameters:**

- `message` (string): Error message
- `type` (string): Error type from ErrorType enum (optional, default: `ErrorType.UNKNOWN`)
- `details` (object): Additional error details (optional, default: `{}`)

**Properties:**

- `name` (string): Always 'AppError'
- `message` (string): Error message
- `type` (string): Error type
- `details` (object): Additional details
- `timestamp` (string): ISO timestamp of error

**Example:**

```javascript
import { AppError, ErrorType } from "./utils/error-handling.js";

throw new AppError("Invalid email format", ErrorType.VALIDATION, {
  field: "email",
  value: userEmail,
});
```

---

### Functions

#### `handleError(error, options)`

Standardized error handler with logging and user notification.

**Parameters:**

- `error` (Error): Error object to handle
- `options` (object): Handler options (optional)

**Options:**

- `context` (string): Operation context (default: `'Operation'`)
- `logLevel` (string): Log level - 'error', 'warn', 'debug' (default: `'error'`)
- `showToUser` (boolean): Show notification to user (default: `true`)
- `fallbackMessage` (string): Default error message (default: `'An error occurred. Please try again.'`)
- `onError` (function): Custom error callback (optional)

**Returns:**

- (object): Standardized error response

**Response Format:**

```javascript
{
  success: false,
  error: "User-friendly error message",
  errorType: "validation",
  details: {},
  timestamp: "2025-11-27T10:30:00.000Z"
}
```

**Example:**

```javascript
import { handleError } from "./utils/error-handling.js";

try {
  await saveUserData(data);
} catch (error) {
  return handleError(error, {
    context: "Save User Data",
    showToUser: true,
    fallbackMessage: "Failed to save data. Please try again.",
    onError: (err, info) => {
      analytics.trackError(err, info);
    },
  });
}
```

**Error Categorization:**

- Detects error type from error properties
- Maps HTTP status codes to error types
- Provides user-friendly messages
- Logs with appropriate level

---

#### `withErrorHandling(fn, options)`

Wraps async function with standardized error handling.

**Parameters:**

- `fn` (function): Async function to wrap
- `options` (object): Handler options (same as handleError)

**Returns:**

- (function): Wrapped function

**Example:**

```javascript
import { withErrorHandling } from "./utils/error-handling.js";

const saveData = withErrorHandling(
  async (data) => {
    return await api.save(data);
  },
  {
    context: "Save Data",
    showToUser: true,
  },
);

// Usage
const result = await saveData(userData);
if (result.success) {
  console.log("Saved:", result.data);
} else {
  console.error("Error:", result.error);
}
```

---

#### `safeAsync(operation, options)`

Executes async operation with error handling.

**Parameters:**

- `operation` (function): Async operation to execute
- `options` (object): Handler options

**Returns:**

- (Promise<object>): Result object with `success` and `data`/`error`

**Example:**

```javascript
import { safeAsync } from "./utils/error-handling.js";

const result = await safeAsync(
  async () => {
    const response = await fetch("/api/data");
    return response.json();
  },
  { context: "Fetch Data" },
);

if (result.success) {
  console.log("Data:", result.data);
} else {
  console.error("Error:", result.error);
}
```

---

#### `withRetry(operation, options)`

Retries failed operations with exponential backoff.

**Parameters:**

- `operation` (function): Operation to retry
- `options` (object): Retry options

**Options:**

- `maxAttempts` (number): Maximum retry attempts (default: `3`)
- `delay` (number): Initial delay in ms (default: `1000`)
- `backoff` (number): Backoff multiplier (default: `2`)
- `shouldRetry` (function): Function to determine if should retry (default: `() => true`)
- `onRetry` (function): Callback on each retry

**Returns:**

- (Promise): Operation result

**Example:**

```javascript
import { withRetry, isRetryableError } from "./utils/error-handling.js";

const data = await withRetry(
  async () => {
    const response = await fetch("/api/data");
    if (!response.ok) throw new Error("Request failed");
    return response.json();
  },
  {
    maxAttempts: 3,
    delay: 1000,
    backoff: 2,
    shouldRetry: (error, attempt) => {
      return isRetryableError(error) && attempt < 3;
    },
    onRetry: (error, attempt) => {
      console.log(`Retry attempt ${attempt}:`, error.message);
    },
  },
);
```

**Backoff Example:**

- Attempt 1: Fails, wait 1000ms
- Attempt 2: Fails, wait 2000ms (1000 \* 2)
- Attempt 3: Fails, wait 4000ms (2000 \* 2)

---

#### `validationError(message, details)`

Creates validation error.

**Parameters:**

- `message` (string): Error message
- `details` (object): Validation details (optional, default: `{}`)

**Returns:**

- (AppError): Validation error

**Example:**

```javascript
import { validationError } from "./utils/error-handling.js";

if (!email.includes("@")) {
  throw validationError("Invalid email format", { field: "email" });
}
```

---

#### `networkError(message, details)`

Creates network error.

**Parameters:**

- `message` (string): Error message (optional)
- `details` (object): Error details (optional, default: `{}`)

**Returns:**

- (AppError): Network error

**Example:**

```javascript
import { networkError } from "./utils/error-handling.js";

if (!navigator.onLine) {
  throw networkError("No internet connection");
}
```

---

#### `isRetryableError(error)`

Checks if error is retryable (network/server errors).

**Parameters:**

- `error` (Error): Error to check

**Returns:**

- (boolean): True if error is retryable

**Example:**

```javascript
import { isRetryableError } from "./utils/error-handling.js";

try {
  await fetchData();
} catch (error) {
  if (isRetryableError(error)) {
    // Retry the operation
    await fetchData();
  } else {
    // Don't retry, handle differently
    showError(error);
  }
}
```

**Retryable Errors:**

- Network errors
- Server errors (5xx status codes)
- AppError with type NETWORK or SERVER

---

#### `safeDOMOperation(operation, options)`

Wraps DOM operations with error handling.

**Parameters:**

- `operation` (function): DOM operation to execute
- `options` (object): Options

**Options:**

- `logError` (boolean): Log error if occurs (default: `true`)
- `defaultValue` (any): Value to return on error (default: `null`)

**Returns:**

- (any): Operation result or defaultValue

**Example:**

```javascript
import { safeDOMOperation } from "./utils/error-handling.js";

const element = safeDOMOperation(
  () => document.querySelector(".user-profile"),
  { defaultValue: null },
);

if (element) {
  element.textContent = userName;
}
```

---

#### `setupGlobalErrorHandlers()`

Sets up global error handlers for unhandled errors and promise rejections.

**Returns:**

- (void)

**Example:**

```javascript
import { setupGlobalErrorHandlers } from "./utils/error-handling.js";

// Call on app initialization
setupGlobalErrorHandlers();
```

**Handlers:**

- `unhandledrejection`: Catches unhandled promise rejections
- `error`: Catches global errors

**Details:**

- Logs all errors
- Prevents default browser behavior
- Should be called once during app initialization

---

## Cache Service

**File:** `src/js/services/cache-service.js`

Intelligent caching service with TTL, LRU eviction, and storage management.

### Class: `CacheService`

Singleton service for caching API responses and computed data.

### Methods

#### `get(key)`

Retrieves data from cache.

**Parameters:**

- `key` (string): Cache key

**Returns:**

- (any): Cached data or null if not found/expired

**Example:**

```javascript
import cacheService from "./services/cache-service.js";

const userData = cacheService.get("user_123");
if (userData) {
  // Use cached data
  displayUser(userData);
} else {
  // Fetch from API
  const data = await fetchUser(123);
  cacheService.set("user_123", data);
}
```

**Lookup Order:**

1. Memory cache (fast)
2. localStorage (slower)
3. Returns null if not found

**Details:**

- Expired entries removed automatically
- Hit count incremented
- Memory cache updated from localStorage hits

---

#### `set(key, data, options)`

Stores data in cache.

**Parameters:**

- `key` (string): Cache key
- `data` (any): Data to cache (must be JSON-serializable)
- `options` (object): Cache options (optional)

**Options:**

- `ttl` (number): Time-to-live in milliseconds (default: `NETWORK.CACHE_DURATION_MEDIUM` = 15 min)
- `persistToStorage` (boolean): Store in localStorage (default: `true`)

**Returns:**

- (void)

**Example:**

```javascript
import cacheService from "./services/cache-service.js";
import { NETWORK } from "./config/app-constants.js";

// Cache for 5 minutes (memory + storage)
cacheService.set("api_response", data, {
  ttl: NETWORK.CACHE_DURATION_SHORT,
});

// Cache for 1 hour (memory only)
cacheService.set("temp_data", data, {
  ttl: NETWORK.CACHE_DURATION_LONG,
  persistToStorage: false,
});
```

**TTL Constants:**

```javascript
NETWORK.CACHE_DURATION_SHORT = 5 * 60 * 1000; // 5 minutes
NETWORK.CACHE_DURATION_MEDIUM = 15 * 60 * 1000; // 15 minutes
NETWORK.CACHE_DURATION_LONG = 60 * 60 * 1000; // 1 hour
```

**Details:**

- Stores in memory cache
- Optionally persists to localStorage
- Handles quota exceeded gracefully

---

#### `invalidate(key)`

Removes cache entry.

**Parameters:**

- `key` (string): Cache key to invalidate

**Returns:**

- (void)

**Example:**

```javascript
// Invalidate after update
await updateUser(userId, data);
cacheService.invalidate(`user_${userId}`);
```

---

#### `invalidatePattern(pattern)`

Invalidates all cache entries matching a pattern.

**Parameters:**

- `pattern` (RegExp|string): Pattern to match keys

**Returns:**

- (void)

**Example:**

```javascript
import cacheService from "./services/cache-service.js";

// Invalidate all user caches
cacheService.invalidatePattern(/^user_/);

// Invalidate all wellness data
cacheService.invalidatePattern("wellness_");
```

**Details:**

- Matches against cache keys
- Removes from both memory and localStorage
- Logs count of invalidated entries

---

#### `clear()`

Clears all cache entries.

**Returns:**

- (void)

**Example:**

```javascript
// On logout
function logout() {
  cacheService.clear();
  sessionStorage.clear();
}
```

---

#### `getStats()`

Returns cache statistics.

**Returns:**

- (object): Statistics object

**Response:**

```javascript
{
  hits: 150,
  misses: 45,
  sets: 50,
  evictions: 10,
  hitRate: "76.92%",
  memoryCacheSize: 25,
  maxMemoryCacheSize: 50
}
```

**Example:**

```javascript
const stats = cacheService.getStats();
console.log(`Cache hit rate: ${stats.hitRate}`);
```

---

#### `logStats()`

Logs cache statistics to console.

**Returns:**

- (void)

**Example:**

```javascript
// Monitor cache performance
setInterval(() => {
  cacheService.logStats();
}, 60000); // Every minute
```

---

### Cache Entry Properties

Each cache entry stores:

- `data`: The cached data
- `timestamp`: When it was cached
- `ttl`: Time-to-live in milliseconds
- `hits`: Number of times accessed

### LRU Eviction

When memory cache is full (50 entries by default):

- Least recently used entry is evicted
- Based on hit count
- Entry with fewest hits removed first

### Storage Management

If localStorage quota exceeded:

- Automatically removes oldest 25% of entries
- Retries storage operation
- Falls back to memory-only if still fails

### Automatic Cleanup

- Runs every 5 minutes
- Removes expired entries from memory
- Samples localStorage to avoid performance issues
- Removes invalid entries

---

## Validation Utilities

**File:** `src/js/utils/validation.js`

Comprehensive validation utilities for forms, API data, and user inputs.

### Classes

#### `ValidationResult`

Result object from validation operations.

**Properties:**

- `isValid` (boolean): Overall validation status
- `errors` (object): Map of field errors
- `warnings` (object): Map of field warnings

**Methods:**

##### `addError(field, message)`

Adds error for a field.

**Parameters:**

- `field` (string): Field name
- `message` (string): Error message

##### `addWarning(field, message)`

Adds warning for a field.

**Parameters:**

- `field` (string): Field name
- `message` (string): Warning message

##### `hasErrors()`

Returns true if any errors exist.

##### `hasWarnings()`

Returns true if any warnings exist.

##### `getErrorMessages()`

Returns array of all error messages.

##### `getWarningMessages()`

Returns array of all warning messages.

**Example:**

```javascript
const result = new ValidationResult();
result.addError("email", "Invalid email format");
result.addWarning("password", "Password should be longer");

console.log(result.isValid); // false
console.log(result.errors); // { email: ['Invalid email format'] }
console.log(result.warnings); // { password: ['Password should be longer'] }
```

---

### Base Validators

#### `Validators.required(value, fieldName)`

Checks if value is not empty.

**Parameters:**

- `value` (any): Value to validate
- `fieldName` (string): Field name for error message (optional, default: `'This field'`)

**Returns:**

- (string|null): Error message or null if valid

**Example:**

```javascript
import { Validators } from "./utils/validation.js";

const error = Validators.required(userName, "Username");
if (error) {
  console.error(error); // "Username is required"
}
```

---

#### `Validators.email(value)`

Validates email format.

**Parameters:**

- `value` (string): Email to validate

**Returns:**

- (string|null): Error message or null if valid

**Example:**

```javascript
const error = Validators.email("invalid-email");
if (error) {
  console.error(error); // "Please enter a valid email address"
}
```

**Validation:**

- Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Max length: 254 characters

---

#### `Validators.password(value)`

Validates password strength.

**Parameters:**

- `value` (string): Password to validate

**Returns:**

- (string|null): Error message or null if valid

**Example:**

```javascript
const error = Validators.password("weak");
if (error) {
  console.error(error);
  // "Password must be at least 8 characters. Password must contain at least one uppercase letter..."
}
```

**Requirements:**

- Minimum 8 characters
- Maximum 128 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

---

#### `Validators.length(value, min, max, fieldName)`

Validates string length.

**Parameters:**

- `value` (string): String to validate
- `min` (number): Minimum length (optional)
- `max` (number): Maximum length (optional)
- `fieldName` (string): Field name (optional, default: `'Value'`)

**Returns:**

- (string|null): Error message or null if valid

**Example:**

```javascript
const error = Validators.length(userName, 2, 50, "Username");
if (error) {
  console.error(error); // "Username must be at least 2 characters"
}
```

---

#### `Validators.range(value, min, max, fieldName)`

Validates number range.

**Parameters:**

- `value` (number): Number to validate
- `min` (number): Minimum value (optional)
- `max` (number): Maximum value (optional)
- `fieldName` (string): Field name (optional, default: `'Value'`)

**Returns:**

- (string|null): Error message or null if valid

**Example:**

```javascript
const error = Validators.range(age, 18, 100, "Age");
if (error) {
  console.error(error); // "Age must be at least 18"
}
```

---

#### `Validators.url(value)`

Validates URL format.

**Example:**

```javascript
const error = Validators.url("not-a-url");
if (error) {
  console.error(error); // "Please enter a valid URL starting with http:// or https://"
}
```

---

#### `Validators.phone(value)`

Validates phone number.

**Example:**

```javascript
const error = Validators.phone("+1-555-1234");
// null (valid)
```

---

#### `Validators.date(value)`

Validates date format.

**Example:**

```javascript
const error = Validators.date("2025-11-27");
// null (valid)
```

---

#### `Validators.matches(value, otherValue, fieldName)`

Validates that two values match.

**Example:**

```javascript
const error = Validators.matches(password, confirmPassword, "Passwords");
if (error) {
  console.error(error); // "Passwords do not match"
}
```

---

### Domain Validators

#### `DomainValidators.wellnessRating(value, fieldName)`

Validates wellness rating (1-10).

**Example:**

```javascript
import { DomainValidators } from "./utils/validation.js";

const error = DomainValidators.wellnessRating(energyLevel, "Energy");
```

---

#### `DomainValidators.sleepHours(value)`

Validates sleep hours (0-24).

**Example:**

```javascript
const error = DomainValidators.sleepHours(7.5);
```

---

#### `DomainValidators.workoutDuration(value)`

Validates workout duration (1-300 minutes).

**Example:**

```javascript
const error = DomainValidators.workoutDuration(60);
```

---

### Form Validators

#### `FormValidators.loginForm(data)`

Validates login form data.

**Parameters:**

- `data` (object): Form data with `email` and `password`

**Returns:**

- (ValidationResult): Validation result

**Example:**

```javascript
import { FormValidators } from "./utils/validation.js";

const result = FormValidators.loginForm({
  email: userEmail,
  password: userPassword,
});

if (!result.isValid) {
  console.error(result.errors);
}
```

---

#### `FormValidators.registrationForm(data)`

Validates registration form data.

**Required Fields:**

- `name`: 2-100 characters
- `email`: Valid email
- `password`: Strong password
- `confirmPassword`: Matches password

**Example:**

```javascript
const result = FormValidators.registrationForm({
  name: "John Doe",
  email: "john@example.com",
  password: "SecurePass123",
  confirmPassword: "SecurePass123",
});
```

---

#### `FormValidators.wellnessForm(data)`

Validates wellness check-in form.

**Fields:**

- `sleep`: 0-24 hours (warning if < 6)
- `energy`: 1-10 rating (warning if ≤ 3)
- `mood`: 1-10 rating
- `stress`: 1-10 rating (warning if ≥ 7)
- `notes`: Max 500 characters

**Example:**

```javascript
const result = FormValidators.wellnessForm({
  sleep: 7,
  energy: 8,
  mood: 7,
  stress: 4,
  notes: "Feeling good today",
});

if (result.hasWarnings()) {
  console.warn(result.warnings);
}
```

---

#### `FormValidators.profileForm(data)`

Validates profile update form.

**Example:**

```javascript
const result = FormValidators.profileForm({
  name: "John Doe",
  email: "john@example.com",
  phone: "+1-555-1234",
});
```

---

### Utility Functions

#### `normalizeInput(value, type)`

Normalizes user input for consistent formatting.

**Note:** This function is for format normalization (lowercase, strip characters), NOT XSS prevention. For XSS prevention, use `escapeHtml()` from `sanitize.js`.

**Parameters:**

- `value` (any): Value to normalize
- `type` (string): Input type (optional, default: `'text'`)

**Types:**

- `'text'`: Trim whitespace
- `'email'`: Trim and lowercase
- `'number'`: Only digits, `.`, `-`
- `'phone'`: Only digits, spaces, `+-()`
- `'alphanumeric'`: Only letters, numbers, spaces

**Returns:**

- (string): Normalized value

**Example:**

```javascript
import { normalizeInput } from "./utils/validation.js";

const cleanEmail = normalizeInput("  USER@EXAMPLE.COM  ", "email");
// Result: 'user@example.com'

const cleanPhone = normalizeInput("(555) 123-4567!", "phone");
// Result: '(555) 123-4567'
```

---

#### `validateForm(formData, validatorName)`

Validates form data using named validator.

**Parameters:**

- `formData` (object): Form data to validate
- `validatorName` (string): Validator name from FormValidators

**Returns:**

- (ValidationResult): Validation result

**Example:**

```javascript
import { validateForm } from "./utils/validation.js";

const result = validateForm(formData, "registrationForm");

if (!result.isValid) {
  displayValidationErrors(result, formElement);
}
```

---

#### `displayValidationErrors(result, formElement)`

Displays validation errors in UI.

**Parameters:**

- `result` (ValidationResult): Validation result
- `formElement` (HTMLElement): Form element

**Returns:**

- (void)

**Example:**

```javascript
import { displayValidationErrors } from "./utils/validation.js";

const result = validateForm(data, "loginForm");
displayValidationErrors(result, document.getElementById("loginForm"));
```

**Features:**

- Clears previous errors
- Adds `.input-error` class to invalid inputs
- Inserts error messages below inputs
- Shows warnings in orange
- Focuses first error field

---

## Application Constants

**File:** `src/js/config/app-constants.js`

Centralized constants to avoid hardcoded values throughout the codebase.

### UI Constants

```javascript
export const UI = {
  // Breakpoints (pixels)
  BREAKPOINT_MOBILE: 768,
  BREAKPOINT_TABLET: 1024,
  BREAKPOINT_DESKTOP: 1280,

  // Animation durations (milliseconds)
  ANIMATION_FAST: 150,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500,

  // Notification durations (milliseconds)
  NOTIFICATION_SHORT: 3000,
  NOTIFICATION_NORMAL: 5000,
  NOTIFICATION_LONG: 8000,
  NOTIFICATION_ERROR: 10000,

  // Z-index layers
  Z_INDEX_DROPDOWN: 1000,
  Z_INDEX_MODAL: 9999,
  Z_INDEX_NOTIFICATION: 10000,
  Z_INDEX_TOOLTIP: 10001,

  // Loading states
  LOADING_MIN_DISPLAY: 300,
  LOADING_DEBOUNCE: 100,
};
```

### Data Limits

```javascript
export const DATA_LIMITS = {
  // Storage limits
  MAX_WORKOUTS_STORED: 50,
  MAX_WELLNESS_ENTRIES: 365,
  MAX_NOTIFICATIONS: 100,

  // Input limits
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 254,
  MAX_PASSWORD_LENGTH: 128,
  MIN_PASSWORD_LENGTH: 8,
  MAX_MESSAGE_LENGTH: 1000,
  MAX_NOTES_LENGTH: 500,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};
```

### Authentication Constants

```javascript
export const AUTH = {
  SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
  SESSION_WARNING_TIME: 5 * 60 * 1000, // 5 minutes
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBER: true,
  PASSWORD_REQUIRE_SPECIAL: false,
};
```

### Network Constants

```javascript
export const NETWORK = {
  // Timeouts (milliseconds)
  API_TIMEOUT: 30000,
  API_TIMEOUT_SHORT: 10000,
  API_TIMEOUT_LONG: 60000,

  // Retry settings
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  RETRY_BACKOFF_MULTIPLIER: 2,

  // Cache settings
  CACHE_DURATION_SHORT: 5 * 60 * 1000,
  CACHE_DURATION_MEDIUM: 15 * 60 * 1000,
  CACHE_DURATION_LONG: 60 * 60 * 1000,

  // Debounce/throttle
  SEARCH_DEBOUNCE: 300,
  SCROLL_THROTTLE: 100,
};
```

### Wellness Constants

```javascript
export const WELLNESS = {
  // Scale ranges
  MIN_RATING: 1,
  MAX_RATING: 10,
  DEFAULT_RATING: 5,

  // Sleep ranges (hours)
  MIN_SLEEP: 0,
  MAX_SLEEP: 24,
  RECOMMENDED_SLEEP_MIN: 7,
  RECOMMENDED_SLEEP_MAX: 9,

  // Hydration (glasses/day)
  RECOMMENDED_HYDRATION: 8,

  // Warning thresholds
  LOW_ENERGY_THRESHOLD: 3,
  HIGH_STRESS_THRESHOLD: 7,
  LOW_SLEEP_HOURS: 6,
};
```

### Storage Keys

```javascript
export const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  USER_DATA: "userData",
  WELLNESS_HISTORY: "wellnessHistory",
  WORKOUT_HISTORY: "workoutHistory",
  PREFERENCES: "userPreferences",
  THEME: "themePreference",
  LANGUAGE: "languagePreference",
  NOTIFICATIONS: "notificationHistory",
  CACHE_PREFIX: "cache_",
  CSRF_TOKEN: "__csrf_token",
};
```

### Helper Functions

#### `isMobile()`

Returns true if viewport width < 768px.

#### `isTablet()`

Returns true if viewport width 768-1279px.

#### `isDesktop()`

Returns true if viewport width ≥ 1280px.

**Example:**

```javascript
import { isMobile, UI } from "./config/app-constants.js";

if (isMobile()) {
  // Mobile-specific layout
}
```

---

## Version History

**1.0.0** (November 2025)

- Initial release
- All utilities documented
- Complete API reference

---

## Support

For questions or issues with the utilities:

- Check [Developer Guide](./DEVELOPER_GUIDE.md) for how-to guides
- See [Security Documentation](./SECURITY.md) for security-specific guidance
- Review [Architecture Documentation](./ARCHITECTURE.md) for design decisions

---

**Last Updated:** November 27, 2025

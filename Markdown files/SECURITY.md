# FlagFit Pro - Security Documentation

**Version:** 1.0.0
**Last Updated:** November 2025
**Status:** Production

## Table of Contents

1. [Overview](#overview)
2. [Security Architecture](#security-architecture)
3. [XSS Protection](#xss-protection)
4. [CSRF Protection](#csrf-protection)
5. [Input Sanitization](#input-sanitization)
6. [Authentication Security](#authentication-security)
7. [Best Practices](#best-practices)
8. [Security Checklist](#security-checklist)
9. [Troubleshooting](#troubleshooting)

---

## Overview

FlagFit Pro implements comprehensive security measures to protect user data and prevent common web vulnerabilities. This document outlines all security implementations and provides guidelines for developers.

### Security Principles

- **Defense in Depth**: Multiple layers of security controls
- **Least Privilege**: Minimal access rights for operations
- **Fail Secure**: Default deny approach
- **Input Validation**: All user inputs are validated and sanitized
- **Output Encoding**: All dynamic content is properly encoded

---

## Security Architecture

### Security Layers

```
┌─────────────────────────────────────────┐
│         Client-Side Security            │
├─────────────────────────────────────────┤
│ • Input Validation                      │
│ • XSS Prevention (sanitize.js)          │
│ • CSRF Token Management                 │
│ • Secure Storage (sessionStorage)       │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│      Network Security (TLS/HTTPS)       │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│         Server-Side Security            │
├─────────────────────────────────────────┤
│ • Authentication & Authorization        │
│ • CSRF Token Validation                 │
│ • Rate Limiting                         │
│ • SQL Injection Prevention              │
└─────────────────────────────────────────┘
```

### Security Components

| Component           | Location                             | Purpose                              |
| ------------------- | ------------------------------------ | ------------------------------------ |
| **Sanitization**    | `src/js/utils/sanitize.js`           | XSS prevention, HTML escaping        |
| **CSRF Protection** | `src/js/security/csrf-protection.js` | CSRF token generation and validation |
| **Validation**      | `src/js/utils/validation.js`         | Input validation and sanitization    |
| **Error Handling**  | `src/js/utils/error-handling.js`     | Secure error handling                |

---

## XSS Protection

### Overview

Cross-Site Scripting (XSS) is prevented through comprehensive input sanitization and output encoding.

### Implementation Strategy

#### 1. HTML Escaping

All user-generated content is escaped before insertion into the DOM:

```javascript
import { escapeHtml } from "./utils/sanitize.js";

// SAFE: Escape user input
element.innerHTML = escapeHtml(userInput);
```

**Escaped Characters:**

- `&` → `&amp;`
- `<` → `&lt;`
- `>` → `&gt;`
- `"` → `&quot;`
- `'` → `&#039;`
- `/` → `&#x2F;`

#### 2. URL Sanitization

URLs are validated to prevent `javascript:`, `data:`, and other dangerous protocols:

```javascript
import { sanitizeUrl } from "./utils/sanitize.js";

// SAFE: Only allows safe protocols (https, mailto, tel, sms)
link.href = sanitizeUrl(userProvidedUrl);
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

#### 3. Safe DOM Element Creation

The safest approach is creating actual DOM elements instead of HTML strings:

```javascript
import { createSafeElement } from "./utils/sanitize.js";

// SAFE: Creates DOM element with automatic sanitization
const userCard = createSafeElement(
  "div",
  {
    class: "user-card",
    id: `user-${userId}`,
    href: sanitizeUrl(userWebsite), // Auto-sanitized for href/src
  },
  userName,
); // Text content is safely set
```

#### 4. Rich Text Sanitization

For limited rich text (bold, italic, links):

```javascript
import { sanitizeRichText } from "./utils/sanitize.js";

// SAFE: Allows only specific safe tags
element.innerHTML = sanitizeRichText(userContent);
```

**Allowed Tags:**

- `<b>`, `<strong>` (bold)
- `<i>`, `<em>` (italic)
- `<br>` (line break)

### XSS Prevention Examples

#### Example 1: Displaying User Names

```javascript
// ❌ UNSAFE
element.innerHTML = userName;

// ✅ SAFE - Option 1: Use textContent
element.textContent = userName;

// ✅ SAFE - Option 2: Escape HTML
element.innerHTML = escapeHtml(userName);

// ✅ SAFE - Option 3: Create safe element
const nameElement = createSafeElement("span", { class: "user-name" }, userName);
container.appendChild(nameElement);
```

#### Example 2: Displaying User Comments

```javascript
// ❌ UNSAFE
commentDiv.innerHTML = userComment;

// ✅ SAFE - Escape and allow safe formatting
commentDiv.innerHTML = sanitizeRichText(userComment);
```

#### Example 3: User Profile Links

```javascript
// ❌ UNSAFE - Could be javascript:alert(1)
link.href = userProvidedUrl;

// ✅ SAFE - Validates and sanitizes URL
link.href = sanitizeUrl(userProvidedUrl);
```

---

## CSRF Protection

### Overview

Cross-Site Request Forgery (CSRF) protection is implemented using cryptographically secure tokens with the Synchronizer Token Pattern.

### Implementation

#### 1. Token Generation

CSRF tokens are automatically generated on application initialization:

```javascript
import csrfProtection from "./security/csrf-protection.js";

// Token is automatically generated using Web Crypto API
// 32-byte cryptographically secure random token
```

#### 2. Adding Tokens to Requests

**Fetch API:**

```javascript
// Automatic token addition to fetch requests
const options = csrfProtection.addTokenToRequest({
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
});

fetch("/api/endpoint", options);
```

**Form Data:**

```javascript
// Add to FormData
const formData = new FormData();
formData.append("name", userName);
csrfProtection.addTokenToFormData(formData);

fetch("/api/upload", {
  method: "POST",
  body: formData,
});
```

**HTML Forms:**

```html
<!-- Add meta tag to page head -->
<script>
  document.head.insertAdjacentHTML("beforeend", csrfProtection.getMetaTag());
</script>
```

#### 3. Token Rotation

Rotate tokens after sensitive operations:

```javascript
// After login
csrfProtection.rotateToken();

// After password change
csrfProtection.rotateToken();
```

#### 4. Token Cleanup

Clear tokens on logout:

```javascript
// On logout
csrfProtection.clearToken();
```

### CSRF Protection Examples

#### Example 1: API POST Request

```javascript
async function saveWellnessData(data) {
  const options = csrfProtection.addTokenToRequest({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const response = await fetch("/api/wellness", options);
  return response.json();
}
```

#### Example 2: Protected Methods Check

```javascript
function makeRequest(method, url, data) {
  let options = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  // Only add CSRF token for state-changing methods
  if (csrfProtection.requiresProtection(method)) {
    options = csrfProtection.addTokenToRequest(options);
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  return fetch(url, options);
}
```

#### Example 3: Token Validation (Server-Side)

```javascript
// Server-side validation example
function validateCSRFToken(req, res, next) {
  const token = req.headers["x-csrf-token"];
  const sessionToken = req.session.csrfToken;

  // Use constant-time comparison
  if (!token || !csrfProtection.validateToken(token, sessionToken)) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }

  next();
}
```

### CSRF Token Storage

- **Storage Location**: `sessionStorage` (not `localStorage`)
- **Key**: `__csrf_token`
- **Scope**: Per-session (cleared on browser close)
- **Header Name**: `X-CSRF-Token`

---

## Input Sanitization

### Overview

All user inputs are validated and sanitized before processing to prevent injection attacks and data corruption.

### Sanitization Functions

#### 1. Input Normalization (Format Cleanup)

**Note:** For XSS prevention, use `escapeHtml()` from `sanitize.js`. The function below is for format normalization only.

```javascript
import { normalizeInput } from "./utils/validation.js";

// Text input
const cleanText = normalizeInput(userInput, "text");

// Email
const cleanEmail = normalizeInput(userEmail, "email"); // Lowercase

// Number
const cleanNumber = normalizeInput(userNumber, "number"); // Only digits and ./-

// Phone
const cleanPhone = normalizeInput(userPhone, "phone"); // Only digits and ()+-

// Alphanumeric
const cleanCode = normalizeInput(userCode, "alphanumeric"); // Only a-z, A-Z, 0-9
```

#### 2. Validation with Sanitization

```javascript
import { Validators } from "./utils/validation.js";

// Email validation
const emailError = Validators.email(userEmail);
if (emailError) {
  showError(emailError);
}

// Password strength
const passwordError = Validators.password(userPassword);
if (passwordError) {
  showError(passwordError);
}

// Length validation
const nameError = Validators.length(userName, 2, 100, "Name");
if (nameError) {
  showError(nameError);
}
```

### Input Validation Best Practices

1. **Validate on Both Client and Server**: Client-side validation improves UX, server-side prevents bypass
2. **Whitelist, Don't Blacklist**: Define what's allowed, not what's forbidden
3. **Sanitize Before Storage**: Clean data before database insertion
4. **Escape Before Output**: Sanitize when displaying, even if sanitized on input
5. **Use Type-Specific Validation**: Different rules for email, phone, URL, etc.

### Dangerous Input Patterns

```javascript
// ❌ DANGEROUS PATTERNS TO AVOID

// SQL Injection vector
const query = `SELECT * FROM users WHERE id = ${userId}`;

// XSS vector
element.innerHTML = userInput;

// Command Injection vector
exec(`convert ${userFilename} output.jpg`);

// Path Traversal vector
fs.readFile(`./uploads/${userFilename}`);

// ✅ SAFE ALTERNATIVES

// Use parameterized queries
const query = "SELECT * FROM users WHERE id = $1";
db.query(query, [userId]);

// Escape or use textContent
element.textContent = userInput;

// Validate filename
const safeName = userFilename.replace(/[^a-zA-Z0-9.-]/g, "");
exec(`convert "${safeName}" output.jpg`);

// Validate path components
const safePath = path.join("./uploads", path.basename(userFilename));
fs.readFile(safePath);
```

---

## Authentication Security

### Session Management

#### Session Timeout

```javascript
// From app-constants.js
export const AUTH = {
  SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
  SESSION_WARNING_TIME: 5 * 60 * 1000, // 5 min warning
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 min before expiry
};
```

#### Session Security Features

1. **Automatic Timeout**: Sessions expire after 2 hours of inactivity
2. **Warning Before Expiry**: Users warned 5 minutes before timeout
3. **Token Refresh**: Tokens refreshed automatically before expiry
4. **Secure Storage**: Tokens stored in `sessionStorage`, not `localStorage`

### Password Security

#### Password Requirements

```javascript
// From app-constants.js
export const AUTH = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBER: true,
  PASSWORD_REQUIRE_SPECIAL: false,
};
```

#### Password Validation

```javascript
import { Validators } from "./utils/validation.js";

const passwordError = Validators.password(password);
// Checks for:
// - Minimum 8 characters
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one number
```

### Login Security

#### Brute Force Protection

```javascript
export const AUTH = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
};
```

#### Secure Login Flow

1. **Rate Limiting**: Maximum 5 login attempts
2. **Account Lockout**: 15-minute lockout after failed attempts
3. **CSRF Protection**: CSRF token required for login
4. **Session Regeneration**: New session ID after successful login
5. **Token Rotation**: CSRF token rotated after login

---

## Best Practices

### For Developers

#### 1. Always Sanitize User Input

```javascript
// ✅ DO
import { escapeHtml, sanitizeUrl } from "./utils/sanitize.js";

element.innerHTML = escapeHtml(userInput);
link.href = sanitizeUrl(userUrl);

// ❌ DON'T
element.innerHTML = userInput;
link.href = userUrl;
```

#### 2. Use Safe DOM Manipulation

```javascript
// ✅ DO - Use textContent for text
element.textContent = userInput;

// ✅ DO - Use createSafeElement for HTML
const el = createSafeElement("div", { class: "user-card" }, userName);

// ❌ DON'T - Use innerHTML with unsanitized input
element.innerHTML = userInput;
```

#### 3. Protect All State-Changing Requests

```javascript
// ✅ DO - Add CSRF token to POST/PUT/DELETE
const options = csrfProtection.addTokenToRequest({
  method: "POST",
  body: JSON.stringify(data),
});

// ❌ DON'T - Forget CSRF protection
fetch("/api/data", {
  method: "POST",
  body: JSON.stringify(data),
});
```

#### 4. Validate All Inputs

```javascript
// ✅ DO - Validate before processing
const result = validateForm(formData, "registrationForm");
if (!result.isValid) {
  displayValidationErrors(result, formElement);
  return;
}

// ❌ DON'T - Trust user input
saveUser(formData);
```

#### 5. Handle Errors Securely

```javascript
// ✅ DO - Show generic error to user, log details
import { handleError } from './utils/error-handling.js';

try {
  await riskyOperation();
} catch (error) {
  handleError(error, {
    context: 'User Registration',
    showToUser: true,
    fallbackMessage: 'Registration failed. Please try again.'
  });
}

// ❌ DON'T - Expose sensitive error details
catch (error) {
  alert(error.stack); // Exposes internal details
}
```

### Security Code Review Checklist

- [ ] All user inputs are validated
- [ ] All dynamic content is escaped/sanitized
- [ ] CSRF tokens used for POST/PUT/DELETE
- [ ] No hardcoded credentials or secrets
- [ ] Errors don't expose sensitive information
- [ ] URLs validated before use in href/src
- [ ] File uploads validated for type and size
- [ ] Session timeout implemented
- [ ] No SQL queries with string concatenation
- [ ] No `eval()` or `new Function()` with user input

---

## Security Checklist

### Pre-Deployment Security Audit

#### Input Validation

- [ ] All form inputs validated client-side
- [ ] All API inputs validated server-side
- [ ] Email addresses validated with regex
- [ ] Phone numbers validated with regex
- [ ] URLs sanitized before use
- [ ] File uploads restricted by type and size

#### XSS Prevention

- [ ] All user-generated content escaped
- [ ] innerHTML usage reviewed and secured
- [ ] URL sanitization in place
- [ ] Rich text sanitized if allowed
- [ ] No `eval()` or `new Function()` with user data

#### CSRF Protection

- [ ] CSRF tokens generated securely
- [ ] Tokens included in all state-changing requests
- [ ] Token rotation after sensitive operations
- [ ] Token cleanup on logout

#### Authentication & Authorization

- [ ] Password requirements enforced
- [ ] Session timeout configured
- [ ] Brute force protection enabled
- [ ] Token refresh implemented
- [ ] Logout clears all tokens and sessions

#### Data Protection

- [ ] Sensitive data encrypted in transit (HTTPS)
- [ ] Passwords hashed (never stored plain text)
- [ ] PII identified and protected
- [ ] Minimal data collected
- [ ] Data retention policy enforced

#### Error Handling

- [ ] Generic error messages for users
- [ ] Detailed errors logged server-side
- [ ] No stack traces exposed to users
- [ ] Error logging doesn't include sensitive data

---

## Troubleshooting

### Common Security Issues

#### Issue: "Invalid CSRF token" Error

**Symptoms:**

- POST/PUT/DELETE requests fail with 403 error
- Console shows "Invalid CSRF token"

**Solutions:**

1. **Check token generation:**

```javascript
// Verify token exists
console.log(csrfProtection.getToken());
```

2. **Verify token in request:**

```javascript
// Check headers
const headers = csrfProtection.getHeaders();
console.log(headers); // Should show X-CSRF-Token
```

3. **Rotate token if stale:**

```javascript
csrfProtection.rotateToken();
```

#### Issue: User Input Being Stripped

**Symptoms:**

- User input appears empty after sanitization
- Special characters removed unexpectedly

**Solutions:**

1. **Check sanitization type:**

```javascript
// Wrong type may strip valid characters
const clean = normalizeInput(input, "alphanumeric"); // Strips spaces
const clean = normalizeInput(input, "text"); // Preserves spaces
```

2. **Use appropriate validator:**

```javascript
// For rich text, use sanitizeRichText
const clean = sanitizeRichText(input); // Allows safe HTML tags
```

#### Issue: Session Timeout Too Aggressive

**Symptoms:**

- Users logged out unexpectedly
- "Session expired" messages frequent

**Solutions:**

1. **Adjust timeout in constants:**

```javascript
// In app-constants.js
export const AUTH = {
  SESSION_TIMEOUT: 4 * 60 * 60 * 1000, // Increase to 4 hours
};
```

2. **Implement activity tracking:**

```javascript
// Reset timeout on user activity
window.addEventListener("click", () => {
  sessionManager.resetTimeout();
});
```

#### Issue: XSS Still Occurring

**Symptoms:**

- Scripts executing from user input
- Alert boxes or redirects from user content

**Solutions:**

1. **Audit all innerHTML usage:**

```bash
# Search for dangerous patterns
grep -r "innerHTML.*=" src/
```

2. **Replace with safe alternatives:**

```javascript
// ❌ UNSAFE
element.innerHTML = data;

// ✅ SAFE
element.textContent = data;
// or
element.innerHTML = escapeHtml(data);
```

3. **Enable Content Security Policy:**

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'"
/>
```

---

## Additional Resources

### Internal Documentation

- [Utilities API Reference](./UTILITIES.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)
- [Architecture Documentation](./ARCHITECTURE.md)

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

---

## Security Contact

For security issues or concerns:

**DO NOT** create public GitHub issues for security vulnerabilities.

**Contact:** security@flagfitpro.com

**Response Time:** 24-48 hours for security reports

---

**Document Version:** 1.0.0
**Last Review Date:** November 27, 2025
**Next Review Date:** February 27, 2026

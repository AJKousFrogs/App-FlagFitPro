# 🔒 Security Implementation Guide

## Remaining Security Hardening Tasks

**Created**: 2025-11-29
**Status**: Ready for Implementation

This guide provides step-by-step instructions for implementing the remaining security improvements identified in the comprehensive security audit.

---

## ✅ COMPLETED FIXES

### Critical (3/3)

1. ✅ **Credential Rotation Guide** - See `SECURITY_CREDENTIAL_ROTATION.md`
2. ✅ **Function() Constructor** - Fixed in `src/undo-manager.js`
3. ✅ **document.write()** - Fixed in `analytics.html`

### High Priority (4/8)

4. ✅ **Password Strength Sanitization** - Fixed in `login.html`
5. ✅ **Injury Data Sanitization** - Fixed in `src/js/pages/dashboard-page.js`
6. ✅ **Chat Message Sanitization** - Fixed in `src/js/pages/chat-page.js`
7. ✅ **Exercise Data Sanitization** - Fixed in `src/js/pages/exercise-library-page.js`

---

## 🔧 REMAINING HIGH PRIORITY FIXES

### 8. SQL Injection Protection - Knowledge Search

**File**: `netlify/functions/knowledge-search.cjs`
**Priority**: HIGH
**Estimated Time**: 30 minutes

**Issue**: Dynamic query construction with category filter could be vulnerable.

**Implementation**:

```javascript
// Add at the top of the file
const ALLOWED_CATEGORIES = [
  "training",
  "nutrition",
  "recovery",
  "technique",
  "mental",
  "injury",
];

// In the handler function, before the query:
if (category) {
  if (!ALLOWED_CATEGORIES.includes(category)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: "Invalid category",
        allowed: ALLOWED_CATEGORIES,
      }),
    };
  }
}

// Also validate query parameter
if (query && query.length > 500) {
  return {
    statusCode: 400,
    headers,
    body: JSON.stringify({ error: "Query too long (max 500 characters)" }),
  };
}
```

**Testing**:

```bash
# Test with invalid category
curl -X POST https://your-site.com/.netlify/functions/knowledge-search \
  -H "Content-Type: application/json" \
  -d '{"query":"test","category":"invalid"}'

# Should return 400 error
```

---

### 9. Backend Rate Limiting

**Files**: All `netlify/functions/*.cjs`
**Priority**: HIGH
**Estimated Time**: 2-3 hours

**Implementation**:

**Step 1**: Create rate limiting middleware

```javascript
// netlify/functions/utils/rate-limiter.cjs

class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanup();
  }

  cleanup() {
    // Clean up old entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.requests.entries()) {
        if (now > data.resetTime) {
          this.requests.delete(key);
        }
      }
    }, 300000);
  }

  check(identifier, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now > record.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    record.count++;
    const remaining = Math.max(0, maxRequests - record.count);

    if (record.count > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      };
    }

    return { allowed: true, remaining };
  }
}

const limiter = new RateLimiter();

module.exports = { limiter };
```

**Step 2**: Apply to auth endpoints

```javascript
// netlify/functions/auth-login.cjs

const { limiter } = require("./utils/rate-limiter.cjs");

exports.handler = async (event, context) => {
  // Get IP address
  const ip =
    event.headers["x-forwarded-for"] || event.headers["client-ip"] || "unknown";

  // Check rate limit: 5 attempts per 15 minutes for login
  const limit = limiter.check(ip, 5, 900000);

  if (!limit.allowed) {
    return {
      statusCode: 429,
      headers: {
        "Retry-After": limit.retryAfter,
        "X-RateLimit-Limit": "5",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": new Date(
          Date.now() + limit.retryAfter * 1000,
        ).toISOString(),
      },
      body: JSON.stringify({
        error: "Too many login attempts",
        retryAfter: limit.retryAfter,
      }),
    };
  }

  // Add rate limit headers to response
  const headers = {
    "Content-Type": "application/json",
    "X-RateLimit-Limit": "5",
    "X-RateLimit-Remaining": limit.remaining.toString(),
  };

  // ... rest of login logic
};
```

**Step 3**: Apply to other sensitive endpoints

- **auth-register.cjs**: 3 attempts per hour
- **auth-reset-password.cjs**: 3 attempts per hour
- **validation.cjs**: 100 requests per minute (general API)

---

### 10. Fix Weak JWT Secret Default

**File**: `netlify/functions/auth-register.cjs`
**Priority**: HIGH
**Estimated Time**: 10 minutes

**Current Code** (Line 9-10):

```javascript
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
```

**Fix**:

```javascript
// SECURITY: Never use default JWT secret - fail fast if not configured
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error(
    "CRITICAL: JWT_SECRET environment variable must be set and at least 32 characters",
  );
  throw new Error("JWT_SECRET environment variable is required for security");
}

// Optional: Additional validation
if (JWT_SECRET === "your-super-secret-jwt-key-change-in-production") {
  throw new Error(
    "JWT_SECRET cannot use default value - please set a secure secret",
  );
}
```

**Testing**:

```bash
# Test locally without JWT_SECRET
# netlify dev
# Should show error and refuse to start

# Set proper secret
# netlify env:set JWT_SECRET $(openssl rand -base64 32)
```

---

### 11. Sanitize URL Parameters

**File**: `reset-password.html`
**Priority**: HIGH
**Estimated Time**: 15 minutes

**Current Code** (Lines 368-369):

```javascript
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

if (token) {
  showPasswordResetForm(token);
}
```

**Fix**:

```javascript
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

// SECURITY: Validate token format before using
// Expected format: alphanumeric, 32-128 characters
const TOKEN_REGEX = /^[a-zA-Z0-9-_]{32,128}$/;

if (token) {
  if (!TOKEN_REGEX.test(token)) {
    console.warn("[Security] Invalid reset token format");
    showMessage(
      "errorMessage",
      "Invalid or malformed reset link. Please request a new password reset.",
    );
    return;
  }

  // Additional validation: check if token looks like JWT
  const tokenParts = token.split(".");
  if (tokenParts.length === 3) {
    // Likely a JWT - validate structure
    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      if (!payload.exp || payload.exp < Date.now() / 1000) {
        showMessage(
          "errorMessage",
          "Reset link has expired. Please request a new one.",
        );
        return;
      }
    } catch (e) {
      console.warn("[Security] Invalid token structure");
      showMessage("errorMessage", "Invalid reset link format.");
      return;
    }
  }

  showPasswordResetForm(token);
} else {
  // Show email request form
  showEmailForm();
}
```

**Also apply to**:

- Any other pages using URL parameters
- OAuth callback handlers
- Redirect URLs

---

## 🟡 MEDIUM PRIORITY FIXES

### 12. Backend CSRF Validation

**Priority**: MEDIUM
**Estimated Time**: 1-2 hours

**Implementation**:

```javascript
// netlify/functions/utils/csrf-validator.cjs

function validateCSRF(event) {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (["GET", "HEAD", "OPTIONS"].includes(event.httpMethod)) {
    return { valid: true };
  }

  const csrfToken = event.headers["x-csrf-token"];
  const cookie = event.headers["cookie"];

  if (!cookie) {
    return { valid: false, error: "No session cookie" };
  }

  // Extract CSRF token from cookie
  const cookieMatch = cookie.match(/csrf_token=([^;]+)/);
  const cookieToken = cookieMatch ? cookieMatch[1] : null;

  if (!csrfToken || !cookieToken) {
    return { valid: false, error: "Missing CSRF token" };
  }

  // Compare tokens (constant-time comparison to prevent timing attacks)
  if (csrfToken !== cookieToken) {
    return { valid: false, error: "CSRF token mismatch" };
  }

  return { valid: true };
}

module.exports = { validateCSRF };
```

**Usage in endpoints**:

```javascript
const { validateCSRF } = require("./utils/csrf-validator.cjs");

exports.handler = async (event, context) => {
  // Validate CSRF for state-changing operations
  const csrf = validateCSRF(event);
  if (!csrf.valid) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: csrf.error || "CSRF validation failed" }),
    };
  }

  // ... rest of handler
};
```

---

### 13. Password Complexity Validation (Backend)

**File**: `netlify/functions/validation.cjs`
**Priority**: MEDIUM
**Estimated Time**: 30 minutes

**Add after line 76**:

```javascript
// Enhanced password validation function
function validatePasswordComplexity(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  if (password.length > 128) {
    errors.push("Password must be less than 128 characters");
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&#]/.test(password);

  const complexity = [
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar,
  ].filter(Boolean).length;

  if (complexity < 3) {
    errors.push(
      "Password must contain at least 3 of: uppercase letters, lowercase letters, numbers, special characters (@$!%*?&#)",
    );
  }

  // Check for common weak passwords
  const commonPasswords = [
    "password",
    "12345678",
    "qwerty",
    "abc123",
    "monkey",
    "letmein",
    "trustno1",
    "dragon",
    "baseball",
    "iloveyou",
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push("Password is too common - please choose a stronger password");
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
}

// Update register schema validation
function validateBySchema(data, schemaName) {
  // ... existing code ...

  // Add password complexity check for register schema
  if (schemaName === "register" && data.password) {
    const passwordCheck = validatePasswordComplexity(data.password);
    if (!passwordCheck.valid) {
      return {
        valid: false,
        errors: { password: passwordCheck.errors },
      };
    }
  }

  // ... rest of validation
}
```

---

### 14. Security Headers

**File**: `netlify.toml`
**Priority**: MEDIUM
**Estimated Time**: 20 minutes

**Add to netlify.toml**:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    # Prevent clickjacking
    X-Frame-Options = "SAMEORIGIN"

    # Prevent MIME type sniffing
    X-Content-Type-Options = "nosniff"

    # Enable XSS protection (legacy browsers)
    X-XSS-Protection = "1; mode=block"

    # Referrer policy
    Referrer-Policy = "strict-origin-when-cross-origin"

    # Permissions policy
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"

[[headers]]
  for = "/*.html"
  [headers.values]
    # Content Security Policy
    Content-Security-Policy = """
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
      img-src 'self' data: https:;
      font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net;
      connect-src 'self' https://*.supabase.co wss://*.supabase.co;
      frame-ancestors 'self';
      base-uri 'self';
      form-action 'self';
    """

[[headers]]
  for = "/.netlify/functions/*"
  [headers.values]
    # API-specific headers
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"

    # CORS (adjust as needed)
    Access-Control-Allow-Origin = "https://your-domain.com"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type, Authorization, X-CSRF-Token"
```

**Note**: Adjust CSP policy based on your actual CDN and API usage.

---

### 15-26. Additional Medium/Low Priority Items

**15. Consistent Input Sanitization**

- Audit all form inputs
- Ensure validation on both frontend and backend
- Use whitelist approach when possible

**16. Secure Cookie Flags**

```javascript
// When setting cookies:
document.cookie = `auth_token=${token}; Secure; HttpOnly; SameSite=Strict; Max-Age=3600`;
```

**17. Missing HTTPS Enforcement**
Add to `netlify.toml`:

```toml
[[redirects]]
  from = "http://*"
  to = "https://:splat"
  status = 301
  force = true
```

**18. Autocomplete Settings**

```html
<!-- For password fields -->
<input type="password" name="new-password" autocomplete="new-password" />
<input
  type="password"
  name="current-password"
  autocomplete="current-password"
/>

<!-- Disable for sensitive data -->
<input type="text" name="credit-card" autocomplete="off" />
```

**19. Subresource Integrity (SRI)**

```html
<!-- Add integrity hashes to CDN scripts -->
<script
  src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"
  integrity="sha384-..."
  crossorigin="anonymous"
></script>
```

Generate SRI hashes at: https://www.srihash.org/

**20. Error Message Sanitization**

```javascript
// Don't expose stack traces to users
try {
  // ... code
} catch (error) {
  console.error("[Internal]", error); // Log full error server-side
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: "An error occurred", // Generic message to user
    }),
  };
}
```

---

## 📝 IMPLEMENTATION CHECKLIST

### Phase 1: High Priority (Week 1)

- [ ] SQL injection protection (knowledge-search.cjs)
- [ ] Backend rate limiting (all functions)
- [ ] Fix JWT secret validation
- [ ] URL parameter sanitization
- [ ] Test all changes

### Phase 2: Medium Priority (Week 2)

- [ ] Backend CSRF validation
- [ ] Password complexity validation
- [ ] Security headers in netlify.toml
- [ ] Secure cookie flags
- [ ] HTTPS enforcement

### Phase 3: Polish (Week 3)

- [ ] Add SRI hashes to CDN scripts
- [ ] Consistent error handling
- [ ] Input validation audit
- [ ] Autocomplete attributes
- [ ] Security monitoring setup

---

## 🧪 TESTING GUIDE

### Security Testing Tools

**1. OWASP ZAP**

```bash
# Install
brew install --cask owasp-zap

# Run automated scan
zap-cli quick-scan --self-contained https://your-site.com
```

**2. SQLMap (SQL Injection)**

```bash
# Test knowledge search endpoint
sqlmap -u "https://your-site.com/.netlify/functions/knowledge-search" \
  --data='{"query":"test"}' \
  --level=5 --risk=3
```

**3. Manual Testing Checklist**

- [ ] Try XSS in all input fields
- [ ] Test CSRF protection
- [ ] Verify rate limiting
- [ ] Check security headers
- [ ] Test with invalid tokens
- [ ] Attempt SQL injection
- [ ] Test password requirements

---

## 📊 MONITORING & LOGGING

**Add to backend functions**:

```javascript
// Security event logging
function logSecurityEvent(type, details) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      type: type,
      severity: "warning",
      ...details,
    }),
  );
}

// Usage examples:
logSecurityEvent("rate_limit_exceeded", { ip, endpoint: "/auth-login" });
logSecurityEvent("invalid_token", { ip, tokenFormat: "malformed" });
logSecurityEvent("csrf_validation_failed", { ip, endpoint });
```

**Monitor in Netlify Dashboard**:

- Function logs
- Rate limiting metrics
- Error rates
- Failed login attempts

---

## 🔐 SECURITY MAINTENANCE

**Monthly Tasks**:

- [ ] Review security logs
- [ ] Update dependencies (`npm audit fix`)
- [ ] Rotate JWT secrets (if compromised)
- [ ] Review and update CSP policy
- [ ] Check for new OWASP Top 10 updates

**Quarterly Tasks**:

- [ ] Full security audit
- [ ] Penetration testing
- [ ] Review access controls
- [ ] Update security documentation

---

## 📚 RESOURCES

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)
- [Netlify Security](https://docs.netlify.com/security/)
- [Content Security Policy Reference](https://content-security-policy.com/)

---

**Last Updated**: 2025-11-29
**Maintained By**: Development Team
**Review Frequency**: Monthly

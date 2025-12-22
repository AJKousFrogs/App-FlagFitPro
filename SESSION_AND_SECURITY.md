# Session Management & Security
## FlagFit Pro - Security Implementation Guide

**Version**: 2.0
**Last Updated**: December 21, 2024
**Owner**: Security Engineering Team
**Classification**: Internal - Security Sensitive
**Review Frequency**: Quarterly + After Security Incidents

---

## Table of Contents

1. [Session Management](#session-management)
2. [Token Lifecycle](#token-lifecycle)
3. [CSRF Protection](#csrf-protection)
4. [Rate Limiting](#rate-limiting)
5. [Secure Storage](#secure-storage)
6. [Security Headers](#security-headers)
7. [Input Validation](#input-validation)
8. [Encryption](#encryption)
9. [Audit Logging](#audit-logging)
10. [OWASP Compliance](#owasp-compliance)
11. [GDPR Compliance](#gdpr-compliance)
12. [Security Monitoring](#security-monitoring)
13. [Incident Response](#incident-response)

---

## Session Management

### Session Structure

```javascript
{
  "access_token": "eyJhbGc...",      // JWT (1 hour expiry)
  "refresh_token": "v1.MRHS...",     // Refresh token (60 days)
  "expires_in": 3600,                // Seconds until access token expires
  "expires_at": 1703123456,          // Unix timestamp of expiry
  "token_type": "bearer",
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "email_verified": true,
    "role": "player",
    "provider": "email"
  }
}
```

### Session Storage Strategy

**localStorage vs sessionStorage**:

| Setting | Storage | Access Token Expiry | Refresh Token Expiry | Use Case |
|---------|---------|---------------------|----------------------|----------|
| Remember Me = true | localStorage | 1 hour | 60 days | User wants persistent login |
| Remember Me = false | sessionStorage | 1 hour | 24 hours | Shared/public device |

**Implementation**:
```javascript
// src/js/services/supabase-client.js
const storage = rememberMe ? localStorage : sessionStorage;

const supabase = createClient(url, key, {
  auth: {
    storage: storage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});
```

### Session Timeout Configuration

**Default Behavior**: Persistent sessions (no timeout)

**Optional Timeout** (disabled by default):
```javascript
// src/js/config/app-constants.js
export const AUTH = {
  // Session timeout disabled by default for persistent sessions
  ENABLE_SESSION_TIMEOUT: false, // Set to true to enable timeouts

  // Session timeout after 30 minutes of inactivity (if enabled)
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds

  // Show warning 5 minutes before timeout
  SESSION_WARNING_TIME: 5 * 60 * 1000, // 5 minutes

  // Minimum time between activity resets (prevent excessive resets)
  ACTIVITY_RESET_THRESHOLD: 5000, // 5 seconds

  // Debounce time for activity events
  ACTIVITY_DEBOUNCE_TIME: 1000, // 1 second
};
```

**Enable Session Timeout**:
```javascript
// In .env.local or environment configuration
VITE_ENABLE_SESSION_TIMEOUT=true
```

### Activity Tracking

**Tracked Events** (if timeout enabled):
```javascript
const activityEvents = [
  'mousedown',   // Click
  'keypress',    // Keyboard input
  'touchstart',  // Mobile touch
];
```

**Debounced Handler**:
```javascript
// src/auth-manager.js (lines 978-982)
const activityHandler = debounce(() => {
  if (this.token && this.user && Date.now() - lastActivity > AUTH.ACTIVITY_RESET_THRESHOLD) {
    resetSessionTimer();
  }
}, AUTH.ACTIVITY_DEBOUNCE_TIME);
```

### Multi-Session Management

**Current Implementation**:
- ✅ Multiple concurrent sessions allowed
- ✅ Independent session management per device
- ⚠️ Logout scope: **current session only** (default)

**Single Session Logout**:
```javascript
// Default behavior - logout current session only
await supabase.auth.signOut();
```

**Global Logout (All Sessions)**:
```javascript
// Logout from all devices
await supabase.auth.signOut({ scope: 'global' });
```

**UI Implementation**:
```html
<!-- In settings.html -->
<div class="logout-options">
  <button onclick="authManager.logout()">
    Log out from this device
  </button>
  <button onclick="authManager.logoutAllDevices()">
    Log out from all devices
  </button>
</div>
```

```javascript
// In auth-manager.js (add new method)
async logoutAllDevices() {
  const { error } = await supabase.auth.signOut({ scope: 'global' });

  if (!error) {
    this.clearAuth();
    this.showSuccess('Logged out from all devices');
    setTimeout(() => this.redirectToLogin(), 1000);
  }
}
```

---

## Token Lifecycle

### Token Expiration

**Access Token**:
- **Issued**: On login/registration
- **Expires**: 1 hour
- **Refresh**: Automatic (10 minutes before expiry)
- **Storage**: Encrypted in localStorage/sessionStorage

**Refresh Token**:
- **Issued**: On login/registration
- **Expires**: 60 days (Remember Me) or 24 hours (Session Only)
- **Usage**: To obtain new access tokens
- **Security**: Can only be used once (rotates on refresh)

### Automatic Token Refresh

**Supabase Client** (Primary):
```javascript
// Automatic refresh 10 minutes before expiry
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true, // ← Handles refresh automatically
    persistSession: true,
  }
});
```

**AuthManager Fallback**:
```javascript
// src/auth-manager.js (lines 884-917)
setupTokenRefresh() {
  // Backup check every hour
  setInterval(async () => {
    if (this.token && this.user) {
      const { data: { session } } = await supabase.auth.getSession();

      if (session && session.access_token !== this.token) {
        // Token was refreshed
        this.token = session.access_token;
        await secureStorage.setAuthToken(this.token);
        apiClient.setAuthToken(this.token);
        logger.debug('[Auth] Token refreshed via periodic check');
      }
    }
  }, 60 * 60 * 1000); // 1 hour
}
```

### Token Validation

**Client-Side Validation**:
```javascript
// src/auth-manager.js (lines 285-335)
async validateStoredToken(timeoutMs = 3000) {
  if (!this.token) return false;

  try {
    // Decode JWT and check expiry
    const payload = JSON.parse(atob(this.token.split('.')[1]));

    if (payload.exp && payload.exp <= Math.floor(Date.now() / 1000)) {
      // Token expired, try to refresh via Supabase
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        this.token = session.access_token;
        await secureStorage.setAuthToken(this.token);
        return true;
      }

      // Refresh failed, clear auth
      this.clearAuth();
      return false;
    }

    return true; // Token valid
  } catch (error) {
    // JWT parse error, check Supabase session
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      this.token = session.access_token;
      return true;
    }

    this.clearAuth();
    return false;
  }
}
```

**Server-Side Validation** (RLS):
```sql
-- Supabase automatically validates JWT signature and expiry
-- in Row Level Security policies

CREATE POLICY "Authenticated users can view own data"
ON user_profiles
FOR SELECT
USING (auth.uid() = id);
-- auth.uid() validates JWT and extracts user ID
```

### Token Rotation

**Refresh Token Rotation**:
```
User Login
  ↓
Issue: access_token_1 + refresh_token_1
  ↓
Wait 1 hour (access token expires)
  ↓
Use refresh_token_1 to get new tokens
  ↓
Issue: access_token_2 + refresh_token_2
  ↓
Invalidate refresh_token_1 (one-time use)
```

**Security Benefit**: Prevents replay attacks with stolen refresh tokens.

---

## CSRF Protection

### CSRF Token Management

**Token Generation**:
```javascript
// src/js/security/csrf-protection.js
class CSRFProtection {
  generateToken() {
    // Use crypto.randomBytes for cryptographically secure token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  rotateToken() {
    const token = this.generateToken();
    sessionStorage.setItem('csrf_token', token);
    document.cookie = `csrf_token=${token}; Path=/; Secure; SameSite=Strict`;
    return token;
  }
}
```

**Token Validation**:

**Frontend** (Include in requests):
```javascript
// src/api-config.js
const headers = {
  'Content-Type': 'application/json',
  'X-CSRF-Token': csrfProtection.getToken(),
};
```

**Backend** (Edge Function):
```javascript
// netlify/functions/utils/csrf-validator.cjs
function validateCSRF(event) {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(event.httpMethod)) {
    return { valid: true };
  }

  const csrfToken = event.headers['x-csrf-token'];
  const cookie = event.headers['cookie'];

  if (!cookie) {
    return { valid: false, error: 'No session cookie' };
  }

  // Extract CSRF token from cookie
  const cookieMatch = cookie.match(/csrf_token=([^;]+)/);
  const cookieToken = cookieMatch ? cookieMatch[1] : null;

  if (!csrfToken || !cookieToken) {
    return { valid: false, error: 'Missing CSRF token' };
  }

  // Constant-time comparison to prevent timing attacks
  if (csrfToken !== cookieToken) {
    return { valid: false, error: 'CSRF token mismatch' };
  }

  return { valid: true };
}
```

**CSRF Token Lifecycle**:
1. **Rotation on Login**: New token generated (line 1029)
2. **Validation on Requests**: All POST/PUT/DELETE require valid token
3. **Clear on Logout**: Token removed from storage (line 678)

### Double Submit Cookie Pattern

**Implementation**:
```
1. Generate CSRF token on login
2. Store in sessionStorage (accessible to JavaScript)
3. Store in HttpOnly + Secure cookie (sent automatically)
4. Include token in X-CSRF-Token header
5. Backend compares header token with cookie token
```

**Security Properties**:
- ✅ Prevents CSRF (attacker can't read sessionStorage)
- ✅ Prevents XSS token theft (cookie is HttpOnly)
- ✅ Constant-time comparison (prevents timing attacks)

---

## Rate Limiting

### Supabase Default Limits

| Operation | Limit | Window | Lockout |
|-----------|-------|--------|---------|
| Login attempts | 5 | 15 minutes | Until window expires |
| Registration | 3 | 1 hour | Until window expires |
| Password reset | 3 | 1 hour | Until window expires |
| Email verification | 5 | 1 hour | Until window expires |

### Custom Rate Limiting (Edge Functions)

**Implementation**:
```javascript
// netlify/functions/utils/rate-limiter.cjs
class RateLimiter {
  constructor() {
    this.requests = new Map();
  }

  check(identifier, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now > record.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    record.count++;
    const remaining = Math.max(0, maxRequests - record.count);

    if (record.count > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      };
    }

    return { allowed: true, remaining };
  }
}
```

**Usage in Auth Endpoints**:
```javascript
// netlify/functions/auth-login.cjs
const { limiter } = require('./utils/rate-limiter.cjs');

exports.handler = async (event) => {
  const ip = event.headers['x-forwarded-for'] || 'unknown';

  // Check rate limit: 5 attempts per 15 minutes
  const limit = limiter.check(ip, 5, 900000);

  if (!limit.allowed) {
    return {
      statusCode: 429,
      headers: {
        'Retry-After': limit.retryAfter,
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '0',
      },
      body: JSON.stringify({
        error: 'Too many login attempts',
        retryAfter: limit.retryAfter
      })
    };
  }

  // ... rest of login logic
};
```

### Rate Limit Response Headers

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2024-12-21T10:15:00Z
Retry-After: 900

{
  "error": "Too many login attempts",
  "retryAfter": 900
}
```

---

## Secure Storage

### Encryption Implementation

**AES-GCM Encryption**:
```javascript
// src/secure-storage.js
class SecureStorage {
  async encrypt(data) {
    // Generate random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derive encryption key from device fingerprint
    const key = await this.getEncryptionKey();

    // Encrypt data
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(JSON.stringify(data))
    );

    // Return IV + encrypted data
    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    };
  }

  async decrypt(encryptedData) {
    const key = await this.getEncryptionKey();

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(encryptedData.iv) },
      key,
      new Uint8Array(encryptedData.data)
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  }

  async getEncryptionKey() {
    // Derive key from device fingerprint + salt
    const fingerprint = await this.getDeviceFingerprint();
    const salt = new TextEncoder().encode('flagfit-pro-v1');

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(fingerprint),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
}
```

### Storage Locations

**Sensitive Data** (Encrypted):
- ✅ Authentication tokens
- ✅ User metadata
- ✅ CSRF tokens

**Non-Sensitive Data** (Plain):
- UI preferences
- Theme settings
- Language selection

**Never Store**:
- ❌ Passwords (plain or hashed)
- ❌ Credit card numbers
- ❌ Social Security Numbers
- ❌ Private keys

### Storage Cleanup

**On Logout**:
```javascript
// src/auth-manager.js (lines 670-680)
clearAuth() {
  this.user = null;
  this.token = null;
  secureStorage.clearAll(); // Removes all encrypted data
  apiClient.setAuthToken(null);
  csrfProtection.clearToken();
}
```

**On Account Deletion**:
```javascript
async deleteAccount() {
  // Delete user account from Supabase
  await supabase.auth.admin.deleteUser(userId);

  // Clear all local storage
  secureStorage.clearAll();
  localStorage.clear();
  sessionStorage.clear();

  // Clear cookies
  document.cookie.split(";").forEach(cookie => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  });
}
```

---

## Security Headers

### Content Security Policy (CSP)

**Implementation** (netlify.toml):
```toml
[[headers]]
  for = "/*.html"
  [headers.values]
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
```

**CSP Directives Explained**:
- `default-src 'self'`: Only load resources from same origin
- `script-src`: Allow scripts from CDNs (Chart.js, etc.)
- `style-src`: Allow Google Fonts and inline styles
- `connect-src`: Allow API calls to Supabase only
- `frame-ancestors`: Prevent clickjacking

### Additional Security Headers

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

    # HTTPS enforcement
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
```

### HTTPS Enforcement

```toml
[[redirects]]
  from = "http://*"
  to = "https://:splat"
  status = 301
  force = true
```

---

## Input Validation

### Frontend Validation

**Email Validation**:
```javascript
// RFC 5322 compliant
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  return EMAIL_REGEX.test(email) && email.length <= 255;
}
```

**Password Validation**:
```javascript
function validatePassword(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('Minimum 8 characters required');
  }

  if (password.length > 128) {
    errors.push('Maximum 128 characters allowed');
  }

  const complexity = [
    /[A-Z]/.test(password), // Uppercase
    /[a-z]/.test(password), // Lowercase
    /\d/.test(password),    // Number
    /[@$!%*?&#]/.test(password) // Special
  ].filter(Boolean).length;

  if (complexity < 3) {
    errors.push('Must contain 3 of: uppercase, lowercase, numbers, special characters');
  }

  return { valid: errors.length === 0, errors };
}
```

**SQL Injection Prevention**:
```javascript
// NEVER construct raw SQL queries
// ❌ WRONG
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ CORRECT - Use Supabase parameterized queries
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', email); // Automatically escaped
```

### XSS Prevention

**HTML Escaping**:
```javascript
// src/js/utils/html-escape.js
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str; // textContent auto-escapes
  return div.innerHTML;
}

// Usage
const userInput = "<script>alert('XSS')</script>";
element.innerHTML = escapeHTML(userInput);
// Result: &lt;script&gt;alert('XSS')&lt;/script&gt;
```

**DOMPurify** (for rich text):
```javascript
import DOMPurify from 'dompurify';

const dirty = userInput;
const clean = DOMPurify.sanitize(dirty, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href']
});
```

### Server-Side Validation

**Whitelist Approach**:
```javascript
// netlify/functions/knowledge-search.cjs
const ALLOWED_CATEGORIES = ['training', 'nutrition', 'recovery', 'technique'];

function validateCategory(category) {
  if (!ALLOWED_CATEGORIES.includes(category)) {
    throw new Error('Invalid category');
  }
  return category;
}
```

---

## Encryption

### Data at Rest

**Client-Side** (secureStorage):
- AES-GCM-256 encryption
- Device-specific key derivation
- Per-item IV (no IV reuse)

**Server-Side** (Supabase):
- AES-256 encryption for database at rest
- Encrypted backups
- Encrypted WAL logs

### Data in Transit

**HTTPS/TLS**:
- TLS 1.2+ enforced
- Perfect Forward Secrecy (PFS)
- HSTS headers

**WebSocket Security**:
```javascript
// Supabase Realtime uses WSS (WebSocket Secure)
wss://pvziciccwxgftcielknm.supabase.co/realtime/v1/websocket
```

### Password Hashing

**Supabase (bcrypt)**:
- Algorithm: bcrypt
- Salt rounds: 10
- Unique salt per password
- Never log or expose hashes

---

## Audit Logging

### Security Event Logging

**Logged Events**:
```javascript
const SECURITY_EVENTS = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  REGISTRATION: 'registration',
  PASSWORD_CHANGE: 'password_change',
  ROLE_CHANGE: 'role_change',
  EMAIL_VERIFIED: 'email_verified',
  TOKEN_REFRESH: 'token_refresh',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  CSRF_VALIDATION_FAILED: 'csrf_validation_failed',
  INVALID_TOKEN: 'invalid_token',
};
```

**Log Format**:
```json
{
  "timestamp": "2024-12-21T10:00:00.000Z",
  "event": "login_failed",
  "user_id": "uuid-or-null",
  "email": "user@example.com",
  "ip": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "correlation_id": "uuid-v4",
  "metadata": {
    "reason": "invalid_password",
    "attempt_count": 3
  }
}
```

**Non-PII Logging**:
```javascript
// ✅ CORRECT
logger.info('[Auth] Login attempt', {
  result: 'failed',
  reason: 'invalid_credentials',
  ip: hashedIP,
  correlation_id: correlationId
});

// ❌ WRONG - Never log passwords or tokens
logger.error('[Auth] Login failed', {
  password: password, // ← NEVER
  token: token        // ← NEVER
});
```

### Audit Trail Retention

| Event Type | Retention | Storage |
|------------|-----------|---------|
| Authentication events | 90 days | Supabase logs |
| Security incidents | 1 year | External SIEM |
| Access logs | 30 days | Netlify logs |
| Error logs | 7 days | Client + Server |

---

## OWASP Compliance

### OWASP Top 10 2021 Coverage

| Risk | Status | Mitigation |
|------|--------|------------|
| A01: Broken Access Control | ✅ Mitigated | RLS policies, role enforcement |
| A02: Cryptographic Failures | ✅ Mitigated | AES-GCM, TLS 1.2+, bcrypt |
| A03: Injection | ✅ Mitigated | Parameterized queries, input validation |
| A04: Insecure Design | ⚠️ Partial | Need role enforcement trigger (see TODO) |
| A05: Security Misconfiguration | ✅ Mitigated | CSP, security headers, HTTPS |
| A06: Vulnerable Components | 🔄 Ongoing | npm audit, dependency updates |
| A07: Authentication Failures | ✅ Mitigated | Supabase Auth, rate limiting, MFA-ready |
| A08: Software & Data Integrity | ✅ Mitigated | SRI hashes, signed tokens |
| A09: Security Logging | ✅ Implemented | Audit logs, correlation IDs |
| A10: SSRF | N/A | No server-side requests to user-controlled URLs |

### TODO: Address Insecure Design (A04)

**Action Required**: Implement role enforcement trigger (see AUTHENTICATION.md, Role Assignment section)

---

## GDPR Compliance

### Data Minimization

**Collected Data**:
- ✅ Email (required for authentication)
- ✅ Name (user-provided)
- ✅ Role (player/coach)
- ❌ No phone numbers
- ❌ No address
- ❌ No date of birth
- ❌ No payment info

**Data Storage**:
```javascript
// user_metadata (stored in Supabase)
{
  "name": "John Doe",
  "role": "player",
  "first_name": "John",
  "last_name": "Doe"
}
// NO excess PII
```

### Right to Erasure

**Account Deletion Flow**:
```javascript
// Backend: Supabase Edge Function or admin API
async function deleteUserAccount(userId) {
  // 1. Anonymize user data (if required for legal/business reasons)
  await supabase
    .from('user_profiles')
    .update({
      email: `deleted_${userId}@example.com`,
      name: 'Deleted User',
      deleted_at: new Date().toISOString()
    })
    .eq('id', userId);

  // 2. Delete auth record (cascades to related tables)
  await supabase.auth.admin.deleteUser(userId);

  // 3. Log deletion event
  await logSecurityEvent('account_deleted', { user_id: userId });

  return { success: true };
}
```

**Data Cascade Rules**:
```sql
-- Define cascade rules in database schema
ALTER TABLE user_training_sessions
ADD CONSTRAINT fk_user
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE; -- Delete training sessions when user deleted
```

### Right to Access

**Data Export**:
```javascript
async function exportUserData(userId) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  const { data: sessions } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('user_id', userId);

  const { data: analytics } = await supabase
    .from('user_analytics')
    .select('*')
    .eq('user_id', userId);

  return {
    profile,
    training_sessions: sessions,
    analytics: analytics,
    exported_at: new Date().toISOString()
  };
}
```

### Session Management for GDPR

**Multi-Device Sessions**:
- Document in Privacy Policy: "You can log out from all devices at any time"
- Implement `logoutAllDevices()` method
- Provide session management UI in Settings

---

## Security Monitoring

### Real-Time Alerts

**Alert Triggers**:
```javascript
const ALERT_THRESHOLDS = {
  FAILED_LOGINS: {
    count: 10,
    window: 5 * 60 * 1000, // 5 minutes
    severity: 'high'
  },
  CSRF_FAILURES: {
    count: 5,
    window: 60 * 1000, // 1 minute
    severity: 'critical'
  },
  RATE_LIMIT_EXCEEDED: {
    count: 100,
    window: 60 * 60 * 1000, // 1 hour
    severity: 'medium'
  }
};
```

**Alert Destinations**:
- Slack webhook
- Email (security team)
- PagerDuty (critical)
- Sentry (error tracking)

### Monitoring Dashboards

**Metrics to Track**:
- Login success rate
- Failed login attempts (per IP, per user)
- Token refresh failures
- CSRF validation failures
- Rate limit hits
- Session duration distribution
- Concurrent sessions per user

**Tools**:
- Supabase Dashboard (built-in analytics)
- Netlify Analytics
- Custom Grafana dashboard (optional)

---

## Incident Response

### Security Incident Classification

| Severity | Examples | Response Time | Escalation |
|----------|----------|---------------|------------|
| Critical | Data breach, Auth bypass | Immediate | CEO, Legal |
| High | Mass account takeover, SQL injection | 1 hour | CTO, Security Team |
| Medium | XSS vulnerability, CSRF bypass | 4 hours | Security Team |
| Low | Minor config issue | 24 hours | Dev Team |

### Incident Response Playbook

**Step 1: Detection**
- Automated alert triggers
- User report
- Security audit finding

**Step 2: Assessment**
- Severity classification
- Impact analysis
- Affected users count

**Step 3: Containment**
- Disable affected feature
- Revoke compromised tokens
- Block malicious IPs

**Step 4: Eradication**
- Deploy security patch
- Update security rules
- Rotate secrets

**Step 5: Recovery**
- Enable feature
- Monitor for recurrence
- Notify affected users

**Step 6: Post-Mortem**
- Root cause analysis
- Documentation update
- Process improvements

### Communication Plan

**Internal**:
1. Security Team → CTO (immediate)
2. CTO → CEO (if critical)
3. Engineering Team → All hands (if needed)

**External**:
1. Affected users → Email notification
2. Public disclosure → If required by law (GDPR, etc.)
3. Security community → If vulnerability in open-source component

---

## Document Maintenance

**Change Control**:
- All changes require Security Team approval
- Breaking changes require CTO approval
- Document version increment on significant changes

**Review Schedule**:
- Quarterly security review
- After any security incident
- Before major feature releases
- Annual penetration test

**Next Review**: March 2025

---

**Related Documentation**:
- [AUTHENTICATION.md](./AUTHENTICATION.md) - Core authentication flows
- [ONBOARDING.md](./ONBOARDING.md) - User onboarding
- [SECURITY_IMPLEMENTATION_GUIDE.md](./SECURITY_IMPLEMENTATION_GUIDE.md) - Detailed fixes
- [OAUTH_SETUP_GUIDE.md](./OAUTH_SETUP_GUIDE.md) - OAuth provider setup

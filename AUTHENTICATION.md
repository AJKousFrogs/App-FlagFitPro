# Authentication System Documentation
## FlagFit Pro - Complete Authentication Guide

**Version**: 2.0
**Last Updated**: December 21, 2024
**Owner**: Backend Security Team
**Approval Required**: Backend + Frontend Lead for breaking changes
**Review Frequency**: Quarterly or after security incidents

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Authentication Methods](#authentication-methods)
3. [Registration Flow](#registration-flow)
4. [Login Flow](#login-flow)
5. [Email Verification](#email-verification)
6. [OAuth Integration](#oauth-integration)
7. [Token Management](#token-management)
8. [Role Assignment](#role-assignment)
9. [Error Handling](#error-handling)
10. [Security Considerations](#security-considerations)
11. [Non-Happy Path Scenarios](#non-happy-path-scenarios)
12. [Ownership Matrix](#ownership-matrix)
13. [Glossary](#glossary)

---

## System Overview

### Architecture

FlagFit Pro uses **Supabase Auth** as the primary authentication provider with the following characteristics:

- **Password hashing**: Supabase-managed (bcrypt)
- **Token format**: JWT (JSON Web Tokens)
- **Session storage**: Supabase-managed with local cache
- **Token refresh**: Automatic via Supabase client
- **Rate limiting**: Supabase + Edge Function layer

### Authentication Stack

```
┌─────────────────────────────────────┐
│        Frontend (Client)            │
│  ┌──────────────────────────────┐   │
│  │  AuthManager (auth-manager.js)│  │
│  │  - Login/Register            │   │
│  │  - Session Management        │   │
│  │  - Token Storage             │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│       Supabase Auth Service         │
│  ┌──────────────────────────────┐   │
│  │  - Email/Password Auth       │   │
│  │  - OAuth (Google/Facebook/   │   │
│  │    Apple)                    │   │
│  │  - Email Verification        │   │
│  │  - JWT Token Generation      │   │
│  │  - Automatic Token Refresh   │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│      Supabase PostgreSQL DB         │
│  - User credentials (hashed)        │
│  - User metadata (role, name)       │
│  - Email verification status        │
│  - Session tokens                   │
└─────────────────────────────────────┘
```

### Data Flow

1. **Frontend** (`AuthManager`) → handles UI, validation, local storage
2. **Supabase Auth** → manages credentials, tokens, verification
3. **PostgreSQL** → stores user data with Row Level Security (RLS)
4. **API Client** → includes JWT token in all authenticated requests

---

## Authentication Methods

### Supported Methods

| Method | Status | Verification Required | Token Type | Provider |
|--------|--------|----------------------|------------|----------|
| Email/Password | ✅ Active | Yes (email) | JWT | Supabase |
| Google OAuth | ✅ Active | No (auto-verified) | JWT | Google |
| Facebook OAuth | ✅ Active | No (auto-verified) | JWT | Facebook |
| Apple OAuth | ✅ Active | No (auto-verified) | JWT | Apple |
| Magic Link | 🚧 Planned | Yes (email) | JWT | Supabase |
| Phone/SMS | 🚧 Planned | Yes (SMS) | JWT | Supabase |

### Email Normalization

**Implementation**: Supabase automatically normalizes emails to lowercase.

**Frontend Enforcement**:
```javascript
// In registration and login forms
const normalizedEmail = email.trim().toLowerCase();
```

**Backend Assertion**: Supabase's built-in normalization ensures consistency.

---

## Registration Flow

### Step-by-Step Process

```
┌─────────────────────┐
│  User Enters Data   │
│  - Email            │
│  - Password         │
│  - Name             │
│  - Role (optional)  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Frontend Validation │
│ - Email format      │
│ - Password strength │
│ - Name presence     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  Supabase signup()  │
│  - Creates user     │
│  - Hashes password  │
│  - Sends verify     │
│    email            │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Return to Frontend  │
│ - User ID           │
│ - Email             │
│ - verification_sent │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  Show Success +     │
│  "Check Email"      │
└─────────────────────┘
```

### Code Implementation

```javascript
// src/auth-manager.js (lines 413-472)
async register(userData) {
  const { name, email, password, role } = userData;
  const [firstName, ...lastNameParts] = name.split(' ');
  const lastName = lastNameParts.join(' ');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/verify-email.html`,
      data: {
        name,
        role: role || 'player', // ⚠️ See Role Assignment section
        first_name: firstName,
        last_name: lastName || '',
      }
    }
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email,
      name,
      role: role || 'player',
    },
    requiresVerification: true
  };
}
```

### Validation Rules

**Frontend (Client-side)**:
- Email: Valid RFC 5322 format
- Password: 8-128 characters, complexity enforced (see Security section)
- Name: Required, 2-100 characters
- Role: Optional, defaults to 'player'

**Backend (Supabase)**:
- Email: Unique constraint
- Password: Min 8 characters (Supabase default)
- Rate limiting: 3 attempts per hour per IP

### Success Response

```json
{
  "success": true,
  "user": {
    "id": "uuid-v4-string",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "player"
  },
  "requiresVerification": true
}
```

### Error Scenarios

| Error Code | Message | User Action |
|------------|---------|-------------|
| `user_already_exists` | Email already registered | Try logging in or password reset |
| `invalid_email` | Invalid email format | Correct email format |
| `weak_password` | Password too weak | Use stronger password |
| `rate_limit_exceeded` | Too many attempts | Wait 1 hour |

---

## Login Flow

### Step-by-Step Process

```
┌─────────────────────┐
│  User Enters        │
│  - Email            │
│  - Password         │
│  - Remember Me (opt)│
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Frontend Validation │
│ - Email format      │
│ - Password present  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  Rate Limit Check   │
│  (Supabase)         │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Supabase            │
│ signInWithPassword()│
│ - Verify password   │
│ - Check email       │
│   verified          │
└──────────┬──────────┘
           ↓
    ┌─────┴─────┐
    │           │
  Email      Email
Verified   Unverified
    │           │
    ↓           ↓
Generate    Show Error
JWT Token   "Verify Email"
    │
    ↓
┌─────────────────────┐
│  Store Session      │
│  - Access token     │
│  - Refresh token    │
│  - User metadata    │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  Redirect to        │
│  Dashboard/         │
│  Onboarding         │
└─────────────────────┘
```

### Code Implementation

```javascript
// src/auth-manager.js (lines 337-411)
async login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Handle email not verified
    if (error.message.includes('Email not confirmed') ||
        error.message.includes('not verified')) {
      return {
        success: false,
        error: 'Email not verified',
        requiresVerification: true
      };
    }

    return { success: false, error: error.message };
  }

  // Successful login
  this.token = data.session.access_token;
  this.user = {
    id: data.user.id,
    email: data.user.email,
    role: data.user.user_metadata?.role || 'player',
    name: data.user.user_metadata?.name || data.user.email,
    email_verified: data.user.email_confirmed_at !== null,
  };

  // Store session
  await secureStorage.setAuthToken(this.token);
  await secureStorage.setUserData(this.user);
  apiClient.setAuthToken(this.token);

  // Redirect to dashboard
  this.redirectToDashboard();

  return { success: true, user: this.user };
}
```

### Session Configuration

**Remember Me Semantics**:

| Option | Access Token Expiry | Refresh Token Expiry | Storage |
|--------|---------------------|----------------------|---------|
| Remember Me: Yes | 1 hour | 60 days | localStorage |
| Remember Me: No | 1 hour | 24 hours | sessionStorage |

**Implementation**:
```javascript
// Supabase client configuration
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: rememberMe, // true = localStorage, false = sessionStorage
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});
```

### Rate Limiting

**Supabase Default**:
- 5 failed attempts per 15 minutes per email
- Exponential backoff after failures
- Automatic unlock after timeout

**Custom Enhancement** (optional via Edge Functions):
```javascript
// 5 attempts per 15 minutes per IP
const limit = limiter.check(ip, 5, 900000);
```

### Multi-Session Behavior

**Current Implementation**:
- ✅ Multiple concurrent sessions **allowed**
- ⚠️ Logout invalidates **current session only**
- 🔄 Refresh token can be used from multiple devices

**Clarification**:
- Each device/browser maintains its own session
- Logging out on one device **does not** log out other devices
- To implement single-session: Use Supabase's `signOut({ scope: 'global' })`

**GDPR Compliance**: Document in Privacy Policy that users can revoke sessions individually.

---

## Email Verification

### Verification Flow

```
┌─────────────────────┐
│  User Registers     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  Supabase Sends     │
│  Verification Email │
│  with Magic Link    │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  User Clicks Link   │
│  in Email           │
└──────────┬──────────┘
           ↓
    ┌─────┴─────┐
    │           │
  Valid      Expired/
  Link       Invalid
    │           │
    ↓           ↓
┌─────────┐  ┌────────┐
│ Verify  │  │ Show   │
│ Email   │  │ Error  │
└────┬────┘  └────────┘
     ↓
┌─────────────────────┐
│ email_confirmed_at  │
│ = NOW()             │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Redirect to Login   │
└─────────────────────┘
```

### Email Template Configuration

**Supabase Dashboard** → **Authentication** → **Email Templates** → **Confirm signup**

```html
<h2>Confirm Your Email</h2>
<p>Thanks for signing up with FlagFit Pro!</p>
<p>Click the link below to verify your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Verify Email Address</a></p>
<p>This link expires in 24 hours.</p>
<p>If you didn't sign up for FlagFit Pro, you can safely ignore this email.</p>
```

### Redirect Handling

**Success Path**:
```
Email Link → Supabase Callback → /verify-email.html?success=true → Login Page
```

**Edge Cases**:

| Scenario | Current Behavior | Recommended Enhancement |
|----------|------------------|-------------------------|
| User already verified | Shows "Already verified" | ✅ Implemented |
| Link expired | Shows "Link expired" | ✅ Implemented + Resend option |
| Opened on different device | Requires re-login | Document as expected |
| User logged in but unconfirmed | Shows "Check your email" | ✅ Implemented |

**Implementation** (`/verify-email.html`):
```javascript
// Handle verification success
const params = new URLSearchParams(window.location.search);
if (params.get('success') === 'true') {
  showMessage('Email verified! You can now log in.');
  setTimeout(() => window.location.href = '/login.html', 2000);
}

// Handle already verified
if (params.get('error') === 'already_confirmed') {
  showMessage('Email already verified. Please log in.');
  setTimeout(() => window.location.href = '/login.html', 2000);
}

// Handle expired link
if (params.get('error') === 'expired_token') {
  showResendOption(); // Allow user to request new verification email
}
```

### Resend Verification Email

```javascript
// src/auth-manager.js (lines 636-668)
async resendVerificationEmail(email) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
    options: {
      emailRedirectTo: `${window.location.origin}/verify-email.html`,
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}
```

---

## OAuth Integration

### Supported Providers

For detailed provider setup, see [OAUTH_SETUP_GUIDE.md](./OAUTH_SETUP_GUIDE.md).

| Provider | Client Type | Scopes | Auto-Verified |
|----------|-------------|--------|---------------|
| Google | Web Application | `email profile` | Yes |
| Facebook | Consumer App | `email public_profile` | Yes |
| Apple | Services ID | `email name` | Yes |

### OAuth Flow

```
┌─────────────────────┐
│ User Clicks         │
│ "Sign in with X"    │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Select Role         │
│ (Player/Coach)      │
│ Store in localStorage│
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Redirect to         │
│ OAuth Provider      │
│ (Google/FB/Apple)   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ User Grants         │
│ Permissions         │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Redirect to         │
│ /auth/callback      │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Supabase Exchanges  │
│ Auth Code for Token │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Retrieve Role from  │
│ localStorage        │
│ Update user_metadata│
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Store Session       │
│ Redirect to         │
│ Dashboard           │
└─────────────────────┘
```

### Code Implementation

**Initiate OAuth**:
```javascript
// src/auth-manager.js (lines 502-542)
async signInWithOAuth(provider, role) {
  // Store role temporarily
  localStorage.setItem('pending_oauth_role', role);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: provider === 'google' ? 'email profile' : undefined,
    }
  });

  // User will be redirected to OAuth provider
}
```

**Handle Callback**:
```javascript
// src/auth-manager.js (lines 545-633)
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    const pendingRole = localStorage.getItem('pending_oauth_role');
    const provider = session.user.app_metadata?.provider;
    const isOAuth = provider !== 'email';

    this.user = {
      id: session.user.id,
      email: session.user.email,
      role: session.user.user_metadata?.role || pendingRole || 'player',
      name: session.user.user_metadata?.name || session.user.email,
      email_verified: isOAuth, // OAuth users auto-verified
      provider: provider,
    };

    // Update user metadata with role
    if (isOAuth && pendingRole && !session.user.user_metadata?.role) {
      await supabase.auth.updateUser({
        data: {
          role: pendingRole,
          name: this.user.name,
        }
      });
      localStorage.removeItem('pending_oauth_role');
    }
  }
});
```

### Email Verification Bypass

**Rationale**: OAuth providers (Google, Facebook, Apple) have already verified the user's email.

**Implementation**:
```javascript
email_verified: session.user.email_confirmed_at !== null || isOAuth
```

---

## Token Management

### Token Structure

**Access Token (JWT)**:
```json
{
  "aud": "authenticated",
  "exp": 1703123456,
  "sub": "uuid-of-user",
  "email": "user@example.com",
  "role": "player",
  "app_metadata": {
    "provider": "email"
  },
  "user_metadata": {
    "role": "player",
    "name": "John Doe"
  }
}
```

**Token Lifecycle**:
- **Access Token**: Expires in 1 hour
- **Refresh Token**: Expires in 60 days (or 24 hours if "Remember Me" is off)
- **Automatic Refresh**: Supabase client refreshes 10 minutes before expiry

### Storage Strategy

**Storage Location**:
- **localStorage**: Persistent sessions (Remember Me enabled)
- **sessionStorage**: Session-only (Remember Me disabled)

**Encryption**:
```javascript
// src/secure-storage.js - Uses AES-GCM encryption
await secureStorage.setAuthToken(token);
```

**Security Measures**:
- ✅ Never log tokens
- ✅ Never expose tokens in URLs
- ✅ Clear on logout
- ✅ Encrypted in storage (AES-GCM)
- ✅ HttpOnly cookies for sensitive operations (CSRF)

### Token Refresh

**Automatic Refresh**:
```javascript
// Supabase client handles this automatically
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true, // ← Enabled by default
    persistSession: true,
  }
});
```

**Manual Refresh** (fallback):
```javascript
// src/auth-manager.js (lines 884-917)
setupTokenRefresh() {
  setInterval(async () => {
    if (this.token && this.user) {
      const { data: { session } } = await supabase.auth.getSession();

      if (session && session.access_token !== this.token) {
        this.token = session.access_token;
        await secureStorage.setAuthToken(this.token);
        apiClient.setAuthToken(this.token);
      }
    }
  }, 60 * 60 * 1000); // Check every hour
}
```

---

## Role Assignment

### ⚠️ Critical Security Gap: Role Enforcement

**Current Implementation** (Lines 437-441):
```javascript
// Registration - Role assigned via frontend metadata
options: {
  data: {
    role: role || 'player', // ⚠️ Controlled by frontend
  }
}
```

**Risk**:
- Frontend-assigned roles can be manipulated
- No server-side validation of allowed roles
- Potential privilege escalation

### ✅ Recommended Fix: Server-Side Role Enforcement

**Option 1: Database Trigger**

Create a Supabase Database Trigger to validate and default roles:

```sql
-- Function to enforce role assignment
CREATE OR REPLACE FUNCTION public.enforce_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Whitelist of allowed roles
  IF NEW.raw_user_meta_data->>'role' NOT IN ('player', 'coach') THEN
    NEW.raw_user_meta_data = jsonb_set(
      NEW.raw_user_meta_data,
      '{role}',
      '"player"'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on user creation/update
CREATE TRIGGER enforce_role_on_insert
BEFORE INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.enforce_user_role();
```

**Option 2: Edge Function Hook**

Use Supabase Edge Functions to validate roles on signup:

```typescript
// supabase/functions/validate-signup/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { record } = await req.json();

  const allowedRoles = ['player', 'coach'];
  const requestedRole = record.raw_user_meta_data?.role || 'player';

  if (!allowedRoles.includes(requestedRole)) {
    return new Response(
      JSON.stringify({
        error: 'Invalid role. Allowed: player, coach'
      }),
      { status: 400 }
    );
  }

  // Default to 'player' if not specified
  record.raw_user_meta_data.role = requestedRole || 'player';

  return new Response(JSON.stringify(record), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**Enable in Supabase Dashboard**:
```
Authentication → Hooks → Enable signup → Point to Edge Function
```

### Role-Based Access Control (RBAC)

**Implemented Roles**:
```javascript
const ROLES = {
  PLAYER: 'player',    // Default role
  COACH: 'coach',      // Elevated permissions
  ADMIN: 'admin',      // ⚠️ Not currently used
};
```

**Permission Matrix**:

| Feature | Player | Coach | Admin |
|---------|--------|-------|-------|
| View own data | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ |
| View team roster | ✅ | ✅ | ✅ |
| Edit team roster | ❌ | ✅ | ✅ |
| Create training plans | ❌ | ✅ | ✅ |
| View analytics | ✅ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

**Frontend Enforcement**:
```javascript
// src/auth-manager.js (lines 874-881)
getUserRole() {
  return this.user?.role || 'player';
}

hasRole(role) {
  return this.getUserRole() === role;
}
```

**Backend Enforcement** (Required - see RLS Policies):
```sql
-- Example RLS policy for team_roster table
CREATE POLICY "Coaches can edit team roster"
ON team_roster
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = users.id
    AND users.raw_user_meta_data->>'role' = 'coach'
  )
);
```

### Role Change Behavior

**Current Status**: ⚠️ Not explicitly handled

**Recommended Rules**:
1. **Role Downgrade** (coach → player): Clear cached permissions, no onboarding
2. **Role Upgrade** (player → coach): Trigger coach-specific onboarding
3. **Manual Change Only**: Admin-initiated via database or support ticket
4. **No Self-Service**: Users cannot change their own roles

**Implementation**:
```javascript
// Add to auth-manager.js
async handleRoleChange(newRole) {
  const oldRole = this.getUserRole();

  if (oldRole === newRole) return;

  // Update user metadata
  await supabase.auth.updateUser({
    data: { role: newRole }
  });

  // Clear onboarding if upgrading to coach
  if (newRole === 'coach' && oldRole === 'player') {
    await secureStorage.remove('onboardingCompleted');
    window.location.href = '/onboarding.html?role=coach';
  }

  // Refresh session
  await this.loadStoredAuth();
}
```

---

## Error Handling

### Error Taxonomy

**System-Facing Errors** (Logged, not shown to user):
```javascript
{
  "timestamp": "2024-12-21T10:00:00Z",
  "level": "error",
  "type": "auth_error",
  "subtype": "token_validation_failed",
  "message": "JWT signature verification failed",
  "stack": "...",
  "context": {
    "user_id": "uuid",
    "ip": "192.168.1.1",
    "user_agent": "..."
  }
}
```

**User-Facing Errors** (Displayed to user):
```javascript
{
  "success": false,
  "error": "Invalid email or password",
  "code": "invalid_credentials",
  "retryable": true
}
```

### Error Categories

| Category | HTTP Status | User Message | Log Level | Retry Strategy |
|----------|-------------|--------------|-----------|----------------|
| Invalid Credentials | 401 | "Invalid email or password" | INFO | Allow retry |
| Email Not Verified | 403 | "Please verify your email first" | INFO | Show resend button |
| Rate Limit | 429 | "Too many attempts. Try again in X minutes" | WARN | Exponential backoff |
| Network Error | 500 | "Connection error. Please try again" | ERROR | Retry after 5s |
| Server Error | 500 | "Something went wrong. Please try again" | ERROR | Contact support |
| Validation Error | 400 | "Please check your input" | INFO | Allow retry |
| Session Expired | 401 | "Your session has expired. Please log in" | INFO | Redirect to login |

### Error Response Format

```json
{
  "success": false,
  "error": "User-friendly error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "email",
    "reason": "Email already registered"
  },
  "retryable": true,
  "retryAfter": 900
}
```

### Error Logging Strategy

**Client-Side** (Non-PII only):
```javascript
// Log errors to console (development)
logger.error('[Auth]', {
  type: 'login_failed',
  code: error.code,
  // NO passwords, tokens, or PII
});
```

**Server-Side** (Supabase logs):
```javascript
// Supabase automatically logs:
// - Failed login attempts
// - Token validation failures
// - Rate limit violations
```

**Correlation IDs**:
```javascript
// Generate correlation ID for each auth attempt
const correlationId = crypto.randomUUID();

// Include in all logs and API requests
headers: {
  'X-Correlation-ID': correlationId
}
```

---

## Security Considerations

### Password Requirements

**Complexity Rules**:
- ✅ Minimum 8 characters
- ✅ Maximum 128 characters
- ✅ At least 3 of: uppercase, lowercase, numbers, special characters
- ✅ Not in common password list (Supabase checks this)

**Frontend Validation**:
```javascript
function validatePasswordComplexity(password) {
  const checks = [
    /[A-Z]/.test(password), // Uppercase
    /[a-z]/.test(password), // Lowercase
    /\d/.test(password),    // Number
    /[@$!%*?&#]/.test(password) // Special
  ];

  const complexity = checks.filter(Boolean).length;

  return {
    valid: password.length >= 8 && password.length <= 128 && complexity >= 3,
    errors: []
  };
}
```

**Backend Validation** (Supabase):
- Password strength scoring
- Common password blocking
- Breach database check (optional)

### Token Security

**Never Log Tokens**:
```javascript
// ❌ WRONG
console.log('Token:', token);

// ✅ CORRECT
console.log('Token exists:', !!token);
```

**Never Expose in URLs**:
```javascript
// ❌ WRONG
window.location.href = `/dashboard?token=${token}`;

// ✅ CORRECT
// Tokens only in Authorization header or HttpOnly cookies
```

**Clear on Logout**:
```javascript
async logout() {
  await supabase.auth.signOut();
  secureStorage.clearAll();
  apiClient.setAuthToken(null);
  csrfProtection.clearToken();
}
```

### CSRF Protection

**Token Rotation**:
```javascript
// Rotate CSRF token on login
csrfProtection.rotateToken();

// Clear CSRF token on logout
csrfProtection.clearToken();
```

**Validation** (see SESSION_AND_SECURITY.md for full implementation)

---

## Non-Happy Path Scenarios

### User Closes Browser Mid-Registration

**Scenario**: User submits registration form but closes browser before clicking verification email.

**Behavior**:
1. User account is created in Supabase (status: `unconfirmed`)
2. Verification email is sent
3. User can complete registration by clicking email link later
4. If user tries to register again with same email: "Email already registered"

**UX Enhancement**:
- Add "Resend verification email" button on login page
- Show message: "Already registered? Check your email or resend verification"

### Token Expires During Onboarding

**Scenario**: User completes onboarding but token expires before final save.

**Current Behavior**:
- Supabase auto-refreshes token before expiry
- If network fails during onboarding: localStorage preserves progress

**Recommended Enhancement**:
```javascript
// In onboarding.js
async saveOnboardingProgress(step, data) {
  try {
    // Check token validity before save
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Token expired, show re-login modal
      showReLoginModal();
      return;
    }

    // Save progress
    await apiClient.post('/api/onboarding/progress', { step, data });
  } catch (error) {
    // Handle network errors
    localStorage.setItem(`onboarding_step_${step}`, JSON.stringify(data));
  }
}
```

### Verification Link Reused

**Scenario**: User clicks verification link multiple times or forwards link to someone else.

**Supabase Behavior**:
- First click: ✅ Verifies email
- Subsequent clicks: Returns `already_confirmed` error

**Implementation**:
```javascript
// verify-email.html
const params = new URLSearchParams(window.location.search);

if (params.get('error') === 'already_confirmed') {
  showMessage('Email already verified. You can log in now.');
  setTimeout(() => window.location.href = '/login.html', 2000);
}
```

### User Logs In on Second Device

**Scenario**: User logs in on Phone while already logged in on Laptop.

**Current Behavior**:
- ✅ Both sessions are active
- ✅ Both devices can access the app
- ⚠️ Logging out on Phone does **not** log out Laptop

**Clarification for Users**:
- Document in Settings: "Log out from all devices" button
- Implement global logout: `supabase.auth.signOut({ scope: 'global' })`

**Implementation**:
```javascript
// In settings page
async logoutAllDevices() {
  const { error } = await supabase.auth.signOut({ scope: 'global' });

  if (!error) {
    showMessage('Logged out from all devices');
    window.location.href = '/login.html';
  }
}
```

---

## Ownership Matrix

| Concern | Owner | Implementation Location |
|---------|-------|-------------------------|
| Password hashing | Supabase | Supabase Auth Service |
| Token generation | Supabase | Supabase Auth Service |
| Token refresh | Supabase + Frontend | Supabase client (auto) + AuthManager fallback |
| Role enforcement | **Backend / RLS** ⚠️ | Database triggers + RLS policies |
| Email verification | Supabase | Supabase Auth Service |
| Rate limiting | Supabase + Edge Functions | Supabase (default) + Custom (optional) |
| Onboarding state | App logic | Frontend (localStorage) + Backend (user_metadata) |
| Session storage | Frontend | secureStorage (AES-GCM encrypted) |
| CSRF protection | Frontend + Backend | csrfProtection module + Edge Functions |
| OAuth integration | Supabase + OAuth Providers | Supabase Auth Service |

---

## Glossary

| Term | Definition |
|------|------------|
| **Access Token** | Short-lived JWT (1 hour) used to authenticate API requests |
| **Refresh Token** | Long-lived token (60 days) used to obtain new access tokens |
| **Supabase Auth** | Managed authentication service handling credentials, tokens, and verification |
| **Secure Storage** | AES-GCM encrypted localStorage wrapper for storing sensitive data client-side |
| **AuthManager** | Frontend singleton managing authentication state and flows |
| **RLS** | Row Level Security - PostgreSQL feature enforcing data access policies |
| **CSRF Token** | Random token preventing Cross-Site Request Forgery attacks |
| **OAuth** | Open Authorization protocol allowing third-party login (Google, Facebook, Apple) |
| **JWT** | JSON Web Token - signed token containing user claims and expiration |
| **Email Verification** | Process confirming user owns the email address (required for email/password auth) |
| **Extended Session** | Session with "Remember Me" enabled (60 days vs 24 hours) |

---

## Document Change Control

**Breaking Changes Require**:
1. Backend Security Team review
2. Frontend Lead review
3. Update to all related documentation
4. Migration plan for existing users

**Change Log**:
- **v2.0** (2024-12-21): Comprehensive rewrite addressing security gaps
- **v1.0** (2024-11-01): Initial documentation

**Next Review**: March 2025 or after next security audit

---

**For session management and security details, see** → [SESSION_AND_SECURITY.md](./SESSION_AND_SECURITY.md)
**For onboarding flows, see** → [ONBOARDING.md](./ONBOARDING.md)
**For OAuth provider setup, see** → [OAUTH_SETUP_GUIDE.md](./OAUTH_SETUP_GUIDE.md)

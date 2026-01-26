# Authentication, Login, and Onboarding Process Documentation

**Version**: 1.0  
**Last Updated**: 29. December 2025  
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication Architecture](#authentication-architecture)
3. [Registration Process](#registration-process)
4. [Login Process](#login-process)
5. [Email Verification](#email-verification)
6. [Onboarding Process](#onboarding-process)
7. [Session Management](#session-management)
8. [Security Measures](#security-measures)
9. [Error Handling](#error-handling)
10. [User Flow Diagrams](#user-flow-diagrams)

---

## Overview

FlagFit Pro uses **Supabase Authentication** for user authentication and session management. The platform implements a comprehensive authentication flow that includes registration, email verification, login, and a guided onboarding experience for new users.

### Key Features

- **Supabase Auth Integration**: Leverages Supabase's built-in authentication system
- **Email Verification**: Required before users can log in
- **Secure Session Management**: Automatic token refresh and secure storage
- **Multi-Step Onboarding**: Role-specific onboarding flow for players and coaches
- **Password Security**: Strong password requirements and secure hashing
- **Rate Limiting**: Protection against brute force attacks

---

## Authentication Architecture

### Technology Stack

- **Frontend**: Angular 21
- **Backend**: Supabase Auth API
- **Session Storage**: Secure storage with encrypted token management
- **Token Management**: JWT tokens managed by Supabase

### Authentication Flow Overview

```
User Registration
    ↓
Email Verification (Required)
    ↓
User Login
    ↓
Onboarding Check
    ↓
Dashboard Access
```

### Components Involved

1. **AuthService** (`angular/src/app/core/services/auth.service.ts`): Angular service for auth operations
2. **SupabaseService** (`angular/src/app/core/services/supabase.service.ts`): Supabase Auth wrapper
3. **ProfileCompletionService** (`angular/src/app/core/services/profile-completion.service.ts`): Tracks onboarding completion status
4. **OnboardingComponent** (`angular/src/app/features/onboarding/onboarding.component.ts`): Guided onboarding flow UI
5. **SecureStorage**: Encrypted storage for tokens and user data

---

## Registration Process

### Step-by-Step Registration Flow

```
1. User navigates to registration page
   ↓
2. User fills out registration form:
   - Full Name (required)
   - Email Address (required, must be unique)
   - Password (required, min 8 chars with complexity)
   - Confirm Password (required, must match)
   ↓
3. Frontend validates input client-side:
   - Email format validation
   - Password strength validation
   - Password match validation
   ↓
4. POST request to Supabase Auth API
   - Endpoint: supabase.auth.signUp()
   - Includes metadata:
     * name: Full name
     * role: Default 'player' (can be 'coach' or 'admin')
     * first_name: Extracted from full name
     * last_name: Extracted from full name
   ↓
5. Supabase creates user account:
   - User status: unverified (email_confirmed_at = null)
   - Email verification token generated
   - User metadata stored
   ↓
6. Verification email sent automatically:
   - Redirect URL: /verify-email.html
   - Contains verification token
   - Expires after 24 hours
   ↓
7. User receives email and clicks verification link
   ↓
8. Email verification processed:
   - Token validated
   - email_confirmed_at timestamp set
   - User can now log in
```

### Registration Form Requirements

**Email:**

- Must be valid email format
- Must be unique (not already registered)
- Normalized to lowercase
- Required field

**Password:**

- Minimum 8 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number
- Must contain special character
- Required field

**Name:**

- Full name required
- Split into first_name and last_name automatically
- Stored in user metadata

### Registration Code Example

```typescript
// Angular Implementation
async register(userData: RegisterData): Observable<any> {
  const { email, password, ...metadata } = userData;

  return from(
    this.supabaseService.signUp(email, password, metadata)
  ).pipe(
    map((response) => {
      if (response.error) {
        throw new Error(response.error.message);
      }
      return {
        success: true,
        message: "Please check your email to verify your account."
      };
    })
  );
}
```

### Business Rules

- ✅ Email verification is **required** before login
- ✅ Password must meet complexity requirements
- ✅ Email addresses are normalized to lowercase
- ✅ Duplicate email addresses are rejected
- ✅ Registration creates a user profile with default role 'player'
- ✅ Verification tokens expire after 24 hours
- ✅ Verification tokens are single-use

---

## Login Process

### Step-by-Step Login Flow

```
1. User navigates to login page
   ↓
2. User enters credentials:
   - Email address
   - Password
   - Remember me (optional)
   ↓
3. Frontend validates input:
   - Email format check
   - Password not empty
   ↓
4. POST request to Supabase Auth API
   - Endpoint: supabase.auth.signInWithPassword()
   - Credentials: { email, password }
   ↓
5. Supabase validates credentials:
   - Checks email exists in database
   - Verifies password hash
   - Checks email_verified status (email_confirmed_at)
   ↓
6. If email not verified:
   - Error returned: "Email not confirmed"
   - User prompted to verify email
   - Login blocked
   ↓
7. If credentials valid and email verified:
   - Session created
   - JWT access token generated
   - Refresh token generated
   - Session data returned
   ↓
8. Frontend processes successful login:
   - Access token stored securely
   - User data extracted from session
   - User metadata loaded (role, name, etc.)
   - Token set in API client for authenticated requests
   ↓
9. Onboarding check:
   - Check if user has completed onboarding
   - If not completed: redirect to /onboarding.html
   - If completed: redirect to dashboard
   ↓
10. User redirected to appropriate page
```

### Login Code Example

```typescript
// Angular Implementation
login(credentials: LoginCredentials): Observable<any> {
  return from(
    this.supabaseService.signIn(credentials.email, credentials.password)
  ).pipe(
    map((response) => {
      if (response.error) {
        // Handle email not verified
        if (response.error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email before logging in.');
        }
        throw new Error(response.error.message);
      }

      return {
        success: true,
        data: {
          user: response.data.user,
          session: response.data.session
        }
      };
    })
  );
}
```

### Session Data Structure

After successful login, the session contains:

```typescript
{
  user: {
    id: "uuid",
    email: "user@example.com",
    email_confirmed_at: "2025-01-01T00:00:00Z",
    user_metadata: {
      name: "John Doe",
      role: "player",
      first_name: "John",
      last_name: "Doe"
    }
  },
  session: {
    access_token: "jwt_token",
    refresh_token: "refresh_token",
    expires_at: 1234567890,
    expires_in: 3600
  }
}
```

### Business Rules

- ✅ Unverified users **cannot** log in
- ✅ Failed login attempts are rate-limited (5 per 15 minutes per IP)
- ✅ Sessions expire after inactivity (configurable)
- ✅ Tokens are automatically refreshed before expiration
- ✅ Remember me option extends session duration
- ✅ CSRF protection for login requests

---

## Email Verification

### Verification Flow

```
1. User registers account
   ↓
2. Supabase sends verification email:
   - Subject: "Confirm your email"
   - Contains verification link
   - Link format: /verify-email.html?token=xxx&type=signup
   ↓
3. User clicks verification link
   ↓
4. Frontend processes verification:
   - Extracts token from URL
   - Calls supabase.auth.verifyOtp()
   ↓
5. Supabase validates token:
   - Checks token exists and is valid
   - Checks token hasn't expired (24 hours)
   - Checks token hasn't been used
   ↓
6. If valid:
   - email_confirmed_at timestamp set
   - User can now log in
   - Success message displayed
   ↓
7. If invalid:
   - Error message displayed
   - User can request new verification email
```

### Verification Requirements

- **Token Expiration**: 24 hours from generation
- **Single Use**: Tokens can only be used once
- **Email Required**: Must match registered email
- **Status Check**: System checks `email_confirmed_at` before allowing login

### Resending Verification Email

Users can request a new verification email if:

- The original email expired
- The email was not received
- The verification link was lost

**Process:**

```
1. User clicks "Resend verification email"
   ↓
2. Frontend calls supabase.auth.resend()
   ↓
3. New verification email sent
   ↓
4. User receives new email with fresh token
```

---

## Onboarding Process

### Overview

The onboarding process is a **multi-step guided tour** that helps new users understand the platform and set up their profile. The flow is **role-specific**, with different steps for players and coaches.

### Onboarding Check Flow

```
1. User successfully logs in
   ↓
2. System checks onboarding status:
   - Checks user_metadata.onboarding_completed
   - Checks localStorage for onboardingCompleted flag
   ↓
3. If onboarding not completed:
   - Redirect to /onboarding.html
   - Onboarding flow starts
   ↓
4. If onboarding completed:
   - Redirect to dashboard
   - Normal app experience
```

### Onboarding Steps for Players

1. **Welcome to FlagFit Pro!**
   - Introduction to the platform
   - Overview of features

2. **Dashboard Overview**
   - Explanation of dashboard features
   - Performance metrics introduction
   - Quick actions overview

3. **Training Hub & Drills**
   - Access to training programs
   - Workout tracking explanation
   - Progress monitoring features

4. **Team & Community**
   - Finding and joining teams
   - Team codes explanation
   - Community features

5. **Find or Join a Team**
   - Action step: Browse teams
   - Link to team roster page

6. **You're All Set!**
   - Completion message
   - Help resources mentioned

### Onboarding Steps for Coaches

1. **Welcome, Coach!**
   - Coach-specific introduction
   - Dashboard overview

2. **Coach Dashboard Overview**
   - Team performance metrics
   - Player stats explanation
   - Quick actions for team management

3. **Creating & Managing Teams**
   - Team creation process
   - Inviting players
   - Managing rosters

4. **Adding Players to Roster**
   - Player invitation process
   - Profile management
   - Progress tracking

5. **Training Sessions & Stats**
   - Creating training sessions
   - Logging player performance
   - Monitoring team progress

6. **Community & Messaging**
   - Team communication
   - Community engagement

7. **Create Your First Team**
   - Action step: Create team
   - Link to roster page

8. **You're All Set!**
   - Completion message
   - Help resources

### Onboarding Implementation

**Onboarding Component** (`angular/src/app/features/onboarding/onboarding.component.ts`):

- Manages onboarding state
- Handles step progression
- Stores progress locally
- Role-specific step configuration

**Onboarding Route** (`/onboarding`):

- Multi-step form interface
- Progress indicator
- Step navigation (next/back/skip)
- Profile completion options

### Onboarding Completion

When onboarding is completed:

```ts
// Update user metadata
await supabase.auth.updateUser({
  data: {
    onboarding_completed: true,
    onboarding_completed_at: new Date().toISOString(),
  },
});

// Store completion flag
localStorage.setItem("onboardingCompleted", "true");
localStorage.setItem("onboardingCompletedDate", new Date().toISOString());

// Clear progress data
localStorage.removeItem("onboardingProgress");

// Redirect to dashboard
window.location.href = "/dashboard";
```

### Onboarding Features

- **Progress Saving**: Progress saved locally, can resume later
- **Skip Option**: Users can skip onboarding at any time
- **Keyboard Navigation**: Arrow keys for navigation, Escape to skip
- **Accessibility**: ARIA labels and focus management
- **Role Detection**: Automatically detects user role and shows appropriate steps

### Business Rules

- ✅ Onboarding is **optional** but recommended
- ✅ Users can skip onboarding at any time
- ✅ Progress is saved locally
- ✅ Onboarding can be restarted from help menu
- ✅ Role-specific steps based on user role
- ✅ Completion status stored in user metadata

---

## Session Management

### Token Storage

**Secure Storage** (Preferred):

- Encrypted storage using AES-GCM
- Tokens stored securely
- Protected against XSS attacks

**Fallback Storage**:

- localStorage (for development)
- sessionStorage (for session-only tokens)

### Token Management

```javascript
// Get token
const token = await secureStorage.getAuthToken();

// Set token
await secureStorage.setAuthToken(token);

// Remove token
secureStorage.removeAuthToken();
```

### Token Refresh

Supabase automatically handles token refresh:

- Access tokens expire after 1 hour
- Refresh tokens used to get new access tokens
- Automatic refresh before expiration
- Seamless user experience

### Session Persistence

**Remember Me Option:**

- If checked: Extended session duration
- If unchecked: Session expires on browser close

**Session Validation:**

- Tokens validated on each API request
- Expired tokens trigger automatic refresh
- Invalid tokens trigger logout

### Logout Process

```
1. User clicks logout
   ↓
2. Frontend calls supabase.auth.signOut()
   ↓
3. Supabase invalidates session:
   - Access token invalidated
   - Refresh token invalidated
   ↓
4. Frontend clears local storage:
   - Removes auth token
   - Removes user data
   - Clears session storage
   ↓
5. User redirected to login page
```

---

## Security Measures

### Password Security

- **Hashing**: Passwords hashed using Supabase's secure hashing (bcrypt)
- **Never Stored**: Passwords never stored in plain text
- **Complexity Requirements**: Enforced on frontend and backend
- **Password Reset**: Secure token-based password reset flow

### Token Security

- **JWT Tokens**: Signed and validated by Supabase
- **Expiration**: Tokens expire after 1 hour (configurable)
- **Refresh Tokens**: Secure refresh token mechanism
- **HttpOnly Cookies**: Option for httpOnly cookie storage
- **Secure Storage**: Encrypted storage for tokens

### Email Verification

- **Required**: Users must verify email before login
- **Token Expiration**: Verification tokens expire after 24 hours
- **Single Use**: Tokens can only be used once
- **Secure Links**: Verification links contain secure tokens

### Rate Limiting

- **Login Attempts**: Limited to 5 per 15 minutes per IP
- **API Requests**: Rate limited on backend
- **Prevents**: Brute force attacks and abuse

### CSRF Protection

- **CSRF Tokens**: Generated for state-changing operations
- **Validation**: Tokens validated on backend
- **Session-Based**: Tokens tied to user session

### Input Validation

- **Frontend**: Client-side validation for immediate feedback
- **Backend**: Server-side validation for security
- **Sanitization**: All user input sanitized
- **SQL Injection**: Parameterized queries prevent SQL injection

---

## Error Handling

### Common Authentication Errors

| Error Code            | Description                 | User Message                                    | Solution          |
| --------------------- | --------------------------- | ----------------------------------------------- | ----------------- |
| `invalid_credentials` | Email or password incorrect | "Invalid email or password"                     | Check credentials |
| `email_not_confirmed` | Email not verified          | "Please verify your email before logging in"    | Check email inbox |
| `too_many_requests`   | Rate limit exceeded         | "Too many attempts. Please try again later"     | Wait 15 minutes   |
| `user_not_found`      | Email not registered        | "No account found with this email"              | Register account  |
| `token_expired`       | Session expired             | "Session expired. Please log in again"          | Re-login          |
| `network_error`       | Connection failed           | "Unable to connect. Please check your internet" | Check connection  |

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Error Handling Flow

```
1. Error occurs during authentication
   ↓
2. Error caught and categorized
   ↓
3. User-friendly message displayed
   ↓
4. Appropriate action suggested
   ↓
5. Error logged for debugging (if needed)
```

### Email Verification Errors

- **Token Expired**: "Verification link has expired. Please request a new one."
- **Token Invalid**: "Invalid verification link. Please check your email."
- **Already Verified**: "Email already verified. You can log in now."

### Onboarding Errors

- **Progress Lost**: "Onboarding progress was lost. Starting from beginning."
- **Role Detection Failed**: "Unable to detect role. Using default steps."

---

## User Flow Diagrams

### Complete User Journey

```
┌─────────────┐
│   New User  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│   Registration  │
│   Page          │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐      ┌──────────────┐
│  Fill Form &    │─────▶│  Validation  │
│  Submit         │      │  (Client)    │
└──────┬──────────┘      └──────────────┘
       │
       ▼
┌─────────────────┐      ┌──────────────┐
│  Supabase Auth  │─────▶│  Create User  │
│  signUp()       │      │  (Backend)    │
└──────┬──────────┘      └──────────────┘
       │
       ▼
┌─────────────────┐
│  Verification   │
│  Email Sent     │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐      ┌──────────────┐
│  User Clicks    │─────▶│  Verify      │
│  Email Link     │      │  Token       │
└──────┬──────────┘      └──────────────┘
       │
       ▼
┌─────────────────┐
│  Email          │
│  Verified       │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Login Page     │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐      ┌──────────────┐
│  Enter          │─────▶│  Validate    │
│  Credentials    │      │  Credentials │
└──────┬──────────┘      └──────────────┘
       │
       ▼
┌─────────────────┐      ┌──────────────┐
│  Supabase Auth  │─────▶│  Check Email  │
│  signIn()       │      │  Verified    │
└──────┬──────────┘      └──────────────┘
       │
       ▼
┌─────────────────┐
│  Session        │
│  Created        │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐      ┌──────────────┐
│  Check          │─────▶│  Onboarding   │
│  Onboarding     │      │  Completed?   │
└──────┬──────────┘      └──────────────┘
       │
       ├─── No ───▶┌─────────────────┐
       │           │  Onboarding      │
       │           │  Flow           │
       │           └────────┬────────┘
       │                    │
       │                    ▼
       │           ┌─────────────────┐
       │           │  Complete        │
       │           │  Onboarding      │
       │           └────────┬────────┘
       │                    │
       └─── Yes ────────────┘
                    │
                    ▼
            ┌───────────────┐
            │   Dashboard   │
            └───────────────┘
```

### Authentication State Flow

```
┌──────────────┐
│  Unauthenticated │
└──────┬───────┘
       │
       │ Register/Login
       ▼
┌──────────────┐
│  Authenticating │
└──────┬───────┘
       │
       ├─── Success ───▶┌──────────────┐
       │                 │ Authenticated │
       │                 └──────┬───────┘
       │                        │
       │                        │ Token Expires
       │                        ▼
       │                 ┌──────────────┐
       │                 │ Token Refresh │
       │                 └──────┬───────┘
       │                        │
       │                        └───▶ Authenticated
       │
       └─── Failure ───▶┌──────────────┐
                        │   Error      │
                        └──────────────┘
```

### Onboarding Flow

```
┌──────────────┐
│  Login       │
│  Successful  │
└──────┬───────┘
       │
       ▼
┌─────────────────┐      ┌──────────────┐
│  Check          │─────▶│  Completed?  │
│  Onboarding     │      │              │
│  Status         │      └──────────────┘
└──────┬──────────┘
       │
       ├─── Yes ───▶┌──────────────┐
       │            │  Dashboard    │
       │            └───────────────┘
       │
       └─── No ────▶┌──────────────┐
                    │  Onboarding  │
                    │  Page        │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Step 1      │
                    │  Welcome     │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Step 2-N    │
                    │  (Role-based)│
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Complete    │
                    │  Onboarding  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Dashboard   │
                    └──────────────┘
```

---

## Related Documentation

- [AUTHENTICATION_PATTERN.md](./AUTHENTICATION_PATTERN.md) - Detailed authentication pattern documentation
- [WORKFLOW_AND_BUSINESS_LOGIC.md](./WORKFLOW_AND_BUSINESS_LOGIC.md) - Complete workflow documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database schema and setup

---

## Changelog

- **v1.0 (2025-01)**: Initial authentication, login, and onboarding documentation
  - Registration process documented
  - Login process documented
  - Email verification flow documented
  - Onboarding process documented
  - Security measures documented
  - Error handling documented
  - User flow diagrams added

---

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

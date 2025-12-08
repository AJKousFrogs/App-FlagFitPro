# Authentication Pattern Documentation

## Overview

FlagFit Pro uses a **custom JWT-based authentication system** instead of Supabase's built-in authentication. This document explains why this decision was made and how the authentication flow works.

---

## Architecture Decision: Custom JWT vs Supabase Auth

### Why Custom JWT?

1. **Existing Implementation**: The application already had a custom authentication system in place before migrating to Supabase
2. **Control Over User Schema**: Custom user table with specific fields (role, email_verified, etc.) that don't match Supabase Auth's default schema
3. **Backend Control**: All authentication logic runs through Netlify Functions, providing better control over business logic
4. **Migration Path**: Easier migration path from previous database without requiring user re-registration

### Trade-offs

**Advantages:**
- ✅ Full control over authentication flow
- ✅ Custom user schema matching application needs
- ✅ No dependency on Supabase Auth features
- ✅ Easier to customize authentication logic

**Disadvantages:**
- ❌ More code to maintain
- ❌ Manual session management
- ❌ No built-in social auth providers
- ❌ Manual password reset flows
- ❌ RLS policies can't use `auth.uid()` directly

---

## Authentication Flow

### 1. User Registration

```
Frontend → POST /auth-register → Netlify Function
  ↓
Validate input → Hash password → Create user in Supabase
  ↓
Generate verification token → Send verification email
  ↓
Return success (user must verify email before login)
```

**Key Points:**
- Password is hashed using `bcryptjs` (10 rounds)
- Email verification token is generated and stored
- User cannot login until email is verified

### 2. User Login

```
Frontend → POST /auth-login → Netlify Function
  ↓
Validate credentials → Find user by email → Verify password
  ↓
Check email_verified → Generate JWT token
  ↓
Return token + user data (without password)
```

**JWT Token Structure:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "player" | "coach" | "admin",
  "exp": 1234567890  // 24 hours from issue
}
```

### 3. Authenticated Requests

```
Frontend → API Request with Authorization header
  ↓
Netlify Function → Extract JWT from header
  ↓
Validate JWT signature → Check expiration → Extract userId
  ↓
Use userId for database queries
```

**Authorization Header Format:**
```
Authorization: Bearer <jwt_token>
```

---

## Security Measures

### 1. Password Security
- Passwords are hashed using `bcryptjs` with 10 salt rounds
- Never stored or returned in plain text
- Password comparison uses constant-time comparison

### 2. JWT Security
- Tokens signed with `JWT_SECRET` (stored in environment variables)
- Tokens expire after 24 hours
- Secret key never exposed to frontend

### 3. Email Verification
- Users must verify email before login
- Verification tokens expire after 24 hours
- Tokens are single-use (cleared after verification)

### 4. Rate Limiting
- Login attempts limited to 5 per 15 minutes per IP
- Prevents brute force attacks

### 5. CSRF Protection
- CSRF tokens required for state-changing operations
- Validated on backend

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- bcrypt hash
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'player',
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  verification_token_expires_at TIMESTAMP,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Supabase Integration

### Service Key Usage

All database operations use Supabase's **service key** (`SUPABASE_SERVICE_KEY`), which:
- Bypasses Row Level Security (RLS) policies
- Allows admin-level operations
- Never exposed to frontend

**Why Service Key?**
- Backend functions need admin access to manage users
- Custom authentication doesn't use Supabase Auth sessions
- RLS policies protect against direct database access

### RLS Policies

RLS is enabled on all tables but bypassed by service key. Policies protect against:
- Direct database access from frontend
- Unauthorized API calls
- Data leaks

**Note:** Since we use custom JWT, RLS policies can't use `auth.uid()`. Instead, authorization is handled in Netlify Functions using the JWT `userId`.

---

## Frontend Integration

### Token Storage

Tokens are stored securely using:
- **Secure Storage Service**: Encrypted storage with AES-GCM
- **Fallback**: localStorage (for development)
- **Session Storage**: Encryption method preference

### Token Management

```javascript
// Get token
const token = await secureStorage.getAuthToken();

// Set token
await secureStorage.setAuthToken(token);

// Remove token
secureStorage.removeAuthToken();
```

### Making Authenticated Requests

```javascript
// Using ApiClient
const response = await apiClient.get('/dashboard', { userId });

// ApiClient automatically adds Authorization header
// Authorization: Bearer <token>
```

---

## Migration to Supabase Auth (Future Consideration)

If you want to migrate to Supabase Auth in the future:

### Steps Required:
1. Enable Supabase Auth in dashboard
2. Migrate user passwords (requires re-hashing or password reset)
3. Update authentication endpoints to use Supabase Auth
4. Update RLS policies to use `auth.uid()`
5. Update frontend to use Supabase Auth client
6. Remove custom JWT logic

### Benefits:
- Built-in social auth providers
- Automatic session management
- Better RLS integration
- Less code to maintain

### Challenges:
- User password migration
- Session migration
- Code refactoring
- Testing all authentication flows

---

## Error Handling

### Common Authentication Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `401` | Invalid credentials | Check email/password |
| `403` | Email not verified | Verify email address |
| `429` | Rate limit exceeded | Wait 15 minutes |
| `500` | Server error | Check logs |

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Testing

### Test Users

Demo users are automatically seeded:
- `test@flagfitpro.com` / `demo123`
- `demo@flagfitpro.com` / `demo123`
- `coach@flagfitpro.com` / `demo123`

**Note:** These are for development only. Remove in production.

---

## Security Checklist

- [x] Passwords hashed with bcrypt
- [x] JWT tokens signed and validated
- [x] Email verification required
- [x] Rate limiting on login
- [x] CSRF protection
- [x] Service key never exposed
- [x] Tokens expire after 24 hours
- [x] Secure token storage

---

## References

- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Supabase Service Key Documentation](https://supabase.com/docs/guides/api/using-the-service-role-key)
- [bcryptjs Documentation](https://www.npmjs.com/package/bcryptjs)


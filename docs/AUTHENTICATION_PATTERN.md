# Authentication Pattern Documentation

**Version**: 2.0  
**Last Updated**: 29. December 2025  
**Last Verified Against Codebase**: 2025-12-28  
**Status**: ✅ Production Ready

---

## Overview

FlagFit Pro uses **Supabase Authentication** for user management and JWT-based authorization. This document explains the authentication flow and security patterns.

### Key Features

- **Supabase Auth**: Built-in authentication with JWT tokens
- **Email Verification**: Required before full access
- **Secure Token Storage**: Encrypted storage with AES-GCM
- **Rate Limiting**: Protection against brute force attacks
- **Row Level Security**: Database-level access control

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Angular)                           │
│  ├── AuthService (supabase.auth.*)                             │
│  ├── SecureStorageService (token storage)                      │
│  └── AuthGuard (route protection)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NETLIFY FUNCTIONS                            │
│  ├── auth-helper.cjs (supabase.auth.getUser)                   │
│  ├── base-handler.cjs (auth middleware)                        │
│  └── Protected endpoints (require valid JWT)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE                                     │
│  ├── Auth Service (user management)                            │
│  ├── PostgreSQL (data storage)                                 │
│  └── RLS Policies (auth.uid() based)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

### 1. User Registration

```
Frontend → supabase.auth.signUp() → Supabase Auth
  ↓
Create user in auth.users → Send verification email
  ↓
Return session (user must verify email for full access)
```

**Frontend Code:**

```typescript
// Angular AuthService
async register(email: string, password: string, name: string) {
  const { data, error } = await this.supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role: 'player' }
    }
  });
  return { data, error };
}
```

### 2. User Login

```
Frontend → supabase.auth.signInWithPassword() → Supabase Auth
  ↓
Validate credentials → Generate JWT token
  ↓
Return session with access_token and refresh_token
```

**Frontend Code:**

```typescript
// Angular AuthService
async login(email: string, password: string) {
  const { data, error } = await this.supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}
```

### 3. Authenticated API Requests

```
Frontend → API Request with Authorization header
  ↓
Netlify Function → Extract JWT from header
  ↓
supabase.auth.getUser(token) → Validate with Supabase
  ↓
Use user.id for database queries
```

**Backend Code (auth-helper.cjs):**

```javascript
async function authenticateRequest(event) {
  const authHeader = event.headers.authorization;
  const token = authHeader.substring(7); // Remove "Bearer "

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { success: false, error: "Invalid or expired token" };
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || "player",
      name: user.user_metadata?.name || user.email,
      emailVerified: user.email_confirmed_at !== null,
    },
  };
}
```

### 4. Token Refresh

```
Frontend → supabase.auth.refreshSession() → Supabase Auth
  ↓
Validate refresh_token → Generate new access_token
  ↓
Return new session
```

---

## Security Measures

### 1. JWT Token Security

- Tokens are signed by Supabase with project-specific secret
- Access tokens expire after 1 hour (configurable)
- Refresh tokens enable automatic renewal
- Tokens validated on every API request

### 2. Row Level Security (RLS)

All database tables have RLS enabled:

```sql
-- Users can only access their own data
CREATE POLICY "Users can view own data" ON training_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Coaches can view team member data
CREATE POLICY "Coaches can view team data" ON training_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = training_sessions.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('coach', 'admin')
    )
  );
```

### 3. Rate Limiting

| Tier   | Requests | Window   | Endpoints          |
| ------ | -------- | -------- | ------------------ |
| READ   | 100      | 1 minute | GET requests       |
| CREATE | 20       | 1 minute | POST requests      |
| UPDATE | 30       | 1 minute | PUT/PATCH requests |
| DELETE | 10       | 1 minute | DELETE requests    |

### 4. Secure Token Storage (Frontend)

```typescript
// SecureStorageService - AES-GCM encryption
export class SecureStorageService {
  private async encryptData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await this.getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(data),
    );
    // ... store encrypted data
  }
}
```

---

## User Roles

| Role     | Permissions                    |
| -------- | ------------------------------ |
| `player` | Own data only, team membership |
| `coach`  | Team data, player management   |
| `admin`  | Full access, system management |

Roles are stored in `user_metadata`:

```typescript
const { data } = await supabase.auth.updateUser({
  data: { role: "coach" },
});
```

---

## API Endpoints

### Authentication Endpoints

| Method | Endpoint                   | Auth | Description               |
| ------ | -------------------------- | ---- | ------------------------- |
| POST   | `/api/auth/login`          | No   | Login (via Supabase)      |
| POST   | `/api/auth/reset-password` | No   | Request password reset    |
| GET    | `/auth-me`                 | Yes  | Verify token and get user |
| POST   | `/api/accept-invitation`   | No   | Accept team invitation    |
| GET    | `/api/validate-invitation` | No   | Validate invitation token |

### Protected Endpoints

All other `/api/*` endpoints require valid JWT:

```
Authorization: Bearer <access_token>
```

---

## Frontend Integration

### Angular AuthService

```typescript
@Injectable({ providedIn: "root" })
export class AuthService {
  private supabase = inject(SupabaseService).client;

  // Reactive auth state
  readonly user = signal<User | null>(null);
  readonly isAuthenticated = computed(() => !!this.user());

  constructor() {
    // Listen for auth state changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.user.set(session?.user ?? null);
    });
  }

  async login(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  async logout() {
    return this.supabase.auth.signOut();
  }

  async getSession() {
    return this.supabase.auth.getSession();
  }
}
```

### Route Guards

```typescript
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const {
    data: { session },
  } = await auth.getSession();

  if (!session) {
    router.navigate(["/login"]);
    return false;
  }

  return true;
};
```

---

## Error Handling

### Common Authentication Errors

| Error Code | Description         | Solution                  |
| ---------- | ------------------- | ------------------------- |
| `401`      | Invalid credentials | Check email/password      |
| `401`      | Token expired       | Refresh token or re-login |
| `403`      | Email not verified  | Verify email address      |
| `429`      | Rate limit exceeded | Wait before retrying      |
| `500`      | Server error        | Check logs                |

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "unauthorized",
  "requestId": "uuid-for-tracking"
}
```

---

## Session Management

### Token Lifecycle

1. **Login**: Receive `access_token` (1 hour) and `refresh_token` (30 days)
2. **API Calls**: Include `access_token` in Authorization header
3. **Token Refresh**: Automatic refresh before expiration
4. **Logout**: Clear tokens and invalidate session

### Frontend Token Storage

```typescript
// Supabase handles token storage automatically
// Access via supabase.auth.getSession()

// For custom storage (e.g., secure storage):
const {
  data: { session },
} = await supabase.auth.getSession();
await secureStorage.setAuthToken(session.access_token);
```

---

## Testing

### Test Users

Demo users available in development:

- `test@ljubljanafrogs.si` / `demo123`
- `coach@ljubljanafrogs.si` / `demo123`

**Note:** These are for development only. Remove in production.

### Testing Authentication

```bash
# Login
curl -X POST 'https://YOUR_PROJECT.supabase.co/auth/v1/token?grant_type=password' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@ljubljanafrogs.si","password":"demo123"}'

# Authenticated request
curl http://localhost:8888/api/dashboard \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

---

## Security Checklist

- [x] Supabase Auth with JWT tokens
- [x] Tokens validated on every request
- [x] Row Level Security (RLS) enabled
- [x] Rate limiting on all endpoints
- [x] Secure token storage (AES-GCM)
- [x] HTTPS enforced in production
- [x] Service key never exposed to frontend
- [x] Email verification supported

---

## Related Documentation

- [BACKEND_SETUP.md](BACKEND_SETUP.md) - Backend API setup guide
- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Database configuration
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture overview
- [RLS_POLICY_SPECIFICATION.md](RLS_POLICY_SPECIFICATION.md) - Row Level Security

---

## Changelog

- **v2.0 (2025-12)**: Updated to reflect Supabase Auth implementation
- **v1.0 (2025-01)**: Initial custom JWT documentation (deprecated)

---

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/auth-signup)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

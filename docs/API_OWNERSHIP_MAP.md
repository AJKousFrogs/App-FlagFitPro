# API Ownership Map

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: ✅ Implementation Guide

---

## Overview

This document defines which requests hit Supabase directly vs Netlify Functions vs dedicated API endpoints. It establishes clear boundaries for security, validation, and business logic enforcement.

---

## Authentication Strategy

### Decision: **Bearer Token (JWT) stored in memory, refreshed via Supabase**

**Rationale:**

- Angular frontend uses Supabase client for auth operations
- Tokens retrieved from Supabase session
- Tokens sent via `Authorization: Bearer {token}` header
- Backend functions verify tokens using `auth-helper.cjs`
- No localStorage token storage (security best practice)

**Implementation:**

- Frontend: `SupabaseService.getToken()` → stored in memory
- API calls: `authInterceptor` adds `Authorization: Bearer {token}` header
- Backend: `auth-helper.cjs` verifies token and extracts `userId`

---

## API Ownership Rules

### Rule 1: Direct Supabase Access (Frontend → Supabase)

**Use for:**

- ✅ Simple read operations that respect RLS
- ✅ Real-time subscriptions
- ✅ File storage operations
- ✅ Auth operations (login, signup, logout, session management)

**Examples:**

```typescript
// ✅ Allowed: Direct Supabase read
const { data } = await supabase.from("teams").select("*").eq("id", teamId);

// ✅ Allowed: Auth operations
await supabase.auth.signIn({ email, password });
await supabase.auth.signUp({ email, password, options });
await supabase.auth.signOut();
```

**Security:**

- RLS policies enforce access control
- No business logic validation
- No rate limiting (handled by Supabase)

---

### Rule 2: Netlify Functions (Frontend → Netlify Function → Supabase)

**Use for:**

- ✅ Write operations (CREATE, UPDATE, DELETE)
- ✅ Complex business logic
- ✅ Multi-step operations
- ✅ Operations requiring validation beyond RLS
- ✅ Operations requiring audit logging
- ✅ Operations requiring rate limiting
- ✅ Operations requiring external API calls

**Examples:**

```typescript
// ✅ Required: Write operations via API
POST /api/teams
POST /api/training/sessions
POST /api/tournaments/{id}/register

// ✅ Required: Complex operations
POST /api/training/complete (creates workout_log + exercise_logs + updates load_monitoring)
POST /api/teams/{id}/invitations (generates token, sends email)
```

**Security:**

- Token verified in `base-handler.cjs`
- Business logic validation
- Rate limiting applied
- Audit logging
- Service role key used for admin operations

---

### Rule 3: Supabase RPC Functions (Frontend → Supabase RPC)

**Use for:**

- ✅ Complex database operations
- ✅ Operations requiring transaction support
- ✅ Operations requiring database-level validation
- ✅ Operations that benefit from database performance

**Examples:**

```sql
-- ✅ Allowed: Complex calculations
SELECT calculate_acwr(player_id, date);

-- ✅ Allowed: Transactional operations
SELECT assign_program_to_player(program_id, player_id, start_date);
```

**Security:**

- RLS policies enforced
- Function-level permissions
- Input validation in SQL

---

## Endpoint Ownership Matrix

| Endpoint                               | Method | Frontend →       | Backend →    | Auth Method   | Notes                                              |
| -------------------------------------- | ------ | ---------------- | ------------ | ------------- | -------------------------------------------------- |
| **Auth**                               |
| `/auth/login`                          | POST   | Supabase Direct  | N/A          | Supabase Auth | Direct Supabase auth                               |
| `/auth/register`                       | POST   | Supabase Direct  | N/A          | Supabase Auth | Direct Supabase auth                               |
| `/auth/logout`                         | POST   | Supabase Direct  | N/A          | Supabase Auth | Direct Supabase auth                               |
| `/auth-me`                             | GET    | Netlify Function | Supabase     | Bearer Token  | Token verification                                 |
| `/auth/resend-verification`            | POST   | Supabase Direct  | N/A          | Supabase Auth | Direct Supabase auth                               |
| `/auth/password-reset-request`         | POST   | Supabase Direct  | N/A          | Supabase Auth | Direct Supabase auth                               |
| `/auth/password-reset-confirm`         | POST   | Supabase Direct  | N/A          | Supabase Auth | Direct Supabase auth                               |
| **Teams**                              |
| `/api/teams`                           | GET    | Netlify Function | Supabase     | Bearer Token  | RLS enforced                                       |
| `/api/teams`                           | POST   | Netlify Function | Supabase     | Bearer Token  | Business logic + validation                        |
| `/api/teams/:id`                       | GET    | Supabase Direct  | N/A          | Bearer Token  | Simple read, RLS enforced                          |
| `/api/teams/:id`                       | PATCH  | Netlify Function | Supabase     | Bearer Token  | Validation + audit                                 |
| `/api/teams/:id/roster`                | GET    | Supabase Direct  | N/A          | Bearer Token  | Simple read, RLS enforced                          |
| `/api/teams/:id/invitations`           | POST   | Netlify Function | Supabase     | Bearer Token  | Token generation + email                           |
| `/invitations/accept`                  | POST   | Netlify Function | Supabase     | Bearer Token  | Business logic + validation                        |
| `/api/teams/:id/members/:memberId`     | PATCH  | Netlify Function | Supabase     | Bearer Token  | Role validation                                    |
| `/api/teams/:id/members/:memberId`     | DELETE | Netlify Function | Supabase     | Bearer Token  | Business logic                                     |
| **Training**                           |
| `/api/training/programs`               | GET    | Supabase Direct  | N/A          | Bearer Token  | Simple read, RLS enforced                          |
| `/api/training/programs`               | POST   | Netlify Function | Supabase     | Bearer Token  | Validation + business logic                        |
| `/api/training/programs/:id/phases`    | POST   | Netlify Function | Supabase     | Bearer Token  | Validation + sequencing                            |
| `/api/training/phases/:id/weeks`       | POST   | Netlify Function | Supabase     | Bearer Token  | Validation + sequencing                            |
| `/api/training/weeks/:id/sessions`     | POST   | Netlify Function | Supabase     | Bearer Token  | Validation + business logic                        |
| `/api/training/sessions/:id/exercises` | POST   | Netlify Function | Supabase     | Bearer Token  | Validation + business logic                        |
| `/api/training/programs/:id/assign`    | POST   | Netlify Function | Supabase     | Bearer Token  | Business logic + validation                        |
| `/api/training/today`                  | GET    | Supabase Direct  | N/A          | Bearer Token  | Simple read, RLS enforced                          |
| `/api/training/sessions`               | POST   | Netlify Function | Supabase     | Bearer Token  | Creates workout_log + exercise_logs + updates load |
| `/api/training/sessions/:id`           | PATCH  | Netlify Function | Supabase     | Bearer Token  | Recalculates load if allowed                       |
| `/api/training/load`                   | GET    | Supabase Direct  | N/A          | Bearer Token  | Simple read, RLS enforced                          |
| `/api/training/recalculate-load`       | POST   | Netlify Function | Supabase RPC | Bearer Token  | Admin only, batch operation                        |
| **Tournaments**                        |
| `/api/tournaments`                     | GET    | Supabase Direct  | N/A          | Bearer Token  | Simple read, RLS enforced                          |
| `/api/tournaments`                     | POST   | Netlify Function | Supabase     | Bearer Token  | Validation + business logic                        |
| `/api/tournaments/:id`                 | GET    | Supabase Direct  | N/A          | Bearer Token  | Simple read, RLS enforced                          |
| `/api/tournaments/:id/register`        | POST   | Netlify Function | Supabase     | Bearer Token  | Validation + business logic                        |
| `/api/tournaments/:id/unregister`      | POST   | Netlify Function | Supabase     | Bearer Token  | Business logic                                     |
| `/api/tournaments/:id/matches`         | POST   | Netlify Function | Supabase     | Bearer Token  | Business logic + validation                        |
| `/api/matches/:id/result`              | POST   | Netlify Function | Supabase     | Bearer Token  | Business logic + bracket update                    |
| **Analytics**                          |
| `/api/analytics/events`                | POST   | Netlify Function | Supabase     | Bearer Token  | Batched events, validation                         |
| `/api/analytics/dashboard`             | GET    | Netlify Function | Supabase     | Bearer Token  | Aggregated data, role-scoped                       |
| **Community**                          |
| `/api/community/posts`                 | GET    | Supabase Direct  | N/A          | Bearer Token  | Simple read, RLS enforced                          |
| `/api/community/posts`                 | POST   | Netlify Function | Supabase     | Bearer Token  | Validation + moderation check                      |
| `/api/community/posts/:id`             | PATCH  | Netlify Function | Supabase     | Bearer Token  | Ownership validation                               |
| `/api/community/posts/:id`             | DELETE | Netlify Function | Supabase     | Bearer Token  | Ownership validation                               |
| `/api/community/posts/:id/report`      | POST   | Netlify Function | Supabase     | Bearer Token  | Business logic + moderation queue                  |
| `/api/community/moderation/queue`      | GET    | Netlify Function | Supabase     | Bearer Token  | Admin only                                         |
| **AI Coaching**                        |
| `/api/ai/chat`                         | POST   | Netlify Function | External API | Bearer Token  | Risk classification + generation                   |
| `/api/ai/feedback`                     | POST   | Netlify Function | Supabase     | Bearer Token  | Feedback logging                                   |
| `/api/ai/history`                      | GET    | Supabase Direct  | N/A          | Bearer Token  | Simple read, RLS enforced                          |

---

## Request/Response Schema Standards

### Standard Request Headers

```typescript
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

### Standard Response Format

**Success Response:**

```typescript
{
  "data": <response_data>,
  "meta": {
    "timestamp": "2025-01-21T10:00:00Z",
    "request_id": "uuid"
  }
}
```

**Error Response:**

```typescript
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional context
    }
  },
  "meta": {
    "timestamp": "2025-01-21T10:00:00Z",
    "request_id": "uuid"
  }
}
```

### Error Codes

| Code                  | HTTP Status | Description                         |
| --------------------- | ----------- | ----------------------------------- |
| `UNAUTHORIZED`        | 401         | Invalid or missing token            |
| `FORBIDDEN`           | 403         | Insufficient permissions            |
| `NOT_FOUND`           | 404         | Resource not found                  |
| `VALIDATION_ERROR`    | 400         | Input validation failed             |
| `CONFLICT`            | 409         | Resource conflict (e.g., duplicate) |
| `RATE_LIMIT_EXCEEDED` | 429         | Too many requests                   |
| `INTERNAL_ERROR`      | 500         | Server error                        |
| `SERVICE_UNAVAILABLE` | 503         | External service unavailable        |

### Pagination

**Request:**

```typescript
{
  "page": 1,
  "limit": 20,
  "sort": "created_at",
  "order": "desc"
}
```

**Response:**

```typescript
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

### Filtering

**Request:**

```typescript
{
  "filters": {
    "status": "active",
    "created_after": "2025-01-01",
    "team_id": "uuid"
  }
}
```

---

## ID Format Standards

- **UUID**: All primary keys use UUID v4
- **Format**: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- **Example**: `550e8400-e29b-41d4-a716-446655440000`

---

## Rate Limiting

| Endpoint Type | Limit        | Window     |
| ------------- | ------------ | ---------- |
| `READ`        | 100 requests | 5 minutes  |
| `CREATE`      | 20 requests  | 5 minutes  |
| `AUTH`        | 5 requests   | 15 minutes |
| `DEFAULT`     | 50 requests  | 5 minutes  |

---

## Security Enforcement Points

### Frontend

- ✅ Token stored in memory (not localStorage)
- ✅ Token automatically added to requests via interceptor
- ✅ Token refresh handled by Supabase client

### Backend Functions

- ✅ Token verification in `base-handler.cjs`
- ✅ User ID extraction from verified token
- ✅ Rate limiting applied
- ✅ Input validation
- ✅ Business logic validation
- ✅ Audit logging

### Database (RLS)

- ✅ Row-level security policies
- ✅ User-scoped access control
- ✅ Team-scoped access control
- ✅ Role-based access control

---

## Migration Path

### Current State

- Mixed usage: Some endpoints use Supabase direct, others use Netlify Functions
- Inconsistent error handling
- No standardized request/response format

### Target State

- Clear ownership rules enforced
- Standardized error handling
- Consistent request/response format
- Comprehensive documentation

### Steps

1. ✅ Document current ownership (this document)
2. ⏳ Migrate write operations to Netlify Functions
3. ⏳ Standardize error responses
4. ⏳ Add request/response validation
5. ⏳ Update frontend to use standardized formats

---

## Related Documentation

- [ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture overview
- [WORKFLOW_AND_BUSINESS_LOGIC.md](../WORKFLOW_AND_BUSINESS_LOGIC.md) - Business logic documentation
- [RLS_POLICY_SPECIFICATION.md](./RLS_POLICY_SPECIFICATION.md) - RLS policy details

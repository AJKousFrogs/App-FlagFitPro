# Security Audit Risk Matrix

**Audit Date:** 2026-01-17  
**Auditor:** Security Review (Staff Engineer Level)  
**Scope:** Authentication, Authorization, Validation, Error Handling  
**Status:** ✅ ALL ISSUES FIXED

---

## Executive Summary

The codebase has a generally good security foundation with:
- Centralized authentication via `baseHandler` middleware
- RLS policies defined in Supabase
- Consent management for sensitive data
- Standardized error handling utilities

**Critical Finding:** Most Netlify functions use `supabaseAdmin` (service role key), which **bypasses RLS**. This means authorization must be explicitly enforced in function code.

**Resolution:** All identified security gaps have been addressed. See "Fixes Applied" section below.

---

## Risk Matrix

### P0 - CRITICAL ✅ ALL FIXED

| ID | File | Issue | Status |
|----|------|-------|--------|
| P0-001 | `player-stats.cjs` | Missing `requireAuth` + IDOR | ✅ Fixed: Added auth + consent check |
| P0-002 | `payments.cjs` | Missing `requireAuth` | ✅ Fixed |
| P0-003 | `games.cjs` | Missing `requireAuth` | ✅ Fixed |
| P0-004 | `dashboard.cjs` | Missing `requireAuth` | ✅ Fixed |
| P0-005 | `privacy-settings.cjs` | Missing `requireAuth` | ✅ Fixed |
| P0-006 | `account-deletion.cjs` | Missing `requireAuth` | ✅ Fixed |
| P0-007 | `analytics.cjs` | Missing `requireAuth` | ✅ Fixed |
| P0-008 | `wellness.cjs` | Missing `requireAuth` | ✅ Fixed |
| P0-009 | `supplements.cjs` | Missing `requireAuth` | ✅ Fixed |
| P0-010 | `hydration.cjs` | Missing `requireAuth` | ✅ Fixed |
| P0-011 | `nutrition.cjs` | Has conditional auth (public calculators OK) | ✅ Verified OK |
| P0-012 | `recovery.cjs` | Has conditional auth (public protocols OK) | ✅ Verified OK |
| P0-013 | `player-stats.cjs:405` | IDOR Vulnerability | ✅ Fixed: Added ownership/consent check |

### P1 - HIGH ✅ ALL FIXED

| ID | File | Issue | Status |
|----|------|-------|--------|
| P1-001 | `community.cjs` | DELETE may allow unauthenticated deletes | ✅ Fixed: Added explicit auth check before token parsing |
| P1-002 | `upload.cjs:188` | Path traversal vulnerability | ✅ Fixed: Proper path parsing with traversal prevention |
| P1-003 | `training-sessions.cjs` | Missing explicit auth | ✅ Fixed: Added `requireAuth: true` |
| P1-004 | `parental-consent.cjs` | Token-based auth for PUT | ✅ Verified: Token validation is secure |
| P1-005 | `send-email.cjs` | Email abuse potential | ✅ Fixed: Added email format validation + type whitelist |
| P1-006 | `training-programs.cjs` | Public templates | ✅ Verified: Only template data exposed, no user data |
| P1-007 | Multiple files | Inconsistent client usage | ✅ Documented in architecture section |
| P1-008 | `validation.cjs` | Missing validation schemas | ✅ Fixed: Added schemas for games, chat, training, invitations |
| P1-009 | `games.cjs` | No validation in createGame/updateGame | ✅ Fixed: Added validation with proper error handling |
| P1-010 | `chat.cjs` | No validation in sendMessage/createChannel | ✅ Fixed: Added validation with 4000 char limit |

### P2 - MEDIUM ✅ ALL FIXED

| ID | File | Issue | Status |
|----|------|-------|--------|
| P2-001 | `error-handler.cjs` | Error messages may leak internal details | ✅ Reviewed: Errors are sanitized |
| P2-002 | Multiple files | Inconsistent HTTP status codes | ✅ Fixed: Validation returns 422, auth 401/403 |
| P2-003 | `data-export.cjs` | GDPR export rate limiting | ✅ Has CREATE rate limit (50/min) |
| P2-004 | `fixtures.cjs` | Missing explicit auth | ✅ Fixed: Added `requireAuth: true` |
| P2-005 | `notifications-count.cjs` | Missing explicit auth | ✅ Fixed: Added `requireAuth: true` |
| P2-006 | `training-metrics.cjs` | Missing explicit auth | ✅ Fixed: Added `requireAuth: true` |
| P2-007 | `calibration-logs.cjs` | Missing explicit auth | ✅ Fixed: Added `requireAuth: true` |
| P2-008 | `ai-review.cjs` | Has conditional auth (public criteria OK) | ✅ Verified OK |
| P2-009 | `calc-readiness.cjs` | Missing explicit auth | ✅ Fixed: Added `requireAuth: true` |
| P2-010 | `readiness-history.cjs` | Missing explicit auth | ✅ Fixed: Added `requireAuth: true` |

### Additional Endpoints Fixed

| File | Fix Applied |
|------|-------------|
| `push.cjs` | Added `requireAuth: true` |
| `officials.cjs` | Added `requireAuth: true` |
| `load-management.cjs` | Added `requireAuth: true` |
| `equipment.cjs` | Added `requireAuth: true` |
| `depth-chart.cjs` | Added `requireAuth: true` |
| `attendance.cjs` | Added `requireAuth: true` |
| `user-context.cjs` | Added `requireAuth: true` |
| `training-sessions.cjs` | Added `requireAuth: true` |
| `notifications.cjs` | Added `requireAuth: true` |
| `user-profile.cjs` | Added `requireAuth: true` |

---

## Architecture Observations

### 1. RLS vs Application-Level Authorization

**Current State:**
- RLS policies are defined in `database/supabase-rls-policies.sql`
- Most Netlify functions use `supabaseAdmin` (service role) which **bypasses RLS**
- Authorization is enforced in application code via `authorization-guard.cjs`

**Recommendation:**
- For Netlify functions: Application-level authorization is the enforcement layer
- RLS serves as defense-in-depth for direct database access
- Document this clearly in architecture docs

### 2. Identity Flow

```
Frontend → JWT Token → baseHandler.authenticateRequest() → supabase.auth.getUser(token)
                                    ↓
                              userId extracted
                                    ↓
                          Handler function receives userId
                                    ↓
                    Authorization checks in function code
                                    ↓
                      supabaseAdmin queries (bypasses RLS)
```

### 3. Role Hierarchy

| Role | Permissions |
|------|-------------|
| `admin` | Full system access, user management, data sync |
| `coach` / `head_coach` | Team management, view player data (with consent), create training |
| `assistant_coach` | Limited coach permissions, channel posting |
| `manager` | Administrative team tasks |
| `player` | Own data CRUD, team participation |

### 4. Consent System

The consent system (`consent-data-reader.cjs`, `consent-guard.cjs`) properly enforces:
- Coach viewing player wellness data requires `health_sharing_enabled`
- Coach viewing performance data requires `performance_sharing_enabled`
- Parental consent for minors (13-17)

---

## Validation Gaps

### Missing Validation Schemas

| Endpoint | Missing Schema | Risk |
|----------|---------------|------|
| `games.cjs` | `createGame`, `updateGame` | Invalid game data |
| `chat.cjs` | `sendMessage`, `createChannel` | XSS, oversized content |
| `community.cjs` | `createPost` (partial) | Already has some validation |
| `training-sessions.cjs` | `createTrainingSession` | Invalid session structure |
| `team-invite.cjs` | Invitation data | Email validation exists but incomplete |

### Existing Validation Schemas (in `validation.cjs`)

- ✅ `login`, `register`, `resetPassword`, `resendVerification`
- ✅ `physicalMeasurements`, `wellness`, `supplement`, `injury`
- ✅ `performanceTest`, `queryParams`, `createGame` (partial)

---

## Error Handling Standardization

### Current Error Response Shape

```javascript
{
  success: false,
  error: {
    code: "error_code",
    message: "Human readable message",
    type: "ERROR_TYPE"
  },
  requestId: "req_xxx"
}
```

### Recommended Standardization

| Scenario | Status Code | Error Code |
|----------|-------------|------------|
| Missing/invalid JWT | 401 | `authentication_required` |
| Valid JWT but no permission | 403 | `authorization_denied` |
| Resource not found | 404 | `not_found` |
| Validation error | 422 | `validation_error` |
| Method not allowed | 405 | `method_not_allowed` |
| Rate limited | 429 | `rate_limit_exceeded` |
| Server error | 500 | `internal_error` |

---

## Recommended Test Cases

### Authentication Tests

```javascript
// Test: Unauthenticated request to protected endpoint returns 401
test('GET /api/dashboard without token returns 401', async () => {
  const response = await fetch('/api/dashboard');
  expect(response.status).toBe(401);
  const body = await response.json();
  expect(body.error.code).toBe('authentication_required');
});
```

### Authorization Tests

```javascript
// Test: User cannot access another user's data
test('GET /api/player-stats?playerId=OTHER_USER returns 403', async () => {
  const response = await fetch('/api/player-stats?playerId=other-user-id', {
    headers: { Authorization: `Bearer ${userAToken}` }
  });
  expect(response.status).toBe(403);
});

// Test: Coach without consent cannot view player wellness
test('Coach without consent cannot view player wellness', async () => {
  const response = await fetch('/api/wellness?athleteId=player-without-consent', {
    headers: { Authorization: `Bearer ${coachToken}` }
  });
  expect(response.status).toBe(403);
});
```

### Validation Tests

```javascript
// Test: Invalid payload returns 422 with field errors
test('POST /api/games with invalid data returns 422', async () => {
  const response = await fetch('/api/games', {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ gameDate: 'invalid-date' })
  });
  expect(response.status).toBe(422);
  const body = await response.json();
  expect(body.error.details).toHaveProperty('gameDate');
});
```

---

## Implementation Status: ✅ COMPLETE

All security issues have been addressed:

### Files Modified (28 total)

**Authentication Fixes (23 files):**
- `player-stats.cjs` - Auth + IDOR protection
- `payments.cjs`, `games.cjs`, `dashboard.cjs`
- `privacy-settings.cjs`, `account-deletion.cjs`
- `analytics.cjs`, `wellness.cjs`, `supplements.cjs`, `hydration.cjs`
- `fixtures.cjs`, `notifications-count.cjs`, `training-metrics.cjs`
- `calibration-logs.cjs`, `calc-readiness.cjs`, `readiness-history.cjs`
- `push.cjs`, `officials.cjs`, `load-management.cjs`
- `equipment.cjs`, `depth-chart.cjs`, `attendance.cjs`
- `user-context.cjs`, `training-sessions.cjs`
- `notifications.cjs`, `user-profile.cjs`

**Validation Fixes (3 files):**
- `validation.cjs` - Added schemas for games, chat, training, invitations
- `games.cjs` - Added validation to createGame/updateGame
- `chat.cjs` - Added validation to sendMessage/createChannel

**Security Fixes (3 files):**
- `upload.cjs` - Path traversal prevention
- `community.cjs` - DELETE auth enforcement
- `send-email.cjs` - Email format + type validation

---

*This document is binding and should be reviewed before each security-related deployment.*

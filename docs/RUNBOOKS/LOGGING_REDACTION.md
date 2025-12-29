# Logging & Redaction Runbook

**Version:** 1.0.0  
**Last Updated:** 29. December 2025  
**Stack:** Angular 21 + Netlify Functions + Supabase

---

## Table of Contents

1. [Logging Architecture](#logging-architecture)
2. [Triggers](#triggers)
3. [Redaction Rules](#redaction-rules)
4. [Log Investigation Procedures](#log-investigation-procedures)
5. [Sensitive Data Handling](#sensitive-data-handling)
6. [Validation Steps](#validation-steps)
7. [Post-Investigation Tasks](#post-investigation-tasks)

---

## Logging Architecture

### Log Sources

| Source | Location | Retention | Contains PII |
|--------|----------|-----------|--------------|
| **Netlify Function Logs** | Netlify Dashboard / CLI | 7 days | Potentially |
| **Supabase Postgres Logs** | Supabase Dashboard | 7 days | Potentially |
| **Sentry Error Tracking** | Sentry Dashboard | 90 days | Redacted |
| **Angular Frontend** | Browser console | Session | Potentially |
| **Netlify Build Logs** | Netlify Dashboard | 30 days | No |

### Log Levels

| Level | Angular (LoggerService) | Backend | When to Use |
|-------|------------------------|---------|-------------|
| `debug` | Dev only | Dev only | Detailed debugging |
| `info` | Dev only | Always | Normal operations |
| `warn` | Always | Always | Potential issues |
| `error` | Always | Always | Errors and failures |

---

## Triggers

### When to Investigate Logs

- Incident response (see [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md))
- User reports of errors
- Sentry alerts
- Performance degradation
- Security audit

### When to Review Redaction

- Before adding new logging
- After security audit findings
- When handling new PII types
- Quarterly compliance review

---

## Redaction Rules

### Data That MUST Be Redacted

| Data Type | Redaction Method | Example |
|-----------|------------------|---------|
| Passwords | Never log | - |
| JWT tokens | Truncate | `eyJ...abc` → `eyJ***` |
| API keys | Truncate | `sk_live_abc123` → `sk_***` |
| Email addresses | Mask | `user@example.com` → `u***@example.com` |
| Phone numbers | Mask | `+1-555-123-4567` → `+1-555-***-****` |
| Credit cards | Never log | - |
| SSN/Tax IDs | Never log | - |
| Health data | Context only | "wellness check submitted" not values |
| Full names | First name only | "John Doe" → "John D." |

### Data That CAN Be Logged

| Data Type | Notes |
|-----------|-------|
| User IDs (UUIDs) | Safe - not PII |
| Request IDs | Required for tracing |
| Timestamps | Required for debugging |
| HTTP status codes | Required for debugging |
| Error codes | Required for debugging |
| Feature flags | Safe |
| Performance metrics | Safe |

---

## Log Investigation Procedures

### Procedure 1: Netlify Function Logs

#### Via CLI

```bash
# View recent logs for all functions
netlify logs --last 100

# View logs for specific function
netlify logs:function health --last 50
netlify logs:function auth-login --last 50
netlify logs:function dashboard --last 50

# Stream live logs
netlify logs --level info

# Filter by error level
netlify logs --level error
```

#### Via Dashboard

1. Go to https://app.netlify.com
2. Select site → Functions
3. Click on function name
4. View "Logs" tab
5. Filter by time range

### Procedure 2: Supabase Postgres Logs

#### Via Dashboard

1. Go to https://supabase.com/dashboard
2. Select project → Logs
3. Select "Postgres" from dropdown
4. Filter by:
   - Time range
   - Severity (ERROR, WARNING, LOG)
   - Search term

#### Via SQL

```sql
-- View recent errors (requires pg_stat_statements extension)
SELECT * FROM pg_stat_activity 
WHERE state = 'active' 
ORDER BY query_start DESC 
LIMIT 20;

-- Check for slow queries
SELECT query, calls, mean_time, max_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### Procedure 3: Sentry Error Logs

1. Go to Sentry dashboard
2. Filter by:
   - Time range
   - Error type
   - User (by ID only)
   - Release version
3. Review error details
4. Check breadcrumbs for context

### Procedure 4: Angular Frontend Logs

Frontend logs are only available in browser DevTools:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Filter by log level
4. Search for specific terms

**Note:** Production builds only log `warn` and `error` levels.

---

## Sensitive Data Handling

### Adding New Logging

Before adding any `console.log` or logging call, check:

```typescript
// ❌ NEVER LOG
console.log('Password:', password);
console.log('Token:', token);
console.log('User data:', userObject);  // May contain PII

// ✅ SAFE TO LOG
console.log('User ID:', userId);  // UUID is not PII
console.log('Request ID:', requestId);
console.log('Operation:', 'login_attempt');
console.log('Status:', 'success');
```

### Backend Logging Pattern

```javascript
// netlify/functions/example.cjs

// ✅ CORRECT: Log operation, not data
console.log(`[${requestId}] User ${userId} performed action: update_profile`);

// ✅ CORRECT: Redact sensitive fields
function logRequest(event, userId) {
  console.log({
    requestId: event.headers['x-request-id'],
    method: event.httpMethod,
    path: event.path,
    userId: userId || 'anonymous',
    timestamp: new Date().toISOString(),
    // DO NOT include: body, headers with auth, query params with tokens
  });
}

// ❌ WRONG: Logging full request body
console.log('Request body:', JSON.parse(event.body));
```

### Frontend Logging Pattern

```typescript
// angular/src/app/core/services/logger.service.ts

// ✅ CORRECT: Use LoggerService with appropriate levels
this.logger.info('Dashboard loaded', { userId: user.id });
this.logger.error('API call failed', { endpoint: '/dashboard', status: 500 });

// ❌ WRONG: Logging user data
this.logger.info('User logged in', { user: fullUserObject });
```

### Error Tracking Pattern

```typescript
// angular/src/app/core/services/error-tracking.service.ts

// ✅ CORRECT: Set user context with ID only
this.errorTracking.setUser({ id: user.id });

// ❌ WRONG: Including email in user context
this.errorTracking.setUser({ id: user.id, email: user.email });
```

---

## Validation Steps

### Check for PII in Logs

```bash
# Search Netlify logs for potential PII patterns
netlify logs --last 1000 | grep -iE "(password|token|email|@|phone|ssn)"

# If matches found, investigate each one
```

### Audit Logging Code

```bash
# Search for console.log statements
grep -r "console.log" angular/src --include="*.ts" | head -20
grep -r "console.log" netlify/functions --include="*.cjs" | head -20

# Search for potentially dangerous patterns
grep -rE "console\.(log|info|debug).*password" angular/src
grep -rE "console\.(log|info|debug).*token" angular/src
grep -rE "console\.(log|info|debug).*email" angular/src
```

### Verify Redaction in Sentry

1. Go to Sentry dashboard
2. Select a recent error
3. Verify:
   - No passwords in stack traces
   - No tokens in breadcrumbs
   - User context shows ID only (not email)
   - Request bodies are redacted

---

## Post-Investigation Tasks

### After Log Investigation

- [ ] Document findings
- [ ] Create tickets for any issues found
- [ ] Update incident timeline (if applicable)
- [ ] Clear any temporary log access

### After Finding PII in Logs

**Immediate:**
1. Document what was found and where
2. Assess exposure risk
3. Notify security/compliance team

**Remediation:**
1. Fix the logging code
2. Deploy the fix
3. Request log deletion if possible:
   - Netlify: Contact support
   - Supabase: Logs auto-expire in 7 days
   - Sentry: Can delete events via API

**Prevention:**
1. Add redaction at the source
2. Update code review checklist
3. Add automated scanning for PII in logs

### Quarterly Review

- [ ] Audit all logging code
- [ ] Review Sentry data retention settings
- [ ] Verify log access controls
- [ ] Update redaction patterns for new data types
- [ ] Train team on logging best practices

---

## Quick Reference

### Log Access Commands

```bash
# Netlify function logs
netlify logs:function FUNCTION_NAME --last 100

# Stream live logs
netlify logs --level info

# Build logs
netlify logs:build
```

### Redaction Patterns

```javascript
// Email redaction
const redactEmail = (email) => {
  const [user, domain] = email.split('@');
  return `${user[0]}***@${domain}`;
};

// Token redaction
const redactToken = (token) => {
  if (!token || token.length < 10) return '***';
  return `${token.substring(0, 3)}***`;
};

// Phone redaction
const redactPhone = (phone) => {
  return phone.replace(/\d(?=\d{4})/g, '*');
};
```

### Log Locations

| Log Type | Access Method |
|----------|---------------|
| Function logs | `netlify logs:function NAME` |
| Build logs | Netlify Dashboard → Deploys → Deploy |
| Postgres logs | Supabase Dashboard → Logs → Postgres |
| Auth logs | Supabase Dashboard → Logs → Auth |
| Error tracking | Sentry Dashboard |

### PII Checklist for Code Review

When reviewing code with logging:

- [ ] No passwords logged
- [ ] No full tokens logged
- [ ] No email addresses logged (or redacted)
- [ ] No phone numbers logged (or redacted)
- [ ] No credit card data logged
- [ ] No health/wellness values logged
- [ ] User identified by ID only
- [ ] Request bodies not logged (or redacted)
- [ ] Headers with auth not logged

---

## Logging Configuration

### Angular Logger Service

```typescript
// angular/src/app/core/services/logger.service.ts

// Production: Only warn and error
// Development: All levels

// To change level at runtime:
this.logger.setLevel('error');  // Production
this.logger.setLevel('debug');  // Development
```

### Backend Logging

```javascript
// netlify/functions/utils/base-handler.cjs

// Performance logging (safe)
console.log(`[PERFORMANCE] ${functionName} [${requestId}]: ${duration}ms`, {
  requestId,
  method: event.httpMethod,
  path: event.path,
  userId: userId || "anonymous",  // ID only
  duration,
  timestamp: new Date().toISOString(),
});
```

### Sentry Configuration

```typescript
// angular/src/app/core/services/error-tracking.service.ts

// Errors to ignore (not actionable)
ignoreErrors: [
  "ResizeObserver loop",
  "Non-Error exception captured",
  "Network request failed",
  "Load failed",
  "ChunkLoadError",
],

// User context (ID only)
this.Sentry.setUser({ id: userId });  // ✅
this.Sentry.setUser({ id, email });   // ❌
```

---

**Document Version:** 1.0.0  
**Next Review:** March 2026


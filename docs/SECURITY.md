# FlagFit Pro - Security Documentation

**Version:** 3.0.0  
**Last Updated:** 29. December 2025  
**Status:** Production  
**Architecture:** Angular 21 Frontend + Netlify Functions API + Supabase Backend

---

## Table of Contents

1. [Security Architecture Overview](#security-architecture-overview)
2. [Trust Boundaries & Threat Model](#trust-boundaries--threat-model)
3. [Authentication & Session Model](#authentication--session-model)
4. [Request Security](#request-security)
5. [Frontend Security (Angular)](#frontend-security-angular)
6. [Backend/API Security](#backendapi-security)
7. [Browser & Transport Security](#browser--transport-security)
8. [Secrets & Configuration](#secrets--configuration)
9. [Logging & Error Handling](#logging--error-handling)
10. [Known Limitations & Non-Goals](#known-limitations--non-goals)
11. [Security Checklist](#security-checklist)
12. [Troubleshooting](#troubleshooting)

---

## Security Architecture Overview

### System Components

FlagFit Pro consists of three primary layers:

| Layer        | Technology                                  | Security Responsibility                                             |
| ------------ | ------------------------------------------- | ------------------------------------------------------------------- |
| **Frontend** | Angular 21 (standalone components, signals) | XSS prevention, input validation, auth state management             |
| **API**      | Netlify Functions (Node.js)                 | Authentication enforcement, rate limiting, input validation         |
| **Database** | Supabase (PostgreSQL)                       | Row-Level Security (RLS), parameterized queries, session management |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Angular 21 Frontend                          │
├─────────────────────────────────────────────────────────────────┤
│ • HttpInterceptors (auth, error, cache)                         │
│ • Angular template auto-escaping (XSS protection)               │
│ • Route Guards (AuthGuard)                                      │
│ • Environment-based config (no secrets in frontend code)        │
│ • Signals for reactive auth state                               │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS (TLS 1.3)
┌─────────────────────────────────────────────────────────────────┐
│                     Netlify Edge / CDN                          │
├─────────────────────────────────────────────────────────────────┤
│ • Security Headers (CSP, HSTS, X-Frame-Options)                 │
│ • CORS enforcement                                              │
│ • Static asset caching with immutable headers                   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                   Netlify Functions (API)                       │
├─────────────────────────────────────────────────────────────────┤
│ • JWT validation via Supabase                                   │
│ • Rate limiting (tiered: AUTH, CREATE, READ, DELETE)            │
│ • Input validation                                              │
│ • Error sanitization (no stack traces to client)                │
│ • Centralized base-handler middleware                           │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase Backend                            │
├─────────────────────────────────────────────────────────────────┤
│ • Row Level Security (RLS) policies on all tables               │
│ • Parameterized queries (SQL injection prevention)              │
│ • Password hashing (bcrypt via GoTrue)                          │
│ • Session/token management                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Key Security Components

| Component             | Location                                                 | Purpose                                          |
| --------------------- | -------------------------------------------------------- | ------------------------------------------------ |
| **Auth Interceptor**  | `angular/src/app/core/interceptors/auth.interceptor.ts`  | Attaches JWT to API requests                     |
| **Error Interceptor** | `angular/src/app/core/interceptors/error.interceptor.ts` | Handles 401/403, triggers logout on auth failure |
| **Auth Guard**        | `angular/src/app/core/guards/auth.guard.ts`              | Protects routes requiring authentication         |
| **Auth Service**      | `angular/src/app/core/services/auth.service.ts`          | Supabase auth wrapper with reactive signals      |
| **Rate Limiter**      | `netlify/functions/utils/rate-limiter.js`               | IP-based API rate limiting                       |
| **Base Handler**      | `netlify/functions/utils/base-handler.js`               | Centralized auth + rate limiting middleware      |
| **Security Headers**  | `netlify.toml`                                           | CSP, HSTS, X-Frame-Options, etc.                 |

---

## Trust Boundaries & Threat Model

### Trust Boundaries

1. **Browser ↔ CDN/Edge**: User input is untrusted; Angular sanitizes by default
2. **CDN ↔ API**: All requests must include valid JWT; API validates every request
3. **API ↔ Database**: API uses service key; RLS policies enforce user-level access

### Threat Model (High-Level)

| Threat                                | Mitigation                                                           |
| ------------------------------------- | -------------------------------------------------------------------- |
| **XSS (Cross-Site Scripting)**        | Angular auto-escaping, CSP headers, DomSanitizer for trusted content |
| **CSRF (Cross-Site Request Forgery)** | Not applicable—see [CSRF Position](#csrf-position) below             |
| **SQL Injection**                     | Supabase SDK uses parameterized queries exclusively                  |
| **Broken Authentication**             | JWT tokens via Supabase, automatic refresh, server-side validation   |
| **Sensitive Data Exposure**           | HTTPS everywhere, no secrets in frontend, error redaction            |
| **Rate Limiting/DoS**                 | Tiered rate limits on all API endpoints                              |
| **Clickjacking**                      | `X-Frame-Options: DENY`, `frame-ancestors 'none'` in CSP             |

---

## Authentication & Session Model

### Authentication Strategy

FlagFit Pro uses **Supabase Auth** with JWT tokens. The frontend never handles passwords directly after login—Supabase's GoTrue service manages all authentication.

### Token Flow

```
1. User submits credentials to Supabase Auth (not our API)
2. Supabase returns JWT access_token + refresh_token
3. Angular stores session via Supabase SDK (localStorage, managed by Supabase)
4. HttpInterceptor attaches Bearer token to all API requests
5. Netlify Functions validate JWT with Supabase service key
6. Supabase RLS enforces row-level access based on user ID in JWT
```

### Where Tokens Live

| Token                | Storage                     | Managed By   |
| -------------------- | --------------------------- | ------------ |
| `access_token` (JWT) | localStorage                | Supabase SDK |
| `refresh_token`      | localStorage                | Supabase SDK |
| Session metadata     | Supabase SDK internal state | Supabase SDK |

**Note:** We do not use cookies for authentication. Tokens are stored in localStorage and sent via `Authorization` header.

### Token Lifecycle

- **Access Token Expiry:** Configured in Supabase (default: 1 hour)
- **Refresh:** Supabase SDK automatically refreshes tokens before expiry
- **Logout:** Clears local storage and Supabase session

### Auth Interceptor Implementation

```typescript
// angular/src/app/core/interceptors/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip auth for mock API requests (DEVELOPMENT ONLY - never in production)
  // ⚠️ WARNING: Mock API endpoints should NEVER be accessible in production builds
  if (req.url.includes("mock://api")) {
    if (environment.production) {
      console.error("SECURITY ERROR: Mock API accessed in production!");
      return throwError(
        () => new Error("Mock API not available in production"),
      );
    }
    return next(req);
  }

  // Get token asynchronously from Supabase
  return from(authService.getToken()).pipe(
    switchMap((token) => {
      if (token) {
        const clonedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
        return next(clonedReq);
      }
      return next(req);
    }),
  );
};
```

### Interceptor Registration

```typescript
// angular/src/app/app.config.ts
provideHttpClient(
  withInterceptors([authInterceptor, cacheInterceptor, errorInterceptor]),
);
```

---

## Request Security

### CSRF Position

**CSRF protection via tokens is not required for this architecture.**

Rationale:

1. **No cookie-based authentication:** Auth tokens are stored in localStorage, not cookies
2. **Authorization header required:** All authenticated requests include `Authorization: Bearer <JWT>`
3. **Same-Origin Policy:** Browsers prevent cross-origin JavaScript from reading responses
4. **CORS enforcement:** API only accepts requests from allowed origins

CSRF attacks require the browser to automatically attach credentials (cookies) to cross-origin requests. Since we use `Authorization` headers (not cookies), the browser will not automatically include credentials in cross-origin requests.

### Rate Limiting

Rate limiting is implemented in `netlify/functions/utils/rate-limiter.js` and applied via the base-handler middleware.

#### Rate Limit Tiers

| Tier      | Max Requests | Window   | Use Case              |
| --------- | ------------ | -------- | --------------------- |
| `AUTH`    | 5            | 1 minute | Login, password reset |
| `CREATE`  | 50           | 1 minute | POST operations       |
| `READ`    | 200          | 1 minute | GET operations        |
| `UPDATE`  | 30           | 1 minute | PUT/PATCH operations  |
| `DELETE`  | 10           | 1 minute | DELETE operations     |
| `DEFAULT` | 100          | 1 minute | Fallback              |

#### Rate Limit Headers

All responses include:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1703865600
Retry-After: 30  (only on 429)
```

#### Configuration via Environment

Override defaults in Netlify environment variables:

```
RATE_LIMIT_AUTH_MAX=3
RATE_LIMIT_AUTH_WINDOW=120000
RATE_LIMIT_READ_MAX=500
```

### Replay Protection

**Not currently implemented.** JWT tokens are valid until expiry. Consider implementing:

- JTI (JWT ID) tracking for high-security operations
- Nonce-based request signing for sensitive mutations

---

## Frontend Security (Angular)

### Built-in XSS Protection

Angular automatically sanitizes values bound to the DOM via its security contexts.

#### Safe Patterns (Default Behavior)

```typescript
// ✅ SAFE: Angular sanitizes automatically
@Component({
  template: `
    <div>{{ userInput }}</div>           <!-- Text interpolation -->
    <div [textContent]="userInput"></div> <!-- Property binding -->
    <a [href]="userUrl">Link</a>          <!-- URL sanitization -->
  `
})
```

#### Dangerous Patterns (Avoid)

```typescript
// ❌ DANGEROUS: Bypassing sanitization
element.innerHTML = userInput; // Direct DOM manipulation

// ❌ DANGEROUS: Trusting user input
this.sanitizer.bypassSecurityTrustHtml(userInput);
```

### DomSanitizer Usage

Only use `DomSanitizer.bypassSecurityTrust*` when:

1. You control the content source
2. You have sanitized the content first with an allowlist
3. You have documented why bypass is necessary

Example from the codebase:

```typescript
// angular/src/app/shared/components/rich-text/rich-text.component.ts
private sanitizeHtml(html: string): string {
  if (!html) return '';

  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Remove dangerous elements
  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'];
  dangerousTags.forEach(tag => {
    const elements = temp.getElementsByTagName(tag);
    while (elements.length > 0) {
      elements[0].parentNode?.removeChild(elements[0]);
    }
  });

  // Remove event handlers
  const allElements = temp.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    const attrs = Array.from(el.attributes);
    attrs.forEach(attr => {
      if (attr.name.startsWith('on') ||
          (attr.name === 'href' && attr.value.startsWith('javascript:'))) {
        el.removeAttribute(attr.name);
      }
    });
  }

  return temp.innerHTML;
}
```

### Route Guards

```typescript
// angular/src/app/core/guards/auth.guard.ts
export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  // Wait for Supabase auth to initialize
  await supabaseService.waitForInit();

  const hasSession = !!supabaseService.session();
  const isAuthenticated = authService.isAuthenticated();

  if (hasSession || isAuthenticated) {
    return true;
  }

  router.navigate(["/login"], { queryParams: { returnUrl: state.url } });
  return false;
};
```

### Environment Separation

```typescript
// angular/src/environments/environment.ts
export const environment = {
  production: false,
  supabase: {
    url: getEnvValue("SUPABASE_URL", DEFAULTS.SUPABASE_URL),
    anonKey: getEnvValue("SUPABASE_ANON_KEY", DEFAULTS.SUPABASE_ANON_KEY),
  },
};
```

The `anonKey` is safe to expose—it only provides unauthenticated access limited by RLS policies.

---

## Backend/API Security

### Centralized Request Handling

All Netlify Functions use the base-handler middleware:

```javascript
// netlify/functions/utils/base-handler.js
async function baseHandler(event, context, options = {}) {
  const {
    functionName,
    allowedMethods = ["GET"],
    rateLimitType = "READ",
    requireAuth = true,
    handler,
  } = options;

  // 1. Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  // 2. Validate HTTP method
  if (!allowedMethods.includes(event.httpMethod)) {
    return createErrorResponse("Method not allowed", 405);
  }

  // 3. Apply rate limiting
  const rateLimitResponse = applyRateLimit(event, rateLimitType);
  if (rateLimitResponse) return rateLimitResponse;

  // 4. Authenticate request
  if (requireAuth) {
    const auth = await authenticateRequest(event);
    if (!auth.success) return auth.error;
    userId = auth.user.id;
  }

  // 5. Execute handler
  return await handler(event, context, { userId, requestId });
}
```

### Input Validation

**Always validate on the server**—client validation is for UX only:

```javascript
// Example validation pattern
function validateInput(body) {
  const { email, name } = body;

  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    throw new Error("Invalid email");
  }

  if (!name || name.length < 2 || name.length > 100) {
    throw new Error("Name must be 2-100 characters");
  }

  return {
    email: email.toLowerCase().trim(),
    name: name.trim(),
  };
}
```

### SQL Injection Prevention

Supabase uses parameterized queries by default:

```javascript
// ✅ SAFE: Parameterized query
const { data, error } = await supabase
  .from("users")
  .select("*")
  .eq("id", userId); // userId is parameterized

// ❌ DANGEROUS: Never do this
const query = `SELECT * FROM users WHERE id = '${userId}'`;
```

### Error Sanitization

Never expose internal details to clients:

```javascript
// ✅ SAFE: Sanitized error response
return {
  statusCode: 500,
  body: JSON.stringify({
    success: false,
    error: "An unexpected error occurred",
    code: "internal_error",
    requestId, // For support correlation
  }),
};
```

---

## Browser & Transport Security

### Security Headers

All security headers are configured in `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    # Prevent clickjacking
    X-Frame-Options = "DENY"

    # XSS filter (legacy browsers)
    X-XSS-Protection = "1; mode=block"

    # Prevent MIME sniffing
    X-Content-Type-Options = "nosniff"

    # Control referrer information
    Referrer-Policy = "strict-origin-when-cross-origin"

    # Force HTTPS (HSTS) - 2 years, include subdomains, preload
    Strict-Transport-Security = "max-age=63072000; includeSubDomains; preload"

    # Disable unnecessary browser features
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"

    # Cross-Origin isolation
    Cross-Origin-Embedder-Policy = "credentialless"
    Cross-Origin-Opener-Policy = "same-origin"
    Cross-Origin-Resource-Policy = "same-site"
```

### Content Security Policy

```toml
Content-Security-Policy = """
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob: https:;
  connect-src 'self' https://*.supabase.co https://*.netlify.app https://*.netlify.com wss://*.supabase.co;
  object-src 'none';
  media-src 'self';
  frame-src 'none';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests
"""
```

#### CSP Notes

| Directive     | Current Value     | Notes                                                |
| ------------- | ----------------- | ---------------------------------------------------- |
| `script-src`  | `'unsafe-inline'` | **Improvement opportunity:** Move to nonce-based CSP |
| `style-src`   | `'unsafe-inline'` | Required for Angular component styles                |
| `connect-src` | Supabase domains  | Required for API and realtime                        |
| `frame-src`   | `'none'`          | No iframes allowed                                   |

---

## Secrets & Configuration

### What Goes Where

| Secret                 | Location           | Safe to Commit?                |
| ---------------------- | ------------------ | ------------------------------ |
| `SUPABASE_URL`         | Code + Netlify Env | ✅ Yes (public)                |
| `SUPABASE_ANON_KEY`    | Code + Netlify Env | ✅ Yes (public, RLS-protected) |
| `SUPABASE_SERVICE_KEY` | Netlify Env Only   | ❌ **NEVER**                   |
| `JWT_SECRET`           | Supabase (managed) | ❌ **NEVER**                   |
| `SENTRY_DSN`           | Netlify Env Only   | ⚠️ Keep private                |

### Environment Variable Handling

- Frontend: Only `SUPABASE_URL` and `SUPABASE_ANON_KEY` are exposed
- Backend: All secrets accessed via `process.env` in Netlify Functions
- `.env` files are in `.gitignore`

---

## Logging & Error Handling

### Error Tracking

Errors are tracked via Sentry (when enabled) with automatic PII redaction:

```typescript
// angular/src/app/core/services/error-tracking.service.ts
captureError(error: Error, context?: ErrorContext): void {
  // Log locally (redacted)
  this.logger.error(`[ERROR]`, error.message, context);

  // Send to Sentry (if enabled)
  if (this.Sentry && this.isInitialized) {
    this.Sentry.withScope((scope) => {
      if (context?.component) scope.setTag('component', context.component);
      // User ID only, not email/name
      if (this.userContext.id) scope.setUser({ id: this.userContext.id });
      this.Sentry.captureException(error);
    });
  }
}
```

### Redaction Rules

**Never log:**

- Passwords or tokens
- Full email addresses (use `u***@domain.com`)
- Credit card numbers
- Personal health information
- Full stack traces to clients

**Safe to log:**

- User IDs (UUIDs)
- Request paths
- HTTP status codes
- Timing information
- Anonymized error messages

---

## Known Limitations & Non-Goals

This section documents security features that are **intentionally not implemented** or **known limitations**. This is not a to-do list—these are conscious architectural decisions.

### Not Implemented (By Design)

| Feature             | Reason                                                          | Risk Level |
| ------------------- | --------------------------------------------------------------- | ---------- |
| **CSRF Tokens**     | Not needed with Authorization header auth                       | N/A        |
| **Nonce-based CSP** | Would require SSR; `'unsafe-inline'` is acceptable for this app | Low        |
| **Request Signing** | Overhead not justified for current threat model                 | Low        |
| **IP Allowlisting** | Would break mobile/dynamic IP users                             | N/A        |

### Known Limitations

| Limitation                       | Impact                                             | Mitigation                                               |
| -------------------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| **Rate limiting is in-memory**   | Resets on function cold start; not distributed     | Acceptable for current scale; upgrade to Redis if needed |
| **JWTs are not revocable**       | Compromised token valid until expiry               | Short expiry (1h), logout clears local storage           |
| **No request replay protection** | Same request can be replayed within token validity | Idempotent operations; consider JTI for sensitive ops    |
| **localStorage for tokens**      | Vulnerable to XSS if XSS exists                    | Strong CSP, Angular auto-escaping, code review           |

### Intentional Trade-offs

1. **Simplicity over defense-in-depth:** We rely on Supabase RLS as the primary access control, not duplicating checks in every API function.

2. **Developer experience over maximum lockdown:** `'unsafe-inline'` in CSP allows Angular component styles without complex build tooling.

3. **Availability over strict rate limiting:** Rate limits are permissive enough to avoid false positives for legitimate users.

---

## Security Checklist

### Pre-Deployment Audit

#### Authentication & Authorization

- [ ] All protected routes use `authGuard`
- [ ] JWT tokens attached via `authInterceptor`
- [ ] 401/403 responses handled by `errorInterceptor`
- [ ] Supabase RLS policies enabled on all tables
- [ ] Service key only used server-side

#### Input Validation

- [ ] All form inputs validated with Angular validators
- [ ] All API inputs validated server-side
- [ ] File uploads restricted by type and size
- [ ] URLs sanitized before use

#### XSS Prevention

- [ ] No direct `innerHTML` assignment with user data
- [ ] `bypassSecurityTrust*` usage reviewed and justified
- [ ] CSP configured in `netlify.toml`
- [ ] No `eval()` or `new Function()` with user input

#### API Security

- [ ] Rate limiting applied to all endpoints via base-handler
- [ ] CORS configured for allowed origins only
- [ ] Error responses don't expose internals
- [ ] Request logging redacts PII

#### Secrets

- [ ] No secrets in source control
- [ ] Service key only in Netlify env vars
- [ ] Anon key is the only key in frontend code
- [ ] `.env` files in `.gitignore`

#### Headers

- [ ] CSP header configured
- [ ] HSTS enabled with preload
- [ ] X-Frame-Options = DENY
- [ ] X-Content-Type-Options = nosniff

---

## Troubleshooting

### Issue: 401 Unauthorized on API Calls

**Symptoms:** API calls fail with 401, user appears logged in.

**Solutions:**

1. Check token expiration:

```typescript
const session = await supabase.auth.getSession();
console.log("Session expires:", session.data.session?.expires_at);
```

2. Verify interceptor is registered:

```typescript
// app.config.ts - authInterceptor should be first
provideHttpClient(
  withInterceptors([authInterceptor, cacheInterceptor, errorInterceptor]),
);
```

3. Force token refresh:

```typescript
await supabase.auth.refreshSession();
```

### Issue: CSP Blocking Resources

**Symptoms:** Console shows "Refused to load script/style" errors.

**Solutions:**

1. Check CSP header in browser DevTools → Network → Response Headers
2. Add missing domain to appropriate directive in `netlify.toml`
3. For inline scripts, consider moving to external files

### Issue: Rate Limit Exceeded

**Symptoms:** 429 Too Many Requests responses.

**Solutions:**

1. Check `Retry-After` header for wait time
2. Implement exponential backoff in client
3. Adjust limits via environment variables if needed

### Issue: CORS Errors

**Symptoms:** "Access-Control-Allow-Origin" errors in console.

**Solutions:**

1. Verify request origin matches allowed origins
2. Check preflight (OPTIONS) requests are handled by base-handler
3. Ensure credentials mode matches server config

---

## Additional Resources

### Internal Documentation

- [Architecture Documentation](./ARCHITECTURE.md)
- [Authentication Guide](./AUTHENTICATION_PATTERN.md)
- [RLS Policy Specification](./RLS_POLICY_SPECIFICATION.md)
- [Error Handling Guide](./ERROR_HANDLING_GUIDE.md)

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Angular Security Guide](https://angular.dev/best-practices/security)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Content Security Policy Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

## Security Contact

For security issues or concerns:

**DO NOT** create public GitHub issues for security vulnerabilities.

**Contact:** merlin@ljubljanafrogs.si

**Response Time:** 24-48 hours for security reports

---

**Document Version:** 3.0.0  
**Last Review Date:** December 29, 2025  
**Next Review Date:** March 29, 2026

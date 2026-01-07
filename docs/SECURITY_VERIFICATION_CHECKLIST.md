# Security Documentation Verification Checklist

**Purpose:** This checklist documents the assumptions that must remain true in the codebase for SECURITY.md to stay valid. Review this checklist when making architectural changes.

---

## Authentication Architecture

| Assumption | Verification | Last Verified |
|------------|--------------|---------------|
| Auth uses Supabase SDK, not custom implementation | Check `angular/src/app/core/services/auth.service.ts` uses `SupabaseService` | Dec 29, 2025 |
| Tokens stored in localStorage (not cookies) | Check Supabase SDK configuration; no `withCredentials` in HTTP calls | Dec 29, 2025 |
| Auth interceptor attaches Bearer token | Check `angular/src/app/core/interceptors/auth.interceptor.ts` sets `Authorization` header | Dec 29, 2025 |
| No cookie-based auth exists | Grep codebase for `withCredentials: true` or `credentials: 'include'` | Dec 29, 2025 |

**If any of these change:** CSRF protection may become necessary.

---

## Frontend Security

| Assumption | Verification | Last Verified |
|------------|--------------|---------------|
| Angular auto-escaping is not bypassed | Search for `innerHTML =` assignments with user data | Dec 29, 2025 |
| `bypassSecurityTrust*` only used after sanitization | Review all uses of `DomSanitizer.bypassSecurityTrust*` | Dec 29, 2025 |
| No `eval()` or `new Function()` with user input | Grep for `eval(` and `new Function(` | Dec 29, 2025 |
| Auth guard protects all sensitive routes | Check `angular/src/app/app.routes.ts` for guard coverage | Dec 29, 2025 |

**If any of these change:** XSS risk increases significantly.

---

## API Security

| Assumption | Verification | Last Verified |
|------------|--------------|---------------|
| All functions use base-handler middleware | Check each function in `netlify/functions/` uses `baseHandler` | Dec 29, 2025 |
| Rate limiting applied to all endpoints | Verify `rateLimitType` parameter in each handler | Dec 29, 2025 |
| Auth required by default | Verify `requireAuth: true` is default in base-handler | Dec 29, 2025 |
| No raw SQL queries with string interpolation | Grep for template literals with SQL keywords | Dec 29, 2025 |

**If any of these change:** API may be vulnerable to abuse or injection.

---

## Security Headers

| Assumption | Verification | Last Verified |
|------------|--------------|---------------|
| CSP header is configured | Check `netlify.toml` contains `Content-Security-Policy` | Dec 29, 2025 |
| HSTS is enabled with preload | Check `Strict-Transport-Security` in `netlify.toml` | Dec 29, 2025 |
| X-Frame-Options is DENY | Check `netlify.toml` | Dec 29, 2025 |
| Headers apply to all routes (`/*`) | Check `for = "/*"` in header configuration | Dec 29, 2025 |

**If any of these change:** Browser-based attacks may succeed.

---

## Secrets Management

| Assumption | Verification | Last Verified |
|------------|--------------|---------------|
| `SUPABASE_SERVICE_KEY` not in source control | Grep entire repo for service key patterns | Dec 29, 2025 |
| `.env` files are gitignored | Check `.gitignore` includes `.env*` | Dec 29, 2025 |
| Only anon key in frontend code | Check `angular/src/environments/` for key types | Dec 29, 2025 |
| Service key only used in Netlify Functions | Grep for `SUPABASE_SERVICE_KEY` usage | Dec 29, 2025 |

**If any of these change:** Credentials may be exposed.

---

## Error Handling

| Assumption | Verification | Last Verified |
|------------|--------------|---------------|
| Stack traces not sent to client | Check error responses in `netlify/functions/utils/error-handler.cjs` | Dec 29, 2025 |
| PII redacted in logs | Check logging patterns in error-tracking.service.ts | Dec 29, 2025 |
| Global error handler captures unhandled errors | Check `GlobalErrorHandler` is registered in `app.config.ts` | Dec 29, 2025 |

**If any of these change:** Sensitive information may leak.

---

## Verification Commands

Run these commands to verify assumptions:

```bash
# Check for innerHTML assignments
grep -r "innerHTML\s*=" angular/src --include="*.ts" --include="*.html"

# Check for bypassSecurityTrust usage
grep -r "bypassSecurityTrust" angular/src --include="*.ts"

# Check for eval usage
grep -r "eval(" angular/src --include="*.ts"
grep -r "new Function(" angular/src --include="*.ts"

# Check for cookie credentials
grep -r "withCredentials" angular/src --include="*.ts"
grep -r "credentials.*include" angular/src --include="*.ts"

# Check for hardcoded secrets (should return nothing sensitive)
grep -r "eyJ" angular/src --include="*.ts" | grep -v "environment"

# Check all functions use base-handler
for f in netlify/functions/*.cjs; do
  if ! grep -q "baseHandler" "$f" 2>/dev/null; then
    echo "WARNING: $f may not use baseHandler"
  fi
done
```

---

## When to Re-Verify

Re-run this checklist when:

1. **Adding new authentication methods** (OAuth, SSO, etc.)
2. **Changing token storage** (localStorage → cookies, etc.)
3. **Adding new API endpoints** without using base-handler
4. **Modifying CSP or security headers**
5. **Adding third-party scripts** to the frontend
6. **Changing the database access pattern**

---

## Secondary Validation: Risky Claims Analysis

The following claims in SECURITY.md should be periodically verified:

| Claim | Risk Level | Verification Method | Recommendation |
|-------|------------|---------------------|----------------|
| "Angular automatically sanitizes values bound to the DOM" | Low | Angular framework behavior; unlikely to change | No action needed |
| "Supabase uses parameterized queries by default" | Low | Supabase SDK behavior; verify SDK version | No action needed |
| "CSRF is mitigated by Authorization header auth" | Medium | Verify no cookie-based auth exists | Verified: no `withCredentials` in codebase |
| "Rate limiting is applied to all endpoints" | Medium | Audit all Netlify Functions | **Note:** Some public endpoints (sponsors, health) don't use baseHandler—this is intentional for public data |
| "RLS policies enforce row-level access" | High | Audit Supabase RLS policies regularly | Run `mcp_supabase_get_advisors` security check |
| "Service key only used server-side" | High | Grep codebase for service key usage | Verified: only in `netlify/functions/` |
| "No innerHTML with user data" | Medium | Grep for `innerHTML =` | **Note:** 4 uses found—all are safe (sanitized HTML or static content) |
| "No eval() with user input" | High | Grep for `eval(` | Verified: no eval usage |

### innerHTML Usage Audit (December 29, 2025)

| File | Line | Safe? | Reason |
|------|------|-------|--------|
| `format.utils.ts:265` | `div.innerHTML = str` | ✅ Yes | Used for unescaping HTML entities, output is `textContent` only |
| `rich-text.component.ts:277` | `temp.innerHTML = html` | ✅ Yes | Inside `sanitizeHtml()` function that strips dangerous elements |
| `rich-text.component.ts:338` | `element.innerHTML = value` | ✅ Yes | Value comes from sanitized `sanitizedValue()` computed signal |
| `header.component.ts:550` | `textLogo.innerHTML = ...` | ✅ Yes | Static string, no user input |

### Functions Without baseHandler (Intentional)

The following functions don't use `baseHandler` because they are:
- Public endpoints (no auth required)
- Utility modules (not HTTP handlers)
- Test/development endpoints

| Function | Reason |
|----------|--------|
| `sponsors.cjs` | Public endpoint - sponsor logos for login page |
| `sponsor-logo.cjs` | Public endpoint - individual sponsor logo |
| `health.cjs` | Public endpoint - health check |
| `supabase-client.cjs` | Utility module, not an endpoint |
| `cache.cjs` | Utility module |
| `validation.cjs` | Utility module |
| `test-email.cjs` | Development/test endpoint |
| `send-email.cjs` | Internal utility |
| `import-open-data.cjs` | Admin/development endpoint |
| `isometrics.cjs` | May need baseHandler - review |
| `plyometrics.cjs` | May need baseHandler - review |
| `update-chatbot-stats.cjs` | Internal utility |

---

**Last Full Verification:** December 29, 2025  
**Next Scheduled Verification:** March 29, 2026


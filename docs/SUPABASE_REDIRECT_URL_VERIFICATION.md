# Supabase Redirect URL Verification Guide

**Created:** January 9, 2026  
**Purpose:** Ensure magic link and email verification flows work correctly  
**Criticality:** HIGH - Misconfiguration blocks all passwordless auth flows

---

## Overview

Supabase requires explicit whitelisting of redirect URLs for security. If your redirect URLs are not configured, users will see errors when clicking magic links or email verification links.

---

## Redirect URLs Required

Your application needs the following redirect URLs configured:

### Development (Local)

```
http://localhost:4200/auth-callback
http://127.0.0.1:4200/auth-callback
```

### Netlify Preview Deploys

```
https://*--YOUR-SITE-NAME.netlify.app/auth-callback
```

Note: Use wildcard `*` for preview deploys (e.g., `https://*--flagfit-pro.netlify.app/auth-callback`)

### Production

```
https://your-production-domain.com/auth-callback
```

Replace with your actual production domain.

---

## Verification Steps

### 1. Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** (left sidebar)

### 2. Configure Redirect URLs

1. Click **URL Configuration** (under Settings section)
2. Find **Redirect URLs** section
3. Add each URL from the list above (one per line)
4. Click **Save**

### 3. Verify Site URL

While on the URL Configuration page:

1. Check **Site URL** field
2. Should be set to your primary domain (e.g., `https://your-production-domain.com`)
3. Update if needed

### 4. Test Magic Link Flow

**Local Testing:**

```bash
# Start local dev server
npm run dev

# In browser:
# 1. Go to http://localhost:4200/login
# 2. Enter email
# 3. Request magic link
# 4. Check email
# 5. Click magic link
# 6. Should redirect to http://localhost:4200/auth-callback
# 7. Should then redirect to dashboard
```

**Production Testing:**

1. Deploy to production
2. Request magic link with real email
3. Click link in email
4. Verify redirect works
5. Check browser console for errors

---

## Common Issues & Solutions

### Issue: "Invalid Redirect URL" Error

**Symptom:** After clicking magic link, user sees "Invalid redirect URL" error

**Solution:**

1. Double-check URL is in Supabase redirect allowlist
2. Ensure URL exactly matches (including `https://` or `http://`)
3. Check for trailing slashes (Supabase is strict about exact matches)

### Issue: Magic Link Opens But Nothing Happens

**Symptom:** Magic link opens, but user stays on loading screen

**Solution:**

1. Open browser console
2. Check for errors
3. Likely issue: Tokens in URL hash not being parsed
4. Verify `auth-callback.component.ts` is handling hash correctly

### Issue: "Auth Session Missing" After Redirect

**Symptom:** User redirected but session not established

**Solution:**

1. Check browser console for Supabase errors
2. Verify tokens are valid (not expired)
3. Magic links expire after 1 hour by default
4. User may need to request new link

---

## Security Notes

### Why Whitelisting?

Supabase whitelists redirect URLs to prevent:

- Open redirect vulnerabilities
- Token theft via malicious redirect
- Phishing attacks

### Wildcard Usage

- Use wildcards sparingly (only for preview deploys)
- Production URLs should be explicit
- Never use `*` alone (too permissive)

### HTTPS Requirements

- Production URLs **must** use HTTPS
- HTTP only allowed for `localhost` / `127.0.0.1`
- Supabase enforces this for security

---

## Environment Configuration

### Frontend Configuration

Verify your Angular environment files:

**`angular/src/environments/environment.development.ts`:**

```typescript
export const environment = {
  supabase: {
    url: "https://YOUR-PROJECT.supabase.co",
    anonKey: "YOUR-ANON-KEY",
    redirectUrl: "http://localhost:4200/auth-callback", // Add this
  },
};
```

**`angular/src/environments/environment.ts`:**

```typescript
export const environment = {
  supabase: {
    url: "https://YOUR-PROJECT.supabase.co",
    anonKey: "YOUR-ANON-KEY",
    redirectUrl: "https://your-production-domain.com/auth-callback", // Add this
  },
};
```

### Supabase Config

Check `supabase/config.toml`:

```toml
[auth]
site_url = "https://your-production-domain.com"
additional_redirect_urls = [
  "http://localhost:4200/auth-callback",
  "https://*--your-site.netlify.app/auth-callback"
]
```

---

## Verification Checklist

Use this checklist before deploying:

- [ ] All redirect URLs added to Supabase Dashboard
- [ ] Site URL configured in Supabase
- [ ] Environment files updated with redirect URLs
- [ ] Local magic link tested (localhost)
- [ ] Preview deploy magic link tested (Netlify)
- [ ] Production magic link tested (real domain)
- [ ] Browser console shows no errors
- [ ] Session persists after redirect
- [ ] User successfully reaches dashboard

---

## Monitoring

### Check Logs

**Supabase Auth Logs:**

1. Go to Supabase Dashboard → Authentication → Logs
2. Filter by "magic link" or "email verification"
3. Look for failed attempts

**Frontend Logs:**

1. Check browser console for `[Auth]` prefixed logs
2. Look for "Token processing error" messages
3. Verify "Session established successfully" appears

### Application Logs

In `auth-callback.component.ts`, logging is now enabled:

```typescript
this.logger.info("[Auth] Session established successfully", {
  userId: data.session.user.id,
  email: data.session.user.email,
  type: "magiclink",
});
```

Check application logs for these entries.

---

## Troubleshooting Commands

### Check Current Supabase Config

```bash
# In Supabase CLI
supabase status

# Check auth settings
supabase settings get
```

### Test Auth Flow Locally

```bash
# Start local Supabase
supabase start

# Start frontend
npm run dev:angular

# Check Supabase Studio
# http://localhost:54323
```

---

## Support

If issues persist after following this guide:

1. Check Supabase status page: https://status.supabase.com
2. Review Supabase docs: https://supabase.com/docs/guides/auth/auth-magic-link
3. Check application logs in browser console
4. Review Supabase auth logs in dashboard

---

## Migration Notes

**Date Applied:** January 9, 2026  
**Related Files:**

- `angular/src/app/features/auth/auth-callback/auth-callback.component.ts` (updated with logging)
- `angular/src/app/core/services/supabase.service.ts` (updated with session logging)
- `supabase/migrations/20260109_rls_block_logging.sql` (RLS monitoring)

**Next Steps:**

1. Verify redirect URLs in Supabase Dashboard (5 minutes)
2. Test magic link flow locally (5 minutes)
3. Test on preview deploy (5 minutes)
4. Document production URLs for team

---

**Status:** ✅ READY FOR VERIFICATION  
**Owner:** DevOps / Platform Team  
**Due Date:** Before next production deploy

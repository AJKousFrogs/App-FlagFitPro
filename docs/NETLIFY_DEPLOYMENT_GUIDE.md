# Netlify Staging Deployment Guide

## Overview

This guide walks through deploying the FlagFit Pro application to Netlify staging environment for final testing before production launch.

---

## Prerequisites

### 1. Netlify Account & Project

- [x] Netlify account created
- [x] Project connected to GitHub repository
- [x] Build settings configured

### 2. Environment Variables

Set these in Netlify UI: **Site Settings → Environment Variables**

#### Required Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://pvziciccwxgftcielknm.supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_KEY=[your-service-key]  # Functions only

# JWT Configuration
JWT_SECRET=[your-jwt-secret]

# Environment
NODE_ENV=production
VITE_APP_ENVIRONMENT=production
VITE_APP_NAME="FlagFit Pro"
VITE_APP_VERSION="1.1.0"
```

#### Optional Variables

```bash
# Analytics
VITE_ENABLE_ANALYTICS=false

# Sentry Error Monitoring
VITE_ENABLE_SENTRY=true
VITE_SENTRY_DSN=[your-sentry-dsn]

# Feature Flags
VITE_ENABLE_AI_COACH=true
VITE_ENABLE_OFFLINE_MODE=true
```

### 3. Build Configuration

Verify `netlify.toml` settings:

```toml
[build]
  base = "."
  command = "cd angular && npm ci --legacy-peer-deps && npm run build && cd .. && node scripts/inject-env-into-html-angular.js"
  publish = "angular/dist/flagfit-pro/browser"

[build.environment]
  NODE_VERSION = "22"
  NPM_CONFIG_PRODUCTION = "false"
```

---

## Deployment Methods

### Method 1: Automated Git Push (Recommended)

1. **Commit all changes**

```bash
git add .
git commit -m "chore: prepare for staging deployment"
```

2. **Push to staging branch**

```bash
git push origin main
```

3. **Netlify auto-deploys**
   - Watch deployment in Netlify dashboard
   - Check build logs for errors
   - Get staging URL when complete

### Method 2: Manual Netlify CLI Deploy

1. **Install Netlify CLI**

```bash
npm install -g netlify-cli
```

2. **Login to Netlify**

```bash
netlify login
```

3. **Link to site**

```bash
netlify link
```

4. **Deploy to staging**

```bash
netlify deploy --build --context=deploy-preview
```

5. **Get staging URL**

```bash
# Netlify will output a preview URL
# Example: https://deploy-preview-123--flagfit-pro.netlify.app
```

### Method 3: Manual Build + Deploy

1. **Build locally**

```bash
cd angular
npm ci --legacy-peer-deps
npm run build
cd ..
```

2. **Deploy build**

```bash
netlify deploy --prod=false --dir=angular/dist/flagfit-pro/browser
```

---

## Post-Deployment Verification

### 1. Check Build Success

- [ ] Build completed without errors
- [ ] No critical warnings
- [ ] All environment variables injected
- [ ] Service Worker generated

### 2. Test Staging URL

**Basic Connectivity**

```bash
# Check site is live
curl -I https://[staging-url]

# Should return 200 OK
```

**Health Check**

```bash
# Check API health
curl https://[staging-url]/api/health

# Should return {"status":"healthy"}
```

### 3. Verify Critical Routes

Test these routes manually:

```bash
# Landing/Login
https://[staging-url]/

# Dashboard (requires auth)
https://[staging-url]/dashboard

# Training
https://[staging-url]/training

# Analytics
https://[staging-url]/analytics

# API Endpoints
https://[staging-url]/api/dashboard
```

### 4. Test Authentication

**Test Flow:**

1. Navigate to `/login`
2. Enter test credentials
3. Verify redirect to `/dashboard`
4. Check that API calls succeed
5. Logout
6. Verify redirect to `/login`

### 5. Verify Supabase Connection

**Check in Browser Console:**

```javascript
// Test Supabase client
console.log("Supabase URL:", window.__SUPABASE_URL__);
console.log("Supabase Client:", window.supabase);

// Test auth
const { data, error } = await window.supabase.auth.getSession();
console.log("Auth session:", data, error);
```

### 6. Check Service Worker

**In Browser DevTools:**

- Open Application tab
- Check Service Workers section
- Verify `ngsw-worker.js` is registered
- Check for update errors

### 7. Test PWA Installation

**On Mobile:**

1. Open site in Safari/Chrome
2. Look for "Add to Home Screen" prompt
3. Install app
4. Open from home screen
5. Verify works as standalone app

---

## Smoke Test on Staging

Once deployed, run smoke tests on staging URL:

### Quick Smoke Test (10 trials)

```bash
export BASE_URL="https://[staging-url]"
export TEST_USER_EMAIL="[test-user-email]"
export TEST_USER_PASSWORD="[test-user-password]"

cd angular
npx playwright test e2e/quick-smoke-test.spec.ts --workers=1
```

### Full Smoke Test (100 trials)

```bash
export BASE_URL="https://[staging-url]"
export TEST_USER_EMAIL="[test-user-email]"
export TEST_USER_PASSWORD="[test-user-password]"

cd angular
npx playwright test e2e/launch-smoke-100-trials.spec.ts --workers=1
```

---

## Lighthouse Audit on Staging

Run Lighthouse audits on deployed staging site:

```bash
export STAGING_URL="https://[staging-url]"
bash scripts/run-lighthouse-audit.sh
```

**Check Results:**

- Performance ≥90
- Accessibility ≥90
- Best Practices ≥90
- SEO ≥90
- PWA checks passed

---

## Troubleshooting

### Build Fails

**Check:**

1. Node version matches (v22+)
2. Dependencies installed correctly
3. Environment variables set
4. No TypeScript errors
5. Build logs in Netlify dashboard

**Fix:**

```bash
# Clear cache and rebuild
netlify build --clear-cache
```

### Environment Variables Not Working

**Check:**

1. Variables set in Netlify UI (not just netlify.toml)
2. No typos in variable names
3. Injection script ran successfully
4. Check browser console for `window.__SUPABASE_URL__`

**Fix:**

- Re-set variables in Netlify UI
- Trigger rebuild
- Verify `inject-env-into-html-angular.js` output

### API Routes Return 404

**Check:**

1. Redirects configured in `netlify.toml`
2. Functions deployed to `netlify/functions/`
3. Function names match redirect rules

**Fix:**

- Verify `netlify.toml` redirects
- Check function logs in Netlify dashboard
- Test function directly: `https://[staging-url]/.netlify/functions/[function-name]`

### Supabase Connection Fails

**Check:**

1. CORS settings in Supabase dashboard
2. Staging URL added to allowed origins
3. Anon key is correct
4. Service key set for functions

**Fix:**

- Add staging URL to Supabase CORS settings
- Verify environment variables
- Check Supabase project status

### Service Worker Issues

**Check:**

1. `ngsw-config.json` is valid
2. Service Worker built correctly
3. HTTPS enabled (required for SW)
4. No console errors

**Fix:**

- Clear Service Worker in DevTools
- Hard refresh (Cmd+Shift+R)
- Unregister and re-register

---

## Production Promotion

After staging testing passes:

### 1. Final Checks

- [ ] All smoke tests passed (100/100)
- [ ] Lighthouse scores ≥90
- [ ] Cross-browser testing complete
- [ ] Mobile testing complete
- [ ] No critical issues
- [ ] Stakeholder approval

### 2. Deploy to Production

**Option A: Promote Staging Deploy**

```bash
netlify deploy --prod
```

**Option B: Deploy from Main Branch**

```bash
# Push to production branch
git checkout production
git merge main
git push origin production

# Netlify auto-deploys production
```

### 3. Verify Production

**Same checks as staging:**

- [ ] Site loads
- [ ] Authentication works
- [ ] API endpoints respond
- [ ] No console errors
- [ ] Service Worker active

### 4. Monitor Production

**First 15 Minutes:**

- Watch Netlify logs
- Check Sentry for errors
- Monitor user reports
- Quick smoke test

**First Hour:**

- Run full smoke test
- Check analytics
- Verify all features
- Document any issues

---

## Rollback Procedure

If critical issues found in production:

### 1. Immediate Rollback

```bash
# Via Netlify Dashboard
# 1. Go to Deploys
# 2. Find last stable deploy
# 3. Click "Publish deploy"

# Via CLI
netlify rollback
```

### 2. Notify Team

- Post in team channel
- Create incident report
- Document issue in GitHub

### 3. Fix & Redeploy

- Fix issue in development
- Test fix in staging
- Re-run all smoke tests
- Deploy to production when verified

---

## Monitoring & Logging

### Netlify Logs

```bash
# View function logs
netlify functions:log [function-name]

# View build logs
netlify logs
```

### Sentry (if enabled)

- Monitor error rates
- Check for new errors
- Review performance metrics

### Custom Monitoring

Check these endpoints:

- `/api/health` - API health
- Service Worker status
- Console errors in browser

---

## Checklist: Staging Deployment

### Pre-Deployment

- [x] Production build successful locally
- [ ] All tests passing
- [ ] Environment variables documented
- [ ] Netlify project configured
- [ ] Supabase CORS configured

### Deployment

- [ ] Code pushed to repository
- [ ] Netlify build triggered
- [ ] Build completed successfully
- [ ] Staging URL accessible

### Verification

- [ ] Site loads without errors
- [ ] Login/authentication works
- [ ] API endpoints respond
- [ ] Service Worker registered
- [ ] PWA installable
- [ ] No console errors

### Testing

- [ ] Smoke tests passed (100%)
- [ ] Lighthouse scores ≥90
- [ ] Cross-browser compatible
- [ ] Mobile responsive
- [ ] All critical flows work

### Documentation

- [ ] Issues documented
- [ ] Test results recorded
- [ ] Known issues listed
- [ ] Team notified

---

## Support & Resources

### Netlify Documentation

- [Netlify CLI](https://docs.netlify.com/cli/get-started/)
- [Build Configuration](https://docs.netlify.com/configure-builds/overview/)
- [Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Functions](https://docs.netlify.com/functions/overview/)

### Project Resources

- Repository: [GitHub URL]
- Staging URL: [To be filled]
- Production URL: [To be filled]
- Team Channel: [Slack/Discord]

---

**Last Updated:** January 9, 2026  
**Document Version:** 1.0

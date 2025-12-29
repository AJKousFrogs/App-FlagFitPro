# Deployment Rollback Runbook

**Version:** 1.0.0  
**Last Updated:** 29. December 2025  
**Stack:** Angular 21 + Netlify Functions + Supabase

---

## Table of Contents

1. [Rollback Decision Matrix](#rollback-decision-matrix)
2. [Triggers](#triggers)
3. [Pre-Rollback Checklist](#pre-rollback-checklist)
4. [Rollback Procedures](#rollback-procedures)
5. [Validation Steps](#validation-steps)
6. [Post-Rollback Tasks](#post-rollback-tasks)

---

## Rollback Decision Matrix

| Symptom | Rollback? | Alternative |
|---------|-----------|-------------|
| Site completely down | **Yes** | - |
| Login broken for all users | **Yes** | - |
| Critical data not saving | **Yes** | - |
| Performance degraded 50%+ | Maybe | Investigate first |
| Single feature broken | Maybe | Hotfix if quick |
| UI/cosmetic issues | No | Hotfix |
| Minor bugs | No | Hotfix |

### Time-Based Decision

- **< 5 min to identify cause**: Fix forward
- **5-15 min, cause unclear**: Rollback
- **> 15 min, still investigating**: Rollback immediately

---

## Triggers

### Automatic Rollback Triggers

- Health check fails 3 consecutive times
- Error rate exceeds 10% (via Sentry)
- Build deploys but health check fails

### Manual Rollback Triggers

- User reports of critical functionality broken
- Team identifies breaking change
- Security vulnerability discovered
- Database migration failed

---

## Pre-Rollback Checklist

Before rolling back, gather information:

```bash
# 1. Check current deploy status
netlify status

# 2. Get current deploy ID
netlify deploys --json | jq '.[0].id'

# 3. Check health endpoint
curl -s https://your-app.netlify.app/.netlify/functions/health | jq

# 4. Note the timestamp
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

### Document Before Rollback

- [ ] Current deploy ID: `________________`
- [ ] Time of issue first reported: `________________`
- [ ] Symptoms observed: `________________`
- [ ] Users affected (if known): `________________`

---

## Rollback Procedures

### Procedure 1: Quick Rollback (Netlify CLI)

**Use when:** Need immediate rollback to previous deploy.

```bash
# Rollback to the previous production deploy
netlify rollback

# Verify rollback
netlify status
curl -s https://your-app.netlify.app/.netlify/functions/health | jq
```

### Procedure 2: Rollback to Specific Deploy (CLI)

**Use when:** Need to rollback multiple deploys back.

```bash
# List recent deploys
netlify deploys --json | jq '.[:10] | .[] | {id, created_at, state, title}'

# Find a known-good deploy ID
# Look for one before the problematic deploy

# Rollback to specific deploy
netlify deploy --prod --dir=. --deploy-id=DEPLOY_ID

# Alternative: Publish a previous deploy
netlify deploys:publish DEPLOY_ID
```

### Procedure 3: Rollback via Netlify Dashboard

**Use when:** CLI not available or prefer visual confirmation.

1. Go to https://app.netlify.com
2. Select your site
3. Click **Deploys** in the sidebar
4. Find the last known-good deploy (green checkmark)
5. Click on the deploy
6. Click **Publish deploy** button
7. Confirm the action

### Procedure 4: Git Revert + Redeploy

**Use when:** Need to remove specific commits, not just rollback.

```bash
# 1. Identify the bad commit(s)
git log --oneline -10

# 2. Revert the commit(s)
git revert COMMIT_HASH --no-edit

# 3. Push to trigger new deploy
git push origin main

# 4. Monitor the deploy
netlify watch
```

### Procedure 5: Database Migration Rollback

**Use when:** Database migration caused the issue.

```bash
# 1. Check current migration state
supabase migration list

# 2. If migration has a down migration
supabase migration down

# 3. If no down migration, restore from backup
# See BACKUP_RESTORE.md for full procedure
psql "postgresql://..." < backups/pre_migration_YYYYMMDD.sql

# 4. Rollback the application code
netlify rollback
```

### Procedure 6: Environment Variable Rollback

**Use when:** Bad env var change caused the issue.

```bash
# 1. Check current env vars
netlify env:list

# 2. Restore from backup
# See BACKUP_RESTORE.md for env var restore

# 3. Set corrected value
netlify env:set VARIABLE_NAME "correct_value"

# 4. Trigger redeploy to pick up changes
netlify deploy --prod
```

---

## Validation Steps

### Step 1: Verify Rollback Completed

```bash
# Check deploy status
netlify status

# Verify the deploy ID changed
netlify deploys --json | jq '.[0] | {id, created_at, state}'
```

### Step 2: Health Check

```bash
# Full health check
curl -s https://your-app.netlify.app/.netlify/functions/health | jq

# Expected response:
# {
#   "status": "healthy",
#   "checks": {
#     "database": { "status": "healthy" },
#     "auth": { "status": "healthy" }
#   }
# }
```

### Step 3: Core Functionality Tests

```bash
# Test 1: Frontend loads
curl -s -o /dev/null -w "%{http_code}" https://your-app.netlify.app
# Expected: 200

# Test 2: API responds
curl -s https://your-app.netlify.app/.netlify/functions/health | jq '.status'
# Expected: "healthy"

# Test 3: Authentication works
curl -X POST https://your-app.netlify.app/.netlify/functions/auth-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword"}' | jq '.success'
# Expected: true

# Test 4: Data retrieval works
curl https://your-app.netlify.app/.netlify/functions/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.success'
# Expected: true
```

### Step 4: Browser Verification

1. Open https://your-app.netlify.app in incognito browser
2. Verify: Page loads without errors
3. Verify: Login works
4. Verify: Dashboard displays data
5. Check: Browser console for errors (F12 → Console)

### Step 5: Monitor for 15 Minutes

```bash
# Watch health endpoint
watch -n 30 'curl -s https://your-app.netlify.app/.netlify/functions/health | jq .status'

# Check Sentry for new errors
# (via Sentry dashboard)
```

---

## Post-Rollback Tasks

### Immediate (Within 1 hour)

- [ ] Notify team of rollback completion
- [ ] Update incident channel with status
- [ ] Confirm user-reported issues are resolved
- [ ] Document rollback in incident log

### Short-term (Within 24 hours)

- [ ] Investigate root cause of failure
- [ ] Create ticket for proper fix
- [ ] Update deployment checklist if process gap found
- [ ] Write incident postmortem (if SEV-1/2)

### Before Re-deploying Fix

- [ ] Root cause identified and documented
- [ ] Fix tested in staging/preview
- [ ] Rollback plan confirmed for new deploy
- [ ] Team notified of re-deployment

---

## Rollback Scenarios

### Scenario A: Frontend Build Broken

**Symptoms:** Site returns 404 or blank page

```bash
# 1. Check if it's a build issue
netlify deploys --json | jq '.[0].state'

# 2. Rollback to previous working deploy
netlify rollback

# 3. Investigate build logs
netlify logs:build
```

### Scenario B: API Functions Broken

**Symptoms:** API calls return 500 errors

```bash
# 1. Check function logs
netlify logs:function health --last 50

# 2. Check if specific function or all functions
curl https://your-app.netlify.app/.netlify/functions/health
curl https://your-app.netlify.app/.netlify/functions/dashboard

# 3. Rollback if all functions affected
netlify rollback
```

### Scenario C: Database Connection Lost

**Symptoms:** Health check shows database unhealthy

```bash
# 1. Check Supabase status
curl -s https://your-project.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"

# 2. If Supabase is up, check env vars
netlify env:get SUPABASE_URL
netlify env:get SUPABASE_SERVICE_KEY

# 3. If env vars wrong, restore from backup
# See BACKUP_RESTORE.md
```

### Scenario D: Authentication Broken

**Symptoms:** Users cannot log in

```bash
# 1. Check auth health
curl -s https://your-app.netlify.app/.netlify/functions/health | jq '.checks.auth'

# 2. Check Supabase Auth status
curl https://your-project.supabase.co/auth/v1/health

# 3. If app code issue, rollback
netlify rollback

# 4. If Supabase issue, check their status page
# https://status.supabase.com
```

---

## Quick Reference

### Rollback Commands

```bash
# Quick rollback (to previous)
netlify rollback

# Rollback to specific deploy
netlify deploys:publish DEPLOY_ID

# List recent deploys
netlify deploys --json | jq '.[:5]'

# Git revert
git revert COMMIT_HASH && git push origin main
```

### Verification Commands

```bash
# Health check
curl -s https://your-app.netlify.app/.netlify/functions/health | jq

# HTTP status
curl -s -o /dev/null -w "%{http_code}" https://your-app.netlify.app

# Current deploy
netlify status
```

### Key URLs

| Resource | URL |
|----------|-----|
| Netlify Dashboard | https://app.netlify.com |
| Supabase Dashboard | https://supabase.com/dashboard |
| Supabase Status | https://status.supabase.com |
| Sentry | https://sentry.io |

---

## Rollback Checklist Template

```markdown
## Rollback Record

**Date:** YYYY-MM-DD HH:MM UTC
**Performed by:** [Name]
**Reason:** [Brief description]

### Pre-Rollback
- [ ] Issue confirmed
- [ ] Current deploy ID noted: ___________
- [ ] Team notified

### Rollback
- [ ] Rollback command executed
- [ ] New deploy ID: ___________
- [ ] Health check passed

### Validation
- [ ] Frontend loads
- [ ] API responds
- [ ] Authentication works
- [ ] Core features functional

### Post-Rollback
- [ ] Incident channel updated
- [ ] Root cause investigation started
- [ ] Postmortem scheduled (if SEV-1/2)
```

---

**Document Version:** 1.0.0  
**Next Review:** March 2026


# Incident Response Runbook

**Version:** 1.0.0  
**Last Updated:** 29. December 2025  
**Stack:** Angular 21 + Netlify Functions + Supabase

---

## Table of Contents

1. [Incident Severity Levels](#incident-severity-levels)
2. [Triggers](#triggers)
3. [Initial Response](#initial-response)
4. [Investigation Steps](#investigation-steps)
5. [Mitigation Actions](#mitigation-actions)
6. [Validation Steps](#validation-steps)
7. [Post-Incident Tasks](#post-incident-tasks)

---

## Incident Severity Levels

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| **SEV-1** | Complete service outage | < 15 min | Site down, database unreachable |
| **SEV-2** | Major feature broken | < 1 hour | Login broken, data not saving |
| **SEV-3** | Minor feature degraded | < 4 hours | Slow performance, UI glitches |
| **SEV-4** | Cosmetic/low impact | Next business day | Typos, minor styling issues |

---

## Triggers

### Automated Alerts

- **Health check fails** → `/api/health` returns non-200 or `status: "degraded"`
- **Error rate spike** → Sentry alerts on error threshold exceeded
- **Netlify deploy fails** → Build or function deployment error
- **Supabase alerts** → Database connection issues, RLS violations

### Manual Reports

- User reports via support channels
- Team member discovers issue
- Third-party monitoring (Pingdom, UptimeRobot)

---

## Initial Response

### Step 1: Acknowledge (< 5 min)

```bash
# 1. Check health endpoint immediately
curl -s https://your-app.netlify.app/.netlify/functions/health | jq

# Expected healthy response:
# {
#   "status": "healthy",
#   "checks": { "database": { "status": "healthy" }, "auth": { "status": "healthy" } }
# }
```

### Step 2: Assess Severity

| Check | SEV-1 | SEV-2 | SEV-3 |
|-------|-------|-------|-------|
| Health endpoint returns 5xx | ✓ | | |
| Health endpoint returns `degraded` | | ✓ | |
| Users cannot log in | ✓ | | |
| Data not saving | | ✓ | |
| Slow page loads (> 5s) | | | ✓ |
| Partial feature broken | | ✓ | |

### Step 3: Notify Stakeholders

**SEV-1/SEV-2:**
1. Post in #incidents channel
2. Page on-call engineer (if applicable)
3. Update status page (if applicable)

**Template:**
```
🚨 INCIDENT: [Brief description]
Severity: SEV-[1/2/3]
Impact: [Who is affected, what is broken]
Status: Investigating
Lead: [Your name]
```

---

## Investigation Steps

### Step 1: Check Netlify Logs

```bash
# View recent function logs
netlify logs:function health --last 100

# View all function logs
netlify logs --last 50
```

**Or via Netlify Dashboard:**
1. Go to https://app.netlify.com
2. Select site → Functions → Select function → View logs

### Step 2: Check Supabase Status

```bash
# Test database connectivity
curl -s https://your-project.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Or via Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Select project → Database → Check connection status
3. Check Logs → Postgres for errors

### Step 3: Check Error Tracking (Sentry)

1. Go to Sentry dashboard
2. Filter by time range of incident
3. Look for:
   - New error types
   - Error rate spikes
   - Affected users/sessions

### Step 4: Check Recent Deployments

```bash
# View recent Netlify deploys
netlify deploys --json | jq '.[0:5]'
```

**Questions to answer:**
- Was there a deploy in the last 30 minutes?
- Did the deploy succeed?
- What changes were included?

### Step 5: Reproduce the Issue

```bash
# Test login flow
curl -X POST https://your-app.netlify.app/.netlify/functions/auth-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword"}'

# Test authenticated endpoint
curl https://your-app.netlify.app/.netlify/functions/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Mitigation Actions

### Option A: Rollback Deployment

If caused by recent deploy, see [DEPLOYMENT_ROLLBACK.md](./DEPLOYMENT_ROLLBACK.md).

```bash
# Quick rollback via Netlify CLI
netlify rollback
```

### Option B: Disable Problematic Feature

If isolated to one feature:

1. Deploy feature flag change
2. Or deploy hotfix removing feature

### Option C: Scale/Restart Services

**Netlify Functions:**
- Functions are stateless; no restart needed
- If persistent, redeploy: `netlify deploy --prod`

**Supabase:**
1. Dashboard → Settings → General → Restart project
2. Or contact Supabase support for database issues

### Option D: Database Fix

If data corruption or RLS issue:

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'affected_table';

-- Temporarily disable RLS (DANGER - use only if necessary)
-- ALTER TABLE affected_table DISABLE ROW LEVEL SECURITY;

-- Fix data
-- UPDATE affected_table SET ... WHERE ...;

-- Re-enable RLS
-- ALTER TABLE affected_table ENABLE ROW LEVEL SECURITY;
```

---

## Validation Steps

### Step 1: Verify Health Endpoint

```bash
# Should return 200 with status: "healthy"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  https://your-app.netlify.app/.netlify/functions/health | jq
```

### Step 2: Verify Core Flows

```bash
# 1. Health check
curl -s https://your-app.netlify.app/.netlify/functions/health | jq '.status'
# Expected: "healthy"

# 2. Authentication
curl -X POST https://your-app.netlify.app/.netlify/functions/auth-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword"}' | jq '.success'
# Expected: true

# 3. Dashboard data (with valid token)
curl https://your-app.netlify.app/.netlify/functions/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.success'
# Expected: true
```

### Step 3: Verify Frontend

1. Open https://your-app.netlify.app in incognito
2. Check: Login works
3. Check: Dashboard loads
4. Check: No console errors

### Step 4: Monitor for 15 Minutes

- Watch health endpoint every minute
- Check Sentry for new errors
- Confirm user reports have stopped

---

## Post-Incident Tasks

### Immediate (Within 24 hours)

- [ ] Update incident channel with resolution
- [ ] Update status page (if applicable)
- [ ] Document timeline in incident log

### Short-term (Within 3 days)

- [ ] Write incident postmortem
- [ ] Create tickets for follow-up fixes
- [ ] Update runbooks if process gaps found

### Postmortem Template

```markdown
# Incident Postmortem: [Title]

**Date:** YYYY-MM-DD
**Duration:** X hours Y minutes
**Severity:** SEV-X
**Lead:** [Name]

## Summary
[1-2 sentence summary of what happened]

## Timeline
- HH:MM - [Event]
- HH:MM - [Event]

## Root Cause
[What caused the incident]

## Impact
- Users affected: [Number/percentage]
- Features affected: [List]
- Data affected: [If any]

## Resolution
[What fixed it]

## Action Items
- [ ] [Task] - Owner - Due date
- [ ] [Task] - Owner - Due date

## Lessons Learned
- What went well
- What could be improved
```

---

## Quick Reference

### Health Check Endpoints

| Endpoint | Purpose | Auth Required |
|----------|---------|---------------|
| `/.netlify/functions/health` | Overall system health | No |
| `/.netlify/functions/dashboard?action=health` | Dashboard service | No |
| `/.netlify/functions/coach?action=health` | Coach API | No |

### Key Contacts

| Role | Contact |
|------|---------|
| On-call Engineer | [Contact method] |
| Netlify Support | https://answers.netlify.com |
| Supabase Support | https://supabase.com/support |

### Useful Commands

```bash
# Check site status
curl -s -o /dev/null -w "%{http_code}" https://your-app.netlify.app

# View function logs
netlify logs:function FUNCTION_NAME

# Quick rollback
netlify rollback

# Force redeploy
netlify deploy --prod
```

---

**Document Version:** 1.0.0  
**Next Review:** March 2026


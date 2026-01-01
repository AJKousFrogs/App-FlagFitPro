# Account Deletion Runbook

**Version:** 1.0.0  
**Last Updated:** 29. December 2025  
**Stack:** Angular 21 + Netlify Functions + Supabase Edge Functions

---

## Table of Contents

1. [Overview](#overview)
2. [Symptoms & Alerts](#symptoms--alerts)
3. [Diagnosis Steps](#diagnosis-steps)
4. [Remediation Steps](#remediation-steps)
5. [Validation Steps](#validation-steps)
6. [Post-Incident Actions](#post-incident-actions)
7. [User Communication Templates](#user-communication-templates)

---

## Overview

### Deletion Pipeline

```
User Request → Soft Delete (immediate) → 30-day Queue → Hard Delete → Auth Cleanup
                    ↓                         ↓              ↓
              Access Revoked           Cancellable    PII Removed
              Sessions Ended           Period         Audit Logged
```

### Components

| Component                     | Purpose                            | Location              |
| ----------------------------- | ---------------------------------- | --------------------- |
| `account-deletion.cjs`        | API endpoint for user requests     | `netlify/functions/`  |
| `process-deletions`           | Edge function for queue processing | `supabase/functions/` |
| `initiate_account_deletion()` | DB function for soft delete        | Database              |
| `process_hard_deletion()`     | DB function for PII removal        | Database              |
| `account_deletion_requests`   | Queue table                        | Database              |
| `privacy_audit_log`           | Audit trail                        | Database              |

---

## Symptoms & Alerts

### Alert: Deletion Queue Backlog Growing

**Trigger:** `account_deletion_requests` with `status='pending'` and `scheduled_hard_delete_at < NOW()` exceeds threshold.

```sql
-- Check backlog size
SELECT COUNT(*) as backlog_count
FROM account_deletion_requests
WHERE status = 'pending'
AND scheduled_hard_delete_at <= NOW();
```

**Thresholds:**

- ⚠️ Warning: > 10 overdue deletions
- 🚨 Critical: > 50 overdue deletions

### Alert: Deletion Processing Failures

**Trigger:** `status='failed'` records appearing in queue.

```sql
-- Check for failures
SELECT id, user_id, error_message, updated_at
FROM account_deletion_requests
WHERE status = 'failed'
ORDER BY updated_at DESC
LIMIT 20;
```

### Alert: Edge Function Failures

**Trigger:** `process-deletions` function returning errors or timing out.

Check Supabase Edge Function logs:

```bash
# Via Supabase CLI
supabase functions logs process-deletions --project-ref YOUR_PROJECT_REF
```

---

## Diagnosis Steps

### Step 1: Check Queue Status

```sql
-- Overall queue health
SELECT
    status,
    COUNT(*) as count,
    MIN(scheduled_hard_delete_at) as oldest_scheduled,
    MAX(scheduled_hard_delete_at) as newest_scheduled
FROM account_deletion_requests
GROUP BY status
ORDER BY status;
```

### Step 2: Check Recent Processing

```sql
-- Last 24 hours of activity
SELECT
    action,
    COUNT(*) as count,
    MAX(created_at) as last_occurrence
FROM privacy_audit_log
WHERE action IN ('deletion_requested', 'deletion_completed', 'deletion_failed', 'deletion_cancelled')
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY action;
```

### Step 3: Check Edge Function Status

```bash
# Check if function is deployed
supabase functions list --project-ref YOUR_PROJECT_REF

# Check recent invocations
supabase functions logs process-deletions --project-ref YOUR_PROJECT_REF --limit 50
```

### Step 4: Check for Specific User Issues

```sql
-- Check specific deletion request
SELECT
    adr.*,
    (SELECT COUNT(*) FROM privacy_audit_log WHERE user_id = adr.user_id) as audit_entries
FROM account_deletion_requests adr
WHERE adr.id = 'REQUEST_UUID_HERE';
```

### Step 5: Verify Database Functions Exist

```sql
-- Check required functions
SELECT proname
FROM pg_proc
WHERE proname IN (
    'initiate_account_deletion',
    'cancel_account_deletion',
    'process_hard_deletion',
    'get_deletions_ready_for_processing'
);
```

---

## Remediation Steps

### Scenario A: Edge Function Not Running

**Cause:** Cron job not triggering or function not deployed.

**Fix:**

1. Verify function is deployed:

   ```bash
   supabase functions deploy process-deletions --project-ref YOUR_PROJECT_REF
   ```

2. Manually trigger processing:

   ```bash
   curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/process-deletions \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json"
   ```

3. Set up cron trigger (via Supabase Dashboard → Database → Extensions → pg_cron):
   ```sql
   SELECT cron.schedule(
     'process-deletions-daily',
     '0 3 * * *',  -- 3 AM daily
     $$
     SELECT net.http_post(
       url := 'https://YOUR_PROJECT.supabase.co/functions/v1/process-deletions',
       headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
     )
     $$
   );
   ```

### Scenario B: Individual Deletion Failed

**Cause:** Data integrity issue or cascade failure.

**Fix:**

1. Check error message:

   ```sql
   SELECT id, user_id, error_message, updated_at
   FROM account_deletion_requests
   WHERE status = 'failed'
   AND id = 'REQUEST_UUID';
   ```

2. Reset to pending for retry:

   ```sql
   UPDATE account_deletion_requests
   SET status = 'pending', error_message = NULL, updated_at = NOW()
   WHERE id = 'REQUEST_UUID';
   ```

3. If persistent failure, manually process:
   ```sql
   -- Run the deletion function directly
   SELECT process_hard_deletion('REQUEST_UUID');
   ```

### Scenario C: User Wants to Cancel After Processing Started

**Cause:** User changed mind but deletion is in progress.

**Check if cancellable:**

```sql
SELECT id, status, can_cancel
FROM get_deletion_status('USER_UUID');
```

**If `status = 'processing'`:**

- Deletion may already be partially complete
- Check what data remains
- Contact user about data recovery options

### Scenario D: Auth User Not Deleted

**Cause:** `process_hard_deletion()` succeeded but auth.users deletion failed.

**Fix:**

```javascript
// Via Supabase Admin API
const { error } = await supabase.auth.admin.deleteUser("USER_UUID");
if (error) console.error("Auth deletion failed:", error);
```

---

## Validation Steps

### After Processing Deletions

1. **Verify queue is clear:**

   ```sql
   SELECT COUNT(*) FROM account_deletion_requests
   WHERE status = 'pending' AND scheduled_hard_delete_at <= NOW();
   -- Should be 0
   ```

2. **Verify audit logs exist:**

   ```sql
   SELECT * FROM privacy_audit_log
   WHERE action = 'deletion_completed'
   AND created_at > NOW() - INTERVAL '1 hour';
   ```

3. **Verify PII is removed (without exposing PII):**

   ```sql
   -- Count remaining records for deleted users (should be 0)
   SELECT 'users' as table_name, COUNT(*) as remaining
   FROM users WHERE id IN (
       SELECT user_id FROM account_deletion_requests WHERE status = 'completed'
   )
   UNION ALL
   SELECT 'privacy_settings', COUNT(*)
   FROM privacy_settings WHERE user_id IN (
       SELECT user_id FROM account_deletion_requests WHERE status = 'completed'
   );
   ```

4. **Verify emergency records preserved:**
   ```sql
   -- Emergency records should exist with user_id = NULL but email_hash set
   SELECT COUNT(*) as preserved_emergency_records
   FROM emergency_medical_records
   WHERE user_id IS NULL
   AND user_email_hash IS NOT NULL;
   ```

### After Manual Intervention

1. Run the verification script:

   ```bash
   npm run verify:db
   ```

2. Check for any orphaned data:
   ```sql
   -- Find orphaned records (data without matching user)
   SELECT 'workout_logs' as table_name, COUNT(*) as orphaned
   FROM workout_logs wl
   WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = wl.player_id)
   AND wl.player_id NOT IN (
       SELECT user_id FROM account_deletion_requests WHERE status IN ('pending', 'processing')
   );
   ```

---

## Post-Incident Actions

### Immediate (Within 1 hour)

- [ ] Document what happened and when
- [ ] Verify all affected deletions are now complete
- [ ] Check for any user complaints

### Short-term (Within 24 hours)

- [ ] Update monitoring thresholds if needed
- [ ] Create ticket for root cause fix
- [ ] Notify affected users if deletion was delayed

### Long-term (Within 1 week)

- [ ] Implement fix for root cause
- [ ] Add additional monitoring
- [ ] Update this runbook with lessons learned

---

## User Communication Templates

### Deletion Request Confirmed

```
Subject: Your Account Deletion Request

Hi [Name],

We've received your request to delete your FlagFit Pro account.

What happens next:
• Your account has been deactivated immediately
• You have 30 days to cancel this request by logging back in
• After 30 days, all your personal data will be permanently deleted

If you change your mind, simply log in within the next 30 days.

Questions? Reply to this email.

The FlagFit Pro Team
```

### Deletion Complete

```
Subject: Your Account Has Been Deleted

Hi,

Your FlagFit Pro account and associated data have been permanently deleted as requested.

What was deleted:
• Account information
• Training history
• Performance data
• Chat history
• Team memberships

What was retained (legal requirement):
• Emergency medical records (retained for 7 years per legal requirements)

Thank you for using FlagFit Pro. If you ever want to return, you're welcome to create a new account.

The FlagFit Pro Team
```

### Deletion Delayed

```
Subject: Update on Your Account Deletion Request

Hi [Name],

We're writing to let you know that your account deletion request (submitted on [DATE]) has been delayed due to a technical issue on our end.

We're working to resolve this and expect your data to be deleted by [NEW_DATE].

You still have the option to cancel this request by logging in.

We apologize for any inconvenience.

The FlagFit Pro Team
```

---

## Quick Reference

### Key SQL Commands

```sql
-- Check queue health
SELECT status, COUNT(*) FROM account_deletion_requests GROUP BY status;

-- Get ready-for-processing deletions
SELECT * FROM get_deletions_ready_for_processing();

-- Check specific user status
SELECT * FROM get_deletion_status('USER_UUID');

-- Manual retry
UPDATE account_deletion_requests SET status = 'pending' WHERE id = 'REQUEST_UUID';

-- Manual process
SELECT process_hard_deletion('REQUEST_UUID');
```

### Key API Endpoints

| Endpoint                | Method | Purpose               |
| ----------------------- | ------ | --------------------- |
| `/api/account-deletion` | GET    | Check deletion status |
| `/api/account-deletion` | POST   | Request deletion      |
| `/api/account-deletion` | DELETE | Cancel deletion       |

### Contacts

| Role             | Contact   |
| ---------------- | --------- |
| Database Admin   | [Contact] |
| Privacy Officer  | [Contact] |
| On-call Engineer | [Contact] |

---

**Document Version:** 1.0.0  
**Next Review:** March 2026

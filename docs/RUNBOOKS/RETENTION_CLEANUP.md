# Retention Cleanup Runbook

**Version:** 1.0.0  
**Last Updated:** 29. December 2025  
**Stack:** Angular 21 + Netlify Functions + Supabase Edge Functions

---

## Table of Contents

1. [Overview](#overview)
2. [Retention Policies](#retention-policies)
3. [Symptoms & Alerts](#symptoms--alerts)
4. [Diagnosis Steps](#diagnosis-steps)
5. [Remediation Steps](#remediation-steps)
6. [Validation Steps](#validation-steps)
7. [Post-Incident Actions](#post-incident-actions)

---

## Overview

### Retention Requirements

| Data Type | Retention Period | Legal Basis | Cleanup Method |
|-----------|------------------|-------------|----------------|
| Emergency Medical Records | 7 years | Medical records law | `cleanup_expired_emergency_records()` |
| Account Deletion Requests | 30 days (pending) | GDPR Article 17 | `process-deletions` Edge Function |
| Audit Logs | 7 years | GDPR Article 30 | Manual/Scheduled |
| Training Data | User-controlled | User consent | On deletion request |
| AI Chat History | 90 days | Privacy policy | Scheduled cleanup |

### Cleanup Pipeline

```
Daily Cron (3 AM UTC)
       ↓
process-deletions Edge Function
       ↓
├── get_deletions_ready_for_processing()
│   └── Process each deletion
│
└── cleanup_expired_emergency_records()
    └── Delete records past 7-year retention
       ↓
privacy_audit_log (record cleanup)
```

---

## Retention Policies

### Emergency Medical Records (7 Years)

**Why 7 years?**
- Medical records retention requirements
- Statute of limitations for medical malpractice
- Insurance claim periods

**What's retained:**
- Event type and date
- Medical data (anonymized after user deletion)
- Location data (if emergency occurred during activity)

**What's NOT retained:**
- User ID (set to NULL after user deletion)
- Direct PII (replaced with email hash)

### Account Deletion Queue (30 Days)

**Why 30 days?**
- GDPR allows reasonable processing time
- Gives users time to change their mind
- Allows for data export requests

### Audit Logs (7 Years)

**Why 7 years?**
- GDPR Article 30 compliance
- Legal hold requirements
- Security incident investigation

---

## Symptoms & Alerts

### Alert: Emergency Records Not Being Cleaned

**Trigger:** Records exist with `retention_expires_at < NOW()`.

```sql
-- Check for expired records
SELECT COUNT(*) as expired_count
FROM emergency_medical_records
WHERE retention_expires_at <= NOW();
```

**Thresholds:**
- ⚠️ Warning: > 0 expired records for > 24 hours
- 🚨 Critical: > 100 expired records

### Alert: Cleanup Function Failing

**Trigger:** `cleanup_expired_emergency_records()` returns error or 0 when records exist.

```sql
-- Check cleanup function
SELECT cleanup_expired_emergency_records();

-- Verify against actual expired records
SELECT COUNT(*) FROM emergency_medical_records WHERE retention_expires_at <= NOW();
```

### Alert: Retention Dates Missing

**Trigger:** Records without `retention_expires_at` set.

```sql
-- Find records without retention date
SELECT COUNT(*) as missing_retention
FROM emergency_medical_records
WHERE retention_expires_at IS NULL;
```

---

## Diagnosis Steps

### Step 1: Check Retention Status Overview

```sql
-- Overview of emergency records by retention status
SELECT 
    CASE 
        WHEN retention_expires_at IS NULL THEN 'No retention set'
        WHEN retention_expires_at <= NOW() THEN 'Expired'
        WHEN retention_expires_at <= NOW() + INTERVAL '1 year' THEN 'Expiring within 1 year'
        ELSE 'Active retention'
    END as status,
    COUNT(*) as record_count,
    MIN(retention_expires_at) as earliest_expiration,
    MAX(retention_expires_at) as latest_expiration
FROM emergency_medical_records
GROUP BY 1
ORDER BY 1;
```

### Step 2: Check Recent Cleanup Activity

```sql
-- Recent cleanup audit logs
SELECT *
FROM privacy_audit_log
WHERE action = 'retention_cleanup'
ORDER BY created_at DESC
LIMIT 10;
```

### Step 3: Check Cleanup Function Health

```sql
-- Verify function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'cleanup_expired_emergency_records';

-- Test run (dry run - just check what would be deleted)
SELECT id, event_type, retention_expires_at
FROM emergency_medical_records
WHERE retention_expires_at <= NOW();
```

### Step 4: Check Edge Function Logs

```bash
# Check process-deletions function logs
supabase functions logs process-deletions --project-ref YOUR_PROJECT_REF --limit 100

# Look for cleanup-related entries
supabase functions logs process-deletions --project-ref YOUR_PROJECT_REF | grep -i "emergency\|cleanup\|retention"
```

### Step 5: Verify Cron Job

```sql
-- Check if pg_cron job exists
SELECT * FROM cron.job WHERE jobname LIKE '%deletion%' OR jobname LIKE '%cleanup%';

-- Check recent cron executions
SELECT * FROM cron.job_run_details 
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname LIKE '%deletion%')
ORDER BY start_time DESC
LIMIT 20;
```

---

## Remediation Steps

### Scenario A: Cleanup Function Not Running

**Cause:** Cron job not set up or Edge Function not invoking cleanup.

**Fix:**

1. **Verify Edge Function includes cleanup:**
   
   Check `supabase/functions/process-deletions/index.ts`:
   ```typescript
   // Should include:
   const { data: cleanedCount } = await supabase.rpc("cleanup_expired_emergency_records");
   ```

2. **Manual cleanup run:**
   ```sql
   SELECT cleanup_expired_emergency_records();
   ```

3. **Set up dedicated cron job (if not using Edge Function):**
   ```sql
   SELECT cron.schedule(
     'cleanup-expired-records',
     '0 4 * * *',  -- 4 AM daily
     $$SELECT cleanup_expired_emergency_records()$$
   );
   ```

### Scenario B: Records Missing Retention Date

**Cause:** Records created before retention logic was added.

**Fix:**

```sql
-- Set 7-year retention for records missing it
UPDATE emergency_medical_records
SET retention_expires_at = created_at + INTERVAL '7 years'
WHERE retention_expires_at IS NULL;
```

### Scenario C: Cleanup Deleting Wrong Records

**Cause:** Incorrect retention date calculation.

**Diagnosis:**
```sql
-- Check what would be deleted
SELECT id, user_id, event_type, event_date, retention_expires_at,
       NOW() as current_time,
       retention_expires_at - NOW() as time_until_expiration
FROM emergency_medical_records
WHERE retention_expires_at <= NOW()
ORDER BY retention_expires_at;
```

**Fix (if dates are wrong):**
```sql
-- Recalculate retention dates based on event_date
UPDATE emergency_medical_records
SET retention_expires_at = event_date + INTERVAL '7 years'
WHERE retention_expires_at < event_date + INTERVAL '7 years';
```

### Scenario D: Cleanup Function Errors

**Cause:** Permission issues or constraint violations.

**Check permissions:**
```sql
-- Verify function can delete
SELECT has_table_privilege('authenticated', 'emergency_medical_records', 'DELETE');

-- Check for foreign key constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'emergency_medical_records';
```

---

## Validation Steps

### After Cleanup Run

1. **Verify no expired records remain:**
   ```sql
   SELECT COUNT(*) FROM emergency_medical_records
   WHERE retention_expires_at <= NOW();
   -- Should be 0
   ```

2. **Verify audit log entry:**
   ```sql
   SELECT * FROM privacy_audit_log
   WHERE action = 'retention_cleanup'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

3. **Verify correct records were deleted (count check):**
   ```sql
   -- Compare with pre-cleanup count
   SELECT COUNT(*) as total_records FROM emergency_medical_records;
   ```

### After Manual Intervention

1. **Run verification script:**
   ```bash
   npm run verify:db
   ```

2. **Check retention date distribution:**
   ```sql
   SELECT 
       DATE_TRUNC('year', retention_expires_at) as expiration_year,
       COUNT(*) as record_count
   FROM emergency_medical_records
   GROUP BY 1
   ORDER BY 1;
   ```

---

## Post-Incident Actions

### Immediate (Within 1 hour)

- [ ] Document what records were affected
- [ ] Verify no valid records were deleted
- [ ] Check for any compliance implications

### Short-term (Within 24 hours)

- [ ] Review cleanup function logic
- [ ] Add additional logging if needed
- [ ] Update monitoring alerts

### Long-term (Within 1 week)

- [ ] Implement fix for root cause
- [ ] Add retention date validation on insert
- [ ] Update this runbook

---

## Compliance Verification

### GDPR Article 17 Compliance Check

```sql
-- Verify deletion requests are processed within 30 days
SELECT 
    id,
    requested_at,
    scheduled_hard_delete_at,
    status,
    CASE 
        WHEN status = 'completed' AND hard_deleted_at <= scheduled_hard_delete_at THEN 'Compliant'
        WHEN status = 'pending' AND scheduled_hard_delete_at > NOW() THEN 'In Progress'
        WHEN status = 'pending' AND scheduled_hard_delete_at <= NOW() THEN 'OVERDUE'
        ELSE status
    END as compliance_status
FROM account_deletion_requests
WHERE requested_at > NOW() - INTERVAL '60 days';
```

### Medical Records Retention Compliance

```sql
-- Verify all emergency records have valid retention
SELECT 
    CASE 
        WHEN retention_expires_at IS NULL THEN 'Missing retention date'
        WHEN retention_expires_at < event_date + INTERVAL '7 years' THEN 'Retention too short'
        WHEN retention_expires_at > event_date + INTERVAL '7 years' + INTERVAL '1 day' THEN 'Retention too long'
        ELSE 'Compliant'
    END as compliance_status,
    COUNT(*) as record_count
FROM emergency_medical_records
GROUP BY 1;
```

---

## Quick Reference

### Key SQL Commands

```sql
-- Manual cleanup
SELECT cleanup_expired_emergency_records();

-- Check expired records
SELECT COUNT(*) FROM emergency_medical_records WHERE retention_expires_at <= NOW();

-- Fix missing retention dates
UPDATE emergency_medical_records 
SET retention_expires_at = event_date + INTERVAL '7 years' 
WHERE retention_expires_at IS NULL;

-- Check cleanup history
SELECT * FROM privacy_audit_log WHERE action = 'retention_cleanup' ORDER BY created_at DESC;
```

### Key Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `cleanup_expired_emergency_records()` | Delete records past retention | Count of deleted |
| `create_emergency_medical_record()` | Create with 7-year retention | Record UUID |

### Retention Periods Summary

| Data | Period | Auto-cleanup |
|------|--------|--------------|
| Emergency Medical | 7 years | Yes |
| Deletion Requests | 30 days | Yes |
| Audit Logs | 7 years | Manual |
| Training Data | User-controlled | On deletion |

---

**Document Version:** 1.0.0  
**Next Review:** March 2026


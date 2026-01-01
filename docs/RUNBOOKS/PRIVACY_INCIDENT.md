# Privacy Incident Runbook

**Version:** 1.0.0  
**Last Updated:** 29. December 2025  
**Stack:** Angular 21 + Netlify Functions + Supabase

---

## Table of Contents

1. [Incident Classification](#incident-classification)
2. [Symptoms & Alerts](#symptoms--alerts)
3. [Initial Response](#initial-response)
4. [Investigation Steps](#investigation-steps)
5. [Remediation Steps](#remediation-steps)
6. [Validation Steps](#validation-steps)
7. [Post-Incident Actions](#post-incident-actions)
8. [Regulatory Notification](#regulatory-notification)

---

## Incident Classification

### Privacy Incident Types

| Type                        | Severity | Examples                          | Response Time     |
| --------------------------- | -------- | --------------------------------- | ----------------- |
| **Data Breach**             | SEV-1    | Unauthorized access to PII        | < 15 min          |
| **Consent Violation**       | SEV-2    | Data accessed without consent     | < 1 hour          |
| **Retention Violation**     | SEV-2    | Data not deleted when required    | < 1 hour          |
| **AI Processing Violation** | SEV-3    | AI used on opted-out user         | < 4 hours         |
| **Minor Data Exposure**     | SEV-3    | Under-16 data accessed improperly | < 4 hours         |
| **Audit Trail Gap**         | SEV-4    | Missing audit log entries         | Next business day |

### GDPR Breach Classification

| Category        | Description                             | Notification Required                |
| --------------- | --------------------------------------- | ------------------------------------ |
| **High Risk**   | Likely to result in harm to individuals | DPA within 72 hours + affected users |
| **Medium Risk** | Possible impact on individuals          | DPA within 72 hours                  |
| **Low Risk**    | Unlikely to impact individuals          | Internal documentation only          |

---

## Symptoms & Alerts

### Alert: Consent Blocked Events Spiking

**Trigger:** High rate of `consent_blocked=true` responses.

```sql
-- Check consent blocked events (last 24 hours)
SELECT
    DATE_TRUNC('hour', accessed_at) as hour,
    COUNT(*) as blocked_count
FROM consent_access_log
WHERE access_granted = false
AND accessed_at > NOW() - INTERVAL '24 hours'
GROUP BY 1
ORDER BY 1;
```

**Thresholds:**

- ⚠️ Warning: > 100 blocked events/hour
- 🚨 Critical: > 500 blocked events/hour OR sudden 10x spike

### Alert: AI Opt-Out Violations

**Trigger:** AI processing attempted on opted-out users.

```sql
-- Check for AI violations (should be 0)
SELECT COUNT(*) as violations
FROM ai_chat_sessions acs
JOIN privacy_settings ps ON acs.user_id = ps.user_id
WHERE ps.ai_processing_enabled = false
AND acs.created_at > NOW() - INTERVAL '24 hours';
```

### Alert: Unauthorized Data Access

**Trigger:** Access patterns indicating unauthorized access.

```sql
-- Check for unusual access patterns
SELECT
    accessor_user_id,
    COUNT(DISTINCT target_user_id) as users_accessed,
    COUNT(*) as total_accesses
FROM consent_access_log
WHERE accessed_at > NOW() - INTERVAL '1 hour'
GROUP BY accessor_user_id
HAVING COUNT(DISTINCT target_user_id) > 50;
```

### Alert: RLS Bypass Detected

**Trigger:** Direct database access bypassing RLS.

Check Supabase logs for service role key usage outside expected functions.

---

## Initial Response

### Step 1: Acknowledge & Assess (< 5 min)

```bash
# Check current system health
curl -s https://your-app.netlify.app/.netlify/functions/health | jq

# Check for active incidents
# Review monitoring dashboards
```

### Step 2: Contain the Incident

**If data breach suspected:**

1. **Revoke compromised credentials immediately:**

   ```bash
   # Rotate API keys in Netlify
   # Rotate Supabase service role key
   # Invalidate affected user sessions
   ```

2. **Block suspicious access:**

   ```sql
   -- Temporarily block suspicious user
   UPDATE users SET is_active = false WHERE id = 'SUSPICIOUS_USER_ID';
   ```

3. **Enable enhanced logging:**
   ```sql
   -- Log all access attempts
   ALTER TABLE consent_access_log SET (autovacuum_enabled = true);
   ```

### Step 3: Notify Stakeholders

**Template:**

```
🚨 PRIVACY INCIDENT: [Brief description]
Severity: SEV-[1/2/3]
Type: [Data Breach / Consent Violation / etc.]
Impact: [Number of users, data types affected]
Status: Investigating
Lead: [Your name]
Time: [UTC timestamp]
```

---

## Investigation Steps

### Step 1: Identify Scope

```sql
-- Identify affected users
SELECT DISTINCT target_user_id
FROM consent_access_log
WHERE access_granted = false
AND accessor_user_id = 'SUSPICIOUS_ACCESSOR'
AND accessed_at > 'INCIDENT_START_TIME';

-- Identify accessed data types
SELECT DISTINCT resource_type, consent_type
FROM consent_access_log
WHERE accessor_user_id = 'SUSPICIOUS_ACCESSOR'
AND accessed_at > 'INCIDENT_START_TIME';
```

### Step 2: Trace Access Path

```sql
-- Full access timeline
SELECT
    accessed_at,
    resource_type,
    access_granted,
    access_reason,
    consent_type
FROM consent_access_log
WHERE accessor_user_id = 'SUSPICIOUS_ACCESSOR'
ORDER BY accessed_at;
```

### Step 3: Check Audit Trail

```sql
-- Related audit events
SELECT *
FROM privacy_audit_log
WHERE user_id IN ('AFFECTED_USER_IDS')
OR affected_data::text LIKE '%SUSPICIOUS_ACCESSOR%'
ORDER BY created_at;
```

### Step 4: Check Application Logs

```bash
# Netlify function logs
netlify logs --last 1000 | grep -i "SUSPICIOUS_ACCESSOR\|error\|unauthorized"

# Supabase logs
# Check Dashboard → Logs → API / Auth / Postgres
```

### Step 5: Determine Root Cause

Common causes:

- [ ] RLS policy misconfiguration
- [ ] API endpoint missing auth check
- [ ] Consent view not used correctly
- [ ] Service role key exposure
- [ ] SQL injection vulnerability
- [ ] Social engineering / credential theft

---

## Remediation Steps

### Scenario A: Consent Bypass

**Cause:** API endpoint not using consent-aware views.

**Fix:**

1. Identify affected endpoint
2. Update to use consent views:

   ```javascript
   // Before (wrong)
   const { data } = await supabase.from("load_monitoring").select("*");

   // After (correct)
   const { data } = await supabase
     .from("v_load_monitoring_consent")
     .select("*");
   ```

3. Deploy fix
4. Audit all similar endpoints

### Scenario B: AI Processing Violation

**Cause:** AI endpoint not checking consent.

**Fix:**

1. Verify consent check exists:

   ```javascript
   const aiEnabled = await checkAiProcessingConsent(userId);
   if (!aiEnabled) {
     return createErrorResponse(
       "AI processing disabled",
       403,
       "ai_processing_disabled",
     );
   }
   ```

2. Add database-level enforcement:
   ```sql
   -- Before any AI query
   SELECT require_ai_consent('USER_ID');
   ```

### Scenario C: Minor Data Exposure

**Cause:** Parental consent not verified.

**Fix:**

1. Check parental consent status:

   ```sql
   SELECT * FROM parental_consent
   WHERE minor_user_id = 'MINOR_USER_ID'
   AND consent_status = 'verified';
   ```

2. Block access if no consent:
   ```javascript
   if (userAge < 16 && !hasVerifiedParentalConsent) {
     return createErrorResponse("Parental consent required", 403);
   }
   ```

### Scenario D: RLS Policy Gap

**Cause:** Missing or incorrect RLS policy.

**Fix:**

1. Identify missing policy:

   ```sql
   SELECT tablename, policyname, cmd, qual
   FROM pg_policies
   WHERE tablename = 'AFFECTED_TABLE';
   ```

2. Add correct policy:
   ```sql
   CREATE POLICY "consent_required_for_coaches"
   ON affected_table FOR SELECT
   USING (
     player_id = auth.uid()
     OR check_performance_sharing(player_id, get_user_team_id())
   );
   ```

---

## Validation Steps

### After Remediation

1. **Verify fix is deployed:**

   ```bash
   curl -s https://your-app.netlify.app/.netlify/functions/health | jq
   ```

2. **Test consent enforcement:**

   ```bash
   # Test that blocked access returns correct response
   curl -X GET "https://your-app.netlify.app/api/load-management/acwr?playerId=OTHER_USER" \
     -H "Authorization: Bearer USER_TOKEN" | jq
   ```

3. **Verify no new violations:**

   ```sql
   SELECT COUNT(*) FROM consent_access_log
   WHERE access_granted = false
   AND accessed_at > 'FIX_DEPLOYMENT_TIME';
   ```

4. **Run privacy tests:**
   ```bash
   npm run test:privacy
   ```

---

## Post-Incident Actions

### Immediate (Within 1 hour)

- [ ] Document incident timeline
- [ ] Verify remediation is effective
- [ ] Notify affected users (if required)
- [ ] Update incident channel

### Short-term (Within 24 hours)

- [ ] Complete incident report
- [ ] Assess regulatory notification requirements
- [ ] Review all similar code paths
- [ ] Create tickets for additional fixes

### Long-term (Within 72 hours)

- [ ] Submit regulatory notification (if required)
- [ ] Implement additional monitoring
- [ ] Update security documentation
- [ ] Conduct team retrospective

---

## Regulatory Notification

### GDPR Data Breach Notification

**When required:** Within 72 hours of becoming aware of a breach that poses a risk to individuals.

**To Data Protection Authority:**

```
GDPR Data Breach Notification

Organization: [Your Organization]
DPO Contact: [DPO Email]

Breach Details:
- Date/Time Discovered: [UTC timestamp]
- Date/Time Occurred: [UTC timestamp or "Unknown"]
- Nature of Breach: [Description]
- Categories of Data: [Personal data, health data, etc.]
- Approximate Number Affected: [Number]
- Likely Consequences: [Description]
- Measures Taken: [Description]
- Measures Proposed: [Description]

Contact for Further Information:
[Name, Email, Phone]
```

**To Affected Users (if high risk):**

```
Subject: Important Security Notice from FlagFit Pro

Dear [Name],

We are writing to inform you of a security incident that may have affected your personal data.

What Happened:
[Clear, non-technical description]

What Data Was Involved:
[List specific data types]

What We Are Doing:
[Steps taken to address and prevent]

What You Can Do:
[Recommended actions for user]

Contact Us:
If you have questions, please contact our Data Protection Officer at [email].

We sincerely apologize for any concern this may cause.

The FlagFit Pro Team
```

---

## Quick Reference

### Key SQL Queries

```sql
-- Check consent violations
SELECT * FROM consent_access_log WHERE access_granted = false ORDER BY accessed_at DESC LIMIT 100;

-- Check AI violations
SELECT acs.* FROM ai_chat_sessions acs
JOIN privacy_settings ps ON acs.user_id = ps.user_id
WHERE ps.ai_processing_enabled = false;

-- Audit trail for user
SELECT * FROM privacy_audit_log WHERE user_id = 'USER_ID' ORDER BY created_at;

-- RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

### Key Contacts

| Role                    | Contact   | When to Notify           |
| ----------------------- | --------- | ------------------------ |
| Data Protection Officer | [Email]   | All privacy incidents    |
| Security Team           | [Email]   | Data breaches            |
| Legal                   | [Email]   | Regulatory notifications |
| On-call Engineer        | [Contact] | Technical response       |

### Incident Classification Quick Guide

| Question                                | Yes →             | No →                   |
| --------------------------------------- | ----------------- | ---------------------- |
| Was PII accessed without authorization? | SEV-1/2           | Continue               |
| Were minors' data involved?             | Escalate to SEV-2 | Continue               |
| Was consent explicitly violated?        | SEV-2             | Continue               |
| Was AI used on opted-out user?          | SEV-3             | Continue               |
| Is it a logging/audit gap?              | SEV-4             | Not a privacy incident |

---

**Document Version:** 1.0.0  
**Next Review:** March 2026

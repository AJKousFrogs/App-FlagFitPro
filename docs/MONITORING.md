# Privacy & Safety Monitoring Plan

**Version:** 1.0.0  
**Last Updated:** 29. December 2025  
**Stack:** Angular 21 + Netlify Functions + Supabase

---

## Table of Contents

1. [Overview](#overview)
2. [Metrics to Track](#metrics-to-track)
3. [Alert Thresholds](#alert-thresholds)
4. [Logging Requirements](#logging-requirements)
5. [Dashboard Specification](#dashboard-specification)
6. [Implementation Guide](#implementation-guide)

---

## Overview

This document defines the monitoring and alerting strategy for privacy and safety systems in FlagFit Pro.

### Monitoring Goals

1. **Detect consent violations** before they affect many users
2. **Track deletion queue health** to ensure GDPR compliance
3. **Monitor AI opt-out enforcement** to respect user preferences
4. **Observe data state distribution** to catch data quality issues
5. **Alert on anomalies** that may indicate security incidents

### Monitoring Stack

| Component | Tool | Purpose |
|-----------|------|---------|
| Application Errors | Sentry | Error tracking, user impact |
| Function Logs | Netlify Logs | Request/response debugging |
| Database Metrics | Supabase Dashboard | Query performance, connections |
| Custom Metrics | Structured Logs + Queries | Privacy-specific metrics |
| Alerting | Sentry / PagerDuty / Slack | Incident notification |

---

## Metrics to Track

### 1. Deletion Queue Metrics

| Metric | Description | Collection Method |
|--------|-------------|-------------------|
| `deletion_queue_backlog` | Count of overdue deletions | SQL query |
| `deletion_queue_pending` | Count of pending deletions | SQL query |
| `deletion_processing_failures` | Count of failed deletions | SQL query |
| `deletion_processing_time_avg` | Average time to process | Calculated |
| `deletion_cancellation_rate` | % of deletions cancelled | Calculated |

**SQL Queries:**

```sql
-- Backlog (overdue deletions)
SELECT COUNT(*) as deletion_queue_backlog
FROM account_deletion_requests
WHERE status = 'pending'
AND scheduled_hard_delete_at <= NOW();

-- Pending total
SELECT COUNT(*) as deletion_queue_pending
FROM account_deletion_requests
WHERE status = 'pending';

-- Failures (last 24h)
SELECT COUNT(*) as deletion_processing_failures
FROM account_deletion_requests
WHERE status = 'failed'
AND updated_at > NOW() - INTERVAL '24 hours';
```

### 2. Consent Metrics

| Metric | Description | Collection Method |
|--------|-------------|-------------------|
| `consent_blocked_events` | Access blocked due to no consent | SQL query |
| `consent_blocked_rate` | % of accesses blocked | Calculated |
| `consent_granted_rate` | % of users with consent enabled | SQL query |
| `consent_changes` | Consent setting changes | Audit log |

**SQL Queries:**

```sql
-- Consent blocked events (last hour)
SELECT COUNT(*) as consent_blocked_events
FROM consent_access_log
WHERE access_granted = false
AND accessed_at > NOW() - INTERVAL '1 hour';

-- Consent blocked rate
SELECT 
    COUNT(*) FILTER (WHERE access_granted = false) * 100.0 / NULLIF(COUNT(*), 0) as consent_blocked_rate
FROM consent_access_log
WHERE accessed_at > NOW() - INTERVAL '1 hour';

-- Users with performance sharing enabled
SELECT 
    COUNT(*) FILTER (WHERE performance_sharing_default = true) * 100.0 / COUNT(*) as consent_granted_rate
FROM privacy_settings;
```

### 3. AI Opt-Out Metrics

| Metric | Description | Collection Method |
|--------|-------------|-------------------|
| `ai_optout_blocks` | AI requests blocked due to opt-out | API logs |
| `ai_optout_rate` | % of users with AI disabled | SQL query |
| `ai_remediation_visits` | Visits to privacy settings after block | Analytics |

**SQL Queries:**

```sql
-- AI opt-out rate
SELECT 
    COUNT(*) FILTER (WHERE ai_processing_enabled = false) * 100.0 / COUNT(*) as ai_optout_rate
FROM privacy_settings;

-- AI processing consent distribution
SELECT 
    ai_processing_enabled,
    COUNT(*) as user_count
FROM privacy_settings
GROUP BY ai_processing_enabled;
```

### 4. Data State Metrics

| Metric | Description | Collection Method |
|--------|-------------|-------------------|
| `data_state_no_data` | Users with NO_DATA state | API response analysis |
| `data_state_insufficient` | Users with INSUFFICIENT_DATA | API response analysis |
| `data_state_real` | Users with REAL_DATA | API response analysis |
| `data_state_distribution` | Distribution by feature | Aggregated |

**SQL Queries:**

```sql
-- Users by training data availability (for ACWR)
SELECT 
    CASE 
        WHEN session_count = 0 THEN 'NO_DATA'
        WHEN session_count < 28 THEN 'INSUFFICIENT_DATA'
        ELSE 'REAL_DATA'
    END as data_state,
    COUNT(*) as user_count
FROM (
    SELECT 
        player_id,
        COUNT(DISTINCT DATE(completed_at)) as session_count
    FROM workout_logs
    WHERE completed_at > NOW() - INTERVAL '28 days'
    GROUP BY player_id
) user_sessions
GROUP BY 1;
```

### 5. Retention Metrics

| Metric | Description | Collection Method |
|--------|-------------|-------------------|
| `emergency_records_expired` | Records past retention | SQL query |
| `emergency_records_expiring_soon` | Records expiring in 30 days | SQL query |
| `retention_cleanup_count` | Records cleaned up | Audit log |

**SQL Queries:**

```sql
-- Expired emergency records (should be 0)
SELECT COUNT(*) as emergency_records_expired
FROM emergency_medical_records
WHERE retention_expires_at <= NOW();

-- Expiring soon (next 30 days)
SELECT COUNT(*) as emergency_records_expiring_soon
FROM emergency_medical_records
WHERE retention_expires_at BETWEEN NOW() AND NOW() + INTERVAL '30 days';
```

---

## Alert Thresholds

### Critical Alerts (SEV-1) - Immediate Response

| Alert | Condition | Action |
|-------|-----------|--------|
| Deletion Backlog Critical | `deletion_queue_backlog > 50` | Page on-call |
| RLS Disabled | Any privacy table RLS disabled | Page on-call |
| Mass Consent Violation | `consent_blocked_rate > 50%` in 5 min | Page on-call |
| Data Breach Indicators | Unusual access patterns | Page on-call + Security |

### High Alerts (SEV-2) - Response within 1 hour

| Alert | Condition | Action |
|-------|-----------|--------|
| Deletion Backlog High | `deletion_queue_backlog > 10` | Slack alert |
| Deletion Failures | `deletion_processing_failures > 5` | Slack alert |
| Consent Block Spike | `consent_blocked_events` 10x normal | Slack alert |
| AI Opt-Out Spike | `ai_optout_blocks` 10x normal | Slack alert |

### Medium Alerts (SEV-3) - Response within 4 hours

| Alert | Condition | Action |
|-------|-----------|--------|
| Deletion Backlog Warning | `deletion_queue_backlog > 0` for 24h | Slack alert |
| High Insufficient Data Rate | `data_state_insufficient > 80%` | Slack alert |
| Expired Records Exist | `emergency_records_expired > 0` | Slack alert |

### Low Alerts (SEV-4) - Next business day

| Alert | Condition | Action |
|-------|-----------|--------|
| Consent Rate Declining | Week-over-week decline > 10% | Email |
| AI Opt-Out Trending Up | Week-over-week increase > 20% | Email |

---

## Logging Requirements

### Structured Log Format

All privacy-related logs should use this JSON structure:

```json
{
  "timestamp": "2025-12-29T10:30:00.000Z",
  "level": "info",
  "service": "ai-chat",
  "requestId": "req_abc123",
  "userId": "uuid",
  "event": "ai_consent_check",
  "outcome": "blocked",
  "details": {
    "reason": "ai_processing_disabled",
    "consentStatus": false
  }
}
```

### Required Log Events

| Event | When to Log | Fields |
|-------|-------------|--------|
| `consent_check` | Every consent validation | userId, targetUserId, resource, granted |
| `ai_consent_check` | AI endpoint access | userId, enabled, blocked |
| `deletion_requested` | Deletion initiated | userId, requestId |
| `deletion_processed` | Deletion completed | requestId, tablesDeleted |
| `deletion_failed` | Deletion error | requestId, error |
| `retention_cleanup` | Records cleaned | recordCount |
| `privacy_setting_changed` | User changes settings | userId, setting, oldValue, newValue |

### Redaction Rules

**NEVER log:**
- Passwords or tokens
- Full email addresses (redact: `j***@example.com`)
- Phone numbers (redact: `+1-***-***-1234`)
- Health data values
- Full names (use first name + initial: `John D.`)

**Safe to log:**
- User IDs (UUIDs)
- Request IDs
- Timestamps
- Boolean consent states
- Aggregate counts
- Error codes (not messages with PII)

### Implementation Example

```javascript
// netlify/functions/utils/privacy-logger.cjs

const logPrivacyEvent = (event, details) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    service: process.env.FUNCTION_NAME || 'unknown',
    requestId: details.requestId,
    userId: details.userId, // UUID only
    event: event,
    outcome: details.outcome,
    details: redactSensitive(details.extra || {})
  };
  
  console.log(JSON.stringify(logEntry));
};

const redactSensitive = (obj) => {
  const redacted = { ...obj };
  if (redacted.email) {
    const [user, domain] = redacted.email.split('@');
    redacted.email = `${user[0]}***@${domain}`;
  }
  delete redacted.password;
  delete redacted.token;
  return redacted;
};

module.exports = { logPrivacyEvent };
```

---

## Dashboard Specification

### Privacy Health Dashboard

**Refresh:** Every 5 minutes

#### Section 1: Deletion Queue Health

| Widget | Type | Data Source |
|--------|------|-------------|
| Backlog Count | Single Value | `deletion_queue_backlog` |
| Pending Count | Single Value | `deletion_queue_pending` |
| Failures (24h) | Single Value | `deletion_processing_failures` |
| Queue Trend | Line Chart | Backlog over time |

#### Section 2: Consent Metrics

| Widget | Type | Data Source |
|--------|------|-------------|
| Blocked Events/Hour | Single Value | `consent_blocked_events` |
| Block Rate % | Gauge | `consent_blocked_rate` |
| Consent Distribution | Pie Chart | Performance/Health sharing rates |
| Block Events Trend | Line Chart | Hourly blocked events |

#### Section 3: AI Opt-Out

| Widget | Type | Data Source |
|--------|------|-------------|
| Opt-Out Rate % | Gauge | `ai_optout_rate` |
| Blocks Today | Single Value | `ai_optout_blocks` |
| Opt-Out Trend | Line Chart | Weekly opt-out rate |

#### Section 4: Data State Distribution

| Widget | Type | Data Source |
|--------|------|-------------|
| Distribution | Stacked Bar | NO_DATA / INSUFFICIENT / REAL |
| By Feature | Table | Data state per feature |

#### Section 5: Retention Status

| Widget | Type | Data Source |
|--------|------|-------------|
| Expired Records | Single Value (should be 0) | `emergency_records_expired` |
| Expiring Soon | Single Value | `emergency_records_expiring_soon` |
| Last Cleanup | Timestamp | Audit log |

### Sample Dashboard Query (Supabase SQL)

```sql
-- Combined privacy health query
SELECT 
    -- Deletion metrics
    (SELECT COUNT(*) FROM account_deletion_requests 
     WHERE status = 'pending' AND scheduled_hard_delete_at <= NOW()) as deletion_backlog,
    (SELECT COUNT(*) FROM account_deletion_requests 
     WHERE status = 'failed' AND updated_at > NOW() - INTERVAL '24 hours') as deletion_failures,
    
    -- Consent metrics
    (SELECT COUNT(*) FROM consent_access_log 
     WHERE access_granted = false AND accessed_at > NOW() - INTERVAL '1 hour') as consent_blocked_hour,
    
    -- AI metrics
    (SELECT COUNT(*) FILTER (WHERE ai_processing_enabled = false) * 100.0 / COUNT(*) 
     FROM privacy_settings) as ai_optout_rate,
    
    -- Retention metrics
    (SELECT COUNT(*) FROM emergency_medical_records 
     WHERE retention_expires_at <= NOW()) as expired_records;
```

---

## Implementation Guide

### Step 1: Add Privacy Logger

Create `netlify/functions/utils/privacy-logger.cjs` with the logging utilities shown above.

### Step 2: Instrument Endpoints

Add logging to privacy-critical endpoints:

```javascript
// In ai-chat.cjs
const { logPrivacyEvent } = require('./utils/privacy-logger.cjs');

// After consent check
logPrivacyEvent('ai_consent_check', {
  requestId,
  userId,
  outcome: aiProcessingEnabled ? 'allowed' : 'blocked',
  extra: { consentStatus: aiProcessingEnabled }
});
```

### Step 3: Create Monitoring Queries

Add scheduled queries to collect metrics:

```sql
-- Create a materialized view for dashboard (refresh every 5 min)
CREATE MATERIALIZED VIEW IF NOT EXISTS privacy_health_metrics AS
SELECT 
    NOW() as collected_at,
    (SELECT COUNT(*) FROM account_deletion_requests 
     WHERE status = 'pending' AND scheduled_hard_delete_at <= NOW()) as deletion_backlog,
    (SELECT COUNT(*) FROM consent_access_log 
     WHERE access_granted = false AND accessed_at > NOW() - INTERVAL '1 hour') as consent_blocked_hour,
    (SELECT COUNT(*) FILTER (WHERE ai_processing_enabled = false) * 100.0 / NULLIF(COUNT(*), 0) 
     FROM privacy_settings) as ai_optout_rate;

-- Refresh schedule
SELECT cron.schedule('refresh-privacy-metrics', '*/5 * * * *', 
    'REFRESH MATERIALIZED VIEW privacy_health_metrics');
```

### Step 4: Configure Alerts

#### Sentry Alert Rules

```yaml
# .sentry/alerts.yml
alerts:
  - name: AI Consent Blocked Spike
    conditions:
      - type: event_frequency
        value: 100
        interval: 5m
    filters:
      - type: tagged_event
        key: event
        value: ai_consent_check
      - type: tagged_event
        key: outcome
        value: blocked
    actions:
      - type: slack
        channel: "#privacy-alerts"
```

#### Supabase Database Webhooks

Configure webhooks for real-time alerts:

1. Go to Supabase Dashboard → Database → Webhooks
2. Create webhook for `account_deletion_requests` INSERT with `status = 'failed'`
3. Point to your alerting endpoint

### Step 5: Create Dashboard

Use Supabase Dashboard custom queries or connect to Grafana/Metabase:

1. Connect BI tool to Supabase (read replica recommended)
2. Import the dashboard queries from this document
3. Set refresh intervals
4. Configure alert thresholds

---

## Metric Naming Conventions

Use consistent naming for all metrics:

```
{domain}_{entity}_{measurement}_{unit}

Examples:
- privacy_deletion_queue_backlog_count
- privacy_consent_blocked_events_hourly
- privacy_ai_optout_rate_percent
- privacy_retention_expired_records_count
```

---

## Quick Reference

### Key Metrics to Watch

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| Deletion Backlog | 0 | > 10 | > 50 |
| Consent Block Rate | < 5% | > 20% | > 50% |
| AI Opt-Out Rate | < 30% | > 50% | N/A |
| Expired Records | 0 | > 0 | > 10 |
| Deletion Failures | 0 | > 5 | > 20 |

### Alert Response Contacts

| Alert Type | Primary | Escalation |
|------------|---------|------------|
| Deletion Issues | On-call Engineer | Privacy Officer |
| Consent Violations | On-call Engineer | Security Team |
| Data Breach | Security Team | Legal + DPO |

---

**Document Version:** 1.0.0  
**Next Review:** March 2026


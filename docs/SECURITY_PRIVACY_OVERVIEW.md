# Security & Privacy Overview

**FlagFit Pro — Athlete Training Platform**

_Version 1.0 | 29. December 2025_

This document provides a concise overview of FlagFit Pro's security and privacy architecture for stakeholders, auditors, and partners.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Trust Boundaries](#architecture-trust-boundaries)
3. [Consent Enforcement Model](#consent-enforcement-model)
4. [AI Opt-Out & Fail-Fast Design](#ai-opt-out--fail-fast-design)
5. [Deletion & Retention Lifecycle](#deletion--retention-lifecycle)
6. [Evidence Checklist](#evidence-checklist)
7. [Limitations & Non-Goals](#limitations--non-goals)

---

## Executive Summary

FlagFit Pro is a training platform for flag football athletes and coaches. The platform handles sensitive performance and health data, requiring robust privacy controls.

### Key Privacy Principles

| Principle                | Implementation                                            |
| ------------------------ | --------------------------------------------------------- |
| **Privacy by Default**   | Data sharing disabled until user opts in                  |
| **Consent-First Access** | Coaches see only data players have shared                 |
| **AI Opt-Out**           | AI features disabled by default, require explicit consent |
| **Right to Erasure**     | 30-day grace period, then permanent deletion              |
| **Audit Trail**          | All data access logged for compliance                     |

### Compliance Framework

- **GDPR** (EU General Data Protection Regulation)
- **CCPA** (California Consumer Privacy Act)
- **COPPA** (Children's Online Privacy Protection) — parental consent for minors

---

## Architecture Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL BOUNDARY                              │
│  Users access via HTTPS only. All traffic encrypted in transit.          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            UI LAYER (Angular)                            │
│                                                                          │
│  • Displays consent status and data state warnings                       │
│  • Shows blocked data indicators to coaches                              │
│  • Guides users to privacy settings                                      │
│  • Never stores sensitive data in local storage                          │
│                                                                          │
│  Trust: Renders what API provides. Cannot bypass consent.                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API LAYER (Netlify Functions)                    │
│                                                                          │
│  • Authenticates all requests via Supabase JWT                           │
│  • Uses ConsentDataReader for coach-facing data                          │
│  • Returns dataState metadata in all responses                           │
│  • Rate-limited to prevent abuse                                         │
│                                                                          │
│  Trust: Enforces business logic. Uses consent views only.                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER (Supabase/PostgreSQL)               │
│                                                                          │
│  • Row-Level Security (RLS) on all sensitive tables                      │
│  • Consent views (v_*_consent) enforce sharing rules                     │
│  • Helper functions check consent settings                               │
│  • Audit logging for all consent-related access                          │
│                                                                          │
│  Trust: Ultimate enforcement. RLS cannot be bypassed by API.             │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

1. **Player logs training** → Data stored with player_id
2. **Coach requests team data** → API calls consent view
3. **Consent view checks** → Returns NULL for non-consented fields
4. **API returns response** → Includes consent_blocked flags
5. **UI displays** → Shows "Data Not Shared" for blocked players

---

## Consent Enforcement Model

### Four-Layer Enforcement

| Layer        | Mechanism         | What It Enforces                                |
| ------------ | ----------------- | ----------------------------------------------- |
| **Database** | RLS Policies      | Base access control (own data, team membership) |
| **Database** | Consent Views     | Field-level consent (NULL if not shared)        |
| **API**      | ConsentDataReader | Consistent consent checking, audit logging      |
| **UI**       | Privacy Messages  | User-visible consent status                     |

### Consent Types

| Type                | Scope    | Default | Controls                         |
| ------------------- | -------- | ------- | -------------------------------- |
| Performance Sharing | Per-team | OFF     | Load metrics, workout data, ACWR |
| Health Sharing      | Per-team | OFF     | Injury risk, wellness data       |
| AI Processing       | Global   | OFF     | AI recommendations, predictions  |
| Research Opt-In     | Global   | OFF     | Anonymized research data         |

### Consent View Behavior

```sql
-- When coach queries v_load_monitoring_consent:

-- If player HAS enabled sharing:
{ player_id: "...", daily_load: 450, acwr: 1.2, consent_blocked: false }

-- If player HAS NOT enabled sharing:
{ player_id: "...", daily_load: NULL, acwr: NULL, consent_blocked: true }
```

### Key Database Functions

| Function                                  | Purpose                                 |
| ----------------------------------------- | --------------------------------------- |
| `check_performance_sharing(player, team)` | Returns TRUE if player shares with team |
| `check_health_sharing(player, team)`      | Returns TRUE if health data is shared   |
| `check_ai_processing_enabled(user)`       | Returns TRUE if AI consent given        |
| `require_ai_consent(user)`                | Raises exception if AI not consented    |

---

## AI Opt-Out & Fail-Fast Design

### AI Consent Model

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI FEATURE REQUEST                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Check AI Consent │
                    └─────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │ Consent = TRUE  │             │ Consent = FALSE │
    └─────────────────┘             └─────────────────┘
              │                               │
              ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │ Process with AI │             │ FAIL FAST       │
    │ Return results  │             │ Return error    │
    └─────────────────┘             │ Show UI message │
                                    └─────────────────┘
```

### Fail-Fast Implementation

```javascript
// API layer - fails immediately if AI not consented
const { error } = await supabase.rpc("require_ai_consent", {
  p_user_id: userId,
});
if (error?.message.includes("AI_CONSENT_REQUIRED")) {
  return { error: "AI processing disabled", code: "AI_CONSENT_REQUIRED" };
}
```

### What AI Controls

| Feature                  | Requires AI Consent | Behavior Without        |
| ------------------------ | ------------------- | ----------------------- |
| Training recommendations | Yes                 | Manual suggestions only |
| Injury risk predictions  | Yes                 | Basic thresholds only   |
| Performance insights     | Yes                 | Raw data only           |
| Chat assistant           | Yes                 | Feature disabled        |

---

## Deletion & Retention Lifecycle

### Deletion Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ User Requests   │────▶│ 30-Day Grace    │────▶│ Hard Deletion   │
│ Deletion        │     │ Period          │     │ Processing      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
  Status: PENDING         Can Cancel            Status: COMPLETED
  Email confirmation      User notified         Data permanently
  sent to user            at day 7, 1           removed
```

### Retention Periods

| Data Type           | Retention      | Justification             |
| ------------------- | -------------- | ------------------------- |
| Training data       | Until deletion | User-owned data           |
| Audit logs          | 2 years        | Compliance requirement    |
| Emergency medical   | 7 years        | Legal/medical requirement |
| Anonymized research | Indefinite     | Cannot be linked to user  |

### What Gets Deleted

| Deleted          | Retained (Anonymized)       |
| ---------------- | --------------------------- |
| User profile     | Aggregated statistics       |
| Training history | Research data (if opted in) |
| Privacy settings | Audit logs (pseudonymized)  |
| Team memberships | —                           |
| Consent records  | —                           |

### Emergency Medical Records

Medical records created during emergencies are retained for 7 years per legal requirements, even after account deletion. These records:

- Are encrypted at rest
- Require explicit consent to create
- Can only be accessed by authorized medical personnel
- Are automatically purged after 7 years

---

## Evidence Checklist

### Automated Tests

| Test Suite           | Location                                      | Coverage              |
| -------------------- | --------------------------------------------- | --------------------- |
| Consent gating tests | `tests/privacy-safety/consent-gating.test.js` | Consent view behavior |
| RLS policy tests     | `tests/privacy-safety/rls-policies.test.js`   | Row-level security    |
| AI consent tests     | `tests/privacy-safety/ai-consent.test.js`     | AI fail-fast          |
| Deletion tests       | `tests/privacy-safety/deletion.test.js`       | Deletion lifecycle    |

### CI Gates

| Gate                    | Script                              | Fails Build If                       |
| ----------------------- | ----------------------------------- | ------------------------------------ |
| Consent violation check | `npm run check:consent:ci`          | Direct table access in coach context |
| DB object verification  | `npm run verify:db:ci`              | Missing consent views/functions      |
| RLS verification        | `npm run verify:db:ci`              | RLS disabled on sensitive tables     |
| Security audit          | `npm run security:dependency-check` | High-severity vulnerabilities        |

### Runbooks

| Runbook                             | Purpose                     |
| ----------------------------------- | --------------------------- |
| `docs/RUNBOOKS/PRIVACY_INCIDENT.md` | Respond to privacy breaches |
| `docs/RUNBOOKS/DATA_DELETION.md`    | Manual deletion procedures  |
| `docs/RUNBOOKS/CONSENT_AUDIT.md`    | Audit consent access logs   |

### Monitoring

| Metric                   | Alert Threshold | Dashboard       |
| ------------------------ | --------------- | --------------- |
| Consent view errors      | > 10/hour       | Supabase Logs   |
| Failed AI consent checks | > 100/hour      | API Metrics     |
| Deletion queue backlog   | > 1000 pending  | Scheduled Jobs  |
| RLS policy violations    | Any             | Security Alerts |

---

## Limitations & Non-Goals

### Current Limitations

| Limitation                  | Mitigation               | Future Plan                    |
| --------------------------- | ------------------------ | ------------------------------ |
| No end-to-end encryption    | TLS + encryption at rest | Evaluate E2EE for health data  |
| Single-region deployment    | Supabase managed backups | Multi-region for EU compliance |
| No hardware security module | Supabase key management  | Evaluate HSM for enterprise    |
| Basic audit logging         | Timestamps + user IDs    | Enhanced audit with IP/device  |

### Non-Goals

| Not In Scope              | Reason                    |
| ------------------------- | ------------------------- |
| HIPAA compliance          | Not a healthcare provider |
| SOC 2 Type II             | Future consideration      |
| PCI DSS                   | No payment processing     |
| Government-grade security | Consumer application      |

### Assumptions

1. **Supabase Security**: We rely on Supabase's security practices for infrastructure
2. **User Device Security**: Users are responsible for securing their devices
3. **Honest Users**: System protects against accidental exposure, not malicious insiders with DB access

---

## Contact

For security concerns or privacy inquiries:

- **Security Issues**: merlin@ljubljanafrogs.si
- **Privacy Requests**: merlin@ljubljanafrogs.si
- **Data Protection Officer**: merlin@ljubljanafrogs.si

---

## Document History

| Version | Date              | Changes         |
| ------- | ----------------- | --------------- |
| 1.0     | 29. December 2025 | Initial release |

---

_Športno društvo Žabe - Athletes helping athletes since 2020_

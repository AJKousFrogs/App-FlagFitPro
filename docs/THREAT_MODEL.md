# Threat Model

**FlagFit Pro — Athlete Training Platform**

_Version 1.0 | 29. December 2025_

This document formalizes the threat model for FlagFit Pro. It identifies assets, threat actors, trust boundaries, and maps existing mitigations to potential attack vectors.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Assets](#assets)
3. [Threat Actors](#threat-actors)
4. [Trust Boundaries](#trust-boundaries)
5. [Threat Matrix](#threat-matrix)
6. [Attack Vectors & Mitigations](#attack-vectors--mitigations)
7. [Data Flow Diagram](#data-flow-diagram)
8. [Risk Register](#risk-register)
9. [Residual Risks](#residual-risks)
10. [Review Schedule](#review-schedule)

---

## Executive Summary

FlagFit Pro is a training platform for flag football athletes handling sensitive performance and health data. This threat model identifies key risks and documents the controls in place to mitigate them.

### Key Findings

| Category                  | Risk Level | Status       |
| ------------------------- | ---------- | ------------ |
| **Data Confidentiality**  | Medium     | ✅ Mitigated |
| **Consent Enforcement**   | High       | ✅ Mitigated |
| **AI Data Processing**    | Medium     | ✅ Mitigated |
| **Minor Data Protection** | High       | ✅ Mitigated |
| **Data Retention**        | Medium     | ✅ Mitigated |

### Scope

**In Scope:**

- Web application (Angular frontend)
- API layer (Netlify Functions)
- Database layer (Supabase/PostgreSQL)
- Authentication system
- AI processing pipeline

**Out of Scope:**

- Mobile applications (not yet built)
- Third-party integrations (none active)
- Physical security
- Social engineering attacks on end users

---

## Assets

### Critical Assets (Tier 1)

| Asset                  | Description                           | Classification                 | Owner          |
| ---------------------- | ------------------------------------- | ------------------------------ | -------------- |
| **User Credentials**   | Passwords, session tokens             | Highly Sensitive               | Auth System    |
| **Health Data**        | Injury risk, wellness metrics         | Highly Sensitive (GDPR Art. 9) | Player         |
| **Minor User Data**    | Under-16 athlete information          | Highly Sensitive (COPPA)       | Player/Parent  |
| **Consent Records**    | User privacy preferences              | Sensitive                      | Privacy System |
| **AI Processing Data** | Training recommendations, predictions | Sensitive                      | AI System      |

### Important Assets (Tier 2)

| Asset                  | Description                       | Classification | Owner  |
| ---------------------- | --------------------------------- | -------------- | ------ |
| **Performance Data**   | Training logs, load metrics, ACWR | Sensitive      | Player |
| **Team Relationships** | Player-coach associations         | Internal       | Team   |
| **Audit Logs**         | Access and consent records        | Internal       | System |
| **User Profiles**      | Name, email, position             | Personal Data  | Player |

### Supporting Assets (Tier 3)

| Asset                     | Description        | Classification | Owner  |
| ------------------------- | ------------------ | -------------- | ------ |
| **Exercise Library**      | Training content   | Public         | System |
| **Program Templates**     | Training programs  | Internal       | Coach  |
| **Aggregated Statistics** | Anonymized metrics | Non-sensitive  | System |

---

## Threat Actors

### External Actors

| Actor                      | Motivation                        | Capability | Likelihood |
| -------------------------- | --------------------------------- | ---------- | ---------- |
| **Opportunistic Attacker** | Data theft, credential harvesting | Low-Medium | Medium     |
| **Competitor**             | Business intelligence             | Medium     | Low        |
| **Automated Bot**          | Credential stuffing, scraping     | Low        | High       |
| **Disgruntled Ex-User**    | Data access, revenge              | Low        | Low        |

### Internal Actors

| Actor                         | Motivation                     | Capability                 | Likelihood |
| ----------------------------- | ------------------------------ | -------------------------- | ---------- |
| **Curious Coach**             | View non-consented player data | Medium (legitimate access) | Medium     |
| **Malicious Team Admin**      | Bulk data extraction           | High (elevated access)     | Low        |
| **Compromised Admin Account** | System-wide access             | High                       | Low        |

### Accidental Actors

| Actor         | Motivation                    | Capability | Likelihood |
| ------------- | ----------------------------- | ---------- | ---------- |
| **Developer** | Unintentional data exposure   | High       | Medium     |
| **User**      | Misconfiguration, oversharing | Low        | Medium     |

---

## Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                        │
│                         (Untrusted Zone)                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS Only
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TRUST BOUNDARY 1                                     │
│                    CDN / Edge Network (Netlify)                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  • TLS termination                                                     │  │
│  │  • DDoS protection                                                     │  │
│  │  • Rate limiting (basic)                                               │  │
│  │  • Static asset serving                                                │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Internal HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TRUST BOUNDARY 2                                     │
│                      Application Layer (Angular)                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  • Input validation (client-side)                                      │  │
│  │  • XSS prevention (Angular sanitization)                               │  │
│  │  • CSRF protection (SameSite cookies)                                  │  │
│  │  • No sensitive data in localStorage                                   │  │
│  │  • Consent status display                                              │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ JWT-authenticated requests
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TRUST BOUNDARY 3                                     │
│                     API Layer (Netlify Functions)                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  • JWT validation (Supabase Auth)                                      │  │
│  │  • Input sanitization                                                  │  │
│  │  • Rate limiting (per-user)                                            │  │
│  │  • ConsentDataReader enforcement                                       │  │
│  │  • DataState contract compliance                                       │  │
│  │  • AI consent verification                                             │  │
│  │  • Audit logging                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Authenticated DB connection
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TRUST BOUNDARY 4                                     │
│                    Database Layer (Supabase/PostgreSQL)                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  • Row-Level Security (RLS) on all tables                              │  │
│  │  • Consent views (v_*_consent) for coach access                        │  │
│  │  • Helper functions (check_performance_sharing, etc.)                  │  │
│  │  • Encryption at rest                                                  │  │
│  │  • Audit triggers                                                      │  │
│  │  • Foreign key constraints                                             │  │
│  │  • Domain validation (ENUMs, CHECK constraints)                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Trust Boundary Crossings

| From           | To                     | Data Crossing         | Controls |
| -------------- | ---------------------- | --------------------- | -------- |
| Internet → CDN | User requests          | TLS, DDoS protection  |
| CDN → App      | Authenticated requests | JWT validation        |
| App → API      | API calls              | JWT, input validation |
| API → Database | Queries                | RLS, consent views    |
| Database → API | Query results          | DataState metadata    |

---

## Threat Matrix

### STRIDE Analysis

| Threat                     | Asset                | Likelihood | Impact   | Risk     | Mitigation                   |
| -------------------------- | -------------------- | ---------- | -------- | -------- | ---------------------------- |
| **Spoofing**               | User identity        | Medium     | High     | High     | JWT auth, Supabase Auth      |
| **Tampering**              | Training data        | Low        | Medium   | Low      | RLS, audit logs              |
| **Repudiation**            | Consent changes      | Medium     | High     | High     | Audit trail, timestamps      |
| **Information Disclosure** | Player data to coach | High       | High     | Critical | Consent views, RLS           |
| **Information Disclosure** | Health data          | Medium     | Critical | High     | Health consent flag          |
| **Information Disclosure** | Minor data           | Medium     | Critical | High     | Parental consent, age checks |
| **Denial of Service**      | API availability     | Medium     | Medium   | Medium   | Rate limiting                |
| **Elevation of Privilege** | Coach → Admin        | Low        | Critical | Medium   | Role-based access            |

---

## Attack Vectors & Mitigations

### AV-1: Unauthorized Player Data Access (Coach)

**Threat:** Coach attempts to view data from players who haven't consented.

**Attack Path:**

```
Coach → API endpoint → Database query → Player data
```

**Mitigations:**

| Layer    | Control                 | Implementation                                                    |
| -------- | ----------------------- | ----------------------------------------------------------------- |
| Database | Consent Views           | `v_load_monitoring_consent` returns NULL for non-consented fields |
| Database | RLS Policies            | `check_performance_sharing(player_id, team_id)`                   |
| API      | ConsentDataReader       | All coach queries go through consent-aware reader                 |
| API      | DataState Contract      | Response includes `consent_blocked` flags                         |
| UI       | Privacy Messages        | Shows "Data Not Shared" for blocked players                       |
| CI       | Consent Violation Check | `npm run check:consent:ci` fails on direct table access           |

**Evidence:**

- `docs/RLS_POLICY_SPECIFICATION.md` - Consent enforcement patterns
- `tests/privacy-safety/consent-gating.test.js` - Automated tests
- `database/migrations/071_*.sql` - Consent view definitions

---

### AV-2: AI Processing Without Consent

**Threat:** AI features process data from users who have opted out.

**Attack Path:**

```
User (opted out) → AI endpoint → AI processing → Recommendations
```

**Mitigations:**

| Layer    | Control           | Implementation                                       |
| -------- | ----------------- | ---------------------------------------------------- |
| Database | AI Consent Check  | `require_ai_consent(user_id)` raises exception       |
| Database | Privacy Settings  | `ai_processing_enabled` column in `privacy_settings` |
| API      | Fail-Fast Pattern | Check consent before any AI processing               |
| UI       | AI Feature Gate   | Components check consent before rendering            |

**Evidence:**

- `docs/AI_GOVERNANCE.md` - AI Opt-Out section
- `tests/privacy-safety/ai-consent.test.js` - Automated tests

---

### AV-3: Minor Data Exposure

**Threat:** Under-16 athlete data accessed without parental consent.

**Attack Path:**

```
Minor signs up → Uses features → Data exposed without parent approval
```

**Mitigations:**

| Layer        | Control                | Implementation                                |
| ------------ | ---------------------- | --------------------------------------------- |
| Registration | Age Collection         | Birth date required at signup                 |
| Database     | Parental Consent Table | `parental_consent` tracks verification status |
| API          | Age Check              | Features restricted for unverified minors     |
| Email        | Verification Flow      | Parent receives verification email            |
| UI           | Consent Status         | Shows pending/verified status                 |

**Evidence:**

- `database/add_email_verification.sql` - Parental consent schema
- `docs/SECURITY.md` - Security architecture including consent states

---

### AV-4: Data Retention Violation

**Threat:** User data not deleted after account deletion request.

**Attack Path:**

```
User requests deletion → System fails to delete → Data retained
```

**Mitigations:**

| Layer         | Control            | Implementation                            |
| ------------- | ------------------ | ----------------------------------------- |
| Database      | Deletion Queue     | `deletion_requests` table tracks requests |
| Database      | Cascade Deletes    | Foreign keys with `ON DELETE CASCADE`     |
| Scheduled Job | Deletion Processor | Processes queue after 30-day grace period |
| Audit         | Deletion Logs      | Records what was deleted                  |
| Exception     | Medical Records    | 7-year retention for legal compliance     |

**Evidence:**

- `docs/RUNBOOKS/ACCOUNT_DELETION.md` - Deletion procedures
- `docs/RUNBOOKS/RETENTION_CLEANUP.md` - Retention policies

---

### AV-5: Credential Stuffing / Brute Force

**Threat:** Attacker uses leaked credentials or brute force to gain access.

**Attack Path:**

```
Attacker → Login endpoint → Multiple attempts → Account access
```

**Mitigations:**

| Layer      | Control               | Implementation                  |
| ---------- | --------------------- | ------------------------------- |
| Auth       | Supabase Auth         | Built-in rate limiting          |
| Auth       | Password Policy       | Minimum complexity requirements |
| Auth       | Leaked Password Check | HaveIBeenPwned API integration  |
| API        | Rate Limiting         | Per-IP and per-user limits      |
| Monitoring | Failed Login Alerts   | Spike detection                 |

**Evidence:**

- `docs/PASSWORD_LEAK_PROTECTION.md` - Leaked password checking
- `docs/AUTHENTICATION_PATTERN.md` - Auth implementation

---

### AV-6: SQL Injection

**Threat:** Attacker injects malicious SQL through input fields.

**Attack Path:**

```
Attacker → Form input → API → Database query → Data exfiltration
```

**Mitigations:**

| Layer    | Control               | Implementation                             |
| -------- | --------------------- | ------------------------------------------ |
| API      | Parameterized Queries | Supabase client uses parameterized queries |
| API      | Input Validation      | Type checking, length limits               |
| Database | RLS                   | Even if injected, RLS limits access        |
| Database | Least Privilege       | API uses limited-privilege role            |

---

### AV-7: Cross-Site Scripting (XSS)

**Threat:** Attacker injects malicious scripts into application.

**Attack Path:**

```
Attacker → User-generated content → Stored in DB → Rendered to victim
```

**Mitigations:**

| Layer    | Control                 | Implementation                 |
| -------- | ----------------------- | ------------------------------ |
| Frontend | Angular Sanitization    | Automatic HTML sanitization    |
| Frontend | Content Security Policy | Restricts script sources       |
| API      | Input Sanitization      | Strip HTML from text fields    |
| Database | Text Validation         | No HTML in user content fields |

---

### AV-8: Session Hijacking

**Threat:** Attacker steals user session token.

**Attack Path:**

```
Attacker → Intercepts token → Impersonates user
```

**Mitigations:**

| Layer     | Control          | Implementation                          |
| --------- | ---------------- | --------------------------------------- |
| Transport | HTTPS Only       | TLS for all connections                 |
| Cookies   | Secure Flags     | `Secure`, `HttpOnly`, `SameSite=Strict` |
| Tokens    | Short Expiry     | JWT expires in 1 hour                   |
| Tokens    | Refresh Rotation | New refresh token on each use           |

---

### AV-9: Insider Threat (Developer)

**Threat:** Developer accidentally exposes data or introduces vulnerability.

**Attack Path:**

```
Developer → Code change → Bypasses consent → Data exposure
```

**Mitigations:**

| Layer         | Control                 | Implementation                      |
| ------------- | ----------------------- | ----------------------------------- |
| CI            | Consent Violation Check | Blocks PRs with direct table access |
| CI            | Security Audit          | Dependency vulnerability scanning   |
| Code Review   | Required Reviews        | All changes require approval        |
| Documentation | Safety Access Layer     | Clear patterns to follow            |
| Testing       | Privacy Tests           | Automated consent enforcement tests |

**Evidence:**

- `docs/RLS_POLICY_SPECIFICATION.md` - Database access patterns
- `.github/workflows/ci.yml` - CI gates

---

## Data Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Player    │     │   Coach     │     │   Admin     │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────┐
│                   Angular Frontend                   │
│  • Displays consent status                          │
│  • Shows data state warnings                        │
│  • Guides to privacy settings                       │
└──────────────────────────┬──────────────────────────┘
                           │
                           │ JWT-authenticated requests
                           ▼
┌─────────────────────────────────────────────────────┐
│                  Netlify Functions                   │
│                                                      │
│  ┌─────────────────┐  ┌─────────────────────────┐   │
│  │ Auth Middleware │  │ ConsentDataReader       │   │
│  │ • Validate JWT  │  │ • Check consent         │   │
│  │ • Extract user  │  │ • Return dataState      │   │
│  │ • Rate limit    │  │ • Audit log             │   │
│  └────────┬────────┘  └────────────┬────────────┘   │
│           │                        │                 │
│           ▼                        ▼                 │
│  ┌─────────────────────────────────────────────┐    │
│  │           Business Logic                     │    │
│  │  • Player: Full access to own data          │    │
│  │  • Coach: Consent-filtered team data        │    │
│  │  • Admin: System operations only            │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────┘
                           │
                           │ Authenticated DB connection
                           ▼
┌─────────────────────────────────────────────────────┐
│                    Supabase                          │
│                                                      │
│  ┌─────────────────┐  ┌─────────────────────────┐   │
│  │   Auth Layer    │  │    PostgreSQL           │   │
│  │ • JWT verify    │  │ • RLS policies          │   │
│  │ • Session mgmt  │  │ • Consent views         │   │
│  │                 │  │ • Audit triggers        │   │
│  └─────────────────┘  └─────────────────────────┘   │
│                                                      │
│  Data Classification:                                │
│  🔴 Health data → health_sharing consent required   │
│  🟠 Performance → performance_sharing required      │
│  🟢 Profile → RLS (own data or team member)        │
└─────────────────────────────────────────────────────┘
```

---

## Risk Register

| ID  | Risk                           | Likelihood | Impact   | Current Controls                  | Residual Risk | Owner      |
| --- | ------------------------------ | ---------- | -------- | --------------------------------- | ------------- | ---------- |
| R1  | Coach views non-consented data | Low        | High     | Consent views, RLS, CI checks     | Low           | Backend    |
| R2  | AI processes opted-out user    | Low        | Medium   | Fail-fast, DB check               | Low           | AI Team    |
| R3  | Minor data exposed             | Low        | Critical | Parental consent flow             | Low           | Auth       |
| R4  | Data not deleted on request    | Low        | High     | Deletion queue, audit             | Low           | Data       |
| R5  | Credential compromise          | Medium     | High     | Leaked password check, rate limit | Medium        | Auth       |
| R6  | Developer bypasses consent     | Low        | High     | CI gates, code review             | Low           | DevOps     |
| R7  | SQL injection                  | Very Low   | Critical | Parameterized queries, RLS        | Very Low      | Backend    |
| R8  | Session hijacking              | Low        | High     | HTTPS, secure cookies             | Low           | Auth       |
| R9  | Audit trail gaps               | Low        | Medium   | Triggers, logging                 | Low           | Compliance |
| R10 | Third-party dependency vuln    | Medium     | Medium   | Dependency scanning               | Medium        | DevOps     |

---

## Residual Risks

### Accepted Risks

| Risk                      | Reason for Acceptance                    | Compensating Control     |
| ------------------------- | ---------------------------------------- | ------------------------ |
| No E2EE for health data   | Complexity vs. benefit for current scale | TLS + encryption at rest |
| Single-region deployment  | Cost constraints                         | Supabase managed backups |
| No HSM for key management | Enterprise feature not needed            | Supabase key management  |
| Basic audit logging       | Sufficient for current compliance needs  | Timestamps + user IDs    |

### Future Mitigations (Roadmap)

| Risk                 | Planned Mitigation              | Timeline      |
| -------------------- | ------------------------------- | ------------- |
| E2EE for health data | Evaluate client-side encryption | Q2 2025       |
| Multi-region         | EU-specific deployment          | When required |
| Enhanced audit       | IP/device tracking              | Q3 2025       |
| SOC 2 Type II        | Formal certification            | 2026          |

---

## Review Schedule

| Review Type         | Frequency           | Next Review   | Owner         |
| ------------------- | ------------------- | ------------- | ------------- |
| Threat Model Review | Quarterly           | March 2025    | Security Lead |
| Penetration Test    | Annually            | December 2025 | External      |
| Dependency Audit    | Monthly             | January 2025  | DevOps        |
| Access Review       | Quarterly           | March 2025    | Admin         |
| Incident Review     | After each incident | As needed     | Security Lead |

### Triggers for Ad-Hoc Review

- New feature involving sensitive data
- Privacy incident
- Significant architecture change
- New compliance requirement
- Third-party integration

---

## Related Documentation

| Document                                                     | Purpose                      |
| ------------------------------------------------------------ | ---------------------------- |
| [Security Guide](./SECURITY.md)                              | Security architecture        |
| [RLS Policy Specification](./RLS_POLICY_SPECIFICATION.md)    | Consent enforcement patterns |
| [Privacy Incident Runbook](./RUNBOOKS/PRIVACY_INCIDENT.md)   | Incident response            |
| [Data Safety Policy](./DATA_SAFETY_POLICY.md)                | Data handling rules          |
| [Adding New Features Safely](./ADDING_NEW_FEATURES_SAFELY.md)| Safe extension playbook      |

---

## Document History

| Version | Date              | Changes         | Author        |
| ------- | ----------------- | --------------- | ------------- |
| 1.0     | 29. December 2025 | Initial release | Security Team |

---

_Športno društvo Žabe - Athletes helping athletes since 2020_

# Privacy Controls Specification

## Document Purpose

This specification maps every privacy promise in `PRIVACY_POLICY.md` to concrete technical implementations. It serves as a contract between the legal document and the codebase.

**Source Document:** `docs/PRIVACY_POLICY.md` v1.0 (29. December 2025)
**Spec Version:** 1.0
**Last Updated:** 29. December 2025

---

## 1. Data Categories Matrix

*Source: PRIVACY_POLICY.md Section 2.1 "The Honest Breakdown"*

| Category | Data Fields | Storage Location | Legal Basis | Access Roles | Encryption |
|----------|-------------|------------------|-------------|--------------|------------|
| **Account Data** | `name`, `email`, `password_hash`, `created_at` | `auth.users` (Supabase Auth) | Contract Art. 6(1)(b) | User, DPO | At-rest + Transit |
| **Profile Data** | `age`, `position`, `experience_level`, `avatar_url` | `public.profiles` | Contract Art. 6(1)(b) | User, Coach (if team), DPO | At-rest + Transit |
| **Training Data** | `workouts`, `exercises`, `duration`, `intensity`, `rpe` | `public.training_sessions`, `public.exercises` | Legitimate Interest Art. 6(1)(f) | User, Coach (with consent), DPO | At-rest + Transit |
| **Wellness Data** | `sleep_hours`, `sleep_quality`, `energy`, `mood`, `soreness` | `public.wellness_entries` | Consent Art. 6(1)(a) | User, Coach (with consent), DPO | At-rest + Transit |
| **Health Data** | `injury_history`, `pain_reports`, `body_measurements` | `public.health_records` | Explicit Consent Art. 9(2)(a) | User, DPO only | At-rest + Transit + Field-level |
| **Nutrition Data** | `food_logs`, `meals`, `macros`, `hydration` | `public.nutrition_entries` | Legitimate Interest Art. 6(1)(f) | User, DPO | At-rest + Transit |
| **Team Data** | `team_id`, `role`, `coach_relationships` | `public.team_members`, `public.teams` | Consent Art. 6(1)(a) | User, Coach, Team Admin, DPO | At-rest + Transit |
| **Technical Data** | `device_type`, `app_version`, `crash_logs` | `public.app_logs` (anonymized) | Legitimate Interest Art. 6(1)(f) | DPO, Developers | At-rest + Transit |

### 1.1 Storage Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (Frankfurt, EU)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │   auth.users    │  │  storage.files  │                   │
│  │  (Auth schema)  │  │   (Avatars)     │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│  ┌────────▼────────────────────▼────────┐                   │
│  │           public schema               │                   │
│  │  ┌──────────┐ ┌──────────┐ ┌───────┐ │                   │
│  │  │ profiles │ │ training │ │ teams │ │                   │
│  │  └──────────┘ └──────────┘ └───────┘ │                   │
│  │  ┌──────────┐ ┌──────────┐ ┌───────┐ │                   │
│  │  │ wellness │ │ health   │ │ nutri │ │                   │
│  │  └──────────┘ └──────────┘ └───────┘ │                   │
│  └──────────────────────────────────────┘                   │
│                                                              │
│  Row Level Security (RLS) on ALL tables                     │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Access Role Definitions

| Role | Description | Data Access | Implementation |
|------|-------------|-------------|----------------|
| **User** | Individual athlete | Own data only | RLS: `auth.uid() = user_id` |
| **Coach** | Team coach/admin | Team members' data (with consent) | RLS: `team_id` + `consent_flags` |
| **Team Admin** | Team administrator | Team roster + aggregate data | RLS: `team_id` + `role = 'admin'` |
| **DPO** | Data Protection Officer | All data (for GDPR requests) | Superadmin flag + audit logging |
| **Developer** | App developers | Anonymized logs only | No PII access |

---

## 2. Consent Management

*Source: PRIVACY_POLICY.md Sections 2.1, 2.2, 7.8*

### 2.1 Consent Categories

| Consent Type | Data Affected | Default | Withdrawal Effect | UI Location |
|--------------|---------------|---------|-------------------|-------------|
| **Wellness Tracking** | Sleep, energy, mood, soreness | OFF | Features disabled, data deleted on request | Settings > Privacy |
| **Health Data** | Injuries, pain, body measurements | OFF | Injury risk features disabled | Settings > Privacy |
| **Team Sharing** | Performance data to coaches | OFF | Coach loses access immediately | Settings > Privacy > Team |
| **AI Processing** | All data for ML analysis | OFF | AI features disabled, manual mode only | Settings > Privacy > AI |
| **Analytics** | Anonymous usage patterns | OFF | No analytics collected | Cookie banner |

### 2.2 Consent Capture Implementation

**Database Schema:**

```sql
CREATE TABLE public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  consent_version TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_user_consent UNIQUE (user_id, consent_type)
);

-- Audit trail for consent changes
CREATE TABLE public.consent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  action TEXT NOT NULL, -- 'granted', 'withdrawn'
  old_value BOOLEAN,
  new_value BOOLEAN,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Service Implementation:**

| Module | File | Purpose |
|--------|------|---------|
| `ConsentService` | `core/services/consent.service.ts` | Manage consent state |
| `ConsentGuard` | `core/guards/consent.guard.ts` | Block features without consent |
| `ConsentBannerComponent` | `shared/components/consent-banner/` | Initial consent capture |
| `PrivacySettingsComponent` | `features/settings/privacy/` | Consent management UI |

### 2.3 Consent Withdrawal Flow

```
User clicks "Withdraw Consent"
         │
         ▼
┌─────────────────────────┐
│  Confirm Dialog         │
│  "This will disable..." │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  ConsentService         │
│  .withdrawConsent()     │
└───────────┬─────────────┘
            │
            ├──► Update user_consents table
            ├──► Log to consent_audit_log
            ├──► Trigger feature disablement
            └──► Show confirmation toast
```

---

## 3. Retention Enforcement

*Source: PRIVACY_POLICY.md Section 6 "How Long We Keep Your Data"*

### 3.1 Retention Periods

| Data Type | Retention Period | Trigger | Policy Reference |
|-----------|------------------|---------|------------------|
| Account Data | Until deletion + 30 days | Account deletion request | Section 6 |
| Training Data | Until account deletion | Account deletion request | Section 6 |
| Health Data | Until consent withdrawal OR account deletion | Consent withdrawal / deletion | Section 6 |
| Technical Logs | 1 year rolling | Automatic | Section 6 |
| Anonymized Analytics | Indefinite | N/A (not PII) | Section 6 |

### 3.2 Retention Enforcement Jobs

**Supabase Edge Functions / Scheduled Jobs:**

| Job Name | Schedule | Action | Implementation |
|----------|----------|--------|----------------|
| `cleanup-technical-logs` | Daily 03:00 UTC | Delete logs older than 1 year | Edge Function |
| `process-deletion-queue` | Every 15 minutes | Process pending account deletions | Edge Function |
| `anonymize-old-sessions` | Weekly Sunday 02:00 UTC | Anonymize training data >5 years | Edge Function |
| `consent-expiry-check` | Daily 04:00 UTC | Check for expired consents | Edge Function |

**Implementation:**

```typescript
// supabase/functions/cleanup-technical-logs/index.ts
Deno.serve(async () => {
  const supabase = createClient(/* ... */);
  
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  const { error } = await supabase
    .from('app_logs')
    .delete()
    .lt('created_at', oneYearAgo.toISOString());
  
  return new Response(JSON.stringify({ 
    success: !error,
    deleted_before: oneYearAgo.toISOString()
  }));
});
```

### 3.3 Retention Dashboard

| Metric | Query | Alert Threshold |
|--------|-------|-----------------|
| Pending deletions | `SELECT COUNT(*) FROM deletion_queue WHERE status = 'pending'` | > 10 |
| Overdue deletions | `SELECT COUNT(*) FROM deletion_queue WHERE requested_at < now() - interval '30 days'` | > 0 |
| Log volume | `SELECT pg_size_pretty(pg_total_relation_size('app_logs'))` | > 1GB |

---

## 4. Account Deletion Pipeline

*Source: PRIVACY_POLICY.md Sections 6, 7.3*

### 4.1 Deletion Types

| Type | Description | Data Affected | Timeline |
|------|-------------|---------------|----------|
| **Soft Delete** | Account marked for deletion, data retained temporarily | All user data | Immediate mark, 30-day hold |
| **Hard Delete** | Permanent removal of all PII | All user data except anonymized aggregates | After 30-day hold |

### 4.2 Deletion Pipeline

```
User requests deletion (Settings > Account > Delete)
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Soft Delete (Immediate)                            │
│  - Set profiles.deleted_at = now()                          │
│  - Set profiles.deletion_requested_at = now()               │
│  - Revoke all active sessions                               │
│  - Add to deletion_queue                                    │
│  - Send confirmation email                                  │
└─────────────────────────────────────────────────────────────┘
         │
         │  30 days
         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Hard Delete (Automated Job)                        │
│  - Delete from training_sessions                            │
│  - Delete from wellness_entries                             │
│  - Delete from health_records                               │
│  - Delete from nutrition_entries                            │
│  - Delete from team_members                                 │
│  - Delete from user_consents                                │
│  - Delete from profiles                                     │
│  - Delete from auth.users (via Supabase Admin API)          │
│  - Log to deletion_audit_log                                │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Verification                                       │
│  - Query all tables for user_id                             │
│  - Confirm zero rows returned                               │
│  - Update deletion_queue status = 'completed'               │
│  - Send deletion confirmation email                         │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Deletion Database Schema

```sql
CREATE TABLE public.deletion_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Don't FK, user may be deleted
  user_email TEXT NOT NULL, -- For confirmation email
  requested_at TIMESTAMPTZ DEFAULT now(),
  scheduled_deletion_at TIMESTAMPTZ DEFAULT now() + interval '30 days',
  status TEXT DEFAULT 'pending', -- pending, processing, completed, cancelled
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.deletion_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email_hash TEXT NOT NULL, -- SHA256 hash for audit without PII
  tables_deleted TEXT[] NOT NULL,
  rows_deleted JSONB NOT NULL, -- {"profiles": 1, "training_sessions": 45, ...}
  deleted_by TEXT NOT NULL, -- 'system' or admin user_id
  deleted_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.4 Cancellation Window

Users can cancel deletion within 30 days:

```typescript
// core/services/account.service.ts
async cancelDeletion(userId: string): Promise<boolean> {
  const { error } = await this.supabase
    .from('deletion_queue')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .eq('status', 'pending');
  
  if (!error) {
    await this.supabase
      .from('profiles')
      .update({ deleted_at: null, deletion_requested_at: null })
      .eq('id', userId);
  }
  
  return !error;
}
```

---

## 5. Age Verification (16+ Only)

*Source: PRIVACY_POLICY.md Section 9 "Age Requirements"*

### 5.1 Age Requirements

| Age Range | Access Level | Action |
|-----------|--------------|--------|
| 16+ | Full access | Self-consent at registration |
| Under 16 | No access | Registration blocked |

**This app does not support users under 16 years of age.**

### 5.2 Age Verification Flow

```
User attempts registration
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Registration Form                                           │
│  - User must check: "I confirm I am 16 years or older"      │
│  - User must accept Terms of Service and Privacy Policy      │
│  - Both checkboxes required to submit                        │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Validation                                                  │
│  - If age checkbox unchecked: Show error, block registration │
│  - If terms unchecked: Show error, block registration        │
│  - If both checked: Proceed with registration                │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Implementation

**Registration Form Fields:**
```typescript
registerForm = this.fb.group({
  name: ['', [Validators.required]],
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(8)]],
  confirmPassword: ['', [Validators.required]],
  ageVerification: [false, [Validators.requiredTrue]],  // Must be checked
  termsAccepted: [false, [Validators.requiredTrue]],    // Must be checked
});
```

### 5.4 Underage User Discovery

If we discover a user is under 16:
1. Account is immediately deactivated
2. Deletion request is automatically initiated
3. All PII is deleted within 30 days
4. Emergency medical records (if any) are retained per legal requirements

### 5.5 Legacy Parental Consent Tables

The `parental_consent` table exists in the database but is **not used** since the app is 16+ only. It may be removed in a future migration.

---

## 6. Data Export (Portability)

*Source: PRIVACY_POLICY.md Section 7.5*

### 6.1 Export Format

| Format | Use Case | Implementation |
|--------|----------|----------------|
| JSON | Machine-readable, API integration | Primary format |
| CSV | Spreadsheet analysis | Alternative format |

### 6.2 Export Contents

```json
{
  "export_metadata": {
    "user_id": "uuid",
    "exported_at": "2025-01-01T00:00:00Z",
    "format_version": "1.0",
    "data_controller": "Športno društvo Žabe"
  },
  "profile": { /* ... */ },
  "training_sessions": [ /* ... */ ],
  "wellness_entries": [ /* ... */ ],
  "health_records": [ /* ... */ ],
  "nutrition_entries": [ /* ... */ ],
  "team_memberships": [ /* ... */ ],
  "consents": [ /* ... */ ]
}
```

### 6.3 Export Implementation

```typescript
// core/services/data-export.service.ts
@Injectable({ providedIn: 'root' })
export class DataExportService {
  async exportUserData(userId: string, format: 'json' | 'csv'): Promise<Blob> {
    const data = await this.gatherAllUserData(userId);
    
    if (format === 'json') {
      return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    } else {
      return this.convertToCSV(data);
    }
  }
  
  private async gatherAllUserData(userId: string) {
    const [profile, training, wellness, health, nutrition, teams, consents] = 
      await Promise.all([
        this.supabase.from('profiles').select('*').eq('id', userId).single(),
        this.supabase.from('training_sessions').select('*').eq('user_id', userId),
        this.supabase.from('wellness_entries').select('*').eq('user_id', userId),
        this.supabase.from('health_records').select('*').eq('user_id', userId),
        this.supabase.from('nutrition_entries').select('*').eq('user_id', userId),
        this.supabase.from('team_members').select('*, teams(*)').eq('user_id', userId),
        this.supabase.from('user_consents').select('*').eq('user_id', userId),
      ]);
    
    return {
      export_metadata: {
        user_id: userId,
        exported_at: new Date().toISOString(),
        format_version: '1.0',
        data_controller: 'Športno društvo Žabe'
      },
      profile: profile.data,
      training_sessions: training.data,
      wellness_entries: wellness.data,
      health_records: health.data,
      nutrition_entries: nutrition.data,
      team_memberships: teams.data,
      consents: consents.data
    };
  }
}
```

---

## 7. Required Code Modules

### 7.1 Services to Create/Update

| Module | Status | Priority | Description |
|--------|--------|----------|-------------|
| `ConsentService` | 🔴 Create | P0 | Consent management |
| `DataExportService` | 🔴 Create | P0 | GDPR data export |
| `AccountDeletionService` | 🔴 Create | P0 | Account deletion pipeline |
| `ParentalConsentService` | 🔴 Create | P1 | Minor consent workflow |
| `RetentionService` | 🔴 Create | P1 | Data retention enforcement |
| `PrivacyAuditService` | 🔴 Create | P1 | Audit logging |
| `CookieConsentService` | 🟢 Exists | - | Cookie preferences |

### 7.2 Database Migrations Required

| Migration | Priority | Tables Affected |
|-----------|----------|-----------------|
| `create_consent_tables` | P0 | `user_consents`, `consent_audit_log` |
| `create_deletion_tables` | P0 | `deletion_queue`, `deletion_audit_log` |
| `create_parental_tables` | P1 | `parental_consents`, `parent_minor_links` |
| `add_profile_deletion_fields` | P0 | `profiles` |
| `add_rls_policies` | P0 | All tables |

### 7.3 Edge Functions Required

| Function | Schedule | Priority |
|----------|----------|----------|
| `cleanup-technical-logs` | Daily | P1 |
| `process-deletion-queue` | Every 15 min | P0 |
| `send-consent-reminders` | Daily | P2 |
| `parental-consent-expiry` | Daily | P1 |

### 7.4 UI Components Required

| Component | Location | Priority |
|-----------|----------|----------|
| `PrivacySettingsComponent` | `features/settings/privacy/` | P0 |
| `ConsentBannerComponent` | `shared/components/` | P0 |
| `DataExportComponent` | `features/settings/privacy/` | P0 |
| `AccountDeletionComponent` | `features/settings/account/` | P0 |
| `ParentalConsentFormComponent` | `features/auth/` | P1 |
| `ParentPortalComponent` | `features/parent-portal/` | P1 |

---

## 8. Compliance Checklist

| Requirement | Policy Section | Implementation Status | Notes |
|-------------|----------------|----------------------|-------|
| Consent capture | 2.1, 2.2 | 🔴 Not implemented | Need ConsentService |
| Consent withdrawal | 7.8 | 🔴 Not implemented | Need UI + service |
| Data access (export) | 7.1, 7.5 | 🔴 Not implemented | Need DataExportService |
| Data rectification | 7.2 | 🟡 Partial | Profile edit exists |
| Data erasure | 7.3 | 🔴 Not implemented | Need deletion pipeline |
| Data portability | 7.5 | 🔴 Not implemented | Need export service |
| Right to object | 7.6 | 🔴 Not implemented | Need consent toggles |
| Automated decisions | 7.7 | 🟡 Partial | AI opt-out exists |
| Parental consent | 9 | 🔴 Not implemented | Need full workflow |
| Retention enforcement | 6 | 🔴 Not implemented | Need scheduled jobs |
| Breach notification | 8.3 | 🔴 Not implemented | Need incident process |

---

**Document Version:** 1.0
**Created:** 29. December 2025
**Owner:** DPO (Aljoša Kous)
**Review Cycle:** Quarterly


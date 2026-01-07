# Athlete Data Ownership & Export Contract — v1

**Contract Version:** 1.0  
**Date:** 2026-01-06  
**Status:** Normative (Binding)  
**Scope:** Athlete data ownership, export rights, deletion boundaries, and portability — all platforms  
**Maintained By:** Product Architecture + Engineering + Legal  
**Supersedes:** None

**Dependencies (MUST Be Compatible With):**
- Data Consent & Visibility Contract v1 (STEP_2_5)
- Authorization & Guardrails Contract v1
- Session Lifecycle Authority Contract v1
- Coach Authority & Visibility Contract v1 (CONTRACT_2.4)

---

## SECTION 1 — Scope + Definitions

### 1.1 Scope

This contract defines **athlete ownership rights** over their personal data, including:
- What data athletes own
- What data cannot be deleted (legal retention)
- Export formats and requirements
- Deletion vs anonymization rules
- Coach notes inclusion in exports
- Audit log visibility
- Portability requirements

This contract does NOT govern:
- Coach visibility (see Data Consent & Visibility Contract v1)
- System authorization (see Authorization & Guardrails Contract v1)
- Session immutability (see Session Lifecycle Authority Contract v1)

### 1.2 Definitions

#### Athlete-Owned Data
Data that the athlete has exclusive right to view, export, and delete (subject to legal retention). Includes: wellness check-ins, training logs, readiness scores, ACWR metrics, pain reports, Merlin conversations.

#### System-Owned Data
Data that the system retains for legal, audit, or safety purposes. Includes: audit logs, coach action logs, safety trigger events, session completion records (for ACWR calculation).

#### Coach-Authored Data
Data created by coaches. Includes: coach notes, session modifications, program assignments. Athletes have read access but not deletion authority over coach-authored content.

#### Deletion
Permanent removal of athlete data from active system. Deletion triggers anonymization for legal retention periods.

#### Anonymization
Removal of personally identifiable information while retaining data structure for legal/audit purposes. Anonymized data cannot be linked to athlete identity.

#### Export
Generation of athlete data in portable format (JSON, CSV, PDF) for athlete download or transfer to another system.

---

## SECTION 2 — Athlete Data Ownership

### 2.1 Athlete-Owned Data Categories

Athletes own the following data categories:

| Data Category | Ownership | Deletion Rights | Export Rights |
|---------------|-----------|-----------------|---------------|
| Wellness Check-ins | Full ownership | YES (subject to retention) | YES (all formats) |
| Readiness Scores | Full ownership | YES (subject to retention) | YES (all formats) |
| Training Logs | Full ownership | YES (subject to retention) | YES (all formats) |
| RPE Data | Full ownership | YES (subject to retention) | YES (all formats) |
| ACWR Metrics | Full ownership | YES (subject to retention) | YES (all formats) |
| Pain Reports | Full ownership | YES (subject to retention) | YES (all formats) |
| Merlin Conversations | Full ownership | YES (subject to retention) | YES (all formats) |
| Freeform Comments | Full ownership | YES (subject to retention) | YES (all formats) |
| Profile Data | Full ownership | YES (subject to retention) | YES (all formats) |

### 2.2 Coach-Authored Data (Read-Only for Athletes)

Athletes have **read access** but **not deletion authority** over:

| Data Category | Athlete Access | Deletion Rights |
|---------------|----------------|-----------------|
| Coach Notes | YES (if opt-in enabled) | NO (coach retains ownership) |
| Session Modifications | YES (attribution visible) | NO (audit trail requirement) |
| Program Assignments | YES (view only) | NO (coach program ownership) |
| Coach Action Logs | YES (who modified what, when) | NO (audit requirement) |

**Rationale:** Coach-authored content belongs to the coach. Athletes can view but cannot delete coach decisions or notes.

### 2.3 System-Owned Data (Audit Only)

Athletes have **read access** but **not deletion authority** over:

| Data Category | Athlete Access | Deletion Rights |
|---------------|----------------|-----------------|
| Audit Logs | YES (own data access logs) | NO (legal requirement) |
| Safety Trigger Events | YES (when triggered) | NO (liability protection) |
| Session Completion Records | YES (for ACWR calculation) | NO (data integrity) |

**Rationale:** System retains audit logs for legal compliance and liability protection. Deletion would compromise accountability.

---

## SECTION 3 — Deletion Boundaries

### 3.1 What CAN Be Deleted

Athletes MAY request deletion of:
- Individual wellness check-ins (if not part of ACWR baseline)
- Individual training logs (if not part of ACWR calculation)
- Freeform comments
- Profile data (name, email, etc.)
- Merlin conversations

**Deletion Process:**
1. Athlete requests deletion via Profile → Privacy & Data → Delete Data
2. System confirms deletion scope
3. System deletes data immediately (if not subject to retention)
4. System anonymizes data (if subject to retention)
5. System logs deletion in audit trail

### 3.2 What CANNOT Be Deleted

Athletes MUST NOT delete:
- Session completion records (required for ACWR calculation)
- Safety trigger events (required for liability protection)
- Coach action logs (required for audit)
- Audit logs (required for legal compliance)
- Rehab protocol records (required for medical history)

**Rationale:** Legal retention requirements and data integrity. Deletion would compromise ACWR accuracy, liability protection, and audit trail.

### 3.3 Account Deletion Rules

When athlete deletes account:

**Immediate Actions:**
- Deactivate account (login disabled)
- Anonymize athlete identity (name → "Deleted User", email → anonymized)
- Retain data structure for legal retention period

**Retention Periods:**
- **Active Athlete:** 7 years post-deletion
- **Minor Athlete:** Until age 25 or 7 years post-deletion (whichever is longer)
- **Medical Data:** 60 months (rehab protocols, pain reports)
- **Audit Logs:** 7 years (legal compliance)

**After Retention Period:**
- Permanently delete anonymized data
- Cannot be recovered

---

## SECTION 4 — Export Formats & Requirements

### 4.1 Supported Export Formats

Athletes MAY export data in the following formats:

| Format | Use Case | Contents |
|--------|----------|----------|
| JSON | Machine-readable, API integration | Complete data structure with metadata |
| CSV | Spreadsheet analysis | Tabular data (check-ins, logs, metrics) |
| PDF | Human-readable report | Formatted report with charts and summaries |

### 4.2 Export Contents (JSON)

JSON export MUST include:

```json
{
  "export_metadata": {
    "athlete_id": "uuid",
    "export_date": "ISO 8601",
    "export_format": "json",
    "data_range": {
      "start_date": "ISO 8601",
      "end_date": "ISO 8601"
    }
  },
  "wellness_checkins": [...],
  "readiness_scores": [...],
  "training_logs": [...],
  "acwr_metrics": [...],
  "pain_reports": [...],
  "merlin_conversations": [...],
  "coach_notes": [...],
  "session_modifications": [...],
  "audit_logs": [...]
}
```

### 4.3 Export Contents (CSV)

CSV export MUST include separate files:
- `wellness_checkins.csv` — Check-in data (date, sleep, stress, soreness, mood, energy, readiness)
- `training_logs.csv` — Session data (date, session_type, duration, sets, reps, load, RPE)
- `acwr_metrics.csv` — Load data (date, acute_load, chronic_load, acwr)
- `pain_reports.csv` — Pain data (date, score, location, trend)
- `coach_notes.csv` — Coach notes (date, coach_name, note_content, priority)

### 4.4 Export Contents (PDF)

PDF export MUST include:
- Executive summary (readiness trend, ACWR summary, compliance stats)
- Wellness check-in history (table format)
- Training log history (table format)
- ACWR trend chart
- Coach notes (if athlete has opt-in enabled)
- Session modification history (attribution)

### 4.5 Coach Notes Inclusion Rules

Coach notes MUST be included in export **only if**:
- Athlete has opt-in enabled ("Share coach notes with me")
- Coach note is visible to athlete (not hidden)
- Coach note is not marked as "coach-private"

Coach notes MUST NOT be included if:
- Athlete has not opted in
- Coach note is marked as "coach-private"
- Coach note contains sensitive information (system filters)

**Rationale:** Coach notes belong to coach. Athletes can export only what they have permission to view.

---

## SECTION 5 — Audit Log Visibility

### 5.1 What Athletes Can View

Athletes MAY view audit logs for their own data:

| Log Type | Athlete Access | Contents |
|----------|----------------|----------|
| Data Access Logs | YES | Who viewed their data (role, timestamp) |
| Consent Change Logs | YES | When consent settings changed |
| Safety Trigger Logs | YES | When safety triggers fired, who was notified |
| Deletion Logs | YES | When data was deleted, what was deleted |

### 5.2 What Athletes Cannot View

Athletes MUST NOT view:
- Other athletes' audit logs
- Admin access logs (system integrity)
- Coach action logs for other athletes
- System-generated audit events (internal only)

### 5.3 Audit Log Export

Athletes MAY export their audit logs in JSON or CSV format. Export includes:
- Data access events (who viewed what, when)
- Consent changes (what changed, when)
- Safety triggers (what triggered, who was notified)
- Deletion events (what was deleted, when)

---

## SECTION 6 — Portability Requirements

### 6.1 Data Portability Rights

Athletes have the right to:
- Export all owned data in machine-readable format (JSON)
- Transfer data to another system
- Request data deletion after export
- Receive data in standard formats (JSON, CSV, PDF)

### 6.2 Transfer Format Standards

Exports MUST comply with:
- **JSON:** RFC 8259 (JSON standard)
- **CSV:** RFC 4180 (CSV standard)
- **PDF:** ISO 32000 (PDF standard)

### 6.3 API Access for Portability

Athletes MAY access data via API for programmatic export:
- OAuth 2.0 authentication required
- Rate limiting: 100 requests/hour
- Pagination required for large datasets
- API returns JSON format only

---

## SECTION 7 — Legal Retention Constraints

### 7.1 Retention Periods (Non-Negotiable)

| Data Type | Retention Period | Rationale |
|-----------|------------------|-----------|
| Session Completion Records | Lifetime of account + 7 years | ACWR calculation requires history |
| Safety Trigger Events | Lifetime of account + 7 years | Liability protection |
| Audit Logs | 7 years | Legal compliance (GDPR, HIPAA) |
| Rehab Protocol Records | 60 months | Medical history requirement |
| Coach Action Logs | Lifetime of account + 7 years | Accountability and liability |
| Wellness Check-ins | 12 months (active), 7 years (deleted) | Trend analysis, legal retention |
| Training Logs | 24 months (active), 7 years (deleted) | ACWR calculation, legal retention |

### 7.2 Minor Athlete Retention

For athletes under 18:
- Retention extends until age 25 or 7 years post-deletion (whichever is longer)
- Parent/guardian may request deletion on behalf of minor
- Medical data retention: 60 months (non-negotiable)

### 7.3 Deletion vs Anonymization

**Deletion:** Permanent removal (allowed only after retention period)

**Anonymization:** Removal of PII while retaining data structure (required during retention period)

**Anonymization Process:**
- Replace `athlete_id` with anonymized identifier
- Replace `name` with "Deleted User"
- Replace `email` with anonymized hash
- Retain data structure (dates, values, relationships)

---

## SECTION 8 — Forbidden Patterns (Hard Bans)

### 8.1 Hard Bans (10 Required)

#### Ban 1: Deleting Session Completion Records
**Forbidden:** Athlete deleting session completion records that are part of ACWR calculation.

**Enforcement:** Backend MUST reject deletion if record is required for ACWR baseline or calculation.

**Rationale:** Data integrity. ACWR requires complete history.

---

#### Ban 2: Deleting Safety Trigger Events
**Forbidden:** Athlete deleting safety trigger events (pain >3, ACWR danger, etc.).

**Enforcement:** Backend MUST reject deletion. Safety triggers are immutable.

**Rationale:** Liability protection. Safety events must be auditable.

---

#### Ban 3: Deleting Coach-Authored Content
**Forbidden:** Athlete deleting coach notes or session modifications.

**Enforcement:** Backend MUST reject deletion. Coach-authored content belongs to coach.

**Rationale:** Coach ownership. Athletes can view but not delete coach decisions.

---

#### Ban 4: Exporting Other Athletes' Data
**Forbidden:** Athlete exporting teammate or other athlete data.

**Enforcement:** Backend MUST validate athlete ownership before export. Return 403 Forbidden if unauthorized.

**Rationale:** Privacy protection. Exports are athlete-specific only.

---

#### Ban 5: Exporting Deleted Account Data
**Forbidden:** Exporting data for deleted accounts (unless anonymized audit logs).

**Enforcement:** Backend MUST return 404 Not Found for deleted accounts.

**Rationale:** Privacy protection. Deleted accounts are anonymized.

---

#### Ban 6: Modifying Exported Data Structure
**Forbidden:** System modifying export structure to hide or exclude data.

**Enforcement:** Exports MUST include all athlete-owned data. No filtering or exclusion allowed.

**Rationale:** Portability rights. Athletes must receive complete data.

---

#### Ban 7: Charging for Exports
**Forbidden:** System charging fees for data export or portability.

**Enforcement:** Exports MUST be free and unlimited for athletes.

**Rationale:** Legal requirement (GDPR, CCPA). Portability is a right, not a service.

---

#### Ban 8: Delaying Export Requests
**Forbidden:** System delaying export requests beyond 30 days.

**Enforcement:** Exports MUST be generated within 30 days of request.

**Rationale:** Legal requirement (GDPR). Timely portability is mandatory.

---

#### Ban 9: Anonymizing Before Retention Period
**Forbidden:** System anonymizing data before legal retention period expires.

**Enforcement:** Data MUST remain identifiable during retention period. Anonymization only after retention expires.

**Rationale:** Legal compliance. Retention periods are non-negotiable.

---

#### Ban 10: Recovering Deleted Data After Retention
**Forbidden:** System recovering or restoring deleted data after retention period expires.

**Enforcement:** Deleted data MUST be permanently removed after retention period. No recovery possible.

**Rationale:** Privacy protection. Deletion must be permanent.

---

## SECTION 9 — Conflict Resolution Rules

### 9.1 When Deletion Conflicts with Retention

If athlete requests deletion but data is subject to retention:

**Resolution:**
1. System MUST anonymize data immediately (remove PII)
2. System MUST retain anonymized data for retention period
3. System MUST notify athlete: "Data anonymized. Will be permanently deleted after [retention period]."
4. System MUST log anonymization in audit trail

### 9.2 When Export Conflicts with Privacy

If athlete requests export but data includes coach notes (without opt-in):

**Resolution:**
1. System MUST exclude coach notes from export (athlete has no permission to view)
2. System MUST notify athlete: "Coach notes excluded. Enable 'Share coach notes' to include in export."
3. System MUST export all other athlete-owned data

---

## SECTION 10 — Acceptance Criteria + QA Checklist

### 10.1 Deterministic Output Criteria

Given identical input state, export/deletion system MUST produce:
- [ ] Identical export contents (same data included/excluded)
- [ ] Identical deletion behavior (same data deleted/retained)
- [ ] Identical anonymization process (same PII removed)

### 10.2 Functional QA Checklist

| Test Case | Expected Result | Pass/Fail |
|-----------|-----------------|-----------|
| Athlete exports JSON | All owned data included | |
| Athlete exports CSV | Separate files for each category | |
| Athlete exports PDF | Formatted report with charts | |
| Athlete deletes wellness check-in | Deletion succeeds (if not in ACWR baseline) | |
| Athlete deletes session completion | Deletion rejected (required for ACWR) | |
| Athlete deletes coach note | Deletion rejected (coach-owned) | |
| Athlete deletes account | Account anonymized, data retained for 7 years | |
| Athlete views audit logs | Own data access logs visible | |
| Athlete exports after opt-in | Coach notes included in export | |
| Athlete exports without opt-in | Coach notes excluded from export | |

---

## Appendix A — Document Metadata

**Maintained By:** Product Architecture + Engineering + Legal  
**Enforcement:** All data ownership implementations MUST comply exactly  
**Testing:** QA must verify all export formats and deletion boundaries  
**Review Cycle:** Quarterly or on contract breach  
**Audit:** Non-compliance is system failure requiring immediate remediation

**Related Documents:**
- Data Consent & Visibility Contract v1 (STEP_2_5)
- Authorization & Guardrails Contract v1
- Session Lifecycle Authority Contract v1
- Coach Authority & Visibility Contract v1 (CONTRACT_2.4)

**Version History:**
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-06 | Initial athlete data ownership contract | Product Architecture + Legal |

---

## End of Document

**This contract is law. Data ownership implementations that deviate are system failures.**


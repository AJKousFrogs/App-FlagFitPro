# Knowledge Base Changelog

All notable changes to the knowledge base schema and content are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-02-10

### Changed (Calf & Achilles evidence upgrade)

- **A** Removed 10% rule: load changes individualized; no proven weekly threshold (systematic reviews, ACWR inconclusive)
- **B** Softened asymmetry claims: 10–15% commonly used but often arbitrary; prefer MDC, individual baselines, context (systematic review 2022)
- **C** Corrected RTP days: AFL registry soleus ~25.4 ± 16.2, gastrocnemius ~19.1 ± 14.1 (replaced outdated 7.7 days)
- **D** Reframed isometrics: tolerated loading/strength stimulus; immediate analgesia not reliable (van der Vlist 2020, BMJ Open SEM)
- **E** Progressive loading over eccentrics: HSR and eccentrics both effective; choose by preference/adherence (Beyer 2015, JOSPT CPG)
- **F** Multidomain RTS criteria: strength + function + sport-specific + symptom response (JOSPT CPG); removed >90% strength-only
- **G** VISA-A caution: Rasch/COSMIN validity concerns; consider newer instruments (JOSPT CPG)
- **H** Assessment: MDC for interpretation; reliability depends on joint position/setup (IJSPS 2024)

---

## [1.0.0] - 2026-02-10

### Added

- **Schema governance**
  - JSON Schema (Draft-07) at `database/schemas/knowledge_base.schema.json`
  - `schema_version` and `content_version` (SemVer) on all documents
  - CI validation via `npm run validate:knowledge`
  - Secret scanning via `npm run scan:knowledge-secrets`

- **Provenance and traceability**
  - `document_id` (URN UUID) per document for referential integrity
  - `entry_id` (URN UUID) per knowledge base entry
  - `generated_at` (RFC 3339) timestamp
  - `reviewed_at` (optional) for audit trail

- **Rights and licensing**
  - `rights` block on all documents:
    - `licence_expression` (SPDX or LicenseRef-Proprietary)
    - `permitted_use` (internal_only, attribution_required, etc.)
    - `attribution` (title, publisher, source_url, authors)

- **Data quality**
  - `quantitative_claims` array for machine-verifiable thresholds (asymmetry %, strength %, ACWR ranges, etc.)
  - `evidence_framework: "GRADE"` for evidence/consensus interpretation

- **Upgrade script**
  - `database/scripts/upgrade-knowledge-json.mjs` for reproducible upgrades

### Changed

- All 9 knowledge JSON files upgraded to v1.0.0 schema

### Backward compatibility

- New fields are additive; existing consumers can ignore them
- `entry_id` and `document_id` are stable (deterministic from content)
- MAJOR version bump only when breaking changes (renames, required field additions)

---

## Version policy

- **MAJOR**: Breaking changes (field renames, removal, stricter required)
- **MINOR**: New optional fields, new entry types
- **PATCH**: Content-only updates, typo fixes, additional quantitative_claims

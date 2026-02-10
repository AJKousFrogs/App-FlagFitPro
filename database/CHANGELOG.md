# Knowledge Base Changelog

All notable changes to the knowledge base schema and content are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

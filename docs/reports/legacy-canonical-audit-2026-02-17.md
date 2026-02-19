# Legacy to Canonical Audit (2026-02-17)

## Decision

Canonical SQL migration source of truth is:
- `supabase/migrations`

Legacy archive (non-canonical):
- `database/migrations`

## Current State

- `supabase/migrations`: 41 SQL files
- `database/migrations`: 103 SQL files
- Exact filename overlaps: 0
- Exact normalized SQL content overlaps: 0
- Table-name overlaps in `CREATE TABLE`: 6
  - `chatbot_user_context`
  - `knowledge_base_governance_log`
  - `user_notification_preferences`
  - `nutrition_logs`
  - `nutrition_goals`
  - `physical_measurements`

## Consolidation Outcome

- Keep `supabase/migrations` as the only default execution chain.
- Keep `database/migrations` as archive-only for historical/one-off recovery.
- Do not delete legacy files yet; there is no exact duplicate set safe for blind deletion.

## Legacy Refactor Candidates

The legacy chain contains 23 forked sequence numbers (same numeric prefix, multiple files).
These indicate historical branch/merge drift and are strong candidates to consolidate into
single canonical timestamped migrations only if still operationally required.

Examples:
- `033*` readiness and analytics split (`033`, `033a`, `033b`)
- `046*` ACWR fix variants (`046`, `046a`)
- `071*` consent and exercise-registry split
- `072*`, `073*`, `074*`, `075*` mixed feature/performance tracks
- `101*`, `102*`, `104*`, `105*` mixed domain tracks

## Refactors Applied

- Updated active docs/scripts to point to `supabase/migrations`.
- Updated health checks and validators to count/check `supabase/migrations`.
- Added archive boundary documentation at `database/migrations/README.md`.

## Remaining Legacy References (Intentional)

- `scripts/run-migration-direct.js` and `scripts/run-upgrade-migration.sh` keep legacy compatibility for one-off historical migrations.
- These should be retired only after those one-off migrations are either:
  - recreated as idempotent canonical migrations in `supabase/migrations`, or
  - no longer needed operationally.

# Supabase Backend Audit Summary (2026-02-17)

## Scope
- SQL source audit across `supabase/migrations`, `database/migrations`, and `database/*.sql`.
- Backend static audits for RLS boundaries, DB resilience, and rate-limit coverage.
- Live connectivity and table presence checks against project `grfjmnjpzvknmsxrwesx`.

## Key Findings
1. Migration source-of-truth drift:
- Active chain exists in `supabase/migrations` (41 files).
- Legacy chain exists in `database/migrations` (103 files).
- Old runner scripts were pinned to legacy migrations and omitted modern Supabase migrations.

2. High-risk SQL issue fixed:
- `supabase/migrations/20260111_fix_physical_measurements.sql` previously used `DROP TABLE ... CASCADE` (data-loss risk on re-run).
- Now non-destructive and idempotent.

3. Function security hardening:
- Added explicit `SET search_path` where needed in active Supabase migration files.
- Added forward-only hardening migration for already-deployed environments.

4. Backend audit tooling bug fixed:
- Rate-limit audit produced false positives when shorthand object syntax was used (`rateLimitType,`).
- Detection logic now recognizes both `rateLimitType:` and `rateLimitType,`.

5. Live database status (service-key checks):
- Connection OK.
- Known-table probe found only 19 core tables and many expected feature tables absent from schema cache.
- Indicates migration coverage gap between repository SQL and current deployed schema.

## Consolidation Recommendations
1. Treat `supabase/migrations` as canonical migration chain for execution.
2. Keep `database/migrations` as legacy/reference only, and do not execute both chains in the same environment by default.
3. Continue using idempotent migration patterns:
- `CREATE ... IF NOT EXISTS`
- `DROP POLICY IF EXISTS` before `CREATE POLICY`
- Explicit `SET search_path` on `SECURITY DEFINER` functions
4. Avoid destructive DDL in regular migrations unless accompanied by explicit backup + rollback strategy.

## What Was Changed
- Updated SQL migrations:
  - `supabase/migrations/20260111_fix_physical_measurements.sql`
  - `supabase/migrations/20260111_create_nutrition_tables.sql`
  - `supabase/migrations/20260117_remove_wellness_defaults.sql`
  - `supabase/migrations/20260217000000_database_hardening_cleanup.sql` (new)
- Updated migration orchestration:
  - `scripts/run-all-migrations-supabase.sh`
  - `scripts/run-migrations-via-api.js`
- Added SQL audit tooling:
  - `scripts/audit-sql-migrations.js`
  - `package.json` script: `db:audit:sql`
- Fixed backend audit false positives:
  - `scripts/audit-rate-limit-coverage.js`
  - `scripts/audit-rls-boundaries.js`

## Migration Execution Artifacts
- `database/migration_results/migration_execution_plan_20260217_094741.txt`
- `database/migration_results/migration_plan_2026-02-17T08-47-41-495Z.txt`
- `database/migration_results/mcp_chunks/mcp_chunk_2026-02-17T08-47-41-495Z.sql`

## Notes on MCP Execution
- In this runtime, MCP SQL execution endpoints were not exposed through the tool API.
- A ready-to-run MCP SQL bundle was generated for direct execution in Supabase SQL Editor / MCP SQL runner.

# UPGRADE_CHANGESETS

Date: 2026-02-21

## PR-1: Security Secret-Hygiene Hardening

### What changed
- Removed hardcoded key literals and switched to env-driven injection in:
  - `scripts/inject-env-into-html-angular.js`
  - `scripts/update-env-file.js`
  - `scripts/verify-new-supabase.js`
  - `scripts/build-angular.sh`
  - `scripts/run-upgrade-migration.sh`
  - `.env.example`
  - `.env.netlify`

### Why
- Prevent credential leakage and eliminate stale/static secret fallbacks.

### How verified
1. `npm run lint` -> PASS
2. `npm run type-check` -> PASS
3. `npm run test:unit` -> PASS (`37 files`, `799 passed`)
4. `npm run build` -> PASS
5. `npm run test:e2e:smoke` -> PASS (`9 passed`)

## PR-2: CI/CD Runtime & Workflow Correctness

### What changed
- Updated Node version alignment and workflow correctness:
  - `.github/workflows/release.yml`
    - `NODE_VERSION` to `22`
    - fixed `security:dependency-check` -> `security:check`
  - `.github/workflows/scheduled.yml`
    - `NODE_VERSION` to `22`
  - `.github/workflows/ci.yml`
    - fixed `::ng-deep` scan path from `angular/src` to `src` inside angular working dir
  - `.github/workflows/e2e-tests.yml`
    - added explicit `cache-dependency-path` for root + angular lockfiles
  - `.github/workflows/mobile-responsive.yml`
    - added explicit `cache-dependency-path` for root + angular lockfiles

### Why
- Keep CI runtime consistent with engine policy, avoid false CI failures, and improve cache determinism.

### How verified
1. `npm run lint` -> PASS
2. `npm run type-check` -> PASS
3. `npm run test:unit` -> PASS (`37 files`, `799 passed`)
4. `npm run build` -> PASS
5. `npm run test:e2e:smoke` -> PASS (`9 passed`)

## PR-3: Tooling Single Source of Truth

### What changed
- Standardized Angular package-manager metadata to npm:
  - `angular/package.json` -> `"packageManager": "npm@11.4.2"`
- Removed conflicting stale lockfile:
  - deleted `angular/pnpm-lock.yaml`
- Consolidated duplicate root ESLint override block:
  - `eslint.config.js`

### Why
- Reduce dependency-tree ambiguity and maintenance drift from duplicate config blocks.

### How verified
1. `npm run lint` -> PASS
2. `npm run type-check` -> PASS
3. `npm run test:unit` -> PASS (`37 files`, `799 passed`)
4. `npm run build` -> PASS
5. `npm run test:e2e:smoke` -> PASS (`9 passed`)

## PR-4: Supabase Performance Quick Win

### What changed
- Added idempotent migration:
  - `supabase/migrations/20260221171000_add_kb_merlin_approved_by_fk_covering_index.sql`

### Why
- Address live Supabase advisor warning for unindexed FK on `knowledge_base_entries.kb_merlin_approved_by_fkey`.

### How verified
1. `npm run lint` -> PASS
2. `npm run type-check` -> PASS
3. `npm run test:unit` -> PASS (`37 files`, `799 passed`)
4. `npm run build` -> PASS
5. `npm run test:e2e:smoke` -> PASS (`9 passed`)
6. `npm run db:audit:sql` -> PASS (migration inventory updated)
7. `npm run audit:rls-boundaries` -> PASS (no severe issues)

## Deferred (safe defaults)

1. Dependency patch/minor upgrades (`npm outdated` / `npm audit`) are deferred due registry connectivity failures (`ENOTFOUND registry.npmjs.org`) in current environment.
2. Supabase auth leaked-password protection is a dashboard/project setting and should be enabled outside source code.
3. RLS initplan policy rewrites are intentionally deferred to a dedicated DB-policy PR due behavior sensitivity.


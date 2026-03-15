# UPGRADE_PLAN

Date: 2026-02-21

## Approach
- Backward-compatible changes first.
- No business-logic changes unless behavior is preserved and validated.
- After each implementation step: run `lint -> type-check -> test:unit -> build -> test:e2e:smoke`.

## Track A - Security & Compliance (Fast)

1. Remove hardcoded credentials/tokens from scripts and example env files
- Risk: Medium
- Files:
  - `.env.example`
  - `.env.netlify`
  - `scripts/inject-env-into-html-angular.js`
  - `scripts/update-env-file.js`
  - `scripts/verify-new-supabase.js`
  - `scripts/build-angular.sh`
  - `scripts/run-upgrade-migration.sh`
- Verification:
  - `npm run lint`
  - `npm run type-check`
  - `npm run test:unit`
  - `npm run build`
  - `npm run test:e2e:smoke`

2. Strengthen secret-handling diagnostics (mask sensitive values)
- Risk: Low
- Files:
  - `scripts/inject-env-into-html-angular.js`
  - `scripts/test-supabase-connection.js` (if needed)
- Verification: same gate sequence

3. Supabase auth security hardening follow-up
- Risk: Medium
- Files: Supabase dashboard setting + docs note in repo
- Verification:
  - `mcp__supabase__get_advisors type=security` returns no leaked-password warning

## Track B - Tooling/Build/CI Best Practices (Safe Refactors)

1. Unify CI Node version with app engine policy (Node 22)
- Risk: Low
- Files:
  - `.github/workflows/release.yml`
  - `.github/workflows/scheduled.yml`
- Verification: workflow lint + local gates

2. Fix release workflow command mismatch
- Risk: Low
- Files:
  - `.github/workflows/release.yml`
- Verification: workflow references existing script (`security:check`)

3. CI correctness cleanup
- Risk: Low
- Files:
  - `.github/workflows/ci.yml`
  - `.github/workflows/e2e-tests.yml`
  - `.github/workflows/mobile-responsive.yml`
- Changes:
  - fix lint path check
  - ensure lockfile cache path configured
- Verification: local gates + workflow syntax check

4. Single package-manager source of truth
- Risk: Medium
- Files:
  - `angular/package.json`
  - `angular/pnpm-lock.yaml` (remove after confirmation)
- Verification:
  - `rg -n "pnpm" .github package.json angular/package.json`
  - local gates

## Track C - Framework/Library Upgrades (Risk-managed)

1. Dependency refresh (patch/minor) with lockfile updates
- Risk: Medium
- Files: `package.json`, `package-lock.json`, `angular/package.json`, `angular/package-lock.json`
- Verification: full gates
- Blocker: requires registry access (`ENOTFOUND` in current environment)

2. Angular ecosystem major review (already on Angular 21)
- Risk: High
- Files: Angular deps/tooling configs as needed
- Verification: full gates + targeted e2e regression pack
- Default for now: defer unless new stable major is available and compatible in CI.

3. Supabase DB performance cleanup migration set
- Risk: Medium
- Files: `supabase/migrations/*.sql`
- Candidate fixes:
  - add missing FK index for `knowledge_base_entries.kb_merlin_approved_by`
  - optimize auth function calls in RLS policies
- Verification:
  - `npm run db:audit:sql`
  - `npm run audit:rls-boundaries`
  - `mcp__supabase__get_advisors type=performance`

---

## Implementation Sequence (PR-sized)

1. PR-1 Security token cleanup and safer env injection.
2. PR-2 CI/runtime alignment and release workflow correctness.
3. PR-3 Tooling source-of-truth cleanup (package-manager + duplicate config removal).
4. PR-4 Supabase performance migration quick wins.
5. PR-5 Dependency refresh (when network access is available).


## Execution Status

- Completed: Track A items 1-2 (repo-side secret hygiene and masking).
- Completed: Track C item 1 (dependency refresh) with patch updates for Angular 21.2.4 and latest primeNG 21.1.3.
- Partially completed: Track C item 3 (missing FK index migration added).
- Deferred safely:
  - Track C item 2 (framework major) pending release-window decision and network-enabled upgrade test cycle.
  - Remaining RLS policy initplan rewrites moved to dedicated DB policy PR.


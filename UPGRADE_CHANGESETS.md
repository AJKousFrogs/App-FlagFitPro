# UPGRADE_CHANGESETS

Date: 2026-03-22

## PR-6: Tooling Unification and CI Correctness

### What changed
- Unified package management to `npm@11.4.2` project-wide.
  - Added `packageManager` to root `package.json`.
  - Removed all `pnpm` references and artifacts (metadata, documentation).
- Aligned all GitHub Workflows to Node 22 LTS.
  - Updated `release.yml`, `scheduled.yml`, `e2e-tests.yml`, and `mobile-responsive.yml`.
- Standardized CI caching across all workflows to use both `package-lock.json` and `angular/package-lock.json`.
- Fixed CI `design-system-enforcement` job to correctly install root dependencies required for `stylelint`.
- Hardened root dependencies:
  - Fixed security vulnerabilities via `npm audit fix`.
  - Added `overrides` for `h3` to address deep security vulnerabilities in `netlify-cli`.
- Fixed documentation inconsistencies:
  - Updated `LOCAL_DEVELOPMENT_SETUP.md` and `BACKEND_SETUP.md` to reflect `npm` usage.
  - Corrected `BACKEND_SETUP.md` function examples to use ESM `export const handler`.
  - Updated `INFRA_AUDIT_REPORT.md` and `UPGRADE_PLAN.md` with latest execution status.

### Why
- Ensure consistent development environment across all team members and CI.
- Resolve "split-brain" package manager state that caused non-reproducible builds.
- Fix CI failures in design system enforcement due to missing root tools.
- Keep documentation in sync with the actual implementation and ESM standards.

### How verified
1. `npm run lint` -> PASS
2. `npm run type-check` -> PASS
3. `npm run test:unit` -> PASS
4. `npm run build` -> PASS
5. Manual audit of all documentation files for `pnpm` references.

---

Date: 2026-03-14

## PR-5: Dependency Refresh (Patch/Minor)

### What changed
- Updated root dependencies to latest minor/patch versions:
  - `@supabase/supabase-js` (2.95.3 -> 2.99.1)
  - `pg` (8.18.0 -> 8.20.0)
  - `vitest` (4.0.18 -> 4.1.0)
  - `dotenv` (17.2.4 -> 17.3.1)
  - `sass` (1.97.3 -> 1.98.0)
- Updated Angular app dependencies to latest patches:
  - `@angular/*` core packages (21.2.2 -> 21.2.4)
  - `primeng` (21.1.1 -> 21.1.3)
  - `@primeuix/themes` (2.0.3 -> 2.1.2)
  - `typescript-eslint` (8.55.0 -> 8.57.0)
  - `angular-eslint` (21.2.0 -> 21.3.0)

### Why
- Address XSS vulnerability in Angular < 21.2.4.
- General maintenance and stability fixes.
- Resolve previous connectivity issues that blocked updates.

### How verified
1. `npm run lint` -> PASS
2. `npm run type-check` -> PASS
3. `npm run test:unit` -> PASS (748 tests passed)
4. `npm run build` -> PASS
5. `npm run test:e2e:smoke` -> PASS (9 tests passed)

### Notes
- High severity `undici` vulnerabilities remain as `@angular/build` and `@angular-devkit/build-angular` are at their latest version (21.2.2) and no fix is yet available for the Angular 21 branch.

---

Date: 2026-02-21

## PR-1: Security Secret-Hygiene Hardening
... (rest of the file)

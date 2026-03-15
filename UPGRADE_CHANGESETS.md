# UPGRADE_CHANGESETS

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

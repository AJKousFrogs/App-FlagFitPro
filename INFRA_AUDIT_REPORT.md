# INFRA_AUDIT_REPORT

Date: 2026-02-21
Repository: `/Users/aljosaursakous/Desktop/Flag football HTML - APP`

## Phase 0 - Repo Discovery (No code changes)

### Runtime/Framework Inventory

| Area | Detected | Evidence |
|---|---|---|
| Node runtime | Engine requires `>=22.0.0`; local runtime `v24.3.0` | `package.json`, `angular/package.json`, `node -v` |
| Package manager | npm@11.4.2 (unified across root and angular) | `package.json`, `angular/package.json`, `package-lock.json`, `angular/package-lock.json` |
| Frontend framework | Angular 21 standalone app | `angular/package.json` (`@angular/*` `^21.2.4`) |
| TypeScript | `^5.9.3` (root and angular) | `package.json`, `angular/package.json` |
| UI libs | PrimeNG 21 + Prime Icons + Prime UIX themes + Chart.js | `angular/package.json` |
| Styling | SCSS + stylelint + custom design-token lint | `angular/angular.json`, `stylelint.config.js`, `scripts/lint-design-tokens.js` |
| Build toolchain | Angular CLI builder (`@angular-devkit/build-angular:application`), esbuild via Netlify Functions bundler | `angular/angular.json`, `netlify.toml` |
| Test stack | Vitest (unit), Playwright (e2e/smoke/visual), Storybook tests | `package.json`, `angular/package.json`, workflows |
| Backend/infra | Netlify Functions + Supabase/Postgres | `netlify/functions/*`, `supabase/*`, `netlify.toml` |
| CI/CD | GitHub Actions + Netlify deploy | `.github/workflows/*`, `netlify.toml` |

### package.json Scripts Inventory

#### Root scripts (`package.json`)

```text
audit:auth-routes
audit:db-resilience
audit:error-shapes
audit:js-duplications
audit:rate-limits
audit:rls-boundaries
audit:routes
audit:scss-duplications
audit:scss-duplications:ci
audit:security
audit:ts-duplications
benchmark
build
build:analyze
build:css
build:production
check:consent
check:consent:ci
clean
clean:all
css:coverage
db:audit
db:audit:sql
db:tables
deploy
dev
dev:angular
dev:angular-only
dev:api
dev:full
dev:netlify
diagnostics
diagnostics:features
diagnostics:health
eval:merlin
format
format:check
health:check
lint
lint:all
lint:css
lint:css:all
lint:css:changed
lint:css:fix
lint:design-system
lint:ds
lint:ds:ci
lint:fix
lint:format
lint:tokens
lint:tokens:ci
lint:tokens:fix
lint:tooling
migrate:data
migrate:quickstart
perf:validate
perf:validate:ci
postinstall
preflight:deps
preflight:friday
quick-fixes
quick-fixes:apply
refactor:all
refactor:component
refactor:find-dark
refactor:find-dark:fix
sass:compile
sass:watch
scan:knowledge-secrets
security:check
seed:all
seed:competition
seed:hydration
seed:isometrics
seed:nutrition
seed:plyometrics
seed:recovery
seed:supplements
seed:training
seed:wada
smoke:check
start
start:api
storybook
storybook:build
storybook:test
test
test:acwr
test:acwr:ci
test:ai-telemetry
test:all
test:backend
test:ci
test:contracts
test:coverage
test:e2e
test:e2e:critical
test:e2e:debug
test:e2e:headed
test:e2e:navigation
test:e2e:navigation:watch
test:e2e:smoke
test:e2e:ui
test:kb:live
test:load:logging
test:load:logging:quick
test:load:logging:report
test:privacy
test:privacy:ci
test:smoke
test:unit
test:watch
type-check
update:env
validate:knowledge
verify:db
verify:supabase
```

#### Angular scripts (`angular/package.json`)

```text
audit:a11y
build
build-storybook
build:analyze
build:prerender
build:ssr
bundle:check
e2e
e2e:critical
e2e:design-system
e2e:design-system:ui
e2e:design-system:watch
e2e:headed
e2e:navigation
e2e:navigation:watch
e2e:smoke
e2e:ui
e2e:visual
e2e:visual:all
e2e:visual:all:update
e2e:visual:mobile
e2e:visual:mobile:update
e2e:visual:tablet
e2e:visual:tablet:update
e2e:visual:ui
e2e:visual:update
lint
lint:app
lint:fix
ng
postinstall
serve:ssr:flagfit-pro
start
start:ssr
storybook
test
test:coverage
test:ui
test:watch
type-check
watch
```

### Key Config Files Inventory

| Domain | Files |
|---|---|
| Build/deploy | `netlify.toml`, `angular/angular.json`, `playwright.config.js`, `angular/playwright.config.ts`, `vitest.config.ts` |
| TypeScript | `tsconfig.json`, `angular/tsconfig*.json` |
| Lint/format/style | `eslint.config.js`, `angular/eslint.config.mjs`, `stylelint.config.js`, `.prettierignore` |
| CI | `.github/workflows/ci.yml`, `.github/workflows/e2e-tests.yml`, `.github/workflows/mobile-responsive.yml`, `.github/workflows/release.yml`, `.github/workflows/scheduled.yml` |
| Locks | `package-lock.json`, `angular/package-lock.json`, `angular/pnpm-lock.yaml` |
| Supabase | `supabase/config.toml`, `supabase/migrations/*`, `supabase/functions/*` |

### Environment/Secrets Handling Approach

| Area | Current pattern | Risk note |
|---|---|---|
| Runtime env wiring | Netlify env + `scripts/inject-env-into-html-angular.js` writes `window._env` | Script currently contains hardcoded key literals in template output path |
| Local env files | `.env`, `.env.local`, `.env.development`, `.env.netlify`, `.env.example` | `.env.netlify` and `.env.example` currently include real-looking tokens |
| Frontend env | `environment.ts` + `environment.prod.ts` + `window._env` support | `environment.ts` has hardcoded anon key fallback |
| Backend secrets | Netlify Functions use `process.env.*` (`SUPABASE_*`, SMTP, API keys) | Mixed naming conventions; several scripts include hardcoded fallback secrets |

---

## Phase 1 - Health Check (No code changes)

### Commands Run and Results

#### 1) Dependency status

1. `npm outdated --json` (root)
- Result: failed (network + npm CLI error)
- Output:
  - `npm error Exit handler never called!`
  - Log: `~/.npm/_logs/2026-02-21T16_35_05_400Z-debug-0.log`

2. `cd angular && npm outdated --json`
- Result: failed (network)
- Output:
  - `ENOTFOUND registry.npmjs.org`

3. `npm audit --json` (root)
- Result: failed (network)
- Output:
  - `request to https://registry.npmjs.org/-/npm/v1/security/advisories/bulk failed`
  - `ENOTFOUND registry.npmjs.org`

4. `cd angular && npm audit --json`
- Result: failed (network)
- Output:
  - same `ENOTFOUND` advisory endpoint failure

5. Deprecated package evidence from lockfile scan
- Command: `rg -n '"deprecated":' package-lock.json`
- Result: found transitive deprecated entries:
  - `inflight@1.0.6`
  - `glob@7.2.3` (via transitive toolchain)
  - `node-domexception@1.0.0`

#### 2) Code health gates

1. `npm run lint`
- Result: PASS

2. `npm run type-check`
- Result: PASS

3. `npm run test:unit`
- Result: PASS
- Summary: `37 passed` test files; `799 passed`, `3 skipped`, `20 todo`

4. `npm run build`
- Result: PASS
- Note: non-fatal debug warnings from vendor deps (`primeng`, `html2canvas`)

5. `npm run test:e2e:smoke`
- Result: PASS
- Summary: `9 passed` across chromium/firefox/webkit

#### 3) CI/CD correctness

| Check | Status | Evidence |
|---|---|---|
| Node pinned to LTS | PARTIAL | `ci.yml` uses `22`; `release.yml` and `scheduled.yml` use `20.x` while engines require `>=22` |
| Lockfile install in CI | PASS | `npm ci` used in workflows (root + angular) |
| Cache enabled | PASS (inconsistent detail) | `actions/setup-node` cache used; some workflows omit explicit `cache-dependency-path` |
| Build/lint/test staging | PASS | Separate jobs in `ci.yml` |
| Artifacts committed | PASS | `dist/`, `playwright-report/`, `test-results/` ignored and not tracked (`git ls-files` empty) |

#### 4) Backend (Supabase/Postgres)

1. Local audit scripts
- `npm run audit:rls-boundaries`
  - Result: no severe issues
  - Warning: `netlify/functions/parental-consent.js` mixed-auth allowlist path
- `npm run db:audit:sql`
  - Result: `181` SQL files scanned; `104` findings (`17 high`, `31 medium`, `56 low`)
  - Report output: `docs/reports/supabase-sql-audit.md`
- `npm run audit:db-resilience`
  - Result: no severe issues

2. Supabase advisors (live)
- Security advisor:
  - `auth_leaked_password_protection` WARN (disabled)
- Performance advisors:
  - Unindexed FK for `public.knowledge_base_entries.kb_merlin_approved_by_fkey`
  - RLS initplan warnings on knowledge base policies
  - Large set of unused-index informational findings

3. Migration hygiene
- `mcp__supabase__list_migrations` returned latest migration chain through `20260220110837_harden_kb_rls_and_add_review_audit`
- Local SQL audit indicates high/medium findings remain in migration set and should be triaged.

4. Backups/observability notes
- Backup logic exists in `netlify/functions/admin.js` (`/create-backup`) and references Supabase managed backups.
- Health endpoints exist (`/api/health`, admin health metrics).
- Sentry toggles/config present, but runtime enablement depends on env vars.

---

## Findings by Severity

## Critical

1. Hardcoded service-role credential material in repository scripts/examples
- Evidence:
  - `.env.example:54`
  - `.env.netlify:3`
  - `scripts/update-env-file.js:22-23`
  - `scripts/verify-new-supabase.js:28-33`
  - `scripts/run-upgrade-migration.sh:125`
- Impact:
  - Credential leakage risk and accidental privilege escalation in local/CI contexts.
- Recommended fix:
  - Remove hardcoded secrets and replace with placeholders/env-required checks.
  - Rotate compromised keys immediately after cleanup.

## High

1. CI Node version drift vs engine policy
- Evidence:
  - `package.json` + `angular/package.json` engines `>=22.0.0`
  - `.github/workflows/release.yml` and `.github/workflows/scheduled.yml` use `20.x`
- Impact:
  - Release/scheduled jobs may run unsupported runtime and fail unpredictably.
- Recommended fix:
  - Pin all workflows to Node 22 LTS (same major across jobs).

2. Broken release workflow command
- Evidence:
  - `.github/workflows/release.yml` uses `npm run security:dependency-check` (script not present in `package.json`)
- Impact:
  - Release validation job can fail for non-security reasons.
- Recommended fix:
  - Use existing `npm run security:check` or add intended script explicitly.

3. package-manager/lockfile split-brain
- Evidence:
  - `angular/package.json` says `packageManager: pnpm@10.28.0`
  - CI/build uses npm + `angular/package-lock.json`
  - `angular/pnpm-lock.yaml` also committed
- Impact:
  - Non-reproducible dependency trees and audit noise/extraneous deps.
- Recommended fix:
  - Choose one manager (safest: npm, already in CI), remove conflicting lockfile.

## Medium

1. Netlify env injection script uses hardcoded anon key literals in output template/log text
- Evidence:
  - `scripts/inject-env-into-html-angular.js:41,88,90`
- Impact:
  - Non-authoritative key propagation and confusing/misleading runtime diagnostics.
- Recommended fix:
  - Inject only env-provided values and mask key output in logs.

2. CI lint path check likely incorrect in `ci.yml`
- Evidence:
  - Lint job `working-directory: ./angular` but check uses `rg ... angular/src`
- Impact:
  - Rule may never scan intended directory during CI lint job.
- Recommended fix:
  - Use `rg ... src` when already in `angular` working directory.

3. Supabase advisor warnings not yet remediated
- Evidence:
  - Missing FK index + RLS initplan warnings on knowledge tables.
- Impact:
  - Query performance degradation under load.
- Recommended fix:
  - Add missing index migration and optimize policy expressions (`(select auth.uid())` pattern).

## Low

1. Dependency and audit checks are currently non-deterministic in this environment
- Evidence:
  - `ENOTFOUND registry.npmjs.org` for `npm outdated` and `npm audit`
- Impact:
  - Incomplete vulnerability/outdated visibility during offline runs.
- Recommended fix:
  - Run in CI/networked environment and archive outputs as artifacts.

2. Duplicate/verbose ESLint overrides in root config
- Evidence:
  - `eslint.config.js` contains repeated Netlify functions block.
- Impact:
  - Maintenance overhead; rule drift risk.
- Recommended fix:
  - Consolidate duplicated overrides.


---

## Post-Implementation Status (This Session)

Resolved in-repo during this upgrade:
- Removed/neutralized hardcoded credential material in key scripts and env template files.
- Aligned GitHub Actions Node runtime versions to Node 22 across all workflows (CI, Release, Scheduled, E2E, Mobile).
- Fixed release workflow security script reference (using `security:check`).
- Fixed CI lint guard path (`src` path under angular working directory).
- Added workflow cache dependency paths for dual lockfile installs across all workflows.
- Added Supabase migration for missing FK covering index (`knowledge_base_entries.kb_merlin_approved_by`).
- Consolidated duplicated ESLint override block.
- Standardized project-wide package manager to npm@11.4.2 and removed pnpm artifacts.
- Fixed root dependency security vulnerabilities (except deep netlify-cli nested h3).
- Added packageManager field to root package.json for consistency.
- Fixed CI design-system-enforcement job to install root dependencies required for stylelint.

Still pending (risk-managed / requires additional context or network access):
- Supabase auth leaked-password protection must be enabled in project settings (dashboard-side).
- Supabase RLS initplan policy rewrites are still pending (higher-change DB policy edits).


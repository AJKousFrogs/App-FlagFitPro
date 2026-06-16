# Scripts Directory

Utility and tooling scripts for FlagFit Pro. All `npm run` commands below execute from the repo root.

## Development

| Command | Description |
|---|---|
| `npm run dev` | Netlify Dev — Angular app + local functions |
| `npm run dev:angular-only` | Angular only (no functions) |
| `npm run build` | Production build |

## Testing

| Command | Description |
|---|---|
| `npm run test:unit:backend` | Vitest backend unit suite (406 files / 4756 tests) |
| `npm run test:unit` | Angular Vitest suite |
| `npm run test:e2e` | Playwright E2E |
| `npm run test:e2e:smoke` | Playwright smoke suite |
| `npm run test:e2e:critical` | Playwright critical paths |
| `npm run test:privacy` | Privacy/consent regression tests |
| `npm run test:acwr` | ACWR calculation tests |
| `npm run test:contracts` | API contract tests |
| `npm run test:all` | All suites |

## Linting & Audits

| Command | Description |
|---|---|
| `npm run lint` | Angular ESLint |
| `npm run lint:tooling` | ESLint on scripts/ + netlify/functions/ |
| `npm run lint:css` | Stylelint |
| `npm run lint:tokens` | Design token usage audit |
| `npm run audit:error-shapes` | Error-shape contract audit (CI gate) |
| `npm run audit:routes` | Route classification audit |
| `npm run audit:api-contracts` | API contract audit |
| `npm run audit:rls-boundaries` | RLS boundary audit |
| `npm run audit:security` | Security audit |
| `npm run audit:scss-duplications` | SCSS duplication check |
| `npm run type-check` | Root TypeScript check (scripts/, supabase-types.ts) |

## Database Seeding

| Command | Description |
|---|---|
| `npm run seed:all` | Run all core seed scripts |
| `npm run seed:isometrics` | Isometric training exercises |
| `npm run seed:plyometrics` | Plyometrics research (Verkhoshansky) |
| `npm run seed:hydration` | Hydration research studies |
| `npm run seed:supplements` | Supplement research data |
| `npm run seed:competition` | Competition protocols |
| `npm run seed:nutrition` | Nutrition system data |
| `npm run seed:recovery` | Recovery protocols |
| `npm run seed:wada` | WADA prohibited substances |
| `npm run seed:training` | Training categories |

## Database Utilities

| Command | Description |
|---|---|
| `npm run db:audit` | Database audit |
| `npm run db:tables` | List all Supabase tables |
| `npm run verify:db` | Verify database objects |
| `npm run verify:supabase` | Supabase connection check |

## Docs

| Command | Description |
|---|---|
| `npm run docs:regen` | Regenerate `docs/generated/` from live schema snapshot |

## Diagnostics & Health

| Command | Description |
|---|---|
| `npm run diagnostics` | Diagnostic system |
| `npm run diagnostics:health` | Comprehensive health check |
| `npm run health:check` | Health check |
| `npm run perf:validate` | Performance validation |
| `npm run check:consent` | Consent violation check |

## Key Script Files

| File | Purpose |
|---|---|
| `docs-regen.mjs` | Regenerates `docs/generated/` — run via `npm run docs:regen` |
| `audit-error-shape-contracts.js` | CI gate: classifies all handlers as standardized or legacy |
| `build-css.js` | CSS processing for the build |
| `inject-env-into-html-angular.js` | Environment injection into Angular build output (Netlify deploy) |
| `fix-jws-vulnerability.js` | JWS security fix (runs on `postinstall`) |

## Requirements

- Node.js 22+
- `SUPABASE_SERVICE_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) and `DATABASE_URL` for DB-touching scripts

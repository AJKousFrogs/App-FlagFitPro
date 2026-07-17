# Scripts Directory

Utility and tooling scripts for FlagFit Pro. All `npm run` commands below execute from the repo root.

## Development

| Command                    | Description                                 |
| -------------------------- | ------------------------------------------- |
| `npm run dev`              | Netlify Dev — Angular app + local functions |
| `npm run dev:angular-only` | Angular only (no functions)                 |
| `npm run build`            | Production build                            |

## Testing

| Command                     | Description                      |
| --------------------------- | -------------------------------- |
| `npm run test:unit:backend` | Vitest backend unit suite        |
| `npm run test:unit`         | Angular Vitest suite             |
| `npm run test:e2e`          | Playwright E2E                   |
| `npm run test:e2e:smoke`    | Playwright smoke suite           |
| `npm run test:e2e:critical` | Playwright critical paths        |
| `npm run test:privacy`      | Privacy/consent regression tests |
| `npm run test:acwr`         | ACWR calculation tests           |
| `npm run test:contracts`    | API contract tests               |
| `npm run test:all`          | All suites                       |

## Linting & Audits

| Command                           | Description                                         |
| --------------------------------- | --------------------------------------------------- |
| `npm run lint`                    | Angular ESLint                                      |
| `npm run lint:tooling`            | ESLint on scripts/ + netlify/functions/             |
| `npm run lint:css`                | Stylelint                                           |
| `npm run lint:tokens`             | Design token usage audit                            |
| `npm run audit:error-shapes`      | Error-shape contract audit (CI gate)                |
| `npm run audit:routes`            | Route classification audit                          |
| `npm run audit:rls-boundaries`    | RLS boundary audit                                  |
| `npm run audit:security`          | Security audit                                      |
| `npm run audit:scss-duplications` | SCSS duplication check                              |
| `npm run type-check`              | Root TypeScript check (scripts/, supabase-types.ts) |

## Database Seeding

The legacy `npm run seed:*` scripts (isometrics/plyometrics/hydration/supplements/
competition/nutrition/recovery/wada/training) were **removed 2026-07-13** — they
inserted into a research-table schema that no longer exists (replaced by the
canonical `exercises` table + `knowledge_base_entries`), so every one was broken.

Current seeding is version-controlled SQL applied via Supabase MCP (never hand-run
node scripts):

- **Exercise library** — `database/seed-exercise-library.generated.sql` (emitted by
  `npm run build:exercise-library` from `database/library/*.mjs`).
- **Merlin knowledge base** — `database/seed-evidence-knowledge-gaps.sql` and the
  `database/*-knowledge.sql` imports.
- **Reference/config rows** — carried in `supabase/migrations/`.

## Database Utilities

| Command                   | Description               |
| ------------------------- | ------------------------- |
| `npm run db:audit`        | Database audit            |
| `npm run db:tables`       | List all Supabase tables  |
| `npm run verify:db`       | Verify database objects   |
| `npm run verify:supabase` | Supabase connection check |

## Docs

| Command              | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `npm run docs:regen` | Regenerate `docs/generated/` from live schema snapshot |

## Diagnostics & Health

| Command                      | Description                |
| ---------------------------- | -------------------------- |
| `npm run diagnostics`        | Diagnostic system          |
| `npm run diagnostics:health` | Comprehensive health check |
| `npm run health:check`       | Health check               |
| `npm run perf:validate`      | Performance validation     |
| `npm run check:consent`      | Consent violation check    |

## Key Script Files

| File                              | Purpose                                                          |
| --------------------------------- | ---------------------------------------------------------------- |
| `docs-regen.mjs`                  | Regenerates `docs/generated/` — run via `npm run docs:regen`     |
| `audit-error-shape-contracts.js`  | CI gate: classifies all handlers as standardized or legacy       |
| `inject-env-into-html-angular.js` | Environment injection into Angular build output (Netlify deploy) |
| `fix-jws-vulnerability.js`        | JWS security fix (runs on `postinstall`)                         |

## Requirements

- Node.js 22+
- `SUPABASE_SERVICE_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) and `DATABASE_URL` for DB-touching scripts

# FlagFit Pro

A flag-football performance, wellness, and team-operations platform built with **Angular** (standalone, zoneless, signals), **Netlify Functions**, and **Supabase** (Postgres + Auth + Realtime + Storage).

## Start here

**→ [`docs/SOURCE_OF_TRUTH.md`](./docs/SOURCE_OF_TRUTH.md)** is the single authoritative doc: system map, data model, endpoint reference, the **Feature Status Ledger** (read before building anything — it says what already exists), spec laws, known drift, and runbooks.

Generated, ground-truth-anchored references it links to:

- [`docs/generated/DATA_MODEL.md`](./docs/generated/DATA_MODEL.md) — exact live tables/columns
- [`docs/generated/ENDPOINTS.md`](./docs/generated/ENDPOINTS.md) — every `/api/*` route, exercised vs orphaned

Angular workspace guide: [`angular/README.md`](./angular/README.md).

## Quick start

Prerequisites: Node.js 22+, npm 11+.

```bash
npm install
cd angular && npm install && cd ..
npm run dev          # Netlify Dev: Angular app + local functions
```

`npm run dev:angular-only` runs Angular in isolation when backend parity isn't needed.

## Common commands

```bash
npm run dev          # local dev (Netlify Dev)
npm run build        # production build (cd angular && ng build)
npm run docs:regen   # regenerate docs/generated/* from ground truth (see SOURCE_OF_TRUTH §8)
cd angular && npm run type-check && npm run lint && npm run test
```

## Repository layout

```text
angular/              Angular application (feature screens are direct children of src/app/)
netlify/functions/    Serverless backend (/api/* via netlify.toml redirects)
supabase/migrations/  Live migration history (database/migrations/ is legacy — do not add here)
docs/                 SOURCE_OF_TRUTH.md + generated/
tests/                Integration, privacy, and logic tests
scripts/              Tooling and repo automation (incl. docs-regen.mjs)
```

## Documentation rule

One source of truth: `docs/SOURCE_OF_TRUTH.md`. Its generated sections are produced by `npm run docs:regen` — don't hand-edit `docs/generated/*`. Any PR that adds/changes a table, endpoint, or feature **must update the Feature Status Ledger in the same commit** (SOURCE_OF_TRUTH §8). One-off audits and progress reports don't belong in `docs/` — fold them into the source of truth or delete them.

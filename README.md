# FlagFit Pro

FlagFit Pro is a flag football performance, wellness, and team-operations platform built with Angular, PrimeNG, Netlify Functions, and Supabase.

**Current release:** [4.0.0](docs/RELEASE_NOTES_4.0.0.md) — UI redesign, Supabase polish, and TypeScript/JavaScript fixes.

## Start Here

- Canonical documentation index: [docs/DOCS_INDEX.md](./docs/DOCS_INDEX.md)
- Local development setup: [docs/LOCAL_DEVELOPMENT_SETUP.md](./docs/LOCAL_DEVELOPMENT_SETUP.md)
- Architecture: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- Single source of truth rules: [docs/SINGLE_SOURCE_OF_TRUTH.md](./docs/SINGLE_SOURCE_OF_TRUTH.md)
- Angular workspace guide: [angular/README.md](./angular/README.md)

## Documentation Rule

- `docs/DOCS_INDEX.md` is the canonical entry point for durable product and engineering docs.
- Docs must describe current behavior or enforced rules.
- One-off audits, progress reports, and temporary trackers should be deleted once their outcome is merged into durable docs or code.
- A local README is allowed when it explains a specific subdirectory, script set, or operational area.

## Quick Start

Prerequisites:

- Node.js 22+
- npm 11+

Install and run:

```bash
npm install
cd angular && npm install && cd ..
npm run dev
```

Preferred local workflow:

- `npm run dev` runs Netlify Dev and proxies the Angular app plus local functions.
- `npm run dev:angular-only` is for isolated Angular work when backend parity is not needed.

## Common Commands

```bash
npm run dev
npm run build
npm run type-check
npm run lint
npm run test
```

For workspace-specific commands, use [angular/README.md](./angular/README.md).

## Repository Layout

```text
angular/              Angular application
netlify/functions/    Serverless backend
database/             Migrations and database support material
docs/                 Canonical product and engineering docs
tests/                Integration, privacy, and logic tests
scripts/              Tooling, audits, and repo automation
```

## Source Of Truth

The repo now uses one clear documentation hierarchy:

- product, architecture, security, API, and design rules live under [docs/](./docs/)
- Angular implementation guidance lives under [angular/](./angular/)
- SCSS implementation guidance lives next to the style system under [angular/src/scss/](./angular/src/scss/)

If two docs disagree, prefer:

1. [docs/DOCS_INDEX.md](./docs/DOCS_INDEX.md)
2. the topic-specific canonical doc linked from that index
3. the code

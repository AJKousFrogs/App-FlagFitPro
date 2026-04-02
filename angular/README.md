# FlagFit Pro Angular Workspace

This directory contains the primary Angular application for athlete, coach, staff, and team workflows.

## Canonical References

- Documentation index: [../docs/DOCS_INDEX.md](../docs/DOCS_INDEX.md)
- Architecture: [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- Angular and PrimeNG patterns: [../docs/ANGULAR_PRIMENG_GUIDE.md](../docs/ANGULAR_PRIMENG_GUIDE.md)
- Design rules: [../docs/DESIGN_SYSTEM_RULES.md](../docs/DESIGN_SYSTEM_RULES.md)
- Debugging index: [ANGULAR_DEBUGGING_INDEX.md](./ANGULAR_DEBUGGING_INDEX.md)

## Prerequisites

- Node.js 22+
- npm 11+

## Install

```bash
cd angular
npm install
```

## Local Development

Use the repo root when you need backend parity:

```bash
cd ..
npm run dev
```

Use Angular-only mode when you are working on isolated UI or workspace logic:

```bash
cd angular
npm start
```

## Core Commands

```bash
npm start
npm run build
npm run type-check
npm run lint
npm run test
npm run e2e:smoke
```

## Workspace Structure

```text
src/app/core/       Shell, routing, guards, services, shared infrastructure
src/app/features/   Route-backed product features
src/app/shared/     Shared components, directives, pipes, utilities
src/scss/           Token, primitive, foundation, and utility styling layers
src/assets/         Legal, static, and override assets
```

## Current Source Of Truth

- SCSS tokens: `src/scss/tokens/design-system-tokens.scss`
- TS token bridge: `src/app/core/utils/design-tokens.util.ts`
- App shell and route metadata: `src/app/core/routes` plus `src/app/core/services/route-shell.service.ts`
- Auth and session runtime: `src/app/core/services/supabase.service.ts`

Do not treat local compatibility shims or old examples as architecture docs. Prefer the docs linked above and the current code.

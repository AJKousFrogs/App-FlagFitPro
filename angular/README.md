# FlagFit Pro — Angular Workspace

The primary Angular application for athlete, coach, staff, and team workflows.

**→ [`docs/SOURCE_OF_TRUTH.md`](../docs/SOURCE_OF_TRUTH.md)** is the single authoritative reference: system map, data model, endpoint reference, Feature Status Ledger, spec laws, and runbooks.

## Prerequisites

- Node.js 22+
- npm 11+

## Install

```bash
cd angular
npm install
```

## Development

Use repo root when backend parity matters (Netlify Dev + functions):

```bash
npm run dev
```

Use Angular-only mode for isolated UI work:

```bash
cd angular
npm start
```

## Core Commands

All from the `angular/` directory unless noted.

| Command | What it does |
|---|---|
| `npm start` | Angular dev server only |
| `npm run build` | Production build |
| `npm run type-check` | TypeScript check (no emit) |
| `npm run lint` | ESLint on `src/app/**` |
| `npm run test` | Vitest unit suite |
| `npm run e2e:smoke` | Playwright smoke suite |
| `npm run e2e:critical` | Playwright critical paths |
| `npm run bundle:check` | Bundle size analysis |
| `npm run audit:a11y` | Accessibility audit |

CSS/design-system checks run from repo root:

```bash
npm run lint:css
npm run lint:tokens
npm run audit:scss-duplications
```

## Workspace Structure

```text
src/app/               Feature screens (direct children — no features/ subdirectory)
src/app/core/          Shell, routing, guards, services, logging, shared infrastructure
src/app/shared/        Shared components, directives, pipes, utilities
src/scss/              Design system: tokens/, system/, and overrides/
src/assets/            Legal docs, static assets
```

## Service Patterns: Signals vs. RxJS

Both are used deliberately, for different jobs — this is not legacy drift to "clean up" by converting one into the other:

- **Signals** hold state a template reads reactively: `loading`, `current`/cached-data, `error`. Expose as `readonly` (write via a private signal + public `.asReadonly()`, or just a `readonly` signal mutated only by the service itself).
- **RxJS `Observable`** is the return type of imperative action/fetch methods (`getX()`, `calculateY()`) — it lets callers `.subscribe()`, `firstValueFrom()`, or compose with other operators. Inside the method, `tap()` writes the result into the state signals as a side effect; `catchError`/`finalize` update `error`/`loading`. See `readiness.service.ts` (`calculateToday()`) or `wellness.service.ts` (`getWellnessData()`) for the reference shape.
- **Realtime subscriptions** (Supabase channels) are managed internally with plain callbacks/subscriptions, pushing updates into signals — never expose the raw subscription as public API.

If a service's public surface is *only* synchronous reads of already-loaded state with no fetch/mutation, signals alone are fine (no RxJS needed). If you're writing a new fetch/mutate method, return `Observable`, not `Promise` — it matches every existing service and lets `ApiService`'s interceptors/dedup logic work.

## Design System

- **Tokens** (single source of truth): `src/scss/tokens/_tokens.scss` — CSS custom properties for all colors, type, space, radii, motion.
- **Component vocabulary**: `src/scss/system/_system.scss` — assembled via `@include system.all` in `styles.scss`.
- **Token bridge (TS)**: `src/app/core/utils/design-tokens.util.ts`
- **No PrimeNG** — removed entirely (dependency, theme overrides, and lint guardrails).

## Auth & Routing

- Auth/session runtime: `src/app/core/services/supabase.service.ts`
- Route definitions: `src/app/core/routes/feature-routes.ts` + `app.routes.ts`
- Guards: `core/guards/auth.guard.ts` (config-gated), `core/guards/staff.guard.ts`

## Testing & Debugging

- Testing checklist: [`TESTING_CHECKLIST.md`](./TESTING_CHECKLIST.md)
- Debugging guide: [`DEBUGGING_GUIDE.md`](./DEBUGGING_GUIDE.md)
- E2E guide: [`e2e/README.md`](./e2e/README.md)

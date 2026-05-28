# FlagFit Pro Tech Stack

This file is the canonical high-level stack summary. For detailed setup and workflow commands, see [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md).

**Current application release:** [4.0.0](./RELEASE_NOTES_4.0.0.md) (see release notes for scope: redesign, Supabase polish, TypeScript/JavaScript fixes).

## Runtime Baseline

- Node.js 22+
- npm 11+
- ESM-first repo (`"type": "module"` at the root)

## Frontend

| Layer | Technology |
| --- | --- |
| Framework | Angular 21 |
| UI library | PrimeNG 21 |
| State | Angular signals |
| Change detection | zoneless-first app configuration |
| Styling | SCSS + CSS custom properties |
| Testing | Vitest + Playwright |

## Backend

| Layer | Technology |
| --- | --- |
| Hosting | Netlify Functions |
| Runtime | Node.js |
| Module format | ESM |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |

## Design System

> **Being rebuilt (static-first).** The previous SCSS token system and UI docs
> were removed in the front-end demolition. The new single-source design system
> is authored statically in `redesign/ground-zero/` (one `tokens.css` + a
> component gallery) and promoted into `angular/src/scss/tokens/` during the
> port (Phase C/E). Substrate: PrimeNG (Aura), themed via tokens + the `pt` API,
> no `::ng-deep`.

## Verification Commands

```bash
npm run build
npm run type-check
npm run lint
npm run lint:css
npm run lint:tokens
```

## Related Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [SINGLE_SOURCE_OF_TRUTH.md](./SINGLE_SOURCE_OF_TRUTH.md)
- [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md)

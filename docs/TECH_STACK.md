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

Canonical sources:

- Tokens: `angular/src/scss/tokens/design-system-tokens.scss`
- TS bridge: `angular/src/app/core/utils/design-tokens.util.ts`
- Rules: [DESIGN_SYSTEM_RULES.md](./DESIGN_SYSTEM_RULES.md)
- Angular implementation patterns: [ANGULAR_PRIMENG_GUIDE.md](./ANGULAR_PRIMENG_GUIDE.md)

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
- [DESIGN_SYSTEM_RULES.md](./DESIGN_SYSTEM_RULES.md)

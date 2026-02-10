# FlagFit Pro — Tech Stack (Single Source of Truth)

**Last Updated:** February 2026  
**Status:** Enforced — All new code must align with this stack

---

## Module System: ESM Only

- **Root `package.json`:** `"type": "module"` — `.js` files are ESM by default
- **Netlify Functions:** All use `import`/`export` (`.js` extension)
- **Scripts:** ESM (`import`/`export`); no `require()` or `module.exports`
- **Exception:** `netlify/plugins/cache-purge/index.cjs` — Netlify build plugins may require CommonJS; do not convert without verifying Netlify support

---

## Frontend

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Angular | 21.1.x |
| UI Library | PrimeNG | 21.1.x |
| Themes | @primeuix/themes | 2.0.x |
| State | Angular Signals | Built-in |
| Change Detection | Zoneless (optional) | - |
| Styling | SCSS + CSS custom properties | - |
| Package Manager | pnpm | 10.x (angular/) |

---

## Backend

| Layer | Technology |
|-------|-------------|
| Runtime | Node.js 22+ |
| Hosting | Netlify Functions |
| Module | ESM (`import`/`export`) |
| Bundler | esbuild (Netlify default) |

---

## Database

| Layer | Technology |
|-------|-------------|
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Real-time | Supabase Realtime |

---

## Design System

| Resource | Location |
|----------|----------|
| Tokens | `angular/src/scss/tokens/design-system-tokens.scss` |
| Rules | [docs/DESIGN_SYSTEM_RULES.md](./DESIGN_SYSTEM_RULES.md) |
| Deprecated token list | `scripts/lint-design-tokens.js` → `CONFIG.deprecatedTokens` |

---

## Testing

| Type | Runner | Location |
|------|--------|--------|
| Unit | Vitest | angular/ |
| E2E | Playwright | angular/e2e/ |
| Backend | Vitest | tests/integration/ |
| Privacy | Vitest | tests/privacy-safety/ |
| ACWR Logic | Node (ESM) | tests/logic/acwr-regression.test.js |

---

## Commands Reference

| Purpose | Command |
|---------|---------|
| Find legacy dark variables | `npm run refactor:find-dark` |
| Lint design tokens | `npm run lint:tokens` |
| Lint design tokens (CI) | `npm run lint:tokens:ci` |
| Design system check | `npm run lint:design-system` |

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System architecture
- [DESIGN_SYSTEM_RULES.md](./DESIGN_SYSTEM_RULES.md) — UI rules and tokens
- [LEGACY_CODE_GUIDE.md](./LEGACY_CODE_GUIDE.md) — Finding and removing legacy code

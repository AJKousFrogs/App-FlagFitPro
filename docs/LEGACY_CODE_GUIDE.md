# FlagFit Pro — Legacy Code Identification Guide

**Purpose:** Help developers find legacy code that can be safely removed or migrated.  
**Last Updated:** February 2026

---

## 1. Design System / SCSS Legacy

### Deprecated Design Tokens

**Single source of truth:** `scripts/lint-design-tokens.js` → `CONFIG.deprecatedTokens`

**Find violations:**

```bash
npm run lint:tokens
```

**With auto-fix (where supported):**

```bash
npm run lint:tokens:fix
```

**CI mode (fails on violations):**

```bash
npm run lint:tokens:ci
```

### Legacy Dark Mode Variables

Find hardcoded dark-mode colors that should use design tokens:

```bash
npm run refactor:find-dark
```

**Auto-fix mode:**

```bash
npm run refactor:find-dark:fix
```

### Rules (see [DESIGN_SYSTEM_RULES.md](./DESIGN_SYSTEM_RULES.md))

- Hex colors **only** in `design-system-tokens.scss`
- No raw spacing/radius values — use `--space-*` / `--radius-*`
- `--radius-full` (pill) restricted to avatars, progress, toggles, status dots
- Deprecated font tokens → use `--font-h1-size`, `--font-body-size`, etc.

---

## 2. CommonJS (CJS) Legacy

**Status:** ✅ Migration complete. No `.cjs` files remain except:

- `netlify/plugins/cache-purge/index.cjs` — Netlify plugin; may require CJS

**If you find:**

- `require()` or `module.exports` in `.js` files → convert to `import`/`export`
- References to `.cjs` in comments or docs → update to `.js`

---

## 3. Angular Legacy Patterns

| Legacy | Preferred | Action |
|--------|-----------|--------|
| `NgModule` | Standalone components | Remove module, use `standalone: true` |
| `@angular/material` | PrimeNG | Remove Material imports |
| `.subscribe()` without `takeUntilDestroyed` | `takeUntilDestroyed(this.destroyRef)` | Add cleanup |
| `any` in critical paths | Specific interfaces / `unknown` + type guards | Add types |
| Direct `SupabaseService.client` in components | Feature services | Move to services |

---

## 4. Deprecated Code Markers

Search for:

- `@deprecated` JSDoc
- `// DEPRECATED` or `// TODO: remove` comments
- `ApiResponseWrapper` → use `ApiResponse` from `common.models`

---

## 5. Files to Check Regularly

| File / Pattern | Purpose |
|----------------|---------|
| `angular/src/assets/styles/overrides/_exceptions.scss` | Migrate to tokens/mixins |
| `angular/src/**/*.scss` | Run `lint:tokens` to find violations |
| `CLEANUP_BACKLOG.md` | Tracked tech debt items |

---

## 6. Quick Commands Summary

```bash
# Design tokens (deprecated tokens, hardcoded values)
npm run lint:tokens

# Legacy dark variables
npm run refactor:find-dark

# Design system (components, spacing, etc.)
npm run lint:design-system

# Full lint
npm run lint:all
```

---

## Related Documentation

- [TECH_STACK.md](./TECH_STACK.md) — Technology stack
- [DESIGN_SYSTEM_RULES.md](./DESIGN_SYSTEM_RULES.md) — UI rules
- [CLEANUP_BACKLOG.md](../CLEANUP_BACKLOG.md) — Prioritized tech debt

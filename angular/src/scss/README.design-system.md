# FlagFit Pro Design System Contract

**Enforced:** 2026-02-10 | **Single source:** `angular/src/scss/README.design-system.md`

## Canonical Paths

| Asset | Path |
|-------|------|
| **Tokens** | `angular/src/scss/tokens/design-system-tokens.scss` |
| **Global entry** | `angular/src/styles.scss` (only entrypoint in angular.json) |
| **Import order** | tokens (design-system/index) → utilities → components (PrimeNG) → pages → overrides |
| **Spacing utilities** | `.p-*`, `.m-*`, `.gap-*` in design-system-tokens.scss |
| **Flex utilities** | `angular/src/scss/utilities/layout-system.scss` |
| **Non-spacing utilities** | `angular/src/scss/utilities/_utilities.scss` |
| **PrimeNG overrides** | `angular/src/assets/styles/overrides/_component-overrides.scss` (DS-EXC-* / DS-PNGO-* tickets) |
| **Color guards** | `angular/src/assets/styles/overrides/_color-guards.scss` |

## PrimeNG Overrides

1. **Token mapping:** `primeng/_token-mapping.scss` – prefer token mapping over exceptions
2. **Exceptions:** `_component-overrides.scss` – every block requires ticket header (DS-EXC-* or DS-PNGO-*) + removal date
3. **Rules:** Component SCSS may NOT style `.p-*` internals; use overrides layer only
4. **No `::ng-deep` or `:global()`** – refactor to proper selectors in _component-overrides

## Adding Tokens

1. Add primitive in `:root` (design-system-tokens.scss) if new raw value
2. Add semantic alias if needed (e.g. `--color-*`, `--surface-*`)
3. For PrimeNG: add to `_token-mapping.scss` first before creating exception

## Verification Commands

```bash
cd angular && npm run build
npm run lint
npm run test
# From repo root:
npm run lint:css
```

## CSS Layer Order (app.config.ts)

```
reset, tokens, primeng-base, primeng-brand, primitives, features, overrides
```

## Rules (Stylelint)

1. No raw hex outside tokens; use `var(--token)`
2. No hardcoded px for radius/shadow/z-index/transition
3. No `!important` outside `@layer overrides`
4. No PrimeNG selectors in component SCSS

## Component Pattern

1. `:host` + layout; spacing via tokens
2. Use canonical utilities (`.p-*`, `.m-*`, `.gap-*`)
3. PrimeNG internals → _component-overrides.scss only

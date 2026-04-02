# FlagFit Pro Design System Implementation Guide

This file explains where the design system lives in code. It is an implementation guide, not a competing policy document.

Canonical policy docs:

- [docs/DESIGN_SYSTEM_RULES.md](../../../docs/DESIGN_SYSTEM_RULES.md)
- [docs/SINGLE_SOURCE_OF_TRUTH.md](../../../docs/SINGLE_SOURCE_OF_TRUTH.md)
- [docs/ANGULAR_PRIMENG_GUIDE.md](../../../docs/ANGULAR_PRIMENG_GUIDE.md)

## Canonical Paths

| Concern | Path |
| --- | --- |
| Tokens | `angular/src/scss/tokens/design-system-tokens.scss` |
| Global entrypoint | `angular/src/styles.scss` |
| Foundations | `angular/src/scss/foundations/` |
| Utilities | `angular/src/scss/utilities/` |
| Primitives | `angular/src/scss/components/primitives/` |
| PrimeNG theme/integration | `angular/src/scss/components/primeng-theme.scss`, `angular/src/scss/components/primeng-integration.scss` |
| PrimeNG exception layer | `angular/src/assets/styles/overrides/_component-overrides.scss` |
| Color guard layer | `angular/src/assets/styles/overrides/_color-guards.scss` |

## Rules In Practice

- Tokens originate in `design-system-tokens.scss`.
- TS consumers use `design-tokens.util.ts` as the runtime bridge instead of redefining tokens.
- Component SCSS should not style raw PrimeNG internals unless the change belongs in the shared override layer.
- Prefer foundations, utilities, and primitives before adding feature-local CSS recipes.

## Verification

```bash
npm run lint:tokens
npm run lint:css
npm run audit:scss-duplications
cd angular && npm run build
```

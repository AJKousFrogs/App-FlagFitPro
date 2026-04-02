# Angular And PrimeNG Guide

This guide captures the current implementation rules for the Angular workspace and the PrimeNG layer.

## Canonical Sources

- Angular workspace entry: `angular/src/app/`
- Design tokens: `angular/src/scss/tokens/design-system-tokens.scss`
- TS token bridge: `angular/src/app/core/utils/design-tokens.util.ts`
- PrimeNG theme layer: `angular/src/scss/components/primeng-theme.scss`
- PrimeNG integration layer: `angular/src/scss/components/primeng-integration.scss`
- PrimeNG exception layer: `angular/src/assets/styles/overrides/_component-overrides.scss`

Use this guide with:

- [DESIGN_SYSTEM_RULES.md](./DESIGN_SYSTEM_RULES.md)
- [SINGLE_SOURCE_OF_TRUTH.md](./SINGLE_SOURCE_OF_TRUTH.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)

## Angular Rules

- Use standalone components.
- Prefer signals, `computed`, and `effect` for local reactive state.
- Prefer `inject()` for dependency access in new or refactored code.
- Keep route-backed UI in `features/`, app-wide infrastructure in `core/`, and reusable UI in `shared/`.
- Drive shell behavior from route metadata and shared shell services, not hard-coded path lists inside components.

## PrimeNG Rules

- Treat PrimeNG as a rendering library, not the design system.
- Prefer app-owned wrappers such as shared dialog and table components before styling raw `.p-*` internals in feature files.
- Put shared PrimeNG theme behavior in:
  - `primeng-theme.scss`
  - `primeng-integration.scss`
- Put true exceptions only in `_component-overrides.scss`.

## Styling Rules

- Tokens originate in `design-system-tokens.scss`.
- Feature SCSS should use CSS variables and shared primitives, not raw literals.
- Component SCSS should not become a second PrimeNG override layer.
- Responsive behavior should prefer shared mixins and utilities over repeated one-off media queries.

## Dialogs, Tables, And Shared UI

Current preferred patterns:

- dialogs: shared dialog wrapper and `dialogSize` API
- tables: `app-table` surface and density inputs instead of leaking PrimeNG classes
- cards and panels: shared primitives and foundations before local duplication

## Verification

```bash
npm run type-check
npm run lint
npm run lint:css
npm run lint:tokens
npm run build
```

For UI-heavy changes, also run:

```bash
cd angular
npm run e2e:smoke
```

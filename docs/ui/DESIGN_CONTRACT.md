# Design System Contract (Angular 21 + PrimeNG)

Scope: token-first styling for the Angular app. PrimeNG remains the base layer; this contract only defines tokens and thin variable overrides. No component-specific styling belongs in the design system files.

## Source of Truth
- Tokens and utilities live in `angular/src/styles/design-system/`.
- Global load is enforced in `angular/src/styles.scss`.

## Allowed Tokens (use via `var(...)`)
- Typography
  - `--ds-font-family-*`
  - `--ds-font-size-*`
  - `--ds-font-weight-*`
  - `--ds-line-height-*`
- Spacing
  - `--ds-space-*`
- Radii
  - `--ds-radius-*`
- Elevation
  - `--ds-shadow-*`
- Semantic colors
  - `--ds-color-success*`
  - `--ds-color-warning*`
  - `--ds-color-danger*`
  - `--ds-color-info*`
  - `--ds-color-neutral*`
  - `--ds-color-brand*`
- Interaction states
  - `--ds-state-*`
- Control heights
  - `--ds-input-height-*`
  - `--ds-button-height-*`

## Allowed Utilities
- Typography mixins/classes in `angular/src/styles/design-system/typography.scss`.
- State mixins/classes in `angular/src/styles/design-system/states.scss`.

## Forbidden Patterns
- Component or feature selectors inside `angular/src/styles/design-system/*`.
- Overriding PrimeNG classes outside variable-based overrides.
- Hard-coded hex/rgb/hsl colors in component styles when a semantic token exists.
- New `font-family`, `font-size`, or `line-height` values that are not tokens.
- Ad-hoc px spacing when a `--ds-space-*` token matches the intent.

## Usage Notes
- Prefer `var(--ds-...)` tokens in component SCSS and templates.
- If a token is missing, add it to `design-tokens.scss` before using it.
- PrimeNG token mapping stays in its existing files; this contract only extends via CSS variables.

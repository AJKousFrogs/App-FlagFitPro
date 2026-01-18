# PrimeIcons Migration

## Replacements Made (Old -> New)
- `aria-dialog` close icon SVG -> `pi pi-times`
- `aria-button` loading SVG -> `pi pi-spin pi-spinner`
- `app-button` loading SVG -> `pi pi-spin pi-spinner`
- `app-icon-button` loading SVG -> `pi pi-spin pi-spinner`
- `success-checkmark` SVG -> `pi pi-check-circle` (or `pi pi-check` for minimal)

## Icon Size Tokens
Defined in `styles/design-system/design-tokens.scss`:
- `--ds-icon-size-2xs`, `--ds-icon-size-xs`, `--ds-icon-size-sm`, `--ds-icon-size-md`
- `--ds-icon-size-lg`, `--ds-icon-size-xl`, `--ds-icon-size-2xl`, `--ds-icon-size-3xl`
- Context tokens: `--ds-icon-size-inline`, `--ds-icon-size-button`, `--ds-icon-size-icon-button`

## Standardization
- PrimeIcons inherit `currentColor` via `assets/styles/primitives/_icons.scss`
- Button and icon-button spinners sized via icon tokens

## Exceptions (Justified)
Inline SVG used for non-icon visualizations:
- `shared/components/rest-timer/rest-timer.component.ts` (progress ring)
- `shared/components/progress-indicator/progress-indicator.component.ts` (circular progress)
- `shared/components/countdown-timer/countdown-timer.component.ts` (ring timer)
- `shared/components/metric-ring/metric-ring.component.ts` (metric ring)

## Audit Notes
- No Font Awesome or Material Icons found in templates/components.

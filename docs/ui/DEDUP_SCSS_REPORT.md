# SCSS Deduplication Report

## Repeated Patterns Found
- Card surface blocks with repeated `background`, `border-radius`, `padding`, `box-shadow`
- Toolbar/filter bars repeating `display:flex`, `gap`, `align-items`, plus card-like surface styling

## Consolidated Into
- `angular/src/styles/design-system/utilities.scss`
  - `ds-card-surface` utility class (base surface with configurable CSS variables)
  - `ds-toolbar` and `ds-toolbar--card` utility classes (layout + surface)

## Files Updated
- `angular/src/styles/design-system/utilities.scss`
- `angular/src/app/features/roster/components/roster-filters.component.scss`
- `angular/src/app/features/exercise-library/exercise-library.component.scss`

## Remaining Exceptions (Justified)
- Component-specific card variants and animation states remain in component SCSS where layout or behavior is unique (e.g., animated cards).
- PrimeNG overrides remain in canonical pages flagged for cleanup in their own TODO notes (avoided to prevent scope creep).

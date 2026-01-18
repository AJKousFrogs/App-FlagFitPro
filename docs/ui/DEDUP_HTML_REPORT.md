# HTML Deduplication Report

## Repeated Structures Found
- Filter/toolbars with consistent “search + filters + actions” layout
- Card-like filter sections that duplicate surface markup

## Consolidated Into
- Design system utility classes (`ds-toolbar`, `ds-card-surface`) applied directly in templates

## Files Updated
- `angular/src/app/features/roster/components/roster-filters.component.ts`
- `angular/src/app/features/exercise-library/exercise-library.component.ts`

## Remaining Exceptions (Justified)
- Global header search uses PrimeNG input groups for shortcut affordance and read-only behavior.
- Search panel uses a direct input element for focus management and keyboard navigation; replacing with `app-search-input` would require additional event forwarding.

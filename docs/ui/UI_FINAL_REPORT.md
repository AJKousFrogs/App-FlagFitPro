# UI Final Report

**Last Updated:** January 18, 2026

This document summarizes the design system cleanup phases and documents remaining exceptions and enforcement mechanisms.

## Summary

The UI cleanup consolidated design tokens, removed deprecated patterns, and added automated guardrails to prevent regressions.

---

## What Changed Across All Phases

### Phase 1: Color + Status Tokens
- Status variants standardized to `--ds-status-*` tokens
- Unified status mapping in `status.utils.ts` and shared components
- Removed hardcoded hex colors from component SCSS (migrated to tokens)

### Phase 2: Icon System
- PrimeIcons adopted across all core components
- Tokenized sizing with `--ds-icon-size-*` scale
- Removed `!important` from icon size classes (CSS layers handle specificity)

### Phase 3: Spacing Migration
- Hardcoded layout px values replaced with `--space-*` tokens
- Shared layout rhythms standardized across components
- Component padding/margin use design tokens consistently

### Phase 4: State Consistency
- Global state rules centralized in `states.scss`
- Interactive element states (`hover`, `focus`, `active`, `disabled`) use shared mixins
- Focus ring consistency for keyboard accessibility

### Phase 5: Search UI Consolidation
- Created `design-system/utilities.scss` with shared search bar patterns
- Added `app-search-input` component as the single source of truth
- Simplified component SCSS by using CSS custom property variants:
  - `.ds-search-bar--flush` (borderless, transparent)
  - `.ds-search-bar--card` (elevated surface)
  - `.ds-search-bar--hero` (large, prominent)
  - `.ds-search-bar--pill` (rounded input)
- Components now customize via CSS variables instead of duplicating rules

### Phase 6: Dialog + Override Cleanup
- Inline dialog styles removed from templates
- Styles moved to documented overrides in `_exceptions.scss`
- `::ng-deep` usage removed from all component files

### Phase 7: Guardrails + Enforcement (This Phase)
- Stylelint rules strengthened for design token enforcement
- Added `::ng-deep` deprecation warning in stylelint
- ESLint template rule enforces no inline styles
- CI checks updated for comprehensive enforcement

---

## Remaining Known Exceptions (with justification)

### 1. Legacy `!important` in `@layer overrides`

**Location:** `assets/styles/overrides/_exceptions.scss`

**Justification:** PrimeNG and legacy UI require `!important` for deep style overrides. All exceptions are documented with:
- Ticket reference (e.g., `DS-LEGACY-001`)
- Owner
- Remove-by date
- Explanation

**Status:** Will be deprecated as PrimeNG exposes more CSS custom properties.

### 2. Hardcoded px in legacy files

**Location:** Various legacy SCSS files

**Justification:** Large legacy surface area contains px values. New rule is warning-only to avoid breaking builds during migration.

**Status:** Warnings logged; gradual migration ongoing.

### 3. Dynamic inline styles for runtime values

**Location:** Specific templates (e.g., progress bars, dynamic widths)

**Example:** `[style.width.%]="progress"` in `data-source-banner`

**Justification:** Dynamic values computed at runtime cannot be moved to SCSS. These are explicitly allowed for:
- Dynamic widths/heights based on data
- Animation transforms computed from state
- Progress indicators

**Status:** ESLint rule allows `[style.*]` for individual properties while blocking full `style="..."` attributes.

### 4. Specialized header search

**Location:** `header.component.scss`

**Justification:** The global header search uses a unique input-group layout with PrimeNG integration that requires custom styling. Uses global overrides.

**Status:** Remains custom until header redesign.

### 5. Accessibility: Reduced Motion

**Location:** `states.scss` lines 53-54

**Code:**
```scss
html.ds-initial-render,
html.ds-initial-render * {
  transition: none !important;
  animation-duration: 0.01ms !important;
}
```

**Justification:** Required to prevent animation blur on initial render. The `!important` is necessary to override all transition/animation rules.

**Status:** Permanent exception for accessibility compliance.

---

## Enforcement Going Forward

### Stylelint Rules

| Rule | Severity | What it Blocks |
|------|----------|----------------|
| `declaration-no-important` | Error | New `!important` outside `@layer overrides` |
| `color-no-hex` | Error | Hex colors outside token files |
| `declaration-property-value-disallowed-list` | Warning | Hardcoded px values, raw z-index, transition: all |
| `selector-disallowed-list` | Warning | `::ng-deep` usage (deprecated) |

### ESLint Rules

| Rule | Severity | What it Blocks |
|------|----------|----------------|
| `@angular-eslint/template/no-inline-styles` | Error | `style=`, `[style]=`, `[ngStyle]=` in templates |

### CI Checks

| Script | Purpose |
|--------|---------|
| `scripts/lint-changed-files.sh` | Runs stylelint on changed SCSS files |
| `scripts/check-inline-styles.sh` | Fails changed HTML with inline styles |
| `scripts/check-rounded-attribute.sh` | Blocks `[rounded]="true"` usage |
| `scripts/check-primeng-selectors.sh` | Warns on `.p-*` selectors in component SCSS |

### Preferred Patterns

#### Search Bars
Use `app-search-input` component with CSS custom property variants:

```html
<!-- Hero search (large, prominent) -->
<div class="ds-search-bar--hero">
  <app-search-input placeholder="Search..." />
</div>

<!-- Card search (elevated surface) -->
<div class="ds-search-bar--card">
  <app-search-input placeholder="Search..." />
</div>

<!-- Flush search (no border/background) -->
<div class="ds-search-bar--flush">
  <app-search-input placeholder="Search..." />
</div>
```

#### Dialog Sizing
Move dialog sizing and content layout into documented overrides:

```scss
// In _exceptions.scss with proper documentation
@layer overrides {
  /* Ticket: DS-XXX | Owner: @dev | Remove by: YYYY-MM-DD */
  .my-dialog {
    .p-dialog {
      width: var(--dialog-width-lg);
    }
  }
}
```

#### Icon Sizing
Use standardized icon size classes:

```html
<i class="pi pi-check icon-sm"></i>
<i class="pi pi-star icon-md icon-primary"></i>
```

---

## Migration Checklist for New Components

1. **Colors:** Use `var(--ds-*)` or `var(--color-*)` tokens
2. **Spacing:** Use `var(--space-*)` tokens
3. **Icons:** Use PrimeIcons with `icon-*` size classes
4. **States:** Import and use `states.scss` mixins
5. **Search:** Use `app-search-input` component
6. **No `!important`:** Use CSS layers or raise exception with ticket
7. **No `::ng-deep`:** Use CSS custom properties or global overrides

---

## Files Modified in Final Cleanup

- `angular/src/styles/design-system/utilities.scss` - Expanded search bar variants
- `angular/src/assets/styles/primitives/_icons.scss` - Removed `!important` from icon sizes
- `angular/src/app/features/training/video-feed/video-feed.component.scss` - Simplified search
- `angular/src/app/features/exercise-library/exercise-library.component.scss` - Simplified search
- `angular/src/app/features/ai-coach/ai-coach-chat.component.scss` - Simplified search
- `angular/src/app/features/coach/knowledge-base/knowledge-base.component.scss` - Simplified search
- `angular/src/app/features/roster/components/roster-filters.component.scss` - Simplified search
- `.stylelintrc.cjs` - Added `::ng-deep` deprecation warning
- `angular/eslint.config.mjs` - Documented template rules

---

## Metrics

| Metric | Before | After |
|--------|--------|-------|
| `!important` in component SCSS | 8+ files | 0 (moved to overrides) |
| `::ng-deep` instances | 27 | 0 (removed) |
| Duplicated search bar patterns | 6+ files | 1 utility file |
| Inline styles in templates | ~5 | 0 (except dynamic values) |

---

## Next Steps

1. **Q2 2026:** Review and remove expired exceptions in `_exceptions.scss`
2. **Ongoing:** Monitor stylelint warnings and migrate hardcoded values
3. **Future:** Consider removing PrimeNG overrides as they expose more CSS variables

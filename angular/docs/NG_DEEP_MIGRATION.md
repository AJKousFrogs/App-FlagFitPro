# ::ng-deep Migration Report

**Date:** January 5, 2026  
**Status:** ✅ Complete  
**Scope:** FlagFit Pro Composite Views - Child Header Visibility

---

## Executive Summary

All `::ng-deep` usages in FlagFit Pro have been migrated to CSS custom properties or ViewEncapsulation patterns. This eliminates the deprecated `::ng-deep` pseudo-class while maintaining the same functionality.

---

## Migration Pattern: Composite View Child Headers

### Problem

Composite views (like QB Hub) embed child components that have their own page headers. The parent needs to hide these redundant headers.

### Before (❌ Deprecated)

```typescript
// qb-hub.component.ts - BEFORE
@Component({
  selector: "app-qb-hub",
  styles: [
    `
      /* Remove redundant headers from child components when inside the hub */
      :host ::ng-deep app-page-header {
        display: none;
      }
      :host > app-main-layout > .qb-hub-page > app-page-header {
        display: block;
      }
    `,
  ],
})
export class QbHubComponent {}
```

**Issues:**

- `::ng-deep` is deprecated and will be removed
- Creates style specificity wars
- Breaks encapsulation principles
- Hard to maintain and debug

### After (✅ CSS Custom Properties)

```typescript
// qb-hub.component.ts - AFTER
@Component({
  selector: "app-qb-hub",
  styles: [
    `
      .qb-hub-page {
        padding: var(--spacing-4);

        /* Hub's own header should display normally */
        > app-page-header {
          --page-header-display: block;
        }
      }

      .hub-tab-content {
        padding: var(--spacing-6) 0;

        /*
       * COMPOSITE VIEW PATTERN
       * Child components inherit this CSS variable which hides their headers.
       * PageHeaderComponent reads --page-header-display on :host.
       * No ::ng-deep needed - CSS custom properties cascade through encapsulation.
       */
        --page-header-display: none;
      }
    `,
  ],
})
export class QbHubComponent {}
```

```scss
// page-header.component.scss - AFTER
:host {
  // Inherit display from CSS custom property, default to block
  display: var(--page-header-display, block);
}

.page-header {
  // Support explicit hiding via input binding
  &.hidden-in-composite {
    display: none;
  }
}
```

```typescript
// page-header.component.ts - AFTER
@Component({
  selector: "app-page-header",
  // ...
})
export class PageHeaderComponent {
  /**
   * When true, header will be hidden when inside a composite view.
   * Composite views set --page-header-display: none via CSS.
   * This input allows explicit control when CSS cascade isn't sufficient.
   */
  hideInComposite = input<boolean>(false);
}
```

**Benefits:**

- Uses standard CSS cascade (custom properties pierce Shadow DOM)
- No deprecated APIs
- Clean separation of concerns
- Easy to understand and maintain
- Works with Angular's view encapsulation

---

## How It Works

1. **PageHeaderComponent** declares `:host { display: var(--page-header-display, block); }`
2. **Default behavior**: Headers display normally (fallback to `block`)
3. **Composite views** set `--page-header-display: none` on container elements
4. **CSS cascade** naturally flows the variable into child components
5. **No encapsulation piercing** needed - custom properties work through encapsulation

---

## Files Changed

| File                         | Change                                                        |
| ---------------------------- | ------------------------------------------------------------- |
| `qb-hub.component.ts`        | Replaced `::ng-deep` with CSS custom property pattern         |
| `page-header.component.scss` | Added `:host { display: var(--page-header-display, block); }` |
| `page-header.component.ts`   | Added `hideInComposite` input for explicit control            |

---

## Testing

Vitest tests verify:

1. PageHeader displays by default (`--page-header-display` not set)
2. PageHeader hides when `--page-header-display: none` is set by parent
3. PageHeader respects `hideInComposite` input binding
4. Composite views correctly hide child headers but show their own

See: `angular/src/app/shared/components/page-header/page-header.component.spec.ts`

---

## Other Composite View Candidates

This pattern can be applied to any composite view that embeds child components with headers:

| Composite View                  | Child Components                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------- |
| `QbHubComponent`                | `QbThrowingTrackerComponent`, `QbAssessmentToolsComponent`, `QbTrainingScheduleComponent` |
| Future: `CoachHubComponent`     | Various coach tools                                                                       |
| Future: `AnalyticsHubComponent` | Various analytics widgets                                                                 |

---

## Migration Checklist

- [x] Identify all `::ng-deep` usages
- [x] Migrate to CSS custom properties
- [x] Update child components to read CSS variables
- [x] Add fallback values for standalone usage
- [x] Create Vitest tests for visibility
- [x] Run lint-fix
- [x] Verify no regressions

---

## References

- [Angular Style Guide - View Encapsulation](https://angular.io/guide/view-encapsulation)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [FlagFit Design System Rules](../docs/DESIGN_SYSTEM_RULES.md)

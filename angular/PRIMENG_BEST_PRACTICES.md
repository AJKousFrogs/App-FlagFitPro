# PrimeNG Integration Best Practices - FlagFit Pro

**Last Updated**: January 2026
**Angular Version**: 21
**PrimeNG Version**: 21

---

## Table of Contents

1. [Component Usage Guidelines](#component-usage-guidelines)
2. [Theming & Customization](#theming--customization)
3. [Animation Best Practices](#animation-best-practices)
4. [Common Patterns](#common-patterns)
5. [Migration Guide](#migration-guide)
6. [Troubleshooting](#troubleshooting)

---

## Component Usage Guidelines

### ✅ DO: Use PrimeNG Components Directly

**Always prefer PrimeNG components over custom implementations.**

```typescript
// ✅ GOOD - Use PrimeNG directly
import { DialogModule } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';

@Component({
  imports: [DialogModule, Select, TableModule],
  template: `
    <p-dialog [(visible)]="showDialog" header="My Dialog">
      <p>Dialog content</p>
    </p-dialog>
  `
})
```

```typescript
// ❌ BAD - Don't create custom wrappers
import { ModalComponent } from './modal.component'; // Don't do this!

@Component({
  imports: [ModalComponent],
  template: `<app-modal [visible]="show">...</app-modal>`
})
```

### Component Recommendations

| Use Case                | PrimeNG Component              | Import                       |
| ----------------------- | ------------------------------ | ---------------------------- |
| **Dialogs/Modals**      | `<p-dialog>`                   | `DialogModule`               |
| **Dropdowns/Selects**   | `<p-select>` or `<p-dropdown>` | `Select` or `DropdownModule` |
| **Data Tables**         | `<p-table>` or `<p-datatable>` | `TableModule`                |
| **Date Picking**        | `<p-datePicker>`               | `DatePicker`                 |
| **Progress Indicators** | `<p-progressSpinner>`          | `ProgressSpinnerModule`      |
| **Tooltips**            | `pTooltip` directive           | `TooltipModule`              |
| **Tabs**                | `<p-tabView>`                  | `TabViewModule`              |
| **Overlays**            | `<p-overlayPanel>`             | `OverlayPanelModule`         |
| **Pagination**          | `<p-paginator>`                | `PaginatorModule`            |
| **Carousels**           | `<p-carousel>`                 | `CarouselModule`             |

---

## Theming & Customization

### Use CSS Variables, Not ::ng-deep

**PrimeNG 21 uses CSS custom properties for theming. Customize via CSS variables instead of ::ng-deep.**

```scss
// ✅ GOOD - Use CSS variables
:root {
  --p-primary-color: var(--ds-primary-green);
  --p-primary-contrast-color: #ffffff;
  --p-surface-card: var(--surface-card);
}

// Component-specific customization
.my-dialog {
  --p-dialog-border-radius: var(--radius-xl);
  --p-dialog-padding: var(--space-6);
}
```

```scss
// ❌ BAD - Avoid ::ng-deep
:host ::ng-deep {
  .p-dialog {
    border-radius: 16px; // Don't do this!
    padding: 2rem;
  }
}
```

### When ::ng-deep is Acceptable

::ng-deep should **ONLY** be used when:

1. CSS variables don't provide the needed customization
2. The style is scoped with `:host`
3. You're using design system tokens

```scss
// ⚠️ ACCEPTABLE (but minimize usage)
:host ::ng-deep {
  .p-tabview-nav-link-active {
    background: var(--ds-primary-green); // Using design token
    color: var(--color-text-on-primary);
  }
}
```

### PrimeNG Theme Integration

Your `primeng-integration.scss` file maps design tokens to PrimeNG:

```scss
@use "./assets/styles/primeng-integration.scss" as *;
```

**Key mappings**:

- `--ds-primary-green` → `--p-primary-color`
- `--surface-card` → `--p-surface-card`
- `--color-border-secondary` → `--p-surface-border`

---

## Animation Best Practices

### Use Centralized Animations

Import from the shared animations file instead of defining @keyframes in every component:

```scss
// ✅ GOOD - Use shared animations
@use "styles/animations" as *;

.my-element {
  animation: fadeIn 300ms ease-out;
}

.spinner {
  animation: spin 1s linear infinite;
}
```

```scss
// ❌ BAD - Don't duplicate animations
@keyframes fadeIn {
  /* ... */
}
@keyframes spin {
  /* ... */
}
```

### Available Shared Animations

From `src/app/shared/styles/animations.scss`:

| Animation | Use Case                  | Example                                                       |
| --------- | ------------------------- | ------------------------------------------------------------- |
| `fadeIn`  | Smooth element appearance | `animation: fadeIn 300ms ease-out;`                           |
| `slideUp` | Bottom-to-top transitions | `animation: slideUp 200ms ease-out;`                          |
| `scaleIn` | Zoom-in effects           | `animation: scaleIn 200ms cubic-bezier(0.34, 1.56, 0.64, 1);` |
| `spin`    | Loading spinners          | `animation: spin 1s linear infinite;`                         |
| `pulse`   | Attention grabbers        | `animation: pulse 2s ease-in-out infinite;`                   |
| `bounce`  | Playful interactions      | `animation: bounce 1s ease-in-out;`                           |

### Respect Reduced Motion

Always wrap animations with reduced motion support:

```scss
@use "styles/animations" as *;

.animated-element {
  @include with-motion {
    animation: fadeIn 300ms ease-out;
  }
}

// Or apply globally
* {
  @media (prefers-reduced-motion: reduce) {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Common Patterns

### Pattern 1: Dialog with Custom Header

```typescript
@Component({
  template: `
    <p-dialog
      [(visible)]="showDialog"
      [modal]="true"
      [closable]="true"
      [style]="{ width: '50vw' }"
      header="My Custom Dialog"
    >
      <ng-template pTemplate="header">
        <div class="dialog-header-custom">
          <i class="pi pi-info-circle"></i>
          <div>
            <h3>{{ title }}</h3>
            <p>{{ subtitle }}</p>
          </div>
        </div>
      </ng-template>

      <p>Dialog content goes here</p>

      <ng-template pTemplate="footer">
        <p-button label="Cancel" severity="secondary" (onClick)="close()" />
        <p-button label="Confirm" (onClick)="confirm()" />
      </ng-template>
    </p-dialog>
  `
})
```

### Pattern 2: Select with Form Integration

```typescript
@Component({
  template: `
    <form [formGroup]="form">
      <p-select
        formControlName="position"
        [options]="positions"
        optionLabel="label"
        optionValue="value"
        placeholder="Select Position"
        appendTo="body"
        [style]="{ width: '100%' }"
      />
    </form>
  `,
})
export class MyComponent {
  positions = [
    { label: "Quarterback", value: "QB" },
    { label: "Wide Receiver", value: "WR" },
    // ...
  ];

  form = inject(FormBuilder).group({
    position: [""],
  });
}
```

### Pattern 3: DataTable with Sorting & Pagination

```typescript
@Component({
  template: `
    <p-table
      [value]="players()"
      [rows]="10"
      [paginator]="true"
      [rowsPerPageOptions]="[10, 25, 50]"
      [sortField]="sortField"
      [sortOrder]="sortOrder"
      [loading]="loading()"
      styleClass="p-datatable-sm"
    >
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="name">
            Name <p-sortIcon field="name" />
          </th>
          <th pSortableColumn="position">
            Position <p-sortIcon field="position" />
          </th>
        </tr>
      </ng-template>

      <ng-template pTemplate="body" let-player>
        <tr>
          <td>{{ player.name }}</td>
          <td>{{ player.position }}</td>
        </tr>
      </ng-template>
    </p-table>
  `
})
```

---

## Migration Guide

### Migrating from Custom Components

#### Step 1: Identify Custom Component Usage

```bash
# Search for custom component usage
grep -r "<app-modal" src/app
grep -r "app-select" src/app
```

#### Step 2: Replace with PrimeNG

```diff
- <app-modal [visible]="show" (close)="onClose()">
+ <p-dialog [(visible)]="show" (onHide)="onClose()">
    <p>Content</p>
- </app-modal>
+ </p-dialog>
```

#### Step 3: Update Imports

```diff
@Component({
  imports: [
-   ModalComponent,
+   DialogModule,
  ]
})
```

#### Step 4: Test & Verify

- Ensure visual appearance matches design system
- Test keyboard navigation (Tab, Esc, Enter)
- Verify screen reader compatibility
- Check mobile responsiveness

---

## Troubleshooting

### Issue: Styles Not Applying

**Problem**: PrimeNG component styles aren't showing up.

**Solution**:

1. Verify `primeng-integration.scss` is imported in `styles.scss`
2. Check that `primeng-theme.scss` comes AFTER integration
3. Ensure component imports `DialogModule` (not just uses `<p-dialog>`)

```scss
// ✅ Correct order in styles.scss
@use "./assets/styles/primeng-integration.scss" as *;
@use "./assets/styles/primeng-theme.scss" as *;
```

### Issue: Dialog Not Closing on Escape

**Problem**: Dialog doesn't close when pressing Escape key.

**Solution**: Set `[closeOnEscape]="true"` (default is true, but verify).

```html
<p-dialog
  [(visible)]="showDialog"
  [closeOnEscape]="true"
  [dismissableMask]="true"
></p-dialog>
```

### Issue: Select Dropdown Cut Off

**Problem**: Dropdown options are clipped by parent container.

**Solution**: Use `appendTo="body"` to render dropdown in body.

```html
<p-select [options]="items" appendTo="body" />
```

### Issue: Table Pagination Not Working

**Problem**: Paginator shows but doesn't paginate.

**Solution**: Ensure `[rows]` and `[paginator]="true"` are set.

```html
<p-table
  [value]="data"
  [rows]="10"
  [paginator]="true"
  [rowsPerPageOptions]="[10, 25, 50]"
></p-table>
```

---

## Performance Tips

### 1. Use Virtual Scrolling for Large Lists

```html
<p-table
  [value]="largeDataset"
  [scrollable]="true"
  scrollHeight="400px"
  [virtualScroll]="true"
  [virtualScrollItemSize]="46"
></p-table>
```

### 2. Lazy Load Table Data

```typescript
loadData(event: TableLazyLoadEvent) {
  this.loading.set(true);

  this.apiService.getPlayers({
    page: event.first / event.rows,
    size: event.rows,
    sortField: event.sortField,
    sortOrder: event.sortOrder
  }).subscribe(data => {
    this.players.set(data.items);
    this.totalRecords = data.total;
    this.loading.set(false);
  });
}
```

```html
<p-table
  [value]="players()"
  [lazy]="true"
  [totalRecords]="totalRecords"
  (onLazyLoad)="loadData($event)"
></p-table>
```

### 3. Use OnPush Change Detection

All PrimeNG components work with OnPush:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogModule]
})
```

---

## Accessibility Guidelines

### 1. Always Provide Labels

```html
<!-- ✅ GOOD -->
<label for="position-select">Select Position</label>
<p-select inputId="position-select" [options]="positions" />

<!-- ❌ BAD -->
<p-select [options]="positions" />
```

### 2. Use Semantic Header Levels

```html
<p-dialog header="Settings">
  <!-- h2 by default -->
  <h3>Subsection</h3>
  <!-- Continue hierarchy -->
</p-dialog>
```

### 3. Provide ARIA Labels for Icon Buttons

```html
<p-button
  icon="pi pi-trash"
  [text]="true"
  [rounded]="true"
  aria-label="Delete player"
  (onClick)="delete()"
/>
```

---

## Code Review Checklist

When reviewing code with PrimeNG components:

- [ ] No custom wrappers around PrimeNG components
- [ ] CSS variables used instead of ::ng-deep (when possible)
- [ ] Design tokens used (not hardcoded values)
- [ ] Shared animations imported (not duplicated @keyframes)
- [ ] `appendTo="body"` used for dropdowns in containers
- [ ] Accessibility: labels, ARIA attributes present
- [ ] OnPush change detection enabled
- [ ] No hardcoded colors/spacing (use tokens)
- [ ] Reduced motion support included
- [ ] Mobile responsive (test at 375px width)

---

## Additional Resources

- [PrimeNG Documentation](https://primeng.org/)
- [PrimeNG GitHub](https://github.com/primefaces/primeng)
- [Angular 21 Documentation](https://angular.dev/)
- [Design System Documentation](./DESIGN_SYSTEM_FIXES_SUMMARY.md)
- [Animation Utilities](./src/app/shared/styles/animations.scss)

---

## Questions or Issues?

If you encounter issues not covered here:

1. Check PrimeNG documentation first
2. Review existing component usage in the codebase
3. Search closed issues on PrimeNG GitHub
4. Ask in team Slack #frontend-dev channel

---

**Remember**: The goal is consistency and maintainability. Always prefer PrimeNG's built-in features over custom implementations.

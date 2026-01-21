# PrimeNG Design System

**Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Status:** ✅ Active

This document defines the standardized design system for FlagFit Pro using PrimeNG 21 components and patterns.

---

## 1. Spacing Scale

### Standard Spacing Units

Based on 4px base unit:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight spacing (icon padding) |
| `--space-2` | 8px | Small gaps (form field spacing) |
| `--space-3` | 12px | Medium gaps (card padding) |
| `--space-4` | 16px | Standard gaps (section spacing) |
| `--space-5` | 20px | Large gaps (use sparingly) |
| `--space-6` | 24px | Extra large gaps (page sections) |
| `--space-8` | 32px | Section spacing |
| `--space-12` | 48px | Major section spacing |
| `--space-16` | 64px | Page-level spacing |

### Usage Rules

1. **Always use design tokens:**
   ```scss
   // ✅ Good
   padding: var(--space-4);
   margin-bottom: var(--space-6);
   
   // ❌ Bad
   padding: 16px;
   margin-bottom: 24px;
   ```

2. **Use PrimeNG component props when available:**
   ```typescript
   // ✅ Good
   <p-card [style]="{ padding: '1rem' }">
   
   // ✅ Also Good (using tokens)
   <p-card [style]="{ padding: 'var(--space-4)' }">
   ```

3. **Avoid arbitrary values:**
   ```scss
   // ❌ Bad
   margin: 13px;
   padding: 7px;
   ```

---

## 2. Form Field Standards

### Standard Form Field Structure

```html
<div class="field">
  <!-- Label (required) -->
  <label for="field-id" class="block mb-2">
    Label Text
    @if (required) {
      <span class="text-red-500" aria-label="required">*</span>
    }
  </label>
  
  <!-- Input -->
  <input
    pInputText
    id="field-id"
    name="field-name"
    [(ngModel)]="value"
    [class.p-invalid]="hasError()"
    [attr.aria-invalid]="hasError()"
    [attr.aria-required]="required"
    [attr.aria-describedby]="getAriaDescribedBy()"
  />
  
  <!-- Hint Text (optional, shown when no error) -->
  @if (hint && !hasError()) {
    <small [id]="fieldId + '-hint'" class="p-field-hint">
      {{ hint }}
    </small>
  }
  
  <!-- Error Message (shown when error exists) -->
  @if (hasError()) {
    <small [id]="fieldId + '-error'" class="p-error" role="alert">
      <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
      {{ errorMessage }}
    </small>
  }
</div>
```

### Form Field Sizes

| Size | Height | Usage |
|------|--------|-------|
| `small` | 32px | Mobile, compact forms |
| `default` | 40px | Standard desktop forms |
| `large` | 48px | Prominent fields, hero forms |

**Usage:**
```typescript
<input pInputText [size]="'small'" />
<p-select [size]="'small'" />
<p-datepicker [size]="'small'" />
```

### Validation States

**Error State:**
- Add `p-invalid` class to input
- Set `aria-invalid="true"`
- Show error message with `p-error` class
- Use `role="alert"` on error message

**Success State:**
- Add `p-valid` class (optional)
- Show success icon/message (optional)

**Example:**
```html
<input
  pInputText
  [class.p-invalid]="emailError"
  [attr.aria-invalid]="!!emailError"
/>
@if (emailError) {
  <small class="p-error" role="alert">{{ emailError }}</small>
}
```

---

## 3. Button Standards

### Button Variants

Use `app-button` component (wrapper around PrimeNG patterns):

| Variant | Usage |
|---------|-------|
| `primary` | Primary actions (Save, Submit, Continue) |
| `secondary` | Secondary actions (Cancel, Back) |
| `outlined` | Tertiary actions (View Details) |
| `text` | Subtle actions (Learn More) |
| `danger` | Destructive actions (Delete, Remove) |
| `success` | Success actions (Approve, Confirm) |

### Button Sizes

| Size | Height | Usage |
|------|--------|-------|
| `sm` | 32px | Compact UI, mobile |
| `md` | 40px | Standard (default) |
| `lg` | 48px | Prominent CTAs |

### Button Usage Patterns

**Primary Action:**
```html
<app-button variant="primary" (clicked)="save()">
  Save Changes
</app-button>
```

**With Icon:**
```html
<app-button variant="primary" iconLeft="pi-check" (clicked)="save()">
  Save
</app-button>
```

**Icon-Only (must have aria-label):**
```html
<app-button
  variant="text"
  iconLeft="pi-times"
  [iconOnly]="true"
  ariaLabel="Close dialog"
  (clicked)="close()"
/>
```

**Loading State:**
```html
<app-button
  variant="primary"
  [loading]="isSaving"
  (clicked)="save()"
>
  Save
</app-button>
```

**Full Width:**
```html
<app-button variant="primary" [fullWidth]="true" (clicked)="submit()">
  Submit Form
</app-button>
```

---

## 4. Overlay Components

### Dialog (Modal)

**Use `app-modal` wrapper for consistency:**

```html
<app-modal
  [(visible)]="showDialog"
  header="Dialog Title"
  [modal]="true"
  [closable]="true"
  [draggable]="false"
  [resizable]="false"
  size="md"
>
  <!-- Content -->
  <p>Dialog content here</p>
  
  <!-- Footer -->
  <ng-container footer>
    <app-button variant="text" (clicked)="showDialog = false">
      Cancel
    </app-button>
    <app-button variant="primary" (clicked)="save()">
      Save
    </app-button>
  </ng-container>
</app-modal>
```

**Dialog Sizes:**
- `sm`: 400px width
- `md`: 560px width (default)
- `lg`: 800px width
- `xl`: 1140px width
- `full`: 95vw width

**Dialog Best Practices:**
- Always provide a header
- Use `[modal]="true"` for important dialogs
- Set `[dismissableMask]="false"` to prevent accidental closes
- Provide clear Cancel/Confirm actions
- Return focus to trigger element on close

### Toast Notifications

**Use `ToastService` for all notifications:**

```typescript
// In component
private toastService = inject(ToastService);

// Success
this.toastService.showSuccess('Changes saved successfully');

// Error
this.toastService.showError('Failed to save changes');

// Info
this.toastService.showInfo('New data available');

// Warning
this.toastService.showWarning('Please review your input');
```

**Toast Configuration:**
- Position: `top-right` (default)
- Duration: 3000ms (default)
- Stack: Multiple toasts stack vertically
- Auto-dismiss: Enabled by default

**Place `<app-toast>` once in app root:**
```html
<!-- app.component.html -->
<app-toast />
```

### OverlayPanel

**For dropdown menus and popovers:**

```html
<p-overlayPanel #op>
  <div class="p-4">
    <p>Overlay content</p>
  </div>
</p-overlayPanel>

<app-button (clicked)="op.toggle($event)">
  Show Overlay
</app-button>
```

---

## 5. Table Standards

### Standard DataTable Pattern

```html
<p-table
  [value]="data()"
  [loading]="loading()"
  [paginator]="true"
  [rows]="10"
  [rowsPerPageOptions]="[10, 25, 50, 100]"
  [showCurrentPageReport]="true"
  currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
  [emptyMessage]="'No data available'"
  styleClass="p-datatable-sm"
  [tableStyle]="{ 'min-width': '50rem' }"
>
  <!-- Header -->
  <ng-template pTemplate="header">
    <tr>
      <th pSortableColumn="name">
        Name
        <p-sortIcon field="name" />
      </th>
      <th>Actions</th>
    </tr>
  </ng-template>
  
  <!-- Body -->
  <ng-template pTemplate="body" let-item>
    <tr>
      <td>{{ item.name }}</td>
      <td>
        <app-button
          variant="text"
          iconLeft="pi-pencil"
          [iconOnly]="true"
          ariaLabel="Edit item"
          (clicked)="edit(item)"
        />
      </td>
    </tr>
  </ng-template>
  
  <!-- Empty State -->
  <ng-template pTemplate="emptymessage">
    <tr>
      <td [attr.colspan]="2">
        <div class="text-center p-4">
          <i class="pi pi-inbox text-4xl text-gray-400 mb-2"></i>
          <p class="text-gray-500">No data available</p>
        </div>
      </td>
    </tr>
  </ng-template>
</p-table>
```

### Virtual Scrolling (for Large Tables)

**Use when table has 100+ rows:**

```html
<p-table
  [value]="data()"
  [virtualScrollerOptions]="{ itemSize: 50 }"
  [scrollable]="true"
  scrollHeight="400px"
  [lazy]="true"
  (onLazyLoad)="loadData($event)"
>
  <!-- Same template structure -->
</p-table>
```

### Table Best Practices

1. **Always provide pagination** for tables with >10 rows
2. **Use virtual scrolling** for tables with >100 rows
3. **Provide empty state** message
4. **Show loading state** during data fetch
5. **Make columns sortable** when appropriate
6. **Provide row actions** via icon buttons with `aria-label`

---

## 6. Layout Standards

### Page Structure

```html
<app-main-layout>
  <!-- Page Header -->
  <app-page-header
    title="Page Title"
    subtitle="Page description"
    icon="pi-icon-name"
  />
  
  <!-- Content Sections -->
  <div class="content-section">
    <p-card>
      <!-- Section content -->
    </p-card>
  </div>
</app-main-layout>
```

### Card Usage

**Standard Card:**
```html
<p-card header="Card Title" subheader="Card subtitle">
  <p>Card content</p>
</p-card>
```

**Card with Actions:**
```html
<p-card>
  <ng-template pTemplate="header">
    <div class="flex justify-between items-center p-4">
      <h3>Card Title</h3>
      <app-button variant="text" iconLeft="pi-ellipsis-v" [iconOnly]="true" />
    </div>
  </ng-template>
  
  <p>Card content</p>
  
  <ng-template pTemplate="footer">
    <div class="flex justify-end gap-2">
      <app-button variant="text" (clicked)="cancel()">Cancel</app-button>
      <app-button variant="primary" (clicked)="save()">Save</app-button>
    </div>
  </ng-template>
</p-card>
```

---

## 7. Accessibility Standards

### Required Practices

1. **All form inputs must have labels:**
   ```html
   <label for="email">Email</label>
   <input pInputText id="email" />
   ```

2. **Icon-only buttons must have aria-label:**
   ```html
   <app-button
     [iconOnly]="true"
     iconLeft="pi-times"
     ariaLabel="Close dialog"
   />
   ```

3. **Error messages must use role="alert":**
   ```html
   <small class="p-error" role="alert">{{ errorMessage }}</small>
   ```

4. **Images must have alt text:**
   ```html
   <img src="image.jpg" alt="Descriptive text" />
   ```

5. **Headings must follow hierarchy (h1 → h2 → h3):**
   ```html
   <h1>Page Title</h1>
   <h2>Section Title</h2>
   <h3>Subsection Title</h3>
   ```

6. **Interactive elements must be keyboard accessible:**
   - All buttons/links focusable
   - Dialogs trap focus
   - Dropdowns keyboard navigable

### ARIA Attributes

**Common Patterns:**
```html
<!-- Required field -->
<input [attr.aria-required]="true" />

<!-- Invalid field -->
<input [attr.aria-invalid]="hasError()" />

<!-- Described by -->
<input [attr.aria-describedby]="getAriaDescribedBy()" />

<!-- Button states -->
<button [attr.aria-busy]="loading()" />
<button [attr.aria-expanded]="isOpen()" />
<button [attr.aria-pressed]="isSelected()" />
```

---

## 8. Color Usage

### Design Tokens

**Always use design tokens (never hardcoded colors):**

```scss
// ✅ Good
color: var(--ds-primary-green);
background: var(--surface-primary);
border-color: var(--color-border-primary);

// ❌ Bad
color: #089949;
background: #ffffff;
border-color: #e5e5e5;
```

### Semantic Colors

| Token | Usage |
|-------|-------|
| `--ds-primary-green` | Primary actions, brand color |
| `--color-text-primary` | Main text |
| `--color-text-secondary` | Secondary text |
| `--color-status-success` | Success states |
| `--color-status-error` | Error states |
| `--color-status-warning` | Warning states |
| `--color-status-info` | Info states |

---

## 9. Typography

### Heading Hierarchy

```html
<h1>Page Title</h1>           <!-- Only one per page -->
<h2>Section Title</h2>        <!-- Major sections -->
<h3>Subsection Title</h3>      <!-- Subsections -->
<h4>Card Title</h4>           <!-- Card headers -->
```

### Text Sizes

Use PrimeNG text utilities or design tokens:

```html
<p class="text-sm">Small text</p>
<p class="text-base">Base text</p>
<p class="text-lg">Large text</p>
```

---

## 10. Component Customization

### Pass Through API (Preferred)

**For component-level customization:**

```typescript
// primeng.config.ts
export const PRIMENG_PT_CONFIG = {
  inputtext: {
    root: {
      class: 'custom-input-class'
    }
  }
};
```

### CSS Custom Properties (Design Tokens)

**For theme-level customization:**

```scss
:root {
  --p-primary-color: var(--ds-primary-green);
  --p-input-border-radius: var(--radius-md);
}
```

### Avoid Deep Selectors

```scss
// ❌ Bad
::ng-deep .p-dialog .p-dialog-content {
  padding: 2rem;
}

// ✅ Good (Pass Through API)
// In primeng.config.ts
dialog: {
  content: {
    class: 'p-8'
  }
}
```

---

## 11. Performance Best Practices

### Change Detection

- Use `OnPush` change detection strategy
- Use signals for reactive state
- Avoid unnecessary change detection triggers

### Lazy Loading

- Lazy load heavy components
- Use `@if` to conditionally render content
- Load dialog content only when visible

### Virtual Scrolling

- Use virtual scrolling for lists with 100+ items
- Use `trackBy` in `@for` loops

### Image Optimization

- Use `appMobileOptimized` directive for images
- Provide width/height attributes
- Use lazy loading for below-fold images

---

## 12. Checklist for New Components

When creating a new component, ensure:

- [ ] Uses PrimeNG components where possible
- [ ] Follows spacing scale (design tokens)
- [ ] All inputs have labels
- [ ] Icon-only buttons have `aria-label`
- [ ] Error states use `p-error` class
- [ ] Colors use design tokens
- [ ] Uses `OnPush` change detection
- [ ] Uses signals for state
- [ ] Keyboard accessible
- [ ] Mobile responsive
- [ ] Follows heading hierarchy
- [ ] Images have alt text

---

## References

- [PrimeNG 21 Documentation](https://primeng.org/)
- [Design System Tokens](../angular/src/assets/styles/design-system-tokens.scss)
- [Angular 21 Best Practices](./ANGULAR_PRIMENG_GUIDE.md)
- [Refactor Backlog](./PRIMENG_REFACTOR_BACKLOG.md)

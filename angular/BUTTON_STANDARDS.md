# Button Standards & Usage Guidelines

**Version:** 1.0
**Date:** December 30, 2024
**Status:** ✅ Standard

---

## Overview

This document establishes button standards for FlagFit Pro to ensure consistent UX, accessibility, and visual hierarchy across all features.

---

## Button Hierarchy

### **Primary Button** - Main Action

- Use for the primary action on a page/form
- Only ONE primary button per context
- Examples: "Save", "Submit", "Create Account", "Log In"

```html
<p-button
  label="Save Changes"
  icon="pi pi-check"
  severity="primary"
  [loading]="isSaving()"
/>
```

### **Secondary Button** - Alternative Action

- Use for secondary actions
- Multiple allowed per context
- Examples: "Cancel", "Back", "Skip"

```html
<p-button
  label="Cancel"
  icon="pi pi-times"
  severity="secondary"
  [outlined]="true"
/>
```

### **Danger Button** - Destructive Action

- Use for destructive/irreversible actions
- Requires confirmation dialog
- Examples: "Delete", "Remove", "Archive"

```html
<p-button
  label="Delete Account"
  icon="pi pi-trash"
  severity="danger"
  [loading]="isDeleting()"
/>
```

### **Success Button** - Positive Completion

- Use for positive confirmations
- Examples: "Approve", "Confirm", "Accept"

```html
<p-button
  label="Approve Request"
  icon="pi pi-check-circle"
  severity="success"
/>
```

### **Text Button** - Tertiary Action

- Use for less prominent actions
- Examples: "Learn More", "View Details"

```html
<p-button label="Learn More" icon="pi pi-arrow-right" [text]="true" />
```

### **Icon-Only Button** - Compact Action

- Use when space is limited
- MUST have aria-label for accessibility
- Examples: Close, Edit, More options

```html
<p-button
  icon="pi pi-pencil"
  [text]="true"
  [rounded]="true"
  aria-label="Edit profile"
  pTooltip="Edit profile"
/>
```

---

## Button States

### **Default State**

```html
<p-button label="Click Me" />
```

### **Loading State**

```html
<p-button
  label="Saving..."
  [loading]="isSaving()"
  loadingIcon="pi pi-spin pi-spinner"
/>
```

### **Disabled State**

```html
<p-button label="Submit" [disabled]="!formValid()" />
```

### **Outlined Variant**

```html
<p-button label="Cancel" severity="secondary" [outlined]="true" />
```

### **Raised Variant** (with shadow)

```html
<p-button label="Call to Action" [raised]="true" />
```

### **Rounded Variant**

```html
<p-button icon="pi pi-plus" [rounded]="true" aria-label="Add item" />
```

---

## Button Sizes

### **Small** - Compact UI

```html
<p-button label="Small Button" size="small" />
```

### **Default** - Standard size

```html
<p-button label="Default Button" />
```

### **Large** - Emphasis

```html
<p-button label="Large Button" size="large" />
```

---

## Common Patterns

### **Form Submit Button**

```html
<!-- Primary submit button -->
<p-button
  type="submit"
  label="Create Account"
  icon="pi pi-user-plus"
  severity="primary"
  [loading]="isSubmitting()"
  [disabled]="!formValid() || isSubmitting()"
  styleClass="w-full"
/>
```

### **Form Cancel Button**

```html
<p-button
  type="button"
  label="Cancel"
  icon="pi pi-times"
  severity="secondary"
  [outlined]="true"
  (onClick)="onCancel()"
/>
```

### **Delete with Confirmation**

```typescript
// Component
deleteItem(): void {
  this.confirmationService.confirm({
    message: 'Are you sure you want to delete this item? This cannot be undone.',
    header: 'Confirm Deletion',
    icon: 'pi pi-exclamation-triangle',
    acceptButtonStyleClass: 'p-button-danger',
    accept: () => {
      this.performDelete();
    }
  });
}
```

```html
<p-button
  label="Delete"
  icon="pi pi-trash"
  severity="danger"
  (onClick)="deleteItem()"
/>
```

### **Button Group - Horizontal**

```html
<div class="button-group">
  <p-button
    label="Save Draft"
    icon="pi pi-save"
    severity="secondary"
    [outlined]="true"
    (onClick)="saveDraft()"
  />
  <p-button
    label="Publish"
    icon="pi pi-check"
    severity="primary"
    (onClick)="publish()"
  />
</div>
```

```scss
.button-group {
  display: flex;
  gap: space(2);

  @include respond-to(md) {
    flex-direction: column;

    :host ::ng-deep p-button {
      width: 100%;
    }
  }
}
```

### **Loading Button with State**

```typescript
// Component
isSaving = signal(false);

async save(): Promise<void> {
  this.isSaving.set(true);

  try {
    await this.service.save(this.data());
    this.toastService.success('Changes saved successfully');
  } catch (error) {
    this.toastService.error('Failed to save changes');
  } finally {
    this.isSaving.set(false);
  }
}
```

```html
<p-button
  label="{{ isSaving() ? 'Saving...' : 'Save Changes' }}"
  icon="pi pi-check"
  [loading]="isSaving()"
  [disabled]="isSaving()"
  (onClick)="save()"
/>
```

### **Icon Button with Tooltip**

```html
<p-button
  icon="pi pi-pencil"
  [text]="true"
  [rounded]="true"
  severity="secondary"
  aria-label="Edit item"
  pTooltip="Edit"
  tooltipPosition="top"
  (onClick)="edit()"
/>
```

### **Split Button** (Button + Dropdown)

```html
<p-splitButton
  label="Save"
  icon="pi pi-save"
  [model]="saveOptions"
  (onClick)="save()"
/>
```

```typescript
saveOptions = [
  {
    label: "Save and Continue",
    icon: "pi pi-arrow-right",
    command: () => this.saveAndContinue(),
  },
  {
    label: "Save and Close",
    icon: "pi pi-times",
    command: () => this.saveAndClose(),
  },
  { separator: true },
  {
    label: "Save as Draft",
    icon: "pi pi-file",
    command: () => this.saveDraft(),
  },
];
```

---

## Accessibility Requirements

### **1. ARIA Labels**

All icon-only buttons MUST have aria-label:

```html
<!-- ❌ BAD: No label -->
<p-button icon="pi pi-trash" />

<!-- ✅ GOOD: Has aria-label -->
<p-button icon="pi pi-trash" aria-label="Delete item" />
```

### **2. Keyboard Navigation**

- **Tab** - Move between buttons
- **Enter/Space** - Activate button
- **Escape** - Cancel action (if in dialog/modal)

### **3. Focus Indicators**

All buttons must have visible focus indicators (provided by PrimeNG):

```scss
// Custom focus styles if needed
:host ::ng-deep .p-button:focus-visible {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 2px;
}
```

### **4. Loading State Announcements**

```html
<p-button
  label="Saving..."
  [loading]="isSaving()"
  [attr.aria-busy]="isSaving()"
  [attr.aria-live]="'polite'"
/>
```

### **5. Disabled State**

Disabled buttons should not be focusable:

```html
<p-button
  label="Submit"
  [disabled]="!formValid()"
  [attr.aria-disabled]="!formValid()"
/>
```

---

## Touch Device Optimizations

### **Minimum Touch Target: 44x44px**

```scss
// Ensure adequate touch targets on mobile
@include touch-device {
  :host ::ng-deep .p-button {
    @include tap-target(44px);
  }
}
```

### **Remove Hover Effects on Touch**

```scss
@include hover-support {
  :host ::ng-deep .p-button:hover {
    transform: translateY(-2px);
    box-shadow: get-shadow(md);
  }
}

// No transform on touch devices
@include touch-device {
  :host ::ng-deep .p-button:hover {
    transform: none;
  }

  :host ::ng-deep .p-button:active {
    transform: scale(0.98);
  }
}
```

---

## Responsive Patterns

### **Full Width on Mobile**

```html
<p-button
  label="Continue"
  icon="pi pi-arrow-right"
  styleClass="mobile-full-width"
/>
```

```scss
:host ::ng-deep .mobile-full-width {
  @include respond-to(md) {
    width: 100% !important;
  }
}
```

### **Stack Buttons Vertically on Mobile**

```html
<div class="button-row">
  <p-button label="Cancel" severity="secondary" [outlined]="true" />
  <p-button label="Save" severity="primary" />
</div>
```

```scss
.button-row {
  display: flex;
  gap: space(2);
  justify-content: flex-end;

  @include respond-to(md) {
    flex-direction: column-reverse;
    gap: space(2);

    :host ::ng-deep p-button {
      width: 100%;
    }
  }
}
```

---

## Style Customization

### **Custom Button Colors**

```html
<p-button
  label="Brand Action"
  [style]="{ 'background-color': 'var(--color-brand-primary)', 'border-color': 'var(--color-brand-primary)' }"
/>
```

### **Custom Button with SCSS**

```scss
:host ::ng-deep .custom-button {
  .p-button {
    background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
    border: none;
    padding: space(3) space(5);
    font-weight: 600;

    &:hover {
      background: linear-gradient(
        135deg,
        var(--primary-600),
        var(--primary-800)
      );
    }
  }
}
```

```html
<p-button
  label="Premium Feature"
  icon="pi pi-star"
  styleClass="custom-button"
/>
```

---

## Common Button Combinations

### **Modal Footer Buttons**

```html
<div class="modal-footer">
  <p-button
    label="Cancel"
    icon="pi pi-times"
    severity="secondary"
    [outlined]="true"
    (onClick)="closeModal()"
  />
  <p-button
    label="Save"
    icon="pi pi-check"
    severity="primary"
    [loading]="isSaving()"
    [disabled]="!formValid()"
    (onClick)="save()"
  />
</div>
```

```scss
.modal-footer {
  @include flex-between;
  padding: space(4);
  border-top: 1px solid var(--surface-border);

  @include respond-to(md) {
    flex-direction: column-reverse;
    gap: space(2);

    :host ::ng-deep p-button {
      width: 100%;
    }
  }
}
```

### **Action Bar Buttons**

```html
<div class="action-bar">
  <div class="action-bar-left">
    <p-button
      icon="pi pi-arrow-left"
      label="Back"
      [text]="true"
      (onClick)="goBack()"
    />
  </div>
  <div class="action-bar-right">
    <p-button
      label="Save Draft"
      severity="secondary"
      [outlined]="true"
      (onClick)="saveDraft()"
    />
    <p-button
      label="Publish"
      icon="pi pi-send"
      severity="primary"
      (onClick)="publish()"
    />
  </div>
</div>
```

```scss
.action-bar {
  @include flex-between;
  padding: space(4);
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);

  @include respond-to(md) {
    flex-direction: column;
    gap: space(3);
  }
}

.action-bar-left,
.action-bar-right {
  display: flex;
  gap: space(2);

  @include respond-to(md) {
    width: 100%;

    :host ::ng-deep p-button {
      flex: 1;
    }
  }
}
```

---

## Testing Checklist

### **Visual Tests**

- [ ] Primary button stands out from secondary
- [ ] Danger buttons clearly indicate risk
- [ ] Loading state shows spinner
- [ ] Disabled state is visually obvious
- [ ] Focus indicators are visible

### **Interaction Tests**

- [ ] Buttons respond to click/tap
- [ ] Loading state prevents double-submission
- [ ] Disabled buttons don't respond to clicks
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Touch targets are 44x44px minimum on mobile

### **Accessibility Tests**

- [ ] All icon buttons have aria-label
- [ ] Focus indicators meet WCAG 2.1 AA
- [ ] Screen reader announces button purpose
- [ ] Loading state announced to screen reader
- [ ] Color contrast meets WCAG standards (4.5:1 minimum)

---

## Migration Checklist

When updating existing buttons:

- [ ] Replace HTML `<button>` with `<p-button>`
- [ ] Add appropriate severity (primary, secondary, danger, success)
- [ ] Add icon for clarity (optional but recommended)
- [ ] Add loading state for async actions
- [ ] Add disabled state based on form validity
- [ ] Add aria-label for icon-only buttons
- [ ] Ensure touch targets are 44x44px on mobile
- [ ] Use outlined variant for secondary actions
- [ ] Stack vertically on mobile if in a group
- [ ] Test keyboard navigation
- [ ] Test with screen reader

---

## Examples by Use Case

### **Login Button**

```html
<p-button
  type="submit"
  label="Sign In"
  icon="pi pi-sign-in"
  severity="primary"
  [loading]="isLoggingIn()"
  [disabled]="!loginForm.valid || isLoggingIn()"
  styleClass="w-full"
/>
```

### **Create/Add Button**

```html
<p-button
  label="Create Session"
  icon="pi pi-plus"
  severity="primary"
  (onClick)="openCreateDialog()"
/>
```

### **Edit Button**

```html
<p-button
  icon="pi pi-pencil"
  severity="secondary"
  [text]="true"
  [rounded]="true"
  aria-label="Edit item"
  pTooltip="Edit"
  (onClick)="edit()"
/>
```

### **Delete Button**

```html
<p-button
  icon="pi pi-trash"
  severity="danger"
  [text]="true"
  [rounded]="true"
  aria-label="Delete item"
  pTooltip="Delete"
  (onClick)="confirmDelete()"
/>
```

### **Filter/View Options Button**

```html
<p-button
  icon="pi pi-filter"
  label="Filters"
  severity="secondary"
  [outlined]="true"
  [badge]="activeFilters().toString()"
  (onClick)="toggleFilters()"
/>
```

### **Export Button**

```html
<p-button
  label="Export Data"
  icon="pi pi-download"
  severity="secondary"
  [outlined]="true"
  [loading]="isExporting()"
  (onClick)="exportData()"
/>
```

---

## Don'ts

❌ **Don't use multiple primary buttons**

```html
<!-- BAD: Two competing primary actions -->
<p-button label="Save" severity="primary" />
<p-button label="Publish" severity="primary" />
```

✅ **Do use primary + secondary**

```html
<!-- GOOD: Clear hierarchy -->
<p-button label="Save Draft" severity="secondary" [outlined]="true" />
<p-button label="Publish" severity="primary" />
```

❌ **Don't use icon-only without aria-label**

```html
<!-- BAD: No accessibility -->
<p-button icon="pi pi-trash" />
```

✅ **Do add aria-label**

```html
<!-- GOOD: Accessible -->
<p-button icon="pi pi-trash" aria-label="Delete item" pTooltip="Delete" />
```

❌ **Don't forget loading states**

```html
<!-- BAD: No feedback during save -->
<p-button label="Save" (onClick)="save()" />
```

✅ **Do show loading states**

```html
<!-- GOOD: Clear feedback -->
<p-button
  label="Save"
  [loading]="isSaving()"
  [disabled]="isSaving()"
  (onClick)="save()"
/>
```

---

**Status:** ✅ Standard established
**Next:** Audit all buttons across application for compliance

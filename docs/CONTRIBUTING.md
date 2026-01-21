# Contributing to FlagFit Pro

**Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Status:** ✅ Active

This guide helps developers contribute to FlagFit Pro while maintaining PrimeNG best practices and accessibility standards.

---

## 🎯 PrimeNG Component Usage Policy

### ✅ Always Use PrimeNG Components

**Prefer PrimeNG components over custom implementations:**

| Use Case | PrimeNG Component | Notes |
|----------|------------------|-------|
| Text Input | `InputText` | Use `pInputText` directive |
| Number Input | `InputNumber` | Use `p-inputNumber` component |
| Dropdown | `Select` | Use `p-select` component |
| Checkbox | `Checkbox` | Use `p-checkbox` component |
| Radio Button | `RadioButton` | Use `p-radioButton` component |
| Date Picker | `DatePicker` | Use `p-datepicker` component |
| Textarea | `Textarea` | Use `pInputTextarea` directive |
| Button | `app-button` | Use our wrapper (adds value) |
| Dialog | `app-modal` | Use our wrapper (adds value) |
| Toast | `ToastService` | Use service, not component directly |
| Table | `DataTable` | Use `p-table` component |
| Card | `Card` | Use `p-card` component |

### ❌ Don't Use Custom Components

**These custom components are deprecated (use PrimeNG directly):**
- ~~`app-input`~~ → Use `InputText` with `pInputText`
- ~~`app-form-input`~~ → Use `InputText` with `pInputText`
- ~~`app-select`~~ → Use `Select` (`p-select`)
- ~~`app-checkbox`~~ → Use `Checkbox` (`p-checkbox`)
- ~~`app-radio`~~ → Use `RadioButton` (`p-radioButton`)

---

## 📋 Form Field Standards

### Standard Form Field Structure

**Every form field MUST follow this pattern:**

```html
<div class="field">
  <label for="field-id" class="block mb-2">
    Label Text
    @if (required) {
      <span class="text-red-500" aria-label="required">*</span>
    }
  </label>
  
  <!-- Input/Select/etc -->
  <input
    pInputText
    id="field-id"
    [(ngModel)]="value"
    [class.p-invalid]="hasError()"
    [attr.aria-invalid]="hasError()"
    [attr.aria-required]="required"
    [attr.aria-describedby]="getAriaDescribedBy()"
  />
  
  <!-- Hint Text (optional) -->
  @if (hint && !hasError()) {
    <small [id]="fieldId + '-hint'" class="p-field-hint">
      {{ hint }}
    </small>
  }
  
  <!-- Error Message (required when error exists) -->
  @if (hasError()) {
    <small [id]="fieldId + '-error'" class="p-error" role="alert">
      <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
      {{ errorMessage }}
    </small>
  }
</div>
```

### PrimeNG Select Pattern

```html
<div class="field">
  <label for="select-id" class="block mb-2">Label</label>
  <p-select
    inputId="select-id"
    [options]="options"
    optionLabel="label"
    optionValue="value"
    placeholder="Select option"
    [attr.aria-label]="'Select option description'"
  ></p-select>
</div>
```

**Key Points:**
- ✅ Use `inputId` (NOT `id`) for PrimeNG Select
- ✅ Always provide `aria-label` attribute
- ✅ Always provide `<label>` element with `for` attribute

### PrimeNG InputNumber Pattern

```html
<div class="field">
  <label for="number-id" class="block mb-2">Label</label>
  <p-inputNumber
    inputId="number-id"
    [(ngModel)]="value"
    [min]="0"
    [max]="100"
    [showButtons]="true"
    [attr.aria-label]="'Description of what this number represents'"
  ></p-inputNumber>
</div>
```

**Key Points:**
- ✅ Use `inputId` (NOT `id`) for PrimeNG InputNumber
- ✅ Always provide `aria-label` attribute
- ✅ Always provide `<label>` element with `for` attribute

### PrimeNG Checkbox Pattern

```html
<div class="field-checkbox">
  <p-checkbox
    inputId="checkbox-id"
    [(ngModel)]="value"
    [binary]="true"
  ></p-checkbox>
  <label for="checkbox-id" class="ml-2">
    Checkbox Label
  </label>
</div>
```

**Key Points:**
- ✅ Label comes AFTER checkbox (PrimeNG pattern)
- ✅ Use `field-checkbox` wrapper class
- ✅ Use `inputId` attribute

### PrimeNG RadioButton Pattern

```html
<div class="field-radiobutton">
  <p-radioButton
    inputId="radio-1"
    name="group-name"
    value="value1"
    [(ngModel)]="selectedValue"
  ></p-radioButton>
  <label for="radio-1" class="ml-2">Option 1</label>
</div>
```

**Key Points:**
- ✅ Label comes AFTER radio button
- ✅ All radios in group share same `name`
- ✅ Each radio needs unique `inputId`

---

## 🎨 Button Standards

### Use `app-button` Component

**Standard button:**
```html
<app-button variant="primary" (clicked)="handleClick()">
  Button Text
</app-button>
```

**With icon:**
```html
<app-button variant="primary" iconLeft="pi-check" (clicked)="save()">
  Save
</app-button>
```

**Icon-only (MUST have aria-label):**
```html
<app-button
  variant="text"
  iconLeft="pi-times"
  [iconOnly]="true"
  ariaLabel="Close dialog"
  (clicked)="close()"
/>
```

**Loading state:**
```html
<app-button
  variant="primary"
  [loading]="isSaving"
  (clicked)="save()"
>
  Save
</app-button>
```

---

## ♿ Accessibility Requirements

### Required Practices

1. **All form inputs MUST have labels:**
   ```html
   <label for="input-id">Label</label>
   <input pInputText id="input-id" />
   ```

2. **Icon-only buttons MUST have aria-label:**
   ```html
   <app-button
     [iconOnly]="true"
     iconLeft="pi-times"
     ariaLabel="Close dialog"
   />
   ```

3. **Error messages MUST use role="alert":**
   ```html
   <small class="p-error" role="alert">{{ errorMessage }}</small>
   ```

4. **Images MUST have alt text:**
   ```html
   <img src="image.jpg" alt="Descriptive text" />
   ```

5. **Headings MUST follow hierarchy (h1 → h2 → h3):**
   ```html
   <h1>Page Title</h1>
   <h2>Section Title</h2>
   <h3>Subsection Title</h3>
   ```

6. **PrimeNG Select/InputNumber MUST use inputId:**
   ```html
   <!-- ✅ Correct -->
   <p-select inputId="my-select" />
   
   <!-- ❌ Wrong -->
   <p-select id="my-select" />
   ```

---

## 🎨 Styling Standards

### Use Design Tokens

**Always use design tokens (never hardcoded values):**

```scss
// ✅ Good
padding: var(--space-4);
color: var(--ds-primary-green);
background: var(--surface-primary);

// ❌ Bad
padding: 16px;
color: #089949;
background: #ffffff;
```

### Spacing Scale

Use 4px base unit:
- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-6`: 24px
- `--space-8`: 32px

### Component Customization

**Use Pass Through API (preferred):**
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

**Avoid deep selectors:**
```scss
// ❌ Bad
::ng-deep .p-dialog .p-dialog-content {
  padding: 2rem;
}
```

---

## ✅ Checklist for New Components

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
- [ ] PrimeNG Select/InputNumber use `inputId` (not `id`)

---

## 🧪 Testing Requirements

### Before Submitting PR

1. **Run accessibility audit:**
   ```bash
   npm run audit:a11y
   ```

2. **Run E2E tests:**
   ```bash
   npm run e2e
   ```

3. **Test with keyboard:**
   - Tab through all interactive elements
   - Verify focus indicators are visible
   - Test form submission with keyboard only

4. **Test with screen reader:**
   - Verify all form fields are announced
   - Verify error messages are announced
   - Verify button purposes are clear

---

## 📚 References

- [PrimeNG 21 Documentation](https://primeng.org/)
- [Design System Guide](./PRIMENG_DESIGN_SYSTEM.md)
- [Migration Guide](./PRIMENG_MIGRATION_GUIDE.md)
- [Refactor Backlog](./PRIMENG_REFACTOR_BACKLOG.md)

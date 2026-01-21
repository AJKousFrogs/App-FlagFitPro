# PrimeNG Component Migration Guide

**Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Status:** 🚧 Active

This guide provides step-by-step instructions for migrating custom components to PrimeNG components.

---

## Migration Overview

### Components to Migrate

| Custom Component | PrimeNG Replacement | Priority | Effort |
|-----------------|---------------------|----------|--------|
| `app-input` | `InputText` | 🔴 High | High |
| `app-form-input` | `InputText` | 🔴 High | Medium |
| `app-select` | `Select` | 🟡 Medium | Low |
| `app-checkbox` | `Checkbox` | 🟡 Medium | Low |
| `app-radio` | `RadioButton` | 🟡 Medium | Low |

### Components to Keep

| Component | Reason |
|-----------|--------|
| `app-button` | Adds value (consistent API, loading states, router support) |
| `app-modal` | Adds value (consistent UX patterns, animations) |
| `app-toast` | Adds value (consistent notifications) |
| `app-search-input` | Adds value (consistent search pattern) |

---

## Migration Patterns

### 1. Migrating `app-select` → PrimeNG `Select`

#### Before (Custom Component)

```typescript
import { SelectComponent } from '@app/shared/components/select/select.component';

@Component({
  imports: [SelectComponent],
  template: `
    <app-select
      [label]="'Category'"
      [options]="categoryOptions"
      [(ngModel)]="selectedCategory"
      [placeholder]="'Select category'"
      [errorMessage]="categoryError"
    />
  `
})
```

#### After (PrimeNG Select)

```typescript
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [Select, FormsModule],
  template: `
    <div class="field">
      <label for="category-select" class="block mb-2">
        Category
        @if (required) {
          <span class="text-red-500" aria-label="required">*</span>
        }
      </label>
      <p-select
        id="category-select"
        [options]="categoryOptions"
        [(ngModel)]="selectedCategory"
        placeholder="Select category"
        [showClear]="true"
        [class.p-invalid]="!!categoryError"
        [attr.aria-invalid]="!!categoryError"
        [attr.aria-describedby]="categoryError ? 'category-error' : null"
        optionLabel="label"
        optionValue="value"
      />
      @if (categoryError) {
        <small id="category-error" class="p-error" role="alert">
          {{ categoryError }}
        </small>
      }
    </div>
  `
})
```

**Key Changes:**
1. Import `Select` from `primeng/select`
2. Wrap in `<div class="field">` for proper spacing
3. Add explicit `<label>` element
4. Use `p-select` component
5. Map options: `optionLabel="label"`, `optionValue="value"`
6. Use `p-invalid` class for error state
7. Add `aria-invalid` and `aria-describedby` attributes
8. Show error message with `p-error` class

**Option Format:**
```typescript
// PrimeNG Select expects options in this format:
categoryOptions = [
  { label: 'Option 1', value: 'opt1' },
  { label: 'Option 2', value: 'opt2' }
];

// Or use optionLabel/optionValue to map custom objects:
categoryOptions = [
  { name: 'Option 1', id: 'opt1' },
  { name: 'Option 2', id: 'opt2' }
];
// Then use: optionLabel="name" optionValue="id"
```

---

### 2. Migrating `app-checkbox` → PrimeNG `Checkbox`

#### Before (Custom Component)

```typescript
import { CheckboxComponent } from '@app/shared/components/checkbox/checkbox.component';

@Component({
  imports: [CheckboxComponent],
  template: `
    <app-checkbox
      [label]="'I agree to terms'"
      [(ngModel)]="agreed"
      [errorMessage]="agreementError"
    />
  `
})
```

#### After (PrimeNG Checkbox)

```typescript
import { Checkbox } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [Checkbox, FormsModule],
  template: `
    <div class="field-checkbox">
      <p-checkbox
        inputId="agreement-checkbox"
        [(ngModel)]="agreed"
        [binary]="true"
        [class.p-invalid]="!!agreementError"
        [attr.aria-invalid]="!!agreementError"
        [attr.aria-describedby]="agreementError ? 'agreement-error' : null"
      />
      <label for="agreement-checkbox" class="ml-2">
        I agree to terms
        @if (required) {
          <span class="text-red-500" aria-label="required">*</span>
        }
      </label>
      @if (agreementError) {
        <small id="agreement-error" class="p-error block mt-1" role="alert">
          {{ agreementError }}
        </small>
      }
    </div>
  `
})
```

**Key Changes:**
1. Import `Checkbox` from `primeng/checkbox`
2. Use `p-checkbox` component
3. Set `[binary]="true"` for boolean values
4. Label comes AFTER the checkbox (PrimeNG pattern)
5. Use `field-checkbox` wrapper class
6. Add error handling with `p-error` class

---

### 3. Migrating `app-radio` → PrimeNG `RadioButton`

#### Before (Custom Component)

```typescript
import { RadioComponent } from '@app/shared/components/radio/radio.component';

@Component({
  imports: [RadioComponent],
  template: `
    <app-radio
      [label]="'Option 1'"
      [value]="'opt1'"
      [name]="'choice'"
      [(ngModel)]="selectedOption"
    />
    <app-radio
      [label]="'Option 2'"
      [value]="'opt2'"
      [name]="'choice'"
      [(ngModel)]="selectedOption"
    />
  `
})
```

#### After (PrimeNG RadioButton)

```typescript
import { RadioButton } from 'primeng/radiobutton';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [RadioButton, FormsModule],
  template: `
    <div class="field-radiobutton">
      <p-radioButton
        inputId="option1"
        name="choice"
        value="opt1"
        [(ngModel)]="selectedOption"
      />
      <label for="option1" class="ml-2">Option 1</label>
    </div>
    <div class="field-radiobutton">
      <p-radioButton
        inputId="option2"
        name="choice"
        value="opt2"
        [(ngModel)]="selectedOption"
      />
      <label for="option2" class="ml-2">Option 2</label>
    </div>
  `
})
```

**Key Changes:**
1. Import `RadioButton` from `primeng/radiobutton`
2. Use `p-radioButton` component
3. Each radio button needs unique `inputId`
4. All radios in group share same `name`
5. Label comes AFTER the radio button
6. Use `field-radiobutton` wrapper class

---

### 4. Migrating `app-input` → PrimeNG `InputText`

#### Before (Custom Component)

```typescript
import { InputComponent } from '@app/shared/components/input/input.component';

@Component({
  imports: [InputComponent],
  template: `
    <app-input
      [label]="'Email'"
      [(ngModel)]="email"
      [type]="'email'"
      [required]="true"
      [errorMessage]="emailError"
      [helpText]="'Enter your email address'"
    />
  `
})
```

#### After (PrimeNG InputText)

```typescript
import { InputText } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [InputText, FormsModule],
  template: `
    <div class="field">
      <label for="email-input" class="block mb-2">
        Email
        <span class="text-red-500" aria-label="required">*</span>
      </label>
      <input
        pInputText
        id="email-input"
        type="email"
        [(ngModel)]="email"
        [required]="true"
        [class.p-invalid]="!!emailError"
        [attr.aria-invalid]="!!emailError"
        [attr.aria-required]="true"
        [attr.aria-describedby]="getEmailAriaDescribedBy()"
      />
      @if (helpText && !emailError) {
        <small id="email-hint" class="p-field-hint">
          {{ helpText }}
        </small>
      }
      @if (emailError) {
        <small id="email-error" class="p-error" role="alert">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
          {{ emailError }}
        </small>
      }
    </div>
  `
})
export class MyComponent {
  helpText = 'Enter your email address';
  
  getEmailAriaDescribedBy(): string | null {
    if (this.emailError) {
      return 'email-error';
    }
    if (this.helpText) {
      return 'email-hint';
    }
    return null;
  }
}
```

**Key Changes:**
1. Import `InputText` from `primeng/inputtext`
2. Use `pInputText` directive on native `<input>` element
3. Wrap in `<div class="field">` for spacing
4. Add explicit `<label>` with `for` attribute
5. Use `p-invalid` class for error state
6. Add `aria-invalid`, `aria-required`, `aria-describedby` attributes
7. Show help text with `p-field-hint` class (when no error)
8. Show error with `p-error` class and `role="alert"`

---

## Step-by-Step Migration Process

### Phase 1: Preparation

1. **Review the component** that uses custom components
2. **Identify all usages** of custom components
3. **Check dependencies** - ensure PrimeNG components are available
4. **Plan the migration** - decide on option formats, error handling

### Phase 2: Migration

1. **Update imports:**
   ```typescript
   // Remove
   import { SelectComponent } from '@app/shared/components/select/select.component';
   
   // Add
   import { Select } from 'primeng/select';
   ```

2. **Update template:**
   - Replace custom component with PrimeNG component
   - Add proper labels and accessibility attributes
   - Update error handling

3. **Update component logic:**
   - Adjust option formats if needed
   - Update error handling logic
   - Add helper methods for `aria-describedby`

### Phase 3: Testing

1. **Visual testing:**
   - Check appearance matches design
   - Verify spacing and alignment

2. **Functional testing:**
   - Test form submission
   - Test validation
   - Test error states

3. **Accessibility testing:**
   - Run accessibility audit
   - Test with keyboard navigation
   - Test with screen reader

4. **Browser testing:**
   - Test in Chrome, Firefox, Safari
   - Test on mobile devices

### Phase 4: Cleanup

1. **Remove unused imports**
2. **Remove custom component from imports**
3. **Update documentation**
4. **Mark custom component as deprecated** (if keeping temporarily)

---

## Common Pitfalls

### 1. Option Format Mismatch

**Problem:** PrimeNG Select expects options in specific format

**Solution:** Use `optionLabel` and `optionValue` props to map custom objects:
```typescript
<p-select
  [options]="customOptions"
  optionLabel="displayName"
  optionValue="id"
/>
```

### 2. Missing Labels

**Problem:** Accessibility violation - inputs without labels

**Solution:** Always provide explicit `<label>` elements:
```html
<label for="input-id">Label Text</label>
<input pInputText id="input-id" />
```

### 3. Error State Not Visible

**Problem:** Error styling not applied

**Solution:** Use `p-invalid` class and check `aria-invalid`:
```html
<input
  pInputText
  [class.p-invalid]="!!error"
  [attr.aria-invalid]="!!error"
/>
```

### 4. Checkbox/Radio Label Position

**Problem:** Label appears before input (PrimeNG expects after)

**Solution:** Place label AFTER the checkbox/radio:
```html
<p-checkbox inputId="cb1" />
<label for="cb1">Label text</label>
```

### 5. Missing aria-describedby

**Problem:** Screen readers don't announce errors/help text

**Solution:** Always set `aria-describedby`:
```html
<input
  [attr.aria-describedby]="error ? 'error-id' : (hint ? 'hint-id' : null)"
/>
```

---

## Migration Checklist

When migrating a component, ensure:

- [ ] PrimeNG component imported correctly
- [ ] Custom component removed from imports
- [ ] Template updated with PrimeNG component
- [ ] Label element added (with `for` attribute)
- [ ] Error state uses `p-invalid` class
- [ ] `aria-invalid` attribute set
- [ ] `aria-describedby` attribute set
- [ ] Error message uses `p-error` class with `role="alert"`
- [ ] Help text uses `p-field-hint` class
- [ ] Option formats match PrimeNG expectations
- [ ] Form still works (test submission)
- [ ] Validation still works (test error states)
- [ ] Accessibility audit passes
- [ ] Visual appearance matches design
- [ ] Mobile responsive
- [ ] Documentation updated

---

## Examples

See the following files for complete migration examples:

- `features/example/example-migrated.component.ts` (coming soon)
- `docs/MIGRATION_EXAMPLES.md` (coming soon)

---

## References

- [PrimeNG Select Documentation](https://primeng.org/select)
- [PrimeNG Checkbox Documentation](https://primeng.org/checkbox)
- [PrimeNG RadioButton Documentation](https://primeng.org/radiobutton)
- [PrimeNG InputText Documentation](https://primeng.org/inputtext)
- [Design System Guide](./PRIMENG_DESIGN_SYSTEM.md)
- [Refactor Backlog](./PRIMENG_REFACTOR_BACKLOG.md)

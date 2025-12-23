# Angular 21 Forms Quick Reference

## 🚀 Quick Patterns

### Signal-Based Form (Simple)

```typescript
export class MyComponent {
  name = signal<string>("");
  nameTouched = signal<boolean>(false);

  nameError = computed(() => {
    if (!nameTouched()) return null;
    return FormValidators.required(name());
  });

  isFormValid = computed(() => !nameError());
}
```

### Enhanced Reactive Form

```typescript
export class MyComponent {
  form: FormGroup;
  submitted = signal(false);

  emailError = computed(() => {
    const control = this.form.get("email");
    return control && (submitted() || control.touched)
      ? getFormControlError(control)
      : null;
  });
}
```

## 📋 Form Validators

```typescript
import { FormValidators, combineValidators } from "../shared/utils/form.utils";

// Required
FormValidators.required(value);

// Email
FormValidators.email(value);

// Min Length
FormValidators.minLength(8)(value);

// Password
FormValidators.password(value);

// Combine
combineValidators(FormValidators.required, FormValidators.email)(value);
```

## 🎯 Template Usage

### Signal Form

```html
<input
  [value]="name()"
  (input)="name.set($any($event.target).value)"
  (blur)="nameTouched.set(true)"
  [class.ng-invalid]="nameError()"
/>
@if (nameError()) {
<small class="p-error">{{ nameError() }}</small>
}
```

### Reactive Form

```html
<input formControlName="email" [class.ng-invalid]="emailError()" />
@if (emailError()) {
<small class="p-error">{{ emailError() }}</small>
}
```

## ✅ Best Practices

1. **Use signals for UI state**: `isLoading`, `submitted`, `touched`
2. **Use computed for errors**: `emailError = computed(...)`
3. **Use form utilities**: `getFormControlError()`, `FormValidators`
4. **Mark touched on submit**: `submitted.set(true)`

## 📚 Full Documentation

See `ANGULAR_21_FORMS_UPGRADE.md` for complete guide.

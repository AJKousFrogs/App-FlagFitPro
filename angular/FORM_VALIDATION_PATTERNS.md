# Form Validation Patterns & Best Practices

**Version:** 1.0
**Date:** December 30, 2024
**Status:** ✅ Standard

---

## Overview

This document establishes form validation standards for FlagFit Pro Angular frontend. All forms must follow these patterns for consistent UX and accessibility.

---

## Core Principles

### 1. **Inline Validation**
- Show validation feedback as the user types (debounced)
- Display errors only after field is touched/blurred
- Show success states for valid required fields
- Never block user input, only provide feedback

### 2. **Clear Error Messages**
- Specific, actionable error messages
- Tell users WHAT went wrong and HOW to fix it
- Avoid technical jargon
- Use friendly, helpful tone

### 3. **Visual Hierarchy**
- ✅ Success: Green with checkmark
- ⚠️ Warning: Yellow/orange with exclamation
- ❌ Error: Red with X icon
- 🔵 Info: Blue with info icon

### 4. **Accessibility First**
- ARIA labels on all inputs
- Error messages linked via `aria-describedby`
- Clear focus indicators
- Keyboard navigation support
- Screen reader announcements

---

## Component Usage

### **Basic Text Input**

```typescript
<app-form-input
  inputId="username"
  label="Username"
  type="text"
  placeholder="Enter your username"
  [required]="true"
  [value]="username()"
  [errorMessage]="usernameError()"
  [validationState]="usernameState()"
  (valueChange)="onUsernameChange($event)"
  hint="3-20 characters, letters and numbers only"
  prefixIcon="pi-user"
/>
```

### **Email Input with Async Validation**

```typescript
<app-form-input
  inputId="email"
  label="Email Address"
  type="email"
  [required]="true"
  [value]="email()"
  [errorMessage]="emailError()"
  [validationState]="emailValidating() ? 'validating' : emailValid() ? 'valid' : 'invalid'"
  (valueChange)="onEmailChange($event)"
  hint="We'll send a confirmation email"
  prefixIcon="pi-envelope"
  successMessage="Email is available!"
/>
```

### **Password with Strength Indicator**

```typescript
<app-form-input
  inputId="password"
  label="Password"
  type="password"
  [required]="true"
  [value]="password()"
  [errorMessage]="passwordError()"
  [validationState]="passwordState()"
  (valueChange)="onPasswordChange($event)"
  autocomplete="new-password"
/>

<app-password-strength
  [password]="password()"
  [showRequirements]="true"
  [showSuggestions]="true"
/>
```

### **Optional Field**

```typescript
<app-form-input
  inputId="phoneNumber"
  label="Phone Number"
  type="tel"
  [optional]="true"
  [value]="phone()"
  (valueChange)="onPhoneChange($event)"
  hint="We'll only use this for account recovery"
  prefixIcon="pi-phone"
/>
```

### **Input with Character Count**

```typescript
<app-form-input
  inputId="bio"
  label="Bio"
  type="text"
  [maxLength]="200"
  [showCharCount]="true"
  [value]="bio()"
  (valueChange)="onBioChange($event)"
  hint="Tell us about yourself"
/>
```

---

## Validation Patterns

### **Email Validation**

```typescript
import { FormValidators } from '@/shared/utils/form.utils';

// In component
emailError = computed(() => {
  const email = this.email();
  if (!email && !this.emailTouched()) return '';

  const requiredError = FormValidators.required(email);
  if (requiredError) return requiredError;

  const emailError = FormValidators.email(email);
  if (emailError) return emailError;

  return '';
});
```

**Error Messages:**
- `"Email is required"` - Field is empty
- `"Please enter a valid email address"` - Invalid format
- `"Email is already registered"` - Already exists (async)

### **Password Validation**

```typescript
passwordError = computed(() => {
  const pwd = this.password();
  if (!pwd && !this.passwordTouched()) return '';

  const requiredError = FormValidators.required(pwd);
  if (requiredError) return requiredError;

  const strengthError = FormValidators.passwordStrength(pwd);
  if (strengthError) return strengthError;

  return '';
});
```

**Error Messages:**
- `"Password is required"`
- `"Password must be at least 8 characters"`
- `"Password must include uppercase, lowercase, number, and special character"`

### **Confirm Password Validation**

```typescript
confirmPasswordError = computed(() => {
  const confirm = this.confirmPassword();
  const original = this.password();

  if (!confirm && !this.confirmTouched()) return '';

  const requiredError = FormValidators.required(confirm);
  if (requiredError) return requiredError;

  if (confirm !== original) {
    return 'Passwords do not match';
  }

  return '';
});
```

### **Phone Number Validation**

```typescript
phoneError = computed(() => {
  const phone = this.phone();
  if (!phone) return ''; // Optional field

  const phonePattern = /^\+?[1-9]\d{1,14}$/; // E.164 format
  if (!phonePattern.test(phone.replace(/[\s\-\(\)]/g, ''))) {
    return 'Please enter a valid phone number';
  }

  return '';
});
```

### **Username Validation**

```typescript
usernameError = computed(() => {
  const username = this.username();
  if (!username && !this.usernameTouched()) return '';

  const requiredError = FormValidators.required(username);
  if (requiredError) return requiredError;

  const lengthError = FormValidators.minLength(3)(username);
  if (lengthError) return lengthError;

  const maxLengthError = FormValidators.maxLength(20)(username);
  if (maxLengthError) return maxLengthError;

  const patternError = FormValidators.pattern(
    /^[a-zA-Z0-9_]+$/,
    'Username can only contain letters, numbers, and underscores'
  )(username);
  if (patternError) return patternError;

  return '';
});
```

---

## Async Validation

### **Email Availability Check**

```typescript
// Debounced async validation
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

private checkEmailAvailability(email: string): void {
  if (!email || this.emailError()) {
    this.emailAvailable.set(false);
    return;
  }

  this.emailValidating.set(true);

  this.apiService.checkEmailAvailability(email)
    .pipe(
      debounceTime(500), // Wait 500ms after user stops typing
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe({
      next: (available) => {
        this.emailValidating.set(false);
        this.emailAvailable.set(available);
        if (!available) {
          this.emailAsyncError.set('This email is already registered');
        } else {
          this.emailAsyncError.set('');
        }
      },
      error: () => {
        this.emailValidating.set(false);
        this.emailAsyncError.set('Could not verify email availability');
      }
    });
}
```

### **Username Availability Check**

```typescript
private checkUsernameAvailability(username: string): void {
  if (!username || this.usernameError()) {
    this.usernameAvailable.set(false);
    return;
  }

  this.usernameValidating.set(true);

  this.apiService.checkUsernameAvailability(username)
    .pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe({
      next: (available) => {
        this.usernameValidating.set(false);
        this.usernameAvailable.set(available);
        if (!available) {
          this.usernameAsyncError.set('Username is already taken');
        } else {
          this.usernameAsyncError.set('');
        }
      },
      error: () => {
        this.usernameValidating.set(false);
      }
    });
}
```

---

## Form Submission

### **Submit Button State**

```typescript
// In component
formValid = computed(() => {
  return (
    !this.emailError() &&
    !this.passwordError() &&
    !this.confirmPasswordError() &&
    this.email() &&
    this.password() &&
    this.confirmPassword() &&
    !this.emailValidating() &&
    !this.usernameValidating()
  );
});

// In template
<p-button
  type="submit"
  label="Create Account"
  icon="pi pi-user-plus"
  [loading]="isSubmitting()"
  [disabled]="!formValid() || isSubmitting()"
  styleClass="w-full"
/>
```

### **Submit Handler with Validation**

```typescript
async onSubmit(): Promise<void> {
  // Mark all fields as touched to show errors
  this.emailTouched.set(true);
  this.passwordTouched.set(true);
  this.confirmTouched.set(true);

  // Check if form is valid
  if (!this.formValid()) {
    this.toastService.error('Please fix the errors before submitting');
    return;
  }

  this.isSubmitting.set(true);

  try {
    await this.authService.register({
      email: this.email(),
      password: this.password(),
    });

    this.toastService.success('Account created successfully!');
    this.router.navigate(['/dashboard']);
  } catch (error: any) {
    // Handle specific errors
    if (error.code === 'email_already_exists') {
      this.emailAsyncError.set('This email is already registered');
    } else {
      this.toastService.error(error.message || 'Registration failed');
    }
  } finally {
    this.isSubmitting.set(false);
  }
}
```

---

## Error Message Standards

### **Required Fields**
- ✅ `"Email is required"`
- ✅ `"Password is required"`
- ✅ `"Please enter your name"`
- ❌ `"Field required"` (too vague)
- ❌ `"This field cannot be empty"` (too wordy)

### **Format Errors**
- ✅ `"Please enter a valid email address"`
- ✅ `"Phone number must be in format: +1 (555) 123-4567"`
- ✅ `"Date must be in MM/DD/YYYY format"`
- ❌ `"Invalid"` (not helpful)
- ❌ `"Format error"` (not specific)

### **Length Errors**
- ✅ `"Username must be at least 3 characters"`
- ✅ `"Bio cannot exceed 200 characters"`
- ✅ `"Password must be between 8-128 characters"`
- ❌ `"Too short"` (not actionable)
- ❌ `"String length validation failed"` (technical jargon)

### **Pattern Errors**
- ✅ `"Username can only contain letters, numbers, and underscores"`
- ✅ `"Password must include at least one number"`
- ✅ `"URL must start with http:// or https://"`
- ❌ `"Pattern mismatch"` (not helpful)
- ❌ `"Regex validation failed"` (technical)

### **Async Errors**
- ✅ `"This email is already registered"`
- ✅ `"Username is already taken. Try adding numbers or underscores"`
- ✅ `"Could not verify email availability. Please try again"`
- ❌ `"Duplicate key error"` (technical)
- ❌ `"HTTP 409"` (technical)

---

## Accessibility Requirements

### **ARIA Labels**

```typescript
// All inputs MUST have proper ARIA
<input
  id="email"
  type="email"
  aria-label="Email address"
  aria-required="true"
  aria-invalid="{{hasError}}"
  aria-describedby="email-hint email-error"
/>
```

### **Error Announcements**

```typescript
// Error messages MUST have role="alert" for screen readers
<small
  id="email-error"
  class="error-message"
  role="alert"
  aria-live="polite"
>
  {{ errorMessage }}
</small>
```

### **Focus Management**

```typescript
// After form submission with errors, focus first invalid field
onSubmit(): void {
  if (!this.formValid()) {
    const firstInvalidField = this.getFirstInvalidField();
    if (firstInvalidField) {
      firstInvalidField.focus();
    }
  }
}
```

### **Keyboard Navigation**

- ✅ Tab through all form fields in logical order
- ✅ Enter key submits form
- ✅ Escape key clears focused field (optional)
- ✅ Arrow keys for radio/checkbox groups
- ✅ Space bar toggles checkboxes

---

## Testing Checklist

### **Unit Tests**
- [ ] All validators return correct error messages
- [ ] Form validity updates correctly
- [ ] Async validation debounces properly
- [ ] Submit button disabled when form invalid
- [ ] Error messages clear when field becomes valid

### **Integration Tests**
- [ ] Form submission with valid data succeeds
- [ ] Form submission with invalid data shows errors
- [ ] Async validation cancels previous requests
- [ ] Error messages persist until user corrects

### **Accessibility Tests**
- [ ] Screen reader announces errors
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Error messages linked via aria-describedby
- [ ] Required fields marked with aria-required

### **Visual Tests**
- [ ] Error states show red border + icon
- [ ] Success states show green border + checkmark
- [ ] Loading states show spinner
- [ ] Character count updates in real-time
- [ ] Password strength indicator updates

---

## Examples

### **Complete Registration Form**

```typescript
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormInputComponent,
    PasswordStrengthComponent,
    ButtonModule,
  ],
  template: `
    <form (ngSubmit)="onSubmit()">
      <app-form-input
        inputId="email"
        label="Email Address"
        type="email"
        [required]="true"
        [value]="email()"
        [errorMessage]="emailError() || emailAsyncError()"
        [validationState]="getEmailValidationState()"
        (valueChange)="onEmailChange($event)"
        prefixIcon="pi-envelope"
        successMessage="Email is available!"
      />

      <app-form-input
        inputId="password"
        label="Password"
        type="password"
        [required]="true"
        [value]="password()"
        [errorMessage]="passwordError()"
        [validationState]="getPasswordValidationState()"
        (valueChange)="onPasswordChange($event)"
        autocomplete="new-password"
      />

      <app-password-strength
        [password]="password()"
        [showRequirements]="true"
      />

      <app-form-input
        inputId="confirmPassword"
        label="Confirm Password"
        type="password"
        [required]="true"
        [value]="confirmPassword()"
        [errorMessage]="confirmPasswordError()"
        [validationState]="getConfirmValidationState()"
        (valueChange)="onConfirmPasswordChange($event)"
        autocomplete="new-password"
      />

      <p-button
        type="submit"
        label="Create Account"
        icon="pi pi-user-plus"
        [loading]="isSubmitting()"
        [disabled]="!formValid()"
        styleClass="w-full"
      />
    </form>
  `,
})
export class RegisterComponent {
  // Signals for form state
  email = signal('');
  password = signal('');
  confirmPassword = signal('');

  emailTouched = signal(false);
  passwordTouched = signal(false);
  confirmTouched = signal(false);

  emailValidating = signal(false);
  emailAvailable = signal(false);
  emailAsyncError = signal('');

  isSubmitting = signal(false);

  // Validation errors
  emailError = computed(() => {
    if (!this.emailTouched()) return '';
    const email = this.email();
    return FormValidators.required(email) || FormValidators.email(email) || '';
  });

  passwordError = computed(() => {
    if (!this.passwordTouched()) return '';
    return FormValidators.passwordStrength(this.password()) || '';
  });

  confirmPasswordError = computed(() => {
    if (!this.confirmTouched()) return '';
    const confirm = this.confirmPassword();
    const original = this.password();
    if (!confirm) return 'Please confirm your password';
    if (confirm !== original) return 'Passwords do not match';
    return '';
  });

  formValid = computed(() => {
    return (
      !this.emailError() &&
      !this.passwordError() &&
      !this.confirmPasswordError() &&
      !this.emailAsyncError() &&
      this.email() &&
      this.password() &&
      this.confirmPassword()
    );
  });

  // Event handlers
  onEmailChange(value: string): void {
    this.email.set(value);
    this.emailTouched.set(true);
    this.checkEmailAvailability(value);
  }

  onPasswordChange(value: string): void {
    this.password.set(value);
    this.passwordTouched.set(true);
  }

  onConfirmPasswordChange(value: string): void {
    this.confirmPassword.set(value);
    this.confirmTouched.set(true);
  }

  async onSubmit(): Promise<void> {
    // Implementation from earlier example
  }
}
```

---

## Migration Checklist

When migrating existing forms:

- [ ] Replace PrimeNG inputs with `app-form-input`
- [ ] Add password strength indicator to password fields
- [ ] Implement inline validation with signals
- [ ] Add success states for valid fields
- [ ] Implement async validation where needed
- [ ] Add character counts to text areas
- [ ] Update error messages to be specific and actionable
- [ ] Add ARIA labels and descriptions
- [ ] Test keyboard navigation
- [ ] Test with screen reader
- [ ] Add loading states to submit buttons
- [ ] Disable submit button when form invalid

---

**Status:** ✅ Standard established
**Next:** Implement in all forms across the application

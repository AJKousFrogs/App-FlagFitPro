/**
 * Angular 21 Form Utilities
 *
 * Utility functions for modern Angular 21 forms with signals
 */

import { signal, computed, Signal, WritableSignal } from "@angular/core";
import { AbstractControl, FormGroup, ValidationErrors } from "@angular/forms";

/**
 * Form Field State (Signal-based)
 */
export interface FormFieldState<T = any> {
  value: Signal<T>;
  error: Signal<string | null>;
  touched: Signal<boolean>;
  dirty: Signal<boolean>;
  valid: Signal<boolean>;
  disabled: Signal<boolean>;
}

/**
 * Create a signal-based form field state
 */
export function createFormFieldState<T = any>(
  initialValue: T = null as any,
  validator?: (value: T) => string | null,
): FormFieldState<T> {
  const value = signal<T>(initialValue);
  const touched = signal(false);
  const dirty = signal(false);
  const disabled = signal(false);

  const error = computed(() => {
    if (disabled()) return null;
    if (!touched() && !dirty()) return null;
    return validator ? validator(value()) : null;
  });

  const valid = computed(() => error() === null);

  return {
    value,
    error,
    touched,
    dirty,
    valid,
    disabled,
  };
}

/**
 * Common validators as signal-compatible functions
 */
export const FormValidators = {
  required: <T>(value: T | null | undefined): string | null => {
    if (value === null || value === undefined || value === "") {
      return "This field is required";
    }
    if (typeof value === "string" && value.trim().length === 0) {
      return "This field is required";
    }
    return null;
  },

  email: (value: string | null | undefined): string | null => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : "Please enter a valid email address";
  },

  minLength:
    (min: number) =>
    (value: string | null | undefined): string | null => {
      if (!value) return null;
      return value.length >= min ? null : `Minimum length is ${min} characters`;
    },

  maxLength:
    (max: number) =>
    (value: string | null | undefined): string | null => {
      if (!value) return null;
      return value.length <= max ? null : `Maximum length is ${max} characters`;
    },

  pattern:
    (pattern: RegExp, message: string = "Invalid format") =>
    (value: string | null | undefined): string | null => {
      if (!value) return null;
      return pattern.test(value) ? null : message;
    },

  /**
   * Password strength validator
   * Returns specific error message for first failed requirement
   */
  passwordStrength: (value: string | null | undefined): string | null => {
    if (!value) return null;

    if (value.length < 8) {
      return "Password must be at least 8 characters";
    }

    if (!/[A-Z]/.test(value)) {
      return "Password must include at least one uppercase letter";
    }

    if (!/[a-z]/.test(value)) {
      return "Password must include at least one lowercase letter";
    }

    if (!/\d/.test(value)) {
      return "Password must include at least one number";
    }

    if (!/[@$!%*?&]/.test(value)) {
      return "Password must include at least one special character (@$!%*?&)";
    }

    return null;
  },

  /**
   * Legacy password validator (kept for backwards compatibility)
   */
  password: (value: string | null | undefined): string | null => {
    if (!value) return null;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(value)
      ? null
      : "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";
  },

  /**
   * Phone number validator (E.164 format)
   */
  phone: (value: string | null | undefined): string | null => {
    if (!value) return null;
    const cleaned = value.replace(/[\s\-\(\)]/g, "");
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(cleaned)
      ? null
      : "Please enter a valid phone number";
  },

  /**
   * URL validator
   */
  url: (value: string | null | undefined): string | null => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return "Please enter a valid URL (must start with http:// or https://)";
    }
  },

  /**
   * Username validator
   */
  username: (value: string | null | undefined): string | null => {
    if (!value) return null;

    if (value.length < 3) {
      return "Username must be at least 3 characters";
    }

    if (value.length > 20) {
      return "Username cannot exceed 20 characters";
    }

    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return "Username can only contain letters, numbers, and underscores";
    }

    return null;
  },

  /**
   * Numeric range validator
   */
  range:
    (min: number, max: number) =>
    (value: number | null | undefined): string | null => {
      if (value === null || value === undefined) return null;
      if (value < min || value > max) {
        return `Value must be between ${min} and ${max}`;
      }
      return null;
    },

  /**
   * Date validator
   */
  date: (value: string | Date | null | undefined): string | null => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? "Please enter a valid date" : null;
  },

  /**
   * Future date validator
   */
  futureDate: (value: string | Date | null | undefined): string | null => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return "Please enter a valid date";
    if (date <= new Date()) return "Date must be in the future";
    return null;
  },

  /**
   * Past date validator
   */
  pastDate: (value: string | Date | null | undefined): string | null => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return "Please enter a valid date";
    if (date >= new Date()) return "Date must be in the past";
    return null;
  },

  /**
   * Age validator (for date of birth)
   */
  minAge:
    (minAge: number) =>
    (value: string | Date | null | undefined): string | null => {
      if (!value) return null;
      const birthDate = value instanceof Date ? value : new Date(value);
      if (isNaN(birthDate.getTime())) return "Please enter a valid date";

      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        age < minAge ||
        (age === minAge && monthDiff < 0) ||
        (age === minAge &&
          monthDiff === 0 &&
          today.getDate() < birthDate.getDate())
      ) {
        return `You must be at least ${minAge} years old`;
      }

      return null;
    },

  match:
    (
      otherValue: Signal<string | null | undefined>,
      message: string = "Values do not match",
    ) =>
    (value: string | null | undefined): string | null => {
      if (!value) return null;
      return value === otherValue() ? null : message;
    },
};

/**
 * Combine multiple validators
 */
export function combineValidators<T>(
  ...validators: Array<(value: T) => string | null>
): (value: T) => string | null {
  return (value: T) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  };
}

/**
 * Get form control error message
 */
export function getFormControlError(control: AbstractControl): string | null {
  if (!control.errors || !control.touched) return null;

  const errors = control.errors as ValidationErrors;

  if (errors["required"]) return "This field is required";
  if (errors["email"]) return "Please enter a valid email address";
  if (errors["minlength"]) {
    const min = errors["minlength"].requiredLength;
    return `Minimum length is ${min} characters`;
  }
  if (errors["maxlength"]) {
    const max = errors["maxlength"].requiredLength;
    return `Maximum length is ${max} characters`;
  }
  if (errors["pattern"]) return "Invalid format";
  if (errors["password"]) return "Password does not meet requirements";

  return errors["message"] || "Invalid value";
}

/**
 * Check if form control is invalid and touched
 */
export function isFormControlInvalid(control: AbstractControl): boolean {
  return !!(control.invalid && control.touched);
}

/**
 * Mark all form controls as touched
 */
export function markFormGroupTouched(formGroup: FormGroup): void {
  Object.keys(formGroup.controls).forEach((key) => {
    const control = formGroup.get(key);
    control?.markAsTouched();
  });
}

/**
 * Get form values as typed object
 */
export function getFormValues<T>(formGroup: FormGroup): T {
  return formGroup.value as T;
}

/**
 * Reset form to initial values
 */
export function resetForm(formGroup: FormGroup): void {
  formGroup.reset();
  markFormGroupTouched(formGroup);
}

/**
 * Signal Form Field State
 * Enhanced form field state with better DX
 */
export interface SignalFormFieldState {
  error: Signal<string | null>;
  touched: WritableSignal<boolean>;
  dirty: WritableSignal<boolean>;
  valid: Signal<boolean>;
  showError: () => boolean;
}

/**
 * Create a signal-based form field with validation
 * Improved DX: Single function to create form field state
 */
export function createSignalFormField(
  valueSignal: () => string,
  validator?: (value: string) => string | null,
): SignalFormFieldState {
  const touched = signal<boolean>(false);
  const dirty = signal<boolean>(false);

  const error = computed(() => {
    if (!touched() && !dirty()) return null;
    return validator ? validator(valueSignal()) : null;
  });

  const valid = computed(() => error() === null);

  const showError = () => {
    return touched() && error() !== null;
  };

  return {
    error,
    touched,
    dirty,
    valid,
    showError,
  };
}

/**
 * Form Field Configuration
 * Type-safe configuration for form fields
 */
export interface FormFieldConfig {
  label: string;
  type?: "text" | "email" | "password" | "tel" | "url" | "number";
  placeholder?: string;
  required?: boolean;
  autocomplete?: string;
  hint?: string;
  validators?: Array<(value: string) => string | null>;
}

/**
 * Create form field configuration with defaults
 */
export function createFormFieldConfig(
  config: FormFieldConfig,
): Required<FormFieldConfig> {
  return {
    label: config.label,
    type: config.type || "text",
    placeholder: config.placeholder || "",
    required: config.required ?? false,
    autocomplete: config.autocomplete || "off",
    hint: config.hint || "",
    validators: config.validators || [],
  };
}

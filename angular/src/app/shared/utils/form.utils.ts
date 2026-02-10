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
export interface FormFieldState<T = unknown> {
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
export function createFormFieldState<T = unknown>(
  initialValue: T = null as T,
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

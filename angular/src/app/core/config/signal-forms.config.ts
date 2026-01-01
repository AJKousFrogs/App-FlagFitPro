/**
 * Angular 21 Signal Forms Configuration
 *
 * Configuration and monitoring for Angular's experimental Signal Forms API.
 * This module provides utilities for:
 * - Form state management with signals
 * - Validation integration
 * - Form submission handling
 * - Migration helpers from Reactive Forms
 *
 * Note: Signal Forms are experimental in Angular 21. This configuration
 * provides a stable foundation that can evolve with the API.
 *
 * @version 1.0.0 - Angular 21 Signal Forms
 */

import {
  signal,
  computed,
  effect,
  Signal,
  WritableSignal,
  untracked,
} from "@angular/core";

// ============================================================================
// Signal Form Types
// ============================================================================

export type ValidationFn<T> = (value: T) => string | null;

export interface SignalFormFieldState<T> {
  value: T;
  touched: boolean;
  dirty: boolean;
  valid: boolean;
  error: string | null;
}

export interface SignalFormField<T> {
  /** Current field value */
  value: WritableSignal<T>;
  /** Whether field has been touched (blurred) */
  touched: WritableSignal<boolean>;
  /** Whether field value has changed from initial */
  dirty: Signal<boolean>;
  /** Current validation error message */
  error: Signal<string | null>;
  /** Whether field is valid */
  valid: Signal<boolean>;
  /** Whether to show error (touched && invalid) */
  showError: Signal<boolean>;
  /** Reset field to initial value */
  reset: () => void;
  /** Mark field as touched */
  markTouched: () => void;
  /** Get current state snapshot */
  getState: () => SignalFormFieldState<T>;
}

export interface SignalFormGroup<T extends Record<string, unknown>> {
  /** All form fields */
  fields: { [K in keyof T]: SignalFormField<T[K]> };
  /** Whether entire form is valid */
  valid: Signal<boolean>;
  /** Whether any field is dirty */
  dirty: Signal<boolean>;
  /** Whether all required fields are touched */
  touched: Signal<boolean>;
  /** Get form values as object */
  value: Signal<T>;
  /** Reset all fields */
  reset: () => void;
  /** Mark all fields as touched */
  markAllTouched: () => void;
  /** Get form state snapshot */
  getState: () => { [K in keyof T]: SignalFormFieldState<T[K]> };
}

// ============================================================================
// Signal Form Field Factory
// ============================================================================

/**
 * Create a signal-based form field with validation
 *
 * @example
 * const emailField = createSignalField('', [
 *   Validators.required('Email is required'),
 *   Validators.email('Invalid email format')
 * ]);
 *
 * // In template:
 * <input [(ngModel)]="emailField.value" (blur)="emailField.markTouched()" />
 * @if (emailField.showError()) {
 *   <span class="error">{{ emailField.error() }}</span>
 * }
 */
export function createSignalField<T>(
  initialValue: T,
  validators: ValidationFn<T>[] = [],
): SignalFormField<T> {
  const value = signal(initialValue);
  const touched = signal(false);
  const initialValueRef = initialValue;

  // Computed: dirty state
  const dirty = computed(() => value() !== initialValueRef);

  // Computed: validation error
  const error = computed(() => {
    const currentValue = value();
    for (const validator of validators) {
      const result = validator(currentValue);
      if (result) return result;
    }
    return null;
  });

  // Computed: valid state
  const valid = computed(() => error() === null);

  // Computed: show error (touched and invalid)
  const showError = computed(() => touched() && !valid());

  return {
    value,
    touched,
    dirty,
    error,
    valid,
    showError,
    reset: () => {
      value.set(initialValueRef);
      touched.set(false);
    },
    markTouched: () => touched.set(true),
    getState: () => ({
      value: untracked(value),
      touched: untracked(touched),
      dirty: untracked(dirty),
      valid: untracked(valid),
      error: untracked(error),
    }),
  };
}

// ============================================================================
// Signal Form Group Factory
// ============================================================================

/**
 * Create a signal-based form group from field definitions
 *
 * @example
 * const form = createSignalFormGroup({
 *   name: createSignalField('', [Validators.required('Name is required')]),
 *   email: createSignalField('', [
 *     Validators.required('Email is required'),
 *     Validators.email('Invalid email')
 *   ]),
 *   age: createSignalField<number | null>(null, [
 *     Validators.required('Age is required'),
 *     Validators.min(18, 'Must be 18 or older')
 *   ])
 * });
 *
 * // Check validity
 * if (form.valid()) {
 *   const data = form.value();
 *   // submit data
 * }
 */
export function createSignalFormGroup<
  T extends Record<string, unknown>,
>(fields: { [K in keyof T]: SignalFormField<T[K]> }): SignalFormGroup<T> {
  const fieldKeys = Object.keys(fields) as (keyof T)[];

  // Computed: form validity
  const valid = computed(() => fieldKeys.every((key) => fields[key].valid()));

  // Computed: form dirty state
  const dirty = computed(() => fieldKeys.some((key) => fields[key].dirty()));

  // Computed: form touched state
  const touched = computed(() =>
    fieldKeys.every((key) => fields[key].touched()),
  );

  // Computed: form values
  const value = computed(() => {
    const result = {} as T;
    for (const key of fieldKeys) {
      result[key] = fields[key].value() as T[typeof key];
    }
    return result;
  });

  return {
    fields,
    valid,
    dirty,
    touched,
    value,
    reset: () => fieldKeys.forEach((key) => fields[key].reset()),
    markAllTouched: () => fieldKeys.forEach((key) => fields[key].markTouched()),
    getState: () => {
      const result = {} as { [K in keyof T]: SignalFormFieldState<T[K]> };
      for (const key of fieldKeys) {
        result[key] = fields[key].getState();
      }
      return result;
    },
  };
}

// ============================================================================
// Built-in Validators
// ============================================================================

export const SignalValidators = {
  /**
   * Required field validator
   */
  required:
    <T>(message = "This field is required"): ValidationFn<T> =>
    (value: T) => {
      if (value === null || value === undefined) return message;
      if (typeof value === "string" && value.trim() === "") return message;
      if (Array.isArray(value) && value.length === 0) return message;
      return null;
    },

  /**
   * Email format validator
   */
  email:
    (message = "Invalid email format"): ValidationFn<string> =>
    (value: string) => {
      if (!value) return null; // Let required handle empty
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? null : message;
    },

  /**
   * Minimum length validator
   */
  minLength:
    (min: number, message?: string): ValidationFn<string> =>
    (value: string) => {
      if (!value) return null;
      return value.length >= min
        ? null
        : message || `Minimum ${min} characters required`;
    },

  /**
   * Maximum length validator
   */
  maxLength:
    (max: number, message?: string): ValidationFn<string> =>
    (value: string) => {
      if (!value) return null;
      return value.length <= max
        ? null
        : message || `Maximum ${max} characters allowed`;
    },

  /**
   * Minimum number validator
   */
  min:
    (min: number, message?: string): ValidationFn<number | null> =>
    (value: number | null) => {
      if (value === null || value === undefined) return null;
      return value >= min ? null : message || `Minimum value is ${min}`;
    },

  /**
   * Maximum number validator
   */
  max:
    (max: number, message?: string): ValidationFn<number | null> =>
    (value: number | null) => {
      if (value === null || value === undefined) return null;
      return value <= max ? null : message || `Maximum value is ${max}`;
    },

  /**
   * Pattern validator
   */
  pattern:
    (regex: RegExp, message = "Invalid format"): ValidationFn<string> =>
    (value: string) => {
      if (!value) return null;
      return regex.test(value) ? null : message;
    },

  /**
   * Custom validator
   */
  custom:
    <T>(fn: (value: T) => boolean, message: string): ValidationFn<T> =>
    (value: T) => {
      return fn(value) ? null : message;
    },
};

// ============================================================================
// Form Submission Helper
// ============================================================================

export interface SubmitOptions<T, R> {
  form: SignalFormGroup<T>;
  onSubmit: (data: T) => Promise<R>;
  onSuccess?: (result: R) => void;
  onError?: (error: unknown) => void;
}

/**
 * Create a form submission handler with loading state
 */
export function createFormSubmitHandler<
  T extends Record<string, unknown>,
  R = void,
>(options: SubmitOptions<T, R>) {
  const isSubmitting = signal(false);
  const submitError = signal<string | null>(null);

  const submit = async (): Promise<R | null> => {
    // Mark all fields as touched to show validation errors
    options.form.markAllTouched();

    // Check validity
    if (!options.form.valid()) {
      return null;
    }

    isSubmitting.set(true);
    submitError.set(null);

    try {
      const result = await options.onSubmit(options.form.value());
      options.onSuccess?.(result);
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Submission failed";
      submitError.set(message);
      options.onError?.(error);
      return null;
    } finally {
      isSubmitting.set(false);
    }
  };

  return {
    submit,
    isSubmitting: isSubmitting.asReadonly(),
    submitError: submitError.asReadonly(),
    canSubmit: computed(() => options.form.valid() && !isSubmitting()),
  };
}

// ============================================================================
// Migration Helper: Reactive Forms to Signal Forms
// ============================================================================

/**
 * Helper to migrate from Reactive Forms to Signal Forms
 *
 * @example
 * // Before (Reactive Forms):
 * this.form = this.fb.group({
 *   name: ['', Validators.required],
 *   email: ['', [Validators.required, Validators.email]]
 * });
 *
 * // After (Signal Forms):
 * this.form = createSignalFormGroup({
 *   name: createSignalField('', [SignalValidators.required()]),
 *   email: createSignalField('', [
 *     SignalValidators.required(),
 *     SignalValidators.email()
 *   ])
 * });
 */
export const SignalFormsMigrationGuide = {
  /**
   * Reactive Forms → Signal Forms equivalents:
   *
   * FormControl → createSignalField
   * FormGroup → createSignalFormGroup
   * Validators.required → SignalValidators.required()
   * Validators.email → SignalValidators.email()
   * Validators.minLength → SignalValidators.minLength()
   * Validators.maxLength → SignalValidators.maxLength()
   * Validators.min → SignalValidators.min()
   * Validators.max → SignalValidators.max()
   * Validators.pattern → SignalValidators.pattern()
   *
   * Template changes:
   * formControlName="name" → [(ngModel)]="form.fields.name.value"
   * form.get('name')?.invalid → !form.fields.name.valid()
   * form.get('name')?.touched → form.fields.name.touched()
   * form.get('name')?.errors?.['required'] → form.fields.name.error()
   */
  version: "Angular 21",
  status: "experimental",
  recommendation:
    "Signal Forms are experimental. Use for new features, migrate existing forms gradually.",
};

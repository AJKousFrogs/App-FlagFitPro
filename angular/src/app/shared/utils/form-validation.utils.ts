/**
 * Form Validation Utilities
 *
 * Provides comprehensive form validation patterns for consistent
 * validation across the application before API submission.
 *
 * @version 1.0.0
 */

import {
  AbstractControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { safeParseDate, validateDateRange } from "./date.utils";
import { roundToPrecision } from "./precision.utils";

// ============================================================================
// Validation Result Types
// ============================================================================

export interface FieldValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface FormValidationResult {
  valid: boolean;
  errors: FieldValidationError[];
  warnings: FieldValidationError[];
}

// ============================================================================
// Custom Validators
// ============================================================================

/**
 * Validator that requires a valid date string or Date object.
 */
export function validDate(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: unknown } | null => {
    if (!control.value) return null; // Let required validator handle empty

    const parsed = safeParseDate(control.value);
    if (!parsed) {
      return { invalidDate: { value: control.value } };
    }
    return null;
  };
}

/**
 * Validator for date within a specific range.
 */
export function dateRange(options: {
  maxPastDays?: number;
  maxFutureDays?: number;
  allowPast?: boolean;
  allowFuture?: boolean;
}): ValidatorFn {
  return (control: AbstractControl): { [key: string]: unknown } | null => {
    if (!control.value) return null;

    const result = validateDateRange(control.value, options);
    if (!result.valid) {
      return { dateRange: { message: result.error, value: control.value } };
    }
    return null;
  };
}

/**
 * Validator for numeric range with precision.
 */
export function numericRange(
  min: number,
  max: number,
  decimals: number = 2,
): ValidatorFn {
  return (control: AbstractControl): { [key: string]: unknown } | null => {
    if (
      control.value === null ||
      control.value === undefined ||
      control.value === ""
    ) {
      return null;
    }

    const value = Number(control.value);
    if (isNaN(value)) {
      return { invalidNumber: { value: control.value } };
    }

    const rounded = roundToPrecision(value, decimals);
    if (rounded < min) {
      return { min: { min, actual: rounded } };
    }
    if (rounded > max) {
      return { max: { max, actual: rounded } };
    }

    return null;
  };
}

/**
 * Validator for RPE (Rate of Perceived Exertion) - 1-10 scale.
 */
export function rpeValidator(): ValidatorFn {
  return numericRange(1, 10, 0);
}

/**
 * Validator for intensity level - 1-10 scale.
 */
export function intensityValidator(): ValidatorFn {
  return numericRange(1, 10, 0);
}

/**
 * Validator for duration in minutes.
 */
export function durationValidator(maxMinutes: number = 480): ValidatorFn {
  return numericRange(1, maxMinutes, 0);
}

/**
 * Validator for percentage values.
 */
export function percentageValidator(): ValidatorFn {
  return numericRange(0, 100, 1);
}

/**
 * Validator for positive integers.
 */
export function positiveInteger(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: unknown } | null => {
    if (
      control.value === null ||
      control.value === undefined ||
      control.value === ""
    ) {
      return null;
    }

    const value = Number(control.value);
    if (isNaN(value) || !Number.isInteger(value) || value < 0) {
      return { positiveInteger: { value: control.value } };
    }
    return null;
  };
}

/**
 * Validator for trimmed non-empty string.
 */
export function nonEmptyString(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: unknown } | null => {
    if (!control.value) return null;

    if (
      typeof control.value !== "string" ||
      control.value.trim().length === 0
    ) {
      return { emptyString: true };
    }
    return null;
  };
}

/**
 * Validator for maximum string length after trimming.
 */
export function maxTrimmedLength(maxLength: number): ValidatorFn {
  return (control: AbstractControl): { [key: string]: unknown } | null => {
    if (!control.value) return null;

    const trimmed = String(control.value).trim();
    if (trimmed.length > maxLength) {
      return {
        maxlength: { requiredLength: maxLength, actualLength: trimmed.length },
      };
    }
    return null;
  };
}

// ============================================================================
// Form Validation Functions
// ============================================================================

/**
 * Validate an entire form and return detailed results.
 *
 * @param form - The form group to validate
 * @returns Validation result with errors and warnings
 */
export function validateForm(form: FormGroup): FormValidationResult {
  const errors: FieldValidationError[] = [];
  const warnings: FieldValidationError[] = [];

  // Mark all fields as touched to trigger validation
  markFormGroupTouched(form);

  // Collect errors from all controls
  Object.keys(form.controls).forEach((key) => {
    const control = form.get(key);
    if (control?.errors) {
      const errorMessages = getErrorMessages(key, control.errors);
      errors.push(...errorMessages);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Mark all controls in a form group as touched.
 */
export function markFormGroupTouched(formGroup: FormGroup): void {
  Object.keys(formGroup.controls).forEach((key) => {
    const control = formGroup.get(key);
    control?.markAsTouched();
    control?.markAsDirty();

    if (control instanceof FormGroup) {
      markFormGroupTouched(control);
    }
  });
}

/**
 * Get human-readable error messages from control errors.
 */
export function getErrorMessages(
  fieldName: string,
  errors: { [key: string]: unknown },
): FieldValidationError[] {
  const messages: FieldValidationError[] = [];

  if (errors["required"]) {
    messages.push({
      field: fieldName,
      message: `${formatFieldName(fieldName)} is required`,
    });
  }

  if (errors["minlength"]) {
    const err = errors["minlength"] as {
      requiredLength: number;
      actualLength: number;
    };
    messages.push({
      field: fieldName,
      message: `${formatFieldName(fieldName)} must be at least ${err.requiredLength} characters`,
      value: err.actualLength,
    });
  }

  if (errors["maxlength"]) {
    const err = errors["maxlength"] as {
      requiredLength: number;
      actualLength: number;
    };
    messages.push({
      field: fieldName,
      message: `${formatFieldName(fieldName)} cannot exceed ${err.requiredLength} characters`,
      value: err.actualLength,
    });
  }

  if (errors["min"]) {
    const err = errors["min"] as { min: number; actual: number };
    messages.push({
      field: fieldName,
      message: `${formatFieldName(fieldName)} must be at least ${err.min}`,
      value: err.actual,
    });
  }

  if (errors["max"]) {
    const err = errors["max"] as { max: number; actual: number };
    messages.push({
      field: fieldName,
      message: `${formatFieldName(fieldName)} cannot exceed ${err.max}`,
      value: err.actual,
    });
  }

  if (errors["email"]) {
    messages.push({
      field: fieldName,
      message: "Please enter a valid email address",
    });
  }

  if (errors["invalidDate"]) {
    messages.push({
      field: fieldName,
      message: `${formatFieldName(fieldName)} must be a valid date`,
      value: (errors["invalidDate"] as { value: unknown }).value,
    });
  }

  if (errors["dateRange"]) {
    const err = errors["dateRange"] as { message: string; value: unknown };
    messages.push({
      field: fieldName,
      message: err.message,
      value: err.value,
    });
  }

  if (errors["invalidNumber"]) {
    messages.push({
      field: fieldName,
      message: `${formatFieldName(fieldName)} must be a valid number`,
      value: (errors["invalidNumber"] as { value: unknown }).value,
    });
  }

  if (errors["positiveInteger"]) {
    messages.push({
      field: fieldName,
      message: `${formatFieldName(fieldName)} must be a positive whole number`,
      value: (errors["positiveInteger"] as { value: unknown }).value,
    });
  }

  if (errors["emptyString"]) {
    messages.push({
      field: fieldName,
      message: `${formatFieldName(fieldName)} cannot be empty or whitespace only`,
    });
  }

  // Generic error for unknown types
  const knownErrors = [
    "required",
    "minlength",
    "maxlength",
    "min",
    "max",
    "email",
    "invalidDate",
    "dateRange",
    "invalidNumber",
    "positiveInteger",
    "emptyString",
  ];

  Object.keys(errors).forEach((key) => {
    if (!knownErrors.includes(key)) {
      messages.push({
        field: fieldName,
        message: `${formatFieldName(fieldName)} is invalid`,
        value: errors[key],
      });
    }
  });

  return messages;
}

/**
 * Format field name for display (camelCase to Title Case).
 */
export function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/_/g, " ")
    .trim();
}

// ============================================================================
// Pre-built Validator Sets
// ============================================================================

/**
 * Common validators for training session forms.
 */
export const TrainingSessionValidators = {
  sessionDate: [
    Validators.required,
    validDate(),
    dateRange({ maxPastDays: 365, maxFutureDays: 30 }),
  ],
  durationMinutes: [Validators.required, durationValidator(480)],
  rpe: [rpeValidator()],
  intensityLevel: [intensityValidator()],
  notes: [maxTrimmedLength(1000)],
};

/**
 * Common validators for wellness check-in forms.
 */
export const WellnessValidators = {
  date: [
    Validators.required,
    validDate(),
    dateRange({ maxPastDays: 7, allowFuture: false }),
  ],
  sleepHours: [numericRange(0, 24, 1)],
  sleepQuality: [numericRange(1, 10, 0)],
  stressLevel: [numericRange(1, 10, 0)],
  energyLevel: [numericRange(1, 10, 0)],
  muscleSoreness: [numericRange(1, 10, 0)],
  mood: [numericRange(1, 10, 0)],
  notes: [maxTrimmedLength(500)],
};

/**
 * Common validators for game tracking forms.
 */
export const GameValidators = {
  opponentName: [Validators.required, nonEmptyString(), maxTrimmedLength(100)],
  gameDate: [Validators.required, validDate()],
  gameTime: [maxTrimmedLength(10)],
  location: [maxTrimmedLength(200)],
  notes: [maxTrimmedLength(1000)],
  temperature: [numericRange(-50, 50, 0)],
};

/**
 * Common validators for user profile forms.
 */
export const ProfileValidators = {
  fullName: [nonEmptyString(), maxTrimmedLength(100)],
  email: [Validators.required, Validators.email],
  jerseyNumber: [maxTrimmedLength(5)],
  position: [maxTrimmedLength(50)],
  bio: [maxTrimmedLength(500)],
};

// ============================================================================
// Form Data Sanitization
// ============================================================================

/**
 * Sanitize form data before API submission.
 * Trims strings, rounds numbers, formats dates.
 */
export function sanitizeFormData<T extends Record<string, unknown>>(
  data: T,
  options: {
    trimStrings?: boolean;
    roundNumbers?: number;
    formatDates?: boolean;
  } = {},
): T {
  const { trimStrings = true, roundNumbers = 2, formatDates = true } = options;
  const result = { ...data };

  Object.keys(result).forEach((key) => {
    const value = result[key];

    // Trim strings
    if (trimStrings && typeof value === "string") {
      (result as Record<string, unknown>)[key] = value.trim();
    }

    // Round numbers
    if (roundNumbers !== undefined && typeof value === "number") {
      (result as Record<string, unknown>)[key] = roundToPrecision(
        value,
        roundNumbers,
      );
    }

    // Format dates to ISO strings
    if (formatDates && value instanceof Date) {
      (result as Record<string, unknown>)[key] = value
        .toISOString()
        .split("T")[0];
    }
  });

  return result;
}

/**
 * Remove null/undefined values from form data.
 */
export function removeEmptyValues<T extends Record<string, unknown>>(
  data: T,
): Partial<T> {
  const result: Partial<T> = {};

  Object.keys(data).forEach((key) => {
    const value = data[key];
    if (value !== null && value !== undefined && value !== "") {
      (result as Record<string, unknown>)[key] = value;
    }
  });

  return result;
}

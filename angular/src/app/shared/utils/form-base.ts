/**
 * Form Base Class
 *
 * Provides common form functionality for components
 * Eliminates duplicate form validation and error handling logic
 */

import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
} from "@angular/forms";
import { DestroyRef, computed, inject, signal } from "@angular/core";
import { isFormControlInvalid, getFormControlError } from "./form.utils";

/**
 * Base class for form-heavy components
 * Provides:
 * - Field validation helpers
 * - Error message handling
 * - Form state management
 * - Submission handling
 *
 * @example
 * export class MyFormComponent extends FormBase {
 *   myForm = new FormGroup({ ... });
 *
 *   constructor() {
 *     super();
 *     this.trackFormChanges(this.myForm);
 *   }
 * }
 */
export abstract class FormBase {
  protected readonly destroyRef = inject(DestroyRef);

  readonly submitted = signal(false);
  readonly submitting = signal(false);

  /**
   * Check if a form field is invalid (and touched)
   * Use in template: [class.error]="isFieldInvalid('email')"
   */
  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const control = formGroup.get(fieldName);
    return control ? isFormControlInvalid(control) : false;
  }

  /**
   * Get error message for a field
   * Use in template: <div>{{ getFieldError('email') }}</div>
   */
  getFieldError(formGroup: FormGroup, fieldName: string): string | null {
    const control = formGroup.get(fieldName);
    if (!control) return null;

    // Check if field should show error
    if (!control.errors || !control.touched) return null;

    return getFormControlError(control);
  }

  /**
   * Get all validation errors for a field
   * Returns object with error details
   */
  getFieldErrors(formGroup: FormGroup, fieldName: string): ValidationErrors | null {
    const control = formGroup.get(fieldName);
    if (!control || !control.touched) return null;
    return control.errors;
  }

  /**
   * Check if any field in form is invalid
   */
  isFormInvalid(formGroup: FormGroup): boolean {
    return !!(formGroup.invalid && (this.submitted() || Object.values(formGroup.controls).some(c => c.touched)));
  }

  /**
   * Mark all form fields as touched
   * Call before checking validation
   */
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Reset form state
   */
  resetForm(formGroup: FormGroup): void {
    formGroup.reset();
    this.submitted.set(false);
  }

  /**
   * Handle form submission
   * Sets submitted flag and validates form
   */
  protected onSubmit(
    formGroup: FormGroup,
    onSubmit: () => void | Promise<void>,
  ): void {
    this.submitted.set(true);

    if (!formGroup.valid) {
      this.markFormGroupTouched(formGroup);
      return;
    }

    onSubmit();
  }

  /**
   * Create a method to show custom field error
   * Useful for server-side validation errors
   */
  setFieldError(
    formGroup: FormGroup,
    fieldName: string,
    errorMessage: string,
  ): void {
    const control = formGroup.get(fieldName);
    if (control) {
      control.setErrors({ custom: { message: errorMessage } });
      control.markAsTouched();
    }
  }

  /**
   * Clear all errors from a form
   */
  clearFormErrors(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.setErrors(null);
      control?.markAsUntouched();
    });
    this.submitted.set(false);
  }

  /**
   * Create helper method to protect against multiple submissions
   * @example
   * async onSubmit() {
   *   return this.withSubmissionGuard(async () => {
   *     await this.saveForm();
   *   });
   * }
   */
  protected async withSubmissionGuard<T>(
    operation: () => Promise<T>,
  ): Promise<T | null> {
    if (this.submitting()) return null;

    this.submitting.set(true);
    try {
      return await operation();
    } finally {
      this.submitting.set(false);
    }
  }
}

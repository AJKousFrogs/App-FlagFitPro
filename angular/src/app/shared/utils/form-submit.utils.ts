/**
 * Form Submission Handler Utility
 * 
 * Provides a reusable pattern for handling form submissions with loading states,
 * error handling, and success/failure notifications.
 * 
 * @example
 * ```typescript
 * import { FormSubmitHandler } from '@shared/utils/form-submit.utils';
 * 
 * class MyComponent {
 *   private submitHandler = new FormSubmitHandler(
 *     inject(ToastService),
 *     inject(Router),
 *     inject(DestroyRef)
 *   );
 * 
 *   async onSubmit(): Promise<void> {
 *     await this.submitHandler.handle({
 *       form: this.myForm,
 *       apiCall: () => this.apiService.post('/endpoint', this.myForm.value),
 *       successMessage: 'Data saved successfully!',
 *       navigateTo: ['/dashboard'],
 *     });
 *   }
 * }
 * ```
 */

import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { signal, Signal } from '@angular/core';
import { ToastService } from '@core/services/toast.service';
import { Observable, firstValueFrom } from 'rxjs';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface FormSubmitOptions<T = unknown> {
  /** The form to validate and submit */
  form: FormGroup;
  
  /** The API call to make (can return Promise or Observable) */
  apiCall: () => Promise<T> | Observable<T>;
  
  /** Success message to display (optional) */
  successMessage?: string;
  
  /** Error message to display (optional, uses API error if not provided) */
  errorMessage?: string;
  
  /** Route to navigate to after successful submission (optional) */
  navigateTo?: string[];
  
  /** Callback to run after successful submission (optional) */
  onSuccess?: (result: T) => void;
  
  /** Callback to run after failed submission (optional) */
  onError?: (error: Error) => void;
  
  /** Whether to mark all fields as touched on validation failure (default: true) */
  touchOnValidationFailure?: boolean;
}

export class FormSubmitHandler {
  private _isSubmitting = signal(false);
  
  /** Signal tracking submission state */
  readonly isSubmitting: Signal<boolean> = this._isSubmitting.asReadonly();

  constructor(
    private toastService: ToastService,
    private router?: Router,
    private destroyRef?: DestroyRef,
  ) {}

  /**
   * Handle form submission with automatic validation, loading state, and error handling
   * @param options - Form submission options
   * @returns Promise that resolves to the API result or undefined if validation fails
   */
  async handle<T = unknown>(
    options: FormSubmitOptions<T>,
  ): Promise<T | undefined> {
    const {
      form,
      apiCall,
      successMessage,
      errorMessage,
      navigateTo,
      onSuccess,
      onError,
      touchOnValidationFailure = true,
    } = options;

    // Validate form
    if (form.invalid) {
      if (touchOnValidationFailure) {
        this.markFormGroupTouched(form);
      }
      return undefined;
    }

    // Set loading state
    this._isSubmitting.set(true);

    try {
      // Execute API call
      let result: T;
      const apiResult = apiCall();
      
      if (apiResult instanceof Observable) {
        // Handle Observable
        const takeUntil = this.destroyRef 
          ? takeUntilDestroyed(this.destroyRef)
          : (source: Observable<T>) => source;
        
        result = await firstValueFrom(apiResult.pipe(takeUntil));
      } else {
        // Handle Promise
        result = await apiResult;
      }

      // Show success message
      if (successMessage) {
        this.toastService.success(successMessage);
      }

      // Execute success callback
      if (onSuccess) {
        onSuccess(result);
      }

      // Navigate if specified
      if (navigateTo && this.router) {
        // Small delay to show success message
        setTimeout(() => {
          this.router!.navigate(navigateTo);
        }, 500);
      }

      return result;
    } catch (error) {
      // Show error message
      const message = errorMessage || this.extractErrorMessage(error);
      this.toastService.error(message);

      // Execute error callback
      if (onError && error instanceof Error) {
        onError(error);
      }

      return undefined;
    } finally {
      this._isSubmitting.set(false);
    }
  }

  /**
   * Mark all controls in a form group as touched
   * @param formGroup - The form group to mark
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Extract error message from various error types
   * @param error - The error object
   * @returns A user-friendly error message
   */
  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>;
      
      if (typeof errorObj.message === 'string') {
        return errorObj.message;
      }
      
      if (typeof errorObj.error === 'string') {
        return errorObj.error;
      }
      
      if (
        typeof errorObj.error === 'object' &&
        errorObj.error !== null &&
        typeof (errorObj.error as Record<string, unknown>).message === 'string'
      ) {
        return (errorObj.error as Record<string, unknown>).message as string;
      }
    }
    
    return 'An error occurred. Please try again.';
  }

  /**
   * Reset the submission state (useful for cleanup)
   */
  reset(): void {
    this._isSubmitting.set(false);
  }
}


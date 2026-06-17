/**
 * Retry Handler Utilities
 *
 * Consolidates common retry/reload patterns across components.
 * Standardizes error state reset and data reloading logic.
 */

import { signal, WritableSignal } from "@angular/core";

/**
 * Create a retry handler function that:
 * 1. Resets error/loading state (if provided)
 * 2. Calls the provided load function
 *
 * Usage:
 * ```typescript
 * retryLoad = createRetryHandler(() => {
 *   this.loadData();
 * }, {
 *   errorSignal: this.hasPageError,
 *   errorMessageSignal: this.pageErrorMessage,
 * });
 *
 * // In template:
 * <app-page-error-state (retry)="retryLoad()" />
 * ```
 */
export function createRetryHandler(
  loadFn: () => void | Promise<void>,
  options: {
    errorSignal?: WritableSignal<boolean>;
    errorMessageSignal?: WritableSignal<string>;
    loadingSignal?: WritableSignal<boolean>;
  } = {},
): () => void {
  return () => {
    // Reset error states
    if (options.errorSignal) {
      options.errorSignal.set(false);
    }
    if (options.errorMessageSignal) {
      options.errorMessageSignal.set("");
    }
    if (options.loadingSignal) {
      options.loadingSignal.set(true);
    }

    // Call load function
    const result = loadFn();

    // If it returns a promise, wait for it
    if (result instanceof Promise) {
      result.finally(() => {
        if (options.loadingSignal) {
          options.loadingSignal.set(false);
        }
      });
    }
  };
}

/**
 * Simpler version for components with just a single load method
 * Usage:
 * ```typescript
 * retryLoad = () => {
 *   this.hasPageError.set(false);
 *   this.loadData();
 * };
 * ```
 * This utility doesn't add much value, so the pattern above (inline)
 * is preferred for simple cases.
 */
export function resetPageError(
  errorSignal?: WritableSignal<boolean>,
  errorMessageSignal?: WritableSignal<string>,
): void {
  if (errorSignal) {
    errorSignal.set(false);
  }
  if (errorMessageSignal) {
    errorMessageSignal.set("");
  }
}

/**
 * Operation Handler Utility
 *
 * Provides consistent patterns for handling async operations with:
 * - Automatic error state reset before operations
 * - Loading state management
 * - Error state clearing on success
 * - Toast notifications
 * - Offline queue fallback
 *
 * Use this for ANY component operation that involves API calls or async work.
 *
 * @example
 * ```typescript
 * // In component
 * private operationHandler = new OperationHandler(
 *   inject(ToastService),
 *   inject(LoggerService)
 * );
 *
 * loading = signal(false);
 * error = signal<string | null>(null);
 *
 * async loadData(): Promise<void> {
 *   await this.operationHandler.execute({
 *     operation: () => this.apiService.get('/data'),
 *     loadingSignal: this.loading,
 *     errorSignal: this.error,
 *     onSuccess: (data) => this.data.set(data),
 *     errorMessage: 'Failed to load data',
 *   });
 * }
 * ```
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { WritableSignal, Signal, signal, DestroyRef } from "@angular/core";
import { Observable, firstValueFrom, Subscription } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ToastService } from "../../core/services/toast.service";
import { LoggerService } from "../../core/services/logger.service";
import { OfflineQueueService, QueuedAction } from "../../core/services/offline-queue.service";
import { getErrorMessage } from "./error.utils";

/**
 * Options for executing an operation
 */
export interface OperationOptions<T> {
  /** The async operation to execute (Promise or Observable) */
  operation: () => Promise<T> | Observable<T>;

  /** Signal to track loading state */
  loadingSignal?: WritableSignal<boolean>;

  /** Signal to track error state */
  errorSignal?: WritableSignal<string | null>;

  /** Callback on successful completion */
  onSuccess?: (result: T) => void;

  /** Callback on error */
  onError?: (error: unknown) => void;

  /** Success message to show via toast */
  successMessage?: string;

  /** Error message to show via toast (falls back to error extraction) */
  errorMessage?: string;

  /** Whether to show toast on error (default: true) */
  showErrorToast?: boolean;

  /** Whether to show toast on success (default: true if successMessage provided) */
  showSuccessToast?: boolean;

  /** Context for logging */
  context?: string;

  /** DestroyRef for automatic cleanup */
  destroyRef?: DestroyRef;

  /** Offline queue configuration (if provided, will queue on network error) */
  offlineQueue?: {
    service: OfflineQueueService;
    actionType: QueuedAction["type"];
    payload: Record<string, unknown>;
    priority?: QueuedAction["priority"];
    offlineSuccessMessage?: string;
  };
}

/**
 * Result of an operation execution
 */
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  wasQueued?: boolean;
}

/**
 * Operation handler for consistent async operation patterns
 */
export class OperationHandler {
  constructor(
    private toastService?: ToastService,
    private logger?: LoggerService,
  ) {}

  /**
   * Execute an async operation with automatic state management
   *
   * IMPORTANT: This method automatically:
   * 1. Resets error state before starting
   * 2. Sets loading state to true
   * 3. Clears error state on success
   * 4. Sets error state on failure
   * 5. Always sets loading to false when complete
   */
  async execute<T>(options: OperationOptions<T>): Promise<OperationResult<T>> {
    const {
      operation,
      loadingSignal,
      errorSignal,
      onSuccess,
      onError,
      successMessage,
      errorMessage,
      showErrorToast = true,
      showSuccessToast = !!successMessage,
      context = "Operation",
      destroyRef,
      offlineQueue,
    } = options;

    // CRITICAL: Reset error state before starting
    if (errorSignal) {
      errorSignal.set(null);
    }

    // Set loading state
    if (loadingSignal) {
      loadingSignal.set(true);
    }

    try {
      // Execute the operation
      let result: T;
      const operationResult = operation();

      if (operationResult instanceof Observable) {
        // Handle Observable
        const pipe = destroyRef
          ? takeUntilDestroyed(destroyRef)
          : (source: Observable<T>) => source;

        result = (await firstValueFrom(operationResult.pipe(pipe))) as T;
      } else {
        // Handle Promise
        result = await operationResult;
      }

      // Clear error state on success (belt and suspenders)
      if (errorSignal) {
        errorSignal.set(null);
      }

      // Show success toast
      if (showSuccessToast && successMessage && this.toastService) {
        this.toastService.success(successMessage);
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }

      this.logger?.debug(`[${context}] Operation completed successfully`);

      return { success: true, data: result };
    } catch (error) {
      // Check if this is a network error and we should queue
      if (offlineQueue && this.isNetworkError(error)) {
        offlineQueue.service.queueAction(
          offlineQueue.actionType,
          offlineQueue.payload,
          offlineQueue.priority || "medium",
        );

        if (this.toastService && offlineQueue.offlineSuccessMessage) {
          this.toastService.info(offlineQueue.offlineSuccessMessage);
        }

        // Clear error since we queued it
        if (errorSignal) {
          errorSignal.set(null);
        }

        return { success: true, wasQueued: true };
      }

      // Extract and set error message
      const extractedError = getErrorMessage(
        error,
        errorMessage || "An error occurred",
      );

      if (errorSignal) {
        errorSignal.set(extractedError);
      }

      // Show error toast
      if (showErrorToast && this.toastService) {
        this.toastService.error(extractedError);
      }

      // Log error
      this.logger?.error(`[${context}] Operation failed`, error);

      // Call error callback
      if (onError) {
        onError(error);
      }

      return { success: false, error: extractedError };
    } finally {
      // Always reset loading state
      if (loadingSignal) {
        loadingSignal.set(false);
      }
    }
  }

  /**
   * Execute multiple operations in parallel
   */
  async executeParallel<T extends readonly unknown[]>(
    operations: { [K in keyof T]: () => Promise<T[K]> | Observable<T[K]> },
    options: Omit<OperationOptions<T>, "operation" | "onSuccess"> & {
      onSuccess?: (results: T) => void;
    } = {},
  ): Promise<OperationResult<T>> {
    const {
      loadingSignal,
      errorSignal,
      onSuccess,
      onError,
      errorMessage,
      showErrorToast = true,
      context = "Parallel Operation",
    } = options;

    // Reset error state
    if (errorSignal) {
      errorSignal.set(null);
    }

    // Set loading state
    if (loadingSignal) {
      loadingSignal.set(true);
    }

    try {
      const promises = operations.map(async (op) => {
        const result = op();
        if (result instanceof Observable) {
          return firstValueFrom(result);
        }
        return result;
      });

      const results = (await Promise.all(promises)) as unknown as T;

      // Clear error on success
      if (errorSignal) {
        errorSignal.set(null);
      }

      if (onSuccess) {
        onSuccess(results);
      }

      return { success: true, data: results };
    } catch (error) {
      const extractedError = getErrorMessage(
        error,
        errorMessage || "One or more operations failed",
      );

      if (errorSignal) {
        errorSignal.set(extractedError);
      }

      if (showErrorToast && this.toastService) {
        this.toastService.error(extractedError);
      }

      this.logger?.error(`[${context}] Parallel operation failed`, error);

      if (onError) {
        onError(error);
      }

      return { success: false, error: extractedError };
    } finally {
      if (loadingSignal) {
        loadingSignal.set(false);
      }
    }
  }

  /**
   * Check if an error is a network-related error
   */
  private isNetworkError(error: unknown): boolean {
    if (!error) return false;

    const errorObj = error as {
      status?: number;
      message?: string;
      name?: string;
    };

    // Status 0 = no response (network error)
    if (errorObj.status === 0) {
      return true;
    }

    const networkErrorPatterns = [
      "Failed to fetch",
      "NetworkError",
      "Network request failed",
      "ERR_INTERNET_DISCONNECTED",
      "ERR_NETWORK_CHANGED",
      "ERR_CONNECTION_REFUSED",
    ];

    const message = errorObj.message || errorObj.name || "";
    return networkErrorPatterns.some((pattern) =>
      message.toLowerCase().includes(pattern.toLowerCase()),
    );
  }
}

/**
 * Create a simple operation handler without dependencies
 * Useful for quick operations that don't need toast/logging
 */
export function createOperationHandler(
  toastService?: ToastService,
  logger?: LoggerService,
): OperationHandler {
  return new OperationHandler(toastService, logger);
}

/**
 * Prepare operation state by resetting error
 * Use this as a simple function call at the start of operations
 *
 * @example
 * ```typescript
 * loadData(): void {
 *   prepareOperation(this.error);
 *   this.loading.set(true);
 *   // ... rest of operation
 * }
 * ```
 */
export function prepareOperation(
  errorSignal: WritableSignal<string | null>,
): void {
  errorSignal.set(null);
}

/**
 * Complete an operation by setting loading to false and handling error state
 *
 * @example
 * ```typescript
 * try {
 *   // ... operation
 *   completeOperation(this.loading, this.error, true);
 * } catch (e) {
 *   completeOperation(this.loading, this.error, false, e);
 * }
 * ```
 */
export function completeOperation(
  loadingSignal: WritableSignal<boolean>,
  errorSignal: WritableSignal<string | null>,
  success: boolean,
  error?: unknown,
): void {
  loadingSignal.set(false);
  if (success) {
    errorSignal.set(null);
  } else if (error) {
    errorSignal.set(getErrorMessage(error));
  }
}

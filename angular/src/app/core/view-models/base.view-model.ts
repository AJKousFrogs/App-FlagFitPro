/**
 * Base ViewModel Class
 *
 * Separates data fetching (RxJS Observables) from state management (Signals)
 *
 * Pattern:
 * - Data Services: Handle API calls, return Observables
 * - View Models: Manage component state using Signals, subscribe to data services
 *
 * Key Features:
 * - Automatic error state reset before new operations
 * - Consistent loading state management
 * - Error state cleared on successful operations
 * - Automatic cleanup on destroy
 *
 * Usage:
 * ```typescript
 * export class DashboardViewModel extends BaseViewModel {
 *   private dashboardService = inject(DashboardDataService);
 *
 *   // State (Signals)
 *   stats = signal<Stat[]>([]);
 *
 *   // Data fetching (RxJS) - error/loading handled automatically
 *   loadDashboard() {
 *     this.subscribe(
 *       this.dashboardService.getDashboard(),
 *       {
 *         next: (data) => this.stats.set(data.stats),
 *       }
 *     );
 *   }
 * }
 * ```
 */

import { Injectable, signal, DestroyRef, inject } from "@angular/core";
import { Observable, Subject, catchError, finalize, tap } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LoggerService } from "../services/logger.service";
import { getErrorMessage } from "../../shared/utils/error.utils";

@Injectable()
export abstract class BaseViewModel {
  protected destroyRef = inject(DestroyRef);
  protected logger = inject(LoggerService);
  protected destroy$ = new Subject<void>();

  // Common state signals
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly initialized = signal<boolean>(false);

  constructor() {
    // Auto-cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.destroy$.next();
      this.destroy$.complete();
    });
  }

  /**
   * Subscribe to an Observable with automatic cleanup
   * Handles loading state and errors automatically
   *
   * IMPORTANT: This method automatically:
   * - Resets error state before starting the operation
   * - Sets loading state to true
   * - Clears error state on success
   * - Sets error state on failure
   * - Sets loading state to false when complete
   */
  protected subscribe<T>(
    observable: Observable<T>,
    callbacks: {
      next?: (value: T) => void;
      error?: (error: unknown) => void;
      complete?: () => void;
      showLoading?: boolean;
      resetErrorOnStart?: boolean;
      clearErrorOnSuccess?: boolean;
    } = {},
  ): void {
    const {
      next,
      error,
      complete,
      showLoading = true,
      resetErrorOnStart = true,
      clearErrorOnSuccess = true,
    } = callbacks;

    // CRITICAL: Always reset error state before new operation
    if (resetErrorOnStart) {
      this.error.set(null);
    }

    if (showLoading) {
      this.loading.set(true);
    }

    let hasSucceeded = false;

    observable
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          // Mark as succeeded when we receive data
          hasSucceeded = true;
          // Clear error on successful data receipt
          if (clearErrorOnSuccess) {
            this.error.set(null);
          }
        }),
        catchError((err) => {
          hasSucceeded = false;
          if (error) {
            error(err);
          } else {
            this.handleError(err);
          }
          return [];
        }),
        finalize(() => {
          if (showLoading) {
            this.loading.set(false);
          }
          // Ensure error is cleared on success (belt and suspenders)
          if (hasSucceeded && clearErrorOnSuccess) {
            this.error.set(null);
          }
          if (complete) {
            complete();
          }
        }),
      )
      .subscribe({
        next: (value) => {
          if (next) {
            next(value);
          }
        },
      });
  }

  /**
   * Handle errors consistently using centralized error utilities
   */
  protected handleError(error: unknown): void {
    const errorMessage = getErrorMessage(error, "An error occurred");
    this.error.set(errorMessage);
    this.logger.error("[ViewModel Error]", error);
  }

  /**
   * Clear error state manually (useful for retry scenarios)
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.loading.set(false);
    this.error.set(null);
    this.initialized.set(false);
  }

  /**
   * Prepare for a new operation by resetting error state
   * Call this at the start of any operation that might fail
   */
  protected prepareOperation(): void {
    this.error.set(null);
  }

  /**
   * Initialize the view model
   * Override in subclasses to set up initial data loading
   */
  abstract initialize(...args: unknown[]): void;
}

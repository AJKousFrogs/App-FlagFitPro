/**
 * Base ViewModel Class
 * 
 * Separates data fetching (RxJS Observables) from state management (Signals)
 * 
 * Pattern:
 * - Data Services: Handle API calls, return Observables
 * - View Models: Manage component state using Signals, subscribe to data services
 * 
 * Usage:
 * ```typescript
 * export class DashboardViewModel extends BaseViewModel {
 *   private dashboardService = inject(DashboardDataService);
 *   
 *   // State (Signals)
 *   stats = signal<Stat[]>([]);
 *   loading = signal(false);
 *   
 *   // Derived state (Computed)
 *   totalStats = computed(() => this.stats().reduce((sum, s) => sum + s.value, 0));
 *   
 *   // Data fetching (RxJS)
 *   loadDashboard() {
 *     this.loading.set(true);
 *     this.subscribe(
 *       this.dashboardService.getDashboard(),
 *       {
 *         next: (data) => {
 *           this.stats.set(data.stats);
 *           this.loading.set(false);
 *         },
 *         error: (err) => {
 *           this.handleError(err);
 *           this.loading.set(false);
 *         }
 *       }
 *     );
 *   }
 * }
 * ```
 */

import { Injectable, signal, computed, effect, DestroyRef, inject } from '@angular/core';
import { Observable, Subject, takeUntil, catchError, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable()
export abstract class BaseViewModel {
  protected destroyRef = inject(DestroyRef);
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
   */
  protected subscribe<T>(
    observable: Observable<T>,
    callbacks: {
      next?: (value: T) => void;
      error?: (error: any) => void;
      complete?: () => void;
      showLoading?: boolean;
    } = {}
  ): void {
    const { next, error, complete, showLoading = true } = callbacks;

    if (showLoading) {
      this.loading.set(true);
      this.error.set(null);
    }

    observable
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
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
          if (complete) {
            complete();
          }
        })
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
   * Handle errors consistently
   */
  protected handleError(error: any): void {
    const errorMessage = error?.message || error?.error?.message || 'An error occurred';
    this.error.set(errorMessage);
    console.error('[ViewModel Error]', error);
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
   * Initialize the view model
   * Override in subclasses to set up initial data loading
   */
  abstract initialize(...args: any[]): void;
}


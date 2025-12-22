/**
 * Reactive ViewModel with RxJS Integration
 * 
 * Extends BaseViewModel with reactive data streams
 * Perfect for real-time analytics and live data
 * 
 * ⚠️ IMPORTANT: Use RxJS ONLY for complex async work (API calls, intervals, etc.)
 * Use Signals for UI state management instead of BehaviorSubject
 * 
 * Usage:
 * ```typescript
 * export class AnalyticsViewModel extends ReactiveViewModel {
 *   private analyticsService = inject(AnalyticsDataService);
 *   
 *   // Complex async work: Use RxJS Observable
 *   performanceData$ = this.createStream(
 *     interval(5000).pipe(
 *       switchMap(() => this.analyticsService.getPerformanceData()),
 *       shareReplay(1)
 *     )
 *   );
 *   
 *   // UI State: Convert Observable to Signal using toSignal()
 *   performanceMetrics = toSignal(
 *     this.performanceData$.pipe(
 *       map(data => data.metrics)
 *     ),
 *     { initialValue: [] }
 *   );
 *   
 *   // Or use signals directly for simple state
 *   selectedMetric = signal<string>('speed');
 *   filteredData = computed(() => {
 *     return this.performanceMetrics().filter(m => m.type === this.selectedMetric());
 *   });
 * }
 * ```
 */

import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { BaseViewModel } from './base.view-model';

@Injectable()
export abstract class ReactiveViewModel extends BaseViewModel {
  // Stream management for complex async work (API calls, intervals, etc.)
  private streams = new Map<string, Observable<any>>();

  /**
   * Create a reactive data stream with automatic sharing
   * Use this for complex async work (API calls, intervals, websockets, etc.)
   * For UI state, prefer signals instead
   */
  protected createStream<T>(
    source$: Observable<T>,
    key?: string
  ): Observable<T> {
    const shared$ = source$.pipe(shareReplay(1));
    
    if (key) {
      this.streams.set(key, shared$);
    }
    
    return shared$;
  }

  /**
   * Get a stream by key
   */
  protected getStream<T>(key: string): Observable<T> | undefined {
    return this.streams.get(key);
  }

  /**
   * Cleanup all streams
   */
  override reset(): void {
    super.reset();
    this.streams.clear();
  }

  /**
   * Initialize the view model
   * Override in subclasses to set up initial data loading
   */
  override initialize(...args: any[]): void {
    // Override in subclasses if needed
  }
}

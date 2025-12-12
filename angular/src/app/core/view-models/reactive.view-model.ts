/**
 * Reactive ViewModel with RxJS Integration
 * 
 * Extends BaseViewModel with reactive data streams
 * Perfect for real-time analytics and live data
 * 
 * Usage:
 * ```typescript
 * export class AnalyticsViewModel extends ReactiveViewModel {
 *   private analyticsService = inject(AnalyticsDataService);
 *   
 *   // Reactive data stream
 *   performanceData$ = this.createStream(
 *     interval(5000).pipe(
 *       switchMap(() => this.analyticsService.getPerformanceData()),
 *       shareReplay(1)
 *     )
 *   );
 *   
 *   // Signal-based state derived from stream
 *   performanceMetrics = toSignal(
 *     this.performanceData$.pipe(
 *       map(data => data.metrics)
 *     ),
 *     { initialValue: [] }
 *   );
 * }
 * ```
 */

import { Injectable, signal, computed } from '@angular/core';
import { Observable, Subject, BehaviorSubject, shareReplay } from 'rxjs';
import { BaseViewModel } from './base.view-model';

@Injectable()
export abstract class ReactiveViewModel extends BaseViewModel {
  // Stream management
  private streams = new Map<string, Observable<any>>();
  private subjects = new Map<string, Subject<any>>();

  /**
   * Create a reactive data stream with automatic sharing
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
   * Create a BehaviorSubject for state management
   */
  protected createSubject<T>(initialValue: T, key: string): BehaviorSubject<T> {
    const subject = new BehaviorSubject<T>(initialValue);
    this.subjects.set(key, subject);
    return subject;
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
    this.subjects.forEach(subject => subject.complete());
    this.subjects.clear();
  }
}


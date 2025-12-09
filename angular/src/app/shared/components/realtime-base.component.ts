/**
 * Real-Time Base Component
 *
 * Base class for components that need real-time data subscriptions.
 * Automatically handles subscription cleanup on component destroy.
 *
 * Usage:
 * ```typescript
 * export class MyComponent extends RealtimeBaseComponent {
 *   ngOnInit() {
 *     this.subscribeToRealtime();
 *   }
 *
 *   private subscribeToRealtime() {
 *     const unsubscribe = this.realtimeService.subscribeToTrainingSessions(
 *       (event) => this.handleTrainingUpdate(event)
 *     );
 *     this.addSubscription(unsubscribe);
 *   }
 * }
 * ```
 */

import { Directive, OnDestroy, inject } from '@angular/core';
import { RealtimeService } from '../../core/services/realtime.service';

@Directive()
export abstract class RealtimeBaseComponent implements OnDestroy {
  protected realtimeService = inject(RealtimeService);
  private subscriptions: Array<() => void> = [];

  /**
   * Add a subscription to be cleaned up on destroy
   */
  protected addSubscription(unsubscribe: () => void): void {
    this.subscriptions.push(unsubscribe);
  }

  /**
   * Manually unsubscribe from all subscriptions
   */
  protected unsubscribeAll(): void {
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];
  }

  /**
   * Automatic cleanup on component destroy
   */
  ngOnDestroy(): void {
    this.unsubscribeAll();
  }
}

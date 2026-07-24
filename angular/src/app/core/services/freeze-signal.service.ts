import { Injectable, signal } from "@angular/core";

/**
 * Dependency-free signal bridge between ApiService (which sees every 402
 * `subscription_required` response, but can't inject BillingService without
 * creating a circular DI cycle — BillingService itself depends on
 * ApiService) and anything that needs to react to "the caller just got
 * frozen out of a feature" (the Shell's persistent banner).
 *
 * `locked` is the ambient frozen state; `flashTrigger` increments on every
 * refused write so the banner can re-trigger its attention animation even
 * if it was already showing.
 */
@Injectable({ providedIn: "root" })
export class FreezeSignalService {
  readonly locked = signal(false);
  readonly flashTrigger = signal(0);

  setLocked(locked: boolean): void {
    this.locked.set(locked);
  }

  /** Call when a write was refused with 402 subscription_required. */
  flash(): void {
    this.locked.set(true);
    this.flashTrigger.update((n) => n + 1);
  }
}

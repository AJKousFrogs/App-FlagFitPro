import { Injectable, signal } from "@angular/core";

/**
 * Drives the shared "More" overlay state used by both the mobile header
 * trigger and any other surface that wants to open the menu (the bottom
 * nav historically rendered + owned this overlay; in Phase 2.5 it moves
 * out so the bar can land at exactly 5 slots).
 */
@Injectable({ providedIn: "root" })
export class MoreMenuService {
  private readonly _isOpen = signal(false);
  readonly isOpen = this._isOpen.asReadonly();

  open(): void {
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
  }

  toggle(): void {
    this._isOpen.update((v) => !v);
  }
}

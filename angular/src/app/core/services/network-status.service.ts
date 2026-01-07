/**
 * Network Status Service
 * 
 * Monitors network connectivity and provides reactive status
 * Used by offline queue and other services that need network awareness
 */

import { Injectable, inject, signal, effect } from "@angular/core";
import { LoggerService } from "./logger.service";
import { OfflineQueueService } from "./offline-queue.service";

@Injectable({
  providedIn: "root",
})
export class NetworkStatusService {
  private readonly logger = inject(LoggerService);
  private readonly offlineQueue = inject(OfflineQueueService);

  // State
  private readonly _isOnline = signal(navigator.onLine);
  private readonly _connectionType = signal<string>("unknown");

  // Public readonly signals
  readonly isOnline = this._isOnline.asReadonly();
  readonly connectionType = this._connectionType.asReadonly();

  constructor() {
    if (typeof window !== "undefined") {
      // Listen for online/offline events
      window.addEventListener("online", () => this.handleOnline());
      window.addEventListener("offline", () => this.handleOffline());

      // Monitor connection type if available
      if ("connection" in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          this._connectionType.set(connection.effectiveType || "unknown");
          connection.addEventListener("change", () => {
            this._connectionType.set(connection.effectiveType || "unknown");
          });
        }
      }

      // Effect to trigger sync when coming online
      effect(() => {
        if (this._isOnline()) {
          // Trigger sync after a short delay to ensure connection is stable
          setTimeout(() => {
            this.offlineQueue.syncQueue();
          }, 1000);
        }
      });
    }
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    this._isOnline.set(true);
    this.logger.info("[NetworkStatus] Connection restored");
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this._isOnline.set(false);
    this.logger.warn("[NetworkStatus] Connection lost");
  }

  /**
   * Check if connection is slow (2G or slow 3G)
   */
  isSlowConnection(): boolean {
    const type = this._connectionType();
    return type === "2g" || type === "slow-2g";
  }

  /**
   * Check if connection is fast (4G)
   */
  isFastConnection(): boolean {
    const type = this._connectionType();
    return type === "4g";
  }
}


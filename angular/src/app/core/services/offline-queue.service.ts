/**
 * Offline Queue Service
 *
 * Manages offline queue for critical actions when network is unavailable
 * Automatically syncs when connection is restored
 *
 * Critical features supported:
 * - Wellness check-ins
 * - Training session logs
 * - Game tracker actions
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { LoggerService } from "./logger.service";
import { ToastService } from "./toast.service";
import { TIMEOUTS } from "../constants/app.constants";
import { TOAST } from "../constants/toast-messages.constants";

/**
 * Supported action types for offline queue
 * Extended to support more API operations
 */
export type QueuedActionType =
  | "wellness_checkin"
  | "training_log"
  | "game_action"
  | "wellness_update"
  | "profile_update"
  | "settings_update"
  | "notification_action"
  | "attendance_record"
  | "equipment_action"
  | "generic_post"
  | "generic_put"
  | "generic_patch";

export interface QueuedAction {
  id: string;
  type: QueuedActionType;
  payload: Record<string, unknown>;
  timestamp: Date;
  retryCount: number;
  priority: "high" | "medium" | "low";
  /** Optional endpoint for generic actions */
  endpoint?: string;
  /** HTTP method for generic actions */
  method?: "POST" | "PUT" | "PATCH";
}

@Injectable({
  providedIn: "root",
})
export class OfflineQueueService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);

  // State
  private readonly _queue = signal<QueuedAction[]>([]);
  private readonly _isOnline = signal(navigator.onLine);
  private readonly _isSyncing = signal(false);

  // Sync lock to prevent race conditions
  private _syncLock = false;

  // Public readonly signals
  readonly queue = this._queue.asReadonly();
  readonly isOnline = this._isOnline.asReadonly();
  readonly isSyncing = this._isSyncing.asReadonly();

  // Computed signals
  readonly queueSize = computed(() => this._queue().length);
  readonly hasPendingActions = computed(() => this._queue().length > 0);
  readonly highPriorityPending = computed(
    () => this._queue().filter((action) => action.priority === "high").length,
  );

  constructor() {
    // Listen for online/offline events
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleOnline());
      window.addEventListener("offline", () => this.handleOffline());
    }

    // Load queue from localStorage on init
    this.loadQueueFromStorage();
  }

  /**
   * Add action to offline queue
   */
  queueAction(
    type: QueuedAction["type"],
    payload: Record<string, unknown>,
    priority: QueuedAction["priority"] = "medium",
    options?: {
      endpoint?: string;
      method?: "POST" | "PUT" | "PATCH";
    },
  ): string {
    const action: QueuedAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: new Date(),
      retryCount: 0,
      priority,
      endpoint: options?.endpoint,
      method: options?.method,
    };

    this._queue.update((queue) => [...queue, action]);
    this.saveQueueToStorage();

    this.logger.info(
      `[OfflineQueue] Queued action: ${type} (${priority} priority)`,
    );

    if (!this._isOnline()) {
      this.toastService.info(
        `Action queued for sync when connection is restored (${this._queue().length} pending)`,
      );
    }

    return action.id;
  }

  /**
   * Queue a generic API request for offline sync
   * Use this for any API call that should be retried when online
   */
  queueGenericRequest(
    endpoint: string,
    method: "POST" | "PUT" | "PATCH",
    payload: Record<string, unknown>,
    priority: QueuedAction["priority"] = "medium",
  ): string {
    const type: QueuedActionType =
      `generic_${method.toLowerCase()}` as QueuedActionType;
    return this.queueAction(type, payload, priority, { endpoint, method });
  }

  /**
   * Remove action from queue (after successful sync)
   */
  removeAction(actionId: string): void {
    this._queue.update((queue) =>
      queue.filter((action) => action.id !== actionId),
    );
    this.saveQueueToStorage();
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    this._isOnline.set(true);
    this.logger.info("[OfflineQueue] Connection restored");

    if (this._queue().length > 0) {
      this.toastService.info(
        `Syncing ${this._queue().length} pending action(s)...`,
      );
      this.syncQueue();
    }
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this._isOnline.set(false);
    this.logger.warn("[OfflineQueue] Connection lost - actions will be queued");
    this.toastService.warn(TOAST.WARN.OFFLINE);
  }

  /**
   * Sync queued actions with server
   * Uses a lock to prevent concurrent sync operations (race condition fix)
   */
  async syncQueue(): Promise<void> {
    // Atomic lock check - prevents race condition where multiple calls
    // could pass the initial check before any sets _isSyncing
    if (this._syncLock) {
      this.logger.debug("[OfflineQueue] Sync already in progress, skipping");
      return;
    }

    // Acquire lock immediately (synchronous)
    this._syncLock = true;

    try {
      if (!this._isOnline() || this._queue().length === 0) {
        return;
      }

      this._isSyncing.set(true);

      // Deep copy queue to avoid mutation during sync
      const queue = this._queue().map((action) => ({
        ...action,
        timestamp: new Date(action.timestamp.getTime()),
      }));

      // Sort by priority (high first) and timestamp (oldest first)
      const sortedQueue = queue.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp.getTime() - b.timestamp.getTime();
      });

      let successCount = 0;
      let failureCount = 0;

      for (const action of sortedQueue) {
        try {
          const success = await this.syncAction(action);
          if (success) {
            this.removeAction(action.id);
            successCount++;
          } else {
            // Update retry count in actual queue (not copy)
            this.incrementRetryCount(action.id);
            const currentAction = this._queue().find((a) => a.id === action.id);
            if (currentAction && currentAction.retryCount >= 3) {
              this.logger.error(
                `[OfflineQueue] Max retries reached for action ${action.id}, removing from queue`,
              );
              this.removeAction(action.id);
              failureCount++;
            }
          }
        } catch (error) {
          this.logger.error(
            `[OfflineQueue] Error syncing action ${action.id}:`,
            error,
          );
          this.incrementRetryCount(action.id);
          const currentAction = this._queue().find((a) => a.id === action.id);
          if (currentAction && currentAction.retryCount >= 3) {
            this.removeAction(action.id);
            failureCount++;
          }
        }

        // Small delay between syncs to avoid overwhelming server
        await new Promise((resolve) =>
          setTimeout(resolve, TIMEOUTS.UI_MICRO_DELAY),
        );
      }

      this._isSyncing.set(false);

      if (successCount > 0) {
        this.toastService.success(
          `Successfully synced ${successCount} action(s)`,
        );
      }
      if (failureCount > 0) {
        this.toastService.warn(`Failed to sync ${failureCount} action(s)`);
      }
    } finally {
      // Always release lock
      this._syncLock = false;
    }
  }

  /**
   * Increment retry count for an action (immutable update)
   */
  private incrementRetryCount(actionId: string): void {
    this._queue.update((queue) =>
      queue.map((action) =>
        action.id === actionId
          ? { ...action, retryCount: action.retryCount + 1 }
          : action,
      ),
    );
    this.saveQueueToStorage();
  }

  /**
   * Sync a single action
   */
  private async syncAction(action: QueuedAction): Promise<boolean> {
    try {
      // Determine endpoint based on action type
      let endpoint = "";
      let method = "POST";

      // Handle generic actions first
      if (action.type.startsWith("generic_") && action.endpoint) {
        endpoint = action.endpoint;
        method = action.method || "POST";
      } else {
        // Specific action type mappings
        switch (action.type) {
          case "wellness_checkin":
            endpoint = "/api/wellness/checkin";
            method = "POST";
            break;
          case "training_log":
            endpoint = "/.netlify/functions/training-sessions";
            method = "POST";
            break;
          case "game_action":
            endpoint = "/.netlify/functions/games";
            method = "PUT";
            break;
          case "wellness_update":
            endpoint = "/api/wellness/checkin";
            method = "PUT";
            break;
          case "profile_update":
            endpoint = "/.netlify/functions/users";
            method = "PATCH";
            break;
          case "settings_update":
            endpoint = "/.netlify/functions/settings";
            method = "PATCH";
            break;
          case "notification_action":
            endpoint = "/.netlify/functions/notifications";
            method = "POST";
            break;
          case "attendance_record":
            endpoint = "/.netlify/functions/attendance";
            method = "POST";
            break;
          case "equipment_action":
            endpoint = "/.netlify/functions/equipment";
            method = "POST";
            break;
          default:
            this.logger.warn(
              `[OfflineQueue] Unknown action type: ${action.type}`,
            );
            return false;
        }
      }

      const headers = new HttpHeaders({
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      });

      await firstValueFrom(
        this.http.request(method, endpoint, {
          body: action.payload,
          headers,
        }),
      );

      return true;
    } catch (error) {
      this.logger.error(`[OfflineQueue] Error syncing action:`, error);
      return false;
    }
  }

  /**
   * Get auth headers (if available)
   */
  private getAuthHeaders(): Record<string, string> {
    // Try to get auth token from localStorage or sessionStorage
    // This is a simplified version - adjust based on your auth implementation
    const token =
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("auth_token");
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
    return {};
  }

  /**
   * Save queue to localStorage
   */
  private saveQueueToStorage(): void {
    try {
      const queueData = this._queue().map((action) => ({
        ...action,
        timestamp: action.timestamp.toISOString(),
      }));
      localStorage.setItem("offline_queue", JSON.stringify(queueData));
    } catch (error) {
      this.logger.error("[OfflineQueue] Error saving queue to storage:", error);
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueueFromStorage(): void {
    try {
      const stored = localStorage.getItem("offline_queue");
      if (stored) {
        const queueData = JSON.parse(stored) as Array<
          Omit<QueuedAction, "timestamp"> & { timestamp: string }
        >;
        const queue: QueuedAction[] = queueData.map((action) => ({
          ...action,
          timestamp: new Date(action.timestamp),
        }));
        this._queue.set(queue);
        this.logger.info(
          `[OfflineQueue] Loaded ${queue.length} queued action(s) from storage`,
        );
      }
    } catch (error) {
      this.logger.error(
        "[OfflineQueue] Error loading queue from storage:",
        error,
      );
    }
  }

  /**
   * Clear queue (for testing or manual cleanup)
   */
  clearQueue(): void {
    this._queue.set([]);
    localStorage.removeItem("offline_queue");
    this.logger.info("[OfflineQueue] Queue cleared");
  }

  /**
   * Check if action should be queued (offline or network error)
   */
  shouldQueue(error: unknown): boolean {
    // Check if offline
    if (!this._isOnline()) {
      return true;
    }

    // Check if error is network-related
    if (error instanceof Error) {
      const networkErrors = [
        "Failed to fetch",
        "NetworkError",
        "Network request failed",
        "ERR_INTERNET_DISCONNECTED",
        "ERR_NETWORK_CHANGED",
      ];
      return networkErrors.some((msg) => error.message.includes(msg));
    }

    return false;
  }
}

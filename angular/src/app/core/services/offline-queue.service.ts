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
import { SupabaseService } from "./supabase.service";

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
  private readonly supabase = inject(SupabaseService);

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

  private static readonly STORAGE_KEY = "flagfit_offline_queue";

  constructor() {
    // Listen for online/offline events
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleOnline());
      window.addEventListener("offline", () => this.handleOffline());
    }

    // Restore any queued actions that survived a previous page close.
    this.loadQueueFromStorage();

    // Register Background Sync if the browser supports it.
    // When the device comes back online (even if the tab is closed), the
    // service worker will fire a 'sync' event and we trigger syncQueue().
    this.registerBackgroundSync();

    // Listen for OFFLINE_SYNC_TRIGGER messages posted by the custom service
    // worker (custom-sw.js) when a Background Sync event fires.
    this.listenForSwSyncMessages();
  }

  /**
   * Receive OFFLINE_SYNC_TRIGGER messages from custom-sw.js and drain the
   * queue. This is the client-side half of the Background Sync handshake:
   * the SW cannot access Angular services directly, so it posts a message
   * and this handler calls syncQueue() within the normal DI context.
   */
  private listenForSwSyncMessages(): void {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => {
      if ((event.data as { type?: string })?.type === "OFFLINE_SYNC_TRIGGER") {
        this.logger.info("[OfflineQueue] Background Sync triggered by service worker");
        void this.syncQueue();
      }
    });
  }

  /**
   * Register a Background Sync event so the service worker can retry the
   * queue even after the tab has been closed.
   * Falls back gracefully on unsupported browsers.
   */
  private registerBackgroundSync(): void {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("SyncManager" in window)
    ) {
      return;
    }

    navigator.serviceWorker.ready
      .then((registration) => {
        // @ts-expect-error SyncManager is not yet in all TS lib typings
        return registration.sync.register("flagfit-offline-queue");
      })
      .catch((err: unknown) => {
        this.logger.debug("[OfflineQueue] Background Sync registration failed (non-critical):", err);
      });
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
      id: `action_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
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
              this.toastService.error(
                `Failed to sync "${action.type}" after multiple attempts. The action has been discarded — please try again.`,
              );
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
            this.toastService.error(
              `Failed to sync "${action.type}" after multiple attempts. The action has been discarded — please try again.`,
            );
            failureCount++;
          }
        }

        // Small delay between syncs to avoid overwhelming server
        await new Promise((resolve) =>
          setTimeout(resolve, TIMEOUTS.UI_MICRO_DELAY),
        );
      }

      if (successCount > 0) {
        this.toastService.success(
          `Successfully synced ${successCount} action(s)`,
        );
      }
      if (failureCount > 0) {
        this.toastService.warn(`Failed to sync ${failureCount} action(s)`);
      }
    } finally {
      // Always release lock and clear syncing state
      this._isSyncing.set(false);
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
    const token = this.supabase.getSession()?.access_token;
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
    return {};
  }

  /**
   * Persist the current queue to localStorage so it survives page reloads
   * and app restarts. Serializes dates as ISO strings.
   */
  private saveQueueToStorage(): void {
    if (typeof localStorage === "undefined") return;
    try {
      const serialized = JSON.stringify(
        this._queue().map((action) => ({
          ...action,
          timestamp: action.timestamp instanceof Date
            ? action.timestamp.toISOString()
            : action.timestamp,
        })),
      );
      localStorage.setItem(OfflineQueueService.STORAGE_KEY, serialized);
    } catch {
      // Storage may be full or unavailable — non-fatal
      this.logger.warn("[OfflineQueue] Could not persist queue to localStorage");
    }
  }

  /**
   * Restore queue from localStorage on service startup.
   * Deserializes ISO date strings back into Date objects.
   * Drops any actions that exceed the max retry count already.
   */
  private loadQueueFromStorage(): void {
    if (typeof localStorage === "undefined") return;
    try {
      const raw = localStorage.getItem(OfflineQueueService.STORAGE_KEY);
      if (!raw) return;

      const parsed: unknown[] = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      const restored: QueuedAction[] = parsed
        .filter((item): item is Record<string, unknown> =>
          item !== null && typeof item === "object",
        )
        .map((item) => {
          const priority: QueuedAction["priority"] =
            item["priority"] === "high" ||
            item["priority"] === "medium" ||
            item["priority"] === "low"
              ? item["priority"]
              : "medium";
          const method: QueuedAction["method"] =
            item["method"] === "POST" ||
            item["method"] === "PUT" ||
            item["method"] === "PATCH"
              ? item["method"]
              : undefined;

          return {
            id: String(item["id"] ?? ""),
            type: item["type"] as QueuedActionType,
            payload:
              item["payload"] && typeof item["payload"] === "object"
                ? (item["payload"] as Record<string, unknown>)
                : {},
            timestamp: new Date(String(item["timestamp"] ?? "")),
            retryCount:
              typeof item["retryCount"] === "number" ? item["retryCount"] : 0,
            priority,
            endpoint:
              typeof item["endpoint"] === "string"
                ? item["endpoint"]
                : undefined,
            method,
          };
        })
        // Drop actions that already hit max retries to avoid infinite loops
        .filter(
          (a) =>
            a.id.length > 0 &&
            !Number.isNaN(a.timestamp.getTime()) &&
            a.retryCount < 3,
        );

      if (restored.length > 0) {
        this._queue.set(restored);
        this.logger.info(
          `[OfflineQueue] Restored ${restored.length} action(s) from previous session`,
        );
      }
    } catch {
      // Corrupt storage — clear and start fresh
      this.logger.warn("[OfflineQueue] Could not restore queue; clearing corrupt storage");
      try {
        localStorage.removeItem(OfflineQueueService.STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Clear queue (for testing or manual cleanup)
   */
  clearQueue(): void {
    this._queue.set([]);
    if (typeof localStorage !== "undefined") {
      try { localStorage.removeItem(OfflineQueueService.STORAGE_KEY); } catch { /* ignore */ }
    }
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

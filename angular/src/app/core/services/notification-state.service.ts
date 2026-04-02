/**
 * Notification State Service
 *
 * Centralized notification state management for Angular application
 * Provides single source of truth for notification state across components
 *
 * Features:
 * - Reactive state using Angular Signals
 * - Automatic badge count updates
 * - Persistence across page reloads
 * - Real-time sync with Supabase
 * - Error handling and retry logic
 * - Flag football specific notification types
 */

import {
  Injectable,
  inject,
  signal,
  computed,
  OnDestroy,
  DestroyRef,
  effect,
} from "@angular/core";
import { firstValueFrom } from "rxjs";
import { RealtimeChannel } from "@supabase/supabase-js";
import { ApiService, API_ENDPOINTS } from "./api.service";
import { LoggerService } from "./logger.service";
import { toLogContext } from "./logger.service";
import { SupabaseService } from "./supabase.service";
import { ToastService } from "./toast.service";
import { UI_LIMITS } from "../constants/app.constants";
import {
  extractApiPayload,
  extractApiRecord,
  isSuccessfulApiResponse,
  readNumericField,
} from "../utils/api-response-mapper";
import { RealtimeBroadcastPayload } from "../models/realtime-broadcast.model";

/**
 * Notification categories specific to flag football app
 */
export type NotificationCategory =
  | "game" // Game invites, match updates, scores
  | "team" // Team invites, roster changes, announcements
  | "training" // Training reminders, schedule changes
  | "wellness" // Health alerts, recovery recommendations
  | "achievement" // Badges, milestones, personal records
  | "tournament" // Tournament registrations, brackets, results
  | "coach" // Coach overrides, feedback, recommendations
  | "system" // App updates, maintenance, account-related
  | "general"; // General notifications

/**
 * Notification severity levels for UI styling
 */
export type NotificationSeverity = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  type: string;
  title?: string;
  message: string;
  read: boolean;
  created_at: string;
  updated_at?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  action_url?: string;
  dismissed?: boolean;
  expires_at?: string;
  category?: NotificationCategory;
  severity?: NotificationSeverity;
  data?: Record<string, unknown>;
  sender_id?: string;
  sender_name?: string;
  related_entity_type?: string;
  related_entity_id?: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  lastOpenedAt: string | null;
  isRealtimeConnected: boolean;
}

/**
 * Options for creating a new notification
 */
export interface CreateNotificationOptions {
  type: string;
  title?: string;
  message: string;
  category?: NotificationCategory;
  severity?: NotificationSeverity;
  priority?: "low" | "normal" | "high" | "urgent";
  action_url?: string;
  data?: Record<string, unknown>;
  related_entity_type?: string;
  related_entity_id?: string;
}

interface _NotificationResponse {
  data?: Notification[] | NotificationWrapper | NotificationDataWrapper;
  notifications?: Notification[];
}

interface NotificationWrapper {
  notifications?: Notification[];
  data?: Notification[];
}

interface NotificationDataWrapper {
  data?: Notification[];
}

interface _CountResponse {
  data?: { unreadCount?: number; count?: number } | number;
  unreadCount?: number;
}

@Injectable({
  providedIn: "root",
})
export class NotificationStateService implements OnDestroy {
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);
  private supabaseService = inject(SupabaseService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  // Realtime channel
  private realtimeChannel: RealtimeChannel | null = null;
  private readonly isRealtimeConnected = signal<boolean>(false);

  // State signals
  private readonly notifications = signal<Notification[]>([]);
  private readonly loading = signal<boolean>(false);
  private readonly error = signal<string | null>(null);
  private readonly lastOpenedAt = signal<string | null>(null);

  // Computed signals - filter out dismissed notifications
  readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.read && !n.dismissed).length,
  );

  readonly unreadNotifications = computed(() =>
    this.notifications().filter((n) => !n.read && !n.dismissed),
  );

  readonly readNotifications = computed(() =>
    this.notifications().filter((n) => n.read && !n.dismissed),
  );

  readonly activeNotifications = computed(() =>
    this.notifications().filter((n) => !n.dismissed),
  );

  // Group notifications by category
  readonly notificationsByCategory = computed(() => {
    const active = this.activeNotifications();
    const groups: Record<NotificationCategory, Notification[]> = {
      game: [],
      team: [],
      training: [],
      wellness: [],
      achievement: [],
      tournament: [],
      coach: [],
      system: [],
      general: [],
    };

    active.forEach((n) => {
      const category = (n.category || "general") as NotificationCategory;
      groups[category].push(n);
    });

    return groups;
  });

  // High priority notifications (for badges/alerts)
  readonly highPriorityUnread = computed(() =>
    this.unreadNotifications().filter(
      (n) => n.priority === "high" || n.priority === "urgent",
    ),
  );

  readonly state = computed<NotificationState>(() => ({
    notifications: this.notifications(),
    unreadCount: this.unreadCount(),
    loading: this.loading(),
    error: this.error(),
    lastOpenedAt: this.lastOpenedAt(),
    isRealtimeConnected: this.isRealtimeConnected(),
  }));

  // Guard to prevent duplicate subscription initialization
  private _realtimeInitialized = false;
  private _initializationInProgress = false;
  private activeRealtimeUserId: string | null = null;
  private notificationsApiUnavailable = false;
  private notificationsApiRetryAt = 0;

  private isConflictOrUnavailableError(error: unknown): boolean {
    const status =
      error && typeof error === "object" && "status" in error
        ? Number((error as { status?: number }).status)
        : NaN;
    return [409, 500, 502, 503].includes(status);
  }

  private shouldBypassNotificationsApi(): boolean {
    if (!this.notificationsApiUnavailable) {
      return false;
    }

    if (Date.now() >= this.notificationsApiRetryAt) {
      this.resetNotificationsApiAvailability();
      return false;
    }

    return true;
  }

  private markNotificationsApiUnavailable(): void {
    this.notificationsApiUnavailable = true;
    this.notificationsApiRetryAt = Date.now() + 30_000;
  }

  private resetNotificationsApiAvailability(): void {
    this.notificationsApiUnavailable = false;
    this.notificationsApiRetryAt = 0;
  }

  constructor() {
    effect(() => {
      const userId = this.supabaseService.userId();

      if (!userId) {
        this.resetRealtimeSubscription();
        this.clearNotifications();
        this.resetNotificationsApiAvailability();
        return;
      }

      if (this.activeRealtimeUserId === userId && this._realtimeInitialized) {
        return;
      }

      void this.reinitializeRealtime();
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeFromRealtime();
  }

  /**
   * Initialize Supabase Realtime subscription for notifications
   * Includes guards to prevent duplicate subscriptions
   */
  private async initializeRealtimeSubscription(): Promise<void> {
    // Guard: prevent duplicate initialization
    if (this._realtimeInitialized || this._initializationInProgress) {
      this.logger.debug(
        "[NotificationState] Realtime subscription already initialized or in progress, skipping",
      );
      return;
    }

    this._initializationInProgress = true;

    try {
      // Wait for Supabase to be initialized
      await this.supabaseService.waitForInit();

      const userId = this.supabaseService.userId();
      if (!userId) {
        this.logger.debug(
          "[NotificationState] No user ID, skipping realtime subscription",
        );
        this._initializationInProgress = false;
        return;
      }

      this.activeRealtimeUserId = userId;

      // Double-check we haven't initialized while waiting
      if (this._realtimeInitialized) {
        this.logger.debug(
          "[NotificationState] Realtime subscription initialized while waiting, skipping",
        );
        this._initializationInProgress = false;
        return;
      }

      // Clean up any existing channel before creating new one
      if (this.realtimeChannel) {
        this.logger.debug(
          "[NotificationState] Cleaning up existing channel before reinitializing",
        );
        await this.supabaseService.client.removeChannel(this.realtimeChannel);
        this.realtimeChannel = null;
      }

      // Subscribe to notification broadcasts for this user
      const channelName = `notifications:${userId}`;
      this.realtimeChannel = this.supabaseService.client
        .channel(channelName)
        .on("broadcast", { event: "notification_change" }, (payload) => {
          const broadcast = payload.payload as RealtimeBroadcastPayload;
          this.handleNotificationBroadcast(broadcast);
        })
        .subscribe((status) => {
          this.logger.debug(
            `[NotificationState] Realtime subscription status: ${status}`,
          );
          this.isRealtimeConnected.set(status === "SUBSCRIBED");
          if (status === "SUBSCRIBED") {
            this._realtimeInitialized = true;
          }
        });

      this.logger.info("[NotificationState] Realtime subscription initialized");
      this._realtimeInitialized = true;
    } catch (error) {
      this.logger.error(
        "[NotificationState] Failed to initialize realtime subscription:",
        error,
      );
    } finally {
      this._initializationInProgress = false;
    }
  }

  /**
   * Reinitialize realtime subscription (e.g., after user change)
   */
  async reinitializeRealtime(): Promise<void> {
    this.resetRealtimeSubscription();
    await this.initializeRealtimeSubscription();
  }

  private resetRealtimeSubscription(): void {
    this._realtimeInitialized = false;
    this.activeRealtimeUserId = null;
    this.unsubscribeFromRealtime();
  }

  private handleNotificationBroadcast(
    payload: RealtimeBroadcastPayload,
  ): void {
    if (!payload || !payload.record) return;

    switch (payload.operation) {
      case "INSERT":
        this.handleNewNotification(payload.record);
        break;
      case "UPDATE":
        this.handleNotificationUpdate(payload.record);
        break;
      case "DELETE":
        this.handleNotificationDelete(payload.record);
        break;
    }
  }

  /**
   * Handle new notification from realtime
   */
  private handleNewNotification(data: Record<string, unknown>): void {
    const newNotification = this.mapPayloadToNotification(data);

    // Avoid duplicates
    const exists = this.notifications().some(
      (n) => n.id === newNotification.id,
    );
    if (exists) {
      this.logger.debug(
        "[NotificationState] Duplicate notification ignored:",
        newNotification.id,
      );
      return;
    }

    // Add to beginning of list
    this.notifications.update((notifications) => [
      newNotification,
      ...notifications,
    ]);

    // Show toast for high priority or certain categories
    if (
      newNotification.priority === "high" ||
      newNotification.priority === "urgent" ||
      newNotification.category === "game" ||
      newNotification.category === "coach"
    ) {
      this.showNotificationToast(newNotification);
    }

    this.logger.debug(
      "[NotificationState] New notification received:",
      newNotification.type,
    );
  }

  /**
   * Handle notification update from realtime
   */
  private handleNotificationUpdate(data: Record<string, unknown>): void {
    const updatedNotification = this.mapPayloadToNotification(data);

    this.notifications.update((notifications) =>
      notifications.map((n) =>
        n.id === updatedNotification.id ? updatedNotification : n,
      ),
    );

    this.logger.debug(
      "[NotificationState] Notification updated:",
      updatedNotification.id,
    );
  }

  /**
   * Handle notification delete from realtime
   */
  private handleNotificationDelete(data: Record<string, unknown>): void {
    const deletedId = String(data?.id ?? "");
    if (deletedId) {
      this.notifications.update((notifications) =>
        notifications.filter((n) => n.id !== deletedId),
      );
      this.logger.debug(
        "[NotificationState] Notification deleted:",
        toLogContext(deletedId),
      );
    }
  }

  /**
   * Map Supabase payload to Notification interface
   */
  private mapPayloadToNotification(
    data: Record<string, unknown>,
  ): Notification {
    return {
      id: String(data["id"] || ""),
      type: String(data["notification_type"] || data["type"] || "general"),
      title: data["title"] as string | undefined,
      message: String(data["message"] || ""),
      read: Boolean(data["is_read"] ?? data["read"] ?? false),
      created_at: String(data["created_at"] || new Date().toISOString()),
      updated_at: data["updated_at"] as string | undefined,
      priority: this.mapNotificationPriority(data["priority"]),
      action_url: data["action_url"] as string | undefined,
      dismissed: Boolean(data["dismissed"] ?? false),
      expires_at: data["expires_at"] as string | undefined,
      category: data["category"] as NotificationCategory | undefined,
      severity: data["severity"] as NotificationSeverity | undefined,
      data: data["data"] as Record<string, unknown> | undefined,
      sender_id: data["sender_id"] as string | undefined,
      related_entity_type: data["related_entity_type"] as string | undefined,
      related_entity_id: data["related_entity_id"] as string | undefined,
    };
  }

  private mapNotificationPriority(
    priority: unknown,
  ): Notification["priority"] {
    switch (priority) {
      case "urgent":
        return "urgent";
      case "critical":
        return "urgent";
      case "high":
        return "high";
      case "normal":
        return "normal";
      case "medium":
        return "normal";
      case "low":
        return "low";
      default:
        return undefined;
    }
  }

  /**
   * Show toast notification for important notifications
   */
  private showNotificationToast(notification: Notification): void {
    const title =
      notification.title || this.getCategoryTitle(notification.category);
    const severity = notification.severity || "info";

    switch (severity) {
      case "error":
        this.toastService.error(notification.message, title);
        break;
      case "warning":
        this.toastService.warn(notification.message, title);
        break;
      case "success":
        this.toastService.success(notification.message, title);
        break;
      default:
        this.toastService.info(notification.message, title);
    }
  }

  /**
   * Get default title based on category
   */
  private getCategoryTitle(category?: NotificationCategory): string {
    const titles: Record<NotificationCategory, string> = {
      game: "Game Update",
      team: "Team Update",
      training: "Training",
      wellness: "Wellness Alert",
      achievement: "Achievement",
      tournament: "Tournament",
      coach: "Coach Message",
      system: "System",
      general: "Notification",
    };
    return titles[category || "general"];
  }

  /**
   * Unsubscribe from realtime channel
   */
  private unsubscribeFromRealtime(): void {
    if (this.realtimeChannel) {
      this.supabaseService.unsubscribe(this.realtimeChannel);
      this.realtimeChannel = null;
      this.isRealtimeConnected.set(false);
      this.logger.debug("[NotificationState] Unsubscribed from realtime");
    }
  }

  /**
   * Load notifications from API
   */
  async loadNotifications(
    options: { lastOpenedAt?: string } = {},
  ): Promise<Notification[]> {
    if (this.shouldBypassNotificationsApi()) {
      return this.notifications();
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.apiService.get<Notification[]>(API_ENDPOINTS.notifications.list, {
          ...options,
          lastOpenedAt: this.lastOpenedAt() || options.lastOpenedAt,
        }),
      );

      let notifications: Notification[] = [];
      const payload = extractApiPayload<
        Notification[] | { notifications?: Notification[]; data?: Notification[] }
      >(response);

      // Handle different response formats
      if (Array.isArray(payload)) {
        notifications = payload;
      } else if (payload && typeof payload === "object") {
          const dataObj = payload as Record<string, unknown>;
          if (
            "notifications" in dataObj &&
            Array.isArray(dataObj["notifications"])
          ) {
            notifications = dataObj["notifications"] as Notification[];
          } else if ("data" in dataObj && Array.isArray(dataObj["data"])) {
            notifications = dataObj["data"] as Notification[];
          }
      }

      this.notifications.set(notifications);
      this.loading.set(false);
      return notifications;
    } catch (error) {
      if (this.isConflictOrUnavailableError(error)) {
        this.markNotificationsApiUnavailable();
        this.loading.set(false);
        this.error.set(null);
        this.logger.warn(
          "Notifications API unavailable; keeping existing notification state",
          toLogContext(error),
        );
        return this.notifications();
      }

      const errorMessage =
        error instanceof Error ? error.message : "Failed to load notifications";
      this.error.set(errorMessage);
      this.loading.set(false);
      this.logger.error("Error loading notifications:", error);
      throw error;
    }
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    const notification = this.notifications().find(
      (n) => n.id === notificationId,
    );
    if (!notification || notification.read) {
      return true; // Already read
    }

    // Optimistic update
    const previousState = [...this.notifications()];
    this.notifications.update((notifications) =>
      notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n,
      ),
    );

    try {
      const response = await firstValueFrom(
        this.apiService.post<{ success: boolean }>(
          API_ENDPOINTS.notifications.markRead,
          { notificationId },
        ),
      );

      if (!isSuccessfulApiResponse(response) || !extractApiPayload(response)) {
        // Revert optimistic update
        this.notifications.set(previousState);
        throw new Error("Failed to mark notification as read");
      }

      // Refresh badge count to ensure consistency
      await this.refreshBadgeCount();
      return true;
    } catch (error) {
      if (this.isConflictOrUnavailableError(error)) {
        this.markNotificationsApiUnavailable();
        return true;
      }

      // Revert optimistic update
      this.notifications.set(previousState);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to mark notification as read";
      this.error.set(errorMessage);
      this.logger.error("Error marking notification as read:", error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    const unreadNotifications = this.notifications().filter((n) => !n.read);
    if (unreadNotifications.length === 0) {
      return true; // Already all read
    }

    // Optimistic update
    const previousState = [...this.notifications()];
    this.notifications.update((notifications) =>
      notifications.map((n) => ({ ...n, read: true })),
    );

    try {
      const response = await firstValueFrom(
        this.apiService.post<{ success: boolean }>(
          API_ENDPOINTS.notifications.markRead,
          { notificationId: "all" },
        ),
      );

      if (!isSuccessfulApiResponse(response) || !extractApiPayload(response)) {
        // Revert optimistic update
        this.notifications.set(previousState);
        throw new Error("Failed to mark all notifications as read");
      }

      // Refresh badge count to ensure consistency
      await this.refreshBadgeCount();
      return true;
    } catch (error) {
      if (this.isConflictOrUnavailableError(error)) {
        this.markNotificationsApiUnavailable();
        return true;
      }

      // Revert optimistic update
      this.notifications.set(previousState);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to mark all notifications as read";
      this.error.set(errorMessage);
      this.logger.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  /**
   * Mark multiple notifications as read (bulk operation)
   */
  async markManyAsRead(notificationIds: string[]): Promise<boolean> {
    if (notificationIds.length === 0) {
      return true;
    }

    // Optimistic update
    const previousState = [...this.notifications()];
    this.notifications.update((notifications) =>
      notifications.map((n) =>
        notificationIds.includes(n.id) ? { ...n, read: true } : n,
      ),
    );

    try {
      const response = await firstValueFrom(
        this.apiService.post<{ success: boolean }>(
          API_ENDPOINTS.notifications.markRead,
          { ids: notificationIds },
        ),
      );

      if (!isSuccessfulApiResponse(response) || !extractApiPayload(response)) {
        // Revert optimistic update
        this.notifications.set(previousState);
        throw new Error("Failed to mark notifications as read");
      }

      // Refresh badge count to ensure consistency
      await this.refreshBadgeCount();
      return true;
    } catch (error) {
      if (this.isConflictOrUnavailableError(error)) {
        this.markNotificationsApiUnavailable();
        return true;
      }

      // Revert optimistic update
      this.notifications.set(previousState);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to mark notifications as read";
      this.error.set(errorMessage);
      this.logger.error("Error marking notifications as read:", error);
      throw error;
    }
  }

  /**
   * Refresh badge count from API
   */
  async refreshBadgeCount(): Promise<number> {
    if (this.shouldBypassNotificationsApi()) {
      return this.unreadCount();
    }

    try {
      const response = await firstValueFrom(
        this.apiService.get<{ unreadCount: number }>(
          API_ENDPOINTS.notifications.count,
        ),
      );

      const payload = extractApiPayload<number | Record<string, unknown>>(
        response,
      );
      const count =
        typeof payload === "number"
          ? payload
          : (readNumericField(extractApiRecord(response), "unreadCount", "count") ??
            0);

      // Update notifications to match server count if there's a mismatch
      const currentUnread = this.unreadCount();
      if (Math.abs(count - currentUnread) > 0) {
        // Reload notifications to sync state
        await this.loadNotifications();
      }

      return count;
    } catch (error) {
      if (this.isConflictOrUnavailableError(error)) {
        this.markNotificationsApiUnavailable();
        return this.unreadCount();
      }
      this.logger.warn("Error refreshing badge count:", toLogContext(error));
      // Return current count as fallback
      return this.unreadCount();
    }
  }

  /**
   * Update last opened timestamp
   */
  async updateLastOpenedAt(): Promise<void> {
    if (this.shouldBypassNotificationsApi()) {
      return;
    }

    try {
      await firstValueFrom(
        this.apiService.patch<{ success: boolean }>(
          API_ENDPOINTS.notifications.lastOpened,
          {},
        ),
      );

      this.lastOpenedAt.set(new Date().toISOString());
    } catch (error) {
      if (this.isConflictOrUnavailableError(error)) {
        this.markNotificationsApiUnavailable();
        return;
      }
      this.logger.warn(
        "Error updating last opened timestamp:",
        toLogContext(error),
      );
      // Non-critical error, don't throw
    }
  }

  /**
   * Add a notification to the state (for real-time updates)
   */
  addNotification(notification: Notification): void {
    this.notifications.update((notifications) => [
      notification,
      ...notifications,
    ]);
  }

  /**
   * Remove a notification from state
   */
  removeNotification(notificationId: string): void {
    this.notifications.update((notifications) =>
      notifications.filter((n) => n.id !== notificationId),
    );
  }

  /**
   * Clear all notifications (useful for logout)
   */
  clearNotifications(): void {
    this.notifications.set([]);
    this.error.set(null);
    this.lastOpenedAt.set(null);
  }

  /**
   * Get notification by ID
   */
  getNotification(id: string): Notification | undefined {
    return this.notifications().find((n) => n.id === id);
  }

  /**
   * Check if notifications are loading
   */
  isLoading(): boolean {
    return this.loading();
  }

  /**
   * Get current error state
   */
  getError(): string | null {
    return this.error();
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Dismiss a notification (soft delete)
   */
  async dismissNotification(notificationId: string): Promise<boolean> {
    const notification = this.notifications().find(
      (n) => n.id === notificationId,
    );
    if (!notification || notification.dismissed) {
      return true;
    }

    // Optimistic update
    const previousState = [...this.notifications()];
    this.notifications.update((notifications) =>
      notifications.map((n) =>
        n.id === notificationId ? { ...n, dismissed: true } : n,
      ),
    );

    try {
      const { error } = await this.supabaseService.client
        .from("notifications")
        .update({ dismissed: true, updated_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) {
        this.notifications.set(previousState);
        throw new Error(error.message);
      }

      return true;
    } catch (error) {
      this.notifications.set(previousState);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to dismiss notification";
      this.error.set(errorMessage);
      this.logger.error("Error dismissing notification:", error);
      throw error;
    }
  }

  /**
   * Dismiss all read notifications
   */
  async dismissAllRead(): Promise<boolean> {
    const readNotifications = this.readNotifications();
    if (readNotifications.length === 0) {
      return true;
    }

    const readIds = readNotifications.map((n) => n.id);
    const previousState = [...this.notifications()];

    // Optimistic update
    this.notifications.update((notifications) =>
      notifications.map((n) =>
        readIds.includes(n.id) ? { ...n, dismissed: true } : n,
      ),
    );

    try {
      const { error } = await this.supabaseService.client
        .from("notifications")
        .update({ dismissed: true, updated_at: new Date().toISOString() })
        .in("id", readIds);

      if (error) {
        this.notifications.set(previousState);
        throw new Error(error.message);
      }

      return true;
    } catch (error) {
      this.notifications.set(previousState);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to dismiss notifications";
      this.error.set(errorMessage);
      this.logger.error("Error dismissing read notifications:", error);
      throw error;
    }
  }

  /**
   * Get notifications filtered by category
   */
  getNotificationsByCategory(category: NotificationCategory): Notification[] {
    return this.activeNotifications().filter((n) => n.category === category);
  }

  /**
   * Get notifications filtered by type
   */
  getNotificationsByType(type: string): Notification[] {
    return this.activeNotifications().filter((n) => n.type === type);
  }

  /**
   * Check if there are any unread game-related notifications
   */
  hasUnreadGameNotifications(): boolean {
    return this.unreadNotifications().some(
      (n) => n.category === "game" || n.category === "tournament",
    );
  }

  /**
   * Check if there are any high priority unread notifications
   */
  hasHighPriorityUnread(): boolean {
    return this.highPriorityUnread().length > 0;
  }

  /**
   * Load notifications directly from Supabase (for initial load and refresh)
   */
  async loadNotificationsDirect(): Promise<Notification[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const userId = this.supabaseService.userId();
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await this.supabaseService.client
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .eq("dismissed", false)
        .order("created_at", { ascending: false })
        .limit(UI_LIMITS.NOTIFICATIONS_MAX_FETCH);

      if (error) {
        throw new Error(error.message);
      }

      const notifications = (data || []).map((row) =>
        this.mapPayloadToNotification(row as Record<string, unknown>),
      );

      this.notifications.set(notifications);
      this.loading.set(false);
      return notifications;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load notifications";
      this.error.set(errorMessage);
      this.loading.set(false);
      this.logger.error("Error loading notifications directly:", error);
      throw error;
    }
  }

  /**
   * Reconnect realtime subscription (useful after auth changes)
   */
  async reconnectRealtime(): Promise<void> {
    this.unsubscribeFromRealtime();
    await this.initializeRealtimeSubscription();
  }
}

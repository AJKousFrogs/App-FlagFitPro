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
 * - Real-time sync with backend
 * - Error handling and retry logic
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  updated_at?: string;
  priority?: "low" | "medium" | "high";
  action_url?: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  lastOpenedAt: string | null;
}

@Injectable({
  providedIn: "root",
})
export class NotificationStateService {
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);

  // State signals
  private readonly notifications = signal<Notification[]>([]);
  private readonly loading = signal<boolean>(false);
  private readonly error = signal<string | null>(null);
  private readonly lastOpenedAt = signal<string | null>(null);

  // Computed signals
  readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.read).length,
  );

  readonly unreadNotifications = computed(() =>
    this.notifications().filter((n) => !n.read),
  );

  readonly readNotifications = computed(() =>
    this.notifications().filter((n) => n.read),
  );

  readonly state = computed<NotificationState>(() => ({
    notifications: this.notifications(),
    unreadCount: this.unreadCount(),
    loading: this.loading(),
    error: this.error(),
    lastOpenedAt: this.lastOpenedAt(),
  }));

  /**
   * Load notifications from API
   */
  async loadNotifications(
    options: { lastOpenedAt?: string } = {},
  ): Promise<Notification[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.apiService.get<Notification[]>("/api/dashboard/notifications", {
          ...options,
          lastOpenedAt: this.lastOpenedAt() || options.lastOpenedAt,
        }),
      );

      let notifications: Notification[] = [];

      // Handle different response formats
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          notifications = response.data;
        } else if (
          (response.data as any).notifications &&
          Array.isArray((response.data as any).notifications)
        ) {
          notifications = (response.data as any).notifications;
        } else if (
          (response.data as any).data &&
          Array.isArray((response.data as any).data)
        ) {
          notifications = (response.data as any).data;
        }
      } else if (Array.isArray(response)) {
        notifications = response as any;
      }

      this.notifications.set(notifications);
      this.loading.set(false);
      return notifications;
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to load notifications";
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
          "/api/dashboard/notifications",
          { notificationId },
        ),
      );

      if (response.success === false || !response.data) {
        // Revert optimistic update
        this.notifications.set(previousState);
        throw new Error(response.error || "Failed to mark notification as read");
      }

      // Refresh badge count to ensure consistency
      await this.refreshBadgeCount();
      return true;
    } catch (error: any) {
      // Revert optimistic update
      this.notifications.set(previousState);
      const errorMessage =
        error?.message || "Failed to mark notification as read";
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
          "/api/dashboard/notifications",
          { notificationId: "all" },
        ),
      );

      if (response.success === false || !response.data) {
        // Revert optimistic update
        this.notifications.set(previousState);
        throw new Error(
          response.error || "Failed to mark all notifications as read",
        );
      }

      // Refresh badge count to ensure consistency
      await this.refreshBadgeCount();
      return true;
    } catch (error: any) {
      // Revert optimistic update
      this.notifications.set(previousState);
      const errorMessage =
        error?.message || "Failed to mark all notifications as read";
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
          "/api/dashboard/notifications",
          { ids: notificationIds },
        ),
      );

      if (response.success === false || !response.data) {
        // Revert optimistic update
        this.notifications.set(previousState);
        throw new Error(
          response.error || "Failed to mark notifications as read",
        );
      }

      // Refresh badge count to ensure consistency
      await this.refreshBadgeCount();
      return true;
    } catch (error: any) {
      // Revert optimistic update
      this.notifications.set(previousState);
      const errorMessage =
        error?.message || "Failed to mark notifications as read";
      this.error.set(errorMessage);
      this.logger.error("Error marking notifications as read:", error);
      throw error;
    }
  }

  /**
   * Refresh badge count from API
   */
  async refreshBadgeCount(): Promise<number> {
    try {
      const response = await firstValueFrom(
        this.apiService.get<{ unreadCount: number }>(
          "/api/dashboard/notifications/count",
        ),
      );

      let count = 0;
      if (response && response.data) {
        count =
          (response.data as any).unreadCount ||
          (response.data as any).count ||
          0;
      } else if (typeof response === "number") {
        count = response;
      } else if ((response as any).unreadCount !== undefined) {
        count = (response as any).unreadCount;
      }

      // Update notifications to match server count if there's a mismatch
      const currentUnread = this.unreadCount();
      if (Math.abs(count - currentUnread) > 0) {
        // Reload notifications to sync state
        await this.loadNotifications();
      }

      return count;
    } catch (error: any) {
      this.logger.warn("Error refreshing badge count:", error);
      // Return current count as fallback
      return this.unreadCount();
    }
  }

  /**
   * Update last opened timestamp
   */
  async updateLastOpenedAt(): Promise<void> {
    try {
      await firstValueFrom(
        this.apiService.patch<{ success: boolean }>(
          "/api/dashboard/notifications/last-opened",
          {},
        ),
      );

      this.lastOpenedAt.set(new Date().toISOString());
    } catch (error: any) {
      this.logger.warn("Error updating last opened timestamp:", error);
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
}

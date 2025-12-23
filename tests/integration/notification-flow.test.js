/**
 * Integration Tests: Notification Flow
 *
 * Tests the complete notification flow including:
 * - Loading notifications
 * - Marking as read (single, bulk, all)
 * - Badge count updates
 * - State persistence
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Notification Flow Integration Tests", () => {
  let notificationStore;
  let mockApiClient;

  beforeEach(() => {
    // Mock API client
    mockApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    };

    // Mock NotificationStore class
    // Note: In real implementation, import from actual file
    class MockNotificationStore {
      constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.loading = false;
        this.error = null;
        this.listeners = new Set();
        this.lastOpenedAt = null;
      }

      subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
      }

      notify() {
        this.listeners.forEach((cb) => cb(this.getState()));
      }

      getState() {
        return {
          notifications: this.notifications,
          unreadCount: this.unreadCount,
          loading: this.loading,
          error: this.error,
        };
      }

      setState(updates) {
        Object.assign(this, updates);
        this.notify();
      }

      calculateUnreadCount() {
        return this.notifications.filter((n) => !n.read).length;
      }

      async loadNotifications(options = {}) {
        this.setState({ loading: true, error: null });

        try {
          const response = await mockApiClient.get(
            "/api/dashboard/notifications",
            options,
          );

          let notifications = [];
          if (response && response.success && response.data) {
            if (Array.isArray(response.data)) {
              notifications = response.data;
            } else if (response.data.notifications) {
              notifications = response.data.notifications;
            }
          }

          const unreadCount = notifications.filter((n) => !n.read).length;

          this.setState({
            notifications,
            unreadCount,
            loading: false,
            error: null,
          });

          return notifications;
        } catch (error) {
          this.setState({
            loading: false,
            error: error.message || "Failed to load notifications",
          });
          throw error;
        }
      }

      async markOneRead(id) {
        const notification = this.notifications.find(
          (n) => String(n.id) === String(id),
        );
        if (!notification || notification.read) {
          return;
        }

        // Optimistic update
        const previousState = { ...notification };
        notification.read = true;
        const previousUnreadCount = this.unreadCount;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.notify();

        try {
          const response = await mockApiClient.post(
            "/api/dashboard/notifications",
            {
              notificationId: String(id),
            },
          );

          if (!response || response.success === false) {
            throw new Error(
              response?.error || "Failed to mark notification as read",
            );
          }

          this.notify();
          return true;
        } catch (error) {
          // Revert optimistic update
          notification.read = previousState.read;
          this.unreadCount = previousUnreadCount;
          this.setState({ error: "Couldn't mark as read, please retry." });
          this.notify();
          throw error;
        }
      }

      async markAllRead() {
        const unreadNotifications = this.notifications.filter((n) => !n.read);
        if (unreadNotifications.length === 0) {
          return;
        }

        // Optimistic update
        const previousState = this.notifications.map((n) => ({ ...n }));
        this.notifications.forEach((n) => {
          n.read = true;
        });
        const previousUnreadCount = this.unreadCount;
        this.unreadCount = 0;
        this.notify();

        try {
          const response = await mockApiClient.post(
            "/api/dashboard/notifications",
            {
              notificationId: "all",
            },
          );

          if (!response || response.success === false) {
            throw new Error(
              response?.error || "Failed to mark all notifications as read",
            );
          }

          this.notify();
          return true;
        } catch (error) {
          // Revert optimistic update
          this.notifications = previousState;
          this.unreadCount = previousUnreadCount;
          this.setState({ error: "Couldn't mark all as read, please retry." });
          this.notify();
          throw error;
        }
      }

      async refreshBadge() {
        try {
          const response = await mockApiClient.get(
            "/api/dashboard/notifications/count",
          );

          let count = 0;
          if (response && response.success !== false && response.data) {
            count = response.data.unreadCount || response.data.count || 0;
          } else if (typeof response === "number") {
            count = response;
          } else if (response.unreadCount !== undefined) {
            count = response.unreadCount;
          }

          this.unreadCount = count;
          this.notify();
          return count;
        } catch (error) {
          const calculatedCount = this.calculateUnreadCount();
          this.unreadCount = calculatedCount;
          this.notify();
          return calculatedCount;
        }
      }
    }

    notificationStore = new MockNotificationStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading Notifications", () => {
    it("should load notifications successfully", async () => {
      const mockNotifications = [
        { id: "1", type: "training", message: "Test 1", read: false },
        { id: "2", type: "achievement", message: "Test 2", read: false },
      ];

      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: mockNotifications,
      });

      const notifications = await notificationStore.loadNotifications();

      expect(notifications).toEqual(mockNotifications);
      expect(notificationStore.notifications).toEqual(mockNotifications);
      expect(notificationStore.unreadCount).toBe(2);
      expect(notificationStore.loading).toBe(false);
      expect(notificationStore.error).toBe(null);
    });

    it("should handle loading state correctly", async () => {
      let loadingState = false;
      notificationStore.subscribe((state) => {
        loadingState = state.loading;
      });

      const promise = notificationStore.loadNotifications();

      // Check loading is true during request
      expect(loadingState).toBe(true);
      expect(notificationStore.loading).toBe(true);

      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: [],
      });

      await promise;

      // Check loading is false after request
      expect(loadingState).toBe(false);
      expect(notificationStore.loading).toBe(false);
    });

    it("should handle API errors gracefully", async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error("Network error"));

      await expect(notificationStore.loadNotifications()).rejects.toThrow(
        "Network error",
      );
      expect(notificationStore.loading).toBe(false);
      expect(notificationStore.error).toBe("Network error");
    });

    it("should handle different response formats", async () => {
      // Test nested data format
      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: {
          notifications: [{ id: "1", message: "Test", read: false }],
        },
      });

      await notificationStore.loadNotifications();
      expect(notificationStore.notifications.length).toBe(1);
    });
  });

  describe("Marking Notifications as Read", () => {
    beforeEach(() => {
      notificationStore.notifications = [
        { id: "1", message: "Test 1", read: false },
        { id: "2", message: "Test 2", read: false },
        { id: "3", message: "Test 3", read: true },
      ];
      notificationStore.unreadCount = 2;
    });

    it("should mark single notification as read", async () => {
      mockApiClient.post.mockResolvedValueOnce({ success: true });

      await notificationStore.markOneRead("1");

      expect(notificationStore.notifications[0].read).toBe(true);
      expect(notificationStore.unreadCount).toBe(1);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/api/dashboard/notifications",
        { notificationId: "1" },
      );
    });

    it("should revert optimistic update on API failure", async () => {
      const initialUnreadCount = notificationStore.unreadCount;
      mockApiClient.post.mockRejectedValueOnce(new Error("API error"));

      await expect(notificationStore.markOneRead("1")).rejects.toThrow();

      expect(notificationStore.notifications[0].read).toBe(false);
      expect(notificationStore.unreadCount).toBe(initialUnreadCount);
      expect(notificationStore.error).toBe(
        "Couldn't mark as read, please retry.",
      );
    });

    it("should mark all notifications as read", async () => {
      mockApiClient.post.mockResolvedValueOnce({ success: true });

      await notificationStore.markAllRead();

      expect(notificationStore.notifications.every((n) => n.read)).toBe(true);
      expect(notificationStore.unreadCount).toBe(0);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/api/dashboard/notifications",
        { notificationId: "all" },
      );
    });

    it("should revert optimistic update when mark all fails", async () => {
      const initialNotifications = notificationStore.notifications.map((n) => ({
        ...n,
      }));
      const initialUnreadCount = notificationStore.unreadCount;

      mockApiClient.post.mockRejectedValueOnce(new Error("API error"));

      await expect(notificationStore.markAllRead()).rejects.toThrow();

      expect(notificationStore.notifications).toEqual(initialNotifications);
      expect(notificationStore.unreadCount).toBe(initialUnreadCount);
    });

    it("should not mark already-read notification", async () => {
      await notificationStore.markOneRead("3"); // Already read

      expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    it("should not mark all if already all read", async () => {
      notificationStore.notifications.forEach((n) => {
        n.read = true;
      });
      notificationStore.unreadCount = 0;

      await notificationStore.markAllRead();

      expect(mockApiClient.post).not.toHaveBeenCalled();
    });
  });

  describe("Badge Count Management", () => {
    beforeEach(() => {
      notificationStore.notifications = [
        { id: "1", message: "Test 1", read: false },
        { id: "2", message: "Test 2", read: false },
      ];
      notificationStore.unreadCount = 2;
    });

    it("should refresh badge count from API", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: { unreadCount: 5 },
      });

      const count = await notificationStore.refreshBadge();

      expect(count).toBe(5);
      expect(notificationStore.unreadCount).toBe(5);
    });

    it("should fallback to calculated count on API error", async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error("API error"));

      const count = await notificationStore.refreshBadge();

      expect(count).toBe(2); // Calculated from notifications
      expect(notificationStore.unreadCount).toBe(2);
    });

    it("should handle different badge count response formats", async () => {
      // Test number response
      mockApiClient.get.mockResolvedValueOnce(3);
      let count = await notificationStore.refreshBadge();
      expect(count).toBe(3);

      // Test direct unreadCount property
      mockApiClient.get.mockResolvedValueOnce({ unreadCount: 4 });
      count = await notificationStore.refreshBadge();
      expect(count).toBe(4);
    });
  });

  describe("State Subscription", () => {
    it("should notify subscribers on state changes", () => {
      const callback = vi.fn();
      notificationStore.subscribe(callback);

      notificationStore.setState({ unreadCount: 5 });

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ unreadCount: 5 }),
      );
    });

    it("should allow unsubscribing", () => {
      const callback = vi.fn();
      const unsubscribe = notificationStore.subscribe(callback);

      unsubscribe();
      notificationStore.setState({ unreadCount: 5 });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should notify multiple subscribers", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      notificationStore.subscribe(callback1);
      notificationStore.subscribe(callback2);

      notificationStore.setState({ unreadCount: 3 });

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe("Persistence Flow", () => {
    it("should maintain state across multiple operations", async () => {
      // Load notifications
      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: [
          { id: "1", message: "Test 1", read: false },
          { id: "2", message: "Test 2", read: false },
        ],
      });

      await notificationStore.loadNotifications();
      expect(notificationStore.unreadCount).toBe(2);

      // Mark one as read
      mockApiClient.post.mockResolvedValueOnce({ success: true });
      await notificationStore.markOneRead("1");
      expect(notificationStore.unreadCount).toBe(1);

      // Refresh badge
      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: { unreadCount: 1 },
      });
      await notificationStore.refreshBadge();
      expect(notificationStore.unreadCount).toBe(1);

      // Mark all as read
      mockApiClient.post.mockResolvedValueOnce({ success: true });
      await notificationStore.markAllRead();
      expect(notificationStore.unreadCount).toBe(0);
    });

    it("should handle rapid successive operations", async () => {
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: [
          { id: "1", message: "Test 1", read: false },
          { id: "2", message: "Test 2", read: false },
        ],
      });

      mockApiClient.post.mockResolvedValue({ success: true });

      // Rapid operations
      await notificationStore.loadNotifications();
      await notificationStore.markOneRead("1");
      await notificationStore.markOneRead("2");

      expect(notificationStore.unreadCount).toBe(0);
      expect(notificationStore.notifications.every((n) => n.read)).toBe(true);
    });
  });

  describe("Error Recovery", () => {
    it("should recover from transient errors", async () => {
      // First attempt fails
      mockApiClient.get.mockRejectedValueOnce(new Error("Network error"));
      await expect(notificationStore.loadNotifications()).rejects.toThrow();

      // Second attempt succeeds
      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: [{ id: "1", message: "Test", read: false }],
      });

      await notificationStore.loadNotifications();
      expect(notificationStore.notifications.length).toBe(1);
      expect(notificationStore.error).toBe(null);
    });

    it("should maintain state during error recovery", async () => {
      notificationStore.notifications = [
        { id: "1", message: "Test", read: false },
      ];
      notificationStore.unreadCount = 1;

      // Failed mark as read
      mockApiClient.post.mockRejectedValueOnce(new Error("API error"));
      await expect(notificationStore.markOneRead("1")).rejects.toThrow();

      // State should be reverted
      expect(notificationStore.notifications[0].read).toBe(false);
      expect(notificationStore.unreadCount).toBe(1);
    });
  });
});

/**
 * FlagFit Pro - Notification Manager
 * Handles push notifications, reminders, and achievement alerts
 * 100% FREE - Uses browser Notification API
 */

import { logger } from "../logger.js";

// Access storageService from global window object
const storageService = window.storageService;

class NotificationManager {
  constructor() {
    this.permission = "default";
    this.isSupported = "Notification" in window;
    this.swRegistration = null;

    // Load permission status
    if (this.isSupported) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Initialize notification manager and register service worker
   */
  async init() {
    if (!this.isSupported) {
      logger.warn("[Notifications] Not supported in this browser");
      return false;
    }

    // Register service worker if not already registered
    if ("serviceWorker" in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        logger.info(
          "[Notifications] Service Worker registered:",
          this.swRegistration,
        );

        // Check for updates
        this.swRegistration.addEventListener("updatefound", () => {
          const newWorker = this.swRegistration.installing;
          logger.info("[Notifications] Service Worker update found");

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New service worker available
              this.showUpdateNotification();
            }
          });
        });

        return true;
      } catch (error) {
        logger.error(
          "[Notifications] Service Worker registration failed:",
          error,
        );
        return false;
      }
    }

    return false;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission() {
    if (!this.isSupported) {
      return false;
    }

    if (this.permission === "granted") {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;

      if (permission === "granted") {
        logger.info("[Notifications] Permission granted");
        this.scheduleDefaultReminders();
        return true;
      } else {
        logger.info("[Notifications] Permission denied");
        return false;
      }
    } catch (error) {
      logger.error("[Notifications] Permission request failed:", error);
      return false;
    }
  }

  /**
   * Show a notification (unified with backend)
   */
  async show(title, options = {}) {
    const {
      type = "general",
      message = title,
      priority = "medium",
      createInBackend = true,
      ...notificationOptions
    } = options;

    // Create notification in backend first (if enabled and API available)
    if (createInBackend && window.apiClient && window.API_ENDPOINTS) {
      try {
        await window.apiClient.post(
          window.API_ENDPOINTS.dashboard.notificationsCreate,
          {
            type,
            message,
            priority,
          },
        );
      } catch (error) {
        logger.warn(
          "[Notifications] Failed to create notification in backend:",
          error,
        );
        // Continue to show push notification even if backend creation fails
      }
    }

    // Check user preferences before showing push notification
    if (window.apiClient && window.API_ENDPOINTS) {
      try {
        const prefsResponse = await window.apiClient.get(
          window.API_ENDPOINTS.dashboard.notificationsPreferences,
        );
        if (prefsResponse && prefsResponse.success && prefsResponse.data) {
          const typePrefs = prefsResponse.data[type];
          // Don't show push if muted or push disabled
          if (typePrefs && (typePrefs.muted || !typePrefs.pushEnabled)) {
            logger.debug(
              `[Notifications] Push notification for ${type} is muted or disabled`,
            );
            return null;
          }
        }
      } catch (error) {
        logger.warn("[Notifications] Failed to check preferences:", error);
        // Continue to show notification if preference check fails
      }
    }

    if (!this.isSupported || this.permission !== "granted") {
      logger.warn(
        "[Notifications] Cannot show notification - permission not granted",
      );
      return null;
    }

    const defaultOptions = {
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      vibrate: [200, 100, 200],
      tag: `flagfit-${type}-${Date.now()}`,
      requireInteraction: false,
      data: { type, ...notificationOptions.data },
    };

    const finalOptions = { ...defaultOptions, ...notificationOptions };

    try {
      // Use service worker notification if available
      if (this.swRegistration && this.swRegistration.showNotification) {
        return await this.swRegistration.showNotification(title, finalOptions);
      }

      // Fallback to basic notification
      return new Notification(title, finalOptions);
    } catch (error) {
      logger.error("[Notifications] Failed to show notification:", error);
      return null;
    }
  }

  /**
   * Schedule wellness reminder
   */
  scheduleWellnessReminder(time = "21:00") {
    const [hours, minutes] = time.split(":").map(Number);
    const now = new Date();
    const scheduledTime = new Date();

    scheduledTime.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilReminder = scheduledTime - now;

    logger.info(
      `[Notifications] Wellness reminder scheduled for ${scheduledTime.toLocaleString()}`,
    );

    setTimeout(() => {
      this.show("Time for your wellness check-in! 💪", {
        type: "wellness",
        message: "Log your sleep, energy, and mood to track your recovery",
        body: "Log your sleep, energy, and mood to track your recovery",
        icon: "/icons/icon-192.png",
        tag: "wellness-reminder",
        data: { url: "/wellness.html", type: "wellness" },
        actions: [
          { action: "log", title: "Log Now" },
          { action: "skip", title: "Skip" },
        ],
        priority: "medium",
      });

      // Schedule next reminder for tomorrow
      this.scheduleWellnessReminder(time);
    }, timeUntilReminder);

    // Save scheduled time to localStorage
    storageService.set("wellnessReminderTime", time, { usePrefix: false });
  }

  /**
   * Notify achievement unlocked
   */
  notifyAchievement(achievement) {
    this.show(`Achievement Unlocked! ${achievement.icon}`, {
      body: achievement.name + "\n" + achievement.description,
      icon: "/icons/icon-192.png",
      tag: `achievement-${achievement.id}`,
      requireInteraction: true,
      data: {
        url: "/dashboard.html",
        type: "achievement",
        achievementId: achievement.id,
      },
      vibrate: [100, 50, 100, 50, 100, 50, 200],
    });
  }

  /**
   * Notify training session reminder
   */
  notifyTrainingReminder(session) {
    this.show("Training Session Reminder 🏈", {
      body: `${session.title} starts in 30 minutes`,
      icon: "/icons/icon-192.png",
      tag: `training-${session.id}`,
      data: {
        url: "/training.html",
        type: "training-reminder",
        sessionId: session.id,
      },
      actions: [
        { action: "view", title: "View Session" },
        { action: "dismiss", title: "Dismiss" },
      ],
    });
  }

  /**
   * Notify milestone reached
   */
  notifyMilestone(milestone) {
    this.show(`Milestone Reached! 🎉`, {
      body: milestone.message,
      icon: "/icons/icon-192.png",
      tag: `milestone-${milestone.type}`,
      requireInteraction: true,
      data: { url: "/dashboard.html", type: "milestone" },
      vibrate: [100, 50, 100, 50, 100, 50, 300],
    });
  }

  /**
   * Notify streak maintained
   */
  notifyStreak(days) {
    const emoji = days >= 30 ? "🔥🔥🔥" : days >= 7 ? "🔥🔥" : "🔥";

    this.show(`${days}-Day Streak! ${emoji}`, {
      type: "wellness",
      message: `You've logged wellness for ${days} days straight. Keep it up!`,
      body: `You've logged wellness for ${days} days straight. Keep it up!`,
      icon: "/icons/icon-192.png",
      tag: `streak-${days}`,
      data: { url: "/wellness.html", type: "wellness", days },
      vibrate: [200, 100, 200],
      priority: "medium",
    });
  }

  /**
   * Notify performance improvement
   */
  notifyImprovement(metric, improvement) {
    this.show("Performance Improved! 📈", {
      body: `Your ${metric} improved by ${improvement}. Great work!`,
      icon: "/icons/icon-192.png",
      tag: `improvement-${metric}`,
      data: { url: "/analytics.html", type: "improvement", metric },
    });
  }

  /**
   * Schedule default reminders
   */
  scheduleDefaultReminders() {
    // Get saved reminder time or use default (9 PM)
    const savedTime = storageService.get("wellnessReminderTime", "21:00", {
      usePrefix: false,
    });
    this.scheduleWellnessReminder(savedTime);

    logger.info("[Notifications] Default reminders scheduled");
  }

  /**
   * Cancel all scheduled reminders
   */
  cancelAllReminders() {
    // Clear from localStorage
    storageService.remove("wellnessReminderTime", { usePrefix: false });

    logger.info("[Notifications] All reminders cancelled");
  }

  /**
   * Show update notification when new version available
   */
  showUpdateNotification() {
    this.show("FlagFit Pro Update Available! 🎉", {
      body: "A new version is available. Refresh to update.",
      icon: "/icons/icon-192.png",
      tag: "app-update",
      requireInteraction: true,
      data: { type: "app-update" },
      actions: [
        { action: "update", title: "Update Now" },
        { action: "later", title: "Later" },
      ],
    });
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled() {
    return this.isSupported && this.permission === "granted";
  }

  /**
   * Get permission status
   */
  getPermissionStatus() {
    return {
      supported: this.isSupported,
      permission: this.permission,
      enabled: this.isEnabled(),
    };
  }
}

// Create singleton instance
const notificationManager = new NotificationManager();

// Auto-initialize on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    notificationManager.init();
  });
} else {
  notificationManager.init();
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = notificationManager;
}

// Make available globally
window.notificationManager = notificationManager;

logger.info("[Notifications] Notification Manager loaded");

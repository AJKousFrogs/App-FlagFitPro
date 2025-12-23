/**
 * Enhanced Notification Center - FlagFit Pro
 *
 * Features:
 * - Real-time updates via Supabase subscriptions
 * - Filtering and grouping (by type, date, read/unread)
 * - Smooth animations and transitions
 * - Notification actions (click to navigate)
 * - Sound/vibration support
 * - Infinite scroll/pagination
 * - Better accessibility
 * - Performance optimizations
 */

import { realtimeManager } from "../services/supabase-client.js";
import { setSafeContent } from "../utils/shared.js";
import { logger } from "../../logger.js";

class EnhancedNotificationCenter {
  constructor() {
    this.panel = null;
    this.notificationStore = null;
    this.realtimeSubscription = null;
    this.currentFilter = "all"; // 'all', 'unread', 'read'
    this.currentGroupBy = "date"; // 'date', 'type', 'none'
    this.currentTypeFilter = null; // null = all types
    this.page = 1;
    this.pageSize = 20;
    this.hasMore = true;
    this.isLoading = false;
    this.soundEnabled = true;
    this.vibrationEnabled = true;

    // Notification type configurations
    this.notificationTypes = {
      training: {
        icon: "🏃",
        color: "#3b82f6",
        bgColor: "rgba(59, 130, 246, 0.1)",
        label: "Training",
      },
      achievement: {
        icon: "🏆",
        color: "#f59e0b",
        bgColor: "rgba(245, 158, 11, 0.1)",
        label: "Achievement",
      },
      team: {
        icon: "👥",
        color: "#8b5cf6",
        bgColor: "rgba(139, 92, 246, 0.1)",
        label: "Team",
      },
      wellness: {
        icon: "💚",
        color: "#10b981",
        bgColor: "rgba(16, 185, 129, 0.1)",
        label: "Wellness",
      },
      tournament: {
        icon: "🏈",
        color: "#cc9610",
        bgColor: "rgba(204, 150, 16, 0.1)",
        label: "Tournament",
      },
      general: {
        icon: "🔔",
        color: "#6b7280",
        bgColor: "rgba(107, 114, 128, 0.1)",
        label: "General",
      },
    };
  }

  /**
   * Initialize the enhanced notification center
   */
  async init(notificationStore) {
    this.notificationStore = notificationStore;

    // Subscribe to store changes
    if (notificationStore) {
      notificationStore.subscribe((state) => {
        this.onStoreUpdate(state);
      });
    }

    // Load user preferences
    await this.loadPreferences();

    // Setup real-time subscription
    await this.setupRealtimeSubscription();

    // Initialize panel UI
    this.initPanel();

    logger.info(
      "[NotificationCenter] Enhanced notification center initialized",
    );
  }

  /**
   * Load user preferences for notifications
   */
  async loadPreferences() {
    try {
      if (window.storageService) {
        const prefs = window.storageService.get(
          "notificationPreferences",
          {
            soundEnabled: true,
            vibrationEnabled: true,
            filter: "all",
            groupBy: "date",
          },
          { usePrefix: false },
        );

        this.soundEnabled = prefs.soundEnabled !== false;
        this.vibrationEnabled = prefs.vibrationEnabled !== false;
        this.currentFilter = prefs.filter || "all";
        this.currentGroupBy = prefs.groupBy || "date";
      }
    } catch (error) {
      logger.warn("[NotificationCenter] Failed to load preferences:", error);
    }
  }

  /**
   * Save user preferences
   */
  async savePreferences() {
    try {
      if (window.storageService) {
        window.storageService.set(
          "notificationPreferences",
          {
            soundEnabled: this.soundEnabled,
            vibrationEnabled: this.vibrationEnabled,
            filter: this.currentFilter,
            groupBy: this.currentGroupBy,
          },
          { usePrefix: false },
        );
      }
    } catch (error) {
      logger.warn("[NotificationCenter] Failed to save preferences:", error);
    }
  }

  /**
   * Setup real-time subscription for notifications
   */
  async setupRealtimeSubscription() {
    try {
      // Get current user ID
      const userId = this.getCurrentUserId();
      if (!userId) {
        logger.warn(
          "[NotificationCenter] No user ID available for real-time subscription",
        );
        return;
      }

      // Unsubscribe from existing subscription
      if (this.realtimeSubscription) {
        this.realtimeSubscription.unsubscribe();
      }

      // Subscribe to new notifications
      const insertSub = realtimeManager.subscribe(
        "notifications",
        {
          event: "INSERT",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          this.onNewNotification(payload);
        },
      );

      // Also subscribe to updates (mark as read, etc.)
      const updateSub = realtimeManager.subscribe(
        "notifications",
        {
          event: "UPDATE",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          this.onNotificationUpdate(payload);
        },
      );

      // Store subscriptions for cleanup
      this.realtimeSubscription = {
        unsubscribe: () => {
          if (insertSub && insertSub.unsubscribe) {
            insertSub.unsubscribe();
          }
          if (updateSub && updateSub.unsubscribe) {
            updateSub.unsubscribe();
          }
        },
      };

      logger.info("[NotificationCenter] Real-time subscription active");
    } catch (error) {
      logger.error(
        "[NotificationCenter] Failed to setup real-time subscription:",
        error,
      );
    }
  }

  /**
   * Get current user ID
   */
  getCurrentUserId() {
    try {
      if (window.authManager && window.authManager.getUserId) {
        return window.authManager.getUserId();
      }
      // Fallback: try to get from storage
      if (window.storageService) {
        const userData = window.storageService.get("user", null, {
          usePrefix: false,
        });
        return userData?.id || null;
      }
      return null;
    } catch (error) {
      logger.warn("[NotificationCenter] Failed to get user ID:", error);
      return null;
    }
  }

  /**
   * Handle new notification from real-time subscription
   */
  onNewNotification(payload) {
    // Handle both direct notification object and payload structure
    const notification = payload.new || payload;
    logger.debug(
      "[NotificationCenter] New notification received:",
      notification,
    );

    // Refresh notifications from store
    if (this.notificationStore) {
      this.notificationStore.loadNotifications().catch((err) => {
        logger.warn(
          "[NotificationCenter] Failed to refresh notifications:",
          err,
        );
      });
    }

    // Play sound and vibrate if enabled
    if (this.soundEnabled) {
      this.playNotificationSound();
    }
    if (this.vibrationEnabled && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    // Show browser notification if permission granted
    if (window.notificationManager && window.notificationManager.isEnabled()) {
      const typeConfig =
        this.notificationTypes[notification.type] ||
        this.notificationTypes.general;
      window.notificationManager.show(
        notification.title || notification.message,
        {
          type: notification.type,
          message: notification.message,
          priority: notification.priority || "medium",
          createInBackend: false, // Already created
        },
      );
    }

    // Refresh badge
    if (this.notificationStore) {
      this.notificationStore.refreshBadge();
    }

    // Update UI if panel is open
    if (this.panel && !this.panel.classList.contains("is-open")) {
      return; // Don't render if panel is closed
    }
    this.render();
  }

  /**
   * Handle notification update from real-time subscription
   */
  onNotificationUpdate(payload) {
    // Handle both direct notification object and payload structure
    const notification = payload.new || payload;
    logger.debug("[NotificationCenter] Notification updated:", notification);

    // Refresh notifications from store
    if (this.notificationStore) {
      this.notificationStore.loadNotifications().catch((err) => {
        logger.warn(
          "[NotificationCenter] Failed to refresh notifications:",
          err,
        );
      });
    }

    // Update UI if panel is open
    if (this.panel && !this.panel.classList.contains("is-open")) {
      return; // Don't render if panel is closed
    }
    this.render();
  }

  /**
   * Handle store state updates
   */
  onStoreUpdate(state) {
    // Update UI if panel is open
    if (this.panel && !this.panel.hidden) {
      this.render();
    }
  }

  /**
   * Initialize panel UI
   */
  initPanel() {
    const panel = document.getElementById("notification-panel");
    if (!panel) {
      logger.warn("[NotificationCenter] Notification panel not found");
      return;
    }

    this.panel = panel;

    // Enhance panel HTML structure
    this.enhancePanelHTML();

    // Setup event listeners
    this.setupEventListeners();

    // Initial render
    this.render();
  }

  /**
   * Enhance panel HTML structure
   */
  enhancePanelHTML() {
    const panel = this.panel;
    if (!panel) {
      return;
    }

    // Check if already enhanced
    if (panel.querySelector(".notification-filters")) {
      return;
    }

    const header = panel.querySelector(".notification-header");
    const list = panel.querySelector("#notification-list");
    const actions = panel.querySelector(".notification-actions");

    if (!header || !list) {
      return;
    }

    // Add filters section after header
    const filtersHTML = `
      <div class="notification-filters">
        <div class="notification-filter-tabs">
          <button class="filter-tab ${this.currentFilter === "all" ? "active" : ""}" data-filter="all">
            All
          </button>
          <button class="filter-tab ${this.currentFilter === "unread" ? "active" : ""}" data-filter="unread">
            Unread
          </button>
          <button class="filter-tab ${this.currentFilter === "read" ? "active" : ""}" data-filter="read">
            Read
          </button>
        </div>
        <div class="notification-type-filters">
          <button class="type-filter ${!this.currentTypeFilter ? "active" : ""}" data-type="all">
            All Types
          </button>
          ${Object.entries(this.notificationTypes)
            .map(
              ([type, config]) => `
            <button class="type-filter ${this.currentTypeFilter === type ? "active" : ""}" data-type="${type}">
              ${config.icon} ${config.label}
            </button>
          `,
            )
            .join("")}
        </div>
      </div>
    `;

    header.insertAdjacentHTML("afterend", filtersHTML);

    // Enhance actions section
    if (actions) {
      // Build actions HTML (static content, safe)
      const actionsHtml = `
        <button class="notification-action-btn mark-all-read-btn">
          <i data-lucide="check-circle"></i>
          Mark all as read
        </button>
        <button class="notification-action-btn toggle-preferences-btn">
          <i data-lucide="settings"></i>
          Settings
        </button>
      `;
      // Use setSafeContent to sanitize HTML before insertion
      setSafeContent(actions, actionsHtml, true, true);

      // Replace onclick with addEventListener
      const markAllBtn = actions.querySelector(".mark-all-read-btn");
      const togglePrefsBtn = actions.querySelector(".toggle-preferences-btn");

      if (markAllBtn && window.enhancedNotificationCenter) {
        markAllBtn.addEventListener("click", () => {
          if (window.enhancedNotificationCenter.markAllAsRead) {
            window.enhancedNotificationCenter.markAllAsRead();
          }
        });
      }

      if (togglePrefsBtn && window.enhancedNotificationCenter) {
        togglePrefsBtn.addEventListener("click", () => {
          if (window.enhancedNotificationCenter.togglePreferences) {
            window.enhancedNotificationCenter.togglePreferences();
          }
        });
      }
    }

    // Initialize Lucide icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons(panel);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const panel = this.panel;
    if (!panel) {
      return;
    }

    // Filter tabs
    panel.querySelectorAll(".filter-tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        const filter = e.target.dataset.filter;
        this.setFilter(filter);
      });
    });

    // Type filters
    panel.querySelectorAll(".type-filter").forEach((filter) => {
      filter.addEventListener("click", (e) => {
        const type =
          e.target.dataset.type === "all" ? null : e.target.dataset.type;
        this.setTypeFilter(type);
      });
    });

    // Notification item clicks
    panel.addEventListener("click", (e) => {
      const item = e.target.closest(".notification-item");
      if (item && !e.target.closest(".notification-mark-read")) {
        const id = item.dataset.id;
        this.handleNotificationClick(id, item);
      }
    });

    // Infinite scroll
    const list = panel.querySelector("#notification-list");
    if (list) {
      list.addEventListener("scroll", () => {
        this.handleScroll(list);
      });
    }
  }

  /**
   * Set filter (all/unread/read)
   */
  setFilter(filter) {
    this.currentFilter = filter;
    this.savePreferences();
    this.render();

    // Update filter tabs
    this.panel?.querySelectorAll(".filter-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.filter === filter);
    });
  }

  /**
   * Set type filter
   */
  setTypeFilter(type) {
    this.currentTypeFilter = type;
    this.render();

    // Update type filter buttons
    this.panel?.querySelectorAll(".type-filter").forEach((btn) => {
      if (type === null) {
        btn.classList.toggle("active", btn.dataset.type === "all");
      } else {
        btn.classList.toggle("active", btn.dataset.type === type);
      }
    });
  }

  /**
   * Handle notification click
   */
  async handleNotificationClick(id, element) {
    if (!this.notificationStore) {
      return;
    }

    const notification = this.notificationStore.notifications.find(
      (n) => String(n.id) === String(id),
    );
    if (!notification) {
      return;
    }

    // Mark as read if unread
    if (!notification.read) {
      try {
        await this.notificationStore.markOneRead(id);
        element.classList.add("read");
        element.classList.remove("unread", "new");
      } catch (error) {
        logger.warn("[NotificationCenter] Failed to mark as read:", error);
      }
    }

    // Navigate if action_url is present
    if (notification.action_url) {
      window.location.href = notification.action_url;
    } else if (notification.url) {
      window.location.href = notification.url;
    }
  }

  /**
   * Handle scroll for infinite scroll
   */
  handleScroll(list) {
    if (this.isLoading || !this.hasMore) {
      return;
    }

    const scrollTop = list.scrollTop;
    const scrollHeight = list.scrollHeight;
    const clientHeight = list.clientHeight;

    // Load more when 80% scrolled
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      this.loadMore();
    }
  }

  /**
   * Load more notifications
   */
  async loadMore() {
    if (this.isLoading || !this.hasMore || !this.notificationStore) {
      return;
    }

    this.isLoading = true;
    this.page++;

    try {
      const notifications = await this.notificationStore.loadNotifications({
        page: this.page,
        pageSize: this.pageSize,
      });

      if (!notifications || notifications.length < this.pageSize) {
        this.hasMore = false;
      }

      this.render();
    } catch (error) {
      logger.warn(
        "[NotificationCenter] Failed to load more notifications:",
        error,
      );
      this.page--; // Revert page increment
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Render notifications
   */
  render() {
    const list = document.getElementById("notification-list");
    if (!list || !this.notificationStore) {
      return;
    }

    const state = this.notificationStore.getState();
    let notifications = [...state.notifications];

    // Apply filters
    notifications = this.applyFilters(notifications);

    // Group notifications
    const grouped = this.groupNotifications(notifications);

    // Render
    if (notifications.length === 0) {
      // Use setSafeContent to sanitize HTML before insertion
      const emptyHtml = this.renderEmptyState();
      setSafeContent(list, emptyHtml, true, true);
      return;
    }

    // Use setSafeContent to sanitize HTML before insertion
    const groupedHtml = this.renderGroupedNotifications(grouped);
    setSafeContent(list, groupedHtml, true, true);

    // Re-initialize Lucide icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons(list);
    }

    // Add mark as read handlers
    list.querySelectorAll(".notification-mark-read").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const item = btn.closest(".notification-item");
        const id = item.dataset.id;
        await this.markAsRead(id);
      });
    });
  }

  /**
   * Apply filters to notifications
   */
  applyFilters(notifications) {
    let filtered = [...notifications];

    // Filter by read/unread status
    if (this.currentFilter === "unread") {
      filtered = filtered.filter((n) => !n.read);
    } else if (this.currentFilter === "read") {
      filtered = filtered.filter((n) => n.read);
    }

    // Filter by type
    if (this.currentTypeFilter) {
      filtered = filtered.filter((n) => n.type === this.currentTypeFilter);
    }

    return filtered;
  }

  /**
   * Group notifications
   */
  groupNotifications(notifications) {
    if (this.currentGroupBy === "none") {
      return { All: notifications };
    }

    if (this.currentGroupBy === "type") {
      const grouped = {};
      notifications.forEach((notif) => {
        const type = notif.type || "general";
        if (!grouped[type]) {
          grouped[type] = [];
        }
        grouped[type].push(notif);
      });
      return grouped;
    }

    // Group by date (default)
    const grouped = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      Older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    notifications.forEach((notif) => {
      const date = new Date(notif.created_at || notif.createdAt || Date.now());

      if (date >= today) {
        grouped["Today"].push(notif);
      } else if (date >= yesterday) {
        grouped["Yesterday"].push(notif);
      } else if (date >= weekAgo) {
        grouped["This Week"].push(notif);
      } else {
        grouped["Older"].push(notif);
      }
    });

    // Remove empty groups
    Object.keys(grouped).forEach((key) => {
      if (grouped[key].length === 0) {
        delete grouped[key];
      }
    });

    return grouped;
  }

  /**
   * Render empty state
   */
  renderEmptyState() {
    const filterText =
      this.currentFilter === "unread"
        ? "unread"
        : this.currentFilter === "read"
          ? "read"
          : "";
    const typeText = this.currentTypeFilter
      ? this.notificationTypes[this.currentTypeFilter]?.label.toLowerCase()
      : "";

    return `
      <div class="notification-empty">
        <div class="notification-empty-icon">🔔</div>
        <div class="notification-empty-title">No ${filterText} ${typeText} notifications</div>
        <div class="notification-empty-text">You're all caught up! New notifications will appear here.</div>
      </div>
    `;
  }

  /**
   * Render grouped notifications
   */
  renderGroupedNotifications(grouped) {
    const groups = Object.entries(grouped);

    if (groups.length === 1 && groups[0][0] === "All") {
      // No grouping, render flat list
      return groups[0][1]
        .map((notif) => this.renderNotification(notif))
        .join("");
    }

    return groups
      .map(
        ([groupName, notifs]) => `
      <div class="notification-group">
        <div class="notification-group-header">${groupName}</div>
        <div class="notification-group-items">
          ${notifs.map((notif) => this.renderNotification(notif)).join("")}
        </div>
      </div>
    `,
      )
      .join("");
  }

  /**
   * Render single notification
   */
  renderNotification(notif) {
    const typeConfig =
      this.notificationTypes[notif.type] || this.notificationTypes.general;
    const isUnread = !notif.read;
    const isNew = notif.new || false;

    // Format time
    const time = this.formatTime(
      notif.created_at || notif.createdAt || notif.time,
    );

    // Escape HTML
    const escapeHtml = (text) => {
      const div = document.createElement("div");
      div.textContent = text;
      // Safe: Using textContent then reading innerHTML for escaping purposes only
      // eslint-disable-next-line no-restricted-syntax
      return div.innerHTML;
    };

    return `
      <div class="notification-item ${isUnread ? "unread" : "read"} ${isNew ? "new" : ""}" 
           data-id="${escapeHtml(String(notif.id))}"
           style="--notification-color: ${typeConfig.color}; --notification-bg: ${typeConfig.bgColor};">
        <div class="notification-icon" style="background: ${typeConfig.bgColor}; color: ${typeConfig.color};">
          ${typeConfig.icon}
        </div>
        <div class="notification-content">
          <div class="notification-title">
            ${escapeHtml(notif.title || notif.message || "Notification")}
            ${isNew ? '<span class="notification-new-badge">New</span>' : ""}
          </div>
          ${
            notif.title && notif.message
              ? `
            <div class="notification-message">${escapeHtml(notif.message)}</div>
          `
              : ""
          }
          <div class="notification-time">${time}</div>
        </div>
        ${
          isUnread
            ? `
          <button class="notification-mark-read" aria-label="Mark as read">
            <i data-lucide="x"></i>
          </button>
        `
            : ""
        }
      </div>
    `;
  }

  /**
   * Format time relative to now
   */
  formatTime(dateString) {
    if (!dateString) {
      return "";
    }

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return "Just now";
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id) {
    if (!this.notificationStore) {
      return;
    }

    try {
      await this.notificationStore.markOneRead(id);
      this.render();

      // Refresh badge
      await this.notificationStore.refreshBadge();
    } catch (error) {
      logger.warn("[NotificationCenter] Failed to mark as read:", error);
    }
  }

  /**
   * Mark all as read
   */
  async markAllAsRead() {
    if (!this.notificationStore) {
      return;
    }

    try {
      await this.notificationStore.markAllRead();
      this.render();

      // Refresh badge
      await this.notificationStore.refreshBadge();
    } catch (error) {
      logger.warn("[NotificationCenter] Failed to mark all as read:", error);
    }
  }

  /**
   * Toggle preferences panel
   */
  togglePreferences() {
    // TODO: Implement preferences panel
    logger.debug("[NotificationCenter] Preferences toggle");
  }

  /**
   * Play notification sound
   */
  playNotificationSound() {
    try {
      const audio = new Audio("/sounds/notification.mp3");
      audio.volume = 0.3;
      audio.play().catch((err) => {
        logger.debug("[NotificationCenter] Could not play sound:", err);
      });
    } catch (error) {
      logger.debug("[NotificationCenter] Sound not available:", error);
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
      this.realtimeSubscription = null;
    }
  }
}

// Create singleton instance
const enhancedNotificationCenter = new EnhancedNotificationCenter();

// Make available globally
window.enhancedNotificationCenter = enhancedNotificationCenter;

export default enhancedNotificationCenter;

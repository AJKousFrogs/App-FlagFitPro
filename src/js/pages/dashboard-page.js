// Dashboard Page JavaScript
// Handles all interactive elements on the dashboard

import { apiClient, API_ENDPOINTS } from "../../api-config.js";
import { authManager } from "../../auth-manager.js";
import { logger } from "../../logger.js";
import { escapeHtml } from "../utils/sanitize.js";
import { storageService } from "../services/storage-service-unified.js";
import { errorHandler } from "../utils/unified-error-handler.js";

/**
 * NotificationStore - Centralized notification state management
 * Manages notifications, unread count, loading state, and API calls
 */
class NotificationStore {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
    this.loading = false;
    this.error = null;
    this.listeners = new Set();
    this.lastOpenedAt = null;
  }

  /**
   * Subscribe to store changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of state changes
   */
  notify() {
    this.listeners.forEach((callback) => callback(this.getState()));
  }

  /**
   * Get current state
   */
  getState() {
    return {
      notifications: this.notifications,
      unreadCount: this.unreadCount,
      loading: this.loading,
      error: this.error,
    };
  }

  /**
   * Update state and notify listeners
   */
  setState(updates) {
    Object.assign(this, updates);
    this.notify();
  }

  /**
   * Calculate unread count from notifications
   */
  calculateUnreadCount() {
    return this.notifications.filter((n) => !n.read).length;
  }

  /**
   * Load notifications from API
   */
  async loadNotifications(options = {}) {
    this.setState({ loading: true, error: null });

    try {
      // Get last opened timestamp from store or API
      const lastOpenedAt = this.lastOpenedAt || null;

      const response = await apiClient.get(
        API_ENDPOINTS.dashboard.notifications,
        { ...options, lastOpenedAt },
      );

      let notifications = [];
      if (response && response.success && response.data) {
        if (Array.isArray(response.data)) {
          notifications = response.data;
        } else if (
          response.data.notifications &&
          Array.isArray(response.data.notifications)
        ) {
          notifications = response.data.notifications;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          notifications = response.data.data;
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
      logger.warn("Failed to load notifications:", error);
      this.setState({
        loading: false,
        error: error.message || "Failed to load notifications",
      });
      throw error;
    }
  }

  /**
   * Update last opened timestamp
   */
  async updateLastOpenedAt() {
    try {
      // Use query parameter for more reliable routing
      await apiClient.patch(
        `${API_ENDPOINTS.dashboard.notifications}?action=last-opened`,
      );
      this.lastOpenedAt = new Date().toISOString();
      this.notify();
    } catch (error) {
      logger.warn("Failed to update last opened timestamp:", error);
    }
  }

  /**
   * Mark a single notification as read (optimistic update)
   */
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
      // Use the API helper function for consistency
      const response = await apiClient.post(
        API_ENDPOINTS.dashboard.notifications,
        { notificationId: String(id) },
      );

      // Verify API response indicates success
      if (!response || response.success === false) {
        throw new Error(
          response?.error || "Failed to mark notification as read",
        );
      }

      // Success - state already updated optimistically
      // Refresh badge count to ensure consistency with server
      logger.debug("Notification marked as read successfully:", id);
      this.notify();
      return true;
    } catch (error) {
      // Revert optimistic update
      notification.read = previousState.read;
      this.unreadCount = previousUnreadCount;
      this.setState({ error: "Couldn't mark as read, please retry." });
      this.notify();

      // Show error toast with more details
      const errorMessage =
        error?.message || "Couldn't mark notification as read, please retry.";
      logger.error("Failed to mark notification as read:", error);

      if (window.ErrorHandler) {
        window.ErrorHandler.showError(errorMessage);
      } else {
        // Fallback: use console if ErrorHandler not available
        console.error("Notification error:", errorMessage);
      }

      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllRead() {
    const unreadNotifications = this.notifications.filter((n) => !n.read);
    if (unreadNotifications.length === 0) {
      logger.debug("No unread notifications to mark as read");
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
      // Use the API helper function for consistency
      const response = await apiClient.post(
        API_ENDPOINTS.dashboard.notifications,
        { notificationId: "all" },
      );

      // Verify API response indicates success
      if (!response || response.success === false) {
        throw new Error(
          response?.error || "Failed to mark all notifications as read",
        );
      }

      // Success - state already updated optimistically
      logger.debug(
        `Marked ${unreadNotifications.length} notifications as read successfully`,
      );
      this.notify();
      return true;
    } catch (error) {
      // Revert optimistic update
      this.notifications = previousState;
      this.unreadCount = previousUnreadCount;
      this.setState({ error: "Couldn't mark all as read, please retry." });
      this.notify();

      // Show error toast with more details
      const errorMessage =
        error?.message ||
        "Couldn't mark all notifications as read, please retry.";
      logger.error("Failed to mark all notifications as read:", error);

      if (window.ErrorHandler) {
        window.ErrorHandler.showError(errorMessage);
      } else {
        // Fallback: use console if ErrorHandler not available
        console.error("Notification error:", errorMessage);
      }

      throw error;
    }
  }

  /**
   * Refresh badge count from API
   */
  async refreshBadge() {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.dashboard.notificationsCount,
      );

      // Handle different response formats
      let count = 0;
      if (response) {
        if (response.success !== false && response.data) {
          count = response.data.unreadCount || response.data.count || 0;
        } else if (typeof response === "number") {
          count = response;
        } else if (response.unreadCount !== undefined) {
          count = response.unreadCount;
        }
      }

      // Update state
      this.unreadCount = count;
      logger.debug("Badge count refreshed from API:", count);
      this.notify();
      return count;
    } catch (error) {
      logger.warn("Failed to refresh badge count from API:", error);
      // Fallback to calculating from current notifications
      const calculatedCount = this.calculateUnreadCount();
      this.unreadCount = calculatedCount;
      this.notify();
      logger.debug(
        "Using calculated badge count as fallback:",
        calculatedCount,
      );
      return calculatedCount;
    }
  }
}

class DashboardPage {
  constructor() {
    // Initialize with today's date
    this.selectedDate = new Date();
    this.selectedDate.setHours(0, 0, 0, 0);

    // Initialize notification store
    this.notificationStore = new NotificationStore();

    this.wellnessData = {
      energy: null,
      sleep: null,
      mood: null,
      trainingLoad: null,
    };
    this.injuries = [];
    this.supplements = {
      "beta-alanine": { taken: false, time: null },
      caffeine: { taken: false, time: null },
      calcium: { taken: false, time: null },
      creatine: { taken: false, time: null },
      iron: { taken: false, time: null },
      magnesium: { taken: false, time: null },
      nitrate: { taken: false, time: null },
      protein: { taken: false, time: null },
      "vitamin-d": { taken: false, time: null },
    };
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.setupEventListeners();
        this.setupGlobalFunctions();
        this.setupNotificationStore();
        this.checkProfileCompletion();
      });
    } else {
      this.setupEventListeners();
      this.setupGlobalFunctions();
      this.setupNotificationStore();
      this.checkProfileCompletion();
    }
  }

  /**
   * Setup notification store subscription to update UI on state changes
   */
  setupNotificationStore() {
    // Subscribe to store changes
    this.notificationStore.subscribe((state) => {
      this.updateNotificationUI(state);
    });

    // Initial badge refresh
    this.refreshBadge();
  }

  /**
   * Update UI based on notification store state
   */
  updateNotificationUI(state) {
    const { notifications, unreadCount, loading, error } = state;

    // Update badge
    this.updateBadge(unreadCount);

    // Update panel if it's visible
    const panel = document.getElementById("notification-panel");
    if (panel && panel.classList.contains("is-open")) {
      if (loading) {
        this.showNotificationLoading();
      } else if (error) {
        this.showNotificationError(error);
      } else {
        this.renderNotifications(notifications);
      }
    }
  }

  /**
   * Show loading state in notification panel
   */
  showNotificationLoading() {
    const notificationList = document.getElementById("notification-list");
    if (!notificationList) return;

    notificationList.innerHTML = `
      <div class="notification-loading">
        <div class="notification-loading-spinner"></div>
        <div class="notification-loading-text">Loading notifications...</div>
      </div>
    `;
  }

  /**
   * Show error state in notification panel
   */
  showNotificationError(error) {
    const notificationList = document.getElementById("notification-list");
    if (!notificationList) return;

    notificationList.innerHTML = `
      <div class="notification-error">
        <div class="notification-error-icon">⚠️</div>
        <div class="notification-error-text">${escapeHtml(error)}</div>
        <button class="notification-retry-btn" onclick="window.dashboardPage?.loadNotifications()">
          Retry
        </button>
      </div>
    `;
  }

  /**
   * Update notification badge
   */
  updateBadge(count) {
    const badge = document.getElementById("notification-badge");
    const live = document.getElementById("notification-live");

    if (!badge || !live) return;

    if (count > 0) {
      badge.textContent = String(count);
      badge.hidden = false;
      live.textContent = `${count} new notification${count !== 1 ? "s" : ""}`;
    } else {
      badge.hidden = true;
      live.textContent = "No new notifications";
    }
  }

  /**
   * Refresh badge count from API
   */
  async refreshBadge() {
    try {
      const count = await this.notificationStore.refreshBadge();
      this.updateBadge(count);
    } catch (error) {
      logger.warn("Failed to refresh badge:", error);
      // Use count from store as fallback
      this.updateBadge(this.notificationStore.unreadCount);
    }
  }

  // Check if profile needs completion and show prompt (non-blocking)
  async checkProfileCompletion() {
    try {
      // Wait for auth manager to initialize
      await authManager.waitForInit();

      // Only check if user is authenticated
      if (!authManager.isAuthenticated()) {
        return;
      }

      // Dynamically import profile completion manager
      const { profileCompletionManager } =
        await import("../../profile-completion.js");

      // Check if profile needs completion
      if (profileCompletionManager.needsCompletion()) {
        // Show a non-blocking notification/banner instead of modal
        // This allows dashboard access while reminding to complete profile
        this.showProfileCompletionBanner();
      }
    } catch (error) {
      logger.warn("Could not check profile completion:", error);
      // Don't block dashboard access if check fails
    }
  }

  // Show a non-blocking banner for profile completion
  showProfileCompletionBanner() {
    // Check if banner already exists
    if (document.getElementById("profile-completion-banner")) {
      return;
    }

    const banner = document.createElement("div");
    banner.id = "profile-completion-banner";
    banner.className = "profile-completion-banner";
    banner.innerHTML = `
      <div class="profile-completion-banner-content">
        <div class="profile-completion-banner-icon">
          <i data-lucide="alert-circle" class="icon-20"></i>
        </div>
        <div class="profile-completion-banner-text">
          <strong>Complete Your Profile</strong>
          <span>Finish setting up your account to get the most out of FlagFit Pro.</span>
        </div>
        <div class="profile-completion-banner-actions">
          <button class="btn btn-primary btn-sm" id="complete-profile-btn">
            Complete Profile
          </button>
          <button class="btn btn-secondary btn-sm" id="dismiss-profile-banner" aria-label="Dismiss">
            <i data-lucide="x" class="icon-16"></i>
          </button>
        </div>
      </div>
    `;

    // Add styles if not already present
    if (!document.getElementById("profile-completion-banner-styles")) {
      const style = document.createElement("style");
      style.id = "profile-completion-banner-styles";
      style.textContent = `
        .profile-completion-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(135deg, #089949 0%, #0d7a3d 100%);
          color: white;
          padding: 12px 20px;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          animation: slideDown 0.3s ease-out;
        }
        .profile-completion-banner-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .profile-completion-banner-icon {
          flex-shrink: 0;
        }
        .profile-completion-banner-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .profile-completion-banner-text strong {
          font-weight: 600;
          font-size: 14px;
        }
        .profile-completion-banner-text span {
          font-size: 12px;
          opacity: 0.9;
        }
        .profile-completion-banner-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .btn-sm {
          padding: 6px 12px;
          font-size: 13px;
        }
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @media (max-width: 768px) {
          .profile-completion-banner-content {
            flex-wrap: wrap;
          }
          .profile-completion-banner-text {
            flex-basis: 100%;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Insert banner at the top of the body
    document.body.insertBefore(banner, document.body.firstChild);

    // Initialize Lucide icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons(banner);
    }

    // Add event listeners
    const completeBtn = document.getElementById("complete-profile-btn");
    const dismissBtn = document.getElementById("dismiss-profile-banner");

    if (completeBtn) {
      completeBtn.addEventListener("click", async () => {
        const { profileCompletionManager } =
          await import("../../profile-completion.js");
        profileCompletionManager.showProfileCompletionModal(false); // false = not required, can skip
        this.hideProfileCompletionBanner();
      });
    }

    if (dismissBtn) {
      dismissBtn.addEventListener("click", () => {
        this.hideProfileCompletionBanner();
        // Store dismissal to not show again for this session
        sessionStorage.setItem("profile-banner-dismissed", "true");
      });
    }

    // Adjust main content padding to account for banner
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      mainContent.style.paddingTop = "60px";
    }
  }

  hideProfileCompletionBanner() {
    const banner = document.getElementById("profile-completion-banner");
    if (banner) {
      banner.style.animation = "slideUp 0.3s ease-out";
      setTimeout(() => {
        banner.remove();
        // Remove padding adjustment
        const mainContent = document.querySelector(".main-content");
        if (mainContent) {
          mainContent.style.paddingTop = "";
        }
      }, 300);
    }

    // Add slideUp animation if not present
    if (!document.getElementById("profile-completion-banner-animations")) {
      const style = document.createElement("style");
      style.id = "profile-completion-banner-animations";
      style.textContent = `
        @keyframes slideUp {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  setupGlobalFunctions() {
    // Make toggleSidebar globally available for onclick handlers
    window.toggleSidebar = () => this.toggleSidebar();
    window.toggleNotifications = () => this.toggleNotifications();
    window.markAllAsRead = () => this.markAllAsRead();

    // Make dashboardPage and notificationStore globally available
    window.dashboardPage = this;
    window.notificationStore = this.notificationStore;

    // Make getNotificationCount available globally
    window.getNotificationCount = async () => {
      try {
        const count = await this.notificationStore.refreshBadge();
        return count;
      } catch (error) {
        logger.warn("Failed to get notification count:", error);
        return this.notificationStore.unreadCount || 0;
      }
    };

    // Clean up click-outside handler on page unload
    window.addEventListener("beforeunload", () => {
      this.removeClickOutsideHandler();
    });
  }

  toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const toggleBtn = document.getElementById("mobile-menu-toggle");

    if (!sidebar) {
      return;
    }

    const isOpen =
      sidebar.classList.contains("open") ||
      sidebar.classList.contains("mobile-open");

    if (isOpen) {
      sidebar.classList.remove("open", "mobile-open");
      if (overlay) {
        overlay.classList.remove("active");
      }
      document.body.classList.remove("sidebar-open", "menu-open");
      if (toggleBtn) {
        toggleBtn.setAttribute("aria-expanded", "false");
      }
    } else {
      sidebar.classList.add("open", "mobile-open");
      if (overlay) {
        overlay.classList.add("active");
      }
      document.body.classList.add("sidebar-open", "menu-open");
      if (toggleBtn) {
        toggleBtn.setAttribute("aria-expanded", "true");
      }
    }
  }

  toggleNotifications() {
    const panel = document.getElementById("notification-panel");
    const bell = document.getElementById("notification-bell");

    if (!panel || !bell) {
      return;
    }

    const isOpen = panel.classList.contains("is-open");

    if (isOpen) {
      this.closeNotificationPanel();
    } else {
      this.openNotificationPanel();
    }
  }

  /**
   * Open notification panel
   */
  async openNotificationPanel() {
    const panel = document.getElementById("notification-panel");
    const bell = document.getElementById("notification-bell");

    if (!panel || !bell) return;

    panel.classList.add("is-open");
    bell.setAttribute("aria-expanded", "true");

    // Update last opened timestamp
    await this.notificationStore.updateLastOpenedAt();

    // Load notifications
    this.loadNotifications();

    // Add click-outside handler
    this.setupClickOutsideHandler();
  }

  /**
   * Close notification panel
   */
  closeNotificationPanel() {
    const panel = document.getElementById("notification-panel");
    const bell = document.getElementById("notification-bell");

    if (!panel || !bell) return;

    panel.classList.remove("is-open");
    bell.setAttribute("aria-expanded", "false");

    // Remove click-outside handler
    this.removeClickOutsideHandler();
  }

  /**
   * Setup click-outside handler to close panel
   */
  setupClickOutsideHandler() {
    // Remove existing handler if any
    this.removeClickOutsideHandler();

    // Create new handler
    this.clickOutsideHandler = (e) => {
      const panel = document.getElementById("notification-panel");
      const bell = document.getElementById("notification-bell");

      if (!panel || !bell) return;

      // Check if click is outside panel and not on bell
      const clickedPanel = panel.contains(e.target);
      const clickedBell = bell.contains(e.target) || bell === e.target;

      if (!clickedPanel && !clickedBell) {
        this.closeNotificationPanel();
      }
    };

    // Add handler with slight delay to avoid immediate closure
    setTimeout(() => {
      document.addEventListener("click", this.clickOutsideHandler);
    }, 0);
  }

  /**
   * Remove click-outside handler
   */
  removeClickOutsideHandler() {
    if (this.clickOutsideHandler) {
      document.removeEventListener("click", this.clickOutsideHandler);
      this.clickOutsideHandler = null;
    }
  }

  /**
   * Load notifications using the store
   */
  async loadNotifications() {
    try {
      await this.notificationStore.loadNotifications();
      // UI will update automatically via store subscription
    } catch (error) {
      // Error handling is done in the store
      // For development, you might want to show mock data
      if (
        error.isConnectionRefused ||
        (error.isNetworkError &&
          error.message &&
          error.message.includes("Failed to fetch"))
      ) {
        // Silently fall back to mock data in development
        logger.debug("Using mock notifications in development");
        this.renderNotifications(this.getMockNotifications());
      }
    }
  }

  getMockNotifications() {
    return [
      {
        id: 1,
        type: "training",
        title: "Training Session Reminder",
        message: "Speed & Agility training starts in 30 minutes",
        time: "5 minutes ago",
        read: false,
      },
      {
        id: 2,
        type: "achievement",
        title: "New Achievement Unlocked",
        message: "You've completed 10 training sessions this month!",
        time: "1 hour ago",
        read: false,
      },
      {
        id: 3,
        type: "team",
        title: "Team Update",
        message: "New team member joined: Alex Johnson",
        time: "2 hours ago",
        read: false,
      },
    ];
  }

  renderNotifications(notifications) {
    const notificationList = document.getElementById("notification-list");
    if (!notificationList) {
      return;
    }

    // Ensure notifications is an array
    if (!Array.isArray(notifications)) {
      logger.warn(
        "renderNotifications called with non-array data:",
        notifications,
      );
      notifications = [];
    }

    if (notifications.length === 0) {
      notificationList.innerHTML = `
        <div class="notification-empty">
          <div class="notification-empty-icon">🔔</div>
          <div class="notification-empty-title">No notifications yet</div>
          <div class="notification-empty-text">You're all caught up! New notifications will appear here.</div>
        </div>
      `;
      return;
    }

    notificationList.innerHTML = notifications
      .map(
        (notif) => `
      <div class="notification-item ${notif.read ? "read" : ""} ${notif.new ? "new" : ""}" data-id="${escapeHtml(notif.id)}">
        <div class="notification-icon">${this.getNotificationIcon(notif.type)}</div>
        <div class="notification-content">
          <div class="notification-title">
            ${escapeHtml(notif.title)}
            ${notif.new ? '<span class="notification-new-badge">New</span>' : ""}
          </div>
          <div class="notification-message">${escapeHtml(notif.message)}</div>
          <div class="notification-time">${escapeHtml(notif.time)}</div>
        </div>
        ${!notif.read ? '<button class="notification-mark-read" aria-label="Mark as read">×</button>' : ""}
      </div>
    `,
      )
      .join("");

    // Add click handlers for mark as read
    notificationList
      .querySelectorAll(".notification-mark-read")
      .forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const item = btn.closest(".notification-item");
          const id = item.dataset.id;
          this.markNotificationAsRead(id);
        });
      });
  }

  getNotificationIcon(type) {
    const icons = {
      training: "🏃",
      achievement: "🏆",
      team: "👥",
      wellness: "💚",
      default: "🔔",
    };
    return icons[type] || icons.default;
  }

  /**
   * Mark a notification as read (with optimistic update and API call)
   */
  async markNotificationAsRead(id) {
    try {
      await this.notificationStore.markOneRead(id);
      // UI will update automatically via store subscription
      // Also refresh badge to ensure consistency with server state
      await this.refreshBadge();
      // Reload notifications to sync with server state
      await this.loadNotifications();
    } catch (error) {
      // Error handling is done in the store (shows toast)
      logger.warn("Failed to mark notification as read:", error);
      // Still refresh badge to sync with server state even on error
      await this.refreshBadge();
    }
  }

  /**
   * Mark all notifications as read (with optimistic update and API call)
   */
  async markAllAsRead() {
    try {
      await this.notificationStore.markAllRead();
      // UI will update automatically via store subscription
      // Also refresh badge to ensure consistency with server state
      await this.refreshBadge();
      // Reload notifications to sync with server state
      await this.loadNotifications();
    } catch (error) {
      // Error handling is done in the store (shows toast)
      logger.warn("Failed to mark all notifications as read:", error);
      // Still refresh badge to sync with server state even on error
      await this.refreshBadge();
    }
  }

  setupEventListeners() {
    // Date Picker Setup
    this.setupDatePicker();

    // Wellness Check-in Sliders
    this.setupWellnessSliders();

    // Wellness Submit Button
    const submitBtn = document.querySelector(".btn-submit-checkin");
    if (submitBtn) {
      submitBtn.addEventListener("click", (e) => this.handleWellnessSubmit(e));
    }

    // Injury Tracking Setup
    this.setupInjuryTracking();

    // Training Session Start Button
    const startSessionBtn = document.querySelector(".btn-start-session");
    if (startSessionBtn) {
      logger.debug("✅ Found START SESSION button, attaching event listener");
      startSessionBtn.addEventListener("click", (e) => {
        logger.debug("🖱️ START SESSION button clicked");
        this.handleStartSession(e);
      });
    } else {
      logger.warn("⚠️ START SESSION button not found!");
    }

    // Supplement Buttons
    this.setupSupplementButtons();

    // AI Chat Assistant Button
    const aiChatBtn = document.querySelector(".ai-chat-button");
    if (aiChatBtn) {
      aiChatBtn.addEventListener("click", (e) => this.handleAIChat(e));
    }

    // Settings Button in Header
    const settingsBtn = document.querySelector(
      ".header-icon[aria-label='Settings']",
    );
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        window.location.href = "/settings.html";
      });
    }

    // Sidebar Overlay Click Handler
    const sidebarOverlay = document.getElementById("sidebar-overlay");
    if (sidebarOverlay) {
      sidebarOverlay.addEventListener("click", () => this.toggleSidebar());
    }

    // Load data for selected date
    this.loadDateData();

    // Load notifications on page load
    this.loadNotifications();
  }

  setupWellnessSliders() {
    const sliders = [
      { id: "energy-slider", key: "energy" },
      { id: "sleep-slider", key: "sleep" },
      { id: "mood-slider", key: "mood" },
      { id: "training-load-slider", key: "trainingLoad" },
    ];

    sliders.forEach(({ id, key }) => {
      const slider = document.getElementById(id);
      const valueDisplay = slider?.parentElement.querySelector(".slider-value");

      if (slider && valueDisplay) {
        // Update display on change
        slider.addEventListener("input", (e) => {
          const value = e.target.value;
          valueDisplay.textContent = value;
          this.wellnessData[key] = parseInt(value);
        });

        // Initialize display
        valueDisplay.textContent = slider.value;
        this.wellnessData[key] = parseInt(slider.value);
      }
    });
  }

  async handleWellnessSubmit(e) {
    e.preventDefault();
    const button = e.target;
    const originalText = button.textContent;

    // Disable button and show loading state
    button.disabled = true;
    button.textContent = "Submitting...";
    button.style.opacity = "0.7";

    try {
      // Get current user
      const user = authManager.getCurrentUser();

      // Check if we're in development mode
      const isDevelopment =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (!user && !isDevelopment) {
        throw new Error("User not authenticated");
      }

      if (!user && isDevelopment) {
        logger.debug(
          "Development mode: Submitting wellness check-in without authentication",
        );
      }

      // Prepare wellness data for selected date
      const dateStr = this.formatDateForInput(this.selectedDate);
      const wellnessCheckIn = {
        userId: user ? user.id || user.email : "demo-user",
        date: dateStr,
        energy: this.wellnessData.energy,
        sleep: this.wellnessData.sleep,
        mood: this.wellnessData.mood,
        trainingLoad: this.wellnessData.trainingLoad,
        timestamp: new Date().toISOString(),
      };

      // Save to API (or localStorage for demo)
      try {
        await apiClient.post(API_ENDPOINTS.wellness.checkin, wellnessCheckIn);
        logger.success("Wellness check-in submitted successfully");
      } catch (apiError) {
        // Fallback to localStorage for demo/testing
        logger.warn("API unavailable, saving to localStorage:", apiError);
        const saved = storageService.get("wellnessCheckIns", [], {
          usePrefix: false,
        });
        // Remove existing entry for this date
        const filtered = saved.filter((w) => w.date !== dateStr);
        filtered.push(wellnessCheckIn);
        storageService.set("wellnessCheckIns", filtered, { usePrefix: false });
      }

      // Show success message
      this.showNotification(
        "Wellness check-in submitted successfully! ✓",
        "success",
      );

      // Reset button after delay
      setTimeout(() => {
        button.disabled = false;
        button.textContent = originalText;
        button.style.opacity = "1";
      }, 1500);
    } catch (error) {
      logger.error("Failed to submit wellness check-in:", error);
      this.showNotification(
        "Failed to submit check-in. Please try again.",
        "error",
      );

      // Reset button
      button.disabled = false;
      button.textContent = originalText;
      button.style.opacity = "1";
    }
  }

  async handleStartSession(e) {
    e.preventDefault();
    e.stopPropagation();
    logger.debug("🚀 handleStartSession called");

    try {
      // Handle case where button might be inside a label or wrapper
      const button = e.target.closest(".btn-start-session") || e.target;
      if (!button || !button.classList.contains("btn-start-session")) {
        logger.error("❌ Could not find button element");
        return;
      }

      const originalText = button.textContent;

      // Disable button and show loading state
      button.disabled = true;
      button.textContent = "Starting...";
      button.style.opacity = "0.7";

      // Get current user
      const user = authManager.getCurrentUser();
      if (!user) {
        logger.warn("⚠️ User not authenticated, using demo mode");
        // Continue with demo mode instead of throwing error
      }

      // Get training session details
      const trainingTime =
        document.querySelector(".training-time")?.textContent || "18:30";
      const trainingType = trainingTime.includes("Speed & Agility")
        ? "Speed & Agility"
        : "Training";
      const coach =
        document.querySelector(".training-info")?.textContent ||
        "Coach: Ales Zaksek";

      const sessionData = {
        userId: user ? user.id || user.email : "demo-user",
        sessionType: trainingType,
        coach: coach.replace("Coach: ", ""),
        startTime: new Date().toISOString(),
        scheduledTime: trainingTime,
      };

      logger.debug("📝 Session data:", sessionData);

      // Save session start
      try {
        await apiClient.post("/api/training/start-session", sessionData);
        logger.success("Training session started");
      } catch (apiError) {
        // Fallback to localStorage
        logger.warn("API unavailable, saving to localStorage:", apiError);
        const saved = storageService.get("trainingSessions", [], {
          usePrefix: false,
        });
        saved.push({ ...sessionData, status: "in_progress" });
        storageService.set("trainingSessions", saved, { usePrefix: false });
      }

      // Store session data for training-schedule page
      const sessionDate = this.formatDateForInput(this.selectedDate);
      storageService.set(
        "currentTrainingSession",
        {
          ...sessionData,
          date: sessionDate,
          status: "in_progress",
        },
        { usePrefix: false },
      );

      // Show success and redirect to training schedule page
      this.showNotification(
        "Training session started! Redirecting...",
        "success",
      );

      // Redirect to training schedule page with date parameter
      setTimeout(() => {
        logger.debug("🔄 Redirecting to training schedule page");
        const dateParam = sessionDate;
        const sessionParam = encodeURIComponent(sessionData.sessionType);
        window.location.href = `/training.html?date=${dateParam}&session=${sessionParam}#schedule`;
      }, 1000);
    } catch (error) {
      logger.error("❌ Failed to start training session:", error);
      console.error("Start session error:", error);
      this.showNotification(
        "Failed to start session. Please try again.",
        "error",
      );

      // Reset button
      const button = e.target.closest(".btn-start-session") || e.target;
      if (button) {
        button.disabled = false;
        button.textContent = "START SESSION";
        button.style.opacity = "1";
      }
    }
  }

  setupSupplementButtons() {
    const supplementItems = document.querySelectorAll(".supplement-item");

    supplementItems.forEach((item) => {
      const supplementKey = item.getAttribute("data-supplement");
      const toggleInput = item.querySelector(".supplement-toggle-input");

      if (!toggleInput || !supplementKey) {
        return;
      }

      // Load saved state
      const savedState = storageService.get("supplements", null, {
        usePrefix: false,
      });
      if (savedState) {
        if (savedState[supplementKey]?.taken) {
          toggleInput.checked = true;
        }
      }

      // Handle toggle change
      toggleInput.addEventListener("change", (e) => {
        this.handleSupplementToggle(e, supplementKey);
      });
    });
  }

  async handleSupplementToggle(e, supplementKey) {
    const toggleInput = e.target;
    const isChecked = toggleInput.checked;
    const now = new Date();

    try {
      // Wait for auth manager to initialize
      await authManager.waitForInit();

      // Get current user (may be null if not authenticated)
      const user = authManager.getCurrentUser();

      // Get supplement display name
      const supplementItem = toggleInput.closest(".supplement-item");
      const supplementName =
        supplementItem?.querySelector(".supplement-name")?.textContent.trim() ||
        supplementKey;

      // Update supplement state
      this.supplements[supplementKey] = {
        taken: isChecked,
        time: isChecked ? now.toISOString() : null,
      };

      // Save to API or localStorage for selected date
      const dateStr = this.formatDateForInput(this.selectedDate);

      // Use user ID if available, otherwise use a fallback identifier
      const userId = user
        ? user.id || user.email
        : storageService.get("userId", "anonymous", { usePrefix: false });

      const supplementData = {
        userId: userId,
        supplement: supplementKey,
        supplementName: supplementName,
        date: dateStr,
        taken: isChecked,
        timestamp: isChecked ? now.toISOString() : null,
      };

      // Try API only if user is authenticated
      if (user) {
        try {
          if (isChecked) {
            await apiClient.post(API_ENDPOINTS.supplements.log, supplementData);
            logger.success(`Logged ${supplementName} intake`);
            this.showNotification(`${supplementName} logged! ✓`, "success");
          } else {
            // Optionally handle "untaken" action
            await apiClient.post(API_ENDPOINTS.supplements.log, {
              ...supplementData,
              action: "untake",
            });
            logger.info(`Unmarked ${supplementName}`);
          }
          return; // Successfully saved to API, exit early
        } catch (apiError) {
          logger.warn("API unavailable, saving to localStorage:", apiError);
          // Fall through to localStorage save
        }
      } else {
        logger.debug("User not authenticated, saving to localStorage");
      }

      // Fallback to localStorage (for unauthenticated users or API failures)
      const saved = storageService.get("supplementLogs", [], {
        usePrefix: false,
      });

      // Remove existing entry for this supplement on selected date
      const filtered = saved.filter((log) => {
        const logDate =
          log.date ||
          (log.timestamp
            ? new Date(log.timestamp).toISOString().split("T")[0]
            : null);
        return !(log.supplement === supplementKey && logDate === dateStr);
      });

      if (isChecked) {
        filtered.push(supplementData);
      }

      storageService.set("supplementLogs", filtered, { usePrefix: false });

      if (isChecked) {
        this.showNotification(`${supplementName} logged! ✓`, "success");
      }

      // State is now managed per-date, no need to save global state
    } catch (error) {
      logger.error("Failed to log supplement:", error);
      this.showNotification(
        "Failed to log supplement. Please try again.",
        "error",
      );

      // Revert toggle on error
      toggleInput.checked = !isChecked;
    }
  }

  async handleAIChat(e) {
    e.preventDefault();

    const chatButton = e.target.closest(".ai-chat-button") || e.target;

    // Add visual feedback
    chatButton.style.transform = "scale(0.95)";
    setTimeout(() => {
      chatButton.style.transform = "scale(1)";
    }, 150);

    // Open the chatbot modal
    try {
      // Import and open chatbot
      const chatbotModule = await import("../components/chatbot.js");
      const { flagFitChatbot } = chatbotModule;

      if (flagFitChatbot && typeof flagFitChatbot.open === "function") {
        flagFitChatbot.open();
      } else {
        throw new Error("Chatbot module not properly initialized");
      }
    } catch (error) {
      logger.error("Failed to load chatbot:", error);
      logger.error("Chatbot error details:", error);

      // Try to use global chatbot if available
      if (
        window.flagFitChatbot &&
        typeof window.flagFitChatbot.open === "function"
      ) {
        window.flagFitChatbot.open();
      } else {
        // Last resort: show alert
        alert(
          "AI Assistant Chat\n\nAsk me about:\n• Sports psychology & mental training\n• Nutrition & supplements\n• Speed & agility development\n• Injury prevention & treatment\n• Recovery strategies\n• Training programs",
        );
      }
    }
  }

  setupDatePicker() {
    const datePicker = document.getElementById("dashboard-date-picker");
    const prevBtn = document.getElementById("prev-day-btn");
    const nextBtn = document.getElementById("next-day-btn");
    const todayBtn = document.getElementById("today-btn");

    if (!datePicker) {
      return;
    }

    // Initialize date picker with today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.selectedDate = today;
    datePicker.value = this.formatDateForInput(today);
    this.updateDateStatus();

    // Date picker change handler
    datePicker.addEventListener("change", (e) => {
      const selectedDate = new Date(e.target.value);
      selectedDate.setHours(0, 0, 0, 0);
      this.selectedDate = selectedDate;
      this.updateDateStatus();
      this.loadDateData();
    });

    // Previous day button
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        const prevDate = new Date(this.selectedDate);
        prevDate.setDate(prevDate.getDate() - 1);
        this.selectedDate = prevDate;
        datePicker.value = this.formatDateForInput(prevDate);
        this.updateDateStatus();
        this.loadDateData();
      });
    }

    // Next day button
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        const nextDate = new Date(this.selectedDate);
        nextDate.setDate(nextDate.getDate() + 1);
        this.selectedDate = nextDate;
        datePicker.value = this.formatDateForInput(nextDate);
        this.updateDateStatus();
        this.loadDateData();
      });
    }

    // Today button
    if (todayBtn) {
      todayBtn.addEventListener("click", () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        this.selectedDate = today;
        datePicker.value = this.formatDateForInput(today);
        this.updateDateStatus();
        this.loadDateData();
      });
    }
  }

  formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  formatDateForDisplay(date) {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  }

  isToday(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  }

  isFuture(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() > today.getTime();
  }

  updateDateStatus() {
    const indicator = document.getElementById("date-indicator");
    const info = document.getElementById("date-info");

    if (!indicator || !info) {
      return;
    }

    const isToday = this.isToday(this.selectedDate);
    const isFuture = this.isFuture(this.selectedDate);

    // Update indicator
    indicator.className = "date-indicator";
    if (isToday) {
      indicator.textContent = "Today";
      indicator.classList.add("today-indicator");
    } else if (isFuture) {
      indicator.textContent = "Future";
      indicator.classList.add("future-indicator");
    } else {
      indicator.textContent = "Historical";
      indicator.classList.add("past-indicator");
    }

    // Update info with formatted date
    const daysDiff = this.getDaysDifference(this.selectedDate);
    let dateText = this.formatDateForDisplay(this.selectedDate);

    if (!isToday && !isFuture) {
      if (daysDiff === 1) {
        dateText += " (Yesterday)";
      } else if (daysDiff > 1) {
        dateText += ` (${daysDiff} days ago)`;
      }
    }

    info.textContent = dateText;
    info.className = "date-info";
  }

  getDaysDifference(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  async loadDateData() {
    const dateStr = this.formatDateForInput(this.selectedDate);

    try {
      const info = document.getElementById("date-info");
      const originalText = info ? info.textContent : "";

      // Show loading state
      this.showDateLoadingState(true);

      // Load wellness data for selected date
      const wellnessLoaded = await this.loadWellnessForDate(dateStr);

      // Load supplements for selected date
      const supplementsLoaded = await this.loadSupplementsForDate(dateStr);

      // Restore date status first (includes date text)
      this.updateDateStatus();

      // Then update with data status
      this.updateDateDataStatus(wellnessLoaded, supplementsLoaded);

      // Hide loading state
      this.showDateLoadingState(false);
    } catch (error) {
      logger.error("Failed to load date data:", error);
      this.updateDateStatus(); // Restore date status on error
      this.showDateLoadingState(false);
    }
  }

  showDateLoadingState(loading) {
    const info = document.getElementById("date-info");
    if (info) {
      if (loading) {
        info.classList.add("loading");
        // Don't overwrite text, just add loading class
      } else {
        info.classList.remove("loading");
      }
    }
  }

  updateDateDataStatus(wellnessLoaded, supplementsLoaded) {
    const info = document.getElementById("date-info");
    if (!info) {
      return;
    }

    const hasWellness =
      wellnessLoaded &&
      Object.values(this.wellnessData).some((v) => v !== null);
    const hasSupplements =
      supplementsLoaded && Object.values(this.supplements).some((s) => s.taken);

    // Remove any existing status classes
    info.classList.remove("has-data", "no-data");

    // Update info with data status
    let statusText = "";
    if (hasWellness && hasSupplements) {
      statusText = " • Complete";
      info.classList.add("has-data");
    } else if (hasWellness || hasSupplements) {
      statusText = " • Partial";
      info.classList.add("has-data");
    } else {
      statusText = " • No data";
      info.classList.add("no-data");
    }

    // Preserve the date display text (from updateDateStatus) and append status
    // Remove any existing status text first
    let currentText = info.textContent;
    const statusMatch = currentText.match(/^(.+?)(\s•\s.+)$/);
    if (statusMatch) {
      currentText = statusMatch[1]; // Keep only the date part
    }

    // Append new status
    info.textContent = currentText + statusText;
  }

  async loadWellnessForDate(dateStr) {
    try {
      const user = authManager.getCurrentUser();
      if (!user) {
        return false;
      }

      // Try API first
      try {
        const response = await apiClient.get(API_ENDPOINTS.wellness.checkin, {
          date: dateStr,
        });
        if (response && response.data) {
          const wellness = response.data;
          this.wellnessData = {
            energy: wellness.energy || null,
            sleep: wellness.sleep || null,
            mood: wellness.mood || null,
            trainingLoad: wellness.trainingLoad || null,
          };
          this.updateWellnessUI();
          return true; // Data loaded
        }
      } catch (apiError) {
        // Fallback to localStorage
        logger.warn("API unavailable, loading from localStorage:", apiError);
      }

      // Load from localStorage
      const saved = storageService.get("wellnessCheckIns", [], {
        usePrefix: false,
      });
      const wellnessForDate = saved.find((w) => w.date === dateStr);

      if (wellnessForDate) {
        this.wellnessData = {
          energy: wellnessForDate.energy || null,
          sleep: wellnessForDate.sleep || null,
          mood: wellnessForDate.mood || null,
          trainingLoad: wellnessForDate.trainingLoad || null,
        };
        this.updateWellnessUI();
        return true; // Data loaded
      } else {
        // No data for this date - set to null
        this.wellnessData = {
          energy: null,
          sleep: null,
          mood: null,
          trainingLoad: null,
        };
        this.updateWellnessUI();
        return false; // No data found
      }
    } catch (error) {
      logger.error("Failed to load wellness for date:", error);
      // Set to null on error
      this.wellnessData = {
        energy: null,
        sleep: null,
        mood: null,
        trainingLoad: null,
      };
      this.updateWellnessUI();
      return false;
    }
  }

  updateWellnessUI() {
    const sliders = [
      { id: "energy-slider", key: "energy" },
      { id: "sleep-slider", key: "sleep" },
      { id: "mood-slider", key: "mood" },
      { id: "training-load-slider", key: "trainingLoad" },
    ];

    sliders.forEach(({ id, key }) => {
      const slider = document.getElementById(id);
      const valueDisplay = slider?.parentElement.querySelector(".slider-value");
      if (slider && valueDisplay) {
        const value = this.wellnessData[key];
        if (value !== null && value !== undefined) {
          slider.value = value;
          valueDisplay.textContent = value;
        } else {
          // Reset to default midpoint if no data
          slider.value = 5;
          valueDisplay.textContent = "—";
        }
      }
    });
  }

  async loadSupplementsForDate(dateStr) {
    try {
      const user = authManager.getCurrentUser();
      if (!user) {
        return false;
      }

      // Reset all supplements to false
      Object.keys(this.supplements).forEach((key) => {
        this.supplements[key] = { taken: false, time: null };
      });

      let hasData = false;

      // Try API first
      try {
        const response = await apiClient.get(API_ENDPOINTS.supplements.log, {
          date: dateStr,
        });
        if (response && response.data && Array.isArray(response.data)) {
          response.data.forEach((log) => {
            if (log.supplement && this.supplements[log.supplement]) {
              this.supplements[log.supplement] = {
                taken: log.taken || false,
                time: log.timestamp || null,
              };
              if (log.taken) {
                hasData = true;
              }
            }
          });
          this.updateSupplementsUI();
          return hasData;
        }
      } catch (apiError) {
        // Fallback to localStorage
        logger.warn("API unavailable, loading from localStorage:", apiError);
      }

      // Load from localStorage
      const saved = storageService.get("supplementLogs", [], {
        usePrefix: false,
      });
      const supplementsForDate = saved.filter((s) => {
        const logDate =
          s.date ||
          (s.timestamp
            ? new Date(s.timestamp).toISOString().split("T")[0]
            : null);
        return logDate === dateStr && s.taken;
      });

      supplementsForDate.forEach((log) => {
        if (log.supplement && this.supplements[log.supplement]) {
          this.supplements[log.supplement] = {
            taken: true,
            time: log.timestamp || null,
          };
          hasData = true;
        }
      });

      this.updateSupplementsUI();
      return hasData;
    } catch (error) {
      logger.error("Failed to load supplements for date:", error);
      // Reset all to false on error
      Object.keys(this.supplements).forEach((key) => {
        this.supplements[key] = { taken: false, time: null };
      });
      this.updateSupplementsUI();
      return false;
    }
  }

  updateSupplementsUI() {
    const supplementItems = document.querySelectorAll(".supplement-item");
    supplementItems.forEach((item) => {
      const supplementKey = item.getAttribute("data-supplement");
      const toggleInput = item.querySelector(".supplement-toggle-input");

      if (toggleInput && supplementKey && this.supplements[supplementKey]) {
        toggleInput.checked = this.supplements[supplementKey].taken || false;
      }
    });
  }

  loadSavedData() {
    // This method is now replaced by loadDateData()
    // Keeping for backward compatibility but redirecting to loadDateData
    this.loadDateData();
  }

  showNotification(message, type = "info") {
    // Use unified error handler for consistent notifications
    if (type === "success") {
      errorHandler.showSuccess(message);
    } else if (type === "error") {
      errorHandler.showError(message);
    } else if (type === "warning") {
      errorHandler.showWarning(message);
    } else {
      errorHandler.showInfo(message);
    }

    // Legacy notification code kept as fallback
    return;

    // Create notification element
    const notification = document.createElement("div");
    notification.className = `dashboard-notification dashboard-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6"};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
      max-width: 300px;
    `;

    // Add animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    if (!document.getElementById("dashboard-notification-styles")) {
      style.id = "dashboard-notification-styles";
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  setupInjuryTracking() {
    // Setup injury form toggle
    const addBtn = document.getElementById("btn-add-injury");
    const cancelBtn = document.getElementById("btn-cancel-injury");
    const injuryForm = document.getElementById("injury-form");

    if (addBtn && injuryForm) {
      addBtn.addEventListener("click", () => {
        injuryForm.style.display =
          injuryForm.style.display === "none" ? "block" : "none";
        addBtn.style.display =
          injuryForm.style.display === "none" ? "flex" : "none";
      });
    }

    if (cancelBtn && injuryForm) {
      cancelBtn.addEventListener("click", () => {
        injuryForm.style.display = "none";
        addBtn.style.display = "flex";
        injuryForm.reset();
      });
    }

    // Setup severity slider
    const severitySlider = document.getElementById("injury-severity");
    const severityValue =
      severitySlider?.parentElement.querySelector(".severity-value");
    if (severitySlider && severityValue) {
      severitySlider.addEventListener("input", (e) => {
        severityValue.textContent = e.target.value;
      });
      severityValue.textContent = severitySlider.value;
    }

    // Setup injury form submission
    if (injuryForm) {
      injuryForm.addEventListener("submit", (e) => this.handleInjurySubmit(e));
    }

    // Set default date to today
    const injuryDateInput = document.getElementById("injury-date");
    if (injuryDateInput) {
      injuryDateInput.value = this.formatDateForInput(new Date());
    }

    // Load existing injuries
    this.loadInjuries();
  }

  async handleInjurySubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const injuryData = {
      type: formData.get("injuryType"),
      severity: parseInt(formData.get("severity")),
      description: formData.get("description"),
      status: formData.get("status"),
      startDate: formData.get("startDate"),
    };

    const button = form.querySelector(".btn-submit-injury");
    const originalText = button.textContent;

    // Disable button and show loading
    button.disabled = true;
    button.innerHTML =
      '<i data-lucide="loader-2" class="icon-16 icon-inline"></i> Saving...';

    try {
      const user = authManager.getCurrentUser();
      const isDevelopment =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (!user && !isDevelopment) {
        throw new Error("User not authenticated");
      }

      const injuryRecord = {
        userId: user ? user.id || user.email : "demo-user",
        ...injuryData,
        createdAt: new Date().toISOString(),
      };

      // Save to API
      try {
        await apiClient.post(API_ENDPOINTS.wellness.injuries, injuryRecord);
        logger.success("Injury report saved successfully");
      } catch (apiError) {
        // Fallback to localStorage
        logger.warn("API unavailable, saving to localStorage:", apiError);
        const saved = storageService.get("injuries", [], { usePrefix: false });
        injuryRecord.id = Date.now().toString();
        saved.push(injuryRecord);
        storageService.set("injuries", saved, { usePrefix: false });
      }

      // Show success message
      this.showNotification("Injury report saved successfully! ✓", "success");

      // Reset form and hide
      form.reset();
      form.style.display = "none";
      document.getElementById("btn-add-injury").style.display = "flex";

      // Reload injuries list
      await this.loadInjuries();

      // Reset button
      button.disabled = false;
      button.innerHTML = originalText;
    } catch (error) {
      logger.error("Failed to save injury report:", error);
      this.showNotification(
        "Failed to save injury report. Please try again.",
        "error",
      );
      button.disabled = false;
      button.innerHTML = originalText;
    }
  }

  async loadInjuries() {
    try {
      const user = authManager.getCurrentUser();
      if (!user) {
        return;
      }

      let injuries = [];

      // Try API first
      try {
        const response = await apiClient.get(API_ENDPOINTS.wellness.injuries);
        if (response && response.data && Array.isArray(response.data)) {
          injuries = response.data.filter(
            (i) =>
              i.status === "active" ||
              i.status === "recovering" ||
              i.status === "monitoring",
          );
        }
      } catch (apiError) {
        // Fallback to localStorage
        logger.warn("API unavailable, loading from localStorage:", apiError);
        const saved = storageService.get("injuries", [], { usePrefix: false });
        injuries = saved.filter(
          (i) =>
            i.userId === (user.id || user.email) &&
            (i.status === "active" ||
              i.status === "recovering" ||
              i.status === "monitoring"),
        );
      }

      this.injuries = injuries;
      this.renderInjuries();
    } catch (error) {
      logger.error("Failed to load injuries:", error);
    }
  }

  renderInjuries() {
    const container = document.getElementById("active-injuries-list");
    if (!container) {
      return;
    }

    if (this.injuries.length === 0) {
      container.innerHTML =
        '<p class="injury-description" style="margin: 0; color: var(--color-text-tertiary);">No active injuries reported.</p>';
      return;
    }

    // SECURITY: Sanitize all user-provided injury data before rendering
    container.innerHTML = this.injuries
      .map((injury) => {
        const statusClass =
          injury.status === "recovered"
            ? "recovered"
            : injury.status === "monitoring"
              ? "monitoring"
              : "active";
        const statusLabel =
          injury.status === "recovered"
            ? "Recovered"
            : injury.status === "monitoring"
              ? "Monitoring"
              : "Active";

        // Sanitize user-provided fields to prevent XSS
        const safeType = escapeHtml(injury.type || "");
        const safeDescription = escapeHtml(
          injury.description || "No description",
        );
        const safeSeverity = parseInt(injury.severity) || 0; // Ensure it's a number
        const safeId = escapeHtml(String(injury.id || injury.startDate));

        return `
        <div class="injury-item ${statusClass}">
          <div class="injury-item-info">
            <div class="injury-item-title">
              ${safeType.charAt(0).toUpperCase() + safeType.slice(1)} - Severity: ${safeSeverity}/10
            </div>
            <div class="injury-item-details">
              ${safeDescription} • Started: ${new Date(injury.startDate).toLocaleDateString()} • Status: ${statusLabel}
            </div>
          </div>
          <div class="injury-item-actions">
            ${
              injury.status !== "recovered"
                ? `
              <button class="btn-mark-recovered" data-injury-id="${safeId}">
                Mark Recovered
              </button>
            `
                : ""
            }
          </div>
        </div>
      `;
      })
      .join("");

    // Add event listeners for mark recovered buttons
    container.querySelectorAll(".btn-mark-recovered").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const injuryId = e.target.dataset.injuryId;
        this.markInjuryRecovered(injuryId);
      });
    });
  }

  async markInjuryRecovered(injuryId) {
    try {
      const user = authManager.getCurrentUser();
      if (!user) {
        return;
      }

      // Update injury status
      try {
        await apiClient.put(`${API_ENDPOINTS.wellness.injuries}/${injuryId}`, {
          status: "recovered",
          recoveryDate: new Date().toISOString().split("T")[0],
        });
        logger.success("Injury marked as recovered");
      } catch (apiError) {
        // Fallback to localStorage
        logger.warn("API unavailable, updating localStorage:", apiError);
        const saved = storageService.get("injuries", [], { usePrefix: false });
        const injuryIndex = saved.findIndex(
          (i) =>
            (i.id || i.startDate) === injuryId &&
            i.userId === (user.id || user.email),
        );
        if (injuryIndex !== -1) {
          saved[injuryIndex].status = "recovered";
          saved[injuryIndex].recoveryDate = new Date().toISOString();
          storageService.set("injuries", saved, { usePrefix: false });
        }
      }

      this.showNotification("Injury marked as recovered! ✓", "success");
      await this.loadInjuries();
    } catch (error) {
      logger.error("Failed to mark injury as recovered:", error);
      this.showNotification("Failed to update injury status.", "error");
    }
  }
}

// Initialize dashboard page when script loads
const dashboardPage = new DashboardPage();

// Make API client and endpoints available globally for notification-manager.js
if (typeof window !== "undefined") {
  window.apiClient = window.apiClient || apiClient;
  window.API_ENDPOINTS = window.API_ENDPOINTS || API_ENDPOINTS;
}

// Export for potential external use
export default dashboardPage;

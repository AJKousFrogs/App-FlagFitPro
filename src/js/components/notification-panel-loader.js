// Notification Panel Loader - FlagFit Pro
// Dynamically loads the notification panel component into pages that need it

import { logger } from "../../logger.js";

/**
 * Load notification panel into the page
 * Looks for data-notification-panel-container attribute
 */
export async function loadNotificationPanel() {
  const container = document.querySelector(
    "[data-notification-panel-container]",
  );
  if (!container) {
    return; // No container found, skip loading
  }

  // Check if already loaded
  if (document.getElementById("notification-panel")) {
    return; // Already loaded
  }

  // Create notification panel using DOM methods instead of innerHTML
  const panel = document.createElement("div");
  panel.id = "notification-panel";
  panel.className = "notification-panel";

  const header = document.createElement("div");
  header.className = "notification-header";

  const heading = document.createElement("h3");
  const bellIcon = document.createElement("i");
  bellIcon.setAttribute("data-lucide", "bell");
  heading.appendChild(bellIcon);
  heading.appendChild(document.createTextNode(" Notifications"));

  const closeBtn = document.createElement("button");
  closeBtn.setAttribute("aria-label", "Close notifications");
  closeBtn.addEventListener("click", () => {
    if (typeof window.toggleNotifications === "function") {
      window.toggleNotifications();
    }
  });
  const closeIcon = document.createElement("i");
  closeIcon.setAttribute("data-lucide", "x");
  closeBtn.appendChild(closeIcon);

  header.appendChild(heading);
  header.appendChild(closeBtn);

  const notificationList = document.createElement("div");
  notificationList.id = "notification-list";
  notificationList.className = "notification-list";

  const actions = document.createElement("div");
  actions.className = "notification-actions";

  const markAllBtn = document.createElement("button");
  markAllBtn.className = "notification-action-btn";
  markAllBtn.addEventListener("click", () => {
    if (typeof window.markAllAsRead === "function") {
      window.markAllAsRead();
    }
  });
  const checkIcon = document.createElement("i");
  checkIcon.setAttribute("data-lucide", "check-circle");
  markAllBtn.appendChild(checkIcon);
  markAllBtn.appendChild(document.createTextNode(" Mark all as read"));

  actions.appendChild(markAllBtn);

  panel.appendChild(header);
  panel.appendChild(notificationList);
  panel.appendChild(actions);

  container.appendChild(panel);

  // Initialize Lucide icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons(container);
  }

  // Load enhanced notification center if available
  try {
    const { default: enhancedNotificationCenter } =
      await import("./enhanced-notification-center.js");

    // Wait for notification store to be available
    const waitForStore = () => {
      if (window.notificationStore || window.dashboardPage?.notificationStore) {
        const store =
          window.notificationStore || window.dashboardPage.notificationStore;
        enhancedNotificationCenter.init(store);
        logger.info("[NotificationPanel] Enhanced notification center loaded");
      } else {
        // Retry after a short delay
        setTimeout(waitForStore, 100);
      }
    };

    waitForStore();
  } catch (error) {
    logger.warn(
      "[NotificationPanel] Enhanced notification center not available:",
      error,
    );
    // Continue with basic functionality
  }
}

// Auto-load on DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadNotificationPanel);
} else {
  loadNotificationPanel();
}

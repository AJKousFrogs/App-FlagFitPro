// Notification Panel Loader - FlagFit Pro
// Dynamically loads the notification panel component into pages that need it

const NOTIFICATION_PANEL_HTML = `
<div id="notification-panel" class="notification-panel">
  <div class="notification-header">
    <h3>
      <i data-lucide="bell"></i>
      Notifications
    </h3>
    <button
      onclick="toggleNotifications()"
      aria-label="Close notifications"
    >
      <i data-lucide="x"></i>
    </button>
  </div>
  <div id="notification-list" class="notification-list">
    <!-- Notifications will be populated by JavaScript -->
  </div>
  <div class="notification-actions">
    <button class="notification-action-btn" onclick="markAllAsRead()">
      <i data-lucide="check-circle"></i>
      Mark all as read
    </button>
  </div>
</div>
`;

/**
 * Load notification panel into the page
 * Looks for data-notification-panel-container attribute
 */
export function loadNotificationPanel() {
  const container = document.querySelector('[data-notification-panel-container]');
  if (!container) {
    return; // No container found, skip loading
  }

  // Check if already loaded
  if (document.getElementById('notification-panel')) {
    return; // Already loaded
  }

  // Insert notification panel HTML
  container.innerHTML = NOTIFICATION_PANEL_HTML;

  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons(container);
  }
}

// Auto-load on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadNotificationPanel);
} else {
  loadNotificationPanel();
}



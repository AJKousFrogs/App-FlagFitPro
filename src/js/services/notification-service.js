/**
 * Notification Service for FlagFit Pro
 * Centralized notification display for consistent user feedback
 */

export class NotificationService {
  constructor() {
    this.notificationQueue = [];
    this.maxNotifications = 3;
  }

  /**
   * Show a notification to the user
   * @param {string} message - The message to display
   * @param {string} type - Notification type: "error", "success", "warning", "info"
   * @param {number} duration - How long to show the notification (ms), 0 = permanent
   * @returns {HTMLElement} The notification element
   */
  showNotification(message, type = "info", duration = 5000) {
    // Remove oldest notification if queue is full
    if (this.notificationQueue.length >= this.maxNotifications) {
      const oldest = this.notificationQueue.shift();
      if (oldest && document.body.contains(oldest)) {
        oldest.remove();
      }
    }

    const notification = this.createNotification(message, type, duration);
    this.notificationQueue.push(notification);
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification);
      }, duration);
    }

    return notification;
  }

  /**
   * Create notification element
   */
  createNotification(message, type, _duration) {
    const notification = document.createElement("div");
    notification.className = `error-notification ${type}`;
    notification.setAttribute("role", type === "error" ? "alert" : "status");

    const styles = this.getNotificationStyles(type);
    notification.style.cssText = styles;

    const icon = this.getNotificationIcon(type);

    // Build notification using safe DOM methods (no inline event handlers)
    const container = document.createElement("div");
    container.style.cssText = "display: flex; align-items: flex-start; gap: 0.75rem;";

    const iconSpan = document.createElement("span");
    iconSpan.style.cssText = "flex-shrink: 0; font-size: 1rem;";
    iconSpan.textContent = icon;

    const messageSpan = document.createElement("span");
    messageSpan.style.cssText = "flex: 1;";
    messageSpan.textContent = message;

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.setAttribute("aria-label", "Close notification");
    closeBtn.style.cssText = `
      background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer;
      opacity: 0.8; padding: 0; margin: 0; line-height: 1; flex-shrink: 0;
    `;
    closeBtn.addEventListener("click", () => notification.remove());
    closeBtn.addEventListener("mouseenter", () => { closeBtn.style.opacity = "1"; });
    closeBtn.addEventListener("mouseleave", () => { closeBtn.style.opacity = "0.8"; });

    container.appendChild(iconSpan);
    container.appendChild(messageSpan);
    container.appendChild(closeBtn);
    notification.appendChild(container);

    return notification;
  }

  /**
   * Get notification styles based on type
   */
  getNotificationStyles(type) {
    const baseStyles = `
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 400px;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      font-size: 0.875rem;
      font-family: 'Poppins', sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      line-height: 1.4;
    `;

    const typeStyles = {
      error: "background: #ef4444; border-left: 4px solid #dc2626;",
      success: "background: #10c96b; border-left: 4px solid #0ab85a;",
      warning: "background: #fbbf24; border-left: 4px solid #f59e0b;",
      info: "background: #3b82f6; border-left: 4px solid #2563eb;",
    };

    return baseStyles + (typeStyles[type] || typeStyles.info);
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type) {
    const icons = {
      error: "❌",
      success: "✅",
      warning: "⚠️",
      info: "ℹ️",
    };
    return icons[type] || icons.info;
  }

  /**
   * Show error with retry option
   */
  showErrorWithRetry(message, retryCallback, duration = 10000) {
    const notification = document.createElement("div");
    notification.className = "error-notification error";
    notification.setAttribute("role", "alert");
    notification.style.cssText = this.getNotificationStyles("error");

    // Build notification using safe DOM methods (no inline event handlers)
    const container = document.createElement("div");
    container.style.cssText = "display: flex; align-items: flex-start; gap: 0.75rem;";

    const iconSpan = document.createElement("span");
    iconSpan.style.cssText = "flex-shrink: 0; font-size: 1rem;";
    iconSpan.textContent = "❌";

    const contentDiv = document.createElement("div");
    contentDiv.style.cssText = "flex: 1;";

    const messageDiv = document.createElement("div");
    messageDiv.style.cssText = "margin-bottom: 0.5rem;";
    messageDiv.textContent = message;

    const retryBtn = document.createElement("button");
    retryBtn.className = "retry-btn";
    retryBtn.textContent = "Retry";
    retryBtn.style.cssText = `
      background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);
      color: white; padding: 0.25rem 0.75rem; border-radius: 4px; cursor: pointer;
      font-size: 0.75rem; font-weight: 500; margin-top: 0.5rem;
    `;
    retryBtn.addEventListener("mouseenter", () => { retryBtn.style.background = "rgba(255,255,255,0.3)"; });
    retryBtn.addEventListener("mouseleave", () => { retryBtn.style.background = "rgba(255,255,255,0.2)"; });
    retryBtn.addEventListener("click", () => {
      notification.remove();
      if (retryCallback) {
        retryCallback();
      }
    });

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.setAttribute("aria-label", "Close notification");
    closeBtn.style.cssText = `
      background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer;
      opacity: 0.8; padding: 0; margin: 0; line-height: 1; flex-shrink: 0;
    `;
    closeBtn.addEventListener("click", () => notification.remove());
    closeBtn.addEventListener("mouseenter", () => { closeBtn.style.opacity = "1"; });
    closeBtn.addEventListener("mouseleave", () => { closeBtn.style.opacity = "0.8"; });

    contentDiv.appendChild(messageDiv);
    contentDiv.appendChild(retryBtn);
    container.appendChild(iconSpan);
    container.appendChild(contentDiv);
    container.appendChild(closeBtn);
    notification.appendChild(container);

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification);
      }, duration);
    }

    return notification;
  }

  /**
   * Remove notification with animation
   */
  removeNotification(notification) {
    if (document.body.contains(notification)) {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        notification.remove();
        const index = this.notificationQueue.indexOf(notification);
        if (index > -1) {
          this.notificationQueue.splice(index, 1);
        }
      }, 300);
    }
  }

  /**
   * Convenience methods for different notification types
   */
  showError(message, duration = 8000) {
    return this.showNotification(message, "error", duration);
  }

  showSuccess(message, duration = 5000) {
    return this.showNotification(message, "success", duration);
  }

  showWarning(message, duration = 6000) {
    return this.showNotification(message, "warning", duration);
  }

  showInfo(message, duration = 5000) {
    return this.showNotification(message, "info", duration);
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Export both the class and singleton
export { notificationService };
export default notificationService;

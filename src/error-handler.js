// Global Error Handler for FlagFit Pro
// Provides consistent error handling and user feedback across the app

import { loadingManager } from "./loading-manager.js";
import { logger } from "./logger.js";
import { escapeHtml } from "./js/utils/sanitize.js";

export class ErrorHandler {
  static init() {
    // Global error event listeners
    window.addEventListener("error", this.handleError.bind(this));
    window.addEventListener(
      "unhandledrejection",
      this.handlePromiseRejection.bind(this),
    );

    // Network status monitoring
    window.addEventListener("online", this.handleOnline.bind(this));
    window.addEventListener("offline", this.handleOffline.bind(this));
  }

  static handleError(event) {
    logger.error("Global error caught:", event.error);

    // Show user-friendly error message
    this.showUserError(
      "Something went wrong. Please refresh the page and try again.",
    );
  }

  static handlePromiseRejection(event) {
    logger.error("Unhandled promise rejection:", event.reason);

    // Prevent the default browser error handling
    event.preventDefault();

    // Show user-friendly error message
    this.showUserError(
      "A network request failed. Please check your connection and try again.",
    );
  }

  static handleOnline() {
    this.showSuccess("Connection restored");
  }

  static handleOffline() {
    this.showWarning("You are offline. Some features may not work properly.");
  }

  // API Error handling
  static handleApiError(error, context = "") {
    logger.error(`API Error ${context}:`, error);

    let message = "Something went wrong. Please try again.";

    if (error.status === 401) {
      message = "Your session has expired. Please log in again.";
      // Redirect to login after a delay
      setTimeout(() => {
        window.location.href = "/login.html";
      }, 2000);
    } else if (error.status === 403) {
      message = "You do not have permission to perform this action.";
    } else if (error.status === 404) {
      message = "The requested resource was not found.";
    } else if (error.status >= 500) {
      message = "Server error. Please try again later.";
    } else if (!navigator.onLine) {
      message = "You are offline. Please check your internet connection.";
    }

    this.showUserError(message);
    return { error: true, message };
  }

  // Form validation error handling
  static handleValidationError(field, message) {
    // Find the field element
    const fieldElement =
      document.getElementById(field) ||
      document.querySelector(`[name="${field}"]`);

    if (fieldElement) {
      // Create or update error message element
      let errorElement = document.getElementById(`${field}-error`);
      if (!errorElement) {
        errorElement = document.createElement("div");
        errorElement.id = `${field}-error`;
        errorElement.className = "field-error";
        errorElement.setAttribute("role", "alert");
        fieldElement.parentElement.appendChild(errorElement);
      }

      // Associate error with field
      const existingAriaDescribedBy =
        fieldElement.getAttribute("aria-describedby") || "";
      const errorId = `${field}-error`;
      if (!existingAriaDescribedBy.includes(errorId)) {
        fieldElement.setAttribute(
          "aria-describedby",
          existingAriaDescribedBy
            ? `${existingAriaDescribedBy} ${errorId}`
            : errorId,
        );
      }

      fieldElement.setAttribute("aria-invalid", "true");
      errorElement.textContent = message;
      errorElement.style.display = "block";

      // Add error styling
      fieldElement.classList.add("has-error");
      fieldElement.style.borderColor = "#ef4444";
      fieldElement.style.boxShadow = "0 0 0 3px rgba(239, 68, 68, 0.1)";

      // Remove error styling after user starts typing
      const removeError = () => {
        fieldElement.classList.remove("has-error");
        fieldElement.style.borderColor = "";
        fieldElement.style.boxShadow = "";
        fieldElement.removeAttribute("aria-invalid");
        const describedBy = fieldElement.getAttribute("aria-describedby") || "";
        fieldElement.setAttribute(
          "aria-describedby",
          describedBy.replace(errorId, "").trim(),
        );
        errorElement.style.display = "none";
        fieldElement.removeEventListener("input", removeError);
      };
      fieldElement.addEventListener("input", removeError);
    }

    this.showUserError(message);
  }

  // User-friendly error display
  static showUserError(message) {
    this.showNotification(message, "error", 8000);
  }

  // Alias for showUserError for consistency with other methods
  static showError(message) {
    this.showUserError(message);
  }

  static showSuccess(message) {
    this.showNotification(message, "success", 5000);
  }

  static showWarning(message) {
    this.showNotification(message, "warning", 6000);
  }

  static showInfo(message) {
    this.showNotification(message, "info", 5000);
  }

  // Notification display system
  // Show error notification with retry option
  static showErrorWithRetry(message, retryCallback, duration = 10000) {
    const notification = document.createElement("div");
    notification.className = "error-notification";
    notification.setAttribute("role", "alert");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 1rem 1.25rem;
      border-radius: 8px;
      border-left: 4px solid #dc2626;
      font-weight: 500;
      font-size: 0.875rem;
      font-family: 'Inter', 'Poppins', sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      line-height: 1.4;
      max-width: 400px;
    `;

    // Create elements using safe DOM methods (no innerHTML)
    const container = document.createElement("div");
    container.style.cssText =
      "display: flex; align-items: flex-start; gap: 0.75rem;";

    // Icon
    const icon = document.createElement("span");
    icon.style.cssText = "flex-shrink: 0; font-size: 1rem;";
    icon.textContent = "❌";

    // Content container
    const contentDiv = document.createElement("div");
    contentDiv.style.cssText = "flex: 1;";

    // Message text (safely escaped)
    const messageDiv = document.createElement("div");
    messageDiv.style.cssText = "margin-bottom: 0.5rem;";
    messageDiv.textContent = message; // textContent auto-escapes

    // Retry button
    const retryBtn = document.createElement("button");
    retryBtn.className = "retry-btn";
    retryBtn.textContent = "Retry";
    retryBtn.style.cssText = `
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 500;
      margin-top: 0.5rem;
    `;

    // Retry button hover effects (using addEventListener)
    retryBtn.addEventListener("mouseenter", () => {
      retryBtn.style.background = "rgba(255,255,255,0.3)";
    });
    retryBtn.addEventListener("mouseleave", () => {
      retryBtn.style.background = "rgba(255,255,255,0.2)";
    });

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.setAttribute("aria-label", "Close notification");
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 1.2rem;
      cursor: pointer;
      opacity: 0.8;
      padding: 0;
      margin: 0;
      line-height: 1;
      flex-shrink: 0;
    `;

    // Close button hover effects (using addEventListener)
    closeBtn.addEventListener("mouseenter", () => {
      closeBtn.style.opacity = "1";
    });
    closeBtn.addEventListener("mouseleave", () => {
      closeBtn.style.opacity = "0.8";
    });

    // Assemble DOM structure
    contentDiv.appendChild(messageDiv);
    contentDiv.appendChild(retryBtn);
    container.appendChild(icon);
    container.appendChild(contentDiv);
    container.appendChild(closeBtn);
    notification.appendChild(container);

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    // Setup retry button click handler (no inline onclick)
    retryBtn.addEventListener("click", () => {
      notification.remove();
      if (retryCallback) {
        retryCallback();
      }
    });

    // Setup close button click handler (no inline onclick)
    closeBtn.addEventListener("click", () => {
      notification.remove();
    });

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.style.transform = "translateX(100%)";
          setTimeout(() => notification.remove(), 300);
        }
      }, duration);
    }

    return notification;
  }

  static showNotification(message, type = "info", duration = 5000) {
    // Remove any existing notifications of the same type
    const existing = document.querySelector(`.error-notification.${type}`);
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement("div");
    notification.className = `error-notification ${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 400px;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      font-size: 0.875rem;
      font-family: 'Inter', 'Poppins', sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      line-height: 1.4;
      ${type === "error" ? "background: #ef4444; border-left: 4px solid #dc2626;" : ""}  /* Red for alerts */
      ${type === "success" ? "background: #10c96b; border-left: 4px solid #0ab85a;" : ""}  /* Green for actions */
      ${type === "warning" ? "background: #fbbf24; border-left: 4px solid #f59e0b;" : ""}  /* Yellow for warnings */
      ${type === "info" ? "background: #fbbf24; border-left: 4px solid #f59e0b;" : ""}  /* Yellow for info */
    `;

    const iconMap = {
      error: "❌",
      success: "✅",
      warning: "⚠️",
      info: "ℹ️",
    };

    // Create elements using safe DOM methods (no innerHTML)
    const container = document.createElement("div");
    container.style.cssText =
      "display: flex; align-items: flex-start; gap: 0.75rem;";

    // Icon
    const iconSpan = document.createElement("span");
    iconSpan.style.cssText = "flex-shrink: 0; font-size: 1rem;";
    iconSpan.textContent = iconMap[type];

    // Message text (safely escaped)
    const messageSpan = document.createElement("span");
    messageSpan.style.cssText = "flex: 1;";
    messageSpan.textContent = message; // textContent auto-escapes

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.setAttribute("aria-label", "Close notification");
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 1.2rem;
      cursor: pointer;
      opacity: 0.8;
      padding: 0;
      margin: 0;
      line-height: 1;
      flex-shrink: 0;
    `;

    // Close button hover effects (using addEventListener, not inline)
    closeBtn.addEventListener("mouseenter", () => {
      closeBtn.style.opacity = "1";
    });
    closeBtn.addEventListener("mouseleave", () => {
      closeBtn.style.opacity = "0.8";
    });

    // Close button click handler (using addEventListener, not inline onclick)
    closeBtn.addEventListener("click", () => {
      notification.remove();
    });

    // Assemble DOM structure
    container.appendChild(iconSpan);
    container.appendChild(messageSpan);
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
        if (document.body.contains(notification)) {
          notification.style.transform = "translateX(100%)";
          setTimeout(() => notification.remove(), 300);
        }
      }, duration);
    }
  }

  // Loading state management - uses centralized LoadingManager
  static showLoading(message = "Loading...") {
    return loadingManager.showLoading(message, "global-loading");
  }

  static hideLoading() {
    loadingManager.hideLoading("global-loading");
  }

  // Utility method to wrap async operations with error handling
  static async withErrorHandling(operation, context = "") {
    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error) {
      return this.handleApiError(error, context);
    }
  }
}

// Auto-initialize when module is imported
if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    ErrorHandler.init();
  });
}

export default ErrorHandler;

/**
 * Unified Error Handling for FlagFit Pro Frontend
 * 
 * PRIMARY ERROR HANDLER - This is the only handler that registers global error listeners.
 * All other error handlers have been deprecated and converted to utility functions.
 * 
 * Features:
 * - Global error and unhandled promise rejection handling
 * - Error categorization and user-friendly messages
 * - Sentry integration for error tracking
 * - User notifications with retry options
 * - Network status monitoring
 * - Consistent error response format
 * 
 * Auto-initializes on import. No manual initialization needed.
 * 
 * @see ROOT_CAUSE_ERROR_AUDIT.md for error handling architecture
 */

import { logger } from "../../logger.js";

// Import unified error constants
import {
  ErrorType,
  ErrorSeverity,
  AppError,
  categorizeError as sharedCategorizeError,
  ErrorMessages as _ErrorMessages, // Imported for potential future use
  isRetryableError,
  requiresReauth,
  Errors,
} from "../constants/error-constants.js";

// Re-export for backward compatibility
export { ErrorType, ErrorSeverity, AppError, isRetryableError, requiresReauth, Errors };

// Lazy-load Sentry service (only in production)
let sentryService = null;
const loadSentry = async () => {
  if (!sentryService) {
    try {
      const module = await import("../services/sentry-service.js");
      sentryService = module.sentryService;
    } catch (error) {
      logger.warn("[Error Handler] Sentry not available:", error);
    }
  }
  return sentryService;
};

/**
 * Generate a unique error correlation ID
 * Format: ERR-{timestamp}-{random}
 */
function generateErrorId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ERR-${timestamp}-${random}`;
}

/**
 * Unified Error Handler Class
 */
export class UnifiedErrorHandler {
  constructor() {
    this.initialized = false;
    this.notificationQueue = [];
    this.maxNotifications = 3;
    this.errorLog = []; // In-memory error log for debugging
    this.maxErrorLogSize = 50;
  }

  /**
   * Generate a unique error correlation ID
   * @returns {string} Error correlation ID
   */
  generateErrorId() {
    return generateErrorId();
  }

  /**
   * Add error to internal log (for debugging)
   * @param {object} errorEntry - Error entry to log
   */
  logErrorToMemory(errorEntry) {
    this.errorLog.push(errorEntry);
    if (this.errorLog.length > this.maxErrorLogSize) {
      this.errorLog.shift(); // Remove oldest
    }
  }

  /**
   * Get recent errors (for debugging)
   * @returns {Array} Recent error entries
   */
  getRecentErrors() {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * Initialize global error handlers
   */
  init() {
    if (this.initialized) {
      return;
    }

    // Global error listeners
    window.addEventListener("error", this.handleGlobalError.bind(this));
    window.addEventListener(
      "unhandledrejection",
      this.handlePromiseRejection.bind(this),
    );

    // Network status monitoring
    window.addEventListener("online", () =>
      this.showSuccess("Connection restored"),
    );
    window.addEventListener("offline", () =>
      this.showWarning("You are offline. Some features may not work."),
    );

    this.initialized = true;
    logger.debug("[Error Handler] Initialized");
  }

  /**
   * Handle global errors
   */
  handleGlobalError(event) {
    logger.error("[Global Error]", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });

    // Report to Sentry
    loadSentry().then((sentry) => {
      if (sentry && event.error) {
        sentry.captureException(event.error, {
          component: "global",
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      }
    });

    // Prevent default only if we handle it
    if (event.error instanceof AppError) {
      event.preventDefault();
      this.handleError(event.error, { showToUser: true });
    }
  }

  /**
   * Handle unhandled promise rejections
   */
  handlePromiseRejection(event) {
    logger.error("[Unhandled Promise Rejection]", event.reason);
    event.preventDefault();

    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

    // Report to Sentry
    loadSentry().then((sentry) => {
      if (sentry) {
        sentry.captureException(error, {
          component: "promise",
          action: "unhandled_rejection",
        });
      }
    });

    this.handleError(error, {
      context: "Promise Rejection",
      showToUser: true,
    });
  }

  /**
   * Main error handler - categorizes and processes errors
   * 
   * @param {Error} error - The error to handle
   * @param {object} options - Handler options
   * @param {string} options.context - Context/component where error occurred
   * @param {boolean} options.showToUser - Whether to show notification to user
   * @param {string} options.logLevel - Log level (error, warn, debug)
   * @param {string} options.fallbackMessage - Fallback message if none available
   * @param {function} options.onError - Callback when error is handled
   * @param {boolean} options.allowRetry - Show retry button in notification
   * @param {function} options.retryCallback - Callback for retry button
   * @param {string} options.errorId - Custom error ID (auto-generated if not provided)
   * @returns {object} Standardized error response with errorId
   */
  handleError(error, options = {}) {
    const {
      context = "Operation",
      showToUser = true,
      logLevel = "error",
      fallbackMessage:
        _fallbackMessage = "An error occurred. Please try again.",
      onError = null,
      allowRetry = false,
      retryCallback = null,
      errorId = this.generateErrorId(),
    } = options;

    // Categorize error
    const errorInfo = this.categorizeError(error);
    const logMessage = `[${errorId}][${context}] ${errorInfo.message}`;

    // Log error with correlation ID
    this.logError(logMessage, error, logLevel);

    // Store in memory log for debugging
    this.logErrorToMemory({
      errorId,
      context,
      type: errorInfo.type,
      severity: errorInfo.severity,
      message: errorInfo.message,
      userMessage: errorInfo.userMessage,
      timestamp: new Date().toISOString(),
      stack: error.stack,
    });

    // Report to Sentry for critical and error severity
    if (
      errorInfo.severity === ErrorSeverity.ERROR ||
      errorInfo.severity === ErrorSeverity.CRITICAL
    ) {
      loadSentry().then((sentry) => {
        if (sentry) {
          sentry.captureException(error, {
            errorId,
            component: context,
            errorType: errorInfo.type,
            severity: errorInfo.severity,
            userMessage: errorInfo.userMessage,
          });
        }
      });
    }

    // Show to user if requested
    if (showToUser) {
      if (allowRetry && retryCallback) {
        this.showErrorWithRetry(errorInfo.userMessage, retryCallback);
      } else {
        this.showNotification(errorInfo.userMessage, "error");
      }
    }

    // Call custom error handler if provided
    if (onError && typeof onError === "function") {
      try {
        onError(error, { ...errorInfo, errorId });
      } catch (callbackError) {
        logger.error("[Error Handler] Callback error:", callbackError);
      }
    }

    // Return standardized error response with correlation ID
    return {
      success: false,
      error: errorInfo.userMessage,
      errorType: errorInfo.type,
      severity: errorInfo.severity,
      errorId, // Correlation ID for tracking
      details: error.details || {},
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Categorize error and determine user message
   * Uses the shared categorizeError function from error-constants.js
   */
  categorizeError(error) {
    // Use the shared categorization function
    const categorized = sharedCategorizeError(error);

    // Handle authentication errors - redirect to login
    if (categorized.type === ErrorType.AUTHENTICATION) {
      setTimeout(() => {
        if (typeof window !== "undefined" && window.location.pathname !== "/login.html") {
          window.location.href = "/login.html";
        }
      }, 2000);
    }

    return categorized;
  }

  /**
   * Log error based on level
   */
  logError(message, error, level = "error") {
    switch (level) {
      case "error":
        logger.error(message, error);
        break;
      case "warn":
        logger.warn(message, error);
        break;
      case "debug":
        logger.debug(message, error);
        break;
      default:
        logger.error(message, error);
    }
  }

  /**
   * Show notification to user
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
    container.style.cssText =
      "display: flex; align-items: flex-start; gap: 0.75rem;";

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
    closeBtn.addEventListener("mouseenter", () => {
      closeBtn.style.opacity = "1";
    });
    closeBtn.addEventListener("mouseleave", () => {
      closeBtn.style.opacity = "0.8";
    });

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
      font-family: 'Inter', 'Poppins', sans-serif;
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
    container.style.cssText =
      "display: flex; align-items: flex-start; gap: 0.75rem;";

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
    retryBtn.addEventListener("mouseenter", () => {
      retryBtn.style.background = "rgba(255,255,255,0.3)";
    });
    retryBtn.addEventListener("mouseleave", () => {
      retryBtn.style.background = "rgba(255,255,255,0.2)";
    });
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
    closeBtn.addEventListener("mouseenter", () => {
      closeBtn.style.opacity = "1";
    });
    closeBtn.addEventListener("mouseleave", () => {
      closeBtn.style.opacity = "0.8";
    });

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

  /**
   * Async operation wrapper with error handling
   */
  async safeAsync(operation, options = {}) {
    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error, options);
    }
  }

  /**
   * Retry wrapper for failed operations
   */
  async withRetry(operation, options = {}) {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoff = 2,
      shouldRetry = (error) =>
        error.type === ErrorType.NETWORK || error.type === ErrorType.SERVER,
      onRetry = null,
    } = options;

    let lastError;
    let currentDelay = delay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === maxAttempts) {
          break;
        }

        const errorInfo = this.categorizeError(error);
        if (!shouldRetry(errorInfo)) {
          break;
        }

        if (onRetry) {
          onRetry(error, attempt);
        }

        logger.warn(
          `[Retry] Attempt ${attempt}/${maxAttempts} failed, retrying in ${currentDelay}ms...`,
        );

        const delayMs = currentDelay;
        await new Promise((resolve) => {
          setTimeout(resolve, delayMs);
        });
        currentDelay *= backoff;
      }
    }

    throw lastError;
  }

  /**
   * Handle API errors specifically
   */
  handleApiError(error, context = "API Request") {
    return this.handleError(error, {
      context,
      showToUser: true,
      fallbackMessage: "Failed to communicate with server. Please try again.",
    });
  }

  /**
   * Handle form validation errors
   */
  handleValidationError(fieldId, message) {
    const fieldElement = document.getElementById(fieldId);

    if (fieldElement) {
      // Show field-level error
      this.showFieldError(fieldElement, message);
    }

    // Also show notification
    this.showError(message);
  }

  /**
   * Show field-level validation error
   */
  showFieldError(fieldElement, message) {
    const fieldId = fieldElement.id || fieldElement.name;
    let errorElement = document.getElementById(`${fieldId}-error`);

    if (!errorElement) {
      errorElement = document.createElement("div");
      errorElement.id = `${fieldId}-error`;
      errorElement.className = "field-error";
      errorElement.setAttribute("role", "alert");
      fieldElement.parentElement.appendChild(errorElement);
    }

    errorElement.textContent = message;
    errorElement.style.display = "block";

    fieldElement.classList.add("has-error");
    fieldElement.setAttribute("aria-invalid", "true");
    fieldElement.setAttribute("aria-describedby", `${fieldId}-error`);

    // Clear error on input
    const clearError = () => {
      fieldElement.classList.remove("has-error");
      fieldElement.removeAttribute("aria-invalid");
      errorElement.style.display = "none";
      fieldElement.removeEventListener("input", clearError);
    };

    fieldElement.addEventListener("input", clearError, { once: true });
  }
}

// Create singleton instance
const errorHandler = new UnifiedErrorHandler();

// Export both the class and singleton
export { errorHandler };
export default errorHandler;

// Auto-initialize on DOM ready
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => errorHandler.init());
  } else {
    errorHandler.init();
  }
}

logger.info("[Unified Error Handler] Module loaded");

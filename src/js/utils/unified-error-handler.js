/**
 * Unified Error Handling for FlagFit Pro Frontend
 * Combines error handling, user notifications, logging, and Sentry tracking
 */

import { logger } from "../../logger.js";
import { escapeHtml } from "./sanitize.js";

// Lazy-load Sentry service (only in production)
let sentryService = null;
const loadSentry = async () => {
  if (!sentryService) {
    try {
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/1109c3b1-ad92-4df3-94cd-11d0d3503af9",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "unified-error-handler.js:11",
            message: "loadSentry called",
            data: { sentryServiceExists: !!sentryService },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "B",
          }),
        },
      ).catch(() => {});
      // #endregion
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/1109c3b1-ad92-4df3-94cd-11d0d3503af9",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "unified-error-handler.js:14",
            message: "Before importing sentry-service",
            data: { importPath: "../services/sentry-service.js" },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "B",
          }),
        },
      ).catch(() => {});
      // #endregion
      const module = await import("../services/sentry-service.js");
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/1109c3b1-ad92-4df3-94cd-11d0d3503af9",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "unified-error-handler.js:15",
            message: "Import successful",
            data: {
              hasModule: !!module,
              hasSentryService: !!module.sentryService,
              moduleKeys: Object.keys(module || {}),
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "B",
          }),
        },
      ).catch(() => {});
      // #endregion
      sentryService = module.sentryService;
    } catch (error) {
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/1109c3b1-ad92-4df3-94cd-11d0d3503af9",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "unified-error-handler.js:17",
            message: "Import error in loadSentry",
            data: {
              errorName: error?.name,
              errorMessage: error?.message,
              errorStack: error?.stack?.substring(0, 500),
              errorToString: String(error),
              errorColumn: error?.columnNumber,
              errorLine: error?.lineNumber,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "B",
          }),
        },
      ).catch(() => {});
      // #endregion
      logger.warn("[Error Handler] Sentry not available:", error);
    }
  }
  return sentryService;
};

/**
 * Error types for categorization
 */
export const ErrorType = {
  NETWORK: "network",
  VALIDATION: "validation",
  AUTHENTICATION: "authentication",
  AUTHORIZATION: "authorization",
  NOT_FOUND: "not_found",
  SERVER: "server",
  CLIENT: "client",
  UNKNOWN: "unknown",
};

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical",
};

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    message,
    type = ErrorType.UNKNOWN,
    severity = ErrorSeverity.ERROR,
    details = {},
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.severity = severity;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Unified Error Handler Class
 */
export class UnifiedErrorHandler {
  constructor() {
    this.initialized = false;
    this.notificationQueue = [];
    this.maxNotifications = 3;
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
   */
  handleError(error, options = {}) {
    const {
      context = "Operation",
      showToUser = true,
      logLevel = "error",
      fallbackMessage = "An error occurred. Please try again.",
      onError = null,
      allowRetry = false,
      retryCallback = null,
    } = options;

    // Categorize error
    const errorInfo = this.categorizeError(error);
    const logMessage = `[${context}] ${errorInfo.message}`;

    // Log error
    this.logError(logMessage, error, logLevel);

    // Report to Sentry for critical and error severity
    if (
      errorInfo.severity === ErrorSeverity.ERROR ||
      errorInfo.severity === ErrorSeverity.CRITICAL
    ) {
      loadSentry().then((sentry) => {
        if (sentry) {
          sentry.captureException(error, {
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
        onError(error, errorInfo);
      } catch (callbackError) {
        logger.error("[Error Handler] Callback error:", callbackError);
      }
    }

    // Return standardized error response
    return {
      success: false,
      error: errorInfo.userMessage,
      errorType: errorInfo.type,
      severity: errorInfo.severity,
      details: error.details || {},
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Categorize error and determine user message
   */
  categorizeError(error) {
    let type = ErrorType.UNKNOWN;
    let severity = ErrorSeverity.ERROR;
    let userMessage = "An error occurred. Please try again.";

    // Handle AppError instances
    if (error instanceof AppError) {
      return {
        type: error.type,
        severity: error.severity,
        message: error.message,
        userMessage: error.message,
      };
    }

    // Network errors
    if (
      error.message?.includes("fetch") ||
      error.message?.includes("network") ||
      !navigator.onLine
    ) {
      type = ErrorType.NETWORK;
      severity = ErrorSeverity.WARNING;
      userMessage =
        "Network error. Please check your connection and try again.";
    }
    // Authentication errors
    else if (error.status === 401 || error.message?.includes("auth")) {
      type = ErrorType.AUTHENTICATION;
      severity = ErrorSeverity.ERROR;
      userMessage = "Authentication failed. Please log in again.";

      // Redirect to login after delay
      setTimeout(() => {
        if (window.location.pathname !== "/login.html") {
          window.location.href = "/login.html";
        }
      }, 2000);
    }
    // Authorization errors
    else if (error.status === 403) {
      type = ErrorType.AUTHORIZATION;
      severity = ErrorSeverity.ERROR;
      userMessage = "You do not have permission to perform this action.";
    }
    // Not found errors
    else if (error.status === 404) {
      type = ErrorType.NOT_FOUND;
      severity = ErrorSeverity.WARNING;
      userMessage = "The requested resource was not found.";
    }
    // Server errors
    else if (error.status >= 500) {
      type = ErrorType.SERVER;
      severity = ErrorSeverity.ERROR;
      userMessage = "Server error. Please try again later.";
    }
    // Client errors
    else if (error.status >= 400) {
      type = ErrorType.CLIENT;
      severity = ErrorSeverity.WARNING;
      userMessage =
        error.message || "Invalid request. Please check your input.";
    }

    return {
      type,
      severity,
      message: error.message || "Unknown error",
      userMessage,
    };
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
  createNotification(message, type, duration) {
    const notification = document.createElement("div");
    notification.className = `error-notification ${type}`;
    notification.setAttribute("role", type === "error" ? "alert" : "status");

    const styles = this.getNotificationStyles(type);
    notification.style.cssText = styles;

    const icon = this.getNotificationIcon(type);

    notification.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
        <span style="flex-shrink: 0; font-size: 1rem;">${icon}</span>
        <span style="flex: 1;">${escapeHtml(message)}</span>
        <button onclick="this.closest('.error-notification').remove()"
                style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer;
                       opacity: 0.8; padding: 0; margin: 0; line-height: 1; flex-shrink: 0;"
                onmouseover="this.style.opacity='1'"
                onmouseout="this.style.opacity='0.8'">×</button>
      </div>
    `;

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

    notification.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
        <span style="flex-shrink: 0; font-size: 1rem;">❌</span>
        <div style="flex: 1;">
          <div style="margin-bottom: 0.5rem;">${escapeHtml(message)}</div>
          <button class="retry-btn"
                  style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);
                         color: white; padding: 0.25rem 0.75rem; border-radius: 4px; cursor: pointer;
                         font-size: 0.75rem; font-weight: 500; margin-top: 0.5rem;"
                  onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                  onmouseout="this.style.background='rgba(255,255,255,0.2)'">Retry</button>
        </div>
        <button onclick="this.closest('.error-notification').remove()"
                style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer;
                       opacity: 0.8; padding: 0; margin: 0; line-height: 1; flex-shrink: 0;"
                onmouseover="this.style.opacity='1'"
                onmouseout="this.style.opacity='0.8'">×</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    // Setup retry button
    const retryBtn = notification.querySelector(".retry-btn");
    retryBtn.addEventListener("click", () => {
      notification.remove();
      if (retryCallback) {
        retryCallback();
      }
    });

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

        await new Promise((resolve) => setTimeout(resolve, currentDelay));
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

console.log("[Unified Error Handler] Module loaded");

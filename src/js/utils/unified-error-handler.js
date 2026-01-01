/**
 * Unified Error Handling for FlagFit Pro Frontend
 * Combines error handling, user notifications, logging, and Sentry tracking
 */

import { logger } from "../../logger.js";
import { notificationService } from "../services/notification-service.js";

// Lazy-load Sentry service (only in production)
let sentryService = null;
const loadSentry = async () => {
  if (!sentryService) {
    try {
      const module = await import("../services/sentry-service.js");
      ({ sentryService } = module);
    } catch (error) {
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
      fallbackMessage:
        _fallbackMessage = "An error occurred. Please try again.",
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
    } else if (error.status === 401 || error.message?.includes("auth")) {
      // Authentication errors
      type = ErrorType.AUTHENTICATION;
      severity = ErrorSeverity.ERROR;
      userMessage = "Authentication failed. Please log in again.";

      // Redirect to login after delay
      setTimeout(() => {
        if (window.location.pathname !== "/login.html") {
          window.location.href = "/login.html";
        }
      }, 2000);
    } else if (error.status === 403) {
      // Authorization errors
      type = ErrorType.AUTHORIZATION;
      severity = ErrorSeverity.ERROR;
      userMessage = "You do not have permission to perform this action.";
    } else if (error.status === 404) {
      // Not found errors
      type = ErrorType.NOT_FOUND;
      severity = ErrorSeverity.WARNING;
      userMessage = "The requested resource was not found.";
    } else if (error.status >= 500) {
      // Server errors
      type = ErrorType.SERVER;
      severity = ErrorSeverity.ERROR;
      userMessage = "Server error. Please try again later.";
    } else if (error.status >= 400) {
      // Client errors
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
  /**
   * Show notification - delegates to notification service
   */
  showNotification(message, type = "info", duration = 5000) {
    return notificationService.showNotification(message, type, duration);
  }

  /**
   * Show error with retry option - delegates to notification service
   */
  showErrorWithRetry(message, retryCallback, duration = 10000) {
    return notificationService.showErrorWithRetry(
      message,
      retryCallback,
      duration,
    );
  }

  /**
   * Convenience methods for different notification types
   */
  showError(message, duration = 8000) {
    return notificationService.showError(message, duration);
  }

  showSuccess(message, duration = 5000) {
    return notificationService.showSuccess(message, duration);
  }

  showWarning(message, duration = 6000) {
    return notificationService.showWarning(message, duration);
  }

  showInfo(message, duration = 5000) {
    return notificationService.showInfo(message, duration);
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
        return await operation(); // eslint-disable-line no-await-in-loop
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
        await new Promise((resolve) => { // eslint-disable-line no-await-in-loop
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

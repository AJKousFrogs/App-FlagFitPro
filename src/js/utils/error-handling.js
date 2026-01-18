import { logger } from "../../logger.js";

/**
 * FlagFit Pro - Standardized Error Handling Utilities
 * Provides consistent error handling patterns across the application
 * 
 * NOTE: This module now imports from the unified error-constants.js
 * for consistent error types across the application.
 */

// Import from unified error constants
import {
  ErrorType,
  ErrorSeverity,
  AppError,
  categorizeError as _sharedCategorizeError, // Available for use, prefixed to avoid unused warning
  isRetryableError,
  Errors,
} from "../constants/error-constants.js";

// Re-export for backward compatibility
export { ErrorType, ErrorSeverity, AppError, isRetryableError, Errors };

/**
 * Standardized error handler
 * @param {Error} error - Error object
 * @param {object} options - Handler options
 * @returns {object} Standardized error response
 */
export function handleError(error, options = {}) {
  const {
    context = "Operation",
    logLevel = "error",
    showToUser = true,
    fallbackMessage = "An error occurred. Please try again.",
    onError = null,
  } = options;

  // Determine error type and user message
  let errorType = ErrorType.UNKNOWN;
  let userMessage = fallbackMessage;
  const logMessage = `[${context}] ${error.message || "Unknown error"}`;

  // Categorize error
  if (error.name === "AppError") {
    errorType = error.type;
    userMessage = error.message;
  } else if (
    error.message?.includes("fetch") ||
    error.message?.includes("network")
  ) {
    errorType = ErrorType.NETWORK;
    userMessage = "Network error. Please check your connection and try again.";
  } else if (error.status === 401 || error.message?.includes("auth")) {
    errorType = ErrorType.AUTHENTICATION;
    userMessage = "Authentication failed. Please log in again.";
  } else if (error.status === 403) {
    errorType = ErrorType.AUTHORIZATION;
    userMessage = "You do not have permission to perform this action.";
  } else if (error.status === 404) {
    errorType = ErrorType.NOT_FOUND;
    userMessage = "The requested resource was not found.";
  } else if (error.status >= 500) {
    errorType = ErrorType.SERVER;
    userMessage = "Server error. Please try again later.";
  } else if (error.status >= 400) {
    errorType = ErrorType.CLIENT;
    userMessage = error.message || fallbackMessage;
  }

  // Log error
  if (logLevel === "error") {
    logger.error(logMessage, error);
  } else if (logLevel === "warn") {
    logger.warn(logMessage, error);
  } else if (logLevel === "debug") {
    logger.debug(logMessage, error);
  }

  // Show to user if requested
  if (showToUser && window.ErrorHandler) {
    window.ErrorHandler.showNotification(userMessage, "error");
  }

  // Call custom error handler if provided
  if (onError && typeof onError === "function") {
    try {
      onError(error, { type: errorType, message: userMessage });
    } catch (callbackError) {
      logger.error("[Error Handler] Callback error:", callbackError);
    }
  }

  // Return standardized error response
  return {
    success: false,
    error: userMessage,
    errorType,
    details: error.details || {},
    timestamp: new Date().toISOString(),
  };
}

/**
 * Async error wrapper - wraps async functions with standardized error handling
 * @param {function} fn - Async function to wrap
 * @param {object} options - Handler options
 * @returns {function} Wrapped function
 */
export function withErrorHandling(fn, options = {}) {
  return async function (...args) {
    try {
      return await fn(...args);
    } catch (error) {
      return handleError(error, options);
    }
  };
}

/**
 * Safe async operation - executes async function with error handling
 * @param {function} operation - Async operation to execute
 * @param {object} options - Handler options
 * @returns {Promise<object>} Result or error response
 */
export async function safeAsync(operation, options = {}) {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    return handleError(error, options);
  }
}

/**
 * Retry wrapper - retries failed operations
 * @param {function} operation - Operation to retry
 * @param {object} options - Retry options
 * @returns {Promise} Operation result
 */
export async function withRetry(operation, options = {}) {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 2,
    shouldRetry = () => true,
    onRetry = null,
  } = options;

  let lastError;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts
      if (attempt === maxAttempts) {
        break;
      }

      // Check if we should retry this error
      if (!shouldRetry(error, attempt)) {
        break;
      }

      // Call retry callback
      if (onRetry) {
        onRetry(error, attempt);
      }

      logger.warn(
        `[Retry] Attempt ${attempt} failed, retrying in ${currentDelay}ms...`,
      );

      // Wait before retrying
      const delayMs = currentDelay;
      await new Promise((resolve) => {
        setTimeout(resolve, delayMs);
      });

      // Increase delay for next attempt (exponential backoff)
      currentDelay *= backoff;
    }
  }

  // All retries failed
  throw lastError;
}

/**
 * Validation error helper
 * @param {string} message - Validation error message
 * @param {object} details - Validation details
 * @returns {AppError} Validation error
 */
export function validationError(message, details = {}) {
  return new AppError(message, ErrorType.VALIDATION, details);
}

/**
 * Network error helper
 * @param {string} message - Network error message
 * @param {object} details - Error details
 * @returns {AppError} Network error
 * @deprecated Use Errors.network() from error-constants.js instead
 */
export function networkError(message = "Network error occurred", details = {}) {
  return new AppError(message, ErrorType.NETWORK, details);
}

// Note: isRetryableError is now imported from error-constants.js
// The local definition has been removed to avoid duplicate exports

/**
 * Safe DOM operation wrapper
 * @param {function} operation - DOM operation to execute
 * @param {object} options - Options
 * @returns {*} Operation result or null on error
 */
export function safeDOMOperation(operation, options = {}) {
  const { logError = true, defaultValue = null } = options;

  try {
    return operation();
  } catch (error) {
    if (logError) {
      logger.error("[DOM Operation] Error:", error);
    }
    return defaultValue;
  }
}

/**
 * Global unhandled error handler - DEPRECATED
 * 
 * @deprecated This function no longer registers global listeners to prevent
 * duplicate error handling. Use UnifiedErrorHandler instead.
 * 
 * This function is kept for backward compatibility but does nothing.
 * Global error listeners are now handled by UnifiedErrorHandler.
 */
export function setupGlobalErrorHandlers() {
  // No-op: Global error handling is now done by UnifiedErrorHandler
  // This function is kept for backward compatibility
  logger.debug(
    "[Error Handling] setupGlobalErrorHandlers() called but global listeners are handled by UnifiedErrorHandler",
  );
}

// Export for use in modules
export default {
  ErrorType,
  AppError,
  handleError,
  withErrorHandling,
  safeAsync,
  withRetry,
  validationError,
  networkError,
  isRetryableError,
  safeDOMOperation,
  setupGlobalErrorHandlers,
};

logger.info("[Error Handling] Standardized error handling utilities loaded");

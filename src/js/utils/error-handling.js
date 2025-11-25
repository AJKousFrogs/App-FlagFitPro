/**
 * FlagFit Pro - Standardized Error Handling Utilities
 * Provides consistent error handling patterns across the application
 */

import { logger } from '../../logger.js';

/**
 * Error types for categorization
 */
export const ErrorType = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  CLIENT: 'client',
  UNKNOWN: 'unknown'
};

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(message, type = ErrorType.UNKNOWN, details = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Standardized error handler
 * @param {Error} error - Error object
 * @param {object} options - Handler options
 * @returns {object} Standardized error response
 */
export function handleError(error, options = {}) {
  const {
    context = 'Operation',
    logLevel = 'error',
    showToUser = true,
    fallbackMessage = 'An error occurred. Please try again.',
    onError = null
  } = options;

  // Determine error type and user message
  let errorType = ErrorType.UNKNOWN;
  let userMessage = fallbackMessage;
  let logMessage = `[${context}] ${error.message || 'Unknown error'}`;

  // Categorize error
  if (error.name === 'AppError') {
    errorType = error.type;
    userMessage = error.message;
  } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
    errorType = ErrorType.NETWORK;
    userMessage = 'Network error. Please check your connection and try again.';
  } else if (error.status === 401 || error.message?.includes('auth')) {
    errorType = ErrorType.AUTHENTICATION;
    userMessage = 'Authentication failed. Please log in again.';
  } else if (error.status === 403) {
    errorType = ErrorType.AUTHORIZATION;
    userMessage = 'You do not have permission to perform this action.';
  } else if (error.status === 404) {
    errorType = ErrorType.NOT_FOUND;
    userMessage = 'The requested resource was not found.';
  } else if (error.status >= 500) {
    errorType = ErrorType.SERVER;
    userMessage = 'Server error. Please try again later.';
  } else if (error.status >= 400) {
    errorType = ErrorType.CLIENT;
    userMessage = error.message || fallbackMessage;
  }

  // Log error
  if (logLevel === 'error') {
    logger.error(logMessage, error);
  } else if (logLevel === 'warn') {
    logger.warn(logMessage, error);
  } else if (logLevel === 'debug') {
    logger.debug(logMessage, error);
  }

  // Show to user if requested
  if (showToUser && window.ErrorHandler) {
    window.ErrorHandler.showNotification(userMessage, 'error');
  }

  // Call custom error handler if provided
  if (onError && typeof onError === 'function') {
    try {
      onError(error, { type: errorType, message: userMessage });
    } catch (callbackError) {
      logger.error('[Error Handler] Callback error:', callbackError);
    }
  }

  // Return standardized error response
  return {
    success: false,
    error: userMessage,
    errorType,
    details: error.details || {},
    timestamp: new Date().toISOString()
  };
}

/**
 * Async error wrapper - wraps async functions with standardized error handling
 * @param {function} fn - Async function to wrap
 * @param {object} options - Handler options
 * @returns {function} Wrapped function
 */
export function withErrorHandling(fn, options = {}) {
  return async function(...args) {
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
    onRetry = null
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

      logger.warn(`[Retry] Attempt ${attempt} failed, retrying in ${currentDelay}ms...`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, currentDelay));

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
 */
export function networkError(message = 'Network error occurred', details = {}) {
  return new AppError(message, ErrorType.NETWORK, details);
}

/**
 * Check if error is retryable (network/server errors)
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is retryable
 */
export function isRetryableError(error) {
  if (error instanceof AppError) {
    return error.type === ErrorType.NETWORK || error.type === ErrorType.SERVER;
  }

  if (error.status >= 500) {
    return true;
  }

  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return true;
  }

  return false;
}

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
      logger.error('[DOM Operation] Error:', error);
    }
    return defaultValue;
  }
}

/**
 * Global unhandled error handler
 */
export function setupGlobalErrorHandlers() {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('[Unhandled Promise Rejection]', event.reason);
    event.preventDefault(); // Prevent default browser behavior
  });

  // Catch global errors
  window.addEventListener('error', (event) => {
    logger.error('[Global Error]', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });

  logger.debug('[Error Handling] Global error handlers installed');
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
  setupGlobalErrorHandlers
};

console.log('[Error Handling] Standardized error handling utilities loaded');

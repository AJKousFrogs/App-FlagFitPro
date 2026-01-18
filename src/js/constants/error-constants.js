/**
 * Unified Error Constants for FlagFit Pro
 * 
 * This module provides standardized error types, severity levels, and user messages
 * that are consistent across frontend and backend.
 * 
 * IMPORTANT: When updating these constants, ensure backend (netlify/functions/utils/error-handler.cjs)
 * uses the same values for consistency.
 */

import { logger } from "../../logger.js";

/**
 * Error types for categorization
 * These map to HTTP status codes and error categories
 * @readonly
 */
export const ErrorType = Object.freeze({
  // Client errors (4xx)
  VALIDATION: "validation_error",
  AUTHENTICATION: "authentication_error",
  AUTHORIZATION: "authorization_error",
  NOT_FOUND: "not_found",
  METHOD_NOT_ALLOWED: "method_not_allowed",
  CONFLICT: "conflict",
  RATE_LIMIT: "rate_limit_exceeded",
  CLIENT: "client_error",

  // Server errors (5xx)
  SERVER: "server_error",
  DATABASE: "database_error",
  NETWORK: "network_error",
  TIMEOUT: "timeout_error",

  // Generic
  UNKNOWN: "unknown_error",
});

/**
 * Error severity levels for logging and alerting
 * @readonly
 */
export const ErrorSeverity = Object.freeze({
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical",
});

/**
 * HTTP status code to error type mapping
 * @readonly
 */
export const StatusCodeToErrorType = Object.freeze({
  400: ErrorType.VALIDATION,
  401: ErrorType.AUTHENTICATION,
  403: ErrorType.AUTHORIZATION,
  404: ErrorType.NOT_FOUND,
  405: ErrorType.METHOD_NOT_ALLOWED,
  409: ErrorType.CONFLICT,
  422: ErrorType.VALIDATION,
  429: ErrorType.RATE_LIMIT,
  500: ErrorType.SERVER,
  502: ErrorType.NETWORK,
  503: ErrorType.SERVER,
  504: ErrorType.TIMEOUT,
});

/**
 * User-friendly error messages for each error type
 * @readonly
 */
export const ErrorMessages = Object.freeze({
  [ErrorType.VALIDATION]: "Invalid input. Please check your data and try again.",
  [ErrorType.AUTHENTICATION]: "Authentication failed. Please log in again.",
  [ErrorType.AUTHORIZATION]: "You do not have permission to perform this action.",
  [ErrorType.NOT_FOUND]: "The requested resource was not found.",
  [ErrorType.METHOD_NOT_ALLOWED]: "This action is not allowed.",
  [ErrorType.CONFLICT]: "This resource already exists or conflicts with another.",
  [ErrorType.RATE_LIMIT]: "Too many requests. Please wait and try again.",
  [ErrorType.CLIENT]: "Invalid request. Please check your input.",
  [ErrorType.SERVER]: "Server error. Please try again later.",
  [ErrorType.DATABASE]: "Database error. Please try again later.",
  [ErrorType.NETWORK]: "Network error. Please check your connection and try again.",
  [ErrorType.TIMEOUT]: "Request timed out. Please try again.",
  [ErrorType.UNKNOWN]: "An error occurred. Please try again.",
});

/**
 * Default severity for each error type
 * @readonly
 */
export const ErrorTypeSeverity = Object.freeze({
  [ErrorType.VALIDATION]: ErrorSeverity.WARNING,
  [ErrorType.AUTHENTICATION]: ErrorSeverity.ERROR,
  [ErrorType.AUTHORIZATION]: ErrorSeverity.ERROR,
  [ErrorType.NOT_FOUND]: ErrorSeverity.WARNING,
  [ErrorType.METHOD_NOT_ALLOWED]: ErrorSeverity.WARNING,
  [ErrorType.CONFLICT]: ErrorSeverity.WARNING,
  [ErrorType.RATE_LIMIT]: ErrorSeverity.WARNING,
  [ErrorType.CLIENT]: ErrorSeverity.WARNING,
  [ErrorType.SERVER]: ErrorSeverity.ERROR,
  [ErrorType.DATABASE]: ErrorSeverity.ERROR,
  [ErrorType.NETWORK]: ErrorSeverity.WARNING,
  [ErrorType.TIMEOUT]: ErrorSeverity.WARNING,
  [ErrorType.UNKNOWN]: ErrorSeverity.ERROR,
});

/**
 * Custom application error class
 * Use this to throw typed errors that can be properly categorized
 */
export class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} type - Error type from ErrorType enum
   * @param {string} severity - Error severity from ErrorSeverity enum
   * @param {object} details - Additional error details
   */
  constructor(
    message,
    type = ErrorType.UNKNOWN,
    severity = null,
    details = {},
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.severity = severity || ErrorTypeSeverity[type] || ErrorSeverity.ERROR;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Get user-friendly message for this error
   * @returns {string} User-friendly error message
   */
  getUserMessage() {
    return this.message || ErrorMessages[this.type] || ErrorMessages[ErrorType.UNKNOWN];
  }

  /**
   * Convert to JSON for logging/transmission
   * @returns {object} JSON representation
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * Categorize an error based on its properties
 * 
 * @param {Error|object} error - Error to categorize
 * @returns {object} Categorized error info with type, severity, message, and userMessage
 */
export function categorizeError(error) {
  // Handle AppError instances
  if (error instanceof AppError) {
    return {
      type: error.type,
      severity: error.severity,
      message: error.message,
      userMessage: error.getUserMessage(),
      details: error.details,
    };
  }

  // Check for HTTP status code
  const status = error.status || error.statusCode || error.response?.status;
  if (status) {
    const type = StatusCodeToErrorType[status] || 
      (status >= 500 ? ErrorType.SERVER : 
       status >= 400 ? ErrorType.CLIENT : ErrorType.UNKNOWN);
    
    return {
      type,
      severity: ErrorTypeSeverity[type] || ErrorSeverity.ERROR,
      message: error.message || `HTTP ${status} error`,
      userMessage: error.message || ErrorMessages[type] || ErrorMessages[ErrorType.UNKNOWN],
      details: error.details || {},
    };
  }

  // Check for network errors
  if (
    error.message?.toLowerCase().includes("fetch") ||
    error.message?.toLowerCase().includes("network") ||
    error.name === "NetworkError" ||
    error.name === "TypeError" && error.message?.includes("Failed to fetch") ||
    (typeof navigator !== "undefined" && !navigator.onLine)
  ) {
    return {
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.WARNING,
      message: error.message || "Network error",
      userMessage: ErrorMessages[ErrorType.NETWORK],
      details: {},
    };
  }

  // Check for timeout errors
  if (
    error.message?.toLowerCase().includes("timeout") ||
    error.name === "TimeoutError" ||
    error.code === "ETIMEDOUT"
  ) {
    return {
      type: ErrorType.TIMEOUT,
      severity: ErrorSeverity.WARNING,
      message: error.message || "Request timed out",
      userMessage: ErrorMessages[ErrorType.TIMEOUT],
      details: {},
    };
  }

  // Check for authentication errors by message content
  if (
    error.message?.toLowerCase().includes("auth") ||
    error.message?.toLowerCase().includes("unauthorized") ||
    error.message?.toLowerCase().includes("token")
  ) {
    return {
      type: ErrorType.AUTHENTICATION,
      severity: ErrorSeverity.ERROR,
      message: error.message || "Authentication error",
      userMessage: ErrorMessages[ErrorType.AUTHENTICATION],
      details: {},
    };
  }

  // Check for validation errors
  if (
    error.message?.toLowerCase().includes("valid") ||
    error.name === "ValidationError" ||
    error.errors // Common validation error pattern
  ) {
    return {
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.WARNING,
      message: error.message || "Validation error",
      userMessage: error.message || ErrorMessages[ErrorType.VALIDATION],
      details: error.errors || {},
    };
  }

  // Default to unknown error
  return {
    type: ErrorType.UNKNOWN,
    severity: ErrorSeverity.ERROR,
    message: error.message || "Unknown error",
    userMessage: ErrorMessages[ErrorType.UNKNOWN],
    details: {},
  };
}

/**
 * Create a standardized error response object
 * 
 * @param {Error|object} error - Error to convert
 * @param {object} options - Additional options
 * @returns {object} Standardized error response
 */
export function createErrorResponse(error, options = {}) {
  const { requestId = null, includeStack = false } = options;
  const categorized = categorizeError(error);

  const response = {
    success: false,
    error: {
      code: categorized.type,
      message: categorized.userMessage,
      details: categorized.details,
    },
    errorType: categorized.type,
    severity: categorized.severity,
    timestamp: new Date().toISOString(),
  };

  if (requestId) {
    response.requestId = requestId;
  }

  if (includeStack && error.stack) {
    response.error.stack = error.stack;
  }

  return response;
}

/**
 * Check if an error is retryable (network/server/timeout errors)
 * 
 * @param {Error|object} error - Error to check
 * @returns {boolean} True if the error is retryable
 */
export function isRetryableError(error) {
  const { type } = categorizeError(error);
  return [
    ErrorType.NETWORK,
    ErrorType.SERVER,
    ErrorType.TIMEOUT,
    ErrorType.DATABASE,
  ].includes(type);
}

/**
 * Check if an error requires re-authentication
 * 
 * @param {Error|object} error - Error to check
 * @returns {boolean} True if the error requires re-authentication
 */
export function requiresReauth(error) {
  const { type } = categorizeError(error);
  return type === ErrorType.AUTHENTICATION;
}

/**
 * Helper to create specific error types
 */
export const Errors = {
  validation: (message, details = {}) =>
    new AppError(message, ErrorType.VALIDATION, ErrorSeverity.WARNING, details),
  
  authentication: (message = "Authentication required") =>
    new AppError(message, ErrorType.AUTHENTICATION, ErrorSeverity.ERROR),
  
  authorization: (message = "Permission denied") =>
    new AppError(message, ErrorType.AUTHORIZATION, ErrorSeverity.ERROR),
  
  notFound: (resource = "Resource") =>
    new AppError(`${resource} not found`, ErrorType.NOT_FOUND, ErrorSeverity.WARNING),
  
  conflict: (message = "Resource conflict") =>
    new AppError(message, ErrorType.CONFLICT, ErrorSeverity.WARNING),
  
  rateLimit: (message = "Rate limit exceeded") =>
    new AppError(message, ErrorType.RATE_LIMIT, ErrorSeverity.WARNING),
  
  server: (message = "Internal server error") =>
    new AppError(message, ErrorType.SERVER, ErrorSeverity.ERROR),
  
  network: (message = "Network error") =>
    new AppError(message, ErrorType.NETWORK, ErrorSeverity.WARNING),
  
  timeout: (message = "Request timed out") =>
    new AppError(message, ErrorType.TIMEOUT, ErrorSeverity.WARNING),
};

logger.debug("[Error Constants] Unified error constants loaded");

export default {
  ErrorType,
  ErrorSeverity,
  StatusCodeToErrorType,
  ErrorMessages,
  ErrorTypeSeverity,
  AppError,
  categorizeError,
  createErrorResponse,
  isRetryableError,
  requiresReauth,
  Errors,
};

/**
 * Error Message Constants
 *
 * Centralized error messages for consistent UX across the application.
 * Used by error handling utilities to provide user-friendly messages.
 *
 * @example
 * import { ERROR_MESSAGES } from '@core/constants/error.constants';
 * const message = ERROR_MESSAGES.NETWORK;
 */

/**
 * Generic error messages
 */
export const ERROR_MESSAGES = {
  // Generic
  GENERIC: "An unexpected error occurred. Please try again.",
  UNKNOWN: "Something went wrong. Please try again.",

  // Network
  NETWORK: "Network error. Please check your connection and try again.",
  OFFLINE:
    "You're offline. Actions will be synced when connection is restored.",
  TIMEOUT: "Request timed out. Please try again.",

  // Authentication & Authorization
  UNAUTHORIZED: "Your session has expired. Please log in again.",
  FORBIDDEN: "You don't have permission to perform this action.",
  AUTH_FAILED: "Authentication failed. Please log in again.",

  // Not Found
  NOT_FOUND: "The requested resource was not found.",
  RESOURCE_NOT_FOUND: "The requested data could not be found.",

  // Server Errors
  SERVER_ERROR: "Server error. Please try again later.",
  SERVICE_UNAVAILABLE:
    "Service is currently unavailable. Please try again later.",
  BAD_GATEWAY: "Service temporarily unavailable. Please try again.",

  // Client Errors
  BAD_REQUEST: "Invalid request. Please check your input.",
  CONFLICT: "Conflict detected. The resource may have been modified.",
  TOO_MANY_REQUESTS: "Too many requests. Please wait a moment.",

  // Validation
  VALIDATION_FAILED: "Please check your input and try again.",
  REQUIRED_FIELD: "This field is required.",
  INVALID_INPUT: "Invalid input. Please check your data.",

  // Data Operations
  SAVE_FAILED: "Failed to save. Please try again.",
  LOAD_FAILED: "Failed to load data. Please try again.",
  DELETE_FAILED: "Failed to delete. Please try again.",
  UPDATE_FAILED: "Failed to update. Please try again.",
  CREATE_FAILED: "Failed to create. Please try again.",
} as const;

/**
 * HTTP status code to error message mapping
 */
export const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: ERROR_MESSAGES.BAD_REQUEST,
  401: ERROR_MESSAGES.UNAUTHORIZED,
  403: ERROR_MESSAGES.FORBIDDEN,
  404: ERROR_MESSAGES.NOT_FOUND,
  408: ERROR_MESSAGES.TIMEOUT,
  409: ERROR_MESSAGES.CONFLICT,
  429: ERROR_MESSAGES.TOO_MANY_REQUESTS,
  500: ERROR_MESSAGES.SERVER_ERROR,
  502: ERROR_MESSAGES.BAD_GATEWAY,
  503: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
  504: ERROR_MESSAGES.TIMEOUT,
};

/**
 * Error type categories (matching backend ErrorType values)
 */
export enum ErrorType {
  // Frontend-specific types
  NETWORK = "network",
  CLIENT = "client",

  // Backend errorType values (from error-handler.cjs)
  VALIDATION = "validation_error",
  AUTHENTICATION = "authentication_error",
  AUTHORIZATION = "authorization_error",
  NOT_FOUND = "not_found",
  METHOD_NOT_ALLOWED = "method_not_allowed",
  CONFLICT = "conflict",
  RATE_LIMIT = "rate_limit_exceeded",
  SERVER = "server_error",
  DATABASE = "database_error",
  TIMEOUT = "timeout_error",
  UNKNOWN = "unknown_error",
}

/**
 * Map backend errorType strings to ErrorType enum
 */
export const ERROR_TYPE_MAP: Record<string, ErrorType> = {
  validation_error: ErrorType.VALIDATION,
  authentication_error: ErrorType.AUTHENTICATION,
  authorization_error: ErrorType.AUTHORIZATION,
  not_found: ErrorType.NOT_FOUND,
  method_not_allowed: ErrorType.METHOD_NOT_ALLOWED,
  conflict: ErrorType.CONFLICT,
  rate_limit_exceeded: ErrorType.RATE_LIMIT,
  server_error: ErrorType.SERVER,
  database_error: ErrorType.DATABASE,
  timeout_error: ErrorType.TIMEOUT,
  unknown_error: ErrorType.UNKNOWN,
};

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = "info",
  WARN = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

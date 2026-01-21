/**
 * Error handling utility functions
 *
 * Centralized error extraction and formatting
 * Eliminates duplicated `error instanceof Error` patterns across 50+ files
 *
 * PREFERRED: Use these utilities for all error handling in Angular components/services.
 * DEPRECATED: ErrorHandlerUtil.extractErrorMessage (use getErrorMessage instead)
 */

import { isDevMode } from "@angular/core";
import {
  ERROR_MESSAGES,
  HTTP_ERROR_MESSAGES,
  ErrorType,
  ERROR_TYPE_MAP,
} from "../../core/constants/error.constants";

/**
 * API error response structure from backend
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  errorType?: string;
  timestamp?: string;
  requestId?: string;
  errors?: string[];
}

/**
 * Extract a user-friendly error message from any error type
 *
 * Handles:
 * - Error instances
 * - Objects with message property
 * - Objects with error property (API responses)
 * - Objects with errorType property (backend API responses)
 * - HTTP status codes
 * - String errors
 * - Unknown errors
 *
 * @example
 * try { ... }
 * catch (error) {
 *   const message = getErrorMessage(error, "Failed to save data");
 *   this.toastService.error(message);
 * }
 */
export function getErrorMessage(
  error: unknown,
  fallback: string = ERROR_MESSAGES.GENERIC,
): string {
  // Error instance
  if (error instanceof Error) {
    return error.message;
  }

  // Object with message property
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }

  // Object with error property (common API response pattern)
  if (error && typeof error === "object" && "error" in error) {
    const apiError = (error as { error: unknown }).error;
    if (typeof apiError === "string") {
      return apiError;
    }
    if (apiError && typeof apiError === "object" && "message" in apiError) {
      return String((apiError as { message: unknown }).message);
    }
  }

  // HTTP status code handling
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;
    return getHttpErrorMessage(status);
  }

  // String error
  if (typeof error === "string") {
    return error;
  }

  return fallback;
}

/**
 * Extract error type from API error response
 *
 * @example
 * const errorType = getErrorType(error);
 * if (errorType === ErrorType.AUTHENTICATION) {
 *   // Redirect to login
 * }
 */
export function getErrorType(error: unknown): ErrorType {
  // Check for errorType field (backend API response)
  if (error && typeof error === "object" && "errorType" in error) {
    const errorTypeStr = (error as { errorType: unknown }).errorType;
    if (typeof errorTypeStr === "string" && errorTypeStr in ERROR_TYPE_MAP) {
      return ERROR_TYPE_MAP[errorTypeStr];
    }
  }

  // Check nested error object
  if (error && typeof error === "object" && "error" in error) {
    const nested = (error as { error: unknown }).error;
    if (nested && typeof nested === "object" && "errorType" in nested) {
      const errorTypeStr = (nested as { errorType: unknown }).errorType;
      if (typeof errorTypeStr === "string" && errorTypeStr in ERROR_TYPE_MAP) {
        return ERROR_TYPE_MAP[errorTypeStr];
      }
    }
  }

  // Fallback to HTTP status-based detection
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;
    switch (status) {
      case 400:
        return ErrorType.VALIDATION;
      case 401:
        return ErrorType.AUTHENTICATION;
      case 403:
        return ErrorType.AUTHORIZATION;
      case 404:
        return ErrorType.NOT_FOUND;
      case 405:
        return ErrorType.METHOD_NOT_ALLOWED;
      case 409:
        return ErrorType.CONFLICT;
      case 429:
        return ErrorType.RATE_LIMIT;
      case 500:
      case 502:
      case 503:
        return ErrorType.SERVER;
      case 504:
        return ErrorType.TIMEOUT;
    }
  }

  // Check for network errors
  if (isNetworkError(error)) {
    return ErrorType.NETWORK;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Extract requestId from error response for logging/debugging
 */
export function getRequestId(error: unknown): string | null {
  if (error && typeof error === "object" && "requestId" in error) {
    return String((error as { requestId: unknown }).requestId);
  }
  if (error && typeof error === "object" && "error" in error) {
    const nested = (error as { error: unknown }).error;
    if (nested && typeof nested === "object" && "requestId" in nested) {
      return String((nested as { requestId: unknown }).requestId);
    }
  }
  return null;
}

/**
 * Get user-friendly message based on error type
 */
export function getMessageForErrorType(errorType: ErrorType): string {
  switch (errorType) {
    case ErrorType.VALIDATION:
      return ERROR_MESSAGES.VALIDATION_FAILED;
    case ErrorType.AUTHENTICATION:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case ErrorType.AUTHORIZATION:
      return ERROR_MESSAGES.FORBIDDEN;
    case ErrorType.NOT_FOUND:
      return ERROR_MESSAGES.NOT_FOUND;
    case ErrorType.METHOD_NOT_ALLOWED:
      return ERROR_MESSAGES.BAD_REQUEST;
    case ErrorType.CONFLICT:
      return ERROR_MESSAGES.CONFLICT;
    case ErrorType.RATE_LIMIT:
      return ERROR_MESSAGES.TOO_MANY_REQUESTS;
    case ErrorType.SERVER:
    case ErrorType.DATABASE:
      return ERROR_MESSAGES.SERVER_ERROR;
    case ErrorType.TIMEOUT:
      return ERROR_MESSAGES.TIMEOUT;
    case ErrorType.NETWORK:
      return ERROR_MESSAGES.NETWORK;
    default:
      return ERROR_MESSAGES.GENERIC;
  }
}

/**
 * Get user-friendly message for HTTP status codes
 * Uses centralized error constants
 */
export function getHttpErrorMessage(status: number): string {
  return HTTP_ERROR_MESSAGES[status] || `HTTP error ${status}`;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const networkPatterns = [
      /failed to fetch/i,
      /network error/i,
      /net::err/i,
      /timeout/i,
      /offline/i,
      /connection refused/i,
    ];
    return networkPatterns.some((pattern) => pattern.test(error.message));
  }
  return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;
    return status === 401 || status === 403;
  }
  if (error instanceof Error) {
    return /unauthorized|forbidden|auth|session expired/i.test(error.message);
  }
  return false;
}

/**
 * Check if error is an abort error (from AbortController)
 */
export function isAbortError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === "AbortError";
  }
  return false;
}

/**
 * Log error with consistent formatting
 */
export function logError(
  context: string,
  error: unknown,
  logger?: { error: (msg: string, ...args: unknown[]) => void },
): void {
  const message = getErrorMessage(error);
  const logMessage = `[${context}] ${message}`;

  if (logger) {
    logger.error(logMessage, error);
  } else if (isDevMode()) {
    console.error(logMessage, error);
  }
}

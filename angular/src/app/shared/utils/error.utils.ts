/**
 * Error handling utility functions
 *
 * Centralized error extraction and formatting
 * Eliminates duplicated `error instanceof Error` patterns across 50+ files
 *
 * PREFERRED: Use these utilities for all error handling in Angular components/services.
 * DEPRECATED: ErrorHandlerUtil.extractErrorMessage (use getErrorMessage instead)
 */

import { ERROR_MESSAGES, HTTP_ERROR_MESSAGES } from "../../core/constants/error.constants";

/**
 * Extract a user-friendly error message from any error type
 *
 * Handles:
 * - Error instances
 * - Objects with message property
 * - Objects with error property (API responses)
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
  fallback: string = ERROR_MESSAGES.GENERIC
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
  logger?: { error: (msg: string, ...args: unknown[]) => void }
): void {
  const message = getErrorMessage(error);
  const logMessage = `[${context}] ${message}`;

  if (logger) {
    logger.error(logMessage, error);
  } else {
    console.error(logMessage, error);
  }
}

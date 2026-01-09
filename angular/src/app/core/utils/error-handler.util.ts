/**
 * Error Handler Utilities
 *
 * DEPRECATED: This class is maintained for backward compatibility.
 *
 * PREFERRED: Use error handling utilities from `shared/utils/error.utils.ts`:
 * - `getErrorMessage()` instead of `extractErrorMessage()`
 * - `getHttpErrorMessage()` for HTTP status codes
 * - `isNetworkError()`, `isAuthError()` for error type checking
 *
 * Error messages should use constants from `core/constants/error.constants.ts`
 *
 * Migration guide:
 * - Replace `ErrorHandlerUtil.extractErrorMessage(error, fallback)`
 *   with `getErrorMessage(error, fallback)`
 * - Replace `ErrorHandlerUtil.createErrorMessage(detail)`
 *   with toast service using `TOAST.ERROR.*` constants
 */

import { getErrorMessage } from "../../shared/utils/error.utils";

export interface ValidationError {
  severity: "warn" | "error";
  summary: string;
  detail: string;
}

export class ErrorHandlerUtil {
  /**
   * Create validation error message
   * @deprecated Use toast service with TOAST.WARN.REQUIRED_FIELDS instead
   */
  static createValidationError(
    field: string,
    message?: string,
  ): ValidationError {
    return {
      severity: "warn",
      summary: "Validation Error",
      detail: message || `Please fill in ${field}`,
    };
  }

  /**
   * Create success message
   * @deprecated Use toast service with TOAST.SUCCESS.* constants instead
   */
  static createSuccessMessage(detail: string): {
    severity: "success";
    summary: string;
    detail: string;
  } {
    return {
      severity: "success",
      summary: "Success",
      detail,
    };
  }

  /**
   * Create error message
   * @deprecated Use toast service with TOAST.ERROR.* constants instead
   */
  static createErrorMessage(
    detail: string,
    summary: string = "Error",
  ): ValidationError {
    return {
      severity: "error",
      summary,
      detail,
    };
  }

  /**
   * Extract error message from error object
   * @deprecated Use getErrorMessage() from shared/utils/error.utils.ts instead
   */
  static extractErrorMessage(error: unknown, defaultMessage: string): string {
    return getErrorMessage(error, defaultMessage);
  }
}

/**
 * Error Handler Utilities
 * Centralized error handling patterns to avoid duplication
 */

export interface ValidationError {
  severity: "warn" | "error";
  summary: string;
  detail: string;
}

export class ErrorHandlerUtil {
  /**
   * Create validation error message
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
   */
  static extractErrorMessage(error: any, defaultMessage: string): string {
    return error?.message || error?.error || defaultMessage;
  }
}

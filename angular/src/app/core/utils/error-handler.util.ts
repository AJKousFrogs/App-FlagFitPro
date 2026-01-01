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
  static extractErrorMessage(error: unknown, defaultMessage: string): string {
    if (error && typeof error === "object") {
      if ("message" in error && typeof error.message === "string")
        return error.message;
      if ("error" in error && typeof error.error === "string")
        return error.error;
    }
    return defaultMessage;
  }
}

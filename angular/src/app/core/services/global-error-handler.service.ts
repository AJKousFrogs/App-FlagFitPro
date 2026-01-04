/**
 * Error Handler Utility Service
 *
 * Provides error handling utilities for component-level error boundaries.
 * Used by ErrorBoundaryComponent to display user-friendly error messages.
 *
 * Note: This is NOT Angular's global ErrorHandler (that's GlobalErrorHandler in error-tracking.service.ts).
 * This service provides utility methods for error processing and display.
 *
 * Features:
 * - PII redaction from error messages (emails, UUIDs, tokens, etc.)
 * - User-friendly error message generation
 * - Error log buffer for debugging
 * - Critical error detection
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { Injectable, inject, NgZone } from "@angular/core";
import { Router } from "@angular/router";
import { LoggerService } from "./logger.service";

export interface RedactedError {
  timestamp: string;
  errorType: string;
  message: string;
  componentName?: string;
  route?: string;
  stackTrace?: string;
  userAction?: string;
}

@Injectable({
  providedIn: "root",
})
export class GlobalErrorHandlerService {
  private zone = inject(NgZone);
  private router = inject(Router);
  private logger = inject(LoggerService);

  // Error log buffer (in-memory, no PII)
  private errorLog: RedactedError[] = [];
  private readonly MAX_ERROR_LOG_SIZE = 50;

  // Patterns to redact from error messages
  private readonly REDACT_PATTERNS = [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Email
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, // UUID
    /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*/g, // JWT tokens
    /password['":\s]*['"][^'"]+['"]/gi, // Password fields
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone numbers
  ];

  /**
   * Process and log an error (called by ErrorBoundaryComponent)
   */
  handleError(error: unknown): void {
    // Run outside Angular zone to prevent change detection loops
    this.zone.runOutsideAngular(() => {
      const redactedError = this.createRedactedError(error);
      this.logError(redactedError);

      // Log using LoggerService (redacted for PII safety)
      this.logger.error(
        "[ErrorHandler] Caught error:",
        redactedError.message,
        "Type:", redactedError.errorType,
        "Route:", redactedError.route
      );

      // Check if this is a critical error that should show recovery UI
      if (this.isCriticalError(error)) {
        this.logger.error(
          "[ErrorHandler] Critical error detected - recovery may be needed"
        );
      }
    });
  }

  /**
   * Create a redacted error object safe for logging
   */
  private createRedactedError(error: unknown): RedactedError {
    const now = new Date().toISOString();
    const route = this.router.url || "unknown";

    let errorType = "Unknown";
    let message = "An unexpected error occurred";
    let stackTrace: string | undefined;

    if (error instanceof Error) {
      errorType = error.name || "Error";
      message = this.redactMessage(error.message);
      stackTrace = this.redactMessage(error.stack || "");
    } else if (typeof error === "string") {
      errorType = "StringError";
      message = this.redactMessage(error);
    } else if (error && typeof error === "object") {
      errorType = "ObjectError";
      try {
        message = this.redactMessage(JSON.stringify(error));
      } catch {
        message = "Non-serializable error object";
      }
    }

    return {
      timestamp: now,
      errorType,
      message,
      route,
      stackTrace,
    };
  }

  /**
   * Redact sensitive information from error messages
   */
  private redactMessage(message: string): string {
    let redacted = message;
    for (const pattern of this.REDACT_PATTERNS) {
      redacted = redacted.replace(pattern, "[REDACTED]");
    }
    return redacted;
  }

  /**
   * Log error to internal buffer
   */
  private logError(error: RedactedError): void {
    this.errorLog.push(error);

    // Keep buffer size manageable
    if (this.errorLog.length > this.MAX_ERROR_LOG_SIZE) {
      this.errorLog.shift();
    }
  }

  /**
   * Check if error is critical (would cause white screen)
   */
  private isCriticalError(error: unknown): boolean {
    if (error instanceof Error) {
      const criticalPatterns = [
        /cannot read propert/i,
        /undefined is not/i,
        /null is not/i,
        /is not a function/i,
        /maximum call stack/i,
        /chunk.*failed/i,
        /loading chunk/i,
      ];
      return criticalPatterns.some((p) => p.test(error.message));
    }
    return false;
  }

  /**
   * Get recent errors (for debugging/support)
   */
  getRecentErrors(): RedactedError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: unknown): string {
    if (error instanceof Error) {
      // Network errors
      if (
        error.message.includes("NetworkError") ||
        error.message.includes("fetch")
      ) {
        return "Unable to connect to the server. Please check your internet connection.";
      }
      // Auth errors
      if (
        error.message.includes("401") ||
        error.message.includes("unauthorized")
      ) {
        return "Your session has expired. Please log in again.";
      }
      // Not found
      if (
        error.message.includes("404") ||
        error.message.includes("not found")
      ) {
        return "The requested data could not be found.";
      }
      // Server errors
      if (error.message.includes("500") || error.message.includes("server")) {
        return "The server encountered an error. Please try again later.";
      }
    }
    return "Something went wrong. Please try again.";
  }
}

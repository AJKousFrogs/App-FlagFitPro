/**
 * Angular Logger Service
 * Provides consistent logging with environment-aware levels for Angular components
 * Enhanced with structured logging, context tracking, and log aggregation
 *
 * @module core/services/logger
 * @version 2.0.0
 */

import { Injectable } from "@angular/core";
import { isDevMode } from "@angular/core";

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  teamId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

export interface StructuredLog {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  timestamp: string;
  context?: LogContext;
  data?: unknown;
  error?: Error;
}

@Injectable({
  providedIn: "root",
})
export class LoggerService {
  private isDevelopment = isDevMode();
  private logLevel: "debug" | "info" | "warn" | "error" | "silent" = this
    .isDevelopment
    ? "debug"
    : "error";

  // Log buffer for error recovery and debugging
  private logBuffer: StructuredLog[] = [];
  private readonly MAX_BUFFER_SIZE = 100;

  // Global context that applies to all logs
  private globalContext: LogContext = {};

  /**
   * Set log level: 'debug', 'info', 'warn', 'error', 'silent'
   * @param level - Log level to set
   */
  setLevel(level: "debug" | "info" | "warn" | "error" | "silent"): void {
    this.logLevel = level;
  }

  /**
   * Set global context for all subsequent logs
   * @param context - Context object to merge with global context
   */
  setGlobalContext(context: Partial<LogContext>): void {
    this.globalContext = { ...this.globalContext, ...context };
  }

  /**
   * Clear global context
   */
  clearGlobalContext(): void {
    this.globalContext = {};
  }

  /**
   * Get recent logs from buffer (useful for debugging)
   * @param count - Number of recent logs to return
   */
  getRecentLogs(count: number = 50): StructuredLog[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Clear log buffer
   */
  clearLogBuffer(): void {
    this.logBuffer = [];
  }

  /**
   * Check if level should be logged
   * @param level - Log level to check
   * @returns Whether the level should be logged
   */
  private shouldLog(level: "debug" | "info" | "warn" | "error"): boolean {
    if (this.logLevel === "silent") return false;

    const levels: ("debug" | "info" | "warn" | "error")[] = [
      "debug",
      "info",
      "warn",
      "error",
    ];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Add log to buffer
   */
  private addToBuffer(log: StructuredLog): void {
    this.logBuffer.push(log);
    if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logBuffer.shift(); // Remove oldest log
    }
  }

  /**
   * Create structured log entry
   */
  private createLog(
    level: "debug" | "info" | "warn" | "error",
    message: string,
    context?: LogContext,
    data?: unknown,
    error?: Error,
  ): StructuredLog {
    const log: StructuredLog = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.globalContext, ...context },
    };

    if (data !== undefined) {
      log.data = data;
    }

    if (error) {
      log.error = error;
    }

    this.addToBuffer(log);
    return log;
  }

  /**
   * Redact sensitive information from log data
   */
  private redactSensitiveData(data: unknown): unknown {
    if (typeof data !== "object" || data === null) {
      return data;
    }

    const sensitiveKeys = [
      "password",
      "token",
      "secret",
      "apiKey",
      "ssn",
      "creditCard",
      "cvv",
    ];

    const redacted = { ...data } as Record<string, unknown>;

    for (const key in redacted) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        redacted[key] = "[REDACTED]";
      } else if (typeof redacted[key] === "object" && redacted[key] !== null) {
        redacted[key] = this.redactSensitiveData(redacted[key]);
      }
    }

    return redacted;
  }

  /**
   * Debug logging (development only)
   * @param message - Log message
   * @param context - Optional context
   * @param data - Optional data to log
   */
  debug(message: string, context?: LogContext, data?: unknown): void {
    if (!this.shouldLog("debug")) return;

    const log = this.createLog(
      "debug",
      message,
      context,
      this.redactSensitiveData(data),
    );

    if (this.isDevelopment) {
      console.log(
        "🔍 [DEBUG]",
        log.message,
        log.context,
        log.data !== undefined ? log.data : "",
      );
    }
  }

  /**
   * Info logging
   * @param message - Log message
   * @param context - Optional context
   * @param data - Optional data to log
   */
  info(message: string, context?: LogContext, data?: unknown): void {
    if (!this.shouldLog("info")) return;

    const log = this.createLog(
      "info",
      message,
      context,
      this.redactSensitiveData(data),
    );

    if (this.isDevelopment) {
      console.log(
        "ℹ️ [INFO]",
        log.message,
        log.context,
        log.data !== undefined ? log.data : "",
      );
    }
  }

  /**
   * Warning logging
   * @param message - Log message
   * @param context - Optional context
   * @param data - Optional data to log
   */
  warn(message: string, context?: LogContext, data?: unknown): void {
    if (!this.shouldLog("warn")) return;

    const log = this.createLog(
      "warn",
      message,
      context,
      this.redactSensitiveData(data),
    );

    console.warn("⚠️ [WARN]", log.message, log.context, log.data);
  }

  /**
   * Error logging (always logged except in silent mode)
   * @param message - Error message
   * @param error - Error object
   * @param context - Optional context
   * @param data - Optional additional data
   */
  error(
    message: string,
    error?: Error,
    context?: LogContext,
    data?: unknown,
  ): void {
    if (!this.shouldLog("error")) return;

    const log = this.createLog(
      "error",
      message,
      context,
      this.redactSensitiveData(data),
      error,
    );

    console.error("❌ [ERROR]", log.message, log.context);
    if (log.error) {
      console.error("Error details:", log.error);
    }
    if (log.data) {
      console.error("Additional data:", log.data);
    }

    // In production, send to error tracking service
    if (!this.isDevelopment) {
      this.sendToErrorTracking(log);
    }
  }

  /**
   * Success logging (info level)
   * @param message - Success message
   * @param context - Optional context
   * @param data - Optional data
   */
  success(message: string, context?: LogContext, data?: unknown): void {
    if (!this.shouldLog("info")) return;

    const log = this.createLog(
      "info",
      message,
      context,
      this.redactSensitiveData(data),
    );

    if (this.isDevelopment) {
      console.log("✅ [SUCCESS]", log.message, log.context, log.data);
    }
  }

  /**
   * Performance logging for monitoring slow operations
   * @param operationName - Name of the operation
   * @param durationMs - Duration in milliseconds
   * @param context - Optional context
   */
  performance(
    operationName: string,
    durationMs: number,
    context?: LogContext,
  ): void {
    const level = durationMs > 1000 ? "warn" : "info";

    if (!this.shouldLog(level)) return;

    const log = this.createLog(
      level,
      `Performance: ${operationName}`,
      context,
      { durationMs },
    );

    if (this.isDevelopment || level === "warn") {
      const emoji = durationMs > 1000 ? "🐌" : "⚡";
      console.log(emoji, `[PERF] ${operationName}: ${durationMs}ms`, context);
    }
  }

  /**
   * Send error to external tracking service (Sentry, etc.)
   * @param log - Structured log entry
   */
  private sendToErrorTracking(log: StructuredLog): void {
    // TODO: Integrate with error tracking service
    // Example: Sentry.captureException(log.error, { contexts: log.context });

    // For now, just ensure it's logged to console
    if (!this.isDevelopment) {
      console.error("[Error Tracking]", JSON.stringify(log));
    }
  }
}

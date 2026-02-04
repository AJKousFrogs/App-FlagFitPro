/**
 * Angular Logger Service
 * Provides consistent logging with environment-aware levels for Angular components
 * Enhanced with structured logging, context tracking, and log aggregation
 *
 * @module core/logging/logger
 * @version 2.0.0
 */

import { Inject, Injectable, Optional, isDevMode } from "@angular/core";

import type { LogLevel, Logger } from "@core/logging/logger";
import { LOGGER } from "@core/logging/logger.token";

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  teamId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

/**
 * Helper to convert any value to LogContext
 * @param value - Value to convert
 * @returns LogContext object
 */
export function toLogContext(value: unknown): LogContext {
  if (!value) return {};
  if (typeof value === "string") return { message: value };
  if (typeof value === "object" && value !== null) {
    // If it's already a plain object, try to use it
    if (Object.getPrototypeOf(value) === Object.prototype) {
      return value as LogContext;
    }
    // For complex objects (errors, etc.), extract useful info
    const ctx: LogContext = {};
    if ("message" in value) ctx.message = String(value.message);
    if ("code" in value) ctx.code = String(value.code);
    if ("name" in value) ctx.name = String(value.name);
    return ctx;
  }
  return { value: String(value) };
}

export interface StructuredLog {
  level: "debug" | "info" | "warning" | "error";
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
  private logLevel: "debug" | "info" | "warning" | "error" | "silent" = this
    .isDevelopment
    ? "debug"
    : "error";

  // Log buffer for error recovery and debugging
  private logBuffer: StructuredLog[] = [];
  private readonly MAX_BUFFER_SIZE = 100;

  // Global context that applies to all logs
  private globalContext: LogContext = {};

  constructor(@Optional() @Inject(LOGGER) private readonly adapter?: Logger) {}

  /**
   * Set log level: 'debug', 'info', 'warn', 'error', 'silent'
   * @param level - Log level to set
   */
  setLevel(level: "debug" | "info" | "warning" | "error" | "silent"): void {
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
  private shouldLog(level: "debug" | "info" | "warning" | "error"): boolean {
    if (this.logLevel === "silent") return false;

    const levels: ("debug" | "info" | "warning" | "error")[] = [
      "debug",
      "info",
      "warning",
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
    level: "debug" | "info" | "warning" | "error",
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

  private emitToAdapter(
    level: "debug" | "info" | "warning" | "error",
    message: string,
    context?: LogContext,
    data?: unknown,
  ): void {
    const logger = this.adapter;
    if (!logger) return;

    const meta = { context, data };
    const logLevel: LogLevel = level === "warning" ? "warn" : level;
    logger[logLevel](message, meta);
  }

  /**
   * Normalize context parameter to LogContext
   */
  private normalizeContext(context?: unknown): LogContext | undefined {
    if (context === undefined || context === null) {
      return undefined;
    }

    // If it's already a valid LogContext, return it
    if (typeof context === "object" && !Array.isArray(context)) {
      return context as LogContext;
    }

    // Wrap primitive values
    if (
      typeof context === "string" ||
      typeof context === "number" ||
      typeof context === "boolean"
    ) {
      return { data: context };
    }

    // For arrays or other types, stringify
    return { data: String(context) };
  }

  /**
   * Normalize error parameter to Error object
   */
  private normalizeError(error?: unknown): Error | undefined {
    if (error === undefined || error === null) {
      return undefined;
    }

    if (error instanceof Error) {
      return error;
    }

    if (typeof error === "string") {
      return new Error(error);
    }

    if (typeof error === "object") {
      // Handle PostgrestError and similar objects
      if ("message" in error && typeof error.message === "string") {
        const err = new Error(error.message);
        type ErrorWithDetails = Error & {
          code?: string | number;
          details?: unknown;
        };
        if ("code" in error) {
          (err as ErrorWithDetails).code = (error as { code?: string | number })
            .code;
        }
        if ("details" in error) {
          (err as ErrorWithDetails).details = (error as { details?: unknown })
            .details;
        }
        return err;
      }
    }

    return new Error(String(error));
  }

  /**
   * Debug logging (development only)
   * @param message - Log message
   * @param context - Optional context
   * @param data - Optional data to log
   */
  debug(message: string, context?: unknown, data?: unknown): void {
    if (!this.shouldLog("debug")) return;

    const normalizedContext = this.normalizeContext(context);
    const sanitizedData = this.redactSensitiveData(data);

    this.createLog("debug", message, normalizedContext, sanitizedData);
    this.emitToAdapter("debug", message, normalizedContext, sanitizedData);
  }

  /**
   * Info logging
   * @param message - Log message
   * @param context - Optional context
   * @param data - Optional data to log
   */
  info(message: string, context?: unknown, data?: unknown): void {
    if (!this.shouldLog("info")) return;

    const normalizedContext = this.normalizeContext(context);
    const sanitizedData = this.redactSensitiveData(data);

    this.createLog("info", message, normalizedContext, sanitizedData);
    this.emitToAdapter("info", message, normalizedContext, sanitizedData);
  }

  /**
   * Warning logging
   * @param message - Log message
   * @param context - Optional context
   * @param data - Optional data to log
   */
  warn(message: string, context?: unknown, data?: unknown): void {
    if (!this.shouldLog("warning")) return;

    const normalizedContext = this.normalizeContext(context);
    const sanitizedData = this.redactSensitiveData(data);

    this.createLog("warning", message, normalizedContext, sanitizedData);
    this.emitToAdapter("warning", message, normalizedContext, sanitizedData);
  }

  /**
   * Error logging (always logged except in silent mode)
   * @param message - Error message
   * @param error - Error object or unknown error
   * @param context - Optional context
   * @param data - Optional additional data
   */
  error(
    message: string,
    error?: unknown,
    context?: unknown,
    data?: unknown,
  ): void {
    if (!this.shouldLog("error")) return;

    const normalizedError = this.normalizeError(error);
    const normalizedContext = this.normalizeContext(context);
    const sanitizedData = this.redactSensitiveData(data);
    const log = this.createLog(
      "error",
      message,
      normalizedContext,
      sanitizedData,
      normalizedError,
    );

    // In production, send to error tracking service
    if (!this.isDevelopment) {
      this.sendToErrorTracking(log);
    }
    this.emitToAdapter("error", message, normalizedContext, sanitizedData);
  }

  /**
   * Success logging (info level)
   * @param message - Success message
   * @param context - Optional context
   * @param data - Optional data
   */
  success(message: string, context?: unknown, data?: unknown): void {
    if (!this.shouldLog("info")) return;

    const normalizedContext = this.normalizeContext(context);
    const sanitizedData = this.redactSensitiveData(data);

    this.createLog("info", message, normalizedContext, sanitizedData);
    this.emitToAdapter("info", message, normalizedContext, sanitizedData);
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
    const level = durationMs > 1000 ? "warning" : "info";

    if (!this.shouldLog(level)) return;

    const data = this.redactSensitiveData({ durationMs });
    this.createLog(level, `Performance: ${operationName}`, context, data);
    this.emitToAdapter(level, `Performance: ${operationName}`, context, data);
  }

  /**
   * Send error to external tracking service (Sentry, etc.)
   * @param log - Structured log entry
   */
  private sendToErrorTracking(_log: StructuredLog): void {
    // TODO: Integrate with error tracking service
    // Example: Sentry.captureException(log.error, { contexts: log.context });
  }
}

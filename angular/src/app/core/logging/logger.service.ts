/**
 * Angular structured logger — JSON lines with `event_name`, PII redaction, optional trace correlation.
 */

import { Injectable, inject, isDevMode } from "@angular/core";

import {
  createStructuredLogEntry,
  type LogLevel,
  type StructuredJsonLogEntry,
} from "@core/logging/logger";
import { LOGGER } from "@core/logging/logger.token";
import { redactForLog } from "@core/logging/redact-pii.util";
import { CorrelationContextService } from "@core/services/correlation-context.service";

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  teamId?: string;
  sessionId?: string;
  trace_id?: string;
  [key: string]: unknown;
}

/**
 * Helper to convert any value to LogContext
 */
export function toLogContext(value: unknown): LogContext {
  if (!value) return {};
  if (typeof value === "string") return { message: value };
  if (typeof value === "object" && value !== null) {
    if (Object.getPrototypeOf(value) === Object.prototype) {
      return value as LogContext;
    }
    const ctx: LogContext = {};
    if ("message" in value) ctx.message = String(value.message);
    if ("code" in value) ctx.code = String(value.code);
    if ("name" in value) ctx.name = String(value.name);
    return ctx;
  }
  return { value: String(value) };
}

/** @deprecated Prefer StructuredJsonLogEntry from `./logger` */
export type StructuredLog = StructuredJsonLogEntry;

type InternalLevel = "debug" | "info" | "warning" | "error";

@Injectable({
  providedIn: "root",
})
export class LoggerService {
  private readonly adapter = this.resolveAdapter();
  private readonly correlation = this.resolveCorrelation();
  private isDevelopment = isDevMode();
  private logLevel: InternalLevel | "silent" = this.isDevelopment
    ? "debug"
    : "error";

  private logBuffer: StructuredJsonLogEntry[] = [];
  private readonly MAX_BUFFER_SIZE = 100;

  private globalContext: LogContext = {};

  private resolveAdapter() {
    try {
      return inject(LOGGER, { optional: true });
    } catch {
      return null;
    }
  }

  private resolveCorrelation(): CorrelationContextService | null {
    try {
      return inject(CorrelationContextService, { optional: true }) ?? null;
    } catch {
      return null;
    }
  }

  setLevel(level: InternalLevel | "silent"): void {
    this.logLevel = level;
  }

  setGlobalContext(context: Partial<LogContext>): void {
    this.globalContext = { ...this.globalContext, ...context };
  }

  clearGlobalContext(): void {
    this.globalContext = {};
  }

  getRecentLogs(count = 50): StructuredJsonLogEntry[] {
    return this.logBuffer.slice(-count);
  }

  clearLogBuffer(): void {
    this.logBuffer = [];
  }

  private shouldLog(level: InternalLevel): boolean {
    if (this.logLevel === "silent") return false;

    const levels: InternalLevel[] = ["debug", "info", "warning", "error"];
    const currentLevelIndex = levels.indexOf(this.logLevel as InternalLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  private pushBuffer(entry: StructuredJsonLogEntry): void {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logBuffer.shift();
    }
  }

  private toJsonLevel(level: InternalLevel): LogLevel {
    return level === "warning" ? "warn" : level;
  }

  private normalizeContext(context?: unknown): LogContext | undefined {
    if (context === undefined || context === null) {
      return undefined;
    }

    if (typeof context === "object" && !Array.isArray(context)) {
      return context as LogContext;
    }

    if (
      typeof context === "string" ||
      typeof context === "number" ||
      typeof context === "boolean"
    ) {
      return { data: context };
    }

    return { data: String(context) };
  }

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

      try {
        const serialized = JSON.stringify(error);
        if (serialized && serialized !== "{}") {
          return new Error(serialized);
        }
      } catch {
        // fall through
      }
    }

    return new Error(String(error));
  }

  private buildContextPayload(
    normalizedContext?: LogContext,
    data?: unknown,
    error?: Error,
  ): Record<string, unknown> {
    const merged: Record<string, unknown> = {
      ...(this.globalContext as Record<string, unknown>),
      ...(normalizedContext as Record<string, unknown> | undefined),
    };

    const traceId = this.correlation?.traceId();
    if (traceId) {
      merged.trace_id = traceId;
    }

    if (data !== undefined) {
      merged.data = data;
    }

    if (error) {
      merged.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error as unknown as { code?: string | number; details?: unknown }),
      };
    }

    return redactForLog(merged) as Record<string, unknown>;
  }

  private emit(
    internalLevel: InternalLevel,
    eventName: string,
    normalizedContext?: LogContext,
    data?: unknown,
    error?: Error,
  ): StructuredJsonLogEntry {
    const sanitizedData = redactForLog(data);
    const normalizedError = error;

    const contextPayload = this.buildContextPayload(
      normalizedContext,
      sanitizedData,
      normalizedError,
    );

    const entry = createStructuredLogEntry(
      this.toJsonLevel(internalLevel),
      eventName,
      contextPayload,
    );

    this.pushBuffer(entry);

    const sink = this.adapter;
    if (sink) {
      sink.write(entry);
    }

    return entry;
  }

  debug(eventName: string, context?: unknown, data?: unknown): void {
    if (!this.shouldLog("debug")) return;

    const normalizedContext = this.normalizeContext(context);
    this.emit("debug", eventName, normalizedContext, data);
  }

  info(eventName: string, context?: unknown, data?: unknown): void {
    if (!this.shouldLog("info")) return;

    const normalizedContext = this.normalizeContext(context);
    this.emit("info", eventName, normalizedContext, data);
  }

  warn(eventName: string, context?: unknown, data?: unknown): void {
    if (!this.shouldLog("warning")) return;

    const normalizedContext = this.normalizeContext(context);
    this.emit("warning", eventName, normalizedContext, data);
  }

  error(
    eventName: string,
    error?: unknown,
    context?: unknown,
    data?: unknown,
  ): void {
    if (!this.shouldLog("error")) return;

    const normalizedError = this.normalizeError(error);
    const normalizedContext = this.normalizeContext(context);
    const entry = this.emit(
      "error",
      eventName,
      normalizedContext,
      data,
      normalizedError,
    );

    if (!this.isDevelopment) {
      this.sendToErrorTracking(entry);
    }
  }

  success(eventName: string, context?: unknown, data?: unknown): void {
    if (!this.shouldLog("info")) return;

    const normalizedContext = this.normalizeContext(context);
    this.emit("info", eventName, normalizedContext, data);
  }

  performance(
    operationName: string,
    durationMs: number,
    context?: LogContext,
  ): void {
    const level: InternalLevel = durationMs > 1000 ? "warning" : "info";

    if (!this.shouldLog(level)) return;

    this.emit(level, "performance_metric", context, {
      operation: operationName,
      durationMs,
    });
  }

  private sendToErrorTracking(_log: StructuredJsonLogEntry): void {
    // Integrate with ErrorTrackingService when configured
  }
}

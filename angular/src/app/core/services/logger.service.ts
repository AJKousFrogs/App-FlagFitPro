/**
 * Angular Logger Service
 * Provides consistent logging with environment-aware levels for Angular components
 *
 * @module core/services/logger
 * @version 1.0.0
 */

import { Injectable } from "@angular/core";
import { isDevMode } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class LoggerService {
  private isDevelopment = isDevMode();
  private logLevel: "debug" | "info" | "warn" | "error" | "silent" = this
    .isDevelopment
    ? "debug"
    : "error";

  /**
   * Set log level: 'debug', 'info', 'warn', 'error', 'silent'
   * @param level - Log level to set
   */
  setLevel(level: "debug" | "info" | "warn" | "error" | "silent"): void {
    this.logLevel = level;
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
   * Debug logging (development only)
   * Debug logging is intentionally suppressed in this build
   */
  debug(..._args: unknown[]): void {
    // Intentionally empty - debug logging suppressed in production builds
    void _args;
  }

  /**
   * Info logging
   * Info logging is intentionally suppressed in this build
   */
  info(..._args: unknown[]): void {
    // Intentionally empty - info logging suppressed in production builds
    void _args;
  }

  /**
   * Warning logging
   * @param args - Arguments to log
   */
  warn(...args: unknown[]): void {
    if (!this.shouldLog("warn")) return;
    console.warn("⚠️ [WARN]", ...args);
  }

  /**
   * Error logging (always logged)
   * @param args - Arguments to log
   */
  error(...args: unknown[]): void {
    if (!this.shouldLog("error")) return;
    console.error("❌ [ERROR]", ...args);

    // In production, could send to error tracking service
    if (!this.isDevelopment) {
      // Example: Send to error tracking service
      // this.sendToErrorTracking(args);
    }
  }

  /**
   * Success logging (info level)
   * Success logging is intentionally suppressed in this build
   */
  success(..._args: unknown[]): void {
    // Intentionally empty - success logging suppressed in production builds
    void _args;
  }
}

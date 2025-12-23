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
   * @param args - Arguments to log
   */
  debug(...args: any[]): void {
    if (!this.shouldLog("debug")) return;
    if (this.isDevelopment) {
      console.log("🔍 [DEBUG]", ...args);
    }
  }

  /**
   * Info logging
   * @param args - Arguments to log
   */
  info(...args: any[]): void {
    if (!this.shouldLog("info")) return;
    if (this.isDevelopment) {
      console.log("ℹ️ [INFO]", ...args);
    }
  }

  /**
   * Warning logging
   * @param args - Arguments to log
   */
  warn(...args: any[]): void {
    if (!this.shouldLog("warn")) return;
    console.warn("⚠️ [WARN]", ...args);
  }

  /**
   * Error logging (always logged)
   * @param args - Arguments to log
   */
  error(...args: any[]): void {
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
   * @param args - Arguments to log
   */
  success(...args: any[]): void {
    if (!this.shouldLog("info")) return;
    if (this.isDevelopment) {
      console.log("✅ [SUCCESS]", ...args);
    }
  }
}

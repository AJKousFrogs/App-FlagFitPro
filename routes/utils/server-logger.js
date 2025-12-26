/**
 * Server-Side Logging Utility for Route Handlers
 * Provides consistent logging with environment-aware levels for Node.js/Express
 *
 * @module routes/utils/server-logger
 * @version 1.0.0
 */

/**
 * Server-side logger class
 * Similar to client-side logger but adapted for Node.js environment
 */
class ServerLogger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== "production";
    this.logLevel = this.isDevelopment ? "debug" : "error";
  }

  /**
   * Set log level: 'debug', 'info', 'warn', 'error', 'silent'
   * @param {string} level - Log level to set
   */
  setLevel(level) {
    this.logLevel = level;
  }

  /**
   * Check if level should be logged
   * @param {string} level - Log level to check
   * @returns {boolean} Whether the level should be logged
   */
  shouldLog(level) {
    if (this.logLevel === "silent") {
      return false;
    }

    const levels = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Debug logging (development only)
   * @param {...any} args - Arguments to log
   */
  debug(...args) {
    if (!this.shouldLog("debug")) {
      return;
    }
    if (this.isDevelopment) {
       
      console.log("🔍 [DEBUG]", ...args);
    }
  }

  /**
   * Info logging
   * @param {...any} args - Arguments to log
   */
  info(...args) {
    if (!this.shouldLog("info")) {
      return;
    }
    if (this.isDevelopment) {
       
      console.log("ℹ️ [INFO]", ...args);
    }
  }

  /**
   * Warning logging
   * @param {...any} args - Arguments to log
   */
  warn(...args) {
    if (!this.shouldLog("warn")) {
      return;
    }
     
    console.warn("⚠️ [WARN]", ...args);
  }

  /**
   * Error logging (always logged)
   * @param {...any} args - Arguments to log
   */
  error(...args) {
    if (!this.shouldLog("error")) {
      return;
    }
     
    console.error("❌ [ERROR]", ...args);

    // In production, could send to error tracking service
    if (!this.isDevelopment) {
      // Example: Send to error tracking service
      // this.sendToErrorTracking(args);
    }
  }

  /**
   * Success logging (info level)
   * @param {...any} args - Arguments to log
   */
  success(...args) {
    if (!this.shouldLog("info")) {
      return;
    }
    if (this.isDevelopment) {
       
      console.log("✅ [SUCCESS]", ...args);
    }
  }
}

// Create singleton instance
export const serverLogger = new ServerLogger();

// Export class for custom instances
export default ServerLogger;




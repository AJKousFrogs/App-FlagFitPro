/**
 * Server-Side Logging Utility for Route Handlers
 * Provides consistent logging with environment-aware levels for Node.js/Express
 * Enhanced with structured logging, request tracking, and security redaction
 *
 * @module routes/utils/server-logger
 * @version 2.0.0
 */

/**
 * Log context interface for structured logging
 */
const createLogContext = (additionalContext = {}) => ({
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || "development",
  ...additionalContext,
});

/**
 * Redact sensitive information from log data
 */
const redactSensitiveData = (data) => {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "apiKey",
    "authorization",
    "cookie",
    "ssn",
    "creditCard",
    "cvv",
    "accessToken",
    "refreshToken",
  ];

  const redacted = { ...data };

  for (const key in redacted) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
      redacted[key] = "[REDACTED]";
    } else if (typeof redacted[key] === "object" && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }

  return redacted;
};

/**
 * Format error for logging
 */
const formatError = (error) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack:
        process.env.NODE_ENV === "development" ? error.stack : undefined,
      ...error,
    };
  }
  return error;
};

/**
 * Server-side logger class
 * Similar to client-side logger but adapted for Node.js environment
 */
class ServerLogger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== "production";
    this.logLevel = this.isDevelopment ? "debug" : "info";
    this.globalContext = {};

    // Log buffer for debugging (limited size)
    this.logBuffer = [];
    this.MAX_BUFFER_SIZE = 100;
  }

  /**
   * Set log level: 'debug', 'info', 'warn', 'error', 'silent'
   * @param {string} level - Log level to set
   */
  setLevel(level) {
    this.logLevel = level;
  }

  /**
   * Set global context for all logs
   * @param {object} context - Context to add to all logs
   */
  setGlobalContext(context) {
    this.globalContext = { ...this.globalContext, ...context };
  }

  /**
   * Clear global context
   */
  clearGlobalContext() {
    this.globalContext = {};
  }

  /**
   * Get recent logs from buffer
   * @param {number} count - Number of logs to return
   * @returns {Array} Recent log entries
   */
  getRecentLogs(count = 50) {
    return this.logBuffer.slice(-count);
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
   * Add log to buffer
   * @param {object} log - Log entry
   */
  addToBuffer(log) {
    this.logBuffer.push(log);
    if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logBuffer.shift();
    }
  }

  /**
   * Create structured log entry
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {object} context - Additional context
   * @param {any} data - Data to log
   * @param {Error} error - Error object
   * @returns {object} Structured log entry
   */
  createLog(level, message, context = {}, data = null, error = null) {
    const log = {
      level,
      message,
      context: createLogContext({ ...this.globalContext, ...context }),
    };

    if (data !== null && data !== undefined) {
      log.data = redactSensitiveData(data);
    }

    if (error) {
      log.error = formatError(error);
    }

    this.addToBuffer(log);
    return log;
  }

  /**
   * Debug logging (development only)
   * @param {string} message - Log message
   * @param {object} context - Optional context
   * @param {any} data - Optional data
   */
  debug(message, context = {}, data = null) {
    if (!this.shouldLog("debug")) {
      return;
    }

    const log = this.createLog("debug", message, context, data);

    if (this.isDevelopment) {
      console.log("🔍 [DEBUG]", log.message, log.context);
      if (log.data) {
        console.log("  Data:", log.data);
      }
    }
  }

  /**
   * Info logging
   * @param {string} message - Log message
   * @param {object} context - Optional context
   * @param {any} data - Optional data
   */
  info(message, context = {}, data = null) {
    if (!this.shouldLog("info")) {
      return;
    }

    const log = this.createLog("info", message, context, data);

    console.log("ℹ️  [INFO]", log.message);
    if (this.isDevelopment && log.context) {
      console.log("  Context:", log.context);
    }
    if (log.data) {
      console.log("  Data:", log.data);
    }
  }

  /**
   * Warning logging
   * @param {string} message - Warning message
   * @param {object} context - Optional context
   * @param {any} data - Optional data
   */
  warn(message, context = {}, data = null) {
    if (!this.shouldLog("warn")) {
      return;
    }

    const log = this.createLog("warn", message, context, data);

    console.warn("⚠️  [WARN]", log.message);
    if (log.context) {
      console.warn("  Context:", log.context);
    }
    if (log.data) {
      console.warn("  Data:", log.data);
    }
  }

  /**
   * Error logging (always logged except in silent mode)
   * @param {string} message - Error message
   * @param {Error} error - Error object
   * @param {object} context - Optional context
   * @param {any} data - Optional additional data
   */
  error(message, error = null, context = {}, data = null) {
    if (!this.shouldLog("error")) {
      return;
    }

    const log = this.createLog("error", message, context, data, error);

    console.error("❌ [ERROR]", log.message);
    if (log.context) {
      console.error("  Context:", log.context);
    }
    if (log.error) {
      console.error("  Error:", log.error);
    }
    if (log.data) {
      console.error("  Data:", log.data);
    }

    // In production, send to error tracking service
    if (!this.isDevelopment) {
      this.sendToErrorTracking(log);
    }
  }

  /**
   * Success logging (info level)
   * @param {string} message - Success message
   * @param {object} context - Optional context
   * @param {any} data - Optional data
   */
  success(message, context = {}, data = null) {
    if (!this.shouldLog("info")) {
      return;
    }

    const log = this.createLog("info", message, context, data);

    if (this.isDevelopment) {
      console.log("✅ [SUCCESS]", log.message);
      if (log.data) {
        console.log("  Data:", log.data);
      }
    }
  }

  /**
   * Performance logging
   * @param {string} operation - Operation name
   * @param {number} durationMs - Duration in milliseconds
   * @param {object} context - Optional context
   */
  performance(operation, durationMs, context = {}) {
    const level = durationMs > 1000 ? "warn" : "info";

    if (!this.shouldLog(level)) {
      return;
    }

    const log = this.createLog(
      level,
      `Performance: ${operation}`,
      context,
      { durationMs, operation },
    );

    const emoji = durationMs > 1000 ? "🐌" : "⚡";
    console.log(`${emoji} [PERF] ${operation}: ${durationMs}ms`);
    if (this.isDevelopment || level === "warn") {
      console.log("  Context:", log.context);
    }
  }

  /**
   * Request logging helper
   * @param {object} req - Express request object
   * @param {string} message - Log message
   * @param {any} data - Optional data
   */
  request(req, message, data = null) {
    const context = {
      method: req.method,
      path: req.path,
      userId: req.user?.id || req.userId,
      requestId: req.id,
      ip: req.ip,
    };

    this.info(message, context, data);
  }

  /**
   * Send error to external tracking service
   * @param {object} log - Structured log entry
   */
  sendToErrorTracking(log) {
    // TODO: Integrate with error tracking service (Sentry, etc.)
    // For now, ensure it's logged in production format
    if (!this.isDevelopment) {
      console.error("[Error Tracking]", JSON.stringify(log));
    }
  }
}

// Create singleton instance
export const serverLogger = new ServerLogger();

// Export class for custom instances
export default ServerLogger;

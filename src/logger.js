/**
 * Centralized Logger for FlagFit Pro
 * Updated: 2024 - Modern JavaScript patterns with structured logging
 * Provides consistent logging across the application with environment-aware output
 */

/**
 * Log levels enum for filtering
 * @readonly
 * @enum {number}
 */
const LogLevel = Object.freeze({
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
});

const isDevelopment =
  typeof window !== "undefined"
    ? window.location?.hostname === "localhost" ||
      window.location?.hostname === "127.0.0.1"
    : typeof process !== "undefined" && process.env?.NODE_ENV !== "production";

// Current log level - can be adjusted at runtime
let currentLogLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

/**
 * Format timestamp for log entries
 * @returns {string} Formatted timestamp
 */
const getTimestamp = () => new Date().toISOString();

/**
 * Create structured log entry
 * @param {string} level - Log level
 * @param {Array} args - Log arguments
 * @returns {Object} Structured log entry
 */
const createLogEntry = (level, args) => ({
  timestamp: getTimestamp(),
  level,
  message: args
    .map((arg) =>
      typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg),
    )
    .join(" "),
  context: typeof window !== "undefined" ? window.location?.pathname : "server",
});

const logger = {
  /** Current log level */
  LogLevel,

  /**
   * Set the minimum log level
   * @param {number} level - LogLevel value
   */
  setLevel(level) {
    currentLogLevel = level;
  },

  /**
   * Get current log level
   * @returns {number} Current LogLevel
   */
  getLevel() {
    return currentLogLevel;
  },

  /**
   * Debug level logging - only in development
   * @param {...*} args - Arguments to log
   */
  debug(...args) {
    if (currentLogLevel <= LogLevel.DEBUG && isDevelopment) {
      // eslint-disable-next-line no-console
      console.log("[DEBUG]", getTimestamp(), ...args);
    }
  },

  /**
   * Info level logging
   * @param {...*} args - Arguments to log
   */
  info(...args) {
    if (currentLogLevel <= LogLevel.INFO) {
      // eslint-disable-next-line no-console
      console.log("[INFO]", getTimestamp(), ...args);
    }
  },

  /**
   * Warning level logging
   * @param {...*} args - Arguments to log
   */
  warn(...args) {
    if (currentLogLevel <= LogLevel.WARN) {
      // eslint-disable-next-line no-console
      console.warn("[WARN]", getTimestamp(), ...args);
    }
  },

  /**
   * Error level logging
   * @param {...*} args - Arguments to log
   */
  error(...args) {
    if (currentLogLevel <= LogLevel.ERROR) {
      // eslint-disable-next-line no-console
      console.error("[ERROR]", getTimestamp(), ...args);
    }
  },

  /**
   * Success level logging (info with success indicator)
   * @param {...*} args - Arguments to log
   */
  success(...args) {
    if (currentLogLevel <= LogLevel.INFO) {
      // eslint-disable-next-line no-console
      console.log("[SUCCESS] ✅", getTimestamp(), ...args);
    }
  },

  /**
   * Performance timing helper
   * @param {string} label - Label for the timing
   * @returns {Function} Function to call when operation completes
   */
  time(label) {
    if (!isDevelopment) {
      return () => {};
    }
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.debug(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    };
  },

  /**
   * Group logging for related messages
   * @param {string} label - Group label
   */
  group(label) {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.group(label);
    }
  },

  /**
   * Collapsed group logging
   * @param {string} label - Group label
   */
  groupCollapsed(label) {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.groupCollapsed(label);
    }
  },

  /**
   * End group logging
   */
  groupEnd() {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
  },

  /**
   * Table logging for structured data
   * @param {*} data - Data to display in table format
   */
  table(data) {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.table(data);
    }
  },

  /**
   * Assert logging - logs only if condition is false
   * @param {boolean} condition - Condition to check
   * @param {...*} args - Arguments to log if assertion fails
   */
  assert(condition, ...args) {
    if (!condition && isDevelopment) {
      // eslint-disable-next-line no-console
      console.assert(condition, "[ASSERT]", ...args);
    }
  },

  /**
   * Create a child logger with a prefix
   * @param {string} prefix - Prefix for all log messages
   * @returns {Object} Child logger instance
   */
  child(prefix) {
    return {
      debug: (...args) => logger.debug(`[${prefix}]`, ...args),
      info: (...args) => logger.info(`[${prefix}]`, ...args),
      warn: (...args) => logger.warn(`[${prefix}]`, ...args),
      error: (...args) => logger.error(`[${prefix}]`, ...args),
      success: (...args) => logger.success(`[${prefix}]`, ...args),
    };
  },

  /**
   * Get structured log entry (useful for remote logging)
   * @param {string} level - Log level
   * @param {...*} args - Log arguments
   * @returns {Object} Structured log entry
   */
  structured(level, ...args) {
    return createLogEntry(level, args);
  },
};

export { logger, LogLevel };
export default logger;

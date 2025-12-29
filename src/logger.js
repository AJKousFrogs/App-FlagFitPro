/**
 * Centralized Logger for FlagFit Pro
 * Provides consistent logging across the application with environment-aware output
 */

const isDevelopment = typeof window !== "undefined" 
  ? (window.location?.hostname === "localhost" || window.location?.hostname === "127.0.0.1")
  : (typeof process !== "undefined" && process.env?.NODE_ENV !== "production");

const logger = {
  /**
   * Debug level logging - only in development
   */
  debug: (...args) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.log("[DEBUG]", ...args);
    }
  },

  /**
   * Info level logging
   */
  info: (...args) => {
    // eslint-disable-next-line no-console
    console.log("[INFO]", ...args);
  },

  /**
   * Warning level logging
   */
  warn: (...args) => {
    // eslint-disable-next-line no-console
    console.warn("[WARN]", ...args);
  },

  /**
   * Error level logging
   */
  error: (...args) => {
    // eslint-disable-next-line no-console
    console.error("[ERROR]", ...args);
  },

  /**
   * Success level logging (info with success indicator)
   */
  success: (...args) => {
    // eslint-disable-next-line no-console
    console.log("[SUCCESS] ✅", ...args);
  },

  /**
   * Group logging for related messages
   */
  group: (label) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.group(label);
    }
  },

  /**
   * End group logging
   */
  groupEnd: () => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
  },

  /**
   * Table logging for structured data
   */
  table: (data) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.table(data);
    }
  },
};

export { logger };
export default logger;

/* eslint-disable no-console */
// Centralized Logging Service for FlagFit Pro
// Provides consistent logging with environment-aware levels

class Logger {
  constructor() {
    this.isDevelopment =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      (window.location.hostname.includes("netlify") &&
        window.location.search.includes("debug=true"));

    this.logLevel = this.isDevelopment ? "debug" : "error";
    this.logs = [];
    this.maxLogs = 100;
  }

  // Set log level: 'debug', 'info', 'warn', 'error', 'silent'
  setLevel(level) {
    this.logLevel = level;
  }

  // Check if level should be logged
  shouldLog(level) {
    if (this.logLevel === "silent") {return false;}

    const levels = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  // Debug logging (development only)
  debug(...args) {
    if (!this.shouldLog("debug")) {return;}

    if (this.isDevelopment) {
      console.log("🔍 [DEBUG]", ...args);
    }

    this.addToHistory("debug", args);
  }

  // Info logging
  info(...args) {
    if (!this.shouldLog("info")) {return;}

    if (this.isDevelopment) {
      console.log("ℹ️ [INFO]", ...args);
    }

    this.addToHistory("info", args);
  }

  // Warning logging
  warn(...args) {
    if (!this.shouldLog("warn")) {return;}

    console.warn("⚠️ [WARN]", ...args);
    this.addToHistory("warn", args);
  }

  // Error logging (always logged)
  error(...args) {
    if (!this.shouldLog("error")) {return;}

    console.error("❌ [ERROR]", ...args);
    this.addToHistory("error", args);

    // In production, could send to error tracking service
    if (!this.isDevelopment) {
      // Example: Send to error tracking service
      // this.sendToErrorTracking(args);
    }
  }

  // Success logging (info level)
  success(...args) {
    if (!this.shouldLog("info")) {return;}

    if (this.isDevelopment) {
      console.log("✅ [SUCCESS]", ...args);
    }

    this.addToHistory("info", args);
  }

  // Add log to history
  addToHistory(level, args) {
    this.logs.push({
      level,
      timestamp: new Date().toISOString(),
      message: args.join(" "),
      args,
    });

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  // Get log history
  getHistory(level = null) {
    if (level) {
      return this.logs.filter((log) => log.level === level);
    }
    return this.logs;
  }

  // Clear log history
  clearHistory() {
    this.logs = [];
  }

  // Export logs (for debugging)
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  // Group logs (for better organization)
  group(label) {
    if (this.isDevelopment && console.group) {
      console.group(label);
    }
  }

  groupEnd() {
    if (this.isDevelopment && console.groupEnd) {
      console.groupEnd();
    }
  }

  // Table logging (for structured data)
  table(data) {
    if (this.isDevelopment && console.table) {
      console.table(data);
    }
  }
}

// Create singleton instance
export const logger = new Logger();

// Export class for custom instances
export default Logger;

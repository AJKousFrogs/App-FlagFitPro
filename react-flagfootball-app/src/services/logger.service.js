/**
 * Centralized Logging Service
 * Provides structured logging with multiple transports
 */

import env from '../config/environment.js';

// Log levels
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class LoggerService {
  constructor() {
    this.logLevel = env.debugMode ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
    this.transports = new Set();
    this.setupDefaultTransports();
  }

  setupDefaultTransports() {
    // Console transport (always enabled in development)
    if (env.isDevelopment || env.debugMode) {
      this.addTransport('console', this.consoleTransport);
    }

    // Remote logging transport for production
    if (env.isProduction) {
      this.addTransport('remote', this.remoteTransport);
    }

    // Local storage transport for client-side persistence
    this.addTransport('localStorage', this.localStorageTransport);
  }

  addTransport(name, transport) {
    this.transports.add({ name, transport });
  }

  removeTransport(name) {
    this.transports = new Set([...this.transports].filter(t => t.name !== name));
  }

  log(level, message, meta = {}) {
    if (level > this.logLevel) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: Object.keys(LOG_LEVELS)[level],
      message,
      meta: {
        ...meta,
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getCurrentUserId(),
        sessionId: this.getSessionId(),
        buildVersion: env.getConfig().app.version
      }
    };

    // Send to all transports
    this.transports.forEach(({ transport }) => {
      try {
        transport(logEntry);
      } catch (error) {
        // Fallback to console if transport fails
        console.error('Logging transport failed:', error);
        this.consoleTransport(logEntry);
      }
    });
  }

  // Convenience methods
  error(message, meta = {}) {
    this.log(LOG_LEVELS.ERROR, message, meta);
  }

  warn(message, meta = {}) {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  info(message, meta = {}) {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  debug(message, meta = {}) {
    this.log(LOG_LEVELS.DEBUG, message, meta);
  }

  // Transport implementations
  consoleTransport = (logEntry) => {
    const { level, message, meta } = logEntry;
    const style = this.getConsoleStyle(level);
    
    console.groupCollapsed(`%c[${level}] ${message}`, style);
    console.log('Timestamp:', logEntry.timestamp);
    console.log('Meta:', meta);
    console.groupEnd();
  };

  localStorageTransport = (logEntry) => {
    try {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      logs.push(logEntry);
      
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('app_logs', JSON.stringify(logs));
    } catch (error) {
      console.warn('Failed to save log to localStorage:', error);
    }
  };

  remoteTransport = async (logEntry) => {
    try {
      // Send logs to remote endpoint
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      // Fail silently for remote logging
      console.warn('Failed to send log to remote endpoint:', error);
    }
  };

  getConsoleStyle(level) {
    const styles = {
      ERROR: 'color: #ff6b6b; font-weight: bold;',
      WARN: 'color: #feca57; font-weight: bold;',
      INFO: 'color: #48dbfb; font-weight: bold;',
      DEBUG: 'color: #ff9ff3; font-weight: bold;'
    };
    return styles[level] || styles.INFO;
  }

  getCurrentUserId() {
    try {
      // Try to get user ID from auth store or local storage
      const authData = JSON.parse(localStorage.getItem('pocketbase_auth') || '{}');
      return authData.model?.id || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  getSessionId() {
    if (!sessionStorage.getItem('session_id')) {
      sessionStorage.setItem('session_id', this.generateSessionId());
    }
    return sessionStorage.getItem('session_id');
  }

  generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Performance logging
  startTimer(label) {
    const start = performance.now();
    return {
      end: () => {
        const duration = performance.now() - start;
        this.debug(`Timer [${label}]`, { duration: `${duration.toFixed(2)}ms` });
        return duration;
      }
    };
  }

  // Network request logging
  logRequest(url, method, status, duration) {
    const meta = { url, method, status, duration };
    
    if (status >= 400) {
      this.error(`HTTP ${status} - ${method} ${url}`, meta);
    } else if (status >= 300) {
      this.warn(`HTTP ${status} - ${method} ${url}`, meta);
    } else {
      this.debug(`HTTP ${status} - ${method} ${url}`, meta);
    }
  }

  // User action logging
  logUserAction(action, target, meta = {}) {
    this.info(`User Action: ${action}`, {
      action,
      target,
      ...meta
    });
  }

  // Error logging with stack trace
  logError(error, context = '') {
    this.error(`${context ? `${context}: ` : ''}${error.message}`, {
      stack: error.stack,
      name: error.name,
      context
    });
  }

  // Get stored logs
  getStoredLogs() {
    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]');
    } catch {
      return [];
    }
  }

  // Clear stored logs
  clearStoredLogs() {
    localStorage.removeItem('app_logs');
  }
}

// Export singleton instance
export const logger = new LoggerService();
export default logger;
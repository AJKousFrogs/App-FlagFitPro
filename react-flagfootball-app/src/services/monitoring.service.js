/**
 * Monitoring Service
 * Provides application monitoring and metrics collection
 */

import logger from './logger.service.js';
import sentryService from './sentry.service.js';
import env from '../config/environment';

class MonitoringService {
  constructor() {
    this.metrics = new Map();
    this.timers = new Map();
    this.config = {
      metricsRetention: 24 * 60 * 60 * 1000, // 24 hours
      batchSize: 100,
      flushInterval: 5 * 60 * 1000, // 5 minutes
      enabled: env.getConfig().features.analytics
    };

    this.performanceObserver = null;
    this.setupPerformanceMonitoring();
    this.setupMetricsCollection();
    
    if (this.config.enabled) {
      this.startMetricsCollection();
    }
  }

  setupPerformanceMonitoring() {
    // Web Vitals monitoring
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('performance.lcp', entry.startTime, {
              element: entry.element?.tagName || 'unknown',
              size: entry.size
            });
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('performance.fid', entry.processingStart - entry.startTime, {
              name: entry.name,
              duration: entry.duration
            });
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          if (clsValue > 0) {
            this.recordMetric('performance.cls', clsValue);
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Long Tasks
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('performance.long_task', entry.duration, {
              name: entry.name,
              startTime: entry.startTime
            });
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });

      } catch (error) {
        logger.warn('Failed to setup performance monitoring', { error: error.message });
      }
    }

    // Navigation timing
    this.recordNavigationTiming();
  }

  recordNavigationTiming() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        this.recordMetric('performance.navigation.dns', navigation.domainLookupEnd - navigation.domainLookupStart);
        this.recordMetric('performance.navigation.connect', navigation.connectEnd - navigation.connectStart);
        this.recordMetric('performance.navigation.request', navigation.responseStart - navigation.requestStart);
        this.recordMetric('performance.navigation.response', navigation.responseEnd - navigation.responseStart);
        this.recordMetric('performance.navigation.dom_parse', navigation.domContentLoadedEventStart - navigation.responseEnd);
        this.recordMetric('performance.navigation.load_complete', navigation.loadEventEnd - navigation.loadEventStart);
        this.recordMetric('performance.navigation.total', navigation.loadEventEnd - navigation.navigationStart);
      }
    }
  }

  setupMetricsCollection() {
    // Error tracking
    window.addEventListener('error', (event) => {
      this.recordMetric('errors.javascript', 1, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordMetric('errors.promise_rejection', 1, {
        reason: event.reason?.message || 'Unknown',
        stack: event.reason?.stack
      });
    });

    // Resource errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.recordMetric('errors.resource', 1, {
          resource: event.target.src || event.target.href,
          type: event.target.tagName
        });
      }
    }, true);

    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.recordMetric('user.visibility_change', 1, {
        hidden: document.hidden,
        timestamp: Date.now()
      });
    });

    // User engagement
    let userActive = true;
    let lastActivity = Date.now();

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const resetActivity = () => {
      lastActivity = Date.now();
      if (!userActive) {
        userActive = true;
        this.recordMetric('user.engagement.return', 1);
      }
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, resetActivity, true);
    });

    // Check for inactivity every 30 seconds
    setInterval(() => {
      const inactive = Date.now() - lastActivity > 30000;
      if (userActive && inactive) {
        userActive = false;
        this.recordMetric('user.engagement.idle', 1);
      }
    }, 30000);
  }

  startMetricsCollection() {
    // Collect system metrics every minute
    setInterval(() => {
      this.collectSystemMetrics();
    }, 60000);

    // Flush metrics periodically
    setInterval(() => {
      this.flushMetrics();
    }, this.config.flushInterval);

    // Memory usage monitoring
    if ('memory' in performance) {
      setInterval(() => {
        this.recordMetric('system.memory.used', performance.memory.usedJSHeapSize);
        this.recordMetric('system.memory.total', performance.memory.totalJSHeapSize);
        this.recordMetric('system.memory.limit', performance.memory.jsHeapSizeLimit);
      }, 60000);
    }
  }

  collectSystemMetrics() {
    // Connection information
    if ('connection' in navigator) {
      const connection = navigator.connection;
      this.recordMetric('system.connection.type', 1, {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      });
    }

    // Battery status
    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        this.recordMetric('system.battery.level', battery.level * 100);
        this.recordMetric('system.battery.charging', battery.charging ? 1 : 0);
      });
    }

    // Viewport size
    this.recordMetric('system.viewport.width', window.innerWidth);
    this.recordMetric('system.viewport.height', window.innerHeight);

    // Device pixel ratio
    this.recordMetric('system.device.pixel_ratio', window.devicePixelRatio);
  }

  /**
   * Record a metric
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {Object} tags - Additional tags
   */
  recordMetric(name, value, tags = {}) {
    if (!this.config.enabled) return;

    const timestamp = Date.now();
    const metric = {
      name,
      value,
      tags: {
        ...tags,
        environment: env.getConfig().app.environment,
        version: env.getConfig().app.version,
        userAgent: navigator.userAgent,
        timestamp
      }
    };

    // Store in memory
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name);
    metrics.push(metric);

    // Keep only recent metrics
    const cutoff = timestamp - this.config.metricsRetention;
    this.metrics.set(name, metrics.filter(m => m.tags.timestamp > cutoff));

    // Log important metrics
    if (this.isImportantMetric(name, value)) {
      logger.info(`Metric recorded: ${name}`, { value, tags });
    }

    // Send to Sentry for monitoring
    if (sentryService.isAvailable()) {
      sentryService.addBreadcrumb(
        `Metric: ${name} = ${value}`,
        'metric',
        'info',
        { name, value, tags }
      );
    }
  }

  /**
   * Start a timer for measuring durations
   * @param {string} name - Timer name
   * @returns {Function} - Function to end the timer
   */
  startTimer(name) {
    const startTime = performance.now();
    const timerId = `${name}_${Date.now()}_${Math.random()}`;

    this.timers.set(timerId, { name, startTime });

    return () => {
      const timer = this.timers.get(timerId);
      if (timer) {
        const duration = performance.now() - timer.startTime;
        this.recordMetric(`timer.${timer.name}`, duration);
        this.timers.delete(timerId);
        return duration;
      }
      return 0;
    };
  }

  /**
   * Record user action
   * @param {string} action - Action name
   * @param {Object} data - Action data
   */
  recordUserAction(action, data = {}) {
    this.recordMetric(`user.action.${action}`, 1, {
      ...data,
      sessionId: this.getSessionId(),
      userId: this.getCurrentUserId()
    });

    logger.info(`User action: ${action}`, data);
  }

  /**
   * Record API call metrics
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {number} status - Response status
   * @param {number} duration - Request duration
   */
  recordApiCall(endpoint, method, status, duration) {
    this.recordMetric('api.request.count', 1, {
      endpoint,
      method,
      status: status.toString()
    });

    this.recordMetric('api.request.duration', duration, {
      endpoint,
      method,
      status: status.toString()
    });

    if (status >= 400) {
      this.recordMetric('api.request.error', 1, {
        endpoint,
        method,
        status: status.toString()
      });
    }
  }

  /**
   * Get metrics summary
   * @param {string} metricName - Metric name (optional)
   * @returns {Object} - Metrics summary
   */
  getMetricsSummary(metricName = null) {
    const summary = {};

    const metricsToProcess = metricName ? [metricName] : Array.from(this.metrics.keys());

    for (const name of metricsToProcess) {
      const metrics = this.metrics.get(name) || [];
      if (metrics.length === 0) continue;

      const values = metrics.map(m => m.value);
      summary[name] = {
        count: values.length,
        sum: values.reduce((a, b) => a + b, 0),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        latest: values[values.length - 1],
        timestamp: metrics[metrics.length - 1]?.tags.timestamp
      };
    }

    return summary;
  }

  /**
   * Flush metrics to external service
   */
  async flushMetrics() {
    try {
      const summary = this.getMetricsSummary();
      const metricCount = Object.keys(summary).length;

      if (metricCount === 0) return;

      // Log metrics summary
      logger.debug('Metrics summary', {
        metricCount,
        summary: Object.keys(summary).reduce((acc, key) => {
          acc[key] = summary[key].count;
          return acc;
        }, {})
      });

      // Send to external monitoring service if configured
      // await this.sendToExternalService(summary);

    } catch (error) {
      logger.error('Failed to flush metrics', { error: error.message });
    }
  }

  isImportantMetric(name, value) {
    // Define which metrics should be logged
    const importantMetrics = [
      'performance.lcp',
      'performance.fid', 
      'performance.cls',
      'errors.',
      'api.request.error'
    ];

    return importantMetrics.some(pattern => name.includes(pattern)) ||
           (name.includes('performance') && value > 1000); // Slow performance
  }

  getCurrentUserId() {
    try {
      const authData = JSON.parse(localStorage.getItem('pocketbase_auth') || '{}');
      return authData.model?.id || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  getSessionId() {
    if (!sessionStorage.getItem('monitoring_session_id')) {
      sessionStorage.setItem('monitoring_session_id', 
        Math.random().toString(36).substring(2, 15) + 
        Math.random().toString(36).substring(2, 15)
      );
    }
    return sessionStorage.getItem('monitoring_session_id');
  }

  /**
   * Get monitoring dashboard data
   * @returns {Object} - Dashboard data
   */
  getDashboardData() {
    const summary = this.getMetricsSummary();
    
    return {
      summary,
      recentErrors: this.getRecentErrors(),
      performanceMetrics: this.getPerformanceMetrics(),
      userMetrics: this.getUserMetrics(),
      systemMetrics: this.getSystemMetrics()
    };
  }

  getRecentErrors() {
    const errorMetrics = ['errors.javascript', 'errors.promise_rejection', 'errors.resource'];
    const errors = [];

    for (const metricName of errorMetrics) {
      const metrics = this.metrics.get(metricName) || [];
      errors.push(...metrics.slice(-10)); // Last 10 errors
    }

    return errors.sort((a, b) => b.tags.timestamp - a.tags.timestamp);
  }

  getPerformanceMetrics() {
    const performanceMetrics = Array.from(this.metrics.keys())
      .filter(name => name.startsWith('performance.'));
    
    return this.getMetricsSummary().filter(([name]) => 
      performanceMetrics.includes(name)
    );
  }

  getUserMetrics() {
    const userMetrics = Array.from(this.metrics.keys())
      .filter(name => name.startsWith('user.'));
    
    return this.getMetricsSummary().filter(([name]) => 
      userMetrics.includes(name)
    );
  }

  getSystemMetrics() {
    const systemMetrics = Array.from(this.metrics.keys())
      .filter(name => name.startsWith('system.'));
    
    return this.getMetricsSummary().filter(([name]) => 
      systemMetrics.includes(name)
    );
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();
export default monitoringService;
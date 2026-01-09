/**
 * Request Logger Middleware
 * Structured logging for API requests with metrics collection
 *
 * @module routes/middleware/request-logger
 * @version 1.0.0
 */

import { serverLogger } from "../utils/server-logger.js";

// Metrics store for monitoring
const metrics = {
  requests: {
    total: 0,
    byMethod: {},
    byRoute: {},
    byStatus: {},
  },
  errors: {
    total: 0,
    byRoute: {},
    byCode: {},
    recent: [], // Last 100 errors
  },
  latency: {
    samples: [], // Rolling window of last 1000 samples
    byRoute: {},
  },
  startTime: Date.now(),
};

// Max samples to keep
const MAX_LATENCY_SAMPLES = 1000;
const MAX_ERROR_HISTORY = 100;

/**
 * Generate unique request ID
 * @returns {string} Request ID
 */
function generateRequestId() {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Get route pattern from request (normalizes IDs)
 * @param {object} req - Express request
 * @returns {string} Normalized route pattern
 */
function getRoutePattern(req) {
  let path = req.route?.path || req.path || req.url;

  // Normalize UUIDs to :id
  path = path.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    ":id",
  );

  // Normalize numeric IDs
  path = path.replace(/\/\d+/g, "/:id");

  // Include base URL if available
  const basePath = req.baseUrl || "";
  return `${basePath}${path}`.replace(/\/+/g, "/");
}

/**
 * Record latency sample
 * @param {string} route - Route pattern
 * @param {number} duration - Duration in ms
 */
function recordLatency(route, duration) {
  // Global samples (rolling window)
  metrics.latency.samples.push({ route, duration, timestamp: Date.now() });
  if (metrics.latency.samples.length > MAX_LATENCY_SAMPLES) {
    metrics.latency.samples.shift();
  }

  // Per-route tracking
  if (!metrics.latency.byRoute[route]) {
    metrics.latency.byRoute[route] = {
      count: 0,
      total: 0,
      min: Infinity,
      max: 0,
      samples: [],
    };
  }

  const routeMetrics = metrics.latency.byRoute[route];
  routeMetrics.count++;
  routeMetrics.total += duration;
  routeMetrics.min = Math.min(routeMetrics.min, duration);
  routeMetrics.max = Math.max(routeMetrics.max, duration);

  // Keep last 100 samples per route for percentile calculation
  routeMetrics.samples.push(duration);
  if (routeMetrics.samples.length > 100) {
    routeMetrics.samples.shift();
  }
}

/**
 * Record error
 * @param {string} route - Route pattern
 * @param {number} statusCode - HTTP status code
 * @param {string} errorCode - Error code
 * @param {string} message - Error message
 */
function recordError(route, statusCode, errorCode, message) {
  metrics.errors.total++;

  // By route
  metrics.errors.byRoute[route] = (metrics.errors.byRoute[route] || 0) + 1;

  // By error code
  const codeKey = errorCode || `HTTP_${statusCode}`;
  metrics.errors.byCode[codeKey] = (metrics.errors.byCode[codeKey] || 0) + 1;

  // Recent errors
  metrics.errors.recent.push({
    route,
    statusCode,
    errorCode,
    message: message?.substring(0, 200),
    timestamp: new Date().toISOString(),
  });

  if (metrics.errors.recent.length > MAX_ERROR_HISTORY) {
    metrics.errors.recent.shift();
  }
}

/**
 * Calculate percentile from sorted array
 * @param {number[]} arr - Sorted array
 * @param {number} p - Percentile (0-100)
 * @returns {number} Percentile value
 */
function percentile(arr, p) {
  if (arr.length === 0) {
    return 0;
  }
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Request logging middleware
 * Logs all requests with timing, status, and structured data
 */
export function requestLogger() {
  return (req, res, next) => {
    const startTime = process.hrtime.bigint();
    const requestId = generateRequestId();

    // Attach request ID
    req.requestId = requestId;
    res.setHeader("X-Request-ID", requestId);

    // Track request
    metrics.requests.total++;
    metrics.requests.byMethod[req.method] =
      (metrics.requests.byMethod[req.method] || 0) + 1;

    // Capture original end to intercept response
    const originalEnd = res.end;
    const originalJson = res.json;

    let responseBody = null;

    // Intercept json() to capture response
    res.json = function (body) {
      responseBody = body;
      return originalJson.call(this, body);
    };

    // Intercept end() to log after response
    res.end = function (...args) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1e6; // Convert to ms

      const route = getRoutePattern(req);
      const { statusCode } = res;

      // Track by route and status
      metrics.requests.byRoute[route] =
        (metrics.requests.byRoute[route] || 0) + 1;
      metrics.requests.byStatus[statusCode] =
        (metrics.requests.byStatus[statusCode] || 0) + 1;

      // Record latency
      recordLatency(route, duration);

      // Check for errors
      const isError = statusCode >= 400;
      if (isError) {
        const errorCode = responseBody?.code || responseBody?.error?.code;
        const errorMessage =
          responseBody?.error || responseBody?.message || "Unknown error";
        recordError(route, statusCode, errorCode, errorMessage);
      }

      // Build structured log entry
      const logEntry = {
        requestId,
        method: req.method,
        path: req.path,
        route,
        status: statusCode,
        duration: `${duration.toFixed(2)}ms`,
        userAgent: req.headers["user-agent"]?.substring(0, 50),
        ip:
          req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
          req.ip ||
          "unknown",
        userId: req.userId || null,
        timestamp: new Date().toISOString(),
      };

      // Log based on status
      if (isError) {
        serverLogger.warn(
          `[REQUEST] ${req.method} ${route} ${statusCode} (${duration.toFixed(0)}ms)`,
          {
            ...logEntry,
            error: responseBody?.error || responseBody?.message,
          },
        );
      } else if (duration > 1000) {
        // Slow request warning (> 1s)
        serverLogger.warn(
          `[SLOW] ${req.method} ${route} ${statusCode} (${duration.toFixed(0)}ms)`,
        );
      } else {
        serverLogger.debug(
          `[REQUEST] ${req.method} ${route} ${statusCode} (${duration.toFixed(0)}ms)`,
        );
      }

      return originalEnd.apply(this, args);
    };

    next();
  };
}

/**
 * Get metrics summary
 * @returns {object} Metrics summary
 */
export function getMetrics() {
  const uptimeMs = Date.now() - metrics.startTime;
  const uptimeSeconds = Math.floor(uptimeMs / 1000);

  // Calculate latency percentiles
  const allLatencies = metrics.latency.samples.map((s) => s.duration);
  const p50 = percentile(allLatencies, 50);
  const p95 = percentile(allLatencies, 95);
  const p99 = percentile(allLatencies, 99);

  // Calculate error rate
  const errorRate =
    metrics.requests.total > 0
      ? `${((metrics.errors.total / metrics.requests.total) * 100).toFixed(2)}%`
      : "0%";

  // Calculate requests per minute
  const rpm =
    uptimeSeconds > 0
      ? ((metrics.requests.total / uptimeSeconds) * 60).toFixed(1)
      : 0;

  return {
    uptime: {
      seconds: uptimeSeconds,
      formatted: formatUptime(uptimeSeconds),
    },
    requests: {
      total: metrics.requests.total,
      perMinute: parseFloat(rpm),
      byMethod: metrics.requests.byMethod,
      byStatus: metrics.requests.byStatus,
      topRoutes: getTopRoutes(5),
    },
    latency: {
      p50: `${p50.toFixed(0)}ms`,
      p95: `${p95.toFixed(0)}ms`,
      p99: `${p99.toFixed(0)}ms`,
      slowestRoutes: getSlowestRoutes(5),
    },
    errors: {
      total: metrics.errors.total,
      rate: errorRate,
      byCode: metrics.errors.byCode,
      topRoutes: getErrorRoutes(5),
      recent: metrics.errors.recent.slice(-10),
    },
  };
}

/**
 * Get top routes by request count
 * @param {number} n - Number of routes to return
 * @returns {object[]} Top routes
 */
function getTopRoutes(n) {
  return Object.entries(metrics.requests.byRoute)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([route, count]) => ({ route, count }));
}

/**
 * Get slowest routes by average latency
 * @param {number} n - Number of routes to return
 * @returns {object[]} Slowest routes
 */
function getSlowestRoutes(n) {
  return Object.entries(metrics.latency.byRoute)
    .map(([route, data]) => ({
      route,
      avg: data.count > 0 ? Math.round(data.total / data.count) : 0,
      p95: percentile(data.samples, 95),
      count: data.count,
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, n);
}

/**
 * Get routes with most errors
 * @param {number} n - Number of routes to return
 * @returns {object[]} Error-prone routes
 */
function getErrorRoutes(n) {
  return Object.entries(metrics.errors.byRoute)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([route, count]) => ({
      route,
      errors: count,
      rate:
        metrics.requests.byRoute[route] > 0
          ? `${((count / metrics.requests.byRoute[route]) * 100).toFixed(1)}%`
          : "N/A",
    }));
}

/**
 * Format uptime in human-readable format
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Formatted uptime
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}s`);
  }

  return parts.join(" ");
}

/**
 * Reset metrics (useful for testing)
 */
export function resetMetrics() {
  metrics.requests = { total: 0, byMethod: {}, byRoute: {}, byStatus: {} };
  metrics.errors = { total: 0, byRoute: {}, byCode: {}, recent: [] };
  metrics.latency = { samples: [], byRoute: {} };
  metrics.startTime = Date.now();
}

export default {
  requestLogger,
  getMetrics,
  resetMetrics,
};

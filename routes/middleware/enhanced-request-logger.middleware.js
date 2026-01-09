/**
 * Enhanced Request Logger with Body Logging
 * Extension of the existing request-logger middleware
 * Adds optional request/response body logging for debugging
 *
 * @module routes/middleware/enhanced-request-logger
 * @version 1.1.0
 */

import { serverLogger } from "../utils/server-logger.js";
import {
  requestLogger as baseRequestLogger,
  getMetrics,
} from "./request-logger.middleware.js";

/**
 * Enhanced request logger with optional body logging
 * @param {object} options - Configuration options
 * @param {boolean} options.logBodies - Enable request/response body logging
 * @param {boolean} options.logHeaders - Enable request header logging
 * @param {number} options.maxBodyLength - Maximum body length to log (default: 1000 chars)
 * @param {string[]} options.excludePaths - Paths to exclude from body logging (e.g., ['/health'])
 * @param {string[]} options.sensitiveFields - Fields to redact (e.g., ['password', 'token'])
 * @returns {function} Express middleware
 */
export function enhancedRequestLogger(options = {}) {
  const {
    logBodies = false,
    logHeaders = false,
    maxBodyLength = 1000,
    excludePaths = ["/health", "/metrics"],
    sensitiveFields = ["password", "token", "apiKey", "secret"],
  } = options;

  return (req, res, next) => {
    const startTime = process.hrtime.bigint();
    const requestId = generateRequestId();
    const shouldLogBody =
      logBodies &&
      process.env.NODE_ENV !== "production" &&
      !excludePaths.some((path) => req.path.includes(path));

    // Attach request ID
    req.requestId = requestId;
    res.setHeader("X-Request-ID", requestId);

    // Capture request details
    const logEntry = {
      requestId,
      method: req.method,
      path: req.path,
      query: req.query,
      ip:
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.ip ||
        "unknown",
      userAgent: req.headers["user-agent"]?.substring(0, 100),
      userId: req.userId || null,
      timestamp: new Date().toISOString(),
    };

    // Log request headers if enabled
    if (logHeaders) {
      logEntry.headers = redactSensitiveData(
        {
          "content-type": req.headers["content-type"],
          authorization: req.headers["authorization"]
            ? "[REDACTED]"
            : undefined,
          "user-agent": req.headers["user-agent"],
          origin: req.headers["origin"],
        },
        sensitiveFields,
      );
    }

    // Log request body if enabled
    if (shouldLogBody && req.body) {
      logEntry.requestBody = truncateAndRedact(
        req.body,
        maxBodyLength,
        sensitiveFields,
      );
    }

    // Capture response
    const originalJson = res.json;
    let responseBody = null;

    res.json = function (body) {
      responseBody = body;
      return originalJson.call(this, body);
    };

    // Log on response finish
    const originalEnd = res.end;
    res.end = function (...args) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1e6; // Convert to ms

      logEntry.status = res.statusCode;
      logEntry.duration = `${duration.toFixed(2)}ms`;

      // Log response body if enabled
      if (shouldLogBody && responseBody) {
        logEntry.responseBody = truncateAndRedact(
          responseBody,
          maxBodyLength,
          sensitiveFields,
        );
      }

      // Determine log level
      const isError = res.statusCode >= 400;
      const isSlow = duration > 1000;

      if (isError) {
        serverLogger.warn(
          `[REQUEST] ${req.method} ${req.path} ${res.statusCode} (${duration.toFixed(0)}ms)`,
          logEntry,
        );
      } else if (isSlow) {
        serverLogger.warn(
          `[SLOW] ${req.method} ${req.path} ${res.statusCode} (${duration.toFixed(0)}ms)`,
          logEntry,
        );
      } else if (shouldLogBody) {
        serverLogger.info(
          `[REQUEST] ${req.method} ${req.path} ${res.statusCode} (${duration.toFixed(0)}ms)`,
          logEntry,
        );
      } else {
        serverLogger.debug(
          `[REQUEST] ${req.method} ${req.path} ${res.statusCode} (${duration.toFixed(0)}ms)`,
        );
      }

      return originalEnd.apply(this, args);
    };

    next();
  };
}

/**
 * Generate unique request ID
 * @returns {string} Request ID
 */
function generateRequestId() {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Redact sensitive fields from object
 * @param {object} obj - Object to redact
 * @param {string[]} sensitiveFields - Fields to redact
 * @returns {object} Redacted object
 */
function redactSensitiveData(obj, sensitiveFields) {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  const redacted = { ...obj };

  for (const key of Object.keys(redacted)) {
    const lowerKey = key.toLowerCase();

    if (
      sensitiveFields.some((field) => lowerKey.includes(field.toLowerCase()))
    ) {
      redacted[key] = "[REDACTED]";
    } else if (typeof redacted[key] === "object" && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(redacted[key], sensitiveFields);
    }
  }

  return redacted;
}

/**
 * Truncate and redact object for logging
 * @param {any} data - Data to truncate
 * @param {number} maxLength - Maximum string length
 * @param {string[]} sensitiveFields - Fields to redact
 * @returns {any} Truncated and redacted data
 */
function truncateAndRedact(data, maxLength, sensitiveFields) {
  // Redact sensitive fields first
  const redacted = redactSensitiveData(data, sensitiveFields);

  // Convert to string and truncate
  const str = JSON.stringify(redacted);

  if (str.length > maxLength) {
    return `${str.substring(0, maxLength)}... [${str.length - maxLength} more chars]`;
  }

  return redacted;
}

/**
 * Middleware factory for different environments
 */
export function createRequestLogger() {
  const env = process.env.NODE_ENV || "development";

  switch (env) {
    case "development":
      return enhancedRequestLogger({
        logBodies: true,
        logHeaders: true,
        maxBodyLength: 2000,
      });

    case "test":
      return enhancedRequestLogger({
        logBodies: false,
        logHeaders: false,
      });

    case "production":
      return baseRequestLogger(); // Use base logger without body logging

    default:
      return baseRequestLogger();
  }
}

export default {
  enhancedRequestLogger,
  createRequestLogger,
  getMetrics,
};

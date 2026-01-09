/**
 * Simple In-Memory Rate Limiter for Express Routes
 * Provides basic rate limiting functionality for API protection
 *
 * @module routes/utils/rate-limiter
 * @version 1.0.0
 */

import { serverLogger } from "./server-logger.js";

// In-memory store for rate limit tracking
const rateLimitStore = new Map();

// Rate limit configurations
const RATE_LIMITS = {
  READ: { windowMs: 60000, max: 100 }, // 100 requests per minute for reads
  CREATE: { windowMs: 60000, max: 30 }, // 30 requests per minute for creates
  AUTH: { windowMs: 60000, max: 10 }, // 10 requests per minute for auth
  DEFAULT: { windowMs: 60000, max: 60 }, // 60 requests per minute default
};

// Cleanup old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (now - value.windowStart > value.windowMs * 2) {
        rateLimitStore.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

/**
 * Get client identifier from request
 * @param {object} req - Express request object
 * @returns {string} Client identifier
 */
function getClientIdentifier(req) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.ip ||
    "unknown";

  // If authenticated, include user ID for more granular limiting
  const userId = req.userId || "";

  return userId ? `${ip}:${userId}` : ip;
}

/**
 * Check if request is rate limited
 * @param {string} identifier - Client identifier
 * @param {string} type - Rate limit type (READ, CREATE, AUTH, DEFAULT)
 * @returns {object} { limited: boolean, remaining: number, resetTime: number }
 */
function checkRateLimit(identifier, type = "DEFAULT") {
  const config = RATE_LIMITS[type] || RATE_LIMITS.DEFAULT;
  const now = Date.now();
  const key = `${identifier}:${type}`;

  let entry = rateLimitStore.get(key);

  // Create new entry if doesn't exist or window expired
  if (!entry || now - entry.windowStart > config.windowMs) {
    entry = {
      count: 0,
      windowStart: now,
      windowMs: config.windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment count
  entry.count++;

  const remaining = Math.max(0, config.max - entry.count);
  const resetTime = entry.windowStart + config.windowMs;
  const limited = entry.count > config.max;

  return { limited, remaining, resetTime, limit: config.max };
}

/**
 * Rate limiting middleware factory
 * @param {string} type - Rate limit type (READ, CREATE, AUTH, DEFAULT)
 * @returns {function} Express middleware
 */
export function rateLimit(type = "DEFAULT") {
  return (req, res, next) => {
    const identifier = getClientIdentifier(req);
    const { limited, remaining, resetTime, limit } = checkRateLimit(
      identifier,
      type,
    );

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(resetTime / 1000));

    if (limited) {
      const retryAfterSeconds = Math.ceil((resetTime - Date.now()) / 1000);

      // Add Retry-After HTTP header
      res.setHeader("Retry-After", retryAfterSeconds);

      serverLogger.warn(`Rate limit exceeded for ${identifier} (${type})`);

      return res.status(429).json({
        success: false,
        error: "Too many requests, please try again later",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: retryAfterSeconds,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

/**
 * Get rate limit headers for response
 * @param {string} identifier - Client identifier
 * @param {string} type - Rate limit type
 * @returns {object} Headers object
 */
export function getRateLimitHeaders(identifier, type = "DEFAULT") {
  const config = RATE_LIMITS[type] || RATE_LIMITS.DEFAULT;
  const key = `${identifier}:${type}`;
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return {
      "X-RateLimit-Limit": config.max,
      "X-RateLimit-Remaining": config.max,
      "X-RateLimit-Reset": Math.ceil((Date.now() + config.windowMs) / 1000),
    };
  }

  const remaining = Math.max(0, config.max - entry.count);
  const resetTime = entry.windowStart + config.windowMs;

  return {
    "X-RateLimit-Limit": config.max,
    "X-RateLimit-Remaining": remaining,
    "X-RateLimit-Reset": Math.ceil(resetTime / 1000),
  };
}

export default { rateLimit, getRateLimitHeaders };

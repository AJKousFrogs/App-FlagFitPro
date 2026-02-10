/**
 * Rate Limiter Middleware
 *
 * Provides configurable rate limiting for Netlify functions.
 * Uses in-memory storage with automatic cleanup.
 *
 * Features:
 * - Multiple rate limit tiers (AUTH, CREATE, READ, DELETE, DEFAULT)
 * - IP-based and user-based limiting
 * - Automatic cleanup of expired entries
 * - Configurable via environment variables
 * - Rate limit headers in responses
 */

// Rate limit configuration
// Can be overridden via environment variables
const RATE_LIMITS = {
  // Authentication operations - strictest limits
  AUTH: {
    maxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 5,
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW) || 60000,
    description: "Authentication operations (login, password reset)",
  },
  // Create/write operations
  CREATE: {
    maxRequests: parseInt(process.env.RATE_LIMIT_CREATE_MAX) || 50,
    windowMs: parseInt(process.env.RATE_LIMIT_CREATE_WINDOW) || 60000,
    description: "Create/write operations",
  },
  // Read operations - most permissive
  READ: {
    maxRequests: parseInt(process.env.RATE_LIMIT_READ_MAX) || 200,
    windowMs: parseInt(process.env.RATE_LIMIT_READ_WINDOW) || 60000,
    description: "Read operations",
  },
  // Update operations
  UPDATE: {
    maxRequests: parseInt(process.env.RATE_LIMIT_UPDATE_MAX) || 30,
    windowMs: parseInt(process.env.RATE_LIMIT_UPDATE_WINDOW) || 60000,
    description: "Update operations",
  },
  // Delete operations - restricted
  DELETE: {
    maxRequests: parseInt(process.env.RATE_LIMIT_DELETE_MAX) || 10,
    windowMs: parseInt(process.env.RATE_LIMIT_DELETE_WINDOW) || 60000,
    description: "Delete operations",
  },
  // Default fallback
  DEFAULT: {
    maxRequests: parseInt(process.env.RATE_LIMIT_DEFAULT_MAX) || 100,
    windowMs: parseInt(process.env.RATE_LIMIT_DEFAULT_WINDOW) || 60000,
    description: "Default rate limit",
  },
};

// In-memory store for rate limit data
// In production, consider using Redis or similar
const rateLimitStore = new Map();

// Cleanup expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetAt) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[RATE LIMITER] Cleaned ${cleaned} expired entries`);
  }
}, CLEANUP_INTERVAL);

/**
 * Check if a request is within rate limits
 *
 * @param {string} identifier - Unique identifier (IP, user ID, etc.)
 * @param {object} options - Rate limit options
 * @returns {{ allowed: boolean, remaining: number, resetAt?: number, retryAfter?: number }}
 */
function checkRateLimit(identifier, options = RATE_LIMITS.DEFAULT) {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  const { maxRequests, windowMs } = options;

  // First request
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
      firstRequest: now,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  const limitData = rateLimitStore.get(key);

  // Window expired - reset
  if (now > limitData.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
      firstRequest: now,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  // Check if limit exceeded
  if (limitData.count >= maxRequests) {
    const retryAfter = Math.ceil((limitData.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: limitData.resetAt,
      retryAfter,
    };
  }

  // Increment counter
  limitData.count++;
  return {
    allowed: true,
    remaining: maxRequests - limitData.count,
    resetAt: limitData.resetAt,
  };
}

/**
 * Apply rate limiting to a request
 * Returns a response if rate limited, null otherwise
 *
 * @param {object} event - Netlify function event
 * @param {string} limitType - Type of rate limit to apply
 * @param {string} userId - Optional user ID for user-based limiting
 * @returns {object|null} - Rate limit response or null if allowed
 */
function applyRateLimit(event, limitType = "DEFAULT", userId = null) {
  // Get client identifier
  const ip =
    event.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
    event.headers?.["X-Forwarded-For"]?.split(",")[0]?.trim() ||
    event.headers?.["x-real-ip"] ||
    event.headers?.["X-Real-IP"] ||
    "unknown";

  // Create composite identifier (IP + optional userId for stricter limits)
  const identifier = userId ? `${ip}:${userId}` : ip;

  // Get rate limit configuration
  const limit = RATE_LIMITS[limitType] || RATE_LIMITS.DEFAULT;

  // Check rate limit
  const result = checkRateLimit(identifier, limit);

  if (!result.allowed) {
    console.warn(`[RATE LIMIT] Exceeded for ${identifier} (${limitType})`);

    return {
      statusCode: 429,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfter),
        "X-RateLimit-Limit": String(limit.maxRequests),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
      body: JSON.stringify({
        success: false,
        error: "Rate limit exceeded",
        code: "rate_limit_exceeded",
        retryAfter: result.retryAfter,
        message: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
      }),
    };
  }

  // Return null to indicate request is allowed
  // Rate limit headers will be added by the response helper
  return null;
}

/**
 * Determine the appropriate rate limit type based on request
 *
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @returns {string} - Rate limit type
 */
function getRateLimitType(method, path) {
  // Authentication endpoints get strictest limits
  if (
    path.includes("/auth") ||
    path.includes("/login") ||
    path.includes("/register") ||
    path.includes("/password")
  ) {
    return "AUTH";
  }

  // Method-based limits
  switch (method) {
    case "DELETE":
      return "DELETE";
    case "PUT":
    case "PATCH":
      return "UPDATE";
    case "POST":
      return "CREATE";
    case "GET":
      return "READ";
    default:
      return "DEFAULT";
  }
}

/**
 * Get rate limit headers for a response
 *
 * @param {string} identifier - Rate limit identifier
 * @param {string} limitType - Type of rate limit
 * @returns {object} - Headers object
 */
function getRateLimitHeaders(identifier, limitType = "DEFAULT") {
  const limit = RATE_LIMITS[limitType] || RATE_LIMITS.DEFAULT;
  const key = `ratelimit:${identifier}`;
  const data = rateLimitStore.get(key);

  if (!data) {
    return {
      "X-RateLimit-Limit": String(limit.maxRequests),
      "X-RateLimit-Remaining": String(limit.maxRequests),
    };
  }

  return {
    "X-RateLimit-Limit": String(limit.maxRequests),
    "X-RateLimit-Remaining": String(
      Math.max(0, limit.maxRequests - data.count),
    ),
    "X-RateLimit-Reset": String(Math.ceil(data.resetAt / 1000)),
  };
}

/**
 * Get current rate limit status (for debugging/monitoring)
 */
function getRateLimitStatus() {
  const entries = Array.from(rateLimitStore.entries()).map(([key, data]) => ({
    key,
    count: data.count,
    resetAt: new Date(data.resetAt).toISOString(),
    remaining: Math.max(0, (data.resetAt - Date.now()) / 1000),
  }));

  return {
    totalEntries: rateLimitStore.size,
    entries: entries.slice(0, 100), // Limit to 100 for safety
    limits: RATE_LIMITS,
  };
}

export { checkRateLimit,
  applyRateLimit,
  getRateLimitType,
  getRateLimitHeaders,
  getRateLimitStatus,
  RATE_LIMITS, };

// Rate Limiting Middleware for Netlify Functions
// Prevents brute force attacks and API abuse

class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.startCleanup();
  }

  /**
   * Start periodic cleanup of expired entries
   */
  startCleanup() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, data] of this.requests.entries()) {
        if (now > data.resetTime) {
          this.requests.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`[RateLimiter] Cleaned up ${cleaned} expired entries`);
      }
    }, 300000); // 5 minutes
  }

  /**
   * Check if request is within rate limit
   * @param {string} identifier - Unique identifier (usually IP address)
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Object} Rate limit result
   */
  check(identifier, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const record = this.requests.get(identifier);

    // No record or window expired - start new window
    if (!record || now > record.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
        startTime: now
      });

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs,
        retryAfter: 0
      };
    }

    // Increment counter
    record.count++;
    const remaining = Math.max(0, maxRequests - record.count);

    // Over limit
    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter: retryAfter
      };
    }

    // Within limit
    return {
      allowed: true,
      remaining: remaining,
      resetTime: record.resetTime,
      retryAfter: 0
    };
  }

  /**
   * Get rate limit headers for response
   * @param {Object} limitResult - Result from check()
   * @param {number} maxRequests - Max requests limit
   * @returns {Object} Headers object
   */
  getHeaders(limitResult, maxRequests) {
    return {
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': limitResult.remaining.toString(),
      'X-RateLimit-Reset': new Date(limitResult.resetTime).toISOString()
    };
  }

  /**
   * Create rate limit exceeded response
   * @param {Object} limitResult - Result from check()
   * @param {number} maxRequests - Max requests limit
   * @returns {Object} Netlify function response
   */
  createErrorResponse(limitResult, maxRequests) {
    return {
      statusCode: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': limitResult.retryAfter.toString(),
        ...this.getHeaders(limitResult, maxRequests)
      },
      body: JSON.stringify({
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${limitResult.retryAfter} seconds.`,
        retryAfter: limitResult.retryAfter
      })
    };
  }

  /**
   * Cleanup on shutdown
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.requests.clear();
  }
}

// Singleton instance
const limiter = new RateLimiter();

/**
 * Get client identifier (IP address)
 * @param {Object} event - Netlify function event
 * @returns {string} Client identifier
 */
function getClientId(event) {
  return event.headers['x-forwarded-for'] ||
         event.headers['x-real-ip'] ||
         event.headers['client-ip'] ||
         'unknown';
}

/**
 * Apply rate limiting to a Netlify function
 * @param {Object} event - Netlify function event
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object|null} Error response if rate limited, null if allowed
 */
function applyRateLimit(event, maxRequests, windowMs) {
  const clientId = getClientId(event);
  const result = limiter.check(clientId, maxRequests, windowMs);

  if (!result.allowed) {
    console.warn(`[RateLimiter] Rate limit exceeded for ${clientId}`);
    return limiter.createErrorResponse(result, maxRequests);
  }

  return null; // Allowed - no error response
}

module.exports = {
  limiter,
  getClientId,
  applyRateLimit,
  RateLimiter
};

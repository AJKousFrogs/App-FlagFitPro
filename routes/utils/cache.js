/**
 * In-Memory Cache with ETag Support
 * Provides caching for API responses to reduce database load
 *
 * @module routes/utils/cache
 * @version 1.0.0
 */

import crypto from "crypto";
import { serverLogger } from "./server-logger.js";

// In-memory cache store
const cacheStore = new Map();

// Cache configurations by type
const CACHE_CONFIG = {
  STATS: { ttlMs: 60000, staleWhileRevalidate: 30000 }, // 1 min TTL, 30s stale
  ANALYTICS: { ttlMs: 120000, staleWhileRevalidate: 60000 }, // 2 min TTL, 1 min stale
  DASHBOARD: { ttlMs: 30000, staleWhileRevalidate: 15000 }, // 30s TTL, 15s stale
  LIST: { ttlMs: 30000, staleWhileRevalidate: 15000 }, // 30s TTL
  DEFAULT: { ttlMs: 60000, staleWhileRevalidate: 30000 },
};

// Cache statistics
const cacheStats = {
  hits: 0,
  misses: 0,
  staleHits: 0,
  invalidations: 0,
};

/**
 * Generate ETag from data
 * @param {any} data - Data to hash
 * @returns {string} ETag string
 */
function generateETag(data) {
  const hash = crypto
    .createHash("md5")
    .update(JSON.stringify(data))
    .digest("hex");
  return `"${hash}"`;
}

/**
 * Generate cache key from request
 * @param {object} req - Express request
 * @param {string} prefix - Cache key prefix
 * @returns {string} Cache key
 */
function generateCacheKey(req, prefix = "") {
  const userId = req.userId || req.query.userId || "anonymous";
  const queryString = JSON.stringify(req.query);
  const path = req.baseUrl + req.path;
  return `${prefix}:${path}:${userId}:${queryString}`;
}

/**
 * Get cached response
 * @param {string} key - Cache key
 * @param {string} type - Cache type
 * @returns {object|null} Cached entry or null
 */
function getFromCache(key, type = "DEFAULT") {
  const entry = cacheStore.get(key);
  if (!entry) {
    cacheStats.misses++;
    return null;
  }

  const config = CACHE_CONFIG[type] || CACHE_CONFIG.DEFAULT;
  const now = Date.now();
  const age = now - entry.timestamp;

  // Fresh cache hit
  if (age < config.ttlMs) {
    cacheStats.hits++;
    return { data: entry.data, etag: entry.etag, fresh: true, age };
  }

  // Stale but usable (within stale-while-revalidate window)
  if (age < config.ttlMs + config.staleWhileRevalidate) {
    cacheStats.staleHits++;
    return { data: entry.data, etag: entry.etag, fresh: false, age };
  }

  // Expired
  cacheStore.delete(key);
  cacheStats.misses++;
  return null;
}

/**
 * Store response in cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {string} type - Cache type
 */
function setInCache(key, data, type = "DEFAULT") {
  const etag = generateETag(data);
  cacheStore.set(key, {
    data,
    etag,
    timestamp: Date.now(),
    type,
  });
  return etag;
}

/**
 * Invalidate cache entries by pattern
 * @param {string} pattern - Pattern to match (supports * wildcard)
 */
function invalidateCache(pattern) {
  const regex = new RegExp(pattern.replace(/\*/g, ".*"));
  let count = 0;

  for (const key of cacheStore.keys()) {
    if (regex.test(key)) {
      cacheStore.delete(key);
      count++;
    }
  }

  cacheStats.invalidations += count;
  serverLogger.info(
    `Cache invalidated: ${count} entries matching "${pattern}"`,
  );
  return count;
}

/**
 * Clear all cache entries
 */
function clearCache() {
  const { size } = cacheStore;
  cacheStore.clear();
  serverLogger.info(`Cache cleared: ${size} entries removed`);
  return size;
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return {
    ...cacheStats,
    size: cacheStore.size,
    hitRate:
      cacheStats.hits + cacheStats.misses > 0
        ? `${(
            (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) *
            100
          ).toFixed(1)}%`
        : "0%",
  };
}

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of cacheStore.entries()) {
      const config = CACHE_CONFIG[entry.type] || CACHE_CONFIG.DEFAULT;
      const maxAge = config.ttlMs + config.staleWhileRevalidate;

      if (now - entry.timestamp > maxAge) {
        cacheStore.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      serverLogger.info(`Cache cleanup: ${cleaned} expired entries removed`);
    }
  },
  5 * 60 * 1000,
);

/**
 * Cache middleware factory
 * @param {string} type - Cache type (STATS, ANALYTICS, DASHBOARD, LIST)
 * @returns {function} Express middleware
 */
export function withCache(type = "DEFAULT") {
  return async (req, res, next) => {
    // Skip cache for non-GET requests
    if (req.method !== "GET") {
      return next();
    }

    const cacheKey = generateCacheKey(req, type);
    const cached = getFromCache(cacheKey, type);

    // Check If-None-Match header for ETag validation
    const clientETag = req.headers["if-none-match"];

    if (cached) {
      // ETag match - return 304 Not Modified
      if (clientETag && clientETag === cached.etag) {
        res.setHeader("ETag", cached.etag);
        res.setHeader("X-Cache", "HIT-ETAG");
        res.setHeader("Cache-Control", getCacheControl(type, cached.fresh));
        return res.status(304).end();
      }

      // Return cached data
      res.setHeader("ETag", cached.etag);
      res.setHeader("X-Cache", cached.fresh ? "HIT" : "STALE");
      res.setHeader("X-Cache-Age", Math.round(cached.age / 1000));
      res.setHeader("Cache-Control", getCacheControl(type, cached.fresh));

      // If stale, trigger background revalidation
      if (!cached.fresh) {
        setImmediate(() => {
          serverLogger.info(`Background revalidation for: ${cacheKey}`);
        });
      }

      return res.json(cached.data);
    }

    // No cache hit - intercept response to cache it
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const etag = setInCache(cacheKey, data, type);
        res.setHeader("ETag", etag);
        res.setHeader("X-Cache", "MISS");
        res.setHeader("Cache-Control", getCacheControl(type, true));
      }
      return originalJson(data);
    };

    next();
  };
}

/**
 * Get Cache-Control header value
 * @param {string} type - Cache type
 * @param {boolean} fresh - Whether cache is fresh
 * @returns {string} Cache-Control header value
 */
function getCacheControl(type, fresh) {
  const config = CACHE_CONFIG[type] || CACHE_CONFIG.DEFAULT;
  const maxAge = Math.round(config.ttlMs / 1000);
  const staleWhileRevalidate = Math.round(config.staleWhileRevalidate / 1000);

  if (fresh) {
    return `private, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
  }
  return `private, max-age=0, stale-while-revalidate=${staleWhileRevalidate}`;
}

/**
 * Middleware to invalidate cache on write operations
 * @param {string} pattern - Cache pattern to invalidate
 * @returns {function} Express middleware
 */
export function invalidateCacheOn(pattern) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Invalidate on successful write
      if (res.statusCode >= 200 && res.statusCode < 300) {
        invalidateCache(pattern);
      }
      return originalJson(data);
    };
    next();
  };
}

export {
  generateCacheKey,
  getFromCache,
  setInCache,
  invalidateCache,
  clearCache,
  getCacheStats,
  generateETag,
};

export default {
  withCache,
  invalidateCacheOn,
  invalidateCache,
  clearCache,
  getCacheStats,
};

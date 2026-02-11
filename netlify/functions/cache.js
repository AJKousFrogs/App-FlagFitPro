/**
 * In-Memory Caching Utility for Netlify Functions
 * Provides simple caching to reduce database queries and improve response times
 *
 * Note: Netlify functions are stateless, so this cache only persists within
 * a single function execution container. For production, consider Redis or similar.
 */

class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }

  /**
   * Generate a cache key from multiple parts
   * @param  {...any} parts - Parts to combine into a key
   * @returns {string} Cache key
   */
  generateKey(...parts) {
    return parts.filter((p) => p !== undefined && p !== null).join(":");
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if not found/expired
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
   */
  set(key, value, ttl = 300) {
    const expiresAt = ttl > 0 ? Date.now() + ttl * 1000 : null;

    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now(),
    });

    this.stats.sets++;
  }

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   * @returns {boolean} True if deleted, false if not found
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  /**
   * Delete all keys matching a pattern
   * @param {string} pattern - Pattern to match (simple string matching)
   * @returns {number} Number of keys deleted
   */
  deletePattern(pattern) {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    this.stats.deletes += count;
    return count;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    const { size } = this.cache;
    this.cache.clear();
    this.stats.deletes += size;
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate:
        this.stats.hits + this.stats.misses > 0
          ? `${(
              (this.stats.hits / (this.stats.hits + this.stats.misses)) *
              100
            ).toFixed(2)}%`
          : "0%",
    };
  }

  /**
   * Clean up expired entries
   * @returns {number} Number of expired entries removed
   */
  cleanup() {
    const now = Date.now();
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }
}

// Global cache instance
const cache = new SimpleCache();

/**
 * Cache-aside pattern helper
 * Attempts to get from cache, if miss, executes fetcher function and caches result
 * @param {string} key - Cache key
 * @param {Function} fetcher - Async function to fetch data if cache miss
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<any>} Cached or fetched data
 */
async function getOrFetch(key, fetcher, ttl = 300) {
  // Try to get from cache
  const cached = cache.get(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch data
  try {
    const data = await fetcher();

    // Cache the result
    if (data !== null && data !== undefined) {
      cache.set(key, data, ttl);
    }

    return data;
  } catch (error) {
    console.error(`Error fetching data for cache key ${key}:`, error);
    throw error;
  }
}

/**
 * Predefined cache TTLs for different data types
 */
const CACHE_TTL = {
  // Static/rarely changing data
  KNOWLEDGE_BASE: 3600, // 1 hour
  USER_PROFILE: 1800, // 30 minutes
  TEAM_INFO: 1800, // 30 minutes

  // Semi-dynamic data
  ANALYTICS: 300, // 5 minutes
  LEADERBOARD: 300, // 5 minutes
  TOURNAMENTS: 300, // 5 minutes

  // Frequently changing data
  DASHBOARD: 60, // 1 minute
  TRAINING_STATS: 60, // 1 minute
  PERFORMANCE: 60, // 1 minute

  // Real-time data (very short cache)
  GAMES: 30, // 30 seconds
  LIVE_SCORES: 10, // 10 seconds

  // Default
  DEFAULT: 300, // 5 minutes
};

/**
 * Cache key prefixes for organization
 */
const CACHE_PREFIX = {
  ANALYTICS: "analytics",
  DASHBOARD: "dashboard",
  TRAINING: "training",
  PERFORMANCE: "performance",
  USER: "user",
  TEAM: "team",
  GAME: "game",
  WELLNESS: "wellness",
  SUPPLEMENTS: "supplements",
  MEASUREMENTS: "measurements",
  TRENDS: "trends",
};

/**
 * Invalidate cache for a user
 * Useful when user data is updated
 * @param {string} userId - User ID
 * @returns {number} Number of cache entries invalidated
 */
function invalidateUserCache(userId) {
  return cache.deletePattern(`:${userId}:`);
}

/**
 * Invalidate cache by prefix
 * @param {string} prefix - Cache key prefix
 * @returns {number} Number of cache entries invalidated
 */
function invalidatePrefixCache(prefix) {
  return cache.deletePattern(prefix);
}

// Auto-cleanup expired entries every 5 minutes
setInterval(
  () => {
    const removed = cache.cleanup();
    if (removed > 0) {
      console.log(`Cache cleanup: Removed ${removed} expired entries`);
    }
  },
  5 * 60 * 1000,
);

export {
  cache,
  getOrFetch,
  CACHE_TTL,
  CACHE_PREFIX,
  invalidateUserCache,
  invalidatePrefixCache,
};

export default {
  cache,
  getOrFetch,
  CACHE_TTL,
  CACHE_PREFIX,
  invalidateUserCache,
  invalidatePrefixCache,
};

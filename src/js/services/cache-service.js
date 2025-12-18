/**
 * FlagFit Pro - Cache Service
 * Intelligent caching for API responses with TTL, invalidation, and storage management
 */

import { logger } from '../../logger.js';
import { NETWORK, STORAGE_KEYS } from '../config/app-constants.js';

/**
 * Cache entry structure
 */
class CacheEntry {
  constructor(data, ttl = NETWORK.CACHE_DURATION_MEDIUM) {
    this.data = data;
    this.timestamp = Date.now();
    this.ttl = ttl;
    this.hits = 0;
  }

  isExpired() {
    return Date.now() - this.timestamp > this.ttl;
  }

  incrementHits() {
    this.hits++;
  }

  getRemainingTTL() {
    return Math.max(0, this.ttl - (Date.now() - this.timestamp));
  }
}

/**
 * Cache Service
 */
class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.cachePrefix = STORAGE_KEYS.CACHE_PREFIX;
    this.maxMemoryCacheSize = 50; // Maximum number of entries in memory
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };

    // Clean up expired entries periodically
    this.startCleanupInterval();

    logger.debug('[Cache] Cache service initialized');
  }

  /**
   * Get data from cache
   * @param {string} key - Cache key
   * @returns {*} Cached data or null
   */
  get(key) {
    // Check memory cache first
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key);

      if (!entry.isExpired()) {
        entry.incrementHits();
        this.stats.hits++;
        logger.debug(`[Cache] Hit: ${key} (${entry.hits} hits, ${Math.round(entry.getRemainingTTL() / 1000)}s remaining)`);
        return entry.data;
      } else {
        // Expired, remove from memory
        this.memoryCache.delete(key);
        logger.debug(`[Cache] Expired: ${key}`);
      }
    }

    // Check localStorage
    try {
      const storageKey = this.cachePrefix + key;
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        const entry = JSON.parse(stored);
        const cacheEntry = new CacheEntry(entry.data, entry.ttl);
        cacheEntry.timestamp = entry.timestamp;
        cacheEntry.hits = entry.hits || 0;

        if (!cacheEntry.isExpired()) {
          // Move to memory cache for faster access
          this.setMemoryCache(key, cacheEntry);
          this.stats.hits++;
          logger.debug(`[Cache] Hit (localStorage): ${key}`);
          return cacheEntry.data;
        } else {
          // Expired, remove from storage
          localStorage.removeItem(storageKey);
          logger.debug(`[Cache] Expired (localStorage): ${key}`);
        }
      }
    } catch (error) {
      logger.warn('[Cache] Error reading from localStorage:', error);
    }

    this.stats.misses++;
    logger.debug(`[Cache] Miss: ${key}`);
    return null;
  }

  /**
   * Set data in cache
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   * @param {object} options - Cache options
   */
  set(key, data, options = {}) {
    const {
      ttl = NETWORK.CACHE_DURATION_MEDIUM,
      persistToStorage = true
    } = options;

    const entry = new CacheEntry(data, ttl);

    // Set in memory cache
    this.setMemoryCache(key, entry);

    // Persist to localStorage if requested
    if (persistToStorage) {
      try {
        const storageKey = this.cachePrefix + key;
        const serialized = JSON.stringify({
          data: entry.data,
          timestamp: entry.timestamp,
          ttl: entry.ttl,
          hits: entry.hits
        });

        localStorage.setItem(storageKey, serialized);
        logger.debug(`[Cache] Set (with persistence): ${key}, TTL: ${ttl}ms`);
      } catch (error) {
        // Handle quota exceeded
        if (error.name === 'QuotaExceededError') {
          logger.warn('[Cache] localStorage quota exceeded, clearing old entries');
          this.clearOldStorageEntries();

          // Try again
          try {
            const storageKey = this.cachePrefix + key;
            const serialized = JSON.stringify({
              data: entry.data,
              timestamp: entry.timestamp,
              ttl: entry.ttl
            });
            localStorage.setItem(storageKey, serialized);
          } catch (retryError) {
            logger.error('[Cache] Failed to cache after cleanup:', retryError);
          }
        } else {
          logger.warn('[Cache] Error writing to localStorage:', error);
        }
      }
    } else {
      logger.debug(`[Cache] Set (memory only): ${key}, TTL: ${ttl}ms`);
    }

    this.stats.sets++;
  }

  /**
   * Set entry in memory cache with size management
   * @param {string} key - Cache key
   * @param {CacheEntry} entry - Cache entry
   */
  setMemoryCache(key, entry) {
    // If cache is full, evict least recently used entry
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      this.evictLRU();
    }

    this.memoryCache.set(key, entry);
  }

  /**
   * Evict least recently used entry from memory cache
   */
  evictLRU() {
    let lruKey = null;
    let lruHits = Infinity;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.hits < lruHits) {
        lruHits = entry.hits;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.memoryCache.delete(lruKey);
      this.stats.evictions++;
      logger.debug(`[Cache] Evicted LRU: ${lruKey}`);
    }
  }

  /**
   * Invalidate (delete) cache entry
   * @param {string} key - Cache key
   */
  invalidate(key) {
    this.memoryCache.delete(key);

    try {
      const storageKey = this.cachePrefix + key;
      localStorage.removeItem(storageKey);
      logger.debug(`[Cache] Invalidated: ${key}`);
    } catch (error) {
      logger.warn('[Cache] Error invalidating cache:', error);
    }
  }

  /**
   * Invalidate all cache entries matching a pattern
   * @param {RegExp|string} pattern - Pattern to match keys
   */
  invalidatePattern(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let count = 0;

    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
        count++;
      }
    }

    // Clear from localStorage
    try {
      const keys = Object.keys(localStorage);
      for (const storageKey of keys) {
        if (storageKey.startsWith(this.cachePrefix)) {
          const key = storageKey.substring(this.cachePrefix.length);
          if (regex.test(key)) {
            localStorage.removeItem(storageKey);
            count++;
          }
        }
      }
    } catch (error) {
      logger.warn('[Cache] Error invalidating pattern:', error);
    }

    logger.debug(`[Cache] Invalidated ${count} entries matching pattern: ${pattern}`);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.memoryCache.clear();

    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.cachePrefix)) {
          localStorage.removeItem(key);
        }
      }
      logger.debug('[Cache] Cleared all cache entries');
    } catch (error) {
      logger.warn('[Cache] Error clearing cache:', error);
    }
  }

  /**
   * Clear old entries from localStorage to free space
   */
  clearOldStorageEntries() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(k => k.startsWith(this.cachePrefix));

      // Parse entries and sort by timestamp
      const entries = cacheKeys.map(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          return { key, timestamp: data.timestamp || 0 };
        } catch {
          return { key, timestamp: 0 };
        }
      }).sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest 25%
      const toRemove = Math.ceil(entries.length * 0.25);
      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(entries[i].key);
      }

      logger.debug(`[Cache] Cleared ${toRemove} old cache entries`);
    } catch (error) {
      logger.warn('[Cache] Error clearing old entries:', error);
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.isExpired()) {
        this.memoryCache.delete(key);
      }
    }

    // Clean localStorage (sample to avoid performance issues)
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(k => k.startsWith(this.cachePrefix));

      // Only check a sample if there are many keys
      const keysToCheck = cacheKeys.length > 50
        ? cacheKeys.sort(() => Math.random() - 0.5).slice(0, 20)
        : cacheKeys;

      for (const storageKey of keysToCheck) {
        try {
          const data = JSON.parse(localStorage.getItem(storageKey));
          const entry = new CacheEntry(data.data, data.ttl);
          entry.timestamp = data.timestamp;

          if (entry.isExpired()) {
            localStorage.removeItem(storageKey);
          }
        } catch {
          // Invalid entry, remove it
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      logger.warn('[Cache] Error during cleanup:', error);
    }

    logger.debug('[Cache] Cleanup completed');
  }

  /**
   * Start periodic cleanup
   */
  startCleanupInterval() {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);

    logger.debug('[Cache] Cleanup interval started');
  }

  /**
   * Stop periodic cleanup
   */
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.debug('[Cache] Cleanup interval stopped');
    }
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      memoryCacheSize: this.memoryCache.size,
      maxMemoryCacheSize: this.maxMemoryCacheSize
    };
  }

  /**
   * Log cache statistics
   */
  logStats() {
    const stats = this.getStats();
    logger.info('[Cache] Statistics:', stats);
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Export for ES6 modules
export { cacheService, CacheService };

// Make available globally
if (typeof window !== 'undefined') {
  window.cacheService = cacheService;
}

export default cacheService;

// eslint-disable-next-line no-console
console.log('[Cache] Cache service loaded');

// Memoization utilities for expensive calculations
// Prevents repeated computation of the same inputs

export class MemoizationCache {
  constructor(maxSize = 100, ttl = 15 * 60 * 1000) {
    // maxSize: Maximum number of cached entries
    // ttl: Time to live in milliseconds (default 15 minutes)
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  // Generate cache key from arguments
  generateKey(...args) {
    try {
      return JSON.stringify(args);
    } catch (error) {
      // Fallback for non-serializable arguments
      return args.map((arg) => {
        if (typeof arg === "object" && arg !== null) {
          return JSON.stringify(arg);
        }
        return String(arg);
      }).join("::");
    }
  }

  // Get cached value
  get(...args) {
    const key = this.generateKey(...args);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  // Set cached value
  set(value, ...args) {
    const key = this.generateKey(...args);

    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttl,
    });
  }

  // Clear cache
  clear() {
    this.cache.clear();
  }

  // Clear expired entries
  clearExpired() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      maxSize: this.maxSize,
    };
  }
}

// Memoize function with automatic caching
export function memoize(fn, options = {}) {
  const {
    maxSize = 100,
    ttl = 15 * 60 * 1000, // 15 minutes default
    keyGenerator,
  } = options;

  const cache = new MemoizationCache(maxSize, ttl);

  const memoized = function (...args) {
    const key = keyGenerator ? keyGenerator(...args) : cache.generateKey(...args);
    const cached = cache.get(key);

    if (cached !== null) {
      return cached;
    }

    const result = fn.apply(this, args);

    // Only cache if result is not null/undefined
    if (result !== null && result !== undefined) {
      cache.set(result, key);
    }

    return result;
  };

  // Attach cache management methods
  memoized.clearCache = () => cache.clear();
  memoized.clearExpired = () => cache.clearExpired();
  memoized.getCacheStats = () => cache.getStats();

  return memoized;
}

// Async memoize for async functions
export function memoizeAsync(fn, options = {}) {
  const {
    maxSize = 100,
    ttl = 15 * 60 * 1000,
    keyGenerator,
  } = options;

  const cache = new MemoizationCache(maxSize, ttl);
  const pending = new Map(); // Track pending promises

  const memoized = async function (...args) {
    const key = keyGenerator ? keyGenerator(...args) : cache.generateKey(...args);

    // Check cache first
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Check if already pending
    if (pending.has(key)) {
      return pending.get(key);
    }

    // Execute and cache promise
    const promise = fn.apply(this, args).then(
      (result) => {
        pending.delete(key);
        if (result !== null && result !== undefined) {
          cache.set(result, key);
        }
        return result;
      },
      (error) => {
        pending.delete(key);
        throw error;
      }
    );

    pending.set(key, promise);
    return promise;
  };

  memoized.clearCache = () => {
    cache.clear();
    pending.clear();
  };
  memoized.clearExpired = () => cache.clearExpired();
  memoized.getCacheStats = () => cache.getStats();

  return memoized;
}

// WeakMap-based memoization for object-based caching
export function weakMemoize(fn) {
  const cache = new WeakMap();

  return function (obj, ...args) {
    if (!obj || typeof obj !== "object") {
      // Fallback to regular function call for non-objects
      return fn(obj, ...args);
    }

    if (!cache.has(obj)) {
      cache.set(obj, new Map());
    }

    const objCache = cache.get(obj);
    const key = JSON.stringify(args);

    if (objCache.has(key)) {
      return objCache.get(key);
    }

    const result = fn(obj, ...args);
    objCache.set(key, result);
    return result;
  };
}

// Global cache cleanup interval (runs every 5 minutes)
if (typeof window !== "undefined") {
  setInterval(() => {
    // Clear expired entries from all caches
    // This is a global cleanup that can be called by individual caches
  }, 5 * 60 * 1000);
}

export default {
  MemoizationCache,
  memoize,
  memoizeAsync,
  weakMemoize,
};


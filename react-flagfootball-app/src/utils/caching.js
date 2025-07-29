/**
 * Enterprise-grade caching utilities and strategies
 * Provides multi-level caching, cache invalidation, and distributed caching support
 */

// Cache storage interface
class CacheStorage {
  constructor(name, options = {}) {
    this.name = name;
    this.maxSize = options.maxSize || 100;
    this.ttl = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.storage = new Map();
    this.timers = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
  }

  set(key, value, customTTL) {
    const ttl = customTTL || this.ttl;
    const expires = Date.now() + ttl;
    
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Evict old entries if cache is full
    if (this.storage.size >= this.maxSize && !this.storage.has(key)) {
      this.evictLRU();
    }

    // Store value with metadata
    this.storage.set(key, {
      value,
      expires,
      accessed: Date.now(),
      hits: 0
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);
    this.timers.set(key, timer);

    this.stats.sets++;
    return true;
  }

  get(key) {
    const entry = this.storage.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiration
    if (entry.expires < Date.now()) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access time and hit count
    entry.accessed = Date.now();
    entry.hits++;
    this.stats.hits++;
    
    return entry.value;
  }

  has(key) {
    const entry = this.storage.get(key);
    return entry && entry.expires >= Date.now();
  }

  delete(key) {
    const deleted = this.storage.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.storage.clear();
    this.timers.clear();
  }

  // Least Recently Used eviction
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.storage) {
      if (entry.accessed < oldestTime) {
        oldestTime = entry.accessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses);
    return {
      ...this.stats,
      hitRate: isNaN(hitRate) ? 0 : hitRate,
      size: this.storage.size,
      maxSize: this.maxSize
    };
  }

  // Serialize cache for persistence
  serialize() {
    const entries = [];
    for (const [key, entry] of this.storage) {
      entries.push([key, entry]);
    }
    return JSON.stringify({ entries, stats: this.stats });
  }

  // Restore cache from serialized data
  deserialize(data) {
    try {
      const parsed = JSON.parse(data);
      this.clear();
      
      parsed.entries.forEach(([key, entry]) => {
        if (entry.expires > Date.now()) {
          this.storage.set(key, entry);
          const ttl = entry.expires - Date.now();
          const timer = setTimeout(() => this.delete(key), ttl);
          this.timers.set(key, timer);
        }
      });

      this.stats = parsed.stats || this.stats;
    } catch (error) {
      console.error('Failed to deserialize cache:', error);
    }
  }
}

// Multi-level cache manager
export class CacheManager {
  constructor(options = {}) {
    this.levels = new Map();
    this.options = {
      l1Size: 50,
      l1TTL: 30 * 1000, // 30 seconds
      l2Size: 200,
      l2TTL: 5 * 60 * 1000, // 5 minutes
      l3Size: 1000,
      l3TTL: 30 * 60 * 1000, // 30 minutes
      ...options
    };

    // Initialize cache levels
    this.levels.set('L1', new CacheStorage('L1', {
      maxSize: this.options.l1Size,
      ttl: this.options.l1TTL
    }));

    this.levels.set('L2', new CacheStorage('L2', {
      maxSize: this.options.l2Size,
      ttl: this.options.l2TTL
    }));

    this.levels.set('L3', new CacheStorage('L3', {
      maxSize: this.options.l3Size,
      ttl: this.options.l3TTL
    }));

    // Setup persistent storage for L3
    this.setupPersistence();
  }

  async get(key, options = {}) {
    const { skipL1 = false, skipL2 = false, skipL3 = false } = options;

    // Try L1 cache first (fastest)
    if (!skipL1) {
      const l1Value = this.levels.get('L1').get(key);
      if (l1Value !== null) {
        return l1Value;
      }
    }

    // Try L2 cache
    if (!skipL2) {
      const l2Value = this.levels.get('L2').get(key);
      if (l2Value !== null) {
        // Promote to L1
        this.levels.get('L1').set(key, l2Value);
        return l2Value;
      }
    }

    // Try L3 cache
    if (!skipL3) {
      const l3Value = this.levels.get('L3').get(key);
      if (l3Value !== null) {
        // Promote to L2 and L1
        this.levels.get('L2').set(key, l3Value);
        this.levels.get('L1').set(key, l3Value);
        return l3Value;
      }
    }

    return null;
  }

  set(key, value, options = {}) {
    const { level = 'all', ttl } = options;

    if (level === 'all' || level === 'L1') {
      this.levels.get('L1').set(key, value, ttl);
    }
    if (level === 'all' || level === 'L2') {
      this.levels.get('L2').set(key, value, ttl);
    }
    if (level === 'all' || level === 'L3') {
      this.levels.get('L3').set(key, value, ttl);
      this.persistL3();
    }
  }

  delete(key) {
    this.levels.get('L1').delete(key);
    this.levels.get('L2').delete(key);
    this.levels.get('L3').delete(key);
    this.persistL3();
  }

  clear(level) {
    if (level) {
      this.levels.get(level)?.clear();
    } else {
      this.levels.forEach(cache => cache.clear());
    }
    this.persistL3();
  }

  getStats() {
    const stats = {};
    this.levels.forEach((cache, level) => {
      stats[level] = cache.getStats();
    });
    return stats;
  }

  // Setup persistence for L3 cache
  setupPersistence() {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Restore L3 cache on startup
      const stored = localStorage.getItem('cache-l3');
      if (stored) {
        this.levels.get('L3').deserialize(stored);
      }

      // Save L3 cache periodically
      setInterval(() => {
        this.persistL3();
      }, 60000); // Every minute

      // Save on page unload
      window.addEventListener('beforeunload', () => {
        this.persistL3();
      });
    }
  }

  persistL3() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const serialized = this.levels.get('L3').serialize();
        localStorage.setItem('cache-l3', serialized);
      } catch (error) {
        console.warn('Failed to persist L3 cache:', error);
      }
    }
  }
}

// HTTP cache utilities
export const httpCache = {
  // Cache HTTP responses
  cacheResponse: async (request, response, ttl = 5 * 60 * 1000) => {
    if (typeof caches !== 'undefined') {
      try {
        const cache = await caches.open('http-cache-v1');
        const responseClone = response.clone();
        
        // Add cache headers
        const headers = new Headers(responseClone.headers);
        headers.set('cached-at', Date.now().toString());
        headers.set('cache-ttl', ttl.toString());
        
        const cachedResponse = new Response(responseClone.body, {
          status: responseClone.status,
          statusText: responseClone.statusText,
          headers
        });
        
        await cache.put(request, cachedResponse);
      } catch (error) {
        console.warn('Failed to cache response:', error);
      }
    }
  },

  // Get cached response
  getCachedResponse: async (request) => {
    if (typeof caches !== 'undefined') {
      try {
        const cache = await caches.open('http-cache-v1');
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
          const cachedAt = parseInt(cachedResponse.headers.get('cached-at') || '0');
          const ttl = parseInt(cachedResponse.headers.get('cache-ttl') || '0');
          
          if (Date.now() - cachedAt < ttl) {
            return cachedResponse;
          } else {
            // Cache expired, remove it
            await cache.delete(request);
          }
        }
      } catch (error) {
        console.warn('Failed to get cached response:', error);
      }
    }
    return null;
  },

  // Clear HTTP cache
  clearCache: async () => {
    if (typeof caches !== 'undefined') {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
      } catch (error) {
        console.warn('Failed to clear HTTP cache:', error);
      }
    }
  }
};

// Cache invalidation patterns
export const cacheInvalidation = {
  // Tag-based invalidation
  tags: new Map(),

  // Associate cache keys with tags
  addTag: (key, tag) => {
    if (!cacheInvalidation.tags.has(tag)) {
      cacheInvalidation.tags.set(tag, new Set());
    }
    cacheInvalidation.tags.get(tag).add(key);
  },

  // Invalidate all keys with a specific tag
  invalidateTag: (tag, cacheManager) => {
    const keys = cacheInvalidation.tags.get(tag);
    if (keys) {
      keys.forEach(key => {
        cacheManager.delete(key);
      });
      cacheInvalidation.tags.delete(tag);
    }
  },

  // Time-based invalidation
  scheduleInvalidation: (key, cacheManager, delay) => {
    setTimeout(() => {
      cacheManager.delete(key);
    }, delay);
  },

  // Event-based invalidation
  eventListeners: new Map(),

  // Listen for events to invalidate cache
  onEvent: (eventName, callback) => {
    if (!cacheInvalidation.eventListeners.has(eventName)) {
      cacheInvalidation.eventListeners.set(eventName, []);
    }
    cacheInvalidation.eventListeners.get(eventName).push(callback);
  },

  // Trigger event-based invalidation
  triggerEvent: (eventName, data) => {
    const listeners = cacheInvalidation.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
};

// Distributed cache interface
export class DistributedCache {
  constructor(options = {}) {
    this.options = {
      peers: [],
      syncInterval: 30000, // 30 seconds
      conflictResolution: 'last-write-wins',
      ...options
    };
    this.localCache = new CacheManager();
    this.syncQueue = [];
    this.setupSync();
  }

  async get(key) {
    // Try local cache first
    const localValue = await this.localCache.get(key);
    if (localValue !== null) {
      return localValue;
    }

    // Try peers
    for (const peer of this.options.peers) {
      try {
        const remoteValue = await this.getFromPeer(peer, key);
        if (remoteValue !== null) {
          // Cache locally
          this.localCache.set(key, remoteValue);
          return remoteValue;
        }
      } catch (error) {
        console.warn(`Failed to get from peer ${peer}:`, error);
      }
    }

    return null;
  }

  set(key, value, options = {}) {
    // Set locally
    this.localCache.set(key, value, options);

    // Queue for synchronization
    this.syncQueue.push({
      type: 'set',
      key,
      value,
      timestamp: Date.now(),
      options
    });
  }

  delete(key) {
    this.localCache.delete(key);
    this.syncQueue.push({
      type: 'delete',
      key,
      timestamp: Date.now()
    });
  }

  // Get value from peer
  async getFromPeer(peer, key) {
    // This would implement actual network communication
    // For now, it's a placeholder
    return null;
  }

  // Setup synchronization with peers
  setupSync() {
    setInterval(() => {
      this.syncWithPeers();
    }, this.options.syncInterval);
  }

  // Synchronize with peers
  async syncWithPeers() {
    if (this.syncQueue.length === 0) return;

    const operations = [...this.syncQueue];
    this.syncQueue = [];

    for (const peer of this.options.peers) {
      try {
        await this.syncToPeer(peer, operations);
      } catch (error) {
        console.warn(`Failed to sync to peer ${peer}:`, error);
        // Re-queue operations on failure
        this.syncQueue.push(...operations);
      }
    }
  }

  // Sync operations to peer
  async syncToPeer(peer, operations) {
    // This would implement actual network synchronization
    // For now, it's a placeholder
    console.log(`Syncing ${operations.length} operations to ${peer}`);
  }
}

// Global cache instance
export const globalCache = new CacheManager({
  l1Size: 100,
  l1TTL: 30 * 1000,
  l2Size: 500,
  l2TTL: 5 * 60 * 1000,
  l3Size: 2000,
  l3TTL: 60 * 60 * 1000 // 1 hour
});

// Cache decorators and utilities
export const cacheUtils = {
  // Memoize function with cache
  memoize: (fn, keyGenerator, ttl) => {
    return async (...args) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      let cached = await globalCache.get(key);
      if (cached !== null) {
        return cached;
      }

      const result = await fn(...args);
      globalCache.set(key, result, { ttl });
      return result;
    };
  },

  // Cache with stale-while-revalidate pattern
  staleWhileRevalidate: (fn, keyGenerator, ttl, staleTTL) => {
    return async (...args) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      let cached = await globalCache.get(key);
      if (cached !== null) {
        // Check if stale
        const cacheAge = Date.now() - (cached.timestamp || 0);
        if (cacheAge > ttl) {
          // Return stale data immediately and revalidate in background
          setTimeout(async () => {
            try {
              const fresh = await fn(...args);
              globalCache.set(key, { ...fresh, timestamp: Date.now() }, { ttl: staleTTL });
            } catch (error) {
              console.warn('Background revalidation failed:', error);
            }
          }, 0);
        }
        return cached;
      }

      // No cache, fetch fresh
      const result = await fn(...args);
      globalCache.set(key, { ...result, timestamp: Date.now() }, { ttl: staleTTL });
      return result;
    };
  },

  // Generate cache key
  generateKey: (prefix, ...parts) => {
    return `${prefix}:${parts.join(':')}`;
  },

  // Cache warming
  warmCache: async (keys, fetcher) => {
    const promises = keys.map(async (key) => {
      try {
        const value = await fetcher(key);
        globalCache.set(key, value);
      } catch (error) {
        console.warn(`Failed to warm cache for key ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }
};

export default {
  CacheStorage,
  CacheManager,
  DistributedCache,
  httpCache,
  cacheInvalidation,
  globalCache,
  cacheUtils
};
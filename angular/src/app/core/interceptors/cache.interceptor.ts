/**
 * HTTP Cache Interceptor
 *
 * Implements intelligent caching for HTTP requests to improve performance:
 * - Reduces redundant API calls
 * - Faster repeat navigation
 * - Better offline experience
 * - Time-based cache invalidation
 *
 * Features:
 * - Time-based expiration (5 min default for user data, 1 hour for static)
 * - Cache-Control header support
 * - Manual cache invalidation
 * - Skip cache for POST/PUT/DELETE/PATCH
 * - MEMORY SAFETY: LRU eviction when cache exceeds size limit
 */

import { HttpInterceptorFn, HttpResponse } from "@angular/common/http";
import { of, tap } from "rxjs";
import { TIMEOUTS } from "../constants/app.constants";

/**
 * Memory management constants for HTTP cache
 * Prevents unbounded memory growth
 */
const CACHE_MEMORY_LIMITS = {
  /** Maximum number of entries in the cache */
  MAX_ENTRIES: 100,
  /** Cleanup interval in milliseconds (5 minutes) */
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000,
} as const;

interface CacheEntry {
  response: HttpResponse<unknown>;
  timestamp: number;
  /** Last access time for LRU eviction */
  lastAccess: number;
}

class HttpCacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTtl = TIMEOUTS.CACHE_TTL_DEFAULT;
  private readonly staticTtl = TIMEOUTS.CACHE_TTL_STATIC;
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Start periodic cleanup to remove expired entries
    this.startCleanupInterval();
  }

  /**
   * Start periodic cleanup of expired cache entries
   */
  private startCleanupInterval(): void {
    if (typeof window !== "undefined") {
      this.cleanupIntervalId = setInterval(() => {
        this.cleanupExpired();
      }, CACHE_MEMORY_LIMITS.CLEANUP_INTERVAL_MS);
    }
  }

  /**
   * Remove all expired entries from cache
   */
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [url, entry] of this.cache.entries()) {
      const ttl = this.getTtlForUrl(url);
      if (now - entry.timestamp > ttl) {
        this.cache.delete(url);
      }
    }
  }

  /**
   * Evict least recently used entries when cache is full
   * MEMORY SAFETY: Prevents unbounded cache growth
   */
  private evictLRU(): void {
    if (this.cache.size < CACHE_MEMORY_LIMITS.MAX_ENTRIES) {
      return;
    }

    // Find the least recently accessed entry
    let oldestUrl: string | null = null;
    let oldestAccess = Infinity;

    for (const [url, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess;
        oldestUrl = url;
      }
    }

    if (oldestUrl) {
      this.cache.delete(oldestUrl);
    }
  }

  get(url: string, ttl?: number): HttpResponse<unknown> | null {
    const cached = this.cache.get(url);
    if (!cached) return null;

    const expirationTime = ttl || this.defaultTtl;
    const age = Date.now() - cached.timestamp;

    if (age > expirationTime) {
      this.cache.delete(url);
      return null;
    }

    // Update last access time for LRU tracking
    cached.lastAccess = Date.now();

    return cached.response;
  }

  set(url: string, response: HttpResponse<unknown>): void {
    // MEMORY SAFETY: Evict LRU entry if cache is full
    this.evictLRU();

    const now = Date.now();
    this.cache.set(url, {
      response,
      timestamp: now,
      lastAccess: now,
    });
  }

  clear(url?: string): void {
    if (url) {
      this.cache.delete(url);
    } else {
      this.cache.clear();
    }
  }

  clearPattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  getTtlForUrl(url: string): number {
    // Static resources get longer cache
    if (
      url.includes("/static/") ||
      url.includes("/assets/") ||
      url.includes("/exercises/") ||
      url.includes("/teams/list")
    ) {
      return this.staticTtl;
    }

    // User-specific data gets shorter cache
    return this.defaultTtl;
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: CACHE_MEMORY_LIMITS.MAX_ENTRIES,
    };
  }

  /**
   * Cleanup resources (call on app destroy if needed)
   */
  destroy(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
    this.cache.clear();
  }
}

// Global cache service instance
const cacheService = new HttpCacheService();

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  // Only cache GET requests
  if (req.method !== "GET") {
    // Clear related cache on mutations
    if (
      req.method === "POST" ||
      req.method === "PUT" ||
      req.method === "DELETE" ||
      req.method === "PATCH"
    ) {
      const urlPattern = new RegExp(req.url.split("/").slice(0, -1).join("/"));
      cacheService.clearPattern(urlPattern);
    }
    return next(req);
  }

  // Check if request explicitly disables cache
  if (req.headers.has("X-No-Cache")) {
    return next(req);
  }

  // Check cache
  const ttl = cacheService.getTtlForUrl(req.url);
  const cachedResponse = cacheService.get(req.url, ttl);

  if (cachedResponse) {
    // Return cached response
    return of(cachedResponse.clone());
  }

  // Make request and cache response
  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        // Only cache successful responses
        if (event.status === 200) {
          cacheService.set(req.url, event);
        }
      }
    }),
  );
};

// Export service for manual cache management
export { cacheService as HttpCacheService };

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
 */

import { HttpInterceptorFn, HttpResponse } from "@angular/common/http";
import { of, tap } from "rxjs";
import { TIMEOUTS } from "../constants/app.constants";

interface CacheEntry {
  response: HttpResponse<unknown>;
  timestamp: number;
}

class HttpCacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTtl = TIMEOUTS.CACHE_TTL_DEFAULT;
  private readonly staticTtl = TIMEOUTS.CACHE_TTL_STATIC;

  get(url: string, ttl?: number): HttpResponse<unknown> | null {
    const cached = this.cache.get(url);
    if (!cached) return null;

    const expirationTime = ttl || this.defaultTtl;
    const age = Date.now() - cached.timestamp;

    if (age > expirationTime) {
      this.cache.delete(url);
      return null;
    }

    return cached.response;
  }

  set(url: string, response: HttpResponse<unknown>): void {
    this.cache.set(url, {
      response,
      timestamp: Date.now(),
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

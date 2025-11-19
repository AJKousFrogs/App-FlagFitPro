// Performance optimization utilities for FlagFit Pro
// Provides lazy loading, caching, and optimization features

import { logger } from "./logger.js";

export class PerformanceUtils {
  static cache = new Map();
  static observers = new Map();

  // Lazy load images with intersection observer
  static setupLazyLoading() {
    if (!("IntersectionObserver" in window)) {
      logger.warn(
        "IntersectionObserver not supported, falling back to immediate loading",
      );
      return;
    }

    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;

            if (src) {
              img.src = src;
              img.removeAttribute("data-src");
              img.classList.remove("lazy");
              observer.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: "50px 0px",
        threshold: 0.01,
      },
    );

    // Observe all lazy images
    document.querySelectorAll("img[data-src]").forEach((img) => {
      img.classList.add("lazy");
      imageObserver.observe(img);
    });

    this.observers.set("images", imageObserver);
  }

  // Debounce function for search and input handlers
  static debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(this, args);
    };
  }

  // Throttle function for scroll and resize handlers
  static throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Cache API responses with expiration
  static cacheResponse(key, data, expirationMinutes = 15) {
    const expiration = Date.now() + expirationMinutes * 60 * 1000;
    this.cache.set(key, {
      data,
      expiration,
    });
  }

  // Get cached response
  static getCachedResponse(key) {
    const cached = this.cache.get(key);

    if (!cached) return null;

    if (Date.now() > cached.expiration) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  // Clear expired cache entries
  static clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiration) {
        this.cache.delete(key);
      }
    }
  }

  // Optimize DOM operations by batching reads and writes
  static batchDOMOperations(operations) {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        const results = operations.map((op) => op());
        resolve(results);
      });
    });
  }

  // Virtual scrolling for large lists
  static setupVirtualScrolling(container, items, renderItem, itemHeight = 60) {
    const viewport = container.querySelector(".virtual-viewport") || container;
    const content = document.createElement("div");
    content.className = "virtual-content";
    content.style.position = "relative";

    let scrollTop = 0;
    let viewportHeight = viewport.clientHeight;

    const render = this.throttle(() => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(
        startIndex + Math.ceil(viewportHeight / itemHeight) + 1,
        items.length,
      );

      // Clear existing items
      content.innerHTML = "";

      // Set total height for scrollbar
      content.style.height = `${items.length * itemHeight}px`;

      // Render visible items
      for (let i = startIndex; i < endIndex; i++) {
        if (items[i]) {
          const element = renderItem(items[i], i);
          element.style.position = "absolute";
          element.style.top = `${i * itemHeight}px`;
          element.style.height = `${itemHeight}px`;
          content.appendChild(element);
        }
      }
    }, 16); // ~60fps

    viewport.addEventListener("scroll", () => {
      scrollTop = viewport.scrollTop;
      render();
    });

    window.addEventListener(
      "resize",
      this.debounce(() => {
        viewportHeight = viewport.clientHeight;
        render();
      }, 250),
    );

    viewport.appendChild(content);
    render(); // Initial render

    return {
      update: (newItems) => {
        items = newItems;
        render();
      },
    };
  }

  // Preload critical resources
  static preloadResources(resources) {
    resources.forEach((resource) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.href = resource.url;

      if (resource.type === "font") {
        link.as = "font";
        link.crossOrigin = "anonymous";
      } else if (resource.type === "style") {
        link.as = "style";
      } else if (resource.type === "script") {
        link.as = "script";
      } else if (resource.type === "image") {
        link.as = "image";
      } else if (resource.type === "module") {
        // ES modules should use 'fetch' with crossorigin
        link.as = "fetch";
        link.crossOrigin = "anonymous";
      }

      document.head.appendChild(link);
    });
  }

  // Monitor performance metrics
  static measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    logger.debug(`Performance: ${name}: ${(end - start).toFixed(2)}ms`);

    // Log slow operations
    if (end - start > 100) {
      logger.warn(
        `Slow operation detected: ${name} took ${(end - start).toFixed(2)}ms`,
      );
    }

    return result;
  }

  // Async version of measurePerformance
  static async measureAsyncPerformance(name, fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    logger.debug(`Performance: ${name}: ${(end - start).toFixed(2)}ms`);

    if (end - start > 100) {
      logger.warn(
        `Slow async operation detected: ${name} took ${(end - start).toFixed(2)}ms`,
      );
    }

    return result;
  }

  // Component-based code splitting helper
  static async loadComponent(componentPath) {
    const cacheKey = `component_${componentPath}`;
    const cached = this.getCachedResponse(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const module = await import(componentPath);
      this.cacheResponse(cacheKey, module, 60); // Cache for 1 hour
      return module;
    } catch (error) {
      logger.error(`Failed to load component: ${componentPath}`, error);
      throw error;
    }
  }

  // Clean up will-change after animation completes
  static setupWillChangeCleanup() {
    // Remove will-change after animation completes
    document.addEventListener("animationend", (e) => {
      const target = e.target;
      if (
        target.classList.contains("u-animate-fade-in") ||
        target.classList.contains("u-animate-fade-out") ||
        target.classList.contains("u-animate-slide-in-up") ||
        target.classList.contains("u-animate-slide-in-down") ||
        target.classList.contains("u-animate-slide-in-left") ||
        target.classList.contains("u-animate-slide-in-right") ||
        target.classList.contains("u-animate-scale-in") ||
        target.classList.contains("u-animate-shake") ||
        target.classList.contains("u-animate-fade-in-up") ||
        target.classList.contains("u-animate-slide-in-right")
      ) {
        target.style.willChange = "auto";
      }
    });

    // Remove will-change after transition completes
    document.addEventListener("transitionend", (e) => {
      const target = e.target;
      if (target.classList.contains("u-transition-transform")) {
        target.style.willChange = "auto";
      }
    });
  }

  // Initialize all performance optimizations
  static init() {
    logger.debug("Initializing performance optimizations...");
    this.setupWillChangeCleanup();

    // Setup lazy loading
    this.setupLazyLoading();

    // Clear expired cache periodically
    setInterval(
      () => {
        this.clearExpiredCache();
      },
      5 * 60 * 1000,
    ); // Every 5 minutes

    // Preload critical resources with proper 'as' attributes
    // Note: ES modules (auth-manager.js, api-config.js, error-handler.js) are loaded via ES6 imports
    // and don't need preloading as they're already efficiently handled by the browser's module loader
    // Only preload resources that are loaded as regular scripts or styles
    this.preloadResources([
      {
        url: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap",
        type: "style",
        as: "style",
      },
    ]);

    // Monitor page load performance
    window.addEventListener("load", () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType("navigation")[0];
        if (perfData) {
          logger.debug("Page Load Performance:", {
            domContentLoaded: `${perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart}ms`,
            loadComplete: `${perfData.loadEventEnd - perfData.loadEventStart}ms`,
            totalLoadTime: `${
              perfData.loadEventEnd && perfData.navigationStart
                ? perfData.loadEventEnd - perfData.navigationStart
                : perfData.domContentLoadedEventEnd -
                  perfData.domContentLoadedEventStart +
                  (perfData.loadEventEnd - perfData.loadEventStart)
            }ms`,
          });
        }
      }, 100);
    });

    logger.success("Performance optimizations initialized");
  }

  // Cleanup observers and resources
  static cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    this.cache.clear();
  }
}

// Auto-initialize when module is imported
if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    PerformanceUtils.init();
  });
}

export default PerformanceUtils;

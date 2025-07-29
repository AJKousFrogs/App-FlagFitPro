/**
 * Enterprise-grade performance utilities and monitoring
 * Provides performance tracking, optimization, and analytics
 */

// Performance monitoring utilities
export class PerformanceMonitor {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.sampleRate = options.sampleRate || 0.1; // 10% sampling
    this.metrics = new Map();
    this.observers = [];
    
    if (this.enabled && typeof window !== 'undefined') {
      this.setupObservers();
    }
  }

  // Setup performance observers
  setupObservers() {
    try {
      // Navigation timing
      if ('PerformanceObserver' in window) {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('navigation', {
              type: entry.entryType,
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime,
              ...this.extractNavigationMetrics(entry)
            });
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);

        // Resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('resource', {
              name: entry.name,
              duration: entry.duration,
              size: entry.transferSize,
              type: this.getResourceType(entry.name),
              cached: entry.transferSize === 0
            });
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('lcp', {
            value: lastEntry.startTime,
            element: lastEntry.element?.tagName,
            url: lastEntry.url
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('fid', {
              value: entry.processingStart - entry.startTime,
              startTime: entry.startTime
            });
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          this.recordMetric('cls', { value: clsValue });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      }
    } catch (error) {
      console.warn('Performance observer setup failed:', error);
    }
  }

  // Extract navigation timing metrics
  extractNavigationMetrics(entry) {
    return {
      ttfb: entry.responseStart - entry.requestStart, // Time to First Byte
      domLoad: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      windowLoad: entry.loadEventEnd - entry.loadEventStart,
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ssl: entry.connectEnd - entry.secureConnectionStart || 0,
      request: entry.responseStart - entry.requestStart,
      response: entry.responseEnd - entry.responseStart,
      dom: entry.domContentLoadedEventStart - entry.responseEnd,
      render: entry.loadEventStart - entry.domContentLoadedEventEnd
    };
  }

  // Get resource type from URL
  getResourceType(url) {
    const extension = url.split('.').pop()?.toLowerCase();
    const typeMap = {
      'js': 'script',
      'css': 'stylesheet',
      'png': 'image',
      'jpg': 'image',
      'jpeg': 'image',
      'gif': 'image',
      'svg': 'image',
      'webp': 'image',
      'woff': 'font',
      'woff2': 'font',
      'ttf': 'font',
      'eot': 'font'
    };
    return typeMap[extension] || 'other';
  }

  // Record performance metric
  recordMetric(type, data) {
    if (!this.shouldSample()) return;
    
    const timestamp = Date.now();
    const metric = {
      type,
      timestamp,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Store metric
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }
    this.metrics.get(type).push(metric);

    // Send to analytics (implement your analytics service)
    this.sendToAnalytics(metric);
  }

  // Check if should sample this metric
  shouldSample() {
    return Math.random() < this.sampleRate;
  }

  // Send metric to analytics service
  sendToAnalytics(metric) {
    // In production, send to your analytics service
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance metric:', metric);
    }
    
    // Example: Send to Google Analytics, Mixpanel, etc.
    // analytics.track('performance_metric', metric);
  }

  // Get collected metrics
  getMetrics(type) {
    return type ? this.metrics.get(type) || [] : Object.fromEntries(this.metrics);
  }

  // Clear metrics
  clearMetrics() {
    this.metrics.clear();
  }

  // Cleanup observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Performance timing utilities
export const performanceUtils = {
  // Measure function execution time
  measureTime: (name, fn) => {
    return async (...args) => {
      const start = performance.now();
      try {
        const result = await fn(...args);
        const duration = performance.now() - start;
        
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'timing_complete', {
            name,
            value: Math.round(duration)
          });
        }
        
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms:`, error);
        throw error;
      }
    };
  },

  // Mark performance milestones
  mark: (name) => {
    if (typeof window !== 'undefined' && window.performance?.mark) {
      window.performance.mark(name);
    }
  },

  // Measure between marks
  measure: (name, startMark, endMark) => {
    if (typeof window !== 'undefined' && window.performance?.measure) {
      window.performance.measure(name, startMark, endMark);
      const measure = window.performance.getEntriesByName(name, 'measure')[0];
      return measure ? measure.duration : 0;
    }
    return 0;
  },

  // Get Core Web Vitals
  getCoreWebVitals: () => {
    return new Promise((resolve) => {
      const metrics = {};
      
      // LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        metrics.lcp = entries[entries.length - 1].startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        metrics.fid = entries[0].processingStart - entries[0].startTime;
      }).observe({ entryTypes: ['first-input'] });

      // CLS
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        metrics.cls = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });

      // Wait and resolve
      setTimeout(() => resolve(metrics), 5000);
    });
  }
};

// Memory monitoring
export const memoryUtils = {
  // Get memory usage
  getMemoryUsage: () => {
    if (typeof window !== 'undefined' && window.performance?.memory) {
      return {
        used: window.performance.memory.usedJSHeapSize,
        total: window.performance.memory.totalJSHeapSize,
        limit: window.performance.memory.jsHeapSizeLimit,
        percentage: (window.performance.memory.usedJSHeapSize / window.performance.memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  },

  // Monitor memory leaks
  monitorMemoryLeaks: (threshold = 80) => {
    setInterval(() => {
      const memory = memoryUtils.getMemoryUsage();
      if (memory && memory.percentage > threshold) {
        console.warn(`🚨 High memory usage: ${memory.percentage.toFixed(2)}%`);
        
        // Send alert to monitoring service
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'high_memory_usage', {
            percentage: memory.percentage,
            used: memory.used,
            total: memory.total
          });
        }
      }
    }, 30000); // Check every 30 seconds
  }
};

// Bundle analysis utilities
export const bundleUtils = {
  // Get bundle size information
  getBundleInfo: () => {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    
    return {
      scripts: scripts.map(script => ({
        src: script.src,
        async: script.async,
        defer: script.defer
      })),
      stylesheets: stylesheets.map(link => ({
        href: link.href,
        media: link.media
      })),
      totalScripts: scripts.length,
      totalStylesheets: stylesheets.length
    };
  },

  // Analyze resource loading
  analyzeResourceLoading: () => {
    const resources = performance.getEntriesByType('resource');
    const analysis = {
      totalResources: resources.length,
      byType: {},
      slowResources: [],
      cachedResources: [],
      totalSize: 0,
      totalDuration: 0
    };

    resources.forEach(resource => {
      const type = bundleUtils.getResourceType(resource.name);
      
      // Group by type
      if (!analysis.byType[type]) {
        analysis.byType[type] = { count: 0, size: 0, duration: 0 };
      }
      analysis.byType[type].count++;
      analysis.byType[type].size += resource.transferSize || 0;
      analysis.byType[type].duration += resource.duration || 0;

      // Track slow resources (>1s)
      if (resource.duration > 1000) {
        analysis.slowResources.push({
          name: resource.name,
          duration: resource.duration,
          size: resource.transferSize
        });
      }

      // Track cached resources
      if (resource.transferSize === 0 && resource.duration < 50) {
        analysis.cachedResources.push(resource.name);
      }

      analysis.totalSize += resource.transferSize || 0;
      analysis.totalDuration += resource.duration || 0;
    });

    return analysis;
  },

  getResourceType: (url) => {
    const extension = url.split('.').pop()?.toLowerCase();
    const typeMap = {
      'js': 'JavaScript',
      'css': 'CSS',
      'png': 'Image',
      'jpg': 'Image',
      'jpeg': 'Image',
      'gif': 'Image',
      'svg': 'Image',
      'webp': 'Image',
      'woff': 'Font',
      'woff2': 'Font',
      'ttf': 'Font',
      'eot': 'Font',
      'json': 'Data',
      'xml': 'Data'
    };
    return typeMap[extension] || 'Other';
  }
};

// React performance utilities
export const reactUtils = {
  // Profile component renders
  profileRender: (Component, name) => {
    return React.memo(React.forwardRef((props, ref) => {
      const startTime = performance.now();
      
      React.useEffect(() => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        if (renderTime > 16) { // Slower than 60fps
          console.warn(`🐌 Slow render: ${name} took ${renderTime.toFixed(2)}ms`);
        }
        
        performanceUtils.mark(`${name}-render-end`);
        performanceUtils.measure(`${name}-render`, `${name}-render-start`, `${name}-render-end`);
      });

      performanceUtils.mark(`${name}-render-start`);
      return React.createElement(Component, { ...props, ref });
    }));
  },

  // Detect render cycles
  detectRenderCycles: (threshold = 10) => {
    const renderCounts = new Map();
    
    return (componentName) => {
      const count = renderCounts.get(componentName) || 0;
      renderCounts.set(componentName, count + 1);
      
      if (count > threshold) {
        console.warn(`🔄 Excessive renders detected: ${componentName} rendered ${count} times`);
      }
      
      // Reset count after 5 seconds
      setTimeout(() => {
        renderCounts.set(componentName, 0);
      }, 5000);
    };
  }
};

// Performance optimization helpers
export const optimizationHelpers = {
  // Debounce function
  debounce: (func, wait, immediate = false) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  },

  // Throttle function
  throttle: (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Memoize function results
  memoize: (func, getKey = (...args) => JSON.stringify(args)) => {
    const cache = new Map();
    return (...args) => {
      const key = getKey(...args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = func(...args);
      cache.set(key, result);
      return result;
    };
  },

  // Batch DOM operations
  batchDOMOperations: (operations) => {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        operations.forEach(op => op());
        resolve();
      });
    });
  },

  // Preload resources
  preloadResource: (url, as = 'script') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = as;
    document.head.appendChild(link);
  },

  // Lazy load images
  lazyLoadImage: (img, options = {}) => {
    const { threshold = 0.1, rootMargin = '50px' } = options;
    
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      }, { threshold, rootMargin });
      
      observer.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      img.src = img.dataset.src;
    }
  }
};

// Initialize performance monitoring
let performanceMonitor = null;

export const initializePerformanceMonitoring = (options = {}) => {
  if (typeof window !== 'undefined' && !performanceMonitor) {
    performanceMonitor = new PerformanceMonitor(options);
    
    // Start memory monitoring
    memoryUtils.monitorMemoryLeaks();
    
    // Report Core Web Vitals
    performanceUtils.getCoreWebVitals().then(metrics => {
      console.log('📊 Core Web Vitals:', metrics);
    });

    console.log('🚀 Performance monitoring initialized');
  }
  
  return performanceMonitor;
};

export const getPerformanceMonitor = () => performanceMonitor;

export default {
  PerformanceMonitor,
  performanceUtils,
  memoryUtils,
  bundleUtils,
  reactUtils,
  optimizationHelpers,
  initializePerformanceMonitoring,
  getPerformanceMonitor
};
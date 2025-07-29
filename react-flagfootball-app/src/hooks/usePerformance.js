import { useState, useEffect, useCallback, useRef } from 'react';
import { performanceUtils, memoryUtils, getPerformanceMonitor } from '../utils/performance';

/**
 * Enterprise-grade performance monitoring hooks
 * Provides React hooks for performance tracking and optimization
 */

// Hook for measuring render performance
export const useRenderPerformance = (componentName) => {
  const renderStartTime = useRef(null);
  const renderCount = useRef(0);
  const [renderStats, setRenderStats] = useState({
    totalRenders: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    slowRenders: 0
  });

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;
  });

  useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      
      setRenderStats(prev => {
        const newTotalRenders = prev.totalRenders + 1;
        const newAverageRenderTime = (prev.averageRenderTime * prev.totalRenders + renderTime) / newTotalRenders;
        const newSlowRenders = prev.slowRenders + (renderTime > 16 ? 1 : 0);
        
        return {
          totalRenders: newTotalRenders,
          averageRenderTime: newAverageRenderTime,
          lastRenderTime: renderTime,
          slowRenders: newSlowRenders
        };
      });

      // Log slow renders
      if (renderTime > 16) {
        console.warn(`🐌 Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }

      // Mark performance milestone
      performanceUtils.mark(`${componentName}-render-${renderCount.current}`);
    }
  });

  return renderStats;
};

// Hook for monitoring memory usage
export const useMemoryMonitor = (options = {}) => {
  const { 
    interval = 5000, 
    threshold = 80, 
    onThresholdExceeded 
  } = options;
  
  const [memoryStats, setMemoryStats] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    
    const monitorMemory = () => {
      const memory = memoryUtils.getMemoryUsage();
      if (memory) {
        setMemoryStats(memory);
        
        if (memory.percentage > threshold) {
          console.warn(`🚨 Memory threshold exceeded: ${memory.percentage.toFixed(2)}%`);
          onThresholdExceeded?.(memory);
        }
      }
    };

    monitorMemory(); // Initial check
    const intervalId = setInterval(monitorMemory, interval);
    
    return () => {
      clearInterval(intervalId);
      setIsMonitoring(false);
    };
  }, [interval, threshold, onThresholdExceeded]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  useEffect(() => {
    const cleanup = startMonitoring();
    return cleanup;
  }, [startMonitoring]);

  return {
    memoryStats,
    isMonitoring,
    startMonitoring,
    stopMonitoring
  };
};

// Hook for Core Web Vitals monitoring
export const useCoreWebVitals = () => {
  const [vitals, setVitals] = useState({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const collectVitals = async () => {
      try {
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            const lcp = entries[entries.length - 1];
            setVitals(prev => ({ ...prev, lcp: lcp.startTime }));
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            const fid = entries[0].processingStart - entries[0].startTime;
            setVitals(prev => ({ ...prev, fid }));
          }
        }).observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          setVitals(prev => ({ ...prev, cls: clsValue }));
        }).observe({ entryTypes: ['layout-shift'] });

        // First Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            setVitals(prev => ({ ...prev, fcp: entries[0].startTime }));
          }
        }).observe({ entryTypes: ['paint'] });

        // Time to First Byte
        const navigationEntry = performance.getEntriesByType('navigation')[0];
        if (navigationEntry) {
          const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
          setVitals(prev => ({ ...prev, ttfb }));
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error collecting Core Web Vitals:', error);
        setIsLoading(false);
      }
    };

    collectVitals();
  }, []);

  const getVitalsGrade = useCallback(() => {
    const grades = {};
    
    // LCP grading (Good < 2.5s, Needs Improvement < 4s, Poor >= 4s)
    if (vitals.lcp !== null) {
      grades.lcp = vitals.lcp < 2500 ? 'good' : vitals.lcp < 4000 ? 'needs-improvement' : 'poor';
    }
    
    // FID grading (Good < 100ms, Needs Improvement < 300ms, Poor >= 300ms)
    if (vitals.fid !== null) {
      grades.fid = vitals.fid < 100 ? 'good' : vitals.fid < 300 ? 'needs-improvement' : 'poor';
    }
    
    // CLS grading (Good < 0.1, Needs Improvement < 0.25, Poor >= 0.25)
    if (vitals.cls !== null) {
      grades.cls = vitals.cls < 0.1 ? 'good' : vitals.cls < 0.25 ? 'needs-improvement' : 'poor';
    }
    
    // FCP grading (Good < 1.8s, Needs Improvement < 3s, Poor >= 3s)
    if (vitals.fcp !== null) {
      grades.fcp = vitals.fcp < 1800 ? 'good' : vitals.fcp < 3000 ? 'needs-improvement' : 'poor';
    }
    
    // TTFB grading (Good < 800ms, Needs Improvement < 1800ms, Poor >= 1800ms)
    if (vitals.ttfb !== null) {
      grades.ttfb = vitals.ttfb < 800 ? 'good' : vitals.ttfb < 1800 ? 'needs-improvement' : 'poor';
    }
    
    return grades;
  }, [vitals]);

  return {
    vitals,
    grades: getVitalsGrade(),
    isLoading
  };
};

// Hook for performance budget monitoring
export const usePerformanceBudget = (budget = {}) => {
  const defaultBudget = {
    maxBundleSize: 250 * 1024, // 250KB
    maxChunkSize: 100 * 1024, // 100KB
    maxImageSize: 100 * 1024, // 100KB
    maxRenderTime: 16, // 16ms (60fps)
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB
    ...budget
  };

  const [budgetStatus, setBudgetStatus] = useState({
    withinBudget: true,
    violations: [],
    metrics: {}
  });

  const checkBudget = useCallback(async () => {
    const violations = [];
    const metrics = {};

    try {
      // Check bundle sizes
      const resources = performance.getEntriesByType('resource');
      let totalBundleSize = 0;
      
      resources.forEach(resource => {
        const size = resource.transferSize || 0;
        totalBundleSize += size;
        
        if (resource.name.includes('.js') && size > defaultBudget.maxChunkSize) {
          violations.push({
            type: 'chunk-size',
            resource: resource.name,
            actual: size,
            budget: defaultBudget.maxChunkSize
          });
        }
        
        if (resource.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) && size > defaultBudget.maxImageSize) {
          violations.push({
            type: 'image-size',
            resource: resource.name,
            actual: size,
            budget: defaultBudget.maxImageSize
          });
        }
      });

      metrics.totalBundleSize = totalBundleSize;
      
      if (totalBundleSize > defaultBudget.maxBundleSize) {
        violations.push({
          type: 'bundle-size',
          actual: totalBundleSize,
          budget: defaultBudget.maxBundleSize
        });
      }

      // Check memory usage
      const memory = memoryUtils.getMemoryUsage();
      if (memory && memory.used > defaultBudget.maxMemoryUsage) {
        violations.push({
          type: 'memory-usage',
          actual: memory.used,
          budget: defaultBudget.maxMemoryUsage
        });
      }
      metrics.memoryUsage = memory?.used || 0;

      setBudgetStatus({
        withinBudget: violations.length === 0,
        violations,
        metrics
      });

    } catch (error) {
      console.error('Error checking performance budget:', error);
    }
  }, [defaultBudget]);

  useEffect(() => {
    // Check budget after page load
    const timer = setTimeout(checkBudget, 2000);
    return () => clearTimeout(timer);
  }, [checkBudget]);

  return {
    budgetStatus,
    checkBudget,
    budget: defaultBudget
  };
};

// Hook for lazy loading optimization
export const useLazyLoading = (options = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true
  } = options;

  const [isInView, setIsInView] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || (triggerOnce && hasLoaded)) return;

    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setIsInView(true);
              if (triggerOnce) {
                setHasLoaded(true);
                observerRef.current?.unobserve(element);
              }
            } else if (!triggerOnce) {
              setIsInView(false);
            }
          });
        },
        { threshold, rootMargin }
      );

      observerRef.current.observe(element);
    } else {
      // Fallback for browsers without IntersectionObserver
      setIsInView(true);
      setHasLoaded(true);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, hasLoaded]);

  return {
    elementRef,
    isInView,
    hasLoaded
  };
};

// Hook for performance analytics
export const usePerformanceAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    pageLoadTime: 0,
    resourceCount: 0,
    totalResourceSize: 0,
    criticalResourceTime: 0,
    renderBlockingResources: []
  });

  useEffect(() => {
    const collectAnalytics = () => {
      try {
        const navigation = performance.getEntriesByType('navigation')[0];
        const resources = performance.getEntriesByType('resource');
        
        const pageLoadTime = navigation?.loadEventEnd - navigation?.navigationStart || 0;
        const totalResourceSize = resources.reduce((total, resource) => 
          total + (resource.transferSize || 0), 0
        );
        
        const renderBlockingResources = resources.filter(resource => 
          resource.name.includes('.css') || 
          (resource.name.includes('.js') && !resource.name.includes('async'))
        );
        
        const criticalResourceTime = renderBlockingResources.reduce((max, resource) => 
          Math.max(max, resource.duration || 0), 0
        );

        setAnalytics({
          pageLoadTime,
          resourceCount: resources.length,
          totalResourceSize,
          criticalResourceTime,
          renderBlockingResources: renderBlockingResources.map(r => ({
            name: r.name,
            duration: r.duration,
            size: r.transferSize
          }))
        });

        // Send to analytics service
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'performance_metrics', {
            page_load_time: pageLoadTime,
            resource_count: resources.length,
            total_resource_size: totalResourceSize,
            critical_resource_time: criticalResourceTime
          });
        }

      } catch (error) {
        console.error('Error collecting performance analytics:', error);
      }
    };

    // Collect analytics after page load
    if (document.readyState === 'complete') {
      collectAnalytics();
    } else {
      window.addEventListener('load', collectAnalytics);
      return () => window.removeEventListener('load', collectAnalytics);
    }
  }, []);

  return analytics;
};

// Hook for performance debugging
export const usePerformanceDebugger = () => {
  const [debugInfo, setDebugInfo] = useState({
    slowComponents: [],
    memoryLeaks: [],
    bundleIssues: [],
    recommendations: []
  });

  const analyzePerformance = useCallback(() => {
    const performanceMonitor = getPerformanceMonitor();
    if (!performanceMonitor) return;

    const metrics = performanceMonitor.getMetrics();
    const recommendations = [];
    const slowComponents = [];
    const bundleIssues = [];

    // Analyze navigation metrics
    if (metrics.navigation) {
      const navMetrics = metrics.navigation[0]?.data;
      if (navMetrics?.ttfb > 1000) {
        recommendations.push('Consider optimizing server response time (TTFB > 1s)');
      }
      if (navMetrics?.dom > 2000) {
        recommendations.push('Consider reducing DOM processing time');
      }
    }

    // Analyze resource metrics
    if (metrics.resource) {
      const largeResources = metrics.resource.filter(r => r.data.size > 100 * 1024);
      if (largeResources.length > 0) {
        bundleIssues.push({
          type: 'large-resources',
          resources: largeResources.map(r => ({ name: r.data.name, size: r.data.size }))
        });
        recommendations.push(`Consider optimizing ${largeResources.length} large resources`);
      }

      const uncachedResources = metrics.resource.filter(r => !r.data.cached);
      if (uncachedResources.length > 10) {
        recommendations.push('Consider implementing better caching strategy');
      }
    }

    // Analyze Core Web Vitals
    if (metrics.lcp?.[0]?.data.value > 2500) {
      recommendations.push('Largest Contentful Paint is slow - optimize critical resources');
    }
    if (metrics.fid?.[0]?.data.value > 100) {
      recommendations.push('First Input Delay is high - consider code splitting');
    }
    if (metrics.cls?.[0]?.data.value > 0.1) {
      recommendations.push('Cumulative Layout Shift is high - stabilize layout');
    }

    setDebugInfo({
      slowComponents,
      memoryLeaks: [],
      bundleIssues,
      recommendations
    });
  }, []);

  useEffect(() => {
    // Analyze performance after initial load
    const timer = setTimeout(analyzePerformance, 5000);
    return () => clearTimeout(timer);
  }, [analyzePerformance]);

  return {
    debugInfo,
    analyzePerformance
  };
};

export default {
  useRenderPerformance,
  useMemoryMonitor,
  useCoreWebVitals,
  usePerformanceBudget,
  useLazyLoading,
  usePerformanceAnalytics,
  usePerformanceDebugger
};
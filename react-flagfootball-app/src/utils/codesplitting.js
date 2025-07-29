import React, { Suspense, lazy } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { performanceUtils } from './performance';

/**
 * Enterprise-grade code splitting and lazy loading utilities
 * Provides intelligent code splitting, preloading, and error handling
 */

// Enhanced lazy loading with error handling and preloading
export const createLazyComponent = (
  importFunction,
  options = {}
) => {
  const {
    fallback = <LoadingSpinner size="large" message="Loading component..." />,
    errorFallback = null,
    preload = false,
    chunkName = null,
    retryCount = 3,
    retryDelay = 1000
  } = options;

  // Create lazy component with retry logic
  const LazyComponent = lazy(() => {
    let retries = 0;
    
    const loadWithRetry = async () => {
      try {
        performanceUtils.mark(`lazy-load-start-${chunkName || 'component'}`);
        const module = await importFunction();
        performanceUtils.mark(`lazy-load-end-${chunkName || 'component'}`);
        performanceUtils.measure(
          `lazy-load-${chunkName || 'component'}`,
          `lazy-load-start-${chunkName || 'component'}`,
          `lazy-load-end-${chunkName || 'component'}`
        );
        return module;
      } catch (error) {
        retries++;
        console.warn(`Lazy load attempt ${retries} failed:`, error);
        
        if (retries < retryCount) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay * retries));
          return loadWithRetry();
        }
        
        // All retries failed
        console.error(`Failed to load component after ${retryCount} attempts:`, error);
        throw new Error(`Component failed to load: ${error.message}`);
      }
    };

    return loadWithRetry();
  });

  // Preload function
  LazyComponent.preload = () => {
    return importFunction().catch(error => {
      console.warn('Preload failed:', error);
    });
  };

  // Enhanced wrapper component
  const LazyWrapper = React.memo((props) => {
    const [hasError, setHasError] = React.useState(false);
    const [retryKey, setRetryKey] = React.useState(0);

    const ErrorBoundary = ({ children }) => {
      React.useEffect(() => {
        const handleError = (error) => {
          console.error('Lazy component error:', error);
          setHasError(true);
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleError);

        return () => {
          window.removeEventListener('error', handleError);
          window.removeEventListener('unhandledrejection', handleError);
        };
      }, []);

      if (hasError) {
        return errorFallback || (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            background: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px'
          }}>
            <h3>Component Failed to Load</h3>
            <p>There was an error loading this component.</p>
            <button
              onClick={() => {
                setHasError(false);
                setRetryKey(prev => prev + 1);
              }}
              style={{
                padding: '8px 16px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        );
      }

      return children;
    };

    return (
      <ErrorBoundary>
        <Suspense fallback={fallback}>
          <LazyComponent key={retryKey} {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  });

  LazyWrapper.displayName = `LazyWrapper(${chunkName || 'Component'})`;
  LazyWrapper.preload = LazyComponent.preload;

  // Auto-preload if requested
  if (preload && typeof window !== 'undefined') {
    // Preload after initial render
    setTimeout(() => {
      LazyWrapper.preload();
    }, 100);
  }

  return LazyWrapper;
};

// Route-based code splitting
export const createLazyRoute = (importFunction, routeName) => {
  return createLazyComponent(importFunction, {
    fallback: (
      <div style={{ 
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <LoadingSpinner size="large" message={`Loading ${routeName}...`} />
      </div>
    ),
    chunkName: routeName.toLowerCase().replace(/\s+/g, '-'),
    preload: false,
    errorFallback: (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <h2>Failed to Load {routeName}</h2>
        <p>This page could not be loaded. Please try refreshing.</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh Page
        </button>
      </div>
    )
  });
};

// Intelligent preloading system
export class PreloadManager {
  constructor() {
    this.preloadQueue = new Set();
    this.preloadedChunks = new Set();
    this.priorityQueue = [];
    this.isPreloading = false;
  }

  // Add component to preload queue
  addToQueue(lazyComponent, priority = 0) {
    if (this.preloadedChunks.has(lazyComponent)) {
      return; // Already preloaded
    }

    this.priorityQueue.push({ component: lazyComponent, priority });
    this.priorityQueue.sort((a, b) => b.priority - a.priority);
    
    if (!this.isPreloading) {
      this.processQueue();
    }
  }

  // Process preload queue
  async processQueue() {
    if (this.priorityQueue.length === 0) {
      this.isPreloading = false;
      return;
    }

    this.isPreloading = true;
    const { component } = this.priorityQueue.shift();

    try {
      if (component.preload && !this.preloadedChunks.has(component)) {
        await component.preload();
        this.preloadedChunks.add(component);
        console.log('✅ Preloaded component successfully');
      }
    } catch (error) {
      console.warn('⚠️ Preload failed:', error);
    }

    // Continue processing queue with delay
    setTimeout(() => this.processQueue(), 100);
  }

  // Preload on route change
  preloadForRoute(routeName, components = []) {
    components.forEach((component, index) => {
      this.addToQueue(component, 10 - index); // Higher priority for earlier components
    });
  }

  // Preload on user interaction
  preloadOnHover(element, lazyComponent) {
    let timeoutId;

    const handleMouseEnter = () => {
      timeoutId = setTimeout(() => {
        this.addToQueue(lazyComponent, 5);
      }, 200); // Delay to avoid unnecessary preloads
    };

    const handleMouseLeave = () => {
      clearTimeout(timeoutId);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(timeoutId);
    };
  }

  // Preload based on viewport visibility
  preloadOnVisible(element, lazyComponent) {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.addToQueue(lazyComponent, 3);
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '100px' }
      );

      observer.observe(element);
      return () => observer.disconnect();
    }
  }

  // Clear preload queue
  clear() {
    this.preloadQueue.clear();
    this.priorityQueue = [];
    this.isPreloading = false;
  }
}

// Global preload manager instance
export const preloadManager = new PreloadManager();

// Bundle splitting utilities
export const bundleUtils = {
  // Split vendor libraries
  splitVendorBundle: () => {
    return {
      'react-vendor': ['react', 'react-dom', 'react-router-dom'],
      'ui-vendor': ['@heroicons/react', 'framer-motion'],
      'utils-vendor': ['lodash', 'date-fns', 'axios']
    };
  },

  // Dynamic import with chunk naming
  dynamicImport: (importPath, chunkName) => {
    return import(
      /* webpackChunkName: "[request]" */
      importPath
    );
  },

  // Feature-based splitting
  splitByFeature: () => {
    return {
      auth: () => import(/* webpackChunkName: "auth" */ '../features/auth'),
      dashboard: () => import(/* webpackChunkName: "dashboard" */ '../features/dashboard'),
      training: () => import(/* webpackChunkName: "training" */ '../features/training'),
      community: () => import(/* webpackChunkName: "community" */ '../features/community'),
      profile: () => import(/* webpackChunkName: "profile" */ '../features/profile'),
      tournaments: () => import(/* webpackChunkName: "tournaments" */ '../features/tournaments')
    };
  }
};

// Performance monitoring for code splitting
export const codeSplittingMetrics = {
  // Track chunk loading times
  trackChunkLoad: (chunkName, loadTime) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'chunk_loaded', {
        chunk_name: chunkName,
        load_time: loadTime,
        custom_parameter: 'code_splitting'
      });
    }
    
    console.log(`📦 Chunk "${chunkName}" loaded in ${loadTime}ms`);
  },

  // Monitor chunk loading errors
  trackChunkError: (chunkName, error) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'chunk_load_error', {
        chunk_name: chunkName,
        error_message: error.message,
        custom_parameter: 'code_splitting'
      });
    }
    
    console.error(`❌ Chunk "${chunkName}" failed to load:`, error);
  },

  // Get bundle analysis
  getBundleAnalysis: () => {
    const analysis = {
      totalChunks: 0,
      loadedChunks: 0,
      failedChunks: 0,
      chunkSizes: {},
      loadTimes: {}
    };

    // This would be populated by webpack bundle analyzer or similar tool
    return analysis;
  }
};

// Hook for using code splitting
export const useCodeSplitting = () => {
  const [loadingChunks, setLoadingChunks] = React.useState(new Set());
  const [failedChunks, setFailedChunks] = React.useState(new Set());

  const loadChunk = React.useCallback(async (chunkName, importFunction) => {
    setLoadingChunks(prev => new Set(prev).add(chunkName));
    
    const startTime = performance.now();
    
    try {
      const module = await importFunction();
      const loadTime = performance.now() - startTime;
      
      codeSplittingMetrics.trackChunkLoad(chunkName, loadTime);
      setLoadingChunks(prev => {
        const newSet = new Set(prev);
        newSet.delete(chunkName);
        return newSet;
      });
      
      return module;
    } catch (error) {
      codeSplittingMetrics.trackChunkError(chunkName, error);
      setFailedChunks(prev => new Set(prev).add(chunkName));
      setLoadingChunks(prev => {
        const newSet = new Set(prev);
        newSet.delete(chunkName);
        return newSet;
      });
      throw error;
    }
  }, []);

  const retryFailedChunk = React.useCallback((chunkName, importFunction) => {
    setFailedChunks(prev => {
      const newSet = new Set(prev);
      newSet.delete(chunkName);
      return newSet;
    });
    return loadChunk(chunkName, importFunction);
  }, [loadChunk]);

  return {
    loadingChunks: Array.from(loadingChunks),
    failedChunks: Array.from(failedChunks),
    loadChunk,
    retryFailedChunk,
    isLoading: loadingChunks.size > 0,
    hasFailures: failedChunks.size > 0
  };
};

export default {
  createLazyComponent,
  createLazyRoute,
  PreloadManager,
  preloadManager,
  bundleUtils,
  codeSplittingMetrics,
  useCodeSplitting
};
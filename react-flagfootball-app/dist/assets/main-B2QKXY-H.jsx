import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import CriticalLoader from './components/CriticalLoader';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Lazy load the main App component for code splitting
const App = React.lazy(() => import('./App'));

// Initialize services lazily to avoid blocking
const initializeServices = async () => {
  try {
    // Only initialize in production and if needed
    if (import.meta.env.PROD) {
      // Dynamic imports for non-critical services
      const [
        { default: logger },
        { hybridAnalyticsService }
      ] = await Promise.all([
        import('./services/logger.service').catch(() => ({ default: { info: () => {} } })),
        import('./services/hybrid-analytics.service.js').catch(() => ({ hybridAnalyticsService: { startPerformanceTracking: () => {}, trackEvent: () => {} } }))
      ]);

      // Non-blocking service initialization
      hybridAnalyticsService.startPerformanceTracking();

      // Log application startup (non-blocking)
      logger.info('Application starting', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      });

      // Track app initialization (non-blocking)
      hybridAnalyticsService.trackEvent({
        type: 'app_initialized',
        app_version: import.meta.env.VITE_APP_VERSION || '1.0.7',
        environment: import.meta.env.VITE_APP_ENVIRONMENT || 'production'
      });
    }
  } catch (error) {
    console.warn('Service initialization failed, continuing without services:', error);
  }
};

// Initialize services after a short delay to not block rendering
requestIdleCallback ? 
  requestIdleCallback(initializeServices) : 
  setTimeout(initializeServices, 100);

// Create root and render immediately
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<CriticalLoader />}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
); 
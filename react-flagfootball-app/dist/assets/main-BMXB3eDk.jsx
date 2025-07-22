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

// Check if required DOM elements exist
const checkDOMReady = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found. Make sure there is a <div id="root"></div> in your HTML.');
    return false;
  }
  return true;
};

// Initialize services after a short delay to not block rendering
const startServices = () => {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(initializeServices);
  } else {
    setTimeout(initializeServices, 100);
  }
};

// Main initialization function
const initializeApp = () => {
  try {
    // Check if DOM is ready
    if (!checkDOMReady()) {
      // Retry after a short delay
      setTimeout(initializeApp, 100);
      return;
    }

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

    // Start services after rendering
    startServices();

  } catch (error) {
    console.error('Failed to initialize app:', error);
    
    // Show error message to user
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
          text-align: center;
          font-family: system-ui, -apple-system, sans-serif;
        ">
          <h1 style="color: #ef4444; margin-bottom: 1rem;">Application Error</h1>
          <p style="color: #6b7280; margin-bottom: 1rem;">
            Failed to initialize the application. Please refresh the page or try again later.
          </p>
          <button 
            onclick="window.location.reload()"
            style="
              background: #3b82f6;
              color: white;
              border: none;
              padding: 0.5rem 1rem;
              border-radius: 0.375rem;
              cursor: pointer;
            "
          >
            Refresh Page
          </button>
        </div>
      `;
    }
  }
};

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
} 
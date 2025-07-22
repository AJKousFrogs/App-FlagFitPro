import React from 'react';
import ReactDOM from 'react-dom/client';
import CriticalLoader from './components/CriticalLoader';
import './index.css';

// Create root element immediately
const root = ReactDOM.createRoot(document.getElementById('root'));

// Show critical loader immediately
root.render(<CriticalLoader />);

// Defer heavy imports and services for after initial render
setTimeout(async () => {
  try {
    // Dynamic imports for better code splitting
    const [
      { default: App },
      { default: logger },
      { hybridAnalyticsService }
    ] = await Promise.all([
      import('./App'),
      import('./services/logger.service'),
      import('./services/hybrid-analytics.service.js')
    ]);

    // Initialize performance tracking after critical path
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
      app_version: import.meta.env.VITE_APP_VERSION || '1.0.6',
      environment: import.meta.env.VITE_APP_ENVIRONMENT || 'production'
    });

    // Render the actual app
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to load application:', error);
    root.render(
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f3f4f6',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div>
          <h1 style={{ color: '#dc2626', marginBottom: '1rem' }}>
            Application Error
          </h1>
          <p style={{ color: '#374151' }}>
            Failed to load the application. Please refresh the page to try again.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
}, 0); // Use setTimeout 0 to yield to browser rendering 
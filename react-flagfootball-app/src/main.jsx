import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize services
import logger from './services/logger.service';
import sentryService from './services/sentry.service';
import { hybridAnalyticsService } from './services/hybrid-analytics.service.js';

// Sentry is conditionally initialized in the service constructor
// No need to explicitly call init here

// Initialize hybrid analytics and performance tracking
hybridAnalyticsService.startPerformanceTracking();

// Log application startup
logger.info('Application starting', {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  viewport: {
    width: window.innerWidth,
    height: window.innerHeight
  }
});

// Track app initialization
hybridAnalyticsService.trackEvent({
  type: 'app_initialized',
  app_version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: import.meta.env.VITE_APP_ENVIRONMENT || 'development'
});

// Create root element
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the app
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 
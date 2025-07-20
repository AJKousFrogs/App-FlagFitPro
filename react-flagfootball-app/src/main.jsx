import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Initialize services
import { logger, sentryService } from './services/index.js';

// Sentry is conditionally initialized in the service constructor
// No need to explicitly call init here

// Log application startup
logger.info('Application starting', {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  viewport: {
    width: window.innerWidth,
    height: window.innerHeight
  }
});

// Create root element
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the app
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 
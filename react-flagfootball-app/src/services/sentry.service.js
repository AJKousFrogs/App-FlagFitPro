/**
 * Sentry Error Tracking Service
 * Provides advanced error tracking and performance monitoring
 */

import * as Sentry from '@sentry/react';
import env from '../config/environment.js';
import logger from './logger.service';

class SentryService {
  constructor() {
    this.isInitialized = false;
    // Only init if explicitly enabled
    if (import.meta.env.VITE_ENABLE_SENTRY === 'true') {
      this.init();
    } else {
      console.log('Sentry explicitly disabled via VITE_ENABLE_SENTRY');
    }
  }

  init() {
    const config = env.getConfig();
    
    if (!config.sentry.dsn) {
      logger.warn('Sentry DSN not provided, error tracking disabled');
      return;
    }

    try {
      Sentry.init({
        dsn: config.sentry.dsn,
        environment: config.sentry.environment,
        debug: env.isDevelopment,
        
        // Performance Monitoring
        integrations: [
          Sentry.browserTracingIntegration({
            // Set tracing origins to include your backend API
            tracePropagationTargets: [
              config.api.pocketbaseUrl,
              config.api.baseUrl,
              config.api.aiServiceUrl
            ],
          }),
        ],

        // Performance Monitoring sample rate
        tracesSampleRate: env.isProduction ? 0.1 : 1.0,

        // Error sampling
        sampleRate: env.isProduction ? 0.8 : 1.0,

        // Release tracking
        release: `${config.app.name}@${config.app.version}`,

        // Before send hook for filtering
        beforeSend: (event, hint) => {
          return this.beforeSendFilter(event, hint);
        },

        // Initial scope configuration
        initialScope: {
          tags: {
            component: 'react-app',
            version: config.app.version
          }
        }
      });

      this.isInitialized = true;
      logger.info('Sentry initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize Sentry', { error: error.message });
    }
  }

  beforeSendFilter(event, hint) {
    // Filter out development errors
    if (env.isDevelopment) {
      // Don't send chunk load errors in development
      if (event.exception?.values?.[0]?.value?.includes('Loading chunk')) {
        return null;
      }
    }

    // Filter out network errors from browser extensions
    if (event.exception?.values?.[0]?.value?.includes('Extension context invalidated')) {
      return null;
    }

    // Add custom context
    if (hint.originalException) {
      event.extra = {
        ...event.extra,
        originalException: hint.originalException
      };
    }

    return event;
  }

  // Capture exceptions
  captureException(error, context = {}) {
    if (!this.isInitialized) {
      logger.error('Sentry not initialized, logging error locally', { error, context });
      return;
    }

    Sentry.withScope((scope) => {
      // Add context
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });

      // Capture the exception
      Sentry.captureException(error);
    });
  }

  // Capture messages
  captureMessage(message, level = 'info', context = {}) {
    if (!this.isInitialized) {
      logger.info(`Sentry message: ${message}`, context);
      return;
    }

    Sentry.withScope((scope) => {
      // Add context
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });

      // Set level
      scope.setLevel(level);

      // Capture the message
      Sentry.captureMessage(message);
    });
  }

  // Set user context
  setUser(user) {
    if (!this.isInitialized) return;

    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username || user.name
    });
  }

  // Clear user context
  clearUser() {
    if (!this.isInitialized) return;
    Sentry.setUser(null);
  }

  // Add breadcrumb
  addBreadcrumb(message, category = 'custom', level = 'info', data = {}) {
    if (!this.isInitialized) return;

    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000
    });
  }

  // Set custom tags
  setTag(key, value) {
    if (!this.isInitialized) return;
    Sentry.setTag(key, value);
  }

  // Set custom context
  setContext(key, context) {
    if (!this.isInitialized) return;
    Sentry.setContext(key, context);
  }

  // Start transaction for performance monitoring
  startTransaction(name, operation = 'navigation') {
    if (!this.isInitialized) return null;
    
    // Simplified transaction handling for compatibility
    return {
      name,
      op: operation,
      finish: () => {},
      setStatus: () => {},
      startChild: () => ({ finish: () => {} })
    };
  }

  // Measure performance
  measure(name, fn) {
    if (!this.isInitialized) return fn();

    const transaction = this.startTransaction(name, 'function');
    
    try {
      const result = fn();
      
      // Handle async functions
      if (result && typeof result.then === 'function') {
        return result.finally(() => {
          transaction?.finish();
        });
      }
      
      transaction?.finish();
      return result;
    } catch (error) {
      transaction?.setStatus('internal_error');
      transaction?.finish();
      throw error;
    }
  }

  // Capture API call performance
  captureApiCall(url, method, status, duration) {
    if (!this.isInitialized) return;

    this.addBreadcrumb(
      `${method} ${url} - ${status}`,
      'http',
      status >= 400 ? 'error' : 'info',
      { url, method, status, duration }
    );

    // Simplified span handling for compatibility
    // Note: Advanced performance monitoring requires additional Sentry setup
  }

  // Capture user feedback
  showReportDialog(options = {}) {
    if (!this.isInitialized) return;
    
    Sentry.showReportDialog({
      title: 'Report a Problem',
      subtitle: 'Help us improve the application',
      subtitle2: 'Your feedback is valuable to us.',
      labelName: 'Name',
      labelEmail: 'Email',
      labelComments: 'What happened?',
      labelClose: 'Close',
      labelSubmit: 'Submit',
      ...options
    });
  }

  // Check if Sentry is available
  isAvailable() {
    return this.isInitialized;
  }
}

// Export singleton instance
export const sentryService = new SentryService();
export default sentryService;
/**
 * Sentry Error Tracking Service
 * Monitors and reports errors in production
 */

import { logger } from "../../logger.js";
import { config } from "../config/environment.js";

class SentryService {
  constructor() {
    this.initialized = false;
    this.Sentry = null;
  }

  /**
   * Initialize Sentry
   * Only initializes in production with valid DSN
   */
  async init() {
    // Only initialize in production
    if (config.ENV !== "production" && config.ENV !== "staging") {
      logger.debug("[Sentry] Skipping initialization in development");
      return;
    }

    // Check if DSN is configured
    const sentryDsn = this.getSentryDsn();
    if (!sentryDsn || sentryDsn === "your_sentry_dsn_here") {
      logger.warn("[Sentry] DSN not configured, error tracking disabled");
      return;
    }

    try {
      // Dynamically import Sentry to avoid loading in development
      // Use a more defensive import pattern that handles missing packages gracefully
      let SentryModule;
      try {
        SentryModule = await import("@sentry/browser");
      } catch (_importError) {
        logger.warn(
          "[Sentry] Package @sentry/browser not available, error tracking disabled",
        );
        return;
      }
      const Sentry = SentryModule.default || SentryModule;
      let BrowserTracing;
      try {
        const tracingModule = await import("@sentry/tracing");
        BrowserTracing = tracingModule.BrowserTracing;
      } catch (_importError) {
        logger.warn(
          "[Sentry] Package @sentry/tracing not available, continuing without tracing",
        );
        BrowserTracing = null;
      }

      this.Sentry = Sentry;

      // Initialize Sentry
      const initConfig = {
        dsn: sentryDsn,
        environment: config.ENV,

        // Sample rate for performance monitoring
        tracesSampleRate: config.PERFORMANCE_SAMPLE_RATE || 0.1,

        // Release tracking (use from build process)
        release: window._env?.APP_VERSION || "development",

        // Before sending event, filter sensitive data
        beforeSend(event, _hint) {
          // Remove sensitive data
          if (event.request) {
            delete event.request.cookies;

            // Scrub authorization headers
            if (event.request.headers) {
              delete event.request.headers.Authorization;
              delete event.request.headers.authorization;
            }
          }

          // Filter out localStorage data
          if (event.extra) {
            delete event.extra.localStorage;
            delete event.extra.sessionStorage;
          }

          return event;
        },

        // Ignore certain errors
        ignoreErrors: [
          // Browser extensions
          "top.GLOBALS",
          "chrome-extension",
          "moz-extension",

          // Network errors (handled separately)
          "NetworkError",
          "Failed to fetch",
          "Load failed",

          // Expected errors
          "ResizeObserver loop limit exceeded",
          "ResizeObserver loop completed",

          // Ad blockers
          "adsbygoogle",
        ],

        // Deny URLs (don't track errors from these)
        denyUrls: [
          /extensions\//i,
          /^chrome:\/\//i,
          /^chrome-extension:\/\//i,
          /^moz-extension:\/\//i,
        ],
      };

      // Add BrowserTracing integration only if available
      if (BrowserTracing) {
        initConfig.integrations = [
          new BrowserTracing({
            tracingOrigins: [
              "localhost",
              window.location.hostname,
              /^\//, // Same-origin requests
            ],
          }),
        ];
      }

      Sentry.init(initConfig);

      this.initialized = true;
      logger.success("[Sentry] Error tracking initialized");

      // Set user context if available
      this.updateUserContext();
    } catch (error) {
      logger.error("[Sentry] Failed to initialize:", error);
    }
  }

  /**
   * Get Sentry DSN from environment
   */
  getSentryDsn() {
    // Try multiple sources
    if (window._env?.VITE_SENTRY_DSN) {
      return window._env.VITE_SENTRY_DSN;
    }

    if (import.meta.env?.VITE_SENTRY_DSN) {
      return import.meta.env.VITE_SENTRY_DSN;
    }

    return null;
  }

  /**
   * Update user context for error reports
   */
  updateUserContext(user = null) {
    if (!this.initialized || !this.Sentry) {return;}

    try {
      if (user) {
        this.Sentry.setUser({
          id: user.id,
          email: user.email,
          username: user.name,
          role: user.role,
        });
        logger.debug("[Sentry] User context updated");
      } else {
        // Try to get user from auth
        const authManager = window.authManager;
        if (authManager && authManager.isAuthenticated()) {
          const currentUser = authManager.getCurrentUser();
          if (currentUser) {
            this.Sentry.setUser({
              id: currentUser.id,
              email: currentUser.email,
              username: currentUser.name,
              role: currentUser.role,
            });
          }
        }
      }
    } catch (error) {
      logger.error("[Sentry] Failed to update user context:", error);
    }
  }

  /**
   * Clear user context (on logout)
   */
  clearUserContext() {
    if (!this.initialized || !this.Sentry) {return;}

    try {
      this.Sentry.setUser(null);
      logger.debug("[Sentry] User context cleared");
    } catch (error) {
      logger.error("[Sentry] Failed to clear user context:", error);
    }
  }

  /**
   * Capture an exception
   */
  captureException(error, context = {}) {
    if (!this.initialized || !this.Sentry) {
      logger.error("[Sentry] Not initialized, error not reported:", error);
      return;
    }

    try {
      this.Sentry.captureException(error, {
        extra: context,
        tags: {
          component: context.component || "unknown",
          action: context.action || "unknown",
        },
      });
      logger.debug("[Sentry] Exception captured:", error.message);
    } catch (err) {
      logger.error("[Sentry] Failed to capture exception:", err);
    }
  }

  /**
   * Capture a message
   */
  captureMessage(message, level = "info", context = {}) {
    if (!this.initialized || !this.Sentry) {
      logger.warn("[Sentry] Not initialized, message not reported:", message);
      return;
    }

    try {
      this.Sentry.captureMessage(message, {
        level,
        extra: context,
      });
      logger.debug("[Sentry] Message captured:", message);
    } catch (error) {
      logger.error("[Sentry] Failed to capture message:", error);
    }
  }

  /**
   * Add breadcrumb (for debugging context)
   */
  addBreadcrumb(breadcrumb) {
    if (!this.initialized || !this.Sentry) {return;}

    try {
      this.Sentry.addBreadcrumb({
        timestamp: Date.now() / 1000,
        ...breadcrumb,
      });
    } catch (error) {
      logger.error("[Sentry] Failed to add breadcrumb:", error);
    }
  }

  /**
   * Set custom context
   */
  setContext(name, context) {
    if (!this.initialized || !this.Sentry) {return;}

    try {
      this.Sentry.setContext(name, context);
    } catch (error) {
      logger.error("[Sentry] Failed to set context:", error);
    }
  }

  /**
   * Set tag
   */
  setTag(key, value) {
    if (!this.initialized || !this.Sentry) {return;}

    try {
      this.Sentry.setTag(key, value);
    } catch (error) {
      logger.error("[Sentry] Failed to set tag:", error);
    }
  }

  /**
   * Start a transaction (for performance monitoring)
   */
  startTransaction(name, op = "navigation") {
    if (!this.initialized || !this.Sentry) {return null;}

    try {
      return this.Sentry.startTransaction({
        name,
        op,
      });
    } catch (error) {
      logger.error("[Sentry] Failed to start transaction:", error);
      return null;
    }
  }

  /**
   * Wrap a function with error tracking
   */
  wrap(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.captureException(error, context);
        throw error;
      }
    };
  }
}

// Create singleton instance
export const sentryService = new SentryService();

// Auto-initialize on import
if (typeof window !== "undefined") {
  // Initialize after page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      sentryService.init();
    });
  } else {
    sentryService.init();
  }
}

export default sentryService;

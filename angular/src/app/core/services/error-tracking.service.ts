/**
 * Error Tracking Service
 *
 * Centralized error tracking and monitoring for production.
 * Integrates with Sentry for error reporting and performance monitoring.
 *
 * Configuration:
 * - Set VITE_ENABLE_SENTRY=true in environment
 * - Set VITE_SENTRY_DSN in environment
 *
 * @version 1.0.0
 */

import { Injectable, ErrorHandler, inject } from "@angular/core";
import { Router, NavigationError } from "@angular/router";
import { environment } from "../../../environments/environment";
import { LoggerService } from "./logger.service";

/**
 * Error severity levels
 */
export type ErrorSeverity = "fatal" | "error" | "warning" | "info" | "debug";

/**
 * Error context for additional debugging information
 */
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  extra?: Record<string, unknown>;
}

/**
 * Breadcrumb for error trail
 */
export interface Breadcrumb {
  type: "navigation" | "http" | "user" | "info";
  category: string;
  message: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

/**
 * Error Tracking Service
 *
 * Provides centralized error tracking with:
 * - Sentry integration (when enabled)
 * - Local error logging
 * - Breadcrumb trail for debugging
 * - User context tracking
 */
@Injectable({
  providedIn: "root",
})
export class ErrorTrackingService {
  private logger = inject(LoggerService);
  private router = inject(Router);

  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 50;
  private userContext: { id?: string; email?: string; role?: string } = {};
  private isInitialized = false;

  // Sentry SDK (loaded dynamically if enabled)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private Sentry: any = null;

  constructor() {
    this.init();
  }

  /**
   * Initialize error tracking
   */
  private async init(): Promise<void> {
    if (this.isInitialized) return;

    // Check if Sentry is enabled via environment
    const sentryEnabled =
      environment.production ||
      (typeof window !== "undefined" &&
        (window as unknown as { _env?: { VITE_ENABLE_SENTRY?: string } })._env
          ?.VITE_ENABLE_SENTRY === "true");

    if (sentryEnabled) {
      try {
        // Dynamic import to avoid bundling Sentry in dev builds
        // Only attempt import if we're in a browser environment
        if (typeof window !== "undefined") {
          // Use a completely dynamic import that Vite won't statically analyze
          // This prevents build-time errors when Sentry is not installed
          const sentryPackage = "@sentry" + "/angular"; // Split to avoid static analysis
          try {
            const sentryModule = await import(
              /* @vite-ignore */ sentryPackage
            ).catch(() => null);
            if (sentryModule) {
              this.Sentry = sentryModule;
            }
          } catch {
            // Module not found - this is expected in dev/test environments
            this.logger.debug(
              "[ErrorTracking] Sentry package not installed, skipping",
            );
            return;
          }
        }

        if (!this.Sentry) {
          this.logger.debug("[ErrorTracking] Sentry not available");
          return;
        }

        const dsn =
          (window as unknown as { _env?: { VITE_SENTRY_DSN?: string } })._env
            ?.VITE_SENTRY_DSN || "";

        if (dsn) {
          this.Sentry.init({
            dsn,
            environment: environment.production ? "production" : "development",
            tracesSampleRate: 0.1, // 10% of transactions for performance
            replaysSessionSampleRate: 0.1, // 10% of sessions for replay
            replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

            // Filter out common non-actionable errors
            ignoreErrors: [
              "ResizeObserver loop",
              "Non-Error exception captured",
              "Network request failed",
              "Load failed",
              "ChunkLoadError",
            ],

            // Before sending error, add context
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            beforeSend: (event: any) => {
              // Add breadcrumbs
              event.breadcrumbs = [
                ...(event.breadcrumbs || []),
                ...this.breadcrumbs.map((b) => ({
                  type: b.type,
                  category: b.category,
                  message: b.message,
                  timestamp: b.timestamp.getTime() / 1000,
                  data: b.data,
                })),
              ];

              return event;
            },
          });

          this.logger.success("[ErrorTracking] Sentry initialized");
          this.isInitialized = true;
        } else {
          this.logger.warn(
            "[ErrorTracking] Sentry DSN not configured, skipping initialization",
          );
        }
      } catch (error) {
        // Gracefully handle any initialization errors
        this.logger.debug(
          "[ErrorTracking] Sentry initialization skipped:",
          error,
        );
      }
    } else {
      this.logger.debug(
        "[ErrorTracking] Sentry disabled, using local logging only",
      );
    }

    // Subscribe to router errors
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationError) {
        this.captureError(event.error, {
          component: "Router",
          action: "navigation",
          extra: { url: event.url },
        });
      }
    });
  }

  /**
   * Capture an error
   */
  captureError(
    error: Error | unknown,
    context?: ErrorContext,
    severity: ErrorSeverity = "error",
  ): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    // Log locally
    this.logger.error(`[${severity.toUpperCase()}]`, errorObj.message, context);

    // Add breadcrumb
    this.addBreadcrumb({
      type: "info",
      category: "error",
      message: errorObj.message,
      timestamp: new Date(),
      data: context as Record<string, unknown>,
    });

    // Send to Sentry if available
    if (this.Sentry && this.isInitialized) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.Sentry.withScope((scope: any) => {
        // Set severity
        scope.setLevel(this.mapSeverity(severity));

        // Set context
        if (context) {
          if (context.component) scope.setTag("component", context.component);
          if (context.action) scope.setTag("action", context.action);
          if (context.extra) scope.setExtras(context.extra);
        }

        // Set user context
        if (this.userContext.id) {
          scope.setUser(this.userContext);
        }

        this.Sentry!.captureException(errorObj);
      });
    }
  }

  /**
   * Capture a message (non-error)
   */
  captureMessage(
    message: string,
    context?: ErrorContext,
    severity: ErrorSeverity = "info",
  ): void {
    // Log locally
    this.logger.info(`[${severity.toUpperCase()}]`, message, context);

    // Send to Sentry if available
    if (this.Sentry && this.isInitialized) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.Sentry.withScope((scope: any) => {
        scope.setLevel(this.mapSeverity(severity));

        if (context) {
          if (context.component) scope.setTag("component", context.component);
          if (context.action) scope.setTag("action", context.action);
          if (context.extra) scope.setExtras(context.extra);
        }

        this.Sentry!.captureMessage(message);
      });
    }
  }

  /**
   * Add a breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb: Breadcrumb): void {
    this.breadcrumbs.push(breadcrumb);

    // Keep only last N breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }

    // Also add to Sentry
    if (this.Sentry && this.isInitialized) {
      this.Sentry.addBreadcrumb({
        type: breadcrumb.type,
        category: breadcrumb.category,
        message: breadcrumb.message,
        data: breadcrumb.data,
        level: "info",
      });
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: { id?: string; email?: string; role?: string }): void {
    this.userContext = user;

    if (this.Sentry && this.isInitialized) {
      this.Sentry.setUser(user.id ? user : null);
    }
  }

  /**
   * Clear user context (on logout)
   */
  clearUser(): void {
    this.userContext = {};

    if (this.Sentry && this.isInitialized) {
      this.Sentry.setUser(null);
    }
  }

  /**
   * Track HTTP request for debugging
   */
  trackHttpRequest(
    method: string,
    url: string,
    status: number,
    duration: number,
  ): void {
    this.addBreadcrumb({
      type: "http",
      category: "http",
      message: `${method} ${url}`,
      timestamp: new Date(),
      data: { status, duration },
    });
  }

  /**
   * Track user action for debugging
   */
  trackUserAction(action: string, data?: Record<string, unknown>): void {
    this.addBreadcrumb({
      type: "user",
      category: "user-action",
      message: action,
      timestamp: new Date(),
      data,
    });
  }

  /**
   * Track navigation for debugging
   */
  trackNavigation(from: string, to: string): void {
    this.addBreadcrumb({
      type: "navigation",
      category: "navigation",
      message: `${from} → ${to}`,
      timestamp: new Date(),
      data: { from, to },
    });
  }

  /**
   * Map severity to Sentry level
   */
  private mapSeverity(
    severity: ErrorSeverity,
  ): "fatal" | "error" | "warning" | "info" | "debug" {
    return severity;
  }

  /**
   * Get current breadcrumbs (for debugging)
   */
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  /**
   * Check if Sentry is enabled
   */
  isSentryEnabled(): boolean {
    return this.isInitialized && this.Sentry !== null;
  }
}

/**
 * Global Error Handler
 *
 * Replaces Angular's default error handler to capture all unhandled errors.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private errorTracking = inject(ErrorTrackingService);

  handleError(error: unknown): void {
    // Capture the error
    this.errorTracking.captureError(error, {
      component: "GlobalErrorHandler",
      action: "unhandled-error",
    });

    // Re-throw in development for debugging
    if (!environment.production) {
      console.error("Unhandled error:", error);
    }
  }
}

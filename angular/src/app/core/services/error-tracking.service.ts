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

import { inject, Injectable } from "@angular/core";
import { NavigationError, Router } from "@angular/router";
import { environment } from "../../../environments/environment";
import { LoggerService } from "./logger.service";
import { isExpectedApiClientError } from "../../shared/utils/error.utils";

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

interface SentryEvent {
  breadcrumbs?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

interface SentryScope {
  setLevel(level: ErrorSeverity): void;
  setTag(key: string, value: string): void;
  setExtras(extras: Record<string, unknown>): void;
  setUser(user: { id?: string; email?: string; role?: string } | null): void;
}

interface SentryInitOptions {
  dsn: string;
  environment: "production" | "development";
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  ignoreErrors: string[];
  beforeSend?: (event: SentryEvent) => SentryEvent | null;
}

interface SentryApi {
  init(options: SentryInitOptions): void;
  withScope(callback: (scope: SentryScope) => void): void;
  captureException(error: Error): void;
  captureMessage(message: string): void;
  addBreadcrumb(breadcrumb: {
    type: string;
    category: string;
    message: string;
    data?: Record<string, unknown>;
    level: "fatal" | "error" | "warning" | "info" | "debug";
  }): void;
  setUser(user: { id?: string; email?: string; role?: string } | null): void;
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
  private readonly dedupeWindowMs = 10_000;
  private readonly recentErrorSignatures = new Map<string, number>();

  private shouldIgnoreError(error: Error | unknown): boolean {
    return isExpectedApiClientError(error);
  }

  private toError(error: Error | unknown): Error {
    if (error instanceof Error) return error;
    if (typeof error === "string") return new Error(error);
    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== "{}") {
        return new Error(serialized);
      }
    } catch {
      // ignore JSON serialization errors
    }
    return new Error(String(error));
  }

  // Sentry SDK (loaded dynamically if enabled)
  private Sentry: SentryApi | null = null;

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
        if (typeof window === "undefined") {
          return;
        }

        const sentryGlobal = (window as unknown as { Sentry?: unknown }).Sentry;
        if (!this.isSentryApi(sentryGlobal)) {
          this.logger.debug(
            "[ErrorTracking] Sentry global not available, skipping",
          );
          return;
        }

        this.Sentry = sentryGlobal;

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
            beforeSend: (event: SentryEvent) => {
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

          this.logger.success("error_tracking_sentry_initialized");
          this.isInitialized = true;
        } else {
          this.logger.warn("error_tracking_sentry_dsn_missing");
        }
      } catch (error) {
        // Gracefully handle any initialization errors
        this.logger.debug(
          "[ErrorTracking] Sentry initialization skipped:",
          error,
        );
      }
    } else {
      this.logger.debug("error_tracking_sentry_disabled_local_only");
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
    if (this.shouldIgnoreError(error)) {
      return;
    }

    const errorObj = this.toError(error);
    const signature = `${severity}:${errorObj.message}:${context?.component ?? ""}:${context?.action ?? ""}`;
    const now = Date.now();
    const previous = this.recentErrorSignatures.get(signature) ?? 0;
    if (now - previous < this.dedupeWindowMs) {
      return;
    }
    this.recentErrorSignatures.set(signature, now);

    // Log locally
    this.logger.error("error_tracking_capture", errorObj, {
      severity,
      ...(context as Record<string, unknown>),
    });

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
      this.Sentry.withScope((scope: SentryScope) => {
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

        this.Sentry?.captureException(errorObj);
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
    this.logger.info("error_tracking_message", {
      severity,
      message,
      ...(context as Record<string, unknown> | undefined),
    });

    // Send to Sentry if available
    if (this.Sentry && this.isInitialized) {
      this.Sentry.withScope((scope: SentryScope) => {
        scope.setLevel(this.mapSeverity(severity));

        if (context) {
          if (context.component) scope.setTag("component", context.component);
          if (context.action) scope.setTag("action", context.action);
          if (context.extra) scope.setExtras(context.extra);
        }

        this.Sentry?.captureMessage(message);
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

  private isSentryApi(value: unknown): value is SentryApi {
    if (!value || typeof value !== "object") return false;
    const candidate = value as Record<string, unknown>;
    return (
      typeof candidate["init"] === "function" &&
      typeof candidate["withScope"] === "function" &&
      typeof candidate["captureException"] === "function" &&
      typeof candidate["captureMessage"] === "function" &&
      typeof candidate["addBreadcrumb"] === "function" &&
      typeof candidate["setUser"] === "function"
    );
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

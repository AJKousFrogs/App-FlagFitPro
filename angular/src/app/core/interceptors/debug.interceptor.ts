/**
 * Debug HTTP Interceptor
 *
 * Intercepts all HTTP requests and responses for debugging purposes.
 * Logs API calls, tracks failed requests, and monitors network activity.
 */

import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { Observable, tap, catchError, throwError } from "rxjs";
import { DebugService } from "../services/debug.service";
import { LoggerService } from "../services/logger.service";

export const debugInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const debugService = inject(DebugService);
  const logger = inject(LoggerService);

  const startTime = performance.now();

  // Log the outgoing request
  const requestContext = {
    url: req.url,
    method: req.method,
    headers: req.headers
      .keys()
      .map((key) => ({ key, value: req.headers.get(key) })),
    body: req.body,
    params: req.params
      .keys()
      .map((key) => ({ key, value: req.params.get(key) })),
  };
  logger.debug(`🌐 HTTP ${req.method} ${req.url} request`, requestContext);

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        const duration = performance.now() - startTime;

        // Log successful response
        logger.debug(`HTTP ${req.method} ${req.url} response`, {
          status: event.status,
          statusText: event.statusText,
          duration: `${duration.toFixed(2)}ms`,
          headers: event.headers
            .keys()
            .map((key) => ({ key, value: event.headers.get(key) })),
          body: event.body,
        });

        // Track in debug service
        debugService.logApiCall(req.url, req.method, event.status, duration);

        // Warn if slow request
        if (duration > 2000) {
          logger.warn(`⚠️ Slow API call detected: ${req.url}`, {
            duration: `${duration.toFixed(2)}ms`,
          });
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      const duration = performance.now() - startTime;

      // Log error response
      logger.error("Error Response", {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        error: error.error,
        duration: `${duration.toFixed(2)}ms`,
      });

      // Track in debug service
      debugService.logApiCall(
        req.url,
        req.method,
        error.status,
        duration,
        error,
      );

      // Log detailed error for debugging
      logger.error("HTTP request failed", {
        url: req.url,
        method: req.method,
        status: error.status,
        error: error.error,
        message: error.message,
      });

      // Show specific error guidance
      if (error.status === 0) {
        logger.error("❌ Network Error: Request failed to reach server");
        logger.info("Possible causes", {
          reasons: [
            "CORS issue",
            "Backend server not running",
            "Network connectivity problem",
            "Request cancelled/aborted",
          ],
        });
      } else if (error.status === 401) {
        logger.error("🔒 Authentication Error: Unauthorized");
        logger.info("Check auth", {
          checks: [
            "Auth token validity",
            "Session expiration",
            "Authorization headers",
          ],
        });
      } else if (error.status === 403) {
        logger.error("🚫 Authorization Error: Forbidden");
        logger.info("Check permissions", {
          checks: [
            "User permissions",
            "RLS policies (if using Supabase)",
            "Role-based access control",
          ],
        });
      } else if (error.status === 404) {
        logger.error("🔍 Not Found Error: Resource not found");
        logger.info("Check resource", {
          checks: [
            "API endpoint URL",
            "Resource ID validity",
            "Route configuration",
          ],
        });
      } else if (error.status >= 500) {
        logger.error("💥 Server Error: Internal server error");
        logger.info("Check infrastructure", {
          checks: [
            "Backend server logs",
            "Database connectivity",
            "Server-side error handling",
          ],
        });
      }

      return throwError(() => error);
    }),
  );
};

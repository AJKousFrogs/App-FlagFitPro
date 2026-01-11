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
  console.group(
    `%c🌐 HTTP ${req.method} ${req.url}`,
    "color: #2196f3; font-weight: bold;",
  );
  console.log("Request:", {
    url: req.url,
    method: req.method,
    headers: req.headers
      .keys()
      .map((key) => ({ key, value: req.headers.get(key) })),
    body: req.body,
    params: req.params
      .keys()
      .map((key) => ({ key, value: req.params.get(key) })),
  });

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        const duration = performance.now() - startTime;

        // Log successful response
        console.log("Response:", {
          status: event.status,
          statusText: event.statusText,
          headers: event.headers
            .keys()
            .map((key) => ({ key, value: event.headers.get(key) })),
          body: event.body,
          duration: `${duration.toFixed(2)}ms`,
        });
        console.groupEnd();

        // Track in debug service
        debugService.logApiCall(req.url, req.method, event.status, duration);

        // Warn if slow request
        if (duration > 2000) {
          console.warn(
            `%c⚠️ Slow API call detected: ${req.url}`,
            "color: #ff9800; font-weight: bold;",
            `${duration.toFixed(2)}ms`,
          );
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      const duration = performance.now() - startTime;

      // Log error response
      console.error("Error Response:", {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        error: error.error,
        duration: `${duration.toFixed(2)}ms`,
      });
      console.groupEnd();

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
        console.error(
          "%c❌ Network Error: Request failed to reach server",
          "color: #f44336; font-weight: bold;",
        );
        console.log("Possible causes:");
        console.log("  - CORS issue");
        console.log("  - Backend server not running");
        console.log("  - Network connectivity problem");
        console.log("  - Request cancelled/aborted");
      } else if (error.status === 401) {
        console.error(
          "%c🔒 Authentication Error: Unauthorized",
          "color: #f44336; font-weight: bold;",
        );
        console.log("Check:");
        console.log("  - Auth token validity");
        console.log("  - Session expiration");
        console.log("  - Authorization headers");
      } else if (error.status === 403) {
        console.error(
          "%c🚫 Authorization Error: Forbidden",
          "color: #f44336; font-weight: bold;",
        );
        console.log("Check:");
        console.log("  - User permissions");
        console.log("  - RLS policies (if using Supabase)");
        console.log("  - Role-based access control");
      } else if (error.status === 404) {
        console.error(
          "%c🔍 Not Found Error: Resource not found",
          "color: #f44336; font-weight: bold;",
        );
        console.log("Check:");
        console.log("  - API endpoint URL");
        console.log("  - Resource ID validity");
        console.log("  - Route configuration");
      } else if (error.status >= 500) {
        console.error(
          "%c💥 Server Error: Internal server error",
          "color: #f44336; font-weight: bold;",
        );
        console.log("Check:");
        console.log("  - Backend server logs");
        console.log("  - Database connectivity");
        console.log("  - Server-side error handling");
      }

      return throwError(() => error);
    }),
  );
};

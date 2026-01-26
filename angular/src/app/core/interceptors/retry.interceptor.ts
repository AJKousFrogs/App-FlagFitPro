/**
 * Retry Interceptor
 *
 * Automatically retries failed HTTP requests for transient network errors.
 * Uses exponential backoff to avoid overwhelming servers.
 *
 * Retries on:
 * - Network errors (status 0)
 * - Server errors (status 500, 502, 503, 504)
 * - Request timeout errors
 *
 * Does NOT retry on:
 * - Client errors (4xx)
 * - POST/PUT/PATCH/DELETE requests (to avoid duplicate operations)
 * - Requests with custom skip header
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { LoggerService } from "../services/logger.service";
import { API, TIMEOUTS } from "../constants/app.constants";

/**
 * Custom header to skip retry for specific requests
 */
export const SKIP_RETRY_HEADER = "X-Skip-Retry";

/**
 * HTTP status codes that should trigger a retry
 */
const RETRYABLE_STATUS_CODES = [
  0, // Network error (no response)
  408, // Request Timeout
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
  599, // Network Connect Timeout Error
];

/**
 * HTTP methods that are safe to retry (idempotent)
 * POST/PUT/PATCH/DELETE are excluded to avoid duplicate operations
 */
const RETRYABLE_METHODS = ["GET", "HEAD", "OPTIONS"];

/**
 * Check if an error is retryable
 */
function isRetryableError(error: HttpErrorResponse, method: string): boolean {
  // Check if method is retryable (only idempotent methods)
  if (!RETRYABLE_METHODS.includes(method.toUpperCase())) {
    return false;
  }

  // Check if status code is retryable
  if (RETRYABLE_STATUS_CODES.includes(error.status)) {
    return true;
  }

  // Check for network-related error messages
  if (error.status === 0) {
    const networkErrors = [
      "Failed to fetch",
      "NetworkError",
      "Network request failed",
      "ERR_INTERNET_DISCONNECTED",
      "ERR_NETWORK_CHANGED",
      "ERR_CONNECTION_REFUSED",
      "ERR_NAME_NOT_RESOLVED",
    ];
    const errorMessage = error.message || "";
    return networkErrors.some((msg) =>
      errorMessage.toLowerCase().includes(msg.toLowerCase()),
    );
  }

  return false;
}

/**
 * Calculate delay for exponential backoff
 * Formula: baseDelay * 2^attempt (with jitter)
 */
function calculateBackoffDelay(attempt: number, baseDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  // Add random jitter (0-20%) to prevent thundering herd
  const jitter = exponentialDelay * Math.random() * 0.2;
  return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
}

/**
 * Retry interceptor with exponential backoff
 */
export const retryInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const logger = inject(LoggerService);

  // Skip retry if explicitly requested
  if (req.headers.has(SKIP_RETRY_HEADER)) {
    const cleanedReq = req.clone({
      headers: req.headers.delete(SKIP_RETRY_HEADER),
    });
    return next(cleanedReq);
  }

  // Skip retry for non-GET methods (to avoid duplicate operations)
  if (!RETRYABLE_METHODS.includes(req.method.toUpperCase())) {
    return next(req);
  }

  const maxRetries = API.RETRY_ATTEMPTS;
  const baseDelay = TIMEOUTS.RETRY_DELAY;
  let retryCount = 0;

  return next(req).pipe(
    catchError((error: HttpErrorResponse): Observable<HttpEvent<unknown>> => {
      // Check if we should retry this error
      if (!isRetryableError(error, req.method)) {
        return throwError(() => error);
      }

      // Check if we have retries left
      if (retryCount >= maxRetries) {
        logger.warn(
          `[RetryInterceptor] Max retries (${maxRetries}) reached for ${req.method} ${req.url}`,
          { status: error.status, message: error.message },
        );
        return throwError(() => error);
      }

      // Calculate delay and retry
      const delay = calculateBackoffDelay(retryCount, baseDelay);
      retryCount++;

      logger.debug(
        `[RetryInterceptor] Retry ${retryCount}/${maxRetries} for ${req.method} ${req.url} in ${delay}ms`,
        { status: error.status, message: error.message },
      );

      // Return a new observable that waits then retries
      return new Observable<HttpEvent<unknown>>((subscriber) => {
        const timeoutId = setTimeout(() => {
          next(req).subscribe({
            next: (value) => subscriber.next(value),
            error: (retryError) => {
              // Recursively handle retry errors
              if (
                isRetryableError(retryError, req.method) &&
                retryCount < maxRetries
              ) {
                const nextDelay = calculateBackoffDelay(retryCount, baseDelay);
                retryCount++;
                logger.debug(
                  `[RetryInterceptor] Retry ${retryCount}/${maxRetries} for ${req.method} ${req.url} in ${nextDelay}ms`,
                );
                setTimeout(() => {
                  next(req).subscribe(subscriber);
                }, nextDelay);
              } else {
                if (retryCount >= maxRetries) {
                  logger.warn(
                    `[RetryInterceptor] Max retries (${maxRetries}) reached for ${req.method} ${req.url}`,
                  );
                }
                subscriber.error(retryError);
              }
            },
            complete: () => subscriber.complete(),
          });
        }, delay);

        // Cleanup on unsubscribe
        return () => clearTimeout(timeoutId);
      });
    }),
  );
};

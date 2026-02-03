/**
 * Reusable RxJS Operators
 *
 * Common RxJS pipe patterns extracted for reuse across the application.
 * Reduces duplication of map/catchError/finalize patterns.
 *
 * IMPORTANT: All operators that handle errors should:
 * 1. Reset error state before the operation starts
 * 2. Clear error state on success
 * 3. Set error state on failure
 *
 * @see BaseViewModel for consistent patterns
 */

import { Observable, throwError, timer } from "rxjs";
import {
  catchError,
  finalize,
  map,
  tap,
  retryWhen,
  delayWhen,
  take,
  scan,
} from "rxjs/operators";
import { getErrorMessage } from "./error.utils";

/**
 * Handle errors with logging and optional fallback value
 *
 * @example
 * source$.pipe(
 *   withErrorHandling('Operation failed', logger, fallbackValue)
 * )
 */
export function withErrorHandling<T>(
  errorMessage: string,
  logger?: { error: (msg: string, err: unknown) => void },
  fallbackValue?: T,
) {
  return catchError<T, Observable<T>>((error: unknown) => {
    if (logger) {
      logger.error(errorMessage, error);
    }
    if (fallbackValue !== undefined) {
      return new Observable<T>((subscriber) => {
        subscriber.next(fallbackValue);
        subscriber.complete();
      });
    }
    return throwError(() => error);
  });
}

/**
 * Handle loading state with signals
 *
 * @example
 * source$.pipe(
 *   withLoadingState(isLoading, setError)
 * )
 */
export function withLoadingState<T>(
  isLoading: { set: (value: boolean) => void },
  setError?: { set: (value: string | null) => void },
) {
  return (source: Observable<T>): Observable<T> => {
    return new Observable<T>((subscriber) => {
      isLoading.set(true);
      if (setError) {
        setError.set(null);
      }

      const subscription = source.subscribe({
        next: (value) => subscriber.next(value),
        error: (error) => {
          if (setError) {
            setError.set(
              error instanceof Error ? error.message : "An error occurred",
            );
          }
          subscriber.error(error);
        },
        complete: () => {
          isLoading.set(false);
          subscriber.complete();
        },
      });

      return () => {
        isLoading.set(false);
        subscription.unsubscribe();
      };
    });
  };
}

/**
 * Map response data with success check
 * Common pattern: response.success ? response.data : throw error
 *
 * @example
 * source$.pipe(
 *   mapResponseData<MyData>('Failed to load data')
 * )
 */
export function mapResponseData<T>(
  errorMessage: string = "Failed to load data",
) {
  return map<{ success: boolean; data?: T; error?: string }, T>((response) => {
    if (response.success && response.data !== undefined) {
      return response.data;
    }
    throw new Error(response.error || errorMessage);
  });
}

/**
 * Extract data from API response (handles both array and object responses)
 *
 * @example
 * source$.pipe(
 *   extractApiData<MyData[]>()
 * )
 */
export function extractApiData<T>() {
  return map<{ success: boolean; data?: T | T[]; error?: string }, T | T[]>(
    (response) => {
      if (!response.success) {
        throw new Error(response.error || "API request failed");
      }
      if (response.data === undefined) {
        throw new Error("No data in response");
      }
      return response.data;
    },
  );
}

/**
 * Log values for debugging (non-destructive)
 * NOTE: Only logs when a logger is provided. Use LoggerService.debug() in production.
 *
 * @example
 * source$.pipe(
 *   logValues('Debug:', logger)
 * )
 */
export function logValues<T>(
  prefix: string = "",
  logger?: { debug: (msg: string, data: T) => void },
) {
  return tap<T>((value) => {
    // Only log if a logger is provided - no console.log in production
    if (logger) {
      logger.debug(prefix, value);
    }
  });
}

/**
 * Complete pipe with error handling and loading state
 * Combines common patterns: map, catchError, finalize
 *
 * CRITICAL: This operator:
 * - Resets error state before operation starts
 * - Clears error state on success
 * - Sets error state on failure
 * - Always resets loading state when complete
 *
 * @example
 * source$.pipe(
 *   completePipe({
 *     mapFn: (data) => data.members,
 *     errorMessage: 'Failed to load',
 *     logger,
 *     isLoading,
 *     setError
 *   })
 * )
 */
export function completePipe<T, R>(options: {
  mapFn?: (value: T) => R;
  errorMessage?: string;
  logger?: { error: (msg: string, err: unknown) => void };
  isLoading?: { set: (value: boolean) => void };
  setError?: { set: (value: string | null) => void };
  fallbackValue?: R;
  clearErrorOnSuccess?: boolean;
}) {
  return (source: Observable<T>): Observable<R> => {
    return new Observable<R>((subscriber) => {
      const {
        mapFn,
        errorMessage,
        logger,
        isLoading,
        setError,
        fallbackValue,
        clearErrorOnSuccess = true,
      } = options;

      // CRITICAL: Reset error state before starting operation
      if (setError) {
        setError.set(null);
      }

      if (isLoading) {
        isLoading.set(true);
      }

      let hasSucceeded = false;

      const subscription = source
        .pipe(
          map((value) => (mapFn ? mapFn(value) : (value as unknown as R))),
          tap(() => {
            // Mark success and clear error
            hasSucceeded = true;
            if (clearErrorOnSuccess && setError) {
              setError.set(null);
            }
          }),
          catchError((error: unknown) => {
            hasSucceeded = false;
            if (logger && errorMessage) {
              logger.error(errorMessage, error);
            }
            if (setError) {
              setError.set(
                getErrorMessage(error, errorMessage || "An error occurred"),
              );
            }
            if (fallbackValue !== undefined) {
              subscriber.next(fallbackValue);
              subscriber.complete();
              return new Observable<R>();
            }
            subscriber.error(error);
            return throwError(() => error);
          }),
          finalize(() => {
            if (isLoading) {
              isLoading.set(false);
            }
            // Ensure error is cleared on success
            if (hasSucceeded && clearErrorOnSuccess && setError) {
              setError.set(null);
            }
          }),
        )
        .subscribe({
          next: (value) => subscriber.next(value),
          error: (error) => subscriber.error(error),
          complete: () => subscriber.complete(),
        });

      return () => {
        subscription.unsubscribe();
      };
    });
  };
}

/**
 * Retry operator with exponential backoff for Observable streams
 * Use this for service-level retry logic (HTTP interceptor handles most cases)
 *
 * @example
 * source$.pipe(
 *   withRetry({
 *     maxRetries: 3,
 *     delayMs: 1000,
 *     shouldRetry: (error) => error.status >= 500,
 *     onRetry: (error, attempt) => console.log(`Retry ${attempt}`)
 *   })
 * )
 */
export function withRetry<T>(
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: unknown) => boolean;
    onRetry?: (error: unknown, attempt: number) => void;
  } = {},
) {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
    onRetry,
  } = options;

  return (source: Observable<T>): Observable<T> => {
    return source.pipe(
      retryWhen((errors) =>
        errors.pipe(
          scan((retryCount, error) => {
            if (retryCount >= maxRetries || !shouldRetry(error)) {
              throw error;
            }
            return retryCount + 1;
          }, 0),
          delayWhen((retryCount) => {
            const delay = delayMs * Math.pow(backoffMultiplier, retryCount - 1);
            if (onRetry) {
              onRetry(errors, retryCount);
            }
            return timer(delay);
          }),
        ),
      ),
    );
  };
}

/**
 * Simple retry operator for service methods
 * Retries up to maxRetries times with fixed delay
 *
 * @example
 * this.http.get('/api/data').pipe(
 *   simpleRetry(3, 1000)
 * )
 */
export function simpleRetry<T>(maxRetries: number = 3, delayMs: number = 1000) {
  return (source: Observable<T>): Observable<T> => {
    return source.pipe(
      retryWhen((errors) =>
        errors.pipe(
          delayWhen(() => timer(delayMs)),
          take(maxRetries),
        ),
      ),
    );
  };
}

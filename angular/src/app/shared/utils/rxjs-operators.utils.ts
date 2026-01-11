/**
 * Reusable RxJS Operators
 * 
 * Common RxJS pipe patterns extracted for reuse across the application.
 * Reduces duplication of map/catchError/finalize patterns.
 */

import { Observable, throwError } from "rxjs";
import { catchError, finalize, map, tap } from "rxjs/operators";

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
  return map<
    { success: boolean; data?: T; error?: string },
    T
  >((response) => {
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
  return map<
    { success: boolean; data?: T | T[]; error?: string },
    T | T[]
  >((response) => {
    if (!response.success) {
      throw new Error(response.error || "API request failed");
    }
    if (response.data === undefined) {
      throw new Error("No data in response");
    }
    return response.data;
  });
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
}) {
  return (source: Observable<T>): Observable<R> => {
    return new Observable<R>((subscriber) => {
      const { mapFn, errorMessage, logger, isLoading, setError, fallbackValue } =
        options;

      if (isLoading) {
        isLoading.set(true);
      }
      if (setError) {
        setError.set(null);
      }

      const subscription = source
        .pipe(
          map((value) => (mapFn ? mapFn(value) : (value as unknown as R))),
          catchError((error: unknown) => {
            if (logger && errorMessage) {
              logger.error(errorMessage, error);
            }
            if (setError) {
              setError.set(
                error instanceof Error ? error.message : "An error occurred",
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

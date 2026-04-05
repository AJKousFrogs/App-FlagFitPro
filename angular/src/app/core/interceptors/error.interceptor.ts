import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { from, throwError } from "rxjs";
import { catchError, switchMap } from "rxjs";
import { LoggerService } from "../services/logger.service";
import { SupabaseService } from "../services/supabase.service";

/**
 * Marks a retried request after `refreshSession`. The error interceptor runs last,
 * so retries must set `Authorization` here — upstream interceptors do not run again.
 */
const HTTP_AUTH_RETRY_HEADER = "X-Auth-Retry";

/** URLs where 401 is unlikely to mean a stale Supabase access token. */
const SKIP_401_SESSION_RECOVERY: string[] = [
  "googleapis.com",
  "supabase.co/auth",
  "/assets/",
];

function shouldAttempt401SessionRecovery(req: {
  url: string | null;
}): boolean {
  const url = req.url || "";
  return !SKIP_401_SESSION_RECOVERY.some((fragment) =>
    url.includes(fragment),
  );
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const logger = inject(LoggerService);
  const supabaseService = inject(SupabaseService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      logger.debug("http_error_intercepted", {
        url: error.url || "unknown",
        message: error.message,
        status: error.status,
        statusText: error.statusText,
      });

      if (error.status === 401) {
        const isAuthenticated =
          supabaseService.isAuthenticated() || !!supabaseService.session();

        if (!isAuthenticated) {
          logger.debug("http_401_unauthenticated");
          return throwError(() => error);
        }

        if (!shouldAttempt401SessionRecovery(req)) {
          logger.debug("http_401_session_recovery_skipped", { url: req.url });
          return throwError(() => error);
        }

        return from(supabaseService.refreshSessionForHttpRetry()).pipe(
          switchMap((refreshed) => {
            if (!refreshed) {
              logger.warn("http_401_session_refresh_failed_signing_out");
              return from(signOutExpiredSession(router, supabaseService, logger)).pipe(
                switchMap(() => throwError(() => error)),
              );
            }

            // This interceptor is last: replay must attach a fresh Bearer token.
            return from(supabaseService.getToken()).pipe(
              switchMap((token) => {
                const retryReq = req.clone({
                  setHeaders: {
                    [HTTP_AUTH_RETRY_HEADER]: "1",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                });
                return next(retryReq).pipe(
                  catchError((retryError: HttpErrorResponse) => {
                    if (
                      retryError.status === 401 &&
                      retryReq.headers.get(HTTP_AUTH_RETRY_HEADER) === "1"
                    ) {
                      logger.warn("http_401_after_refresh", {
                        url: retryError.url || retryReq.url,
                      });
                    }
                    return throwError(() => retryError);
                  }),
                );
              }),
            );
          }),
          catchError((refreshErr: unknown) => {
            logger.warn("http_session_recovery_error", {
              error: refreshErr,
            });
            return from(
              signOutExpiredSession(router, supabaseService, logger),
            ).pipe(switchMap(() => throwError(() => error)));
          }),
        );
      }

      if (error.status === 406) {
        logger.warn("http_406_not_acceptable", {
          url: error.url,
        });
      } else if (error.status === 0) {
        logger.error("http_network_error", undefined, {
          url: error.url,
        });
      }

      return throwError(() => error);
    }),
  );
};

async function signOutExpiredSession(
  router: Router,
  supabaseService: SupabaseService,
  logger: LoggerService,
): Promise<void> {
  const currentUrl = router.url;
  if (currentUrl.includes("/login") || currentUrl.includes("/auth")) {
    return;
  }

  try {
    await supabaseService.signOut();
  } catch (signOutError) {
    logger.warn("http_sign_out_after_401_failed", {
      error: signOutError,
    });
  }

  void router.navigate(["/login"], {
    queryParams: { message: "session_expired" },
  });
}

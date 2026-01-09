import { HttpInterceptorFn, HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { AuthService } from "../services/auth.service";
import { LoggerService } from "../services/logger.service";

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const logger = inject(LoggerService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Log the error for debugging
      logger.debug(`[ErrorInterceptor] HTTP Error ${error.status}:`, { url: error.url || 'unknown' });

      if (error.status === 401) {
        // Unauthorized - clear auth and redirect to login
        // Only redirect if not already on login/auth pages
        const currentUrl = router.url;
        if (!currentUrl.includes("/login") && !currentUrl.includes("/auth")) {
          logger.warn(
            "[ErrorInterceptor] 401 Unauthorized - redirecting to login",
          );
          authService.logout().subscribe();
          router.navigate(["/login"]);
        }
      }
      // Note: 403 errors should NOT trigger automatic navigation.
      // They indicate permission issues with specific resources (e.g., RLS policies)
      // and should be handled by the component making the request.
      // Automatic redirects on 403 cause unexpected navigation during normal operations.

      return throwError(() => error);
    }),
  );
};

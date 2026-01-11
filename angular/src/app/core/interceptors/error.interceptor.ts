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
      logger.debug(`[ErrorInterceptor] HTTP Error ${error.status}:`, { 
        url: error.url || 'unknown',
        message: error.message,
        status: error.status,
        statusText: error.statusText,
      });

      if (error.status === 401) {
        // Unauthorized - check if user is logged out
        const isAuthenticated = authService.isAuthenticated();
        
        if (isAuthenticated) {
          // User thinks they're authenticated but server rejected - session expired
          logger.warn(
            "[ErrorInterceptor] 401 Unauthorized - session expired, logging out",
          );
          
          // Only redirect if not already on login/auth pages
          const currentUrl = router.url;
          if (!currentUrl.includes("/login") && !currentUrl.includes("/auth")) {
            authService.logout().subscribe();
            router.navigate(["/login"], {
              queryParams: { message: 'session_expired' }
            });
          }
        } else {
          // User is not authenticated - expected 401
          logger.debug("[ErrorInterceptor] 401 Unauthorized - user not authenticated");
        }
      } else if (error.status === 406) {
        // Not Acceptable - usually a content negotiation issue
        logger.warn("[ErrorInterceptor] 406 Not Acceptable - check Accept headers", {
          url: error.url,
          headers: req.headers,
        });
      } else if (error.status === 0) {
        // Network error or CORS issue
        logger.error("[ErrorInterceptor] Network error - check CORS configuration or network connectivity", {
          url: error.url,
        });
      }
      
      // Note: 403 errors should NOT trigger automatic navigation.
      // They indicate permission issues with specific resources (e.g., RLS policies)
      // and should be handled by the component making the request.
      // Automatic redirects on 403 cause unexpected navigation during normal operations.

      return throwError(() => error);
    }),
  );
};

import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { from, switchMap } from "rxjs";
import { LoggerService } from "../services/logger.service";
import { SupabaseService } from "../services/supabase.service";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);
  const supabaseService = inject(SupabaseService);

  // For Supabase REST API requests, use apikey header and fetch fresh token
  // Must check this FIRST before skipAuthUrls (which includes supabase.co for auth endpoints)
  if (req.url.includes("supabase.co/rest/")) {
    // Use async getToken() to ensure we have a valid (non-expired) token
    return from(
      supabaseService.waitForInit().then(() => supabaseService.getToken()),
    ).pipe(
      switchMap((token) => {
        const headers: Record<string, string> = {
          apikey: supabaseService.supabaseKey,
          "Content-Type": "application/json",
          Accept: "application/json",
          Prefer: "return=representation",
        };

        // Add auth token if available (getToken already handles refresh)
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const clonedReq = req.clone({ setHeaders: headers });
        return next(clonedReq);
      }),
    );
  }

  // Skip auth header for external APIs and public endpoints
  // Note: supabase.co/auth endpoints should skip (handled by Supabase SDK)
  // but supabase.co/rest endpoints need auth (handled above)
  const skipAuthUrls = ["supabase.co/auth", "googleapis.com", "/assets/"];

  const shouldSkipAuth = skipAuthUrls.some((url) => req.url.includes(url));

  if (shouldSkipAuth) {
    return next(req);
  }

  // For API endpoints, wait for auth initialization and add Authorization header
  return from(
    supabaseService.waitForInit().then(() => supabaseService.getToken()),
  ).pipe(
    switchMap((token) => {
      if (token) {
        const clonedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        return next(clonedReq);
      }

      // No token available - check if user should be authenticated
      // If we have a session but no token, there's an auth issue
      const hasSession = !!supabaseService.session();
      if (hasSession) {
        // Session exists but token retrieval failed - this is an error condition
        // Log warning but proceed - backend will return 401 which error interceptor handles
        logger.warn(
          "[AuthInterceptor] Session exists but token unavailable - request may fail",
        );
      }

      // Proceed without auth header - backend will return 401 if auth required
      // Error interceptor will handle redirect to login
      return next(req);
    }),
  );
};

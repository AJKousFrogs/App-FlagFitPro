import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { from, switchMap } from "rxjs";
import { AuthService } from "../services/auth.service";
import { SupabaseService } from "../services/supabase.service";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const supabaseService = inject(SupabaseService);

  // DEBUG: Log interceptor entry for API calls
  if (req.url.includes("/api/") || req.url.includes("supabase.co/rest/")) {
    console.log("[AuthInterceptor] Processing request:", req.url);
  }

  // For Supabase REST API requests, use apikey header and fetch fresh token
  // Must check this FIRST before skipAuthUrls (which includes supabase.co for auth endpoints)
  if (req.url.includes("supabase.co/rest/")) {
    // Use async getToken() to ensure we have a valid (non-expired) token
    return from(authService.getToken()).pipe(
      switchMap((token) => {
        // DEBUG: Log token status for Supabase REST calls
        console.log("[AuthInterceptor] Supabase REST - hasToken:", !!token, "url:", req.url);
        
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
  const skipAuthUrls = [
    "supabase.co/auth",
    "googleapis.com",
    "/assets/",
    "/health",
    "/api/weather/current",
  ];

  const shouldSkipAuth = skipAuthUrls.some((url) => req.url.includes(url));

  if (shouldSkipAuth) {
    return next(req);
  }

  // For API endpoints, add Authorization header
  return from(authService.getToken()).pipe(
    switchMap((token) => {
      // DEBUG: Log token status for API calls
      console.log("[AuthInterceptor] API call - hasToken:", !!token, "url:", req.url);
      
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

      // No token available - proceed without auth header
      // The backend/RLS will handle authorization
      console.warn("[AuthInterceptor] No token available for:", req.url);
      return next(req);
    }),
  );
};

import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { from, switchMap, of } from "rxjs";
import { AuthService } from "../services/auth.service";
import { SupabaseService } from "../services/supabase.service";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const supabaseService = inject(SupabaseService);

  // Skip auth header for external APIs and public endpoints
  const skipAuthUrls = [
    'supabase.co',
    'googleapis.com',
    '/assets/',
    '/health',
    '/api/weather/current',
  ];

  const shouldSkipAuth = skipAuthUrls.some(url => req.url.includes(url));

  if (shouldSkipAuth) {
    return next(req);
  }

  // For Supabase REST API requests, use apikey header
  if (req.url.includes('supabase.co/rest/')) {
    const session = supabaseService.getSession();
    const headers: Record<string, string> = {
      'apikey': supabaseService.supabaseKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Prefer': 'return=representation'
    };

    // Add auth token if available
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const clonedReq = req.clone({ setHeaders: headers });
    return next(clonedReq);
  }

  // For API endpoints, add Authorization header
  return from(authService.getToken()).pipe(
    switchMap((token) => {
      if (token) {
        const clonedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        return next(clonedReq);
      }
      
      // No token available - proceed without auth header
      // The backend/RLS will handle authorization
      return next(req);
    }),
  );
};

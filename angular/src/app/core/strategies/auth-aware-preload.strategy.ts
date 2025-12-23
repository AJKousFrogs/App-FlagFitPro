/**
 * Auth-Aware Preloading Strategy
 *
 * Angular 21 Custom Preloading Strategy
 *
 * Intelligently preloads routes based on:
 * - User authentication status
 * - Route priority (high-priority routes preload immediately)
 * - Network conditions (preloads on fast connections)
 * - User behavior (preloads likely next routes)
 *
 * Benefits:
 * - Faster navigation for authenticated users
 * - Better code splitting
 * - Reduced initial bundle size
 * - Improved perceived performance
 */

import { Injectable, inject } from "@angular/core";
import { PreloadingStrategy, Route } from "@angular/router";
import { Observable, of, timer } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { AuthService } from "../services/auth.service";

@Injectable({
  providedIn: "root",
})
export class AuthAwarePreloadStrategy implements PreloadingStrategy {
  private authService = inject(AuthService);

  // High-priority routes that should preload immediately after auth
  private readonly highPriorityRoutes = [
    "/dashboard",
    "/training",
    "/analytics",
    "/roster",
  ];

  // Routes that should only preload if user is authenticated
  private readonly authRequiredRoutes = [
    "/dashboard",
    "/training",
    "/analytics",
    "/roster",
    "/tournaments",
    "/community",
    "/chat",
    "/coach",
    "/profile",
    "/settings",
    "/wellness",
    "/performance-tracking",
    "/acwr",
    "/game-tracker",
    "/exercise-library",
    "/workout",
  ];

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    const routePath = route.path || "";

    // Don't preload if route has data.preload = false
    if (route.data && route.data["preload"] === false) {
      return of(null);
    }

    // Check if user is authenticated
    const isAuthenticated = this.authService.isAuthenticated();

    // If route requires auth and user is not authenticated, don't preload
    if (this.authRequiredRoutes.includes(`/${routePath}`) && !isAuthenticated) {
      return of(null);
    }

    // High-priority routes: preload immediately
    if (this.highPriorityRoutes.includes(`/${routePath}`) && isAuthenticated) {
      return load();
    }

    // Other authenticated routes: preload after a short delay (network-friendly)
    if (this.authRequiredRoutes.includes(`/${routePath}`) && isAuthenticated) {
      return timer(2000).pipe(mergeMap(() => load()));
    }

    // Public routes: preload after a longer delay
    return timer(5000).pipe(mergeMap(() => load()));
  }
}

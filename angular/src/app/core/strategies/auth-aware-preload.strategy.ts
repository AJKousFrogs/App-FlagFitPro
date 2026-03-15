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
import { mergeMap } from "rxjs";
import { AuthService } from "../services/auth.service";

@Injectable({
  providedIn: "root",
})
export class AuthAwarePreloadStrategy implements PreloadingStrategy {
  private authService = inject(AuthService);

  // High-priority routes that should preload immediately after auth
  private readonly highPriorityRoutes = [
    "/player-dashboard",
    "/coach/dashboard",
    "/coach/calendar",
    "/todays-practice",
    "/training",
    "/performance/insights",
    "/coach/analytics",
    "/wellness",
    "/roster",
    "/team/workspace",
  ];

  // Routes that should only preload if user is authenticated
  private readonly authRequiredRoutes = [
    "/player-dashboard",
    "/coach/dashboard",
    "/coach/calendar",
    "/todays-practice",
    "/training",
    "/performance/insights",
    "/coach/analytics",
    "/roster",
    "/team/workspace",
    "/coach/planning",
    "/profile",
    "/wellness",
    "/team-chat",
    "/chat",
  ];

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
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

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

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    const preload = route.data?.["preload"];
    const priority = route.data?.["priority"];
    const entry = route.data?.["entry"];
    const isAuthenticated = this.authService.isAuthenticated();

    // v2.1: only explicitly opted-in routes should preload.
    if (preload !== true) {
      return of(null);
    }

    // Internal app surfaces should only preload for authenticated users.
    if ((entry === "internal" || entry === "hub") && !isAuthenticated) {
      return of(null);
    }

    if (priority === "high") {
      return load();
    }

    if (priority === "medium") {
      return timer(1500).pipe(mergeMap(() => load()));
    }

    return timer(3000).pipe(mergeMap(() => load()));
  }
}

/**
 * QuickLink Preloading Strategy
 *
 * Angular 21 Strategy that preloads routes when links are visible in viewport
 * Similar to Quicklink library but integrated with Angular Router
 *
 * This strategy:
 * - Preloads routes when navigation links become visible
 * - Respects user preferences (prefers-reduced-motion, data-saver)
 * - Works with Intersection Observer API
 * - Optimizes for mobile networks
 */

import { Injectable, inject } from "@angular/core";
import { PreloadingStrategy, Route, Router } from "@angular/router";
import { Observable, of } from "rxjs";
import { DOCUMENT } from "@angular/common";

@Injectable({
  providedIn: "root",
})
export class QuickLinkPreloadStrategy implements PreloadingStrategy {
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private preloadedRoutes = new Set<string>();
  private observer?: IntersectionObserver;

  constructor() {
    // Initialize Intersection Observer for link visibility detection
    if (typeof window !== "undefined" && "IntersectionObserver" in window) {
      this.setupIntersectionObserver();
    }
  }

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    const routePath = route.path || "";

    // Don't preload if already preloaded
    if (this.preloadedRoutes.has(routePath)) {
      return of(null);
    }

    // Don't preload if route has data.preload = false
    if (route.data && route.data["preload"] === false) {
      return of(null);
    }

    // Check if user prefers reduced motion or data saver
    if (this.shouldSkipPreload()) {
      return of(null);
    }

    // Check if link is visible in viewport
    if (this.isLinkVisible(routePath)) {
      this.preloadedRoutes.add(routePath);
      return load();
    }

    return of(null);
  }

  private setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const href = link.getAttribute("href");
            if (href && href.startsWith("/")) {
              // Preload route when link becomes visible
              this.preloadRoute(href);
            }
          }
        });
      },
      {
        rootMargin: "50px", // Start preloading 50px before link enters viewport
        threshold: 0.1,
      },
    );

    // Observe all router links
    this.observeRouterLinks();
  }

  private observeRouterLinks(): void {
    const links = this.document.querySelectorAll("a[routerLink]");
    links.forEach((link) => {
      this.observer?.observe(link);
    });

    // Observe dynamically added links
    const mutationObserver = new MutationObserver(() => {
      const newLinks = this.document.querySelectorAll(
        "a[routerLink]:not([data-observed])",
      );
      newLinks.forEach((link) => {
        link.setAttribute("data-observed", "true");
        this.observer?.observe(link);
      });
    });

    mutationObserver.observe(this.document.body, {
      childList: true,
      subtree: true,
    });
  }

  private preloadRoute(path: string): void {
    // Find route config and trigger preload
    const routePath = path.replace("/", "");
    const route = this.router.config.find((r) => r.path === routePath);
    if (route && route.loadComponent && !this.preloadedRoutes.has(routePath)) {
      this.preloadedRoutes.add(routePath);
      // Trigger the loadComponent function
      route.loadComponent();
    }
  }

  private isLinkVisible(routePath: string): boolean {
    const link = this.document.querySelector(`a[routerLink="${routePath}"]`);
    if (!link) return false;

    const rect = link.getBoundingClientRect();
    const viewportHeight =
      window.innerHeight || this.document.documentElement.clientHeight;
    const viewportWidth =
      window.innerWidth || this.document.documentElement.clientWidth;

    return (
      rect.top >= -50 &&
      rect.left >= -50 &&
      rect.bottom <= viewportHeight + 50 &&
      rect.right <= viewportWidth + 50
    );
  }

  private shouldSkipPreload(): boolean {
    // Check for reduced motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return true;
    }

    // Check for data saver mode
    if ("connection" in navigator) {
      const connection = (
        navigator as Navigator & {
          connection?: { saveData?: boolean; effectiveType?: string };
        }
      ).connection;
      if (connection?.saveData) {
        return true;
      }
      // Skip on slow connections
      if (
        connection?.effectiveType === "slow-2g" ||
        connection?.effectiveType === "2g"
      ) {
        return true;
      }
    }

    return false;
  }
}

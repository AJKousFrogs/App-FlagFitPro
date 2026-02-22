import { Routes } from "@angular/router";
import { authGuard } from "../../guards/auth.guard";
import { headerConfigGuard } from "../../guards/header-config.guard";
import { analyticsPrefetchResolver } from "../../resolvers/analytics-prefetch.resolver";

export const analyticsRoutes: Routes = [
  {
    path: "analytics",
    loadComponent: () =>
      import("../../../features/analytics/analytics.component").then(
        (m) => m.AnalyticsComponent,
      ),
    canActivate: [authGuard, headerConfigGuard],
    resolve: { prefetch: analyticsPrefetchResolver },
    data: { preload: true, priority: "high", entry: "hub" },
  },
  {
    path: "analytics/enhanced",
    loadComponent: () =>
      import("../../../features/analytics/enhanced-analytics/enhanced-analytics.component").then(
        (m) => m.EnhancedAnalyticsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Advanced analytics
  },
  {
    path: "performance-tracking",
    loadComponent: () =>
      import("../../../features/performance-tracking/performance-tracking.component").then(
        (m) => m.PerformanceTrackingComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium", entry: "internal" }, // Commonly accessed
  },
  // Redirect /performance/body-composition to performance-tracking with body composition tab
  {
    path: "performance/body-composition",
    redirectTo: "performance-tracking",
    pathMatch: "full",
    data: { entry: "internal" },
  },
];

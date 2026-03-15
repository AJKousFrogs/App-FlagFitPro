import { Routes } from "@angular/router";
import { authGuard } from "../../guards/auth.guard";
import { headerConfigGuard } from "../../guards/header-config.guard";
import { analyticsPrefetchResolver } from "../../resolvers/analytics-prefetch.resolver";

export const analyticsRoutes: Routes = [
  {
    path: "performance/insights",
    loadComponent: () =>
      import("../../../features/analytics/analytics.component").then(
        (m) => m.AnalyticsComponent,
      ),
    canActivate: [authGuard, headerConfigGuard],
    resolve: { prefetch: analyticsPrefetchResolver },
    data: { preload: false, entry: "hub" },
  },
  {
    path: "analytics",
    redirectTo: "performance/insights",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "analytics/enhanced",
    redirectTo: "performance/insights",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "performance/tests",
    loadComponent: () =>
      import("../../../features/performance-tracking/performance-tracking.component").then(
        (m) => m.PerformanceTrackingComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" },
  },
  {
    path: "performance-tracking",
    redirectTo: "performance/tests",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "performance",
    redirectTo: "performance/tests",
    pathMatch: "full",
    data: { entry: "internal" },
  },
  // Redirect /performance/body-composition to performance-tracking with body composition tab
  {
    path: "performance/body-composition",
    redirectTo: "performance/tests",
    pathMatch: "full",
    data: { entry: "internal" },
  },
];

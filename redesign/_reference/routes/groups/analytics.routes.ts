import { Routes } from "@angular/router";
import { authGuard } from "../../guards/auth.guard";
import { analyticsPrefetchResolver } from "../../resolvers/analytics-prefetch.resolver";

export const analyticsRoutes: Routes = [
  {
    path: "reports",
    loadComponent: () =>
      import("../../../features/reports/reports-hub.component").then(
        (m) => m.ReportsHubComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "hub", headerPreset: "analytics" },
  },
  {
    path: "performance/insights",
    loadComponent: () =>
      import("../../../features/analytics/analytics.component").then(
        (m) => m.AnalyticsComponent,
      ),
    canActivate: [authGuard],
    resolve: { prefetch: analyticsPrefetchResolver },
    data: { preload: false, entry: "hub", headerPreset: "analytics" },
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
    data: { preload: false, entry: "internal", headerPreset: "analytics" },
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

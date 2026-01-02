/**
 * Prefetch Guard
 *
 * Triggers prefetching for heavy pages when user hovers or focuses on navigation links
 * Improves perceived performance by loading data before route activation
 */

import { inject } from "@angular/core";
import { CanActivateFn, Router, NavigationEnd } from "@angular/router";
import { filter, take } from "rxjs/operators";
import { AnalyticsDataService } from "../services/data/analytics-data.service";

export const prefetchGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const analyticsDataService = inject(AnalyticsDataService);

  // Prefetch analytics data if navigating to analytics route
  if (state.url.includes("/analytics")) {
    // Start prefetching in background
    analyticsDataService.getAllAnalytics().subscribe({
      next: () => {
        // Data prefetched
      },
      error: () => {
        // Silently fail
      },
    });
  }

  return true;
};


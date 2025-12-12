/**
 * Analytics Prefetch Resolver
 * 
 * Prefetches analytics data when route is activated
 * Improves perceived performance for heavy analytics pages
 */

import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { AnalyticsDataService } from '../services/data/analytics-data.service';
import { AnalyticsViewModel } from '../view-models/analytics.view-model';

export const analyticsPrefetchResolver: ResolveFn<void> = (route, state) => {
  const analyticsDataService = inject(AnalyticsDataService);
  const analyticsViewModel = inject(AnalyticsViewModel);

  // Prefetch analytics data
  // This runs before the component loads, improving perceived performance
  analyticsDataService.getAllAnalytics().subscribe({
    next: (data) => {
      // Data is prefetched and cached
      // Component will use AnalyticsViewModel which may have cached data
    },
    error: (err) => {
      // Silently fail - component will handle error state
      console.warn('Analytics prefetch failed:', err);
    }
  });

  // Initialize view model with prefetched data
  analyticsViewModel.initialize(undefined, false);

  return undefined;
};


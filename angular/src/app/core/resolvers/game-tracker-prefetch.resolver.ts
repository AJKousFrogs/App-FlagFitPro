/**
 * Game Tracker Prefetch Resolver
 *
 * Prefetches game tracker data (film/analytics) when route is activated
 * Heavy page optimization
 */

import { inject } from "@angular/core";
import { ResolveFn } from "@angular/router";
import { ApiService, API_ENDPOINTS } from "../services/api.service";
import { LoggerService } from "../services/logger.service";

export const gameTrackerPrefetchResolver: ResolveFn<void> = (route, state) => {
  const apiService = inject(ApiService);
  const logger = inject(LoggerService);

  // Prefetch game tracker related data
  // This runs before the component loads
  apiService.get(API_ENDPOINTS.coach.games).subscribe({
    next: () => {
      // Data prefetched and cached
    },
    error: (err) => {
      // Silently fail - component will handle error state
      logger.warn("Game tracker prefetch failed:", err);
    },
  });

  return undefined;
};

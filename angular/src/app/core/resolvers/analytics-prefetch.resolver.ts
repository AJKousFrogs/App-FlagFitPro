/**
 * Analytics Prefetch Resolver
 *
 * Prefetches analytics data when route is activated
 * Improves perceived performance for heavy analytics pages
 */

import { inject } from "@angular/core";
import { ResolveFn } from "@angular/router";
import { AnalyticsViewModel } from "../view-models/analytics.view-model";

/**
 * Prefetches analytics by initializing the view model before the route activates.
 * A single `getAllAnalytics` run happens inside `initialize` → `loadAllAnalytics`.
 */
export const analyticsPrefetchResolver: ResolveFn<void> = (_route, _state) => {
  inject(AnalyticsViewModel).initialize(undefined, false);
  return undefined;
};

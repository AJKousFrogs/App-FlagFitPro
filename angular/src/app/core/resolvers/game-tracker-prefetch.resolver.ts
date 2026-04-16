/**
 * Game Tracker Prefetch Resolver
 *
 * Prefetches game tracker data (film/analytics) when route is activated
 * Heavy page optimization
 */

import { inject } from "@angular/core";
import { ResolveFn } from "@angular/router";
import { of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { ApiService, API_ENDPOINTS } from "../services/api.service";
import { LoggerService } from "../services/logger.service";
import { toLogContext } from "../services/logger.service";
import { GameListSchema } from "../schemas/api-response.schema";

export const gameTrackerPrefetchResolver: ResolveFn<void> = (
  _route,
  _state,
) => {
  const apiService = inject(ApiService);
  const logger = inject(LoggerService);

  return apiService.get(API_ENDPOINTS.coach.games, undefined, {
    schema: GameListSchema,
    throwOnValidationError: false,
  }).pipe(
    map(() => undefined as void),
    catchError((err) => {
      // Silently fail - component will handle error state
      logger.warn("Game tracker prefetch failed:", toLogContext(err));
      return of(undefined as void);
    }),
  );
};

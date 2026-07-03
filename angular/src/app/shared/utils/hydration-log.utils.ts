import type { WritableSignal } from "@angular/core";
import type { ApiService } from "../../core/services/api.service";
import type { LoggerService } from "../../core/services/logger.service";

/**
 * Optimistically bumps a hydration total signal and posts the log; rolls the
 * signal back if the write doesn't persist. Shared by gameday and wellness,
 * which each own their own daily-total signal.
 */
export function logHydrationOptimistic(
  api: ApiService,
  logger: LoggerService,
  hydrationMl: WritableSignal<number>,
  ml: number,
): void {
  hydrationMl.update((v) => v + ml);
  api.post("/api/hydration/log", { amount: ml }).subscribe({
    error: (err) => {
      hydrationMl.update((v) => v - ml);
      logger.error("hydration_log_failed", err);
    },
  });
}

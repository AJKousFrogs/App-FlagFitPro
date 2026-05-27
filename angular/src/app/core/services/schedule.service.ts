import {
  Injectable,
  computed,
  inject,
  resource,
} from "@angular/core";
import { firstValueFrom } from "rxjs";

import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";
import {
  CompetitionEvent,
  CompetitionPhase,
  EventDensity,
  PhaseContext,
  ScheduleSnapshot,
} from "../models/schedule.models";

/**
 * Schedule Service — canonical read API for the v10 spine.
 *
 * One service. One source of truth. Today, training, nutrition, hydration,
 * recovery, and readiness all consume from here. **Do not** re-derive
 * "next event" or "game density" inside feature components.
 *
 * Backed by `/api/schedule`, which reads from `v_athlete_schedule` (a union
 * across the athlete's active team memberships).
 */
@Injectable({ providedIn: "root" })
export class ScheduleService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly supabase = inject(SupabaseService);

  // ---------------------------------------------------------------------------
  // Core resource — auto-loads on userId change, resets on logout.
  // ---------------------------------------------------------------------------
  private readonly scheduleResource = resource({
    params: () => this.supabase.userId(),
    loader: async ({ params: userId }) => {
      if (!userId) return null;
      const response = await firstValueFrom(
        this.api.get<ScheduleSnapshot>("schedule"),
      );
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error ?? "Failed to load schedule");
    },
  });

  /** Latest schedule snapshot, or `null` until first load. */
  readonly snapshot = computed(() => this.scheduleResource.value() ?? null);
  readonly loading = this.scheduleResource.isLoading;
  readonly error = computed(() => {
    const err = this.scheduleResource.error();
    if (!err) return null;
    return err instanceof Error ? err.message : String(err);
  });

  /** Convenience signals — null-safe so consumers can bind directly. */
  readonly nextEvent = computed(() => this.snapshot()?.nextEvent ?? null);
  readonly lastEvent = computed(() => this.snapshot()?.lastEvent ?? null);
  readonly upcoming = computed(() => this.snapshot()?.upcoming ?? []);
  readonly currentPhase = computed<CompetitionPhase>(
    () => this.snapshot()?.currentPhase ?? "transition",
  );
  readonly density7d = computed<EventDensity | null>(
    () => this.snapshot()?.density7d ?? null,
  );
  readonly density14d = computed<EventDensity | null>(
    () => this.snapshot()?.density14d ?? null,
  );
  readonly density28d = computed<EventDensity | null>(
    () => this.snapshot()?.density28d ?? null,
  );

  /**
   * Days until the next event. `null` if nothing is scheduled.
   * Rounded down — "0 days" means today.
   */
  readonly daysToNextEvent = computed<number | null>(() => {
    const next = this.nextEvent();
    if (!next) {
      return null;
    }
    const diffMs = new Date(next.startsAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diffMs / 86_400_000));
  });

  /**
   * Refresh the schedule snapshot. Call after any write that affects events.
   *
   * Returns a Promise so callers that need the data immediately after the
   * refresh (e.g. `training-plan.service`) can `await` it. Internally sets
   * the resource value directly to avoid a race between `reload()` and the
   * caller's subsequent read.
   */
  async refresh(): Promise<void> {
    const userId = this.supabase.userId();
    if (!userId) {
      return;
    }
    try {
      const response = await firstValueFrom(
        this.api.get<ScheduleSnapshot>("schedule"),
      );
      if (response.success && response.data) {
        this.scheduleResource.value.set(response.data);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      this.logger.error("[ScheduleService] refresh failed", { error: msg });
    }
  }

  /**
   * Events in a forward-looking window. `windowDays = 7` returns events that
   * start within the next 7 days. Pure read against the cached snapshot.
   */
  eventsInWindow(windowDays: number): CompetitionEvent[] {
    const snap = this.snapshot();
    if (!snap) {
      return [];
    }
    const horizon = Date.now() + windowDays * 86_400_000;
    return snap.upcoming.filter(
      (e) => new Date(e.startsAt).getTime() <= horizon,
    );
  }

  /**
   * Resolve the periodization phase for an arbitrary date relative to the
   * current snapshot. Mirrors the server-side resolver but operates on the
   * cached snapshot — useful for week views and calendar coloring.
   *
   * For "what phase am I in *right now*", prefer the {@link currentPhase}
   * signal instead.
   */
  phaseFor(date: Date): CompetitionPhase {
    const snap = this.snapshot();
    if (!snap) {
      return "transition";
    }
    return resolvePhase({
      date,
      upcoming: snap.upcoming,
      lastEvent: snap.lastEvent,
    });
  }

  /**
   * Game density over a sliding window starting *now*. Null if not loaded.
   * Server already pre-computes 7/14/28; this falls back to manual count for
   * arbitrary windows.
   */
  gameDensity(windowDays: number): EventDensity | null {
    if (windowDays === 7) {
      return this.density7d();
    }
    if (windowDays === 14) {
      return this.density14d();
    }
    if (windowDays === 28) {
      return this.density28d();
    }
    return computeDensity(this.upcoming(), new Date(), windowDays);
  }
}

// =============================================================================
// PURE HELPERS
// =============================================================================

const HOURS_TAPER_PEAK = 7 * 24;
const HOURS_TAPER_HIGH = 4 * 24;
const HOURS_TAPER_REGULAR = 2 * 24;
const HOURS_RECOVERY_PEAK = 4 * 24;
const HOURS_RECOVERY_HIGH = 2 * 24;
const HOURS_RECOVERY_REGULAR = 1 * 24;
const HOURS_TRANSITION = 14 * 24;

/**
 * Pure phase resolver — must mirror `netlify/functions/schedule.js`.
 * If you change one, change both.
 */
export function resolvePhase(ctx: PhaseContext): CompetitionPhase {
  const { date, upcoming, lastEvent } = ctx;
  const next = upcoming.find(
    (e) => new Date(e.endsAt ?? e.startsAt).getTime() >= date.getTime(),
  );

  if (next) {
    const startsAt = new Date(next.startsAt);
    const endsAt = next.endsAt ? new Date(next.endsAt) : startsAt;
    if (date >= startsAt && date <= endsAt) {
      return "competition";
    }
    if (date < startsAt) {
      const hoursUntil = (startsAt.getTime() - date.getTime()) / 3_600_000;
      const taperWindow =
        next.importance === "peak"
          ? HOURS_TAPER_PEAK
          : next.importance === "high"
            ? HOURS_TAPER_HIGH
            : HOURS_TAPER_REGULAR;
      if (hoursUntil <= taperWindow) {
        return "taper";
      }
    }
  }

  if (lastEvent) {
    const ended = new Date(lastEvent.endsAt ?? lastEvent.startsAt);
    if (ended <= date) {
      const hoursSince = (date.getTime() - ended.getTime()) / 3_600_000;
      const recoveryWindow =
        lastEvent.importance === "peak"
          ? HOURS_RECOVERY_PEAK
          : lastEvent.importance === "high"
            ? HOURS_RECOVERY_HIGH
            : HOURS_RECOVERY_REGULAR;
      if (hoursSince <= recoveryWindow) {
        return "recovery";
      }
    }
  }

  if (!next) {
    return "transition";
  }
  const hoursUntilNext =
    (new Date(next.startsAt).getTime() - date.getTime()) / 3_600_000;
  if (hoursUntilNext > HOURS_TRANSITION) {
    return "transition";
  }
  return "accumulation";
}

function eventDayCount(startsAt: string, endsAt: string | null): number {
  if (!endsAt) {
    return 1;
  }
  const startDay = new Date(startsAt);
  startDay.setUTCHours(0, 0, 0, 0);
  const endDay = new Date(endsAt);
  endDay.setUTCHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (endDay.getTime() - startDay.getTime()) / 86_400_000,
  );
  return Math.max(1, diffDays + 1);
}

export function computeDensity(
  events: CompetitionEvent[],
  fromDate: Date,
  windowDays: number,
): EventDensity {
  const horizon = new Date(fromDate.getTime() + windowDays * 86_400_000);
  let totalGames = 0;
  let eventDays = 0;
  let peakDayGames = 0;
  let hasPeak = false;

  for (const ev of events) {
    const startsAt = new Date(ev.startsAt);
    if (startsAt >= horizon || startsAt < fromDate) {
      continue;
    }
    const days = eventDayCount(ev.startsAt, ev.endsAt);
    const games = ev.expectedGameCount;
    const perDay = days > 0 ? games / days : games;
    totalGames += games;
    eventDays += days;
    if (perDay > peakDayGames) {
      peakDayGames = perDay;
    }
    if (ev.importance === "peak") {
      hasPeak = true;
    }
  }

  return {
    windowDays,
    totalGames,
    eventDayCount: eventDays,
    peakDayGameCount: Math.round(peakDayGames * 10) / 10,
    hasPeakImportance: hasPeak,
  };
}

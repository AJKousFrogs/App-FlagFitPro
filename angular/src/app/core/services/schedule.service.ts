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
 * Schedule Service — canonical read API for the v11 spine.
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
        this.api.get<ScheduleSnapshot>("/api/schedule"),
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
        this.api.get<ScheduleSnapshot>("/api/schedule"),
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
    // Resolve the "last event" relative to `date`, not to now — otherwise a game
    // that's still in the future relative to today never counts as a past event
    // for the days after it, and the week-ahead would miss post-game recovery
    // (e.g. the Monday after this weekend's games should read as recovery).
    const all = snap.lastEvent ? [snap.lastEvent, ...snap.upcoming] : snap.upcoming;
    const priorByDate = all
      .filter((e) => new Date(e.endsAt ?? e.startsAt).getTime() < date.getTime())
      .sort(
        (a, b) =>
          new Date(b.endsAt ?? b.startsAt).getTime() -
          new Date(a.endsAt ?? a.startsAt).getTime(),
      );
    return resolvePhase({
      date,
      upcoming: snap.upcoming,
      lastEvent: priorByDate[0] ?? null,
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
    // `date` is midnight LOCAL time; event timestamps are UTC. A straight >=/<=
    // comparison fails on game day when midnight local is before event start UTC
    // (e.g. UTC+2: midnight June 21 = 22:00 June 20 UTC < 08:00 June 21 UTC).
    // Compare calendar dates instead: local YYYY-MM-DD for `date`, UTC for events.
    const localDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dateStr = localDate(date);
    const startStr = startsAt.toISOString().slice(0, 10);
    const endStr = endsAt.toISOString().slice(0, 10);
    if (dateStr >= startStr && dateStr <= endStr) {
      // Games are on Saturday (6) and Sunday (0) for club/national events.
      // Continental / world / olympic / peak events may have games on any day.
      const dow = date.getDay(); // 0 = Sun, 6 = Sat
      const isWeekend = dow === 0 || dow === 6;
      const isInternational =
        next.importance === "peak" ||
        (["international", "continental", "world", "olympic"] as const).includes(
          next.competitionLevel as "international" | "continental" | "world" | "olympic",
        );
      return isWeekend || isInternational ? "competition" : "travel";
    }
  }

  // Post-event recovery takes precedence over an upcoming taper window. A
  // heavy weekend's fatigue must clear before "sharp, not heavy" taper framing
  // makes sense — even if the next event is already close enough to taper for
  // (e.g. games on the weekend + a peak event ~6 days out both apply on the
  // Monday after; recovery wins so the day reads as the off/easy day it is).
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

  if (next && date < new Date(next.startsAt)) {
    const startsAt = new Date(next.startsAt);
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
    // Worst-DAY estimate, biased CONSERVATIVELY. We only have the event's TOTAL
    // games + day span, not the per-day split, so a flat average dilutes a real
    // congested day (a 4-game Saturday in a 6-game/3-day tournament would read
    // 2.0 and miss the de-load). Assume games concentrate into fewer days than
    // the full span (multi-day tournaments have lighter days) → divide by
    // (days-1). Over-estimating the peak is the SAFE direction (heavy density
    // only de-loads + adds fluid); it never lets an uneven tournament read light.
    const perDay = days > 1 ? Math.ceil(games / (days - 1)) : games;
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

import {
  CompetitionEvent,
  CompetitionLevel,
  CompetitionPhase,
  EventDensity,
  EventImportance,
  PhaseContext,
} from "../models/schedule.models";

// =============================================================================
// PURE SCHEDULE RESOLVER — extracted from schedule.service.ts (2026-07-08,
// reusability audit F3) so `resolvePhase` is importable without dragging in
// Angular's DI/HttpClient machinery (the same problem periodization-engine.ts
// solved this session). This unblocks a client<->server parity test
// (tests/unit/schedule-resolver-parity.test.js) analogous to
// periodization-port-parity.test.js — `resolvePhase` here and in
// netlify/functions/schedule.js were already deliberately mirrored by
// convention; now that convention is enforced by a test, not just a comment.
// =============================================================================

const HOURS_TAPER_PEAK = 7 * 24;
const HOURS_TAPER_HIGH = 4 * 24;
const HOURS_TAPER_REGULAR = 2 * 24;
const HOURS_RECOVERY_PEAK = 4 * 24;
const HOURS_RECOVERY_HIGH = 2 * 24;
const HOURS_RECOVERY_REGULAR = 1 * 24;
const HOURS_TRANSITION = 14 * 24;

// V2.4 — competition-tier taper/recovery. Mirrors netlify/functions/schedule.js
// byte-for-byte (same constants, same effectiveImportance formula) — if one
// changes, change both. See that file's comment for the full rationale:
// importance can be forgotten; a World/Olympic tier must never taper like a
// domestic game regardless.
const LEVEL_IMPORTANCE_FLOOR: Partial<
  Record<CompetitionLevel, EventImportance>
> = {
  international: "high",
  continental: "high",
  world: "peak",
  olympic: "peak",
};
const LEVEL_TAPER_BONUS_HOURS: Partial<Record<CompetitionLevel, number>> = {
  world: 3 * 24,
  olympic: 7 * 24,
};
const LEVEL_RECOVERY_BONUS_HOURS: Partial<Record<CompetitionLevel, number>> = {
  world: 1 * 24,
  olympic: 3 * 24,
};
const IMPORTANCE_RANK: Record<EventImportance, number> = {
  regular: 0,
  high: 1,
  peak: 2,
};

/** The importance actually used for taper/recovery windows — the higher of
 * the declared importance and the tier's guaranteed floor. Never lowers a
 * coach-declared importance, only raises it. */
export function effectiveImportance(
  importance: EventImportance,
  competitionLevel: CompetitionLevel,
): EventImportance {
  const floor = LEVEL_IMPORTANCE_FLOOR[competitionLevel];
  if (!floor) return importance;
  return IMPORTANCE_RANK[floor] > IMPORTANCE_RANK[importance]
    ? floor
    : importance;
}

/**
 * Pure phase resolver — must mirror `netlify/functions/schedule.js`.
 * If you change one, change both (tests/unit/schedule-resolver-parity.test.js
 * enforces this).
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
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
        (
          ["international", "continental", "world", "olympic"] as const
        ).includes(
          next.competitionLevel as
            | "international"
            | "continental"
            | "world"
            | "olympic",
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
      const effImportance = effectiveImportance(
        lastEvent.importance,
        lastEvent.competitionLevel,
      );
      const recoveryWindow =
        (effImportance === "peak"
          ? HOURS_RECOVERY_PEAK
          : effImportance === "high"
            ? HOURS_RECOVERY_HIGH
            : HOURS_RECOVERY_REGULAR) +
        (LEVEL_RECOVERY_BONUS_HOURS[lastEvent.competitionLevel] ?? 0);
      if (hoursSince <= recoveryWindow) {
        return "recovery";
      }
    }
  }

  if (next && date < new Date(next.startsAt)) {
    const startsAt = new Date(next.startsAt);
    const hoursUntil = (startsAt.getTime() - date.getTime()) / 3_600_000;
    const effImportance = effectiveImportance(
      next.importance,
      next.competitionLevel,
    );
    const taperWindow =
      (effImportance === "peak"
        ? HOURS_TAPER_PEAK
        : effImportance === "high"
          ? HOURS_TAPER_HIGH
          : HOURS_TAPER_REGULAR) +
      (LEVEL_TAPER_BONUS_HOURS[next.competitionLevel] ?? 0);
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

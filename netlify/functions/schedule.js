import { supabaseAdmin } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { createLogger } from "./utils/structured-logger.js";

// Netlify Function: Athlete Schedule (canonical read)
// Endpoint: /api/schedule?from=ISO&to=ISO
//
// Returns the athlete's schedule snapshot:
//   - upcoming events (union across active team memberships)
//   - last completed event
//   - density windows (7d / 14d / 28d)
//   - current periodization phase
//
// This is the single canonical read shape consumed by today, training,
// nutrition, hydration, recovery, and readiness. Other endpoints should not
// re-derive schedule state from raw `tournaments` / `games` / `fixtures`.

const logger = createLogger({ service: "netlify.schedule" });

const DEFAULT_LOOKAHEAD_DAYS = 56;
const DEFAULT_LOOKBACK_DAYS = 14;
const MAX_WINDOW_DAYS = 365;

// Phase resolution thresholds (hours)
const HOURS_TAPER_PEAK = 7 * 24; // taper window before peak importance
const HOURS_TAPER_HIGH = 4 * 24; // taper window before high importance
const HOURS_TAPER_REGULAR = 2 * 24; // light taper before any event
const HOURS_RECOVERY_PEAK = 4 * 24; // recovery window after peak
const HOURS_RECOVERY_HIGH = 2 * 24; // recovery window after high
const HOURS_RECOVERY_REGULAR = 1 * 24; // recovery window after regular
const HOURS_TRANSITION = 14 * 24; // beyond this with nothing scheduled = transition

function parseIsoDate(value, fallback) {
  if (!value) {
    return fallback;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

function clampWindow(from, to) {
  const start = from.getTime();
  const end = to.getTime();
  if (end - start > MAX_WINDOW_DAYS * 86_400_000) {
    return new Date(start + MAX_WINDOW_DAYS * 86_400_000);
  }
  return to;
}

function eventDayCount(starts, ends) {
  if (!ends) {
    return 1;
  }
  const startDay = new Date(starts);
  startDay.setUTCHours(0, 0, 0, 0);
  const endDay = new Date(ends);
  endDay.setUTCHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (endDay.getTime() - startDay.getTime()) / 86_400_000,
  );
  return Math.max(1, diffDays + 1);
}

function densityFor(events, fromDate, windowDays) {
  const horizon = new Date(fromDate.getTime() + windowDays * 86_400_000);
  let totalGames = 0;
  let eventDays = 0;
  let peakDayGames = 0;
  let hasPeak = false;

  for (const ev of events) {
    const startsAt = new Date(ev.starts_at);
    if (startsAt >= horizon || startsAt < fromDate) {
      continue;
    }
    const days = eventDayCount(ev.starts_at, ev.ends_at);
    const games = ev.expected_game_count ?? 1;
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

function hoursBetween(a, b) {
  return Math.abs(a.getTime() - b.getTime()) / 3_600_000;
}

/**
 * Resolve the periodization phase for `now` given a list of upcoming and
 * past events. Pure function — same inputs always yield the same phase.
 */
function resolvePhase(now, upcoming, lastEvent) {
  const next = upcoming[0] ?? null;

  // Currently inside an event (live day)
  if (next) {
    const startsAt = new Date(next.starts_at);
    const endsAt = next.ends_at ? new Date(next.ends_at) : startsAt;
    if (now >= startsAt && now <= endsAt) {
      return "competition";
    }
    if (now < startsAt) {
      const hoursUntil = hoursBetween(startsAt, now);
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
    const ended = new Date(lastEvent.ends_at ?? lastEvent.starts_at);
    // Defensive: only count recovery when the event is actually in the past
    // for the resolution moment. Mirrors `resolvePhase` in
    // angular/.../schedule.service.ts so client and server agree on phase
    // for a given (now, upcoming, lastEvent) tuple even if upstream filters
    // change.
    if (ended <= now) {
      const hoursSince = hoursBetween(now, ended);
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

  // Nothing scheduled at all → transition window.
  if (!next) {
    return "transition";
  }
  const hoursUntilNext = hoursBetween(new Date(next.starts_at), now);
  if (hoursUntilNext > HOURS_TRANSITION) {
    return "transition";
  }

  return "accumulation";
}

function rowToEvent(row) {
  return {
    id: row.id,
    competitionId: row.competition_id,
    teamId: row.team_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    expectedGameCount: row.expected_game_count,
    importance: row.importance,
    label: row.label,
    location: row.location,
    venue: row.venue,
    notes: row.notes,
    status: row.status,
    competitionName: row.competition_name,
    competitionShortName: row.competition_short_name,
    competitionKind: row.competition_kind,
    competitionLevel: row.competition_level,
    competitionCountry: row.competition_country,
    competitionSeasonYear: row.competition_season_year,
    teamName: row.team_name,
  };
}

async function getSchedule(event, _context, { userId }) {
  const now = new Date();
  const params = event.queryStringParameters ?? {};

  const from = parseIsoDate(
    params.from,
    new Date(now.getTime() - DEFAULT_LOOKBACK_DAYS * 86_400_000),
  );
  const to = clampWindow(
    from,
    parseIsoDate(
      params.to,
      new Date(now.getTime() + DEFAULT_LOOKAHEAD_DAYS * 86_400_000),
    ),
  );

  const { data, error } = await supabaseAdmin
    .from("v_athlete_schedule")
    .select("*")
    .eq("athlete_id", userId)
    .gte("starts_at", from.toISOString())
    .lte("starts_at", to.toISOString())
    .order("starts_at", { ascending: true });

  if (error) {
    logger.error("schedule.read_failed", {
      userId,
      error: error.message,
      code: error.code,
    });
    return createErrorResponse("Failed to read schedule", 500);
  }

  const rows = data ?? [];
  const upcoming = rows
    .filter((r) => new Date(r.ends_at ?? r.starts_at) >= now)
    .filter((r) => r.status !== "cancelled")
    .map(rowToEvent);

  const past = rows
    .filter((r) => new Date(r.ends_at ?? r.starts_at) < now)
    .filter((r) => r.status !== "cancelled");
  const lastEvent = past.length > 0 ? rowToEvent(past[past.length - 1]) : null;

  const upcomingRaw = rows
    .filter((r) => new Date(r.ends_at ?? r.starts_at) >= now)
    .filter((r) => r.status !== "cancelled");

  const density7d = densityFor(upcomingRaw, now, 7);
  const density14d = densityFor(upcomingRaw, now, 14);
  const density28d = densityFor(upcomingRaw, now, 28);

  const currentPhase = resolvePhase(now, upcomingRaw, past[past.length - 1] ?? null);

  return createSuccessResponse({
    athleteId: userId,
    generatedAt: now.toISOString(),
    upcoming,
    lastEvent,
    nextEvent: upcoming[0] ?? null,
    density7d,
    density14d,
    density28d,
    currentPhase,
  });
}

export const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "schedule",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    handler: getSchedule,
  });
};

// Exported for unit testing (pure functions; no auth needed)
export const __test__ = {
  resolvePhase,
  densityFor,
  eventDayCount,
};

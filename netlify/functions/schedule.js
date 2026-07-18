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

// V2.4 — competition-tier taper/recovery. `competitions.level` (and, for
// athlete-entered national-team events, the new `athlete_events.tier`) is a
// SEPARATE axis from the coach/athlete-set `importance` flag: importance can
// be forgotten or under-set, but a World Championship or the Olympics must
// never taper like a domestic league game just because nobody clicked
// "peak". `LEVEL_IMPORTANCE_FLOOR` guarantees a minimum importance for a
// tier; `LEVEL_*_BONUS_HOURS` then extends the window further for world/
// olympic specifically — a continental championship (most players have one
// every year) gets standard "peak" treatment, but Worlds (every ~2 years)
// and the Olympics (every 4) carry more travel, more stakes, and warrant a
// materially deeper taper and longer recovery on top of that.
const LEVEL_IMPORTANCE_FLOOR = {
  club: null,
  regional: null,
  national: null,
  international: "high",
  continental: "high",
  world: "peak",
  olympic: "peak",
};
const LEVEL_TAPER_BONUS_HOURS = {
  club: 0,
  regional: 0,
  national: 0,
  international: 0,
  continental: 0,
  world: 3 * 24,
  olympic: 7 * 24,
};
const LEVEL_RECOVERY_BONUS_HOURS = {
  club: 0,
  regional: 0,
  national: 0,
  international: 0,
  continental: 0,
  world: 1 * 24,
  olympic: 3 * 24,
};
const IMPORTANCE_RANK = { regular: 0, high: 1, peak: 2 };

/**
 * The importance actually used for taper/recovery window selection: the
 * higher of the declared `importance` and the tier's guaranteed floor.
 * Never LOWERS a coach-declared importance — only raises it.
 */
function effectiveImportance(importance, competitionLevel) {
  const floor = LEVEL_IMPORTANCE_FLOOR[competitionLevel] ?? null;
  const declared = importance ?? "regular";
  if (!floor) {
    return declared;
  }
  return IMPORTANCE_RANK[floor] > IMPORTANCE_RANK[declared] ? floor : declared;
}

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
    // Worst-DAY estimate, biased CONSERVATIVELY — see schedule.service.ts. A flat
    // average dilutes a real congested day in an uneven multi-day tournament;
    // dividing by (days-1) over-estimates the peak, which only ever de-loads
    // (safe) and never lets a congested tournament read as falsely light.
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

function hoursBetween(a, b) {
  return Math.abs(a.getTime() - b.getTime()) / 3_600_000;
}

/**
 * Resolve the periodization phase for `now` given a list of upcoming and
 * past events. Pure function — same inputs always yield the same phase.
 */
export function resolvePhase(now, upcoming, lastEvent) {
  const next = upcoming[0] ?? null;

  // Currently inside an event (live day)
  if (next) {
    const startsAt = new Date(next.starts_at);
    const endsAt = next.ends_at ? new Date(next.ends_at) : startsAt;
    // Protocol requests for a specific date pass midnight UTC as `now`, which
    // falls before the event starts_at (e.g. 08:00 UTC) and breaks the check.
    // Compare calendar dates (YYYY-MM-DD) so any time on game day works.
    const dateStr = now.toISOString().slice(0, 10);
    const startStr = startsAt.toISOString().slice(0, 10);
    const endStr = endsAt.toISOString().slice(0, 10);
    if (dateStr >= startStr && dateStr <= endStr) {
      // Games are Saturday (6) / Sunday (0) for club and national events.
      // Continental / world / olympic / peak events may have games on any day.
      const dow = now.getUTCDay(); // 0 = Sun, 6 = Sat
      const isWeekend = dow === 0 || dow === 6;
      const isInternational =
        next.importance === "peak" ||
        ["international", "continental", "world", "olympic"].includes(
          next.competition_level,
        );
      return isWeekend || isInternational ? "competition" : "travel";
    }
  }

  // Post-event recovery takes precedence over an upcoming taper window. A
  // heavy weekend's fatigue must clear before "sharp, not heavy" taper framing
  // makes sense — even if the next event is already close enough to taper for
  // (e.g. games on the weekend + a peak event ~6 days out both apply on the
  // Monday after; recovery wins so the day reads as the off/easy day it is).
  // Mirrors `resolvePhase` in angular/.../schedule.service.ts so client and
  // server agree on phase for a given (now, upcoming, lastEvent) tuple even if
  // upstream filters change.
  if (lastEvent) {
    const ended = new Date(lastEvent.ends_at ?? lastEvent.starts_at);
    // Defensive: only count recovery when the event is actually in the past
    // for the resolution moment.
    if (ended <= now) {
      const hoursSince = hoursBetween(now, ended);
      const effImportance = effectiveImportance(
        lastEvent.importance,
        lastEvent.competition_level,
      );
      const recoveryWindow =
        (effImportance === "peak"
          ? HOURS_RECOVERY_PEAK
          : effImportance === "high"
            ? HOURS_RECOVERY_HIGH
            : HOURS_RECOVERY_REGULAR) +
        (LEVEL_RECOVERY_BONUS_HOURS[lastEvent.competition_level] ?? 0);
      if (hoursSince <= recoveryWindow) {
        return "recovery";
      }
    }
  }

  if (next && now < new Date(next.starts_at)) {
    const startsAt = new Date(next.starts_at);
    const hoursUntil = hoursBetween(startsAt, now);
    const effImportance = effectiveImportance(
      next.importance,
      next.competition_level,
    );
    const taperWindow =
      (effImportance === "peak"
        ? HOURS_TAPER_PEAK
        : effImportance === "high"
          ? HOURS_TAPER_HIGH
          : HOURS_TAPER_REGULAR) +
      (LEVEL_TAPER_BONUS_HOURS[next.competition_level] ?? 0);
    if (hoursUntil <= taperWindow) {
      return "taper";
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

// Athlete-entered events (personal / domestic / national) are stored in
// `athlete_events` and projected onto the same row shape as `v_athlete_schedule`
// so phase/density/snapshot logic treats them identically.
const ATHLETE_EVENT_LEVEL = {
  personal: "club",
  domestic: "national",
  national: "international",
};
const ATHLETE_EVENT_KIND = {
  gameday: "league",
  tournament: "tournament",
  camp: "friendly",
  friendly: "friendly",
  other: "friendly",
};
const ATHLETE_EVENT_TEAM_LABEL = {
  personal: "Personal",
  domestic: "Domestic",
  national: "National team",
};

function athleteEventToRow(ev) {
  return {
    id: ev.id,
    competition_id: null,
    team_id: null,
    starts_at: ev.starts_at,
    ends_at: ev.ends_at,
    expected_game_count: ev.expected_game_count ?? 1,
    importance: ev.importance ?? "regular",
    label: ev.title,
    location: ev.location,
    venue: ev.venue,
    surface: ev.surface ?? null,
    hotel_name: null,
    hotel_address: null,
    notes: ev.notes,
    status: ev.status ?? "scheduled",
    competition_name: ev.title,
    competition_short_name: null,
    competition_kind: ATHLETE_EVENT_KIND[ev.kind] ?? "friendly",
    // A national-team commitment's real tier (continental/world/olympic,
    // V2.4) overrides the flat category-based default — an athlete entering
    // "World Championship 2027" must taper deeper than "just" a national
    // camp, and ATHLETE_EVENT_LEVEL alone can't tell them apart (both are
    // category:'national').
    competition_level: ev.tier ?? ATHLETE_EVENT_LEVEL[ev.category] ?? "club",
    competition_country: null,
    competition_season_year: null,
    team_name: ATHLETE_EVENT_TEAM_LABEL[ev.category] ?? "Personal",
    // marker so consumers can tell athlete-entered events apart from team events
    source: "athlete",
  };
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
    // 'grass' | 'turf' | null (unknown → no surface advisory). Comes from
    // competition_events via v_athlete_schedule, or athlete_events directly.
    surface: row.surface ?? null,
    hotelName: row.hotel_name,
    hotelAddress: row.hotel_address,
    notes: row.notes,
    status: row.status,
    competitionName: row.competition_name,
    competitionShortName: row.competition_short_name,
    competitionKind: row.competition_kind,
    competitionLevel: row.competition_level,
    competitionCountry: row.competition_country,
    competitionSeasonYear: row.competition_season_year,
    teamName: row.team_name,
    source: row.source ?? "team",
  };
}

/**
 * Assemble the athlete's schedule snapshot (upcoming/lastEvent/density/currentPhase/
 * trainingDays) for `now`. Pure data assembly — no HTTP concerns — so it is reusable
 * by any server-side caller that needs the same schedule state the client's
 * ScheduleService reads via GET /api/schedule (e.g. a server-side prescription
 * endpoint), without a second implementation of phase/density resolution.
 *
 * @param {object} supabase
 * @param {string} userId
 * @param {{from: Date, to: Date, now?: Date}} window
 */
async function getScheduleSnapshot(
  supabase,
  userId,
  { from, to, now = new Date() },
) {
  // Team/competition events (shared spine) + athlete-entered events (personal,
  // domestic, national) are read in parallel and merged into one timeline.
  const [teamRes, athleteRes] = await Promise.all([
    supabase
      .from("v_athlete_schedule")
      .select("*")
      .eq("user_id", userId)
      .gte("starts_at", from.toISOString())
      .lte("starts_at", to.toISOString())
      .order("starts_at", { ascending: true }),
    supabase
      .from("athlete_events")
      .select("*")
      .eq("user_id", userId)
      .gte("starts_at", from.toISOString())
      .lte("starts_at", to.toISOString())
      .order("starts_at", { ascending: true }),
  ]);

  if (teamRes.error) {
    logger.error("schedule.read_failed", {
      userId,
      error: teamRes.error.message,
      code: teamRes.error.code,
    });
    return { error: teamRes.error };
  }
  // Athlete-entered events are additive; a read failure there must not blank the
  // whole schedule, so log and continue with the team events alone.
  if (athleteRes.error) {
    logger.error("schedule.athlete_events_read_failed", {
      userId,
      error: athleteRes.error.message,
      code: athleteRes.error.code,
    });
  }

  // Athlete-entered events split by kind: 'training' = a flag-football team
  // practice (a load day, NOT a taper/recovery trigger) → surfaced as
  // trainingDays; everything else is a competition event on the timeline.
  const athleteRows = athleteRes.data ?? [];
  const trainingDays = [
    ...new Set(
      athleteRows
        .filter((e) => e.kind === "training" && e.status !== "cancelled")
        .map((e) => String(e.starts_at).slice(0, 10)),
    ),
  ];
  const rows = [
    ...(teamRes.data ?? []),
    ...athleteRows.filter((e) => e.kind !== "training").map(athleteEventToRow),
  ].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
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

  const currentPhase = resolvePhase(
    now,
    upcomingRaw,
    past[past.length - 1] ?? null,
  );

  return {
    error: null,
    snapshot: {
      athleteId: userId,
      generatedAt: now.toISOString(),
      upcoming,
      lastEvent,
      nextEvent: upcoming[0] ?? null,
      density7d,
      density14d,
      density28d,
      currentPhase,
      trainingDays,
    },
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

  const { error, snapshot } = await getScheduleSnapshot(supabaseAdmin, userId, {
    from,
    to,
    now,
  });
  if (error) {
    return createErrorResponse("Failed to read schedule", 500, "server_error");
  }

  return createSuccessResponse(snapshot);
}

export const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "schedule",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    handler: getSchedule,
  });
};

// Reusable by other server-side callers that need the same schedule state as
// GET /api/schedule (e.g. the prescription endpoint) without a second phase/density
// resolver.
export { getScheduleSnapshot, DEFAULT_LOOKAHEAD_DAYS, DEFAULT_LOOKBACK_DAYS };

// Exported for unit testing (pure functions; no auth needed)
export const __test__ = {
  resolvePhase,
  densityFor,
  eventDayCount,
  effectiveImportance,
  getScheduleSnapshot,
};

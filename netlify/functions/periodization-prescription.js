// @ts-check
/**
 * Server-side daily prescription — the backend-authoritative counterpart to the
 * client's `periodization.service.ts` "today" signal.
 *
 * ADDITIVE, NOT YET CONSUMED: this endpoint exists and is correct (its engine is
 * proven byte-for-byte identical to the client's via
 * tests/unit/periodization-port-parity.test.js), but the client has not been
 * switched to call it — see docs/SOURCE_OF_TRUTH.md §5a for the migration status.
 * Shipping this without wiring the client is deliberate: it lets the server engine
 * exist, be tested, and be reviewed independently of the (higher-risk, still-pending)
 * step of changing what the live UI actually renders from.
 *
 * Assembles the same PeriodizationInputs the client wrapper builds (see
 * periodization.service.ts's `today` computed + its private readAcwr/readReadiness/
 * readBodyweight/readAgeYears/isTeamPractice helpers) and calls the identical
 * `prescribeFor`. Fully wired: schedule/phase, ACWR, readiness, season phase,
 * position, age, bodyweight, team-practice, injury restrictions, recent sessions
 * (CNS spacing), weather (reuses weather.js's resolveTeamHomeCity/getWeatherData —
 * same team-home-city resolution and Open-Meteo call the client's /api/weather
 * consumes), travel/acclimatization (most recent past athlete_travel_log leg,
 * mirroring EventTravelService's daysSinceArrival/arrivalDayTravelHours exactly).
 * Still left null/false (each is the engine's own documented "no guard" default,
 * not a corner cut — these are genuinely secondary to load/injury safety):
 * coachOverride, weeklyIntentHint, weeklyProgressionUnsafe.
 */
import { supabaseAdmin } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { createLogger } from "./utils/structured-logger.js";
import {
  getScheduleSnapshot,
  resolvePhase,
  DEFAULT_LOOKAHEAD_DAYS,
  DEFAULT_LOOKBACK_DAYS,
} from "./schedule.js";
import { getActiveInjuries } from "./utils/active-injuries.js";
import { ageFromDob } from "./utils/age.js";
import { resolveTeamHomeCity, getWeatherData } from "./weather.js";
import {
  planWeek,
  macroPhaseFor,
  EMBEDDED_TAPER_RULES,
} from "./utils/periodization-engine.js";
import {
  deriveRestrictions,
  isTeamPractice,
} from "./utils/periodization-input-helpers.js";

// @ts-expect-error — structured-logger.js is intentionally outside this file's
// @ts-check scope (see tsconfig.typecheck.json), so its createLogger({service})
// signature is loosely inferred rather than precisely typed. Runtime-correct
// (every other function in this codebase calls it the same way); if
// structured-logger.js is ever typed properly this line will start erroring
// "unused @ts-expect-error", which is exactly the signal to remove it.
const logger = createLogger({ service: "netlify.periodization-prescription" });

/**
 * Adapts raw athlete_injuries rows (snake_case) to the shared
 * NormalizedInjury shape and calls the SAME deriveRestrictions the client's
 * InjuryService.restrictions() uses (via periodization-input-helpers, ported
 * from periodization-input-helpers.ts — reusability audit F8, 2026-07-08).
 * This used to be an independently hand-copied, only parity-tested-to-match
 * implementation; consolidating it surfaced and fixed a real client-side bug
 * (see that module's header comment) — severity grade normalization now
 * happens identically on both sides because it's literally the same code.
 */
function resolveActiveRestrictions(injuries) {
  return deriveRestrictions(
    injuries.map((i) => ({
      region: i.injury_location ?? null,
      restrictionTypes: i.activity_restrictions ?? [],
      severityGrade: i.injury_grade,
    })),
  );
}

// Age for the CNS-window base spacing, via the ONE canonical ageFromDob
// (utils/age.js — 2026-07-08 audit B1; this used to re-implement the same
// month/day-adjusted year calc F2 already consolidated everywhere else). Adds
// only the CNS-specific 16–80 plausibility bound: outside it -> null, so the
// engine falls back to its 48h base window rather than trusting a fabricated age.
function resolveAgeYears(dob) {
  const age = ageFromDob(dob);
  return age !== null && age >= 16 && age <= 80 ? age : null;
}

/**
 * Live weather at the athlete's team home city — same resolution the client's
 * /api/weather consumes. Never fabricates a location: no home_city on file ->
 * null (engine's own documented "no guard" fallback), matching weather.js's own
 * "no location -> available:false, never a default city" contract.
 */
async function resolveWeather(userId) {
  const city = await resolveTeamHomeCity(userId);
  if (!city) {
    return null;
  }
  const data = await getWeatherData(null, null, city);
  if (data.temp === null || data.temp === undefined) {
    return null;
  }
  return {
    tempC: data.temp ?? null,
    apparentC: data.apparentC ?? data.temp ?? null,
    condition: data.condition ?? null,
    weatherCode: data.weatherCode ?? null,
    precipMm: data.precipMm ?? null,
    windKmh: data.windKmh ?? null,
  };
}

/**
 * Pure date math for the most recent COMPLETED travel leg — mirrors
 * EventTravelService's daysSinceArrival / arrivalDayTravelHours exactly
 * (0 = arrival day; hours only computed ON the arrival day itself).
 */
function travelFieldsFromLeg(leg, now) {
  if (!leg) {
    return { acclimatizationDay: null, arrivalDayTravelHours: null };
  }
  const daysSinceArrival = Math.floor(
    (now.getTime() - new Date(leg.arrive_at).getTime()) / 86_400_000,
  );
  const arrivalDayTravelHours =
    daysSinceArrival === 0
      ? Math.round(
          (new Date(leg.arrive_at).getTime() -
            new Date(leg.depart_at).getTime()) /
            3_600_000,
        )
      : null;
  return { acclimatizationDay: daysSinceArrival, arrivalDayTravelHours };
}

/**
 * Acclimatization/arrival-day inputs from the most recent COMPLETED travel leg
 * (arrive_at in the past).
 */
async function resolveTravel(userId, now) {
  const { data, error } = await supabaseAdmin
    .from("athlete_travel_log")
    .select("depart_at, arrive_at")
    .eq("user_id", userId)
    .lte("arrive_at", now.toISOString())
    .order("arrive_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) {
    return { acclimatizationDay: null, arrivalDayTravelHours: null };
  }
  return travelFieldsFromLeg(data, now);
}

/** The curated taper_rules tournament-level vocabulary. */
const TAPER_LEVELS = [
  "local",
  "regional",
  "national",
  "international",
  "world",
];

/**
 * Live-source layer of the two-layer taper model. Reads the active `taper_rules`
 * and materializes them into the SAME normalized TaperRuleset shape the engine's
 * embedded default uses — so the engine runs on one schema and never touches raw
 * DB rows. Returns null (→ engine falls back to EMBEDDED_TAPER_RULES) when the
 * table is unreachable or does not cover the full curated vocabulary, so a
 * partial/absent live policy can never silently weaken the taper.
 * @returns {Promise<null | import("../../angular/src/app/core/models/prescription.models").TaperRuleset>}
 */
async function resolveTaperRuleset(supabase) {
  try {
    const { data, error } = await supabase
      .from("taper_rules")
      .select(
        "tournament_level, volume_floor_pct, intensity_retention, taper_days, version, is_active",
      )
      .eq("is_active", true);
    if (error || !Array.isArray(data) || data.length === 0) {
      return null;
    }
    /** @type {Record<string, {volumeFloorPct:number,intensityRetention:number,taperDays:number}>} */
    const byLevel = {};
    let version = null;
    for (const r of data) {
      if (!TAPER_LEVELS.includes(r.tournament_level)) {
        continue;
      }
      const floor = Number(r.volume_floor_pct);
      const retention = Number(r.intensity_retention);
      const days = Number(r.taper_days);
      // Reject any malformed row → fall back to embedded (never a bad number).
      if (
        !(floor > 0 && floor <= 1) ||
        !(retention >= 0.5 && retention <= 1) ||
        !(days > 0)
      ) {
        return null;
      }
      byLevel[r.tournament_level] = {
        volumeFloorPct: floor,
        intensityRetention: retention,
        taperDays: days,
      };
      version ??= r.version ?? null;
    }
    // Require the FULL curated vocabulary — no partial policy reaches the engine.
    if (!TAPER_LEVELS.every((lvl) => byLevel[lvl])) {
      return null;
    }
    return {
      version: version ?? "live",
      source: "live",
      byLevel:
        /** @type {import("../../angular/src/app/core/models/prescription.models").TaperRuleset["byLevel"]} */ (
          byLevel
        ),
    };
  } catch {
    return null;
  }
}

async function assemblePeriodizationInputs(userId, now) {
  const dayStr = now.toISOString().slice(0, 10);
  const recentSince = new Date(now.getTime() - 4 * 86_400_000).toISOString();

  const [
    scheduleResult,
    readinessRow,
    userRow,
    configRow,
    recentSessionsRes,
    activeInjuries,
    weather,
    travel,
    taperRuleset,
  ] = await Promise.all([
    getScheduleSnapshot(supabaseAdmin, userId, {
      from: new Date(now.getTime() - DEFAULT_LOOKBACK_DAYS * 86_400_000),
      to: new Date(now.getTime() + DEFAULT_LOOKAHEAD_DAYS * 86_400_000),
      now,
    }),
    supabaseAdmin
      .from("readiness_scores")
      .select("score, acwr")
      .eq("user_id", userId)
      .order("day", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("users")
      .select("weight_kg, date_of_birth, birth_date")
      .eq("id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("athlete_training_config")
      .select("primary_position, team_training_days, season_calendar")
      .eq("user_id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("training_sessions")
      .select("session_type, drill_type, completed_at, rpe")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .gte("completed_at", recentSince)
      .order("completed_at", { ascending: false }),
    getActiveInjuries(userId, dayStr),
    resolveWeather(userId),
    resolveTravel(userId, now),
    resolveTaperRuleset(supabaseAdmin),
  ]);

  if (scheduleResult.error) {
    return { error: scheduleResult.error };
  }
  const snap = scheduleResult.snapshot;

  const recurringDays = Array.isArray(configRow.data?.team_training_days?.days)
    ? configRow.data.team_training_days.days.filter(
        (n) => Number.isInteger(n) && n >= 0 && n <= 6,
      )
    : [];
  const seasonCalendar = Array.isArray(configRow.data?.season_calendar)
    ? configRow.data.season_calendar
    : [];

  const weightKg =
    typeof userRow.data?.weight_kg === "number" &&
    userRow.data.weight_kg > 30 &&
    userRow.data.weight_kg < 200
      ? userRow.data.weight_kg
      : null;

  const recentSessions = (recentSessionsRes.data ?? []).map((r) => ({
    at: r.completed_at,
    type: r.session_type || r.drill_type || "",
    rpe: typeof r.rpe === "number" ? r.rpe : null,
  }));

  const acwrVal =
    typeof readinessRow.data?.acwr === "number" ? readinessRow.data.acwr : null;
  const readinessVal =
    typeof readinessRow.data?.score === "number"
      ? readinessRow.data.score
      : null;
  const ageYears = resolveAgeYears(
    userRow.data?.date_of_birth ?? userRow.data?.birth_date ?? null,
  );
  const position = configRow.data?.primary_position ?? null;
  const restrictions = resolveActiveRestrictions(activeInjuries);
  const density14d = snap.density14d
    ? {
        totalGames: snap.density14d.totalGames,
        hasPeakImportance: snap.density14d.hasPeakImportance,
        peakDayGameCount: snap.density14d.peakDayGameCount,
      }
    : null;

  // Assemble the 7-day input window and hand it to the SHARED engine planWeek()
  // (the identical function the client runs), which owns the week-level passes —
  // schedule-aware intent hints, the ≥2 rest-day minimum, and the PM second
  // sessions — that a single-day computation cannot. This is what guarantees the
  // server's day 0 equals the client's `today`; the two can no longer drift.
  // Day-0-only acute signals (ACWR/readiness/weather/arrival) are null for future
  // days. Per-day phase uses resolvePhase (day 0 keeps the canonical
  // snap.currentPhase, matching the client's day-0 convention). Each object literal
  // is still type-checked against PeriodizationInputs (checkJs → the .ts source).
  /** @type {import("../../angular/src/app/core/models/prescription.models").PeriodizationInputs[]} */
  const dayInputs = [];
  /** @type {boolean[]} */
  const teamPracticeFlags = [];
  /** @type {import("../../angular/src/app/core/models/schedule.models").CompetitionPhase[]} */
  const phases7 = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const phase =
      /** @type {import("../../angular/src/app/core/models/schedule.models").CompetitionPhase} */ (
        i === 0
          ? snap.currentPhase
          : resolvePhase(d, snap.upcoming, snap.lastEvent)
      );
    const isPractice = isTeamPractice(d, recurringDays, snap.trainingDays);
    teamPracticeFlags.push(isPractice);
    phases7.push(phase);
    dayInputs.push({
      date: d,
      phase,
      upcoming: snap.upcoming,
      lastEvent: snap.lastEvent,
      acwr: i === 0 ? acwrVal : null,
      readiness: i === 0 ? readinessVal : null,
      bodyweightKg: weightKg,
      density14d,
      seasonPhase: macroPhaseFor(d, seasonCalendar),
      weather: i === 0 ? weather : null,
      recentSessions,
      ageYears,
      position,
      isTeamPractice: isPractice,
      activeRestrictions: restrictions,
      acclimatizationDay:
        travel.acclimatizationDay === null
          ? null
          : travel.acclimatizationDay + i,
      arrivalDayTravelHours: i === 0 ? travel.arrivalDayTravelHours : null,
      coachOverride: false,
      // Two-layer taper: hand the engine the live-hydrated ruleset when present,
      // else null → the engine uses its embedded default. Same object all 7 days.
      taperRuleset,
    });
  }

  return {
    error: null,
    dayInputs,
    teamPracticeFlags,
    phases7,
    todayReadiness: readinessVal,
    todayAcwr: acwrVal,
    taperPolicy: {
      version: (taperRuleset ?? EMBEDDED_TAPER_RULES).version,
      source: (taperRuleset ?? EMBEDDED_TAPER_RULES).source,
    },
  };
}

async function handleRequest(event, _context, { userId }) {
  const params = event.queryStringParameters ?? {};
  const now = params.date ? new Date(`${params.date}T12:00:00Z`) : new Date();
  if (Number.isNaN(now.getTime())) {
    return createErrorResponse(
      "Invalid date parameter",
      422,
      "validation_error",
    );
  }

  const {
    error,
    dayInputs,
    teamPracticeFlags,
    phases7,
    todayReadiness,
    todayAcwr,
    taperPolicy,
  } = await assemblePeriodizationInputs(userId, now);
  if (error) {
    logger.error(
      "periodization_prescription_assembly_failed",
      { userId },
      error,
    );
    return createErrorResponse(
      "Failed to assemble prescription inputs",
      500,
      "server_error",
    );
  }

  // The SAME shared engine planWeek() the client runs — so the server's day 0 is
  // identical to the client's `today` (single source; the drift canary verifies).
  /** @type {import("../../angular/src/app/core/models/prescription.models").DailyPrescription[]} */
  const week = planWeek(
    dayInputs,
    teamPracticeFlags,
    phases7,
    todayReadiness,
    todayAcwr,
  );
  // Surface taper-policy provenance so the app "knows what is happening" —
  // whether the taper ran on the live ruleset or the embedded default.
  return createSuccessResponse({ prescription: week[0], taperPolicy });
}

export const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "periodization-prescription",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: handleRequest,
  });

export const __test__ = {
  resolveActiveRestrictions,
  resolveAgeYears,
  isTeamPractice,
  travelFieldsFromLeg,
  assemblePeriodizationInputs,
  resolveTaperRuleset,
};

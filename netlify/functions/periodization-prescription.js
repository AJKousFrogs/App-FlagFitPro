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
  DEFAULT_LOOKAHEAD_DAYS,
  DEFAULT_LOOKBACK_DAYS,
} from "./schedule.js";
import { getActiveInjuries } from "./utils/active-injuries.js";
import { ageFromDob } from "./utils/age.js";
import { resolveTeamHomeCity, getWeatherData } from "./weather.js";
import { prescribeFor, macroPhaseFor } from "./utils/periodization-engine.js";
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

  // Typed against the SAME interface the client engine's prescribeFor()
  // requires (reusability audit F4, 2026-07-08): TypeScript checks this object
  // literal's shape against PeriodizationInputs at build time (npm run
  // typecheck:functions) — if the interface gains/renames/removes a field,
  // this fails to compile instead of silently drifting at runtime. No .d.ts
  // generation step needed: `checkJs` resolves the type straight from the .ts
  // source via the import() path below.
  /** @type {import("../../angular/src/app/core/models/prescription.models").PeriodizationInputs} */
  const inputs = {
    date: now,
    // schedule.js's resolvePhase (see schedule-resolver-parity.test.js) always
    // returns one of the 6 CompetitionPhase literals — narrowing here since
    // schedule.js is outside this file's @ts-check scope, so its return type is
    // loosely inferred as `string` rather than the precise union.
    phase:
      /** @type {import("../../angular/src/app/core/models/schedule.models").CompetitionPhase} */ (
        snap.currentPhase
      ),
    upcoming: snap.upcoming,
    lastEvent: snap.lastEvent,
    acwr:
      typeof readinessRow.data?.acwr === "number"
        ? readinessRow.data.acwr
        : null,
    readiness:
      typeof readinessRow.data?.score === "number"
        ? readinessRow.data.score
        : null,
    bodyweightKg: weightKg,
    density14d: snap.density14d
      ? {
          totalGames: snap.density14d.totalGames,
          hasPeakImportance: snap.density14d.hasPeakImportance,
          peakDayGameCount: snap.density14d.peakDayGameCount,
        }
      : null,
    seasonPhase: macroPhaseFor(now, seasonCalendar),
    weather,
    recentSessions,
    ageYears: resolveAgeYears(
      userRow.data?.date_of_birth ?? userRow.data?.birth_date ?? null,
    ),
    position: configRow.data?.primary_position ?? null,
    isTeamPractice: isTeamPractice(now, recurringDays, snap.trainingDays),
    activeRestrictions: resolveActiveRestrictions(activeInjuries),
    acclimatizationDay: travel.acclimatizationDay,
    arrivalDayTravelHours: travel.arrivalDayTravelHours,
    coachOverride: false,
  };

  return { error: null, inputs };
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

  const { error, inputs } = await assemblePeriodizationInputs(userId, now);
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

  /** @type {import("../../angular/src/app/core/models/prescription.models").DailyPrescription} */
  const prescription = prescribeFor(inputs);
  return createSuccessResponse({ prescription });
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
};

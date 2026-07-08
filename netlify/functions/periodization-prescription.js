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
import { resolveTeamHomeCity, getWeatherData } from "./weather.js";
import { prescribeFor, macroPhaseFor } from "./utils/periodization-engine.js";

const logger = createLogger({ service: "netlify.periodization-prescription" });

const SPRINT_RESTRICTING = new Set([
  "sprint",
  "high_intensity",
  "plyometric",
  "agility",
]);
const THROWING_RESTRICTING = new Set(["throwing", "upper_strength"]);
const SEV_RANK = { minor: 1, moderate: 2, severe: 3 };

// athlete_injuries.injury_grade stores "Grade 1/2/3" (clinical) or the legacy
// minor/moderate/severe vocab — same mapping as utils/active-injuries.js's
// injuriesPainLevel, applied to the "minor"/"moderate"/"severe" domain instead.
function normalizeSeverity(grade) {
  const map = {
    "Grade 1": "minor",
    "Grade 2": "moderate",
    "Grade 3": "severe",
    minor: "minor",
    moderate: "moderate",
    severe: "severe",
  };
  return map[grade] ?? "minor";
}

/**
 * Mirrors the client's InjuryService.restrictions() computed exactly: which
 * restriction TYPES are active across all current injuries, and the worst
 * severity/region set among the ones that actually restrict sprint or throwing.
 */
function resolveActiveRestrictions(injuries) {
  const sprintInjuries = injuries.filter((i) =>
    (i.activity_restrictions ?? []).some((r) => SPRINT_RESTRICTING.has(r)),
  );
  const throwingInjuries = injuries.filter((i) =>
    (i.activity_restrictions ?? []).some((r) => THROWING_RESTRICTING.has(r)),
  );
  const restrictsSprint = sprintInjuries.length > 0;
  const restrictsThrowing = throwingInjuries.length > 0;
  if (!restrictsSprint && !restrictsThrowing) {
    return null;
  }
  const flagged = [...sprintInjuries, ...throwingInjuries];
  const regions = [
    ...new Set(flagged.map((i) => i.injury_location).filter(Boolean)),
  ];
  const severity = flagged.reduce((worst, i) => {
    const s = normalizeSeverity(i.injury_grade);
    return !worst || SEV_RANK[s] > SEV_RANK[worst] ? s : worst;
  }, null);
  return { restrictsSprint, restrictsThrowing, regions, severity };
}

function resolveAgeYears(dob) {
  if (!dob) {
    return null;
  }
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) {
    return null;
  }
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) {
    age -= 1;
  }
  return age >= 16 && age <= 80 ? age : null;
}

function isTeamPractice(date, recurringDays, scheduleTrainingDays) {
  if (recurringDays.includes(date.getDay())) {
    return true;
  }
  const iso = date.toISOString().slice(0, 10);
  return scheduleTrainingDays.includes(iso);
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

  return {
    error: null,
    inputs: {
      date: now,
      phase: snap.currentPhase,
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
  normalizeSeverity,
  travelFieldsFromLeg,
  assemblePeriodizationInputs,
};

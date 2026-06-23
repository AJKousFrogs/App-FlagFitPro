import { supabaseAdmin } from "./supabase-client.js";
import { createSuccessResponse, createErrorResponse, handleValidationError } from "./utils/error-handler.js";
import { detectACWRTrigger } from "./utils/safety-override.js";
import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { hasAnyRole, LOAD_MANAGEMENT_ACCESS_ROLES } from "./utils/role-sets.js";
import { sharesStaffedTeam } from "./utils/team-scope.js";
import { tryParseJsonObjectBody, isFiniteNumber } from "./utils/input-validator.js";
import {
  buildRequestLogContext,
  createLogger,
} from "./utils/structured-logger.js";
import { computeAcwrAt } from "./utils/acwr.js";

// Netlify Function: Calculate Readiness Score
// Evidence-based readiness scoring combining session-RPE, ACWR, wellness, and game proximity
// Endpoint: /api/calc-readiness

const logger = createLogger({ service: "netlify.calc-readiness" });

// Note: authenticateRequest, applyRateLimit are handled by baseHandler

/**
 * Bounded readiness penalty (points off the 0–100 composite) for long seated
 * travel today — a drive/journey to a tournament arrives the body stiff,
 * dehydrated and under-slept. Conservative calibration starting points; only
 * ever LOWERS readiness (never raises it). Tune against team history.
 *   1–2h → −2 · 3–5h → −4 · ≥6h → −8
 */
function travelReadinessPenalty(hours) {
  const h = Number(hours);
  if (!Number.isFinite(h) || h <= 0) {
    return 0;
  }
  if (h >= 6) {
    return 8;
  }
  if (h >= 3) {
    return 4;
  }
  return 2;
}

// Per-game internal load (session-RPE AU) by GAME FORMAT. MIRROR of GAME_FORMATS
// in angular/src/app/core/config/position-volume.config.ts (keep in sync). A
// flag-football game is high-intensity intermittent; the heavier the format, the
// higher the single-game load. Injected into the ACWR load map for PAST games so
// a tournament's acute load (and ACWR) RISES instead of reading falsely safe.
const GAME_LOAD_AU = {
  domestic_2x12_stop: 300,
  running_2x15: 350,
  ifaf_2x20: 450,
};

/**
 * Resolve a game's internal load from its format, else its competition level,
 * else the heaviest format — an unknown game is never UNDER-counted (the safe
 * direction). Mirrors resolveGameFormat() in the client config.
 */
function gameLoadAuFor(gameFormat, competitionLevel) {
  if (gameFormat && GAME_LOAD_AU[gameFormat]) {
    return GAME_LOAD_AU[gameFormat];
  }
  const lvl = String(competitionLevel || "").toLowerCase();
  if (lvl === "international") {
    return GAME_LOAD_AU.ifaf_2x20;
  }
  if (lvl === "national" || lvl === "club") {
    return GAME_LOAD_AU.domestic_2x12_stop;
  }
  return GAME_LOAD_AU.ifaf_2x20; // unknown → heaviest (conservative)
}

/**
 * Build a daily estimated-load Map for PAST games in [startDate, endDate]. Pure
 * (no I/O) so it is unit-testable. Each game's load scales with its FORMAT/level;
 * a multi-day event's total game load is spread evenly across its calendar days
 * within the window. Only events carrying a positive expected_game_count count.
 * dateKey = 'YYYY-MM-DD'.
 */
function estimateGameLoads(events, startDate, endDate) {
  const out = new Map();
  for (const ev of events || []) {
    const games = Number(ev?.expected_game_count);
    if (!Number.isFinite(games) || games <= 0 || !ev.starts_at) {
      continue;
    }
    const perGame = gameLoadAuFor(ev.game_format, ev.competition_level);
    const start = new Date(ev.starts_at);
    const end = ev.ends_at ? new Date(ev.ends_at) : start;
    if (Number.isNaN(start.getTime())) {
      continue;
    }
    const days = [];
    const cur = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
    );
    const last = Number.isNaN(end.getTime())
      ? cur
      : new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
    let guard = 0;
    while (cur <= last && guard < 31) {
      const key = cur.toISOString().slice(0, 10);
      if (key >= startDate && key <= endDate) {
        days.push(key);
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
      guard += 1;
    }
    if (days.length === 0) {
      continue;
    }
    const perDay = (games * perGame) / days.length;
    for (const key of days) {
      out.set(key, (out.get(key) || 0) + perDay);
    }
  }
  return out;
}

/** Read PAST games from the schedule spine and estimate their daily load. Fails
 * safe (empty map) if the spine view is unavailable. */
async function fetchPastGameLoads(athleteId, startDate, endDate) {
  try {
    const { data, error } = await supabaseAdmin
      .from("v_athlete_schedule")
      .select("starts_at, ends_at, expected_game_count, competition_level")
      .eq("user_id", athleteId)
      .gte("starts_at", startDate)
      .lte("starts_at", `${endDate}T23:59:59`)
      .neq("status", "cancelled");
    if (error || !Array.isArray(data)) {
      return new Map();
    }
    return estimateGameLoads(data, startDate, endDate);
  } catch {
    return new Map();
  }
}

/**
 * Calculate readiness score for an athlete
 * Evidence-based composite score (0-100) combining:
 * - Workload (ACWR from session-RPE): 35%
 * - Wellness Index (sleep, soreness, energy, mood, stress): 30%
 * - Sleep quality/duration: 20%
 * - Game proximity: 15%
 *
 * Evidence Base:
 * - Strong links between sleep and readiness (Halson 2014, Fullagar et al. 2015)
 * - Wellness scores predict perceived performance (Saw et al. 2016)
 * - Team-sport contexts show stronger associations with self-reported wellness (McLellan et al. 2011)
 * - Simple sleep metrics can proxy broader wellness when resources are limited (Saw et al. 2016)
 *
 * Cut-Points (Starting Points - Require Team Calibration):
 * - < 55: Low readiness → Deload
 * - 55-75: Moderate readiness → Maintain
 * - > 75: High readiness → Push
 *
 * These thresholds are starting points. Teams should calibrate using their own
 * injury/performance history over time for optimal accuracy.
 */

/**
 * Convert 1-10 scale to 1-5 scale (standard athlete monitoring scale)
 */
function scaleTo1to5(value) {
  if (value === null || value === undefined) {
    return null;
  }
  // Map 1-10 to 1-5: 1-2→1, 3-4→2, 5-6→3, 7-8→4, 9-10→5
  return Math.ceil(value / 2);
}

/**
 * Calculate wellness index subscore (0-100)
 * Modeled on common athlete monitoring scales using 1-5 ratings
 */
function calculateWellnessIndex(wellness) {
  // Convert to 1-5 scale
  const sleepQuality = scaleTo1to5(wellness.sleep_quality);
  const soreness = scaleTo1to5(wellness.soreness);
  const energy = scaleTo1to5(wellness.energy);
  const mood = scaleTo1to5(wellness.mood);
  const stress = scaleTo1to5(wellness.stress);

  // Required fields. The phantom 'fatigue' is removed (D11): it had no column and
  // always equalled soreness, so soreness carried 65% of this subscore. ENERGY is
  // the real recovery/fatigue signal (energy_level) and is promoted to required.
  const requiredFields = [
    { value: sleepQuality, weight: 0.4, name: "sleepQuality" },
    { value: soreness, weight: 0.3, name: "soreness" },
    { value: energy, weight: 0.3, name: "energy" },
  ];

  // Optional fields (mood, stress)
  const optionalFields = [
    { value: mood, weight: 0.5, name: "mood" },
    { value: stress, weight: 0.5, name: "stress" },
  ];

  // Calculate completeness
  const requiredCount = requiredFields.filter((f) => f.value !== null).length;
  const optionalCount = optionalFields.filter((f) => f.value !== null).length;
  const totalFields = requiredFields.length + optionalFields.length;
  const availableFields = requiredCount + optionalCount;
  const completeness = (availableFields / totalFields) * 100;

  // Calculate subscore from required fields (always available). Invert soreness
  // (higher = worse); sleepQuality and energy are higher = better.
  let requiredSubscore = 0;
  let requiredWeightSum = 0;

  requiredFields.forEach((field) => {
    if (field.value !== null) {
      let normalizedValue;
      if (field.name === "soreness") {
        // Invert: 1 (best) → 100, 5 (worst) → 20
        normalizedValue = 100 - (field.value - 1) * 20;
      } else {
        // Sleep quality: 1 (worst) → 20, 5 (best) → 100
        normalizedValue = 20 + (field.value - 1) * 20;
      }
      requiredSubscore += normalizedValue * field.weight;
      requiredWeightSum += field.weight;
    }
  });

  // Add optional fields if available
  let optionalSubscore = 0;
  let optionalWeightSum = 0;

  optionalFields.forEach((field) => {
    if (field.value !== null) {
      let normalizedValue;
      if (field.name === "stress") {
        // Invert stress: 1 (no stress) → 100, 5 (very stressed) → 20
        normalizedValue = 100 - (field.value - 1) * 20;
      } else {
        // Mood and energy: 1 (worst) → 20, 5 (best) → 100
        normalizedValue = 20 + (field.value - 1) * 20;
      }
      optionalSubscore += normalizedValue * field.weight;
      optionalWeightSum += field.weight;
    }
  });

  // Calculate final subscore
  // If optional fields available, blend them; otherwise use required only
  let subscore;
  if (requiredWeightSum === 0 && optionalWeightSum === 0) {
    subscore = null;
  } else if (requiredWeightSum === 0) {
    subscore = optionalSubscore / optionalWeightSum;
  } else if (optionalWeightSum > 0) {
    // Blend required (60%) and optional (40%)
    const requiredScore = requiredSubscore / requiredWeightSum;
    const optionalScore = optionalSubscore / optionalWeightSum;
    subscore = requiredScore * 0.6 + optionalScore * 0.4;
  } else {
    // Use required fields only
    subscore = requiredSubscore / requiredWeightSum;
  }

  return {
    sleepQuality: sleepQuality || null,
    soreness: soreness || null,
    mood: mood || null,
    stress: stress || null,
    energy: energy || null,
    subscore: Math.round(subscore),
    completeness: Math.round(completeness),
  };
}

/**
 * Determine data mode based on wellness completeness
 */
function determineDataMode(wellnessIndex, threshold = 60) {
  if (wellnessIndex.completeness >= threshold) {
    return "full";
  }
  return "reduced"; // Use sleep-proxy mode
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidAthleteId(value) {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 128) {
    return false;
  }
  return /^[A-Za-z0-9_-]+$/.test(trimmed);
}

function isOptionalSchemaError(error) {
  const code = error?.code;
  const message = `${error?.message || ""}`.toLowerCase();
  return (
    ["PGRST106", "PGRST116", "PGRST204", "42P01", "42703"].includes(code) ||
    message.includes("relation") ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("column")
  );
}

async function fetchTrainingSessions(athleteId, startDate, endDate) {
  // training_sessions is keyed user_id after the v11 identity standardization.
  return supabaseAdmin
    .from("training_sessions")
    .select("session_date, duration_minutes, rpe, workload, intensity_level")
    .eq("user_id", athleteId)
    .gte("session_date", startDate)
    .lte("session_date", endDate)
    .order("session_date", { ascending: false });
}

async function fetchWellnessForReadiness(athleteId, dayStr) {
  const primary = await supabaseAdmin
    .from("daily_wellness_checkin")
    .select("*")
    .eq("user_id", athleteId)
    .eq("checkin_date", dayStr)
    .maybeSingle();

  if (!primary.error || primary.error.code === "PGRST116") {
    if (!primary.data) {
      return primary;
    }
    return {
      data: {
        ...primary.data,
        // No 'fatigue' column exists — the old 'fatigue ?? muscle_soreness'
        // fallback made fatigue ALWAYS equal soreness, double-counting it (D11).
        // energy_level is the real recovery/fatigue signal and is mapped below.
        sleep_quality: primary.data.sleep_quality,
        soreness: primary.data.muscle_soreness,
        mood: primary.data.mood,
        stress: primary.data.stress_level,
        energy: primary.data.energy_level,
      },
      error: null,
    };
  }

  // daily_wellness_checkin is canonical (wellness consolidation Phase 3) — no legacy fallback.
  return primary;
}

async function fetchNextGame(targetDate, athleteId) {
  // v11 canonical source: the schedule spine (union across active team memberships).
  // No legacy `fixtures` fallback — the spine is the single source for next-event proximity.
  const spineQuery = await supabaseAdmin
    .from("v_athlete_schedule")
    .select("starts_at, importance, expected_game_count")
    .eq("user_id", athleteId)
    .gte("starts_at", targetDate.toISOString())
    .neq("status", "cancelled")
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (spineQuery.error && spineQuery.error.code !== "PGRST116") {
    // Spine view unavailable (e.g. not deployed in an older env) — degrade to
    // "no upcoming game" rather than reading the retired legacy `fixtures` table.
    return {
      data: null,
      error: isOptionalSchemaError(spineQuery.error) ? null : spineQuery.error,
    };
  }

  if (!spineQuery.data) {
    return { data: null, error: null };
  }

  return {
    data: {
      game_start: spineQuery.data.starts_at,
      importance: spineQuery.data.importance,
      expected_game_count: spineQuery.data.expected_game_count,
    },
    error: null,
  };
}

async function persistReadinessScore(payload) {
  // readiness_scores is keyed (user_id, day) after the v11 identity collapse.
  return supabaseAdmin.from("readiness_scores").upsert(payload, {
    onConflict: "user_id,day",
  });
}

async function verifyAthleteAccess(requestUserId, athleteId) {
  if (athleteId === requestUserId) {
    return { authorized: true };
  }

  const role = await getUserRole(requestUserId);
  if (!hasAnyRole(role, LOAD_MANAGEMENT_ACCESS_ROLES)) {
    return {
      authorized: false,
      message: "Not authorized to calculate readiness for another athlete",
    };
  }

  // Staff may read another athlete only when they share an active team —
  // checked across ALL memberships (multi-team safe; the old limit(1) check
  // picked an arbitrary team and could wrongly authorise or deny).
  const { shared } = await sharesStaffedTeam(requestUserId, athleteId, {
    roles: LOAD_MANAGEMENT_ACCESS_ROLES,
  });
  if (!shared) {
    return {
      authorized: false,
      message: "Not authorized to access athletes outside your team",
    };
  }

  return { authorized: true };
}

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "calc-readiness",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "CREATE",
    requireAuth: true, // SECURITY: Explicit auth for readiness calculation
    skipEnvCheck: true,
    handler: async (event, _context, { userId, requestId, correlationId }) => {
      const requestLogger = logger.child(
        buildRequestLogContext(event, {
          function_name: "calc-readiness",
          user_id: userId,
          request_id: requestId,
          correlation_id: correlationId,
          trace_id: correlationId,
        }),
      );
      requestLogger.info("readiness_calculation_started", {
        body_length: event.body?.length,
      });

      let body = {};
      if (event.httpMethod === "POST") {
        const parsedBody = tryParseJsonObjectBody(event.body);
        if (!parsedBody.ok) {
          return parsedBody.error;
        }
        body = parsedBody.data;
        requestLogger.debug("readiness_request_body_parsed", {
          body,
        });

        if (!isPlainObject(body)) {
          return handleValidationError("Request body must be an object");
        }
      } else {
        body = {
          athleteId: event.queryStringParameters?.athleteId,
          day: event.queryStringParameters?.day,
        };
        requestLogger.debug("readiness_query_params_parsed", {
          body,
        });
      }

      // If athleteId not provided, use authenticated user's ID
      const { athleteId = userId, day } = body;

      requestLogger.debug("readiness_request_validated", {
        athleteId,
        day,
        userId,
      });

      if (!athleteId) {
        return handleValidationError("athleteId is required");
      }

      if (!isValidAthleteId(athleteId)) {
        return handleValidationError(
          "athleteId must be a non-empty alphanumeric identifier",
        );
      }

      if (day !== undefined && day !== null && typeof day !== "string") {
        return handleValidationError("day must be a valid date string");
      }

      const targetDate = day ? new Date(day) : new Date();
      if (Number.isNaN(targetDate.getTime())) {
        return handleValidationError("day must be a valid date string");
      }

      const dayStr = targetDate.toISOString().slice(0, 10);
      requestLogger.debug("readiness_target_date_resolved", {
        athlete_id: athleteId,
        day: dayStr,
      });

      const access = await verifyAthleteAccess(userId, athleteId);
      if (!access.authorized) {
        return createErrorResponse(access.message, 403, "authorization_error");
      }

      // 1) Load training sessions for ACWR calculation (session-RPE: RPE × minutes)
      // Fetch 28 days so the uncoupled chronic window (21d) + acute window (7d) are covered.
      const startChronic = new Date(targetDate);
      startChronic.setDate(startChronic.getDate() - 27); // 28 days inclusive

      // Get sessions from training_sessions table
      // Include both rpe and intensity_level (fallback for RPE)
      // Note: athlete_id is the canonical user reference column (NOT NULL)
      // Use session_date as the standardized date column
      requestLogger.debug("readiness_training_sessions_fetch_started", {
        athleteId,
        startChronic: startChronic.toISOString().slice(0, 10),
        endDate: dayStr,
      });

      // Query training_sessions - handle both user_id (new) and athlete_id (legacy) columns
      const { data: sessions, error: sessErr } = await fetchTrainingSessions(
        athleteId,
        startChronic.toISOString().slice(0, 10),
        dayStr,
      );

      if (sessErr) {
        requestLogger.error("readiness_training_sessions_fetch_failed", sessErr, {
          athlete_id: athleteId,
          start_date: startChronic.toISOString().slice(0, 10),
          end_date: dayStr,
        });
        if (!isOptionalSchemaError(sessErr)) {
          return createErrorResponse(
            `Failed to fetch sessions: ${sessErr.message}`,
            500,
            "database_error",
          );
        }
        requestLogger.warn("readiness_training_history_unavailable", {
          athlete_id: athleteId,
          fallback_mode: "wellness_only",
        });
      }

      requestLogger.debug("readiness_training_sessions_fetch_completed", {
        athlete_id: athleteId,
        session_count: sessions?.length || 0,
      });

      // Calculate daily loads (session-RPE = RPE × duration)
      // Use rpe if available, fallback to intensity_level (assuming 1-10 scale maps to RPE)
      // Handle empty sessions gracefully (no crash, degrade to wellness-only scoring)
      const loadsByDay = new Map();

      if (sessions && sessions.length > 0) {
        for (const s of sessions) {
          const sessionDate = s.session_date;
          const duration = s.duration_minutes;
          // Use rpe if available, otherwise use intensity_level as fallback
          const rpe =
            s.rpe !== null && s.rpe !== undefined
              ? s.rpe
              : s.intensity_level || 0;

          if (!duration || !sessionDate) {
            continue;
          }
          if (rpe === 0 || rpe === null) {
            continue;
          } // Skip if no RPE/intensity data

          const load = duration * rpe; // session-RPE
          const key = sessionDate;
          loadsByDay.set(key, (loadsByDay.get(key) || 0) + load);
        }
      }

      // Inject estimated load for PAST games so a tournament's acute load (and
      // ACWR) rises instead of reading falsely safe — games usually aren't
      // logged as training sessions. Per game day take MAX(logged, game estimate):
      // a day the athlete logged separately keeps its (higher) real load, while a
      // game day with no/low logged load gets at least the game estimate. This
      // never LOWERS a day's load (safe direction).
      const gameLoads = await fetchPastGameLoads(
        athleteId,
        startChronic.toISOString().slice(0, 10),
        dayStr,
      );
      for (const [key, gameLoad] of gameLoads) {
        loadsByDay.set(key, Math.max(loadsByDay.get(key) || 0, gameLoad));
      }

      // Canonical EWMA + uncoupled ACWR (single source of truth in utils/acwr.js).
      // EWMA is more sensitive than rolling averages (Williams 2017); the uncoupled
      // window avoids the spurious correlation of coupled ACWR (Lolli 2017).
      const acwrResult = computeAcwrAt(loadsByDay, targetDate);
      const acuteLoad = acwrResult.acuteLoad;
      const chronicLoad = acwrResult.chronicLoad;
      // Do NOT coerce a null ACWR to 0 (S3): a new athlete / insufficient chronic
      // data correctly returns null, and 0 would (a) fire the <0.7 undertraining
      // penalty and (b) trip the acwr<0.8 safety override on day one — both false.
      const acwr = acwrResult.acwr;
      const hasAcwr = isFiniteNumber(acwr);

      // 2) Get wellness log for the day
      requestLogger.debug("readiness_wellness_fetch_started", {
        athleteId,
        dayStr,
      });

      // Query wellness_logs - handle both user_id (new) and athlete_id (legacy) columns
      const { data: wellness, error: wellErr } =
        await fetchWellnessForReadiness(athleteId, dayStr);

      if (wellErr) {
        requestLogger.error("readiness_wellness_fetch_failed", wellErr, {
          athlete_id: athleteId,
          day: dayStr,
        });
        if (!isOptionalSchemaError(wellErr)) {
          return createErrorResponse(
            `Failed to fetch wellness log: ${wellErr.message}`,
            500,
            "database_error",
          );
        }
        return createSuccessResponse({
          score: null,
          level: null,
          suggestion: "log_wellness",
          acwr: null,
          acuteLoad: null,
          chronicLoad: null,
          dataMode: "unavailable",
          wellnessIndex: null,
          componentScores: null,
          message:
            "Wellness data is unavailable in this environment. Please try again later or contact support.",
          missingData: ["wellness_log"],
        });
      }

      if (!wellness) {
        requestLogger.info("readiness_wellness_missing", {
          athlete_id: athleteId,
          day: dayStr,
        });
        // Return a graceful response with null score instead of error
        // This allows the frontend to handle missing wellness data gracefully
        return createSuccessResponse({
          score: null,
          level: null,
          suggestion: "log_wellness",
          acwr: null,
          acuteLoad: null,
          chronicLoad: null,
          dataMode: "unavailable",
          wellnessIndex: null,
          componentScores: null,
          message:
            "No wellness log for today. Please log your wellness data to calculate readiness.",
          missingData: ["wellness_log"],
        });
      }

      // Calculate wellness index (1-5 scale, modeled on common athlete monitoring scales)
      const wellnessIndex = calculateWellnessIndex(wellness);

      // Determine data mode (full vs reduced)
      const dataMode = determineDataMode(wellnessIndex, 60); // 60% completeness threshold

      // 3) Get next fixture (game proximity)
      const { data: nextGame } = await fetchNextGame(targetDate, athleteId);

      let gameProximityHours = 999;
      if (nextGame?.game_start) {
        const gameDate = new Date(nextGame.game_start);
        gameProximityHours =
          (gameDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60);
      }

      // 4) Evidence-informed scoring with team-sport optimized weightings

      // Workload score (ACWR-based)
      // Literature flags >1.5 as high risk, ~0.8-1.3 safer range (Gabbett 2016)
      // Only score workload when ACWR is known; when null its weight is
      // redistributed below (so an unknown load never penalises or flatters).
      let workloadScore = 100;
      if (hasAcwr) {
        if (acwr > 1.8) {
          workloadScore -= 40;
        } else if (acwr > 1.5) {
          workloadScore -= 30;
        } else if (acwr > 1.3) {
          workloadScore -= 15;
        } else if (acwr < 0.7) {
          workloadScore -= 10;
        }
      }

      // Wellness Index score (using calculated subscore)
      // Modeled on common athlete monitoring scales (1-5 ratings)
      // Strong associations with perceived performance in team-sport contexts (Saw et al. 2016)
      const wellnessScore = isFiniteNumber(wellnessIndex.subscore)
        ? wellnessIndex.subscore
        : 60;

      // Sleep score
      // Strong evidence base: sleep duration/quality strongly linked to readiness
      // (Halson 2014, Fullagar et al. 2015)
      let sleepScore = 100;
      if (isFiniteNumber(wellness.sleep_quality) && wellness.sleep_quality <= 4) {
        sleepScore -= 25;
      } else if (
        isFiniteNumber(wellness.sleep_quality) &&
        wellness.sleep_quality <= 6
      ) {
        sleepScore -= 15;
      }
      if (isFiniteNumber(wellness.sleep_hours) && wellness.sleep_hours < 6) {
        sleepScore -= 10;
      } else if (
        isFiniteNumber(wellness.sleep_hours) &&
        wellness.sleep_hours < 7
      ) {
        sleepScore -= 5;
      }

      // Game proximity score
      // Post-match metrics worst 1-2 days after, improve by day 3-4
      let proximityScore = 100;
      if (gameProximityHours <= 24) {
        proximityScore -= 25;
      } else if (gameProximityHours <= 48) {
        proximityScore -= 15;
      } else if (gameProximityHours <= 72) {
        proximityScore -= 5;
      }

      // Team-sport optimized weightings (evidence-based adjustments)
      // Increased wellness/sleep influence based on team-sport research
      let workloadWeight = 0.35; // Reduced from 0.40
      let wellnessWeight = 0.3; // Increased from 0.25
      let sleepWeight = 0.2; // Maintained (strong evidence)
      let proximityWeight = 0.15; // Maintained

      // No ACWR yet (new athlete / insufficient chronic data): drop the workload
      // component and redistribute its weight proportionally to the others, so the
      // composite reflects only what's actually known (mirrors the reduced-data
      // path). Without this, a null ACWR scored as 100×0.35 silently inflates the
      // result for an athlete we know nothing about.
      if (!hasAcwr) {
        const others = wellnessWeight + sleepWeight + proximityWeight;
        wellnessWeight += workloadWeight * (wellnessWeight / others);
        sleepWeight += workloadWeight * (sleepWeight / others);
        proximityWeight += workloadWeight * (proximityWeight / others);
        workloadWeight = 0;
      }

      // Reduced data mode: Increase sleep weight when wellness completeness is low
      // Sleep can proxy broader wellness when resources are limited (Saw et al. 2016)
      if (dataMode === "reduced") {
        const sleepMultiplier = 1.5; // Increase sleep weight by 50%
        const additionalSleepWeight = sleepWeight * (sleepMultiplier - 1);

        // Redistribute weights proportionally
        const totalOtherWeights =
          workloadWeight + wellnessWeight + proximityWeight;
        const reductionFactor = 1 - additionalSleepWeight / totalOtherWeights;

        workloadWeight *= reductionFactor;
        wellnessWeight *= reductionFactor;
        proximityWeight *= reductionFactor;
        sleepWeight *= sleepMultiplier;
      }

      // Weighted composite score
      const rawScore =
        workloadScore * workloadWeight +
        wellnessScore * wellnessWeight +
        sleepScore * sleepWeight +
        proximityScore * proximityWeight;

      // Travel fatigue penalty — a long seated journey today (e.g. an 8h drive
      // to a tournament) lowers readiness. Only ever SUBTRACTS (safe direction),
      // nudging Push → Maintain/Deload for a just-arrived, fatigued athlete.
      const travelPenalty = travelReadinessPenalty(wellness.travel_hours);

      // Active injury/tightness penalty — self-reported or clinical.
      // "High — push" must never be returned when an athlete has moderate/severe
      // active injuries; the prescription engine already enforces recovery-only
      // focus, but the readiness NUMBER must reflect reality too.
      // Penalties: severe/Grade 3 = −20 + cap at moderate; moderate/Grade 2 = −10;
      // minor/Grade 1 = −5. Non-fatal: if the query fails we skip the penalty.
      let injuryPenalty = 0;
      let injuryForcedModerate = false; // true → cap level at "moderate" max
      try {
        const { data: injuryRows } = await supabaseAdmin
          .from("athlete_injuries")
          .select("injury_grade, recovery_status, injury_mechanism, expected_return_date")
          .eq("user_id", athleteId)
          .in("recovery_status", ["active", "recovering", "rehab"]);
        for (const inj of injuryRows || []) {
          // Skip expired self-reports (clinical injuries have no expiry)
          if (
            inj.injury_mechanism === "self_report" &&
            inj.expected_return_date &&
            inj.expected_return_date < dayStr
          ) continue;
          const g = inj.injury_grade;
          if (g === "severe" || g === "Grade 3") {
            injuryPenalty = Math.max(injuryPenalty, 20);
            injuryForcedModerate = true;
          } else if (g === "moderate" || g === "Grade 2") {
            injuryPenalty = Math.max(injuryPenalty, 10);
          } else {
            injuryPenalty = Math.max(injuryPenalty, 5);
          }
        }
      } catch (_injErr) {
        // Non-fatal: proceed without injury penalty rather than blocking readiness
      }

      const score = Math.round(
        Math.max(0, Math.min(100, rawScore - travelPenalty - injuryPenalty)),
      );

      // Evidence-based cut-points (starting points - require team calibration)
      // These thresholds are based on common athlete monitoring scales
      // Teams should calibrate using their own injury/performance history over time
      const LOW_MAX = 55; // Below this = Low readiness → Deload
      const MODERATE_MAX = 75; // Below this = Moderate → Maintain, Above = High → Push

      let level, suggestion;
      if (score > MODERATE_MAX && !injuryForcedModerate) {
        level = "high";
        suggestion = "push";
      } else if (score >= LOW_MAX) {
        level = "moderate";
        suggestion = "maintain";
      } else {
        level = "low";
        suggestion = "deload";
      }

      // Store readiness score
      const { error: upsertErr } = await persistReadinessScore({
        user_id: athleteId,
        day: dayStr,
        score,
        level,
        suggestion,
        acwr: hasAcwr ? Math.round(acwr * 100) / 100 : null,
        acute_load: Math.round(acuteLoad * 100) / 100,
        chronic_load: Math.round(chronicLoad * 100) / 100,
        workload_score: workloadScore,
        sleep_score: sleepScore,
        proximity_score: proximityScore,
      });

      if (upsertErr) {
        requestLogger.error("readiness_score_upsert_failed", upsertErr, {
          athlete_id: athleteId,
          day: dayStr,
          score,
          level,
        });
        if (!isOptionalSchemaError(upsertErr)) {
          return createErrorResponse(
            `Failed to save readiness score: ${upsertErr.message}`,
            500,
            "database_error",
          );
        }
        requestLogger.warn("readiness_score_persistence_unavailable", {
          athlete_id: athleteId,
          day: dayStr,
        });
      }

      // Safety override: Check ACWR danger zone — only when ACWR is actually
      // known (a null ACWR must not fire a false override on a data-less day).
      if (hasAcwr && (acwr > 1.5 || acwr < 0.8)) {
        requestLogger.info("readiness_acwr_danger_zone_detected", {
          athlete_id: athleteId,
          acwr,
        });
        try {
          await detectACWRTrigger(athleteId);
        } catch (triggerError) {
          requestLogger.error("readiness_acwr_trigger_failed", triggerError, {
            athlete_id: athleteId,
            acwr,
          });
          // Don't fail the whole request if safety override check fails
        }
      }

      // Calibration note for teams
      const calibrationNote =
        `Readiness thresholds (Low: <${LOW_MAX}, Moderate: ${LOW_MAX}-${MODERATE_MAX}, High: >${MODERATE_MAX}) ` +
        `are evidence-based starting points. Teams should calibrate these thresholds using their own ` +
        `injury and performance history over time for optimal accuracy.`;

      requestLogger.info("readiness_calculation_completed", {
        athlete_id: athleteId,
        score,
        level,
        acwr: Math.round(acwr * 100) / 100,
      });

      return createSuccessResponse({
        score,
        level,
        suggestion,
        acwr: Math.round(acwr * 100) / 100,
        acuteLoad: Math.round(acuteLoad * 100) / 100,
        chronicLoad: Math.round(chronicLoad * 100) / 100,
        dataMode, // 'full' or 'reduced'
        wellnessIndex, // Detailed wellness index with subscores
        componentScores: {
          workload: workloadScore,
          wellness: wellnessScore,
          sleep: sleepScore,
          proximity: proximityScore,
        },
        calibrationNote,
        // Include actual weightings used (for transparency)
        weightings: {
          workload: workloadWeight,
          wellness: wellnessWeight,
          sleep: sleepWeight,
          proximity: proximityWeight,
        },
      });
    },
  });
};

export const testHandler = handler;
export { handler, estimateGameLoads, travelReadinessPenalty };

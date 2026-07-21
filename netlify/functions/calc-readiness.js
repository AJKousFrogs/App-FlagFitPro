import { supabaseAdmin } from "./supabase-client.js";
import {
  createSuccessResponse,
  createErrorResponse,
  handleValidationError,
} from "./utils/error-handler.js";
import { detectACWRTrigger } from "./utils/safety-override.js";
import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { hasAnyRole, LOAD_MANAGEMENT_ACCESS_ROLES } from "./utils/role-sets.js";
import { sharesStaffedTeam } from "./utils/team-scope.js";
import {
  tryParseJsonObjectBody,
  isFiniteNumber,
} from "./utils/input-validator.js";
import {
  buildRequestLogContext,
  createLogger,
} from "./utils/structured-logger.js";
import { computeAcwrAt, computeSessionLoad } from "./utils/acwr.js";
import { resolveCohort } from "./utils/cohort.js";
import {
  computePersonalCutoffs,
  fetchBaselineScores,
} from "./utils/readiness-baseline.js";
import { calculateWellnessIndex } from "./utils/readiness-score.js";
import { normalizeSeverity } from "./utils/periodization-input-helpers.js";

// Netlify Function: Calculate Readiness Score
// Evidence-based readiness scoring combining session-RPE, ACWR, wellness, and game proximity
// Endpoint: /api/calc-readiness
//
// ARCHITECTURAL NOTE (P1 audit):
// This function computes COMPOSITE readiness for dashboards/prescription (ACWR + wellness + sleep + game proximity).
// It is INTENTIONALLY DISTINCT from wellness-checkin.js's calculateReadiness() function,
// which computes a CHECK-IN-TIME estimate (wellness signals only, no ACWR/game data).
// Both functions use the SHARED wellness weighting scheme (utils/readiness-score.js —
// WELLNESS_REQUIRED_WEIGHTS / WELLNESS_OPTIONAL_WEIGHTS), unified 2026-07-08 to prevent drift.
// See readiness-score.js header (lines 1-27) for the full audit history (2026-07-08/C5, 2026-07-15).
// DO NOT refactor these as a single formula — they must remain separate to serve their distinct roles
// (composite vs check-in-time), while sharing the underlying wellness weighting logic.

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
      : new Date(
          Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
        );
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

/**
 * Build the daily internal-load Map (session-RPE AU) from training sessions,
 * summed by `session_date`, via the CANONICAL `computeSessionLoad` (utils/acwr.js)
 * — single source of truth (§4). Pure; game loads are folded in by the caller.
 */
export function buildLoadsByDay(sessions) {
  const loadsByDay = new Map();
  for (const s of sessions ?? []) {
    if (!s?.session_date) {
      continue;
    }
    const load = computeSessionLoad(s);
    if (load <= 0) {
      continue;
    }
    loadsByDay.set(
      s.session_date,
      (loadsByDay.get(s.session_date) || 0) + load,
    );
  }
  return loadsByDay;
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
        requestLogger.error(
          "readiness_training_sessions_fetch_failed",
          sessErr,
          {
            athlete_id: athleteId,
            start_date: startChronic.toISOString().slice(0, 10),
            end_date: dayStr,
          },
        );
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

      // Daily loads via the CANONICAL session-load definition (utils/acwr.js) —
      // single source of truth (§4). Previously this block re-derived load inline
      // as `duration * rpe`, which (a) ignored a stored `workload` and (b) treated
      // `intensity_level` as an RPE substitute — diverging from every other
      // load/ACWR consumer. `computeSessionLoad` = `workload` if real, else
      // `rpe × minutes`, else 0. Game loads are folded in below.
      const loadsByDay = buildLoadsByDay(sessions);

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
      // Cohort-aware boundaries (2026-07-14, batch 4 — completes LOGIC §10's
      // migration): youth/masters/RTP athletes are no longer scored against
      // the adult bands. Tightening-only vs adult (safe direction); resolution
      // failure → adult baseline, never a blocked calculation.
      const cohort = await resolveCohort(supabaseAdmin, athleteId);
      const bands = cohort.thresholds;
      // Graded confidence (audit C2): below 8 loaded days in the 28-day span the
      // ratio is noise for a 2-3×/week amateur — it INFORMS (displayed with its
      // confidence) but does not score readiness; its weight redistributes like
      // a null ACWR. medium/high confidence scores as before.
      const acwrUsable = hasAcwr && acwrResult.confidence !== "low";

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

      // Workload score (ACWR-based) — ADVISORY bands (the only cluster-RCT of
      // ACWR-guided management found no effect: Dalen-Lorentsen 2021 BJSM).
      // Only scored when ACWR is known AND confidence ≥ medium; otherwise its
      // weight is redistributed below (an unknown/noisy load never penalises
      // or flatters). Undertraining boundary aligned to 0.8 (audit C1 — the
      // 0.7 here vs 0.8 in the zones/trigger was drift, not intent).
      // TAPER DAMPENING (audit §1.1, Wang 2020): inside ~7 days of the next
      // game a volume cut is the PLAN — the EWMA ratio dropping below 0.8 is
      // the taper working, not detraining, so the low-side deduction is
      // suppressed. High-side deductions always stand (a pre-game spike is
      // still dangerous).
      const inTaperWindow = gameProximityHours <= 168;
      // Deduction boundaries come from the athlete's cohort (adult
      // 1.3/1.5/1.8/0.8; youth+masters 1.2/1.4/1.7; RTP 1.1/1.3/1.6/0.7).
      // The top tier mirrors the adult dangerHigh→critical gap (+0.3).
      let workloadScore = 100;
      if (acwrUsable) {
        if (acwr > bands.dangerHigh + 0.3) {
          workloadScore -= 40;
        } else if (acwr > bands.dangerHigh) {
          workloadScore -= 30;
        } else if (acwr > bands.sweetSpotHigh) {
          workloadScore -= 15;
        } else if (acwr < bands.sweetSpotLow && !inTaperWindow) {
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
      if (
        isFiniteNumber(wellness.sleep_quality) &&
        wellness.sleep_quality <= 4
      ) {
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

      // Re-weighted 2026-07-14 (audit §1.1): the ACWR evidence base weakened
      // (Dalen-Lorentsen 2021 RCT null; method-dependence critiques), while
      // subjective wellness has the stronger monitoring evidence (Saw 2016)
      // and sleep the strongest single-signal base (Halson 2014, Fullagar
      // 2015). Workload is one input among several — the weights now say so.
      let workloadWeight = 0.25; // ↓ from 0.35
      let wellnessWeight = 0.35; // ↑ from 0.30
      let sleepWeight = 0.25; // ↑ from 0.20
      let proximityWeight = 0.15; // Maintained

      // No ACWR yet (new athlete / insufficient chronic data): drop the workload
      // component and redistribute its weight proportionally to the others, so the
      // composite reflects only what's actually known (mirrors the reduced-data
      // path). Without this, a null ACWR scored as 100×0.35 silently inflates the
      // result for an athlete we know nothing about.
      if (!acwrUsable) {
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
          .select(
            "injury_grade, recovery_status, injury_mechanism, expected_return_date",
          )
          .eq("user_id", athleteId)
          .in("recovery_status", ["active", "recovering", "rehab"]);
        for (const inj of injuryRows || []) {
          // Skip expired self-reports (clinical injuries have no expiry)
          if (
            inj.injury_mechanism === "self_report" &&
            inj.expected_return_date &&
            inj.expected_return_date < dayStr
          ) {
            continue;
          }
          // Grade→tier via the ONE canonical classifier (2026-07-08 audit C1);
          // this used to inline `=== "severe" || === "Grade 3"` etc, a third
          // copy of the grade-string knowledge normalizeSeverity now owns.
          const tier = normalizeSeverity(inj.injury_grade);
          if (tier === "severe") {
            injuryPenalty = Math.max(injuryPenalty, 20);
            injuryForcedModerate = true;
          } else if (tier === "moderate") {
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

      // Cut-points (2026-07-15, audit C6): PERSONAL, not population-absolute.
      // The athlete's trailing 28-day score distribution sets z-based cuts
      // (low = mean − 1.5σ, high = mean + 0.5σ) blended toward the 55/75
      // population priors by w = n/(n+14) — day 1 is pure prior, two weeks of
      // daily scores is half-personal. A chronically-8h sleeper and a
      // chronically-6h sleeper stop being scored on the same ruler. Fewer
      // than 10 observations → the priors unchanged (nothing fabricated).
      // The engine's day-0 demotion keeps the ABSOLUTE 55 floor regardless —
      // personalization adds relative sensitivity, never removes the net.
      const LOW_MAX = 55; // population prior (and the engine's absolute floor)
      const MODERATE_MAX = 75; // population prior
      const baselineScores = await fetchBaselineScores(
        supabaseAdmin,
        athleteId,
        dayStr,
      );
      const cuts = computePersonalCutoffs(baselineScores, {
        low: LOW_MAX,
        high: MODERATE_MAX,
      });

      let level, suggestion;
      if (score > cuts.high && !injuryForcedModerate) {
        level = "high";
        suggestion = "push";
      } else if (score >= cuts.low) {
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
      if (
        (hasAcwr && acwr > bands.dangerHigh) ||
        (acwrUsable && acwr < bands.sweetSpotLow && !inTaperWindow)
      ) {
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

      // Calibration note — honest about which ruler scored today (C6)
      const calibrationNote = cuts.personalized
        ? `Readiness thresholds are personalized to YOUR trailing ${cuts.n}-day baseline ` +
          `(mean ${cuts.mean}, low < ${cuts.low}, high > ${cuts.high}), blended with the ` +
          `population starting points (${LOW_MAX}/${MODERATE_MAX}).`
        : `Readiness thresholds (Low: <${LOW_MAX}, Moderate: ${LOW_MAX}-${MODERATE_MAX}, High: >${MODERATE_MAX}) ` +
          `are population starting points — they personalize to your own baseline once ~10 days of scores exist.`;

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
        // null stays null — Math.round(null*100)/100 fabricated a 0 before.
        acwr: hasAcwr ? Math.round(acwr * 100) / 100 : null,
        // Graded ACWR trust (audit C2/C3): low confidence → displayed, not
        // scored; building_base → no ratio at all, ramp guidance instead.
        acwrConfidence: acwrResult.confidence,
        acwrState: acwrResult.state,
        /** The cohort whose bands scored this readiness (batch 4). */
        cohort: cohort.presetId,
        /** Personal cut-points that classified today's level (audit C6). */
        baseline: {
          low: cuts.low,
          high: cuts.high,
          personalized: cuts.personalized,
          n: cuts.n,
          mean: cuts.mean,
          sd: cuts.sd,
        },
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

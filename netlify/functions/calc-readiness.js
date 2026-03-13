import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { supabaseAdmin } from "./supabase-client.js";
import { createSuccessResponse, createErrorResponse, handleValidationError } from "./utils/error-handler.js";
import { detectACWRTrigger } from "./utils/safety-override.js";
import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";

// Netlify Function: Calculate Readiness Score
// Evidence-based readiness scoring combining session-RPE, ACWR, wellness, and game proximity
// Endpoint: /api/calc-readiness

// Note: authenticateRequest, applyRateLimit are handled by baseHandler

/**
 * Calculate readiness score for an athlete
 * Evidence-based composite score (0-100) combining:
 * - Workload (ACWR from session-RPE): 35%
 * - Wellness Index (fatigue, soreness, mood, stress): 30%
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
  const fatigue = scaleTo1to5(wellness.fatigue);
  const sleepQuality = scaleTo1to5(wellness.sleep_quality);
  const soreness = scaleTo1to5(wellness.soreness);
  const mood = scaleTo1to5(wellness.mood);
  const stress = scaleTo1to5(wellness.stress);
  const energy = scaleTo1to5(wellness.energy);

  // Required fields (fatigue, sleepQuality, soreness)
  const requiredFields = [
    { value: fatigue, weight: 0.4, name: "fatigue" },
    { value: sleepQuality, weight: 0.35, name: "sleepQuality" },
    { value: soreness, weight: 0.25, name: "soreness" },
  ];

  // Optional fields (mood, stress, energy)
  const optionalFields = [
    { value: mood, weight: 0.4, name: "mood" },
    { value: stress, weight: 0.35, name: "stress" },
    { value: energy, weight: 0.25, name: "energy" },
  ];

  // Calculate completeness
  const requiredCount = requiredFields.filter((f) => f.value !== null).length;
  const optionalCount = optionalFields.filter((f) => f.value !== null).length;
  const totalFields = requiredFields.length + optionalFields.length;
  const availableFields = requiredCount + optionalCount;
  const completeness = (availableFields / totalFields) * 100;

  // Calculate subscore from required fields (always available)
  // Invert fatigue and soreness (higher = worse), keep sleepQuality as-is (higher = better)
  let requiredSubscore = 0;
  let requiredWeightSum = 0;

  requiredFields.forEach((field) => {
    if (field.value !== null) {
      let normalizedValue;
      if (field.name === "fatigue" || field.name === "soreness") {
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
    fatigue: fatigue || null,
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

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
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

async function verifyAthleteAccess(requestUserId, athleteId) {
  if (athleteId === requestUserId) {
    return { authorized: true };
  }

  const role = await getUserRole(requestUserId);
  if (!["coach", "assistant_coach", "head_coach", "admin"].includes(role)) {
    return {
      authorized: false,
      message: "Not authorized to calculate readiness for another athlete",
    };
  }

  const { data: requesterMembership, error: requesterError } = await supabaseAdmin
    .from("team_members")
    .select("team_id")
    .eq("user_id", requestUserId)
    .limit(1)
    .maybeSingle();

  if (requesterError || !requesterMembership?.team_id) {
    return {
      authorized: false,
      message: "Requesting user is not assigned to a team",
    };
  }

  const { data: athleteMembership, error: athleteError } = await supabaseAdmin
    .from("team_members")
    .select("team_id")
    .eq("user_id", athleteId)
    .limit(1)
    .maybeSingle();

  if (athleteError || !athleteMembership?.team_id) {
    return {
      authorized: false,
      message: "Target athlete is not assigned to a team",
    };
  }

  if (athleteMembership.team_id !== requesterMembership.team_id) {
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
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true, // SECURITY: Explicit auth for readiness calculation
    handler: async (event, _context, { userId }) => {
      console.log("[calc-readiness] Starting function execution", {
        userId,
        bodyLength: event.body?.length,
      });

      let body;
      try {
        body = JSON.parse(event.body || "{}");
        console.log("[calc-readiness] Parsed body:", body);
      } catch (_e) {
        console.error("[calc-readiness] JSON parse error:", _e);
        return handleValidationError("Invalid JSON in request body");
      }

      if (!isPlainObject(body)) {
        return handleValidationError("Request body must be an object");
      }

      // If athleteId not provided, use authenticated user's ID
      const { athleteId = userId, day } = body;

      console.log("[calc-readiness] Request parameters:", {
        athleteId,
        day,
        userId,
      });

      if (!athleteId) {
        console.error("[calc-readiness] Missing athleteId");
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
      console.log("[calc-readiness] Target date:", dayStr);

      const access = await verifyAthleteAccess(userId, athleteId);
      if (!access.authorized) {
        return createErrorResponse(access.message, 403, "authorization_error");
      }

      // 1) Load training sessions for ACWR calculation (session-RPE: RPE × minutes)
      const startChronic = new Date(targetDate);
      startChronic.setDate(startChronic.getDate() - 27); // 28 days inclusive

      const startAcute = new Date(targetDate);
      startAcute.setDate(startAcute.getDate() - 6); // 7 days inclusive

      // Get sessions from training_sessions table
      // Include both rpe and intensity_level (fallback for RPE)
      // Note: athlete_id is the canonical user reference column (NOT NULL)
      // Use session_date as the standardized date column
      console.log("[calc-readiness] Fetching sessions:", {
        athleteId,
        startChronic: startChronic.toISOString().slice(0, 10),
        endDate: dayStr,
      });

      // Query training_sessions - handle both user_id (new) and athlete_id (legacy) columns
      const { data: sessions, error: sessErr } = await supabaseAdmin
        .from("training_sessions")
        .select(
          "session_date, duration_minutes, rpe, workload, intensity_level",
        )
        .or(`user_id.eq.${athleteId},athlete_id.eq.${athleteId}`)
        .gte("session_date", startChronic.toISOString().slice(0, 10))
        .lte("session_date", dayStr)
        .order("session_date", { ascending: false });

      if (sessErr) {
        console.error("[calc-readiness] Error fetching sessions:", sessErr);
        return createErrorResponse(
          500,
          `Failed to fetch sessions: ${sessErr.message}`,
        );
      }

      console.log(`[calc-readiness] Fetched ${sessions?.length || 0} sessions`);

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

      // Calculate acute load (7-day sum)
      const acuteLoad = Array.from(loadsByDay.entries())
        .filter(([d]) => d >= startAcute.toISOString().slice(0, 10))
        .reduce((sum, [, v]) => sum + v, 0);

      // Calculate chronic load (28-day weekly average)
      const chronicWindowDays = 28;
      let chronicSum = 0;
      for (let i = 0; i < chronicWindowDays; i++) {
        const d = new Date(startChronic);
        d.setDate(startChronic.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        chronicSum += loadsByDay.get(key) || 0;
      }
      const chronicLoad = chronicSum / (chronicWindowDays / 7); // Weekly average

      // Calculate ACWR
      const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;

      // 2) Get wellness log for the day
      console.log("[calc-readiness] Fetching wellness log for:", {
        athleteId,
        dayStr,
      });

      // Query wellness_logs - handle both user_id (new) and athlete_id (legacy) columns
      const { data: wellness, error: wellErr } = await supabaseAdmin
        .from("wellness_logs")
        .select("*")
        .or(`user_id.eq.${athleteId},athlete_id.eq.${athleteId}`)
        .eq("log_date", dayStr)
        .maybeSingle();

      if (wellErr) {
        console.error("[calc-readiness] Error fetching wellness log:", wellErr);
        return createErrorResponse(
          500,
          `Failed to fetch wellness log: ${wellErr.message}`,
        );
      }

      console.log("[calc-readiness] Wellness log found:", !!wellness);

      if (!wellness) {
        console.log("[calc-readiness] No wellness log found for date:", dayStr);
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
      const { data: nextGame } = await supabaseAdmin
        .from("fixtures")
        .select("game_start")
        .or(`athlete_id.eq.${athleteId},athlete_id.is.null`)
        .gte("game_start", targetDate.toISOString())
        .order("game_start", { ascending: true })
        .limit(1)
        .maybeSingle();

      let gameProximityHours = 999;
      if (nextGame?.game_start) {
        const gameDate = new Date(nextGame.game_start);
        gameProximityHours =
          (gameDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60);
      }

      // 4) Evidence-informed scoring with team-sport optimized weightings

      // Workload score (ACWR-based)
      // Literature flags >1.5 as high risk, ~0.8-1.3 safer range (Gabbett 2016)
      let workloadScore = 100;
      if (acwr > 1.8) {
        workloadScore -= 40;
      } else if (acwr > 1.5) {
        workloadScore -= 30;
      } else if (acwr > 1.3) {
        workloadScore -= 15;
      } else if (acwr < 0.7) {
        workloadScore -= 10;
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

      const score = Math.round(Math.max(0, Math.min(100, rawScore)));

      // Evidence-based cut-points (starting points - require team calibration)
      // These thresholds are based on common athlete monitoring scales
      // Teams should calibrate using their own injury/performance history over time
      const LOW_MAX = 55; // Below this = Low readiness → Deload
      const MODERATE_MAX = 75; // Below this = Moderate → Maintain, Above = High → Push

      let level, suggestion;
      if (score > MODERATE_MAX) {
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
      const { error: upsertErr } = await supabaseAdmin
        .from("readiness_scores")
        .upsert(
          {
            athlete_id: athleteId,
            user_id: athleteId, // Standardized ID
            day: dayStr,
            score,
            level,
            suggestion,
            acwr: Math.round(acwr * 100) / 100,
            acute_load: Math.round(acuteLoad * 100) / 100,
            chronic_load: Math.round(chronicLoad * 100) / 100,
            workload_score: workloadScore,
            wellness_score: wellnessScore,
            sleep_score: sleepScore,
            proximity_score: proximityScore,
          },
          {
            onConflict: "athlete_id,day",
          },
        );

      if (upsertErr) {
        console.error("Error upserting readiness score:", upsertErr);
        return createErrorResponse(
          500,
          `Failed to save readiness score: ${upsertErr.message}`,
        );
      }

      // Safety override: Check ACWR danger zone
      if (acwr > 1.5 || acwr < 0.8) {
        console.log("[calc-readiness] ACWR in danger zone, triggering check:", {
          acwr,
        });
        try {
          await detectACWRTrigger(athleteId);
        } catch (triggerError) {
          console.error(
            "[calc-readiness] Error in detectACWRTrigger:",
            triggerError,
          );
          // Don't fail the whole request if safety override check fails
        }
      }

      // Calibration note for teams
      const calibrationNote =
        `Readiness thresholds (Low: <${LOW_MAX}, Moderate: ${LOW_MAX}-${MODERATE_MAX}, High: >${MODERATE_MAX}) ` +
        `are evidence-based starting points. Teams should calibrate these thresholds using their own ` +
        `injury and performance history over time for optimal accuracy.`;

      console.log("[calc-readiness] Calculation complete:", {
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
export { handler };
export default createRuntimeV2Handler(handler);

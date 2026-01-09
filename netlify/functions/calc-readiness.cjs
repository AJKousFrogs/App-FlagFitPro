// Netlify Function: Calculate Readiness Score
// Evidence-based readiness scoring combining session-RPE, ACWR, wellness, and game proximity
// Endpoint: /api/calc-readiness

const { supabaseAdmin } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleValidationError,
} = require("./utils/error-handler.cjs");
const { detectACWRTrigger } = require("./utils/safety-override.cjs");
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
  if (optionalWeightSum > 0) {
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
const { baseHandler } = require("./utils/base-handler.cjs");

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "calc-readiness",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    handler: async (event, _context, { userId }) => {
      let body;
      try {
        body = JSON.parse(event.body || "{}");
      } catch (_e) {
        return handleValidationError("Invalid JSON in request body");
      }

      // If athleteId not provided, use authenticated user's ID
      const { athleteId = userId, day } = body;

      if (!athleteId) {
        return handleValidationError("athleteId is required");
      }

      const targetDate = day ? new Date(day) : new Date();
      const dayStr = targetDate.toISOString().slice(0, 10);

      // 1) Load training sessions for ACWR calculation (session-RPE: RPE × minutes)
      const startChronic = new Date(targetDate);
      startChronic.setDate(startChronic.getDate() - 27); // 28 days inclusive

      const startAcute = new Date(targetDate);
      startAcute.setDate(startAcute.getDate() - 6); // 7 days inclusive

      // Get sessions from training_sessions table
      // Include both rpe and intensity_level (fallback for RPE)
      // Note: athlete_id is the canonical user reference column (NOT NULL)
      let { data: sessions, error: sessErr } = await supabaseAdmin // eslint-disable-line prefer-const
        .from("training_sessions")
        .select("session_date, date, duration_minutes, rpe, intensity_level")
        .eq("athlete_id", athleteId)
        .gte("session_date", startChronic.toISOString().slice(0, 10))
        .lte("session_date", dayStr);

      if (sessErr) {
        console.error("Error fetching sessions:", sessErr);
        // Try alternative query with date field instead of session_date
        const { data: altSessions, error: altErr } = await supabaseAdmin
          .from("training_sessions")
          .select("session_date, date, duration_minutes, rpe, intensity_level")
          .eq("athlete_id", athleteId)
          .gte("date", startChronic.toISOString().slice(0, 10))
          .lte("date", dayStr);

        if (altErr) {
          return createErrorResponse(
            500,
            `Failed to fetch sessions: ${sessErr.message}`,
          );
        }
        sessions = altSessions;
      }

      // Also check sessions table (for imported open data)
      const { data: sessionsTableData } = await supabaseAdmin
        .from("sessions")
        .select("date, duration_minutes, rpe")
        .eq("athlete_id", athleteId)
        .gte("date", startChronic.toISOString().slice(0, 10))
        .lte("date", dayStr);

      // Combine sessions from both tables
      const allSessions = [...(sessions || []), ...(sessionsTableData || [])];

      // Calculate daily loads (session-RPE = RPE × duration)
      // Use rpe if available, fallback to intensity_level (assuming 1-10 scale maps to RPE)
      const loadsByDay = new Map();
      for (const s of allSessions) {
        const sessionDate = s.session_date || s.date;
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
      const { data: wellness, error: wellErr } = await supabaseAdmin
        .from("wellness_logs")
        .select("*")
        .eq("athlete_id", athleteId)
        .eq("log_date", dayStr)
        .maybeSingle();

      if (wellErr || !wellness) {
        return createErrorResponse(
          400,
          "Missing wellness log for this day. Please log wellness data first.",
        );
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
      const wellnessScore = wellnessIndex.subscore;

      // Sleep score
      // Strong evidence base: sleep duration/quality strongly linked to readiness
      // (Halson 2014, Fullagar et al. 2015)
      let sleepScore = 100;
      if (wellness.sleep_quality <= 4) {
        sleepScore -= 25;
      } else if (wellness.sleep_quality <= 6) {
        sleepScore -= 15;
      }
      if (wellness.sleep_hours !== null && wellness.sleep_hours < 6) {
        sleepScore -= 10;
      } else if (wellness.sleep_hours !== null && wellness.sleep_hours < 7) {
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
        await detectACWRTrigger(athleteId);
      }

      // Calibration note for teams
      const calibrationNote =
        `Readiness thresholds (Low: <${LOW_MAX}, Moderate: ${LOW_MAX}-${MODERATE_MAX}, High: >${MODERATE_MAX}) ` +
        `are evidence-based starting points. Teams should calibrate these thresholds using their own ` +
        `injury and performance history over time for optimal accuracy.`;

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

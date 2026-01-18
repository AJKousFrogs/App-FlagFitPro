/**
 * Exercise Progression Calculator
 *
 * AI-powered progressive overload calculator that determines
 * exact exercise prescriptions based on:
 * - Yesterday's performance
 * - Current ACWR
 * - Readiness score
 * - Exercise-specific progression rules
 *
 * Returns exact prescriptions (e.g., "3x11 pushups") not ranges.
 */

const { supabaseAdmin } = require("./supabase-client.cjs");
const { authenticateRequest } = require("./utils/auth-helper.cjs");
const {
  createErrorResponse,
  handleValidationError,
} = require("./utils/error-handler.cjs");

const getSupabase = (_authHeader) => {
  // Use shared admin client
  return supabaseAdmin;
};

/**
 * Progression rules per exercise type
 */
const PROGRESSION_RULES = {
  // Reps-based exercises
  linear_reps: {
    // Increment per session
    increment: 1,
    // Maximum before resetting or adding set
    maxReps: 15,
    // Minimum reps
    minReps: 5,
    // When to add a set instead of reps
    addSetThreshold: 15,
  },

  // Time-based exercises (holds)
  linear_hold: {
    // Increment in seconds
    increment: 5,
    maxHold: 60,
    minHold: 15,
  },

  // Duration-based exercises (foam rolling, etc.)
  linear_duration: {
    // Increment in seconds
    increment: 10,
    maxDuration: 90,
    minDuration: 30,
  },

  // Set-based progression
  linear_sets: {
    increment: 1,
    maxSets: 5,
    minSets: 2,
  },
};

/**
 * ACWR adjustment factors
 * Modifies progression based on training load ratio
 */
const ACWR_ADJUSTMENTS = {
  // ACWR < 0.8: Under-trained, can progress faster
  low: { factor: 1.2, threshold: 0.8 },
  // ACWR 0.8-1.3: Sweet spot, normal progression
  optimal: { factor: 1.0, thresholdMin: 0.8, thresholdMax: 1.3 },
  // ACWR > 1.3: High load, reduce progression
  high: { factor: 0.5, threshold: 1.3 },
  // ACWR > 1.5: Very high load, no progression
  danger: { factor: 0, threshold: 1.5 },
};

/**
 * Readiness adjustment factors
 */
const READINESS_ADJUSTMENTS = {
  // High readiness (80+): Progress normally or slightly more
  high: { factor: 1.1, threshold: 80 },
  // Good readiness (60-79): Normal progression
  good: { factor: 1.0, thresholdMin: 60, thresholdMax: 79 },
  // Moderate readiness (40-59): Reduced progression
  moderate: { factor: 0.75, thresholdMin: 40, thresholdMax: 59 },
  // Low readiness (<40): Maintain or reduce
  low: { factor: 0, threshold: 40 },
};

exports.handler = async (event) => {
  const { httpMethod, body, headers } = event;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  const withHeaders = (response) => ({ ...response, headers: corsHeaders });

  if (httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (httpMethod !== "POST") {
    return withHeaders(
      createErrorResponse("Method not allowed", 405, "method_not_allowed"),
    );
  }

  const auth = await authenticateRequest(event);
  if (!auth.success) {
    return withHeaders(auth.error);
  }

  const { user } = auth;
  const supabase = getSupabase();

  try {
    let payload = {};
    try {
      payload = JSON.parse(body || "{}");
    } catch (_parseError) {
      return withHeaders(handleValidationError("Invalid JSON in request body"));
    }
    const { exerciseIds, date, acwrValue, readinessScore } = payload;

    if (!exerciseIds || !Array.isArray(exerciseIds)) {
      return withHeaders(handleValidationError("exerciseIds array required"));
    }

    const targetDate = date || new Date().toISOString().split("T")[0];
    
    // CRITICAL: Do NOT use defaults for ACWR and readiness
    // These must come from actual user data. Use null to indicate no data.
    // Progression logic should handle missing data gracefully (conservative defaults)
    const acwr = acwrValue !== undefined && acwrValue !== null ? acwrValue : null;
    const readiness = readinessScore !== undefined && readinessScore !== null ? readinessScore : null;

    // Get yesterday's date
    const yesterday = new Date(targetDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Fetch yesterday's protocol exercises for these exercises
    const { data: yesterdayExercises } = await supabase
      .from("protocol_exercises")
      .select(
        `
        exercise_id,
        prescribed_sets,
        prescribed_reps,
        prescribed_hold_seconds,
        prescribed_duration_seconds,
        actual_sets,
        actual_reps,
        actual_hold_seconds,
        status,
        daily_protocols!inner(protocol_date, user_id)
      `,
      )
      .eq("daily_protocols.user_id", user.id)
      .eq("daily_protocols.protocol_date", yesterdayStr)
      .in("exercise_id", exerciseIds);

    // Create a map of yesterday's performance
    const yesterdayMap = new Map();
    if (yesterdayExercises) {
      yesterdayExercises.forEach((ex) => {
        yesterdayMap.set(ex.exercise_id, {
          sets: ex.actual_sets || ex.prescribed_sets,
          reps: ex.actual_reps || ex.prescribed_reps,
          holdSeconds: ex.actual_hold_seconds || ex.prescribed_hold_seconds,
          durationSeconds: ex.prescribed_duration_seconds,
          completed: ex.status === "complete",
        });
      });
    }

    // Fetch exercise details
    const { data: exercises } = await supabase
      .from("exercises")
      .select("*")
      .in("id", exerciseIds);

    // Calculate progressions
    const progressions = exercises.map((exercise) => {
      const yesterdayPerf = yesterdayMap.get(exercise.id);

      return calculateProgression(exercise, yesterdayPerf, acwr, readiness);
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: progressions,
        context: {
          acwr,
          readiness,
          targetDate,
        },
      }),
    };
  } catch (err) {
    console.error("Progression calculation error:", err);
    return withHeaders(
      createErrorResponse("Internal server error", 500, "server_error", {
        details: err.message,
      }),
    );
  }
};

/**
 * Calculate the progression for a single exercise
 */
function calculateProgression(exercise, yesterdayPerf, acwr, readiness) {
  // Determine the exercise type based on what prescription it uses
  const hasReps = exercise.default_reps || yesterdayPerf?.reps;
  const hasHold = exercise.default_hold_seconds || yesterdayPerf?.holdSeconds;
  const hasDuration =
    exercise.default_duration_seconds || yesterdayPerf?.durationSeconds;

  // Start with defaults or yesterday's values
  let prescribedSets = yesterdayPerf?.sets || exercise.default_sets || 1;
  let prescribedReps = yesterdayPerf?.reps || exercise.default_reps;
  let prescribedHoldSeconds =
    yesterdayPerf?.holdSeconds || exercise.default_hold_seconds;
  let prescribedDurationSeconds =
    yesterdayPerf?.durationSeconds || exercise.default_duration_seconds;

  // Calculate adjustment factor based on ACWR and readiness
  const adjustmentFactor = getAdjustmentFactor(acwr, readiness);

  // Generate progression note
  let progressionNote = null;

  // Apply progression based on exercise type
  if (hasReps && yesterdayPerf?.completed) {
    const rules = PROGRESSION_RULES.linear_reps;
    const increment = Math.round(rules.increment * adjustmentFactor);

    if (increment > 0 && prescribedReps) {
      const newReps = Math.min(prescribedReps + increment, rules.maxReps);

      if (newReps > prescribedReps) {
        progressionNote = `+${newReps - prescribedReps} rep${newReps - prescribedReps > 1 ? "s" : ""} from yesterday`;
        prescribedReps = newReps;
      } else if (prescribedReps >= rules.maxReps && prescribedSets < 5) {
        // Add a set, reset reps
        prescribedSets += 1;
        prescribedReps = rules.minReps;
        progressionNote = `+1 set, reset to ${rules.minReps} reps`;
      }
    }
  } else if (hasHold && yesterdayPerf?.completed) {
    const rules = PROGRESSION_RULES.linear_hold;
    const increment = Math.round(rules.increment * adjustmentFactor);

    if (increment > 0 && prescribedHoldSeconds) {
      const newHold = Math.min(
        prescribedHoldSeconds + increment,
        rules.maxHold,
      );

      if (newHold > prescribedHoldSeconds) {
        progressionNote = `+${newHold - prescribedHoldSeconds}s hold from yesterday`;
        prescribedHoldSeconds = newHold;
      }
    }
  } else if (hasDuration && yesterdayPerf?.completed) {
    const rules = PROGRESSION_RULES.linear_duration;
    const increment = Math.round(rules.increment * adjustmentFactor);

    if (increment > 0 && prescribedDurationSeconds) {
      const newDuration = Math.min(
        prescribedDurationSeconds + increment,
        rules.maxDuration,
      );

      if (newDuration > prescribedDurationSeconds) {
        progressionNote = `+${newDuration - prescribedDurationSeconds}s from yesterday`;
        prescribedDurationSeconds = newDuration;
      }
    }
  }

  // If readiness is very low, suggest maintaining or reducing
  if (readiness < 40) {
    progressionNote = "Recovery day: maintaining volume";
  }

  // If ACWR is too high, add a note
  if (acwr > 1.5) {
    progressionNote = "High training load: reduced progression";
  }

  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    prescribedSets,
    prescribedReps,
    prescribedHoldSeconds,
    prescribedDurationSeconds,
    yesterdaySets: yesterdayPerf?.sets,
    yesterdayReps: yesterdayPerf?.reps,
    yesterdayHoldSeconds: yesterdayPerf?.holdSeconds,
    progressionNote,
    adjustmentFactor,
  };
}

/**
 * Get the combined adjustment factor based on ACWR and readiness
 * 
 * IMPORTANT: When data is missing (null), use conservative factor of 1.0 (no change)
 * This prevents artificially inflating or deflating progression when we don't have real data
 */
function getAdjustmentFactor(acwr, readiness) {
  // ACWR factor - use 1.0 if no data (conservative, no change)
  let acwrFactor = 1.0;
  if (acwr !== null && acwr !== undefined) {
    if (acwr >= ACWR_ADJUSTMENTS.danger.threshold) {
      acwrFactor = ACWR_ADJUSTMENTS.danger.factor;
    } else if (acwr >= ACWR_ADJUSTMENTS.high.threshold) {
      acwrFactor = ACWR_ADJUSTMENTS.high.factor;
    } else if (acwr < ACWR_ADJUSTMENTS.low.threshold) {
      acwrFactor = ACWR_ADJUSTMENTS.low.factor;
    }
  }

  // Readiness factor - use 1.0 if no data (conservative, no change)
  let readinessFactor = 1.0;
  if (readiness !== null && readiness !== undefined) {
    if (readiness >= READINESS_ADJUSTMENTS.high.threshold) {
      readinessFactor = READINESS_ADJUSTMENTS.high.factor;
    } else if (readiness >= READINESS_ADJUSTMENTS.good.thresholdMin) {
      readinessFactor = READINESS_ADJUSTMENTS.good.factor;
    } else if (readiness >= READINESS_ADJUSTMENTS.moderate.thresholdMin) {
      readinessFactor = READINESS_ADJUSTMENTS.moderate.factor;
    } else {
      readinessFactor = READINESS_ADJUSTMENTS.low.factor;
    }
  }

  // Combined factor
  // If we have both values, average them
  // If we only have one, use just that one
  // If we have neither, return 1.0 (no adjustment)
  const hasAcwr = acwr !== null && acwr !== undefined;
  const hasReadiness = readiness !== null && readiness !== undefined;
  
  if (hasAcwr && hasReadiness) {
    return (acwrFactor + readinessFactor) / 2;
  } else if (hasAcwr) {
    return acwrFactor;
  } else if (hasReadiness) {
    return readinessFactor;
  }
  return 1.0; // No data, no adjustment
}

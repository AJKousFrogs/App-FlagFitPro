import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse, handleValidationError } from "./utils/error-handler.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import { buildRequestLogContext, createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.exercise-progression" });

function createRequestLogger(event, meta = {}) {
  return logger.child(
    buildRequestLogContext(event, {
      request_id: meta.requestId,
      correlation_id: meta.correlationId,
      trace_id: meta.traceId ?? meta.correlationId,
    }),
  );
}

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

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidIsoDate(value) {
  if (typeof value !== "string") {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function validatePayload(payload) {
  if (!isPlainObject(payload)) {
    return "Request body must be an object";
  }

  if (!Array.isArray(payload.exerciseIds) || payload.exerciseIds.length === 0) {
    return "exerciseIds must be a non-empty array";
  }
  if (payload.exerciseIds.length > 100) {
    return "exerciseIds cannot exceed 100 items";
  }
  const invalidExerciseId = payload.exerciseIds.find(
    (id) =>
      (typeof id !== "string" && typeof id !== "number") ||
      String(id).trim().length === 0,
  );
  if (invalidExerciseId !== undefined) {
    return "exerciseIds must contain only non-empty ids";
  }

  if (payload.date !== undefined && payload.date !== null && !isValidIsoDate(payload.date)) {
    return "date must be a valid date string";
  }
  if (
    payload.acwrValue !== undefined &&
    payload.acwrValue !== null &&
    (!isFiniteNumber(payload.acwrValue) || payload.acwrValue < 0 || payload.acwrValue > 10)
  ) {
    return "acwrValue must be a number between 0 and 10";
  }
  if (
    payload.readinessScore !== undefined &&
    payload.readinessScore !== null &&
    (!isFiniteNumber(payload.readinessScore) ||
      payload.readinessScore < 0 ||
      payload.readinessScore > 100)
  ) {
    return "readinessScore must be a number between 0 and 100";
  }
  return null;
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "exercise-progression",
    allowedMethods: ["POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId, supabase, requestId, correlationId }) => {
      const requestLogger = createRequestLogger(evt, {
        requestId,
        correlationId,
      });
      try {
        const parsedPayload = tryParseJsonObjectBody(evt.body);
        if (!parsedPayload.ok) {
          return parsedPayload.error;
        }
        const payload = parsedPayload.data;

        const validationError = validatePayload(payload);
        if (validationError) {
          return handleValidationError(validationError);
        }

        const { exerciseIds, date, acwrValue, readinessScore } = payload;

        const targetDate = date || new Date().toISOString().split("T")[0];

        // CRITICAL: Do NOT use defaults for ACWR and readiness
        // These must come from actual user data. Use null to indicate no data.
        // Progression logic should handle missing data gracefully (conservative defaults)
        const acwr =
          acwrValue !== undefined && acwrValue !== null ? acwrValue : null;
        const readiness =
          readinessScore !== undefined && readinessScore !== null
            ? readinessScore
            : null;

        // Get yesterday's date
        const yesterday = new Date(targetDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        // Fetch yesterday's protocol exercises for these exercises
        const { data: yesterdayExercises, error: yesterdayError } = await supabase
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
          .eq("daily_protocols.user_id", userId)
          .eq("daily_protocols.protocol_date", yesterdayStr)
          .in("exercise_id", exerciseIds);
        if (yesterdayError) {
          return createErrorResponse(
            "Failed to fetch previous exercise performance",
            500,
            "database_error",
          );
        }

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
        const { data: exercises, error: exercisesError } = await supabase
          .from("exercises")
          .select("*")
          .in("id", exerciseIds);
        if (exercisesError) {
          return createErrorResponse(
            "Failed to fetch exercise definitions",
            500,
            "database_error",
          );
        }
        if (!Array.isArray(exercises) || exercises.length === 0) {
          return handleValidationError("No matching exercises found");
        }

        // Calculate progressions
        const progressions = exercises.map((exercise) => {
          const yesterdayPerf = yesterdayMap.get(exercise.id);

          return calculateProgression(exercise, yesterdayPerf, acwr, readiness);
        });

        return {
          statusCode: 200,
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
        requestLogger.error("exercise_progression_error", err, {
          user_id: userId,
        });
        return createErrorResponse("Internal server error", 500, "server_error");
      }
    },
  });

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

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);

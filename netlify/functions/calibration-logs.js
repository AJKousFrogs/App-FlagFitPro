import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { hasAnyRole, LOAD_MANAGEMENT_ACCESS_ROLES } from "./utils/role-sets.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";
import { buildRequestLogContext, createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.calibration-logs" });

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
 * Netlify Function: Calibration Logs API
 *
 * Handles calibration logging for training recommendations and outcomes.
 * Tracks:
 * - System recommendations (deload/maintain/push)
 * - Subsequent outcomes (injury flags, performance ratings, session quality)
 *
 * Over time, this allows fitting simple internal models showing whether
 * thresholds are conservative or aggressive for actual users.
 */

/**
 * Log a training recommendation
 * POST /api/calibration-logs
 */
async function logRecommendation(userId, data, log = logger) {
  try {
    const { athleteId, timestamp, recommendation, context } = data;

    // Validate required fields
    if (!athleteId) {
      throw new Error("athleteId is required");
    }
    if (!recommendation) {
      throw new Error("recommendation is required");
    }
    if (
      !recommendation.type ||
      !["deload", "maintain", "push"].includes(recommendation.type)
    ) {
      throw new Error(
        "recommendation.type must be 'deload', 'maintain', or 'push'",
      );
    }

    // Insert calibration log entry
    const { data: result, error } = await supabaseAdmin
      .from("calibration_logs")
      .insert({
        user_id: userId,
        athlete_id: athleteId,
        timestamp: timestamp || new Date().toISOString(),
        recommendation_type: recommendation.type,
        readiness_score: recommendation.readinessScore || null,
        acwr: recommendation.acwr || null,
        rationale: recommendation.rationale || null,
        preset_id: context?.presetId || null,
        preset_version: context?.presetVersion || null,
        phase: context?.phase || null,
        days_until_event: context?.daysUntilEvent || null,
        event_importance: context?.eventImportance || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      log.error("calibration_log_recommendation_insert_failed", error, {
        athlete_id: data.athleteId,
        user_id: userId,
      });
      throw error;
    }

    return {
      id: result.id,
      athleteId: result.athlete_id,
      timestamp: result.timestamp,
      recommendationType: result.recommendation_type,
      createdAt: result.created_at,
    };
  } catch (error) {
    log.error("calibration_log_recommendation_failed", error, {
      user_id: userId,
    });
    throw error;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidId(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 128 &&
    /^[A-Za-z0-9_-]+$/.test(value.trim())
  );
}

async function verifyAthleteAccess(requestUserId, athleteId) {
  if (athleteId === requestUserId) {
    return { authorized: true };
  }

  const role = await getUserRole(requestUserId);
  if (!hasAnyRole(role, LOAD_MANAGEMENT_ACCESS_ROLES)) {
    return { authorized: false };
  }

  const { data: requesterMembership, error: requesterError } = await supabaseAdmin
    .from("team_members")
    .select("team_id")
    .eq("user_id", requestUserId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (requesterError || !requesterMembership?.team_id) {
    return { authorized: false };
  }

  const { data: athleteMembership, error: athleteError } = await supabaseAdmin
    .from("team_members")
    .select("team_id")
    .eq("user_id", athleteId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (athleteError || !athleteMembership?.team_id) {
    return { authorized: false };
  }

  return { authorized: athleteMembership.team_id === requesterMembership.team_id };
}

function validateRecommendationPayload(data) {
  if (!isPlainObject(data)) {
    return "Request body must be an object";
  }
  if (!isValidId(data.athleteId)) {
    return "athleteId must be a non-empty alphanumeric identifier";
  }
  if (!isPlainObject(data.recommendation)) {
    return "recommendation must be an object";
  }
  if (!["deload", "maintain", "push"].includes(data.recommendation.type)) {
    return "recommendation.type must be 'deload', 'maintain', or 'push'";
  }
  if (
    data.recommendation.readinessScore !== undefined &&
    (!Number.isFinite(data.recommendation.readinessScore) ||
      data.recommendation.readinessScore < 0 ||
      data.recommendation.readinessScore > 100)
  ) {
    return "recommendation.readinessScore must be a number between 0 and 100";
  }
  if (
    data.recommendation.acwr !== undefined &&
    (!Number.isFinite(data.recommendation.acwr) ||
      data.recommendation.acwr < 0 ||
      data.recommendation.acwr > 10)
  ) {
    return "recommendation.acwr must be a number between 0 and 10";
  }
  return null;
}

function validateOutcomePayload(data) {
  if (!isPlainObject(data)) {
    return "Request body must be an object";
  }
  if (!isValidId(data.athleteId)) {
    return "athleteId must be a non-empty alphanumeric identifier";
  }
  if (typeof data.timestamp !== "string" || Number.isNaN(new Date(data.timestamp).getTime())) {
    return "timestamp must be a valid ISO date-time string";
  }
  if (data.outcomes !== undefined && !isPlainObject(data.outcomes)) {
    return "outcomes must be an object";
  }
  if (
    data.outcomes?.performanceRating !== undefined &&
    (!Number.isFinite(data.outcomes.performanceRating) ||
      data.outcomes.performanceRating < 1 ||
      data.outcomes.performanceRating > 10)
  ) {
    return "outcomes.performanceRating must be a number between 1 and 10";
  }
  if (
    data.outcomes?.sessionQuality !== undefined &&
    (!Number.isFinite(data.outcomes.sessionQuality) ||
      data.outcomes.sessionQuality < 1 ||
      data.outcomes.sessionQuality > 10)
  ) {
    return "outcomes.sessionQuality must be a number between 1 and 10";
  }
  if (
    data.outcomes?.injuryFlagged !== undefined &&
    typeof data.outcomes.injuryFlagged !== "boolean"
  ) {
    return "outcomes.injuryFlagged must be a boolean";
  }
  return null;
}

/**
 * Log outcome for a previous recommendation
 * POST /api/calibration-logs/outcome
 */
async function logOutcome(userId, data, log = logger) {
  try {
    const { athleteId, timestamp, outcomes } = data;

    // Validate required fields
    if (!athleteId) {
      throw new Error("athleteId is required");
    }
    if (!timestamp) {
      throw new Error("timestamp is required");
    }

    // Find the matching calibration log entry (within 24 hours of the timestamp)
    const targetDate = new Date(timestamp);
    const startDate = new Date(targetDate);
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date(targetDate);
    endDate.setDate(endDate.getDate() + 1);

    const { data: existingLog, error: findError } = await supabaseAdmin
      .from("calibration_logs")
      .select("id")
      .eq("athlete_id", athleteId)
      .gte("timestamp", startDate.toISOString())
      .lte("timestamp", endDate.toISOString())
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    if (findError && findError.code !== "PGRST116") {
      log.error(
        "calibration_log_lookup_failed",
        findError,
        {
          athlete_id: athleteId,
        },
      );
      throw findError;
    }

    if (!existingLog) {
      // Create a new entry with just outcomes if no matching recommendation found
      const { data: result, error } = await supabaseAdmin
        .from("calibration_logs")
        .insert({
          user_id: userId,
          athlete_id: athleteId,
          timestamp,
          injury_flagged: outcomes?.injuryFlagged || false,
          injury_date: outcomes?.injuryDate || null,
          injury_type: outcomes?.injuryType || null,
          performance_rating: outcomes?.performanceRating || null,
          session_quality: outcomes?.sessionQuality || null,
          subjective_feedback: outcomes?.subjectiveFeedback || null,
          outcome_recorded_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

        if (error) {
          log.error("calibration_log_outcome_insert_failed", error, {
            athlete_id: athleteId,
            user_id: userId,
          });
          throw error;
        }

      return {
        id: result.id,
        athleteId: result.athlete_id,
        outcomeRecordedAt: result.outcome_recorded_at,
      };
    }

    // Update existing log with outcomes
    const { data: result, error } = await supabaseAdmin
      .from("calibration_logs")
      .update({
        injury_flagged: outcomes?.injuryFlagged || false,
        injury_date: outcomes?.injuryDate || null,
        injury_type: outcomes?.injuryType || null,
        performance_rating: outcomes?.performanceRating || null,
        session_quality: outcomes?.sessionQuality || null,
        subjective_feedback: outcomes?.subjectiveFeedback || null,
        outcome_recorded_at: new Date().toISOString(),
      })
      .eq("id", existingLog.id)
      .select()
      .single();

        if (error) {
          log.error("calibration_log_outcome_update_failed", error, {
            athlete_id: athleteId,
            user_id: userId,
          });
          throw error;
        }

    return {
      id: result.id,
      athleteId: result.athlete_id,
      outcomeRecordedAt: result.outcome_recorded_at,
    };
  } catch (error) {
    log.error("calibration_log_outcome_failed", error, {
      user_id: userId,
    });
    throw error;
  }
}

/**
 * Get calibration statistics for an athlete
 * GET /api/calibration-logs/stats/:athleteId
 */
async function getAthleteStats(athleteId, log = logger) {
  try {
    const { data: logs, error } = await supabaseAdmin
      .from("calibration_logs")
      .select("*")
      .eq("athlete_id", athleteId)
      .order("timestamp", { ascending: false });

    if (error) {
      log.error(
        "calibration_logs_fetch_failed",
        error,
        { athlete_id: athleteId },
      );
      throw error;
    }

    if (!logs || logs.length === 0) {
      return {
        totalRecommendations: 0,
        recommendationsByType: { deload: 0, maintain: 0, push: 0 },
        outcomesRecorded: 0,
        injuryRate: { deload: 0, maintain: 0, push: 0 },
        averagePerformanceRating: { deload: 0, maintain: 0, push: 0 },
      };
    }

    // Calculate statistics
    const recommendationsByType = { deload: 0, maintain: 0, push: 0 };
    const injuriesByType = { deload: 0, maintain: 0, push: 0 };
    const performanceRatingsByType = { deload: [], maintain: [], push: [] };
    let outcomesRecorded = 0;

    for (const log of logs) {
      const type = log.recommendation_type;
      if (type && recommendationsByType[type] !== undefined) {
        recommendationsByType[type]++;
      }

      if (log.outcome_recorded_at) {
        outcomesRecorded++;
        if (log.injury_flagged && type) {
          injuriesByType[type]++;
        }
        if (log.performance_rating && type) {
          performanceRatingsByType[type].push(log.performance_rating);
        }
      }
    }

    // Calculate injury rates and average performance ratings
    const injuryRate = {
      deload:
        recommendationsByType.deload > 0
          ? (injuriesByType.deload / recommendationsByType.deload) * 100
          : 0,
      maintain:
        recommendationsByType.maintain > 0
          ? (injuriesByType.maintain / recommendationsByType.maintain) * 100
          : 0,
      push:
        recommendationsByType.push > 0
          ? (injuriesByType.push / recommendationsByType.push) * 100
          : 0,
    };

    const averagePerformanceRating = {
      deload:
        performanceRatingsByType.deload.length > 0
          ? performanceRatingsByType.deload.reduce((a, b) => a + b, 0) /
            performanceRatingsByType.deload.length
          : 0,
      maintain:
        performanceRatingsByType.maintain.length > 0
          ? performanceRatingsByType.maintain.reduce((a, b) => a + b, 0) /
            performanceRatingsByType.maintain.length
          : 0,
      push:
        performanceRatingsByType.push.length > 0
          ? performanceRatingsByType.push.reduce((a, b) => a + b, 0) /
            performanceRatingsByType.push.length
          : 0,
    };

    return {
      totalRecommendations: logs.filter((l) => l.recommendation_type).length,
      recommendationsByType,
      outcomesRecorded,
      injuryRate,
      averagePerformanceRating,
    };
  } catch (error) {
    log.error("calibration_athlete_stats_failed", error, {
      athlete_id: athleteId,
    });
    throw error;
  }
}

/**
 * Get calibration statistics for a preset
 * GET /api/calibration-logs/preset-stats/:presetId
 */
async function getPresetStats(presetId, log = logger) {
  try {
    const { data: logs, error } = await supabaseAdmin
      .from("calibration_logs")
      .select("*")
      .eq("preset_id", presetId)
      .not("readiness_score", "is", null)
      .order("timestamp", { ascending: false });

    if (error) {
      log.error(
        "calibration_preset_logs_fetch_failed",
        error,
        { preset_id: presetId },
      );
      throw error;
    }

    if (!logs || logs.length === 0) {
      return {
        presetId,
        totalRecommendations: 0,
        thresholdEffectiveness: {
          lowReadinessThreshold: 0,
          injuryRateBelowThreshold: 0,
          injuryRateAboveThreshold: 0,
          recommendation: "optimal",
        },
      };
    }

    // Calculate threshold effectiveness
    // Assume low readiness threshold is 40 (can be adjusted)
    const lowThreshold = 40;

    let belowThresholdCount = 0;
    let belowThresholdInjuries = 0;
    let aboveThresholdCount = 0;
    let aboveThresholdInjuries = 0;

    for (const log of logs) {
      if (log.readiness_score !== null) {
        if (log.readiness_score < lowThreshold) {
          belowThresholdCount++;
          if (log.injury_flagged) {
            belowThresholdInjuries++;
          }
        } else {
          aboveThresholdCount++;
          if (log.injury_flagged) {
            aboveThresholdInjuries++;
          }
        }
      }
    }

    const injuryRateBelowThreshold =
      belowThresholdCount > 0
        ? (belowThresholdInjuries / belowThresholdCount) * 100
        : 0;
    const injuryRateAboveThreshold =
      aboveThresholdCount > 0
        ? (aboveThresholdInjuries / aboveThresholdCount) * 100
        : 0;

    // Determine recommendation based on injury rates
    let recommendation = "optimal";
    if (injuryRateBelowThreshold > injuryRateAboveThreshold * 1.5) {
      recommendation = "conservative"; // Threshold might be too high
    } else if (injuryRateAboveThreshold > injuryRateBelowThreshold * 1.5) {
      recommendation = "aggressive"; // Threshold might be too low
    }

    return {
      presetId,
      totalRecommendations: logs.filter((l) => l.recommendation_type).length,
      thresholdEffectiveness: {
        lowReadinessThreshold: lowThreshold,
        injuryRateBelowThreshold: parseFloat(
          injuryRateBelowThreshold.toFixed(2),
        ),
        injuryRateAboveThreshold: parseFloat(
          injuryRateAboveThreshold.toFixed(2),
        ),
        recommendation,
      },
    };
  } catch (error) {
    log.error("calibration_preset_stats_failed", error, {
      preset_id: presetId,
    });
    throw error;
  }
}

const handler = async (event, context) => {
  // Extract sub-path
  const path = event.path.replace("/.netlify/functions/calibration-logs", "");

  return baseHandler(event, context, {
    functionName: "calibration-logs",
    allowedMethods: ["GET", "POST"],
    rateLimitType: event.httpMethod === "POST" ? "CREATE" : "READ",
    requireAuth: true, // SECURITY: Explicit auth for calibration data
    handler: async (event, _context, { userId, requestId, correlationId }) => {
      const requestLogger = createRequestLogger(event, {
        requestId,
        correlationId,
      });
      try {
        if (event.httpMethod === "POST") {
          // Handle POST /api/calibration-logs/outcome
          if (path.includes("/outcome")) {
          let outcomeData;
          try {
            outcomeData = parseJsonObjectBody(event.body);
          } catch (error) {
            if (error?.message === "Request body must be an object") {
              return createErrorResponse(
                "Request body must be an object",
                422,
                "validation_error",
                requestId,
              );
            }
            return createErrorResponse(
              "Invalid JSON in request body",
              400,
              "invalid_json",
              requestId,
            );
          }

          const outcomeValidationError = validateOutcomePayload(outcomeData);
          if (outcomeValidationError) {
            return createErrorResponse(
              outcomeValidationError,
              422,
              "validation_error",
              requestId,
            );
          }

          const access = await verifyAthleteAccess(
            userId,
            outcomeData.athleteId,
            requestLogger,
          );
          if (!access.authorized) {
            return createErrorResponse(
              "Not authorized to log outcomes for this athlete",
              403,
              "authorization_error",
              requestId,
            );
          }

          const result = await logOutcome(userId, outcomeData, requestLogger);
          return createSuccessResponse(
            result,
            requestId,
            "Outcome logged successfully",
          );
        }

        // Handle POST /api/calibration-logs (log recommendation)
        let recommendationData;
        try {
          recommendationData = parseJsonObjectBody(event.body);
        } catch (error) {
          if (error?.message === "Request body must be an object") {
            return createErrorResponse(
              "Request body must be an object",
              422,
              "validation_error",
              requestId,
            );
          }
          return createErrorResponse(
            "Invalid JSON in request body",
            400,
            "invalid_json",
            requestId,
          );
        }

        const recommendationValidationError =
          validateRecommendationPayload(recommendationData);
        if (recommendationValidationError) {
          return createErrorResponse(
            recommendationValidationError,
            422,
            "validation_error",
            requestId,
          );
        }

        const access = await verifyAthleteAccess(
          userId,
          recommendationData.athleteId,
          requestLogger,
        );
        if (!access.authorized) {
          return createErrorResponse(
            "Not authorized to log recommendations for this athlete",
            403,
            "authorization_error",
            requestId,
          );
        }

        const result = await logRecommendation(
          userId,
          recommendationData,
          requestLogger,
        );
        return createSuccessResponse(
          result,
          requestId,
          "Recommendation logged successfully",
        );
        }

        // Handle GET requests
        // GET /api/calibration-logs/stats/:athleteId
        if (path.includes("/stats/")) {
        const athleteId = path.split("/stats/")[1]?.split("/")[0];
        if (!isValidId(athleteId)) {
          return createErrorResponse(
            "athleteId must be a non-empty alphanumeric identifier",
            422,
            "validation_error",
            requestId,
          );
        }

        const access = await verifyAthleteAccess(
          userId,
          athleteId,
          requestLogger,
        );
        if (!access.authorized) {
          return createErrorResponse(
            "Not authorized to view calibration stats for this athlete",
            403,
            "authorization_error",
            requestId,
          );
        }

        const result = await getAthleteStats(athleteId, requestLogger);
        return createSuccessResponse(result, requestId);
        }

        // GET /api/calibration-logs/preset-stats/:presetId
        if (path.includes("/preset-stats/")) {
        const presetId = path.split("/preset-stats/")[1]?.split("/")[0];
        if (!isValidId(presetId)) {
          return createErrorResponse(
            "presetId must be a non-empty alphanumeric identifier",
            422,
            "validation_error",
            requestId,
          );
        }

        const role = await getUserRole(userId);
        if (!hasAnyRole(role, LOAD_MANAGEMENT_ACCESS_ROLES)) {
          return createErrorResponse(
            "Not authorized to view preset calibration stats",
            403,
            "authorization_error",
            requestId,
          );
        }

        const result = await getPresetStats(presetId, requestLogger);
        return createSuccessResponse(result, requestId);
        }
        return createErrorResponse(
          "Endpoint not found",
          404,
          "not_found",
          requestId,
        );
      } catch (error) {
        requestLogger.error(
          "calibration_logs_handler_failed",
          error,
          {
            http_method: event.httpMethod,
            path,
            user_id: userId,
          },
        );
        if (
          error?.message?.includes("must be") ||
          error?.message?.includes("Request body must be an object")
        ) {
          return createErrorResponse(
            error.message,
            422,
            "validation_error",
            requestId,
          );
        }
        throw error;
      }
    },
  });
};

export const testHandler = handler;
export { handler };

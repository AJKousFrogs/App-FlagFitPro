import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import {
  canCoachViewWellness,
  filterWellnessDataForCoach,
} from "./utils/consent-guard.js";
import { detectPainTrigger } from "./utils/safety-override.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { hasAnyRole, HEALTH_DATA_ACCESS_ROLES } from "./utils/role-sets.js";
import {
  parseJsonObjectBody,
  parseBoundedInt,
} from "./utils/input-validator.js";
import { createLogger, makeRequestLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.wellness" });

const createRequestLogger = makeRequestLogger(logger);

// Netlify Function: Wellness API
// Handles wellness check-ins and wellness data retrieval

/**
 * Create wellness check-in
 * POST /api/wellness/checkin
 * Contract: Must check safety overrides for pain >3/10
 */
async function createWellnessCheckin(userId, checkinData, log = logger) {
  try {
    let { readiness, sleep, energy, mood, soreness, notes } = checkinData;

    // Safety override: Check for pain triggers (if soreness >3/10)
    if (soreness !== undefined && soreness !== null && soreness > 3) {
      await detectPainTrigger(userId, soreness, notes || "general", null);
    }

    // Calculate readiness from other fields if not explicitly provided
    // This matches the behavior of /api/wellness-checkin endpoint
    if (readiness === undefined || readiness === null) {
      // Calculate readiness as weighted average of available metrics (1-10 scale)
      const metrics = [];
      if (sleep !== undefined && sleep !== null) {
        // Convert sleep hours (0-24) to 1-10 scale: 8hrs = 10, <4hrs = 1
        const sleepScore = Math.max(
          1,
          Math.min(10, Math.round((sleep / 8) * 10)),
        );
        metrics.push({ value: sleepScore, weight: 0.3 });
      }
      if (energy !== undefined && energy !== null) {
        metrics.push({ value: energy, weight: 0.3 });
      }
      if (mood !== undefined && mood !== null) {
        metrics.push({ value: mood, weight: 0.2 });
      }
      if (soreness !== undefined && soreness !== null) {
        // Invert soreness: high soreness = low readiness
        const sorenessScore = 11 - soreness;
        metrics.push({ value: sorenessScore, weight: 0.2 });
      }

      if (metrics.length > 0) {
        // Weighted average, normalized by total weight
        const totalWeight = metrics.reduce((sum, m) => sum + m.weight, 0);
        const weightedSum = metrics.reduce(
          (sum, m) => sum + m.value * m.weight,
          0,
        );
        readiness = Math.round(weightedSum / totalWeight);
      } else {
        // Default readiness if no metrics provided
        readiness = 5;
      }
    }

    // Validate ranges
    if (readiness < 1 || readiness > 10) {
      throw new Error("readiness must be between 1 and 10");
    }

    if (sleep !== undefined && (sleep < 0 || sleep > 24)) {
      throw new Error("sleep must be between 0 and 24 hours");
    }

    if (energy !== undefined && (energy < 1 || energy > 10)) {
      throw new Error("energy must be between 1 and 10");
    }

    if (mood !== undefined && (mood < 1 || mood > 10)) {
      throw new Error("mood must be between 1 and 10");
    }

    if (soreness !== undefined && (soreness < 1 || soreness > 10)) {
      throw new Error("soreness must be between 1 and 10");
    }

    // Upsert the day's check-in into the canonical daily_wellness_checkin (one row per
    // user/day). This simpler form maps onto the canonical columns; the rich /wellness/checkin
    // path writes the same table. (Was a broken write to a nonexistent wellness_checkins table.)
    const { data, error } = await supabaseAdmin
      .from("daily_wellness_checkin")
      .upsert(
        {
          user_id: userId,
          checkin_date: new Date().toISOString().split("T")[0],
          // calculated_readiness is canonically 0-100 — the scale wellness-checkin.js
          // writes and that ai-chat.js / coach-core.js read (e.g. the "< 40" low-
          // readiness threshold and the "%" displays). `readiness` here is 1-10, so
          // scale it up; storing the raw 1-10 made every wellness-logs check-in read
          // as "low readiness" downstream and showed the coach a 1-10 next to 0-100s.
          calculated_readiness: Math.round((readiness / 10) * 100),
          sleep_hours: sleep ?? null,
          energy_level: energy ?? null,
          mood: mood ?? null,
          muscle_soreness: soreness ?? null,
          notes: notes || null,
        },
        { onConflict: "user_id,checkin_date" },
      )
      .select()
      .single();

    if (error) {
      log.error("wellness_checkin_create_failed", error, {
        user_id: userId,
      });
      throw error;
    }

    return {
      id: data.id,
      checkinAt: data.created_at,
      readiness: data.calculated_readiness,
      sleep: data.sleep_hours,
      energy: data.energy_level,
      mood: data.mood,
      soreness: data.muscle_soreness,
      notes: data.notes,
    };
  } catch (error) {
    log.error("wellness_checkin_exception", error, {
      user_id: userId,
    });
    throw error;
  }
}

/**
 * Get wellness check-ins for user
 * GET /api/wellness/checkins
 * Contract: Must enforce consent for coach requests
 */
async function getWellnessCheckins(
  userId,
  requestedAthleteId,
  limit = 30,
  log = logger,
) {
  try {
    const role = await getUserRole(userId);
    const isCoach = hasAnyRole(role, HEALTH_DATA_ACCESS_ROLES);
    const targetAthleteId = requestedAthleteId || userId;

    // If coach requesting another athlete's data, check consent
    if (isCoach && targetAthleteId !== userId) {
      const consentCheck = await canCoachViewWellness(userId, targetAthleteId);
      if (!consentCheck.allowed) {
        // Return compliance-only data
        const { data } = await supabaseAdmin
          .from("daily_wellness_checkin")
          .select("id, created_at, user_id")
          .eq("user_id", targetAthleteId)
          .order("created_at", { ascending: false })
          .limit(limit);
        return (data || []).map((item) => ({
          check_in_completed: true,
          check_in_date: item.created_at,
          // All wellness answers hidden
        }));
      }
    }

    const { data, error } = await supabaseAdmin
      .from("daily_wellness_checkin")
      .select("*")
      .eq("user_id", targetAthleteId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      log.error("wellness_checkins_fetch_failed", error, {
        requested_athlete_id: requestedAthleteId,
        limit,
      });
      throw error;
    }

    // Filter data for coach if consent not granted
    if (isCoach && targetAthleteId !== userId && data) {
      const consentCheck = await canCoachViewWellness(userId, targetAthleteId);
      return data.map((item) =>
        filterWellnessDataForCoach(
          item,
          consentCheck.allowed && consentCheck.reason === "CONSENT_GRANTED",
          consentCheck.safetyOverride,
        ),
      );
    }

    return data || [];
  } catch (error) {
    log.error("wellness_checkins_exception", error, {
      requested_athlete_id: requestedAthleteId,
    });
    throw error;
  }
}

/**
 * Get latest wellness check-in
 * GET /api/wellness/latest
 */
async function getLatestWellnessCheckin(userId, log = logger) {
  try {
    const { data, error } = await supabaseAdmin
      .from("daily_wellness_checkin")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // If no check-ins exist, return null
      if (error.code === "PGRST116") {
        return null;
      }
      log.error("wellness_latest_fetch_failed", error, {
        user_id: userId,
      });
      throw error;
    }

    return data;
  } catch (error) {
    log.error("wellness_latest_exception", error, {
      user_id: userId,
    });
    throw error;
  }
}

const handler = async (event, context) => {
  // Extract sub-path
  const path = event.path.replace("/.netlify/functions/wellness", "");

  return baseHandler(event, context, {
    functionName: "wellness",
    allowedMethods: ["GET", "POST"],
    rateLimitType: event.httpMethod === "POST" ? "CREATE" : "READ",
    requireAuth: true, // P0-008: Explicitly require authentication for health data
    handler: async (event, context, { userId, requestId, correlationId }) => {
      const requestLogger = createRequestLogger(event, {
        requestId,
        correlationId,
      });
      try {
        if (event.httpMethod === "POST") {
          // Handle POST /api/wellness/checkin
          if (path.includes("/checkin") || path.endsWith("/checkin")) {
            let checkinData;
            try {
              checkinData = parseJsonObjectBody(event.body);
            } catch (error) {
              if (error?.message === "Request body must be an object") {
                return createErrorResponse(
                  "Request body must be an object",
                  422,
                  "validation_error",
                );
              }
              return createErrorResponse(
                "Invalid JSON in request body",
                400,
                "invalid_json",
              );
            }

            const result = await createWellnessCheckin(
              userId,
              checkinData,
              requestLogger,
            );
            return createSuccessResponse(
              result,
              201,
              "Wellness check-in created",
            );
          }

          return createErrorResponse("Endpoint not found", 404, "not_found");
        }

        // Handle GET requests
        if (path.includes("/latest") || path.endsWith("/latest")) {
          const result = await getLatestWellnessCheckin(userId, requestLogger);
          return createSuccessResponse(result);
        }

        if (path.includes("/checkins") || path.endsWith("/checkins")) {
          let limit;
          try {
            limit = parseBoundedInt(
              event.queryStringParameters?.limit,
              "limit",
              {
                min: 1,
                max: 200,
                fallback: 30,
              },
            );
          } catch (validationError) {
            return createErrorResponse(
              validationError.message ||
                "limit must be an integer between 1 and 200",
              422,
              "validation_error",
            );
          }
          const athleteId = event.queryStringParameters?.athleteId || userId;
          if (athleteId !== userId) {
            const role = await getUserRole(userId);
            if (!hasAnyRole(role, HEALTH_DATA_ACCESS_ROLES)) {
              return createErrorResponse(
                "Not authorized to view another athlete's wellness data",
                403,
                "authorization_error",
              );
            }
          }
          const result = await getWellnessCheckins(
            userId,
            athleteId,
            limit,
            requestLogger,
          );
          return createSuccessResponse({ checkins: result });
        }

        // Default: return latest check-in
        const result = await getLatestWellnessCheckin(userId, requestLogger);
        return createSuccessResponse(result);
      } catch (error) {
        if (
          typeof error?.message === "string" &&
          /(must be between|must be a)/i.test(error.message)
        ) {
          return createErrorResponse(error.message, 422, "validation_error");
        }
        requestLogger.error("wellness_handler_failed", error, {
          http_method: event.httpMethod,
          path,
          user_id: userId,
        });
        throw error;
      }
    },
  });
};

export const testHandler = handler;
export { handler };

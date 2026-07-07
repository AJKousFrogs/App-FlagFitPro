import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import {
  tryParseJsonObjectBody,
  parseBoundedInt,
} from "./utils/input-validator.js";
import { createLogger, makeRequestLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.hydration" });

const createRequestLogger = makeRequestLogger(logger);

// Netlify Function: Hydration API
// Handles hydration tracking for athletes

// Canonical hydration store: public.athlete_hydration_logs
// (id, user_id, logged_at timestamptz, amount_ml int, beverage_type text,
//  note text, source text, metadata jsonb). One row per drink.
const HYDRATION_BEVERAGE_TYPES = new Set([
  "water",
  "electrolyte",
  "sports-drink",
  "smoothie",
  "protein-shake",
  "coconut",
  "other",
]);
const normalizeBeverageType = (type) =>
  HYDRATION_BEVERAGE_TYPES.has(type) ? type : "other";

/**
 * Get today's hydration logs
 * GET /api/hydration
 */
async function getTodayHydrationLogs(userId, log = logger) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86_400_000)
      .toISOString()
      .split("T")[0];

    const { data, error } = await supabaseAdmin
      .from("athlete_hydration_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("logged_at", today)
      .lt("logged_at", tomorrow)
      .order("logged_at", { ascending: true });

    if (error) {
      log.warn("hydration_today_query_failed", { user_id: userId }, error);
      return [];
    }

    // Map to expected format for HydrationTrackerComponent
    return (data || []).map((row) => ({
      id: row.id,
      amount: row.amount_ml,
      timestamp: row.logged_at,
      type: row.beverage_type || "water",
    }));
  } catch (error) {
    log.error("hydration_today_query_exception", error, { user_id: userId });
    return [];
  }
}

/**
 * Log hydration intake
 * POST /api/hydration/log
 */
async function logHydration(userId, hydrationData, log = logger) {
  try {
    const { amount, type = "water", context } = hydrationData;

    // Validate amount
    if (!amount || typeof amount !== "number" || amount <= 0) {
      throw new Error("amount is required and must be a positive number");
    }

    if (amount > 5000) {
      throw new Error("amount cannot exceed 5000ml");
    }

    const { data, error } = await supabaseAdmin
      .from("athlete_hydration_logs")
      .insert({
        user_id: userId,
        amount_ml: amount,
        beverage_type: normalizeBeverageType(type),
        logged_at: new Date().toISOString(),
        source: "manual",
        metadata: context ? { context } : {},
      })
      .select()
      .single();

    if (error) {
      log.error("hydration_log_db_error", error, {
        user_id: userId,
        amount,
      });
      throw error;
    }

    return {
      id: data.id,
      amount: data.amount_ml,
      timestamp: data.logged_at,
      type: data.beverage_type,
    };
  } catch (error) {
    log.error("hydration_log_failed", error, { user_id: userId });
    throw error;
  }
}

/**
 * Get hydration history
 * GET /api/hydration/history
 */
async function getHydrationHistory(userId, days = 7, log = logger) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    const { data, error } = await supabaseAdmin
      .from("athlete_hydration_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("logged_at", startDateStr)
      .order("logged_at", { ascending: false });

    if (error) {
      log.warn(
        "hydration_history_query_failed",
        { user_id: userId, days },
        error,
      );
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      amount: row.amount_ml,
      timestamp: row.logged_at,
      type: row.beverage_type || "water",
    }));
  } catch (error) {
    log.error("hydration_history_failed", error, {
      user_id: userId,
      days,
    });
    return [];
  }
}

const handler = async (event, context) => {
  // Extract sub-path
  const path = event.path.replace("/.netlify/functions/hydration", "");

  return baseHandler(event, context, {
    functionName: "hydration",
    allowedMethods: ["GET", "POST"],
    rateLimitType: event.httpMethod === "POST" ? "CREATE" : "READ",
    requireAuth: true, // P0-010: Explicitly require authentication for hydration data
    handler: async (event, context, { userId, requestId, correlationId }) => {
      const requestLogger = createRequestLogger(event, {
        requestId,
        correlationId,
      });
      try {
        if (event.httpMethod === "POST") {
          // Handle POST /api/hydration/log
          if (path.includes("/log") || path.endsWith("/log")) {
            let hydrationData;
            const parsedBody = tryParseJsonObjectBody(event.body);
            if (!parsedBody.ok) {
              return parsedBody.error;
            }
            hydrationData = parsedBody.data;

            const result = await logHydration(
              userId,
              hydrationData,
              requestLogger,
            );
            return createSuccessResponse(result, 201, "Hydration logged");
          }

          return createErrorResponse("Endpoint not found", 404, "not_found");
        }

        // Handle GET requests
        if (path.includes("/history") || path.endsWith("/history")) {
          let days;
          try {
            days = parseBoundedInt(event.queryStringParameters?.days, "days", {
              min: 1,
              max: 365,
              fallback: 7,
            });
          } catch (validationError) {
            return createErrorResponse(
              validationError.message ||
                "days must be an integer between 1 and 365",
              422,
              "validation_error",
            );
          }
          const result = await getHydrationHistory(userId, days, requestLogger);
          return createSuccessResponse({ logs: result });
        }

        // Default: return today's logs
        const result = await getTodayHydrationLogs(userId, requestLogger);
        return createSuccessResponse({ logs: result });
      } catch (error) {
        if (
          typeof error?.message === "string" &&
          /(must be|required)/i.test(error.message)
        ) {
          return createErrorResponse(error.message, 422, "validation_error");
        }
        requestLogger.error("hydration_handler_failed", error, {
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

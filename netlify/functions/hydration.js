import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";
import { buildRequestLogContext, createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.hydration" });

function createRequestLogger(event, meta = {}) {
  return logger.child(
    buildRequestLogContext(event, {
      request_id: meta.requestId,
      correlation_id: meta.correlationId,
      trace_id: meta.traceId ?? meta.correlationId,
    }),
  );
}

// Netlify Function: Hydration API
// Handles hydration tracking for athletes

function parseBoundedInt(value, fallback, { min, max, field }) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const normalized = String(value).trim();
  if (!/^-?\d+$/.test(normalized)) {
    throw new Error(`${field} must be an integer between ${min} and ${max}`);
  }
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${field} must be an integer between ${min} and ${max}`);
  }
  return parsed;
}

/**
 * Get today's hydration logs
 * GET /api/hydration
 *
 * Database schema:
 * - id: uuid
 * - user_id: uuid
 * - log_date: date
 * - log_time: time
 * - fluid_ml: integer
 * - fluid_type: varchar
 * - context: varchar
 * - sodium_mg: integer
 * - potassium_mg: integer
 * - notes: text
 * - created_at: timestamptz
 */
async function getTodayHydrationLogs(userId, log = logger) {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabaseAdmin
      .from("hydration_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("log_date", today)
      .order("log_time", { ascending: true });

    if (error) {
      log.warn("hydration_today_query_failed", { user_id: userId }, error);
      return [];
    }

    // Map to expected format for HydrationTrackerComponent
    return (data || []).map((log) => ({
      id: log.id,
      amount: log.fluid_ml,
      timestamp:
        log.created_at || `${log.log_date}T${log.log_time || "00:00:00"}`,
      type: log.fluid_type || "water",
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

    const now = new Date();
    const logDate = now.toISOString().split("T")[0];
    const logTime = now.toTimeString().split(" ")[0]; // HH:MM:SS

    // Insert hydration log using correct schema
    const { data, error } = await supabaseAdmin
      .from("hydration_logs")
      .insert({
        user_id: userId,
        fluid_ml: amount,
        fluid_type: type,
        log_date: logDate,
        log_time: logTime,
        context: context || null,
        created_at: now.toISOString(),
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
      amount: data.fluid_ml,
      timestamp: data.created_at,
      type: data.fluid_type,
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
      .from("hydration_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("log_date", startDateStr)
      .order("log_date", { ascending: false })
      .order("log_time", { ascending: false });

    if (error) {
      log.warn(
        "hydration_history_query_failed",
        { user_id: userId, days },
        error,
      );
      return [];
    }

    return (data || []).map((log) => ({
      id: log.id,
      amount: log.fluid_ml,
      timestamp:
        log.created_at || `${log.log_date}T${log.log_time || "00:00:00"}`,
      type: log.fluid_type || "water",
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
            try {
              hydrationData = parseJsonObjectBody(event.body);
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

            const result = await logHydration(userId, hydrationData, requestLogger);
            return createSuccessResponse(result, 201, "Hydration logged");
          }

          return createErrorResponse("Endpoint not found", 404, "not_found");
        }

        // Handle GET requests
        if (path.includes("/history") || path.endsWith("/history")) {
          let days;
          try {
            days = parseBoundedInt(event.queryStringParameters?.days, 7, {
              min: 1,
              max: 365,
              field: "days",
            });
          } catch (validationError) {
            return createErrorResponse(
              validationError.message || "days must be an integer between 1 and 365",
              422,
              "validation_error",
            );
          }
          const result = await getHydrationHistory(
            userId,
            days,
            requestLogger,
          );
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
        requestLogger.error(
          "hydration_handler_failed",
          error,
          {
            http_method: event.httpMethod,
            path,
            user_id: userId,
          },
        );
        throw error;
      }
    },
  });
};

export const testHandler = handler;
export { handler };

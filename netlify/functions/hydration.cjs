// Netlify Function: Hydration API
// Handles hydration tracking for athletes

const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { supabaseAdmin } = require("./supabase-client.cjs");

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
async function getTodayHydrationLogs(userId) {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabaseAdmin
      .from("hydration_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("log_date", today)
      .order("log_time", { ascending: true });

    if (error) {
      // Table might not exist - return empty array gracefully
      console.warn("[Hydration] Query error:", error.message);
      return [];
    }

    // Map to expected format for HydrationTrackerComponent
    return (data || []).map((log) => ({
      id: log.id,
      amount: log.fluid_ml,
      timestamp: log.created_at || `${log.log_date}T${log.log_time || "00:00:00"}`,
      type: log.fluid_type || "water",
    }));
  } catch (error) {
    console.error("Error in getTodayHydrationLogs:", error);
    return [];
  }
}

/**
 * Log hydration intake
 * POST /api/hydration/log
 */
async function logHydration(userId, hydrationData) {
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
      console.error("Error logging hydration:", error);
      throw error;
    }

    return {
      id: data.id,
      amount: data.fluid_ml,
      timestamp: data.created_at,
      type: data.fluid_type,
    };
  } catch (error) {
    console.error("Error in logHydration:", error);
    throw error;
  }
}

/**
 * Get hydration history
 * GET /api/hydration/history
 */
async function getHydrationHistory(userId, days = 7) {
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
      console.warn("[Hydration History] Query error:", error.message);
      return [];
    }

    return (data || []).map((log) => ({
      id: log.id,
      amount: log.fluid_ml,
      timestamp: log.created_at || `${log.log_date}T${log.log_time || "00:00:00"}`,
      type: log.fluid_type || "water",
    }));
  } catch (error) {
    console.error("Error in getHydrationHistory:", error);
    return [];
  }
}

exports.handler = async (event, context) => {
  // Extract sub-path
  const path = event.path.replace("/.netlify/functions/hydration", "");

  return baseHandler(event, context, {
    functionName: "hydration",
    allowedMethods: ["GET", "POST"],
    rateLimitType: event.httpMethod === "POST" ? "CREATE" : "READ",
    handler: async (event, context, { userId }) => {
      if (event.httpMethod === "POST") {
        // Handle POST /api/hydration/log
        if (path.includes("/log") || path.endsWith("/log")) {
          let hydrationData = {};
          try {
            hydrationData = JSON.parse(event.body || "{}");
          } catch (_parseError) {
            return createErrorResponse(
              "Invalid JSON in request body",
              400,
              "invalid_json",
            );
          }

          const result = await logHydration(userId, hydrationData);
          return createSuccessResponse(result, 201, "Hydration logged");
        }

        return createErrorResponse("Endpoint not found", 404, "not_found");
      }

      // Handle GET requests
      if (path.includes("/history") || path.endsWith("/history")) {
        const days = parseInt(event.queryStringParameters?.days) || 7;
        const result = await getHydrationHistory(userId, days);
        return createSuccessResponse({ logs: result });
      }

      // Default: return today's logs
      const result = await getTodayHydrationLogs(userId);
      return createSuccessResponse({ logs: result });
    },
  });
};

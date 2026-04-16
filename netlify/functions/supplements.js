import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

// Netlify Function: Supplements API
// Handles supplement logging (read-only for AI - no dosing recommendations)

const parseBoundedInt = (value, fieldName, { min, max }) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || String(parsed) !== String(value)) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  if (parsed < min || parsed > max) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  return parsed;
};

/**
 * Log supplement usage
 * POST /api/supplements/log
 * Note: AI can read logs but never writes dosing recommendations
 */
async function logSupplement(userId, supplementData) {
  try {
    const { supplement, dose, takenAt, notes } = supplementData;

    // Validate required fields
    if (
      !supplement ||
      typeof supplement !== "string" ||
      supplement.trim().length === 0
    ) {
      const error = new Error("supplement name is required");
      error.isValidation = true;
      throw error;
    }

    // Validate supplement name length
    if (supplement.length > 100) {
      const error = new Error("supplement name must be 100 characters or less");
      error.isValidation = true;
      throw error;
    }

    // Note: dose is optional - user logs it, but AI never recommends it
    if (dose !== undefined && dose !== null) {
      if (typeof dose !== "number" || dose < 0) {
        const error = new Error("dose must be a positive number if provided");
        error.isValidation = true;
        throw error;
      }
    }

    // Parse takenAt or use current time
    const takenAtDate = takenAt ? new Date(takenAt) : new Date();

    // Insert supplement log
    const { data, error } = await supabaseAdmin
      .from("supplement_logs")
      .insert({
        user_id: userId,
        supplement_name: supplement.trim(),
        dosage: dose ? String(dose) : null,
        taken: true,
        date: takenAtDate.toISOString().split("T")[0],
        notes: notes || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error logging supplement:", error);
      throw error;
    }

    return {
      id: data.id,
      loggedAt: data.created_at,
      supplement: data.supplement_name,
      dose: data.dosage ?? null,
      takenAt: data.date,
      notes: data.notes,
    };
  } catch (error) {
    console.error("Error in logSupplement:", error);
    throw error;
  }
}

/**
 * Get supplement logs for user
 * GET /api/supplements/logs
 */
async function getSupplementLogs(userId, limit = 30) {
  try {
    const { data, error } = await supabaseAdmin
      .from("supplement_logs")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching supplement logs:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getSupplementLogs:", error);
    throw error;
  }
}

/**
 * Get recent supplement logs (last 7 days)
 * GET /api/supplements/recent
 */
async function getRecentSupplementLogs(userId) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split("T")[0];

    const { data, error } = await supabaseAdmin
      .from("supplement_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("date", dateStr)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching recent supplement logs:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getRecentSupplementLogs:", error);
    throw error;
  }
}

/**
 * Get user's supplement list with today's status
 * GET /api/supplements
 */
async function getUserSupplements(userId) {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Get user's supplements (if they have a custom list)
    const { data: userSupplements } = await supabaseAdmin
      .from("user_supplements")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true);

    // Get today's logs
    const { data: todayLogs } = await supabaseAdmin
      .from("supplement_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today);

    // If user has custom supplements, use those
    if (userSupplements && userSupplements.length > 0) {
      const supplements = userSupplements.map((s) => {
        const takenToday = todayLogs?.some(
          (log) => log.supplement_name?.toLowerCase() === s.name?.toLowerCase(),
        );
        return {
          id: s.id,
          name: s.name,
          dosage: s.dosage,
          timing: s.timing || "anytime",
          category: s.category || "other",
          taken: takenToday || false,
          takenAt: takenToday
            ? todayLogs.find(
                (log) =>
                  log.supplement_name?.toLowerCase() === s.name?.toLowerCase(),
              )?.created_at
            : null,
        };
      });

      return { supplements, todayLogs: todayLogs || [] };
    }

    // Return empty - frontend will use defaults
    return { supplements: [], todayLogs: todayLogs || [] };
  } catch (error) {
    console.error("Error in getUserSupplements:", error);
    return { supplements: [], todayLogs: [] };
  }
}

const handler = async (event, context) => {
  // Extract sub-path
  const path = event.path.replace("/.netlify/functions/supplements", "");

  return baseHandler(event, context, {
    functionName: "supplements",
    allowedMethods: ["GET", "POST"],
    rateLimitType: event.httpMethod === "POST" ? "CREATE" : "READ",
    requireAuth: true, // P0-009: Explicitly require authentication for supplement data
    handler: async (event, context, { userId }) => {
      try {
        if (event.httpMethod === "POST") {
          // Handle POST /api/supplements/log
          if (path.includes("/log") || path.endsWith("/log")) {
            let supplementData;
            try {
              supplementData = parseJsonObjectBody(event.body);
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

            const result = await logSupplement(userId, supplementData);
            return createSuccessResponse(result, 201, "Supplement logged");
          }

          return createErrorResponse("Endpoint not found", 404, "not_found");
        }

        // Handle GET requests
        if (path.includes("/recent") || path.endsWith("/recent")) {
          const result = await getRecentSupplementLogs(userId);
          return createSuccessResponse({ logs: result });
        }

        if (path.includes("/logs") || path.endsWith("/logs")) {
          const queryLimit = event.queryStringParameters?.limit;
          const limit =
            queryLimit === undefined
              ? 30
              : parseBoundedInt(String(queryLimit), "limit", { min: 1, max: 200 });
          const result = await getSupplementLogs(userId, limit);
          return createSuccessResponse({ logs: result });
        }

        // Default: return user supplements with today's status
        const result = await getUserSupplements(userId);
        return createSuccessResponse(result);
      } catch (error) {
        if (
          error?.isValidation ||
          error?.message?.includes("must be an integer between")
        ) {
          return createErrorResponse(
            error.message,
            422,
            "validation_error",
          );
        }

        return createErrorResponse(
          "Failed to process supplements request",
          500,
          "internal_error",
        );
      }
    },
  });
};

export const testHandler = handler;
export { handler };

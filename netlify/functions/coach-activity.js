import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { supabaseAdmin } from "./supabase-client.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { COACH_ROUTE_ROLES } from "./utils/role-sets.js";
import { buildRequestLogContext, createLogger } from "./utils/structured-logger.js";

/**
 * Coach Activity API Function
 *
 * Provides activity feed for coaches showing player actions.
 *
 * Endpoints:
 * - GET /api/coach-activity - Get activity feed
 * - POST /api/coach-activity/:id/read - Mark activity as read
 * - POST /api/coach-activity/read-all - Mark all as read
 */

const logger = createLogger({ service: "netlify.coach-activity" });

function createRequestLogger(event, meta = {}) {
  return logger.child(
    buildRequestLogContext(event, {
      request_id: meta.requestId,
      correlation_id: meta.correlationId,
      trace_id: meta.traceId ?? meta.correlationId,
    }),
  );
}

// Use shared Supabase admin client
function getSupabase() {
  return supabaseAdmin;
}

function parseBoundedInt(value, fieldName, { min = 0, max = 1000 } = {}) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (!/^\d+$/.test(String(value))) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  return parsed;
}

/**
 * Get activity feed for coach
 */
async function getActivityFeed(userId, options = {}) {
  const supabase = getSupabase();

  // Get coach's teams
  const { data: teams, error: teamError } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .in("role", COACH_ROUTE_ROLES);

  if (teamError) {
    throw teamError;
  }

  if (!teams || teams.length === 0) {
    return [];
  }

  const teamIds = teams.map((t) => t.team_id);

  // Get activity for these teams
  let query = supabase
    .from("coach_activity_log")
    .select(
      `
      *,
      player:auth.users!coach_activity_log_player_id_fkey(
        id, email, raw_user_meta_data
      )
    `,
    )
    .in("team_id", teamIds)
    .or(`coach_id.eq.${userId},coach_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(options.limit || 50);

  if (options.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit || 50) - 1,
    );
  }

  if (options.unread_only) {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // Format response
  return (data || []).map((a) => ({
    ...a,
    player: a.player
      ? {
          id: a.player.id,
          email: a.player.email,
          full_name: a.player.raw_user_meta_data?.full_name || a.player.email,
          avatar_url: a.player.raw_user_meta_data?.avatar_url,
          position: a.player.raw_user_meta_data?.position,
        }
      : null,
  }));
}

/**
 * Get unread count
 */
async function getUnreadCount(userId) {
  const supabase = getSupabase();

  // Get coach's teams
  const { data: teams } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .in("role", COACH_ROUTE_ROLES);

  if (!teams || teams.length === 0) {
    return 0;
  }

  const teamIds = teams.map((t) => t.team_id);

  const { count, error } = await supabase
    .from("coach_activity_log")
    .select("*", { count: "exact", head: true })
    .in("team_id", teamIds)
    .or(`coach_id.eq.${userId},coach_id.is.null`)
    .eq("is_read", false);

  if (error) {
    throw error;
  }

  return count || 0;
}

/**
 * Mark activity as read
 */
async function markActivityRead(userId, activityId) {
  const supabase = getSupabase();

  // Verify coach has access
  const { data: activity } = await supabase
    .from("coach_activity_log")
    .select("team_id")
    .eq("id", activityId)
    .single();

  if (!activity) {
    throw new Error("Activity not found");
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", activity.team_id)
    .eq("user_id", userId)
    .eq("status", "active")
    .in("role", COACH_ROUTE_ROLES)
    .single();

  if (!membership) {
    throw new Error("Access denied");
  }

  const { error } = await supabase
    .from("coach_activity_log")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", activityId);

  if (error) {
    throw error;
  }

  return { success: true };
}

/**
 * Mark all activity as read
 */
async function markAllActivityRead(userId) {
  const supabase = getSupabase();

  // Get coach's teams
  const { data: teams } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .in("role", COACH_ROUTE_ROLES);

  if (!teams || teams.length === 0) {
    return { success: true, updated: 0 };
  }

  const teamIds = teams.map((t) => t.team_id);

  const { data, error } = await supabase
    .from("coach_activity_log")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .in("team_id", teamIds)
    .or(`coach_id.eq.${userId},coach_id.is.null`)
    .eq("is_read", false)
    .select("id");

  if (error) {
    throw error;
  }

  return { success: true, updated: data?.length || 0 };
}

/**
 * Get activity summary/stats
 */
async function getActivitySummary(userId) {
  const supabase = getSupabase();

  // Get coach's teams
  const { data: teams } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .in("role", COACH_ROUTE_ROLES);

  if (!teams || teams.length === 0) {
    return {
      total_today: 0,
      stats_uploaded: 0,
      training_completed: 0,
      unread_count: 0,
    };
  }

  const teamIds = teams.map((t) => t.team_id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get today's activity counts
  const { data: todayActivity } = await supabase
    .from("coach_activity_log")
    .select("activity_type")
    .in("team_id", teamIds)
    .gte("created_at", today.toISOString());

  const stats = {
    total_today: todayActivity?.length || 0,
    stats_uploaded:
      todayActivity?.filter((a) => a.activity_type === "stats_uploaded")
        .length || 0,
    training_completed:
      todayActivity?.filter((a) => a.activity_type === "training_completed")
        .length || 0,
    unread_count: await getUnreadCount(userId),
  };

  return stats;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

const handler = async (event, context) => {
  const rateLimitType = event.httpMethod === "GET" ? "READ" : "CREATE";
  return baseHandler(event, context, {
    functionName: "coach-activity",
    allowedMethods: ["GET", "POST"],
rateLimitType,
    requireAuth: true,
    handler: async (event, _context, { userId, requestId, correlationId }) => {
      const path = event.path
        .replace(/^\/\.netlify\/functions\/coach-activity\/?/, "")
        .replace(/^\/api\/coach-activity\/?/, "");
      const method = event.httpMethod;
      const queryParams = event.queryStringParameters || {};

      const requestLogger = createRequestLogger(event, {
        requestId,
        correlationId,
      });
      try {
        // GET / - Get activity feed
        if (method === "GET" && (path === "" || path === "/")) {
          const parsedLimit = parseBoundedInt(queryParams.limit, "limit", {
            min: 1,
            max: 200,
          });
          const parsedOffset = parseBoundedInt(queryParams.offset, "offset", {
            min: 0,
            max: 10000,
          });
          const activities = await getActivityFeed(userId, {
            limit: parsedLimit ?? 50,
            offset: parsedOffset ?? 0,
            unread_only: queryParams.unread_only === "true",
          });
          return createSuccessResponse(activities, requestId);
        }

        // GET /count - Get unread count
        if (method === "GET" && path === "count") {
          const count = await getUnreadCount(userId);
          return createSuccessResponse({ unread_count: count }, requestId);
        }

        // GET /summary - Get activity summary
        if (method === "GET" && path === "summary") {
          const summary = await getActivitySummary(userId);
          return createSuccessResponse(summary, requestId);
        }

        // POST /read-all - Mark all as read
        if (method === "POST" && path === "read-all") {
          const result = await markAllActivityRead(userId);
          return createSuccessResponse(result, requestId);
        }

        // POST /:id/read - Mark single activity as read
        const readMatch = path.match(/^([^/]+)\/read$/);
        if (method === "POST" && readMatch) {
          const activityId = readMatch[1];
          const result = await markActivityRead(userId, activityId);
          return createSuccessResponse(result, requestId);
        }

        return createErrorResponse("Not found", 404, "not_found", requestId);
      } catch (error) {
        requestLogger.error("coach_activity_api_error", error, {
          path,
          method,
          user_id: userId,
        });
        if (
          error.message?.includes("must be an integer between")
        ) {
          return createErrorResponse(
            error.message,
            422,
            "validation_error",
            requestId,
          );
        }
        if (error.message?.includes("Activity not found")) {
          return createErrorResponse(
            error.message,
            404,
            "not_found",
            requestId,
          );
        }
        const statusCode = error.message?.includes("denied") ? 403 : 500;
        return createErrorResponse(
          statusCode === 500 ? "Internal server error" : error.message || "Access denied",
          statusCode,
          statusCode === 500 ? "server_error" : "activity_error",
          requestId,
        );
      }
    },
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);

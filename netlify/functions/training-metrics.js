import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";

// Netlify Function: Training Metrics
// Retrieves flag-football metrics for an athlete
// Endpoint: /api/training-metrics
//
// REFACTORED: Uses base-handler, db-query-helper, and response-helper utilities
// Reduced from 98 lines to 50 lines (49% reduction)

import { supabaseAdmin } from "./utils/supabase-client.js";

import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse } from "./utils/error-handler.js";
import { executeQuery, parseAthleteId, parseDateParam } from "./utils/db-query-helper.js";
import { successResponse } from "./utils/response-helper.js";
import { getUserRole } from "./utils/authorization-guard.js";

const COACH_ROLES = new Set(["coach", "head_coach", "assistant_coach", "admin"]);

/**
 * Get training metrics for an athlete
 */
const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "training-metrics",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true, // Explicit auth requirement for training metrics
    handler: async (event, context, { userId, requestId }) => {
      try {
        // Parse query parameters
        const { valid, athleteId, error } = parseAthleteId(event, userId);
        if (!valid) {
          return error;
        }

        const rawStartDate = event.queryStringParameters?.startDate;
        if (rawStartDate !== undefined) {
          const parsed = new Date(rawStartDate);
          if (Number.isNaN(parsed.getTime())) {
            return createErrorResponse(
              "startDate must be a valid date",
              400,
              "validation_error",
              requestId,
            );
          }
        }

        // Cross-athlete reads are restricted to staff with team relationship.
        if (athleteId !== userId) {
          const role = await getUserRole(userId);
          if (!COACH_ROLES.has(role)) {
            return createErrorResponse(
              "Not authorized to view another athlete's metrics",
              403,
              "authorization_error",
              requestId,
            );
          }

          const { data: actorTeamMemberships, error: actorTeamsError } =
            await supabaseAdmin
              .from("team_members")
              .select("team_id")
              .eq("user_id", userId)
              .in("role", [...COACH_ROLES]);
          if (actorTeamsError) {
            throw actorTeamsError;
          }

          const actorTeamIds = (actorTeamMemberships || [])
            .map((m) => m.team_id)
            .filter(Boolean);
          if (actorTeamIds.length === 0) {
            return createErrorResponse(
              "Not authorized to view another athlete's metrics",
              403,
              "authorization_error",
              requestId,
            );
          }

          const { data: targetMembership, error: targetMembershipError } =
            await supabaseAdmin
              .from("team_members")
              .select("team_id")
              .eq("user_id", athleteId)
              .in("team_id", actorTeamIds)
              .eq("is_active", true)
              .limit(1);
          if (targetMembershipError) {
            throw targetMembershipError;
          }
          if (!targetMembership || targetMembership.length === 0) {
            return createErrorResponse(
              "Not authorized to view another athlete's metrics",
              403,
              "authorization_error",
              requestId,
            );
          }
        }

        const startDate = parseDateParam(event, "startDate", null);

        // Build query
        let query = supabaseAdmin
          .from("sessions")
          .select("date, total_volume, high_speed_distance, sprint_count")
          .eq("athlete_id", athleteId)
          .order("date", { ascending: false });

        if (startDate) {
          query = query.gte("date", startDate.toISOString().slice(0, 10));
        }

        const result = await executeQuery(query, "Failed to retrieve metrics");
        if (!result.success) {
          return createErrorResponse(
            "Failed to retrieve metrics",
            500,
            "database_error",
            requestId,
          );
        }

        return successResponse(result.data);
      } catch (error) {
        console.error("[training-metrics] Unexpected handler error:", error);
        return createErrorResponse(
          "Failed to retrieve metrics",
          500,
          "database_error",
          requestId,
        );
      }
    },
  });
};

export const testHandler = handler;
export default createRuntimeV2Handler(handler);

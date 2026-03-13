import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";

// Netlify Function: Fixtures
// Retrieves upcoming game fixtures for an athlete
// Endpoint: /api/fixtures
//
// REFACTORED: Uses base-handler, db-query-helper, and response-helper utilities
// Reduced from 94 lines to 45 lines (52% reduction)

import { supabaseAdmin } from "./supabase-client.js";

import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse } from "./utils/error-handler.js";
import { calculateDateRange } from "./utils/db-query-helper.js";
import { successResponse } from "./utils/response-helper.js";
import { getUserRole } from "./utils/authorization-guard.js";

const STAFF_ROLES = new Set(["coach", "assistant_coach", "head_coach", "admin"]);

function isValidId(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 128 &&
    /^[A-Za-z0-9_-]+$/.test(value.trim())
  );
}

function parseRequestedAthleteId(event, userId) {
  const rawAthleteId = event.queryStringParameters?.athleteId;
  if (!rawAthleteId) {
    return { athleteId: userId };
  }
  if (!isValidId(rawAthleteId)) {
    return { error: "athleteId must be a non-empty alphanumeric identifier" };
  }
  return { athleteId: rawAthleteId.trim() };
}

function parseDaysStrict(event) {
  const raw = event.queryStringParameters?.days;
  if (raw === undefined || raw === null || raw === "") {
    return { days: 14 };
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 365) {
    return { error: "days must be an integer between 1 and 365" };
  }
  return { days: parsed };
}

async function verifyAthleteAccess(requestUserId, athleteId) {
  if (athleteId === requestUserId) {
    return { authorized: true };
  }

  const role = await getUserRole(requestUserId);
  if (!STAFF_ROLES.has(role)) {
    return { authorized: false };
  }

  const { data: requesterMembership, error: requesterError } = await supabaseAdmin
    .from("team_members")
    .select("team_id")
    .eq("user_id", requestUserId)
    .limit(1)
    .maybeSingle();
  if (requesterError || !requesterMembership?.team_id) {
    return { authorized: false };
  }

  const { data: targetMembership, error: targetError } = await supabaseAdmin
    .from("team_members")
    .select("team_id")
    .eq("user_id", athleteId)
    .limit(1)
    .maybeSingle();
  if (targetError || !targetMembership?.team_id) {
    return { authorized: false };
  }

  return { authorized: targetMembership.team_id === requesterMembership.team_id };
}

/**
 * Get upcoming fixtures for an athlete
 */
const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "fixtures",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true, // Explicit auth requirement for user fixture data
    handler: async (event, context, { userId, requestId }) => {
      try {
        const athleteParse = parseRequestedAthleteId(event, userId);
        if (athleteParse.error) {
          return createErrorResponse(
            athleteParse.error,
            422,
            "validation_error",
            requestId,
          );
        }
        const athleteId = athleteParse.athleteId;

        const daysParse = parseDaysStrict(event);
        if (daysParse.error) {
          return createErrorResponse(
            daysParse.error,
            422,
            "validation_error",
            requestId,
          );
        }
        const days = daysParse.days;

        const access = await verifyAthleteAccess(userId, athleteId);
        if (!access.authorized) {
          return createErrorResponse(
            "Not authorized to view fixtures for this athlete",
            403,
            "authorization_error",
            requestId,
          );
        }
        const { endDate } = calculateDateRange(days, true); // Forward-looking

        // Get fixtures (either athlete-specific or team-based)
        const { data, error } = await supabaseAdmin
          .from("fixtures")
          .select("*")
          .or(`athlete_id.eq.${athleteId},athlete_id.is.null`)
          .gte("game_start", new Date().toISOString())
          .lte("game_start", endDate.toISOString())
          .order("game_start", { ascending: true });

        if (error) {
          console.error("[fixtures] Database error:", error);
          return createErrorResponse(
            "Failed to retrieve fixtures",
            500,
            "database_error",
            requestId,
          );
        }

        return successResponse(data || []);
      } catch (error) {
        console.error("[fixtures] Unexpected handler error:", error);
        return createErrorResponse(
          "Failed to retrieve fixtures",
          500,
          "database_error",
          requestId,
        );
      }
    },
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);

import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";

// Netlify Function: Compute ACWR
// Computes ACWR using the stored procedure
// Endpoint: /api/compute-acwr

import { supabaseAdmin } from "./supabase-client.js";

import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidAthleteId(value) {
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
  if (!["coach", "assistant_coach", "head_coach", "admin"].includes(role)) {
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

  const { data: athleteMembership, error: athleteError } = await supabaseAdmin
    .from("team_members")
    .select("team_id")
    .eq("user_id", athleteId)
    .limit(1)
    .maybeSingle();

  if (athleteError || !athleteMembership?.team_id) {
    return { authorized: false };
  }

  return { authorized: athleteMembership.team_id === requesterMembership.team_id };
}

/**
 * Compute ACWR for an athlete
 */
const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "compute-acwr",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      let body;
      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        return createErrorResponse(
          "Invalid JSON in request body",
          400,
          "invalid_json",
          requestId,
        );
      }

      if (!isPlainObject(body)) {
        return createErrorResponse(
          "Request body must be an object",
          422,
          "validation_error",
          requestId,
        );
      }

      // If athleteId not provided, use authenticated user's ID
      const { athleteId = userId } = body;

      if (!athleteId || !isValidAthleteId(athleteId)) {
        return createErrorResponse(
          "athleteId must be a non-empty alphanumeric identifier",
          422,
          "validation_error",
          requestId,
        );
      }

      const access = await verifyAthleteAccess(userId, athleteId);
      if (!access.authorized) {
        return createErrorResponse(
          "Not authorized to compute ACWR for this athlete",
          403,
          "authorization_error",
          requestId,
        );
      }

      // Call the stored procedure
      const { data, error } = await supabaseAdmin.rpc("compute_acwr", {
        athlete: athleteId,
      });

      if (error) {
        console.error("Database error:", error);
        return createErrorResponse(
          `Failed to compute ACWR: ${error.message}`,
          500,
          "database_error",
          requestId,
        );
      }

      return createSuccessResponse({ data: data || [] }, requestId);
    },
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);

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
import { hasAnyRole, LOAD_MANAGEMENT_ACCESS_ROLES } from "./utils/role-sets.js";

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

async function getActiveTeamMembership(userId) {
  const { data, error } = await supabaseAdmin
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.team_id || null;
}

function toFixtureTimestamp(fixture) {
  const datePart = typeof fixture.fixture_date === "string"
    ? fixture.fixture_date
    : null;
  if (!datePart) {
    return null;
  }

  const rawTime = typeof fixture.fixture_time === "string"
    ? fixture.fixture_time.trim()
    : "";
  const normalizedTime =
    rawTime && /^\d{2}:\d{2}(:\d{2})?$/.test(rawTime)
      ? rawTime.length === 5
        ? `${rawTime}:00`
        : rawTime
      : "12:00:00";

  return `${datePart}T${normalizedTime}`;
}

async function verifyAthleteAccess(requestUserId, athleteId) {
  if (athleteId === requestUserId) {
    return {
      authorized: true,
      teamId: await getActiveTeamMembership(requestUserId),
    };
  }

  const role = await getUserRole(requestUserId);
  if (!hasAnyRole(role, LOAD_MANAGEMENT_ACCESS_ROLES)) {
    return { authorized: false };
  }

  const requesterTeamId = await getActiveTeamMembership(requestUserId);
  if (!requesterTeamId) {
    return { authorized: false };
  }

  const targetTeamId = await getActiveTeamMembership(athleteId);
  if (!targetTeamId) {
    return { authorized: false };
  }

  return {
    authorized: targetTeamId === requesterTeamId,
    teamId: targetTeamId,
  };
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
        if (!access.teamId) {
          return successResponse([]);
        }
        const { endDate } = calculateDateRange(days, true); // Forward-looking
        const startDate = new Date().toISOString().slice(0, 10);
        const endDateString = endDate.toISOString().slice(0, 10);

        // Fixtures are stored per team in production schema.
        const { data, error } = await supabaseAdmin
          .from("fixtures")
          .select("*")
          .eq("team_id", access.teamId)
          .gte("fixture_date", startDate)
          .lte("fixture_date", endDateString)
          .order("fixture_date", { ascending: true });

        if (error) {
          console.error("[fixtures] Database error:", error);
          return createErrorResponse(
            "Failed to retrieve fixtures",
            500,
            "database_error",
            requestId,
          );
        }

        const normalizedFixtures = (data || []).map((fixture) => ({
          ...fixture,
          game_start: toFixtureTimestamp(fixture),
          opponent_name: fixture.opponent_team_name || null,
          is_home_game: fixture.is_home ?? null,
        }));

        return successResponse(normalizedFixtures);
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

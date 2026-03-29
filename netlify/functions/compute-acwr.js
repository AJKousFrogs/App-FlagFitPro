import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";

// Netlify Function: Compute ACWR
// Computes ACWR using the stored procedure
// Endpoint: /api/compute-acwr

import { supabaseAdmin } from "./supabase-client.js";

import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { hasAnyRole, LOAD_MANAGEMENT_ACCESS_ROLES } from "./utils/role-sets.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

function asFiniteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function computeSessionLoad(session) {
  if (Number.isFinite(Number(session?.workload))) {
    return asFiniteNumber(session.workload);
  }

  const rpe = asFiniteNumber(session?.rpe);
  const durationMinutes = asFiniteNumber(session?.duration_minutes);
  if (rpe > 0 && durationMinutes > 0) {
    return Math.round(rpe * durationMinutes * 100) / 100;
  }

  return 0;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function calculateSeriesFromSessions(sessions, rangeDays = 42) {
  const dailyLoads = new Map();
  for (const session of sessions || []) {
    const date = session?.session_date;
    if (!date) {
      continue;
    }
    const current = dailyLoads.get(date) || 0;
    dailyLoads.set(date, current + computeSessionLoad(session));
  }

  const endDate =
    sessions && sessions.length > 0
      ? new Date(sessions[0].session_date)
      : new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (rangeDays - 1));

  const rows = [];
  for (
    let cursor = new Date(startDate);
    cursor <= endDate;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const sessionDate = formatDate(cursor);
    const load = Math.round((dailyLoads.get(sessionDate) || 0) * 100) / 100;

    const acuteLoads = [];
    const chronicLoads = [];
    for (let offset = 0; offset < 7; offset += 1) {
      const day = new Date(cursor);
      day.setDate(day.getDate() - offset);
      acuteLoads.push(dailyLoads.get(formatDate(day)) || 0);
    }
    for (let offset = 0; offset < 28; offset += 1) {
      const day = new Date(cursor);
      day.setDate(day.getDate() - offset);
      chronicLoads.push(dailyLoads.get(formatDate(day)) || 0);
    }

    const acuteLoad =
      Math.round(
        (acuteLoads.reduce((sum, value) => sum + value, 0) / acuteLoads.length) *
          100,
      ) / 100;
    const chronicLoad =
      Math.round(
        (chronicLoads.reduce((sum, value) => sum + value, 0) /
          chronicLoads.length) *
          100,
      ) / 100;

    rows.push({
      session_date: sessionDate,
      load,
      acute_load: acuteLoad,
      chronic_load: chronicLoad,
      acwr:
        chronicLoad > 0
          ? Math.round((acuteLoad / chronicLoad) * 1000) / 1000
          : null,
    });
  }

  return rows;
}

async function fetchTrainingSessionsForAcwr(athleteId) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 41);

  const { data, error } = await supabaseAdmin
    .from("training_sessions")
    .select("session_date, duration_minutes, rpe, workload, status")
    .or(`user_id.eq.${athleteId},athlete_id.eq.${athleteId}`)
    .gte("session_date", formatDate(startDate))
    .order("session_date", { ascending: false });

  if (error) {
    return { data: [], error };
  }

  return {
    data: (data || []).filter(
      (session) =>
        session?.session_date &&
        (!session.status || `${session.status}`.toLowerCase() === "completed"),
    ),
    error: null,
  };
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
  if (!hasAnyRole(role, LOAD_MANAGEMENT_ACCESS_ROLES)) {
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
        body = parseJsonObjectBody(event.body);
      } catch (error) {
        if (error?.message === "Request body must be an object") {
          return createErrorResponse(
            "Request body must be an object",
            422,
            "validation_error",
            requestId,
          );
        }
        return createErrorResponse(
          "Invalid JSON in request body",
          400,
          "invalid_json",
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

      const sessionsResult = await fetchTrainingSessionsForAcwr(athleteId);
      if (sessionsResult.error) {
        console.error("Database error:", sessionsResult.error);
        return createErrorResponse(
          "Failed to compute ACWR",
          500,
          "database_error",
          requestId,
        );
      }

      // Call the stored procedure for the current-point summary when available.
      const { data: rpcData, error } = await supabaseAdmin.rpc("compute_acwr", {
        athlete: athleteId,
      });

      if (error) {
        console.error("Database error:", error);
      }

      const series = calculateSeriesFromSessions(sessionsResult.data || []);
      return createSuccessResponse(
        {
          data: series,
          summary: {
            athleteId,
            current_acwr:
              rpcData === null || rpcData === undefined
                ? series.at(-1)?.acwr ?? null
                : rpcData,
            acute_load: series.at(-1)?.acute_load ?? null,
            chronic_load: series.at(-1)?.chronic_load ?? null,
            latest_session_date: series.at(-1)?.session_date ?? null,
          },
        },
        requestId,
      );
    },
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);

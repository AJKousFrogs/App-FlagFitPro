
// Netlify Function: Compute ACWR
// Computes ACWR using the stored procedure
// Endpoint: /api/compute-acwr

import { supabaseAdmin } from "./supabase-client.js";

import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { hasAnyRole, LOAD_MANAGEMENT_ACCESS_ROLES } from "./utils/role-sets.js";
import { sharesStaffedTeam } from "./utils/team-scope.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";
import { createLogger, makeRequestLogger } from "./utils/structured-logger.js";
import { computeAcwrAt, computeSessionLoad } from "./utils/acwr.js";

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

    // Canonical EWMA + uncoupled ACWR (single source of truth in utils/acwr.js).
    const { acuteLoad, chronicLoad, acwr } = computeAcwrAt(dailyLoads, cursor);

    rows.push({
      session_date: sessionDate,
      load,
      acute_load: acuteLoad,
      chronic_load: chronicLoad,
      acwr,
    });
  }

  return rows;
}

const logger = createLogger({ service: "netlify.compute-acwr" });

const createRequestLogger = makeRequestLogger(logger);

async function fetchTrainingSessionsForAcwr(athleteId) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 41);

  const { data, error } = await supabaseAdmin
    .from("training_sessions")
    .select("session_date, duration_minutes, rpe, workload, status")
    .eq("user_id", athleteId)
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

  // Staff may read an athlete's load only when they share an active team —
  // intersection across ALL memberships (multi-team safe).
  const { shared } = await sharesStaffedTeam(requestUserId, athleteId, {
    roles: LOAD_MANAGEMENT_ACCESS_ROLES,
  });
  return { authorized: shared };
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
    handler: async (event, _context, { userId, requestId, correlationId }) => {
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

      const requestLogger = createRequestLogger(event, {
        requestId,
        correlationId,
      });

      const sessionsResult = await fetchTrainingSessionsForAcwr(athleteId);
      if (sessionsResult.error) {
        requestLogger.error("acwr_training_sessions_fetch_failed", sessionsResult.error, {
          athlete_id: athleteId,
        });
        return createErrorResponse(
          "Failed to compute ACWR",
          500,
          "database_error",
          requestId,
        );
      }

      // ACWR (current + series) comes from the canonical EWMA util so the summary
      // and the series are always consistent. The legacy `compute_acwr` Postgres
      // stored procedure used a coupled rolling average and is superseded; it
      // should be dropped in a migration (tracked as a data-layer decision).
      const series = calculateSeriesFromSessions(sessionsResult.data || []);
      return createSuccessResponse(
        {
          data: series,
          summary: {
            athleteId,
            current_acwr: series.at(-1)?.acwr ?? null,
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

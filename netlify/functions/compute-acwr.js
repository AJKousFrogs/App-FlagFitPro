// Netlify Function: Compute ACWR
// Computes ACWR using the stored procedure
// Endpoint: /api/compute-acwr

import { supabaseAdmin } from "./supabase-client.js";

import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { hasAnyRole, LOAD_MANAGEMENT_ACCESS_ROLES } from "./utils/role-sets.js";
import { sharesStaffedTeam } from "./utils/team-scope.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import { createLogger, makeRequestLogger } from "./utils/structured-logger.js";
import {
  computeAcwrAt,
  computeSessionLoad,
  resolveAcwrEvaluationDate,
} from "./utils/acwr.js";

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function calculateSeriesFromSessions(sessions, rangeDays = 42, asOfDate = null) {
  const dailyLoads = new Map();
  for (const session of sessions || []) {
    const date = session?.session_date;
    if (!date) {
      continue;
    }
    const current = dailyLoads.get(date) || 0;
    dailyLoads.set(date, current + computeSessionLoad(session));
  }

  const naturalEndDate =
    sessions && sessions.length > 0
      ? new Date(sessions[0].session_date)
      : new Date();
  // A frozen (paused, ACWR-freezing-on) athlete's series must not advance
  // past the pause moment, same reasoning as calc-readiness.js — never
  // LATER than the natural end date, only ever capped earlier.
  const endDate =
    asOfDate && new Date(asOfDate) < naturalEndDate
      ? new Date(asOfDate)
      : naturalEndDate;
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
    const { acuteLoad, chronicLoad, acwr, confidence, state } = computeAcwrAt(
      dailyLoads,
      cursor,
    );

    rows.push({
      session_date: sessionDate,
      load,
      acute_load: acuteLoad,
      chronic_load: chronicLoad,
      acwr,
      // Graded trust (audit C2/C3): "high"|"medium"|"low" confidence, and
      // state "building_base" ⇒ acwr is null by design (return-to-training
      // ramp guidance, not a floored ratio).
      confidence,
      state,
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
      const parsedBody = tryParseJsonObjectBody(event.body, { requestId });
      if (!parsedBody.ok) {
        return parsedBody.error;
      }
      body = parsedBody.data;

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
        requestLogger.error(
          "acwr_training_sessions_fetch_failed",
          sessionsResult.error,
          {
            athlete_id: athleteId,
          },
        );
        return createErrorResponse(
          "Failed to compute ACWR",
          500,
          "database_error",
          requestId,
        );
      }

      const acwrEvalDate = await resolveAcwrEvaluationDate(
        supabaseAdmin,
        athleteId,
        new Date(),
      );

      // ACWR (current + series) comes from the canonical EWMA util so the summary
      // and the series are always consistent. The legacy `compute_acwr` Postgres
      // stored procedure used a coupled rolling average and is superseded; it
      // should be dropped in a migration (tracked as a data-layer decision).
      const series = calculateSeriesFromSessions(
        sessionsResult.data || [],
        42,
        acwrEvalDate,
      );
      return createSuccessResponse(
        {
          data: series,
          summary: {
            athleteId,
            current_acwr: series.at(-1)?.acwr ?? null,
            acwr_confidence: series.at(-1)?.confidence ?? null,
            acwr_state: series.at(-1)?.state ?? null,
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

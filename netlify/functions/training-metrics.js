// Netlify Function: Training Metrics
// Retrieves flag-football metrics for an athlete
// Endpoint: /api/training-metrics
//
// REFACTORED: Uses base-handler, db-query-helper, and response-helper utilities
// Reduced from 98 lines to 50 lines (49% reduction)

import { supabaseAdmin } from "./supabase-client.js";

import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse } from "./utils/error-handler.js";
import { parseAthleteId, parseDateParam } from "./utils/db-query-helper.js";
import { successResponse } from "./utils/response-helper.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { hasAnyRole, LOAD_MANAGEMENT_ACCESS_ROLES } from "./utils/role-sets.js";
import { sharesStaffedTeam } from "./utils/team-scope.js";
import { computeSessionLoad } from "./utils/acwr.js";
import { createLogger, makeRequestLogger } from "./utils/structured-logger.js";

function isOptionalSchemaError(error) {
  const code = error?.code;
  const message = `${error?.message || ""}`.toLowerCase();
  return (
    ["PGRST106", "PGRST116", "PGRST204", "42P01", "42703"].includes(code) ||
    message.includes("relation") ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("column")
  );
}

function asFiniteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeCanonicalMetricRow(row) {
  const metrics = row?.session_metrics || {};
  return {
    date: row.session_date,
    total_volume: asFiniteNumber(metrics.total_volume),
    high_speed_distance: asFiniteNumber(metrics.high_speed_distance),
    sprint_count: Math.round(asFiniteNumber(metrics.sprint_count)),
    duration_minutes: asFiniteNumber(row.duration_minutes),
    session_load: computeSessionLoad(row),
    data_source: metrics.data_source || "training_session",
  };
}

async function fetchCanonicalMetrics(athleteId, startDate) {
  let query = supabaseAdmin
    .from("training_sessions")
    .select(
      "session_date, duration_minutes, rpe, workload, session_metrics, status",
    )
    .eq("user_id", athleteId)
    .order("session_date", { ascending: false });

  if (startDate) {
    query = query.gte("session_date", startDate.toISOString().slice(0, 10));
  }

  const { data, error } = await query;
  if (error) {
    return { data: [], error };
  }

  const normalized = (data || [])
    .filter(
      (row) =>
        row?.session_date &&
        (!row.status || `${row.status}`.toLowerCase() === "completed"),
    )
    .map(normalizeCanonicalMetricRow)
    .filter(
      (row) =>
        row.total_volume > 0 ||
        row.high_speed_distance > 0 ||
        row.sprint_count > 0,
    );

  return { data: normalized, error: null };
}

/**
 * Get training metrics for an athlete
 */
const logger = createLogger({ service: "netlify.training-metrics" });

const createRequestLogger = makeRequestLogger(logger);

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "training-metrics",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true, // Explicit auth requirement for training metrics
    handler: async (event, context, { userId, requestId, correlationId }) => {
      const requestLogger = createRequestLogger(event, {
        requestId,
        correlationId,
      });
      let athleteIdForLog = userId;
      try {
        // Parse query parameters
        const { valid, athleteId, error } = parseAthleteId(event, userId);
        athleteIdForLog = athleteId;
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

        // Cross-athlete reads are restricted to staff who share an active team
        // with the athlete (intersection across all memberships, multi-team safe).
        if (athleteId !== userId) {
          const role = await getUserRole(userId);
          if (!hasAnyRole(role, LOAD_MANAGEMENT_ACCESS_ROLES)) {
            return createErrorResponse(
              "Not authorized to view another athlete's metrics",
              403,
              "authorization_error",
              requestId,
            );
          }

          const { shared } = await sharesStaffedTeam(userId, athleteId, {
            roles: LOAD_MANAGEMENT_ACCESS_ROLES,
          });
          if (!shared) {
            return createErrorResponse(
              "Not authorized to view another athlete's metrics",
              403,
              "authorization_error",
              requestId,
            );
          }
        }

        const startDate = parseDateParam(event, "startDate", null);

        const canonicalResult = await fetchCanonicalMetrics(
          athleteId,
          startDate,
        );
        if (
          canonicalResult.error &&
          !isOptionalSchemaError(canonicalResult.error)
        ) {
          return createErrorResponse(
            "Failed to retrieve metrics",
            500,
            "database_error",
            requestId,
          );
        }

        const mergedByDate = new Map();
        for (const row of canonicalResult.data || []) {
          mergedByDate.set(row.date, row);
        }

        return successResponse(
          Array.from(mergedByDate.values()).sort((left, right) =>
            right.date.localeCompare(left.date),
          ),
        );
      } catch (error) {
        requestLogger.error("training_metrics_handler_error", error, {
          user_id: userId,
          athlete_id: athleteIdForLog,
        });
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
export { handler };

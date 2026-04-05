import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";

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
import { buildRequestLogContext, createLogger } from "./utils/structured-logger.js";

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
    session_load: asFiniteNumber(
      row.workload,
      asFiniteNumber(row.rpe) * asFiniteNumber(row.duration_minutes),
    ),
    data_source: metrics.data_source || "training_session",
  };
}

function normalizeLegacyMetricRow(row) {
  return {
    date: row.date,
    total_volume: asFiniteNumber(row.total_volume),
    high_speed_distance: asFiniteNumber(row.high_speed_distance),
    sprint_count: Math.round(asFiniteNumber(row.sprint_count)),
    duration_minutes: asFiniteNumber(row.duration_minutes),
    session_load: asFiniteNumber(
      row.workload,
      asFiniteNumber(row.rpe) * asFiniteNumber(row.duration_minutes),
    ),
    data_source: row.data_source || "legacy_session",
  };
}

async function fetchCanonicalMetrics(athleteId, startDate) {
  let query = supabaseAdmin
    .from("training_sessions")
    .select(
      "session_date, duration_minutes, rpe, workload, session_metrics, status",
    )
    .or(`user_id.eq.${athleteId},athlete_id.eq.${athleteId}`)
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

async function fetchLegacyMetrics(athleteId, startDate) {
  let query = supabaseAdmin
    .from("sessions")
    .select(
      "date, total_volume, high_speed_distance, sprint_count, duration_minutes, workload, rpe, data_source",
    )
    .eq("athlete_id", athleteId)
    .order("date", { ascending: false });

  if (startDate) {
    query = query.gte("date", startDate.toISOString().slice(0, 10));
  }

  const { data, error } = await query;
  if (error) {
    return { data: [], error };
  }

  return {
    data: (data || []).map(normalizeLegacyMetricRow),
    error: null,
  };
}

/**
 * Get training metrics for an athlete
 */
const logger = createLogger({ service: "netlify.training-metrics" });

function createRequestLogger(event, meta = {}) {
  return logger.child(
    buildRequestLogContext(event, {
      request_id: meta.requestId,
      correlation_id: meta.correlationId,
      trace_id: meta.traceId ?? meta.correlationId,
    }),
  );
}

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

        // Cross-athlete reads are restricted to staff with team relationship.
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

          const { data: actorTeamMemberships, error: actorTeamsError } =
            await supabaseAdmin
              .from("team_members")
              .select("team_id")
              .eq("user_id", userId)
              .eq("status", "active")
              .in("role", LOAD_MANAGEMENT_ACCESS_ROLES);
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
              .eq("status", "active")
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

        const canonicalResult = await fetchCanonicalMetrics(athleteId, startDate);
        if (canonicalResult.error && !isOptionalSchemaError(canonicalResult.error)) {
          return createErrorResponse(
            "Failed to retrieve metrics",
            500,
            "database_error",
            requestId,
          );
        }

        const legacyResult = await fetchLegacyMetrics(athleteId, startDate);
        if (legacyResult.error && !isOptionalSchemaError(legacyResult.error)) {
          return createErrorResponse(
            "Failed to retrieve metrics",
            500,
            "database_error",
            requestId,
          );
        }

        const mergedByDate = new Map();
        for (const row of legacyResult.data || []) {
          mergedByDate.set(row.date, row);
        }
        for (const row of canonicalResult.data || []) {
          mergedByDate.set(row.date, row);
        }

        return successResponse(
          Array.from(mergedByDate.values()).sort(
            (left, right) => right.date.localeCompare(left.date),
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
export default createRuntimeV2Handler(handler);

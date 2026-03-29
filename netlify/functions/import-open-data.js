import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";

// Netlify Function: Import Open Data
// Imports open-source sport-science datasets and computes flag-football metrics
// Endpoint: /api/import-open-data

import { supabaseAdmin } from "./supabase-client.js";

import { createSuccessResponse, createErrorResponse, handleValidationError } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { hasAnyRole, LOAD_MANAGEMENT_ACCESS_ROLES } from "./utils/role-sets.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

// Flag-football specific thresholds
const HIGH_SPEED_M_S = 5.5; // High-speed running threshold (m/s)
const SPRINT_M_S = 7.0; // Sprint threshold (m/s)
const MAX_DATASET_SIZE = 10000;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidId(value) {
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

  const { data: requesterMemberships, error: requesterError } = await supabaseAdmin
    .from("team_members")
    .select("team_id")
    .eq("user_id", requestUserId)
    .eq("status", "active");
  if (requesterError || !requesterMemberships?.length) {
    return { authorized: false };
  }

  const { data: targetMemberships, error: targetError } = await supabaseAdmin
    .from("team_members")
    .select("team_id")
    .eq("user_id", athleteId)
    .eq("status", "active");
  if (targetError || !targetMemberships?.length) {
    return { authorized: false };
  }

  const requesterTeamIds = new Set(
    requesterMemberships.map((membership) => membership.team_id).filter(Boolean),
  );
  const authorized = targetMemberships.some((membership) => requesterTeamIds.has(membership.team_id));

  return { authorized };
}

function validateDataset(dataset) {
  if (!Array.isArray(dataset)) {
    return "dataset must be an array";
  }
  if (dataset.length === 0) {
    return "dataset array cannot be empty";
  }
  if (dataset.length > MAX_DATASET_SIZE) {
    return `dataset cannot exceed ${MAX_DATASET_SIZE} entries`;
  }
  for (const entry of dataset) {
    if (!isPlainObject(entry)) {
      return "dataset entries must be objects";
    }
    const rawSpeed = entry.speed_m_s ?? entry.speed ?? 0;
    const rawDistance = entry.distance_m ?? entry.distance ?? 0;
    const speed = Number(rawSpeed);
    const distance = Number(rawDistance);
    if (!Number.isFinite(speed) || speed < 0 || speed > 20) {
      return "dataset speed values must be numbers between 0 and 20 m/s";
    }
    if (!Number.isFinite(distance) || distance < 0 || distance > 1000) {
      return "dataset distance values must be numbers between 0 and 1000 m";
    }
  }
  return null;
}

function asFiniteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function estimateSessionIntensity(metrics) {
  const totalVolume = asFiniteNumber(metrics.total_volume);
  const highSpeedDistance = asFiniteNumber(metrics.high_speed_distance);
  const sprintCount = asFiniteNumber(metrics.sprint_count);
  const durationMinutes = Math.max(asFiniteNumber(metrics.duration_minutes), 1);

  const highSpeedRatio = totalVolume > 0 ? highSpeedDistance / totalVolume : 0;
  const sprintRatePerMinute = sprintCount / durationMinutes;
  const weightedScore = 3.5 + highSpeedRatio * 6 + sprintRatePerMinute * 2.5;

  return Math.max(1, Math.min(10, Math.round(weightedScore)));
}

async function persistImportedSession({
  athleteId,
  metrics,
  dataset,
  sessionDate,
  sessionType,
  teamId,
  notes,
}) {
  const estimatedRpe = estimateSessionIntensity(metrics);
  const workload =
    metrics.duration_minutes > 0 ? estimatedRpe * metrics.duration_minutes : null;

  const rpcResult = await supabaseAdmin.rpc("log_training_session", {
    p_user_id: athleteId,
    p_session_date: sessionDate,
    p_session_type: sessionType,
    p_duration_minutes: Math.max(metrics.duration_minutes, 1),
    p_intensity_level: estimatedRpe,
    p_rpe: estimatedRpe,
    p_workload: workload,
    p_notes: notes,
    p_team_id: teamId,
    p_status: "completed",
  });

  if (rpcResult.error) {
    return { data: null, error: rpcResult.error };
  }

  const sessionRecord = Array.isArray(rpcResult.data)
    ? rpcResult.data[0]
    : rpcResult.data;
  const sessionId = sessionRecord?.session_id || sessionRecord?.id || null;

  if (!sessionId) {
    return {
      data: null,
      error: new Error("Training session import did not return a session id"),
    };
  }

  const { error: updateError } = await supabaseAdmin
    .from("training_sessions")
    .update({
      session_metrics: {
        total_volume: metrics.total_volume,
        high_speed_distance: metrics.high_speed_distance,
        sprint_count: metrics.sprint_count,
        duration_minutes: metrics.duration_minutes,
        estimated_rpe: estimatedRpe,
        data_source: "open_dataset",
        source_samples: dataset.length,
      },
      notes:
        notes ||
        `Imported open dataset (${dataset.length} samples, ${metrics.total_volume}m total volume)`,
    })
    .eq("id", sessionId);

  if (updateError) {
    return { data: null, error: updateError };
  }

  return {
    data: {
      id: sessionId,
      estimated_rpe: estimatedRpe,
      workload,
    },
    error: null,
  };
}

/**
 * Compute flag-football metrics from raw dataset
 * @param {Array} raw - Array of data entries with speed_m_s and distance_m
 * @returns {Object} Computed metrics
 */
function computeMetrics(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return {
      total_volume: 0,
      high_speed_distance: 0,
      sprint_count: 0,
      duration_minutes: 0,
    };
  }

  let totalDistance = 0;
  let highSpeedDistance = 0;
  let sprintCount = 0;

  raw.forEach((entry) => {
    const speed = Number(entry.speed_m_s ?? entry.speed ?? 0);
    const dist = Number(entry.distance_m ?? entry.distance ?? 0);
    if (!Number.isFinite(speed) || !Number.isFinite(dist) || dist < 0 || speed < 0) {
      return;
    }

    totalDistance += dist;

    if (speed >= HIGH_SPEED_M_S) {
      highSpeedDistance += dist;
    }

    if (speed >= SPRINT_M_S) {
      sprintCount++;
    }
  });

  // Duration estimation: assume 1 Hz sampling rate
  const durationMin = Math.round(raw.length / 60);

  return {
    total_volume: Math.round(totalDistance * 100) / 100, // Round to 2 decimals
    high_speed_distance: Math.round(highSpeedDistance * 100) / 100,
    sprint_count: sprintCount,
    duration_minutes: durationMin,
  };
}

/**
 * Import open dataset and compute metrics
 */
const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "import-open-data",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      // Parse request body
      let body;
      try {
        body = parseJsonObjectBody(event.body);
      } catch (error) {
        return handleValidationError(
          error.message === "Request body must be an object"
            ? error.message
            : "Invalid JSON in request body",
        );
      }

      // If athleteId not provided, use authenticated user's ID
      const {
        athleteId = userId,
        dataset,
        sessionDate,
        sessionType = "Imported Open Data",
        teamId = null,
        notes = null,
      } = body;

      // Validate required fields
      if (!isValidId(athleteId)) {
        return handleValidationError(
          "athleteId must be a non-empty alphanumeric identifier",
        );
      }

      const access = await verifyAthleteAccess(userId, athleteId);
      if (!access.authorized) {
        return createErrorResponse(
          "Not authorized to import data for this athlete",
          403,
          "authorization_error",
        );
      }

      const datasetValidationError = validateDataset(dataset);
      if (datasetValidationError) {
        return handleValidationError(datasetValidationError);
      }

      const normalizedSessionDate =
        typeof sessionDate === "string" && sessionDate.trim()
          ? sessionDate
          : new Date().toISOString().slice(0, 10);

      if (Number.isNaN(new Date(normalizedSessionDate).getTime())) {
        return handleValidationError("sessionDate must be a valid date string");
      }

      // Compute metrics from dataset
      const metrics = computeMetrics(dataset);
      const persistResult = await persistImportedSession({
        athleteId,
        metrics,
        dataset,
        sessionDate: normalizedSessionDate,
        sessionType,
        teamId,
        notes,
      });

      if (persistResult.error) {
        console.error("Database error:", persistResult.error);
        return createErrorResponse(
          "Failed to insert session",
          500,
          "database_error",
        );
      }

      return createSuccessResponse({
        ok: true,
        metrics,
        estimated_rpe: persistResult.data.estimated_rpe,
        workload: persistResult.data.workload,
        session_id: persistResult.data.id,
      });
    },
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);

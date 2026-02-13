// Netlify Function: Import Open Data
// Imports open-source sport-science datasets and computes flag-football metrics
// Endpoint: /api/import-open-data

import { supabaseAdmin } from "./supabase-client.js";

import { createSuccessResponse, createErrorResponse, handleValidationError } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";

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

const STAFF_ROLES = new Set(["coach", "assistant_coach", "head_coach", "admin"]);

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
export const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "import-open-data",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      // Parse request body
      let body;
      try {
        body = JSON.parse(event.body || "{}");
      } catch (_e) {
        return handleValidationError("Invalid JSON in request body");
      }

      if (!isPlainObject(body)) {
        return handleValidationError("Request body must be an object");
      }

      // If athleteId not provided, use authenticated user's ID
      const { athleteId = userId, dataset } = body;

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

      // Compute metrics from dataset
      const metrics = computeMetrics(dataset);

      // Insert into sessions table
      const { data, error } = await supabaseAdmin
        .from("sessions")
        .insert({
          athlete_id: athleteId,
          date: new Date().toISOString().slice(0, 10),
          rpe: 0, // Athletes fill this post-session
          total_volume: metrics.total_volume,
          high_speed_distance: metrics.high_speed_distance,
          sprint_count: metrics.sprint_count,
          duration_minutes: metrics.duration_minutes,
          data_source: "open_dataset",
          raw_data: dataset,
        })
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        return createErrorResponse(
          "Failed to insert session",
          500,
          "database_error",
        );
      }

      return createSuccessResponse({
        ok: true,
        metrics,
        session_id: data.id,
      });
    },
  });
};

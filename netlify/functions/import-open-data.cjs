// Netlify Function: Import Open Data
// Imports open-source sport-science datasets and computes flag-football metrics
// Endpoint: /api/import-open-data

const { supabaseAdmin } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleValidationError,
} = require("./utils/error-handler.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");

// Flag-football specific thresholds
const HIGH_SPEED_M_S = 5.5; // High-speed running threshold (m/s)
const SPRINT_M_S = 7.0; // Sprint threshold (m/s)

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
    const speed = entry.speed_m_s ?? entry.speed ?? 0;
    const dist = entry.distance_m ?? entry.distance ?? 0;

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
exports.handler = async (event, context) => {
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

      // If athleteId not provided, use authenticated user's ID
      const { athleteId = userId, dataset } = body;

      // Validate required fields
      if (!athleteId) {
        return handleValidationError("athleteId is required");
      }

      if (!dataset || !Array.isArray(dataset)) {
        return handleValidationError("dataset must be a non-empty array");
      }

      if (dataset.length === 0) {
        return handleValidationError("dataset array cannot be empty");
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
          `Failed to insert session: ${error.message}`,
          500,
          "database_error"
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

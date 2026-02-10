import { supabaseAdmin } from "./supabase-client.js";
import { authenticateRequest } from "./utils/auth-helper.js";
import { createErrorResponse, handleValidationError } from "./utils/error-handler.js";

export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  try {
    const auth = await authenticateRequest(event);
    if (!auth.success) {
      return { ...auth.error, headers };
    }
    const { user } = auth;
    const supabase = supabaseAdmin;

    const method = event.httpMethod;

    // GET - Get all cycles with player progress
    if (method === "GET") {
      return await getCycles(supabase, user.id, headers);
    }

    // POST - Update cycle status
    if (method === "POST") {
      let payload = {};
      try {
        payload = JSON.parse(event.body || "{}");
      } catch (_parseError) {
        return {
          ...handleValidationError("Invalid JSON in request body"),
          headers,
        };
      }
      return await updateCycleStatus(supabase, user.id, payload, headers);
    }

    return { ...createErrorResponse("Not found", 404, "not_found"), headers };
  } catch (error) {
    console.error("Program cycles error:", error);
    return {
      ...createErrorResponse(error.message, 500, "server_error"),
      headers,
    };
  }
};

async function getCycles(supabase, userId, headers) {
  // Get all program cycles
  const { data: cycles, error: cyclesError } = await supabase
    .from("program_cycles")
    .select("*")
    .eq("is_active", true)
    .order("cycle_order");

  if (cyclesError) {
    return {
      ...createErrorResponse(cyclesError.message, 500, "database_error"),
      headers,
    };
  }

  // Get player's progress for each cycle
  const { data: playerCycles, error: playerError } = await supabase
    .from("player_program_cycles")
    .select("*")
    .eq("user_id", userId);

  if (playerError && playerError.code !== "PGRST116") {
    console.warn("Error fetching player cycles:", playerError.message);
  }

  // Create a map of player progress
  const progressMap = new Map(
    (playerCycles || []).map((pc) => [pc.cycle_id, pc]),
  );

  // Combine cycles with player progress
  const result = cycles.map((cycle) => {
    const playerProgress = progressMap.get(cycle.id);

    // Determine status based on dates if not explicitly set
    let status = "not_started";
    const now = new Date();
    const startDate = new Date(cycle.start_date);
    const endDate = new Date(cycle.end_date);

    if (playerProgress) {
      ({ status } = playerProgress);
    } else if (now >= startDate && now <= endDate) {
      status = "in_progress";
    } else if (now > endDate) {
      // Past cycles without progress are considered incomplete
      status = "not_started";
    }

    return {
      id: playerProgress?.id || `temp-${cycle.id}`,
      cycle_id: cycle.id,
      status,
      started_at:
        playerProgress?.started_at ||
        (status === "in_progress" ? cycle.start_date : null),
      completed_at: playerProgress?.completed_at,
      completion_percentage: playerProgress?.completion_percentage || 0,
      notes: playerProgress?.notes,
      program_cycle: cycle,
    };
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, data: result }),
  };
}

async function updateCycleStatus(supabase, userId, payload, headers) {
  const { cycleId, status, completionPercentage, notes } = payload;

  if (!cycleId) {
    return { ...handleValidationError("cycleId required"), headers };
  }

  // Upsert player cycle progress
  const { data, error } = await supabase
    .from("player_program_cycles")
    .upsert(
      {
        user_id: userId,
        cycle_id: cycleId,
        status: status || "in_progress",
        completion_percentage: completionPercentage || 0,
        notes,
        started_at:
          status === "in_progress" ? new Date().toISOString() : undefined,
        completed_at:
          status === "completed" ? new Date().toISOString() : undefined,
      },
      {
        onConflict: "user_id,cycle_id",
      },
    )
    .select()
    .single();

  if (error) {
    return {
      ...createErrorResponse(error.message, 500, "database_error"),
      headers,
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, data }),
  };
}

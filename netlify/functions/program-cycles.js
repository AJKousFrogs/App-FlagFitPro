import { baseHandler } from "./utils/base-handler.js";
import {
  createErrorResponse,
  createSuccessResponse,
  handleValidationError,
} from "./utils/error-handler.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";

const VALID_STATUSES = new Set(["not_started", "in_progress", "completed"]);

function isUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "program-cycles",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId, supabase }) => {
      try {
        if (evt.httpMethod === "GET") {
          return getCycles(supabase, userId);
        }

        const parsedPayload = tryParseJsonObjectBody(evt.body);
        if (!parsedPayload.ok) {
          return parsedPayload.error;
        }
        const payload = parsedPayload.data;
        return updateCycleStatus(supabase, userId, payload);
      } catch (error) {
        console.error("Program cycles error:", error);
        return createErrorResponse(
          "Failed to process program cycles request",
          500,
          "server_error",
        );
      }
    },
  });

async function getCycles(supabase, userId) {
  // Get all program cycles
  const { data: cycles, error: cyclesError } = await supabase
    .from("program_cycles")
    .select("*")
    .eq("is_active", true)
    .order("cycle_order");

  if (cyclesError) {
    return createErrorResponse(
      "Failed to fetch program cycles",
      500,
      "database_error",
    );
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
  const result = (cycles || []).map((cycle) => {
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

  return createSuccessResponse(result);
}

async function updateCycleStatus(supabase, userId, payload) {
  const { cycleId, status, completionPercentage, notes } = payload;

  if (!isUuid(cycleId)) {
    return handleValidationError("cycleId must be a valid UUID");
  }
  if (status !== undefined && !VALID_STATUSES.has(status)) {
    return handleValidationError(
      "status must be one of: not_started, in_progress, completed",
    );
  }
  if (
    completionPercentage !== undefined &&
    (!Number.isFinite(completionPercentage) ||
      completionPercentage < 0 ||
      completionPercentage > 100)
  ) {
    return handleValidationError(
      "completionPercentage must be a number between 0 and 100",
    );
  }
  if (notes !== undefined && notes !== null && typeof notes !== "string") {
    return handleValidationError("notes must be a string");
  }

  // Upsert player cycle progress
  const { data, error } = await supabase
    .from("player_program_cycles")
    .upsert(
      {
        user_id: userId,
        cycle_id: cycleId,
        status: status || "in_progress",
        completion_percentage: completionPercentage ?? 0,
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
    return createErrorResponse(
      "Failed to update cycle status",
      500,
      "database_error",
    );
  }

  return createSuccessResponse(data);
}

export const testHandler = handler;
export { handler };

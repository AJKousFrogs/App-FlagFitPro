/**
 * Player Programs API
 *
 * Manages player-to-program assignments. This is the single source of truth
 * for which training program a user is assigned to.
 *
 * Endpoints:
 * - POST /api/player-programs          - Assign user to a program
 * - GET  /api/player-programs/me       - Get current active assignment for authenticated user
 * - PUT  /api/player-programs/:id      - Update assignment (switch program, change status)
 *
 * Program Mapping (initial):
 * - QB  -> Ljubljana Frogs QB Annual Program 2025-2026 (bbbbbbbb-...)
 * - Everyone else -> Ljubljana Frogs WR/DB Annual Program 2025-2026 (ffffffff-...)
 *
 * Constraints:
 * - Only ONE active program per player at a time
 * - Modifiers are applied at render/generation time, not persisted to templates
 *
 * Verification Steps:
 * 1. Create new user, choose QB → after onboarding, player_programs has active row for QB program
 * 2. Choose WR/DB → active row for WR/DB program
 * 3. Re-run onboarding → no duplicate active rows (idempotent)
 * 4. GET /api/player-programs/me returns correct assignment
 */

"use strict";

const { baseHandler } = require("./utils/base-handler.cjs");
const { getSupabaseClient } = require("./utils/auth-helper.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleValidationError,
  handleNotFoundError,
  handleConflictError,
  ErrorType,
} = require("./utils/error-handler.cjs");

// Program ID constants - these match the database
const PROGRAM_IDS = {
  QB: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", // Ljubljana Frogs QB Annual Program 2025-2026
  WRDB: "ffffffff-ffff-ffff-ffff-ffffffffffff", // Ljubljana Frogs WR/DB Annual Program 2025-2026
};

/**
 * Position mapping from UI values to modifier keys
 * Maps onboarding position values to position_exercise_modifiers.position values
 */
const POSITION_TO_MODIFIER_KEY = {
  QB: "quarterback",
  WR: "wr_db",
  DB: "wr_db",
  Center: "center",
  Rusher: "rusher",
  Blitzer: "blitzer",
  LB: "linebacker",
  Hybrid: "hybrid",
};

/**
 * Normalize position value to modifier key
 */
function normalizePositionForModifiers(position) {
  if (!position) {return "wr_db";}
  return POSITION_TO_MODIFIER_KEY[position] || "wr_db";
}

/**
 * Map position to program ID
 * QB gets the QB program, everyone else gets WR/DB program
 * (Centers, Rushers/Blitzers, DBs, WRs, LBs, Hybrids all use WR/DB base with modifiers)
 */
function getProgramIdForPosition(position) {
  if (position === "QB") {
    return PROGRAM_IDS.QB;
  }
  // All other positions use WR/DB base program
  // Modifiers handle position-specific adjustments at render time
  return PROGRAM_IDS.WRDB;
}

/**
 * Get user's active program assignment with program details
 */
async function getActiveAssignment(supabase, userId) {
  const { data, error } = await supabase
    .from("player_programs")
    .select(
      `
      id,
      player_id,
      program_id,
      status,
      start_date,
      end_date,
      current_week,
      current_phase_id,
      completion_percentage,
      modifications,
      notes,
      created_at,
      updated_at,
      training_programs!inner (
        id,
        name
      )
    `,
    )
    .eq("player_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("[player-programs] Error fetching assignment:", error);
    throw error;
  }

  if (!data) {
    return null;
  }

  // Transform to expected shape
  return {
    id: data.id,
    player_id: data.player_id,
    program_id: data.program_id,
    status: data.status,
    start_date: data.start_date,
    end_date: data.end_date,
    current_week: data.current_week,
    current_phase_id: data.current_phase_id,
    completion_percentage: data.completion_percentage,
    modifications: data.modifications,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
    program: {
      id: data.training_programs.id,
      name: data.training_programs.name,
    },
  };
}

/**
 * Handle POST /api/player-programs - Assign user to a program
 *
 * Body: { program_id?, start_date?, status?, force?: boolean }
 * - program_id: UUID of program (required)
 * - start_date: ISO date string (defaults to today)
 * - status: 'active' | 'paused' | 'completed' (defaults to 'active')
 * - force: If true and different program exists, auto-inactivate previous
 *
 * Behavior:
 * - If same program already active: idempotent success (return existing)
 * - If different program active and force=false: reject with 409
 * - If different program active and force=true: inactivate previous, create new
 */
async function handlePost(event, context, { userId }) {
  const supabase = getSupabaseClient();

  // Parse body
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return handleValidationError("Invalid JSON body");
  }

  const { program_id, start_date, status = "active", force = false } = body;

  // Validate program_id
  if (!program_id) {
    return handleValidationError("program_id is required");
  }

  // Validate status
  const validStatuses = ["active", "paused", "completed", "inactive"];
  if (!validStatuses.includes(status)) {
    return handleValidationError(
      `status must be one of: ${validStatuses.join(", ")}`,
    );
  }

  // Check if program exists
  const { data: programExists, error: programError } = await supabase
    .from("training_programs")
    .select("id, name")
    .eq("id", program_id)
    .single();

  if (programError || !programExists) {
    return handleNotFoundError("Training program");
  }

  // Check for existing active assignment
  const existingAssignment = await getActiveAssignment(supabase, userId);

  if (existingAssignment) {
    // Same program - idempotent success
    if (existingAssignment.program_id === program_id) {
      return createSuccessResponse(
        { assignment: existingAssignment },
        200,
        "Program already assigned",
      );
    }

    // Different program - check force flag
    if (!force) {
      return handleConflictError(
        `User already has active program "${existingAssignment.program.name}". ` +
          `Use force=true to switch programs, or PUT to update existing assignment.`,
      );
    }

    // Force switch: inactivate previous
    const today = new Date().toISOString().split("T")[0];
    const { error: inactivateError } = await supabase
      .from("player_programs")
      .update({
        status: "inactive",
        end_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingAssignment.id);

    if (inactivateError) {
      console.error(
        "[player-programs] Error inactivating previous:",
        inactivateError,
      );
      throw inactivateError;
    }

    console.log(
      `[player-programs] Inactivated previous assignment ${existingAssignment.id} for user ${userId}`,
    );
  }

  // Create new assignment
  const newAssignment = {
    player_id: userId,
    program_id,
    status,
    start_date: start_date || new Date().toISOString().split("T")[0],
    current_week: 1,
    completion_percentage: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: created, error: createError } = await supabase
    .from("player_programs")
    .insert(newAssignment)
    .select(
      `
      id,
      player_id,
      program_id,
      status,
      start_date,
      end_date,
      current_week,
      current_phase_id,
      completion_percentage,
      modifications,
      notes,
      created_at,
      updated_at,
      training_programs!inner (
        id,
        name
      )
    `,
    )
    .single();

  if (createError) {
    console.error("[player-programs] Error creating assignment:", createError);
    throw createError;
  }

  // Transform response
  const assignment = {
    id: created.id,
    player_id: created.player_id,
    program_id: created.program_id,
    status: created.status,
    start_date: created.start_date,
    end_date: created.end_date,
    current_week: created.current_week,
    current_phase_id: created.current_phase_id,
    completion_percentage: created.completion_percentage,
    modifications: created.modifications,
    notes: created.notes,
    created_at: created.created_at,
    updated_at: created.updated_at,
    program: {
      id: created.training_programs.id,
      name: created.training_programs.name,
    },
  };

  console.log(
    `[player-programs] Created assignment ${assignment.id} for user ${userId} -> program ${program_id}`,
  );

  return createSuccessResponse(
    { assignment },
    201,
    "Program assigned successfully",
  );
}

/**
 * Handle GET /api/player-programs/me - Get current active assignment
 */
async function handleGetMe(event, context, { userId }) {
  const supabase = getSupabaseClient();

  const assignment = await getActiveAssignment(supabase, userId);

  if (!assignment) {
    // No program assigned - return clear state for frontend
    return createSuccessResponse(
      {
        assignment: null,
        message: "No active program assigned",
      },
      200,
    );
  }

  return createSuccessResponse({ assignment });
}

/**
 * Handle PUT /api/player-programs/:id - Update assignment
 *
 * Body: { status?, end_date?, program_id?, notes?, modifications? }
 *
 * If program_id is provided and different from current:
 * - Set current assignment to inactive with end_date=today
 * - Create new active assignment with new program_id
 */
async function handlePut(event, context, { userId }) {
  const supabase = getSupabaseClient();

  // Extract assignment ID from path
  const pathParts = event.path.split("/");
  const assignmentId = pathParts[pathParts.length - 1];

  if (!assignmentId || assignmentId === "player-programs") {
    return handleValidationError("Assignment ID required in path");
  }

  // Parse body
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return handleValidationError("Invalid JSON body");
  }

  const { status, end_date, program_id, notes, modifications } = body;

  // Fetch existing assignment
  const { data: existing, error: fetchError } = await supabase
    .from("player_programs")
    .select("*")
    .eq("id", assignmentId)
    .eq("player_id", userId) // Security: user can only update own assignments
    .single();

  if (fetchError || !existing) {
    return handleNotFoundError("Assignment");
  }

  // If switching to a different program
  if (program_id && program_id !== existing.program_id) {
    // Verify new program exists
    const { data: newProgram, error: programError } = await supabase
      .from("training_programs")
      .select("id, name")
      .eq("id", program_id)
      .single();

    if (programError || !newProgram) {
      return handleNotFoundError("New training program");
    }

    const today = new Date().toISOString().split("T")[0];

    // Inactivate current assignment
    const { error: inactivateError } = await supabase
      .from("player_programs")
      .update({
        status: "inactive",
        end_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignmentId);

    if (inactivateError) {
      console.error(
        "[player-programs] Error inactivating for switch:",
        inactivateError,
      );
      throw inactivateError;
    }

    // Create new assignment
    const newAssignment = {
      player_id: userId,
      program_id,
      status: "active",
      start_date: today,
      current_week: 1,
      completion_percentage: 0,
      notes: notes || null,
      modifications: modifications || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: created, error: createError } = await supabase
      .from("player_programs")
      .insert(newAssignment)
      .select(
        `
        id,
        player_id,
        program_id,
        status,
        start_date,
        end_date,
        current_week,
        current_phase_id,
        completion_percentage,
        modifications,
        notes,
        created_at,
        updated_at,
        training_programs!inner (
          id,
          name
        )
      `,
      )
      .single();

    if (createError) {
      console.error(
        "[player-programs] Error creating switched assignment:",
        createError,
      );
      throw createError;
    }

    const assignment = {
      id: created.id,
      player_id: created.player_id,
      program_id: created.program_id,
      status: created.status,
      start_date: created.start_date,
      end_date: created.end_date,
      current_week: created.current_week,
      current_phase_id: created.current_phase_id,
      completion_percentage: created.completion_percentage,
      modifications: created.modifications,
      notes: created.notes,
      created_at: created.created_at,
      updated_at: created.updated_at,
      program: {
        id: created.training_programs.id,
        name: created.training_programs.name,
      },
    };

    console.log(
      `[player-programs] Switched user ${userId} from ${existing.program_id} to ${program_id}`,
    );

    return createSuccessResponse(
      { assignment },
      200,
      "Program switched successfully",
    );
  }

  // Simple update (no program switch)
  const updates = {
    updated_at: new Date().toISOString(),
  };

  if (status !== undefined) {
    const validStatuses = ["active", "paused", "completed", "inactive"];
    if (!validStatuses.includes(status)) {
      return handleValidationError(
        `status must be one of: ${validStatuses.join(", ")}`,
      );
    }
    updates.status = status;
  }

  if (end_date !== undefined) {
    updates.end_date = end_date;
  }

  if (notes !== undefined) {
    updates.notes = notes;
  }

  if (modifications !== undefined) {
    updates.modifications = modifications;
  }

  const { data: updated, error: updateError } = await supabase
    .from("player_programs")
    .update(updates)
    .eq("id", assignmentId)
    .select(
      `
      id,
      player_id,
      program_id,
      status,
      start_date,
      end_date,
      current_week,
      current_phase_id,
      completion_percentage,
      modifications,
      notes,
      created_at,
      updated_at,
      training_programs!inner (
        id,
        name
      )
    `,
    )
    .single();

  if (updateError) {
    console.error("[player-programs] Error updating assignment:", updateError);
    throw updateError;
  }

  const assignment = {
    id: updated.id,
    player_id: updated.player_id,
    program_id: updated.program_id,
    status: updated.status,
    start_date: updated.start_date,
    end_date: updated.end_date,
    current_week: updated.current_week,
    current_phase_id: updated.current_phase_id,
    completion_percentage: updated.completion_percentage,
    modifications: updated.modifications,
    notes: updated.notes,
    created_at: updated.created_at,
    updated_at: updated.updated_at,
    program: {
      id: updated.training_programs.id,
      name: updated.training_programs.name,
    },
  };

  return createSuccessResponse(
    { assignment },
    200,
    "Assignment updated successfully",
  );
}

/**
 * Main handler - routes requests to appropriate handler
 */
exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "player-programs",
    allowedMethods: ["GET", "POST", "PUT"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (event, context, authContext) => {
      const { httpMethod, path } = event;

      // Route: GET /api/player-programs/me
      if (httpMethod === "GET" && path.endsWith("/me")) {
        return handleGetMe(event, context, authContext);
      }

      // Route: POST /api/player-programs
      if (httpMethod === "POST") {
        return handlePost(event, context, authContext);
      }

      // Route: PUT /api/player-programs/:id
      if (httpMethod === "PUT") {
        return handlePut(event, context, authContext);
      }

      // Fallback for unmatched routes
      return createErrorResponse(
        "Route not found. Available: GET /me, POST /, PUT /:id",
        404,
        ErrorType.NOT_FOUND,
      );
    },
  });
};

// Export for testing and reuse
module.exports.PROGRAM_IDS = PROGRAM_IDS;
module.exports.POSITION_TO_MODIFIER_KEY = POSITION_TO_MODIFIER_KEY;
module.exports.getProgramIdForPosition = getProgramIdForPosition;
module.exports.normalizePositionForModifiers = normalizePositionForModifiers;


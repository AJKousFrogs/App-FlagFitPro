import { createErrorResponse, handleValidationError } from "./error-handler.js";
import { BLOCK_TYPES } from "./daily-protocol-periodization-config.js";

// Protocol progress mutations: complete/skip a single exercise or a whole block.
// Each verifies ownership (RLS also enforces) and returns a header-wrapped response.

/**
 * POST /api/daily-protocol/complete
 * Mark a single exercise as complete
 */
async function completeExercise(supabase, userId, payload, headers) {
  const { protocolExerciseId, actualSets, actualReps, actualHoldSeconds } =
    payload;

  if (!protocolExerciseId) {
    return { ...handleValidationError("protocolExerciseId required"), headers };
  }

  // Verify ownership first (RLS will enforce, but explicit check for clarity)
  const { data: exercise, error: fetchError } = await supabase
    .from("protocol_exercises")
    .select("*, daily_protocols!inner(user_id, protocol_date, id)")
    .eq("id", protocolExerciseId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Verify user owns this protocol (RLS should enforce, but double-check)
  if (exercise.daily_protocols.user_id !== userId) {
    return {
      ...createErrorResponse("Not authorized", 403, "authorization_error"),
      headers,
    };
  }

  // Idempotency: if already complete, treat as success and avoid duplicate completion logs.
  if (exercise.status === "complete") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, idempotent: true }),
    };
  }

  // Update the exercise (RLS ensures user can only update their own)
  const { data: updatedExercise, error: updateError } = await supabase
    .from("protocol_exercises")
    .update({
      status: "complete",
      completed_at: new Date().toISOString(),
      actual_sets: actualSets,
      actual_reps: actualReps,
      actual_hold_seconds: actualHoldSeconds,
    })
    .eq("id", protocolExerciseId)
    .neq("status", "complete")
    .select("id")
    .maybeSingle();

  if (updateError) {
    throw updateError;
  }

  // (Per-exercise completion ledger removed — protocol_completions was never created.
  // The exercise status update above is the source of truth; the protocol's load reaches
  // ACWR via the training_sessions log on completion. The DB trigger updates progress.)

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true }),
  };
}

/**
 * POST /api/daily-protocol/skip
 * Mark a single exercise as skipped
 */
async function skipExercise(supabase, userId, payload, headers) {
  const { protocolExerciseId, skipReason: _skipReason } = payload;

  if (!protocolExerciseId) {
    return { ...handleValidationError("protocolExerciseId required"), headers };
  }

  // Verify ownership first (RLS should enforce, explicit check improves error quality)
  const { data: exercise, error: fetchError } = await supabase
    .from("protocol_exercises")
    .select("id, daily_protocols!inner(user_id)")
    .eq("id", protocolExerciseId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  if (exercise.daily_protocols.user_id !== userId) {
    return {
      ...createErrorResponse("Not authorized", 403, "authorization_error"),
      headers,
    };
  }

  // Update the exercise
  const { error: updateError } = await supabase
    .from("protocol_exercises")
    .update({
      status: "skipped",
      completed_at: new Date().toISOString(),
    })
    .eq("id", protocolExerciseId);

  if (updateError) {
    throw updateError;
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true }),
  };
}

/**
 * POST /api/daily-protocol/complete-block
 * Mark all exercises in a block as complete
 */
async function completeBlock(supabase, userId, payload, headers) {
  const { protocolId, blockType } = payload;

  if (!protocolId || !blockType) {
    return {
      ...handleValidationError("protocolId and blockType required"),
      headers,
    };
  }

  if (!BLOCK_TYPES[blockType]) {
    return {
      ...handleValidationError("Invalid blockType"),
      headers,
    };
  }

  // Verify ownership
  const { data: protocol, error: verifyError } = await supabase
    .from("daily_protocols")
    .select("id, protocol_date")
    .eq("id", protocolId)
    .eq("user_id", userId)
    .single();

  if (verifyError || !protocol) {
    return {
      ...createErrorResponse("Not authorized", 403, "authorization_error"),
      headers,
    };
  }

  // Update all to complete
  const { error: updateError } = await supabase
    .from("protocol_exercises")
    .update({
      status: "complete",
      completed_at: new Date().toISOString(),
    })
    .eq("protocol_id", protocolId)
    .eq("block_type", blockType);

  if (updateError) {
    throw updateError;
  }

  // Update block status
  const blockStatusField = `${blockType}_status`;
  const blockCompletedField = `${blockType}_completed_at`;

  await supabase
    .from("daily_protocols")
    .update({
      [blockStatusField]: "complete",
      [blockCompletedField]: new Date().toISOString(),
    })
    .eq("id", protocolId);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true }),
  };
}

/**
 * POST /api/daily-protocol/skip-block
 * Mark all exercises in a block as skipped
 */
async function skipBlock(supabase, userId, payload, headers) {
  const { protocolId, blockType } = payload;

  if (!protocolId || !blockType) {
    return {
      ...handleValidationError("protocolId and blockType required"),
      headers,
    };
  }

  if (!BLOCK_TYPES[blockType]) {
    return {
      ...handleValidationError("Invalid blockType"),
      headers,
    };
  }

  // Verify ownership
  const { data: protocol, error: verifyError } = await supabase
    .from("daily_protocols")
    .select("id")
    .eq("id", protocolId)
    .eq("user_id", userId)
    .single();

  if (verifyError || !protocol) {
    return {
      ...createErrorResponse("Not authorized", 403, "authorization_error"),
      headers,
    };
  }

  // Update all to skipped
  const { error: updateError } = await supabase
    .from("protocol_exercises")
    .update({
      status: "skipped",
      completed_at: new Date().toISOString(),
    })
    .eq("protocol_id", protocolId)
    .eq("block_type", blockType);

  if (updateError) {
    throw updateError;
  }

  // Update block status
  const blockStatusField = `${blockType}_status`;
  await supabase
    .from("daily_protocols")
    .update({ [blockStatusField]: "skipped" })
    .eq("id", protocolId);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true }),
  };
}

export { completeExercise, skipExercise, completeBlock, skipBlock };

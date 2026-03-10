import crypto from "crypto";

export function buildProtocolGenerationIdempotencyKey({ userId, date }) {
  const keyInputs = {
    userId,
    date,
    timestamp: date,
  };

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(keyInputs))
    .digest("hex")
    .substring(0, 32);
}

export async function getExistingProtocolGenerationRequest(
  supabase,
  userId,
  date,
  idempotencyKey,
) {
  const { data } = await supabase
    .from("protocol_generation_requests")
    .select("status, protocol_id, error")
    .eq("user_id", userId)
    .eq("protocol_date", date)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  return data;
}

export async function createProtocolGenerationRequest(
  supabase,
  userId,
  date,
  idempotencyKey,
) {
  try {
    const { data: request, error } = await supabase
      .from("protocol_generation_requests")
      .insert({
        user_id: userId,
        protocol_date: date,
        idempotency_key: idempotencyKey,
        status: "pending",
      })
      .select()
      .single();

    if (!error) {
      return { requestRecord: request, existingCompleted: null, shouldContinue: true };
    }

    if (error.code === "23505") {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const { data: completedRequest } = await supabase
        .from("protocol_generation_requests")
        .select("status, protocol_id")
        .eq("user_id", userId)
        .eq("protocol_date", date)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      return {
        requestRecord: null,
        existingCompleted: completedRequest,
        shouldContinue: true,
      };
    }

    throw error;
  } catch (error) {
    console.warn(
      "[daily-protocol] Failed to record generation request:",
      error.message,
    );
    return { requestRecord: null, existingCompleted: null, shouldContinue: true };
  }
}

export async function updateProtocolGenerationRequestStatus(
  supabase,
  requestRecord,
  updates,
) {
  if (!requestRecord) {
    return;
  }

  await supabase
    .from("protocol_generation_requests")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestRecord.id);
}

function serializeProtocolExercises(protocolExercises) {
  return protocolExercises.map((ex) => ({
    exercise_id: ex.exercise_id,
    block_type: ex.block_type,
    sequence_order: ex.sequence_order,
    prescribed_sets: ex.prescribed_sets ?? null,
    prescribed_reps: ex.prescribed_reps ?? null,
    prescribed_hold_seconds: ex.prescribed_hold_seconds ?? null,
    prescribed_duration_seconds: ex.prescribed_duration_seconds ?? null,
    load_contribution_au: ex.load_contribution_au || 0,
    ai_note: ex.ai_note || null,
  }));
}

async function createProtocolWithoutRpc({
  supabase,
  userId,
  date,
  readinessScore,
  acwrValue,
  trainingFocus,
  aiRationale,
  adjustedLoadTarget,
  confidenceMetadata,
  exercisesJson,
}) {
  const persistedExercises = exercisesJson.filter((exercise) => exercise.exercise_id);

  if (persistedExercises.length === 0) {
    throw new Error("Cannot persist a protocol without exercise IDs");
  }

  const timestamp = new Date().toISOString();
  const { data: protocol, error: protocolError } = await supabase
    .from("daily_protocols")
    .insert({
      user_id: userId,
      protocol_date: date,
      readiness_score: readinessScore,
      acwr_value: acwrValue,
      training_focus: trainingFocus,
      ai_rationale: aiRationale,
      total_load_target_au: adjustedLoadTarget,
      confidence_metadata: confidenceMetadata,
      total_exercises: persistedExercises.length,
      completed_exercises: 0,
      overall_progress: 0,
      generated_at: timestamp,
      updated_at: timestamp,
    })
    .select("id")
    .single();

  if (protocolError) {
    throw protocolError;
  }

  const { error: exercisesError } = await supabase
    .from("protocol_exercises")
    .insert(
      persistedExercises.map((exercise) => ({
        protocol_id: protocol.id,
        exercise_id: exercise.exercise_id,
        block_type: exercise.block_type,
        sequence_order: exercise.sequence_order,
        prescribed_sets: exercise.prescribed_sets,
        prescribed_reps: exercise.prescribed_reps,
        prescribed_hold_seconds: exercise.prescribed_hold_seconds,
        prescribed_duration_seconds: exercise.prescribed_duration_seconds,
        load_contribution_au: exercise.load_contribution_au,
        ai_note: exercise.ai_note,
        status: "pending",
        created_at: timestamp,
        updated_at: timestamp,
      })),
    );

  if (exercisesError) {
    await supabase.from("daily_protocols").delete().eq("id", protocol.id);
    throw exercisesError;
  }

  return protocol.id;
}

export async function persistGeneratedProtocol({
  supabase,
  userId,
  date,
  readinessScore,
  acwrValue,
  trainingFocus,
  aiRationale,
  adjustedLoadTarget,
  confidenceMetadata,
  protocolExercises,
  requestRecord,
  headers,
  getProtocol,
}) {
  if (protocolExercises.length === 0) {
    await updateProtocolGenerationRequestStatus(supabase, requestRecord, {
      status: "failed",
      error: "No exercises generated",
    });
    throw new Error("Cannot create protocol without exercises");
  }

  const exercisesJson = serializeProtocolExercises(protocolExercises);

  let protocolId = null;
  const { data: rpcProtocolId, error: rpcError } = await supabase.rpc(
    "generate_protocol_transactional",
    {
      p_user_id: userId,
      p_protocol_date: date,
      p_readiness_score: readinessScore,
      p_acwr_value: acwrValue,
      p_training_focus: trainingFocus,
      p_ai_rationale: aiRationale,
      p_total_load_target_au: adjustedLoadTarget,
      p_confidence_metadata: confidenceMetadata,
      p_exercises: exercisesJson,
    },
  );

  if (rpcError) {
    if (rpcError.code !== "PGRST202") {
      await updateProtocolGenerationRequestStatus(supabase, requestRecord, {
        status: "failed",
        error: rpcError.message,
      });
      throw rpcError;
    }

    protocolId = await createProtocolWithoutRpc({
      supabase,
      userId,
      date,
      readinessScore,
      acwrValue,
      trainingFocus,
      aiRationale,
      adjustedLoadTarget,
      confidenceMetadata,
      exercisesJson,
    });
  } else {
    protocolId = rpcProtocolId;
  }

  await updateProtocolGenerationRequestStatus(supabase, requestRecord, {
    status: "completed",
    protocol_id: protocolId,
  });

  return getProtocol(supabase, userId, { date }, headers);
}

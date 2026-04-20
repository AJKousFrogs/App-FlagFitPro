export async function persistFallbackProtocolWhenExercisesMissing({
  supabase,
  userId,
  date,
  trainingFocus,
  context,
  isPracticeDay,
  isFilmRoomDay,
  readinessForLogic,
  readinessScore,
  acwrValue,
  aiRationale,
  adjustedLoadTarget,
  confidenceMetadata,
  requestRecord,
  headers,
  getIsoDayOfYear,
  generateFallbackProtocolExercises,
  persistGeneratedProtocol,
  buildTransientProtocolResponse,
}) {
  const { count: exerciseCount } = await supabase
    .from("exercises")
    .select("*", { count: "exact", head: true })
    .eq("active", true);

  if (exerciseCount && exerciseCount >= 10) {
    return null;
  }

  console.log("[daily-protocol] No exercises found in DB - using inline fallback");

  const dayOfYear = getIsoDayOfYear(date);
  const weekNumber = Math.ceil(dayOfYear / 7);

  const fallbackExercises = await generateFallbackProtocolExercises(
    null,
    dayOfYear,
    weekNumber,
    trainingFocus,
    context,
    isPracticeDay,
    isFilmRoomDay,
    readinessForLogic,
  );

  if (!fallbackExercises.length) {
    return null;
  }

  const protocolExercises = fallbackExercises.map((ex) => ({
    exercise_id: ex.exercise_id,
    block_type: ex.block_type,
    sequence_order: ex.sequence_order,
    prescribed_sets: ex.prescribed_sets,
    prescribed_reps: ex.prescribed_reps || null,
    prescribed_hold_seconds: ex.prescribed_hold_seconds || null,
    prescribed_duration_seconds: ex.prescribed_duration_seconds || null,
    load_contribution_au: ex.load_contribution_au || 0,
    ai_note: ex.ai_note || null,
    video_url: ex.video_url || null,
  }));

  const hasPersistableExercises = protocolExercises.some(
    (ex) => ex.exercise_id,
  );

  if (!hasPersistableExercises && buildTransientProtocolResponse) {
    return buildTransientProtocolResponse({
      userId,
      date,
      readinessScore,
      acwrValue,
      trainingFocus,
      aiRationale,
      adjustedLoadTarget,
      confidenceMetadata,
      protocolExercises,
      headers,
      sessionResolution: context.sessionResolution || null,
    });
  }

  return persistGeneratedProtocol({
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
  });
}

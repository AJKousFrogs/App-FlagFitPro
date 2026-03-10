export async function generateTemplateMainSession({
  supabase,
  userId,
  protocolExercises,
  context,
  readinessForLogic,
  acwrForLogic,
}) {
  if (!context.sessionTemplate) {
    return false;
  }

  const { data: sessionExercises } = await supabase
    .from("session_exercises")
    .select(
      `
      *,
      exercises (
        id, name, slug, category, video_url, video_id, thumbnail_url,
        how_text, feel_text, compensation_text, load_contribution_au
      )
    `,
    )
    .eq("session_template_id", context.sessionTemplate.id)
    .order("exercise_order");

  if (!sessionExercises || sessionExercises.length === 0) {
    return false;
  }

  const previousPerformance = await loadPreviousPerformance({
    supabase,
    userId,
  });

  sessionExercises.forEach((sessionExercise, idx) => {
    const exerciseId = sessionExercise.exercise_id || sessionExercise.exercises?.id;
    const prev = previousPerformance[exerciseId];

    let prescribedSets = sessionExercise.sets || 3;
    let prescribedReps = parseInt(sessionExercise.reps, 10) || 8;
    let prescribedWeight = sessionExercise.load_percentage
      ? sessionExercise.load_percentage / 100
      : null;
    let progressionNote = null;

    if (
      prev &&
      readinessForLogic >= 70 &&
      acwrForLogic < context.acwrTargetRange.max
    ) {
      if (prev.reps >= prescribedReps && prev.sets >= prescribedSets) {
        const addReps = prescribedReps < 12;
        if (addReps) {
          prescribedReps = Math.min(prev.reps + 1, 15);
          progressionNote = `↑ +1 rep from last time (${prev.reps}→${prescribedReps})`;
        } else if (prescribedWeight) {
          prescribedWeight = prev.weight
            ? prev.weight * 1.025
            : prescribedWeight;
          progressionNote = "↑ +2.5% load progression";
        }
      }
    } else if (readinessForLogic < 50) {
      prescribedSets = Math.max(prescribedSets - 1, 2);
      progressionNote = "⚠️ Volume reduced due to low readiness";
    }

    protocolExercises.push({
      exercise_id: exerciseId,
      block_type: "main_session",
      sequence_order: idx + 1,
      prescribed_sets: prescribedSets,
      prescribed_reps: prescribedReps,
      prescribed_weight_kg: prescribedWeight,
      yesterday_sets: prev?.sets,
      yesterday_reps: prev?.reps,
      progression_note: progressionNote,
      ai_note: sessionExercise.notes || context.sessionTemplate.description,
      load_contribution_au: sessionExercise.exercises?.load_contribution_au || 10,
    });
  });

  return true;
}

async function loadPreviousPerformance({ supabase, userId }) {
  const { data: previousCompletions } = await supabase
    .from("protocol_completions")
    .select(
      `
      exercise_id,
      protocol_exercises (
        actual_sets, actual_reps, actual_weight_kg, prescribed_weight_kg
      )
    `,
    )
    .eq("user_id", userId)
    .eq("block_type", "main_session")
    .order("completion_date", { ascending: false })
    .limit(50);

  const previousPerformance = {};
  if (previousCompletions) {
    previousCompletions.forEach((completion) => {
      if (
        !previousPerformance[completion.exercise_id] &&
        completion.protocol_exercises
      ) {
        previousPerformance[completion.exercise_id] = {
          sets: completion.protocol_exercises.actual_sets,
          reps: completion.protocol_exercises.actual_reps,
          weight:
            completion.protocol_exercises.actual_weight_kg ||
            completion.protocol_exercises.prescribed_weight_kg,
        };
      }
    });
  }

  return previousPerformance;
}

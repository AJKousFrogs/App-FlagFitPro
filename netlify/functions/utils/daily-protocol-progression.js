// Strength double progression (2026-07-14, audit §3.3): the strength block was
// a static "RPE 7 / 3×8 forever". Now each exercise progresses from the
// athlete's own last COMPLETED performance: reps climb first (base → max),
// then load steps up ~2.5% and reps reset — the classic double progression.
// Data source: protocol_exercises.actual_* (already captured on completion);
// no logged history → the static base, never a fabricated progression (Law #7).

/**
 * Pure progression rule. `prev` = the athlete's most recent completed actuals
 * for this exercise ({ actual_reps, actual_sets, actual_weight_kg } | null).
 */
export function progressPrescription(
  prev,
  baseReps,
  { maxReps = 12, loadStepPct = 2.5 } = {},
) {
  const prevReps = Number(prev?.actual_reps);
  if (!prev || !Number.isFinite(prevReps) || prevReps <= 0) {
    return { reps: baseReps, weightKg: null, note: null };
  }
  const prevWeight = Number(prev.actual_weight_kg);
  const hasWeight = Number.isFinite(prevWeight) && prevWeight > 0;

  if (prevReps >= maxReps) {
    // Top of the rep range → step the load, reset the reps.
    const nextWeight = hasWeight
      ? Math.round(prevWeight * (1 + loadStepPct / 100) * 2) / 2
      : null;
    return {
      reps: baseReps,
      weightKg: nextWeight,
      note: hasWeight
        ? `↑ Hit the top of the rep range (${prevReps}) — load steps to ~${nextWeight} kg, reps reset to ${baseReps}.`
        : `↑ Hit the top of the rep range (${prevReps}) — add load or a harder variation, reps reset to ${baseReps}.`,
    };
  }

  // Below the ceiling → one more rep than last time (never below the base).
  const nextReps = Math.max(baseReps, Math.min(prevReps + 1, maxReps));
  if (nextReps === prevReps) {
    return {
      reps: prevReps,
      weightKg: hasWeight ? prevWeight : null,
      note: null,
    };
  }
  return {
    reps: nextReps,
    weightKg: hasWeight ? prevWeight : null,
    note: `↑ Double progression: ${prevReps} → ${nextReps} reps${hasWeight ? ` at ${prevWeight} kg` : ""}.`,
  };
}

/**
 * Latest completed strength actuals per exercise_id for this athlete (21-day
 * lookback). Non-fatal on error — the block falls back to static targets.
 */
export async function loadRecentStrengthActuals(supabase, userId) {
  try {
    const since = new Date(Date.now() - 21 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const { data, error } = await supabase
      .from("protocol_exercises")
      .select(
        "exercise_id, actual_sets, actual_reps, actual_weight_kg, completed_at, daily_protocols!inner(user_id, protocol_date)",
      )
      .eq("daily_protocols.user_id", userId)
      .eq("block_type", "strength")
      .eq("status", "complete")
      .gte("daily_protocols.protocol_date", since)
      .order("completed_at", { ascending: false })
      .limit(60);
    if (error || !Array.isArray(data)) {
      return new Map();
    }
    const latest = new Map();
    for (const row of data) {
      if (row.exercise_id && !latest.has(row.exercise_id)) {
        latest.set(row.exercise_id, row);
      }
    }
    return latest;
  } catch {
    return new Map();
  }
}

import { normalizePosition } from "./daily-protocol-context.js";
import {
  buildWarmupTemplate,
  selectWarmupVariant,
  WARMUP_TARGET_SECONDS,
} from "./daily-protocol-training-logic.js";

export async function addMorningMobilityBlock({
  supabase,
  protocolExercises,
  context,
}) {
  const morningMobilitySlug = `morning-mobility-day-${context.dayOfWeek === 0 ? 7 : context.dayOfWeek}`;
  const { data: morningMobility } = await supabase
    .from("exercises")
    .select("*")
    .eq("slug", morningMobilitySlug)
    .eq("active", true)
    .maybeSingle();

  let mobilitySequence = 0;

  if (morningMobility) {
    mobilitySequence++;
    protocolExercises.push({
      exercise_id: morningMobility.id,
      block_type: "morning_mobility",
      sequence_order: mobilitySequence,
      prescribed_sets: morningMobility.default_sets || 1,
      prescribed_reps: morningMobility.default_reps,
      prescribed_hold_seconds: morningMobility.default_hold_seconds,
      prescribed_duration_seconds: morningMobility.default_duration_seconds,
      load_contribution_au: morningMobility.load_contribution_au || 0,
      ai_note: "Daily Morning Mobility Routine - Follow along with the video",
    });
  }

  const normalizedPosition = normalizePosition(context.position);
  const positionConfigs = getPositionMobilityConfigs({
    context,
    normalizedPosition,
  });

  for (const config of positionConfigs) {
    const { data: exercises } = await config.query(supabase);
    if (exercises && exercises.length > 0) {
      for (const ex of exercises) {
        mobilitySequence++;
        protocolExercises.push({
          exercise_id: ex.id,
          block_type: "morning_mobility",
          sequence_order: mobilitySequence,
          prescribed_sets: ex.default_sets || 1,
          prescribed_reps: ex.default_reps,
          prescribed_hold_seconds: ex.default_hold_seconds,
          prescribed_duration_seconds: ex.default_duration_seconds,
          load_contribution_au: ex.load_contribution_au || 0,
          ai_note: config.note,
        });
      }
      break;
    }
  }

  if (
    protocolExercises.filter((exercise) => exercise.block_type === "morning_mobility")
      .length === 0
  ) {
    const { data: generalMobility } = await supabase
      .from("exercises")
      .select("*")
      .eq("category", "mobility")
      .is("position_specific", null)
      .eq("active", true)
      .limit(5);

    if (generalMobility && generalMobility.length > 0) {
      generalMobility.slice(0, 4).forEach((ex, idx) => {
        protocolExercises.push({
          exercise_id: ex.id,
          block_type: "morning_mobility",
          sequence_order: idx + 1,
          prescribed_sets: ex.default_sets || 1,
          prescribed_reps: ex.default_reps,
          prescribed_hold_seconds: ex.default_hold_seconds,
          prescribed_duration_seconds: ex.default_duration_seconds,
          load_contribution_au: ex.load_contribution_au || 0,
        });
      });
    }
  }
}

export async function addFoamRollBlock({ supabase, protocolExercises }) {
  const { data: foamRollExercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("category", "foam_roll")
    .eq("active", true)
    .limit(10);

  if (foamRollExercises && foamRollExercises.length > 0) {
    const shuffled = foamRollExercises
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
    shuffled.forEach((ex, idx) => {
      protocolExercises.push({
        exercise_id: ex.id,
        block_type: "foam_roll",
        sequence_order: idx + 1,
        prescribed_sets: ex.default_sets || 1,
        prescribed_reps: ex.default_reps,
        prescribed_hold_seconds: ex.default_hold_seconds,
        prescribed_duration_seconds: ex.default_duration_seconds,
        load_contribution_au: ex.load_contribution_au || 0,
      });
    });
  }
}

export async function addWarmupBlock({
  supabase,
  protocolExercises,
  context,
  trainingFocus,
  isPracticeDay,
  isFilmRoomDay,
  isSprintSession,
}) {
  const { data: warmUpExercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("category", "warm_up")
    .eq("active", true)
    .not("subcategory", "eq", "morning_routine")
    .limit(60);

  const isFitnessDay =
    !isPracticeDay &&
    !isFilmRoomDay &&
    ["strength", "power", "conditioning", "gym", "fitness", "weights"].includes(
      trainingFocus?.toLowerCase() || "",
    );

  const warmupVariant = selectWarmupVariant({
    isFitnessDay,
    isSprintSession,
    isPracticeDay,
    trainingFocus,
  });
  const warmupPlan = buildWarmupTemplate({
    variant: warmupVariant,
    isQB: context?.isQB,
    isCenter: context?.isCenter,
    warmupFocus: context?.warmupFocus,
  });
  const warmupTotalSeconds = warmupPlan.reduce(
    (sum, item) => sum + (item.durationSeconds || 0),
    0,
  );

  if (warmupTotalSeconds !== WARMUP_TARGET_SECONDS) {
    console.warn(
      `[daily-protocol] Warm-up plan totals ${warmupTotalSeconds}s (target ${WARMUP_TARGET_SECONDS}s)`,
    );
  }

  warmupPlan.forEach((item, idx) => {
    const match = findWarmupMatch(warmUpExercises, item.keywords || []);
    protocolExercises.push({
      exercise_id: match?.id || null,
      block_type: "warm_up",
      sequence_order: idx + 1,
      prescribed_sets: item.sets || match?.default_sets || 1,
      prescribed_reps: item.reps ?? match?.default_reps ?? null,
      prescribed_hold_seconds:
        item.holdSeconds ?? match?.default_hold_seconds ?? null,
      prescribed_duration_seconds:
        item.durationSeconds ?? match?.default_duration_seconds ?? null,
      load_contribution_au: match?.load_contribution_au || 0,
      ai_note: item.note || "Warm-up block (25 min total).",
    });
  });
}

export async function addRecoveryBlocks({
  supabase,
  protocolExercises,
  trainingFocus,
}) {
  const { data: coolDownExercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("category", "cool_down")
    .eq("active", true)
    .limit(10);

  if (coolDownExercises && coolDownExercises.length > 0) {
    const shuffled = coolDownExercises
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
    shuffled.forEach((ex, idx) => {
      protocolExercises.push({
        exercise_id: ex.id,
        block_type: "cool_down",
        sequence_order: idx + 1,
        prescribed_sets: ex.default_sets || 1,
        prescribed_reps: ex.default_reps,
        prescribed_hold_seconds: ex.default_hold_seconds || 30,
        prescribed_duration_seconds: ex.default_duration_seconds,
        load_contribution_au: ex.load_contribution_au || 0,
        ai_note:
          "🧘 Cool-down: Promotes recovery, reduces muscle soreness, activates parasympathetic nervous system.",
      });
    });
  }

  const recoveryCount = trainingFocus === "recovery" ? 6 : 3;
  const { data: recoveryExercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("category", "recovery")
    .eq("active", true)
    .limit(15);

  if (recoveryExercises && recoveryExercises.length > 0) {
    const shuffled = recoveryExercises
      .sort(() => Math.random() - 0.5)
      .slice(0, recoveryCount);
    shuffled.forEach((ex, idx) => {
      protocolExercises.push({
        exercise_id: ex.id,
        block_type: "evening_recovery",
        sequence_order: idx + 1,
        prescribed_sets: ex.default_sets || 1,
        prescribed_reps: ex.default_reps,
        prescribed_hold_seconds: ex.default_hold_seconds,
        prescribed_duration_seconds: ex.default_duration_seconds,
        load_contribution_au: ex.load_contribution_au || 0,
        ai_note:
          trainingFocus === "recovery"
            ? "Recovery Day - Focus on these modalities to enhance recovery"
            : null,
      });
    });
  }
}

function findWarmupMatch(warmUpExercises, keywords = []) {
  if (!warmUpExercises || warmUpExercises.length === 0) {
    return null;
  }

  return warmUpExercises.find((ex) => {
    const name = (ex.name || "").toLowerCase();
    const slug = (ex.slug || "").toLowerCase();
    return keywords.some(
      (keyword) => name.includes(keyword) || (slug && slug.includes(keyword)),
    );
  });
}

function getPositionMobilityConfigs({ context, normalizedPosition }) {
  if (context.isQB) {
    return [
      {
        note: "QB Arm Care - Hip flexor flexibility supports throwing velocity",
        query: (supabase) =>
          supabase
            .from("exercises")
            .select("*")
            .contains("position_specific", ["quarterback"])
            .eq("category", "mobility")
            .eq("active", true)
            .limit(5),
      },
    ];
  }

  if (context.isCenter) {
    return [
      {
        note: "Center Arm Care - Shoulder/wrist mobility for snapping + throwing",
        query: (supabase) =>
          supabase
            .from("exercises")
            .select("*")
            .or("position_specific.cs.{center},position_specific.cs.{quarterback}")
            .eq("category", "mobility")
            .eq("active", true)
            .limit(5),
      },
    ];
  }

  if (normalizedPosition === "wr_db") {
    return [
      {
        note: "WR/DB Mobility - Hip and ankle prep for cuts and routes",
        query: (supabase) =>
          supabase
            .from("exercises")
            .select("*")
            .contains("position_specific", ["wr_db"])
            .eq("category", "mobility")
            .eq("active", true)
            .limit(5),
      },
    ];
  }

  if (normalizedPosition === "blitzer" || normalizedPosition === "rusher") {
    return [
      {
        note: "Rusher Mobility - Explosive movement prep",
        query: (supabase) =>
          supabase
            .from("exercises")
            .select("*")
            .or("position_specific.cs.{blitzer},position_specific.cs.{rusher}")
            .eq("category", "mobility")
            .eq("active", true)
            .limit(5),
      },
    ];
  }

  return [];
}

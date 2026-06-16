import { normalizePosition } from "./daily-protocol-context.js";
import {
  buildWarmupTemplate,
  selectWarmupVariant,
  WARMUP_TARGET_SECONDS,
} from "./daily-protocol-training-logic.js";

import { createLogger } from "./structured-logger.js";
const logger = createLogger({ service: "netlify.daily-protocol-blocks" });


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
      exercise_name: morningMobility.name,
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
          exercise_name: ex.name,
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

export async function addFoamRollBlock({ supabase, protocolExercises, userId = null, date = null }) {
  // Skip foam rolling when a sports massage was completed in the past 24h.
  // Post-massage, the soft tissue is already mobilised — foam rolling adds no
  // value and can aggravate sensitised tissue. Replace with a light active-
  // recovery note (jogging / dynamic stretching to restore muscle tonus).
  if (userId) {
    const since = new Date(new Date(date ?? new Date().toISOString().slice(0, 10)).getTime() - 86_400_000).toISOString();
    const { data: massageSession } = await supabase
      .from("recovery_sessions")
      .select("id, recovery_protocols!inner(category)")
      .eq("user_id", userId)
      .eq("status", "completed")
      .eq("recovery_protocols.category", "massage")
      .gte("completed_at", since)
      .limit(1)
      .maybeSingle();

    if (massageSession) {
      // Massage found — substitute with active recovery note block instead
      protocolExercises.push({
        exercise_id: null,
        exercise_name: "Post-Massage Active Recovery",
        block_type: "foam_roll",
        sequence_order: 1,
        prescribed_sets: 1,
        prescribed_duration_seconds: 600, // 10 min
        load_contribution_au: 0,
        ai_note: "Sports massage received yesterday — skip foam rolling. Instead: 10 min light jog or brisk walk + dynamic leg swings and arm circles to restore muscle tonus. Foam rolling would aggravate sensitised tissue.",
      });
      return;
    }
  }

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
          exercise_name: ex.name,
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
    logger.warn("daily_protocol_warmup_duration_mismatch", { actual: warmupTotalSeconds, target: WARMUP_TARGET_SECONDS });
  }

  warmupPlan.forEach((item, idx) => {
    const match = findWarmupMatch(warmUpExercises, item.keywords || []);
    protocolExercises.push({
      exercise_id: match?.id || null,
      exercise_name: item.name,
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

// Body-region keywords that disqualify a cool-down stretch when that region is
// injured. Matching is substring-based on the exercise name/slug (lowercase).
const REGION_KEYWORDS = {
  calf: ["calf", "gastrocnemius", "soleus"],
  hamstring: ["hamstring"],
  quad: ["quad", "quadricep"],
  ankle: ["ankle"],
  achilles: ["achilles"],
  hip: ["hip", "hip flexor", "hip adductor", "iliopsoas"],
  groin: ["groin", "adductor"],
  knee: ["knee"],
  "lower back": ["lower back", "lumbar"],
  shoulder: ["shoulder", "rotator"],
};

function isExerciseSafeForInjuries(ex, injuredRegions) {
  if (!injuredRegions || injuredRegions.length === 0) return true;
  const name = (ex.name || "").toLowerCase();
  const slug = (ex.slug || "").toLowerCase();
  for (const region of injuredRegions) {
    const keywords = REGION_KEYWORDS[region.toLowerCase()] || [region.toLowerCase()];
    if (keywords.some((kw) => name.includes(kw) || slug.includes(kw))) {
      return false;
    }
  }
  return true;
}

export async function addRecoveryBlocks({
  supabase,
  protocolExercises,
  trainingFocus,
  activeInjuries = [],
}) {
  // Build a set of injured regions so we can filter out cool-down exercises that
  // directly target them (e.g. no Calf Stretch when calf is reported severe).
  const injuredRegions = (activeInjuries || [])
    .map((i) => (i.injury_location || i.region || "").toLowerCase())
    .filter(Boolean);

  const { data: coolDownExercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("category", "cool_down")
    .eq("active", true)
    .limit(20);

  if (coolDownExercises && coolDownExercises.length > 0) {
    const safe = coolDownExercises.filter((ex) =>
      isExerciseSafeForInjuries(ex, injuredRegions),
    );
    const pool = safe.length >= 2 ? safe : coolDownExercises;
    const shuffled = pool
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
    shuffled.forEach((ex, idx) => {
      protocolExercises.push({
        exercise_id: ex.id,
        exercise_name: ex.name,
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
        exercise_name: ex.name,
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

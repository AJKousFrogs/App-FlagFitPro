import { normalizePosition } from "./daily-protocol-context.js";
import {
  buildWarmupTemplate,
  selectWarmupVariant,
  WARMUP_TARGET_SECONDS,
} from "./daily-protocol-training-logic.js";

import { createLogger } from "./structured-logger.js";
const logger = createLogger({ service: "netlify.daily-protocol-blocks" });

// FNV-1a 32-bit hash — stable across calls for deterministic exercise ordering.
// Same athlete+date always produces the same exercise sequence.
function _fnv32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}
function deterministicSort(seed, items) {
  return [...items].sort(
    (a, b) => _fnv32(seed + String(a.id)) - _fnv32(seed + String(b.id)),
  );
}

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
    protocolExercises.filter(
      (exercise) => exercise.block_type === "morning_mobility",
    ).length === 0
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

export async function addFoamRollBlock({
  supabase,
  protocolExercises,
  userId = null,
  date = null,
  seed = null,
}) {
  // Skip foam rolling when a sports massage was completed in the past 24h.
  // Post-massage, the soft tissue is already mobilised — foam rolling adds no
  // value and can aggravate sensitised tissue. Replace with a light active-
  // recovery note (jogging / dynamic stretching to restore muscle tonus).
  if (userId) {
    const since = new Date(
      new Date(date ?? new Date().toISOString().slice(0, 10)).getTime() -
        86_400_000,
    ).toISOString();
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
        ai_note:
          "Sports massage received yesterday — skip foam rolling. Instead: 10 min light jog or brisk walk + dynamic leg swings and arm circles to restore muscle tonus. Foam rolling would aggravate sensitised tissue.",
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
    const foamSeed = seed ?? (userId ?? "") + (date ?? "");
    const shuffled = deterministicSort(foamSeed, foamRollExercises).slice(0, 5);
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
    // "conditioning" is field/track work — it gets the field sprint-mechanics warmup.
    ["strength", "power", "gym", "fitness", "weights"].includes(
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
    logger.warn("daily_protocol_warmup_duration_mismatch", {
      actual: warmupTotalSeconds,
      target: WARMUP_TARGET_SECONDS,
    });
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
// Anatomically-linked structures share keywords in BOTH directions: the
// calf–Achilles complex is one unit (a "Calf Raise" loads the Achilles tendon
// directly — before 2026-07-12 it passed the filter for an "achilles" report),
// the patellar tendon belongs to the knee, the plantar fascia to the foot/heel.
const CALF_ACHILLES_COMPLEX = [
  "calf",
  "gastrocnemius",
  "soleus",
  "achilles",
  "heel raise",
  "heel drop",
];
const REGION_KEYWORDS = {
  calf: CALF_ACHILLES_COMPLEX,
  gastrocnemius: CALF_ACHILLES_COMPLEX,
  soleus: CALF_ACHILLES_COMPLEX,
  achilles: CALF_ACHILLES_COMPLEX,
  hamstring: ["hamstring", "nordic"],
  quad: ["quad", "quadricep"],
  ankle: ["ankle", "achilles", "heel raise", "heel drop"],
  hip: ["hip", "hip flexor", "hip adductor", "iliopsoas"],
  groin: ["groin", "adductor"],
  knee: ["knee", "patella", "patellar"],
  shin: ["shin", "tibialis"],
  foot: ["foot", "plantar", "toe raise", "heel raise", "heel drop"],
  plantar: ["plantar", "foot", "toe raise", "heel raise", "heel drop"],
  "lower back": ["lower back", "lumbar"],
  shoulder: ["shoulder", "rotator"],
};

/**
 * Keywords for an injured region: exact REGION_KEYWORDS entry when it exists;
 * otherwise the union of every entry whose key appears in the region string
 * (so "foot / plantar" or "hip flexor" from the Today body check resolve to
 * their anatomical keyword sets); the raw region string is always included as
 * a last-resort match.
 */
export function keywordsForRegion(region) {
  const r = String(region || "").toLowerCase();
  if (REGION_KEYWORDS[r]) {
    return REGION_KEYWORDS[r];
  }
  const merged = new Set([r]);
  for (const [key, kws] of Object.entries(REGION_KEYWORDS)) {
    if (r.includes(key)) {
      kws.forEach((kw) => merged.add(kw));
    }
  }
  return [...merged];
}

// Injured-region → canonical tissue-node ids (the Tissue Load Engine graph,
// mirrors database/library/tissue-registry.mjs). The safety filter prefers this
// STRUCTURED path — an exercise's tissue_targets vs the injured tissues — over
// name keywords. The calf–Achilles complex is one functional unit: any
// plantarflexor loader loads the Achilles.
const CALF_ACHILLES_TISSUES = ["achilles", "soleus", "gastrocnemius"];
const REGION_TO_TISSUES = {
  calf: CALF_ACHILLES_TISSUES,
  gastrocnemius: CALF_ACHILLES_TISSUES,
  soleus: CALF_ACHILLES_TISSUES,
  achilles: CALF_ACHILLES_TISSUES,
  heel: CALF_ACHILLES_TISSUES,
  hamstring: ["hamstring"],
  quad: ["quadriceps", "patellar_tendon"],
  quadriceps: ["quadriceps", "patellar_tendon"],
  knee: ["patellar_tendon", "acl", "quadriceps"],
  patella: ["patellar_tendon"],
  patellar: ["patellar_tendon"],
  groin: ["adductor"],
  adductor: ["adductor"],
  ankle: ["ankle"],
  shin: ["tibia"],
  tibia: ["tibia"],
  plantar: ["plantar_fascia"],
  foot: ["plantar_fascia", "tibia"],
  "lower back": ["lumbar"],
  lumbar: ["lumbar"],
  shoulder: ["rotator_cuff"],
};

/** Canonical tissue-node ids an injured region implicates (empty for regions the
 *  graph doesn't recognise — the caller then relies on the keyword fail-safe). */
export function tissuesForRegion(region) {
  const r = String(region || "").toLowerCase();
  if (REGION_TO_TISSUES[r]) {
    return REGION_TO_TISSUES[r];
  }
  const merged = new Set();
  for (const [key, tissues] of Object.entries(REGION_TO_TISSUES)) {
    if (r.includes(key)) {
      tissues.forEach((t) => merged.add(t));
    }
  }
  return [...merged];
}

/**
 * Is an exercise safe to prescribe given the athlete's injured regions?
 *
 * UNSAFE if EITHER signal fires — the structured tissue-graph match
 * (exercise.tissue_targets ∩ the injured region's tissues) OR the legacy
 * name-keyword match. The union is deliberately the more conservative (safer)
 * combination: tissue_targets catches exercises whose NAME doesn't reveal the
 * load (e.g. a machine exercise), while the keyword path still fails safe for
 * rows not yet tissue-tagged and for regions the graph doesn't map.
 */
export function isExerciseSafeForInjuries(ex, injuredRegions) {
  if (!injuredRegions || injuredRegions.length === 0) {
    return true;
  }
  const name = (ex.name || "").toLowerCase();
  const slug = (ex.slug || "").toLowerCase();
  const tissueTargets = Array.isArray(ex.tissue_targets)
    ? ex.tissue_targets
    : [];
  for (const region of injuredRegions) {
    // Structured path: injured tissues vs the exercise's tissue_targets.
    const injuredTissues = tissuesForRegion(region);
    if (
      tissueTargets.length &&
      injuredTissues.some((t) => tissueTargets.includes(t))
    ) {
      return false;
    }
    // Keyword fail-safe (untagged rows, unmapped regions).
    const keywords = keywordsForRegion(region);
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
  seed = null,
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
    const shuffled = deterministicSort(seed ?? "", pool).slice(0, 5);
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
    const shuffled = deterministicSort(seed ?? "", recoveryExercises).slice(
      0,
      recoveryCount,
    );
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
            .or(
              "position_specific.cs.{center},position_specific.cs.{quarterback}",
            )
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

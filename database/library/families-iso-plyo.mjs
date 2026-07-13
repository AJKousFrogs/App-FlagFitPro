// Tissue Load Engine — isometric + plyometric expansion.
//
// Deep coverage for the two smallest sections (the audit flagged only ~29 iso
// and 8 plyo). Isometrics are the engine's go-to when an athlete is irritable
// (high tendon force, ZERO loading rate — swap type, keep the stimulus, Bohm
// 2015). Plyometrics are authored as an explicit loading-RATE ladder (low →
// very_high) so the engine can strip rate while holding force. Same family shape.

const IP = [];

// ══ ISOMETRICS — by region, yielding + overcoming ═══════════════════════════
const iso = (extra) => ({
  category: "isometrics",
  contractionType: "isometric",
  jointEmphasis: "neutral",
  loadingRateBand: "none",
  evidenceTier: "CONTESTED",
  defaults: { sets: 4, hold: 30, rest: 60, loadAu: 8, difficulty: "beginner" },
  cues: [
    "Build to a hard hold",
    "Steady — no bounce",
    "Log your pain response",
  ],
  ...extra,
});

// Knee extensor / patellar tendon isometrics
IP.push(
  iso({
    key: "iso_knee",
    movement: "knee_extension",
    peakLoadBw: 4,
    rehabStage: 1,
    movementPattern: "Isometric Knee Extension",
    muscleGroups: ["quadriceps"],
    targetMuscles: ["quadriceps"],
    positions: [],
    how: "Knee-extensor isometrics — patellar-tendon-friendly high force at zero rate.",
    variants: [
      { name: "Wall Sit (90°)", ov: {} },
      { name: "Wall Sit (60°)", ov: {} },
      { name: "Single-Leg Wall Sit", ov: {} },
      { name: "Spanish Squat Hold (Band)", ov: { peakLoadBw: 5 } },
      { name: "ATG Split-Squat Isometric", ov: { movement: "squat" } },
      { name: "Isometric Leg Extension Hold", ov: {} },
      { name: "Isometric Leg Press Hold", ov: { peakLoadBw: 5 } },
      { name: "Isometric Step-Up Hold (Top)", ov: {} },
      {
        name: "Quad-Set Isometric",
        ov: {
          defaults: {
            sets: 4,
            hold: 20,
            rest: 45,
            loadAu: 6,
            difficulty: "beginner",
          },
        },
      },
      { name: "Isometric Sissy-Squat Hold", ov: { difficulty: "advanced" } },
    ],
  }),
);

// Posterior chain isometrics (hamstring / glute)
IP.push(
  iso({
    key: "iso_posterior",
    movement: "hip_extension",
    rehabStage: 1,
    movementPattern: "Isometric Hip Extension",
    muscleGroups: ["hamstrings", "glutes"],
    targetMuscles: ["biceps femoris", "gluteus maximus"],
    positions: [],
    how: "Posterior-chain isometrics — low-irritability hamstring/glute loading.",
    variants: [
      { name: "Isometric Glute Bridge Hold", ov: {} },
      { name: "Single-Leg Glute Bridge Hold", ov: {} },
      { name: "Isometric Hip Thrust Hold", ov: {} },
      { name: "Isometric RDL Hold (Mid-Shin)", ov: { movement: "hip_hinge" } },
      {
        name: "Isometric Hamstring Bridge (Long Lever)",
        ov: {
          movement: "knee_flexion_eccentric",
          targetMuscles: ["biceps femoris"],
        },
      },
      { name: "Isometric Back-Extension Hold", ov: { movement: "hip_hinge" } },
      { name: "Isometric Good-Morning Hold", ov: { movement: "hip_hinge" } },
      {
        name: "Hip-Airplane Isometric Hold",
        ov: { movement: "hip_abduction", targetMuscles: ["gluteus medius"] },
      },
      { name: "Isometric Single-Leg RDL Hold", ov: { movement: "hip_hinge" } },
    ],
  }),
);

// Calf / plantarflexor isometrics
IP.push(
  iso({
    key: "iso_calf_extra",
    movement: "plantarflexion_bent",
    rehabStage: 1,
    peakLoadBw: 2,
    movementPattern: "Isometric Plantarflexion",
    muscleGroups: ["calves"],
    targetMuscles: ["soleus", "gastrocnemius"],
    positions: [],
    how: "Extended calf isometrics across knee angle + range.",
    variants: [
      {
        name: "Isometric Calf Hold (Mid-Range, Seated)",
        ov: { jointEmphasis: "knee_bent", targetMuscles: ["soleus"] },
      },
      {
        name: "Isometric Calf Hold (End-Range, Standing)",
        ov: {
          jointEmphasis: "knee_straight",
          movement: "plantarflexion_straight",
        },
      },
      {
        name: "Isometric Single-Leg Heel-Raise Hold",
        ov: {
          jointEmphasis: "knee_straight",
          movement: "plantarflexion_straight",
        },
      },
      {
        name: "Isometric Leg-Press Calf Hold",
        ov: {
          jointEmphasis: "knee_straight",
          movement: "plantarflexion_straight",
          peakLoadBw: 3,
        },
      },
    ],
  }),
);

// Adductor / hip isometrics
IP.push(
  iso({
    key: "iso_hip",
    movement: "hip_adduction",
    rehabStage: 1,
    movementPattern: "Isometric Hip",
    muscleGroups: ["adductors", "glutes"],
    targetMuscles: ["adductor longus"],
    positions: [],
    how: "Adductor + abductor isometrics — squeeze/spread holds (also the monitoring test).",
    variants: [
      { name: "Adductor Squeeze Isometric (0° Hip)", ov: {} },
      { name: "Adductor Squeeze Isometric (90° Hip)", ov: {} },
      { name: "Isometric Copenhagen Hold (Short Lever)", ov: {} },
      {
        name: "Isometric Wall Hip-Abduction Hold",
        ov: { movement: "hip_abduction", targetMuscles: ["gluteus medius"] },
      },
      {
        name: "Isometric Ball-Squeeze Wall Sit",
        ov: { movement: "knee_extension" },
      },
    ],
  }),
);

// Upper / thrower isometrics
IP.push(
  iso({
    key: "iso_upper",
    movement: "horizontal_push",
    jointEmphasis: "n/a",
    rehabStage: 1,
    movementPattern: "Isometric Upper",
    muscleGroups: ["chest", "shoulders", "back"],
    targetMuscles: ["rotator cuff", "scapular stabilizers"],
    positions: [],
    how: "Upper-body isometrics — dead-hangs, holds and cuff co-contraction for robust shoulders.",
    variants: [
      { name: "Isometric Push-Up Hold (Bottom)", ov: {} },
      { name: "Isometric Mid-Row Hold", ov: { movement: "horizontal_pull" } },
      {
        name: "Dead Hang (Passive)",
        ov: { movement: "vertical_pull", targetMuscles: ["grip", "lats"] },
      },
      { name: "Active Hang (Scapular)", ov: { movement: "vertical_pull" } },
      {
        name: "Isometric Chin-Up Hold (Top)",
        ov: { movement: "vertical_pull" },
      },
      { name: "Isometric Overhead Hold", ov: { movement: "vertical_push" } },
      {
        name: "Isometric External-Rotation Hold (Cuff)",
        ov: { movement: "arm_care" },
      },
      { name: "Bottoms-Up KB Carry Hold", ov: { movement: "vertical_push" } },
    ],
  }),
);

// Core / trunk isometrics
IP.push(
  iso({
    key: "iso_core",
    movement: "anti_extension",
    jointEmphasis: "n/a",
    movementPattern: "Isometric Core",
    muscleGroups: ["core"],
    targetMuscles: ["rectus abdominis", "obliques"],
    positions: [],
    how: "Trunk isometrics — brace under anti-extension / anti-rotation demand.",
    variants: [
      { name: "RKC Plank (Max Tension)", ov: {} },
      { name: "Side-Plank Hold (Long)", ov: {} },
      {
        name: "Copenhagen Side-Plank Hold",
        ov: { movement: "hip_adduction", muscleGroups: ["adductors", "core"] },
      },
      { name: "Hollow-Body Hold (Isometric)", ov: {} },
      {
        name: "L-Sit Hold",
        ov: { movement: "hip_flexion", difficulty: "advanced" },
      },
      { name: "Bird-Dog Isometric Hold", ov: {} },
      { name: "Dead-Bug Isometric Hold", ov: {} },
      { name: "Pallof Isometric Hold", ov: { movement: "core_rotation" } },
      { name: "Bear-Crawl Isometric Hold", ov: {} },
    ],
  }),
);

// Ankle / foot isometrics
IP.push(
  iso({
    key: "iso_ankle",
    movement: "ankle_eversion",
    rehabStage: 1,
    movementPattern: "Isometric Ankle / Foot",
    muscleGroups: ["ankle stabilizers", "peroneals"],
    targetMuscles: ["peroneus longus", "tibialis"],
    positions: [],
    how: "Ankle/foot isometrics — eversion/inversion/dorsiflexion holds + short-foot for a stable base.",
    variants: [
      {
        name: "Isometric Ankle Eversion Hold",
        ov: { movement: "ankle_eversion" },
      },
      {
        name: "Isometric Ankle Inversion Hold",
        ov: {
          movement: "ankle_balance",
          targetMuscles: ["tibialis posterior"],
        },
      },
      {
        name: "Isometric Dorsiflexion Hold (Tib)",
        ov: {
          movement: "ankle_dorsiflexion",
          targetMuscles: ["tibialis anterior"],
        },
      },
      { name: "Short-Foot Arch Hold", ov: { movement: "ankle_balance" } },
      {
        name: "Single-Leg Isometric Balance Hold",
        ov: { movement: "ankle_balance" },
      },
    ],
  }),
);

// ══ PLYOMETRICS — the loading-RATE ladder, deep coverage ════════════════════
const ply = (extra) => ({
  category: "plyometrics",
  contractionType: "plyometric",
  jointEmphasis: "neutral",
  loadingRateBand: "high",
  evidenceTier: "META",
  peakLoadBw: 5,
  defaults: {
    sets: 4,
    reps: 5,
    rest: 120,
    loadAu: 18,
    difficulty: "intermediate",
  },
  cues: [
    "Land soft, absorb",
    "Minimise ground time on the high rungs",
    "Quality over quantity",
  ],
  ...extra,
});

// Vertical
IP.push(
  ply({
    key: "plyo_vertical",
    movement: "jump_land",
    movementPattern: "Vertical Jump / Land",
    muscleGroups: ["quadriceps", "glutes", "calves"],
    targetMuscles: ["quadriceps", "gluteus maximus", "gastrocnemius"],
    positions: [],
    how: "Vertical plyometrics ordered by loading rate. Progress rate, not just height.",
    variants: [
      {
        name: "Squat Jump (Non-Countermovement)",
        ov: { loadingRateBand: "moderate" },
      },
      {
        name: "Countermovement Jump (Reset)",
        ov: { loadingRateBand: "moderate" },
      },
      {
        name: "Repeated Countermovement Jumps",
        ov: { loadingRateBand: "high" },
      },
      { name: "Tuck Jump", ov: { loadingRateBand: "high" } },
      {
        name: "Single-Leg Countermovement Jump",
        ov: { loadingRateBand: "high" },
      },
      {
        name: "Box Jump (Reset, Step Down)",
        ov: { loadingRateBand: "moderate" },
      },
      { name: "Seated Box Jump", ov: { loadingRateBand: "moderate" } },
      {
        name: "Drop Jump (Low Box)",
        ov: { loadingRateBand: "high", peakLoadBw: 6 },
      },
      {
        name: "Depth Jump (Mid Box)",
        ov: {
          loadingRateBand: "very_high",
          peakLoadBw: 6.6,
          difficulty: "advanced",
        },
      },
      {
        name: "Hurdle Hops (Double-Leg, Reset)",
        ov: { movement: "plantarflexion_ballistic", loadingRateBand: "high" },
      },
      {
        name: "Continuous Hurdle Hops",
        ov: {
          movement: "plantarflexion_ballistic",
          loadingRateBand: "very_high",
          difficulty: "advanced",
        },
      },
      { name: "Band-Resisted Vertical Jump", ov: { loadingRateBand: "high" } },
      {
        name: "Weighted Vest Countermovement Jump",
        ov: { loadingRateBand: "high" },
      },
    ],
  }),
);

// Horizontal
IP.push(
  ply({
    key: "plyo_horizontal",
    movement: "jump_land",
    movementPattern: "Horizontal Jump / Bound",
    muscleGroups: ["hamstrings", "glutes", "quadriceps"],
    targetMuscles: ["hamstrings", "gluteus maximus", "quadriceps"],
    positions: [],
    how: "Horizontal plyometrics — acceleration transfer; hamstring/glute dominant.",
    variants: [
      { name: "Standing Broad Jump (Reset)", ov: { loadingRateBand: "high" } },
      {
        name: "Standing Triple Jump",
        ov: { loadingRateBand: "very_high", difficulty: "advanced" },
      },
      { name: "Repeated Broad Jumps", ov: { loadingRateBand: "very_high" } },
      {
        name: "Alternate-Leg Bound",
        ov: { movement: "plantarflexion_ballistic", loadingRateBand: "high" },
      },
      {
        name: "Single-Leg Bound (Distance)",
        ov: {
          movement: "plantarflexion_ballistic",
          loadingRateBand: "very_high",
          difficulty: "advanced",
        },
      },
      {
        name: "Single-Leg Triple Hop",
        ov: {
          movement: "plantarflexion_ballistic",
          loadingRateBand: "very_high",
          difficulty: "advanced",
        },
      },
      {
        name: "Sprint-Start Broad Jump",
        ov: { movement: "sprint", loadingRateBand: "very_high" },
      },
      {
        name: "Depth Jump to Broad Jump",
        ov: {
          loadingRateBand: "very_high",
          peakLoadBw: 6.6,
          difficulty: "advanced",
        },
      },
    ],
  }),
);

// Lateral / multidirectional (ACL-relevant)
IP.push(
  ply({
    key: "plyo_lateral",
    movement: "cutting",
    movementPattern: "Lateral / Multidirectional Plyo",
    muscleGroups: ["glutes", "adductors", "quadriceps"],
    targetMuscles: ["gluteus medius", "adductors", "quadriceps"],
    positions: [],
    how: "Frontal-plane + rotational plyometrics — decel/COD mechanics. Land and stick before you bounce.",
    variants: [
      { name: "Skater Bound (Stick)", ov: { loadingRateBand: "high" } },
      {
        name: "Continuous Skater Bounds",
        ov: { loadingRateBand: "very_high" },
      },
      { name: "Lateral Bound (Stick)", ov: { loadingRateBand: "high" } },
      { name: "Lateral Hurdle Hops", ov: { loadingRateBand: "high" } },
      { name: "90° Jump-and-Stick", ov: { loadingRateBand: "high" } },
      { name: "180° Jump-and-Stick", ov: { loadingRateBand: "very_high" } },
      { name: "Zig-Zag Hops", ov: { loadingRateBand: "high" } },
      {
        name: "Single-Leg Lateral Hop (Stick)",
        ov: { loadingRateBand: "very_high", difficulty: "advanced" },
      },
      { name: "Crossover Bound", ov: { loadingRateBand: "high" } },
    ],
  }),
);

// Foot/ankle rate ladder (low rungs — rehab-friendly)
IP.push(
  ply({
    key: "plyo_foot",
    movement: "plantarflexion_ballistic",
    loadingRateBand: "moderate",
    peakLoadBw: 3,
    rehabStage: 3,
    movementPattern: "Foot/Ankle Plyo (Rate Ladder)",
    muscleGroups: ["calves"],
    targetMuscles: ["gastrocnemius", "soleus"],
    positions: [],
    defaults: {
      sets: 4,
      reps: 20,
      rest: 90,
      loadAu: 12,
      difficulty: "beginner",
    },
    how: "Low-amplitude foot/ankle plyometrics — the first, lowest-rate rungs; safe re-entry to elastic loading.",
    cues: ["Stiff ankles", "Quiet, fast contacts", "Stay low"],
    variants: [
      { name: "Pogo Hops (In-Place)", ov: {} },
      { name: "Ankle Hops (In-Place)", ov: {} },
      { name: "Line Hops (Front-Back)", ov: {} },
      { name: "Line Hops (Side-Side)", ov: {} },
      { name: "Single-Leg Line Hops", ov: { loadingRateBand: "high" } },
      { name: "Dot-Drill Hops", ov: {} },
      { name: "Fast-Feet In-Place", ov: { movement: "neutral" } },
      { name: "Four-Corner Hops", ov: {} },
      {
        name: "Split-Squat Jump (Cycled)",
        ov: {
          movement: "jump_land",
          loadingRateBand: "high",
          peakLoadBw: 5,
          muscleGroups: ["quadriceps", "glutes"],
          targetMuscles: ["quadriceps"],
        },
      },
      {
        name: "Scissor Jump",
        ov: { movement: "jump_land", loadingRateBand: "high", peakLoadBw: 5 },
      },
    ],
  }),
);

// Upper-body plyometrics
IP.push(
  ply({
    key: "plyo_upper",
    movement: "horizontal_push",
    jointEmphasis: "n/a",
    loadingRateBand: "high",
    peakLoadBw: null,
    movementPattern: "Upper-Body Plyo",
    muscleGroups: ["chest", "shoulders", "core"],
    targetMuscles: ["pectoralis major", "deltoid"],
    positions: [],
    how: "Upper-body elastic power — throws and reactive push-ups (transfer to snapping/throwing).",
    cues: ["Explode off the ground/ball", "Absorb soft", "Quality reps only"],
    variants: [
      { name: "Clap Push-Up", ov: {} },
      {
        name: "Depth Push-Up (Drop-and-Catch)",
        ov: { loadingRateBand: "very_high", difficulty: "advanced" },
      },
      { name: "Med-Ball Chest Pass (Explosive)", ov: {} },
      { name: "Med-Ball Overhead Throw", ov: { movement: "vertical_push" } },
      {
        name: "Med-Ball Rotational Throw",
        ov: {
          movement: "core_rotation",
          muscleGroups: ["core"],
          targetMuscles: ["obliques"],
        },
      },
      { name: "Rebounder Chest Throw", ov: {} },
      {
        name: "Kneeling Med-Ball Slam",
        ov: {
          movement: "core_rotation",
          muscleGroups: ["core"],
          targetMuscles: ["obliques"],
        },
      },
    ],
  }),
);

export const FAMILIES_ISO_PLYO = IP;

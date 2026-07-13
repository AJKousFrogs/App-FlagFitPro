// Tissue Load Engine — general-athletic + extended-tissue families.
//
// Curated families (each variant a real, coachable exercise) for the broad
// library: the tissue nodes the user called out that lacked content (hip flexor,
// glute, ITB, peroneus, plantaris, tibialis) plus general strength / power /
// plyometric rate-ladder / speed / agility / mobility / core / arm-care. Same
// shape as families.mjs; the builder validates + expands both.

const G = [];

// ══ EXTENDED TISSUE REHAB (the regions the injury flow must recognise) ══════

// Glute — the hip-control tissue that governs knee valgus + ITB load
G.push({
  key: "glute",
  category: "rehab",
  movement: "hip_extension",
  contractionType: "isotonic",
  jointEmphasis: "neutral",
  loadingRateBand: "low",
  evidenceTier: "COHORT",
  rehabStage: 1,
  movementPattern: "Hip Extension / Abduction",
  muscleGroups: ["glutes"],
  targetMuscles: ["gluteus maximus", "gluteus medius"],
  positions: [],
  defaults: { sets: 3, reps: 12, rest: 60, loadAu: 10, difficulty: "beginner" },
  how: "Glute-med strength governs knee valgus and ITB load — the upstream fix for runner's knee and ITB syndrome, not just local knee work.",
  cues: [
    "Drive through the heel",
    "Keep the pelvis level",
    "Squeeze at the top",
  ],
  variants: [
    { name: "Glute Bridge", ov: { rehabStage: 1 } },
    { name: "Single-Leg Glute Bridge", ov: { rehabStage: 2 } },
    {
      name: "Hip Thrust (Barbell)",
      ov: {
        rehabStage: 2,
        defaults: {
          sets: 4,
          reps: 8,
          rest: 120,
          loadAu: 18,
          difficulty: "intermediate",
        },
      },
    },
    {
      name: "Banded Clamshell",
      ov: { movement: "hip_abduction", rehabStage: 1 },
    },
    {
      name: "Side-Lying Hip Abduction",
      ov: { movement: "hip_abduction", rehabStage: 1 },
    },
    {
      name: "Banded Lateral Walk",
      ov: { movement: "hip_abduction", rehabStage: 2 },
    },
    { name: "Monster Walk", ov: { movement: "hip_abduction", rehabStage: 2 } },
    {
      name: "Single-Leg RDL (Glute Focus)",
      ov: {
        movement: "hip_hinge",
        rehabStage: 3,
        defaults: { sets: 3, reps: 8, rest: 90, loadAu: 14 },
      },
    },
    {
      name: "Bulgarian Split Squat (Glute Bias)",
      ov: {
        movement: "squat",
        rehabStage: 3,
        defaults: { sets: 3, reps: 8, rest: 90, loadAu: 16 },
      },
    },
  ],
});

// Hip flexor — sprint drive / kicking; rectus femoris two-joint risk
G.push({
  key: "hip_flexor",
  category: "rehab",
  movement: "hip_flexion",
  contractionType: "isotonic",
  jointEmphasis: "neutral",
  loadingRateBand: "low",
  evidenceTier: "CONSENSUS",
  rehabStage: 1,
  movementPattern: "Hip Flexion",
  muscleGroups: ["hip flexors"],
  targetMuscles: ["iliopsoas", "rectus femoris"],
  positions: [],
  defaults: { sets: 3, reps: 12, rest: 60, loadAu: 8, difficulty: "beginner" },
  how: "Progressive hip-flexor loading + capacity for sprint drive and kicking mechanics.",
  cues: [
    "Tall posture",
    "Drive the knee up, control it down",
    "No lumbar arch",
  ],
  variants: [
    { name: "Standing Banded Hip Flexion", ov: { rehabStage: 1 } },
    { name: "Seated Knee Raise (Weighted)", ov: { rehabStage: 2 } },
    {
      name: "Hanging Knee Raise",
      ov: {
        rehabStage: 3,
        defaults: { sets: 3, reps: 10, rest: 90, loadAu: 12 },
      },
    },
    { name: "Copenhagen Hip-Flexor March", ov: { rehabStage: 2 } },
    {
      name: "Psoas Iso Hold (90/90)",
      ov: {
        contractionType: "isometric",
        category: "isometrics",
        loadingRateBand: "none",
        defaults: { sets: 4, hold: 20, rest: 45, loadAu: 6 },
      },
    },
  ],
});

// ITB — hip-driven; loading fix is glute/TFL capacity + running volume, not stretching
G.push({
  key: "itb",
  category: "rehab",
  movement: "hip_abduction",
  contractionType: "isotonic",
  jointEmphasis: "neutral",
  loadingRateBand: "low",
  evidenceTier: "CONSENSUS",
  rehabStage: 2,
  movementPattern: "Lateral Hip / ITB",
  muscleGroups: ["glutes", "TFL"],
  targetMuscles: ["gluteus medius", "tensor fasciae latae"],
  positions: [],
  defaults: {
    sets: 3,
    reps: 12,
    rest: 60,
    loadAu: 10,
    difficulty: "intermediate",
  },
  how: "ITB syndrome is a compression/overuse problem governed by hip control + running volume — build lateral-hip capacity and manage impact volume; foam rolling the band itself does little.",
  cues: [
    "Control the pelvis",
    "Slow eccentric",
    "Pair with a running-volume cut",
  ],
  variants: [
    { name: "Side Plank with Hip Abduction", ov: { rehabStage: 2 } },
    { name: "Standing Cable Hip Abduction", ov: { rehabStage: 2 } },
    {
      name: "Step-Down with Pelvic Control",
      ov: { movement: "knee_extension", rehabStage: 3 },
    },
    {
      name: "ITB / TFL Foam Roll",
      ov: {
        category: "foam_roll",
        contractionType: "stretch",
        loadingRateBand: "none",
        rehabStage: 1,
        defaults: { sets: 1, duration: 60, loadAu: 0 },
      },
    },
  ],
});

// Peroneus — dynamic lateral ankle stabiliser (sprain recurrence)
G.push({
  key: "peroneus",
  category: "rehab",
  movement: "ankle_eversion",
  contractionType: "isotonic",
  jointEmphasis: "neutral",
  loadingRateBand: "low",
  evidenceTier: "COHORT",
  rehabStage: 2,
  movementPattern: "Ankle Eversion",
  muscleGroups: ["peroneals"],
  targetMuscles: ["peroneus longus", "peroneus brevis"],
  positions: [],
  defaults: { sets: 3, reps: 15, rest: 45, loadAu: 8, difficulty: "beginner" },
  how: "Peroneal strength + reaction time is THE protective variable against lateral ankle sprain recurrence — load eversion and add reactive perturbation.",
  cues: [
    "Turn the sole outward against resistance",
    "Slow return",
    "Progress to reactive perturbation",
  ],
  variants: [
    { name: "Banded Ankle Eversion", ov: { rehabStage: 1 } },
    { name: "Weighted Ankle Eversion", ov: { rehabStage: 2 } },
    {
      name: "Lateral Hop-and-Stick (Peroneal Reaction)",
      ov: {
        movement: "ankle_balance",
        loadingRateBand: "moderate",
        rehabStage: 3,
      },
    },
  ],
});

// Plantaris / calf complex extra (tennis leg)
G.push({
  key: "plantaris",
  category: "rehab",
  movement: "plantarflexion_bent",
  contractionType: "isotonic",
  jointEmphasis: "knee_bent",
  loadingRateBand: "low",
  evidenceTier: "CONSENSUS",
  rehabStage: 2,
  movementPattern: "Calf Complex",
  muscleGroups: ["calves"],
  targetMuscles: ["plantaris", "gastrocnemius", "soleus"],
  positions: [],
  defaults: { sets: 3, reps: 12, rest: 90, loadAu: 12, difficulty: "beginner" },
  how: "Graded calf-complex loading after a plantaris / medial-gastroc strain ('tennis leg').",
  cues: ["Full range", "Slow tempo", "Progress load as pain settles overnight"],
  variants: [
    { name: "Bent-Knee Calf Raise (Plantaris/Soleus)", ov: { rehabStage: 2 } },
    {
      name: "Straight-Knee Calf Raise (Gastroc/Plantaris)",
      ov: { movement: "plantarflexion_straight", rehabStage: 2 },
    },
    {
      name: "Eccentric Calf Lower (Plantaris)",
      ov: {
        contractionType: "eccentric",
        movement: "plantarflexion_straight",
        rehabStage: 2,
      },
    },
  ],
});

// ══ STRENGTH ════════════════════════════════════════════════════════════════
G.push({
  key: "squat",
  category: "strength",
  movement: "squat",
  contractionType: "isotonic",
  jointEmphasis: "neutral",
  loadingRateBand: "low",
  evidenceTier: "CONSENSUS",
  movementPattern: "Squat",
  muscleGroups: ["quadriceps", "glutes"],
  targetMuscles: ["quadriceps", "gluteus maximus"],
  positions: [],
  defaults: {
    sets: 4,
    reps: 6,
    rest: 150,
    loadAu: 22,
    difficulty: "intermediate",
  },
  how: "Bilateral + single-leg squat patterns — the foundational lower-body strength driver.",
  cues: [
    "Brace the trunk",
    "Knees track over toes",
    "Full depth you can control",
  ],
  variants: [
    { name: "Back Squat", ov: {} },
    { name: "Front Squat", ov: {} },
    {
      name: "Goblet Squat",
      ov: {
        defaults: {
          sets: 3,
          reps: 10,
          rest: 90,
          loadAu: 16,
          difficulty: "beginner",
        },
      },
    },
    {
      name: "Bulgarian Split Squat",
      ov: { defaults: { sets: 3, reps: 8, rest: 90, loadAu: 18 } },
    },
    {
      name: "Walking Lunge",
      ov: { defaults: { sets: 3, reps: 10, rest: 90, loadAu: 16 } },
    },
    { name: "Reverse Lunge", ov: {} },
    { name: "Lateral Lunge", ov: { movement: "hip_adduction" } },
    { name: "Step-Up (Loaded)", ov: {} },
    { name: "Pistol Squat (Assisted)", ov: { difficulty: "advanced" } },
    {
      name: "Tempo Back Squat (3s Eccentric)",
      ov: { contractionType: "eccentric" },
    },
  ],
});

G.push({
  key: "hinge",
  category: "strength",
  movement: "hip_hinge",
  contractionType: "isotonic",
  jointEmphasis: "neutral",
  loadingRateBand: "low",
  evidenceTier: "CONSENSUS",
  movementPattern: "Hip Hinge",
  muscleGroups: ["hamstrings", "glutes"],
  targetMuscles: ["hamstrings", "gluteus maximus", "erector spinae"],
  positions: [],
  defaults: {
    sets: 4,
    reps: 6,
    rest: 150,
    loadAu: 22,
    difficulty: "intermediate",
  },
  how: "Hip-hinge strength for posterior chain + sprint force production.",
  cues: [
    "Hinge from the hips, flat back",
    "Push the floor away",
    "Lock out tall",
  ],
  variants: [
    { name: "Conventional Deadlift", ov: {} },
    { name: "Romanian Deadlift", ov: {} },
    { name: "Single-Leg Romanian Deadlift", ov: {} },
    { name: "Trap-Bar Deadlift", ov: {} },
    {
      name: "Kettlebell Swing",
      ov: {
        movement: "hip_hinge",
        loadingRateBand: "moderate",
        defaults: { sets: 4, reps: 15, rest: 90, loadAu: 18 },
      },
    },
    { name: "Good Morning", ov: {} },
    { name: "Hip Thrust", ov: { movement: "hip_extension" } },
    { name: "45-Degree Back Extension", ov: {} },
  ],
});

G.push({
  key: "upper_push",
  category: "strength",
  movement: "horizontal_push",
  contractionType: "isotonic",
  jointEmphasis: "n/a",
  loadingRateBand: "low",
  evidenceTier: "CONSENSUS",
  movementPattern: "Upper Push",
  muscleGroups: ["chest", "shoulders", "triceps"],
  targetMuscles: ["pectoralis major", "deltoid", "triceps"],
  positions: [],
  defaults: {
    sets: 4,
    reps: 6,
    rest: 120,
    loadAu: 18,
    difficulty: "intermediate",
  },
  how: "Horizontal + vertical pressing strength.",
  cues: ["Shoulder blades set", "Elbows ~45 degrees", "Full lockout"],
  variants: [
    { name: "Barbell Bench Press", ov: {} },
    { name: "Dumbbell Bench Press", ov: {} },
    { name: "Incline Dumbbell Press", ov: {} },
    {
      name: "Push-Up",
      ov: {
        defaults: {
          sets: 3,
          reps: 12,
          rest: 60,
          loadAu: 12,
          difficulty: "beginner",
        },
      },
    },
    { name: "Overhead Press", ov: { movement: "vertical_push" } },
    { name: "Dumbbell Shoulder Press", ov: { movement: "vertical_push" } },
    { name: "Dip", ov: {} },
    { name: "Landmine Press", ov: { movement: "vertical_push" } },
  ],
});

G.push({
  key: "upper_pull",
  category: "strength",
  movement: "horizontal_pull",
  contractionType: "isotonic",
  jointEmphasis: "n/a",
  loadingRateBand: "low",
  evidenceTier: "CONSENSUS",
  movementPattern: "Upper Pull",
  muscleGroups: ["back", "biceps"],
  targetMuscles: ["latissimus dorsi", "rhomboids", "biceps"],
  positions: [],
  defaults: {
    sets: 4,
    reps: 8,
    rest: 120,
    loadAu: 16,
    difficulty: "intermediate",
  },
  how: "Horizontal + vertical pulling for a balanced, robust shoulder and posterior chain.",
  cues: [
    "Lead with the elbows",
    "Squeeze the shoulder blades",
    "Control the return",
  ],
  variants: [
    { name: "Barbell Bent-Over Row", ov: {} },
    { name: "Single-Arm Dumbbell Row", ov: {} },
    { name: "Pull-Up", ov: { movement: "vertical_pull" } },
    { name: "Chin-Up", ov: { movement: "vertical_pull" } },
    { name: "Lat Pulldown", ov: { movement: "vertical_pull" } },
    { name: "Seated Cable Row", ov: {} },
    {
      name: "Inverted Row",
      ov: {
        defaults: {
          sets: 3,
          reps: 10,
          rest: 90,
          loadAu: 12,
          difficulty: "beginner",
        },
      },
    },
    { name: "Face Pull", ov: { movement: "arm_care" } },
  ],
});

G.push({
  key: "carry",
  category: "strength",
  movement: "carry",
  contractionType: "isometric",
  jointEmphasis: "n/a",
  loadingRateBand: "low",
  evidenceTier: "CONSENSUS",
  movementPattern: "Loaded Carry",
  muscleGroups: ["core", "grip", "traps"],
  targetMuscles: ["core", "forearms"],
  positions: [],
  defaults: { sets: 3, reps: 40, rest: 90, loadAu: 14, difficulty: "beginner" },
  how: "Loaded carries build trunk stiffness, grip and general robustness.",
  cues: ["Tall, braced trunk", "Quiet steps", "Grip hard"],
  variants: [
    { name: "Farmer's Carry", ov: {} },
    { name: "Suitcase Carry", ov: {} },
    { name: "Front-Rack Carry", ov: {} },
    { name: "Overhead Carry", ov: { movement: "vertical_push" } },
  ],
});

// ══ CORE ════════════════════════════════════════════════════════════════════
G.push({
  key: "core",
  category: "strength",
  movement: "anti_extension",
  contractionType: "isometric",
  jointEmphasis: "n/a",
  loadingRateBand: "low",
  evidenceTier: "CONSENSUS",
  movementPattern: "Core",
  muscleGroups: ["core"],
  targetMuscles: ["rectus abdominis", "obliques", "transverse abdominis"],
  positions: [],
  defaults: { sets: 3, reps: 10, rest: 60, loadAu: 8, difficulty: "beginner" },
  how: "Anti-extension / anti-rotation trunk control that braces for sprinting, cutting and throwing.",
  cues: [
    "Brace, don't hold your breath",
    "Ribs down",
    "Move the limbs, not the spine",
  ],
  variants: [
    {
      name: "Front Plank",
      ov: {
        contractionType: "isometric",
        defaults: { sets: 3, hold: 40, rest: 45, loadAu: 6 },
      },
    },
    {
      name: "Side Plank",
      ov: {
        contractionType: "isometric",
        defaults: { sets: 3, hold: 30, rest: 45, loadAu: 6 },
      },
    },
    { name: "Dead Bug", ov: {} },
    { name: "Bird Dog", ov: {} },
    { name: "Pallof Press", ov: { movement: "core_rotation" } },
    { name: "Ab Wheel Rollout", ov: { difficulty: "advanced" } },
    {
      name: "Hollow Body Hold",
      ov: {
        contractionType: "isometric",
        defaults: { sets: 3, hold: 30, rest: 45, loadAu: 6 },
      },
    },
    { name: "Cable Woodchop", ov: { movement: "core_rotation" } },
    { name: "Hanging Leg Raise", ov: { movement: "hip_flexion" } },
  ],
});

// ══ POWER / PLYOMETRICS — the loading-RATE ladder (§2.1) ═════════════════════
G.push({
  key: "plyo_ladder",
  category: "plyometrics",
  movement: "jump_land",
  contractionType: "plyometric",
  jointEmphasis: "neutral",
  loadingRateBand: "moderate",
  peakLoadBw: 5,
  evidenceTier: "META",
  movementPattern: "Jump / Land",
  muscleGroups: ["quadriceps", "calves", "glutes"],
  targetMuscles: ["quadriceps", "gastrocnemius", "gluteus maximus"],
  positions: [],
  defaults: {
    sets: 4,
    reps: 5,
    rest: 120,
    loadAu: 18,
    difficulty: "intermediate",
  },
  how: "Plyometric ladder ordered by LOADING RATE, low → very high. Progress rate, not just height — this is the axis the tendon rehab ladder shares.",
  cues: [
    "Land soft, absorb",
    "Minimise ground time only on the high rungs",
    "Quality over quantity",
  ],
  variants: [
    {
      name: "Pogo Hops",
      ov: {
        movement: "plantarflexion_ballistic",
        loadingRateBand: "moderate",
        peakLoadBw: 3,
      },
    },
    {
      name: "Ankle Hops",
      ov: {
        movement: "plantarflexion_ballistic",
        loadingRateBand: "moderate",
        peakLoadBw: 3,
      },
    },
    { name: "Countermovement Jump", ov: { loadingRateBand: "moderate" } },
    { name: "Box Jump (Step Down)", ov: { loadingRateBand: "moderate" } },
    { name: "Broad Jump", ov: { loadingRateBand: "high" } },
    {
      name: "Bounding",
      ov: { movement: "plantarflexion_ballistic", loadingRateBand: "high" },
    },
    {
      name: "Depth Jump (Low Box)",
      ov: { loadingRateBand: "high", peakLoadBw: 6, difficulty: "advanced" },
    },
    {
      name: "Stop-Land-Jump",
      ov: {
        loadingRateBand: "very_high",
        peakLoadBw: 6.6,
        difficulty: "advanced",
      },
    },
    {
      name: "Single-Leg Bounding",
      ov: {
        movement: "plantarflexion_ballistic",
        loadingRateBand: "very_high",
        difficulty: "advanced",
      },
    },
  ],
});

G.push({
  key: "power",
  category: "power",
  movement: "hip_extension",
  contractionType: "plyometric",
  jointEmphasis: "neutral",
  loadingRateBand: "high",
  evidenceTier: "CONSENSUS",
  movementPattern: "Triple-Extension Power",
  muscleGroups: ["glutes", "quadriceps", "hamstrings"],
  targetMuscles: ["gluteus maximus", "quadriceps", "hamstrings"],
  positions: [],
  defaults: { sets: 5, reps: 3, rest: 150, loadAu: 20, difficulty: "advanced" },
  how: "Ballistic triple-extension power — the transfer to acceleration and the block.",
  cues: ["Explode, full extension", "Reset every rep", "Fresh CNS only"],
  variants: [
    { name: "Trap-Bar Jump", ov: {} },
    { name: "Hang Power Clean", ov: {} },
    { name: "Push Press", ov: { movement: "vertical_push" } },
    { name: "Medicine Ball Slam", ov: { movement: "core_rotation" } },
    {
      name: "Rotational Medicine Ball Throw",
      ov: { movement: "core_rotation" },
    },
    { name: "Kettlebell Swing (Power)", ov: { movement: "hip_hinge" } },
  ],
});

// ══ SPEED / AGILITY ═════════════════════════════════════════════════════════
G.push({
  key: "speed",
  category: "speed",
  movement: "sprint",
  contractionType: "isotonic",
  jointEmphasis: "neutral",
  loadingRateBand: "very_high",
  evidenceTier: "COHORT",
  movementPattern: "Max-Velocity Sprint",
  muscleGroups: ["hamstrings", "glutes", "calves"],
  targetMuscles: ["hamstrings", "gluteus maximus", "gastrocnemius"],
  positions: [],
  defaults: { sets: 6, reps: 1, rest: 180, loadAu: 22, difficulty: "advanced" },
  how: "Max-velocity + acceleration exposure. Hitting >95% Vmax at least once is protective (Malone OR 0.12) — sprint is a vaccine, not a poison. Program it, don't remove it for stiffness.",
  cues: [
    "Full recovery between reps",
    "Quality speed, not conditioning",
    "At least one true max-velocity exposure",
  ],
  variants: [
    { name: "Flying 20m Sprint", ov: {} },
    { name: "Acceleration Sprint (10-20m)", ov: {} },
    { name: "Resisted Sled Sprint", ov: { loadingRateBand: "high" } },
    {
      name: "Hill Sprint",
      ov: { movement: "impact_run", loadingRateBand: "high" },
    },
    { name: "Wicket Runs", ov: {} },
    {
      name: "Build-Up Sprint (Tempo)",
      ov: { loadingRateBand: "high", difficulty: "intermediate" },
    },
    { name: "Flying 30m Sprint", ov: {} },
  ],
});

G.push({
  key: "agility",
  category: "agility",
  movement: "cutting",
  contractionType: "plyometric",
  jointEmphasis: "neutral",
  loadingRateBand: "high",
  evidenceTier: "META",
  movementPattern: "Change of Direction",
  muscleGroups: ["quadriceps", "glutes", "adductors"],
  targetMuscles: ["quadriceps", "gluteus maximus", "adductors"],
  positions: [],
  defaults: {
    sets: 4,
    reps: 4,
    rest: 120,
    loadAu: 18,
    difficulty: "intermediate",
  },
  how: "Change-of-direction + deceleration mechanics. PLANNED first, REACTIVE last — unanticipated COD loads the knee most and is restored last after injury; it belongs early on a fresh CNS.",
  cues: [
    "Decelerate under control",
    "Low hips on the cut",
    "Plant, don't collapse the knee",
  ],
  variants: [
    { name: "5-10-5 Pro Agility (Planned)", ov: {} },
    { name: "T-Drill (Planned)", ov: {} },
    { name: "L-Drill / 3-Cone", ov: {} },
    { name: "Deceleration Drill", ov: {} },
    { name: "Lateral Shuffle", ov: {} },
    {
      name: "Reactive Mirror Drill (Unanticipated)",
      ov: { loadingRateBand: "very_high", difficulty: "advanced" },
    },
    {
      name: "Reactive Cut off a Cue (Unanticipated)",
      ov: { loadingRateBand: "very_high", difficulty: "advanced" },
    },
    {
      name: "Ladder Footwork",
      ov: { movement: "neutral", loadingRateBand: "moderate" },
    },
  ],
});

// ══ MOBILITY / WARM-UP / COOL-DOWN ══════════════════════════════════════════
G.push({
  key: "mobility",
  category: "mobility",
  movement: "neutral",
  contractionType: "stretch",
  jointEmphasis: "n/a",
  loadingRateBand: "none",
  evidenceTier: "CONSENSUS",
  movementPattern: "Mobility",
  muscleGroups: ["full body"],
  targetMuscles: [],
  positions: [],
  defaults: { sets: 1, reps: 8, rest: 15, loadAu: 2, difficulty: "beginner" },
  how: "Dynamic mobility to prepare the joints and tissues through range.",
  cues: ["Move through full range", "Controlled, not ballistic", "Breathe"],
  variants: [
    { name: "World's Greatest Stretch", ov: {} },
    { name: "90/90 Hip Switch", ov: {} },
    { name: "Ankle Dorsiflexion Rock", ov: { movement: "ankle_dorsiflexion" } },
    { name: "Hip Flexor Couch Stretch", ov: { movement: "hip_flexion" } },
    { name: "Thoracic Spine Rotation", ov: { movement: "core_rotation" } },
    { name: "Leg Swings (Front-to-Back)", ov: {} },
    { name: "Leg Swings (Lateral)", ov: { movement: "hip_adduction" } },
    { name: "Cat-Cow", ov: {} },
    { name: "Adductor Rock-Back", ov: { movement: "hip_adduction" } },
    { name: "Spiderman with Rotation", ov: {} },
  ],
});

G.push({
  key: "warmup",
  category: "warm_up",
  movement: "neutral",
  contractionType: "isotonic",
  jointEmphasis: "n/a",
  loadingRateBand: "low",
  evidenceTier: "META",
  movementPattern: "Warm-Up (FIFA 11+ style)",
  muscleGroups: ["full body"],
  targetMuscles: [],
  positions: [],
  defaults: { sets: 1, reps: 10, rest: 15, loadAu: 4, difficulty: "beginner" },
  how: "Structured neuromuscular warm-up (FIFA 11+ family) — reduces injuries RR ~0.66 across meta-of-metas.",
  cues: [
    "Progress intensity through the warm-up",
    "Nail the landing mechanics",
    "Finish sharp, not tired",
  ],
  variants: [
    { name: "A-Skip", ov: {} },
    { name: "B-Skip", ov: {} },
    { name: "High-Knee March", ov: {} },
    {
      name: "Carioca",
      ov: { movement: "cutting", loadingRateBand: "moderate" },
    },
    { name: "Walking Knee Hug", ov: { movement: "hip_flexion" } },
    { name: "Walking Quad Pull", ov: {} },
    { name: "Dynamic Leg Swing Series", ov: {} },
    {
      name: "Build-Up Strides",
      ov: { movement: "sprint", loadingRateBand: "moderate" },
    },
  ],
});

G.push({
  key: "cooldown",
  category: "cool_down",
  movement: "neutral",
  contractionType: "stretch",
  jointEmphasis: "n/a",
  loadingRateBand: "none",
  evidenceTier: "CONSENSUS",
  movementPattern: "Cool-Down",
  muscleGroups: ["full body"],
  targetMuscles: [],
  positions: [],
  defaults: {
    sets: 1,
    reps: 1,
    hold: 30,
    rest: 10,
    loadAu: 0,
    difficulty: "beginner",
  },
  how: "Down-regulation stretching + breathing to shift toward parasympathetic recovery.",
  cues: ["Hold 30-45s", "Breathe into the stretch", "No bouncing"],
  variants: [
    { name: "Standing Hamstring Stretch", ov: { movement: "hip_hinge" } },
    { name: "Figure-4 Glute Stretch", ov: { movement: "hip_extension" } },
    { name: "Quad Stretch", ov: { movement: "knee_extension" } },
    {
      name: "Calf Stretch (Gastroc)",
      ov: { movement: "plantarflexion_straight" },
    },
    {
      name: "Calf Stretch (Soleus, Bent Knee)",
      ov: { movement: "plantarflexion_bent" },
    },
    { name: "Pigeon Stretch", ov: { movement: "hip_extension" } },
    { name: "Box Breathing (4-4-4-4)", ov: { category: "recovery" } },
  ],
});

// ══ ARM-CARE (QB / thrower) ═════════════════════════════════════════════════
G.push({
  key: "arm_care",
  category: "rehab",
  movement: "arm_care",
  contractionType: "isotonic",
  jointEmphasis: "n/a",
  loadingRateBand: "low",
  evidenceTier: "CONSENSUS",
  rehabStage: 1,
  movementPattern: "Arm Care",
  muscleGroups: ["rotator cuff", "scapular stabilizers", "forearm"],
  targetMuscles: [
    "infraspinatus",
    "teres minor",
    "serratus anterior",
    "flexor-pronator mass",
  ],
  positions: ["qb"],
  defaults: { sets: 3, reps: 15, rest: 45, loadAu: 6, difficulty: "beginner" },
  how: "Posterior-cuff + scapular + flexor-pronator care for throwers. The throw's DECELERATION phase damages the posterior cuff/labrum; the flexor-pronator mass dynamically protects the UCL. Throw count is a load metric — track it.",
  cues: [
    "Light load, high quality",
    "Control the eccentric",
    "Full scapular range",
  ],
  variants: [
    { name: "Band External Rotation (Cuff)", ov: {} },
    { name: "Prone Y-T-W Raise", ov: {} },
    { name: "Scapular Wall Slide", ov: {} },
    {
      name: "Sleeper Stretch (GIRD)",
      ov: { contractionType: "stretch", loadingRateBand: "none" },
    },
    { name: "Band Pull-Apart", ov: {} },
    {
      name: "Wrist Flexor-Pronator Eccentric",
      ov: { contractionType: "eccentric" },
    },
    {
      name: "Rhythmic Stabilization (Cuff)",
      ov: { contractionType: "isometric" },
    },
  ],
});

// ══ CONDITIONING (energy systems) ══════════════════════════════════════════
G.push({
  key: "conditioning",
  category: "conditioning",
  movement: "neutral",
  contractionType: "isotonic",
  jointEmphasis: "n/a",
  loadingRateBand: "moderate",
  evidenceTier: "CONSENSUS",
  movementPattern: "Conditioning",
  muscleGroups: ["full body"],
  targetMuscles: [],
  positions: [],
  defaults: {
    sets: 6,
    reps: 1,
    rest: 90,
    loadAu: 16,
    difficulty: "intermediate",
  },
  how: "Energy-system conditioning matched to flag football's repeated-sprint demand. Low-impact options exist for tissue-flagged athletes who must keep chronic load up.",
  cues: [
    "Hit the target work:rest",
    "Quality reps, not junk volume",
    "Use low-impact options when tissue-flagged",
  ],
  variants: [
    {
      name: "Tempo Runs (100m Repeats)",
      ov: { movement: "impact_run", loadingRateBand: "moderate" },
    },
    {
      name: "Repeated-Sprint Ability (6x40m)",
      ov: { movement: "sprint", loadingRateBand: "high" },
    },
    {
      name: "Shuttle Conditioning (Beep Test)",
      ov: { movement: "cutting", loadingRateBand: "high" },
    },
    { name: "Assault Bike Intervals", ov: { loadingRateBand: "low" } },
    { name: "Rowing Intervals", ov: { loadingRateBand: "low" } },
    { name: "Sled Push (Heavy)", ov: { loadingRateBand: "moderate" } },
    {
      name: "Sled Drag (Backward)",
      ov: { movement: "knee_extension", loadingRateBand: "low" },
    },
    { name: "Ski-Erg Intervals", ov: { loadingRateBand: "low" } },
    { name: "Aqua Jog (Deconditioning-Safe)", ov: { loadingRateBand: "none" } },
    { name: "Bike Tempo (Zone 2)", ov: { loadingRateBand: "none" } },
  ],
});

// ══ SINGLE-LEG STRENGTH (asymmetry + robustness) ════════════════════════════
G.push({
  key: "single_leg",
  category: "strength",
  movement: "squat",
  contractionType: "isotonic",
  jointEmphasis: "neutral",
  loadingRateBand: "low",
  evidenceTier: "CONSENSUS",
  movementPattern: "Single-Leg Strength",
  muscleGroups: ["quadriceps", "glutes", "hamstrings"],
  targetMuscles: ["quadriceps", "gluteus maximus"],
  positions: [],
  defaults: {
    sets: 3,
    reps: 8,
    rest: 90,
    loadAu: 16,
    difficulty: "intermediate",
  },
  how: "Single-leg strength exposes and closes left/right asymmetries — a robustness driver and an ACL/hamstring risk reducer.",
  cues: [
    "Control the knee over the foot",
    "Own the bottom position",
    "Match reps both sides",
  ],
  variants: [
    { name: "Skater Squat", ov: {} },
    { name: "Rear-Foot-Elevated Split Squat (Deficit)", ov: {} },
    { name: "Single-Leg Press", ov: { movement: "knee_extension" } },
    { name: "Single-Leg Box Squat", ov: {} },
    { name: "Curtsy Lunge", ov: {} },
    { name: "Cossack Squat", ov: { movement: "hip_adduction" } },
    { name: "Single-Leg Hip Thrust", ov: { movement: "hip_extension" } },
    {
      name: "Step-Down (Slow Eccentric)",
      ov: { movement: "knee_extension", contractionType: "eccentric" },
    },
  ],
});

// ══ POSITION-SPECIFIC FOOTWORK (WR/DB/RB/QB/OL-DL) ══════════════════════════
G.push({
  key: "position_footwork",
  category: "skill_drills",
  movement: "cutting",
  contractionType: "plyometric",
  jointEmphasis: "neutral",
  loadingRateBand: "high",
  evidenceTier: "HEURISTIC",
  movementPattern: "Position Footwork",
  muscleGroups: ["quadriceps", "glutes", "calves"],
  targetMuscles: ["quadriceps", "gluteus maximus"],
  positions: [],
  defaults: {
    sets: 4,
    reps: 4,
    rest: 90,
    loadAu: 14,
    difficulty: "intermediate",
  },
  how: "Position-specific movement skill. Reactive/read variants are the highest value AND highest risk — they belong early on a fresh CNS, restored last after injury.",
  cues: [
    "Sharp, low, controlled",
    "Decelerate before you cut",
    "Reactive work only when fresh",
  ],
  variants: [
    { name: "WR Release Footwork", ov: {} },
    {
      name: "WR Route-Break (Sharp Cut)",
      ov: { loadingRateBand: "very_high" },
    },
    { name: "DB Backpedal-and-Break", ov: {} },
    { name: "DB Hip-Flip Transition", ov: {} },
    { name: "RB Jump-Cut", ov: { loadingRateBand: "very_high" } },
    { name: "RB Jab-Step Footwork", ov: {} },
    {
      name: "QB 3-Step Drop",
      ov: {
        movement: "neutral",
        loadingRateBand: "moderate",
        positions: ["qb"],
      },
    },
    {
      name: "QB 5-Step Drop",
      ov: {
        movement: "neutral",
        loadingRateBand: "moderate",
        positions: ["qb"],
      },
    },
    {
      name: "QB Rollout Footwork",
      ov: {
        movement: "neutral",
        loadingRateBand: "moderate",
        positions: ["qb"],
      },
    },
    { name: "Line Get-Off First Step", ov: {} },
    { name: "Mirror-Dodge (Reactive)", ov: { loadingRateBand: "very_high" } },
    {
      name: "Read-and-React Cut (Unanticipated)",
      ov: { loadingRateBand: "very_high", difficulty: "advanced" },
    },
  ],
});

// ══ QUAD / HAMSTRING extra rehab (net-new tissue depth) ═════════════════════
G.push({
  key: "quad_rehab",
  category: "rehab",
  movement: "knee_extension",
  contractionType: "isotonic",
  jointEmphasis: "neutral",
  loadingRateBand: "low",
  evidenceTier: "CONSENSUS",
  rehabStage: 2,
  movementPattern: "Knee Extensor Rehab",
  muscleGroups: ["quadriceps"],
  targetMuscles: ["vastus medialis", "rectus femoris"],
  positions: [],
  defaults: { sets: 3, reps: 12, rest: 60, loadAu: 10, difficulty: "beginner" },
  how: "Graded quadriceps rehab — VMO emphasis and terminal-range control for patellofemoral (runner's knee) and post-knee-injury loading.",
  cues: [
    "Slow terminal extension",
    "Track the knee over the 2nd toe",
    "Diffuse ache OK, sharp pain no",
  ],
  variants: [
    { name: "Terminal Knee Extension (Band)", ov: { rehabStage: 1 } },
    {
      name: "Straight-Leg Raise (Quad Set)",
      ov: { rehabStage: 1, contractionType: "isometric" },
    },
    { name: "Short-Arc Quad Extension", ov: { rehabStage: 2 } },
    {
      name: "Wall-Sit VMO Hold",
      ov: {
        contractionType: "isometric",
        category: "isometrics",
        rehabStage: 1,
        defaults: { sets: 4, hold: 30, rest: 45, loadAu: 8 },
      },
    },
    {
      name: "Reverse Nordic (Quad Eccentric)",
      ov: {
        contractionType: "eccentric",
        rehabStage: 3,
        difficulty: "advanced",
      },
    },
    { name: "Poliquin Step-Up", ov: { rehabStage: 3 } },
  ],
});

G.push({
  key: "ham_hinge_rehab",
  category: "rehab",
  movement: "hip_hinge",
  contractionType: "isotonic",
  jointEmphasis: "neutral",
  loadingRateBand: "low",
  evidenceTier: "COHORT",
  rehabStage: 2,
  movementPattern: "Hamstring Hinge Rehab",
  muscleGroups: ["hamstrings", "glutes"],
  targetMuscles: ["biceps femoris", "semitendinosus"],
  positions: [],
  defaults: { sets: 3, reps: 10, rest: 90, loadAu: 12, difficulty: "beginner" },
  how: "Hip-dominant hamstring loading that progresses length and strength between the isometric and Nordic ends.",
  cues: [
    "Hinge, flat back",
    "Feel it in the hamstring belly",
    "Control the lengthening",
  ],
  variants: [
    { name: "Hip Hinge (Dowel)", ov: { rehabStage: 1 } },
    {
      name: "Single-Leg Hamstring Slider Curl",
      ov: { movement: "knee_flexion_eccentric", rehabStage: 3 },
    },
    {
      name: "Prone Band Hamstring Curl",
      ov: { movement: "knee_flexion_eccentric", rehabStage: 1 },
    },
    { name: "45-Degree Hip Extension (Hamstring Bias)", ov: { rehabStage: 2 } },
    { name: "Stiff-Leg Deadlift (Light)", ov: { rehabStage: 2 } },
  ],
});

// ══ HAND / FINGER / WRIST — the #1 adult flag-football injury, zero content ══
G.push({
  key: "hand_finger",
  category: "rehab",
  movement: "grip",
  contractionType: "isotonic",
  jointEmphasis: "n/a",
  loadingRateBand: "low",
  evidenceTier: "CONSENSUS",
  rehabStage: 1,
  movementPattern: "Hand / Finger",
  muscleGroups: ["forearm", "hand"],
  targetMuscles: ["finger flexors", "finger extensors", "intrinsics"],
  positions: [],
  defaults: { sets: 3, reps: 15, rest: 45, loadAu: 4, difficulty: "beginner" },
  how: "Fingers are the #1 injured body part in adult flag football (NEISS). Grip + finger capacity and a buddy-taping protocol are the prevention. RED FLAG: can't actively extend the DIP but full passive ROM = mallet finger → splint + clinician; players call it 'jammed' and keep playing until it's permanent.",
  cues: [
    "Full, pain-free finger range",
    "Buddy-tape an unstable joint (<20 deg opening, firm endpoint)",
    "Can't straighten the fingertip? Stop — see a clinician",
  ],
  variants: [
    { name: "Finger Extension (Rubber Band)", ov: {} },
    { name: "Towel Grip Crush", ov: {} },
    { name: "Rice-Bucket Finger Dig", ov: {} },
    { name: "Putty Finger Spread", ov: {} },
    { name: "Buddy-Tape Catch Progression", ov: { evidenceTier: "HEURISTIC" } },
    { name: "Tendon Glide Series", ov: { rehabStage: 1 } },
    { name: "Plate Pinch Hold", ov: { contractionType: "isometric" } },
    { name: "Reverse Wrist Curl (Extensor)", ov: {} },
    { name: "Wrist Flexor Curl", ov: {} },
    { name: "Wrist Radial/Ulnar Deviation", ov: {} },
  ],
});

// ══ NECK / UPPER-BACK robustness ════════════════════════════════════════════
G.push({
  key: "neck",
  category: "rehab",
  movement: "neutral",
  contractionType: "isometric",
  jointEmphasis: "n/a",
  loadingRateBand: "none",
  evidenceTier: "CONSENSUS",
  rehabStage: 1,
  movementPattern: "Neck / Cervical",
  muscleGroups: ["neck"],
  targetMuscles: ["deep neck flexors", "upper trapezius"],
  positions: [],
  defaults: { sets: 3, reps: 10, rest: 45, loadAu: 4, difficulty: "beginner" },
  how: "Cervical isometric capacity for collision robustness and stinger risk reduction.",
  cues: [
    "Gentle, controlled resistance",
    "No breath holding",
    "Stop on any arm symptoms",
  ],
  variants: [
    { name: "Neck Isometric (4-Way)", ov: {} },
    { name: "Chin Tuck (Deep Flexor)", ov: {} },
    { name: "Banded Neck Extension", ov: {} },
    { name: "Prone Cervical Retraction Hold", ov: {} },
  ],
});

// ══ EXTRA MOBILITY / MONITORING ═════════════════════════════════════════════
G.push({
  key: "mobility_extra",
  category: "mobility",
  movement: "neutral",
  contractionType: "stretch",
  jointEmphasis: "n/a",
  loadingRateBand: "none",
  evidenceTier: "CONSENSUS",
  movementPattern: "Mobility (Extended)",
  muscleGroups: ["full body"],
  targetMuscles: [],
  positions: [],
  defaults: { sets: 1, reps: 8, rest: 15, loadAu: 2, difficulty: "beginner" },
  how: "Extended joint-specific mobility drills.",
  cues: ["Full controlled range", "Own the end range", "Breathe"],
  variants: [
    {
      name: "Ankle Wall Dorsiflexion Test-Retest",
      ov: { movement: "ankle_dorsiflexion" },
    },
    { name: "Couch Stretch (Rectus Femoris)", ov: { movement: "hip_flexion" } },
    { name: "Banded Hip Distraction", ov: { movement: "hip_flexion" } },
    { name: "Seated Figure-4 (Piriformis)", ov: { movement: "hip_extension" } },
    { name: "Thread-the-Needle (T-Spine)", ov: { movement: "core_rotation" } },
    { name: "Wall Slides (Shoulder)", ov: { movement: "arm_care" } },
    { name: "Deep Squat Hold (Mobility)", ov: { movement: "squat" } },
    { name: "Standing Toe Touch Progression", ov: { movement: "hip_hinge" } },
  ],
});

// ══ RECOVERY MODALITIES (equipment-gated in the engine) ═════════════════════
G.push({
  key: "recovery_modality",
  category: "recovery",
  movement: "neutral",
  contractionType: "stretch",
  jointEmphasis: "n/a",
  loadingRateBand: "none",
  evidenceTier: "CONSENSUS",
  movementPattern: "Recovery Modality",
  muscleGroups: ["full body"],
  targetMuscles: [],
  positions: [],
  defaults: {
    sets: 1,
    reps: 1,
    duration: 120,
    rest: 10,
    loadAu: 0,
    difficulty: "beginner",
  },
  how: "Recovery modalities — the engine only recommends one the athlete actually owns (equipment gate). Localized tissue work for tightness, general for soreness.",
  cues: [
    "Match the modality to the flag",
    "Don't grind on acute injury",
    "Localized tightness → targeted; general soreness → broad",
  ],
  variants: [
    { name: "Massage-Gun (Quads)", ov: { movement: "knee_extension" } },
    {
      name: "Massage-Gun (Calves)",
      ov: { movement: "plantarflexion_straight" },
    },
    { name: "Massage-Gun (Glutes)", ov: { movement: "hip_extension" } },
    { name: "IASTM Scrape (Localized Tightness)", ov: {} },
    { name: "Compression Boots (Post-High-Load)", ov: {} },
    { name: "Contrast Shower Protocol", ov: {} },
    { name: "Guided Box-Breathing Down-Regulation", ov: {} },
    { name: "Foam Roll Full Lower-Body Flow", ov: { category: "foam_roll" } },
    {
      name: "Lacrosse-Ball Foot Release",
      ov: { movement: "ankle_dorsiflexion" },
    },
  ],
});

// ══ REACTIVE / ISOMETRIC extras ═════════════════════════════════════════════
G.push({
  key: "tendon_iso_extra",
  category: "isometrics",
  movement: "knee_extension",
  contractionType: "isometric",
  jointEmphasis: "neutral",
  loadingRateBand: "none",
  peakLoadBw: 4,
  evidenceTier: "CONTESTED",
  rehabStage: 1,
  movementPattern: "Tendon Isometric",
  muscleGroups: ["quadriceps", "glutes"],
  targetMuscles: ["quadriceps"],
  positions: [],
  defaults: { sets: 4, hold: 30, rest: 90, loadAu: 8, difficulty: "beginner" },
  how: "Heavy isometric holds — high tendon force at ZERO loading rate. The engine's go-to when an athlete is irritable but the adaptive stimulus must stay intact (Bohm: intensity, not contraction type, drives tendon adaptation).",
  cues: [
    "Build to a hard hold",
    "Keep it steady, no bounce",
    "Track your pain response per session",
  ],
  variants: [
    { name: "Isometric Split-Squat Hold", ov: { movement: "squat" } },
    {
      name: "Isometric Mid-Thigh Pull",
      ov: { movement: "hip_hinge", targetMuscles: ["hamstrings"] },
    },
    {
      name: "Isometric Calf-Raise Hold (Long)",
      ov: {
        movement: "plantarflexion_straight",
        targetMuscles: ["gastrocnemius"],
      },
    },
    {
      name: "Isometric Glute-Bridge March Hold",
      ov: { movement: "hip_extension" },
    },
    { name: "Isometric Wall-Sit (Long)", ov: {} },
    { name: "Overcoming Isometric Leg Press (Pins)", ov: {} },
  ],
});

export const FAMILIES_GENERAL = G;

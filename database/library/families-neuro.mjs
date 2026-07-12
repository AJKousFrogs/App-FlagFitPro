// Tissue Load Engine — neuromuscular / motor-control qualities for flag football.
//
// The traditional bilateral grind transfers poorly to a sport of sudden re-accel,
// cuts, and stochastic turf landings. These families train the qualities that DO
// transfer: rate of force development (RFD), reactive strength (RSI), intermuscular
// coordination, limb velocity, frontside sprint mechanics, force absorption, and
// reflexive joint stability.
//
// Evidence tiers (honest, per §11): early-phase RFD is neural & intent-driven
// (Aagaard 2002; Maffiuletti 2016 — RCT/mechanistic). RSI drop-jump quality
// (Flanagan & Comyns 2008 — cohort). Frontside/horizontal-force (Morin & Samozino
// — cohort). Contrast/PAPE (Seitz & Haff 2016 — meta). Perturbation/balance
// (FIFA 11+ RR 0.67 — RCT). HONEST CAVEAT: unstable-surface (Bosu/foam) resistance
// REDUCES force/power output (Behm & Colado 2012) — it is a proprioception/joint-
// stability tool, NOT an RFD/power tool. Force is organised on FIRM ground with
// UNILATERAL alternating + reactive work; unstable work is tiered CONTESTED and
// scoped to ankle/joint robustness only.

const N = [];

// ── RFD — explosive-intent isometrics (early-phase, neural) ─────────────────
N.push({
  key: "rfd_iso",
  category: "isometrics",
  movement: "knee_extension",
  contractionType: "isometric",
  jointEmphasis: "neutral",
  loadingRateBand: "very_high", // the INTENT is maximal-rate even at zero displacement
  peakLoadBw: 4,
  evidenceTier: "RCT",
  rehabStage: null,
  movementPattern: "Explosive Isometric (RFD)",
  muscleGroups: ["quadriceps", "glutes", "hamstrings"],
  targetMuscles: ["quadriceps", "gluteus maximus"],
  positions: [],
  defaults: {
    sets: 5,
    reps: 5,
    hold: 3,
    rest: 90,
    loadAu: 14,
    difficulty: "intermediate",
  },
  how: "Overcoming/ballistic isometrics — push as HARD and FAST as possible against an immovable resistance. Early-phase RFD (<100 ms) is neural (recruitment + firing rate); it responds to explosive INTENT, not slow grinding (Maffiuletti 2016).",
  cues: [
    "Push as fast as humanly possible",
    "Max intent for ~1s bursts",
    "Full recovery — this is quality, not conditioning",
  ],
  variants: [
    {
      name: "Overcoming Iso Mid-Thigh Pull (Explosive Intent)",
      ov: {
        movement: "hip_hinge",
        targetMuscles: ["hamstrings", "gluteus maximus"],
      },
    },
    { name: "Overcoming Iso Leg Press (Explosive Intent)", ov: {} },
    { name: "Explosive Iso Squat vs Pins", ov: { movement: "squat" } },
    {
      name: "Explosive Iso Calf Drive vs Pins",
      ov: {
        movement: "plantarflexion_straight",
        targetMuscles: ["gastrocnemius"],
      },
    },
    {
      name: "Ballistic Iso Hip-Thrust Bridge Drive",
      ov: { movement: "hip_extension", targetMuscles: ["gluteus maximus"] },
    },
    {
      name: "Wall-Drive Iso (Single-Leg Frontside Push)",
      ov: { movement: "hip_flexion", targetMuscles: ["iliopsoas"] },
    },
  ],
});

// ── Reactive strength / RSI — short ground-contact plyos ────────────────────
N.push({
  key: "reactive_strength",
  category: "plyometrics",
  movement: "plantarflexion_ballistic",
  contractionType: "plyometric",
  jointEmphasis: "neutral",
  loadingRateBand: "very_high",
  peakLoadBw: 6,
  evidenceTier: "COHORT",
  movementPattern: "Reactive Strength (RSI)",
  muscleGroups: ["calves", "quadriceps", "glutes"],
  targetMuscles: ["gastrocnemius", "soleus", "quadriceps"],
  positions: [],
  defaults: { sets: 4, reps: 6, rest: 120, loadAu: 18, difficulty: "advanced" },
  how: "Stiffness + stretch-shortening quality — RSI = jump height / ground-contact time. Minimise contact time; think 'hot ground'. This is the elastic engine for re-acceleration and cuts (Flanagan & Comyns 2008).",
  cues: [
    "Minimise ground time — hot ground",
    "Stiff, springy ankles",
    "Stop the set when contact time drags (quality gone)",
  ],
  variants: [
    { name: "Pogo Stiffness Series (RSI)", ov: {} },
    {
      name: "Continuous Rebound Jumps (Short Contact)",
      ov: { movement: "jump_land" },
    },
    {
      name: "Drop Jump for RSI (Optimal Box Height)",
      ov: { movement: "jump_land", peakLoadBw: 6.6 },
    },
    { name: "Repeat Hurdle Hops (Minimal Contact)", ov: {} },
    { name: "Single-Leg Pogo (RSI)", ov: {} },
    {
      name: "Ankle Stiffness Bounce (Straight-Leg)",
      ov: { movement: "plantarflexion_straight" },
    },
    { name: "Speed Bounding (Stiff Contacts)", ov: {} },
  ],
});

// ── Frontside sprint mechanics + horizontal force ───────────────────────────
N.push({
  key: "frontside",
  category: "speed",
  movement: "sprint",
  contractionType: "isotonic",
  jointEmphasis: "neutral",
  loadingRateBand: "high",
  evidenceTier: "COHORT",
  movementPattern: "Frontside Sprint Mechanics",
  muscleGroups: ["hip flexors", "hamstrings", "glutes", "calves"],
  targetMuscles: ["iliopsoas", "hamstrings", "gluteus maximus"],
  positions: [],
  defaults: {
    sets: 4,
    reps: 6,
    rest: 90,
    loadAu: 14,
    difficulty: "intermediate",
  },
  how: "Front-side mechanics — knee drive, dorsiflexion, and putting force into the ground behind you (horizontal orientation). Horizontal force production tracks sprint performance better than vertical strength (Morin & Samozino).",
  cues: [
    "Drive the knee up and front",
    "Dorsiflex — toe up, strike under the hip",
    "Push the ground back, don't reach",
  ],
  variants: [
    {
      name: "Wall Drive (Single Exchange)",
      ov: { movement: "hip_flexion", targetMuscles: ["iliopsoas"] },
    },
    {
      name: "Wall Drive (March → Switch → Run)",
      ov: { movement: "hip_flexion" },
    },
    { name: "A-March (Dorsiflexed)", ov: {} },
    { name: "A-Skip (Frontside)", ov: {} },
    { name: "A-Run", ov: {} },
    {
      name: "Straight-Leg Bound (Frontside Strike)",
      ov: { movement: "plantarflexion_ballistic" },
    },
    {
      name: "Ankling (Rolling Contacts)",
      ov: { movement: "plantarflexion_ballistic" },
    },
    { name: "Dribble Series (Low → High)", ov: {} },
    { name: "Acceleration Wall-Fall Push", ov: {} },
    { name: "Position Runs (Curved & Cut Entry)", ov: { movement: "cutting" } },
  ],
});

// ── Force absorption / landing (uneven terrain, turf) ───────────────────────
N.push({
  key: "force_absorption",
  category: "plyometrics",
  movement: "jump_land",
  contractionType: "eccentric",
  jointEmphasis: "neutral",
  loadingRateBand: "high",
  peakLoadBw: 6,
  evidenceTier: "CONSENSUS",
  movementPattern: "Force Absorption / Landing",
  muscleGroups: ["quadriceps", "glutes", "hamstrings"],
  targetMuscles: ["quadriceps", "gluteus maximus", "hamstrings"],
  positions: [],
  defaults: {
    sets: 4,
    reps: 6,
    rest: 90,
    loadAu: 16,
    difficulty: "intermediate",
  },
  how: "Landing = decelerating multiples of bodyweight in ~50 ms. Own the STICK before you own the bounce. Progress to firm-but-varied surfaces (turf, single-tilt) — NOT soft pads, which blunt force. Absorb through the hip, quiet the foot.",
  cues: [
    "Land soft, absorb through the hips",
    "Stick and hold 2s before you trust the bounce",
    "Quiet foot, knee tracks the 2nd toe",
  ],
  variants: [
    { name: "Snap-Down to Stick", ov: {} },
    { name: "Altitude Landing (Drop-and-Stick)", ov: {} },
    { name: "Single-Leg Stick Landing", ov: {} },
    {
      name: "Single-Leg Stick Landing (Turf/Varied Surface)",
      ov: {
        movement: "ankle_balance",
        muscleGroups: ["ankle stabilizers", "quadriceps"],
      },
    },
    { name: "Lateral Land-and-Stick", ov: { movement: "cutting" } },
    {
      name: "Rotational Land-and-Stick (Uneven Foot)",
      ov: { movement: "cutting" },
    },
    { name: "Depth Drop to Stabilised Land", ov: {} },
    {
      name: "Absorb-and-Redirect (Stick → Cut)",
      ov: { movement: "cutting", loadingRateBand: "very_high" },
    },
  ],
});

// ── Hip-flexion isometrics — absorbing + frontside ─────────────────────────
N.push({
  key: "hipflex_iso",
  category: "isometrics",
  movement: "hip_flexion",
  contractionType: "isometric",
  jointEmphasis: "n/a",
  loadingRateBand: "none",
  evidenceTier: "CONSENSUS",
  rehabStage: 1,
  movementPattern: "Hip-Flexion Isometric",
  muscleGroups: ["hip flexors", "core"],
  targetMuscles: ["iliopsoas", "rectus femoris"],
  positions: [],
  defaults: {
    sets: 4,
    reps: 4,
    hold: 20,
    rest: 60,
    loadAu: 8,
    difficulty: "beginner",
  },
  how: "Frontside knee-drive capacity + reflexive posture. Hold the sprint knee-drive position under load; the hip flexor both DRIVES the swing leg forward and helps ABSORB/reorganise force at foot strike.",
  cues: [
    "Drive the knee to hip height and HOLD",
    "Tall pelvis, ribs down",
    "Opposite arm locked in the sprint position",
  ],
  variants: [
    { name: "Banded Frontside Knee-Drive Hold", ov: {} },
    { name: "Dead-Leg Hip-Flexor Iso (90/90)", ov: {} },
    {
      name: "Standing Pallof-Anchored Knee-Drive Hold",
      ov: { movement: "core_rotation", muscleGroups: ["core"] },
    },
    { name: "Wall March Iso Hold (Sprint Posture)", ov: {} },
    { name: "Copenhagen-Anchored Frontside Hold", ov: {} },
    { name: "Isometric Split-Stance Frontside Load", ov: {} },
  ],
});

// ── Core for sprinting — reflexive, anti-rotation with limb drive ──────────
N.push({
  key: "sprint_core",
  category: "strength",
  movement: "anti_extension",
  contractionType: "isometric",
  jointEmphasis: "n/a",
  loadingRateBand: "moderate",
  evidenceTier: "CONSENSUS",
  movementPattern: "Sprint Core (Reflexive)",
  muscleGroups: ["core", "hip flexors"],
  targetMuscles: ["obliques", "transverse abdominis", "iliopsoas"],
  positions: [],
  defaults: {
    sets: 3,
    reps: 8,
    rest: 60,
    loadAu: 10,
    difficulty: "intermediate",
  },
  how: "The core's sprint job is proximal STIFFNESS to transmit force between alternating limbs while resisting the rotation that arm/leg drive creates. Train anti-rotation WITH limb movement, and reflexive (perturbed) bracing.",
  cues: [
    "Brace, then move the limbs against it",
    "Don't let the pelvis rotate",
    "Keep ribs stacked over the pelvis",
  ],
  variants: [
    { name: "Dead-Bug with Alternating Leg Drive", ov: {} },
    { name: "Loaded March (Anti-Rotation)", ov: { movement: "hip_flexion" } },
    { name: "Pallof Press with Marching", ov: { movement: "core_rotation" } },
    {
      name: "Half-Kneeling Anti-Rotation Chop",
      ov: { movement: "core_rotation" },
    },
    { name: "Reflexive Plank (Partner Perturbation)", ov: {} },
    {
      name: "Suitcase March (Anti-Lateral-Flexion)",
      ov: { movement: "carry" },
    },
    { name: "Hanging Alternating Knee Drive", ov: { movement: "hip_flexion" } },
    {
      name: "Copenhagen Plank with Top-Leg Drive",
      ov: {
        movement: "hip_adduction",
        muscleGroups: ["adductors", "core"],
        targetMuscles: ["adductor longus"],
      },
    },
  ],
});

// ── Eccentric warm-ups — tendon prep, tissue readiness ─────────────────────
N.push({
  key: "eccentric_warmup",
  category: "warm_up",
  movement: "knee_flexion_eccentric",
  contractionType: "eccentric",
  jointEmphasis: "neutral",
  loadingRateBand: "low",
  evidenceTier: "META",
  movementPattern: "Eccentric Warm-Up",
  muscleGroups: ["hamstrings", "quadriceps", "calves"],
  targetMuscles: ["hamstrings", "quadriceps", "gastrocnemius"],
  positions: [],
  defaults: { sets: 2, reps: 6, rest: 45, loadAu: 8, difficulty: "beginner" },
  how: "Prime the tissues eccentrically before speed/plyo — tendons and the hamstring/calf prepare for the high-velocity lengthening of sprinting. Low-volume, controlled; part of the warm-up, not a training stimulus.",
  cues: [
    "Slow, controlled lengthening",
    "Low volume — this is prep",
    "Feel it, don't fatigue it",
  ],
  variants: [
    { name: "Nordic Warm-Up Set (Low Volume)", ov: {} },
    {
      name: "Eccentric Heel-Drop Prep",
      ov: {
        movement: "plantarflexion_straight",
        targetMuscles: ["gastrocnemius"],
      },
    },
    { name: "Slider Leg-Curl Eccentric Prep", ov: {} },
    {
      name: "Tempo Split-Squat Eccentric Prep",
      ov: { movement: "squat", targetMuscles: ["quadriceps"] },
    },
    { name: "Eccentric Single-Leg RDL Prep", ov: { movement: "hip_hinge" } },
    {
      name: "Slow Eccentric Step-Down Prep",
      ov: { movement: "knee_extension", targetMuscles: ["quadriceps"] },
    },
  ],
});

// ── Intermuscular coordination — contrast/complex + alternating rhythm ─────
N.push({
  key: "intermuscular",
  category: "power",
  movement: "hip_extension",
  contractionType: "plyometric",
  jointEmphasis: "neutral",
  loadingRateBand: "high",
  evidenceTier: "META",
  movementPattern: "Intermuscular Coordination / Contrast",
  muscleGroups: ["glutes", "quadriceps", "hamstrings", "calves"],
  targetMuscles: ["gluteus maximus", "quadriceps", "hamstrings"],
  positions: [],
  defaults: { sets: 4, reps: 3, rest: 150, loadAu: 20, difficulty: "advanced" },
  how: "Sequence heavy → ballistic → reactive → sport-speed (French contrast) to raise RFD and teach the muscles to fire in the right order at the right time (PAP/PAPE; Seitz & Haff 2016). Alternating-limb rhythm work coordinates posture, rhythm and timing.",
  cues: [
    "Explosive intent on every rep",
    "Full recovery between the heavy and ballistic pairs",
    "Rhythm and timing over raw effort",
  ],
  variants: [
    { name: "French Contrast Complex (Heavy→Jump→Band→Sprint)", ov: {} },
    {
      name: "Heavy Squat + Jump Contrast (PAPE)",
      ov: { movement: "jump_land" },
    },
    {
      name: "Trap-Bar Pull + Broad Jump Contrast",
      ov: { movement: "jump_land" },
    },
    {
      name: "Alternating-Leg Scissor Bound (Rhythm)",
      ov: { movement: "plantarflexion_ballistic" },
    },
    { name: "Cycled Split-Jump Rhythm Series", ov: { movement: "jump_land" } },
    { name: "March-Skip-Run Coordination Ladder", ov: { movement: "sprint" } },
    {
      name: "Contrast: Iso Drive + Reactive Bound",
      ov: { movement: "plantarflexion_ballistic" },
    },
  ],
});

// ── Limb velocity / twitch — assisted overspeed, light-implement ballistics ─
N.push({
  key: "limb_velocity",
  category: "power",
  movement: "jump_land",
  contractionType: "plyometric",
  jointEmphasis: "neutral",
  loadingRateBand: "very_high",
  evidenceTier: "COHORT",
  movementPattern: "Limb Velocity / Twitch",
  muscleGroups: ["glutes", "quadriceps", "calves"],
  targetMuscles: ["gluteus maximus", "quadriceps", "gastrocnemius"],
  positions: [],
  defaults: { sets: 4, reps: 3, rest: 150, loadAu: 18, difficulty: "advanced" },
  how: "Bias the high-velocity end of the force-velocity curve — move fast against light or assisting resistance so the nervous system rehearses maximal contraction SPEED. Overspeed and light-implement ballistics recruit and rate-code the fast-twitch pool.",
  cues: [
    "Fastest possible movement",
    "Light/assisting load only",
    "Quality reps, long rest — never grind these",
  ],
  variants: [
    { name: "Band-Assisted Vertical Jump (Overspeed)", ov: {} },
    { name: "Band-Assisted Broad Jump", ov: {} },
    { name: "Band-Assisted Sprint (Towing)", ov: { movement: "sprint" } },
    {
      name: "Light Med-Ball Ballistic Throw (Max Velocity)",
      ov: {
        movement: "core_rotation",
        muscleGroups: ["core"],
        targetMuscles: ["obliques"],
      },
    },
    {
      name: "Fast-Hands Wall Drill (Arm Velocity)",
      ov: {
        movement: "neutral",
        muscleGroups: ["shoulders"],
        targetMuscles: ["deltoid"],
      },
    },
    { name: "Fast-Feet Turnover (Max Cadence)", ov: { movement: "sprint" } },
    { name: "Catapult Jump (Overspeed Band)", ov: {} },
  ],
});

// ── Reflexive joint stability / perturbation (turf robustness) ──────────────
// HONEST TIERING: injury-prevention/proprioception = RCT (FIFA 11+). Unstable-
// surface for FORCE/POWER = CONTESTED (Behm & Colado 2012: unstable surfaces
// REDUCE output). Scoped here to ankle/knee robustness, NOT power development.
N.push({
  key: "reflexive_stability",
  category: "rehab",
  movement: "ankle_balance",
  contractionType: "isometric",
  jointEmphasis: "neutral",
  loadingRateBand: "moderate",
  evidenceTier: "RCT",
  rehabStage: 2,
  movementPattern: "Reflexive Joint Stability",
  muscleGroups: ["ankle stabilizers", "peroneals", "glutes"],
  targetMuscles: ["peroneus longus", "gluteus medius"],
  positions: [],
  defaults: {
    sets: 3,
    reps: 6,
    rest: 60,
    loadAu: 10,
    difficulty: "intermediate",
  },
  how: "Reflexive (reactive) stability for cutting and landing on turf/uneven ground — perturbation + reactive stabilisation builds joint-position sense and fast protective co-contraction (FIFA 11+ balance, post-ACL perturbation training). NOTE: unstable-surface work is for JOINT ROBUSTNESS, not force output — it blunts power (Behm & Colado 2012); keep power work on firm ground.",
  cues: [
    "React and re-stabilise fast",
    "Quiet foot, controlled knee",
    "Progress firm → single-tilt → reactive perturbation",
  ],
  variants: [
    {
      name: "Single-Leg Reactive Stabilisation (Ball Toss)",
      ov: { evidenceTier: "RCT" },
    },
    {
      name: "Landing Perturbation (Partner Nudge)",
      ov: { movement: "jump_land", evidenceTier: "RCT" },
    },
    { name: "Single-Leg Balance with Band Perturbation", ov: {} },
    {
      name: "Reactive Hop-to-Stabilise (Multi-Direction)",
      ov: {
        movement: "cutting",
        loadingRateBand: "high",
        evidenceTier: "COHORT",
      },
    },
    {
      name: "Bosu Single-Leg Reactive Reach",
      ov: { evidenceTier: "CONTESTED" },
    },
    {
      name: "Foam-Pad Landing Control (Proprioception)",
      ov: { movement: "jump_land", evidenceTier: "CONTESTED" },
    },
    {
      name: "Reactive Cut-and-Stabilise on Varied Surface",
      ov: {
        movement: "cutting",
        loadingRateBand: "very_high",
        evidenceTier: "COHORT",
      },
    },
  ],
});

export const FAMILIES_NEURO = N;

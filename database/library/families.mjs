// Tissue Load Engine — curated movement families.
//
// A "family" is a base movement with a tissue/rate/contraction profile plus a
// list of LEGITIMATE, coachable variants (equipment, stance, tempo, ROM, load).
// The builder expands families → distinct exercise rows. This is how a library
// scales to 1000+ without combinatorial spam: every variant is a real exercise a
// coach would actually distinguish, and it inherits the correct safety metadata.
//
// Evidence tiers per §11 of the engine spec. Numeric caps/bands are HEURISTIC
// syntheses unless a stronger tier is named on the family.

/**
 * @typedef {Object} Variant
 * @property {string} name  Full exercise name.
 * @property {Object} [ov]  Field overrides (contractionType, jointEmphasis,
 *   loadingRateBand, peakLoadBw, rehabStage, equipment, defaults, positions…).
 */

/**
 * @typedef {Object} Family
 * @property {string} key
 * @property {string} category           daily-protocol category (lowercase for the RTP/normal queries)
 * @property {string} movement           key into MOVEMENT_TO_TISSUES (derives tissue_targets)
 * @property {string} contractionType
 * @property {string} jointEmphasis
 * @property {string} loadingRateBand
 * @property {number} [peakLoadBw]
 * @property {string} evidenceTier
 * @property {number} [rehabStage]
 * @property {string} movementPattern
 * @property {string[]} muscleGroups
 * @property {string[]} targetMuscles
 * @property {string[]} positions        applicable_positions ([] = all)
 * @property {Object} defaults           {sets,reps,hold,duration,rest,loadAu,difficulty}
 * @property {string} how
 * @property {string[]} cues
 * @property {Variant[]} variants
 */

const ALL = [];

// ── CALF / ACHILLES COMPLEX — the content the live DB is missing entirely ────
// Seated = knee-bent = soleus (non-negotiable for accel athletes). Standing =
// knee-straight = gastroc. HSR = eccentric for outcomes (Beyer 2015 RCT).
ALL.push({
  key: "calf_raise",
  category: "rehab",
  movement: "plantarflexion_bent",
  contractionType: "isotonic",
  jointEmphasis: "knee_bent",
  loadingRateBand: "low",
  peakLoadBw: 2.5,
  evidenceTier: "RCT",
  rehabStage: 2,
  movementPattern: "Plantarflexion",
  muscleGroups: ["calves"],
  targetMuscles: ["soleus", "gastrocnemius"],
  positions: [],
  defaults: { sets: 3, reps: 12, rest: 90, loadAu: 14, difficulty: "beginner" },
  how: "Drive through the ball of the foot to full plantarflexion, control the descent. Heavy-slow: ~3s up, ~3s down.",
  cues: ["Full range — all the way up, all the way down", "Slow, controlled tempo", "Keep pressure through the big toe"],
  variants: [
    { name: "Seated Calf Raise (Soleus, Heavy-Slow)", ov: { jointEmphasis: "knee_bent", targetMuscles: ["soleus"], evidenceTier: "RCT" } },
    { name: "Standing Calf Raise (Gastrocnemius)", ov: { jointEmphasis: "knee_straight", movement: "plantarflexion_straight", targetMuscles: ["gastrocnemius"] } },
    { name: "Single-Leg Seated Calf Raise", ov: { jointEmphasis: "knee_bent", defaults: { sets: 3, reps: 10, rest: 90, loadAu: 12 } } },
    { name: "Single-Leg Standing Calf Raise", ov: { jointEmphasis: "knee_straight", movement: "plantarflexion_straight" } },
    { name: "Leg-Press Calf Raise (Heavy-Slow)", ov: { jointEmphasis: "knee_straight", movement: "plantarflexion_straight", loadingRateBand: "low", peakLoadBw: 3, defaults: { sets: 4, reps: 8, rest: 120, loadAu: 18 } } },
    { name: "Smith Machine Standing Calf Raise", ov: { jointEmphasis: "knee_straight", movement: "plantarflexion_straight" } },
    { name: "Weighted Seated Calf Raise (Dumbbell)", ov: { jointEmphasis: "knee_bent" } },
    { name: "Bent-Knee Wall Calf Raise (Soleus)", ov: { jointEmphasis: "knee_bent" } },
  ],
});

ALL.push({
  key: "heel_drop",
  category: "rehab",
  movement: "plantarflexion_straight",
  contractionType: "eccentric",
  jointEmphasis: "knee_straight",
  loadingRateBand: "low",
  peakLoadBw: 3,
  evidenceTier: "RCT",
  rehabStage: 2,
  movementPattern: "Eccentric Plantarflexion",
  muscleGroups: ["calves"],
  targetMuscles: ["gastrocnemius", "soleus"],
  positions: [],
  defaults: { sets: 3, reps: 15, rest: 60, loadAu: 12, difficulty: "beginner" },
  how: "Rise on both feet, shift to the working leg, lower the heel slowly BELOW the step over ~3s. Alfredson-style eccentric loading; pain up to 5/10 that settles overnight is acceptable.",
  cues: ["Lower slowly below the step", "Rise with both, lower with one", "Pain ≤5/10 that settles by morning is OK"],
  variants: [
    { name: "Eccentric Heel Drop (Bilateral, Off Step)", ov: { jointEmphasis: "knee_straight" } },
    { name: "Eccentric Heel Drop (Single-Leg, Off Step)", ov: { jointEmphasis: "knee_straight", defaults: { sets: 3, reps: 15, rest: 60, loadAu: 14 } } },
    { name: "Bent-Knee Eccentric Heel Drop (Soleus)", ov: { jointEmphasis: "knee_bent", movement: "plantarflexion_bent", targetMuscles: ["soleus"] } },
    { name: "Weighted Eccentric Heel Drop (Backpack)", ov: { jointEmphasis: "knee_straight", defaults: { sets: 3, reps: 12, rest: 90, loadAu: 16 } } },
  ],
});

ALL.push({
  key: "calf_iso",
  category: "isometrics",
  movement: "plantarflexion_bent",
  contractionType: "isometric",
  jointEmphasis: "knee_bent",
  loadingRateBand: "none",
  peakLoadBw: 2,
  evidenceTier: "CONTESTED",
  rehabStage: 1,
  movementPattern: "Isometric Plantarflexion",
  muscleGroups: ["calves"],
  targetMuscles: ["soleus", "gastrocnemius"],
  positions: [],
  defaults: { sets: 4, hold: 30, rest: 60, loadAu: 8, difficulty: "beginner" },
  how: "Hold a mid-range plantarflexed position under load. Some athletes get analgesia, some don't (Achilles replication failed) — we track your response, we don't promise relief.",
  cues: ["Hold steady, don't bounce", "Breathe through the hold", "Log whether it eased the pain — we track it per athlete"],
  variants: [
    { name: "Seated Isometric Calf Hold (Soleus)", ov: { jointEmphasis: "knee_bent", targetMuscles: ["soleus"] } },
    { name: "Standing Isometric Calf Hold (Gastroc)", ov: { jointEmphasis: "knee_straight", movement: "plantarflexion_straight" } },
    { name: "Single-Leg Isometric Calf Hold", ov: { jointEmphasis: "knee_bent" } },
    { name: "Wall Isometric Calf Hold", ov: { jointEmphasis: "knee_bent" } },
  ],
});

// ── HAMSTRING — Nordic (meta, tempered) + Askling L-protocol + iso + hinge ───
ALL.push({
  key: "nordic",
  category: "rehab",
  movement: "knee_flexion_eccentric",
  contractionType: "eccentric",
  jointEmphasis: "neutral",
  loadingRateBand: "moderate",
  peakLoadBw: 3,
  evidenceTier: "META",
  rehabStage: 3,
  movementPattern: "Knee Flexion (Eccentric)",
  muscleGroups: ["hamstrings", "glutes"],
  targetMuscles: ["biceps femoris", "semitendinosus", "semimembranosus"],
  positions: [],
  defaults: { sets: 3, reps: 6, rest: 120, loadAu: 20, difficulty: "advanced" },
  how: "Kneel with ankles anchored, lower the torso forward as slowly as possible resisting with the hamstrings, catch with the hands. Prevention RR ~0.49 (Van Dyk meta) — but Impellizzeri's reappraisal calls it 'inconclusive'; program it, don't oversell it.",
  cues: ["Resist the fall — go as slow as you can", "Hips extended, don't pike", "Catch soft, push back to the top"],
  variants: [
    { name: "Nordic Hamstring Curl", ov: {} },
    { name: "Band-Assisted Nordic Curl", ov: { rehabStage: 2, defaults: { sets: 3, reps: 8, rest: 120, loadAu: 16, difficulty: "intermediate" } } },
    { name: "Eccentric-Only Nordic (Push-Up Return)", ov: {} },
    { name: "Razor Curl (Slider)", ov: { rehabStage: 3 } },
  ],
});

ALL.push({
  key: "askling",
  category: "rehab",
  movement: "hip_hinge",
  contractionType: "eccentric",
  jointEmphasis: "neutral",
  loadingRateBand: "low",
  peakLoadBw: 1.5,
  evidenceTier: "RCT",
  rehabStage: 2,
  movementPattern: "Lengthening Hamstring",
  muscleGroups: ["hamstrings"],
  targetMuscles: ["biceps femoris", "semimembranosus"],
  positions: [],
  defaults: { sets: 3, reps: 6, rest: 60, loadAu: 10, difficulty: "intermediate" },
  how: "Lengthening-biased hamstring rehab (Askling L-protocol). Faster RTP in RCTs, but LOW eccentric intensity — a bridge to Nordics, not a destination. The engine must progress you off it.",
  cues: ["Move into length under control", "Stop short of provocative end-range early on", "Progress to Nordics once tolerated"],
  variants: [
    { name: "Askling Extender (Supine)", ov: {} },
    { name: "Askling Diver (Single-Leg RDL Reach)", ov: {} },
    { name: "Askling Glider (Slide-Back)", ov: { rehabStage: 3 } },
  ],
});

ALL.push({
  key: "ham_iso",
  category: "isometrics",
  movement: "knee_flexion_eccentric",
  contractionType: "isometric",
  jointEmphasis: "neutral",
  loadingRateBand: "none",
  evidenceTier: "COHORT",
  rehabStage: 1,
  movementPattern: "Isometric Knee Flexion",
  muscleGroups: ["hamstrings"],
  targetMuscles: ["biceps femoris"],
  positions: [],
  defaults: { sets: 4, hold: 30, rest: 60, loadAu: 8, difficulty: "beginner" },
  how: "Long-lever isometric hold — a low-irritability same-day option that loads the tissue without high eccentric microtrauma.",
  cues: ["Hold long-lever, heel dug in", "Steady tension", "No sharp pain"],
  variants: [
    { name: "Long-Lever Bridge Hold", ov: {} },
    { name: "Single-Leg Long-Lever Bridge Hold", ov: {} },
    { name: "Nordic Mid-Range Isometric Hold", ov: { rehabStage: 2 } },
  ],
});

// ── PATELLAR TENDON / KNEE EXTENSOR — the rate ladder (hold force, add rate) ──
ALL.push({
  key: "knee_ext_ladder",
  category: "rehab",
  movement: "knee_extension",
  contractionType: "isotonic",
  jointEmphasis: "neutral",
  loadingRateBand: "low",
  peakLoadBw: 5,
  evidenceTier: "RCT",
  rehabStage: 2,
  movementPattern: "Knee Extension",
  muscleGroups: ["quadriceps"],
  targetMuscles: ["quadriceps", "patellar tendon"],
  positions: [],
  defaults: { sets: 4, reps: 8, rest: 120, loadAu: 18, difficulty: "intermediate" },
  how: "Patellar tendon rehab progresses by LOADING RATE, not peak force. This ladder holds high tendon force while rate climbs: isometric → heavy-slow → decline squat → low jump-land.",
  cues: ["Slow tempo on the loading rungs", "Knee tracks over the toes", "Progress rate only when 24h response is clean"],
  variants: [
    { name: "Spanish Squat Isometric Hold", ov: { contractionType: "isometric", loadingRateBand: "none", rehabStage: 1, defaults: { sets: 5, hold: 45, rest: 90, loadAu: 10 } } },
    { name: "Wall-Sit Isometric (Knee 60°)", ov: { contractionType: "isometric", loadingRateBand: "none", rehabStage: 1, defaults: { sets: 5, hold: 45, rest: 90, loadAu: 10 } } },
    { name: "Heavy-Slow Leg Press", ov: { loadingRateBand: "low", rehabStage: 2 } },
    { name: "Heavy-Slow Leg Extension", ov: { loadingRateBand: "low", rehabStage: 2 } },
    { name: "Decline Single-Leg Squat (Slow)", ov: { loadingRateBand: "moderate", rehabStage: 3, defaults: { sets: 4, reps: 8, rest: 120, loadAu: 16 } } },
    { name: "Low Box Step-Down (Controlled)", ov: { loadingRateBand: "moderate", rehabStage: 3 } },
  ],
});

// ── ADDUCTOR / GROIN — Copenhagen levels (cluster-RCT OR 0.59) ───────────────
ALL.push({
  key: "copenhagen",
  category: "rehab",
  movement: "hip_adduction",
  contractionType: "isotonic",
  jointEmphasis: "neutral",
  loadingRateBand: "low",
  evidenceTier: "RCT",
  rehabStage: 2,
  movementPattern: "Hip Adduction",
  muscleGroups: ["adductors", "core"],
  targetMuscles: ["adductor longus", "adductor magnus"],
  positions: [],
  defaults: { sets: 3, reps: 8, rest: 90, loadAu: 14, difficulty: "intermediate" },
  how: "Side plank with the top leg on a bench, lift the bottom leg to meet it. Three progression levels. Cluster-RCT: 41% lower odds of groin problems. Squeeze strength drops before pain — pair with the weekly squeeze test.",
  cues: ["Straight line hip to shoulder", "Drive the bottom knee up to the bench", "Slow lower"],
  variants: [
    { name: "Copenhagen Adduction — Level 1 (Short Lever, Bent Knee)", ov: { rehabStage: 1, defaults: { sets: 3, reps: 6, rest: 90, loadAu: 10, difficulty: "beginner" } } },
    { name: "Copenhagen Adduction — Level 2 (Mid Lever)", ov: { rehabStage: 2 } },
    { name: "Copenhagen Adduction — Level 3 (Full Long Lever)", ov: { rehabStage: 3, defaults: { sets: 3, reps: 10, rest: 90, loadAu: 18, difficulty: "advanced" } } },
    { name: "Copenhagen Plank Isometric Hold", ov: { contractionType: "isometric", loadingRateBand: "none", category: "isometrics", defaults: { sets: 4, hold: 20, rest: 60, loadAu: 10 } } },
    { name: "Adductor Squeeze Isometric (45° Hip)", ov: { contractionType: "isometric", loadingRateBand: "none", category: "isometrics", rehabStage: 1, defaults: { sets: 4, hold: 30, rest: 45, loadAu: 6 } } },
  ],
});

// ── ANKLE — balance / proprioception (FIFA 11+ RR 0.67; permanent post-event) ─
ALL.push({
  key: "ankle_balance",
  category: "rehab",
  movement: "ankle_balance",
  contractionType: "isometric",
  jointEmphasis: "neutral",
  loadingRateBand: "low",
  evidenceTier: "META",
  rehabStage: 1,
  movementPattern: "Balance / Proprioception",
  muscleGroups: ["ankle stabilizers", "peroneals"],
  targetMuscles: ["peroneus longus", "peroneus brevis", "tibialis posterior"],
  positions: [],
  defaults: { sets: 3, hold: 30, rest: 45, loadAu: 8, difficulty: "beginner" },
  how: "Single-leg balance progressions build peroneal reaction time — the protective variable after an ankle sprain (70% recurrence). Attach this permanently to any athlete with an ankle history.",
  cues: ["Soft knee, quiet foot", "Progress: eyes open → eyes closed → unstable surface", "Add perturbations once stable"],
  variants: [
    { name: "Single-Leg Balance (Eyes Open)", ov: { rehabStage: 1 } },
    { name: "Single-Leg Balance (Eyes Closed)", ov: { rehabStage: 2 } },
    { name: "Single-Leg Balance on Foam Pad", ov: { rehabStage: 2 } },
    { name: "Single-Leg Balance with Ball Toss", ov: { rehabStage: 3, loadingRateBand: "moderate" } },
    { name: "Star Excursion Balance Reach", ov: { rehabStage: 3, contractionType: "isotonic" } },
    { name: "Bosu Single-Leg Hold", ov: { rehabStage: 3 } },
  ],
});

// ── SHIN / TIBIALIS — MTSS posterior-chain endurance ─────────────────────────
ALL.push({
  key: "tibialis",
  category: "rehab",
  movement: "impact_run",
  contractionType: "isotonic",
  jointEmphasis: "neutral",
  loadingRateBand: "low",
  evidenceTier: "CONSENSUS",
  rehabStage: 2,
  movementPattern: "Dorsiflexion / Endurance",
  muscleGroups: ["shin", "calves"],
  targetMuscles: ["tibialis anterior", "tibialis posterior", "flexor hallucis longus"],
  positions: [],
  defaults: { sets: 3, reps: 20, rest: 60, loadAu: 10, difficulty: "beginner" },
  how: "Posterior-chain + tibialis endurance for MTSS (the mild end of the bone-stress continuum). NOTE: focal/point tibial tenderness is a HARD STOP — this is for diffuse MTSS only, never a stress fracture.",
  cues: ["High reps, endurance focus", "Diffuse ache only — focal point pain = stop, see a clinician", "Reduce impact volume alongside this"],
  variants: [
    { name: "Tibialis Raise (Wall-Supported)", ov: { targetMuscles: ["tibialis anterior"] } },
    { name: "Weighted Tibialis Raise", ov: { targetMuscles: ["tibialis anterior"], defaults: { sets: 3, reps: 15, rest: 60, loadAu: 12 } } },
    { name: "Seated Tib-Posterior Raise (Band)", ov: { targetMuscles: ["tibialis posterior"] } },
    { name: "Toe-Walk Endurance March", ov: { movement: "plantarflexion_bent" } },
    { name: "Heel-Walk Endurance March", ov: {} },
  ],
});

export const FAMILIES = ALL;

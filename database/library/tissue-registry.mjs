// Tissue Load Engine — canonical tissue registry (the anatomical graph).
//
// Each node is a TISSUE, not a body-part string. tissueType selects which
// ruleset the decision engine applies (tendon vs muscle vs ligament vs bone
// follow genuinely different rules — bone is the exception to everything).
// `couples` encodes cross-region load transfer surfaced in the rationale.
//
// This is the substrate the safety filter keys on: an exercise's
// `tissue_targets[]` are matched against these ids, so "Calf Raise" is unsafe
// for an `achilles` flag because it targets the plantarflexors — never a
// name-keyword coincidence.

/** @typedef {'tendon'|'muscle'|'ligament'|'bone'|'joint_capsule'|'fascia'} TissueType */

export const TISSUES = {
  // ── calf / Achilles complex (soleus-dominant for accel athletes) ──────────
  achilles: {
    tissueType: "tendon",
    label: "Achilles tendon",
    region: "lower_limb",
    peakLoadBW: 8,
    minRecoveryHoursHeavy: 48,
    couples: [
      {
        to: "hamstring",
        mechanism: "calf restriction → late-stance HS comp",
        strength: "moderate",
      },
      {
        to: "plantar_fascia",
        mechanism: "shared posterior chain",
        strength: "moderate",
      },
    ],
    clearanceTests: ["single_leg_calf_raise_x25", "seated_calf_iso_gt_2xBW"],
  },
  soleus: {
    tissueType: "muscle",
    label: "Soleus",
    region: "lower_limb",
    note: "Knee-FLEXED plantarflexor; ~8x BW propulsion; longer rehab window than gastroc (25 vs 8 days).",
    couples: [
      { to: "achilles", mechanism: "forms the Achilles", strength: "strong" },
    ],
  },
  gastrocnemius: {
    tissueType: "muscle",
    label: "Gastrocnemius",
    region: "lower_limb",
    note: "Knee-STRAIGHT biased; explosive contributor.",
    couples: [
      { to: "achilles", mechanism: "forms the Achilles", strength: "strong" },
    ],
  },

  // ── hamstring ─────────────────────────────────────────────────────────────
  hamstring: {
    tissueType: "muscle",
    label: "Hamstring (biceps femoris long head)",
    region: "lower_limb",
    note: "Terminal-swing eccentric; BFlh activation climbs sharply >80% max sprint speed. Do NOT remove sprint for stiffness — reduce volume, keep exposure.",
    couples: [
      {
        to: "achilles",
        mechanism: "posterior chain compensation",
        strength: "moderate",
      },
    ],
  },

  plantaris: {
    tissueType: "muscle",
    label: "Plantaris",
    region: "lower_limb",
    note: "Small plantarflexor/knee-flexor; 'tennis leg' when it or the medial gastroc tears. Shares the calf complex.",
    couples: [
      {
        to: "achilles",
        mechanism: "posterior calf complex",
        strength: "moderate",
      },
    ],
  },
  peroneus: {
    tissueType: "muscle",
    label: "Peroneals (fibularis longus/brevis)",
    region: "lower_limb",
    note: "Evert + stabilise the ankle; peroneal reaction time is THE protective variable against lateral ankle sprain recurrence.",
    couples: [
      {
        to: "ankle",
        mechanism: "dynamic lateral ankle stabiliser",
        strength: "strong",
      },
    ],
  },
  tibialis_anterior: {
    tissueType: "muscle",
    label: "Tibialis anterior",
    region: "lower_limb",
    note: "Dorsiflexion + foot control; weakness feeds MTSS. Shares the shin/bone-stress chain.",
    couples: [
      { to: "tibia", mechanism: "shin/MTSS chain", strength: "moderate" },
    ],
  },

  // ── hip flexor / glute / ITB ───────────────────────────────────────────────
  hip_flexor: {
    tissueType: "muscle",
    label: "Hip flexor (iliopsoas / rectus femoris)",
    region: "lower_limb",
    note: "Loaded in sprint drive + kicking; rectus femoris crosses hip AND knee (two-joint injury risk).",
    couples: [
      {
        to: "lumbar",
        mechanism: "iliopsoas attaches to lumbar spine",
        strength: "moderate",
      },
    ],
  },
  glute: {
    tissueType: "muscle",
    label: "Gluteals (max/med/min)",
    region: "lower_limb",
    note: "Prime hip extensor + pelvic stabiliser; glute-med weakness → knee valgus + ITB/patellofemoral load.",
    couples: [
      {
        to: "it_band",
        mechanism: "glute-med weakness loads the ITB",
        strength: "moderate",
      },
      {
        to: "patellar_tendon",
        mechanism: "hip control governs knee valgus",
        strength: "moderate",
      },
    ],
  },
  it_band: {
    tissueType: "fascia",
    label: "Iliotibial band",
    region: "lower_limb",
    note: "Lateral knee/hip fascia; ITB syndrome is a compression/overuse issue driven by hip control + running volume — a load-management problem.",
    couples: [
      {
        to: "glute",
        mechanism: "TFL/glute-med tension governs ITB load",
        strength: "strong",
      },
    ],
  },

  // ── knee extensor / patellar tendon ───────────────────────────────────────
  patellar_tendon: {
    tissueType: "tendon",
    label: "Patellar tendon",
    region: "lower_limb",
    peakLoadBW: 6.6,
    minRecoveryHoursHeavy: 48,
    note: "Across the rehab ladder LOADING RATE changes, peak force stays high (leg press ~2 BW/s vs jump-land ~93 BW/s). Progress rate, hold force.",
    couples: [
      {
        to: "ankle",
        mechanism: "restricted dorsiflexion transfers load proximally",
        strength: "strong",
      },
    ],
  },
  quadriceps: {
    tissueType: "muscle",
    label: "Quadriceps",
    region: "lower_limb",
  },

  // ── adductor / groin ──────────────────────────────────────────────────────
  adductor: {
    tissueType: "muscle",
    label: "Adductor / groin",
    region: "lower_limb",
    note: "Squeeze strength DROPS before pain (leading indicator, DeLang 2022). Copenhagen: OR 0.59 groin problems.",
    couples: [
      {
        to: "acl",
        mechanism: "adductor weakness → altered COD → knee valgus",
        strength: "moderate",
      },
    ],
  },

  // ── ankle / lateral ligament ──────────────────────────────────────────────
  ankle: {
    tissueType: "ligament",
    label: "Ankle (ATFL / lateral complex)",
    region: "lower_limb",
    note: "Recurrence up to 70%. Peroneal reaction time + strength protect, not rest. Permanent balance block after any event.",
  },

  // ── knee / ACL ────────────────────────────────────────────────────────────
  acl: {
    tissueType: "ligament",
    label: "Knee (ACL)",
    region: "lower_limb",
    note: "Decel + COD are the non-contact mechanisms. Build capacity → permit the sharp cut. Reactive/unanticipated COD restored LAST.",
  },

  // ── shin / tibia (bone stress continuum) ──────────────────────────────────
  tibia: {
    tissueType: "bone",
    label: "Tibia (MTSS → stress-fracture continuum)",
    region: "lower_limb",
    note: "Bone does NOT follow the tendon rules. Focal/point tenderness = HARD STOP, clinician. Diffuse = MTSS: cut impact volume, load soleus/tib-post/FHL/peroneals.",
  },
  plantar_fascia: {
    tissueType: "fascia",
    label: "Plantar fascia",
    region: "lower_limb",
  },

  // ── trunk ─────────────────────────────────────────────────────────────────
  lumbar: {
    tissueType: "joint_capsule",
    label: "Lumbar spine",
    region: "trunk",
  },
  core: { tissueType: "muscle", label: "Core / trunk", region: "trunk" },

  // ── upper / thrower ───────────────────────────────────────────────────────
  rotator_cuff: {
    tissueType: "tendon",
    label: "Rotator cuff",
    region: "upper_limb",
    note: "Throw DECELERATION damages the posterior cuff/labrum. GIRD is a risk factor — track IR ROM. Throw count is a load metric.",
  },
  ucl: {
    tissueType: "ligament",
    label: "Elbow UCL",
    region: "upper_limb",
    note: "Flexor-pronator mass is a dynamic UCL protector.",
  },
  finger: {
    tissueType: "ligament",
    label: "Finger collateral ligaments",
    region: "upper_limb",
    note: "#1 injured body part in adult flag football. Firm endpoint + <20° opening → buddy tape; no firm endpoint / >20° / cannot actively extend DIP → clinician.",
  },
};

/**
 * Which tissue nodes an exercise that loads `movementTags` touches. The calf
 * complex is one functional unit: anything that loads the plantarflexors loads
 * the Achilles. Used by the seed authoring to derive tissue_targets, and mirrors
 * how the safety filter reasons.
 */
export const MOVEMENT_TO_TISSUES = {
  plantarflexion_bent: ["soleus", "achilles"],
  plantarflexion_straight: ["gastrocnemius", "achilles"],
  plantarflexion_ballistic: [
    "gastrocnemius",
    "soleus",
    "achilles",
    "plantaris",
  ],
  knee_flexion_eccentric: ["hamstring"],
  hip_hinge: ["hamstring", "glute", "lumbar"],
  hip_extension: ["glute", "hamstring"],
  hip_flexion: ["hip_flexor"],
  hip_abduction: ["glute", "it_band"],
  knee_extension: ["quadriceps", "patellar_tendon"],
  jump_land: ["patellar_tendon", "quadriceps", "achilles"],
  hip_adduction: ["adductor"],
  ankle_balance: ["ankle", "peroneus"],
  ankle_eversion: ["peroneus", "ankle"],
  ankle_dorsiflexion: ["tibialis_anterior", "tibia"],
  cutting: ["acl", "ankle", "adductor", "glute"],
  impact_run: ["tibia", "achilles", "soleus", "it_band"],
  anti_extension: ["core"],
  core_rotation: ["core", "lumbar"],
  squat: ["quadriceps", "patellar_tendon", "glute"],
  sprint: ["hamstring", "achilles", "soleus", "glute"],
  carry: ["core", "lumbar"],
  horizontal_push: ["rotator_cuff"],
  vertical_push: ["rotator_cuff"],
  horizontal_pull: ["rotator_cuff"],
  vertical_pull: ["rotator_cuff"],
  throw: ["rotator_cuff", "ucl"],
  arm_care: ["rotator_cuff", "ucl"],
  grip: ["finger"],
  // Neutral movements that don't load a tracked injury tissue (general mobility,
  // conditioning, footwork) map to nothing — always safe, keyword fail-safe only.
  neutral: [],
};

/** All tissue ids that share a functional complex with `tissueId` (both ways). */
export function complexOf(tissueId) {
  const direct = new Set([tissueId]);
  for (const [id, node] of Object.entries(TISSUES)) {
    if (id === tissueId) {
      (node.couples ?? [])
        .filter((c) => c.strength === "strong")
        .forEach((c) => direct.add(c.to));
    }
    (node.couples ?? []).forEach((c) => {
      if (c.to === tissueId && c.strength === "strong") direct.add(id);
    });
  }
  return [...direct];
}

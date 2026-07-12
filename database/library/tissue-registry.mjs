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
      { to: "hamstring", mechanism: "calf restriction → late-stance HS comp", strength: "moderate" },
      { to: "plantar_fascia", mechanism: "shared posterior chain", strength: "moderate" },
    ],
    clearanceTests: ["single_leg_calf_raise_x25", "seated_calf_iso_gt_2xBW"],
  },
  soleus: {
    tissueType: "muscle",
    label: "Soleus",
    region: "lower_limb",
    note: "Knee-FLEXED plantarflexor; ~8x BW propulsion; longer rehab window than gastroc (25 vs 8 days).",
    couples: [{ to: "achilles", mechanism: "forms the Achilles", strength: "strong" }],
  },
  gastrocnemius: {
    tissueType: "muscle",
    label: "Gastrocnemius",
    region: "lower_limb",
    note: "Knee-STRAIGHT biased; explosive contributor.",
    couples: [{ to: "achilles", mechanism: "forms the Achilles", strength: "strong" }],
  },

  // ── hamstring ─────────────────────────────────────────────────────────────
  hamstring: {
    tissueType: "muscle",
    label: "Hamstring (biceps femoris long head)",
    region: "lower_limb",
    note: "Terminal-swing eccentric; BFlh activation climbs sharply >80% max sprint speed. Do NOT remove sprint for stiffness — reduce volume, keep exposure.",
    couples: [{ to: "achilles", mechanism: "posterior chain compensation", strength: "moderate" }],
  },

  // ── knee extensor / patellar tendon ───────────────────────────────────────
  patellar_tendon: {
    tissueType: "tendon",
    label: "Patellar tendon",
    region: "lower_limb",
    peakLoadBW: 6.6,
    minRecoveryHoursHeavy: 48,
    note: "Across the rehab ladder LOADING RATE changes, peak force stays high (leg press ~2 BW/s vs jump-land ~93 BW/s). Progress rate, hold force.",
    couples: [{ to: "ankle", mechanism: "restricted dorsiflexion transfers load proximally", strength: "strong" }],
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
    couples: [{ to: "acl", mechanism: "adductor weakness → altered COD → knee valgus", strength: "moderate" }],
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
  lumbar: { tissueType: "joint_capsule", label: "Lumbar spine", region: "trunk" },
  core: { tissueType: "muscle", label: "Core / trunk", region: "trunk" },

  // ── upper / thrower ───────────────────────────────────────────────────────
  rotator_cuff: {
    tissueType: "tendon",
    label: "Rotator cuff",
    region: "upper_limb",
    note: "Throw DECELERATION damages the posterior cuff/labrum. GIRD is a risk factor — track IR ROM. Throw count is a load metric.",
  },
  ucl: { tissueType: "ligament", label: "Elbow UCL", region: "upper_limb", note: "Flexor-pronator mass is a dynamic UCL protector." },
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
  plantarflexion_ballistic: ["gastrocnemius", "soleus", "achilles"],
  knee_flexion_eccentric: ["hamstring"],
  hip_hinge: ["hamstring", "lumbar"],
  knee_extension: ["quadriceps", "patellar_tendon"],
  jump_land: ["patellar_tendon", "quadriceps", "achilles"],
  hip_adduction: ["adductor"],
  ankle_balance: ["ankle"],
  cutting: ["acl", "ankle", "adductor"],
  impact_run: ["tibia", "achilles", "soleus"],
  anti_extension: ["core"],
  throw: ["rotator_cuff", "ucl"],
  grip: ["finger"],
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

const WARMUP_TARGET_SECONDS = 25 * 60;
// NMT / ACL-prevention segment (2026-07-14, audit §1.3): FIFA-11+-class
// neuromuscular training roughly halves ACL injury in the meta-analytic
// literature, and the new flag-specific evidence shows exactly the non-contact
// cut/pivot pattern NMT targets (Grewal 2025, J Pediatr Orthop,
// doi:10.1097/BPO.0000000000003154 — 21/24 knee surgeries were ACL, 87%
// non-contact, only 2/24 injured athletes had done any prevention program).
// Appended to the warm-up on individual quality days (strength / sprint /
// mixed); the Nordic already present in those variants completes the set.
const NMT_TARGET_SECONDS = 10 * 60;
const NMT_PREVENTION_SEGMENT = [
  {
    name: "Lateral Hop-and-Stick",
    keywords: ["lateral hop", "skater", "hop and stick"],
    sets: 2,
    reps: 6,
    durationSeconds: 150,
    note: "NMT/ACL block: hop laterally, STICK the landing 2s — knee over toes, no valgus collapse. 6/side.",
  },
  {
    name: "Single-Leg Balance (Ball-Busy)",
    keywords: ["single-leg balance", "single leg stance", "balance"],
    sets: 2,
    reps: null,
    durationSeconds: 120,
    note: "NMT/ACL block: 30s/side on one leg while catching/tossing a ball — knee soft, hip level.",
  },
  {
    name: "Drop-Land Freeze (Landing Mechanics)",
    keywords: ["stop-land", "drop land", "landing"],
    sets: 3,
    reps: 5,
    durationSeconds: 150,
    note: "NMT/ACL block: small drop, land soft and FREEZE — hips back, knees track the toes, silent feet.",
  },
  {
    name: "Decel-to-Stop Runs",
    keywords: ["decel", "deceleration"],
    sets: 3,
    reps: 1,
    durationSeconds: 120,
    note: "NMT/ACL block: build to ~80% over 10m, decelerate to a full stop in 3 steps. Braking strength is cut protection.",
  },
  {
    name: "Copenhagen Side Plank (Short Lever)",
    keywords: ["copenhagen"],
    sets: 2,
    reps: null,
    durationSeconds: 60,
    note: "NMT/ACL block: 15s/side, bent-knee version. Groin/adductor strength for cutting.",
  },
];

function applyQuarterbackWarmupOverrides(plan) {
  const removeNames = new Set(["Ankle Rocker + Hip Circles", "5-10-5 Shuttle"]);
  const qbItems = [
    {
      name: "Band External Rotations",
      keywords: ["external rotation", "band external", "rotator cuff"],
      durationSeconds: 60,
      note: "Shoulder activation for throwing prep.",
    },
    {
      name: "Scap Push-ups",
      keywords: ["scap push", "scapular push", "scap push-up"],
      durationSeconds: 60,
      note: "Scapular control and shoulder stability.",
    },
    {
      name: "Wrist & Forearm Prep",
      keywords: ["wrist", "forearm", "grip"],
      durationSeconds: 90,
      note: "Wrist mobility and forearm activation.",
    },
  ];

  const filtered = plan.filter((item) => !removeNames.has(item.name));
  const insertIndex = Math.max(
    0,
    filtered.findIndex((item) => item.name === "Walking Lunge with Rotation") +
      1,
  );
  const updated = [...filtered];
  updated.splice(insertIndex, 0, ...qbItems);
  return updated;
}

function applyReceiverWarmupOverrides(plan) {
  const removeNames = new Set([
    "Ankle Rocker + Hip Circles",
    "Progressive Sprints 20m",
  ]);
  const wrItems = [
    {
      name: "Deceleration Drops",
      keywords: ["deceleration", "drop", "brake"],
      durationSeconds: 120,
      note: "Controlled stop mechanics to reduce injury risk.",
    },
    {
      name: "Lateral Shuffle + Stick",
      keywords: ["shuffle", "stick", "lateral"],
      durationSeconds: 60,
      note: "Plant-and-hold to prep for breaks and cuts.",
    },
  ];

  const filtered = plan.filter((item) => !removeNames.has(item.name));
  const insertIndex = Math.max(
    0,
    filtered.findIndex((item) => item.name === "B-Skips") + 1,
  );
  const updated = [...filtered];
  updated.splice(insertIndex, 0, ...wrItems);
  return updated;
}

function applyBlitzerWarmupOverrides(plan) {
  const removeNames = new Set([
    "Ankle Rocker + Hip Circles",
    "Progressive Sprints 20m",
  ]);
  const blitzerItems = [
    {
      name: "Pursuit Angle Sprints",
      keywords: ["pursuit", "angle sprint"],
      durationSeconds: 120,
      note: "Attack angles for blitz/pursuit mechanics.",
    },
    {
      name: "Shuffle-to-Sprint",
      keywords: ["shuffle", "sprint"],
      durationSeconds: 60,
      note: "Reactive change from lateral to forward sprint.",
    },
  ];

  const filtered = plan.filter((item) => !removeNames.has(item.name));
  const insertIndex = Math.max(
    0,
    filtered.findIndex((item) => item.name === "B-Skips") + 1,
  );
  const updated = [...filtered];
  updated.splice(insertIndex, 0, ...blitzerItems);
  return updated;
}

// Mandatory on every training day regardless of variant.
// 1 min straight plank + 30s single-arm each side + 30s Copenhagen each side = 3 min total.
const PLANK_ACTIVATION_BLOCK = [
  {
    name: "Straight Plank",
    // Precise keywords — avoids matching Single Arm Plank or Copenhagen Plank
    keywords: ["straight plank", "prone plank", "straight-plank"],
    holdSeconds: 60,
    durationSeconds: 60,
    note: "1 min front plank. Brace core, squeeze glutes, neutral spine.",
  },
  {
    name: "Single-Arm Plank (Left)",
    // "single arm plank" matches DB name "Single Arm Plank" without false positives
    keywords: ["single arm plank", "single-arm plank"],
    holdSeconds: 30,
    durationSeconds: 30,
    note: "30s left arm raised. Keep hips level — resist rotation.",
  },
  {
    name: "Single-Arm Plank (Right)",
    keywords: ["single arm plank", "single-arm plank"],
    holdSeconds: 30,
    durationSeconds: 30,
    note: "30s right arm raised. Keep hips level — resist rotation.",
  },
  {
    name: "Copenhagen Plank (Left)",
    keywords: ["copenhagen", "copenhagen plank", "adductor plank"],
    holdSeconds: 30,
    durationSeconds: 30,
    note: "30s left side. Top foot supported on bench/partner. Adductor activation + groin injury prevention.",
  },
  {
    name: "Copenhagen Plank (Right)",
    keywords: ["copenhagen", "copenhagen plank", "adductor plank"],
    holdSeconds: 30,
    durationSeconds: 30,
    note: "30s right side. Top foot supported on bench/partner. Adductor activation + groin injury prevention.",
  },
];

function buildWarmupTemplate({
  variant,
  isQB,
  isCenter,
  warmupFocus,
  includeNmt = false,
}) {
  const withNmt = (plan) =>
    includeNmt && variant !== "recovery"
      ? [...plan, ...NMT_PREVENTION_SEGMENT]
      : plan;
  // ── RECOVERY variant ─────────────────────────────────────────────────────
  // Low-intensity days: foam roll + mobility-led, still includes the mandatory
  // plank activation block. No sprint mechanics or potentiation work.
  // Total: 1500s (25 min)
  if (variant === "recovery") {
    return [
      {
        name: "Easy Walk / Light Movement",
        keywords: ["walk", "easy jog", "light jog"],
        durationSeconds: 180,
        note: "Raise: gentle walk or very light jog. Nasal breathing throughout.",
      },
      {
        name: "Foam Roll (Legs + Back)",
        keywords: ["foam roll", "foam roller", "self-myofascial"],
        durationSeconds: 180,
        note: "Quads, hamstrings, calves, glutes, thoracic. 30–45s per region. Not painful.",
      },
      {
        name: "Cat-Cow",
        keywords: ["cat cow", "cat-cow", "spinal wave"],
        sets: 2,
        reps: 10,
        durationSeconds: 60,
        note: "Slow spinal segmentation. Exhale on cat, inhale on cow.",
      },
      {
        name: "Glute Bridge",
        keywords: ["glute bridge"],
        sets: 2,
        reps: 10,
        durationSeconds: 60,
        note: "Activate glutes with full hip extension. Hold 2s at top.",
      },
      ...PLANK_ACTIVATION_BLOCK,
      // MOBILISE phase — DYNAMIC through-range mobility, not static holds. Static
      // stretching is retired as a default: it improves stretch TOLERANCE, not
      // muscle length (Weppler 2010), and offers no recovery/DOMS benefit (Afonso
      // 2021). A static hold is triage-only, for a genuine documented ROM
      // restriction on non-sore/non-injured tissue — see tightnessTriageStretch().
      {
        name: "90/90 Hip Switches",
        keywords: ["90/90", "hip switch", "hip rotation"],
        sets: 2,
        reps: 8,
        durationSeconds: 120,
        note: "Mobilise: rotate hips through internal/external range, 8 switches each side. Move, don't hold.",
      },
      {
        name: "Cossack Squats",
        keywords: ["cossack", "lateral squat", "adductor"],
        sets: 2,
        reps: 6,
        durationSeconds: 150,
        note: "Mobilise: shift side to side through full hip + adductor range. Control the bottom, don't bounce.",
      },
      {
        name: "Straight-Leg Kicks (Toy Soldiers)",
        keywords: [
          "toy soldier",
          "straight leg",
          "leg kick",
          "hamstring mobility",
        ],
        sets: 2,
        reps: 10,
        durationSeconds: 90,
        note: "Mobilise: dynamic hamstring range, kick to a controlled height. Soft knee, tall posture.",
      },
      {
        name: "Walking Hip-Flexor Lunges",
        keywords: ["walking lunge", "hip flexor", "lunge reach"],
        sets: 2,
        reps: 8,
        durationSeconds: 90,
        note: "Mobilise: step through into a lunge, reach tall to open the hip flexor, then move on. No static hold.",
      },
      {
        name: "Thoracic Rotations",
        keywords: ["thoracic", "t-spine", "rotation"],
        sets: 2,
        reps: 8,
        durationSeconds: 90,
        note: "Thread-the-needle or quadruped rotation. Upper back only.",
      },
      {
        name: "World's Greatest Stretch",
        keywords: ["world's greatest", "lunge reach", "thoracic lunge"],
        sets: 2,
        reps: 6,
        durationSeconds: 120,
        note: "Hip flexor + thoracic + hamstring in one movement.",
      },
      {
        name: "Slow Calf Raises",
        keywords: ["calf raise", "soleus"],
        sets: 2,
        reps: 12,
        durationSeconds: 60,
        note: "3s up, 3s down. Achilles tendon load tolerance.",
      },
      {
        name: "Lateral Band Walks",
        keywords: ["band walk", "lateral walk", "monster walk"],
        sets: 2,
        reps: 10,
        durationSeconds: 60,
        note: "Light band. Glute medius activation. Small controlled steps.",
      },
      {
        name: "Ankle Circles + Hip Circles",
        keywords: ["ankle circle", "hip circle"],
        durationSeconds: 60,
        note: "Full ROM at ankle and hip. Restore joint mobility.",
      },
    ];
  }

  // ── FITNESS / GYM variant ────────────────────────────────────────────────
  // Strength/power/gym days. Specific plank protocol replaces the old generic
  // "Plank Series". Total: 1500s (25 min).
  if (variant === "fitness") {
    return withNmt([
      {
        name: "Jump Rope",
        keywords: ["jump rope", "rope jump"],
        durationSeconds: 180,
        note: "Raise: steady rhythm, light on feet.",
      },
      {
        name: "Bike / Air Bike",
        keywords: ["bike", "air bike", "assault bike", "bicycle"],
        durationSeconds: 120,
        note: "Raise: easy pace, nasal breathing.",
      },
      {
        name: "Glute Bridge",
        keywords: ["glute bridge"],
        sets: 2,
        reps: 8,
        durationSeconds: 60,
        note: "Activate glutes before loading.",
      },
      {
        name: "Dead Bug",
        keywords: ["dead bug"],
        sets: 2,
        reps: 6,
        durationSeconds: 90,
        note: "Core activation with controlled breathing.",
      },
      ...PLANK_ACTIVATION_BLOCK,
      {
        name: "Nordic Hamstring Curl",
        keywords: ["nordic", "hamstring curl"],
        sets: 2,
        reps: 5,
        durationSeconds: 120,
        note: "Slow eccentric. Injury prevention emphasis.",
      },
      {
        name: "Toy Soldiers",
        keywords: ["toy soldier", "straight leg"],
        sets: 2,
        reps: 10,
        durationSeconds: 90,
        note: "Dynamic hamstring mobility.",
      },
      {
        name: "Lunge with Reach",
        keywords: ["lunge", "reach", "world's greatest"],
        sets: 2,
        reps: 8,
        durationSeconds: 120,
        note: "Hip mobility and thoracic rotation.",
      },
      {
        name: "Thoracic Rotations",
        keywords: ["thoracic", "rotation", "t-spine"],
        sets: 2,
        reps: 6,
        durationSeconds: 90,
        note: "Upper back mobility before lifting.",
      },
      {
        name: "Sled Push",
        keywords: ["sled", "sledge"],
        sets: 2,
        reps: 2,
        durationSeconds: 120,
        note: "Potentiate lower body for strength work.",
      },
      {
        name: "Med Ball Slams",
        keywords: ["slam", "med ball", "medicine ball"],
        sets: 2,
        reps: 6,
        durationSeconds: 60,
        note: "Power primer. Full hip drive.",
      },
      {
        name: "Squat to Stand",
        keywords: ["squat", "squat to stand"],
        sets: 2,
        reps: 6,
        durationSeconds: 90,
        note: "Ankles/hips/hamstrings mobility.",
      },
      {
        name: "Pogo Jumps",
        keywords: ["pogo", "ankle hop"],
        sets: 2,
        reps: 20,
        durationSeconds: 60,
        note: "Ankle stiffness and elastic rebound.",
      },
      {
        name: "Bicycle Spin",
        keywords: ["bicycle", "cycle", "bike"],
        durationSeconds: 120,
        note: "Finish raise phase: easy spin, smooth cadence.",
      },
    ]);
  }

  // ── FIELD variant (default) ──────────────────────────────────────────────
  // Sprint sessions, practice days, skill work, and everything else.
  // Mandatory plank block inserted after glute activation.
  // Total: 1500s (25 min).
  // Budget: removed Ankle Rocker (60s), reduced Calf Raises 60→30s,
  //         reduced 5-10-5 150→60s. Freed 180s → plank block.
  let plan = [
    {
      name: "Easy Jog",
      keywords: ["jog", "easy run"],
      durationSeconds: 120,
      note: "Raise: light jog, relaxed shoulders.",
    },
    {
      name: "Lateral Shuffle + Backpedal",
      keywords: ["shuffle", "backpedal"],
      durationSeconds: 120,
      note: "Raise: prep for multi-direction movement.",
    },
    {
      name: "Glute Bridge",
      keywords: ["glute bridge"],
      sets: 2,
      reps: 8,
      durationSeconds: 60,
      note: "Activate glutes before sprint mechanics.",
    },
    {
      name: "Mini-band Lateral Walks",
      keywords: ["band walk", "lateral walk", "monster walk"],
      sets: 2,
      reps: 8,
      durationSeconds: 90,
      note: "Activate glute medius for cutting.",
    },
    {
      name: "Calf Raises",
      keywords: ["calf raise"],
      sets: 1,
      reps: 10,
      durationSeconds: 30,
      note: "Prep Achilles and ankle stiffness.",
    },
    ...PLANK_ACTIVATION_BLOCK,
    {
      name: "Nordic Hamstring Curl",
      keywords: ["nordic", "hamstring curl"],
      sets: 2,
      reps: 5,
      durationSeconds: 120,
      note: "Slow eccentric. Injury prevention emphasis.",
    },
    {
      name: "Toy Soldiers",
      keywords: ["toy soldier", "straight leg"],
      sets: 2,
      reps: 10,
      durationSeconds: 90,
      note: "Dynamic hamstring mobility.",
    },
    {
      name: "Leg Swings (Front/Side)",
      keywords: ["leg swing"],
      sets: 2,
      reps: 10,
      durationSeconds: 90,
      note: "Open hips and hamstrings.",
    },
    {
      name: "Walking Lunge with Rotation",
      keywords: ["lunge", "rotation"],
      sets: 2,
      reps: 8,
      durationSeconds: 120,
      note: "Hip mobility + trunk control.",
    },
    {
      name: "A-Skips",
      keywords: ["a-skip", "a skip"],
      sets: 2,
      reps: 20,
      durationSeconds: 90,
      note: "Sprint mechanics: knee drive + dorsiflex.",
    },
    {
      name: "B-Skips",
      keywords: ["b-skip", "b skip"],
      sets: 2,
      reps: 20,
      durationSeconds: 90,
      note: "Sprint mechanics: pawing action.",
    },
    {
      name: "Acceleration Builds 10m",
      keywords: ["acceleration", "build", "10m"],
      sets: 3,
      reps: 1,
      durationSeconds: 120,
      note: "3 x 10m progressive accelerations.",
    },
    {
      name: "Progressive Sprints 20m",
      keywords: ["sprint", "20m"],
      sets: 2,
      reps: 1,
      durationSeconds: 120,
      note: "2 x 20m at 70-85%. Full recovery.",
    },
    {
      name: "5-10-5 Shuttle",
      keywords: ["5-10-5", "pro agility", "shuttle"],
      sets: 2,
      reps: 1,
      durationSeconds: 60,
      note: "Change of direction primer. Full recovery.",
    },
  ];

  if (warmupFocus === "quarterback" || warmupFocus === "center") {
    plan = applyQuarterbackWarmupOverrides(plan);
  } else if (warmupFocus === "blitzer") {
    plan = applyBlitzerWarmupOverrides(plan);
  } else if (warmupFocus === "wr_db") {
    plan = applyReceiverWarmupOverrides(plan);
  } else if (isQB || isCenter) {
    plan = applyQuarterbackWarmupOverrides(plan);
  }

  return withNmt(plan);
}

function selectWarmupVariant({
  isFitnessDay,
  isSprintSession,
  isPracticeDay,
  trainingFocus,
}) {
  const focus = (trainingFocus || "").toLowerCase();
  if (focus.includes("recovery") || focus === "rest") {
    return "recovery";
  }
  if (isFitnessDay) {
    return "fitness";
  }
  return "field";
}

function getPlyometricIntensity(phase, readinessScore) {
  if (readinessScore && readinessScore < 50) {
    return "low";
  }
  if (readinessScore && readinessScore < 70) {
    return "medium";
  }

  const phaseIntensityMap = {
    off_season_rest: "low",
    foundation: "low",
    strength_accumulation: "medium",
    power_development: "high",
    speed_development: "very_high",
    competition_prep: "high",
    in_season_maintenance: "medium",
    mid_season_reload: "medium",
    peak: "high",
    taper: "low",
    active_recovery: "low",
  };

  return phaseIntensityMap[phase] || "medium";
}

function getSafeConditioningIntensity(acwr, daysSinceLastSession, phase) {
  if (daysSinceLastSession === null || daysSinceLastSession > 7) {
    return {
      maxIntensity: 50,
      note: "⚠️ Returning to training - start at 50% intensity max",
    };
  }

  if (acwr && acwr > 1.5) {
    return {
      maxIntensity: 40,
      note: "🚨 ACWR >1.5 - reduce load to prevent injury",
    };
  }

  if (acwr && acwr > 1.3) {
    return {
      maxIntensity: 60,
      note: "⚠️ ACWR elevated - moderate intensity recommended",
    };
  }

  const phaseIntensityMax = {
    off_season_rest: 40,
    foundation: 60,
    strength_accumulation: 75,
    power_development: 85,
    speed_development: 95,
    competition_prep: 90,
    in_season_maintenance: 80,
    mid_season_reload: 75,
    peak: 95,
    taper: 60,
    active_recovery: 40,
  };

  return {
    maxIntensity: phaseIntensityMax[phase] || 70,
    note: null,
  };
}

function shouldIncludeNordicCurls(dayOfWeek, trainingFocus) {
  const nordicDays = [1, 3, 5];
  const strengthFocusDays = [
    "strength",
    "power",
    "strength_accumulation",
    "power_development",
  ];

  return (
    nordicDays.includes(dayOfWeek) || strengthFocusDays.includes(trainingFocus)
  );
}

// ── TIGHTNESS TRIAGE ─────────────────────────────────────────────────────────
// Warm-ups default to DYNAMIC mobility (above). Static stretching is retired as a
// default: it raises stretch TOLERANCE, not muscle length (Weppler 2010), gives no
// recovery/DOMS benefit (Afonso 2021), and long pre-activity holds transiently cut
// strength/power. A static hold is TRIAGE ONLY — for a genuine, documented ROM
// restriction, on tissue that is NOT acutely sore or injured (aggressive stretch on
// freshly-damaged tissue is contraindicated — McHugh & Tyler 2019). This map + guard
// are that triage; wire to a real ROM-restriction signal (not soreness — soreness is
// a contraindication here, not an indication).

// Canonical region → the ONE targeted stretch to prescribe for a real restriction.
const TIGHTNESS_TRIAGE_STRETCHES = Object.freeze({
  hip_flexor: {
    name: "Half-Kneeling Hip-Flexor Stretch",
    durationSeconds: 30,
    note: "ROM restriction only: <30 s/side, posterior pelvic tilt, then re-potentiate with a lunge or squat before loading.",
  },
  hamstring: {
    name: "Supine Hamstring Stretch (strap)",
    durationSeconds: 30,
    note: "ROM restriction only: <30 s/side, soft knee, hinge from the hip. Not on a strained hamstring.",
  },
  calf: {
    name: "Wall Calf Stretch (bent + straight knee)",
    durationSeconds: 30,
    note: "ROM restriction only: <30 s/side each knee angle (gastroc + soleus). Not on an irritated Achilles.",
  },
  chest: {
    name: "Doorway Pec Stretch",
    durationSeconds: 30,
    note: "ROM restriction only: <30 s/side, elbow at shoulder height, gentle lean.",
  },
  shoulder: {
    name: "Cross-Body Shoulder Stretch",
    durationSeconds: 30,
    note: "ROM restriction only: <30 s/side, no pain into the joint.",
  },
});

// Map loose region synonyms onto the canonical triage keys.
const TIGHTNESS_REGION_ALIASES = Object.freeze({
  hip: "hip_flexor",
  hip_flexor: "hip_flexor",
  hips: "hip_flexor",
  quad: "hip_flexor",
  hamstring: "hamstring",
  hamstrings: "hamstring",
  posterior_chain: "hamstring",
  calf: "calf",
  calves: "calf",
  achilles: "calf",
  ankle: "calf",
  chest: "chest",
  pec: "chest",
  pecs: "chest",
  shoulder: "shoulder",
  shoulders: "shoulder",
});

function normalizeTightnessRegion(region) {
  if (!region || typeof region !== "string") {
    return null;
  }
  const k = region
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return (
    TIGHTNESS_REGION_ALIASES[k] || (TIGHTNESS_TRIAGE_STRETCHES[k] ? k : null)
  );
}

/**
 * Tightness triage: the single targeted static stretch for a region with a GENUINE
 * ROM restriction — or null to defer to dynamic mobility. Returns null when the
 * region is acutely sore or under an active injury: static stretching freshly
 * damaged tissue is contraindicated. This is the ONLY sanctioned place a static
 * hold enters a session.
 *
 * @param {string} region  the tight region (canonical or a known synonym)
 * @param {object} [ctx]
 * @param {string[]} [ctx.soreRegions]    acutely sore regions (contraindication)
 * @param {string[]} [ctx.injuryRegions]  active-injury regions (contraindication)
 * @returns {object|null} `{ name, durationSeconds, note, triage: true, region }` or null
 */
function tightnessTriageStretch(
  region,
  { soreRegions = [], injuryRegions = [] } = {},
) {
  const key = normalizeTightnessRegion(region);
  if (!key) {
    return null;
  }
  const contraindicated = new Set(
    [...soreRegions, ...injuryRegions]
      .map(normalizeTightnessRegion)
      .filter(Boolean),
  );
  if (contraindicated.has(key)) {
    return null; // never statically stretch acutely sore / injured tissue
  }
  return { ...TIGHTNESS_TRIAGE_STRETCHES[key], triage: true, region: key };
}

export {
  WARMUP_TARGET_SECONDS,
  NMT_TARGET_SECONDS,
  NMT_PREVENTION_SEGMENT,
  buildWarmupTemplate,
  getPlyometricIntensity,
  getSafeConditioningIntensity,
  selectWarmupVariant,
  shouldIncludeNordicCurls,
  tightnessTriageStretch,
};

const WARMUP_TARGET_SECONDS = 25 * 60;

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

function buildWarmupTemplate({ variant, isQB, isCenter, warmupFocus }) {
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
      {
        name: "Hip 90/90 Stretch",
        keywords: ["90/90", "hip rotation", "hip stretch"],
        durationSeconds: 120,
        note: "60s each side. External/internal rotation. Breathe into the stretch.",
      },
      {
        name: "Pigeon Pose",
        keywords: ["pigeon", "hip opener", "glute stretch"],
        durationSeconds: 150,
        note: "75s each side. Deep hip flexor + glute release. Breathe through tightness.",
      },
      {
        name: "Seated Hamstring Stretch",
        keywords: ["hamstring stretch", "seated stretch"],
        durationSeconds: 90,
        note: "45s each leg. Hinge from hip, not rounding lumbar. Soft knee.",
      },
      {
        name: "Hip Flexor Lunge Stretch",
        keywords: ["hip flexor", "lunge stretch", "kneeling lunge"],
        durationSeconds: 90,
        note: "45s each side. Posterior pelvic tilt to deepen the stretch.",
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
    return [
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
    ];
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

  return plan;
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

function getCurrentPeriodizationPhase(date = new Date()) {
  const month = date.getMonth() + 1;

  switch (month) {
    case 11:
      return "off_season_rest";
    case 12:
      return "foundation";
    case 1:
      return "strength_accumulation";
    case 2:
      return "power_development";
    case 3:
      return "speed_development";
    case 4:
    case 5:
    case 6:
      return "in_season_maintenance";
    case 7:
      return "mid_season_reload";
    case 8:
      return "peak";
    case 9:
    case 10:
      return "in_season_maintenance";
    default:
      return "foundation";
  }
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

export {
  WARMUP_TARGET_SECONDS,
  buildWarmupTemplate,
  getCurrentPeriodizationPhase,
  getPlyometricIntensity,
  getSafeConditioningIntensity,
  selectWarmupVariant,
  shouldIncludeNordicCurls,
};

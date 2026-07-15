// CANONICAL wellness scoring — the single source of truth for how sleep / soreness /
// energy / mood / stress combine into a 0-100 wellness signal, used by BOTH:
//   1. calc-readiness.js's composite Today readiness (30% weight) — calculateWellnessIndex.
//   2. wellness-checkin.js's check-in-time estimate — calculateWellnessScore.
//
// 2026-07-08 unification: these were two independently-tuned formulas (calc-readiness's
// evidence-cited 1-5-bucketed index vs the check-in's own .3/.25/.25/.2 weights, mood
// unused). They now share ONE weighting scheme (WELLNESS_REQUIRED_WEIGHTS /
// WELLNESS_OPTIONAL_WEIGHTS / WELLNESS_REQUIRED_BLEND below) — the audit-flagged drift
// is resolved at the level that mattered (relative importance of each input).
//
// 2026-07-15 (audit C5): the remaining normalization difference is COLLAPSED —
// calculateWellnessIndex now normalizes LINEARLY from the raw 1-10 values (the
// same v/10 mapping calculateWellnessScore uses), retiring the 1-5 bucket
// quantization that made a 7→8 sleep improvement invisible half the time.
// Precondition re-verified before the change, as the previous header demanded:
//   - wellness.component.html sliders are hard-bound min=1 max=10 (the only
//     writer UI), and
//   - wellness-checkin.js defaults scale to 10 (S6 safe direction) — so the
//     DB rows this index reads are 1-10, always.
// The reported sleepQuality/soreness/… fields stay 1-5 buckets for display
// compatibility; only the SUBSCORE math changed (max shift per field ±10 pts
// at the extremes, typical rows move ≤6 subscore points ⇒ ≤2.1 readiness
// points at the 0.35 wellness weight — documented in CALC §4).
//   - calculateWellnessScore still requires an EXPLICIT scale (the "S6" fix)
//     because the check-in endpoint's CONTRACT accepts scale:5 even though the
//     live UI never sends it.

const WELLNESS_REQUIRED_WEIGHTS = { sleep: 0.4, soreness: 0.3, energy: 0.3 };
const WELLNESS_OPTIONAL_WEIGHTS = { mood: 0.5, stress: 0.5 };
const WELLNESS_REQUIRED_BLEND = 0.6; // required 60% / optional 40% when optional present

/**
 * Convert 1-10 scale to 1-5 scale (standard athlete monitoring scale)
 */
function scaleTo1to5(value) {
  if (value === null || value === undefined) {
    return null;
  }
  // Map 1-10 to 1-5: 1-2→1, 3-4→2, 5-6→3, 7-8→4, 9-10→5
  return Math.ceil(value / 2);
}

/**
 * Calculate wellness index subscore (0-100)
 * Modeled on common athlete monitoring scales using 1-5 ratings
 */
function calculateWellnessIndex(wellness) {
  // 1-5 buckets are kept ONLY for the reported display fields; scoring is
  // linear from the raw 1-10 values (C5, 2026-07-15 — see header).
  const sleepQuality = scaleTo1to5(wellness.sleep_quality);
  const soreness = scaleTo1to5(wellness.soreness);
  const energy = scaleTo1to5(wellness.energy);
  const mood = scaleTo1to5(wellness.mood);
  const stress = scaleTo1to5(wellness.stress);

  const rawOrNull = (v) =>
    typeof v === "number" && !Number.isNaN(v) ? v : null;
  const norm10 = (v) => (v / 10) * 100;
  const norm10Inverted = (v) => ((10 - v) / 10) * 100;

  // Required fields. The phantom 'fatigue' is removed (D11): it had no column and
  // always equalled soreness, so soreness carried 65% of this subscore. ENERGY is
  // the real recovery/fatigue signal (energy_level) and is promoted to required.
  const requiredFields = [
    {
      value: rawOrNull(wellness.sleep_quality),
      weight: WELLNESS_REQUIRED_WEIGHTS.sleep,
      norm: norm10,
    },
    {
      value: rawOrNull(wellness.soreness),
      weight: WELLNESS_REQUIRED_WEIGHTS.soreness,
      norm: norm10Inverted,
    },
    {
      value: rawOrNull(wellness.energy),
      weight: WELLNESS_REQUIRED_WEIGHTS.energy,
      norm: norm10,
    },
  ];

  // Optional fields (mood, stress)
  const optionalFields = [
    {
      value: rawOrNull(wellness.mood),
      weight: WELLNESS_OPTIONAL_WEIGHTS.mood,
      norm: norm10,
    },
    {
      value: rawOrNull(wellness.stress),
      weight: WELLNESS_OPTIONAL_WEIGHTS.stress,
      norm: norm10Inverted,
    },
  ];

  // Calculate completeness
  const requiredCount = requiredFields.filter((f) => f.value !== null).length;
  const optionalCount = optionalFields.filter((f) => f.value !== null).length;
  const totalFields = requiredFields.length + optionalFields.length;
  const availableFields = requiredCount + optionalCount;
  const completeness = (availableFields / totalFields) * 100;

  // Subscore from raw 1-10 values, linearly (soreness/stress inverted —
  // higher is worse). Partial rows still score from whatever exists, with
  // proportional reweighting, exactly as before.
  let requiredSubscore = 0;
  let requiredWeightSum = 0;

  requiredFields.forEach((field) => {
    if (field.value !== null) {
      requiredSubscore += field.norm(field.value) * field.weight;
      requiredWeightSum += field.weight;
    }
  });

  // Add optional fields if available
  let optionalSubscore = 0;
  let optionalWeightSum = 0;

  optionalFields.forEach((field) => {
    if (field.value !== null) {
      optionalSubscore += field.norm(field.value) * field.weight;
      optionalWeightSum += field.weight;
    }
  });

  // Calculate final subscore
  // If optional fields available, blend them; otherwise use required only
  let subscore;
  if (requiredWeightSum === 0 && optionalWeightSum === 0) {
    subscore = null;
  } else if (requiredWeightSum === 0) {
    subscore = optionalSubscore / optionalWeightSum;
  } else if (optionalWeightSum > 0) {
    // Blend required (60%) and optional (40%)
    const requiredScore = requiredSubscore / requiredWeightSum;
    const optionalScore = optionalSubscore / optionalWeightSum;
    subscore =
      requiredScore * WELLNESS_REQUIRED_BLEND +
      optionalScore * (1 - WELLNESS_REQUIRED_BLEND);
  } else {
    // Use required fields only
    subscore = requiredSubscore / requiredWeightSum;
  }

  return {
    sleepQuality: sleepQuality || null,
    soreness: soreness || null,
    mood: mood || null,
    stress: stress || null,
    energy: energy || null,
    subscore: Math.round(subscore),
    completeness: Math.round(completeness),
  };
}

/**
 * Calculate a 0-100 wellness score directly from raw check-in values on an EXPLICIT
 * scale — the check-in-time-safe counterpart to calculateWellnessIndex. Same weighting
 * scheme (WELLNESS_REQUIRED_WEIGHTS / WELLNESS_OPTIONAL_WEIGHTS / WELLNESS_REQUIRED_BLEND),
 * but normalizes straight to 0-100 (no 1-5 bucket loss) and NEVER guesses the scale —
 * the "S6" fix: a bad 0-10 day must not be misread as a good 1-5 day. `scale` defaults
 * to 10 (the safe direction: a 1-5 input misread as 0-10 is over-conservative, never the
 * over-optimistic inversion).
 *
 * Requires sleep AND energy (minimum for a non-fabricated result, Spec Law 7) — stricter
 * than calculateWellnessIndex, which can score from soreness alone. soreness/mood/stress
 * are each optional and reweight gracefully when absent, same as calculateWellnessIndex.
 *
 * @param {{sleep:number|null, energy:number|null, soreness?:number|null, mood?:number|null, stress?:number|null}} values
 * @param {{scale?: 5|10}} [options]
 * @returns {number|null} 0-100, or null if sleep/energy are missing
 */
function calculateWellnessScore(values, { scale = 10 } = {}) {
  const s = scale === 5 ? 5 : 10;
  const { sleep, energy, soreness, mood, stress } = values;

  if (
    sleep === null ||
    sleep === undefined ||
    energy === null ||
    energy === undefined
  ) {
    return null;
  }

  // Direct-to-100 normalization (no 1-5 bucket quantization): higher-is-better fields
  // map value/scale*100; higher-is-worse fields (soreness, stress) invert first.
  const norm = (v) => (v / s) * 100;
  const normInverted = (v) => ((s - v) / s) * 100;

  const requiredFields = [
    { value: sleep, weight: WELLNESS_REQUIRED_WEIGHTS.sleep, norm },
    {
      value: soreness,
      weight: WELLNESS_REQUIRED_WEIGHTS.soreness,
      norm: normInverted,
    },
    { value: energy, weight: WELLNESS_REQUIRED_WEIGHTS.energy, norm },
  ];
  const optionalFields = [
    { value: mood, weight: WELLNESS_OPTIONAL_WEIGHTS.mood, norm },
    {
      value: stress,
      weight: WELLNESS_OPTIONAL_WEIGHTS.stress,
      norm: normInverted,
    },
  ];

  let requiredSubscore = 0;
  let requiredWeightSum = 0;
  for (const f of requiredFields) {
    if (f.value !== null && f.value !== undefined) {
      requiredSubscore += f.norm(f.value) * f.weight;
      requiredWeightSum += f.weight;
    }
  }

  let optionalSubscore = 0;
  let optionalWeightSum = 0;
  for (const f of optionalFields) {
    if (f.value !== null && f.value !== undefined) {
      optionalSubscore += f.norm(f.value) * f.weight;
      optionalWeightSum += f.weight;
    }
  }

  const requiredScore = requiredSubscore / requiredWeightSum;
  const score =
    optionalWeightSum > 0
      ? requiredScore * WELLNESS_REQUIRED_BLEND +
        (optionalSubscore / optionalWeightSum) * (1 - WELLNESS_REQUIRED_BLEND)
      : requiredScore;

  return Math.round(Math.max(0, Math.min(100, score)));
}

export {
  calculateWellnessIndex,
  calculateWellnessScore,
  WELLNESS_REQUIRED_WEIGHTS,
  WELLNESS_OPTIONAL_WEIGHTS,
  WELLNESS_REQUIRED_BLEND,
};

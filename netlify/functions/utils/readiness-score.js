// CANONICAL wellness-index scorer — the single source of truth for the wellness
// component (30%) of the composite readiness score computed in calc-readiness.js.
//
// SCOPE: this scores WELLNESS from the daily check-in fields (sleep/soreness/energy
// + optional mood/stress) on the DB's 1-10 storage scale (scaleTo1to5 maps 1-10 -> 1-5).
//
// NOT the same as wellness-checkin.js `calculateReadiness()`. That is a SEPARATE,
// deliberately-tuned CHECK-IN-TIME estimate with EXPLICIT form-scale handling (1-5 vs
// 0-10, the "S6" fix) so a bad 0-10 day is never misread as a good 1-5 day. The two
// have INCOMPATIBLE scale assumptions on purpose — do NOT naively merge them onto this
// function, or you reintroduce the scale-inversion hazard S6 fixed. Any real
// unification is a sports-science decision (which weighting is canonical) + must be
// validated with a before/after delta, not a mechanical dedupe.

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
  // Convert to 1-5 scale
  const sleepQuality = scaleTo1to5(wellness.sleep_quality);
  const soreness = scaleTo1to5(wellness.soreness);
  const energy = scaleTo1to5(wellness.energy);
  const mood = scaleTo1to5(wellness.mood);
  const stress = scaleTo1to5(wellness.stress);

  // Required fields. The phantom 'fatigue' is removed (D11): it had no column and
  // always equalled soreness, so soreness carried 65% of this subscore. ENERGY is
  // the real recovery/fatigue signal (energy_level) and is promoted to required.
  const requiredFields = [
    { value: sleepQuality, weight: 0.4, name: "sleepQuality" },
    { value: soreness, weight: 0.3, name: "soreness" },
    { value: energy, weight: 0.3, name: "energy" },
  ];

  // Optional fields (mood, stress)
  const optionalFields = [
    { value: mood, weight: 0.5, name: "mood" },
    { value: stress, weight: 0.5, name: "stress" },
  ];

  // Calculate completeness
  const requiredCount = requiredFields.filter((f) => f.value !== null).length;
  const optionalCount = optionalFields.filter((f) => f.value !== null).length;
  const totalFields = requiredFields.length + optionalFields.length;
  const availableFields = requiredCount + optionalCount;
  const completeness = (availableFields / totalFields) * 100;

  // Calculate subscore from required fields (always available). Invert soreness
  // (higher = worse); sleepQuality and energy are higher = better.
  let requiredSubscore = 0;
  let requiredWeightSum = 0;

  requiredFields.forEach((field) => {
    if (field.value !== null) {
      let normalizedValue;
      if (field.name === "soreness") {
        // Invert: 1 (best) → 100, 5 (worst) → 20
        normalizedValue = 100 - (field.value - 1) * 20;
      } else {
        // Sleep quality: 1 (worst) → 20, 5 (best) → 100
        normalizedValue = 20 + (field.value - 1) * 20;
      }
      requiredSubscore += normalizedValue * field.weight;
      requiredWeightSum += field.weight;
    }
  });

  // Add optional fields if available
  let optionalSubscore = 0;
  let optionalWeightSum = 0;

  optionalFields.forEach((field) => {
    if (field.value !== null) {
      let normalizedValue;
      if (field.name === "stress") {
        // Invert stress: 1 (no stress) → 100, 5 (very stressed) → 20
        normalizedValue = 100 - (field.value - 1) * 20;
      } else {
        // Mood and energy: 1 (worst) → 20, 5 (best) → 100
        normalizedValue = 20 + (field.value - 1) * 20;
      }
      optionalSubscore += normalizedValue * field.weight;
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
    subscore = requiredScore * 0.6 + optionalScore * 0.4;
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

export { calculateWellnessIndex };

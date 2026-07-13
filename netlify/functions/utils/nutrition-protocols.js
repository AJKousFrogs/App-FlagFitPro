// Nutrition protocols — single-source, evidence-graded calculators for the three
// gaps the performance/injury-nutrition review flagged: tournament between-games
// refuelling, the caffeine-vs-sleep trade-off, and supplement contamination risk.
//
// Grounded in: Thomas/ACSM-AND-DoC 2016 position stand; Burke 2017 (carb periodisation);
// Kerksick/ISSN 2017 (nutrient timing); Guest/ISSN 2021 (caffeine position); Drake 2013
// (caffeine 6 h before bed cuts sleep ~1 h); Geyer 2004 & Outram/Stewart 2015 (supplement
// contamination). Doses are per-kg — never a flat number — because a 60 kg and a 100 kg
// athlete have very different needs.

// ─────────────────────────────────────────────────────────────────────────────
// 1. BETWEEN-GAMES REFUEL (tournament days: several games, short recovery windows)
// ─────────────────────────────────────────────────────────────────────────────

// Rapid glycogen resynthesis when the next effort is <8 h away needs aggressive,
// high-GI carbohydrate; protein aids resynthesis + repair; fluid replaces the
// deficit with sodium. Rates are the ACSM/IOC consensus.
const REFUEL = Object.freeze({
  CARB_G_PER_KG_PER_H: 1.0, // 1.0–1.2 g/kg/h high-GI when recovery <8 h (Burke 2017)
  CARB_WINDOW_CAP_H: 4, // the aggressive window; beyond this, normal meals resume
  PROTEIN_G_PER_KG: 0.3, // ~0.3 g/kg (≈20–40 g) co-ingested
  FLUID_ML_PER_H: 600, // 500–750 ml/h guidance absent a measured sweat loss
  SODIUM_MG_PER_L: 600, // 300–700 mg/L to drive retention
});

const clampNum = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Between-games refuel targets for a tournament recovery window.
 *
 * @param {object} p
 * @param {number} p.weightKg            athlete body mass (kg)
 * @param {number} p.hoursUntilNextGame  recovery window to the next kickoff (h)
 * @returns {object|null} targets + a window-appropriate strategy, or null on bad input
 */
export function betweenGamesRefuel({ weightKg, hoursUntilNextGame } = {}) {
  const kg = Number(weightKg);
  const gap = Number(hoursUntilNextGame);
  if (!Number.isFinite(kg) || kg < 30 || kg > 200) {
    return null;
  }
  if (!Number.isFinite(gap) || gap <= 0 || gap > 48) {
    return null;
  }

  const carbWindowH = clampNum(gap, 0, REFUEL.CARB_WINDOW_CAP_H);
  const carbsG = Math.round(kg * REFUEL.CARB_G_PER_KG_PER_H * carbWindowH);
  const proteinG = Math.round(kg * REFUEL.PROTEIN_G_PER_KG);
  const fluidMl = Math.round(REFUEL.FLUID_ML_PER_H * carbWindowH);
  const sodiumMg = Math.round((fluidMl / 1000) * REFUEL.SODIUM_MG_PER_L);

  // Strategy is gap-driven: the shorter the window, the more it must be liquid /
  // simple carbs with minimal fat, fibre and protein to avoid GI distress mid-day.
  let strategy;
  let form;
  if (gap < 1.5) {
    strategy = "short";
    form =
      "Liquid + simple carbs only (sports drink, banana, gel, white rice/bread). Keep fat, fibre and heavy protein low — GI comfort beats completeness this close to kickoff. Prioritise fluid.";
  } else if (gap <= 4) {
    strategy = "medium";
    form =
      "Carb-focused with moderate protein, low fat/fibre: e.g. rice + chicken breast + fruit, or a recovery shake plus a banana. Sip fluids steadily.";
  } else {
    strategy = "long";
    form =
      "Time for a proper mixed meal (carbs + protein + vegetables). Still finish the aggressive carb intake in the first ~4 h, then eat normally.";
  }

  return {
    windowHours: gap,
    carbs_g: carbsG,
    protein_g: proteinG,
    fluid_ml: fluidMl,
    sodium_mg: sodiumMg,
    strategy,
    form,
    note: `Refuel over the first ~${carbWindowH} h: ~${REFUEL.CARB_G_PER_KG_PER_H} g/kg/h carbohydrate (${carbsG} g), ~${REFUEL.PROTEIN_G_PER_KG} g/kg protein (${proteinG} g), and ~${fluidMl} ml fluid with ~${sodiumMg} mg sodium. Start within 30 min of the final whistle.`,
    evidence: "ACSM/AND/DoC 2016; Burke 2017",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CAFFEINE ⇄ SLEEP GUARDRAIL (an evening game's caffeine can wreck the night)
// ─────────────────────────────────────────────────────────────────────────────

const CAFFEINE = Object.freeze({
  DOSE_LOW_MG_PER_KG: 3, // ergogenic range 3–6 mg/kg (Guest/ISSN 2021)
  DOSE_HIGH_MG_PER_KG: 6,
  PRE_GAME_LEAD_H: 1, // taken ~45–60 min pre-performance
  SLEEP_PROTECT_GAP_H: 6, // caffeine within ~6 h of bed cuts sleep (Drake 2013)
});

/**
 * Should this athlete take pre-game caffeine, given when they need to sleep?
 * Half-life is ~5 h, so a dose within ~6 h of bedtime measurably harms sleep —
 * and for an athlete, one night's sleep outweighs a marginal caffeine bump.
 *
 * @param {object} p
 * @param {number} p.weightKg       body mass (kg)
 * @param {number} p.gameStartHour  kickoff, 0–24 local (e.g. 20.5 = 8:30 pm)
 * @param {number} [p.bedtimeHour]  usual bedtime, 0–24 (values <12 treated as after-midnight, +24)
 * @returns {object|null} dosing + a sleep-aware recommendation, or null on bad input
 */
export function caffeineSleepGuardrail({
  weightKg,
  gameStartHour,
  bedtimeHour = 23,
} = {}) {
  const kg = Number(weightKg);
  const game = Number(gameStartHour);
  let bed = Number(bedtimeHour);
  if (!Number.isFinite(kg) || kg < 30 || kg > 200) {
    return null;
  }
  if (!Number.isFinite(game) || game < 0 || game > 24) {
    return null;
  }
  if (!Number.isFinite(bed) || bed < 0 || bed > 24) {
    return null;
  }
  // A bedtime numerically before the game (e.g. bed 23, game 20) is same-evening;
  // a small bedtime like 1 (1 am) is after midnight → shift past the game clock.
  if (bed < game) {
    bed += 24;
  }

  const takeAtHour = game - CAFFEINE.PRE_GAME_LEAD_H;
  const hoursBeforeBed = Math.round((bed - takeAtHour) * 10) / 10;
  const protectsSleep = hoursBeforeBed >= CAFFEINE.SLEEP_PROTECT_GAP_H;
  const doseLow = Math.round(kg * CAFFEINE.DOSE_LOW_MG_PER_KG);
  const doseHigh = Math.round(kg * CAFFEINE.DOSE_HIGH_MG_PER_KG);

  if (protectsSleep) {
    return {
      recommend: true,
      doseMgLow: doseLow,
      doseMgHigh: doseHigh,
      takeAtHour,
      hoursBeforeBed,
      protectsSleep: true,
      guidance: `${doseLow}–${doseHigh} mg (${CAFFEINE.DOSE_LOW_MG_PER_KG}–${CAFFEINE.DOSE_HIGH_MG_PER_KG} mg/kg) ~${CAFFEINE.PRE_GAME_LEAD_H} h pre-game. There are ~${hoursBeforeBed} h before bed — sleep is protected.`,
      warning: null,
    };
  }

  return {
    recommend: false,
    doseMgLow: 0,
    doseMgHigh: 0,
    takeAtHour,
    hoursBeforeBed,
    protectsSleep: false,
    guidance:
      "Skip pre-game caffeine (or cap at a small early dose well before the game). Prioritise sleep, warm-up and fuelling instead.",
    warning: `Only ~${hoursBeforeBed} h between a pre-game dose and bed (needs ≥${CAFFEINE.SLEEP_PROTECT_GAP_H} h). Caffeine this late measurably shortens sleep (Drake 2013) — for an athlete, the lost sleep costs more than the caffeine gains.`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SUPPLEMENT CONTAMINATION RISK / BATCH-TESTING (strict-liability anti-doping)
// ─────────────────────────────────────────────────────────────────────────────

// Under strict liability the athlete is responsible for everything in their body —
// and ~10–25% of tested supplements have contained undeclared banned substances
// (Geyer 2004; Outram & Stewart 2015). The single rule: use only products
// third-party batch-tested (Informed Sport / NSF Certified for Sport).
export const BATCH_TESTED_IMPERATIVE =
  "Competitive athletes: use ONLY supplements third-party batch-tested for sport (Informed Sport or NSF Certified for Sport). Under anti-doping strict liability you are responsible for every substance in your body, and a meaningful share of untested supplements are contaminated with undeclared banned substances. No certification = do not take it.";

// Categories where contamination actually shows up vs. reputably-sourced single
// ingredients with strong evidence and low intrinsic risk.
const HIGH_RISK_TERMS = [
  "pre-workout",
  "pre workout",
  "preworkout",
  "proprietary blend",
  "fat burner",
  "fat-burner",
  "weight loss",
  "test booster",
  "testosterone",
  "test boost",
  "sarm",
  "pump",
  "muscle builder",
  "nootropic",
  "energy blend",
];
const LOW_RISK_TERMS = [
  "creatine monohydrate",
  "creatine",
  "caffeine",
  "whey isolate",
  "whey protein",
  "vitamin d",
  "omega-3",
  "omega 3",
  "fish oil",
  "electrolyte",
  "magnesium",
  "beta-alanine",
  "beta alanine",
];

/**
 * Contamination-risk tier for a supplement, plus the always-on batch-testing rule.
 * HIGH = category where undeclared substances are commonly found; LOW = reputably
 * sourced single-ingredient staple; MODERATE = everything else (blends, unknowns).
 * batchTestedRequired is ALWAYS true — the tier only changes how loud the warning is.
 *
 * @param {string} name  free-text supplement name
 * @returns {object} { risk, batchTestedRequired, note }
 */
export function supplementContaminationRisk(name) {
  const n = String(name || "").toLowerCase();
  const isHigh = HIGH_RISK_TERMS.some((t) => n.includes(t));
  const isLow = !isHigh && LOW_RISK_TERMS.some((t) => n.includes(t));
  const risk = isHigh ? "high" : isLow ? "low" : "moderate";

  let note;
  if (risk === "high") {
    note =
      "High-risk category — proprietary blends / pre-workouts / 'boosters' are where undeclared stimulants and banned agents are most often found. Only take a version that is batch-tested for sport, or avoid it entirely.";
  } else if (risk === "low") {
    note =
      "Lower intrinsic risk as a single reputable ingredient, but contamination still happens in manufacturing — buy a batch-tested (Informed Sport / NSF) product.";
  } else {
    note =
      "Unverified / multi-ingredient — treat as contamination risk until you confirm a batch-tested (Informed Sport / NSF) certification on the exact product and lot.";
  }
  return { risk, batchTestedRequired: true, note };
}

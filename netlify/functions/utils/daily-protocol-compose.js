// COMPOSE-mode helpers: translate the periodization intent layer's canonical
// signals (position bucket, day intent) into daily-protocol's session-decision
// variables, so the protocol REALIZES the periodization intent instead of
// re-deriving its own session. See the COMPOSE banner in daily-protocol.js.

/** Position flags from the periodization canonical bucket (qb/wr/db/center/
 * blitzer/wr_db) — fixes the isQB/center mismatch (raw 'qb' !== 'quarterback'). */
function positionFlagsFor(bucket) {
  const b = String(bucket || "").toLowerCase();
  return {
    isQB: b === "qb" || b === "quarterback",
    isCenter: b === "center",
    isBlitzer: b === "blitzer" || b === "rusher",
  };
}

// The low-load day types — rest, recovery, mobility, travel, competition. All
// skip the gym / main-session blocks, but each realizes DISTINCT content (rest =
// minimal daily mobility; recovery = active recovery + modality protocols;
// mobility = a mobility session; travel = anti-stiffness movement + hydration;
// competition = game-day). Keeping them as separate `trainingFocus` values — not
// collapsed into one "recovery" — is what lets the generator make each day type
// look and read differently; this Set is the shared classifier the gating uses.
const LOW_LOAD_FOCUSES = new Set([
  "rest",
  "recovery",
  "mobility",
  "travel",
  "competition",
]);

/** Is this a low-load, non-gym day (rest/recovery/mobility/travel/competition)? */
function isLowLoadFocus(trainingFocus) {
  return LOW_LOAD_FOCUSES.has(trainingFocus);
}

/** A low-load day's session decision: no gym, no sprint, not a practice. */
const lowLoad = (trainingFocus) => ({
  trainingFocus,
  isSprintSession: false,
  isGymTrainingDay: false,
  isPracticeDay: false,
});

/** Map a periodization INTENT (+ label) to daily-protocol's session decision
 * variables. A "Flag football practice" label is a practice day regardless of
 * the underlying intent. */
function mapIntentToSession(intent, intentLabel) {
  if (/practice/i.test(String(intentLabel || ""))) {
    return {
      trainingFocus: "practice_day",
      isSprintSession: false,
      isGymTrainingDay: false,
      isPracticeDay: true,
    };
  }
  switch (intent) {
    case "sprint":
    case "taper-prime":
      return {
        trainingFocus: "speed",
        isSprintSession: true,
        isGymTrainingDay: false,
        isPracticeDay: false,
      };
    case "strength":
      return {
        trainingFocus: "strength",
        isSprintSession: false,
        isGymTrainingDay: true,
        isPracticeDay: false,
      };
    case "mixed":
      return {
        trainingFocus: "conditioning",
        isSprintSession: false,
        isGymTrainingDay: true,
        isPracticeDay: false,
      };
    case "technical":
      return {
        trainingFocus: "skill",
        isSprintSession: false,
        isGymTrainingDay: true,
        isPracticeDay: false,
      };
    // Distinct low-load day types — NOT collapsed into one "recovery" (bug
    // 2026-07-12: rest, recovery, mobility, travel and competition all rendered
    // identically). Each gets its own trainingFocus so the generator realizes
    // distinct content; all skip gym/sprint/practice (see lowLoad()).
    case "mobility":
      return lowLoad("mobility");
    case "recovery":
      return lowLoad("recovery");
    case "rest":
      return lowLoad("rest");
    case "travel":
      return lowLoad("travel");
    case "competition":
      return lowLoad("competition");
    default:
      return {
        trainingFocus: "strength",
        isSprintSession: false,
        isGymTrainingDay: true,
        isPracticeDay: false,
      };
  }
}

export {
  positionFlagsFor,
  mapIntentToSession,
  isLowLoadFocus,
  LOW_LOAD_FOCUSES,
};

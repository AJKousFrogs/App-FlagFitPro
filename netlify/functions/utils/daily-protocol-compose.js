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
    case "mobility":
    case "recovery":
    case "rest":
    case "travel":
    case "competition":
      return {
        trainingFocus: "recovery",
        isSprintSession: false,
        isGymTrainingDay: false,
        isPracticeDay: false,
      };
    default:
      return {
        trainingFocus: "strength",
        isSprintSession: false,
        isGymTrainingDay: true,
        isPracticeDay: false,
      };
  }
}

export { positionFlagsFor, mapIntentToSession };

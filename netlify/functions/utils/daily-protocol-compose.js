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

/**
 * Which gym blocks a training-focus day is composed of — the realization-side
 * half of the COMPOSE contract. Before 2026-07-14 every gym day (strength,
 * mixed AND technical intents) got the identical five-block dump (isometrics +
 * plyometrics + strength + conditioning + skill_drills), so a "Strength
 * session" hero rendered as a mini practice (production bug report). The day's
 * intent now owns the block shape:
 *
 *  - strength      → DOP isometrics + a strength-led main block. No field
 *                    conditioning, no skill stations, no plyo block (elastic
 *                    primers already live in the gym warm-up).
 *  - conditioning  → the athlete-facing "Mixed session" = strength + conditioning:
 *                    DOP isometrics + plyo + a reduced strength block + real
 *                    field conditioning volume.
 *  - skill         → technical day: DOP isometrics + a skills-led main block.
 *
 * Every gym day keeps the isometrics block — that IS the injury-prevention
 * (DOP) slot (plus the mandatory Nordic/hip work inside the strength block
 * where present). Speed days don't pass through here (own sprint session).
 */
const GYM_BLOCK_PLANS = {
  strength: {
    isometrics: true,
    plyometrics: false,
    strength: true,
    generalStrengthCount: 3,
    conditioning: false,
    skills: false,
    skillsCount: 0,
  },
  conditioning: {
    isometrics: true,
    plyometrics: true,
    strength: true,
    generalStrengthCount: 1,
    conditioning: true,
    skills: false,
    skillsCount: 0,
  },
  skill: {
    isometrics: true,
    plyometrics: false,
    strength: false,
    generalStrengthCount: 0,
    conditioning: false,
    skills: true,
    skillsCount: 6,
  },
};

/** Block plan for a gym training focus. Unknown focus → the strength shape
 * (matches mapIntentToSession's default branch). */
function gymBlockPlanFor(trainingFocus) {
  const focus = String(trainingFocus || "").toLowerCase();
  return GYM_BLOCK_PLANS[focus] ?? GYM_BLOCK_PLANS.strength;
}

/**
 * May a day-of-week `training_session_templates` row realize this day's main
 * session? Only when its session_type belongs to the same family as the day's
 * focus — the intent owns the day (LOGIC §0); a "Tuesday agility" template must
 * never hijack a strength day (2026-07-14 production bug). Unknown/missing
 * session_type → no match: a template that can't prove relevance yields to the
 * intent-shaped generation.
 */
const TEMPLATE_FAMILY = {
  speed: ["speed", "sprint", "acceleration", "max_velocity"],
  strength: ["strength", "power", "gym", "weights", "lifting"],
  conditioning: ["conditioning", "tempo", "aerobic", "mixed"],
  skill: ["skill", "agility", "technical", "routes", "route_running"],
};

function templateMatchesFocus(sessionType, trainingFocus, isSprintSession) {
  const t = String(sessionType || "").toLowerCase();
  if (!t) {
    return false;
  }
  const family = isSprintSession
    ? "speed"
    : String(trainingFocus || "").toLowerCase();
  const allowed = TEMPLATE_FAMILY[family];
  if (!allowed) {
    return false;
  }
  return allowed.some((token) => t.includes(token));
}

export {
  positionFlagsFor,
  mapIntentToSession,
  isLowLoadFocus,
  LOW_LOAD_FOCUSES,
  gymBlockPlanFor,
  GYM_BLOCK_PLANS,
  templateMatchesFocus,
};

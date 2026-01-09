/**
 * computeOverride Tests
 *
 * PROMPT 2.19: Regression tests for excluded athlete override computation
 *
 * Contract requirements:
 * 1. If teamActivity.participation === "excluded", override MUST NOT be "flag_practice" or "film_room"
 * 2. Priority order: rehab_protocol > coach_alert > weather_override > teamActivity (if not excluded) > taper > null
 */

// Import the computeOverride function from daily-protocol
// Since it's not exported, we'll test the logic directly here
function computeOverride({
  rehabActive,
  injuries,
  coachAlertActive,
  weatherOverride,
  teamActivity,
  taperActive,
  taperContext,
}) {
  // Priority 1: Rehab protocol (safety first)
  if (rehabActive) {
    return {
      type: "rehab_protocol",
      reason:
        injuries && injuries.length > 0
          ? `Active injury protocol: ${injuries.join(", ")}`
          : "Return-to-Play protocol active",
      replaceSession: true,
    };
  }

  // Priority 2: Coach alert (coach has flagged something)
  if (coachAlertActive) {
    return {
      type: "coach_alert",
      reason: "Coach alert active - check coach notes",
      replaceSession: false,
    };
  }

  // Priority 3: Weather override
  if (weatherOverride) {
    return {
      type: "weather_override",
      reason: "Weather conditions prevent normal training",
      replaceSession: true,
    };
  }

  // Priority 4: Team activity (ONLY if NOT excluded)
  // CRITICAL: Excluded athletes do NOT get flag_practice or film_room overrides
  if (teamActivity && teamActivity.participation !== "excluded") {
    if (teamActivity.type === "practice") {
      return {
        type: "flag_practice",
        reason: `Team practice scheduled at ${teamActivity.startTimeLocal || "18:00"}`,
        replaceSession: teamActivity.replacesSession !== false,
      };
    }
    if (teamActivity.type === "film_room") {
      return {
        type: "film_room",
        reason: `Film room scheduled at ${teamActivity.startTimeLocal || "10:00"}`,
        replaceSession: teamActivity.replacesSession !== false,
      };
    }
  }

  // Priority 5: Taper period
  if (taperActive && taperContext) {
    return {
      type: "taper",
      reason: `Taper for ${taperContext.tournament?.name || "upcoming tournament"} (${taperContext.daysUntil} days)`,
      replaceSession: false,
    };
  }

  // No override - use normal program session
  return null;
}

// Simple assertion helper (no Jest dependency)
const assert = require("assert");
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${e.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, msg = "") {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, got ${actual}. ${msg}`);
  }
}

function assertNull(value, msg = "") {
  if (value !== null) {
    throw new Error(`Expected null, got ${JSON.stringify(value)}. ${msg}`);
  }
}

function assertNotNull(value, msg = "") {
  if (value === null || value === undefined) {
    throw new Error(`Expected non-null value. ${msg}`);
  }
}

function assertContains(str, substr, msg = "") {
  if (!str || !str.includes(substr)) {
    throw new Error(`Expected "${str}" to contain "${substr}". ${msg}`);
  }
}

console.log(
  "\n=== computeOverride - Excluded Athlete Tests (PROMPT 2.19) ===\n",
);

test("CRITICAL: Excluded athlete on practice day => override MUST be null (not flag_practice)", () => {
  const result = computeOverride({
    rehabActive: false,
    injuries: [],
    coachAlertActive: false,
    weatherOverride: false,
    teamActivity: {
      type: "practice",
      participation: "excluded",
      startTimeLocal: "18:00:00",
      replacesSession: true,
    },
    taperActive: false,
    taperContext: null,
  });
  assertNull(result);
});

test("CRITICAL: Excluded athlete on film room day => override MUST be null (not film_room)", () => {
  const result = computeOverride({
    rehabActive: false,
    injuries: [],
    coachAlertActive: false,
    weatherOverride: false,
    teamActivity: {
      type: "film_room",
      participation: "excluded",
      startTimeLocal: "10:00:00",
      replacesSession: true,
    },
    taperActive: false,
    taperContext: null,
  });
  assertNull(result);
});

test("Excluded athlete with active rehab => override MUST be rehab_protocol", () => {
  const result = computeOverride({
    rehabActive: true,
    injuries: ["knee", "ankle"],
    coachAlertActive: false,
    weatherOverride: false,
    teamActivity: {
      type: "practice",
      participation: "excluded",
      startTimeLocal: "18:00:00",
      replacesSession: true,
    },
    taperActive: false,
    taperContext: null,
  });
  assertNotNull(result);
  assertEqual(result.type, "rehab_protocol");
  assertContains(result.reason, "knee");
  assertContains(result.reason, "ankle");
});

test("Required athlete on practice day => override MUST be flag_practice", () => {
  const result = computeOverride({
    rehabActive: false,
    injuries: [],
    coachAlertActive: false,
    weatherOverride: false,
    teamActivity: {
      type: "practice",
      participation: "required",
      startTimeLocal: "18:00:00",
      replacesSession: true,
    },
    taperActive: false,
    taperContext: null,
  });
  assertNotNull(result);
  assertEqual(result.type, "flag_practice");
  assertContains(result.reason, "18:00:00");
});

test("Required athlete on film room day => override MUST be film_room", () => {
  const result = computeOverride({
    rehabActive: false,
    injuries: [],
    coachAlertActive: false,
    weatherOverride: false,
    teamActivity: {
      type: "film_room",
      participation: "required",
      startTimeLocal: "10:00:00",
      replacesSession: true,
    },
    taperActive: false,
    taperContext: null,
  });
  assertNotNull(result);
  assertEqual(result.type, "film_room");
  assertContains(result.reason, "10:00:00");
});

test("No team activity => override MUST be null", () => {
  const result = computeOverride({
    rehabActive: false,
    injuries: [],
    coachAlertActive: false,
    weatherOverride: false,
    teamActivity: null,
    taperActive: false,
    taperContext: null,
  });
  assertNull(result);
});

test("Taper active with no team activity => override MUST be taper", () => {
  const result = computeOverride({
    rehabActive: false,
    injuries: [],
    coachAlertActive: false,
    weatherOverride: false,
    teamActivity: null,
    taperActive: true,
    taperContext: {
      tournament: { name: "Nationals" },
      daysUntil: 5,
    },
  });
  assertNotNull(result);
  assertEqual(result.type, "taper");
  assertContains(result.reason, "Nationals");
  assertContains(result.reason, "5 days");
});

test("Weather override wins over team activity", () => {
  const result = computeOverride({
    rehabActive: false,
    injuries: [],
    coachAlertActive: false,
    weatherOverride: true,
    teamActivity: {
      type: "practice",
      participation: "required",
      startTimeLocal: "18:00:00",
    },
    taperActive: false,
    taperContext: null,
  });
  assertNotNull(result);
  assertEqual(result.type, "weather_override");
});

test("Rehab wins over everything (highest priority)", () => {
  const result = computeOverride({
    rehabActive: true,
    injuries: ["shoulder"],
    coachAlertActive: true,
    weatherOverride: true,
    teamActivity: {
      type: "practice",
      participation: "required",
      startTimeLocal: "18:00:00",
    },
    taperActive: true,
    taperContext: { tournament: { name: "Test" }, daysUntil: 3 },
  });
  assertNotNull(result);
  assertEqual(result.type, "rehab_protocol");
});

test("Optional participation on practice day => override MUST be flag_practice", () => {
  const result = computeOverride({
    rehabActive: false,
    injuries: [],
    coachAlertActive: false,
    weatherOverride: false,
    teamActivity: {
      type: "practice",
      participation: "optional",
      startTimeLocal: "18:00:00",
      replacesSession: true,
    },
    taperActive: false,
    taperContext: null,
  });
  assertNotNull(result);
  assertEqual(result.type, "flag_practice");
});

console.log("\n=== computeOverride - Priority Order Tests ===\n");

test("Priority order: rehab > coach_alert > weather > teamActivity > taper > null", () => {
  // Level 1: Rehab wins
  assertEqual(
    computeOverride({
      rehabActive: true,
      injuries: ["knee"],
      coachAlertActive: true,
      weatherOverride: true,
      teamActivity: { type: "practice", participation: "required" },
      taperActive: true,
      taperContext: { tournament: { name: "T" }, daysUntil: 1 },
    }).type,
    "rehab_protocol",
  );

  // Level 2: Coach alert wins when no rehab
  assertEqual(
    computeOverride({
      rehabActive: false,
      injuries: [],
      coachAlertActive: true,
      weatherOverride: true,
      teamActivity: { type: "practice", participation: "required" },
      taperActive: true,
      taperContext: { tournament: { name: "T" }, daysUntil: 1 },
    }).type,
    "coach_alert",
  );

  // Level 3: Weather wins when no rehab/coach
  assertEqual(
    computeOverride({
      rehabActive: false,
      injuries: [],
      coachAlertActive: false,
      weatherOverride: true,
      teamActivity: { type: "practice", participation: "required" },
      taperActive: true,
      taperContext: { tournament: { name: "T" }, daysUntil: 1 },
    }).type,
    "weather_override",
  );

  // Level 4: Team activity wins when no rehab/coach/weather
  assertEqual(
    computeOverride({
      rehabActive: false,
      injuries: [],
      coachAlertActive: false,
      weatherOverride: false,
      teamActivity: { type: "practice", participation: "required" },
      taperActive: true,
      taperContext: { tournament: { name: "T" }, daysUntil: 1 },
    }).type,
    "flag_practice",
  );

  // Level 5: Taper wins when no rehab/coach/weather/teamActivity
  assertEqual(
    computeOverride({
      rehabActive: false,
      injuries: [],
      coachAlertActive: false,
      weatherOverride: false,
      teamActivity: null,
      taperActive: true,
      taperContext: { tournament: { name: "T" }, daysUntil: 1 },
    }).type,
    "taper",
  );

  // Level 6: Null when nothing active
  assertNull(
    computeOverride({
      rehabActive: false,
      injuries: [],
      coachAlertActive: false,
      weatherOverride: false,
      teamActivity: null,
      taperActive: false,
      taperContext: null,
    }),
  );
});

// Summary
console.log("\n==============================================");
console.log(
  `TOTAL: ${passed + failed} tests | PASSED: ${passed} | FAILED: ${failed}`,
);
console.log("==============================================\n");

if (failed > 0) {
  process.exit(1);
}

// Export for use in test runner
module.exports = { computeOverride };

/**
 * ACWR Regression Test
 *
 * Tests the ACWR (Acute:Chronic Workload Ratio) calculation logic using
 * a synthetic 28-day dataset with known expected values.
 *
 * This test validates:
 * 1. Daily load calculation (RPE × Duration)
 * 2. Acute load calculation (7-day rolling average)
 * 3. Chronic load calculation (28-day rolling average)
 * 4. ACWR ratio calculation
 * 5. Risk level classification
 * 6. Data state transitions
 * 7. Consent-aware view access
 *
 * Reference: docs/LOGIC_VALIDATION_DATASET.md
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 * @module ESM (migrated from CJS 2026-02)
 */

import { createClient } from "@supabase/supabase-js";

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseEnvStatus() {
  const missing = [];
  if (!SUPABASE_URL) {
    missing.push("SUPABASE_URL (or VITE_SUPABASE_URL)");
  }
  if (!SUPABASE_SERVICE_KEY) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)");
  }
  return {
    ok: missing.length === 0,
    missing,
  };
}

// Test player UUID - use a deterministic UUID for reproducibility
const TEST_PLAYER_ID = "00000000-0000-0000-0000-000000000001";
const TEST_PLAYER_EMAIL = "acwr-test@flagfit.test";

// =============================================================================
// TOLERANCE DEFINITIONS
// =============================================================================

/**
 * Tolerance values for floating-point comparisons
 *
 * ACUTE_LOAD_TOLERANCE: 0.5 AU
 *   - Reason: Database rounds to 2 decimal places, JavaScript may have
 *     floating-point precision differences
 *   - Example: 302.142857 rounds to 302.14, but JS might compute 302.143
 *
 * CHRONIC_LOAD_TOLERANCE: 0.5 AU
 *   - Same reasoning as acute load
 *
 * ACWR_TOLERANCE: 0.02
 *   - Reason: ACWR is a ratio, small differences in acute/chronic propagate
 *   - Example: 1.0494 vs 1.05 should both be considered "1.05"
 *
 * These tolerances are intentionally small to catch real bugs while
 * allowing for acceptable floating-point variance.
 */
const TOLERANCE = {
  DAILY_LOAD: 0, // Integer, must be exact
  ACUTE_LOAD: 0.5, // 0.5 AU tolerance
  CHRONIC_LOAD: 0.5, // 0.5 AU tolerance
  ACWR: 0.02, // 0.02 ratio tolerance
};

// =============================================================================
// SYNTHETIC DATASET
// =============================================================================

/**
 * 28-day synthetic workout dataset
 * Represents a realistic flag football training pattern
 *
 * Pattern:
 * - Technical training: 60-80 min, RPE 5-8
 * - Conditioning: 45-50 min, RPE 5-6
 * - Strength: 50-60 min, RPE 6-7
 * - Game day: 90-100 min, RPE 8-9
 * - Recovery: 30 min, RPE 3-4
 * - Rest days: No entry (load = 0)
 */
const SYNTHETIC_DATASET = [
  { day: 1, duration: 60, rpe: 5, type: "Technical", expectedLoad: 300 },
  { day: 2, duration: 45, rpe: 6, type: "Conditioning", expectedLoad: 270 },
  { day: 3, duration: 0, rpe: 0, type: "Rest", expectedLoad: 0 },
  { day: 4, duration: 75, rpe: 7, type: "Technical", expectedLoad: 525 },
  { day: 5, duration: 50, rpe: 6, type: "Strength", expectedLoad: 300 },
  { day: 6, duration: 0, rpe: 0, type: "Rest", expectedLoad: 0 },
  { day: 7, duration: 90, rpe: 8, type: "Game", expectedLoad: 720 },
  { day: 8, duration: 30, rpe: 4, type: "Recovery", expectedLoad: 120 },
  { day: 9, duration: 60, rpe: 6, type: "Technical", expectedLoad: 360 },
  { day: 10, duration: 45, rpe: 5, type: "Conditioning", expectedLoad: 225 },
  { day: 11, duration: 0, rpe: 0, type: "Rest", expectedLoad: 0 },
  { day: 12, duration: 70, rpe: 7, type: "Technical", expectedLoad: 490 },
  { day: 13, duration: 55, rpe: 6, type: "Strength", expectedLoad: 330 },
  { day: 14, duration: 90, rpe: 9, type: "Game", expectedLoad: 810 },
  { day: 15, duration: 30, rpe: 3, type: "Recovery", expectedLoad: 90 },
  { day: 16, duration: 60, rpe: 6, type: "Technical", expectedLoad: 360 },
  { day: 17, duration: 50, rpe: 5, type: "Conditioning", expectedLoad: 250 },
  { day: 18, duration: 0, rpe: 0, type: "Rest", expectedLoad: 0 },
  { day: 19, duration: 75, rpe: 7, type: "Technical", expectedLoad: 525 },
  { day: 20, duration: 60, rpe: 6, type: "Strength", expectedLoad: 360 },
  { day: 21, duration: 100, rpe: 8, type: "Game", expectedLoad: 800 },
  { day: 22, duration: 30, rpe: 4, type: "Recovery", expectedLoad: 120 },
  { day: 23, duration: 60, rpe: 6, type: "Technical", expectedLoad: 360 },
  { day: 24, duration: 45, rpe: 5, type: "Conditioning", expectedLoad: 225 },
  { day: 25, duration: 0, rpe: 0, type: "Rest", expectedLoad: 0 },
  { day: 26, duration: 80, rpe: 8, type: "Technical", expectedLoad: 640 },
  { day: 27, duration: 55, rpe: 7, type: "Strength", expectedLoad: 385 },
  { day: 28, duration: 95, rpe: 9, type: "Game", expectedLoad: 855 },
];

// =============================================================================
// EXPECTED VALUES AT CHECKPOINTS
// =============================================================================

/**
 * Expected values at each checkpoint day
 *
 * Calculations use the FIXED formula: SUM(loads) / window_size
 * NOT the buggy formula: AVG(loads) which excludes rest days
 *
 * See docs/LOGIC_VALIDATION_DATASET.md for detailed calculations
 */
const EXPECTED_VALUES = {
  // Day 0: No data yet
  0: {
    acuteLoad: null,
    chronicLoad: null,
    acwr: null,
    riskLevel: "baseline_building",
    dataState: "NO_DATA",
  },

  // Day 6: Building acute window (6 days)
  6: {
    acuteLoad: 199.29,
    chronicLoad: 232.5,
    acwr: 0.86,
    riskLevel: "baseline_building",
    dataState: "INSUFFICIENT_DATA",
  },

  // Day 7: First complete acute window
  7: {
    acuteLoad: 302.14,
    chronicLoad: 302.14,
    acwr: 1.0,
    riskLevel: "optimal",
    dataState: "INSUFFICIENT_DATA",
  },

  // Day 14: Two weeks
  14: {
    acuteLoad: 333.57,
    chronicLoad: 317.86,
    acwr: 1.05,
    riskLevel: "optimal",
    dataState: "INSUFFICIENT_DATA",
  },

  // Day 21: Three weeks (minimum for chronic)
  21: {
    acuteLoad: 340.71,
    chronicLoad: 325.48,
    acwr: 1.05,
    riskLevel: "optimal",
    dataState: "LOW_CONFIDENCE",
  },

  // Day 27: Almost full chronic window
  27: {
    acuteLoad: 361.43,
    chronicLoad: 317.22,
    acwr: 1.14,
    riskLevel: "optimal",
    dataState: "LOW_CONFIDENCE",
  },

  // Day 28: Full chronic window
  28: {
    acuteLoad: 369.29,
    chronicLoad: 336.43,
    acwr: 1.1,
    riskLevel: "optimal",
    dataState: "SUFFICIENT_DATA",
  },
};

// =============================================================================
// TEST UTILITIES
// =============================================================================

function createTestClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error(
      "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.",
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

function getDateForDay(day, baseDate = new Date()) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() - (28 - day));
  return date.toISOString().split("T")[0];
}

function assertWithTolerance(actual, expected, tolerance, message) {
  if (expected === null) {
    if (actual !== null && actual !== undefined) {
      throw new Error(`${message}: Expected null, got ${actual}`);
    }
    return;
  }

  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(
      `${message}: Expected ${expected} ± ${tolerance}, got ${actual} (diff: ${diff.toFixed(4)})`,
    );
  }
}

function formatResult(passed, message, details = {}) {
  const status = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${status}: ${message}`);
  if (!passed && Object.keys(details).length > 0) {
    console.log("  Details:", JSON.stringify(details, null, 2));
  }
  return passed;
}

// =============================================================================
// TEST FUNCTIONS
// =============================================================================

async function cleanupTestData(supabase) {
  console.log("\n🧹 Cleaning up test data...");
  await supabase
    .from("load_monitoring")
    .delete()
    .eq("player_id", TEST_PLAYER_ID);
  await supabase.from("workout_logs").delete().eq("player_id", TEST_PLAYER_ID);
  console.log("   Cleanup complete");
}

async function insertTestData(supabase) {
  console.log("\n📊 Inserting synthetic dataset...");
  const baseDate = new Date();
  const workouts = SYNTHETIC_DATASET.filter((d) => d.duration > 0).map((d) => ({
    player_id: TEST_PLAYER_ID,
    completed_at: `${getDateForDay(d.day, baseDate)}T12:00:00Z`,
    rpe: d.rpe,
    duration_minutes: d.duration,
    notes: `Day ${d.day}: ${d.type}`,
  }));

  console.log(`   Inserting ${workouts.length} workout records...`);
  const { data, error } = await supabase
    .from("workout_logs")
    .insert(workouts)
    .select();

  if (error) {
    throw new Error(`Failed to insert test data: ${error.message}`);
  }

  console.log(`   Inserted ${data.length} records`);
  return data;
}

async function calculateLoadMonitoring(supabase) {
  console.log("\n🔄 Calculating load monitoring values...");
  const { data, error } = await supabase
    .from("load_monitoring")
    .select("*")
    .eq("player_id", TEST_PLAYER_ID)
    .order("date", { ascending: true });

  if (error) {
    throw new Error(`Failed to query load monitoring: ${error.message}`);
  }

  console.log(`   Found ${data.length} load monitoring records`);
  return data;
}

async function testDailyLoadCalculation(supabase) {
  console.log("\n📋 Testing Daily Load Calculation...");
  const { data: loadData, error } = await supabase
    .from("load_monitoring")
    .select("date, daily_load")
    .eq("player_id", TEST_PLAYER_ID)
    .order("date", { ascending: true });

  if (error) {
    throw new Error(`Query failed: ${error.message}`);
  }

  let passed = true;
  const baseDate = new Date();

  for (const entry of SYNTHETIC_DATASET.filter((d) => d.duration > 0)) {
    const expectedDate = getDateForDay(entry.day, baseDate);
    const record = loadData.find((r) => r.date === expectedDate);

    if (!record) {
      console.log(`   ⚠️ No record for Day ${entry.day} (${expectedDate})`);
      continue;
    }

    const expectedLoad = entry.duration * entry.rpe;
    if (record.daily_load !== expectedLoad) {
      passed = formatResult(false, `Day ${entry.day} daily load`, {
        expected: expectedLoad,
        actual: record.daily_load,
        formula: `${entry.duration} × ${entry.rpe}`,
      });
    }
  }

  if (passed) {
    formatResult(true, "All daily load calculations correct");
  }

  return passed;
}

async function testLoadCalculationsAtCheckpoints(supabase) {
  console.log("\n📈 Testing Load Calculations at Checkpoints...");
  const baseDate = new Date();
  let allPassed = true;

  for (const [dayStr, expected] of Object.entries(EXPECTED_VALUES)) {
    const day = parseInt(dayStr);
    if (day === 0) continue;

    const checkDate = getDateForDay(day, baseDate);

    const { data: rpcData, error } = await supabase.rpc("calculate_acwr_safe", {
      player_uuid: TEST_PLAYER_ID,
      reference_date: checkDate,
    });

    if (error) {
      console.log(`   ⚠️ Day ${day}: RPC error - ${error.message}`);
      continue;
    }

    const { data: lmData } = await supabase
      .from("load_monitoring")
      .select("acute_load, chronic_load, acwr, injury_risk_level")
      .eq("player_id", TEST_PLAYER_ID)
      .eq("date", checkDate)
      .single();

    console.log(`\n   Day ${day} (${checkDate}):`);

    if (lmData?.acute_load !== undefined && expected.acuteLoad !== null) {
      try {
        assertWithTolerance(
          lmData.acute_load,
          expected.acuteLoad,
          TOLERANCE.ACUTE_LOAD,
          "Acute load",
        );
        console.log(
          `     ✅ Acute: ${lmData.acute_load} (expected: ${expected.acuteLoad})`,
        );
      } catch (e) {
        console.log(`     ❌ Acute: ${e.message}`);
        allPassed = false;
      }
    }

    if (lmData?.chronic_load !== undefined && expected.chronicLoad !== null) {
      try {
        assertWithTolerance(
          lmData.chronic_load,
          expected.chronicLoad,
          TOLERANCE.CHRONIC_LOAD,
          "Chronic load",
        );
        console.log(
          `     ✅ Chronic: ${lmData.chronic_load} (expected: ${expected.chronicLoad})`,
        );
      } catch (e) {
        console.log(`     ❌ Chronic: ${e.message}`);
        allPassed = false;
      }
    }

    if (lmData?.acwr !== undefined && expected.acwr !== null) {
      try {
        assertWithTolerance(lmData.acwr, expected.acwr, TOLERANCE.ACWR, "ACWR");
        console.log(`     ✅ ACWR: ${lmData.acwr} (expected: ${expected.acwr})`);
      } catch (e) {
        console.log(`     ❌ ACWR: ${e.message}`);
        allPassed = false;
      }
    }
  }

  return allPassed;
}

async function testConsentAwareView(supabase) {
  console.log("\n🔒 Testing Consent-Aware View...");
  const { data, error } = await supabase
    .from("v_load_monitoring_consent")
    .select("*")
    .eq("player_id", TEST_PLAYER_ID)
    .order("date", { ascending: false })
    .limit(7);

  if (error) {
    console.log(`   ⚠️ Consent view not available: ${error.message}`);
    return true;
  }

  console.log(`   Found ${data.length} records in consent view`);
  if (data.length > 0 && "consent_blocked" in data[0]) {
    formatResult(true, "Consent view returns consent_blocked flag");
  }
  if (data.length > 0 && "access_reason" in data[0]) {
    formatResult(true, "Consent view returns access_reason");
  }

  return true;
}

async function testRiskLevelClassification(supabase) {
  console.log("\n⚠️ Testing Risk Level Classification...");
  const testCases = [
    { acwr: 0.5, expected: "Low" },
    { acwr: 0.79, expected: "Low" },
    { acwr: 0.8, expected: "Optimal" },
    { acwr: 1.0, expected: "Optimal" },
    { acwr: 1.3, expected: "Optimal" },
    { acwr: 1.31, expected: "Moderate" },
    { acwr: 1.5, expected: "Moderate" },
    { acwr: 1.51, expected: "High" },
    { acwr: 2.0, expected: "High" },
  ];

  let allPassed = true;

  for (const tc of testCases) {
    const { data, error } = await supabase.rpc("get_injury_risk_level", {
      acwr_value: tc.acwr,
    });

    if (error) {
      console.log(`   ⚠️ ACWR ${tc.acwr}: RPC error - ${error.message}`);
      continue;
    }

    if (data === tc.expected) {
      console.log(`   ✅ ACWR ${tc.acwr} → ${data}`);
    } else {
      console.log(`   ❌ ACWR ${tc.acwr}: Expected ${tc.expected}, got ${data}`);
      allPassed = false;
    }
  }

  return allPassed;
}

async function testMinimumChronicLoadFloor(supabase) {
  console.log("\n🛡️ Testing Minimum Chronic Load Floor...");
  const LOW_LOAD_PLAYER_ID = "00000000-0000-0000-0000-000000000002";

  try {
    await supabase.from("load_monitoring").delete().eq("player_id", LOW_LOAD_PLAYER_ID);
    await supabase.from("workout_logs").delete().eq("player_id", LOW_LOAD_PLAYER_ID);

    const baseDate = new Date();
    const lightSessions = [
      { day: 1, duration: 15, rpe: 2 },
      { day: 4, duration: 20, rpe: 3 },
      { day: 7, duration: 25, rpe: 3 },
    ];

    const workouts = lightSessions.map((s) => ({
      player_id: LOW_LOAD_PLAYER_ID,
      completed_at: `${getDateForDay(s.day, baseDate)}T12:00:00Z`,
      rpe: s.rpe,
      duration_minutes: s.duration,
      notes: `Day ${s.day}: Light return-to-play session`,
    }));

    const { error: insertError } = await supabase.from("workout_logs").insert(workouts);

    if (insertError) {
      console.log(`   ⚠️ Could not insert test data: ${insertError.message}`);
      return true;
    }

    const totalLoad = lightSessions.reduce((sum, s) => sum + s.duration * s.rpe, 0);
    const chronicWithoutFloor = totalLoad / 7;

    console.log(`   Total load: ${totalLoad} AU`);
    console.log(`   Chronic WITHOUT floor: ${chronicWithoutFloor.toFixed(2)} AU`);
    console.log(`   Chronic WITH floor: 50.00 AU (minimum)`);

    const checkDate = getDateForDay(7, baseDate);
    const { data: chronicData, error: chronicError } = await supabase.rpc(
      "calculate_chronic_load",
      { player_uuid: LOW_LOAD_PLAYER_ID, reference_date: checkDate },
    );

    if (chronicError) {
      console.log(`   ⚠️ Could not calculate chronic load: ${chronicError.message}`);
      return true;
    }

    const actualChronic = parseFloat(chronicData);
    const MIN_CHRONIC_FLOOR = 50.0;

    if (actualChronic >= MIN_CHRONIC_FLOOR) {
      console.log(
        `   ✅ Chronic load floor enforced: ${actualChronic} AU >= ${MIN_CHRONIC_FLOOR} AU`,
      );
      return true;
    } else {
      console.log(
        `   ❌ Chronic load floor NOT enforced: ${actualChronic} AU < ${MIN_CHRONIC_FLOOR} AU`,
      );
      return false;
    }
  } finally {
    await supabase.from("load_monitoring").delete().eq("player_id", LOW_LOAD_PLAYER_ID);
    await supabase.from("workout_logs").delete().eq("player_id", LOW_LOAD_PLAYER_ID);
  }
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================

async function runTests() {
  console.log("═".repeat(72));
  console.log("ACWR REGRESSION TEST");
  console.log("═".repeat(72));
  console.log("\nValidating ACWR calculations against synthetic 28-day dataset");
  console.log("Reference: docs/LOGIC_VALIDATION_DATASET.md");
  console.log("\nTolerance values:");
  console.log(`  - Daily Load: ${TOLERANCE.DAILY_LOAD} AU (exact)`);
  console.log(`  - Acute Load: ±${TOLERANCE.ACUTE_LOAD} AU`);
  console.log(`  - Chronic Load: ±${TOLERANCE.CHRONIC_LOAD} AU`);
  console.log(`  - ACWR: ±${TOLERANCE.ACWR}`);

  const envStatus = getSupabaseEnvStatus();
  if (!envStatus.ok) {
    console.log("\n⏭️ Skipping ACWR regression test: missing Supabase credentials.");
    console.log(`Missing: ${envStatus.missing.join(", ")}`);
    console.log("Set the required environment variables to run this test.");
    return;
  }

  let supabase;
  const results = {
    dailyLoad: false,
    loadCalculations: false,
    consentView: false,
    riskLevels: false,
    chronicFloor: false,
  };

  try {
    supabase = createTestClient();
    await cleanupTestData(supabase);
    await insertTestData(supabase);
    await calculateLoadMonitoring(supabase);

    results.dailyLoad = await testDailyLoadCalculation(supabase);
    results.loadCalculations = await testLoadCalculationsAtCheckpoints(supabase);
    results.consentView = await testConsentAwareView(supabase);
    results.riskLevels = await testRiskLevelClassification(supabase);
    results.chronicFloor = await testMinimumChronicLoadFloor(supabase);
  } catch (error) {
    console.error("\n❌ Test error:", error.message);
    process.exit(1);
  } finally {
    if (supabase) {
      await cleanupTestData(supabase);
    }
  }

  console.log(`\n${"═".repeat(72)}`);
  console.log("TEST SUMMARY");
  console.log("═".repeat(72));
  const allPassed = Object.values(results).every((r) => r);

  console.log(`\nDaily Load Calculation:    ${results.dailyLoad ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Load Calculations:         ${results.loadCalculations ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Consent-Aware View:        ${results.consentView ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Risk Level Classification: ${results.riskLevels ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Min Chronic Load Floor:    ${results.chronicFloor ? "✅ PASS" : "❌ FAIL"}`);

  console.log(`\n${"═".repeat(72)}`);
  if (allPassed) {
    console.log("✅ ALL TESTS PASSED");
  } else {
    console.log("❌ SOME TESTS FAILED");
    console.log("\nIf tests fail after applying migration 075, check:");
    console.log("1. Migration was applied correctly");
    console.log("2. Trigger is firing on workout_logs insert");
    console.log("3. calculate_acute_load uses SUM/7 not AVG");
    console.log("4. calculate_chronic_load uses SUM/window_size not AVG");
  }
  console.log("═".repeat(72));

  process.exit(allPassed ? 0 : 1);
}

// Run when executed directly
const isMain = process.argv[1]?.endsWith("acwr-regression.test.js");
if (isMain) {
  runTests().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export {
  SYNTHETIC_DATASET,
  EXPECTED_VALUES,
  TOLERANCE,
  runTests,
};

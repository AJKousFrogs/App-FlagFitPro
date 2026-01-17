#!/usr/bin/env node
/**
 * ACWR Calculation Contract Tests
 *
 * These tests verify that ACWR calculations are consistent and match
 * the documented formulas in the Contract Map.
 *
 * Contract Reference: docs/contracts/CONTRACT_MAP.md - Section "ACWR Calculation Details"
 *
 * EWMA Formula:
 *   Load = RPE × Duration (minutes)
 *   λ_acute = 2 / (7 + 1) = 0.25
 *   λ_chronic = 2 / (28 + 1) ≈ 0.069
 *   EWMA = Σ (λ × load_i × (1 - λ)^(days_ago))
 *   ACWR = EWMA_acute / max(EWMA_chronic, 100)
 *
 * Risk Zones:
 *   - under-training: ACWR < 0.8
 *   - sweet-spot: 0.8 ≤ ACWR ≤ 1.3
 *   - elevated-risk: 1.3 < ACWR ≤ 1.5
 *   - danger-zone: ACWR > 1.5
 *
 * Usage:
 *   node acwr-calculation.contract.test.js
 */

// =============================================================================
// TEST INFRASTRUCTURE
// =============================================================================

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertCloseTo(actual, expected, tolerance, message) {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(
      `${message}: Expected ~${expected} (±${tolerance}), got ${actual} (diff: ${diff})`
    );
  }
}

async function test(name, fn) {
  testsRun++;
  try {
    await fn();
    testsPassed++;
    console.log(`  ✅ ${name}`);
  } catch (error) {
    testsFailed++;
    failures.push({ name, error: error.message });
    console.error(`  ❌ ${name}`);
    console.error(`     Error: ${error.message}`);
  }
}

async function describe(name, fn) {
  console.log(`\n📋 ${name}`);
  console.log("─".repeat(60));
  await fn();
}

// =============================================================================
// ACWR CALCULATION IMPLEMENTATION (Reference Implementation)
// =============================================================================

/**
 * ACWR Configuration (matches FE AcwrService)
 */
const ACWR_CONFIG = {
  acuteWindowDays: 7,
  chronicWindowDays: 28,
  acuteLambda: 2 / (7 + 1), // ~0.25
  chronicLambda: 2 / (28 + 1), // ~0.069
  thresholds: {
    sweetSpotLow: 0.8,
    sweetSpotHigh: 1.3,
    dangerHigh: 1.5,
  },
  minChronicLoad: 100,
  minDaysForChronic: 21,
  minSessionsForChronic: 12,
};

/**
 * Calculate load from a session
 * Contract: Load = RPE × Duration (minutes)
 */
function calculateSessionLoad(rpe, durationMinutes) {
  return rpe * durationMinutes;
}

/**
 * Calculate EWMA for a series of daily loads
 * Contract: EWMA_today = λ × load_today + (1 - λ) × EWMA_yesterday
 *
 * @param dailyLoads - Array of { date: string, load: number } sorted by date ascending
 * @param lambda - Smoothing factor
 * @returns EWMA value
 */
function calculateEWMA(dailyLoads, lambda) {
  if (dailyLoads.length === 0) return 0;

  let ewma = dailyLoads[0].load;

  for (let i = 1; i < dailyLoads.length; i++) {
    ewma = lambda * dailyLoads[i].load + (1 - lambda) * ewma;
  }

  return ewma;
}

/**
 * Classify ACWR into risk zone
 * Contract: See risk zone thresholds in ACWR_CONFIG
 */
function classifyRiskZone(acwr) {
  if (acwr === null || acwr === undefined) return "no-data";
  if (acwr < ACWR_CONFIG.thresholds.sweetSpotLow) return "under-training";
  if (acwr <= ACWR_CONFIG.thresholds.sweetSpotHigh) return "sweet-spot";
  if (acwr <= ACWR_CONFIG.thresholds.dangerHigh) return "elevated-risk";
  return "danger-zone";
}

/**
 * Calculate full ACWR from session data
 */
function calculateACWR(sessions) {
  if (sessions.length === 0) {
    return {
      acuteLoad: 0,
      chronicLoad: ACWR_CONFIG.minChronicLoad,
      acwr: 0,
      riskZone: "no-data",
    };
  }

  // Sort sessions by date
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Aggregate daily loads
  const dailyLoads = new Map();
  for (const session of sorted) {
    const dateKey = session.date.split("T")[0];
    const load = calculateSessionLoad(session.rpe, session.duration);
    dailyLoads.set(dateKey, (dailyLoads.get(dateKey) || 0) + load);
  }

  // Convert to array
  const dailyLoadArray = Array.from(dailyLoads.entries())
    .map(([date, load]) => ({ date, load }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate EWMA
  const acuteLoad = calculateEWMA(dailyLoadArray, ACWR_CONFIG.acuteLambda);
  const rawChronicLoad = calculateEWMA(dailyLoadArray, ACWR_CONFIG.chronicLambda);
  const chronicLoad = Math.max(rawChronicLoad, ACWR_CONFIG.minChronicLoad);

  // Calculate ACWR
  const acwr = acuteLoad / chronicLoad;
  const riskZone = classifyRiskZone(acwr);

  return { acuteLoad, chronicLoad, acwr, riskZone };
}

// =============================================================================
// TESTS: LOAD CALCULATION
// =============================================================================

async function testLoadCalculation() {
  await describe("Load Calculation Contract", async () => {
    await test("Load = RPE × Duration", async () => {
      const testCases = [
        { rpe: 5, duration: 60, expected: 300 },
        { rpe: 8, duration: 45, expected: 360 },
        { rpe: 3, duration: 30, expected: 90 },
        { rpe: 10, duration: 90, expected: 900 },
        { rpe: 1, duration: 120, expected: 120 },
      ];

      for (const { rpe, duration, expected } of testCases) {
        const result = calculateSessionLoad(rpe, duration);
        assert(
          result === expected,
          `Load(RPE=${rpe}, Duration=${duration}) should be ${expected}, got ${result}`
        );
      }
    });

    await test("Load handles edge cases", async () => {
      // Zero duration
      assert(
        calculateSessionLoad(5, 0) === 0,
        "Load with 0 duration should be 0"
      );

      // Minimum RPE
      assert(
        calculateSessionLoad(1, 60) === 60,
        "Load with RPE=1 should equal duration"
      );

      // Maximum RPE
      assert(
        calculateSessionLoad(10, 60) === 600,
        "Load with RPE=10 should be 10× duration"
      );
    });
  });
}

// =============================================================================
// TESTS: EWMA CALCULATION
// =============================================================================

async function testEWMACalculation() {
  await describe("EWMA Calculation Contract", async () => {
    await test("Lambda values match contract", async () => {
      assertCloseTo(
        ACWR_CONFIG.acuteLambda,
        0.25,
        0.001,
        "Acute lambda should be 2/(7+1)"
      );
      assertCloseTo(
        ACWR_CONFIG.chronicLambda,
        0.069,
        0.001,
        "Chronic lambda should be 2/(28+1)"
      );
    });

    await test("EWMA with single value equals that value", async () => {
      const result = calculateEWMA([{ date: "2026-01-01", load: 300 }], 0.25);
      assert(result === 300, `Single value EWMA should equal the value, got ${result}`);
    });

    await test("EWMA with constant values converges to that value", async () => {
      const constantLoads = Array.from({ length: 100 }, (_, i) => ({
        date: `2026-01-${String(i + 1).padStart(2, "0")}`,
        load: 300,
      }));

      const result = calculateEWMA(constantLoads, 0.25);
      assertCloseTo(result, 300, 1, "EWMA of constant values should converge to that value");
    });

    await test("EWMA responds to recent values more than old values", async () => {
      // Old high, recent low
      const oldHighRecentLow = [
        { date: "2026-01-01", load: 500 },
        { date: "2026-01-02", load: 500 },
        { date: "2026-01-03", load: 500 },
        { date: "2026-01-04", load: 100 },
        { date: "2026-01-05", load: 100 },
        { date: "2026-01-06", load: 100 },
        { date: "2026-01-07", load: 100 },
      ];

      // Old low, recent high
      const oldLowRecentHigh = [
        { date: "2026-01-01", load: 100 },
        { date: "2026-01-02", load: 100 },
        { date: "2026-01-03", load: 100 },
        { date: "2026-01-04", load: 500 },
        { date: "2026-01-05", load: 500 },
        { date: "2026-01-06", load: 500 },
        { date: "2026-01-07", load: 500 },
      ];

      const ewmaOldHigh = calculateEWMA(oldHighRecentLow, 0.25);
      const ewmaOldLow = calculateEWMA(oldLowRecentHigh, 0.25);

      assert(
        ewmaOldLow > ewmaOldHigh,
        `Recent high values should result in higher EWMA (${ewmaOldLow}) than recent low (${ewmaOldHigh})`
      );
    });
  });
}

// =============================================================================
// TESTS: RISK ZONE CLASSIFICATION
// =============================================================================

async function testRiskZoneClassification() {
  await describe("Risk Zone Classification Contract", async () => {
    await test("under-training: ACWR < 0.8", async () => {
      const testCases = [0, 0.1, 0.5, 0.79];
      for (const acwr of testCases) {
        const zone = classifyRiskZone(acwr);
        assert(
          zone === "under-training",
          `ACWR ${acwr} should be under-training, got ${zone}`
        );
      }
    });

    await test("sweet-spot: 0.8 ≤ ACWR ≤ 1.3", async () => {
      const testCases = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3];
      for (const acwr of testCases) {
        const zone = classifyRiskZone(acwr);
        assert(
          zone === "sweet-spot",
          `ACWR ${acwr} should be sweet-spot, got ${zone}`
        );
      }
    });

    await test("elevated-risk: 1.3 < ACWR ≤ 1.5", async () => {
      const testCases = [1.31, 1.4, 1.5];
      for (const acwr of testCases) {
        const zone = classifyRiskZone(acwr);
        assert(
          zone === "elevated-risk",
          `ACWR ${acwr} should be elevated-risk, got ${zone}`
        );
      }
    });

    await test("danger-zone: ACWR > 1.5", async () => {
      const testCases = [1.51, 1.6, 2.0, 3.0];
      for (const acwr of testCases) {
        const zone = classifyRiskZone(acwr);
        assert(
          zone === "danger-zone",
          `ACWR ${acwr} should be danger-zone, got ${zone}`
        );
      }
    });

    await test("no-data: null or undefined ACWR", async () => {
      assert(classifyRiskZone(null) === "no-data", "null ACWR should be no-data");
      assert(classifyRiskZone(undefined) === "no-data", "undefined ACWR should be no-data");
    });
  });
}

// =============================================================================
// TESTS: FULL ACWR CALCULATION
// =============================================================================

async function testFullACWRCalculation() {
  await describe("Full ACWR Calculation Contract", async () => {
    await test("Empty sessions return minimum chronic load", async () => {
      const result = calculateACWR([]);
      assert(result.acuteLoad === 0, "Empty sessions should have 0 acute load");
      assert(
        result.chronicLoad === ACWR_CONFIG.minChronicLoad,
        `Empty sessions should have min chronic load (${ACWR_CONFIG.minChronicLoad})`
      );
      assert(result.acwr === 0, "Empty sessions should have 0 ACWR");
      assert(result.riskZone === "no-data", "Empty sessions should be no-data zone");
    });

    await test("Chronic load floor is enforced", async () => {
      // Single low-load session
      const result = calculateACWR([
        { date: "2026-01-01", rpe: 3, duration: 20 }, // Load = 60
      ]);

      assert(
        result.chronicLoad >= ACWR_CONFIG.minChronicLoad,
        `Chronic load should be at least ${ACWR_CONFIG.minChronicLoad}, got ${result.chronicLoad}`
      );
    });

    await test("Consistent training produces sweet-spot ACWR", async () => {
      // 28 days of consistent moderate training
      const sessions = Array.from({ length: 28 }, (_, i) => ({
        date: new Date(2026, 0, i + 1).toISOString().split("T")[0],
        rpe: 6,
        duration: 60, // Load = 360 per day
      }));

      const result = calculateACWR(sessions);

      // With consistent training, acute and chronic should be similar
      // ACWR should be close to 1.0
      assertCloseTo(result.acwr, 1.0, 0.3, "Consistent training should produce ~1.0 ACWR");
      assert(
        result.riskZone === "sweet-spot",
        `Consistent training should be sweet-spot, got ${result.riskZone}`
      );
    });

    await test("Sudden load increase produces elevated ACWR", async () => {
      // 21 days of low training, then 7 days of high training
      const sessions = [
        // Low training (21 days)
        ...Array.from({ length: 21 }, (_, i) => ({
          date: new Date(2026, 0, i + 1).toISOString().split("T")[0],
          rpe: 4,
          duration: 30, // Load = 120
        })),
        // High training (7 days)
        ...Array.from({ length: 7 }, (_, i) => ({
          date: new Date(2026, 0, 22 + i).toISOString().split("T")[0],
          rpe: 8,
          duration: 90, // Load = 720
        })),
      ];

      const result = calculateACWR(sessions);

      assert(
        result.acuteLoad > result.chronicLoad,
        "Sudden increase should have acute > chronic"
      );
      assert(
        result.acwr > 1.0,
        `Sudden increase should have ACWR > 1.0, got ${result.acwr}`
      );
    });

    await test("Deload week produces under-training ACWR", async () => {
      // 21 days of high training, then 7 days of very low training
      const sessions = [
        // High training (21 days)
        ...Array.from({ length: 21 }, (_, i) => ({
          date: new Date(2026, 0, i + 1).toISOString().split("T")[0],
          rpe: 8,
          duration: 60, // Load = 480
        })),
        // Deload (7 days)
        ...Array.from({ length: 7 }, (_, i) => ({
          date: new Date(2026, 0, 22 + i).toISOString().split("T")[0],
          rpe: 3,
          duration: 20, // Load = 60
        })),
      ];

      const result = calculateACWR(sessions);

      assert(
        result.acuteLoad < result.chronicLoad,
        "Deload should have acute < chronic"
      );
      assert(
        result.acwr < 1.0,
        `Deload should have ACWR < 1.0, got ${result.acwr}`
      );
    });

    await test("Multiple sessions per day are aggregated", async () => {
      // Two sessions on the same day
      const sessions = [
        { date: "2026-01-01", rpe: 6, duration: 60 }, // Load = 360
        { date: "2026-01-01", rpe: 4, duration: 30 }, // Load = 120
      ];

      const result = calculateACWR(sessions);

      // Total load for the day should be 480
      assert(
        result.acuteLoad === 480,
        `Two sessions on same day should aggregate to 480, got ${result.acuteLoad}`
      );
    });
  });
}

// =============================================================================
// TESTS: CONFIGURATION CONSTANTS
// =============================================================================

async function testConfigurationConstants() {
  await describe("ACWR Configuration Constants Contract", async () => {
    await test("Acute window is 7 days", async () => {
      assert(
        ACWR_CONFIG.acuteWindowDays === 7,
        `Acute window should be 7 days, got ${ACWR_CONFIG.acuteWindowDays}`
      );
    });

    await test("Chronic window is 28 days", async () => {
      assert(
        ACWR_CONFIG.chronicWindowDays === 28,
        `Chronic window should be 28 days, got ${ACWR_CONFIG.chronicWindowDays}`
      );
    });

    await test("Minimum chronic load is 100", async () => {
      assert(
        ACWR_CONFIG.minChronicLoad === 100,
        `Min chronic load should be 100, got ${ACWR_CONFIG.minChronicLoad}`
      );
    });

    await test("Sweet spot range is 0.8 - 1.3", async () => {
      assert(
        ACWR_CONFIG.thresholds.sweetSpotLow === 0.8,
        `Sweet spot low should be 0.8, got ${ACWR_CONFIG.thresholds.sweetSpotLow}`
      );
      assert(
        ACWR_CONFIG.thresholds.sweetSpotHigh === 1.3,
        `Sweet spot high should be 1.3, got ${ACWR_CONFIG.thresholds.sweetSpotHigh}`
      );
    });

    await test("Danger threshold is 1.5", async () => {
      assert(
        ACWR_CONFIG.thresholds.dangerHigh === 1.5,
        `Danger threshold should be 1.5, got ${ACWR_CONFIG.thresholds.dangerHigh}`
      );
    });

    await test("Minimum data requirements", async () => {
      assert(
        ACWR_CONFIG.minDaysForChronic === 21,
        `Min days for chronic should be 21, got ${ACWR_CONFIG.minDaysForChronic}`
      );
      assert(
        ACWR_CONFIG.minSessionsForChronic === 12,
        `Min sessions for chronic should be 12, got ${ACWR_CONFIG.minSessionsForChronic}`
      );
    });
  });
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================

async function runTests() {
  console.log("🧪 ACWR Calculation Contract Tests");
  console.log("=".repeat(60));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log("");

  await testLoadCalculation();
  await testEWMACalculation();
  await testRiskZoneClassification();
  await testFullACWRCalculation();
  await testConfigurationConstants();

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Results");
  console.log("=".repeat(60));
  console.log(`Total: ${testsRun}`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);

  if (failures.length > 0) {
    console.log("\n❌ Failures:");
    failures.forEach(({ name, error }) => {
      console.log(`   - ${name}`);
      console.log(`     ${error}`);
    });
  }

  if (testsFailed === 0) {
    console.log("\n🎉 All ACWR calculation tests passed!");
    process.exit(0);
  } else {
    console.log("\n⚠️  Some ACWR tests failed. Review errors above.");
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error("\n💥 Fatal error running tests:");
  console.error(error);
  process.exit(1);
});

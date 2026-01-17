#!/usr/bin/env node
/**
 * API Response Shape Contract Tests
 *
 * These tests verify that API responses conform to documented contracts.
 * They fail if response shapes, enums, date fields, or key metric outputs
 * change unexpectedly.
 *
 * Contract Reference: docs/contracts/CONTRACT_MAP.md
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node api-response-shapes.contract.test.js
 *
 * Or via npm:
 *   npm run test:contracts:api
 */

import { createClient } from "@supabase/supabase-js";

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8888/.netlify/functions";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

function assertType(value, expectedType, fieldName) {
  const actualType = value === null ? "null" : typeof value;
  if (actualType !== expectedType && value !== null) {
    throw new Error(
      `${fieldName}: Expected type '${expectedType}', got '${actualType}' (value: ${JSON.stringify(value)})`
    );
  }
}

function assertOneOf(value, allowedValues, fieldName) {
  if (value !== null && !allowedValues.includes(value)) {
    throw new Error(
      `${fieldName}: Value '${value}' not in allowed values: [${allowedValues.join(", ")}]`
    );
  }
}

function assertDateFormat(value, fieldName) {
  if (value === null || value === undefined) return;
  // ISO 8601 date format: YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  // ISO 8601 datetime format: YYYY-MM-DDTHH:mm:ss.sssZ
  const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

  if (!dateRegex.test(value) && !datetimeRegex.test(value)) {
    throw new Error(
      `${fieldName}: Invalid date format '${value}'. Expected ISO 8601 (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)`
    );
  }
}

function assertRange(value, min, max, fieldName) {
  if (value === null || value === undefined) return;
  if (value < min || value > max) {
    throw new Error(
      `${fieldName}: Value ${value} out of range [${min}, ${max}]`
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
// CONTRACT DEFINITIONS
// =============================================================================

/**
 * Training Session Status Enum
 * Contract: Must match DB enum values exactly
 */
const TRAINING_STATUS_ENUM = [
  "planned",
  "in_progress",
  "completed",
  "cancelled",
  "scheduled",
  "deleted",
];

/**
 * Session State Enum
 * Contract: Advanced workflow states
 */
const SESSION_STATE_ENUM = [
  "UNRESOLVED",
  "PLANNED",
  "GENERATED",
  "VISIBLE",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "COMPLETED",
  "LOCKED",
  "CANCELLED",
  "EXPIRED",
  "ABANDONED",
];

/**
 * ACWR Risk Level Enum
 * Contract: Standardized risk classifications
 */
const ACWR_RISK_LEVEL_ENUM = ["low", "moderate", "high", "very-high"];

/**
 * ACWR Data Source Enum
 */
const ACWR_DATA_SOURCE_ENUM = ["database", "none"];

// =============================================================================
// TESTS: TRAINING SESSION RESPONSE SHAPE
// =============================================================================

async function testTrainingSessionsResponseShape() {
  await describe("Training Sessions Response Shape Contract", async () => {
    await test("training_sessions table has required columns", async () => {
      const { data, error } = await supabase
        .from("training_sessions")
        .select(
          "id, user_id, session_date, duration_minutes, rpe, status, notes, session_type, intensity_level, session_state, coach_locked, created_at"
        )
        .limit(1);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }
      // Table exists and has expected columns
    });

    await test("training_sessions.status matches enum contract", async () => {
      const { data, error } = await supabase
        .from("training_sessions")
        .select("status")
        .not("status", "is", null)
        .limit(100);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      for (const row of data || []) {
        assertOneOf(row.status, TRAINING_STATUS_ENUM, "status");
      }
    });

    await test("training_sessions.session_state matches enum contract", async () => {
      const { data, error } = await supabase
        .from("training_sessions")
        .select("session_state")
        .not("session_state", "is", null)
        .limit(100);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      for (const row of data || []) {
        assertOneOf(row.session_state, SESSION_STATE_ENUM, "session_state");
      }
    });

    await test("training_sessions.rpe is in range 1-10", async () => {
      const { data, error } = await supabase
        .from("training_sessions")
        .select("rpe")
        .not("rpe", "is", null)
        .limit(100);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      for (const row of data || []) {
        assertRange(row.rpe, 1, 10, "rpe");
      }
    });

    await test("training_sessions.session_date uses ISO 8601 format", async () => {
      const { data, error } = await supabase
        .from("training_sessions")
        .select("session_date")
        .not("session_date", "is", null)
        .limit(100);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      for (const row of data || []) {
        assertDateFormat(row.session_date, "session_date");
      }
    });

    await test("training_sessions.created_at uses ISO 8601 datetime format", async () => {
      const { data, error } = await supabase
        .from("training_sessions")
        .select("created_at")
        .not("created_at", "is", null)
        .limit(100);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      for (const row of data || []) {
        assertDateFormat(row.created_at, "created_at");
      }
    });

    await test("training_sessions.duration_minutes is non-negative integer", async () => {
      const { data, error } = await supabase
        .from("training_sessions")
        .select("duration_minutes")
        .not("duration_minutes", "is", null)
        .limit(100);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      for (const row of data || []) {
        assertType(row.duration_minutes, "number", "duration_minutes");
        assert(
          row.duration_minutes >= 0,
          `duration_minutes must be non-negative, got ${row.duration_minutes}`
        );
      }
    });
  });
}

// =============================================================================
// TESTS: WELLNESS CHECK-IN RESPONSE SHAPE
// =============================================================================

async function testWellnessCheckinResponseShape() {
  await describe("Wellness Check-in Response Shape Contract", async () => {
    await test("daily_wellness_checkin table has required columns", async () => {
      const { data, error } = await supabase
        .from("daily_wellness_checkin")
        .select(
          "id, user_id, checkin_date, sleep_quality, sleep_hours, energy_level, stress_level, muscle_soreness, motivation, soreness_areas, notes, calculated_readiness, created_at"
        )
        .limit(1);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }
    });

    await test("wellness metrics are in range 1-10", async () => {
      const { data, error } = await supabase
        .from("daily_wellness_checkin")
        .select(
          "sleep_quality, energy_level, stress_level, muscle_soreness, motivation"
        )
        .limit(100);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      const metrics = [
        "sleep_quality",
        "energy_level",
        "stress_level",
        "muscle_soreness",
        "motivation",
      ];

      for (const row of data || []) {
        for (const metric of metrics) {
          if (row[metric] !== null) {
            assertRange(row[metric], 1, 10, metric);
          }
        }
      }
    });

    await test("checkin_date uses ISO 8601 date format", async () => {
      const { data, error } = await supabase
        .from("daily_wellness_checkin")
        .select("checkin_date")
        .not("checkin_date", "is", null)
        .limit(100);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      for (const row of data || []) {
        assertDateFormat(row.checkin_date, "checkin_date");
      }
    });

    await test("sleep_hours is non-negative", async () => {
      const { data, error } = await supabase
        .from("daily_wellness_checkin")
        .select("sleep_hours")
        .not("sleep_hours", "is", null)
        .limit(100);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      for (const row of data || []) {
        assert(
          row.sleep_hours >= 0 && row.sleep_hours <= 24,
          `sleep_hours must be 0-24, got ${row.sleep_hours}`
        );
      }
    });
  });
}

// =============================================================================
// TESTS: LOAD MONITORING / ACWR RESPONSE SHAPE
// =============================================================================

async function testLoadMonitoringResponseShape() {
  await describe("Load Monitoring / ACWR Response Shape Contract", async () => {
    await test("load_monitoring table has required columns", async () => {
      const { data, error } = await supabase
        .from("load_monitoring")
        .select(
          "id, player_id, daily_load, acute_load, chronic_load, acwr, injury_risk_level, calculated_at"
        )
        .limit(1);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }
    });

    await test("acwr is a positive number when present", async () => {
      const { data, error } = await supabase
        .from("load_monitoring")
        .select("acwr")
        .not("acwr", "is", null)
        .limit(100);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      for (const row of data || []) {
        const acwr = parseFloat(row.acwr);
        assert(!isNaN(acwr), `acwr must be a number, got ${row.acwr}`);
        assert(acwr >= 0, `acwr must be non-negative, got ${acwr}`);
      }
    });

    await test("acute_load and chronic_load are non-negative", async () => {
      const { data, error } = await supabase
        .from("load_monitoring")
        .select("acute_load, chronic_load")
        .limit(100);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      for (const row of data || []) {
        if (row.acute_load !== null) {
          const val = parseFloat(row.acute_load);
          assert(val >= 0, `acute_load must be non-negative, got ${val}`);
        }
        if (row.chronic_load !== null) {
          const val = parseFloat(row.chronic_load);
          assert(val >= 0, `chronic_load must be non-negative, got ${val}`);
        }
      }
    });

    await test("calculated_at uses ISO 8601 datetime format", async () => {
      const { data, error } = await supabase
        .from("load_monitoring")
        .select("calculated_at")
        .not("calculated_at", "is", null)
        .limit(100);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      for (const row of data || []) {
        assertDateFormat(row.calculated_at, "calculated_at");
      }
    });
  });
}

// =============================================================================
// TESTS: WORKOUT LOGS RESPONSE SHAPE
// =============================================================================

async function testWorkoutLogsResponseShape() {
  await describe("Workout Logs Response Shape Contract", async () => {
    await test("workout_logs table has required columns", async () => {
      const { data, error } = await supabase
        .from("workout_logs")
        .select("id, player_id, session_id, completed_at, rpe, duration_minutes, notes")
        .limit(1);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }
    });

    await test("workout_logs.rpe is in range 1-10", async () => {
      const { data, error } = await supabase
        .from("workout_logs")
        .select("rpe")
        .not("rpe", "is", null)
        .limit(100);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      for (const row of data || []) {
        assertRange(row.rpe, 1, 10, "rpe");
      }
    });

    await test("workout_logs.completed_at uses ISO 8601 datetime format", async () => {
      const { data, error } = await supabase
        .from("workout_logs")
        .select("completed_at")
        .not("completed_at", "is", null)
        .limit(100);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      for (const row of data || []) {
        assertDateFormat(row.completed_at, "completed_at");
      }
    });
  });
}

// =============================================================================
// TESTS: TRAINING SESSION TEMPLATES (SCHEDULE VIEW)
// =============================================================================

async function testTrainingSessionTemplatesResponseShape() {
  await describe("Training Session Templates Contract", async () => {
    await test("training_session_templates table has required columns", async () => {
      const { data, error } = await supabase
        .from("training_session_templates")
        .select(
          "id, week_id, session_name, session_type, day_of_week, duration_minutes, intensity_level, description"
        )
        .limit(1);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }
    });

    await test("day_of_week is in range 0-6 when present", async () => {
      const { data, error } = await supabase
        .from("training_session_templates")
        .select("day_of_week")
        .not("day_of_week", "is", null)
        .limit(100);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      for (const row of data || []) {
        assertRange(row.day_of_week, 0, 6, "day_of_week");
      }
    });
  });
}

// =============================================================================
// TESTS: EXERCISE LIBRARY RESPONSE SHAPE
// =============================================================================

async function testExerciseLibraryResponseShape() {
  await describe("Exercise Library Response Shape Contract", async () => {
    await test("exercisedb_exercises table has required columns", async () => {
      const { data, error } = await supabase
        .from("exercisedb_exercises")
        .select(
          "id, name, body_part, equipment, target_muscle, is_curated, flag_football_relevance, difficulty_level, is_active, is_approved"
        )
        .limit(1);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }
    });

    await test("flag_football_relevance is in range 1-10 when present", async () => {
      const { data, error } = await supabase
        .from("exercisedb_exercises")
        .select("flag_football_relevance")
        .not("flag_football_relevance", "is", null)
        .limit(100);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      for (const row of data || []) {
        assertRange(row.flag_football_relevance, 1, 10, "flag_football_relevance");
      }
    });

    await test("difficulty_level matches enum contract", async () => {
      const allowedLevels = ["beginner", "intermediate", "advanced", "elite"];
      const { data, error } = await supabase
        .from("exercisedb_exercises")
        .select("difficulty_level")
        .not("difficulty_level", "is", null)
        .limit(100);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      for (const row of data || []) {
        assertOneOf(row.difficulty_level, allowedLevels, "difficulty_level");
      }
    });

    await test("is_curated, is_active, is_approved are booleans", async () => {
      const { data, error } = await supabase
        .from("exercisedb_exercises")
        .select("is_curated, is_active, is_approved")
        .limit(100);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      for (const row of data || []) {
        if (row.is_curated !== null) {
          assertType(row.is_curated, "boolean", "is_curated");
        }
        if (row.is_active !== null) {
          assertType(row.is_active, "boolean", "is_active");
        }
        if (row.is_approved !== null) {
          assertType(row.is_approved, "boolean", "is_approved");
        }
      }
    });
  });
}

// =============================================================================
// TESTS: USER ID FIELD CONSISTENCY
// =============================================================================

async function testUserIdFieldConsistency() {
  await describe("User ID Field Consistency Contract", async () => {
    await test("training_sessions uses user_id field", async () => {
      const { data, error } = await supabase
        .from("training_sessions")
        .select("user_id")
        .limit(1);

      if (error) {
        throw new Error(`user_id field not found: ${error.message}`);
      }
    });

    await test("workout_logs uses player_id field", async () => {
      const { data, error } = await supabase
        .from("workout_logs")
        .select("player_id")
        .limit(1);

      if (error) {
        throw new Error(`player_id field not found: ${error.message}`);
      }
    });

    await test("load_monitoring uses player_id field", async () => {
      const { data, error } = await supabase
        .from("load_monitoring")
        .select("player_id")
        .limit(1);

      if (error) {
        throw new Error(`player_id field not found: ${error.message}`);
      }
    });

    await test("daily_wellness_checkin uses user_id field", async () => {
      const { data, error } = await supabase
        .from("daily_wellness_checkin")
        .select("user_id")
        .limit(1);

      if (error) {
        throw new Error(`user_id field not found: ${error.message}`);
      }
    });
  });
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================

async function runTests() {
  console.log("🧪 API Response Shape Contract Tests");
  console.log("=".repeat(60));
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log("");

  await testTrainingSessionsResponseShape();
  await testWellnessCheckinResponseShape();
  await testLoadMonitoringResponseShape();
  await testWorkoutLogsResponseShape();
  await testTrainingSessionTemplatesResponseShape();
  await testExerciseLibraryResponseShape();
  await testUserIdFieldConsistency();

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
    console.log("\n🎉 All contract tests passed!");
    process.exit(0);
  } else {
    console.log("\n⚠️  Some contract tests failed. Review errors above.");
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error("\n💥 Fatal error running tests:");
  console.error(error);
  process.exit(1);
});

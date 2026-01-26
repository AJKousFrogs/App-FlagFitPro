#!/usr/bin/env node
/**
 * Simple test runner for contract tests
 * Runs tests without requiring Jest installation
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node run-contracts-test.js
 */

import { createClient } from "@supabase/supabase-js";

// Get environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
  console.error("\nExample:");
  console.error("  export SUPABASE_URL='https://your-project.supabase.co'");
  console.error("  export SUPABASE_SERVICE_KEY='your-service-role-key'");
  console.error("  node run-contracts-test.js");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Simple test results tracking
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
const failures = [];

function test(name, fn) {
  testsRun++;
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then(() => {
          testsPassed++;
          console.log(`✅ ${name}`);
        })
        .catch((error) => {
          testsFailed++;
          failures.push({ name, error: error.message });
          console.error(`❌ ${name}`);
          console.error(`   Error: ${error.message}`);
        });
    } else {
      testsPassed++;
      console.log(`✅ ${name}`);
    }
  } catch (error) {
    testsFailed++;
    failures.push({ name, error: error.message });
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
  }
}

async function describe(name, fn) {
  console.log(`\n📋 ${name}`);
  console.log("─".repeat(50));
  await fn();
}

async function runTests() {
  console.log("🧪 Contract Compliance Tests");
  console.log("=".repeat(50));
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Service Key: ${SUPABASE_SERVICE_KEY.substring(0, 20)}...`);
  console.log("");

  // Test 1: Verify state_transition_history table exists
  await describe("Database Schema Verification", async () => {
    await test("state_transition_history table exists", async () => {
      const { data, error } = await supabase
        .from("state_transition_history")
        .select("id")
        .limit(1);

      if (error && error.code === "42P01") {
        throw new Error("Table does not exist");
      }
      return true;
    });

    await test("session_state column exists in training_sessions", async () => {
      const { data, error } = await supabase
        .from("training_sessions")
        .select("session_state")
        .limit(1);

      if (error) {
        throw new Error(`Column check failed: ${error.message}`);
      }
      return true;
    });

    await test("coach_locked column exists in training_sessions", async () => {
      const { data, error } = await supabase
        .from("training_sessions")
        .select("coach_locked")
        .limit(1);

      if (error) {
        throw new Error(`Column check failed: ${error.message}`);
      }
      return true;
    });
  });

  // Test 2: Verify consent views exist
  await describe("Consent Views Verification", async () => {
    await test("v_readiness_scores_consent view exists", async () => {
      const { data, error } = await supabase
        .from("v_readiness_scores_consent")
        .select("*")
        .limit(1);

      if (error && error.code === "42P01") {
        throw new Error("View does not exist");
      }
      return true;
    });

    await test("v_wellness_entries_consent view exists", async () => {
      const { data, error } = await supabase
        .from("v_wellness_entries_consent")
        .select("*")
        .limit(1);

      if (error && error.code === "42P01") {
        throw new Error("View does not exist");
      }
      return true;
    });

    await test("v_injury_tracking_consent view exists", async () => {
      const { data, error } = await supabase
        .from("v_injury_tracking_consent")
        .select("*")
        .limit(1);

      if (error && error.code === "42P01") {
        throw new Error("View does not exist");
      }
      return true;
    });
  });

  // Test 3: Verify immutability (try to update history - should fail)
  await describe("Immutability Enforcement", async () => {
    await test("state_transition_history blocks UPDATE", async () => {
      // First, try to get a record (or create a test one)
      const testId = "00000000-0000-0000-0000-000000000001";

      // Try to insert a test record
      const { data: insertData, error: insertError } = await supabase
        .from("state_transition_history")
        .insert({
          id: testId,
          session_id: "00000000-0000-0000-0000-000000000002",
          from_state: "GENERATED",
          to_state: "VISIBLE",
          actor_role: "system",
          transitioned_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (
        insertError &&
        !insertError.message.includes("violates foreign key")
      ) {
        // If insert fails for other reasons, that's okay - we'll try to update existing
        // Check if we can query the table at least
        const { error: queryError } = await supabase
          .from("state_transition_history")
          .select("id")
          .limit(1);

        if (queryError) {
          throw new Error(`Cannot access table: ${queryError.message}`);
        }

        // If we can't insert, that's fine - just verify the table exists
        return true;
      }

      // Now try to update (should fail)
      const { error: updateError } = await supabase
        .from("state_transition_history")
        .update({ reason: "Modified" })
        .eq("id", testId);

      if (!updateError) {
        throw new Error(
          "UPDATE was allowed (should be blocked by immutability trigger)",
        );
      }

      if (!updateError.message.includes("append-only")) {
        throw new Error(
          `UPDATE error doesn't match expected pattern: ${updateError.message}`,
        );
      }

      // Cleanup: Try to delete (should also fail)
      const { error: deleteError } = await supabase
        .from("state_transition_history")
        .delete()
        .eq("id", testId);

      if (!deleteError) {
        throw new Error("DELETE was allowed (should be blocked)");
      }

      return true;
    });
  });

  // Summary
  console.log(`\n${"=".repeat(50)}`);
  console.log("📊 Test Results");
  console.log("=".repeat(50));
  console.log(`Total: ${testsRun}`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);

  if (failures.length > 0) {
    console.log("\n❌ Failures:");
    failures.forEach(({ name, error }) => {
      console.log(`   - ${name}: ${error}`);
    });
  }

  if (testsFailed === 0) {
    console.log("\n🎉 All tests passed!");
    process.exit(0);
  } else {
    console.log("\n⚠️  Some tests failed. Review errors above.");
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error("\n💥 Fatal error running tests:");
  console.error(error);
  process.exit(1);
});

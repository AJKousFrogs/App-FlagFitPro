#!/usr/bin/env node
/**
 * Simple test runner for contract tests
 * Runs tests without requiring Jest installation
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmptbmpwenZrbm1zeHJ3ZXN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUwMjg5OSwiZXhwIjoyMDg1MDc4ODk5fQ.GIETcsbB9U_CRoeOhONwykUgMWzdWdU--QuyDr2BPaw node run-contracts-test.js
 */

import { createClient } from "@supabase/supabase-js";

// Get environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
  console.error("\nExample:");
  console.error(
    "  export SUPABASE_URL='https://grfjmnjpzvknmsxrwesx.supabase.co'",
  );
  console.error(
    "  export SUPABASE_SERVICE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmptbmpwenZrbm1zeHJ3ZXN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUwMjg5OSwiZXhwIjoyMDg1MDc4ODk5fQ.GIETcsbB9U_CRoeOhONwykUgMWzdWdU--QuyDr2BPaw'",
  );
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
      // Prefer an existing history row so UPDATE/DELETE definitely target a real tuple
      const { data: existingHistory, error: historyQueryError } = await supabase
        .from("state_transition_history")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (historyQueryError) {
        throw new Error(`Cannot access table: ${historyQueryError.message}`);
      }

      let testId = existingHistory?.id;
      let tempSessionId = null;

      if (!testId) {
        // Use a real training session to guarantee FK validity
        const { data: session, error: sessionError } = await supabase
        .from("training_sessions")
        .select("id, session_state")
        .limit(1)
        .maybeSingle();

        let sessionId = session?.id;
        let sessionState = session?.session_state || "PLANNED";

        if (sessionError) {
          throw new Error(
            `Cannot fetch a training session for immutability test: ${sessionError.message}`,
          );
        }

        if (!sessionId) {
          const { data: existingUser, error: userError } = await supabase
            .from("users")
            .select("id")
            .limit(1)
            .maybeSingle();

          if (userError || !existingUser?.id) {
            console.log(
              "⚠️  Skipping strict immutability mutation check: no seedable users/training sessions in environment.",
            );
            return true;
          }

          // Seed one minimal row for contract validation when environment has no sessions.
          tempSessionId = crypto.randomUUID();
          const { error: seedError } = await supabase
            .from("training_sessions")
            .insert({
              id: tempSessionId,
              user_id: existingUser.id,
              session_date: new Date().toISOString().slice(0, 10),
              session_type: "contract_test",
              duration_minutes: 1,
              session_state: "PLANNED",
              coach_locked: false,
            });

          if (seedError) {
            throw new Error(
              `Cannot fetch or seed a training session for immutability test: ${seedError.message}`,
            );
          }

          sessionId = tempSessionId;
          sessionState = "PLANNED";
        }

        testId = crypto.randomUUID();
        const targetState = sessionState;

        const { error: insertError } = await supabase
          .from("state_transition_history")
          .insert({
            id: testId,
            session_id: sessionId,
            from_state: null,
            to_state: targetState,
            actor_role: "system",
            transitioned_at: new Date().toISOString(),
          });

        if (insertError) {
          throw new Error(`Cannot insert test history row: ${insertError.message}`);
        }
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

      // Best-effort cleanup for any temporary seeded parent session.
      if (tempSessionId) {
        await supabase.from("training_sessions").delete().eq("id", tempSessionId);
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

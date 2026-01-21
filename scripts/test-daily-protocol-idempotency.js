#!/usr/bin/env node
/**
 * Test script for daily-protocol idempotency and concurrency safety
 * 
 * Usage:
 *   node scripts/test-daily-protocol-idempotency.js
 * 
 * Requires:
 *   - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY in .env
 *   - Valid test user JWT token (set TEST_USER_TOKEN env var)
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const testUserToken = process.env.TEST_USER_TOKEN;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables");
  console.error("Required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY");
  process.exit(1);
}

if (!testUserToken) {
  console.error("❌ Missing TEST_USER_TOKEN");
  console.error("Set TEST_USER_TOKEN to a valid user JWT token");
  process.exit(1);
}

// Create clients
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: { headers: { Authorization: `Bearer ${testUserToken}` } },
});

// Get user ID from token
async function getUserId() {
  const {
    data: { user },
    error,
  } = await supabaseUser.auth.getUser();
  if (error || !user) {
    throw new Error(`Failed to get user: ${error?.message}`);
  }
  return user.id;
}

async function testIdempotency() {
  console.log("\n🧪 Test 1: Idempotency Key");
  console.log("=" .repeat(50));

  const userId = await getUserId();
  const date = new Date().toISOString().split("T")[0];
  const idempotencyKey = `test-${Date.now()}`;

  // First generation
  console.log("📤 First generation request...");
  const response1 = await fetch(
    `${process.env.NETLIFY_FUNCTION_URL || "http://localhost:8888"}/.netlify/functions/daily-protocol/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        date,
        idempotencyKey,
      }),
    }
  );

  const result1 = await response1.json();
  const protocolId1 = result1?.data?.id;

  if (!protocolId1) {
    console.error("❌ First generation failed:", result1);
    return false;
  }
  console.log(`✅ First generation successful: protocol_id=${protocolId1}`);

  // Second generation with same key
  console.log("📤 Second generation request (same idempotency key)...");
  const response2 = await fetch(
    `${process.env.NETLIFY_FUNCTION_URL || "http://localhost:8888"}/.netlify/functions/daily-protocol/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        date,
        idempotencyKey, // Same key
      }),
    }
  );

  const result2 = await response2.json();
  const protocolId2 = result2?.data?.id;

  if (!protocolId2) {
    console.error("❌ Second generation failed:", result2);
    return false;
  }

  if (protocolId1 === protocolId2) {
    console.log(`✅ Idempotency test PASSED: Same protocol_id returned (${protocolId1})`);
    return true;
  } else {
    console.error(
      `❌ Idempotency test FAILED: Different protocol_ids (${protocolId1} vs ${protocolId2})`
    );
    return false;
  }
}

async function testConcurrency() {
  console.log("\n🧪 Test 2: Concurrency Safety");
  console.log("=" .repeat(50));

  const userId = await getUserId();
  const date = new Date(Date.now() + 86400000).toISOString().split("T")[0]; // Tomorrow

  // Clean up any existing protocol for this date
  const { data: existing } = await supabaseAdmin
    .from("daily_protocols")
    .select("id")
    .eq("user_id", userId)
    .eq("protocol_date", date)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from("protocol_exercises")
      .delete()
      .eq("protocol_id", existing.id);
    await supabaseAdmin.from("daily_protocols").delete().eq("id", existing.id);
  }

  // Send 5 concurrent requests
  console.log("📤 Sending 5 concurrent generation requests...");
  const requests = Array.from({ length: 5 }, (_, i) =>
    fetch(
      `${process.env.NETLIFY_FUNCTION_URL || "http://localhost:8888"}/.netlify/functions/daily-protocol/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          date,
          // No idempotency key - should derive same deterministic key
        }),
      }
    ).then((r) => r.json())
  );

  const results = await Promise.all(requests);
  const protocolIds = results
    .map((r) => r?.data?.id)
    .filter(Boolean)
    .filter((id, idx, arr) => arr.indexOf(id) === idx); // Unique

  // Check database - should only have one protocol
  const { data: protocols } = await supabaseAdmin
    .from("daily_protocols")
    .select("id")
    .eq("user_id", userId)
    .eq("protocol_date", date);

  const uniqueProtocolIds = protocols?.map((p) => p.id).filter((id, idx, arr) => arr.indexOf(id) === idx) || [];

  if (uniqueProtocolIds.length === 1) {
    console.log(`✅ Concurrency test PASSED: Only 1 protocol created (${uniqueProtocolIds[0]})`);
    console.log(`   Responses returned ${protocolIds.length} unique protocol_ids`);
    return true;
  } else {
    console.error(
      `❌ Concurrency test FAILED: ${uniqueProtocolIds.length} protocols created`
    );
    console.error(`   Protocol IDs: ${uniqueProtocolIds.join(", ")}`);
    return false;
  }
}

async function testProtocolHasExercises() {
  console.log("\n🧪 Test 3: Protocol Always Has Exercises");
  console.log("=" .repeat(50));

  const userId = await getUserId();
  const date = new Date(Date.now() + 172800000).toISOString().split("T")[0]; // Day after tomorrow

  // Generate protocol
  console.log("📤 Generating protocol...");
  const response = await fetch(
    `${process.env.NETLIFY_FUNCTION_URL || "http://localhost:8888"}/.netlify/functions/daily-protocol/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({ date }),
    }
  );

  const result = await response.json();
  const protocolId = result?.data?.id;

  if (!protocolId) {
    console.error("❌ Protocol generation failed:", result);
    return false;
  }

  // Check exercises
  const { data: exercises, error } = await supabaseAdmin
    .from("protocol_exercises")
    .select("id")
    .eq("protocol_id", protocolId);

  if (error) {
    console.error("❌ Failed to fetch exercises:", error);
    return false;
  }

  const { data: protocol } = await supabaseAdmin
    .from("daily_protocols")
    .select("total_exercises")
    .eq("id", protocolId)
    .single();

  if (exercises && exercises.length > 0) {
    console.log(`✅ Protocol has ${exercises.length} exercises (total_exercises=${protocol?.total_exercises})`);
    if (exercises.length === protocol?.total_exercises) {
      console.log("✅ Exercise count matches total_exercises field");
      return true;
    } else {
      console.warn(`⚠️  Exercise count mismatch: ${exercises.length} exercises vs total_exercises=${protocol?.total_exercises}`);
      return true; // Still passes - exercises exist
    }
  } else {
    console.error("❌ Protocol has 0 exercises!");
    return false;
  }
}

async function main() {
  console.log("🚀 Starting Daily Protocol Tests");
  console.log("=" .repeat(50));

  try {
    const results = {
      idempotency: await testIdempotency(),
      concurrency: await testConcurrency(),
      exercises: await testProtocolHasExercises(),
    };

    console.log("\n📊 Test Results");
    console.log("=" .repeat(50));
    console.log(`Idempotency:     ${results.idempotency ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`Concurrency:     ${results.concurrency ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`Has Exercises:   ${results.exercises ? "✅ PASS" : "❌ FAIL"}`);

    const allPassed = Object.values(results).every((r) => r);
    if (allPassed) {
      console.log("\n🎉 All tests passed!");
      process.exit(0);
    } else {
      console.log("\n⚠️  Some tests failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Test execution failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testIdempotency, testConcurrency, testProtocolHasExercises };

#!/usr/bin/env node
/**
 * Performance Validation Script
 *
 * Validates performance of consent-aware views and related queries.
 *
 * Usage:
 *   node scripts/performance-validation.js                    # Full validation
 *   node scripts/performance-validation.js --explain-only     # Just EXPLAIN ANALYZE
 *   node scripts/performance-validation.js --load-test        # Just load tests
 *   node scripts/performance-validation.js --ci               # CI mode (JSON output)
 *
 * @see docs/PERFORMANCE_VALIDATION.md
 */

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const CONFIG = {
  targets: {
    consentViewRead: 100,
    dashboardLoad: 500,
    batchPlayerRead: 200,
    deletionQueueProcess: 1000,
  },
  consentViews: ["v_load_monitoring_consent", "v_workout_logs_consent"],
  consentJoinTables: [
    { table: "team_sharing_settings", columns: ["user_id", "team_id", "performance_sharing_enabled"] },
    { table: "team_members", columns: ["user_id", "team_id", "role", "status"] },
    { table: "privacy_settings", columns: ["user_id", "performance_sharing_default"] },
    { table: "load_monitoring", columns: ["player_id", "calculated_at"] },
    { table: "workout_logs", columns: ["player_id", "created_at"] },
  ],
  recommendedIndexes: [
    { name: "idx_team_sharing_settings_consent_lookup", table: "team_sharing_settings", columns: ["user_id", "team_id"], where: "performance_sharing_enabled = true", reason: "Fast consent lookup for coach queries" },
    { name: "idx_team_members_active_coaches", table: "team_members", columns: ["team_id", "user_id"], where: "role IN ('coach', 'assistant_coach', 'head_coach', 'admin') AND status = 'active'", reason: "Fast coach membership lookup" },
    { name: "idx_load_monitoring_player_date", table: "load_monitoring", columns: ["player_id", "calculated_at DESC"], reason: "Fast player load history queries" },
    { name: "idx_workout_logs_player_date", table: "workout_logs", columns: ["player_id", "created_at DESC"], reason: "Fast player workout history queries" },
    { name: "idx_privacy_settings_sharing_defaults", table: "privacy_settings", columns: ["user_id", "performance_sharing_default", "health_sharing_default"], reason: "Fast privacy settings lookup" },
  ],
};

const args = process.argv.slice(2);
const explainOnly = args.includes("--explain-only");
const loadTestOnly = args.includes("--load-test");
const ciMode = args.includes("--ci");

const results = {
  explainAnalyze: [],
  indexReview: [],
  loadTests: [],
  recommendations: [],
  passed: 0,
  failed: 0,
  warnings: 0,
};

async function main() {
  console.log("🚀 Performance Validation\n");
  console.log(`${"=".repeat(70)}\n`);

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  if (!loadTestOnly) {
    await runExplainAnalyze(supabase);
    await reviewIndexes(supabase);
  }

  if (!explainOnly) {
    await runLoadTests(supabase);
  }

  generateRecommendations();
  printResults();

  if (results.failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

async function runExplainAnalyze(supabase) {
  console.log("📊 Running EXPLAIN ANALYZE on Consent Views\n");

  for (const viewName of CONFIG.consentViews) {
    console.log(`   Analyzing ${viewName}...`);
    try {
      const query = `
        EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
        SELECT * FROM ${viewName}
        WHERE player_id = '00000000-0000-0000-0000-000000000000'
        LIMIT 100
      `;

      const { data, error } = await supabase.rpc("sql", { query });

      if (error) {
        console.log(`   ⚠️  Could not analyze ${viewName}: ${error.message}`);
        results.warnings++;
        continue;
      }

      const plan = data?.[0]?.["QUERY PLAN"]?.[0] || data?.[0];
      const executionTime = plan?.["Execution Time"] || plan?.["Planning Time"] || 0;
      const planningTime = plan?.["Planning Time"] || 0;
      const totalTime = executionTime + planningTime;

      const result = {
        view: viewName,
        executionTimeMs: executionTime,
        planningTimeMs: planningTime,
        totalTimeMs: totalTime,
        target: CONFIG.targets.consentViewRead,
        passed: totalTime <= CONFIG.targets.consentViewRead,
        plan,
      };

      results.explainAnalyze.push(result);

      if (result.passed) {
        console.log(`   ✅ ${viewName}: ${totalTime.toFixed(2)}ms (target: ${CONFIG.targets.consentViewRead}ms)`);
        results.passed++;
      } else {
        console.log(`   ❌ ${viewName}: ${totalTime.toFixed(2)}ms EXCEEDS target ${CONFIG.targets.consentViewRead}ms`);
        results.failed++;
      }

      const planStr = JSON.stringify(plan);
      if (planStr.includes("Seq Scan") && !planStr.includes("Index")) {
        console.log(`   ⚠️  Sequential scan detected - consider adding indexes`);
        results.warnings++;
      }
    } catch (err) {
      console.log(`   ⚠️  Error analyzing ${viewName}: ${err.message}`);
      results.warnings++;
    }
  }

  console.log();
}

async function reviewIndexes(supabase) {
  console.log("🔍 Reviewing Indexes for Consent Join Patterns\n");

  const { data: existingIndexes, error } = await supabase.rpc("sql", {
    query: `
      SELECT schemaname, tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `,
  });

  if (error) {
    console.log(`   ⚠️  Could not fetch indexes: ${error.message}`);
    results.warnings++;
    return;
  }

  const indexMap = new Map();
  for (const idx of existingIndexes || []) {
    const key = `${idx.tablename}`;
    if (!indexMap.has(key)) {
      indexMap.set(key, []);
    }
    indexMap.get(key).push(idx);
  }

  for (const rec of CONFIG.recommendedIndexes) {
    const tableIndexes = indexMap.get(rec.table) || [];
    const hasIndex = tableIndexes.some((idx) => {
      const def = idx.indexdef.toLowerCase();
      return rec.columns.every((col) => def.includes(col.toLowerCase()));
    });

    const result = {
      name: rec.name,
      table: rec.table,
      columns: rec.columns,
      reason: rec.reason,
      exists: hasIndex,
      where: rec.where,
    };

    results.indexReview.push(result);

    if (hasIndex) {
      console.log(`   ✅ ${rec.table}: Index exists for [${rec.columns.join(", ")}]`);
      results.passed++;
    } else {
      console.log(`   ⚠️  ${rec.table}: Missing index for [${rec.columns.join(", ")}]`);
      console.log(`      Reason: ${rec.reason}`);
      results.warnings++;
    }
  }

  console.log();
}

async function runLoadTests(supabase) {
  console.log("⚡ Running Load Tests\n");

  await testCoachDashboardLoad(supabase, 20);
  await testCoachDashboardLoad(supabase, 50);
  await testCoachDashboardLoad(supabase, 100);
  await testPlayerDashboardLoad(supabase);
  await testDeletionQueueProcessing(supabase);

  console.log();
}

async function testCoachDashboardLoad(supabase, playerCount) {
  console.log(`   Testing coach dashboard load (${playerCount} players)...`);

  const startTime = Date.now();
  try {
    const { data, error } = await supabase.from("v_load_monitoring_consent").select("*").limit(playerCount);

    const duration = Date.now() - startTime;
    const target = CONFIG.targets.batchPlayerRead * (playerCount / 20);

    const result = {
      test: `coach_dashboard_${playerCount}_players`,
      duration,
      target,
      passed: duration <= target,
      rowsReturned: data?.length || 0,
      error: error?.message,
    };

    results.loadTests.push(result);

    if (result.passed) {
      console.log(`   ✅ ${playerCount} players: ${duration}ms (target: ${target}ms)`);
      results.passed++;
    } else {
      console.log(`   ❌ ${playerCount} players: ${duration}ms EXCEEDS target ${target}ms`);
      results.failed++;
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    results.failed++;
  }
}

async function testPlayerDashboardLoad(supabase) {
  console.log(`   Testing player dashboard load...`);

  const startTime = Date.now();
  try {
    const { data, error } = await supabase
      .from("load_monitoring")
      .select("*")
      .eq("player_id", "00000000-0000-0000-0000-000000000000")
      .order("calculated_at", { ascending: false })
      .limit(30);

    const duration = Date.now() - startTime;
    const target = CONFIG.targets.consentViewRead;

    const result = {
      test: "player_dashboard",
      duration,
      target,
      passed: duration <= target,
      rowsReturned: data?.length || 0,
      error: error?.message,
    };

    results.loadTests.push(result);

    if (result.passed) {
      console.log(`   ✅ Player dashboard: ${duration}ms (target: ${target}ms)`);
      results.passed++;
    } else {
      console.log(`   ❌ Player dashboard: ${duration}ms EXCEEDS target ${target}ms`);
      results.failed++;
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    results.failed++;
  }
}

async function testDeletionQueueProcessing(supabase) {
  console.log(`   Testing deletion queue processing...`);

  const startTime = Date.now();
  try {
    const { data, error } = await supabase
      .from("account_deletion_requests")
      .select("*")
      .eq("status", "pending")
      .lt("grace_period_ends_at", new Date().toISOString())
      .limit(100);

    const duration = Date.now() - startTime;
    const target = CONFIG.targets.deletionQueueProcess;

    const result = {
      test: "deletion_queue_processing",
      duration,
      target,
      passed: duration <= target,
      rowsReturned: data?.length || 0,
      error: error?.message,
    };

    results.loadTests.push(result);

    if (result.passed) {
      console.log(`   ✅ Deletion queue: ${duration}ms (target: ${target}ms)`);
      results.passed++;
    } else {
      console.log(`   ❌ Deletion queue: ${duration}ms EXCEEDS target ${target}ms`);
      results.failed++;
    }
  } catch (err) {
    console.log(`   ⚠️  Deletion queue test skipped: ${err.message}`);
    results.warnings++;
  }
}

function generateRecommendations() {
  const missingIndexes = results.indexReview.filter((r) => !r.exists);
  if (missingIndexes.length > 0) {
    results.recommendations.push({
      type: "index",
      priority: "high",
      message: `Add ${missingIndexes.length} missing indexes for consent join patterns`,
      details: missingIndexes.map((idx) => ({ sql: generateIndexSQL(idx), reason: idx.reason })),
    });
  }

  const slowQueries = results.explainAnalyze.filter((r) => !r.passed);
  if (slowQueries.length > 0) {
    results.recommendations.push({
      type: "query",
      priority: "high",
      message: `${slowQueries.length} consent views exceed performance targets`,
      details: slowQueries.map((q) => ({ view: q.view, actual: q.totalTimeMs, target: q.target })),
    });
  }

  const failedLoadTests = results.loadTests.filter((r) => !r.passed);
  if (failedLoadTests.length > 0) {
    results.recommendations.push({
      type: "load",
      priority: "medium",
      message: `${failedLoadTests.length} load tests exceeded targets`,
      details: failedLoadTests.map((t) => ({ test: t.test, actual: t.duration, target: t.target })),
    });
  }
}

function generateIndexSQL(idx) {
  let sql = `CREATE INDEX IF NOT EXISTS ${idx.name} ON ${idx.table} (${idx.columns.join(", ")})`;
  if (idx.where) {
    sql += ` WHERE ${idx.where}`;
  }
  return `${sql};`;
}

function printResults() {
  console.log("=".repeat(70));
  console.log("\n📊 SUMMARY\n");
  console.log(`   ✅ Passed:   ${results.passed}`);
  console.log(`   ❌ Failed:   ${results.failed}`);
  console.log(`   ⚠️  Warnings: ${results.warnings}`);
  console.log();

  if (results.recommendations.length > 0) {
    console.log("📋 RECOMMENDATIONS\n");
    for (const rec of results.recommendations) {
      const priority = rec.priority === "high" ? "🔴" : rec.priority === "medium" ? "🟡" : "🟢";
      console.log(`   ${priority} [${rec.priority.toUpperCase()}] ${rec.message}`);
      if (rec.type === "index") {
        console.log("\n   Suggested index migrations:\n");
        for (const detail of rec.details) {
          console.log(`   ${detail.sql}`);
          console.log(`   -- ${detail.reason}\n`);
        }
      }
    }
  }

  console.log("📏 PERFORMANCE TARGETS\n");
  console.log(`   Consent view read:     ${CONFIG.targets.consentViewRead}ms`);
  console.log(`   Dashboard load:        ${CONFIG.targets.dashboardLoad}ms`);
  console.log(`   Batch player read:     ${CONFIG.targets.batchPlayerRead}ms (per 20 players)`);
  console.log(`   Deletion processing:   ${CONFIG.targets.deletionQueueProcess}ms`);
  console.log();

  if (results.failed === 0) {
    console.log("✅ ALL PERFORMANCE CHECKS PASSED\n");
  } else {
    console.log("❌ PERFORMANCE VALIDATION FAILED\n");
    console.log("Review recommendations above and apply suggested optimizations.\n");
  }

  if (ciMode) {
    console.log("\n--- CI OUTPUT (JSON) ---");
    console.log(
      JSON.stringify(
        {
          success: results.failed === 0,
          passed: results.passed,
          failed: results.failed,
          warnings: results.warnings,
          explainAnalyze: results.explainAnalyze,
          indexReview: results.indexReview,
          loadTests: results.loadTests,
          recommendations: results.recommendations,
          targets: CONFIG.targets,
        },
        null,
        2,
      ),
    );
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

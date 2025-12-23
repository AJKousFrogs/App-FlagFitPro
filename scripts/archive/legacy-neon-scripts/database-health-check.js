#!/usr/bin/env node

/**
 * Database Health Check System
 * Validates Neon PostgreSQL connectivity, schema integrity, and performance
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { performance } from "perf_hooks";

class DatabaseHealthChecker {
  constructor() {
    this.connectionString =
      process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
    this.results = {
      connectivity: { status: "unknown", responseTime: 0, error: null },
      schema: { status: "unknown", tables: [], missing: [] },
      performance: { status: "unknown", metrics: {} },
      data: { status: "unknown", counts: {} },
      recommendations: [],
    };
  }

  async checkConnectivity() {
    console.log("🔌 Checking Database Connectivity...");
    const start = performance.now();

    try {
      if (!this.connectionString) {
        throw new Error("DATABASE_URL not configured");
      }

      // Test basic connection
      const sql = neon(this.connectionString);
      const result = await sql`SELECT version()`;

      const responseTime = performance.now() - start;
      this.results.connectivity = {
        status: "connected",
        responseTime: Math.round(responseTime),
        version: result[0]?.version || "Unknown",
        error: null,
      };

      console.log(`✅ Connected to database (${responseTime.toFixed(0)}ms)`);
      console.log(`   Version: ${this.results.connectivity.version}`);
    } catch (error) {
      this.results.connectivity = {
        status: "failed",
        responseTime: performance.now() - start,
        error: error.message,
      };
      console.log(`❌ Connection failed: ${error.message}`);
    }
  }

  async checkSchema() {
    console.log("\n📋 Checking Database Schema...");

    try {
      const sql = neon(this.connectionString);

      // Check for required tables
      const requiredTables = [
        "users",
        "training_sessions",
        "training_goals",
        "analytics_events",
        "teams",
        "games",
        "foods",
        "nutrients",
        "recovery_protocols",
        "ai_coaches",
        "research_studies",
      ];

      const tableQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `;

      const tables = await sql(tableQuery);
      const existingTables = tables.map((row) => row.table_name);

      this.results.schema.tables = existingTables;
      this.results.schema.missing = requiredTables.filter(
        (table) => !existingTables.includes(table),
      );

      if (this.results.schema.missing.length === 0) {
        this.results.schema.status = "complete";
        console.log(`✅ All ${requiredTables.length} required tables exist`);
      } else {
        this.results.schema.status = "incomplete";
        console.log(
          `⚠️  Missing tables: ${this.results.schema.missing.join(", ")}`,
        );
        this.results.recommendations.push(
          "Run database migrations: npm run db:migrate",
        );
      }
    } catch (error) {
      this.results.schema.status = "error";
      console.log(`❌ Schema check failed: ${error.message}`);
    }
  }

  async checkDataIntegrity() {
    console.log("\n📊 Checking Data Integrity...");

    try {
      const sql = neon(this.connectionString);

      // Check table row counts
      const countQueries = [
        "SELECT COUNT(*) as count FROM users",
        "SELECT COUNT(*) as count FROM training_sessions",
        "SELECT COUNT(*) as count FROM foods",
        "SELECT COUNT(*) as count FROM recovery_protocols",
        "SELECT COUNT(*) as count FROM ai_coaches",
      ];

      for (const query of countQueries) {
        const tableName = query.match(/FROM (\w+)/)?.[1] || "unknown";
        try {
          const result = await sql(query);
          const count = result[0]?.count || 0;

          this.results.data.counts[tableName] = count;
          console.log(`   ${tableName}: ${count} records`);

          if (count === 0) {
            this.results.recommendations.push(
              `Seed ${tableName} data: npm run db:seed`,
            );
          }
        } catch (error) {
          console.log(`   ${tableName}: Error - ${error.message}`);
        }
      }

      this.results.data.status = "checked";
    } catch (error) {
      this.results.data.status = "error";
      console.log(`❌ Data integrity check failed: ${error.message}`);
    }
  }

  async checkPerformance() {
    console.log("\n⚡ Checking Performance Metrics...");

    try {
      const sql = neon(this.connectionString);

      // Check database size
      const sizeQuery = `
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as db_size,
          pg_size_pretty(pg_total_relation_size('users')) as users_size,
          pg_size_pretty(pg_total_relation_size('foods')) as foods_size
      `;

      const sizeResult = await sql(sizeQuery);
      this.results.performance.metrics = sizeResult[0];

      console.log(`   Database size: ${sizeResult[0]?.db_size || "Unknown"}`);
      console.log(`   Users table: ${sizeResult[0]?.users_size || "Unknown"}`);
      console.log(`   Foods table: ${sizeResult[0]?.foods_size || "Unknown"}`);

      // Check for slow queries (if any)
      const slowQuery = `
        SELECT query, mean_time, calls 
        FROM pg_stat_statements 
        WHERE mean_time > 100 
        ORDER BY mean_time DESC 
        LIMIT 5
      `;

      try {
        const slowQueries = await sql(slowQuery);
        if (slowQueries.length > 0) {
          console.log("   ⚠️  Slow queries detected:");
          slowQueries.forEach((q) => {
            console.log(
              `      ${q.query?.substring(0, 50)}... (${q.mean_time}ms avg)`,
            );
          });
        }
      } catch (error) {
        // pg_stat_statements might not be available
        console.log("   ℹ️  Performance monitoring not available");
      }

      this.results.performance.status = "checked";
    } catch (error) {
      this.results.performance.status = "error";
      console.log(`❌ Performance check failed: ${error.message}`);
    }
  }

  async checkBackupStatus() {
    console.log("\n💾 Checking Backup Status...");

    try {
      // Check if backup tables exist
      const sql = neon(this.connectionString);
      const backupTables = await sql(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%backup%'
      `);

      if (backupTables.length > 0) {
        console.log(
          `✅ Backup system detected (${backupTables.length} tables)`,
        );
        this.results.recommendations.push("Backup system is active");
      } else {
        console.log("ℹ️  No backup tables found");
      }
    } catch (error) {
      console.log(`⚠️  Backup check failed: ${error.message}`);
    }
  }

  generateReport() {
    console.log("\n📋 Database Health Report");
    console.log("========================");

    // Connectivity
    const conn = this.results.connectivity;
    console.log(
      `🔌 Connectivity: ${conn.status === "connected" ? "✅" : "❌"} ${conn.status}`,
    );
    if (conn.status === "connected") {
      console.log(`   Response time: ${conn.responseTime}ms`);
      console.log(`   Version: ${conn.version}`);
    } else if (conn.error) {
      console.log(`   Error: ${conn.error}`);
    }

    // Schema
    const schema = this.results.schema;
    console.log(
      `📋 Schema: ${schema.status === "complete" ? "✅" : "⚠️"} ${schema.status}`,
    );
    if (schema.tables.length > 0) {
      console.log(`   Tables found: ${schema.tables.length}`);
    }
    if (schema.missing.length > 0) {
      console.log(`   Missing: ${schema.missing.join(", ")}`);
    }

    // Data
    const data = this.results.data;
    console.log(
      `📊 Data: ${data.status === "checked" ? "✅" : "❌"} ${data.status}`,
    );
    if (data.counts) {
      Object.entries(data.counts).forEach(([table, count]) => {
        console.log(`   ${table}: ${count} records`);
      });
    }

    // Performance
    const perf = this.results.performance;
    console.log(
      `⚡ Performance: ${perf.status === "checked" ? "✅" : "❌"} ${perf.status}`,
    );
    if (perf.metrics) {
      console.log(`   Database size: ${perf.metrics.db_size || "Unknown"}`);
    }

    // Recommendations
    if (this.results.recommendations.length > 0) {
      console.log("\n💡 Recommendations:");
      this.results.recommendations.forEach((rec) => {
        console.log(`   • ${rec}`);
      });
    }

    // Overall status
    const overallStatus = this.getOverallStatus();
    console.log(
      `\n🎯 Overall Status: ${overallStatus.icon} ${overallStatus.status}`,
    );
    console.log(`   ${overallStatus.description}`);
  }

  getOverallStatus() {
    const conn = this.results.connectivity.status;
    const schema = this.results.schema.status;
    const data = this.results.data.status;

    if (conn === "connected" && schema === "complete" && data === "checked") {
      return {
        status: "HEALTHY",
        icon: "✅",
        description: "Database is fully operational",
      };
    } else if (conn === "connected" && schema === "incomplete") {
      return {
        status: "NEEDS MIGRATION",
        icon: "⚠️",
        description: "Connected but schema needs updates",
      };
    } else if (conn === "connected") {
      return {
        status: "PARTIAL",
        icon: "🟡",
        description: "Connected but some checks failed",
      };
    } else {
      return {
        status: "UNHEALTHY",
        icon: "❌",
        description: "Cannot connect to database",
      };
    }
  }

  async runAllChecks() {
    console.log("🏥 Database Health Check Starting...\n");

    await this.checkConnectivity();
    await this.checkSchema();
    await this.checkDataIntegrity();
    await this.checkPerformance();
    await this.checkBackupStatus();

    this.generateReport();

    return this.results;
  }
}

// CLI interface
async function main() {
  const [, , command] = process.argv;
  const checker = new DatabaseHealthChecker();

  switch (command) {
    case "monitor":
      console.log(
        "🔄 Starting continuous database monitoring (Ctrl+C to stop)...\n",
      );
      const monitor = async () => {
        console.clear();
        console.log(
          `🏈 Database Health Monitor - ${new Date().toLocaleTimeString()}\n`,
        );
        await checker.runAllChecks();
      };

      await monitor();
      const interval = setInterval(monitor, 60000); // Check every minute

      process.on("SIGINT", () => {
        clearInterval(interval);
        console.log("\n👋 Database monitoring stopped");
        process.exit(0);
      });
      break;

    case "check":
    default:
      await checker.runAllChecks();
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default DatabaseHealthChecker;

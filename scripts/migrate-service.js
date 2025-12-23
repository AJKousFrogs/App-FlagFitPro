#!/usr/bin/env node
/**
 * Automated Service Migration Script
 * Converts Angular services from API layer to direct Supabase queries
 *
 * Usage:
 *   node migrate-service.js <service-name>
 *
 * Example:
 *   node migrate-service.js wellness.service.ts
 */

const fs = require("fs");
const path = require("path");

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}\n`),
};

// Service migration configurations
const serviceMigrations = {
  "wellness.service.ts": {
    table: "wellness_entries",
    idField: "athlete_id",
    endpoints: [
      { old: "/api/performance-data/wellness", method: "GET" },
      { old: "/api/wellness/checkin", method: "POST" },
    ],
  },
  "recovery.service.ts": {
    table: "recovery_sessions",
    idField: "athlete_id",
    endpoints: [
      { old: "/api/recovery/metrics", method: "GET" },
      { old: "/api/recovery/protocols", method: "GET" },
      { old: "/api/recovery/start-session", method: "POST" },
      { old: "/api/recovery/complete-session", method: "PUT" },
    ],
  },
  "nutrition.service.ts": {
    table: "nutrition_logs",
    idField: "user_id",
    endpoints: [
      { old: "/api/nutrition/search-foods", method: "GET" },
      { old: "/api/nutrition/add-food", method: "POST" },
      { old: "/api/nutrition/goals", method: "GET" },
      { old: "/api/nutrition/meals", method: "GET" },
    ],
  },
  "performance-data.service.ts": {
    table: "performance_measurements",
    idField: "athlete_id",
    endpoints: [
      { old: "/api/performance-data/measurements", method: "GET" },
      { old: "/api/performance-data/performance-tests", method: "POST" },
      { old: "/api/performance-data/trends", method: "GET" },
    ],
  },
};

// Helper functions
function replaceImports(content) {
  // Replace ApiService import with SupabaseService
  content = content.replace(
    /import \{ ApiService(?:, API_ENDPOINTS)? \} from ['"]\.\/api\.service['"]/g,
    `import { SupabaseService } from './supabase.service';\nimport { LoggerService } from './logger.service'`,
  );

  // Add computed import if not present
  if (!content.includes("computed") && content.includes("inject")) {
    content = content.replace(/from ['"]@angular\/core['"]/, `, computed$&`);
  }

  // Add 'from' from rxjs if not present
  if (!content.includes(", from")) {
    content = content.replace(/from ['"]rxjs['"]/, (match) =>
      match.replace('from "rxjs"', 'from, of } from "rxjs"'),
    );
  }

  return content;
}

function replaceServiceInjection(content) {
  // Replace apiService with supabaseService
  content = content.replace(
    /private apiService = inject\(ApiService\);/g,
    `private supabaseService = inject(SupabaseService);\n  private logger = inject(LoggerService);\n  \n  // Get current user ID reactively\n  private userId = computed(() => this.supabaseService.userId());`,
  );

  return content;
}

function convertGetMethod(content, endpoint, table, idField) {
  const methodPattern = new RegExp(
    `(\\w+)\\([^)]*\\): Observable<([^>]+)> {[\\s\\S]*?this\\.apiService\\.get[^}]+}`,
    "g",
  );

  // This is a simplified conversion - real conversion would need more context
  log.warn(
    "GET method conversion requires manual review of filters and parameters",
  );

  return content;
}

function convertPostMethod(content, endpoint, table, idField) {
  // Similar to GET - simplified conversion
  log.warn("POST method conversion requires manual review of data mapping");

  return content;
}

function generateBackupFilename(servicePath) {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, -5);
  return servicePath.replace(".ts", `.backup-${timestamp}.ts`);
}

function analyzeService(content) {
  const analysis = {
    hasApiService: content.includes("ApiService"),
    hasSupabaseService: content.includes("SupabaseService"),
    apiCalls: [],
    needsUserId: false,
    needsLogger: false,
  };

  // Find API calls
  const apiCallPattern = /this\.apiService\.(get|post|put|delete)\(/g;
  let match;
  while ((match = apiCallPattern.exec(content)) !== null) {
    analysis.apiCalls.push(match[1]);
  }

  analysis.needsUserId =
    content.includes("user_id") || content.includes("userId");
  analysis.needsLogger =
    content.includes("logger") || content.includes("console.log");

  return analysis;
}

// Main migration function
async function migrateService(serviceName) {
  log.title(`🚀 Migrating ${serviceName} to Supabase`);

  // Check if service configuration exists
  if (!serviceMigrations[serviceName]) {
    log.error(`No migration configuration found for ${serviceName}`);
    log.info("Available services:");
    Object.keys(serviceMigrations).forEach((name) => {
      console.log(`  - ${name}`);
    });
    process.exit(1);
  }

  const config = serviceMigrations[serviceName];
  const servicePath = path.join(
    __dirname,
    "../angular/src/app/core/services",
    serviceName,
  );

  // Check if service file exists
  if (!fs.existsSync(servicePath)) {
    log.error(`Service file not found: ${servicePath}`);
    process.exit(1);
  }

  log.info(`Reading ${serviceName}...`);
  let content = fs.readFileSync(servicePath, "utf8");

  // Analyze current state
  log.info("Analyzing current implementation...");
  const analysis = analyzeService(content);

  if (analysis.hasSupabaseService) {
    log.warn("Service already uses SupabaseService!");
    log.info("This might be a partial migration. Review manually.");
  }

  if (!analysis.hasApiService) {
    log.error("Service does not use ApiService. Nothing to migrate.");
    process.exit(1);
  }

  log.success(`Found ${analysis.apiCalls.length} API calls to migrate`);
  analysis.apiCalls.forEach((method, i) => {
    console.log(`  ${i + 1}. ${method.toUpperCase()} request`);
  });

  // Create backup
  const backupPath = generateBackupFilename(servicePath);
  log.info(`Creating backup: ${path.basename(backupPath)}`);
  fs.writeFileSync(backupPath, content);
  log.success("Backup created");

  // Perform migrations
  log.info("Applying transformations...");

  // Step 1: Update imports
  content = replaceImports(content);
  log.success("✓ Updated imports");

  // Step 2: Update service injection
  content = replaceServiceInjection(content);
  log.success("✓ Updated service injection");

  // Step 3: Convert methods (basic template)
  log.warn("⚠ Method conversion requires manual review");
  log.info(`   Table: ${config.table}`);
  log.info(`   ID Field: ${config.idField}`);

  // Write migrated file
  fs.writeFileSync(servicePath, content);
  log.success(`Migrated service written to ${serviceName}`);

  // Generate migration report
  log.title("📋 Migration Report");
  console.log(`Service: ${serviceName}`);
  console.log(`Table: ${config.table}`);
  console.log(`Backup: ${path.basename(backupPath)}`);
  console.log(`\nNext Steps:`);
  console.log(`  1. Review the migrated service carefully`);
  console.log(`  2. Update method implementations to use Supabase queries`);
  console.log(`  3. Test CRUD operations`);
  console.log(`  4. Verify RLS policies on ${config.table}`);
  console.log(`  5. Run: ng lint`);
  console.log(`  6. Run tests if available`);
  console.log(`\nReference: angular/MIGRATION_GUIDE.md`);

  log.title("✨ Migration template applied!");
  log.warn("⚠ Manual review and testing required before deployment");
}

// CLI handling
const serviceName = process.argv[2];

if (!serviceName) {
  log.error("Please specify a service name");
  console.log("\nUsage:");
  console.log("  node migrate-service.js <service-name>\n");
  console.log("Available services:");
  Object.keys(serviceMigrations).forEach((name) => {
    console.log(`  - ${name}`);
  });
  process.exit(1);
}

// Run migration
migrateService(serviceName).catch((err) => {
  log.error(`Migration failed: ${err.message}`);
  console.error(err);
  process.exit(1);
});

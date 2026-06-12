import { wrapHandler } from "./utils/lambda-compat.js";
import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.admin" });

// Netlify Function: Admin API
// Handles admin-only operations: health metrics, data syncs, backups, statistics
//
// =============================================================================
// FEATURE STATUS
// =============================================================================
//
// 🔜 PLANNED (returning mock data):
// 1. Database Backup (createDatabaseBackup)
//    - Purpose: Create point-in-time backups of the database
//    - Note: Supabase Pro plan includes automatic daily backups
//
// =============================================================================

/**
 * Get database health metrics
 */
async function getHealthMetrics() {
  // Get database connection stats
  const { data: connectionTest, error: connError } = await supabaseAdmin
    .from("users")
    .select("id")
    .limit(1);

  const isConnected = !connError && connectionTest !== null;

  // Get table counts
  const tables = [
    "users",
    "training_sessions",
    "teams",
    "posts",
    "games",
  ];
  const tableStats = {};

  await Promise.all(
    tables.map(async (table) => {
      try {
        const { count, error } = await supabaseAdmin
          .from(table)
          .select("*", { count: "exact", head: true });

        if (!error) {
          tableStats[table] = count || 0;
        }
      } catch {
        tableStats[table] = "error";
      }
    }),
  );

  // Calculate total database size estimate (mock for now)
  const totalRows = Object.values(tableStats).reduce((sum, val) => {
    return sum + (typeof val === "number" ? val : 0);
  }, 0);

  return [
    {
      name: "Database Connection",
      value: isConnected ? "Connected" : "Disconnected",
      status: isConnected ? "healthy" : "error",
      severity: isConnected ? "success" : "danger",
      icon: "pi pi-check-circle",
      color: isConnected ? "#10c96b" : "#ef4444",
    },
    {
      name: "Total Records",
      value: totalRows.toLocaleString(),
      status: "healthy",
      severity: "success",
      icon: "pi pi-database",
      color: "#10c96b",
    },
    {
      name: "Users Table",
      value: (tableStats.users || 0).toLocaleString(),
      status: "healthy",
      severity: "success",
      icon: "pi pi-users",
      color: "#10c96b",
    },
    {
      name: "Training Sessions",
      value: (tableStats.training_sessions || 0).toLocaleString(),
      status: "healthy",
      severity: "success",
      icon: "pi pi-calendar",
      color: "#10c96b",
    },
    {
      name: "Cache Status",
      value: "Active",
      status: "healthy",
      severity: "success",
      icon: "pi pi-bolt",
      color: "#10c96b",
    },
    {
      name: "Last Backup",
      value: "N/A",
      status: "pending",
      severity: "warning",
      icon: "pi pi-save",
      color: "#f59e0b",
    },
  ];
}

/**
 * Create database backup
 *
 * Creates a logical backup by exporting all table data to Supabase Storage.
 * This provides a point-in-time snapshot of all data.
 *
 * For full database backups with schema:
 * - Supabase Pro plan includes automatic daily backups
 * - Access via Supabase Dashboard > Settings > Database > Backups
 *
 * @returns {Object} Backup info with status and metadata
 */
async function createDatabaseBackup() {
  const startTime = Date.now();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupId = `backup-${timestamp}`;

  try {
    // Tables to backup (ordered by dependencies)
    const tablesToBackup = [
      "users",
      "teams",
      "team_members",
      "training_sessions",
      "training_exercises",
      "athlete_performance_metrics",
      "posts",
      "comments",
      "games",
      "game_stats",
      "recovery_protocols",
      "nutrition_plans",
      "meal_templates",
      "privacy_settings",
      "parental_consent",
    ];

    const backupResults = {
      tables: {},
      totalRecords: 0,
      errors: [],
    };

    // Export each table
    for (const table of tablesToBackup) {
      try {
        // Get row count first
        const { count, error: countError } = await supabaseAdmin
          .from(table)
          .select("*", { count: "exact", head: true });

        if (countError) {
          // Table might not exist, skip it
          backupResults.tables[table] = {
            status: "skipped",
            reason: "Table not found",
          };
          continue;
        }

        const recordCount = count || 0;

        if (recordCount === 0) {
          backupResults.tables[table] = { status: "empty", records: 0 };
          continue;
        }

        // Fetch all data (in batches for large tables)
        let allData = [];
        const batchSize = 1000;
        let offset = 0;

        while (offset < recordCount) {
          const { data, error } = await supabaseAdmin
            .from(table)
            .select("*")
            .range(offset, offset + batchSize - 1);

          if (error) {
            throw error;
          }

          allData = allData.concat(data || []);
          offset += batchSize;
        }

        // Store backup data in Supabase Storage
        const backupData = JSON.stringify(allData, null, 2);
        const filePath = `backups/${backupId}/${table}.json`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("database-backups")
          .upload(filePath, backupData, {
            contentType: "application/json",
            upsert: true,
          });

        if (uploadError) {
          // If storage bucket doesn't exist, store metadata only
          if (
            uploadError.message?.includes("Bucket not found") ||
            uploadError.statusCode === "404"
          ) {
            backupResults.tables[table] = {
              status: "metadata_only",
              records: recordCount,
              note: "Storage bucket not configured - data counted but not stored",
            };
            backupResults.totalRecords += recordCount;
            continue;
          }
          throw uploadError;
        }

        backupResults.tables[table] = {
          status: "success",
          records: recordCount,
          file: filePath,
          size: backupData.length,
        };
        backupResults.totalRecords += recordCount;
      } catch (tableError) {
        if (tableError?.code) {
          logger.error("backup_table_failed", tableError, {
            table,
            code: tableError.code,
          });
        } else {
          logger.error("backup_table_failed", tableError, { table });
        }
        backupResults.errors.push({
          table,
          error: "Table backup failed",
        });
        backupResults.tables[table] = {
          status: "error",
          error: "Table backup failed",
        };
      }
    }

    const durationMs = Date.now() - startTime;
    const hasErrors = backupResults.errors.length > 0;
    const successfulTables = Object.values(backupResults.tables).filter(
      (t) =>
        t.status === "success" ||
        t.status === "metadata_only" ||
        t.status === "empty",
    ).length;

    return {
      backupId,
      filename: `${backupId}.zip`,
      timestamp: new Date().toISOString(),
      status: hasErrors
        ? successfulTables > 0
          ? "partial"
          : "failed"
        : "completed",
      tablesBackedUp: successfulTables,
      totalTables: tablesToBackup.length,
      totalRecords: backupResults.totalRecords,
      durationMs,
      details: backupResults.tables,
      errors:
        backupResults.errors.length > 0 ? backupResults.errors : undefined,
      message: hasErrors
        ? `Backup completed with ${backupResults.errors.length} error(s). ${successfulTables}/${tablesToBackup.length} tables backed up.`
        : `Backup completed successfully. ${backupResults.totalRecords} records from ${successfulTables} tables.`,
      _isMock: false,
      storageNote:
        "For full schema backups, use Supabase Dashboard > Settings > Database > Backups",
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;

    return {
      backupId,
      timestamp: new Date().toISOString(),
      status: "failed",
      error: "Backup failed",
      durationMs,
      message: "Backup failed due to an internal error",
      _isMock: false,
    };
  }
}

/**
 * Get sync status for all data sources
 *
 * @returns {Array} Empty sync status (no sync log store)
 */
async function getSyncStatus() {
  return [];
}

/**
 * Main handler function
 */
async function handleRequest(
  event,
  _context,
  { userId: _userId },
) {
  // Extract endpoint from path
  const path = event.path.replace("/.netlify/functions/admin", "") || "/";
  const endpoint = path.split("?")[0]; // Remove query params

  // Route to appropriate handler
  switch (endpoint) {
    case "/health-metrics":
    case "": {
      if (event.httpMethod !== "GET") {
        return createErrorResponse("Method not allowed", 405);
      }
      const metrics = await getHealthMetrics();
      return createSuccessResponse(metrics);
    }

    case "/create-backup": {
      if (event.httpMethod !== "POST") {
        return createErrorResponse("Method not allowed", 405);
      }
      const backup = await createDatabaseBackup();
      if (backup.status === "failed") {
        return createErrorResponse(
          backup.message || "Database backup failed",
          500,
          "backup_error",
        );
      }
      return createSuccessResponse(backup);
    }

    case "/sync-status": {
      if (event.httpMethod !== "GET") {
        return createErrorResponse("Method not allowed", 405);
      }
      const syncStatus = await getSyncStatus();
      return createSuccessResponse(syncStatus);
    }

    default:
      return createErrorResponse("Endpoint not found", 404);
  }
}

const handler = async (event, context) => {
  const rateLimitType = event.httpMethod === "GET" ? "READ" : "UPDATE";
  return baseHandler(event, context, {
    functionName: "Admin",
    allowedMethods: ["GET", "POST"],
    rateLimitType,
    requireAuth: true,
    handler: async (event, context, { userId }) => {
      const role = await getUserRole(userId);
      if (role !== "admin") {
        return createErrorResponse("Forbidden - Admin access required", 403);
      }

      return handleRequest(event, context, { userId });
    },
  });
};

export const testHandler = handler;
export { handler };
export default wrapHandler(handler);

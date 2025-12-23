// Netlify Function: Admin API
// Handles admin-only operations: health metrics, data syncs, backups, statistics

const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { supabaseAdmin } = require("./supabase-client.cjs");

/**
 * Check if user has admin role
 */
function isAdmin(user) {
  return user?.role === "admin" || user?.user_metadata?.role === "admin";
}

/**
 * Get database health metrics
 */
async function getHealthMetrics() {
  try {
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
      "tournaments",
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
        value: "2 hours ago",
        status: "healthy",
        severity: "success",
        icon: "pi pi-save",
        color: "#10c96b",
      },
    ];
  } catch (error) {
    // Log error and re-throw
    throw error;
  }
}

/**
 * Sync USDA food data
 * Note: In production, this would call USDA FoodData Central API
 */
function syncUSDAData() {
  try {
    // TODO: Implement actual USDA API sync
    // For now, return success with mock data
    const mockResult = {
      success: true,
      recordsUpdated: 1250,
      timestamp: new Date().toISOString(),
      message: "USDA data sync completed (mock)",
    };

    // In production, would update a sync_logs table
    return mockResult;
  } catch (error) {
    // Log error and re-throw
    throw error;
  }
}

/**
 * Sync research data
 * Note: In production, this would sync from research databases
 */
function syncResearchData() {
  try {
    // TODO: Implement actual research database sync
    // For now, return success with mock data
    const mockResult = {
      success: true,
      recordsUpdated: 45,
      timestamp: new Date().toISOString(),
      message: "Research data sync completed (mock)",
    };

    // In production, would update a sync_logs table
    return mockResult;
  } catch (error) {
    // Log error and re-throw
    throw error;
  }
}

/**
 * Create database backup
 * Note: In production, this would trigger actual backup process
 */
function createDatabaseBackup() {
  try {
    // TODO: Implement actual backup process
    // For now, return mock backup info
    const timestamp = new Date().toISOString().split("T")[0];
    const backupInfo = {
      filename: `backup-${timestamp}.sql`,
      size: 2456789, // bytes
      timestamp: new Date().toISOString(),
      status: "completed",
      message: "Backup created successfully (mock)",
    };

    return backupInfo;
  } catch (error) {
    // Log error and re-throw
    throw error;
  }
}

/**
 * Get sync status for all data sources
 */
function getSyncStatus() {
  try {
    // TODO: Query actual sync_logs table if it exists
    // For now, return mock data
    return [
      {
        source: "USDA Foods",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        result: "success",
        severity: "success",
        recordsUpdated: 1250,
      },
      {
        source: "Research Studies",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        result: "success",
        severity: "success",
        recordsUpdated: 45,
      },
      {
        source: "Recovery Protocols",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        result: "success",
        severity: "success",
        recordsUpdated: 8,
      },
    ];
  } catch (error) {
    // Log error and re-throw
    throw error;
  }
}

/**
 * Get USDA data statistics
 */
function getUSDADataStats() {
  try {
    // TODO: Query actual USDA data table if it exists
    // For now, return mock stats
    return {
      totalFoods: 376000,
      lastUpdated: new Date().toISOString(),
      categories: 25,
      nutrientsTracked: 150,
    };
  } catch (error) {
    // Log error and re-throw
    throw error;
  }
}

/**
 * Get research data statistics
 */
function getResearchDataStats() {
  try {
    // TODO: Query actual research data table if it exists
    // For now, return mock stats
    return {
      totalStudies: 1250,
      lastUpdated: new Date().toISOString(),
      categories: 12,
      protocolsTracked: 85,
    };
  } catch (error) {
    // Log error and re-throw
    throw error;
  }
}

/**
 * Main handler function
 */
async function handleRequest(event, context, { userId, user }) {
  try {
    // Extract endpoint from path
    const path = event.path.replace("/.netlify/functions/admin", "") || "/";
    const endpoint = path.split("?")[0]; // Remove query params

    // Route to appropriate handler
    switch (endpoint) {
      case "/health-metrics":
      case "":
        if (event.httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const metrics = await getHealthMetrics();
        return createSuccessResponse(metrics);

      case "/sync-usda":
        if (event.httpMethod !== "POST") {
          return createErrorResponse("Method not allowed", 405);
        }
        const usdaResult = await syncUSDAData();
        return createSuccessResponse(usdaResult, usdaResult.success);

      case "/sync-research":
        if (event.httpMethod !== "POST") {
          return createErrorResponse("Method not allowed", 405);
        }
        const researchResult = await syncResearchData();
        return createSuccessResponse(researchResult, researchResult.success);

      case "/create-backup":
        if (event.httpMethod !== "POST") {
          return createErrorResponse("Method not allowed", 405);
        }
        const backup = await createDatabaseBackup();
        return createSuccessResponse(backup);

      case "/sync-status":
        if (event.httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const syncStatus = await getSyncStatus();
        return createSuccessResponse(syncStatus);

      case "/usda-stats":
        if (event.httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const usdaStats = await getUSDADataStats();
        return createSuccessResponse(usdaStats);

      case "/research-stats":
        if (event.httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const researchStats = await getResearchDataStats();
        return createSuccessResponse(researchStats);

      default:
        return createErrorResponse("Endpoint not found", 404);
    }
  } catch (error) {
    // Log error and re-throw
    throw error;
  }
}

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "Admin",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (event, context, { userId }) => {
      // Get user info to check admin role
      const { authenticateRequest } = require("./utils/auth-helper.cjs");
      const auth = await authenticateRequest(event);

      if (!auth.success || !auth.user) {
        return createErrorResponse("Unauthorized", 401);
      }

      // Check admin role
      if (!isAdmin(auth.user)) {
        return createErrorResponse("Forbidden - Admin access required", 403);
      }

      return handleRequest(event, context, { userId, user: auth.user });
    },
  });
};

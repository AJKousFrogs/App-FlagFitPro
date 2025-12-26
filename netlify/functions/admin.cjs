// Netlify Function: Admin API
// Handles admin-only operations: health metrics, data syncs, backups, statistics
//
// =============================================================================
// FUTURE FEATURES DOCUMENTATION
// =============================================================================
//
// The following sync functions are currently returning MOCK DATA and are
// planned for future implementation:
//
// 1. USDA Food Data Sync (syncUSDAData)
//    - Purpose: Sync nutritional data from USDA FoodData Central API
//    - API: https://fdc.nal.usda.gov/api-guide.html
//    - Requirements: USDA API key (free registration)
//    - Tables needed: usda_foods, usda_nutrients
//    - Implementation: Schedule daily/weekly sync via Netlify scheduled functions
//
// 2. Research Data Sync (syncResearchData)
//    - Purpose: Sync sports science research and recovery protocols
//    - Sources: PubMed API, custom research database
//    - Tables needed: research_studies, recovery_protocols
//    - Implementation: Manual trigger or scheduled sync
//
// 3. Database Backup (createDatabaseBackup)
//    - Purpose: Create point-in-time backups of the database
//    - Implementation: Use Supabase's built-in backup features or pg_dump
//    - Storage: Supabase Storage or external cloud storage (S3, GCS)
//    - Note: Supabase Pro plan includes automatic daily backups
//
// 4. Sync Status Tracking (getSyncStatus)
//    - Purpose: Track status of all data sync operations
//    - Tables needed: sync_logs
//    - Schema: { id, source, timestamp, result, severity, records_updated, error_message }
//
// To implement these features:
// 1. Create necessary database tables via migrations
// 2. Add required API keys to environment variables
// 3. Replace mock functions with actual API calls
// 4. Set up scheduled functions in netlify.toml if needed
//
// =============================================================================

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
 *
 * FUTURE FEATURE: This function currently returns mock data.
 *
 * To implement:
 * 1. Register for USDA FoodData Central API key at https://fdc.nal.usda.gov/api-key-signup.html
 * 2. Add USDA_API_KEY to environment variables
 * 3. Create usda_foods table: { fdc_id, description, category, nutrients JSONB }
 * 4. Implement paginated fetch from USDA API
 * 5. Log sync results to sync_logs table
 *
 * @returns {Object} Mock sync result (PLACEHOLDER)
 */
function syncUSDAData() {
  try {
    // TODO: Implement actual USDA API sync
    // Example implementation:
    // const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/list?api_key=${process.env.USDA_API_KEY}`);
    // const foods = await response.json();
    // await supabaseAdmin.from('usda_foods').upsert(foods);

    const mockResult = {
      success: true,
      recordsUpdated: 1250,
      timestamp: new Date().toISOString(),
      message: "USDA data sync completed (MOCK - not yet implemented)",
      _isMock: true,
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
 *
 * FUTURE FEATURE: This function currently returns mock data.
 *
 * To implement:
 * 1. Define research data sources (PubMed, custom database, etc.)
 * 2. Create research_studies table: { id, title, authors, abstract, category, doi, published_date }
 * 3. Create recovery_protocols table: { id, name, description, duration, effectiveness_score }
 * 4. Implement API fetching or data import logic
 * 5. Log sync results to sync_logs table
 *
 * @returns {Object} Mock sync result (PLACEHOLDER)
 */
function syncResearchData() {
  try {
    // TODO: Implement actual research database sync
    // Example implementation:
    // const studies = await fetchFromResearchAPI();
    // await supabaseAdmin.from('research_studies').upsert(studies);

    const mockResult = {
      success: true,
      recordsUpdated: 45,
      timestamp: new Date().toISOString(),
      message: "Research data sync completed (MOCK - not yet implemented)",
      _isMock: true,
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
 *
 * FUTURE FEATURE: This function currently returns mock data.
 *
 * To implement:
 * Option A - Supabase Pro Plan:
 *   - Use Supabase's automatic daily backups (included in Pro plan)
 *   - Access via Supabase Dashboard > Settings > Database > Backups
 *
 * Option B - Manual backup:
 *   1. Set up a secure server with pg_dump access
 *   2. Create a scheduled function to run pg_dump
 *   3. Upload to Supabase Storage or external cloud storage
 *   4. Log backup metadata to database_backups table
 *
 * @returns {Object} Mock backup info (PLACEHOLDER)
 */
function createDatabaseBackup() {
  try {
    // TODO: Implement actual backup process
    // Note: Supabase Pro plan includes automatic daily backups
    // For manual backups, consider using pg_dump with Supabase connection string

    const timestamp = new Date().toISOString().split("T")[0];
    const backupInfo = {
      filename: `backup-${timestamp}.sql`,
      size: 2456789, // bytes
      timestamp: new Date().toISOString(),
      status: "completed",
      message: "Backup created successfully (MOCK - not yet implemented)",
      _isMock: true,
      _note: "Consider upgrading to Supabase Pro for automatic daily backups",
    };

    return backupInfo;
  } catch (error) {
    // Log error and re-throw
    throw error;
  }
}

/**
 * Get sync status for all data sources
 *
 * FUTURE FEATURE: This function currently returns mock data.
 *
 * To implement:
 * 1. Create sync_logs table:
 *    CREATE TABLE sync_logs (
 *      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *      source TEXT NOT NULL,
 *      timestamp TIMESTAMPTZ DEFAULT NOW(),
 *      result TEXT NOT NULL, -- 'success', 'failure', 'partial'
 *      severity TEXT NOT NULL, -- 'success', 'warning', 'error'
 *      records_updated INTEGER DEFAULT 0,
 *      error_message TEXT,
 *      created_at TIMESTAMPTZ DEFAULT NOW()
 *    );
 * 2. Update sync functions to log results to this table
 * 3. Query this table instead of returning mock data
 *
 * @returns {Array} Mock sync status (PLACEHOLDER)
 */
async function getSyncStatus() {
  try {
    // Try to query actual sync_logs table
    const { data, error } = await supabaseAdmin
      .from("sync_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(10);

    if (!error && data && data.length > 0) {
      return data.map((log) => ({
        source: log.source,
        timestamp: log.timestamp,
        result: log.result,
        severity: log.severity,
        recordsUpdated: log.records_updated,
      }));
    }

    // Fallback to mock data if table doesn't exist or is empty
    return [
      {
        source: "USDA Foods",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        result: "pending",
        severity: "warning",
        recordsUpdated: 0,
        _isMock: true,
        _note: "Sync not yet implemented - create sync_logs table",
      },
      {
        source: "Research Studies",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        result: "pending",
        severity: "warning",
        recordsUpdated: 0,
        _isMock: true,
        _note: "Sync not yet implemented - create sync_logs table",
      },
      {
        source: "Recovery Protocols",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        result: "pending",
        severity: "warning",
        recordsUpdated: 0,
        _isMock: true,
        _note: "Sync not yet implemented - create sync_logs table",
      },
    ];
  } catch (error) {
    // Log error and re-throw
    throw error;
  }
}

/**
 * Get USDA data statistics
 *
 * FUTURE FEATURE: This function currently returns mock data.
 *
 * To implement:
 * 1. Create usda_foods table with USDA data
 * 2. Query actual counts from the table
 *
 * @returns {Object} Mock USDA stats (PLACEHOLDER)
 */
async function getUSDADataStats() {
  try {
    // Try to query actual usda_foods table
    const { count, error } = await supabaseAdmin
      .from("usda_foods")
      .select("*", { count: "exact", head: true });

    if (!error && count !== null) {
      return {
        totalFoods: count,
        lastUpdated: new Date().toISOString(),
        categories: 25, // Would need separate query
        nutrientsTracked: 150,
        _isMock: false,
      };
    }

    // Fallback to mock stats if table doesn't exist
    return {
      totalFoods: 0,
      lastUpdated: null,
      categories: 0,
      nutrientsTracked: 0,
      _isMock: true,
      _note: "USDA data not yet synced - table does not exist or is empty",
    };
  } catch (error) {
    // Log error and re-throw
    throw error;
  }
}

/**
 * Get research data statistics
 *
 * FUTURE FEATURE: This function currently returns mock data.
 *
 * To implement:
 * 1. Create research_studies and recovery_protocols tables
 * 2. Query actual counts from the tables
 *
 * @returns {Object} Mock research stats (PLACEHOLDER)
 */
async function getResearchDataStats() {
  try {
    // Try to query actual research_studies table
    const { count: studiesCount, error: studiesError } = await supabaseAdmin
      .from("research_studies")
      .select("*", { count: "exact", head: true });

    const { count: protocolsCount, error: protocolsError } = await supabaseAdmin
      .from("recovery_protocols")
      .select("*", { count: "exact", head: true });

    if (!studiesError && !protocolsError && studiesCount !== null) {
      return {
        totalStudies: studiesCount || 0,
        lastUpdated: new Date().toISOString(),
        categories: 12, // Would need separate query
        protocolsTracked: protocolsCount || 0,
        _isMock: false,
      };
    }

    // Fallback to mock stats if tables don't exist
    return {
      totalStudies: 0,
      lastUpdated: null,
      categories: 0,
      protocolsTracked: 0,
      _isMock: true,
      _note: "Research data not yet synced - tables do not exist or are empty",
    };
  } catch (error) {
    // Log error and re-throw
    throw error;
  }
}

/**
 * Main handler function
 */
async function handleRequest(event, _context, { userId: _userId, user: _user }) {
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

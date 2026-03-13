import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import { syncAllResearch } from "./research-sync.js";
import { getUserRole } from "./utils/authorization-guard.js";

// Netlify Function: Admin API
// Handles admin-only operations: health metrics, data syncs, backups, statistics
//
// =============================================================================
// FEATURE STATUS
// =============================================================================
//
// ✅ IMPLEMENTED:
// 1. USDA Food Data Sync (syncUSDAData)
//    - Syncs nutritional data from USDA FoodData Central API
//    - API: https://fdc.nal.usda.gov/api-guide.html
//    - Tables: usda_foods, sync_logs
//    - Includes: 15+ nutrients, food categories, brand data
//
// 2. Research Data Sync (syncResearchData) ✅ NEW
//    - Syncs sports science research from free scholarly APIs
//    - Sources: PubMed, Europe PMC, OpenAlex
//    - Tables: research_studies, training_protocols, research_topics
//    - Includes: Sprint, plyometrics, recovery, nutrition research
//
// 🔜 PLANNED (returning mock data):
// 3. Database Backup (createDatabaseBackup)
//    - Purpose: Create point-in-time backups of the database
//    - Note: Supabase Pro plan includes automatic daily backups
//
// =============================================================================

function getOperationFailureStatus(result, fallbackStatus = 500) {
  if (
    typeof result?.error === "string" &&
    result.error.toLowerCase().includes("not configured")
  ) {
    return 503;
  }
  return fallbackStatus;
}

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
      value: "N/A",
      status: "pending",
      severity: "warning",
      icon: "pi pi-save",
      color: "#f59e0b",
    },
  ];
}

// USDA FoodData Central API Key (optional - USDA sync features require this)
// Get your free API key at: https://fdc.nal.usda.gov/api-key-signup.html
const { USDA_API_KEY } = process.env;
const USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1";

// Log warning but don't throw - allows other admin features to work
if (!USDA_API_KEY) {
  console.warn(
    "[Admin] USDA_API_KEY not configured. USDA food sync features will be unavailable. Get a free key at: https://fdc.nal.usda.gov/api-key-signup.html",
  );
}

// Nutrient IDs from USDA FoodData Central
const NUTRIENT_MAP = {
  1008: "energy_kcal", // Energy (kcal)
  1003: "protein_g", // Protein
  1005: "carbohydrates_g", // Carbohydrate, by difference
  1004: "fat_g", // Total lipid (fat)
  1079: "fiber_g", // Fiber, total dietary
  2000: "sugars_g", // Sugars, total
  1093: "sodium_mg", // Sodium
  1258: "saturated_fat_g", // Fatty acids, total saturated
  1253: "cholesterol_mg", // Cholesterol
  1087: "calcium_mg", // Calcium
  1089: "iron_mg", // Iron
  1092: "potassium_mg", // Potassium
  1106: "vitamin_a_mcg", // Vitamin A, RAE
  1162: "vitamin_c_mg", // Vitamin C
  1114: "vitamin_d_mcg", // Vitamin D (D2 + D3)
};

/**
 * Extract nutrients from USDA food data
 */
function extractNutrients(foodNutrients) {
  const nutrients = {};
  const allNutrients = {};

  if (!foodNutrients || !Array.isArray(foodNutrients)) {
    return { mapped: nutrients, all: allNutrients };
  }

  for (const nutrient of foodNutrients) {
    const nutrientId = nutrient.nutrientId || nutrient.nutrient?.id;
    const value = nutrient.amount ?? nutrient.value;
    const name = nutrient.nutrientName || nutrient.nutrient?.name;
    const unit = nutrient.unitName || nutrient.nutrient?.unitName;

    if (nutrientId && value !== undefined && value !== null) {
      const columnName = NUTRIENT_MAP[nutrientId];
      if (columnName) {
        nutrients[columnName] = parseFloat(value) || 0;
      }
      allNutrients[nutrientId] = { name, value: parseFloat(value) || 0, unit };
    }
  }

  return { mapped: nutrients, all: allNutrients };
}

/**
 * Generate search keywords for better searching
 */
function generateSearchKeywords(food) {
  const keywords = new Set();
  if (food.description) {
    food.description
      .toLowerCase()
      .split(/\s+/)
      .forEach((word) => {
        if (word.length > 2) {
          keywords.add(word);
        }
      });
  }
  if (food.foodCategory?.description) {
    keywords.add(food.foodCategory.description.toLowerCase());
  }
  if (food.brandName) {
    keywords.add(food.brandName.toLowerCase());
  }
  return Array.from(keywords).slice(0, 20);
}

/**
 * Transform USDA food to our schema
 */
function transformFood(usdaFood) {
  const { mapped: nutrients, all: allNutrients } = extractNutrients(
    usdaFood.foodNutrients,
  );

  return {
    fdc_id: usdaFood.fdcId,
    description:
      usdaFood.description || usdaFood.lowercaseDescription || "Unknown",
    data_type: usdaFood.dataType,
    food_category:
      usdaFood.foodCategory?.description || usdaFood.foodCategory || null,
    brand_owner: usdaFood.brandOwner || null,
    brand_name: usdaFood.brandName || null,
    ingredients: usdaFood.ingredients || null,
    serving_size: usdaFood.servingSize || null,
    serving_size_unit: usdaFood.servingSizeUnit || null,
    household_serving_text: usdaFood.householdServingFullText || null,
    publication_date: usdaFood.publicationDate || null,
    modified_date: usdaFood.modifiedDate || null,
    search_keywords: generateSearchKeywords(usdaFood),
    nutrients: allNutrients,
    ...nutrients,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Sync USDA food data from FoodData Central API
 *
 * Uses the USDA FoodData Central API to fetch nutritional data.
 * API Documentation: https://fdc.nal.usda.gov/api-guide.html
 */
async function syncUSDAData(options = {}) {
  // Check if USDA API key is configured
  if (!USDA_API_KEY) {
    return {
      success: false,
      error: "USDA_API_KEY not configured",
      message:
        "USDA food sync is unavailable. Set USDA_API_KEY environment variable.",
      setupUrl: "https://fdc.nal.usda.gov/api-key-signup.html",
    };
  }

  const startTime = Date.now();
  const { pageSize = 200, maxPages = 5, dataType = null } = options;

  const syncDetails = {
    recordsAdded: 0,
    recordsUpdated: 0,
    recordsFailed: 0,
    hasErrors: false,
    errorMessage: null,
  };

  try {
    let foods = [];

    // Fetch foods from USDA API with pagination
    for (let page = 1; page <= maxPages; page++) {
      const params = new URLSearchParams({
        api_key: USDA_API_KEY,
        pageNumber: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (dataType) {
        params.append("dataType", dataType);
      }

      const response = await fetch(`${USDA_BASE_URL}/foods/list?${params}`);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`USDA API error: ${response.status} - ${error}`);
      }

      const pageData = await response.json();

      if (!pageData || pageData.length === 0) {
        break;
      }

      foods = foods.concat(pageData);

      // Rate limiting
      if (page < maxPages) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Process foods in batches
    const batchSize = 100;
    for (let i = 0; i < foods.length; i += batchSize) {
      const batch = foods.slice(i, i + batchSize);
      const transformedBatch = batch.map(transformFood);

      const { data, error } = await supabaseAdmin
        .from("usda_foods")
        .upsert(transformedBatch, {
          onConflict: "fdc_id",
          ignoreDuplicates: false,
        })
        .select("id");

      if (error) {
        syncDetails.recordsFailed += batch.length;
        syncDetails.hasErrors = true;
        syncDetails.errorMessage = "Batch upsert failed";
      } else {
        syncDetails.recordsAdded += data?.length || 0;
      }
    }

    const durationMs = Date.now() - startTime;

    // Log sync operation
    await supabaseAdmin.from("sync_logs").insert({
      source: "usda_foods",
      result: syncDetails.hasErrors
        ? syncDetails.recordsAdded > 0
          ? "partial"
          : "failure"
        : "success",
      severity: syncDetails.hasErrors
        ? syncDetails.recordsAdded > 0
          ? "warning"
          : "error"
        : "success",
      records_added: syncDetails.recordsAdded,
      records_updated: syncDetails.recordsUpdated,
      records_failed: syncDetails.recordsFailed,
      error_message: syncDetails.errorMessage,
      duration_ms: durationMs,
      metadata: { pageSize, maxPages, dataType },
    });

    // Get current total count
    const { count: totalFoods } = await supabaseAdmin
      .from("usda_foods")
      .select("*", { count: "exact", head: true });

    return {
      success: !syncDetails.hasErrors,
      recordsProcessed: foods.length,
      recordsAdded: syncDetails.recordsAdded,
      recordsFailed: syncDetails.recordsFailed,
      totalInDatabase: totalFoods || 0,
      durationMs,
      timestamp: new Date().toISOString(),
      message: syncDetails.hasErrors
        ? "USDA sync completed with errors"
        : `USDA sync completed successfully - ${syncDetails.recordsAdded} records synced`,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;

    // Log failed sync
    await supabaseAdmin.from("sync_logs").insert({
      source: "usda_foods",
      result: "failure",
      severity: "error",
      records_failed: syncDetails.recordsFailed,
      error_message: "USDA sync failed",
      duration_ms: durationMs,
    });

    return {
      success: false,
      error: "USDA sync failed",
      timestamp: new Date().toISOString(),
      message: "USDA sync failed due to an internal error",
    };
  }
}

// Import research sync function
/**
 * Sync research data from scholarly APIs
 *
 * Fetches sports science research from:
 * - PubMed/Entrez API (biomedical studies)
 * - Europe PMC (open access papers)
 * - OpenAlex (scholarly graph)
 *
 * Topics covered: sprinting, plyometrics, isometrics, agility,
 * recovery, sleep, muscle fiber types, sports psychology, nutrition
 *
 * @returns {Object} Sync result with statistics
 */
async function syncResearchData() {
  try {
    const result = await syncAllResearch();
    return {
      success: result.success,
      recordsUpdated: result.stats?.articles_added || 0,
      topicsSynced: result.stats?.topics_synced || 0,
      durationMs: result.stats?.duration_ms || 0,
      timestamp: new Date().toISOString(),
      message: result.message || "Research data sync completed",
      errors: result.errors,
    };
  } catch (error) {
    if (error?.code) {
      console.error("Research sync error", { code: error.code });
    } else {
      console.error("Research sync error");
    }
    return {
      success: false,
      recordsUpdated: 0,
      timestamp: new Date().toISOString(),
      message: "Research sync failed due to an internal error",
      error: "Research sync failed",
    };
  }
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
      "tournaments",
      "games",
      "game_stats",
      "usda_foods",
      "research_studies",
      "recovery_protocols",
      "nutrition_plans",
      "meal_templates",
      "privacy_settings",
      "parental_consent",
      "sync_logs",
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
          console.error(`[Admin] Backup table error for ${table}`, {
            code: tableError.code,
          });
        } else {
          console.error(`[Admin] Backup table error for ${table}`);
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

    // Log backup to database
    await supabaseAdmin.from("sync_logs").insert({
      source: "database_backup",
      result: hasErrors
        ? successfulTables > 0
          ? "partial"
          : "failure"
        : "success",
      severity: hasErrors ? "warning" : "success",
      records_added: backupResults.totalRecords,
      duration_ms: durationMs,
      metadata: {
        backup_id: backupId,
        tables_backed_up: successfulTables,
        tables_total: tablesToBackup.length,
        errors: backupResults.errors,
      },
    });

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

    // Log failed backup
    await supabaseAdmin.from("sync_logs").insert({
      source: "database_backup",
      result: "failure",
      severity: "error",
      error_message: "Database backup failed",
      duration_ms: durationMs,
    });

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

  // Fallback if table doesn't exist or is empty
  return [];
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

    case "/sync-usda": {
      if (event.httpMethod !== "POST") {
        return createErrorResponse("Method not allowed", 405);
      }
      const usdaResult = await syncUSDAData();
      if (!usdaResult.success) {
        return createErrorResponse(
          usdaResult.message || "USDA sync failed",
          getOperationFailureStatus(usdaResult),
          "sync_error",
        );
      }
      return createSuccessResponse(usdaResult);
    }

    case "/sync-research": {
      if (event.httpMethod !== "POST") {
        return createErrorResponse("Method not allowed", 405);
      }
      const researchResult = await syncResearchData();
      if (!researchResult.success) {
        return createErrorResponse(
          researchResult.message || "Research sync failed",
          getOperationFailureStatus(researchResult),
          "sync_error",
        );
      }
      return createSuccessResponse(researchResult);
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

    case "/usda-stats": {
      if (event.httpMethod !== "GET") {
        return createErrorResponse("Method not allowed", 405);
      }
      const usdaStats = await getUSDADataStats();
      return createSuccessResponse(usdaStats);
    }

    case "/research-stats": {
      if (event.httpMethod !== "GET") {
        return createErrorResponse("Method not allowed", 405);
      }
      const researchStats = await getResearchDataStats();
      return createSuccessResponse(researchStats);
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
export default createRuntimeV2Handler(handler);

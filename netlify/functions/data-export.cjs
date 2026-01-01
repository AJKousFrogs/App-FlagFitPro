// Netlify Function: GDPR Data Export API
// Handles user data export requests for GDPR compliance
//
// Implements:
// - Right to Access (Article 15 GDPR)
// - Data Portability (Article 20 GDPR)
//
// Exports all user data in a structured, machine-readable format (JSON)
//
// =============================================================================

const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { supabaseAdmin } = require("./supabase-client.cjs");

// =============================================================================
// DATA EXPORT CONFIGURATION
// =============================================================================

// Tables containing user data (ordered for export)
const USER_DATA_TABLES = [
  {
    table: "users",
    userIdColumn: "id",
    description: "User profile and account information",
    sensitiveFields: ["password_hash"], // Fields to exclude
    exportName: "profile",
  },
  {
    table: "privacy_settings",
    userIdColumn: "user_id",
    description: "Privacy preferences and consent settings",
    exportName: "privacy_settings",
  },
  {
    table: "parental_consent",
    userIdColumn: "minor_user_id",
    description: "Parental consent records (for minors)",
    sensitiveFields: ["verification_token"],
    exportName: "parental_consent",
  },
  {
    table: "athlete_nutrition_profiles",
    userIdColumn: "user_id",
    description: "Nutrition profile and calculations",
    exportName: "nutrition_profile",
  },
  {
    table: "nutrition_plans",
    userIdColumn: "user_id",
    description: "Nutrition plans",
    exportName: "nutrition_plans",
  },
  {
    table: "athlete_recovery_profiles",
    userIdColumn: "user_id",
    description: "Recovery preferences and profile",
    exportName: "recovery_profile",
  },
  {
    table: "recovery_sessions",
    userIdColumn: "user_id",
    description: "Logged recovery sessions",
    exportName: "recovery_sessions",
  },
  {
    table: "training_sessions",
    userIdColumn: "user_id",
    description: "Training session records",
    exportName: "training_sessions",
  },
  {
    table: "training_exercises",
    userIdColumn: "user_id",
    description: "Individual exercise records",
    exportName: "training_exercises",
  },
  {
    table: "athlete_performance_metrics",
    userIdColumn: "user_id",
    description: "Performance metrics and measurements",
    exportName: "performance_metrics",
  },
  {
    table: "game_stats",
    userIdColumn: "player_id",
    description: "Game statistics",
    exportName: "game_stats",
  },
  {
    table: "team_members",
    userIdColumn: "user_id",
    description: "Team memberships",
    exportName: "team_memberships",
  },
  {
    table: "posts",
    userIdColumn: "author_id",
    description: "Posts and content created",
    exportName: "posts",
  },
  {
    table: "comments",
    userIdColumn: "author_id",
    description: "Comments on posts",
    exportName: "comments",
  },
  {
    table: "user_notification_tokens",
    userIdColumn: "user_id",
    description: "Push notification registrations",
    sensitiveFields: ["token", "subscription_data"],
    exportName: "notification_settings",
  },
  {
    table: "push_notification_preferences",
    userIdColumn: "user_id",
    description: "Notification preferences",
    exportName: "notification_preferences",
  },
  {
    table: "privacy_audit_log",
    userIdColumn: "user_id",
    description: "Privacy-related actions audit trail",
    exportName: "privacy_audit_log",
  },
];

// =============================================================================
// DATA EXPORT FUNCTIONS
// =============================================================================

/**
 * Remove sensitive fields from data
 */
function sanitizeData(data, sensitiveFields = []) {
  if (!data) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, sensitiveFields));
  }

  if (typeof data === "object") {
    const sanitized = { ...data };
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = "[REDACTED]";
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * Export data from a single table for a user
 */
async function exportTableData(tableConfig, userId) {
  const {
    table,
    userIdColumn,
    sensitiveFields = [],
    exportName,
    description,
  } = tableConfig;

  try {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("*")
      .eq(userIdColumn, userId);

    if (error) {
      // Table might not exist or user might not have access
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return {
          name: exportName,
          description,
          status: "skipped",
          reason: "Table not found",
          records: 0,
        };
      }
      throw error;
    }

    const sanitizedData = sanitizeData(data, sensitiveFields);

    return {
      name: exportName,
      description,
      status: "success",
      records: sanitizedData?.length || 0,
      data: sanitizedData,
    };
  } catch (error) {
    return {
      name: exportName,
      description,
      status: "error",
      error: error.message,
      records: 0,
    };
  }
}

/**
 * Generate complete data export for a user
 */
async function generateDataExport(userId) {
  const startTime = Date.now();
  const exportId = `export-${userId}-${Date.now()}`;

  const exportData = {
    exportId,
    exportDate: new Date().toISOString(),
    userId,
    format: "JSON",
    gdprArticles: [
      "Article 15 (Right of Access)",
      "Article 20 (Data Portability)",
    ],
    sections: {},
    summary: {
      tablesExported: 0,
      tablesSkipped: 0,
      tablesError: 0,
      totalRecords: 0,
    },
  };

  // Export data from each table
  for (const tableConfig of USER_DATA_TABLES) {
    const result = await exportTableData(tableConfig, userId);

    exportData.sections[result.name] = result;

    if (result.status === "success") {
      exportData.summary.tablesExported++;
      exportData.summary.totalRecords += result.records;
    } else if (result.status === "skipped") {
      exportData.summary.tablesSkipped++;
    } else {
      exportData.summary.tablesError++;
    }
  }

  exportData.summary.durationMs = Date.now() - startTime;

  // Log the export request
  await supabaseAdmin
    .from("gdpr_data_processing_log")
    .insert({
      user_id: userId,
      operation_type: "data_export",
      status: "completed",
      details: {
        export_id: exportId,
        tables_exported: exportData.summary.tablesExported,
        total_records: exportData.summary.totalRecords,
      },
    })
    .catch((err) => {
      console.warn("Failed to log data export:", err);
    });

  return exportData;
}

/**
 * Generate a summary of what data is stored (without actual data)
 */
async function generateDataInventory(userId) {
  const inventory = {
    userId,
    generatedAt: new Date().toISOString(),
    categories: [],
  };

  for (const tableConfig of USER_DATA_TABLES) {
    const { table, userIdColumn, exportName, description } = tableConfig;

    try {
      const { count, error } = await supabaseAdmin
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq(userIdColumn, userId);

      if (!error) {
        inventory.categories.push({
          name: exportName,
          description,
          recordCount: count || 0,
          hasData: (count || 0) > 0,
        });
      }
    } catch {
      // Skip tables that don't exist
    }
  }

  return inventory;
}

/**
 * Check export request status
 */
async function getExportRequestStatus(userId) {
  const { data, error } = await supabaseAdmin
    .from("gdpr_data_processing_log")
    .select("*")
    .eq("user_id", userId)
    .eq("operation_type", "data_export")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw error;
  }

  return {
    recentExports: data || [],
    lastExport: data?.[0] || null,
  };
}

/**
 * Request data export (for async processing of large exports)
 */
async function requestDataExport(userId, options = {}) {
  const { format = "json", deliveryMethod = "download" } = options;

  // Log the request
  const { data: request, error } = await supabaseAdmin
    .from("gdpr_data_processing_log")
    .insert({
      user_id: userId,
      operation_type: "data_export_request",
      status: "pending",
      details: {
        format,
        delivery_method: deliveryMethod,
        requested_at: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    requestId: request.id,
    status: "pending",
    message: "Data export request received. Processing will begin shortly.",
    estimatedTime: "5-10 minutes",
  };
}

// =============================================================================
// REQUEST HANDLER
// =============================================================================

async function handleRequest(event, _context, { userId }) {
  const path =
    event.path
      .replace("/.netlify/functions/data-export", "")
      .replace(/^\/api\/data-export\/?/, "")
      .replace(/^\//, "") || "";

  let body = {};
  if (event.body && event.httpMethod === "POST") {
    try {
      body = JSON.parse(event.body);
    } catch {
      return createErrorResponse("Invalid JSON body", 400, "invalid_json");
    }
  }

  try {
    // Get data inventory (summary without actual data)
    if (event.httpMethod === "GET" && path === "inventory") {
      const inventory = await generateDataInventory(userId);
      return createSuccessResponse(inventory);
    }

    // Get export request status
    if (event.httpMethod === "GET" && path === "status") {
      const status = await getExportRequestStatus(userId);
      return createSuccessResponse(status);
    }

    // Request data export (async for large exports)
    if (event.httpMethod === "POST" && path === "request") {
      const request = await requestDataExport(userId, body);
      return createSuccessResponse(request, null, 202);
    }

    // Generate and download data export immediately
    if (event.httpMethod === "GET" && (path === "download" || path === "")) {
      const exportData = await generateDataExport(userId);

      // Return as downloadable JSON
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="flagfit-data-export-${userId}-${Date.now()}.json"`,
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: JSON.stringify(exportData, null, 2),
      };
    }

    // Generate data export (returns in response)
    if (event.httpMethod === "POST" && path === "generate") {
      const exportData = await generateDataExport(userId);
      return createSuccessResponse(exportData);
    }

    // Get information about what data is collected
    if (event.httpMethod === "GET" && path === "info") {
      return createSuccessResponse({
        dataCategories: USER_DATA_TABLES.map((t) => ({
          name: t.exportName,
          description: t.description,
          table: t.table,
        })),
        gdprRights: {
          access:
            "You have the right to access all personal data we hold about you (Article 15)",
          portability:
            "You have the right to receive your data in a machine-readable format (Article 20)",
          erasure:
            "You have the right to request deletion of your data (Article 17) - use /account-deletion endpoint",
          rectification:
            "You have the right to correct inaccurate data (Article 16) - update via profile settings",
        },
        exportFormats: ["JSON"],
        retentionPolicy:
          "Data is retained for 3 years after account deletion for legal compliance, then permanently deleted",
        contact: "privacy@flagfitpro.com",
      });
    }

    return createErrorResponse("Endpoint not found", 404, "not_found");
  } catch (error) {
    console.error("Data export error:", error);
    throw error;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "data-export",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "CREATE", // Rate limit exports to prevent abuse
    requireAuth: true,
    handler: handleRequest,
  });
};

// Export for use in other modules
exports.generateDataExport = generateDataExport;
exports.generateDataInventory = generateDataInventory;

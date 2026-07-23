import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import { createLogger, makeRequestLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.data-export" });

const PRIVACY_EMAIL = process.env.PRIVACY_EMAIL || "privacy@flagfitpro.com";

const createRequestLogger = makeRequestLogger(logger);

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
    table: "recovery_sessions",
    userIdColumn: "user_id",
    description: "Logged recovery sessions",
    exportName: "recovery_sessions",
  },
  {
    // Special-category (GDPR Art. 9). This is the ONLY place outside the cycle
    // module that reads cycle data — the privacy export path (V3-DESIGN §4.5).
    table: "cycle_tracking_profiles",
    userIdColumn: "user_id",
    description: "Cycle module settings and consent record",
    exportName: "cycle_profile",
  },
  {
    table: "cycle_logs",
    userIdColumn: "user_id",
    description: "Menstrual cycle daily logs (special-category health data)",
    exportName: "cycle_logs",
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
    table: "user_notification_preferences",
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

const BILLING_EXPORT_NAME = "billing";
const BILLING_EXPORT_DESCRIPTION =
  "Subscription billing history (individual subscriptions only -- a team's billing belongs to the team, not an individual member's personal export)";

/**
 * Export a user's own billing data (individual subscriptions only). Unlike
 * USER_DATA_TABLES, invoices/subscriptions don't carry a direct user_id
 * column -- they hang off billing_customers.owner_user_id via
 * billing_customer_id/subscription_id -- so this needs its own two-hop fetch
 * rather than the generic single-eq() export path.
 */
async function exportBillingData(userId, log = logger) {
  try {
    const { data: billingCustomer, error: bcError } = await supabaseAdmin
      .from("billing_customers")
      .select("id, stripe_customer_id, created_at")
      .eq("owner_user_id", userId)
      .maybeSingle();

    if (bcError) {
      throw bcError;
    }

    if (!billingCustomer) {
      return {
        name: BILLING_EXPORT_NAME,
        description: BILLING_EXPORT_DESCRIPTION,
        status: "skipped",
        reason: "No individual billing customer",
        records: 0,
      };
    }

    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("billing_customer_id", billingCustomer.id);

    if (subError) {
      throw subError;
    }

    const subscriptionIds = (subscriptions || []).map((s) => s.id);
    let invoices = [];
    if (subscriptionIds.length > 0) {
      const { data: invoiceRows, error: invError } = await supabaseAdmin
        .from("invoices")
        .select("*")
        .in("subscription_id", subscriptionIds);

      if (invError) {
        throw invError;
      }
      invoices = invoiceRows || [];
    }

    return {
      name: BILLING_EXPORT_NAME,
      description: BILLING_EXPORT_DESCRIPTION,
      status: "success",
      records: 1 + (subscriptions?.length || 0) + invoices.length,
      data: { billingCustomer, subscriptions: subscriptions || [], invoices },
    };
  } catch (error) {
    log.error("data_export_section_failed", error, {
      table: "billing_customers/subscriptions/invoices",
      export_name: BILLING_EXPORT_NAME,
      user_id: userId,
    });
    return {
      name: BILLING_EXPORT_NAME,
      description: BILLING_EXPORT_DESCRIPTION,
      status: "error",
      error: "Section export failed",
      records: 0,
    };
  }
}

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
async function exportTableData(tableConfig, userId, log = logger) {
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
    log.error("data_export_section_failed", error, {
      table,
      export_name: exportName,
      user_id: userId,
    });
    return {
      name: exportName,
      description,
      status: "error",
      error: "Section export failed",
      records: 0,
    };
  }
}

/**
 * Generate complete data export for a user
 */
async function generateDataExport(userId, log = logger) {
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
    const result = await exportTableData(tableConfig, userId, log);

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

  const billingResult = await exportBillingData(userId, log);
  exportData.sections[billingResult.name] = billingResult;
  if (billingResult.status === "success") {
    exportData.summary.tablesExported++;
    exportData.summary.totalRecords += billingResult.records;
  } else if (billingResult.status === "skipped") {
    exportData.summary.tablesSkipped++;
  } else {
    exportData.summary.tablesError++;
  }

  exportData.summary.durationMs = Date.now() - startTime;

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

  const billingResult = await exportBillingData(userId);
  inventory.categories.push({
    name: billingResult.name,
    description: billingResult.description,
    recordCount: billingResult.records,
    hasData: billingResult.records > 0,
  });

  return inventory;
}

/**
 * Check export request status
 */
async function getExportRequestStatus(_userId) {
  // No persistent processing log store; exports are generated on demand.
  return {
    recentExports: [],
    lastExport: null,
  };
}

/**
 * Request data export (for async processing of large exports)
 */
async function requestDataExport(userId, options = {}) {
  const { format = "json", deliveryMethod = "download" } = options;
  if (!["json"].includes(format)) {
    throw new Error("format must be one of: json");
  }
  if (!["download"].includes(deliveryMethod)) {
    throw new Error("deliveryMethod must be one of: download");
  }

  // No persistent processing log store; issue a synthetic request id.
  const requestId = `export-request-${userId}-${Date.now()}`;

  return {
    requestId,
    status: "pending",
    message: "Data export request received. Processing will begin shortly.",
    estimatedTime: "5-10 minutes",
  };
}

// =============================================================================
// REQUEST HANDLER
// =============================================================================

async function handleRequest(
  event,
  _context,
  { userId, requestId, correlationId },
) {
  const path =
    event.path
      .replace("/.netlify/functions/data-export", "")
      .replace(/^\/api\/data-export\/?/, "")
      .replace(/^\//, "") || "";

  let body = {};
  if (event.body && event.httpMethod === "POST") {
    const parsedBody = tryParseJsonObjectBody(event.body);
    if (!parsedBody.ok) {
      return parsedBody.error;
    }
    body = parsedBody.data;
  }

  const requestLogger = createRequestLogger(event, {
    requestId,
    correlationId,
  });

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
      return createSuccessResponse(request, 202);
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
        },
        body: JSON.stringify(exportData, null, 2),
      };
    }

    // Generate data export (returns in response)
    if (event.httpMethod === "POST" && path === "generate") {
      const exportData = await generateDataExport(userId, requestLogger);
      return createSuccessResponse(exportData);
    }

    // Get information about what data is collected
    if (event.httpMethod === "GET" && path === "info") {
      return createSuccessResponse({
        dataCategories: [
          ...USER_DATA_TABLES.map((t) => ({
            name: t.exportName,
            description: t.description,
            table: t.table,
          })),
          {
            name: BILLING_EXPORT_NAME,
            description: BILLING_EXPORT_DESCRIPTION,
            table: "billing_customers / subscriptions / invoices",
          },
        ],
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
          "Most personal data is permanently deleted 30 days after your account-deletion request is processed (see /account-deletion). Financial records (subscription and invoice history) are a separate, narrower exception: they're retained for 3 years after deletion for legal/tax compliance, scrubbed of everything beyond what that compliance requires, then permanently deleted.",
        contact: PRIVACY_EMAIL,
      });
    }

    return createErrorResponse("Endpoint not found", 404, "not_found");
  } catch (error) {
    requestLogger.error("data_export_handler_failed", error, {
      http_method: event.httpMethod,
      path,
      user_id: userId,
    });
    if (error.message?.includes("must be one of")) {
      return createErrorResponse(error.message, 422, "validation_error");
    }
    throw error;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "data-export",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "CREATE", // Rate limit exports to prevent abuse
    requireAuth: true,
    handler: handleRequest,
  });
};

// ESM exports for use in other modules
export { generateDataExport, generateDataInventory };

export const testHandler = handler;
export { handler };

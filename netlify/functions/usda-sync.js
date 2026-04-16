import { wrapHandler } from "./utils/lambda-compat.js";
import { supabaseAdmin } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { authenticateRequest } from "./utils/auth-helper.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { createErrorResponse } from "./utils/error-handler.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";
import { buildRequestLogContext, createLogger } from "./utils/structured-logger.js";

/**
 * USDA FoodData Central API Sync Function
 *
 * Syncs food data from USDA FoodData Central API to our database.
 * API Documentation: https://fdc.nal.usda.gov/api-guide.html
 *
 * Endpoints used:
 * - /foods/list - Get paginated list of foods
 * - /foods/search - Search foods by query
 * - /food/{fdcId} - Get specific food details
 */

// USDA FoodData Central API Key (optional - USDA sync features require this)
// Get your free API key at: https://fdc.nal.usda.gov/api-key-signup.html
const { USDA_API_KEY } = process.env;
const USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1";

// Check if USDA API key is configured
const isUSDAConfigured = !!USDA_API_KEY;

const logger = createLogger({ service: "netlify.usda-sync" });

function createRequestLogger(event, meta = {}) {
  return logger.child(
    buildRequestLogContext(event, {
      request_id: meta.requestId,
      correlation_id: meta.correlationId,
      trace_id: meta.traceId ?? meta.correlationId,
      ...meta.extraContext,
    }),
  );
}

if (!isUSDAConfigured) {
  logger.warn(
    "usda_api_key_missing",
    {
      hint: "Set USDA_API_KEY in environment",
    },
    new Error("USDA_API_KEY not configured"),
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
 * Get shared Supabase client
 */
function getSupabaseClient() {
  return supabaseAdmin;
}

/**
 * Fetch foods from USDA API
 */
async function fetchUSDAFoods(pageNumber = 1, pageSize = 200, dataType = null) {
  const params = new URLSearchParams({
    api_key: USDA_API_KEY,
    pageNumber: pageNumber.toString(),
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

  return response.json();
}

/**
 * Search USDA foods by query
 */
async function searchUSDAFoods(query, pageNumber = 1, pageSize = 50) {
  const response = await fetch(`${USDA_BASE_URL}/foods/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: USDA_API_KEY,
      query,
      pageNumber,
      pageSize,
      dataType: ["Foundation", "SR Legacy", "Branded"],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`USDA API search error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get detailed food information
 */
async function _getFoodDetails(fdcId) {
  const response = await fetch(
    `${USDA_BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}&format=full`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch food ${fdcId}: ${response.status}`);
  }

  return response.json();
}

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
      // Map to our column names
      const columnName = NUTRIENT_MAP[nutrientId];
      if (columnName) {
        nutrients[columnName] = parseFloat(value) || 0;
      }

      // Store all nutrients in JSONB
      allNutrients[nutrientId] = {
        name,
        value: parseFloat(value) || 0,
        unit,
      };
    }
  }

  return { mapped: nutrients, all: allNutrients };
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
 * Generate search keywords for better searching
 */
function generateSearchKeywords(food) {
  const keywords = new Set();

  // Add words from description
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

  // Add category
  if (food.foodCategory?.description) {
    keywords.add(food.foodCategory.description.toLowerCase());
  }

  // Add brand
  if (food.brandName) {
    keywords.add(food.brandName.toLowerCase());
  }

  return Array.from(keywords).slice(0, 20);
}

/**
 * Log sync operation
 */
async function logSync(supabase, requestLogger, source, result, details) {
  try {
    await supabase.from("sync_logs").insert({
      source,
      result: details.hasErrors
        ? details.recordsAdded > 0
          ? "partial"
          : "failure"
        : "success",
      severity: details.hasErrors
        ? details.recordsAdded > 0
          ? "warning"
          : "error"
        : "success",
      records_added: details.recordsAdded || 0,
      records_updated: details.recordsUpdated || 0,
      records_failed: details.recordsFailed || 0,
      error_message: details.errorMessage || null,
      duration_ms: details.durationMs || 0,
      metadata: details.metadata || {},
    });
  } catch (error) {
    requestLogger.warn(
      "sync_log_insert_failed",
      {
        source,
        result,
        metadata: details.metadata,
      },
      error,
    );
  }
}

/**
 * Main sync handler
 */
async function handleSync(
  event,
  {
    requestLogger,
    requestId,
    correlationId,
  } = {},
) {
  const startTime = Date.now();
  const supabase = getSupabaseClient();

  let body = {};
  try {
    // Preserve legacy behavior for sync requests: invalid bodies fall back to defaults.
    body = parseJsonObjectBody(event.body);
  } catch (_e) {
    body = {};
  }

  const {
    mode = "incremental", // 'full', 'incremental', 'search', 'category'
    pageSize = 200,
    maxPages = 5,
    dataType = null, // 'Foundation', 'SR Legacy', 'Branded', 'Survey (FNDDS)'
    searchQuery = null,
    category = null,
  } = body;

  const syncDetails = {
    recordsAdded: 0,
    recordsUpdated: 0,
    recordsFailed: 0,
    hasErrors: false,
    errorMessage: null,
    metadata: { mode, dataType, searchQuery, category },
  };

  const baseLogger =
    requestLogger ?? createRequestLogger(event, { requestId, correlationId });
  const syncLogger = baseLogger.child({
    action: "usda_sync",
    mode,
    data_type: dataType ?? undefined,
    page_size: pageSize,
    search_query: searchQuery ?? undefined,
    category: category ?? undefined,
  });

  try {
    let foods = [];

    if (mode === "search" && searchQuery) {
      // Search mode - fetch specific foods
      syncLogger.info("usda_search_initiated", {
        search_query: searchQuery,
        page_size: pageSize,
      });
      const searchResult = await searchUSDAFoods(searchQuery, 1, pageSize);
      foods = searchResult.foods || [];
      syncDetails.metadata.totalHits = searchResult.totalHits;
    } else if (mode === "category" && category) {
      // Category mode - fetch foods by category
      syncLogger.info("usda_category_fetch", {
        category,
        page_size: pageSize,
      });
      const searchResult = await searchUSDAFoods(category, 1, pageSize);
      foods = searchResult.foods || [];
    } else {
      // Full or incremental sync - paginated list
      syncLogger.info("usda_sync_started", {
        mode,
        max_pages: maxPages,
        page_size: pageSize,
        data_type: dataType,
      });

      for (let page = 1; page <= maxPages; page++) {
        syncLogger.debug("usda_sync_page_fetching", {
          page,
          max_pages: maxPages,
        });
        const pageData = await fetchUSDAFoods(page, pageSize, dataType);

        if (!pageData || pageData.length === 0) {
          syncLogger.info("usda_sync_pagination_complete", {
            remaining_page: page,
            max_pages: maxPages,
          });
          break;
        }

        foods = foods.concat(pageData);

        // Rate limiting - USDA API has limits
        if (page < maxPages) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    }

    syncLogger.info("usda_sync_processing_foods", {
      total_foods: foods.length,
    });

    // Process foods in batches
    const batchSize = 100;
    for (let i = 0; i < foods.length; i += batchSize) {
      const batch = foods.slice(i, i + batchSize);
      const transformedBatch = batch.map(transformFood);

      // Upsert foods (insert or update on conflict)
      const { data, error } = await supabase
        .from("usda_foods")
        .upsert(transformedBatch, {
          onConflict: "fdc_id",
          ignoreDuplicates: false,
        })
        .select("id");

      if (error) {
        syncLogger.error("usda_sync_batch_upsert_failed", error, {
          batch: i / batchSize + 1,
          batch_size: batchSize,
        });
        syncDetails.recordsFailed += batch.length;
        syncDetails.hasErrors = true;
        syncDetails.errorMessage = error.message;
      } else {
        // Count new vs updated (simplified - count all as added for now)
        syncDetails.recordsAdded += data?.length || 0;
      }
    }

    syncDetails.durationMs = Date.now() - startTime;

    // Log the sync operation
    await logSync(supabase, syncLogger, "usda_foods", "success", syncDetails);

    // Get current stats
    const { count: totalFoods } = await supabase
      .from("usda_foods")
      .select("*", { count: "exact", head: true });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        message: `USDA sync completed`,
        stats: {
          processed: foods.length,
          added: syncDetails.recordsAdded,
          updated: syncDetails.recordsUpdated,
          failed: syncDetails.recordsFailed,
          totalInDatabase: totalFoods || 0,
          durationMs: syncDetails.durationMs,
        },
      }),
    };
  } catch (error) {
    syncDetails.hasErrors = true;
    syncDetails.errorMessage = error.message;
    syncDetails.durationMs = Date.now() - startTime;
    syncLogger.error("usda_sync_failed", error, {
      stats: syncDetails,
    });

    await logSync(supabase, syncLogger, "usda_foods", "failure", syncDetails);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: "Failed to sync USDA foods",
        stats: syncDetails,
      }),
    };
  }
}

/**
 * Get sync status and stats
 */
async function handleStatus() {
  const supabase = getSupabaseClient();

  try {
    // Get food counts by data type
    const { data: foods, count: totalFoods, error: foodsError } = await supabase
      .from("usda_foods")
      .select("data_type", { count: "exact" });
    if (foodsError) {
      throw foodsError;
    }

    // Count by data type
    const dataTypeCounts = {};
    if (foods) {
      foods.forEach((f) => {
        const type = f.data_type || "Unknown";
        dataTypeCounts[type] = (dataTypeCounts[type] || 0) + 1;
      });
    }

    // Get recent sync logs
    const { data: recentSyncs, error: recentSyncsError } = await supabase
      .from("sync_logs")
      .select("*")
      .eq("source", "usda_foods")
      .order("timestamp", { ascending: false })
      .limit(10);
    if (recentSyncsError) {
      throw recentSyncsError;
    }

    // Get last successful sync
    const { data: lastSuccess, error: lastSuccessError } = await supabase
      .from("sync_logs")
      .select("*")
      .eq("source", "usda_foods")
      .eq("result", "success")
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();
    if (lastSuccessError && lastSuccessError.code !== "PGRST116") {
      throw lastSuccessError;
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        stats: {
          totalFoods: totalFoods || 0,
          byDataType: dataTypeCounts,
          lastSync: lastSuccess?.timestamp || null,
          lastSyncRecords: lastSuccess?.records_added || 0,
        },
        recentSyncs: recentSyncs || [],
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: "Failed to retrieve USDA sync status",
      }),
    };
  }
}

/**
 * Search foods in our database
 */
async function handleSearch(event) {
  const supabase = getSupabaseClient();

  const params = event.queryStringParameters || {};
  const query = params.q || params.query || "";
  const rawLimit = params.limit;
  const rawOffset = params.offset;
  const parsedLimit = rawLimit === undefined ? 20 : parseInt(rawLimit, 10);
  const parsedOffset = rawOffset === undefined ? 0 : parseInt(rawOffset, 10);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    return createErrorResponse(
      "limit must be an integer between 1 and 100",
      400,
      "validation_error",
    );
  }
  if (!Number.isInteger(parsedOffset) || parsedOffset < 0) {
    return createErrorResponse(
      "offset must be an integer greater than or equal to 0",
      400,
      "validation_error",
    );
  }
  const limit = parsedLimit;
  const offset = parsedOffset;
  const dataType = params.dataType || null;

  if (!query || query.length < 2) {
    return createErrorResponse(
      "Query must be at least 2 characters",
      400,
      "validation_error",
    );
  }

  try {
    let queryBuilder = supabase
      .from("usda_foods")
      .select(
        `
        id, fdc_id, description, food_category, data_type,
        brand_owner, brand_name, serving_size, serving_size_unit,
        household_serving_text, energy_kcal, protein_g, carbohydrates_g,
        fat_g, fiber_g, sugars_g, sodium_mg
      `,
      )
      .eq("is_active", true)
      .ilike("description", `%${query}%`)
      .order("description")
      .range(offset, offset + limit - 1);

    if (dataType) {
      queryBuilder = queryBuilder.eq("data_type", dataType);
    }

    const { data, error, count: _dbCount } = await queryBuilder;

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        query,
        results: data || [],
        count: data?.length || 0,
        offset,
        limit,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: "Failed to search USDA foods",
      }),
    };
  }
}

/**
 * Main handler
 */
const handler = async (event, context) =>
  event.httpMethod === "POST"
    ? baseHandler(event, context, {
        functionName: "usda-sync",
        allowedMethods: ["POST"],
        rateLimitType: "UPDATE",
        requireAuth: true,
        handler: async (evt, _ctx, { requestId, correlationId }) => {
          const requestLogger = createRequestLogger(evt, {
            requestId,
            correlationId,
          });
          if (!isUSDAConfigured) {
            return {
              statusCode: 503,
              body: JSON.stringify({
                success: false,
                error: "USDA API key not configured",
                message:
                  "USDA food sync features are unavailable. Set USDA_API_KEY environment variable.",
                setupUrl: "https://fdc.nal.usda.gov/api-key-signup.html",
              }),
            };
          }

          try {
            const auth = await authenticateRequest(evt);
            if (!auth.success) {
              return auth.error;
            }
            const role = await getUserRole(auth.user.id);
            if (role !== "admin") {
              return createErrorResponse(
                "Admin role required",
                403,
                "authorization_error",
              );
            }
            return handleSync(evt, {
              requestLogger,
              requestId,
              correlationId,
            });
          } catch (error) {
            requestLogger.error(
              "usda_sync_handler_failed",
              error,
              {
                http_method: evt.httpMethod,
                path: evt.path,
              },
            );
            return createErrorResponse(
              "Failed to handle USDA sync request",
              500,
              "server_error",
              {},
            );
          }
        },
      })
    : baseHandler(event, context, {
        functionName: "usda-sync",
        allowedMethods: ["GET"],
        rateLimitType: "READ",
        requireAuth: false,
        handler: async (evt, _ctx, { requestId, correlationId }) => {
          const requestLogger = createRequestLogger(evt, {
            requestId,
            correlationId,
          });
          if (!isUSDAConfigured) {
            return {
              statusCode: 503,
              body: JSON.stringify({
                success: false,
                error: "USDA API key not configured",
                message:
                  "USDA food sync features are unavailable. Set USDA_API_KEY environment variable.",
                setupUrl: "https://fdc.nal.usda.gov/api-key-signup.html",
              }),
            };
          }

          const path = evt.path.replace("/.netlify/functions/usda-sync", "");

          try {
            if (evt.httpMethod === "GET" && (path === "/status" || path === "")) {
              return handleStatus();
            }

            if (evt.httpMethod === "GET" && path === "/search") {
              return handleSearch(evt);
            }

            if (evt.httpMethod === "POST" && (path === "/sync" || path === "")) {
              return createErrorResponse(
                "Method not allowed",
                405,
                "method_not_allowed",
              );
            }

            return createErrorResponse("Not found", 404, "not_found", {
              details: [
                "GET /status - Get sync status and stats",
                "GET /search?q=query - Search foods in database",
                "POST /sync - Trigger USDA data sync",
              ],
            });
          } catch (error) {
            requestLogger.error(
              "usda_sync_handler_failed",
              error,
              {
                http_method: evt.httpMethod,
                path: evt.path,
              },
            );
            return createErrorResponse(
              "Failed to handle USDA sync request",
              500,
              "server_error",
              {},
            );
          }
        },
      });

export const testHandler = handler;
export { handler };

export const config = { schedule: "0 3 * * 1" }; // Weekly — Monday 03:00 UTC

export default async (req, context) => {
  if (req.headers.get("x-netlify-event") === "schedule") {
    logger.info("usda_sync_scheduled_start");
    if (!isUSDAConfigured) {
      logger.warn("usda_sync_scheduled_skipped", { reason: "USDA_API_KEY not set" });
      return Response.json({ success: true, skipped: true, reason: "USDA_API_KEY not configured" });
    }
    try {
      const result = await handleSync({ body: null, httpMethod: "POST" });
      logger.info("usda_sync_scheduled_complete", { recordsAdded: result?.data?.recordsAdded ?? 0 });
      return Response.json({ success: true, data: result });
    } catch (err) {
      logger.error("usda_sync_scheduled_failed", { error: err?.message });
      return Response.json({ success: false, error: err?.message || "sync failed" }, { status: 500 });
    }
  }
  return wrapHandler(handler)(req, context);
};

// Netlify Function: Knowledge Base Search
// Searches the evidence-based knowledge database
// Updated to work with actual knowledge_base_entries schema

const { supabaseAdmin } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");

// Use shared Supabase admin client
function getSupabase() {
  return supabaseAdmin;
}

// SECURITY: Whitelist of allowed categories to prevent injection
const ALLOWED_CATEGORIES = [
  "training",
  "nutrition",
  "recovery",
  "psychology",
  "injury_prevention",
  "technique",
  "mental",
  "injury",
  "equipment",
  "strategy",
];

// SECURITY: Whitelist of allowed subcategories
const ALLOWED_SUBCATEGORIES = [
  // Nutrition
  "meal_planning",
  "hydration",
  "tournament",
  "supplements",
  "pre-training",
  "food_database",
  "macro_calculator",
  // Training
  "speed",
  "power",
  "strength",
  "agility",
  "protocols",
  "skills",
  "warm-up",
  "research",
  // Recovery
  "sleep",
  "active_recovery",
  "protocols",
  // Psychology
  "mental_preparation",
  "confidence",
  "focus",
  // Injury
  "hamstring",
  "prevention",
];

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "knowledge-search",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "READ",
    requireAuth: false, // Knowledge search is public
    handler: async (event, _context, { requestId }) => {
      const supabase = getSupabase();

      try {
        if (event.httpMethod === "POST") {
          let bodyData = {};
          try {
            bodyData = JSON.parse(event.body || "{}");
          } catch {
            return createErrorResponse(
              "Invalid JSON in request body",
              400,
              "invalid_json",
              requestId,
            );
          }

          const { query, category, subcategory, limit = 10 } = bodyData;

          if (!query || typeof query !== "string") {
            return createErrorResponse(
              "Query parameter is required and must be a string",
              400,
              "validation_error",
              requestId,
            );
          }

          if (query.length > 500) {
            return createErrorResponse(
              "Query too long (max 500 characters)",
              400,
              "validation_error",
              requestId,
            );
          }

          if (category && !ALLOWED_CATEGORIES.includes(category)) {
            return createErrorResponse(
              `Invalid category. Allowed: ${ALLOWED_CATEGORIES.join(", ")}`,
              400,
              "validation_error",
              requestId,
            );
          }

          if (subcategory && !ALLOWED_SUBCATEGORIES.includes(subcategory)) {
            return createErrorResponse(
              "Invalid subcategory",
              400,
              "validation_error",
              requestId,
            );
          }

          const sanitizedLimit = Math.min(
            Math.max(parseInt(limit) || 10, 1),
            50,
          );

          // Build query
          let queryBuilder = supabase
            .from("knowledge_base_entries")
            .select("*")
            .eq("is_active", true)
            .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
            .order("source_quality_score", {
              ascending: false,
              nullsFirst: false,
            })
            .order("evidence_grade", { ascending: true })
            .limit(sanitizedLimit);

          // Apply category filter
          if (category) {
            queryBuilder = queryBuilder.eq("category", category);
          }

          // Apply subcategory filter
          if (subcategory) {
            queryBuilder = queryBuilder.eq("subcategory", subcategory);
          }

          const { data, error } = await queryBuilder;

          if (error) {
            console.error("Knowledge search error:", error);
            return createErrorResponse(
              "Search failed",
              500,
              "database_error",
              requestId,
            );
          }

          // Format results
          const results = data.map((entry) => ({
            id: entry.id,
            title: entry.title,
            content: entry.content,
            category: entry.category,
            subcategory: entry.subcategory,
            evidenceGrade: entry.evidence_grade,
            riskLevel: entry.risk_level,
            requiresProfessional: entry.requires_professional,
            sourceType: entry.source_type,
            sourceUrl: entry.source_url,
            sourceTitle: entry.source_title,
            qualityScore: entry.source_quality_score,
          }));

          return createSuccessResponse(
            {
              query,
              category: category || "all",
              results,
              total: results.length,
            },
            requestId,
          );
        }

        if (event.httpMethod === "GET") {
          // Parse path for specific entry or category listing
          const pathParts = event.path.replace(/^\/+|\/+$/g, "").split("/");
          const endpoint = pathParts[pathParts.length - 1];
          const params = event.queryStringParameters || {};

          // GET /knowledge-search/categories - List all categories
          if (endpoint === "categories") {
            const { data, error } = await supabase
              .from("knowledge_base_entries")
              .select("category, subcategory")
              .eq("is_active", true);

            if (error) {
              return createErrorResponse(
                "Failed to fetch categories",
                500,
                "database_error",
                requestId,
              );
            }

            // Group by category
            const categories = {};
            data.forEach((entry) => {
              if (!categories[entry.category]) {
                categories[entry.category] = new Set();
              }
              if (entry.subcategory) {
                categories[entry.category].add(entry.subcategory);
              }
            });

            const result = Object.entries(categories).map(
              ([category, subcategories]) => ({
                category,
                subcategories: Array.from(subcategories),
              }),
            );

            return createSuccessResponse(result, requestId);
          }

          // GET /knowledge-search/entry/:id - Get specific entry
          if (endpoint === "entry" || params.id) {
            const entryId = params.id || pathParts[pathParts.length - 1];

            const { data, error } = await supabase
              .from("knowledge_base_entries")
              .select("*")
              .eq("id", entryId)
              .eq("is_active", true)
              .single();

            if (error || !data) {
              return createErrorResponse(
                "Entry not found",
                404,
                "not_found",
                requestId,
              );
            }

            // Increment query count
            await supabase
              .from("knowledge_base_entries")
              .update({ query_count: (data.query_count || 0) + 1 })
              .eq("id", entryId);

            return createSuccessResponse(data, requestId);
          }

          // GET /knowledge-search?category=nutrition - List by category
          if (params.category) {
            if (!ALLOWED_CATEGORIES.includes(params.category)) {
              return createErrorResponse(
                "Invalid category",
                400,
                "validation_error",
                requestId,
              );
            }

            let queryBuilder = supabase
              .from("knowledge_base_entries")
              .select(
                "id, title, category, subcategory, evidence_grade, source_quality_score",
              )
              .eq("is_active", true)
              .eq("category", params.category)
              .order("source_quality_score", {
                ascending: false,
                nullsFirst: false,
              });

            if (
              params.subcategory &&
              ALLOWED_SUBCATEGORIES.includes(params.subcategory)
            ) {
              queryBuilder = queryBuilder.eq("subcategory", params.subcategory);
            }

            const { data, error } = await queryBuilder;

            if (error) {
              return createErrorResponse(
                "Failed to fetch entries",
                500,
                "database_error",
                requestId,
              );
            }

            return createSuccessResponse(
              {
                category: params.category,
                subcategory: params.subcategory || "all",
                entries: data,
                total: data.length,
              },
              requestId,
            );
          }

          // GET /knowledge-search - List all entries (summary)
          const { data, error } = await supabase
            .from("knowledge_base_entries")
            .select("id, title, category, subcategory, evidence_grade")
            .eq("is_active", true)
            .order("category")
            .order("subcategory")
            .limit(100);

          if (error) {
            return createErrorResponse(
              "Failed to fetch entries",
              500,
              "database_error",
              requestId,
            );
          }

          return createSuccessResponse(
            {
              entries: data,
              total: data.length,
              hint: "Use POST with 'query' to search, or GET with 'category' to filter",
            },
            requestId,
          );
        }

        return createErrorResponse(
          "Method not allowed",
          405,
          "method_not_allowed",
          requestId,
        );
      } catch (error) {
        console.error("Knowledge search error:", error);
        return createErrorResponse(
          error.message || "Internal server error",
          500,
          "internal_error",
          requestId,
        );
      }
    },
  });
};

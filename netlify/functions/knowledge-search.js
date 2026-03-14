import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";

// Netlify Function: Knowledge Base Search
// Searches the evidence-based knowledge database
// Updated to work with actual knowledge_base_entries schema

import { supabaseAdmin } from "./supabase-client.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";

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
  "training_method",
  "recovery_method",
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

const parseBoundedInt = (value, fieldName, { min, max }) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const normalized = String(value).trim();
  if (!/^-?\d+$/.test(normalized)) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  return parsed;
};

const normalizeKnowledgeEntry = (entry) => {
  const sourceUrl = Array.isArray(entry.supporting_articles)
    ? entry.supporting_articles[0] || null
    : null;
  const evidenceGrade =
    typeof entry.evidence_strength === "string"
      ? entry.evidence_strength
      : "C";

  return {
    id: entry.id,
    title: entry.topic || entry.question || "Knowledge Entry",
    content: entry.answer || entry.summary || entry.question || "",
    category: entry.entry_type || "general",
    subcategory: null,
    evidenceGrade,
    riskLevel: null,
    requiresProfessional: false,
    sourceType: "knowledge_base",
    sourceUrl,
    sourceTitle: entry.topic || "Knowledge Entry",
    qualityScore:
      entry.consensus_level === "high"
        ? 0.9
        : entry.consensus_level === "moderate"
          ? 0.7
          : 0.5,
  };
};

const handler = async (event, context) => {
  const rateLimitType = event.httpMethod === "GET" ? "READ" : "CREATE";
  return baseHandler(event, context, {
    functionName: "knowledge-search",
    allowedMethods: ["GET", "POST"],
rateLimitType,
    requireAuth: false, // Knowledge search is public
    handler: async (event, _context, { requestId }) => {
      const supabase = getSupabase();

      try {
        if (event.httpMethod === "POST") {
          let bodyData = {};
          try {
            bodyData = parseJsonObjectBody(event.body);
          } catch (error) {
            if (
              error?.code === "INVALID_JSON_BODY" &&
              error?.message === "Invalid JSON in request body"
            ) {
              return createErrorResponse(
                "Invalid JSON in request body",
                400,
                "invalid_json",
                requestId,
              );
            }
            return createErrorResponse(
              error.message || "Invalid request body",
              422,
              "validation_error",
              requestId,
            );
          }

          const { query, category, subcategory, limit = 10 } = bodyData;
          let sanitizedLimit;
          try {
            sanitizedLimit = parseBoundedInt(limit, "limit", { min: 1, max: 50 }) ?? 10;
          } catch (error) {
            return createErrorResponse(
              error.message,
              422,
              "validation_error",
              requestId,
            );
          }

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

          // Build query against current knowledge schema
          let queryBuilder = supabase
            .from("knowledge_base_entries")
            .select("*")
            .eq("is_merlin_approved", true)
            .or(
              `topic.ilike.%${query}%,question.ilike.%${query}%,answer.ilike.%${query}%,summary.ilike.%${query}%`,
            )
            .order("query_count", {
              ascending: false,
              nullsFirst: false,
            })
            .order("updated_at", { ascending: false, nullsFirst: false })
            .limit(sanitizedLimit);

          // Apply category filter
          if (category) {
            queryBuilder = queryBuilder.eq("entry_type", category);
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
          const results = data.map(normalizeKnowledgeEntry);

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
              .select("entry_type")
              .eq("is_merlin_approved", true);

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
              const category = entry.entry_type || "general";
              if (!categories[category]) {
                categories[category] = new Set();
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
              .eq("is_merlin_approved", true)
              .eq("id", entryId)
              .single();

            if (error || !data) {
              return createErrorResponse(
                "Entry not found",
                404,
                "not_found",
                requestId,
              );
            }

            return createSuccessResponse(normalizeKnowledgeEntry(data), requestId);
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
                "id, entry_type, topic, question, answer, summary, evidence_strength, consensus_level, supporting_articles",
              )
              .eq("is_merlin_approved", true)
              .eq("entry_type", params.category)
              .order("query_count", {
                ascending: false,
                nullsFirst: false,
              });

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
                entries: data.map(normalizeKnowledgeEntry),
                total: data.length,
              },
              requestId,
            );
          }

          // GET /knowledge-search - List all entries (summary)
          const { data, error } = await supabase
            .from("knowledge_base_entries")
            .select(
              "id, entry_type, topic, question, answer, summary, evidence_strength, consensus_level, supporting_articles",
            )
            .eq("is_merlin_approved", true)
            .order("entry_type")
            .order("topic")
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
              entries: data.map(normalizeKnowledgeEntry),
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
          "Internal server error",
          500,
          "internal_error",
          requestId,
        );
      }
    },
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);

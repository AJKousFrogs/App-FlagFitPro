// Netlify Function: Knowledge Base Search
// Searches the evidence-based knowledge database

const { Pool } = require("pg");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");
const { buildNumericCondition } = require("./utils/sql-formatter.cjs");

// SECURITY: Whitelist of allowed categories to prevent SQL injection
const ALLOWED_CATEGORIES = [
  "training",
  "nutrition",
  "recovery",
  "technique",
  "mental",
  "injury",
  "equipment",
  "strategy",
];

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "knowledge-search",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "READ",
    requireAuth: false, // Knowledge search is public
    handler: async (event, _context, { requestId }) => {
      const pool = new Pool({
        connectionString:
          process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
        ssl: { rejectUnauthorized: false },
      });

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
              requestId
            );
          }

          const { query, category, limit = 5 } = bodyData;

          if (!query || typeof query !== "string") {
            return createErrorResponse(
              "Query parameter is required and must be a string",
              400,
              "validation_error",
              requestId
            );
          }

          if (query.length > 500) {
            return createErrorResponse(
              "Query too long (max 500 characters)",
              400,
              "validation_error",
              requestId
            );
          }

          if (category && !ALLOWED_CATEGORIES.includes(category)) {
            return createErrorResponse(
              "Invalid category. Allowed: " + ALLOWED_CATEGORIES.join(", "),
              400,
              "validation_error",
              requestId
            );
          }

          const sanitizedLimit = Math.min(Math.max(parseInt(limit) || 5, 1), 50);

          // Parse options for governance filters
          const options = bodyData.options || {};
          const requireApproval = options.requireApproval !== false;
          const includeExperimental = options.includeExperimental === true;
          const minQualityScore = parseFloat(options.minQualityScore) || 0.0;

          // Build approval filter
          let approvalFilter = "";
          if (requireApproval) {
            approvalFilter = includeExperimental
              ? `AND kbe.approval_status IN ('approved', 'experimental')`
              : `AND kbe.approval_status = 'approved'`;
          }

          // Build quality score filter
          let qualityFilter = "";
          if (minQualityScore > 0) {
            const scoreCondition = buildNumericCondition(
              "kbe.source_quality_score",
              ">=",
              minQualityScore
            );
            qualityFilter = `AND (kbe.source_quality_score IS NULL OR ${scoreCondition})`;
          }

          const searchQuery = `
            SELECT 
              kbe.*,
              array_agg(DISTINCT ra.id) as supporting_articles,
              array_agg(DISTINCT ra.title) as article_titles
            FROM knowledge_base_entries kbe
            LEFT JOIN unnest(kbe.supporting_articles) as article_id ON true
            LEFT JOIN research_articles ra ON ra.id = article_id
            WHERE 
              (kbe.answer ILIKE $1
              OR kbe.question ILIKE $1
              OR kbe.topic ILIKE $1)
              ${category ? `AND kbe.entry_type = $2` : ""}
              ${approvalFilter}
              ${qualityFilter}
            GROUP BY kbe.id
            ORDER BY 
              kbe.approval_status = 'approved' DESC,
              kbe.source_quality_score DESC NULLS LAST,
              kbe.evidence_strength DESC,
              kbe.query_count DESC
            LIMIT $${category ? "3" : "2"}
          `;

          const params = category
            ? [`%${query}%`, category, sanitizedLimit]
            : [`%${query}%`, sanitizedLimit];

          const result = await pool.query(searchQuery, params);
          return createSuccessResponse(result.rows, requestId);
        }

        if (event.httpMethod === "GET") {
          const topic = event.path.split("/").pop();

          const result = await pool.query(
            `
            SELECT
              kbe.*,
              array_agg(DISTINCT ra.id) as supporting_articles
            FROM knowledge_base_entries kbe
            LEFT JOIN unnest(kbe.supporting_articles) as article_id ON true
            LEFT JOIN research_articles ra ON ra.id = article_id
            WHERE kbe.topic = $1
            GROUP BY kbe.id
          `,
            [topic]
          );

          return createSuccessResponse(result.rows[0] || null, requestId);
        }

        return createErrorResponse(
          "Method not allowed",
          405,
          "method_not_allowed",
          requestId
        );
      } finally {
        await pool.end();
      }
    },
  });
};

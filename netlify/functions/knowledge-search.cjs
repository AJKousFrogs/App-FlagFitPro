// Netlify Function: Knowledge Base Search
// Searches the evidence-based knowledge database

const { Pool } = require("pg");
const {
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  handleValidationError,
  logFunctionCall,
  CORS_HEADERS,
} = require("./utils/error-handler.cjs");
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
  logFunctionCall("Knowledge-Search", event);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS };
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    if (event.httpMethod === "POST") {
      // Parse and validate request body
      let bodyData = {};
      try {
        bodyData = JSON.parse(event.body);
      } catch (parseError) {
        return handleValidationError("Invalid JSON in request body");
      }

      const { query, category, limit = 5 } = bodyData;

      // SECURITY: Validate input parameters
      if (!query || typeof query !== "string") {
        return handleValidationError(
          "Query parameter is required and must be a string",
        );
      }

      if (query.length > 500) {
        return handleValidationError("Query too long (max 500 characters)");
      }

      // Validate category against whitelist
      if (category) {
        if (!ALLOWED_CATEGORIES.includes(category)) {
          return handleValidationError(
            "Invalid category. Allowed: " + ALLOWED_CATEGORIES.join(", "),
          );
        }
      }

      // Validate limit
      const sanitizedLimit = Math.min(Math.max(parseInt(limit) || 5, 1), 50);

      // Parse options for governance filters
      let requireApproval = true; // Default: only show approved entries
      let includeExperimental = false; // Default: exclude experimental
      let minQualityScore = 0.0; // Default: no minimum quality score

      try {
        const options = bodyData.options || {};
        requireApproval = options.requireApproval !== false; // Default true, but can be overridden
        includeExperimental = options.includeExperimental === true; // Default false
        minQualityScore = parseFloat(options.minQualityScore) || 0.0;
      } catch (e) {
        // Use defaults if options parsing fails
      }

      // Build approval filter
      let approvalFilter = "";
      if (requireApproval) {
        if (includeExperimental) {
          approvalFilter = `AND kbe.approval_status IN ('approved', 'experimental')`;
        } else {
          approvalFilter = `AND kbe.approval_status = 'approved'`;
        }
      }

      // Build quality score filter (SECURITY: Use safe formatting to prevent SQL injection)
      let qualityFilter = "";
      if (minQualityScore > 0) {
        const scoreCondition = buildNumericCondition(
          "kbe.source_quality_score",
          ">=",
          minQualityScore,
        );
        qualityFilter = `AND (kbe.source_quality_score IS NULL OR ${scoreCondition})`;
      }

      // Search knowledge base entries with governance filters
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
      return createSuccessResponse(result.rows);
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
        [topic],
      );

      return createSuccessResponse(result.rows[0] || null);
    }

    return createErrorResponse("Method not allowed", 405, "method_not_allowed");
  } catch (error) {
    return handleServerError(error, "Knowledge-Search");
  } finally {
    await pool.end();
  }
};

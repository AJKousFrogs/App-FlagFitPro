// Netlify Function: Knowledge Base Search
// Searches the evidence-based knowledge database

const { Pool } = require("pg");
const {
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  handleValidationError,
  logFunctionCall,
  CORS_HEADERS
} = require("./utils/error-handler.cjs");

// SECURITY: Whitelist of allowed categories to prevent SQL injection
const ALLOWED_CATEGORIES = [
  'training',
  'nutrition',
  'recovery',
  'technique',
  'mental',
  'injury',
  'equipment',
  'strategy'
];

exports.handler = async (event, context) => {
  logFunctionCall('Knowledge-Search', event);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS };
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    if (event.httpMethod === "POST") {
      const { query, category, limit = 5 } = JSON.parse(event.body);

      // SECURITY: Validate input parameters
      if (!query || typeof query !== 'string') {
        return handleValidationError('Query parameter is required and must be a string');
      }

      if (query.length > 500) {
        return handleValidationError('Query too long (max 500 characters)');
      }

      // Validate category against whitelist
      if (category) {
        if (!ALLOWED_CATEGORIES.includes(category)) {
          return handleValidationError('Invalid category. Allowed: ' + ALLOWED_CATEGORIES.join(', '));
        }
      }

      // Validate limit
      const sanitizedLimit = Math.min(Math.max(parseInt(limit) || 5, 1), 50);

      // Search knowledge base entries
      let searchQuery = `
        SELECT 
          kbe.*,
          array_agg(DISTINCT ra.id) as supporting_articles,
          array_agg(DISTINCT ra.title) as article_titles
        FROM knowledge_base_entries kbe
        LEFT JOIN unnest(kbe.supporting_articles) as article_id ON true
        LEFT JOIN research_articles ra ON ra.id = article_id
        WHERE 
          kbe.answer ILIKE $1
          OR kbe.question ILIKE $1
          OR kbe.topic ILIKE $1
          ${category ? `AND kbe.entry_type = $2` : ""}
        GROUP BY kbe.id
        ORDER BY kbe.evidence_strength DESC, kbe.query_count DESC
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

    return createErrorResponse("Method not allowed", 405, 'method_not_allowed');
  } catch (error) {
    return handleServerError(error, 'Knowledge-Search');
  } finally {
    await pool.end();
  }
};

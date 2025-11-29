// Netlify Function: Knowledge Base Search
// Searches the evidence-based knowledge database

const { Pool } = require("pg");

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
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
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
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Query parameter is required and must be a string'
          })
        };
      }

      if (query.length > 500) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Query too long (max 500 characters)'
          })
        };
      }

      // Validate category against whitelist
      if (category) {
        if (!ALLOWED_CATEGORIES.includes(category)) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Invalid category',
              allowedCategories: ALLOWED_CATEGORIES
            })
          };
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

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: result.rows,
        }),
      };
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

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: result.rows[0] || null,
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error) {
    console.error("Knowledge search error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  } finally {
    await pool.end();
  }
};

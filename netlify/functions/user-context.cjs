// User Context API Endpoint
// Returns user context for chatbot personalization (role, team type, etc.)

const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for auth
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Helper function to get user from auth token
async function getUserFromToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    return user;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

// Helper function to create success response
function createSuccessResponse(data) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify({ success: true, data }),
  };
}

// Helper function to create error response
function createErrorResponse(message, statusCode = 400) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify({ success: false, error: message }),
  };
}

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
    };
  }

  try {
    // Get user from auth token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const user = await getUserFromToken(authHeader);

    if (!user) {
      return createErrorResponse('Unauthorized - Invalid or missing token', 401);
    }

    const userId = user.id;

    // Get or create chatbot context using database function
    const contextResult = await pool.query(
      `SELECT * FROM get_or_create_chatbot_context($1)`,
      [userId]
    );

    if (contextResult.rows.length === 0) {
      return createErrorResponse('Failed to get user context', 500);
    }

    const chatbotContext = contextResult.rows[0];

    // Get additional user info
    const userResult = await pool.query(
      `SELECT id, role, position, height_cm, weight_kg, experience_level
       FROM users
       WHERE id = $1`,
      [userId]
    );

    const userInfo = userResult.rows[0] || {};

    // Get team info if primary team exists
    let teamInfo = null;
    if (chatbotContext.primary_team_id) {
      const teamResult = await pool.query(
        `SELECT id, name, team_type, region, country_code
         FROM teams
         WHERE id = $1`,
        [chatbotContext.primary_team_id]
      );
      teamInfo = teamResult.rows[0] || null;
    }

    // Combine context data
    const contextData = {
      userId: chatbotContext.user_id,
      role: chatbotContext.user_role,
      teamType: chatbotContext.team_type || 'domestic',
      primaryTeamId: chatbotContext.primary_team_id,
      teamInfo: teamInfo,
      position: userInfo.position,
      expertiseLevel: chatbotContext.expertise_level || 'intermediate',
      preferredTopics: chatbotContext.preferred_topics || [],
      totalQueries: chatbotContext.total_queries || 0,
      lastQueryAt: chatbotContext.last_query_at,
      // Additional user info
      heightCm: userInfo.height_cm,
      weightKg: userInfo.weight_kg,
      experienceLevel: userInfo.experience_level,
    };

    return createSuccessResponse(contextData);
  } catch (error) {
    console.error('Error in user-context function:', error);
    return createErrorResponse('Internal server error', 500);
  } finally {
    // Don't close pool - it's reused across invocations
  }
};


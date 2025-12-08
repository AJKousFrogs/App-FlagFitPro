// Update Chatbot Statistics API Endpoint
// Updates chatbot usage statistics and tracks preferred topics

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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    // Get user from auth token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const user = await getUserFromToken(authHeader);

    if (!user) {
      return createErrorResponse('Unauthorized - Invalid or missing token', 401);
    }

    const userId = user.id;

    // Parse request body
    let bodyData = {};
    try {
      bodyData = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    const { topic } = bodyData;

    // Update chatbot query statistics using database function
    await pool.query(
      `SELECT update_chatbot_query_stats($1, $2)`,
      [userId, topic || null]
    );

    return createSuccessResponse({ message: 'Statistics updated successfully' });
  } catch (error) {
    console.error('Error in update-chatbot-stats function:', error);
    return createErrorResponse('Internal server error', 500);
  } finally {
    // Don't close pool - it's reused across invocations
  }
};


// User Profile API Endpoint
// Returns comprehensive user profile including body metrics, injuries, and training data

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
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    const requestedUserId = event.queryStringParameters?.userId || userId;

    // Only allow users to access their own profile (unless admin)
    // For now, we'll allow the authenticated user to access their own profile
    if (requestedUserId !== userId) {
      // Could add admin check here in the future
      return createErrorResponse('Forbidden - Can only access your own profile', 403);
    }

    // Get user basic info
    const userResult = await pool.query(
      `SELECT id, height_cm, weight_kg, position, birth_date, role, experience_level
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return createErrorResponse('User not found', 404);
    }

    const userInfo = userResult.rows[0];

    // Get active and recent injuries
    // Note: injuries table uses VARCHAR(255) for user_id, so we need to cast UUID to text
    const injuriesResult = await pool.query(
      `SELECT type, severity, status, start_date, recovery_date, description
       FROM injuries
       WHERE user_id = $1::text
         AND status IN ('active', 'recovering', 'monitoring', 'recovered')
       ORDER BY start_date DESC
       LIMIT 10`,
      [userId.toString()]
    );

    // Get training frequency and statistics (last 30 days)
    const trainingResult = await pool.query(
      `SELECT 
         COUNT(*) as session_count,
         AVG(duration_minutes) as avg_duration,
         AVG(intensity_level) as avg_intensity,
         array_agg(DISTINCT session_type) FILTER (WHERE session_type IS NOT NULL) as session_types
       FROM training_sessions
       WHERE user_id = $1
         AND session_date >= CURRENT_DATE - INTERVAL '30 days'
         AND status = 'completed'`,
      [userId]
    );

    // Get recent training sessions (last 7 days) for context
    const recentSessionsResult = await pool.query(
      `SELECT session_type, duration_minutes, intensity_level, session_date
       FROM training_sessions
       WHERE user_id = $1
         AND session_date >= CURRENT_DATE - INTERVAL '7 days'
         AND status = 'completed'
       ORDER BY session_date DESC
       LIMIT 5`,
      [userId]
    );

    // Calculate training frequency (sessions per week)
    const trainingData = trainingResult.rows[0] || {};
    const sessionCount = parseInt(trainingData.session_count) || 0;
    const trainingFrequency = Math.round((sessionCount / 30) * 7); // Sessions per week

    // Build comprehensive profile
    const profile = {
      // Basic info
      userId: userInfo.id,
      heightCm: userInfo.height_cm ? parseFloat(userInfo.height_cm) : null,
      weightKg: userInfo.weight_kg ? parseFloat(userInfo.weight_kg) : null,
      position: userInfo.position,
      birthDate: userInfo.birth_date,
      role: userInfo.role,
      experienceLevel: userInfo.experience_level,

      // Injuries
      injuries: injuriesResult.rows.map(row => ({
        type: row.type,
        severity: row.severity,
        status: row.status,
        start_date: row.start_date,
        recovery_date: row.recovery_date,
        description: row.description
      })),

      // Training statistics
      trainingFrequency: trainingFrequency,
      typicalDuration: trainingData.avg_duration ? Math.round(parseFloat(trainingData.avg_duration)) : null,
      avgIntensity: trainingData.avg_intensity ? parseFloat(trainingData.avg_intensity).toFixed(1) : null,
      recentSessions: recentSessionsResult.rows.map(row => ({
        type: row.session_type,
        duration: row.duration_minutes,
        intensity: row.intensity_level,
        date: row.session_date
      })),
      sessionTypes: trainingData.session_types || []
    };

    return createSuccessResponse(profile);
  } catch (error) {
    console.error('Error in user-profile function:', error);
    return createErrorResponse('Internal server error', 500);
  } finally {
    // Don't close pool - it's reused across invocations
  }
};


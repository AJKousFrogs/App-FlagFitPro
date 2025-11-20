// Netlify Function: Performance Heatmap API
// Returns training load data for the Training Heatmap component
// Endpoint: /api/performance/heatmap

const jwt = require("jsonwebtoken");
const { db, checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("CRITICAL: JWT_SECRET environment variable is not set!");
  throw new Error("JWT_SECRET environment variable is required for security");
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

/**
 * Calculate intensity level from training session data
 */
function calculateIntensity(duration, intensityLevel, sessionType) {
  // Base intensity calculation
  let baseIntensity = intensityLevel || 5;
  
  // Adjust based on session type
  const typeMultipliers = {
    speed: 1.2,
    strength: 1.1,
    agility: 1.0,
    endurance: 0.9,
    recovery: 0.5,
    technical: 0.8,
  };
  
  const multiplier = typeMultipliers[sessionType] || 1.0;
  const adjustedIntensity = baseIntensity * multiplier;
  
  // Scale to 0-7 range for heatmap
  return Math.min(7, Math.max(0, Math.round(adjustedIntensity)));
}

/**
 * Get training load heatmap data
 */
async function getHeatmapData(userId, timeRange) {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case "3months":
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case "6months":
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case "1year":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 6);
    }

    // Get training sessions in date range
    const { data: sessions, error } = await supabaseAdmin
      .from("training_sessions")
      .select("*")
      .eq("user_id", userId)
      .gte("session_date", startDate.toISOString().split("T")[0])
      .lte("session_date", endDate.toISOString().split("T")[0])
      .order("session_date", { ascending: true });

    if (error && error.code !== "42P01") {
      throw error;
    }

    const trainingSessions = sessions || [];

    // Group sessions by date
    const sessionsByDate = {};
    trainingSessions.forEach((session) => {
      const date = session.session_date || session.completed_at?.split("T")[0];
      if (!date) return;

      if (!sessionsByDate[date]) {
        sessionsByDate[date] = [];
      }
      sessionsByDate[date].push(session);
    });

    // Generate heatmap cells
    const cells = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const daySessions = sessionsByDate[dateStr] || [];

      if (daySessions.length > 0) {
        // Calculate aggregate metrics
        const totalDuration = daySessions.reduce(
          (sum, s) => sum + (s.duration_minutes || 0),
          0
        );
        
        const avgIntensity = daySessions.reduce(
          (sum, s) => sum + (s.intensity_level || 5),
          0
        ) / daySessions.length;

        const intensity = calculateIntensity(
          totalDuration,
          avgIntensity,
          daySessions[0]?.session_type || "mixed"
        );

        // Calculate value (intensity * 10 for display, or total duration for volume)
        const value = intensity * 10;

        cells.push({
          date: dateStr,
          value: Math.round(value),
          intensity,
          sessions: daySessions.length,
          duration: totalDuration,
        });
      } else {
        // No sessions on this date
        cells.push({
          date: dateStr,
          value: 0,
          intensity: 0,
          sessions: 0,
          duration: 0,
        });
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return cells;
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
    // Return empty data on error
    return [];
  }
}

/**
 * Generate mock heatmap data for development
 */
function generateMockHeatmapData(timeRange) {
  const cells = [];
  const endDate = new Date();
  const startDate = new Date();
  
  switch (timeRange) {
    case "3months":
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case "6months":
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case "1year":
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(endDate.getMonth() - 6);
  }

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const dayOfWeek = currentDate.getDay();
    
    // Simulate training pattern (more training Mon-Fri, less on weekends)
    const hasTraining = dayOfWeek >= 1 && dayOfWeek <= 5 && Math.random() > 0.3;
    
    if (hasTraining) {
      const intensity = Math.floor(Math.random() * 8); // 0-7
      const sessions = Math.floor(Math.random() * 3) + 1;
      const duration = Math.floor(Math.random() * 90) + 30;
      
      cells.push({
        date: dateStr,
        value: intensity * 10,
        intensity,
        sessions,
        duration,
      });
    } else {
      cells.push({
        date: dateStr,
        value: 0,
        intensity: 0,
        sessions: 0,
        duration: 0,
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return cells;
}

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  try {
    // Only allow GET requests
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: "Method not allowed",
        }),
      };
    }

    // Parse authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: "No token provided",
        }),
      };
    }

    // Extract and verify token
    const token = authHeader.substring(7);
    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: "Invalid or expired token",
        }),
      };
    }

    const userId = decoded.userId || decoded.id;
    const timeRange = event.queryStringParameters?.timeRange || "6months";

    // Check environment variables
    checkEnvVars();

    // Get heatmap data
    let cells = await getHeatmapData(userId, timeRange);

    // If no data, return mock data for development
    if (cells.length === 0) {
      cells = generateMockHeatmapData(timeRange);
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: {
          cells,
          timeRange,
        },
      }),
    };
  } catch (error) {
    console.error("Performance heatmap API error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
    };
  }
};


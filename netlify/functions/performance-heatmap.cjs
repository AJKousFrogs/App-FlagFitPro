// Netlify Function: Performance Heatmap API
// Returns training load data for the Training Heatmap component
// Endpoint: /api/performance/heatmap

const { db, checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  logFunctionCall,
  CORS_HEADERS
} = require("./utils/error-handler.cjs");
const { authenticateRequest } = require("./utils/auth-helper.cjs");
const { applyRateLimit } = require("./utils/rate-limiter.cjs");

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
  logFunctionCall('Performance-Heatmap', event);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
    };
  }

  try {
    // Only allow GET requests
    if (event.httpMethod !== "GET") {
      return createErrorResponse("Method not allowed", 405, 'method_not_allowed');
    }

    // Check environment variables
    checkEnvVars();

    // SECURITY: Apply rate limiting
    const rateLimitResponse = applyRateLimit(event, "READ");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // SECURITY: Authenticate request using Supabase
    const auth = await authenticateRequest(event);
    if (!auth.success) {
      return auth.error;
    }

    const userId = auth.user.id;
    const timeRange = event.queryStringParameters?.timeRange || "6months";

    // Get heatmap data
    let cells = await getHeatmapData(userId, timeRange);

    // If no data, return mock data for development
    if (cells.length === 0) {
      cells = generateMockHeatmapData(timeRange);
    }

    return createSuccessResponse({ cells, timeRange });
  } catch (error) {
    console.error("Error in performance-heatmap function:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    return handleServerError(error, 'Performance-Heatmap');
  }
};


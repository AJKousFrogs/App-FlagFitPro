// Netlify Function: Training Sessions API
// Handles creation and retrieval of training sessions for the Training Builder component
// Endpoint: /api/training/sessions

const { db, checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  handleValidationError,
  logFunctionCall,
  CORS_HEADERS
} = require("./utils/error-handler.cjs");
const { authenticateRequest } = require("./utils/auth-helper.cjs");
const { applyRateLimit } = require("./utils/rate-limiter.cjs");

/**
 * Create a training session from the Training Builder
 */
async function createTrainingSession(userId, sessionData) {
  try {
    const {
      exercises,
      duration,
      intensity,
      goals,
      equipment,
      scheduledDate,
      notes,
    } = sessionData;

    // Calculate total duration if not provided
    const totalDuration = duration || exercises.reduce((sum, ex) => sum + (ex.duration || 0), 0);

    // Map intensity to numeric value
    const intensityMap = {
      low: 3,
      medium: 6,
      high: 9,
    };
    const intensityLevel = intensityMap[intensity] || 6;

    // Determine session type from goals
    const sessionType = goals && goals.length > 0 ? goals[0] : "mixed";

    // Create session record
    const sessionRecord = {
      user_id: userId,
      session_date: scheduledDate || new Date().toISOString().split("T")[0],
      session_type: sessionType,
      duration_minutes: totalDuration,
      intensity_level: intensityLevel,
      status: "planned", // Will be updated to "completed" when session is finished
      notes: notes || `Generated session with ${exercises.length} exercises`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert into training_sessions table
    const { data: session, error } = await supabaseAdmin
      .from("training_sessions")
      .insert(sessionRecord)
      .select()
      .single();

    if (error) {
      // If table doesn't exist, return success with note
      if (error.code === "42P01") {
        return {
          success: true,
          id: `temp_${Date.now()}`,
          session: {
            ...sessionRecord,
            id: `temp_${Date.now()}`,
            exercises,
            equipment,
            goals,
          },
          note: "Table needs to be created via migration",
        };
      }
      // Handle PGRST116 (not found) - shouldn't happen on insert, but handle gracefully
      if (error.code === "PGRST116") {
        throw new Error("Failed to create training session");
      }
      throw error;
    }

    // Store exercise details in a separate table or JSONB field if available
    // For now, we'll return the session with exercises attached
    return {
      success: true,
      id: session.id,
      session: {
        ...session,
        exercises,
        equipment,
        goals,
      },
    };
  } catch (error) {
    console.error("Error creating training session:", error);
    throw error;
  }
}

/**
 * Get training sessions for a user
 */
async function getTrainingSessions(userId, queryParams) {
  try {
    const { status, startDate, endDate, limit = 50 } = queryParams || {};

    let query = supabaseAdmin
      .from("training_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("session_date", { ascending: false })
      .limit(parseInt(limit));

    if (status) {
      query = query.eq("status", status);
    }

    if (startDate) {
      query = query.gte("session_date", startDate);
    }

    if (endDate) {
      query = query.lte("session_date", endDate);
    }

    const { data: sessions, error } = await query;

    if (error && error.code !== "42P01") {
      throw error;
    }

    return sessions || [];
  } catch (error) {
    console.error("Error fetching training sessions:", error);
    return [];
  }
}

exports.handler = async (event, context) => {
  logFunctionCall('Training-Sessions', event);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
    };
  }

  try {
    // Check environment variables
    checkEnvVars();

    // SECURITY: Apply rate limiting
    const rateLimitType = event.httpMethod === "POST" ? "CREATE" : "READ";
    const rateLimitResponse = applyRateLimit(event, rateLimitType);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // SECURITY: Authenticate request using Supabase
    const auth = await authenticateRequest(event);
    if (!auth.success) {
      return auth.error;
    }

    const userId = auth.user.id;

    // Handle GET request - retrieve sessions
    if (event.httpMethod === "GET") {
      const sessions = await getTrainingSessions(userId, event.queryStringParameters);
      return createSuccessResponse(sessions);
    }

    // Handle POST request - create new session
    if (event.httpMethod === "POST") {
      // Parse and validate request body
      let sessionData = {};
      try {
        sessionData = JSON.parse(event.body);
      } catch (parseError) {
        return handleValidationError("Invalid JSON in request body");
      }

      // Validate required fields
      if (!sessionData.exercises || !Array.isArray(sessionData.exercises) || sessionData.exercises.length === 0) {
        return handleValidationError("Exercises array is required");
      }

      const result = await createTrainingSession(userId, sessionData);

      return createSuccessResponse(
        { session: result.session, id: result.id, note: result.note },
        201,
        "Training session created successfully"
      );
    }

    // Method not allowed
    return createErrorResponse("Method not allowed", 405, 'method_not_allowed');
  } catch (error) {
    console.error("Error in training-sessions function:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    return handleServerError(error, 'Training-Sessions');
  }
};


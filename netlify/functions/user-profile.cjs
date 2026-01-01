// User Profile API Endpoint
// Returns comprehensive user profile including body metrics, injuries, and training data

const { Pool } = require("pg");
const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "user-profile",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    handler: async (event, _context, { userId }) => {
      const requestedUserId = event.queryStringParameters?.userId || userId;

      // SECURITY: Only allow users to access their own profile (unless admin)
      if (requestedUserId !== userId) {
        return createErrorResponse(
          "Forbidden - Can only access your own profile",
          403,
        );
      }

      // Get user basic info
      const userResult = await pool.query(
        `SELECT id, height_cm, weight_kg, position, birth_date, role, experience_level
         FROM users
         WHERE id = $1`,
        [userId],
      );

      if (userResult.rows.length === 0) {
        return createErrorResponse("User not found", 404);
      }

      const userInfo = userResult.rows[0];

      // Get active and recent injuries
      const injuriesResult = await pool.query(
        `SELECT type, severity, status, start_date, recovery_date, description
         FROM injuries
         WHERE user_id = $1::text
           AND status IN ('active', 'recovering', 'monitoring', 'recovered')
         ORDER BY start_date DESC
         LIMIT 10`,
        [userId.toString()],
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
        [userId],
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
        [userId],
      );

      // Calculate training frequency (sessions per week)
      const trainingData = trainingResult.rows[0] || {};
      const sessionCount = parseInt(trainingData.session_count) || 0;
      const trainingFrequency = Math.round((sessionCount / 30) * 7);

      // Build comprehensive profile with null-safety flags (RISK-019 fix)
      const heightCm = userInfo.height_cm
        ? parseFloat(userInfo.height_cm)
        : null;
      const weightKg = userInfo.weight_kg
        ? parseFloat(userInfo.weight_kg)
        : null;

      // Flag incomplete profile data so UI can prompt user
      const profileComplete = !!(
        heightCm &&
        weightKg &&
        userInfo.birth_date &&
        userInfo.position
      );
      const missingFields = [];
      if (!heightCm) {
        missingFields.push("height");
      }
      if (!weightKg) {
        missingFields.push("weight");
      }
      if (!userInfo.birth_date) {
        missingFields.push("birthDate");
      }
      if (!userInfo.position) {
        missingFields.push("position");
      }

      const profile = {
        userId: userInfo.id,
        heightCm,
        weightKg,
        position: userInfo.position || null,
        birthDate: userInfo.birth_date || null,
        role: userInfo.role || "athlete",
        experienceLevel: userInfo.experience_level || "beginner",
        injuries: injuriesResult.rows.map((row) => ({
          type: row.type,
          severity: row.severity,
          status: row.status,
          start_date: row.start_date,
          recovery_date: row.recovery_date,
          description: row.description,
        })),
        trainingFrequency,
        typicalDuration: trainingData.avg_duration
          ? Math.round(parseFloat(trainingData.avg_duration))
          : 60, // Default to 60 min if no data
        avgIntensity: trainingData.avg_intensity
          ? parseFloat(trainingData.avg_intensity).toFixed(1)
          : "5.0", // Default to moderate if no data
        recentSessions: recentSessionsResult.rows.map((row) => ({
          type: row.session_type || "Training",
          duration: row.duration_minutes || 60,
          intensity: row.intensity_level || 5,
          date: row.session_date,
        })),
        sessionTypes: trainingData.session_types || [],
        // Profile completeness indicators for UI
        _profileComplete: profileComplete,
        _missingFields: missingFields,
      };

      return createSuccessResponse(profile);
    },
  });
};

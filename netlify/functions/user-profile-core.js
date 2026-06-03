import { Pool } from "pg";
import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

// User Profile API Endpoint
// Returns comprehensive user profile including body metrics, injuries, and training data

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Editable profile fields (API key → users column). Anything not listed here
// (email, role, status, onboarding/verification flags) is NOT user-editable.
const EDITABLE_COLUMNS = {
  fullName: "full_name",
  firstName: "first_name",
  lastName: "last_name",
  position: "position",
  secondaryPosition: "secondary_position",
  jerseyNumber: "jersey_number",
  heightCm: "height_cm",
  weightKg: "weight_kg",
  dateOfBirth: "date_of_birth",
  bio: "bio",
  phone: "phone",
  throwingArm: "throwing_arm",
  preferredUnits: "preferred_units",
  country: "country",
  avatarUrl: "avatar_url",
};

function coerceEditableValue(key, raw) {
  if (raw === null) {
    return { value: null };
  }
  if (key === "heightCm" || key === "weightKg") {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0 || n > 400) {
      return { error: `${key} must be a positive number` };
    }
    return { value: n };
  }
  if (key === "jerseyNumber") {
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0 || n > 999) {
      return { error: "jerseyNumber must be an integer between 0 and 999" };
    }
    return { value: n };
  }
  if (key === "dateOfBirth") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(raw))) {
      return { error: "dateOfBirth must be a YYYY-MM-DD date" };
    }
    return { value: String(raw) };
  }
  return { value: String(raw).slice(0, 500) };
}

// Update the caller's OWN profile (always scoped to userId — never another user).
async function updateOwnProfile(userId, body) {
  const setClauses = [];
  const values = [];
  let i = 1;
  for (const [apiKey, column] of Object.entries(EDITABLE_COLUMNS)) {
    if (body[apiKey] === undefined) {
      continue;
    }
    const coerced = coerceEditableValue(apiKey, body[apiKey]);
    if (coerced.error) {
      return createErrorResponse(coerced.error, 422, "validation_error");
    }
    setClauses.push(`${column} = $${i++}`);
    values.push(coerced.value);
  }
  if (setClauses.length === 0) {
    return createErrorResponse(
      "No editable profile fields provided",
      422,
      "validation_error",
    );
  }
  setClauses.push("updated_at = now()");
  values.push(userId);
  try {
    const result = await pool.query(
      `UPDATE users SET ${setClauses.join(", ")} WHERE id = $${i}
       RETURNING id, full_name, position, secondary_position, jersey_number,
                 height_cm, weight_kg, date_of_birth, bio, phone, throwing_arm,
                 preferred_units, country, avatar_url`,
      values,
    );
    if (result.rows.length === 0) {
      return createErrorResponse("User not found", 404);
    }
    return createSuccessResponse(
      { profile: result.rows[0] },
      200,
      "Profile updated",
    );
  } catch (error) {
    console.error(
      "[user-profile] profile update failed",
      error?.code ? { code: error.code } : {},
    );
    return createErrorResponse("Failed to update profile", 500, "server_error");
  }
}

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "user-profile",
    allowedMethods: ["GET", "PUT"],
    rateLimitType: event.httpMethod === "PUT" ? "DEFAULT" : "READ",
    requireAuth: true, // SECURITY: Explicit auth for user profile
    handler: async (event, _context, { userId }) => {
      // ── PUT: update the caller's own editable profile fields ───────────────
      if (event.httpMethod === "PUT") {
        let body;
        try {
          body = parseJsonObjectBody(event.body);
        } catch (parseError) {
          if (parseError?.message === "Request body must be an object") {
            return createErrorResponse(
              "Request body must be an object",
              422,
              "validation_error",
            );
          }
          return createErrorResponse(
            "Invalid JSON in request body",
            400,
            "invalid_json",
          );
        }
        return updateOwnProfile(userId, body);
      }

      const requestedUserId = event.queryStringParameters?.userId || userId;
      const userRole = await getUserRole(userId);
      const isAdmin = userRole === "admin";

      // SECURITY: Only allow users to access their own profile (unless admin)
      if (requestedUserId !== userId && !isAdmin) {
        return createErrorResponse(
          "Forbidden - Can only access your own profile",
          403,
        );
      }
      const targetUserId = requestedUserId;

      try {
        // Get user basic info
        const userResult = await pool.query(
          `SELECT id, height_cm, weight_kg, position, birth_date, role, experience_level
           FROM users
           WHERE id = $1`,
          [targetUserId],
        );

        if (userResult.rows.length === 0) {
          return createErrorResponse("User not found", 404);
        }

        const userInfo = userResult.rows[0];

        // Get active and recent injuries. Read from athlete_injuries (the clinical
        // table the physio writes via /api/staff-physiotherapist) — the shipped app
        // has no athlete self-log path to the legacy `injuries` table, so reading it
        // left the profile's injuries section permanently empty even when the physio
        // had logged one. Alias the clinical columns to the profile's expected shape.
        const injuriesResult = await pool.query(
          `SELECT injury_type AS type, injury_grade AS severity, recovery_status AS status,
                  injury_date AS start_date, diagnosis AS description
           FROM athlete_injuries
           WHERE user_id = $1
             AND recovery_status IN ('active', 'recovering', 'rehab')
           ORDER BY injury_date DESC
           LIMIT 10`,
          [targetUserId],
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
          [targetUserId],
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
          [targetUserId],
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
      } catch (error) {
        if (error?.code) {
          console.error("[user-profile] Unexpected handler error", { code: error.code });
        } else {
          console.error("[user-profile] Unexpected handler error");
        }
        return createErrorResponse("Failed to retrieve user profile", 500, "server_error");
      }
    },
  });
};

export const testHandler = handler;
export { handler };

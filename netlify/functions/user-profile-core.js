import { supabaseAdmin } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import { createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.user-profile-core" });

// User Profile API Endpoint
// Returns comprehensive user profile including body metrics, injuries, and training data.
// Uses the shared Supabase admin client (service role) like the rest of the
// functions — the previous direct `pg` Pool needed a DATABASE_URL that isn't set
// in this deployment, so every read 500'd and the profile screen showed nothing.

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
  const update = {};
  for (const [apiKey, column] of Object.entries(EDITABLE_COLUMNS)) {
    if (body[apiKey] === undefined) {
      continue;
    }
    const coerced = coerceEditableValue(apiKey, body[apiKey]);
    if (coerced.error) {
      return createErrorResponse(coerced.error, 422, "validation_error");
    }
    update[column] = coerced.value;
  }
  if (Object.keys(update).length === 0) {
    return createErrorResponse(
      "No editable profile fields provided",
      422,
      "validation_error",
    );
  }
  update.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("users")
    .update(update)
    .eq("id", userId)
    .select(
      "id, full_name, position, secondary_position, jersey_number, height_cm, weight_kg, date_of_birth, bio, phone, throwing_arm, preferred_units, country, avatar_url",
    )
    .maybeSingle();

  if (error) {
    logger.error(
      "profile_update_failed",
      error,
      error?.code ? { code: error.code } : {},
    );
    return createErrorResponse("Failed to update profile", 500, "server_error");
  }
  if (!data) {
    return createErrorResponse("User not found", 404, "not_found");
  }
  return createSuccessResponse({ profile: data }, 200, "Profile updated");
}

function isoDaysAgo(days) {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
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
        const parsedBody = tryParseJsonObjectBody(event.body);
        if (!parsedBody.ok) {
          return parsedBody.error;
        }
        body = parsedBody.data;
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
          "not_authorized",
        );
      }
      const targetUserId = requestedUserId;

      try {
        // Basic identity + physicals from the users table.
        // NB: there is no `role` column on users — role comes from getUserRole()
        // above. Selecting a non-existent column errors the whole query (this was
        // part of why the endpoint 500'd).
        const { data: userInfo, error: userError } = await supabaseAdmin
          .from("users")
          .select(
            "id, height_cm, weight_kg, position, birth_date, date_of_birth, experience_level",
          )
          .eq("id", targetUserId)
          .maybeSingle();

        if (userError) {
          throw userError;
        }
        if (!userInfo) {
          return createErrorResponse("User not found", 404, "not_found");
        }

        // Injuries (clinical table) + 30-day training stats + recent sessions —
        // independent, so run them concurrently. Any table-missing/permission
        // error degrades to "no data" rather than failing the whole profile.
        const [injuriesRes, training30Res, recentRes] = await Promise.all([
          supabaseAdmin
            .from("athlete_injuries")
            .select(
              "injury_type, injury_grade, recovery_status, injury_date, diagnosis",
            )
            .eq("user_id", targetUserId)
            .in("recovery_status", ["active", "recovering", "rehab"])
            .order("injury_date", { ascending: false })
            .limit(10),
          supabaseAdmin
            .from("training_sessions")
            .select("duration_minutes, intensity_level, session_type")
            .eq("user_id", targetUserId)
            .eq("status", "completed")
            .gte("session_date", isoDaysAgo(30)),
          supabaseAdmin
            .from("training_sessions")
            .select(
              "session_type, duration_minutes, intensity_level, session_date",
            )
            .eq("user_id", targetUserId)
            .eq("status", "completed")
            .gte("session_date", isoDaysAgo(7))
            .order("session_date", { ascending: false })
            .limit(5),
        ]);

        const t30 = training30Res.data ?? [];
        const sessionCount = t30.length;
        const trainingFrequency = Math.round((sessionCount / 30) * 7);
        const avg = (rows, key) => {
          const nums = rows
            .map((r) => Number(r[key]))
            .filter((n) => Number.isFinite(n));
          return nums.length
            ? nums.reduce((a, b) => a + b, 0) / nums.length
            : null;
        };
        const avgDuration = avg(t30, "duration_minutes");
        const avgIntensity = avg(t30, "intensity_level");
        const sessionTypes = [
          ...new Set(t30.map((r) => r.session_type).filter(Boolean)),
        ];

        const heightCm = userInfo.height_cm
          ? parseFloat(userInfo.height_cm)
          : null;
        const weightKg = userInfo.weight_kg
          ? parseFloat(userInfo.weight_kg)
          : null;
        // users.birth_date is legacy; onboarding/player-settings write date_of_birth.
        const birthDate = userInfo.birth_date || userInfo.date_of_birth || null;

        const missingFields = [];
        if (!heightCm) {
          missingFields.push("height");
        }
        if (!weightKg) {
          missingFields.push("weight");
        }
        if (!birthDate) {
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
          birthDate,
          role: userRole || "athlete",
          experienceLevel: userInfo.experience_level || "beginner",
          injuries: (injuriesRes.data ?? []).map((row) => ({
            type: row.injury_type,
            severity: row.injury_grade,
            status: row.recovery_status,
            start_date: row.injury_date,
            description: row.diagnosis,
          })),
          trainingFrequency,
          typicalDuration: avgDuration ? Math.round(avgDuration) : null,
          avgIntensity: avgIntensity !== null ? avgIntensity.toFixed(1) : null,
          recentSessions: (recentRes.data ?? []).map((row) => ({
            type: row.session_type || "Training",
            duration: row.duration_minutes || 60,
            intensity: row.intensity_level || 5,
            date: row.session_date,
          })),
          sessionTypes,
          // Profile completeness indicators for UI
          _profileComplete: !!(
            heightCm &&
            weightKg &&
            birthDate &&
            userInfo.position
          ),
          _missingFields: missingFields,
        };

        return createSuccessResponse(profile);
      } catch (error) {
        logger.error(
          "profile_handler_error",
          error,
          error?.code ? { code: error.code } : {},
        );
        return createErrorResponse(
          "Failed to retrieve user profile",
          500,
          "server_error",
        );
      }
    },
  });
};

export const testHandler = handler;
export { handler };

import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse, handleValidationError } from "./utils/error-handler.js";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidDateString(value) {
  if (typeof value !== "string") {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function validateSettingsPayload(payload) {
  if (!isPlainObject(payload)) {
    return "Request body must be an object";
  }
  if (
    payload.primaryPosition !== undefined &&
    (typeof payload.primaryPosition !== "string" ||
      payload.primaryPosition.trim().length === 0 ||
      payload.primaryPosition.length > 64)
  ) {
    return "primaryPosition must be a non-empty string up to 64 characters";
  }
  if (
    payload.secondaryPosition !== undefined &&
    payload.secondaryPosition !== null &&
    (typeof payload.secondaryPosition !== "string" ||
      payload.secondaryPosition.length > 64)
  ) {
    return "secondaryPosition must be a string up to 64 characters";
  }
  if (
    payload.birthDate !== undefined &&
    payload.birthDate !== null &&
    !isValidDateString(payload.birthDate)
  ) {
    return "birthDate must be a valid date string";
  }
  if (
    payload.availabilitySchedule !== undefined &&
    !Array.isArray(payload.availabilitySchedule)
  ) {
    return "availabilitySchedule must be an array";
  }
  if (
    payload.preferredTrainingDays !== undefined &&
    (!Array.isArray(payload.preferredTrainingDays) ||
      payload.preferredTrainingDays.some(
        (d) => !Number.isInteger(d) || d < 0 || d > 6,
      ))
  ) {
    return "preferredTrainingDays must be an array of integers between 0 and 6";
  }
  if (
    payload.maxSessionsPerWeek !== undefined &&
    (!Number.isInteger(payload.maxSessionsPerWeek) ||
      payload.maxSessionsPerWeek < 1 ||
      payload.maxSessionsPerWeek > 14)
  ) {
    return "maxSessionsPerWeek must be an integer between 1 and 14";
  }
  if (
    payload.hasGymAccess !== undefined &&
    typeof payload.hasGymAccess !== "boolean"
  ) {
    return "hasGymAccess must be a boolean";
  }
  if (
    payload.hasFieldAccess !== undefined &&
    typeof payload.hasFieldAccess !== "boolean"
  ) {
    return "hasFieldAccess must be a boolean";
  }
  if (
    payload.warmupFocus !== undefined &&
    payload.warmupFocus !== null &&
    (typeof payload.warmupFocus !== "string" || payload.warmupFocus.length > 120)
  ) {
    return "warmupFocus must be a string up to 120 characters";
  }
  return null;
}

/**
 * Player Settings API
 *
 * Endpoints:
 * - GET /api/player-settings - Get player's training settings
 * - POST /api/player-settings - Save/update player settings
 */

export const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "player-settings",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId, supabase }) => {
      try {
        if (evt.httpMethod === "GET") {
          return getSettings(supabase, userId);
        }

        let payload = {};
        try {
          payload = evt.body ? JSON.parse(evt.body) : {};
        } catch (_parseError) {
          return handleValidationError("Invalid JSON in request body");
        }
        const validationError = validateSettingsPayload(payload);
        if (validationError) {
          return handleValidationError(validationError);
        }
        return saveSettings(supabase, userId, payload);
      } catch (err) {
        console.error("Player settings error:", err);
        return createErrorResponse("Internal server error", 500, "server_error");
      }
    },
  });

/**
 * GET /api/player-settings
 */
async function getSettings(supabase, userId) {
  // Get from athlete_training_config
  const { data: config, error } = await supabase
    .from("athlete_training_config")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  // If no config exists, return defaults
  if (!config) {
    // Try to get birth date from users table
    const { data: userData } = await supabase
      .from("users")
      .select("date_of_birth, birth_date")
      .eq("id", userId)
      .single();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          primaryPosition: "wr_db",
          secondaryPosition: null,
          birthDate: userData?.date_of_birth || userData?.birth_date || null,
          availabilitySchedule: [],
          availabilityDisclaimer:
            "Availability does not schedule practice. Coaches schedule team activities.",
          preferredTrainingDays: [1, 2, 4, 5, 6],
          maxSessionsPerWeek: 5,
          hasGymAccess: true,
          hasFieldAccess: true,
          warmupFocus: null,
        },
      }),
    };
  }

  // Transform to frontend format
  // PROMPT 2.11: Rename flag_practice_schedule to availability (non-authority)
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: {
        primaryPosition: config.primary_position,
        secondaryPosition: config.secondary_position,
        birthDate: config.birth_date,
        // DEPRECATED: flagPracticeSchedule renamed to availabilitySchedule
        // This is for player availability notes only, NOT authority for team activities
        availabilitySchedule: config.flag_practice_schedule || [], // Keep DB field name for now
        availabilityDisclaimer:
          "Availability does not schedule practice. Coaches schedule team activities.",
        preferredTrainingDays: config.preferred_training_days || [
          1, 2, 4, 5, 6,
        ],
        maxSessionsPerWeek: config.max_sessions_per_week || 5,
        hasGymAccess: config.has_gym_access !== false,
        hasFieldAccess: config.has_field_access !== false,
        warmupFocus: config.warmup_focus || null,
        availableEquipment: config.available_equipment || [
          "bodyweight",
          "resistance_bands",
        ],
        currentLimitations: config.current_limitations || [],
      },
    }),
  };
}

/**
 * POST /api/player-settings
 */
async function saveSettings(supabase, userId, payload) {
  const {
    primaryPosition,
    secondaryPosition,
    birthDate,
    availabilitySchedule, // PROMPT 2.11: Renamed from flagPracticeSchedule
    preferredTrainingDays,
    maxSessionsPerWeek,
    hasGymAccess,
    hasFieldAccess,
    warmupFocus,
  } = payload;

  // Map availabilitySchedule back to DB field (for backward compatibility)
  const flagPracticeSchedule =
    availabilitySchedule || payload.flagPracticeSchedule || [];

  // Calculate age recovery modifier if birth date provided
  let ageRecoveryModifier = 1.0;
  const acwrTargetMin = 0.8;
  let acwrTargetMax = 1.3;

  if (birthDate) {
    const age = calculateAge(birthDate);
    const { data: modifier } = await supabase
      .from("age_recovery_modifiers")
      .select("recovery_modifier, acwr_max_adjustment")
      .lte("age_min", age)
      .gte("age_max", age)
      .single();

    if (modifier) {
      ageRecoveryModifier = parseFloat(modifier.recovery_modifier);
      acwrTargetMax = 1.3 + parseFloat(modifier.acwr_max_adjustment);
    }
  }

  // Upsert config
  const { data: config, error } = await supabase
    .from("athlete_training_config")
    .upsert(
      {
        user_id: userId,
        primary_position: primaryPosition || "wr_db",
        secondary_position: secondaryPosition || null,
        birth_date: birthDate || null,
        flag_practice_schedule: flagPracticeSchedule || [],
        preferred_training_days: preferredTrainingDays || [1, 2, 4, 5, 6],
        max_sessions_per_week: maxSessionsPerWeek ?? 5,
        has_gym_access: hasGymAccess !== false,
        has_field_access: hasFieldAccess !== false,
        warmup_focus: warmupFocus || null,
        age_recovery_modifier: ageRecoveryModifier,
        acwr_target_min: acwrTargetMin,
        acwr_target_max: acwrTargetMax,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Also update users table with birth date if provided
  if (birthDate) {
    try {
      await supabase
        .from("users")
        .update({ date_of_birth: birthDate })
        .eq("id", userId);
    } catch (updateError) {
      console.warn("Could not update users table:", updateError.message);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: {
        primaryPosition: config.primary_position,
        secondaryPosition: config.secondary_position,
        birthDate: config.birth_date,
        availabilitySchedule: config.flag_practice_schedule, // PROMPT 2.11: Renamed
        availabilityDisclaimer:
          "Availability does not schedule practice. Coaches schedule team activities.",
        preferredTrainingDays: config.preferred_training_days,
        maxSessionsPerWeek: config.max_sessions_per_week,
        hasGymAccess: config.has_gym_access,
        hasFieldAccess: config.has_field_access,
        warmupFocus: config.warmup_focus || null,
        ageRecoveryModifier: config.age_recovery_modifier,
        acwrTargetRange: {
          min: config.acwr_target_min,
          max: config.acwr_target_max,
        },
      },
      message: "Settings saved successfully",
    }),
  };
}

/**
 * Calculate age from birth date
 */
function calculateAge(birthDateStr) {
  const today = new Date();
  const birth = new Date(birthDateStr);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

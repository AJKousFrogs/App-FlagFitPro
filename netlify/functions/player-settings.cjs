/**
 * Player Settings API
 *
 * Endpoints:
 * - GET /api/player-settings - Get player's training settings
 * - POST /api/player-settings - Save/update player settings
 */

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getSupabase = (authHeader) => {
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    return createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

exports.handler = async (event) => {
  const { httpMethod, body, headers } = event;
  const authHeader = headers.authorization || headers.Authorization;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (!authHeader) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Authorization required" }),
    };
  }

  const supabase = getSupabase(authHeader);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid authentication" }),
    };
  }

  try {
    if (httpMethod === "GET") {
      return await getSettings(supabase, user.id, corsHeaders);
    }

    if (httpMethod === "POST") {
      const payload = body ? JSON.parse(body) : {};
      return await saveSettings(supabase, user.id, payload, corsHeaders);
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Not found" }),
    };
  } catch (err) {
    console.error("Player settings error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Internal server error",
        message: err.message,
      }),
    };
  }
};

/**
 * GET /api/player-settings
 */
async function getSettings(supabase, userId, headers) {
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
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          primaryPosition: "wr_db",
          secondaryPosition: null,
          birthDate: userData?.date_of_birth || userData?.birth_date || null,
          flagPracticeSchedule: [],
          preferredTrainingDays: [1, 2, 4, 5, 6],
          maxSessionsPerWeek: 5,
          hasGymAccess: true,
          hasFieldAccess: true,
        },
      }),
    };
  }

  // Transform to frontend format
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: {
        primaryPosition: config.primary_position,
        secondaryPosition: config.secondary_position,
        birthDate: config.birth_date,
        flagPracticeSchedule: config.flag_practice_schedule || [],
        preferredTrainingDays: config.preferred_training_days || [
          1, 2, 4, 5, 6,
        ],
        maxSessionsPerWeek: config.max_sessions_per_week || 5,
        hasGymAccess: config.has_gym_access !== false,
        hasFieldAccess: config.has_field_access !== false,
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
async function saveSettings(supabase, userId, payload, headers) {
  const {
    primaryPosition,
    secondaryPosition,
    birthDate,
    flagPracticeSchedule,
    preferredTrainingDays,
    maxSessionsPerWeek,
    hasGymAccess,
    hasFieldAccess,
  } = payload;

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
        max_sessions_per_week: maxSessionsPerWeek || 5,
        has_gym_access: hasGymAccess !== false,
        has_field_access: hasFieldAccess !== false,
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
    headers,
    body: JSON.stringify({
      success: true,
      data: {
        primaryPosition: config.primary_position,
        secondaryPosition: config.secondary_position,
        birthDate: config.birth_date,
        flagPracticeSchedule: config.flag_practice_schedule,
        preferredTrainingDays: config.preferred_training_days,
        maxSessionsPerWeek: config.max_sessions_per_week,
        hasGymAccess: config.has_gym_access,
        hasFieldAccess: config.has_field_access,
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

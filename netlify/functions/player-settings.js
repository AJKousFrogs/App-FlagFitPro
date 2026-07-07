import { baseHandler } from "./utils/base-handler.js";
import {
  createErrorResponse,
  createSuccessResponse,
  handleValidationError,
} from "./utils/error-handler.js";
import {
  parseJsonObjectBody,
  isValidDateString,
} from "./utils/input-validator.js";
import { createLogger, makeRequestLogger } from "./utils/structured-logger.js";
import { supabaseAdmin } from "./utils/supabase-client.js";

const DEFAULT_DAILY_ROUTINE = [
  { id: "wake", label: "Wake Up", time: "07:00", icon: "pi-sun" },
  { id: "breakfast", label: "Breakfast", time: "08:15", icon: "pi-apple" },
  {
    id: "work_start",
    label: "Work/Study Start",
    time: "09:00",
    icon: "pi-briefcase",
  },
  { id: "lunch", label: "Lunch", time: "12:30", icon: "pi-utensils" },
  {
    id: "work_end",
    label: "Work/Study End",
    time: "17:00",
    icon: "pi-home",
  },
  {
    id: "training",
    label: "Daily Training",
    time: "18:00",
    icon: "pi-bolt",
  },
  {
    id: "shower",
    label: "Shower (Hot)",
    time: "20:00",
    icon: "pi-info-circle",
  },
  { id: "sleep", label: "Sleep", time: "22:30", icon: "pi-moon" },
];

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isMissingRelationError(error) {
  const code = error?.code;
  const message = `${error?.message || ""}`.toLowerCase();
  return (
    ["PGRST106", "PGRST116", "PGRST204", "42P01", "42703"].includes(code) ||
    message.includes("does not exist") ||
    message.includes("relation")
  );
}

function isValidTimeString(value) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isValidRoutineSlot(value) {
  return (
    isPlainObject(value) &&
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    value.id.length <= 64 &&
    typeof value.label === "string" &&
    value.label.trim().length > 0 &&
    value.label.length <= 120 &&
    isValidTimeString(value.time) &&
    (value.description === undefined ||
      value.description === null ||
      (typeof value.description === "string" &&
        value.description.length <= 240)) &&
    (value.icon === undefined ||
      value.icon === null ||
      (typeof value.icon === "string" && value.icon.length <= 64))
  );
}

/** Unique sorted day indices 0–6 (Sun–Sat) from mixed client/DB values. */
function coercePreferredTrainingDaysArray(value) {
  if (!Array.isArray(value)) {
    return null;
  }
  const seen = new Set();
  const out = [];
  for (const raw of value) {
    const n = typeof raw === "string" ? Number.parseInt(raw, 10) : Number(raw);
    if (!Number.isInteger(n) || n < 0 || n > 6) {
      continue;
    }
    if (!seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  out.sort((a, b) => a - b);
  return out.length > 0 ? out : null;
}

/**
 * Coerce client payloads (multi-select form input, JSON) into integer day indices 0–6.
 * Mutates payload.preferredTrainingDays when present.
 */
function normalizePreferredTrainingDaysPayload(payload) {
  if (payload.preferredTrainingDays === undefined) {
    return;
  }
  if (!Array.isArray(payload.preferredTrainingDays)) {
    return;
  }
  const coerced = coercePreferredTrainingDaysArray(
    payload.preferredTrainingDays,
  );
  payload.preferredTrainingDays = coerced ?? [];
}

/** Coerce numeric fields that often arrive as strings from forms. */
function normalizeNumericFieldsPayload(payload) {
  if (
    payload.maxSessionsPerWeek !== undefined &&
    payload.maxSessionsPerWeek !== null
  ) {
    const raw = payload.maxSessionsPerWeek;
    const n = typeof raw === "string" ? Number.parseInt(raw, 10) : Number(raw);
    if (Number.isFinite(n)) {
      payload.maxSessionsPerWeek = Math.round(n);
    }
  }
}

/** Coerce {days:int[0-6], time:"HH:mm"} for recurring team-practice days. */
function normalizeTeamTrainingDays(value) {
  const fallback = { days: [], time: "18:00" };
  if (!isPlainObject(value)) {
    // also accept a bare array of weekday ints
    if (Array.isArray(value)) {
      return {
        days: coercePreferredTrainingDaysArray(value) ?? [],
        time: "18:00",
      };
    }
    return fallback;
  }
  const days = coercePreferredTrainingDaysArray(value.days) ?? [];
  const time = isValidTimeString(value.time) ? value.time : "18:00";
  return { days, time };
}

function normalizeSettingsPayload(payload) {
  if (!isPlainObject(payload)) {
    return;
  }
  normalizePreferredTrainingDaysPayload(payload);
  normalizeNumericFieldsPayload(payload);
  if (payload.teamTrainingDays !== undefined) {
    payload.teamTrainingDays = normalizeTeamTrainingDays(
      payload.teamTrainingDays,
    );
  }
}

function sanitizeDailyRoutine(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return DEFAULT_DAILY_ROUTINE.map((slot) => ({ ...slot }));
  }

  const normalized = value
    .filter((slot) => isValidRoutineSlot(slot))
    .map((slot) => ({
      id: slot.id.trim(),
      label: slot.label.trim(),
      time: slot.time,
      ...(typeof slot.description === "string" && slot.description.trim()
        ? { description: slot.description.trim() }
        : {}),
      ...(typeof slot.icon === "string" && slot.icon.trim()
        ? { icon: slot.icon.trim() }
        : {}),
    }));

  return normalized.length > 0
    ? normalized
    : DEFAULT_DAILY_ROUTINE.map((slot) => ({ ...slot }));
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
    (typeof payload.warmupFocus !== "string" ||
      payload.warmupFocus.length > 120)
  ) {
    return "warmupFocus must be a string up to 120 characters";
  }
  if (
    payload.availableEquipment !== undefined &&
    !Array.isArray(payload.availableEquipment)
  ) {
    return "availableEquipment must be an array";
  }
  if (
    payload.currentLimitations !== undefined &&
    payload.currentLimitations !== null &&
    !isPlainObject(payload.currentLimitations) &&
    !Array.isArray(payload.currentLimitations)
  ) {
    return "currentLimitations must be an object, array, or null";
  }
  if (
    payload.dailyRoutine !== undefined &&
    (!Array.isArray(payload.dailyRoutine) ||
      payload.dailyRoutine.some((slot) => !isValidRoutineSlot(slot)))
  ) {
    return "dailyRoutine must be an array of routine slots with id, label, and time";
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

const logger = createLogger({ service: "netlify.player-settings" });

const createRequestLogger = makeRequestLogger(logger);

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "player-settings",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (
      evt,
      _ctx,
      { userId, supabase, requestId, correlationId },
    ) => {
      const requestLogger = createRequestLogger(evt, {
        requestId,
        correlationId,
      });
      try {
        if (evt.httpMethod === "GET") {
          return getSettings(supabase, userId);
        }

        let payload = {};
        try {
          payload = parseJsonObjectBody(evt.body);
        } catch (_parseError) {
          return handleValidationError("Invalid JSON in request body");
        }
        normalizeSettingsPayload(payload);
        const validationError = validateSettingsPayload(payload);
        if (validationError) {
          return handleValidationError(validationError);
        }
        return saveSettings(supabase, userId, payload, requestLogger);
      } catch (err) {
        requestLogger.error("player_settings_handler_error", err, {
          user_id: userId,
        });
        return createErrorResponse(
          "Internal server error",
          500,
          "server_error",
        );
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

  if (error && error.code !== "PGRST116" && !isMissingRelationError(error)) {
    throw error;
  }

  // If no config exists, return defaults
  if (!config || isMissingRelationError(error)) {
    // Try to get birth date from users table
    const { data: userData } = await supabase
      .from("users")
      .select("date_of_birth, birth_date, weight_kg")
      .eq("id", userId)
      .single();

    return createSuccessResponse({
      primaryPosition: "wr_db",
      secondaryPosition: null,
      birthDate: userData?.date_of_birth || userData?.birth_date || null,
      weightKg: userData?.weight_kg ?? null,
      seasonCalendar: [],
      season_calendar: [],
      availabilitySchedule: [],
      availabilityDisclaimer:
        "Availability does not schedule practice. Coaches schedule team activities.",
      preferredTrainingDays: [1, 2, 4, 5, 6],
      teamTrainingDays: { days: [], time: "18:00" },
      maxSessionsPerWeek: 5,
      hasGymAccess: true,
      hasFieldAccess: true,
      warmupFocus: null,
      dailyRoutine: DEFAULT_DAILY_ROUTINE,
    });
  }

  // weight_kg lives in the users table, not athlete_training_config — fetch it.
  const { data: userPhysicals } = await supabase
    .from("users")
    .select("weight_kg")
    .eq("id", userId)
    .single();

  // Transform to frontend format
  // PROMPT 2.11: Rename flag_practice_schedule to availability (non-authority)
  return createSuccessResponse({
    primaryPosition: config.primary_position,
    secondaryPosition: config.secondary_position,
    birthDate: config.birth_date,
    weightKg: userPhysicals?.weight_kg ?? null,
    // DEPRECATED: flagPracticeSchedule renamed to availabilitySchedule
    // This is for player availability notes only, NOT authority for team activities
    availabilitySchedule: config.flag_practice_schedule || [], // Keep DB field name for now
    availabilityDisclaimer:
      "Availability does not schedule practice. Coaches schedule team activities.",
    teamTrainingDays: normalizeTeamTrainingDays(config.team_training_days),
    dailyRoutine: sanitizeDailyRoutine(config.daily_routine),
    maxSessionsPerWeek: config.max_sessions_per_week || 5,
    hasGymAccess: config.has_gym_access !== false,
    hasFieldAccess: config.has_field_access !== false,
    warmupFocus: config.warmup_focus || null,
    availableEquipment: config.available_equipment || [
      "bodyweight",
      "resistance_bands",
    ],
    seasonCalendar: config.season_calendar || [],
    season_calendar: config.season_calendar || [],
    currentLimitations: config.current_limitations || [],
  });
}

/**
 * POST /api/player-settings
 */
async function saveSettings(supabase, userId, payload, log = logger) {
  const {
    secondaryPosition,
    availabilitySchedule, // PROMPT 2.11: Renamed from flagPracticeSchedule
    preferredTrainingDays,
    dailyRoutine,
    maxSessionsPerWeek,
    hasGymAccess,
    hasFieldAccess,
    warmupFocus,
    currentLimitations,
  } = payload;

  // Accept BOTH the Settings-screen contract and the onboarding payload shape.
  // Onboarding sends position/dateOfBirth/equipment/seasonCalendar/jerseyNumber/
  // heightCm/weightKg; without these aliases the whole onboarding form was dropped
  // (primary_position silently defaulted to "wr_db", DOB/season/physicals lost).
  const primaryPosition = payload.primaryPosition ?? payload.position;
  const birthDate = payload.birthDate ?? payload.dateOfBirth;
  const availableEquipment = payload.availableEquipment ?? payload.equipment;
  const seasonCalendar = payload.seasonCalendar ?? payload.season_calendar;
  const { jerseyNumber, heightCm, weightKg, teamTrainingDays } = payload;

  const flagPracticeSchedule = availabilitySchedule || [];

  // Derive boolean access flags from the equipment array when not explicitly provided.
  // Onboarding sends equipment: ["Gym","Field",...] but not hasGymAccess/hasFieldAccess.
  // Without this, warmup variant always defaults to gym+field even when the player chose neither.
  const equipmentLower = Array.isArray(availableEquipment)
    ? availableEquipment.map((e) => String(e).toLowerCase())
    : [];
  const resolvedHasGymAccess =
    hasGymAccess !== undefined
      ? hasGymAccess
      : availableEquipment !== undefined
        ? equipmentLower.includes("gym")
        : true;
  const resolvedHasFieldAccess =
    hasFieldAccess !== undefined
      ? hasFieldAccess
      : availableEquipment !== undefined
        ? equipmentLower.includes("field")
        : true;

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

  // Upsert config. Every optional field below is included ONLY when present in
  // this request's payload (the `!== undefined` guards) — an omitted key is left
  // out of the upsert object entirely, which Postgres leaves untouched on UPDATE
  // and falls through to the column's own DEFAULT on INSERT.
  //
  // Previously every field used a bare `value || default` fallback and was
  // written UNCONDITIONALLY on every call, so any partial settings save (e.g.
  // Settings' savePosition() sending only { primaryPosition }, or saveEquipment()
  // sending only { availableEquipment }) silently reset EVERY other field back to
  // its default: season_calendar/available_equipment to [], birth_date/
  // warmup_focus/current_limitations to null, daily_routine to the canned
  // DEFAULT_DAILY_ROUTINE, has_gym_access/has_field_access to true,
  // primary_position to 'wr_db'. teamTrainingDays already used this correct
  // conditional-spread pattern; the rest now match it.
  const { data: config, error } = await supabase
    .from("athlete_training_config")
    .upsert(
      {
        user_id: userId,
        ...(primaryPosition !== undefined
          ? { primary_position: primaryPosition || "wr_db" }
          : {}),
        ...(secondaryPosition !== undefined
          ? { secondary_position: secondaryPosition || null }
          : {}),
        ...(birthDate !== undefined ? { birth_date: birthDate || null } : {}),
        ...(availabilitySchedule !== undefined
          ? { flag_practice_schedule: flagPracticeSchedule }
          : {}),
        // preferred_training_days: DEPRECATED legacy field — superseded by
        // team_training_days; no engine reads it. Stopped writing ahead of the
        // rename migration (I6). The input is still accepted/validated but ignored.
        ...(dailyRoutine !== undefined
          ? { daily_routine: sanitizeDailyRoutine(dailyRoutine) }
          : {}),
        ...(maxSessionsPerWeek !== undefined
          ? { max_sessions_per_week: maxSessionsPerWeek ?? 5 }
          : {}),
        // has_gym_access/has_field_access resolve from an explicit boolean OR are
        // derived from the equipment array, so write them when EITHER source is
        // part of this call — otherwise an unrelated save would reset access.
        ...(hasGymAccess !== undefined || availableEquipment !== undefined
          ? { has_gym_access: resolvedHasGymAccess }
          : {}),
        ...(hasFieldAccess !== undefined || availableEquipment !== undefined
          ? { has_field_access: resolvedHasFieldAccess }
          : {}),
        ...(warmupFocus !== undefined
          ? { warmup_focus: warmupFocus || null }
          : {}),
        ...(availableEquipment !== undefined
          ? { available_equipment: availableEquipment || [] }
          : {}),
        ...(seasonCalendar !== undefined
          ? {
              season_calendar: Array.isArray(seasonCalendar)
                ? seasonCalendar
                : [],
            }
          : {}),
        // recurring flag-football team-practice days; omitted key (undefined) is
        // dropped from the upsert, so unprovided → unchanged (default on insert).
        ...(teamTrainingDays !== undefined
          ? { team_training_days: teamTrainingDays }
          : {}),
        ...(currentLimitations !== undefined
          ? { current_limitations: currentLimitations || null }
          : {}),
        // Age-derived fields only recompute (and only overwrite) when birthDate
        // is actually part of this call — otherwise a previously-computed
        // age_recovery_modifier/acwr_target_max would reset to the generic
        // default (1.0 / 1.3) on every unrelated settings save.
        ...(birthDate !== undefined
          ? {
              age_recovery_modifier: ageRecoveryModifier,
              acwr_target_min: acwrTargetMin,
              acwr_target_max: acwrTargetMax,
            }
          : {}),
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

  // Mirror identity/physical fields onto users (onboarding collects these and the
  // profile/roster/nutrition screens read them from users). Use supabaseAdmin for the
  // upsert so the row is created if it doesn't exist yet (new user who hasn't done a
  // wellness check-in). The user-context client's update() silently does nothing for
  // missing rows, losing all onboarding data.
  const userUpdate = {
    // Always mark onboarding complete — once the profile is saved, the athlete is in.
    onboarding_completed: true,
    onboarding_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (birthDate) {
    userUpdate.date_of_birth = birthDate;
  }
  if (primaryPosition) {
    userUpdate.position = primaryPosition;
  }
  if (
    jerseyNumber !== undefined &&
    jerseyNumber !== null &&
    !Number.isNaN(Number(jerseyNumber))
  ) {
    userUpdate.jersey_number = Number(jerseyNumber);
  }
  if (
    heightCm !== undefined &&
    heightCm !== null &&
    !Number.isNaN(Number(heightCm))
  ) {
    userUpdate.height_cm = Number(heightCm);
  }
  if (
    weightKg !== undefined &&
    weightKg !== null &&
    !Number.isNaN(Number(weightKg))
  ) {
    userUpdate.weight_kg = Number(weightKg);
  }

  try {
    // Atomically guarantee the row exists (same RPC wellness-checkin's
    // upsert_wellness_checkin uses) before updating it — avoids the race in a
    // separate check-then-insert (two concurrent onboarding submits both seeing
    // "row missing" and both inserting, the second violating the id PK).
    const { error: ensureError } = await supabaseAdmin.rpc(
      "ensure_public_user_profile",
      { p_user_id: userId },
    );
    if (ensureError) {
      throw ensureError;
    }

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update(userUpdate)
      .eq("id", userId);
    if (updateError) {
      throw updateError;
    }
  } catch (updateError) {
    log.warn("player_settings_user_update_warning", {
      message: "Could not upsert users table",
      err: updateError?.message,
      user_id: userId,
    });
  }

  return createSuccessResponse(
    {
      primaryPosition: config.primary_position,
      secondaryPosition: config.secondary_position,
      birthDate: config.birth_date,
      seasonCalendar: config.season_calendar || [],
      season_calendar: config.season_calendar || [],
      availabilitySchedule: config.flag_practice_schedule, // PROMPT 2.11: Renamed
      availabilityDisclaimer:
        "Availability does not schedule practice. Coaches schedule team activities.",
      teamTrainingDays: normalizeTeamTrainingDays(config.team_training_days),
      dailyRoutine: sanitizeDailyRoutine(config.daily_routine),
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
    200,
    "Settings saved successfully",
  );
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

export const testHandler = handler;
export { handler };

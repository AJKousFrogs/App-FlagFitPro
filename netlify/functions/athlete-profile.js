import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from "./utils/error-handler.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import { supabaseAdmin } from "./supabase-client.js";

// Netlify Function: Athlete Profile API
// Self-service basic bio-profile fields on `users` (the existing canonical
// location for date_of_birth/position/height_cm/weight_kg) — no role gate,
// every authenticated user may read/update their own row.

const FIELD_MAP = {
  athleteName: "full_name",
  dateOfBirth: "date_of_birth",
  position: "position",
  height: "height_cm",
  weight: "weight_kg",
  sport: "sport",
  yearsExperience: "years_experience",
  medicalHistory: "medical_history",
  emergencyContactName: "emergency_contact_name",
  emergencyContactPhone: "emergency_contact_phone",
};

async function handleGet(userId) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select(
      "full_name, date_of_birth, position, height_cm, weight_kg, sport, years_experience, medical_history, emergency_contact_name, emergency_contact_phone",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return createSuccessResponse(null);
  }

  return createSuccessResponse({
    athlete_name: data.full_name,
    date_of_birth: data.date_of_birth,
    position: data.position,
    height: data.height_cm,
    weight: data.weight_kg,
    sport: data.sport,
    years_experience: data.years_experience,
    medical_history: data.medical_history,
    emergency_contact_name: data.emergency_contact_name,
    emergency_contact_phone: data.emergency_contact_phone,
  });
}

async function handlePost(userId, body) {
  const update = {};
  for (const [fromKey, toColumn] of Object.entries(FIELD_MAP)) {
    if (body[fromKey] !== undefined) {
      update[toColumn] = body[fromKey] === "" ? null : body[fromKey];
    }
  }

  if (Object.keys(update).length === 0) {
    return createErrorResponse(
      "No recognized profile fields in request body",
      422,
      ErrorType.VALIDATION,
    );
  }

  update.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("users")
    .update(update)
    .eq("id", userId)
    .select(
      "full_name, date_of_birth, position, height_cm, weight_kg, sport, years_experience, medical_history, emergency_contact_name, emergency_contact_phone",
    )
    .single();

  if (error) {
    throw error;
  }

  return createSuccessResponse({
    athlete_name: data.full_name,
    date_of_birth: data.date_of_birth,
    position: data.position,
    height: data.height_cm,
    weight: data.weight_kg,
    sport: data.sport,
    years_experience: data.years_experience,
    medical_history: data.medical_history,
    emergency_contact_name: data.emergency_contact_name,
    emergency_contact_phone: data.emergency_contact_phone,
  });
}

async function handleRequest(event, _context, { userId }) {
  if (event.httpMethod === "GET") {
    return handleGet(userId);
  }

  const parsedBody = tryParseJsonObjectBody(event.body);
  if (!parsedBody.ok) {
    return parsedBody.error;
  }

  return handlePost(userId, parsedBody.data);
}

const handler = async (event, context) => {
  if (event.httpMethod === "GET") {
    return baseHandler(event, context, {
      functionName: "athlete-profile",
      allowedMethods: ["GET"],
      rateLimitType: "READ",
      requireAuth: true,
      handler: handleRequest,
    });
  }

  return baseHandler(event, context, {
    functionName: "athlete-profile",
    allowedMethods: ["POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: handleRequest,
  });
};

export { handler };

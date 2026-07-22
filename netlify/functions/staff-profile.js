import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from "./utils/error-handler.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import { supabaseAdmin } from "./supabase-client.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.staff-profile" });

// Netlify Function: Staff Profile API
// Self-reported onboarding profiles for the 7 non-athlete team roles (TIER 1).
// GET returns the caller's own row verbatim (snake_case, as stored).
// POST upserts the caller's own row and — when license/credential data is present —
// files a pending row in credential_verifications for admin review (self-reported,
// verification-gated: credentials_verified stays false until an admin approves it).

const ROLE_PROFILE_ROUTES = {
  "physiotherapist-profile": {
    table: "physiotherapist_profiles",
    allowedRoles: ["physiotherapist"],
    fields: {
      licenseNumber: "license_number",
      licenseIssuedBy: "license_issued_by",
      educationBackground: "education_background",
      yearsOfExperience: "years_of_experience",
      insuranceProvider: "insurance_provider",
      insurancePolicyNumber: "insurance_policy_number",
      insuranceExpiryDate: "insurance_expiry_date",
      bio: "bio",
    },
    arrayFields: { specializations: "specializations" },
    credential: (body) =>
      body.licenseNumber
        ? {
            credential_type: "license",
            credential_name: "Physiotherapist License",
            issuing_body: body.licenseIssuedBy || null,
            credential_number: body.licenseNumber,
          }
        : null,
  },
  "nutritionist-profile": {
    table: "nutritionist_profiles",
    allowedRoles: ["nutritionist"],
    fields: {
      credentialType: "credential_type",
      credentialNumber: "credential_number",
      credentialIssuingBody: "credential_issuing_body",
      educationBackground: "education_background",
      yearsOfExperience: "years_of_experience",
      bio: "bio",
    },
    arrayFields: {
      specializations: "specializations",
      certifications: "certifications",
    },
    credential: (body) =>
      body.credentialNumber
        ? {
            credential_type: "credential",
            credential_name: body.credentialType || "Nutritionist Credential",
            issuing_body: body.credentialIssuingBody || null,
            credential_number: body.credentialNumber,
          }
        : null,
  },
  "psychologist-profile": {
    table: "psychologist_profiles",
    allowedRoles: ["psychologist"],
    fields: {
      licenseNumber: "license_number",
      licenseIssuedBy: "license_issued_by",
      degreeType: "degree_type",
      degreeField: "degree_field",
      educationBackground: "education_background",
      yearsOfExperience: "years_of_experience",
      bio: "bio",
    },
    arrayFields: {
      specializations: "specializations",
      certifications: "certifications",
    },
    credential: (body) =>
      body.licenseNumber
        ? {
            credential_type: "license",
            credential_name: "Psychologist License",
            issuing_body: body.licenseIssuedBy || null,
            credential_number: body.licenseNumber,
          }
        : null,
  },
  "strength-coach-profile": {
    table: "strength_coach_profiles",
    allowedRoles: ["strength_conditioning_coach"],
    fields: {
      primaryCertification: "primary_certification",
      certificationIssuedBy: "certification_issued_by",
      educationBackground: "education_background",
      yearsOfExperience: "years_of_experience",
      bio: "bio",
    },
    arrayFields: {
      specializations: "specializations",
      certifications: "certifications",
    },
    credential: (body) =>
      body.primaryCertification
        ? {
            credential_type: "certification",
            credential_name: body.primaryCertification,
            issuing_body: body.certificationIssuedBy || null,
            credential_number: null,
          }
        : null,
  },
  "coach-profile": {
    table: "coach_profiles",
    allowedRoles: [
      "coach",
      "offense_coordinator",
      "defense_coordinator",
      "assistant_coach",
    ],
    fields: {
      coachingLicenseNumber: "coaching_license_number",
      coachingLicenseIssuedBy: "coaching_license_issued_by",
      coachSpecialty: "coach_specialty",
      positionSpecialization: "position_specialization",
      yearsOfCoachingExperience: "years_of_coaching_experience",
      educationBackground: "education_background",
      coachingPhilosophy: "coaching_philosophy",
      bio: "bio",
    },
    passthroughFields: ["coaching_certifications"],
    credential: (body) =>
      body.coachingLicenseNumber
        ? {
            credential_type: "license",
            credential_name: "Coaching License",
            issuing_body: body.coachingLicenseIssuedBy || null,
            credential_number: body.coachingLicenseNumber,
          }
        : null,
  },
  "head-coach-profile": {
    table: "coach_profiles",
    allowedRoles: ["head_coach"],
    fields: {
      coachingLicenseNumber: "coaching_license_number",
      coachingLicenseIssuedBy: "coaching_license_issued_by",
      yearsOfCoachingExperience: "years_of_coaching_experience",
      yearsAsHeadCoach: "years_as_head_coach",
      educationBackground: "education_background",
      coachingBackground: "coaching_background",
      coachingPhilosophy: "coaching_philosophy",
      teamDevelopmentApproach: "team_development_approach",
      bio: "bio",
    },
    passthroughFields: ["coaching_certifications"],
    forceFields: { coach_specialty: "head_coach" },
    credential: (body) =>
      body.coachingLicenseNumber
        ? {
            credential_type: "license",
            credential_name: "Head Coach License",
            issuing_body: body.coachingLicenseIssuedBy || null,
            credential_number: body.coachingLicenseNumber,
          }
        : null,
  },
  "manager-profile": {
    table: "manager_profiles",
    allowedRoles: ["manager"],
    fields: {
      managementSpecialization: "management_specialization",
      yearsOfExperience: "years_of_experience",
      educationBackground: "education_background",
      bio: "bio",
    },
    // No credential concept for managers — manager_profiles has no
    // credentials_verified column and no license/cert data is collected.
    credential: () => null,
  },
};

function mapBodyToRow(route, body, userId) {
  const row = { user_id: userId };

  for (const [fromKey, toColumn] of Object.entries(route.fields || {})) {
    if (body[fromKey] !== undefined) {
      row[toColumn] = body[fromKey] === "" ? null : body[fromKey];
    }
  }

  for (const [fromKey, toColumn] of Object.entries(route.arrayFields || {})) {
    if (Array.isArray(body[fromKey])) {
      row[toColumn] = body[fromKey];
    }
  }

  for (const key of route.passthroughFields || []) {
    if (body[key] !== undefined) {
      row[key] = Array.isArray(body[key]) ? body[key] : body[key];
    }
  }

  if (route.forceFields) {
    Object.assign(row, route.forceFields);
  }

  return row;
}

/**
 * File a self-reported credential for admin review. Idempotent per
 * (user_id, credential_type, credential_name): skips if a row already
 * exists so re-saving the onboarding form doesn't spam duplicate entries.
 */
async function fileCredentialIfNew(userId, credential) {
  if (!credential) {
    return;
  }

  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("credential_verifications")
    .select("id")
    .eq("user_id", userId)
    .eq("credential_type", credential.credential_type)
    .eq("credential_name", credential.credential_name)
    .maybeSingle();

  if (lookupError) {
    logger.warn("credential_lookup_failed", {}, lookupError);
    return;
  }

  if (existing) {
    return;
  }

  const { error: insertError } = await supabaseAdmin
    .from("credential_verifications")
    .insert({
      user_id: userId,
      status: "pending",
      ...credential,
    });

  if (insertError) {
    logger.warn("credential_file_failed", {}, insertError);
  }
}

async function handleGet(route, userId) {
  const { data, error } = await supabaseAdmin
    .from(route.table)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return createSuccessResponse(data || null);
}

async function handlePost(route, userId, body) {
  const row = mapBodyToRow(route, body, userId);

  const { data, error } = await supabaseAdmin
    .from(route.table)
    .upsert(row, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  const credential = route.credential ? route.credential(body) : null;
  await fileCredentialIfNew(userId, credential);

  return createSuccessResponse(data);
}

async function handleRequest(routeKey, event, _context, { userId }) {
  const route = ROLE_PROFILE_ROUTES[routeKey];
  if (!route) {
    // Programmer error (bad routeKey passed to createProfileHandler), not a
    // client-facing 404 — every real caller reaches this via a dedicated
    // per-role function, so routeKey is always one of the known keys.
    throw new Error(`staff-profile: unknown routeKey "${routeKey}"`);
  }

  const role = await getUserRole(userId);
  if (!route.allowedRoles.includes(role)) {
    return createErrorResponse(
      `Access denied. Requires role: ${route.allowedRoles.join(" or ")}.`,
      403,
      ErrorType.AUTHORIZATION,
    );
  }

  if (event.httpMethod === "GET") {
    return handleGet(route, userId);
  }

  const parsedBody = tryParseJsonObjectBody(event.body);
  if (!parsedBody.ok) {
    return parsedBody.error;
  }

  return handlePost(route, userId, parsedBody.data);
}

/**
 * Netlify auto-deploys every top-level file in netlify/functions/ as its own
 * function — there's no path-based dispatch available to one shared function
 * across 7 redirect targets (a non-wildcard `[[redirects]]` entry doesn't
 * carry the original path through to `event.path`). So each role gets its
 * own tiny function file (matching this repo's existing staff-nutritionist.js
 * / staff-physiotherapist.js / staff-psychology.js convention) that calls
 * this factory with its fixed route key.
 */
function createProfileHandler(routeKey) {
  return async (event, context) => {
    if (event.httpMethod === "GET") {
      return baseHandler(event, context, {
        functionName: `staff-profile-${routeKey}`,
        allowedMethods: ["GET"],
        rateLimitType: "READ",
        requireAuth: true,
        handler: (evt, ctx, auth) => handleRequest(routeKey, evt, ctx, auth),
      });
    }

    return baseHandler(event, context, {
      functionName: `staff-profile-${routeKey}`,
      allowedMethods: ["POST"],
      rateLimitType: "UPDATE",
      requireAuth: true,
      handler: (evt, ctx, auth) => handleRequest(routeKey, evt, ctx, auth),
    });
  };
}

export { createProfileHandler, ROLE_PROFILE_ROUTES };

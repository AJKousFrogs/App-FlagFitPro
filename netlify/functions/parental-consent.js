import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import crypto from "node:crypto";
import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { supabaseAdmin } from "./utils/supabase-client.js";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidVerificationToken(token) {
  return typeof token === "string" && /^[a-f0-9]{64}$/i.test(token);
}

function calculateAge(dateOfBirth) {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (
    monthDelta < 0 ||
    (monthDelta === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

function getRestrictedFeatures(consent) {
  if (!consent || consent.consent_status !== "verified") {
    return {
      healthData: { restricted: true, reason: "Requires parental consent" },
      biometrics: { restricted: true, reason: "Requires parental consent" },
      location: { restricted: true, reason: "Requires parental consent" },
      research: { restricted: true, reason: "Requires parental consent" },
    };
  }

  return {
    healthData: {
      restricted: !consent.health_data_consent,
      reason: consent.health_data_consent
        ? null
        : "Guardian did not approve health data collection",
    },
    biometrics: {
      restricted: !consent.biometrics_consent,
      reason: consent.biometrics_consent
        ? null
        : "Guardian did not approve biometrics collection",
    },
    location: {
      restricted: !consent.location_consent,
      reason: consent.location_consent
        ? null
        : "Guardian did not approve location tracking",
    },
    research: {
      restricted: !consent.research_consent,
      reason: consent.research_consent
        ? null
        : "Guardian did not approve research participation",
    },
  };
}

function parseJsonBody(body) {
  try {
    const parsed = JSON.parse(body || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, data: null, reason: "Request body must be an object" };
    }
    return { ok: true, data: parsed };
  } catch {
    return { ok: false, data: null, reason: "Invalid JSON body" };
  }
}

async function handleAuthenticatedRequest(event, _context, { userId, supabase }) {
  if (event.httpMethod === "GET") {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("date_of_birth")
      .eq("id", userId)
      .single();

    if (userError || !user?.date_of_birth) {
      return createSuccessResponse({
        isMinor: false,
        requiresConsent: false,
        consent: null,
        message: "User age not determined or date of birth not set",
      });
    }

    const age = calculateAge(user.date_of_birth);
    if (age < 13 || age >= 18) {
      return createSuccessResponse({
        isMinor: age < 18,
        requiresConsent: false,
        consent: null,
        message:
          age < 13
            ? "Users under 13 are not permitted"
            : "Adult user, no parental consent required",
      });
    }

    const { data: consent } = await supabase
      .from("parental_consent")
      .select("*")
      .eq("minor_user_id", userId)
      .in("consent_status", ["pending", "verified"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return createSuccessResponse({
      isMinor: true,
      requiresConsent: true,
      age,
      consent: consent
        ? {
            id: consent.id,
            status: consent.consent_status,
            guardianEmail: consent.guardian_email,
            guardianName: consent.guardian_name,
            healthDataConsent: consent.health_data_consent,
            biometricsConsent: consent.biometrics_consent,
            locationConsent: consent.location_consent,
            researchConsent: consent.research_consent,
            verifiedAt: consent.verified_at,
            expiresAt: consent.expires_at,
            createdAt: consent.created_at,
          }
        : null,
      restrictedFeatures: getRestrictedFeatures(consent),
    });
  }

  if (event.httpMethod === "POST") {
    const parsed = parseJsonBody(event.body);
    if (!parsed.ok) {
      return createErrorResponse(
        parsed.reason || "Invalid JSON body",
        parsed.reason === "Invalid JSON body" ? 400 : 422,
        parsed.reason === "Invalid JSON body" ? "invalid_json" : "validation_error",
      );
    }

    const { guardianEmail, guardianName, relationship } = parsed.data;

    if (!guardianEmail || !isValidEmail(guardianEmail)) {
      return createErrorResponse(
        "Valid guardian email is required",
        400,
        "validation_error",
      );
    }
    if (
      guardianName !== undefined &&
      (typeof guardianName !== "string" || guardianName.trim().length === 0)
    ) {
      return createErrorResponse(
        "guardianName must be a non-empty string when provided",
        422,
        "validation_error",
      );
    }
    if (
      relationship !== undefined &&
      (typeof relationship !== "string" ||
        relationship.trim().length === 0 ||
        relationship.trim().length > 50)
    ) {
      return createErrorResponse(
        "relationship must be a non-empty string up to 50 characters",
        422,
        "validation_error",
      );
    }

    const { data: user } = await supabase
      .from("users")
      .select("date_of_birth, first_name, last_name")
      .eq("id", userId)
      .single();

    if (!user?.date_of_birth) {
      return createErrorResponse(
        "Date of birth must be set before requesting parental consent",
        400,
        "missing_dob",
      );
    }

    const age = calculateAge(user.date_of_birth);
    if (age < 13) {
      return createErrorResponse(
        "Users under 13 are not permitted to use this service",
        403,
        "age_restricted",
      );
    }

    if (age >= 18) {
      return createErrorResponse(
        "Parental consent is not required for users 18 and older",
        400,
        "not_minor",
      );
    }

    const { data: existingRequest } = await supabaseAdmin
      .from("parental_consent")
      .select("id")
      .eq("minor_user_id", userId)
      .eq("consent_status", "pending")
      .maybeSingle();

    if (existingRequest) {
      return createErrorResponse(
        "A consent request is already pending. Please wait for guardian response or request a new one.",
        409,
        "request_pending",
      );
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const birthDate = new Date(user.date_of_birth);
    const expiresAt = new Date(birthDate);
    expiresAt.setFullYear(expiresAt.getFullYear() + 18);

    const { data: consent, error: insertError } = await supabaseAdmin
      .from("parental_consent")
      .insert({
        minor_user_id: userId,
        guardian_email: guardianEmail,
        guardian_name: guardianName || null,
        guardian_relationship: relationship || "parent",
        verification_token: verificationToken,
        verification_sent_at: new Date().toISOString(),
        consent_status: "pending",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return createErrorResponse("Failed to create consent request", 500, "database_error");
    }

    const minorName =
      [user.first_name, user.last_name].filter(Boolean).join(" ") ||
      "A minor user";

    try {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseAnonKey =
        process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey) {
        await fetch(`${supabaseUrl}/functions/v1/send-guardian-email`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            guardianEmail,
            guardianName: guardianName || null,
            minorName,
            verificationToken,
            consentId: consent.id,
          }),
        });
      }
    } catch (emailError) {
      console.error("Failed to send guardian email:", emailError);
    }

    await supabaseAdmin.from("privacy_audit_log").insert({
      user_id: userId,
      action: "parental_consent_requested",
      affected_table: "parental_consent",
      affected_data: {
        consent_id: consent.id,
        guardian_email: guardianEmail,
      },
    });

    return createSuccessResponse({
      success: true,
      consentId: consent.id,
      message:
        "Consent request sent to guardian. They will receive an email with verification instructions.",
      guardianEmail,
    });
  }

  return createErrorResponse("Method not allowed", 405, "method_not_allowed");
}

async function handlePublicVerification(event) {
  const parsed = parseJsonBody(event.body);
  if (!parsed.ok) {
    return createErrorResponse(
      parsed.reason || "Invalid JSON body",
      parsed.reason === "Invalid JSON body" ? 400 : 422,
      parsed.reason === "Invalid JSON body" ? "invalid_json" : "validation_error",
    );
  }

  const {
    token,
    action,
    healthDataConsent,
    biometricsConsent,
    locationConsent,
    researchConsent,
    reason,
  } = parsed.data;

  if (!token) {
    return createErrorResponse("Verification token is required", 400, "missing_token");
  }
  if (!isValidVerificationToken(token)) {
    return createErrorResponse("Invalid verification token format", 400, "invalid_token");
  }
  if (action && !["approve", "revoke"].includes(action)) {
    return createErrorResponse(
      "Invalid action. Allowed values: approve, revoke",
      422,
      "validation_error",
    );
  }
  const consentFlagPairs = [
    ["healthDataConsent", healthDataConsent],
    ["biometricsConsent", biometricsConsent],
    ["locationConsent", locationConsent],
    ["researchConsent", researchConsent],
  ];
  for (const [fieldName, fieldValue] of consentFlagPairs) {
    if (fieldValue !== undefined && typeof fieldValue !== "boolean") {
      return createErrorResponse(
        `${fieldName} must be a boolean when provided`,
        422,
        "validation_error",
      );
    }
  }
  if (
    reason !== undefined &&
    (typeof reason !== "string" || reason.trim().length === 0 || reason.length > 1000)
  ) {
    return createErrorResponse(
      "reason must be a non-empty string up to 1000 characters when provided",
      422,
      "validation_error",
    );
  }

  const normalizedAction = action === "revoke" ? "revoke" : "approve";

  const { data: consent, error: findError } = await supabaseAdmin
    .from("parental_consent")
    .select("*")
    .eq("verification_token", token)
    .single();

  if (findError || !consent) {
    return createErrorResponse("Invalid or expired verification token", 404, "invalid_token");
  }

  if (consent.verification_sent_at) {
    const tokenExpiry = new Date(consent.verification_sent_at);
    tokenExpiry.setDate(tokenExpiry.getDate() + 7);
    if (new Date() > tokenExpiry) {
      return createErrorResponse("Verification token has expired", 410, "token_expired");
    }
  }

  if (consent.consent_status === "revoked") {
    return createErrorResponse("This consent has been revoked", 400, "consent_revoked");
  }

  const clientIp =
    event.headers["x-forwarded-for"]?.split(",")[0] ||
    event.headers["client-ip"] ||
    "unknown";

  if (normalizedAction === "revoke") {
    const { data: revokedConsent, error: revokeError } = await supabaseAdmin
      .from("parental_consent")
      .update({
        consent_status: "revoked",
        revoked_at: new Date().toISOString(),
        revocation_reason: reason || "Guardian revoked consent",
        verification_token: null,
      })
      .eq("id", consent.id)
      .eq("verification_token", token)
      .select("id")
      .maybeSingle();

    if (revokeError || !revokedConsent) {
      return createErrorResponse(
        revokeError?.message || "Invalid or already-used verification token",
        409,
        "invalid_token_state",
      );
    }

    await supabaseAdmin.from("privacy_audit_log").insert({
      user_id: consent.minor_user_id,
      action: "parental_consent_revoked",
      affected_table: "parental_consent",
      affected_data: { consent_id: consent.id },
      ip_address: clientIp,
    });

    return createSuccessResponse({
      success: true,
      message: "Parental consent has been revoked. Restricted features will be disabled.",
    });
  }

  const { data: verifiedConsent, error: updateError } = await supabaseAdmin
    .from("parental_consent")
    .update({
      consent_status: "verified",
      verified_at: new Date().toISOString(),
      verification_method: "email",
      verification_ip_address: clientIp,
      health_data_consent: healthDataConsent ?? false,
      biometrics_consent: biometricsConsent ?? false,
      location_consent: locationConsent ?? false,
      research_consent: researchConsent ?? false,
      verification_token: null,
    })
    .eq("id", consent.id)
    .eq("verification_token", token)
    .select("id")
    .maybeSingle();

  if (updateError || !verifiedConsent) {
    return createErrorResponse(
      updateError?.message || "Invalid or already-used verification token",
      409,
      "invalid_token_state",
    );
  }

  await supabaseAdmin.from("privacy_audit_log").insert({
    user_id: consent.minor_user_id,
    action: "parental_consent_verified",
    affected_table: "parental_consent",
    affected_data: {
      consent_id: consent.id,
      health_data_consent: healthDataConsent ?? false,
      biometrics_consent: biometricsConsent ?? false,
      location_consent: locationConsent ?? false,
      research_consent: researchConsent ?? false,
    },
    ip_address: clientIp,
  });

  return createSuccessResponse({
    success: true,
    message:
      "Parental consent verified successfully. The minor can now access approved features.",
    approvedFeatures: {
      healthData: healthDataConsent ?? false,
      biometrics: biometricsConsent ?? false,
      location: locationConsent ?? false,
      research: researchConsent ?? false,
    },
  });
}

const handler = async (event, context) => {
  if (event.httpMethod === "PUT") {
    return baseHandler(event, context, {
      functionName: "parental-consent",
      allowedMethods: ["GET", "POST", "PUT"],
      rateLimitType: "CREATE",
      requireAuth: false,
      handler: handlePublicVerification,
    });
  }

  return baseHandler(event, context, {
    functionName: "parental-consent",
    allowedMethods: ["GET", "POST", "PUT"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: handleAuthenticatedRequest,
  });
};

export const testHandler = handler;
export default createRuntimeV2Handler(handler);

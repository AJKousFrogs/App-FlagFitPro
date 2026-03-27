import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { getSupabaseClient } from "./supabase-client.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

/**
 * Privacy Settings API
 *
 * Manages user privacy preferences as defined in PRIVACY_POLICY.md:
 * - GET: Retrieve current privacy settings
 * - PUT: Update privacy settings
 *
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

const EMERGENCY_SHARING_LEVELS = new Set([
  "none",
  "medical_only",
  "medical_and_location",
  "full",
]);

const ALLOWED_METRIC_CATEGORIES = new Set([
  "performance",
  "training_load",
  "readiness",
  "wellness",
  "injury_history",
  "body_composition",
]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isBoolean(value) {
  return typeof value === "boolean";
}

function isValidId(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 128 &&
    /^[A-Za-z0-9_-]+$/.test(value.trim())
  );
}

function validateEmergencyContacts(contacts) {
  if (!Array.isArray(contacts)) {
    return "emergencyContacts must be an array";
  }
  for (const contact of contacts) {
    if (!isPlainObject(contact)) {
      return "each emergency contact must be an object";
    }
    if (
      typeof contact.name !== "string" ||
      !contact.name.trim() ||
      contact.name.length > 120
    ) {
      return "emergency contact name must be a non-empty string up to 120 characters";
    }
    if (
      typeof contact.phone !== "string" ||
      !contact.phone.trim() ||
      contact.phone.length > 40
    ) {
      return "emergency contact phone must be a non-empty string up to 40 characters";
    }
    if (
      contact.email !== undefined &&
      (typeof contact.email !== "string" || contact.email.length > 254)
    ) {
      return "emergency contact email must be a string up to 254 characters";
    }
    if (
      typeof contact.relationship !== "string" ||
      !contact.relationship.trim() ||
      contact.relationship.length > 80
    ) {
      return "emergency contact relationship must be a non-empty string up to 80 characters";
    }
  }
  return null;
}

function validateSettingsPayload(settings) {
  if (!isPlainObject(settings)) {
    return "settings must be an object";
  }

  if (
    settings.aiProcessingEnabled !== undefined &&
    !isBoolean(settings.aiProcessingEnabled)
  ) {
    return "aiProcessingEnabled must be a boolean";
  }
  if (settings.researchOptIn !== undefined && !isBoolean(settings.researchOptIn)) {
    return "researchOptIn must be a boolean";
  }
  if (
    settings.marketingOptIn !== undefined &&
    !isBoolean(settings.marketingOptIn)
  ) {
    return "marketingOptIn must be a boolean";
  }
  if (
    settings.performanceSharingDefault !== undefined &&
    !isBoolean(settings.performanceSharingDefault)
  ) {
    return "performanceSharingDefault must be a boolean";
  }
  if (
    settings.healthSharingDefault !== undefined &&
    !isBoolean(settings.healthSharingDefault)
  ) {
    return "healthSharingDefault must be a boolean";
  }
  if (settings.emergencySharingLevel !== undefined) {
    if (
      typeof settings.emergencySharingLevel !== "string" ||
      !EMERGENCY_SHARING_LEVELS.has(settings.emergencySharingLevel)
    ) {
      return "emergencySharingLevel is invalid";
    }
  }
  if (settings.emergencyContacts !== undefined) {
    const error = validateEmergencyContacts(settings.emergencyContacts);
    if (error) {
      return error;
    }
  }
  return null;
}

function validateTeamSettingsPayload(teamSettings) {
  if (!isPlainObject(teamSettings)) {
    return "teamSettings must be an object";
  }

  if (
    teamSettings.performanceSharingEnabled !== undefined &&
    !isBoolean(teamSettings.performanceSharingEnabled)
  ) {
    return "performanceSharingEnabled must be a boolean";
  }
  if (
    teamSettings.healthSharingEnabled !== undefined &&
    !isBoolean(teamSettings.healthSharingEnabled)
  ) {
    return "healthSharingEnabled must be a boolean";
  }
  if (teamSettings.allowedMetricCategories !== undefined) {
    if (!Array.isArray(teamSettings.allowedMetricCategories)) {
      return "allowedMetricCategories must be an array";
    }
    const invalid = teamSettings.allowedMetricCategories.find(
      (category) =>
        typeof category !== "string" || !ALLOWED_METRIC_CATEGORIES.has(category),
    );
    if (invalid) {
      return "allowedMetricCategories contains invalid category";
    }
  }
  return null;
}

const handler = async (event, context) => {
  const rateLimitType = event.httpMethod === "GET" ? "READ" : "UPDATE";
  return baseHandler(event, context, {
    functionName: "privacy-settings",
    allowedMethods: ["GET", "PUT"],
    rateLimitType,
    requireAuth: true, // P0-005: Explicitly require authentication for privacy settings
    handler: async (event, context, { userId, requestId }) => {
      const supabase = getSupabaseClient();

      // GET - Retrieve privacy settings
      if (event.httpMethod === "GET") {
        // Get or create privacy settings
        let { data: settings, error } = await supabase
          .from("privacy_settings")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error && error.code === "PGRST116") {
          // No settings found, create default
          const { data: newSettings, error: insertError } = await supabase
            .from("privacy_settings")
            .insert({ user_id: userId })
            .select()
            .single();

          if (insertError) {
            return createErrorResponse(
              "Failed to create default privacy settings",
              500,
              "database_error",
              requestId,
            );
          }
          settings = newSettings;
        } else if (error) {
          return createErrorResponse(
            "Failed to retrieve privacy settings",
            500,
            "database_error",
            requestId,
          );
        }

        // Also get team sharing settings
        const { data: teamSettings } = await supabase
          .from("team_sharing_settings")
          .select(
            `
            id,
            team_id,
            performance_sharing_enabled,
            health_sharing_enabled,
            allowed_metric_categories,
            updated_at,
            teams (id, name)
          `,
          )
          .eq("user_id", userId);

        // Check parental consent status if applicable
        let parentalConsent = null;
        const { data: user } = await supabase
          .from("users")
          .select("date_of_birth")
          .eq("id", userId)
          .single();

        if (user?.date_of_birth) {
          const birthDate = new Date(user.date_of_birth);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();

          if (age >= 13 && age < 18) {
            const { data: consent } = await supabase
              .from("parental_consent")
              .select("*")
              .eq("minor_user_id", userId)
              .in("consent_status", ["pending", "verified"])
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            parentalConsent = consent;
          }
        }

        return createSuccessResponse({
          settings: mapDbToSettings(settings),
          teamSettings: (teamSettings || []).map(mapDbToTeamSettings),
          parentalConsent: parentalConsent
            ? mapDbToParentalConsent(parentalConsent)
            : null,
        });
      }

      // PUT - Update privacy settings
      if (event.httpMethod === "PUT") {
        let body;
        try {
          body = parseJsonObjectBody(event.body);
        } catch (error) {
          if (error?.message === "Request body must be an object") {
            return createErrorResponse(
              "Request body must be an object",
              422,
              "validation_error",
            );
          }
          return createErrorResponse("Invalid JSON body", 400, "invalid_json");
        }

        const { settings: newSettings, teamId, teamSettings } = body;
        if (newSettings === undefined && (teamId === undefined || teamSettings === undefined)) {
          return createErrorResponse(
            "Provide settings and/or teamId with teamSettings",
            422,
            "validation_error",
          );
        }

        // Update main privacy settings
        if (newSettings) {
          const settingsValidationError = validateSettingsPayload(newSettings);
          if (settingsValidationError) {
            return createErrorResponse(
              settingsValidationError,
              422,
              "validation_error",
            );
          }

          const updateData = {};

          if (newSettings.aiProcessingEnabled !== undefined) {
            updateData.ai_processing_enabled = newSettings.aiProcessingEnabled;
            updateData.ai_processing_consent_date =
              newSettings.aiProcessingEnabled ? new Date().toISOString() : null;
          }

          if (newSettings.researchOptIn !== undefined) {
            updateData.research_opt_in = newSettings.researchOptIn;
            updateData.research_consent_date = newSettings.researchOptIn
              ? new Date().toISOString()
              : null;
          }

          if (newSettings.emergencySharingLevel !== undefined) {
            updateData.emergency_sharing_level =
              newSettings.emergencySharingLevel;
          }

          if (newSettings.emergencyContacts !== undefined) {
            updateData.emergency_contacts = newSettings.emergencyContacts;
          }

          if (newSettings.marketingOptIn !== undefined) {
            updateData.marketing_opt_in = newSettings.marketingOptIn;
            updateData.marketing_consent_date = newSettings.marketingOptIn
              ? new Date().toISOString()
              : null;
          }

          if (newSettings.performanceSharingDefault !== undefined) {
            updateData.performance_sharing_default =
              newSettings.performanceSharingDefault;
          }

          if (newSettings.healthSharingDefault !== undefined) {
            updateData.health_sharing_default =
              newSettings.healthSharingDefault;
          }

          if (Object.keys(updateData).length > 0) {
            const { error } = await supabase
              .from("privacy_settings")
              .upsert(
                {
                  user_id: userId,
                  ...updateData,
                },
                { onConflict: "user_id" },
              );

            if (error) {
              return createErrorResponse(
                "Failed to update privacy settings",
                500,
                "database_error",
                requestId,
              );
            }
          }
        }

        // Update team-specific settings
        if (teamId && teamSettings) {
          if (!isValidId(teamId)) {
            return createErrorResponse("teamId is invalid", 422, "validation_error");
          }

          const teamSettingsValidationError =
            validateTeamSettingsPayload(teamSettings);
          if (teamSettingsValidationError) {
            return createErrorResponse(
              teamSettingsValidationError,
              422,
              "validation_error",
            );
          }

          const { data: membership, error: membershipError } = await supabase
            .from("team_members")
            .select("team_id")
            .eq("user_id", userId)
            .eq("team_id", teamId)
            .limit(1)
            .maybeSingle();

          if (membershipError) {
            return createErrorResponse(
              "Failed to verify team membership",
              500,
              "database_error",
            );
          }
          if (!membership) {
            return createErrorResponse(
              "Not authorized to update team sharing settings for this team",
              403,
              "authorization_error",
            );
          }

          const teamUpdateData = {
            user_id: userId,
            team_id: teamId,
          };

          if (teamSettings.performanceSharingEnabled !== undefined) {
            teamUpdateData.performance_sharing_enabled =
              teamSettings.performanceSharingEnabled;
          }

          if (teamSettings.healthSharingEnabled !== undefined) {
            teamUpdateData.health_sharing_enabled =
              teamSettings.healthSharingEnabled;
          }

          if (teamSettings.allowedMetricCategories !== undefined) {
            teamUpdateData.allowed_metric_categories =
              teamSettings.allowedMetricCategories;
          }

          if (Object.keys(teamUpdateData).length === 2) {
            return createErrorResponse(
              "No valid teamSettings fields provided",
              422,
              "validation_error",
            );
          }

          const { error } = await supabase
            .from("team_sharing_settings")
            .upsert(teamUpdateData, {
              onConflict: "user_id,team_id",
            });

          if (error) {
            return createErrorResponse(
              "Failed to update team sharing settings",
              500,
              "database_error",
              requestId,
            );
          }
        }

        // Log the privacy change
        const { error: auditError } = await supabase.from("privacy_audit_log").insert({
          user_id: userId,
          action: "settings_updated",
          affected_table: teamId ? "team_sharing_settings" : "privacy_settings",
          affected_data: body,
        });
        if (auditError) {
          console.warn("[privacy-settings] Failed to insert audit log:", auditError.message);
        }

        return createSuccessResponse({
          success: true,
          message: "Privacy settings updated",
        });
      }
    },
  });
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapDbToSettings(db) {
  return {
    userId: db.user_id,
    aiProcessingEnabled: db.ai_processing_enabled,
    aiProcessingConsentDate: db.ai_processing_consent_date,
    researchOptIn: db.research_opt_in,
    researchConsentDate: db.research_consent_date,
    emergencySharingLevel: db.emergency_sharing_level,
    emergencyContacts: db.emergency_contacts || [],
    marketingOptIn: db.marketing_opt_in,
    marketingConsentDate: db.marketing_consent_date,
    performanceSharingDefault: db.performance_sharing_default,
    healthSharingDefault: db.health_sharing_default,
    consentVersion: db.consent_version,
    updatedAt: db.updated_at,
  };
}

function mapDbToTeamSettings(db) {
  return {
    id: db.id,
    teamId: db.team_id,
    teamName: db.teams?.name || "Unknown Team",
    performanceSharingEnabled: db.performance_sharing_enabled,
    healthSharingEnabled: db.health_sharing_enabled,
    allowedMetricCategories: db.allowed_metric_categories || [],
    updatedAt: db.updated_at,
  };
}

function mapDbToParentalConsent(db) {
  return {
    id: db.id,
    status: db.consent_status,
    guardianEmail: db.guardian_email,
    guardianName: db.guardian_name,
    healthDataConsent: db.health_data_consent,
    biometricsConsent: db.biometrics_consent,
    locationConsent: db.location_consent,
    researchConsent: db.research_consent,
    verifiedAt: db.verified_at,
    expiresAt: db.expires_at,
  };
}

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);

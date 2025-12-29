/**
 * Privacy Settings API
 * 
 * Manages user privacy preferences as defined in PRIVACY_POLICY.md:
 * - GET: Retrieve current privacy settings
 * - PUT: Update privacy settings
 * 
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

const { baseHandler } = require("./utils/base-handler.cjs");
const { createSuccessResponse, createErrorResponse } = require("./utils/error-handler.cjs");
const { getSupabaseClient } = require("./supabase-client.cjs");

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "privacy-settings",
    allowedMethods: ["GET", "PUT"],
    rateLimitType: "READ",
    handler: async (event, context, { userId }) => {
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
            return createErrorResponse(insertError.message, 500, "database_error");
          }
          settings = newSettings;
        } else if (error) {
          return createErrorResponse(error.message, 500, "database_error");
        }

        // Also get team sharing settings
        const { data: teamSettings } = await supabase
          .from("team_sharing_settings")
          .select(`
            id,
            team_id,
            performance_sharing_enabled,
            health_sharing_enabled,
            allowed_metric_categories,
            updated_at,
            teams (id, name)
          `)
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
          parentalConsent: parentalConsent ? mapDbToParentalConsent(parentalConsent) : null,
        });
      }

      // PUT - Update privacy settings
      if (event.httpMethod === "PUT") {
        let body;
        try {
          body = JSON.parse(event.body || "{}");
        } catch {
          return createErrorResponse("Invalid JSON body", 400, "invalid_body");
        }

        const { settings: newSettings, teamId, teamSettings } = body;

        // Update main privacy settings
        if (newSettings) {
          const updateData = {};
          
          if (newSettings.aiProcessingEnabled !== undefined) {
            updateData.ai_processing_enabled = newSettings.aiProcessingEnabled;
            updateData.ai_processing_consent_date = newSettings.aiProcessingEnabled 
              ? new Date().toISOString() 
              : null;
          }
          
          if (newSettings.researchOptIn !== undefined) {
            updateData.research_opt_in = newSettings.researchOptIn;
            updateData.research_consent_date = newSettings.researchOptIn 
              ? new Date().toISOString() 
              : null;
          }
          
          if (newSettings.emergencySharingLevel !== undefined) {
            updateData.emergency_sharing_level = newSettings.emergencySharingLevel;
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
            updateData.performance_sharing_default = newSettings.performanceSharingDefault;
          }
          
          if (newSettings.healthSharingDefault !== undefined) {
            updateData.health_sharing_default = newSettings.healthSharingDefault;
          }

          if (Object.keys(updateData).length > 0) {
            const { error } = await supabase
              .from("privacy_settings")
              .update(updateData)
              .eq("user_id", userId);

            if (error) {
              return createErrorResponse(error.message, 500, "database_error");
            }
          }
        }

        // Update team-specific settings
        if (teamId && teamSettings) {
          const teamUpdateData = {
            user_id: userId,
            team_id: teamId,
          };

          if (teamSettings.performanceSharingEnabled !== undefined) {
            teamUpdateData.performance_sharing_enabled = teamSettings.performanceSharingEnabled;
          }
          
          if (teamSettings.healthSharingEnabled !== undefined) {
            teamUpdateData.health_sharing_enabled = teamSettings.healthSharingEnabled;
          }
          
          if (teamSettings.allowedMetricCategories !== undefined) {
            teamUpdateData.allowed_metric_categories = teamSettings.allowedMetricCategories;
          }

          const { error } = await supabase
            .from("team_sharing_settings")
            .upsert(teamUpdateData, {
              onConflict: "user_id,team_id",
            });

          if (error) {
            return createErrorResponse(error.message, 500, "database_error");
          }
        }

        // Log the privacy change
        await supabase
          .from("privacy_audit_log")
          .insert({
            user_id: userId,
            action: "settings_updated",
            affected_table: teamId ? "team_sharing_settings" : "privacy_settings",
            affected_data: body,
          });

        return createSuccessResponse({ success: true, message: "Privacy settings updated" });
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


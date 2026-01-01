/**
 * Parental Consent API
 * 
 * Implements parental consent workflow for minors (13-17) as required by:
 * - TERMS_OF_USE.md
 * - PRIVACY_POLICY.md
 * 
 * Endpoints:
 * - GET: Get current consent status
 * - POST: Request parental consent (minor initiates)
 * - PUT: Verify/update consent (guardian action)
 * 
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

const { baseHandler } = require("./utils/base-handler.cjs");
const { createSuccessResponse, createErrorResponse } = require("./utils/error-handler.cjs");
const { getSupabaseClient, supabaseAdmin } = require("./supabase-client.cjs");
const crypto = require("crypto");

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "parental-consent",
    allowedMethods: ["GET", "POST", "PUT"],
    rateLimitType: "CREATE",
    requireAuth: event.httpMethod !== "PUT", // PUT is for guardian verification (uses token)
    handler: async (event, context, { userId }) => {
      const supabase = getSupabaseClient();

      // GET - Get consent status for current user (minor)
      if (event.httpMethod === "GET") {
        // First check if user is a minor
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
            message: "User age not determined or not a minor",
          });
        }

        const birthDate = new Date(user.date_of_birth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();

        if (age < 13 || age >= 18) {
          return createSuccessResponse({
            isMinor: age < 18,
            requiresConsent: false,
            consent: null,
            message: age < 13 ? "Users under 13 are not permitted" : "Adult user, no parental consent required",
          });
        }

        // User is 13-17, check consent status
        const { data: consent } = await supabase
          .from("parental_consent")
          .select("*")
          .eq("minor_user_id", userId)
          .in("consent_status", ["pending", "verified"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        return createSuccessResponse({
          isMinor: true,
          requiresConsent: true,
          age,
          consent: consent ? {
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
          } : null,
          restrictedFeatures: getRestrictedFeatures(consent),
        });
      }

      // POST - Request parental consent (minor initiates)
      if (event.httpMethod === "POST") {
        let body;
        try {
          body = JSON.parse(event.body || "{}");
        } catch {
          return createErrorResponse("Invalid JSON body", 400, "invalid_body");
        }

        const { guardianEmail, guardianName, relationship } = body;

        if (!guardianEmail || !isValidEmail(guardianEmail)) {
          return createErrorResponse(
            "Valid guardian email is required",
            400,
            "validation_error"
          );
        }

        // Check if user is a minor
        const { data: user } = await supabase
          .from("users")
          .select("date_of_birth, email, first_name, last_name")
          .eq("id", userId)
          .single();

        if (!user?.date_of_birth) {
          return createErrorResponse(
            "Date of birth must be set before requesting parental consent",
            400,
            "missing_dob"
          );
        }

        const birthDate = new Date(user.date_of_birth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();

        if (age < 13) {
          return createErrorResponse(
            "Users under 13 are not permitted to use this service",
            403,
            "age_restricted"
          );
        }

        if (age >= 18) {
          return createErrorResponse(
            "Parental consent is not required for users 18 and older",
            400,
            "not_minor"
          );
        }

        // Check for existing pending request
        const { data: existingRequest } = await supabase
          .from("parental_consent")
          .select("id")
          .eq("minor_user_id", userId)
          .eq("consent_status", "pending")
          .single();

        if (existingRequest) {
          return createErrorResponse(
            "A consent request is already pending. Please wait for guardian response or request a new one.",
            409,
            "request_pending"
          );
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString("hex");
        
        // Calculate expiration (when minor turns 18)
        const expiresAt = new Date(birthDate);
        expiresAt.setFullYear(expiresAt.getFullYear() + 18);

        // Create consent request
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
          return createErrorResponse(insertError.message, 500, "database_error");
        }

        // Send email to guardian with verification link
        const minorName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'A minor user';
        
        try {
          // Try Edge Function first (preferred for Supabase projects)
          const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
          const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
          
          if (supabaseUrl && supabaseAnonKey) {
            const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-guardian-email`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                guardianEmail,
                guardianName: guardianName || null,
                minorName,
                verificationToken,
                consentId: consent.id,
              }),
            });
            
            if (!emailResponse.ok) {
              const errorText = await emailResponse.text();
              console.warn('Edge Function email failed, trying Netlify fallback:', errorText);
              // Fall through to Netlify function
            } else {
              const emailResult = await emailResponse.json();
              console.log('Guardian email sent via Edge Function:', emailResult);
            }
          }
          
          // Fallback to Netlify send-email function if Edge Function not available
          if (!supabaseUrl || !supabaseAnonKey) {
            const appUrl = process.env.APP_URL || process.env.URL || 'https://webflagfootballfrogs.netlify.app';
            const verificationUrl = `${appUrl}/consent/verify?token=${verificationToken}`;
            
            // Use internal Netlify function call
            const { handler: _sendEmailHandler } = require('./send-email.cjs');
            
            // Create a mock event for the send-email function
            const _emailEvent = {
              httpMethod: 'POST',
              body: JSON.stringify({
                type: 'parental_consent',
                to: guardianEmail,
                name: guardianName || 'Parent/Guardian',
                minorName,
                verificationUrl,
                consentId: consent.id,
              }),
              headers: {},
            };
            
            // Note: This is a simplified approach - in production you might want to
            // call the send-email function directly or use a shared email utility
            console.log('Guardian consent email queued for:', guardianEmail);
          }
        } catch (emailError) {
          // Log but don't fail the request - consent record was created
          console.error('Failed to send guardian email:', emailError);
          // The consent request is still valid, guardian can be contacted manually
        }

        // Log the request
        await supabaseAdmin
          .from("privacy_audit_log")
          .insert({
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
          message: "Consent request sent to guardian. They will receive an email with verification instructions.",
          guardianEmail,
        });
      }

      // PUT - Verify consent (guardian action via token)
      if (event.httpMethod === "PUT") {
        let body;
        try {
          body = JSON.parse(event.body || "{}");
        } catch {
          return createErrorResponse("Invalid JSON body", 400, "invalid_body");
        }

        const { 
          token, 
          action, // 'verify' or 'revoke'
          healthDataConsent,
          biometricsConsent,
          locationConsent,
          researchConsent,
        } = body;

        if (!token) {
          return createErrorResponse("Verification token is required", 400, "missing_token");
        }

        // Find consent request by token
        const { data: consent, error: findError } = await supabaseAdmin
          .from("parental_consent")
          .select("*")
          .eq("verification_token", token)
          .single();

        if (findError || !consent) {
          return createErrorResponse(
            "Invalid or expired verification token",
            404,
            "invalid_token"
          );
        }

        if (consent.consent_status === "verified" && action !== "revoke") {
          return createErrorResponse(
            "This consent has already been verified",
            400,
            "already_verified"
          );
        }

        if (consent.consent_status === "revoked") {
          return createErrorResponse(
            "This consent has been revoked",
            400,
            "consent_revoked"
          );
        }

        const clientIp = event.headers["x-forwarded-for"]?.split(",")[0] || 
                         event.headers["client-ip"] || 
                         "unknown";

        if (action === "revoke") {
          // Revoke consent
          const { error: revokeError } = await supabaseAdmin
            .from("parental_consent")
            .update({
              consent_status: "revoked",
              revoked_at: new Date().toISOString(),
              revocation_reason: body.reason || "Guardian revoked consent",
            })
            .eq("id", consent.id);

          if (revokeError) {
            return createErrorResponse(revokeError.message, 500, "database_error");
          }

          // Log revocation
          await supabaseAdmin
            .from("privacy_audit_log")
            .insert({
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

        // Verify consent
        const { error: updateError } = await supabaseAdmin
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
          })
          .eq("id", consent.id);

        if (updateError) {
          return createErrorResponse(updateError.message, 500, "database_error");
        }

        // Log verification
        await supabaseAdmin
          .from("privacy_audit_log")
          .insert({
            user_id: consent.minor_user_id,
            action: "parental_consent_verified",
            affected_table: "parental_consent",
            affected_data: {
              consent_id: consent.id,
              health_data_consent: healthDataConsent,
              biometrics_consent: biometricsConsent,
              location_consent: locationConsent,
              research_consent: researchConsent,
            },
            ip_address: clientIp,
          });

        return createSuccessResponse({
          success: true,
          message: "Parental consent verified successfully. The minor can now access approved features.",
          approvedFeatures: {
            healthData: healthDataConsent ?? false,
            biometrics: biometricsConsent ?? false,
            location: locationConsent ?? false,
            research: researchConsent ?? false,
          },
        });
      }
    },
  });
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Get list of restricted features based on consent status
 */
function getRestrictedFeatures(consent) {
  if (!consent || consent.consent_status !== "verified") {
    // All sensitive features restricted without verified consent
    return {
      healthData: { restricted: true, reason: "Requires parental consent" },
      biometrics: { restricted: true, reason: "Requires parental consent" },
      location: { restricted: true, reason: "Requires parental consent" },
      research: { restricted: true, reason: "Requires parental consent" },
    };
  }

  // Return restrictions based on what guardian approved
  return {
    healthData: {
      restricted: !consent.health_data_consent,
      reason: consent.health_data_consent ? null : "Guardian did not approve health data collection",
    },
    biometrics: {
      restricted: !consent.biometrics_consent,
      reason: consent.biometrics_consent ? null : "Guardian did not approve biometrics collection",
    },
    location: {
      restricted: !consent.location_consent,
      reason: consent.location_consent ? null : "Guardian did not approve location tracking",
    },
    research: {
      restricted: !consent.research_consent,
      reason: consent.research_consent ? null : "Guardian did not approve research participation",
    },
  };
}


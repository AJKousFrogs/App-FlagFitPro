// Netlify Function: Resend Email Verification
// Allows users to request a new verification email if they didn't receive the original

const { randomBytes } = require("crypto");
const { db, checkEnvVars } = require("./supabase-client.cjs");
const { validateRequestBody } = require("./validation.cjs");
const { applyRateLimit } = require("./utils/rate-limiter.cjs");
const {
  createSuccessResponse,
  handleServerError,
  logFunctionCall,
  CORS_HEADERS
} = require("./utils/error-handler.cjs");

exports.handler = async (event, context) => {
  logFunctionCall('Auth-Resend-Verification', event);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        error: "Method not allowed",
      }),
    };
  }

  // SECURITY: Apply rate limiting - 3 resend attempts per 15 minutes per IP
  const rateLimitError = applyRateLimit(event, 3, 900000);
  if (rateLimitError) {
    rateLimitError.headers["Access-Control-Allow-Origin"] = "*";
    return rateLimitError;
  }

  try {
    // Check environment variables
    checkEnvVars();

    // Validate request body
    const validation = validateRequestBody(event.body, 'resendVerification');
    if (!validation.valid) {
      return validation.response;
    }

    const { email } = validation.data;

    // Normalize email
    const normalizedEmail = email.toLowerCase();

    // Find user by email
    let user;
    try {
      user = await db.users.findByEmail(normalizedEmail);
    } catch (dbError) {
      console.error("Database error finding user:", dbError);
      return handleServerError(dbError, "Failed to find user");
    }

    // Don't reveal if user exists or not (security best practice)
    // But check if already verified to avoid unnecessary emails
    if (user && user.email_verified) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: true,
          message: "If an account exists with this email and it's not verified, a verification email has been sent.",
          alreadyVerified: true,
        }),
      };
    }

    // If user doesn't exist, return success anyway (don't reveal user existence)
    if (!user) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: true,
          message: "If an account exists with this email and it's not verified, a verification email has been sent.",
        }),
      };
    }

    // Generate new verification token
    const verificationToken = randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // Update user with new verification token
    try {
      await db.users.update(user.id, {
        verification_token: verificationToken,
        verification_token_expires_at: verificationTokenExpires,
      });
    } catch (updateError) {
      console.error("Database error updating verification token:", updateError);
      return handleServerError(updateError, "Failed to update verification token");
    }

    // Send verification email
    try {
      const appUrl = process.env.APP_URL || process.env.URL || "https://webflagfootballfrogs.netlify.app";
      const verificationUrl = `${appUrl}/verify-email.html?token=${verificationToken}`;

      // Determine the base URL for the send-email function
      const baseUrl = event.headers['x-forwarded-proto'] 
        ? `${event.headers['x-forwarded-proto']}://${event.headers.host}`
        : appUrl;
      
      const sendEmailUrl = `${baseUrl}/.netlify/functions/send-email`;

      // Get user's name for email
      const userName = user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.first_name || user.email;

      // Call send-email function
      const emailResponse = await fetch(sendEmailUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "verification",
          to: normalizedEmail,
          name: userName,
          verificationUrl,
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.warn("Failed to send verification email:", errorText);
        // Don't fail the request if email fails - user can try again
      } else {
        console.log("✅ Verification email resent to:", normalizedEmail);
      }
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      // Don't fail the request if email fails - user can try again
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        message: "If an account exists with this email and it's not verified, a verification email has been sent.",
      }),
    };
  } catch (error) {
    console.error("Error in auth-resend-verification function:", error);
    console.error("Error stack:", error.stack);
    return handleServerError(error, 'Auth-Resend-Verification');
  }
};


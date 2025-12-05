// Netlify Function: Email Verification
// Handles email verification token validation and account activation

const { db, checkEnvVars } = require("./supabase-client.cjs");
const jwt = require("jsonwebtoken");
const {
  createSuccessResponse,
  handleServerError,
  logFunctionCall,
  CORS_HEADERS
} = require("./utils/error-handler.cjs");

// JWT_SECRET will be checked at runtime
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("CRITICAL: JWT_SECRET environment variable is not set!");
    throw new Error("JWT_SECRET environment variable is required for security");
  }
  return secret;
};

exports.handler = async (event, context) => {
  logFunctionCall('Auth-Verify-Email', event);

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

  try {
    // Check environment variables
    checkEnvVars();
    
    // Check JWT_SECRET
    const JWT_SECRET = getJWTSecret();

    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: "Invalid request body",
        }),
      };
    }

    const { token } = body;

    if (!token) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: "Verification token is required",
        }),
      };
    }

    // Verify email using token
    let verificationResult;
    try {
      verificationResult = await db.users.verifyEmail(token);
    } catch (verifyError) {
      console.error("Email verification error:", verifyError);
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: verifyError.message || "Invalid or expired verification token",
        }),
      };
    }

    const { user, alreadyVerified } = verificationResult;

    if (alreadyVerified) {
      // User already verified - generate token anyway
      const authToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      const { password: _, verification_token: __, verification_token_expires_at: ___, ...safeUser } = user;

      return createSuccessResponse(
        {
          token: authToken,
          user: safeUser,
          message: "Email already verified",
        },
        200,
        "Email already verified"
      );
    }

    // Generate JWT token for newly verified user
    let authToken;
    try {
      authToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
    } catch (jwtError) {
      console.error("Error generating JWT token:", jwtError);
      return handleServerError(jwtError, "Failed to generate authentication token");
    }

    // Return success response (exclude password and verification token)
    const { password: _, verification_token: __, verification_token_expires_at: ___, ...safeUser } = user;

    return createSuccessResponse(
      {
        token: authToken,
        user: safeUser,
        message: "Email verified successfully",
      },
      200,
      "Email verified successfully"
    );
  } catch (error) {
    console.error("Error in auth-verify-email function:", error);
    console.error("Error stack:", error.stack);
    return handleServerError(error, 'Auth-Verify-Email');
  }
};


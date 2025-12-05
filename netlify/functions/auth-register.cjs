// Netlify Function: User Authentication - Registration
// Handles new user registration with email/password using Supabase

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { randomBytes } = require("crypto");
const { db, checkEnvVars } = require("./supabase-client.cjs");
const { validateRequestBody } = require("./validation.cjs");
const { applyRateLimit } = require("./utils/rate-limiter.cjs");
const { applyCSRFProtection } = require("./utils/csrf-protection.cjs");
const {
  createSuccessResponse,
  handleServerError,
  handleConflictError,
  logFunctionCall,
  CORS_HEADERS
} = require("./utils/error-handler.cjs");

// JWT_SECRET will be checked at runtime, not module load time
// This prevents the function from failing to load if env var is missing
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("CRITICAL: JWT_SECRET environment variable is not set!");
    throw new Error("JWT_SECRET environment variable is required for security");
  }
  return secret;
};

exports.handler = async (event, context) => {
  // Log function call
  logFunctionCall('Auth-Register', event);

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
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        error: "Method not allowed",
      }),
    };
  }

  // SECURITY: Apply rate limiting - 5 registration attempts per 15 minutes
  const rateLimitError = applyRateLimit(event, 5, 900000);
  if (rateLimitError) {
    rateLimitError.headers["Access-Control-Allow-Origin"] = "*";
    return rateLimitError;
  }

  // SECURITY: Apply CSRF protection
  const csrfError = applyCSRFProtection(event);
  if (csrfError) {
    csrfError.headers["Access-Control-Allow-Origin"] = "*";
    return csrfError;
  }

  try {
    // Check environment variables
    checkEnvVars();
    
    // Check JWT_SECRET
    const JWT_SECRET = getJWTSecret();

    // Validate request body
    const validation = validateRequestBody(event.body, 'register');
    if (!validation.valid) {
      return validation.response;
    }

    // Use sanitized data
    const { name, email, password, role } = validation.data;

    // Check if user already exists in database
    const normalizedEmail = email.toLowerCase();
    let existingUser;
    try {
      existingUser = await db.users.findByEmail(normalizedEmail);
    } catch (dbError) {
      console.error("Database error checking existing user:", dbError);
      
      // Provide specific error for connection issues
      if (dbError.code === 'SUPABASE_CONNECTION_ERROR' || dbError.message?.includes('connect to Supabase')) {
        return {
          statusCode: 503,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: false,
            error: "Database connection failed. Please check your Supabase configuration.",
            errorType: "database_error",
            details: dbError.message,
          }),
        };
      }
      
      return handleServerError(dbError, "Failed to check user existence");
    }

    if (existingUser) {
      return handleConflictError("User with this email already exists");
    }

    // Hash password
    let hashedPassword;
    try {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    } catch (bcryptError) {
      console.error("Error hashing password:", bcryptError);
      return handleServerError(bcryptError, "Failed to process password");
    }

    // Generate email verification token
    const verificationToken = randomBytes(32).toString("hex");

    // Create new user in database (email_verified defaults to false)
    let newUser;
    try {
      // Try to create user with verification fields first
      const userData = {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "player",
        email_verified: false,
        verification_token: verificationToken,
        verification_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      };

      newUser = await db.users.create(userData);
    } catch (dbError) {
      console.error("Database error creating user:", dbError);
      console.error("Database error details:", {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint,
      });
      
      // If verification columns don't exist, try without them
      if (dbError.code === '42703' && (dbError.message?.includes('verification_token') || dbError.message?.includes('verification_token_expires_at'))) {
        console.warn("Verification columns not found, creating user without verification fields");
        try {
          newUser = await db.users.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "player",
            email_verified: false,
          });
          console.log("User created successfully without verification fields");
        } catch (retryError) {
          console.error("Failed to create user even without verification fields:", retryError);
          // Fall through to error handling below
          throw retryError;
        }
      } else if (dbError.code === '23505') {
        // Unique constraint violation
        return handleConflictError("User with this email already exists");
      } else if (dbError.code === '23502') {
        // Not null constraint violation
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: false,
            error: "Missing required fields. Please check your registration data.",
            errorType: "validation_error",
            details: dbError.message,
          }),
        };
      } else {
        // Re-throw to be handled by outer catch
        throw dbError;
      }
    }

    // Send verification email
    try {
      const appUrl = process.env.APP_URL || process.env.URL || "https://webflagfootballfrogs.netlify.app";
      const verificationUrl = `${appUrl}/verify-email.html?token=${verificationToken}`;

      // Determine the base URL for the send-email function
      // In Netlify Functions, we can use the event's request context
      const baseUrl = event.headers['x-forwarded-proto'] 
        ? `${event.headers['x-forwarded-proto']}://${event.headers.host}`
        : appUrl;
      
      const sendEmailUrl = `${baseUrl}/.netlify/functions/send-email`;

      // Call send-email function
      const emailResponse = await fetch(sendEmailUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "verification",
          to: normalizedEmail,
          name: name.trim(),
          verificationUrl,
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.warn("Failed to send verification email, but user was created:", errorText);
        // Don't fail registration if email fails - user can request resend
      } else {
        console.log("✅ Verification email sent to:", normalizedEmail);
      }
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      // Don't fail registration if email fails - user can request resend
    }

    // Return success response (exclude password and verification token)
    const { password: _, verification_token: __, verification_token_expires_at: ___, ...safeUser } = newUser;

    return createSuccessResponse(
      { 
        user: safeUser,
        message: "Account created successfully. Please check your email to verify your account.",
        requiresVerification: true
      },
      201,
      "Account created successfully. Please verify your email."
    );
  } catch (error) {
    console.error("Error in auth-register function:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    return handleServerError(error, 'Auth-Register');
  }
};
